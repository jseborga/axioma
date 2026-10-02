# Más juegos: salas en vivo, proyector y eventos

La sección **Más juegos** reúne catorce juegos que se juegan en una **sala** con
código de seis caracteres. Se entra con el código, con el enlace `?sala=CÓDIGO` o
escaneando el QR de la sala de espera. Quien crea la sala es el **anfitrión**: elige
las opciones, añade bots si el juego los tiene y empieza la partida.

Cualquier sala se puede **proyectar**. El botón «Abrir en el proyector» abre
`?pantalla=CÓDIGO`, una vista grande sin controles. Esa vista muestra el QR
mientras la gente se une y después el tablero, la pregunta o la animación. Los
teléfonos hacen de mando.

## Los juegos

| Grupo | Juego | Jugadores | Bots | Notas |
| --- | --- | --- | --- | --- |
| Estrategia 1 contra 1 | **Gomoku** (cinco en línea, 15×15) | 2 | Sí | Reloj por turno opcional; se juega sin conexión contra el bot o a dos en el mismo teléfono |
| | **Hex** (7×7, 9×9 u 11×11) | 2 | Sí (Monte Carlo) | Nunca hay empate |
| | **Tres en raya cuántico** | 2 | Sí | Marcas «fantasma», ciclos y colapso que elige el rival |
| En grupo | **Dudo** (dados mentirosos) | 2–6 | Sí | Los unos son comodines (opcional). Los dados de cada uno no salen del servidor hasta que se levantan |
| | **La sexta carta** | 2–10 | Sí | 104 cartas con cabezas de penalización; gana quien menos junta |
| | **Dos verdades y una mentira** | 3–30 | No | Se escriben en secreto y se votan una a una |
| | **Carrera de caballos** | 1–4 | Sí (3 niveles) | Carrera de preguntas: cada ronda eliges la dificultad (Fácil +1/−1, Media +2/−1, Difícil +3/−2). Zanahorias, barro, galope extra al más rápido y un comodín 50:50. «Jugar ya contra 3 bots» crea la sala y arranca sola |
| En vivo para eventos | **Trivia en vivo** | hasta 2000 | No | El anfitrión presenta y marca el ritmo. Puntúan acertar y la rapidez, medida en el servidor. Preguntas generales (se eligen las áreas), de tus bancos personales (*Mis preguntas*) o de un banco de la empresa. Con «¿Sabías que…?» al revelar la respuesta; la misma institución no repite preguntas en 60 días |
| | **Botón del hype** | hasta 2000 | No | 2 o 3 equipos inflan su objeto pulsando. Cupón opcional que solo ve el equipo ganador |
| | **Carrera matemática** | hasta 2000 | Sí (3 niveles) | Cada uno resuelve operaciones distintas para avanzar su coche |
| Sorteos y subastas | **Sorteo gamificado** | hasta 2000 | No | Boletos extra por participar con la institución y por la palabra secreta; «lluvia de esferas» en el proyector |
| | **Subasta inversa** | hasta 2000 | No | Gana la oferta más baja que nadie repita; pujas gratis |
| Solo adultos (+18) | **Paranoia** | 3–12 | No | «¿Quién de la mesa…?»: la moneda decide si la pregunta se revela |
| | **Yo nunca** | 3–30 | No | Sin alcohol: se pierden vidas (dedos). Modo anónimo y categorías |

## Carrera de caballos

Hasta **cuatro jinetes** corren en un hipódromo que se ve en el teléfono y, en
grande, en el proyector. Los asientos libres se llenan con **bots**.

1. **Elige a cuánto te la juegas** (9 s): 🐢 **Fácil** (acierto +1, fallo −1),
   🐎 **Media** (+2 / −1) o 🔥 **Difícil** (+3 / −2). Si no eliges, vas en Fácil.
2. **Responde** una pregunta de esa dificultad. Salen del **banco general de la
   plataforma** (más de mil preguntas en 19 áreas, por niveles; se pueden elegir
   las áreas y no se repiten en 60 días para quien organiza) o de tus propias
   preguntas (*Mis preguntas* o un banco de la empresa, por su nivel).
