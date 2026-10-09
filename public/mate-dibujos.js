/* ===========================================================
   THE FINAL TEST · Matemática Montessori · los dibujos
   -----------------------------------------------------------
   El material Montessori dibujado en SVG y HTML: perlas doradas,
   escalera de perlas, números de lija, juego de sellos, círculos de
   fracciones, tablero de multiplicar, balanza algebraica, fichas
   de álgebra, el plano… Y la escena de cada etapa, que se llena de
   dibujos a medida que se dominan sus conceptos.
     AxMateDibujos.vis(v)          el material de un ejercicio (HTML)
     AxMateDibujos.escena(e,prog)  la escena de la etapa e (SVG)
     AxMateDibujos.pastelSVG(n,d,activo)
   =========================================================== */
(function(){
"use strict";
var M=window.AxMate;
if(!M)return;
var UID=0;
function uid(){return "mtd"+(++UID);}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function svg(w,h,inner,cls,label){return '<svg class="mt-svg '+(cls||"")+'" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'" role="img" aria-label="'+esc(label||"material")+'">'+inner+'</svg>';}
function f1(x){return Math.round(x*10)/10;}
var nt=M.nt;
/* los colores de la escalera de perlas Montessori */
var CUENTA={1:"#e53935",2:"#43a047",3:"#ec407a",4:"#fdd835",5:"#4fc3f7",6:"#9575cd",7:"#eeeeee",8:"#8d6e63",9:"#283593",10:"#f9a825"};
function colorDe(n){return CUENTA[n]||"#f9a825";}

/* ---------- piezas sueltas ---------- */
function emos(n,e,cls,cols){var s="";for(var i=0;i<n;i++)s+='<span>'+e+'</span>';
  return '<div class="mt-emos '+(cls||"")+'"'+(cols?' style="--cols:'+cols+'"':'')+'>'+s+'</div>';}
function perla(x,y,r,c,trazo){return '<circle cx="'+f1(x)+'" cy="'+f1(y)+'" r="'+r+'" fill="'+c+'" stroke="'+(trazo||"rgba(0,0,0,.28)")+'" stroke-width=".8"/>';}
function oro(){var id=uid(); return {id:id,def:'<defs><radialGradient id="'+id+'" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#fff3b0"/><stop offset=".55" stop-color="#f6c343"/><stop offset="1" stop-color="#b7791f"/></radialGradient></defs>'};}
function poligono(k,cx,cy,r,rot){var p=[];for(var i=0;i<k;i++){var a=rot+i*2*Math.PI/k;p.push(f1(cx+r*Math.cos(a))+","+f1(cy+r*Math.sin(a)));}return p.join(" ");}

/* ---------- material por tipo ---------- */
var V={};
V.objetos=function(v){return emos(v.n,v.e,"grande",5);};
V.numeral=function(v){return '<div class="mt-lija" aria-label="número '+v.n+'"><b>'+v.n+'</b></div>';};
V.dosgrupos=function(v){return '<div class="mt-dos"><div>'+emos(v.a,v.e,"",2)+'</div><div>'+emos(v.b,v.e,"",2)+'</div></div>';};
V.forma=function(v){
  var c=v.c, f=v.f, s='';
  if(f==="circulo")s='<circle cx="60" cy="60" r="48"/>';
  else if(f==="cuadrado")s='<rect x="16" y="16" width="88" height="88"/>';
  else if(f==="triangulo")s='<polygon points="60,10 110,104 10,104"/>';
  else if(f==="rectangulo")s='<rect x="6" y="30" width="108" height="60"/>';
  else if(f==="ovalo")s='<ellipse cx="60" cy="60" rx="54" ry="34"/>';
  else if(f==="rombo")s='<polygon points="60,6 104,60 60,114 16,60"/>';
  else if(f==="pentagono")s='<polygon points="'+poligono(5,60,62,52,-Math.PI/2)+'"/>';
  else s='<polygon points="'+poligono(6,60,60,52,0)+'"/>';
  return svg(120,120,'<g fill="'+c+'" stroke="rgba(0,0,0,.35)" stroke-width="3" stroke-linejoin="round">'+s+'</g>',"mt-forma","una forma");
};
V.patron=function(v){return '<div class="mt-serie">'+v.seq.map(function(x){return '<span>'+x+'</span>';}).join("")+'<span class="mt-hueco">?</span></div>';};
V.juntar=function(v){return '<div class="mt-juntar">'+emos(v.a,v.e,"",3)+'<b>+</b>'+emos(v.b,v.e,"",3)+'</div>';};
/* perlas doradas: cuadrados de cien, barras de diez y perlas sueltas */
V.perlas=function(v){
  var g=oro(), R=4.6, P=11, x=6, out=g.def, i, a, b, cien=10*P;
  for(i=0;i<(v.c||0);i++){ for(a=0;a<10;a++)for(b=0;b<10;b++)out+=perla(x+6+b*P,6+6+a*P,R,"url(#"+g.id+")");
    out+='<rect x="'+(x+0.5)+'" y="6.5" width="'+cien+'" height="'+cien+'" rx="3" fill="none" stroke="#b7791f" stroke-width="1"/>'; x+=cien+8; }
  for(i=0;i<(v.d||0);i++){ for(a=0;a<10;a++)out+=perla(x+6,6+6+a*P,R,"url(#"+g.id+")"); out+='<line x1="'+(x+6)+'" y1="10" x2="'+(x+6)+'" y2="'+(cien+2)+'" stroke="#b7791f" stroke-width="1.2" opacity=".6"/>'; x+=15; }
  if(v.d)x+=6;
  for(i=0;i<(v.u||0);i++)out+=perla(x+6+(i%3)*P,6+6+Math.floor(i/3)*P,R,"url(#"+g.id+")");
  if(v.u)x+=3*P+4;
  var w=Math.max(40,x+4);
  return svg(w,cien+12,out,"mt-perlas","perlas doradas");
};
/* escalera de perlas (suma) o gráfico de barras (estadística) */
V.barras=function(v){
  if(v.d){var d=v.d, mx=Math.max.apply(null,d.concat([10])), W=34, H=150, out='';
    out+='<line x1="24" y1="'+H+'" x2="'+(28+d.length*W)+'" y2="'+H+'" stroke="currentColor" opacity=".5"/>';
    for(var k=0;k<=mx;k+=2){var yy=H-k*(H-18)/mx; out+='<text x="18" y="'+f1(yy+4)+'" font-size="10" text-anchor="end" fill="currentColor" opacity=".6">'+k+'</text><line x1="22" y1="'+f1(yy)+'" x2="'+(28+d.length*W)+'" y2="'+f1(yy)+'" stroke="currentColor" opacity=".08"/>';}
    d.forEach(function(x,i){var h=x*(H-18)/mx, X=30+i*W; out+='<rect x="'+X+'" y="'+f1(H-h)+'" width="'+(W-8)+'" height="'+f1(h)+'" rx="3" fill="'+["#42a5f5","#66bb6a","#ffa726","#ab47bc","#ef5350","#26c6da","#8d6e63","#ec407a"][i%8]+'"/>'+
      '<text x="'+(X+(W-8)/2)+'" y="'+f1(H-h-4)+'" font-size="12" font-weight="700" text-anchor="middle" fill="currentColor">'+x+'</text>';});
    return svg(36+d.length*W,H+6,out,"mt-graf","gráfico de barras");}
  var P=17, R=7, out2='', y=14;
  function barra(n,y){var s='', x=10; if(n>10){for(var i=0;i<10;i++)s+=perla(x+i*P,y,R,colorDe(10)); x+=10*P+8; n-=10;}
    for(var j=0;j<n;j++)s+=perla(x+j*P,y,R,colorDe(n)); return s;}
  /* el marco de diez ayuda a completar la decena */
  out2+='<rect x="1" y="2" width="'+(10*P+2)+'" height="'+(2*22+2)+'" rx="8" fill="none" stroke="currentColor" stroke-dasharray="4 4" opacity=".25"/>';
  out2+=barra(v.a,y)+barra(v.b,y+22);
  var w=Math.max(10*P+14,(Math.max(v.a,v.b)>10?10*P+8+(Math.max(v.a,v.b)-10)*P:Math.max(v.a,v.b)*P)+14);
  return svg(w,y+22+12,out2,"mt-escalera","barras de perlas");
};
V.quitar=function(v){var s='';for(var i=0;i<v.n;i++)s+='<span'+(i>=v.n-v.q?' class="fuera"':'')+'>'+v.e+'</span>';
  return '<div class="mt-emos" style="--cols:'+(v.n>10?10:5)+'">'+s+'</div>';};
function minibarras(n){var d=Math.floor(n/10), u=n%10, s='';for(var i=0;i<d;i++)s+='<i class="dz"></i>';for(var j=0;j<u;j++)s+='<i class="un"></i>';return '<div class="mt-mini">'+s+'</div>';}
V.comparar=function(v){return '<div class="mt-comp"><div><b>'+v.a+'</b>'+minibarras(v.a)+'</div><span class="mt-hueco">?</span><div><b>'+v.b+'</b>'+minibarras(v.b)+'</div></div>';};
V.pares=function(v){return emos(v.n,v.e,"pares");};
/* juego de sellos: unidades verdes, decenas azules, centenas rojas */
V.sellos=function(v){
  var L=Math.max(String(v.a).length,String(v.b).length), nom=["U","D","C","UM"], val=["1","10","100","1000"], cls=["u","d","c","m"];
  function fila(n,op){var s=String(n), h='<div class="mt-sfila"><span class="op">'+(op||"")+'</span>';
    for(var p=L-1;p>=0;p--){var dig=+(s[s.length-1-p]||0), t='';for(var i=0;i<dig;i++)t+='<i class="'+cls[p]+'">'+val[p]+'</i>'; h+='<div class="mt-scol">'+t+'</div>';}
    return h+'<b class="num">'+n+'</b></div>';}
  var cab='<div class="mt-sfila cab"><span class="op"></span>';for(var p=L-1;p>=0;p--)cab+='<div class="mt-scol"><small class="'+cls[p]+'">'+nom[p]+'</small></div>';
  return '<div class="mt-sellos">'+cab+'<b class="num"></b></div>'+fila(v.a)+fila(v.b,v.op)+'</div>';
};
V.grupos=function(v){var s='';for(var i=0;i<v.a;i++)s+='<div class="mt-bol">'+emos(v.b,v.e,"chico",3)+'</div>';return '<div class="mt-grupos">'+s+'</div>';};
V.reloj=function(v){
  var c=80, out='<circle cx="80" cy="80" r="74" fill="#fffdf6" stroke="#5d4037" stroke-width="5"/>';
  for(var i=0;i<60;i++){var a=i*Math.PI/30, r1=i%5?66:60; out+='<line x1="'+f1(c+r1*Math.sin(a))+'" y1="'+f1(c-r1*Math.cos(a))+'" x2="'+f1(c+70*Math.sin(a))+'" y2="'+f1(c-70*Math.cos(a))+'" stroke="#5d4037" stroke-width="'+(i%5?1:2.4)+'"/>';}
  for(var h=1;h<=12;h++){var b=h*Math.PI/6; out+='<text x="'+f1(c+50*Math.sin(b))+'" y="'+f1(c-50*Math.cos(b)+6)+'" font-size="16" font-weight="700" text-anchor="middle" fill="#3e2723">'+h+'</text>';}
  var ah=((v.h%12)+v.m/60)*Math.PI/6, am=v.m*Math.PI/30;
  out+='<line x1="80" y1="80" x2="'+f1(c+34*Math.sin(ah))+'" y2="'+f1(c-34*Math.cos(ah))+'" stroke="#1565c0" stroke-width="7" stroke-linecap="round"/>';
  out+='<line x1="80" y1="80" x2="'+f1(c+60*Math.sin(am))+'" y2="'+f1(c-60*Math.cos(am))+'" stroke="#e53935" stroke-width="4" stroke-linecap="round"/><circle cx="80" cy="80" r="5" fill="#3e2723"/>';
  return svg(160,160,out,"mt-reloj","reloj");
};
/* tablero: filas de perlas del color de su número */
V.matriz=function(v){var P=v.c>8||v.f>8?14:17, R=P*0.4, out='';
  for(var i=0;i<v.f;i++)for(var j=0;j<v.c;j++)out+=perla(P/2+2+j*P,P/2+2+i*P,R,colorDe(v.c));
  return svg(v.c*P+4,v.f*P+4,out,"mt-matriz",v.f+" filas de "+v.c);};
V.reparto=function(v){var pl='';for(var i=0;i<v.k;i++)pl+='<div class="mt-plato" data-plato="'+i+'"></div>';
  return '<div class="mt-reparto" data-n="'+v.n+'" data-k="'+v.k+'" data-e="'+esc(v.e)+'"><div class="mt-cesta">'+emos(v.n,v.e,"chico",9)+'</div><div class="mt-platos">'+pl+'</div></div>';};
/* círculo de fracciones; activo: se puede tocar cada parte */
function pastelSVG(n,d,activo,tam){
  var r=58, c=64, out='<circle cx="64" cy="64" r="'+(r+3)+'" fill="#fff" stroke="#9e9e9e" stroke-width="2"/>';
  if(d===1)out+='<circle cx="64" cy="64" r="'+r+'" fill="'+(n?"#e53935":"#fff")+'" stroke="#5d4037" stroke-width="2"'+(activo?' data-i="0" class="mt-parte'+(n?' on':'')+'"':'')+'/>';
  else for(var i=0;i<d;i++){var a0=-Math.PI/2+i*2*Math.PI/d, a1=a0+2*Math.PI/d, gran=(a1-a0)>Math.PI?1:0;
    var p='M64 64 L'+f1(c+r*Math.cos(a0))+' '+f1(c+r*Math.sin(a0))+' A'+r+' '+r+' 0 '+gran+' 1 '+f1(c+r*Math.cos(a1))+' '+f1(c+r*Math.sin(a1))+' Z';
    out+='<path d="'+p+'" fill="'+(i<n?"#e53935":"#fff")+'" stroke="#5d4037" stroke-width="2"'+(activo?' data-i="'+i+'" class="mt-parte'+(i<n?' on':'')+'"':'')+'/>';}
  out+='<circle cx="64" cy="64" r="3" fill="#5d4037"/>';
  return svg(128,128,out,"mt-pastel"+(activo?" activo":""),activo?"círculo para pintar":n+" de "+d+" partes").replace('width="128" height="128"','width="'+(tam||128)+'" height="'+(tam||128)+'"');
}
V.pastel=function(v){return pastelSVG(v.n,v.d,false);};
V.pasteles=function(v){return '<div class="mt-fila">'+pastelSVG(v.a.n,v.a.d,false,110)+'<b class="mt-op">'+(v.op||"=")+'</b>'+pastelSVG(v.b.n,v.b.d,false,110)+'</div>';};
V.rejilla=function(v){var C=v.w>9||v.h>7?20:26, out='', ox=22, oy=20, i, j;
  for(i=0;i<v.h;i++)for(j=0;j<v.w;j++)out+='<rect x="'+(ox+j*C)+'" y="'+(oy+i*C)+'" width="'+C+'" height="'+C+'" fill="'+(v.modo==="area"?"#90caf9":"#f5f5f5")+'" stroke="#90a4ae" stroke-width="1"/>';
  if(v.modo==="perimetro"){out+='<rect x="'+ox+'" y="'+oy+'" width="'+(v.w*C)+'" height="'+(v.h*C)+'" fill="none" stroke="#ef6c00" stroke-width="4" stroke-linejoin="round"/>';
    out+='<text x="'+(ox+v.w*C/2)+'" y="'+(oy-6)+'" font-size="13" font-weight="700" text-anchor="middle" fill="#ef6c00">'+v.w+'</text>';
    out+='<text x="'+(ox-7)+'" y="'+(oy+v.h*C/2+5)+'" font-size="13" font-weight="700" text-anchor="end" fill="#ef6c00">'+v.h+'</text>';}
  return svg(ox+v.w*C+8,oy+v.h*C+8,out,"mt-rejilla",v.w+" por "+v.h);};
V.escena=function(v){return '<div class="mt-ilus" aria-hidden="true">'+v.e+'</div>';};
/* multiplicar por partes: el rectángulo se corta en decenas y unidades */
V.tablero=function(v){
  var a=v.a, b=v.b, out='', W=230, H=110, ox=34, oy=24;
  function caja(x,y,w,h,col,lab){return '<rect x="'+f1(x)+'" y="'+f1(y)+'" width="'+f1(w)+'" height="'+f1(h)+'" fill="'+col+'" stroke="#455a64" stroke-width="1.5"/>'+(lab?'<text x="'+f1(x+w/2)+'" y="'+f1(y+h/2+5)+'" font-size="13" font-weight="700" text-anchor="middle" fill="#263238">'+lab+'</text>':'');}
  if(b<10){var d=Math.floor(a/10)*10, u=a%10, wd=W*d/a, wu=W-wd;
    out+=caja(ox,oy,wd,H,"#bbdefb",d+" × "+b)+(u?caja(ox+wd,oy,wu,H,"#c8e6c9",u+" × "+b):"");
    out+='<text x="'+f1(ox+wd/2)+'" y="'+(oy-7)+'" font-size="13" text-anchor="middle" fill="currentColor">'+d+'</text>'+(u?'<text x="'+f1(ox+wd+wu/2)+'" y="'+(oy-7)+'" font-size="13" text-anchor="middle" fill="currentColor">'+u+'</text>':'');
    out+='<text x="'+(ox-7)+'" y="'+(oy+H/2+5)+'" font-size="13" text-anchor="end" fill="currentColor">'+b+'</text>';}
  else{var bd=Math.floor(b/10)*10, bu=b%10, hd=H*bd/b, hu=H-hd;
    out+=caja(ox,oy,W,hd,"#bbdefb",a+" × "+bd)+(bu?caja(ox,oy+hd,W,hu,"#c8e6c9",a+" × "+bu):"");
    out+='<text x="'+(ox+W/2)+'" y="'+(oy-7)+'" font-size="13" text-anchor="middle" fill="currentColor">'+a+'</text>';
    out+='<text x="'+(ox-7)+'" y="'+f1(oy+hd/2+5)+'" font-size="13" text-anchor="end" fill="currentColor">'+bd+'</text>'+(bu?'<text x="'+(ox-7)+'" y="'+f1(oy+hd+hu/2+5)+'" font-size="13" text-anchor="end" fill="currentColor">'+bu+'</text>':'');}
  return svg(ox+W+8,oy+H+8,out,"mt-tablero","multiplicación por partes");
};
V.divlarga=function(v){var s=String(v.n), cls=["u","d","c","m"], chips='';
  for(var i=0;i<s.length;i++)chips+='<i class="'+cls[s.length-1-i]+'">'+s[i]+'</i>';
  return '<div class="mt-divl"><div class="mt-galera"><span class="dvd">'+chips+'</span><span class="dvs">'+v.k+'</span></div><small>'+v.k+' platos: reparte primero '+(s.length>2?'las centenas, luego las decenas':'las decenas')+' y al final las unidades</small></div>';};
V.cien=function(v){var C=15, out='';for(var i=0;i<100;i++){var f=Math.floor(i/10), c=i%10; out+='<rect x="'+(2+c*C)+'" y="'+(2+f*C)+'" width="'+C+'" height="'+C+'" fill="'+(i<v.n?"#43a047":"#f1f8e9")+'" stroke="#7cb342" stroke-width=".8"/>';}
  return svg(10*C+4,10*C+4,out,"mt-cien",v.n+" de 100");};
V.decimal=function(v){
  function partes(x){var s=nt(Math.abs(x)).split(","); return {e:s[0],d:(s[1]||"")};}
  var A=partes(v.a), B=partes(v.b), E=Math.max(A.e.length,B.e.length), D=Math.max(A.d.length,B.d.length,1);
  function fila(p,op){var h='<div class="mt-dfila"><span class="op">'+(op||"")+'</span>', e=new Array(E-p.e.length+1).join(" ")+p.e, d=p.d+new Array(D-p.d.length+1).join(" ");
    for(var i=0;i<E;i++)h+='<i>'+(e[i]===" "?"":e[i])+'</i>'; h+='<i class="coma">,</i>'; for(var j=0;j<D;j++)h+='<i class="dec">'+(d[j]===" "||!d[j]?"":d[j])+'</i>'; return h+'</div>';}
  var bEs=v.op==="×"&&v.b%1===0;
  return '<div class="mt-decim">'+fila(A)+(bEs?'<div class="mt-dfila"><span class="op">×</span><i class="ent">'+v.b+'</i></div>':fila(B,v.op))+'<div class="mt-dfila linea"></div></div>';
};
V.angulo=function(v){
  var cx=130, cy=126, L=100, g=v.g*Math.PI/180, out='';
  if(v.transp){out+='<path d="M'+(cx-112)+' '+cy+' A112 112 0 0 1 '+(cx+112)+' '+cy+' Z" fill="rgba(255,235,59,.25)" stroke="#f9a825" stroke-width="1.5"/>';
    for(var k=0;k<=180;k+=5){var a=k*Math.PI/180, r1=k%10?104:98; out+='<line x1="'+f1(cx+r1*Math.cos(a))+'" y1="'+f1(cy-r1*Math.sin(a))+'" x2="'+f1(cx+112*Math.cos(a))+'" y2="'+f1(cy-112*Math.sin(a))+'" stroke="#8d6e63" stroke-width="1"/>';
      if(k%30===0)out+='<text x="'+f1(cx+88*Math.cos(a))+'" y="'+f1(cy-88*Math.sin(a)+4)+'" font-size="10" text-anchor="middle" fill="#6d4c41">'+k+'</text>';}}
  out+='<line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+L)+'" y2="'+cy+'" stroke="#1565c0" stroke-width="4" stroke-linecap="round"/>';
  out+='<line x1="'+cx+'" y1="'+cy+'" x2="'+f1(cx+L*Math.cos(g))+'" y2="'+f1(cy-L*Math.sin(g))+'" stroke="#1565c0" stroke-width="4" stroke-linecap="round"/>';
  if(v.g===90)out+='<path d="M'+(cx+18)+' '+cy+' V'+(cy-18)+' H'+cx+'" fill="none" stroke="#e53935" stroke-width="2.5"/>';
  else out+='<path d="M'+(cx+30)+' '+cy+' A30 30 0 '+(v.g>180?1:0)+' 0 '+f1(cx+30*Math.cos(g))+' '+f1(cy-30*Math.sin(g))+'" fill="rgba(229,57,53,.15)" stroke="#e53935" stroke-width="2.5"/>';
  out+='<circle cx="'+cx+'" cy="'+cy+'" r="4" fill="#0d47a1"/>';
  return svg(260,134,out,"mt-angulo","ángulo");
};
/* saltos en la recta: múltiplos; o dos barras para el MCD */
V.saltos=function(v){
  if(v.a){var mx=Math.max(v.a,v.b), W=280, out='';
    [[v.a,"#42a5f5",12],[v.b,"#ffa726",50]].forEach(function(z){var w=W*z[0]/mx; out+='<rect x="10" y="'+z[2]+'" width="'+f1(w)+'" height="26" rx="5" fill="'+z[1]+'"/><text x="'+f1(14+w)+'" y="'+(z[2]+18)+'" font-size="13" font-weight="700" fill="currentColor">'+z[0]+'</text>';});
    return svg(W+50,86,out,"mt-saltos","dos barras");}
  var ks=[v.k].concat(v.k2?[v.k2]:[]), mx2=Math.max(v.k*6,v.k2?v.k2*6:0), W2=320, u=W2/mx2, out2='<line x1="10" y1="60" x2="'+(10+W2)+'" y2="60" stroke="currentColor" stroke-width="2"/>';
  var paso=mx2<=40?1:mx2<=80?2:5;
  for(var t=0;t<=mx2;t+=paso)out2+='<line x1="'+f1(10+t*u)+'" y1="56" x2="'+f1(10+t*u)+'" y2="64" stroke="currentColor" opacity=".5"/>';
  ks.forEach(function(k,ix){var col=ix?"#ef6c00":"#1e88e5";
    for(var x=0;x+k<=mx2;x+=k){var x1=10+x*u, x2=10+(x+k)*u, up=ix===0;
      out2+='<path d="M'+f1(x1)+' 60 Q'+f1((x1+x2)/2)+' '+(up?22:98)+' '+f1(x2)+' 60" fill="none" stroke="'+col+'" stroke-width="2"/>'+
        '<text x="'+f1(x2)+'" y="'+(up?50:80)+'" font-size="11" font-weight="700" text-anchor="middle" fill="'+col+'">'+(x+k)+'</text>';}});
  out2+='<text x="10" y="78" font-size="11" text-anchor="middle" fill="currentColor">0</text>';
  return svg(W2+24,v.k2?104:84,out2,"mt-saltos","saltos en la recta");
};
/* cubitos en perspectiva */
function cubitos(l,w,h,col){
  var s=16, lista=[];
  var cw=s*0.866, ch=s*0.5, pts=[], i, j, k;
  for(i=0;i<l;i++)for(j=0;j<w;j++)for(k=0;k<h;k++)lista.push([i,j,k]);
  lista.sort(function(a,b){return (a[0]+a[1]+a[2])-(b[0]+b[1]+b[2])||a[2]-b[2];});
  function P(x,y,z){return [(x-y)*cw,(x+y)*ch-z*s];}
  var minx=P(0,w,0)[0], maxx=P(l,0,0)[0], miny=P(0,0,h)[1], maxy=P(l,w,0)[1], ox=-minx+4, oy=-miny+4;
  function poly(arr,f){return '<polygon points="'+arr.map(function(p){return f1(p[0]+ox)+","+f1(p[1]+oy);}).join(" ")+'" fill="'+f+'" stroke="rgba(0,0,0,.4)" stroke-width=".8"/>';}
  var out='', c=col||"#ffb74d";
  lista.forEach(function(q){i=q[0];j=q[1];k=q[2];
    out+=poly([P(i,j,k+1),P(i+1,j,k+1),P(i+1,j+1,k+1),P(i,j+1,k+1)],c);
    out+=poly([P(i+1,j,k),P(i+1,j+1,k),P(i+1,j+1,k+1),P(i+1,j,k+1)],sombra(c,0.78));
    out+=poly([P(i,j+1,k),P(i+1,j+1,k),P(i+1,j+1,k+1),P(i,j+1,k+1)],sombra(c,0.9));});
  return svg(f1(maxx-minx+8),f1(maxy-miny+8),out,"mt-cubos",l+" por "+w+" por "+h);
}
function sombra(hex,f){var n=parseInt(hex.slice(1),16); return "rgb("+Math.round((n>>16)*f)+","+Math.round(((n>>8)&255)*f)+","+Math.round((n&255)*f)+")";}
V.cubos=function(v){return cubitos(v.l,v.w,v.h,"#ffb74d");};
V.cubo=function(v){return cubitos(v.n,v.n,v.n,v.n<=10?colorDe(v.n)==="#eeeeee"?"#e0e0e0":colorDe(v.n):"#f9a825");};
/* recta numérica con puntos o con un salto */
V.recta=function(v){
  var W=330, u=W/(v.max-v.min), X=function(x){return 12+(x-v.min)*u;}, out='<line x1="6" y1="70" x2="'+(W+18)+'" y2="70" stroke="currentColor" stroke-width="2"/>';
  for(var t=v.min;t<=v.max;t++){var big=t%5===0; out+='<line x1="'+f1(X(t))+'" y1="'+(big?63:66)+'" x2="'+f1(X(t))+'" y2="'+(big?77:74)+'" stroke="currentColor" opacity="'+(big?.8:.4)+'"/>';
    if(big||(v.max-v.min)<=20)out+='<text x="'+f1(X(t))+'" y="92" font-size="'+(t===0?12:10)+'" font-weight="'+(t===0?700:400)+'" text-anchor="middle" fill="currentColor">'+nt(t)+'</text>';}
  (v.p||[]).forEach(function(p,i){var col=i?"#ef6c00":"#1e88e5"; out+='<circle cx="'+f1(X(p))+'" cy="70" r="7" fill="'+col+'"/><text x="'+f1(X(p))+'" y="'+(i?50:40)+'" font-size="13" font-weight="700" text-anchor="middle" fill="'+col+'">'+nt(p)+'</text>';});
  if(v.salto){var a=v.salto[0], b=a+v.salto[1];
    out+='<circle cx="'+f1(X(a))+'" cy="70" r="6" fill="#1e88e5"/>';
    if(b!==a)out+='<path d="M'+f1(X(a))+' 66 Q'+f1((X(a)+X(b))/2)+' 14 '+f1(X(b))+' 66" fill="none" stroke="#ef6c00" stroke-width="2.5" marker-end="url(#mtFlecha)"/>';}
  return svg(W+24,100,'<defs><marker id="mtFlecha" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#ef6c00"/></marker></defs>'+out,"mt-recta","recta numérica");
};
V.cuadrado=function(v){
  if(v.oculto)return '<div class="mt-cuad-oculto"><span>'+(v.n*v.n)+' perlas</span><i>?</i></div>';
  var P=Math.max(9,Math.min(18,170/v.n)), out='';
  for(var i=0;i<v.n;i++)for(var j=0;j<v.n;j++)out+=perla(P/2+2+j*P,P/2+2+i*P,P*0.42,colorDe(v.n));
  return svg(f1(v.n*P+4),f1(v.n*P+4),out,"mt-matriz","cuadrado de "+v.n);
};
V.tabla=function(v){return '<table class="mt-tabla">'+v.f.map(function(r){return '<tr>'+r.map(function(c,i){return i?'<td'+(c==="?"?' class="mt-hueco"':'')+'>'+esc(c)+'</td>':'<th>'+esc(c)+'</th>';}).join("")+'</tr>';}).join("")+'</table>';};
/* balanza algebraica: bolsitas x y pesas */
V.balanza=function(v){
  var out='<polygon points="160,150 140,180 180,180" fill="#8d6e63"/><rect x="40" y="146" width="240" height="6" rx="3" fill="#5d4037"/>';
  out+='<line x1="60" y1="150" x2="60" y2="112" stroke="#9e9e9e"/><line x1="260" y1="150" x2="260" y2="112" stroke="#9e9e9e"/>';
  out+='<path d="M8 112 h104 l-10 10 h-84z" fill="#90a4ae"/><path d="M208 112 h104 l-10 10 h-84z" fill="#90a4ae"/>';
  var izq='', n=Math.min(v.a,6), bw=20, x0=60-(n*(bw+3)+(v.b?36:0))/2;
  for(var i=0;i<n;i++)izq+='<rect x="'+f1(x0+i*(bw+3))+'" y="82" width="'+bw+'" height="28" rx="7" fill="#7e57c2"/><text x="'+f1(x0+i*(bw+3)+bw/2)+'" y="101" font-size="13" font-weight="700" text-anchor="middle" fill="#fff">x</text>';
  if(v.b)izq+='<rect x="'+f1(x0+n*(bw+3)+2)+'" y="86" width="32" height="24" rx="3" fill="#f9a825"/><text x="'+f1(x0+n*(bw+3)+18)+'" y="103" font-size="12" font-weight="700" text-anchor="middle" fill="#3e2723">'+nt(v.b)+'</text>';
  var der='<rect x="236" y="84" width="48" height="26" rx="3" fill="#f9a825"/><text x="260" y="102" font-size="13" font-weight="700" text-anchor="middle" fill="#3e2723">'+nt(v.c)+'</text>';
  return svg(320,184,out+izq+der,"mt-balanza","balanza en equilibrio");
};
/* fichas de álgebra: x² azules, x verdes, 1 amarillas (rojas si restan) */
V.fichas=function(v){
  function grupo(n,cls,lab){var s='', a=Math.abs(n), m=Math.min(a,20);for(var i=0;i<m;i++)s+='<i class="'+cls+(n<0?" neg":"")+'">'+lab+'</i>'; if(a>20)s+='<b>… '+a+'</b>'; return s;}
  var s='';
  if(v.x2)s+=grupo(v.x2,"x2","x²");
  if(v.x){var q=v.quita||0, h='';for(var i=0;i<Math.abs(v.x);i++)h+='<i class="x'+(v.x<0?" neg":"")+(i>=Math.abs(v.x)-q?" fuera":"")+'">x</i>'; s+=h;}
  if(v.u)s+=grupo(v.u,"u","1");
  return '<div class="mt-fichas">'+s+'</div>';
};
/* plano cartesiano */
V.plano=function(v){
  var R=6; if(v.punto)R=Math.max(R,Math.abs(v.punto[0])+1,Math.abs(v.punto[1])+1); R=Math.min(R,10);
  var S=240, u=S/(2*R), X=function(x){return 10+(x+R)*u;}, Y=function(y){return 10+(R-y)*u;}, id=uid(), out='<defs><clipPath id="'+id+'"><rect x="10" y="10" width="'+S+'" height="'+S+'"/></clipPath></defs>';
  for(var t=-R;t<=R;t++){out+='<line x1="'+f1(X(t))+'" y1="10" x2="'+f1(X(t))+'" y2="'+(10+S)+'" stroke="currentColor" opacity="'+(t?.1:.7)+'"/><line x1="10" y1="'+f1(Y(t))+'" x2="'+(10+S)+'" y2="'+f1(Y(t))+'" stroke="currentColor" opacity="'+(t?.1:.7)+'"/>';
    if(t&&t%2===0)out+='<text x="'+f1(X(t))+'" y="'+f1(Y(0)+13)+'" font-size="9" text-anchor="middle" fill="currentColor" opacity=".7">'+nt(t)+'</text><text x="'+f1(X(0)-4)+'" y="'+f1(Y(t)+3)+'" font-size="9" text-anchor="end" fill="currentColor" opacity=".7">'+nt(t)+'</text>';}
  var lineas=v.lineas||[[v.m,v.b]], cols=["#1e88e5","#ef6c00"];
  lineas.forEach(function(l,i){out+='<line clip-path="url(#'+id+')" x1="'+f1(X(-R-1))+'" y1="'+f1(Y(l[0]*(-R-1)+l[1]))+'" x2="'+f1(X(R+1))+'" y2="'+f1(Y(l[0]*(R+1)+l[1]))+'" stroke="'+cols[i]+'" stroke-width="3"/>';});
  if(v.px!=null)out+='<line x1="'+f1(X(v.px))+'" y1="10" x2="'+f1(X(v.px))+'" y2="'+(10+S)+'" stroke="#43a047" stroke-width="2" stroke-dasharray="5 4"/>';
  if(v.punto)out+='<circle cx="'+f1(X(v.punto[0]))+'" cy="'+f1(Y(v.punto[1]))+'" r="5" fill="#e53935" stroke="#fff" stroke-width="1.5"/>';
  return svg(S+20,S+20,out,"mt-plano","plano cartesiano");
};
V.triangulo=function(v){
  var a=typeof v.a==="number"?v.a:Math.sqrt(v.c*v.c-v.b*v.b), b=typeof v.b==="number"?v.b:Math.sqrt(v.c*v.c-v.a*v.a), k=Math.min(200/b,130/a), W=b*k, H=a*k, ox=34, oy=14;
  var out='<polygon points="'+ox+','+oy+' '+ox+','+f1(oy+H)+' '+f1(ox+W)+','+f1(oy+H)+'" fill="rgba(66,165,245,.18)" stroke="#1565c0" stroke-width="3" stroke-linejoin="round"/>';
  out+='<path d="M'+ox+' '+f1(oy+H-14)+' h14 v14" fill="none" stroke="#1565c0" stroke-width="2"/>';
  out+='<text x="'+(ox-8)+'" y="'+f1(oy+H/2+5)+'" font-size="15" font-weight="700" text-anchor="end" fill="#e53935">'+v.a+'</text>';
  out+='<text x="'+f1(ox+W/2)+'" y="'+f1(oy+H+20)+'" font-size="15" font-weight="700" text-anchor="middle" fill="#e53935">'+v.b+'</text>';
  out+='<text x="'+f1(ox+W/2+12)+'" y="'+f1(oy+H/2-4)+'" font-size="15" font-weight="700" fill="#e53935">'+v.c+'</text>';
  if(v.angulo)out+='<path d="M'+f1(ox+W-26)+' '+f1(oy+H)+' A26 26 0 0 1 '+f1(ox+W-26*Math.cos(Math.atan2(H,W)))+' '+f1(oy+H-26*Math.sin(Math.atan2(H,W)))+'" fill="none" stroke="#ef6c00" stroke-width="2.5"/><text x="'+f1(ox+W-40)+'" y="'+f1(oy+H-6)+'" font-size="13" font-weight="700" fill="#ef6c00">A</text>';
  return svg(f1(ox+W+30),f1(oy+H+28),out,"mt-triangulo","triángulo rectángulo");
};
V.bolsa=function(v){var bolas=[], out='<path d="M40 30 Q20 30 22 70 Q24 130 100 130 Q176 130 178 70 Q180 30 160 30 Q150 18 100 18 Q50 18 40 30Z" fill="#d7ccc8" stroke="#8d6e63" stroke-width="3"/>';
  for(var i=0;i<v.r;i++)bolas.push("#e53935"); for(i=0;i<v.a;i++)bolas.push("#1e88e5"); for(i=0;i<(v.v||0);i++)bolas.push("#43a047");
  bolas.forEach(function(c,i){out+=perla(48+(i%6)*21,52+Math.floor(i/6)*22,9,c,"rgba(0,0,0,.35)");});
  return svg(200,140,out,"mt-bolsa","bolsa con bolitas");};
function dado(n,x,y){var p={1:[[2,2]],2:[[1,1],[3,3]],3:[[1,1],[2,2],[3,3]],4:[[1,1],[1,3],[3,1],[3,3]],5:[[1,1],[1,3],[2,2],[3,1],[3,3]],6:[[1,1],[1,3],[1,2],[3,1],[3,3],[3,2]]}[n], s='<rect x="'+x+'" y="'+y+'" width="44" height="44" rx="9" fill="#fff" stroke="#455a64" stroke-width="2"/>';
  p.forEach(function(q){s+='<circle cx="'+(x+q[0]*11)+'" cy="'+(y+q[1]*11)+'" r="4" fill="#263238"/>';}); return s;}
V.dados=function(v){
  if(v.n===1){var s='';for(var i=1;i<=6;i++)s+=dado(i,4+(i-1)*50,4); return svg(304,52,s,"mt-dados","las seis caras de un dado");}
  var t='<table class="mt-tabla mt-sumas"><tr><th>+</th>';for(var a=1;a<=6;a++)t+='<th>'+a+'</th>'; t+='</tr>';
  for(var b=1;b<=6;b++){t+='<tr><th>'+b+'</th>';for(var c=1;c<=6;c++)t+='<td>'+(b+c)+'</td>';t+='</tr>';}
  return '<div class="mt-fila">'+svg(100,52,dado(3,4,4)+dado(5,52,4),"mt-dados","dos dados")+t+'</table></div>';
};
V.parabola=function(v){
  var a=Math.min(v.r1,v.r2)-2, b=Math.max(v.r1,v.r2)+2, f=function(x){return (x-v.r1)*(x-v.r2);}, vy=f((v.r1+v.r2)/2), top=Math.max(f(a),f(b));
  var W=260, H=170, X=function(x){return 10+(x-a)*W/(b-a);}, Y=function(y){return 10+(top-y)*(H-20)/(top-vy);}, out='', d='';
  out+='<line x1="10" y1="'+f1(Y(0))+'" x2="'+(W+10)+'" y2="'+f1(Y(0))+'" stroke="currentColor" opacity=".7"/>';
  if(a<=0&&b>=0)out+='<line x1="'+f1(X(0))+'" y1="4" x2="'+f1(X(0))+'" y2="'+(H)+'" stroke="currentColor" opacity=".7"/>';
  for(var t=Math.ceil(a);t<=b;t++)out+='<line x1="'+f1(X(t))+'" y1="'+f1(Y(0)-3)+'" x2="'+f1(X(t))+'" y2="'+f1(Y(0)+3)+'" stroke="currentColor"/>'+(t%2===0?'<text x="'+f1(X(t))+'" y="'+f1(Y(0)+14)+'" font-size="9" text-anchor="middle" fill="currentColor" opacity=".7">'+nt(t)+'</text>':'');
  for(var i=0;i<=60;i++){var x=a+(b-a)*i/60; d+=(i?"L":"M")+f1(X(x))+" "+f1(Y(f(x)));}
  out+='<path d="'+d+'" fill="none" stroke="#8e24aa" stroke-width="3"/>';
  return svg(W+20,H+10,out,"mt-parabola","parábola");
};
V.potencias=function(v){var s='<i>1</i>', x=1;for(var i=0;i<v.k;i++){x*=v.b; s+='<b>×'+v.b+'</b><i>'+x+'</i>';} return '<div class="mt-cadena">'+s+'</div>';};
V.sucesion=function(v){return '<div class="mt-cadena">'+v.t2.map(function(t){return '<i>'+nt(t)+'</i>';}).join('<b>→</b>')+'<b>→</b><i class="mt-hueco">?</i></div>';};

function vis(v){var f=V[v&&v.t]; if(!f)return ""; try{return '<div class="mt-vis mt-v-'+v.t+'">'+f(v)+'</div>';}catch(e){return "";}}

/* ---------- la escena de una etapa ----------
   Cada concepto tiene su dibujo: aparece en gris, crece con el avance y
   brilla cuando se domina. Con más conceptos dominados, la escena se
   llena de detalles (flores, árboles, peces, edificios, estrellas…). */
var ADORNO={granja:["🌾","🌼","🏡","🌳","🚜","🌻"],jardin:["🌷","🌼","🌱","🌸","🪴","🌿"],bosque:["🌲","🌳","🍂","🌲","🦌","🍄"],mar:["🌊","🐚","🪸","🌊","⛵","🐬"],
  ciudad:["🏢","🏬","🌳","🏠","🚕","🏫"],montana:["🏔️","🌲","⛰️","🌲","🏕️","🦅"],cielo:["☁️","🎈","☁️","🕊️","🪁","🌈"],espacio:["⭐","🪐","✨","🌍","⭐","☄️"],estrellas:["✨","⭐","🌟","✨","🌙","🌠"]};
function escena(e,prog){
  var E=M.ETAPAS[e], cs=M.deEtapa(e), W=400, H=180, id=uid(), out='', dom=0;
  prog=prog||{};
  cs.forEach(function(c){if(prog[c.id]&&prog[c.id].dom)dom++;});
  var frac=cs.length?dom/cs.length:0, oscuro=e>=7;
  out+='<defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+E.cielo[0]+'"/><stop offset="1" stop-color="'+E.cielo[1]+'"/></linearGradient></defs>';
  out+='<rect width="'+W+'" height="'+H+'" fill="url(#'+id+')"/>';
  var r=M.rng(e*977+13);
  if(oscuro){for(var i=0;i<40;i++)out+='<circle cx="'+f1(r()*W)+'" cy="'+f1(r()*110)+'" r="'+f1(0.6+r()*1.3)+'" fill="#fff" opacity="'+f1(0.4+r()*0.6)+'"/>';
    out+='<circle cx="340" cy="40" r="20" fill="#fff8e1" opacity=".95"/><circle cx="332" cy="34" r="18" fill="'+E.cielo[0]+'" opacity=".55"/>';}
  else{out+='<circle cx="350" cy="38" r="22" fill="#ffd54f"/><circle cx="350" cy="38" r="30" fill="#ffd54f" opacity=".25"/>';
    for(var n=0;n<3;n++){var cx=40+n*110+r()*40, cy=24+r()*24; out+='<g fill="#fff" opacity=".85"><ellipse cx="'+f1(cx)+'" cy="'+f1(cy)+'" rx="26" ry="9"/><ellipse cx="'+f1(cx+12)+'" cy="'+f1(cy-6)+'" rx="15" ry="9"/></g>';}}
  /* el suelo: colinas suaves */
  out+='<path d="M0 118 Q60 98 120 112 T240 108 T400 104 V180 H0Z" fill="'+E.suelo+'"/>';
  out+='<path d="M0 140 Q80 126 170 138 T400 132 V180 H0Z" fill="'+sombra(E.suelo,0.88)+'"/>';
  /* los adornos crecen con el avance de la etapa */
  var ad=ADORNO[E.escena]||ADORNO.granja, cuantos=2+Math.round(frac*10);
  for(var k=0;k<cuantos;k++){var ax=12+r()*376, ay=oscuro?20+r()*80:96+r()*16; if(!oscuro&&k%3===2)ay=60+r()*30;
    out+='<text x="'+f1(ax)+'" y="'+f1(ay)+'" font-size="'+f1(14+r()*8)+'" text-anchor="middle" opacity=".9">'+ad[k%ad.length]+'</text>';}
  /* los dibujos de los conceptos */
  cs.forEach(function(c,i){var p=prog[c.id], av=M.avance(p,c), x=34+i*(332/Math.max(1,cs.length-1)), y=i%2?160:138, tam=f1(24+20*av);
    if(cs.length===1)x=200;
    out+='<g class="mt-sticker'+(p?(p.dom?" dom":" vivo"):" gris")+'" data-c="'+c.id+'"><text x="'+f1(x)+'" y="'+y+'" font-size="'+tam+'" text-anchor="middle">'+c.dibujo+'</text>'+
      (p&&p.dom?'<text x="'+f1(x+13)+'" y="'+(y-18)+'" font-size="12" text-anchor="middle">✨</text>':'')+'</g>';});
  return svg(W,H,out,"mt-escena-svg","escena de "+E.nom).replace('width="400" height="180"','preserveAspectRatio="xMidYMid slice"');
}

window.AxMateDibujos={vis:vis,escena:escena,pastelSVG:pastelSVG,colorDe:colorDe,TIPOS:Object.keys(V)};
})();
