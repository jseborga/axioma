/* ===========================================================
   Ciudad Saber · la ciudad en 3D (WebGL con three.js)
   -----------------------------------------------------------
   Dibuja el terreno, el agua, los árboles, las calles y los
   edificios como objetos 3D con luz del sol que se mueve,
   sombras, reflejos y ventanas que se encienden de noche.
   La cámara es ortográfica y mira con el mismo ángulo que la
   vista isométrica: un punto del mundo cae en el mismo píxel
   que en el dibujo 2D, así que tocar casillas, nombres, capas
   y avisos siguen funcionando igual (van en el lienzo 2D, que
   queda encima y transparente).
   Se carga solo al entrar a la ciudad (vendor/three.min.js).
   =========================================================== */
(function(){
"use strict";
var T=null;
/* la proyección isométrica del 2D: casilla (x,y) → ((x−y)·16, (x+y)·8), y cada nivel de relieve sube 5 px */
var HW=16, HH=8, ALT=5, CH=16;
var S=Math.SQRT2*HW;                 /* px de pantalla (a zoom 1) por unidad del mundo, en horizontal */
var PXY=Math.sqrt(S*S-2*HH*HH);      /* px por unidad de altura: ≈ 19,6 */
var LV=ALT/PXY;                      /* altura de un nivel del relieve, en unidades del mundo */
var PX=1/PXY;                        /* un «píxel de altura» del dibujo 2D, en unidades del mundo */
var WY=0.1;                          /* el nivel del agua */
var DIST=600;                        /* la cámara está lejos, mirando hacia abajo a 30° */

function hs(x,y,k){var h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(k|0,1442695041);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
function ruido(x,y,esc,sd){ var gx=Math.floor(x/esc), gy=Math.floor(y/esc), fx=x/esc-gx, fy=y/esc-gy;
  fx=fx*fx*(3-2*fx); fy=fy*fy*(3-2*fy);
  var a=hs(gx,gy,sd), b=hs(gx+1,gy,sd), c=hs(gx,gy+1,sd), d=hs(gx+1,gy+1,sd);
  return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy; }
function elige(a,n){return a[Math.floor(n*a.length)%a.length];}

/* ---------- cargar three.js cuando hace falta ---------- */
var cargando=null;
function carga(){
  if(window.THREE){T=window.THREE; return Promise.resolve(T);}
  if(cargando)return cargando;
  cargando=new Promise(function(ok,mal){
    var sc=document.createElement("script"); sc.src="vendor/three.min.js"; sc.async=true;
    sc.onload=function(){ if(window.THREE){T=window.THREE; ok(T);} else {cargando=null; mal(new Error("three"));} };
    sc.onerror=function(){cargando=null; mal(new Error("three"));};
    document.head.appendChild(sc);
  });
  return cargando;
}
function soporta(){
  try{var c=document.createElement("canvas"); return !!(window.WebGLRenderingContext&&(c.getContext("webgl2")||c.getContext("webgl")));}catch(e){return false;}
}

/* ---------- colores (en espacio lineal, como los quiere el render) ---------- */
var COL={};
function lin(hex){var c=COL[hex]; if(c)return c; var k=new T.Color(hex); return (COL[hex]=[k.r,k.g,k.b]);}
function mezclaL(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function escalaL(a,f){return [a[0]*f,a[1]*f,a[2]*f];}

/* ---------- texturas hechas a mano en un lienzo ---------- */
function lienzo(w,h,fn){var c=document.createElement("canvas"); c.width=w; c.height=h; fn(c.getContext("2d"),w,h); return c;}
function azar(sd){var a=sd>>>0||1; return function(){a=(Math.imul(a,1664525)+1013904223)>>>0; return a/4294967296;};}
var ANISO=4;
function tex(c,color){var t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.anisotropy=ANISO; if(color)t.colorSpace=T.SRGBColorSpace; return t;}
function grano(g,w,h,r,n,a,b){ for(var i=0;i<n;i++){var v=a+(b-a)*r(); g.fillStyle="rgba("+v+","+v+","+v+",0.35)"; g.fillRect(r()*w,r()*h,1+r()*2,1+r()*2);} }
/* una fachada de 2×2 unidades: «filas» pisos y «cols» ventanas por unidad; devuelve color, rugosidad (vidrio liso) y ventanas encendidas */
function fachada(tipo,sd){
  var N=512, r=azar(sd), filas, cols, out={};
  var pisos={estuco:[4,4],ladrillo:[4,3],piedra:[3,2],madera:[3,1],oficina:[4,1],cristal:[4,6],metal:[0,0]}[tipo];
  filas=pisos[0]*2; cols=pisos[1]*2;
  var cw=N/Math.max(1,cols), ch=N/Math.max(1,filas), ven=[];
  out.map=lienzo(N,N,function(g){
    if(tipo==="ladrillo"){ g.fillStyle="#e9e4dc"; g.fillRect(0,0,N,N);
      for(var y=0;y<N;y+=10)for(var x=-((y/10)%2)*11;x<N;x+=22){var v=170+r()*40|0; g.fillStyle="rgb("+v+","+(v-6)+","+(v-10)+")"; g.fillRect(x+1,y+1,20,8);} }
    else if(tipo==="piedra"){ g.fillStyle="#cfcac0"; g.fillRect(0,0,N,N);
      for(var y2=0;y2<N;y2+=24)for(var x2=-r()*30;x2<N;){var ww=28+r()*34, v2=190+r()*45|0; g.fillStyle="rgb("+v2+","+(v2-3)+","+(v2-8)+")"; g.fillRect(x2+1.5,y2+1.5,ww-3,21); x2+=ww;} }
    else if(tipo==="madera"){ g.fillStyle="#d8d0c4"; g.fillRect(0,0,N,N);
      for(var x3=0;x3<N;x3+=16){var v3=185+r()*50|0; g.fillStyle="rgb("+v3+","+(v3-8)+","+(v3-18)+")"; g.fillRect(x3+1,0,14,N);} }
    else if(tipo==="metal"){ for(var x4=0;x4<N;x4+=8){var v4=200+((x4/8)%2?20:0); g.fillStyle="rgb("+v4+","+v4+","+v4+")"; g.fillRect(x4,0,8,N);} }
    else if(tipo==="cristal"){ g.fillStyle="#9fb4c8"; g.fillRect(0,0,N,N); }
    else { g.fillStyle=tipo==="oficina"?"#dcdcdc":"#ececec"; g.fillRect(0,0,N,N); grano(g,N,N,r,2500,190,255); }
    for(var f=0;f<filas;f++)for(var c=0;c<cols;c++){
      var x0=c*cw, y0=N-(f+1)*ch, wx, wy, ww2, wh;
      if(tipo==="oficina"){ wx=x0+4; ww2=cw-8; wy=y0+ch*0.22; wh=ch*0.5; }
      else if(tipo==="cristal"){ wx=x0+2; ww2=cw-4; wy=y0+3; wh=ch-6; }
      else if(tipo==="piedra"){ wx=x0+cw*0.32; ww2=cw*0.36; wy=y0+ch*0.25; wh=ch*0.5; }
      else if(tipo==="madera"){ wx=x0+cw*0.35; ww2=cw*0.3; wy=y0+ch*0.3; wh=ch*0.35; }
      else { wx=x0+cw*0.26; ww2=cw*0.48; wy=y0+ch*0.2; wh=ch*0.56; }
      if(tipo==="metal")continue;
      /* el vidrio: oscuro abajo, con el cielo reflejado arriba */
      var gl=g.createLinearGradient(0,wy,0,wy+wh); gl.addColorStop(0,tipo==="cristal"?"#c9dcec":"#8fa9c2"); gl.addColorStop(0.45,tipo==="cristal"?"#5f7f9f":"#3c536b"); gl.addColorStop(1,tipo==="cristal"?"#3e5c7a":"#26384a");
      if(tipo!=="cristal"&&tipo!=="oficina"){ g.fillStyle="rgba(255,255,255,.75)"; g.fillRect(wx-3,wy-3,ww2+6,wh+6); g.fillStyle="rgba(0,0,0,.18)"; g.fillRect(wx-4,wy+wh+3,ww2+8,4); }
      if(tipo==="piedra"){ g.beginPath(); g.moveTo(wx,wy+wh); g.lineTo(wx,wy+ww2/2); g.arc(wx+ww2/2,wy+ww2/2,ww2/2,Math.PI,0); g.lineTo(wx+ww2,wy+wh); g.closePath(); g.fillStyle=gl; g.fill(); }
      else { g.fillStyle=gl; g.fillRect(wx,wy,ww2,wh); }
      if(tipo==="estuco"||tipo==="ladrillo"){ g.fillStyle="rgba(255,255,255,.8)"; g.fillRect(wx+ww2/2-1,wy,2,wh); g.fillRect(wx,wy+wh*0.42,ww2,2); }
      if(tipo==="cristal"){ g.fillStyle="#56697c"; g.fillRect(x0,y0,cw,2); g.fillRect(x0,y0,2,ch); }
      ven.push([wx,wy,ww2,wh,f,c]);
    }
    if(tipo==="oficina"||tipo==="estuco")for(var f2=0;f2<filas;f2++){g.fillStyle="rgba(0,0,0,.07)"; g.fillRect(0,N-f2*ch-3,N,3);}
  });
  /* rugosidad (canal verde): las paredes mate, el vidrio liso para que refleje el cielo */
  out.rug=lienzo(N,N,function(g){ g.fillStyle=tipo==="cristal"?"rgb(40,40,40)":tipo==="metal"?"rgb(120,120,120)":"rgb(235,235,235)"; g.fillRect(0,0,N,N);
    g.fillStyle="rgb(45,45,45)"; ven.forEach(function(v){g.fillRect(v[0],v[1],v[2],v[3]);}); });
  /* de noche: algunas ventanas encendidas, con luces de distinto tono */
  var r2=azar(sd*7+3);
  out.luz=lienzo(N,N,function(g){ g.fillStyle="#000"; g.fillRect(0,0,N,N);
    ven.forEach(function(v){ if(r2()<(tipo==="cristal"?0.45:0.55)){ var k=r2(); g.fillStyle=k<0.6?"#ffd58a":k<0.85?"#fff0c8":"#bfe3ff"; g.fillRect(v[0]+1,v[1]+1,v[2]-2,v[3]-2);} }); });
  return out;
}
function texTeja(){ return lienzo(256,256,function(g){ var r=azar(7); g.fillStyle="#d8d8d8"; g.fillRect(0,0,256,256);
  for(var y=0;y<256;y+=21)for(var x=-((y/21)%2)*16;x<256;x+=32){var v=175+r()*60|0; var gg=g.createLinearGradient(0,y,0,y+21); gg.addColorStop(0,"rgb("+(v+30)+","+(v+30)+","+(v+30)+")"); gg.addColorStop(1,"rgb("+(v-35)+","+(v-35)+","+(v-35)+")"); g.fillStyle=gg; g.fillRect(x+1,y,30,20);} }); }
function texRuido(base,var_,n,sd,trazos){ return lienzo(256,256,function(g){ var r=azar(sd); g.fillStyle=base; g.fillRect(0,0,256,256); grano(g,256,256,r,n,255-var_,255);
  if(trazos)for(var i=0;i<trazos;i++){var v=200+r()*55|0; g.strokeStyle="rgba("+v+","+v+","+v+",0.5)"; g.lineWidth=1; var x=r()*256,y=r()*256; g.beginPath(); g.moveTo(x,y); g.lineTo(x+r()*3-1.5,y-4-r()*5); g.stroke();} }); }
function texAdoquin(){ return lienzo(256,256,function(g){ var r=azar(11); g.fillStyle="#9c9c9c"; g.fillRect(0,0,256,256);
  for(var y=0;y<256;y+=16)for(var x=-((y/16)%2)*10;x<256;x+=20){var v=170+r()*60|0; g.fillStyle="rgb("+v+","+v+","+v+")"; g.beginPath(); if(g.roundRect)g.roundRect(x+1.5,y+1.5,17,13,4); else g.rect(x+1.5,y+1.5,17,13); g.fill();} }); }
function texAcera(){ return lienzo(128,128,function(g){ var r=azar(13); g.fillStyle="#e2e2e2"; g.fillRect(0,0,128,128); grano(g,128,128,r,600,200,255);
  g.strokeStyle="rgba(0,0,0,.12)"; g.lineWidth=2; for(var i=0;i<=128;i+=32){g.beginPath(); g.moveTo(i,0); g.lineTo(i,128); g.moveTo(0,i); g.lineTo(128,i); g.stroke();} }); }
function texSolar(){ return lienzo(128,128,function(g){ g.fillStyle="#c9d3de"; g.fillRect(0,0,128,128);
  for(var y=0;y<128;y+=16)for(var x=0;x<128;x+=16){var gg=g.createLinearGradient(x,y,x+16,y+16); gg.addColorStop(0,"#3a5f9a"); gg.addColorStop(1,"#14284d"); g.fillStyle=gg; g.fillRect(x+1,y+1,14,14);} }); }
function texPluma(){ return lienzo(64,64,function(g){ var gg=g.createRadialGradient(32,32,2,32,32,31); gg.addColorStop(0,"rgba(255,255,255,1)"); gg.addColorStop(0.45,"rgba(255,255,255,.55)"); gg.addColorStop(1,"rgba(255,255,255,0)"); g.fillStyle=gg; g.fillRect(0,0,64,64); }); }
/* olas: un mapa de normales que se repite, hecho con ondas suaves */
function texOlas(){ var N=128; return lienzo(N,N,function(g){ var img=g.createImageData(N,N), d=img.data;
  for(var y=0;y<N;y++)for(var x=0;x<N;x++){ var a=2*Math.PI/N;
    var dx=0.5*Math.cos(x*a*2+y*a)+0.3*Math.cos(x*a*5-y*a*3)+0.2*Math.cos(x*a*1-y*a*4), dy=0.5*Math.cos(y*a*3+x*a)+0.3*Math.cos(y*a*4+x*a*2)+0.2*Math.cos(x*a*3+y*a*5);
    var k=(y*N+x)*4; d[k]=128+dx*55; d[k+1]=128+dy*55; d[k+2]=255; d[k+3]=255; }
  g.putImageData(img,0,0); }); }

/* ---------- materiales ---------- */
var ESC={estuco:2,ladrillo:2,piedra:2,madera:2,oficina:2,cristal:2,metal:1,teja:0.7,plano:1,cesped:1,asfalto:1.5,adoquin:1.2,tierra:1.5,acera:1,solar:0.5,cimiento:2,terreno:2.5};
function materiales(r){
  var M={}, F={}, std=function(o){return new T.MeshStandardMaterial(o);};
  ["estuco","ladrillo","piedra","madera","oficina","cristal","metal"].forEach(function(k,i){
    var f=fachada(k,31+i*17); F[k]=f;
    var o={map:tex(f.map,true),roughnessMap:tex(f.rug),roughness:1,metalness:k==="cristal"?0.35:k==="metal"?0.45:0,vertexColors:true,emissive:0xffffff,emissiveIntensity:0};
    if(k!=="metal")o.emissiveMap=tex(f.luz,true);
    else o.emissive=0x000000;
    M[k]=std(o);
  });
  M.cristal.envMapIntensity=1.6;
  M._env=0.45;   /* la luz del cielo sobre lo mate: suave, para que se noten las sombras */
  M.teja=std({map:tex(texTeja(),true),roughness:0.8,vertexColors:true});
  M.plano=std({map:tex(texRuido("#cfcfcf",60,4000,5),true),roughness:0.95,vertexColors:true});
  M.cesped=std({map:tex(texRuido("#d6d6d6",70,1500,9,900),true),roughness:1,vertexColors:true});
  M.cimiento=std({map:tex(texRuido("#c8c0b0",70,3000,51),true),roughness:1,vertexColors:true});
  M.solido=std({roughness:0.7,vertexColors:true});
  M.hoja=std({roughness:0.85,vertexColors:true});
  M.brillo=std({roughness:0.28,metalness:0.9,vertexColors:true});
  M.luz=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  M.piscina=std({color:0x48c6ef,roughness:0.05,metalness:0.1});
  M.solar=std({map:tex(texSolar(),true),roughness:0.22,metalness:0.6});
  var deco={polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4};
  function decal(o){for(var k in deco)o[k]=deco[k]; return std(o);}
  M.asfalto=decal({map:tex(texRuido("#c4c4c4",80,6000,21),true),roughness:0.92,vertexColors:true});
  M.adoquin=decal({map:tex(texAdoquin(),true),roughness:0.9,vertexColors:true});
  M.tierra=decal({map:tex(texRuido("#d0d0d0",70,3000,23),true),roughness:1,vertexColors:true});
  M.acera=decal({map:tex(texAcera(),true),roughness:0.9,vertexColors:true});
  M.marca=decal({roughness:0.6,vertexColors:true});
  M.lote=decal({roughness:1,vertexColors:true});
  M.marcaLuz=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-6});
  M.terreno=std({map:tex(texRuido("#dedede",60,5000,41,1400),true),roughness:0.97,vertexColors:true});
  var olas=tex(texOlas()); olas.repeat.set(4,4);
  M.agua=std({color:0x1d5f9e,roughness:0.07,metalness:0.05,normalMap:olas,normalScale:new T.Vector2(0.35,0.35),envMapIntensity:1.3});
  M.cable=new T.LineBasicMaterial({color:0x2b2b2b});
  M._fachadas=["estuco","ladrillo","piedra","madera","oficina","cristal"];
  Object.keys(M).forEach(function(k){var m=M[k]; if(m&&m.isMeshStandardMaterial&&k!=="cristal"&&k!=="agua"&&k!=="brillo")m.envMapIntensity=M._env;});
  return M;
}

/* ---------- lotes de geometría: todo lo de un trozo con el mismo material va junto (pocas llamadas de dibujo) ---------- */
function Lotes(){this.m={};}
Lotes.prototype.de=function(k){return this.m[k]||(this.m[k]={p:[],n:[],u:[],c:[]});};
function nrm(a,b,c){var ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
  var x=uy*vz-uz*vy, y=uz*vx-ux*vz, z=ux*vy-uy*vx, l=Math.sqrt(x*x+y*y+z*z)||1; return [x/l,y/l,z/l];}
function v3(L,k,p,n,u,c){var b=L.de(k); b.p.push(p[0],p[1],p[2]); b.n.push(n[0],n[1],n[2]); b.u.push(u[0],u[1]); b.c.push(c[0],c[1],c[2]);}
function tri(L,k,a,b,c,ua,ub,uc,col,out){
  var n=nrm(a,b,c);
  if(out&&n[0]*out[0]+n[1]*out[1]+n[2]*out[2]<0){var t=b;b=c;c=t; t=ub;ub=uc;uc=t; n=[-n[0],-n[1],-n[2]];}
  v3(L,k,a,n,ua,col); v3(L,k,b,n,ub,col); v3(L,k,c,n,uc,col);
}
function quad(L,k,a,b,c,d,ua,ub,uc,ud,col,out){ tri(L,k,a,b,c,ua,ub,uc,col,out); tri(L,k,a,c,d,ua,uc,ud,col,out); }
/* una pared vertical de p0 a p1 (x,z), de y0 a y1; las ventanas se alinean desde vb */
/* con colores por vértice: para la sombra de contacto al pie de las paredes */
function triC(L,k,a,b,c,ua,ub,uc,ca,cb,cc,out){
  var n=nrm(a,b,c);
  if(out&&n[0]*out[0]+n[1]*out[1]+n[2]*out[2]<0){var t=b;b=c;c=t; t=ub;ub=uc;uc=t; t=cb;cb=cc;cc=t; n=[-n[0],-n[1],-n[2]];}
  v3(L,k,a,n,ua,ca); v3(L,k,b,n,ub,cb); v3(L,k,c,n,uc,cc);
}
function pared(L,k,x0,z0,x1,z1,y0,y1,col,uo,vb,out){
  var e=ESC[k]||1, len=Math.sqrt((x1-x0)*(x1-x0)+(z1-z0)*(z1-z0));
  var tramo=function(ya,yb2,ca,cb){ var a=[x0,ya,z0], b=[x1,ya,z1], c=[x1,yb2,z1], d=[x0,yb2,z0], ua=[uo/e,(ya-vb)/e], ub=[(uo+len)/e,(ya-vb)/e], uc=[(uo+len)/e,(yb2-vb)/e], ud=[uo/e,(yb2-vb)/e];
    triC(L,k,a,b,c,ua,ub,uc,ca,ca,cb,out); triC(L,k,a,c,d,ua,uc,ud,ca,cb,cb,out); };
  /* abajo, una franja más oscura que se aclara: la sombra de contacto con el suelo */
  var ao=Math.min(0.22,(y1-y0)*0.45), oscuro=escalaL(col,0.62);
  if(ao>0.02){ tramo(y0,y0+ao,oscuro,col); if(y1>y0+ao)tramo(y0+ao,y1,col,col); }
  else tramo(y0,y1,col,col);
}
function techo(L,k,x0,z0,x1,z1,y,col){
  var e=ESC[k]||1; quad(L,k,[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1],[x0/e,z0/e],[x1/e,z0/e],[x1/e,z1/e],[x0/e,z1/e],col,[0,1,0]);
}
function caja(L,k,kt,cx,cz,w,d,y0,h,col,colT,uo,vb){
  var x0=cx-w/2,x1=cx+w/2,z0=cz-d/2,z1=cz+d/2,y1=y0+h;
  pared(L,k,x1,z0,x1,z1,y0,y1,col,uo,vb,[1,0,0]);
  pared(L,k,x0,z1,x1,z1,y0,y1,col,uo+0.37,vb,[0,0,1]);
  pared(L,k,x0,z0,x0,z1,y0,y1,col,uo+0.71,vb,[-1,0,0]);
  pared(L,k,x0,z0,x1,z0,y0,y1,col,uo+0.13,vb,[0,0,-1]);
  if(kt)techo(L,kt,x0,z0,x1,z1,y1,colT||col);
}
/* tejado a dos aguas (cumbrera a lo largo del lado más largo) con sus hastiales de pared */
function dosAguas(L,k,kp,cx,cz,w,d,y0,h,col,colP,uo,vb){
  var e=0.05, x0=cx-w/2,x1=cx+w/2,z0=cz-d/2,z1=cz+d/2,yt=y0+h, ee=ESC[k]||1;
  if(w>=d){ var zm=cz, sl=Math.sqrt(h*h+d*d/4)/ee;
    quad(L,k,[x0-e,y0-0.01,z1+e],[x1+e,y0-0.01,z1+e],[x1+e,yt,zm],[x0-e,yt,zm],[0,0],[w/ee,0],[w/ee,sl],[0,sl],col,[0,1,1]);
    quad(L,k,[x0-e,y0-0.01,z0-e],[x1+e,y0-0.01,z0-e],[x1+e,yt,zm],[x0-e,yt,zm],[0,0],[w/ee,0],[w/ee,sl],[0,sl],col,[0,1,-1]);
    var ep=ESC[kp]||1;
    tri(L,kp,[x0,y0,z0],[x0,y0,z1],[x0,yt,zm],[uo/ep,(y0-vb)/ep],[(uo+d)/ep,(y0-vb)/ep],[(uo+d/2)/ep,(yt-vb)/ep],colP,[-1,0,0]);
    tri(L,kp,[x1,y0,z0],[x1,y0,z1],[x1,yt,zm],[uo/ep,(y0-vb)/ep],[(uo+d)/ep,(y0-vb)/ep],[(uo+d/2)/ep,(yt-vb)/ep],colP,[1,0,0]);
  } else { var xm=cx, sl2=Math.sqrt(h*h+w*w/4)/ee;
    quad(L,k,[x1+e,y0-0.01,z0-e],[x1+e,y0-0.01,z1+e],[xm,yt,z1+e],[xm,yt,z0-e],[0,0],[d/ee,0],[d/ee,sl2],[0,sl2],col,[1,1,0]);
    quad(L,k,[x0-e,y0-0.01,z0-e],[x0-e,y0-0.01,z1+e],[xm,yt,z1+e],[xm,yt,z0-e],[0,0],[d/ee,0],[d/ee,sl2],[0,sl2],col,[-1,1,0]);
    var ep2=ESC[kp]||1;
    tri(L,kp,[x0,y0,z0],[x1,y0,z0],[xm,yt,z0],[uo/ep2,(y0-vb)/ep2],[(uo+w)/ep2,(y0-vb)/ep2],[(uo+w/2)/ep2,(yt-vb)/ep2],colP,[0,0,-1]);
    tri(L,kp,[x0,y0,z1],[x1,y0,z1],[xm,yt,z1],[uo/ep2,(y0-vb)/ep2],[(uo+w)/ep2,(y0-vb)/ep2],[(uo+w/2)/ep2,(yt-vb)/ep2],colP,[0,0,1]);
  }
}
/* tejado a cuatro aguas (si la planta es cuadrada, una pirámide) */
function cuatroAguas(L,k,cx,cz,w,d,y0,h,col){
  var e=0.05, x0=cx-w/2-e,x1=cx+w/2+e,z0=cz-d/2-e,z1=cz+d/2+e,yt=y0+h, ee=ESC[k]||1, W=x1-x0, D=z1-z0;
  if(W>=D){ var xa=x0+D/2, xb=x1-D/2, sl=Math.sqrt(h*h+D*D/4)/ee;
    quad(L,k,[x0,y0,z1],[x1,y0,z1],[xb,yt,cz],[xa,yt,cz],[0,0],[W/ee,0],[(W-D/2)/ee,sl],[D/2/ee,sl],col,[0,1,1]);
    quad(L,k,[x0,y0,z0],[x1,y0,z0],[xb,yt,cz],[xa,yt,cz],[0,0],[W/ee,0],[(W-D/2)/ee,sl],[D/2/ee,sl],col,[0,1,-1]);
    tri(L,k,[x1,y0,z0],[x1,y0,z1],[xb,yt,cz],[0,0],[D/ee,0],[D/2/ee,sl],col,[1,1,0]);
    tri(L,k,[x0,y0,z0],[x0,y0,z1],[xa,yt,cz],[0,0],[D/ee,0],[D/2/ee,sl],col,[-1,1,0]);
  } else { var za=z0+W/2, zb=z1-W/2, sl2=Math.sqrt(h*h+W*W/4)/ee;
    quad(L,k,[x1,y0,z0],[x1,y0,z1],[cx,yt,zb],[cx,yt,za],[0,0],[D/ee,0],[(D-W/2)/ee,sl2],[W/2/ee,sl2],col,[1,1,0]);
    quad(L,k,[x0,y0,z0],[x0,y0,z1],[cx,yt,zb],[cx,yt,za],[0,0],[D/ee,0],[(D-W/2)/ee,sl2],[W/2/ee,sl2],col,[-1,1,0]);
    tri(L,k,[x0,y0,z1],[x1,y0,z1],[cx,yt,zb],[0,0],[W/ee,0],[W/2/ee,sl2],col,[0,1,1]);
    tri(L,k,[x0,y0,z0],[x1,y0,z0],[cx,yt,za],[0,0],[W/ee,0],[W/2/ee,sl2],col,[0,1,-1]);
  }
}
/* cilindro con normales suaves (torres, tanques, columnas, troncos) */
function cil(L,k,kt,cx,cz,r,y0,h,col,colT,seg,vb,r2){
  seg=seg||12; r2=r2==null?r:r2; var e=ESC[k]||1, y1=y0+h;
  for(var i=0;i<seg;i++){
    var a0=i/seg*Math.PI*2, a1=(i+1)/seg*Math.PI*2, c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
    var p0=[cx+c0*r,y0,cz+s0*r], p1=[cx+c1*r,y0,cz+s1*r], p2=[cx+c1*r2,y1,cz+s1*r2], p3=[cx+c0*r2,y1,cz+s0*r2];
    var n0=[c0,(r-r2)/h,s0], n1=[c1,(r-r2)/h,s1], u0=i/seg*Math.PI*2*r/e, u1=(i+1)/seg*Math.PI*2*r/e, v0=(y0-(vb||y0))/e, v1=(y1-(vb||y0))/e;
    v3(L,k,p0,n0,[u0,v0],col); v3(L,k,p2,n1,[u1,v1],col); v3(L,k,p1,n1,[u1,v0],col);
    v3(L,k,p0,n0,[u0,v0],col); v3(L,k,p3,n0,[u0,v1],col); v3(L,k,p2,n1,[u1,v1],col);
    if(kt&&r2>0)v3(L,kt,[cx,y1,cz],[0,1,0],[0,0],colT||col),v3(L,kt,p2,[0,1,0],[c1*r2,s1*r2],colT||col),v3(L,kt,p3,[0,1,0],[c0*r2,s0*r2],colT||col);
  }
}
function cono(L,k,cx,cz,r,y0,h,col,seg){ cil(L,k,null,cx,cz,r,y0,h,col,null,seg||8,y0,0.0001); }
function cupula(L,k,cx,cz,r,y0,col,seg,anillos){
  seg=seg||14; anillos=anillos||5;
  for(var j=0;j<anillos;j++){ var f0=j/anillos*Math.PI/2, f1=(j+1)/anillos*Math.PI/2;
    for(var i=0;i<seg;i++){ var a0=i/seg*Math.PI*2, a1=(i+1)/seg*Math.PI*2;
      var P=function(a,f){return [cx+Math.cos(a)*Math.cos(f)*r,y0+Math.sin(f)*r,cz+Math.sin(a)*Math.cos(f)*r];};
      var N=function(a,f){return [Math.cos(a)*Math.cos(f),Math.sin(f),Math.sin(a)*Math.cos(f)];};
      v3(L,k,P(a0,f0),N(a0,f0),[0,0],col); v3(L,k,P(a1,f1),N(a1,f1),[1,1],col); v3(L,k,P(a1,f0),N(a1,f0),[1,0],col);
      v3(L,k,P(a0,f0),N(a0,f0),[0,0],col); v3(L,k,P(a0,f1),N(a0,f1),[0,1],col); v3(L,k,P(a1,f1),N(a1,f1),[1,1],col);
    } }
}
function disco(L,k,cx,cz,r,y,col,seg){ seg=seg||14;
  for(var i=0;i<seg;i++){var a0=i/seg*Math.PI*2,a1=(i+1)/seg*Math.PI*2;
    tri(L,k,[cx,y,cz],[cx+Math.cos(a0)*r,y,cz+Math.sin(a0)*r],[cx+Math.cos(a1)*r,y,cz+Math.sin(a1)*r],[cx,cz],[cx+Math.cos(a0)*r,cz+Math.sin(a0)*r],[cx+Math.cos(a1)*r,cz+Math.sin(a1)*r],col,[0,1,0]);}
}
/* copas de árbol: un icosaedro deformado con normales redondas */
var ICO=null;
function icosa(){ if(ICO)return ICO; var t=(1+Math.sqrt(5))/2, v=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]];
  v=v.map(function(p){var l=Math.sqrt(p[0]*p[0]+p[1]*p[1]+p[2]*p[2]); return [p[0]/l,p[1]/l,p[2]/l];});
  var f=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  return (ICO={v:v,f:f}); }
