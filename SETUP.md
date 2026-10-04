# Puesta en marcha de The Final Test

Guía completa para publicar la app en Cloudflare, activar el inicio de sesión con
Google, crear la base de datos y consultar las estadísticas.

El juego funciona sin nada de esto: si no configuras el inicio de sesión, la app
se publica igual y sencillamente no muestra cuentas ni ranking. Puedes hacer solo
la parte 1 y dejar el resto para más adelante.

The Final Test se despliega como un **Worker** de Cloudflare (se llama `axioma`; no cambies el nombre, porque de él dependen la URL y los orígenes autorizados de Google): un único proyecto que sirve
los archivos del juego (la carpeta `public`) y atiende la API (la carpeta `src`).

**Lo que necesitas antes de empezar**

- Una cuenta de Cloudflare (el plan gratuito basta).
- Una cuenta de Google para crear el proyecto de OAuth.
- Node.js instalado, para poder usar `wrangler` desde la terminal.

---

## Parte 1 · Publicar la app en Cloudflare

1. Entra en [dash.cloudflare.com](https://dash.cloudflare.com).
2. Ve a **Workers & Pages**, pulsa **Create** y elige **Import a repository**
   (según la versión del panel puede aparecer como *Connect to Git*).
3. Autoriza GitHub y elige el repositorio `jseborga/axioma`, rama `main`.
4. En **Build configuration**, deja los valores tal como vienen:

   | Campo | Valor |
   | --- | --- |
   | Build command | *vacío* |
   | Deploy command | `npx wrangler deploy` |
   | Version command | `npx wrangler versions upload` |
   | Root directory | `/` |

   Son los correctos: el repositorio ya incluye `wrangler.toml`, y de ahí sale
   todo lo demás.

5. Pulsa **Create and deploy**. La app quedará en una dirección del tipo
   `https://axioma.TU-SUBDOMINIO.workers.dev`.

Anota esa URL: la necesitarás en la parte 3.

> **Antes de este paso**, asegúrate de que la rama predeterminada del repositorio
> en GitHub es `main` (Settings → General → Default branch).

Este primer despliegue ya deja el juego publicado y jugable. El inicio de sesión
y el ranking son opcionales y se activan en las partes 2 a 4; hasta entonces la
app sencillamente no muestra nada de cuentas.

### Dominio propio (opcional)

En el Worker → **Settings** → **Domains & Routes** → **Add**. Si el dominio ya está
en Cloudflare, el DNS se configura solo. Si lo añades, tendrás que incluirlo
también en los orígenes autorizados de Google (parte 3).

---

## Parte 2 · Crear la base de datos D1

D1 es la base de datos de Cloudflare. Guarda los usuarios y las puntuaciones, y
vive en tu propia cuenta.

1. Instala y autoriza la herramienta de línea de comandos:

   ```
   npm install -g wrangler
   wrangler login
   ```

   Se abrirá el navegador para que autorices el acceso a tu cuenta.

2. Crea la base de datos:

   ```
   wrangler d1 create axioma
   ```

   La salida incluye un bloque con un `database_id`. Cópialo.

3. Abre `wrangler.toml` en el repositorio. Al final hay un bloque comentado:
   quítale el `#` a las cuatro líneas y pega el identificador que acabas de
   copiar, de forma que quede así:

   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "axioma"
   database_id = "aquí-el-id-que-te-dio-wrangler"
   ```

   Mientras ese bloque siga comentado, la app se despliega sin ranking. Ese es su
   estado inicial, para que el primer despliegue no falle.

4. Guarda el cambio, confírmalo y súbelo a `main`. Cloudflare lee este archivo en
   cada despliegue, así que de aquí saca el enlace a la base de datos.

5. Crea las tablas en la base de producción:

   ```
   wrangler d1 execute axioma --remote --file=schema.sql
   ```

   El indicador `--remote` apunta a la base real. Con `--local` trabajarías sobre
   una copia en tu ordenador, útil solo para pruebas.

   **Sin terminal**: abre `instalar.sql` (en la raíz del repositorio), copia todo
   su contenido y pégalo en **Workers & Pages → D1 → axioma → Console**. Es el
   mismo `schema.sql` con una sentencia por línea y sin comentarios. Se puede
   ejecutar las veces que haga falta: solo crea lo que falta y no borra ni cambia
   datos. Si la app dice que «faltan las tablas», esto lo resuelve de una vez.
   Si la consola responde «Requests without any query are not supported», es que
   le llegó texto sin sentencias (líneas de comentario `--` o una selección
   vacía): pega solo líneas que empiecen por `CREATE`. Si te da otro error por el
   tamaño, pégalo en dos o tres partes; da igual el orden y repetir líneas.

Esto crea dos tablas. La de usuarios guarda una fila por jugador que entre con
Google. La de puntuaciones guarda una fila por jugador y día, con las movidas y
las pistas usadas.

---

## Parte 3 · Crear el cliente de Google para el inicio de sesión

1. Entra en [console.cloud.google.com](https://console.cloud.google.com) y crea un
   proyecto nuevo, por ejemplo llamado `Axioma`.

2. Ve a **APIs y servicios** y abre la **pantalla de consentimiento de OAuth**
   (en las versiones más recientes de la consola aparece como *Google Auth
   Platform*). Elige tipo **Externo** y rellena:

   - Nombre de la aplicación: `Axioma`
   - Correo de asistencia al usuario: el tuyo
   - Datos de contacto del desarrollador: el tuyo

   Guarda y continúa. **No añadas ningún permiso adicional**: la app solo usa los
   básicos de nombre, foto y correo, que vienen incluidos.

3. **Publica la aplicación.** Mientras esté en modo *Prueba*, solo podrán entrar
   las cuentas que añadas a mano como usuarios de prueba. En la pantalla de
   consentimiento, pulsa **Publicar aplicación**. Como no pides permisos
   sensibles, Google no exige ningún proceso de verificación.

4. Ve a **Credenciales** → **Crear credenciales** → **ID de cliente de OAuth** y
   elige tipo **Aplicación web**. Ponle un nombre, por ejemplo `Axioma web`.

5. En **Orígenes autorizados de JavaScript**, añade una entrada por cada dirección
   desde la que se abrirá la app:

   ```
   https://axioma.TU-SUBDOMINIO.workers.dev
   https://tudominio.com
   http://localhost:8788
   ```

   Reglas que causan casi todos los fallos:

   - Solo esquema, dominio y puerto. **Sin barra final y sin ninguna ruta.**
   - `https` y `http` son orígenes distintos, igual que `midominio.com` y
     `www.midominio.com`. Añade los que vayas a usar.
   - Las vistas previas de cada versión tienen subdominios propios, así que el
     inicio de sesión no funcionará en ellas salvo que añadas cada una.

6. **No hace falta ninguna URI de redirección.** La app usa el botón de Google
   sobre la propia página, que no redirige.

7. Pulsa **Crear** y copia el **ID de cliente**. Termina en
   `.apps.googleusercontent.com`. Puedes cerrar la ventana sin copiar el secreto
   de cliente: la app no lo usa.

---

## Parte 4 · Conectarlo todo en Cloudflare

1. Genera una clave larga y aleatoria para firmar las sesiones:

   ```
   openssl rand -base64 48
   ```

2. En el panel de Cloudflare, entra en tu Worker y ve a **Settings** →
   **Variables and Secrets**. Añade estas tres:

   | Nombre | Tipo | Valor |
   | --- | --- | --- |
   | `GOOGLE_CLIENT_ID` | Secret | El ID de cliente de la parte 3 |
   | `SESSION_SECRET` | Secret | La clave que acabas de generar |
   | `PLATFORM_ADMINS` | Secret | Tu correo de Google (o varios, separados por comas): quién aprueba las instituciones nuevas (Educativo y Empresas) |

   **Añádelas como Secret, no como texto plano.** Los secretos sobreviven a
   todos los despliegues, mientras que las variables de texto pueden quedar
   borradas al desplegar, porque el archivo de configuración manda sobre ellas.
   El identificador de cliente no es información sensible, pero guardarlo como
   secreto evita que se pierda en el siguiente despliegue.

3. Comprueba el enlace con la base de datos en **Settings** → **Bindings**. Debe
   aparecer una base D1 con el nombre de variable `DB`, y también los archivos
   estáticos como `ASSETS`. Ambos salen de `wrangler.toml` en cada despliegue.

4. **Vuelve a desplegar.** Los secretos nuevos llegan a la app en el siguiente
   despliegue. En **Deployments**, usa **Retry** sobre el último, o simplemente
   sube cualquier cambio al repositorio.

---

## Parte 5 · Comprobar que funciona

1. Abre la ruta `/api/config` de tu app en el navegador. Debe responder con tu ID
   de cliente. Si devuelve un valor vacío, la variable no ha llegado: revisa el
   paso 4 de la parte anterior.

2. Abre la app. En la cabecera debe aparecer el botón **Entrar**.

3. Pulsa **Entrar**, inicia sesión con Google y comprueba que el botón pasa a
   mostrar tu nombre y tu foto.

4. Resuelve el reto diario. Al terminar, la tarjeta de resultado debe indicar tu
   puesto, y el botón **Ver ranking** debe abrir la lista del día.

---

## Parte 6 · Dónde está la configuración y cómo ver las estadísticas

### La configuración

| Qué | Dónde |
| --- | --- |
| Despliegues e historial | Cloudflare → Workers & Pages → `axioma` → **Deployments** |
| Variables y secretos | El mismo Worker → **Settings** → **Variables and Secrets** |
| Base de datos y archivos | El mismo Worker → **Settings** → **Bindings** |
| Dominios | El mismo Worker → **Settings** → **Domains & Routes** |
| Configuración de compilación | El mismo Worker → **Settings** → **Build** |
| Registros en vivo y errores | El mismo Worker → **Observability** (o **Logs**) |
| Cliente de Google | console.cloud.google.com → APIs y servicios → **Credenciales** |

### Las estadísticas

Puedes consultarlas de dos formas. Desde el panel, en **Storage & Databases** →
**D1** → `axioma`, hay una pestaña de consola donde escribir SQL. Desde la
terminal, con `wrangler d1 execute axioma --remote --command "..."`.

Consultas útiles:

```sql
-- Cuántas personas se han registrado
SELECT COUNT(*) AS usuarios FROM users;

-- Altas por día, las dos últimas semanas
SELECT date(created_at,'unixepoch') AS dia, COUNT(*) AS altas
FROM users GROUP BY dia ORDER BY dia DESC LIMIT 14;

-- Tiempo medio de quienes lo resolvieron (requiere la columna seconds)
SELECT day AS reto, COUNT(*) AS jugadores, ROUND(AVG(seconds)/60.0,1) AS minutos_medios
FROM scores WHERE seconds>0 GROUP BY day ORDER BY day DESC LIMIT 14;

-- Participación y mejor marca de cada reto
SELECT day AS reto, COUNT(*) AS jugadores,
       MIN(moves) AS mejor, ROUND(AVG(moves),1) AS media,
       SUM(CASE WHEN hints>0 THEN 1 ELSE 0 END) AS con_pistas
FROM scores GROUP BY day ORDER BY day DESC LIMIT 14;

-- Clasificación de un día concreto (sustituye el 249)
SELECT u.name, s.moves, s.hints
FROM scores s JOIN users u ON u.id=s.user_id
WHERE s.day=249 ORDER BY s.moves, s.hints, s.created_at LIMIT 20;

-- Jugadores más constantes
SELECT u.name, COUNT(*) AS retos_resueltos, MIN(s.moves) AS mejor_marca
FROM scores s JOIN users u ON u.id=s.user_id
GROUP BY u.id ORDER BY retos_resueltos DESC LIMIT 20;

-- Cuántos vuelven al día siguiente
SELECT COUNT(DISTINCT a.user_id) AS repiten
FROM scores a JOIN scores b ON b.user_id=a.user_id AND b.day=a.day+1;
```

El número de reto empieza en 1 el 1 de enero de 2026 y sube uno cada día.

### Guardar también el tiempo empleado

Las bases creadas antes de esta función no tienen la columna del tiempo. El juego
funciona igual, sencillamente no lo guarda. Para activarlo, ejecuta una vez en la
consola de D1:

```sql
ALTER TABLE scores ADD COLUMN seconds INTEGER NOT NULL DEFAULT 0;
```

La API detecta sola si la columna existe, así que puedes hacerlo cuando quieras
y sin riesgo de romper el ranking.

### Añadir la tabla del sudoku

El sudoku tiene su propio ranking por tiempo y guarda los resultados en una tabla
aparte. Las bases creadas antes de esta función no la tienen: el juego funciona
igual, pero al terminar un sudoku no se envía nada y el ranking avisa de que
falta la tabla. Para activarlo, ejecuta una vez en la consola de D1 (o vuelve a
pasar `schema.sql`, que ya la incluye y no toca lo existente):

```sql
CREATE TABLE IF NOT EXISTS sudoku (
  user_id    TEXT    NOT NULL REFERENCES users(id),
  day        INTEGER NOT NULL,
  level      INTEGER NOT NULL,
  seconds    INTEGER NOT NULL,
  errors     INTEGER NOT NULL DEFAULT 0,
  hints      INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, day, level)
);
CREATE INDEX IF NOT EXISTS sudoku_day ON sudoku(day, level, seconds, created_at);
```

Se guarda un resultado por jugador, día y nivel, y solo se conserva el mejor
tiempo: si repites y tardas más, no se sobrescribe.

Consultas útiles:

```sql
-- los diez tiempos más rápidos de hoy en nivel Difícil (nivel 3)
SELECT u.name, s.seconds, s.hints
FROM sudoku s JOIN users u ON u.id=s.user_id
WHERE s.day=(SELECT MAX(day) FROM sudoku) AND s.level=3
ORDER BY s.seconds ASC, s.created_at ASC LIMIT 10;

