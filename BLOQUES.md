# Puertas de Color

Un puzle de bloques en 3D: cada bloque de color se arrastra por el tablero hasta la
**puerta de su color** y sale por ella. Se gana cuando el tablero queda vacío.
Menú → **Puertas de Color** (o la tarjeta de la portada, en «Juegos de lógica»).

Está inspirado en los juegos tipo *Color Block Jam*, y diseñado a partir de lo que
critican sus jugadores: temporizadores estresantes, picos de dificultad que empujan a
pagar, anuncios intrusivos, potenciadores caros, fallos que borran el progreso y una
sola mecánica que se repite.

| Problema en los «block jam» | Cómo lo resuelve Puertas de Color |
| --- | --- |
| Reloj obligatorio en cada nivel | **Modo zen** por defecto. El contrarreloj es opcional; si se acaba el tiempo: +30 s gratis, seguir sin reloj o empezar de nuevo |
| Vidas que se agotan | No hay vidas |
| Picos de dificultad para vender ayudas | Curva suave con **respiro** cada 5 niveles y **desafío anunciado** cada 10; la dificultad se **adapta** a cada persona y tras dos reinicios ofrece una **versión más suave** |
| Potenciadores caros | **Deshacer ilimitado**, **3 pistas gratis** por nivel; **martillos** que se ganan jugando (cada 10 estrellas y con el reto del día) |
| Anuncios y compras | Ninguno |
| Pérdida de progreso | Se guarda en el teléfono y, con cuenta, en el servidor (se mezcla al entrar) |
| Una sola mecánica | 7 mundos, cada uno con una mecánica nueva |
| Solo colores | **Símbolos** para daltónicos (●▲■◆★✚♥⬢) y **modo números** |
| Sin meta social justa | **Reto del día** igual para todos, con racha, ranking verificado y resultado para compartir |

## Cómo se juega

| Gesto | Qué hace |
| --- | --- |
| **Arrastrar** | El bloque se desliza por las casillas libres y gira en las esquinas (se encaja solo). Si llega a una puerta de su color y cabe entero, sale. |
| **Tocar** | Si el bloque tiene camino libre hasta su puerta, va solo y sale (se puede apagar en Ajustes). |
| **Deshacer / Reiniciar** | Sin límite. |
| **Pista** | Muestra la mejor jugada siguiente (contorno y flecha). 3 por nivel. |
| **Martillo** | Rompe un bloque. El nivel vale como máximo ★★. |

Un bloque **cabe** por una puerta si toda su anchura (o altura) entra en ella: uno de
tres casillas no pasa por una puerta de dos. Una **jugada** es soltar un bloque en otro
sitio o hacerlo salir, aunque haya recorrido un camino en L.

**Estrellas:** ★★★ con el *par* o menos (la solución más corta que encuentra el buscador),
★★ cerca del par y ★ al terminar.

## Mundos

| Mundo | Niveles | Mecánica nueva |
| --- | --- | --- |
| 🌼 Pradera | 1–15 | Colores y puertas |
| 🌲 Bosque | 16–30 | Rocas que no se mueven |
| 🌊 Río | 31–45 | Bloques en raíl: solo de lado a lado o solo de arriba abajo (flechas y rieles en el suelo) |
| 🧊 Glaciar | 46–60 | Hielo: el número dice cuántos bloques deben salir antes de que se derrita |
| 💎 Cristal | 61–75 | Capas: la capa de fuera sale por su puerta y deja dentro un bloque de otro color |
| 🌈 Arcoíris | 76–90 | Puertas que cambian de color con cada jugada (el puntito ↻ muestra el próximo color) |
| 🪐 Cosmos | 91– | Todo mezclado, sin final |

La primera vez que aparece una mecánica se explica con una tarjeta. Cada 5 niveles hay
un respiro (🍃, más fácil) y cada 10 un desafío (🔥, anunciado antes de empezar).

**Estilos de bloque:** Caramelo (plástico brillante con tachas), Cristal (al terminar el
Bosque) y Neón (al terminar el Glaciar).

## Modo números

Cada color recibe un número; las puertas muestran el resultado y los bloques una cuenta
que da ese resultado. Tres niveles: **sumas hasta 10**, **sumas y restas hasta 20** y
**tablas de multiplicar**. Con **Solo números** los bloques pierden el color y hay que
calcular de verdad.

## Reto del día

El mismo tablero para todo el mundo (semilla del día), con rocas y alguna mecánica
mezclada. Se juega **sin pistas ni martillo** para que el ranking sea justo; el deshacer
sí vale. Gana quien lo resuelve con **menos jugadas** y, si empatan, en menos tiempo.
Cuenta la mejor solución del día; resolverlo suma racha 🔥 y la primera vez del día da un
martillo. Sin cuenta se juega igual, sin ranking.

## Cómo funciona por dentro

| Archivo | Qué hace |
| --- | --- |
| `public/bloques-motor.js` | Motor compartido por el navegador y el Worker: tablero, reglas, generador, buscador de soluciones y verificación |
| `public/bloques-trabajo.js` | Web Worker: genera niveles y busca pistas sin trabar la animación |
| `public/bloques-ui.js` | Pantallas y el tablero 3D en un lienzo |
| `src/bloques.js` | API: reto del día, ranking y progreso |

**Niveles con solución garantizada.** Se construyen **al revés**: desde el tablero vacío,
los bloques *entran* por la puerta de su color y se mueven a otro sitio que alcancen (cada
paso inverso es una jugada válida). La secuencia invertida es una solución, así que no hay
tableros imposibles. Entre varios candidatos se elige el que mejor encaja con la dificultad
buscada (cuántos bloques pueden salir de entrada y cuántas jugadas «de más» hacen falta,
medidas con un A* acotado). Hielo, raíles y puertas que alternan se añaden sobre esa
solución y se comprueban repitiéndola.

**Pistas.** Un A* sobre los estados del tablero, con salidas forzadas (sacar un bloque que
ya puede salir nunca estorba), primero exacto y, si tarda, con más peso. Corre en el Web
Worker.

**Dificultad adaptativa.** Un ajuste entre −2 y +2 (en Ajustes se ve como «normal», «subida»
o «más suave»): sube +0,2 al resolver sin ayudas cerca del par y baja −0,3 con dos pistas,
dos reinicios, tiempo agotado o martillo. Cambia el tamaño efectivo del nivel, el número de
bloques y lo tapadas que están las puertas.

**El reto del día no se puede inventar.** `POST /api/bloques/dia/empieza` devuelve el
tablero **sin la solución** y anota la hora. `POST /api/bloques/dia/termina` recibe las
jugadas, el servidor las **repite** con el mismo motor y solo acepta las que resuelven el
tablero en un tiempo creíble (≥ 0,4 s por jugada). El tablero del día se genera una vez y
queda en `bloques_nivel`.

| Endpoint | Qué hace |
| --- | --- |
| `POST /api/bloques/dia/empieza` | `{day, nivel}`; requiere cuenta de Google |
| `POST /api/bloques/dia/termina` | `{jugadas:[[bloque,x,y,puerta]…]}` → `{movs, segundos, best, mejoro, rank, total}` |
| `GET /api/bloques/ranking?day=N` | Los 20 mejores y tu puesto |
| `GET/POST /api/bloques/progreso` | Progreso de la cuenta (niveles, estrellas, ajustes) |

Tablas: `bloques_nivel`, `bloques_dia` y `bloques_prog` (ver [SETUP.md](SETUP.md)).
