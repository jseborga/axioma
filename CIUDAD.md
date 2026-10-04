# Ciudad Saber

Un constructor de ciudades en un **mundo infinito**, con vista isométrica. Cada persona
funda su ciudad en una «ranura» del mundo y las ciudades de las ranuras de al lado son
sus **vecinas**: se ven en el mapa, se puede viajar con la cámara hasta ellas y hay
ranking del mundo. La ciudad recorre las **épocas de la historia**, de la Antigüedad a la Era Digital, y cuando su influencia
cultural toca la de una vecina **se encuentran** y pueden firmar un tratado comercial. La ciudad crece con buenas decisiones de urbanismo y servicios, y
sus problemas (apagones, sequías, atascos, incendios…) se resuelven **respondiendo
preguntas** de ingeniería básica, servicios y cultura general.

Se entra desde el menú (**Ciudad Saber**) o desde la tarjeta del inicio. Hace falta
entrar con Google: la ciudad se guarda en el servidor.

## Cómo se juega

| Herramienta | Qué hace |
|---|---|
| 🛣️ Vías | Calles. Se tocan una a una o se arrastran en «L». Las zonas solo crecen junto a una calle. |
| 🏘️ Zonas | Residencial (habitantes), Comercial (empleo y recaudación), Industrial (mucho empleo, contamina). Se arrastran en rectángulo. |
| ⚡ Energía | Central térmica (40 MW, contamina), parque eólico (12 MW), planta solar (16 MW), hidroeléctrica (60 MW, junto al agua). |
| 💧 Agua | Pozo y bomba (40), depuradora (80 y menos contaminación). |
| 🚓 Servicios | Policía, bomberos, hospital y escuela, cada uno con su radio de cobertura. |
| 🎭 Cultura | Biblioteca, plaza, parque, teatro, museo, universidad y monumento: suman cultura y felicidad. |
| 🧨 Demoler · 🔍 Mirar | Quitar lo construido · ver qué hay en una casilla y **por qué crece o no**. |

- Las zonas suben de nivel (1 a 3, o 4 con *Rascacielos*) si tienen calle, electricidad,
  agua, demanda (las barras **R C I**), servicios cerca y poca contaminación. Sin escuela
  cerca no pasan del nivel 2.
- La **cultura amplía el territorio**: el radio (el círculo punteado) empieza en 7 y crece
  con la raíz de la cultura, hasta 30. El HUD muestra cuánta cultura falta para el siguiente.
- Cada 10 s se cobran impuestos y se paga el mantenimiento. En 🏛️ **Alcaldía** se ajustan
  los impuestos (6 a 14 %): más impuestos, más dinero, pero menos felicidad y crecimiento.
- 🗺️ **Capas**: contaminación, seguridad, bomberos, salud, educación y ocio pintadas sobre
  el mapa.
- Hay **objetivos** guiados (calle, zona, energía, agua, 100 habitantes, primera tecnología,
  primer problema resuelto… hasta el monumento) para orientar a quien empieza.
- El mapa se mueve arrastrando y se acerca con la rueda, con dos dedos o con +/−; ⛶ pone la
  ciudad a pantalla completa. Hay coches por las calles, humo, agua que brilla y ciclo de
  día y noche con ventanas encendidas.

## Épocas de la historia

La ciudad recorre seis épocas. Toca el chip de la época (arriba) para ver sus metas y lo que trae cada una:

| Época | Metas para llegar | Nivel máximo de las zonas | Lo que trae |
|---|---|---|---|
| 🏺 Antigüedad | (inicio) | 1 | Calles de tierra, adobe y paja, mercados, talleres, pozo, guardia, plaza, parque, biblioteca y teatro (con *Artes escénicas*). Sin electricidad. |
| 🏰 Edad Media | 60 habitantes, 8 de cultura, 1 acierto | 2 | Bomberos, hospital, escuela, universidad (con *Educación superior*); casas de piedra y madera, molinos y fraguas. |
| 🎨 Renacimiento | 200 habitantes, 40 de cultura, 3 aciertos | 3 | Museo, monumento; calles empedradas, estuco y teja, cúpulas, arcadas. |
| 🏭 Revolución Industrial | 450 habitantes, 100 de cultura, 6 aciertos | 3 | **La electricidad**: central térmica, hidroeléctrica, depuradora; ladrillo, chimeneas, asfalto, autos antiguos. Llega una primera red que cubre lo que ya se consume. |
| 🏙️ Era Moderna | 900 habitantes, 220 de cultura, 10 aciertos | 4 (con *Rascacielos*) | Eólica, solar, reciclaje, rascacielos. |
| 💻 Era Digital | 1.800 habitantes, 420 de cultura, 15 aciertos | 4 | Torres de vidrio con jardines, fábricas limpias con paneles solares, autos eléctricos, luces de neón. |

