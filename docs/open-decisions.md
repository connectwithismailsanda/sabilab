# Open decisions for deployment

These need a product/engineering decision before the build is deployed to real
users. They are documented here so they are not lost.

## 1. Model/provider pinning and budget cap

### What needs deciding

| Decision | Options | Recommendation |
|---|---|---|
| Provider | OpenAI (default) or Anthropic | Pick one, pin it in `.env.local` and Vercel |
| Scoring model | Exact model ID (no aliases) | Pin the model you tested against rubric v0.2 |
| Reading model | Optional cheaper model | Use a smaller/faster model for the reading pass |
| Budget cap | Per-user/day spend limit | Not implemented yet; add before pilot |

### Why it matters

- Without a pinned model, scores can drift when the provider retires or changes a model alias.
- Without a budget cap, a public pilot has no spend guardrail. `max_tokens` is capped per call (1200 reading / 2600 scoring), but there is no per-user or per-day limit.
- `SABILAB_LLM_READING_MODEL` and `SABILAB_LLM_SCORING_MODEL` are already supported by the code; they just need values.

### Where to set

`.env.local` (dev) and Vercel environment variables (production):

```
SABILAB_LLM_PROVIDER=openai
SABILAB_LLM_API_KEY=<key>
SABILAB_LLM_MODEL=<exact-model-id>
SABILAB_LLM_READING_MODEL=<optional-cheaper-model>
SABILAB_LLM_SCORING_MODEL=<optional-stronger-model>
```

## 2. Consent copy for third-party processing

### What was done

The signup consent checkbox now says:

> "I agree that SabiLab stores my username and my work for my account, and that
> my task answer may be sent to an AI model provider for scoring. I can delete
> my account and data at any time."

### What still needs review

- Nigerian Data Protection Act 2023 compliance review.
- Whether the consent should be granular (separate checkboxes for storage vs AI scoring).
- Whether the privacy page/terms need a dedicated "third-party processors" section naming the model provider.

## 3. Password recovery

No email by design. Options:

- **One-time recovery code shown at sign-up** (recommended): display once, hash it in `users.recovery_code_hash`, allow password reset with code + username.
- **Accept permanent lockout**: simpler, but hostile to real users. Not recommended for a pilot.

## 4. Managed Postgres migration

Replace `lib/db/index.ts` PGlite client with `drizzle-orm/node-postgres` + `DATABASE_URL`. The schema in `db/schema.sql` is already Postgres-dialect and runs against both PGlite and managed Postgres. Queries do not change.
