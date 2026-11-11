/**
 * Integration check for the two-pass LLM pipeline against a local fake server.
 * No API key and no network access are needed.
 *
 *   npm run smoke:llm
 */
import { createServer } from "node:http";
import { criteriaForScenario } from "../content/rubric";
import { getScenario } from "../content/scenarios";
import { scoreSubmission } from "../lib/scoring";
import type { Transcript } from "../lib/scoring/types";
import { findQuote } from "../lib/scoring/verify";

const scenario = getScenario("adaeze-fabrics")!;
const criteria = criteriaForScenario(scenario.slug);

const chatText =
  "Adaeze, should we pay Kano part of the invoice today? I can confirm the stock before 12.";
const taskText =
  "I would offer Mrs Bello 10% off, which is ₦100,000, and keep the other ₦100,000 as a credit for her next order. I would pay Kano Textiles ₦150,000 today to restart supply, because we only have 12 blue rolls and rent of ₦120,000 is due Friday. That leaves cash for the 2pm delivery, so we keep the customer and protect the rent.";
const taskQuote =
  "I would pay Kano Textiles ₦150,000 today to restart supply, because we only have 12 blue rolls and rent of ₦120,000 is due Friday.";

const transcript: Transcript = {
  studentName: "smoke_student",
  taskId: "task",
  messages: [
    {
      id: "chat-1",
      role: "student",
      speaker: "smoke_student",
      text: chatText,
      createdAt: "2026-11-11T09:00:00.000Z",
    },
    {
      id: "task",
      role: "student",
      speaker: "smoke_student",
      text: taskText,
      createdAt: "2026-11-11T09:20:00.000Z",
    },
  ],
};

const readingPayload = {
  readings: [
    {
      message_id: "chat-1",
      language: "english",
      intent: "Ask the owner about paying the supplier.",
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

const scoringPayload = {
  scores: criteria.map((criterion) => ({
    criterion: criterion.id,
    level: "foundation",
    confidence: 0.6,
    evidence: { message_id: "task", quote: taskQuote },
    counter_evidence: null,
    reason: "The quoted evidence supports this level.",
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

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`ok - ${message}`);
}

async function main() {
  const requestBodies: string[] = [];

  const server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      requestBodies.push(body);
      const isReading = body.includes("Reading pass of SabiLab");
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          model: isReading ? "fake-reading-model" : "fake-scoring-model",
          choices: [
            {
              message: {
                content: JSON.stringify(
                  isReading ? readingPayload : scoringPayload,
                ),
              },
            },
          ],
          usage: { prompt_tokens: isReading ? 200 : 500, completion_tokens: 100 },
        }),
      );
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not bind the fake model server");
  }

  process.env.SABILAB_LLM_PROVIDER = "openai";
  process.env.SABILAB_LLM_API_KEY = "local-test-key";
  process.env.SABILAB_LLM_MODEL = "fake-llm";
  process.env.SABILAB_LLM_BASE_URL = `http://127.0.0.1:${address.port}/v1`;
  delete process.env.SABILAB_LLM_READING_MODEL;
  delete process.env.SABILAB_LLM_SCORING_MODEL;

  try {
    const scored = await scoreSubmission(scenario, transcript);

    assert(scored.meta.engine === "llm", "configured engine is the LLM");
    assert(
      scored.meta.model === "fake-scoring-model",
      "the scoring model is recorded",
    );
    assert(scored.meta.rubricVersion === "0.2", "rubric v0.2 is recorded");
    assert(
      scored.result.summary.criteria?.length === 15,
      "fifteen criteria are returned",
    );
    assert(
      scored.result.criteria.length === 4,
      "four dimension levels are aggregated",
    );
    assert(
      scored.result.summary.criteria?.every(
        (criterion) =>
          criterion.level === "insufficient_evidence" ||
          (criterion.verified &&
            findQuote(
              transcript.messages.find((m) => m.id === "task")!.text,
              criterion.quote!,
            )),
      ),
      "every awarded criterion has a verified quote",
    );
    assert(
      scored.result.criteria.every(
        (criterion) => criterion.level === "foundation",
      ),
      "all-foundation criteria aggregate to Foundation",
    );
    assert(
      scored.result.summary.figures.includes(150_000),
      "answer-key figures are checked by code",
    );
    assert(
      scored.result.summary.usage?.inputTokens === 700,
      "usage from both passes is combined",
    );
    assert(
      requestBodies.length === 2,
      "one reading call and one scoring call",
    );
    assert(
      requestBodies[0]?.includes("Reading pass of SabiLab"),
      "the first call is the reading pass",
    );
    assert(
      requestBodies[1]?.includes("C1 Clarity") &&
        requestBodies[1]?.includes("I would pay Kano Textiles"),
      "the scoring call carries the rubric and the transcript",
    );
    assert(
      requestBodies.every((body) => !body.includes("local-test-key")),
      "the API key is not written into a request body",
    );
    assert(
      scored.result.summary.label.includes("rubric v0.2 (draft)"),
      "the draft rubric is labelled honestly",
    );
    assert(
      scored.result.summary.feedback?.strengthQuote === taskQuote,
      "feedback keeps a verified strength quote",
    );
  } finally {
    server.close();
  }

  console.log("\nLLM pipeline smoke test passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
