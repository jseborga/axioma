/* ===========================================================
   THE FINAL TEST · Puertas de Color · pantalla
   Bloques de juguete en 3D dibujados por código sobre un lienzo:
   caras con brillo y bisel, laterales en relieve, sombras suaves,
   puertas con flechas que laten, partículas al salir, hielo que se
   derrite, capas de cristal y fondos por mundo. Sin imágenes.

   Lo que corrige de los «block jam» comerciales:
     · sin vidas, sin anuncios, sin compras
     · modo zen sin reloj (el contrarreloj es opcional y regala tiempo)
     · deshacer ilimitado y 3 pistas gratis por nivel
     · curva sin picos: respiro cada 5 niveles, desafío anunciado cada 10,
       y la dificultad se ajusta a cada persona (y ofrece versión suave)
     · símbolos para daltónicos y modo números (sumas, restas, tablas)
     · reto del día igual para todos, con racha y ranking verificado
     · el progreso se guarda en la cuenta además de en el teléfono
     AxBloquesUI.portada()   menú
     AxBloquesUI.para()      detiene la animación
   =========================================================== */
(function(){
"use strict";
var A=window.AxBloques;
if(!A)return;
var $=function(id){return document.getElementById(id)};
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}

/* ---------- colores, símbolos y temas ---------- */
var COL=[
  {n:"rojo",    h:"#ff4d5e",l:"#ffa0a8",o:"#c11f36",e:"🟥"},
  {n:"naranja", h:"#ff9b2f",l:"#ffcb8a",o:"#c96600",e:"🟧"},
  {n:"amarillo",h:"#ffd23f",l:"#fff0a6",o:"#c49200",e:"🟨"},
  {n:"verde",   h:"#3ccf6e",l:"#9df3b8",o:"#1a8a43",e:"🟩"},
  {n:"celeste", h:"#33b6ff",l:"#a3e1ff",o:"#0a74bd",e:"🟦"},
  {n:"morado",  h:"#9d63ff",l:"#d0b3ff",o:"#5f2cc2",e:"🟪"},
  {n:"rosa",    h:"#ff6fc4",l:"#ffbde4",o:"#c42f87",e:"💗"},
  {n:"turquesa",h:"#1fd6c4",l:"#95f2e9",o:"#0b9184",e:"🩵"}
];
var NEUTRO={h:"#ebe7f5",l:"#ffffff",o:"#aaa3c2"};
var ROCA={h:"#9aa3ad",l:"#c9d0d6",o:"#5f6873"};
var ICONO={pradera:"🌼",bosque:"🌲",rio:"🌊",glaciar:"🧊",cristal:"💎",arcoiris:"🌈",cosmos:"🪐",dia:"🌅"};
var TEMAS={
  pradera: {c1:"#d3f7d8",c2:"#8fd9f6",b1:"#e2a462",b2:"#a5652f",s1:"#fdf7ea",s2:"#f3e8cf",bok:"255,255,255"},
  bosque:  {c1:"#c5efbd",c2:"#3c8e5a",b1:"#a8764c",b2:"#68432a",s1:"#f1f6e3",s2:"#e1ead0",bok:"230,255,220"},
  rio:     {c1:"#d1f3ff",c2:"#3a8edb",b1:"#7aa3c4",b2:"#45698a",s1:"#f0f8fc",s2:"#deedf6",bok:"255,255,255"},
  glaciar: {c1:"#f4fbff",c2:"#a3cbf0",b1:"#a8cbe9",b2:"#6a95c0",s1:"#f8fcff",s2:"#e5f2fc",bok:"255,255,255"},
  cristal: {c1:"#f6e3ff",c2:"#8c66e6",b1:"#a088e0",b2:"#5f43a8",s1:"#fbf6ff",s2:"#efe5fc",bok:"255,230,255"},
  arcoiris:{c1:"#ffe3f1",c2:"#9fe6ff",b1:"#f09cc6",b2:"#b2578c",s1:"#fffafd",s2:"#fbebf4",bok:"255,255,255"},
  cosmos:  {c1:"#30236b",c2:"#090c2a",b1:"#565cb0",b2:"#2a2e6d",s1:"#262a5e",s2:"#1f2350",bok:"200,210,255",oscuro:true},
  dia:     {c1:"#ffe7b8",c2:"#ff9a8f",b1:"#ee9a66",b2:"#b25d34",s1:"#fff8ee",s2:"#fbead6",bok:"255,250,230"},
  neon:    {c1:"#1a1033",c2:"#05030f",b1:"#2c2350",b2:"#140f2a",s1:"#120d26",s2:"#0e0a20",bok:"180,120,255",oscuro:true}
};
var PIELES=[{id:"caramelo",nom:"Caramelo",req:0,txt:"Plástico brillante con tachas"},{id:"cristal",nom:"Cristal",req:2,txt:"Se abre al terminar el Bosque"},{id:"neon",nom:"Neón",req:4,txt:"Se abre al terminar el Glaciar"}];
function mezclaHex(a,b,t){var x=parseInt(a.slice(1),16),y=parseInt(b.slice(1),16);
  var r=Math.round(((x>>16)&255)*(1-t)+((y>>16)&255)*t),g=Math.round(((x>>8)&255)*(1-t)+((y>>8)&255)*t),bl=Math.round((x&255)*(1-t)+(y&255)*t);
  return "#"+((1<<24)+(r<<16)+(g<<8)+bl).toString(16).slice(1);}
function rgba(h,a){var x=parseInt(h.slice(1),16);return "rgba("+((x>>16)&255)+","+((x>>8)&255)+","+(x&255)+","+a+")";}

/* símbolos para daltónicos: uno por color, dibujados con trazos */
function simbolo(g,i,x,y,r){
  g.beginPath();
  var k,a;
  switch(i%8){
    case 0: g.arc(x,y,r,0,Math.PI*2); break;
    case 1: g.moveTo(x,y-r);g.lineTo(x+r*0.95,y+r*0.75);g.lineTo(x-r*0.95,y+r*0.75);g.closePath(); break;
    case 2: g.rect(x-r*0.8,y-r*0.8,r*1.6,r*1.6); break;
    case 3: g.moveTo(x,y-r);g.lineTo(x+r*0.8,y);g.lineTo(x,y+r);g.lineTo(x-r*0.8,y);g.closePath(); break;
    case 4: for(k=0;k<10;k++){a=-Math.PI/2+k*Math.PI/5;var rr=k%2?r*0.45:r;g[k?"lineTo":"moveTo"](x+Math.cos(a)*rr,y+Math.sin(a)*rr);}g.closePath(); break;
    case 5: var w=r*0.34;g.moveTo(x-w,y-r);g.lineTo(x+w,y-r);g.lineTo(x+w,y-w);g.lineTo(x+r,y-w);g.lineTo(x+r,y+w);g.lineTo(x+w,y+w);g.lineTo(x+w,y+r);g.lineTo(x-w,y+r);g.lineTo(x-w,y+w);g.lineTo(x-r,y+w);g.lineTo(x-r,y-w);g.lineTo(x-w,y-w);g.closePath(); break;
    case 6: g.moveTo(x,y+r*0.9);g.bezierCurveTo(x-r*1.4,y-r*0.1,x-r*0.6,y-r*1.2,x,y-r*0.45);g.bezierCurveTo(x+r*0.6,y-r*1.2,x+r*1.4,y-r*0.1,x,y+r*0.9);g.closePath(); break;
    default: for(k=0;k<6;k++){a=Math.PI/6+k*Math.PI/3;g[k?"lineTo":"moveTo"](x+Math.cos(a)*r,y+Math.sin(a)*r);}g.closePath();
  }
}

/* ---------- progreso (teléfono + cuenta) ---------- */
var CLAVE="ax-bloques-v1";
function base(){return {v:1,nivel:1,est:{},ajuste:0,martillos:2,piel:"caramelo",
  op:{modo:"zen",simbolos:false,numeros:false,tipoNum:"sumas",soloNum:false,sonido:true,vibra:true,toque:true},
  racha:0,ultDia:0,dias:{},vistas:{},t:0};}
function cargaP(){var p=base();try{var j=JSON.parse(localStorage.getItem(CLAVE)||"null");if(j&&j.v===1){for(var k in j)if(k!=="op")p[k]=j[k];for(var o in j.op||{})p.op[o]=j.op[o];}}catch(e){}return p;}
var P=cargaP();
function usuario(){var u=window.AxAccount&&AxAccount.user&&AxAccount.user();return u||null;}
var subeT=null;
function guarda(){P.t=Date.now();try{localStorage.setItem(CLAVE,JSON.stringify(P));}catch(e){}
  if(usuario()){clearTimeout(subeT);subeT=setTimeout(function(){api("/api/bloques/progreso",{data:P}).catch(function(){});},1200);}}
function mezcla(d){
  if(!d||d.v!==1)return;
  var nuevo=(d.t||0)>(P.t||0);
  P.nivel=Math.max(P.nivel,d.nivel||1);
  for(var k in d.est||{})P.est[k]=Math.max(P.est[k]||0,d.est[k]);
  for(k in d.dias||{})if(!P.dias[k]||d.dias[k].movs<P.dias[k].movs)P.dias[k]=d.dias[k];
  for(k in d.vistas||{})P.vistas[k]=1;
  if((d.ultDia||0)>P.ultDia||((d.ultDia||0)===P.ultDia&&(d.racha||0)>P.racha)){P.ultDia=d.ultDia;P.racha=d.racha;}
  if(nuevo){P.martillos=d.martillos;P.ajuste=d.ajuste||0;P.piel=d.piel||P.piel;for(k in d.op||{})P.op[k]=d.op[k];}
}
function baja(){
  if(!usuario())return Promise.resolve(false);
  return api("/api/bloques/progreso").then(function(r){if(r&&r.data){mezcla(r.data);try{localStorage.setItem(CLAVE,JSON.stringify(P));}catch(e){}return true;}return false;}).catch(function(){return false;});
}
function totalEstrellas(){var t=0;for(var k in P.est)t+=P.est[k];return t;}
function mundoHecho(m){return P.nivel>m*A.POR_MUNDO;}
function dia(){return Math.floor((Date.now()-Date.UTC(2026,0,1))/86400000)+1;}

function api(path,body){
  return fetch(path,{method:body?"POST":"GET",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:body?JSON.stringify(body):undefined}).then(function(r){return r.text().then(function(t){var j;try{j=JSON.parse(t);}catch(x){throw {error:"http",status:r.status};}if(!r.ok)throw j;return j;});});
}
function ERR(e){
  var m={unauthorized:"Entra con Google para entrar al ranking del día.",google_required:"Para el ranking del día hace falta entrar con Google.",bad_result:"Las jugadas no resuelven el tablero del día.",
    bad_time:"El tiempo no cuadra con el reloj del servidor.",not_started:"Primero empieza el reto.",bloques_not_configured:"Falta crear las tablas de Puertas de Color en la base de datos (ver SETUP.md)."};
  if(e&&m[e.error])return m[e.error];
  if(e&&e.error==="server_error")return "Falló el servidor (referencia "+(e.ref||"—")+").";
  if(e instanceof TypeError)return "Sin conexión con el servidor.";
  return "No se pudo completar"+(e&&e.error?" ("+e.error+")":"")+".";
}

/* ---------- trabajador: genera y busca pistas sin trabar la pantalla ---------- */
var TR=null,trId=0,trEsp={};
function directo(op,d){
  if(op==="nivel")return A.nivel(d.n,d.aj);
  if(op==="dia")return A.delDia(d.dia);
  if(op==="pista")return A.pista(d.nv,d.st);
  if(op==="par")return A.resuelve(d.nv,A.inicial(d.nv),d.tope||4000,1);
  return null;
}
try{
  TR=new Worker("bloques-trabajo.js");
  TR.onmessage=function(e){var d=e.data,f=trEsp[d.id];if(!f)return;delete trEsp[d.id];if(d.error)f.mal(d.error);else f.ok(d.r);};
  TR.onerror=function(){TR=null;var p=trEsp;trEsp={};Object.keys(p).forEach(function(k){p[k].mal("worker");});};
}catch(e){TR=null;}
function trabajo(op,datos){
  return new Promise(function(ok,mal){
    function local(){setTimeout(function(){try{ok(directo(op,datos));}catch(x){mal(x);}},20);}
    if(!TR)return local();
    var id=++trId; trEsp[id]={ok:ok,mal:function(){local();}};
    var m={op:op,id:id};for(var k in datos)m[k]=datos[k];
    try{TR.postMessage(m);}catch(x){delete trEsp[id];local();}
  });
}
var CACHE={};
function pideNivel(n,aj){var k=n+":"+aj;if(CACHE[k])return Promise.resolve(CACHE[k]);
  return trabajo("nivel",{n:n,aj:aj}).then(function(nv){if(nv)CACHE[k]=nv;return nv;});}

/* ---------- sonido (sintetizado) ---------- */
var AC=null;
function ac(){if(!P.op.sonido)return null;try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();return AC;}catch(e){return null;}}
function nota(f,t0,dur,tipo,vol,glide){var c=ac();if(!c)return;try{var o=c.createOscillator(),g=c.createGain(),t=c.currentTime+(t0||0);
  o.type=tipo||"sine";o.frequency.setValueAtTime(f,t);if(glide)o.frequency.exponentialRampToValueAtTime(glide,t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol||0.05,t+0.012);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+0.03);}catch(e){}}