Con las metas cumplidas, se pasa de época acertando una **pregunta de historia de esa época** (35 preguntas: 7 por cada paso,
de la Ruta de la Seda y Tiwanaku a Potosí, la máquina de vapor, 1825, 1952, la Luna e internet). Si se falla, hay que esperar
30 s. Pasar de época da 500 $ por época, felicidad durante un rato y 200 puntos.

Las tecnologías también tienen época: por ejemplo, la eólica y la solar llegan con la Era Moderna. Los problemas también
dependen de la época: no hay apagones ni smog antes de la industria, ni incendios, epidemias o falta de escuelas en la Antigüedad.

## Encuentros de mundos y tratados

Cada ciudad tiene una **influencia cultural**: su radio de territorio + 7 casillas por época (el círculo dorado punteado).
Cuando la influencia de dos vecinas suma al menos la distancia entre sus centros (72 casillas al lado, ~102 en diagonal),
**se encuentran**: aparece un camino punteado entre ambas y un aviso «¡Encuentro de mundos!».

En 🌍 **Vecinos** se puede firmar un **tratado** con una ciudad encontrada acertando una pregunta de cultura (si se falla,
30 s de espera). El tratado abre una **ruta comercial** visible en el mapa, con caravanas, carruajes o camiones según la
época, y da por cada ruta (hasta 5): +8 % de ingresos, +4 de demanda comercial y un poco de cultura en cada paso. Al
firmarlo se reciben 500 $ y 20 de cultura. Cada ciudad firma sus propios tratados.

Los encuentros los calcula el servidor al guardar cada tramo con el estado de las vecinas en ese momento y los apunta en la
ciudad (`contactos`). Así la repetición de cada tramo no depende de lo que hagan los demás mientras tanto.

## Redes de electricidad y agua

La electricidad y el agua llegan solo a lo que está **conectado** a una central o a una bomba:

- **Lo construido conduce**: las zonas y los edificios contiguos (en cruz) se pasan la corriente y el agua. Las **calles y el
  campo cortan** la red.
- **⚡ Tendido eléctrico** (🔌 Redes, desde la Revolución Industrial, 5 $ por casilla): postes y cables sobre el campo o
  **encima de una calle**, para unir una central con zonas separadas. Sobre lo construido no hace falta.
- **🚿 Tubería de agua** (desde la Antigüedad, 8 $ por casilla): va **bajo tierra**, también bajo calles y edificios. Al
  elegirla se enciende la **⛏️ vista subterránea**: el suelo en sombra, lo construido en verde (con agua) o rojo (sin agua),
  las bombas en azul y las tuberías.
- Cada red reparte lo que generan sus centrales o bombas entre lo que tiene conectado: si consume más de lo que genera,
  cada casilla recibe una parte. Las ayudas (la primera red de la Revolución Industrial y los premios de los problemas) se
  reparten entre todas las redes según lo que consume cada una.
- Una zona sin electricidad o sin agua no crece (y puede bajar de nivel) y su gente está menos feliz. Sobre ella salta un
  aviso **⚡** o **💧** rojo; el marcador cuenta las zonas sin red (⚠) y la ficha de la casilla (🔍) explica qué falta.
- Capas 🗺️ **Electricidad** y **Red de agua** para ver de un vistazo qué está conectado.
- Demoler (🧨) quita lo de la superficie y, si no hay nada, el tendido; en la vista subterránea quita tuberías.
- Las ciudades guardadas antes de las redes reciben tuberías bajo todas sus calles (y tendido sobre ellas si ya tenían
  electricidad), para que nada se corte.

Las redes son reglas del motor: el servidor las repite igual que el resto de cada tramo.

## Valor del suelo, barrios ricos y comercio de lujo

Cada casilla residencial o comercial tiene un **valor del suelo** (de 0 a 100 %), que el motor calcula con lo que la rodea:

