/* ===========================================================
   Gomoku (cinco en línea) · reglas
   Tablero de 15×15; gana quien alinee cinco o más piezas seguidas en
   horizontal, vertical o diagonal. En línea hay un reloj por turno:
   quien lo agota pierde la partida.
   =========================================================== */
(function(G){
"use strict";
var J=G.AxJuegos, DIR=[[0,1],[1,0],[1,1],[1,-1]];

function linea(t,n,i){               /* ¿la pieza en i cierra cinco? devuelve las casillas */
  var v=t[i], r=Math.floor(i/n), c=i%n;
  for(var k=0;k<4;k++){
    var dr=DIR[k][0], dc=DIR[k][1], cas=[i];
    for(var s=-1;s<=1;s+=2){var rr=r+dr*s, cc=c+dc*s;
      while(rr>=0&&rr<n&&cc>=0&&cc<n&&t[rr*n+cc]===v){cas.push(rr*n+cc);rr+=dr*s;cc+=dc*s;}}
    if(cas.length>=5)return cas;
  }
  return null;
}
/* valoración de una casilla para el bot: suma de amenazas propias y ajenas */
function patron(t,n,i,v){
  var r=Math.floor(i/n), c=i%n, total=0;
  for(var k=0;k<4;k++){
    var dr=DIR[k][0], dc=DIR[k][1], cuenta=1, abiertos=0;
    for(var s=-1;s<=1;s+=2){var rr=r+dr*s, cc=c+dc*s;
      while(rr>=0&&rr<n&&cc>=0&&cc<n&&t[rr*n+cc]===v){cuenta++;rr+=dr*s;cc+=dc*s;}
      if(rr>=0&&rr<n&&cc>=0&&cc<n&&t[rr*n+cc]===0)abiertos++;}
    if(cuenta>=5)total+=1e6;
    else if(cuenta===4)total+=abiertos===2?1e5:abiertos?1e4:0;
    else if(cuenta===3)total+=abiertos===2?5e3:abiertos?400:0;
    else if(cuenta===2)total+=abiertos===2?200:abiertos?30:0;
    else total+=abiertos;
  }
  return total;
}
function candidatas(t,n){
  var out=[], hay=false, i;
  for(i=0;i<t.length;i++)if(t[i]){hay=true;break;}
  if(!hay)return [Math.floor(n/2)*n+Math.floor(n/2)];
  for(i=0;i<t.length;i++){ if(t[i])continue;
    var r=Math.floor(i/n), c=i%n, cerca=false;
    for(var dr=-2;dr<=2&&!cerca;dr++)for(var dc=-2;dc<=2;dc++){var rr=r+dr,cc=c+dc;
      if(rr>=0&&rr<n&&cc>=0&&cc<n&&t[rr*n+cc]){cerca=true;break;}}
    if(cerca)out.push(i);
  }
  return out;
}
/* nivel 0: juega bien pero se despista; 1: la mejor casilla; 2: además no deja amenazas dobles */
function mejor(t,n,yo,nivel,r){
  var otro=3-yo, cs=candidatas(t,n);
  var pun=cs.map(function(i){
    var a=patron(t,n,i,yo), d=patron(t,n,i,otro);
    return {i:i,p:a*(nivel>=2?1.1:1)+d+(nivel===0?r()*300:0)};
  }).sort(function(a,b){return b.p-a.p;});
  if(nivel===0&&pun.length>3&&pun[0].p<1e4&&r()<0.35)return pun[1+Math.floor(r()*2)].i;
  return pun.length?pun[0].i:-1;
}

J.registra("gomoku",{
  nombre:"Gomoku",grupo:"estrategia",min:2,max:2,bots:true,acceso:"libre",
  normaliza:function(o){ var t=parseInt(o.tiempo,10); return {tiempo:[0,30,60,120].indexOf(t)>=0?t:60,nivel:Math.max(0,Math.min(2,parseInt(o.nivel,10)||1))}; },
  inicia:function(E,r,ahora){
    var n=15; E.g={n:n,t:new Array(n*n).fill(0),orden:E.jugadores.slice(0,2).map(function(j){return j.id;}),turno:0,ult:-1,
      gan:null,linea:null,jugadas:0,fin:false,motivo:null};
    this.reloj(E,ahora);
  },
  reloj:function(E,ahora){ var g=E.g; g.hasta=(!E.opciones.tiempo||E.opciones.local)?null:ahora+E.opciones.tiempo*1000; },
  turno:function(E){return E.g.fin?null:E.g.orden[E.g.turno];},
  accion:function(E,id,m,ahora){
    var g=E.g, i=parseInt(m.c,10);
    if(g.fin)return {error:"finished"};
    if(g.orden[g.turno]!==id)return {error:"not_your_turn"};
    if(!(i>=0&&i<g.t.length)||g.t[i])return {error:"bad_move"};
    g.t[i]=g.turno+1; g.ult=i; g.jugadas++;
    var l=linea(g.t,g.n,i);
    if(l){g.fin=true;g.gan=id;g.linea=l;g.motivo="cinco";return;}
    if(g.jugadas>=g.t.length){g.fin=true;g.motivo="empate";return;}
    g.turno=1-g.turno; this.reloj(E,ahora);
  },
  tick:function(E,ahora){
    var g=E.g; if(g.fin||!g.hasta||ahora<g.hasta)return false;
    g.fin=true; g.gan=g.orden[1-g.turno]; g.motivo="tiempo"; return true;
  },
  bot:function(E,id,r){
    var g=E.g; if(g.fin||g.orden[g.turno]!==id)return null;
    return {c:mejor(g.t,g.n,g.turno+1,E.opciones.nivel==null?1:E.opciones.nivel,r)};
  },
  vista:function(E){var g=E.g;
    return {n:g.n,t:g.t,orden:g.orden,turno:g.fin?null:g.orden[g.turno],ult:g.ult,gan:g.gan,linea:g.linea,fin:g.fin,motivo:g.motivo,hasta:g.hasta};},
  resultado:function(E){var g=E.g;
    return g.orden.map(function(id){return {id:id,puesto:g.gan?(g.gan===id?1:2):1,puntos:g.gan?(g.gan===id?1:0):0.5,
      nota:g.gan===id?(g.motivo==="tiempo"?"gana por tiempo":"cinco en línea"):g.motivo==="empate"?"empate":""};});},
  mejor:mejor
});
})(typeof globalThis!=="undefined"?globalThis:this);