function ruido(dur,vol,frec){var c=ac();if(!c)return;try{var n=Math.floor(c.sampleRate*dur),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);
  for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  var s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=b;f.type="bandpass";f.frequency.value=frec||2000;g.gain.value=vol||0.06;
  s.connect(f);f.connect(g);g.connect(c.destination);s.start();}catch(e){}}
var SON={
  coge:function(){nota(500,0,0.07,"triangle",0.045,660);},
  paso:function(){nota(310+Math.random()*50,0,0.035,"sine",0.016);},
  choca:function(){nota(150,0,0.1,"sine",0.06,90);},
  suelta:function(){nota(430,0,0.06,"triangle",0.035,330);},
  sale:function(k){var b=523*Math.pow(1.0595,Math.min(k,14)*2);nota(b,0,0.1,"triangle",0.05);nota(b*1.26,0.06,0.1,"triangle",0.045);nota(b*1.5,0.12,0.2,"triangle",0.045);ruido(0.2,0.025,3800);},
  capa:function(){nota(1320,0,0.3,"sine",0.04);nota(1760,0.06,0.35,"sine",0.03);ruido(0.12,0.03,6000);},
  hielo:function(){ruido(0.3,0.07,5200);nota(1900,0.04,0.25,"sine",0.025,1100);},
  no:function(){nota(196,0,0.12,"square",0.02);nota(165,0.08,0.14,"square",0.018);},
  pista:function(){nota(880,0,0.12,"sine",0.04);nota(1175,0.1,0.2,"sine",0.04);},
  martillo:function(){ruido(0.35,0.14,900);nota(110,0,0.22,"sawtooth",0.035,55);},
  gana:function(){[523,659,784,1047,1319].forEach(function(f,i){nota(f,i*0.08,0.26,"triangle",0.05);});nota(1568,0.46,0.6,"sine",0.04);},
  estrella:function(i){nota(784*Math.pow(1.26,i),0,0.24,"triangle",0.05);nota(1568*Math.pow(1.26,i),0.03,0.2,"sine",0.02);},
  tic:function(){nota(1200,0,0.03,"square",0.012);}
};
function vibra(ms){if(P.op.vibra&&navigator.vibrate)try{navigator.vibrate(ms);}catch(e){}}

/* ---------- modo números: cada color es un resultado y cada bloque una cuenta ---------- */
function numeros(nv){
  var r=A.rng(A.semilla((nv.semilla||"x")+":num:"+P.op.tipoNum)),cols=[],obj={},txt={},usados={};
  function anota(c){if(c>=0&&cols.indexOf(c)<0)cols.push(c);}
  nv.P.forEach(function(p){p.c.forEach(anota);});
  nv.B.forEach(function(b){anota(b.c);anota(b.k);});
  cols.forEach(function(c){var v,t=0;do{v=objetivo(r);t++;}while(usados[v]&&t<60);usados[v]=1;obj[c]=v;});
  nv.B.forEach(function(b,i){txt[i]=cuenta(r,obj[b.c]);if(b.k>=0)txt[i+"k"]=cuenta(r,obj[b.k]);});
  return {obj:obj,txt:txt};
}
function objetivo(r){var t=P.op.tipoNum;
  if(t==="tablas"){return (2+Math.floor(r()*8))*(2+Math.floor(r()*8));}
  if(t==="restas")return 1+Math.floor(r()*19);
  return 2+Math.floor(r()*9);}
function cuenta(r,v){var t=P.op.tipoNum;
  if(t==="tablas"){var ds=[];for(var a=2;a<=9;a++)if(v%a===0&&v/a>=2&&v/a<=9)ds.push(a);var d=ds[Math.floor(r()*ds.length)]||1;return d+"×"+(v/d);}
  if(t==="restas"&&r()<0.5){var b=1+Math.floor(r()*9);return (v+b)+"−"+b;}
  if(v<2)return v+"+0";
  var x=1+Math.floor(r()*(v-1));return x+"+"+(v-x);}

/* ===================== TABLERO (lienzo 3D) ===================== */
var CONT=A.FORMAS.map(function(f){         /* contorno de cada forma (polígono en el sentido del reloj) */
  var set={},ed={},k0=null;
  f.forEach(function(c){set[c[0]+","+c[1]]=1;});
  f.forEach(function(c){var x=c[0],y=c[1];
    if(!set[x+","+(y-1)]){ed[x+","+y]=[x+1,y];k0=k0||x+","+y;}
    if(!set[(x+1)+","+y])ed[(x+1)+","+y]=[x+1,y+1];
    if(!set[x+","+(y+1)])ed[(x+1)+","+(y+1)]=[x,y+1];
    if(!set[(x-1)+","+y])ed[x+","+(y+1)]=[x,y];});
  var pts=[],p=k0.split(",").map(Number),n=0;
  do{pts.push(p);p=ed[p[0]+","+p[1]];n++;}while(p&&(p[0]+","+p[1])!==k0&&n<64);
  var out=[];
  for(var i=0;i<pts.length;i++){var a=pts[(i+pts.length-1)%pts.length],b=pts[i],c=pts[(i+1)%pts.length];
    if((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0])!==0)out.push(b);}
  return out;
});
var CENTRO=A.FORMAS.map(function(f){      /* la celda más centrada (para etiquetas) */
  var mx=0,my=0;f.forEach(function(c){mx+=c[0]+0.5;my+=c[1]+0.5;});mx/=f.length;my/=f.length;
  var mejor=f[0],md=1e9;f.forEach(function(c){var d=Math.pow(c[0]+0.5-mx,2)+Math.pow(c[1]+0.5-my,2);if(d<md){md=d;mejor=c;}});return mejor;});
function nrm(a,b){return [-Math.sign(b[1]-a[1]),Math.sign(b[0]-a[0])];}
function trazo(g,fi,x,y,cs,ins,rad){
  var v=CONT[fi],n=v.length,pts=[],i;
  for(i=0;i<n;i++){var a=v[(i+n-1)%n],b=v[i],c=v[(i+1)%n],n1=nrm(a,b),n2=nrm(b,c);
    pts.push([x+b[0]*cs+(n1[0]+n2[0])*ins,y+b[1]*cs+(n1[1]+n2[1])*ins]);}
  g.beginPath();
  g.moveTo((pts[n-1][0]+pts[0][0])/2,(pts[n-1][1]+pts[0][1])/2);
  for(i=0;i<n;i++){var p=pts[i],q=pts[(i+1)%n];g.arcTo(p[0],p[1],(p[0]+q[0])/2,(p[1]+q[1])/2,rad);}
  g.closePath();
}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
var DIRS={N:[0,-1],S:[0,1],O:[-1,0],E:[1,0]};
function ease(t){return t<0?0:t>1?1:t*t*(3-2*t);}

