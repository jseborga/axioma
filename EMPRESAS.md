# Empresas y eventos

La sección **Empresas y eventos** de The Final Test es para empresas, marcas,
comunidades y eventos que no son una universidad: tienen su propia página con logo
y color, publican convocatorias de trivia con premio y las comparten con un QR. La
gente participa sin trámites, con su cuenta de Google o como **invitado**, con un
teléfono o correo que se verifica con un código.

Las instituciones educativas de la sección [Educativo](AULA.md) también pueden usar convocatorias,
marca y métricas.

## Cómo empieza una empresa

Hay dos caminos:

1. **La plataforma la da de alta.** En **Administración de la plataforma →
   Instituciones → Dar de alta una institución o empresa** se escribe el nombre,
   el tipo y el correo de su responsable. Queda activa al momento. Si esa persona
   ya tiene cuenta, es administradora ya; si no, lo será en cuanto entre con Google
   con ese correo.
2. **Se registra sola**, con el perfil **Empresas y eventos** que da la
   administración de la plataforma (en **Administración → Perfiles**, por correo, o
   aprobando la solicitud que la persona envía desde «Mis grupos y partidas»). Con
   el perfil, **Empresas y eventos → Registrar una empresa o comunidad** la deja
   activa al momento. Sin perfil, la sección Empresas no aparece en el menú.

Su administración puede dar de alta a más personas por correo en **Miembros**,
como administración o como *organizador* (puede crear bancos y convocatorias).

## Marca y página pública

En **Marca y ajustes**:

- **Dirección de la página**: `…/?marca=cafe-central`.
- **Color** y **logo** (se reduce a 256 px en el navegador antes de guardarse).
- **Lema**, **descripción** y **sitio web**.

La página muestra las convocatorias abiertas (las públicas) y las terminadas de
los últimos 30 días. Desde ahí o desde **Convocatorias → QR de la página** se
descarga su QR como cartel.

## Convocatorias

Las convocatorias son de **empresas y comunidades**. Los colegios, institutos y
universidades no las tienen: trabajan con exámenes y prácticas en sus cursos
(ver [AULA.md](AULA.md)).

**Convocatorias → Nueva convocatoria**:

| Campo | Qué hace |
| --- | --- |
| Nombre, premio, descripción | Lo que ve quien participa |
| Preguntas | De un banco propio (importado de Excel o texto, ver [AULA.md](AULA.md)) o de la cultura general de la plataforma |
| Tema, dificultad, número, tiempo, errores | Igual que en los cuestionarios |
| Quién puede participar | **Cualquiera** (aparece en la página de la marca y en Concursos), **solo con el enlace o el QR**, o **solo miembros** |
| Admitir invitados | Si se participa sin cuenta, con teléfono o correo verificado |

Cada convocatoria tiene su código, su enlace `…/?concurso=CÓDIGO` y su **QR**
(botón *QR* en la ficha o en la lista), que se descarga como cartel PNG de
1080×1350 con la marca, el título, el premio y el enlace.

Al cierre se publica el ranking y el ganador. En **Registros y estadísticas** la
organización ve a cada participante con su contacto, si es invitado y si aceptó
que lo contacten, y lo descarga en Excel.

## Competencias de juego rápido (campañas con premios y descuentos)

Además de las convocatorias de trivia, una empresa o comunidad puede lanzar una
**competencia de juego rápido**: **Convocatorias → Nueva competencia de juego
rápido** (que también ofrece los juegos sin fin, más abajo).

- **Juego**: trivia, memoria, cálculo, reflejos o del 1 al 25 (los mismos de los
  retos). En trivia, memoria y cálculo gana quien hace más puntos; en reflejos y
  del 1 al 25, quien hace menos tiempo.
- **Intentos por persona**: 1, 2, 3, 5, 10 o libres. **Cuenta la mejor marca** de
  cada persona.
- **Duración**: de 1 hora a 1 mes; puede empezar ahora, en una hora o mañana.
- **Premios por puesto** (hasta tres rangos, p. ej. «1.º: una cena», «2.º a
  10.º: 20 % de descuento»): se asignan al **cerrar** la competencia, sola al
  vencer el plazo o con **Cerrar ahora**.
- **Premio por puntaje** («con 1200 puntos o más: 10 % de descuento»; en los
  juegos de tiempo, «con 350 ms o menos»): cada persona que lo logra recibe su
  premio **al momento**, una vez por persona.
