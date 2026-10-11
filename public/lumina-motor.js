/* ===========================================================
   THE FINAL TEST · LuminaPets: El Valle de las Criaturas Mágicas · motor
   -----------------------------------------------------------
   Una mascota virtual educativa para niñas y niños de 4 a 9 años
   (modo Preescolar 4–6 y Primaria inicial 7–9), según el documento
   de diseño del juego:
     1. la mascota pide algo (merienda, baño, jugar, dormir)
     2. un minijuego educativo lo consigue (aprendizaje invisible):
          Cocina de Pociones      matemática y lógica      → 🧁 bocadillos
          Árbol de las Palabras   letras, sonidos y lectura → 🫧 espuma
          Jardín de las Preguntas ciencias, inglés y lógica → 💎 gemas
     3. cuidarla (comer, baño de burbujas, mimos, dormir, vestir)
        llena la barra de «Vínculo Mágico»
     4. con el vínculo lleno llega un huevo sorpresa: se incuba con
        cariño y nace una criatura nueva para la Aldea del Gran Árbol.
   Sin castigos: nadie se enferma ni muere; si las barras llegan a
   cero, la mascota duerme en un «capullo de siesta» y despierta con
   un abrazo. Hábitos reales con PIN familiar, modo noche y puerta
   parental con una cuenta escrita en palabras.
   Sin dependencias propias (usa AxCiencias y AxIngles si están):
   lo usan el navegador, el servidor y las pruebas.
   =========================================================== */
