# Rubric v0.2 in the codebase

Source: *SabiLab: AI Scoring Prompt and Rubric*, draft v0.2, 8 November 2026.
The product owner supplied it; `content/rubric.ts` is the implementation.

**Status: draft.** The rubric's own section 1 says every rule and threshold is a
starting proposal and nothing has been validated. The product therefore calls
results "AI-assessed · provisional" and never claims calibrated credibility.

## The 15 criteria

| Dimension | Criteria |
| --- | --- |
| Communication | C1 Clarity · C2 Audience fit · C3 Professional tone · C4 Active understanding |
| Leadership | L1 Delegation · L2 Decisions with reasons · L3 Support for others · L4 Ownership |
| Creative thinking | R1 Problem framing · R2 Options · R3 Use of evidence and constraints · R4 Iteration |
| Role skill | A1 Accuracy · A2 Prioritisation · A3 Reasoned recommendation |

Levels are `needs_practice`, `foundation`, `proficient`, plus
`insufficient_evidence` when no verified quote supports a level. There is no
level above Proficient.

Funke's Kitchen is a beta scenario. It shares A1 and A3 but uses an A2 adapted
from cash to operations (delivery shortfall; split, outsource or credit). See
`criteriaForScenario`.

## Hard rules, enforced in code

| Rule | Where |
| --- | --- |
| Every level cites an exact quote from the named student message. | `lib/scoring/verify.ts`, `lib/scoring/llm.ts` |
| Dimension level is the second-lowest supported criterion. | `lib/scoring/aggregate.ts` |
| If more than half a dimension's criteria are insufficient, the dimension is insufficient. | `lib/scoring/aggregate.ts` |
| Clarity (C1) at Needs practice caps Communication at Foundation. | `lib/scoring/aggregate.ts` |
| Proficient is the ceiling. | `lib/scoring/llm.ts` |
| Arithmetic is code-owned; the model never checks it. | `lib/scoring/checks.ts` |
| Tone affects only C3 and is shown as a quoted flag. | `lib/scoring/llm.ts` |
| Spelling, grammar, typos and Nigerian English are not scored. | prompts + tone `notFlags` |
| At most two clarifying questions. | `lib/scoring/llm.ts` |
| Prompt injection inside the transcript is flagged for review. | `lib/scoring/llm.ts` |

## Reading pass and scoring pass

The prompts live in `prompts/scoring.v0.2.ts`:

- `READING_SYSTEM_PROMPT` — understand before scoring. It returns per-message
  language, intent, clarity, ambiguity, tone, tone flags and clarification
  requests. It returns no scores.
- `SCORING_SYSTEM_PROMPT` — score every criterion once, with an evidence quote
  and an optional counter-evidence quote, plus one strength, one improvement and
  one rewrite.

The scoring pass receives the reading output, the code-owned figure checks and
the scenario-specific rubric. Report-specific scenario facts come from
`content/scenarios.ts`.

## Stored result shape

`scores.summary` is JSONB and carries the UI-facing detail:

```ts
type ScoreSummary = {
  strengths: Dimension[];
  improvements: Dimension[];
  engine: "llm" | "rule-based";
  label: string;
  needsClarification: boolean;
  clarifyingQuestions?: string[];
  flags?: { type: "tone"; quote: string; note: string }[];
  figures?: number[];
  usage?: { inputTokens: number; outputTokens: number };
  rubricStatus?: "draft" | "calibrated" | "stub";
  criteria?: CriterionDetail[];   // 15 rows: id, name, dimension, level,
                                  // quote, reason, confidence, verified,
                                  // counterEvidence
  feedback?: {
    strengthQuote: string | null;
    strengthNote: string | null;
    improvement: string | null;
    rewrite: string | null;
  };
  possibleInjection?: boolean;
};
```

The four dimension rows still go into `criterion_scores`, which drives badges,
the Evidence Card and analytics. The per-criterion detail is what the results
page opens under "See the criteria behind this level".

## What the rule fallback does

`lib/scoring/engine.ts` is a deterministic approximation used only when no model
is configured or the model fails twice. It scores the task answer, not the
transcript, so it cannot judge questions asked, delegation, support or iteration.
It still returns a verified quote per dimension and is labelled
"Rule-based · provisional". Do not treat it as a rubric v0.2 score.

## Known limits

- Thresholds are uncalibrated proposals. The calibration plan is section 11 of
  the rubric and is not started.
- Only the task message can trigger the clarification gate, because chat messages
  are not editable in the current UI.
- The rule fallback cannot detect non-English text; only the reading pass can.
- There is no per-session clarification counter, only a per-call limit of two.
- English only in version 1. The reading pass can ask for a restatement but does
  not translate or score another language.
