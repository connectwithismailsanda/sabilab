# SabiLab: Build Plan and Review Notes

Companion to the PRD (v0.1), Workspace UI/UX Spec (v1.0) and Workspace copy deck.
Written 11 November 2026. This is the working plan, not a replacement for those documents.

> **Status, 11 November:** the vertical slice in section 9 is built and running.
> Two scenarios (Adaeze's Fabrics and Funke's Kitchen), accounts, workspace,
> scripted teammates, rule-based scoring with verified quotes, results, badges
> and a public Evidence Card. See `README.md` to run it. Still open: the real
> rubric, LLM scoring and personas, solo practice, deployment, and the decisions
> in section 12.

---

## 1. Where the project stands

| Item | State |
| --- | --- |
| Product definition | Strong. Problem, user, principles and non-goals are clear enough to build against. |
| Scope | Too large for the remaining time. 20 FRs, 12 screens, 3 scenarios, 3 solo skills. |
| UI/UX | Specified in enough detail to implement (layout, tokens, object coordinates, states). |
| Scoring design | Summarised only. The rubric, prompts, tests and scenario answer keys live in external Claude artifacts and are **not in this folder**. |
| Code | None. No repo, no stack, no schema, no API contract. |
| Deadline | PRD targets 12 November. That is tomorrow. The plan in section 12 of the PRD is already out of date. |

**Bottom line:** the product thinking is ahead of the engineering. What is missing is not ideas, it is a thin vertical slice: one scenario, one scored task, one Evidence Card, real accounts, saved data.

---

## 2. What is strong (keep it)

- **Evidence over claims** is a genuine product constraint, not decoration. It forces a verifiable scoring contract and makes the demo trustworthy.
- **AI-capped at Proficient + visible tier labels** is an honest and defensible design choice. Do not soften it under demo pressure.
- **Three scenarios on one engine** is the right content strategy. One engine, three configs.
- **Mobile-first, low-data, no email** keeps the build small and the privacy story simple.
- **UI spec is unusually implementable**: tokens, breakpoints, object positions, state table, acceptance checklist. A frontend can start from it today.

---

## 3. Gaps and contradictions to resolve before writing code

### Blocking

1. **The scoring rubric and answer keys are not in the repo.** Section 8 and Appendix B point to `claude.ai/artifact/...`. Those links are not accessible to the build and are probably private. Without the rubric, prompts, thresholds and Scenario 1 answer key, the P0 scoring pipeline cannot be built honestly. **Export them as Markdown into `docs/` first.**
2. **No stack decision.** "Serverless functions, one database" is a direction, not a choice. This decides the whole repo layout.
3. **No data model.** The PRD's plan says "design the data schema" on 8 November; it has not been done here. Section 11 of the UI spec adds `notes`, `events` and `notifications` to a model that does not exist yet.
4. **No password-recovery decision.** No email means no reset link. Section 13 lists this as an open risk. Decide: one-time recovery code shown at sign-up (recommended for the demo) or accept permanent lockout for the pilot.

### Product contradictions

| # | Conflict | Recommendation |
| --- | --- | --- |
| 1 | FR4 says "20 minutes in total" but 3 + 15 + 5 = 23 minutes. | Fix the copy to 23 minutes, or make the brief part of the huddle. Pick one and use it everywhere. |
| 2 | FR13 says the student controls what is visible, but no screen exists for those controls. | Add a visibility block on the Evidence Card screen (per-badge toggles + "hide quotes"). |
| 3 | Evidence Card is "public behind an unguessable link" but also needs deletion and consent. | Unguessable slug + `noindex` + revocable link. Consent copy must say quotes become visible to anyone with the link. |
| 4 | Spec says the server runs the clock, but drafts must survive lost connection. | Server sets immutable `ends_at`; client renders from it; submit accepted for 60 s after `ends_at` with a stored `grace` flag. |
| 5 | "Real-people mode is simulated" appears in the copy deck but the UI may still imply real teammates. | Keep the simulated label on every screen where a teammate appears. Never show a fake "online now" count. |
| 6 | Solo skills: PRD says Communication is LLM-scored and the others may stay rule-based; UI spec says all three are playable. | For the demo: Communication LLM-scored, Leadership and Creative rule-based with a visible "rule-based" label. |
| 7 | Foundation Check is "not a test of ability" but produces a recommendation. | Keep the "suggestion" label and show the student's own answer as the reason. No score. |