-- cuánta gente termina cada nivel y cuánto tarda de media
SELECT level, COUNT(*) AS partidas, AVG(seconds) AS media, MIN(seconds) AS mejor
FROM sudoku GROUP BY level ORDER BY level;
```

Los niveles son 1 Fácil, 2 Medio, 3 Difícil, 4 Experto y 5 Ultra (sin ayudas).

### Añadir las tablas de retos y pareja

Los retos entre amigos y el sudoku en pareja usan ocho tablas más (`events`,
`event_rounds`, `event_members`, `event_starts`, `event_results`, `coop`,
`coop_members` y `coop_moves`). Están al final de `schema.sql`; basta con volver
a ejecutarlo, que no toca lo que ya existe:

```
wrangler d1 execute axioma --remote --file=schema.sql
```

o pegar ese bloque en la consola de D1. Hasta entonces, esas dos secciones de la
app avisan de que faltan las tablas y todo lo demás sigue funcionando.

Si creaste las tablas de retos con una versión anterior a los juegos rápidos
(sin las columnas `game`, `pace`, `days`, `forfeit`, `seed` y `score`), lo más
sencillo es borrarlas y volver a crearlas, porque solo guardaban retos de
prueba:

```sql
DROP TABLE IF EXISTS coop_moves; DROP TABLE IF EXISTS coop_members; DROP TABLE IF EXISTS coop;
DROP TABLE IF EXISTS event_results; DROP TABLE IF EXISTS event_starts;
DROP TABLE IF EXISTS event_members; DROP TABLE IF EXISTS event_rounds; DROP TABLE IF EXISTS events;
```

y después pegar de nuevo `schema.sql`.

Consultas útiles:

```sql
-- retos activos y cuánta gente hay en cada uno
SELECT e.code, e.name, e.mode, e.prize, COUNT(m.user_id) AS jugadores
FROM events e LEFT JOIN event_members m ON m.event_code=e.code
GROUP BY e.code ORDER BY e.created_at DESC LIMIT 20;

