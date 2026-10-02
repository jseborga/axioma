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
import "../public/juegos/caballos.js";
import "../public/juegos/sorteo.js";
import "../public/juegos/subasta.js";
import "../public/juegos/paranoia.js";
import "../public/juegos/yonunca.js";

/* preguntas y operaciones del servidor para los juegos en vivo */
import { fichas, materializa, limpiaAreas, matematica, CATEGORIAS } from "./preguntas.js";
/* preguntas del banco general: de las áreas elegidas y evitando las que ya
   usó el organizador en los últimos 60 días (evita, de la más antigua a la más reciente) */
globalThis.AxJuegos.preguntasGenerales=function(n,nivel,seed,areas,evita){
  var f=fichas(seed,nivel,true,n,{areas:limpiaAreas(areas||[]),evita:evita||[]});
  return materializa(seed,f).map(function(q){return {id:q.id||null,q:q.q,o:q.o,c:q.c,tema:CATEGORIAS[q.cat]||"",dato:q.dato||""};});
};
globalThis.AxJuegos.operacion=function(nivel,r){var q=matematica(nivel,r);return {q:q.q.replace(/^¿Cuánto es /,"").replace(/\?$/,""),res:Number(q.o[q.c])};};
/* preguntas de un solo nivel (1 fácil, 2 media, 3 difícil), para la carrera de caballos */
globalThis.AxJuegos.preguntasNivel=function(n,nivel,seed,areas,evita){
  var f=fichas(seed,nivel,false,n,{areas:limpiaAreas(areas||[]),evita:evita||[],fijo:true});
  return materializa(seed,f).map(function(q){return {id:q.id||null,q:q.q,o:q.o,c:q.c,nivel:q.nivel||nivel,tema:CATEGORIAS[q.cat]||"",dato:q.dato||""};});
};
