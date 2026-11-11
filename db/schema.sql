-- SabiLab schema v0.1
-- Postgres dialect. Runs against PGlite in development and managed Postgres in production.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  username_lower TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  consent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions (user_id);

CREATE TABLE IF NOT EXISTS sim_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario_slug TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'demo',
  state TEXT NOT NULL DEFAULT 'brief',
  started_at TIMESTAMPTZ NOT NULL,
  brief_ends_at TIMESTAMPTZ NOT NULL,
  huddle_ends_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  twist_at TIMESTAMPTZ NOT NULL,
  twist_fired_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  grace_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sim_sessions_user_idx ON sim_sessions (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sim_sessions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  display_name TEXT NOT NULL,
  persona_key TEXT,
  seat INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS participants_session_idx ON participants (session_id);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sim_sessions(id) ON DELETE CASCADE,
  participant_id TEXT REFERENCES participants(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_session_idx ON messages (session_id, created_at);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sim_sessions(id) ON DELETE CASCADE,
  object_id TEXT NOT NULL,
  label TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, object_id)
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  user_id TEXT,
  type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_type_idx ON events (type, created_at DESC);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE REFERENCES sim_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL DEFAULT '',
  word_count INTEGER NOT NULL DEFAULT 0,
  draft_updated_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  rubric_version TEXT NOT NULL,
  confidence REAL NOT NULL,
  needs_review BOOLEAN NOT NULL DEFAULT true,
  summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS criterion_scores (
  id TEXT PRIMARY KEY,
  score_id TEXT NOT NULL REFERENCES scores(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,
  level TEXT NOT NULL,
  quote TEXT,
  rationale TEXT NOT NULL,
  confidence REAL NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  start_offset INTEGER,
  end_offset INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS criterion_scores_score_idx ON criterion_scores (score_id);

CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES sim_sessions(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,
  level TEXT NOT NULL,
  tier TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_public BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (session_id, dimension)
);

CREATE TABLE IF NOT EXISTS evidence_cards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE REFERENCES sim_sessions(id) ON DELETE CASCADE,
  public_slug TEXT NOT NULL UNIQUE,
  visibility JSONB NOT NULL DEFAULT '{"quotes":true}',
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
