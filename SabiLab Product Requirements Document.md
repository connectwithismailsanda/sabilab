# SabiLab: Product Requirements Document

Version 0.1 draft · 8 November 2026 · For team review. Nothing here is validated yet.

## 1. Summary

**Problem.** Graduates in Nigeria have degrees but little chance to practise real workplace tasks, and no credible evidence of what they can do. Employers have no cheap way to tell who can do the work.

**Solution.** SabiLab is a mobile-first web app where students complete timed, realistic workplace simulations, alone or with a small team of AI or real-person teammates. Feedback is tied to exact quotes from the student’s own work. Students earn badges and a shareable Evidence Card.

**Target user.** Final-year students and recent graduates in business, accounting and operations at Nigerian universities, aiming for entry roles in SMEs.

**What is different.** SabiLab is not a job board or a CV tool. It produces evidence of how someone actually works: individual task output, communication, leadership and creative thinking, scored transparently.

**Working tagline (English):** Do the job before you have the job.

## 2. Goals and non-goals

**Goals for the 12 November hackathon**

- Show the full loop working end to end, with three scenarios to choose from: simulate, get feedback, improve, prove.
- Show that scoring is evidence-based and honest about its limits.
- Collect first real numbers from at least two test sessions.

**Goals for a first pilot (after the hackathon, proposed)**

- One university, one discipline, about 100 students and 10 employers, over roughly 90 days.
- Learn whether employers value the Evidence Card and whether students improve between attempts.

**Non-goals**

- Job listings, CV rewriting, or promising employment.
- Replacing human assessors.
- Languages other than English in version 1.
- Payments and billing.

## 3. Users

| User | Role in the product | Priority |
| --- | --- | --- |
| Student or recent graduate | Practises, gets feedback, earns badges, shares the card | Primary |
| Employer or hiring manager | Opens an Evidence Card, later helps write rubrics | Secondary (reviewer in the demo) |
| University career office | Employability dashboards | Later |
| Mentor or human verifier | Confirms flagged results, awards Human-verified | Later |

**The student’s barrier:** they know the theory but have never handled messy, time-pressured work, and they have no mentor, no feedback and nothing credible to show.

**Assumptions we have not tested:**

- Students will complete a 20-minute text session on a phone.
- Data costs and connectivity will not block most of them.
- Employers will treat an AI-assessed card as useful.

**Business model hypotheses (untested):** free for students, with employers, universities and donors as possible payers.

## 4. Product principles

- **Evidence over claims.** No score without a quote from the student’s own work.
- **Practise before proof.** Practice mode is safe and forgiving. Only assessed mode issues badges.
- **Ask before judging.** If a message is unclear, the system asks instead of guessing.
- **Honest limits.** AI never awards the top level. Low-confidence results go to a person.
- **Fair and light.** Mobile-first, low data, and no penalty for spelling, typos or writing style.

## 5. Scope by priority

| Feature | Priority | Status today |
| --- | --- | --- |
| Join, consent, path choice | P0 | Prototype (scripted) |
| Team simulation with AI teammates (up to 2), a choice of 3 scenarios, timer, twist | P0 | Prototype (scripted) |
| Individual task per student | P0 | Prototype (scripted) |
| LLM scoring pipeline with clarification gate and verification | P0 | Not built |
| Results with cited evidence, did well, improve | P0 | Prototype (rule-based) |
| Recommendation (drill, guide, habit, linked solo sim) | P0 | Prototype |
| Badge issued and public Evidence Card link | P0 | Card is a prototype screen only |
| Data saved on a server | P0 | Not built |
| Three solo simulations playable | P0 | Prototype (rule-based scoring) |
| Communication solo simulation scored by the LLM | P0 | Not built |
| Real-person teammates through an invite link | P1 | Simulated only |
| Leadership and creative solo simulations scored by the LLM | P1 | Not built |
| Short defence (text first, voice later) | P1 | Not built |
| Peer rating with low weight | P1 | Not built |
| Human review screen and Human-verified tier | P2 | Not built |
| Open Badges export (confirm the current spec first) | P2 | Not built |
| More roles and scenarios, badge expiry, employer and university dashboards | P2 | Not built |
| Curated outside learning materials, other languages | P2 | Not built |
| Landing page in plain language, with three workplace cards | P0 | Prototype (illustrated, responsive) |
| Accounts: username and password, consent, delete my data | P0 | Prototype only, stored on the device, not secure |
| Foundation Check suggests a workplace and a skill to build first | P0 | Prototype (rule-based) |
| Workplace scene with inspectable objects for each scenario | P0 | Prototype (illustrated 2D). Video scenes planned. |
| Activity history with change since the last attempt | P0 | Prototype (on the device) |
| Real 3D workplace environments | P2 | Not built |

