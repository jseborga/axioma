/* ===========================================================
   THE FINAL TEST · Granja Express · motor
   Un arcade de estrategia y velocidad: siembra, fabrica y entrega
   los pedidos antes de que se vayan. Sube de nivel durante la
   partida (más cultivos, fábricas y andenes) según las monedas.

   La partida es una simulación determinista a 10 pasos por segundo
   a partir de una semilla. El navegador guarda cada acción con su
   paso; el servidor repite la partida entera con esas acciones y
   calcula él mismo las monedas: nadie puede enviar una marca
   inventada. Lo usan por igual el navegador y el Worker (no toca
   window ni document) y se registra en AxRapidos como dos juegos:
     granja         4 minutos (o hasta perder tres pedidos)
     granja_sinfin  hasta perder tres pedidos (máx. 20 min)
   =========================================================== */
(function(G){
"use strict";

var TICK=100;                 /* ms por paso */
var DUR=2400, MAXSF=12000;    /* 4 min · 20 min */
var PARCELAS=6, MAX_PARCELAS=8, GRANERO=24, COLA=3, VIDAS=3, MAX_ACC=6000;
var PRIMERA_Q=250, CADA_Q=400, MAX_Q=10, PREMIO_Q=10;   /* pregunta de mejora: a los 25 s y cada 40 s; +10 monedas por acierto */

/* productos: cultivo (crece en una parcela y da 2) o de fábrica */
var ITEMS={
  t:{nom:"Trigo",     valor:2,  crece:60, est:4,  nivel:1},
  m:{nom:"Maíz",      valor:3,  crece:90, est:6,  nivel:1},
  z:{nom:"Zanahoria", valor:3,  crece:75, est:5,  nivel:2},
  h:{nom:"Harina",    valor:9,  est:10, nivel:1},
  p:{nom:"Pan",       valor:14, est:16, nivel:1},
  u:{nom:"Huevo",     valor:8,  est:10, nivel:2},
  j:{nom:"Jugo",      valor:11, est:13, nivel:2},
  k:{nom:"Torta",     valor:34, est:26, nivel:3}
};
var CULTIVOS=["t","m","z"];
var FABRICAS=[
  {id:"molino",     nom:"Molino",     de:{t:2},           da:"h", dura:60, nivel:1},
  {id:"horno",      nom:"Horno",      de:{h:1},           da:"p", dura:70, nivel:1},
  {id:"gallinero",  nom:"Gallinero",  de:{m:1},           da:"u", dura:60, nivel:2},
  {id:"jugos",      nom:"Jugos",      de:{z:2},           da:"j", dura:60, nivel:2},
  {id:"pasteleria", nom:"Pastelería", de:{h:1,u:1,z:1},   da:"k", dura:100, nivel:3}
];
/* monedas para subir de nivel y andenes de pedidos por nivel */
var NIVELES=[0,0,100,300,650];          /* NIVELES[n] = monedas para llegar a n */
var ANDENES=[0,2,3,3,4];
var COMBO_T=100;                        /* entregar antes de 10 s de la anterior encadena */
/* mejoras que se ganan acertando una pregunta: se elige una de tres */
var MEJORAS={
  abono:    {nom:"Abono",          desc:"Los cultivos crecen un 20 % más rápido", max:2, ico:"t"},
  parcela:  {nom:"Parcela nueva",  desc:"Una parcela más para sembrar",           max:2, ico:"m"},
  granero:  {nom:"Granero grande", desc:"8 lugares más en el granero",            max:2, ico:"h"},
  turbo:    {nom:"Fábricas turbo", desc:"Las fábricas trabajan un 20 % más rápido",max:2, ico:"p"},
  cola:     {nom:"Cola larga",     desc:"Cada fábrica acepta 4 en cola",           max:1, ico:"u"},
  cosecha:  {nom:"Cosecha triple", desc:"Cada parcela da 3 en lugar de 2",         max:1, ico:"z"},
  vida:     {nom:"Vida extra",     desc:"Un corazón más",                          max:1, ico:"vida"},
  paciencia:{nom:"Clientes pacientes",desc:"Los pedidos nuevos esperan un 25 % más",max:2, ico:"j"},
  precio:   {nom:"Buen precio",    desc:"Cada entrega paga un 15 % más",           max:2, ico:"k"}
};

/* ---------- azar reproducible (el mismo que los juegos rápidos) ---------- */
function rng(s){var a=s>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};}

/* ---------- estado ---------- */
function crea(seed,modo){
  var s={seed:seed>>>0,modo:modo==="sinfin"?"sinfin":"tiempo",tick:0,fin:false,motivo:null,
    monedas:0,nivel:1,vidas:VIDAS,combo:0,ultEntrega:-999,entregas:0,perdidos:0,
    granero:{},parcelas:[],fabricas:[],pedidos:[],ev:[],
    mej:{},preguntas:0,aciertos:0,qDisp:false,proxQ:PRIMERA_Q,qUsadas:{}};
  s.r=rng(s.seed);
  var i; for(i=0;i<MAX_PARCELAS;i++)s.parcelas.push({c:null,t0:0});
  for(i=0;i<FABRICAS.length;i++)s.fabricas.push({cola:[],t0:0,lista:0});   /* cola de productos; lista: hechos sin sitio */
  for(i=0;i<4;i++)s.pedidos.push({llega:i<ANDENES[1]?10+i*50:-1,p:null});
  Object.keys(MEJORAS).forEach(function(k){s.mej[k]=0;});
  return s;
}
/* lo que cambian las mejoras */
function nParcelas(s){return PARCELAS+s.mej.parcela;}
function capacidad(s){return GRANERO+8*s.mej.granero;}
function crece(s,c){return Math.round(ITEMS[c].crece*(1-0.2*s.mej.abono));}
function dura(s,i){return Math.round(FABRICAS[i].dura*(1-0.2*s.mej.turbo));}
function cola(s){return COLA+s.mej.cola;}
function rinde(s){return 2+s.mej.cosecha;}
/* las tres mejoras que se ofrecen tras un acierto: dependen solo de la semilla y de cuántas van */
function ofertas(s){
  var r=rng((s.seed^Math.imul(0x9E3779B1,s.aciertos+1))>>>0), libres=Object.keys(MEJORAS).filter(function(k){return s.mej[k]<MEJORAS[k].max;});
  for(var i=libres.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=libres[i];libres[i]=libres[j];libres[j]=t;}
  return libres.slice(0,3);
}
function total(s){var n=0,k;for(k in s.granero)n+=s.granero[k];return n;}
function hay(s,de){for(var k in de)if((s.granero[k]||0)<de[k])return false;return true;}
function quita(s,de){for(var k in de)s.granero[k]-=de[k];}
function pon(s,k,n){s.granero[k]=(s.granero[k]||0)+n;}
function aviso(s,e){if(s.ev)s.ev.push(e);}
function disponibles(s){return Object.keys(ITEMS).filter(function(k){return ITEMS[k].nivel<=s.nivel;});}
function largo(s){return s.modo==="sinfin"?MAXSF:DUR;}

/* ---------- pedidos ---------- */
function nuevoPedido(s,i){
  var r=s.r, av=disponibles(s), elab=av.filter(function(k){return !ITEMS[k].crece;});
  var lineas=1+(r()<0.55?1:0)+(s.nivel>=3&&r()<0.35?1:0), items=[], usados={}, n;
  for(n=0;n<lineas;n++){
    /* a más nivel, más productos elaborados */
    var pool=(r()<0.35+0.12*s.nivel)?elab:av, k=pool[Math.floor(r()*pool.length)];
    if(usados[k]){continue;} usados[k]=1;
    var q=ITEMS[k].crece?2+Math.floor(r()*3):(k==="k"?1:1+Math.floor(r()*2));
    items.push([k,q]);
  }
  var est=0, val=0;
  items.forEach(function(x){est+=ITEMS[x[0]].est*x[1];val+=ITEMS[x[0]].valor*x[1];});
  /* con el tiempo los pedidos aprietan: hasta un 40 % menos de plazo en la granja sin fin */
  var aprieta=s.modo==="sinfin"?Math.max(0.6,1-s.tick/9000*0.4):Math.max(0.8,1-s.tick/DUR*0.2);
  var plazo=Math.round(Math.min(1500,Math.max(450,(300+est*20)*aprieta))*(1+0.25*s.mej.paciencia));
  s.pedidos[i].p={items:items,premio:Math.round(val*(1+0.15*(s.nivel-1)))+5*(items.length-1),t0:s.tick,vence:s.tick+plazo};
  aviso(s,{tipo:"pedido",i:i});
}
function puedeEntregar(s,i){var o=s.pedidos[i]&&s.pedidos[i].p; if(!o)return false;
  for(var n=0;n<o.items.length;n++)if((s.granero[o.items[n][0]]||0)<o.items[n][1])return false; return true;}

/* ---------- un paso de 100 ms ---------- */
function paso(s){
  if(s.fin)return;
  s.tick++;
  var i, f, d;
  /* fábricas: el primero de la cola avanza; al acabar va al granero si cabe */
  for(i=0;i<FABRICAS.length;i++){
    f=s.fabricas[i]; d=FABRICAS[i];
    if(f.lista&&total(s)<capacidad(s)){f.lista--;pon(s,d.da,1);aviso(s,{tipo:"hecho",f:i,k:d.da});}
    if(f.cola.length&&!f.lista&&s.tick-f.t0>=dura(s,i)){
      f.cola.shift(); f.t0=s.tick;
      if(total(s)<capacidad(s)){pon(s,d.da,1);aviso(s,{tipo:"hecho",f:i,k:d.da});}else{f.lista++;aviso(s,{tipo:"lleno"});}
    }
  }
  /* pedidos: vencen o llegan */
  for(i=0;i<4;i++){
    var o=s.pedidos[i];
    if(o.p&&s.tick>=o.p.vence){
      o.p=null; o.llega=s.tick+50; s.vidas--; s.perdidos++; s.combo=0;
      aviso(s,{tipo:"perdido",i:i});
      if(s.vidas<=0){s.fin=true;s.motivo="vidas";aviso(s,{tipo:"fin"});return;}
    }else if(!o.p&&o.llega>=0&&s.tick>=o.llega){o.llega=-1;nuevoPedido(s,i);}
  }
  /* pregunta de mejora disponible */
  if(!s.qDisp&&s.preguntas<MAX_Q&&s.tick>=s.proxQ){s.qDisp=true;aviso(s,{tipo:"pregunta"});}
  if(s.tick>=largo(s)){s.fin=true;s.motivo=s.modo==="sinfin"?"tope":"tiempo";aviso(s,{tipo:"fin"});}
}
function subeNivel(s){
  while(s.nivel<4&&s.monedas>=NIVELES[s.nivel+1]){
    s.nivel++; aviso(s,{tipo:"nivel",n:s.nivel});
    for(var i=ANDENES[s.nivel-1];i<ANDENES[s.nivel];i++)if(!s.pedidos[i].p&&s.pedidos[i].llega<0)s.pedidos[i].llega=s.tick+20;
  }
}

/* ---------- acciones (devuelven false si no se pueden hacer) ---------- */
function act(s,a,b,c,d2,e2){
  if(s.fin)return false;
  var pc, f, d, o;
  if(a==="s"){                                 /* sembrar */
    pc=b<nParcelas(s)&&s.parcelas[b]; if(!pc||pc.c||CULTIVOS.indexOf(c)<0||ITEMS[c].nivel>s.nivel)return false;
    pc.c=c; pc.t0=s.tick; aviso(s,{tipo:"siembra",i:b}); return true;
  }
  if(a==="c"){                                 /* cosechar: dos de cada parcela (tres con la mejora) */
    pc=b<nParcelas(s)&&s.parcelas[b]; if(!pc||!pc.c||s.tick-pc.t0<crece(s,pc.c)||total(s)+rinde(s)>capacidad(s))return false;
    pon(s,pc.c,rinde(s)); aviso(s,{tipo:"cosecha",i:b,k:pc.c,n:rinde(s)}); pc.c=null; return true;
  }
  if(a==="f"){                                 /* poner a fabricar */
    d=FABRICAS[b]; f=s.fabricas[b]; if(!d||d.nivel>s.nivel||f.cola.length>=cola(s)||!hay(s,d.de))return false;
    quita(s,d.de); if(!f.cola.length)f.t0=s.tick; f.cola.push(d.da); aviso(s,{tipo:"fabrica",f:b}); return true;
  }
  if(a==="e"){                                 /* entregar */
    if(!(b>=0&&b<ANDENES[s.nivel])||!puedeEntregar(s,b))return false;
    o=s.pedidos[b].p;
    o.items.forEach(function(x){s.granero[x[0]]-=x[1];});
    s.combo=s.tick-s.ultEntrega<=COMBO_T?Math.min(5,s.combo+1):0; s.ultEntrega=s.tick;
    var resto=Math.max(0,o.vence-s.tick), extra=Math.floor(resto/30);
    var gana=Math.round((o.premio+extra)*(1+0.1*s.combo)*(1+0.15*s.mej.precio));
    s.monedas+=gana; s.entregas++;
    s.pedidos[b].p=null; s.pedidos[b].llega=s.tick+30;
    aviso(s,{tipo:"entrega",i:b,monedas:gana,combo:s.combo});
    subeNivel(s); return true;
  }
  if(a==="v"){                                 /* vender uno del granero (la mitad de su valor): para no quedarse sin sitio */
    if(!(s.granero[c]>0))return false;
    s.granero[c]--; var v=Math.max(1,Math.floor(ITEMS[c].valor/2)); s.monedas+=v; aviso(s,{tipo:"vende",k:c,monedas:v}); subeNivel(s); return true;
  }
  if(a==="x"){                                 /* descartar un pedido: sin castigo, pero el andén tarda en llenarse */
    if(!(b>=0&&b<ANDENES[s.nivel])||!s.pedidos[b].p)return false;
    s.pedidos[b].p=null; s.pedidos[b].llega=s.tick+100; s.combo=0; aviso(s,{tipo:"descarta",i:b}); return true;
  }
  if(a==="q"){                                 /* pregunta de mejora: b opción elegida, c id de la pregunta, d2 mejora, e2 si acertó */
    var qid=String(c||"").slice(0,24);
    if(!s.qDisp||!qid||s.qUsadas[qid]||!(b>=-1&&b<=3))return false;
    /* en el servidor la respuesta la comprueba su banco; en el navegador llega ya comprobada */
    var bien=G.AxGranja.oraculo?G.AxGranja.oraculo(qid,b,s.seed):!!e2;
    if(bien===null)return false;
    if(bien){ if(ofertas(s).indexOf(d2)<0)return false; }
    else if(d2)return false;
    s.qUsadas[qid]=1; s.qDisp=false; s.preguntas++; s.proxQ=s.tick+CADA_Q;
    if(bien){
      s.aciertos++; s.mej[d2]++; s.monedas+=PREMIO_Q;
      if(d2==="vida")s.vidas++;
      if(d2==="paciencia")s.pedidos.forEach(function(o){if(o.p)o.p.vence+=100;});
      aviso(s,{tipo:"mejora",k:d2}); subeNivel(s);
    }else aviso(s,{tipo:"falla"});
    return true;
  }
  return false;
}

/* ---------- repetir una partida (servidor) ----------
   envio: {a:[[paso,acción,b,c]…], fin:paso}. Devuelve el estado final o null si algo no cuadra. */
function repite(seed,modo,envio){
  if(!envio||!Array.isArray(envio.a)||envio.a.length>MAX_ACC)return null;
  var s=crea(seed,modo), tope=largo(s), fin=parseInt(envio.fin,10);
  if(!(fin>=0))fin=tope; fin=Math.min(fin,tope);
  s.ev=null;
  var n=0, acc=envio.a, ult=0;
  for(;;){
    while(n<acc.length){
      var x=acc[n]; if(!Array.isArray(x))return null;
      var t=parseInt(x[0],10); if(!(t>=ult))return null;
      if(t>s.tick)break;
      if(t<s.tick)return null;
      if(!act(s,String(x[1]),parseInt(x[2],10),x[3]==null?null:String(x[3]),x[4]==null?null:String(x[4]),x[5]===true||x[5]===1))return null;
      ult=t; n++;
    }
    if(s.fin||s.tick>=fin)break;
    paso(s);
  }
  if(n<acc.length)return null;             /* acciones después del final */
  return s;
}

/* ---------- en el sistema de juegos rápidos ---------- */
var JUEGOS={
  granja:       {nom:"Granja Express",icono:"🚜",orden:"puntos",dur:"4 min",
                 desc:"Siembra, fabrica y entrega los pedidos antes de que se vayan; acierta preguntas para mejorar tu granja. Cuatro minutos para juntar todas las monedas que puedas; si se te escapan tres pedidos, se acaba."},
  granja_sinfin:{nom:"Granja sin fin",icono:"🚜",orden:"puntos",dur:"sin fin",
                 desc:"La granja no cierra: sigue hasta que se te escapen tres pedidos, y cada vez llegan con menos plazo."}
};
function es(j){return j==="granja"||j==="granja_sinfin";}
function genera(juego,seed){return {seed:seed>>>0,modo:juego==="granja_sinfin"?"sinfin":"tiempo"};}
function evalua(juego,datos,envio){
  var s=repite(datos.seed,datos.modo,envio); if(!s)return null;
  return {score:s.monedas,seconds:Math.max(1,Math.round(s.tick*TICK/1000)),entregas:s.entregas,perdidos:s.perdidos,nivel:s.nivel,preguntas:s.preguntas,aciertos:s.aciertos};
}
/* el reloj del servidor: la partida no puede haber durado menos de lo simulado,
   ni mucho más (el juego avanza con el reloj aunque la pestaña quede en segundo plano) */
function tiempoOk(res,realMs){var sim=res.seconds*1000; return realMs>=sim-4000&&realMs<=sim+90000+35000*(res.preguntas||0);}   /* cada pregunta pausa el juego (máx. 30 s) */

var R=G.AxRapidos;
if(R&&!R.JUEGOS.granja){
  Object.keys(JUEGOS).forEach(function(k){R.JUEGOS[k]=JUEGOS[k];});
  var g0=R.genera, e0=R.evalua, f0=R.formato;
  R.genera=function(j,s,v,p){return es(j)?genera(j,s):g0(j,s,v,p);};
  R.evalua=function(j,d,e){return es(j)?evalua(j,d,e):e0(j,d,e);};
  R.formato=function(j,sc,se){return es(j)?sc+(sc===1?" moneda":" monedas"):f0(j,sc,se);};
}

G.AxGranja={TICK:TICK,DUR:DUR,MAXSF:MAXSF,PARCELAS:PARCELAS,MAX_PARCELAS:MAX_PARCELAS,GRANERO:GRANERO,COLA:COLA,VIDAS:VIDAS,COMBO_T:COMBO_T,
  CADA_Q:CADA_Q,MAX_Q:MAX_Q,PREMIO_Q:PREMIO_Q,MEJORAS:MEJORAS,
  ITEMS:ITEMS,CULTIVOS:CULTIVOS,FABRICAS:FABRICAS,NIVELES:NIVELES,ANDENES:ANDENES,JUEGOS:JUEGOS,
  crea:crea,paso:paso,act:act,repite:repite,total:total,hay:hay,puedeEntregar:puedeEntregar,largo:largo,
  nParcelas:nParcelas,capacidad:capacidad,crece:crece,dura:dura,cola:cola,rinde:rinde,ofertas:ofertas,
  oraculo:null,   /* el servidor pone aquí cómo comprobar una respuesta: (id, opción, semilla) → true/false/null */
  es:es,genera:genera,evalua:evalua,tiempoOk:tiempoOk};
})(typeof globalThis!=="undefined"?globalThis:this);
