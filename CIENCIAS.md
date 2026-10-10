# Ciencias: naturales, física y química

La tercera materia del segmento **Aprender**, junto a [Matemática Montessori](MATE.md) e
[Inglés](INGLES.md): usa los mismos perfiles y arriba se cambia de materia
(🧮 · 🔤 · 🔬). Se abre desde el menú (**Ciencias: naturales, física y química**) o desde la
tarjeta del inicio. Funciona en móvil, tablet y computadora, con pantalla completa, Lumi y
lectura en voz alta.

## El método

Como en Montessori, primero la idea con algo que se ve o se toca, después la práctica y al
final el desafío; y cada quien **elige la unidad** que quiere descubrir. El nivel se sugiere
según el curso del perfil (inicial y 1.º → Explorar; 2.º a 6.º de primaria → Descubrir;
secundaria → Biología y Tierra) y se cambia con las pestañas.

Cada unidad tiene un camino de cuatro lecciones, que se abren en orden:

1. **💡 Descubre**: las ideas clave (con dibujo y 🔊), cada una seguida de preguntas sencillas.
2. **✏️ Practica**: ejercicios variados; primero vuelven los que costaron.
3. **🧪 Laboratorio**: el **experimento para casa** (materiales, pasos, una pregunta y la
   advertencia de seguridad cuando hace falta), el **laboratorio interactivo** si la unidad
   lo tiene y ejercicios de clasificar, ordenar y unir.
4. **🏆 Reto**: de todo.

Se elige y se toca **Comprobar**. Si es correcto, Lumi celebra y explica por qué; si no,
muestra la respuesta con su explicación, ofrece **🤖 Explícamelo** (IA, con cuenta de Google y
el mismo límite diario que Matemática) y el ejercicio vuelve al final. Lo fallado queda en
**💪 Repasar lo que me costó**. Al terminar: estrellas, XP, meta del día (20 XP), racha y
«¿cómo te sentiste?».

## Niveles y unidades

| Nivel | Unidades |
|---|---|
| 🔍 **Explorar** (inicial a 2.º de primaria) | Seres vivos · Mi cuerpo y los sentidos · Las plantas · Los animales · El agua y el tiempo · Sol, luna y estrellas |
| 🔭 **Descubrir** (3.º a 6.º de primaria) | Estados de la materia · El ciclo del agua · Ecosistemas y cadenas alimentarias · El cuerpo humano por dentro · El sistema solar · Fuerzas y máquinas simples · Electricidad y magnetismo · Cuidemos el planeta |
| 🧬 **Biología y Tierra** (secundaria) | La célula · Clasificación de los seres vivos · Herencia y ADN · La Tierra por dentro · Nutrición y salud |
| ⚡ **Física** (secundaria) | Movimiento · Fuerzas y leyes de Newton · Energía y trabajo · Presión, densidad y flotación · Electricidad: ley de Ohm · Ondas: sonido y luz |
| ⚗️ **Química** (secundaria) | La materia y las mezclas · El átomo · La tabla periódica · Enlaces y reacciones químicas · Ácidos y bases |

Hay ejemplos de Bolivia (el altiplano y la Amazonía, el lago Titicaca, el agua de los nevados,
los Andes, la quinua, el litio de Uyuni, la plata de Potosí, el teleférico, el agua que hierve a
88 °C en La Paz…).

## Ejercicios

- **Elegir** y **verdadero o falso**.
- **¿Qué parte señala la flecha?** en diagramas: planta, cuerpo humano, célula vegetal, ciclo del
  agua, circuito eléctrico, capas de la Tierra y átomo.
- **Clasificar** tarjetas en dos o tres cajas (vivo/no vivo, sólido/líquido/gas, conductor/aislante,
  renovable/no renovable, vertebrado/invertebrado, ácido/neutro/base…).
- **Ordenar** pasos (ciclos de vida, ciclo del agua, planetas, cadena alimentaria, digestión, pH…).
- **Unir parejas** (sentidos y órganos, máquinas simples, leyes de Newton, símbolos químicos…).
- **Cálculos** con teclado, generados al azar con su fórmula y sus pasos: velocidad, distancia,
  tiempo, aceleración, m/s ↔ km/h, fuerza, masa, peso, trabajo, energía cinética y potencial,
  potencia, densidad, presión, ley de Ohm, potencia eléctrica, ondas y período; neutrones,
  electrones de átomos e iones, átomos en una fórmula, masa molar y balanceo de ecuaciones.
- **Laboratorios interactivos**: el termómetro que congela o hace hervir el agua, el circuito
  donde se prueban materiales y se cierra el interruptor, el auto cuya velocidad sale de la
  distancia y el tiempo, y el indicador de repollo morado con la escala de pH.

## Para adultos

El panel 👪 (el mismo de Matemática) muestra las lecciones y unidades hechas por nivel, las
estrellas, lo que más costó y los experimentos de las unidades trabajadas para hacerlos juntos.

## Datos

El contenido está en `public/ciencias-datos.js` (fácil de ampliar: cada ejercicio es una línea),
el motor en `public/ciencias-motor.js`, los dibujos en `public/ciencias-dibujos.js` y la pantalla en
`public/ciencias-ui.js`. El avance va en el perfil (`perfil.cie`), en el dispositivo y, con cuenta,
en `mate_perfiles`; el servidor solo guarda los campos que usa el curso. No hacen falta tablas
nuevas. La explicación con IA (`POST /api/mate/explica` con `materia: "ciencias"`) vuelve a armar el
mismo ejercicio en el servidor con la misma semilla.