### Missing detail that will otherwise be invented mid-build

- **Badge award table**: which level on which dimensions earns Foundation / Proficient, and how tiers combine.
- **Twist timing rule**: "halfway" of the huddle, and what happens if the student submits early or resumes late.
- **Clarification gate rule**: exactly when a question is allowed (max 2) and what happens if unanswered at time-up.
- **AI persona contract**: system prompt, turn limit, max tokens, fallback reply, latency budget.
- **Analytics event list** for the section 11 metrics (session_started, object_inspected, message_sent, task_submitted, score_ready, card_published).
- **Accessibility target**: WCAG 2.2 AA is implied but not stated.
- **Legal**: Nigerian Data Protection Act 2023 review, age handling, and the fact that a username-only account is pseudonymous but not anonymous.

---

## 4. Recommended stack (for a 1–2 person build)

| Layer | Choice | Why |
| --- | --- | --- |
| App | **Next.js 15 (App Router) + TypeScript** | One deploy, server actions/route handlers for the clock and scoring, React for the workspace. |
| Styling | **Tailwind CSS v4** + small local component set | Tokens in section 7 map directly to theme variables. No heavy UI library. |
| DB | **Postgres** (Neon or Supabase) | Relational fits sessions → messages → tasks → scores → badges. |
| ORM | **Drizzle** (or Prisma) | Typed schema, migrations in repo. |
| Auth | **Custom credentials**: username + argon2id + httpOnly cookie | Supabase Auth expects email. A recovery code shown once satisfies "no email" without hacks. |
| LLM | **Two pinned models** via one provider SDK | Small/fast for personas + reading pass, stronger for scoring. Pin model IDs in config. |
| Jobs | **Route handler + `after()`**, or a queue if available | Scoring runs after submit; UI polls a result endpoint. |
| Tests | **Vitest** (unit: quote verification, timer, rubric mapping) + **Playwright** (one full-loop E2E) | The quote verifier is the credibility core; it must be unit-tested. |
| Hosting | **Vercel** (or any Node host) + managed Postgres | HTTPS by default, secrets server-side. |
| Analytics | Postgres `events` table first | No third-party tracker until consent copy covers it. |

If you prefer zero custom auth, the fallback is Supabase Auth with synthetic `<username>@sabilab.local` addresses. It is faster but leaks an implementation detail and complicates recovery. My recommendation is custom credentials.

---

## 5. Data model (v0.1 draft)

```text
users            id, username (citext, unique), password_hash, recovery_code_hash,
                 consent_at, created_at, deleted_at
auth_sessions    id, user_id, token_hash, expires_at, created_at
scenarios        id, slug, title, role, status (live|beta), config jsonb
sim_sessions     id, user_id, scenario_id, mode (demo|full), state,
                 started_at, brief_ends_at, huddle_ends_at, ends_at,
                 twist_fired_at, submitted_at, grace_used
participants     id, session_id, kind (student|ai|human_sim), display_name, persona_key
messages         id, session_id, author_participant_id, body, kind (chat|twist|system), created_at
notes            id, session_id, object_id, text, created_at
events           id, session_id, user_id, type, payload jsonb, created_at
tasks            id, session_id, user_id, body, word_count, submitted_at
clarifications   id, session_id, question, answer, asked_at, answered_at
scores           id, task_id, model, prompt_version, rubric_version,
                 confidence, needs_review, overall jsonb, usage jsonb, created_at
criterion_scores id, score_id, dimension, level, quote, rationale, confidence
quote_checks     id, criterion_score_id, verified, start_offset, end_offset
badges           id, user_id, session_id, dimension, level, tier, issued_at, is_public
evidence_cards   id, user_id, public_slug, visibility jsonb, revoked_at, created_at
solo_runs        id, user_id, skill, state, started_at, ends_at, score_id
```