## 6. Key user flows

**Team simulation**

1. The student creates an account (username and password), accepts consent, optionally takes the Foundation Check, and picks one of three workplaces.
2. They pick 1 to 2 teammates (AI by default, real people in P1). AI fills empty seats.
3. They read a private role brief.
4. They look around the workplace scene and huddle in chat, with a visible clock. The twist fires halfway.
5. They write their individual task.
6. The system reads, may ask up to two clarifying questions, scores, and verifies.
7. They see results, a recommendation, and any badge, then choose whether to publish the Evidence Card.

**Solo soft-skill practice**

1. The student chooses Communication, Leadership or Creative thinking.
2. Three timed steps with an AI character who reacts to each answer.
3. Feedback with quotes, a drill, guide and habit, and a badge if the rule is met.

**Employer view**

1. The employer opens an Evidence Card link.
2. They see badges, levels, cited quotes, improvement, verification tier and a plain statement of limits.

## 7. Functional requirements

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| FR1 | Consent and onboarding. Before any session the student sees what is stored and what employers can see, and accepts. Only a username and a password are needed. No email. | A session cannot start without acceptance. |
| FR2 | Path choice between team simulation and solo practice. | Both are reachable from the start screen. |
| FR3 | Team formation. Pick 1 to 2 teammates, AI by default. Real people in P1, with an availability list. AI fills empty seats. | The student cannot exceed 2 teammates. A missing teammate never blocks a session. |
| FR4 | Timed session. A scenario chosen from the library, a private brief, team chat, a twist at the halfway point. Real timing is a 3 minute brief, then 20 minutes in total: a 15 minute huddle and a 5 minute individual task (to confirm in tests). Demo mode is shorter. | The clock is visible. The twist fires at the same point for every squad. Auto-submit at time-up. Every message is timestamped. |
| FR5 | Individual task. Each student writes their own deliverable after the huddle. | The task is stored and attributed to that student only. |
| FR6 | Autosave and resume. | Closing the tab or losing power mid-session does not lose the draft (tested). |
| FR7 | Language. English only in version 1, in a professional register. Spelling, grammar and typos are not penalised. If a message is not in English, the student is asked once to restate it in English before scoring. | A non-English message is never scored as poor content. |
| FR8 | Scoring pipeline: reading pass, clarification gate (maximum two questions), scoring pass, verification, routing. | Every quote is verified as an exact substring. No level is above Proficient. Low-confidence results are flagged. |
| FR9 | Results. Levels per criterion with quotes, where the student did well, where to improve, confidence, and a route to human review. | Each level shows a quote, or says Insufficient evidence. |
| FR10 | Recommendation. The weakest area maps to a drill, a guide, a habit and the matching solo simulation. | Shown after every result. |
| FR11 | Solo simulations. Communication, Leadership and Creative thinking, three steps each, timed, with reactive AI personas. | Each is playable end to end. The Communication simulation is LLM-scored in the MVP. Others may stay rule-based and are labelled as such. |
| FR12 | Badges carry a level and a verification tier. At least Foundation is needed on every dimension. Squad evidence caps at Proficient. | A badge links to its Evidence Card. |
| FR13 | Evidence Card. A public page behind an unguessable link, showing badges, levels, cited quotes, improvement between attempts, tier labels and a statement of limits. | The student controls what is visible. No score appears without evidence. |
| FR14 | Human review (P2). A reviewer confirms or changes flagged results and can mark Human-verified. | Not in the MVP, but the data design must allow it. |
| FR15 | Scenario choice. The student picks one of three scenarios. Each has its own student role, teammates, facts, twist and individual task, and all run on the same engine. | Each scenario is playable end to end. Scenarios 2 and 3 are labelled beta until tested. Check figures come only from the scenario fact sheet. |
| FR16 | Accounts and data protection. Username and password, no email. Passwords hashed on the server with a well-established method, HTTPS only, login rate limiting, and account deletion. | A password is never stored in plain text. Deleting an account removes the user’s sessions, messages, tasks, scores, badges and results. A qualified adviser reviews this before real users sign up. |
| FR17 | Foundation Check. Five questions suggest a workplace and a skill to build first, with reasons taken from the student’s own answers. | Labelled as a suggestion, not a test of ability. The student can retake it or ignore it. |
| FR18 | Workplace scenes. Each scenario shows a workplace with 4 inspectable objects that reveal facts from that scenario’s fact sheet. | Objects work by touch and keyboard. None is required to finish. Inspections are logged, not scored. |
| FR19 | Activity history. The student’s page lists Foundation Checks and simulations with date, levels, badges, and change since the last attempt at the same scenario. | History is built from saved results. The student can clear it, and deleting the account removes it. |
| FR20 | Landing page. A short, plain-language page with a clear first action, three workplace cards, and an accurate data statement. | Works on phones and desktop and loads quickly. Makes no claim we have not tested. |

