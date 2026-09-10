# Cómo se juega a Axioma

## En qué consiste

Axioma es un puzle de deducción. Un tablero cuadrado esconde un número fijo de
**celdas llenas**. Algunas casillas son **pistas**: llevan un número que dice
cuántas celdas llenas hay dentro de su alcance.

Hasta aquí se parece a un buscaminas. Lo que lo cambia todo es que **tampoco sabes
las reglas**. Antes de empezar hay que elegir dos:

- El **alcance**, que dice qué casillas mira cada pista.
- La **forma**, que dice cómo se agrupan entre sí las celdas llenas.

De todas las combinaciones posibles, **solo una tiene una solución válida**. Ese par
de reglas es el axioma del tablero, y descubrirlo es la mitad del juego.

No hay azar ni hace falta adivinar: cada tablero se genera comprobando que existe
una única solución contando todas las combinaciones de reglas a la vez. Si otra
combinación también encajara, el tablero se descarta antes de mostrártelo.

> Dentro del juego hay dos ayudas, una para cada momento. El botón **Cómo se juega**
> abre una explicación breve en cuatro pantallas, pensada para quien nunca ha
> jugado: de qué va, qué significa cada número, cómo se cruzan las reglas y cómo
> empezar. Es la que se abre sola la primera vez. El icono de interrogación junto al
> título abre la **guía detallada**, con las siete pantallas que recorren cada regla,
> una práctica interactiva y las condiciones exactas para ganar.

## Los pasos para empezar

1. **Abre el juego y mira el tablero.** Solo verás números. Cada número es una
   pista y no se puede marcar.
2. **Elige un alcance** entre Orto, Rey y Rayo. Al elegirlo, el tablero empieza a
   darte señales: las pistas que ya se cumplen se ponen verdes y las que se han
   vuelto imposibles, rojas.
3. **Elige una forma** entre Cadena, Aislado y Parejas.
4. **Toca las casillas.** Un toque la marca llena, otro la descarta con una equis,
   y un tercero la deja como estaba.
5. **Busca la primera deducción segura.** Una pista de valor cero vacía todo su
   alcance. Una pista cuyo número iguale las casillas libres que le quedan las
   llena todas.
6. **Encadena.** Cada casilla que resuelves cambia el estado de las pistas vecinas
   y destapa la siguiente deducción.
7. **Pulsa Comprobar** cuando tengas todas las llenas puestas.

Si al comprobar te dice que el tablero es correcto pero el par de reglas no,
significa que acertaste las casillas y fallaste la regla: cambia de regla, no de
casillas.

## El procedimiento, paso a paso

Este es un tablero real de cuatro por cuatro con cinco celdas llenas, resuelto
entero sin adivinar nada. La regla resulta ser **Orto con Aislado**, y las otras
tres combinaciones no tienen ninguna solución posible.

![Guía visual paso a paso](public/como-jugar.svg)

> Si la imagen no se ve en tu visor, abre [`public/como-jugar.svg`](public/como-jugar.svg)
> directamente. En la app publicada está en `/como-jugar.svg`.

## Qué hay que tener en cuenta para ganar

**La partida solo se da por buena si se cumplen las cuatro condiciones a la vez:**
una regla elegida en cada eje, el número exacto de celdas llenas, todas las pistas
cerradas, y la forma cumplida.

Estas son las ideas que más ayudan:

- **Empieza por los extremos.** Las pistas de valor cero y las que igualan sus
  casillas libres son las únicas que se resuelven solas. Búscalas primero.
- **Descarta de verdad, con la equis.** Marcar lo que sabes que está vacío no es
  decorativo: es lo que cierra una pista y hace visible la siguiente deducción. Una
  pista solo se pone verde cuando no le queda ninguna casilla sin decidir.
- **Si nada encaja, sospecha de la regla.** Antes de borrar medio tablero, prueba
  a cambiar el alcance o la forma. Las señales de color cambian al instante y
  suelen delatar cuál era la correcta.
- **Descarta combinaciones, no solo casillas.** Si con un alcance dado alguna pista
  se vuelve imposible desde el principio, ese alcance no es. Ese razonamiento vale
  tanto como resolver casillas.
