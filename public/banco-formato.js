/* ===========================================================
   THE FINAL TEST · formato y validación de preguntas
   Lo usan el navegador (vista previa al importar) y el Worker
   (revalida todo lo que llega), así los dos aplican las mismas
   reglas. No toca window ni document.

   Entradas admitidas
   · Filas de Excel o de una tabla pegada:
       Pregunta | Correcta | Incorrecta 1 | Incorrecta 2 | Incorrecta 3 | Nivel | Tema
     (con o sin fila de títulos; con títulos, el orden de columnas da igual)
   · Texto con opciones y respuesta, compatible con el formato Aiken de Moodle:
       ¿Cuál es la derivada de x²?
       A) 2x
       B) x
       C) x²/2
       ANSWER: A
       NIVEL: 2
       TEMA: Derivadas
   =========================================================== */
(function(G){
"use strict";

var MAX_Q=300, MAX_OPC=150, MIN_OPC=2, MAX_OPCS=6;
var NIVELES={1:"Fácil",2:"Medio",3:"Difícil"};

function limpia(s){return String(s==null?"":s).replace(/\s+/g," ").trim();}
function clave(s){return limpia(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[¿?¡!.,;:"«»]/g,"");}

/* ---------- filas (Excel, CSV o tabla pegada) ---------- */
var TITULOS={
  q:/^(pregunta|enunciado|question)/i,
  correcta:/^(correcta|respuesta correcta|respuesta|correct|answer)/i,
  otra:/^(incorrecta|distractor|otra|opcion|opción|wrong)/i,
  nivel:/^(nivel|dificultad|level)/i,
  tema:/^(tema|materia|unidad|topic)/i
};
function desdeFilas(filas){
  filas=(filas||[]).map(function(f){return (f||[]).map(limpia);})
    .filter(function(f){return f.some(function(c){return c!=="";});});
  if(!filas.length)return [];
  var cab=filas[0], mapa=null, inicio=0;
  if(cab.some(function(c){return TITULOS.q.test(c);})){
    mapa={q:-1,correcta:-1,otras:[],nivel:-1,tema:-1};
    cab.forEach(function(c,i){
      if(mapa.q<0&&TITULOS.q.test(c))mapa.q=i;
      else if(TITULOS.otra.test(c))mapa.otras.push(i);
      else if(mapa.correcta<0&&TITULOS.correcta.test(c))mapa.correcta=i;
      else if(mapa.nivel<0&&TITULOS.nivel.test(c))mapa.nivel=i;
      else if(mapa.tema<0&&TITULOS.tema.test(c))mapa.tema=i;
    });
    inicio=1;
  }
  if(!mapa)mapa={q:0,correcta:1,otras:[2,3,4],nivel:5,tema:6};
  var out=[];
  for(var i=inicio;i<filas.length;i++){
    var f=filas[i];
    out.push({fila:i+1,q:f[mapa.q]||"",correcta:mapa.correcta>=0?(f[mapa.correcta]||""):"",
      otras:mapa.otras.map(function(k){return f[k]||"";}).filter(Boolean),
      nivel:mapa.nivel>=0?f[mapa.nivel]:"",tema:mapa.tema>=0?(f[mapa.tema]||""):""});
  }
  return out;
}

/* ---------- CSV sencillo (comillas dobles, separador , ; o tabulador) ---------- */
function csv(texto){
  var primera=texto.split(/\r?\n/)[0]||"";
  var sep=primera.indexOf("\t")>=0?"\t":(primera.split(";").length>primera.split(",").length?";":",");
  var filas=[],fila=[],campo="",dentro=false,i,ch;
  for(i=0;i<texto.length;i++){
    ch=texto[i];
    if(dentro){
      if(ch==='"'){ if(texto[i+1]==='"'){campo+='"';i++;} else dentro=false; }
      else campo+=ch;
    }else if(ch==='"'&&campo==="")dentro=true;
    else if(ch===sep){fila.push(campo);campo="";}
    else if(ch==="\n"){fila.push(campo);filas.push(fila);fila=[];campo="";}
    else if(ch!=="\r")campo+=ch;
  }
  if(campo!==""||fila.length){fila.push(campo);filas.push(fila);}
  return filas;
}

/* ---------- texto con opciones A) B) … y ANSWER / RESPUESTA ---------- */
var R_OPC=/^([A-Ha-h])\s*[\).:-]\s+(.*)$/, R_RESP=/^(ANSWER|RESPUESTA|CORRECTA)\s*:\s*([A-Ha-h])\s*$/i,
    R_NIVEL=/^(NIVEL|DIFICULTAD)\s*:\s*(.*)$/i, R_TEMA=/^(TEMA|MATERIA)\s*:\s*(.*)$/i;
function esAiken(texto){
  var l=texto.split(/\r?\n/);
  return l.some(function(x){return R_RESP.test(limpia(x));})&&l.some(function(x){return R_OPC.test(limpia(x));});
}
function desdeAiken(texto){
  var lineas=texto.split(/\r?\n/), out=[], cur=null, ultimo=null, n=0;
  function nueva(){cur={fila:0,qs:[],opcs:[],letra:"",nivel:"",tema:""};}
  function cierra(incompleta){
    if(!cur||(!cur.qs.length&&!cur.opcs.length))return;
    var idx=cur.letra?cur.letra.toUpperCase().charCodeAt(0)-65:-1;
    var it={fila:cur.fila,q:limpia(cur.qs.join(" ")),correcta:idx>=0&&idx<cur.opcs.length?cur.opcs[idx]:"",
      otras:cur.opcs.filter(function(_,k){return k!==idx;}),nivel:cur.nivel,tema:cur.tema};
    if(incompleta||idx<0)it.sinRespuesta=true;
    else if(idx>=cur.opcs.length)it.letraFuera=cur.letra.toUpperCase();
    out.push(it); ultimo=it; cur=null;
  }
  lineas.forEach(function(bruta,i){
    var l=limpia(bruta), m;
    if(!l){ if(cur&&cur.letra)cierra(false); return; }
    if((m=l.match(R_NIVEL))){ if(cur)cur.nivel=m[2]; else if(ultimo)ultimo.nivel=m[2]; return; }
    if((m=l.match(R_TEMA))){ if(cur)cur.tema=m[2]; else if(ultimo)ultimo.tema=m[2]; return; }
    if((m=l.match(R_RESP))){ if(cur){cur.letra=m[2];cierra(false);} return; }
    if((m=l.match(R_OPC))&&cur&&cur.qs.length){ cur.opcs.push(limpia(m[2])); return; }
    /* texto normal: empieza una pregunta nueva (o continúa el enunciado) */
    if(cur&&cur.opcs.length){ cierra(true); }
    if(!cur){nueva();cur.fila=i+1;}
    cur.qs.push(l);
  });
  if(cur)cierra(!cur.letra);
  return out;
}

/* texto pegado: detecta si es formato de opciones o una tabla */
function desdeTexto(texto){
  texto=String(texto||"").replace(/\uFEFF/g,"");
  if(!texto.trim())return [];
  if(esAiken(texto))return desdeAiken(texto);
  return desdeFilas(csv(texto));
}

/* ---------- validación ---------- */
function nivelDe(v){
  var s=clave(v);
  if(s===""||s==null)return {n:2,aviso:null};
  if(/^1$|^facil/.test(s))return {n:1};
  if(/^2$|^medi/.test(s))return {n:2};
  if(/^3$|^dificil/.test(s))return {n:3};
  return {n:2,aviso:"Nivel «"+limpia(v)+"» no reconocido: se usará Medio."};
}
/* existentes: conjunto de claves de preguntas que ya están en el banco */
function valida(items,existentes){
  var vistas={}, ya=existentes||{};
  return items.map(function(it){
    var errores=[], avisos=[], q=limpia(it.q), c=limpia(it.correcta);
    var otras=(it.otras||[]).map(limpia).filter(Boolean), nv=nivelDe(it.nivel);
    if(!q)errores.push("Falta el enunciado.");
    else if(q.length>MAX_Q)errores.push("El enunciado pasa de "+MAX_Q+" caracteres.");
    if(it.sinRespuesta)errores.push("Falta la línea ANSWER: con la letra correcta.");
    else if(it.letraFuera)errores.push("La respuesta «"+it.letraFuera+"» no corresponde a ninguna opción.");
    else if(!c)errores.push("Falta la respuesta correcta.");
    if(otras.length+1<MIN_OPC&&!it.sinRespuesta)errores.push("Hace falta al menos una opción incorrecta.");
    if(otras.length+1>MAX_OPCS)errores.push("Como máximo "+MAX_OPCS+" opciones.");
    var todas=[c].concat(otras).filter(Boolean), cl=todas.map(clave);
    if(todas.some(function(o){return o.length>MAX_OPC;}))errores.push("Alguna opción pasa de "+MAX_OPC+" caracteres.");
    if(new Set(cl).size!==cl.length)errores.push("Hay opciones repetidas.");
    if(cl.some(function(o){return /(todas|ninguna) (las|de las) anteriores|todas las opciones/.test(o);}))
      avisos.push("«Todas/ninguna de las anteriores» no funciona bien: las opciones se barajan.");
    if(nv.aviso)avisos.push(nv.aviso);
    var k=clave(q);
    if(q&&ya[k])errores.push("Ya está en el banco.");
    else if(q&&vistas[k])errores.push("Repetida en este archivo (fila "+vistas[k]+").");
    if(q)vistas[k]=it.fila||true;
    return {fila:it.fila,q:q,opts:todas,answer:0,level:nv.n,topic:limpia(it.tema).slice(0,60),
            errores:errores,avisos:avisos,ok:!errores.length};
  });
}

/* plantilla de ejemplo para descargar */
var PLANTILLA=[
  ["Pregunta","Correcta","Incorrecta 1","Incorrecta 2","Incorrecta 3","Nivel","Tema"],
  ["¿Cuál es la derivada de x²?","2x","x","x²/2","2","2","Derivadas"],
  ["¿Cuánto vale el límite de 1/x cuando x tiende a infinito?","0","1","Infinito","No existe","2","Límites"],
  ["¿Qué integral es el área bajo la curva?","La definida","La indefinida","La impropia","","1","Integrales"]
];
var EJEMPLO_TEXTO=
"¿Cuál es la derivada de x²?\nA) 2x\nB) x\nC) x²/2\nD) 2\nANSWER: A\nNIVEL: 2\nTEMA: Derivadas\n\n"+
"¿Qué integral representa el área bajo la curva?\nA) La indefinida\nB) La definida\nC) La impropia\nANSWER: B\nNIVEL: 1\nTEMA: Integrales";

G.AxBanco={NIVELES:NIVELES,MAX_Q:MAX_Q,MAX_OPC:MAX_OPC,MAX_OPCS:MAX_OPCS,clave:clave,limpia:limpia,
  desdeFilas:desdeFilas,desdeTexto:desdeTexto,desdeAiken:desdeAiken,csv:csv,valida:valida,
  PLANTILLA:PLANTILLA,EJEMPLO_TEXTO:EJEMPLO_TEXTO};
})(typeof globalThis!=="undefined"?globalThis:this);
