/* ===========================================================
   THE FINAL TEST · juegos · núcleo común
   Registro de juegos y utilidades que usan por igual el navegador y
   el servidor (el Durable Object de salas). Cada juego es un módulo de
   reglas puras que se registra aquí:

     AxJuegos.registra("gomoku", {
       nombre, grupo, min, max, adultos, bots, acceso, opciones,
       inicia(E, r)                    → prepara E.g (estado del juego)
       accion(E, id, msg, ahora, r)    → aplica una jugada; devuelve {error} si no vale
       tick(E, ahora, r)               → vence plazos; true si cambió algo
       bot(E, id, r)                   → jugada de un bot, o null si no le toca
       vista(E, quien)                 → lo que ve un jugador o la pantalla ("pantalla")
       resultado(E)                    → [{id, puesto, puntos}] al terminar
     })

   E es el estado de la sala: { juego, opciones, jugadores:[{id,nombre,bot}],
   fase, g }. Nada de esto toca window ni document.
   =========================================================== */
(function(G){
"use strict";
var J=G.AxJuegos||{}, REG=J.REG||{};

function registra(tipo,def){ def.tipo=tipo; REG[tipo]=def; }
function def(tipo){ return REG[tipo]||null; }

/* ---------- azar ---------- */
function semilla(txt){ var h=0x811c9dc5,i; txt=String(txt); for(i=0;i<txt.length;i++){h^=txt.charCodeAt(i);h=Math.imul(h,0x01000193);} return h>>>0; }
function rng(s){var a=s>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};}
function baraja(arr,r){for(var i=arr.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=arr[i];arr[i]=arr[j];arr[j]=t;}return arr;}
function entre(r,a,b){return a+Math.floor(r()*(b-a+1));}

/* ---------- utilidades de jugadores ---------- */
function humanos(E){return E.jugadores.filter(function(j){return !j.bot;});}
function jugador(E,id){for(var i=0;i<E.jugadores.length;i++)if(E.jugadores[i].id===id)return E.jugadores[i];return null;}
function nombre(E,id){var j=jugador(E,id);return j?j.nombre:"?";}
/* puestos a partir de puntos: más es mejor salvo que se indique lo contrario */
function puestos(lista,menosEsMejor){
  var o=lista.slice().sort(function(a,b){return menosEsMejor?a.puntos-b.puntos:b.puntos-a.puntos;}), p=0, prev=null;
  o.forEach(function(x,i){ if(prev===null||x.puntos!==prev)p=i+1; x.puesto=p; prev=x.puntos; });
  return o;
}
function limpia(s,max){return String(s==null?"":s).replace(/\s+/g," ").trim().slice(0,max||60);}

G.AxJuegos={REG:REG,registra:registra,def:def,semilla:semilla,rng:rng,baraja:baraja,entre:entre,
  humanos:humanos,jugador:jugador,nombre:nombre,puestos:puestos,limpia:limpia,
  /* grupos del catálogo, en orden */
  GRUPOS:[["estrategia","Estrategia 1 contra 1"],["grupo","En grupo"],["vivo","En vivo para eventos"],["especial","Sorteos y subastas"],["adultos","Solo adultos"]]};
})(typeof globalThis!=="undefined"?globalThis:this);
