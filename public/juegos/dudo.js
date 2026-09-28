/* ===========================================================
   Dudo (dados mentirosos) · reglas
   Cada jugador tiene cinco dados ocultos. Por turnos se apuesta cuántos
   dados de una cara hay en TODA la mesa, siempre subiendo la apuesta,
   hasta que alguien dice «¡Dudo!». Se levantan los cubiletes: si hay al
   menos los que se apostaron, pierde un dado quien dudó; si no, quien
   apostó. Los unos son comodines (cuentan como cualquier cara) salvo que
   se apueste a los propios unos. Gana el último que conserve dados.
   Los dados de cada jugador no salen del servidor hasta que se levantan.
   =========================================================== */
(function(G){
"use strict";
var J=G.AxJuegos, REVELA_MS=6500;

function tira(r,n){var d=[];for(var i=0;i<n;i++)d.push(1+Math.floor(r()*6));return d.sort();}
function vivos(g){return g.orden.filter(function(id){return g.cuantos[id]>0;});}
function total(g){return vivos(g).reduce(function(s,id){return s+g.cuantos[id];},0);}
/* ¿la apuesta nueva supera a la anterior? */
function sube(p,q,c,comodines){
  if(!p)return true;
  if(!comodines)return q>p.q||(q===p.q&&c>p.c);
  if(p.c!==1&&c!==1)return q>p.q||(q===p.q&&c>p.c);
  if(p.c!==1&&c===1)return q>=Math.ceil(p.q/2);
  if(p.c===1&&c===1)return q>p.q;
  return q>=2*p.q+1;
}
function cuenta(g,c,comodines){var n=0;vivos(g).forEach(function(id){g.dados[id].forEach(function(v){if(v===c||(comodines&&c!==1&&v===1))n++;});});return n;}
function siguiente(g,id){var v=vivos(g), i=g.orden.indexOf(id);
  for(var k=1;k<=g.orden.length;k++){var x=g.orden[(i+k)%g.orden.length]; if(g.cuantos[x]>0)return x;} return v[0];}
function nuevaRonda(E,r,ahora,empieza){
  var g=E.g; g.ronda++; g.apuesta=null; g.revela=null; g.hist=[];
  vivos(g).forEach(function(id){g.dados[id]=tira(r,g.cuantos[id]);});
  g.turno=g.cuantos[empieza]>0?empieza:siguiente(g,empieza);
  g.hasta=ahora+E.opciones.tiempo*1000;
}
/* el bot estima cuántos hay: los suyos seguros más la probabilidad del resto */
function estima(g,id,c,comodines){
  var mios=g.dados[id].filter(function(v){return v===c||(comodines&&c!==1&&v===1);}).length;
  return mios+(total(g)-g.dados[id].length)*(comodines&&c!==1?1/3:1/6);
}

J.registra("dudo",{
  nombre:"Dudo",grupo:"grupo",min:2,max:6,bots:true,acceso:"libre",pausaBot:1600,
  normaliza:function(o){var t=parseInt(o.tiempo,10);return {tiempo:[20,45,90].indexOf(t)>=0?t:45,comodines:o.comodines!==false&&o.comodines!=="0"};},
  inicia:function(E,r,ahora){
    var orden=J.baraja(E.jugadores.map(function(j){return j.id;}),r), cuantos={};
    orden.forEach(function(id){cuantos[id]=5;});
    E.g={orden:orden,cuantos:cuantos,dados:{},ronda:0,apuesta:null,revela:null,elim:[],fin:false,hist:[]};
    nuevaRonda(E,r,ahora,orden[0]);
  },
  turno:function(E){var g=E.g;return g.fin||g.revela?null:g.turno;},
  accion:function(E,id,m,ahora,r){
    var g=E.g, com=E.opciones.comodines;
    if(g.fin)return {error:"finished"};
    if(g.revela)return {error:"wait"};
    if(g.turno!==id)return {error:"not_your_turn"};
    if(m.tipo==="apuesta"){
      var q=parseInt(m.q,10), c=parseInt(m.c,10);
      if(!(c>=1&&c<=6&&q>=1&&q<=total(g)))return {error:"bad_move"};
      if(!sube(g.apuesta,q,c,com))return {error:"bid_too_low"};
      g.apuesta={q:q,c:c,id:id}; g.hist.push({id:id,q:q,c:c});
      g.turno=siguiente(g,id); g.hasta=ahora+E.opciones.tiempo*1000; return;
    }
    if(m.tipo==="dudo"){
      if(!g.apuesta)return {error:"bad_move"};
      var hay=cuenta(g,g.apuesta.c,com), pierde=hay>=g.apuesta.q?id:g.apuesta.id, todos={};
      vivos(g).forEach(function(x){todos[x]=g.dados[x].slice();});
      g.cuantos[pierde]--; if(g.cuantos[pierde]===0)g.elim.push(pierde);
      g.revela={apuesta:g.apuesta,dudo:id,hay:hay,pierde:pierde,dados:todos,comodines:com};
      g.hasta=ahora+REVELA_MS;
      if(vivos(g).length<=1){g.fin=true;g.gana=vivos(g)[0];}
      return;
    }
    return {error:"bad_move"};
  },
  tick:function(E,ahora,r){
    var g=E.g; if(g.fin||!g.hasta||ahora<g.hasta)return false;
    if(g.revela){nuevaRonda(E,r,ahora,g.revela.pierde);return true;}
    /* se acabó el tiempo del turno: juega el automático por él */
    var mv=this.bot(E,g.turno,r,ahora,true); if(mv)this.accion(E,g.turno,mv,ahora,r); return true;
  },
  bot:function(E,id,r,ahora,forzar){
    var g=E.g, com=E.opciones.comodines; if(g.fin||g.revela||g.turno!==id)return null;
    var p=g.apuesta;
    if(p&&p.q>estima(g,id,p.c,com)+0.7)return {tipo:"dudo"};
    /* sube por la cara de la que más tiene (sin contar los unos como apuesta propia) */
    var mejor=null;
    for(var c=2;c<=6;c++){
      var e=estima(g,id,c,com), q=1; while(!sube(p,q,c,com))q++;
      if(!mejor||e-q>mejor.m)mejor={q:q,c:c,m:e-q};
    }
    if(p&&mejor.m<-1.2)return {tipo:"dudo"};
    return {tipo:"apuesta",q:mejor.q,c:mejor.c};
  },
  proximo:function(E){return E.g.hasta;},
  vista:function(E,quien){
    var g=E.g, v={orden:g.orden,cuantos:g.cuantos,total:total(g),apuesta:g.apuesta,turno:this.turno(E),hasta:g.hasta,ronda:g.ronda,
      revela:g.revela,fin:g.fin,gana:g.gana||null,hist:g.hist.slice(-8),comodines:E.opciones.comodines};
    if(quien!=="pantalla"&&g.dados[quien]&&g.cuantos[quien]>0)v.mios=g.dados[quien];
    return v;
  },
  resultado:function(E){var g=E.g, orden=[g.gana].concat(g.elim.slice().reverse()).filter(Boolean);
    g.orden.forEach(function(id){if(orden.indexOf(id)<0)orden.push(id);});
    return orden.map(function(id,i){return {id:id,puesto:i+1,puntos:g.cuantos[id],unidad:"dados"};});},
  sube:sube
});
})(typeof globalThis!=="undefined"?globalThis:this);
