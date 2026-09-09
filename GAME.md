# Axioma · especificación del juego

Descripción exacta de las reglas, tal como están implementadas en `public/app.js`.
Sirve como referencia para reimplementar el juego en otra plataforma sin
introducir diferencias de comportamiento.

## Idea

Un tablero cuadrado esconde un número fijo de **celdas llenas**. Algunas casillas
son **pistas**: llevan un número que cuenta cuántas celdas llenas hay dentro de su
alcance. El jugador debe marcar todas las llenas, pero además **no sabe qué reglas
gobiernan el tablero**: debe deducir cuál de las combinaciones ofrecidas es la única
con solución posible. De ahí el nombre.

## Tablero

- Rejilla de `n × n`.
- Un conjunto de casillas es **pista** y no se puede marcar. Cada pista tiene un
  número entero mayor o igual que cero.
- El resto son **casillas jugables**, con tres estados cíclicos:

  | Estado | Valor interno | Significado |
  | --- | --- | --- |
  | Sin decidir | 0 | Estado inicial |
  | Llena | 1 | El jugador afirma que está llena |
  | Descartada | 2 | El jugador afirma que está vacía |

  Cada toque avanza al siguiente estado: sin decidir, llena, descartada, y vuelve
  a empezar. Solo el estado *llena* cuenta para las reglas; *descartada* es una
  anotación del jugador.

- La solución contiene exactamente `k` celdas llenas, y **ninguna cae sobre una
  casilla pista**.

## Regla de alcance

Determina qué casillas cuenta cada pista. **Las casillas pista nunca forman parte
de ningún alcance**, y además bloquean.

| Nombre | Identificador | Definición |
| --- | --- | --- |
| Orto | `ORTO` | Las cuatro casillas que tocan la pista por un lado. |
| Rey | `REY` | Las ocho casillas que rodean la pista, diagonales incluidas. |
| Rayo | `RAYO` | Desde la pista se avanza en las cuatro direcciones ortogonales, casilla a casilla, hasta salir del tablero o encontrar otra pista, que corta el rayo. La casilla que corta no se incluye. |

En Orto y Rey se descartan las casillas fuera del tablero y las que son pista. En
Rayo, encontrar una pista detiene ese rayo por completo.

## Regla de forma

Determina cómo se agrupan entre sí las celdas llenas. La adyacencia es siempre
**ortogonal**: dos celdas son vecinas si comparten un lado. Las diagonales no unen.

| Nombre | Identificador | Definición |
| --- | --- | --- |
| Cadena | `CADENA` | Todas las llenas forman un único grupo conexo. |
| Aislado | `AISLADO` | Ninguna llena toca a otra por un lado. En diagonal sí pueden tocarse. |
| Parejas | `PAREJAS` | Todos los grupos conexos tienen exactamente tamaño dos. |

Un conjunto vacío **no cumple ninguna forma**.

## Modos

| Modo | Tamaño `n` | Llenas `k` | Pistas | Alcances ofrecidos | Formas ofrecidas |
| --- | --- | --- | --- | --- | --- |
| Diario | 5 | 7 | 7 | Orto, Rey, Rayo | Cadena, Aislado, Parejas |
| Flash | 4 | 4 | 5 | Orto, Rey | Cadena |
| Libre | según nivel | según nivel | según nivel | según nivel | según nivel |

En el modo **Libre** el jugador elige la dificultad, que fija el nivel `L`:

| Dificultad | Nivel | Tablero | Llenas | Combinaciones de reglas |
| --- | --- | --- | --- | --- |
| Fácil | 1 | 4×4 | 5 | 2 |
| Medio | 3 | 5×5 | 6 | 6 |
| Difícil | 5 | 5×5 | 8 | 9 |

La elección se guarda en el dispositivo. Los parámetros salen de estas fórmulas
generales sobre el nivel `L`:

| Parámetro | Fórmula |
| --- | --- |
| `n` | 4 si `L < 3`, si no 5 |
| `k` | 5 si `L < 3`, si no `6 + min(2, L − 3)` |
| Pistas | 5 si `L < 3`, si no 7 |
| Alcances | `[Orto]` si `L < 2`; `[Orto, Rey]` si `L < 4`; los tres en adelante |
| Formas | `[Cadena, Aislado]` si `L < 3`; las tres en adelante |

Cuando un eje ofrece una sola opción, queda elegida de antemano y su selector no
se muestra.

## Reto diario

El tablero del día es idéntico para todo el mundo y se genera sin servidor:

```
día    = floor((ahora − 2026-01-01T00:00:00Z) / 86 400 000) + 1
semilla = día × 2654435761   (truncado a 32 bits sin signo)
```

El generador usa esa semilla con un generador congruencial *mulberry32*. Como el
algoritmo es determinista, la misma semilla produce el mismo tablero en cualquier
dispositivo. **Cualquier reimplementación debe reproducir este generador bit a bit
para que el reto diario coincida.**