- Lo **suben** los parques, plazas, teatros, museos y monumentos cercanos (hasta +30 %), estar cubierta por policía, salud y
  educación (+7 % cada uno) y tener **agua a la vista** (un lago o el mar a 2 casillas o menos, +12 %).
- Lo **baja** la contaminación (hasta −45 %): una zona rica al lado de una fábrica no dura.

Según su valor, el barrio es **popular** (menos de 42 %), de **clase media** (42–66 %) o **acomodado** (66 % o más):

| | Clase media | Acomodado |
|---|---|---|
| Residencial: impuestos por habitante | ×1,2 | ×1,45 |
| Comercial: impuestos por empleo | ×1,25 | ×1,6 |

Así, planificar parques, cultura y servicios junto a las viviendas y las tiendas, y alejar la industria, se paga solo.

Cada clase se ve distinta y según la época: la clase media suma jardincitos, balcones y toldos; los barrios acomodados son
casas patricias con jardín (Antigüedad), casonas con torreón (Edad Media), palacetes con cúpula y fuente (Renacimiento),
villas victorianas con cerca (Revolución Industrial), villas modernas con piscina, apartamentos de lujo con balcones,
cornisa dorada y azotea verde, y **torres redondas** de cristal (Era Moderna y Digital, con terrazas verdes en la Digital).
El comercio de lujo va del bazar con toldos y el mercado con soportales a la galería renacentista, los grandes almacenes,
las boutiques de cristal con franja dorada y los rascacielos de cristal con corona dorada o redondos con aguja y baliza.

Los edificios de las zonas se dibujan con **volumen suave**: degradados en las caras (la izquierda iluminada), un bisel claro
en la arista del frente, sombra de contacto en la base y sombra proyectada difusa, sin esquinas bruscas. Para que esto no
cueste en cada cuadro, cada combinación (zona, nivel, época, clase, variante, día o noche) se dibuja una vez y se guarda como
imagen; lo que se mueve (humo, balizas, el resplandor nocturno) se pinta aparte. Las ciudades vecinas también muestran sus
barrios ricos (su valor del suelo se calcula al cargarlas).

- Capa 🗺️ **Valor del suelo**: rojo = popular, amarillo = clase media, verde = acomodado.
- La ficha de la casilla (🔍) dice la clase del barrio y su valor, y qué lo sube.

El valor del suelo es una regla del motor: el servidor la repite igual al validar cada tramo.

## Deuda pública: préstamos y bonos para invertir

Como una alcaldía real, la ciudad puede pedir prestado para **invertir** (hospitales, universidad, centrales, depuradoras) y
devolverlo cada mes con intereses (🏛️ Alcaldía → 💳 Deuda e inversión). Un mes del juego son 10 s.

| | Préstamo bancario | Bonos municipales |
|---|---|---|
| Desde | la Antigüedad | la Revolución Industrial |
| Interés base | 8 % anual | 5 % anual |
| Plazos | 12, 24 o 36 meses | 24 o 48 meses |
| Cómo se devuelve | cuota fija cada mes (sistema francés: intereses + capital) | cupón de intereses cada mes y todo el capital al vencer |
| Devolver antes | lo pendiente + 1 % | lo pendiente + 2 % (recompra) |

- **Más plazo, más interés**: +0,5 % anual por cada año más que el plazo más corto.
- **Calificación crediticia** (AAA, AA, A, BBB, BB, B): depende de la deuda viva frente a los ingresos de un año
  (menos de 30 % es AAA; 200 % o más es B), baja dos escalones durante un año tras un impago y uno si la caja está en rojo.
  Tener 3 o más aciertos de economía la sube un escalón. Cada escalón suma interés (AA +0,5 %, A +1 %, BBB +2 %,
  BB +4 %); con B nadie presta.
- **Límite legal**: la deuda viva no puede pasar del 110 % de los ingresos de un año (mínimo 1.000 $), como en muchas
  leyes de haciendas locales. Se pide en centenas, desde 500 $.
- **Impago**: si después de pagar la deuda del mes la caja queda en rojo, cuenta como impago.
- El panel muestra la oferta antes de firmar (interés, cuota o cupón, total a devolver e intereses), cada deuda con lo
  pendiente y los intereses pagados, y una explicación con la regla de oro (deuda para invertir, no para gastos corrientes)
  y un poco de historia.

Pedir (`p`: monto, plazo, tipo) y devolver (`v`: número de deuda) son acciones del tramo: el servidor las repite y calcula
los intereses igual que el navegador.

