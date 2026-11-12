import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";

/**
 * Database client.
 *
 * Development and the hackathon demo run on PGlite: a real Postgres engine
 * compiled to WASM, persisted to .data/pglite. No server to install.
 *
 * Production runs on managed Postgres via DATABASE_URL. The schema, queries and
 * migrations are identical; only the client changes.
 *
 * When DATABASE_URL is set, use node-postgres. Otherwise fall back to PGlite.
 */

type DbClient = PgliteDatabase<typeof schema>;

type PgliteState = {
  kind: "pglite";
  db: DbClient;
  client: PGlite;
};

type PostgresState = {
  kind: "postgres";
  db: DbClient;
  pool: Pool;
};

type DbState = PgliteState | PostgresState;

const globalForDb = globalThis as unknown as {
  __sabilabDb?: Promise<DbState>;
};

async function initPglite(): Promise<PgliteState> {
  const dataDir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  mkdirSync(dataDir, { recursive: true });
  const client = new PGlite(dataDir);

  const ddl = readFileSync(
    path.join(process.cwd(), "db", "schema.sql"),
    "utf8",
  );
  await client.exec(ddl);

  return { kind: "pglite", db: drizzlePglite(client, { schema }), client };
}

async function initPostgres(): Promise<PostgresState> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  // Serverless hosts run many short-lived instances against one database, so the
  // pool stays small and connections are recycled quickly. The Supabase pooler
  // (transaction mode) is the intended production target: the direct host is
  // IPv6-only and unreachable from Netlify and Vercel functions.
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

  const ddl = readFileSync(
    path.join(process.cwd(), "db", "schema.sql"),
    "utf8",
  );
  await pool.query(ddl);

  // Both clients operate on the same schema, so the typed db surface is shared.
  return {
    kind: "postgres",
    db: drizzleNodePostgres(pool, { schema }) as unknown as DbClient,
    pool,
  };
}

function isServerlessHost(): boolean {
  return Boolean(process.env.VERCEL || process.env.NETLIFY);
}

async function init(): Promise<DbState> {
  if (process.env.DATABASE_URL) {
    return initPostgres();
  }
  if (isServerlessHost()) {
    throw new Error(
      "DATABASE_URL is not set. Managed Postgres is required on serverless hosts; " +
        "PGlite cannot persist to the read-only function filesystem.",
    );
  }
  return initPglite();
}

export function getDb(): Promise<DbState> {
  if (!globalForDb.__sabilabDb) {
    globalForDb.__sabilabDb = init().catch((error) => {
      globalForDb.__sabilabDb = undefined;
      throw error;
    });
  }
  return globalForDb.__sabilabDb;
}

export function isPglite(db: DbState): db is PgliteState {
  return db.kind === "pglite";
}
