CREATE TABLE IF NOT EXISTS questions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type          TEXT    NOT NULL CHECK(type IN ('grid3x3','tiles','slider','audio','imageCode')),
  title         TEXT    NOT NULL,
  base_score    INTEGER NOT NULL DEFAULT 100,
  time_limit_ms INTEGER NOT NULL,
  active        INTEGER NOT NULL DEFAULT 1,
  order_index   INTEGER NOT NULL DEFAULT 0,
  payload       TEXT    NOT NULL,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id                    TEXT    PRIMARY KEY,
  last_name             TEXT    NOT NULL,
  first_name            TEXT    NOT NULL,
  started_at            INTEGER NOT NULL,
  finished_at           INTEGER,
  total_score           INTEGER NOT NULL DEFAULT 0,
  hidden_from_dashboard INTEGER NOT NULL DEFAULT 0,
  current_question_idx  INTEGER NOT NULL DEFAULT 0,
  question_ids_snapshot TEXT    NOT NULL,
  client_fingerprint    TEXT
);

CREATE TABLE IF NOT EXISTS answers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT    NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id),
  started_at  INTEGER NOT NULL,
  answered_at INTEGER NOT NULL,
  elapsed_ms  INTEGER NOT NULL,
  answer_data TEXT    NOT NULL,
  correct     INTEGER NOT NULL,
  score       INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_answers (
  session_id  TEXT    NOT NULL,
  question_id INTEGER NOT NULL,
  started_at  INTEGER NOT NULL,
  PRIMARY KEY (session_id, question_id)
);

CREATE TABLE IF NOT EXISTS uploads (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  filename   TEXT    NOT NULL UNIQUE,
  mime       TEXT    NOT NULL,
  size       INTEGER NOT NULL,
  width      INTEGER,
  height     INTEGER,
  created_at INTEGER NOT NULL
);

-- Quiz formation settings: counts per question type, stored as JSON
CREATE TABLE IF NOT EXISTS quiz_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_questions_active_order ON questions(active, order_index, id);
CREATE INDEX IF NOT EXISTS idx_sessions_finished_hidden ON sessions(finished_at, hidden_from_dashboard, total_score);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_answers_session ON answers(session_id);
