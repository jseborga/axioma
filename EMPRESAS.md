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
2. **Se registra sola.** Desde **Empresas y eventos → Registrar una empresa o
   comunidad**. Si hay administración de plataforma (`PLATFORM_ADMINS`), queda
   pendiente hasta que la aprueben.

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
