# The Final Test

Aprende, compite y demuéstralo: cuestionarios de clase con registros para el
docente, concursos de trivia con premio y juegos de lógica, en una sola app.

- **Aula**: instituciones con estructura configurable (facultad, carrera,
  materia…), docentes, cursos por paralelo a los que se entra con código o enlace,
  bancos de preguntas importados desde Excel o texto con revisión previa,
  cuestionarios de parcial y registros por estudiante y por pregunta, descargables
  en Excel. Registro con consentimiento y reglas para menores. Ver [AULA.md](AULA.md).
- **Empresas y eventos**: página propia con logo y color, convocatorias con premio
  que se comparten con un QR y se juegan sin trámites (con Google o como invitado
  verificado por código), métricas y exportación de participantes. Ver
  [EMPRESAS.md](EMPRESAS.md).
- **Administración de la plataforma**: aprobar y dar de alta instituciones y
  empresas con su administración, métricas globales y por institución, y usuarios
  con búsqueda y bloqueo.
- **Axioma**, el puzle de deducción con el que empezó el proyecto, es ahora uno de
  los juegos: no solo resuelves el tablero, descubres qué regla lo gobierna.
- Sin azar, sin adivinar, sin cuenta. Cada tablero se genera y verifica en el dispositivo con solución única.
- Tres modos: **Diario** (el mismo tablero para todo el mundo), **Flash** (rápido, 4×4) y **Libre** (niveles progresivos).
- **Sudoku** aparte, con cinco niveles, tablero del día para cada uno y ranking por tiempo. Solo entra la cifra correcta: dos fallos gratis y luego 30 s cada uno; cada pista 1 min, tres como máximo. En **Ultra** no hay ninguna ayuda: se comprueba solo al completar.
- **Concursos de trivia**: convocatorias con premio, fechas, dificultad y errores admitidos. Cada persona se inscribe y juega una vez; al cierre se publica el ranking con el ganador. Las preguntas y respuestas viven solo en el servidor.
- **Juegos rápidos**: trivia, memoria, cálculo, reflejos y del 1 al 25, de un minuto cada uno. Para practicar sin cuenta o para retos.
- **Retos**: concursos entre amigos con código y enlace: un sudoku al día o varias rondas seguidas de un juego rápido, premio para el primero, penitencia (o ruleta de penitencias) para el último, y clasificación individual, por equipos o por parejas. El servidor genera o guarda las rondas, cronometra y puntúa.
- **Más juegos**: trece juegos en salas con código y QR, con vista de proyector y los teléfonos como mando. Estrategia contra el bot (Gomoku, Hex, tres en raya cuántico), juegos de mesa en grupo (Dudo, La sexta carta, Dos verdades y una mentira), dinámicas en vivo para eventos (trivia en vivo, botón del hype, carrera matemática), sorteo gamificado, subasta inversa y juegos solo para adultos con la edad verificada (Paranoia, Yo nunca). Ver [JUEGOS.md](JUEGOS.md).
- **Sudoku en pareja**: dos personas resuelven el mismo tablero a la vez, cada una desde su móvil, con el tiempo cronometrado por el servidor.
- PWA: funciona sin conexión y se puede instalar en el móvil.
- **Cuenta con Google** para el aula, los concursos, los retos y los rankings. Los juegos de lógica funcionan sin cuenta.

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
| `public/app.js` | Modos, portada y juego de Axioma (generador y verificador) |
| `public/inicio.js` | Portada de The Final Test |
| `public/aula.js` | Pantallas del aula: instituciones, cursos, bancos, cuestionarios y registros |
| `public/marca.js` | Página pública de una marca (`?marca=`) y directorio |
| `public/invitado.js` | Participar como invitado: datos, código y verificación |
| `public/qr.js`, `public/vendor/qrcode.js` | QR y cartel PNG (librería qrcode-generator, MIT) |
| `public/registro.js` | Registro con fecha de nacimiento, consentimiento y términos |
| `public/banco-formato.js` | Lectura y validación de preguntas desde tabla o texto (lo usan el navegador y el Worker) |
| `public/xlsx.js` | Lectura y escritura de Excel (.xlsx) sin dependencias |
| `public/terminos.html`, `public/privacidad.html` | Términos de uso y política de privacidad |
| `public/account.js` | Entrada con Google y ranking (solo si el backend está configurado) |
| `public/sudoku.js` | Generador, verificador y juego del sudoku |
| `public/rapidos-motor.js` | Juegos rápidos: preguntas, generadores y puntuación (lo usan el navegador y el Worker) |
| `public/rapidos.js` | Pantalla de los juegos rápidos |
| `public/concursos.js` | Pantalla de los concursos de trivia |
| `public/retos.js` | Retos entre amigos y sudoku en pareja |
| `public/sala.js` | Salas de juego: catálogo, sala de espera con QR, conexión en vivo, proyector y partidas sin conexión |
| `public/juegos/*.js` | Reglas de cada juego (las usan el navegador y el Durable Object) y sus pantallas (`*-ui.js`) |
| `public/tutorial.js` | Tutorial guiado de Axioma, se abre la primera vez que se juega |
| `public/sw.js` | Service worker para uso sin conexión |
| `public/manifest.json`, `public/icon.svg` | Instalación como app |
| `public/como-jugar.svg` | Guía visual del procedimiento, paso a paso |
| `src/index.js` | Punto de entrada del Worker: reparte entre la API y los archivos |
| `src/api.js` | API: sesión, puntuaciones y rankings (axioma y sudoku) |
| `src/retos.js` | API de retos y salas en pareja |
| `src/aula.js` | API del aula: perfiles, instituciones, cursos, bancos y administración |
| `src/invitados.js` | API de invitados: códigos de verificación, límites y sesión |
| `src/marcas.js` | API de marcas, convocatorias de institución, métricas y participantes |
| `src/plataforma.js` | API de administración de la plataforma: resumen, usuarios, bloqueo y altas |
| `src/ajustes.js` | Ajustes de la plataforma: nombre, correo de contacto y remitente (variables de `wrangler.toml`) |
| `src/concursos.js` | API de los concursos y de los cuestionarios de curso |
| `src/preguntas.js` | Banco de preguntas de los concursos y generador de operaciones (solo en el servidor) |
| `src/sala.js` | API de salas y Durable Object `Sala`: conexiones WebSocket, turnos, relojes, bots y resultados |
| `src/juegos.js` | Carga en el Worker las reglas de `public/juegos/` y las preguntas del servidor |
| `schema.sql` | Tablas de la base de datos D1 |
| `wrangler.toml` | Configuración del Worker y enlace a D1 |