function copa(L,cx,cy,cz,rx,ry,col,sd){
  var I=icosa(), oscuro=escalaL(col,0.55);
  var vs=I.v.map(function(p,i){var j=0.82+0.3*hs(sd,i,3); return [cx+p[0]*rx*j,cy+p[1]*ry*j,cz+p[2]*rx*j];});
  I.f.forEach(function(f){ for(var q=0;q<3;q++){var i=f[q], p=I.v[i]; v3(L,"hoja",vs[i],p,[0,0],p[1]<-0.2?oscuro:p[1]>0.5?escalaL(col,1.12):col);} });
}
function arbol(L,x,y,z,esc,sd,tipo){
  var n=hs(sd,7,1), alto=(0.55+0.35*n)*esc;
  cil(L,"solido",null,x,z,0.035*esc,y-0.02,alto*0.45,lin("#5b3f2a"),null,5);
  if(tipo===1){ var verde=mezclaL(lin("#24502c"),lin("#3b6e3c"),n);
    cono(L,"hoja",x,z,0.24*esc,y+alto*0.22,alto*0.62,verde,8); cono(L,"hoja",x,z,0.17*esc,y+alto*0.55,alto*0.55,escalaL(verde,1.12),8); }
  else { var vh=mezclaL(lin("#3c7a32"),lin("#7aa845"),n*0.8+0.1*hs(sd,3,3));
    copa(L,x,y+alto*0.62,z,0.26*esc,0.24*esc,vh,sd); copa(L,x+0.08*esc,y+alto*0.82,z-0.06*esc,0.18*esc,0.17*esc,escalaL(vh,1.08),sd+5); }
}
function arbusto(L,x,y,z,r,col,sd){ copa(L,x,y+r*0.7,z,r,r*0.85,lin(col),sd); }

