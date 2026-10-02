/* ===========================================================
   Carrera de caballos · reglas
   Hasta cuatro jinetes (personas o bots) en un hipódromo. En cada
   ronda cada uno elige a cuánto se la juega y responde una pregunta
   de esa dificultad del banco general:
     Fácil   acierto +1 · fallo −1
     Media   acierto +2 · fallo −1
     Difícil acierto +3 · fallo −2
   El acierto más rápido de la ronda galopa una casilla más. En la
   pista hay zanahorias (+2) y charcos de barro (−1), y cada jinete
   tiene un comodín 50:50 para toda la carrera. Gana quien cruza
   primero la meta. Los bots eligen y aciertan según su nivel (fácil,
   medio o difícil) y arriesgan más cuando van por detrás.
   =========================================================== */
(function(G){
"use strict";
var J=G.AxJuegos, LISTOS_MS=3500, ELIGE_MS=9000, RES_MS=5200, MAX_RONDAS=40, POOL=50, MAX=4;
var DIF={1:{nom:"Fácil",mas:1,menos:1},2:{nom:"Media",mas:2,menos:1},3:{nom:"Difícil",mas:3,menos:2}};
var ZANAHORIA=2, BARRO=1;
/* probabilidad de acierto de un bot [nivel del bot][dificultad de la pregunta] y cómo elige */
var ACIERTO=[[0.72,0.5,0.3],[0.88,0.7,0.5],[0.96,0.86,0.72]];
var ELIGE=[[0.6,0.3,0.1],[0.3,0.45,0.25],[0.12,0.38,0.5]];
/* cuánto tarda en responder un bot, como fracción del tiempo de la pregunta */
var TARDA=[[0.3,0.75],[0.2,0.55],[0.1,0.4]];

function jinetes(E){return E.jugadores.slice(0,MAX);}
function esBot(E,id){var j=J.jugador(E,id);return !!(j&&j.bot);}
/* casillas especiales: separadas entre sí y lejos de la salida y la meta */
function casillas(meta,r){
  var n=Math.max(1,Math.round(meta/7)), libres=[], out={}, puestas=0, i;
  for(i=2;i<meta-1;i++)libres.push(i);
  J.baraja(libres,r);
  for(i=0;i<libres.length&&puestas<n*2;i++){var p=libres[i];
    if(out[p-1]||out[p+1])continue; out[p]=puestas<n?"z":"b"; puestas++;}
  return out;
}
/* la pregunta con sus opciones barajadas */
function mezcla(x,r){
  var idx=J.baraja(x.o.map(function(_,i){return i;}),r);
  return {id:x.id||null,q:x.q,o:idx.map(function(i){return x.o[i];}),c:idx.indexOf(x.c),tema:x.tema||"",dato:x.dato||""};
}
function saca(g,l){var p=g.pools[l]; if(!p.length)return null; var q=p[g.ptr[l]%p.length]; g.ptr[l]++; if(q.id&&g.usadas.indexOf(q.id)<0)g.usadas.push(q.id); return q;}

function ronda(E,ahora,r){
  var g=E.g; g.ronda++; g.fase="elige"; g.hasta=ahora+ELIGE_MS;
  g.eleccion={}; g.resp={}; g.ocultas={}; g.ult=null; g.preg={}; g.botT={};
  jinetes(E).forEach(function(j){if(j.bot)g.botT[j.id]=ahora+1200+Math.floor((r?r():0.5)*3000);});
}
function pregunta(E,ahora,r){
  var g=E.g, seg=E.opciones.segundos*1000, nb=E.opciones.bots;
  jinetes(E).forEach(function(j){if(g.eleccion[j.id]==null)g.eleccion[j.id]=1;});   /* quien no eligió, va al trote */
  [1,2,3].forEach(function(l){ if(jinetes(E).some(function(j){return g.eleccion[j.id]===l;}))g.preg[l]=saca(g,l); });
  g.fase="pregunta"; g.desde=ahora; g.hasta=ahora+seg; g.botT={};
  jinetes(E).forEach(function(j){ if(!j.bot)return;
    var t=TARDA[nb], f=t[0]+(r?r():0.5)*(t[1]-t[0]);
    g.botT[j.id]=ahora+Math.min(seg-1200,Math.max(1500,Math.floor(seg*f)));});
}
function aplica(E,ahora){
  var g=E.g, ids=jinetes(E).map(function(j){return j.id;}), rapido=null, llegan=[];
  ids.forEach(function(id){var d=g.eleccion[id], q=g.preg[d], x=g.resp[id];
    if(q&&x&&x.i===q.c&&(!rapido||x.ms<g.resp[rapido].ms))rapido=id;});
  if(ids.length<2)rapido=null;
  g.ult={};
  ids.forEach(function(id){
    var d=g.eleccion[id]||1, q=g.preg[d], x=g.resp[id], ok=!!(q&&x&&x.i===q.c), de=g.pos[id];
    var mov=ok?DIF[d].mas:-DIF[d].menos, extra=null;
    if(ok){g.aciertos[id]++; if(id===rapido)mov++;}
    var a=Math.max(0,de+mov), alcance=de+mov;
    if(a<g.meta&&g.cas[a]==="z"){a+=ZANAHORIA;extra="z";alcance+=ZANAHORIA;}
    else if(a<g.meta&&g.cas[a]==="b"){a=Math.max(0,a-BARRO);extra="b";}
    if(a>=g.meta){a=g.meta;llegan.push({id:id,alcance:alcance,ms:x?x.ms:1e9});}
    g.pos[id]=a;
    g.ult[id]={d:d,ok:ok,mov:a-de,rapido:id===rapido,extra:extra,resp:x?x.i:null,c:q?q.c:null};
  });
  /* si cruzan varios en la misma ronda: primero quien llegó más lejos y, si no, quien respondió antes */
  llegan.sort(function(a,b){return (b.alcance-a.alcance)||(a.ms-b.ms);});
  llegan.forEach(function(x){g.llegadas.push(x.id);});
  g.fase="resultado"; g.hasta=ahora+RES_MS;
  if(g.llegadas.length||g.ronda>=MAX_RONDAS)g.acaba=true;
}
function todos(E,que){var g=E.g;
  return jinetes(E).every(function(j){return g[que][j.id]!=null||(j.conectado===false&&!j.bot);});}
function eligeBot(E,id,r){
  var g=E.g, p=ELIGE[E.opciones.bots].slice(), mio=g.pos[id], lider=0;
  Object.keys(g.pos).forEach(function(k){if(g.pos[k]>lider)lider=g.pos[k];});
  if(g.meta-mio<=1)return 1;                                   /* a un paso de la meta: sin riesgo */
  if(lider-mio>=3){p=[p[0]*0.5,p[1],p[2]*1.8];}                /* rezagado: se arriesga más */
  var t=p[0]+p[1]+p[2], x=r()*t;
  return x<p[0]?1:x<p[0]+p[1]?2:3;
}

J.registra("caballos",{
  nombre:"Carrera de caballos",grupo:"grupo",min:1,max:MAX,bots:true,acceso:"libre",usaBanco:true,difusion:120,pausaBot:400,
  normaliza:function(o){
    var m=parseInt(o.meta,10), s=parseInt(o.segundos,10), b=parseInt(o.bots,10);
    var op={meta:[12,16,20,25].indexOf(m)>=0?m:16,segundos:[10,15,20,25].indexOf(s)>=0?s:15,bots:[0,1,2].indexOf(b)>=0?b:1,
      areas:(Array.isArray(o.areas)?o.areas:[]).map(String).filter(function(a){return /^[a-z]{3}$/.test(a);}).slice(0,30)};
    if(o.fuente)op.fuente=String(o.fuente).slice(0,20);
    return op;
  },
  inicia:function(E,r,ahora){
    var o=E.opciones, pools={1:[],2:[],3:[]}, banco=E.extra&&E.extra.preguntas, seed=Math.floor(r()*4294967295);
    if(banco&&banco.length){
      J.baraja(banco.slice(),r).forEach(function(x){var l=[1,2,3].indexOf(x.nivel)>=0?x.nivel:2; if(pools[l].length<POOL)pools[l].push(mezcla(x,r));});
      /* un banco propio sin preguntas de algún nivel: se toman del nivel vecino */
      var vecino={1:[2,3],2:[1,3],3:[2,1]}, todas=pools[1].concat(pools[2],pools[3]);
      [1,2,3].forEach(function(l){ if(pools[l].length)return;
        var v=vecino[l].filter(function(k){return pools[k].length;})[0]; pools[l]=(v?pools[v]:todas).slice(); });
    }else if(J.preguntasNivel){
      [1,2,3].forEach(function(l){pools[l]=J.preguntasNivel(POOL,l,seed+l,o.areas,E.extra&&E.extra.evita);});
    }
    var meta=o.meta;
    E.g={meta:meta,cas:casillas(meta,r),pos:{},aciertos:{},comodin:{},llegadas:[],usadas:[],pools:pools,ptr:{1:0,2:0,3:0},
      ronda:0,fase:"listos",hasta:ahora+LISTOS_MS,eleccion:{},resp:{},ocultas:{},preg:{},ult:null,botT:{},fin:false,acaba:false};
    jinetes(E).forEach(function(j){E.g.pos[j.id]=0;E.g.aciertos[j.id]=0;});
  },
  accion:function(E,id,m,ahora,r){
    var g=E.g; if(g.fin)return {error:"finished"};
    if(g.pos[id]==null)return {error:"not_player"};
    if(m.tipo==="elige"){
      if(g.fase!=="elige")return {error:"too_late"};
      if(g.eleccion[id]!=null)return {error:"already"};
      var d=parseInt(m.d,10); if(!DIF[d])return {error:"bad_move"};
      g.eleccion[id]=d;
      if(todos(E,"eleccion"))pregunta(E,ahora,r);
      return;
    }
    if(m.tipo==="comodin"){
      if(g.fase!=="pregunta"||g.resp[id])return {error:"too_late"};
      if(g.comodin[id])return {error:"already"};
      var q=g.preg[g.eleccion[id]]; if(!q||q.o.length<3)return {error:"bad_move"};
      var malas=q.o.map(function(_,i){return i;}).filter(function(i){return i!==q.c;});
      J.baraja(malas,r||J.rng(ahora>>>0));
      g.comodin[id]=true; g.ocultas[id]=malas.slice(0,q.o.length-2);
      return;
    }
    if(m.tipo==="resp"){
      if(g.fase!=="pregunta")return {error:"too_late"};
      if(g.resp[id])return {error:"already"};
      var p=g.preg[g.eleccion[id]], i=parseInt(m.i,10);
      if(!p||!(i>=0&&i<p.o.length))return {error:"bad_move"};
      if((g.ocultas[id]||[]).indexOf(i)>=0)return {error:"bad_move"};
      g.resp[id]={i:i,ms:ahora-g.desde};
      if(todos(E,"resp"))aplica(E,ahora);
      return;
    }
    return {error:"bad_move"};
  },
  tick:function(E,ahora,r){
    var g=E.g; if(g.fin||!g.hasta||ahora<g.hasta)return false;
    if(g.fase==="listos"){ronda(E,ahora,r);return true;}
    if(g.fase==="elige"){pregunta(E,ahora,r);return true;}
    if(g.fase==="pregunta"){aplica(E,ahora);return true;}
    if(g.fase==="resultado"){
      if(g.acaba){g.fin=true;g.fase="fin";g.hasta=null;}
      else ronda(E,ahora,r);
      return true;
    }
    return false;
  },
  bot:function(E,id,r,ahora){
    var g=E.g; if(g.fin||!g.botT[id]||ahora<g.botT[id])return null;
    if(g.fase==="elige"&&g.eleccion[id]==null)return {tipo:"elige",d:eligeBot(E,id,r)};
    if(g.fase==="pregunta"&&!g.resp[id]){
      var d=g.eleccion[id], q=g.preg[d]; if(!q)return null;
      if(r()<ACIERTO[E.opciones.bots][d-1])return {tipo:"resp",i:q.c};
      var malas=q.o.map(function(_,i){return i;}).filter(function(i){return i!==q.c;});
      return {tipo:"resp",i:malas[Math.floor(r()*malas.length)]};
    }
    return null;
  },
  proximo:function(E){var g=E.g, t=g.hasta;
    Object.keys(g.botT).forEach(function(id){
      var falta=(g.fase==="elige"&&g.eleccion[id]==null)||(g.fase==="pregunta"&&!g.resp[id]);
      if(falta&&(!t||g.botT[id]<t))t=g.botT[id];});
    return t;},
  vista:function(E,quien){
    var g=E.g, ids=jinetes(E).map(function(j){return j.id;}), v={fase:g.fase,hasta:g.hasta,ronda:g.ronda,meta:g.meta,cas:g.cas,pos:g.pos,
      orden:ids,nombres:{},bots:{},llegadas:g.llegadas,fin:g.fin,segundos:E.opciones.segundos,nivelBots:E.opciones.bots,aciertos:g.aciertos};
    ids.forEach(function(id){v.nombres[id]=J.nombre(E,id); if(esBot(E,id))v.bots[id]=1;});
    /* quién eligió ya (en la elección no se ve qué; después sí) y quién respondió */
    v.eligio={}; ids.forEach(function(id){if(g.eleccion[id]!=null)v.eligio[id]=g.fase==="elige"?0:g.eleccion[id];});
    v.respondio={}; ids.forEach(function(id){if(g.resp[id])v.respondio[id]=1;});
    if(g.ult&&(g.fase==="resultado"||g.fin)){
      v.ult=g.ult; v.preguntas={};
      Object.keys(g.preg).forEach(function(l){var q=g.preg[l]; if(q)v.preguntas[l]={q:q.q,correcta:q.o[q.c],dato:q.dato||""};});
    }
    if(g.pos[quien]!=null){
      var mi={eleccion:g.eleccion[quien]||null,comodin:!!g.comodin[quien]};
      var d=g.eleccion[quien], q=d&&g.preg[d];
      if(q&&(g.fase==="pregunta"||g.fase==="resultado")){
        mi.q=q.q; mi.o=q.o; mi.tema=q.tema; mi.ocultas=g.ocultas[quien]||[]; mi.resp=g.resp[quien]?g.resp[quien].i:null;
        if(g.fase==="resultado")mi.c=q.c;
      }
      v.mi=mi;
    }
    return v;
  },
  usadas:function(E){return E.g.usadas.slice();},
  resultado:function(E){
    var g=E.g, ids=Object.keys(g.pos);
    ids.sort(function(a,b){
      var la=g.llegadas.indexOf(a), lb=g.llegadas.indexOf(b);
      if(la>=0&&lb>=0)return la-lb; if(la>=0)return -1; if(lb>=0)return 1;
      return (g.pos[b]-g.pos[a])||(g.aciertos[b]-g.aciertos[a]);});
    return ids.map(function(id,i){return {id:id,puesto:i+1,puntos:g.pos[id],unidad:"de "+g.meta,
      nota:(g.llegadas.indexOf(id)>=0?"cruzó la meta · ":"")+g.aciertos[id]+(g.aciertos[id]===1?" acierto":" aciertos")};});
  }
});
J.CABALLOS={DIF:DIF,ZANAHORIA:ZANAHORIA,BARRO:BARRO};
})(typeof globalThis!=="undefined"?globalThis:this);