function crearTablero(cv,cfg){
  var g=cv.getContext("2d"),T={nv:null,st:null,hist:[],movs:[],disp:[],lift:[],sac:[],anims:[],parts:[],textos:[],
    fantasma:null,drag:null,activo:true,t:0,colP:[],raf:0,bokeh:[],ocupado:false,ganado:false,martillo:false,sel:-1,racha:0,ult:0,ult2:0};
  var tema=TEMAS[cfg.tema]||TEMAS.pradera, piel=cfg.piel||"caramelo";
  if(piel==="neon")tema=TEMAS.neon;
  var nums=null;
  for(var i=0;i<16;i++)T.bokeh.push({x:Math.random(),y:Math.random(),r:0.03+Math.random()*0.09,v:0.004+Math.random()*0.012,f:Math.random()*6});

  function mide(){
    if(!T.nv)return;
    var pr=Math.min(2.5,window.devicePixelRatio||1),wrap=cv.parentNode,cw=Math.max(200,wrap.clientWidth);
    var maxH=cfg.alto?cfg.alto:Math.max(280,(window.innerHeight||700)-(cfg.reserva||250));
    var mW=T.nv.W+1.25,mH=T.nv.H+1.6,cs=Math.min(cw/mW,maxH/mH,80);
    T.cs=cs;T.dz=cs*(piel==="neon"?0.1:0.17);T.rt=cs*0.42;
    var w=Math.floor(cs*mW),h=Math.floor(cs*mH);
    cv.style.width=w+"px";cv.style.height=h+"px";cv.width=Math.round(w*pr);cv.height=Math.round(h*pr);
    T.pr=pr;T.w=w;T.h=h;T.ox=(w-T.nv.W*cs)/2;T.oy=cs*0.74;
  }
  function carga(nv,st){
    T.nv=nv;T.st=st||A.inicial(nv);T.hist=[];T.movs=[];T.anims=[];T.parts=[];T.textos=[];T.fantasma=null;T.drag=null;T.ganado=false;T.ocupado=false;T.racha=0;
    T.disp=[];T.lift=[];T.sac=[];T.esc=[];
    for(var b=0;b<nv.B.length;b++){T.disp.push({x:T.st.x[b],y:T.st.y[b],vx:0,vy:0});T.lift.push({z:0,v:0});T.sac.push(0);T.esc.push(0);}
    T.colP=nv.P.map(function(p){return {c:A.colorPuerta(p,T.st.mov),de:A.colorPuerta(p,T.st.mov),t:1};});
    nums=cfg.numeros?numeros(nv):null;
    mide();
    /* entrada: los bloques caen en su sitio uno tras otro */
    for(b=0;b<nv.B.length;b++){T.lift[b].z=2.2+b*0.35;T.esc[b]=0;}
    if(!T.raf)T.raf=requestAnimationFrame(cuadro);
  }

  /* ---------- color de un bloque ---------- */
  function colDe(c){return cfg.soloNum?NEUTRO:COL[c]||NEUTRO;}

  /* ---------- dibujo ---------- */
  function fondo(){
    var W=T.w,H=T.h,gr=g.createLinearGradient(0,0,W*0.3,H);
    gr.addColorStop(0,tema.c1);gr.addColorStop(1,tema.c2);g.fillStyle=gr;g.fillRect(0,0,W,H);
    for(var i=0;i<T.bokeh.length;i++){var k=T.bokeh[i],y=((k.y-T.t*k.v)%1+1)%1,x=k.x+Math.sin(T.t*0.4+k.f)*0.02,r=k.r*W;
      var rg=g.createRadialGradient(x*W,y*H,0,x*W,y*H,r);
      var a=tema.oscuro?0.25+0.2*Math.sin(T.t*2+k.f):0.28;
      rg.addColorStop(0,"rgba("+tema.bok+","+a+")");rg.addColorStop(1,"rgba("+tema.bok+",0)");g.fillStyle=rg;
      g.beginPath();g.arc(x*W,y*H,r,0,Math.PI*2);g.fill();
      if(tema.oscuro&&i%2===0){g.fillStyle="rgba(255,255,255,"+(0.5+0.5*Math.sin(T.t*3+k.f))+")";g.fillRect(((k.x*7.3)%1)*W,((k.y*3.1)%1)*H,1.5,1.5);}
    }
  }
  function marco(){
    var cs=T.cs,rt=T.rt,nv=T.nv,x=T.ox-rt,y=T.oy-rt,w=nv.W*cs+2*rt,h=nv.H*cs+2*rt,prof=cs*0.24;
    g.save();g.shadowColor="rgba(10,10,40,.35)";g.shadowBlur=cs*0.5;g.shadowOffsetY=cs*0.3;
    rr(g,x,y+prof,w,h,rt*0.9);g.fillStyle=tema.b2;g.fill();g.restore();
    rr(g,x,y,w,h,rt*0.9);var gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,mezclaHex(tema.b1,"#ffffff",0.25));gr.addColorStop(1,tema.b1);g.fillStyle=gr;g.fill();
    g.strokeStyle="rgba(255,255,255,.35)";g.lineWidth=1.5;rr(g,x+1.5,y+1.5,w-3,h-3,rt*0.85);g.stroke();
    /* suelo */
    rr(g,T.ox,T.oy,nv.W*cs,nv.H*cs,cs*0.14);g.fillStyle=tema.s2;g.fill();
    g.save();rr(g,T.ox,T.oy,nv.W*cs,nv.H*cs,cs*0.14);g.clip();
    for(var cy=0;cy<nv.H;cy++)for(var cx=0;cx<nv.W;cx++){
      if(nv.m[cy*nv.W+cx])continue;
      rr(g,T.ox+cx*cs+cs*0.04,T.oy+cy*cs+cs*0.04,cs*0.92,cs*0.92,cs*0.12);
      g.fillStyle=(cx+cy)%2?tema.s1:mezclaHex(tema.s1,tema.s2,0.55);g.fill();
    }
    var sh=g.createLinearGradient(0,T.oy,0,T.oy+cs*0.5);sh.addColorStop(0,"rgba(0,0,0,.18)");sh.addColorStop(1,"rgba(0,0,0,0)");
    g.fillStyle=sh;g.fillRect(T.ox,T.oy,nv.W*cs,cs*0.5);
    var sl=g.createLinearGradient(T.ox,0,T.ox+cs*0.35,0);sl.addColorStop(0,"rgba(0,0,0,.12)");sl.addColorStop(1,"rgba(0,0,0,0)");
    g.fillStyle=sl;g.fillRect(T.ox,T.oy,cs*0.35,nv.H*cs);
    g.restore();
  }
  function rectPuerta(p){
    var cs=T.cs,rt=T.rt,nv=T.nv;
    if(p.s==="N")return {x:T.ox+p.a*cs,y:T.oy-rt,w:p.l*cs,h:rt};
    if(p.s==="S")return {x:T.ox+p.a*cs,y:T.oy+nv.H*cs,w:p.l*cs,h:rt};
    if(p.s==="O")return {x:T.ox-rt,y:T.oy+p.a*cs,w:rt,h:p.l*cs};
    return {x:T.ox+nv.W*cs,y:T.oy+p.a*cs,w:rt,h:p.l*cs};
  }
  function colorP(pi){var c=T.colP[pi];if(!c)return COL[0].h;var a=colDe(c.de).h,b=colDe(c.c).h;return c.t>=1?b:mezclaHex(a,b,ease(c.t));}
  function puertas(){
    var cs=T.cs,nv=T.nv,dc=T.drag?T.st.c[T.drag.b]:-1;
    for(var pi=0;pi<nv.P.length;pi++){
      var p=nv.P[pi],r=rectPuerta(p),col=colorP(pi),cP=T.colP[pi].c,d=DIRS[p.s],brilla=dc>=0&&dc===cP;
      g.save();
      if(brilla||piel==="neon"){g.shadowColor=col;g.shadowBlur=cs*(brilla?0.6+0.25*Math.sin(T.t*8):0.35);}
      rr(g,r.x+1,r.y+1,r.w-2,r.h-2,cs*0.08);
      var gr=d[0]?g.createLinearGradient(r.x,0,r.x+r.w,0):g.createLinearGradient(0,r.y,0,r.y+r.h);
      var claro=mezclaHex(col,"#ffffff",0.45),osc=mezclaHex(col,"#000000",0.25);
      if(d[0]<0||d[1]<0){gr.addColorStop(0,claro);gr.addColorStop(1,osc);}else{gr.addColorStop(0,osc);gr.addColorStop(1,claro);}
      g.fillStyle=gr;g.fill();g.restore();
      /* flechas que laten hacia fuera */
      g.save();rr(g,r.x+1,r.y+1,r.w-2,r.h-2,cs*0.08);g.clip();
      g.strokeStyle="rgba(255,255,255,.85)";g.lineWidth=Math.max(1.5,cs*0.05);g.lineCap="round";g.lineJoin="round";
      var largo=d[0]?r.h:r.w,n=Math.max(1,Math.round(largo/cs)),k,ch=cs*0.13;
      for(k=0;k<n;k++){var f=((T.t*0.9+k*0.37)%1);
        var cx=d[0]?r.x+r.w*(d[0]>0?f:1-f):r.x+(k+0.5)*r.w/n, cy=d[0]?r.y+(k+0.5)*r.h/n:r.y+r.h*(d[1]>0?f:1-f);
        g.globalAlpha=Math.sin(f*Math.PI)*0.9;
        g.beginPath();g.moveTo(cx-d[0]*ch-d[1]*ch,cy-d[1]*ch-d[0]*ch);g.lineTo(cx,cy);g.lineTo(cx-d[0]*ch+d[1]*ch,cy-d[1]*ch+d[0]*ch);g.stroke();}
      g.restore();
      /* postes */
      g.fillStyle=mezclaHex(col,"#000000",0.3);
      if(d[0]){rr(g,r.x-1,r.y-cs*0.05,r.w+2,cs*0.1,cs*0.05);g.fill();rr(g,r.x-1,r.y+r.h-cs*0.05,r.w+2,cs*0.1,cs*0.05);g.fill();}
      else{rr(g,r.x-cs*0.05,r.y-1,cs*0.1,r.h+2,cs*0.05);g.fill();rr(g,r.x+r.w-cs*0.05,r.y-1,cs*0.1,r.h+2,cs*0.05);g.fill();}
      /* etiqueta: número o símbolo, por fuera */
      var lx=r.x+r.w/2+d[0]*r.w*0.25,ly=r.y+r.h/2+d[1]*r.h*0.25;
      if(nums||cfg.simbolos){
        var rad=cs*(nums?0.27:0.2);
        g.save();g.shadowColor="rgba(0,0,0,.25)";g.shadowBlur=4;g.beginPath();g.arc(lx,ly,rad,0,Math.PI*2);g.fillStyle="#fff";g.fill();g.restore();
        g.lineWidth=2;g.strokeStyle=col;g.stroke();
        if(nums){g.fillStyle="#2b2340";g.font="800 "+Math.round(cs*(String(nums.obj[cP]).length>2?0.22:0.27))+"px system-ui,sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(nums.obj[cP],lx,ly+1);}
        else{g.fillStyle=col;simbolo(g,cP,lx,ly,rad*0.6);g.fill();}
      }
      /* puerta que alterna: el color que tendrá en la próxima jugada */
      if(p.c.length>1){var sig=A.colorPuerta(p,T.st.mov+1),qx=lx+(d[1]?r.w*0.32:0),qy=ly+(d[0]?r.h*0.32:0);
        g.beginPath();g.arc(qx,qy,cs*0.11,0,Math.PI*2);g.fillStyle=colDe(sig).h;g.fill();g.lineWidth=2;g.strokeStyle="#fff";g.stroke();
        g.fillStyle="#fff";g.font="700 "+Math.round(cs*0.12)+"px system-ui";g.textAlign="center";g.textBaseline="middle";g.fillText("↻",qx,qy+0.5);}
    }
  }
  function rieles(){
    var cs=T.cs,nv=T.nv;
    for(var b=0;b<nv.B.length;b++){if(!T.st.vivo[b]||!nv.B[b].e)continue;
      var dm=A.DIM[nv.B[b].f],d=T.disp[b];
      g.strokeStyle=tema.oscuro?"rgba(160,170,255,.35)":"rgba(90,70,40,.22)";g.lineWidth=Math.max(2,cs*0.06);g.lineCap="round";
      g.beginPath();
      if(nv.B[b].e===1){var y1=T.oy+(d.y+dm.h*0.5)*cs;g.moveTo(T.ox+cs*0.2,y1-cs*0.16);g.lineTo(T.ox+nv.W*cs-cs*0.2,y1-cs*0.16);g.moveTo(T.ox+cs*0.2,y1+cs*0.16);g.lineTo(T.ox+nv.W*cs-cs*0.2,y1+cs*0.16);}
      else{var x1=T.ox+(d.x+dm.w*0.5)*cs;g.moveTo(x1-cs*0.16,T.oy+cs*0.2);g.lineTo(x1-cs*0.16,T.oy+nv.H*cs-cs*0.2);g.moveTo(x1+cs*0.16,T.oy+cs*0.2);g.lineTo(x1+cs*0.16,T.oy+nv.H*cs-cs*0.2);}
      g.stroke();}
  }
  /* un bloque en 3D. o: {lift, alfa, capa, hielo, eje, txt, sim, esc} */
  function bloque(fi,px,py,col,o){
    var cs=T.cs,lift=o.lift||0,dz=T.dz*(1+lift*1.1),ins=cs*0.055,rad=cs*0.19,dm=A.DIM[fi],f=A.FORMAS[fi],i;
    g.save();
    if(o.alfa!=null)g.globalAlpha=o.alfa;
    if(o.esc&&o.esc!==1){var cx=px+dm.w*cs/2,cy=py+dm.h*cs/2;g.translate(cx,cy);g.scale(o.esc,o.esc);g.translate(-cx,-cy);}
    /* sombra */
    g.save();g.shadowColor="rgba(15,15,45,"+(0.3+lift*0.12)+")";g.shadowBlur=cs*(0.16+lift*0.4);g.shadowOffsetY=cs*(0.07+lift*0.3);
    trazo(g,fi,px,py,cs,ins,rad);g.fillStyle=col.o;g.fill();g.restore();
    /* lateral en relieve */
    var paso=Math.max(1,dz/7);
    for(var k=0;k<dz;k+=paso){trazo(g,fi,px,py-k,cs,ins,rad);g.fillStyle=k<paso?mezclaHex(col.o,"#000000",0.15):col.o;g.fill();}
    var top=py-dz;
    if(piel==="neon"){
      trazo(g,fi,px,top,cs,ins,rad);g.fillStyle=rgba(col.h,0.22);g.fill();
      g.save();g.shadowColor=col.h;g.shadowBlur=cs*0.35;g.strokeStyle=col.l;g.lineWidth=Math.max(2,cs*0.06);trazo(g,fi,px,top,cs,ins+1,rad);g.stroke();g.restore();
      g.strokeStyle=rgba(col.h,0.35);g.lineWidth=1;
      for(i=0;i<f.length;i++){rr(g,px+f[i][0]*cs+cs*0.22,top+f[i][1]*cs+cs*0.22,cs*0.56,cs*0.56,cs*0.1);g.stroke();}
    }else{
      trazo(g,fi,px,top,cs,ins,rad);
      var gr=g.createLinearGradient(px,top,px+cs*0.5,top+dm.h*cs);
      gr.addColorStop(0,col.l);gr.addColorStop(0.32,col.h);gr.addColorStop(1,mezclaHex(col.h,"#000000",0.12));
      g.fillStyle=gr;
      if(piel==="cristal")g.globalAlpha*=0.86;
      g.fill();
      if(piel==="cristal")g.globalAlpha/=0.86;
      /* bisel: luz arriba a la izquierda y sombra abajo a la derecha */
      g.save();trazo(g,fi,px,top,cs,ins,rad);g.clip();
      var s=cs*0.045;g.lineWidth=s*2.2;
      g.strokeStyle="rgba(255,255,255,.5)";trazo(g,fi,px+s,top+s,cs,ins,rad);g.stroke();
      g.strokeStyle="rgba(0,0,0,.14)";trazo(g,fi,px-s,top-s,cs,ins,rad);g.stroke();
      if(piel==="cristal"){
        g.globalAlpha*=0.5;g.fillStyle="#fff";g.beginPath();
        var x0=px+dm.w*cs*0.1,w0=cs*0.28;g.moveTo(x0,top+dm.h*cs);g.lineTo(x0+w0,top+dm.h*cs);g.lineTo(x0+w0+dm.h*cs*0.6,top);g.lineTo(x0+dm.h*cs*0.6,top);g.closePath();g.fill();
        g.globalAlpha*=0.5;g.beginPath();x0+=w0*1.7;g.moveTo(x0,top+dm.h*cs);g.lineTo(x0+w0*0.4,top+dm.h*cs);g.lineTo(x0+w0*0.4+dm.h*cs*0.6,top);g.lineTo(x0+dm.h*cs*0.6,top);g.closePath();g.fill();
      }
      g.restore();
      if(piel==="caramelo"&&!o.capa){
        var c0e=CENTRO[fi],conEt=o.txt||o.sim!=null||o.hielo>0||o.eje;
        for(i=0;i<f.length;i++){if(conEt&&f[i][0]===c0e[0]&&f[i][1]===c0e[1])continue;var sx=px+(f[i][0]+0.5)*cs,sy=top+(f[i][1]+0.5)*cs,sr=cs*0.2;
          g.beginPath();g.arc(sx,sy+cs*0.035,sr,0,Math.PI*2);g.fillStyle=rgba(col.o,0.45);g.fill();
          var rg=g.createRadialGradient(sx-sr*0.35,sy-sr*0.4,sr*0.1,sx,sy,sr);rg.addColorStop(0,col.l);rg.addColorStop(1,col.h);
          g.beginPath();g.arc(sx,sy,sr,0,Math.PI*2);g.fillStyle=rg;g.fill();
          g.beginPath();g.ellipse(sx-sr*0.3,sy-sr*0.38,sr*0.38,sr*0.2,-0.5,0,Math.PI*2);g.fillStyle="rgba(255,255,255,.55)";g.fill();}
      }
    }
    /* capa: el bloque de dentro se ve como una gema en el centro */
    if(o.capa){var ci=colDe(o.capa),ii=ins+cs*0.2;
      g.save();trazo(g,fi,px,top,cs,ii,rad*0.7);g.shadowColor="rgba(0,0,0,.35)";g.shadowBlur=cs*0.12;g.shadowOffsetY=cs*0.03;
      var gi=g.createLinearGradient(px,top,px+dm.w*cs,top+dm.h*cs);gi.addColorStop(0,ci.l);gi.addColorStop(0.5,ci.h);gi.addColorStop(1,ci.o);g.fillStyle=gi;g.fill();g.restore();
      g.strokeStyle="rgba(255,255,255,.7)";g.lineWidth=1.5;trazo(g,fi,px,top,cs,ii,rad*0.7);g.stroke();
      g.fillStyle="rgba(255,255,255,.45)";trazo(g,fi,px-cs*0.04,top-cs*0.04,cs,ii+cs*0.12,rad*0.4);g.fill();}
    var c0=CENTRO[fi],lx=px+(c0[0]+0.5)*cs,ly=top+(c0[1]+0.5)*cs;
    /* raíl: flechas grabadas */
    if(o.eje){g.save();g.translate(lx,ly);if(o.eje===2)g.rotate(Math.PI/2);
      g.strokeStyle="rgba(255,255,255,.95)";g.lineWidth=Math.max(2,cs*0.07);g.lineCap="round";g.lineJoin="round";g.shadowColor="rgba(0,0,0,.35)";g.shadowBlur=3;
      var L=cs*0.3,h2=cs*0.11;g.beginPath();g.moveTo(-L,0);g.lineTo(L,0);g.moveTo(-L+h2,-h2);g.lineTo(-L,0);g.lineTo(-L+h2,h2);g.moveTo(L-h2,-h2);g.lineTo(L,0);g.lineTo(L-h2,h2);g.stroke();g.restore();}
    /* etiqueta */
    if(o.txt){var fs=cs*(o.txt.length>4?0.24:o.txt.length>3?0.28:0.32);
      g.font="900 "+Math.round(fs)+"px system-ui,sans-serif";g.textAlign="center";g.textBaseline="middle";
      g.lineWidth=Math.max(2.5,cs*0.07);g.strokeStyle=cfg.soloNum?"#fff":"rgba(30,20,50,.55)";g.strokeText(o.txt,lx,ly+1);
      g.fillStyle=cfg.soloNum?"#2b2340":"#fff";g.fillText(o.txt,lx,ly+1);}
    else if(o.sim!=null){g.save();g.shadowColor="rgba(0,0,0,.4)";g.shadowBlur=3;simbolo(g,o.sim,lx,ly+(o.eje?cs*0.24:0),cs*0.15);g.fillStyle="#fff";g.fill();g.restore();}
    /* hielo */
    if(o.hielo>0){
      trazo(g,fi,px,top,cs,ins,rad);g.fillStyle="rgba(228,245,255,"+(0.66*(o.deshielo!=null?1-o.deshielo:1))+")";g.fill();
      g.save();trazo(g,fi,px,top,cs,ins,rad);g.clip();g.strokeStyle="rgba(255,255,255,.95)";g.lineWidth=1.4;
      for(i=0;i<f.length;i++){var qx=px+f[i][0]*cs,qy=top+f[i][1]*cs;g.beginPath();g.moveTo(qx+cs*0.15,qy+cs*0.2);g.lineTo(qx+cs*0.45,qy+cs*0.4);g.lineTo(qx+cs*0.4,qy+cs*0.7);g.moveTo(qx+cs*0.45,qy+cs*0.4);g.lineTo(qx+cs*0.8,qy+cs*0.3);g.stroke();}
      g.restore();
      if(o.deshielo==null){g.beginPath();g.arc(lx,ly,cs*0.21,0,Math.PI*2);g.fillStyle="#fff";g.fill();g.lineWidth=2;g.strokeStyle="#5aa9e6";g.stroke();
        g.fillStyle="#1f6fb2";g.font="900 "+Math.round(cs*0.26)+"px system-ui";g.textAlign="center";g.textBaseline="middle";g.fillText(o.hielo,lx,ly+1);}
    }
    if(o.sel){g.strokeStyle="rgba(255,255,255,.95)";g.lineWidth=3;g.setLineDash([6,5]);g.lineDashOffset=-T.t*30;trazo(g,fi,px,top,cs,ins-2,rad);g.stroke();g.setLineDash([]);}
    g.restore();
  }
  function roca(cx,cy){
    var cs=T.cs,px=T.ox+cx*cs,py=T.oy+cy*cs,col=tema.oscuro?{h:"#5a5f8c",l:"#8a90c4",o:"#2f3360"}:ROCA;
    bloque(0,px,py,col,{});
    var r=A.rng(cx*31+cy*17+7);g.fillStyle="rgba(0,0,0,.15)";
    for(var i=0;i<5;i++){g.beginPath();g.arc(px+cs*(0.2+r()*0.6),py-T.dz+cs*(0.2+r()*0.6),cs*(0.03+r()*0.04),0,Math.PI*2);g.fill();}
  }
  function opcionesBloque(b){
    var B=T.nv.B[b],st=T.st,o={lift:T.lift[b].z,eje:B.e||0,esc:1};
    if(st.k[b]>=0)o.capa=st.k[b];
    var falta=(B.h||0)-st.sal; if(falta>0)o.hielo=falta;
    if(T.deshielo&&T.deshielo[b]!=null){o.hielo=1;o.deshielo=T.deshielo[b];}
    if(nums){o.txt=st.k[b]>=0||B.k<0?nums.txt[b]:nums.txt[b+"k"];}
    else if(cfg.simbolos)o.sim=st.c[b];
    if(T.martillo)o.sel=true;
    var e=T.esc[b];if(e<1)o.esc=0.6+0.4*ease(e);
    return o;
  }
  function piezas(){
    var nv=T.nv,cs=T.cs,lista=[],b,i;
    for(i=0;i<nv.W*nv.H;i++)if(nv.m[i])lista.push({k:Math.floor(i/nv.W)+1,roca:i});
    for(b=0;b<nv.B.length;b++)if(T.st.vivo[b]||T.anims.some(function(a){return a.b===b&&a.tipo==="ruta";})){
      var dm=A.DIM[nv.B[b].f];lista.push({k:T.disp[b].y+dm.h+(T.lift[b].z>0.05?50:0),b:b});}
    lista.sort(function(a,c){return a.k-c.k;});
    for(i=0;i<lista.length;i++){var it=lista[i];
      if(it.roca!=null){roca(it.roca%nv.W,Math.floor(it.roca/nv.W));continue;}
      b=it.b;var d=T.disp[b],sx=0,sy=0;
      if(T.sac[b]>0){var s=Math.sin(T.sac[b]*40)*T.sac[b]*cs*0.5;sx=s;}
      bloque(nv.B[b].f,T.ox+d.x*cs+sx,T.oy+d.y*cs+sy,colDe(T.st.c[b]),opcionesBloque(b));}
  }
  function animaciones(){
    var cs=T.cs,nv=T.nv;
    for(var i=0;i<T.anims.length;i++){var a=T.anims[i];
      if(a.tipo!=="sale"&&a.tipo!=="capa")continue;
      var p=nv.P[a.pi],r=rectPuerta(p),d=DIRS[p.s],t=a.t/a.dur,dm=A.DIM[a.fi],dist=(d[0]?dm.w:dm.h)+0.6;
      var e=t*t*(2.2-1.2*t),x=T.ox+(a.x+d[0]*dist*e)*cs,y=T.oy+(a.y+d[1]*dist*e)*cs;
      g.save();g.beginPath();g.rect(T.ox,T.oy-T.dz*3,nv.W*cs,nv.H*cs+T.dz*3);
      g.rect(r.x,r.y-T.dz*3,r.w,r.h+T.dz*3);g.clip();
      bloque(a.fi,x,y,colDe(a.c),{alfa:Math.max(0,1-Math.max(0,t-0.55)/0.45),capa:a.capa,txt:a.txt,sim:cfg.simbolos&&!nums?a.c:null,esc:a.tipo==="capa"?1+t*0.15:1});
      g.restore();}
  }
  function fantasma(){
    var f=T.fantasma;if(!f)return;
    var m=f.m,b=m[0],nv=T.nv,cs=T.cs,B=nv.B[b],dm=A.DIM[B.f],al=0.55+0.45*Math.sin(T.t*6),col=colDe(T.st.c[b]);
    g.save();g.globalAlpha=al;g.setLineDash([7,6]);g.lineDashOffset=-T.t*40;g.lineWidth=3;g.strokeStyle="#fff";
    trazo(g,B.f,T.ox+m[1]*cs,T.oy+m[2]*cs,cs,cs*0.06,cs*0.18);g.fillStyle=rgba(col.h,0.35);g.fill();g.stroke();g.setLineDash([]);
    var d=T.disp[b],x0=T.ox+(d.x+dm.w/2)*cs,y0=T.oy+(d.y+dm.h/2)*cs-T.dz,x1=T.ox+(m[1]+dm.w/2)*cs,y1=T.oy+(m[2]+dm.h/2)*cs;
    if(m[3]>=0){var r=rectPuerta(nv.P[m[3]]);x1=r.x+r.w/2;y1=r.y+r.h/2;}
    if(Math.abs(x1-x0)+Math.abs(y1-y0)>4){
      g.strokeStyle="#fff";g.lineWidth=Math.max(3,cs*0.09);g.lineCap="round";g.shadowColor="rgba(0,0,0,.35)";g.shadowBlur=6;
      var mx=(x0+x1)/2-(y1-y0)*0.15,my=(y0+y1)/2+(x1-x0)*0.15;
      g.beginPath();g.moveTo(x0,y0);g.quadraticCurveTo(mx,my,x1,y1);g.stroke();
      var an=Math.atan2(y1-my,x1-mx),h=cs*0.22;g.beginPath();g.moveTo(x1,y1);g.lineTo(x1-Math.cos(an-0.5)*h,y1-Math.sin(an-0.5)*h);g.moveTo(x1,y1);g.lineTo(x1-Math.cos(an+0.5)*h,y1-Math.sin(an+0.5)*h);g.stroke();}
    /* manita la primera vez */
    if(f.mano){var tt=(T.t*0.7)%1,hx=x0+(x1-x0)*ease(tt),hy=y0+(y1-y0)*ease(tt);g.globalAlpha=1;g.shadowBlur=0;g.font=Math.round(cs*0.6)+"px system-ui";g.textAlign="center";g.textBaseline="top";g.fillText("👆",hx+cs*0.1,hy);}
    g.restore();
  }
  function particulas(dt){
    for(var i=T.parts.length-1;i>=0;i--){var p=T.parts[i];p.t+=dt;if(p.t>p.vida){T.parts.splice(i,1);continue;}
      p.vy+=(p.gr||0)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;
      var a=1-p.t/p.vida;g.save();g.globalAlpha=a;g.translate(p.x,p.y);g.rotate(p.rot);g.fillStyle=p.c;
      if(p.forma===1){g.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);}else if(p.forma===2){g.beginPath();for(var k=0;k<8;k++){var an=k*Math.PI/4,rr2=k%2?p.s*0.25:p.s*0.6;g.lineTo(Math.cos(an)*rr2,Math.sin(an)*rr2);}g.closePath();g.fill();}
      else{g.beginPath();g.arc(0,0,p.s/2,0,Math.PI*2);g.fill();}
      g.restore();}
    for(i=T.textos.length-1;i>=0;i--){var x=T.textos[i];x.t+=dt;if(x.t>1.3){T.textos.splice(i,1);continue;}
      g.save();g.globalAlpha=Math.min(1,(1.3-x.t)*2);g.font="900 "+Math.round(T.cs*0.42*(1+Math.max(0,0.3-x.t)))+"px system-ui";g.textAlign="center";g.textBaseline="middle";
      g.lineWidth=4;g.strokeStyle="rgba(40,20,70,.6)";g.strokeText(x.s,x.x,x.y-x.t*T.cs*0.8);g.fillStyle=x.c||"#fff";g.fillText(x.s,x.x,x.y-x.t*T.cs*0.8);g.restore();}
  }
  function chispas(x,y,col,n,fuerza,dir){
    for(var i=0;i<n;i++){var an=dir?Math.atan2(dir[1],dir[0])+(Math.random()-0.5)*2.2:Math.random()*Math.PI*2,v=(0.4+Math.random())*fuerza;
      T.parts.push({x:x,y:y,vx:Math.cos(an)*v,vy:Math.sin(an)*v,gr:T.cs*6,t:0,vida:0.5+Math.random()*0.6,s:T.cs*(0.08+Math.random()*0.12),
        c:Math.random()<0.25?"#ffffff":col,rot:Math.random()*6,vr:(Math.random()-0.5)*12,forma:i%3});}
  }
  function confeti(){
    var cols=COL.map(function(c){return c.h;});
    for(var i=0;i<90;i++)T.parts.push({x:Math.random()*T.w,y:-Math.random()*T.h*0.3,vx:(Math.random()-0.5)*T.cs*2,vy:T.cs*(1+Math.random()*3),gr:T.cs*2.5,t:0,vida:2+Math.random()*1.5,
      s:T.cs*(0.12+Math.random()*0.12),c:cols[i%cols.length],rot:Math.random()*6,vr:(Math.random()-0.5)*10,forma:1});
  }

  /* ---------- simulación de la animación ---------- */
  function actualiza(dt){
    var nv=T.nv,b,i;
    for(b=0;b<nv.B.length;b++){
      var d=T.disp[b],tx=T.st.x[b],ty=T.st.y[b];
      if(T.drag&&T.drag.b===b){tx=T.drag.fx;ty=T.drag.fy;}
      var ru=null;for(i=0;i<T.anims.length;i++)if(T.anims[i].tipo==="ruta"&&T.anims[i].b===b)ru=T.anims[i];
      if(ru){var k=Math.min(ru.pts.length-1,ru.t*ru.vel),k0=Math.floor(k),fr=k-k0,p0=ru.pts[k0],p1=ru.pts[Math.min(ru.pts.length-1,k0+1)];
        d.x=p0[0]+(p1[0]-p0[0])*fr;d.y=p0[1]+(p1[1]-p0[1])*fr;d.vx=d.vy=0;}
      else if(T.drag&&T.drag.b===b){d.x+=(tx-d.x)*Math.min(1,dt*28);d.y+=(ty-d.y)*Math.min(1,dt*28);}
      else{var K=240,C=27;d.vx+=((tx-d.x)*K-d.vx*C)*dt;d.vy+=((ty-d.y)*K-d.vy*C)*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;}
      var L=T.lift[b],lt=(T.drag&&T.drag.b===b)?1:0;L.v+=((lt-L.z)*300-L.v*(lt?30:17))*dt;L.z+=L.v*dt;if(!lt&&L.z<0&&L.v<0){L.z=0;L.v=-L.v*0.25;}
      if(T.sac[b]>0)T.sac[b]=Math.max(0,T.sac[b]-dt*1.6);
      if(T.esc[b]<1)T.esc[b]=Math.min(1,T.esc[b]+dt*3);
    }
    if(T.deshielo)for(b in T.deshielo){T.deshielo[b]+=dt*1.5;if(T.deshielo[b]>=1)delete T.deshielo[b];}
    for(i=0;i<T.colP.length;i++)if(T.colP[i].t<1)T.colP[i].t=Math.min(1,T.colP[i].t+dt*4);
    for(i=T.anims.length-1;i>=0;i--){var a=T.anims[i];a.t+=dt;
      if(a.tipo==="ruta"){if(a.t*a.vel>=a.pts.length-1){T.anims.splice(i,1);a.fin();}}
      else if(a.t>=a.dur){T.anims.splice(i,1);if(a.fin)a.fin();}
      else if(!a.chispa&&a.t>a.dur*0.45&&(a.tipo==="sale"||a.tipo==="capa")){a.chispa=true;
        var r=rectPuerta(nv.P[a.pi]),dd=DIRS[nv.P[a.pi].s];chispas(r.x+r.w/2,r.y+r.h/2,colDe(a.c).h,a.tipo==="capa"?14:26,T.cs*4,dd);}
    }
    if(T.fantasma){T.fantasma.t+=dt;if(T.fantasma.t>(T.fantasma.mano?60:4.5))T.fantasma=null;}
  }
  function dibuja(){
    g.setTransform(T.pr,0,0,T.pr,0,0);
    fondo();marco();rieles();piezas();animaciones();puertas();fantasma();particulas(T.dtu||0.016);
  }
  function cuadro(ts){
    if(!T.activo||!cv.isConnected){T.raf=0;return;}
    var dt=Math.min(0.05,(ts-(T.ult||ts))/1000);T.ult=ts;T.t+=dt;T.dtu=dt;
    if(T.nv){actualiza(dt);dibuja();}
    T.raf=requestAnimationFrame(cuadro);
  }

  /* ---------- jugadas ---------- */
  function commit(m,ns,extra){
    var antes=T.st;
    T.hist.push({st:antes,m:m});if(m)T.movs.push(m);
    T.st=ns;T.fantasma=null;
    /* deshielo */
    for(var b=0;b<T.nv.B.length;b++){var h=T.nv.B[b].h||0;if(h&&antes.sal<h&&ns.sal>=h&&ns.vivo[b]){T.deshielo=T.deshielo||{};T.deshielo[b]=0;SON.hielo();
      var d=T.disp[b],dm=A.DIM[T.nv.B[b].f];chispas(T.ox+(d.x+dm.w/2)*T.cs,T.oy+(d.y+dm.h/2)*T.cs-T.dz,"#dff3ff",16,T.cs*2.5);}}
    /* puertas que alternan */
    for(var pi=0;pi<T.nv.P.length;pi++){var c0=A.colorPuerta(T.nv.P[pi],antes.mov),c1=A.colorPuerta(T.nv.P[pi],ns.mov);if(c0!==c1)T.colP[pi]={de:c0,c:c1,t:0};}
    if(cfg.alMover)cfg.alMover(T,extra);
    if(A.resuelto(ns)&&!T.ganado){T.ganado=true;T.ocupado=true;
      setTimeout(function(){confeti();SON.gana();vibra([20,40,30]);setTimeout(function(){if(cfg.alGanar)cfg.alGanar(T);},900);},450);}
  }
  function sacude(b){T.sac[b]=0.35;SON.no();vibra(8);}
  function sale(b,m){
    var ns=A.aplica(T.nv,T.st,m);
    if(!ns){sacude(b);return false;}
    var capa=T.st.k[b]>=0, d=T.disp[b], txt=nums?(T.st.k[b]>=0||T.nv.B[b].k<0?nums.txt[b]:nums.txt[b+"k"]):null;
    T.disp[b].x=m[1];T.disp[b].y=m[2];
    T.anims.push({tipo:capa?"capa":"sale",b:b,fi:T.nv.B[b].f,c:T.st.c[b],capa:capa?null:(T.st.k[b]>=0?T.st.k[b]:null),txt:txt,x:m[1],y:m[2],pi:m[3],t:0,dur:capa?0.5:0.42});
    T.racha++;
    var ahora=performance.now();if(ahora-T.ult2>3500)T.racha=1;T.ult2=ahora;
    if(capa)SON.capa();else SON.sale(T.racha);
    vibra(capa?10:16);
    var r=rectPuerta(T.nv.P[m[3]]);
    if(!capa&&T.racha>=3){var fr=["¡Bien!","¡Genial!","¡Increíble!","¡Imparable!"][Math.min(3,T.racha-3)];T.textos.push({s:fr,x:Math.min(T.w-60,Math.max(60,r.x+r.w/2)),y:Math.min(T.h-30,Math.max(30,r.y+r.h/2)),t:0});}
    commit(m,ns,{tipo:capa?"capa":"sale"});
    return true;
  }
  /* camino de casillas para enviar un bloque solo hasta su puerta */
  function camino(o,fi,x0,y0,x1,y1,eje){
    var W=T.nv.W,prev={},cola=[[x0,y0]],q=0,k0=x0+","+y0,dirs=eje===1?[[1,0],[-1,0]]:eje===2?[[0,1],[0,-1]]:[[1,0],[-1,0],[0,1],[0,-1]];
    prev[k0]=null;
    while(q<cola.length){var c=cola[q++];if(c[0]===x1&&c[1]===y1)break;
      for(var i=0;i<dirs.length;i++){var nx=c[0]+dirs[i][0],ny=c[1]+dirs[i][1],k=nx+","+ny;if(prev[k]!==undefined||!A.cabe(T.nv,o,fi,nx,ny))continue;prev[k]=c;cola.push([nx,ny]);}}
    var out=[],p=[x1,y1];while(p){out.unshift(p);p=prev[p[0]+","+p[1]];}
    return out;
  }
  function envia(b,m){
    var o=A.ocupa(T.nv,T.st,b),B=T.nv.B[b],pts=camino(o,B.f,T.st.x[b],T.st.y[b],m[1],m[2],B.e||0);
    T.ocupado=true;
    var fin=function(){T.ocupado=false;if(m[3]>=0)sale(b,m);else{var ns=A.aplica(T.nv,T.st,m);if(ns){SON.suelta();commit(m,ns);}}};
    if(pts.length<=1){fin();return;}
    T.anims.push({tipo:"ruta",b:b,pts:pts,t:0,vel:16,fin:fin});
  }

  /* ---------- arrastre ---------- */
  function punto(e){var r=cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
  function bloqueEn(p){
    var nv=T.nv,cs=T.cs,orden=[],b,k;
    for(b=0;b<nv.B.length;b++)if(T.st.vivo[b])orden.push(b);
    orden.sort(function(a,c){return (T.disp[c].y+A.DIM[nv.B[c].f].h)-(T.disp[a].y+A.DIM[nv.B[a].f].h);});
    for(var pas=0;pas<2;pas++)for(k=0;k<orden.length;k++){b=orden[k];
      var d=T.disp[b],bx=(p.x-T.ox)/cs-d.x,by=(p.y-T.oy+(pas?0:T.dz))/cs-d.y,f=A.FORMAS[nv.B[b].f];
      for(var i=0;i<f.length;i++)if(bx>=f[i][0]-0.08&&bx<f[i][0]+1.08&&by>=f[i][1]-0.08&&by<f[i][1]+1.08)return b;}
    return -1;
  }
  function limites(ax){
    var d=T.drag,nv=T.nv,B=nv.B[d.b],fi=B.f,dm=A.DIM[fi],o=d.o,r={lo:0,hi:0,loP:-1,hiP:-1,loM:false,hiM:false},a,c,y,x;
    function puerta(lado,px,py){for(var i=0;i<nv.P.length;i++){var p=nv.P[i];if(p.s!==lado||!A.encaja(nv,o,fi,px,py,p))continue;
      if(A.colorPuerta(p,T.st.mov)===T.st.c[d.b])return i;r.mala=i;}return -1;}
    if(ax==="x"){y=Math.round(d.fy);a=Math.floor(d.fx+1e-4);c=Math.ceil(d.fx-1e-4);
      while(A.cabe(nv,o,fi,a-1,y))a--;while(A.cabe(nv,o,fi,c+1,y))c++;r.lo=a;r.hi=c;
      if(a===0)r.loP=puerta("O",0,y);if(c+dm.w===nv.W)r.hiP=puerta("E",c,y);}
    else{x=Math.round(d.fx);a=Math.floor(d.fy+1e-4);c=Math.ceil(d.fy-1e-4);
      while(A.cabe(nv,o,fi,x,a-1))a--;while(A.cabe(nv,o,fi,x,c+1))c++;r.lo=a;r.hi=c;
      if(a===0)r.loP=puerta("N",x,0);if(c+dm.h===nv.H)r.hiP=puerta("S",x,c);}
    return r;
  }
  function mover(ax,delta){
    var d=T.drag;if(Math.abs(delta)<1e-3)return false;
    var L=limites(ax),cur=ax==="x"?d.fx:d.fy,obj=cur+delta,nuevo=Math.max(L.lo,Math.min(L.hi,obj));
    if(obj>L.hi+0.32&&L.hiP>=0){var m=ax==="x"?[d.b,L.hi,Math.round(d.fy),L.hiP]:[d.b,Math.round(d.fx),L.hi,L.hiP];T.drag=null;if(!sale(d.b,m))T.drag=null;return false;}
    if(obj<L.lo-0.32&&L.loP>=0){var m2=ax==="x"?[d.b,L.lo,Math.round(d.fy),L.loP]:[d.b,Math.round(d.fx),L.lo,L.loP];T.drag=null;if(!sale(d.b,m2))T.drag=null;return false;}
    if(Math.abs(nuevo-cur)<1e-4){
      if(Math.abs(obj-nuevo)>0.4&&!d.golpe){d.golpe=true;SON.choca();vibra(6);
        if(L.mala!=null&&cfg.aviso&&((delta>0&&L.hiP<0)||(delta<0&&L.loP<0)))cfg.aviso("Esa puerta no es de su color.");}
      return false;}
    d.golpe=false;
    if(ax==="x")d.fx=nuevo;else d.fy=nuevo;
    return true;
  }
  function avanza(tx,ty){
    var d=T.drag,eje=T.nv.B[d.b].e||0;
    for(var it=0;it<14&&T.drag;it++){
      var enX=Math.abs(d.fy-Math.round(d.fy))<1e-4,enY=Math.abs(d.fx-Math.round(d.fx))<1e-4;
      if(enX)d.fy=Math.round(d.fy);if(enY)d.fx=Math.round(d.fx);
      var dx=tx-d.fx,dy=ty-d.fy;
      if(Math.abs(dx)<1e-3&&Math.abs(dy)<1e-3)break;
      /* ayuda en las esquinas: si quiere girar, se encaja en la casilla más cercana */
      if(eje===0&&!enY&&Math.abs(dy)>0.3){d.fx=Math.round(d.fx);continue;}
      if(eje===0&&!enX&&Math.abs(dx)>0.3){d.fy=Math.round(d.fy);continue;}
      var ax=eje===1?"x":eje===2?"y":!enX?"y":!enY?"x":Math.abs(dx)>=Math.abs(dy)?"x":"y";
      var ok=mover(ax,ax==="x"?dx:dy);
      if(!ok&&T.drag&&eje===0&&enX&&enY){ax=ax==="x"?"y":"x";ok=mover(ax,ax==="x"?dx:dy);}
      if(!ok)break;
    }
  }
  function abajo(e){
    if(cfg.demo||!T.nv||T.ocupado||T.ganado)return;
    ac();
    var p=punto(e),b=bloqueEn(p);
    if(b<0)return;
    e.preventDefault();
    if(T.martillo){if(cfg.alMartillo)cfg.alMartillo(b);return;}
    if(!A.movible(T.nv,T.st,b)){sacude(b);if(cfg.aviso)cfg.aviso("Este bloque está congelado: se derrite cuando salgan "+((T.nv.B[b].h||0)-T.st.sal)+" bloques más.");return;}
    T.drag={b:b,sx:p.x,sy:p.y,x0:T.st.x[b],y0:T.st.y[b],fx:T.st.x[b],fy:T.st.y[b],o:A.ocupa(T.nv,T.st,b),t0:performance.now(),cel:T.st.x[b]+","+T.st.y[b],max:0};
    try{cv.setPointerCapture(e.pointerId);}catch(x){}
    SON.coge();vibra(5);
  }
  function mueve(e){
    var d=T.drag;if(!d)return;
    e.preventDefault();
    var p=punto(e);d.max=Math.max(d.max,Math.hypot(p.x-d.sx,p.y-d.sy)/T.cs);
    avanza(d.x0+(p.x-d.sx)/T.cs,d.y0+(p.y-d.sy)/T.cs);
    if(T.drag){var c=Math.round(T.drag.fx)+","+Math.round(T.drag.fy);if(c!==T.drag.cel){T.drag.cel=c;SON.paso();}}
  }
  function arriba(){
    var d=T.drag;if(!d)return;T.drag=null;
    if(d.max<0.18&&performance.now()-d.t0<400){       /* un toque: si puede salir, va solo hasta su puerta */
      if(cfg.toque===false)return;
      var o=A.ocupa(T.nv,T.st,d.b),B=T.nv.B[d.b],al=A.alcance(T.nv,o,B.f,T.st.x[d.b],T.st.y[d.b],B.e||0),s=A.salidas(T.nv,T.st,d.b,o,al);
      if(s.length)envia(d.b,s[0]);else sacude(d.b);
      return;
    }
    var nx=Math.round(d.fx),ny=Math.round(d.fy);
    if(nx===d.x0&&ny===d.y0){SON.suelta();return;}
    var m=[d.b,nx,ny,-1],ns=A.aplica(T.nv,T.st,m);
    if(ns){SON.suelta();commit(m,ns);}else SON.no();
  }
  cv.addEventListener("pointerdown",abajo);
  cv.addEventListener("pointermove",mueve);
  cv.addEventListener("pointerup",arriba);
  cv.addEventListener("pointercancel",arriba);
  cv.style.touchAction="none";
  var alRedim=function(){mide();};
  window.addEventListener("resize",alRedim);

  return {
    T:T,carga:carga,mide:mide,
    estado:function(){return T.st;},
    jugadas:function(){return T.movs.slice();},
    deshace:function(){
      if(T.ocupado||T.ganado||!T.hist.length)return false;
      var h=T.hist.pop();if(h.m)T.movs.pop();
      for(var b=0;b<T.nv.B.length;b++)if(!T.st.vivo[b]&&h.st.vivo[b]){T.disp[b].x=h.st.x[b];T.disp[b].y=h.st.y[b];T.esc[b]=0;T.lift[b].z=0.8;}
      for(var pi=0;pi<T.nv.P.length;pi++){var c0=A.colorPuerta(T.nv.P[pi],T.st.mov),c1=A.colorPuerta(T.nv.P[pi],h.st.mov);if(c0!==c1)T.colP[pi]={de:c0,c:c1,t:0};}
      T.st=h.st;T.fantasma=null;T.anims=T.anims.filter(function(a){return a.tipo!=="ruta";});
      SON.suelta();if(cfg.alMover)cfg.alMover(T,{tipo:"deshace"});return true;},
    reinicia:function(){if(T.ocupado&&!T.ganado)return;carga(T.nv);if(cfg.alMover)cfg.alMover(T,{tipo:"reinicia"});},
    pista:function(m,mano){T.fantasma={m:m,t:0,mano:!!mano};if(!mano)SON.pista();},
    sinPista:function(){if(T.fantasma&&T.fantasma.mano)T.fantasma=null;},
    martillo:function(on){T.martillo=!!on;},
    juega:function(m){if(T.ocupado||T.ganado)return false;if(m[3]>=0)return sale(m[0],m);var ns=A.aplica(T.nv,T.st,m);if(!ns)return false;commit(m,ns);return true;},
    rompe:function(b){
      var ns=A.copia(T.st);ns.vivo[b]=0;ns.sal++;
      var d=T.disp[b],dm=A.DIM[T.nv.B[b].f],c=colDe(T.st.c[b]).h,cx=T.ox+(d.x+dm.w/2)*T.cs,cy=T.oy+(d.y+dm.h/2)*T.cs-T.dz;
      chispas(cx,cy,c,40,T.cs*5);chispas(cx,cy,"#ffffff",10,T.cs*3);SON.martillo();vibra([30,20,30]);
      T.martillo=false;commit(null,ns,{tipo:"martillo"});},
    demo:function(sol,cada){        /* la portada: el tablero se resuelve solo, en bucle */
      var i=0;
      function sig(){if(!T.activo||!cv.isConnected)return;
        if(A.resuelto(T.st)||i>=sol.length){setTimeout(function(){if(!T.activo)return;carga(T.nv);T.ganado=false;T.ocupado=false;i=0;setTimeout(sig,900);},1400);return;}
        var m=sol[i++];envia(m[0],m);setTimeout(sig,cada||900);}
      setTimeout(sig,1200);},
    para:function(){T.activo=false;window.removeEventListener("resize",alRedim);if(T.raf)cancelAnimationFrame(T.raf);T.raf=0;}
  };
}