/* el aspecto de cada época (lo mismo que en el dibujo 2D) */
var PARED=["#f4e3c1","#e8d2b0","#f7f1e3","#e9c9a8","#dfe7ef"], TEJA=["#c0503a","#a8432f","#7a4b3a","#3f6e9c","#5b6b4a"];
var ESTILO=[
  {pared:["#d9b382","#cfa877","#e0bd8e"], teja:["#c9a24a","#b8913e"], suelo:"#c8b48a", calle:"tierra", mat:"estuco"},
  {pared:["#e8dcc4","#ddd0b6","#efe5d0"], teja:["#5d4037","#6d4c41"], suelo:"#bfb08f", calle:"tierra", mat:"piedra"},
  {pared:["#f1dfc0","#f3e2c2","#ead2ae"], teja:["#c1663d","#b85a35"], suelo:"#bfb6a6", calle:"piedra", mat:"estuco"},
  {pared:["#b5654a","#a85a42","#9e4f3a"], teja:["#55585e","#4a4d52"], suelo:"#a9a39a", calle:"asfalto", mat:"ladrillo"},
  {pared:PARED, teja:TEJA, suelo:"#9aa3a0", calle:"asfalto", mat:"estuco"},
  {pared:["#e8f4f8","#dff0f5","#f2f8fa"], teja:null, suelo:"#a7b4b8", calle:"digital", mat:"estuco"}
];

/* ---------- un edificio: un pequeño ayudante con el origen en el centro de la casilla y la base a su altura ---------- */
function Obra(L,meta,x,z,yb,n,sd){ this.L=L; this.meta=meta; this.x=x; this.z=z; this.yb=yb; this.n=n; this.sd=sd;
  this.uo=Math.floor(n*8)*0.25; }
var O=Obra.prototype;
O.caja=function(m,mt,dx,dz,w,d,y,h,col,colT){ caja(this.L,m,mt,this.x+dx,this.z+dz,w,d,this.yb+y,h,lin(col),lin(colT||col),this.uo,this.yb); return y+h; };
O.dos=function(m,mp,dx,dz,w,d,y,h,col,colP){ dosAguas(this.L,m,mp,this.x+dx,this.z+dz,w,d,this.yb+y,h,lin(col),lin(colP),this.uo,this.yb); };
O.cuatro=function(m,dx,dz,w,d,y,h,col){ cuatroAguas(this.L,m,this.x+dx,this.z+dz,w,d,this.yb+y,h,lin(col)); };
O.cil=function(m,mt,dx,dz,r,y,h,col,colT,seg,r2){ cil(this.L,m,mt,this.x+dx,this.z+dz,r,this.yb+y,h,lin(col),lin(colT||col),seg,this.yb,r2); };
O.cono=function(m,dx,dz,r,y,h,col,seg){ cono(this.L,m,this.x+dx,this.z+dz,r,this.yb+y,h,lin(col),seg); };
O.cupula=function(m,dx,dz,r,y,col){ cupula(this.L,m,this.x+dx,this.z+dz,r,this.yb+y,lin(col)); };
O.suelo=function(m,dx,dz,w,d,col,y){ techo(this.L,m,this.x+dx-w/2,this.z+dz-d/2,this.x+dx+w/2,this.z+dz+d/2,this.yb+(y||0)+0.004,lin(col)); };
O.disco=function(m,dx,dz,r,col,y){ disco(this.L,m,this.x+dx,this.z+dz,r,this.yb+(y||0)+0.006,lin(col)); };
O.arbol=function(dx,dz,esc,tipo){ arbol(this.L,this.x+dx,this.yb,this.z+dz,esc,this.sd+Math.round(dx*97+dz*31),tipo||0); };
O.arbusto=function(dx,dz,r,col,y){ arbusto(this.L,this.x+dx,this.yb+(y||0),this.z+dz,r,col||"#4f9a4a",this.sd+Math.round(dx*53+dz*71)); };
O.humo=function(dx,dz,y,oscuro){ this.meta.humo.push(this.x+dx,this.yb+y,this.z+dz,oscuro?1:0,this.n); };
O.brillo=function(dx,dz,y,col,tipo){ var c=lin(col); this.meta.brillo.push(this.x+dx,this.yb+y,this.z+dz,c[0],c[1],c[2],tipo||0); };
O.bandera=function(dx,dz,h,col){ this.cil("solido",null,dx,dz,0.012,0,h,"#6d4c41",null,4); this.caja("solido","solido",dx+0.06,dz,0.11,0.01,h-0.08,0.07,col); };
function P(px){return px*PX;}

