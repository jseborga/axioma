/* ===========================================================
   THE FINAL TEST · Matemática Montessori · el motor
   -----------------------------------------------------------
   De inicial (4–5 años) a 6.º de secundaria, por etapas. Cada
   concepto tiene su material Montessori, un objetivo, una idea
   para hacer en casa y un generador de ejercicios por nivel.
   Se aprende de lo concreto a lo abstracto:
     fase 0 concreto   el material a la vista y para manipular
     fase 1 pictórico  el dibujo del material, sin ayudas
     fase 2 abstracto  solo números y símbolos
   La lección empieza con la lección en tres tiempos (esto es,
   muéstrame, ¿qué es?) y sigue con un ciclo de trabajo que se
   adapta: tres aciertos seguidos suben de fase y de nivel; muchos
   errores juntos vuelven a lo concreto (refuerzo).
   Sin dependencias: lo usan el navegador y las pruebas.
   =========================================================== */
(function(G){
"use strict";

/* ---------- azar reproducible y utilidades ---------- */
function rng(seed){var a=seed>>>0||1; return function(){a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296;};}
function ri(r,a,b){return a+Math.floor(r()*(b-a+1));}
function pick(r,a){return a[Math.floor(r()*a.length)];}
function baraja(r,a){a=a.slice(); for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;} return a;}
function mcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=b;b=a%b;a=t;}return a||1;}
function mcm(a,b){return Math.abs(a*b)/mcd(a,b);}
function fr(n,d){if(d<0){n=-n;d=-d;} var g=mcd(n,d); return {n:n/g,d:d/g};}
function frTxt(f){return f.d===1?String(f.n):f.n+"/"+f.d;}
/* números con coma decimal, como se escriben en Bolivia */
function nt(x){var s=String(Math.round(x*1000)/1000); return s.replace(".",",").replace("-","−");}
var PALABRA=["cero","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez"];

/* objetos para contar, con su nombre (para leer en voz alta) */
var OBJ={"🍎":["manzana","manzanas","f"],"🐥":["pollito","pollitos","m"],"⭐":["estrella","estrellas","f"],"🌸":["flor","flores","f"],
  "🐟":["pez","peces","m"],"🍓":["frutilla","frutillas","f"],"🦋":["mariposa","mariposas","f"],"🐞":["mariquita","mariquitas","f"],
  "🍌":["plátano","plátanos","m"],"🐶":["perrito","perritos","m"],"🌻":["girasol","girasoles","m"],"🍄":["hongo","hongos","m"],
  "🐝":["abeja","abejas","f"],"🌰":["castaña","castañas","f"],"🐚":["caracola","caracolas","f"],"🦀":["cangrejo","cangrejos","m"],
  "🍪":["galleta","galletas","f"],"🎈":["globo","globos","m"],"🚗":["auto","autos","m"],"✏️":["lápiz","lápices","m"]};
var EMO=[["🍎","🐥","⭐","🌸","🐟","🍓","🦋","🐞","🍌","🐶"],["🌻","🍄","🐝","🍓","🍎","🦋"],["🌰","🍄","🍪","🎈"],["🐚","🦀","🐟","🍪"],["🚗","✏️","🍪","🎈"]];
function emo(r,e){return pick(r,EMO[Math.min(e,EMO.length-1)]);}
function cuantos(e){var o=OBJ[e]; return "¿Cuánt"+(o[2]==="f"?"as ":"os ")+o[1]+" hay?";}
function plural(e,n){var o=OBJ[e]; return n===1?o[0]:o[1];}
/* «1 decena», «3 decenas» */
function pl(n,uno,varios){return n+" "+(n===1?uno:varios);}

/* respuestas */
function num(ok,o){o=o||{}; o.t="num"; o.ok=ok; return o;}
function ops(r,ok,dis){var a=baraja(r,[ok].concat(dis)); return {t:"op",ops:a,ok:a.indexOf(ok)};}
/* distractores numéricos cercanos y distintos */
function cerca(r,ok,n,min,max,paso){
  paso=paso||1; var out=[], prueba=0;
  while(out.length<n&&prueba<80){ prueba++; var d=ri(r,1,3)*paso*(r()<0.5?-1:1), v=ok+d;
    if(v<min||v>max||v===ok||out.indexOf(v)>=0)continue; out.push(v); }
  for(var k=1;out.length<n;k++){ if(ok+k*paso<=max&&out.indexOf(ok+k*paso)<0)out.push(ok+k*paso); else if(ok-k*paso>=min&&out.indexOf(ok-k*paso)<0)out.push(ok-k*paso); if(k>50)break; }
  return out;
}
function opsNum(r,ok,min,max,paso){return ops(r,String(nt(ok)),cerca(r,ok,2,min,max,paso).map(function(v){return String(nt(v));}));}

/* ---------- las etapas: cada una con su escena que se llena al dominar sus conceptos ---------- */
var ETAPAS=[
  {k:"inicial",nom:"Inicial",sub:"4 y 5 años",ico:"🐣",escena:"granja",cielo:["#bfe6ff","#fff6d8"],suelo:"#9ed36a"},
  {k:"p1",nom:"1.º de primaria",sub:"6 y 7 años",ico:"🌱",escena:"jardin",cielo:["#c8ecff","#fff3e0"],suelo:"#8fcf6a"},
  {k:"p2",nom:"2.º de primaria",sub:"7 y 8 años",ico:"🌳",escena:"bosque",cielo:["#bfe3ff","#eaf7e4"],suelo:"#6fb35a"},
  {k:"p3",nom:"3.º de primaria",sub:"8 y 9 años",ico:"🐠",escena:"mar",cielo:["#b5e3ff","#e0f7ff"],suelo:"#f1dfa6"},
  {k:"p4",nom:"4.º de primaria",sub:"9 y 10 años",ico:"🏙️",escena:"ciudad",cielo:["#cfe8ff","#fde8d8"],suelo:"#a9c47f"},
  {k:"p5",nom:"5.º y 6.º de primaria",sub:"10 a 12 años",ico:"⛰️",escena:"montana",cielo:["#c2dcf7","#f6efe1"],suelo:"#8fae6b"},
  {k:"s1",nom:"1.º y 2.º de secundaria",sub:"12 a 14 años",ico:"🎈",escena:"cielo",cielo:["#9fcdf5","#e9f4ff"],suelo:"#7fb0d8"},
  {k:"s3",nom:"3.º y 4.º de secundaria",sub:"14 a 16 años",ico:"🪐",escena:"espacio",cielo:["#1c2350","#3b2f6b"],suelo:"#2b2f55"},
  {k:"s5",nom:"5.º y 6.º de secundaria",sub:"16 a 18 años",ico:"🌌",escena:"estrellas",cielo:["#0b1030","#26215a"],suelo:"#1a1d3d"}
];

/* ---------- los conceptos ---------- */
var C=[];
function concepto(o){o.nmax=o.nmax||(o.e===0?2:3); if(o.abs==null)o.abs=true; C.push(o); return o;}

/* === Inicial === */
concepto({id:"contar10",e:0,nom:"Contar hasta 10",obj:"Aprenderé a contar objetos del 1 al 10.",mat:"Cajas de husos y objetos para contar",
  pres:"Contar es tocar cada cosa una sola vez y decir un número. El último número que dices es cuántas hay.",
  casa:"Cuenten juntos cosas de la casa: cucharas, zapatos, escalones. Que toque cada una al contar.",dibujo:"🐔",abs:false,
  gen:function(r,n){var k=n===1?ri(r,1,5):ri(r,3,10), e=emo(r,0);
    return {q:cuantos(e),v:{t:"objetos",n:k,e:e},r:opsNum(r,k,1,10),pista:"Toca cada "+OBJ[e][0]+" mientras cuentas en voz alta.",
      ex:["Toca cada "+OBJ[e][0]+" una sola vez y cuenta en voz alta: 1, 2, 3…","El último número que dices es cuántas hay: "+k+" ("+PALABRA[k]+")."]};}});
concepto({id:"numeral",e:0,nom:"Los números del 0 al 10",obj:"Aprenderé a reconocer los números y a mostrar cuántos son.",mat:"Números de lija y fichas",
  pres:"Cada número tiene su forma. Repásalo con el dedo, como en los números de lija, y luego pon esa cantidad de objetos.",
  casa:"Dibujen números grandes en papel lija o en arena y repásenlos con el dedo diciendo su nombre.",dibujo:"🐮",abs:false,
  gen:function(r,n,f){var k=n===1?ri(r,1,5):ri(r,0,10), e=emo(r,0);
    if(f===0)return {q:"Pon "+k+" "+plural(e,k)+" en la canasta.",v:{t:"numeral",n:k},r:{t:"bandeja",ok:k,e:e,max:10},pista:"Pon una y di «uno», pon otra y di «dos»… hasta llegar a "+k+".",
      ex:["Este número se llama «"+PALABRA[k]+"».","Pon una "+OBJ[e][0]+" por cada número que dices hasta llegar a "+k+"."]};
    var otros=cerca(r,k,2,0,10);
    return {q:"¿Dónde hay "+k+" "+plural(e,k)+"?",v:{t:"numeral",n:k},r:ops(r,{v:{t:"objetos",n:k,e:e}},otros.map(function(x){return {v:{t:"objetos",n:x,e:e}};})),
      pista:"Cuenta cada grupo y busca el que llega a "+k+".",ex:["El número "+k+" se lee «"+PALABRA[k]+"».","Cuenta cada grupo: el que tiene "+k+" es el correcto."]};}});
concepto({id:"masmenos",e:0,nom:"Más, menos e igual",obj:"Aprenderé a ver dónde hay más, dónde hay menos y cuándo hay igual.",mat:"Barras numéricas rojas y azules",
  pres:"Pon los objetos en fila, uno frente a otro. El lado al que le sobran tiene más.",
  casa:"Repartan galletas en dos platos y pregunten: ¿dónde hay más? Emparéjenlas una con una para comprobar.",dibujo:"🐷",abs:false,
  gen:function(r,n){var e=emo(r,0), a=ri(r,1,n===1?6:10), b=n===1?Math.max(0,Math.min(10,a+(r()<0.5?-1:1)*ri(r,2,3))):(r()<0.2?a:ri(r,1,10)); if(b<1)b=a+2;
    var pide=n===2&&r()<0.4?"menos":"más", ok=a===b?"🟰 Igual":(pide==="más"?(a>b?"⬅️ Este lado":"Este lado ➡️"):(a<b?"⬅️ Este lado":"Este lado ➡️"));
    return {q:"¿Dónde hay "+pide+" "+OBJ[e][1]+"?",v:{t:"dosgrupos",a:a,b:b,e:e},r:ops(r,ok,["⬅️ Este lado","Este lado ➡️","🟰 Igual"].filter(function(x){return x!==ok;})),
      pista:"Une cada "+OBJ[e][0]+" de un lado con una del otro lado.",ex:["Empareja uno con uno: "+Math.min(a,b)+" quedan en pareja.",a===b?"No sobra ninguno: hay igual.":"Sobran "+Math.abs(a-b)+" del lado que tiene más ("+Math.max(a,b)+")."]};}});