-- resultados de un reto, ronda a ronda
SELECT r.round, u.name, r.team, r.seconds, r.errors, r.hints
FROM event_results r JOIN users u ON u.id=r.user_id
WHERE r.event_code='CÓDIGO' ORDER BY r.round, r.seconds;
```

### Añadir las tablas de concursos

Los concursos de trivia usan tres tablas más: `contests`, `contest_entries` y
`contest_answers`. También están al final de `schema.sql`, así que basta con
volver a ejecutarlo (no toca nada de lo que ya existe):

```
wrangler d1 execute axioma --remote --file=schema.sql
```

o pegarlo en la consola de D1. Hasta entonces, la sección de concursos avisa de
que faltan las tablas.

Consultas útiles:

```sql
-- concursos y cuánta gente se inscribió y jugó
SELECT c.code, c.name, c.prize, datetime(c.ends_at/1000,'unixepoch') AS cierre,
       COUNT(e.user_id) AS inscritos, SUM(e.started_at IS NOT NULL) AS jugaron
FROM contests c LEFT JOIN contest_entries e ON e.code=c.code
GROUP BY c.code ORDER BY c.ends_at DESC LIMIT 20;

-- ranking de un concurso
SELECT u.name, u.email, e.correct, e.errors, e.total_ms, e.end_reason
FROM contest_entries e JOIN users u ON u.id=e.user_id
WHERE e.code='CÓDIGO' AND e.started_at IS NOT NULL
ORDER BY e.correct DESC, e.errors ASC, e.total_ms ASC, e.started_at ASC;
```

La segunda consulta incluye el correo del ganador, que la app no muestra, por si
hace falta contactarle para entregar el premio.

### Añadir las tablas de la sección Educativo

El aula (instituciones, cursos, bancos de preguntas y cuestionarios, ver
[AULA.md](AULA.md)) y el registro con consentimiento usan nueve tablas más:
`profiles`, `orgs`, `org_members`, `org_units`, `courses`, `course_members`,
`banks`, `bank_questions` y `contest_scope`. Están al final de `schema.sql`:

```
wrangler d1 execute axioma --remote --file=schema.sql
```

o pégalo en la consola de D1 (**Workers & Pages → D1 → axioma → Console**). Todo
usa `CREATE … IF NOT EXISTS`, así que se puede ejecutar las veces que haga falta.

Después añade el secreto **`PLATFORM_ADMINS`** con tu correo (parte 4). Con él,
cada institución nueva queda pendiente hasta que la apruebes en **Educativo →
Administración de la plataforma**. Sin él, las instituciones se activan al
registrarse, lo que solo conviene para pruebas.

Consultas útiles:

```sql
-- instituciones, estado y miembros
SELECT o.name, o.status, o.kind, COUNT(m.user_id) AS miembros
FROM orgs o LEFT JOIN org_members m ON m.org_id=o.id GROUP BY o.id ORDER BY o.created_at DESC;