Rules:
- `sim_sessions.ends_at` is immutable after start. The client never owns the clock.
- Deleting a user cascades through every table above (write the cascade, do not do it by hand).
- `criterion_scores.quote` is only stored after `quote_checks.verified = true`; otherwise the level must be `Insufficient evidence`.
- Store `prompt_version` and `rubric_version` on every score, so a model change can be traced.

---

## 6. Session state machine

```text
created → brief → huddle → task → scoring → scored
                                  ↘ failed → retry
any → abandoned (timer expired with no task)
```

- Entering `huddle` schedules the twist at `started_at + brief + huddle/2` (or 45 s in demo mode).
- `task` begins when the huddle timer ends, or earlier via "Go to my task". Notes stay visible.
- Submit is validated server-side against `ends_at + 60 s`.
- `scoring` is a record + background job, not a long request. UI polls every 2 s, max 90 s, then shows the retry state.

---

## 7. Scoring contract (the credibility core)

One JSON object per pass. Validate with Zod before it touches the database.

**Pass 1 — read**
```json
{
  "language_ok": true,
  "flags": [{ "type": "tone|clarity|off_topic", "quote": "…", "note": "…" }],
  "evidence": [{ "dimension": "communication", "quote": "…", "observed": "…" }],
  "needs_clarification": false,
  "questions": ["…"]
}
```

**Pass 2 — score**
```json
{
  "criteria": [{
    "dimension": "role_skill|communication|leadership|creative_thinking",
    "level": "needs_practice|foundation|proficient|insufficient_evidence",
    "quote": "exact substring of the task",
    "rationale": "…",
    "confidence": 0.0
  }],
  "numbers": [{ "value": 350000, "context": "…", "claimed": "…" }]
}
```

**Verification step (code, not LLM)**
1. Normalise Unicode (NFKC), collapse whitespace, trim. Do not lowercase for the stored quote.
2. Require the quote to be a contiguous substring of the submitted body after normalisation.
3. Reject any criterion whose quote fails; downgrade to `insufficient_evidence` and flag for human review.
4. Check every number with a regex + answer-key comparison, never by model judgement.
5. Enforce the cap: `proficient` is the maximum. Any `advanced`-like output is a schema error.
6. `confidence < threshold` or failed verification → `needs_review = true`, still shown with the tier label.
7. Log tokens, model ID and latency per pass. Enforce `max_tokens` in the provider call, not in the prompt.

The model is never asked "is this good?". It is asked to return evidence tied to a rubric. The rubric lives in `prompts/rubric.v1.md` and is versioned.

---

## 8. Repo structure

```text
sabilab/
  app/
    (public)/page.tsx                 landing
    (auth)/signup, /login
    (app)/home, /check, /practice, /history, /settings
    (app)/session/[id]/brief|workspace|task|scoring|results
    card/[slug]/page.tsx              public Evidence Card
    api/session/[id]/message|submit|result|twist
    api/auth/signup|login|logout|delete
  components/  shell/ workspace/ results/ ui/
  lib/         auth/ db/ clock/ scoring/ verify/ analytics/ config/
  content/     scenarios/ s1-adaeze.json, s2-funke.json, s3-brightpath.json
  prompts/     persona.v1.md, read.v1.md, score.v1.md, rubric.v1.md
  db/          schema.ts, migrations/, seed.ts
  tests/       unit/, e2e/
  docs/        prd.md, ui-spec.md, build-spec.md, rubric.md, scenario-keys.md
```

All scenario content is configuration, never JSX conditionals. Object coordinates from UI spec section 6 go in `content/scenarios/*.json`.

---

## 9. What next — ordered build plan

### Phase 0 — Decisions and inputs (today, 2–3 hours)

- [ ] Export the rubric, prompt v0.2, Scenario 1 script + answer key, and Build Spec v0.2 into `docs/`.
- [ ] Confirm stack (section 4) and hosting.
- [ ] Fix the 20 vs 23 minute copy conflict and confirm demo-mode timing.
- [ ] Decide password recovery (recovery code recommended).
- [ ] Freeze demo scope: **Scenario 1 only, one AI teammate, Demo mode 90 s, Communication solo only.**

### Phase 1 — Skeleton (today, half day)