var FORMAS=[["circulo","círculo"],["cuadrado","cuadrado"],["triangulo","triángulo"],["rectangulo","rectángulo"],["ovalo","óvalo"],["rombo","rombo"],["pentagono","pentágono"],["hexagono","hexágono"]];
concepto({id:"formas",e:0,nom:"Formas geométricas",obj:"Aprenderé el nombre de las formas.",mat:"Gabinete geométrico",
  pres:"Recorre el borde de cada forma con el dedo: los lados rectos y las esquinas te dicen su nombre.",
  casa:"Busquen formas en la casa: el reloj es un círculo, la puerta un rectángulo, una porción de pizza un triángulo.",dibujo:"🐑",abs:false,
  gen:function(r,n){var lista=FORMAS.slice(0,n===1?4:8), f=pick(r,lista), otros=baraja(r,lista.filter(function(x){return x!==f;})).slice(0,2);
    var lados={triangulo:3,cuadrado:4,rectangulo:4,rombo:4,pentagono:5,hexagono:6}[f[0]];
    return {q:"¿Cómo se llama esta forma?",v:{t:"forma",f:f[0],c:pick(r,["#ef5350","#42a5f5","#66bb6a","#ffa726","#ab47bc"])},r:ops(r,f[1],otros.map(function(x){return x[1];})),
      pista:lados?"Cuenta sus lados y sus esquinas.":"Fíjate: no tiene esquinas.",ex:[lados?"Tiene "+lados+" lados rectos y "+lados+" esquinas.":"Es redonda, sin esquinas.","Se llama «"+f[1]+"»."]};}});
concepto({id:"patrones",e:0,nom:"Series y patrones",obj:"Aprenderé a descubrir qué sigue en una serie.",mat:"Cuentas de colores para ensartar",
  pres:"Un patrón es algo que se repite. Di la serie en voz alta y escucha qué se repite.",
  casa:"Hagan collares con fideos de dos colores repitiendo: rojo, azul, rojo, azul… ¿qué sigue?",dibujo:"🐴",abs:false,
  gen:function(r,n){var bases=n===1?[[0,1],[0,0,1]]:[[0,1,2],[0,1,1],[0,0,1,1],[0,1,2,1]], b=pick(r,bases), s=baraja(r,["🔴","🔵","🟡","🟢","🟣"]).slice(0,3), seq=[], L=b.length*2+ri(r,0,b.length-1);
    for(var i=0;i<L;i++)seq.push(s[b[i%b.length]]); var ok=s[b[L%b.length]], dis=s.filter(function(x,i){return x!==ok&&i<3;});
    if(dis.length<2)dis.push(pick(r,["🟠","🟤"]));
    return {q:"¿Qué sigue?",v:{t:"patron",seq:seq},r:ops(r,ok,dis.slice(0,2)),pista:"Lee la serie en voz alta desde el principio.",
      ex:["Lo que se repite es: "+b.map(function(k){return s[k];}).join(" ")+".","Después viene "+ok+"."]};}});
concepto({id:"juntar",e:0,nom:"Juntar: sumar hasta 10",obj:"Aprenderé que sumar es juntar y contar todo.",mat:"Barras numéricas y perlas de colores",
  pres:"Sumar es juntar dos grupos en uno solo y contar cuántos hay en total.",
  casa:"Junten dos montoncitos de botones y cuenten todo. Digan: «tres y dos son cinco».",dibujo:"🦆",abs:false,
  gen:function(r,n){var e=emo(r,0), a=ri(r,1,n===1?3:6), b=ri(r,1,n===1?5-a:Math.min(4,10-a)); if(b<1)b=1;
    return {q:"Junta los dos grupos: ¿cuántos hay en total?",qa:a+" + "+b+" = ?",v:{t:"juntar",a:a,b:b,e:e},r:opsNum(r,a+b,1,10),pista:"Cuenta los de un lado y sigue contando con los del otro.",
      ex:["Hay "+a+" de un lado y "+b+" del otro.","Júntalos y cuenta todos: "+a+" y "+b+" son "+(a+b)+"."]};}});

/* === 1.º de primaria === */
concepto({id:"contar100",e:1,nom:"Números hasta el 100",obj:"Aprenderé a leer números de dos cifras con decenas y unidades.",mat:"Perlas doradas: barras de diez y perlas sueltas",
  pres:"Una perla dorada es una unidad. Una barra de diez perlas es una decena. Las barras se cuentan de diez en diez.",
  casa:"Junten palitos en atados de diez con una liga. ¿Cuántos atados y cuántos sueltos hay?",dibujo:"🌷",
  gen:function(r,n){var k=n===1?ri(r,11,39):n===2?ri(r,40,99):ri(r,10,100), d=Math.floor(k/10), u=k%10;
    return {q:"¿Qué número forman las perlas?",qa:"Escribe el número que tiene "+pl(d,"decena","decenas")+" y "+pl(u,"unidad","unidades")+".",v:{t:"perlas",m:0,c:0,d:d,u:u},r:num(k),pista:"Cuenta las barras de diez en diez y luego suma las perlas sueltas.",
      ex:[(d===1?"1 barra de diez es ":d+" barras de diez son ")+(d*10)+".","Más "+pl(u,"perla suelta","perlas sueltas")+": "+(d*10)+" + "+u+" = "+k+"."]};}});
concepto({id:"decenas",e:1,nom:"Decenas y unidades",obj:"Aprenderé a formar números con decenas y unidades.",mat:"Perlas doradas",
  pres:"Para formar un número, primero pones las barras de diez y después las perlas sueltas.",
  casa:"Con monedas de 10 y de 1 centavo (o fichas de dos colores), armen precios como 47 y 63.",dibujo:"🐝",
  gen:function(r,n,f){var k=n===1?ri(r,11,49):ri(r,20,99), d=Math.floor(k/10), u=k%10;
    if(f===0)return {q:"Arma el número "+k+" con perlas.",v:{t:"numeral",n:k},r:{t:"perlas",ok:k,max:99},pista:"El "+d+" de la izquierda son barras de diez; el "+u+" son perlas sueltas.",
      ex:["En "+k+" el "+d+" son las decenas: pon "+pl(d,"barra de diez","barras de diez")+".","El "+u+" son las unidades: pon "+pl(u,"perla suelta","perlas sueltas")+"."]};
    var pide=r()<0.5?"decenas":"unidades";
    return {q:"¿Cuántas "+pide+" tiene el número "+k+"?",qa:"¿Cuántas "+pide+" tiene "+k+"?",v:{t:"perlas",m:0,c:0,d:d,u:u},r:num(pide==="decenas"?d:u),pista:"La cifra de la izquierda dice las decenas; la de la derecha, las unidades.",
      ex:[k+" = "+pl(d,"decena","decenas")+" y "+pl(u,"unidad","unidades")+".","Entonces tiene "+(pide==="decenas"?pl(d,"decena","decenas"):pl(u,"unidad","unidades"))+"."]};}});
concepto({id:"suma20",e:1,nom:"Sumar hasta 20",obj:"Aprenderé a sumar hasta 20 completando la decena.",mat:"Escalera de perlas de colores",
  pres:"Cada barra de perlas tiene su color: la del 7 es blanca, la del 8 marrón… Para sumar, juntas las barras y cuentas.",
  casa:"Usen una huevera de 10: llénenla primero y luego cuenten lo que sobra. Así se ve el «diez y algo».",dibujo:"🌻",
  gen:function(r,n){var a, b; if(n===1){a=ri(r,1,7);b=ri(r,1,10-a);} else if(n===2){a=ri(r,6,9);b=ri(r,11-a,9);} else {a=ri(r,4,12);b=ri(r,3,20-a);}
    var s=a+b, ex=s>10&&a<10&&b<10?["Completa la decena: "+Math.max(a,b)+" + "+(10-Math.max(a,b))+" = 10.","Te quedan "+(s-10)+": 10 + "+(s-10)+" = "+s+"."]:["Empieza en "+Math.max(a,b)+" y cuenta "+Math.min(a,b)+" más.",a+" + "+b+" = "+s+"."];
    return {q:"Junta las perlas: ¿cuántas hay?",qa:a+" + "+b+" = ?",v:{t:"barras",a:a,b:b},r:num(s),pista:"Busca formar un 10 primero.",ex:ex};}});
concepto({id:"resta20",e:1,nom:"Restar hasta 20",obj:"Aprenderé que restar es quitar y contar lo que queda.",mat:"Fichas y barras para quitar",
  pres:"Restar es quitar. Tachas los que se van y cuentas los que quedan.",
  casa:"Pongan 10 frijoles, escondan algunos bajo la mano y adivinen cuántos se escondieron.",dibujo:"🐌",
  gen:function(r,n){var a=ri(r,n===1?3:8,n===1?10:20), b=ri(r,1,n===3?a-1:Math.min(a-1,9)), e=emo(r,1);
    return {q:"Había "+a+" "+OBJ[e][1]+" y se van "+b+". ¿Cuántas quedan?",qa:a+" − "+b+" = ?",v:{t:"quitar",n:a,q:b,e:e},r:num(a-b),pista:"Tacha "+b+" y cuenta los que no están tachados.",
      ex:["Tacha "+b+" de los "+a+".","Cuenta los que quedan: "+a+" − "+b+" = "+(a-b)+"."]};}});
concepto({id:"comparar",e:1,nom:"Comparar números: < > =",obj:"Aprenderé a usar los signos mayor, menor e igual.",mat:"Perlas doradas y tarjetas de signos",
  pres:"El signo es como una boca abierta: siempre se abre hacia el número más grande.",
  casa:"Saquen dos cartas de una baraja y digan cuál es mayor; dibujen el signo con los dedos.",dibujo:"🍄",abs:true,
  gen:function(r,n){var a=ri(r,n===1?1:10,n===1?20:99), b=r()<(n===3?0.25:0.1)?a:ri(r,n===1?1:10,n===1?20:99); if(n>=2&&r()<0.4){b=Math.floor(a/10)*10+ri(r,0,9);}
    var ok=a>b?">":a<b?"<":"=";
    return {q:"¿Qué signo va entre "+a+" y "+b+"?",v:{t:"comparar",a:a,b:b},r:ops(r,ok,["<",">","="].filter(function(x){return x!==ok;})),pista:"Compara primero las decenas.",
      ex:["Mira las decenas: "+Math.floor(a/10)+" y "+Math.floor(b/10)+"; si son iguales, mira las unidades.",a+" "+ok+" "+b+(ok==="="?": son iguales.":": la boca se abre hacia "+Math.max(a,b)+".")]};}});
concepto({id:"pares",e:1,nom:"Pares e impares",obj:"Aprenderé a saber si un número es par o impar.",mat:"Tarjetas y fichas",
  pres:"Pon las fichas de dos en dos. Si a una no le queda pareja, el número es impar.",
  casa:"Repartan calcetines en pares: ¿sobra alguno?",dibujo:"🐞",
  gen:function(r,n){var k=ri(r,2,n===1?10:n===2?20:99), e=emo(r,1), ok=k%2?"Impar":"Par";
    return {q:"¿El "+k+" es par o impar?",v:{t:"pares",n:Math.min(k,20),e:e},r:ops(r,ok,[ok==="Par"?"Impar":"Par"]),pista:"Mira la última cifra: 0, 2, 4, 6 u 8 es par.",
      ex:[k<=20?"Pon las fichas de dos en dos.":"Basta mirar la última cifra: "+(k%10)+".",k%2?"Sobra una: "+k+" es impar.":"No sobra ninguna: "+k+" es par."]};}});

