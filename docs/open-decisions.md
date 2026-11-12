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

## 4. Managed Postgres migration — DONE

`lib/db/index.ts` runs `drizzle-orm/node-postgres` against `DATABASE_URL` when the
variable is set, and PGlite otherwise for local development. The schema in
`db/schema.sql` is Postgres-dialect and runs against both; queries do not change.

The Supabase free-tier project `yyooitzrmzgxnkhbhorl` (region `us-east-1`) is
live with all 12 tables created, and the app's own smoke suite passes against it.

### The connection string that matters

```text
postgresql://postgres.yyooitzrmzgxnkhbhorl:<password>@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=no-verify
```

Two things bite here, and both cost a full debugging cycle:

1. **Use the pooler, not the direct host.** `db.yyooitzrmzgxnkhbhorl.supabase.co`
   resolves to an IPv6-only address. Netlify and Vercel functions have no IPv6
   egress, so the direct host fails with `ENOTFOUND`. The pooler host
   (`aws-0-<region>.pooler.supabase.com`) is IPv4 and reachable.
2. **The username changes.** The pooler expects `postgres.<project-ref>`, not
   `postgres`.

`sslmode=no-verify` is required because the pooler's certificate does not chain
to a public CA for the pooler hostname. `sslmode=require` maps to `verify-full`
in `pg-connection-string` and fails with "self-signed certificate in chain".

## 5. Password rotation

The database password has been shared in chat while debugging. Rotate it in
Supabase (Settings → Database), then update `DATABASE_URL` on Netlify and
redeploy. The old password stops working immediately.