## 8. Assessment requirements

The full prompts, rubric and tests are in [SabiLab: AI Scoring Prompt and Rubric](https://claude.ai/artifact/SqqCWwALpzas7cAHCQ4ZqP). In summary:

- Four assessed dimensions: communication, leadership, creative thinking, and role skill (accounts).
- Levels are Needs practice, Foundation, Proficient, or Insufficient evidence. The AI never gives a higher level.
- Tone is judged by its effect on the reader, shows as a visible flag with a quote, and affects only the Professional tone criterion.
- Numbers are checked by code against the scenario answer key, not by the LLM.
- All thresholds are starting proposals until they are calibrated against human raters.

**Decision on language (8 November):** version 1 is English only. The scoring document (v0.2) now matches: the Pidgin glossary and Pidgin tests are removed, and a non-English message is sent back for restatement in English before it is scored.

## 9. Non-functional requirements

| Area | Requirement |
| --- | --- |
| Low data and devices | Mobile-first, light pages, works in a basic Android browser. Set page-weight targets after measuring. |
| Resilience | Autosave and resume. Retries on failed AI calls. A human-review route when a check fails. |
| Performance | Measure time to results. Set a target after the first tests. |
| Accessibility | Readable text sizes, sufficient contrast, usable with a keyboard. An extended-time option is on the roadmap. |
| Privacy and security | Consent, minimal data, unguessable card links, API keys kept on the server, deletion on request. Check Nigerian data protection law with a qualified adviser. |
| Cost | Log LLM usage per session and cap tokens per call. |

## 10. Technical approach

- **App:** a mobile-first web app, built with AI-teammate mode first so no multiplayer infrastructure is needed.
- **Backend:** serverless functions that run the clock, the twist, the AI personas and the scoring pipeline. Keep API keys on the server.
- **Data:** one database for users, sessions, messages, tasks, scores, badges and cards.
- **LLM:** a faster model for personas and the reading pass, a stronger one for scoring. Check current model names and pricing, and pin the versions you test.
- **Evidence Card:** a public page served from saved results.
- **Not in the MVP:** installable app packaging and offline use beyond draft saving. Those need your own hosting.

## 11. Success metrics

We set no targets yet. We will report what we measure, with sample sizes.

| Question | Metric | How |
| --- | --- | --- |
| Do students improve? | Change in levels between attempt 1 and attempt 2 | Stored attempts |
| Is scoring credible? | AI and human rater agreement, with n. Share of results sent to human review. | Small human-rated set |
| Is the clarification gate useful? | How often it triggers, and whether testers find the questions fair | Logs and tester feedback |
| Is it usable? | Completion rate, resume success, time to results | Logs |
| Do employers value the card? | Reaction to the card versus a CV, and whether it would change a shortlist decision | Short interviews, report n |
| Is it affordable? | Cost per session and per result | Provider usage |
| Is the feedback helpful? | Tester rating and open comments | Post-session questions |

## 12. Plan to 12 November

| Day | Focus |
| --- | --- |
| Sun 8 | Agree this PRD. Lock the three scenario scripts and the rubric in English. Design the data schema. |
| Mon 9 | Build the LLM pipeline (reading, gate, scoring, verification), saving to the database, and the Evidence Card page. Load all three scenarios as configuration. |
| Tue 10 | Recommendation and badge. First test with 3 to 4 people. Note timing and confusion points. |
| Wed 11 | Fix what the test showed. Second test. Compare AI and human scores on a handful of transcripts. |
| Thu 12 | Polish, rehearse, record a backup demo, submit. No new features. |

## 13. Limitations, assumptions and risks

**Top risk: the evidence may not be credible.** SabiLab’s whole value is that a score and a card mean something. If AI scoring is inconsistent or unfair, or employers do not trust an AI-assessed card, there is no product. Both are untested today. Until we have AI and human agreement on a small set, and real employer reactions, everything else is secondary.

**Current limitations**

- The prototype is scripted. Its AI replies and scoring are simple rules, not an LLM.
- Nothing has been tested with real students or employers.
- Three scenarios are authored, but only Scenario 1 will be tested in depth. The other two get lighter testing and are labelled beta until tested.
- Real-person teammates are simulated, and live matching needs enough students online together.
- Version 1 is English only, which narrows who it serves.
- Business model, privacy and legal compliance are not yet reviewed.

| Risk | Mitigation |
| --- | --- |
| Credibility of scores | Evidence-bound scoring, quote verification, a human-rated gold set, confidence shown, honest tiers |
| Employer trust and adoption | Interview employers early, co-write rubrics, ask what would change a shortlist |
| English-only disadvantages weaker writers | Score clarity and professionalism, never grammar or spelling. Ask before judging. Revisit with test data. |
| Fairness of tone and culture judgements | Nigerian reviewer panel, visible flags instead of silent penalties, paired fairness test |
| Content bottleneck | Three scenarios share one engine. Test Scenario 1 deeply and label the others beta until tested. |
| Matching real people needs critical mass | AI teammates as the default. Invite links in P1. |
| Privacy and legal | Minimal data, consent, qualified adviser |
| Cost and delay | Two model tiers, asynchronous scoring, measure cost per session |
| Model changes | Pin versions and re-run calibration after any change |
| Time (four days) | Build one scenario end to end and show test results honestly |

## 14. Decisions and open questions

**Decided**

- Team of the student plus up to 2 teammates, AI or real people.
- AI teammates are the default, and the AI never awards the top level.
- Version 1 is English only and offers a choice of three scenarios (8 November).

**Open**

- SabiLab is a Pidgin-derived name. Keep it with the English tagline, or rename it?
- How will real-person matching work at launch?
- Who acts as human reviewers, and who pays for the time?
- Which employers can we interview before 12 November?
- What is the data retention rule?
- When do we move to installable app packaging?

## 15. Roadmap

| Horizon | Focus |
| --- | --- |
| Now (to 12 November) | One scenario end to end, the LLM scoring pipeline, the Evidence Card, honest test numbers |
| Next (pilot) | Real-person teammates, defence, peer rating, all solo simulations LLM-scored, employer interviews |
| Later | Human-verified tier, Open Badges export, badge expiry, more roles, employer and university dashboards, curated materials, other languages |

## Appendix A: Scenario library and scripts

The scenario scripts are part of this PRD by reference. The student picks one of three scenarios. All use the same engine, rubric and persona prompt. Scenarios 2 and 3 are beta until tested.

| # | Scenario | Student role | Situation and twist | Full script |
| --- | --- | --- | --- | --- |
| 1 | Adaeze’s Fabrics | Accountant | A key customer wants 20% off and delivery by 2pm while the ₦350,000 Kano Textiles invoice is overdue. Cash is ₦480,000. Halfway, Kano cancels supply. | [Scenario 1 script and answer key](https://claude.ai/artifact/Mt2ZvkWHq6owNgRo4iQ9Uc) |
| 2 | Funke’s Kitchen | Operations Coordinator | A 120-pack corporate lunch is due at 12:30pm. Cooking gas runs short, so only 70 packs can be ready. Options: outsource, split the delivery with a credit, or refund. | [Scenario Library, section 3](https://claude.ai/artifact/QNuEqG5sqKC5MCnRX7qbKZ) |
| 3 | BrightPath Digital | Project Lead | The client moves the launch from Friday to Wednesday and adds a ₦70,000 video. The budget stays fixed at ₦300,000. | [Scenario Library, section 4](https://claude.ai/artifact/QNuEqG5sqKC5MCnRX7qbKZ) |

**Script at a glance.** Every scenario follows the same pattern: a 3 minute private brief, a 15 minute huddle with the twist at the halfway point, and a 5 minute individual task. The student picks up to 2 teammates from that scenario’s roster. Demo mode runs a 90 second huddle.

| # | Opening line | Twist | Individual task |
| --- | --- | --- | --- |
| 1 | Adaeze: Mrs Bello wants 20% off and delivery by 2pm. Sort it out between you. | Adaeze: Bad news. Kano Textiles has cancelled our supply because the ₦350,000 invoice is overdue. They will talk again if we pay something today. Give me options I can afford. | Write your recommendation to Adaeze in 2 to 4 sentences: what you do about the discount and the Kano invoice, with numbers, and why. |
| 2 | Funke: Mr Bassey’s office needs 120 lunch packs at 12:30. Today cannot go wrong. Work together and tell me what you need. | Funke: Bad news. The gas supplier cannot deliver a refill until 3pm. Chidi says we can only finish 70 packs by 12:30. Mr Bassey expects all 120. What are our options? | Write your recommendation to Funke in 2 to 4 sentences: how you would handle the 50-pack shortfall, comparing at least two options with numbers, and why. |
| 3 | Kunle: Zuri Skincare launches on Friday. The budget is ₦300,000 and it is fixed. Keep the client happy and keep us on budget. | Kunle: Ms Adaobi wants to launch on Wednesday, not Friday, and add a 15-second product video that costs ₦70,000. The total budget stays at ₦300,000. What do we do? | Write your recommendation to Kunle in 2 to 4 sentences: how you would handle the earlier launch and the extra video within the ₦300,000 budget, with numbers, and why. |

All facts are invented for the simulation. Figures marked to confirm in the scripts still need a check with a real SME owner.

## Appendix B: Related documents

| Document | Purpose |
| --- | --- |
| [SabiLab: AI Scoring Prompt and Rubric](https://claude.ai/artifact/SqqCWwALpzas7cAHCQ4ZqP) | Prompts, rubric, verification and fairness tests (English only, v0.2) |
| [Adaeze’s Fabrics: Scenario Script and Answer Key](https://claude.ai/artifact/Mt2ZvkWHq6owNgRo4iQ9Uc) | Scenario 1 in full, shared persona prompt, timeline, solo simulation scripts |
| [SabiLab: Scenario Library](https://claude.ai/artifact/QNuEqG5sqKC5MCnRX7qbKZ) | Scenarios 2 and 3 in full, and the template for adding more |
| [SabiLab: Build Spec and Test Guide](https://claude.ai/artifact/7hWUEZhaqc9qfSyku1XH2v) | Build order, data model, safeguards, test protocol, human rating and employer interview guides |

## Appendix C: Rework of 8 November

The concept was reworked after reviewing the first prototype, which felt too simple and chat-based.

**What changed**

- Each workplace is now a visual scene with objects the student can inspect, so they understand the place and its culture.
- A Foundation Check suggests where to start, instead of a random simulation.
- Accounts with a username and password, with data protection requirements.
- A short, plain-language landing page.
- An activity history on each user’s page.
- Three workplaces with three different jobs: Accountant, Operations Coordinator and Project Lead.

**Start building from** [SabiLab: Build Spec and Test Guide (v0.2)](https://claude.ai/artifact/2sgpoTh4roWpYz1RPfnjhs). It replaces the earlier build spec. A reference prototype is [here](https://claude.ai/artifact/8adZ3iLiRaAXNGnThbzEVb).

**New risks**

| Risk | Mitigation |
| --- | --- |
| Visual scenes may be heavy on basic phones and low data | Illustrated 2D first, short looping video only if it passes a mobile-data test, still image fallback, measure before adding 3D |
| Account security mistakes | Established libraries, server-side only, a security-aware review, and a qualified adviser on data protection law |
| No password reset without email | Decide before launch. One option is a recovery code shown once. |
| The Foundation Check read as a measure of ability | Label it a suggestion and review the wording |
| More scope in four days | Cut order in the build spec. Never cut the scoring pipeline, the Evidence Card, or consent with secure accounts. |
