/* ===========================================================
   Hex · reglas
   Tablero en rombo de casillas hexagonales (7, 9 u 11 de lado). Rojo
   une el borde de arriba con el de abajo; azul, el de la izquierda con
   el de la derecha. No hay capturas ni empates: al llenarse el tablero
   siempre ha ganado alguien.
   =========================================================== */
(function(G){
"use strict";
var J=G.AxJuegos;
var VEC=[[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0]];

function vecinos(n,i){var r=Math.floor(i/n),c=i%n,o=[];
  for(var k=0;k<6;k++){var rr=r+VEC[k][0],cc=c+VEC[k][1];if(rr>=0&&rr<n&&cc>=0&&cc<n)o.push(rr*n+cc);}return o;}
/* ¿ha conectado el jugador v (1 arriba-abajo, 2 izquierda-derecha)? devuelve el camino */
function camino(t,n,v){
  var prev={}, cola=[], i;
  for(i=0;i<n;i++){var s=v===1?i:i*n; if(t[s]===v){prev[s]=-1;cola.push(s);}}
  while(cola.length){var x=cola.shift(), r=Math.floor(x/n), c=x%n;
    if((v===1&&r===n-1)||(v===2&&c===n-1)){var p=[];while(x!==-1){p.push(x);x=prev[x];}return p;}
    vecinos(n,x).forEach(function(y){if(t[y]===v&&prev[y]===undefined){prev[y]=x;cola.push(y);}});}
  return null;
}
/* cuántas casillas libres le faltan como mínimo al jugador v para conectar (0-1 BFS) */
function distancia(t,n,v){
  var D=new Array(n*n).fill(Infinity), dq=[], i;
  for(i=0;i<n;i++){var s=v===1?i:i*n; if(t[s]===3-v)continue; var w=t[s]===v?0:1; if(w<D[s]){D[s]=w;w?dq.push(s):dq.unshift(s);}}
  while(dq.length){var x=dq.shift();
    vecinos(n,x).forEach(function(y){if(t[y]===3-v)return; var w=t[y]===v?0:1;
      if(D[x]+w<D[y]){D[y]=D[x]+w;w?dq.push(y):dq.unshift(y);}});}
  var m=Infinity; for(i=0;i<n;i++){var e=v===1?(n-1)*n+i:i*n+n-1; if(D[e]<m)m=D[e];} return m;
}
/* jugada por distancias: acortar la propia y alargar la del rival */
function heuristica(t,n,v,r){
  var mejor=-1, puntos=-Infinity, c0=(n-1)/2;
  for(var i=0;i<t.length;i++){ if(t[i])continue;
    t[i]=v; var yo=distancia(t,n,v), el=distancia(t,n,3-v); t[i]=0;
    if(yo===0)return i;
    var rr=Math.floor(i/n), cc=i%n, p=(el-yo)*10-(Math.abs(rr-c0)+Math.abs(cc-c0))*0.3+(r?r()*0.5:0);
    if(p>puntos){puntos=p;mejor=i;}
  }
  return mejor;
}

J.registra("hex",{
  nombre:"Hex",grupo:"estrategia",min:2,max:2,bots:true,acceso:"libre",
  normaliza:function(o){var t=parseInt(o.tiempo,10),n=parseInt(o.tam,10);
    return {tam:[7,9,11].indexOf(n)>=0?n:9,tiempo:[0,30,60,120].indexOf(t)>=0?t:60,nivel:Math.max(0,Math.min(2,parseInt(o.nivel,10)||1))};},
  inicia:function(E,r,ahora){var n=E.opciones.tam||9;
    E.g={n:n,t:new Array(n*n).fill(0),orden:E.jugadores.slice(0,2).map(function(j){return j.id;}),turno:0,ult:-1,gan:null,camino:null,fin:false,motivo:null};
    this.reloj(E,ahora);},
  reloj:function(E,ahora){E.g.hasta=(!E.opciones.tiempo||E.opciones.local)?null:ahora+E.opciones.tiempo*1000;},
  turno:function(E){return E.g.fin?null:E.g.orden[E.g.turno];},
  accion:function(E,id,m,ahora){
    var g=E.g, i=parseInt(m.c,10);
    if(g.fin)return {error:"finished"};
    if(g.orden[g.turno]!==id)return {error:"not_your_turn"};
    if(!(i>=0&&i<g.t.length)||g.t[i])return {error:"bad_move"};
    g.t[i]=g.turno+1; g.ult=i;
    var p=camino(g.t,g.n,g.turno+1);
    if(p){g.fin=true;g.gan=id;g.camino=p;g.motivo="conecta";return;}
    g.turno=1-g.turno; this.reloj(E,ahora);
  },
  tick:function(E,ahora){var g=E.g; if(g.fin||!g.hasta||ahora<g.hasta)return false;
    g.fin=true;g.gan=g.orden[1-g.turno];g.motivo="tiempo";return true;},
  bot:function(E,id,r){var g=E.g; if(g.fin||g.orden[g.turno]!==id)return null; return {c:heuristica(g.t,g.n,g.turno+1,r)};},
  vista:function(E){var g=E.g;
    return {n:g.n,t:g.t,orden:g.orden,turno:g.fin?null:g.orden[g.turno],ult:g.ult,gan:g.gan,camino:g.camino,fin:g.fin,motivo:g.motivo,hasta:g.hasta};},
  resultado:function(E){var g=E.g;return g.orden.map(function(id){return {id:id,puesto:g.gan===id?1:2,puntos:g.gan===id?1:0,
    nota:g.gan===id?(g.motivo==="tiempo"?"gana por tiempo":"conectó sus bordes"):""};});},
  camino:camino,distancia:distancia,heuristica:heuristica,vecinos:vecinos
});
})(typeof globalThis!=="undefined"?globalThis:this);
