/* ===========================================================
   THE FINAL TEST · Ciudad Saber · motor
   Un constructor de ciudades en un mundo infinito (generado por una
   semilla) donde cada jugador tiene su ciudad en una «ranura» y los
   demás son sus vecinos. Zonas residenciales, comerciales e
   industriales que crecen solas si tienen carretera, energía, agua,
   servicios y demanda; la cultura amplía el territorio; los problemas
   (apagón, sequía, atasco…) y la investigación se resuelven
   respondiendo preguntas de ingeniería, servicios y cultura general.
   La ciudad atraviesa seis épocas de la historia (se pasa a la siguiente
   con metas y una pregunta de historia) y, cuando su influencia cultural
   toca la de una vecina, se encuentran y pueden firmar un tratado.
   Redes: la electricidad y el agua llegan solo a lo que está conectado a
   una central o a una bomba. Las zonas y los edificios contiguos se pasan
   el servicio; para cruzar calles o campo hacen falta tendido eléctrico
   (sobre la superficie) y tuberías (bajo tierra).

   Determinista: el navegador guarda las acciones de cada tramo de
   juego y el servidor lo repite desde el estado guardado, con la
   semilla del tramo, comprobando las respuestas con su banco
   (AxCiudad.oraculo). Lo usan el navegador y el Worker.
   =========================================================== */