```
function mulberry32(s):
    a = s (32 bits sin signo)
    devuelve una función que en cada llamada hace:
        a = (a + 0x6D2B79F5) mod 2^32
        t = a
        t = (t XOR (t >>> 15)) × (1 OR t)          , multiplicación de 32 bits
        t = (t + ((t XOR (t >>> 7)) × (61 OR t))) XOR t
        devuelve ((t XOR (t >>> 14)) sin signo) / 2^32
```

Los modos Flash y Libre usan el generador aleatorio del sistema.

## Generación de un tablero

1. Elegir al azar una forma y un alcance de entre los ofrecidos por el modo.
2. Colocar `k` celdas llenas que cumplan esa forma. Hasta 400 intentos.
   - Aislado: recorrer casillas barajadas y aceptar la que no toque a ninguna ya puesta.
   - Cadena: partir de una casilla y crecer por la frontera del grupo.
   - Parejas: `k` debe ser par; barajar los dominós posibles y aceptar los que no toquen a ninguna pareja ya colocada.
3. Elegir al azar las casillas pista entre las que quedaron vacías.
4. Calcular el número de cada pista contando las llenas dentro de su alcance.
   Si alguna pista tiene el alcance vacío, se descarta el intento.
5. Contar soluciones **sobre todas las combinaciones de reglas ofrecidas**,
   parando en dos. El tablero se acepta solo si el total es exactamente uno.
6. Hasta 260 intentos. Si fallan, se reintenta el proceso completo hasta tres
   veces, y como último recurso se genera un tablero del modo Flash.

El paso 5 es lo que garantiza que el par de reglas correcto sea deducible: si otra
combinación diera una solución válida, el tablero se descarta.

## Contador de soluciones

Búsqueda con retroceso sobre las casillas jugables, para cada alcance ofrecido:

- Cada pista mantiene su objetivo, cuántas llenas lleva asignadas y cuántas
  casillas de su alcance quedan sin decidir.
- Se poda una rama cuando una pista supera su objetivo, o cuando ya no puede
  alcanzarlo ni llenando todo lo que le queda.
- Se poda también por el total: no se puede pasar de `k` llenas ni quedarse corto.
- Las casillas se ordenan por número de pistas que las observan, de mayor a menor.
- Al completar una asignación con exactamente `k` llenas, se comprueba contra cada
  forma ofrecida, y cada forma que se cumpla suma una solución.

## Ayudas en pantalla

Con un alcance elegido, cada pista se pinta según el estado de su alcance, donde
`llenas` son las marcadas por el jugador y `abiertas` las que siguen sin decidir:

| Condición | Estado |
| --- | --- |
| `llenas > número` o `llenas + abiertas < número` | **Imposible**, en rojo |
| `llenas = número` y `abiertas = 0` | **Cerrada**, en verde |
| En otro caso | Neutra |

Además se muestran: el recuento de pistas cerradas, cuántas llenas lleva marcadas
frente a `k`, y si la forma elegida se cumple con las llenas actuales.

Tocar una pista resalta su alcance. Volver a tocarla lo apaga.

## Comprobación

El botón de comprobar acepta solo si se cumplen las cuatro condiciones:

1. Hay una regla elegida en cada eje.
2. El número de celdas llenas es exactamente `k`.
3. Todas las celdas de la solución están marcadas como llenas.
4. El alcance y la forma elegidos coinciden con los del tablero.

Al resolver, las casillas sin decidir pasan automáticamente a descartadas, con lo
que todas las pistas quedan cerradas.

Se puede demostrar que la pantalla nunca engaña: si todas las pistas están
cerradas, la forma se cumple y hay exactamente `k` llenas, entonces esa
configuración es una solución para las reglas elegidas; y como el generador
garantiza solución única entre todas las combinaciones, es necesariamente **la**
solución con **el** par de reglas correcto.

## Puntuación

El contador de **movidas** suma:

| Acción | Coste |
| --- | --- |
| Cambiar el estado de una casilla | 1 |
| Cambiar una regla | 1 |
| Pedir una pista | 3 |

El **mínimo teórico** es `k + 1` por cada eje que ofrezca más de una opción:

```
mínimo = k + (nº de alcances > 1 ? 1 : 0) + (nº de formas > 1 ? 1 : 0)
```

Resolver con exactamente ese número de movidas es una *partida perfecta*.

## Sistema de pistas

Si falta elegir alguna regla, busca combinaciones sin ninguna solución y sugiere
descartar una al azar de entre ellas.

Si ya hay ambas reglas elegidas, busca la primera pista, recorriendo por filas,
que permita una deducción inmediata, y la resalta:

- `llenas = número` con casillas abiertas: el resto de su alcance está vacío.
- `llenas + abiertas = número`: todas las abiertas de su alcance están llenas.

Si ninguna cumple, avisa de que no hay deducción directa disponible.

## Cronómetro

Se mide el tiempo empleado, además de las movidas:

- Arranca con la **primera jugada**, no al abrir el tablero, para que mirar el
  tablero sin decidir nada no penalice.
