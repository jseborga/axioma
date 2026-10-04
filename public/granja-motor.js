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
     granja         3 minutos (o hasta perder tres pedidos)
     granja_sinfin  hasta perder tres pedidos (máx. 20 min)
   =========================================================== */
(function(G){
"use strict";

var TICK=100;                 /* ms por paso */
var DUR=1800, MAXSF=12000;    /* 3 min · 20 min */
var PARCELAS=6, GRANERO=24, COLA=3, VIDAS=3, MAX_ACC=6000;

/* productos: cultivo (crece en una parcela y da 2) o de fábrica */
var ITEMS={
  t:{nom:"Trigo",     valor:2,  crece:40, est:3,  nivel:1},
  m:{nom:"Maíz",      valor:3,  crece:60, est:4,  nivel:1},
  z:{nom:"Zanahoria", valor:3,  crece:50, est:4,  nivel:2},
  h:{nom:"Harina",    valor:9,  est:7,  nivel:1},
  p:{nom:"Pan",       valor:14, est:11, nivel:1},
  u:{nom:"Huevo",     valor:8,  est:7,  nivel:2},
  j:{nom:"Jugo",      valor:11, est:9,  nivel:2},
  k:{nom:"Torta",     valor:34, est:18, nivel:3}
};
var CULTIVOS=["t","m","z"];
var FABRICAS=[
  {id:"molino",     nom:"Molino",     de:{t:2},           da:"h", dura:40, nivel:1},
  {id:"horno",      nom:"Horno",      de:{h:1},           da:"p", dura:50, nivel:1},
  {id:"gallinero",  nom:"Gallinero",  de:{m:1},           da:"u", dura:40, nivel:2},
  {id:"jugos",      nom:"Jugos",      de:{z:2},           da:"j", dura:40, nivel:2},
  {id:"pasteleria", nom:"Pastelería", de:{h:1,u:1,z:1},   da:"k", dura:70, nivel:3}
];
/* monedas para subir de nivel y andenes de pedidos por nivel */
var NIVELES=[0,0,100,300,650];          /* NIVELES[n] = monedas para llegar a n */
var ANDENES=[0,2,3,3,4];
var COMBO_T=80;                         /* entregar antes de 8 s de la anterior encadena */

/* ---------- azar reproducible (el mismo que los juegos rápidos) ---------- */
function rng(s){var a=s>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};}

/* ---------- estado ---------- */
function crea(seed,modo){
  var s={seed:seed>>>0,modo:modo==="sinfin"?"sinfin":"tiempo",tick:0,fin:false,motivo:null,
    monedas:0,nivel:1,vidas:VIDAS,combo:0,ultEntrega:-999,entregas:0,perdidos:0,
    granero:{},parcelas:[],fabricas:[],pedidos:[],ev:[]};
  s.r=rng(s.seed);
  var i; for(i=0;i<PARCELAS;i++)s.parcelas.push({c:null,t0:0});
  for(i=0;i<FABRICAS.length;i++)s.fabricas.push({cola:[],t0:0,lista:0});   /* cola de productos; lista: hechos sin sitio */
  for(i=0;i<4;i++)s.pedidos.push({llega:i<ANDENES[1]?i*20:-1,p:null});
  return s;
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
  var plazo=Math.round(Math.min(1000,Math.max(300,(200+est*16)*aprieta)));
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
    if(f.lista&&total(s)<GRANERO){f.lista--;pon(s,d.da,1);aviso(s,{tipo:"hecho",f:i,k:d.da});}
    if(f.cola.length&&!f.lista&&s.tick-f.t0>=d.dura){
      f.cola.shift(); f.t0=s.tick;
      if(total(s)<GRANERO){pon(s,d.da,1);aviso(s,{tipo:"hecho",f:i,k:d.da});}else{f.lista++;aviso(s,{tipo:"lleno"});}
    }
  }
  /* pedidos: vencen o llegan */
  for(i=0;i<4;i++){
    var o=s.pedidos[i];
    if(o.p&&s.tick>=o.p.vence){
      o.p=null; o.llega=s.tick+30; s.vidas--; s.perdidos++; s.combo=0;
      aviso(s,{tipo:"perdido",i:i});
      if(s.vidas<=0){s.fin=true;s.motivo="vidas";aviso(s,{tipo:"fin"});return;}
    }else if(!o.p&&o.llega>=0&&s.tick>=o.llega){o.llega=-1;nuevoPedido(s,i);}
  }
  if(s.tick>=largo(s)){s.fin=true;s.motivo=s.modo==="sinfin"?"tope":"tiempo";aviso(s,{tipo:"fin"});}
}
function subeNivel(s){
  while(s.nivel<4&&s.monedas>=NIVELES[s.nivel+1]){
    s.nivel++; aviso(s,{tipo:"nivel",n:s.nivel});
    for(var i=ANDENES[s.nivel-1];i<ANDENES[s.nivel];i++)if(!s.pedidos[i].p&&s.pedidos[i].llega<0)s.pedidos[i].llega=s.tick+10;
  }
}