/* casas y bloques de viviendas */
function viviendas(o,l,era,rq,vari,n){
  var E=ESTILO[era], pc=elige(E.pared,n), tc=E.teja?elige(E.teja,hs(vari,l,5)):"#9aa0a6", m=E.mat;
  if(rq===2)return viviendaRica(o,l,era,vari,n);
  var y, cesped=rq>=1?"#7dba5c":"#8fb86a";
  if(era===0){ o.suelo("cesped",0,0,0.96,0.96,"#a8b66e"); y=o.caja(m,null,0,0,0.5,0.5,0,P(6),pc); o.cuatro("teja",0,0,0.5,0.5,y,P(8),tc);
    o.caja("solido",null,0.12,0.252,0.1,0.01,0,P(3.5),"#5a3a1c"); }
  else if(era===1){ var f=l===1?0.56:0.72, h=l===1?8:13; o.suelo("cesped",0,0,0.96,0.96,cesped);
    y=o.caja(m,null,0,0,f,f*0.8,0,P(h),pc); o.dos("teja",m,0,0,f,f*0.8,y,P(l===1?6:9),tc,pc);
    if(l===2)o.caja("madera",null,0,0,f+0.01,f*0.8+0.01,P(h*0.45),0.02,"#6b4a30"); }
  else if(era===2){ o.suelo("cesped",0,0,0.96,0.96,cesped);
    if(l<=2){ var f2=l===1?0.56:0.72, h2=l===1?8:13; y=o.caja(m,null,0,0,f2,f2,0,P(h2),pc); o.cuatro("teja",0,0,f2,f2,y,P(6),tc); }
    else { y=o.caja(m,"plano",0,0,0.82,0.82,0,P(20),pc); o.caja("solido","solido",0,0,0.86,0.86,y,0.03,"#efe3c8"); o.cupula("teja",0,0,P(4)*1.6,y+0.03,"#c1663d"); } }
  else if(era===3){ o.suelo("cesped",0,0,0.96,0.96,"#8a9a72");
    if(l<=2){ var f3=l===1?0.56:0.72, h3=l===1?8:13; y=o.caja("ladrillo",null,0,0,f3,f3*0.85,0,P(h3),pc); o.dos("teja","ladrillo",0,0,f3,f3*0.85,y,P(6),tc,pc);
      o.caja("ladrillo","plano",-f3*0.3,0,0.07,0.07,y,P(9),"#7a3b2c"); }
    else { y=o.caja("ladrillo",null,0,0,0.82,0.82,0,P(24),pc); o.cuatro("teja",0,0,0.82,0.82,y,P(4),tc);
      o.caja("ladrillo","plano",0.25,0.25,0.07,0.07,y,P(8),"#7a3b2c"); o.caja("ladrillo","plano",-0.25,-0.2,0.07,0.07,y,P(8),"#7a3b2c"); } }
  else if(era===4){ o.suelo("cesped",0,0,0.96,0.96,cesped);
    if(l===1){ y=o.caja("estuco",null,0,-0.04,0.56,0.5,0,P(8),pc); o.dos("teja","estuco",0,-0.04,0.56,0.5,y,P(6),tc,pc); o.caja("estuco","plano",0.3,0.18,0.22,0.24,0,P(5),"#e0e0e0");
      o.suelo("acera",0.3,0.36,0.22,0.24,"#cfcfcf"); }
    else if(l===2){ y=o.caja("estuco",null,0,0,0.72,0.62,0,P(13),pc); o.dos("teja","estuco",0,0,0.72,0.62,y,P(6),tc,pc); }
    else if(l===3){ y=o.caja("estuco","plano",0,0,0.8,0.8,0,P(26),pc); o.caja("solido","plano",0,0,0.84,0.84,y,0.035,"#bdbdbd"); o.caja("metal","plano",0.15,-0.1,0.18,0.14,y,0.08,"#cfd4d8"); }
    else { y=o.caja("oficina","plano",0,0,0.68,0.68,0,P(50),"#d8dee8"); o.caja("solido","plano",0,0,0.72,0.72,y,0.04,"#9aa3b0"); o.cil("metal",null,0,0,0.012,y,P(8),"#9aa3b0",null,4); o.brillo(0,0,y+P(8),"#ff3030",1); }
    if(rq===1&&l<=2){ o.arbusto(0.36,0.3,0.07); o.caja("solido",null,0.15,0.47,0.6,0.012,0,0.06,"#f0f0f0"); }
    if(rq===1&&l>=3)balcones(o,0.8,P(26),6); }
  else { o.suelo("cesped",0,0,0.96,0.96,"#86c068");
    if(l<=2){ var f5=l===1?0.58:0.74, h5=l===1?8:13; y=o.caja("estuco","plano",0,0,f5,f5,0,P(h5),pc); paneles(o,f5*0.8,y); }
    else if(l===3){ y=o.caja("cristal","cesped",0,0,0.8,0.8,0,P(30),"#7fd1d9","#6bbf5f"); o.arbusto(-0.15,0.1,0.08,null,y); o.arbusto(0.18,-0.12,0.07,null,y); }
    else { y=o.caja("cristal","cesped",0,0,0.66,0.66,0,P(60),"#5fb8c9","#6bbf5f"); o.caja("luz",null,0,0,0.672,0.672,P(44),0.02,"#40e0ff"); o.arbusto(0,0,0.1,null,y); }
    if(rq===1&&l>=3)balcones(o,0.8,P(30),6); }
}
function balcones(o,f,h,pisos){ for(var p=1;p<pisos;p++){ var y=p*h/pisos; o.caja("solido","solido",0.02,0.02,f+0.05,f+0.05,y,0.018,"#f4f4f4"); } }
function paneles(o,f,y){ var L=o.L, x0=o.x-f/2, x1=o.x+f/2, z0=o.z-f/2, z1=o.z+f/2, yy=o.yb+y+0.03;
  quad(L,"solar",[x0,yy,z0],[x1,yy,z0],[x1,yy+0.06,z1],[x0,yy+0.06,z1],[0,0],[f*2,0],[f*2,f*2],[0,f*2],[1,1,1],[0,1,1]); }
function viviendaRica(o,l,era,vari,n){
  var y;
  o.suelo("cesped",0,0,0.98,0.98,"#6fbf5c");
  if(era>=4&&l>=4){ var ht=P(era===5?68:62);
    o.cil("cristal","plano",0,0,0.32,0,ht,era===5?"#7fd6e0":"#9fb7d6",era===5?"#6cc070":"#dfe8f2",20);
    for(var k=1;k<10;k++)o.cil("solido",null,0,0,0.335,k*ht/10,0.015,"#f5f5f5",null,20);
    o.cil("brillo",null,0,0,0.33,ht-0.01,0.03,"#d4af37",null,20);
    if(era===5){o.arbusto(-0.1,0.05,0.08,null,ht); o.arbusto(0.12,-0.06,0.07,null,ht);}
    o.arbusto(0.4,0.38,0.08); o.arbusto(-0.38,0.4,0.07); return; }
  if(era>=4&&l===3){ y=o.caja("estuco","cesped",0,0,0.8,0.8,0,P(30),"#f2ece2","#6fae5a"); balcones(o,0.8,P(30),6);
    o.caja("brillo",null,0,0,0.84,0.84,y,0.03,"#d4af37"); o.arbusto(-0.15,0.12,0.07,null,y); o.arbusto(0.17,-0.1,0.06,null,y); return; }
  if(era>=4){ /* villa moderna con piscina */
    o.suelo("acera",0.18,0.2,0.46,0.4,"#f0f0f0",0.002); o.suelo("piscina",0.18,0.2,0.36,0.28,"#ffffff",0.006);
    y=o.caja("estuco","plano",-0.14,-0.08,0.5,0.42,0,P(9),"#f7f8fa"); o.caja("estuco","plano",-0.2,-0.16,0.36,0.3,y,P(7),"#e9edf1");
    o.caja("cristal",null,-0.14,0.135,0.4,0.01,0.01,P(7),"#5e86b0");
    o.arbusto(-0.4,0.38,0.08); o.arbusto(0.4,-0.38,0.07); o.arbol(-0.38,-0.38,0.7); return; }
  if(era===3){ y=o.caja("ladrillo",null,0,-0.04,0.62,0.6,0,P(14),"#c97b5a"); o.cuatro("teja",0,-0.04,0.62,0.6,y,P(9),"#4a4d52");
    o.caja("ladrillo","plano",0.2,-0.15,0.07,0.07,y,P(11),"#8a4a3a");
    o.caja("solido",null,0,0.475,0.95,0.015,0,0.08,"#37474f"); o.caja("solido",null,0.475,0,0.015,0.95,0,0.08,"#37474f");
    o.arbusto(-0.35,0.32,0.08); o.arbusto(0.36,0.3,0.07); return; }
  if(era===2){ y=o.caja("estuco","plano",0,0,0.7,0.7,0,P(14),"#f6e6c8"); o.caja("solido","solido",0,0,0.74,0.74,y,0.03,"#efe3c8");
    o.cupula("teja",0,0,0.25,y+0.03,"#c0603a"); o.cil("piedra","piscina",0.38,0.38,0.08,0,0.05,"#e0d6c2","#9ad0f0",12); o.arbusto(-0.38,0.36,0.08); return; }
  if(era===1){ y=o.caja("piedra",null,-0.06,0,0.62,0.6,0,P(13),"#efe6d2"); o.cuatro("teja",-0.06,0,0.62,0.6,y,P(9),"#4e342e");
    o.cil("piedra",null,0.3,0.3,0.11,0,P(20),"#e0d6c2",null,10); o.cono("teja",0.3,0.3,0.13,P(20),P(9),"#6d4c41",10); o.arbusto(-0.38,0.38,0.07); return; }
  y=o.caja("estuco",null,0,0,0.6,0.6,0,P(9),"#e9d3a7"); o.cuatro("teja",0,0,0.6,0.6,y,P(7),"#b5653a");
  o.arbusto(0.38,0.36,0.08); o.arbusto(-0.38,0.38,0.065,"#6b8e23");
}

/* comercio */
function comercio(o,l,era,rq,vari,n){
  var E=ESTILO[era], y, toldo=["#c62828","#1565c0","#2e7d32","#f9a825"][vari];
  if(rq===2)return comercioLujo(o,l,era,vari,n);
  o.suelo("acera",0,0,0.98,0.98,E.suelo);
  if(era===0){ o.caja("madera",null,0,0,0.55,0.5,0,P(4),"#c8a878"); o.cuatro("teja",0,0,0.7,0.62,P(4),P(7),n<0.5?"#d84b3a":"#e0a030");
    for(var k=0;k<4;k++)o.cil("solido",null,(k%2?0.3:-0.3),(k<2?0.27:-0.27),0.012,0,P(4),"#7a5a3a",null,4); }
  else if(era===4){
    if(l===1){ y=o.caja("estuco","plano",0,0,0.7,0.6,0,P(9),"#ffd59e"); toldoF(o,0.7,0.3,P(5),n<0.5?"#e53935":"#1e88e5"); }
    else if(l===2){ y=o.caja("oficina","plano",0,0,0.8,0.8,0,P(15),"#cfe3f7"); o.caja("solido",null,0,0.405,0.4,0.01,P(13),0.06,"#ff7043"); }
    else if(l===3){ y=o.caja("cristal","plano",0,0,0.76,0.76,0,P(34),"#5d9fd8"); o.caja("solido","plano",0,0,0.78,0.78,y,0.03,"#8aa4bd"); }
    else { y=o.caja("cristal","plano",0,0,0.66,0.66,0,P(62),"#3f7fc0"); o.caja("solido","plano",0,0,0.5,0.5,y,0.05,"#8aa4bd");
      o.cil("metal",null,0,0,0.015,y,P(10),"#c0c6cf",null,4); o.brillo(0,0,y+P(10),"#ff3030",1); }
    if(rq===1&&l<=2)toldoF(o,0.78,0.3,P(4),toldo); }
  else if(era===5){ var hc=P([0,10,18,36,64][l]); y=o.caja("cristal","plano",0,0,0.74,0.74,0,hc,"#69c7e0"); o.caja("luz",null,0,0,0.75,0.75,hc*0.55,0.025,"#ff40a0");
    if(l>=3)o.cil("luz",null,0.2,0.2,0.05,y,0.01,"#40e0ff",null,10); }
  else { var hc2=P(era===1?10:era===2?14:15)+(l-1)*P(8), mat=era===3?"ladrillo":era===2?"estuco":"piedra";
    y=o.caja(mat,null,0,0,0.78,0.78,0,hc2,era===3?"#9e4f3a":era===2?"#f0d9b0":"#e8dcc4");
    if(era<=2)o.cuatro("teja",0,0,0.78,0.78,y,P(5),elige(E.teja,n));
    else { techo(o.L,"plano",o.x-0.39,o.z-0.39,o.x+0.39,o.z+0.39,o.yb+y,lin("#8d8d8d")); o.caja("solido",null,0,0.395,0.5,0.01,y-P(4),P(3),"#2e3b4e"); }
    if(era===2)for(var a=0;a<3;a++)o.caja("solido",null,-0.26+a*0.26,0.395,0.13,0.01,0,P(5),"#5d4037");
    if(era===1){ o.cil("solido",null,0.4,0.2,0.006,P(5),P(3),"#8d6e63",null,4); o.caja("solido",null,0.4,0.2,0.01,0.1,P(3),P(2),"#c62828"); }
    if(rq===1)toldoF(o,0.7,0.25,P(5),toldo); }
}
function toldoF(o,w,d,y,col){ var L=o.L, x0=o.x-w/2, x1=o.x+w/2, z0=o.z+0.4, z1=z0+d*0.5, y0=o.yb+y+0.02, y1=o.yb+y-0.05, c=lin(col);
  quad(L,"solido",[x0,y0,z0],[x1,y0,z0],[x1,y1,z1],[x0,y1,z1],[0,0],[1,0],[1,1],[0,1],c,[0,1,1]); }
