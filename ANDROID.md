# Axioma en Android

Dos caminos posibles. El primero publica la web que ya existe como aplicación en
unas horas. El segundo es una reescritura nativa, y aquí queda especificada por si
se quiere abordar más adelante.

Las reglas del juego, con todos sus valores exactos, están en [GAME.md](GAME.md).
Cualquier implementación debe ceñirse a ese documento, y en particular reproducir
el generador del reto diario bit a bit, o los tableros dejarán de coincidir entre
plataformas.

---

# Camino A · empaquetar la web (recomendado)

Android permite publicar una aplicación web como app nativa mediante una
*Trusted Web Activity*: la app abre el sitio a pantalla completa, sin barra de
navegador ni nada que delate que es web. Un solo código, una sola actualización.

**Qué se consigue:** app instalable desde Google Play, icono propio, pantalla
completa, funcionamiento sin conexión y actualizaciones automáticas al desplegar
la web, sin pasar por revisión.

**Qué no se consigue:** nada específico del sistema que la web no pueda hacer, como
notificaciones enriquecidas o widgets en el escritorio.

## Requisitos

| Herramienta | Para qué |
| --- | --- |
| Node.js 18 o superior | Ejecutar la herramienta de empaquetado |
| JDK 17 | Compilar el proyecto Android |
| Android SDK | Generar el paquete firmado |
| Cuenta de Google Play Console | Publicar, con un pago único de alta |

## Pasos

### 1. Generar el proyecto

```
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://axioma.julioseborga.workers.dev/manifest.json
```

La herramienta lee el manifiesto de la web y pregunta unos datos. Valores
recomendados:

| Pregunta | Valor |
| --- | --- |
| Domain | `axioma.julioseborga.workers.dev` |
| Application name | `Axioma` |
| Short name | `Axioma` |
| Application ID | `dev.workers.julioseborga.axioma` |
| Display mode | `standalone` |
| Orientation | `portrait` |
| Status bar color | `#F2F2F7` |
| Splash screen color | `#F2F2F7` |
| Include support for Play Billing | no |

En el primer arranque ofrece crear un **almacén de claves**. Acepta y guarda el
archivo `.keystore` junto con sus contraseñas en un gestor de contraseñas. **Si se
pierde, no se puede volver a actualizar la app publicada**, hay que republicarla
con otro identificador.

### 2. Compilar

```
bubblewrap build
```

Produce `app-release-bundle.aab`, que es lo que se sube a Google Play, y
`app-release-signed.apk` para probar en un móvil conectado.

### 3. Vincular la app con el dominio

Sin este paso la app se abre con una barra de navegador encima, y parece un
navegador disfrazado en lugar de una app.

Obtén la huella del certificado:

```
keytool -list -v -keystore android.keystore -alias android
```

Copia la línea `SHA256:` completa, con sus dos puntos.

El Worker ya sirve el archivo de verificación en
`/.well-known/assetlinks.json`; solo hay que darle los datos. En Cloudflare, en tu
Worker, **Settings** y luego **Variables and Secrets**, añade dos variables de tipo
texto:

| Variable | Valor |
| --- | --- |
| `ANDROID_PACKAGE` | `dev.workers.julioseborga.axioma` |
| `ANDROID_FINGERPRINT` | La huella SHA-256, por ejemplo `A1:B2:C3:...` |

Vuelve a desplegar y comprueba que
`https://axioma.julioseborga.workers.dev/.well-known/assetlinks.json` devuelve el
paquete y la huella. Mientras las variables no existan, devuelve una lista vacía,
que es inofensivo.

> Cuando Google Play firme la app por ti, que es lo habitual, la huella que cuenta
> es la que aparece en **Play Console**, sección *Configuración*, apartado
> *Integridad de la aplicación*. Añade ambas huellas separadas por comas, la tuya
> local y la de Play, para que funcione tanto al probar como al publicar.

### 4. Publicar

En Play Console, crea la aplicación y sube el archivo `.aab`. Tendrás que rellenar
la ficha de la tienda, la política de privacidad y el cuestionario de contenido.

Para la sección de **seguridad de los datos**, esto es lo que recoge Axioma:

- Sin cuenta no se recoge absolutamente nada; el juego funciona entero en el
  dispositivo.
- Con inicio de sesión opcional se guardan nombre, foto, correo y las puntuaciones
  del reto diario, en una base de datos propia alojada en Cloudflare.
- No hay publicidad, ni analítica de terceros, ni venta de datos.
- Los datos se pueden borrar a petición del usuario.

### 5. Actualizar

La web se actualiza sola: cada despliegue llega a la app sin pasar por la tienda.
Solo hay que subir una versión nueva a Play si cambia el icono, el nombre o algún
permiso.

## Detalles a tener en cuenta

- **Inicio de sesión con Google.** Dentro de una *Trusted Web Activity* funciona el
  mismo botón web que ya está en marcha. Si en el futuro se quiere el diálogo
  nativo del sistema, hay que registrar además un cliente OAuth de tipo Android con
  el identificador del paquete y la huella del certificado.
