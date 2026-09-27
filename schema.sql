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

-- Sudoku: mejor tiempo de cada jugador en el tablero del día de cada nivel
CREATE TABLE IF NOT EXISTS sudoku (
  user_id    TEXT NOT NULL REFERENCES users(id),
  day        INTEGER NOT NULL,
  level      INTEGER NOT NULL,          -- 1 fácil … 4 experto
  seconds    INTEGER NOT NULL,
  errors     INTEGER NOT NULL DEFAULT 0,
  hints      INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, day, level)
);
CREATE INDEX IF NOT EXISTS sudoku_day ON sudoku(day, level, seconds, created_at);

-- ============================================================
-- Retos: concursos entre amigos con código, un tablero por día
-- y clasificación individual o por equipos. Los tableros los
-- genera el organizador al crear el reto y se guardan aquí, así
-- todos juegan exactamente el mismo y el servidor puede comprobar
-- cada resultado sin volver a generarlos.
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  code       TEXT PRIMARY KEY,          -- código corto para unirse (6 letras)
  name       TEXT NOT NULL,
  owner_id   TEXT NOT NULL REFERENCES users(id),
  game       TEXT NOT NULL DEFAULT 'sudoku', -- sudoku | trivia | memoria | calculo | reflejos | numeros
  level      INTEGER NOT NULL DEFAULT 0, -- nivel del sudoku, 1…5 (0 en los demás juegos)
  mode       TEXT NOT NULL DEFAULT 'solo',  -- 'solo' | 'equipo' | 'pareja'
  team_size  INTEGER NOT NULL DEFAULT 1,
  pace       TEXT NOT NULL DEFAULT 'diario', -- 'diario': una ronda por día · 'seguido': las rondas una tras otra
  start_day  INTEGER NOT NULL,          -- número de día en que empieza
  rounds     INTEGER NOT NULL,          -- rondas (tableros o partidas)
  days       INTEGER NOT NULL DEFAULT 1, -- días que dura (en ritmo diario, = rounds)
  prize      TEXT,                      -- premio para quien gane
  forfeit    TEXT,                      -- penitencia para quien quede último
  seed       INTEGER NOT NULL DEFAULT 0, -- semilla secreta de los juegos rápidos
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS event_rounds (
  event_code TEXT NOT NULL REFERENCES events(code),
  round      INTEGER NOT NULL,          -- 1…rounds
  puzzle     TEXT NOT NULL,             -- 81 cifras, 0 = vacía
  solution   TEXT NOT NULL,             -- 81 cifras
  PRIMARY KEY (event_code, round)
);
CREATE TABLE IF NOT EXISTS event_members (
  event_code TEXT NOT NULL REFERENCES events(code),
  user_id    TEXT NOT NULL REFERENCES users(id),
  team       TEXT,                      -- nombre del equipo (modo equipo o pareja)
  joined_at  INTEGER NOT NULL,
  PRIMARY KEY (event_code, user_id)
);
-- cuándo abrió cada jugador cada ronda (milisegundos): el tiempo de la
-- ronda lo mide el servidor desde ese momento
CREATE TABLE IF NOT EXISTS event_starts (
  event_code TEXT NOT NULL,
  round      INTEGER NOT NULL,
  user_id    TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  PRIMARY KEY (event_code, round, user_id)
);
CREATE TABLE IF NOT EXISTS event_results (
  event_code TEXT NOT NULL,
  round      INTEGER NOT NULL,
  user_id    TEXT NOT NULL,
  team       TEXT,
  seconds    INTEGER NOT NULL,          -- con penalizaciones incluidas
  score      INTEGER NOT NULL DEFAULT 0, -- puntos o milisegundos en los juegos rápidos
  errors     INTEGER NOT NULL DEFAULT 0,
  hints      INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (event_code, round, user_id)
);
CREATE INDEX IF NOT EXISTS event_results_code ON event_results(event_code, round, seconds);

