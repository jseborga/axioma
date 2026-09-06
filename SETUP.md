# Puesta en marcha de Axioma

Guía completa para publicar la app en Cloudflare, activar el inicio de sesión con
Google, crear la base de datos y consultar las estadísticas.

El juego funciona sin nada de esto: si no configuras el inicio de sesión, la app
se publica igual y sencillamente no muestra cuentas ni ranking. Puedes hacer solo
la parte 1 y dejar el resto para más adelante.

Axioma se despliega como un **Worker** de Cloudflare: un único proyecto que sirve
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
   **Variables and Secrets**. Añade estas dos:

   | Nombre | Tipo | Valor |
   | --- | --- | --- |
   | `GOOGLE_CLIENT_ID` | Secret | El ID de cliente de la parte 3 |
   | `SESSION_SECRET` | Secret | La clave que acabas de generar |

   **Añade las dos como Secret, no como texto plano.** Los secretos sobreviven a
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
cp .dev.vars.example .dev.vars     # y rellena las dos variables
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
| `wrangler.toml` | Nombre, archivos estáticos y enlace a la base de datos |
| `schema.sql` | Tablas de la base D1 |