3. **Galopa**: los caballos avanzan o retroceden según el acierto. El acierto
   **más rápido** de la ronda suma ⚡ una casilla más. Caer en una 🥕
   **zanahoria** suma 2; en un 💧 **charco de barro**, resta 1.

Cada jinete tiene un **comodín 50:50** por carrera, que tacha dos respuestas
falsas. Gana quien cruza primero la meta (12, 16, 20 o 25 casillas); si cruzan
varios en la misma ronda, quien llegó más lejos. Tras 40 rondas gana quien vaya
delante.

**Bots** (el nivel se elige en las opciones):

| Nivel | Cómo eligen | Aciertan (fácil / media / difícil) |
| --- | --- | --- |
| Fácil | Casi siempre Fácil | 72 % / 50 % / 30 % |
| Medio | Sobre todo Media | 88 % / 70 % / 50 % |
| Difícil | Arriesgan con Difícil | 96 % / 86 % / 72 % |

Todos arriesgan más cuando van tres casillas o más por detrás del líder, y no
arriesgan a una casilla de la meta. Con el botón **Jugar ya contra 3 bots** se
crea la sala, se llena con bots del nivel elegido y la carrera empieza sola; para
jugar con amigos, se crea la sala, se comparte el código y se completan los
asientos libres con «+ Añadir bot». El servidor elige las preguntas, guarda las
respuestas correctas y mueve los caballos: el navegador nunca ve la solución
antes de responder.

En el catálogo, «Dudo» es el juego de dados mentirosos. En Bolivia se suele
llamar **Cacho** al juego de dados tipo generala, que es otro distinto, y por
eso aquí se usa «Dudo».

## Quién puede unirse

Al crear la sala se elige el modo de acceso:

- **Cualquiera con el enlace**: basta un apodo. El apodo va ligado al
  dispositivo, así que al recargar la página se vuelve a la misma plaza.
- **Con Google o con teléfono o correo verificado**: invitados verificados con
  código, como en las convocatorias de empresa (ver [EMPRESAS.md](EMPRESAS.md)).
  Mientras `VERIFY_MODE` sea `"prueba"`, el código se muestra en pantalla.
- **Solo con cuenta de Google**.

Algunas reglas se aplican siempre:

- Una sala **con premio** nunca admite apodos sueltos: pasa sola a acceso
  verificado.
- **Sorteo** y **subasta** exigen marcar la casilla de responsabilidad legal
  al crearlos. Las bases que escriba el organizador se muestran a todos.
- **Paranoia** y **Yo nunca** exigen una **edad verificada de 18 o más**, tanto
  para crear la sala como para entrar. Un menor ve el aviso y no entra, y en
  estos juegos no hay acceso con apodo.
- Para crear salas hace falta entrar con Google y tener el registro completo.
  Cada persona puede abrir como máximo 20 salas al día.

Quien administra u organiza en una **empresa o comunidad** aprobada puede crear
la sala **en nombre de ella**. La sala muestra entonces el logo, el color y el
lema de la marca, en el proyector y en los teléfonos. En la trivia en vivo, las
preguntas pueden salir de un banco de la empresa o de tus bancos personales
(*Retos → Mis preguntas*).

Los colegios, institutos y universidades no abren salas en su nombre ni usan sus
bancos en juegos: lo suyo son los exámenes y prácticas de Educativo.

## Sorteo gamificado

1. El organizador crea la sala (mejor en nombre de su empresa), elige de 1 a 5
   ganadores y, si quiere, una **palabra secreta** que dirá en voz alta durante
   el evento. La palabra no se publica en ninguna parte.
2. Abre el proyector y pulsa **Empezar**: la inscripción queda abierta. Aunque
   la sala ya haya empezado, la gente se sigue uniendo con el QR que muestra la
   pantalla.
3. Boletos de cada participante (máximo 10):
   - 1 por participar.
   - Hasta 5 más por haber participado antes en convocatorias o salas de la
     misma institución. Los calcula el servidor.
   - 2 más por escribir la palabra secreta.
