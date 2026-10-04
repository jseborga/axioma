/* ===========================================================
   THE FINAL TEST · Granja Grande · pantalla
   Un mapa de 520×400 que se recorre arrastrando (con minimapa), con
   el campo, el granero, la estación, un estanque, el huerto y 8
   fábricas animadas que se mejoran. Arriba quedan fijos el marcador
   y los pedidos; abajo, las semillas, la pregunta y el granero.
   El fondo se dibuja una vez en un lienzo aparte; lo que se mueve
   (cultivos, máquinas, animales, tren, granjero, nubes) cada cuadro.
     AxGranjaGUI.monta(contenedor, datos, cfg, done) · AxGranjaGUI.para()
   =========================================================== */
(function(){
"use strict";
var A=window.AxGranjaG, U=window.AxGranjaUI;
if(!A||!U)return;
var $=function(id){return document.getElementById(id)};
var P=U.P, SON=U.SON, api=U.api;
var VW=240, VH=380, TOP=66, VIEWH=240, BOT=TOP+VIEWH;      /* lienzo lógico y la ventana al mundo */
var WW=520, WH=400;                                         /* el mundo */
var FUENTE="system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
var ORDEN=["t","m","z","a","h","p","u","l","j","k","q","e"];

/* ---------- el mapa ---------- */
var PLOT=function(i){return {x:40+(i%4)*36,y:116+Math.floor(i/4)*36,w:32,h:32};};
var FAB=[[222,104],[286,104],[350,104],[414,104],[222,206],[286,206],[350,206],[414,206]].map(function(p){return {x:p[0],y:p[1],w:56,h:56};});
var SIGNO=function(z){return {x:z.x+38,y:z.y-4,w:18,h:13};};
var GRANERO={x:96,y:34,w:66,h:60}, CASA={x:178,y:40,w:42,h:44}, ESTACION={x:8,y:32,w:72,h:44};
var COBERTIZO={x:228,y:36,w:58,h:40}, GARAJE={x:294,y:36,w:58,h:40}, SILO={x:362,y:34,w:34,h:44};
var ESTANQUE={x:110,y:322,rx:62,ry:34};
var MINI={x:VW-68,y:BOT-52,w:64,h:49};

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function dentro(r,x,y){return x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;}
function reloj(t){var s=Math.max(0,Math.ceil(t/10)),m=Math.floor(s/60),g=s%60;return m+":"+(g<10?"0":"")+g;}
function late(now,ms){return (now/(ms||200)|0)%2===0;}
/* azar fijo para la decoración */
function rnd(n){var x=Math.sin(n*12.9898)*43758.5453;return x-Math.floor(x);}

var LZ={};
function lienzo(id){if(LZ[id])return LZ[id]; var s=U.SPR[id]; if(!s)return null;
  var c=document.createElement("canvas"); c.width=s[0].length; c.height=s.length; U.sprite(c.getContext("2d"),id,0,0,1); return LZ[id]=c;}
function spr(ctx,id,x,y,e,al){var c=lienzo(id); if(!c)return; e=e||1; if(al!=null)ctx.globalAlpha=al; ctx.imageSmoothingEnabled=false;
  ctx.drawImage(c,Math.round(x),Math.round(y),c.width*e,c.height*e); if(al!=null)ctx.globalAlpha=1;}

/* ---------- dibujo de piezas ---------- */
function r(ctx,c,x,y,w,h){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
function arbol(ctx,x,y,t){ /* t: 0 pino, 1 frondoso, 2 frutal */
  r(ctx,"rgba(0,0,0,.18)",x-7,y+9,16,4);
  r(ctx,"#6b4220",x-1,y+2,3,9);
  if(t===0){r(ctx,"#1f6b3a",x-6,y,13,4);r(ctx,"#25804a",x-5,y-4,11,4);r(ctx,"#2d9455",x-3,y-8,7,4);r(ctx,"#36a862",x-1,y-11,3,3);}
  else{r(ctx,"#2c7a3a",x-7,y-7,15,10);r(ctx,"#379044",x-6,y-10,13,4);r(ctx,"#46a653",x-4,y-9,6,3);r(ctx,"#2c7a3a",x-8,y-4,17,5);
    if(t===2){r(ctx,"#ff4d4d",x-4,y-5,2,2);r(ctx,"#ff4d4d",x+2,y-7,2,2);r(ctx,"#ff4d4d",x+4,y-2,2,2);r(ctx,"#ff4d4d",x-6,y-1,2,2);}}
}
function cerca(ctx,x1,y1,x2,y2){ctx.fillStyle="#d8c09a";
  if(y1===y2){ctx.fillRect(x1,y1,x2-x1,1.5);ctx.fillRect(x1,y1+3,x2-x1,1.5);for(var x=x1;x<=x2;x+=8){ctx.fillStyle="#b89a70";ctx.fillRect(x,y1-2,2,8);ctx.fillStyle="#d8c09a";}}
  else{ctx.fillRect(x1,y1,1.5,y2-y1);for(var y=y1;y<=y2;y+=8){ctx.fillStyle="#b89a70";ctx.fillRect(x1-1,y,4,3);ctx.fillStyle="#d8c09a";}}
}
function fondo(K){
  var c=document.createElement("canvas"); c.width=WW*K; c.height=WH*K;
  var x=c.getContext("2d"); x.setTransform(K,0,0,K,0,0);
  var i, j;
  /* pasto en losetas de 16 con dos verdes y matas */
  for(i=0;i<WW;i+=16)for(j=0;j<WH;j+=16){var n=rnd(i*31+j*17); r(x,n<0.5?"#5aa84a":"#54a145",i,j,16,16);
    if(n>0.7){r(x,"#4a9640",i+3+(n*8|0),j+5,1,3);r(x,"#4a9640",i+5+(n*8|0),j+4,1,4);}
    if(n<0.06){r(x,"#fff1e8",i+6,j+8,2,2);r(x,"#ffec27",i+7,j+9,1,1);}
    if(n>0.94){r(x,"#ff77a8",i+9,j+3,2,2);}}
  /* bosque arriba */
  r(x,"#3e8a3a",0,0,WW,16); for(i=4;i<WW;i+=11)arbol(x,i,6+(rnd(i)*4|0),rnd(i*3)<0.5?0:1);
  /* vías del tren */
  r(x,"#8a7a66",0,22,WW,10); for(i=0;i<WW;i+=6)r(x,"#5a3a1c",i,21,3,12); r(x,"#c2c3c7",0,24,WW,1.5); r(x,"#c2c3c7",0,29,WW,1.5);
  /* caminos de tierra */
  function camino(px,py,w,h){r(x,"#c8a06a",px,py,w,h); for(var k=0;k<w*h/60;k++){var a=rnd(px+py+k*7),b=rnd(px*3+k);r(x,"#b48c58",px+a*w,py+b*h,2,1);} r(x,"rgba(90,58,28,.18)",px,py,w,1);}
  camino(0,78,WW,13); camino(198,78,14,WH-78); camino(198,180,WW-198,14); camino(20,272,180,12);
  /* estación */
  r(x,"#9a9a9a",ESTACION.x-4,ESTACION.y+30,ESTACION.w+8,8);
  /* campo cercado */
  r(x,"#7d5a32",34,110,146,154); r(x,"#6e4e2a",34,110,146,2);
  cerca(x,32,106,182,106); cerca(x,32,266,182,266); cerca(x,32,106,32,266); cerca(x,182,106,182,266);
  /* estanque */
  x.fillStyle="#d8c09a"; x.beginPath(); x.ellipse(ESTANQUE.x,ESTANQUE.y,ESTANQUE.rx+4,ESTANQUE.ry+4,0,0,Math.PI*2); x.fill();
  x.fillStyle="#2f7fd0"; x.beginPath(); x.ellipse(ESTANQUE.x,ESTANQUE.y,ESTANQUE.rx,ESTANQUE.ry,0,0,Math.PI*2); x.fill();
  x.fillStyle="#3c95e6"; x.beginPath(); x.ellipse(ESTANQUE.x-6,ESTANQUE.y-4,ESTANQUE.rx-14,ESTANQUE.ry-10,0,0,Math.PI*2); x.fill();
  r(x,"#2c7a3a",ESTANQUE.x+30,ESTANQUE.y+8,10,4); r(x,"#46a653",ESTANQUE.x+32,ESTANQUE.y+7,6,2);   /* nenúfar */
  r(x,"#2c7a3a",ESTANQUE.x-40,ESTANQUE.y-10,8,3);
  /* huerto y árboles sueltos */
  for(i=0;i<16;i++){var ax=250+(i%6)*44+(Math.floor(i/6)%2)*20, ay=300+Math.floor(i/6)*34; arbol(x,ax,ay,2);}
  [[12,110],[14,190],[16,250],[205,110],[30,380],[200,370],[500,110],[505,200],[480,270],[12,300]].forEach(function(p,k){arbol(x,p[0],p[1],k%2);});
  /* rocas */
  [[60,290],[175,300],[480,385]].forEach(function(p){r(x,"#8a8a8a",p[0],p[1],7,4);r(x,"#a8a8a8",p[0]+1,p[1]-1,5,2);});
  return c;
}

/* edificios: base, paredes, techo y el detalle de cada uno */
var ESTILO={
  molino:    {pared:"#c9c2b4",borde:"#8f877a",techo:"#8a4b2a",techo2:"#6b3a20"},
  horno:     {pared:"#c4553a",borde:"#8f3a26",techo:"#5a3a1c",techo2:"#3f2812"},
  gallinero: {pared:"#d24a3a",borde:"#962f24",techo:"#f4ead8",techo2:"#cbbfa8"},
  establo:   {pared:"#b5372b",borde:"#7e241c",techo:"#5f574f",techo2:"#3f3a35"},
  jugos:     {pared:"#ffd29a",borde:"#c89a5a",techo:"#ffa300",techo2:"#fff1e8"},
  pasteleria:{pared:"#ffd6e2",borde:"#d89ab0",techo:"#ff77a8",techo2:"#fff1e8"},
  queseria:  {pared:"#fff1d0",borde:"#c8b080",techo:"#ffd84d",techo2:"#e8b400"},
  telar:     {pared:"#9ec8f0",borde:"#5a8ab8",techo:"#3b4a8c",techo2:"#2a3770"}
};
function edificio(ctx,i,z,now,trabaja,lv,bloq){
  var d=A.FABRICAS[i], e=ESTILO[d.id], x=z.x, y=z.y, k;
  r(ctx,"rgba(0,0,0,.2)",x+4,y+46,48,6);
  if(bloq){ /* en obras */
    r(ctx,"#8a6a4a",x+8,y+18,40,28); r(ctx,"#6b4220",x+8,y+18,40,2);
    for(k=0;k<4;k++){r(ctx,"#c8a06a",x+10+k*10,y+14,2,32);} r(ctx,"#c8a06a",x+8,y+26,40,2); r(ctx,"#c8a06a",x+8,y+38,40,2);
    ctx.save(); ctx.strokeStyle="#c8a06a"; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(x+10,y+44); ctx.lineTo(x+46,y+16); ctx.stroke(); ctx.restore();
    return;
  }
  if(d.id==="molino"){
    r(ctx,e.borde,x+18,y+14,22,34); r(ctx,e.pared,x+19,y+15,20,32);
    for(k=0;k<5;k++)r(ctx,"rgba(0,0,0,.08)",x+19,y+19+k*6,20,1);
    ctx.fillStyle=e.techo; ctx.beginPath(); ctx.moveTo(x+15,y+16); ctx.lineTo(x+29,y+2); ctx.lineTo(x+43,y+16); ctx.fill();
    r(ctx,"#5a3a1c",x+25,y+36,8,11); r(ctx,"#29adff",x+26,y+22,6,5);
    /* aspas que giran más rápido si trabaja (y con el nivel) */
    var ang=now/(trabaja?(260-lv*50):1400);
    ctx.save(); ctx.translate(x+29,y+12); ctx.rotate(ang);
    for(k=0;k<4;k++){ctx.rotate(Math.PI/2); r(ctx,"#6b4220",-1,0,2,18); r(ctx,"#fff1e8",1,4,5,13); r(ctx,"#c2c3c7",1,4,5,1);}
    ctx.restore(); r(ctx,"#3f2812",x+27,y+10,4,4);
  }else{
    var techoAlto=d.id==="establo"?16:12;
    r(ctx,e.borde,x+6,y+18,44,30); r(ctx,e.pared,x+7,y+19,42,28);
    if(d.id==="horno")for(k=0;k<6;k++)r(ctx,"rgba(0,0,0,.12)",x+7+(k%2)*4,y+22+k*4,42,1);
    /* tejado */
    ctx.fillStyle=e.techo; ctx.beginPath(); ctx.moveTo(x+2,y+20); ctx.lineTo(x+28,y+20-techoAlto); ctx.lineTo(x+54,y+20); ctx.fill();
    ctx.fillStyle=e.techo2; for(k=0;k<techoAlto;k+=3){var w=(k/techoAlto)*52; ctx.fillRect(x+2+w/2,y+20-k,52-w,1);}
    if(d.id==="jugos"||d.id==="pasteleria"){for(k=0;k<6;k++)r(ctx,k%2?e.techo:e.techo2,x+6+k*7.4,y+19,7.4,6);}
    if(d.id==="queseria"){r(ctx,"#e8b400",x+18,y+12,3,3);r(ctx,"#e8b400",x+32,y+15,4,3);r(ctx,"#e8b400",x+26,y+9,2,2);}
    /* puerta y ventanas */
    if(d.id==="establo"||d.id==="gallinero"){r(ctx,"#fff1e8",x+21,y+30,14,17);r(ctx,e.borde,x+22,y+31,12,16);
      ctx.save();ctx.strokeStyle="#fff1e8";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+22,y+31);ctx.lineTo(x+34,y+47);ctx.moveTo(x+34,y+31);ctx.lineTo(x+22,y+47);ctx.stroke();ctx.restore();}
    else{r(ctx,"#5a3a1c",x+23,y+33,10,14); r(ctx,"#ffec27",x+31,y+40,1,1);}
    r(ctx,"#3b4a8c",x+10,y+27,8,7); r(ctx,trabaja&&late(now,500)?"#ffec27":"#7fd4ff",x+11,y+28,6,5);
    r(ctx,"#3b4a8c",x+38,y+27,8,7); r(ctx,trabaja&&late(now,700)?"#ffec27":"#7fd4ff",x+39,y+28,6,5);
    if(d.id==="horno"){r(ctx,"#5f574f",x+40,y+4,6,12); if(trabaja)for(k=0;k<3;k++){var f=((now/600+k/3)%1); ctx.fillStyle="rgba(230,230,230,"+(0.7-f*0.7)+")"; ctx.beginPath(); ctx.arc(x+43+f*6,y+2-f*14,2+f*3,0,Math.PI*2); ctx.fill();}}
    if(d.id==="telar"){ctx.save();ctx.translate(x+52,y+38);ctx.rotate(trabaja?now/200:0);ctx.strokeStyle="#6b4220";ctx.lineWidth=1.2;
      ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.moveTo(-6,0);ctx.lineTo(6,0);ctx.moveTo(0,-6);ctx.lineTo(0,6);ctx.stroke();ctx.restore();}
    if(d.id==="jugos"){r(ctx,"#ffa300",x+8,y+42,4,4);r(ctx,"#ffa300",x+13,y+43,4,3);}
  }
  /* letrero con el producto y las estrellas del nivel de la máquina */
  r(ctx,"#3f2812",x+2,y+44,2,8); r(ctx,"#fff1e8",x,y+40,18,9); r(ctx,"#c8a06a",x,y+40,18,1);
  spr(ctx,d.da,x+1,y+38.5,1);
  for(k=0;k<lv;k++)r(ctx,"#ffa300",x+12,y+41+k*2.4,3,1.6);
}
function animal(ctx,tipo,x,y,dir,now){
  if(tipo==="gallina"){var p=late(now,300);
    r(ctx,"#fff1e8",x,y,6,4); r(ctx,"#fff1e8",x+(dir>0?4:-1),y-2,3,3); r(ctx,"#ff004d",x+(dir>0?5:0),y-3,1,1); r(ctx,"#ffa300",x+(dir>0?7:-2),y-1,1,1);
    r(ctx,"#ffa300",x+1,y+4,1,p?2:1); r(ctx,"#ffa300",x+4,y+4,1,p?1:2);}
  else{ /* vaca */
    r(ctx,"#fff1e8",x,y,12,7); r(ctx,"#1d1d1d",x+2,y+1,3,3); r(ctx,"#1d1d1d",x+7,y+3,3,2);
    r(ctx,"#fff1e8",x+(dir>0?11:-4),y-2,5,5); r(ctx,"#ffccaa",x+(dir>0?14:-4),y+1,2,2);
    r(ctx,"#1d1d1d",x+1,y+7,2,3); r(ctx,"#1d1d1d",x+9,y+7,2,3);}
}
function granjero(ctx,x,y,dir,anda,now){
  var p=anda&&late(now,180);
  r(ctx,"rgba(0,0,0,.2)",x-4,y+11,9,2);
  r(ctx,"#2a3770",x-3,y+6,2,5-(p?1:0)); r(ctx,"#2a3770",x+1,y+6,2,5-(p?0:1));   /* piernas */
  r(ctx,"#ff004d",x-4,y,8,7); r(ctx,"#29adff",x-3,y+2,6,5);                     /* camisa y peto */
  r(ctx,"#ffccaa",x-3,y-5,6,5); r(ctx,"#1d1d1d",x+(dir>0?1:-2),y-3,1,1);
  r(ctx,"#e8b400",x-5,y-6,10,2); r(ctx,"#ffec27",x-3,y-9,6,3);                    /* sombrero */
}

/* ===================== UNA PARTIDA ===================== */
var J=null;
function para(){if(J){J.vivo=false;if(J.raf)cancelAnimationFrame(J.raf);if(J.fuera)J.fuera();J=null;}}

function monta(cont,datos,cfg,done){
  para();
  cfg=cfg||{};
  var marca=cfg.marca||{}, nombres={};
  ORDEN.forEach(function(k){nombres[k]=(marca.productos&&marca.productos[k])||A.ITEMS[k].nom;});
  cont.insertAdjacentHTML("beforeend",
    '<div class="gx gx-gr" id="gx"><div class="gx-lienzo"><canvas id="gx-cv" width="'+VW+'" height="'+VH+'" aria-label="Granja Grande: mapa de la granja"></canvas>'+
    '<div class="gx-q" id="gx-q" hidden role="dialog" aria-modal="true"></div></div>'+
    '<div class="gx-bar"><span class="gx-msg" id="gx-msg">Arrastra para recorrer la granja. Toca una parcela para sembrar.</span>'+
    '<button type="button" class="ghost au-mini" id="gx-son" title="Sonido">'+(U.mudo()?"🔇":"🔊")+'</button>'+
    '<button type="button" class="ghost au-mini" id="gx-fin">Terminar</button></div>'+
    '<details class="gx-ley"><summary>Recetas, máquinas y mejoras</summary><ul>'+
      A.FABRICAS.map(function(f,i){return '<li><b>'+esc(f.nom)+'</b> (nivel '+f.nivel+'): '+Object.keys(f.de).map(function(k){return f.de[k]+' '+esc(nombres[k]);}).join(" + ")+
        ' → '+esc(nombres[f.da])+' · '+(f.dura/10)+' s · mejorar: '+A.costoMaquina(i,1)+' y '+A.costoMaquina(i,2)+' monedas</li>';}).join("")+
      '<li>Cultivos: '+A.CULTIVOS.map(function(k){return esc(nombres[k])+' '+(A.ITEMS[k].crece/10)+' s (nivel '+A.ITEMS[k].nivel+')';}).join(", ")+'. Cada parcela da 2.</li>'+
      '<li><b>Máquinas</b>: toca el letrero ⬆ de una fábrica. Nivel 2: un 20 % más rápida y una más en cola. Nivel 3: otro 20 %, otra en cola y <b>dos productos por tanda</b>.</li>'+
      '<li><b>Parcelas</b>: hasta 16; toca la del cartel «Se vende».</li>'+
      '<li><b>⚙ Mejoras</b> (abajo): amplía el granero (hasta 90) y construye el silo (+30 o +60); compra la <b>cosechadora</b> (cosecha y vuelve a sembrar sola), el <b>camión de reparto</b> (entrega solo los pedidos completos) y automatiza cada fábrica.</li>'+
      '<li>Las monedas que gastas no restan: el puntaje son todas las monedas que ganaste.</li>'+
      '<li>Niveles con '+A.NIVELES.slice(2).join(", ")+' monedas ganadas. Preguntas de mejora cada 45 s (la granja se detiene).</li></ul></details></div>');
  var cv=$("gx-cv"), ctx=cv.getContext("2d"), K=2, caja=$("gx-q"), BG=null, BGK=0;
  function ajusta(){var rc=cv.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
    K=Math.max(2,Math.min(6,Math.round((rc.width||VW*2)*dpr/VW)));
    if(cv.width!==VW*K){cv.width=VW*K;cv.height=VH*K;}
    if(BGK!==K){BG=fondo(K);BGK=K;}}
  ajusta(); window.addEventListener("resize",ajusta);

  var s=A.crea(datos.seed), log=[], semilla="t", vender=false, flot=[], banner=null, temblor=0;
  var cam={x:0,y:56,vx:0,vy:0}, gj={x:120,y:96,tx:120,ty:96,dir:1};
  var tractor={x:COBERTIZO.x+20,y:COBERTIZO.y+30,tx:COBERTIZO.x+20,ty:COBERTIZO.y+30,dir:-1}, camiones=[];
  var trenes=[], nubes=[{x:40,y:80,w:90},{x:300,y:240,w:120},{x:420,y:40,w:80}];
  var bichos=[]; for(var b=0;b<4;b++)bichos.push({t:"gallina",x:356+b*10,y:168,dir:1,base:350,ancho:44});
  for(b=0;b<2;b++)bichos.push({t:"vaca",x:418+b*20,y:166,dir:-1,base:414,ancho:40});
  var logo=null; if(marca.logo){logo=new Image();logo.src=marca.logo;}
  J={vivo:true,raf:0,cam:cam,s:s,fuera:function(){window.removeEventListener("resize",ajusta);}};
  var yo=J, t0=0, inicio=performance.now()+3200, pausa=0;
  var qs=null, qsError=false;
  var vistas={}; try{vistas=JSON.parse(localStorage.getItem("gx_vistas")||"{}")||{};}catch(e){}
  api("/api/granja/preguntas",{seed:datos.seed,evita:Object.keys(vistas)}).then(function(x){qs=x.preguntas||[];},function(){qsError=true;});

  function msg(t){var m=$("gx-msg"); if(m)m.textContent=t;}
  function flota(t,x,y,c,mundo){flot.push({t:t,x:x,y:y,c:c||P.y,t0:performance.now(),mundo:!!mundo});}
  function hace(a,b,c,d,e){ if(!A.act(s,a,b,c,d,e))return false;
    log.push(a==="q"?[s.tick,a,b,c,d,e]:c==null?[s.tick,a,b]:[s.tick,a,b,c]); return true; }
  function falta(de){return Object.keys(de).filter(function(k){return (s.granero[k]||0)<de[k];}).map(function(k){return (de[k]-(s.granero[k]||0))+" "+nombres[k];}).join(", ");}
  function anden(){return A.ANDENES[s.nivel];}
  function camina(x,y){gj.tx=Math.max(6,Math.min(WW-6,x));gj.ty=Math.max(40,Math.min(WH-14,y));}
  function encuadra(){cam.x=Math.max(0,Math.min(WW-VW,cam.x));cam.y=Math.max(0,Math.min(WH-VIEWH,cam.y));}

  /* ---------- paneles: pregunta, máquina y granero ---------- */
  function cierraCaja(){caja.hidden=true;caja.innerHTML="";}
  function panelMaquina(i){
    var d=A.FABRICAS[i], f=s.fabricas[i], c=A.costoMaquina(i,f.lv);
    var sig=f.lv===1?"un 20 % más rápida y una más en cola":"otro 20 %, una más en cola y dos productos por tanda";
    caja.hidden=false;
    caja.innerHTML='<div class="gx-qc"><div class="gx-qh"><span>⚙️ '+esc(d.nom)+' · máquina nivel '+f.lv+'</span><button type="button" class="gx-x" id="gx-cx">✕</button></div>'+
      '<p class="gx-qn">Receta: '+Object.keys(d.de).map(function(k){return d.de[k]+' '+esc(nombres[k]);}).join(" + ")+' → '+(A.salida(s,i))+' '+esc(nombres[d.da])+
      ' · '+(A.dura(s,i)/10).toFixed(1).replace(".0","").replace(".",",")+' s por tanda · cola de '+A.cola(s,i)+'.</p>'+
      '<div class="gx-mej">'+
      '<button type="button" id="gx-fab"'+(A.hay(s,d.de)&&f.cola.length<A.cola(s,i)?'':' disabled')+'><b>Fabricar</b><small>'+(A.hay(s,d.de)?(f.cola.length<A.cola(s,i)?"Poner una tanda en la cola":"La cola está llena"):"Faltan "+esc(falta(d.de)))+'</small></button>'+
      (c?'<button type="button" id="gx-up"'+(s.monedas>=c?'':' disabled')+'><b>Mejorar a nivel '+(f.lv+1)+' · '+c+' monedas</b><small>'+sig+(s.monedas>=c?'':' · te faltan '+(c-s.monedas))+'</small></button>':
        '<p class="gx-qn"><b>Máquina al máximo.</b></p>')+
      (f.auto?'<button type="button" id="gx-au" class="'+(f.on?'gx-on':'gx-off')+'"><b>Automática · '+(f.on?'encendida':'apagada')+'</b><small>Toca para '+(f.on?'apagarla':'encenderla')+'</small></button>':
        '<button type="button" id="gx-au"'+(s.monedas>=A.costoAutoFab(i)?'':' disabled')+'><b>Automatizar · '+A.costoAutoFab(i)+' monedas</b><small>Fabrica sola lo que piden los pedidos, sin gastar lo que ellos necesitan</small></button>')+'</div></div>';
    $("gx-cx").onclick=cierraCaja;
    if($("gx-fab"))$("gx-fab").onclick=function(){if(hace("f",i))cierraCaja();};
    if($("gx-up"))$("gx-up").onclick=function(){if(hace("u",i)){SON.nivel();cierraCaja();msg(d.nom+": máquina al nivel "+s.fabricas[i].lv+".");}};
    $("gx-au").onclick=function(){ if(f.auto){hace("T",i);panelMaquina(i);} else if(hace("F",i)){SON.nivel();panelMaquina(i);msg(d.nom+": ahora es automática.");} };
  }
  /* almacenamiento y automatización: todo lo que se compra con monedas */
  function panelMejoras(){
    var fila=function(id,titulo,detalle,costo,max,nota){
      return '<button type="button" data-compra="'+id+'"'+(costo!=null&&s.monedas>=costo?'':' disabled')+'><b>'+titulo+(costo!=null?' · '+costo+' monedas':'')+'</b><small>'+detalle+
        (costo==null?' · '+(max||'al máximo'):s.monedas<costo?' · te faltan '+(costo-s.monedas):'')+(nota?' · '+nota:'')+'</small></button>';};
    var g=A.COSTO_GRANERO[s.graneroLv], h='<div class="gx-qc gx-panel"><div class="gx-qh"><span>⚙️ Mejoras de la granja</span><button type="button" class="gx-x" id="gx-cx">✕</button></div>'+
      '<p class="gx-qn">Tienes <b>'+s.monedas+' monedas</b>. Lo que inviertes no resta del puntaje.</p>'+
      '<span class="gx-mt">📦 Almacenamiento · '+A.total(s)+'/'+A.capacidad(s)+'</span><div class="gx-mej">'+
      fila("g",g!=null?"Ampliar el granero":"Granero",g!=null?"+12 lugares (nivel "+(s.graneroLv+1)+" de 5)":"Granero al máximo",g,"al máximo")+
      fila("A2",s.auto.silo?"Silo nivel "+(s.auto.silo+1):"Construir el silo",A.AUTOS.silo.desc+" ("+s.auto.silo+"/2)",A.costoAuto("silo",s.auto.silo),"silo al máximo")+
      '</div><span class="gx-mt">🤖 Automatización</span><div class="gx-mej">'+
      fila("A0",s.auto.cosechadora?"Cosechadora nivel 2":"Comprar la cosechadora",A.AUTOS.cosechadora.desc+(s.auto.cosechadora?" (ahora cada "+A.AUTOS.cosechadora.cada[s.auto.cosechadora-1]/10+" s)":" (una parcela cada 3 s; en el nivel 2, cada 1,2 s)"),A.costoAuto("cosechadora",s.auto.cosechadora),"al máximo")+
      fila("A1",s.auto.camion?"Camión nivel 2":"Comprar el camión de reparto",A.AUTOS.camion.desc+(s.auto.camion?" (ahora cada "+A.AUTOS.camion.cada[s.auto.camion-1]/10+" s)":" (revisa cada 2,5 s; en el nivel 2, cada 0,6 s)"),A.costoAuto("camion",s.auto.camion),"al máximo")+
      A.FABRICAS.map(function(d,i){var f=s.fabricas[i];
        if(d.nivel>s.nivel)return '';
        if(f.auto)return '<button type="button" data-compra="T'+i+'" class="'+(f.on?'gx-on':'gx-off')+'"><b>'+esc(d.nom)+' automática · '+(f.on?'encendida':'apagada')+'</b><small>Toca para '+(f.on?'apagarla':'encenderla')+'. Fabrica sola lo que piden los pedidos (y 3 de reserva) sin gastar lo que ellos necesitan.</small></button>';
        return fila("F"+i,"Automatizar "+esc(d.nom),"Fabrica sola cuando hay con qué",A.costoAutoFab(i));}).join("")+
      '</div></div>';
    caja.hidden=false; caja.innerHTML=h;
    $("gx-cx").onclick=cierraCaja;
    var bs=caja.querySelectorAll("[data-compra]");
    for(var n=0;n<bs.length;n++)bs[n].onclick=function(){
      var c=this.getAttribute("data-compra"), ok=false;
      if(c==="g")ok=hace("g",0); else if(c.charAt(0)==="A")ok=hace("A",+c.slice(1)); else if(c.charAt(0)==="F")ok=hace("F",+c.slice(1)); else if(c.charAt(0)==="T")ok=hace("T",+c.slice(1));
      if(ok){ if(c.charAt(0)!=="T")SON.nivel(); var y0=caja.querySelector(".gx-qc").scrollTop; panelMejoras(); caja.querySelector(".gx-qc").scrollTop=y0; }
      else SON.no();
    };
  }
  function abrePregunta(){
    if(!s.qDisp||pausa)return;
    if(qsError||!qs){msg(qsError?"Sin conexión: las preguntas de mejora necesitan internet.":"Cargando las preguntas…");return;}
    var q=qs.filter(function(x){return !s.qUsadas[x.id];})[0];
    if(!q){msg("No quedan preguntas nuevas para ti por ahora.");return;}
    pausa=performance.now();
    var lim=20, quedan=lim, tq, ok=false;
    caja.hidden=false;
    caja.innerHTML='<div class="gx-qc"><div class="gx-qh"><span>❓ Pregunta de mejora</span><span class="gx-qa">'+esc(q.area)+'</span></div>'+
      '<p class="gx-qt">'+esc(q.q)+'</p><div class="gx-qo">'+q.o.map(function(o,i){return '<button type="button" data-o="'+i+'">'+esc(o)+'</button>';}).join("")+'</div>'+
      '<div class="gx-qb"><i id="gx-qbar"></i></div><p class="gx-qn" id="gx-qn">Acierta y elige una mejora. La granja está en pausa.</p></div>';
    var bs=caja.querySelectorAll("[data-o]");
    tq=setInterval(function(){quedan-=0.1;var b=$("gx-qbar");if(b)b.style.width=Math.max(0,quedan/lim*100)+"%";if(quedan<=0)elige(-1);},100);
    function elige(i){ if(ok)return; ok=true; clearInterval(tq);
      for(var k=0;k<bs.length;k++)bs[k].disabled=true; if(i>=0)bs[i].classList.add("gx-sel");
      $("gx-qn").textContent="Comprobando…";
      api("/api/granja/responde",{seed:datos.seed,id:q.id,o:i}).then(function(x){
        vistas[q.id]=Date.now(); try{localStorage.setItem("gx_vistas",JSON.stringify(vistas));}catch(e){}
        if(bs[x.correcta])bs[x.correcta].classList.add("gx-bien"); if(i>=0&&!x.ok)bs[i].classList.add("gx-mal");
        if(x.ok){SON.entrega(2);mejora(q,i,x.dato);}
        else{SON.no();hace("q",i,q.id,null,false);msg((i<0?"Se acabó el tiempo":"No era esa")+": era «"+q.o[x.correcta]+"».");
          $("gx-qn").innerHTML=(i<0?"Se acabó el tiempo. ":"No era esa. ")+(x.dato?'<span class="gx-dato">'+esc(x.dato)+'</span>':''); cierra(3200);}
      },function(){hace("q",-1,q.id,null,false);$("gx-qn").textContent="No se pudo comprobar (sin conexión).";cierra(1800);});
    }
    for(var k=0;k<bs.length;k++)bs[k].onclick=function(){elige(+this.getAttribute("data-o"));};
  }
  function mejora(q,i,dato){
    var of=A.ofertas(s), hecho=false, quedan=10, tq2;
    $("gx-qn").innerHTML='<b class="gx-ok">¡Correcto! +'+A.PREMIO_Q+' monedas.</b> '+(dato?'<span class="gx-dato">'+esc(dato)+'</span>':'')+
      '<span class="gx-mt">Elige tu mejora:</span><span class="gx-mej">'+of.map(function(k){var m=A.MEJORAS[k];
        return '<button type="button" data-m="'+k+'"><b>'+esc(m.nom)+'</b><small>'+esc(m.desc)+'</small></button>';}).join("")+'</span>';
    function toma(k){if(hecho)return;hecho=true;clearInterval(tq2);hace("q",i,q.id,k,true);SON.nivel();cierra(0);msg("Mejora: "+A.MEJORAS[k].nom+". "+A.MEJORAS[k].desc+".");}
    var bs=caja.querySelectorAll("[data-m]"); for(var n=0;n<bs.length;n++)bs[n].onclick=function(){toma(this.getAttribute("data-m"));};
    tq2=setInterval(function(){quedan-=0.1;var b=$("gx-qbar");if(b)b.style.width=Math.max(0,quedan/10*100)+"%";if(quedan<=0)toma(of[0]);},100);
  }
  function cierra(ms){setTimeout(function(){cierraCaja(); if(pausa){t0+=performance.now()-pausa;pausa=0;}},ms);}

  /* ---------- zonas fijas (arriba y abajo) ---------- */
  var ZP=function(i,n){var w=(236-(n-1)*2)/n;return {x:2+Math.round(i*(w+2)),y:22,w:Math.floor(w),h:42};};
  var ZS=function(i){return {x:2+i*34.5,y:BOT+3,w:33,h:17};};
  var ZV={x:141,y:BOT+3,w:30,h:17}, ZM={x:173,y:BOT+3,w:31,h:17}, ZQ={x:206,y:BOT+3,w:32,h:17};
  var ZI=function(i){return {x:2+(i%6)*39.3,y:BOT+23+Math.floor(i/6)*25,w:37.5,h:23};};

  /* ---------- toques y arrastre ---------- */
  var toque=null;
  function logico(e){var rc=cv.getBoundingClientRect();return {x:(e.clientX-rc.left)*VW/rc.width,y:(e.clientY-rc.top)*VH/rc.height};}
  cv.addEventListener("pointerdown",function(e){
    if(!yo.vivo||s.fin)return; e.preventDefault();
    var p=logico(e); toque={x0:p.x,y0:p.y,x:p.x,y:p.y,t:performance.now(),arrastra:false,id:e.pointerId};
    try{cv.setPointerCapture(e.pointerId);}catch(x){}
    cam.vx=cam.vy=0;
  });
  cv.addEventListener("pointermove",function(e){
    if(!toque||toque.id!==e.pointerId)return;
    var p=logico(e), dx=p.x-toque.x, dy=p.y-toque.y;
    if(!toque.arrastra&&Math.abs(p.x-toque.x0)+Math.abs(p.y-toque.y0)>6&&toque.y0>=TOP&&toque.y0<BOT)toque.arrastra=true;
    if(toque.arrastra){cam.x-=dx;cam.y-=dy;cam.vx=-dx;cam.vy=-dy;encuadra();}
    toque.x=p.x;toque.y=p.y;
  });
  function suelta(e){
    if(!toque||toque.id!==e.pointerId)return;
    var t=toque; toque=null;
    if(t.arrastra)return;
    cam.vx=cam.vy=0;
    if(performance.now()<inicio||pausa)return;
    tap(t.x0,t.y0);
  }
  cv.addEventListener("pointerup",suelta); cv.addEventListener("pointercancel",function(){toque=null;});

  function tap(x,y){
    var i, z, n=anden();
    if(y<TOP){ /* pedidos */
      for(i=0;i<n;i++){z=ZP(i,n); if(!dentro(z,x,y))continue;
        var o=s.pedidos[i].p; if(!o){msg("Está llegando un pedido…");return;}
        if(x>z.x+z.w-10&&y<z.y+10){if(hace("x",i)){msg("Pedido descartado.");SON.vende();}return;}
        if(hace("e",i))return;
        msg("Para este pedido faltan: "+o.items.filter(function(it){return (s.granero[it[0]]||0)<it[1];}).map(function(it){return (it[1]-(s.granero[it[0]]||0))+" "+nombres[it[0]];}).join(", ")+"."); SON.no(); return;}
      return;
    }
    if(y>=BOT){ /* semillas, vender, pregunta y granero */
      for(i=0;i<4;i++){z=ZS(i); if(!dentro(z,x,y))continue; var k=A.CULTIVOS[i];
        if(A.ITEMS[k].nivel>s.nivel){msg(nombres[k]+" se desbloquea en el nivel "+A.ITEMS[k].nivel+".");SON.no();return;}
        semilla=k; msg("Semilla: "+nombres[k]+". Toca una parcela vacía."); return;}
      if(dentro(ZV,x,y)){vender=!vender;msg(vender?"Modo venta: toca un producto para venderlo a mitad de precio.":"Venta cerrada.");return;}
      if(dentro(ZM,x,y)){panelMejoras();return;}
      if(dentro(ZQ,x,y)){ if(s.qDisp)abrePregunta(); else msg(s.preguntas>=A.MAX_Q?"No quedan preguntas en esta partida.":"La próxima pregunta llega en "+Math.ceil((s.proxQ-s.tick)/10)+" s."); return; }
      for(i=0;i<ORDEN.length;i++){z=ZI(i); if(!dentro(z,x,y))continue; var it=ORDEN[i];
        if(A.ITEMS[it].nivel>s.nivel){msg(nombres[it]+" aparece en el nivel "+A.ITEMS[it].nivel+".");return;}
        if(vender){if(!hace("v",0,it)){msg("No tienes "+nombres[it]+".");SON.no();}return;}
        msg(nombres[it]+": tienes "+(s.granero[it]||0)+"."); return;}
      return;
    }
    if(dentro(MINI,x,y)){cam.x=(x-MINI.x)/MINI.w*WW-VW/2;cam.y=(y-MINI.y)/MINI.h*WH-VIEWH/2;encuadra();return;}
    /* en el mundo */
    var wx=x+cam.x, wy=y-TOP+cam.y;
    for(i=0;i<A.FABRICAS.length;i++){
      z=FAB[i]; var d=A.FABRICAS[i];
      if(dentro(SIGNO(z),wx,wy)&&d.nivel<=s.nivel){camina(z.x+28,z.y+60);panelMaquina(i);return;}
      if(!dentro(z,wx,wy))continue;
      camina(z.x+28,z.y+60);
      if(d.nivel>s.nivel){msg(d.nom+" se construye al llegar al nivel "+d.nivel+".");SON.no();return;}
      if(hace("f",i))return;
      if(s.fabricas[i].cola.length>=A.cola(s,i))msg(d.nom+": la cola está llena. Mejora la máquina (letrero ⬆) para tener más.");
      else msg(d.nom+": faltan "+falta(d.de)+".");
      SON.no(); return;
    }
    for(i=0;i<A.MAX_PARCELAS;i++){z=PLOT(i); if(!dentro(z,wx,wy))continue;
      camina(z.x+16,z.y+34);
      if(i>=s.parcelasN){
        if(i!==s.parcelasN){msg("Primero compra la parcela del cartel «Se vende».");return;}
        if(hace("b",0)){SON.nivel();msg("¡Parcela comprada!");}else{msg("Esta parcela cuesta "+A.costoParcela(s)+" monedas; tienes "+s.monedas+".");SON.no();}
        return;}
      var pc=s.parcelas[i];
      if(!pc.c){if(hace("s",i,semilla))return; msg(A.ITEMS[semilla].nivel>s.nivel?nombres[semilla]+" se desbloquea en el nivel "+A.ITEMS[semilla].nivel+".":"No se puede sembrar.");SON.no();return;}
      if(s.tick-pc.t0>=A.crece(s,pc.c)){if(hace("c",i))return; msg("El granero está lleno: entrega, vende o amplíalo (toca el granero).");SON.no();return;}
      msg(nombres[pc.c]+": le faltan "+Math.ceil((A.crece(s,pc.c)-(s.tick-pc.t0))/10)+" s."); return;}
    if(dentro(GRANERO,wx,wy)){camina(GRANERO.x+33,GRANERO.y+64);panelMejoras();return;}
    if(dentro(COBERTIZO,wx,wy)||dentro(GARAJE,wx,wy)||dentro(SILO,wx,wy)){camina(wx,wy+20);panelMejoras();return;}
    if(dentro(ESTACION,wx,wy)){msg("La estación: los pedidos se entregan tocándolos arriba.");return;}
    camina(wx,wy);
  }
  $("gx-son").onclick=function(){var m=!U.mudo();U.mudo(m);this.textContent=m?"🔇":"🔊";};
  $("gx-fin").onclick=function(){if(!yo.vivo||s.fin||pausa)return; if(!confirm("¿Terminar ya con "+s.ganado+" monedas ganadas?"))return; termina("plantado");};

  function termina(motivo){
    if(!yo.vivo)return; yo.vivo=false; cancelAnimationFrame(yo.raf); yo.fuera(); cierraCaja();
    var envio={a:log,fin:s.tick}; dibuja(performance.now(),motivo||s.motivo); SON.fin();
    setTimeout(function(){var g=$("gx");if(g)g.remove();if(J===yo)J=null;done(envio);},1300);
  }

  function eventos(){
    var now=performance.now();
    s.ev.forEach(function(e){
      if(e.tipo==="siembra")SON.siembra();
      else if(e.tipo==="cosecha"){if(!e.auto)SON.cosecha();var z=PLOT(e.i);flota("+"+e.n,z.x+10,z.y+6,e.auto?"#bfe9ff":P.w,true);
        if(e.auto){tractor.tx=z.x+16;tractor.ty=z.y+20;}}
      else if(e.tipo==="fabrica")SON.fabrica();
      else if(e.tipo==="hecho"){SON.hecho();var f=FAB[e.f];flota("+1 "+nombres[e.k],f.x+10,f.y+4,"#7dff9a",true);}
      else if(e.tipo==="entrega"){SON.entrega(e.combo);var z2=ZP(Math.min(e.i,anden()-1),anden());flota("+"+e.monedas,z2.x+z2.w/2-6,z2.y+14,P.y);
        trenes.push({x:ESTACION.x+10,t0:now,v:0.09});
        if(e.auto)camiones.push({t0:now});
        msg((e.auto?"🚚 El camión entregó un pedido: +":"¡Entregado! +")+e.monedas+" monedas"+(e.combo?" · combo "+e.combo:"")+".");}
      else if(e.tipo==="perdido"){SON.perdido();temblor=now+400;msg("¡Se fue un pedido! Te quedan "+s.vidas+(s.vidas===1?" vida.":" vidas."));}
      else if(e.tipo==="nivel"){SON.nivel();banner={t:"¡NIVEL "+e.n+"!",t0:now};
        var nuevas=A.FABRICAS.filter(function(f){return f.nivel===e.n;}).map(function(f){return f.nom;}).concat(A.CULTIVOS.filter(function(k){return A.ITEMS[k].nivel===e.n;}).map(function(k){return nombres[k];}));
        msg("Nivel "+e.n+(nuevas.length?": "+nuevas.join(", ")+".":"."));}
      else if(e.tipo==="vende"){SON.vende();}
      else if(e.tipo==="pregunta"){SON.cuenta();msg("¡Hay una pregunta de mejora! Toca «❓» abajo.");}
      else if(e.tipo==="mejora"){banner={t:"¡MEJORA!",t0:now};}
      else if(e.tipo==="maquina"){var f2=FAB[e.f];flota("★ NIVEL "+e.lv,f2.x+4,f2.y-6,"#ffd84d",true);}
      else if(e.tipo==="parcela"){var z3=PLOT(e.i);flota("¡NUEVA!",z3.x,z3.y+10,"#ffd84d",true);}
      else if(e.tipo==="lleno")msg("El granero está lleno: lo fabricado espera en la fábrica. Amplía el almacenamiento en ⚙ Mejoras.");
      else if(e.tipo==="auto"){banner={t:"¡"+A.AUTOS[e.k].nom.toUpperCase()+"!",t0:now}; msg(A.AUTOS[e.k].nom+(e.lv>1?" mejorado al nivel "+e.lv:" comprado")+". "+A.AUTOS[e.k].desc+".");}
      else if(e.tipo==="autofab"){var f3=FAB[e.f];flota("⚙ AUTO",f3.x+8,f3.y-6,"#7dff9a",true);}
    });
    s.ev.length=0;
  }

  /* ---------- dibujo ---------- */
  function tx(t,x,y,o){o=o||{};ctx.font=(o.peso||700)+" "+(o.t||7)+"px "+FUENTE;ctx.textBaseline="top";ctx.textAlign=o.al||"left";
    if(o.sombra){ctx.fillStyle="rgba(0,0,0,.65)";ctx.fillText(t,x+0.6,y+0.6);} ctx.fillStyle=o.c||P.w;ctx.fillText(t,x,y);}
  function caja2(x,y,w,h,c,b,g){r(ctx,c,x,y,w,h); if(b){g=g||1;r(ctx,b,x,y,w,g);r(ctx,b,x,y+h-g,w,g);r(ctx,b,x,y,g,h);r(ctx,b,x+w-g,y,g,h);}}
  function barra(x,y,w,h,fr,c){r(ctx,"rgba(0,0,0,.45)",x,y,w,h);r(ctx,c,x,y,Math.max(0,w*Math.min(1,fr)),h);}
  function pill(t,cx,y,c){ctx.font="800 5.5px "+FUENTE;var w=ctx.measureText(t).width+6;caja2(cx-w/2,y,w,8,"rgba(20,16,10,.72)");tx(t,cx,y+1.2,{t:5.5,c:c||"#fff",al:"center",peso:800});}

  function cobertizo(now){var c=COBERTIZO;
    r(ctx,"rgba(0,0,0,.2)",c.x+3,c.y+c.h-4,c.w,5);
    r(ctx,"#5a3a1c",c.x+4,c.y+12,c.w-8,c.h-14); r(ctx,"#86552b",c.x+5,c.y+13,c.w-10,c.h-16);
    for(var k=0;k<6;k++)r(ctx,"rgba(0,0,0,.15)",c.x+5+k*8,c.y+13,1,c.h-16);
    ctx.fillStyle="#5f574f"; ctx.fillRect(c.x+1,c.y+8,c.w-2,5);
    r(ctx,"#2a1608",c.x+14,c.y+20,c.w-28,c.h-22);
    if(!s.auto.cosechadora){pillW("Cosechadora · ⚙ Mejoras",c.x+c.w/2,c.y+c.h-2);} else pillW("Cosechadora nv "+s.auto.cosechadora,c.x+c.w/2,c.y+c.h-2,"#7dff9a");}
  function garaje(now){var c=GARAJE;
    r(ctx,"rgba(0,0,0,.2)",c.x+3,c.y+c.h-4,c.w,5);
    r(ctx,"#8f877a",c.x+4,c.y+12,c.w-8,c.h-14); r(ctx,"#c9c2b4",c.x+5,c.y+13,c.w-10,c.h-16);
    ctx.fillStyle="#3b4a8c"; ctx.fillRect(c.x+1,c.y+8,c.w-2,5);
    for(var k=0;k<5;k++)r(ctx,"#8f877a",c.x+12,c.y+18+k*4,c.w-24,1.5);
    if(s.auto.camion&&!camiones.length)dibujaCamion(c.x+c.w/2-8,c.y+28,1,s.auto.camion);
    if(!s.auto.camion)pillW("Camión · ⚙ Mejoras",c.x+c.w/2,c.y+c.h-2); else pillW("Camión nv "+s.auto.camion,c.x+c.w/2,c.y+c.h-2,"#7dff9a");}
  function silo(now){var c=SILO, lv=s.auto.silo;
    r(ctx,"rgba(0,0,0,.2)",c.x+2,c.y+c.h-4,c.w,5);
    if(!lv){r(ctx,"#8a8a8a",c.x+4,c.y+c.h-12,c.w-8,8); pillW("Silo · ⚙",c.x+c.w/2,c.y+c.h-24);return;}
    var alto=lv===1?30:38;
    r(ctx,"#8f877a",c.x+5,c.y+c.h-alto-4,c.w-10,alto); r(ctx,"#c2c3c7",c.x+6,c.y+c.h-alto-3,c.w-12,alto-2);
    for(var k=0;k<alto;k+=6)r(ctx,"rgba(0,0,0,.12)",c.x+6,c.y+c.h-alto-3+k,c.w-12,1);
    ctx.fillStyle="#ff004d"; ctx.beginPath(); ctx.ellipse(c.x+c.w/2,c.y+c.h-alto-4,(c.w-10)/2,6,0,Math.PI,0); ctx.fill();
    pillW("Silo +"+(30*lv),c.x+c.w/2,c.y+c.h-2,"#7dff9a");}
  function dibujaTractor(x,y,dir,now,lv){
    r(ctx,"rgba(0,0,0,.2)",x-9,y+5,18,3);
    r(ctx,lv>1?"#ff004d":"#00a04a",x-7,y-6,12,7); r(ctx,"#1d2b53",x+(dir>0?-1:-6),y-12,6,6); r(ctx,"#7fd4ff",x+(dir>0?0:-5),y-11,4,3);
    r(ctx,"#5f574f",x+(dir>0?4:-8),y-9,1.5,4);
    var g=late(now,120);
    r(ctx,"#1d1d1d",x+(dir>0?-8:2),y-3,7,7); r(ctx,g?"#5f574f":"#3f3a35",x+(dir>0?-6:4),y-1,3,3);
    r(ctx,"#1d1d1d",x+(dir>0?3:-7),y,4,4);}
  function dibujaCamion(x,y,dir,lv){
    r(ctx,"rgba(0,0,0,.2)",x-1,y+7,18,2);
    r(ctx,marca.color||(lv>1?"#ff004d":"#ffa300"),x+(dir>0?0:5),y-3,11,9); r(ctx,"#29adff",x+(dir>0?11:0),y,5,6); r(ctx,"#7fd4ff",x+(dir>0?12:1),y+1,3,2);
    r(ctx,"#1d1d1d",x+2,y+6,3,3); r(ctx,"#1d1d1d",x+11,y+6,3,3);
    if(logo)try{ctx.drawImage(logo,x+(dir>0?2:7),y-2,7,7);}catch(e){}}
  function pillW(t,cx,y,c){ctx.font="800 4.8px "+FUENTE;var w=ctx.measureText(t).width+5;caja2(cx-w/2,y-8,w,7,"rgba(20,16,10,.72)");tx(t,cx,y-7,{t:4.8,c:c||"#fff",al:"center",peso:800});}
  function mundo(now){
    var tk=s.tick, i, z;
    ctx.save();
    ctx.beginPath(); ctx.rect(0,TOP,VW,VIEWH); ctx.clip();
    ctx.drawImage(BG,cam.x*K,cam.y*K,VW*K,VIEWH*K,0,TOP,VW,VIEWH);
    ctx.translate(-cam.x,TOP-cam.y);
    /* agua que brilla */
    for(i=0;i<5;i++){var f=(now/1500+i/5)%1; r(ctx,"rgba(255,255,255,"+(0.5-Math.abs(f-0.5))+")",ESTANQUE.x-40+i*16+f*10,ESTANQUE.y-14+(i%3)*10,7,1);}
    /* estación, granero y casa */
    var e=ESTACION; r(ctx,"rgba(0,0,0,.2)",e.x+2,e.y+40,e.w,5);
    r(ctx,"#8f3a26",e.x+6,e.y+12,e.w-12,24); r(ctx,"#c4553a",e.x+7,e.y+13,e.w-14,22);
    ctx.fillStyle="#3b4a8c"; ctx.beginPath(); ctx.moveTo(e.x,e.y+14); ctx.lineTo(e.x+e.w/2,e.y); ctx.lineTo(e.x+e.w,e.y+14); ctx.fill();
    r(ctx,"#fff1e8",e.x+e.w/2-16,e.y+16,32,7); tx("ESTACIÓN",e.x+e.w/2,e.y+16.8,{t:5,c:"#3b4a8c",al:"center",peso:900});
    r(ctx,"#5a3a1c",e.x+e.w/2-5,e.y+25,10,11); r(ctx,"#7fd4ff",e.x+12,e.y+25,8,6); r(ctx,"#7fd4ff",e.x+e.w-20,e.y+25,8,6);
    var g=GRANERO; r(ctx,"rgba(0,0,0,.2)",g.x+3,g.y+g.h-4,g.w,6);
    r(ctx,"#7e241c",g.x+4,g.y+20,g.w-8,g.h-24); r(ctx,"#b5372b",g.x+5,g.y+21,g.w-10,g.h-26);
    ctx.fillStyle="#5f574f"; ctx.beginPath(); ctx.moveTo(g.x,g.y+22); ctx.lineTo(g.x+g.w/2,g.y+2); ctx.lineTo(g.x+g.w,g.y+22); ctx.fill();
    r(ctx,"#fff1e8",g.x+g.w/2-11,g.y+34,22,22); r(ctx,"#7e241c",g.x+g.w/2-10,g.y+35,20,21);
    ctx.save(); ctx.strokeStyle="#fff1e8"; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(g.x+g.w/2-10,g.y+35); ctx.lineTo(g.x+g.w/2+10,g.y+56); ctx.moveTo(g.x+g.w/2+10,g.y+35); ctx.lineTo(g.x+g.w/2-10,g.y+56); ctx.stroke(); ctx.restore();
    r(ctx,"#fff1e8",g.x+g.w/2-5,g.y+12,10,8); r(ctx,"#3f2812",g.x+g.w/2-4,g.y+13,8,6);
    var lleno=A.total(s)>=A.capacidad(s);
    pill("Granero "+A.total(s)+"/"+A.capacidad(s)+(s.graneroLv<3?" ⬆":""),g.x+g.w/2,g.y-4,lleno&&late(now,250)?"#ff8fab":"#fff");
    var c2=CASA; r(ctx,"rgba(0,0,0,.2)",c2.x+3,c2.y+c2.h-4,c2.w,5);
    r(ctx,"#c8a06a",c2.x+4,c2.y+18,c2.w-8,c2.h-20); r(ctx,"#e8d0a0",c2.x+5,c2.y+19,c2.w-10,c2.h-22);
    ctx.fillStyle="#ab5236"; ctx.beginPath(); ctx.moveTo(c2.x,c2.y+20); ctx.lineTo(c2.x+c2.w/2,c2.y+2); ctx.lineTo(c2.x+c2.w,c2.y+20); ctx.fill();
    r(ctx,"#5a3a1c",c2.x+c2.w/2-4,c2.y+28,8,12); r(ctx,"#7fd4ff",c2.x+8,c2.y+26,7,6); r(ctx,"#7fd4ff",c2.x+c2.w-15,c2.y+26,7,6);
    r(ctx,"#5f574f",c2.x+c2.w-12,c2.y+4,5,10);
    /* parcelas */
    for(i=0;i<A.MAX_PARCELAS;i++){
      z=PLOT(i);
      if(i>=s.parcelasN){
        r(ctx,"rgba(60,110,50,.6)",z.x,z.y,z.w,z.h);
        if(i===s.parcelasN){var pu=s.monedas>=A.costoParcela(s);
          r(ctx,"#6b4220",z.x+15,z.y+14,2,14); caja2(z.x+3,z.y+5,26,13,"#fff1e8","#8a5a2b");
          tx("SE VENDE",z.x+16,z.y+6.5,{t:4.2,c:"#7e241c",al:"center",peso:900}); tx(A.costoParcela(s)+"",z.x+16,z.y+11.5,{t:5,c:pu?"#0d7a43":"#8a6a4a",al:"center",peso:800});
          if(pu&&late(now,400))caja2(z.x,z.y,z.w,z.h,"rgba(255,236,39,.12)","#ffec27");}
        continue;}
      var pc=s.parcelas[i];
      r(ctx,"#5a3a1c",z.x,z.y,z.w,z.h); r(ctx,"#6b4220",z.x+1,z.y+1,z.w-2,z.h-2);
      for(var f2=0;f2<4;f2++)r(ctx,"#86552b",z.x+2,z.y+3+f2*7.5,z.w-4,2.5);
      if(!pc.c){ if(A.ITEMS[semilla].nivel<=s.nivel)spr(ctx,semilla,z.x+11,z.y+11,1,late(now,600)?0.45:0.25); continue; }
      var cr=A.crece(s,pc.c), cre=(tk-pc.t0)/cr;
      if(cre>=1){
        caja2(z.x,z.y,z.w,z.h,"rgba(255,236,39,.12)",late(now,250)?"#ffec27":"#e8b400");
        var bo=late(now,170)?0:1;
        spr(ctx,pc.c,z.x+3,z.y+3+bo); spr(ctx,pc.c,z.x+18,z.y+4-bo); spr(ctx,pc.c,z.x+4,z.y+17-bo); spr(ctx,pc.c,z.x+18,z.y+18+bo);
        if(late(now,300)){r(ctx,"#fff",z.x+28,z.y+2,1,3);r(ctx,"#fff",z.x+27,z.y+3,3,1);}
      }else{
        var col={t:"#ffd84d",m:"#7dff9a",z:"#ffa300",a:"#fff1e8"}[pc.c], al=Math.max(1,Math.round(cre*7));
        for(var q=0;q<4;q++)for(var w=0;w<3;w++){var px=z.x+5+w*10, py=z.y+8+q*7.5;
          r(ctx,"#2c7a3a",px,py-al,2,al); if(cre>0.5){r(ctx,col,px-1,py-al,4,2);}}
        barra(z.x+2,z.y+z.h-3,z.w-4,2,cre,"#7dff9a");
      }
    }
    /* fábricas */
    for(i=0;i<A.FABRICAS.length;i++){
      z=FAB[i]; var d=A.FABRICAS[i], fb=s.fabricas[i], bloq=d.nivel>s.nivel;
      edificio(ctx,i,z,now,fb.cola.length>0,fb.lv,bloq);
      if(bloq){pill("Nivel "+d.nivel+" · "+d.nom,z.x+28,z.y+30);continue;}
      pill(d.nom,z.x+28,z.y+57);
      for(var c3=0;c3<A.cola(s,i);c3++)r(ctx,c3<fb.cola.length?"#ffec27":"rgba(0,0,0,.35)",z.x+28-A.cola(s,i)*2.5+c3*5,z.y+66,4,3);
      if(fb.cola.length)barra(z.x+10,z.y+70,36,2.5,(tk-fb.t0)/A.dura(s,i),"#7dff9a");
      if(fb.lista&&late(now,300))pill("¡GRANERO LLENO!",z.x+28,z.y+22,"#ff8fab");
      else if(!fb.cola.length&&A.hay(s,d.de)&&late(now,700))pill("toca para fabricar",z.x+28,z.y+22,"#bfe9ff");
      if(fb.auto){caja2(z.x+2,z.y-4,20,9,fb.on?"#0d7a43":"#5f574f","#fff1e8"); tx("AUTO",z.x+12,z.y-2.6,{t:5,c:"#fff",al:"center",peso:900});
        if(fb.on){ctx.save();ctx.translate(z.x+46,z.y+28);ctx.rotate(now/400);r(ctx,"#c2c3c7",-3,-1,6,2);r(ctx,"#c2c3c7",-1,-3,2,6);ctx.restore();}}
      /* letrero de mejora */
      var sg=SIGNO(z), c4=A.costoMaquina(i,fb.lv), puede=c4&&s.monedas>=c4;
      caja2(sg.x,sg.y,sg.w,sg.h,c4?(puede?(late(now,450)?"#0d7a43":"#16a05a"):"#3b4a8c"):"#a07a2a","#fff1e8");
      tx(c4?"⬆":"★",sg.x+sg.w/2,sg.y+1.5,{t:9,c:"#fff",al:"center",peso:900});
    }
    /* animales */
    bichos.forEach(function(b){ if(A.FABRICAS[b.t==="gallina"?2:3].nivel>s.nivel)return;
      b.x+=b.dir*(b.t==="gallina"?0.12:0.05); if(b.x<b.base||b.x>b.base+b.ancho){b.dir*=-1;}
      if(rnd(now/2000+b.x)<0.004)b.dir*=-1; animal(ctx,b.t,b.x,b.y,b.dir,now);});
    /* trenes que salen con los pedidos */
    trenes=trenes.filter(function(t){var x=t.x+(now-t.t0)*t.v; if(x>WW+60)return false;
      r(ctx,"#ff004d",x,17,18,9); r(ctx,"#1d2b53",x+12,13,6,6); r(ctx,"#5f574f",x+2,12,3,5); r(ctx,"#29adff",x-22,18,18,8); r(ctx,"#ffa300",x-44,18,18,8);
      for(var k=0;k<6;k++)r(ctx,"#1d1d1d",x-42+k*10,26,4,3);
      var hum=((now/300)%1); ctx.fillStyle="rgba(230,230,230,"+(0.7-hum*0.7)+")"; ctx.beginPath(); ctx.arc(x+3-hum*8,9-hum*6,2+hum*3,0,Math.PI*2); ctx.fill();
      return true;});
    /* cobertizo de la cosechadora, garaje del camión y silo */
    cobertizo(now); garaje(now); silo(now);
    /* la cosechadora va hasta la parcela que cosecha y vuelve */
    if(s.auto.cosechadora){
      var tdx=tractor.tx-tractor.x, tdy=tractor.ty-tractor.y, td=Math.hypot(tdx,tdy);
      if(td>1){var tv=Math.min(td,1.8);tractor.x+=tdx/td*tv;tractor.y+=tdy/td*tv;if(Math.abs(tdx)>0.5)tractor.dir=tdx>0?1:-1;}
      else if(tractor.tx!==COBERTIZO.x+20&&rnd(now)<0.01){tractor.tx=COBERTIZO.x+20;tractor.ty=COBERTIZO.y+30;}
      dibujaTractor(tractor.x,tractor.y,tractor.dir,now,s.auto.cosechadora);
    }
    /* el camión de reparto va del garaje a la estación */
    camiones=camiones.filter(function(c){var e3=(now-c.t0)/2200; if(e3>1)return false;
      var x0=GARAJE.x+18, x1=ESTACION.x+ESTACION.w-4, f4=e3<0.5?e3*2:2-e3*2, x=x0+(x1-x0)*f4;
      dibujaCamion(x,82,e3<0.5?-1:1,s.auto.camion); return true;});
    /* granjero */
    var ddx=gj.tx-gj.x, ddy=gj.ty-gj.y, dist=Math.hypot(ddx,ddy), anda=dist>1;
    if(anda){var v=Math.min(dist,1.4); gj.x+=ddx/dist*v; gj.y+=ddy/dist*v; if(Math.abs(ddx)>0.5)gj.dir=ddx>0?1:-1;}
    granjero(ctx,gj.x,gj.y,gj.dir,anda,now);
    /* sombras de nubes */
    nubes.forEach(function(n){var x=((n.x+now*0.006)%(WW+200))-100; ctx.fillStyle="rgba(10,20,40,.10)"; ctx.beginPath(); ctx.ellipse(x,n.y,n.w/2,n.w/5,0,0,Math.PI*2); ctx.fill();});
    /* textos sobre el mundo */
    flot.forEach(function(f){if(!f.mundo)return; var e2=now-f.t0; if(e2<=900)tx(f.t,f.x,f.y-e2/60,{t:7,c:f.c,sombra:true,peso:800});});
    ctx.restore();
    /* minimapa */
    caja2(MINI.x-1,MINI.y-1,MINI.w+2,MINI.h+2,"rgba(0,0,0,.5)","#fff1e8");
    ctx.drawImage(BG,0,0,WW*K,WH*K,MINI.x,MINI.y,MINI.w,MINI.h);
    var sx=MINI.w/WW, sy=MINI.h/WH;
    for(i=0;i<s.parcelasN;i++){var p2=s.parcelas[i], zz=PLOT(i); if(p2.c&&tk-p2.t0>=A.crece(s,p2.c)&&late(now,300))r(ctx,"#ffec27",MINI.x+zz.x*sx,MINI.y+zz.y*sy,3,3);}
    for(i=0;i<A.FABRICAS.length;i++){var zf=FAB[i]; if(A.FABRICAS[i].nivel<=s.nivel)r(ctx,s.fabricas[i].cola.length?"#7dff9a":"#c2c3c7",MINI.x+(zf.x+24)*sx,MINI.y+(zf.y+20)*sy,3,3);}
    caja2(MINI.x+cam.x*sx,MINI.y+cam.y*sy,VW*sx,VIEWH*sy,"rgba(255,255,255,.12)","#fff");
  }

  function hud(now){
    var tk=s.tick, i, z, n=anden();
    /* marcador */
    r(ctx,"#3a2414",0,0,VW,20); r(ctx,"#5a3a1c",0,19,VW,1);
    spr(ctx,"moneda",3,4,2); tx(String(s.monedas),18,3.5,{t:10,c:P.y,peso:800});
    tx("★ "+s.ganado,62,2,{t:6.5,c:"#ffd84d",peso:800}); tx("ganadas",62,10.5,{t:4.6,c:"#e8d5b0",peso:600});
    for(i=0;i<Math.max(A.VIDAS,s.vidas);i++)spr(ctx,i<s.vidas?"vida":"vida0",96+i*8.5,7);
    var de=A.NIVELES[s.nivel]||0, a=A.NIVELES[s.nivel+1];
    tx("Nivel "+s.nivel,134,2.5,{t:6.5}); barra(134,11,52,4,a?(s.ganado-de)/(a-de):1,a?P.o:"#7dff9a");
    tx(reloj(A.DUR-tk),VW-3,3.5,{t:10,c:pausa?"#e8d5b0":A.DUR-tk<300&&late(now,250)?"#ff4d6d":"#fff",al:"right",peso:800});
    /* pedidos */
    var gr=ctx.createLinearGradient(0,20,0,TOP); gr.addColorStop(0,"#5fc3f5"); gr.addColorStop(1,"#a9e1fb"); ctx.fillStyle=gr; ctx.fillRect(0,20,VW,TOP-20);
    for(i=0;i<n;i++){
      z=ZP(i,n); var o=s.pedidos[i].p, an=z.w>=56;
      if(!o){caja2(z.x,z.y,z.w,z.h,"rgba(16,22,48,.4)"); tx("Llegando…",z.x+z.w/2,z.y+17,{t:5.5,c:"#fff",al:"center"}); continue;}
      var ok=A.puedeEntregar(s,i), fr=Math.max(0,(o.vence-tk)/(o.vence-o.t0)), urg=fr<0.25;
      caja2(z.x,z.y,z.w,z.h,ok?"#0d7a43":"rgba(29,39,92,.92)",ok?(late(now,180)?"#7dff9a":"#ffec27"):urg&&late(now,200)?"#ff4d6d":"#4b5aa0",ok?1.5:1);
      U.vehiculo(ctx,i%4,z.x+2,z.y+2,i===0&&marca.color?marca.color:null,i===0?logo:null);
      tx(reloj(o.vence-tk),z.x+16,z.y+2,{t:5.2,c:urg?"#ff4d6d":"#dfe6ff"});
      r(ctx,"rgba(255,0,77,.25)",z.x+z.w-9,z.y+1,8,8); tx("✕",z.x+z.w-5,z.y+1.5,{t:6,c:"#ff8fab",al:"center"});
      o.items.forEach(function(it,m){var yy=z.y+11+m*9.5, t2=s.granero[it[0]]||0, ya=t2>=it[1];
        spr(ctx,it[0],z.x+2,yy-0.5,0.9); tx(Math.min(t2,it[1])+"/"+it[1],z.x+13,yy+1,{t:5.8,c:ya?"#7dff9a":"#fff"});
        if(an)tx(nombres[it[0]],z.x+30,yy+1.5,{t:4.6,c:"#aab6e6",peso:600});});
      tx(o.premio+"",z.x+3,z.y+z.h-9,{t:5.8,c:P.y}); if(ok)tx("¡YA!",z.x+z.w-3,z.y+z.h-9,{t:5.5,c:"#fff",al:"right",peso:900});
      barra(z.x+1.5,z.y+z.h-2.5,z.w-3,1.5,fr,fr>0.5?"#7dff9a":fr>0.25?"#ffec27":"#ff4d6d");
    }
    /* abajo: semillas, vender, pregunta y granero */
    r(ctx,"#6b4220",0,BOT,VW,VH-BOT); for(var yy2=BOT+5;yy2<VH;yy2+=6)r(ctx,"#5f3a1c",0,yy2,VW,0.7);
    for(i=0;i<4;i++){z=ZS(i); var k=A.CULTIVOS[i], ab=A.ITEMS[k].nivel<=s.nivel, sel=ab&&semilla===k;
      caja2(z.x,z.y,z.w,z.h,ab?(sel?"#2f4f9a":"rgba(29,39,92,.92)"):"rgba(16,22,48,.7)",sel?"#ffec27":null);
      if(ab){spr(ctx,k,z.x+1.5,z.y+3.5); tx(nombres[k].slice(0,6),z.x+12.5,z.y+2.5,{t:4.6}); tx((A.crece(s,k)/10).toFixed(1).replace(".0","").replace(".",",")+" s",z.x+12.5,z.y+9.5,{t:4.2,c:"#aab6e6",peso:600});}
      else{spr(ctx,"lock",z.x+3,z.y+5); tx("Nv "+A.ITEMS[k].nivel,z.x+12,z.y+6,{t:4.6,c:"#aab6e6"});}}
    caja2(ZV.x,ZV.y,ZV.w,ZV.h,vender?"#ff004d":"#3a2414",vender?"#fff":"#c8a165"); tx(vender?"Vende…":"Vender",ZV.x+ZV.w/2,ZV.y+5.5,{t:5,al:"center"});
    var hayCompra=s.monedas>=Math.min(A.COSTO_GRANERO[s.graneroLv]||1e9,A.costoAuto("cosechadora",s.auto.cosechadora)||1e9,A.costoAuto("camion",s.auto.camion)||1e9,A.costoAuto("silo",s.auto.silo)||1e9);
    caja2(ZM.x,ZM.y,ZM.w,ZM.h,hayCompra&&late(now,500)?"#0d7a43":"#3a2414",hayCompra?"#7dff9a":"#c8a165"); tx("⚙ Mejoras",ZM.x+ZM.w/2,ZM.y+5.5,{t:4.8,al:"center",peso:800});
    if(s.qDisp){caja2(ZQ.x,ZQ.y,ZQ.w,ZQ.h,late(now,300)?"#7a1fa2":"#5b1680",late(now,150)?"#ffec27":"#ffd84d",1.5); tx("❓ ¡Pregunta!",ZQ.x+ZQ.w/2,ZQ.y+5,{t:5.6,al:"center",peso:900});}
    else{caja2(ZQ.x,ZQ.y,ZQ.w,ZQ.h,"rgba(16,22,48,.7)","#4b5aa0"); tx(s.preguntas>=A.MAX_Q?"Sin más":"❓ en "+Math.max(0,Math.ceil((s.proxQ-tk)/10))+" s",ZQ.x+ZQ.w/2,ZQ.y+5.5,{t:5,c:"#dfe6ff",al:"center"});}
    for(i=0;i<ORDEN.length;i++){z=ZI(i); var it=ORDEN[i], cnt=s.granero[it]||0, vis=A.ITEMS[it].nivel<=s.nivel;
      caja2(z.x,z.y,z.w,z.h,vender&&cnt?"#7a2040":"#c8954f","#8a5a2b");
      if(!vis){spr(ctx,"lock",z.x+z.w/2-3.5,z.y+8,1,0.6);continue;}
      spr(ctx,it,z.x+3,z.y+6.5,1,cnt?1:0.35); tx(String(cnt),z.x+z.w-3,z.y+8,{t:7.5,c:cnt?"#2a1608":"rgba(42,22,8,.4)",al:"right",peso:800});
      tx(nombres[it].slice(0,9),z.x+2.5,z.y+1.2,{t:4.2,c:"rgba(42,22,8,.75)",peso:700});}
    flot.forEach(function(f){if(f.mundo)return; var e2=now-f.t0; if(e2<=900)tx(f.t,f.x,f.y-e2/60,{t:7,c:f.c,sombra:true,peso:800});});
    flot=flot.filter(function(f){return now-f.t0<=900;});
  }

  function dibuja(now,final){
    var dx=now<temblor?Math.sin(now/25)*2:0;
    ctx.setTransform(K,0,0,K,Math.round(dx*K),0); ctx.imageSmoothingEnabled=false;
    mundo(now); hud(now);
    if(banner&&now-banner.t0<1600){r(ctx,"rgba(0,0,0,.7)",0,TOP+90,VW,30); tx(banner.t,VW/2,TOP+94,{t:18,c:late(now,120)?P.y:P.o,al:"center",peso:900,sombra:true});}
    if(now<inicio){var n2=Math.min(3,Math.ceil((inicio-now)/1000)); r(ctx,"rgba(0,0,0,.55)",0,0,VW,VH);
      tx(String(n2),VW/2,110,{t:48,c:P.y,al:"center",peso:900,sombra:true}); tx("Granja Grande",VW/2,170,{t:13,al:"center",sombra:true});
      tx("Arrastra para recorrer el mapa · toca para trabajar",VW/2,190,{t:6.5,c:"#dfe6ff",al:"center"});}
    if(final){r(ctx,"rgba(0,0,0,.7)",0,0,VW,VH);
      tx(final==="vidas"?"¡Sin vidas!":final==="plantado"?"Fin":"¡Tiempo!",VW/2,110,{t:20,c:"#ff4d6d",al:"center",peso:900,sombra:true});
      tx(s.ganado+" monedas ganadas",VW/2,142,{t:13,c:P.y,al:"center",peso:800,sombra:true});
      tx(s.entregas+" pedidos · nivel "+s.nivel+" · "+s.gastado+" invertidas",VW/2,162,{t:7.5,al:"center",sombra:true});}
    ctx.setTransform(1,0,0,1,0,0);
  }

  var cont3=3;
  function cuadro(now){
    if(!yo.vivo)return;
    /* inercia del arrastre */
    if(!toque&&(Math.abs(cam.vx)>0.05||Math.abs(cam.vy)>0.05)){cam.x+=cam.vx;cam.y+=cam.vy;cam.vx*=0.9;cam.vy*=0.9;encuadra();}
    if(now<inicio){var n=Math.ceil((inicio-now)/1000); if(n<cont3&&n>0){cont3=n;SON.cuenta();} dibuja(now); yo.raf=requestAnimationFrame(cuadro); return;}
    if(!t0){t0=inicio;SON.ya();msg("¡A trabajar! Arrastra para ver el mapa; toca una parcela para sembrar.");}
    if(!pausa){var meta=Math.floor((now-t0)/A.TICK); while(s.tick<meta&&!s.fin)A.paso(s);}
    eventos();
    if(s.fin){termina(s.motivo);return;}
    dibuja(now);
    yo.raf=requestAnimationFrame(cuadro);
  }
  yo.raf=requestAnimationFrame(cuadro);
}

/* camara y estado: para las pruebas (el servidor repite cada partida, así que tocarlo no sirve para hacer trampa) */
window.AxGranjaGUI={monta:monta,para:para,camara:function(){return J&&J.cam?{x:J.cam.x,y:J.cam.y}:null;},estado:function(){return J&&J.s;}};
})();