-- cursos con su número de estudiantes
SELECT c.code, c.name, c.term, o.name AS institucion,
       SUM(cm.role='estudiante' AND cm.status='activo') AS estudiantes
FROM courses c JOIN orgs o ON o.id=c.org_id LEFT JOIN course_members cm ON cm.code=c.code
GROUP BY c.code ORDER BY c.created_at DESC;

-- menores registrados y si consta el consentimiento
SELECT u.name, u.email, p.birthdate, p.guardian_name, p.guardian_email, p.guardian_ok
FROM profiles p JOIN users u ON u.id=p.user_id
WHERE date(p.birthdate,'+18 years') > date('now');
```

Si cambias los términos o la política de privacidad de forma importante, sube
`TERMS_VERSION` en `src/aula.js`: todo el mundo los vuelve a aceptar en su
siguiente acción.

### Añadir las tablas de empresas e invitados

**Empresas y eventos** ([EMPRESAS.md](EMPRESAS.md)) usa siete tablas más:
`org_brand`, `org_invites`, `contest_options`, `guests`, `verify_codes`,
`contact_consents` y `user_blocks`. Están al final de `schema.sql`; se crean igual
que las anteriores (consola de D1 o `wrangler d1 execute axioma --remote
--file=schema.sql`). Hasta entonces todo lo demás sigue funcionando y la sección de
empresas avisa de que faltan las tablas.

Consultas útiles:

```sql
-- invitados verificados (y cuántos con código de prueba)
SELECT verified_by, COUNT(*) FROM guests GROUP BY verified_by;

-- participantes de una empresa que aceptaron que los contacten
SELECT u.name, COALESCE(g.contact,u.email) AS contacto
FROM contact_consents cc JOIN users u ON u.id=cc.user_id LEFT JOIN guests g ON g.user_id=u.id
WHERE cc.org_id='ID' AND cc.marketing=1;

