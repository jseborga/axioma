# Granja Express

Un arcade de 8 bits de **estrategia y velocidad**, inspirado en los juegos de granja y
pueblo, pero en partidas de 3 minutos: siembras, fabricas y entregas los pedidos antes
de que se vayan. Menú → **Granja Express** (o la tarjeta de la portada).

## Cómo se juega

| Parte | Qué hace |
| --- | --- |
| **Parcelas** (6) | Elige la semilla a la derecha y toca una parcela vacía. Cuando brilla, tócala: cada parcela da **2**. Trigo 4 s, maíz 6 s, zanahoria 5 s. |
| **Fábricas** | Toca una para ponerla a trabajar (hasta 3 en cola). Lo hecho va solo al granero. |
| **Pedidos** | Llegan en camión, tren, avión y barco con su plazo (la barra de abajo). Con todo listo, el borde se pone verde: tócalo para entregar. La ✕ lo descarta (sin castigo, pero el andén tarda 8 s en llenarse). |
| **Granero** | Caben 24. «Vender» saca productos a mitad de precio para no quedarse sin sitio. |
| **Vidas** | 3. Cada pedido que se va quita una; sin vidas se acaba la partida. |

| Fábrica | Receta | Tiempo | Nivel |
| --- | --- | --- | --- |
| Molino | 2 trigo → harina | 4 s | 1 |
| Horno | 1 harina → pan | 5 s | 1 |
| Gallinero | 1 maíz → huevo | 4 s | 2 |
| Jugos | 2 zanahorias → jugo | 4 s | 2 |
| Pastelería | harina + huevo + zanahoria → torta | 7 s | 3 |

**Niveles dentro de la partida:** con 100, 300 y 650 monedas se sube al nivel 2, 3 y 4:
zanahoria, gallinero y jugos, un tercer andén, la pastelería y, en el 4, un cuarto andén
(barco). Los pedidos de más nivel piden más productos elaborados y pagan más.

**Monedas por pedido:** el valor de lo que lleva (+15 % por nivel), más un extra por la
rapidez (cuanto más plazo sobra, más) y el **combo**: si entregas otro pedido antes de
8 s, cada entrega vale un 10 % más (hasta +50 %).

## Modos

- **La granja del día:** la misma para todo el mundo (semilla del día). Se juega cuantas
  veces se quiera y cuenta la mejor partida; ranking del día. Suma 2 puntos por día en el
  ranking semanal de los **grupos de amigos** y aparece en «Mis partidas».
- **Práctica:** una granja nueva cada vez; la mejor marca se guarda en el teléfono.
- **Sin fin:** sin reloj, hasta que se escapen tres pedidos; los plazos se acortan con el
  tiempo (hasta un 40 %). Máximo 20 minutos.
- **Retos:** «Granja Express» y «Granja sin fin» aparecen como juegos rápidos al crear un
  reto entre amigos (rondas seguidas, cada una con su granja).
- **Competencias de empresas:** en Nueva competencia, grupo «Arcade» (o «Sin fin»). El
  camión lleva el **logo y el color** de la marca, y la empresa puede renombrar el pan, el
  jugo y la torta con sus productos. Premios por puesto y cupones por monedas, como en el
  resto de competencias.

## Cómo se evita hacer trampa

La partida es una **simulación determinista** a 10 pasos por segundo a partir de una
semilla (`public/granja-motor.js`, el mismo archivo en el navegador y en el Worker). El
navegador guarda cada toque como `[paso, acción, …]` y, al terminar, envía esa lista. El
servidor **repite la partida entera** y calcula él las monedas: una acción imposible
(cosechar sin sembrar, entregar sin tener) invalida el envío. Además compara la duración
simulada con su reloj: no se puede enviar una partida de 3 minutos jugada en 5 segundos.
La simulación avanza con el reloj real aunque la pestaña quede en segundo plano.

## Técnica

- Lienzo de **192×246 píxeles** escalado sin suavizar (`image-rendering: pixelated`):
  nítido y ligero en cualquier móvil.
- Sprites de 10×10 y una fuente de 3×5 dibujados por código; edificios y vehículos
  también. Sin imágenes ni librerías: el juego son unos 40 KB y funciona sin conexión.
- Sonido de 8 bits con WebAudio (se puede silenciar).

## Base de datos

La granja del día usa la tabla `granja_dia` (ver «Añadir la tabla de Granja Express» en
[SETUP.md](SETUP.md), también en `instalar.sql`). Práctica, retos y competencias no
necesitan nada nuevo.