/* ===================== PANTALLAS ===================== */
var S={tab:null,demo:null,reloj:null};
function panel(){return $("rapido-panel");}
function para(){
  if(S.tab){S.tab.para();S.tab=null;}
  if(S.demo){S.demo.para();S.demo=null;}
  if(S.reloj){clearInterval(S.reloj);S.reloj=null;}
  clearTimeout(S.idle);
}
function pinta(html,tema){
  para();
  var pn=panel();if(!pn)return null;pn.hidden=false;
  var t=TEMAS[tema]||TEMAS.pradera;
  pn.innerHTML='<div class="bq'+(t.oscuro?' oscuro':'')+'" style="--c1:'+t.c1+';--c2:'+t.c2+';--b1:'+t.b1+';--b2:'+t.b2+'">'+html+'</div>';
  var g=pn.querySelector(".bq");
  try{if(pn.getBoundingClientRect().top<0)pn.scrollIntoView({block:"start"});}catch(x){}
  return g;
}
function full(){return window.AxAprender?AxAprender.botonCompleta():'';}
function nombreMundo(m){var M=A.MUNDOS[m-1];return M?M.nombre:"";}
function temaNivel(n){return A.MUNDOS[A.mundoDe(n)-1].id;}
function estrellasTxt(e){return '★★★'.slice(0,e)+'<i>'+'★★★'.slice(e)+'</i>';}

