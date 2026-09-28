# Concursos de trivia

Una sección aparte de Axioma y del sudoku para organizar **concursos con
premio**: alguien abre una convocatoria, la gente se inscribe, cada persona
juega **una sola vez** respondiendo preguntas de cultura general y de cálculo
hasta pasarse de los errores admitidos, y al cierre se **publica el ranking** en
la propia app con el ganador y su premio.

Menú de arriba a la derecha → **Juegos** → **Concursos de trivia**. Ver los
concursos y sus resultados no requiere cuenta; crear, inscribirse y jugar sí
(entrar con Google), porque hace falta saber quién gana.

## Crear un concurso

| Campo | Opciones |
| --- | --- |
| Nombre | Cómo aparecerá en la lista. |
| Premio | Texto libre para quien gane; la app solo lo muestra. |
| Descripción | Opcional: condiciones, cómo se entrega el premio… |
| Dificultad | **Fácil**, **Medio**, **Difícil** o **Progresiva** (las 8 primeras fáciles, hasta la 18 medias y después difíciles). |
| Errores admitidos | Ninguno (el primer fallo termina la partida), 1, 2, 3 o 5. Con el siguiente fallo, la partida termina. |
| Preguntas | 10, 20, 30, 50, o «hasta quedar eliminado» (máximo 100). |
| Tiempo por pregunta | 10, 15, 20 o 30 segundos. Si se agota, cuenta como fallo. |
| Operaciones matemáticas | Si se marca, una de cada cuatro preguntas es de cálculo. |
| Áreas temáticas | Opcional: de qué áreas salen las preguntas (por ejemplo, solo Bolivia e Historia para un evento cívico). Sin marcar ninguna, salen de todas. Si en las áreas elegidas no hay preguntas suficientes, la app lo avisa antes de publicar. |
| Empieza | Ahora, en 15 minutos, en 1 hora, mañana o una fecha y hora. |
| Dura | De 30 minutos a una semana, o hasta una fecha y hora (entre 5 minutos y 31 días). |
| Visibilidad | **Público**: aparece en la lista de concursos para todo el mundo. **Privado**: solo con el código o el enlace. |

Al publicarlo se obtiene un código de seis letras y un enlace
`https://tu-dominio/?concurso=CÓDIGO` para compartir. Quien organiza puede
**cerrarlo antes de tiempo**; entonces se publica el ranking en ese momento.

## Participar

1. Abrir el enlace (o escribir el código) y pulsar **Inscribirme**. Uno puede
   inscribirse antes de que empiece y jugar cuando quiera hasta el cierre.
2. **Jugar ahora.** En cuanto aparece la primera pregunta, ya cuenta como la
   participación: no hay segunda oportunidad, aunque se cierre la app.
3. Cada pregunta tiene cuatro opciones y una cuenta atrás. Los puntos verdes de
   arriba son los errores que quedan.
4. La partida termina al pasarse de los errores admitidos, al responder todas
   las preguntas o al cerrarse el concurso. Si alguien sale a mitad, puede
   volver con **Continuar mi partida**; la pregunta que dejó pendiente sigue
   corriendo y, si se le acabó el tiempo, cuenta como fallo.

Durante el concurso nadie ve el ranking, ni siquiera quien organiza (solo
cuántas personas se han inscrito y cuántas han jugado). Cada jugador ve su
propio resultado.

## Resultado

Al cierre, la ficha muestra al **ganador** con el premio y el **ranking**
completo, ordenado por:

1. más aciertos;
2. a igualdad, menos errores;
3. y después, menos tiempo total respondiendo.

Cada jugador puede desplegar **Tus respuestas** para ver qué contestó en cada
pregunta y cuál era la correcta. Los concursos públicos terminados siguen en la
lista, en «Resultados», durante dos semanas.

## Preguntas

- **1053 preguntas** de cultura general en **19 áreas temáticas**:

  | Área | Preguntas |
  | --- | --- |
  | Geografía | 80 |
  | Bolivia | 89 |
  | Latinoamérica | 40 |
  | Historia | 78 |
  | Ciencia | 80 |
  | Naturaleza | 68 |
  | Cuerpo humano y salud | 40 |
  | Medio ambiente | 39 |
  | Deportes | 70 |
  | Arte y cultura | 60 |
  | Literatura | 37 |
  | Música | 40 |
  | Cine y series | 40 |
  | Mitología | 40 |
  | Lengua | 60 |
  | Inglés | 40 |
  | Tecnología | 59 |
  | Economía | 38 |
  | Gastronomía | 55 |

  Cada una tiene su nivel (301 fáciles, 477 medias y 275 difíciles). Casi todas las nuevas traen un
  **«¿Sabías que…?»**: un dato curioso que se muestra al revelar la respuesta,
  en la revisión del concurso y en la trivia en vivo.
