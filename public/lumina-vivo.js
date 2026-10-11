/* ===========================================================
   THE FINAL TEST · LuminaPets · las criaturas vivas (WebGL)
   -----------------------------------------------------------
   Cada criatura es una foto recortada (fondo transparente) montada
   sobre una malla deformable con «huesos», como Live2D: cabeza,
   orejas, cola, cuerpo, hocico y alas se doblan de forma continua,
   sin capas ni costuras. Los ojos se resuelven en la GPU:
     · el párpado es el propio pelaje de la frente que baja,
     · el iris se corre dentro del ojo para mirar,
     · el párpado de abajo sube cuando sonríe (ojos felices).
   Las caricias empujan el pelo siguiendo el dedo; la criatura
   cierra los ojos, inclina la cabeza hacia la mano y ronronea.
   Sola respira, parpadea, mueve la cola, las orejas, la nariz y
   los bigotes, y mira alrededor.
     AxLuminaVivo.soporta()
     AxLuminaVivo.monta(host, criatura, {gesto}) → control:
       accion(a) · gesto(g) · mira(dx, dy) · caricia(x, y, vx, vy)
       suelta() · destruye()
   Sin WebGL (o si falla), la pantalla sigue con la imagen fija.
   =========================================================== */
(function(){
"use strict";
var L=window.AxLumina;
if(!L)return;

/* ---------- el esqueleto (en la foto de 512 × 512, normalizado a 0–1) ---------- */
function P(x,y){return [x/512,y/512];}
var BASE={cabeza:{c:P(262,188),r:[150/512,132/512],cuello:P(262,312)},
  ojos:[{c:P(209.5,205),r:[31/512,27/512]},{c:P(313.5,199.5),r:[27/512,25/512]}],
  nariz:P(265,232),mejillas:[P(212,246),P(318,240)],boca:P(265,256),
  cuerpo:{c:P(265,372),abajo:458/512},
  cola:null};
var OREJAS={gato:[{b:P(182,138),p:P(148,78),r:40/512},{b:P(336,128),p:P(368,70),r:40/512}],
  conejo:[{b:P(206,122),p:P(198,10),r:34/512},{b:P(322,116),p:P(336,8),r:34/512}],
  zorro:[{b:P(186,124),p:P(126,26),r:46/512},{b:P(332,114),p:P(396,16),r:46/512}],
  osito:[{b:P(178,128),p:P(165,82),r:46/512},{b:P(348,118),p:P(360,74),r:46/512}]};
/* alas: una textura propia detrás de la criatura (la derecha; la izquierda es su espejo), que aletea desde los hombros */
var ALAS={hada:{img:"lumina/alas-hada.webp",tam:0.66,dx:0.16,dy:-0.05},dragon:{img:"lumina/alas-dragon.webp",tam:0.56,dx:0.16,dy:-0.03}};
/* medidas de cada foto (ojos [x, y, radio x, radio y], puntas de las orejas y cola), en píxeles de 512;
   las de Lila son las del esqueleto base. Las genera el procesado de las fotos. */
var RIGS={
  algodon:{"ojos":[[215.0,204.0,25.4,22.4],[306.5,207.5,25.4,22.4]],"orejas":[[166.0,71.0],[360.0,64.0]],"abajo":455},
  astro:{"ojos":[[215.5,204.5,27.2,22.4],[307.0,205.0,27.2,22.4]],"orejas":[[130.9,70.0],[365.5,60.0]],"abajo":454},
  brasita:{"ojos":[[215.0,202.0,24.6,22.4],[308.5,200.0,24.6,22.4]],"orejas":[[231.5,0.0],[290.0,0.0]],"abajo":453},
  chispa:{"ojos":[[216.0,205.0,26.6,22.4],[306.5,202.5,26.6,22.4]],"orejas":[[129.8,70.0],[365.2,59.0]],"abajo":456},
  cometa:{"ojos":[[217.5,204.0,24.6,22.4],[305.5,205.5,24.6,22.4]],"orejas":[[117.5,38.0],[390.0,37.0]],"abajo":456,"cola":null,"patas":[[213.7,440.3,25.4],[311.3,439.3,25.4]]},
  cuarzo:{"ojos":[[214.0,208.0,26.6,29.0],[308.0,207.5,26.6,29.0]],"orejas":[[176.5,68.0],[349.0,66.0]],"abajo":454,"cola":[[177.5,375.4,23.8],[171.1,385.5,23.8],[160.6,402.0,14.4],[154.0,413.7,18.9],[146.4,420.7,26.9],[135.0,425.9,20.7],[117.8,422.1,8.5]],"patas":[[217.5,436.7,27.1],[313.8,436.4,27.1]]},
  florita:{"ojos":[[215.0,209.0,24.6,29.0],[307.5,208.0,24.6,29.0]],"orejas":[[228.5,10.0],[291.0,11.0]],"abajo":453,"cola":null,"patas":[[210.5,436.9,26.7],[313.3,436.1,26.7]]},
  iris:{"ojos":[[214.5,205.5,24.8,23.6],[311.5,200.5,24.8,23.6]],"orejas":[[132.5,20.0],[391.5,17.0]],"abajo":457},
  lila:{"cola":[[126.7,417.4,21.1],[117.3,409.9,21.1],[101.4,397.2,17.4],[94.9,379.9,14.5],[95.6,361.5,20.2],[92.9,345.5,21.2],[88.0,331.1,13.9]],"patas":[[204.4,437.4,30.0],[319.9,436.2,30.0]]},
  luzmi:{"ojos":[[214.0,210.0,25.4,29.0],[307.5,203.0,25.4,29.0]],"orejas":[[229.0,7.0],[294.6,7.0]],"abajo":455},
  miel:{"ojos":[[215.0,204.0,26.6,22.4],[306.5,208.0,26.6,22.4]],"orejas":[[167.5,69.0],[353.5,66.0]],"abajo":454},
  mirlu:{"ojos":[[214.5,205.0,27.2,22.4],[306.0,200.5,27.2,22.4]],"orejas":[[130.2,71.0],[363.0,58.0]],"abajo":456,"cola":[[127.5,413.4,31.2],[120.3,403.8,31.2],[106.4,385.3,24.0],[105.9,363.0,25.7],[108.3,341.8,31.4],[106.1,324.2,27.0],[98.2,311.4,13.2]],"patas":[[210.9,438.9,26.4],[311.3,437.6,26.4]]},
  nube:{"ojos":[[215.5,208.0,24.8,29.0],[306.5,201.0,24.8,29.0]],"orejas":[[211.0,18.0],[302.5,17.0]],"abajo":455},
  petala:{"ojos":[[215.0,204.5,27.8,22.4],[305.0,207.0,27.8,22.4]],"orejas":[[122.5,69.0],[367.0,58.0]],"abajo":457,"cola":null,"patas":[[209.9,440.9,26.0],[309.7,439.8,26.0]]},
  polar:{"ojos":[[215.0,202.5,24.6,22.4],[308.0,206.0,24.6,22.4]],"orejas":[[172.5,68.0],[354.5,64.0]],"abajo":455,"cola":[[137.5,416.2,24.2],[127.1,410.3,24.2],[107.8,399.4,18.4],[99.8,381.3,17.0],[99.0,361.3,20.7],[93.4,346.1,17.1],[90.3,332.3,8.0]],"patas":[[210.8,438.3,26.8],[313.1,437.3,26.8]]},
  rocio:{"ojos":[[216.5,202.0,24.8,22.4],[307.0,204.5,24.8,22.4]],"orejas":[[128.0,31.0],[386.5,29.0]],"abajo":453,"cola":null,"patas":[[211.7,437.6,26.1],[312.3,437.0,26.1]]},
  rubi:{"ojos":[[218.5,203.5,24.6,22.4],[307.0,206.0,24.6,22.4]],"orejas":[[125.6,35.0],[388.5,30.0]],"abajo":454}};
function rig(c){
  var r=JSON.parse(JSON.stringify(BASE)), d=RIGS[c.id];
  r.orejas=JSON.parse(JSON.stringify(OREJAS[c.esp]||OREJAS.gato));
  r.alas=ALAS[c.rasgo]||null;
  r.patas=[{c:P(204,437),r:30/512},{c:P(320,436),r:30/512}];
  if(!d)return r;
  if(d.patas&&d.patas.length===2)r.patas=d.patas.map(function(p){return {c:P(p[0],p[1]),r:p[2]/512};});
  r.cola=d.cola?d.cola.map(function(q){return [q[0]/512,q[1]/512,q[2]/512];}):null;
  if(!d.ojos)return r;
  var e=d.ojos, mx=(e[0][0]+e[1][0])/2, my=(e[0][1]+e[1][1])/2, sc=Math.abs(e[1][0]-e[0][0])/104;
  r.ojos=e.map(function(o){return {c:P(o[0],o[1]),r:[o[2]/512,o[3]/512]};});
  r.cabeza={c:P(mx,my-14*sc),r:[150*sc/512,132*sc/512],cuello:P(mx,my+110*sc)};
  r.nariz=P(mx,my+30*sc); r.mejillas=[P(mx-52*sc,my+42*sc),P(mx+52*sc,my+42*sc)]; r.boca=P(mx,my+54*sc);
  r.cuerpo.c=[mx/512,r.cuerpo.c[1]];
  if(d.orejas)d.orejas.forEach(function(t,q){if(!t)return; var p=P(t[0],t[1]), hc=r.cabeza.c;
    r.orejas[q]={p:p,b:[p[0]+(hc[0]-p[0])*0.42,p[1]+(hc[1]-p[1])*0.42],r:r.orejas[q].r*Math.max(0.8,Math.min(1.25,sc))};});
  if(d.abajo)r.cuerpo.abajo=d.abajo/512;
  return r;
}

/* ---------- utilidades ---------- */
function ss(a,b,x){var t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t);}
function rot(px,py,cx,cy,a){var s=Math.sin(a),c=Math.cos(a),dx=px-cx,dy=py-cy; return [cx+dx*c-dy*s,cy+dx*s+dy*c];}
/* un valor que sigue a su objetivo con suavidad (resorte amortiguado) */
function Resorte(k,d){this.x=0;this.v=0;this.t=0;this.k=k||60;this.d=d||12;}
/* en sub-pasos cortos para que los resortes rígidos (párpados) no se vuelvan inestables si un cuadro tarda */
Resorte.prototype.paso=function(dt){var n=Math.max(1,Math.ceil(dt*240)), h=dt/n; for(var i=0;i<n;i++){var a=this.k*(this.t-this.x)-this.d*this.v; this.v+=a*h; this.x+=this.v*h;} return this.x;};
function soporta(){try{var c=document.createElement("canvas"); return !!(window.WebGLRenderingContext&&(c.getContext("webgl")||c.getContext("experimental-webgl")));}catch(e){return false;}}

/* ---------- sombreadores ---------- */
var VS="attribute vec2 aPos;attribute vec2 aUV;varying vec2 vUV;uniform float uM;"+
  "void main(){vUV=aUV;gl_Position=vec4((aPos.x*2.0-1.0)*uM,(1.0-aPos.y*2.0)*uM,0.0,1.0);}";
var FS=[
"precision mediump float;",
"varying vec2 vUV;uniform sampler2D uTex;",
"uniform vec4 uOjo0;uniform vec4 uOjo1;uniform vec4 uEs0;uniform vec4 uEs1;uniform float uCurva;uniform float uNoche;",
"vec4 ojo(vec2 uv,vec4 o,vec4 e,vec4 base){",
"  vec2 l=(uv-o.xy)/o.zw; float r=length(l);",
"  if(r>1.4) return base;",
"  float dentro=1.0-smoothstep(1.0,1.38,r);",
/* la mirada: el iris se corre, el borde del ojo queda quieto */
"  float mov=1.0-smoothstep(0.3,0.72,r);",
"  vec4 c=texture2D(uTex,uv-e.yz*o.zw*0.2*mov);",
/* párpado de arriba: baja el pelaje de la frente */
"  float b=e.x; float bp=mix(-1.3,0.86,b);",
"  float borde=bp-uCurva*(1.0-l.x*l.x)*b;",
"  vec4 piel=texture2D(uTex,uv-vec2(0.0,(bp+1.3)*o.w*0.93));",
"  float tapa=smoothstep(borde+0.07,borde-0.07,l.y)*step(0.015,b);",
"  c=mix(c,piel,tapa);",
/* párpado de abajo: ojos felices */
"  float q=e.w; float bq=mix(1.3,0.12,q);",
"  float borde2=bq-0.35*(1.0-l.x*l.x)*q;",
"  vec4 piel2=texture2D(uTex,uv+vec2(0.0,(1.3-bq)*o.w*0.9));",
"  float tapa2=smoothstep(borde2-0.07,borde2+0.07,l.y)*step(0.015,q);",
"  c=mix(c,piel2,tapa2);",
/* pestañas: una línea fina en el borde del párpado */
"  float ancho=1.0-smoothstep(0.8,1.05,abs(l.x));",
"  float lin=(1.0-smoothstep(0.0,0.09,abs(l.y-borde)))*smoothstep(0.05,0.35,b)*ancho;",
"  float lin2=(1.0-smoothstep(0.0,0.08,abs(l.y-borde2)))*smoothstep(0.1,0.5,q)*ancho*(1.0-smoothstep(0.6,0.9,b));",
"  c.rgb=mix(c.rgb,vec3(0.25,0.16,0.19)*c.a,max(lin,lin2*0.8)*0.82);",
"  return mix(base,c,dentro);",
"}",
"void main(){",
"  vec4 c=texture2D(uTex,vUV);",
"  c=ojo(vUV,uOjo0,uEs0,c); c=ojo(vUV,uOjo1,uEs1,c);",
"  c.rgb*=mix(1.0,0.8,uNoche);",
"  gl_FragColor=c;",
"}"].join("\n");

var VS2="attribute vec2 aPos;attribute vec2 aUV;varying vec2 vUV;uniform float uM;void main(){vUV=aUV;gl_Position=vec4((aPos.x*2.0-1.0)*uM,(1.0-aPos.y*2.0)*uM,0.0,1.0);}";
var FS2="precision mediump float;varying vec2 vUV;uniform sampler2D uTex;uniform float uNoche;uniform float uBrillo;void main(){vec4 c=texture2D(uTex,vUV);c.rgb*=mix(1.0,0.8,uNoche);c.rgb+=c.a*uBrillo*vec3(0.08,0.06,0.1);gl_FragColor=c;}";

/* ---------- el ronroneo (WebAudio), suave y opcional ---------- */
var AC=null;
function mudo(){return !!(window.AxGranjaUI&&AxGranjaUI.mudo&&AxGranjaUI.mudo());}
function Ronroneo(){this.g=null;}
Ronroneo.prototype.on=function(v){
  if(mudo())v=0;
  try{
    if(!this.g){if(!v)return; if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==="suspended")AC.resume();
      var o=AC.createOscillator(), f=AC.createBiquadFilter(), g=AC.createGain(), lfo=AC.createOscillator(), lg=AC.createGain();
      o.type="sawtooth"; o.frequency.value=46; f.type="lowpass"; f.frequency.value=240; g.gain.value=0;
      lfo.frequency.value=24; lg.gain.value=0.5; lfo.connect(lg); lg.connect(g.gain);
      o.connect(f); f.connect(g); g.connect(AC.destination); o.start(); lfo.start(); this.g=g; this.o=o; this.l=lfo;}
    this.g.gain.setTargetAtTime(v?0.045:0,AC.currentTime,0.25);
  }catch(e){}
};
Ronroneo.prototype.fin=function(){try{if(this.o){this.g.gain.setTargetAtTime(0,AC.currentTime,0.1); var o=this.o,l=this.l; setTimeout(function(){try{o.stop();l.stop();}catch(e){}},400);}}catch(e){} this.g=null;};

