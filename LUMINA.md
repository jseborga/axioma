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
- **Criaturas realistas y coherentes**: todas son fotos con el mismo estilo que Lila. Se hicieron a
  partir de su foto con la técnica de *paint-over + img2img*: se recolorea su pelaje en espacio Lab
  (sin tocar ojos ni nariz), se pintan en bruto las orejas de cada especie y el rasgo mágico, y un
  modelo de difusión (LCM Dreamshaper v7, licencia MIT) las vuelve realistas con poca fuerza. Luego
  se recortan (IS-Net, con la cola recuperada por GrabCut) y se miden sus ojos y orejas.
- **Animación avanzada (WebGL)**: cada criatura grande se monta sobre una malla deformable con
  huesos, como Live2D (`lumina-vivo.js`): la cabeza se inclina y mira, las orejas se sacuden, la
  cola ondula desde la base hasta la punta, el cuerpo respira desde el piso, la nariz y los bigotes
  tiemblan y la boca mastica. Los ojos se resuelven en la GPU: el párpado es el propio pelaje de la
  frente que baja (parpadeo natural, a veces doble), el iris se corre para mirar el dedo o el ratón,
  y el párpado de abajo sube cuando sonríe. Las alas de hada y de dragón son capas propias que
  aletean desde los hombros. Los accesorios de la cabeza la siguen.
- **Caricias**: tocar es un mimo; arrastrar el dedo encima la acaricia: el pelo se mueve con el
  dedo, cierra los ojos felices («^ ^»), apoya la cabeza en la mano y **ronronea** (sonido
  sintetizado, se apaga con el silencio del juego). Cada tramo de caricia cuenta como mimo.
- **Pasea**: camina por su habitación mirando hacia donde va, salta y baila. Dormida cierra los
  ojos y cabecea; comiendo mastica. En tamaños chicos (aldea, álbum) se muestra la imagen fija
  con una respiración suave, y si el dispositivo no tiene WebGL también. Con «reducir movimiento»
  activado en el sistema, se quedan quietas.
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
| `public/lumina/lila.jpg` | La imagen de Lila (portada) |
| `public/lumina/lila-sola.webp`, `public/lumina/cuarto.jpg` | Lila recortada con fondo transparente (segmentación IS-Net, la cola recuperada con GrabCut) y su habitación sin ella (rellenada con LaMa), para que pueda pasear |
| `public/lumina/criaturas/*.webp` | Las 16 criaturas realistas, recortadas |
| `public/lumina/alas-hada.webp`, `public/lumina/alas-dragon.webp` | Las alas que aletean |
| `public/lumina-vivo.js` | `AxLuminaVivo`: la malla con huesos en WebGL, los ojos en la GPU, las caricias y el ronroneo |
| `src/mate.js` | Guarda `perfil.lumi` en la nube limpiando cada campo (criaturas y accesorios del catálogo, topes, horas válidas, el PIN solo como hash) |
