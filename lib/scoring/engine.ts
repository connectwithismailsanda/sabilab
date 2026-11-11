import type {
  Dimension,
  Level,
  Scenario,
} from "@/content/scenarios";
import type { CriterionResult, Flag, ScoreResult } from "./types";
import {
  extractSentences,
  findQuote,
  hasAny,
  numbersIn,
  sentenceWith,
} from "./verify";

export type { CriterionResult, Flag, ScoreResult } from "./types";

const RECOMMENDATION = [
  "i would",
  "we should",
  "my recommendation",
  "i recommend",
  "i suggest",
  "i will",
  "we will",
  "let us",
  "decide",
  "propose",
];

const DECISION = ["recommend", "suggest", "decide", "would", "should", "will"];
const TRADEOFF = ["because", "so that", "which means", "therefore", "leaves", "keeps", "cost", "risk"];
const TEAM = ["we", "our", "team", "together", "agree"];
const RISK = ["risk", "cash", "rent", "customer", "relationship", "contract", "trust"];
const ALTERNATIVES = ["instead", "option", "alternative", "or ", "rather than", "split", "outsource", "refund", "credit", "negotiate", "delay"];
const CONSEQUENCE = ["customer", "relationship", "stock", "reputation", "lose", "keep", "penalty", "credit", "profit"];

function levelFromCount(count: number): Level {
  if (count >= 3) return "proficient";
  if (count === 2) return "foundation";
  if (count === 1) return "needs_practice";
  return "insufficient_evidence";
}

function rationaleFor(
  dimension: Dimension,
  count: number,
  signals: string[],
): string {
  const opening: Record<Dimension, [string, string, string, string]> = {
    role_skill: [
      "No usable role evidence was found in the answer.",
      "The answer touches the situation, but not enough figures or a clear decision.",
      "The answer uses the numbers and moves towards a decision, though the reasoning is thin.",
      "The answer uses the right figures, names the constraint and commits to a decision.",
    ],
    communication: [
      "There is not enough text to judge how the message would land.",
      "The message is understandable but the recommendation is not clearly framed.",
      "The message is clear and mostly specific, with a recommendation the reader can act on.",
      "The message is clear, specific and written for the person who has to act on it.",
    ],
    leadership: [
      "No decision or ownership is visible in the answer.",
      "There is a hint of ownership, but the reader is left to decide.",
      "The answer takes responsibility for a next step and weighs a risk.",
      "The answer takes clear ownership, names the risk and tells the team what happens next.",
    ],
    creative_thinking: [
      "No alternatives are considered.",
      "One option is mentioned, without comparing it to anything.",
      "Two options are compared, with some reasoning about the trade-off.",
      "Several realistic options are compared and the trade-off is made explicit.",
    ],
  };

  const base = opening[dimension][count] ?? opening[dimension][0];
  const signalsText =
    signals.length > 0 ? ` Signals found: ${signals.join(", ")}.` : "";
  return `${base}${signalsText}`;
}

function toneFlags(body: string): Flag[] {
  const sentences = extractSentences(body);
  const shouts = sentences.find((sentence) =>
    /\b[A-Z]{4,}\b/.test(sentence.text.replace(/₦/g, "")),
  );
  if (!shouts) return [];
  return [
    {
      type: "tone",
      quote: shouts.text,
      note: "Capitalised words can read as shouting. Tone is shown as a flag and does not lower your score.",
    },
  ];
}