- **Barra de navegación del sistema.** Se colorea con `theme_color` del manifiesto.
- **Botón atrás.** Cierra la app cuando no hay historial, que es el comportamiento
  esperado en un juego de una sola pantalla.

---

# Camino B · aplicación nativa

Especificación para reimplementar el juego en Kotlin, si algún día se quiere
independencia total de la web.

## Arquitectura propuesta

| Capa | Contenido |
| --- | --- |
| `core` | Motor del juego en Kotlin puro, sin dependencias de Android: generador, verificador, contador de soluciones y sistema de pistas |
| `ui` | Jetpack Compose, con Material 3 y color dinámico |
| `data` | Preferencias locales con DataStore y cliente de red con Ktor o Retrofit |

El módulo `core` debe ser una traducción literal de [GAME.md](GAME.md) y conviene
cubrirlo con las mismas pruebas que ya se ejecutaron sobre la versión web: generar
cientos de tableros y verificar por fuerza bruta que cada uno tiene solución única
y que coincide con la declarada.

## Modelo de datos

```kotlin
enum class Scope { ORTO, REY, RAYO }
enum class Shape { CADENA, AISLADO, PAREJAS }
enum class CellState { UNDECIDED, FILLED, DISCARDED }

data class Board(
    val size: Int,                       // n
    val targetFilled: Int,               // k
    val clues: Map<Cell, Int>,           // posición → número
    val offeredScopes: List<Scope>,
    val offeredShapes: List<Shape>,
    val solution: Set<Cell>,             // solo para verificar
    val scope: Scope,                    // regla correcta
    val shape: Shape
)

data class Cell(val row: Int, val col: Int)
```

## Generador determinista

El reto diario debe producir el mismo tablero que la web. Implementar
*mulberry32* con aritmética de 32 bits sin signo, tal como está descrito en
[GAME.md](GAME.md), y consumir los números aleatorios **en el mismo orden**: primero
la forma, después el alcance, luego el barajado de casillas, y por último el
barajado de las posiciones de las pistas. Cualquier desviación en el orden produce
tableros distintos.

Comprobación de aceptación: para el día 250 el tablero debe ser Orto con Aislado,
con pistas de valor 0 en la fila 1 columna 1, 1 en la fila 1 columna 3, 1 en la
fila 1 columna 4, 0 en la fila 3 columna 2, 2 en la fila 3 columna 5, 1 en la
fila 5 columna 1 y 2 en la fila 5 columna 3.

## Pantallas

1. **Juego.** Selector de modo, dos grupos de opciones de regla, tablero,
   indicadores de estado, mensajes y acciones. En tabletas y móviles apaisados,
   las reglas van en una columna lateral, como en la web.
2. **Tutorial.** Seis pasos con ilustraciones y un paso interactivo. Se muestra la
   primera vez y desde el icono de la cabecera.
3. **Ranking.** Lista de los mejores del día con la posición propia.
4. **Resultado.** Resumen compartible mediante el diálogo del sistema.

## Persistencia local

| Clave | Contenido |
| --- | --- |
| `streak` | Días consecutivos resueltos |
| `last_day` | Último reto diario resuelto |
| `tutorial_seen` | Si ya se mostró el tutorial |
| `pending_score` | Resultado pendiente de enviar |
| `free_level` | Nivel alcanzado en el modo libre |

## Interfaz con el servidor

La API que ya está en marcha sirve tal cual. Base:
`https://axioma.julioseborga.workers.dev`

| Método y ruta | Cuerpo | Respuesta |
| --- | --- | --- |
| `GET /api/config` | — | `{ googleClientId }`, vacío si el inicio de sesión no está activo |
| `GET /api/me` | — | `{ user }` o `{ user: null }` |
| `POST /api/auth/google` | `{ credential }` con el token de Google | `{ user }` y una cookie de sesión |
| `POST /api/auth/logout` | — | `{ ok: true }` |
| `POST /api/scores` | `{ day, moves, hints }` | `{ ok, day, me: { rank, total } }` |
| `GET /api/ranking?day=N` | — | `{ day, total, top: [...], me }` |

La sesión es una cookie firmada de treinta días. En Android hay que usar un cliente
HTTP con almacén de cookies persistente, o adaptar el servidor para aceptar el
token en una cabecera de autorización, que sería más idiomático en móvil.

Para el inicio de sesión conviene el **Credential Manager** de Android con
*Sign in with Google*, que devuelve el mismo tipo de token que ya valida el
servidor. Requiere registrar un cliente OAuth de tipo Android además del web.

## Añadidos que justifican la app nativa

Si se hace el esfuerzo de una app nativa, estas son las funciones que la web no
puede dar y que aportarían valor real:

- Aviso diario cuando se publica el reto nuevo.
- Widget en la pantalla de inicio con la racha y el estado del reto de hoy.
- Vibración al cerrar una pista o al resolver.
- Integración con Play Juegos para logros y clasificaciones.

Sin al menos una de ellas, el camino A cubre lo mismo con una fracción del
esfuerzo y del mantenimiento.
