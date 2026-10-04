/* ===========================================================
   THE FINAL TEST · Granja Express · pantalla
   Un lienzo de 192×246 píxeles escalado sin suavizar: todo se
   dibuja por código (sprites de 10×10, fuente de 3×5) y el sonido
   son pitidos de 8 bits con WebAudio. Sin imágenes ni librerías.
     AxGranjaUI.monta(contenedor, datos, cfg, done)  una partida
     AxGranjaUI.para()                               la detiene
     AxGranjaUI.portada()                            menú (práctica, del día, sin fin)
   =========================================================== */
(function(){
"use strict";
var A=window.AxGranja, R=window.AxRapidos;
if(!A||!R)return;
var $=function(id){return document.getElementById(id)};
var W=192, H=246;

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
var cache={};
function sprite(ctx,id,x,y,esc){
  var s=SPR[id]; if(!s)return; esc=esc||1;
  for(var f=0;f<s.length;f++)for(var c=0;c<s[f].length;c++){var ch=s[f][c]; if(ch===".")continue; ctx.fillStyle=P[ch]; ctx.fillRect(x+c*esc,y+f*esc,esc,esc);}
}

/* ---------- fuente de 3×5 ---------- */
var FUENTE={"0":[7,5,5,5,7],"1":[2,6,2,2,7],"2":[7,1,7,4,7],"3":[7,1,3,1,7],"4":[5,5,7,1,1],"5":[7,4,7,1,7],"6":[7,4,7,5,7],"7":[7,1,1,2,2],"8":[7,5,7,5,7],"9":[7,5,7,1,7],
 A:[2,5,7,5,5],B:[6,5,6,5,6],C:[3,4,4,4,3],D:[6,5,5,5,6],E:[7,4,6,4,7],F:[7,4,6,4,4],G:[3,4,5,5,3],H:[5,5,7,5,5],I:[7,2,2,2,7],J:[1,1,1,5,2],K:[5,5,6,5,5],L:[4,4,4,4,7],M:[5,7,7,5,5],
 N:[6,5,5,5,5],O:[2,5,5,5,2],P:[6,5,6,4,4],Q:[2,5,5,6,3],R:[6,5,6,5,5],S:[3,4,2,1,6],T:[7,2,2,2,2],U:[5,5,5,5,7],V:[5,5,5,5,2],W:[5,5,7,7,5],X:[5,5,2,5,5],Y:[5,5,2,2,2],Z:[7,1,2,4,7],
 ":":[0,2,0,2,0],"/":[1,1,2,4,4],"+":[0,2,7,2,0],"-":[0,0,7,0,0],"!":[2,2,2,0,2],".":[0,0,0,0,2],"x":[0,5,2,5,0]," ":[0,0,0,0,0]};
function letra(c){return c.replace(/[ÁÀ]/g,"A").replace(/[ÉÈ]/g,"E").replace(/[ÍÌ]/g,"I").replace(/[ÓÒ]/g,"O").replace(/[ÚÙÜ]/g,"U").replace(/Ñ/g,"N");}
function ancho(t,esc){return String(t).length*4*(esc||1)-(esc||1);}
function texto(ctx,t,x,y,col,esc,sombra){
  t=letra(String(t).toUpperCase()); esc=esc||1;
  if(sombra){texto(ctx,t,x+esc,y+esc,"#000",esc);}
  ctx.fillStyle=col||P.w;
  for(var i=0;i<t.length;i++){var g=FUENTE[t[i]]||FUENTE[" "];
    for(var f=0;f<5;f++)for(var b=0;b<3;b++)if(g[f]&(4>>b))ctx.fillRect(x+(i*4+b)*esc,y+f*esc,esc,esc);}
}
function centrado(ctx,t,cx,y,col,esc,sombra){texto(ctx,t,Math.round(cx-ancho(t,esc)/2),y,col,esc,sombra);}
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

/* ---------- disposición ---------- */
var Z={
  pedido:function(i){return {x:2+i*47.5|0,y:19,w:46,h:58};},
  parcela:function(i){return {x:4+(i%3)*32,y:82+Math.floor(i/3)*32,w:30,h:30};},
  semilla:function(i){return {x:104,y:84+i*20,w:84,h:18};},
  fabrica:function(i){return {x:2+i*38,y:150,w:36,h:56};},
  item:function(i){return {x:2+Math.round(i*23.6),y:219,w:22,h:22};},
  vender:{x:146,y:209,w:44,h:9}
};
function dentro(r,x,y){return x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;}
var ORDEN_ITEMS=["t","m","z","h","p","u","j","k"];

/* ===================== UNA PARTIDA ===================== */
var J=null;   /* la partida en curso */
function para(){ if(J){J.vivo=false; if(J.raf)cancelAnimationFrame(J.raf); J=null;} }

function monta(cont,datos,cfg,done){
  para();
  cfg=cfg||{};
  var marca=cfg.marca||{}, nombres={};
  ORDEN_ITEMS.forEach(function(k){nombres[k]=(marca.productos&&marca.productos[k])||A.ITEMS[k].nom;});
  cont.insertAdjacentHTML("beforeend",
    '<div class="gx" id="gx"><canvas id="gx-cv" width="'+W+'" height="'+H+'" aria-label="Granja Express: tablero de juego"></canvas>'+
    '<div class="gx-bar"><span class="gx-msg" id="gx-msg">Toca una parcela para sembrar.</span>'+
    '<button type="button" class="ghost au-mini" id="gx-son" title="Sonido">'+(mudo?"🔇":"🔊")+'</button>'+
    '<button type="button" class="ghost au-mini" id="gx-fin">'+(datos.modo==="sinfin"?"Plantarme":"Terminar")+'</button></div>'+
    '<details class="gx-ley"><summary>Recetas y precios</summary><ul>'+
      A.FABRICAS.map(function(f){return '<li><b>'+esc(f.nom)+'</b> (nivel '+f.nivel+'): '+Object.keys(f.de).map(function(k){return f.de[k]+' '+esc(nombres[k]);}).join(" + ")+
        ' → '+esc(nombres[f.da])+' · '+(f.dura/10)+' s</li>';}).join("")+
      '<li>Cultivos: '+A.CULTIVOS.map(function(k){return esc(nombres[k])+' '+(A.ITEMS[k].crece/10)+' s';}).join(", ")+'. Cada parcela da 2.</li>'+
      '<li>Niveles: '+A.NIVELES.slice(2).map(function(n,i){return 'nivel '+(i+2)+' con '+n+' monedas';}).join(", ")+'.</li>'+
      '<li>Entregar rápido suma monedas; encadenar entregas (menos de 8 s entre una y otra) da combo. «Vender» saca del granero a mitad de precio.</li></ul></details></div>');
  var cv=$("gx-cv"), ctx=cv.getContext("2d");
  ctx.imageSmoothingEnabled=false;
  var s=A.crea(datos.seed,datos.modo), log=[], semilla="t", vender=false, flot=[], aviso={t:"",hasta:0}, banner=null, temblor=0, mal=null;
  var logo=null;
  if(marca.logo){logo=new Image();logo.src=marca.logo;}
  J={vivo:true,raf:0};
  var yo=J, t0=0, inicio=performance.now()+3200;   /* cuenta atrás de 3 s */

  function msg(t){var m=$("gx-msg"); if(m)m.textContent=t;}
  function flota(txt,x,y,col){flot.push({t:txt,x:x,y:y,c:col||P.y,t0:performance.now()});}
  function hace(a,b,c){
    if(!A.act(s,a,b,c))return false;
    log.push(c==null?[s.tick,a,b]:[s.tick,a,b,c]);
    return true;
  }
  function falta(de){return Object.keys(de).filter(function(k){return (s.granero[k]||0)<de[k];}).map(function(k){return (de[k]-(s.granero[k]||0))+' '+nombres[k];}).join(", ");}

  /* ---------- toques ---------- */
  cv.addEventListener("pointerdown",function(e){
    if(!yo.vivo||s.fin||performance.now()<inicio)return;
    e.preventDefault();
    var r=cv.getBoundingClientRect(), x=(e.clientX-r.left)*W/r.width, y=(e.clientY-r.top)*H/r.height, i, z;
    for(i=0;i<4;i++){z=Z.pedido(i); if(!dentro(z,x,y))continue;
      if(i>=A.ANDENES[s.nivel]){msg("Ese andén se abre en el nivel "+(i===2?2:4)+".");SON.no();return;}
      var o=s.pedidos[i].p; if(!o){msg("Está llegando un pedido…");return;}
      if(x>z.x+z.w-10&&y<z.y+10){ if(hace("x",i)){msg("Pedido descartado: el andén tarda 8 s en llenarse.");SON.vende();} return; }
      if(hace("e",i))return;
      msg("Faltan: "+o.items.filter(function(it){return (s.granero[it[0]]||0)<it[1];}).map(function(it){return (it[1]-(s.granero[it[0]]||0))+" "+nombres[it[0]];}).join(", ")+".");
      mal={k:"p"+i,t:performance.now()}; SON.no(); return;}
    for(i=0;i<A.PARCELAS;i++){z=Z.parcela(i); if(!dentro(z,x,y))continue;
      var pc=s.parcelas[i];
      if(!pc.c){ if(hace("s",i,semilla))return; msg(A.ITEMS[semilla].nivel>s.nivel?nombres[semilla]+" se desbloquea en el nivel "+A.ITEMS[semilla].nivel+".":"No se puede sembrar."); SON.no(); return; }
      if(s.tick-pc.t0>=A.ITEMS[pc.c].crece){ if(hace("c",i))return; msg("El granero está lleno: entrega un pedido o vende algo."); mal={k:"g",t:performance.now()}; SON.no(); return; }
      msg(nombres[pc.c]+": faltan "+Math.ceil((A.ITEMS[pc.c].crece-(s.tick-pc.t0))/10)+" s."); return;}
    for(i=0;i<3;i++){z=Z.semilla(i); if(!dentro(z,x,y))continue;
      var k=A.CULTIVOS[i]; if(A.ITEMS[k].nivel>s.nivel){msg(nombres[k]+" se desbloquea en el nivel "+A.ITEMS[k].nivel+".");SON.no();return;}
      semilla=k; msg("Ahora siembras "+nombres[k]+"."); return;}
    for(i=0;i<A.FABRICAS.length;i++){z=Z.fabrica(i); if(!dentro(z,x,y))continue;
      var d=A.FABRICAS[i];
      if(d.nivel>s.nivel){msg(d.nom+" se abre en el nivel "+d.nivel+".");SON.no();return;}
      if(hace("f",i))return;
      msg(s.fabricas[i].cola.length>=A.COLA?d.nom+": la cola está llena (3).":d.nom+": faltan "+falta(d.de)+".");
      mal={k:"f"+i,t:performance.now()}; SON.no(); return;}
    if(dentro(Z.vender,x,y)){vender=!vender; msg(vender?"Toca un producto del granero para venderlo a mitad de precio.":"Venta cerrada."); return;}
    for(i=0;i<ORDEN_ITEMS.length;i++){z=Z.item(i); if(!dentro(z,x,y))continue;
      var it=ORDEN_ITEMS[i];
      if(vender){ if(!hace("v",0,it)){msg("No tienes "+nombres[it]+".");SON.no();} return; }
      msg(nombres[it]+": "+(s.granero[it]||0)+" en el granero. Se vende a "+Math.max(1,Math.floor(A.ITEMS[it].valor/2))+" (toca «Vender»)."); return;}
  });
  $("gx-son").onclick=function(){mudo=!mudo; try{localStorage.setItem("gx_mudo",mudo?"1":"0");}catch(e){} this.textContent=mudo?"🔇":"🔊";};
  $("gx-fin").onclick=function(){
    if(!yo.vivo||s.fin)return;
    if(!confirm(datos.modo==="sinfin"?"¿Plantarte con "+s.monedas+" monedas?":"¿Terminar ya la partida con "+s.monedas+" monedas?"))return;
    termina("plantado");
  };

  function termina(motivo){
    if(!yo.vivo)return;
    yo.vivo=false; cancelAnimationFrame(yo.raf);
    var envio={a:log,fin:s.tick};
    dibuja(performance.now(),motivo||s.motivo);
    SON.fin();
    setTimeout(function(){ var g=$("gx"); if(g)g.remove(); if(J===yo)J=null; done(envio); },1300);
  }

  /* ---------- eventos del motor: sonido y animación ---------- */
  function eventos(){
    var now=performance.now();
    s.ev.forEach(function(e){
      if(e.tipo==="siembra")SON.siembra();
      else if(e.tipo==="cosecha"){SON.cosecha();var z=Z.parcela(e.i);flota("+2",z.x+9,z.y+8,P.w);}
      else if(e.tipo==="fabrica")SON.fabrica();
      else if(e.tipo==="hecho"){SON.hecho();var f=Z.fabrica(e.f);flota("+1",f.x+12,f.y+20,P.g);}
      else if(e.tipo==="entrega"){SON.entrega(e.combo);var z2=Z.pedido(e.i);flota("+"+e.monedas,z2.x+10,z2.y+22,P.y);
        if(e.combo)flota("COMBO X"+(1+e.combo/10).toFixed(1).replace(".0",""),z2.x+2,z2.y+34,P.o);
        msg("¡Entregado! +"+e.monedas+" monedas"+(e.combo?" · combo "+e.combo:"")+".");}
      else if(e.tipo==="perdido"){SON.perdido();temblor=now+400;msg("¡Se fue un pedido! Te quedan "+s.vidas+(s.vidas===1?" vida.":" vidas."));}
      else if(e.tipo==="nivel"){SON.nivel();banner={t:"NIVEL "+e.n,t0:now};
        msg({2:"Nivel 2: zanahoria, gallinero, jugos y un tercer andén.",3:"Nivel 3: la pastelería ya hace tortas.",4:"Nivel 4: llega el barco, un cuarto andén."}[e.n]||"");}
      else if(e.tipo==="vende"){SON.vende();flota("+"+e.monedas,Z.vender.x+10,Z.vender.y,P.y);}
      else if(e.tipo==="lleno")msg("El granero está lleno: lo fabricado espera en la fábrica.");
    });
    s.ev.length=0;
  }

  /* ---------- dibujo ---------- */
  function caja(x,y,w,h,col,borde){ctx.fillStyle=col;ctx.fillRect(x,y,w,h);if(borde){ctx.fillStyle=borde;ctx.fillRect(x,y,w,1);ctx.fillRect(x,y+h-1,w,1);ctx.fillRect(x,y,1,h);ctx.fillRect(x+w-1,y,1,h);}}
  function dibuja(now,final){
    var tk=s.tick, i, z, dx=0;
    if(now<temblor){dx=Math.round(Math.sin(now/25)*2);}
    ctx.setTransform(1,0,0,1,dx,0);
    ctx.fillStyle=FONDO; ctx.fillRect(-4,0,W+8,H);
    /* marcador */
    sprite(ctx,"moneda",2,2); texto(ctx,s.monedas,10,2,P.y,2);
    sprite(ctx,"estrella",86,3); texto(ctx,"N"+s.nivel,95,4,P.w);
    for(i=0;i<A.VIDAS;i++)sprite(ctx,i<s.vidas?"vida":"vida0",112+i*9,3);
    var quedan=s.modo==="sinfin"?tk:A.DUR-tk;
    var rt=reloj(quedan); texto(ctx,rt,W-2-ancho(rt,2),2,s.modo!=="sinfin"&&quedan<300&&(tk%10<5)?P.r:P.w,2);
    /* barra de nivel */
    var de=A.NIVELES[s.nivel]||0, a=A.NIVELES[s.nivel+1];
    caja(2,14,W-4,3,P.U); if(a){ctx.fillStyle=P.o;ctx.fillRect(2,14,Math.round((W-4)*Math.min(1,(s.monedas-de)/(a-de))),3);} else {ctx.fillStyle=P.g;ctx.fillRect(2,14,W-4,3);}
    /* pedidos */
    for(i=0;i<4;i++){
      z=Z.pedido(i); var abierto=i<A.ANDENES[s.nivel], o=s.pedidos[i].p;
      var sac=mal&&mal.k==="p"+i&&now-mal.t<300?Math.round(Math.sin(now/20)*2):0;
      if(!abierto){caja(z.x,z.y,z.w,z.h,"#151d3b");sprite(ctx,"lock",z.x+19,z.y+18);centrado(ctx,"NIVEL "+(i===2?2:4),z.x+z.w/2,z.y+30,P.s);continue;}
      var ok=o&&A.puedeEntregar(s,i);
      caja(z.x+sac,z.y,z.w,z.h,PANEL,ok?((now/180|0)%2?P.g:P.y):PANEL2);
      vehiculo(ctx,i,z.x+3+sac,z.y+3,i===0&&marca.color?marca.color:null,i===0?logo:null);
      if(!o){var pts=".".repeat(1+((now/300|0)%3)); centrado(ctx,pts,z.x+z.w/2,z.y+28,P.s); continue;}
      texto(ctx,"x",z.x+z.w-7+sac,z.y+3,P.r);
      o.items.forEach(function(it,n){
        var yy=z.y+13+n*13, tengo=(s.granero[it[0]]||0)>=it[1];
        sprite(ctx,it[0],z.x+3+sac,yy);
        texto(ctx,it[1],z.x+16+sac,yy+3,tengo?P.g:P.w);
        if(tengo){ctx.fillStyle=P.g;ctx.fillRect(z.x+24+sac,yy+5,1,1);ctx.fillRect(z.x+25+sac,yy+6,1,1);ctx.fillRect(z.x+26+sac,yy+5,1,1);ctx.fillRect(z.x+27+sac,yy+4,1,1);ctx.fillRect(z.x+28+sac,yy+3,1,1);}
      });
      sprite(ctx,"moneda",z.x+28+sac,z.y+44); texto(ctx,o.premio,z.x+3+sac,z.y+45,P.y);
      var fr=Math.max(0,(o.vence-tk)/(o.vence-o.t0)), col=fr>0.5?P.g:fr>0.25?P.y:P.r;
      if(fr<0.25&&(tk%6<3))col=P.w;
      caja(z.x+2,z.y+z.h-5,z.w-4,3,"#151d3b"); ctx.fillStyle=col; ctx.fillRect(z.x+2,z.y+z.h-5,Math.round((z.w-4)*fr),3);
    }
    /* campo */
    caja(2,80,98,68,P.G);
    for(i=0;i<A.PARCELAS;i++){
      z=Z.parcela(i); var pc=s.parcelas[i];
      caja(z.x,z.y,z.w,z.h,P.B); ctx.fillStyle=P.O; for(var f=0;f<4;f++)ctx.fillRect(z.x+2,z.y+4+f*7,z.w-4,2);
      if(!pc.c){ if(semilla&&A.ITEMS[semilla].nivel<=s.nivel&&(now/500|0)%2){ctx.fillStyle="rgba(255,241,232,.25)";ctx.fillRect(z.x+13,z.y+10,4,10);ctx.fillRect(z.x+10,z.y+13,10,4);} continue; }
      var cre=(tk-pc.t0)/A.ITEMS[pc.c].crece;
      if(cre>=1){var bote=(now/150|0)%2; sprite(ctx,pc.c,z.x+4,z.y+8-bote); sprite(ctx,pc.c,z.x+16,z.y+10+bote-1);
        if((now/250|0)%3===0){ctx.fillStyle=P.w;ctx.fillRect(z.x+26,z.y+3,1,3);ctx.fillRect(z.x+25,z.y+4,3,1);}}
      else{ var cc=pc.c==="t"?P.y:pc.c==="m"?P.g:P.o, alto=Math.max(1,Math.round(cre*9));
        for(var q=0;q<3;q++){ctx.fillStyle=P.g;ctx.fillRect(z.x+6+q*8,z.y+22-alto,2,alto); if(cre>0.6){ctx.fillStyle=cc;ctx.fillRect(z.x+5+q*8,z.y+22-alto,4,2);}}
        ctx.fillStyle="#151d3b"; ctx.fillRect(z.x+2,z.y+z.h-4,z.w-4,2); ctx.fillStyle=P.g; ctx.fillRect(z.x+2,z.y+z.h-4,Math.round((z.w-4)*cre),2);
      }
    }
    /* semillas */
    for(i=0;i<3;i++){
      z=Z.semilla(i); var k=A.CULTIVOS[i], abre=A.ITEMS[k].nivel<=s.nivel;
      caja(z.x,z.y,z.w,z.h,abre?PANEL:"#151d3b",semilla===k&&abre?P.y:null);
      if(abre){sprite(ctx,k,z.x+3,z.y+4); texto(ctx,nombres[k].slice(0,11),z.x+16,z.y+4,P.w); texto(ctx,(A.ITEMS[k].crece/10)+"S",z.x+16,z.y+11,P.s);}
      else{sprite(ctx,"lock",z.x+4,z.y+5); texto(ctx,"NIVEL "+A.ITEMS[k].nivel,z.x+16,z.y+7,P.s);}
    }
    /* fábricas */
    for(i=0;i<A.FABRICAS.length;i++){
      z=Z.fabrica(i); var d=A.FABRICAS[i], fb=s.fabricas[i], ab=d.nivel<=s.nivel;
      var sf=mal&&mal.k==="f"+i&&now-mal.t<300?Math.round(Math.sin(now/20)*2):0;
      if(!ab){caja(z.x,z.y,z.w,z.h,"#151d3b");sprite(ctx,"lock",z.x+14,z.y+14);centrado(ctx,"NIVEL "+d.nivel,z.x+z.w/2,z.y+26,P.s);continue;}
      var listo=A.hay(s,d.de)&&fb.cola.length<A.COLA;
      caja(z.x+sf,z.y,z.w,z.h,PANEL,listo?P.u:PANEL2);
      edificio(ctx,d.id,z.x+7+sf,z.y+7,fb.cola.length?now:0);
      for(var c=0;c<A.COLA;c++){ctx.fillStyle=c<fb.cola.length?P.y:"#151d3b";ctx.fillRect(z.x+6+c*9+sf,z.y+26,7,3);}
      if(fb.cola.length){var fp=Math.min(1,(tk-fb.t0)/d.dura); caja(z.x+3,z.y+31,z.w-6,3,"#151d3b"); ctx.fillStyle=P.g; ctx.fillRect(z.x+3,z.y+31,Math.round((z.w-6)*fp),3);}
      if(fb.lista&&(now/300|0)%2)centrado(ctx,"LLENO",z.x+z.w/2,z.y+31,P.r);
      sprite(ctx,d.da,z.x+13+sf,z.y+38);
      if(!listo&&fb.cola.length<A.COLA){ctx.fillStyle="rgba(29,43,83,.55)";ctx.fillRect(z.x+13,z.y+38,10,10);}
    }
    /* granero */
    var lleno=A.total(s)>=A.GRANERO, gm=mal&&mal.k==="g"&&now-mal.t<500;
    texto(ctx,"GRANERO "+A.total(s)+"/"+A.GRANERO,2,210,lleno||gm?((now/200|0)%2?P.r:P.w):P.w);
    caja(Z.vender.x,Z.vender.y,Z.vender.w,Z.vender.h,vender?P.r:PANEL); centrado(ctx,"VENDER",Z.vender.x+Z.vender.w/2,Z.vender.y+2,P.w);
    for(i=0;i<ORDEN_ITEMS.length;i++){
      z=Z.item(i); var it=ORDEN_ITEMS[i], n=s.granero[it]||0, vis=A.ITEMS[it].nivel<=s.nivel;
      caja(z.x,z.y,z.w,z.h,vender&&n?"#5a1630":PANEL);
      if(!vis){sprite(ctx,"lock",z.x+8,z.y+7);continue;}
      sprite(ctx,it,z.x+6,z.y+2); if(!n){ctx.fillStyle="rgba(41,54,111,.6)";ctx.fillRect(z.x+6,z.y+2,10,10);}
      centrado(ctx,n,z.x+z.w/2,z.y+15,n?P.w:P.s);
    }
    /* combo */
    if(s.combo&&tk-s.ultEntrega<A.COMBO_T){caja(2,244,Math.round((W-4)*(1-(tk-s.ultEntrega)/A.COMBO_T)),2,P.o);}
    /* textos que flotan */
    flot=flot.filter(function(f){var e=now-f.t0; if(e>900)return false; texto(ctx,f.t,f.x,Math.round(f.y-e/60),f.c,1,true); return true;});
    /* cartel de nivel */
    if(banner&&now-banner.t0<1600){caja(0,104,W,26,"rgba(0,0,0,.65)"); centrado(ctx,banner.t,W/2,108,(now/120|0)%2?P.y:P.o,3,true);}
    /* cuenta atrás y final */
    if(now<inicio){var n2=Math.ceil((inicio-now)/1000); caja(0,0,W,H,"rgba(0,0,0,.55)"); centrado(ctx,n2>3?"3":String(n2),W/2,100,P.y,6,true); centrado(ctx,"PREPARATE",W/2,150,P.w,2,true);}
    if(final){caja(0,0,W,H,"rgba(0,0,0,.65)"); centrado(ctx,final==="vidas"?"SIN VIDAS":final==="plantado"?"FIN":"TIEMPO!",W/2,90,P.r,3,true);
      centrado(ctx,s.monedas+" MONEDAS",W/2,120,P.y,2,true); centrado(ctx,s.entregas+" PEDIDOS  NIVEL "+s.nivel,W/2,140,P.w,1,true);}
    ctx.setTransform(1,0,0,1,0,0);
  }

  /* ---------- bucle: la simulación sigue el reloj, el dibujo cada fotograma ---------- */
  var cont3=3;
  function cuadro(now){
    if(!yo.vivo)return;
    if(now<inicio){var n=Math.ceil((inicio-now)/1000); if(n<cont3&&n>0){cont3=n;SON.cuenta();} dibuja(now); yo.raf=requestAnimationFrame(cuadro); return;}
    if(!t0){t0=inicio;SON.ya();msg(datos.modo==="sinfin"?"Sin reloj: aguanta hasta que se te escapen tres pedidos.":"¡A trabajar! Tres minutos.");}
    var meta=Math.floor((now-t0)/A.TICK);
    while(s.tick<meta&&!s.fin){A.paso(s);}
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
    '<p class="fine">Siembra, fabrica y entrega los pedidos antes de que se vayan. Sube de nivel durante la partida: más cultivos, fábricas y andenes. Estrategia y velocidad, con gráficos de 8 bits. <a href="#" class="guia-link" data-guia="granja">¿Cómo funciona?</a></p>'+
    (nota?'<p class="msg good">'+esc(nota)+'</p>':'')+
    '<button type="button" class="rt-card gx-dia" id="gx-dia"><span class="rt-card-top"><b>🏆 La granja del día</b><span class="chip activo">ranking</span></span>'+
      '<small>La misma granja para todos hoy. Juega cuantas veces quieras: cuenta tu mejor partida.</small></button>'+
    '<button type="button" class="rt-card" id="gx-prac"><span class="rt-card-top"><b>🚜 Partida de práctica</b><span class="chip">3 min</span></span>'+
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

window.AxGranjaUI={monta:monta,para:para,portada:portada,texto:texto,sprite:sprite};
})();
