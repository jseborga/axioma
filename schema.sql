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

-- ============================================================
-- The Final Test · instituciones, cursos y bancos de preguntas
-- ============================================================
-- Perfil: aceptación de términos y fecha de nacimiento, obligatorios
-- antes de unirse a una institución, un curso o un concurso.
CREATE TABLE IF NOT EXISTS profiles (
  user_id        TEXT PRIMARY KEY REFERENCES users(id),
  birthdate      TEXT,                   -- AAAA-MM-DD
  terms_version  TEXT,                   -- versión de términos y privacidad aceptada
  terms_at       INTEGER,
  guardian_name  TEXT,                   -- menores de 18: madre, padre o tutor
  guardian_email TEXT,
  guardian_ok    INTEGER NOT NULL DEFAULT 0, -- consentimiento del tutor confirmado
  updated_at     INTEGER NOT NULL
);
-- Institución (universidad, instituto, colegio, empresa o comunidad)
CREATE TABLE IF NOT EXISTS orgs (
  id           TEXT PRIMARY KEY,         -- código corto
  name         TEXT NOT NULL,
  kind         TEXT NOT NULL,
  email_domain TEXT,                     -- si se indica, solo entran cuentas de ese dominio
  levels       TEXT NOT NULL,            -- estructura configurable, JSON: ["Facultad","Carrera","Materia"]
  status       TEXT NOT NULL,            -- pendiente | activa | suspendida
  teacher_code TEXT NOT NULL,            -- enlace para que se unan docentes
  created_by   TEXT NOT NULL REFERENCES users(id),
  created_at   INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS org_members (
  org_id       TEXT NOT NULL REFERENCES orgs(id),
  user_id      TEXT NOT NULL REFERENCES users(id),
  role         TEXT NOT NULL,            -- admin | docente | auxiliar | estudiante | auspiciador
  student_code TEXT,                     -- registro universitario o código interno
  consent_ok   INTEGER NOT NULL DEFAULT 0, -- la institución tiene el consentimiento del tutor
  joined_at    INTEGER NOT NULL,
  PRIMARY KEY (org_id, user_id)
);
CREATE INDEX IF NOT EXISTS org_members_user ON org_members(user_id);
-- Unidades de la estructura (facultades, carreras, materias…), en árbol
CREATE TABLE IF NOT EXISTS org_units (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id     TEXT NOT NULL REFERENCES orgs(id),
  parent_id  INTEGER,
  depth      INTEGER NOT NULL,           -- 0 = primer nivel
  name       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS org_units_org ON org_units(org_id, depth);
-- Curso o paralelo: se entra con su código o enlace
CREATE TABLE IF NOT EXISTS courses (
  code       TEXT PRIMARY KEY,
  org_id     TEXT NOT NULL REFERENCES orgs(id),
  unit_id    INTEGER,                    -- materia (u otra unidad) a la que pertenece
  name       TEXT NOT NULL,
  term       TEXT,                       -- gestión: 1/2026, 2/2026…
  owner_id   TEXT NOT NULL REFERENCES users(id),
  approval   INTEGER NOT NULL DEFAULT 0, -- el docente aprueba a cada estudiante
  archived   INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS courses_org ON courses(org_id);
CREATE TABLE IF NOT EXISTS course_members (
  code      TEXT NOT NULL REFERENCES courses(code),
  user_id   TEXT NOT NULL REFERENCES users(id),
  role      TEXT NOT NULL,               -- docente | auxiliar | estudiante
  status    TEXT NOT NULL,               -- activo | pendiente
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (code, user_id)
);
CREATE INDEX IF NOT EXISTS course_members_user ON course_members(user_id);
-- Bancos de preguntas de cada docente dentro de su institución
CREATE TABLE IF NOT EXISTS banks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id     TEXT NOT NULL REFERENCES orgs(id),
  owner_id   TEXT NOT NULL REFERENCES users(id),
  name       TEXT NOT NULL,
  unit_id    INTEGER,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS bank_questions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_id    INTEGER NOT NULL REFERENCES banks(id),
  level      INTEGER NOT NULL,           -- 1 fácil · 2 medio · 3 difícil
  topic      TEXT,
  q          TEXT NOT NULL,
  opts       TEXT NOT NULL,              -- JSON, la correcta es la de índice answer
  answer     INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS bank_questions_bank ON bank_questions(bank_id);
-- A quién va dirigido cada concurso o cuestionario, y sus preguntas congeladas
CREATE TABLE IF NOT EXISTS contest_scope (
  code        TEXT PRIMARY KEY REFERENCES contests(code),
  kind        TEXT NOT NULL,             -- concurso | cuestionario
  audience    TEXT NOT NULL,             -- publico | enlace | org | curso
  org_id      TEXT,
  course_code TEXT,
  bank_id     INTEGER,
  partial     TEXT,                      -- Práctica, Primer parcial…
  pool        TEXT,                      -- JSON con las preguntas del banco al crear
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS contest_scope_course ON contest_scope(course_code);
CREATE INDEX IF NOT EXISTS contest_scope_org ON contest_scope(org_id);

-- ============================================================
-- The Final Test · empresas, marcas e invitados
-- ============================================================
-- Marca pública de una institución o empresa: su página (?marca=slug),
-- su color y su logo, para compartir convocatorias con QR.
CREATE TABLE IF NOT EXISTS org_brand (
  org_id      TEXT PRIMARY KEY REFERENCES orgs(id),
  slug        TEXT NOT NULL UNIQUE,
  color       TEXT,
  logo        TEXT,                     -- imagen pequeña en data URL
  tagline     TEXT,
  description TEXT,
  website     TEXT,
  updated_at  INTEGER NOT NULL
);
-- Altas de administración o docencia por correo: se aplican cuando esa
-- persona entra con Google.
CREATE TABLE IF NOT EXISTS org_invites (
  org_id     TEXT NOT NULL REFERENCES orgs(id),
  email      TEXT NOT NULL,
  role       TEXT NOT NULL,
  invited_by TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (org_id, email)
);
CREATE INDEX IF NOT EXISTS org_invites_email ON org_invites(email);
-- Opciones de una convocatoria: si admite jugadores invitados
CREATE TABLE IF NOT EXISTS contest_options (
  code       TEXT PRIMARY KEY REFERENCES contests(code),
  guests     INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
-- Jugadores invitados: sin Google, verificados con un código por SMS o
-- correo. Su usuario se deriva del contacto, así que un mismo teléfono o
-- correo es siempre la misma persona (una participación por convocatoria).
CREATE TABLE IF NOT EXISTS guests (
  user_id     TEXT PRIMARY KEY REFERENCES users(id),
  channel     TEXT NOT NULL,            -- sms | email
  contact     TEXT NOT NULL,            -- teléfono o correo normalizado
  verified_by TEXT NOT NULL,            -- prueba (códigos ficticios) | sms | email
  created_at  INTEGER NOT NULL,
  verified_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS guests_contact ON guests(contact);
-- Códigos de verificación pendientes
CREATE TABLE IF NOT EXISTS verify_codes (
  id         TEXT PRIMARY KEY,
  channel    TEXT NOT NULL,
  contact    TEXT NOT NULL,
  code_hash  TEXT NOT NULL,
  data       TEXT NOT NULL,             -- nombre, fecha de nacimiento, consentimientos
  ip         TEXT,
  attempts   INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  used_at    INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS verify_codes_contact ON verify_codes(contact, created_at);
CREATE INDEX IF NOT EXISTS verify_codes_ip ON verify_codes(ip, created_at);
-- Consentimiento para que una institución o empresa contacte a un participante
CREATE TABLE IF NOT EXISTS contact_consents (
  user_id    TEXT NOT NULL REFERENCES users(id),
  org_id     TEXT NOT NULL REFERENCES orgs(id),
  marketing  INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, org_id)
);
-- Usuarios bloqueados por la administración de la plataforma
CREATE TABLE IF NOT EXISTS user_blocks (
  user_id    TEXT PRIMARY KEY,
  reason     TEXT,
  blocked_by TEXT,
  created_at INTEGER NOT NULL
);

-- ============================================================
-- The Final Test · salas de juego en vivo
-- ============================================================
-- Cada sala vive en un Durable Object; aquí queda su ficha para
-- listarlas, controlar el acceso y sacar métricas.
CREATE TABLE IF NOT EXISTS salas (
  code       TEXT PRIMARY KEY,
  juego      TEXT NOT NULL,
  host_id    TEXT NOT NULL REFERENCES users(id),
  org_id     TEXT,
  acceso     TEXT NOT NULL,             -- libre | invitados | cuenta
  titulo     TEXT,
  premio     TEXT,
  estado     TEXT NOT NULL,             -- espera | terminada
  jugadores  INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  ended_at   INTEGER
);
CREATE INDEX IF NOT EXISTS salas_host ON salas(host_id, created_at);
CREATE INDEX IF NOT EXISTS salas_org ON salas(org_id, created_at);
-- Resultado de cada participante al terminar una partida
CREATE TABLE IF NOT EXISTS sala_jugadores (
  code       TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  nombre     TEXT,
  puesto     INTEGER,
  puntos     INTEGER,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (code, user_id)
);

-- ============================================================
-- The Final Test · trivia sin repetir y por áreas
-- ============================================================
-- Qué preguntas del banco general ha visto cada jugador (quien = id del
-- usuario) o ha usado cada organizador en sus salas (quien = "org:ID" o
-- "host:ID"). Al armar una partida se evitan las de los últimos 60 días.
CREATE TABLE IF NOT EXISTS preguntas_vistas (
  quien    TEXT NOT NULL,
  qid      TEXT NOT NULL,
  visto_at INTEGER NOT NULL,
  PRIMARY KEY (quien, qid)
);
CREATE INDEX IF NOT EXISTS preguntas_vistas_fecha ON preguntas_vistas(quien, visto_at);
-- Secuencia de preguntas de cada participante de un concurso, fijada al
-- empezar: así no cambia aunque el banco se amplíe con el concurso abierto.
CREATE TABLE IF NOT EXISTS contest_seq (
  code       TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  qids       TEXT NOT NULL,             -- JSON: ["q<id>", "m<nivel>", …]
  created_at INTEGER NOT NULL,
  PRIMARY KEY (code, user_id)
);
-- Áreas temáticas elegidas para un concurso (si no hay fila: todas)
CREATE TABLE IF NOT EXISTS contest_areas (
  code  TEXT PRIMARY KEY,
  areas TEXT NOT NULL                   -- JSON: ["bol", "his", …]
);

-- ============================================================
-- The Final Test · Educativo: prácticas, grupos y alta masiva
-- ============================================================
-- Opciones de un cuestionario de curso: examen (un intento, nota al
-- cierre) o práctica (intentos ilimitados, corrección al momento), y
-- a qué grupo del curso va dirigido (NULL: a todo el curso).
CREATE TABLE IF NOT EXISTS cuestionario_opciones (
  code     TEXT PRIMARY KEY,
  modo     TEXT NOT NULL DEFAULT 'examen',   -- examen | practica
  grupo_id INTEGER,
  explica  INTEGER NOT NULL DEFAULT 0        -- explicaciones con IA en la práctica (plan Pro)
);
-- Cada intento de una práctica
CREATE TABLE IF NOT EXISTS practica_intentos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  code       TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  aciertos   INTEGER NOT NULL,
  total      INTEGER NOT NULL,
  ms         INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS practica_intentos_user ON practica_intentos(code, user_id);
-- Grupos dentro de un curso (laboratorio, turno…); cada estudiante en uno como mucho
CREATE TABLE IF NOT EXISTS course_groups (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  code       TEXT NOT NULL,
  name       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS course_groups_code ON course_groups(code);
CREATE TABLE IF NOT EXISTS course_group_members (
  code     TEXT NOT NULL,
  user_id  TEXT NOT NULL,
  group_id INTEGER NOT NULL,
  PRIMARY KEY (code, user_id)
);
-- Alta masiva: estudiantes dados de alta por correo que aún no han entrado
CREATE TABLE IF NOT EXISTS course_invites (
  code         TEXT NOT NULL,
  email        TEXT NOT NULL,
  name         TEXT,
  student_code TEXT,
  invited_by   TEXT,
  created_at   INTEGER NOT NULL,
  PRIMARY KEY (code, email)
);
CREATE INDEX IF NOT EXISTS course_invites_email ON course_invites(email);

-- ============================================================
-- The Final Test · plan Pro y ayudas con IA
-- ============================================================
-- Plan de cada institución o empresa: lo activa la administración de la
-- plataforma (gratis | pro), con un límite mensual de usos de IA.
CREATE TABLE IF NOT EXISTS org_planes (
  org_id     TEXT PRIMARY KEY,
  plan       TEXT NOT NULL DEFAULT 'gratis',
  cuota      INTEGER NOT NULL DEFAULT 0,      -- usos de IA al mes
  hasta      INTEGER,                         -- fin del plan (ms); NULL = sin fecha
  nota       TEXT,
  updated_at INTEGER NOT NULL,
  updated_by TEXT
);
-- Usos de IA por institución y mes («2026-09»)
CREATE TABLE IF NOT EXISTS ia_uso (
  org_id TEXT NOT NULL,
  mes    TEXT NOT NULL,
  usos   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (org_id, mes)
);
-- Explicaciones generadas para las prácticas (se reutilizan)
CREATE TABLE IF NOT EXISTS ia_explicaciones (
  clave      TEXT PRIMARY KEY,               -- b<id de pregunta del banco> | g<id del banco general>
  texto      TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- =========================================================
-- Mis preguntas: bancos personales para jugar (retos y trivia en vivo)
-- Los bancos de las instituciones educativas no se usan en juegos.
-- =========================================================
CREATE TABLE IF NOT EXISTS mis_bancos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id   TEXT NOT NULL REFERENCES users(id),
  name       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS mis_bancos_owner ON mis_bancos(owner_id);
CREATE TABLE IF NOT EXISTS mis_preguntas (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  banco_id   INTEGER NOT NULL,
  q          TEXT NOT NULL,
  opts       TEXT NOT NULL,                  -- JSON; la correcta es la de answer
  answer     INTEGER NOT NULL DEFAULT 0,
  level      INTEGER NOT NULL DEFAULT 1,
  topic      TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS mis_preguntas_banco ON mis_preguntas(banco_id);
-- Preguntas propias de un reto de trivia, congeladas al crearlo
CREATE TABLE IF NOT EXISTS reto_preguntas (
  event_code TEXT PRIMARY KEY,
  fuente     TEXT NOT NULL,                  -- m<id> banco personal | b<id> banco de empresa
  nombre     TEXT,
  pool       TEXT NOT NULL                   -- JSON [[pregunta,[correcta,otra,…]],…]
);

-- =========================================================
-- Tipos de pregunta, imágenes y desarrollo (bancos de las instituciones)
-- =========================================================
CREATE TABLE IF NOT EXISTS bank_question_extra (
  question_id INTEGER PRIMARY KEY,           -- bank_questions.id
  tipo        TEXT NOT NULL DEFAULT 'opcion', -- opcion | vf | numerica | abierta
  num         TEXT,                          -- JSON {v, tol} de las numéricas
  imagen      TEXT,                          -- id en preguntas_imagenes (enunciado)
  opt_imgs    TEXT,                          -- JSON [id|null] alineado con opts
  desarrollo  TEXT                           -- resolución paso a paso
);
CREATE TABLE IF NOT EXISTS preguntas_imagenes (
  id         TEXT PRIMARY KEY,               -- 20 caracteres al azar
  org_id     TEXT,
  owner_id   TEXT NOT NULL,
  tipo       TEXT NOT NULL,                  -- image/jpeg | image/png | image/webp
  data       TEXT NOT NULL,                  -- base64
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS preguntas_imagenes_owner ON preguntas_imagenes(owner_id, created_at);
-- Respuestas escritas de los cuestionarios: numéricas (corregidas solas) y de
-- texto libre (pendientes hasta que el docente las califica)
CREATE TABLE IF NOT EXISTS contest_textos (
  code         TEXT NOT NULL,
  user_id      TEXT NOT NULL,
  idx          INTEGER NOT NULL,
  texto        TEXT NOT NULL,
  estado       TEXT NOT NULL,                -- pendiente | correcta | incorrecta
  comentario   TEXT,
  revisado_por TEXT,
  revisado_at  INTEGER,
  created_at   INTEGER NOT NULL,
  PRIMARY KEY (code, user_id, idx)
);
