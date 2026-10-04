# Educativo · instituciones, cursos y cuestionarios

> La sección se llamaba «Aula». Por dentro (modo `aula`, archivos `aula.js`,
> tablas) conserva ese nombre, así que los enlaces antiguos siguen funcionando.

El aula es la parte de **The Final Test** pensada para universidades e institutos:
cada institución organiza su estructura, sus docentes crean cursos y bancos de
preguntas, y los estudiantes responden cuestionarios de parcial desde el móvil.
El docente obtiene los registros por estudiante y por pregunta, y los descarga en
Excel.

## Roles

| Rol | Qué puede hacer |
| --- | --- |
| **Administración de la plataforma** | Aprobar, dejar pendiente o suspender instituciones. Se define con el secreto `PLATFORM_ADMINS` (ver [SETUP.md](SETUP.md)). |
| **Administración de la institución** | Quien la registra. Cambia la estructura y los ajustes, gestiona miembros y roles, marca el consentimiento de menores y ve todos los cursos, bancos y registros. |
| **Docente** | Entra con el enlace de docentes. Crea cursos, bancos de preguntas y cuestionarios, y ve los registros de sus cursos. |
| **Auxiliar** | El docente lo nombra dentro de un curso. Crea cuestionarios en ese curso y ve sus registros. |
| **Estudiante** | Entra con el código o el enlace del curso, su nombre completo y su teléfono (el registro universitario es opcional). Responde los cuestionarios y ve su resultado. |
| **Auspiciador** | Reservado para la fase de patrocinios. |

Un estudiante pertenece a su institución, pero sigue pudiendo participar en
concursos públicos y retos de otras personas.

## Registro con consentimiento

Antes de unirse a una institución, un curso o un concurso, cada persona indica su
fecha de nacimiento y acepta los [Términos](public/terminos.html) y la
[Política de privacidad](public/privacidad.html). Se pide al entrar con Google la
primera vez y de nuevo cuando una acción lo exige.

- **Menores de 18 años:** además dan el nombre y el correo de su madre, padre o
  tutor. Pueden usar los cursos de su institución, pero no inscribirse en
  concursos abiertos con premio hasta que conste el consentimiento, del tutor o de
  la institución (la administración lo marca en **Miembros**).
- Si cambian los términos, se sube `TERMS_VERSION` en `src/aula.js` y todo el
  mundo vuelve a aceptarlos al siguiente uso.

## Institución

1. **Educativo → Registrar una institución.** Nombre, tipo, dominio de correo opcional
   y estructura.
2. Si hay `PLATFORM_ADMINS`, la institución queda **pendiente** hasta que la
   plataforma la apruebe. Mientras tanto se puede preparar la estructura, pero no
   abrir cursos. Sin `PLATFORM_ADMINS`, se activa al momento.
3. Con **dominio** (por ejemplo `umsa.bo`) solo entran cuentas de ese correo.

### Estructura configurable

Los niveles dependen del tipo y se pueden renombrar, añadir (hasta seis) o quitar
mientras no tengan unidades:

| Tipo | Niveles por defecto |
| --- | --- |
| Universidad | Facultad → Carrera → Materia |
| Instituto | Carrera → Materia |
| Colegio | Nivel → Curso → Materia |
| Empresa | Área → Equipo |
| Comunidad | Grupo |

En **Estructura** se crean las unidades en árbol (Ciencias Puras › Matemática ›
Cálculo I). Los cursos y los bancos se asocian a una unidad del último nivel, y
los registros se filtran por cualquier unidad.

### Miembros

- **Enlace de docentes:** quien lo abre se une como docente. Se copia desde
  **Miembros** y se puede cambiar si circula de más.
- La tabla muestra rol, registro universitario y, para menores, la casilla de
  consentimiento. Una institución nunca se queda sin administración.
- Quitar a alguien lo saca también de todos los cursos de la institución.

## Curso

Un curso es un paralelo de una materia en una gestión (por ejemplo, «Cálculo I ·
Paralelo A», 2/2026).

- Tiene un **código de 6 caracteres** y un enlace `…/?curso=CÓDIGO`. El
  estudiante lo abre, escribe su nombre completo y su teléfono (y, si quiere, su registro universitario) y entra. El código
  también sirve en la portada.
- Con **aprobación**, cada ingreso queda pendiente hasta que el docente lo acepta.
- En **Estudiantes** el docente aprueba, quita o nombra auxiliares.
- Al **archivar** el curso ya no entra nadie ni se crean cuestionarios; los
  registros se conservan.