function comercioLujo(o,l,era,vari,n){
  var y;
  o.suelo("acera",0,0,0.98,0.98,"#e8e2d6");
  if(era>=4&&l>=4){ var ht=P(era===5?74:68);
    o.cil("cristal","plano",0,0,0.3,0,ht,era===5?"#5fd0f0":"#4f86c6","#e8f1fa",20);
    o.cil("brillo",null,0,0,0.31,ht-0.02,0.04,"#d4af37",null,20); o.cono("brillo",0,0,0.05,ht,P(12),"#d4af37",8); o.brillo(0,0,ht+P(12),"#ff3030",1);
    if(era===5)o.cil("luz",null,0,0,0.315,ht*0.6,0.02,"#ff40a0",null,20);
    return; }
  if(era>=4&&l===3){ y=o.caja("cristal","plano",0,0,0.74,0.74,0,P(40),era===5?"#5cc8e8":"#4a7fbf"); o.caja("brillo","brillo",0,0,0.5,0.5,y,P(4),"#d4af37"); return; }
  if(era>=4){ y=o.caja("estuco","plano",0,-0.03,0.82,0.76,0,P(13),"#f5f0e6"); o.caja("cristal",null,0,0.36,0.7,0.02,0.01,P(9),"#6aa6d8");
    o.caja("brillo",null,0,0.36,0.84,0.03,P(10),0.025,"#d4af37"); toldoF(o,0.6,0.25,P(9),["#b71c1c","#1a237e","#004d40","#4a148c"][vari]); o.arbusto(-0.42,0.42,0.06); o.arbusto(0.42,0.42,0.06); return; }
  if(era===3){ y=o.caja("ladrillo","plano",0,0,0.9,0.9,0,P(22),"#b04a3a"); o.caja("solido","plano",0,0,0.94,0.94,y,0.03,"#e6d3a3");
    o.caja("brillo",null,0,0.455,0.5,0.01,y-P(5),P(3),"#d4af37"); toldoF(o,0.86,0.25,P(6),"#2e7d32"); return; }
  if(era===2){ y=o.caja("estuco","plano",0,0,0.9,0.9,0,P(16),"#f3e3c3"); for(var a=0;a<4;a++)o.caja("solido",null,-0.33+a*0.22,0.455,0.12,0.01,0,P(6),"#6d4c41");
    o.cupula("teja",0,0,0.28,y,"#b4562e"); o.cil("solido",null,0,0,0.03,y+0.27,P(3),"#f3e3c3",null,6); return; }
  if(era===1){ y=o.caja("piedra",null,0,0,0.86,0.86,0,P(14),"#e6dcc6"); o.cuatro("teja",0,0,0.86,0.86,y,P(6),"#6d4c41");
    for(var b=0;b<3;b++)o.caja("solido",null,-0.28+b*0.28,0.435,0.14,0.01,0,P(5),"#4e342e"); o.bandera(0.3,0.3,y+P(10),["#c62828","#1565c0","#2e7d32","#f9a825"][vari]); return; }
  o.caja("estuco",null,0,0,0.8,0.8,0,P(6),"#e8cfa0"); o.cuatro("teja",0,0,0.86,0.86,P(6),P(9),["#c62828","#1565c0","#2e7d32","#f9a825"][vari]);
  o.cuatro("teja",0.32,0.32,0.3,0.3,P(3),P(4),["#f9a825","#c62828","#6a1b9a","#1565c0"][vari]);
}
/* industria */
function industria(o,l,era,n){
  var y;
  o.suelo("plano",0,0,0.98,0.98,"#9b9384");
  if(era<=2){ var fi=[0.6,0.7,0.8][era], hi=P([6,9,11][era]+(l-1)*3);
    y=o.caja(era===0?"madera":era===1?"piedra":"estuco",null,0,0,fi,fi*0.85,0,hi,era===0?"#b08b5a":era===1?"#9e9e9e":"#c0a080");
    o.dos("teja",era===1?"piedra":"estuco",0,0,fi,fi*0.85,y,P(5),era===2?"#b85a35":"#6d4c41","#c0a080");
    o.caja("piedra","plano",fi*0.25,-fi*0.2,0.08,0.08,y,P(7),"#8d7f6a"); o.humo(fi*0.25,-fi*0.2,y+P(7),false);
    if(era===1){ o.cil("madera",null,-fi/2-0.03,0,0.18,0,0.02,"#6d4c41",null,12); } return; }
  if(era===5){ var h5=P([0,12,15,18,21][l]); y=o.caja("estuco","plano",0,0,0.9,0.9,0,h5,"#eef1f3"); paneles(o,0.75,y); o.caja("luz",null,0,0.455,0.4,0.01,P(3),0.02,"#40e0ff"); return; }
  var al=P([0,9,13,17,21][l]), f=[0,0.75,0.85,0.9,0.92][l];
  y=o.caja(era===3?"ladrillo":"metal",null,0,0,f,f,0,al,era===3?"#9e5a44":"#b7a58a");
  /* techo de dientes de sierra */
  for(var k=0;k<3;k++){ var x0=o.x-f/2+k*f/3, x1=x0+f/3, z0=o.z-f/2, z1=o.z+f/2, yy=o.yb+y, yt=yy+P(5), c=lin("#6f6455"), cv=lin("#a9c3d6");
    quad(o.L,"metal",[x0,yy,z0],[x0,yy,z1],[x1,yt,z1],[x1,yt,z0],[0,0],[f,0],[f,0.5],[0,0.5],c,[-1,1,0]);
    quad(o.L,"solido",[x1,yy,z0],[x1,yy,z1],[x1,yt,z1],[x1,yt,z0],[0,0],[1,0],[1,1],[0,1],cv,[1,0,0]);
    tri(o.L,"metal",[x0,yy,z1],[x1,yy,z1],[x1,yt,z1],[0,0],[1,0],[1,1],c,[0,0,1]); tri(o.L,"metal",[x0,yy,z0],[x1,yy,z0],[x1,yt,z0],[0,0],[1,0],[1,1],c,[0,0,-1]); }
  var nch=Math.min(l+(era===3?1:0),3), hc=P(era===3?14:10);
  for(var c2=0;c2<nch;c2++){ var dx=0.18+c2*0.1-0.15, dz=-0.15+c2*0.12;
    o.cil("ladrillo","plano",dx,dz,0.05,y,hc,"#8b4a3c",null,8,0.042); o.cil("solido",null,dx,dz,0.047,y+hc*0.78,0.03,"#f5f5f5",null,8); o.humo(dx,dz,y+hc,true); }
}
/* servicios y edificios públicos */
function servicio(o,t,era,n,now){
  var y;
  if(t==="p"&&era<=1){ o.suelo("plano",0,0,0.98,0.98,"#b9ad98"); y=o.caja("piedra","plano",0,0,0.42,0.42,0,P(20),"#a1887f","#8d6e63");
    o.caja("piedra","plano",0,0,0.5,0.5,y,0.05,"#8d6e63"); o.bandera(0,0,y+P(10),"#c62828"); return; }
  var suelo=t==="P"?"#5fb85a":t==="Z"?"#e2d6bf":"#a7aeb0";
  o.suelo(t==="P"?"cesped":t==="Z"?"adoquin":"plano",0,0,0.98,0.98,suelo);
  switch(t){
    case "e": y=o.caja("metal","plano",-0.05,0,0.82,0.7,0,P(15),"#8d939c");
      for(var k=0;k<2;k++){var dx=0.2+k*0.16, dz=-0.25+k*0.1; o.cil("solido","plano",dx,dz,0.06,0,P(30),"#b0412e",null,10,0.05); o.cil("solido",null,dx,dz,0.059,P(24),0.04,"#f2f2f2",null,10); o.humo(dx,dz,P(30),true);} break;
    case "w": o.cil("solido",null,0,0,0.035,0,P(34),"#eef0f2",null,8,0.022); o.caja("solido","solido",0,0,0.1,0.06,P(34)-0.03,0.06,"#e0e3e6");
      o.meta.molino.push(o.x+0.05,o.yb+P(34),o.z+0.05,o.n); break;
    case "s": for(var s2=0;s2<4;s2++){ var px=((s2%2)-0.5)*0.46, pz=(Math.floor(s2/2)-0.5)*0.46, L=o.L, x0=o.x+px-0.2, x1=o.x+px+0.2, z0=o.z+pz-0.17, z1=o.z+pz+0.17, yy=o.yb+0.05;
        o.cil("solido",null,px,pz,0.01,0,0.06,"#9aa1a8",null,4); quad(L,"solar",[x0,yy+0.08,z0],[x1,yy+0.08,z0],[x1,yy,z1],[x0,yy,z1],[0,0],[1,0],[1,1],[0,1],[1,1,1],[0,1,1]); } break;
    case "h": y=o.caja("solido","plano",0,-0.1,0.95,0.6,0,P(13),"#b9bfc6"); o.suelo("piscina",0,0.32,0.9,0.3,"#ffffff",0.01); o.caja("solido",null,0,0.2,0.3,0.03,0.02,y-0.04,"#e8f4ff"); break;
    case "b": y=o.caja("estuco","plano",-0.2,0.15,0.3,0.3,0,P(6),"#cfd8dc");
      for(var q=0;q<4;q++)o.cil("metal",null,0.15+((q%2)-0.5)*0.18,-0.12+(Math.floor(q/2)-0.5)*0.18,0.012,0,P(14),"#78909c",null,4);
      o.cil("brillo","solido",0.15,-0.12,0.16,P(14),P(5),"#4fa3e0","#7cc0f0",14); break;
    case "d": for(var dd=0;dd<2;dd++){ o.cil("solido","piscina",-0.22+dd*0.42,-0.05+dd*0.12,0.2,0,0.05,"#b0bec5",null,16); } o.caja("estuco","plano",0.25,-0.3,0.25,0.2,0,P(7),"#eceff1"); break;
    case "p": y=o.caja("estuco","plano",0,0,0.78,0.7,0,P(13),"#e8eef7"); o.caja("solido",null,0,0.355,0.79,0.01,P(5),P(2),"#3a5ba0");
      o.caja("solido","solido",-0.1,0,0.1,0.04,y,0.03,"#ff1744"); o.caja("solido","solido",0.05,0,0.1,0.04,y,0.03,"#2979ff"); o.brillo(-0.1,0,y+0.05,"#ff1744",2); o.brillo(0.05,0,y+0.05,"#2979ff",3); break;
    case "f": y=o.caja("ladrillo","plano",-0.05,0,0.8,0.8,0,P(13),"#d84315"); for(var g2=0;g2<2;g2++)o.caja("solido",null,-0.2+g2*0.3,0.405,0.24,0.01,0,P(8),"#fbe9e7");
      o.caja("ladrillo","plano",0.3,-0.25,0.16,0.16,0,P(24),"#b23a12"); o.caja("solido","solido",0.3,-0.25,0.17,0.17,P(24),0.02,"#ffca28"); break;
    case "H": y=o.caja("estuco","plano",0,0,0.92,0.92,0,P(22),"#f7f7f7"); o.caja("solido","solido",0,0,0.3,0.08,y,0.012,"#e53935"); o.caja("solido","solido",0,0,0.08,0.3,y,0.012,"#e53935");
      o.caja("solido",null,0,0.465,0.08,0.01,y-P(8),0.2,"#e53935"); o.caja("solido",null,0,0.465,0.2,0.01,y-P(8)+0.07,0.06,"#e53935"); break;
    case "k": y=o.caja("ladrillo",null,-0.05,-0.05,0.8,0.7,0,P(13),"#e9a35b"); o.dos("teja","ladrillo",-0.05,-0.05,0.8,0.7,y,P(5),"#a0522d","#e9a35b");
      o.bandera(0.4,0.38,P(26),["#1e88e5","#43a047","#e53935"][Math.floor(n*3)]); break;
    case "u": y=o.caja("piedra","plano",0,0,0.96,0.86,0,P(19),"#e8dcc0"); o.cupula("brillo",0,0,0.24,y,"#3f6e9c"); o.cono("brillo",0,0,0.02,y+0.24,P(5),"#d4af37",6);
      for(var c=0;c<6;c++)o.cil("piedra",null,-0.4+c*0.16,0.47,0.025,0,P(14),"#f5efe0",null,8); break;
    case "L": y=o.caja("piedra",null,0,-0.04,0.74,0.66,0,P(13),"#8d6e63"); o.dos("teja","piedra",0,-0.04,0.74,0.66,y,P(4),"#6d4c41","#8d6e63");
      for(var c3=0;c3<4;c3++)o.cil("piedra",null,-0.27+c3*0.18,0.33,0.022,0,P(12),"#efe6d2",null,8); break;
    case "M": o.caja("piedra","plano",0,0,0.92,0.92,0,P(3),"#e0e0e0"); for(var c4=0;c4<5;c4++){o.cil("piedra",null,-0.36+c4*0.18,0.38,0.035,P(3),P(12),"#fafafa",null,10); o.cil("piedra",null,0.38,-0.36+c4*0.18,0.035,P(3),P(12),"#fafafa",null,10);}
      y=o.caja("estuco","plano",-0.04,-0.04,0.68,0.68,P(3),P(12),"#eeeeee"); o.caja("piedra","plano",0,0,0.9,0.9,y,P(2),"#e6e6e6"); o.dos("teja","piedra",0,0,0.9,0.9,y+P(2),P(6),"#d7ccc8","#eeeeee"); break;
    case "T": y=o.caja("estuco","plano",0,0,0.86,0.86,0,P(16),"#7b1fa2"); o.cupula("teja",0,0,0.26,y,"#c62828");
      for(var b=0;b<5;b++)o.brillo(-0.3+b*0.15,0.44,P(5),"#ffd54f",4); o.caja("luz",null,0,0.44,0.7,0.01,P(4),0.03,"#ffe082"); break;
    case "P": { var L2=o.L, cl=lin("#e8dcb8"); techo(L2,"acera",o.x-0.06,o.z-0.49,o.x+0.06,o.z+0.49,o.yb+0.008,cl); techo(L2,"acera",o.x-0.49,o.z-0.06,o.x+0.49,o.z+0.06,o.yb+0.009,cl);
      o.arbol(-0.25,-0.25,0.8); o.arbol(0.27,0.25,0.75,1); o.arbol(0.25,-0.27,0.7); o.arbusto(-0.28,0.28,0.09); o.caja("madera",null,0.15,0.1,0.14,0.04,0.03,0.025,"#795548"); } break;
    case "Z": o.cil("piedra","piscina",0,0,0.28,0,0.05,"#b0bec5",null,18); o.cil("piedra",null,0,0,0.04,0.05,0.12,"#cfd8dc",null,8); o.brillo(0,0,0.2,"#e1f5fe",5);
      o.arbusto(-0.4,-0.4,0.07); o.arbusto(0.4,-0.4,0.07); o.arbusto(-0.4,0.4,0.07); o.arbusto(0.4,0.4,0.07); break;
    case "O": { o.caja("piedra","plano",0,0,0.62,0.62,0,P(4),"#d7ccc8"); var L3=o.L, b0=o.yb+P(4), bt=o.yb+P(40), w0=0.09, w1=0.05, cx=o.x, cz=o.z, cc=lin("#efe6d2");
      [[1,0],[0,1],[-1,0],[0,-1]].forEach(function(v){ var px=v[1], pz=-v[0];
        quad(L3,"piedra",[cx+v[0]*w0+px*w0,b0,cz+v[1]*w0+pz*w0],[cx+v[0]*w0-px*w0,b0,cz+v[1]*w0-pz*w0],[cx+v[0]*w1-px*w1,bt,cz+v[1]*w1-pz*w1],[cx+v[0]*w1+px*w1,bt,cz+v[1]*w1+pz*w1],[0,0],[0.2,0],[0.2,2],[0,2],cc,[v[0],0.1,v[1]]); });
      cono(L3,"brillo",cx,cz,0.072,bt,0.1,lin("#d4af37"),4); } break;
  }
}