-- ============================================================
-- Sudoku en pareja: una sala, un tablero, y las jugadas de los dos
-- pasan por el servidor, que es quien las comprueba y cronometra.
-- ============================================================
CREATE TABLE IF NOT EXISTS coop (
  code        TEXT PRIMARY KEY,
  level       INTEGER NOT NULL,
  puzzle      TEXT NOT NULL,
  solution    TEXT NOT NULL,
  owner_id    TEXT NOT NULL REFERENCES users(id),
  event_code  TEXT,                     -- si la sala es una ronda de un reto
  round       INTEGER,
  started_at  INTEGER,                  -- primera jugada
  finished_at INTEGER,                  -- última casilla
  errors      INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS coop_members (
  code      TEXT NOT NULL REFERENCES coop(code),
  user_id   TEXT NOT NULL REFERENCES users(id),
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (code, user_id)
);
CREATE TABLE IF NOT EXISTS coop_moves (
  code       TEXT NOT NULL,
  seq        INTEGER NOT NULL,
  user_id    TEXT NOT NULL,
  k          INTEGER NOT NULL,          -- casilla 0…80
  v          INTEGER NOT NULL,          -- cifra
  created_at INTEGER NOT NULL,
  PRIMARY KEY (code, seq)
);

-- ============================================================
-- Concursos de trivia: convocatorias con premio, fechas, dificultad
-- y errores admitidos. Una sola participación por persona; las
-- preguntas se generan en el servidor a partir de la semilla del
-- concurso y del jugador, así que no hace falta guardarlas.
-- ============================================================
CREATE TABLE IF NOT EXISTS contests (
  code          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  owner_id      TEXT NOT NULL REFERENCES users(id),
  prize         TEXT,
  description   TEXT,
  level         INTEGER NOT NULL,        -- 1 fácil · 2 medio · 3 difícil · 4 progresiva
  max_errors    INTEGER NOT NULL,        -- errores admitidos; uno más y termina la partida
  max_questions INTEGER NOT NULL,        -- 10, 20, 30, 50 o 100
  seconds_per_q INTEGER NOT NULL,        -- tiempo por pregunta
  math          INTEGER NOT NULL DEFAULT 1, -- una de cada cuatro, de cálculo
  public        INTEGER NOT NULL DEFAULT 0, -- aparece en la lista de concursos
  starts_at     INTEGER NOT NULL,        -- milisegundos
  ends_at       INTEGER NOT NULL,        -- milisegundos; entonces se publica el ranking
  seed          INTEGER NOT NULL,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS contests_public ON contests(public, ends_at);
CREATE TABLE IF NOT EXISTS contest_entries (
  code        TEXT NOT NULL REFERENCES contests(code),
  user_id     TEXT NOT NULL REFERENCES users(id),
  joined_at   INTEGER NOT NULL,
  started_at  INTEGER,                   -- primera pregunta: desde aquí ya cuenta la participación
  finished_at INTEGER,
  end_reason  TEXT,                      -- errores | completo | tiempo
  idx         INTEGER NOT NULL DEFAULT 0, -- preguntas respondidas
  correct     INTEGER NOT NULL DEFAULT 0,
  errors      INTEGER NOT NULL DEFAULT 0,
  total_ms    INTEGER NOT NULL DEFAULT 0, -- suma de tiempos de respuesta (desempate)
  q_sent_at   INTEGER,                   -- cuándo se envió la pregunta pendiente
  PRIMARY KEY (code, user_id)
);
CREATE INDEX IF NOT EXISTS contest_entries_rank ON contest_entries(code, correct, errors, total_ms);
CREATE TABLE IF NOT EXISTS contest_answers (
  code    TEXT NOT NULL,
  user_id TEXT NOT NULL,
  idx     INTEGER NOT NULL,
  chosen  INTEGER NOT NULL,              -- opción elegida; -1 si se agotó el tiempo
  ok      INTEGER NOT NULL,
  ms      INTEGER NOT NULL,
  PRIMARY KEY (code, user_id, idx)
);
