import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  usernameLower: text("username_lower").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const authSessions = pgTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const simSessions = pgTable("sim_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  scenarioSlug: text("scenario_slug").notNull(),
  mode: text("mode").notNull().default("demo"),
  state: text("state").notNull().default("brief"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  briefEndsAt: timestamp("brief_ends_at", { withTimezone: true }).notNull(),
  huddleEndsAt: timestamp("huddle_ends_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  twistAt: timestamp("twist_at", { withTimezone: true }).notNull(),
  twistFiredAt: timestamp("twist_fired_at", { withTimezone: true }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  graceUsed: boolean("grace_used").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const participants = pgTable("participants", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => simSessions.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  displayName: text("display_name").notNull(),
  personaKey: text("persona_key"),
  seat: integer("seat").notNull().default(0),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => simSessions.id, { onDelete: "cascade" }),
  participantId: text("participant_id").references(() => participants.id, {
    onDelete: "set null",
  }),
  body: text("body").notNull(),
  kind: text("kind").notNull().default("chat"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => simSessions.id, { onDelete: "cascade" }),
  objectId: text("object_id").notNull(),
  label: text("label").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  sessionId: text("session_id"),
  userId: text("user_id"),
  type: text("type").notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .unique()
    .references(() => simSessions.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull().default(""),
  wordCount: integer("word_count").notNull().default(0),
  draftUpdatedAt: timestamp("draft_updated_at", { withTimezone: true }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const scores = pgTable("scores", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .unique()
    .references(() => tasks.id, { onDelete: "cascade" }),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull(),
  rubricVersion: text("rubric_version").notNull(),
  confidence: real("confidence").notNull(),
  needsReview: boolean("needs_review").notNull().default(true),
  summary: jsonb("summary").$type<ScoreSummary>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const criterionScores = pgTable("criterion_scores", {
  id: text("id").primaryKey(),
  scoreId: text("score_id")
    .notNull()
    .references(() => scores.id, { onDelete: "cascade" }),
  dimension: text("dimension").notNull(),
  level: text("level").notNull(),
  quote: text("quote"),
  rationale: text("rationale").notNull(),
  confidence: real("confidence").notNull(),
  verified: boolean("verified").notNull().default(false),
  startOffset: integer("start_offset"),
  endOffset: integer("end_offset"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const badges = pgTable("badges", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id")
    .notNull()
    .references(() => simSessions.id, { onDelete: "cascade" }),
  dimension: text("dimension").notNull(),
  level: text("level").notNull(),
  tier: text("tier").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  isPublic: boolean("is_public").notNull().default(false),
});

export const evidenceCards = pgTable("evidence_cards", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id")
    .notNull()
    .unique()
    .references(() => simSessions.id, { onDelete: "cascade" }),
  publicSlug: text("public_slug").notNull().unique(),
  visibility: jsonb("visibility")
    .$type<{ quotes: boolean }>()
    .notNull()
    .default({ quotes: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ScoreCriterionDetail = {
  id: string;
  name: string;
  dimension: string;
  level: string;
  quote: string | null;
  reason: string;
  confidence: number;
  verified: boolean;
  counterEvidence: string | null;
};

export type ScoreSummary = {
  strengths: string[];
  improvements: string[];
  needsClarification: boolean;
  engine: string;
  label: string;
  flags?: { type: "tone"; quote: string; note: string }[];
  figures?: number[];
  clarifyingQuestions?: string[];
  usage?: { inputTokens: number; outputTokens: number };
  rubricStatus?: "draft" | "calibrated" | "stub";
  criteria?: ScoreCriterionDetail[];
  feedback?: {
    strengthQuote: string | null;
    strengthNote: string | null;
    improvement: string | null;
    rewrite: string | null;
  };
  possibleInjection?: boolean;
};

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type SimSession = typeof simSessions.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type CriterionScore = typeof criterionScores.$inferSelect;
