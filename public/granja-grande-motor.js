/* ===========================================================
   THE FINAL TEST · Granja Grande · motor
   La versión extendida de Granja Express: 8 minutos, 12 productos,
   8 fábricas que se mejoran (velocidad y cola), parcelas que se
   compran (hasta 16) y un granero que se amplía. Las monedas se
   gastan en mejoras: el puntaje son las monedas ganadas en total.

   Igual que la granja clásica, es una simulación determinista a 10
   pasos por segundo: el servidor repite la partida con las acciones
   y comprueba cada respuesta de las preguntas de mejora con su
   banco (AxGranja.oraculo). Lo usan el navegador y el Worker.
   Se registra en AxRapidos como «granja_grande».
   =========================================================== */
(function(G){
"use strict";

var TICK=100, DUR=4800, MAX_ACC=12000;          /* 8 minutos */
var PARCELAS=6, MAX_PARCELAS=16, GRANERO=30, GRANERO_PASO=12, COLA=3, VIDAS=3;
var PRIMERA_Q=300, CADA_Q=450, MAX_Q=12, PREMIO_Q=15;
var COMBO_T=100;

var ITEMS={
  t:{nom:"Trigo",     valor:2,  crece:60,  est:4,  nivel:1},
  m:{nom:"Maíz",      valor:3,  crece:90,  est:6,  nivel:1},
  z:{nom:"Zanahoria", valor:3,  crece:75,  est:5,  nivel:3},
  a:{nom:"Algodón",   valor:4,  crece:110, est:7,  nivel:5},
  h:{nom:"Harina",    valor:9,  est:10, nivel:1},
  p:{nom:"Pan",       valor:14, est:16, nivel:1},
  u:{nom:"Huevo",     valor:8,  est:10, nivel:2},
  l:{nom:"Leche",     valor:12, est:14, nivel:2},
  j:{nom:"Jugo",      valor:11, est:13, nivel:3},
  k:{nom:"Torta",     valor:34, est:26, nivel:4},
  q:{nom:"Queso",     valor:30, est:24, nivel:4},
  e:{nom:"Tela",      valor:22, est:20, nivel:5}
};
var CULTIVOS=["t","m","z","a"];
var FABRICAS=[
  {id:"molino",     nom:"Molino",     de:{t:2},          da:"h", dura:60,  nivel:1},
  {id:"horno",      nom:"Horno",      de:{h:1},          da:"p", dura:70,  nivel:1},
  {id:"gallinero",  nom:"Gallinero",  de:{m:1},          da:"u", dura:60,  nivel:2},
  {id:"establo",    nom:"Establo",    de:{m:2},          da:"l", dura:80,  nivel:2},
  {id:"jugos",      nom:"Jugos",      de:{z:2},          da:"j", dura:60,  nivel:3},
  {id:"pasteleria", nom:"Pastelería", de:{h:1,u:1,z:1},  da:"k", dura:100, nivel:4},
  {id:"queseria",   nom:"Quesería",   de:{l:2},          da:"q", dura:100, nivel:4},
  {id:"telar",      nom:"Telar",      de:{a:2},          da:"e", dura:90,  nivel:5}
];
var NIVELES=[0,0,120,350,700,1200,1900];   /* monedas ganadas para llegar a cada nivel */
var ANDENES=[0,2,3,3,4,4,5];
var MAQ_MAX=3;
/* lo que cuesta mejorar cada máquina (al nivel 2 y al 3) */
function costoMaquina(i,lv){var b=20+ITEMS[FABRICAS[i].da].valor*3; return lv===1?b:lv===2?b*2:null;}
function costoParcela(s){return 30+15*(s.parcelasN-PARCELAS);}
var COSTO_GRANERO=[80,160,280];
var MEJORAS={
  abono:    {nom:"Abono",            desc:"Los cultivos crecen un 20 % más rápido",        max:2},
  turbo:    {nom:"Fábricas turbo",   desc:"Todas las fábricas, un 15 % más rápidas",      max:2},
  cosecha:  {nom:"Cosecha triple",   desc:"Cada parcela da 3 en lugar de 2",              max:1},
  vida:     {nom:"Vida extra",       desc:"Un corazón más",                               max:1},
  paciencia:{nom:"Clientes pacientes",desc:"Los pedidos nuevos esperan un 25 % más",      max:2},
  precio:   {nom:"Buen precio",      desc:"Cada entrega paga un 15 % más",                max:2},
  regalo:   {nom:"Subvención",       desc:"60 monedas para gastar en mejoras",            max:3}
};

function rng(s){var a=s>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};}

function crea(seed){
  var s={seed:seed>>>0,modo:"grande",tick:0,fin:false,motivo:null,
    monedas:0,ganado:0,gastado:0,nivel:1,vidas:VIDAS,combo:0,ultEntrega:-999,entregas:0,perdidos:0,
    granero:{},parcelas:[],parcelasN:PARCELAS,graneroLv:0,fabricas:[],pedidos:[],ev:[],
    mej:{},preguntas:0,aciertos:0,qDisp:false,proxQ:PRIMERA_Q,qUsadas:{}};
  s.r=rng(s.seed);
  var i; for(i=0;i<MAX_PARCELAS;i++)s.parcelas.push({c:null,t0:0});
  for(i=0;i<FABRICAS.length;i++)s.fabricas.push({cola:[],t0:0,lista:0,lv:1});
  for(i=0;i<5;i++)s.pedidos.push({llega:i<ANDENES[1]?10+i*50:-1,p:null});
  Object.keys(MEJORAS).forEach(function(k){s.mej[k]=0;});
  return s;
}
function nParcelas(s){return s.parcelasN;}
function capacidad(s){return GRANERO+GRANERO_PASO*s.graneroLv;}
function crece(s,c){return Math.round(ITEMS[c].crece*(1-0.2*s.mej.abono));}
function dura(s,i){return Math.round(FABRICAS[i].dura*(1-0.2*(s.fabricas[i].lv-1))*(1-0.15*s.mej.turbo));}
function cola(s,i){return COLA+(s.fabricas[i].lv-1);}
function salida(s,i){return s.fabricas[i].lv>=3?2:1;}   /* en el nivel 3 la máquina hace dos de cada tanda */
function rinde(s){return 2+s.mej.cosecha;}
function ofertas(s){
  var r=rng((s.seed^Math.imul(0x85EBCA6B,s.aciertos+1))>>>0), libres=Object.keys(MEJORAS).filter(function(k){return s.mej[k]<MEJORAS[k].max;});
  for(var i=libres.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=libres[i];libres[i]=libres[j];libres[j]=t;}
  return libres.slice(0,3);
}
function total(s){var n=0,k;for(k in s.granero)n+=s.granero[k];return n;}
function hay(s,de){for(var k in de)if((s.granero[k]||0)<de[k])return false;return true;}
function quita(s,de){for(var k in de)s.granero[k]-=de[k];}
function pon(s,k,n){s.granero[k]=(s.granero[k]||0)+n;}
function aviso(s,e){if(s.ev)s.ev.push(e);}
function disponibles(s){return Object.keys(ITEMS).filter(function(k){return ITEMS[k].nivel<=s.nivel;});}
function largo(){return DUR;}
function gana(s,n){s.monedas+=n;s.ganado+=n;subeNivel(s);}

function nuevoPedido(s,i){
  var r=s.r, av=disponibles(s), elab=av.filter(function(k){return !ITEMS[k].crece;});
  var lineas=1+(r()<0.55?1:0)+(s.nivel>=3&&r()<0.4?1:0), items=[], usados={}, n;
  for(n=0;n<lineas;n++){
    var pool=(r()<0.3+0.1*s.nivel)?elab:av, k=pool[Math.floor(r()*pool.length)];
    if(usados[k])continue; usados[k]=1;
    var q=ITEMS[k].crece?2+Math.floor(r()*3):(ITEMS[k].valor>=25?1:1+Math.floor(r()*2));
    items.push([k,q]);
  }
  var est=0, val=0;
  items.forEach(function(x){est+=ITEMS[x[0]].est*x[1];val+=ITEMS[x[0]].valor*x[1];});
  var aprieta=Math.max(0.75,1-s.tick/DUR*0.25);
  var plazo=Math.round(Math.min(2000,Math.max(550,(400+est*24)*aprieta))*(1+0.25*s.mej.paciencia));
  s.pedidos[i].p={items:items,premio:Math.round(val*(1+0.12*(s.nivel-1)))+5*(items.length-1),t0:s.tick,vence:s.tick+plazo};
  aviso(s,{tipo:"pedido",i:i});
}
function puedeEntregar(s,i){var o=s.pedidos[i]&&s.pedidos[i].p; if(!o)return false;
  for(var n=0;n<o.items.length;n++)if((s.granero[o.items[n][0]]||0)<o.items[n][1])return false; return true;}

function paso(s){
  if(s.fin)return;
  s.tick++;
  var i, f, d;
  for(i=0;i<FABRICAS.length;i++){
    f=s.fabricas[i]; d=FABRICAS[i];
    while(f.lista&&total(s)<capacidad(s)){f.lista--;pon(s,d.da,1);aviso(s,{tipo:"hecho",f:i,k:d.da});}
    if(f.cola.length&&!f.lista&&s.tick-f.t0>=dura(s,i)){
      f.cola.shift(); f.t0=s.tick;
      for(var n2=salida(s,i);n2>0;n2--){ if(total(s)<capacidad(s)){pon(s,d.da,1);aviso(s,{tipo:"hecho",f:i,k:d.da});}else{f.lista++;aviso(s,{tipo:"lleno"});} }
    }
  }
  for(i=0;i<5;i++){
    var o=s.pedidos[i];
    if(o.p&&s.tick>=o.p.vence){
      o.p=null; o.llega=s.tick+50; s.vidas--; s.perdidos++; s.combo=0;
      aviso(s,{tipo:"perdido",i:i});
      if(s.vidas<=0){s.fin=true;s.motivo="vidas";aviso(s,{tipo:"fin"});return;}
    }else if(!o.p&&o.llega>=0&&s.tick>=o.llega){o.llega=-1;nuevoPedido(s,i);}
  }
  if(!s.qDisp&&s.preguntas<MAX_Q&&s.tick>=s.proxQ){s.qDisp=true;aviso(s,{tipo:"pregunta"});}
  if(s.tick>=DUR){s.fin=true;s.motivo="tiempo";aviso(s,{tipo:"fin"});}
}
function subeNivel(s){
  while(s.nivel<6&&s.ganado>=NIVELES[s.nivel+1]){
    s.nivel++; aviso(s,{tipo:"nivel",n:s.nivel});
    for(var i=ANDENES[s.nivel-1];i<ANDENES[s.nivel];i++)if(!s.pedidos[i].p&&s.pedidos[i].llega<0)s.pedidos[i].llega=s.tick+20;
  }
}
function gasta(s,n){if(s.monedas<n)return false; s.monedas-=n; s.gastado+=n; return true;}

/* ---------- acciones ---------- */
function act(s,a,b,c,d2,e2){
  if(s.fin)return false;
  var pc, f, d, o;
  if(a==="s"){
    pc=b<s.parcelasN&&s.parcelas[b]; if(!pc||pc.c||CULTIVOS.indexOf(c)<0||ITEMS[c].nivel>s.nivel)return false;
    pc.c=c; pc.t0=s.tick; aviso(s,{tipo:"siembra",i:b}); return true;
  }
  if(a==="c"){
    pc=b<s.parcelasN&&s.parcelas[b]; if(!pc||!pc.c||s.tick-pc.t0<crece(s,pc.c)||total(s)+rinde(s)>capacidad(s))return false;
    pon(s,pc.c,rinde(s)); aviso(s,{tipo:"cosecha",i:b,k:pc.c,n:rinde(s)}); pc.c=null; return true;
  }
  if(a==="f"){
    d=FABRICAS[b]; f=s.fabricas[b]; if(!d||d.nivel>s.nivel||f.cola.length>=cola(s,b)||!hay(s,d.de))return false;
    quita(s,d.de); if(!f.cola.length)f.t0=s.tick; f.cola.push(d.da); aviso(s,{tipo:"fabrica",f:b}); return true;
  }
  if(a==="e"){
    if(!(b>=0&&b<ANDENES[s.nivel])||!puedeEntregar(s,b))return false;
    o=s.pedidos[b].p;
    o.items.forEach(function(x){s.granero[x[0]]-=x[1];});
    s.combo=s.tick-s.ultEntrega<=COMBO_T?Math.min(5,s.combo+1):0; s.ultEntrega=s.tick;
    var extra=Math.floor(Math.max(0,o.vence-s.tick)/30);
    var g=Math.round((o.premio+extra)*(1+0.1*s.combo)*(1+0.15*s.mej.precio));
    s.entregas++; s.pedidos[b].p=null; s.pedidos[b].llega=s.tick+30;
    aviso(s,{tipo:"entrega",i:b,monedas:g,combo:s.combo}); gana(s,g); return true;
  }
  if(a==="v"){
    if(!ITEMS[c]||!(s.granero[c]>0))return false;
    s.granero[c]--; var v=Math.max(1,Math.floor(ITEMS[c].valor/2)); aviso(s,{tipo:"vende",k:c,monedas:v}); gana(s,v); return true;
  }
  if(a==="x"){
    if(!(b>=0&&b<ANDENES[s.nivel])||!s.pedidos[b].p)return false;
    s.pedidos[b].p=null; s.pedidos[b].llega=s.tick+100; s.combo=0; aviso(s,{tipo:"descarta",i:b}); return true;
  }
  if(a==="u"){                                 /* mejorar una máquina: más rápida y una más en cola */
    d=FABRICAS[b]; f=s.fabricas[b]; if(!d||d.nivel>s.nivel||f.lv>=MAQ_MAX)return false;
    if(!gasta(s,costoMaquina(b,f.lv)))return false;
    f.lv++; aviso(s,{tipo:"maquina",f:b,lv:f.lv}); return true;
  }
  if(a==="b"){                                 /* comprar la siguiente parcela */
    if(s.parcelasN>=MAX_PARCELAS||!gasta(s,costoParcela(s)))return false;
    s.parcelasN++; aviso(s,{tipo:"parcela",i:s.parcelasN-1}); return true;
  }
  if(a==="g"){                                 /* ampliar el granero */
    if(s.graneroLv>=COSTO_GRANERO.length||!gasta(s,COSTO_GRANERO[s.graneroLv]))return false;
    s.graneroLv++; aviso(s,{tipo:"granero",lv:s.graneroLv}); return true;
  }
  if(a==="q"){
    var qid=String(c||"").slice(0,24);
    if(!s.qDisp||!qid||s.qUsadas[qid]||!(b>=-1&&b<=3))return false;
    var orc=G.AxGranja&&G.AxGranja.oraculo;
    var bien=orc?orc(qid,b,s.seed):!!e2;
    if(bien===null)return false;
    if(bien){ if(ofertas(s).indexOf(d2)<0)return false; }
    else if(d2)return false;
    s.qUsadas[qid]=1; s.qDisp=false; s.preguntas++; s.proxQ=s.tick+CADA_Q;
    if(bien){
      s.aciertos++; s.mej[d2]++;
      if(d2==="vida")s.vidas++;
      if(d2==="paciencia")s.pedidos.forEach(function(o){if(o.p)o.p.vence+=100;});
      aviso(s,{tipo:"mejora",k:d2});
      gana(s,PREMIO_Q+(d2==="regalo"?60:0));
    }else aviso(s,{tipo:"falla"});
    return true;
  }
  return false;
}

function repite(seed,envio){
  if(!envio||!Array.isArray(envio.a)||envio.a.length>MAX_ACC)return null;
  var s=crea(seed), fin=parseInt(envio.fin,10);
  if(!(fin>=0))fin=DUR; fin=Math.min(fin,DUR);
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
  if(n<acc.length)return null;
  return s;
}

var JUEGO={nom:"Granja Grande",icono:"🏡",orden:"puntos",dur:"8 min",
  desc:"La versión extendida: un mapa que se recorre, 8 fábricas que se mejoran, parcelas que se compran y 12 productos. Ocho minutos; cuenta todo lo que ganes."};
function genera(seed){return {seed:seed>>>0,modo:"grande"};}
function evalua(datos,envio){
  var s=repite(datos.seed,envio); if(!s)return null;
  return {score:s.ganado,seconds:Math.max(1,Math.round(s.tick*TICK/1000)),entregas:s.entregas,perdidos:s.perdidos,nivel:s.nivel,
          preguntas:s.preguntas,aciertos:s.aciertos,gastado:s.gastado};
}

var R=G.AxRapidos;
if(R&&!R.JUEGOS.granja_grande){
  R.JUEGOS.granja_grande=JUEGO;
  var g0=R.genera, e0=R.evalua, f0=R.formato;
  R.genera=function(j,sd,v,p){return j==="granja_grande"?genera(sd):g0(j,sd,v,p);};
  R.evalua=function(j,d,e){return j==="granja_grande"?evalua(d,e):e0(j,d,e);};
  R.formato=function(j,sc,se){return j==="granja_grande"?sc+(sc===1?" moneda":" monedas"):f0(j,sc,se);};
}

G.AxGranjaG={TICK:TICK,DUR:DUR,PARCELAS:PARCELAS,MAX_PARCELAS:MAX_PARCELAS,GRANERO:GRANERO,VIDAS:VIDAS,COMBO_T:COMBO_T,MAQ_MAX:MAQ_MAX,
  CADA_Q:CADA_Q,MAX_Q:MAX_Q,PREMIO_Q:PREMIO_Q,MEJORAS:MEJORAS,ITEMS:ITEMS,CULTIVOS:CULTIVOS,FABRICAS:FABRICAS,NIVELES:NIVELES,ANDENES:ANDENES,
  COSTO_GRANERO:COSTO_GRANERO,costoMaquina:costoMaquina,costoParcela:costoParcela,JUEGO:JUEGO,
  crea:crea,paso:paso,act:act,repite:repite,total:total,hay:hay,puedeEntregar:puedeEntregar,
  nParcelas:nParcelas,capacidad:capacidad,crece:crece,dura:dura,cola:cola,salida:salida,rinde:rinde,ofertas:ofertas,
  genera:genera,evalua:evalua};
})(typeof globalThis!=="undefined"?globalThis:this);
