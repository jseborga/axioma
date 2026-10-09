# Inglés para niñas y niños

Un curso de **inglés inicial**, práctico y con juegos, dentro del mismo segmento que
[Matemática Montessori](MATE.md): usa los mismos perfiles (apodo y animalito) y arriba
se cambia de materia (🧮 Matemática · 🔤 Inglés). Se abre desde el menú (**Inglés para
niñas y niños**) o desde la tarjeta del inicio. Funciona en móvil, tablet y computadora,
con botón de **pantalla completa**.

## Unidades

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

Cada unidad trae también 6 a 8 frases sencillas («I have a dog.», «The cat is black.»,
«I like ice cream.»…). El contenido está en `public/ingles-motor.js`; 📖 en cada unidad
muestra sus palabras y frases para escucharlas.

## El camino de lecciones

Cada unidad es un camino (79 lecciones en total) que se abre en orden; Lumi marca dónde
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