/* ---------- calles ---------- */
var CALLE={tierra:{m:"tierra",col:"#a98861",w:0.27}, piedra:{m:"adoquin",col:"#b3aa9c",w:0.33}, asfalto:{m:"asfalto",col:"#5d626b",w:0.33}, digital:{m:"asfalto",col:"#3a4048",w:0.33}};
function calle(L,meta,wx,wy,es,era,con,n){
  var E=CALLE[ESTILO[era].calle], w=E.w, c=lin(E.col), h=function(u,v){var a=u+0.5,b=v+0.5; return (es[0]*(1-a)*(1-b)+es[1]*a*(1-b)+es[2]*a*b+es[3]*(1-a)*b)*LV+0.012;};
  var cuadro=function(k,u0,v0,u1,v1,col,sub){ var e=ESC[k]||1; quad(L,k,[wx+u0,h(u0,v0)+(sub||0),wy+v0],[wx+u1,h(u1,v0)+(sub||0),wy+v0],[wx+u1,h(u1,v1)+(sub||0),wy+v1],[wx+u0,h(u0,v1)+(sub||0),wy+v1],
      [(wx+u0)/e,(wy+v0)/e],[(wx+u1)/e,(wy+v0)/e],[(wx+u1)/e,(wy+v1)/e],[(wx+u0)/e,(wy+v1)/e],col,[0,1,0]); };
  if(era>=3)cuadro("acera",-0.5,-0.5,0.5,0.5,lin(era===5?"#dfe6ea":"#cfc9bd"),-0.004);
  else if(era===2)cuadro("adoquin",-0.5,-0.5,0.5,0.5,lin("#c9bea9"),-0.004);
  cuadro(E.m,-w,-w,w,w,c);
  if(con[0])cuadro(E.m,w,-w,0.5,w,c); if(con[1])cuadro(E.m,-0.5,-w,-w,w,c); if(con[2])cuadro(E.m,-w,w,w,0.5,c); if(con[3])cuadro(E.m,-w,-0.5,w,-w,c);
  var nc=con[0]+con[1]+con[2]+con[3];
  if(era>=3){ var lc=era===5?lin("#40e0ff"):lin("#f0d890"), km=era===5?"marcaLuz":"marca", d=0.022;
    if(nc<3){ if(con[0]||con[1])for(var s=-0.46;s<0.46;s+=0.24)if((con[0]||s<0)&&(con[1]||s>0))cuadro(km,s,-d,s+0.12,d,lc,0.002);
      if(con[2]||con[3])for(var s2=-0.46;s2<0.46;s2+=0.24)if((con[2]||s2<0)&&(con[3]||s2>0))cuadro(km,-d,s2,d,s2+0.12,lc,0.002); }
    else if(era>=4){ var bl=lin("#f4f4f4");
      for(var k=0;k<4;k++){ var v0=-w+0.04+k*(2*w-0.08)/4, v1=v0+(2*w-0.08)/8;
        if(con[0])cuadro("marca",w+0.02,v0,w+0.12,v1,bl,0.002); if(con[1])cuadro("marca",-w-0.12,v0,-w-0.02,v1,bl,0.002);
        if(con[2])cuadro("marca",v0,w+0.02,v1,w+0.12,bl,0.002); if(con[3])cuadro("marca",v0,-w-0.12,v1,-w-0.02,bl,0.002); } }
    /* farolas en algunas esquinas */
    if(n<0.3){ var fx=wx+0.42, fz=wy+0.42, fy=h(0.42,0.42); cil(L,"metal",null,fx,fz,0.012,fy,P(13),lin("#5f6b75"),null,5);
      caja(L,"luz",null,fx-0.03,fz-0.03,0.07,0.04,fy+P(13)-0.01,0.02,lin("#fff2c4"),null,0,0); meta.brillo.push(fx-0.03,fy+P(13)-0.02,fz-0.03,1,0.85,0.55,6); } }
}
/* el lote de una zona sin construir: tierra marcada con el color de la zona */
function lote(L,wx,wy,es,t){
  var col=lin(t==="R"?"#8cc47a":t==="C"?"#86b6e0":"#e2c26a"), borde=lin(t==="R"?"#2e7d32":t==="C"?"#1565c0":"#c79100");
  var h=function(u,v){var a=u+0.5,b=v+0.5; return (es[0]*(1-a)*(1-b)+es[1]*a*(1-b)+es[2]*a*b+es[3]*(1-a)*b)*LV+0.01;};
  var q=function(u0,v0,u1,v1,c,k){quad(L,k||"lote",[wx+u0,h(u0,v0),wy+v0],[wx+u1,h(u1,v0),wy+v0],[wx+u1,h(u1,v1),wy+v1],[wx+u0,h(u0,v1),wy+v1],[0,0],[1,0],[1,1],[0,1],c,[0,1,0]);};
  q(-0.47,-0.47,0.47,0.47,col);
  q(-0.44,-0.44,0.44,-0.41,borde,"marca"); q(-0.44,0.41,0.44,0.44,borde,"marca"); q(-0.44,-0.41,-0.41,0.41,borde,"marca"); q(0.41,-0.41,0.44,0.41,borde,"marca");
}

/* ---------- el motor 3D ---------- */
function Vista(lienzoGL,api){
  this.api=api; this.cv=lienzoGL;
  var r=this.r=new T.WebGLRenderer({canvas:lienzoGL,antialias:true,alpha:false,powerPreference:"high-performance",preserveDrawingBuffer:false});
  ANISO=Math.min(8,r.capabilities.getMaxAnisotropy());
  r.outputColorSpace=T.SRGBColorSpace; r.toneMapping=T.ACESFilmicToneMapping; r.toneMappingExposure=1.0;
  r.shadowMap.enabled=true; r.shadowMap.type=T.PCFSoftShadowMap; r.shadowMap.autoUpdate=false;
  this.movil=(navigator.maxTouchPoints||0)>0&&Math.min(screen.width,screen.height)<900;
  this.prMax=Math.min(window.devicePixelRatio||1,this.movil?2:2); this.pr=this.prMax;
  var e=this.escena=new T.Scene();
  this.M=materiales(r);
  /* la cámara: ortográfica, con la orientación exacta de la vista isométrica */
  var cam=this.cam=new T.OrthographicCamera(-1,1,1,-1,1,DIST*2); cam.matrixAutoUpdate=false;
  this.R=new T.Vector3(HW,0,-HW).normalize(); this.U=new T.Vector3(-HH,PXY,-HH).normalize(); this.B=new T.Vector3().crossVectors(this.R,this.U);
  /* luces: cielo y suelo, el sol (con sombras) y la luz ambiente del entorno */
  this.hemi=new T.HemisphereLight(0xdbeeff,0x55704a,0.6); e.add(this.hemi);
  var sol=this.sol=new T.DirectionalLight(0xfff2dc,2.6); sol.castShadow=true;
  var ms=this.movil?1024:2048; sol.shadow.mapSize.set(ms,ms); sol.shadow.bias=-0.0006; sol.shadow.normalBias=0.03;
  e.add(sol); e.add(sol.target);
  this.niebla=new T.Fog(0xb9d3e8,DIST+40,DIST+200); e.fog=this.niebla; e.background=new T.Color(0xb9d3e8);
  this.pmrem=new T.PMREMGenerator(r); this.cieloK=-1;
  this.trozos={}; this.nTrozos=0; this.vistos={}; this.grupo=new T.Group(); e.add(this.grupo);
  this.agua=[]; this.marco=0; this.ultFirma=0; this.ultSombra=0; this.camPrev="";
  this.tiempos=[]; this.ultAjuste=0;
  this.dinamicos();
}
var V=Vista.prototype;
V.ponCamara=function(c,W,H){
  var x=(c.x/HW+c.y/HH)/2, z=(c.y/HH-c.x/HW)/2, C=new T.Vector3(x,0,z), pos=C.clone().addScaledVector(this.B,DIST);
  var m=this.cam.matrix; m.makeBasis(this.R,this.U,this.B); m.setPosition(pos); this.cam.matrixWorldNeedsUpdate=true;
  var k=c.z*S; this.cam.left=-W/2/k; this.cam.right=W/2/k; this.cam.top=H/2/k; this.cam.bottom=-H/2/k; this.cam.updateProjectionMatrix();
  this.centro=C; this.k=k;
};
/* el cielo según la hora: para el fondo, la niebla y los reflejos (se regenera de a poco) */
V.cielo=function(noche,tarde){
  var dia=new T.Color(0xb9d3e8), ocaso=new T.Color(0xeab48c), nocheC=new T.Color(0x16264a);
  var c=dia.clone().lerp(ocaso,tarde).lerp(nocheC,noche);
  this.escena.background.copy(c); this.niebla.color.copy(c);
  var k=Math.round(noche*8)*10+Math.round(tarde*4);
  if(k===this.cieloK)return; this.cieloK=k;
  var es=new T.Scene(), g=new T.SphereGeometry(50,24,12), col=[], p=g.attributes.position;
  var alto=new T.Color(0x5b8fd0).lerp(new T.Color(0x6a5a8a),tarde).lerp(new T.Color(0x050a18),noche), hor=c.clone(), suelo=new T.Color(0x4d5e45).lerp(new T.Color(0x0a0d10),noche);
  for(var i=0;i<p.count;i++){var y=p.getY(i)/50, q=y>0?alto.clone().lerp(hor,1-y):hor.clone().lerp(suelo,Math.min(1,-y*3)); col.push(q.r,q.g,q.b);}
  g.setAttribute("color",new T.Float32BufferAttribute(col,3));
  es.add(new T.Mesh(g,new T.MeshBasicMaterial({side:T.BackSide,vertexColors:true})));
  if(noche<0.5){var sl=new T.Mesh(new T.SphereGeometry(4,8,6),new T.MeshBasicMaterial({color:new T.Color(4,3.6,3)})); sl.position.set(-30,30,12); es.add(sl);}
  var rt=this.pmrem.fromScene(es,0.04);
  if(this.env)this.env.dispose(); this.env=rt; this.escena.environment=rt.texture;
  this.M.agua.envMap=rt.texture; this.M.cristal.envMap=rt.texture; this.M.brillo.envMap=rt.texture;
  g.dispose(); es.children.forEach(function(o){o.material.dispose(); if(o.geometry!==g)o.geometry.dispose();});
};