4. Al pulsar **Sortear ahora**, el servidor elige a los ganadores con **azar
   criptográfico, ponderado por boletos** y sin repetir a nadie. Solo después
   empieza la animación de 12 segundos:
   - Las esferas caen y rebotan; su tamaño es proporcional a los boletos.
   - Las que no ganan se apagan una a una.
   - Los ganadores entran en la copa con su nombre.

   La animación solo desvela el resultado, no lo decide. Con más de 80
   participantes se animan 80 esferas, y los ganadores siempre están entre ellas.
5. Cada ganador ve «¡Has ganado!» en su teléfono.

## Subasta inversa

- Opciones: duración (de 1 a 5 minutos), pujas por persona (3, 5 o 10), oferta
  máxima (Bs 10 a Bs 500) y una web del patrocinador (opcional).
- Cada puja lleva céntimos. Tras pujar, cada cual ve el estado de las suyas:
  «única y la más baja por ahora», «única, pero no la más baja» o «repetida».
- **Visitar al patrocinador** da 2 pujas más y un **mapa de pistas**, que indica
  en qué tramos de precio hay ofertas repetidas y cuántas únicas.
- Al acabar el tiempo gana la **oferta más baja que sea única**. Si ninguna
  oferta quedó única, no hay ganador. El proyector muestra al ganador y las
  ofertas más bajas, con las repetidas tachadas.
- Las pujas son gratis y no hay pagos de por medio.

## Proyector y rendimiento

- Cada sala vive en un **Durable Object** de Cloudflare (backend SQLite, incluido
  en el plan gratuito), que mantiene las conexiones WebSocket con hibernación.
- El estado se envía a los teléfonos en lotes cada 150 ms (400 ms en sorteo y
  subasta), y solo a quienes su vista les cambió. Los latidos de conexión los
  responde Cloudflare sin despertar a la sala.
- Cada vista está **filtrada por persona**: nadie recibe los dados, las cartas,
  las preguntas secretas ni la palabra del sorteo de los demás.
- Se probó con 300 jugadores simultáneos en local; el resultado llegó a todos en
  menos de un segundo.

**Coste.** En el plan gratuito de Workers hay unas 100 000 peticiones al día, y
los mensajes WebSocket que recibe un Durable Object cuentan a razón de 20 por
petición. Para eventos grandes y frecuentes (varios cientos de personas pulsando
en el botón del hype) conviene el plan **Workers Paid (5 USD/mes)**. Para una
reunión de amigos o una clase, el gratuito sobra.

## Aspectos legales (resumen, no es asesoría)

- **Sorteos y subastas con premio**: la responsabilidad es de quien organiza,
  incluidas las autorizaciones que exija la ley. En Bolivia, los sorteos y las
  promociones empresariales requieren la autorización de la **Autoridad de
  Fiscalización del Juego (AJ)**. La plataforma pide aceptar esta
  responsabilidad al crear la sala y muestra las bases a todos.
- **Juegos para adultos**: solo con edad verificada de 18 o más, sin alcohol de
  por medio y con tono suave por defecto; el tono «picante» hay que activarlo.
- Los resultados de cada partida quedan en `sala_jugadores` y cuentan en las
  métricas de la institución (salas y participaciones).

## Añadir un juego nuevo

Cada juego está en dos archivos:

- `public/juegos/<juego>.js` tiene las **reglas**. El Durable Object y el
  navegador usan el mismo archivo. Define `normaliza`, `inicia`, `accion`,
  `tick`, `vista` (lo que ve cada persona) y `resultado`, y opcionalmente un
  `bot` puro, sin efectos.
- La **pantalla** va en uno de los archivos `*-ui.js`. Define
  `jugador(el, g, ctx)`, `pantalla(...)` para el proyector, `opciones` y
  `leeOpciones`.

Para darlo de alta:

1. Importa las reglas en `src/juegos.js`.
2. Añade las dos etiquetas `<script>` en `public/index.html`.
3. Añade los archivos a la lista de `public/sw.js`.
