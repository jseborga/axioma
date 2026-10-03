/* ===========================================================
   Bingo · reglas
   Bingo de 75 bolas con cartones de 5×5 (B 1–15, I 16–30, N 31–45,
   G 46–60, O 61–75; el centro es libre).
     · Rápido: gana la primera LÍNEA (fila, columna o diagonal).
     · Largo: primero se juega la línea y después el CARTÓN LLENO,
       que se lleva el gran premio.
   El servidor baraja las 75 bolas con azar criptográfico al empezar y
   las saca a su ritmo (cada 3 a 12 s) o cuando el anfitrión pulsa
   «Sacar bola». Cada cartón sale de la semilla de la partida y de la
   persona: no se guarda, se regenera igual siempre.
   Premio automático (el servidor detecta a quien completa con cada
   bola; si son varios con la misma bola, comparten) o «cantado» (hay
   que pulsar ¡Línea! o ¡Bingo!: quien canta primero abre una ventana
   de 4 s para quienes también lo tengan; cantar en falso bloquea 10 s).
   Con premio no hay bots. El anfitrión presenta y no juega, salvo que
   lo elija en las opciones.
   =========================================================== */
(function(G){
"use strict";
var J=G.AxJuegos, LISTOS_MS=6000, PREMIO_MS=9000, VENTANA_MS=4000, FALSO_MS=10000, MAX_CARTONES=3;
var LETRAS=["B","I","N","G","O"];
var NOMBRE={linea:"Línea",bingo:"Cartón lleno"};
/* las 12 líneas de un cartón: 5 filas, 5 columnas y 2 diagonales (índices 0..24, fila a fila) */
var LINEAS=(function(){var l=[],i,k;
  for(i=0;i<5;i++){var f=[],c=[];for(k=0;k<5;k++){f.push(i*5+k);c.push(k*5+i);}l.push(f);l.push(c);}
  l.push([0,6,12,18,24]); l.push([4,8,12,16,20]); return l;})();

function letra(n){return LETRAS[Math.floor((n-1)/15)];}
/* cartón k de una persona: 25 números (el 12, centro, es 0 = libre) */
function carton(g,id,k){
  var r=J.rng(J.semilla(g.seed+":"+id+":"+k)), c=new Array(25), col, i;
  for(col=0;col<5;col++){
    var nums=[]; for(i=1;i<=15;i++)nums.push(col*15+i);
    J.baraja(nums,r);
    for(i=0;i<5;i++)c[i*5+col]=nums[i];
  }
  c[12]=0; return c;
}
function cartones(E,id){var g=E.g, out=[]; for(var k=0;k<E.opciones.cartones;k++)out.push(carton(g,id,k)); return out;}
function marcado(c,i,sal){return c[i]===0||!!sal[c[i]];}
/* cuántos números le faltan a un cartón para el premio */
function faltan(c,sal,premio){
  if(premio==="bingo"){var f=0;for(var i=0;i<25;i++)if(!marcado(c,i,sal))f++;return f;}
  var mejor=5; LINEAS.forEach(function(l){var f=0;l.forEach(function(i){if(!marcado(c,i,sal))f++;}); if(f<mejor)mejor=f;});
  return mejor;
}
function salidas(g){var s={}; g.sacadas.forEach(function(n){s[n]=1;}); return s;}
function participantes(E){return E.jugadores.filter(function(j){return j.id!==E.host||E.opciones.hostJuega;});}
function premioActual(E){var g=E.g; return g.premios[g.actual]||null;}
/* qué cartones de esa persona tienen el premio ya completo */
function completos(E,id,premio,sal){
  return cartones(E,id).map(function(c,k){return faltan(c,sal,premio)===0?k:-1;}).filter(function(k){return k>=0;});
}

function programa(E,ahora){var g=E.g; g.hasta=(E.opciones.ritmo&&!g.pausa)?ahora+E.opciones.ritmo*1000:null;}
function premia(E,ids,ahora){
  var g=E.g, p=premioActual(E), sal=salidas(g);
  g.ganadores[p]=ids.map(function(id){return {id:id,bola:g.sacadas.length,cartones:completos(E,id,p,sal)};});
  g.fase="premio"; g.hasta=ahora+PREMIO_MS; g.ventana=null; g.cantores=[];
}
/* cuántos están a una bola del premio en juego (para el proyector) */
function cuentaCasi(E){
  var g=E.g, p=premioActual(E), sal=salidas(g), n=0;
  if(!p)return 0;
  participantes(E).forEach(function(j){ if(cartones(E,j.id).some(function(c){return faltan(c,sal,p)===1;}))n++; });
  return n;
}
function saca(E,ahora,r){
  var g=E.g;
  if(g.idx>=g.bolas.length){g.fin=true;g.fase="fin";g.hasta=null;return;}
  var n=g.bolas[g.idx++]; g.sacadas.push(n);
  var p=premioActual(E), sal=salidas(g);
  if(!E.opciones.cantar){
    var ids=participantes(E).filter(function(j){return completos(E,j.id,p,sal).length;}).map(function(j){return j.id;});
    if(ids.length){premia(E,ids,ahora);return;}
  }else{
    /* los bots que acaban de completar cantarán entre 1,5 y 4 s después */
    participantes(E).forEach(function(j){ if(j.bot&&g.botVe[j.id]==null&&g.cantores.indexOf(j.id)<0&&completos(E,j.id,p,sal).length)
      g.botVe[j.id]=ahora+1500+Math.floor((r?r():Math.random())*2500); });
  }
  g.casi=cuentaCasi(E);
  programa(E,ahora);
}

J.registra("bingo",{
  nombre:"Bingo",grupo:"especial",min:1,max:2000,bots:true,sinBotsConPremio:true,tarde:false,acceso:"invitados",difusion:250,pausaBot:500,
  normaliza:function(o){
    var r=parseInt(o.ritmo,10), c=parseInt(o.cartones,10);
    return {modo:o.modo==="largo"?"largo":"rapido",ritmo:[0,3,5,8,12].indexOf(r)>=0?r:5,cartones:c>=1&&c<=MAX_CARTONES?c:1,
      cantar:o.cantar===true||o.cantar==="1",hostJuega:o.hostJuega===true||o.hostJuega==="1",premioLinea:J.limpia(o.premioLinea,120)};
  },
  inicia:function(E,r,ahora){
    var bolas=[]; for(var i=1;i<=75;i++)bolas.push(i);
    E.g={seed:Math.floor(r()*4294967295),bolas:J.baraja(bolas,r),idx:0,sacadas:[],fase:"listos",hasta:ahora+LISTOS_MS,pausa:false,
      premios:E.opciones.modo==="largo"?["linea","bingo"]:["linea"],actual:0,ganadores:{},ventana:null,cantores:[],bloqueo:{},botVe:{},casi:0,fin:false};
  },
  accion:function(E,id,m,ahora,r){
    var g=E.g; if(g.fin)return {error:"finished"};
    if(m.tipo==="bola"){
      if(id!==E.host)return {error:"forbidden"};
      if(g.fase!=="bolas"||g.ventana)return {error:"wait"};
      saca(E,ahora,r); return;
    }
    if(m.tipo==="pausa"){
      if(id!==E.host)return {error:"forbidden"};
      if(!E.opciones.ritmo)return {error:"bad_move"};
      g.pausa=!g.pausa; if(g.fase==="bolas"&&!g.ventana)programa(E,ahora); return;
    }
    if(m.tipo==="canta"){
      if(!E.opciones.cantar)return {error:"bad_move"};
      if(!participantes(E).some(function(j){return j.id===id;}))return {error:"not_player"};
      if(g.fase!=="bolas")return {error:"too_late"};
      if(g.bloqueo[id]&&ahora<g.bloqueo[id])return {error:"blocked"};
      if(g.cantores.indexOf(id)>=0)return {error:"already"};
      if(!completos(E,id,premioActual(E),salidas(g)).length){g.bloqueo[id]=ahora+FALSO_MS;return {error:"bad_claim"};}
      g.cantores.push(id); delete g.botVe[id];
      /* el primero abre la ventana de empate: no salen más bolas hasta cerrarla */
      if(!g.ventana){g.ventana=ahora+VENTANA_MS; g.hasta=g.ventana;}
      return;
    }
    return {error:"bad_move"};
  },
  tick:function(E,ahora,r){
    var g=E.g; if(g.fin||!g.hasta||ahora<g.hasta)return false;
    if(g.fase==="listos"){g.fase="bolas"; if(E.opciones.ritmo)saca(E,ahora,r); else g.hasta=null; return true;}
    if(g.fase==="bolas"){
      if(g.ventana){premia(E,g.cantores.slice(),ahora);return true;}
      if(!g.pausa&&E.opciones.ritmo){saca(E,ahora,r);return true;}
      return false;
    }
    if(g.fase==="premio"){
      g.actual++;
      if(g.actual>=g.premios.length){g.fin=true;g.fase="fin";g.hasta=null;return true;}
      g.fase="bolas"; g.botVe={}; g.casi=cuentaCasi(E); programa(E,ahora);
      /* el premio siguiente: los bots que ya lo tienen también cantan */
      if(E.opciones.cantar){var p=premioActual(E), sal=salidas(g);
        participantes(E).forEach(function(j){if(j.bot&&completos(E,j.id,p,sal).length)g.botVe[j.id]=ahora+1500+Math.floor((r?r():Math.random())*2500);});}
      return true;
    }
    return false;
  },
  /* en el modo cantado, los bots cantan entre 1,5 y 4 s después de completar */
  bot:function(E,id,r,ahora){
    var g=E.g; if(!E.opciones.cantar||g.fin||g.fase!=="bolas"||g.cantores.indexOf(id)>=0||!g.botVe[id])return null;
    return ahora>=g.botVe[id]?{tipo:"canta"}:null;
  },
  proximo:function(E){var g=E.g, t=g.hasta;
    if(E.opciones.cantar)Object.keys(g.botVe).forEach(function(id){if(g.cantores.indexOf(id)<0&&(!t||g.botVe[id]<t))t=g.botVe[id];});
    return t;},
  vista:function(E,quien){
    var g=E.g, sal=salidas(g), p=premioActual(E), o=E.opciones;
    var v={fase:g.fase,hasta:g.hasta,modo:o.modo,ritmo:o.ritmo,cantar:o.cantar,pausa:g.pausa,host:quien===E.host,
      premio:p,premios:g.premios,nombres:NOMBRE,premioLinea:o.premioLinea,sacadas:g.sacadas,n:g.sacadas.length,
      total:participantes(E).length,casi:g.casi,ventana:g.ventana,cantores:g.cantores.length,fin:g.fin,ganadores:{}};
    Object.keys(g.ganadores).forEach(function(k){
      v.ganadores[k]=g.ganadores[k].map(function(x){return {id:x.id,n:J.nombre(E,x.id),bola:x.bola,
        cartones:x.cartones.map(function(i){return carton(g,x.id,i);})};});});
    if(participantes(E).some(function(j){return j.id===quien;})){
      v.mis=cartones(E,quien).map(function(c){return {c:c,faltan:p?faltan(c,sal,p):null};});
      v.bloqueo=g.bloqueo[quien]&&g.bloqueo[quien]>Date.now()?g.bloqueo[quien]:null;
      v.cante=g.cantores.indexOf(quien)>=0;
    }
    return v;
  },
  resultado:function(E){
    var g=E.g, sal=salidas(g), out=[], vistos={};
    g.premios.slice().reverse().forEach(function(p){(g.ganadores[p]||[]).forEach(function(x){ if(vistos[x.id])return; vistos[x.id]=1;
      out.push({id:x.id,puntos:x.bola,unidad:"bolas",nota:"¡"+NOMBRE[p]+"!"});});});
    var mayor=g.premios[g.premios.length-1];
    var resto=participantes(E).filter(function(j){return !vistos[j.id];}).map(function(j){
      return {id:j.id,f:Math.min.apply(null,cartones(E,j.id).map(function(c){return faltan(c,sal,mayor);}))};});
    resto.sort(function(a,b){return a.f-b.f;});
    out.forEach(function(x,i){x.puesto=i+1;});
    resto.slice(0,20).forEach(function(x,i){out.push({id:x.id,puesto:out.length+1,puntos:x.f,unidad:"por marcar",nota:""});});
    return out;
  }
});
J.BINGO={LETRAS:LETRAS,letra:letra,NOMBRE:NOMBRE,LINEAS:LINEAS};
})(typeof globalThis!=="undefined"?globalThis:this);
