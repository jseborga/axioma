# Retos, juegos rápidos y sudoku en pareja

Axioma sirve también como plataforma para concursos entre amigos, fraternidades,
clases o equipos: alguien crea un **reto**, reparte un código y todo el mundo
juega lo mismo (un sudoku al día, o varias rondas seguidas de trivia, memoria,
cálculo, reflejos o del 1 al 25); la clasificación dice quién gana el premio y a
quién le toca la penitencia. Además hay un modo **en pareja** en el que dos
personas resuelven un sudoku a la vez, cada una desde su móvil.

Las dos cosas necesitan cuenta de Google, porque para un premio hace falta
saber quién es quién. Quien administra la app tiene que haber activado el inicio
de sesión y creado las tablas (ver [SETUP.md](SETUP.md)).

## Los juegos

Un reto se juega con uno de estos seis juegos:

| Juego | Qué es | Dura | Gana |
| --- | --- | --- | --- |
| **Sudoku** | Un tablero por día del nivel elegido, igual para todos. | 5–20 min | Menos tiempo (con penalizaciones). |
| **Trivia** | Diez preguntas de cultura general con cuatro opciones, doce segundos cada una. Cuanto antes se acierta, más puntos (de 100 a 160). | 2 min | Más puntos. |
| **Memoria** | Se encienden casillas de una rejilla de 3×3 y hay que repetirlas en orden; cada vez una más, hasta catorce. | 1 min | Secuencia más larga. |
| **Cálculo** | Sumas, restas y multiplicaciones durante 45 segundos; cada fallo quita tres segundos. | 45 s | Más aciertos. |
| **Reflejos** | Tocar en cuanto la pantalla se pone verde, cinco veces; tocar antes de tiempo cuenta como 1000 ms. | 30 s | Menos milisegundos de media. |
| **Del 1 al 25** | Tocar los números del 1 al 25 en orden en una rejilla desordenada; cada fallo suma un segundo. | 30 s | Menos tiempo. |

Los cinco rápidos se pueden practicar sueltos y sin cuenta en menú →
**Juegos rápidos**, que guarda la mejor marca en el dispositivo. El banco de
preguntas de la trivia está en `public/rapidos-motor.js` y se puede ampliar.

## Crear un reto

Menú de arriba a la derecha → **Retos** → **Crear un reto**.

| Campo | Qué es |
| --- | --- |
| Nombre | Como se verá en la lista y en la ficha. |
| Juego | Sudoku o uno de los cinco rápidos. |
| Nivel | Solo para el sudoku: Fácil, Medio, Difícil, Experto o Ultra (sin ayudas). |
| Modalidad | **Individual**: cada uno por su cuenta. **Por equipos**: cada jugador juega su ronda y el equipo suma. **Por parejas** (solo sudoku): cada ronda se juega a cuatro manos. |
| Empieza | Hoy, mañana, pasado o dentro de una semana. |
| Días / Rondas | Sudoku: un tablero por día, hasta 31. Rápidos: hasta diez rondas **seguidas**, una tras otra, que se pueden jugar durante un día, tres o una semana. |
| Premio | Para quien gane. Texto libre; la app solo lo muestra. |
| Penitencia | Para quien quede último. Texto libre, o se deja vacío y se usa la ruleta. |

Un reto de rápidos con varias rondas es lo que mejor funciona en una fiesta:
todos en la misma sala, cada uno con su móvil, y la ficha proyectada.

Con el sudoku, el navegador del organizador genera los tableros de todas las
rondas (con solución única, como siempre) y los envía al servidor, que los
guarda. Con los rápidos, el servidor guarda una semilla secreta y genera cada
ronda cuando el jugador pulsa Empezar, así nadie puede verla antes.

Se obtiene un **código de seis letras** y un enlace del tipo
`https://tu-dominio/?reto=CÓDIGO`. Con «Copiar enlace» o «Invitar» se reparte.

## Unirse y jugar

Con el enlace, la app abre la ficha del reto y ofrece **Unirme**. Sin enlace,
en Retos hay una casilla para escribir el código. En los retos por equipos se
pide el nombre del equipo al unirse; los equipos que ya existen aparecen como
sugerencia.

En la ficha aparece **Jugar la ronda N**. Reglas de la ronda:

- Solo vale el primer intento: no se puede repetir para mejorar.
- En el sudoku, el tiempo lo mide el **servidor** desde que se abre el tablero
  hasta que se envía la solución, más las penalizaciones de siempre (dos fallos
  gratis y 30 s por cada fallo siguiente, pistas a 1 min con tres como máximo;
  en Ultra no hay ayudas).