/* ---------- trozos de 16×16 casillas: terreno (fijo) y contenido (cambia con la ciudad) ---------- */
V.terreno=function(kx,ky){
  var api=this.api, N1=CH+1, pos=new Float32Array(N1*N1*3), nor=new Float32Array(N1*N1*3), col=new Float32Array(N1*N1*3), uv=new Float32Array(N1*N1*2), idx=[];
  var tc={}, hayAgua=false, self=this;
  function colT(x,y){ var k=x+","+y; if(tc[k])return tc[k];
    var t=api.terr(x,y), c;
    if(t==="w"){ var hondo=api.terr(x+1,y)==="w"&&api.terr(x-1,y)==="w"&&api.terr(x,y+1)==="w"&&api.terr(x,y-1)==="w"; c=lin(hondo?"#3d4a3e":"#9c8a5e"); }
    else { var playa=api.terr(x+1,y)==="w"||api.terr(x-1,y)==="w"||api.terr(x,y+1)==="w"||api.terr(x,y-1)==="w";
      var v=ruido(x,y,7,api.seed()), v2=ruido(x,y,3,api.seed()+5);
      if(playa)c=mezclaL(lin("#e3d39c"),lin("#d6c487"),hs(x,y,3));
      else if(t==="f")c=mezclaL(lin("#2f5a2c"),lin("#466f36"),v*0.7+v2*0.3);
      else{ c=mezclaL(lin("#4f9440"),lin("#86b955"),v); if(v2>0.78)c=mezclaL(c,lin("#b4b866"),(v2-0.78)*2); } }
    return (tc[k]=c); }
  function H(i,j){ var h=api.vert(i,j)*LV; if(h<=0&&api.terr(i-1,j-1)==="w"&&api.terr(i,j-1)==="w"&&api.terr(i-1,j)==="w"&&api.terr(i,j)==="w")h=-0.35; return h; }
  for(var i=0;i<N1;i++)for(var j=0;j<N1;j++){
    var wx=kx*CH+i, wy=ky*CH+j, q=(i*N1+j), h=H(wx,wy);
    pos[q*3]=wx-0.5; pos[q*3+1]=h; pos[q*3+2]=wy-0.5;
    var nx=(H(wx-1,wy)-H(wx+1,wy))/2, nz=(H(wx,wy-1)-H(wx,wy+1))/2, l=Math.sqrt(nx*nx+1+nz*nz);
    nor[q*3]=nx/l; nor[q*3+1]=1/l; nor[q*3+2]=nz/l;
    var a=colT(wx-1,wy-1), b=colT(wx,wy-1), c=colT(wx-1,wy), d=colT(wx,wy);
    col[q*3]=(a[0]+b[0]+c[0]+d[0])/4; col[q*3+1]=(a[1]+b[1]+c[1]+d[1])/4; col[q*3+2]=(a[2]+b[2]+c[2]+d[2])/4;
    uv[q*2]=wx/ESC.terreno; uv[q*2+1]=wy/ESC.terreno;
    if(i<CH&&j<CH){ if(api.terr(wx,wy)==="w")hayAgua=true; var v00=q, v10=(i+1)*N1+j, v01=i*N1+j+1, v11=(i+1)*N1+j+1; idx.push(v00,v11,v10, v00,v01,v11); }
  }
  var g=new T.BufferGeometry(); g.setAttribute("position",new T.BufferAttribute(pos,3)); g.setAttribute("normal",new T.BufferAttribute(nor,3));
  g.setAttribute("color",new T.BufferAttribute(col,3)); g.setAttribute("uv",new T.BufferAttribute(uv,2)); g.setIndex(idx);
  var m=new T.Mesh(g,this.M.terreno); m.receiveShadow=true;
  var grupo=new T.Group(); grupo.add(m);
  if(hayAgua){ var ga=new T.PlaneGeometry(CH,CH); ga.rotateX(-Math.PI/2); ga.translate(kx*CH-0.5+CH/2,WY,ky*CH-0.5+CH/2);
    var uva=ga.attributes.uv; for(var u=0;u<uva.count;u++)uva.setXY(u,(kx*CH+uva.getX(u)*CH)/8,(ky*CH+uva.getY(u)*CH)/8);
    var ma=new T.Mesh(ga,this.M.agua); ma.receiveShadow=true; grupo.add(ma); }
  return grupo;
};
/* la huella de lo que hay en un trozo: si cambia, se vuelve a construir */
V.firma=function(kx,ky){
  var api=this.api, h=17;
  for(var x=-1;x<=CH;x++)for(var y=-1;y<=CH;y++){ var c=api.celda(kx*CH+x,ky*CH+y); if(!c)continue;
    h=Math.imul(h,31)+((c.t?c.t.charCodeAt(0):1)*7+c.l*3+c.rq*131+(c.cable?977:0)+c.era*4099+(c.dentro?7919:0))|0; }
  return h;
};
V.contenido=function(kx,ky){
  var api=this.api, L=new Lotes(), meta={humo:[],brillo:[],molino:[],cables:[]}, M=this.M;
  for(var x=0;x<CH;x++)for(var y=0;y<CH;y++){
    var wx=kx*CH+x, wy=ky*CH+y, c=api.celda(wx,wy), ter=api.terr(wx,wy);
    var es=[api.vert(wx,wy),api.vert(wx+1,wy),api.vert(wx+1,wy+1),api.vert(wx,wy+1)], n=hs(wx,wy,7);
    var t=c&&c.t;
    if(t==="c"){ calle(L,meta,wx,wy,es,c.era,api.conCalle(wx,wy),n); }
    else if(t&&"RCI".indexOf(t)>=0&&!c.l){ lote(L,wx,wy,es,t); }
    else if(t){
      var mx=Math.max(es[0],es[1],es[2],es[3]), mn=Math.min(es[0],es[1],es[2],es[3]), yb=mx*LV;
      if(mx>mn)caja(L,"cimiento","cimiento",wx,wy,0.99,0.99,mn*LV-0.06,(mx-mn)*LV+0.06,lin("#a88a5e"),lin("#9a8a6a"),0,0);
      var o=new Obra(L,meta,wx,wy,yb,n,(wx*928371+wy*1237)|0), vari=Math.floor(n*4)%4;
      if(t==="R")viviendas(o,c.l,c.era,c.rq,vari,n);
      else if(t==="C")comercio(o,c.l,c.era,c.rq,vari,n);
      else if(t==="I")industria(o,c.l,c.era,n);
      else servicio(o,t,c.era,n);
    }
    else if(ter==="f"){ var hm=(es[0]+es[1]+es[2]+es[3])/4*LV, k2=hs(wx,wy,5);
      arbol(L,wx-0.18+k2*0.12,hm,wy-0.15,1.15,(wx*31+wy*17)|0,k2<0.55?1:0);
      if(k2>0.3)arbol(L,wx+0.22,hm,wy+0.2-k2*0.1,0.95,(wx*13+wy*7)|0,k2<0.75?0:1); }
    else if(ter==="g"&&!c&&hs(wx,wy,9)<0.035){ arbol(L,wx,(es[0]+es[1]+es[2]+es[3])/4*LV,wy,0.85,(wx*7+wy*29)|0,hs(wx,wy,5)<0.4?1:0); }
    if(c&&c.cable){ var ht=(c.t&&c.t!=="c"?Math.max(es[0],es[1],es[2],es[3]):(es[0]+es[1]+es[2]+es[3])/4)*LV, px=wx+0.3, pz=wy-0.3;
      cil(L,"madera",null,px,pz,0.018,ht,P(12),lin("#6b4f36"),null,5); caja(L,"madera",null,px,pz,0.16,0.02,ht+P(12)-0.03,0.02,lin("#5d4037"),null,0,0);
      meta.cables.push([wx,wy,px,ht+P(12),pz]); }
  }
  var grupo=new T.Group(), self=this;
  Object.keys(L.m).forEach(function(k){ var b=L.m[k]; if(!b.p.length)return;
    var g=new T.BufferGeometry(); g.setAttribute("position",new T.Float32BufferAttribute(b.p,3)); g.setAttribute("normal",new T.Float32BufferAttribute(b.n,3));
    g.setAttribute("uv",new T.Float32BufferAttribute(b.u,2)); g.setAttribute("color",new T.Float32BufferAttribute(b.c,3));
    var mesh=new T.Mesh(g,M[k]); var plano=k==="asfalto"||k==="adoquin"||k==="tierra"||k==="acera"||k==="marca"||k==="marcaLuz"||k==="lote";
    mesh.castShadow=!plano&&k!=="luz"; mesh.receiveShadow=k!=="luz"&&k!=="marcaLuz"; grupo.add(mesh); });
  /* los cables del tendido: de poste a poste (o al edificio), con una curva */
  if(meta.cables.length){ var pts=[];
    meta.cables.forEach(function(cb){ [[1,0],[0,1],[-1,0],[0,-1]].forEach(function(v){ var o=api.celda(cb[0]+v[0],cb[1]+v[1]); if(!o)return;
      var otro=meta.cables.filter(function(q){return q[0]===cb[0]+v[0]&&q[1]===cb[1]+v[1];})[0];
      if(otro&&(v[0]<0||v[1]<0))return; if(!otro&&!(o.t&&o.t!=="c")&&!o.cable)return;
      var x2, y2, z2; if(otro){x2=otro[2]; y2=otro[3]; z2=otro[4];} else if(o.cable){x2=cb[2]+v[0]; y2=cb[3]; z2=cb[4]+v[1];} else {x2=cb[0]+v[0]; y2=api.altura(cb[0]+v[0],cb[1]+v[1])*LV+P(7); z2=cb[1]+v[1];}
      var px=cb[2], py=cb[3], pz=cb[4];
      for(var s=0;s<4;s++){ var f0=s/4, f1=(s+1)/4, sag=function(f){return -0.06*4*f*(1-f);};
        pts.push(px+(x2-px)*f0,py+(y2-py)*f0+sag(f0),pz+(z2-pz)*f0, px+(x2-px)*f1,py+(y2-py)*f1+sag(f1),pz+(z2-pz)*f1); } }); });
    if(pts.length){ var gl=new T.BufferGeometry(); gl.setAttribute("position",new T.Float32BufferAttribute(pts,3)); grupo.add(new T.LineSegments(gl,M.cable)); } }
  grupo.userData.meta=meta;
  return grupo;
};
V.trozo=function(kx,ky){
  var k=kx+","+ky, t=this.trozos[k];
  if(!t){ t=this.trozos[k]={kx:kx,ky:ky,ter:null,con:null,firma:null,uso:0,g:new T.Group()}; this.nTrozos++; }
  t.uso=this.marco; return t;
};
V.libera=function(o){ o.traverse(function(x){ if(x.geometry)x.geometry.dispose(); }); };
V.limpia=function(){
  if(this.nTrozos<=110)return;
  var self=this, ks=Object.keys(this.trozos).filter(function(k){return !self.vistos[k];}).sort(function(a,b){return self.trozos[a].uso-self.trozos[b].uso;});
  for(var i=0;i<ks.length&&this.nTrozos>80;i++){ var t=this.trozos[ks[i]]; if(t.ter)this.libera(t.ter); if(t.con)this.libera(t.con); delete this.trozos[ks[i]]; this.nTrozos--; }
};

