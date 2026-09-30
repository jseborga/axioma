/* ===========================================================
   THE FINAL TEST · Competencias sin fin (maratón) · motor
   Tres juegos que no terminan solos: se sigue hasta perder.
     · Memoria sin fin: la secuencia crece de uno en uno, sin tope.
     · Maratón de sudoku: sudokus cada vez más difíciles.
     · Maratón de Axioma: tableros de Axioma cada vez más grandes.
   Se pierde al quedarse sin vidas (cada fallo quita una) o, en los
   maratones, cuando se acaba el reloj; cada tablero resuelto suma
   tiempo extra. Gana quien llega más lejos.

   Lo usan por igual el navegador y el Worker. El servidor guarda las
   soluciones y comprueba cada paso: al navegador solo le llega lo
   que hace falta para jugar el paso siguiente.
   No toca window ni document: solo define globalThis.AxMaraton.
   =========================================================== */
(function(G){
"use strict";

function semilla(txt){var h=0x811c9dc5,i;txt=String(txt);
  for(i=0;i<txt.length;i++){h^=txt.charCodeAt(i);h=Math.imul(h,0x01000193);}return h>>>0;}
function rng(s){var a=s>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};}
function baraja(arr,r){for(var i=arr.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=arr[i];arr[i]=arr[j];arr[j]=t;}return arr;}

var JUEGOS={
  memoria_inf:{nom:"Memoria sin fin",icono:"🧠",orden:"puntos",
    desc:"La secuencia crece de una en una casilla, sin tope. Cada fallo cuesta una vida y repite la secuencia. Gana quien recuerda la más larga."},
  sudoku_mar:{nom:"Maratón de sudoku",icono:"🔢",orden:"puntos",
    desc:"Sudokus seguidos, cada vez más difíciles. Cada cifra equivocada cuesta una vida; cada tablero resuelto suma tiempo al reloj. Se acaba al quedarse sin vidas o sin tiempo."},
  axioma_mar:{nom:"Maratón de Axioma",icono:"◆",orden:"puntos",
    desc:"Tableros de Axioma seguidos, cada vez más grandes. Comprobar mal cuesta una vida; cada tablero resuelto suma tiempo al reloj. Se acaba al quedarse sin vidas o sin tiempo."}
};

/* reglas que elige la empresa: opciones y valores por omisión */
var REGLAS={
  memoria_inf:{vidas:[1,2,3],vidas0:2},
  sudoku_mar:{vidas:[1,2,3,5,10],vidas0:3,reloj:[10,15,20,30,45,60],reloj0:20,extra:[0,60,120,180,300],extra0:120},
  axioma_mar:{vidas:[1,2,3,5,10],vidas0:3,reloj:[3,5,10,15,20,30],reloj0:5,extra:[0,15,30,45,60,90],extra0:30}
};
/* reglas válidas a partir de lo que llega (lo que no encaja toma el valor por omisión) */
function reglas(juego,b){
  var R=REGLAS[juego]; if(!R)return null; b=b||{};
  var v=parseInt(b.vidas,10), o={vidas:R.vidas.indexOf(v)>=0?v:R.vidas0};
  if(R.reloj){var m=parseInt(b.reloj,10), x=parseInt(b.extra,10);
    o.reloj=R.reloj.indexOf(m)>=0?m:R.reloj0; o.extra=R.extra.indexOf(x)>=0?x:R.extra0;}
  return o;
}

/* ---------- memoria sin fin ---------- */
var MEM_INICIO=3, MEM_MAX=500, MEM_OCIO=180000;   /* se empieza con 3; a los 3 min sin jugar, se cierra */
function secuencia(seed,largo){
  var r=rng(seed), s=[], ult=-1, i, c;
  for(i=0;i<Math.min(largo,MEM_MAX);i++){do{c=Math.floor(r()*9);}while(c===ult);s.push(c);ult=c;}
  return s;
}
/* cuánto se enciende cada casilla: cada vez un poco más rápido, sin bajar de 350 ms */
function mostrar(largo){return Math.max(350,700-Math.max(0,largo-MEM_INICIO)*20);}
/* lo mínimo que tarda en verse una secuencia (el servidor no acepta respuestas antes) */
function minimoMemoria(largo){return Math.round(largo*mostrar(largo)*0.8);}

/* ---------- sudoku ---------- */
/* de cada nivel se generan «pool» tableros y a cada persona le tocan «usa», en su propio orden */
var PLAN_SUD=[{t:1,usa:3,pool:5},{t:2,usa:3,pool:5},{t:3,usa:4,pool:6},{t:4,usa:10,pool:12}];
var NIVEL_SUD={1:"Fácil",2:"Medio",3:"Difícil",4:"Experto"};
function puntosCifra(t){return t;}                 /* cada cifra bien puesta */
function puntosSudoku(t){return 25*t;}              /* tablero completo */
var SUD_MIN_JUGADA=300;                             /* entre dos cifras, al menos 0,3 s */
function sudokuOk(t){
  if(!t||!(t.t>=1&&t.t<=4))return false;
  var p=String(t.puzzle||""), s=String(t.solution||""), i, j, k;
  if(!/^[0-9]{81}$/.test(p)||!/^[1-9]{81}$/.test(s))return false;
  for(i=0;i<81;i++)if(p[i]!=="0"&&p[i]!==s[i])return false;
  for(i=0;i<9;i++){var f={},c={},b={};
    for(j=0;j<9;j++){
      var a=s[i*9+j], d=s[j*9+i], bi=(((i/3)|0)*3+((j/3)|0))*9+(i%3)*3+(j%3);
      k=s[bi]; if(f[a]||c[d]||b[k])return false; f[a]=c[d]=b[k]=1;
    }}
  return true;
}

/* ---------- Axioma ---------- */
var ALCANCES=["ORTO","REY","RAYO"], FORMAS=["CADENA","AISLADO","PAREJAS"];
var TIPOS_AX={
  1:{n:4,k:4,clues:5,scopes:["ORTO"],shapes:["CADENA"]},
  2:{n:4,k:5,clues:5,scopes:["ORTO","REY"],shapes:["CADENA","AISLADO"]},
  3:{n:5,k:6,clues:7,scopes:["ORTO","REY"],shapes:["CADENA","AISLADO"]},
  4:{n:5,k:7,clues:7,scopes:ALCANCES,shapes:FORMAS},
  5:{n:6,k:9,clues:9,scopes:ALCANCES,shapes:FORMAS},
  6:{n:6,k:10,clues:8,scopes:ALCANCES,shapes:FORMAS}
};
var PLAN_AX=[{t:1,usa:2,pool:4},{t:2,usa:3,pool:5},{t:3,usa:4,pool:6},{t:4,usa:5,pool:7},{t:5,usa:6,pool:8},{t:6,usa:20,pool:24}];
function puntosAxioma(t){return 10*t;}
var AX_MIN_TABLERO=4000;                            /* nadie resuelve un tablero en menos de 4 s */
function clave(r,c){return r+","+c;}
function axiomaOk(t){
  if(!t||!TIPOS_AX[t.t])return false;
  var T=TIPOS_AX[t.t], n=T.n, i, vistos={};
  if(t.n!==n||t.k!==T.k)return false;
  if(!Array.isArray(t.clues)||t.clues.length!==T.clues||!Array.isArray(t.sol)||t.sol.length!==T.k)return false;
  if(!t.nums||typeof t.nums!=="object")return false;
  if(JSON.stringify(t.scopes)!==JSON.stringify(T.scopes)||JSON.stringify(t.shapes)!==JSON.stringify(T.shapes))return false;
  if(T.scopes.indexOf(t.scope)<0||T.shapes.indexOf(t.shape)<0)return false;
  var ok=function(k){var m=/^(\d),(\d)$/.exec(String(k));return !!m&&+m[1]<n&&+m[2]<n;};
  for(i=0;i<t.clues.length;i++){var k=t.clues[i];
    if(!ok(k)||vistos[k])return false; vistos[k]=1;
    var v=t.nums[k]; if(!(v>=0&&v<=n*n&&v===Math.floor(v)))return false;}
  for(i=0;i<t.sol.length;i++){if(!ok(t.sol[i])||vistos[t.sol[i]])return false; vistos[t.sol[i]]=1;}
  return Object.keys(t.nums).length===T.clues;
}
/* lo que ve quien juega: sin la solución ni el par de reglas */
function axiomaPublico(t){return {t:t.t,n:t.n,k:t.k,clues:t.clues,nums:t.nums,scopes:t.scopes,shapes:t.shapes};}

/* ---------- tableros: cuántos, de qué tipo y en qué orden ---------- */
function plan(juego){return juego==="sudoku_mar"?PLAN_SUD:juego==="axioma_mar"?PLAN_AX:null;}
/* ¿el lote de tableros que manda la empresa es el que pide el plan? */
function loteOk(juego,lote){
  var P=plan(juego); if(!P||!Array.isArray(lote))return false;
  var total=0, cuenta={}, i;
  P.forEach(function(p){total+=p.pool;});
  if(lote.length!==total)return false;
  for(i=0;i<lote.length;i++){
    var t=lote[i]; if(!(juego==="sudoku_mar"?sudokuOk(t):axiomaOk(t)))return false;
    cuenta[t.t]=(cuenta[t.t]||0)+1;
  }
  return P.every(function(p){return cuenta[p.t]===p.pool;});
}
/* se guarda solo lo necesario de cada tablero */
function limpiaLote(juego,lote){
  return lote.map(function(t){
    if(juego==="sudoku_mar")return {t:t.t,puzzle:String(t.puzzle),solution:String(t.solution)};
    var nums={}; t.clues.forEach(function(k){nums[k]=t.nums[k];});
    return {t:t.t,n:t.n,k:t.k,clues:t.clues.slice(),nums:nums,scopes:t.scopes.slice(),shapes:t.shapes.slice(),scope:t.scope,shape:t.shape,sol:t.sol.slice()};
  });
}
/* el orden de los tableros de una persona: de cada tipo, «usa» al azar (con su semilla) */
function orden(juego,lote,seed){
  var P=plan(juego), r=rng(seed), out=[];
  P.forEach(function(p){
    var idx=[]; lote.forEach(function(t,i){if(t.t===p.t)idx.push(i);});
    out=out.concat(baraja(idx,r).slice(0,p.usa));
  });
  return out;
}

/* ---------- marcas ---------- */
function formato(juego,score){
  if(juego==="memoria_inf")return score+(score===1?" casilla":" casillas");
  return score+(score===1?" punto":" puntos");
}
function compara(juego,a,b){return (b.score-a.score)||(a.seconds-b.seconds);}
function es(juego){return !!JUEGOS[juego];}

G.AxMaraton={JUEGOS:JUEGOS,REGLAS:REGLAS,reglas:reglas,semilla:semilla,rng:rng,
  MEM_INICIO:MEM_INICIO,MEM_MAX:MEM_MAX,MEM_OCIO:MEM_OCIO,secuencia:secuencia,mostrar:mostrar,minimoMemoria:minimoMemoria,
  PLAN_SUD:PLAN_SUD,NIVEL_SUD:NIVEL_SUD,puntosCifra:puntosCifra,puntosSudoku:puntosSudoku,SUD_MIN_JUGADA:SUD_MIN_JUGADA,sudokuOk:sudokuOk,
  TIPOS_AX:TIPOS_AX,PLAN_AX:PLAN_AX,puntosAxioma:puntosAxioma,AX_MIN_TABLERO:AX_MIN_TABLERO,axiomaOk:axiomaOk,axiomaPublico:axiomaPublico,clave:clave,
  plan:plan,loteOk:loteOk,limpiaLote:limpiaLote,orden:orden,formato:formato,compara:compara,es:es};
})(typeof globalThis!=="undefined"?globalThis:this);
