import type { Dimension, Level } from "@/content/scenarios";

export type CriterionResult = {
  dimension: Dimension;
  level: Level;
  quote: string | null;
  rationale: string;
  confidence: number;
  verified: boolean;
  startOffset: number | null;
  endOffset: number | null;
};

export type TranscriptRole = "student" | "owner" | "teammate";

export type TranscriptMessage = {
  id: string;
  role: TranscriptRole;
  speaker: string;
  text: string;
  createdAt: string;
};

export type Transcript = {
  studentName: string;
  /** The final task submission. Its id is also a message id. */
  taskId: string;
  messages: TranscriptMessage[];
};

export type CriterionDetail = {
  id: string;
  name: string;
  dimension: Dimension;
  level: Level;
  quote: string | null;
  reason: string;
  confidence: number;
  verified: boolean;
  counterEvidence: string | null;
};

export type FeedbackDetail = {
  strengthQuote: string | null;
  strengthNote: string | null;
  improvement: string | null;
  rewrite: string | null;
};

export type Flag = { type: "tone"; quote: string; note: string };

export type Usage = { inputTokens: number; outputTokens: number };

export type ScoreResult = {
  criteria: CriterionResult[];
  overallConfidence: number;
  needsReview: boolean;
  summary: {
    strengths: string[];
    improvements: string[];
    flags: Flag[];
    engine: "llm" | "rule-based";
    label: string;
    needsClarification: boolean;
    clarifyingQuestions?: string[];
    figures: number[];
    usage?: Usage;
    rubricStatus?: "draft" | "calibrated" | "stub";
    criteria?: CriterionDetail[];
    feedback?: FeedbackDetail;
    possibleInjection?: boolean;
  };
};

export type EngineMeta = {
  engine: "llm" | "rule-based";
  model: string;
  promptVersion: string;
  rubricVersion: string;
  /** Why the LLM was not used, when it was configured but unavailable. */
  fallbackReason?: string;
  usage?: Usage;
};

export type ScoredSubmission = {
  result: ScoreResult;
  meta: EngineMeta;
};

export const DIMENSIONS: Dimension[] = [
  "role_skill",
  "communication",
  "leadership",
  "creative_thinking",
];

export const LEVEL_RANK: Record<Level, number> = {
  insufficient_evidence: 0,
  needs_practice: 1,
  foundation: 2,
  proficient: 3,
};
