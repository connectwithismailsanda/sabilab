import {
  criteriaForDimension,
  criteriaForScenario,
  criterionName,
  rubric,
} from "@/content/rubric";
import {
  levelLabels,
  type Dimension,
  type Level,
  type Scenario,
} from "@/content/scenarios";
import { completeJson, type JsonCompleter } from "@/lib/llm/client";
import {
  buildReadingPrompt,
  buildScoringPrompt,
  PROMPT_VERSION,
  READING_SYSTEM_PROMPT,
  SCORING_SYSTEM_PROMPT,
} from "@/prompts/scoring.v0.2";
import { aggregateDimension } from "./aggregate";
import { scenarioChecks, verifiedKeyFigures } from "./checks";
import {
  DIMENSIONS,
  LEVEL_RANK,
  type CriterionDetail,
  type CriterionResult,
  type FeedbackDetail,
  type Flag,
  type ScoreResult,
  type ScoredSubmission,
  type Transcript,
  type TranscriptMessage,
  type Usage,
} from "./types";
import { findQuote, numbersIn } from "./verify";

/**
 * Rubric v0.2 implementation.
 *
 * Two passes: a reading pass (no scores) and a scoring pass that returns one
 * level per criterion. Every citation is checked against the exact student
 * message it names. Dimension levels are aggregated in code, not by the model.
 */

const ABOVE_CEILING = new Set([
  "advanced",
  "expert",
  "excellent",
  "outstanding",
  "exceptional",
  "distinguished",
  "mastery",
  "master",
  "strong",
]);

export type ReadingEntry = {
  messageId: string;
  language: "english" | "non_english";
  clarity: "clear" | "partly_clear" | "unclear";
  toneFlags: { quote: string; reason: string }[];
};

export type ReadingsResult = {
  entries: ReadingEntry[];
  clarifications: { messageId: string; question: string }[];
  possibleInjection: boolean;
  severeTone: boolean;
};

type Citation = {
  messageId: string;
  quote: string;
  start: number;
  end: number;
};