- [ ] Next.js repo, Tailwind tokens, app shell (top bar, side nav, bottom nav).
- [ ] Postgres + Drizzle schema + migrations + seed one scenario.
- [ ] Sign-up/login/consent/logout, argon2id, rate limit, session cookie.
- [ ] Consent gate blocks any session; delete-account cascade.
- [ ] Landing and My page with empty states.

**Gate:** a new user can sign up, land on My page and log out on a 390 px viewport.

### Phase 2 — Workspace vertical slice (today/tonight)

- [ ] Brief screen from scenario config.
- [ ] Scene with 4 object buttons at spec coordinates; inspect card; notes saved; dot state.
- [ ] Chat: send, typing indicator, scripted/LLM persona reply, twist at the scheduled point.
- [ ] Timer from server `ends_at`; amber near end; auto-advance.
- [ ] Task screen, autosave draft to localStorage + server, submit.

**Gate:** the full huddle → task flow runs with the network pulled for 30 s and resumes with the draft intact.

### Phase 3 — Scoring and results (critical path)

- [ ] Read pass, clarification gate (max 2), score pass, quote verifier, number checker.
- [ ] Retry + failed state + fallback when the model is down (demo: canned result clearly labelled).
- [ ] Results screen: levels, quotes, did well, improve, confidence, badge.
- [ ] Recommendation mapping (weakest dimension → drill, guide, habit, solo sim).

**Gate:** 10 hand-written sample answers score plausibly; every displayed quote passes the verifier; a deliberately fake quote is rejected.

### Phase 4 — Proof and history

- [ ] Badge issue + Evidence Card with public slug, visibility toggles, revoke, `noindex`.
- [ ] Activity history with change since last attempt.
- [ ] Communication solo run (3 steps) with LLM scoring; other two labelled rule-based or hidden.
- [ ] Foundation Check (5 questions, rule-based, suggestion label).
- [ ] Events table + a one-page metrics query.

**Gate:** landing → scored card in one sitting on a phone.

### Phase 5 — Test and freeze (12 November morning)

- [ ] Two test sessions with real people; note timing, confusion, failures.
- [ ] Fix only the top three issues. No new features after noon.
- [ ] Record a backup demo (video + seeded account).
- [ ] Prepare the honest-limits slide: n, what is simulated, what is rule-based, AI cap.

---

## 10. Definition of done for the hackathon demo

1. One scenario (Adaeze's Fabrics) playable end to end in Demo mode.
2. Account creation with consent; data survives a refresh; account deletion works.
3. Objects produce notes; notes can be attached to a chat message and appear on the task screen.
4. Twist fires once, on time, and is visible in chat, scene and state tag.
5. Submission produces cited levels; every quote is verified; nothing above Proficient.
6. Evidence Card opens from an unguessable link and states its limits.
7. All of the above works at 390 px wide.
8. A recorded backup demo exists.

Anything not on this list is cut.

---

## 11. Risks with the shortest fuses

| Risk | Trigger | Mitigation |
| --- | --- | --- |
| Rubric arrives late | Day-of build invents criteria | Build the pipeline against a stub rubric now; swap the file, not the code. |
| LLM latency in a live demo | Slow reply mid-huddle | 8 s timeout, canned persona fallback, pre-warm scoring with a fixed sample. |
| Scoring inconsistency on stage | Same answer, different level | Freeze model + temperature; cache demo transcripts by hash. |
| Timer drift / resume | Laptop sleep | Server `ends_at`, client recompute on focus and visibility change. |
| Scope creep from solo skills | Three sims half-built | Ship Communication only; hide the other two behind "coming in the pilot". |
| Public quotes leak | Card indexed or guessed | `noindex`, 128-bit slug, revoke, per-badge visibility, consent wording. |

---

## 12. Decisions needed from the team

1. Stack: Next.js + Postgres + custom credentials (recommended) or Supabase Auth with synthetic emails?
2. Demo scope: Scenario 1 only, or attempt a second scenario?
3. Password recovery: one-time recovery code, or no recovery in the demo?
4. Who produces the scene art, and can we ship the illustrated placeholder?
5. Where do the rubric and answer keys live, and who owns exporting them?
6. Is the name staying? It affects domain, card URL and all copy.
