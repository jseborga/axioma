# Inglés para niñas y niños

Un curso de **inglés inicial**, práctico y con juegos, dentro del mismo segmento que
[Matemática Montessori](MATE.md): usa los mismos perfiles (apodo y animalito) y arriba
se cambia de materia (🧮 Matemática · 🔤 Inglés). Se abre desde el menú (**Inglés para
niñas y niños**) o desde la tarjeta del inicio. Funciona en móvil, tablet y computadora,
con botón de **pantalla completa**.

## Unidades

### Nivel 1 · Inicial

| # | Unidad | Palabras |
|---|---|---|
| 1 | 👋 Hello! | hello, goodbye, good morning, good night, please, thank you, yes, no, friend, name |
| 2 | 🎨 Colors | red, blue, yellow, green, orange, purple, pink, black, white, brown |
| 3 | 🔢 Numbers | one … ten |
| 4 | 🐶 Animals | dog, cat, bird, fish, cow, horse, duck, rabbit, lion, elephant, monkey, frog |
| 5 | 👨‍👩‍👧 Family | mother, father, sister, brother, baby, grandmother, grandfather, family |
| 6 | 🍎 Food | apple, banana, bread, milk, water, egg, cheese, cake, juice, rice, chicken, ice cream |
| 7 | 🙂 My body | face, eyes, nose, mouth, ears, hand, foot, hair, arm, leg, teeth |
| 8 | 👕 Clothes | shirt, pants, shoes, hat, dress, socks, jacket, glasses, cap |
| 9 | 🏫 School | book, pencil, bag, teacher, school, scissors, crayon, ruler, computer, chair |
| 10 | 🏠 My house | house, door, window, bed, bathroom, kitchen, garden, sofa, lamp, TV |
| 11 | 🏃 Actions | run, jump, swim, eat, drink, sleep, read, write, sing, dance, play |
| 12 | 😊 Feelings | happy, sad, angry, tired, scared, hungry, surprised, calm |
| 13 | 🌈 Weather | sun, rain, cloud, wind, snow, rainbow, hot, cold, star, moon |
| 14 | 🧸 Toys | ball, doll, teddy bear, kite, car, train, robot, balloon, blocks, puzzle |
| 15 | 🐘 Opposites | big, small, fast, slow, tall, short, new, old, clean, dirty |

### Nivel 2 · Básico

| # | Unidad | Palabras y expresiones |
|---|---|---|
| 16 | 🔢 Numbers 11–20 | eleven … twenty |
| 17 | 📅 Days of the week | Monday … Sunday, today, tomorrow, week |
| 18 | 🎂 Months | January … December, birthday |
| 19 | ⏰ Time | one/three/six/nine/twelve o'clock, morning, afternoon, night, clock, hour |
| 20 | 🏞️ Places | park, hospital, store, bank, library, church, zoo, beach, market, restaurant, street |
| 21 | 📦 Where is it? | in, on, under, next to, behind, in front of, box, here, there |
| 22 | 🪥 My day | wake up, brush my teeth, take a shower, get dressed, eat breakfast, go to school, do homework, watch TV, go to bed, wash my hands |
| 23 | ❓ Questions | what, who, where, when, why, how, how many, how old |
| 24 | ⚽ Hobbies | football, basketball, tennis, guitar, piano, paint, draw, cook, skate, music |
| 25 | 🌳 Nature | tree, flower, grass, river, mountain, sea, butterfly, bee, ant, spider, leaf |
| 26 | 🚌 Transport | bus, plane, boat, truck, taxi, motorcycle, bike, helicopter, subway, cable car |
| 27 | 🧑‍🚒 Jobs | doctor, police officer, firefighter, farmer, chef, pilot, singer, artist, nurse, dentist, scientist |
| 28 | 🙋 People | I, you, he, she, we, they, it, boy, girl |
| 29 | 🦸 Describing | funny, kind, smart, brave, quiet, loud, strong, beautiful, young, shy |
| 30 | 💬 Let's talk! | I like, I don't like, I can, I can't, I want, I have, let's go, see you |

Los días y los meses se muestran como hojas de calendario (LUN, ENE…) y los números
como fichas con sus cifras.

**Saltar al Nivel 2**: quien ya sabe lo básico puede hacer una prueba de 12 ejercicios
(de seis unidades del Nivel 1, al azar). Con 80 % o más, las lecciones del Nivel 1 quedan
hechas con una estrella y se abre el Nivel 2; si no, se sigue el camino normal.

Son 30 unidades y 301 palabras. Cada unidad trae también 6 a 8 frases sencillas («I have a dog.», «The cat is black.»,
«I like ice cream.»…). El contenido está en `public/ingles-motor.js`; 📖 en cada unidad
muestra sus palabras y frases para escucharlas.

## El camino de lecciones

Cada unidad es un camino (158 lecciones en total) que se abre en orden; Lumi marca dónde
seguir:

1. **Palabras 1, 2, 3**: 4 palabras nuevas por lección. Cada una se presenta con su
   dibujo, su sonido (🔊 y 🐢 despacio) y su significado, y enseguida se practica.
2. **Frases**: entender frases, completarlas y armarlas con fichas.
3. **Escucha y habla**: escuchar y elegir, deletrear y decirlo en voz alta.
4. **Reto de la unidad**: todo mezclado.

### Ejercicios

- **¿Cuál es…?** — la palabra en inglés y cuatro dibujos.
- **Escucha y elige** — solo el sonido.
- **¿Qué significa?** — la palabra con su dibujo y tres significados.
- **¿Cómo se dice en inglés?** — la palabra en español y tres en inglés.
- **Parejas** — unir palabras con sus dibujos.
- **Deletrea** — armar la palabra con letras.
- **Arma la frase** — ordenar fichas para escribir la frase en inglés.
- **Completa la frase** y **¿qué significa esta frase?** (también solo escuchando).
- **Dilo en voz alta** — con el micrófono (reconocimiento de voz del navegador). Si no se
  puede hablar en ese momento, «Ahora no puedo hablar» lo salta sin penalizar.

Se elige y se toca **Comprobar**. Si es correcto, Lumi celebra (y cuenta las seguidas 🔥);
si no, muestra la respuesta, la dice en voz alta y ese ejercicio vuelve al final de la
lección. Las respuestas siempre se escuchan en inglés.

## Avance, estrellas y repaso

- Al terminar: **estrellas** según los aciertos (terminar siempre da al menos una), **XP**,
  tiempo, las palabras de hoy y «¿cómo te sentiste?».
- **Meta del día**: 20 XP. Los días con práctica cuentan para la racha 🔥.
- Cada palabra tiene una **fuerza** (0 a 5): sube al acertar y baja al fallar.
  **💪 Repasar mis palabras** practica las más débiles; si una lección sale con menos del
  60 % de aciertos, Lumi propone repasarlas en ese momento.
- En **👪 Para adultos** (el mismo panel de Matemática) se ven las lecciones y unidades
  hechas, las palabras aprendidas, las que hay que repasar con una idea para practicar en
  casa, y cómo se sintió en cada lección.

El avance va en el mismo perfil (`perfil.ing`): en el dispositivo y, con una cuenta de
Google, también en `mate_perfiles` (el servidor guarda solo los campos que usa el curso).
No hacen falta tablas nuevas.

## Voz

Usa la voz en inglés del sistema (Web Speech API) y el reconocimiento de voz del
navegador para hablar (Chrome y Edge lo tienen; si no está, no hay ejercicios de hablar).