- **Operaciones generadas sin límite**, con la misma escala:
  - **Fácil:** sumas y restas de dos cifras y tablas.
  - **Medio:** sumas de tres cifras, divisiones, porcentajes redondos y series.
  - **Difícil:** multiplicaciones de dos cifras, prioridad de operaciones,
    cuadrados y raíces, porcentajes, fracciones y series geométricas.
- Cada jugador recibe **su propia secuencia al azar**, sin repeticiones, así
  que no sirve pasarse las respuestas. El nivel de cada posición es el mismo
  para todos, así que la dificultad es comparable.
- **No se repiten durante 60 días.**
  - La app anota qué preguntas vio cada persona y, al armarle una partida
    nueva, evita las de los últimos 60 días.
  - Solo cuando ya vio todas las de las áreas elegidas vuelve a las que vio
    hace más tiempo.
  - En la trivia en vivo pasa lo mismo por institución, o por organizador si
    no hay institución: sus salas no repiten preguntas con el mismo público.
  - En la trivia de práctica (sin cuenta), lo recuerda el propio teléfono.
- **La secuencia de cada participante queda fijada** en cuanto recibe su
  primera pregunta. Así no cambia aunque el banco se amplíe con el concurso
  abierto. Los concursos empezados antes de esta versión siguen con su
  secuencia original.
- **Dónde está el banco:**
  - El original está en `src/preguntas.js`.
  - Las ampliaciones están en `src/banco/`, un archivo por grupo de áreas.
  - Cada línea tiene la forma
    `[nivel, área, pregunta, correcta, otra, otra, otra, «dato»]`.
  - Conviene no repetir preguntas de la trivia de práctica
    (`public/rapidos-motor.js`), porque es pública.
  - No cambies el texto de una pregunta ya publicada: su identificador sale del
    texto, y cambiarlo cuenta como una pregunta nueva.

## Qué hace el servidor para que sea justo

- **Las preguntas y las respuestas están solo en el servidor.** El navegador
  recibe cada pregunta con sus opciones, pero nunca cuál es la correcta; esa se
  revela al cierre, en la revisión.
- **El tiempo lo mide el servidor**: anota cuándo envió cada pregunta, y una
  respuesta que llega después del límite (con dos segundos de margen por la red)
  cuenta como fallo aunque sea la correcta. Recargar la página no reinicia el
  reloj: devuelve la misma pregunta con el tiempo que le queda.
- **Una sola participación**: la partida empieza con la primera pregunta y no
  se puede reiniciar; volver a inscribirse no cambia nada.
- Cada respuesta se registra con una actualización condicional, así que dos
  envíos a la vez de la misma pregunta cuentan una sola vez.

Lo que no puede impedir es que alguien busque las respuestas en otro
dispositivo mientras corre la cuenta atrás: para eso sirve un tiempo por
pregunta corto (10 o 15 segundos). Para un premio importante, lo más fiable es
jugar todos a la vez en el mismo sitio.

## Tablas

Tres tablas en D1, al final de `schema.sql`: `contests`, `contest_entries` y
`contest_answers`. Ver «Añadir las tablas de concursos» en [SETUP.md](SETUP.md).

Las áreas y la memoria de 60 días usan tres tablas más: `contest_areas`,
`contest_seq` y `preguntas_vistas`. Ver «Añadir las tablas de trivia por áreas»
en [SETUP.md](SETUP.md). Mientras falten, todo funciona como antes, pero:
- no se pueden elegir áreas;
- no se evita repetir preguntas;
- los concursos usan solo el banco original.

## Concursos y cuestionarios de curso

El mismo motor sirve a los **cuestionarios** del aula ([AULA.md](AULA.md)): se
crean desde un curso, solo los ven sus miembros, pueden sacar las preguntas de un
banco del docente y, al cierre, cada estudiante ve su resultado y su corrección,
sin ranking público ni ganador. Quien gestiona un concurso o cuestionario tiene
además **Registros y estadísticas**, con descarga en Excel.

Para inscribirse en cualquier concurso hace falta el registro con consentimiento.
Los menores de 18 años no pueden entrar en concursos abiertos con premio hasta que
conste el consentimiento de su tutor o de su institución.
