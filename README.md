# Axioma

Puzle diario de deducción pura: no solo resuelves el tablero, descubres qué regla lo gobierna.

- Sin azar, sin adivinar, sin cuenta. Cada tablero se genera y verifica en el dispositivo con solución única.
- Tres modos: **Diario** (el mismo tablero para todo el mundo), **Flash** (rápido, 4×4) y **Libre** (niveles progresivos).
- **Sudoku** aparte, con cinco niveles, tablero del día para cada uno y ranking por tiempo. Solo entra la cifra correcta: dos fallos gratis y luego 30 s cada uno; cada pista 1 min, tres como máximo. En **Ultra** no hay ninguna ayuda: se comprueba solo al completar.
- PWA: funciona sin conexión y se puede instalar en el móvil.
- **Cuenta opcional con Google** para entrar en el ranking del reto diario. Sin configurarla, la app funciona igual y no muestra nada de cuentas.

## Ejecutar en local

Necesitas la herramienta de Cloudflare, porque la app incluye una pequeña API:

```
npm install -g wrangler
wrangler dev --port 8788
```

y abre `http://localhost:8788`. Para probar también el inicio de sesión y el
ranking, sigue el apartado de desarrollo local de [SETUP.md](SETUP.md).

## Archivos

| Ruta | Qué es |
| --- | --- |
| `public/index.html` | Estructura de la app |
| `public/axioma.css` | Estilos (tema claro y oscuro) |
| `public/app.js` | Generador, verificador y lógica de juego |
| `public/account.js` | Entrada con Google y ranking (solo si el backend está configurado) |
| `public/sudoku.js` | Generador, verificador y juego del sudoku |
| `public/tutorial.js` | Tutorial guiado con ejemplos, se abre en la primera visita |
| `public/sw.js` | Service worker para uso sin conexión |
| `public/manifest.json`, `public/icon.svg` | Instalación como app |
| `public/como-jugar.svg` | Guía visual del procedimiento, paso a paso |
| `src/index.js` | Punto de entrada del Worker: reparte entre la API y los archivos |
| `src/api.js` | API: sesión, puntuaciones y rankings (axioma y sudoku) |
| `schema.sql` | Tablas de la base de datos D1 |
| `wrangler.toml` | Configuración del Worker y enlace a D1 |

## Documentación

| Documento | Contenido |
| --- | --- |
| [SETUP.md](SETUP.md) | Puesta en marcha: Cloudflare, base de datos, inicio de sesión y estadísticas |
| [COMO-JUGAR.md](COMO-JUGAR.md) | Qué es el juego, cómo empezar y una guía visual paso a paso |
| [GAME.md](GAME.md) | Especificación exacta de las reglas, los modos y la generación de tableros |
| [ANDROID.md](ANDROID.md) | Publicar en Android, empaquetando la web o como app nativa |

## Publicar en Cloudflare

Axioma se despliega como un **Worker**, que sirve los archivos de `public` y
atiende la API de `src`.

### Desde el panel

En [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** →
**Create** → **Import a repository**. Elige el repositorio y la rama `main`, y deja
la configuración de compilación tal como viene: sin comando de compilación, con
`npx wrangler deploy` como comando de despliegue y `/` como directorio raíz. Cada
push a `main` vuelve a desplegar.

### Desde la terminal

```
npm install -g wrangler
wrangler login
wrangler deploy
```

### Notas

- El archivo `public/_headers` evita que se cacheen `index.html` ni `sw.js`, para
  que cada despliegue llegue de inmediato a quien ya tenía la app abierta.
- Cuando cambies archivos, sube el número de versión en `public/sw.js`
  (`var CACHE="axioma-v3"`) para que los usuarios sin conexión reciban la nueva.
- La app usa HTTPS, que Cloudflare da por defecto y que el service worker necesita.

## Cuenta con Google y ranking (opcional)

El juego no exige cuenta. Si activas esta parte, aparece un botón **Entrar** en la
cabecera y, al resolver el reto diario, el resultado entra en un ranking. Hacen
falta tres cosas: un cliente OAuth de Google, una base de datos D1 y dos variables
de entorno.

**El paso a paso completo, incluidas las consultas de estadísticas y los fallos
más comunes, está en [SETUP.md](SETUP.md).**

### Qué se guarda

Solo el identificador de Google, nombre, foto, correo y los resultados: del reto
diario (movidas, pistas y tiempo por día) y del sudoku (tiempo, errores y pistas
por día y nivel). La sesión es una cookie firmada de 30 días; no hay contraseñas.
Se conserva el mejor resultado de cada día por jugador. La racha personal vive
únicamente en el navegador de cada jugador.

Si tu base de datos es anterior al sudoku, hay que crear su tabla una sola vez:
lo explica el apartado «Añadir la tabla del sudoku» de [SETUP.md](SETUP.md).