## Documentación

| Documento | Contenido |
| --- | --- |
| [SETUP.md](SETUP.md) | Puesta en marcha: Cloudflare, base de datos, inicio de sesión y estadísticas |
| [COMO-JUGAR.md](COMO-JUGAR.md) | Qué es el juego, cómo empezar y una guía visual paso a paso |
| [EMPRESAS.md](EMPRESAS.md) | Empresas y eventos: marca, convocatorias con QR, invitados verificados, métricas y administración |
| [JUEGOS.md](JUEGOS.md) | Más juegos: salas en vivo, proyector, sorteo y subasta, juegos +18, costes y aspectos legales |
| [AULA.md](AULA.md) | Instituciones, roles, cursos, bancos de preguntas, cuestionarios y registros |
| [CONCURSOS.md](CONCURSOS.md) | Concursos de trivia con premio: cómo se crean, se juegan y se decide el ganador |
| [RETOS.md](RETOS.md) | Retos con premio entre amigos, juegos rápidos y sudoku en pareja: cómo se crean, se juegan y se puntúan |
| [GAME.md](GAME.md) | Especificación exacta de las reglas, los modos y la generación de tableros |
| [ANDROID.md](ANDROID.md) | Publicar en Android, empaquetando la web o como app nativa |

## Publicar en Cloudflare

The Final Test se despliega como un **Worker** (llamado `axioma` en Cloudflare: no cambies el nombre, de él dependen la URL y el inicio de sesión de Google), que sirve los archivos de `public` y
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
  (`var CACHE="tft-v19"`) para que los usuarios sin conexión reciban la nueva.
- La app usa HTTPS, que Cloudflare da por defecto y que el service worker necesita.

## Cuenta con Google y base de datos

Los juegos de lógica no exigen cuenta; el aula, los concursos y los retos sí. Si
activas esta parte, aparece un botón **Entrar** en la cabecera. Hacen
falta tres cosas: un cliente OAuth de Google, una base de datos D1 y dos variables
de entorno.

**El paso a paso completo, incluidas las consultas de estadísticas y los fallos
más comunes, está en [SETUP.md](SETUP.md).**

### Qué se guarda

El identificador de Google, nombre, foto y correo; la fecha de nacimiento y la
aceptación de términos (y, para menores, los datos del tutor); las instituciones,
cursos y roles con el registro universitario; los bancos de preguntas; y los
resultados: del reto
diario (movidas, pistas y tiempo por día) y del sudoku (tiempo, errores y pistas
por día y nivel). La sesión es una cookie firmada de 30 días; no hay contraseñas.
Se conserva el mejor resultado de cada día por jugador. La racha personal vive
únicamente en el navegador de cada jugador.

Si tu base de datos es anterior a alguna sección, hay que crear sus tablas una
sola vez: lo explican los apartados «Añadir las tablas…» de [SETUP.md](SETUP.md),
el último de ellos para el aula.
