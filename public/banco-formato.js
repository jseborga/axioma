/* ===========================================================
   THE FINAL TEST · formato y validación de preguntas
   Lo usan el navegador (vista previa al importar) y el Worker
   (revalida todo lo que llega), así los dos aplican las mismas
   reglas. No toca window ni document.

   Entradas admitidas
   · Filas de Excel o de una tabla pegada:
       Pregunta | Correcta | Incorrecta 1 | Incorrecta 2 | Incorrecta 3 | Nivel | Tema
     (con o sin fila de títulos; con títulos, el orden de columnas da igual)
     Columnas opcionales (con fila de títulos): Tipo (opción, vf, numérica,
     abierta), Tolerancia (para las numéricas) y Desarrollo (la resolución).
     · vf: la correcta es «Verdadero» o «Falso».
     · numérica: la correcta es un número; se acepta con la tolerancia.
     · abierta: texto libre que corrige el docente; la «correcta» es la
       respuesta modelo (opcional).
   · Texto con opciones y respuesta, compatible con el formato Aiken de Moodle
     (con una línea DESARROLLO: opcional tras la respuesta):
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

var MAX_Q=300, MAX_OPC=150, MIN_OPC=2, MAX_OPCS=6, MAX_DES=2000, MAX_MODELO=600;
var TIPOS={opcion:"Opción múltiple",vf:"Verdadero o falso",numerica:"Respuesta numérica",abierta:"Texto libre (lo corrige el docente)"};
var NIVELES={1:"Fácil",2:"Medio",3:"Difícil"};

function limpia(s){return String(s==null?"":s).replace(/\s+/g," ").trim();}
function clave(s){return limpia(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[¿?¡!.,;:"«»]/g,"");}

/* ---------- filas (Excel, CSV o tabla pegada) ---------- */
var TITULOS={
  q:/^(pregunta|enunciado|question)/i,
  correcta:/^(correcta|respuesta correcta|respuesta|correct|answer)/i,
  otra:/^(incorrecta|distractor|otra|opcion|opción|wrong)/i,
  nivel:/^(nivel|dificultad|level)/i,
  tema:/^(tema|materia|unidad|topic)/i,
  tipo:/^(tipo|type)/i,
  tol:/^(tolerancia|margen|tolerance)/i,
  des:/^(desarrollo|soluci|resoluci|explicaci)/i
};
function desdeFilas(filas){
  filas=(filas||[]).map(function(f){return (f||[]).map(limpia);})
    .filter(function(f){return f.some(function(c){return c!=="";});});
  if(!filas.length)return [];
  var cab=filas[0], mapa=null, inicio=0;
  if(cab.some(function(c){return TITULOS.q.test(c);})){
    mapa={q:-1,correcta:-1,otras:[],nivel:-1,tema:-1,tipo:-1,tol:-1,des:-1};
    cab.forEach(function(c,i){
      if(mapa.q<0&&TITULOS.q.test(c))mapa.q=i;
      else if(mapa.tipo<0&&TITULOS.tipo.test(c))mapa.tipo=i;
      else if(mapa.tol<0&&TITULOS.tol.test(c))mapa.tol=i;
      else if(mapa.des<0&&TITULOS.des.test(c))mapa.des=i;
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
      nivel:mapa.nivel>=0?f[mapa.nivel]:"",tema:mapa.tema>=0?(f[mapa.tema]||""):"",
      tipo:mapa.tipo>=0?(f[mapa.tipo]||""):"",tol:mapa.tol>=0?(f[mapa.tol]||""):"",desarrollo:mapa.des>=0?(f[mapa.des]||""):""});
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
    R_NIVEL=/^(NIVEL|DIFICULTAD)\s*:\s*(.*)$/i, R_TEMA=/^(TEMA|MATERIA)\s*:\s*(.*)$/i, R_DES=/^(DESARROLLO|SOLUCI[OÓ]N|RESOLUCI[OÓ]N)\s*:\s*(.*)$/i;
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
      otras:cur.opcs.filter(function(_,k){return k!==idx;}),nivel:cur.nivel,tema:cur.tema,desarrollo:cur.desarrollo||""};
    if(incompleta||idx<0)it.sinRespuesta=true;
    else if(idx>=cur.opcs.length)it.letraFuera=cur.letra.toUpperCase();
    out.push(it); ultimo=it; cur=null;
  }
  lineas.forEach(function(bruta,i){
    var l=limpia(bruta), m;
    if(!l){ if(cur&&cur.letra)cierra(false); return; }
    if((m=l.match(R_NIVEL))){ if(cur)cur.nivel=m[2]; else if(ultimo)ultimo.nivel=m[2]; return; }
    if((m=l.match(R_TEMA))){ if(cur)cur.tema=m[2]; else if(ultimo)ultimo.tema=m[2]; return; }
    if((m=l.match(R_DES))){ if(cur)cur.desarrollo=m[2]; else if(ultimo)ultimo.desarrollo=m[2]; return; }
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
function tipoDe(v){
  var s=clave(v);
  if(!s||/^(opcion|opciones|multiple|seleccion|test)/.test(s))return "opcion";
  if(/^(vf|v\/f|v-f|verdadero|true|cierto)/.test(s))return "vf";
  if(/^(numeric|numero|num)/.test(s))return "numerica";
  if(/^(abierta|texto|libre|desarrollo|redaccion|ensayo)/.test(s))return "abierta";
  return null;
}
/* número escrito con coma o punto decimal (y sin separador de miles) */
function numero(v){var t=limpia(v).replace(/\s/g,"").replace(",",".");return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)?parseFloat(t):NaN;}
function vfDe(v){var s=clave(v);return /^(v|verdadero|true|cierto|si|1)$/.test(s)?0:/^(f|falso|false|no|0)$/.test(s)?1:-1;}
/* existentes: conjunto de claves de preguntas que ya están en el banco */
function valida(items,existentes){
  var vistas={}, ya=existentes||{};
  return items.map(function(it){
    var tipo=tipoDe(it.tipo);
    if(tipo&&tipo!=="opcion")return validaOtro(it,tipo,vistas,ya);
    var errores=[], avisos=[], q=limpia(it.q), c=limpia(it.correcta);
    if(!tipo)errores.push("Tipo «"+limpia(it.tipo)+"» no reconocido (usa opción, vf, numérica o abierta).");
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
    return {fila:it.fila,q:q,opts:todas,answer:0,level:nv.n,topic:limpia(it.tema).slice(0,60),tipo:"opcion",
            desarrollo:desarrolloDe(it.desarrollo,errores),errores:errores,avisos:avisos,ok:!errores.length};
  });
}
function desarrolloDe(v,errores){
  var d=String(v==null?"":v).replace(/\r/g,"").replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim();
  if(d.length>MAX_DES)errores.push("El desarrollo pasa de "+MAX_DES+" caracteres.");
  return d;
}
/* verdadero o falso, numérica y abierta */
function validaOtro(it,tipo,vistas,ya){
  var errores=[], avisos=[], q=limpia(it.q), nv=nivelDe(it.nivel), out;
  if(!q)errores.push("Falta el enunciado.");
  else if(q.length>MAX_Q)errores.push("El enunciado pasa de "+MAX_Q+" caracteres.");
  if(tipo==="vf"){
    var k=vfDe(it.correcta); if(k<0)errores.push("En verdadero o falso, la correcta es «Verdadero» o «Falso».");
    out={opts:["Verdadero","Falso"],answer:k<0?0:k};
  }else if(tipo==="numerica"){
    var v=numero(it.correcta), t=limpia(it.tol)===""?0:numero(it.tol);
    if(isNaN(v))errores.push("En una numérica, la correcta tiene que ser un número (p. ej. 9,81).");
    if(isNaN(t)||t<0)errores.push("La tolerancia tiene que ser un número positivo o cero.");
    out={opts:[isNaN(v)?"":String(v)],answer:0,num:{v:isNaN(v)?0:v,tol:isNaN(t)?0:Math.abs(t)}};
  }else{
    var mo=limpia(it.correcta); if(mo.length>MAX_MODELO)errores.push("La respuesta modelo pasa de "+MAX_MODELO+" caracteres.");
    out={opts:[mo],answer:0};
    avisos.push("Texto libre: no se corrige sola; el docente la califica al revisar.");
  }
  if(nv.aviso)avisos.push(nv.aviso);
  var kq=clave(q);
  if(q&&ya[kq])errores.push("Ya está en el banco.");
  else if(q&&vistas[kq])errores.push("Repetida en este archivo (fila "+vistas[kq]+").");
  if(q)vistas[kq]=it.fila||true;
  var r={fila:it.fila,q:q,opts:out.opts,answer:out.answer,level:nv.n,topic:limpia(it.tema).slice(0,60),tipo:tipo,
    desarrollo:desarrolloDe(it.desarrollo,errores),errores:errores,avisos:avisos};
  if(out.num)r.num=out.num;
  r.ok=!errores.length; return r;
}
/* cómo se corrige una respuesta numérica */
function numeroOk(resp,num){var v=numero(resp);return !isNaN(v)&&num&&Math.abs(v-num.v)<=Math.max(num.tol||0,1e-9*Math.max(1,Math.abs(num.v)));}

/* plantilla de ejemplo para descargar */
var PLANTILLA=[
  ["Pregunta","Tipo","Correcta","Incorrecta 1","Incorrecta 2","Incorrecta 3","Tolerancia","Nivel","Tema","Desarrollo"],
  ["¿Cuál es la derivada de x²?","opción","2x","x","x²/2","2","","2","Derivadas","Se baja el exponente y se resta uno: 2·x¹ = 2x."],
  ["¿Qué integral es el área bajo la curva?","opción","La definida","La indefinida","La impropia","","","1","Integrales",""],
  ["La derivada de una constante es cero.","vf","Verdadero","","","","","1","Derivadas","Una constante no cambia, así que su tasa de cambio es 0."],
  ["¿Cuánto vale la integral de 2x entre 0 y 3?","numérica","9","","","","0","2","Integrales","x² evaluado entre 0 y 3: 9 − 0 = 9."],
  ["Explica con tus palabras qué es un límite.","abierta","El valor al que se acerca f(x) cuando x se acerca a un punto.","","","","","3","Límites",""]
];
var EJEMPLO_TEXTO=
"¿Cuál es la derivada de x²?\nA) 2x\nB) x\nC) x²/2\nD) 2\nANSWER: A\nNIVEL: 2\nTEMA: Derivadas\n\n"+
"¿Qué integral representa el área bajo la curva?\nA) La indefinida\nB) La definida\nC) La impropia\nANSWER: B\nNIVEL: 1\nTEMA: Integrales";

G.AxBanco={NIVELES:NIVELES,TIPOS:TIPOS,MAX_Q:MAX_Q,MAX_OPC:MAX_OPC,MAX_OPCS:MAX_OPCS,MAX_DES:MAX_DES,clave:clave,limpia:limpia,
  tipoDe:tipoDe,numero:numero,numeroOk:numeroOk,
  desdeFilas:desdeFilas,desdeTexto:desdeTexto,desdeAiken:desdeAiken,csv:csv,valida:valida,
  PLANTILLA:PLANTILLA,EJEMPLO_TEXTO:EJEMPLO_TEXTO};
})(typeof globalThis!=="undefined"?globalThis:this);