-- usuarios bloqueados
SELECT u.name, u.email, b.reason, datetime(b.created_at/1000,'unixepoch') FROM user_blocks b JOIN users u ON u.id=b.user_id;
```

### Añadir las tablas de salas de juego

**Más juegos** ([JUEGOS.md](JUEGOS.md)) usa dos tablas más, `salas` y
`sala_jugadores`, que están al final de `schema.sql`. Si prefieres pegarlas en la
consola de D1 (**Workers & Pages → D1 → axioma → Console**), son estas (se pueden
ejecutar las veces que haga falta):

```sql
CREATE TABLE IF NOT EXISTS salas (code TEXT PRIMARY KEY, juego TEXT NOT NULL, host_id TEXT NOT NULL REFERENCES users(id), org_id TEXT, acceso TEXT NOT NULL, titulo TEXT, premio TEXT, estado TEXT NOT NULL, jugadores INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, ended_at INTEGER);
CREATE INDEX IF NOT EXISTS salas_host ON salas(host_id, created_at);
CREATE INDEX IF NOT EXISTS salas_org ON salas(org_id, created_at);
CREATE TABLE IF NOT EXISTS sala_jugadores (code TEXT NOT NULL, user_id TEXT NOT NULL, nombre TEXT, puesto INTEGER, puntos INTEGER, created_at INTEGER NOT NULL, PRIMARY KEY (code, user_id));
```

Las partidas en sí viven en un **Durable Object** (`Sala`). No hay que crearlo a
mano: `wrangler.toml` lo declara con su migración (`new_sqlite_classes`) y
Cloudflare lo crea al desplegar. Funciona en el plan gratuito. Para eventos
grandes y frecuentes conviene el plan Workers Paid (ver [JUEGOS.md](JUEGOS.md)).
Hasta que existan las tablas, la sección avisa de que faltan y el resto de la app
sigue igual.

Consultas útiles:

```sql
-- salas por juego en los últimos 30 días
SELECT juego, COUNT(*) AS salas, SUM(jugadores) AS jugadores FROM salas
WHERE created_at > (strftime('%s','now')-30*86400)*1000 GROUP BY juego ORDER BY salas DESC;

