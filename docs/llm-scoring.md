# LLM scoring pipeline (rubric v0.2)

The scoring pipeline implements the SabiLab AI Scoring Prompt and Rubric, draft
v0.2 (8 November 2026). The rubric is wired in full: 15 criteria, four
dimensions, a reading pass before scoring, exact-quote verification, the
second-lowest dimension rule, and the Clarity cap.

The rubric is still a **draft**. Every threshold is a starting proposal. Nothing
here has been calibrated against human raters yet, and the UI says so.

## Where the rubric lives

`content/rubric.ts` is the single source of truth. It holds:

- four dimensions and their 15 criteria;
- the Needs practice, Foundation and Proficient descriptor for each criterion;
- global rules: Proficient ceiling, exact quotes, code-owned arithmetic, tone
  confined to C3, at most two clarifying questions, English-only v1;
- the tone markers and the list of things that are *not* tone problems
  (bluntness, honorifics, warm humour, short messages, typos, Nigerian English);
- the Funke's Kitchen A2 adaptation, because that scenario is beta.

`prompts/scoring.v0.2.ts` turns it into the two system prompts. It does not
duplicate rubric text, so there is one place to edit.

To move to a calibrated rubric: update `content/rubric.ts`, set
`status: "calibrated"`, bump `PROMPT_VERSION`, and update the wording tests.
Nothing in `lib/scoring` assumes the version number.

## Two passes

1. **Reading pass.** Reads each student message and returns language, intent,
   clarity, tone, tone flags with quotes, and any clarification request. It
   returns no scores.
2. **Clarification gate.** If a message that matters for a criterion is unclear,
   or the task answer is not in English, the run stops. The result is stored as
   "not scored yet", with at most two short questions. The session stays in the
   task phase so the student can edit and resubmit.
3. **Scoring pass.** Receives the transcript, the readings, the code-checked
   figures and the scenario-specific rubric. It returns one level per criterion
   with a quote and a message id, an optional counter-evidence quote, and one
   piece of feedback (strength quote, improvement, rewrite).

The scoring pass runs twice only when the first response fails quote
verification. The attempt with fewer failures is kept. A failed quote is never
trusted; that criterion becomes Insufficient evidence.

## Configuration

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Meaning |
| --- | --- | --- |
| `SABILAB_LLM_API_KEY` | to use the LLM | Server-only key. Never exposed. |
| `SABILAB_LLM_MODEL` | to use the LLM | Exact model ID you tested. No aliases. |
| `SABILAB_LLM_PROVIDER` | no | `openai` (default) or `anthropic`. |
| `SABILAB_LLM_BASE_URL` | no | For OpenAI-compatible gateways. |
| `SABILAB_LLM_READING_MODEL` | no | Cheaper model for the reading pass. |
| `SABILAB_LLM_SCORING_MODEL` | no | Stronger model for the scoring pass. |

If the key or model is blank, the app uses the rule-based scorer and says so on
the results page. That is the default for this build.

## What code enforces, regardless of the model

`lib/scoring/llm.ts` treats the model as untrusted:

1. **Exact quotes, from the student only.** Every criterion quote must be a
   contiguous substring of the *named student message* after whitespace and
   Unicode normalisation. A quote attributed to the owner or a teammate is
   rejected. A rejected quote means no level; the criterion becomes Insufficient
   evidence.
2. **Proficient is the ceiling.** Names above it (`advanced`, `expert`,
   `outstanding`, …) are clamped to Proficient. Unknown names become Insufficient
   evidence.
3. **Dimension levels are computed in code.** `lib/scoring/aggregate.ts` sorts
   the supported criteria and takes the second-lowest. Insufficient evidence is
   left out of the sort; if more than half of a dimension's criteria are
   insufficient, the whole dimension is insufficient. If C1 Clarity is Needs
   practice, the dimension cannot exceed Foundation.
4. **Arithmetic.** `lib/scoring/checks.ts` owns every figure the model is allowed
   to call correct. The model is told not to do arithmetic. A reason or feedback
   rewrite that invents a number not in the student's text or the scenario key is
   replaced with a neutral sentence.
5. **Tone.** A tone flag is kept only if its quote verifies. Tone affects only
   C3 and never lowers another criterion. The UI shows the flag with the quote.
6. **Clarification gate.** At most two questions, and only from the rubric's
   allowed reasons. A clarification result has no levels and no badge.
7. **Confidence.** Clamped to 0.35–0.85 when a level is awarded. A dimension
   with insufficient evidence is 0.15. Results are marked `needs_review` when
   confidence is low, a dimension is insufficient, tone is severe, or prompt
   injection is suspected.
8. **Prompt injection.** A student message that tries to instruct the scorer is
   never followed. It sets `possible_injection` and goes to review.
9. **Feedback.** One strength with a verified quote, one improvement, one rewrite
   of the student's own sentence. Rewrites that invent figures are dropped. The
   feedback describes behaviour, never personality.

## Failure behaviour

- No key or model: rule-based fallback, labelled on results and the card.
- Reading or scoring call fails: retried once, then rule-based fallback with a
  visible label. The reason is logged (truncated to 300 characters) and stored
  on the score.
- A fallback score is never presented as AI-assessed: the badge tier is
  "Rule-based · provisional" and `score.model` is `rule-based-stub`.
- The rule fallback reads the **task answer only**. It cannot apply the
  transcript criteria (questions asked, delegation, support, iteration). Results
  and the card say this explicitly.

## Metadata and cost

Every score stores `model`, `prompt_version`, `rubric_version`, `confidence` and
`needs_review`. Token usage from both passes is combined into
`scores.summary.usage`. `max_tokens` is 1200 for the reading pass and 2600 for
the scoring pass. There is no per-user or per-day spend cap yet; add one before a
public pilot.

## Privacy

The student's transcript is sent to the configured provider. The app asks for
consent to store work, but the consent copy does not yet mention a third-party
processor. Update it, and check Nigerian data protection requirements, before
real users sign up.

## Deviations from rubric v0.2

These are deliberate and visible in the product:

- **Clarification gate on the task message only.** Rubric v0.2 allows a question
  about any unclear message. Chat messages cannot be edited in the current UI, so
  asking about them would create a dead end. The gate therefore fires only on the
  final task answer. The reading pass still reads chat messages for tone, clarity
  and criteria evidence.
- **Funke's Kitchen A2 is adapted** from cash to operations (delivery shortfall,
  split/outsource/credit), because that scenario is beta. A1 and A3 are shared.
- **No running clarification counter.** The limit is two per scoring call, not
  two per session across resubmissions. A student could in principle be asked
  again after a new submission. Add a session counter before a pilot.
- **Rule fallback is not the rubric.** It is a deterministic approximation over
  the task answer and is labelled as provisional.
- **No human review queue.** `needs_review` is stored, but no reviewer workflow
  exists yet.

## Tests

`tests/rubric.test.ts` checks the rubric shape and the aggregation rules
(second-lowest, insufficient majority, Clarity cap).

`tests/llm-scoring.test.ts` injects a fake completion function. It covers
hallucinated quotes, quotes attributed to the wrong speaker, the Proficient cap,
the Clarity cap, the insufficient-majority rule, invented figures, tone flags,
injection flags, the two-pass gate, retry-on-failed-quote, combined usage and the
rule fallback.

`npm run smoke:llm` runs the real HTTP client against a local fake model server,
so prompt construction, both passes, verification and token accounting are
exercised end to end without a provider key.
