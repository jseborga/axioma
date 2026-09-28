/* ===========================================================
   Ampliaciones del banco de trivia, por áreas
   Cada línea: [nivel, área, pregunta, correcta, otra, otra, otra, dato].
   El dato se muestra como «¿Sabías que…?» al revelar la respuesta.
   No cambies el texto de una pregunta publicada: su identificador sale
   del texto (y es lo que evita repetirla durante 60 días).
   =========================================================== */
import boliviaLatam from "./bolivia-latam.js";
import geografiaHistoria from "./geografia-historia.js";
import cienciaNaturaleza from "./ciencia-naturaleza.js";
import culturaLetras from "./cultura-letras.js";
import deporteCineMusica from "./deporte-cine-musica.js";
import tecnologiaEconomia from "./tecnologia-economia.js";

export default [].concat(boliviaLatam,geografiaHistoria,cienciaNaturaleza,culturaLetras,deporteCineMusica,tecnologiaEconomia);
