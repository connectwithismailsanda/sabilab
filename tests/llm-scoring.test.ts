import { afterEach, describe, expect, it, vi } from "vitest";
import { criteriaForScenario } from "@/content/rubric";
import { getScenario, type Level } from "@/content/scenarios";
import { scoreSubmission } from "@/lib/scoring";
import {
  auditScoringResponse,
  parseReadings,
  scoreWithLlm,
  type ReadingsResult,
} from "@/lib/scoring/llm";
import { findQuote } from "@/lib/scoring/verify";
import type {
  JsonCompleter,
  JsonCompletionRequest,
} from "@/lib/llm/client";
import type { Transcript } from "@/lib/scoring/types";

vi.mock("@/lib/llm/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm/client")>();
  return {
    ...actual,
    completeJson: async () => {
      throw new Error("network down");
    },
  };
});

const scenario = getScenario("adaeze-fabrics")!;
const criteria = criteriaForScenario(scenario.slug);

const taskText =
  "I would offer Mrs Bello 10% off, which is ₦100,000, and keep the other ₦100,000 as a credit for her next order. I would pay Kano Textiles ₦150,000 today to restart supply, because we only have 12 blue rolls and rent of ₦120,000 is due Friday. That leaves cash for the 2pm delivery, so we keep the customer and protect the rent.";

const chatText =
  "Adaeze, should we pay Kano part of the invoice today? I can confirm the stock before 12.";

const taskQuote =
  "I would pay Kano Textiles ₦150,000 today to restart supply, because we only have 12 blue rolls and rent of ₦120,000 is due Friday.";

const transcript: Transcript = {
  studentName: "adaeze_test",
  taskId: "task",
  messages: [
    {
      id: "chat-1",
      role: "student",
      speaker: "adaeze_test",
      text: chatText,
      createdAt: "2026-11-11T09:00:00.000Z",
    },
    {
      id: "owner-1",
      role: "owner",
      speaker: "Adaeze",
      text: "Sort it out between you.",
      createdAt: "2026-11-11T09:01:00.000Z",
    },
    {
      id: "task",
      role: "student",
      speaker: "adaeze_test",
      text: taskText,
      createdAt: "2026-11-11T09:20:00.000Z",
    },
  ],
};

type ScoreOverride = {
  level?: string;
  confidence?: number;
  evidence?: { message_id: string; quote: string } | null;
  reason?: string;
};

function scoringResponse(
  overrides: Record<string, ScoreOverride> = {},
): Record<string, unknown> {
  return {
    scores: criteria.map((criterion) => ({
      criterion: criterion.id,
      level: "foundation",
      confidence: 0.6,
      evidence: { message_id: "task", quote: taskQuote },
      counter_evidence: null,
      reason: "The quoted evidence supports this level.",
      ...overrides[criterion.id],
    })),
    feedback: {
      strength: {
        message_id: "task",
        quote: taskQuote,
        note: "You name the supplier and commit to a payment.",
      },
      improvement: "Say who owns the 2pm delivery.",
      rewrite:
        "I would offer Mrs Bello 10% off and pay Kano Textiles ₦150,000 today.",
    },
    flags: {
      possible_injection: false,
      severe_tone: false,
      needs_human_review: false,
      review_reason: null,
    },
  };
}

function readings(overrides: Partial<ReadingsResult> = {}): ReadingsResult {
  return {
    entries: [
      {
        messageId: "chat-1",
        language: "english",
        clarity: "clear",
        toneFlags: [],
      },
      {
        messageId: "task",
        language: "english",
        clarity: "clear",
        toneFlags: [],
      },
    ],
    clarifications: [],
    possibleInjection: false,
    severeTone: false,
    ...overrides,
  };
}

/** Raw reading-pass payload, as the model would return it. */
function readingResponse(): Record<string, unknown> {
  return {
    readings: [
      {
        message_id: "chat-1",
        language: "english",
        intent: "Ask about paying the supplier.",
        clarity: "clear",
        ambiguity: [],
        tone: "neutral",
        tone_flags: [],
        positive_markers: [],
        register_fit: "fits",
      },
      {
        message_id: "task",
        language: "english",
        intent: "Recommend a discount and a supplier payment.",
        clarity: "clear",
        ambiguity: [],
        tone: "neutral",
        tone_flags: [],
        positive_markers: [],
        register_fit: "fits",
      },
    ],
    clarification_requests: [],
    flags: { possible_injection: false, severe_tone: false },
  };
}

function fakeComplete(
  handler: (request: JsonCompletionRequest) => unknown,
): JsonCompleter {
  return async (request) => ({
    json: handler(request),
    model: "test-model",
    usage: { inputTokens: 20, outputTokens: 10 },
  });
}

