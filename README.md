# SabiLab — prototype build

A mobile-first web app where students work a realistic workplace simulation,
get evidence-bound feedback, and choose whether to publish a shareable Evidence
Card. Built from the PRD (v0.1), the Workspace UI/UX Spec (v1.0) and the copy
deck in this folder.

**Status:** hackathon vertical slice. Two scenarios, scripted AI teammates,
LLM scoring against SabiLab rubric v0.2 when a key is configured, deterministic
rule fallback when it is not, and local Postgres via PGlite. The rubric is real
but still a draft: its thresholds are not calibrated yet.

See `SabiLab Build Plan.md` for the review, the plan and the open decisions.

---

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000, create an account (username + password only), pick a
workplace and choose **Demo mode**: 30 second brief, 90 second huddle, 3 minute
task.

No database server is needed. Data lives in `.data/pglite` and is deleted when
you remove that folder. Set `PGLITE_DIR` to move it.

```bash
npm test            # rubric aggregation, quote verification and LLM scoring tests
npm run smoke       # server loop against a throwaway database
npm run smoke:llm   # full scoring pipeline against a local fake model
npm run e2e         # mobile-width browser walk (dev server must be running)
npm run typecheck   # tsc --noEmit
npm run build       # production build
```

---

## What works

- Account creation with consent, hashed passwords (scrypt), login, logout,
  account deletion with cascade.
- Two scenarios as configuration: Adaeze's Fabrics and Funke's Kitchen.
- Team setup (1–2 AI teammates), private brief, demo or 23-minute session.
- Workspace: illustrated scene, four inspectable objects per scenario, notes,
  squad chat with typing indicator and scripted persona replies, twist at the
  halfway point, server-owned timer.
- Individual task with browser and server draft autosave.
- Scoring pipeline: reading pass → clarification gate → scoring pass → quote
  verification → dimension aggregation → badge → saved result. It implements
  rubric v0.2's 15 criteria, the second-lowest dimension rule and the Clarity
  cap. Uses an OpenAI-compatible or Anthropic model when configured, and falls
  back to a deterministic rule scorer when it is not. The rubric is data in
  `content/rubric.ts`; the prompts are in `prompts/scoring.v0.2.ts`.
- Results with four dimension levels, the 15 underlying criteria and their
  verified quotes, a strength/improvement/rewrite, recommendation, and a
  clarification gate when the answer cannot be scored fairly.
- Evidence Card behind an unguessable link, `noindex`, revocable.
- Activity history, Foundation Check suggestion, settings and data deletion.

## What is deliberately not built

| Cut | Why |
| --- | --- |
| Solo simulations | Scope. UI explains they are next; Communication is first. |
| Real-person teammates | Needs matching infrastructure; the UI says AI is simulated. |
| LLM personas | Teammate replies stay scripted so the demo is deterministic and cheap; scoring is the part that uses a model. |
| Password recovery | No email by design. Decide on a one-time recovery code before the pilot. |
| Human review queue and Human-verified tier | P2. The data model has room for it. |
| Notifications | The bell is a static empty state. |
| Third scene (BrightPath) | Labelled "arriving after the demo". |

## Deviations from the UI spec

- The timer sits in the workspace header, not the global top bar. Wiring a live
  session clock into the shell needs a session context provider; not worth it
  for the demo.
- Scene art is an inline SVG placeholder. Object coordinates come from section 6
  of the UI spec and are data, not code.
- Chat and notes are tabs in one panel, as specified; the paperclip attaches a
  note into the composer.
- Scoring labels say "provisional" rather than "AI-verified". Every level is
  quoted, but no human has reviewed it and the rubric is not calibrated.

## Architecture

```text
app/                 routes (marketing, auth, app shell, session loop, public card)
app/actions/         server actions (auth, session, submit, publish)
app/api/session/     polling + message + notes + draft endpoints
components/          shell, workspace, task form, countdown, foundation check
content/scenarios.ts two scenarios, personas, objects, answer-key figures
content/rubric.ts    rubric v0.2: 15 criteria, rules and tone markers
prompts/             two-pass scoring prompts (v0.2)
lib/                 auth, db, clock, scoring, llm, analytics, recommendations
lib/llm/client.ts    server-only model client (OpenAI-compatible / Anthropic)
lib/scoring/         rule engine, LLM normaliser, quote verifier, persistence
db/schema.sql        schema, applied idempotently at boot
```