/* ---------- acciones (devuelven false si no se pueden hacer) ---------- */
function act(s,a,b,c){
  if(s.fin)return false;
  var pc, f, d, o;
  if(a==="s"){                                 /* sembrar */
    pc=s.parcelas[b]; if(!pc||pc.c||CULTIVOS.indexOf(c)<0||ITEMS[c].nivel>s.nivel)return false;
    pc.c=c; pc.t0=s.tick; aviso(s,{tipo:"siembra",i:b}); return true;
  }
  if(a==="c"){                                 /* cosechar: dos de cada parcela */
    pc=s.parcelas[b]; if(!pc||!pc.c||s.tick-pc.t0<ITEMS[pc.c].crece||total(s)+2>GRANERO)return false;
    pon(s,pc.c,2); aviso(s,{tipo:"cosecha",i:b,k:pc.c}); pc.c=null; return true;
  }
  if(a==="f"){                                 /* poner a fabricar */
    d=FABRICAS[b]; f=s.fabricas[b]; if(!d||d.nivel>s.nivel||f.cola.length>=COLA||!hay(s,d.de))return false;
    quita(s,d.de); if(!f.cola.length)f.t0=s.tick; f.cola.push(d.da); aviso(s,{tipo:"fabrica",f:b}); return true;
  }
  if(a==="e"){                                 /* entregar */
    if(!(b>=0&&b<ANDENES[s.nivel])||!puedeEntregar(s,b))return false;
    o=s.pedidos[b].p;
    o.items.forEach(function(x){s.granero[x[0]]-=x[1];});
    s.combo=s.tick-s.ultEntrega<=COMBO_T?Math.min(5,s.combo+1):0; s.ultEntrega=s.tick;
    var resto=Math.max(0,o.vence-s.tick), extra=Math.floor(resto/20);
    var gana=Math.round((o.premio+extra)*(1+0.1*s.combo));
    s.monedas+=gana; s.entregas++;
    s.pedidos[b].p=null; s.pedidos[b].llega=s.tick+15;
    aviso(s,{tipo:"entrega",i:b,monedas:gana,combo:s.combo});
    subeNivel(s); return true;
  }
  if(a==="v"){                                 /* vender uno del granero (la mitad de su valor): para no quedarse sin sitio */
    if(!(s.granero[c]>0))return false;
    s.granero[c]--; var v=Math.max(1,Math.floor(ITEMS[c].valor/2)); s.monedas+=v; aviso(s,{tipo:"vende",k:c,monedas:v}); subeNivel(s); return true;
  }
  if(a==="x"){                                 /* descartar un pedido: sin castigo, pero el andén tarda en llenarse */
    if(!(b>=0&&b<ANDENES[s.nivel])||!s.pedidos[b].p)return false;
    s.pedidos[b].p=null; s.pedidos[b].llega=s.tick+80; s.combo=0; aviso(s,{tipo:"descarta",i:b}); return true;
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
      if(!act(s,String(x[1]),parseInt(x[2],10),x[3]==null?null:String(x[3])))return null;
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
  granja:       {nom:"Granja Express",icono:"🚜",orden:"puntos",dur:"3 min",
                 desc:"Siembra, fabrica y entrega los pedidos antes de que se vayan. Tres minutos para juntar todas las monedas que puedas; si se te escapan tres pedidos, se acaba."},
  granja_sinfin:{nom:"Granja sin fin",icono:"🚜",orden:"puntos",dur:"sin fin",
                 desc:"La granja no cierra: sigue hasta que se te escapen tres pedidos, y cada vez llegan con menos plazo."}
};
function es(j){return j==="granja"||j==="granja_sinfin";}
function genera(juego,seed){return {seed:seed>>>0,modo:juego==="granja_sinfin"?"sinfin":"tiempo"};}
function evalua(juego,datos,envio){
  var s=repite(datos.seed,datos.modo,envio); if(!s)return null;
  return {score:s.monedas,seconds:Math.max(1,Math.round(s.tick*TICK/1000)),entregas:s.entregas,perdidos:s.perdidos,nivel:s.nivel};
}
/* el reloj del servidor: la partida no puede haber durado menos de lo simulado,
   ni mucho más (el juego avanza con el reloj aunque la pestaña quede en segundo plano) */
function tiempoOk(res,realMs){var sim=res.seconds*1000; return realMs>=sim-4000&&realMs<=sim+90000;}

var R=G.AxRapidos;
if(R&&!R.JUEGOS.granja){
  Object.keys(JUEGOS).forEach(function(k){R.JUEGOS[k]=JUEGOS[k];});
  var g0=R.genera, e0=R.evalua, f0=R.formato;
  R.genera=function(j,s,v,p){return es(j)?genera(j,s):g0(j,s,v,p);};
  R.evalua=function(j,d,e){return es(j)?evalua(j,d,e):e0(j,d,e);};
  R.formato=function(j,sc,se){return es(j)?sc+(sc===1?" moneda":" monedas"):f0(j,sc,se);};
}

G.AxGranja={TICK:TICK,DUR:DUR,MAXSF:MAXSF,PARCELAS:PARCELAS,GRANERO:GRANERO,COLA:COLA,VIDAS:VIDAS,COMBO_T:COMBO_T,
  ITEMS:ITEMS,CULTIVOS:CULTIVOS,FABRICAS:FABRICAS,NIVELES:NIVELES,ANDENES:ANDENES,JUEGOS:JUEGOS,
  crea:crea,paso:paso,act:act,repite:repite,total:total,hay:hay,puedeEntregar:puedeEntregar,largo:largo,
  es:es,genera:genera,evalua:evalua,tiempoOk:tiempoOk};
})(typeof globalThis!=="undefined"?globalThis:this);