## Bancos de preguntas

Cada docente tiene sus bancos dentro de la institución (hasta 2000 preguntas por
banco). **Cada banco pertenece a una materia** (el último nivel de la estructura),
y eso decide quién lo ve:

| Quién | Qué puede hacer |
| --- | --- |
| Quien lo creó y la administración | Verlo, usarlo y **editarlo** (preguntas, importación, IA, nombre y materia) |
| Docentes con un curso de esa misma materia | **Verlo y usarlo** en sus exámenes y prácticas, en solo lectura |
| Los demás docentes | No lo ven |

Si la institución todavía no tiene materias en su *Estructura*, la pestaña Bancos
pide crearlas primero. Los bancos antiguos sin materia aparecen como «Sin
materia» y quien los edita se la asigna desde el propio banco. Cada docente ve
en *Registros* solo los cuestionarios de sus cursos, y nunca a los estudiantes
de cursos ajenos. En una institución educativa, los bancos son **solo para sus exámenes y
prácticas**: no se usan en concursos, retos ni juegos, y la institución no abre
convocatorias ni salas de juego en su nombre. Para jugar con preguntas propias,
cada persona tiene *Retos → Mis preguntas* (ver [RETOS.md](RETOS.md)). Cada pregunta lleva enunciado, una respuesta correcta, de 1 a 5
incorrectas, nivel (fácil, medio, difícil) y tema.

### Importar

**Importar preguntas** acepta un Excel (`.xlsx`), un CSV o texto pegado. Antes de
guardar se ve cada pregunta revisada, en verde, ámbar (aviso) o rojo (error, no se
importa).

**Tabla** (Excel, CSV o filas copiadas de una hoja de cálculo). La primera fila
puede tener encabezados; si no, se leen las columnas en este orden:

| Pregunta | Correcta | Incorrecta 1 | Incorrecta 2 | Incorrecta 3 | Nivel | Tema |
| --- | --- | --- | --- | --- | --- | --- |
| ¿Derivada de x²? | 2x | x | x²/2 | 2 | 1 | Derivadas |

El botón **Plantilla Excel** descarga este formato con ejemplos.

**Texto** (formato Aiken ampliado):

```
¿Cuál es la derivada de x²?
A) 2x
B) x
C) x²/2
ANSWER: A
NIVEL: fácil
TEMA: Derivadas
```

Las preguntas se separan con una línea en blanco. Vale también `RESPUESTA:` o
`CORRECTA:`. `NIVEL` y `TEMA` son opcionales (nivel medio por defecto).

**Se rechaza** una pregunta sin enunciado o de más de 300 caracteres; sin
respuesta o con una letra que no existe; con menos de 2 opciones o más de 6; con
opciones repetidas o de más de 150 caracteres; o que ya está en el banco o
repetida en el mismo archivo. **Se avisa** de «todas/ninguna de las anteriores»
(al barajar pierde sentido) y de niveles no reconocidos.

El servidor vuelve a validar todo, y admite hasta 500 preguntas por envío (la
pantalla las parte en lotes).

### Editar y exportar

Cada pregunta se edita o borra en el banco. **Exportar a Excel** descarga el
banco completo en el mismo formato de importación. Borrar una pregunta no cambia
los cuestionarios ya creados: sus preguntas quedan fijadas al crearlos.

## Cuestionarios

Desde el curso, **Nuevo cuestionario**:

- **Parcial** (Práctica, Primer parcial… o el texto que se quiera) para agrupar
  los registros.
- **Preguntas** de un banco, filtrando por tema y dificultad (mixta, solo un
  nivel o progresiva de fácil a difícil), o de la cultura general de la
  plataforma.
- **Número de preguntas** (1 a 100), **tiempo por pregunta** y **errores
  admitidos** (sin límite, para que se respondan todas).
- **Apertura y cierre**, ahora o en una fecha.

Cada estudiante recibe las preguntas en otro orden y con las opciones barajadas,
y solo puede responder una vez. Solo lo ven los miembros del curso. Al cierre,
cada estudiante ve su resultado y la corrección de sus respuestas; no hay ranking
público ni ganador.

## Registros

- En el cuestionario, **Registros y estadísticas**: una fila por estudiante del
  curso (también quien no participó) con nombre completo, teléfono, registro universitario, aciertos,
  errores, tiempo y estado; y cada pregunta con su porcentaje de acierto, de la
  más fallada a la más acertada. **Descargar Excel** genera un libro con las
  hojas *Resultados* y *Preguntas*.
