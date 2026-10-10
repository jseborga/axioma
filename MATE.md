# Matemática Montessori

Juegos para aprender matemática desde **inicial (4 años)** hasta **6.º de secundaria**,
pensados para que niñas y niños se sientan **seguros y confiados**: cada quien avanza a
su ritmo, los errores se convierten en ayuda y siempre se parte de lo concreto.
Funciona igual en móvil, tablet y computadora (con teclado numérico en pantalla y
también con el teclado físico).

Se abre desde el menú (**Matemática Montessori**) o desde la tarjeta «Aprender jugando»
del inicio.

## Etapas y conceptos

| Etapa | Escena | Conceptos |
|---|---|---|
| 🐣 Inicial (4–5 años) | granja | contar hasta 10, los números del 0 al 10, más/menos/igual, formas, series, juntar (sumar hasta 10) |
| 🌱 1.º de primaria | jardín | números hasta 100, decenas y unidades, sumar y restar hasta 20, comparar (< > =), pares e impares |
| 🌳 2.º de primaria | bosque | valor posicional hasta 1000, sumar llevando, restar pidiendo prestado, multiplicar como grupos, la hora |
| 🐠 3.º de primaria | mar | tablas, dividir es repartir, fracciones, perímetro, problemas |
| 🏙️ 4.º de primaria | ciudad | multiplicar por varias cifras, división larga, fracciones equivalentes, decimales, área |
| ⛰️ 5.º y 6.º de primaria | montaña | sumar fracciones, porcentajes, operar con decimales, ángulos, múltiplos y divisores (MCD, mcm), volumen |
| 🎈 1.º y 2.º de secundaria | cielo | enteros, potencias y raíces, proporciones (directa e inversa), ecuaciones, expresiones algebraicas |
| 🪐 3.º y 4.º de secundaria | espacio | función lineal, sistemas de ecuaciones, Pitágoras, factorización, probabilidad |
| 🌌 5.º y 6.º de secundaria | estrellas | ecuación de segundo grado, trigonometría, exponenciales y logaritmos, media/mediana/moda, sucesiones |

Cada concepto tiene un **objetivo** («Aprenderé a…»), su **material Montessori**
(perlas doradas, escalera de perlas de colores, números de lija, juego de sellos,
tablero de multiplicar, círculos de fracciones, cuadrado de cien, balanza algebraica,
fichas de álgebra, plano cartesiano…), una idea clave, una **actividad para hacer en
casa** y un generador de ejercicios con 2 o 3 niveles. Todo está en
`public/mate-motor.js`; el material se dibuja en SVG en `public/mate-dibujos.js`.

## Cómo se aprende

1. **Objetivo.** Antes de empezar se lee qué se va a aprender y con qué material.
2. **Lección en tres tiempos** (la primera vez, o cuando se quiera repasar):
   *Esto es* (el concepto con el material y un ejemplo resuelto), *Muéstrame* (elegir
   entre tres) y *¿Qué es?* (responder).
3. **Ciclo de trabajo**: rondas de 8 ejercicios que van de lo concreto a lo abstracto:
   - 🧱 **Material**: el material a la vista; en algunos conceptos se arma (poner
     objetos en la canasta, armar el número con perlas, pintar partes del círculo,
     repartir de a uno en los platos).
   - ✏️ **Dibujo**: el dibujo del material, sin ayudas.
   - 🔢 **Números**: solo números y símbolos (el material se puede pedir con «Ver el material»).
   Tres aciertos seguidos suben de fase; en números suben de nivel (★★★).
4. **Dominar**: en números, en el nivel más alto, con al menos 3 ejercicios ahí y 7
   de los últimos 8 bien (en inicial, 5 de 5). Hay una celebración y el dibujo del
   concepto brilla en la escena.
5. **Reflexión**: al terminar la ronda: ¿cómo te sentiste?, ¿fue fácil, justo o
   difícil?, «hoy aprendí…» y una afirmación para repetir («Soy capaz de aprender
   cosas difíciles», «Equivocarme me ayuda a aprender»…).

## Errores que ayudan

- **Control del error**: ante una respuesta incorrecta, ánimo y una pista, y otra
  oportunidad. Si se corrige, cuenta como «lo corregiste tú».
- **Juntos, paso a paso**: si vuelve a fallar, se explica el razonamiento con el
  material y la respuesta, con el botón **🤖 Explícamelo de otra forma**.
- **Refuerzo**: con 3 errores entre los últimos 5, el juego vuelve una fase atrás
  (hacia el material) y un nivel abajo, y muestra el concepto otra vez con un ejemplo
  resuelto. En el panel para adultos aparece en «Necesita refuerzo» si hubo 2
  refuerzos o menos del 60 % de aciertos.

## Explicación con IA

`POST /api/mate/explica` con `{c, n, f, seed, resp}`: el servidor genera **el mismo
ejercicio** con el motor (no confía en el texto del navegador) y pide a la IA
configurada en la plataforma una explicación cálida y paso a paso, un ejemplo concreto
con el material y una pregunta parecida para probar. Se guarda en `ia_explicaciones`
(un mismo ejercicio y respuesta no se vuelve a pedir). Requiere entrar con Google y
tiene un límite diario por cuenta: `MATE_IA_DIA` (20 por defecto). Con `IA_PRUEBA=1`
(desarrollo) se simula. Sin IA, se muestra la idea clave del concepto.

## Perfiles, avance y privacidad

- Cada perfil tiene **un apodo**, un animalito y una etapa (se puede cambiar cuando
  se quiera). Hasta 8 por dispositivo o cuenta.
- El avance se guarda en el dispositivo (`localStorage`). Con una cuenta de Google se
  copia en `mate_perfiles` (`GET/PUT/DELETE /api/mate/perfiles[/:id]`) y gana la
  versión más nueva; el servidor solo guarda los campos que usa el juego.
- **Avance visible**: la escena de cada etapa (granja, jardín, bosque, mar, ciudad,
  montaña, cielo, espacio y estrellas) muestra el dibujo de cada concepto en gris, más
  grande a medida que se avanza y brillante al dominarlo; la escena se llena de
  detalles con el avance. Hay insignias, días seguidos y la fase (🧱 ✏️ 🔢) y el nivel
  de cada concepto.

## Para adultos

El botón 👪 abre el panel (con una suma sencilla para que no entren los más chicos):
conceptos dominados por etapa, ejercicios, aciertos y días seguidos; lo que necesita
refuerzo con la actividad para hacer en casa; los conceptos en camino; sus
reflexiones; consejos para acompañar (elogiar el esfuerzo, preguntar «¿cómo lo
pensaste?», sesiones cortas); editar el perfil, activar la lectura en voz alta y
borrar el perfil.

## Pantalla completa y Lumi

El botón ⛶ (arriba en cada pantalla) pone el juego en pantalla completa; en iPhone,
donde el navegador no lo permite, el juego ocupa toda la ventana igual. Se sale con el
mismo botón o con Esc. **Lumi**, la mascota, saluda, sugiere el concepto, piensa con
el niño cuando hay un error, anima en el refuerzo y celebra al dominar. Es la misma
mascota del curso de [Inglés](INGLES.md), que usa los mismos perfiles: arriba se
cambia entre 🧮 Matemática, 🔤 Inglés y 🔬 [Ciencias](CIENCIAS.md).

## Voz

🔊 lee las preguntas, las pistas y las afirmaciones con la voz del sistema en español
(Web Speech API). Se activa o desactiva para todo el juego.

## Tablas

`mate_perfiles` y `mate_ia` (ver `schema.sql`, `instalar.sql` y SETUP.md).