export function scoreTask(scenario: Scenario, body: string): ScoreResult {
  const sentences = extractSentences(body);
  const allNumbers = numbersIn(body);
  const keyFigureHits = allNumbers.filter((value) =>
    scenario.keyNumbers.includes(value),
  );
  const optionHits = scenario.options.filter((option) =>
    hasAny(body, option.split(" ").slice(0, 2)),
  );
  const flags = toneFlags(body);

  const signals: Record<Dimension, { label: string; matched: boolean }[]> = {
    role_skill: [
      {
        label: "uses a key figure",
        matched: keyFigureHits.length > 0,
      },
      {
        label: "names the constraint",
        matched: hasAny(body, scenario.options) || optionHits.length > 0,
      },
      {
        label: "states a decision",
        matched: hasAny(body, DECISION) || hasAny(body, RECOMMENDATION),
      },
    ],
    communication: [
      {
        label: "names the person who must act",
        matched: hasAny(body, [scenario.owner, ...scenario.personas.map((p) => p.name)]),
      },
      {
        label: "frames a recommendation",
        matched: hasAny(body, RECOMMENDATION),
      },
      {
        label: "is specific",
        matched: allNumbers.length > 0,
      },
    ],
    leadership: [
      {
        label: "takes ownership",
        matched: hasAny(body, RECOMMENDATION) || hasAny(body, ["i would", "we should", "i will"]),
      },
      {
        label: "weighs a risk",
        matched: hasAny(body, RISK),
      },
      {
        label: "brings the team in",
        matched: hasAny(body, TEAM),
      },
    ],
    creative_thinking: [
      {
        label: "compares alternatives",
        matched:
          optionHits.length >= 2 ||
          (hasAny(body, ALTERNATIVES) && hasAny(body, ["option", "instead", "alternative", "or "])),
      },
      {
        label: "explains the trade-off",
        matched: hasAny(body, TRADEOFF),
      },
      {
        label: "names the consequence",
        matched: hasAny(body, CONSEQUENCE) || keyFigureHits.length > 0,
      },
    ],
  };

  const dimensions: Dimension[] = [
    "role_skill",
    "communication",
    "leadership",
    "creative_thinking",
  ];

  const criteria: CriterionResult[] = dimensions.map((dimension) => {
    const matched = signals[dimension].filter((signal) => signal.matched);
    const count = matched.length;
    const sentence =
      sentenceWith(
        body,
        dimension === "role_skill"
          ? scenario.keyNumbers.map(String).concat(scenario.options)
          : dimension === "communication"
            ? [scenario.owner, ...RECOMMENDATION]
            : dimension === "leadership"
              ? [...RECOMMENDATION, ...RISK]
              : [...ALTERNATIVES, ...TRADEOFF],
      ) ??
      sentences[0]?.text ??
      null;

    const verification = sentence ? findQuote(body, sentence) : null;
    const quote = verification && count > 0 ? sentence : null;
    const level = quote ? levelFromCount(count) : "insufficient_evidence";

    return {
      dimension,
      level,
      quote,
      rationale: rationaleFor(
        dimension,
        quote ? count : 0,
        matched.map((signal) => signal.label),
      ),
      confidence: Number(
        Math.min(0.72, (quote ? 0.52 : 0.2) + count * 0.05).toFixed(2),
      ),
      verified: Boolean(quote),
      startOffset: quote ? (verification?.start ?? null) : null,
      endOffset: quote ? (verification?.end ?? null) : null,
    };
  });

  const rank: Record<Level, number> = {
    insufficient_evidence: 0,
    needs_practice: 1,
    foundation: 2,
    proficient: 3,
  };

  const scored = criteria.filter((criterion) => criterion.level !== "insufficient_evidence");
  const strengths = scored
    .filter((criterion) => rank[criterion.level] >= 2)
    .map((criterion) => criterion.dimension);
  const improvements = criteria
    .filter((criterion) => rank[criterion.level] < 2)
    .sort((a, b) => rank[a.level] - rank[b.level])
    .map((criterion) => criterion.dimension);

  const overallConfidence = Number(
    (
      criteria.reduce((total, criterion) => total + criterion.confidence, 0) /
      criteria.length
    ).toFixed(2),
  );

  return {
    criteria,
    overallConfidence,
    needsReview: true,
    summary: {
      strengths,
      improvements,
      flags,
      engine: "rule-based",
      label: "Provisional scores from a stub rubric. Not yet calibrated with human raters.",
      needsClarification: false,
      figures: keyFigureHits,
    },
  };
}