type AuditResult = {
  result: ScoreResult;
  failures: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseLevel(raw: unknown): Level {
  const value =
    typeof raw === "string"
      ? raw.trim().toLowerCase().replace(/[\s-]+/g, "_")
      : "";
  if (value === "proficient") return "proficient";
  if (value === "foundation") return "foundation";
  if (value === "needs_practice") return "needs_practice";
  if (value === "insufficient_evidence") return "insufficient_evidence";
  if (ABOVE_CEILING.has(value)) return "proficient";
  return "insufficient_evidence";
}

function messageIndex(transcript: Transcript): Map<string, TranscriptMessage> {
  return new Map(transcript.messages.map((message) => [message.id, message]));
}

function studentText(transcript: Transcript): string {
  return transcript.messages
    .filter((message) => message.role === "student")
    .map((message) => message.text)
    .join("\n");
}

function verifyCitation(
  transcript: Transcript,
  index: Map<string, TranscriptMessage>,
  raw: unknown,
): Citation | null {
  const record = asRecord(raw);
  const messageId = asString(record?.message_id);
  const quote = asString(record?.quote);
  if (!messageId || !quote) return null;

  const message = index.get(messageId);
  if (!message || message.role !== "student") return null;

  const found = findQuote(message.text, quote);
  if (!found) return null;

  return { messageId, quote, start: found.start, end: found.end };
}

function allowedFigures(transcript: Transcript, scenario: Scenario): Set<number> {
  const checks = scenarioChecks(scenario);
  return new Set<number>([...numbersIn(studentText(transcript)), ...checks.allowedFigures]);
}

function sanitiseText(
  raw: unknown,
  allowed: Set<number>,
  fallback: string,
  maxLength = 400,
): string {
  const text = asString(raw);
  if (!text) return fallback;

  const cleaned = text.replace(/\s+/g, " ").slice(0, maxLength);
  const invented = numbersIn(cleaned).find((value) => !allowed.has(value));

  return invented === undefined ? cleaned : fallback;
}

function toneFlagsFrom(
  readings: ReadingsResult,
  transcript: Transcript,
): Flag[] {
  const index = messageIndex(transcript);
  const seen = new Set<string>();
  const flags: Flag[] = [];

  for (const entry of readings.entries) {
    const message = index.get(entry.messageId);
    if (!message) continue;

    for (const flag of entry.toneFlags) {
      if (!findQuote(message.text, flag.quote)) continue;
      if (seen.has(flag.quote)) continue;
      seen.add(flag.quote);
      flags.push({
        type: "tone",
        quote: flag.quote,
        note: `${flag.reason} Tone affects only Professional tone (C3); it never lowers another criterion.`,
      });
    }
  }

  return flags.slice(0, 3);
}

export function parseReadings(
  raw: unknown,
  transcript: Transcript,
): ReadingsResult {
  const root = asRecord(raw);
  if (!root) throw new Error("Reading pass returned no object");

  const rawReadings = root.readings;
  if (!Array.isArray(rawReadings) || rawReadings.length === 0) {
    throw new Error("Reading pass returned no readings");
  }

  const index = messageIndex(transcript);
  const entries: ReadingEntry[] = [];

  for (const item of rawReadings) {
    const record = asRecord(item);
    const messageId = asString(record?.message_id);
    const message = messageId ? index.get(messageId) : undefined;
    if (!record || !message || message.role !== "student") continue;

    const rawFlags = Array.isArray(record.tone_flags)
      ? record.tone_flags
      : [];
    const toneFlags: { quote: string; reason: string }[] = [];

    for (const rawFlag of rawFlags) {
      const flag = asRecord(rawFlag);
      const quote = asString(flag?.quote);
      if (!quote || !findQuote(message.text, quote)) continue;
      toneFlags.push({
        quote,
        reason: asString(flag?.reason) ?? "This may read as sharp.",
      });
    }

    const language =
      asString(record.language)?.toLowerCase() === "english"
        ? "english"
        : "non_english";
    const rawClarity = asString(record.clarity)?.toLowerCase();
    const clarity =
      rawClarity === "clear"
        ? "clear"
        : rawClarity === "partly_clear"
          ? "partly_clear"
          : rawClarity === "unclear"
            ? "unclear"
            : "clear";

    entries.push({ messageId: message.id, language, clarity, toneFlags });
  }

  if (entries.length === 0) {
    throw new Error("No reading matched a student message");
  }

  const rawClarifications = Array.isArray(root.clarification_requests)
    ? root.clarification_requests
    : [];
  const clarifications: { messageId: string; question: string }[] = [];

  for (const item of rawClarifications) {
    const record = asRecord(item);
    const messageId = asString(record?.message_id);
    const question = asString(record?.question);
    if (!messageId || !question) continue;
    if (index.get(messageId)?.role !== "student") continue;
    clarifications.push({ messageId, question: question.slice(0, 280) });
    if (clarifications.length >= rubric.rules.maxClarifyingQuestions) break;
  }

  const flags = asRecord(root.flags);

  return {
    entries,
    clarifications,
    possibleInjection: flags?.possible_injection === true,
    severeTone: flags?.severe_tone === true,
  };
}

function clarificationQuestions(
  transcript: Transcript,
  readings: ReadingsResult,
): string[] | null {
  const taskReading = readings.entries.find(
    (entry) => entry.messageId === transcript.taskId,
  );
  const taskRequest = readings.clarifications.find(
    (request) => request.messageId === transcript.taskId,
  );

  if (taskReading?.language === "non_english") {
    return [
      "Please rewrite your answer in English so we can score the content. Spelling and grammar are not scored, so this is only about language.",
      ...(taskRequest ? [taskRequest.question] : []),
    ].slice(0, rubric.rules.maxClarifyingQuestions);
  }

  if (taskRequest) {
    return [taskRequest.question];
  }

  if (taskReading?.clarity === "unclear") {
    return [
      "What exactly do you mean here, and what should happen next?",
    ];
  }

  return null;
}

function insufficientDetail(
  id: string,
  name: string,
  dimension: Dimension,
  reason: string,
): CriterionDetail {
  return {
    id,
    name,
    dimension,
    level: "insufficient_evidence",
    quote: null,
    reason,
    confidence: 0.2,
    verified: false,
    counterEvidence: null,
  };
}

function clarificationResult(
  scenario: Scenario,
  transcript: Transcript,
  questions: string[],
  readings: ReadingsResult,
): ScoreResult {
  const criteria: CriterionResult[] = DIMENSIONS.map((dimension) => ({
    dimension,
    level: "insufficient_evidence" as Level,
    quote: null,
    rationale:
      "Not scored yet. The reading pass asked one quick question first so the score is based on what you actually meant.",
    confidence: 0.15,
    verified: false,
    startOffset: null,
    endOffset: null,
  }));

  return {
    criteria,
    overallConfidence: 0.15,
    needsReview: false,
    summary: {
      strengths: [],
      improvements: [],
      flags: toneFlagsFrom(readings, transcript),
      engine: "llm",
      label:
        "Not scored yet. The reading pass asked for one clarification before scoring, so no level has been awarded.",
      needsClarification: true,
      clarifyingQuestions: questions.slice(
        0,
        rubric.rules.maxClarifyingQuestions,
      ),
      figures: verifiedKeyFigures(scenario, studentText(transcript)),
      rubricStatus: rubric.status,
      criteria: [],
      possibleInjection: readings.possibleInjection,
    },
  };
}

export function auditScoringResponse(
  scenario: Scenario,
  transcript: Transcript,
  raw: unknown,
  readings: ReadingsResult,
): AuditResult {
  const root = asRecord(raw);
  if (!root) throw new Error("Scoring pass returned no object");

  const rawScores = root.scores;
  if (!Array.isArray(rawScores) || rawScores.length === 0) {
    throw new Error("Scoring pass returned no scores");
  }

  const index = messageIndex(transcript);
  const allowed = allowedFigures(transcript, scenario);
  const byCriterion = new Map<string, Record<string, unknown>>();

  for (const item of rawScores) {
    const record = asRecord(item);
    const id = asString(record?.criterion);
    if (record && id && !byCriterion.has(id)) {
      byCriterion.set(id, record);
    }
  }

  let failures = 0;
  const details: CriterionDetail[] = criteriaForScenario(scenario.slug).map(
    (criterion) => {
      const entry = byCriterion.get(criterion.id);
      if (!entry) {
        failures += 1;
        return insufficientDetail(
          criterion.id,
          criterion.name,
          criterion.dimension,
          "The scorer did not return this criterion, so no level was awarded.",
        );
      }

      const level = parseLevel(entry.level);
      const evidence = verifyCitation(transcript, index, entry.evidence);
      const counter = verifyCitation(
        transcript,
        index,
        entry.counter_evidence,
      );

      if (entry.counter_evidence && !counter) {
        failures += 1;
      }

      if (level === "insufficient_evidence") {
        return {
          ...insufficientDetail(
            criterion.id,
            criterion.name,
            criterion.dimension,
            sanitiseText(
              entry.reason,
              allowed,
              "There was not enough evidence for this criterion.",
            ),
          ),
          counterEvidence: counter?.quote ?? null,
        };
      }

      if (!evidence) {
        failures += 1;
        return insufficientDetail(
          criterion.id,
          criterion.name,
          criterion.dimension,
          "We could not verify a quote from your own message for this criterion, so no level was awarded. The check is against your words, not a judgement on you.",
        );
      }

      const confidence = Math.min(
        0.85,
        Math.max(0.35, asNumber(entry.confidence) ?? 0.55),
      );

      return {
        id: criterion.id,
        name: criterion.name,
        dimension: criterion.dimension,
        level,
        quote: evidence.quote,
        reason: sanitiseText(
          entry.reason,
          allowed,
          "This level is based on the quoted evidence.",
        ),
        confidence: Number(confidence.toFixed(2)),
        verified: true,
        counterEvidence: counter?.quote ?? null,
      };
    },
  );

  const dimensionResults: CriterionResult[] = DIMENSIONS.map((dimension) => {
    const inDimension = details.filter(
      (detail) => detail.dimension === dimension,
    );
    const aggregate = aggregateDimension(inDimension);
    const supported = inDimension
      .filter((detail) => detail.level !== "insufficient_evidence")
      .sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level]);

    if (aggregate.majorityInsufficient) {
      return {
        dimension,
        level: "insufficient_evidence",
        quote: null,
        rationale:
          "More than half of the criteria in this dimension have insufficient evidence, so the rubric does not award a dimension level.",
        confidence: 0.15,
        verified: false,
        startOffset: null,
        endOffset: null,
      };
    }

    let determining = supported[1] ?? supported[0];
    if (aggregate.clarityCapped) {
      determining =
        inDimension.find((detail) => detail.id === "C1") ?? determining;
    }

    const confidence = Number(
      (
        supported.reduce((total, detail) => total + detail.confidence, 0) /
        supported.length
      ).toFixed(2),
    );

    const rationale = aggregate.clarityCapped
      ? `The second-lowest criterion would give ${levelLabels[aggregate.level]}, but ${criterionName("C1", scenario.slug)} is Needs practice, so the rubric caps this dimension at Foundation.`
      : `${criterionName(determining.id, scenario.slug)} is ${levelLabels[determining.level]}. The rubric takes the second-lowest criterion, so this dimension is ${levelLabels[aggregate.level]}.`;

    return {
      dimension,
      level: aggregate.level,
      quote: determining.quote,
      rationale,
      confidence: aggregate.level === "insufficient_evidence" ? 0.15 : confidence,
      verified: Boolean(determining.verified && determining.quote),
      startOffset: null,
      endOffset: null,
    };
  });

  const overallConfidence = Number(
    (
      dimensionResults.reduce(
        (total, criterion) => total + criterion.confidence,
        0,
      ) / dimensionResults.length
    ).toFixed(2),
  );

  const strengths = dimensionResults
    .filter(
      (criterion) =>
        LEVEL_RANK[criterion.level] >= LEVEL_RANK.foundation,
    )
    .map((criterion) => criterion.dimension);

  const improvements = dimensionResults
    .filter(
      (criterion) => LEVEL_RANK[criterion.level] < LEVEL_RANK.foundation,
    )
    .sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level])
    .map((criterion) => criterion.dimension);

  const scoringFlags = asRecord(root.flags);
  const possibleInjection =
    readings.possibleInjection || scoringFlags?.possible_injection === true;
  const severeTone =
    readings.severeTone || scoringFlags?.severe_tone === true;

  const rawFeedback = asRecord(root.feedback);
  const rawStrength = asRecord(rawFeedback?.strength);
  const strengthCitation = rawStrength
    ? verifyCitation(transcript, index, rawStrength)
    : null;

  let strengthQuote = strengthCitation?.quote ?? null;
  let strengthNote = sanitiseText(
    rawStrength?.note,
    allowed,
    "",
    280,
  );

  if (!strengthQuote) {
    const fallback = details.find(
      (detail) =>
        LEVEL_RANK[detail.level] >= LEVEL_RANK.foundation && detail.quote,
    );
    if (fallback) {
      strengthQuote = fallback.quote;
      strengthNote = strengthNote || "This is the clearest evidence in your answer.";
    }
  }

  const improvement = sanitiseText(rawFeedback?.improvement, allowed, "", 500);
  const rewrite = sanitiseText(rawFeedback?.rewrite, allowed, "", 600);

  const feedback: FeedbackDetail = {
    strengthQuote,
    strengthNote: strengthQuote ? strengthNote || null : null,
    improvement: improvement || null,
    rewrite: rewrite || null,
  };

  const needsReview =
    overallConfidence < 0.65 ||
    dimensionResults.some(
      (criterion) => criterion.level === "insufficient_evidence",
    ) ||
    possibleInjection ||
    severeTone ||
    scoringFlags?.needs_human_review === true;

  const label = `AI-assessed against SabiLab rubric v${rubric.version} (${rubric.status}). Every quote was checked by code. Thresholds are proposals, not calibrated benchmarks.`;

  return {
    failures,
    result: {
      criteria: dimensionResults,
      overallConfidence,
      needsReview,
      summary: {
        strengths,
        improvements,
        flags: toneFlagsFrom(readings, transcript),
        engine: "llm",
        label,
        needsClarification: false,
        figures: verifiedKeyFigures(scenario, studentText(transcript)),
        rubricStatus: rubric.status,
        criteria: details,
        feedback,
        possibleInjection,
      },
    },
  };
}

