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
  O:{nom:"Monumento",      costo:3000,mant:6,   grupo:"cultura", radio:12, feliz:8, cultura:8, tech:"patrimonio", era:2}
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
  fiscal:   {nom:"Impuestos inteligentes",tema:"economia",  desc:"Un 10 % más de recaudación.", era:2}
};
/* problemas que aparecen según lo que le falta a la ciudad */
var PROBLEMAS={
  apagon:  {nom:"Apagón",              tema:"energia",    desc:"La demanda de electricidad supera la generación.", era:3},
  sequia:  {nom:"Falta de agua",       tema:"agua",       desc:"Las bombas no alcanzan para toda la población."},
  smog:    {nom:"Contaminación",       tema:"ambiente",   desc:"El aire está contaminado cerca de la industria.", era:3},
  incendio:{nom:"Incendio",            tema:"seguridad",  desc:"Un incendio amenaza un barrio sin bomberos.", era:1},
  crimen:  {nom:"Inseguridad",         tema:"seguridad",  desc:"Hay barrios sin cobertura de policía."},
  atasco:  {nom:"Atasco",              tema:"transporte", desc:"Las calles no dan abasto para tanta gente."},
  crisis:  {nom:"Crisis de caja",      tema:"economia",   desc:"La ciudad está gastando más de lo que recauda."},
  epidemia:{nom:"Brote de gripe",      tema:"salud",      desc:"Faltan hospitales cerca de la gente.", era:1},
  escuela: {nom:"Falta de escuelas",   tema:"educacion",  desc:"Muchos niños no tienen escuela cerca.", era:1},
  puente:  {nom:"Puente dañado",       tema:"ingenieria", desc:"Una estructura necesita una evaluación técnica."},
  plan:    {nom:"Plan urbano",         tema:"urbanismo",  desc:"El concejo pide una decisión de urbanismo."},
  feria:   {nom:"Feria cultural",      tema:"cultura",    desc:"¡Oportunidad! Una feria puede atraer visitantes."}
};
var TEMAS={energia:"Energía",agua:"Agua",transporte:"Transporte",urbanismo:"Urbanismo",ambiente:"Ambiente",salud:"Salud",
           seguridad:"Seguridad",educacion:"Educación",economia:"Economía",cultura:"Cultura",ingenieria:"Ingeniería",historia:"Historia"};
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
var INFLU=7;                  /* cada época lleva la influencia cultural 7 casillas más lejos */