(function(G){
"use strict";
function rng(seed){var a=seed>>>0||1; return function(){a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296;};}
function ri(r,a,b){return a+Math.floor(r()*(b-a+1));}
function pick(r,a){return a[Math.floor(r()*a.length)];}
function baraja(r,a){a=a.slice(); for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;} return a;}
function cap(x){return Math.max(0,Math.min(100,x));}

/* ---------- criaturas ---------- */
var COLORES={lavanda:["#efe6ff","#cbb6f2","#a68ad9"],rosa:["#ffe6f0","#f7b6cf","#e48aae"],menta:["#e3fbf1","#a8e6cc","#6fc9a5"],
  celeste:["#e3f3ff","#a9d6f7","#72b4e6"],durazno:["#fff0e3","#fbc8a1","#ef9f6b"],limon:["#fffbe0","#f7e68c","#e2c54c"]};
var ESPECIES={gato:"Gatito",conejo:"Conejito",zorro:"Zorrito",osito:"Osito"};
var RASGOS={unicornio:"Unicornio",hada:"Hada",estrella:"Estrella",dragon:"Dragón"};
var BIOMAS=[{id:"jardin",nom:"Jardín Hada",ico:"🌸"},{id:"nubes",nom:"Cielo de Nubes",ico:"☁️"},{id:"cristal",nom:"Cueva de Cristal",ico:"💎"}];
var RAREZA=["Común","Especial","Legendaria"];
var CRIATURAS=[
  {id:"lila",esp:"gato",rasgo:null,col:"lavanda",nom:"Lila",bioma:"jardin",rar:0,foto:"lumina/lila.jpg",recorte:"lumina/lila-sola.webp",fondo:"lumina/cuarto.jpg"},
  {id:"mirlu",esp:"gato",rasgo:"unicornio",col:"rosa",nom:"Mirlú",bioma:"nubes",rar:1},
  {id:"petala",esp:"gato",rasgo:"hada",col:"menta",nom:"Pétala",bioma:"jardin",rar:0},
  {id:"astro",esp:"gato",rasgo:"estrella",col:"celeste",nom:"Astro",bioma:"nubes",rar:2},
  {id:"chispa",esp:"gato",rasgo:"dragon",col:"durazno",nom:"Chispa",bioma:"cristal",rar:1},
  {id:"nube",esp:"conejo",rasgo:"unicornio",col:"lavanda",nom:"Nube",bioma:"nubes",rar:1},
  {id:"florita",esp:"conejo",rasgo:"hada",col:"rosa",nom:"Florita",bioma:"jardin",rar:0},
  {id:"luzmi",esp:"conejo",rasgo:"estrella",col:"limon",nom:"Luzmi",bioma:"nubes",rar:0},
  {id:"brasita",esp:"conejo",rasgo:"dragon",col:"menta",nom:"Brasita",bioma:"cristal",rar:1},
  {id:"iris",esp:"zorro",rasgo:"unicornio",col:"celeste",nom:"Iris",bioma:"nubes",rar:1},
  {id:"rocio",esp:"zorro",rasgo:"hada",col:"menta",nom:"Rocío",bioma:"jardin",rar:0},
  {id:"cometa",esp:"zorro",rasgo:"estrella",col:"durazno",nom:"Cometa",bioma:"nubes",rar:0},
  {id:"rubi",esp:"zorro",rasgo:"dragon",col:"rosa",nom:"Rubí",bioma:"cristal",rar:1},
  {id:"algodon",esp:"osito",rasgo:"unicornio",col:"limon",nom:"Algodón",bioma:"nubes",rar:1},
  {id:"miel",esp:"osito",rasgo:"hada",col:"durazno",nom:"Miel",bioma:"jardin",rar:0},
  {id:"polar",esp:"osito",rasgo:"estrella",col:"celeste",nom:"Polar",bioma:"nubes",rar:0},
  {id:"cuarzo",esp:"osito",rasgo:"dragon",col:"lavanda",nom:"Cuarzo",bioma:"cristal",rar:2}
];
/* todas son fotos con el estilo de Lila (recortadas, con fondo transparente) y viven en la misma habitación */
var CON_FOTO={astro:1,chispa:1,cometa:1,florita:1,mirlu:1,nube:1,petala:1,polar:1};
CRIATURAS.forEach(function(c){if(!c.foto&&CON_FOTO[c.id]){c.foto="lumina/criaturas/"+c.id+".webp"; c.recorte=c.foto;} if(c.foto)c.fondo="lumina/cuarto.jpg";});
var POR_ID={}; CRIATURAS.forEach(function(c){POR_ID[c.id]=c;});
function titulo(c){return c.rasgo?ESPECIES[c.esp]+"-"+RASGOS[c.rasgo]:"Gatito lavanda";}

/* accesorios: se ven encima de la mascota (cabeza, ojos, cuello o mano) */
var ACCES=[
  {id:"lazo",nom:"Lazo",ico:"🎀",zona:"cabeza",precio:{polvo:15}},
  {id:"flor",nom:"Flor",ico:"🌸",zona:"cabeza",precio:{polvo:15}},
  {id:"corona",nom:"Corona",ico:"👑",zona:"cabeza",precio:{gema:3}},
  {id:"sombrero",nom:"Sombrero",ico:"🎩",zona:"cabeza",precio:{gema:4}},
  {id:"gafas",nom:"Gafas de sol",ico:"🕶️",zona:"ojos",precio:{polvo:25}},
  {id:"bufanda",nom:"Bufanda",ico:"🧣",zona:"cuello",precio:{polvo:20}},
  {id:"varita",nom:"Varita mágica",ico:"🪄",zona:"mano",precio:{gema:5}},
  {id:"globo",nom:"Globo",ico:"🎈",zona:"mano",precio:{polvo:20}}
];
var ACC={}; ACCES.forEach(function(a){ACC[a.id]=a;});

/* ---------- el estado ---------- */
var HABITOS=[{id:"dientes",nom:"Cepillarme los dientes",ico:"🪥",on:true,veces:2},{id:"lectura",nom:"15 minutos de lectura o dibujo",ico:"📖",on:true,veces:1},
  {id:"juguetes",nom:"Recoger mis juguetes",ico:"🧸",on:true,veces:1},{id:"cama",nom:"Tender mi cama",ico:"🛏️",on:false,veces:1},
  {id:"agua",nom:"Tomar agua",ico:"💧",on:false,veces:1},{id:"ayudar",nom:"Ayudar en casa",ico:"🤝",on:false,veces:1}];
function nuevo(){
  return {v:1,modo:null,activa:"lila",mascotas:[{id:"lila",nom:"Lila",acc:[],nacio:Date.now()}],
    barras:{fel:80,pan:70,bri:75,des:85,t:Date.now()},capullo:false,vinculo:0,
    inv:{polvo:10,bocadillo:1,espuma:1,gema:0},acc:[],huevos:[],niveles:{cocina:0,arbol:0,jardin:0},
    stats:{cocina:{r:0,ok:0,n:0},arbol:{r:0,ok:0,n:0},jardin:{r:0,ok:0,n:0},temas:{}},
    habitos:HABITOS.map(function(h){return {id:h.id,nom:h.nom,ico:h.ico,on:h.on,veces:h.veces};}),hechos:{},pin:null,
    noche:{on:true,desde:"20:30",hasta:"07:00"},dias:{}};
}
/* modo cognitivo: el que eligieron los padres o el que sale del curso del perfil */
function modoDe(g,etapa){return g.modo||(etapa>=1?"pri":"pre");}
function rango(modo){return modo==="pri"?[2,5]:[1,3];}
function nivelDe(g,mod,modo){var r=rango(modo), n=g.niveles[mod]||0; return n?Math.max(r[0],Math.min(r[1],n)):r[0];}

/* las barras bajan despacio con el tiempo (no de noche) y en cero llega el capullo de siesta */
var BAJA={fel:5,pan:6,bri:4,des:4};
function actualiza(g,ahora,noche){
  ahora=ahora||Date.now(); var b=g.barras, h=Math.max(0,(ahora-(b.t||ahora))/3600000);
  if(!noche&&h>0){Object.keys(BAJA).forEach(function(k){b[k]=cap(b[k]-BAJA[k]*h);});}
  b.t=ahora;
  if(!g.capullo&&(b.fel<=0||b.pan<=0||b.bri<=0||b.des<=0))g.capullo=true;
  return g;
}
/* el abrazo que despierta del capullo: bosteza feliz y todo vuelve a un nivel cómodo */
function despierta(g){g.capullo=false; ["fel","pan","bri","des"].forEach(function(k){g.barras[k]=Math.max(g.barras[k],45);}); g.barras.fel=Math.max(g.barras.fel,70);}
/* lo que pide la mascota: la barra más baja (si alguna está bajo 60) */
var NECESIDAD={pan:{ico:"🧁",txt:"¡Tengo hambre! ¿Me preparas una merienda?",mod:"cocina",accion:"comer"},
  bri:{ico:"🫧",txt:"¡Quiero un baño de burbujas!",mod:"arbol",accion:"bano"},
  fel:{ico:"⭐",txt:"¿Jugamos? ¡Quiero aprender algo nuevo contigo!",mod:"jardin",accion:"jugar"},
  des:{ico:"🌙",txt:"Tengo sueñito… ¿me llevas a mi nido de nubes?",mod:null,accion:"dormir"}};
function necesidad(g){
  var b=g.barras, k=["pan","bri","des","fel"].filter(function(x){return b[x]<60;}).sort(function(x,y){return b[x]-b[y];})[0];
  return k?{k:k,ico:NECESIDAD[k].ico,txt:NECESIDAD[k].txt,mod:NECESIDAD[k].mod,accion:NECESIDAD[k].accion}:null;
}

/* ---------- cuidados ---------- */
function suma(g,k,n){g.barras[k]=cap(g.barras[k]+n);}
function vinculo(g,n){g.vinculo+=n; var nuevos=0; while(g.vinculo>=100&&g.huevos.length<3){g.vinculo-=100; g.huevos.push({id:"h"+Date.now().toString(36)+g.huevos.length,calor:0,tono:ri(rng(Date.now()),0,5)}); nuevos++;} if(g.vinculo>100)g.vinculo=100; return nuevos;}
function comer(g){if(g.inv.bocadillo<=0)return null; g.inv.bocadillo--; suma(g,"pan",35); suma(g,"fel",6); return {huevos:vinculo(g,6)};}
/* los cuidados sin premio de aprendizaje solo suman vínculo si hacían falta (los huevos salen sobre todo de aprender) */
function bano(g,conEspuma){var falta=g.barras.bri<90; if(conEspuma&&g.inv.espuma>0){g.inv.espuma--; suma(g,"bri",50); suma(g,"fel",5); return {huevos:vinculo(g,6)};} suma(g,"bri",18); return {huevos:falta?vinculo(g,2):0};}
function mimo(g){suma(g,"fel",4); var d=hoy(); if(!g.mimos||g.mimos.d!==d)g.mimos={d:d,n:0}; g.mimos.n++; return {huevos:g.mimos.n<=20?vinculo(g,1):0};}
function dormir(g){var falta=g.barras.des<80; g.barras.des=100; suma(g,"fel",4); return {huevos:falta?vinculo(g,4):0};}
function compra(g,id){var a=ACC[id]; if(!a||g.acc.indexOf(id)>=0)return false; var p=a.precio, k=p.gema?"gema":"polvo", n=p.gema||p.polvo; if(g.inv[k]<n)return false; g.inv[k]-=n; g.acc.push(id); return true;}
/* ponerse o quitarse un accesorio (uno por zona) */
function viste(g,mid,id){var m=mascota(g,mid), a=ACC[id]; if(!m||!a||g.acc.indexOf(id)<0)return; var i=m.acc.indexOf(id);
  if(i>=0)m.acc.splice(i,1); else{m.acc=m.acc.filter(function(x){return ACC[x]&&ACC[x].zona!==a.zona;}); m.acc.push(id);}}
function mascota(g,id){for(var i=0;i<g.mascotas.length;i++)if(g.mascotas[i].id===(id||g.activa))return g.mascotas[i]; return null;}

/* ---------- huevos ---------- */
function calienta(g,hid,n){var h=g.huevos.filter(function(x){return x.id===hid;})[0]; if(!h)return null; h.calor=cap(h.calor+n); return h;}
/* nace: primero las que faltan, con más probabilidad las comunes */
function nace(g,hid,seed){
  var i=g.huevos.map(function(x){return x.id;}).indexOf(hid); if(i<0||g.huevos[i].calor<100)return null;
  var r=rng(seed||Date.now()), tengo={}; g.mascotas.forEach(function(m){tengo[m.id]=1;});
  var faltan=CRIATURAS.filter(function(c){return !tengo[c.id];});
  g.huevos.splice(i,1);
  if(!faltan.length){g.inv.gema+=5; g.inv.polvo+=30; return {premio:true};}
  var peso=function(c){return [6,3,1][c.rar];}, tot=faltan.reduce(function(s,c){return s+peso(c);},0), x=r()*tot, c=faltan[0];
  for(var k=0;k<faltan.length;k++){x-=peso(faltan[k]); if(x<=0){c=faltan[k]; break;}}
  g.mascotas.push({id:c.id,nom:c.nom,acc:[],nacio:Date.now()});
  return {criatura:c};
}

/* ---------- hábitos reales con PIN familiar ---------- */
function hoy(d){d=d||new Date(); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}
function hashPin(pin){var h=2166136261; String("lumi:"+pin).split("").forEach(function(c){h^=c.charCodeAt(0); h=Math.imul(h,16777619);}); return (h>>>0).toString(36);}
function pinOk(g,pin){return !!g.pin&&hashPin(pin)===g.pin;}
function hechosHoy(g,id){var d=g.hechos[hoy()]||{}; return d[id]||0;}
function habitosHoy(g){return g.habitos.filter(function(h){return h.on;}).map(function(h){return {h:h,n:hechosHoy(g,h.id),max:h.veces||1};});}
/* una misión validada: el cometa trae gemas; si se completan todas las del día, un huevo especial */
function validaHabito(g,id){
  var h=g.habitos.filter(function(x){return x.id===id&&x.on;})[0]; if(!h)return null;
  var d=hoy(), n=hechosHoy(g,id); if(n>=(h.veces||1))return null;
  g.hechos[d]=g.hechos[d]||{}; g.hechos[d][id]=n+1;
  var ks=Object.keys(g.hechos).sort(); while(ks.length>40)delete g.hechos[ks.shift()];
  g.inv.gema+=2; g.inv.polvo+=10;
  var todas=habitosHoy(g).every(function(x){return x.n>=x.max;}), huevo=false;
  if(todas&&!g.hechos[d]._huevo&&g.huevos.length<3){g.hechos[d]._huevo=1; g.huevos.push({id:"h"+Date.now().toString(36)+"e",calor:30,tono:6,especial:true}); huevo=true;}
  return {gemas:2,polvo:10,huevo:huevo};
}

/* ---------- modo noche y puerta parental ---------- */
function minutos(hhmm){var p=String(hhmm||"0:0").split(":"); return (+p[0]||0)*60+(+p[1]||0);}
function enNoche(g,d){if(!g.noche||!g.noche.on)return false; d=d||new Date(); var m=d.getHours()*60+d.getMinutes(), a=minutos(g.noche.desde), b=minutos(g.noche.hasta);
  return a<=b?(m>=a&&m<b):(m>=a||m<b);}
var UNI=["cero","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez","once","doce","trece","catorce","quince","dieciséis","diecisiete","dieciocho","diecinueve","veinte","veintiuno","veintidós","veintitrés","veinticuatro","veinticinco","veintiséis","veintisiete","veintiocho","veintinueve"];
var DEC=["","","","treinta","cuarenta","cincuenta","sesenta","setenta","ochenta","noventa"];
function enPalabras(n){if(n<30)return UNI[n]; var d=Math.floor(n/10), u=n%10; return DEC[d]+(u?" y "+UNI[u]:"");}
/* una cuenta escrita en palabras: fácil para un adulto, difícil para quien recién aprende a leer */
function puerta(seed){var r=rng(seed), b=ri(r,3,9), c=ri(r,4,9);
  if(r()<0.5)return {q:"Escribe con números el resultado de: "+enPalabras(b*c)+" dividido entre "+enPalabras(b),ok:c};
  return {q:"Escribe con números el resultado de: "+enPalabras(b)+" por "+enPalabras(c),ok:b*c};}

/* ===================== los minijuegos =====================
   cada ronda son 3 retos cortos. Tipos:
     {t:"op", q, vis?, ops:[{h, ok, voz?}], ex, tema}         elegir
     {t:"contar", q, ing:[{e, nom, n}], pregunta?, ex, tema}   poner ingredientes en el caldero
     {t:"multi", q, celdas:[{h, ok}], ex, tema}                tocar todos los que cumplen
     {t:"trazo", q, letra, ex, tema}                           unir las estrellas de una letra */
var INGR=[["🍄","setas mágicas","seta mágica"],["💧","gotas de rocío","gota de rocío"],["🍓","fresas","fresa"],["⭐","estrellitas","estrellita"],["🌸","pétalos","pétalo"],["🫐","arándanos","arándano"]];
function cuantos(n,g){return n+" "+(n===1?g[2]:g[1]);}
var COLOR_SET={rojo:["🍓","🍎","🌹","🍒","❤️"],amarillo:["🍋","🌻","⭐","🐥","🍌"],azul:["🫐","💙","🐳","🦋","🧢"],verde:["🥦","🐸","🍀","🥝","🌿"]};
var FORMA_SET={círculos:["🔴","🔵","🟢","🟡","🟣"],cuadrados:["🟥","🟦","🟩","🟨","🟪"],triángulos:["🔺","🔻"]};
var CATEG={frutas:["🍎","🍌","🍇","🍓","🍐","🍊"],animales:["🐶","🐱","🐰","🐻","🦊","🐸"],vehículos:["🚗","🚌","🚲","✈️","🚂","⛵"],ropa:["👕","👖","👗","🧦","🧢","👟"],instrumentos:["🎸","🥁","🎹","🎺","🎻","🪇"]};
function opsMezcla(r,ok,dis){var o=baraja(r,[{h:ok,ok:true}].concat(dis.map(function(x){return {h:x,ok:false};}))); return o;}
function numsCerca(r,ok,n,min,max){var out=[]; for(var t=0;t<60&&out.length<n;t++){var v=ok+ri(r,-3,3); if(v!==ok&&v>=min&&v<=max&&out.indexOf(v)<0)out.push(v);} for(var k=1;out.length<n;k++){if(out.indexOf(ok+k)<0)out.push(ok+k);} return out;}
function emos(e,n){var s="";for(var i=0;i<n;i++)s+=e; return s;}
function tarta(n,d){return {tarta:[n,d]};}

var COCINA=[
  /* 1: contar un ingrediente y series */
  [function(r){var g=pick(r,INGR), n=ri(r,1,5); return {t:"contar",q:"Pon "+cuantos(n,g)+" en el caldero.",ing:[{e:g[0],nom:g[1],n:n}],ex:"Contamos uno por uno: "+n+".",tema:"mate"};},
   function(r){var a=pick(r,INGR), b=pick(r,INGR.filter(function(x){return x!==a;})), s=[a[0],b[0],a[0],b[0],a[0]]; return {t:"op",q:"¿Qué ingrediente sigue en la serie?",vis:'<div class="lp-serie">'+s.join("")+'<i>?</i></div>',ops:opsMezcla(r,b[0],[a[0],pick(r,INGR.filter(function(x){return x!==a&&x!==b;}))[0]]),ex:"Se repite "+a[0]+" "+b[0]+": después de "+a[0]+" viene "+b[0]+".",tema:"logica"};}],
  /* 2: contar hasta 10, colores y formas, series ABB */
  [function(r){var g=pick(r,INGR), n=ri(r,4,10); return {t:"contar",q:"Pon "+n+" "+g[1]+" en el caldero.",ing:[{e:g[0],nom:g[1],n:n}],ex:"Contamos hasta "+n+".",tema:"mate"};},
   function(r){var cs=Object.keys(COLOR_SET), c=pick(r,cs), si=baraja(r,COLOR_SET[c]).slice(0,ri(r,2,3)), no=[]; cs.filter(function(x){return x!==c;}).forEach(function(x){no=no.concat(COLOR_SET[x]);}); no=baraja(r,no).slice(0,6-si.length);
     return {t:"multi",q:"Toca todos los ingredientes de color "+c+".",celdas:baraja(r,si.map(function(h){return {h:h,ok:true};}).concat(no.map(function(h){return {h:h,ok:false};}))),ex:"Los de color "+c+" son: "+si.join(" "),tema:"logica"};},
   function(r){var fs=Object.keys(FORMA_SET), f=pick(r,["círculos","cuadrados"]), si=baraja(r,FORMA_SET[f]).slice(0,3), no=baraja(r,fs.filter(function(x){return x!==f;}).reduce(function(a,x){return a.concat(FORMA_SET[x]);},[])).slice(0,3);
     return {t:"multi",q:"Toca todos los "+f+".",celdas:baraja(r,si.map(function(h){return {h:h,ok:true};}).concat(no.map(function(h){return {h:h,ok:false};}))),ex:"Los "+f+": "+si.join(" "),tema:"logica"};},
   function(r){var a=pick(r,INGR), b=pick(r,INGR.filter(function(x){return x!==a;})), s=[a[0],b[0],b[0],a[0],b[0],b[0],a[0]]; return {t:"op",q:"¿Qué sigue en la serie?",vis:'<div class="lp-serie">'+s.join("")+'<i>?</i></div>',ops:opsMezcla(r,b[0],[a[0],pick(r,INGR.filter(function(x){return x!==a&&x!==b;}))[0]]),ex:"Se repite "+a[0]+" "+b[0]+" "+b[0]+".",tema:"logica"};}],
  /* 3: juntar dos ingredientes (suma hasta 10) */
  [function(r){var a=pick(r,INGR), b=pick(r,INGR.filter(function(x){return x!==a;})), n=ri(r,1,5), m=ri(r,1,5); return {t:"contar",q:"Pon "+cuantos(n,a)+" y "+cuantos(m,b)+".",ing:[{e:a[0],nom:a[1],n:n},{e:b[0],nom:b[1],n:m}],ex:n+" y "+m+" son "+(n+m)+" ingredientes.",tema:"mate"};},
   function(r){var a=pick(r,INGR), n=ri(r,1,5), m=ri(r,1,5); return {t:"op",q:"En el caldero hay "+cuantos(n,a)+" y agregas "+m+" más. ¿Cuántas hay en total?",vis:'<div class="lp-cuenta">'+emos(a[0],n)+' <b>+</b> '+emos(a[0],m)+'</div>',ops:opsMezcla(r,String(n+m),numsCerca(r,n+m,2,1,12).map(String)),ex:n+" + "+m+" = "+(n+m),tema:"mate"};}],
  /* 4: quitar (resta) y grupos iguales */
  [function(r){var n=ri(r,6,15), m=ri(r,2,n-1); return {t:"op",q:"Había "+n+" bocadillos y tu mascota comió "+m+". ¿Cuántos quedan?",vis:'<div class="lp-cuenta">'+emos("🧁",Math.min(n,15))+'</div>',ops:opsMezcla(r,String(n-m),numsCerca(r,n-m,2,0,20).map(String)),ex:n+" − "+m+" = "+(n-m),tema:"mate"};},
   function(r){var g=ri(r,2,4), c=ri(r,2,5), e=pick(r,INGR); return {t:"op",q:"Hay "+g+" platos con "+c+" "+e[1]+" cada uno. ¿Cuántas hay en total?",vis:'<div class="lp-platos">'+emos('<span>'+emos(e[0],c)+'</span>',g)+'</div>',ops:opsMezcla(r,String(g*c),numsCerca(r,g*c,2,2,30).map(String)),ex:g+" × "+c+" = "+(g*c),tema:"mate"};},
   function(r){var k=ri(r,2,4), q=ri(r,2,5); return {t:"op",q:"Reparte "+(k*q)+" fresas entre "+k+" mascotas por igual. ¿Cuántas recibe cada una?",vis:'<div class="lp-cuenta">'+emos("🍓",k*q)+'</div>',ops:opsMezcla(r,String(q),numsCerca(r,q,2,1,12).map(String)),ex:(k*q)+" ÷ "+k+" = "+q,tema:"mate"};}],
  /* 5: la tarta astral en partes iguales y sumas más grandes */
  [function(r){var d=pick(r,[2,3,4,6]); return {t:"op",q:"Corta la tarta astral para "+d+" amigos, en partes iguales. ¿Cuál está bien cortada?",ops:opsMezcla(r,tarta(d,d),baraja(r,[2,3,4,5,6,8].filter(function(x){return x!==d;})).slice(0,2).map(function(x){return tarta(x,x);})),ex:"Para "+d+" amigos, "+d+" partes iguales: cada uno recibe 1/"+d+".",tema:"mate"};},
   function(r){var d=pick(r,[2,3,4]), n=ri(r,1,d-1); return {t:"op",q:"¿Qué parte de la tarta se comieron?",vis:{tarta:[n,d]},ops:opsMezcla(r,n+"/"+d,[(d-n)+"/"+d,n+"/"+(d+1)].filter(function(x){return x!==n+"/"+d;})),ex:"La tarta tiene "+d+" partes y se comieron "+n+": "+n+"/"+d+".",tema:"mate"};},
   function(r){var a=ri(r,12,40), b=ri(r,5,25); return {t:"op",q:"Tienes "+a+" estrellitas y encuentras "+b+" más. ¿Cuántas tienes?",ops:opsMezcla(r,String(a+b),numsCerca(r,a+b,2,10,80).map(String)),ex:a+" + "+b+" = "+(a+b),tema:"mate"};}]
];

/* ----- letras y palabras ----- */
var PALABRAS=[["avión","✈️","a-vión"],["abeja","🐝","a-be-ja"],["árbol","🌳","ár-bol"],["estrella","⭐","es-tre-lla"],["elefante","🐘","e-le-fan-te"],["isla","🏝️","is-la"],["iglú","🛖","i-glú"],
  ["oso","🐻","o-so"],["ojo","👁️","o-jo"],["oveja","🐑","o-ve-ja"],["uvas","🍇","u-vas"],["unicornio","🦄","u-ni-cor-nio"],["manzana","🍎","man-za-na"],["mano","✋","ma-no"],["mono","🐒","mo-no"],
  ["mariposa","🦋","ma-ri-po-sa"],["mapa","🗺️","ma-pa"],["pato","🦆","pa-to"],["pera","🍐","pe-ra"],["perro","🐶","pe-rro"],["piña","🍍","pi-ña"],["pez","🐟","pez"],["sol","☀️","sol"],["sopa","🍲","so-pa"],
  ["silla","🪑","si-lla"],["sandía","🍉","san-dí-a"],["luna","🌙","lu-na"],["lupa","🔍","lu-pa"],["león","🦁","le-ón"],["limón","🍋","li-món"],["taza","☕","ta-za"],["tomate","🍅","to-ma-te"],
  ["tortuga","🐢","tor-tu-ga"],["tren","🚂","tren"],["nube","☁️","nu-be"],["nariz","👃","na-riz"],["naranja","🍊","na-ran-ja"],["dado","🎲","da-do"],["dedo","☝️","de-do"],["delfín","🐬","del-fín"],
  ["dragón","🐉","dra-gón"],["casa","🏠","ca-sa"],["cama","🛏️","ca-ma"],["conejo","🐰","co-ne-jo"],["coco","🥥","co-co"],["gato","🐱","ga-to"],["globo","🎈","glo-bo"],["foca","🦭","fo-ca"],
  ["fresa","🍓","fre-sa"],["flor","🌸","flor"],["vaca","🐮","va-ca"],["vela","🕯️","ve-la"],["barco","⛵","bar-co"],["ballena","🐋","ba-lle-na"],["bota","👢","bo-ta"],["rosa","🌹","ro-sa"],
  ["ratón","🐭","ra-tón"],["reloj","⏰","re-loj"],["jirafa","🦒","ji-ra-fa"],["queso","🧀","que-so"],["zorro","🦊","zo-rro"],["zapato","👞","za-pa-to"]];
var NOMBRE_LETRA={A:"a",E:"e",I:"i",O:"o",U:"u",M:"eme",P:"pe",S:"ese",L:"ele",T:"te",N:"ene",D:"de",C:"ce",G:"ge",F:"efe",V:"uve",B:"be",R:"erre",J:"jota",Z:"zeta",Q:"cu"};
function sinTilde(s){return s.replace(/á/g,"a").replace(/é/g,"e").replace(/í/g,"i").replace(/ó/g,"o").replace(/ú/g,"u");}
function letra(p){return sinTilde(p[0]).charAt(0).toUpperCase();}
/* el sonido con que empieza (b y v suenan igual; c, s y z también en Latinoamérica…) */
function sonido(p){var w=sinTilde(p[0]), a=w.charAt(0), b=w.charAt(1);
  if(a==="v")return "b"; if(a==="z"||(a==="c"&&(b==="e"||b==="i")))return "s"; if(a==="c"||a==="q"||a==="k")return "k";
  if(a==="g"&&(b==="e"||b==="i"))return "j"; if(a==="l"&&b==="l")return "y"; if(a==="h")return b; return a;}
var VOCALES=["A","E","I","O","U"], CONSON=["M","P","S","L","T","N","D"];
function conLetra(L){return PALABRAS.filter(function(p){return letra(p)===L;});}
function empiezaCon(r,L){
  var si=conLetra(L), ok=pick(r,si), modelo=pick(r,si.filter(function(x){return x!==ok;}).concat(si.length<2?[ok]:[])), son=sonido(ok);
  var dis=baraja(r,PALABRAS.filter(function(p){return sonido(p)!==son&&letra(p)!==L;})).slice(0,2);
  return {t:"op",q:"¿Qué empieza con la "+NOMBRE_LETRA[L]+", como "+modelo[0]+"?",vis:'<div class="lp-letra">'+L+'</div>',
    ops:baraja(r,[{h:ok[1],ok:true,voz:ok[0]}].concat(dis.map(function(p){return {h:p[1],ok:false,voz:p[0]};}))),ex:ok[0].charAt(0).toUpperCase()+ok[0].slice(1)+" empieza con "+L+".",tema:"lectura"};
}
var TRAZOS={A:[[[12,112],[50,12],[88,112]],[[29,70],[71,70]]],E:[[[80,12],[22,12],[22,62],[22,112],[80,112]],[[22,62],[68,62]]],I:[[[50,12],[50,62],[50,112]]],
  O:[[[50,12],[80,30],[88,62],[80,94],[50,112],[20,94],[12,62],[20,30]]],U:[[[18,12],[18,74],[30,104],[50,112],[70,104],[82,74],[82,12]]],
  M:[[[14,112],[14,12],[50,72],[86,12],[86,112]]],L:[[[24,12],[24,62],[24,112],[80,112]]],T:[[[14,12],[50,12],[86,12]],[[50,24],[50,68],[50,112]]],
  N:[[[18,112],[18,12],[82,112],[82,12]]],P:[[[24,112],[24,62],[24,12],[62,12],[80,28],[78,48],[60,62],[24,62]]]};
var ARBOL=[
  /* 1: vocales */
  [function(r){return empiezaCon(r,pick(r,VOCALES));},function(r){var L=pick(r,VOCALES); return {t:"trazo",q:"Une las estrellas para dibujar la letra "+L+".",letra:L,ex:"¡Dibujaste la "+L+"!",tema:"lectura"};}],
  /* 2: consonantes y trazos */
  [function(r){return empiezaCon(r,pick(r,CONSON));},function(r){var L=pick(r,["M","L","T","N","P","O"]); return {t:"trazo",q:"Une las estrellas para dibujar la letra "+L+".",letra:L,ex:"¡Dibujaste la "+L+"!",tema:"lectura"};}],
  /* 3: ¿con qué letra empieza? */
  [function(r){var p=pick(r,PALABRAS.filter(function(x){return CONSON.concat(VOCALES).indexOf(letra(x))>=0;})), L=letra(p), dis=baraja(r,CONSON.concat(VOCALES).filter(function(x){return x!==L;})).slice(0,2);
     return {t:"op",q:"¿Con qué letra empieza "+p[0]+"?",vis:'<div class="lp-dibujo">'+p[1]+'</div>',ops:baraja(r,[{h:L,ok:true}].concat(dis.map(function(x){return {h:x,ok:false};}))),ex:p[0]+" empieza con "+L+".",tema:"lectura"};},
   function(r){return empiezaCon(r,pick(r,CONSON));}],
  /* 4: sílabas */
  [function(r){var p=pick(r,PALABRAS.filter(function(x){return x[2].split("-").length===2;})), s=p[2].split("-"), i=ri(r,0,1), falta=s[i], otras=baraja(r,PALABRAS.reduce(function(a,x){return a.concat(x[2].split("-"));},[]).filter(function(x,k,arr){return x!==falta&&arr.indexOf(x)===k;})).slice(0,2);
     return {t:"op",q:"¿Qué sílaba falta en "+p[0]+"?",vis:'<div class="lp-dibujo">'+p[1]+'</div><div class="lp-silabas">'+s.map(function(x,k){return k===i?'<i>?</i>':'<b>'+x.toUpperCase()+'</b>';}).join("")+'</div>',
       ops:baraja(r,[{h:falta.toUpperCase(),ok:true}].concat(otras.map(function(x){return {h:x.toUpperCase(),ok:false};}))),ex:s.join(" + ")+" = "+p[0],tema:"lectura"};},
   function(r){var p=pick(r,PALABRAS.filter(function(x){return x[2].split("-").length===2;})), s=p[2].split("-"), dis=baraja(r,PALABRAS.filter(function(x){return x!==p;})).slice(0,2);
     return {t:"op",q:"Junta las sílabas: "+s.join(" + ")+". ¿Qué es?",vis:'<div class="lp-silabas">'+s.map(function(x){return '<b>'+x.toUpperCase()+'</b>';}).join('<span>+</span>')+'</div>',ops:baraja(r,[{h:p[1],ok:true,voz:p[0]}].concat(dis.map(function(x){return {h:x[1],ok:false,voz:x[0]};}))),ex:s.join(" + ")+" = "+p[0],tema:"lectura"};}],
  /* 5: leer palabras */
  [function(r){var p=pick(r,PALABRAS), dis=baraja(r,PALABRAS.filter(function(x){return x!==p&&x[1]!==p[1];})).slice(0,2);
     return {t:"op",q:"Lee la palabra y toca su dibujo.",vis:'<div class="lp-palabra">'+p[0].toUpperCase()+'</div>',leer:true,ops:baraja(r,[{h:p[1],ok:true}].concat(dis.map(function(x){return {h:x[1],ok:false};}))),ex:"Dice «"+p[0]+"».",tema:"lectura"};},
   function(r){var p=pick(r,PALABRAS), parecidas=PALABRAS.filter(function(x){return x!==p&&(x[0].length===p[0].length||sonido(x)===sonido(p));}), dis=baraja(r,parecidas.length>=2?parecidas:PALABRAS.filter(function(x){return x!==p;})).slice(0,2);
     return {t:"op",q:"¿Cuál palabra es este dibujo?",vis:'<div class="lp-dibujo">'+p[1]+'</div>',leer:true,ops:baraja(r,[{h:p[0].toUpperCase(),ok:true}].concat(dis.map(function(x){return {h:x[0].toUpperCase(),ok:false};}))),ex:"Es «"+p[0]+"».",tema:"lectura"};}]
];

/* ----- jardín: ciencias, inglés y lógica mezclados ----- */
function ciencia(r,nivel){
  var K=G.AxCiencias; if(!K)return null;
  var us=K.UNIDADES.filter(function(u){return u.nivel===1||(nivel>=4&&u.nivel===2);}), u=pick(r,us);
  var cs=u.q.filter(function(x){return x[0]==="c";}), es=u.q.filter(function(x){return (x[0]==="e"||x[0]==="v")&&nivel>=3;});
  if(cs.length&&(r()<0.6||!es.length)){var x=pick(r,cs), caja=ri(r,0,x[2].length-1), si=baraja(r,x[3].filter(function(c){return c[1]===caja;})), no=baraja(r,x[3].filter(function(c){return c[1]!==caja;}));
    if(si.length&&no.length>=2){var cosa=function(c){var p=c[0].split(" "); return /[^\w\sáéíóúñ¿?¡!,.()]/i.test(p[0])?{h:p[0],txt:p.slice(1).join(" ")}:{h:'<small>'+c[0]+'</small>',txt:c[0]};};
      var ok=cosa(si[0]), d=no.slice(0,2).map(cosa);
      return {t:"op",q:x[1]+" Toca el que va en «"+x[2][caja].replace(/\s*\S*[^\w\sáéíóúñ]$/i,"")+"».",ops:baraja(r,[{h:ok.h,ok:true,voz:ok.txt}].concat(d.map(function(c){return {h:c.h,ok:false,voz:c.txt};}))),ex:x[4],tema:"ciencia"};}}
  var y=pick(r,es.length?es:u.q.filter(function(x){return x[0]==="e"||x[0]==="v";}));
  if(y[0]==="v")return {t:"op",q:"¿Verdadero o falso? "+y[1],ops:[{h:"✅",ok:y[2],voz:"verdadero"},{h:"❌",ok:!y[2],voz:"falso"}],ex:y[3],tema:"ciencia"};
  return {t:"op",q:y[1],ops:baraja(r,[{h:'<small>'+y[2]+'</small>',ok:true,voz:y[2]}].concat(y[3].slice(0,2).map(function(z){return {h:'<small>'+z+'</small>',ok:false,voz:z};}))),ex:y[4],tema:"ciencia"};
}
function ingles(r,nivel){
  var I=G.AxIngles; if(!I)return null;
  var us=I.UNIDADES.slice(1,nivel>=4?6:4), u=pick(r,us), w=pick(r,u.palabras), dis=baraja(r,u.palabras.filter(function(x){return x!==w&&x.e!==w.e;})).slice(0,2);
  var dib=function(x){return x.c?'<i class="lp-color" style="background:'+x.c+'"></i>':x.e;};
  return {t:"op",q:"¿Cuál es «"+w.en+"»?",en:w.en,ops:baraja(r,[{h:dib(w),ok:true}].concat(dis.map(function(x){return {h:dib(x),ok:false};}))),ex:"«"+w.en+"» significa "+w.es+".",tema:"ingles"};
}
function intruso(r){var cs=Object.keys(CATEG), a=pick(r,cs), b=pick(r,cs.filter(function(x){return x!==a;})), tres=baraja(r,CATEG[a]).slice(0,3), uno=pick(r,CATEG[b]);
  return {t:"op",q:"¿Cuál no va con los demás?",ops:baraja(r,tres.map(function(h){return {h:h,ok:false};}).concat([{h:uno,ok:true}])),ex:"Los demás son "+a+"; "+uno+" es de "+b+".",tema:"logica"};}
function grande(r){var e=pick(r,["🐘","🌳","🎈","🐳","🍉","⭐"]), t=baraja(r,[1,2,3]); return {t:"op",q:"¿Cuál es el más grande?",ops:t.map(function(k){return {h:'<span style="font-size:'+(0.6+k*0.4)+'em">'+e+'</span>',ok:k===3};}),ex:"El más grande ocupa más lugar.",tema:"logica"};}
function jardin(r,nivel){
  var fs=[function(){return ciencia(r,nivel);},function(){return ingles(r,nivel);},function(){return r()<0.5?intruso(r):grande(r);}], its=[];
  baraja(r,fs).forEach(function(f){var it=f(); its.push(it||intruso(r));});
  return its;
}

/* una ronda de 3 retos del módulo, al nivel que corresponde */
var MODULOS={cocina:{nom:"Cocina de Pociones",ico:"🧪",premio:"bocadillo",premioIco:"🧁",premioNom:"bocadillos",desc:"Cuenta, suma, reparte y descubre series para preparar meriendas mágicas."},
  arbol:{nom:"Árbol de las Palabras",ico:"🌳",premio:"espuma",premioIco:"🫧",premioNom:"espuma mágica",desc:"Sonidos, letras, sílabas y palabras para conseguir espuma de baño."},
  jardin:{nom:"Jardín de las Preguntas",ico:"🌼",premio:"gema",premioIco:"💎",premioNom:"gemas",desc:"Ciencias, inglés y lógica para ganar gemas y comprar accesorios."}};
function ronda(mod,nivel,seed){
  var r=rng(seed>>>0);
  if(mod==="jardin")return jardin(r,nivel);
  var tabla=mod==="cocina"?COCINA:ARBOL, fs=tabla[Math.max(0,Math.min(tabla.length-1,nivel-1))].slice(), its=[];
  /* a veces un reto del nivel anterior, para repasar */
  if(nivel>1&&r()<0.5)fs=fs.concat([pick(r,tabla[nivel-2])]);
  for(var i=0;i<3;i++)its.push(pick(r,fs)(r));
  return its;
}
/* corregir: elegir (índice), contar ({e: cantidad}), tocar todos (lista de índices), trazo (completo) */
function corrige(it,resp){
  if(it.t==="op")return !!(it.ops[+resp]&&it.ops[+resp].ok);
  if(it.t==="contar")return !!resp&&it.ing.every(function(g){return (resp[g.e]||0)===g.n;});
  if(it.t==="multi"){var buenos=it.celdas.map(function(c,i){return c.ok?i:-1;}).filter(function(i){return i>=0;}); return Array.isArray(resp)&&resp.length===buenos.length&&buenos.every(function(i){return resp.indexOf(i)>=0;});}
  if(it.t==="trazo")return resp===true;
  return false;
}
/* al terminar una ronda: premios, vínculo, nivel y estadísticas */
function terminaRonda(g,mod,its,primeras,modo){
  var ok=primeras.filter(Boolean).length, M=MODULOS[mod], n=2+(ok===3?1:0), polvo=4+ok*2;
  g.inv[M.premio]+=n; g.inv.polvo+=polvo;
  var r=rango(modo), lv=nivelDe(g,mod,modo); if(ok===3)lv++; else if(ok<=1)lv--; g.niveles[mod]=Math.max(r[0],Math.min(r[1],lv));
  var s=g.stats[mod]; s.r++; s.ok+=ok; s.n+=its.length;
  its.forEach(function(it,i){var t=g.stats.temas[it.tema]||(g.stats.temas[it.tema]={ok:0,n:0}); t.n++; if(primeras[i])t.ok++;});
  if(mod==="jardin")suma(g,"fel",20); else suma(g,"fel",8);
  var d=hoy(); g.dias[d]=(g.dias[d]||0)+1; var ks=Object.keys(g.dias).sort(); while(ks.length>120)delete g.dias[ks.shift()];
  return {ok:ok,premio:M.premio,cant:n,polvo:polvo,huevos:vinculo(g,12+ok*2),nivel:g.niveles[mod]};
}

G.AxLumina={COLORES:COLORES,ESPECIES:ESPECIES,RASGOS:RASGOS,BIOMAS:BIOMAS,RAREZA:RAREZA,CRIATURAS:CRIATURAS,POR_ID:POR_ID,ACCES:ACCES,ACC:ACC,HABITOS:HABITOS,MODULOS:MODULOS,TRAZOS:TRAZOS,PALABRAS:PALABRAS,
  titulo:titulo,nuevo:nuevo,modoDe:modoDe,nivelDe:nivelDe,actualiza:actualiza,despierta:despierta,necesidad:necesidad,comer:comer,bano:bano,mimo:mimo,dormir:dormir,compra:compra,viste:viste,mascota:mascota,
  calienta:calienta,nace:nace,hoy:hoy,hashPin:hashPin,pinOk:pinOk,habitosHoy:habitosHoy,validaHabito:validaHabito,enNoche:enNoche,enPalabras:enPalabras,puerta:puerta,
  ronda:ronda,corrige:corrige,terminaRonda:terminaRonda,vinculo:vinculo,sonido:sonido,letra:letra,rng:rng,NOMBRE_LETRA:NOMBRE_LETRA};
})(typeof window!=="undefined"?window:globalThis);
