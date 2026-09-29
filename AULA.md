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
| **Estudiante** | Entra con el código o el enlace del curso y su registro universitario. Responde los cuestionarios y ve su resultado. |
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
  estudiante lo abre, escribe su registro universitario y entra. El código
  también sirve en la portada.
- Con **aprobación**, cada ingreso queda pendiente hasta que el docente lo acepta.
- En **Estudiantes** el docente aprueba, quita o nombra auxiliares.
- Al **archivar** el curso ya no entra nadie ni se crean cuestionarios; los
  registros se conservan.

## Bancos de preguntas

Cada docente tiene sus bancos dentro de la institución (hasta 2000 preguntas por
banco). Cada pregunta lleva enunciado, una respuesta correcta, de 1 a 5
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
  curso (también quien no participó) con registro universitario, aciertos,
  errores, tiempo y estado; y cada pregunta con su porcentaje de acierto, de la
  más fallada a la más acertada. **Descargar Excel** genera un libro con las
  hojas *Resultados* y *Preguntas*.
- En la institución, **Registros** lista todos los cuestionarios con
  participación y media, filtrables por unidad, parcial y gestión.

## Lo que viene después

- **Asistente con IA** para docentes: generar y revisar preguntas a partir de un
  tema o un documento (complemento de pago).
- **Auspiciadores**: patrocinio de concursos por institución.