- En los rápidos, el reloj del servidor arranca al pulsar **Empezar**; la
  puntuación la calcula el servidor con lo que el jugador responde.
- Con rondas seguidas, al terminar una aparece la siguiente; con ritmo diario,
  mañana habrá otro tablero.

## Clasificación

Cuenta primero **cuántas rondas** ha completado cada uno y, a igualdad, la
**marca total**: menos tiempo en sudoku, reflejos y del 1 al 25; más puntos en
trivia, memoria y cálculo. Así, quien falta una ronda no puede ganar a quien las
jugó todas, y entre quienes han jugado lo mismo gana la mejor marca.

Cuando el reto termina, la ficha anuncia quién gana (y su premio) y a quién le
toca la penitencia. Si no se escribió ninguna, la **ruleta de penitencias**
(botón al pie de la ficha, disponible siempre) sortea una entre cuarenta
castigos amables: cantar, imitar, hablar con acento, recoger la mesa…

En los retos por equipos, un equipo completa una ronda cuando **todos** sus
miembros la han terminado, y su tiempo en esa ronda es la **media**. Debajo de
los equipos se muestra también a cada jugador.

La ficha se actualiza sola cada quince segundos mientras el reto está activo,
así que sirve para proyectarla en una pantalla durante un evento.

## Sudoku en pareja

Menú → **En pareja** → elige el nivel → **Crear sala**. La sala tiene un código
y un enlace `?pareja=CÓDIGO`; la otra persona entra con él. Se puede empezar en
cuanto una de las dos pone la primera cifra.

- Las dos personas ven el mismo tablero; las cifras propias salen en azul y las
  de la pareja en morado.
- Cada cifra pasa por el servidor, que la comprueba contra la solución: solo
  entran las correctas. Dos fallos no cuestan; desde el tercero, 30 s. Los
  fallos de cualquiera de los dos cuentan para la pareja.
- El cronómetro lo lleva el servidor: arranca con la primera cifra y se para
  con la última. No hay pistas ni deshacer.
- La pantalla se actualiza cada dos segundos.

### Retos por parejas

En un reto **por parejas**, cada ronda se juega en una sala: desde la ficha del
reto, una persona pulsa **Crear sala para la ronda de hoy** y su pareja entra
con el código (o con la casilla «Código de la sala de tu pareja»). Al terminar,
el tiempo de la sala queda registrado para las dos y aparecen como equipo en la
clasificación con sus nombres.

## Qué comprueba el servidor

Para que un concurso con premio sea razonable entre amigos, el servidor no se
fía del todo del navegador:

- Sudoku: la rejilla enviada tiene que coincidir con la solución guardada, y el
  tiempo lo mide el propio servidor desde que se abrió el tablero (lo que diga
  el navegador no cuenta); solo se suman las penalizaciones, que son fijas.
- Rápidos: el servidor regenera la ronda con su semilla y puntúa las respuestas
  él mismo. Además comprueba que el tiempo declarado no sea menor que el que
  marca su reloj (con unos segundos de margen), que ninguna respuesta de trivia
  llegue en menos de 250 ms, que el cálculo no se envíe antes de los 45 s y
  que el 1 al 25 no baje de 4 s.
- No hay más de tres pistas, y en Ultra no puede haber ninguna.
- Solo vale el primer resultado de cada ronda; los siguientes se ignoran.
- En pareja, cada jugada la valida y cronometra el servidor.

Lo que no puede impedir es que alguien resuelva con otra herramienta (un
sudoku con un programa, una trivia buscando en internet): eso lo detecta el
organizador viendo marcas absurdas. Para un premio serio, lo razonable es jugar
las rondas en el mismo sitio y a la misma hora, con los móviles a la vista.

## Ideas para eventos

- **Carrera en vivo**: sudoku de un día que empieza hoy, todos en la misma
  sala, la ficha proyectada. Gana el primero de la clasificación.
- **Noche de trivia**: trivia con cinco rondas seguidas, premio para el primero
  y penitencia para el último. Dura un cuarto de hora.
- **Gincana**: varios retos rápidos encadenados la misma tarde (reflejos, del
  1 al 25, cálculo), cada uno con su penitencia de la ruleta.
- **Liga de una semana**: siete días de sudoku, individual; premio para quien
  complete las siete rondas con menos tiempo.
- **Fraternidades**: por equipos de tres a cinco; el equipo necesita que todos
  terminen cada ronda, así que se cuidan entre ellos.
- **Parejas**: sudoku por parejas de tres días; cada tarde una sala.
