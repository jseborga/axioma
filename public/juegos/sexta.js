/* ===========================================================
   La sexta carta · reglas (inspiradas en un clásico de mesa)
   104 cartas numeradas; cada una lleva cabezas de penalización (1 a 7).
   En cada turno todos eligen en secreto una carta de su mano; se
   revelan a la vez y se colocan de menor a mayor en la fila cuyo final
   es el número más alto por debajo de la carta. Quien pone la sexta
   carta de una fila se lleva las cinco anteriores (sus cabezas cuentan
   en contra) y su carta empieza la fila. Si tu carta es menor que todos
   los finales, eliges qué fila te llevas. Gana quien menos cabezas junte.
   =========================================================== */
(function(G){
"use strict";
var J=G.AxJuegos;

function cabezas(n){return n===55?7:n%11===0?5:n%10===0?3:n%5===0?2:1;}
function suma(f){return f.reduce(function(s,n){return s+cabezas(n);},0);}
function destino(filas,carta){
  var mejor=-1, fin=-1;
  filas.forEach(function(f,i){var u=f[f.length-1]; if(u<carta&&u>fin){fin=u;mejor=i;}});
  return mejor;
}
function reparte(E,r,ahora){
  var g=E.g, mazo=[]; for(var n=1;n<=104;n++)mazo.push(n); J.baraja(mazo,r);
  g.manos={}; g.orden.forEach(function(id){g.manos[id]=mazo.splice(0,10).sort(function(a,b){return a-b;});});
  g.filas=[[mazo.pop()],[mazo.pop()],[mazo.pop()],[mazo.pop()]];
  g.ronda++; g.turnoN=0; empiezaTurno(E,ahora);
}
function empiezaTurno(E,ahora){var g=E.g; g.elegidas={}; g.fase="elige"; g.pendiente=null; g.turnoN++; g.hasta=ahora+E.opciones.tiempo*1000;}
/* coloca las cartas elegidas de menor a mayor; si alguien debe elegir fila, se para */
function coloca(E,ahora){
  var g=E.g;
  while(g.cola.length){
    var x=g.cola[0], i=destino(g.filas,x.carta);
    if(i<0){ g.fase="fila"; g.pendiente={id:x.id,carta:x.carta}; g.hasta=ahora+E.opciones.tiempo*1000; return; }
    g.cola.shift();
    if(g.filas[i].length>=5){ var s=suma(g.filas[i]); g.puntos[x.id]+=s; g.ultima.push({id:x.id,carta:x.carta,fila:i,lleva:s}); g.filas[i]=[x.carta]; }
    else { g.filas[i].push(x.carta); g.ultima.push({id:x.id,carta:x.carta,fila:i,lleva:0}); }
  }
  /* turno resuelto: siguiente, nueva ronda o fin */
  if(g.manos[g.orden[0]].length)return empiezaTurno(E,ahora);
  if(g.ronda<E.opciones.rondas)return reparte(E,E.r||Math.random,ahora);
  g.fin=true; g.fase="fin"; g.hasta=null;
}
function tomaFila(E,id,i,ahora){
  var g=E.g, x=g.cola.shift(), s=suma(g.filas[i]);
  g.puntos[id]+=s; g.ultima.push({id:id,carta:x.carta,fila:i,lleva:s,elige:true}); g.filas[i]=[x.carta];
  g.fase="coloca"; g.pendiente=null; coloca(E,ahora);
}
function filaMenor(g){var m=0;for(var i=1;i<4;i++)if(suma(g.filas[i])<suma(g.filas[m]))m=i;return m;}

J.registra("sexta",{
  nombre:"La sexta carta",grupo:"grupo",min:2,max:10,bots:true,acceso:"libre",pausaBot:700,
  normaliza:function(o){var t=parseInt(o.tiempo,10),r=parseInt(o.rondas,10);return {tiempo:[20,30,60].indexOf(t)>=0?t:30,rondas:[1,2,3].indexOf(r)>=0?r:1};},
  inicia:function(E,r,ahora){
    E.g={orden:E.jugadores.map(function(j){return j.id;}),puntos:{},ronda:0,fin:false,ultima:[],cola:[]};
    E.g.orden.forEach(function(id){E.g.puntos[id]=0;});
    E.r=r; reparte(E,r,ahora); delete E.r;
  },
  accion:function(E,id,m,ahora,r){
    var g=E.g; if(g.fin)return {error:"finished"};
    if(m.tipo==="elige"){
      if(g.fase!=="elige")return {error:"wait"};
      var c=parseInt(m.carta,10), mano=g.manos[id];
      if(!mano||mano.indexOf(c)<0)return {error:"bad_move"};
      g.elegidas[id]=c;
      if(g.orden.every(function(x){return g.elegidas[x]!=null;}))this.resuelve(E,ahora,r);
      return;
    }
    if(m.tipo==="fila"){
      if(g.fase!=="fila"||!g.pendiente||g.pendiente.id!==id)return {error:"not_your_turn"};
      var i=parseInt(m.fila,10); if(!(i>=0&&i<4))return {error:"bad_move"};
      E.r=r; tomaFila(E,id,i,ahora); delete E.r; return;
    }
    return {error:"bad_move"};
  },
  resuelve:function(E,ahora,r){
    var g=E.g;
    g.cola=g.orden.map(function(id){var c=g.elegidas[id];g.manos[id].splice(g.manos[id].indexOf(c),1);return {id:id,carta:c};})
      .sort(function(a,b){return a.carta-b.carta;});
    g.reveladas=g.cola.map(function(x){return {id:x.id,carta:x.carta};});
    g.ultima=[]; g.fase="coloca"; E.r=r; coloca(E,ahora); delete E.r;
  },
  tick:function(E,ahora,r){
    var g=E.g; if(g.fin||!g.hasta||ahora<g.hasta)return false;
    if(g.fase==="elige"){ /* quien no eligió juega su carta más baja */
      g.orden.forEach(function(id){if(g.elegidas[id]==null)g.elegidas[id]=g.manos[id][0];}); this.resuelve(E,ahora,r); return true; }
    if(g.fase==="fila"){E.r=r; tomaFila(E,g.pendiente.id,filaMenor(g),ahora); delete E.r; return true;}
    return false;
  },
  bot:function(E,id,r){
    var g=E.g; if(g.fin)return null;
    if(g.fase==="fila")return g.pendiente&&g.pendiente.id===id?{tipo:"fila",fila:filaMenor(g)}:null;
    if(g.fase!=="elige"||g.elegidas[id]!=null)return null;
    /* la carta con menos riesgo: evita ser la sexta y las filas cargadas */
    var mejor=null;
    g.manos[id].forEach(function(c){
      var i=destino(g.filas,c), riesgo;
      if(i<0)riesgo=suma(g.filas[filaMenor(g)])+0.5;
      else riesgo=g.filas[i].length>=5?suma(g.filas[i]):g.filas[i].length===4?1.5:(c-g.filas[i][g.filas[i].length-1])/40;
      riesgo+=r()*0.3;
      if(!mejor||riesgo<mejor.r)mejor={c:c,r:riesgo};
    });
    return {tipo:"elige",carta:mejor.c};
  },
  proximo:function(E){return E.g.hasta;},
  vista:function(E,quien){
    var g=E.g, v={orden:g.orden,filas:g.filas,cabezas:g.filas.map(suma),puntos:g.puntos,fase:g.fase,pendiente:g.pendiente,hasta:g.hasta,
      ronda:g.ronda,rondas:E.opciones.rondas,turno:g.turnoN,listos:g.orden.filter(function(id){return g.elegidas&&g.elegidas[id]!=null;}),
      reveladas:g.reveladas||null,ultima:g.ultima,fin:g.fin};
    if(quien!=="pantalla"&&g.manos[quien]){v.mano=g.manos[quien];v.elegida=g.elegidas?g.elegidas[quien]:null;}
    return v;
  },
  resultado:function(E){var g=E.g;
    return J.puestos(g.orden.map(function(id){return {id:id,puntos:g.puntos[id],unidad:"cabezas"};}),true);},
  cabezas:cabezas
});
})(typeof globalThis!=="undefined"?globalThis:this);