/* ---------- una criatura viva ---------- */
var N=58, MARGEN=1/1.25;
function monta(host,c,op){
  op=op||{}; if(typeof c==="string")c=L.POR_ID[c];
  if(!host||!c||!(c.recorte||c.foto)||!soporta())return null;
  var cv=document.createElement("canvas"); cv.className="lp-gl"; cv.setAttribute("aria-hidden","true");
  var gl=cv.getContext("webgl",{premultipliedAlpha:true,alpha:true,antialias:true})||cv.getContext("experimental-webgl");
  if(!gl)return null;
  var R=rig(c), muerto=false, listo=false, raf=0;
  /* malla: posiciones de reposo, UV y pesos de cada hueso */
  var n=(N+1)*(N+1), rep=new Float32Array(n*2), pos=new Float32Array(n*2), uv=new Float32Array(n*2), W={};
  ["cab","ore0","ore1","cola","cuerpo","nariz","mej0","mej1","boca","pata0","pata1"].forEach(function(k){W[k]=new Float32Array(n);});
  var colaS=new Float32Array(n);
  for(var j=0,k=0;j<=N;j++)for(var i=0;i<=N;i++,k++){
    var x=i/N, y=j/N; rep[2*k]=x; rep[2*k+1]=y; uv[2*k]=x; uv[2*k+1]=y;
    var h=R.cabeza, dx=(x-h.c[0])/h.r[0], dy=(y-h.c[1])/(h.r[1]*(y<h.c[1]?1.4:1)), d=Math.sqrt(dx*dx+dy*dy); /* hacia arriba llega más lejos: cuernos y estrellas se mueven con la cabeza */
    var wc=1-ss(0.8,1.18,d);
    R.orejas.forEach(function(o,q){var ax=o.p[0]-o.b[0], ay=o.p[1]-o.b[1], L2=ax*ax+ay*ay, t=Math.max(0,Math.min(1.15,((x-o.b[0])*ax+(y-o.b[1])*ay)/L2));
      var px=o.b[0]+ax*Math.min(1,t), py=o.b[1]+ay*Math.min(1,t), dd=Math.sqrt((x-px)*(x-px)+(y-py)*(y-py)), w=(1-ss(o.r*0.7,o.r*1.4,dd))*ss(0,0.45,t);
      W["ore"+q][k]=w; wc=Math.max(wc,1-ss(o.r*0.8,o.r*1.5,dd)*1);});
    W.cab[k]=wc;
    /* la cola: cápsulas a lo largo de su línea central, con el grosor de cada tramo; el peso crece
       desde la unión (0) hasta la punta (1), así el cuerpo no se deforma */
    if(R.cola){var cc=R.cola, best=9, sBest=0, rBest=0, acum=0, tot=0, seg;
      for(seg=0;seg<cc.length-1;seg++)tot+=Math.sqrt(Math.pow(cc[seg+1][0]-cc[seg][0],2)+Math.pow(cc[seg+1][1]-cc[seg][1],2));
      for(seg=0;seg<cc.length-1;seg++){var ax2=cc[seg+1][0]-cc[seg][0], ay2=cc[seg+1][1]-cc[seg][1], l2=ax2*ax2+ay2*ay2, ll=Math.sqrt(l2), t2=Math.max(0,Math.min(1,((x-cc[seg][0])*ax2+(y-cc[seg][1])*ay2)/l2));
        var qx=cc[seg][0]+ax2*t2, qy=cc[seg][1]+ay2*t2, rr=cc[seg][2]+(cc[seg+1][2]-cc[seg][2])*t2, d2=Math.sqrt((x-qx)*(x-qx)+(y-qy)*(y-qy))/rr;
        if(d2<best){best=d2; sBest=(acum+ll*t2)/tot; rBest=rr;} acum+=ll;}
      W.cola[k]=(1-ss(0.95,1.3,best))*ss(0.0,0.35,sBest); colaS[k]=sBest;}
    /* el cuerpo respira desde el piso; las patitas quedan apoyadas */
    W.cuerpo[k]=ss(R.cuerpo.abajo,R.cuerpo.abajo-0.3,y);
    if(R.patas)R.patas.forEach(function(p,q){var ex=(x-p.c[0])/p.r, ey=(y-p.c[1])/p.r; W["pata"+q][k]=Math.exp(-(ex*ex+ey*ey)/1.6)*ss(-1.3,-0.2,ey);});
    var g=function(c2,rr){var ex=x-c2[0], ey=y-c2[1]; return Math.exp(-(ex*ex+ey*ey)/(2*rr*rr));};
    W.nariz[k]=g(R.nariz,0.022); W.boca[k]=g(R.boca,0.04);
    W.mej0[k]=g(R.mejillas[0],0.07); W.mej1[k]=g(R.mejillas[1],0.07);
  }
  var idx=[]; for(j=0;j<N;j++)for(i=0;i<N;i++){var a0=j*(N+1)+i, a1=a0+1, a2=a0+N+1, a3=a2+1; idx.push(a0,a2,a1,a1,a2,a3);}
  /* WebGL */
  function sh(t,s){var o=gl.createShader(t); gl.shaderSource(o,s); gl.compileShader(o); if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o)); return o;}
  var pr=gl.createProgram();
  try{gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS)); gl.linkProgram(pr); if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error("link");}
  catch(e){return null;}
  gl.useProgram(pr);
  var bPos=gl.createBuffer(), bUV=gl.createBuffer(), bI=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,bUV); gl.bufferData(gl.ARRAY_BUFFER,uv,gl.STATIC_DRAW);
  var aUV=gl.getAttribLocation(pr,"aUV"); gl.enableVertexAttribArray(aUV); gl.vertexAttribPointer(aUV,2,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,bPos); gl.bufferData(gl.ARRAY_BUFFER,pos,gl.DYNAMIC_DRAW);
  var aPos=gl.getAttribLocation(pr,"aPos"); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos,2,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,bI); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(idx),gl.STATIC_DRAW);
  var U={}; ["uTex","uM","uOjo0","uOjo1","uEs0","uEs1","uCurva","uNoche"].forEach(function(u){U[u]=gl.getUniformLocation(pr,u);});
  gl.uniform1f(U.uM,MARGEN);
  R.ojos.forEach(function(o,q){gl.uniform4f(U["uOjo"+q],o.c[0],o.c[1],o.r[0],o.r[1]);});
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA); gl.clearColor(0,0,0,0);
  /* las alas, si tiene */
  var ala=R.alas, pa=null, bAla=null, bAlaUV=null, texAla=null, alaLista=false, alaPos=new Float32Array(16);
  if(ala){try{pa=gl.createProgram(); gl.attachShader(pa,sh(gl.VERTEX_SHADER,VS2)); gl.attachShader(pa,sh(gl.FRAGMENT_SHADER,FS2)); gl.linkProgram(pa);
    bAla=gl.createBuffer(); bAlaUV=gl.createBuffer(); var u0=30/512;
    gl.bindBuffer(gl.ARRAY_BUFFER,bAlaUV); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,1,1, 0,0,1,0,0,1,1,1]),gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER,bAla); gl.bufferData(gl.ARRAY_BUFFER,alaPos,gl.DYNAMIC_DRAW);
    texAla=gl.createTexture(); var ia=new Image(); ia.onload=function(){if(muerto)return; gl.bindTexture(gl.TEXTURE_2D,texAla); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,ia); gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE); alaLista=true;}; ia.src=ala.img;
    gl.useProgram(pa); gl.uniform1f(gl.getUniformLocation(pa,"uM"),MARGEN); gl.useProgram(pr);}catch(e){ala=null;}}
  function alas(t,ab){
    /* cada ala es un rectángulo cuya raíz (borde izquierdo, al medio) está en el hombro; aletear = plegarla y girarla */
    var h=R.cabeza, y0=h.cuello[1]+ala.dy, cx=R.cuerpo.c[0], tam=ala.tam*(h.r[0]/(150/512)), u0=30/512;
    for(var q=0;q<2;q++){var s=q?-1:1, ax=cx+s*ala.dx, sx=0.8+0.2*Math.cos(ab), an=s*(-0.12+0.18*Math.sin(ab)), k=q*8;
      var esq=[[0,0],[1,0],[0,1],[1,1]];
      for(var e=0;e<4;e++){var lx=(esq[e][0]-u0)*tam*sx*s, ly=(esq[e][1]-0.5)*tam, c=Math.cos(an), sn=Math.sin(an);
        alaPos[k+2*e]=ax+lx*c-ly*sn; alaPos[k+2*e+1]=y0+lx*sn+ly*c;}}
    gl.useProgram(pa); gl.bindBuffer(gl.ARRAY_BUFFER,bAla); gl.bufferSubData(gl.ARRAY_BUFFER,0,alaPos);
    var ap=gl.getAttribLocation(pa,"aPos"), au=gl.getAttribLocation(pa,"aUV");
    gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap,2,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,bAlaUV); gl.enableVertexAttribArray(au); gl.vertexAttribPointer(au,2,gl.FLOAT,false,0,0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,texAla);
    gl.uniform1f(gl.getUniformLocation(pa,"uNoche"),op.noche?1:0); gl.uniform1f(gl.getUniformLocation(pa,"uBrillo"),0.5+0.5*Math.sin(t*2.3));
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4); gl.drawArrays(gl.TRIANGLE_STRIP,4,4);
    /* de vuelta al programa de la criatura */
    gl.useProgram(pr); gl.bindBuffer(gl.ARRAY_BUFFER,bUV); gl.vertexAttribPointer(aUV,2,gl.FLOAT,false,0,0); gl.bindBuffer(gl.ARRAY_BUFFER,bPos); gl.vertexAttribPointer(aPos,2,gl.FLOAT,false,0,0);
    gl.bindTexture(gl.TEXTURE_2D,tex);
  }
  var tex=gl.createTexture(), img=new Image();
  img.onload=function(){if(muerto)return; gl.bindTexture(gl.TEXTURE_2D,tex); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    var pot=(img.width&(img.width-1))===0&&(img.height&(img.height-1))===0;
    if(pot){gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);} else gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    listo=true; host.classList.add("gl-listo");};
  img.src=c.recorte||c.foto;
  host.appendChild(cv);

  /* ---------- el estado: resortes que siguen a sus objetivos ---------- */
  var S={cabA:new Resorte(40,10),cabX:new Resorte(40,10),cabY:new Resorte(40,10),mirX:new Resorte(160,22),mirY:new Resorte(160,22),
    ore0:new Resorte(260,14),ore1:new Resorte(260,14),parp:new Resorte(900,60),feliz:new Resorte(60,14),nariz:new Resorte(500,25),
    mej:new Resorte(380,18),boca:new Resorte(200,18),anda:new Resorte(30,11),paso:new Resorte(1,1),sonr:new Resorte(40,12),colaA:new Resorte(30,6),alas:new Resorte(90,8)};
  var gesto=op.gesto||"feliz", t0=performance.now(), prev=t0, sig={parp:t0+1500,ore:t0+3000,nariz:t0+2200,mira:t0+1200,bigote:t0+4000}, ext={mira:null,colaRapida:0,mastica:0,feliz:0};
  var caricias=[], ronr=new Ronroneo(), acariciando=0, finParp=0, doble=0, andando=false;
  var seg=[]; if(op.acc)Array.prototype.forEach.call(op.acc,function(el){seg.push(el);});
  function azar(a,b){return a+Math.random()*(b-a);}
  function cuadro(ahora){
    if(muerto)return;
    if(!cv.isConnected){destruye(); return;}
    raf=requestAnimationFrame(cuadro);
    if(document.hidden||!listo)return;
    var dt=Math.min(0.05,(ahora-prev)/1000); prev=ahora; var t=(ahora-t0)/1000;
    var duerme=gesto==="duerme", come=gesto==="come"||ahora<ext.mastica, feliz=acariciando>0||ahora<ext.feliz||gesto==="feliz2";
    /* parpadeo natural (a veces doble); dormida o acariciada, ojos cerrados */
    if(ahora>=sig.parp){finParp=ahora+110; sig.parp=ahora+azar(2200,5600); if(Math.random()<0.2)doble=ahora+270;}
    if(doble&&ahora>=doble){finParp=ahora+100; doble=0;}
    S.parp.t=(duerme||acariciando>0.5||ahora<finParp)?1:0;
    S.feliz.t=duerme?0.32:(feliz?0.75:(come?0.5:(S.parp.t?0.2:0)));
    /* hacia dónde mira: el dedo o un punto al azar de vez en cuando */
    if(ext.mira){S.mirX.t=ext.mira[0]; S.mirY.t=ext.mira[1];}
    else if(ahora>=sig.mira){S.mirX.t=Math.random()<0.4?0:azar(-0.8,0.8); S.mirY.t=azar(-0.3,0.4); sig.mira=ahora+azar(1200,3200);}
    if(duerme){S.mirX.t=0; S.mirY.t=0.2;}
    /* la cabeza: deriva suave, sigue la mirada, se apoya en la mano que acaricia */
    var lean=0; caricias.forEach(function(q){lean+=(q.x-R.cabeza.c[0])*q.f;});
    S.cabA.t=(duerme?0.06*Math.sin(t*0.9):0.035*Math.sin(t*0.7)+0.02*Math.sin(t*1.9))+S.mirX.x*0.07+Math.max(-0.18,Math.min(0.18,lean*1.2))+(ahora<ext.feliz?0.12*Math.sin(t*9):0);
    S.cabX.t=S.mirX.x*0.012; S.cabY.t=(duerme?0.012+0.008*Math.sin(t*0.9):0.004*Math.sin(t*1.3))+S.mirY.x*0.01+(come?0.01*Math.abs(Math.sin(t*9)):0);
    /* orejas: se sacuden de vez en cuando */
    if(ahora>=sig.ore){var q=Math.random()<0.5?0:1; S["ore"+q].v+=(q?1:-1)*azar(5,9); if(Math.random()<0.35)S["ore"+(1-q)].v+=(q?-1:1)*azar(4,7); sig.ore=ahora+azar(2500,7000);}
    S.ore0.t=duerme?0.06:0; S.ore1.t=duerme?-0.06:0;
    /* nariz y bigotes */
    if(ahora>=sig.nariz&&!duerme){S.nariz.v+=azar(2.5,4); sig.nariz=ahora+azar(1800,5000);}
    if(ahora>=sig.bigote&&!duerme){S.mej.v+=azar(3,5); sig.bigote=ahora+azar(2500,6000);}
    S.boca.t=come?(Math.sin(t*9)>0?1:0):0;
    /* cola: vaivén lento, o meneo rápido */
    var rap=ahora<ext.colaRapida; S.colaA.t=duerme?0.05*Math.sin(t*0.6):(rap?0.35*Math.sin(t*14):0.16*Math.sin(t*1.7)+0.06*Math.sin(t*0.6));
    if(rap){S.colaA.k=400; S.colaA.d=18;} else {S.colaA.k=30; S.colaA.d=6;}
    S.alas.t=R.alas?(duerme?0.02:0.12*Math.sin(t*(c.rasgo==="hada"?7:3.2))):0;
    S.anda.t=andando?1:0; S.sonr.t=duerme?0:(feliz?1:(come?0.3:0.35));
    for(var kk in S)if(kk!=="paso")S[kk].paso(dt);
    S.paso.x+=dt*9.5*S.anda.x;
    /* caricias que se van soltando */
    for(var ci=caricias.length-1;ci>=0;ci--){caricias[ci].f*=Math.pow(0.12,dt); if(caricias[ci].f<0.01)caricias.splice(ci,1);}
    acariciando=Math.max(0,acariciando-dt*0.8);
    if(acariciando<=0.05)ronr.on(false);
    deforma(t,duerme);
    /* los accesorios de la cabeza (corona, gafas…) la siguen */
    if(seg.length){var hw=host.clientWidth, hh=host.clientHeight, cu=R.cabeza.cuello;
      seg.forEach(function(el){var ax=el.offsetLeft/hw, ay=el.offsetTop/hh, q=rot(ax,ay,cu[0],cu[1],S.cabA.x);
        el.style.translate=((q[0]-ax+S.cabX.x)*hw).toFixed(1)+"px "+((q[1]-ay+S.cabY.x)*hh).toFixed(1)+"px"; el.style.rotate=S.cabA.x.toFixed(3)+"rad";});}
    var w=cv.width, hgt=cv.height; gl.viewport(0,0,w,hgt); gl.clear(gl.COLOR_BUFFER_BIT);
    if(ala&&alaLista)alas(t,duerme?0.4:t*(c.rasgo==="hada"?7.5:3.4)+S.alas.x);
    gl.bindBuffer(gl.ARRAY_BUFFER,bPos); gl.bufferSubData(gl.ARRAY_BUFFER,0,pos);
    var p=Math.max(0,Math.min(1,S.parp.x)), fz=Math.max(0,Math.min(1,S.feliz.x));
    gl.uniform4f(U.uEs0,p,S.mirX.x,S.mirY.x,fz); gl.uniform4f(U.uEs1,p,S.mirX.x,S.mirY.x,fz);
    gl.uniform1f(U.uCurva,duerme?-0.16:(fz>0.3?0.3:0.12)); gl.uniform1f(U.uNoche,op.noche?1:0);
    gl.drawElements(gl.TRIANGLES,idx.length,gl.UNSIGNED_SHORT,0);
  }
  function deforma(t,duerme){
    var h=R.cabeza, cu=h.cuello, ang=S.cabA.x, tx=S.cabX.x, ty=S.cabY.x, resp=(duerme?0.022:0.014)*Math.sin(t*(duerme?1.4:2.1));
    var bx=R.cuerpo.c[0], by=R.cuerpo.abajo, cola=R.cola?R.cola[0]:null, fase=S.paso.x, pie=[Math.max(0,Math.sin(fase))*S.anda.x,Math.max(0,Math.sin(fase+Math.PI))*S.anda.x], bote=Math.abs(Math.sin(fase))*S.anda.x, son=S.sonr.x, ore=[S.ore0.x,S.ore1.x], na=S.nariz.x, mj=S.mej.x, bo=S.boca.x, ca=S.colaA.x, al=S.alas.x;
    for(var k=0;k<n;k++){
      var x=rep[2*k], y=rep[2*k+1], q, w;
      /* orejas */
      for(var o=0;o<2;o++){w=W["ore"+o][k]; if(w>0.001){var b=R.orejas[o].b; q=rot(x,y,b[0],b[1],ore[o]*w); x=q[0]; y=q[1];}}
      /* hocico: la nariz sube un poquito, los bigotes tiemblan, la boca mastica */
      y-=W.nariz[k]*na*0.004; y-=(W.mej0[k]+W.mej1[k])*mj*0.003; x+=(W.mej1[k]-W.mej0[k])*mj*0.002; y+=W.boca[k]*bo*0.006;
      /* cabeza */
      w=W.cab[k]; if(w>0.001){q=rot(x,y,cu[0],cu[1],ang*w); x=q[0]+tx*w; y=q[1]+ty*w;}
      /* cola: una onda que crece hacia la punta */
      /* sonrisa: las mejillas y las comisuras suben */
      y-=(W.mej0[k]+W.mej1[k])*son*0.007;
      w=cola?W.cola[k]:0; if(w>0.001){var s=colaS[k]; q=rot(x,y,cola[0],cola[1],ca*w*(0.35+s)+0.05*Math.sin(t*3.1-s*4)*w*s); x=q[0]; y=q[1];}
      /* caminar: cada pata se levanta por turno y el cuerpo sube un poquito */
      var wp0=W.pata0[k], wp1=W.pata1[k], wb=1-Math.max(wp0,wp1);
      if(S.anda.x>0.01){y-=(wp0*pie[0]+wp1*pie[1])*0.04; x+=(wp0*pie[0]-wp1*pie[1])*0.006; y-=wb*bote*0.014;}
      /* respirar */
      w=W.cuerpo[k]; x+=(x-bx)*resp*0.45*w; y-=(by-y)*resp*w;
      /* caricias: el pelo se va con el dedo */
      for(var ci=0;ci<caricias.length;ci++){var cc=caricias[ci], ex=x-cc.x, ey=y-cc.y, g=Math.exp(-(ex*ex+ey*ey)/(2*0.085*0.085))*cc.f; x+=cc.vx*g; y+=cc.vy*g;}
      pos[2*k]=x; pos[2*k+1]=y;
    }
  }
  function tam(){var r=host.getBoundingClientRect(), dpr=Math.min(2,window.devicePixelRatio||1), s=Math.max(64,Math.round(Math.max(r.width,r.height)*1.25*dpr)); s=Math.min(s,1200); if(cv.width!==s){cv.width=s; cv.height=s;}}
  tam(); var ro=window.ResizeObserver?new ResizeObserver(tam):null; if(ro)ro.observe(host);
  raf=requestAnimationFrame(cuadro);
  function destruye(){if(muerto)return; muerto=true; cancelAnimationFrame(raf); if(ro)ro.disconnect(); ronr.fin();
    try{var ext2=gl.getExtension("WEBGL_lose_context"); if(ext2)ext2.loseContext();}catch(e){} if(cv.parentNode)cv.parentNode.removeChild(cv); host.classList.remove("gl-listo");}
  var ahora=function(){return performance.now();};
  return {
    accion:function(a){var tt=ahora();
      if(a==="mira"){ext.mira=[-0.9,0.1]; setTimeout(function(){ext.mira=null;},1600);}
      else if(a==="mira2"){ext.mira=[0.9,0.1]; setTimeout(function(){ext.mira=null;},1600);}
      else if(a==="orejas"){S.ore0.v-=9; S.ore1.v+=9; setTimeout(function(){S.ore0.v-=7; S.ore1.v+=7;},260);}
      else if(a==="cola")ext.colaRapida=tt+1500;
      else if(a==="feliz"){ext.feliz=tt+900; ext.colaRapida=tt+900;}
      else if(a==="nariz"){S.nariz.v+=5; S.mej.v+=5;}
      else if(a==="come")ext.mastica=tt+1800;
      else if(a==="parpadea")finParp=tt+120;},
    gesto:function(g){gesto=g||"feliz";},
    camina:function(v){andando=!!v;},
    mira:function(dx,dy){ext.mira=dx==null?null:[Math.max(-1,Math.min(1,dx)),Math.max(-1,Math.min(1,dy||0))];},
    /* x, y: punto en la foto (0–1); vx, vy: cuánto se movió el dedo */
    caricia:function(x,y,vx,vy){var m=Math.sqrt(vx*vx+vy*vy); if(m>0.06){vx*=0.06/m; vy*=0.06/m;}
      caricias.push({x:x,y:y,vx:vx*0.42,vy:vy*0.42,f:1}); if(caricias.length>14)caricias.shift();
      acariciando=Math.min(1.5,acariciando+0.25); if(acariciando>0.6)ronr.on(true);},
    suelta:function(){ronr.on(false);},
    destruye:destruye,
    _estado:function(){return {listo:listo,parp:S.parp.x,feliz:S.feliz.x,cab:S.cabA.x,cola:S.colaA.x,acariciando:acariciando};}
  };
}

window.AxLuminaVivo={soporta:soporta,monta:monta,rig:rig};
})();
