# LuminaPets: El Valle de las Criaturas Mágicas

Una mascota virtual educativa para niñas y niños de **4 a 9 años**, dentro del segmento
**Aprender** junto a [Matemática](MATE.md), [Inglés](INGLES.md) y [Ciencias](CIENCIAS.md):
usa los mismos perfiles y arriba se cambia de materia (🧮 · 🔤 · 🔬 · 🐾). Se abre desde el
menú (**LuminaPets: criaturas mágicas**) o desde la tarjeta del inicio. Funciona en móvil,
tablet y computadora, con pantalla completa y voz.

Sigue el documento de diseño del juego (GDD): **aprendizaje invisible**, **cero culpa**,
**coleccionismo ético** y **alianza familia-juego**. Se hizo en la plataforma web (no en
Unity ni Godot) para compartir perfiles, nube y panel de adultos con el resto de Aprender.

## La mascota

**Lila**, la gatita lavanda de la imagen de referencia (`public/lumina/lila.jpg`), es la
portada y la primera mascota. Las demás son peluches en SVG con el mismo estilo
(Kindchenschema: cabeza grande y esponjosa, ojos enormes con brillos, mejillas, sudadera
pastel y almohadillas rosadas).

- **Barras sin castigo**: ⭐ Energía, 🍓 Pancita, 🫧 Brillo y 🌙 Descanso bajan despacio
  (nunca de noche). Si una llega a cero, la mascota duerme en un **capullo de siesta** y
  despierta con un **abrazo**. Nunca enferma ni muere.
- **Está viva**: respira, parpadea y mueve la cola todo el tiempo; de a ratos mira a un lado,
  mueve las orejas, menea la cola, salta, baila o pasea por la habitación, y sigue el dedo o
  el ratón con la mirada. Al hacerle mimos se alegra (entrecierra los ojos y mueve la
  cabeza); dormida cierra los ojos y cabecea; comiendo mastica. La foto de Lila se anima por
  capas con máscaras suaves (cabeza con párpados, cuerpo y cola); las criaturas dibujadas
  tienen sus partes separadas (cabeza, orejas, ojos, cola, cuerpo y alas). Con «reducir
  movimiento» activado en el sistema, se quedan quietas.
- **Lo que pide**: la barra más baja (si está bajo 60 %). Si ya hay con qué dárselo, se
  destaca el botón; si no, el minijuego que lo consigue.
- **Cuidados**: 🧁 comer, 🛁 baño de burbujas (se revientan una por una; con espuma mágica es
  completo), ☁️ dormir en el nido de nubes con canción de cuna, 💖 mimos tocándola y
  🎀 vestir (lazo, flor, corona, sombrero, gafas, bufanda, varita o globo; uno por zona).

## Aprender para cuidar (temas mezclados)

Cada ronda son 3 retos cortos con voz (en Preescolar la pregunta se lee sola). Un error
nunca castiga: la mascota anima y se vuelve a intentar; a la segunda se muestra la respuesta
con su explicación.

| Módulo | Qué se aprende | Premio |
| --- | --- | --- |
| 🧪 **Cocina de Pociones** | contar ingredientes en el caldero (1 a 10), series AB y ABB, colores y formas, sumas, restas, grupos iguales, repartir, la tarta astral en partes iguales y fracciones | 🧁 bocadillos |
| 🌳 **Árbol de las Palabras** | ¿qué empieza con este sonido? (con las reglas b/v, c/s/z, k/q…), **trazar letras uniendo estrellas** con el dedo, ¿con qué letra empieza?, sílabas que faltan, juntar sílabas y leer palabras | 🫧 espuma |
| 🌼 **Jardín de las Preguntas** | en cada ronda una de **ciencias** (del curso de Ciencias), una de **inglés** (con la palabra hablada en inglés) y una de **lógica** (¿cuál no va?, ¿cuál es el más grande?) | 💎 gemas |

Todas dan ✨ polvo estelar. **Modo**: Preescolar 4–6 (niveles 1–3) o Primaria inicial 7–9
(niveles 2–5); automático según el curso del perfil o elegido por un adulto. Dentro del modo,
el nivel sube con tres aciertos y baja si cuesta.

## Huevos y la Aldea del Gran Árbol

Aprender y cuidar llena el **💖 Vínculo Mágico**; al llenarse llega un **huevo sorpresa** (hasta
3 a la vez). Los mimos, el baño sin espuma y la siesta solo suman si hacían falta (y los
mimos, hasta 20 por día): los huevos salen sobre todo de aprender. El huevo se incuba
**frotándolo**, **cantándole** (Do, Re, Mi, Fa, Sol) o **meciéndolo** (botón o acelerómetro);
listo, se toca hasta que se rompe y nace con partículas doradas una criatura que todavía no
se tiene (las comunes salen más). Son 17: Lila y 16 híbridos (Gatito, Conejito, Zorrito y
Osito × Unicornio, Hada, Estrella y Dragón), que viven en el **Jardín Hada**, el **Cielo de
Nubes** o la **Cueva de Cristal**. Tocando una en la aldea pasa a ser la compañera de casa.

## Para la familia

- **🦸 Misiones de pequeños héroes**: cepillarse los dientes (2 veces), 15 minutos de lectura
  o dibujo, recoger los juguetes, y otras que se activan o agregan. Un adulto las confirma
  con el **PIN familiar** (4 números, guardado cifrado; tras 3 intentos fallidos espera 30 s).
  Un **cometa** trae 💎 2 y ✨ 10; con todas las del día, un **huevo especial**.
- **🌙 Modo noche**: de 20:30 a 07:00 por defecto (se cambia o apaga). Las criaturas duermen,
  los juegos se pausan y suena una canción de cuna.
- **🔐 Puerta para adultos**: una cuenta escrita en palabras («cuarenta y ocho dividido entre
  seis»), que ahora usan todas las materias de Aprender.
- **Ajustes y progreso** (👪 Para la familia, o desde el panel de adultos): rondas, días de la
  semana, aciertos por tema (matemática, lógica, lectura, ciencias, inglés), criaturas,
  misiones, modo, PIN y horario de noche.
- **Ético**: sin anuncios, sin compras, sin cajas de premio pagadas y sin datos personales
  (solo el apodo del perfil).

## Archivos

| Archivo | Qué hace |
| --- | --- |
| `public/lumina-motor.js` | `AxLumina`: criaturas, barras, cuidados, huevos, hábitos, PIN, noche, puerta y los minijuegos (`ronda`, `corrige`, `terminaRonda`). Sin dependencias; lo usan el navegador, el servidor y las pruebas |
| `public/lumina-dibujos.js` | `AxLuminaDibujos`: criaturas de peluche, huevo, habitación, tarta y la aldea en SVG |
| `public/lumina-ui.js` | `AxLuminaUI`: la casa, cuidados, minijuegos, incubación, aldea, misiones, noche y ajustes |
| `public/lumina/lila.jpg` | La imagen de Lila |
| `src/mate.js` | Guarda `perfil.lumi` en la nube limpiando cada campo (criaturas y accesorios del catálogo, topes, horas válidas, el PIN solo como hash) |