- En la institución, **Registros** lista todos los cuestionarios con
  participación y media, filtrables por unidad, parcial y gestión.

## Lo que viene después

- **Auspiciadores**: patrocinio de concursos por institución.


## Prácticas, exámenes, libreta, grupos y alta masiva

- **Examen o práctica.** Al crear un cuestionario se elige el tipo:
  - **Examen**: un solo intento, con tiempo por pregunta y errores admitidos.
    Las respuestas correctas se ven al cierre.
  - **Práctica**: intentos ilimitados mientras esté abierta, sin límite de
    errores. Cada intento trae preguntas al azar. Tras cada respuesta se ve si
    fue correcta, cuál era la correcta y, si la hay, una explicación. Cuenta el
    mejor intento (hasta 60 intentos al día por estudiante).
- **Grupos.** En *Estudiantes → Grupos* el curso se divide en grupos
  (laboratorio, turno…). Cada estudiante va en uno como mucho. Un examen o una
  práctica se puede dirigir a un grupo: el resto del curso no lo ve ni puede
  hacerlo.
- **Alta masiva.** En *Estudiantes → Alta masiva desde Excel*:
  - Se sube un Excel o CSV con las columnas *nombre*, *correo* y *registro*, o
    se pegan las filas.
  - Antes de enviar se revisan: las filas sin un correo válido se ignoran.
  - Quien ya tiene cuenta queda inscrito al momento (y, si se elige, en un
    grupo). El resto queda como *alta pendiente* y entra en el curso la primera
    vez que usa la app con ese correo.
- **Libreta.** En la pestaña *Libreta* se ven todos los estudiantes del curso
  con una columna por cuestionario:
  - Exámenes: nota de 0 a 100, según los aciertos sobre el total de preguntas.
  - Prácticas: el mejor intento, en %, y cuántos intentos hizo.
  - Promedio de los exámenes: un examen cerrado sin responder cuenta 0.
  - Se puede filtrar por grupo y descargar en Excel.
- **Mi avance.** Cada estudiante ve en su curso sus notas, su promedio y su
  mejor intento en cada práctica. Nunca ve lo de los demás.

Tablas: `cuestionario_opciones`, `practica_intentos`, `course_groups`,
`course_group_members` y `course_invites` (ver SETUP.md).

## Ayudas con IA (plan Pro)

El **plan Pro** lo activa la administración de la plataforma, institución por
institución, en *Administración de la plataforma → Instituciones → Plan*. Allí se
fijan los **usos de IA al mes** (la cuota) y, si se quiere, una fecha de
vencimiento; al vencer, la institución vuelve sola al plan gratuito. Importar
desde Excel o pegando texto es **gratis para todos**.

Con el plan Pro, quien administra o es docente tiene en cada banco:

- **✨ Generar con IA**:
  - **Desde un tema**, por ejemplo «Fotosíntesis, nivel secundaria».
  - **Desde un texto o archivo**: se pegan apuntes o se adjunta un PDF (hasta
    12 MB), un Word (.docx) o un TXT.
  - Se elige cuántas preguntas (5 a 30) y la dificultad.
  - Las preguntas propuestas **no se guardan solas**: pasan por la misma revisión
    que un Excel y el docente decide si las importa.
- **✨ Revisar con IA**: revisa hasta 80 preguntas del banco y señala las que
  tienen un problema: respuesta dudosa, más de una opción defendible, faltas,
  distractores que delatan la respuesta o nivel mal puesto. Muestra *Ahora* y
  *Propuesta*, y cada corrección se **aplica** o se **descarta** una a una.
- **Explicaciones en las prácticas**: al crear una práctica aparece la casilla
  *Explicación con IA en cada pregunta*. Tras cada respuesta, el estudiante ve
  por qué la correcta es la correcta. Las explicaciones se generan la primera vez
  y se guardan, así que las siguientes veces no gastan cuota.

**Cuota.** Cada generación, cada revisión y cada tanda de explicaciones nuevas
gasta **un uso**. El banco muestra cuántos quedan este mes. Si la IA falla, el
uso se devuelve. Sin cuota, la app lo avisa y todo lo demás sigue igual.

**Configuración.** El proveedor de IA se elige en *Administración de la
plataforma → IA*: **Gemini de Google AI Studio** (por defecto), OpenRouter,
OpenAI, Anthropic u otra API compatible con OpenAI. Su clave va como Secret en
Cloudflare (ver SETUP.md). Sin clave, los botones siguen visibles, pero avisan
de que la IA no está configurada.