- Opciones: aparecer en la página de la marca, admitir **invitados verificados**
  (teléfono o correo con código) y mostrar el **ranking en vivo** (si no, se
  publica al cerrar).

**Cómo se juega.** Con el QR o el enlace `?campana=CÓDIGO` se abre la ficha con
la marca, los premios y el ranking. **Jugar** abre la partida: el servidor la
genera con una semilla secreta, la cronometra y la puntúa (nadie puede enviarse
una marca inventada, y en la trivia la respuesta correcta no llega al navegador).
Al terminar se ve la marca, el puesto y, si lo ganó, el cupón.

**Cupones.** Cada premio es un **cupón único de 8 caracteres** (`XXXX-XXXX`) que
la persona ve en la ficha de la competencia. En la empresa:

- **Validar cupón** (arriba en Convocatorias, o en cada competencia): muestra de
  quién es, qué premio da y si ya se usó; **Canjear ahora** lo marca como usado
  (un cupón no se canjea dos veces).
- La gestión de cada competencia muestra el ranking, quién aceptó que la empresa
  lo contacte (con su teléfono o correo), los cupones y su estado, y lo descarga
  en **Excel** (hojas *Ranking* y *Cupones*).

Los menores de 18 años solo juegan por premios si la empresa confirma el
consentimiento de su tutor, como en las convocatorias con premio. Tablas:
`campanas`, `campana_intentos` y `campana_cupones` (ver SETUP.md).

### Granja Express con tu marca

En **Nueva competencia**, el grupo «Arcade» trae **Granja Express** (4 minutos, con preguntas de mejora) y el
grupo «Sin fin», **Granja sin fin**. El camión de reparto lleva el logo y el color de tu
marca, y puedes poner el nombre de tus productos en lugar de «Pan», «Jugo» y «Torta».
El premio por puntaje se mide en monedas. Ver [GRANJA.md](GRANJA.md).

### Competencias sin fin (maratón): se juega hasta perder

En **Nueva competencia**, el grupo «Sin fin» del juego tiene tres opciones en las
que no hay un final fijo: gana quien llega más lejos.

- **Memoria sin fin**: la secuencia de casillas empieza con 3 y crece de una en
  una, **sin tope**, y cada vez se enciende más rápido. Un fallo cuesta una vida
  y repite la secuencia. La marca es la secuencia más larga repetida. Vidas: 1
  (muerte súbita), 2 o 3. Tres minutos sin jugar cierran la partida con lo
  conseguido.
- **Maratón de sudoku**: sudokus seguidos, cada vez más difíciles (Fácil →
  Medio → Difícil → Experto). Cada cifra bien puesta suma 1 a 4 puntos según el
  nivel y cada sudoku completo, 25 a 100 más. Una cifra equivocada cuesta una
  vida.
- **Maratón de Axioma**: tableros de Axioma seguidos, de 4×4 con una sola regla
  hasta 6×6 con todas. Cada tablero resuelto vale 10, 20… hasta 60 puntos.
  Comprobar mal (las celdas o el par de reglas) cuesta una vida.

En sudoku y Axioma la empresa elige también el **reloj inicial** (sudoku: 10 a
60 min; Axioma: 3 a 30 min) y el **tiempo extra por tablero resuelto** (o
ninguno). La partida se acaba al **quedarse sin vidas** o **sin tiempo**, y
también al **plantarse**; siempre cuenta lo conseguido. Los premios por puesto y
por puntaje funcionan igual (en la memoria, el umbral es en casillas).

**Juego limpio.** El navegador de la empresa prepara los tableros al publicar
(28 sudokus o 54 tableros de Axioma, con su solución) y el servidor los guarda;
a cada jugador le llegan de uno en uno, **sin la solución**, y en su propio
orden. El servidor comprueba cada cifra, cada tablero y cada secuencia, lleva
las vidas y el reloj, y rechaza lo imposiblemente rápido (dos cifras en menos de
0,3 s, un tablero de Axioma en menos de 4 s o una secuencia antes de que termine
de verse). La partida se guarda paso a paso: quien recarga la página o sale con
«Salir» la sigue con **Seguir mi partida** (en los maratones el reloj no se
detiene). Tablas: `campana_maraton` y `campana_progreso` (ver SETUP.md).

## Participar como invitado

1. Quien abre el QR ve la convocatoria y pulsa **Participar con mi teléfono o
   correo**.