**Clock.** `sim_sessions.ends_at`, `huddle_ends_at` and `twist_at` are written at
creation. Pages and the polling endpoint advance the state lazily, so no worker
is required. Submitting after the deadline is accepted and can be marked with
`grace_used`.

**Evidence rule.** `lib/scoring/verify.ts` normalises whitespace and Unicode,
then requires every quote to be a contiguous substring of the submission.
`lib/scoring/engine.ts` only returns sentences taken from the text, so the rule
holds by construction; the verifier is the check, and it is unit-tested.

**Storage.** PGlite is Postgres compiled to WASM. To move to managed Postgres,
replace the client in `lib/db/index.ts` with `drizzle-orm/node-postgres` and a
`DATABASE_URL`; run the SQL in `db/schema.sql` once. Queries and schema do not
change.

## LLM scoring

Scoring is optional and off by default. Copy `.env.example` to `.env.local`:

```bash
SABILAB_LLM_PROVIDER=openai        # or anthropic
SABILAB_LLM_API_KEY=...
SABILAB_LLM_MODEL=...              # pin the exact model you tested
# SABILAB_LLM_BASE_URL=...         # any OpenAI-compatible gateway
# SABILAB_LLM_READING_MODEL=...    # optional cheaper model for the reading pass
# SABILAB_LLM_SCORING_MODEL=...    # optional stronger model for the scoring pass
```

With no key, the app uses the rule scorer and labels the result
"Rule-based · provisional". If a configured model fails, the app falls back and
labels that too. Model, prompt version, rubric version and token usage are
stored on every score.

The model's output is untrusted. `lib/scoring/llm.ts` verifies every criterion
quote against the exact student message, caps levels at Proficient, rejects
invented figures, keeps tone as a flag only, and limits clarification to two
questions. Dimension levels are computed in code
(`lib/scoring/aggregate.ts`): second-lowest criterion, insufficient majority,
and the C1 Clarity cap. See `docs/llm-scoring.md`.

### Rubric v0.2

The real SabiLab rubric is wired in at `content/rubric.ts`: 15 criteria across
Communication, Leadership, Creative thinking and Role skill, with a reading pass
before scoring. It is still a **draft**; the thresholds have not been calibrated
against human raters.

Do not present the current levels as calibrated evidence. The quotes are real;
the thresholds are proposals. See `docs/rubric-v0.2.md` for the implementation
and the deliberate deviations.

## Test protocol for the demo

1. Two people who have not seen the app, on a phone, on mobile data if possible.
2. Watch: do they inspect an object without being told? Do they find the task?
   Does the twist land? Do they understand that teammates are simulated?
3. Record completion, time to result and the top three confusion points.
4. Do not add features after the second test. Fix wording and breakage only.

## Known limits

- No password reset. A lost password means a lost account in this build.
- Rate limiting is in-process; it resets on restart.
- Sessions never expire server-side; only the cookie does.
- PGlite is single-process. Do not run two app instances against the same data
  directory.
- The rubric is a draft. Its 15 criteria are implemented and quoted, but the
  thresholds are not validated against human raters. Do not present scores as
  calibrated evidence yet.
- The rule fallback reads the task answer only, so it cannot apply the rubric's
  transcript criteria. The UI says this on results and the card.
- Only the task message can trigger the clarification gate, because chat messages
  are not editable in the current UI. This deviates from rubric v0.2.
- The LLM path needs a key and a pinned model. Without them the rule fallback
  runs and the UI says so.
- There is no per-user or per-day spend cap. `max_tokens` is capped per call, but
  a public pilot needs a budget guard.
- A student's answer is sent to the configured model provider. The consent copy
  does not mention a third-party processor yet.
