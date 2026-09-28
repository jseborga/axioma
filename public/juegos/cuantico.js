/* ===========================================================
   Tres en raya cuántico · reglas (Allan Goff)
   Cada jugada pone una marca «fantasma» en DOS casillas a la vez: la
   jugada está en superposición. Las marcas enlazan casillas; cuando un
   enlace cierra un ciclo, el tablero se mide: el rival de quien cerró el
   ciclo elige en qué casilla se queda esa marca y el resto cae en
   cascada. Gana quien forme tres en raya con marcas ya medidas. Si los
   dos forman línea en la misma medición, gana la línea cuya marca más
   reciente es más antigua (1 punto) y el otro se lleva medio.
   =========================================================== */
(function(G){
"use strict";
var J=G.AxJuegos;
var LINEAS=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function libres(g){var o=[];for(var i=0;i<9;i++)if(!g.cas[i])o.push(i);return o;}
/* ¿la casilla a y la b ya están unidas por marcas sin medir? (unión-búsqueda) */
function unidas(g,a,b){
  var p=[0,1,2,3,4,5,6,7,8]; function f(x){while(p[x]!==x){p[x]=p[p[x]];x=p[x];}return x;}
  g.marcas.forEach(function(m){if(m.c==null&&m.a!==m.b)p[f(m.a)]=f(m.b);});
  return f(a)===f(b);
}
/* mide la marca k en la casilla s y deja caer en cascada las que compartían casilla */
function mide(g,k,s){
  var cola=[[k,s]];
  while(cola.length){var x=cola.shift(), m=g.marcas[x[0]-1], sq=x[1];
    if(m.c!=null||g.cas[sq])continue;
    m.c=sq; g.cas[sq]={k:m.k,j:m.j};
    g.marcas.forEach(function(o){ if(o.c==null&&(o.a===sq||o.b===sq))cola.push([o.k,o.a===sq?o.b:o.a]); });
  }
}
function lineas(g){
  var out=[];
  LINEAS.forEach(function(l){var a=g.cas[l[0]],b=g.cas[l[1]],c=g.cas[l[2]];
    if(a&&b&&c&&a.j===b.j&&b.j===c.j)out.push({j:a.j,cas:l,max:Math.max(a.k,b.k,c.k)});});
  return out;
}
function copia(g){return {marcas:g.marcas.map(function(m){return {k:m.k,j:m.j,a:m.a,b:m.b,c:m.c};}),cas:g.cas.map(function(c){return c?{k:c.k,j:c.j}:null;})};}
/* tras medir: ¿alguien ganó? */
function cierra(g){
  var ls=lineas(g);
  if(ls.length){
    var porJ=[Infinity,Infinity]; ls.forEach(function(l){porJ[l.j]=Math.min(porJ[l.j],l.max);});
    var gana=porJ[0]<porJ[1]?0:1;
    g.fin=true; g.lineas=ls; g.gan=g.orden[gana]; g.puntos=[0,0]; g.puntos[gana]=1;
    if(porJ[1-gana]<Infinity)g.puntos[1-gana]=0.5;
    g.motivo=porJ[1-gana]<Infinity?"doble":"linea";
    return true;
  }
  if(!libres(g).length){g.fin=true;g.motivo="empate";g.puntos=[0.5,0.5];return true;}
  return false;
}

J.registra("cuantico",{
  nombre:"Tres en raya cuántico",grupo:"estrategia",min:2,max:2,bots:true,acceso:"libre",
  normaliza:function(o){var t=parseInt(o.tiempo,10);return {tiempo:[0,30,60,120].indexOf(t)>=0?t:60,nivel:Math.max(0,Math.min(2,parseInt(o.nivel,10)||1))};},
  inicia:function(E,r,ahora){
    E.g={marcas:[],cas:new Array(9).fill(null),orden:E.jugadores.slice(0,2).map(function(j){return j.id;}),turno:0,colapso:null,
      fin:false,gan:null,puntos:null,lineas:null,motivo:null};
    this.reloj(E,ahora);},
  reloj:function(E,ahora){E.g.hasta=(!E.opciones.tiempo||E.opciones.local)?null:ahora+E.opciones.tiempo*1000;},
  turno:function(E){var g=E.g;return g.fin?null:g.orden[g.colapso?g.colapso.elige:g.turno];},
  accion:function(E,id,m,ahora){
    var g=E.g; if(g.fin)return {error:"finished"};
    if(this.turno(E)!==id)return {error:"not_your_turn"};
    if(g.colapso){
      var mk=g.marcas[g.colapso.k-1], s=parseInt(m.casilla,10);
      if(m.tipo!=="colapsa"||(s!==mk.a&&s!==mk.b))return {error:"bad_move"};
      mide(g,mk.k,s); g.colapso=null; g.medida={k:mk.k,s:s};
      if(!cierra(g))this.reloj(E,ahora);
      return;
    }
    var a=parseInt(m.a,10), b=parseInt(m.b,10), lib=libres(g);
    if(m.tipo!=="marca"||lib.indexOf(a)<0||lib.indexOf(b)<0)return {error:"bad_move"};
    if(a===b&&lib.length!==1)return {error:"bad_move"};
    if(a!==b&&lib.length===1)return {error:"bad_move"};
    var k=g.marcas.length+1, yo=g.turno;
    if(a===b){                         /* última casilla libre: marca clásica directa */
      g.marcas.push({k:k,j:yo,a:a,b:a,c:null}); mide(g,k,a); g.medida=null; cierra(g); return;
    }
    var ciclo=unidas(g,a,b);
    g.marcas.push({k:k,j:yo,a:a,b:b,c:null}); g.medida=null;
    g.turno=1-yo;
    if(ciclo)g.colapso={k:k,elige:1-yo};
    this.reloj(E,ahora);
  },
  tick:function(E,ahora){var g=E.g; if(g.fin||!g.hasta||ahora<g.hasta)return false;
    var pierde=g.colapso?g.colapso.elige:g.turno;
    g.fin=true;g.gan=g.orden[1-pierde];g.motivo="tiempo";g.puntos=[0,0];g.puntos[1-pierde]=1;return true;},
  bot:function(E,id,r){
    var g=E.g; if(g.fin||this.turno(E)!==id)return null;
    var yo=g.orden.indexOf(id);
    function gana(h){var ls=lineas(h),p=[Infinity,Infinity];ls.forEach(function(l){p[l.j]=Math.min(p[l.j],l.max);});
      return p[yo]<p[1-yo]?1:p[1-yo]<p[yo]?-1:0;}
    if(g.colapso){
      var mk=g.marcas[g.colapso.k-1], op=[mk.a,mk.b].map(function(s){var h=copia(g);mide(h,mk.k,s);return {s:s,v:gana(h)+r()*0.1};});
      op.sort(function(x,y){return y.v-x.v;}); return {tipo:"colapsa",casilla:op[0].s};
    }
    var lib=libres(g);
    if(lib.length===1)return {tipo:"marca",a:lib[0],b:lib[0]};
    var mejor=null, pm=-Infinity, pref=[4,0,2,6,8,1,3,5,7];
    for(var i=0;i<lib.length;i++)for(var j=i+1;j<lib.length;j++){
      var a=lib[i], b=lib[j], p=r()*(E.opciones.nivel===0?3:0.5)+(8-pref.indexOf(a))*0.05+(8-pref.indexOf(b))*0.05;
      if(unidas(g,a,b)){           /* cerraría un ciclo: el rival elige cómo medir */
        var h=copia(g), k=h.marcas.length+1; h.marcas.push({k:k,j:yo,a:a,b:b,c:null});
        var res=[a,b].map(function(s){var x=copia(h);mide(x,k,s);return gana(x);});
        p+=Math.min.apply(null,res)*(E.opciones.nivel===0?2:6);
      }
      if(p>pm){pm=p;mejor={tipo:"marca",a:a,b:b};}
    }
    return mejor;
  },
  vista:function(E){var g=E.g;
    return {marcas:g.marcas,cas:g.cas,orden:g.orden,turno:this.turno(E),colapso:g.colapso,medida:g.medida||null,fin:g.fin,gan:g.gan,
      puntos:g.puntos,lineas:g.lineas,motivo:g.motivo,hasta:g.hasta};},
  resultado:function(E){var g=E.g, p=g.puntos||[0,0];
    return g.orden.map(function(id,i){return {id:id,puntos:p[i],puesto:p[i]>=p[1-i]?1:2,
      nota:g.motivo==="empate"?"empate":g.motivo==="tiempo"&&g.gan===id?"gana por tiempo":g.motivo==="doble"?(p[i]===1?"su línea se midió antes":"medio punto"):""};});},
  mide:mide,unidas:unidas,lineas:lineas
});
})(typeof globalThis!=="undefined"?globalThis:this);
