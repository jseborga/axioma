-- Axioma · esquema D1
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,          -- "sub" de Google
  email      TEXT NOT NULL,
  name       TEXT,
  picture    TEXT,
  created_at INTEGER NOT NULL,
  last_seen  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS scores (
  user_id    TEXT NOT NULL REFERENCES users(id),
  day        INTEGER NOT NULL,          -- número del reto diario
  moves      INTEGER NOT NULL,
  hints      INTEGER NOT NULL DEFAULT 0,
  seconds    INTEGER NOT NULL DEFAULT 0,   -- tiempo empleado
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, day)
);
CREATE INDEX IF NOT EXISTS scores_day ON scores(day, moves, hints, created_at);