/* === 2.º de primaria === */
concepto({id:"valor1000",e:2,nom:"Valor posicional hasta 1000",obj:"Aprenderé a leer y formar números de tres cifras.",mat:"Perlas doradas: cuadrados de cien",
  pres:"Diez barras de diez forman un cuadrado de cien. Cada lugar del número tiene su material: centenas, decenas y unidades.",
  casa:"Con billetes de juguete de 100, 10 y 1, paguen precios como 345.",dibujo:"🦊",
  gen:function(r,n,f){var k=n===1?ri(r,100,399):ri(r,100,999), c=Math.floor(k/100), d=Math.floor(k/10)%10, u=k%10;
    if(f===0&&r()<0.5)return {q:"Arma el número "+k+" con perlas.",v:{t:"numeral",n:k},r:{t:"perlas",ok:k,max:999},pista:"Primero los cuadrados de cien, luego las barras de diez y al final las perlas sueltas.",
      ex:[pl(c,"cuadrado de cien","cuadrados de cien")+", "+pl(d,"barra de diez","barras de diez")+" y "+pl(u,"perla suelta","perlas sueltas")+".","Eso es "+k+"."]};
    return {q:"¿Qué número forman las perlas?",qa:"¿Qué número tiene "+pl(c,"centena","centenas")+", "+pl(d,"decena","decenas")+" y "+pl(u,"unidad","unidades")+"?",v:{t:"perlas",m:0,c:c,d:d,u:u},r:num(k),pista:"Cien, doscientos… luego de diez en diez y al final las sueltas.",
      ex:[pl(c,"centena","centenas")+" = "+(c*100)+"; "+pl(d,"decena","decenas")+" = "+(d*10)+"; "+pl(u,"unidad","unidades")+".",(c*100)+" + "+(d*10)+" + "+u+" = "+k+"."]};}});
function columnas(a,b,op){
  /* los pasos de una suma o resta en columna, con lo que se lleva o se pide prestado */
  var pasos=[], lugares=["unidades","decenas","centenas","millares"], la=String(a).split("").reverse(), lb=String(b).split("").reverse(), lleva=0;
  for(var i=0;i<Math.max(la.length,lb.length);i++){ var x=+(la[i]||0), y=+(lb[i]||0);
    if(op==="+"){var s=x+y+lleva; pasos.push(lugares[i]+": "+x+" + "+y+(lleva?" + "+lleva+" (que llevabas)":"")+" = "+s+(s>=10?" → escribes "+(s%10)+" y llevas 1":"")); lleva=s>=10?1:0;}
    else{var xx=x-lleva; if(xx<y){pasos.push(lugares[i]+": "+xx+" no alcanza para quitar "+y+": pides 1 "+lugares[i+1].replace(/s$/,"")+" → "+(xx+10)+" − "+y+" = "+(xx+10-y)); lleva=1;} else {pasos.push(lugares[i]+": "+xx+" − "+y+" = "+(xx-y)); lleva=0;}}
  }
  if(op==="+"&&lleva)pasos.push("El 1 que llevas va adelante.");
  return pasos;
}
concepto({id:"sumalleva",e:2,nom:"Sumar llevando",obj:"Aprenderé a sumar cuando una columna pasa de 9.",mat:"Juego de sellos",
  pres:"Sumas columna por columna. Cuando juntas diez unidades, las cambias por una decena: eso es «llevar».",
  casa:"Sumen precios del mercado en papel, con monedas para hacer los cambios de 10 en 10.",dibujo:"🦔",
  gen:function(r,n){var a,b; if(n===1){a=ri(r,11,59);b=ri(r,11,39); if((a%10)+(b%10)<10)b+=Math.min(9-b%10,9);} else if(n===2){a=ri(r,25,89);b=ri(r,16,79);} else {a=ri(r,120,689);b=ri(r,105,309);}
    return {q:"Suma con el juego de sellos: "+a+" + "+b,qa:a+" + "+b+" = ?",v:{t:"sellos",a:a,b:b,op:"+"},r:num(a+b),pista:"Empieza por las unidades. Si pasas de 9, llevas 1 a la columna de al lado.",ex:columnas(a,b,"+").concat([a+" + "+b+" = "+(a+b)])};}});
concepto({id:"restapide",e:2,nom:"Restar pidiendo prestado",obj:"Aprenderé a restar cuando arriba hay menos que abajo.",mat:"Juego de sellos",
  pres:"Si en una columna no te alcanza, cambias una decena por diez unidades: eso es «pedir prestado».",
  casa:"Jueguen a la tienda: paguen con un billete de 10 y den el cambio en monedas de 1.",dibujo:"🦉",
  gen:function(r,n){var a,b; if(n===1){a=ri(r,30,90);b=ri(r,11,a-10); if(a%10>=b%10){a=a-(a%10)+ri(r,0,4);b=b-(b%10)+ri(r,5,9); if(b>=a)b=a-ri(r,1,9);}} else if(n===2){a=ri(r,40,99);b=ri(r,12,a-1);} else {a=ri(r,300,999);b=ri(r,105,a-1);}
    return {q:"Resta con el juego de sellos: "+a+" − "+b,qa:a+" − "+b+" = ?",v:{t:"sellos",a:a,b:b,op:"−"},r:num(a-b),pista:"Empieza por las unidades. Si arriba hay menos, pide prestado a la columna de al lado.",ex:columnas(a,b,"−").concat([a+" − "+b+" = "+(a-b)])};}});
concepto({id:"grupos",e:2,nom:"Multiplicar es sumar grupos iguales",obj:"Aprenderé que multiplicar es juntar varios grupos del mismo tamaño.",mat:"Cadenas y barras de perlas",
  pres:"Si tienes 3 barras de 4 perlas, tienes 4 + 4 + 4. Eso se escribe 3 × 4.",
  casa:"Pongan 4 platos con 3 uvas cada uno: ¿cuántas uvas hay? Cuenten de 3 en 3.",dibujo:"🍁",
  gen:function(r,n){var a=ri(r,2,n===1?3:5), b=ri(r,2,n===1?5:n===2?6:9), e=emo(r,2);
    return {q:"Hay "+a+" grupos de "+b+". ¿Cuántos son en total?",qa:a+" × "+b+" = ?",v:{t:"grupos",a:a,b:b,e:e},r:num(a*b),pista:"Suma "+b+" tantas veces como grupos hay.",
      ex:[Array(a+1).join(b+" + ").slice(0,-3)+" = "+(a*b),a+" × "+b+" = "+(a*b)+"."]};}});
concepto({id:"hora",e:2,nom:"Leer la hora",obj:"Aprenderé a leer la hora en un reloj de agujas.",mat:"Reloj de madera con agujas móviles",
  pres:"La aguja corta marca la hora. La larga marca los minutos: cada número del reloj son 5 minutos.",
  casa:"Pregunten la hora varias veces al día mirando un reloj de agujas: «¿qué hora es cuando almorzamos?».",dibujo:"🦌",abs:false,
  gen:function(r,n){var h=ri(r,1,12), m=n===1?0:n===2?pick(r,[0,30]):ri(r,0,11)*5; function t(H,M){return H+":"+(M<10?"0":"")+M;}
    var ok=t(h,m), dis=[t(h===12?1:h+1,m),t(h,(m+30)%60),t(m===0?12:Math.max(1,Math.round(m/5))%12||12,h*5%60)].filter(function(x,i,a){return x!==ok&&a.indexOf(x)===i;}).slice(0,2);
    while(dis.length<2)dis.push(t((h+dis.length+3)%12||12,m));
    return {q:"¿Qué hora marca el reloj?",v:{t:"reloj",h:h,m:m},r:ops(r,ok,dis),pista:"Mira primero la aguja corta: es la hora.",
      ex:["La aguja corta está "+(m===0?"en el "+h:"entre el "+h+" y el "+(h%12+1))+": son las "+h+".","La aguja larga en el "+(m/5||12)+" son "+m+" minutos: "+ok+"."]};}});

/* === 3.º de primaria === */
var GRUPO_TABLAS=[[2,5,10],[3,4,6],[7,8,9]];
concepto({id:"tablas",e:3,nom:"Tablas de multiplicar",obj:"Aprenderé las tablas de multiplicar entendiendo de dónde salen.",mat:"Tablero de multiplicar con perlas",
  pres:"En el tablero pones filas de perlas: 3 filas de 7 perlas son 3 × 7. Contar las perlas da el resultado.",
  casa:"Busquen multiplicaciones en la casa: las ventanas en filas, los huevos en la caja (2 × 6).",dibujo:"🐠",
  gen:function(r,n){var a=pick(r,GRUPO_TABLAS[n-1]), b=ri(r,2,10); if(r()<0.5){var t=a;a=b;b=t;}
    return {q:"¿Cuántas perlas hay en el tablero?",qa:a+" × "+b+" = ?",v:{t:"matriz",f:a,c:b},r:num(a*b),pista:"Cuenta una fila y súmala tantas veces como filas hay.",
      ex:[a+" filas de "+b+" perlas.",a+" × "+b+" = "+(a*b)+(a===b?"":" (y "+b+" × "+a+" da lo mismo)")+"."]};}});
concepto({id:"repartir",e:3,nom:"Dividir es repartir",obj:"Aprenderé que dividir es repartir en partes iguales.",mat:"Tablero de división con bolitas y platos",
  pres:"Repartes de a uno: uno para cada plato, otra vuelta, y así hasta que no quede nada.",
  casa:"Repartan 12 galletas entre 3 personas de a una por vuelta. ¿Cuántas le tocan a cada una?",dibujo:"🐚",
  gen:function(r,n){var k=ri(r,2,n===1?3:n===2?5:9), q=ri(r,2,n===1?5:9), e=emo(r,3), N=k*q;
    return {q:"Reparte "+N+" "+OBJ[e][1]+" en "+k+" platos iguales. ¿Cuánt"+(OBJ[e][2]==="f"?"as":"os")+" van en cada plato?",qa:N+" ÷ "+k+" = ?",v:{t:"reparto",n:N,k:k,e:e},r:num(q),pista:"Da una a cada plato, vuelta tras vuelta.",
      ex:["Reparte de a una: en cada vuelta usas "+k+".","Cada plato recibe "+q+", porque "+k+" × "+q+" = "+N+"."]};}});
concepto({id:"fracciones",e:3,nom:"Fracciones: partes de un todo",obj:"Aprenderé qué significa una fracción como 3/4.",mat:"Círculos de fracciones",
  pres:"Partimos un círculo en partes iguales. El número de abajo dice en cuántas partes; el de arriba, cuántas tomamos.",
  casa:"Corten una tortilla o una pizza en partes iguales: ¿qué fracción se comió cada uno?",dibujo:"🦀",
  gen:function(r,n,f){var d=n===1?pick(r,[2,3,4]):ri(r,3,8), k=ri(r,1,d-1);
    if(f===0)return {q:"Pinta "+k+"/"+d+" del círculo.",v:{t:"pastel",n:0,d:d},r:{t:"pastel",den:d,ok:k},pista:"Pinta "+k+" de las "+d+" partes.",
      ex:["El círculo tiene "+d+" partes iguales.","Pinta "+k+": eso es "+k+"/"+d+"."]};
    var ok=k+"/"+d, dis=[d+"/"+k,(d-k)+"/"+d,k+"/"+(d+1)].filter(function(x){return x!==ok;});
    return {q:"¿Qué fracción está pintada?",v:{t:"pastel",n:k,d:d},r:ops(r,ok,baraja(r,dis).slice(0,2)),pista:"Cuenta todas las partes (abajo) y las pintadas (arriba).",
      ex:["El círculo está partido en "+d+" partes iguales: abajo va "+d+".","Hay "+k+" pintadas: arriba va "+k+". Es "+ok+"."]};}});
