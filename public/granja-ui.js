/* ===========================================================
   THE FINAL TEST · Granja Express · pantalla
   Arte de 8 bits sobre un lienzo lógico de 192×302 con tantos
   píxeles reales como la pantalla: los sprites (10×10, dibujados por
   código) quedan nítidos y los textos se leen. Por secciones, de arriba
   abajo, en el orden en que se juega: pedidos, campo, fábricas y
   granero. Sonido de 8 bits con WebAudio. Sin imágenes ni librerías.
     AxGranjaUI.monta(contenedor, datos, cfg, done)  una partida
     AxGranjaUI.para()                               la detiene
     AxGranjaUI.portada()                            menú (práctica, del día, sin fin)
   =========================================================== */
(function(){
"use strict";
var A=window.AxGranja, R=window.AxRapidos;
if(!A||!R)return;
var $=function(id){return document.getElementById(id)};
var W=192, H=302;

/* ---------- paleta (estilo 8 bits) ---------- */
var P={k:"#000000",U:"#1d2b53",R:"#7e2553",G:"#008751",O:"#ab5236",D:"#5f574f",W:"#c2c3c7",w:"#fff1e8",
       r:"#ff004d",o:"#ffa300",y:"#ffec27",g:"#00e436",u:"#29adff",s:"#83769c",p:"#ff77a8",c:"#ffccaa",B:"#5a3a1c",b:"#ab5236",Y:"#e8b400"};
var FONDO="#1d2b53", PANEL="#29366f", PANEL2="#3b4a8c";

/* ---------- sprites de 10×10 ---------- */
var SPR={
 t:["....y.....","...yYy....","...yYy.y..","..yYy.yYy.","...y.yYy..","....YyYy..",".....YY...",".....G....","....GG....","....G....."],
 m:["....gg....","...gyyg...","...yYyy...","..gyyYy...","..gyYyyg..","..gyyYyg..","...yYyy...","...gyyg...","....gg....","....G....."],
 z:["....g.g...",".....gg...","....oooo..","....oOoo..","....ooOo..",".....ooo..",".....oO...",".....oo...","......o...",".........."],
 h:["..........","...WWWW...","....bb....","...wwwww..","..wwwwwww.","..wwWwwWw.","..wwwwwww.","..wwwwwww.","...WWWWW..",".........."],
 p:["..........","..........","...ooooo..","..oyoyoyo.",".oyyyyyyyo",".ooooooooo","..OOOOOOO.","..........","..........",".........."],
 u:["....ww....","...wwww...","..wwwwww..","..wwwwww..",".wwwwwwww.",".wwwwwwwW.",".wwwwwwwW.","..wwwwWW..","...WWWW...",".........."],
 j:[".......k..","......k...","..wwwkwww.","..woooooW.","..woooooW.","..wooOooW.","..woooooW.","...wooow..","...WWWWW..",".........."],
 k:["....r.....","....y.....","..pppppp..",".pwpwpwpp.",".pppppppp.",".bccccccb.",".bbbbbbbb.",".cccccccc.",".BBBBBBBB.",".........."],
 moneda:[".yyyy.","yyYYyy","yYyyYy","yYyyYy","yyYYyy",".yyyy."],
 vida:[".rr.rr.","rrrrrrr","rrrrrrr",".rrrrr.","..rrr..","...r..."],
 vida0:[".DD.DD.","DDDDDDD","DDDDDDD",".DDDDD.","..DDD..","...D..."],
 lock:["..WWW..",".W...W.",".W...W.","yyyyyyy","yyyDyyy","yyyDyyy","yyyyyyy"],
 estrella:["...y...","...y...","yyyyyyy",".yyyyy.","..yyy..",".yy.yy.","y.....y"]
};
function sprite(ctx,id,x,y,esc){
  var s=SPR[id]; if(!s)return; esc=esc||1;
  for(var f=0;f<s.length;f++)for(var c=0;c<s[f].length;c++){var ch=s[f][c]; if(ch===".")continue; ctx.fillStyle=P[ch]; ctx.fillRect(x+c*esc,y+f*esc,esc,esc);}
}

function reloj(ticks){var s=Math.max(0,Math.ceil(ticks/10)),m=Math.floor(s/60),g=s%60;return m+":"+(g<10?"0":"")+g;}

/* ---------- sonido de 8 bits ---------- */
var AC=null, mudo=false;
try{mudo=localStorage.getItem("gx_mudo")==="1";}catch(e){}
function tono(notas,tipo,dur,vol){
  if(mudo)return;
  try{
    if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==="suspended")AC.resume();
    var t=AC.currentTime;
    notas.forEach(function(f,i){
      var o=AC.createOscillator(), g=AC.createGain();
      o.type=tipo||"square"; o.frequency.value=f;
      g.gain.setValueAtTime(vol||0.05,t+i*dur); g.gain.exponentialRampToValueAtTime(0.0008,t+(i+1)*dur);
      o.connect(g); g.connect(AC.destination); o.start(t+i*dur); o.stop(t+(i+1)*dur+0.02);
    });
  }catch(e){}
}
var SON={siembra:function(){tono([220],"square",0.05,0.03);},cosecha:function(){tono([440,660],"square",0.05);},
  fabrica:function(){tono([180,240],"triangle",0.06,0.06);},hecho:function(){tono([523,784],"triangle",0.06,0.05);},
  entrega:function(c){tono([523,659,784,1047+c*60],"square",0.06);},perdido:function(){tono([300,220,150],"sawtooth",0.12,0.05);},
  nivel:function(){tono([523,659,784,1047,784,1047],"square",0.09);},no:function(){tono([110],"square",0.08,0.04);},
  vende:function(){tono([880],"triangle",0.05,0.04);},fin:function(){tono([784,659,523,392],"triangle",0.15,0.06);},
  cuenta:function(){tono([440],"square",0.08,0.04);},ya:function(){tono([880],"square",0.15,0.05);}};

/* ---------- edificios y vehículos (dibujados por código) ---------- */
var TECHO={molino:P.r,horno:P.O,gallinero:P.u,jugos:P.o,pasteleria:P.p};
function edificio(ctx,id,x,y,t){
  var tc=TECHO[id]||P.r, i;
  ctx.fillStyle=P.c; ctx.fillRect(x+3,y+7,16,9);                 /* pared */
  ctx.fillStyle=tc; for(i=0;i<6;i++)ctx.fillRect(x+2+i,y+6-i,18-2*i,1);   /* tejado */
  ctx.fillStyle=P.B; ctx.fillRect(x+9,y+11,4,5);                 /* puerta */
  ctx.fillStyle=P.u; ctx.fillRect(x+5,y+9,2,2); ctx.fillRect(x+15,y+9,2,2);
  if(id==="molino"){ /* aspas que giran */
    var a=(t/200)%2<1; ctx.fillStyle=P.w;
    if(a){ctx.fillRect(x+10,y-4,2,7);ctx.fillRect(x+6,y-1,10,2);}
    else{for(i=0;i<5;i++){ctx.fillRect(x+7+i,y-4+i,1,1);ctx.fillRect(x+14-i,y-4+i,1,1);ctx.fillRect(x+7+i,y+2-i,1,1);ctx.fillRect(x+14-i,y+2-i,1,1);}}
  }
  if(id==="horno"){ctx.fillStyle=P.D;ctx.fillRect(x+16,y-2,3,6);}
}
function vehiculo(ctx,i,x,y,color,logo){
  ctx.fillStyle=color||[P.r,P.u,P.W,P.o][i];
  if(i===0){ctx.fillRect(x,y+1,9,5);ctx.fillStyle=P.u;ctx.fillRect(x+9,y+2,3,4);ctx.fillStyle=P.k;ctx.fillRect(x+1,y+6,2,2);ctx.fillRect(x+8,y+6,2,2);
    if(logo)try{ctx.imageSmoothingEnabled=false;ctx.drawImage(logo,x+2,y+1,5,5);}catch(e){}}
  else if(i===1){ctx.fillRect(x,y+2,12,4);ctx.fillStyle=P.k;ctx.fillRect(x+9,y,2,2);ctx.fillRect(x+1,y+6,2,2);ctx.fillRect(x+5,y+6,2,2);ctx.fillRect(x+9,y+6,2,2);}
  else if(i===2){ctx.fillRect(x,y+3,12,2);ctx.fillRect(x+4,y,3,8);ctx.fillRect(x,y+1,2,3);}
  else{ctx.fillRect(x+1,y+4,10,3);ctx.fillStyle=P.w;ctx.fillRect(x+5,y,1,4);ctx.fillRect(x+6,y+1,3,2);}
}

/* ---------- disposición (coordenadas lógicas de 192 de ancho) ---------- */
var Y={hud:0,ped:21,campo:89,fab:168,gra:262};
var Z={
  pedido:function(i,n){var w=(186-(n-1)*3)/n; return {x:3+Math.round(i*(w+3)),y:30,w:Math.floor(w),h:55};},
  descarta:function(z){return {x:z.x+z.w-11,y:z.y+1,w:10,h:10};},
  parcela:function(i){return {x:3+(i%4)*47,y:98+Math.floor(i/4)*25,w:45,h:23};},
  semilla:function(i){return {x:3+i*62,y:149,w:60,h:16};},
  fabrica:function(i){return {x:3+(i%2)*94,y:177+Math.floor(i/2)*28,w:92,h:26};},
  pregunta:{x:97,y:233,w:92,h:26},
  item:function(i){return {x:3+Math.round(i*23.3),y:274,w:22,h:25};},
  vender:{x:146,y:262,w:43,h:10}
};
function dentro(r,x,y){return x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;}
var ORDEN_ITEMS=["t","m","z","h","p","u","j","k"];
var FUENTE_UI="system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
var CU={fondo:"#1d2b53",hud:"#3a2414",hud2:"#5a3a1c",card:"rgba(29,39,92,.92)",card2:"#4b5aa0",osc:"rgba(16,22,48,.82)",titulo:"#dfe6ff",pista:"#aab6e6",ok:"#0d7a43",
        cielo1:"#5fc3f5",cielo2:"#a9e1fb",pasto:"#4a9a3e",pasto2:"#3e8636",camino:"#b98a55",camino2:"#a3794a",tabla:"#7a4a24",tabla2:"#6a3f1e"};

/* sprites como lienzos pequeños: se dibujan escalados sin suavizar */
var LIENZO={};
function lienzo(id){
  if(LIENZO[id])return LIENZO[id];
  var s=SPR[id]; if(!s)return null;
  var c=document.createElement("canvas"); c.width=s[0].length; c.height=s.length;
  var x=c.getContext("2d"); sprite(x,id,0,0,1); LIENZO[id]=c; return c;
}
function spr(ctx,id,x,y,esc,alfa){var c=lienzo(id); if(!c)return; esc=esc||1;
  if(alfa!=null)ctx.globalAlpha=alfa; ctx.imageSmoothingEnabled=false; ctx.drawImage(c,Math.round(x),Math.round(y),c.width*esc,c.height*esc); if(alfa!=null)ctx.globalAlpha=1;}

/* preguntas ya vistas en este teléfono (sin cuenta): no se repiten en 60 días */
var VISTAS_K="gx_vistas", VISTAS_MS=60*86400000;
function vistasLocal(){var v={},a=Date.now(); try{v=JSON.parse(localStorage.getItem(VISTAS_K)||"{}")||{};}catch(e){}
  Object.keys(v).forEach(function(k){if(!(a-v[k]<VISTAS_MS))delete v[k];}); return v;}
function anotaVista(id){var v=vistasLocal(); v[id]=Date.now(); try{localStorage.setItem(VISTAS_K,JSON.stringify(v));}catch(e){}}

/* ===================== UNA PARTIDA ===================== */
var J=null;   /* la partida en curso */
function para(){ if(J){J.vivo=false; if(J.raf)cancelAnimationFrame(J.raf); if(J.fuera)J.fuera(); J=null;} }

function monta(cont,datos,cfg,done){
  para();
  cfg=cfg||{};
  var marca=cfg.marca||{}, nombres={};
  ORDEN_ITEMS.forEach(function(k){nombres[k]=(marca.productos&&marca.productos[k])||A.ITEMS[k].nom;});
  cont.insertAdjacentHTML("beforeend",
    '<div class="gx" id="gx"><div class="gx-lienzo"><canvas id="gx-cv" width="'+W+'" height="'+H+'" aria-label="Granja Express: tablero de juego"></canvas>'+
    '<div class="gx-q" id="gx-q" hidden role="dialog" aria-modal="true" aria-label="Pregunta de mejora"></div></div>'+
    '<div class="gx-bar"><span class="gx-msg" id="gx-msg">Elige una semilla y toca una parcela para sembrar.</span>'+
    '<button type="button" class="ghost au-mini" id="gx-son" title="Sonido">'+(mudo?"🔇":"🔊")+'</button>'+
    '<button type="button" class="ghost au-mini" id="gx-fin">'+(datos.modo==="sinfin"?"Plantarme":"Terminar")+'</button></div>'+
    '<details class="gx-ley"><summary>Recetas, mejoras y precios</summary><ul>'+
      A.FABRICAS.map(function(f){return '<li><b>'+esc(f.nom)+'</b> (nivel '+f.nivel+'): '+Object.keys(f.de).map(function(k){return f.de[k]+' '+esc(nombres[k]);}).join(" + ")+
        ' → '+esc(nombres[f.da])+' · '+(f.dura/10)+' s</li>';}).join("")+
      '<li>Cultivos: '+A.CULTIVOS.map(function(k){return esc(nombres[k])+' '+(A.ITEMS[k].crece/10)+' s';}).join(", ")+'. Cada parcela da 2.</li>'+
      '<li>Niveles: '+A.NIVELES.slice(2).map(function(n,i){return 'nivel '+(i+2)+' con '+n+' monedas';}).join(", ")+'.</li>'+
      '<li><b>Preguntas de mejora</b>: cada 40 s se enciende «Pregunta». Si aciertas ganas '+A.PREMIO_Q+' monedas y eliges una mejora: '+
        Object.keys(A.MEJORAS).map(function(k){return esc(A.MEJORAS[k].nom).toLowerCase();}).join(", ")+'. Mientras respondes, la granja se detiene.</li>'+
      '<li>Entregar rápido suma monedas; encadenar entregas (menos de 10 s entre una y otra) da combo. «Vender» saca del granero a mitad de precio.</li></ul></details></div>');
  var cv=$("gx-cv"), ctx=cv.getContext("2d"), K=2, caja2=$("gx-q");
  /* el lienzo tiene tantos píxeles como la pantalla: los sprites quedan nítidos y el texto se lee */
  function ajusta(){
    var r=cv.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
    K=Math.max(2,Math.min(8,Math.round((r.width||W*2)*dpr/W)));
    if(cv.width!==W*K){cv.width=W*K;cv.height=H*K;}
  }
  ajusta();
  window.addEventListener("resize",ajusta);
  var s=A.crea(datos.seed,datos.modo), log=[], semilla="t", vender=false, flot=[], banner=null, temblor=0, mal=null;
  var logo=null;
  if(marca.logo){logo=new Image();logo.src=marca.logo;}
  J={vivo:true,raf:0,fuera:function(){window.removeEventListener("resize",ajusta);}};
  var yo=J, t0=0, inicio=performance.now()+3200, pausa=0;   /* cuenta atrás de 3 s; pausa: desde cuándo está detenida */

  /* preguntas de mejora: llegan del servidor, sin la respuesta */
  var qs=null, qsError=false;
  var evita=Object.keys(vistasLocal());
  api("/api/granja/preguntas",{seed:datos.seed,evita:evita}).then(function(r){qs=r.preguntas||[];},function(){qsError=true;});

  function msg(t){var m=$("gx-msg"); if(m)m.textContent=t;}
  function flota(txt,x,y,col){flot.push({t:txt,x:x,y:y,c:col||P.y,t0:performance.now()});}
  function hace(a,b,c,d,e){
    if(!A.act(s,a,b,c,d,e))return false;
    log.push(a==="q"?[s.tick,a,b,c,d,e]:c==null?[s.tick,a,b]:[s.tick,a,b,c]);
    return true;
  }
  function falta(de){return Object.keys(de).filter(function(k){return (s.granero[k]||0)<de[k];}).map(function(k){return (de[k]-(s.granero[k]||0))+' '+nombres[k];}).join(", ");}
  function andenes(){return A.ANDENES[s.nivel];}

  /* ---------- la ventana de la pregunta (la granja se detiene) ---------- */
  function abrePregunta(){
    if(!s.qDisp||pausa)return;
    if(qsError||!qs){msg(qsError?"Sin conexión: las preguntas de mejora necesitan internet.":"Cargando las preguntas…");return;}
    var q=qs.filter(function(x){return !s.qUsadas[x.id];})[0];
    if(!q){msg("No quedan preguntas nuevas para ti por ahora.");return;}
    pausa=performance.now();
    var limite=20, quedan=limite, tq=null, respondida=false;
    caja2.hidden=false;
    caja2.innerHTML='<div class="gx-qc"><div class="gx-qh"><span>❓ Pregunta de mejora</span><span class="gx-qa">'+esc(q.area)+'</span></div>'+
      '<p class="gx-qt">'+esc(q.q)+'</p><div class="gx-qo">'+q.o.map(function(o,i){return '<button type="button" data-o="'+i+'">'+esc(o)+'</button>';}).join("")+'</div>'+
      '<div class="gx-qb"><i id="gx-qbar"></i></div><p class="gx-qn" id="gx-qn">Acierta y elige una mejora para tu granja. La granja está en pausa.</p></div>';
    var bs=caja2.querySelectorAll("[data-o]");
    function tic(){quedan-=0.1; var b=$("gx-qbar"); if(b)b.style.width=Math.max(0,quedan/limite*100)+"%"; if(quedan<=0)elige(-1);}
    tq=setInterval(tic,100);
    function elige(i){
      if(respondida)return; respondida=true; clearInterval(tq);
      for(var k=0;k<bs.length;k++)bs[k].disabled=true;
      if(i>=0)bs[i].classList.add("gx-sel");
      $("gx-qn").textContent="Comprobando…";
      api("/api/granja/responde",{seed:datos.seed,id:q.id,o:i}).then(function(r){
        anotaVista(q.id);
        if(bs[r.correcta])bs[r.correcta].classList.add("gx-bien");
        if(i>=0&&!r.ok)bs[i].classList.add("gx-mal");
        if(r.ok){SON.entrega(2); eligeMejora(q,i,r.dato);}
        else{SON.no(); hace("q",i,q.id,null,false); msg((i<0?"Se acabó el tiempo":"No era esa")+": era «"+q.o[r.correcta]+"». La próxima pregunta llega en 40 s.");
          $("gx-qn").innerHTML=(i<0?"Se acabó el tiempo. ":"No era esa. ")+(r.dato?'<span class="gx-dato">'+esc(r.dato)+'</span>':'');
          cierraEn(3200);}
      },function(){ /* sin conexión: cuenta como no respondida */
        hace("q",-1,q.id,null,false); $("gx-qn").textContent="No se pudo comprobar la respuesta (sin conexión)."; cierraEn(1800);});
    }
    for(var k=0;k<bs.length;k++)bs[k].onclick=function(){elige(+this.getAttribute("data-o"));};
  }
  function eligeMejora(q,i,dato){
    var of=A.ofertas(s), hecho=false, tq2=null, quedan=10;
    $("gx-qn").innerHTML='<b class="gx-ok">¡Correcto! +'+A.PREMIO_Q+' monedas.</b> '+(dato?'<span class="gx-dato">'+esc(dato)+'</span>':'')+
      '<span class="gx-mt">Elige tu mejora:</span><span class="gx-mej">'+of.map(function(k){var m=A.MEJORAS[k];
        return '<button type="button" data-m="'+k+'"><b>'+esc(m.nom)+(s.mej[k]?' '+(s.mej[k]+1):'')+'</b><small>'+esc(m.desc)+'</small></button>';}).join("")+'</span>';
    function toma(k){ if(hecho)return; hecho=true; clearInterval(tq2);
      hace("q",i,q.id,k,true); SON.nivel(); cierraEn(0); msg("Mejora: "+A.MEJORAS[k].nom+". "+A.MEJORAS[k].desc+".");}
    var bs=caja2.querySelectorAll("[data-m]");
    for(var n=0;n<bs.length;n++)bs[n].onclick=function(){toma(this.getAttribute("data-m"));};
    /* si no elige en 10 s, se queda con la primera */
    tq2=setInterval(function(){quedan-=0.1; var b=$("gx-qbar"); if(b)b.style.width=Math.max(0,quedan/10*100)+"%"; if(quedan<=0)toma(of[0]);},100);
  }
  function cierraEn(ms){
    setTimeout(function(){ caja2.hidden=true; caja2.innerHTML=""; if(pausa){t0+=performance.now()-pausa; pausa=0;} },ms);
  }

  /* ---------- toques ---------- */
  cv.addEventListener("pointerdown",function(e){
    if(!yo.vivo||s.fin||pausa||performance.now()<inicio)return;
    e.preventDefault();
    var r=cv.getBoundingClientRect(), x=(e.clientX-r.left)*W/r.width, y=(e.clientY-r.top)*H/r.height, i, z, n=andenes();
    if(dentro(Z.pregunta,x,y)){ if(s.qDisp)abrePregunta(); else msg(s.preguntas>=A.MAX_Q?"Ya respondiste todas las preguntas de esta partida.":"La próxima pregunta llega en "+Math.ceil((s.proxQ-s.tick)/10)+" s."); return; }
    for(i=0;i<n;i++){z=Z.pedido(i,n); if(!dentro(z,x,y))continue;
      var o=s.pedidos[i].p; if(!o){msg("Está llegando un pedido…");return;}
      if(dentro(Z.descarta(z),x,y)){ if(hace("x",i)){msg("Pedido descartado: el andén tarda 10 s en llenarse.");SON.vende();} return; }
      if(hace("e",i))return;
      msg("Para este pedido faltan: "+o.items.filter(function(it){return (s.granero[it[0]]||0)<it[1];}).map(function(it){return (it[1]-(s.granero[it[0]]||0))+" "+nombres[it[0]];}).join(", ")+".");
      mal={k:"p"+i,t:performance.now()}; SON.no(); return;}
    for(i=0;i<A.MAX_PARCELAS;i++){z=Z.parcela(i); if(!dentro(z,x,y))continue;
      if(i>=A.nParcelas(s)){msg("Esta parcela se gana con la mejora «Parcela nueva»: acierta una pregunta.");SON.no();return;}
      var pc=s.parcelas[i];
      if(!pc.c){ if(hace("s",i,semilla))return; msg(A.ITEMS[semilla].nivel>s.nivel?nombres[semilla]+" se desbloquea en el nivel "+A.ITEMS[semilla].nivel+".":"No se puede sembrar."); SON.no(); return; }
      if(s.tick-pc.t0>=A.crece(s,pc.c)){ if(hace("c",i))return; msg("El granero está lleno: entrega un pedido o vende algo."); mal={k:"g",t:performance.now()}; SON.no(); return; }
      msg(nombres[pc.c]+": le faltan "+Math.ceil((A.crece(s,pc.c)-(s.tick-pc.t0))/10)+" s para cosechar."); return;}
    for(i=0;i<3;i++){z=Z.semilla(i); if(!dentro(z,x,y))continue;
      var k=A.CULTIVOS[i]; if(A.ITEMS[k].nivel>s.nivel){msg(nombres[k]+" se desbloquea en el nivel "+A.ITEMS[k].nivel+".");SON.no();return;}
      semilla=k; msg("Semilla elegida: "+nombres[k]+". Toca una parcela vacía."); return;}
    for(i=0;i<A.FABRICAS.length;i++){z=Z.fabrica(i); if(!dentro(z,x,y))continue;
      var d=A.FABRICAS[i];
      if(d.nivel>s.nivel){msg(d.nom+" se abre en el nivel "+d.nivel+".");SON.no();return;}
      if(hace("f",i))return;
      msg(s.fabricas[i].cola.length>=A.cola(s)?d.nom+": la cola está llena ("+A.cola(s)+").":d.nom+": faltan "+falta(d.de)+".");
      mal={k:"f"+i,t:performance.now()}; SON.no(); return;}
    if(dentro(Z.vender,x,y)){vender=!vender; msg(vender?"Modo venta: toca un producto del granero para venderlo a mitad de precio.":"Venta cerrada."); return;}
    for(i=0;i<ORDEN_ITEMS.length;i++){z=Z.item(i); if(!dentro(z,x,y))continue;
      var it=ORDEN_ITEMS[i];
      if(A.ITEMS[it].nivel>s.nivel){msg(nombres[it]+" aparece en el nivel "+A.ITEMS[it].nivel+".");return;}
      if(vender){ if(!hace("v",0,it)){msg("No tienes "+nombres[it]+".");SON.no();} return; }
      msg(nombres[it]+": tienes "+(s.granero[it]||0)+". Se vende a "+Math.max(1,Math.floor(A.ITEMS[it].valor/2))+" (toca «Vender»)."); return;}
  });
  $("gx-son").onclick=function(){mudo=!mudo; try{localStorage.setItem("gx_mudo",mudo?"1":"0");}catch(e){} this.textContent=mudo?"🔇":"🔊";};
  $("gx-fin").onclick=function(){
    if(!yo.vivo||s.fin||pausa)return;
    if(!confirm(datos.modo==="sinfin"?"¿Plantarte con "+s.monedas+" monedas?":"¿Terminar ya la partida con "+s.monedas+" monedas?"))return;
    termina("plantado");
  };

  function termina(motivo){
    if(!yo.vivo)return;
    yo.vivo=false; cancelAnimationFrame(yo.raf); yo.fuera();
    var envio={a:log,fin:s.tick};
    dibuja(performance.now(),motivo||s.motivo);
    SON.fin();
    setTimeout(function(){ var g=$("gx"); if(g)g.remove(); if(J===yo)J=null; done(envio); },1300);
  }

  /* ---------- eventos del motor: sonido y animación ---------- */
  function eventos(){
    var now=performance.now(), n=andenes();
    s.ev.forEach(function(e){
      if(e.tipo==="siembra")SON.siembra();
      else if(e.tipo==="cosecha"){SON.cosecha();var z=Z.parcela(e.i);flota("+"+e.n,z.x+18,z.y+8,P.w);}
      else if(e.tipo==="fabrica")SON.fabrica();
      else if(e.tipo==="hecho"){SON.hecho();var f=Z.fabrica(e.f);flota("+1 "+nombres[e.k],f.x+26,f.y+4,P.g);}
      else if(e.tipo==="entrega"){SON.entrega(e.combo);var z2=Z.pedido(Math.min(e.i,n-1),n);flota("+"+e.monedas,z2.x+z2.w/2-6,z2.y+20,P.y);
        if(e.combo)flota("COMBO ×"+(1+e.combo/10).toFixed(1).replace(".0",""),z2.x+4,z2.y+34,P.o);
        msg("¡Entregado! +"+e.monedas+" monedas"+(e.combo?" · combo "+e.combo:"")+".");}
      else if(e.tipo==="perdido"){SON.perdido();temblor=now+400;msg("¡Se fue un pedido! Te quedan "+s.vidas+(s.vidas===1?" vida.":" vidas."));}
      else if(e.tipo==="nivel"){SON.nivel();banner={t:"¡NIVEL "+e.n+"!",t0:now};
        msg({2:"Nivel 2: zanahoria, gallinero, jugos y un tercer pedido a la vez.",3:"Nivel 3: la pastelería ya hace tortas.",4:"Nivel 4: llega el barco, un cuarto pedido a la vez."}[e.n]||"");}
      else if(e.tipo==="vende"){SON.vende();flota("+"+e.monedas,Z.vender.x+10,Z.vender.y-2,P.y);}
      else if(e.tipo==="pregunta"){SON.cuenta();msg("¡Hay una pregunta de mejora! Tócala (abajo a la derecha de las fábricas).");}
      else if(e.tipo==="mejora"){banner={t:"¡MEJORA!",t0:now};}
      else if(e.tipo==="lleno")msg("El granero está lleno: lo fabricado espera en la fábrica.");
    });
    s.ev.length=0;
  }

  /* ---------- dibujo ---------- */
  function caja(x,y,w,h,col,borde,gr){ctx.fillStyle=col;ctx.fillRect(x,y,w,h);if(borde){gr=gr||1;ctx.fillStyle=borde;ctx.fillRect(x,y,w,gr);ctx.fillRect(x,y+h-gr,w,gr);ctx.fillRect(x,y,gr,h);ctx.fillRect(x+w-gr,y,gr,h);}}
  function tx(t,x,y,o){o=o||{};ctx.font=(o.peso||700)+" "+(o.t||7)+"px "+FUENTE_UI;ctx.textBaseline="top";ctx.textAlign=o.al||"left";
    if(o.sombra){ctx.fillStyle="rgba(0,0,0,.6)";ctx.fillText(t,x+0.6,y+0.6);} ctx.fillStyle=o.c||P.w;ctx.fillText(t,x,y);}
  /* título de sección en una etiqueta oscura, para leerse sobre el paisaje */
  function seccion(y,titulo,pista){ctx.font="800 6.5px "+FUENTE_UI; var w=ctx.measureText(titulo).width;
    caja(2,y-1,w+6,9,"rgba(20,16,10,.55)"); tx(titulo,5,y,{t:6.5,c:"#fff",peso:800});
    if(pista){ctx.font="600 5.5px "+FUENTE_UI; var w2=ctx.measureText(pista).width; caja(189-w2-4,y-0.5,w2+5,8,"rgba(20,16,10,.45)"); tx(pista,187,y+0.5,{t:5.5,c:"#f4ead8",al:"right",peso:600});}}
  function barra(x,y,w,h,fr,col){ctx.fillStyle="rgba(0,0,0,.45)";ctx.fillRect(x,y,w,h);ctx.fillStyle=col;ctx.fillRect(x,y,Math.max(0,Math.round(w*Math.min(1,fr)*4)/4),h);}
  function late(now,ms){return (now/(ms||200)|0)%2===0;}

  /* el paisaje: cielo con nubes, pasto con cerca, camino de tierra y piso de madera */
  function paisaje(now){
    var g=ctx.createLinearGradient(0,19,0,88); g.addColorStop(0,CU.cielo1); g.addColorStop(1,CU.cielo2);
    ctx.fillStyle=g; ctx.fillRect(-4,19,W+8,70);
    ctx.fillStyle="#ffe36e"; ctx.fillRect(170,22,9,9); ctx.fillStyle="rgba(255,227,110,.35)"; ctx.fillRect(168,20,13,13);
    [[0,26,0.012],[60,40,0.008],[120,30,0.01]].forEach(function(n){var x=((n[0]+now*n[2])%(W+40))-30;
      ctx.fillStyle="rgba(255,255,255,.85)"; ctx.fillRect(x,n[1],18,4); ctx.fillRect(x+4,n[1]-3,10,3); ctx.fillRect(x+2,n[1]+4,14,2);});
    /* vías del tren bajo los pedidos */
    ctx.fillStyle="#6b6b6b"; ctx.fillRect(-4,86,W+8,2); ctx.fillStyle="#5a3a1c"; for(var x=0;x<W;x+=6)ctx.fillRect(x,85,3,4);
    /* pasto */
    ctx.fillStyle=CU.pasto; ctx.fillRect(-4,89,W+8,78);
    ctx.fillStyle=CU.pasto2; for(var i=0;i<60;i++){var px=(i*53)%W, py=91+((i*37)%74); ctx.fillRect(px,py,1,2); ctx.fillRect(px+1,py+1,1,1);}
    /* cerca */
    ctx.fillStyle="#e8d5b0"; ctx.fillRect(-4,95,W+8,1); for(x=1;x<W;x+=12)ctx.fillRect(x,93,2,4);
    /* camino de tierra de las fábricas */
    ctx.fillStyle=CU.camino; ctx.fillRect(-4,167,W+8,94);
    ctx.fillStyle=CU.camino2; for(i=0;i<50;i++){ctx.fillRect((i*41)%W,170+((i*29)%88),2,1);}
    /* piso de madera del granero */
    ctx.fillStyle=CU.tabla; ctx.fillRect(-4,261,W+8,H-261);
    ctx.fillStyle=CU.tabla2; for(var yy=264;yy<H;yy+=6)ctx.fillRect(-4,yy,W+8,1);
  }

  function dibuja(now,final){
    var tk=s.tick, i, z, dx=0, n=andenes();
    if(now<temblor){dx=Math.sin(now/25)*2;}
    ctx.setTransform(K,0,0,K,Math.round(dx*K),0);
    ctx.imageSmoothingEnabled=false;
    ctx.fillStyle=CU.fondo; ctx.fillRect(-4,0,W+8,H);
    paisaje(now);

    /* ===== marcador (tablón de madera) ===== */
    caja(-4,0,W+8,19,CU.hud); ctx.fillStyle=CU.hud2; ctx.fillRect(-4,18,W+8,1); ctx.fillRect(-4,9,W+8,0.5);
    spr(ctx,"moneda",3,3.5,2); tx(String(s.monedas),18,3,{t:11,c:P.y,peso:800});
    for(i=0;i<Math.max(A.VIDAS,s.vidas);i++)spr(ctx,i<s.vidas?"vida":"vida0",58+i*8.5,6.5);
    var de=A.NIVELES[s.nivel]||0, a=A.NIVELES[s.nivel+1];
    tx("Nivel "+s.nivel,96,2.5,{t:6.5});
    tx(a?(s.monedas)+"/"+a:"máx.",150,3,{t:5.5,c:"#e8d5b0",al:"right",peso:600});
    barra(96,11,54,4,a?(s.monedas-de)/(a-de):1,a?P.o:P.g);
    var quedan=s.modo==="sinfin"?tk:A.DUR-tk, urge=s.modo!=="sinfin"&&quedan<300;
    tx(reloj(quedan),189,3,{t:11,c:pausa?"#e8d5b0":urge&&late(now,250)?P.r:P.w,al:"right",peso:800});

    /* ===== pedidos ===== */
    seccion(Y.ped,"PEDIDOS","toca un pedido completo para entregarlo");
    for(i=0;i<n;i++){
      z=Z.pedido(i,n); var o=s.pedidos[i].p, ancho2=z.w>=60;
      var sac=mal&&mal.k==="p"+i&&now-mal.t<300?Math.sin(now/20)*2:0, zx=z.x+sac;
      if(!o){caja(zx,z.y,z.w,z.h,"rgba(16,22,48,.45)");
        var vx=zx+z.w-((now/12)%(z.w+14)); vehiculo(ctx,i,Math.max(zx+2,Math.min(zx+z.w-14,vx)),z.y+18,i===0&&marca.color?marca.color:null,i===0?logo:null);
        tx("Llegando"+".".repeat(1+((now/300|0)%3)),zx+z.w/2,z.y+34,{t:6,c:"#fff",al:"center",peso:700}); continue;}
      var ok=A.puedeEntregar(s,i), fr=Math.max(0,(o.vence-tk)/(o.vence-o.t0)), urgente=fr<0.25;
      caja(zx,z.y,z.w,z.h,ok?CU.ok:CU.card,ok?(late(now,180)?P.g:P.y):urgente&&late(now,200)?P.r:CU.card2,ok?1.5:1);
      vehiculo(ctx,i,zx+3,z.y+3,i===0&&marca.color?marca.color:null,i===0?logo:null);
      tx(reloj(o.vence-tk),zx+18,z.y+2.5,{t:6,c:urgente?P.r:CU.titulo,peso:700});
      var dz=Z.descarta({x:zx,y:z.y,w:z.w}); caja(dz.x,dz.y,dz.w,dz.h,"rgba(255,0,77,.22)"); tx("✕",dz.x+dz.w/2,dz.y+1.2,{t:7,c:"#ff8fab",al:"center"});
      o.items.forEach(function(it,m){
        var yy=z.y+13+m*11, tengo=s.granero[it[0]]||0, ya=tengo>=it[1];
        spr(ctx,it[0],zx+3,yy);
        tx(Math.min(tengo,it[1])+"/"+it[1],zx+15,yy+1.5,{t:7,c:ya?P.g:P.w});
        if(ancho2)tx(nombres[it[0]],zx+33,yy+2,{t:5.5,c:CU.pista,peso:600});
      });
      spr(ctx,"moneda",zx+3,z.y+z.h-11); tx(String(o.premio),zx+11,z.y+z.h-12,{t:7,c:P.y});
      if(ok)tx(ancho2?"¡ENTREGAR!":"¡LISTO!",zx+z.w-3,z.y+z.h-11.5,{t:6,c:"#fff",al:"right",peso:800});
      barra(zx+2,z.y+z.h-3,z.w-4,2,fr,fr>0.5?P.g:fr>0.25?P.y:P.r);
    }

    /* ===== campo ===== */
    seccion(Y.campo,"CAMPO","1 elige semilla · 2 toca una parcela");
    for(i=0;i<A.MAX_PARCELAS;i++){
      z=Z.parcela(i);
      if(i>=A.nParcelas(s)){caja(z.x,z.y,z.w,z.h,"rgba(30,60,25,.55)"); spr(ctx,"lock",z.x+5,z.y+8,1,0.8); tx("Mejora",z.x+15,z.y+5,{t:5.5,c:"#e8f5d8"}); tx("parcela",z.x+15,z.y+12,{t:5,c:"#cfe6bf",peso:600}); continue;}
      var pc=s.parcelas[i];
      caja(z.x,z.y,z.w,z.h,"#6b4220","#4a2c14"); ctx.fillStyle="#86552b"; for(var f=0;f<3;f++)ctx.fillRect(z.x+2,z.y+4+f*6,z.w-4,2);
      if(!pc.c){
        if(A.ITEMS[semilla].nivel<=s.nivel){spr(ctx,semilla,z.x+9,z.y+6.5,1,late(now,500)?0.55:0.3); tx("+",z.x+27,z.y+4,{t:12,c:"rgba(255,241,232,.85)",peso:800});}
        continue;
      }
      var cr=A.crece(s,pc.c), cre=(tk-pc.t0)/cr;
      if(cre>=1){
        caja(z.x,z.y,z.w,z.h,"rgba(255,236,39,.14)",late(now,220)?P.y:"#e8b400",1);
        spr(ctx,pc.c,z.x+2,z.y+1.5+(late(now,160)?0:1),2);
        tx("¡Listo!",z.x+24,z.y+5,{t:6,c:P.y,peso:800}); tx("toca",z.x+24,z.y+13,{t:5,c:"#f4ead8",peso:600});
      }else{
        var cc=pc.c==="t"?P.y:pc.c==="m"?P.g:P.o, alto=Math.max(1,Math.round(cre*12));
        for(var q=0;q<4;q++){ctx.fillStyle=P.G;ctx.fillRect(z.x+4+q*7,z.y+19-alto,2,alto); if(cre>0.55){ctx.fillStyle=cc;ctx.fillRect(z.x+3+q*7,z.y+19-alto,4,2);}}
        barra(z.x+2,z.y+z.h-3,z.w-4,2,cre,P.g);
        tx(Math.ceil((cr-(tk-pc.t0))/10)+" s",z.x+z.w-2,z.y+2,{t:5.5,c:P.w,al:"right",peso:700,sombra:true});
      }
    }
    for(i=0;i<3;i++){
      z=Z.semilla(i); var k=A.CULTIVOS[i], abre=A.ITEMS[k].nivel<=s.nivel, sel=semilla===k&&abre;
      caja(z.x,z.y,z.w,z.h,abre?(sel?"#2f4f9a":CU.card):CU.osc,sel?P.y:null);
      if(abre){spr(ctx,k,z.x+3,z.y+3); tx(nombres[k],z.x+15,z.y+2,{t:6,c:P.w}); tx((A.crece(s,k)/10)+" s · da "+A.rinde(s),z.x+15,z.y+9,{t:4.8,c:CU.pista,peso:600});}
      else{spr(ctx,"lock",z.x+4,z.y+4.5); tx("Nivel "+A.ITEMS[k].nivel,z.x+15,z.y+5,{t:5.5,c:CU.pista,peso:600});}
    }

    /* ===== fábricas ===== */
    seccion(Y.fab,"FÁBRICAS","toca para fabricar · hasta "+A.cola(s)+" en cola");
    for(i=0;i<A.FABRICAS.length;i++){
      z=Z.fabrica(i); var d=A.FABRICAS[i], fb=s.fabricas[i], ab=d.nivel<=s.nivel;
      var sf=mal&&mal.k==="f"+i&&now-mal.t<300?Math.sin(now/20)*2:0, fx=z.x+sf;
      if(!ab){caja(fx,z.y,z.w,z.h,CU.osc); spr(ctx,"lock",fx+6,z.y+9.5); tx(d.nom,fx+17,z.y+5,{t:6,c:CU.pista}); tx("Se abre en el nivel "+d.nivel,fx+17,z.y+13,{t:5,c:CU.pista,peso:600}); continue;}
      var puede=A.hay(s,d.de)&&fb.cola.length<A.cola(s);
      caja(fx,z.y,z.w,z.h,CU.card,puede?P.u:CU.card2);
      ctx.save(); ctx.translate(fx+1,z.y+7); edificio(ctx,d.id,0,0,fb.cola.length?now:0); ctx.restore();
      tx(d.nom,fx+25,z.y+2,{t:6});
      var rx=fx+25, ks=Object.keys(d.de);
      ks.forEach(function(kk){var cant=d.de[kk], tiene=(s.granero[kk]||0)>=cant;
        tx(String(cant),rx,z.y+13,{t:5.5,c:tiene?P.w:"#ff8fab"}); spr(ctx,kk,rx+3.5,z.y+10.5,1); rx+=15;});
      tx("→",rx-0.5,z.y+12,{t:6,c:CU.titulo}); spr(ctx,d.da,rx+6,z.y+10.5,1);
      for(var c2=0;c2<A.cola(s);c2++){ctx.fillStyle=c2<fb.cola.length?P.y:"rgba(0,0,0,.4)";ctx.fillRect(fx+z.w-4-(A.cola(s)-c2)*5,z.y+3,4,4);}
      if(fb.cola.length)barra(fx+2,z.y+z.h-3,z.w-4,2,(tk-fb.t0)/A.dura(s,i),P.g);
      if(fb.lista&&late(now,300))tx("GRANERO LLENO",fx+z.w-3,z.y+11,{t:4.8,c:P.r,al:"right",peso:800});
    }
    /* ===== la pregunta de mejora (en la casilla libre) ===== */
    z=Z.pregunta;
    var nMej=Object.keys(s.mej).reduce(function(t,k){return t+s.mej[k];},0);
    if(s.qDisp){
      caja(z.x,z.y,z.w,z.h,late(now,300)?"#7a1fa2":"#5b1680",late(now,150)?P.y:"#ffd84d",1.5);
      tx("❓",z.x+5,z.y+6,{t:11}); tx("¡Pregunta!",z.x+21,z.y+4,{t:7,c:"#fff",peso:800}); tx("acierta y elige una mejora",z.x+21,z.y+14,{t:4.8,c:"#f0d9ff",peso:600});
    }else{
      caja(z.x,z.y,z.w,z.h,CU.osc,CU.card2);
      tx("❓",z.x+5,z.y+6,{t:11,c:"#aaa"});
      if(s.preguntas>=A.MAX_Q)tx("Sin más preguntas",z.x+21,z.y+4,{t:6,c:CU.pista});
      else{tx("Pregunta en "+Math.max(0,Math.ceil((s.proxQ-tk)/10))+" s",z.x+21,z.y+4,{t:6,c:CU.titulo}); barra(z.x+21,z.y+12,66,2,1-(s.proxQ-tk)/(s.preguntas?A.CADA_Q:s.proxQ),"#b46ee0");}
      tx(nMej?"Mejoras: "+nMej+" · aciertos "+s.aciertos+"/"+s.preguntas:"Cada acierto: una mejora",z.x+21,z.y+17,{t:4.8,c:CU.pista,peso:600});
    }

    /* ===== granero ===== */
    var tot=A.total(s), cap=A.capacidad(s), lleno=tot>=cap, gm=mal&&mal.k==="g"&&now-mal.t<600;
    seccion(Y.gra,"GRANERO "+tot+"/"+cap);
    if(lleno||gm){ if(late(now,200)){ctx.fillStyle="rgba(255,0,77,.35)";ctx.fillRect(2,Y.gra-1,64,9);} }
    caja(Z.vender.x,Z.vender.y,Z.vender.w,Z.vender.h,vender?P.r:"#3a2414",vender?"#fff":"#c8a165");
    tx(vender?"Vendiendo…":"Vender",Z.vender.x+Z.vender.w/2,Z.vender.y+2,{t:5.5,al:"center"});
    for(i=0;i<ORDEN_ITEMS.length;i++){
      z=Z.item(i); var it=ORDEN_ITEMS[i], cnt=s.granero[it]||0, vis=A.ITEMS[it].nivel<=s.nivel;
      /* cajones de madera */
      caja(z.x,z.y,z.w,z.h,vender&&cnt?"#7a2040":"#c8954f","#8a5a2b"); ctx.fillStyle="rgba(90,58,28,.35)"; ctx.fillRect(z.x+1,z.y+12,z.w-2,1);
      if(!vis){spr(ctx,"lock",z.x+7.5,z.y+8,1,0.6);continue;}
      spr(ctx,it,z.x+6,z.y+2,1,cnt?1:0.35);
      tx(String(cnt),z.x+z.w/2,z.y+14,{t:7,c:cnt?"#2a1608":"rgba(42,22,8,.45)",al:"center",peso:800});
      if(vender&&cnt)tx("+"+Math.max(1,Math.floor(A.ITEMS[it].valor/2)),z.x+z.w-1,z.y+1,{t:4.5,c:P.y,al:"right"});
    }
    if(s.combo&&tk-s.ultEntrega<A.COMBO_T){barra(3,H-3,186,2,1-(tk-s.ultEntrega)/A.COMBO_T,P.o);}

    /* textos que flotan */
    flot=flot.filter(function(f){var e=now-f.t0; if(e>900)return false; tx(f.t,f.x,f.y-e/60,{t:7,c:f.c,sombra:true,peso:800}); return true;});
    if(banner&&now-banner.t0<1600){caja(-4,120,W+8,30,"rgba(0,0,0,.7)"); tx(banner.t,W/2,124,{t:18,c:late(now,120)?P.y:P.o,al:"center",peso:900,sombra:true});}
    if(now<inicio){var n2=Math.min(3,Math.ceil((inicio-now)/1000)); caja(-4,0,W+8,H,"rgba(0,0,0,.6)");
      tx(String(n2),W/2,92,{t:48,c:P.y,al:"center",peso:900,sombra:true}); tx("¡Prepárate!",W/2,150,{t:12,al:"center",sombra:true});
      tx("Siembra · fabrica · entrega · acierta",W/2,168,{t:7,c:CU.titulo,al:"center"});}
    if(final){caja(-4,0,W+8,H,"rgba(0,0,0,.7)");
      tx(final==="vidas"?"¡Sin vidas!":final==="plantado"?"Fin":"¡Tiempo!",W/2,92,{t:20,c:P.r,al:"center",peso:900,sombra:true});
      tx(s.monedas+" monedas",W/2,124,{t:14,c:P.y,al:"center",peso:800,sombra:true});
      tx(s.entregas+" pedidos · nivel "+s.nivel+" · "+s.aciertos+" aciertos",W/2,146,{t:8,al:"center",sombra:true});}
    ctx.setTransform(1,0,0,1,0,0);
  }

  /* ---------- bucle: la simulación sigue el reloj (salvo en pausa), el dibujo cada fotograma ---------- */
  var cont3=3;
  function cuadro(now){
    if(!yo.vivo)return;
    if(now<inicio){var n=Math.ceil((inicio-now)/1000); if(n<cont3&&n>0){cont3=n;SON.cuenta();} dibuja(now); yo.raf=requestAnimationFrame(cuadro); return;}
    if(!t0){t0=inicio;SON.ya();msg(datos.modo==="sinfin"?"Sin reloj: aguanta hasta que se te escapen tres pedidos.":"¡A trabajar! Elige una semilla y toca una parcela.");}
    if(!pausa){
      var meta=Math.floor((now-t0)/A.TICK);
      while(s.tick<meta&&!s.fin){A.paso(s);}
    }
    eventos();
    if(s.fin){termina(s.motivo);return;}
    dibuja(now);
    yo.raf=requestAnimationFrame(cuadro);
  }
  yo.raf=requestAnimationFrame(cuadro);
}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}

