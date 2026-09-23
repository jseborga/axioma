# Retos y sudoku en pareja

Axioma sirve también como plataforma para concursos entre amigos, fraternidades,
clases o equipos: alguien crea un **reto**, reparte un código y todo el mundo
juega el mismo sudoku cada día; la clasificación dice quién gana el premio.
Además hay un modo **en pareja** en el que dos personas resuelven un tablero a
la vez, cada una desde su móvil.

Las dos cosas necesitan cuenta de Google, porque para un premio hace falta
saber quién es quién. Quien administra la app tiene que haber activado el inicio
de sesión y creado las tablas (ver [SETUP.md](SETUP.md)).

## Crear un reto

Menú de arriba a la derecha → **Retos** → **Crear un reto**.

| Campo | Qué es |
| --- | --- |
| Nombre | Como se verá en la lista y en la ficha. |
| Nivel | Fácil, Medio, Difícil, Experto o Ultra (sin ayudas). El mismo todos los días. |
| Modalidad | **Individual**: cada uno por su cuenta. **Por equipos**: cada jugador resuelve su tablero y el equipo suma. **Por parejas**: cada ronda se juega a cuatro manos. |
| Empieza | Hoy, mañana, pasado o dentro de una semana. |
| Días | Un tablero por día, hasta 31. Un reto de un día es una carrera: todo el mundo juega el mismo tablero hoy. |
| Premio | Texto libre. Lo pone quien organiza; la app solo lo muestra. |

Al crearlo, el navegador del organizador genera los tableros de todas las rondas
(con solución única, como siempre) y los envía al servidor, que los guarda. Así
todos juegan exactamente el mismo tablero aunque tengan versiones distintas de
la app.

Se obtiene un **código de seis letras** y un enlace del tipo
`https://tu-dominio/?reto=CÓDIGO`. Con «Copiar enlace» o «Invitar» se reparte.

## Unirse y jugar

Con el enlace, la app abre la ficha del reto y ofrece **Unirme**. Sin enlace,
en Retos hay una casilla para escribir el código. En los retos por equipos se
pide el nombre del equipo al unirse; los equipos que ya existen aparecen como
sugerencia.

Cada día del reto aparece **Jugar la ronda N de hoy**. Reglas de la ronda:

- El tiempo empieza a contar en cuanto se abre el tablero y solo vale el primer
  intento: no se puede repetir para mejorar.
- Se juega con las mismas ayudas y penalizaciones que el sudoku diario: solo
  entra la cifra correcta, dos fallos gratis y 30 s por cada fallo siguiente,
  pistas a 1 min con tres como máximo. En nivel Ultra no hay ayudas.
- Al terminar, el tiempo se registra en el reto y la ficha muestra
  «Hoy ya jugaste».

## Clasificación

Cuenta primero **cuántas rondas** ha completado cada uno y, a igualdad, el
**tiempo total** (con las penalizaciones dentro). Así, quien falta un día no
puede ganar a quien jugó todos, y entre quienes han jugado lo mismo gana el más
rápido.

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

- La rejilla enviada tiene que coincidir exactamente con la solución guardada
  del tablero de esa ronda.
- El tiempo enviado no puede ser menor que el que de verdad ha pasado desde
  que ese jugador abrió el tablero (el servidor anota la hora de apertura).
- Los fallos y las pistas tienen que cuadrar con el tiempo (las penalizaciones
  son fijas), no hay más de tres pistas, y en Ultra no puede haber ninguna.
- Solo vale el primer resultado de cada ronda; los siguientes se ignoran.
- En pareja, cada jugada la valida y cronometra el servidor, así que el
  tiempo no lo pone nadie.

Lo que no puede impedir es que alguien resuelva el tablero con otra
herramienta y lo copie: eso lo detecta el organizador viendo tiempos absurdos.
Para un torneo con premio serio, lo razonable es jugar las rondas en el mismo
sitio y a la misma hora, que es justo lo que permite un reto de un día.

## Ideas para eventos

- **Carrera en vivo**: reto de un día que empieza hoy, todos en la misma sala,
  la ficha proyectada. Gana el primero de la clasificación.
- **Liga de una semana**: siete días, individual; premio para quien complete
  las siete rondas con menos tiempo.
- **Fraternidades**: por equipos de tres a cinco; el equipo necesita que todos
  terminen cada día, así que se cuidan entre ellos.
- **Parejas**: reto por parejas de tres días; cada tarde una sala.