2. Escribe su nombre, teléfono (con código de país) o correo, fecha de nacimiento,
   acepta los términos y, si quiere, que la empresa lo contacte con promociones.
3. Recibe un código de seis cifras, lo escribe y queda inscrito.

### Contra la trampa

- **Una persona, un contacto.** El usuario del invitado se deriva de su teléfono o
  correo verificado (normalizado: `+591 700-00001` y `0059170000001` son el mismo;
  en Gmail se ignoran los puntos y el `+etiqueta`). Con el mismo contacto no se
  puede volver a jugar.
- **Códigos de un solo uso**, que caducan a los 10 minutos, con 5 intentos.
- **Límites**: 3 códigos por contacto y hora, 20 por dirección IP y hora.
- **Bloqueo**: la plataforma puede bloquear un usuario o contacto; su sesión deja
  de valer y no puede pedir otro código.
- Los invitados **solo** entran en convocatorias que los admiten: no crean
  concursos, no usan la sección Educativo ni los retos entre amigos.
- **Menores de 18**: dan los datos de su tutor y no entran en convocatorias con
  premio sin su consentimiento.

### Modo de pruebas

Mientras no haya un servicio de SMS o correo conectado, `VERIFY_MODE = "prueba"`
en `wrangler.toml`: **no se envía nada** y el código aparece en pantalla, en un
recuadro *Modo de pruebas*. Así se prueba todo el circuito. Los invitados
verificados así quedan marcados como *código de prueba* en los registros y en la
administración.

Para verificar de verdad hará falta conectar un proveedor (por ejemplo, un servicio
de SMS o de correo transaccional) en la función `envia` de `src/invitados.js`,
guardar su clave como **Secret** y cambiar `VERIFY_MODE` a `"real"`. Con `"real"`
y sin proveedor, la API responde que la verificación no está disponible y la
pantalla sugiere entrar con Google.

## Métricas

En **Métricas** (administración de la empresa o de la plataforma):

- Personas, invitados, partidas, media de aciertos, convocatorias abiertas,
  cuántas aceptan contacto, preguntas y bancos.
- Inscripciones por día de los últimos 30 días (con tabla).
- Las convocatorias con más participación.
- **Exportar participantes a Excel**: una fila por persona, con su contacto, tipo,
  verificación, si acepta contacto, convocatorias, partidas y mejor resultado.
  Solo se debe contactar a quien aceptó.

## Administración de la plataforma

**Educativo** o **Empresas → Administración de la plataforma** (solo para los correos de
`PLATFORM_ADMINS`):

- **Resumen**: cuentas de Google, invitados (y cuántos con código de prueba),
  instituciones por tipo, convocatorias abiertas, inscripciones de la semana y del
  mes, bloqueados y usuarios nuevos por día.
- **Instituciones**: aprobar o suspender, dar de alta con su administración, y
  ver las métricas o los usuarios de cada una. El botón **Administración** de cada
  institución muestra quién la gestiona y permite:
  - **Designar** a alguien por su correo como *Administración* o como *Creador de
    retos* (en instituciones educativas, *Docente*). Si ya tiene cuenta, puede
    gestionarla al momento; si no, en cuanto entre con Google con ese correo.
  - Cambiar su rol o **quitarlo** de la institución, y anular altas pendientes.
  - Las que no tienen a nadie aparecen marcadas como *Sin administración*.
- **Plan** de cada institución: *Gratis* o *Pro (con IA)*, con los usos de IA al
  mes y una fecha de vencimiento opcional. El chip de cada institución muestra el
  plan y los usos gastados del mes. Ver «Ayudas con IA» en [AULA.md](AULA.md).
- **Usuarios**: buscar por nombre, correo o teléfono; filtrar por tipo (Google,
  invitados, bloqueados) o por institución; **designar** a una persona en cualquier
  institución con el rol que corresponda; bloquear con un motivo y desbloquear.

### Qué puede hacer cada rol

| Rol | Puede |
| --- | --- |
| Administración | Todo en su institución: marca y página, miembros y roles, bancos, convocatorias con premio, cuestionarios y cursos, métricas y exportaciones |
| Organizador (Docente en educación) | Sus bancos de preguntas, convocatorias con premio y QR, y en educación sus cursos y cuestionarios, con sus registros |
| Estudiante o participante | Participar |

## Lo que viene después

- Conectar un servicio real de SMS o correo para los códigos.
- Auspiciadores y patrocinio de convocatorias.
