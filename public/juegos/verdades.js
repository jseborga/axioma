/* ===========================================================
   Dos verdades y una mentira · reglas
   Cada jugador escribe en secreto tres frases sobre sí mismo y marca
   cuál es mentira. Después, una a una, las frases de cada autor salen
   (en la pantalla grande y en los teléfonos) en orden al azar y el resto
   vota cuál es la mentira. Acertar da 1 punto; al autor, cada persona
   que engaña le da 1 punto.
   =========================================================== */
(function(G){
"use strict";
var J=G.AxJuegos, REVELA_MS=7000;

function siguiente(E,ahora,r){
  var g=E.g;
  g.idx++;
  if(g.idx>=g.autores.length){g.fin=true;g.fase="fin";g.hasta=null;return;}
  var a=g.autores[g.idx], f=g.frases[a];
  g.fase="vota"; g.votos={}; g.perm=J.baraja([0,1,2],r); g.hasta=ahora+E.opciones.votar*1000;
  g.actual={autor:a,frases:g.perm.map(function(i){return f.t[i];})};
}
function revela(E,ahora){
  var g=E.g, a=g.actual.autor, mentira=g.perm.indexOf(g.frases[a].mentira), engano=0;
  Object.keys(g.votos).forEach(function(id){ if(g.votos[id]===mentira)g.puntos[id]++; else engano++; });
  g.puntos[a]+=engano;
  g.fase="revela"; g.revela={mentira:mentira,votos:g.votos,engano:engano}; g.hasta=ahora+REVELA_MS;
}

J.registra("verdades",{
  nombre:"Dos verdades y una mentira",grupo:"grupo",min:3,max:30,bots:false,acceso:"libre",
  normaliza:function(o){var e=parseInt(o.escribir,10),v=parseInt(o.votar,10);
    return {escribir:[60,120,180].indexOf(e)>=0?e:120,votar:[15,25,40].indexOf(v)>=0?v:25};},
  inicia:function(E,r,ahora){
    E.g={fase:"escribe",frases:{},puntos:{},autores:[],idx:-1,hasta:ahora+E.opciones.escribir*1000,fin:false};
    E.jugadores.forEach(function(j){E.g.puntos[j.id]=0;});
  },
  accion:function(E,id,m,ahora,r){
    var g=E.g; if(g.fin)return {error:"finished"}; r=r||Math.random;
    if(m.tipo==="frases"){
      if(g.fase!=="escribe")return {error:"wait"};
      var t=(Array.isArray(m.frases)?m.frases:[]).map(function(x){return J.limpia(x,140);});
      var k=parseInt(m.mentira,10);
      if(t.length!==3||t.some(function(x){return x.length<3;})||!(k>=0&&k<=2))return {error:"bad_move"};
      g.frases[id]={t:t,mentira:k};
      if(E.jugadores.every(function(j){return g.frases[j.id];}))this.empieza(E,ahora,r);
      return;
    }
    if(m.tipo==="voto"){
      if(g.fase!=="vota")return {error:"wait"};
      if(id===g.actual.autor)return {error:"own_statements"};
      var v=parseInt(m.i,10); if(!(v>=0&&v<=2))return {error:"bad_move"};
      g.votos[id]=v;
      var faltan=E.jugadores.filter(function(j){return j.id!==g.actual.autor&&g.votos[j.id]==null&&j.conectado!==false;});
      if(!faltan.length)revela(E,ahora);
      return;
    }
    return {error:"bad_move"};
  },
  empieza:function(E,ahora,r){var g=E.g; g.autores=J.baraja(Object.keys(g.frases),r);
    if(g.autores.length<2){g.fin=true;g.fase="fin";return;} siguiente(E,ahora,r);},
  une:function(E,j){E.g.puntos[j.id]=0;},
  tick:function(E,ahora,r){
    var g=E.g; if(g.fin||!g.hasta||ahora<g.hasta)return false;
    if(g.fase==="escribe"){this.empieza(E,ahora,r);return true;}
    if(g.fase==="vota"){revela(E,ahora);return true;}
    if(g.fase==="revela"){siguiente(E,ahora,r);return true;}
    return false;
  },
  proximo:function(E){return E.g.hasta;},
  vista:function(E,quien){
    var g=E.g, v={fase:g.fase,hasta:g.hasta,puntos:g.puntos,fin:g.fin,n:g.autores.length,i:g.idx,
      listos:Object.keys(g.frases)};
    if(g.fase==="escribe"&&g.frases[quien])v.mias=g.frases[quien];
    if(g.fase==="vota"||g.fase==="revela"){
      v.autor=g.actual.autor; v.frases=g.actual.frases; v.votaron=Object.keys(g.votos).length;
      v.faltan=E.jugadores.filter(function(j){return j.id!==g.actual.autor;}).length;
      if(g.votos[quien]!=null)v.mivoto=g.votos[quien];
      if(g.fase==="revela"){v.revela=g.revela; v.recuento=[0,1,2].map(function(i){return Object.keys(g.votos).filter(function(x){return g.votos[x]===i;}).length;});}
    }
    return v;
  },
  resultado:function(E){var g=E.g;
    return J.puestos(E.jugadores.map(function(j){return {id:j.id,puntos:g.puntos[j.id]||0,unidad:"puntos"};}),false);}
});
})(typeof globalThis!=="undefined"?globalThis:this);