/* ---------- portada ---------- */
function portada(){
  baja().then(function(c){if(c&&S.enPortada)portadaPinta();});
  portadaPinta();
}
function portadaPinta(){
  var n=P.nivel,m=A.mundoDe(n),hoy=dia(),hecho=P.dias[hoy];
  var g=pinta(
    '<div class="bq-top"><h3>🚪 Puertas de Color</h3><span class="bq-sp"></span>'+full()+'</div>'+
    '<div class="bq-hero"><div class="bq-demo"><canvas id="bq-demo"></canvas></div>'+
      '<p class="bq-lema">Arrastra cada bloque hasta la <b>puerta de su color</b>. Sin vidas, sin anuncios y sin prisa. <a href="#" class="guia-link" data-guia="bloques">¿Cómo funciona?</a></p></div>'+
    '<button type="button" class="bq-jugar" id="bq-jugar"><span class="bq-jugar-ico">▶</span><span><b>Nivel '+n+'</b><small>'+ICONO[A.MUNDOS[m-1].id]+' '+esc(nombreMundo(m))+(A.tipoNivel(n)==="desafio"?' · desafío':A.tipoNivel(n)==="respiro"?' · respiro':'')+'</small></span></button>'+
    '<div class="bq-cards">'+
      '<button type="button" class="bq-card bq-c-dia" id="bq-dia"><span>🌅</span><b>Reto del día</b><small>'+(hecho?'✓ Hecho en '+hecho.movs+' jugadas':'Igual para todos')+(P.racha&&P.ultDia>=hoy-1?' · 🔥 '+P.racha:'')+'</small></button>'+
      '<button type="button" class="bq-card" id="bq-mundos"><span>🗺️</span><b>Mundos</b><small>⭐ '+totalEstrellas()+' · '+Math.min(7,m)+' de 7</small></button>'+
      '<button type="button" class="bq-card" id="bq-ajustes"><span>⚙️</span><b>Ajustes</b><small>'+(P.op.modo==="zen"?'Zen':'Contrarreloj')+(P.op.simbolos?' · símbolos':'')+(P.op.numeros?' · números':'')+'</small></button>'+
    '</div>'+
    '<ul class="bq-pros"><li>🧘 Modo zen sin reloj</li><li>↶ Deshacer siempre</li><li>💡 3 pistas gratis por nivel</li><li>📈 Se adapta a ti</li><li>👁️ Símbolos para daltónicos</li><li>🔢 Modo números</li></ul>'+
    '<p class="fine bq-nube">'+(usuario()?'Tu progreso se guarda en tu cuenta y en este teléfono.':'Tu progreso se guarda en este teléfono. Entra con Google para guardarlo en tu cuenta.')+'</p>',"pradera");
  if(!g)return;
  S.enPortada=true;
  $("bq-jugar").onclick=function(){juego(P.nivel);};
  $("bq-dia").onclick=retoDia;
  $("bq-mundos").onclick=mundos;
  $("bq-ajustes").onclick=ajustes;
  /* demostración que se juega sola */
  var nv=A.nivel(2,0);
  if(nv){S.demo=crearTablero($("bq-demo"),{demo:true,tema:"pradera",piel:P.piel,simbolos:P.op.simbolos,alto:210});S.demo.carga(nv);S.demo.demo(nv.sol,1000);}
}