/* ---------- estado ---------- */
function idx(dx,dy){return (dx+R)*LADO+(dy+R);}
function crea(mseed,slot,nombre){
  var c=centroSlot(slot);
  return {v:1,mseed:mseed>>>0,slot:slot,cx:c.x,cy:c.y,nombre:String(nombre||"Mi ciudad").slice(0,30),
    tick:0,dinero:6000,impuesto:10,cultura:0,conocimiento:0,preguntas:0,temas:{},techs:{},techCool:{},
    tipo:new Array(N).fill(""),nivel:new Array(N).fill(0),
    problemas:[],nextProb:1,resueltos:0,fallidos:0,bonoMW:0,bonoAgua:0,bonoLimpio:0,bonoFeliz:0,bonoFelizHasta:0,
    era:0,eraCool:0,contactos:[],tratados:{},tratCool:{},
    qUsadas:{},est:null,seg:0,segTick:0};
}
function serializa(s){
  var o={}, k;
  for(k in s)if(k!=="ev"&&k!=="r"&&k!=="cache"&&k!=="est")o[k]=s[k];
  o.tipo=s.tipo.map(function(t){return t||".";}).join(""); o.nivel=s.nivel.join("");
  return JSON.stringify(o);
}
function deserializa(txt,seg){
  var o=typeof txt==="string"?JSON.parse(txt):JSON.parse(JSON.stringify(txt));
  /* ciudades de antes de las épocas: industriales si ya tenían centrales, si no, de la Antigüedad */
  if(o.era==null){o.era=/[ewsh]/.test(o.tipo)?3:0; o.eraCool=0; o.contactos=[]; o.tratados={}; o.tratCool={};}
  o.tipo=o.tipo.split("").map(function(c){return c==="."?"":c;}); o.nivel=o.nivel.split("").map(Number);
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
  return s.cache={cov:cov,feliz:feliz,cont:cont,occ:occ,res:res};
}
function calcula(s){
  var m=mapas(s), cov=m.cov, i, t, e, l, k, occ=m.occ, res=m.res;
  var st={pob:0,empC:0,empI:0,mwCap:s.bonoMW,mwUso:0,agCap:s.bonoAgua,agUso:0,calles:0,mant:0,cultura:0,edif:0,R:0,C:0,I:0};
  for(k=0;k<occ.length;k++){i=occ[k]; t=s.tipo[i]; e=EDIF[t]; l=s.nivel[i];
    st.mant+=e.mant;
    if(t==="c"){st.calles++;continue;}
    if(t==="R"){st.pob+=POB[l];st.mwUso+=MW_R[l];st.agUso+=AG_R[l];st.R++;continue;}
    if(t==="C"){st.empC+=EMPC[l];st.mwUso+=MW_C[l];st.agUso+=AG_C[l];st.C++;continue;}
    if(t==="I"){st.empI+=EMPI[l];st.mwUso+=MW_I[l];st.agUso+=AG_I[l];st.I++;continue;}
    st.edif++;
    if(e.mw)st.mwCap+=e.mw; else st.mwUso+=1;
    if(e.agua)st.agCap+=e.agua; else st.agUso+=0.5;
    if(e.cultura)st.cultura+=e.cultura;
  }
  st.sinLuz=s.era<3;
  st.ratioMW=st.sinLuz||!st.mwUso?1:Math.min(1,st.mwCap/st.mwUso); st.ratioAg=st.agUso?Math.min(1,st.agCap/st.agUso):1;
  /* demanda RCI */
  var trab=st.pob*0.6, emp=st.empC+st.empI;
  st.demR=Math.round(emp-trab+12); st.demC=Math.round(st.pob*0.25-st.empC+2+4*rutas(s)); st.demI=Math.round(st.pob*0.3-st.empI+6);
  /* felicidad: promedio en las zonas residenciales, pesado por población */
  var suma=0, peso=0, cubiertos={seg:0,fue:0,sal:0,edu:0}, contMedia=0;
  for(k=0;k<res.length;k++){ i=res[k]; if(!s.nivel[i])continue; var w=POB[s.nivel[i]];
    var srv=(cov.seg[i]?1:0)+(cov.fue[i]?1:0)+(cov.sal[i]?1:0)+(cov.edu[i]?1:0);
    if(cov.seg[i])cubiertos.seg+=w; if(cov.fue[i])cubiertos.fue+=w; if(cov.sal[i])cubiertos.sal+=w; if(cov.edu[i])cubiertos.edu+=w;
    var f=50+6*srv+Math.min(15,m.feliz[i])-4*m.cont[i]-(st.ratioMW<1?15:0)-(st.ratioAg<1?10:0)-3*(s.impuesto-10);
    suma+=Math.max(0,Math.min(100,f))*w; peso+=w; contMedia+=m.cont[i]*w;}
  var penal=5*s.problemas.length+(s.tick<s.bonoFelizHasta?-s.bonoFeliz:0);
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
    var luz=st.ratioMW>=0.95&&(l<1||st.ratioAg>=0.95);
    if(conCalle&&luz&&dem>0&&l<max&&azar<0.35){s.nivel[i]=l+1; if(t==="I")cambiaI=true; aviso(s,{tipo:"crece",i:i,l:l+1});}
    else if(l>0&&(!conCalle||(!st.sinLuz&&st.ratioMW<0.7)||l>max)&&azar<0.2){s.nivel[i]=l-1; if(t==="I")cambiaI=true; aviso(s,{tipo:"decae",i:i});}
  }
  if(cambiaI)s.cache=null;
  /* cultura y economía */
  s.cultura+=st.cultura*0.1+st.pob/5000+0.05*rutas(s);
  if(s.tick%MES===0){
    var imp=s.impuesto/10, ing=(st.pob*0.12+st.empC*0.15+st.empI*0.12)*imp*(s.techs.fiscal?1.1:1)*(1+0.08*Math.min(5,rutas(s)));
    var gas=st.mant+st.calles*0.02;
    s.dinero=Math.round((s.dinero+ing-gas)*100)/100;
    aviso(s,{tipo:"mes",ing:ing,gas:gas});
  }
  /* problemas: vencen o aparecen */
  s.problemas=s.problemas.filter(function(p){
    if(s.tick<p.vence)return true;
    s.fallidos++; s.dinero-=300; s.bonoFeliz=-8; s.bonoFelizHasta=s.tick+120;
    if(p.k==="incendio"&&p.i>=0&&s.tipo[p.i]){s.nivel[p.i]=0;s.cache=null;}
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
  if(k==="apagon")s.bonoMW+=10; else if(k==="sequia")s.bonoAgua+=15; else if(k==="smog"){s.bonoLimpio=Math.min(3,s.bonoLimpio+1);s.cache=null;}
  else if(k==="feria")s.cultura+=15; else{ s.bonoFeliz=6; s.bonoFelizHasta=s.tick+240; }
  s.dinero+=400;
}

/* ---------- acciones ---------- */
function costo(s,t,dx,dy){var e=EDIF[t]; var c=e.costo*(t==="c"&&s.techs.transporte?0.5:1); if(terr(s,dx,dy)==="f")c+=15; return c;}
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
    var cc=costo(s,t,b,c); if(s.dinero<cc)return false;
    s.dinero-=cc; s.tipo[i]=t; s.nivel[i]=0; s.est=null; s.cache=null; aviso(s,{tipo:"construye",i:i,t:t}); return true;
  }
  if(a==="x"){                       /* demoler */
    if(!(b>=-R&&b<=R&&c>=-R&&c<=R))return false;
    i=idx(b,c); if(!s.tipo[i])return false;
    s.tipo[i]=""; s.nivel[i]=0; s.est=null; s.cache=null; aviso(s,{tipo:"demuele",i:i}); return true;
  }
  if(a==="i"){                       /* impuestos: 6 a 14 % */
    if(!(b>=6&&b<=14))return false; s.impuesto=b; return true;
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
          dinero:Math.round(s.dinero),techs:Object.keys(s.techs).length,resueltos:s.resueltos,temas:s.temas,era:s.era,tratados:rutas(s)};}

G.AxCiudad={TICK:TICK,R:R,LADO:LADO,N:N,SEPARA:SEPARA,MES:MES,MAX_SEG:MAX_SEG,EDIF:EDIF,TECHS:TECHS,PROBLEMAS:PROBLEMAS,TEMAS:TEMAS,ERAS:ERAS,INFLU:INFLU,
  influencia:influencia,rutas:rutas,tope:tope,requisitos:requisitos,
  POB:POB,EMPC:EMPC,EMPI:EMPI,
  semilla:semilla,rng:rng,terreno:terreno,centroSlot:centroSlot,crea:crea,serializa:serializa,deserializa:deserializa,
  idx:idx,radio:radio,dentro:dentro,calcula:calcula,mapas:mapas,calle:calle,paso:paso,act:act,costo:costo,repite:repite,puntaje:puntaje,resumen:resumen,
  oraculo:null};
})(typeof globalThis!=="undefined"?globalThis:this);