Tablas: `org_planes`, `ia_uso` e `ia_explicaciones` (ver SETUP.md).

## Tipos de pregunta, imágenes y desarrollo

Al añadir o editar una pregunta de un banco se elige el **tipo**:

| Tipo | Cómo responde el estudiante | Cómo se corrige |
| --- | --- | --- |
| Opción múltiple | Elige una opción; las opciones pueden llevar **imagen** (p. ej. «elige el gráfico correcto») | Sola |
| Verdadero o falso | Elige Verdadero o Falso | Sola |
| Respuesta numérica | Escribe un número (con coma o punto) | Sola, con la **tolerancia** que fije el docente (± 0,05, por ejemplo) |
| Texto libre | Escribe su respuesta | La califica el docente en **Por revisar** |

- Cualquier pregunta puede llevar una **imagen en el enunciado** (una figura, un
  gráfico, una fórmula). La app la reduce antes de subirla (lado mayor de 1000 px)
  y la guarda una sola vez.
- Cualquier pregunta puede llevar su **desarrollo** (la resolución paso a paso):
  se muestra en las prácticas tras responder y en los exámenes al cierre.
- Desde Excel o CSV, con fila de títulos, se admiten las columnas **Tipo**
  (opción, vf, numérica, abierta), **Tolerancia** y **Desarrollo**; la plantilla
  descargable trae un ejemplo de cada tipo. En el texto con opciones A) B) C),
  una línea `DESARROLLO:` tras la respuesta añade la resolución. Las imágenes se
  ponen desde el editor.
- Los exámenes admiten hasta **5 minutos por pregunta**, pensados para el texto
  libre.

### Respuestas de texto libre

- Mientras está **por revisar**, no cuenta como error ni elimina a nadie; el
  estudiante ve cuántas respuestas le faltan por revisar.
- En la ficha del cuestionario, quien lo gestiona tiene **Por revisar (N)**: ve
  cada respuesta con la respuesta modelo, la marca **Correcta** o **Incorrecta** y
  puede dejar un comentario. Marcar «Correcta» suma un acierto a la nota (y la
  libreta se actualiza); cambiarla después la resta.
- Al cierre, cada estudiante ve su respuesta, la calificación, el comentario y el
  desarrollo.

Las preguntas numéricas, de texto libre o con imágenes en las opciones son para
Educativo: los concursos y juegos de empresas solo usan opción múltiple y
verdadero o falso.

Tablas: `bank_question_extra`, `preguntas_imagenes` y `contest_textos` (ver
SETUP.md).

## Repaso de ingreso y nivelación (público)

Un banco de preguntas puede publicarse como **repaso abierto**, pensado para
estudiantes que preparan el examen de ingreso a la universidad o un curso de
nivelación, aunque no sean de la institución.

- **Quién publica**: la administración de una universidad, instituto o colegio
  (pestaña **Repaso** de la institución) y la administración de la plataforma
  (**Administración de la plataforma → Repaso**).
- **Catálogo**: en Educativo, **📚 Repaso de ingreso y nivelación**. Se ve sin
  sesión; para practicar hace falta entrar con Google y completar el registro.
- **Gratis**: cada intento trae preguntas al azar del banco (opción múltiple,
  verdadero o falso y numéricas; el texto libre no se usa). El servidor corrige
  cada respuesta y dice al momento si acertó y cuál era la correcta.
- **Con código de acceso**: además se ve el **desarrollo** paso a paso de cada
  pregunta y la **calificación**: nota sobre 100, aciertos por tema (con el tema a
  reforzar) e historial de intentos.
- **Códigos**: quien publica genera códigos de 10 caracteres (se escriben con o
  sin guion) para un repaso o para todos los de la institución; la plataforma,
  también para todos los repasos. Se eligen los días de acceso (7 días a 1 año),
  cuántas veces se puede usar cada código y una nota (p. ej. «Promoción feria
  2026»). La lista se descarga en Excel para venderlos o repartirlos por fuera de
  la app (QR, transferencia, inscripción al curso de nivelación). Al canjear, los
  días se suman a los que ya tenga.
- **Miembros** de la institución que publica: acceso completo sin código.

Tablas: `repasos`, `repaso_codigos`, `repaso_accesos` y `repaso_intentos` (ver
SETUP.md).
