# Axioma

Puzle diario de deducción pura: no solo resuelves el tablero, descubres qué regla lo gobierna.

- Sin azar, sin adivinar, sin cuenta. Cada tablero se genera y verifica en el dispositivo con solución única.
- Tres modos: **Diario** (el mismo tablero para todo el mundo), **Flash** (rápido, 4×4) y **Libre** (niveles progresivos).
- PWA: funciona sin conexión y se puede instalar en el móvil.
- **Cuenta opcional con Google** para entrar en el ranking del reto diario. Sin configurarla, la app funciona igual y no muestra nada de cuentas.

## Ejecutar

Es HTML estático. Sirve la carpeta con cualquier servidor, por ejemplo:

```
python3 -m http.server 8080
```

y abre `http://localhost:8080`.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `index.html` | Estructura de la app |
| `axioma.css` | Estilos (tema claro y oscuro) |
| `app.js` | Generador, verificador y lógica de juego |
| `sw.js` | Service worker para uso sin conexión |
| `manifest.json`, `icon.svg` | Instalación como app |
| `account.js` | Entrada con Google y ranking (solo se activa si el backend está configurado) |
| `functions/api/[[path]].js` | API en Cloudflare Pages Functions: sesión, puntuaciones y ranking |
| `schema.sql` | Tablas de la base D1 (usuarios y puntuaciones) |
| `wrangler.toml` | Configuración de Pages y binding de D1 |

## Publicar en Cloudflare Pages

No hace falta compilar nada: Cloudflare sirve los archivos tal cual.

### Opción A · desde el panel (recomendada)

1. Entra en [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Autoriza GitHub y elige el repositorio `jseborga/axioma`.
3. En la configuración del proyecto:
   - **Production branch**: la rama que quieras publicar (por ejemplo `main`, o la rama de trabajo si aún no has hecho merge).
   - **Framework preset**: `None`.
   - **Build command**: déjalo vacío.
   - **Build output directory**: `/` (la raíz del repositorio).
4. Pulsa **Save and Deploy**. En un minuto tendrás la app en `https://<nombre-del-proyecto>.pages.dev`.
5. Cada `git push` a la rama de producción vuelve a desplegar automáticamente. Los push a otras ramas crean vistas previas con su propia URL.

Para usar tu propio dominio: en el proyecto → **Custom domains** → **Set up a custom domain**. Si el dominio ya está en Cloudflare, el DNS se configura solo.

### Opción B · desde la terminal con Wrangler

```
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name axioma
```

La primera vez te pedirá crear el proyecto. Los despliegues siguientes son el mismo comando.

### Notas

- El archivo `_headers` indica a Cloudflare que no cachee `index.html` ni `sw.js`, para que cada despliegue llegue de inmediato a quien ya tenía la app abierta o instalada.
- Cuando cambies archivos, sube el número de versión en `sw.js` (`var CACHE="axioma-v2"`) para que los usuarios sin conexión reciban la versión nueva.
- La app usa HTTPS, algo que Cloudflare Pages da por defecto y que el service worker necesita para funcionar.

## Cuenta con Google y ranking (opcional)

El juego no exige cuenta. Si activas esta parte, aparece un botón **Entrar** en la cabecera y, al resolver el reto diario, el resultado entra en un ranking. Necesitas tres cosas: un cliente OAuth de Google, una base D1 y dos variables de entorno.

### 1. Cliente OAuth en Google

1. Ve a [console.cloud.google.com](https://console.cloud.google.com), crea un proyecto y entra en **APIs y servicios → Pantalla de consentimiento OAuth**. Tipo **Externo**, rellena nombre y correo, y guarda.
2. En **Credenciales → Crear credenciales → ID de cliente de OAuth**, tipo **Aplicación web**.
3. En **Orígenes de JavaScript autorizados** añade la URL de tu app, por ejemplo `https://axioma.pages.dev`, tu dominio propio si lo tienes, y `http://localhost:8788` para pruebas locales. No hace falta ninguna URI de redirección.
4. Copia el **ID de cliente** (termina en `.apps.googleusercontent.com`).

### 2. Base de datos D1

```
wrangler login
wrangler d1 create axioma
```

Pega el `database_id` que devuelve en `wrangler.toml` y crea las tablas:

```
wrangler d1 execute axioma --remote --file=schema.sql
```

### 3. Variables de entorno en Cloudflare Pages

En el proyecto de Pages: **Settings → Variables and Secrets**, añade para *Production* (y *Preview* si quieres):

| Variable | Valor |
| --- | --- |
| `GOOGLE_CLIENT_ID` | el ID de cliente del paso 1 |
| `SESSION_SECRET` | una cadena larga y aleatoria (por ejemplo `openssl rand -base64 48`) |

Y en **Settings → Bindings** comprueba que la base D1 está enlazada con el nombre `DB` (si despliegas con `wrangler.toml` en el repositorio, el binding se crea solo).

Con el siguiente despliegue el botón **Entrar** aparecerá en la cabecera. Si alguna de las tres piezas falta, la app sigue funcionando sin cuentas.

### Pruebas en local

```
cp .dev.vars.example .dev.vars        # y rellena las variables
wrangler d1 execute axioma --local --file=schema.sql
wrangler pages dev . --port 8788
```

### Qué se guarda

Solo el identificador de Google, nombre, foto, correo y las puntuaciones del reto diario (movidas y pistas por día). La sesión es una cookie firmada de 30 días; no hay contraseñas. Se conserva el mejor resultado de cada día por jugador.