/* ===================== PORTADA ===================== */
function api(path,body){
  return fetch(path,{method:body?"POST":"GET",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:body?JSON.stringify(body):undefined}).then(function(r){return r.text().then(function(t){var j;try{j=JSON.parse(t);}catch(x){throw {error:"http",status:r.status};}if(!r.ok)throw j;return j;});});
}
function guarda(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem("gx_"+k)||"null");localStorage.setItem("gx_"+k,JSON.stringify(v));}catch(e){return null}}
function ERR(e){
  var m={unauthorized:"Entra con Google para jugar la granja del día.",google_required:"Para la granja del día hace falta entrar con Google.",bad_result:"La partida no cuadra con la simulación del servidor.",
    bad_time:"El tiempo de la partida no cuadra con el reloj del servidor.",not_started:"Primero empieza la partida.",granja_not_configured:"Falta crear la tabla de la granja en la base de datos (ver SETUP.md)."};
  if(e&&m[e.error])return m[e.error];
  if(e&&e.error==="server_error")return "Falló el servidor (referencia "+(e.ref||"—")+")"+(e.detalle?": "+e.detalle:".");
  if(e instanceof TypeError)return "Sin conexión con el servidor.";
  return "No se pudo completar"+(e&&e.error?" ("+e.error+")":"")+".";
}
function panel(){return $("rapido-panel");}
function portada(nota){
  var pn=panel(); if(!pn)return;
  pn.hidden=false;
  var u=window.AxAccount&&AxAccount.user(), b1=guarda("best_granja"), b2=guarda("best_granja_sinfin");
  pn.innerHTML='<div class="gx-portada"><h3>🚜 Granja Express</h3>'+
    '<p class="fine">Siembra, fabrica y entrega los pedidos antes de que se vayan. Sube de nivel durante la partida y acierta preguntas de cultura general para mejorar tu granja (sin repetir preguntas). Estrategia y velocidad, con gráficos de 8 bits. <a href="#" class="guia-link" data-guia="granja">¿Cómo funciona?</a></p>'+
    (nota?'<p class="msg good">'+esc(nota)+'</p>':'')+
    '<button type="button" class="rt-card gx-dia" id="gx-dia"><span class="rt-card-top"><b>🏆 La granja del día</b><span class="chip activo">ranking</span></span>'+
      '<small>La misma granja para todos hoy. Juega cuantas veces quieras: cuenta tu mejor partida.</small></button>'+
    '<button type="button" class="rt-card" id="gx-prac"><span class="rt-card-top"><b>🚜 Partida de práctica</b><span class="chip">4 min</span></span>'+
      '<small>Una granja nueva cada vez.'+(b1?' Tu mejor: <b>'+b1.score+' monedas</b>.':'')+'</small></button>'+
    '<button type="button" class="rt-card" id="gx-sf"><span class="rt-card-top"><b>♾️ Sin fin</b><span class="chip">hasta perder</span></span>'+
      '<small>Sigue hasta que se te escapen tres pedidos; cada vez con menos plazo.'+(b2?' Tu mejor: <b>'+b2.score+' monedas</b>.':'')+'</small></button>'+
    '<h4>Ranking de hoy</h4><div id="gx-rank"><p class="fine">Cargando…</p></div>'+
    '<p class="fine">También se juega en <b>Retos</b> con tus amigos y en las <b>competencias</b> de las empresas.</p></div>';
  $("gx-prac").onclick=function(){practica("granja");};
  $("gx-sf").onclick=function(){practica("granja_sinfin");};
  $("gx-dia").onclick=function(){
    if(!u||u.guest){ if(window.AxAccount&&AxAccount.configurado())AxAccount.abrirCuenta(); else alert("El inicio de sesión no está configurado."); return; }
    delDia();
  };
  ranking($("gx-rank"));
}
function ranking(z,dia){
  api("/api/granja/ranking"+(dia?"?day="+dia:"")).then(function(r){
    if(!z)return;
    z.innerHTML=r.top.length?'<ol class="rank-list">'+r.top.map(function(e){
      return '<li'+(e.me?' class="me"':'')+'><span class="pos">'+e.rank+'</span>'+(e.picture?'<img src="'+esc(e.picture)+'" alt="" referrerpolicy="no-referrer">':'<span class="noimg"></span>')+
        '<span class="who">'+esc(e.name)+(e.me?' <em>(tú)</em>':'')+'</span><span class="pts"><b>'+e.score+'</b> monedas</span></li>';}).join("")+'</ol>'+
      (r.me&&r.me.rank>r.top.length?'<p class="fine">Tu puesto: <b>#'+r.me.rank+'</b> de '+r.total+'.</p>':r.total>r.top.length?'<p class="fine">'+r.total+' granjeros hoy.</p>':''):
      '<p class="fine">Todavía nadie ha jugado la granja de hoy. ¡Sé el primero!</p>';
  }).catch(function(e){ if(z)z.innerHTML='<p class="fine">'+esc(e&&e.error==="granja_not_configured"?ERR(e):"No se pudo cargar el ranking.")+'</p>'; });
}
function practica(juego){
  if(!window.AxRapidosUI)return;
  AxRapidosUI.jugar({juego:juego,sub:"Práctica",nota:"Una granja nueva. Tu mejor marca se guarda en este teléfono.",
    pedirDatos:function(){return Promise.resolve(R.genera(juego,(Math.random()*4294967296)>>>0));},
    alTerminar:function(envio,res){
      var b=guarda("best_"+juego), mejor=!b||res.score>b.score; if(mejor)guarda("best_"+juego,res);
      resultado(juego,res,mejor?"¡Mejor marca!":"Tu mejor marca: "+b.score+" monedas",function(){practica(juego);});
    }});
}
function delDia(){
  var inicio=null;
  AxRapidosUI.jugar({juego:"granja",sub:"Granja del día",titulo:"La misma granja para todos hoy",
    nota:"Cuenta tu mejor partida del día. El servidor repite tu partida para comprobar las monedas.",
    pedirDatos:function(){return api("/api/granja/dia/empieza",{}).then(function(r){inicio=r;return r.datos;});},
    error:ERR,
    alTerminar:function(envio,res){
      var pn=panel(); pn.innerHTML='<p class="fine">Enviando tu partida…</p>';
      api("/api/granja/dia/termina",{envio:envio}).then(function(r){
        resultado("granja",{score:r.score,entregas:res.entregas,nivel:res.nivel},
          (r.mejoro?"¡Tu mejor partida de hoy!":"Tu mejor de hoy: "+r.best+" monedas")+(r.rank?" · puesto #"+r.rank+" de "+r.total:""),delDia,true);
      }).catch(function(e){pn.innerHTML='<p class="fine bad">'+esc(ERR(e))+'</p><div class="actions"><button class="ghost" id="gx-volver">Volver</button></div>';$("gx-volver").onclick=function(){portada();};});
    }});
}
function resultado(juego,res,linea,otra,conRanking){
  var pn=panel();
  pn.innerHTML='<div class="rt-head"><h3>🚜 '+esc(R.JUEGOS[juego].nom)+'</h3><span class="chip activo">Terminado</span></div>'+
    '<div class="rp-res"><b>'+res.score+' monedas</b><small>'+(res.entregas!=null?res.entregas+' pedidos entregados · nivel '+res.nivel+' · ':'')+esc(linea)+'</small></div>'+
    (conRanking?'<h4>Ranking de hoy</h4><div id="gx-rank"><p class="fine">Cargando…</p></div>':'')+
    '<div class="actions"><button class="primary" id="gx-otra">Otra vez</button><button class="ghost" id="gx-menu">Granja Express</button></div>';
  $("gx-otra").onclick=otra; $("gx-menu").onclick=function(){portada();};
  if(conRanking)ranking($("gx-rank"));
}

window.AxGranjaUI={monta:monta,para:para,portada:portada,sprite:sprite};
})();