- Se **pausa al ocultar la pestaña** y se reanuda al volver, de modo que el tiempo
  fuera del juego no cuenta.
- Se detiene al resolver.
- Se muestra como `m:ss`, y como `h:mm:ss` si se pasa de la hora.

El tiempo no afecta a la validez de la solución ni al mínimo teórico; es solo un
dato de la partida.

## Registro del reto diario

Al resolver el reto diario se guarda en el dispositivo el día, las movidas, las
pistas usadas y el tiempo. Al volver a abrir el juego ese mismo día, el tablero se
recupera resuelto: se muestra la solución, el par de reglas correcto, las movidas y
el tiempo empleados, y el resultado compartible.

Solo se guarda el **primer** resultado del día. Se puede reiniciar el tablero y
volver a jugarlo, pero el registro no cambia, porque rejugarlo con la solución ya
conocida no es comparable.

El modo Libre guarda además la dificultad elegida.

## Racha y resultado compartible

La racha cuenta días consecutivos resolviendo el reto diario, guardada en el
dispositivo. Se reinicia a uno si se salta un día.

Formato del texto para compartir:

```
Axioma nº 250
■■■■■■■■□□
9 movidas · 3:12 · mínimo 8 · 1 pista
Racha: 4 días
```

Los cuadros llenos representan el mínimo teórico, con tope de diez; los huecos, las
movidas de más, con tope de seis. La palabra `perfecta` sustituye a la cuenta de
pistas cuando se alcanza el mínimo.

---

# Sudoku · especificación

El sudoku es un juego independiente dentro de la misma app. Comparte el estilo,
la cuenta opcional y el almacenamiento local, pero no comparte reglas ni tableros
con Axioma.

## Reglas

Cuadrícula de 9×9 dividida en nueve cajas de 3×3. Hay que rellenar todas las
casillas con cifras del 1 al 9 de modo que cada fila, cada columna y cada caja
contengan las nueve cifras exactamente una vez.

## Generación

1. Se construye una solución completa con relleno aleatorio y vuelta atrás.
2. Se quitan casillas en orden aleatorio, comprobando tras cada una que sigue
   habiendo **una sola solución**. Una casilla que rompa la unicidad se devuelve.
3. Cuando se alcanza el número de pistas del nivel, se mide la dificultad. Si el
   tablero se ha quedado por debajo, se sigue cavando; si se ha pasado, se
   devuelven casillas hasta bajar al grado pedido.
4. El proceso se repite hasta veinte veces; si nunca cuadra exactamente, se
   entrega el tablero cuyo grado quede más cerca del pedido.

La búsqueda de soluciones y la propagación trabajan con máscaras de bits de nueve
posiciones, una por cifra, de ahí que generar un tablero tarde milisegundos.

## Niveles y dificultad

| Nivel | Pistas objetivo | Técnicas necesarias |
| --- | --- | --- |
| 1 · Fácil | 42 | Solo desnudos |
| 2 · Medio | 34 | + solos ocultos |
| 3 · Difícil | 28 | + parejas desnudas y apuntadores |
| 4 · Experto | 24 | Más que las anteriores |

El grado se mide resolviendo el tablero únicamente con las técnicas de cada
escalón: el nivel es el escalón más bajo que basta para terminarlo. Ningún
tablero necesita adivinar, en ninguno de los cuatro niveles.

## Tablero del día

Cada nivel tiene su propio tablero diario, igual para todo el mundo. La semilla
del generador es `(día × 9973 + nivel × 7919)`, con el mismo mulberry32 que usa
Axioma, y el día se cuenta igual: 1 el 1 de enero de 2026. *Otro tablero* genera
uno con semilla aleatoria, que no es diario y no entra en el ranking.

## Interfaz

- Al seleccionar una casilla se resaltan su fila, su columna y su caja, y todas
  las casillas que contienen la misma cifra.
- El teclado numérico muestra cuántas quedan de cada cifra y desactiva las que ya
  están las nueve.
- Las cifras en conflicto con otra de su fila, columna o caja se marcan en rojo.
- El modo *Notas* apunta candidatos pequeños; escribir la cifra definitiva borra
  las notas de esa casilla.
- *Deshacer* recorre el historial de jugadas. *Pista* rellena una casilla con su
  valor correcto y suma uno al contador de pistas.
- El cronómetro arranca con la primera jugada y se pausa al salir de la pestaña,
  igual que en Axioma.

## Registro y ranking

Al terminar se guarda en el dispositivo, por día y nivel, el tiempo, los errores
y las pistas usadas; al volver, ese tablero aparece ya resuelto. Con la cuenta de
Google activada, el resultado se envía a la tabla `sudoku` y entra en el ranking
de ese día y ese nivel, ordenado por tiempo y, a igualdad, por quién llegó antes.
Se conserva únicamente el mejor tiempo de cada jugador por día y nivel.

Formato del texto para compartir:

```
Sudoku de Axioma · Difícil · nº 252
7:41
```
