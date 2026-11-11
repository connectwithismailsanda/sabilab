import { defineConfig } from "drizzle-kit";

/**
 * Only used when generating migrations for managed Postgres.
 * Local development applies db/schema.sql through lib/db/index.ts.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/sabilab",
  },
});