/* ---------- mundos ---------- */
function mundos(){
  var html='<div class="bq-top"><button type="button" class="bq-volver" id="bq-v">‹</button><h3>🗺️ Mundos</h3><span class="bq-sp"></span>'+full()+'</div><div class="bq-mundos">';
  for(var m=1;m<=A.MUNDOS.length;m++){
    var M=A.MUNDOS[m-1],t=TEMAS[M.id],ini=(m-1)*A.POR_MUNDO+1,abierto=P.nivel>=ini,est=0,k;
    var desde=ini,hasta=ini+A.POR_MUNDO-1;
    if(m===A.MUNDOS.length){desde=Math.max(ini,P.nivel-9);hasta=desde+14;}
    for(k=desde;k<=hasta;k++)est+=P.est[k]||0;
    html+='<section class="bq-mundo'+(abierto?'':' cerrado')+(t.oscuro?' oscuro':'')+'" style="--m1:'+t.c1+';--m2:'+t.c2+'">'+
      '<header><span class="bq-mico">'+ICONO[M.id]+'</span><div><b>'+m+' · '+esc(M.nombre)+'</b><small>'+esc(M.txt)+'</small></div><span class="bq-mest">'+(abierto?'⭐ '+est+(m<A.MUNDOS.length?'/'+A.POR_MUNDO*3:''):'🔒')+'</span></header>';
    if(abierto){html+='<div class="bq-niveles">';
      for(k=desde;k<=hasta;k++){var e=P.est[k]||0,disp=k<=P.nivel,tp=A.tipoNivel(k);
        html+='<button type="button" data-n="'+k+'" class="'+(e?'hecho':'')+(k===P.nivel?' actual':'')+(tp!=="normal"?' '+tp:'')+'"'+(disp?'':' disabled')+'><b>'+k+'</b><small>'+(e?estrellasTxt(e):tp==="desafio"?'🔥':tp==="respiro"?'🍃':disp?'·':'🔒')+'</small></button>';}
      html+='</div>';}
    else html+='<p class="bq-cerr">Se abre al llegar al nivel '+ini+'.</p>';
    html+='</section>';
  }
  html+='</div><p class="fine">🍃 respiro: un nivel más tranquilo cada 5. 🔥 desafío: uno más difícil cada 10, avisado antes de empezar.</p>';
  var g=pinta(html,temaNivel(P.nivel));if(!g)return;
  S.enPortada=false;
  $("bq-v").onclick=portadaPinta;
  Array.prototype.forEach.call(g.querySelectorAll("[data-n]"),function(b){b.onclick=function(){juego(+b.getAttribute("data-n"));};});
  var act=g.querySelector(".actual");if(act)try{act.scrollIntoView({block:"center"});}catch(x){}
}