(function(G){
"use strict";

var TICK=500;                 /* ms por paso de simulación */
var R=30, LADO=2*R+1, N=LADO*LADO;   /* el territorio máximo: 61×61 alrededor del centro */
var SEPARA=72;                /* distancia entre ciudades vecinas */
var MES=20;                   /* cada 10 s se cobran impuestos y gastos */
var MAX_SEG=1200, MAX_ACC=4000;      /* un tramo: hasta 10 min de juego y 4000 acciones */

/* ---------- azar reproducible ---------- */
function semilla(txt){var h=0x811c9dc5,i;txt=String(txt);for(i=0;i<txt.length;i++){h^=txt.charCodeAt(i);h=Math.imul(h,0x01000193);}return h>>>0;}
function rng(s){var a=s>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};}
function hash2(seed,x,y){var h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(seed|0,1442695041);
  h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967296;}

/* ---------- el mundo: terreno infinito ---------- */
function ruido(seed,x,y,esc){
  var gx=Math.floor(x/esc), gy=Math.floor(y/esc), fx=x/esc-gx, fy=y/esc-gy;
  var a=hash2(seed,gx,gy), b=hash2(seed,gx+1,gy), c=hash2(seed,gx,gy+1), d=hash2(seed,gx+1,gy+1);
  var ux=fx*fx*(3-2*fx), uy=fy*fy*(3-2*fy);
  return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy;
}
/* centro de la ranura k: una espiral de ciudades separadas */
function centroSlot(k){
  if(k===0)return {x:0,y:0};
  var x=0,y=0,dx=1,dy=0,paso=1,n=0,veces=0;
  while(true){for(var i=0;i<paso;i++){x+=dx;y+=dy;n++;if(n===k)return {x:x*SEPARA,y:y*SEPARA};}
    var t=dx;dx=-dy;dy=t;veces++;if(veces%2===0)paso++;}
}
/* «g» pasto, «w» agua, «f» bosque. Junto al centro de cada ranura siempre hay tierra y un lago cerca */
function terreno(seed,x,y){
  var sx=Math.round(x/SEPARA)*SEPARA, sy=Math.round(y/SEPARA)*SEPARA, dc=Math.max(Math.abs(x-sx),Math.abs(y-sy));
  var lago=ruido(seed,x,y,9)*0.65+ruido(seed+7,x,y,4)*0.35;
  if(dc<=5)return "g";
  var lx=sx+9, ly=sy-8;                       /* un lago pequeño garantizado cerca de cada ciudad */
  if((x-lx)*(x-lx)+(y-ly)*(y-ly)<=6)return "w";
  if(lago<0.27)return "w";
  var bosque=ruido(seed+31,x,y,6);
  if(bosque>0.7)return "f";
  return "g";
}

/* ---------- recursos estratégicos: yacimientos fijos del mundo ----------
   Vetas que salen de la semilla del mundo (las mismas para todos). Junto a cada ciudad hay siempre piedra y hierro
   a mano, carbón y petróleo un poco más lejos y litio en un salar junto al lago. El oro es raro. */
var RECURSOS={
  piedra:  {nom:"Piedra",   ico:"🪨", era:0, precio:5,  prod:8, consumo:2, ciclo:9,  color:"#9e9e9e", bono:"Construir cuesta un 10 % menos."},
  oro:     {nom:"Oro",      ico:"🥇", era:0, precio:55, prod:1, consumo:0, ciclo:13, color:"#f2c94c", aereo:true, bono:"Con 20 o más en reserva, la calificación crediticia mejora un escalón."},
  hierro:  {nom:"Hierro",   ico:"⛓️", era:1, precio:12, prod:5, consumo:3, ciclo:8,  color:"#a0522d", bono:"La industria rinde un 20 % más."},
  carbon:  {nom:"Carbón",   ico:"⚫", era:3, precio:10, prod:6, consumo:3, ciclo:7,  color:"#2b2b2b", bono:"Las centrales térmicas dan un 25 % más de energía."},
  petroleo:{nom:"Petróleo", ico:"🛢️", era:3, precio:24, prod:4, consumo:2, ciclo:6,  color:"#141414", bono:"El comercio rinde un 10 % más (transporte y combustible)."},
  litio:   {nom:"Litio",    ico:"🔋", era:5, precio:42, prod:3, consumo:1, ciclo:10, color:"#dff3f2", aereo:true, bono:"Las plantas solares y eólicas dan un 30 % más (baterías)."}
};
var RORDEN=["oro","litio","petroleo","carbon","hierro","piedra"];
var RVETA={oro:[3,0.92,0.3,101],litio:[4,0.9,0.5,103],petroleo:[6,0.9,0.4,107],carbon:[5,0.87,0.5,109],hierro:[4,0.86,0.5,113],piedra:[5,0.83,0.5,127]};   /* escala, umbral, densidad, semilla */
var RFIJO={"-4,4":"piedra","-5,4":"piedra","-4,5":"piedra","5,4":"hierro","5,3":"hierro","-8,-5":"carbon","-9,-5":"carbon","-3,-9":"petroleo","11,-6":"litio","12,-6":"litio"};
function yacimiento(seed,x,y){
  if(terreno(seed,x,y)==="w")return null;
  var sx=Math.round(x/SEPARA)*SEPARA, sy=Math.round(y/SEPARA)*SEPARA, f=RFIJO[(x-sx)+","+(y-sy)];
  if(f)return f;
  if(Math.max(Math.abs(x-sx),Math.abs(y-sy))<=3)return null;      /* el centro de cada ranura queda libre para la ciudad */
  for(var k=0;k<RORDEN.length;k++){ var r=RORDEN[k], v=RVETA[r];
    if(ruido(seed+v[3],x,y,v[0])>v[1]&&hash2(seed+v[3]*3,x,y)<v[2])return r; }
  return null;
}

/* ---------- lo que se construye ---------- */
var EDIF={
  c:{nom:"Carretera",      costo:10,  mant:0,   grupo:"vias", era:0},
  R:{nom:"Residencial",    costo:20,  mant:0,   grupo:"zonas", zona:true, era:0},
  C:{nom:"Comercial",      costo:25,  mant:0,   grupo:"zonas", zona:true, era:0},
  I:{nom:"Industrial",     costo:25,  mant:0,   grupo:"zonas", zona:true, era:0},
  e:{nom:"Central térmica",costo:700, mant:6,   grupo:"energia", mw:40, cont:6, rcont:6, era:3},
  w:{nom:"Parque eólico",  costo:450, mant:3,   grupo:"energia", mw:12, tech:"eolica", era:4},
  s:{nom:"Planta solar",   costo:550, mant:3,   grupo:"energia", mw:16, tech:"solar", era:4},
  h:{nom:"Hidroeléctrica", costo:1100,mant:6,   grupo:"energia", mw:60, tech:"hidro", junto:"w", era:3},
  b:{nom:"Pozo y bomba",   costo:300, mant:2,   grupo:"agua", agua:40, era:0},
  d:{nom:"Depuradora",     costo:700, mant:4,   grupo:"agua", agua:80, tech:"depuracion", limpia:true, era:3},
  p:{nom:"Policía",        costo:400, mant:4,   grupo:"servicios", radio:9,  srv:"seg", era:0},
  f:{nom:"Bomberos",       costo:400, mant:4,   grupo:"servicios", radio:9,  srv:"fue", era:1},
  H:{nom:"Hospital",       costo:650, mant:6,   grupo:"servicios", radio:10, srv:"sal", era:1},
  k:{nom:"Escuela",        costo:450, mant:4,   grupo:"servicios", radio:9,  srv:"edu", era:1},
  u:{nom:"Universidad",    costo:1600,mant:8,   grupo:"cultura", radio:14, srv:"edu", cultura:4, tech:"superior", era:1},
  L:{nom:"Biblioteca",     costo:350, mant:2,   grupo:"cultura", radio:7, cultura:1, era:0},
  M:{nom:"Museo",          costo:900, mant:4,   grupo:"cultura", radio:8, cultura:3, tech:"museos", feliz:3, era:2},
  T:{nom:"Teatro",         costo:750, mant:4,   grupo:"cultura", radio:8, cultura:2, tech:"artes", feliz:4, era:0},
  P:{nom:"Parque",         costo:80,  mant:0.4, grupo:"cultura", radio:3, feliz:6, limpia2:2, era:0},
  Z:{nom:"Plaza",          costo:160, mant:0.6, grupo:"cultura", radio:4, feliz:4, cultura:0.5, era:0},
  O:{nom:"Monumento",      costo:3000,mant:6,   grupo:"cultura", radio:12, feliz:8, cultura:8, tech:"patrimonio", era:2},
  m:{nom:"Mina",           costo:600, mant:4,   grupo:"recursos", cont:3, rcont:3, emp:15, era:0},
  K:{nom:"Puerto",         costo:1800,mant:8,   grupo:"recursos", junto:"w", emp:20, carga:30, era:1},
  A:{nom:"Aeropuerto",     costo:6000,mant:24,  grupo:"recursos", cont:2, rcont:4, emp:40, carga:80, era:4},
  X:{nom:"Cuartel",        costo:2500,mant:14,  grupo:"servicios", radio:14, srv:"seg", emp:10, orden:30, era:1}
};
/* por nivel de desarrollo (0 = zona vacía) */
var POB=[0,8,25,60,120], EMPC=[0,5,15,35,70], EMPI=[0,8,20,40,60];
var MW_R=[0,1,2,4,7], MW_C=[0,1,3,5,8], MW_I=[0,2,4,7,10], AG_R=[0,1,2,4,7], AG_C=[0,0.5,1,2,4], AG_I=[0,1,2,3,4];

/* tecnologías: se investigan respondiendo bien una pregunta de su tema */
var TECHS={
  eolica:   {nom:"Energía eólica",       tema:"energia",    desc:"Desbloquea el parque eólico (12 MW, sin contaminar).", era:4},
  solar:    {nom:"Energía solar",        tema:"energia",    desc:"Desbloquea la planta solar (16 MW, sin contaminar).", req:["eolica"], era:4},
  hidro:    {nom:"Hidroeléctrica",       tema:"ingenieria", desc:"Desbloquea la central hidroeléctrica (60 MW) junto al agua.", era:3},
  depuracion:{nom:"Depuración de agua",  tema:"agua",       desc:"Desbloquea la depuradora: más agua y menos contaminación.", era:3},
  superior: {nom:"Educación superior",   tema:"educacion",  desc:"Desbloquea la universidad (cultura y educación).", era:1},
  museos:   {nom:"Museos",               tema:"cultura",    desc:"Desbloquea el museo (+3 de cultura).", era:2},
  artes:    {nom:"Artes escénicas",      tema:"cultura",    desc:"Desbloquea el teatro (+2 de cultura, felicidad).", era:0},
  patrimonio:{nom:"Patrimonio",          tema:"cultura",    desc:"Desbloquea el monumento (+8 de cultura).", req:["museos","artes","superior"], era:2},
  transporte:{nom:"Transporte eficiente",tema:"transporte", desc:"Carreteras a mitad de precio y menos atascos.", era:3},
  rascacielos:{nom:"Rascacielos",        tema:"urbanismo",  desc:"Las zonas pueden llegar al nivel 4.", req:["superior"], era:4},
  reciclaje:{nom:"Reciclaje",            tema:"ambiente",   desc:"Un 30 % menos de contaminación.", era:4},
  salud:    {nom:"Salud pública",        tema:"salud",      desc:"Hospitales con más alcance y menos enfermedades.", era:1},
  fiscal:   {nom:"Impuestos inteligentes",tema:"economia",  desc:"Un 10 % más de recaudación.", era:2},
  logistica:{nom:"Comercio internacional",tema:"economia",  desc:"Un 25 % más de capacidad de exportación y mejores precios.", era:2},
  mineria:  {nom:"Minería moderna",      tema:"ingenieria", desc:"Las minas producen un 30 % más.", era:3},
  dialogo:  {nom:"Mediación social",     tema:"civica",     desc:"El malestar baja más rápido y los acuerdos duran más.", era:2}
};
/* problemas que aparecen según lo que le falta a la ciudad */
var PROBLEMAS={
  apagon:  {nom:"Apagón",              tema:"energia",    desc:"Hay zonas sin electricidad: falta generación o conexión a la red.", era:3},
  sequia:  {nom:"Falta de agua",       tema:"agua",       desc:"Hay zonas sin agua: faltan bombas o tuberías que lleguen."},
  smog:    {nom:"Contaminación",       tema:"ambiente",   desc:"El aire está contaminado cerca de la industria.", era:3},
  incendio:{nom:"Incendio",            tema:"seguridad",  desc:"Un incendio amenaza un barrio sin bomberos.", era:1},
  crimen:  {nom:"Inseguridad",         tema:"seguridad",  desc:"Hay barrios sin cobertura de policía."},
  atasco:  {nom:"Atasco",              tema:"transporte", desc:"Las calles no dan abasto para tanta gente."},
  crisis:  {nom:"Crisis de caja",      tema:"economia",   desc:"La ciudad está gastando más de lo que recauda."},
  epidemia:{nom:"Brote de gripe",      tema:"salud",      desc:"Faltan hospitales cerca de la gente.", era:1},
  escuela: {nom:"Falta de escuelas",   tema:"educacion",  desc:"Muchos niños no tienen escuela cerca.", era:1},
  puente:  {nom:"Puente dañado",       tema:"ingenieria", desc:"Una estructura necesita una evaluación técnica."},
  plan:    {nom:"Plan urbano",         tema:"urbanismo",  desc:"El concejo pide una decisión de urbanismo."},
  feria:   {nom:"Feria cultural",      tema:"cultura",    desc:"¡Oportunidad! Una feria puede atraer visitantes."},
  protesta:{nom:"Protesta ciudadana",  tema:"civica",     desc:"La gente sale a la calle a reclamar: el comercio vende menos.", disc:true},
  huelga:  {nom:"Huelga general",      tema:"economia",   desc:"Paran fábricas y minas: producen la mitad mientras dure.", disc:true, era:3},
  disturbios:{nom:"Disturbios",        tema:"seguridad",  desc:"El malestar desborda: si no se calma, se dañan edificios.", disc:true}
};
var TEMAS={energia:"Energía",agua:"Agua",transporte:"Transporte",urbanismo:"Urbanismo",ambiente:"Ambiente",salud:"Salud",
           seguridad:"Seguridad",educacion:"Educación",economia:"Economía",cultura:"Cultura",ingenieria:"Ingeniería",historia:"Historia",civica:"Cívica"};
/* las épocas: cada una sube el nivel máximo de las zonas y desbloquea edificios y tecnologías.
   Para pasar a la siguiente hay que llegar a sus metas y acertar una pregunta de historia.
   Antes de la Revolución Industrial no hace falta electricidad. */
var ERAS=[
  {k:"antigua",     nom:"Antigüedad",            ico:"🏺", tope:1},
  {k:"media",       nom:"Edad Media",            ico:"🏰", tope:2, pob:60,   cul:8,   con:1},
  {k:"renacimiento",nom:"Renacimiento",          ico:"🎨", tope:3, pob:200,  cul:40,  con:3},
  {k:"industrial",  nom:"Revolución Industrial", ico:"🏭", tope:3, pob:450,  cul:100, con:6},
  {k:"moderna",     nom:"Era Moderna",           ico:"🏙️", tope:4, pob:900,  cul:220, con:10},
  {k:"digital",     nom:"Era Digital",           ico:"💻", tope:4, pob:1800, cul:420, con:15}
];
var INFLU=7;
var COSTO_RED={e:5,a:8};      /* tendido eléctrico y tubería, por casilla */                  /* cada época lleva la influencia cultural 7 casillas más lejos */

/* ---------- estado ---------- */
function idx(dx,dy){return (dx+R)*LADO+(dy+R);}
function crea(mseed,slot,nombre){
  var c=centroSlot(slot);
  return {v:1,mseed:mseed>>>0,slot:slot,cx:c.x,cy:c.y,nombre:String(nombre||"Mi ciudad").slice(0,30),
    tick:0,dinero:6000,impuesto:10,cultura:0,conocimiento:0,preguntas:0,temas:{},techs:{},techCool:{},
    tipo:new Array(N).fill(""),nivel:new Array(N).fill(0),
    problemas:[],nextProb:1,resueltos:0,fallidos:0,bonoMW:0,bonoAgua:0,bonoLimpio:0,bonoFeliz:0,bonoFelizHasta:0,
    era:0,eraCool:0,contactos:[],tratados:{},tratCool:{},
    cable:new Array(N).fill(0),tubo:new Array(N).fill(0),redes:1,
    qUsadas:{},est:null,seg:0,segTick:0};
}
/* las capas de redes se guardan como la lista de casillas que tienen tendido o tubería */
function aLista(a){var o=[];for(var i=0;i<N;i++)if(a[i])o.push(i);return o;}
function deLista(l){var a=new Array(N).fill(0);(l||[]).forEach(function(i){if(i>=0&&i<N)a[i]=1;});return a;}
function serializa(s){
  var o={}, k;
  for(k in s)if(k!=="ev"&&k!=="r"&&k!=="cache"&&k!=="est")o[k]=s[k];
  o.tipo=s.tipo.map(function(t){return t||".";}).join(""); o.nivel=s.nivel.join("");
  o.cable=aLista(s.cable||[]); o.tubo=aLista(s.tubo||[]);
  return JSON.stringify(o);
}
function deserializa(txt,seg){
  var o=typeof txt==="string"?JSON.parse(txt):JSON.parse(JSON.stringify(txt));
  /* ciudades de antes de las épocas: industriales si ya tenían centrales, si no, de la Antigüedad */
  if(o.era==null){o.era=/[ewsh]/.test(o.tipo)?3:0; o.eraCool=0; o.contactos=[]; o.tratados={}; o.tratCool={};}
  o.tipo=o.tipo.split("").map(function(c){return c==="."?"":c;}); o.nivel=o.nivel.split("").map(Number);
  /* ciudades de antes de las redes: tuberías bajo todas sus calles (y tendido, si ya tenían electricidad), para que nada se corte */
  if(!o.redes){ o.tubo=o.tipo.map(function(t){return t==="c"?1:0;}); o.cable=o.tipo.map(function(t){return t==="c"&&o.era>=3?1:0;}); o.redes=1; }
  else{ o.cable=deLista(o.cable); o.tubo=deLista(o.tubo); }
  /* cada tramo empieza de cero sus preguntas usadas (las opciones se barajan por tramo) */
  o.seg=seg>>>0; o.segTick=0; o.r=rng(o.seg); o.ev=[]; o.cache=null; o.est=null; o.qUsadas={};
  return o;
}
function aviso(s,e){if(s.ev)s.ev.push(e);}

/* territorio: crece con la cultura; la influencia llega más lejos con cada época */
function radio(s){return Math.min(R,7+Math.floor(Math.sqrt(s.cultura/3)));}
function influencia(s){return radio(s)+INFLU*(s.era||0);}
function rutas(s){return Object.keys(s.tratados||{}).length;}
function tope(s){return Math.min(ERAS[s.era].tope,s.techs.rascacielos?4:3);}
/* lo que falta para pasar a la época n */
function requisitos(s,n){
  var E=ERAS[n]; if(!E||n!==s.era+1)return null;
  var st=s.est||calcula(s);
  return [{k:"pob",nom:"Habitantes",v:st.pob,meta:E.pob},{k:"cul",nom:"Cultura",v:Math.floor(s.cultura),meta:E.cul},{k:"con",nom:"Aciertos",v:s.conocimiento,meta:E.con}]
    .map(function(x){x.ok=x.v>=x.meta;return x;});
}
function dentro(s,dx,dy){var r=radio(s);return dx*dx+dy*dy<=r*r&&Math.abs(dx)<=R&&Math.abs(dy)<=R;}
function terr(s,dx,dy){return terreno(s.mseed,s.cx+dx,s.cy+dy);}

/* ---------- cálculo de la ciudad ----------
   mapas(): coberturas de servicios, felicidad de parques y contaminación. Es lo caro, así
   que solo se rehace cuando cambia algo de lo que depende (s.cache=null): construir,
   demoler, investigar, un premio de limpieza o que una industria cambie de nivel. Así el
   resultado es siempre función del estado actual (el servidor lo repite igual).
   totales(): población, empleos, energía, agua, demanda y felicidad, en cada paso. */
function mapas(s){
  if(s.cache)return s.cache;
  var cov={seg:new Uint8Array(N),fue:new Uint8Array(N),sal:new Uint8Array(N),edu:new Uint8Array(N)}, feliz=new Float32Array(N), cont=new Float32Array(N);
  var i, dx, dy, t, e, l, limpia=0;
  for(i=0;i<N;i++){t=s.tipo[i]; if(!t||t==="c"||t==="R"||t==="C")continue; e=EDIF[t]; l=s.nivel[i]; dx=Math.floor(i/LADO)-R; dy=i%LADO-R;
    if(t==="I"){if(l)marca(cont,dx,dy,3,l);continue;}
    if(e.cont)marca(cont,dx,dy,e.rcont,e.cont);
    if(e.limpia)limpia++;
    var rad=e.radio?e.radio+(t==="H"&&s.techs.salud?3:0):0;
    if(e.srv)marca(cov[e.srv],dx,dy,rad,1);
    if(e.feliz)marca(feliz,dx,dy,rad,e.feliz);
    if(e.limpia2)marca(cont,dx,dy,rad,-e.limpia2);
  }
  var factor=(s.techs.reciclaje?0.7:1)*(limpia?0.85:1)*(1-0.1*s.bonoLimpio);
  for(i=0;i<N;i++)cont[i]=Math.max(0,cont[i]*factor);
  /* las casillas ocupadas y las residenciales: los recorridos de cada paso van solo por ellas */
  var occ=[], res=[];
  for(i=0;i<N;i++){t=s.tipo[i]; if(!t)continue; occ.push(i); if(t==="R")res.push(i);}
  /* las redes: qué casillas quedan unidas (lo construido conduce; las calles y el campo, solo con tendido o tubería) */
  var tipo=s.tipo, cable=s.cable, tubo=s.tubo;
  var redE=componentes(function(i){return cable[i]||(tipo[i]&&tipo[i]!=="c");});
  var redA=componentes(function(i){return tubo[i]||(tipo[i]&&tipo[i]!=="c");});
  /* el valor del suelo de las zonas residenciales y comerciales: lo suben los parques y la cultura, los servicios,
     el aire limpio y tener agua cerca; lo baja la contaminación. Con valor alto, el barrio se vuelve acomodado */
  var valor=new Float32Array(N);
  for(var k2=0;k2<occ.length;k2++){ i=occ[k2]; t=tipo[i]; if(t!=="R"&&t!=="C")continue;
    dx=Math.floor(i/LADO)-R; dy=i%LADO-R;
    var v=0.3+Math.min(0.3,feliz[i]*0.025)+0.07*((cov.seg[i]?1:0)+(cov.sal[i]?1:0)+(cov.edu[i]?1:0))-Math.min(0.45,cont[i]*0.09);
    var agua=false; for(var ax=-2;ax<=2&&!agua;ax++)for(var ay=-2;ay<=2;ay++){ if(Math.abs(ax)+Math.abs(ay)>2)continue; if(terr(s,dx+ax,dy+ay)==="w"){agua=true;break;} }
    if(agua)v+=0.12;
    valor[i]=Math.max(0,Math.min(1,v));
  }
  return s.cache={cov:cov,feliz:feliz,cont:cont,occ:occ,res:res,redE:redE,redA:redA,valor:valor};
}
/* grupos de casillas unidas en cruz que cumplen cond (recorrido determinista, de la casilla 0 a la N−1) */
function componentes(cond){
  var comp=new Int16Array(N).fill(-1), n=0, pila=[], i0, i;
  for(i0=0;i0<N;i0++){
    if(comp[i0]>=0||!cond(i0))continue;
    comp[i0]=n; pila.push(i0);
    while(pila.length){
      i=pila.pop(); var x=Math.floor(i/LADO), y=i%LADO;
      if(x>0&&comp[i-LADO]<0&&cond(i-LADO)){comp[i-LADO]=n;pila.push(i-LADO);}
      if(x<LADO-1&&comp[i+LADO]<0&&cond(i+LADO)){comp[i+LADO]=n;pila.push(i+LADO);}
      if(y>0&&comp[i-1]<0&&cond(i-1)){comp[i-1]=n;pila.push(i-1);}
      if(y<LADO-1&&comp[i+1]<0&&cond(i+1)){comp[i+1]=n;pila.push(i+1);}
    }
    n++;
  }
  return {comp:comp,n:n};
}
/* 0 popular, 1 clase media, 2 acomodado (o comercio de lujo) */
var RIQ_R=[1,1.2,1.45], RIQ_C=[1,1.25,1.6];
function riqueza(v){return v<0.42?0:v<0.66?1:2;}
function calcula(s){
  var m=mapas(s), cov=m.cov, i, t, e, l, k, occ=m.occ, res=m.res;
  var st={pob:0,empC:0,empI:0,pobPond:0,empCPond:0,pobRica:0,puertos:0,aero:0,cuartel:0,minas:0,mwCap:s.bonoMW,mwUso:0,agCap:s.bonoAgua,agUso:0,calles:0,mant:0,cultura:0,edif:0,R:0,C:0,I:0};
  var cE=m.redE.comp, cA=m.redA.comp, useE=new Float64Array(m.redE.n), capE=new Float64Array(m.redE.n), useA=new Float64Array(m.redA.n), capA=new Float64Array(m.redA.n), u;
  for(k=0;k<occ.length;k++){i=occ[k]; t=s.tipo[i]; e=EDIF[t]; l=s.nivel[i];
    st.mant+=e.mant;
    if(t==="c"){st.calles++;continue;}
    if(t==="R"){st.pob+=POB[l]; var rq=riqueza(m.valor[i]); st.pobPond+=POB[l]*RIQ_R[rq]; if(rq===2)st.pobRica+=POB[l];u=MW_R[l];st.mwUso+=u;useE[cE[i]]+=u;u=AG_R[l];st.agUso+=u;useA[cA[i]]+=u;st.R++;continue;}
    if(t==="C"){st.empC+=EMPC[l]; st.empCPond+=EMPC[l]*RIQ_C[riqueza(m.valor[i])];u=MW_C[l];st.mwUso+=u;useE[cE[i]]+=u;u=AG_C[l];st.agUso+=u;useA[cA[i]]+=u;st.C++;continue;}
    if(t==="I"){st.empI+=EMPI[l];u=MW_I[l];st.mwUso+=u;useE[cE[i]]+=u;u=AG_I[l];st.agUso+=u;useA[cA[i]]+=u;st.I++;continue;}
    st.edif++;
    if(e.emp)st.empI+=e.emp;
    if(t==="K")st.puertos++; else if(t==="A")st.aero++; else if(t==="X")st.cuartel++; else if(t==="m")st.minas++;
    if(e.mw){var mw=e.mw*(t==="e"&&activo(s,"carbon")?1.25:(t==="w"||t==="s")&&activo(s,"litio")?1.3:1); st.mwCap+=mw;capE[cE[i]]+=mw;} else {st.mwUso+=1;useE[cE[i]]+=1;}
    if(e.agua){st.agCap+=e.agua;capA[cA[i]]+=e.agua;} else {st.agUso+=0.5;useA[cA[i]]+=0.5;}
    if(e.cultura)st.cultura+=e.cultura;
  }
  st.sinLuz=s.era<3;
  /* cada red reparte lo que generan sus centrales (o bombas) entre lo que tiene conectado; las ayudas (bonoMW, bonoAgua)
     se reparten entre todas según lo que consume cada una. Una red sin centrales solo recibe su parte de la ayuda */
  function reparte(use,cap,bono,total){
    var r=new Float32Array(use.length), peor=1;
    for(var c=0;c<use.length;c++){ r[c]=use[c]>0?Math.min(1,(cap[c]+(total>0?bono*use[c]/total:0))/use[c]):1; if(use[c]>0&&r[c]<peor)peor=r[c]; }
    return {r:r,peor:peor};
  }
  var rE=reparte(useE,capE,s.bonoMW,st.mwUso-0), rA=reparte(useA,capA,s.bonoAgua,st.agUso);
  if(st.sinLuz){for(var c0=0;c0<rE.r.length;c0++)rE.r[c0]=1; rE.peor=1;}
  st.redE=rE.r; st.redA=rA.r;
  st.ratioMW=rE.peor; st.ratioAg=rA.peor;
  /* cuántas zonas o edificios quedan sin servicio por falta de red */
  st.sinRedE=0; st.sinRedA=0;
  for(k=0;k<occ.length;k++){i=occ[k]; t=s.tipo[i]; if(t==="c"||(EDIF[t].mw)||(EDIF[t].agua))continue;
    if(!st.sinLuz&&rE.r[cE[i]]<0.95)st.sinRedE++; if(rA.r[cA[i]]<0.95&&(s.nivel[i]||!EDIF[t].zona))st.sinRedA++;}
  /* demanda RCI */
  var trab=st.pob*0.6, emp=st.empC+st.empI;
  st.demR=Math.round(emp-trab+12); st.demC=Math.round(st.pob*0.25-st.empC+2+4*rutas(s)+10*Math.min(1,st.aero)); st.demI=Math.round(st.pob*0.3-st.empI+6);
  /* felicidad: promedio en las zonas residenciales, pesado por población */
  var suma=0, peso=0, cubiertos={seg:0,fue:0,sal:0,edu:0}, contMedia=0;
  for(k=0;k<res.length;k++){ i=res[k]; if(!s.nivel[i])continue; var w=POB[s.nivel[i]];
    var srv=(cov.seg[i]?1:0)+(cov.fue[i]?1:0)+(cov.sal[i]?1:0)+(cov.edu[i]?1:0);
    if(cov.seg[i])cubiertos.seg+=w; if(cov.fue[i])cubiertos.fue+=w; if(cov.sal[i])cubiertos.sal+=w; if(cov.edu[i])cubiertos.edu+=w;
    var f=50+6*srv+Math.min(15,m.feliz[i])-4*m.cont[i]-(st.redE[cE[i]]<1?15:0)-(st.redA[cA[i]]<1?10:0)-3*(s.impuesto-10);
    suma+=Math.max(0,Math.min(100,f))*w; peso+=w; contMedia+=m.cont[i]*w;}
  var penal=5*s.problemas.length+(s.tick<s.bonoFelizHasta?-s.bonoFeliz:0)+(st.cuartel?2:0);   /* un cuartel en la ciudad inquieta un poco */
  st.felicidad=peso?Math.max(0,Math.min(100,Math.round(suma/peso-penal))):50;
  st.cob={seg:peso?cubiertos.seg/peso:1,fue:peso?cubiertos.fue/peso:1,sal:peso?cubiertos.sal/peso:1,edu:peso?cubiertos.edu/peso:1};
  st.contMedia=peso?contMedia/peso:0;
  s.est=st;
  return st;
}
function marca(arr,cx,cy,r,v){
  for(var dx=-r;dx<=r;dx++)for(var dy=-r;dy<=r;dy++){ if(dx*dx+dy*dy>r*r)continue;
    var x=cx+dx, y=cy+dy; if(x<-R||x>R||y<-R||y>R)continue; arr[idx(x,y)]+=v; }
}
function calle(s,dx,dy){
  var t=s.tipo, i=idx(dx,dy);
  return (dx<R&&t[i+LADO]==="c")||(dx>-R&&t[i-LADO]==="c")||(dy<R&&t[i+1]==="c")||(dy>-R&&t[i-1]==="c");
}
function puntaje(s){var st=s.est||calcula(s); return Math.round(st.pob*(0.5+st.felicidad/100)+s.conocimiento*30+s.cultura+200*(s.era||0));}

/* ---------- un paso de simulación (0,5 s) ---------- */
function paso(s){
  s.tick++; s.segTick++;
  var st=calcula(s), i, t, l, cache=s.cache, cambiaI=false;
  /* las zonas crecen o decaen (cada casilla se revisa uno de cada 6 pasos) */
  var tp=tope(s);
  for(i=(s.tick%6);i<N;i+=6){
    t=s.tipo[i]; if(t!=="R"&&t!=="C"&&t!=="I")continue;
    l=s.nivel[i]; var dx=Math.floor(i/LADO)-R, dy=i%LADO-R;
    var conCalle=calle(s,dx,dy), azar=hash2(s.mseed^s.tick,dx,dy);
    var srv=(cache.cov.seg[i]?1:0)+(cache.cov.fue[i]?1:0)+(cache.cov.sal[i]?1:0)+(cache.cov.edu[i]?1:0);
    var des=2+Math.min(6,cache.feliz[i]/3)+srv-cache.cont[i]*(t==="I"?0.2:1)-(s.impuesto-10)*0.3;
    var max=des<2?1:des<4?2:(cache.cov.edu[i]||t==="I"?3:2); if(max===3&&des>=6&&tp===4)max=4; if(max>tp)max=tp;
    var dem=t==="R"?st.demR:t==="C"?st.demC:st.demI;
    var rE=st.redE[cache.redE.comp[i]], rA=st.redA[cache.redA.comp[i]];
    var luz=rE>=0.95&&(l<1||rA>=0.95);
    if(conCalle&&luz&&dem>0&&l<max&&azar<0.35){s.nivel[i]=l+1; if(t==="I")cambiaI=true; aviso(s,{tipo:"crece",i:i,l:l+1});}
    else if(l>0&&(!conCalle||(!st.sinLuz&&rE<0.7)||l>max)&&azar<0.2){s.nivel[i]=l-1; if(t==="I")cambiaI=true; aviso(s,{tipo:"decae",i:i});}
  }
  if(cambiaI)s.cache=null;
  /* cultura y economía */
  s.cultura+=st.cultura*0.1+st.pob/5000+0.05*rutas(s);
  if(s.tick%MES===0){
    var ing=ingresos(s,st), gas=st.mant+st.calles*0.02, pg=pagaDeuda(s);
    s.dinero=Math.round((s.dinero+ing-gas-pg.tot)*100)/100;
    /* si después de pagar la deuda la caja queda en rojo, el banco lo anota como impago: la calificación baja un año */
    if(pg.tot>0&&s.dinero<0){s.impagos=(s.impagos||0)+1; s.impagoHasta=s.tick+12*MES; aviso(s,{tipo:"impago"});}
    var ex=mesRecursos(s,st);
    aviso(s,{tipo:"mes",ing:ing,gas:gas,deuda:pg.tot,intereses:pg.int,exp:ex.ingreso,u:ex.unidades});
    malestarMes(s,st);
  }
  /* problemas: vencen o aparecen */
  s.problemas=s.problemas.filter(function(p){
    if(s.tick<p.vence)return true;
    s.fallidos++; s.dinero-=300; s.bonoFeliz=-8; s.bonoFelizHasta=s.tick+120;
    if(p.k==="incendio"&&p.i>=0&&s.tipo[p.i]){s.nivel[p.i]=0;s.cache=null;}
    if(PROBLEMAS[p.k].disc){ s.malestar=Math.min(100,(s.malestar||0)+5);
      if(p.k==="disturbios"){ var zon=[]; for(var q=0;q<N;q++)if((s.tipo[q]==="R"||s.tipo[q]==="C")&&s.nivel[q]>0)zon.push(q);
        for(var z=0;z<3&&zon.length;z++){var w=zon.splice(Math.floor(s.r()*zon.length),1)[0]; s.nivel[w]--;} s.dinero-=200; s.cache=null; } }
    aviso(s,{tipo:"vence",k:p.k}); return false;
  });
  if(s.segTick%120===60&&s.problemas.length<2)nuevoProblema(s,st);
}
function nuevoProblema(s,st){
  var cand=[];
  if(st.pob>=40){
    if(st.ratioMW<1)cand.push("apagon"); if(st.ratioAg<1)cand.push("sequia");
    if(st.contMedia>1.5)cand.push("smog"); if(st.cob.fue<0.6)cand.push("incendio"); if(st.cob.seg<0.6)cand.push("crimen");
    if(st.calles*(s.techs.transporte?60:30)<st.pob)cand.push("atasco"); if(s.dinero<0)cand.push("crisis");
    if(st.cob.sal<0.5)cand.push("epidemia"); if(st.cob.edu<0.5)cand.push("escuela");
  }
  cand.push(["puente","plan","feria"][Math.floor(s.r()*3)]);
  cand=cand.filter(function(k){return (PROBLEMAS[k].era||0)<=s.era;});
  var k=cand[Math.floor(s.r()*cand.length)];
  if(s.problemas.some(function(p){return p.k===k;}))return;
  var objetivo=-1;
  if(k==="incendio"){ var m=mapas(s); for(var i=0;i<N;i++)if(s.tipo[i]==="R"&&s.nivel[i]>0&&!m.cov.fue[i]){objetivo=i;break;} }
  var p={id:s.nextProb++,k:k,desde:s.tick,vence:s.tick+120,i:objetivo,intentos:0};
  s.problemas.push(p); aviso(s,{tipo:"problema",p:p});
}
function premio(s,k){
  /* calmar el malestar dialogando: baja de verdad, y la gente queda más contenta */
  if(PROBLEMAS[k].disc){ s.malestar=Math.max(0,(s.malestar||0)-(k==="disturbios"?30:k==="huelga"?22:25)*(s.techs.dialogo?1.3:1)); s.bonoFeliz=6; s.bonoFelizHasta=s.tick+240; return; }
  if(k==="apagon")s.bonoMW+=10; else if(k==="sequia")s.bonoAgua+=15; else if(k==="smog"){s.bonoLimpio=Math.min(3,s.bonoLimpio+1);s.cache=null;}
  else if(k==="feria")s.cultura+=15; else{ s.bonoFeliz=6; s.bonoFelizHasta=s.tick+240; }
  s.dinero+=400;
}

/* ---------- recursos y comercio exterior ----------
   Cada mina saca cada mes lo que da su yacimiento. Lo que se guarda en «reserva estratégica» da un bono mientras
   haya existencias (y se gasta un poco cada mes); lo demás se exporta solo, hasta la capacidad de exportación,
   al precio del mercado, que sube y baja. Puertos y aeropuertos exportan mucho más; el aeropuerto paga mejor el
   oro y el litio (carga aérea), y cada ruta comercial con una vecina abre mercado. */
function hayProblema(s,k){for(var i=0;i<s.problemas.length;i++)if(s.problemas[i].k===k)return true; return false;}
function activo(s,r){ if(!s.reserva||!s.reserva[r]||!s.stock)return false; var q=s.stock[r]||0; return r==="oro"?q>=20:q>=RECURSOS[r].consumo; }
function frac(x){return x-Math.floor(x);}
function precioMes(s,r,mes){ var R=RECURSOS[r], v=RVETA[r][3];
  var tri=1-4*Math.abs(frac(mes/R.ciclo+hash2(s.mseed,v,1))-0.5), sh=hash2(s.mseed^v,Math.floor(mes/4),7)-0.5;
  return r2(R.precio*(1+0.3*tri+0.3*sh)); }
function precio(s,r){return precioMes(s,r,Math.floor(s.tick/MES));}
function precioVenta(s,r){ var st=s.est||calcula(s);
  return r2(precio(s,r)*(1+0.05*Math.min(5,rutas(s)))*(st.aero&&RECURSOS[r].aereo?1.2:1)*(s.techs.logistica?1.08:1)); }
function capacidad(s){ var st=s.est||calcula(s); return Math.round((10+30*st.puertos+80*Math.min(2,st.aero)+10*Math.min(5,rutas(s)))*(s.techs.logistica?1.25:1)); }
function mesRecursos(s,st){
  var m=mapas(s), r, i, k, out={ingreso:0,unidades:0}, huelga=hayProblema(s,"huelga");
  s.stock=s.stock||{};
  /* producción de las minas (desde la industria necesitan electricidad) */
  for(k=0;k<m.occ.length;k++){ i=m.occ[k]; if(s.tipo[i]!=="m")continue;
    r=yacimiento(s.mseed,s.cx+Math.floor(i/LADO)-R,s.cy+i%LADO-R); if(!r||RECURSOS[r].era>s.era)continue;
    var luz=st.sinLuz||st.redE[m.redE.comp[i]]>=0.95;
    s.stock[r]=(s.stock[r]||0)+Math.round(RECURSOS[r].prod*(luz?1:0.5)*(huelga?0.5:1)*(s.techs.mineria?1.3:1)); }
  /* las reservas estratégicas gastan un poco cada mes */
  for(k=0;k<RORDEN.length;k++){ r=RORDEN[k]; if(activo(s,r)&&RECURSOS[r].consumo)s.stock[r]-=RECURSOS[r].consumo; }
  /* lo demás se exporta, hasta la capacidad que quede este mes */
  var cap=Math.max(0,capacidad(s)-(s.vendido||0));
  for(k=0;k<RORDEN.length&&cap>0;k++){ r=RORDEN[k]; if(s.reserva&&s.reserva[r])continue; var q=Math.min(s.stock[r]||0,cap); if(q<=0)continue;
    var v=r2(q*precioVenta(s,r)); s.stock[r]-=q; cap-=q; out.ingreso=r2(out.ingreso+v); out.unidades+=q; }
  s.dinero=r2(s.dinero+out.ingreso); s.vendido=0;
  return out;
}
/* ---------- malestar social y orden público ----------
   El malestar sube con la infelicidad, el desempleo, los impuestos altos, la desigualdad y la represión, y baja
   cuando se resuelven sus causas. Protestar es un derecho: la policía no la evita. Si el malestar desborda la
   capacidad de mantener el orden (policía y ejército) hay disturbios. Dialogar (acertar una pregunta) lo baja de
   verdad; imponer el orden termina el conflicto enseguida, pero deja resentimiento. */
function ordenDe(s,st){st=st||s.est||calcula(s); return Math.round((st.cob?st.cob.seg:0)*30+(st.cuartel?EDIF.X.orden:0));}
function causas(s,st){
  st=st||s.est||calcula(s);
  var trab=st.pob*0.6, emp=st.empC+st.empI, des=trab>0?Math.max(0,(trab-emp)/trab):0, rica=st.pob?st.pobRica/st.pob:0;
  var otros=s.problemas.filter(function(p){return !PROBLEMAS[p.k].disc;}).length;
  return {felicidad:Math.round(0.9*Math.max(0,62-st.felicidad)), desempleo:Math.round(70*des), impuestos:4*Math.max(0,s.impuesto-10),
    desigualdad:st.pob>150?Math.round(30*rica*(1-rica)):0, problemas:4*otros, represion:(s.represionHasta||0)>s.tick?10:0, des:des};
}
function malestarMes(s,st){
  var c=causas(s,st), obj=Math.min(100,c.felicidad+c.desempleo+c.impuestos+c.desigualdad+c.problemas+c.represion), m=s.malestar||0;
  m+=(obj-m)*(s.techs.dialogo&&obj<m?0.5:0.35); s.malestar=Math.round(Math.max(0,Math.min(100,m))*10)/10;
  if(st.pob<60)return;
  var orden=ordenDe(s,st);
  if(s.malestar>=50)discordia(s,"protesta");
  if(s.malestar>=60&&s.era>=3&&(c.des>0.12||s.impuesto>=12))discordia(s,"huelga");
  if(s.malestar-orden*0.5>=55)discordia(s,"disturbios");
}
function discordia(s,k){
  if(hayProblema(s,k))return;
  var p={id:s.nextProb++,k:k,desde:s.tick,vence:s.tick+(k==="disturbios"?90:150),i:-1,intentos:0};
  s.problemas.push(p); aviso(s,{tipo:"problema",p:p});
}

/* ---------- deuda pública: pedir prestado para invertir, como una alcaldía real ----------
   Un mes del juego son 10 s. El préstamo bancario se devuelve con cuota fija (sistema francés: cada cuota paga los
   intereses del mes y el resto amortiza capital); los bonos municipales pagan solo intereses (el cupón) cada mes y el
   capital entero al vencer. La tasa depende de la calificación crediticia, que mira cuánto se debe frente a lo que se
   ingresa en un año, si hubo impagos y si la caja está en rojo. Como en muchas leyes de haciendas locales, la deuda
   viva no puede pasar del 110 % de los ingresos de un año. */
var DEUDA={
  b:{nom:"Préstamo bancario", anual:0.08, plazos:[12,24,36], era:0, comision:0.01},
  o:{nom:"Bonos municipales", anual:0.05, plazos:[24,48], era:3, comision:0.02}
};
var CALIF=["AAA","AA","A","BBB","BB","B"], PRIMA=[0,0.005,0.01,0.02,0.04,0.07];
function r2(x){return Math.round(x*100)/100;}
function ingresos(s,st){
  var huelga=hayProblema(s,"huelga"), protesta=hayProblema(s,"protesta"), mal=(s.malestar||0);
  var ind=st.empI*0.12*(activo(s,"hierro")?1.2:1)*(huelga?0.5:1), com=st.empCPond*0.15*(activo(s,"petroleo")?1.1:1)*(protesta?0.85:1)*(1-mal/500);
  return (st.pobPond*0.12+com+ind)*(s.impuesto/10)*(s.techs.fiscal?1.1:1)*(1+0.08*Math.min(5,rutas(s)))*(1+0.06*Math.min(1,st.aero||0));
}
function deudaViva(s){var t=0; (s.deuda||[]).forEach(function(d){t+=d.cap;}); return r2(t);}
/* lo que toca pagar el próximo mes (intereses + capital) */
function servicioDeuda(s){var t=0; (s.deuda||[]).forEach(function(d){var i=d.cap*d.tasa; t+=d.k==="b"?(d.n===1?d.cap+i:d.cuota):i+(d.n===1?d.cap:0);}); return r2(t);}
function calificacion(s,st){
  st=st||s.est||calcula(s);
  var anual=ingresos(s,st)*12, viva=deudaViva(s), ratio=anual>0?viva/anual:(viva>0?99:0);
  var n=ratio<0.3?0:ratio<0.6?1:ratio<0.9?2:ratio<1.2?3:ratio<2?4:5;
  if((s.impagoHasta||0)>s.tick)n+=2;
  if(s.dinero<0)n++;
  if(n>0&&((s.temas.economia||[0])[0]>=3))n--;   /* una alcaldía que sabe de economía inspira confianza */
  if(n>0&&activo(s,"oro"))n--;                    /* las reservas de oro respaldan a la ciudad */
  return Math.min(5,n);
}
/* lo que ofrece el banco (o el mercado, para los bonos) hoy: tasa, cuánto se puede pedir y por qué no */
function oferta(s,k,plazo){
  var P=DEUDA[k]; if(!P)return {ok:false,motivo:"no existe"};
  var st=s.est||calcula(s), n=calificacion(s,st), anual=ingresos(s,st)*12;
  var limite=Math.max(1000,Math.floor(anual*1.1/100)*100), max=Math.max(0,Math.floor((limite-deudaViva(s))/100)*100);
  var pl=plazo||P.plazos[0], tasaA=P.anual+PRIMA[n]+0.005*Math.max(0,(pl-P.plazos[0])/12);   /* más plazo, más riesgo: un poco más de interés */
  var o={ok:true,k:k,calif:n,nota:CALIF[n],anual:tasaA,tasa:tasaA/12,limite:limite,max:max,plazo:pl,motivo:""};
  if(P.era>s.era){o.ok=false; o.motivo="Los bonos municipales llegan con la Revolución Industrial.";}
  else if(P.plazos.indexOf(pl)<0){o.ok=false; o.motivo="Plazo no disponible.";}
  else if(n>=5){o.ok=false; o.motivo="Con calificación B nadie presta: baja la deuda o sal de los números rojos.";}
  else if(max<500){o.ok=false; o.motivo="Llegaste al límite de endeudamiento (110 % de los ingresos de un año).";}
  return o;
}
function cuotaFrancesa(P,r,n){return r2(r>0?P*r/(1-Math.pow(1+r,-n)):P/n);}
function pagaDeuda(s){
  var tot=0, intr=0;
  if(!s.deuda||!s.deuda.length)return {tot:0,int:0};
  s.deuda=s.deuda.filter(function(d){
    var i=r2(d.cap*d.tasa), a=d.n<=1?d.cap:(d.k==="b"?Math.min(d.cap,r2(d.cuota-i)):0);
    d.cap=r2(d.cap-a); d.n--; d.intereses=r2((d.intereses||0)+i); tot+=i+a; intr+=i;
    if(d.n<=0||d.cap<=0){aviso(s,{tipo:"saldada",k:d.k,monto:d.monto,intereses:d.intereses}); return false;}
    return true;
  });
  return {tot:r2(tot),int:r2(intr)};
}

/* ---------- acciones ---------- */
function costo(s,t,dx,dy){var e=EDIF[t]; var c=e.costo*(t==="c"&&s.techs.transporte?0.5:1); if(terr(s,dx,dy)==="f")c+=15; if(activo(s,"piedra"))c=Math.round(c*0.9*100)/100; return c;}
function act(s,a,b,c,d,e,f){
  var i, t;
  if(a==="b"){                       /* construir: b,c = casilla; d = qué */
    t=String(d||""); var E=EDIF[t]; if(!E)return false;
    if(!(b>=-R&&b<=R&&c>=-R&&c<=R)||!dentro(s,b,c))return false;
    i=idx(b,c); if(s.tipo[i])return false;
    if(terr(s,b,c)==="w")return false;
    if(E.tech&&!s.techs[E.tech])return false;
    if(E.era>s.era)return false;
    if(E.junto){var ok=false;[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(v){if(terr(s,b+v[0],c+v[1])===E.junto)ok=true;}); if(!ok)return false;}
    if(t==="m"){var yr=yacimiento(s.mseed,s.cx+b,s.cy+c); if(!yr||RECURSOS[yr].era>s.era)return false;}
    var cc=costo(s,t,b,c); if(s.dinero<cc)return false;
    s.dinero-=cc; s.tipo[i]=t; s.nivel[i]=0; if(t!=="c")s.cable[i]=0;   /* lo construido ya conduce: el tendido sobra */
    s.est=null; s.cache=null; aviso(s,{tipo:"construye",i:i,t:t}); return true;
  }
  if(a==="r"){                       /* redes: d = «e» tendido eléctrico (sobre el campo o una calle), «a» tubería (bajo tierra) */
    t=String(d||""); if(!COSTO_RED[t])return false;
    if(!(b>=-R&&b<=R&&c>=-R&&c<=R)||!dentro(s,b,c))return false;
    i=idx(b,c); if(terr(s,b,c)==="w")return false;
    if(t==="e"){ if(s.era<3||s.cable[i]||(s.tipo[i]&&s.tipo[i]!=="c"))return false; }
    else if(s.tubo[i])return false;
    if(s.dinero<COSTO_RED[t])return false;
    s.dinero-=COSTO_RED[t]; if(t==="e")s.cable[i]=1; else s.tubo[i]=1;
    s.est=null; s.cache=null; aviso(s,{tipo:"red",i:i,k:t}); return true;
  }
  if(a==="x"){                       /* demoler: lo de la superficie (o su tendido); con d = «a», la tubería */
    if(!(b>=-R&&b<=R&&c>=-R&&c<=R))return false;
    i=idx(b,c);
    if(d==="a"){ if(!s.tubo[i])return false; s.tubo[i]=0; }
    else if(s.tipo[i]){ s.tipo[i]=""; s.nivel[i]=0; }
    else if(s.cable[i]){ s.cable[i]=0; }
    else return false;
    s.est=null; s.cache=null; aviso(s,{tipo:"demuele",i:i}); return true;
  }
  if(a==="i"){                       /* impuestos: 6 a 14 % */
    if(!(b>=6&&b<=14))return false; s.impuesto=b; return true;
  }
  if(a==="p"){                       /* pedir prestado: b monto, c plazo en meses, d «b» préstamo bancario u «o» bonos */
    var of=oferta(s,String(d||""),c);
    if(!of.ok||!(b>=500&&b<=of.max&&b%100===0))return false;
    s.deuda=(s.deuda||[]).concat([{id:s.nextDeuda||1,k:of.k,monto:b,cap:b,tasa:of.tasa,n:c,plazo:c,
      cuota:of.k==="b"?cuotaFrancesa(b,of.tasa,c):0,desde:s.tick,intereses:0}]);
    s.nextDeuda=(s.nextDeuda||1)+1; s.dinero=r2(s.dinero+b); s.est=null; aviso(s,{tipo:"prestamo",k:of.k,monto:b}); return true;
  }
  if(a==="v"){                       /* devolver ya lo que queda de una deuda (b = su número), con la comisión */
    var dd=(s.deuda||[]).filter(function(x){return x.id===b;})[0]; if(!dd)return false;
    var cst=r2(dd.cap*(1+DEUDA[dd.k].comision)); if(s.dinero<cst)return false;
    s.dinero=r2(s.dinero-cst); s.deuda=s.deuda.filter(function(x){return x!==dd;}); s.est=null; aviso(s,{tipo:"devuelta",k:dd.k,costo:cst}); return true;
  }
  if(a==="s"){                       /* vender ya: b unidades del recurso d, dentro de la capacidad de exportación del mes */
    var RR=RECURSOS[d]; if(!RR||!(b>=1&&b<=1e6))return false; s.stock=s.stock||{};
    if((s.stock[d]||0)<b||b>capacidad(s)-(s.vendido||0))return false;
    var vv=r2(b*precioVenta(s,d)); s.stock[d]-=b; s.vendido=(s.vendido||0)+b; s.dinero=r2(s.dinero+vv); aviso(s,{tipo:"venta",r:d,q:b,monto:vv}); return true;
  }
  if(a==="g"){                       /* política de un recurso: b=1 reserva estratégica, b=0 exportar */
    if(!RECURSOS[d]||(b!==0&&b!==1))return false; s.reserva=s.reserva||{}; s.reserva[d]=b===1; s.est=null; s.cache=null; return true;
  }
  if(a==="o"){                       /* imponer el orden en una protesta, huelga o disturbio (b = el problema) */
    var po=s.problemas.filter(function(x){return x.id===b;})[0]; if(!po||!PROBLEMAS[po.k].disc)return false;
    if(ordenDe(s)<15||s.dinero<200)return false;
    s.dinero-=200; s.problemas=s.problemas.filter(function(x){return x!==po;});
    s.malestar=Math.max(0,(s.malestar||0)-8); s.bonoFeliz=-6; s.bonoFelizHasta=s.tick+240; s.represion=(s.represion||0)+1; s.represionHasta=s.tick+12*MES;
    s.est=null; aviso(s,{tipo:"orden",k:po.k}); return true;
  }
  if(a==="n"){ s.nombre=String(d||"").replace(/\s+/g," ").trim().slice(0,30)||s.nombre; return true; }
  if(a==="q"){                       /* pregunta: b opción, c no se usa, d id, e «t:tech» o «p:problema», f si acertó */
    var qid=String(d||"").slice(0,24), obj=String(e||"");
    if(!qid||s.qUsadas[qid]||!(b>=-1&&b<=3))return false;
    var tema=null, prob=null, tech=null, era=null, trat=null;
    if(obj.indexOf("t:")===0){tech=obj.slice(2); var T=TECHS[tech]; if(!T||s.techs[tech]||(s.techCool[tech]||0)>s.tick)return false;
      if((T.req||[]).some(function(r){return !s.techs[r];})||T.era>s.era)return false; tema=T.tema;}
    else if(obj.indexOf("e:")===0){era=parseInt(obj.slice(2),10); var rq=requisitos(s,era);
      if(!rq||rq.some(function(x){return !x.ok;})||s.eraCool>s.tick)return false; tema="historia";}
    else if(obj.indexOf("r:")===0){trat=parseInt(obj.slice(2),10);
      if(s.contactos.indexOf(trat)<0||s.tratados[trat]||(s.tratCool[trat]||0)>s.tick)return false; tema="cultura";}
    else if(obj.indexOf("p:")===0){var pid=parseInt(obj.slice(2),10); prob=s.problemas.filter(function(p){return p.id===pid;})[0]; if(!prob)return false; tema=PROBLEMAS[prob.k].tema;}
    else return false;
    var orc=G.AxCiudad.oraculo;
    var bien=orc?orc(qid,b,s.seg,tema,!!f):!!f;   /* el servidor rechaza (null) si lo que dice el navegador no es lo registrado */
    if(bien===null)return false;
    s.qUsadas[qid]=1; s.preguntas++;
    var tt=s.temas[tema]||(s.temas[tema]=[0,0]); tt[1]++;
    if(bien){tt[0]++; s.conocimiento++;}
    if(tech){ if(bien){s.techs[tech]=1;s.cache=null;aviso(s,{tipo:"tech",k:tech});} else {s.techCool[tech]=s.tick+60;aviso(s,{tipo:"falla",tech:tech});} }
    else if(era!==null){
      if(bien){
        var st0=calcula(s);
        /* la primera red eléctrica: al llegar la industria se cubre lo que ya se consume */
        if(era===3)s.bonoMW+=Math.ceil(st0.mwUso)+10;
        s.era=era; s.dinero+=500*era; s.bonoFeliz=10; s.bonoFelizHasta=s.tick+240; s.cache=null; aviso(s,{tipo:"era",n:era});
      } else {s.eraCool=s.tick+60; aviso(s,{tipo:"falla",era:era});}
    }
    else if(trat!==null){
      if(bien){s.tratados[trat]=1; s.dinero+=500; s.cultura+=20; aviso(s,{tipo:"tratado",slot:trat});}
      else {s.tratCool[trat]=s.tick+60; aviso(s,{tipo:"falla",slot:trat});}
    }
    else{
      if(bien){s.problemas=s.problemas.filter(function(p){return p!==prob;}); s.resueltos++; premio(s,prob.k); aviso(s,{tipo:"resuelto",k:prob.k});}
      else{prob.intentos++; prob.vence-=20; aviso(s,{tipo:"falla",k:prob.k});}
    }
    s.est=null; return true;
  }
  return false;
}

/* ---------- repetir un tramo (servidor) ----------
   estado: el guardado (o null para una ciudad nueva), seg: semilla del tramo,
   envio: {a:[[paso,acción,…]…], fin:paso}. Devuelve el estado final o null. */
function repite(estado,nuevo,seg,envio){
  if(!envio||!Array.isArray(envio.a)||envio.a.length>MAX_ACC)return null;
  var s=estado?deserializa(estado,seg):(function(){var x=crea(nuevo.mseed,nuevo.slot,nuevo.nombre); return deserializa(serializa(x),seg);})();
  s.ev=null;
  var fin=parseInt(envio.fin,10); if(!(fin>=0&&fin<=MAX_SEG))return null;
  var n=0, acc=envio.a, ult=0;
  for(;;){
    while(n<acc.length){
      var x=acc[n]; if(!Array.isArray(x))return null;
      var t=parseInt(x[0],10); if(!(t>=ult))return null;
      if(t>s.segTick)break; if(t<s.segTick)return null;
      if(!act(s,String(x[1]),parseInt(x[2],10),parseInt(x[3],10),x[4]==null?null:String(x[4]),x[5]==null?null:String(x[5]),x[6]===true||x[6]===1))return null;
      ult=t; n++;
    }
    if(s.segTick>=fin)break;
    paso(s);
  }
  if(n<acc.length)return null;
  calcula(s);
  return s;
}
function resumen(s){var st=s.est||calcula(s);
  return {puntaje:puntaje(s),pob:st.pob,felicidad:st.felicidad,conocimiento:s.conocimiento,cultura:Math.round(s.cultura),radio:radio(s),
          dinero:Math.round(s.dinero),deuda:Math.round(deudaViva(s)),malestar:Math.round(s.malestar||0),techs:Object.keys(s.techs).length,resueltos:s.resueltos,temas:s.temas,era:s.era,tratados:rutas(s)};}

G.AxCiudad={TICK:TICK,R:R,LADO:LADO,N:N,SEPARA:SEPARA,MES:MES,MAX_SEG:MAX_SEG,EDIF:EDIF,TECHS:TECHS,PROBLEMAS:PROBLEMAS,TEMAS:TEMAS,ERAS:ERAS,INFLU:INFLU,COSTO_RED:COSTO_RED,riqueza:riqueza,
  RECURSOS:RECURSOS,RORDEN:RORDEN,yacimiento:yacimiento,precio:precio,precioMes:precioMes,precioVenta:precioVenta,capacidad:capacidad,activo:activo,
  ordenDe:ordenDe,causas:causas,hayProblema:hayProblema,
  DEUDA:DEUDA,CALIF:CALIF,oferta:oferta,calificacion:calificacion,deudaViva:deudaViva,servicioDeuda:servicioDeuda,ingresos:ingresos,cuotaFrancesa:cuotaFrancesa,
  influencia:influencia,rutas:rutas,tope:tope,requisitos:requisitos,
  POB:POB,EMPC:EMPC,EMPI:EMPI,
  semilla:semilla,rng:rng,terreno:terreno,centroSlot:centroSlot,crea:crea,serializa:serializa,deserializa:deserializa,
  idx:idx,radio:radio,dentro:dentro,calcula:calcula,mapas:mapas,calle:calle,paso:paso,act:act,costo:costo,repite:repite,puntaje:puntaje,resumen:resumen,
  oraculo:null};
})(typeof globalThis!=="undefined"?globalThis:this);