/* ---------- lo que se mueve: humo, luces, molinos y coches ---------- */
function puntos(n,aditivo,mapa){
  var g=new T.BufferGeometry(); g.setAttribute("position",new T.BufferAttribute(new Float32Array(n*3),3)); g.setAttribute("color",new T.BufferAttribute(new Float32Array(n*3),3));
  g.setAttribute("tam",new T.BufferAttribute(new Float32Array(n),1)); g.setAttribute("alfa",new T.BufferAttribute(new Float32Array(n),1)); g.setDrawRange(0,0);
  var m=new T.ShaderMaterial({uniforms:{mapa:{value:mapa},escala:{value:1}},transparent:true,depthWrite:false,blending:aditivo?T.AdditiveBlending:T.NormalBlending,
    vertexShader:"attribute float tam; attribute float alfa; attribute vec3 color; uniform float escala; varying float vA; varying vec3 vC; void main(){ vA=alfa; vC=color; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=tam*escala; }",
    fragmentShader:"uniform sampler2D mapa; varying float vA; varying vec3 vC; void main(){ vec4 t=texture2D(mapa,gl_PointCoord); gl_FragColor=vec4(vC,t.a*vA); if(gl_FragColor.a<0.01) discard; }"});
  var p=new T.Points(g,m); p.frustumCulled=false; p.renderOrder=10; return p;
}
V.dinamicos=function(){
  var pl=new T.CanvasTexture(texPluma());
  this.humoP=puntos(900,false,pl); this.escena.add(this.humoP);
  this.luzP=puntos(1200,true,pl); this.escena.add(this.luzP);
  /* las aspas de los molinos: tres palas que giran */
  var pal=[], L=new Lotes();
  for(var k=0;k<3;k++){ var a=k*Math.PI*2/3, ca=Math.cos(a), sa=Math.sin(a), w=0.025, l=P(15);
    quad(L,"solido",[0,ca*0-sa*(-w),sa*0+ca*(-w)],[0,ca*l-sa*(-w*0.4),sa*l+ca*(-w*0.4)],[0,ca*l-sa*(w*0.4),sa*l+ca*(w*0.4)],[0,ca*0-sa*w,sa*0+ca*w],[0,0],[1,0],[1,1],[0,1],lin("#f5f7fa"),[1,0,0]);
    quad(L,"solido",[0,ca*0-sa*(-w),sa*0+ca*(-w)],[0,ca*l-sa*(-w*0.4),sa*l+ca*(-w*0.4)],[0,ca*l-sa*(w*0.4),sa*l+ca*(w*0.4)],[0,ca*0-sa*w,sa*0+ca*w],[0,0],[1,0],[1,1],[0,1],lin("#f5f7fa"),[-1,0,0]); }
  var b=L.m.solido, ga=new T.BufferGeometry(); ga.setAttribute("position",new T.Float32BufferAttribute(b.p,3)); ga.setAttribute("normal",new T.Float32BufferAttribute(b.n,3)); ga.setAttribute("color",new T.Float32BufferAttribute(b.c,3)); ga.setAttribute("uv",new T.Float32BufferAttribute(b.u,2));
  this.aspas=new T.InstancedMesh(ga,this.M.solido,80); this.aspas.count=0; this.aspas.frustumCulled=false; this.escena.add(this.aspas);
  /* coches: carrocería y cabina */
  var cuerpo=new T.BoxGeometry(1,1,1); cuerpo.translate(0,0.5,0);
  var mc=new T.MeshStandardMaterial({roughness:0.35,metalness:0.4}), mv=new T.MeshStandardMaterial({color:0x22313f,roughness:0.15,metalness:0.6});
  this.cocheA=new T.InstancedMesh(cuerpo,mc,64); this.cocheB=new T.InstancedMesh(cuerpo,mv,64);
  [this.cocheA,this.cocheB].forEach(function(m){m.count=0; m.frustumCulled=false; m.castShadow=false; m.receiveShadow=true;}, this);
  this.escena.add(this.cocheA); this.escena.add(this.cocheB);
  this.cocheA.setColorAt(0,new T.Color(1,1,1));
};
V.mueve=function(t,noche,era,coches){
  var vis=[], self=this; Object.keys(this.vistos).forEach(function(k){var tr=self.trozos[k]; if(tr&&tr.con)vis.push(tr.con.userData.meta);});
  /* humo: cada chimenea suelta bocanadas que suben, crecen y se desvanecen */
  var hp=this.humoP.geometry, P3=hp.attributes.position.array, Ct=hp.attributes.color.array, Tm=hp.attributes.tam.array, Al=hp.attributes.alfa.array, n=0;
  var gris=mezclaL([0.85,0.85,0.85],[0.12,0.13,0.16],noche);
  vis.forEach(function(m){ for(var i=0;i<m.humo.length&&n<890;i+=5){ for(var k=0;k<6&&n<900;k++){
    var f=((t/3200)+k/6+m.humo[i+4]*3)%1, osc=m.humo[i+3];
    P3[n*3]=m.humo[i]+f*0.35; P3[n*3+1]=m.humo[i+1]+f*0.9; P3[n*3+2]=m.humo[i+2]-f*0.12;
    var c=osc?escalaL(gris,0.7):gris; Ct[n*3]=c[0]; Ct[n*3+1]=c[1]; Ct[n*3+2]=c[2];
    Tm[n]=0.1+f*0.32; Al[n]=(f<0.15?f/0.15:1-(f-0.15)/0.85)*(osc?0.55:0.4); n++; } } });
  hp.setDrawRange(0,n); ["position","color","tam","alfa"].forEach(function(a){hp.attributes[a].needsUpdate=true;});
  /* luces: farolas de noche, balizas que parpadean, sirenas y la fuente */
  var lp=this.luzP.geometry, Lp=lp.attributes.position.array, Lc=lp.attributes.color.array, Lt=lp.attributes.tam.array, La=lp.attributes.alfa.array, q=0;
  vis.forEach(function(m){ for(var i=0;i<m.brillo.length&&q<1150;i+=7){ var tipo=m.brillo[i+6], a=0, tam=0.25;
    if(tipo===6||tipo===4){a=noche*(tipo===4?0.9:0.8); tam=tipo===6?0.42:0.18;}
    else if(tipo===1){a=Math.floor(t/600+i)%2?0.95:0.15; tam=0.22;}
    else if(tipo===2||tipo===3){a=(Math.floor(t/300)%2===(tipo===2?0:1))?0.9:0.1; tam=0.2;}
    else if(tipo===5){a=0.35+0.15*Math.sin(t/180); tam=0.22;}
    if(a<0.02)continue;
    Lp[q*3]=m.brillo[i]; Lp[q*3+1]=m.brillo[i+1]; Lp[q*3+2]=m.brillo[i+2]; Lc[q*3]=m.brillo[i+3]; Lc[q*3+1]=m.brillo[i+4]; Lc[q*3+2]=m.brillo[i+5]; Lt[q]=tam; La[q]=a; q++; } });
  /* faros de los coches de noche */
  if(noche>0.3&&era>=3)coches.forEach(function(c){ if(q>=1195)return; Lp[q*3]=c.x+c.dx*0.12; Lp[q*3+1]=c.y+0.05; Lp[q*3+2]=c.z+c.dz*0.12; Lc[q*3]=1; Lc[q*3+1]=0.95; Lc[q*3+2]=0.8; Lt[q]=0.16; La[q]=noche*0.8; q++; });
  lp.setDrawRange(0,q); ["position","color","tam","alfa"].forEach(function(a){lp.attributes[a].needsUpdate=true;});
  /* molinos */
  var mm=new T.Matrix4(), ro=new T.Matrix4(), na=0, ej=new T.Vector3(1,0,1).normalize(), gira=new T.Matrix4().makeRotationY(-Math.PI/4);
  vis.forEach(function(m){ for(var i=0;i<m.molino.length&&na<80;i+=4){ ro.makeRotationAxis(ej,t/500+m.molino[i+3]*6); mm.copy(ro).multiply(gira); mm.setPosition(m.molino[i],m.molino[i+1],m.molino[i+2]); self.aspas.setMatrixAt(na++,mm); } });
  this.aspas.count=na; this.aspas.instanceMatrix.needsUpdate=true;
  /* coches: de la carreta al coche eléctrico */
  var nc=0, q4=new T.Quaternion(), sc=new T.Vector3(), po=new T.Vector3(), col=new T.Color(), up=new T.Vector3(0,1,0);
  coches.forEach(function(c){ if(nc>=64)return; var ang=Math.atan2(-c.dz,c.dx); q4.setFromAxisAngle(up,ang);
    var largo=era<=1?0.2:0.17, ancho=era<=1?0.09:0.085, alto=era<=1?0.05:0.045;
    po.set(c.x,c.y,c.z); sc.set(largo,alto,ancho); mm.compose(po,q4,sc); self.cocheA.setMatrixAt(nc,mm);
    col.set(era<=1?"#8d6e63":era===2?"#3e2723":era===3?"#212121":c.col); self.cocheA.setColorAt(nc,col);
    po.set(c.x-c.dx*0.015,c.y+alto,c.z-c.dz*0.015); sc.set(largo*0.55,era<=2?0.0001:alto*0.75,ancho*0.85); mm.compose(po,q4,sc); self.cocheB.setMatrixAt(nc,mm); nc++; });
  this.cocheA.count=nc; this.cocheB.count=nc; this.cocheA.instanceMatrix.needsUpdate=true; this.cocheB.instanceMatrix.needsUpdate=true; if(this.cocheA.instanceColor)this.cocheA.instanceColor.needsUpdate=true;
  this.humoP.material.uniforms.escala.value=this.luzP.material.uniforms.escala.value=this.k*this.pr;
};

/* ---------- un cuadro ---------- */
V.dibuja=function(o){
  var t0=performance.now(), W=o.W, H=o.H, c=o.cam, self=this; this.marco++;
  /* tamaño del lienzo y calidad (se ajusta sola si el teléfono va lento) */
  var pr=this.pr; if(this.cv.width!==Math.round(W*pr)||this.cv.height!==Math.round(H*pr)){ this.r.setPixelRatio(pr); this.r.setSize(W,H,false); this.r.shadowMap.needsUpdate=true; }
  this.ponCamara(c,W,H);
  /* la luz del día: el sol sale, cruza y se pone; de noche, la luna */
  var luz=Math.sin(o.t/40000*Math.PI*2*0.25), noche=o.capa?0:Math.max(0,Math.min(1,(-luz+0.25)/0.9)), tarde=o.capa?0:Math.max(0,1-Math.abs(luz-0.05)/0.35)*(1-noche);
  /* el sol: alto a mediodía (unos 45°) y bajo al amanecer y al atardecer, desde arriba a la izquierda como en el dibujo 2D; las sombras caen hacia la derecha */
  var alt=Math.max(0,Math.min(1,luz*0.8+0.2)), dir=new T.Vector3(-0.78,0.3+0.6*alt,0.5+0.2*Math.cos(o.t/40000*Math.PI*0.5)).normalize();
  this.sol.color.set(0xfff2dc).lerp(new T.Color(0xff9a52),tarde).lerp(new T.Color(0x8fa6d8),noche);
  this.sol.intensity=3.0*(1-noche)+1.1*noche; this.hemi.intensity=0.35*(1-noche)+0.55*noche;
  this.hemi.color.set(0xdbeeff).lerp(new T.Color(0x5868a8),noche);
  this.cielo(noche,tarde);
  var ilum=0.25+1.6*noche; ["estuco","ladrillo","piedra","madera","oficina","cristal"].forEach(function(k){self.M[k].emissiveIntensity=k==="cristal"?ilum*0.8:ilum;});
  if(noche<0.05)["estuco","ladrillo","piedra","madera","oficina","cristal"].forEach(function(k){self.M[k].emissiveIntensity=0;});
  this.r.toneMappingExposure=1.0+0.35*noche;
  this.M.agua.normalMap.offset.set(o.t*0.000012,o.t*0.000007);
  /* qué trozos se ven (con margen abajo para lo alto de las colinas y los edificios) */
  var ix0=c.x-W/2/c.z-40, ix1=c.x+W/2/c.z+40, iy0=c.y-H/2/c.z-20, iy1=c.y+H/2/c.z+140;
  var a=ix0/HW, b=iy0/HH, a2=ix1/HW, b2=iy1/HH, xs=[(a+b)/2,(a2+b)/2,(a+b2)/2,(a2+b2)/2], ys=[(b-a)/2,(b-a2)/2,(b2-a)/2,(b2-a2)/2];
  var kx0=Math.floor(Math.min.apply(null,xs)/CH), kx1=Math.floor(Math.max.apply(null,xs)/CH), ky0=Math.floor(Math.min.apply(null,ys)/CH), ky1=Math.floor(Math.max.apply(null,ys)/CH);
  var vistos={}, presupuesto=t0+(this.marco<3?60:9), cambio=false, firmar=t0-this.ultFirma>250;
  if(firmar)this.ultFirma=t0;
  for(var kx=kx0;kx<=kx1;kx++)for(var ky=ky0;ky<=ky1;ky++){
    /* fuera de la franja que se ve en pantalla (el rombo del trozo) */
    var cxI=((kx-ky)*CH)*HW, cyI=((kx+ky)*CH+CH)*HH; if(cxI+CH*HW<ix0||cxI-CH*HW>ix1||cyI-CH*HH-80>iy1||cyI+CH*HH<iy0)continue;
    var tr=this.trozo(kx,ky), k=kx+","+ky; vistos[k]=1;
    if(!tr.ter&&performance.now()<presupuesto){ tr.ter=this.terreno(kx,ky); tr.g.add(tr.ter); cambio=true; }
    var ciudad=this.api.cubre(kx,ky);
    if(tr.ter&&(!tr.con||(ciudad&&firmar))){
      var f=ciudad?this.firma(kx,ky):0;
      if((!tr.con||f!==tr.firma)&&performance.now()<presupuesto){ if(tr.con){tr.g.remove(tr.con); this.libera(tr.con);} tr.con=this.contenido(kx,ky); tr.firma=f; tr.g.add(tr.con); cambio=true; }
    }
    if(!tr.g.parent)this.grupo.add(tr.g);
  }
  var self2=this; Object.keys(this.vistos).forEach(function(k){ if(!vistos[k]){var tr=self2.trozos[k]; if(tr&&tr.g.parent)self2.grupo.remove(tr.g);} });
  this.vistos=vistos; this.limpia();
  this.mueve(o.t,noche,o.era,o.coches||[]);
  /* las sombras: el sol cubre lo que se ve; se recalculan al mover la cámara, al cambiar la ciudad y cada medio segundo */
  var ck=Math.round(c.x)+","+Math.round(c.y)+","+c.z.toFixed(3)+","+W+","+H;
  if(cambio||ck!==this.camPrev||t0-this.ultSombra>500){
    this.camPrev=ck; this.ultSombra=t0;
    var sol=this.sol, cen=this.centro, rad=Math.max(W,H)/this.k*0.85+2;
    sol.position.copy(cen).addScaledVector(dir,60); sol.target.position.copy(cen); sol.target.updateMatrixWorld();
    var sc=sol.shadow.camera; sc.left=-rad; sc.right=rad; sc.top=rad; sc.bottom=-rad; sc.near=1; sc.far=200; sc.updateProjectionMatrix();
    this.r.shadowMap.needsUpdate=true;
  }
  this.r.render(this.escena,this.cam);
  /* calidad automática: si cada cuadro tarda mucho, menos píxeles; si sobra tiempo, más */
  var dt=performance.now()-t0; this.tiempos.push(dt); if(this.tiempos.length>40)this.tiempos.shift();
  if(t0-this.ultAjuste>2500&&this.tiempos.length>=40){ var med=this.tiempos.reduce(function(s,x){return s+x;},0)/this.tiempos.length; this.ultAjuste=t0;
    if(med>28&&this.pr>1){this.pr=Math.max(1,this.pr-0.25);} else if(med<12&&this.pr<this.prMax){this.pr=Math.min(this.prMax,this.pr+0.25);} }
};
V.destruye=function(){
  var self=this; Object.keys(this.trozos).forEach(function(k){var t=self.trozos[k]; if(t.ter)self.libera(t.ter); if(t.con)self.libera(t.con);});
  this.trozos={}; if(this.env)this.env.dispose(); this.pmrem.dispose();
  Object.keys(this.M).forEach(function(k){var m=self.M[k]; if(m&&m.dispose){ ["map","roughnessMap","emissiveMap","normalMap"].forEach(function(p){if(m[p])m[p].dispose();}); m.dispose(); }});
  this.r.dispose(); try{this.r.forceContextLoss();}catch(e){}
};

window.AxCiudad3D={carga:carga,soporta:soporta,crea:function(lienzoGL,api){ if(!T)T=window.THREE; return new Vista(lienzoGL,api); },LV:LV,PX:PX};
})();