## Relieve y modo retro

- **Relieve**: el mundo tiene colinas, laderas y valles (de 0, el agua, a 4 niveles). Cada casilla se inclina según sus cuatro
  esquinas y se ilumina desde arriba a la izquierda. Las calles y los lotes vacíos siguen la ladera; los edificios se nivelan
  sobre un cimiento de tierra. El relieve sale de la semilla del mundo y es solo visual: no cambia las reglas ni lo que valida
  el servidor.
- **Modo retro** (👾): la ciudad se dibuja a la mitad de resolución y se amplía sin suavizar, con píxeles nítidos como los
  juegos de ciudades de los 90 (además, va más rápido). Viene encendido; el botón lo alterna y el teléfono lo recuerda.
  Los textos (nombres de las ciudades, el cartel de época, el dinero del mes) van en una capa encima a resolución
  completa, así que se leen bien también en retro.
- **Zoom con dos dedos**: el pellizco acerca y aleja siguiendo los dedos (la página no se amplía). Al alejar mucho se pasa
  a la vista del mundo (el botón 🌐 se marca solo) y al acercar se vuelve a la ciudad. Levantar un dedo antes que el otro
  termina el pellizco sin saltos, y con dos dedos nunca se construye.

## Preguntas: investigar y resolver problemas

- 🔬 **Investigación**: 13 tecnologías (eólica, solar, hidroeléctrica, depuración,
  educación superior, museos, artes escénicas, patrimonio, transporte eficiente,
  rascacielos, reciclaje, salud pública, impuestos inteligentes). Cada una se investiga
  acertando una pregunta de **su tema**; si se falla, hay que esperar 30 s.
- ⚠️ **Problemas**: aparecen según lo que le falta a la ciudad (apagón si falta energía,
  sequía si falta agua, smog, incendio, inseguridad, atasco, crisis de caja, brote de gripe,
  falta de escuelas) y otros de oportunidad (puente dañado, plan urbano, feria cultural).
  Tienen 60 s de plazo; acertando se gana 400 $ y un premio (más MW, más agua, aire más
  limpio, cultura o felicidad). Fallar acorta el plazo; dejarlo vencer cuesta 300 $ y
  felicidad (un incendio sin bomberos además derriba el edificio).
- La ciudad **se detiene** mientras se responde (25 s por pregunta) y siempre se muestra la
  explicación (💡) de la respuesta.
- El banco tiene 233 preguntas en 12 temas: energía, agua, transporte, urbanismo,
  ambiente, salud, seguridad, educación, economía, cultura, ingeniería básica e historia. No se
  repiten en 60 días (`preguntas_vistas`) mientras queden del tema.

Puntaje: `habitantes × (0,5 + felicidad/100) + 30 × aciertos + cultura + 200 × época`.

## Mundos y vecinos

- **Mundo abierto** (`ABIERTO`): el de todos. Cada nueva ciudad ocupa la siguiente ranura
  de una espiral; los centros están a 72 casillas, así que los territorios nunca se pisan.
- El terreno (pradera, bosque, lagos y playas) sale de una función de ruido con la semilla
  del mundo: es el mismo para todos y no tiene borde. Junto al centro de cada ranura
  siempre hay tierra libre y un lago pequeño.
- Los vecinos (las ranuras de alrededor) se ven en el mapa con su nombre, su territorio y
  sus edificios, y en 🌍 **Vecinos** con el ranking del mundo.

### Cómo es el multijugador

- Es **asíncrono**: cada persona juega su ciudad en su teléfono o computador, y lo que hacen las demás le llega al guardar
  (cada ~40 s) y cada minuto. No hace falta estar conectados a la vez.
- Cada ciudad nueva toma la siguiente ranura libre en **una sola instrucción** de la base de datos, así que aunque muchas
  personas entren en el mismo instante nunca reciben la misma ranura.
- Cada quien solo puede modificar su propia ciudad: el servidor rechaza un tramo que no sea el abierto de esa persona y
  cualquier construcción fuera de su territorio.
- La misma persona en dos dispositivos: vale el último que abrió la ciudad; el otro avisa «abriste esta ciudad en otra
  pestaña o dispositivo».
- 🌐 **Vista de mundo**: aleja la cámara para ver tu ciudad con sus ocho ranuras vecinas, con nombres, épocas, influencias y
  rutas. El terreno se dibuja como una sola imagen inclinada para que vaya fluido (60 cuadros por segundo).