function detail(
  result: ReturnType<typeof auditScoringResponse>["result"],
  id: string,
) {
  const found = result.summary.criteria?.find((item) => item.id === id);
  if (!found) throw new Error(`No criterion ${id}`);
  return found;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("rubric response verification", () => {
  it("keeps fifteen criteria and four dimension levels", () => {
    const { result, failures } = auditScoringResponse(
      scenario,
      transcript,
      scoringResponse(),
      readings(),
    );

    expect(failures).toBe(0);
    expect(result.summary.criteria).toHaveLength(15);
    expect(result.criteria).toHaveLength(4);
    expect(result.criteria.every((item) => item.level === "foundation")).toBe(
      true,
    );

    for (const item of result.summary.criteria ?? []) {
      if (item.quote) {
        const message = transcript.messages.find(
          (entry) => entry.id === "task",
        )!;
        expect(findQuote(message.text, item.quote)).not.toBeNull();
      }
    }
  });

  it("drops a criterion when the cited quote is not in that message", () => {
    const { result, failures } = auditScoringResponse(
      scenario,
      transcript,
      scoringResponse({
        C1: {
          evidence: { message_id: "task", quote: "Not in the answer at all" },
        },
      }),
      readings(),
    );

    expect(failures).toBe(1);
    expect(detail(result, "C1").level).toBe("insufficient_evidence");
    // Communication still has three supported criteria, so the dimension stands.
    expect(
      result.criteria.find((item) => item.dimension === "communication")?.level,
    ).toBe("foundation");
  });

  it("rejects a quote attributed to another speaker", () => {
    const { result, failures } = auditScoringResponse(
      scenario,
      transcript,
      scoringResponse({
        C1: {
          evidence: {
            message_id: "owner-1",
            quote: "Sort it out between you.",
          },
        },
      }),
      readings(),
    );

    expect(failures).toBe(1);
    expect(detail(result, "C1").level).toBe("insufficient_evidence");
  });

  it("caps a model that tries to go above Proficient", () => {
    const { result } = auditScoringResponse(
      scenario,
      transcript,
      scoringResponse({ C1: { level: "advanced" } }),
      readings(),
    );

    expect(detail(result, "C1").level).toBe("proficient");
  });

  it("applies the Clarity cap to the Communication dimension", () => {
    const allProficient = Object.fromEntries(
      criteria.map((criterion) => [criterion.id, { level: "proficient" }]),
    );
    allProficient.C1 = { level: "needs_practice" };

    const { result } = auditScoringResponse(
      scenario,
      transcript,
      scoringResponse(allProficient),
      readings(),
    );

    const communication = result.criteria.find(
      (item) => item.dimension === "communication",
    )!;
    // Second-lowest would be Proficient; C1 at Needs practice caps it.
    expect(communication.level).toBe("foundation");
    expect(communication.rationale).toContain("caps this dimension");
  });

  it("marks a dimension insufficient when more than half its criteria lack evidence", () => {
    const { result } = auditScoringResponse(
      scenario,
      transcript,
      scoringResponse({
        L1: { evidence: null },
        L2: { evidence: null },
        L3: { evidence: null },
        L4: { level: "proficient" },
      }),
      readings(),
    );

    expect(
      result.criteria.find((item) => item.dimension === "leadership")?.level,
    ).toBe("insufficient_evidence");
  });

  it("keeps a dimension when exactly half its criteria lack evidence", () => {
    const { result } = auditScoringResponse(
      scenario,
      transcript,
      scoringResponse({
        C1: { evidence: null },
        C2: { evidence: null },
        C3: { level: "proficient" },
        C4: { level: "proficient" },
      }),
      readings(),
    );

    expect(
      result.criteria.find((item) => item.dimension === "communication")?.level,
    ).toBe("proficient");
  });

  it("replaces a reason that invents a figure", () => {
    const { result } = auditScoringResponse(
      scenario,
      transcript,
      scoringResponse({
        C1: { reason: "Pay ₦250,000 now and keep the rest." },
      }),
      readings(),
    );

    expect(detail(result, "C1").reason).not.toContain("250,000");
  });

  it("drops a feedback rewrite that invents a figure", () => {
    const response = scoringResponse();
    const feedback = response.feedback as {
      rewrite: string;
    };
    feedback.rewrite = "Pay ₦999,999 today.";

    const { result } = auditScoringResponse(
      scenario,
      transcript,
      response,
      readings(),
    );

    expect(result.summary.feedback?.rewrite).toBeNull();
  });

  it("keeps a verified tone flag and never changes another criterion", () => {
    const { result } = auditScoringResponse(
      scenario,
      transcript,
      scoringResponse(),
      readings({
        entries: [
          {
            messageId: "task",
            language: "english",
            clarity: "clear",
            toneFlags: [
              {
                quote: "I would pay Kano Textiles ₦150,000 today",
                reason: "It is direct.",
              },
            ],
          },
        ],
        severeTone: true,
      }),
    );

    expect(result.summary.flags).toHaveLength(1);
    expect(result.summary.flags[0]?.note).toContain("C3");
    expect(result.criteria.every((item) => item.level === "foundation")).toBe(
      true,
    );
    expect(result.needsReview).toBe(true);
  });

  it("flags a possible prompt injection for review", () => {
    const { result } = auditScoringResponse(
      scenario,
      transcript,
      scoringResponse(),
      readings({ possibleInjection: true }),
    );

    expect(result.summary.possibleInjection).toBe(true);
    expect(result.needsReview).toBe(true);
  });
});

describe("reading pass parsing", () => {
  it("keeps only tone flags whose quote exists in that message", () => {
    const parsed = parseReadings(
      {
        readings: [
          {
            message_id: "task",
            language: "english",
            clarity: "clear",
            tone_flags: [
              { quote: "I would pay Kano Textiles ₦150,000 today", reason: "Direct." },
              { quote: "A sentence this student never wrote", reason: "Bad." },
            ],
          },
        ],
        clarification_requests: [],
        flags: { possible_injection: false, severe_tone: false },
      },
      transcript,
    );

    expect(parsed.entries[0]?.toneFlags).toHaveLength(1);
  });

  it("rejects a reading pass with no readings", () => {
    expect(() =>
      parseReadings({ readings: [] }, transcript),
    ).toThrow();
  });
});

describe("two-pass scoring", () => {
  it("asks for a clarification and does not score a non-English task", async () => {
    let calls = 0;
    const complete = fakeComplete((request) => {
      calls += 1;
      if (request.system.includes("Reading pass")) {
        return {
          readings: [
            {
              message_id: "task",
              language: "non_english",
              clarity: "unclear",
              tone_flags: [],
            },
          ],
          clarification_requests: [],
          flags: { possible_injection: false, severe_tone: false },
        };
      }
      throw new Error("Scoring pass should not run");
    });

    const scored = await scoreWithLlm(scenario, transcript, complete);

    expect(calls).toBe(1);
    expect(scored.result.summary.needsClarification).toBe(true);
    expect(scored.result.summary.clarifyingQuestions).toHaveLength(1);
    expect(
      scored.result.criteria.every(
        (criterion) => criterion.level === "insufficient_evidence",
      ),
    ).toBe(true);
  });

  it("passes a clarification request through without scoring", async () => {
    const complete = fakeComplete((request) => {
      if (request.system.includes("Reading pass")) {
        return {
          readings: [
            {
              message_id: "task",
              language: "english",
              clarity: "unclear",
              tone_flags: [],
            },
          ],
          clarification_requests: [
            {
              message_id: "task",
              question: "What exactly do you need from Kano, and by when?",
            },
          ],
          flags: { possible_injection: false, severe_tone: false },
        };
      }
      throw new Error("Scoring pass should not run");
    });

    const scored = await scoreWithLlm(scenario, transcript, complete);
    expect(scored.result.summary.clarifyingQuestions?.[0]).toContain("Kano");
  });

  it("retries the scoring pass when a quote fails verification", async () => {
    let scoringCalls = 0;
    const complete = fakeComplete((request) => {
      if (request.system.includes("Reading pass")) return readingResponse();
      scoringCalls += 1;
      if (scoringCalls === 1) {
        return scoringResponse({
          C1: {
            evidence: { message_id: "task", quote: "An invented sentence" },
          },
        });
      }
      return scoringResponse();
    });

    const scored = await scoreWithLlm(scenario, transcript, complete);

    expect(scoringCalls).toBe(2);
    expect(
      scored.result.summary.criteria?.find((item) => item.id === "C1")?.level,
    ).toBe("foundation");
  });

  it("records combined usage and the rubric version", async () => {
    const complete = fakeComplete((request) =>
      request.system.includes("Reading pass")
        ? readingResponse()
        : scoringResponse(),
    );

    const scored = await scoreWithLlm(scenario, transcript, complete);

    expect(scored.meta.engine).toBe("llm");
    expect(scored.meta.rubricVersion).toBe("0.2");
    expect(scored.result.summary.rubricStatus).toBe("draft");
    expect(scored.result.summary.usage).toEqual({
      inputTokens: 40,
      outputTokens: 20,
    });
  });
});

describe("engine selection", () => {
  it("uses the rule scorer when no key is configured and says so", async () => {
    vi.stubEnv("SABILAB_LLM_API_KEY", "");
    vi.stubEnv("SABILAB_LLM_MODEL", "");

    const scored = await scoreSubmission(scenario, transcript);
    expect(scored.meta.engine).toBe("rule-based");
    expect(scored.meta.fallbackReason).toBe("llm_not_configured");
    expect(scored.result.summary.label).toContain("No AI scorer is configured");
    expect(scored.result.summary.rubricStatus).toBe("stub");
  });

  it("falls back visibly when the configured model fails twice", async () => {
    vi.stubEnv("SABILAB_LLM_API_KEY", "test-key");
    vi.stubEnv("SABILAB_LLM_MODEL", "test-model");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const scored = await scoreSubmission(scenario, transcript);

    expect(errorSpy).toHaveBeenCalled();
    expect(scored.meta.engine).toBe("rule-based");
    expect(scored.meta.model).toBe("rule-based-stub");
    expect(scored.result.summary.engine).toBe("rule-based");
    expect(scored.result.summary.label).toContain("unavailable");
    expect(scored.result.criteria.map((item) => item.level as Level)).toContain(
      "proficient",
    );
  });
});