concepto({id:"perimetro",e:3,nom:"Perímetro",obj:"Aprenderé a medir el borde de una figura.",mat:"Varillas y cuadrícula",
  pres:"El perímetro es lo que mide el borde: recorres todo el contorno sumando cada lado.",
  casa:"Midan con pasos el borde del patio o con una cuerda el borde de la mesa.",dibujo:"🐙",
  gen:function(r,n){var w=ri(r,2,n===1?5:9), h=ri(r,2,n===1?4:7); if(n===3&&r()<0.4)h=w;
    return {q:"¿Cuánto mide el borde de la figura?",qa:"Un rectángulo mide "+w+" por "+h+". ¿Cuál es su perímetro?",v:{t:"rejilla",w:w,h:h,modo:"perimetro"},r:num(2*(w+h),{u:"unidades"}),pista:"Suma los cuatro lados.",
      ex:["Los lados miden "+w+", "+h+", "+w+" y "+h+".",w+" + "+h+" + "+w+" + "+h+" = "+(2*(w+h))+"."]};}});
var PROBLEMAS3=[
  function(r){var a=ri(r,12,48),b=ri(r,8,30); return {q:"En el bus van "+a+" personas y suben "+b+". ¿Cuántas van ahora?",ok:a+b,e:"🚌",op:a+" + "+b};},
  function(r){var a=ri(r,30,90),b=ri(r,8,a-5); return {q:"Sofía tenía "+a+" Bs y gastó "+b+" Bs. ¿Cuánto le queda?",ok:a-b,e:"👛",op:a+" − "+b};},
  function(r){var a=ri(r,3,9),b=ri(r,3,9); return {q:"Hay "+a+" cajas con "+b+" lápices cada una. ¿Cuántos lápices hay?",ok:a*b,e:"✏️",op:a+" × "+b};},
  function(r){var k=ri(r,2,6),q=ri(r,3,9); return {q:"Se reparten "+(k*q)+" caramelos entre "+k+" niños por igual. ¿Cuántos recibe cada uno?",ok:q,e:"🍬",op:(k*q)+" ÷ "+k};}
];
concepto({id:"problemas",e:3,nom:"Resolver problemas",obj:"Aprenderé a elegir la operación que resuelve un problema.",mat:"Tarjetas de problemas y material",
  pres:"Lee el problema despacio, imagina la escena y pregúntate: ¿junto, quito, reparto o repito grupos?",
  casa:"Inventen problemas con las compras del día: «si compramos 3 panes de 2 Bs…».",dibujo:"🐬",
  gen:function(r,n){var p=pick(r,PROBLEMAS3.slice(0,n===1?2:4))(r);
    return {q:p.q,v:{t:"escena",e:p.e},r:num(p.ok),pista:"¿Juntas, quitas, repartes o son grupos iguales?",ex:["La operación es "+p.op+".",p.op+" = "+p.ok+"."]};}});

/* === 4.º de primaria === */
concepto({id:"multi2",e:4,nom:"Multiplicar por varias cifras",obj:"Aprenderé a multiplicar números grandes por partes.",mat:"Tablero de ajedrez de la multiplicación",
  pres:"Separas el número en decenas y unidades, multiplicas cada parte y al final sumas los resultados.",
  casa:"Calculen el costo de 12 cuadernos de 7 Bs: 10 × 7 + 2 × 7.",dibujo:"🚲",
  gen:function(r,n){var a=ri(r,12,n===1?49:99), b=n===3?ri(r,11,29):ri(r,2,9), pasos;
    if(b<10){var d=Math.floor(a/10)*10, u=a%10; pasos=[d+" × "+b+" = "+(d*b)+" y "+u+" × "+b+" = "+(u*b)+".",(d*b)+" + "+(u*b)+" = "+(a*b)+"."];}
    else{var bd=Math.floor(b/10)*10, bu=b%10; pasos=[a+" × "+bu+" = "+(a*bu)+".",a+" × "+bd+" = "+(a*bd)+".",(a*bu)+" + "+(a*bd)+" = "+(a*b)+"."];}
    return {q:"Multiplica por partes: "+a+" × "+b,qa:a+" × "+b+" = ?",v:{t:"tablero",a:a,b:b},r:num(a*b),pista:"Separa el número en decenas y unidades.",ex:pasos};}});
concepto({id:"division",e:4,nom:"División larga",obj:"Aprenderé a dividir números grandes paso a paso.",mat:"Tubos de ensayo y tablero de división",
  pres:"Repartes primero las centenas, luego las decenas y al final las unidades. Lo que sobra en un lugar baja al siguiente.",
  casa:"Repartan 96 fichas entre 4 personas: primero los atados de diez y luego las sueltas.",dibujo:"🏠",
  gen:function(r,n){var k=ri(r,2,9), q=n===1?ri(r,11,30):n===2?ri(r,21,99):ri(r,101,250), N=k*q;
    return {q:"Divide repartiendo por lugares: "+N+" ÷ "+k,qa:N+" ÷ "+k+" = ?",v:{t:"divlarga",n:N,k:k},r:num(q),pista:"¿Cuántas veces cabe "+k+" en las primeras cifras?",
      ex:["Busca el número que multiplicado por "+k+" da "+N+".",k+" × "+q+" = "+N+", así que "+N+" ÷ "+k+" = "+q+"."]};}});
concepto({id:"equivalentes",e:4,nom:"Fracciones equivalentes",obj:"Aprenderé que fracciones distintas pueden ser la misma cantidad.",mat:"Círculos de fracciones superpuestos",
  pres:"Si pones 2/4 encima de 1/2, cubren lo mismo. Multiplicar arriba y abajo por el mismo número no cambia la cantidad.",
  casa:"Doblen una hoja por la mitad y otra vez: la mitad es igual a dos cuartos.",dibujo:"🚌",
  gen:function(r,n){var b=ri(r,2,n===1?4:6), a=ri(r,1,b-1), f=fr(a,b); a=f.n; b=f.d; var k=ri(r,2,n===3?5:3);
    return {q:"Completa: "+a+"/"+b+" = ?/"+(b*k),qa:a+"/"+b+" = ?/"+(b*k),v:{t:"pasteles",a:{n:a,d:b},b:{n:a*k,d:b*k}},r:num(a*k),pista:"¿Por cuánto se multiplicó el "+b+" para llegar a "+(b*k)+"?",
      ex:["El "+b+" se multiplicó por "+k+" para llegar a "+(b*k)+".","Arriba también: "+a+" × "+k+" = "+(a*k)+". Entonces "+a+"/"+b+" = "+(a*k)+"/"+(b*k)+"."]};}});
concepto({id:"decimales",e:4,nom:"Décimas y centésimas",obj:"Aprenderé a leer números decimales.",mat:"Cuadrado de cien y tablero decimal",
  pres:"Si el cuadrado entero es 1, cada fila es una décima (0,1) y cada cuadrito una centésima (0,01).",
  casa:"Miren precios: 2,50 Bs son 2 bolivianos y 50 centavos (50 centésimas).",dibujo:"🏢",
  gen:function(r,n){var k=n===1?ri(r,1,9)*10:ri(r,1,99);
    return {q:"¿Qué número decimal muestra la cuadrícula?",qa:"Escribe como decimal: "+k+" centésimos.",v:{t:"cien",n:k},r:num(k/100,{dec:true}),pista:"Cuenta las filas llenas (décimas) y los cuadritos sueltos (centésimas).",
      ex:["Cada cuadrito es 0,01; cada fila de diez es 0,1.","Hay "+k+" cuadritos: "+nt(k/100)+"."]};}});
concepto({id:"area",e:4,nom:"Área",obj:"Aprenderé a medir cuánto espacio cubre una figura.",mat:"Cuadrícula y fichas cuadradas",
  pres:"El área cuenta cuántos cuadritos caben dentro. En un rectángulo: filas por columnas.",
  casa:"Cubran un libro con hojas de notas cuadradas: ¿cuántas caben?",dibujo:"🚦",
  gen:function(r,n){var w=ri(r,2,n===1?5:12), h=ri(r,2,n===1?4:9);
    return {q:"¿Cuántos cuadritos cubren la figura?",qa:"Un rectángulo mide "+w+" por "+h+". ¿Cuál es su área?",v:{t:"rejilla",w:w,h:h,modo:"area"},r:num(w*h,{u:"unidades²"}),pista:"Multiplica las filas por las columnas.",
      ex:["Tiene "+h+" filas de "+w+" cuadritos.",h+" × "+w+" = "+(w*h)+"."]};}});

/* === 5.º y 6.º de primaria === */
concepto({id:"sumafr",e:5,nom:"Sumar fracciones",obj:"Aprenderé a sumar fracciones, también con distinto denominador.",mat:"Círculos de fracciones",
  pres:"Solo se pueden juntar partes del mismo tamaño. Si son distintas, primero las partes se cortan del mismo tamaño (común denominador).",
  casa:"Con tazas medidoras: media taza más un cuarto de taza, ¿cuánto es?",dibujo:"🦅",
  gen:function(r,n){var b=ri(r,2,6), d=n===1?b:n===2?b*ri(r,2,2):ri(r,2,6); if(n===3&&d===b)d=b+1;
    var a=ri(r,1,b-1), c=ri(r,1,d-1), m=mcm(b,d), s=fr(a*(m/b)+c*(m/d),m);
    return {q:"Suma las fracciones. Escribe el resultado como fracción (por ejemplo 5/6).",qa:a+"/"+b+" + "+c+"/"+d+" = ?",v:{t:"pasteles",a:{n:a,d:b},b:{n:c,d:d},op:"+"},r:num(s.n/s.d,{frac:true,txt:frTxt(s)}),
      pista:b===d?"Mismo denominador: suma solo los de arriba.":"Busca un denominador común: "+m+".",
      ex:b===d?[a+"/"+b+" + "+c+"/"+d+" = "+(a+c)+"/"+b+".","Simplificado: "+frTxt(s)+"."]:["Común denominador: "+m+". "+a+"/"+b+" = "+(a*m/b)+"/"+m+" y "+c+"/"+d+" = "+(c*m/d)+"/"+m+".",(a*m/b)+"/"+m+" + "+(c*m/d)+"/"+m+" = "+(a*m/b+c*m/d)+"/"+m+" = "+frTxt(s)+"."]};}});