-- ganadores de los sorteos de una institución
SELECT s.code, s.titulo, s.premio, j.nombre, j.puesto FROM salas s JOIN sala_jugadores j ON j.code=s.code
WHERE s.juego='sorteo' AND s.org_id='ID' AND j.puesto IS NOT NULL ORDER BY s.created_at DESC, j.puesto;
```

### Añadir las tablas de trivia por áreas

Para elegir **áreas temáticas** y que **no se repitan preguntas** durante 60 días
(ver [CONCURSOS.md](CONCURSOS.md)) hacen falta tres tablas más. Pégalas en la
consola de D1; se pueden ejecutar las veces que haga falta:

```sql
CREATE TABLE IF NOT EXISTS preguntas_vistas (quien TEXT NOT NULL, qid TEXT NOT NULL, visto_at INTEGER NOT NULL, PRIMARY KEY (quien, qid));
CREATE INDEX IF NOT EXISTS preguntas_vistas_fecha ON preguntas_vistas(quien, visto_at);
CREATE TABLE IF NOT EXISTS contest_seq (code TEXT NOT NULL, user_id TEXT NOT NULL, qids TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (code, user_id));
CREATE TABLE IF NOT EXISTS contest_areas (code TEXT PRIMARY KEY, areas TEXT NOT NULL);
```

Mientras falten, los concursos funcionan como antes, pero:
- con el banco original;
- sin elegir áreas;
- sin memoria de lo visto.

Para limpiar de vez en cuando lo que ya no hace falta:

```sql
-- lo visto hace más de 60 días ya no se usa
DELETE FROM preguntas_vistas WHERE visto_at < (strftime('%s','now')-60*86400)*1000;
```

### Añadir las tablas de prácticas, grupos y alta masiva

Para las prácticas, la libreta, los grupos de curso y el alta masiva de
estudiantes (ver [AULA.md](AULA.md)), pega esto en la consola de D1. Se puede
ejecutar las veces que haga falta:

```sql
CREATE TABLE IF NOT EXISTS cuestionario_opciones (code TEXT PRIMARY KEY, modo TEXT NOT NULL DEFAULT 'examen', grupo_id INTEGER, explica INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS practica_intentos (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL, user_id TEXT NOT NULL, aciertos INTEGER NOT NULL, total INTEGER NOT NULL, ms INTEGER NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS practica_intentos_user ON practica_intentos(code, user_id);
CREATE TABLE IF NOT EXISTS course_groups (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL, name TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS course_groups_code ON course_groups(code);
CREATE TABLE IF NOT EXISTS course_group_members (code TEXT NOT NULL, user_id TEXT NOT NULL, group_id INTEGER NOT NULL, PRIMARY KEY (code, user_id));
CREATE TABLE IF NOT EXISTS course_invites (code TEXT NOT NULL, email TEXT NOT NULL, name TEXT, student_code TEXT, invited_by TEXT, created_at INTEGER NOT NULL, PRIMARY KEY (code, email));
CREATE INDEX IF NOT EXISTS course_invites_email ON course_invites(email);
```

Mientras falten, los cursos funcionan como antes, pero no aparecen la pestaña
Libreta, los grupos ni el alta masiva.

### Añadir las tablas de «Mis preguntas»

Para que cada persona pueda subir sus propias preguntas y jugar retos de trivia
o una trivia en vivo con ellas (ver [RETOS.md](RETOS.md)), pega esto en la
consola de D1. Se puede ejecutar varias veces:

```sql
CREATE TABLE IF NOT EXISTS mis_bancos (id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS mis_bancos_owner ON mis_bancos(owner_id);
CREATE TABLE IF NOT EXISTS mis_preguntas (id INTEGER PRIMARY KEY AUTOINCREMENT, banco_id INTEGER NOT NULL, q TEXT NOT NULL, opts TEXT NOT NULL, answer INTEGER NOT NULL DEFAULT 0, level INTEGER NOT NULL DEFAULT 1, topic TEXT, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS mis_preguntas_banco ON mis_preguntas(banco_id);
CREATE TABLE IF NOT EXISTS reto_preguntas (event_code TEXT PRIMARY KEY, fuente TEXT NOT NULL, nombre TEXT, pool TEXT NOT NULL);
```

Mientras falten, los retos y la trivia en vivo funcionan como antes, con
cultura general, y *Mis preguntas* avisa de que faltan las tablas.

### Añadir las tablas de tipos de pregunta e imágenes

Para preguntas numéricas, de verdadero o falso y de texto libre, imágenes y
desarrollo (ver [AULA.md](AULA.md)), pega esto en la consola de D1 (se puede
ejecutar varias veces). También está incluido en `instalar.sql`:

```sql
CREATE TABLE IF NOT EXISTS bank_question_extra (question_id INTEGER PRIMARY KEY, tipo TEXT NOT NULL DEFAULT 'opcion', num TEXT, imagen TEXT, opt_imgs TEXT, desarrollo TEXT);
CREATE TABLE IF NOT EXISTS preguntas_imagenes (id TEXT PRIMARY KEY, org_id TEXT, owner_id TEXT NOT NULL, tipo TEXT NOT NULL, data TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS preguntas_imagenes_owner ON preguntas_imagenes(owner_id, created_at);
CREATE TABLE IF NOT EXISTS contest_textos (code TEXT NOT NULL, user_id TEXT NOT NULL, idx INTEGER NOT NULL, texto TEXT NOT NULL, estado TEXT NOT NULL, comentario TEXT, revisado_por TEXT, revisado_at INTEGER, created_at INTEGER NOT NULL, PRIMARY KEY (code, user_id, idx));
```

Mientras falten, las preguntas de opción múltiple funcionan como siempre; guardar
una de otro tipo o con imagen avisa de que faltan las tablas.

### Añadir las tablas de las competencias de juego rápido

Para las competencias de juego rápido de las empresas, con premios y cupones
(ver [EMPRESAS.md](EMPRESAS.md)), pega esto en la consola de D1 (también está en
`instalar.sql`):

```sql
CREATE TABLE IF NOT EXISTS campanas (code TEXT PRIMARY KEY, org_id TEXT NOT NULL, owner_id TEXT NOT NULL, nombre TEXT NOT NULL, descripcion TEXT, juego TEXT NOT NULL, intentos INTEGER NOT NULL DEFAULT 3, publico INTEGER NOT NULL DEFAULT 1, invitados INTEGER NOT NULL DEFAULT 1, ranking INTEGER NOT NULL DEFAULT 1, premios TEXT, umbral INTEGER, umbral_premio TEXT, seed INTEGER NOT NULL, starts_at INTEGER NOT NULL, ends_at INTEGER NOT NULL, cerrada_at INTEGER, premiados_at INTEGER, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS campanas_org ON campanas(org_id, ends_at);
CREATE TABLE IF NOT EXISTS campana_intentos (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL, user_id TEXT NOT NULL, n INTEGER NOT NULL, seed INTEGER NOT NULL, started_at INTEGER NOT NULL, finished_at INTEGER, score INTEGER, seconds INTEGER, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS campana_intentos_code ON campana_intentos(code, user_id);
CREATE TABLE IF NOT EXISTS campana_cupones (codigo TEXT PRIMARY KEY, code TEXT NOT NULL, user_id TEXT NOT NULL, tipo TEXT NOT NULL, puesto INTEGER, premio TEXT NOT NULL, created_at INTEGER NOT NULL, canjeado_at INTEGER, canjeado_por TEXT);
CREATE INDEX IF NOT EXISTS campana_cupones_code ON campana_cupones(code, user_id);
```

### Añadir la tabla de datos de los estudiantes

Al unirse a un curso, cada estudiante da su **nombre completo** y su
**teléfono** (el registro universitario pasa a ser opcional). Se guardan en una
tabla pequeña; pega esto en la consola de D1 (también está en `instalar.sql`):

```sql
CREATE TABLE IF NOT EXISTS alumno_datos (org_id TEXT NOT NULL, user_id TEXT NOT NULL, nombre TEXT, telefono TEXT, updated_at INTEGER NOT NULL, PRIMARY KEY (org_id, user_id));
```

Sin ella, los estudiantes se unen igual, pero el docente no verá esos datos.

### Añadir las tablas de las competencias sin fin (maratón)

Para las competencias que se juegan hasta perder (memoria sin fin, maratón de
sudoku y maratón de Axioma; ver [EMPRESAS.md](EMPRESAS.md)), además de las tres
tablas anteriores pega esto en la consola de D1 (también está en `instalar.sql`):

```sql
CREATE TABLE IF NOT EXISTS campana_maraton (code TEXT PRIMARY KEY, reglas TEXT NOT NULL, tableros TEXT);
CREATE TABLE IF NOT EXISTS campana_progreso (intento_id INTEGER PRIMARY KEY, code TEXT NOT NULL, estado TEXT NOT NULL, vence_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS campana_progreso_code ON campana_progreso(code, vence_at);
```

Mientras falten, las competencias de juegos rápidos siguen funcionando; crear una
sin fin avisa de que faltan estas tablas.

### Añadir las tablas del repaso público

Para el repaso de ingreso y nivelación con códigos de acceso (ver
[AULA.md](AULA.md)), pega esto en la consola de D1 (también está en
`instalar.sql`):

```sql
CREATE TABLE IF NOT EXISTS repasos (id INTEGER PRIMARY KEY AUTOINCREMENT, bank_id INTEGER NOT NULL, org_id TEXT, titulo TEXT NOT NULL, descripcion TEXT, n INTEGER NOT NULL DEFAULT 10, origen TEXT NOT NULL DEFAULT 'institucion', publicado_por TEXT NOT NULL, activo INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS repaso_codigos (codigo TEXT PRIMARY KEY, repaso_id INTEGER, org_id TEXT, dias INTEGER NOT NULL, usos_max INTEGER NOT NULL DEFAULT 1, usos INTEGER NOT NULL DEFAULT 0, nota TEXT, creado_por TEXT NOT NULL, vence INTEGER, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS repaso_accesos (user_id TEXT NOT NULL, alcance TEXT NOT NULL, hasta INTEGER NOT NULL, codigo TEXT, created_at INTEGER NOT NULL, PRIMARY KEY (user_id, alcance));
CREATE TABLE IF NOT EXISTS repaso_intentos (id INTEGER PRIMARY KEY AUTOINCREMENT, repaso_id INTEGER NOT NULL, user_id TEXT NOT NULL, plan TEXT NOT NULL, respuestas TEXT NOT NULL DEFAULT '{}', aciertos INTEGER NOT NULL DEFAULT 0, total INTEGER NOT NULL, created_at INTEGER NOT NULL, terminado_at INTEGER);
CREATE INDEX IF NOT EXISTS repaso_intentos_user ON repaso_intentos(user_id, repaso_id, created_at);
```

### Activar las ayudas con IA (plan Pro)

Las ayudas con IA para bancos y prácticas (ver [AULA.md](AULA.md)) necesitan
tres tablas. Pega esto en la consola de D1 (se puede ejecutar varias veces):

```sql
CREATE TABLE IF NOT EXISTS org_planes (org_id TEXT PRIMARY KEY, plan TEXT NOT NULL DEFAULT 'gratis', cuota INTEGER NOT NULL DEFAULT 0, hasta INTEGER, nota TEXT, updated_at INTEGER NOT NULL, updated_by TEXT);
CREATE TABLE IF NOT EXISTS ia_uso (org_id TEXT NOT NULL, mes TEXT NOT NULL, usos INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (org_id, mes));
CREATE TABLE IF NOT EXISTS ia_explicaciones (clave TEXT PRIMARY KEY, texto TEXT NOT NULL, created_at INTEGER NOT NULL);
```

**Elige un proveedor de IA y añade su clave.** Las claves van siempre como
**Secret** en el panel de Cloudflare (**Workers & Pages → axioma → Settings →
Variables and Secrets**), nunca en el código ni en `wrangler.toml`:

| Proveedor | Secret con la clave | Dónde se saca | Modelo por defecto |
| --- | --- | --- | --- |
| **Google AI Studio (Gemini)** · por defecto | `GEMINI_API_KEY` (o `GOOGLE_AI_API_KEY`) | aistudio.google.com → *Get API key* | `gemini-flash-latest` |
| OpenRouter | `OPENROUTER_API_KEY` | openrouter.ai → *Keys* | `openrouter/auto` |
| OpenAI | `OPENAI_API_KEY` | platform.openai.com → *API keys* | `gpt-4o-mini` |
| Anthropic (Claude) | `ANTHROPIC_API_KEY` | console.anthropic.com → *API Keys* | — (hay que escribirlo) |
| Otra API compatible con OpenAI (Groq, DeepSeek, Mistral, Together, Ollama…) | `AI_API_KEY` y `AI_BASE_URL` (p. ej. `https://api.groq.com/openai/v1`) | la de ese proveedor | — (hay que escribirlo) |

Con la clave de Gemini puesta no hace falta nada más: es el proveedor por
defecto. Para cambiar de proveedor o de modelo, entra en **Administración de la
plataforma → IA**: muestra qué claves están puestas, deja elegir el proveedor y
escribir el modelo (con sugerencias) y tiene un botón **Probar conexión** que hace
una llamada mínima y enseña el error del proveedor si algo falla (por ejemplo, un
modelo que no existe). Esa elección se guarda en una tabla pequeña:

```sql
CREATE TABLE IF NOT EXISTS ajustes_plataforma (clave TEXT PRIMARY KEY, valor TEXT NOT NULL, updated_at INTEGER NOT NULL, updated_by TEXT);
```

Sin esa tabla (o sin elegir nada), manda la variable `AI_PROVIDER` (`gemini`,
`openrouter`, `openai`, `anthropic` o `compatible`) y, si tampoco está, se usa
Gemini si tiene clave o, si no, el primer proveedor que tenga clave. El modelo
también se puede fijar con un Secret por proveedor: `GEMINI_MODEL`,
`OPENROUTER_MODEL`, `OPENAI_MODEL`, `ANTHROPIC_MODEL` o `AI_MODEL` (este último
sirve para «compatible» y, como antes, para Anthropic). Las instalaciones que ya
tenían `ANTHROPIC_API_KEY` y `AI_MODEL` siguen funcionando igual mientras no
añadan otra clave; al añadir la de Gemini, pasa a usarse Gemini.

Los PDF los leen Gemini, OpenAI, OpenRouter (según el modelo) y Anthropic; con
«compatible» hay que pegar el texto. Mientras no haya ninguna clave, la IA queda
desactivada y el panel de la plataforma lo avisa. Después, el plan Pro se activa
por institución en *Administración de la plataforma → Instituciones → Plan*.

**Coste.** El proveedor cobra por uso (tokens), aparte de Cloudflare; Google AI
Studio tiene además un nivel gratuito con límites. Una generación de 10
preguntas o una revisión del banco cuesta en torno a céntimos de dólar; un PDF
largo, algo más. La cuota mensual de cada institución limita el gasto: conviene
empezar con una cuota baja (por ejemplo, 100 usos) y fijar un límite de gasto en
la consola del proveedor.

### Ajustes de la plataforma

Lo que se configura sin tocar código está en la sección `[vars]` de
`wrangler.toml` y se lee en `src/ajustes.js`:

| Variable | Para qué |
| --- | --- |
| `APP_NAME` | Nombre que se muestra de la plataforma |
| `CONTACT_EMAIL` | Correo de contacto que aparece en los términos, la política de privacidad y el pie de la app |
| `MAIL_FROM` | *(Para más adelante)* remitente de los correos de avisos y validaciones; si falta, se usa `CONTACT_EMAIL` |
| `VERIFY_MODE` | Verificación de jugadores invitados: `"prueba"` (muestra el código en pantalla, no envía nada) o `"real"` (lo enviará por SMS o correo cuando se conecte el servicio). Ver [EMPRESAS.md](EMPRESAS.md) |

Para cambiarlos, edita `wrangler.toml` y sube el cambio: se despliegan con la app.
Las páginas los leen de `/api/config`, así que no hay que tocar el HTML. Lo
sensible (`PLATFORM_ADMINS`, las claves de IA como `GEMINI_API_KEY` y, cuando llegue el envío de correos, la clave del
servicio) va siempre como **Secret** en el panel, nunca en `wrangler.toml`.

### Copia de seguridad

```
wrangler d1 export axioma --remote --output copia.sql
```

---

## Problemas frecuentes

**El botón "Entrar" no aparece.** La app solo lo muestra cuando las tres piezas
están listas: el identificador de Google, la clave de sesión y la base de datos.
Abre `/api/config`: si viene vacío, falta alguna. Repasa que el bloque de la base
de datos en `wrangler.toml` esté descomentado, que las dos variables existan como
secretos, y que hayas vuelto a desplegar después de añadirlas.

**Funcionaba y de pronto dejó de aparecer el botón.** Es lo que pasa si guardaste
las variables como texto plano en lugar de como secretos: un despliegue las
borra. Vuelve a crearlas como **Secret**.

**La ventana de Google se cierra sola o da error de origen.** La dirección desde
la que abres la app no está en los orígenes autorizados. Revisa que coincida
exactamente, sin barra final, y con el mismo esquema y subdominio.

**Solo yo puedo entrar y a los demás les da error.** La aplicación de Google
sigue en modo *Prueba*. Publícala desde la pantalla de consentimiento.

**La API responde `not_configured`.** Falta la base de datos o alguna variable.
Comprueba el enlace `DB` en Bindings y que `SESSION_SECRET` exista.

**Errores de tabla inexistente.** No has ejecutado `schema.sql` contra la base
remota. Repite el paso 5 de la parte 2 con `--remote`.

**El despliegue falla con `binding DB of type d1 must have a valid database_id`.**
Has descomentado el bloque de la base de datos pero dejaste el texto de ejemplo
en su sitio. Pega el identificador real del paso 2, o vuelve a comentar el bloque
si aún no quieres el ranking.

**Todo el mundo pierde la sesión de golpe.** Has cambiado `SESSION_SECRET`. Es el
comportamiento esperado: las sesiones antiguas dejan de ser válidas. Úsalo si
alguna vez necesitas expulsar a todos.

---

## Desarrollo en local

```
cp .dev.vars.example .dev.vars     # y rellena las variables
wrangler d1 execute axioma --local --file=schema.sql
wrangler dev --port 8788
```

Recuerda tener `http://localhost:8788` entre los orígenes autorizados de Google.
El archivo `.dev.vars` está excluido del repositorio y nunca debe subirse.

## Estructura del proyecto

| Ruta | Qué es |
| --- | --- |
| `public/` | El juego: HTML, estilos, JavaScript, iconos y service worker |
| `src/index.js` | Punto de entrada del Worker: reparte entre la API y los archivos |
| `src/api.js` | La API: sesión, puntuaciones y ranking |
| `src/retos.js` | La API de retos y salas en pareja |
| `src/aula.js` | La API de la sección Educativo: perfiles, instituciones, cursos y bancos |
| `src/invitados.js` | La API de invitados verificados con código |
| `src/marcas.js` | La API de marcas, convocatorias, métricas y participantes |
| `src/plataforma.js` | La API de administración de la plataforma |
| `src/ajustes.js` | Ajustes de la plataforma (nombre, correo de contacto, remitente, verificación) |
| `src/concursos.js` | La API de los concursos y de los cuestionarios de curso |
| `src/preguntas.js` | El banco de preguntas de los concursos |
| `src/sala.js`, `src/juegos.js` | Las salas de juego en vivo (Durable Object) y las reglas que aplica |
| `wrangler.toml` | Nombre, archivos estáticos y enlace a la base de datos |
| `schema.sql` | Tablas de la base D1 |