- Si una vecina firma un tratado con tu ciudad, te llega un aviso para que firmes tú también.

## Desafíos de ciudad (docentes)

En **Educativo → curso → Ciudad**, quien gestiona el curso crea un desafío: un mundo propio
para el curso con nombre, días abierto y metas opcionales (habitantes, felicidad,
aciertos). Los estudiantes lo ven en su curso («Fundar mi ciudad») y juegan junto a sus
compañeros.

El **reporte** muestra, por estudiante, su ciudad, habitantes, felicidad, aciertos/preguntas,
puntaje, minutos jugados, si cumple la meta y el % de aciertos **por tema**, y arriba los
aciertos de todo el curso por tema (lo más bajo es lo que conviene repasar). Se descarga en
Excel. «Cerrar ahora» termina el desafío: las ciudades quedan para mirarlas.

## Cómo se valida (que nadie invente una ciudad)

- El motor (`public/ciudad-motor.js`) es determinista y lo usan el navegador y el Worker.
- El juego avanza por **tramos**: al entrar, el servidor da una semilla de tramo. El
  navegador anota cada acción con su paso de simulación y, cada ~40 s (y al salir), envía
  las acciones del tramo. El servidor (`src/ciudad.js`) **repite el tramo** desde el último
  estado comprobado; si alguna acción no es posible (sin dinero, fuera del territorio, en el
  agua…) lo rechaza. Si cuadra, guarda el estado y da la semilla del tramo siguiente.
- Las preguntas se piden y se responden en el servidor (`/api/ciudad/pregunta` y
  `/responde`), que **registra la primera respuesta** de cada pregunta del tramo. Al repetir,
  una respuesta que no se registró, con otra opción o que diga que acertó una mala invalida
  el tramo. Las opciones se barajan por tramo.
- El reloj: el tramo no puede durar menos de la mitad de su tiempo simulado (el juego va
  como mucho a ×2).
- Abrir la ciudad en otra pestaña invalida el tramo anterior.
- Un tramo tiene como mucho 1.200 pasos (10 min) y 4.000 acciones; repetir un tramo
  normal de 40 s cuesta unos pocos milisegundos de CPU, incluso en una ciudad grande.

## API

| Ruta | Qué hace |
|---|---|
| `GET /api/ciudad/mundos` | El mundo abierto y los desafíos de mis cursos, con mi ciudad en cada uno |
| `POST /api/ciudad/entrar` `{mundo}` | Asigna ranura si hace falta y abre un tramo: `{estado, nuevo, seg, cerrado}` |
| `POST /api/ciudad/guardar` `{mundo, seg, envio:{a, fin}}` | Repite el tramo, apunta los encuentros y guarda: `{seg, resumen, rank, total, contactos}` |
| `GET /api/ciudad/vecinos?mundo=` | Las ciudades de las ranuras de alrededor, con su época, influencia y distancia |
| `GET /api/ciudad/ranking?mundo=` | Top 20 y mi puesto |
| `POST /api/ciudad/pregunta` `{mundo, tema, evita, era}` | Una pregunta del tema sin la respuesta (con `era`, de historia de esa época) |
| `POST /api/ciudad/responde` `{mundo, id, o}` | Registra la respuesta: `{ok, correcta, dato}` |
| `GET/POST /api/ciudad/desafios` | Desafíos de un curso / crear uno (docente) |
| `POST /api/ciudad/desafios/:code/cerrar` | Cerrar un desafío |
| `GET /api/ciudad/reporte?mundo=` | Reporte del docente por estudiante y por tema |

Tablas: `ciudad_mundos`, `ciudad_ciudades` y `ciudad_respuestas` (ver
[SETUP.md](SETUP.md)).

## Archivos

| Archivo | Qué es |
|---|---|
| `public/ciudad-motor.js` | Motor determinista: terreno infinito, edificios, crecimiento, economía, problemas, tecnologías, repetición de tramos |
| `public/ciudad-ui.js` | Pantalla: vista isométrica, herramientas, paneles, preguntas y guardado por tramos |
| `src/ciudad.js` | API: mundos, ranuras, guardado comprobado, vecinos, ranking, preguntas y desafíos |
| `src/ciudad-preguntas.js` | Banco de preguntas por tema (solo en el servidor) |