concepto({id:"porcentaje",e:5,nom:"Porcentajes",obj:"Aprenderé que el porcentaje es cuántos de cada cien.",mat:"Cuadrado de cien",
  pres:"Por ciento quiere decir «de cada cien». 25 % es 25 de cada 100: un cuarto del cuadrado.",
  casa:"En el mercado: si algo de 40 Bs tiene 25 % de descuento, ¿cuánto se ahorra?",dibujo:"🏔️",
  gen:function(r,n){
    if(n===1){var k=ri(r,1,19)*5; return {q:"¿Qué porcentaje está pintado?",qa:"¿Qué porcentaje es "+k+" de 100?",v:{t:"cien",n:k},r:num(k,{u:"%"}),pista:"Cuenta los cuadritos pintados de los 100.",ex:["Hay "+k+" pintados de 100.","Eso es "+k+" %."]};}
    var p=pick(r,[10,20,25,50,75]), base=p===25||p===75?ri(r,2,12)*4:ri(r,2,20)*10/(p===50?5:1);
    if(n===2)return {q:"¿Cuánto es el "+p+" % de "+base+"?",v:{t:"cien",n:p},r:num(base*p/100),pista:"Divide entre 100 y multiplica por "+p+" (o usa fracciones: 25 % = 1/4).",ex:[p+" % = "+p+"/100.",base+" × "+p+" ÷ 100 = "+nt(base*p/100)+"."]};
    var tot=ri(r,2,10)*10, parte=tot*pick(r,[10,20,30,40,50,60,80])/100;
    return {q:parte+" de "+tot+" estudiantes llevan lentes. ¿Qué porcentaje es?",v:{t:"escena",e:"👓"},r:num(parte*100/tot,{u:"%"}),pista:"Divide la parte entre el total y multiplica por 100.",ex:[parte+" ÷ "+tot+" = "+nt(parte/tot)+".",nt(parte/tot)+" × 100 = "+nt(parte*100/tot)+" %."]};}});
concepto({id:"decops",e:5,nom:"Operar con decimales",obj:"Aprenderé a sumar, restar y multiplicar con decimales.",mat:"Tablero decimal",
  pres:"Al sumar o restar decimales, alineas las comas: décimas con décimas y centésimas con centésimas.",
  casa:"Sumen el vuelto de una compra: 3,50 Bs + 1,20 Bs.",dibujo:"🐐",
  gen:function(r,n){var a=ri(r,11,99)/10, b=ri(r,11,99)/10, op;
    if(n===1){op="+";} else if(n===2){a=ri(r,110,999)/100; b=ri(r,105,a*100-5)/100; op="−";} else {a=ri(r,11,99)/10; b=pick(r,[10,100,3,4,5]); op="×";}
    var res=op==="+"?a+b:op==="−"?a-b:a*b; res=Math.round(res*1000)/1000;
    return {q:"Calcula con decimales: "+nt(a)+" "+op+" "+nt(b),qa:nt(a)+" "+op+" "+nt(b)+" = ?",v:{t:"decimal",a:a,b:b,op:op},r:num(res,{dec:true}),pista:op==="×"&&(b===10||b===100)?"Multiplicar por "+b+" corre la coma "+(b===10?"un lugar":"dos lugares")+" a la derecha.":"Alinea las comas.",
      ex:[op==="×"?nt(a)+" × "+b+": "+(b===10||b===100?"la coma se corre a la derecha.":"multiplica como si no hubiera coma y luego pon una cifra decimal."):"Alinea las comas y opera columna por columna.",nt(a)+" "+op+" "+nt(b)+" = "+nt(res)+"."]};}});
concepto({id:"angulos",e:5,nom:"Ángulos",obj:"Aprenderé a clasificar y medir ángulos.",mat:"Transportador y círculo de grados",
  pres:"Un ángulo es la abertura entre dos lados. El recto mide 90°, como la esquina de una hoja.",
  casa:"Abran la puerta poco a poco: agudo, recto, obtuso… y llano cuando queda en línea.",dibujo:"🌄",abs:false,
  gen:function(r,n){
    if(n===1){var g=pick(r,[ri(r,15,80),90,ri(r,100,170),180]), ok=g<90?"Agudo":g===90?"Recto":g<180?"Obtuso":"Llano";
      return {q:"¿Qué tipo de ángulo es?",v:{t:"angulo",g:g},r:ops(r,ok,baraja(r,["Agudo","Recto","Obtuso","Llano"].filter(function(x){return x!==ok;})).slice(0,2)),pista:"Compáralo con la esquina de una hoja (90°).",
        ex:["Mide "+g+"°.",g<90?"Menos de 90°: agudo.":g===90?"Exactamente 90°: recto.":g<180?"Entre 90° y 180°: obtuso.":"180°: llano."]};}
    if(n===2){var g2=ri(r,2,17)*10; return {q:"¿Cuántos grados mide el ángulo?",v:{t:"angulo",g:g2,transp:true},r:opsNum(r,g2,10,180,10),pista:"Lee el transportador desde el lado que empieza en 0.",ex:["Un lado está en 0°.","El otro marca "+g2+"°."]};}
    var g3=ri(r,10,80), sup=r()<0.5;
    return {q:"¿Cuánto mide el "+(sup?"suplemento":"complemento")+" de un ángulo de "+g3+"°?",v:{t:"angulo",g:g3},r:num(sup?180-g3:90-g3,{u:"°"}),pista:sup?"Suplementarios suman 180°.":"Complementarios suman 90°.",
      ex:[sup?"Dos ángulos suplementarios suman 180°.":"Dos ángulos complementarios suman 90°.",(sup?180:90)+" − "+g3+" = "+(sup?180-g3:90-g3)+"°."]};}});
concepto({id:"multiplos",e:5,nom:"Múltiplos y divisores",obj:"Aprenderé a encontrar múltiplos, divisores, MCD y mcm.",mat:"Cadenas de perlas y tablero de factores",
  pres:"Los múltiplos de 3 son las paradas al saltar de 3 en 3. Un divisor reparte un número en grupos iguales, sin que sobre nada.",
  casa:"Jueguen a saltar de 3 en 3 y de 4 en 4 en una fila de baldosas: ¿dónde coinciden?",dibujo:"🦙",
  gen:function(r,n){
    if(n===1){var k=ri(r,2,9), ok=k*ri(r,2,9), dis=[ok+1,ok+(k>2?k-1:3)].map(function(x){return x%k===0?x+1:x;});
      return {q:"¿Cuál es múltiplo de "+k+"?",v:{t:"saltos",k:k},r:ops(r,String(ok),dis.map(String)),pista:"Un múltiplo de "+k+" se divide entre "+k+" sin que sobre nada.",ex:[ok+" ÷ "+k+" = "+(ok/k)+", exacto.","Por eso "+ok+" es múltiplo de "+k+"."]};}
    var g=ri(r,2,9), a=g*ri(r,2,7), b=g*ri(r,2,7); while(a===b)b+=g; var m=mcd(a,b);
    if(n===2)return {q:"¿Cuál es el máximo común divisor (MCD) de "+a+" y "+b+"?",v:{t:"saltos",k:m,a:a,b:b},r:num(m),pista:"Busca el número más grande que divide a los dos.",ex:["Divisores comunes de "+a+" y "+b+": el mayor es "+m+".","MCD("+a+", "+b+") = "+m+"."]};
    var x=ri(r,2,9), y=ri(r,2,12); while(x===y)y++; var L=mcm(x,y);
    return {q:"¿Cuál es el mínimo común múltiplo (mcm) de "+x+" y "+y+"?",v:{t:"saltos",k:x,k2:y},r:num(L),pista:"Salta de "+x+" en "+x+" y de "+y+" en "+y+": ¿dónde se encuentran por primera vez?",ex:["Múltiplos de "+x+" y de "+y+"…","El primero que comparten es "+L+"."]};}});
concepto({id:"volumen",e:5,nom:"Volumen",obj:"Aprenderé a medir cuánto espacio ocupa un cuerpo.",mat:"Cubitos y prismas",
  pres:"El volumen cuenta los cubitos que caben dentro: largo por ancho por alto.",
  casa:"Llenen una caja con dados o cubos: ¿cuántos caben en la base y cuántos pisos hay?",dibujo:"🗻",
  gen:function(r,n){var l=ri(r,2,n===1?3:5), w=ri(r,2,n===1?3:4), h=ri(r,1,n===1?2:4);
    return {q:"¿Cuántos cubitos tiene el prisma?",qa:"Un prisma mide "+l+" × "+w+" × "+h+". ¿Cuál es su volumen?",v:{t:"cubos",l:l,w:w,h:h},r:num(l*w*h,{u:"cubitos"}),pista:"Cuenta los de un piso y multiplícalos por los pisos.",
      ex:["Un piso tiene "+l+" × "+w+" = "+(l*w)+" cubitos.","Con "+h+" pisos: "+(l*w)+" × "+h+" = "+(l*w*h)+"."]};}});

/* === 1.º y 2.º de secundaria === */
concepto({id:"enteros",e:6,nom:"Números enteros",obj:"Aprenderé a operar con números negativos.",mat:"Recta numérica y fichas de dos colores",
  pres:"Los negativos están a la izquierda del cero, como las temperaturas bajo cero o los pisos del sótano.",
  casa:"Miren un termómetro o el ascensor: subir 5 desde −2, ¿a qué piso llega?",dibujo:"🎈",
  gen:function(r,n){
    if(n===1){var a=ri(r,-9,9), b=ri(r,-9,9); while(a===b)b=ri(r,-9,9); var ok=a>b?">":"<";
      return {q:"¿Qué signo va entre "+nt(a)+" y "+nt(b)+"?",v:{t:"recta",min:-10,max:10,p:[a,b]},r:ops(r,ok,[ok===">"?"<":">","="]),pista:"En la recta, el mayor está más a la derecha.",ex:["Ubícalos en la recta.",nt(a)+" "+ok+" "+nt(b)+": el de la derecha es mayor."]};}
    var x=ri(r,-12,12), y=ri(r,-12,12), op=n===2?"+":pick(r,["−","×"]), res=op==="+"?x+y:op==="−"?x-y:x*y; if(op==="×"){x=ri(r,1,9)*(r()<0.5?-1:1);y=ri(r,1,9)*(r()<0.5?-1:1);res=x*y;}
    return {q:"Calcula: ("+nt(x)+") "+op+" ("+nt(y)+")",qa:"("+nt(x)+") "+op+" ("+nt(y)+") = ?",v:{t:"recta",min:-25,max:25,salto:op==="×"?false:[x,op==="+"?y:-y]},r:num(res,{neg:true}),
      pista:op==="×"?"Signos iguales dan positivo; distintos, negativo.":op==="−"?"Restar un número es sumar su opuesto.":"Parte de "+nt(x)+" y avanza "+nt(y)+" (a la izquierda si es negativo).",
      ex:op==="×"?["Multiplica los valores: "+Math.abs(x)+" × "+Math.abs(y)+" = "+Math.abs(x*y)+".",(x<0)===(y<0)?"Signos iguales: positivo → "+nt(res)+".":"Signos distintos: negativo → "+nt(res)+"."]:
        op==="−"?["Restar "+nt(y)+" es sumar "+nt(-y)+".",nt(x)+" + ("+nt(-y)+") = "+nt(res)+"."]:["Empieza en "+nt(x)+" y muévete "+Math.abs(y)+" hacia la "+(y>=0?"derecha":"izquierda")+".","Llegas a "+nt(res)+"."]};}});