- **Nunca hace falta adivinar.** Si te ves probando a ver qué pasa, es que hay una
  deducción que no has visto. El botón Pista te señala una.
- **Confía en la pantalla.** Si todas las pistas están verdes, la forma cumple y
  llevas el número exacto de llenas, has ganado: no existe otra configuración que
  ponga todo eso en verde.

**Sobre la puntuación.** Tocar una casilla o cambiar de regla suma una movida, y
pedir una pista suma tres. El mínimo teórico es una movida por cada celda llena,
más una por cada eje que ofrezca más de una opción. Alcanzarlo es una *partida
perfecta*. También se mide el tiempo, que arranca con tu primera jugada y se pausa
si sales de la pestaña.

---

## El sudoku

En el menú de arriba a la derecha, además de los tres modos de Axioma, hay un
**Sudoku** clásico. Es un juego aparte, con sus propias reglas y su propio
ranking.

**El objetivo.** Rellenar las 81 casillas con cifras del 1 al 9 sin que ninguna
se repita en la misma fila, en la misma columna ni dentro de la misma caja de
3×3. Las tres condiciones tienen que cumplirse a la vez.

**Cómo se juega.** Toca una casilla vacía y elige la cifra en el teclado de
abajo. El teclado lleva la cuenta de cuántas quedan de cada cifra y desaparece la
que ya está completa. Al seleccionar una casilla se resaltan su fila, su columna
y su caja, y también todas las casillas que llevan la misma cifra.

**Solo entra la cifra correcta.** Cada tablero se genera con una única solución,
verificada antes de mostrarlo, así que cualquier cifra distinta de la que va en
esa casilla es un fallo seguro. El juego no la acepta: parpadea en rojo, no se
queda en el tablero y cuenta como error. Los **dos primeros fallos no cuestan**
nada; desde el tercero, cada uno **suma 30 segundos** al cronómetro. Probar a
ojo no es un atajo, es más lento que pensar.

**Notas.** Si no estás seguro, activa *Notas* y las cifras que pulses se apuntan
pequeñas, como a lápiz, para ir descartando; las notas son libres y no penalizan.
Al escribir la cifra definitiva, las notas de esa casilla se borran solas.
*Deshacer* da marcha atrás jugada a jugada, pero no devuelve el tiempo de las
penalizaciones.

**Pistas.** *Pista* rellena una casilla correcta por ti, pero **cuesta un minuto**
y hay **tres como máximo** por tablero. Sirven para desatascarte, no para que el
juego se resuelva solo.

**Niveles.** Cinco: Fácil (42 pistas), Medio (34), Difícil (28), Experto (24) y
Ultra (22). No es solo cuántas casillas vienen dadas: cada tablero se comprueba
con las técnicas que hacen falta para resolverlo, así que un Experto exige de
verdad más razonamiento que un Fácil. Ninguno necesita adivinar, todos tienen
una sola solución.

**Ultra: sin ayudas.** En este nivel el juego no te dice nada mientras juegas:
entra cualquier cifra, nada se marca en rojo, no hay contador de errores ni
pistas. Solo al completar las 81 casillas comprueba si cuadra; si no, te avisa
de que hay alguna cifra equivocada, sin decir cuál, y te toca borrar y corregir
hasta que salga. Es el sudoku de papel, con la única garantía de que la solución
existe y es una sola.

**El del día y el ranking.** Cada nivel tiene su sudoku del día, el mismo para
todo el mundo. El cronómetro arranca con tu primera jugada y se para al terminar;
las penalizaciones por fallos y pistas ya van dentro de ese tiempo, así que el
ranking compara a todos con la misma vara. Si entras con Google, tu tiempo
aparece en el ranking de ese día y ese nivel, junto a cuántas pistas y errores
llevó; sin cuenta también puedes jugar, simplemente no se envía. *Otro tablero*
genera uno de práctica, que no cuenta para el ranking.

---

La especificación completa de las reglas, con todos sus valores exactos, está en
[GAME.md](GAME.md).