/* ---------- ajustes ---------- */
function ajustes(){
  function sw(id,on,t,s){return '<label class="bq-sw"><span><b>'+t+'</b><small>'+s+'</small></span><input type="checkbox" id="'+id+'"'+(on?' checked':'')+'><i></i></label>';}
  function seg(nom,val,ops){return '<div class="bq-seg" data-seg="'+nom+'">'+ops.map(function(o){return '<button type="button" data-v="'+o[0]+'" class="'+(val===o[0]?'on':'')+'">'+o[1]+'</button>';}).join("")+'</div>';}
  var g=pinta('<div class="bq-top"><button type="button" class="bq-volver" id="bq-v">‹</button><h3>⚙️ Ajustes</h3><span class="bq-sp"></span>'+full()+'</div>'+
    '<div class="bq-aj">'+
    '<h4>Modo de juego</h4>'+seg("modo",P.op.modo,[["zen","🧘 Zen · sin reloj"],["reloj","⏱️ Contrarreloj"]])+
    '<p class="fine">En contrarreloj, si se acaba el tiempo puedes pedir 30 segundos gratis o seguir sin reloj: nunca se pierde nada.</p>'+
    '<h4>Accesibilidad</h4>'+
    sw("bq-sim",P.op.simbolos,"Símbolos de color","Cada color lleva su figura (●▲■◆★✚♥⬢) en bloques y puertas: para daltónicos.")+
    sw("bq-toque",P.op.toque,"Tocar para enviar","Un toque manda el bloque solo a su puerta si tiene el camino libre.")+
    sw("bq-son",P.op.sonido,"Sonido","Efectos suaves sintetizados.")+
    sw("bq-vib",P.op.vibra,"Vibración","Un toque al salir cada bloque.")+
    '<h4>Modo números</h4>'+
    sw("bq-num",P.op.numeros,"Bloques con cuentas","Cada puerta tiene un resultado y cada bloque una cuenta: llévalo a la puerta de su resultado.")+
    seg("tipoNum",P.op.tipoNum,[["sumas","Sumas hasta 10"],["restas","Sumas y restas hasta 20"],["tablas","Tablas"]])+
    sw("bq-solo",P.op.soloNum,"Solo números","Los bloques pierden el color: hay que calcular de verdad.")+
    '<h4>Estilo de los bloques</h4><div class="bq-pieles">'+PIELES.map(function(p){var ok=p.req===0||mundoHecho(p.req);
      return '<button type="button" data-piel="'+p.id+'" class="bq-piel p-'+p.id+(P.piel===p.id?' on':'')+'"'+(ok?'':' disabled')+'><i></i><b>'+p.nom+'</b><small>'+(ok?(p.req?'Desbloqueada':'Clásica'):'🔒 '+p.txt)+'</small></button>';}).join("")+'</div>'+
    '<h4>Tu progreso</h4><p class="fine">Nivel '+P.nivel+' · ⭐ '+totalEstrellas()+' · 🔨 '+P.martillos+' martillos · dificultad '+(P.ajuste>0.5?'subida':P.ajuste<-0.5?'más suave':'normal')+'</p>'+
    '<div class="actions"><button type="button" class="ghost" id="bq-borra">Empezar de cero</button></div></div>',"pradera");
  if(!g)return;
  S.enPortada=false;
  $("bq-v").onclick=portadaPinta;
  function vinc(id,k){$(id).onchange=function(){P.op[k]=this.checked;guarda();};}
  vinc("bq-sim","simbolos");vinc("bq-toque","toque");vinc("bq-son","sonido");vinc("bq-vib","vibra");vinc("bq-num","numeros");vinc("bq-solo","soloNum");
  Array.prototype.forEach.call(g.querySelectorAll("[data-seg]"),function(s){var k=s.getAttribute("data-seg");
    Array.prototype.forEach.call(s.querySelectorAll("button"),function(b){b.onclick=function(){P.op[k]=b.getAttribute("data-v");guarda();
      Array.prototype.forEach.call(s.querySelectorAll("button"),function(x){x.classList.toggle("on",x===b);});};});});
  Array.prototype.forEach.call(g.querySelectorAll("[data-piel]"),function(b){b.onclick=function(){P.piel=b.getAttribute("data-piel");guarda();
    Array.prototype.forEach.call(g.querySelectorAll("[data-piel]"),function(x){x.classList.toggle("on",x===b);});};});
  $("bq-borra").onclick=function(){if(!confirm("¿Borrar todo tu progreso de Puertas de Color?"))return;var op=P.op;P=base();P.op=op;guarda();ajustes();};
}

/* ---------- partida ---------- */
function htmlJuego(titulo,sub,dia){
  return '<div class="bq-hud"><button type="button" class="bq-volver" id="bq-v" aria-label="Volver">‹</button>'+
    '<div class="bq-tit"><b>'+titulo+'</b><small>'+sub+'</small></div>'+
    '<div class="bq-cont"><small>Jugadas</small><b id="bq-mov">0</b><small id="bq-par"></small></div>'+full()+'</div>'+
    '<div class="bq-reloj" id="bq-reloj" hidden><i id="bq-rbar"></i><span id="bq-rtxt"></span></div>'+
    '<div class="bq-lienzo" id="bq-lienzo"><canvas id="bq-cv"></canvas><div class="bq-aviso" id="bq-aviso" role="status" aria-live="polite"></div>'+
      '<div class="bq-carga" id="bq-carga"><i></i><i></i><i></i><i></i><span>Preparando el tablero…</span></div><div class="bq-capa" id="bq-capa" hidden></div></div>'+
    '<div class="bq-barra">'+
      '<button type="button" id="bq-undo"><span>↶</span><small>Deshacer</small></button>'+
      '<button type="button" id="bq-reset"><span>⟲</span><small>Reiniciar</small></button>'+
      (dia?'':'<button type="button" id="bq-pista"><span>💡</span><small>Pista</small><em id="bq-np">3</em></button>'+
      '<button type="button" id="bq-mart"><span>🔨</span><small>Martillo</small><em id="bq-nm">'+P.martillos+'</em></button>')+
    '</div><div class="bq-suave" id="bq-suave" hidden><button type="button" id="bq-suave-b">🍃 ¿Te está costando? Prueba una versión más suave</button></div>';
}
function aviso(t){var a=$("bq-aviso");if(!a)return;a.textContent=t;a.classList.add("on");clearTimeout(S.avT);S.avT=setTimeout(function(){a.classList.remove("on");},2600);}
function capa(html){var c=$("bq-capa");if(!c)return null;c.innerHTML='<div class="bq-modal">'+html+'</div>';c.hidden=false;return c;}
function cierraCapa(){var c=$("bq-capa");if(c){c.hidden=true;c.innerHTML="";}}
function reloj(s){s=Math.max(0,Math.round(s));return Math.floor(s/60)+":"+(s%60<10?"0":"")+s%60;}
var MEC={muros:{ico:"🪨",t:"Rocas",d:"Las rocas no se mueven ni se pueden atravesar: rodéalas."},
  eje:{ico:"↔️",t:"Bloques en raíl",d:"Las flechas del bloque dicen hacia dónde puede ir: solo de lado a lado, o solo de arriba abajo."},
  hielo:{ico:"🧊",t:"Bloques de hielo",d:"El número dice cuántos bloques tienen que salir antes de que se derrita. Hasta entonces no se mueve."},
  capas:{ico:"💎",t:"Bloques con capa",d:"La capa de fuera sale por la puerta de su color y deja dentro un bloque de otro color, que luego va a su puerta."},
  alterna:{ico:"🔄",t:"Puertas que cambian",d:"Cambian de color con cada jugada. El puntito con ↻ muestra el color que tendrá después de tu próxima jugada."}};
function mecanicasDe(nv){var l=[];
  if(nv.m.some(function(x){return x;}))l.push("muros");
  if(nv.B.some(function(b){return b.e;}))l.push("eje");
  if(nv.B.some(function(b){return b.h;}))l.push("hielo");
  if(nv.B.some(function(b){return b.k>=0;}))l.push("capas");
  if(nv.P.some(function(p){return p.c.length>1;}))l.push("alterna");
  return l;}

function juego(n,suave){
  var tipo=A.tipoNivel(n),m=A.mundoDe(n),M=A.MUNDOS[m-1],aj=Math.max(-2,Math.min(2,Math.round(P.ajuste)))-(suave?1:0);
  var g=pinta(htmlJuego("Nivel "+n,ICONO[M.id]+" "+esc(M.nombre)+(tipo==="desafio"?' · <em class="bq-des">🔥 desafío</em>':tipo==="respiro"?' · 🍃 respiro':'')+(suave?' · versión suave':''),false),M.id);
  if(!g)return;
  S.enPortada=false;
  var J={n:n,pistas:3,usoPista:0,martillo:false,reinicios:S.ultN===n?S.reinicios||0:0,t0:0,extra:0,limite:0,sinReloj:P.op.modo!=="reloj",suave:!!suave,aj:aj};
  S.ultN=n;S.reinicios=J.reinicios;
  $("bq-v").onclick=function(){para();mundos();};
  pideNivel(n,aj).then(function(nv){
    if(!nv||!$("bq-cv"))return;
    $("bq-carga").hidden=true;
    J.nv=nv;J.par=nv.par;
    $("bq-par").textContent="par "+J.par;
    /* el par de verdad (si el buscador lo encuentra rápido) */
    trabajo("par",{nv:nv,tope:5000}).then(function(s){if(s&&s.length<J.par){J.par=s.length;var e=$("bq-par");if(e)e.textContent="par "+J.par;}}).catch(function(){});
    S.tab=crearTablero($("bq-cv"),{tema:M.id,piel:P.piel,simbolos:P.op.simbolos,numeros:P.op.numeros,soloNum:P.op.numeros&&P.op.soloNum,toque:P.op.toque,reserva:250,
      aviso:aviso,
      alMover:function(T,x){
        $("bq-mov").textContent=T.movs.length;
        if(x&&x.tipo==="reinicia"){J.reinicios++;S.reinicios=J.reinicios;if(J.reinicios>=2&&!J.suave&&n>3)$("bq-suave").hidden=false;}
        clearTimeout(S.idle);if(n<=2&&T.movs.length===0)S.idle=setTimeout(manita,3500);
        if(S.tab)S.tab.sinPista();
      },
      alGanar:function(T){gana(J,T);},
      alMartillo:function(b){if(P.martillos<=0)return;P.martillos--;guarda();J.martillo=true;S.tab.rompe(b);$("bq-nm").textContent=P.martillos;$("bq-mart").classList.remove("on");}});
    S.tab.carga(nv);
    J.t0=Date.now();
    /* presentación de una mecánica nueva o del desafío */
    var nuevas=mecanicasDe(nv).filter(function(k){return !P.vistas[k];});
    if(nuevas.length){var k=nuevas[0];P.vistas[k]=1;guarda();
      capa('<div class="bq-mec">'+MEC[k].ico+'</div><h3>Nuevo: '+MEC[k].t+'</h3><p>'+MEC[k].d+'</p><div class="actions"><button type="button" class="primary" id="bq-ok">¡Entendido!</button></div>');
      $("bq-ok").onclick=function(){cierraCapa();J.t0=Date.now();arrancaReloj(J);};}
    else if(tipo==="desafio"&&!J.suave){capa('<div class="bq-mec">🔥</div><h3>Nivel desafío</h3><p>Este es un poco más difícil que los demás. Tómate tu tiempo: las pistas y el deshacer siguen ahí.</p><div class="actions"><button type="button" class="primary" id="bq-ok">¡Vamos!</button></div>');
      $("bq-ok").onclick=function(){cierraCapa();J.t0=Date.now();arrancaReloj(J);};}
    else arrancaReloj(J);
    if(n<=2)S.idle=setTimeout(manita,3000);
    /* el siguiente nivel se prepara mientras se juega */
    setTimeout(function(){pideNivel(n+1,aj).catch(function(){});},1500);
  }).catch(function(){var c=$("bq-carga");if(c)c.innerHTML='<span>No se pudo preparar el tablero.</span>';});
  $("bq-undo").onclick=function(){if(S.tab)S.tab.deshace();};
  $("bq-reset").onclick=function(){if(S.tab)S.tab.reinicia();};
  $("bq-pista").onclick=function(){
    if(!S.tab||!J.nv||S.tab.T.ganado)return;
    if(J.pistas<=0){aviso("Ya usaste las 3 pistas de este nivel. Prueba a deshacer o reiniciar.");return;}
    var b=$("bq-pista");b.disabled=true;
    trabajo("pista",{nv:J.nv,st:S.tab.estado()}).then(function(mv){b.disabled=false;if(!mv){aviso("No encuentro una pista ahora: prueba a deshacer una jugada.");return;}
      J.pistas--;J.usoPista++;$("bq-np").textContent=J.pistas;S.tab.pista(mv);}).catch(function(){b.disabled=false;});
  };
  $("bq-mart").onclick=function(){
    if(!S.tab||!J.nv)return;
    if(P.martillos<=0){aviso("Sin martillos: ganas uno cada 10 estrellas y con cada reto del día.");return;}
    var on=!S.tab.T.martillo;S.tab.martillo(on);this.classList.toggle("on",on);
    if(on)aviso("Toca el bloque que quieres romper (el nivel valdrá como máximo ★★).");
  };
  $("bq-suave-b").onclick=function(){juego(n,true);};
  function manita(){if(S.tab&&J.nv&&S.tab.T.movs.length===0&&!S.tab.T.ganado){var mv=A.pista(J.nv,S.tab.estado());if(mv)S.tab.pista(mv,true);}}
}
function arrancaReloj(J){
  if(J.sinReloj)return;
  J.limite=Math.max(40,Math.round(J.par*7+J.nv.B.length*3))*(J.suave?1.5:1);
  var r=$("bq-reloj");if(!r)return;r.hidden=false;J.t0=Date.now();
  S.reloj=setInterval(function(){
    if(!S.tab||S.tab.T.ganado){clearInterval(S.reloj);S.reloj=null;return;}
    var q=J.limite+J.extra-(Date.now()-J.t0)/1000,bar=$("bq-rbar"),tx=$("bq-rtxt");if(!bar)return;
    bar.style.width=Math.max(0,q/(J.limite+J.extra)*100)+"%";bar.className=q<10?"poco":"";tx.textContent=reloj(q);
    if(q<=10&&q>0)SON.tic();
    if(q<=0){clearInterval(S.reloj);S.reloj=null;S.tab.T.ocupado=true;J.agotado=true;
      capa('<div class="bq-mec">⏰</div><h3>¡Se acabó el tiempo!</h3><p>No pasa nada: aquí no hay vidas que perder.</p><div class="actions col">'+
        '<button type="button" class="primary" id="bq-mas">+30 segundos gratis</button><button type="button" class="ghost" id="bq-zen">Seguir sin reloj</button><button type="button" class="ghost" id="bq-otra">Empezar de nuevo</button></div>');
      $("bq-mas").onclick=function(){J.extra+=30;cierraCapa();S.tab.T.ocupado=false;arrancaReloj2(J);};
      $("bq-zen").onclick=function(){J.sinReloj=true;cierraCapa();S.tab.T.ocupado=false;$("bq-reloj").hidden=true;};
      $("bq-otra").onclick=function(){cierraCapa();S.tab.T.ocupado=false;S.tab.reinicia();J.extra=0;J.t0=Date.now();arrancaReloj2(J);};}
  },250);
}
function arrancaReloj2(J){var t0=J.t0,ex=J.extra;arrancaReloj(J);J.t0=t0;J.extra=ex;}