concepto({id:"potencias",e:6,nom:"Potencias y raíces",obj:"Aprenderé qué son los cuadrados, los cubos y las raíces.",mat:"Cuadrados y cubos de perlas",
  pres:"Una cadena de 5 perlas doblada en 5 filas forma un cuadrado: 5² = 25. Con 5 cuadrados apilados, un cubo: 5³ = 125.",
  casa:"Armen cuadrados con fichas: 2 × 2, 3 × 3, 4 × 4… ¿cuántas fichas tiene cada uno?",dibujo:"🪁",
  gen:function(r,n){var b=ri(r,2,n===1?10:n===2?6:15);
    if(n===1)return {q:"¿Cuántas perlas tiene el cuadrado?",qa:b+"² = ?",v:{t:"cuadrado",n:b},r:num(b*b),pista:"Es "+b+" filas de "+b+".",ex:[b+"² = "+b+" × "+b+".","= "+(b*b)+"."]};
    if(n===2)return {q:"¿Cuántas perlas tiene el cubo?",qa:b+"³ = ?",v:{t:"cubo",n:b},r:num(b*b*b),pista:b+" × "+b+" × "+b+".",ex:[b+"³ = "+b+" × "+b+" × "+b+".","= "+(b*b)+" × "+b+" = "+(b*b*b)+"."]};
    return {q:"Un cuadrado de perlas tiene "+(b*b)+" perlas. ¿Cuántas tiene cada lado?",qa:"√"+(b*b)+" = ?",v:{t:"cuadrado",n:b,oculto:true},r:num(b),pista:"¿Qué número multiplicado por sí mismo da "+(b*b)+"?",ex:["Busca un número que por sí mismo dé "+(b*b)+".",b+" × "+b+" = "+(b*b)+", así que √"+(b*b)+" = "+b+"."]};}});
var COSAS=[["cuadernos","Bs"],["kilos de papa","Bs"],["entradas al cine","Bs"],["litros de leche","Bs"]];
concepto({id:"proporcion",e:6,nom:"Proporciones y regla de tres",obj:"Aprenderé a resolver problemas de proporcionalidad.",mat:"Tablas de proporción",
  pres:"Si una cantidad crece, la otra crece en la misma proporción. Primero averigua cuánto vale una unidad.",
  casa:"Dupliquen una receta: si para 4 personas van 2 tazas, ¿cuánto para 6?",dibujo:"🛩️",
  gen:function(r,n){var c=pick(r,COSAS), u=ri(r,2,n===1?5:15), a=ri(r,2,6), b=ri(r,2,12); while(b===a)b++;
    if(n===3){var obreros=ri(r,2,6), dias=ri(r,2,6)*ri(r,2,4), total=obreros*dias, o2=pick(r,[1,2,3,4,6,8,12].filter(function(x){return total%x===0&&x!==obreros;}))||1;
      return {q:obreros+" personas pintan una casa en "+dias+" días. ¿Cuántos días tardan "+o2+" personas? (proporción inversa)",v:{t:"tabla",f:[["Personas",obreros,o2],["Días",dias,"?"]]},r:num(total/o2),pista:"Más personas, menos días: el producto queda igual.",
        ex:[obreros+" × "+dias+" = "+total+" «días de trabajo».",total+" ÷ "+o2+" = "+(total/o2)+" días."]};}
    return {q:"Si "+a+" "+c[0]+" cuestan "+(a*u)+" "+c[1]+", ¿cuánto cuestan "+b+"?",v:{t:"tabla",f:[[c[0],a,b],[c[1],a*u,"?"]]},r:num(b*u,{u:c[1]}),pista:"Calcula primero cuánto cuesta uno.",
      ex:["Uno cuesta "+(a*u)+" ÷ "+a+" = "+u+" "+c[1]+".",b+" cuestan "+b+" × "+u+" = "+(b*u)+" "+c[1]+"."]};}});
concepto({id:"ecuaciones",e:6,nom:"Ecuaciones de primer grado",obj:"Aprenderé a encontrar el valor de x manteniendo la balanza en equilibrio.",mat:"Balanza algebraica",
  pres:"Una ecuación es una balanza en equilibrio. Lo que haces de un lado, lo haces del otro, hasta dejar sola a la x.",
  casa:"Con una balanza de juguete (o una regla sobre un lápiz), equilibren bolsitas con monedas.",dibujo:"☁️",
  gen:function(r,n){var x=ri(r,n===3?-6:1,12), a=n===1?1:ri(r,2,6), b=n===2?0:ri(r,1,15); if(x===0)x=3; var c=a*x+b;
    var izq=(a===1?"":a)+"x"+(b?" + "+b:"");
    return {q:"¿Cuánto vale x?",qa:izq+" = "+nt(c),v:{t:"balanza",a:a,b:b,c:c},r:num(x,{neg:n===3}),pista:b?"Primero quita "+b+" de los dos platos.":"Divide los dos platos entre "+a+".",
      ex:(b?["Quita "+b+" de los dos lados: "+(a===1?"":a)+"x = "+nt(c-b)+"."]:[]).concat(a===1?["x = "+nt(x)+"."]:["Divide entre "+a+": x = "+nt(c-b)+" ÷ "+a+" = "+nt(x)+"."])};}});
concepto({id:"expresiones",e:6,nom:"Expresiones algebraicas",obj:"Aprenderé a reducir términos y calcular el valor de una expresión.",mat:"Fichas de álgebra",
  pres:"Las fichas largas son x y las cuadraditas son 1. Se juntan solo las del mismo tipo: x con x y números con números.",
  casa:"Con dos tipos de fichas (botones y fideos), escriban «3 botones + 2 fideos + 1 botón» y simplifiquen.",dibujo:"🌈",
  gen:function(r,n){
    if(n===1){var a=ri(r,2,5),b=ri(r,1,9),x=ri(r,1,6); return {q:"¿Cuánto vale "+a+"x + "+b+" si x = "+x+"?",v:{t:"fichas",x:a,u:b},r:num(a*x+b),pista:"Cambia cada x por "+x+".",ex:[a+" · "+x+" + "+b,"= "+(a*x)+" + "+b+" = "+(a*x+b)+"."]};}
    if(n===2){var p=ri(r,1,6),q=ri(r,1,6),s=ri(r,1,4); return {q:"Reduce "+p+"x + "+q+"x − "+s+"x. ¿Cuántas x quedan?",v:{t:"fichas",x:p+q,u:0,quita:s},r:num(p+q-s,{neg:true}),pista:"Suma y resta solo los coeficientes de x.",ex:[p+" + "+q+" − "+s+" = "+(p+q-s)+".","Quedan "+(p+q-s)+"x."]};}
    var k=ri(r,2,5), m=ri(r,1,6), v=ri(r,-4,6);
    return {q:"¿Cuánto vale "+k+"(x + "+m+") si x = "+nt(v)+"?",v:{t:"fichas",x:k,u:k*m},r:num(k*(v+m),{neg:true}),pista:"Primero el paréntesis, luego multiplica.",ex:["x + "+m+" = "+nt(v)+" + "+m+" = "+nt(v+m)+".",k+" × "+nt(v+m)+" = "+nt(k*(v+m))+"."]};}});

/* === 3.º y 4.º de secundaria === */
function recta(m,b){return "y = "+(m===1?"":m===-1?"−":nt(m))+"x"+(b>0?" + "+b:b<0?" − "+(-b):"");}
concepto({id:"funcionlineal",e:7,nom:"Función lineal",obj:"Aprenderé a leer la pendiente y la ordenada de una recta.",mat:"Plano cartesiano",
  pres:"En y = mx + b, b es donde la recta corta al eje y, y m es cuánto sube por cada paso a la derecha.",
  casa:"El taxi cobra 5 Bs al subir y 2 Bs por kilómetro: dibujen la recta del precio.",dibujo:"🛰️",
  gen:function(r,n){var m=ri(r,-3,3)||2, b=ri(r,-4,4);
    if(n===1){var x=ri(r,-3,4); return {q:"Si "+recta(m,b)+", ¿cuánto vale y cuando x = "+nt(x)+"?",v:{t:"plano",m:m,b:b,px:x},r:num(m*x+b,{neg:true}),pista:"Reemplaza x por "+nt(x)+".",ex:["y = "+nt(m)+" · "+nt(x)+" + ("+nt(b)+")","y = "+nt(m*x+b)+"."]};}
    if(n===2)return {q:"¿Cuál es la pendiente (m) de la recta?",v:{t:"plano",m:m,b:b},r:num(m,{neg:true}),pista:"Desde un punto, avanza 1 a la derecha: ¿cuánto sube o baja?",ex:["Por cada paso a la derecha, la recta "+(m>=0?"sube ":"baja ")+Math.abs(m)+".","m = "+nt(m)+"."]};
    return {q:"¿En qué valor corta la recta al eje y (ordenada b)?",v:{t:"plano",m:m,b:b},r:num(b,{neg:true}),pista:"Mira el punto donde x = 0.",ex:["Cuando x = 0, y = b.","La recta pasa por (0, "+nt(b)+"): b = "+nt(b)+"."]};}});
concepto({id:"sistemas",e:7,nom:"Sistemas de ecuaciones",obj:"Aprenderé a resolver dos ecuaciones con dos incógnitas.",mat:"Dos balanzas y el plano",
  pres:"Dos ecuaciones son dos pistas. La solución es el punto donde se cruzan las dos rectas.",
  casa:"Adivinanza: dos números suman 10 y su diferencia es 2. ¿Cuáles son?",dibujo:"🌙",
  gen:function(r,n){var x=ri(r,-3,7), y=ri(r,-3,7), a=n===3?ri(r,2,3):1;
    var e1=(a===1?"":a)+"x + y = "+nt(a*x+y), e2="x − y = "+nt(x-y), pide=n===1?"x":pick(r,["x","y"]);
    var qs="Resuelve el sistema: "+e1+" y "+e2+". ¿Cuánto vale "+pide+"?";
    return {q:qs,qa:qs,v:{t:"plano",lineas:[[-a,a*x+y],[1,-(x-y)]],punto:[x,y]},r:num(pide==="x"?x:y,{neg:true}),pista:"Suma las dos ecuaciones: la y se cancela.",
      ex:["Sumando: "+(a+1)+"x = "+nt(a*x+y+x-y)+" → x = "+nt(x)+".","Reemplazando: y = "+nt(x)+" − ("+nt(x-y)+") = "+nt(y)+"."]};}});
