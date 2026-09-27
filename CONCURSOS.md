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

- **209 preguntas** de cultura general en diez categorías (geografía, Bolivia,
  historia, ciencia, naturaleza, deportes, arte y cultura, lengua, tecnología y
  gastronomía), cada una con su nivel: 45 fáciles, 99 medias y 65 difíciles.
- **Operaciones generadas sin límite**, con la misma escala: sumas y restas de
  dos cifras y tablas en el nivel fácil; sumas de tres cifras, divisiones,
  porcentajes redondos y series en el medio; multiplicaciones de dos cifras,
  prioridad de operaciones, cuadrados y raíces, porcentajes, fracciones y
  series geométricas en el difícil.
- Cada jugador recibe **su propia secuencia al azar**, sin repeticiones, así
  que no sirve pasarse las respuestas; el nivel de cada posición es el mismo
  para todos, así que la dificultad es comparable.
- El banco está en `src/preguntas.js` y se puede ampliar añadiendo líneas
  `[nivel, categoría, pregunta, correcta, otra, otra, otra]`. Conviene no
  repetir preguntas de la trivia de práctica (`public/rapidos-motor.js`), que es
  pública.

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