function gana(J,T){
  if(S.reloj){clearInterval(S.reloj);S.reloj=null;}
  var n=J.n,movs=T.movs.length,seg=(Date.now()-J.t0)/1000,e=A.estrellas(movs,J.par,J.martillo);
  if(J.agotado)e=Math.min(e,2);
  var antes=totalEstrellas(),prev=P.est[n]||0;
  if(e>prev)P.est[n]=e;
  var nuevoNivel=n>=P.nivel;
  if(nuevoNivel)P.nivel=n+1;
  /* dificultad adaptativa: sube despacio si va sobrado, baja si le cuesta */
  if(!J.usoPista&&!J.martillo&&movs<=J.par+1&&!J.agotado)P.ajuste=Math.min(2,P.ajuste+0.2);
  else if(J.usoPista>=2||J.reinicios>=2||J.agotado||J.martillo)P.ajuste=Math.max(-2,P.ajuste-0.3);
  var despues=totalEstrellas(),gano=Math.floor(despues/10)-Math.floor(antes/10);
  if(gano>0)P.martillos=Math.min(9,P.martillos+gano);
  var pielNueva=null;PIELES.forEach(function(p){if(p.req&&n===p.req*A.POR_MUNDO&&nuevoNivel)pielNueva=p;});
  S.reinicios=0;
  guarda();
  capa('<h3>'+(e===3?'¡Perfecto!':e===2?'¡Muy bien!':'¡Nivel superado!')+'</h3>'+
    '<div class="bq-est">'+[0,1,2].map(function(i){return '<i class="'+(i<e?'si':'')+'" style="animation-delay:'+(0.15+i*0.28)+'s">★</i>';}).join("")+'</div>'+
    '<p class="bq-dato"><b>'+movs+'</b> jugadas · par '+J.par+' · '+reloj(seg)+'</p>'+
    (e<3&&!J.martillo?'<p class="fine">Con '+J.par+' jugadas o menos consigues las tres estrellas.</p>':'')+
    (gano>0?'<p class="bq-premio">🔨 ¡Ganaste un martillo por llegar a '+Math.floor(despues/10)*10+' estrellas!</p>':'')+
    (pielNueva?'<p class="bq-premio">🎨 Nuevo estilo de bloques: <b>'+pielNueva.nom+'</b> (en Ajustes).</p>':'')+
    (n%A.POR_MUNDO===0&&n<A.MUNDOS.length*A.POR_MUNDO&&nuevoNivel?'<p class="bq-premio">'+ICONO[A.MUNDOS[A.mundoDe(n+1)-1].id]+' ¡Se abrió el mundo '+esc(nombreMundo(A.mundoDe(n+1)))+'!</p>':'')+
    '<div class="actions col"><button type="button" class="primary" id="bq-sig">Siguiente nivel ▶</button><div class="actions"><button type="button" class="ghost" id="bq-rep">Repetir</button><button type="button" class="ghost" id="bq-map">Mundos</button></div></div>');
  [0,1,2].forEach(function(i){if(i<e)setTimeout(function(){SON.estrella(i);},150+i*280);});
  $("bq-sig").onclick=function(){juego(n+1);};
  $("bq-rep").onclick=function(){juego(n);};
  $("bq-map").onclick=mundos;
}

/* ---------- reto del día ---------- */
function retoDia(){
  var hoy=dia(),u=usuario(),conCuenta=u&&!u.guest;
  var g=pinta(htmlJuego("Reto del día","🌅 Igual para todos · sin pistas",true),"dia");
  if(!g)return;
  S.enPortada=false;
  var J={dia:hoy,t0:0};
  $("bq-v").onclick=function(){para();portadaPinta();};
  var pide=conCuenta?api("/api/bloques/dia/empieza",{}).then(function(r){J.dia=r.day;return r.nivel;}).catch(function(e){aviso(ERR(e)+" Juegas sin ranking.");conCuenta=false;return trabajo("dia",{dia:hoy});})
    :trabajo("dia",{dia:hoy});
  pide.then(function(nv){
    if(!nv||!$("bq-cv"))return;
    $("bq-carga").hidden=true;J.nv=nv;
    var r=$("bq-reloj");r.hidden=false;r.classList.add("cuenta");
    S.tab=crearTablero($("bq-cv"),{tema:"dia",piel:P.piel,simbolos:P.op.simbolos,numeros:P.op.numeros,soloNum:P.op.numeros&&P.op.soloNum,toque:P.op.toque,reserva:250,aviso:aviso,
      alMover:function(T){$("bq-mov").textContent=T.movs.length;},
      alGanar:function(T){finDia(J,T,conCuenta);}});
    S.tab.carga(nv);J.t0=Date.now();
    $("bq-par").textContent=P.dias[J.dia]?"tu mejor: "+P.dias[J.dia].movs:"";
    S.reloj=setInterval(function(){var b=$("bq-rtxt");if(!b||!S.tab||S.tab.T.ganado){clearInterval(S.reloj);S.reloj=null;return;}b.textContent="⏱ "+reloj((Date.now()-J.t0)/1000);},500);
    var nuevas=mecanicasDe(nv).filter(function(k){return !P.vistas[k];});
    if(nuevas.length){var k=nuevas[0];P.vistas[k]=1;guarda();
      capa('<div class="bq-mec">'+MEC[k].ico+'</div><h3>Hoy: '+MEC[k].t+'</h3><p>'+MEC[k].d+'</p><div class="actions"><button type="button" class="primary" id="bq-ok">¡Entendido!</button></div>');
      $("bq-ok").onclick=function(){cierraCapa();J.t0=Date.now();};}
  }).catch(function(){var c=$("bq-carga");if(c)c.innerHTML='<span>No se pudo preparar el reto.</span>';});
  $("bq-undo").onclick=function(){if(S.tab)S.tab.deshace();};
  $("bq-reset").onclick=function(){if(S.tab)S.tab.reinicia();};
}
function finDia(J,T,conCuenta){
  if(S.reloj){clearInterval(S.reloj);S.reloj=null;}
  var movs=T.movs.length,seg=(Date.now()-J.t0)/1000,d=J.dia,prev=P.dias[d],primera=!prev;
  if(!prev||movs<prev.movs||(movs===prev.movs&&seg<prev.seg))P.dias[d]={movs:movs,seg:Math.round(seg)};
  if(P.ultDia!==d){P.racha=P.ultDia===d-1?P.racha+1:1;P.ultDia=d;}
  if(primera)P.martillos=Math.min(9,P.martillos+1);
  guarda();
  var cols=[];J.nv.P.forEach(function(p){if(cols.indexOf(p.c[0])<0)cols.push(p.c[0]);});
  var texto="Puertas de Color · reto "+d+"\n"+cols.map(function(c){return COL[c].e;}).join("")+" "+movs+" jugadas · "+reloj(seg)+"\n🔥 racha "+P.racha+"\n"+location.origin;
  capa('<h3>¡Reto del día resuelto!</h3><div class="bq-est"><i class="si">🌅</i></div>'+
    '<p class="bq-dato"><b>'+movs+'</b> jugadas · '+reloj(seg)+(P.racha>1?' · 🔥 '+P.racha+' días seguidos':'')+'</p>'+
    (primera?'<p class="bq-premio">🔨 +1 martillo por el reto de hoy.</p>':'')+
    '<p class="fine" id="bq-rk-msg">'+(conCuenta?'Enviando tus jugadas…':'Entra con Google para aparecer en el ranking.')+'</p>'+
    '<div id="bq-rk"></div>'+
    '<div class="actions col"><button type="button" class="primary" id="bq-comp">Compartir</button><div class="actions"><button type="button" class="ghost" id="bq-otra">Intentar con menos jugadas</button><button type="button" class="ghost" id="bq-ini">Inicio</button></div></div>');
  $("bq-comp").onclick=function(){if(navigator.share)navigator.share({text:texto}).catch(function(){});else if(navigator.clipboard)navigator.clipboard.writeText(texto).then(function(){aviso("Copiado: pégalo donde quieras.");});};
  $("bq-otra").onclick=retoDia;$("bq-ini").onclick=portadaPinta;
  if(conCuenta)api("/api/bloques/dia/termina",{jugadas:T.movs}).then(function(r){
    var el=$("bq-rk-msg");if(el)el.innerHTML=(r.mejoro?'¡Tu mejor marca de hoy!':'Tu mejor de hoy: <b>'+r.best+'</b> jugadas')+(r.rank?' · puesto <b>#'+r.rank+'</b> de '+r.total:'');
    ranking($("bq-rk"),r.day);
  }).catch(function(e){var el=$("bq-rk-msg");if(el)el.textContent=ERR(e);});
  else ranking($("bq-rk"),d);
}
function ranking(z,d){
  api("/api/bloques/ranking"+(d?"?day="+d:"")).then(function(r){
    if(!z)return;
    z.innerHTML=r.top.length?'<ol class="rank-list bq-rank">'+r.top.slice(0,10).map(function(e){
      return '<li'+(e.me?' class="me"':'')+'><span class="pos">'+e.rank+'</span>'+(e.picture?'<img src="'+esc(e.picture)+'" alt="" referrerpolicy="no-referrer">':'<span class="noimg"></span>')+
        '<span class="who">'+esc(e.name)+(e.me?' <em>(tú)</em>':'')+'</span><span class="pts"><b>'+e.movs+'</b> · '+reloj(e.seconds)+'</span></li>';}).join("")+'</ol>':'<p class="fine">Todavía nadie ha resuelto el reto de hoy.</p>';
  }).catch(function(){if(z)z.innerHTML='';});
}

document.addEventListener("ax-user",function(){if(S.enPortada)portada();});
window.AxBloquesUI={portada:portada,para:para,juego:juego,retoDia:retoDia,mundos:mundos,ajustes:ajustes,crearTablero:crearTablero,_P:function(){return P;},_S:function(){return S;}};
})();