var TRIPLES=[[3,4,5],[6,8,10],[5,12,13],[8,15,17],[9,12,15],[7,24,25],[12,16,20],[20,21,29]];
concepto({id:"pitagoras",e:7,nom:"Teorema de Pitágoras",obj:"Aprenderé a calcular un lado de un triángulo rectángulo.",mat:"Demostración con cuadrados de perlas",
  pres:"En un triángulo rectángulo, el cuadrado del lado largo (hipotenusa) es igual a la suma de los cuadrados de los otros dos: a² + b² = c².",
  casa:"Con una cuerda con nudos cada metro formen un triángulo 3-4-5: ¡queda una esquina recta!",dibujo:"☄️",
  gen:function(r,n){var t=pick(r,TRIPLES.slice(0,n===1?3:8)), a=t[0], b=t[1], c=t[2];
    if(n===1||r()<0.5)return {q:"Los catetos miden "+a+" y "+b+". ¿Cuánto mide la hipotenusa?",v:{t:"triangulo",a:a,b:b,c:"?"},r:num(c),pista:"c² = a² + b².",ex:[a+"² + "+b+"² = "+(a*a)+" + "+(b*b)+" = "+(c*c)+".","c = √"+(c*c)+" = "+c+"."]};
    return {q:"La hipotenusa mide "+c+" y un cateto "+a+". ¿Cuánto mide el otro cateto?",v:{t:"triangulo",a:a,b:"?",c:c},r:num(b),pista:"b² = c² − a².",ex:[c+"² − "+a+"² = "+(c*c)+" − "+(a*a)+" = "+(b*b)+".","b = √"+(b*b)+" = "+b+"."]};}});
function bin(a){return a>0?" + "+a:" − "+(-a);}
concepto({id:"factorizar",e:7,nom:"Factorización",obj:"Aprenderé a escribir un polinomio como producto de factores.",mat:"Fichas de álgebra en rectángulo",
  pres:"Factorizar es armar un rectángulo con las fichas x², x y 1: sus lados son los factores.",
  casa:"Armen rectángulos con 12 fichas: 3 × 4, 2 × 6… cada forma es una factorización de 12.",dibujo:"🚀",
  gen:function(r,n){var a=ri(r,1,6), b=ri(r,n===1?1:-6,6); if(b===0)b=2; if(n===3&&r()<0.5){var k=ri(r,2,9); return {q:"Factoriza x² − "+(k*k)+".",v:{t:"fichas",x2:1,x:0,u:-k*k},r:ops(r,"(x + "+k+")(x − "+k+")",["(x − "+k+")²","(x + "+k+")²"]),pista:"Es una diferencia de cuadrados: a² − b² = (a + b)(a − b).",ex:["x² − "+(k*k)+" = x² − "+k+"².","= (x + "+k+")(x − "+k+")."]};}
    var s=a+b, p=a*b, ok="(x"+bin(a)+")(x"+bin(b)+")";
    var dis=["(x"+bin(-a)+")(x"+bin(-b)+")","(x"+bin(s)+")(x"+bin(1)+")","(x"+bin(a)+")(x"+bin(-b)+")"].filter(function(x,i,arr){return x!==ok&&arr.indexOf(x)===i;});
    return {q:"Factoriza x²"+(s?bin(s)+"x":"")+bin(p)+".",v:{t:"fichas",x2:1,x:s,u:p},r:ops(r,ok,dis.slice(0,2)),pista:"Busca dos números que multiplicados den "+nt(p)+" y sumados den "+nt(s)+".",
      ex:["Dos números con producto "+nt(p)+" y suma "+nt(s)+": "+nt(a)+" y "+nt(b)+".","x²"+(s?bin(s)+"x":"")+bin(p)+" = "+ok+"."]};}});
concepto({id:"probabilidad",e:7,nom:"Probabilidad",obj:"Aprenderé a calcular qué tan posible es un suceso.",mat:"Bolsas con bolitas y dados",
  pres:"Probabilidad = casos favorables ÷ casos posibles. Si hay 3 rojas de 10 bolitas, la probabilidad de roja es 3/10.",
  casa:"Pongan bolitas de colores en una bolsa, saquen 20 veces y anoten: ¿se parece a lo calculado?",dibujo:"🛸",
  gen:function(r,n){
    if(n===1){var ro=ri(r,1,6), az=ri(r,1,6), ve=ri(r,0,4), t=ro+az+ve, f=fr(ro,t);
      return {q:"En la bolsa hay "+ro+" rojas, "+az+" azules"+(ve?" y "+ve+" verdes":"")+". ¿Qué probabilidad hay de sacar una roja? (escribe una fracción)",v:{t:"bolsa",r:ro,a:az,v:ve},r:num(f.n/f.d,{frac:true,txt:frTxt(f)}),pista:"Favorables: las rojas. Posibles: todas.",ex:["Favorables "+ro+"; posibles "+t+".","P = "+ro+"/"+t+(f.d!==t?" = "+frTxt(f):"")+"."]};}
    if(n===2){var ev=pick(r,[["un número par",3],["un número mayor que 4",2],["un 6",1],["un número menor que 3",2]]), f2=fr(ev[1],6);
      return {q:"Al tirar un dado, ¿qué probabilidad hay de sacar "+ev[0]+"? (fracción)",v:{t:"dados",n:1},r:num(f2.n/f2.d,{frac:true,txt:frTxt(f2)}),pista:"Un dado tiene 6 caras.",ex:["Hay "+ev[1]+" caras favorables de 6.","P = "+ev[1]+"/6 = "+frTxt(f2)+"."]};}
    var s=ri(r,4,10), casos=0; for(var i=1;i<=6;i++)for(var j=1;j<=6;j++)if(i+j===s)casos++; var f3=fr(casos,36);
    return {q:"Al tirar dos dados, ¿qué probabilidad hay de que sumen "+s+"? (fracción)",v:{t:"dados",n:2},r:num(f3.n/f3.d,{frac:true,txt:frTxt(f3)}),pista:"Hay 36 combinaciones posibles; cuenta las que suman "+s+".",ex:["Hay "+casos+" combinaciones que suman "+s+" de 36.","P = "+casos+"/36 = "+frTxt(f3)+"."]};}});

/* === 5.º y 6.º de secundaria === */
concepto({id:"cuadratica",e:8,nom:"Ecuación de segundo grado",obj:"Aprenderé a encontrar las raíces de una ecuación cuadrática.",mat:"Fichas de álgebra y la parábola",
  pres:"Las raíces son donde la parábola corta al eje x. Si factorizas, cada factor igual a cero da una raíz.",
  casa:"Lancen una pelota y dibujen su recorrido: es una parábola. ¿Dónde toca el suelo?",dibujo:"🔭",
  gen:function(r,n){
    if(n===1){var k=ri(r,2,12); return {q:"Resuelve x² = "+(k*k)+". ¿Cuál es la raíz positiva?",qa:"Resuelve x² = "+(k*k)+". ¿Cuál es la raíz positiva?",v:{t:"parabola",r1:-k,r2:k},r:num(k),pista:"¿Qué número al cuadrado da "+(k*k)+"?",ex:["x = ±√"+(k*k)+".","La raíz positiva es "+k+"."]};}
    var a=ri(r,-6,6), b=ri(r,-6,6); while(a===b)b=ri(r,-6,6); var s=-(a+b), p=a*b, mayor=Math.max(a,b);
    var qc="Resuelve x²"+(s?bin(s)+"x":"")+(p?bin(p):"")+" = 0. ¿Cuál es la raíz mayor?";
    return {q:qc,qa:qc,v:{t:"parabola",r1:a,r2:b},r:num(mayor,{neg:true}),pista:"Factoriza: busca dos números con producto "+nt(p)+" y suma "+nt(s)+".",
      ex:["x²"+(s?bin(s)+"x":"")+(p?bin(p):"")+" = (x"+bin(-a)+")(x"+bin(-b)+").","Las raíces son "+nt(a)+" y "+nt(b)+": la mayor es "+nt(mayor)+"."]};}});
concepto({id:"trigonometria",e:8,nom:"Razones trigonométricas",obj:"Aprenderé seno, coseno y tangente en un triángulo rectángulo.",mat:"Triángulos y círculo unitario",
  pres:"Para el ángulo A: seno = opuesto ÷ hipotenusa, coseno = adyacente ÷ hipotenusa y tangente = opuesto ÷ adyacente.",
  casa:"Midan la sombra de un palo y la del poste a la misma hora: la tangente del ángulo del sol es la misma.",dibujo:"🌠",
  gen:function(r,n){var t=pick(r,TRIPLES.slice(0,6)), op=t[0], ad=t[1], h=t[2], raz=pick(r,n===1?["seno"]:n===2?["seno","coseno"]:["seno","coseno","tangente"]);
    var f=raz==="seno"?fr(op,h):raz==="coseno"?fr(ad,h):fr(op,ad);
    return {q:"En el triángulo, ¿cuánto vale el "+raz+" del ángulo A? (fracción)",v:{t:"triangulo",a:op,b:ad,c:h,angulo:true},r:num(f.n/f.d,{frac:true,txt:frTxt(f)}),
      pista:raz==="seno"?"Opuesto ÷ hipotenusa.":raz==="coseno"?"Adyacente ÷ hipotenusa.":"Opuesto ÷ adyacente.",
      ex:["Opuesto "+op+", adyacente "+ad+", hipotenusa "+h+".",raz+" A = "+(raz==="seno"?op+"/"+h:raz==="coseno"?ad+"/"+h:op+"/"+ad)+" = "+frTxt(f)+"."]};}});
concepto({id:"logaritmos",e:8,nom:"Exponenciales y logaritmos",obj:"Aprenderé qué es un logaritmo y cómo crece algo que se duplica.",mat:"Cadenas de potencias",
  pres:"El logaritmo responde: ¿a qué exponente hay que elevar la base? log₂ 8 = 3 porque 2³ = 8.",
  casa:"Doblen una hoja por la mitad varias veces: 2, 4, 8, 16 capas… ¿cuántos dobleces para 32?",dibujo:"🌌",
  gen:function(r,n){var b=n===1?2:pick(r,[2,3,5,10]), k=ri(r,2,n===1?6:4);
    if(n<3)return {q:"¿Cuánto vale log"+({2:"₂",3:"₃",5:"₅",10:""})[b]+" "+Math.pow(b,k)+(b===10?" (base 10)":"")+"?",v:{t:"potencias",b:b,k:k},r:num(k),pista:"¿Cuántas veces multiplicas "+b+" por sí mismo para llegar a "+Math.pow(b,k)+"?",
      ex:[Array(k+1).join(b+" × ").slice(0,-3)+" = "+Math.pow(b,k)+".","Son "+k+" veces: el logaritmo es "+k+"."]};
    var ini=ri(r,2,9)*10, anos=ri(r,2,5);
    return {q:"Una colonia de "+ini+" bacterias se duplica cada hora. ¿Cuántas habrá en "+anos+" horas?",v:{t:"potencias",b:2,k:anos},r:num(ini*Math.pow(2,anos)),pista:"Multiplica por 2 una vez por cada hora.",ex:[ini+" × 2^"+anos+" = "+ini+" × "+Math.pow(2,anos)+".","= "+(ini*Math.pow(2,anos))+"."]};}});
