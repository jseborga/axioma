/* ===========================================================
   THE FINAL TEST · reglas de los juegos en el servidor
   Las mismas que usa el navegador (public/juegos/): se importan aquí
   para que el Durable Object de salas las aplique.
   =========================================================== */
import "../public/juegos/nucleo.js";
import "../public/juegos/gomoku.js";
import "../public/juegos/hex.js";
import "../public/juegos/cuantico.js";
import "../public/juegos/dudo.js";
import "../public/juegos/sexta.js";
import "../public/juegos/verdades.js";
import "../public/juegos/trivia.js";
import "../public/juegos/hype.js";
import "../public/juegos/carrera.js";
import "../public/juegos/sorteo.js";
import "../public/juegos/subasta.js";
import "../public/juegos/paranoia.js";
import "../public/juegos/yonunca.js";

/* preguntas y operaciones del servidor para los juegos en vivo */
import { secuencia, matematica, CATEGORIAS } from "./preguntas.js";
globalThis.AxJuegos.preguntasGenerales=function(n,nivel,seed){
  return secuencia(seed,nivel,true,n).map(function(q){return {q:q.q,o:q.o,c:q.c,tema:CATEGORIAS[q.cat]||""};});
};
globalThis.AxJuegos.operacion=function(nivel,r){var q=matematica(nivel,r);return {q:q.q.replace(/^¿Cuánto es /,"").replace(/\?$/,""),res:Number(q.o[q.c])};};