/** Compatibility wrapper used by tests and callers that do not need the audit. */
export function normaliseScoringResponse(
  scenario: Scenario,
  transcript: Transcript,
  raw: unknown,
  readings?: ReadingsResult,
): ScoreResult {
  return auditScoringResponse(
    scenario,
    transcript,
    raw,
    readings ?? {
      entries: [],
      clarifications: [],
      possibleInjection: false,
      severeTone: false,
    },
  ).result;
}

function combineUsage(
  first: Usage | undefined,
  second: Usage | undefined,
): Usage | undefined {
  if (!first && !second) return undefined;
  return {
    inputTokens: (first?.inputTokens ?? 0) + (second?.inputTokens ?? 0),
    outputTokens: (first?.outputTokens ?? 0) + (second?.outputTokens ?? 0),
  };
}

async function withOneRetry<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch {
    return run();
  }
}

export async function scoreWithLlm(
  scenario: Scenario,
  transcript: Transcript,
  complete: JsonCompleter = completeJson,
): Promise<ScoredSubmission> {
  const readingModel =
    process.env.SABILAB_LLM_READING_MODEL?.trim() || undefined;
  const scoringModel =
    process.env.SABILAB_LLM_SCORING_MODEL?.trim() || undefined;

  const reading = await withOneRetry(async () => {
    const completion = await complete({
      system: READING_SYSTEM_PROMPT,
      user: buildReadingPrompt({
        scenario,
        studentName: transcript.studentName,
        messages: transcript.messages,
        taskId: transcript.taskId,
      }),
      maxTokens: 1200,
      temperature: 0,
      model: readingModel,
    });
    return {
      completion,
      readings: parseReadings(completion.json, transcript),
    };
  });

  const questions = clarificationQuestions(transcript, reading.readings);
  if (questions) {
    const result = clarificationResult(
      scenario,
      transcript,
      questions,
      reading.readings,
    );
    result.summary.usage = reading.completion.usage;
    return {
      result,
      meta: {
        engine: "llm",
        model: reading.completion.model,
        promptVersion: PROMPT_VERSION,
        rubricVersion: rubric.version,
        usage: reading.completion.usage,
      },
    };
  }

  const checks = scenarioChecks(scenario);

  const callScoring = async () => {
    const completion = await complete({
      system: SCORING_SYSTEM_PROMPT,
      user: buildScoringPrompt({
        scenario,
        studentName: transcript.studentName,
        messages: transcript.messages,
        taskId: transcript.taskId,
        readings: reading.readings,
        checks,
      }),
      maxTokens: 2600,
      temperature: 0,
      model: scoringModel,
    });
    return {
      completion,
      audit: auditScoringResponse(
        scenario,
        transcript,
        completion.json,
        reading.readings,
      ),
    };
  };

  let attempt: Awaited<ReturnType<typeof callScoring>>;

  try {
    attempt = await callScoring();
  } catch {
    attempt = await callScoring();
  }

  // A retry is only kept when it reduces check failures. The safer of the two
  // is always shown; a failed quote is never trusted.
  if (attempt.audit.failures > 0) {
    try {
      const retry = await callScoring();
      if (retry.audit.failures < attempt.audit.failures) {
        attempt = retry;
      }
    } catch {
      // Keep the first, already-safe result.
    }
  }

  const usage = combineUsage(
    reading.completion.usage,
    attempt.completion.usage,
  );

  attempt.audit.result.summary.usage = usage;

  return {
    result: attempt.audit.result,
    meta: {
      engine: "llm",
      model: attempt.completion.model,
      promptVersion: PROMPT_VERSION,
      rubricVersion: rubric.version,
      usage,
    },
  };
}