concepto({id:"estadistica",e:8,nom:"Media, mediana y moda",obj:"Aprenderé a resumir datos con la media, la mediana y la moda.",mat:"Gráficos de barras",
  pres:"La media reparte todo por igual; la mediana es el valor del medio al ordenar; la moda es el que más se repite.",
  casa:"Anoten la temperatura de una semana y calculen la media y la mediana.",dibujo:"✨",
  gen:function(r,n){var k=pick(r,[5,7]), d=[]; for(var i=0;i<k;i++)d.push(ri(r,1,10));
    if(n===1){var s=d.reduce(function(a,b){return a+b;},0), resto=s%k; d[k-1]+= resto?k-resto:0; if(d[k-1]>12){d[k-1]-=k;} s=d.reduce(function(a,b){return a+b;},0);
      return {q:"¿Cuál es la media de los datos?",v:{t:"barras",d:d},r:num(s/k,{dec:true}),pista:"Suma todos y divide entre cuántos hay ("+k+").",ex:["Suma: "+d.join(" + ")+" = "+s+".",s+" ÷ "+k+" = "+nt(s/k)+"."]};}
    var o=d.slice().sort(function(a,b){return a-b;});
    if(n===2)return {q:"¿Cuál es la mediana de los datos?",v:{t:"barras",d:d},r:num(o[(k-1)/2]),pista:"Ordénalos y toma el del medio.",ex:["Ordenados: "+o.join(", ")+".","El del medio es "+o[(k-1)/2]+"."]};
    d[ri(r,0,k-1)]=d[0]; d[ri(r,1,k-1)]=d[0]; var cuenta={}, moda=d[0], max=0; d.forEach(function(x){cuenta[x]=(cuenta[x]||0)+1; if(cuenta[x]>max||(cuenta[x]===max&&x<moda)){max=cuenta[x];moda=x;}});
    var empates=Object.keys(cuenta).filter(function(x){return cuenta[x]===max;}); if(empates.length>1){d.push(moda); max++;}
    return {q:"¿Cuál es la moda de los datos?",v:{t:"barras",d:d},r:num(moda),pista:"El valor que más se repite.",ex:["El "+moda+" aparece "+max+" veces.","La moda es "+moda+"."]};}});
concepto({id:"sucesiones",e:8,nom:"Sucesiones",obj:"Aprenderé a encontrar la regla de una sucesión.",mat:"Cadenas de perlas para contar saltos",
  pres:"En una sucesión aritmética se suma siempre lo mismo (la diferencia); en una geométrica se multiplica siempre por lo mismo (la razón).",
  casa:"Ahorren 2 Bs más cada semana que la anterior: ¿cuánto ahorran la semana 10?",dibujo:"💫",
  gen:function(r,n){var a=ri(r,-5,10), d=ri(r,-4,7)||3;
    if(n===1){var t=[a,a+d,a+2*d,a+3*d]; return {q:"¿Qué número sigue?",qa:t.map(nt).join(", ")+", ?",v:{t:"sucesion",t2:t},r:num(a+4*d,{neg:true}),pista:"¿Cuánto se suma cada vez?",ex:["Cada vez se suma "+nt(d)+".",nt(a+3*d)+" + ("+nt(d)+") = "+nt(a+4*d)+"."]};}
    if(n===2){var m=ri(r,8,20), t2=[a,a+d,a+2*d,a+3*d]; return {q:"En la sucesión "+t2.map(nt).join(", ")+"… ¿cuál es el término número "+m+"?",v:{t:"sucesion",t2:t2},r:num(a+(m-1)*d,{neg:true}),pista:"aₙ = a₁ + (n − 1) · d.",ex:["a₁ = "+nt(a)+", d = "+nt(d)+".","a"+m+" = "+nt(a)+" + "+(m-1)+" · "+nt(d)+" = "+nt(a+(m-1)*d)+"."]};}
    var g=ri(r,2,3), b=ri(r,1,5), t3=[b,b*g,b*g*g,b*g*g*g]; return {q:"¿Qué número sigue?",qa:t3.join(", ")+", ?",v:{t:"sucesion",t2:t3},r:num(b*Math.pow(g,4)),pista:"¿Por cuánto se multiplica cada vez?",ex:["Cada término se multiplica por "+g+".",(b*g*g*g)+" × "+g+" = "+(b*Math.pow(g,4))+"."]};}});

var POR_ID={}; C.forEach(function(c,i){c.orden=i; POR_ID[c.id]=c;});
function deEtapa(e){return C.filter(function(c){return c.e===e;});}

/* ---------- un ejercicio ---------- */
/* fase 0, 1, 2 (concreto, pictórico, abstracto); nivel 1..nmax; seed para repetirlo igual */
function ejercicio(id,nivel,fase,seed){
  var c=POR_ID[id]; if(!c)return null;
  var r=rng(seed>>>0), n=Math.max(1,Math.min(c.nmax,nivel|0||1)), it=c.gen(r,n,fase|0);
  it.c=id; it.n=n; it.f=fase|0; it.seed=seed>>>0;
  /* en lo abstracto el dibujo se esconde si el enunciado se entiende sin él */
  it.ocultaVisual=it.f===2&&c.abs&&!!it.qa;
  if(it.ocultaVisual)it.q=it.qa;
  if(it.f===0&&it.r.t==="num"&&!it.pistaVisible)it.pistaVisible=true;
  return it;
}
/* la versión «muéstrame» (segundo tiempo): elegir entre tres */
function comoOpciones(it,seed){
  if(it.r.t==="op")return it;
  var r=rng((seed||it.seed)^0x9e37), ok=it.r.ok, txt, dis;
  if(it.r.t==="num"&&it.r.frac){ txt=it.r.txt; var p=txt.split("/"), a=+p[0], b=+(p[1]||1); dis=[(a+1)+"/"+b,a+"/"+(b+1),b>1?b+"/"+a:(a+2)+""].filter(function(x){return x!==txt;}).slice(0,2); }
  else { var paso=Math.abs(ok)<1&&ok!==0?0.01:Math.abs(ok)>=100?Math.max(1,Math.round(Math.abs(ok)/20)):1; txt=nt(ok); dis=cerca(r,ok,2,it.r.neg?-1e6:0,1e7,paso).map(nt); }
  var o=JSON.parse(JSON.stringify(it)); o.r=ops(r,txt,dis); if(it.r.u)o.r.u=it.r.u; return o;
}

/* ---------- corregir ---------- */
function leeNumero(s){
  s=String(s==null?"":s).replace(/\s+/g,"").replace("−","-").replace(",",".");
  if(!s)return NaN;
  if(/^-?\d+\/\d+$/.test(s)){var p=s.split("/"); return +p[1]?(+p[0])/(+p[1]):NaN;}
  if(/^-?\d+(\.\d+)?$/.test(s)||/^-?\.\d+$/.test(s))return parseFloat(s);
  return NaN;
}
function corrige(it,resp){
  var r=it.r;
  if(r.t==="op")return resp===r.ok;
  if(r.t==="num"){var v=leeNumero(resp); return !isNaN(v)&&Math.abs(v-r.ok)<1e-6;}
  return +resp===r.ok;    /* bandeja, perlas, pastel: lo armado */
}
function respuestaTxt(it){var r=it.r; if(r.t==="op"){var o=r.ops[r.ok]; return typeof o==="string"?o:"la opción "+(r.ok+1);} if(r.t==="num")return (r.txt||nt(r.ok))+(r.u?(r.u==="°"?"":" ")+r.u:""); if(r.t==="pastel")return r.ok+"/"+r.den; return nt(r.ok);}

/* ---------- el progreso de un concepto y cómo se adapta ---------- */
function nuevo(){return {f:0,n:1,h:[],a:0,i:0,racha:0,en:0,dom:false,ref:0,at:0};}
/* registra una respuesta (ok, con o sin ayuda) y dice qué pasó: sube de fase o de nivel, domina, o necesita refuerzo */
function registra(p,c,ok,ayuda){
  var ev={}; c=typeof c==="string"?POR_ID[c]:c;
  p.i++; if(ok)p.a++; p.h.push(ok&&!ayuda?1:0); if(p.h.length>10)p.h.shift(); p.at=Date.now?Date.now():0;
  p.racha=ok&&!ayuda?p.racha+1:0; p.en=(p.en||0)+1;
  var ult=p.h.slice(-5), err=ult.filter(function(x){return !x;}).length;
  if(!ok&&ult.length>=3&&err>=3){            /* muchos errores juntos: volver a lo concreto */
    p.f=Math.max(0,p.f-1); p.n=Math.max(1,p.n-1); p.ref++; p.h=[]; p.racha=0; p.en=0; ev.refuerzo=true; return ev; }
  if(p.racha>=3){
    if(p.f<2){p.f++; p.racha=0; p.en=0; ev.fase=p.f;}
    else if(p.n<c.nmax){p.n++; p.racha=0; p.en=0; ev.nivel=p.n;}
  }
  /* dominar: ya en lo abstracto y en el nivel más alto, con al menos 3 ejercicios ahí y casi todo bien */
  var ocho=p.h.slice(-8), bien=ocho.filter(Boolean).length;
  if(!p.dom&&p.f===2&&p.n===c.nmax&&p.en>=3&&ocho.length>=(c.e===0?5:8)&&bien>=(c.e===0?5:7)){p.dom=true; ev.domina=true;}
  return ev;
}
/* cuánto avanzó, de 0 a 1 (para los dibujos que crecen) */
function avance(p,c){ if(!p)return 0; c=typeof c==="string"?POR_ID[c]:c; if(p.dom)return 1;
  var pasos=2+(c.nmax-1), hechos=p.f+(p.f===2?p.n-1:0); return Math.min(0.95,0.08+0.85*hechos/pasos); }
/* el concepto que conviene trabajar ahora en una etapa: el primero sin dominar (o el que necesita refuerzo) */
function sugerido(prog,e){
  var lista=deEtapa(e); prog=prog||{};
  for(var i=0;i<lista.length;i++){var p=prog[lista[i].id]; if(!p||!p.dom)return lista[i].id;}
  return null;
}
function etapaCompleta(prog,e){return deEtapa(e).every(function(c){return prog&&prog[c.id]&&prog[c.id].dom;});}
/* para adultos: lo que necesita refuerzo (varios refuerzos o pocos aciertos) */
function necesitaRefuerzo(p){return !!p&&!p.dom&&(p.ref>=2||(p.i>=8&&p.a/p.i<0.6));}

var AFIRMACIONES=["Soy capaz de aprender cosas difíciles.","Equivocarme me ayuda a aprender.","Voy a mi ritmo, y está bien.","Cada intento hace crecer mi cerebro.","Pregunto cuando no entiendo: eso es ser valiente.","Hoy sé más que ayer."];
var ANIMOS_BIEN=["¡Muy bien!","¡Lo lograste!","¡Exacto!","¡Así se hace!","¡Excelente trabajo!","¡Bien pensado!"];
var ANIMOS_MAL=["Casi. Mira el material otra vez.","Buen intento: probemos de nuevo.","Los errores nos ayudan a aprender. ¿Lo revisas?","Vamos paso a paso, tú puedes."];

G.AxMate={ETAPAS:ETAPAS,CONCEPTOS:C,POR_ID:POR_ID,OBJ:OBJ,PALABRA:PALABRA,deEtapa:deEtapa,ejercicio:ejercicio,comoOpciones:comoOpciones,corrige:corrige,leeNumero:leeNumero,
  respuestaTxt:respuestaTxt,nuevo:nuevo,registra:registra,avance:avance,sugerido:sugerido,etapaCompleta:etapaCompleta,necesitaRefuerzo:necesitaRefuerzo,
  nt:nt,fr:fr,frTxt:frTxt,rng:rng,AFIRMACIONES:AFIRMACIONES,ANIMOS_BIEN:ANIMOS_BIEN,ANIMOS_MAL:ANIMOS_MAL};
})(typeof window!=="undefined"?window:globalThis);
