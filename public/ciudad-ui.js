/* ===========================================================
   THE FINAL TEST · Ciudad Saber · pantalla
   Vista isométrica de un mundo infinito: el terreno se genera con
   la semilla del mundo (en trozos de 16×16 que se guardan como
   imágenes), tu ciudad y las de tus vecinos encima, coches por las
   calles, humo, agua que brilla y día y noche.
   Se construye con la barra de abajo (tocar o arrastrar), se mueve
   el mapa arrastrando y se acerca con la rueda o con dos dedos.
   Las preguntas investigan tecnologías y resuelven problemas.
   Cada ~40 s se guarda un tramo: el servidor lo repite y, si
   cuadra, devuelve la semilla del tramo siguiente.
     AxCiudadUI.portada() · AxCiudadUI.cerrar()
   =========================================================== */
(function(){
"use strict";
var A=window.AxCiudad;
if(!A)return;
var $=function(id){return document.getElementById(id)};
var TW=32, TH=16, HW=16, HH=8;          /* rombo de una casilla (unidades del mapa) */
var CH=16, CS=2;                        /* trozos de terreno de 16×16, dibujados al doble */
var ZMIN=0.12, ZMUNDO=0.42;
var ALT=5, MAXA=4;                      /* relieve: cada nivel sube 5 unidades; de 0 (agua) a 4 (colinas). Solo se ve: no cambia las reglas */             /* por debajo de ZMUNDO se ve el mundo: terreno y ciudades simplificadas */
var AUTOGUARDA=40000, PREG_S=25;
var FUENTE="system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
var J=null, desfase=0;

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function hsh(x,y,k){var h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(k|0,1442695041);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
function fmt(n){n=Math.round(n);return (n<0?"−":"")+String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g,".");}
function seg2(t){var s=Math.max(0,Math.ceil(t)),m=Math.floor(s/60),g=s%60;return m+":"+(g<10?"0":"")+g;}

/* ---------- servidor ---------- */
function api(path,body,keep){
  return fetch(path,{method:body?"POST":"GET",credentials:"same-origin",headers:{"Content-Type":"application/json"},keepalive:!!keep,
    body:body?JSON.stringify(body):undefined}).then(function(r){return r.text().then(function(t){var j;try{j=JSON.parse(t);}catch(x){throw {error:"http",status:r.status};}if(!r.ok)throw j;return j;});});
}
function ERR(e){
  var m={unauthorized:"Entra con Google para fundar tu ciudad.",google_required:"Para la ciudad hace falta entrar con Google.",
    bad_result:"Tu ciudad no cuadró con la simulación del servidor; se vuelve a cargar la última versión guardada.",
    bad_time:"El reloj no cuadra con el del servidor.",not_started:"Primero entra a tu ciudad.",stale:"Abriste esta ciudad en otra pestaña o dispositivo.",
    closed:"Este desafío ya terminó.",not_found:"No se encontró.",forbidden:"No tienes permiso.",ciudad_not_configured:"Faltan las tablas de la ciudad en la base de datos (ver SETUP.md)."};
  if(e&&m[e.error])return m[e.error];
  if(e instanceof TypeError)return "Sin conexión con el servidor.";
  return "No se pudo completar"+(e&&e.error?" ("+e.error+")":"")+".";
}

/* ---------- sonido ---------- */
var AC=null;
function mudo(){return !!(window.AxGranjaUI&&AxGranjaUI.mudo&&AxGranjaUI.mudo());}
function tono(notas,tipo,dur,vol){
  if(mudo())return;
  try{
    if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==="suspended")AC.resume();
    var t=AC.currentTime;
    notas.forEach(function(f,i){var o=AC.createOscillator(),g=AC.createGain();o.type=tipo||"triangle";o.frequency.value=f;
      g.gain.setValueAtTime(vol||0.05,t+i*dur);g.gain.exponentialRampToValueAtTime(0.0008,t+(i+1)*dur);
      o.connect(g);g.connect(AC.destination);o.start(t+i*dur);o.stop(t+(i+1)*dur+0.02);});
  }catch(e){}
}
var SON={pon:function(){tono([330,440],"triangle",0.04,0.04);},quita:function(){tono([200,140],"sawtooth",0.05,0.03);},
  no:function(){tono([180,150],"square",0.06,0.03);},bien:function(){tono([523,659,784,1047],"triangle",0.08,0.06);},
  mal:function(){tono([330,260,196],"sawtooth",0.1,0.04);},alerta:function(){tono([880,660,880],"square",0.09,0.035);},
  tech:function(){tono([392,523,659,784,1047],"triangle",0.08,0.06);},crece:function(){tono([1047],"sine",0.05,0.015);},
  mes:function(){tono([784,988],"sine",0.06,0.025);},territorio:function(){tono([262,330,392,523,659],"sine",0.12,0.06);}};

/* ---------- textos ---------- */
var GRUPOS=[
  {k:"vias",ico:"🛣️",nom:"Vías",t:["c"]},
  {k:"zonas",ico:"🏘️",nom:"Zonas",t:["R","C","I"]},
  {k:"energia",ico:"⚡",nom:"Energía",t:["e","w","s","h"]},
  {k:"agua",ico:"💧",nom:"Agua",t:["b","d"]},
  {k:"redes",ico:"🔌",nom:"Redes",red:true},
  {k:"servicios",ico:"🚓",nom:"Servicios",t:["p","f","H","k"]},
  {k:"cultura",ico:"🎭",nom:"Cultura",t:["L","Z","P","T","M","u","O"]},
  {k:"x",ico:"🧨",nom:"Demoler"},
  {k:"info",ico:"🔍",nom:"Mirar"}
];
var ICO={c:"🛣️",R:"🏠",C:"🏬",I:"🏭",e:"🏭",w:"🌬️",s:"☀️",h:"🌊",b:"🚰",d:"♻️",p:"🚓",f:"🚒",H:"🏥",k:"🏫",u:"🎓",L:"📚",M:"🏛️",T:"🎭",P:"🌳",Z:"⛲",O:"🗿"};
var DESC={
  c:"Las zonas solo crecen junto a una calle. Arrastra para trazar en línea.",
  R:"Viviendas. Crecen si tienen calle, luz, agua, servicios y demanda (barra R).",
  C:"Tiendas y oficinas: empleo y recaudación. Crecen con la demanda C.",
  I:"Fábricas: mucho empleo, pero contaminan alrededor.",
  e:"40 MW, barata de arrancar, pero contamina en un radio de 6.",
  w:"12 MW sin contaminar.",s:"16 MW sin contaminar.",h:"60 MW limpios; tiene que tocar el agua.",
  b:"Agua para 40 unidades de consumo.",d:"Agua para 80 y reduce la contaminación de toda la ciudad.",
  p:"Seguridad en un radio de 9.",f:"Protege de incendios en un radio de 9.",H:"Salud en un radio de 10 (13 con Salud pública).",
  k:"Educación en un radio de 9: las zonas educadas llegan más alto.",u:"Educación en un radio de 14 y +4 de cultura.",
  L:"+1 de cultura: la cultura amplía el territorio.",M:"+3 de cultura y felicidad.",T:"+2 de cultura y mucha felicidad.",
  P:"Felicidad y aire limpio alrededor.",Z:"Felicidad y un poco de cultura.",O:"+8 de cultura y gran felicidad."
};
var CAPAS=[["","Sin capa"],["cont","Contaminación"],["seg","Seguridad"],["fue","Bomberos"],["sal","Salud"],["edu","Educación"],["feliz","Ocio"],["valor","Valor del suelo"],["luz","Electricidad"],["agua","Red de agua"]];
var MISIONES=[
  ["Traza una calle",function(s,st){return st.calles>=1;}],
  ["Pon una zona residencial junto a la calle",function(s,st){return st.R>=1;}],
  ["Agua potable: construye un pozo",function(s,st){return st.agCap>s.bonoAgua;}],
  ["Lleva el agua con una tubería (🔌 Redes)",function(s){return s.tubo.indexOf(1)>=0;}],
  ["Zonas comerciales e industriales",function(s,st){return st.C>=1&&st.I>=1;}],
  ["Cultura: una plaza o una biblioteca",function(s){return s.tipo.indexOf("Z")>=0||s.tipo.indexOf("L")>=0;}],
  ["Avanza a la Edad Media (🏺 arriba)",function(s){return s.era>=1;}],
  ["Resuelve un problema",function(s){return s.resueltos>=1;}],
  ["Escuela y hospital",function(s){return s.tipo.indexOf("k")>=0&&s.tipo.indexOf("H")>=0;}],
  ["Investiga una tecnología",function(s){return Object.keys(s.techs).length>=1;}],
  ["Avanza al Renacimiento",function(s){return s.era>=2;}],
  ["Amplía el territorio a radio 10",function(s){return A.radio(s)>=10;}],
  ["Avanza a la Revolución Industrial",function(s){return s.era>=3;}],
  ["Da electricidad: construye una central",function(s,st){return s.tipo.indexOf("e")>=0||s.tipo.indexOf("h")>=0;}],
  ["Tiende una línea eléctrica (🔌 Redes)",function(s){return s.cable.indexOf(1)>=0;}],
  ["Avanza a la Era Moderna",function(s){return s.era>=4;}],
  ["Firma un tratado con una ciudad vecina",function(s){return A.rutas(s)>=1;}],
  ["Avanza a la Era Digital",function(s){return s.era>=5;}],
  ["Levanta un monumento",function(s){return s.tipo.indexOf("O")>=0;}]
];
function eraNom(n){var E=A.ERAS[n]; return E?E.ico+" "+E.nom:"";}
function bloqueo(s,t){var E=A.EDIF[t]; return E.era>s.era?"era":E.tech&&!s.techs[E.tech]?"tech":null;}
function culturaPara(r){return 3*(r-7)*(r-7);}

/* ===================== PORTADA ===================== */
function panel(){return $("rapido-panel");}
function usuario(){return window.AxAccount&&AxAccount.user?AxAccount.user():null;}
function portada(nota){
  para();
  var pn=panel(); if(!pn)return;
  pn.hidden=false;
  var u=usuario();
  pn.innerHTML='<div class="cs-portada"><h3>🏙️ Ciudad Saber</h3>'+
    '<p class="fine">Funda tu ciudad en un mundo infinito, con tus vecinos alrededor. Traza calles, zonifica, da energía, agua y servicios, y haz crecer la <b>cultura</b> para ampliar tu territorio. '+
    'Los apagones, sequías o atascos se resuelven respondiendo preguntas de ingeniería básica, servicios y cultura general; las respuestas correctas también investigan tecnologías. '+
    '<a href="#" class="guia-link" data-guia="ciudad">¿Cómo funciona?</a></p>'+
    (nota?'<p class="msg good">'+esc(nota)+'</p>':'')+
    '<div id="cs-mundos">'+(u&&!u.guest?'<p class="fine">Cargando tus mundos…</p>':
      '<div class="rt-card cs-mundo-card"><span class="rt-card-top"><b>🌍 Mundo abierto</b><span class="chip">multijugador</span></span>'+
      '<small>Tu ciudad se guarda en el servidor y tus vecinos la ven. Para jugar hace falta entrar con Google.</small>'+
      '<div class="actions"><button type="button" class="primary" id="cs-login">Entrar con Google</button></div></div>')+'</div>'+
    '<h4>Ranking del mundo abierto</h4><div id="cs-rank"><p class="fine">Cargando…</p></div>'+
    '<p class="fine">Los docentes pueden crear <b>desafíos de ciudad</b> para su curso en <b>Educativo</b>: un mundo propio con fechas, metas y un reporte de aciertos por tema.</p></div>';
  if($("cs-login"))$("cs-login").onclick=function(){ if(window.AxAccount&&AxAccount.configurado&&AxAccount.configurado())AxAccount.abrirCuenta(); else alert("El inicio de sesión no está configurado."); };
  rankingEn($("cs-rank"),"ABIERTO");
  if(u&&!u.guest)api("/api/ciudad/mundos").then(function(r){
    var z=$("cs-mundos"); if(!z)return;
    z.innerHTML=r.mundos.map(tarjetaMundo).join("");
    Array.prototype.forEach.call(z.querySelectorAll("[data-mundo]"),function(b){b.onclick=function(){juega(b.getAttribute("data-mundo"));};});
  }).catch(function(e){var z=$("cs-mundos"); if(z)z.innerHTML='<p class="fine bad">'+esc(ERR(e))+'</p>';});
}
function metaTxt(m){if(!m)return "";var p=[];if(m.pob)p.push(fmt(m.pob)+" habitantes");if(m.fel)p.push(m.fel+" % de felicidad");if(m.con)p.push(m.con+(m.con===1?" acierto":" aciertos"));return p.join(" · ");}
function tarjetaMundo(w){
  var mia=w.mia, curso=w.tipo==="curso", fin=w.ends_at?new Date(w.ends_at):null;
  var chip=curso?(w.abierto?'<span class="chip activo">desafío · hasta '+fin.toLocaleDateString()+'</span>':'<span class="chip">terminado</span>'):'<span class="chip activo">multijugador</span>';
  return '<div class="rt-card cs-mundo-card'+(curso?' cs-curso':'')+'"><span class="rt-card-top"><b>'+(curso?'🎓 ':'🌍 ')+esc(w.nombre)+'</b>'+chip+'</span>'+
    '<small>'+(curso?'Curso '+esc(w.curso_nombre||w.curso)+'. ':'El mundo de todos: tus vecinos son las ciudades de las ranuras de al lado. ')+
      w.ciudades+(w.ciudades===1?' ciudad':' ciudades')+'.'+(w.meta?' Meta: '+esc(metaTxt(w.meta))+'.':'')+'</small>'+
    (mia&&mia.updated_at&&mia.puntaje!=null?'<div class="cs-mia"><b>'+esc(mia.nombre)+'</b><span>'+(mia.era!=null?esc(eraNom(mia.era))+' · ':'')+'👥 '+fmt(mia.poblacion)+' · 😊 '+mia.felicidad+' % · 🧠 '+mia.conocimiento+' · ⭐ '+fmt(mia.puntaje)+'</span></div>':'')+
    '<div class="actions"><button type="button" class="primary" data-mundo="'+esc(w.code)+'">'+(mia?(w.abierto?'Seguir con mi ciudad':'Ver mi ciudad'):'Fundar mi ciudad')+'</button></div></div>';
}
function rankingEn(z,mundo){
  if(!z)return;
  api("/api/ciudad/ranking?mundo="+encodeURIComponent(mundo)).then(function(r){
    z.innerHTML=r.top.length?'<ol class="rank-list">'+r.top.map(function(e){
      return '<li'+(e.me?' class="me"':'')+'><span class="pos">'+e.rank+'</span>'+(e.picture?'<img src="'+esc(e.picture)+'" alt="" referrerpolicy="no-referrer">':'<span class="noimg"></span>')+
        '<span class="who">'+(A.ERAS[e.era||0]?A.ERAS[e.era||0].ico+' ':'')+esc(e.ciudad||"")+' <small>'+esc(e.name)+(e.me?' (tú)':'')+'</small></span><span class="pts"><b>'+fmt(e.score)+'</b> pts</span></li>';}).join("")+'</ol>'+
      (r.me&&r.me.rank>r.top.length?'<p class="fine">Tu puesto: <b>#'+r.me.rank+'</b> de '+r.total+'.</p>':'')
      :'<p class="fine">Todavía no hay ciudades. ¡Funda la primera!</p>';
  }).catch(function(e){z.innerHTML='<p class="fine">'+esc(e&&e.error==="ciudad_not_configured"?ERR(e):"No se pudo cargar el ranking.")+'</p>';});
}

/* ===================== JUEGO ===================== */
function juega(mundo){
  para();
  var pn=panel(); pn.hidden=false;
  pn.innerHTML='<p class="fine">Abriendo tu ciudad…</p>';
  api("/api/ciudad/entrar",{mundo:mundo}).then(function(r){monta(r);}).catch(function(e){portada(ERR(e));});
}
function para(){
  if(!J)return;
  var j=J; J=null; j.vivo=false;
  if(j.raf)cancelAnimationFrame(j.raf);
  if(j.fuera)j.fuera();
  if(j.tq)clearInterval(j.tq);
}
/* al salir de la sección: lo que falte se guarda sin esperar la respuesta */
function cerrar(){
  if(J&&!J.solo&&J.log&&(J.log.length||J.s.segTick>0)&&!J.guardando){
    try{api("/api/ciudad/guardar",{mundo:J.mundo.code,seg:J.seg,envio:{a:J.log,fin:J.s.segTick}},true).catch(function(){});}catch(e){}
  }
  para();
}

function monta(ent){
  var pn=panel();
  var s=ent.estado?A.deserializa(ent.estado,ent.seg):A.deserializa(A.serializa(A.crea(ent.nuevo.mseed,ent.nuevo.slot,ent.nuevo.nombre)),ent.seg);
  var yo={vivo:true,s:s,log:[],seg:ent.seg,mundo:ent.mundo,solo:!!ent.cerrado,vel:1,pausa:false,modal:false,guardando:false,
    ultGuardado:performance.now(),vecinos:[],herr:{k:"info"},grupo:null,capa:"",cars:[],chispas:[],flot:[],trozos:{},ntrozos:0,
    radio:A.radio(s),mision:-1,retro:retroGuardado(),sub:false,cam:{x:0,y:0,z:1},ptr:{},arrastre:null,hover:null,ultMes:null,avisos:[]};
  J=yo; ultT=null;
  pn.innerHTML='<div class="cs" id="cs">'+
    '<div class="cs-top">'+
      '<button type="button" class="cs-nom" id="cs-nom" title="Alcaldía">🏛️ <b id="cs-nombre"></b></button>'+
      '<button type="button" class="cs-era" id="cs-era" title="Épocas de la historia"></button>'+
      '<span class="cs-st" title="Presupuesto">💰 <b id="cs-din"></b></span>'+
      '<span class="cs-st" title="Población">👥 <b id="cs-pob"></b></span>'+
      '<span class="cs-st" title="Felicidad">😊 <b id="cs-fel"></b></span>'+
      '<span class="cs-st" id="cs-mw-w" title="Electricidad: consumo / generación">⚡ <b id="cs-mw"></b></span>'+
      '<span class="cs-st" id="cs-ag-w" title="Agua: consumo / capacidad">💧 <b id="cs-ag"></b></span>'+
      '<span class="cs-st" title="Cultura (amplía el territorio)">🎭 <b id="cs-cul"></b></span>'+
      '<span class="cs-st" title="Respuestas correctas">🧠 <b id="cs-con"></b></span>'+
      '<span class="cs-rci" title="Demanda: Residencial, Comercial, Industrial"><i id="cs-dR"></i><i id="cs-dC"></i><i id="cs-dI"></i><small>R C I</small></span>'+
    '</div>'+
    '<div class="cs-obj" id="cs-obj"></div>'+
    '<div class="cs-mapa" id="cs-mapa">'+
      '<canvas id="cs-cv" aria-label="Mapa de la ciudad"></canvas><canvas id="cs-tx" class="cs-tx" aria-hidden="true"></canvas>'+
      '<div class="cs-izq">'+
        '<button type="button" id="cs-zmas" title="Acercar">+</button><button type="button" id="cs-zmenos" title="Alejar">−</button>'+
        '<button type="button" id="cs-centro" title="Volver al centro">🎯</button><button type="button" id="cs-mundo" title="Ver el mundo y las ciudades vecinas">🌐</button><button type="button" id="cs-retro" title="Modo retro: píxeles nítidos">👾</button><button type="button" id="cs-capa" title="Capas de información">🗺️</button>'+
        '<button type="button" id="cs-full" title="Pantalla completa">⛶</button></div>'+
      '<div class="cs-der">'+
        '<button type="button" id="cs-inv"><span>🔬</span><small>Investigar</small></button>'+
        '<button type="button" id="cs-prob"><span>⚠️</span><small>Problemas</small><em id="cs-nprob" hidden></em></button>'+
        '<button type="button" id="cs-vec"><span>🌍</span><small>Vecinos</small></button>'+
        '<button type="button" id="cs-ayu"><span>🏛️</span><small>Alcaldía</small></button></div>'+
      '<div class="cs-capa-n" id="cs-capa-n" hidden></div>'+
      '<div class="cs-info" id="cs-info" hidden></div>'+
      '<div class="cs-aviso" id="cs-aviso" aria-live="polite"></div>'+
      '<div class="cs-modal" id="cs-modal" hidden><div class="cs-mc" id="cs-mc"></div></div>'+
    '</div>'+
    '<div class="cs-tools" id="cs-tools" role="toolbar" aria-label="Construir"></div>'+
    '<div class="cs-sub" id="cs-sub"></div>'+
    '<div class="cs-bar"><span class="cs-vel" role="group" aria-label="Velocidad">'+
      '<button type="button" data-vel="0" title="Pausa">⏸</button><button type="button" data-vel="1" title="Normal">▶</button><button type="button" data-vel="2" title="Rápido">⏩</button></span>'+
      '<span class="cs-guard" id="cs-guard"></span><button type="button" class="ghost" id="cs-salir">Salir</button></div>'+
  '</div>';
  var cv=$("cs-cv"), ctx=cv.getContext("2d");
  yo.cv=cv; yo.ctx=ctx; yo.tx=$("cs-tx"); yo.gt=yo.tx.getContext("2d");
  if(yo.solo)msg("Este desafío terminó: tu ciudad queda para mirarla.",8000);
  else if(!ent.estado)msg("¡Bienvenida, alcaldía! Empieza por una calle desde el centro (🛣️ Vías) y pon zonas residenciales a su lado.",9000);
  else msg("Bienvenida de nuevo a "+s.nombre+".",4000);
  /* cámara: centrada en mi ciudad, con el territorio a la vista */
  centra(true);
  herramientas();
  enlaza();
  hud(true);
  cargaVecinos();
  yo.tq=setInterval(function(){if(J===yo&&!yo.solo&&!document.hidden)cargaVecinos();},60000);
  var ultimo=performance.now(), acc=0, ultHud=0;
  function cuadro(now){
    if(!yo.vivo)return;
    var dt=Math.min(250,now-ultimo); ultimo=now;
    if(corre()){
      acc+=dt*yo.vel;
      var n=0;
      while(acc>=A.TICK&&n<4){acc-=A.TICK; n++; A.paso(s); eventos(now);
        if(s.segTick>=A.MAX_SEG-4){guarda();break;}}
    } else acc=0;
    mueveCoches(dt*(corre()?yo.vel:0)/1000);
    dibuja(now);
    if(now-ultHud>300){ultHud=now;hud();}
    if(!yo.solo&&!yo.guardando&&!yo.modal&&now-yo.ultGuardado>AUTOGUARDA&&(yo.log.length||s.segTick>=20))guarda();
    yo.raf=requestAnimationFrame(cuadro);
  }
  yo.raf=requestAnimationFrame(cuadro);
}
function corre(){var j=J;return !!j&&!j.solo&&!j.pausa&&!j.modal&&!j.guardando&&j.vel>0&&!document.hidden;}
function msg(t,ms){var z=$("cs-aviso"); if(!z||!J)return; z.textContent=t; z.classList.add("on"); clearTimeout(J.tmsg); J.tmsg=setTimeout(function(){z.classList.remove("on");},ms||4000);}

/* acción del jugador: se aplica y se anota para el servidor */
function hace(a,b,c,d,e,f){
  var j=J; if(!j||j.solo)return false;
  if(j.guardando){msg("Un momento: guardando la ciudad…",1500);return false;}   /* lo hecho ahora no entraría en el tramo que se envía */
  if(!A.act(j.s,a,b,c,d,e,f))return false;
  var x=[j.s.segTick,a,b]; if(c!==undefined)x.push(c); if(d!==undefined)x.push(d); if(e!==undefined)x.push(e); if(f!==undefined)x.push(f);
  j.log.push(x);
  return true;
}

/* ---------- guardado por tramos ---------- */
function guarda(alSalir){
  var j=J; if(!j||j.solo||j.guardando)return Promise.resolve();
  j.guardando=true; estadoGuardado("Guardando…");
  var envio={a:j.log,fin:j.s.segTick};
  return api("/api/ciudad/guardar",{mundo:j.mundo.code,seg:j.seg,envio:envio}).then(function(r){
    if(J!==j)return;
    /* el tramo siguiente parte del estado que el servidor acaba de comprobar, con los encuentros que vio */
    var antes=j.s.contactos||[], nuevos=(r.contactos||[]).filter(function(x){return antes.indexOf(x)<0;});
    j.s.contactos=(r.contactos||[]).slice();
    var s=A.deserializa(A.serializa(j.s),r.seg); s.ev=[];
    if(nuevos.length){ SON.territorio(); $("cs-vec").classList.add("alerta");
      var v=vecinoSlot(nuevos[0]); msg("✨ ¡Encuentro de mundos! Tu influencia cultural llegó a "+(v?v.nombre+", la ciudad de "+v.jugador:"una ciudad vecina")+". Abre «Vecinos» para firmar un tratado.",9000);
      cargaVecinos(); }
    j.s=s; j.seg=r.seg; j.log=[]; j.guardando=false; j.ultGuardado=performance.now();
    j.rank=r.rank; j.total=r.total;
    estadoGuardado("✓ Guardado"+(r.rank?" · puesto #"+r.rank+" de "+r.total:""));
    if(!nuevos.length)cargaVecinos();   /* lo que hicieron las vecinas mientras tanto */
  }).catch(function(e){
    if(J!==j)return;
    j.guardando=false; j.ultGuardado=performance.now();
    if(e&&(e.error==="stale"||e.error==="bad_result"||e.error==="not_started")){
      estadoGuardado("Sin guardar"); para(); portada(ERR(e)+(e.error==="stale"?" Vuelve a entrar para seguir aquí.":""));
    } else if(e&&e.error==="closed"){ j.solo=true; estadoGuardado("Desafío terminado"); msg(ERR(e),6000); }
    else estadoGuardado(e instanceof TypeError?"⚠ Sin conexión: se reintentará":"⚠ No se pudo guardar: se reintentará");
  });
}
function estadoGuardado(t){var z=$("cs-guard"); if(z)z.textContent=t;}

/* ---------- lo que pasa en la ciudad ---------- */
function eventos(now){
  var j=J, s=j.s, ev=s.ev||[]; s.ev=[];
  ev.forEach(function(e){
    if(e.tipo==="crece"){ if(j.chispas.length<30)j.chispas.push({i:e.i,t0:now}); if(Math.random()<0.15)SON.crece(); }
    else if(e.tipo==="mes"){ var d=e.ing-e.gas-(e.deuda||0); j.ultMes=e; flota((d>=0?"+":"")+fmt(d)+" $",d>=0?"#2e7d32":"#c62828"); if(d>0)SON.mes(); }
    else if(e.tipo==="prestamo"){ SON.mes(); msg((e.k==="o"?"📜 Bonos emitidos: ":"🏦 Préstamo firmado: ")+"+"+fmt(e.monto)+" $ para invertir. Se devuelve cada mes con intereses (🏛️ Alcaldía → 💳).",6000); }
    else if(e.tipo==="saldada"){ msg("✅ "+A.DEUDA[e.k].nom+" de "+fmt(e.monto)+" $ pagado del todo. Costó "+fmt(e.intereses)+" $ de intereses.",6000); }
    else if(e.tipo==="devuelta"){ msg("✅ Deuda devuelta antes de tiempo: "+fmt(e.costo)+" $ con la comisión.",5000); }
    else if(e.tipo==="impago"){ SON.mal(); msg("🚨 Impago: al pagar la deuda la caja quedó en rojo. Tu calificación crediticia baja durante un año y pedir prestado saldrá más caro.",8000); }
    else if(e.tipo==="problema"){ var P=A.PROBLEMAS[e.p.k]; SON.alerta(); msg("⚠️ "+P.nom+": "+P.desc+" Toca «Problemas» para resolverlo.",7000); }
    else if(e.tipo==="era"){ var E=A.ERAS[e.n]; SON.territorio(); j.banner={t:E.ico+" "+E.nom,sub:"Tu ciudad entra en una nueva época de la historia",t0:now};
      msg("🎉 ¡Bienvenida a la "+E.nom+"! "+desbloquea(e.n),9000); herramientas(); }
    else if(e.tipo==="tratado"){ var v=vecinoSlot(e.slot); msg("🤝 Tratado firmado"+(v?" con "+v.nombre:"")+": ruta comercial abierta (+8 % de ingresos, más comercio y cultura).",7000); }
    else if(e.tipo==="vence"){ SON.mal(); msg("😞 No se resolvió «"+A.PROBLEMAS[e.k].nom+"»: −300 $ y la gente está molesta.",6000); }
  });
  var r=A.radio(s);
  if(r>j.radio){ j.radio=r; SON.territorio(); msg("🎭 ¡La cultura amplió tu territorio! Ahora tu radio es "+r+".",6000); }
}
function flota(t,c){var j=J; if(!j)return; j.flot.push({t:t,c:c,t0:performance.now()}); if(j.flot.length>4)j.flot.shift();}

/* ---------- HUD ---------- */
function hud(primera){
  var j=J; if(!j)return; var s=j.s, st=s.est||A.calcula(s);
  $("cs-nombre").textContent=s.nombre;
  $("cs-din").textContent=fmt(s.dinero); $("cs-din").parentNode.classList.toggle("mal",s.dinero<0);
  $("cs-pob").textContent=fmt(st.pob); $("cs-fel").textContent=st.felicidad+" %";
  if(st.sinLuz){$("cs-mw").textContent="—"; $("cs-mw-w").title="Sin electricidad hasta la Revolución Industrial";}
  else{$("cs-mw").textContent=fmt(st.mwUso)+"/"+fmt(st.mwCap); $("cs-mw-w").title="Electricidad: consumo / generación";}
  if(!st.sinLuz&&st.sinRedE){$("cs-mw").textContent+=" ⚠"+st.sinRedE; $("cs-mw-w").title=st.sinRedE+" zonas o edificios sin electricidad: falta generación o conexión (🔌 Redes)";}
  $("cs-mw-w").classList.toggle("mal",st.ratioMW<1);
  var rq=A.requisitos(s,s.era+1), listo=rq&&rq.every(function(x){return x.ok;});
  $("cs-era").innerHTML=eraNom(s.era)+(rq?' <small>'+(listo?'¡lista para avanzar!':Math.round(100*rq.reduce(function(a,x){return a+Math.min(1,x.v/x.meta);},0)/rq.length)+' %')+'</small>':'');
  $("cs-era").classList.toggle("listo",!!listo);
  $("cs-ag").textContent=fmt(st.agUso)+"/"+fmt(st.agCap)+(st.sinRedA?" ⚠"+st.sinRedA:"");
  $("cs-ag-w").title=st.sinRedA?st.sinRedA+" zonas o edificios sin agua: faltan bombas o tuberías (🔌 Redes)":"Agua: consumo / capacidad";
  $("cs-ag-w").classList.toggle("mal",st.ratioAg<1);
  var r=A.radio(s), sig=r<A.R?culturaPara(r+1):null;
  $("cs-cul").textContent=fmt(s.cultura)+(sig?"/"+fmt(sig):"");
  $("cs-con").textContent=s.conocimiento;
  barra("cs-dR",st.demR); barra("cs-dC",st.demC); barra("cs-dI",st.demI);
  var np=s.problemas.length, b=$("cs-nprob"); b.hidden=!np; b.textContent=np;
  $("cs-prob").classList.toggle("alerta",np>0);
  /* misión o meta del desafío */
  var m=-1; for(var k=0;k<MISIONES.length;k++)if(!MISIONES[k][1](s,st)){m=k;break;}
  var meta=j.mundo.meta, h="";
  if(meta){
    var p=[]; if(meta.pob)p.push(chipMeta("👥",st.pob,meta.pob)); if(meta.fel)p.push(chipMeta("😊",st.felicidad,meta.fel,"%")); if(meta.con)p.push(chipMeta("🧠",s.conocimiento,meta.con));
    h+='<span class="cs-meta"><b>Meta del desafío:</b> '+p.join(" ")+'</span>';
  }
  if(m>=0)h+='<span class="cs-mis">🎯 <b>Objetivo '+(m+1)+'/'+MISIONES.length+':</b> '+esc(MISIONES[m][0])+'</span>';
  else if(!meta)h+='<span class="cs-mis">🏆 ¡Todos los objetivos cumplidos! Sigue subiendo en el ranking.</span>';
  if(j.solo)h='<span class="cs-mis">🔒 Solo lectura</span>'+h;
  if(primera||m!==j.mision||h!==j.objH){ if(!primera&&m>j.mision&&j.mision>=0){SON.bien();msg("✅ Objetivo cumplido: "+MISIONES[j.mision][0],4000);} j.mision=m; j.objH=h; $("cs-obj").innerHTML=h; }
  /* precios y bloqueos de la barra */
  if(j.grupo)Array.prototype.forEach.call(document.querySelectorAll("#cs-sub [data-t]"),function(bt){
    var t=bt.getAttribute("data-t"), E=A.EDIF[t]; bt.classList.toggle("caro",s.dinero<E.costo*(t==="c"&&s.techs.transporte?0.5:1));
    var bloq=bloqueo(s,t); if(bt.classList.contains("bloq")!==!!bloq){herramientas();}
  });
}
function chipMeta(ico,v,m,suf){var ok=v>=m;return '<span class="cs-chip'+(ok?' ok':'')+'">'+ico+' '+fmt(v)+(suf||"")+' / '+fmt(m)+(suf||"")+(ok?' ✓':'')+'</span>';}
function barra(id,v){var z=$(id); if(!z)return; var f=Math.max(-1,Math.min(1,v/40)); z.style.setProperty("--d",f.toFixed(2)); z.classList.toggle("neg",f<0);}

/* ---------- barra de herramientas ---------- */
function herramientas(){
  var j=J; if(!j)return; var s=j.s;
  var tz=$("cs-tools"), sz=$("cs-sub");
  if(j.solo){tz.innerHTML='';sz.innerHTML='<p class="fine">Desafío terminado: puedes recorrer tu ciudad y la de tus compañeros.</p>';return;}
  tz.innerHTML=GRUPOS.map(function(g){
    var on=(g.k===j.grupo)||(g.k==="x"&&j.herr.k==="x")||(g.k==="info"&&j.herr.k==="info");
    return '<button type="button" data-g="'+g.k+'" aria-pressed="'+on+'"><span>'+g.ico+'</span><small>'+g.nom+'</small></button>';
  }).join("");
  var g=GRUPOS.filter(function(x){return x.k===j.grupo;})[0];
  if(g&&g.red){
    sz.innerHTML=[["e","⚡","Tendido eléctrico","Por encima de calles y campo: une las centrales con zonas separadas."],["a","🚿","Tubería de agua","Bajo tierra: lleva el agua de las bombas hasta las zonas."]].map(function(x){
      var bloq=x[0]==="e"&&s.era<3, sel=j.herr.k==="r"&&j.herr.t===x[0];
      return '<button type="button" data-red="'+x[0]+'" class="'+(bloq?'bloq ':'')+(sel?'sel':'')+'" aria-pressed="'+sel+'" title="'+esc(x[3])+'"><span class="cs-ico">'+x[1]+'</span><b>'+x[2]+'</b><small>'+
        (bloq?'🔒 '+esc(eraNom(3)):A.COSTO_RED[x[0]]+' $ por casilla')+'</small></button>';
    }).join("")+'<button type="button" data-subsuelo="1" class="'+(j.sub?'sel':'')+'" aria-pressed="'+!!j.sub+'"><span class="cs-ico">⛏️</span><b>Vista subterránea</b><small>'+(j.sub?'encendida':'ver las tuberías')+'</small></button>';
  } else if(g&&g.t){
    sz.innerHTML=g.t.map(function(t){
      var E=A.EDIF[t], bq=bloqueo(s,t), bloq=!!bq, c=E.costo*(t==="c"&&s.techs.transporte?0.5:1);
      return '<button type="button" data-t="'+t+'" class="'+(bloq?'bloq ':'')+(j.herr.t===t?'sel':'')+'" aria-pressed="'+(j.herr.t===t)+'" title="'+esc(DESC[t])+'">'+
        '<span class="cs-ico z'+t+'">'+ICO[t]+'</span><b>'+esc(E.nom)+'</b><small>'+(bq==="era"?'🔒 '+esc(eraNom(E.era)):bq?'🔒 '+esc(A.TECHS[E.tech].nom):fmt(c)+' $'+(E.mw?' · '+E.mw+' MW':'')+(E.agua?' · '+E.agua+' 💧':''))+'</small></button>';
    }).join("");
  } else if(j.herr.k==="x")sz.innerHTML='<p class="fine">🧨 Toca o arrastra sobre lo que quieras demoler (no devuelve el dinero).'+(j.sub?' En la vista subterránea se quitan tuberías.':'')+'</p>';
  else sz.innerHTML='<p class="fine">🔍 Toca una casilla para ver por qué crece (o no). Arrastra para moverte; acerca con la rueda o con dos dedos.</p>';
  Array.prototype.forEach.call(sz.querySelectorAll("[data-red]"),function(b){b.onclick=function(){
    var t=b.getAttribute("data-red");
    if(t==="e"&&s.era<3){msg("⚡ El tendido eléctrico llega con la Revolución Industrial: antes no hay electricidad.",4500); panelEpocas(); return;}
    var sel=j.herr.k==="r"&&j.herr.t===t; j.herr=sel?{k:"info"}:{k:"r",t:t}; j.sub=!sel&&t==="a";
    if(!sel)msg(t==="e"?"⚡ Tendido eléctrico: toca o arrastra para unir una central con zonas separadas por calles o campo. Las zonas y edificios contiguos ya se pasan la corriente.":
      "🚿 Tubería: toca o arrastra (va bajo tierra, también bajo calles y edificios) para llevar el agua de una bomba a zonas separadas.",7000);
    herramientas();
  };});
  Array.prototype.forEach.call(sz.querySelectorAll("[data-subsuelo]"),function(b){b.onclick=function(){j.sub=!j.sub; herramientas();};});
  Array.prototype.forEach.call(tz.querySelectorAll("[data-g]"),function(b){b.onclick=function(){
    var k=b.getAttribute("data-g");
    if(k!=="redes"&&k!=="x")j.sub=false;
    if(k==="x"||k==="info"){j.grupo=null;j.herr={k:k};}
    else{ j.grupo=j.grupo===k?null:k; if(!j.grupo)j.herr={k:"info"}; }
    cierraInfo(); herramientas();
  };});
  Array.prototype.forEach.call(sz.querySelectorAll("[data-t]"),function(b){b.onclick=function(){
    var t=b.getAttribute("data-t"), E=A.EDIF[t];
    var bq=bloqueo(s,t);
    if(bq==="era"){msg(E.nom+" llega con la época "+eraNom(E.era)+".",4000);panelEpocas();return;}
    if(bq){panelInvestigar(E.tech);return;}
    j.herr=j.herr.t===t?{k:"info"}:{k:"b",t:t};
    if(j.herr.t)msg(ICO[t]+" "+E.nom+": "+DESC[t],5000);
    herramientas();
  };});
}

/* ---------- ¿se puede construir aquí? (lo mismo que comprueba el motor) ---------- */
function motivo(t,dx,dy,gastado){
  var s=J.s;
  if(Math.abs(dx)>A.R||Math.abs(dy)>A.R)return "Fuera de tu territorio.";
  var i=A.idx(dx,dy);
  if(t==="x")return s.tipo[i]||s.cable[i]?null:"Aquí no hay nada que demoler.";
  if(t==="xa")return s.tubo[i]?null:"Aquí no hay tubería.";
  if(t==="re"||t==="ra"){
    if(!A.dentro(s,dx,dy))return "Fuera de tu territorio: la cultura 🎭 lo amplía.";
    if(terr(s.cx+dx,s.cy+dy)==="w")return "En el agua no se puede.";
    if(t==="re"){ if(s.era<3)return "El tendido eléctrico llega con la Revolución Industrial."; if(s.cable[i])return "Ya hay tendido aquí.";
      if(s.tipo[i]&&s.tipo[i]!=="c")return "Lo construido ya conduce la electricidad: no hace falta tendido."; }
    else if(s.tubo[i])return "Ya hay tubería aquí.";
    if(s.dinero-(gastado||0)<A.COSTO_RED[t[1]])return "Faltan $: cuesta "+A.COSTO_RED[t[1]]+".";
    return null;
  }
  var E=A.EDIF[t];
  if(!A.dentro(s,dx,dy))return "Fuera de tu territorio: la cultura 🎭 lo amplía.";
  if(s.tipo[i])return "Ya hay algo construido.";
  if(terr(s.cx+dx,s.cy+dy)==="w")return "En el agua no se construye.";
  if(E.era>s.era)return "Llega con la época "+eraNom(E.era)+".";
  if(E.tech&&!s.techs[E.tech])return "Primero investiga «"+A.TECHS[E.tech].nom+"».";
  if(E.junto){var ok=false;[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(v){if(terr(s.cx+dx+v[0],s.cy+dy+v[1])===E.junto)ok=true;}); if(!ok)return "Tiene que tocar el agua.";}
  if(s.dinero-(gastado||0)<A.costo(s,t,dx,dy))return "Faltan $: cuesta "+fmt(A.costo(s,t,dx,dy))+".";
  return null;
}
function arrastrable(h){return h.k==="x"||h.k==="r"||(h.k==="b"&&"cRCI".indexOf(h.t)>=0);}
/* la operación de la herramienta: un edificio (una letra), «re»/«ra» tendido o tubería, «x» demoler, «xa» quitar tubería */
function opDe(h){ if(h.k==="x")return J.sub?"xa":"x"; if(h.k==="r")return "r"+h.t; if(h.k==="b")return h.t; return null; }
function costoOp(op,dx,dy){ return op.length===2&&op[0]==="r"?A.COSTO_RED[op[1]]:op==="x"||op==="xa"?0:A.costo(J.s,op,dx,dy); }
/* casillas de un arrastre: las calles en «L», las zonas y la demolición en rectángulo (hasta 12×12) */
function casillasArrastre(a,b,t){
  var out=[], x, y;
  if(t==="c"||t==="re"||t==="ra"){
    var sx=b.x>=a.x?1:-1, sy=b.y>=a.y?1:-1;
    for(x=a.x;x!==b.x+sx;x+=sx)out.push({x:x,y:a.y});
    for(y=a.y+sy;y!==b.y+sy;y+=sy)if(b.y!==a.y)out.push({x:b.x,y:y});
    return out.slice(0,80);
  }
  var x0=Math.min(a.x,b.x), x1=Math.min(Math.max(a.x,b.x),x0+11), y0=Math.min(a.y,b.y), y1=Math.min(Math.max(a.y,b.y),y0+11);
  for(x=x0;x<=x1;x++)for(y=y0;y<=y1;y++)out.push({x:x,y:y});
  return out;
}
function construye(lista,t){
  var j=J, s=j.s, n=0, gast=0, ult=null;
  lista.forEach(function(c){
    var dx=c.x-s.cx, dy=c.y-s.cy, m=motivo(t,dx,dy);
    if(m){ult=m;return;}
    if(t==="x"){if(hace("x",dx,dy))n++;}
    else if(t==="xa"){if(hace("x",dx,dy,"a"))n++;}
    else{var co=costoOp(t,dx,dy); if(t[0]==="r"&&t.length===2?hace("r",dx,dy,t[1]):hace("b",dx,dy,t)){n++;gast+=co;}}
  });
  var quita=t==="x"||t==="xa";
  if(n){ if(quita)SON.quita(); else SON.pon(); if(n>1)msg((quita?"Demoliste ":"Construiste ")+n+" casillas"+(gast?" por "+fmt(gast)+" $":"")+".",2500); }
  else if(ult){SON.no();msg(ult,3500);}
}

/* ===================== PANTALLAS SOBRE EL MAPA ===================== */
function abreModal(html){var j=J; j.modal=true; $("cs-mc").innerHTML=html; $("cs-modal").hidden=false; var x=$("cs-mc").querySelector(".cs-x"); if(x)x.onclick=cierraModal;}
function cierraModal(){var j=J; if(!j)return; if(j.qActiva)return; j.modal=false; $("cs-modal").hidden=true; $("cs-mc").innerHTML="";}
function cab(t){return '<div class="cs-mh"><b>'+t+'</b><button type="button" class="cs-x" aria-label="Cerrar">✕</button></div>';}

function panelInvestigar(resalta){
  var j=J, s=j.s;
  var h=cab("🔬 Investigación")+'<p class="cs-nota">Cada tecnología se investiga acertando una pregunta de su tema. Si fallas, espera 30 s para intentarlo de nuevo con otra pregunta. Algunas llegan con una época más avanzada (<a href="#" id="cs-a-eras">⏳ épocas</a>).</p><div class="cs-lista">';
  Object.keys(A.TECHS).forEach(function(k){
    var T=A.TECHS[k], hecha=!!s.techs[k], falta=(T.req||[]).filter(function(r){return !s.techs[r];}), cool=Math.max(0,((s.techCool[k]||0)-s.tick)*A.TICK/1000);
    h+='<div class="cs-it'+(hecha?' hecha':'')+(k===resalta?' resalta':'')+'"><div><b>'+(hecha?'✅ ':'')+esc(T.nom)+'</b><small>'+esc(T.desc)+' · Tema: '+esc(A.TEMAS[T.tema])+'</small>'+
      (falta.length&&!hecha?'<small class="cs-req">Requiere: '+falta.map(function(r){return esc(A.TECHS[r].nom);}).join(", ")+'</small>':'')+
      (!hecha&&T.era>s.era?'<small class="cs-req">Llega con la época '+esc(eraNom(T.era))+'</small>':'')+'</div>'+
      (hecha?'':T.era>s.era?'<span class="cs-bloq">🔒</span>':falta.length?'<span class="cs-bloq">🔒</span>':cool>0?'<span class="cs-bloq">'+Math.ceil(cool)+' s</span>':
        (j.solo?'':'<button type="button" class="primary" data-tech="'+k+'">Investigar</button>'))+'</div>';
  });
  abreModal(h+'</div>');
  $("cs-a-eras").onclick=function(e){e.preventDefault();panelEpocas();};
  Array.prototype.forEach.call(document.querySelectorAll("[data-tech]"),function(b){b.onclick=function(){var k=b.getAttribute("data-tech");pregunta("t:"+k,A.TECHS[k].tema,"🔬 "+A.TECHS[k].nom);};});
  var el=document.querySelector(".cs-it.resalta"); if(el&&el.scrollIntoView)el.scrollIntoView({block:"center"});
}
function panelProblemas(){
  var j=J, s=j.s;
  var h=cab("⚠️ Problemas de la ciudad")+'<p class="cs-nota">Aparecen según lo que le falta a tu ciudad. Resuélvelos acertando una pregunta de su tema antes de que se acabe el plazo: ganas 400 $ y un premio. Si fallas, el plazo se acorta.</p><div class="cs-lista">';
  if(!s.problemas.length)h+='<p class="fine">No hay problemas ahora mismo. 🎉 Resueltos: '+s.resueltos+'.</p>';
  s.problemas.forEach(function(p){
    var P=A.PROBLEMAS[p.k], queda=Math.max(0,(p.vence-s.tick)*A.TICK/1000);
    h+='<div class="cs-it prob"><div><b>'+esc(P.nom)+'</b><small>'+esc(P.desc)+' · Tema: '+esc(A.TEMAS[P.tema])+'</small><small class="cs-req">Quedan '+seg2(queda)+(p.intentos?' · '+p.intentos+' fallo'+(p.intentos>1?'s':''):'')+' · Premio: '+esc(premioTxt(p.k))+'</small></div>'+
      (j.solo?'':'<button type="button" class="primary" data-prob="'+p.id+'">Resolver</button>')+'</div>';
  });
  abreModal(h+'</div><p class="cs-nota">Consejo: un problema que no se resuelve vuelve a aparecer si la causa sigue (por ejemplo, falta de energía). Arregla también la causa.</p>');
  Array.prototype.forEach.call(document.querySelectorAll("[data-prob]"),function(b){b.onclick=function(){
    var id=parseInt(b.getAttribute("data-prob"),10), p=s.problemas.filter(function(x){return x.id===id;})[0]; if(!p)return panelProblemas();
    pregunta("p:"+id,A.PROBLEMAS[p.k].tema,"⚠️ "+A.PROBLEMAS[p.k].nom);};});
}
function premioTxt(k){return {apagon:"+10 MW",sequia:"+15 de agua",smog:"aire más limpio",feria:"+15 de cultura"}[k]||"+felicidad un rato";}

/* la pregunta: la ciudad se detiene mientras se responde */
function pregunta(obj,tema,titulo){
  var j=J, s=j.s;
  if(j.qActiva)return;
  var probK=null;
  if(obj.charAt(0)==="p"){var pr=s.problemas.filter(function(x){return x.id===+obj.slice(2);})[0]; if(!pr)return; probK=pr.k;}
  var eraQ=obj.charAt(0)==="e"?+obj.slice(2):0;
  j.qActiva=true;
  abreModal('<div class="cs-mh"><b>'+esc(titulo)+'</b><span class="cs-tema">'+esc(A.TEMAS[tema])+'</span></div><p class="fine">Buscando una pregunta…</p>');
  api("/api/ciudad/pregunta",{mundo:j.mundo.code,tema:tema,evita:Object.keys(s.qUsadas),era:eraQ||undefined}).then(function(q){
    if(J!==j)return;
    if(q.seg!==j.seg){j.qActiva=false;cierraModal();msg("La ciudad se está guardando; vuelve a intentarlo.");return;}
    var t0=Date.now(), hecho=false;
    $("cs-mc").innerHTML='<div class="cs-mh"><b>'+esc(titulo)+'</b><span class="cs-tema">'+esc(A.TEMAS[tema])+'</span></div>'+
      '<p class="cs-qt">'+esc(q.q)+'</p><div class="cs-qo">'+q.o.map(function(o,i){return '<button type="button" data-o="'+i+'">'+esc(o)+'</button>';}).join("")+'</div>'+
      '<div class="cs-qb"><i id="cs-qb"></i></div><p class="cs-qn" id="cs-qn">Tienes '+PREG_S+' segundos. La ciudad espera.</p>';
    var tq=setInterval(function(){var f=1-(Date.now()-t0)/(PREG_S*1000); var b=$("cs-qb"); if(b)b.style.width=Math.max(0,f*100)+"%"; if(f<=0)elige(-1);},100);
    Array.prototype.forEach.call(document.querySelectorAll("#cs-mc [data-o]"),function(b){b.onclick=function(){elige(parseInt(b.getAttribute("data-o"),10));};});
    function elige(o){
      if(hecho)return; hecho=true; clearInterval(tq);
      if(J!==j||q.seg!==j.seg){j.qActiva=false;cierraModal();return;}
      Array.prototype.forEach.call(document.querySelectorAll("#cs-mc [data-o]"),function(b){b.disabled=true; if(+b.getAttribute("data-o")===o)b.classList.add("sel");});
      api("/api/ciudad/responde",{mundo:j.mundo.code,id:q.id,o:o}).then(function(r){
        if(J!==j)return;
        Array.prototype.forEach.call(document.querySelectorAll("#cs-mc [data-o]"),function(b){var k=+b.getAttribute("data-o"); if(k===r.correcta)b.classList.add("bien"); else if(k===r.o)b.classList.add("mal");});
        var ok=hace("q",r.o,0,q.id,obj,r.ok), txt;
        if(!ok)txt="No se pudo aplicar (¿el problema ya se resolvió?).";
        else if(obj.charAt(0)==="t"){var T=A.TECHS[obj.slice(2)]; txt=r.ok?"✅ ¡Correcto! Investigaste «"+T.nom+"». "+T.desc:"❌ No era esa. Podrás volver a intentarlo en 30 s con otra pregunta.";}
        else if(obj.charAt(0)==="e")txt=r.ok?"✅ ¡Correcto! Tu ciudad entra en la "+A.ERAS[eraQ].nom+".":"❌ No era esa. Repasa y vuelve a intentarlo en 30 s.";
        else if(obj.charAt(0)==="r")txt=r.ok?"✅ ¡Correcto! Tratado firmado: se abre una ruta comercial.":"❌ No era esa. Podrás proponer el tratado otra vez en 30 s.";
        else txt=r.ok?"✅ ¡Correcto! Problema resuelto: +400 $ y "+premioTxt(probK)+".":"❌ No era esa: el plazo del problema se acorta 10 s.";
        if(r.ok){SON[obj.charAt(0)==="p"?"bien":"tech"]();}else SON.mal();
        $("cs-qn").innerHTML='<b class="'+(r.ok?'cs-ok':'cs-no')+'">'+esc(txt)+'</b>'+(r.dato?'<span class="cs-dato">💡 '+esc(r.dato)+'</span>':'')+
          '<span class="actions"><button type="button" class="primary" id="cs-qsig">Seguir</button></span>';
        $("cs-qsig").onclick=function(){j.qActiva=false;cierraModal();herramientas();hud();};
      }).catch(function(e){ if(J!==j)return; j.qActiva=false; cierraModal(); msg(ERR(e),5000); });
    }
  }).catch(function(e){ if(J!==j)return; j.qActiva=false; cierraModal(); msg(ERR(e),5000); });
}

/* lo que trae cada época */
function desbloquea(n){
  var ed=Object.keys(A.EDIF).filter(function(t){return A.EDIF[t].era===n;}).map(function(t){return A.EDIF[t].nom;});
  var te=Object.keys(A.TECHS).filter(function(k){return A.TECHS[k].era===n;}).map(function(k){return A.TECHS[k].nom;});
  var p=[];
  if(A.ERAS[n].tope>(A.ERAS[n-1]||{tope:0}).tope)p.push("zonas hasta el nivel "+A.ERAS[n].tope+(n>=4?" (con Rascacielos)":""));
  if(ed.length)p.push("edificios: "+ed.join(", "));
  if(te.length)p.push("tecnologías: "+te.join(", "));
  if(n===3)p.push("la electricidad: desde ahora las zonas necesitan energía conectada a una central (llega una primera red que cubre lo que ya consumes) y el tendido eléctrico para unir zonas separadas");
  p.push("+"+A.INFLU+" de influencia cultural");
  return "Trae "+p.join("; ")+".";
}
function panelEpocas(){
  var j=J, s=j.s;
  var h=cab("⏳ Épocas de la historia")+'<p class="cs-nota">Tu ciudad recorre la historia. Para pasar a la siguiente época llega a sus metas y acierta una pregunta de historia de esa época. Cada época cambia el aspecto de la ciudad, desbloquea edificios y lleva más lejos su influencia cultural.</p><div class="cs-lista">';
  A.ERAS.forEach(function(E,n){
    var rq=A.requisitos(s,n), listo=rq&&rq.every(function(x){return x.ok;}), cool=Math.max(0,(s.eraCool-s.tick)*A.TICK/1000);
    h+='<div class="cs-it'+(n<=s.era?' hecha':'')+(n===s.era+1?' resalta':'')+'"><div><b>'+(n<s.era?'✅ ':n===s.era?'📍 ':'')+E.ico+' '+esc(E.nom)+(n===s.era?' · tu época':'')+'</b>'+
      (n>0?'<small>'+esc(desbloquea(n))+'</small>':'<small>Calles de tierra, casas de adobe, mercados y talleres. Sin electricidad.</small>')+
      (rq?'<span class="cs-reqs">'+rq.map(function(x){var f=Math.min(1,x.v/x.meta);return '<span class="'+(x.ok?'ok':'')+'"><i style="--p:'+Math.round(f*100)+'%"></i>'+x.nom+' '+fmt(x.v)+'/'+fmt(x.meta)+'</span>';}).join("")+'</span>':'')+
      '</div>'+(rq&&!j.solo?(listo?(cool>0?'<span class="cs-bloq">'+Math.ceil(cool)+' s</span>':'<button type="button" class="primary" data-era="'+n+'">Avanzar</button>'):'<span class="cs-bloq">🔒</span>'):'')+'</div>';
  });
  abreModal(h+'</div>');
  Array.prototype.forEach.call(document.querySelectorAll("[data-era]"),function(b){b.onclick=function(){var n=+b.getAttribute("data-era"); pregunta("e:"+n,"historia","⏳ Hacia la "+A.ERAS[n].nom);};});
  var el=document.querySelector(".cs-it.resalta"); if(el&&el.scrollIntoView)el.scrollIntoView({block:"center"});
}
function vecinoSlot(slot){return J.vecinos.filter(function(v){return v.slot===slot;})[0]||null;}
function panelVecinos(){
  var j=J, s=j.s, mia=A.influencia(s);
  $("cs-vec").classList.remove("alerta");
  var h=cab("🌍 Vecinos y encuentros")+'<p class="cs-nota">Tus vecinos son las ciudades de las ranuras de al lado. Tu <b>influencia cultural</b> (territorio + '+A.INFLU+' por época, ahora '+mia+' casillas) se extiende por el mundo: cuando toca la de una vecina, vuestras ciudades se encuentran y podéis firmar un <b>tratado</b> (una pregunta de cultura) que abre una ruta comercial: +8 % de ingresos, más comercio y más cultura. Los encuentros se actualizan al guardar.</p><div class="cs-lista">';
  if(!j.vecinos.length)h+='<p class="fine">Todavía no tienes vecinos cerca. Cuando otras personas funden su ciudad junto a la tuya, aparecerán en el mapa.</p>';
  j.vecinos.forEach(function(v,i){
    var firmado=!!s.tratados[v.slot], contacto=(s.contactos||[]).indexOf(v.slot)>=0, cool=Math.max(0,((s.tratCool[v.slot]||0)-s.tick)*A.TICK/1000);
    var f=Math.min(1,(mia+v.influencia)/v.distancia);
    h+='<div class="cs-it'+(firmado?' hecha':contacto?' resalta':'')+'"><div><b>🏙️ '+esc(v.nombre)+' <small style="display:inline">'+esc(eraNom(v.era))+'</small></b><small>de '+esc(v.jugador)+' · 👥 '+fmt(v.pob)+' · ⭐ '+fmt(v.puntaje)+'</small>'+
      (firmado?'<small class="cs-ok">🤝 Tratado firmado: ruta comercial activa.'+(v.conmigo?' '+esc(v.nombre)+' también lo firmó.':'')+'</small>':
        contacto?'<small class="cs-req">✨ ¡Encuentro! Vuestras culturas se tocan: podéis firmar un tratado.'+(v.conmigo?' <b>'+esc(v.nombre)+' ya lo firmó contigo.</b>':'')+'</small>':
        '<span class="cs-reqs"><span><i style="--p:'+Math.round(f*100)+'%"></i>Influencias '+mia+' + '+v.influencia+' de '+Math.round(v.distancia)+' casillas</span></span>')+'</div>'+
      '<span class="cs-acc">'+(contacto&&!firmado&&!j.solo?(cool>0?'<span class="cs-bloq">'+Math.ceil(cool)+' s</span>':'<button type="button" class="primary" data-trat="'+v.slot+'">Firmar tratado</button>'):'')+
      '<button type="button" class="ghost" data-vec="'+i+'">Ver</button></span></div>';
  });
  abreModal(h+'</div><h4>Ranking de '+esc(j.mundo.nombre)+'</h4><div id="cs-rank2"><p class="fine">Cargando…</p></div>');
  Array.prototype.forEach.call(document.querySelectorAll("[data-trat]"),function(b){b.onclick=function(){var v=vecinoSlot(+b.getAttribute("data-trat")); pregunta("r:"+v.slot,"cultura","🤝 Tratado con "+v.nombre);};});
  Array.prototype.forEach.call(document.querySelectorAll("[data-vec]"),function(b){b.onclick=function(){var v=j.vecinos[+b.getAttribute("data-vec")]; cierraModal(); vuela(v.cx,v.cy); msg("🏙️ "+v.nombre+", de "+v.jugador+". Toca 🎯 para volver.",5000);};});
  rankingEn($("cs-rank2"),j.mundo.code);
}
function panelAlcaldia(){
  var j=J, s=j.s, st=s.est||A.calcula(s), m=j.ultMes;
  var h=cab("🏛️ Alcaldía de "+esc(s.nombre));
  if(!j.solo)h+='<label class="cs-campo">Nombre de la ciudad<span><input id="cs-nnom" maxlength="30" value="'+esc(s.nombre)+'"><button type="button" class="ghost" id="cs-nok">Cambiar</button></span></label>'+
    '<label class="cs-campo">Impuestos: <b id="cs-imp-v">'+s.impuesto+' %</b><input type="range" id="cs-imp" min="6" max="14" step="1" value="'+s.impuesto+'">'+
    '<small>Más impuestos dan más dinero cada mes, pero bajan la felicidad y frenan el crecimiento.</small></label>';
  h+='<div class="cs-fin"><span>Ingresos del mes<b>'+(m?fmt(m.ing):"—")+' $</b></span><span>Gastos del mes<b>'+(m?fmt(m.gas):"—")+' $</b></span>'+
    '<span>Empleos<b>'+fmt(st.empC+st.empI)+'</b></span><span>Territorio<b>radio '+A.radio(s)+'</b></span>'+
    '<span>Seguridad<b>'+Math.round(st.cob.seg*100)+' %</b></span><span>Bomberos<b>'+Math.round(st.cob.fue*100)+' %</b></span>'+
    '<span>Salud<b>'+Math.round(st.cob.sal*100)+' %</b></span><span>Educación<b>'+Math.round(st.cob.edu*100)+' %</b></span>'+
    '<span>Problemas resueltos<b>'+s.resueltos+'</b></span><span>Puntaje<b>'+fmt(A.puntaje(s))+'</b></span>'+
    '<span>Época<b>'+esc(eraNom(s.era))+'</b></span><span>Rutas comerciales<b>'+A.rutas(s)+(A.rutas(s)?' · +'+(8*Math.min(5,A.rutas(s)))+' %':'')+'</b></span>'+
    '<span>Pago de deuda del mes<b>'+(m&&m.deuda?fmt(m.deuda):"0")+' $</b></span><span>Deuda viva<b>'+fmt(A.deudaViva(s))+' $ · '+A.CALIF[A.calificacion(s,st)]+'</b></span></div>'+
    '<button type="button" class="primary cs-bdeuda" id="cs-deuda">💳 Deuda e inversión: préstamos y bonos</button>';
  var temas=Object.keys(s.temas);
  h+='<h4>Tus aciertos por tema</h4>'+(temas.length?'<div class="cs-temas">'+temas.map(function(t){var x=s.temas[t],p=Math.round(100*x[0]/Math.max(1,x[1]));
    return '<span><b>'+esc(A.TEMAS[t]||t)+'</b><i style="--p:'+p+'%"></i><small>'+x[0]+'/'+x[1]+'</small></span>';}).join("")+'</div>':'<p class="fine">Todavía no respondiste preguntas.</p>');
  h+='<h4>Objetivos</h4><ol class="cs-mlist">'+MISIONES.map(function(x){var ok=x[1](s,st);return '<li class="'+(ok?'ok':'')+'">'+(ok?'✅ ':'⬜ ')+esc(x[0])+'</li>';}).join("")+'</ol>'+
    '<p class="cs-nota">Puntaje = habitantes × felicidad + 30 por cada acierto + cultura.</p>';
  abreModal(h);
  $("cs-deuda").onclick=panelDeuda;
  if($("cs-imp")){
    $("cs-imp").oninput=function(){$("cs-imp-v").textContent=this.value+" %";};
    $("cs-imp").onchange=function(){var v=parseInt(this.value,10); if(v!==s.impuesto&&hace("i",v)){SON.pon();msg("Impuestos al "+v+" %.");}};
    $("cs-nok").onclick=function(){var n=$("cs-nnom").value.replace(/\s+/g," ").trim(); if(n&&n!==s.nombre&&hace("n",0,0,n)){SON.pon();hud(true);msg("Ahora tu ciudad se llama "+n+".");}};
  }
}
/* ---------- deuda pública: préstamos bancarios y bonos municipales para invertir ---------- */
var MONTOS=[500,1000,2000,3000,5000,8000,12000,20000,30000,50000,80000];
function panelDeuda(){
  var j=J, s=j.s, st=s.est||A.calcula(s), n=A.calificacion(s,st), anual=A.ingresos(s,st)*12, of0=A.oferta(s,"b");
  var h=cab("💳 Deuda e inversión");
  h+='<p class="cs-nota">Como una alcaldía de verdad: pide prestado para <b>invertir</b> (hospitales, universidad, centrales, depuradoras) y devuélvelo cada mes con intereses. Un mes del juego son 10 s.</p>';
  h+='<div class="cs-fin">'+
    '<span>Calificación crediticia<b class="cs-calif c'+n+'">'+A.CALIF[n]+'</b></span>'+
    '<span>Deuda viva<b>'+fmt(A.deudaViva(s))+' $</b></span>'+
    '<span>Ingresos de un año<b>'+fmt(anual)+' $</b></span>'+
    '<span>Límite legal (110 %)<b>'+fmt(of0.limite)+' $</b></span>'+
    '<span>Pago de deuda al mes<b>'+fmt(A.servicioDeuda(s))+' $</b></span>'+
    '<span>Puedes pedir hasta<b>'+fmt(n>=5?0:of0.max)+' $</b></span></div>';
  var ds=s.deuda||[];
  h+='<h4>Tus deudas</h4>'+(ds.length?'<div class="cs-deudas">'+ds.map(function(d){
    var P=A.DEUDA[d.k], pago=d.k==="b"?d.cuota:Math.round(d.cap*d.tasa*100)/100, cst=d.cap*(1+P.comision);
    return '<div class="cs-deu"><div><b>'+(d.k==="o"?"📜 ":"🏦 ")+P.nom+' · '+fmt(d.monto)+' $</b>'+
      '<small>'+(d.tasa*1200).toFixed(1).replace(".",",")+' % anual · '+(d.k==="b"?'cuota '+fmt(pago)+' $/mes':'cupón '+fmt(pago)+' $/mes y '+fmt(d.cap)+' $ al vencer')+
      ' · quedan '+d.n+' de '+d.plazo+' meses</small>'+
      '<i class="cs-dbar" style="--p:'+Math.round(100*(1-d.cap/d.monto))+'%"></i><small>Pendiente '+fmt(d.cap)+' $ · intereses pagados '+fmt(d.intereses||0)+' $</small></div>'+
      (j.solo?'':'<button type="button" class="ghost" data-dev="'+d.id+'"'+(s.dinero<cst?' disabled':'')+'>Devolver ya<br><small>'+fmt(cst)+' $ ('+Math.round(P.comision*100)+' %)</small></button>')+'</div>';
  }).join("")+'</div>':'<p class="fine">Tu ciudad no debe nada.</p>');
  if(!j.solo){
    h+='<h4>Pedir dinero</h4><div class="cs-pide">'+
      '<label>Tipo<select id="cs-dk"><option value="b">🏦 Préstamo bancario</option><option value="o"'+(s.era<3?' disabled':'')+'>📜 Bonos municipales'+(s.era<3?' (Revolución Industrial)':'')+'</option></select></label>'+
      '<label>Plazo<select id="cs-dp"></select></label><label>Monto<select id="cs-dm"></select></label></div>'+
      '<div class="cs-oferta" id="cs-of"></div><button type="button" class="primary" id="cs-dok">Firmar</button>';
  }
  h+='<details class="cs-como"><summary>¿Cómo funciona la deuda de una ciudad?</summary><ul>'+
    '<li><b>Regla de oro:</b> endeudarse para invertir en obras que duran décadas y se pagan con los impuestos de los años siguientes; no para pagar los gastos de cada mes.</li>'+
    '<li><b>Préstamo bancario</b> (8 % anual): cuota fija cada mes (sistema francés). Al principio la cuota es casi todo intereses; al final, casi todo capital.</li>'+
    '<li><b>Bonos municipales</b> (5 % anual, desde la Revolución Industrial): la ciudad vende bonos a inversores, les paga un cupón de intereses cada mes y les devuelve todo el capital al vencer. Son más baratos, pero hay que tener el dinero al final.</li>'+
    '<li><b>Más plazo, más interés</b>: +0,5 % anual por cada año extra, porque el riesgo es mayor.</li>'+
    '<li><b>Calificación crediticia</b> (como las de S&amp;P, Moody\'s o Fitch): de AAA, la mejor, a B. Depende de cuánto debes frente a lo que ingresas en un año, de los impagos y de tener la caja en rojo. Cada escalón encarece el interés; con B nadie presta. Saber de economía (3 aciertos del tema) la mejora un escalón.</li>'+
    '<li><b>Límite legal</b>: la deuda viva no puede pasar del 110 % de los ingresos de un año, como en muchas leyes de haciendas locales.</li>'+
    '<li><b>Impago</b>: si al pagar la deuda la caja queda en rojo, la calificación baja dos escalones durante un año.</li>'+
    '<li><b>Devolver antes</b> cuesta una comisión: 1 % el préstamo y 2 % recomprar los bonos.</li>'+
    '<li><b>Un poco de historia:</b> en la Antigüedad prestaban los templos y los banqueros; en el Renacimiento, bancos como el de los Médici prestaban a ciudades y reyes, y Venecia y Génova ya tenían deuda pública; en el siglo XIX los bonos municipales pagaron el agua, el gas y los tranvías de las ciudades.</li></ul></details>';
  abreModal(h);
  Array.prototype.forEach.call(document.querySelectorAll("[data-dev]"),function(b){b.onclick=function(){
    if(hace("v",+b.getAttribute("data-dev"))){SON.pon(); hud(true); panelDeuda();} else msg("No alcanza el dinero para devolverla ahora.",3000);};});
  if(j.solo)return;
  var dk=$("cs-dk"), dp=$("cs-dp"), dm=$("cs-dm");
  function opciones(){
    var k=dk.value, P=A.DEUDA[k], pl=+dp.value;
    dp.innerHTML=P.plazos.map(function(x){return '<option value="'+x+'"'+(x===pl?' selected':'')+'>'+x+' meses ('+(x*10/60).toFixed(0)+' min de juego)</option>';}).join("");
    var of=A.oferta(s,k,+dp.value), mm=+dm.value;
    var lista=MONTOS.filter(function(x){return x<=of.max;}); if(of.max>=500&&lista.indexOf(of.max)<0)lista.push(of.max);
    dm.innerHTML=lista.map(function(x){return '<option value="'+x+'"'+(x===mm?' selected':'')+'>'+fmt(x)+' $</option>';}).join("");
    if(!dm.value&&lista.length)dm.value=lista[0];
    var z=$("cs-of"), ok=$("cs-dok");
    if(!of.ok||!lista.length){ z.innerHTML='<span class="cs-bloq">'+esc(of.motivo||"No hay oferta.")+'</span>'; ok.disabled=true; return; }
    var M=+dm.value, n2=+dp.value, cuota=k==="b"?A.cuotaFrancesa(M,of.tasa,n2):Math.round(M*of.tasa*100)/100, total=k==="b"?cuota*n2:cuota*n2+M;
    z.innerHTML='<span>Interés<b>'+(of.anual*100).toFixed(1).replace(".",",")+' % anual</b><small>calificación '+of.nota+'</small></span>'+
      '<span>'+(k==="b"?'Cuota fija':'Cupón')+'<b>'+fmt(cuota)+' $/mes</b><small>'+(k==="b"?'intereses + capital':'+ '+fmt(M)+' $ al vencer')+'</small></span>'+
      '<span>Devuelves en total<b>'+fmt(total)+' $</b><small>'+fmt(total-M)+' $ de intereses</small></span>';
    ok.disabled=false; ok.textContent=k==="b"?"🏦 Firmar el préstamo de "+fmt(M)+" $":"📜 Emitir "+fmt(M)+" $ en bonos";
  }
  dk.onchange=function(){dp.value=""; opciones();}; dp.onchange=opciones; dm.onchange=opciones; opciones();
  $("cs-dok").onclick=function(){
    var k=dk.value, M=+dm.value, n2=+dp.value;
    if(hace("p",M,n2,k)){ hud(true); panelDeuda(); } else msg("El banco no aprobó ese monto: revisa el límite.",3500);
  };
}
function cierraInfo(){var z=$("cs-info"); if(z){z.hidden=true;z.innerHTML="";} if(J)J.sel=null;}
/* qué hay en una casilla y por qué crece o no */
function info(c){
  var j=J, s=j.s, dx=c.x-s.cx, dy=c.y-s.cy, z=$("cs-info");
  var mio=Math.abs(dx)<=A.R&&Math.abs(dy)<=A.R, i=mio?A.idx(dx,dy):-1, t=mio?s.tipo[i]:"", h="";
  var tr=terr(c.x,c.y), tn={g:"Pradera",w:"Agua",f:"Bosque"}[tr];
  j.sel=c;
  if(!mio||(!t&&!A.dentro(s,dx,dy))){
    var v=vecinoEn(c.x,c.y);
    if(v&&v.t)h='<b>'+ICO[v.t]+' '+esc(A.EDIF[v.t].nom)+(v.l?' · nivel '+v.l:'')+'</b><small>En '+esc(v.v.nombre)+', la ciudad de '+esc(v.v.jugador)+'.</small>';
    else h='<b>'+tn+'</b><small>'+(v?'Territorio de '+esc(v.v.nombre)+'.':'Fuera de tu territorio. La cultura 🎭 lo amplía.')+'</small>';
  } else if(!t){
    h='<b>'+tn+'</b><small>'+(tr==="w"?"No se puede construir en el agua.":tr==="f"?"Construir aquí cuesta 15 $ más (hay que talar).":"Libre para construir.")+'</small>';
  } else {
    var E=A.EDIF[t], l=s.nivel[i], m=A.mapas(s), st=s.est||A.calcula(s);
    h='<b>'+ICO[t]+' '+esc(E.nom)+(E.zona?' · nivel '+l+'/'+A.tope(s):'')+'</b>';
    if(E.zona){
      var habit=t==="R"?A.POB[l]+" habitantes":t==="C"?A.EMPC[l]+" empleos":A.EMPI[l]+" empleos";
      var dem=t==="R"?st.demR:t==="C"?st.demC:st.demI, frena=[];
      if(!A.calle(s,dx,dy))frena.push("no tiene calle al lado");
      var rEc=st.redE[m.redE.comp[i]], rAc=st.redA[m.redA.comp[i]];
      if(!st.sinLuz&&rEc<0.95)frena.push(rEc<0.05?"no está conectada a ninguna central (usa ⚡ tendido de 🔌 Redes)":"a su red le falta electricidad");
      if(l>=1&&rAc<0.95)frena.push(rAc<0.05?"no le llega el agua (lleva una 🚿 tubería de 🔌 Redes)":"a su red le falta agua");
      if(dem<=0)frena.push("no hay demanda "+t+" (mira las barras R C I)");
      if(l>=A.tope(s))frena.push("ya llegó al nivel máximo de la "+A.ERAS[s.era].nom+(s.era<5?" (la próxima época lo sube)":""));
      if(m.cont[i]>2&&t!=="I")frena.push("hay mucha contaminación");
      if(l>=2&&!m.cov.edu[i]&&t!=="I")frena.push("sin escuela cerca no pasa del nivel 2");
      if(t!=="I"){var vq2=m.valor[i], rq2=A.riqueza(vq2);
        habit+=' · '+(t==="R"?["barrio popular","clase media","barrio acomodado"][rq2]:["comercio de barrio","comercio de clase media","comercio de lujo"][rq2])+' (valor del suelo '+Math.round(vq2*100)+' %'+(rq2===2?', paga más impuestos':'')+')';}
      h+='<small>'+habit+'.</small>'+(t!=="I"&&A.riqueza(m.valor[i])<2?'<small>💡 Parques, cultura, servicios y agua cerca suben el valor; la contaminación lo baja.</small>':'')+(frena.length?'<small class="cs-req">No crece porque '+frena.join(", ")+'.</small>':'<small class="cs-ok">Puede seguir creciendo.</small>');
      h+='<span class="cs-cob">'+[["seg","🚓"],["fue","🚒"],["sal","🏥"],["edu","🏫"]].map(function(x){return '<i class="'+(m.cov[x[0]][i]?'si':'no')+'">'+x[1]+'</i>';}).join("")+
        '<i class="'+(m.cont[i]>1.5?'no':'si')+'">🌫️ '+m.cont[i].toFixed(1)+'</i></span>';
    } else h+='<small>'+esc(DESC[t])+'</small><small>Mantenimiento: '+E.mant+' $ por mes.</small>';
    if(t!=="c"){ var rE2=st.redE[m.redE.comp[i]], rA2=st.redA[m.redA.comp[i]];
      h+='<span class="cs-cob">'+(st.sinLuz?'':'<i class="'+(rE2>=0.95?'si':'no')+'">⚡ '+(rE2>=0.95?'conectada':Math.round(rE2*100)+' %')+'</i>')+
        '<i class="'+(rA2>=0.95?'si':'no')+'">💧 '+(rA2>=0.95?'con agua':Math.round(rA2*100)+' %')+'</i></span>'; }
  }
  if(mio&&i>=0&&(s.cable[i]||s.tubo[i]))h+='<small>'+(s.cable[i]?'⚡ Tendido eléctrico. ':'')+(s.tubo[i]?'🚿 Tubería bajo tierra.':'')+'</small>';
  z.innerHTML='<button type="button" class="cs-x" aria-label="Cerrar">✕</button>'+h; z.hidden=false;
  z.querySelector(".cs-x").onclick=cierraInfo;
}

/* ===================== MAPA ===================== */
function terr(x,y){
  var j=J, kx=Math.floor(x/CH), ky=Math.floor(y/CH), t=trozo(kx,ky);
  return t.ter[(x-kx*CH)*CH+(y-ky*CH)];
}
/* un trozo de 16×16 casillas: su terreno y su imagen */
/* la altura de una casilla: el agua en el fondo (0), la tierra de 1 a 4 según un ruido suave y
   la orilla baja para que el terreno llegue suave al agua */
function celdaAlt(seed,x,y,T,simple){
  var t=T(x,y); if(t==="w")return 0;
  var v=suave(x,y,13,seed+91), h=1+Math.floor(Math.max(0,Math.min(0.999,v*1.45-0.3))*MAXA);
  if(!simple&&h>1&&(T(x+1,y)==="w"||T(x-1,y)==="w"||T(x,y+1)==="w"||T(x,y-1)==="w"))h=1;
  return h;
}
/* la altura de un vértice (la esquina de arriba de la casilla x,y): la menor de las cuatro casillas que lo comparten,
   así el terreno es continuo, con laderas y sin huecos */
var ultT=null;
function vert(i,j){
  var kx=Math.floor(i/CH), ky=Math.floor(j/CH), t=ultT&&ultT.kx===kx&&ultT.ky===ky?ultT:(ultT=trozo(kx,ky));
  return t.va[(i-kx*CH)*(CH+1)+(j-ky*CH)];
}
function esquinas(x,y){return [vert(x,y),vert(x+1,y),vert(x+1,y+1),vert(x,y+1)];}   /* N, E, S, O */
/* lo que se nivela sobre un cimiento: los edificios. Las calles y los lotes vacíos siguen la ladera */
function nivelada(wx,wy){
  var s=J.s, dx=wx-s.cx, dy=wy-s.cy, t, l;
  if(Math.abs(dx)<=A.R&&Math.abs(dy)<=A.R){var i=A.idx(dx,dy); t=s.tipo[i]; l=s.nivel[i];}
  else{var v=J.vecinos.length?vecinoEn(wx,wy):null; if(!v)return false; t=v.t; l=v.l;}
  return !!t&&t!=="c"&&!("RCI".indexOf(t)>=0&&!l);
}
/* la altura de la superficie de una casilla: lo construido se nivela a la esquina más alta; el campo, la media */
function altTop(wx,wy,es){es=es||esquinas(wx,wy); return nivelada(wx,wy)?Math.max(es[0],es[1],es[2],es[3]):(es[0]+es[1]+es[2]+es[3])/4;}
/* el contorno de una casilla a su altura (para señalar, elegir y pintar capas) */
function contorno(g,wx,wy){
  var x=(wx-wy)*HW, y=(wx+wy)*HH, es=esquinas(wx,wy);
  g.beginPath();
  if(nivelada(wx,wy)){var m=Math.max(es[0],es[1],es[2],es[3])*ALT; g.moveTo(x,y-HH-m); g.lineTo(x+HW,y-m); g.lineTo(x,y+HH-m); g.lineTo(x-HW,y-m);}
  else{g.moveTo(x,y-HH-es[0]*ALT); g.lineTo(x+HW,y-es[1]*ALT); g.lineTo(x,y+HH-es[2]*ALT); g.lineTo(x-HW,y-es[3]*ALT);}
  g.closePath();
}
/* el cimiento de tierra cuando se construye en una ladera */
function cimiento(g,x,y,es,m){
  var H0=m*ALT;
  if(es[3]<m||es[2]<m){g.fillStyle="#a88a5e"; g.beginPath(); g.moveTo(x-HW,y-H0); g.lineTo(x,y+HH-H0); g.lineTo(x,y+HH-es[2]*ALT); g.lineTo(x-HW,y-es[3]*ALT); g.closePath(); g.fill();}
  if(es[1]<m||es[2]<m){g.fillStyle="#7d6343"; g.beginPath(); g.moveTo(x,y+HH-H0); g.lineTo(x+HW,y-H0); g.lineTo(x+HW,y-es[1]*ALT); g.lineTo(x,y+HH-es[2]*ALT); g.closePath(); g.fill();}
}
function trozo(kx,ky){
  var j=J, key=kx+","+ky, t=j.trozos[key];
  if(t){t.uso=j.marco||0;return t;}
  var seed=j.s.mseed, ter=new Array(CH*CH), x, y, ext={};
  function T(x,y){var k=x+","+y; if(ext[k]===undefined)ext[k]=A.terreno(seed,x,y); return ext[k];}
  for(x=0;x<CH;x++)for(y=0;y<CH;y++)ter[x*CH+y]=T(kx*CH+x,ky*CH+y);
  /* alturas de las casillas (con un margen de una) y de los vértices del trozo */
  var ca={}; function CA(x,y){var k=x+","+y; if(ca[k]===undefined)ca[k]=celdaAlt(seed,x,y,T); return ca[k];}
  var va=new Array((CH+1)*(CH+1));
  for(x=0;x<=CH;x++)for(y=0;y<=CH;y++){var i=kx*CH+x, jj=ky*CH+y; va[x*(CH+1)+y]=Math.min(CA(i-1,jj-1),CA(i,jj-1),CA(i-1,jj),CA(i,jj));}
  function V(x,y){return va[x*(CH+1)+y];}
  /* la imagen: casillas de pasto, bosque, arena y agua, cada una inclinada según sus cuatro esquinas */
  var c=document.createElement("canvas"), W=CH*TW+TW, H=CH*TH+TH+MAXA*ALT;
  c.width=W*CS; c.height=H*CS;
  var g=c.getContext("2d"); g.setTransform(CS,0,0,CS,0,0);
  var ox=((kx-ky)*CH-CH)*HW, oy=(kx+ky)*CH*HH-HH-MAXA*ALT;   /* esquina del trozo en el mapa (con lugar arriba para las colinas) */
  /* primero el agua y luego la tierra; el agua dibuja en su borde de atrás el talud de la orilla (la tierra queda más alta) */
  for(var pasada=0;pasada<2;pasada++)for(x=0;x<CH;x++)for(y=0;y<CH;y++){
    var wx=kx*CH+x, wy=ky*CH+y, tt=ter[x*CH+y], px=(wx-wy)*HW-ox, py=(wx+wy)*HH-oy, n=hsh(wx,wy,seed);
    if((tt==="w")!==(pasada===0))continue;
    var col, aN=V(x,y)*ALT, aE=V(x+1,y)*ALT, aS=V(x+1,y+1)*ALT, aO=V(x,y+1)*ALT;
    if(tt==="w"){
      var tA=T(wx-1,wy)!=="w", tB=T(wx,wy-1)!=="w", tC=T(wx+1,wy)!=="w", tD=T(wx,wy+1)!=="w", orilla=tA||tB||tC||tD;
      var hondo=!orilla&&T(wx-2,wy)==="w"&&T(wx+2,wy)==="w"&&T(wx,wy-2)==="w"&&T(wx,wy+2)==="w"&&T(wx-1,wy-1)==="w"&&T(wx+1,wy+1)==="w"&&T(wx+1,wy-1)==="w"&&T(wx-1,wy+1)==="w";
      col=orilla?"#62bdf0":hondo?mezcla("#2a78c8","#2f83d2",n):mezcla("#3d9be2","#4aa6e8",n);
      g.fillStyle=col; g.beginPath(); g.moveTo(px,py-HH-0.4); g.lineTo(px+HW+0.6,py); g.lineTo(px,py+HH+0.4); g.lineTo(px-HW-0.6,py); g.closePath(); g.fill();
      if(orilla){
        g.save(); g.beginPath(); g.moveTo(px,py-HH); g.lineTo(px+HW,py); g.lineTo(px,py+HH); g.lineTo(px-HW,py); g.closePath(); g.clip();
        /* el talud: la tierra de atrás se ve un poco por encima del agua */
        g.fillStyle="#b59a6a";
        if(tA){g.beginPath(); g.moveTo(px-HW,py); g.lineTo(px,py-HH); g.lineTo(px,py-HH+2); g.lineTo(px-HW,py+2); g.closePath(); g.fill();}
        if(tB){g.beginPath(); g.moveTo(px,py-HH); g.lineTo(px+HW,py); g.lineTo(px+HW,py+2); g.lineTo(px,py-HH+2); g.closePath(); g.fill();}
        /* la espuma de la orilla */
        g.strokeStyle="rgba(255,255,255,.55)"; g.lineWidth=0.9; g.beginPath();
        if(tA){g.moveTo(px-HW,py+2.6); g.lineTo(px,py-HH+2.6);} if(tB){g.moveTo(px,py-HH+2.6); g.lineTo(px+HW,py+2.6);}
        if(tC){g.moveTo(px+HW-1,py+0.4); g.lineTo(px,py+HH-0.6);} if(tD){g.moveTo(px,py+HH-0.6); g.lineTo(px-HW+1,py+0.4);}
        g.stroke(); g.restore();
      }
      continue;
    }
    var playa=T(wx+1,wy)==="w"||T(wx-1,wy)==="w"||T(wx,wy+1)==="w"||T(wx,wy-1)==="w";
    var v=suave(wx,wy,7,seed), v2=suave(wx,wy,3,seed+5);
    if(playa)col=mezcla("#ecdba0","#e0cd8e",n);
    else if(tt==="f")col=mezcla("#356f36","#4d9447",v*0.7+v2*0.3);
    else col=mezcla(mezcla(mezcla("#5aa84a","#8fd166",v),"#79c25a",n*0.25),"#b8d470",v2>0.8?(v2-0.8)*1.8:0);   /* praderas que cambian poco a poco y claros secos */
    /* la luz viene de arriba a la izquierda: las laderas que suben hacia la derecha se ven más claras, las otras más oscuras */
    var dzx=(aE+aS-aN-aO)/(2*ALT), dzy=(aS+aO-aN-aE)/(2*ALT), luzT=Math.max(-0.32,Math.min(0.22,0.11*dzx+0.04*dzy-(dzx<0?0.06:0)));
    col=luzT>=0?mezcla(col,"#ffffff",luzT):mezcla(col,"#0b2410",-luzT);
    g.fillStyle=col; g.beginPath(); g.moveTo(px,py-HH-0.4-aN); g.lineTo(px+HW+0.6,py-aE); g.lineTo(px,py+HH+0.4-aS); g.lineTo(px-HW-0.6,py-aO); g.closePath(); g.fill();
    var am=(aN+aE+aS+aO)/4; py-=am;   /* los detalles van a la altura del centro */
    if(tt==="g"&&!playa&&n>0.72){g.fillStyle="rgba(40,105,40,.32)"; g.fillRect(px-4+n*6,py-2,1,2); g.fillRect(px-2+n*6,py-3,1,3); g.fillRect(px+3-n*4,py+1,1,2);}
    if(tt==="g"&&!playa&&n<0.035){g.fillStyle="#fff7d6"; g.fillRect(px-3,py,1.5,1.5); g.fillStyle=n<0.018?"#ff8fb3":"#ffe066"; g.fillRect(px+2,py-2,1.5,1.5);}
    if(playa&&n<0.12){g.fillStyle="rgba(160,130,80,.5)"; g.fillRect(px-2+n*20,py,1.2,0.8);}
  }
  t={ter:ter,va:va,kx:kx,ky:ky,c:c,ox:ox,oy:oy,w:W,h:H,uso:j.marco||0};
  j.trozos[key]=t; j.ntrozos++;
  /* no guardar demasiados: se borran los que hace más que no se ven */
  if(j.ntrozos>70){var ks=Object.keys(j.trozos).sort(function(a,b){return j.trozos[a].uso-j.trozos[b].uso;}); for(var i=0;i<20;i++){delete j.trozos[ks[i]];j.ntrozos--;} ultT=null;}
  return t;
}
function cargaVecinos(){
  var j=J; if(!j)return;
  api("/api/ciudad/vecinos?mundo="+encodeURIComponent(j.mundo.code)).then(function(r){
    if(J!==j)return;
    var antes={}; j.vecinos.forEach(function(v){if(v.conmigo)antes[v.slot]=1;});
    j.vecinos=(r.vecinos||[]).map(function(v){v.tipoA=v.tipo.split(""); v.nivelA=v.nivel.split("").map(Number);
      /* su valor del suelo, con el mismo cálculo del motor, para dibujar sus barrios ricos */
      try{ var cero=new Array(A.N).fill(0); v.valor=A.mapas({tipo:v.tipoA.map(function(c){return c==="."?"":c;}),nivel:v.nivelA,techs:{},bonoLimpio:0,cable:cero,tubo:cero,mseed:j.s.mseed,cx:v.cx,cy:v.cy}).valor; }catch(e){ v.valor=null; }
      return v;});
    /* una vecina firmó un tratado con mi ciudad: aviso para que yo también firme */
    var nueva=j.vecinos.filter(function(v){return v.conmigo&&!antes[v.slot]&&!j.s.tratados[v.slot];})[0];
    if(nueva&&j.vecinosCargados){ SON.territorio(); $("cs-vec").classList.add("alerta");
      msg("🤝 "+nueva.nombre+" firmó un tratado con tu ciudad. Abre «Vecinos» y firma tú también para abrir la ruta comercial en la tuya.",9000); }
    j.vecinosCargados=true;
  }).catch(function(){});
}
function vecinoEn(x,y){
  var vs=J.vecinos;
  for(var k=0;k<vs.length;k++){var v=vs[k], dx=x-v.cx, dy=y-v.cy;
    if(Math.abs(dx)<=A.R&&Math.abs(dy)<=A.R){var i=A.idx(dx,dy), t=v.tipoA[i]; return {v:v,t:t==="."?"":t,l:v.nivelA[i],dx:dx,dy:dy,dentro:dx*dx+dy*dy<=v.radio*v.radio};}}
  return null;
}

/* ---------- cámara ---------- */
/* modo retro: la ciudad se dibuja a la mitad de resolución y se amplía sin suavizar (píxeles nítidos, como en los 90) */
function retroGuardado(){try{var v=localStorage.getItem("cs_retro"); return v===null?true:v==="1";}catch(e){return true;}}
function tam(){
  var j=J, cv=j.cv, dpr=j.retro?0.5:Math.min(2,window.devicePixelRatio||1), w=cv.clientWidth, h=cv.clientHeight;
  cv.classList.toggle("retro",!!j.retro);
  if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);}
  j.dpr=dpr; j.W=w; j.H=h;
  /* los textos (nombres, carteles, dinero) van en una capa encima a resolución completa: en modo retro se siguen leyendo */
  var tx=j.tx; if(tx){var d2=Math.min(2,window.devicePixelRatio||1); j.dtx=d2;
    if(tx.width!==Math.round(w*d2)||tx.height!==Math.round(h*d2)){tx.width=Math.round(w*d2); tx.height=Math.round(h*d2); tx.style.width=w+"px"; tx.style.height=h+"px";}
    tx.style.left=cv.offsetLeft+"px"; tx.style.top=cv.offsetTop+"px";}
}
function centra(inicio){
  var j=J, s=j.s; tam();
  j.cam.x=(s.cx-s.cy)*HW; j.cam.y=(s.cx+s.cy)*HH;
  if(inicio){var r=A.radio(s)+1.5; j.cam.z=Math.max(0.6,Math.min(2.2,j.W/(r*TW*1.5),j.H/(r*TH*1.7)));}
}
function vuela(x,y){var j=J; j.cam.x=(x-y)*HW; j.cam.y=(x+y)*HH;}
function aMapa(px,py){var c=J.cam; return {x:(px-J.W/2)/c.z+c.x,y:(py-J.H/2)/c.z+c.y};}
function aCasilla(ix,iy){var a=ix/HW, b=iy/HH; return {x:Math.round((a+b)/2),y:Math.round((b-a)/2)};}
/* con relieve: se prueba de la altura más alta a la más baja y vale la casilla cuya superficie está a esa altura */
function casillaEn(ix,iy){
  if(J.cam.z<ZMUNDO)return aCasilla(ix,iy);
  for(var h=MAXA;h>=0;h--){var c=aCasilla(ix,iy+h*ALT); if(Math.round(altTop(c.x,c.y))===h)return c;}
  return aCasilla(ix,iy);
}
function zoom(f,px,py){
  var j=J, c=j.cam; if(px==null){px=j.W/2;py=j.H/2;}
  if(!(f>0)||!isFinite(f))return;
  var p=aMapa(px,py), z=Math.max(ZMIN,Math.min(3,c.z*f));
  c.x=p.x-(px-j.W/2)/z; c.y=p.y-(py-j.H/2)/z; c.z=z;
  var b=$("cs-mundo"); if(b)b.classList.toggle("on",z<ZMUNDO);   /* con los dedos o la rueda también se entra y se sale del mundo */
}

/* ---------- toques, ratón y teclado ---------- */
function enlaza(){
  var j=J, cv=j.cv;
  function pos(e){var r=cv.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top};}
  function casillaDe(p){var m=aMapa(p.x,p.y); return casillaEn(m.x,m.y);}
  cv.addEventListener("pointerdown",function(e){
    if(J!==j)return; cv.setPointerCapture&&cv.setPointerCapture(e.pointerId);
    var p=pos(e); j.ptr[e.pointerId]={x:p.x,y:p.y,x0:p.x,y0:p.y,b:e.button};
    var n=Object.keys(j.ptr).length;
    if(n>=2){j.arrastre={pinza:true,d:distP(),m:medioP()};return;}   /* dos dedos (o más): pellizco, nunca construir */
    var c=casillaDe(p), pinta=e.button===0&&arrastrable(j.herr);
    j.arrastre={x0:p.x,y0:p.y,cam:{x:j.cam.x,y:j.cam.y},movido:false,pinta:pinta,a:c,b:c,btn:e.button};
  });
  cv.addEventListener("pointermove",function(e){
    if(J!==j)return; var p=pos(e);
    j.hover=casillaDe(p);
    if(!j.ptr[e.pointerId])return;
    j.ptr[e.pointerId].x=p.x; j.ptr[e.pointerId].y=p.y;
    var a=j.arrastre; if(!a)return;
    if(a.pinza){
      /* si ya se levantó un dedo, el pellizco terminó: el que queda no acerca ni aleja (antes la distancia 0 llevaba de golpe al mundo) */
      if(Object.keys(j.ptr).length<2)return;
      var d=distP(), m=medioP(); if(a.d>0&&d>0)zoom(d/a.d,m.x,m.y); j.cam.x-=(m.x-a.m.x)/j.cam.z; j.cam.y-=(m.y-a.m.y)/j.cam.z; a.d=d; a.m=m; return;}
    if(Math.abs(p.x-a.x0)+Math.abs(p.y-a.y0)>6)a.movido=true;
    if(a.pinta&&a.btn===0){a.b=casillaDe(p);return;}
    if(a.movido){j.cam.x=a.cam.x-(p.x-a.x0)/j.cam.z; j.cam.y=a.cam.y-(p.y-a.y0)/j.cam.z;}
  });
  function suelta(e){
    if(J!==j)return; var a=j.arrastre;
    delete j.ptr[e.pointerId];
    if(!a)return;
    if(a.pinza){ if(!Object.keys(j.ptr).length)j.arrastre=null; else if(Object.keys(j.ptr).length>=2){a.d=distP(); a.m=medioP();} return; }
    j.arrastre=null;
    if(e.type==="pointercancel")return;
    var h=j.herr;
    if(a.pinta&&a.movido){construye(casillasArrastre(a.a,a.b,opDe(h)),opDe(h));return;}
    if(a.movido)return;
    var c=a.a;
    if(h.k==="b"||h.k==="x"||h.k==="r"){cierraInfo();construye([c],opDe(h));}
    else info(c);
  }
  cv.addEventListener("pointerup",suelta); cv.addEventListener("pointercancel",suelta);
  cv.addEventListener("pointerleave",function(){if(J===j)j.hover=null;});
  cv.addEventListener("contextmenu",function(e){e.preventDefault();});
  cv.addEventListener("wheel",function(e){if(J!==j)return; e.preventDefault(); var p=pos(e); zoom(e.deltaY<0?1.12:1/1.12,p.x,p.y);},{passive:false});
  function distP(){var ps=Object.keys(j.ptr).map(function(k){return j.ptr[k];}); return ps.length<2?0:Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y);}
  function medioP(){var ps=Object.keys(j.ptr).map(function(k){return j.ptr[k];}); return ps.length<2?ps[0]:{x:(ps[0].x+ps[1].x)/2,y:(ps[0].y+ps[1].y)/2};}
  $("cs-zmas").onclick=function(){zoom(1.25);}; $("cs-zmenos").onclick=function(){zoom(0.8);};
  $("cs-centro").onclick=function(){centra(false);};
  $("cs-retro").classList.toggle("on",!!j.retro);
  $("cs-retro").onclick=function(){
    j.retro=!j.retro; j.vin=null; try{localStorage.setItem("cs_retro",j.retro?"1":"0");}catch(e){}
    this.classList.toggle("on",j.retro); msg(j.retro?"👾 Modo retro: píxeles nítidos, como los juegos de ciudades de los 90.":"Modo nítido: la ciudad a toda resolución.",3500);
  };
  $("cs-mundo").onclick=function(){
    var c=j.cam;
    if(c.z<ZMUNDO){ centra(true); $("cs-mundo").classList.remove("on"); return; }
    /* la ciudad en el centro y sus ocho ranuras vecinas alrededor */
    centra(false); tam();
    c.z=Math.max(ZMIN,Math.min(ZMUNDO*0.9,j.W/(2*A.SEPARA*TW*1.15),j.H/(2*A.SEPARA*TH*1.15)));
    $("cs-mundo").classList.add("on");
    msg(j.vecinos.length?"🌐 El mundo: tu ciudad y "+j.vecinos.length+(j.vecinos.length===1?" vecina":" vecinas")+". Toca 🌐 otra vez para volver.":"🌐 El mundo alrededor de tu ciudad. Las ciudades que se funden en las ranuras de al lado aparecerán aquí.",5000);
  };
  $("cs-capa").onclick=function(){
    var k=0; for(var i=0;i<CAPAS.length;i++)if(CAPAS[i][0]===j.capa)k=i;
    var c=CAPAS[(k+1)%CAPAS.length]; j.capa=c[0];
    var z=$("cs-capa-n"); z.hidden=!c[0]; z.innerHTML=c[0]?'🗺️ <b>'+c[1]+'</b> <small>'+(c[0]==="cont"?"rojo = aire contaminado":c[0]==="feliz"?"verde = cerca de parques y cultura":c[0]==="valor"?"rojo = popular · amarillo = clase media · verde = acomodado (parques, cultura, servicios y agua lo suben)":c[0]==="luz"?"verde = conectado a una central · rojo = sin electricidad · amarillo = tendido":c[0]==="agua"?"verde = con agua · rojo = sin agua · azul = tubería":"verde = cubierto · rojo = sin servicio")+'</small>':"";
    $("cs-capa").classList.toggle("on",!!c[0]);
  };
  $("cs-full").onclick=function(){var z=$("cs"); var on=!z.classList.contains("full"); z.classList.toggle("full",on); document.body.classList.toggle("cs-full",on);};
  $("cs-inv").onclick=function(){panelInvestigar();};
  $("cs-prob").onclick=panelProblemas;
  $("cs-vec").onclick=panelVecinos;
  $("cs-ayu").onclick=panelAlcaldia; $("cs-nom").onclick=panelAlcaldia; $("cs-era").onclick=panelEpocas;
  $("cs-modal").onclick=function(e){if(e.target===this)cierraModal();};
  Array.prototype.forEach.call(document.querySelectorAll("[data-vel]"),function(b){b.onclick=function(){
    var v=+b.getAttribute("data-vel"); j.vel=v; j.pausa=v===0; marcaVel();};});
  marcaVel();
  $("cs-salir").onclick=function(){
    var b=this; b.disabled=true;
    var fin=function(){para();portada();};
    if(j.solo||(!j.log.length&&j.s.segTick<2))return fin();
    guarda().then(fin,fin);
  };
  function tecla(e){
    if(J!==j){document.removeEventListener("keydown",tecla);return;}
    if(/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||""))return;
    if(e.key==="Escape"){if(j.modal)cierraModal();else{j.grupo=null;j.herr={k:"info"};j.sub=false;herramientas();}}
    else if(e.key===" "){e.preventDefault(); j.vel=j.vel?0:1; j.pausa=!j.vel; marcaVel();}
    else if(e.key==="+"||e.key==="=")zoom(1.2); else if(e.key==="-")zoom(1/1.2);
  }
  document.addEventListener("keydown",tecla);
  function oculto(){ if(document.hidden&&J===j&&!j.solo&&!j.modal&&(j.log.length||j.s.segTick>=20))guarda(); }
  document.addEventListener("visibilitychange",oculto);
  function sale(){cerrar();}
  window.addEventListener("pagehide",sale);
  j.fuera=function(){document.removeEventListener("keydown",tecla);document.removeEventListener("visibilitychange",oculto);window.removeEventListener("pagehide",sale);document.body.classList.remove("cs-full");};
}
function marcaVel(){var j=J; Array.prototype.forEach.call(document.querySelectorAll("[data-vel]"),function(b){b.setAttribute("aria-pressed",String(+b.getAttribute("data-vel")===(j.pausa?0:j.vel)));});}

/* ---------- coches: solo decoración, por las calles de mi ciudad ---------- */
function mueveCoches(dt){
  var j=J, s=j.s, st=s.est; if(!st)return;
  var quiero=Math.min(36,Math.floor(st.calles/3),Math.floor(st.pob/12));
  while(j.cars.length>quiero)j.cars.pop();
  if(j.cars.length<quiero&&Math.random()<0.2){
    var i=Math.floor(Math.random()*A.N), k;
    for(k=0;k<60&&s.tipo[i]!=="c";k++)i=Math.floor(Math.random()*A.N);
    if(s.tipo[i]==="c"){var x=Math.floor(i/A.LADO)-A.R, y=i%A.LADO-A.R; j.cars.push({x:x,y:y,nx:x,ny:y,t:1,v:1.2+Math.random()*0.9,c:["#e53935","#1e88e5","#fdd835","#fafafa","#43a047","#8e24aa","#fb8c00","#37474f"][Math.floor(Math.random()*8)]});}
  }
  j.cars.forEach(function(c){
    c.t+=dt*c.v;
    while(c.t>=1){
      c.t-=1; c.x=c.nx; c.y=c.ny;
      var op=[[1,0],[-1,0],[0,1],[0,-1]].filter(function(v){var x=c.x+v[0],y=c.y+v[1]; return Math.abs(x)<=A.R&&Math.abs(y)<=A.R&&s.tipo[A.idx(x,y)]==="c";});
      if(!op.length){c.t=0;c.muerto=true;break;}
      var atras=op.filter(function(v){return !(c.x+v[0]===c.px&&c.y+v[1]===c.py);});
      var v=(atras.length?atras:op)[Math.floor(Math.random()*(atras.length||op.length))];
      c.px=c.x; c.py=c.y; c.nx=c.x+v[0]; c.ny=c.y+v[1];
    }
  });
  j.cars=j.cars.filter(function(c){return !c.muerto&&s.tipo[A.idx(c.x,c.y)]==="c";});
}

/* ===================== DIBUJO ===================== */
/* ruido suave (para que el pasto y el bosque cambien de tono poco a poco, sin cuadros) */
function suave(x,y,esc,sd){
  var gx=Math.floor(x/esc), gy=Math.floor(y/esc), fx=x/esc-gx, fy=y/esc-gy, a=hsh(gx,gy,sd), b=hsh(gx+1,gy,sd), c=hsh(gx,gy+1,sd), d=hsh(gx+1,gy+1,sd);
  var ux=fx*fx*(3-2*fx), uy=fy*fy*(3-2*fy); return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy;
}
function mezcla(a,b,t){ /* entre dos colores #rrggbb; devuelve otro #rrggbb */
  var x=parseInt(a.slice(1),16), y=parseInt(b.slice(1),16), r=Math.round((x>>16)+((y>>16)-(x>>16))*t), g=Math.round((x>>8&255)+((y>>8&255)-(x>>8&255))*t), bl=Math.round((x&255)+((y&255)-(x&255))*t);
  return "#"+((1<<24)+(r<<16)+(g<<8)+bl).toString(16).slice(1); }
/* un rectángulo del mundo (u,v relativos al centro de la casilla, de −0,5 a 0,5) visto en isométrico */
/* INC: las alturas de las esquinas (N, E, S, O) cuando lo que se dibuja sigue la ladera (calles y lotes vacíos) */
var INC=null;
function hInc(u,v){ if(!INC)return 0; var a=u+0.5, b=v+0.5; return (INC[0]*(1-a)*(1-b)+INC[1]*a*(1-b)+INC[2]*a*b+INC[3]*(1-a)*b)*ALT; }
function cuad(g,cx,cy,u0,v0,u1,v1){
  g.moveTo(cx+(u0-v0)*HW,cy+(u0+v0)*HH-hInc(u0,v0)); g.lineTo(cx+(u1-v0)*HW,cy+(u1+v0)*HH-hInc(u1,v0));
  g.lineTo(cx+(u1-v1)*HW,cy+(u1+v1)*HH-hInc(u1,v1)); g.lineTo(cx+(u0-v1)*HW,cy+(u0+v1)*HH-hInc(u0,v1)); g.closePath();
}
function linea(g,cx,cy,u0,v0,u1,v1){ g.moveTo(cx+(u0-v0)*HW,cy+(u0+v0)*HH-hInc(u0,v0)); g.lineTo(cx+(u1-v1)*HW,cy+(u1+v1)*HH-hInc(u1,v1)); }
function rombo(g,x,y,hw,hh){g.beginPath();g.moveTo(x,y-hh);g.lineTo(x+hw,y);g.lineTo(x,y+hh);g.lineTo(x-hw,y);g.closePath();}
function sombrea(c,f){ /* aclara (f>0) u oscurece (f<0) un color #rrggbb */
  var n=parseInt(c.slice(1),16), r=n>>16, g=n>>8&255, b=n&255;
  if(f<0){r*=1+f;g*=1+f;b*=1+f;}else{r+=(255-r)*f;g+=(255-g)*f;b+=(255-b)*f;}
  return "rgb("+(r|0)+","+(g|0)+","+(b|0)+")";
}
/* una caja isométrica sobre la casilla (x,y = centro del rombo), f = tamaño, h = altura */
/* SUAVE: al dibujar los edificios que se guardan como imagen, las caras llevan degradados, la arista del frente un
   bisel que funde las dos caras, la base se oscurece (oclusión) y la sombra se desvanece: volumen sin esquinas duras */
var SUAVE=false;
function caja(g,x,y,f,h,col,techo){
  var hw=HW*f, hh=HH*f;
  /* la sombra cae hacia abajo a la derecha: la base desplazada en la dirección de la luz */
  if(h>=5){ var L=Math.min(h*0.5,18)/HW, vx=L*HW, vy=L*HH;
    if(SUAVE){var sg=g.createLinearGradient(x+hw*0.4,y,x+hw*0.4+vx,y+vy); sg.addColorStop(0,"rgba(15,35,25,.28)"); sg.addColorStop(1,"rgba(15,35,25,0)"); g.fillStyle=sg;}
    else g.fillStyle="rgba(15,35,25,.17)";
    g.beginPath(); g.moveTo(x-hw,y); g.lineTo(x,y-hh); g.lineTo(x+vx,y-hh+vy); g.lineTo(x+hw+vx,y+vy); g.lineTo(x+vx,y+hh+vy); g.lineTo(x,y+hh); g.closePath(); g.fill(); }
  var cI=sombrea(col,-0.07), cD=sombrea(col,-0.3), cT=techo||sombrea(col,0.14);
  if(SUAVE){
    cI=g.createLinearGradient(0,y-h-hh,0,y+hh); cI.addColorStop(0,sombrea(col,0.08)); cI.addColorStop(1,sombrea(col,-0.2));
    cD=g.createLinearGradient(x,0,x+hw,0); cD.addColorStop(0,sombrea(col,-0.2)); cD.addColorStop(1,sombrea(col,-0.42));
    if(!techo){cT=g.createLinearGradient(x-hw,y-h,x+hw,y-h); cT.addColorStop(0,sombrea(col,0.24)); cT.addColorStop(1,sombrea(col,0.06));}
  }
  g.fillStyle=cI; g.beginPath(); g.moveTo(x-hw,y); g.lineTo(x,y+hh); g.lineTo(x,y+hh-h); g.lineTo(x-hw,y-h); g.closePath(); g.fill();
  g.fillStyle=cD; g.beginPath(); g.moveTo(x,y+hh); g.lineTo(x+hw,y); g.lineTo(x+hw,y-h); g.lineTo(x,y+hh-h); g.closePath(); g.fill();
  g.fillStyle=cT; rombo(g,x,y-h,hw,hh); g.fill();
  if(h>=4){
    /* bisel: una franja en la arista del frente que funde las dos caras */
    var b=Math.min(1.8,hw*0.13), bb=b*HH/HW;
    if(SUAVE){var gb=g.createLinearGradient(x-b,0,x+b,0); gb.addColorStop(0,"rgba(255,255,255,0)"); gb.addColorStop(0.45,"rgba(255,255,255,.3)"); gb.addColorStop(1,"rgba(0,0,0,0)"); g.fillStyle=gb;}
    else g.fillStyle="rgba(255,255,255,.13)";
    g.beginPath(); g.moveTo(x-b,y+hh-bb); g.lineTo(x,y+hh); g.lineTo(x+b,y+hh-bb); g.lineTo(x+b,y+hh-bb-h); g.lineTo(x,y+hh-h); g.lineTo(x-b,y+hh-bb-h); g.closePath(); g.fill();
    /* oclusión: la base de las caras, un poco más oscura */
    var ao=Math.min(5,h*0.4);
    if(SUAVE){var ga=g.createLinearGradient(0,y+hh-ao-hh,0,y+hh); ga.addColorStop(0,"rgba(0,0,0,0)"); ga.addColorStop(1,"rgba(0,0,0,.2)"); g.fillStyle=ga;}
    else g.fillStyle="rgba(0,0,0,.07)";
    g.beginPath(); g.moveTo(x-hw,y); g.lineTo(x,y+hh); g.lineTo(x+hw,y); g.lineTo(x+hw,y-ao); g.lineTo(x,y+hh-ao); g.lineTo(x-hw,y-ao); g.closePath(); g.fill();
  }
  /* contorno suave y aristas iluminadas: le dan nitidez a cada edificio */
  g.lineWidth=0.45; g.strokeStyle=SUAVE?"rgba(25,20,15,.2)":"rgba(25,20,15,.3)"; g.beginPath();
  g.moveTo(x-hw,y); g.lineTo(x,y+hh); g.lineTo(x+hw,y); g.lineTo(x+hw,y-h); g.lineTo(x,y-hh-h); g.lineTo(x-hw,y-h); g.closePath(); g.stroke();
  g.strokeStyle="rgba(255,255,255,.32)"; g.beginPath(); g.moveTo(x,y+hh-0.4); g.lineTo(x,y+hh-h); g.lineTo(x-hw+0.4,y-h); g.stroke();
}
function tejado(g,x,y,f,h,alto,col){ /* tejado a cuatro aguas sobre una caja */
  var hw=HW*f, hh=HH*f, cy=y-h-alto;
  if(SUAVE){var gt=g.createLinearGradient(x-hw,y-h,x,cy); gt.addColorStop(0,sombrea(col,-0.05)); gt.addColorStop(1,sombrea(col,0.18)); g.fillStyle=gt;} else g.fillStyle=col;
  g.beginPath(); g.moveTo(x-hw,y-h); g.lineTo(x,y+hh-h); g.lineTo(x,cy); g.closePath(); g.fill();
  g.fillStyle=sombrea(col,-0.3); g.beginPath(); g.moveTo(x,y+hh-h); g.lineTo(x+hw,y-h); g.lineTo(x,cy); g.closePath(); g.fill();
  g.fillStyle=sombrea(col,-0.12); g.beginPath(); g.moveTo(x-hw,y-h); g.lineTo(x,cy); g.lineTo(x,y-hh-h); g.closePath(); g.fill();   /* el faldón de atrás, apenas visible */
  g.lineWidth=0.45; g.strokeStyle="rgba(25,20,15,.3)"; g.beginPath(); g.moveTo(x-hw,y-h); g.lineTo(x,y+hh-h); g.lineTo(x+hw,y-h); g.lineTo(x,cy); g.closePath(); g.stroke();
  g.strokeStyle="rgba(255,255,255,.35)"; g.beginPath(); g.moveTo(x,y+hh-h); g.lineTo(x,cy); g.stroke();   /* la cumbrera */
}
function placas(g,x,y,f){ /* paneles solares sobre un techo plano */
  g.fillStyle="#1f4f8f"; rombo(g,x,y,HW*f,HH*f); g.fill();
  g.strokeStyle="rgba(150,200,255,.7)"; g.lineWidth=0.4; g.beginPath(); g.moveTo(x-HW*f/2,y-HH*f/2); g.lineTo(x+HW*f/2,y+HH*f/2); g.moveTo(x+HW*f/2,y-HH*f/2); g.lineTo(x-HW*f/2,y+HH*f/2); g.stroke();
}
function ventanas(g,x,y,f,h,pisos,luz,noche,luces,sd){
  var hw=HW*f, hh=HH*f, k, p;
  for(p=0;p<pisos;p++){
    var yy=y-4-p*(h-6)/pisos;
    for(k=1;k<=3;k++){
      var t=k/4, on=noche&&hsh(sd,p,k)<0.55;
      g.fillStyle=on?"#ffe58a":luz;
      var lx=x-hw+hw*t, ly=yy+hh*t; g.fillRect(lx-0.9,ly-2.4,1.8,1.8);
      var rx=x+hw*t, ry=yy+hh-hh*t; g.fillRect(rx-0.9,ry-2.4,1.8,1.8);
      if(on&&luces.length<500)luces.push(lx,ly-1.5,rx,ry-1.5);
    }
  }
}
function humo(g,x,y,now,sd,oscuro){
  for(var k=0;k<3;k++){
    var f=((now/2200+k/3+sd)%1), r=1.6+f*4;
    g.fillStyle=oscuro?"rgba(90,90,96,"+(0.55*(1-f))+")":"rgba(235,238,242,"+(0.6*(1-f))+")";
    g.beginPath(); g.arc(x+f*5,y-f*18,r,0,6.283); g.fill();
  }
}
function arbol(g,x,y,n,esc){
  esc=(esc||1)*(0.85+0.3*hsh(Math.round(x),Math.round(y),3));
  g.fillStyle="rgba(15,40,20,.22)"; g.beginPath(); g.ellipse(x+4*esc,y+1.2,6.5*esc,2.6*esc,0,0,6.283); g.fill();   /* sombra a la derecha */
  g.fillStyle="#5a3c20"; g.fillRect(x-0.9*esc,y-5*esc,1.8*esc,5.6*esc);
  var k;
  if(n<0.5){ /* pino de tres pisos, iluminado por la izquierda */
    for(k=0;k<3;k++){ var w=(6.2-k*1.5)*esc, base=y-(2.5+k*4.6)*esc, top=base-(7.5-k*0.6)*esc;
      g.fillStyle=["#1f5f34","#24703c","#2b8045"][k]; g.beginPath(); g.moveTo(x-w,base); g.lineTo(x,top); g.lineTo(x+w,base); g.lineTo(x,base+1.6*esc); g.closePath(); g.fill();
      g.fillStyle=["#2f7d45","#37904f","#43a35a"][k]; g.beginPath(); g.moveTo(x-w,base); g.lineTo(x,top); g.lineTo(x,base+1.6*esc); g.closePath(); g.fill(); }
  } else { /* frondoso: tres copas con luz y sombra */
    var cy=y-9*esc;
    g.fillStyle="#2f7a35"; g.beginPath(); g.arc(x+1.6*esc,cy+1*esc,5*esc,0,6.283); g.arc(x-2.4*esc,cy+1.4*esc,4.2*esc,0,6.283); g.fill();
    g.fillStyle="#3f9442"; g.beginPath(); g.arc(x-0.6*esc,cy-1.8*esc,4.6*esc,0,6.283); g.fill();
    g.fillStyle="#5bb054"; g.beginPath(); g.arc(x-2*esc,cy-3*esc,2.2*esc,0,6.283); g.fill();
    if(n>0.85){g.fillStyle="#e25555"; g.fillRect(x+1*esc,cy-1*esc,1.3,1.3); g.fillRect(x-3*esc,cy+1.5*esc,1.3,1.3);}   /* frutos */
  }
}
var PARED=["#f4e3c1","#e8d2b0","#f7f1e3","#e9c9a8","#dfe7ef"], TEJA=["#c0503a","#a8432f","#7a4b3a","#3f6e9c","#5b6b4a"];
/* el aspecto de cada época: paredes, tejados, suelo de las zonas y calles */
var ESTILO=[
  {pared:["#d9b382","#cfa877","#e0bd8e"], teja:["#c9a24a","#b8913e"], suelo:"#c8b48a", calle:"tierra"},     /* Antigüedad: adobe y paja */
  {pared:["#e8dcc4","#ddd0b6","#efe5d0"], teja:["#5d4037","#6d4c41"], suelo:"#bfb08f", calle:"tierra"},     /* Edad Media: piedra y madera */
  {pared:["#f1dfc0","#f3e2c2","#ead2ae"], teja:["#c1663d","#b85a35"], suelo:"#bfb6a6", calle:"piedra"},     /* Renacimiento: estuco y teja */
  {pared:["#b5654a","#a85a42","#9e4f3a"], teja:["#55585e","#4a4d52"], suelo:"#a9a39a", calle:"asfalto"},    /* Revolución Industrial: ladrillo */
  {pared:PARED, teja:TEJA, suelo:"#9aa3a0", calle:"asfalto"},                                                 /* Era Moderna */
  {pared:["#e8f4f8","#dff0f5","#f2f8fa"], teja:null, suelo:"#a7b4b8", calle:"digital"}                        /* Era Digital: vidrio y paneles */
];
function elige(a,n){return a[Math.floor(n*a.length)%a.length];}
/* lo que hay en una casilla: calle, zona o edificio, al estilo de su época */
function pieza(g,t,l,x,y,wx,wy,now,noche,luces,vecina,s,era){
  var n=hsh(wx,wy,7), k, E=ESTILO[era||0];
  if(t==="c"){
    var tipoC=E.calle, con=calleVecina(wx,wy,s,vecina), nc=con[0]+con[1]+con[2]+con[3], w=tipoC==="tierra"?0.27:0.33;
    /* la acera (desde la industria) o el pasto pisado, y encima la calzada: el centro y un brazo hacia cada calle vecina */
    if(tipoC==="asfalto"||tipoC==="digital"){ g.fillStyle=tipoC==="digital"?"#d4dde2":"#c8c2b6"; g.beginPath(); cuad(g,x,y,-0.5,-0.5,0.5,0.5); g.fill(); }
    else if(tipoC==="piedra"){ g.fillStyle="#b8ab92"; g.beginPath(); cuad(g,x,y,-0.5,-0.5,0.5,0.5); g.fill(); }
    var yc=y-hInc(0,0);   /* los detalles van a la altura del centro */
    g.fillStyle=tipoC==="tierra"?"#bf9a6c":tipoC==="piedra"?"#958b80":tipoC==="digital"?"#3d4550":"#4f5561";
    g.beginPath(); cuad(g,x,y,-w,-w,w,w);
    if(con[0])cuad(g,x,y,0,-w,0.5,w); if(con[1])cuad(g,x,y,-0.5,-w,0,w); if(con[2])cuad(g,x,y,-w,0,w,0.5); if(con[3])cuad(g,x,y,-w,-0.5,w,0);
    g.fill();
    if(tipoC==="tierra"){ g.fillStyle="rgba(110,80,45,.35)"; g.fillRect(x-4+n*5,yc-1,1.6,0.9); g.fillRect(x+1-n*4,yc+1.5,1.6,0.9); }
    else if(tipoC==="piedra"){ g.fillStyle="rgba(255,255,255,.22)"; for(k=0;k<6;k++)g.fillRect(x-6+k*2.4,yc-1.5+((k*7+Math.round(n*9))%4),1.2,0.8); }
    else{
      /* líneas del carril y, en los cruces de la Era Moderna en adelante, pasos de cebra */
      g.strokeStyle=tipoC==="digital"?"rgba(80,220,255,.85)":"rgba(255,236,170,.75)"; g.lineWidth=0.6; g.setLineDash([2,2]);
      g.beginPath();
      if(nc<3){ if(con[0])linea(g,x,y,0,0,0.5,0); if(con[1])linea(g,x,y,0,0,-0.5,0); if(con[2])linea(g,x,y,0,0,0,0.5); if(con[3])linea(g,x,y,0,0,0,-0.5); }
      g.stroke(); g.setLineDash([]);
      if(nc>=3&&era>=4){ g.fillStyle="rgba(255,255,255,.75)"; g.beginPath();
        for(k=0;k<4;k++){ var v0=-w+0.04+k*(2*w-0.08)/4, v1=v0+(2*w-0.08)/8;
          if(con[0])cuad(g,x,y,w+0.02,v0,w+0.12,v1); if(con[1])cuad(g,x,y,-w-0.12,v0,-w-0.02,v1);
          if(con[2])cuad(g,x,y,v0,w+0.02,v1,w+0.12); if(con[3])cuad(g,x,y,v0,-w-0.12,v1,-w-0.02); }
        g.fill(); }
    }
    if(noche&&n<(era>=3?0.25:0.1)&&luces.length<500)luces.push(x+5,yc-3,x+5,yc-3);
    return;
  }
  if(t==="R"||t==="C"||t==="I"){
    if(!l){ /* zona sin construir */
      g.fillStyle=t==="R"?"rgba(76,175,80,.45)":t==="C"?"rgba(33,150,243,.42)":"rgba(255,193,7,.48)"; g.beginPath(); cuad(g,x,y,-0.47,-0.47,0.47,0.47); g.fill();
      g.strokeStyle=t==="R"?"#2e7d32":t==="C"?"#1565c0":"#c79100"; g.lineWidth=0.6; g.beginPath(); cuad(g,x,y,-0.42,-0.42,0.42,0.42); g.stroke();
      return;
    }
    dibujaZona(g,t,l,x,y,wx,wy,n,era,noche,luces,vecina,now);
    return;
  }
  /* la guardia de las primeras épocas: una torre de vigía */
  if(t==="p"&&era<=1){ g.fillStyle="#b9ad98"; rombo(g,x,y,HW-0.5,HH-0.25); g.fill();
    caja(g,x,y,0.42,20,"#a1887f","#8d6e63"); g.fillStyle="#5d4037"; g.fillRect(x-0.5,y-30,1,10);
    g.fillStyle="#c62828"; g.beginPath(); g.moveTo(x+0.5,y-30); g.lineTo(x+6,y-28+Math.sin(now/200)); g.lineTo(x+0.5,y-26); g.fill(); return; }
  /* edificios de servicio */
  g.fillStyle=t==="P"?"#5fb85a":t==="Z"?"#e2d6bf":"#a7aeb0"; rombo(g,x,y,HW-0.5,HH-0.25); g.fill();
  switch(t){
    case "e": caja(g,x,y,0.86,15,"#8d939c");
      for(k=0;k<2;k++){var hx=x-4+k*7,hy=y-12-k*2; g.fillStyle="#b0412e"; g.fillRect(hx-1.6,hy-16,3.2,16); g.fillStyle="#f2f2f2"; g.fillRect(hx-1.6,hy-13,3.2,1.5); if(!vecina)humo(g,hx,hy-17,now,k*0.4,true);}
      break;
    case "w": g.fillStyle="#d9dde2"; g.fillRect(x-0.9,y-34,1.8,34); caja(g,x,y,0.25,3,"#c7cbd1");
      g.save(); g.translate(x,y-34); g.rotate(now/(vecina?1200:500)+n*6); g.fillStyle="#f5f7fa";
      for(k=0;k<3;k++){g.rotate(2.094); g.beginPath(); g.moveTo(-0.9,0); g.lineTo(0.9,0); g.lineTo(0.4,-14); g.lineTo(-0.4,-14); g.fill();}
      g.restore(); g.fillStyle="#9aa1a8"; g.beginPath(); g.arc(x,y-34,1.5,0,6.283); g.fill(); break;
    case "s": for(k=0;k<4;k++){var px=x+((k%2)-0.5)*14, py=y+(Math.floor(k/2)-0.5)*7-1;
        g.fillStyle="#9aa1a8"; g.fillRect(px-0.4,py-2,0.8,3);
        g.fillStyle="#1f4f8f"; g.beginPath(); g.moveTo(px-6,py-1); g.lineTo(px,py-4); g.lineTo(px+6,py-1); g.lineTo(px,py+2); g.closePath(); g.fill();
        g.strokeStyle="rgba(150,200,255,.6)"; g.lineWidth=0.4; g.beginPath(); g.moveTo(px-3,py-2.5); g.lineTo(px+3,py+0.5); g.stroke();} break;
    case "h": caja(g,x,y,0.95,13,"#b9bfc6","#d4d9de");
      g.fillStyle="rgba(255,255,255,"+(0.5+0.3*Math.sin(now/150))+")"; g.fillRect(x+2,y-11,6,11); g.fillStyle="#3a93dc"; g.fillRect(x-10,y-14,8,2); break;
    case "b": caja(g,x-5,y+2,0.35,6,"#cfd8dc");
      g.strokeStyle="#78909c"; g.lineWidth=0.8; g.beginPath(); g.moveTo(x+1,y);g.lineTo(x+1,y-14);g.moveTo(x+7,y);g.lineTo(x+7,y-14);g.stroke();
      g.fillStyle="#4fa3e0"; g.beginPath(); g.ellipse(x+4,y-17,5,2.4,0,0,6.283); g.fill(); g.fillRect(x-1,y-21,10,4); g.fillStyle="#7cc0f0"; g.beginPath(); g.ellipse(x+4,y-21,5,2.4,0,0,6.283); g.fill(); break;
    case "d": for(k=0;k<2;k++){var dx2=x-6+k*11, dy2=y+(k?-1:1); g.fillStyle="#b0bec5"; g.beginPath(); g.ellipse(dx2,dy2,6,3,0,0,6.283); g.fill();
        g.fillStyle="#4fb3a8"; g.beginPath(); g.ellipse(dx2,dy2-1,4.6,2.2,0,0,6.283); g.fill();
        g.strokeStyle="rgba(255,255,255,.7)"; g.lineWidth=0.6; g.beginPath(); g.moveTo(dx2,dy2-1); g.lineTo(dx2+Math.cos(now/700+k)*4.4,dy2-1+Math.sin(now/700+k)*2.1); g.stroke();}
      caja(g,x+2,y-5,0.3,7,"#eceff1"); break;
    case "p": caja(g,x,y,0.78,13,"#e8eef7","#3a5ba0"); g.fillStyle="#3a5ba0"; g.fillRect(x-9,y-8,8,2.2);
      g.fillStyle=Math.floor(now/300)%2?"#ff1744":"#2979ff"; g.fillRect(x-1.2,y-17,2.4,2.4); break;
    case "f": caja(g,x,y,0.8,13,"#d84315","#ef6c4a"); g.fillStyle="#fbe9e7"; g.fillRect(x+2,y-4,7,6); g.fillStyle="#8d2a10"; g.fillRect(x-4,y-24,3,12); g.fillStyle="#ffca28"; g.fillRect(x-4,y-25,3,2); break;
    case "H": caja(g,x,y,0.92,22,"#f5f5f5","#e0e0e0"); ventanas(g,x,y,0.92,22,3,"#90caf9",noche,luces,wx+wy*9);
      g.fillStyle="#e53935"; g.fillRect(x-1.2,y-27,2.4,7); g.fillRect(x-3.6,y-24.6,7.2,2.4); break;
    case "k": caja(g,x,y,0.86,13,"#e9a35b","#c97c3c"); ventanas(g,x,y,0.86,13,1,"#fff3c4",noche,luces,wx*5+wy);
      g.fillStyle="#6d4c41"; g.fillRect(x+8,y-26,0.9,16); g.fillStyle=["#1e88e5","#43a047","#e53935"][Math.floor(n*3)];
      g.beginPath(); g.moveTo(x+8.9,y-26); g.lineTo(x+15,y-24+Math.sin(now/200)); g.lineTo(x+8.9,y-21); g.fill(); break;
    case "u": caja(g,x,y,0.96,19,"#e8dcc0","#d6c8a6"); ventanas(g,x,y,0.96,19,2,"#8aa8c8",noche,luces,wx+wy*3);
      g.fillStyle="#3f6e9c"; g.beginPath(); g.arc(x,y-22,6,Math.PI,0); g.fill(); g.fillStyle="#d4af37"; g.fillRect(x-0.6,y-31,1.2,4); break;
    case "L": caja(g,x,y,0.74,13,"#8d6e63","#a1887f"); g.fillStyle="#f5e6c8"; g.fillRect(x-7,y-8,5,4); g.fillStyle="#3e2723"; g.fillRect(x-5,y-8,0.6,4); break;
    case "M": caja(g,x,y,0.92,3,"#eeeeee");
      g.fillStyle="#fafafa"; for(k=0;k<5;k++){g.fillRect(x-HW*0.8+k*3.4,y-15+k*1.6,1.6,12);}
      caja(g,x,y-13,0.9,2,"#e0e0e0"); g.fillStyle="#d7ccc8"; g.beginPath(); g.moveTo(x-HW*0.9,y-15); g.lineTo(x,y-22); g.lineTo(x+HW*0.9,y-15); g.fill(); break;
    case "T": caja(g,x,y,0.86,16,"#7b1fa2","#9c4dcc"); g.fillStyle="#c62828"; g.beginPath(); g.arc(x,y-17,5.5,Math.PI,0); g.fill();
      for(k=0;k<5;k++){g.fillStyle=(Math.floor(now/250)+k)%2?"#ffeb3b":"#ff9800"; g.fillRect(x-HW*0.86+k*2.6+1,y-5+k*1.3,1.2,1.2);} break;
    case "P": g.strokeStyle="#e8dcb8"; g.lineWidth=1.4; g.beginPath(); g.moveTo(x-HW+3,y); g.lineTo(x+HW-3,y); g.stroke();
      arbol(g,x-6,y-2,0.7,0.7); arbol(g,x+7,y+2,0.2,0.65); arbol(g,x+2,y-4,0.9,0.6);
      g.fillStyle="#795548"; g.fillRect(x-3,y+2,4,1); break;
    case "Z": g.fillStyle="#b0bec5"; g.beginPath(); g.ellipse(x,y,7,3.5,0,0,6.283); g.fill(); g.fillStyle="#4fc3f7"; g.beginPath(); g.ellipse(x,y-0.5,5.5,2.6,0,0,6.283); g.fill();
      g.fillStyle="rgba(255,255,255,.85)"; var hj=5+Math.sin(now/180)*1.5; g.fillRect(x-0.6,y-hj-1,1.2,hj);
      for(k=0;k<4;k++){g.fillRect(x+Math.cos(now/400+k*1.57)*3,y-hj-1+Math.abs(Math.sin(now/400+k))*3,0.8,0.8);} break;
    case "O": caja(g,x,y,0.62,4,"#d7ccc8");
      g.fillStyle="#efe6d2"; g.beginPath(); g.moveTo(x-3,y-4); g.lineTo(x,y-1.5); g.lineTo(x,y-40); g.lineTo(x-2,y-38); g.fill();
      g.fillStyle="#d8ccb0"; g.beginPath(); g.moveTo(x,y-1.5); g.lineTo(x+3,y-4); g.lineTo(x+2,y-38); g.lineTo(x,y-40); g.fill();
      g.fillStyle="#d4af37"; g.beginPath(); g.moveTo(x-2,y-38); g.lineTo(x,y-44); g.lineTo(x+2,y-38); g.lineTo(x,y-40); g.fill(); break;
  }
}
/* ---------- edificios de las zonas guardados como imagen ----------
   Cada combinación (zona, nivel, época, riqueza, variante, de día o de noche) se dibuja una sola vez con todo el detalle
   y después se copia: así el volumen suave no cuesta en cada cuadro. Lo que se mueve (humo, balizas) va aparte. */
var SPR={}, nSPR=0, SPE=2, SX0=-26, SX1=48;
function spriteZona(clave,alto,dibujar){
  var e=SPR[clave]; if(e){e.uso=J?J.marco:0; return e;}
  var y0=-alto, y1=20, c=document.createElement("canvas"); c.width=(SX1-SX0)*SPE; c.height=(y1-y0)*SPE;
  var g=c.getContext("2d"); g.setTransform(SPE,0,0,SPE,-SX0*SPE,-y0*SPE);
  var meta={humo:[],luces:[],baliza:null};
  SUAVE=true; try{dibujar(g,meta);}finally{SUAVE=false;}
  e=SPR[clave]={c:c,y0:y0,h:y1-y0,m:meta,uso:J?J.marco:0}; nSPR++;
  if(nSPR>240){var ks=Object.keys(SPR).sort(function(a,b){return SPR[a].uso-SPR[b].uso;}); for(var i=0;i<60;i++){delete SPR[ks[i]]; nSPR--;}}
  return e;
}
function marcaHumo(meta,x,y,now,sd,oscuro){meta.humo.push([x,y,sd,oscuro]);}
/* la riqueza de una casilla: la mía con el valor del suelo del motor; la de una vecina, con el que se calculó al cargarla */
function riquezaDe(wx,wy,vecina){
  var s=J.s, dx=wx-s.cx, dy=wy-s.cy;
  if(!vecina)return A.riqueza(A.mapas(s).valor[A.idx(dx,dy)]);
  var v=vecinoEn(wx,wy); return v&&v.v.valor?A.riqueza(v.v.valor[A.idx(v.dx,v.dy)]):0;
}
function dibujaZona(g,t,l,x,y,wx,wy,n,era,noche,luces,vecina,now){
  var rq=riquezaDe(wx,wy,vecina), vari=Math.floor(n*4)%4, nv=noche?1:0;
  var alto=l>=3?(era>=4||rq===2?112:70):(rq===2?56:50);
  var e=spriteZona(t+l+"."+era+"."+rq+"."+vari+"."+nv,alto,function(gg,meta){
    var nn=(vari+0.5)/4;
    if(rq===2&&t!=="I")zonaRica(gg,t,l,0,0,nn,vari,era,!!noche,meta.luces,meta);
    else{ zonaClasica(gg,t,l,0,0,nn,vari,era,!!noche,meta.luces,meta,0); if(rq===1&&t!=="I")zonaMedia(gg,t,l,0,0,vari,era); }
  });
  g.drawImage(e.c,x+SX0,y+e.y0,SX1-SX0,e.h);
  var m=e.m, k;
  if(!vecina)for(k=0;k<m.humo.length;k++)humo(g,x+m.humo[k][0],y+m.humo[k][1],now,n+m.humo[k][2],m.humo[k][3]);
  if(m.baliza&&Math.floor(now/600)%2){g.fillStyle="#ff1744"; g.fillRect(x+m.baliza[0]-0.8,y+m.baliza[1],1.6,1.6);}
  /* el resplandor: unas pocas ventanas por edificio, repartidas, para que alcance a toda la ciudad */
  if(noche){var paso=2*Math.max(1,Math.ceil(m.luces.length/12)); for(k=0;k<m.luces.length&&luces.length<1200;k+=paso)luces.push(x+m.luces[k],y+m.luces[k+1]);}
}
/* torre redonda: un cilindro con luz de izquierda a derecha, pisos marcados y la tapa elíptica */
function torre(g,x,y,f,h,col,tapa,pisos,noche,luces,sd){
  var rx=HW*f, ry=HH*f, k;
  var vx=Math.min(h*0.5,18), vy=vx*HH/HW, sg=g.createLinearGradient(x,y,x+vx,y+vy); sg.addColorStop(0,"rgba(15,35,25,.28)"); sg.addColorStop(1,"rgba(15,35,25,0)");
  g.fillStyle=sg; g.beginPath(); g.ellipse(x+vx*0.6,y+vy*0.6,rx+vx*0.5,ry+vy*0.5,0,0,6.283); g.fill();
  var gr=g.createLinearGradient(x-rx,0,x+rx,0);
  gr.addColorStop(0,sombrea(col,0.02)); gr.addColorStop(0.28,sombrea(col,0.26)); gr.addColorStop(0.62,sombrea(col,-0.12)); gr.addColorStop(1,sombrea(col,-0.42));
  g.fillStyle=gr; g.beginPath(); g.moveTo(x-rx,y-h); g.lineTo(x-rx,y); g.ellipse(x,y,rx,ry,0,Math.PI,0,true); g.lineTo(x+rx,y-h); g.closePath(); g.fill();
  /* los pisos: arcos del frente; de noche, ventanas encendidas */
  g.strokeStyle="rgba(10,30,50,.22)"; g.lineWidth=0.5;
  for(k=1;k<pisos;k++){var yy=y-k*h/pisos; g.beginPath(); g.ellipse(x,yy,rx,ry,0,0,Math.PI); g.stroke();
    if(noche)for(var w=0;w<4;w++){ if(hsh(sd,k,w)<0.5)continue; var a=0.35+w*0.6, lx=x-Math.cos(a)*rx*0.92, ly=yy+Math.sin(a)*ry*0.92-1.5;
      g.fillStyle="#ffe58a"; g.fillRect(lx-0.8,ly-1,1.6,1.4); if(luces.length<500)luces.push(lx,ly);}}
  /* reflejo vertical del cristal */
  g.fillStyle="rgba(255,255,255,.18)"; g.fillRect(x-rx*0.55,y-h+ry,rx*0.18,h-ry*1.5);
  g.fillStyle=tapa; g.beginPath(); g.ellipse(x,y-h,rx,ry,0,0,6.283); g.fill();
  g.strokeStyle="rgba(255,255,255,.45)"; g.lineWidth=0.5; g.beginPath(); g.ellipse(x,y-h,rx,ry,0,Math.PI*0.9,Math.PI*1.9); g.stroke();
}
function jardin(g,x,y,f){
  var gg=g.createLinearGradient(x-HW*f,y,x+HW*f,y); gg.addColorStop(0,"#8fd27a"); gg.addColorStop(1,"#6cb85a");
  g.fillStyle=gg; rombo(g,x,y,HW*f,HH*f); g.fill();
  g.strokeStyle="#3f7d3a"; g.lineWidth=1.1; rombo(g,x,y,HW*f-0.7,HH*f-0.35); g.stroke();   /* el seto */
}
function arbusto(g,x,y,r,col){
  var gr=g.createRadialGradient(x-r*0.35,y-r*0.45,r*0.15,x,y,r); gr.addColorStop(0,sombrea(col,0.3)); gr.addColorStop(1,sombrea(col,-0.25));
  g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,6.283); g.fill();
}
function piscina(g,x,y){
  g.fillStyle="#eef3f6"; rombo(g,x,y,6,3); g.fill();
  var pg=g.createLinearGradient(x-4,y-2,x+4,y+2); pg.addColorStop(0,"#8ae2ff"); pg.addColorStop(1,"#1e9fd8");
  g.fillStyle=pg; rombo(g,x,y,4.6,2.3); g.fill();
  g.strokeStyle="rgba(255,255,255,.75)"; g.lineWidth=0.4; g.beginPath(); g.moveTo(x-2.2,y-0.6); g.lineTo(x+0.6,y+0.7); g.stroke();
}
function balcones(g,x,y,f,h,pisos){   /* losas claras en las dos caras, piso por piso */
  var hw=HW*f, hh=HH*f;
  for(var p=1;p<pisos;p++){var yy=y-p*h/pisos;
    g.fillStyle="rgba(30,40,50,.22)";   /* la sombra bajo la losa */
    g.beginPath(); g.moveTo(x-hw,yy+0.6); g.lineTo(x,yy+hh+1.1); g.lineTo(x+hw,yy+0.6); g.lineTo(x+hw,yy+1.6); g.lineTo(x,yy+hh+2.1); g.lineTo(x-hw,yy+1.6); g.closePath(); g.fill();
    g.fillStyle="rgba(255,255,255,.8)";
    g.beginPath(); g.moveTo(x-hw-0.6,yy-0.2); g.lineTo(x,yy+hh+0.3); g.lineTo(x,yy+hh+1.1); g.lineTo(x-hw-0.6,yy+0.6); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(x,yy+hh+0.3); g.lineTo(x+hw+0.6,yy-0.2); g.lineTo(x+hw+0.6,yy+0.6); g.lineTo(x,yy+hh+1.1); g.closePath(); g.fill();}
}
function reflejos(g,x,y,f,h){   /* destellos diagonales en las caras de cristal */
  var hw=HW*f, hh=HH*f;
  g.save(); g.beginPath(); g.moveTo(x-hw,y); g.lineTo(x,y+hh); g.lineTo(x+hw,y); g.lineTo(x+hw,y-h); g.lineTo(x,y+hh-h); g.lineTo(x-hw,y-h); g.closePath(); g.clip();
  g.fillStyle="rgba(255,255,255,.16)";
  for(var k=0;k<3;k++){var by=y-h*0.25-k*h*0.3; g.beginPath(); g.moveTo(x-hw,by); g.lineTo(x-hw,by-3); g.lineTo(x+hw,by-h*0.35-3); g.lineTo(x+hw,by-h*0.35); g.closePath(); g.fill();}
  g.restore();
}
/* barrios acomodados y comercio de lujo, según la época */
function zonaRica(g,t,l,x,y,n,vari,era,noche,luces,meta){
  var sd=vari*29+l*3;
  if(t==="R"){
    if(era>=4&&l>=4){ jardin(g,x,y,0.98);
      torre(g,x,y,0.64,era===5?68:62,era===5?"#7fd6e0":"#9fb7d6",era===5?"#6cc070":"#dfe8f2",11,noche,luces,sd);
      g.strokeStyle="#d4af37"; g.lineWidth=0.8; g.beginPath(); g.ellipse(x,y-(era===5?68:62)+2,HW*0.64,HH*0.64,0,0,Math.PI); g.stroke();
      if(era===5){arbusto(g,x-3,y-70,2.2,"#4caf50"); arbusto(g,x+2,y-71,1.8,"#66bb6a");}
      return; }
    if(era>=4&&l===3){ jardin(g,x,y,0.98); caja(g,x,y,0.8,30,"#f2ece2","#d8e8d0"); balcones(g,x,y,0.8,30,6); ventanas(g,x,y,0.8,30,5,"#6d8fb0",noche,luces,sd);
      caja(g,x,y-30,0.8,1.4,"#d4af37"); arbusto(g,x-3,y-32.5,1.6,"#5aa84a"); arbusto(g,x+3,y-32,1.4,"#5aa84a"); return; }
    if(era>=4){ /* villa moderna con piscina */
      jardin(g,x,y,0.98); piscina(g,x+5,y+2.5);
      caja(g,x-4,y-1,0.42,15,"#e9edf1"); caja(g,x+0.5,y-3.5,0.5,9,"#f7f8fa");
      g.fillStyle="rgba(40,70,110,.75)"; g.fillRect(x-7.4,y-9,4.5,3); g.fillRect(x+1.2,y-6.8,5,2.2);
      if(noche){g.fillStyle="#ffe58a"; g.fillRect(x-7.4,y-9,4.5,3); luces.push(x-5,y-8);}
      arbusto(g,x-10,y+2,2.2,"#4f9a4a"); arbusto(g,x+10,y-2,1.8,"#5aa84a"); return; }
    if(era===3){ jardin(g,x,y,0.96); caja(g,x,y,0.62,14,"#c97b5a"); tejado(g,x,y,0.62,14,7,"#4a4d52"); ventanas(g,x,y,0.62,14,2,"#ffe0a0",noche,luces,sd);
      g.fillStyle="#6d4c41"; g.fillRect(x+3,y-26,2,6); arbusto(g,x-9,y+2,2,"#4f9a4a"); arbusto(g,x+9,y+1,1.8,"#4f9a4a");
      g.strokeStyle="#37474f"; g.lineWidth=0.5; g.beginPath(); g.moveTo(x-HW*0.97,y+0.5); g.lineTo(x,y+HH*0.97+0.5); g.lineTo(x+HW*0.97,y+0.5); g.stroke(); return; }
    if(era===2){ jardin(g,x,y,0.96); caja(g,x,y,0.7,14,"#f6e6c8"); var cg=g.createRadialGradient(x-1.5,y-20,0.5,x,y-17,6.5); cg.addColorStop(0,"#e48a5a"); cg.addColorStop(1,"#9c4a28");
      g.fillStyle=cg; g.beginPath(); g.arc(x,y-17,6,Math.PI,0); g.fill(); ventanas(g,x,y,0.7,14,2,"#7a5a3a",noche,luces,sd);
      g.fillStyle="#9ad0f0"; g.beginPath(); g.ellipse(x+9,y+2,2.4,1.2,0,0,6.283); g.fill(); arbusto(g,x-9,y+1,2,"#4f9a4a"); return; }
    if(era===1){ jardin(g,x,y,0.96); caja(g,x-1,y,0.62,13,"#efe6d2"); tejado(g,x-1,y,0.62,13,9,"#4e342e");
      torre(g,x+7,y+1,0.22,20,"#e0d6c2","#6d4c41",3,false,luces,sd); g.fillStyle="#6d4c41"; g.beginPath(); g.moveTo(x+3.5,y-19); g.lineTo(x+7,y-26); g.lineTo(x+10.5,y-19); g.fill();
      arbusto(g,x-9,y+2,1.8,"#4f9a4a"); return; }
    jardin(g,x,y,0.95); caja(g,x,y,0.6,9,"#e9d3a7"); tejado(g,x,y,0.6,9,7,"#b5653a"); arbusto(g,x+8,y+1,2,"#4f9a4a"); arbusto(g,x-8,y+1.5,1.6,"#6b8e23"); return;
  }
  /* comercio de lujo */
  if(era>=4&&l>=4){ g.fillStyle="#cfd8dc"; rombo(g,x,y,HW-1,HH-0.5); g.fill();
    var ht=era===5?74:68; torre(g,x,y,0.6,ht,era===5?"#5fd0f0":"#4f86c6","#e8f1fa",13,noche,luces,sd+5);
    g.strokeStyle="#d4af37"; g.lineWidth=0.9; g.beginPath(); g.moveTo(x,y-ht); g.lineTo(x,y-ht-12); g.stroke(); meta.baliza=[x,y-ht-13];
    if(era===5){g.strokeStyle="rgba(255,64,160,.85)"; g.lineWidth=0.9; g.beginPath(); g.ellipse(x,y-ht*0.6,HW*0.6,HH*0.6,0,0,Math.PI); g.stroke();}
    return; }
  if(era>=4&&l===3){ g.fillStyle="#cfd8dc"; rombo(g,x,y,HW-1,HH-0.5); g.fill();
    caja(g,x,y,0.74,40,era===5?"#5cc8e8":"#4a7fbf","#c9dcef"); reflejos(g,x,y,0.74,40); ventanas(g,x,y,0.74,40,7,"#d8eeff",noche,luces,sd);
    caja(g,x,y-40,0.5,4,"#d4af37"); return; }
  if(era>=4){ /* boutique con fachada de cristal, toldos y palmeras */
    g.fillStyle="#e8e2d6"; rombo(g,x,y,HW-1,HH-0.5); g.fill();
    caja(g,x,y,0.82,13,"#f5f0e6"); var vg=g.createLinearGradient(x-HW*0.82,y-10,x,y); vg.addColorStop(0,"#8ec5ec"); vg.addColorStop(1,"#3b7fb8");
    g.fillStyle=vg; g.beginPath(); g.moveTo(x-HW*0.82+1,y-1); g.lineTo(x-1,y+HH*0.82-1.4); g.lineTo(x-1,y+HH*0.82-9); g.lineTo(x-HW*0.82+1,y-8.6); g.closePath(); g.fill();
    g.fillStyle="#d4af37"; g.fillRect(x-HW*0.82,y-12.4,HW*0.82,1); g.fillStyle=["#b71c1c","#1a237e","#004d40","#4a148c"][vari];
    g.beginPath(); g.moveTo(x,y+HH*0.82-9); g.lineTo(x+HW*0.82,y-9); g.lineTo(x+HW*0.82+1.5,y-6.5); g.lineTo(x+1.5,y+HH*0.82-6.5); g.closePath(); g.fill();
    if(noche){luces.push(x-6,y-4,x-3,y-2);} arbusto(g,x-11,y+2,1.6,"#4f9a4a"); return; }
  if(era===3){ caja(g,x,y,0.9,22,"#b04a3a"); ventanas(g,x,y,0.9,22,3,"#ffe0a0",noche,luces,sd); caja(g,x,y-22,0.94,2,"#e6d3a3");
    g.fillStyle="#d4af37"; g.fillRect(x-7,y-27,11,3); g.fillStyle="#2e7d32"; g.beginPath(); g.moveTo(x-HW*0.9,y-5); g.lineTo(x,y+HH*0.9-5); g.lineTo(x,y+HH*0.9-3); g.lineTo(x-HW*0.9,y-3); g.fill(); return; }
  if(era===2){ caja(g,x,y,0.9,16,"#f3e3c3"); g.fillStyle="#6d4c41";
    for(var k=0;k<4;k++){g.beginPath(); g.arc(x-HW*0.9+2.6+k*3.6,y-1+k*1.8,1.4,Math.PI,0); g.fill(); g.fillRect(x-HW*0.9+1.2+k*3.6,y-1+k*1.8,2.8,2);}
    var dg=g.createRadialGradient(x-2,y-24,0.5,x,y-20,7); dg.addColorStop(0,"#e08a5a"); dg.addColorStop(1,"#8e3f22"); g.fillStyle=dg; g.beginPath(); g.arc(x,y-17,7,Math.PI,0); g.fill();
    g.fillStyle="#f3e3c3"; g.fillRect(x-1,y-27,2,3); return; }
  if(era===1){ caja(g,x,y,0.86,14,"#e6dcc6"); tejado(g,x,y,0.86,14,6,"#6d4c41"); g.fillStyle="#4e342e";
    for(var k2=0;k2<3;k2++){g.beginPath(); g.arc(x-HW*0.86+3+k2*4.4,y-1+k2*2.2,1.6,Math.PI,0); g.fill();}
    g.fillStyle=["#c62828","#1565c0","#2e7d32","#f9a825"][vari]; g.fillRect(x+3,y-26,0.6,7); g.fillRect(x+3.6,y-26,4,2.6); return; }
  caja(g,x,y,0.8,6,"#e8cfa0"); tejado(g,x,y,0.86,6,9,["#c62828","#1565c0","#2e7d32","#f9a825"][vari]);
  tejado(g,x+6,y+3,0.3,3,4,["#f9a825","#c62828","#6a1b9a","#1565c0"][vari]);
}
/* clase media: un detalle más (jardincito, balcones, toldos) sobre el edificio clásico */
function zonaMedia(g,t,l,x,y,vari,era){
  if(t==="R"&&l<=2){ arbusto(g,x+10,y+1,1.7,"#4f9a4a"); g.strokeStyle="rgba(240,240,240,.85)"; g.lineWidth=0.5; g.beginPath(); g.moveTo(x+4,y+HH*0.9); g.lineTo(x+HW*0.9,y+1); g.stroke(); }
  else if(t==="R"&&l>=3&&era>=3) balcones(g,x,y,0.8,era>=4?26:24,4);
  else if(t==="C"&&l<=2){ g.fillStyle=["#e53935","#43a047","#fb8c00","#8e24aa"][vari]; g.beginPath(); g.moveTo(x,y+HH*0.78-4); g.lineTo(x+HW*0.78,y-4); g.lineTo(x+HW*0.78+1.2,y-2.2); g.lineTo(x+1.2,y+HH*0.78-2.2); g.closePath(); g.fill(); }
}
/* los edificios clásicos de las zonas (populares y de clase media), dibujados en el origen para guardarlos como imagen */
function zonaClasica(g,t,l,x,y,n,vari,era,noche,luces,meta,now){
  var k, E=ESTILO[era||0];
    g.fillStyle=E.suelo; rombo(g,x,y,HW-1,HH-0.5); g.fill();
    var pc=elige(E.pared,n), tc=E.teja?elige(E.teja,((vari*0.37+0.11)%1)):null, sd=(vari*31+l);
    if(t==="R"){
      if(era===4){
        if(l===1){caja(g,x,y,0.55,7,pc);tejado(g,x,y,0.55,7,6,tc);arbol(g,x+9,y+1,0.8,0.55);}
        else if(l===2){caja(g,x,y,0.72,11,pc);tejado(g,x,y,0.72,11,7,tc);ventanas(g,x,y,0.72,11,1,"#6d8db0",noche,luces,sd);}
        else if(l===3){caja(g,x,y,0.8,26,pc,sombrea(pc,-0.05));ventanas(g,x,y,0.8,26,4,"#6d8db0",noche,luces,sd);g.fillStyle="#8a8f99";g.fillRect(x-2,y-30,4,3);}
        else{caja(g,x,y,0.68,50,"#d8dee8","#b9c2cf");ventanas(g,x,y,0.68,50,8,"#7aa0c8",noche,luces,sd);g.fillStyle="#9aa3b0";g.fillRect(x-0.5,y-58,1,6);}
      } else if(era===5){
        if(l<=2){caja(g,x,y,l===1?0.58:0.74,l===1?8:13,pc,"#cfe8ee"); placas(g,x,y-(l===1?8:13),l===1?0.4:0.55); ventanas(g,x,y,l===1?0.58:0.74,l===1?8:13,1,"#7fd1d9",noche,luces,sd);}
        else if(l===3){caja(g,x,y,0.8,30,"#7fd1d9","#bff0f2");ventanas(g,x,y,0.8,30,5,"#e0fbff",noche,luces,sd);g.fillStyle="#66bb6a";rombo(g,x,y-30,HW*0.5,HH*0.5);g.fill();}
        else{caja(g,x,y,0.66,60,"#5fb8c9","#a8eef5");ventanas(g,x,y,0.66,60,9,"#e0fbff",noche,luces,sd);g.fillStyle="rgba(80,220,255,"+(0.5+0.4*Math.sin(now/400+n*6))+")";g.fillRect(x-HW*0.66,y-44,HW*0.66,1.2);}
      } else if(era===0||l===1){
        var f1=era===0?0.5:0.56, h1=era===0?6:8;
        caja(g,x,y,f1,h1,pc); tejado(g,x,y,f1,h1,era===0?8:6,tc);
        if(era<=1){g.fillStyle="#5a3a1c";g.fillRect(x+2,y-3,2,3);}
        if(era===3){g.fillStyle="#6d4c41";g.fillRect(x-4,y-h1-9,2,5);}
      } else if(l===2){
        caja(g,x,y,0.72,13,pc); tejado(g,x,y,0.72,13,era===1?9:6,tc); ventanas(g,x,y,0.72,13,1,era<=2?"#7a5a3a":"#6d8db0",noche,luces,sd);
        if(era===1){g.strokeStyle="rgba(70,45,25,.6)";g.lineWidth=0.6;g.beginPath();g.moveTo(x-HW*0.72,y-6);g.lineTo(x,y+HH*0.72-6);g.stroke();}
      } else {
        var h3=era<=2?20:24; caja(g,x,y,0.82,h3,pc); ventanas(g,x,y,0.82,h3,3,era<=2?"#7a5a3a":"#5d7590",noche,luces,sd);
        if(era===2){g.fillStyle="#c1663d";g.beginPath();g.arc(x,y-h3-1,4,Math.PI,0);g.fill();} else tejado(g,x,y,0.82,h3,4,tc);
      }
    } else if(t==="C"){
      if(era===4){
        if(l===1){caja(g,x,y,0.7,9,"#ffd59e");g.fillStyle=n<0.5?"#e53935":"#1e88e5";g.beginPath();g.moveTo(x-HW*0.7,y-5);g.lineTo(x,y+HH*0.7-5);g.lineTo(x,y+HH*0.7-3);g.lineTo(x-HW*0.7,y-3);g.fill();}
        else if(l===2){caja(g,x,y,0.8,15,"#cfe3f7");ventanas(g,x,y,0.8,15,2,"#4a7fb5",noche,luces,(vari*17+l));g.fillStyle="#ff7043";g.fillRect(x-6,y-17,8,2);}
        else if(l===3){caja(g,x,y,0.76,34,"#5d9fd8","#8cc0ee");ventanas(g,x,y,0.76,34,6,"#cfe8ff",noche,luces,(vari*17+l));}
        else{caja(g,x,y,0.66,62,"#3f7fc0","#78b4ec");ventanas(g,x,y,0.66,62,10,"#d8eeff",noche,luces,(vari*17+l));g.strokeStyle="#c0c6cf";g.lineWidth=0.8;g.beginPath();g.moveTo(x,y-62);g.lineTo(x,y-72);g.stroke();
          meta.baliza=[x,y-73];}
      } else if(era===5){
        var hc=[0,10,18,36,64][l]; caja(g,x,y,0.74,hc,"#69c7e0","#a6ecf7"); ventanas(g,x,y,0.74,hc,Math.max(1,Math.round(hc/7)),"#e0fbff",noche,luces,(vari*17+l));
        g.fillStyle="rgba(255,64,160,"+(0.6+0.3*Math.sin(now/300+n*5))+")"; g.fillRect(x-HW*0.74,y-hc*0.55,HW*0.74,1.4);
      } else if(era===0){
        /* puesto de mercado con toldo */
        caja(g,x,y,0.55,4,"#c8a878"); tejado(g,x,y,0.7,4,7,n<0.5?"#d84b3a":"#e0a030");
        g.fillStyle="#7a5a3a"; g.fillRect(x-7,y-4,1,5); g.fillRect(x+6,y-2,1,5);
      } else {
        var hc2=era===1?10:era===2?14:15; hc2+=(l-1)*8;
        caja(g,x,y,0.78,hc2,era===3?"#9e4f3a":era===2?"#f0d9b0":"#e8dcc4");
        if(era===2){g.fillStyle="#6d4c41";for(k=0;k<3;k++){g.beginPath();g.arc(x-HW*0.78+3+k*4,y-1+k*2,1.4,Math.PI,0);g.fill();g.fillRect(x-HW*0.78+1.6+k*4,y-1+k*2,2.8,2);}}
        ventanas(g,x,y,0.78,hc2,Math.max(1,l),era===3?"#ffe0a0":"#7a5a3a",noche,luces,(vari*17+l));
        if(era<=2)tejado(g,x,y,0.78,hc2,5,elige(E.teja,n)); else {g.fillStyle="#2e3b4e";g.fillRect(x-6,y-hc2-3,10,3);}
        if(era===1){g.fillStyle="#8d6e63";g.fillRect(x+HW*0.78-1,y-6,0.6,3);g.fillStyle="#c62828";g.fillRect(x+HW*0.78-2,y-3,3,2);}
      }
    } else {
      if(era<=2){
        /* taller artesanal */
        var fi=[0.6,0.7,0.8][era], hi=[6,9,11][era]+(l-1)*3;
        caja(g,x,y,fi,hi,era===0?"#b08b5a":era===1?"#9e9e9e":"#c0a080"); tejado(g,x,y,fi,hi,5,elige(E.teja,n));
        if(era===1){g.strokeStyle="#6d4c41";g.lineWidth=0.8;g.beginPath();g.arc(x-HW*fi+1,y-3,4,0,6.283);g.stroke();
          g.save();g.translate(x-HW*fi+1,y-3);g.rotate(now/700);g.beginPath();g.moveTo(-4,0);g.lineTo(4,0);g.moveTo(0,-4);g.lineTo(0,4);g.stroke();g.restore();}
        marcaHumo(meta,x+3,y-hi-6,now,n,false);
      } else if(era===5){
        var h5=[0,12,15,18,21][l]; caja(g,x,y,0.9,h5,"#eceff1","#ffffff"); placas(g,x,y-h5,0.75);
        g.fillStyle="rgba(80,220,255,.8)"; g.fillRect(x-HW*0.9+2,y-4,6,1);
      } else {
        var al=[0,9,13,17,21][l], f=[0,0.75,0.85,0.9,0.92][l];
        caja(g,x,y,f,al,era===3?"#9e5a44":"#b7a58a",era===3?"#7a463a":"#8d7f6a");
        g.fillStyle="#6f6455"; for(k=0;k<3;k++){g.beginPath();g.moveTo(x-HW*f+k*5+1,y-al-1);g.lineTo(x-HW*f+k*5+4,y-al-4);g.lineTo(x-HW*f+k*5+4,y-al-1);g.fill();}
        for(k=0;k<Math.min(l+(era===3?1:0),3);k++){var cx=x+3+k*3.5, cy=y-al+1-k; g.fillStyle="#8b4a3c"; g.fillRect(cx-1.2,cy-(era===3?14:10),2.4,era===3?14:10); g.fillStyle="#fafafa"; g.fillRect(cx-1.2,cy-8,2.4,1.2); marcaHumo(meta,cx,cy-(era===3?15:11),now,n+k*0.3,true);}
      }
    }
}
function calleVecina(wx,wy,s,vecina){
  var r=[[1,0],[-1,0],[0,1],[0,-1]], out=[];
  for(var k=0;k<4;k++){var x=wx+r[k][0], y=wy+r[k][1], t="";
    if(!vecina){var dx=x-s.cx, dy=y-s.cy; if(Math.abs(dx)<=A.R&&Math.abs(dy)<=A.R)t=s.tipo[A.idx(dx,dy)];}
    else{var v=vecinoEn(x,y); if(v)t=v.t;}
    out.push(t==="c");}
  return out;
}

function dibuja(now){
  var j=J, g=j.ctx, s=j.s; if(!g)return;
  tam(); j.marco=(j.marco||0)+1;
  var W=j.W, H=j.H, c=j.cam, k=j.dpr*c.z;
  g.setTransform(j.dpr,0,0,j.dpr,0,0);
  g.fillStyle="#3a93dc"; g.fillRect(0,0,W,H);
  g.setTransform(k,0,0,k,j.dpr*W/2-c.x*k,j.dpr*H/2-c.y*k);
  /* lo visible, en unidades del mapa */
  var ix0=c.x-W/2/c.z, ix1=c.x+W/2/c.z, iy0=c.y-H/2/c.z, iy1=c.y+H/2/c.z;
  /* 1) el suelo: trozos de terreno */
  var a=ix0/HW, b=iy0/HH, a2=ix1/HW, b2=(iy1+80)/HH;
  var xs=[(a+b)/2,(a2+b)/2,(a+b2)/2,(a2+b2)/2], ys=[(b-a)/2,(b-a2)/2,(b2-a)/2,(b2-a2)/2];
  var kx0=Math.floor((Math.min.apply(null,xs)-1)/CH), kx1=Math.floor((Math.max.apply(null,xs)+1)/CH);
  var ky0=Math.floor((Math.min.apply(null,ys)-1)/CH), ky1=Math.floor((Math.max.apply(null,ys)+1)/CH);
  var kxA, kyA;
  var lejos=c.z<ZMUNDO, gr=Math.max(1,0.8/c.z);   /* gr: grosor de las líneas para que se vean de lejos */
  if(lejos){ terrenoMundo(g,c); kx1=kx0-1; }       /* de lejos, el terreno es una sola imagen */
  for(kxA=kx0;kxA<=kx1;kxA++)for(kyA=ky0;kyA<=ky1;kyA++){
    var t=trozo(kxA,kyA);
    if(t.ox>ix1||t.ox+t.w<ix0||t.oy>iy1||t.oy+t.h<iy0)continue;
    g.drawImage(t.c,t.ox,t.oy,t.w,t.h);
  }
  var luz=Math.sin((now+desfase)/40000*Math.PI*2*0.25); /* un día de 160 s */
  var noche=Math.max(0,Math.min(1,(-luz+0.25)/0.9));
  var hayNoche=noche>0.25&&!j.capa;
  /* 2) agua que brilla */
  var sMin=Math.floor(iy0/HH)-2, sMax=Math.ceil((iy1+90)/HH)+2, dMin=Math.floor(ix0/HW)-2, dMax=Math.ceil(ix1/HW)+2;
  var sv, dv, wx, wy;
  /* 3) territorio: rejilla al construir y borde */
  var r=A.radio(s), cxI=(s.cx-s.cy)*HW, cyI=(s.cx+s.cy)*HH;
  var rejilla=(j.herr.k==="b"||j.herr.k==="x")&&!lejos;   /* al construir, cada casilla libre del territorio se marca siguiendo el relieve */
  g.save(); g.setLineDash([6*gr,4*gr]); g.lineDashOffset=-now/80; g.strokeStyle="rgba(255,255,255,.85)"; g.lineWidth=1.3*gr;
  g.beginPath(); g.ellipse(cxI,cyI,(r+0.5)*TW/Math.SQRT2,(r+0.5)*TH/Math.SQRT2,0,0,6.283); g.stroke();
  g.strokeStyle="rgba(255,213,79,.5)"; g.setLineDash([]);
  j.vecinos.forEach(function(v){var vx=(v.cx-v.cy)*HW, vy=(v.cx+v.cy)*HH; g.beginPath(); g.ellipse(vx,vy,(v.radio+0.5)*TW/Math.SQRT2,(v.radio+0.5)*TH/Math.SQRT2,0,0,6.283); g.stroke();});
  g.restore();
  /* 3b) influencia cultural y rutas con las ciudades vecinas que se encontraron */
  var inf=A.influencia(s);
  g.save(); g.setLineDash([2*gr,6*gr]); g.strokeStyle="rgba(255,213,79,.35)"; g.lineWidth=gr;
  g.beginPath(); g.ellipse(cxI,cyI,inf*TW/Math.SQRT2,inf*TH/Math.SQRT2,0,0,6.283); g.stroke(); g.restore();
  j.vecinos.forEach(function(v){
    if((s.contactos||[]).indexOf(v.slot)<0)return;
    var vx=(v.cx-v.cy)*HW, vy=(v.cx+v.cy)*HH, firmado=!!(s.tratados&&s.tratados[v.slot]);
    /* el camino sale del borde de mi territorio y llega al borde del suyo */
    var dx=v.cx-s.cx, dy=v.cy-s.cy, d=Math.hypot(dx,dy), a0=(A.radio(s)+1)/d, a1=1-(v.radio+1)/d;
    var p0x=s.cx+dx*a0, p0y=s.cy+dy*a0, p1x=s.cx+dx*a1, p1y=s.cy+dy*a1;
    var X0=(p0x-p0y)*HW, Y0=(p0x+p0y)*HH, X1=(p1x-p1y)*HW, Y1=(p1x+p1y)*HH;
    g.save();
    if(firmado){
      g.strokeStyle=s.era<=1?"#b5916a":s.era===2?"#9c948a":"#5d6470"; g.lineWidth=5*gr; g.beginPath(); g.moveTo(X0,Y0); g.lineTo(X1,Y1); g.stroke();
      if(s.era>=3){g.strokeStyle=s.era===5?"rgba(80,220,255,.8)":"rgba(255,255,255,.6)"; g.lineWidth=0.6; g.setLineDash([3,3]); g.beginPath(); g.moveTo(X0,Y0); g.lineTo(X1,Y1); g.stroke(); g.setLineDash([]);}
      for(var q2=0;q2<4;q2++){var f2=((now/9000)+q2/4)%1, ida=q2%2===0, ff=ida?f2:1-f2;
        vehiculo(g,X0+(X1-X0)*ff,Y0+(Y1-Y0)*ff-1,s.era,["#e53935","#fdd835","#1e88e5","#43a047"][q2],ida===(X1>X0));}
    } else {
      g.strokeStyle="rgba(255,213,79,.85)"; g.lineWidth=1.4*gr; g.setLineDash([5*gr,4*gr]); g.lineDashOffset=-now/60;
      g.beginPath(); g.moveTo(X0,Y0); g.lineTo(X1,Y1); g.stroke();
    }
    g.setLineDash([]);
    var mx=(X0+X1)/2, my=(Y0+Y1)/2;
    g.fillStyle=firmado?"rgba(46,125,50,.9)":"rgba(255,160,0,.92)"; g.beginPath(); g.arc(mx,my-8*gr,7*gr,0,6.283); g.fill();
    g.font=(9*gr)+"px "+FUENTE; g.textAlign="center"; g.textBaseline="middle"; g.fillStyle="#fff"; g.fillText(firmado?"🤝":"✨",mx,my-7.5*gr);
    g.restore();
  });
  /* 4) objetos en orden de pintor (x+y creciente) */
  var luces=[], coches={};
  j.cars.forEach(function(cr){var ax=cr.x+s.cx, ay=cr.y+s.cy, bx=cr.nx+s.cx, by=cr.ny+s.cy, key=(bx+by>ax+ay)?bx+","+by:ax+","+ay; (coches[key]=coches[key]||[]).push(cr);});
  var prev=null;
  if(j.arrastre&&j.arrastre.pinta&&j.arrastre.movido){var tt=opDe(j.herr); prev={}; var gas=0; casillasArrastre(j.arrastre.a,j.arrastre.b,tt).forEach(function(cc){var m=motivo(tt,cc.x-s.cx,cc.y-s.cy,gas); if(!m)gas+=costoOp(tt,cc.x-s.cx,cc.y-s.cy); prev[cc.x+","+cc.y]=!m;});}
  var fuegos={}; s.problemas.forEach(function(p){if(p.k==="incendio"&&p.i>=0)fuegos[p.i]=1;});
  var m=j.capa?A.mapas(s):null;
  if(lejos){ planas(g,s,now); sMax=sMin-1; }   /* de lejos: las ciudades simplificadas, sin el detalle casilla a casilla */
  var stD=s.est||A.calcula(s), mD=A.mapas(s), avisos=[];
  if(j.sub&&!lejos){                             /* bajo tierra: el suelo en sombra, lo construido como manchas y las tuberías */
    g.setTransform(j.dpr,0,0,j.dpr,0,0); g.fillStyle="rgba(42,28,16,.74)"; g.fillRect(0,0,W,H);
    g.setTransform(k,0,0,k,j.dpr*W/2-c.x*k,j.dpr*H/2-c.y*k);
    subsuelo(g,s,sMin,sMax,dMin,dMax,ix0,ix1,iy0,iy1,stD,mD); sMax=sMin-1;
  }
  for(sv=sMin;sv<=sMax;sv++){
    for(dv=dMin;dv<=dMax;dv++){
      if(((sv+dv)&1)!==0)continue;
      wx=(sv+dv)/2; wy=(sv-dv)/2;
      var x=(wx-wy)*HW, y=(wx+wy)*HH;
      if(x<ix0-HW||x>ix1+HW||y<iy0-HH||y>iy1+90+MAXA*ALT)continue;
      var dx=wx-s.cx, dy=wy-s.cy, tipo="", niv=0, vecina=false, ii=-1;
      if(dx>=-A.R&&dx<=A.R&&dy>=-A.R&&dy<=A.R){ii=A.idx(dx,dy); tipo=s.tipo[ii]; niv=s.nivel[ii];}
      else if(j.vecinos.length){var vv=vecinoEn(wx,wy); if(vv&&vv.t){tipo=vv.t; niv=vv.l; vecina=true;}}
      var ter=terr(wx,wy);
      if(ter==="w"&&!tipo&&!lejos){var hh2=hsh(wx,wy,11);
        if(hh2<0.3){var fz=(now/2400+hh2*7)%1, al=0.5*Math.sin(fz*Math.PI); g.strokeStyle="rgba(255,255,255,"+al.toFixed(2)+")"; g.lineWidth=0.7;
          g.beginPath(); g.moveTo(x-5+fz*6,y-1+fz*1.5); g.quadraticCurveTo(x-3+fz*6,y-2.4+fz*1.5,x-1+fz*6,y-1+fz*1.5); g.stroke();}}
      var es=ter==="w"&&!tipo?null:esquinas(wx,wy), yt=y;
      if(tipo&&(tipo==="c"||("RCI".indexOf(tipo)>=0&&!niv))){ INC=es; pieza(g,tipo,niv,x,y,wx,wy,now,hayNoche,luces,vecina,s,vecina?vv.v.era:s.era); INC=null; yt=y-(es[0]+es[1]+es[2]+es[3])/4*ALT; }
      else if(tipo){ var mx=Math.max(es[0],es[1],es[2],es[3]); if(mx>Math.min(es[0],es[1],es[2],es[3]))cimiento(g,x,y,es,mx); yt=y-mx*ALT;
        pieza(g,tipo,niv,x,yt,wx,wy,now,hayNoche,luces,vecina,s,vecina?vv.v.era:s.era); }
      else if(es){ yt=y-(es[0]+es[1]+es[2]+es[3])/4*ALT;
        if(ter==="f")arbol(g,x,yt+2,hsh(wx,wy,5),0.95);
        else if(ter==="g"&&!vecina&&ii<0&&hsh(wx,wy,9)<0.035)arbol(g,x,yt+2,hsh(wx,wy,5),0.7);
        if(rejilla&&ii>=0&&A.dentro(s,dx,dy)){g.strokeStyle="rgba(255,255,255,.28)"; g.lineWidth=0.5; contorno(g,wx,wy); g.stroke();} }
      if(ii>=0&&s.cable[ii])poste(g,s,wx,wy,x,yt);
      if(ii>=0&&tipo&&tipo!=="c"&&(niv||!A.EDIF[tipo].zona)){
        var Ed=A.EDIF[tipo], luzMal=!stD.sinLuz&&!Ed.mw&&stD.redE[mD.redE.comp[ii]]<0.95, aguaMal=!Ed.agua&&stD.redA[mD.redA.comp[ii]]<0.95;
        if(luzMal||aguaMal)avisos.push(x,yt,luzMal&&(!aguaMal||Math.floor(now/1000)%2)?"luz":"agua");
      }
      if(ii>=0&&fuegos[ii])fuego(g,x,yt,now);
      var lista=coches[wx+","+wy]; if(lista)lista.forEach(function(cr){coche(g,cr,s);});
      if(prev){var pv=prev[wx+","+wy]; if(pv!==undefined){g.fillStyle=pv?"rgba(105,240,174,.45)":"rgba(255,82,82,.45)"; contorno(g,wx,wy); g.fill();}}
    }
  }
  /* los avisos de zonas sin electricidad o sin agua, por encima de todo */
  for(var av=0;av<avisos.length;av+=3)sinServicio(g,avisos[av],avisos[av+1],avisos[av+2],now);
  /* chispas de crecimiento */
  j.chispas=j.chispas.filter(function(ch){var f=(now-ch.t0)/900; if(f>=1)return false;
    var dx=Math.floor(ch.i/A.LADO)-A.R+s.cx, dy=ch.i%A.LADO-A.R+s.cy, x=(dx-dy)*HW, y=(dx+dy)*HH-20-f*14-altTop(dx,dy)*ALT;
    g.fillStyle="rgba(255,235,59,"+(1-f)+")"; g.beginPath(); g.moveTo(x,y-3); g.lineTo(x+1,y-1); g.lineTo(x+3,y); g.lineTo(x+1,y+1); g.lineTo(x,y+3); g.lineTo(x-1,y+1); g.lineTo(x-3,y); g.lineTo(x-1,y-1); g.fill(); return true;});
  /* 5) capa de información */
  if(m){
    var kk=j.capa;
    for(var i=0;i<A.N;i++){ if(!s.tipo[i]&&kk!=="cont"&&!(kk==="luz"&&s.cable[i])&&!(kk==="agua"&&s.tubo[i]))continue;
      var ddx=Math.floor(i/A.LADO)-A.R, ddy=i%A.LADO-A.R; if(!A.dentro(s,ddx,ddy))continue;
      var col;
      if(kk==="cont"){var v2=m.cont[i]; if(v2<0.3)continue; col="rgba(229,57,53,"+Math.min(0.75,v2/5)+")";}
      else if(kk==="feliz"){var v3=m.feliz[i]; col=v3>0?"rgba(67,160,71,"+Math.min(0.75,0.2+v3/20)+")":"rgba(0,0,0,.12)";}
      else if(kk==="valor"){ if(s.tipo[i]!=="R"&&s.tipo[i]!=="C")continue; var vq=m.valor[i];
        col=vq<0.42?"rgba(229,57,53,"+(0.35+0.3*(0.42-vq))+")":vq<0.66?"rgba(253,216,53,.6)":"rgba(67,160,71,"+(0.5+0.3*vq)+")"; }
      else if(kk==="luz"||kk==="agua"){
        var tq=s.tipo[i], Eq=tq?A.EDIF[tq]:null, red=kk==="luz"?"redE":"redA";
        if(!tq||tq==="c"){ if(kk==="luz"?!s.cable[i]:!s.tubo[i])continue; col=kk==="luz"?"rgba(255,213,79,.75)":"rgba(41,182,246,.7)"; }
        else if(kk==="luz"&&stD.sinLuz)col="rgba(0,0,0,.15)";
        else if(kk==="luz"?Eq.mw:Eq.agua)col=kk==="luz"?"rgba(255,160,0,.9)":"rgba(2,136,209,.9)";
        else if(Eq.zona&&!s.nivel[i]&&kk==="agua")col="rgba(0,0,0,.12)";
        else col=stD[red][m[red].comp[i]]>=0.95?"rgba(67,160,71,.6)":"rgba(229,57,53,.6)";
      }
      else col=m.cov[kk][i]?"rgba(67,160,71,.55)":"rgba(229,57,53,.5)";
      g.fillStyle=col; contorno(g,ddx+s.cx,ddy+s.cy); g.fill();
    }
  }
  /* 5b) sombras de nubes que pasan despacio sobre el mapa (de día) */
  if(!j.capa&&noche<0.6){
    var PX=2600, PY=1500;   /* las nubes viven en el mapa (se repiten cada PX×PY), así no se mueven con la cámara */
    for(var nb=0;nb<6;nb++){
      var ncx=nb*977+now*0.006*(1+nb*0.15), ncy=nb*613;
      ncx-=PX*Math.round((ncx-c.x)/PX); ncy-=PY*Math.round((ncy-c.y)/PY);
      var nr=(70+nb*22)/Math.max(0.6,c.z)*Math.min(1,c.z*2+0.2);
      var gr2=g.createRadialGradient(ncx,ncy,nr*0.15,ncx,ncy,nr); gr2.addColorStop(0,"rgba(20,35,60,"+(0.1*(1-noche))+")"); gr2.addColorStop(1,"rgba(20,35,60,0)");
      g.fillStyle=gr2; g.beginPath(); g.ellipse(ncx,ncy,nr,nr*0.55,0,0,6.283); g.fill();
    }
  }
  /* 6) atardecer, noche y luces */
  if(!j.capa&&noche>0.02&&noche<0.75){
    g.setTransform(j.dpr,0,0,j.dpr,0,0); g.fillStyle="rgba(255,120,40,"+(0.16*Math.sin(Math.min(1,noche/0.75)*Math.PI)).toFixed(3)+")"; g.fillRect(0,0,W,H);
    g.setTransform(k,0,0,k,j.dpr*W/2-c.x*k,j.dpr*H/2-c.y*k);
  }
  if(!j.capa&&noche>0.02){
    g.setTransform(j.dpr,0,0,j.dpr,0,0); g.fillStyle="rgba(12,20,60,"+(0.5*noche)+")"; g.fillRect(0,0,W,H);
    g.setTransform(k,0,0,k,j.dpr*W/2-c.x*k,j.dpr*H/2-c.y*k);
    if(hayNoche){g.globalCompositeOperation="lighter"; g.fillStyle=(s.era<3?"rgba(255,150,60,":s.era===5?"rgba(140,230,255,":"rgba(255,214,110,")+(0.35*noche)+")";
      for(var li=0;li<luces.length;li+=2){g.beginPath(); g.arc(luces[li],luces[li+1],2.6,0,6.283); g.fill();}
      g.globalCompositeOperation="source-over";}
  }
  /* 6b) viñeta: los bordes un poco más oscuros centran la mirada */
  g.setTransform(j.dpr,0,0,j.dpr,0,0);
  if(!j.vin||j.vin.w!==W||j.vin.h!==H){var vg=g.createRadialGradient(W/2,H/2,Math.min(W,H)*0.45,W/2,H/2,Math.max(W,H)*0.75); vg.addColorStop(0,"rgba(0,0,0,0)"); vg.addColorStop(1,"rgba(5,15,30,.32)"); j.vin={w:W,h:H,g:vg};}
  g.fillStyle=j.vin.g; g.fillRect(0,0,W,H);
  g.setTransform(k,0,0,k,j.dpr*W/2-c.x*k,j.dpr*H/2-c.y*k);
  /* 7) la casilla señalada y la elegida */
  var hv=j.hover;
  if(hv&&!j.arrastre){
    var h=j.herr, okc=true;
    if(h.k==="b"||h.k==="x"||h.k==="r")okc=!motivo(opDe(h),hv.x-s.cx,hv.y-s.cy);
    g.strokeStyle=h.k==="info"?"rgba(255,255,255,.9)":okc?"#69f0ae":"#ff5252"; g.lineWidth=1.4; contorno(g,hv.x,hv.y); g.stroke();
  }
  if(j.sel){g.strokeStyle="#ffeb3b"; g.lineWidth=1.6; contorno(g,j.sel.x,j.sel.y); g.stroke();}
  /* 8) nombres de las ciudades vecinas, en la capa de textos (en píxeles de pantalla, nítidos aunque la ciudad vaya en retro) */
  g=j.gt||g; g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,g.canvas.width,g.canvas.height);
  var dt=j.gt?j.dtx:j.dpr; g.setTransform(dt,0,0,dt,0,0);
  var fz=Math.max(11,Math.min(17,9*c.z));
  g.font="600 "+fz+"px "+FUENTE; g.textAlign="center"; g.textBaseline="middle";
  j.vecinos.concat([{cx:s.cx,cy:s.cy,nombre:s.nombre,jugador:"tú",yo:true,era:s.era}]).forEach(function(v){
    var x=(v.cx-v.cy)*HW, y=(v.cx+v.cy)*HH-(v.yo?(A.radio(s)+1)*HH*1.4:(v.radio+1)*HH*1.4), tx=(v.yo?"🏛️ ":"🏙️ ")+v.nombre+" · "+v.jugador+(lejos&&A.ERAS[v.era]?" · "+A.ERAS[v.era].ico:"");
    x=(x-c.x)*c.z+W/2; y=(y-c.y)*c.z+H/2;
    var w=g.measureText(tx).width+fz*1.1, hh=fz*1.55;
    if(x+w/2<0||x-w/2>W||y+hh<0||y-hh>H)return;
    g.fillStyle=v.yo?"rgba(13,71,161,.85)":"rgba(0,0,0,.6)"; g.beginPath(); if(g.roundRect)g.roundRect(x-w/2,y-hh/2,w,hh,hh/2); else g.rect(x-w/2,y-hh/2,w,hh); g.fill();
    g.fillStyle="#fff"; g.fillText(tx,x,y+0.5);
  });
  /* 8b) el cartel de la época nueva */
  if(j.banner){var eb=(now-j.banner.t0)/4500; if(eb>=1)j.banner=null; else{
    var al=eb<0.1?eb/0.1:eb>0.8?(1-eb)/0.2:1;
    g.globalAlpha=al; g.fillStyle="rgba(10,16,35,.72)"; g.fillRect(0,H/2-44,W,88);
    g.textAlign="center"; g.textBaseline="middle"; g.fillStyle="#ffd54f"; g.font="800 26px "+FUENTE; g.fillText(j.banner.t,W/2,H/2-10);
    g.fillStyle="#fff"; g.font="500 13px "+FUENTE; g.fillText(j.banner.sub,W/2,H/2+20); g.globalAlpha=1;}}
  /* 9) dinero del mes, flotando */
  g.font="800 15px "+FUENTE; g.textAlign="center";
  j.flot=j.flot.filter(function(f){var e=(now-f.t0)/1800; if(e>=1)return false;
    g.globalAlpha=1-e; g.fillStyle="#fff"; g.fillText(f.t,W/2+1,58-e*24+1); g.fillStyle=f.c; g.fillText(f.t,W/2,58-e*24); g.globalAlpha=1; return true;});
}
/* vista de mundo: el terreno alrededor como un mapa de un píxel cada 2×2 casillas, que se dibuja de una vez
   inclinado con la misma transformación isométrica (x,y) → ((x−y)·16, (x+y)·8). Se rehace al alejarse mucho. */
var MK=2, MM=360;
function terrenoMundo(g,c){
  var j=J, wx=(c.x/HW+c.y/HH)/2, wy=(c.y/HH-c.x/HW)/2;
  var ox=Math.floor(wx/128)*128-MM*MK/2, oy=Math.floor(wy/128)*128-MM*MK/2, m=j.mapa;
  if(!m||m.ox!==ox||m.oy!==oy){
    var cv=document.createElement("canvas"); cv.width=MM; cv.height=MM;
    var x2=cv.getContext("2d"), img=x2.createImageData(MM,MM), d=img.data, seed=j.s.mseed, px, py, k=0;
    var TT=function(x,y){return A.terreno(seed,x,y);}, al=new Float32Array(MM*MM);
    for(py=0;py<MM;py++)for(px=0;px<MM;px++)al[py*MM+px]=celdaAlt(seed,ox+px*MK,oy+py*MK,TT,true);
    for(py=0;py<MM;py++)for(px=0;px<MM;px++){
      var tx=ox+px*MK, ty=oy+py*MK, t=A.terreno(seed,tx,ty), n=hsh(tx,ty,seed), r, gg, b;
      var v=suave(tx,ty,9,seed);
      if(t==="w"){var cerca=A.terreno(seed,tx+2,ty)!=="w"||A.terreno(seed,tx-2,ty)!=="w"||A.terreno(seed,tx,ty+2)!=="w"||A.terreno(seed,tx,ty-2)!=="w"; r=cerca?88:52;gg=cerca?178:140;b=cerca?236:214;}
      else if(t==="f"){r=60+(v*16|0);gg=128+(v*20|0);b=62;} else {r=110+(v*30|0);gg=184+(v*22|0);b=88+(v*10|0);}
      /* sombreado del relieve: más claro arriba de las colinas y en las laderas que miran a la luz */
      var h0=al[py*MM+px], hx=px+1<MM?al[py*MM+px+1]:h0, hy=py+1<MM?al[(py+1)*MM+px]:h0, f=t==="w"?1:1+0.05*(h0-2)+0.09*((hx-h0)+(hy-h0)*0.5);
      r=Math.min(255,r*f); gg=Math.min(255,gg*f); b=Math.min(255,b*f);
      k=(py*MM+px)*4; d[k]=r; d[k+1]=gg; d[k+2]=b; d[k+3]=255;
    }
    x2.putImageData(img,0,0);
    m=j.mapa={c:cv,ox:ox,oy:oy};
  }
  g.save(); g.transform(HW*MK,HH*MK,-HW*MK,HH*MK,(m.ox-m.oy)*HW,(m.ox+m.oy)*HH);
  g.imageSmoothingEnabled=true; g.drawImage(m.c,-0.5,-0.5); g.restore();
}
/* vista de mundo: cada ciudad como un mosaico de colores (calles, viviendas, comercio, industria, servicios) */
var PLANO={R:["#c8e6c9","#e8b48a","#d9926a","#c7735a","#b85a4a"],C:"#64a8e8",I:"#c9a85a",P:"#2e7d32",Z:"#d7ccc8",cultura:"#ab47bc",servicio:"#fafafa",energia:"#ff8f00",agua:"#29b6f6"};
function planas(g,s,now){
  var j=J, ciudades=[{tipo:s.tipo,nivel:s.nivel,cx:s.cx,cy:s.cy,era:s.era}].concat(j.vecinos.map(function(v){return {tipo:v.tipoA,nivel:v.nivelA,cx:v.cx,cy:v.cy,era:v.era};}));
  ciudades.forEach(function(c){
    var grupos={}, i, t, col, E;
    for(i=0;i<A.N;i++){ t=c.tipo[i]; if(!t||t===".")continue; E=A.EDIF[t];
      if(t==="c")col=c.era<=1?"#b5916a":c.era===2?"#9c948a":"#4f5662";
      else if(t==="R")col=PLANO.R[c.nivel[i]]; else if(t==="C")col=c.nivel[i]?PLANO.C:"#bbdefb"; else if(t==="I")col=c.nivel[i]?PLANO.I:"#fff3c4";
      else if(t==="P")col=PLANO.P; else if(t==="Z")col=PLANO.Z; else col=PLANO[E.grupo]||PLANO.servicio;
      (grupos[col]=grupos[col]||[]).push(i);
    }
    Object.keys(grupos).forEach(function(col){
      g.fillStyle=col; g.beginPath();
      grupos[col].forEach(function(i){var wx=Math.floor(i/A.LADO)-A.R+c.cx, wy=i%A.LADO-A.R+c.cy, x=(wx-wy)*HW, y=(wx+wy)*HH;
        g.moveTo(x,y-HH); g.lineTo(x+HW,y); g.lineTo(x,y+HH); g.lineTo(x-HW,y); g.closePath();});
      g.fill();
    });
  });
}
/* un poste del tendido eléctrico con sus cables hacia los postes y edificios vecinos */
function poste(g,s,wx,wy,x,y){
  var top=y-12;
  g.strokeStyle="rgba(25,25,25,.75)"; g.lineWidth=0.45; g.beginPath();
  [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(v){
    var nx=wx+v[0], ny=wy+v[1], dx=nx-s.cx, dy=ny-s.cy; if(Math.abs(dx)>A.R||Math.abs(dy)>A.R)return;
    var k=A.idx(dx,dy), cab=s.cable[k], ed=s.tipo[k]&&s.tipo[k]!=="c"; if(!cab&&!ed)return;
    if(cab&&(v[0]<0||v[1]<0))return;   /* entre dos postes, el cable lo tiende uno solo */
    var X=(nx-ny)*HW, Y=(nx+ny)*HH-altTop(nx,ny)*ALT-(cab?12:7);
    g.moveTo(x,top); g.quadraticCurveTo((x+X)/2,(top+Y)/2+2.5,X,Y);
  });
  g.stroke();
  g.fillStyle="#5d4037"; g.fillRect(x-0.6,top,1.2,12); g.fillRect(x-3,top+0.6,6,0.9);
  g.fillStyle="#cfd8dc"; g.fillRect(x-2.8,top,0.9,0.9); g.fillRect(x+1.9,top,0.9,0.9);
}
/* el aviso que parpadea sobre una zona sin electricidad o sin agua */
function sinServicio(g,x,y,cual,now){
  var cy=y-26-Math.abs(Math.sin(now/300))*2;   /* da saltitos para llamar la atención */
  g.globalAlpha=0.75+0.25*Math.sin(now/200);
  g.fillStyle="rgba(198,40,40,.94)"; g.beginPath(); g.arc(x,cy,4.4,0,6.283); g.fill();
  g.strokeStyle="#fff"; g.lineWidth=0.6; g.stroke();
  g.fillStyle=cual==="luz"?"#ffeb3b":"#81d4fa"; g.beginPath();
  if(cual==="luz"){g.moveTo(x+0.9,cy-3.1); g.lineTo(x-1.9,cy+0.5); g.lineTo(x-0.1,cy+0.5); g.lineTo(x-0.9,cy+3.1); g.lineTo(x+1.9,cy-0.6); g.lineTo(x+0.1,cy-0.6); g.closePath();}
  else{g.moveTo(x,cy-3.1); g.quadraticCurveTo(x+2.8,cy+0.6,x,cy+2.8); g.quadraticCurveTo(x-2.8,cy+0.6,x,cy-3.1);}
  g.fill(); g.globalAlpha=1;
}
/* la vista subterránea: lo construido como manchas (verde con agua, rojo sin agua, azul las bombas), las calles
   apenas marcadas y las tuberías que unen todo */
function subsuelo(g,s,sMin,sMax,dMin,dMax,ix0,ix1,iy0,iy1,stD,mD){
  var sv, dv, wx, wy, x, y, celdas=[];
  for(sv=sMin;sv<=sMax;sv++)for(dv=dMin;dv<=dMax;dv++){
    if(((sv+dv)&1)!==0)continue;
    wx=(sv+dv)/2; wy=(sv-dv)/2; x=(wx-wy)*HW; y=(wx+wy)*HH;
    if(x<ix0-HW||x>ix1+HW||y<iy0-HH||y>iy1+90+MAXA*ALT)continue;
    var dx=wx-s.cx, dy=wy-s.cy; if(Math.abs(dx)>A.R||Math.abs(dy)>A.R)continue;
    var i=A.idx(dx,dy), t=s.tipo[i];
    if(t&&t!=="c"){ var E=A.EDIF[t];
      g.fillStyle=E.agua?"rgba(41,182,246,.9)":(E.zona&&!s.nivel[i])?"rgba(255,255,255,.12)":stD.redA[mD.redA.comp[i]]>=0.95?"rgba(102,187,106,.6)":"rgba(239,83,80,.65)";
      contorno(g,wx,wy); g.fill(); }
    else if(t==="c"){ g.strokeStyle="rgba(230,230,230,.22)"; g.lineWidth=0.6; contorno(g,wx,wy); g.stroke(); }
    if(s.tubo[i])celdas.push([wx,wy,i]);
  }
  /* las tuberías: del centro de cada casilla hacia las vecinas con tubería o con algo construido */
  [["#01579b",3.4],["#4fc3f7",2]].forEach(function(capa){
    g.strokeStyle=capa[0]; g.lineWidth=capa[1]; g.lineCap="round"; g.beginPath();
    celdas.forEach(function(c){
      var X=(c[0]-c[1])*HW, Y=(c[0]+c[1])*HH-altTop(c[0],c[1])*ALT, solo=true;
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(v){
        var nx=c[0]+v[0], ny=c[1]+v[1], dx=nx-s.cx, dy=ny-s.cy; if(Math.abs(dx)>A.R||Math.abs(dy)>A.R)return;
        var k=A.idx(dx,dy); if(!s.tubo[k]&&!(s.tipo[k]&&s.tipo[k]!=="c"))return;
        solo=false;
        var X2=(nx-ny)*HW, Y2=(nx+ny)*HH-altTop(nx,ny)*ALT; g.moveTo(X,Y); g.lineTo((X+X2)/2,(Y+Y2)/2);
      });
      if(solo){g.moveTo(X-1,Y); g.lineTo(X+1,Y);}
    });
    g.stroke();
  });
  g.lineCap="butt";
}
function coche(g,cr,s){
  var ax=cr.x+s.cx, ay=cr.y+s.cy, bx=cr.nx+s.cx, by=cr.ny+s.cy, f=Math.min(1,cr.t);
  var wx=ax+(bx-ax)*f, wy=ay+(by-ay)*f, x=(wx-wy)*HW, y=(wx+wy)*HH;
  var ha=altTop(ax,ay), hb=altTop(bx,by); y-=(ha+(hb-ha)*f)*ALT;   /* sube y baja con las calles */
  /* por el carril derecho: se aparta a un lado de la dirección en pantalla */
  var vx=(bx-ax-(by-ay))*HW, vy=(bx-ax+(by-ay))*HH, n=Math.hypot(vx,vy)||1;
  x+=-vy/n*2.6; y+=vx/n*2.6;
  vehiculo(g,x,y,s.era,cr.c,vx>=0);
}
/* de la carreta al coche eléctrico */
function vehiculo(g,x,y,era,col,der){
  g.fillStyle="rgba(0,0,0,.25)"; g.fillRect(x-2.5,y-0.5,5,2);
  if(era<=1){ g.fillStyle="#8d6e63"; g.fillRect(x-2.2,y-2.6,4.4,2); g.fillStyle="#4e342e"; g.fillRect(x-2,y-0.8,1.2,1.2); g.fillRect(x+0.8,y-0.8,1.2,1.2);
    g.fillStyle=era===0?"#a1887f":"#795548"; g.fillRect(x+(der?2.4:-4.4),y-3,2,2.2); return; }               /* carreta y su animal */
  if(era===2){ g.fillStyle="#3e2723"; g.fillRect(x-2,y-4,4,3.2); g.fillStyle="#d7ccc8"; g.fillRect(x-1.2,y-3.4,2.4,1.1);
    g.fillStyle="#6d4c41"; g.fillRect(x+(der?2.2:-4.6),y-3,2.4,2); return; }                                  /* carruaje */
  if(era===3){ g.fillStyle="#212121"; g.fillRect(x-2.4,y-3,4.8,2.4); g.fillRect(x-1.4,y-4.6,2.8,1.8); return; }   /* auto antiguo */
  g.fillStyle=col; g.fillRect(x-2.4,y-3,4.8,2.6);
  g.fillStyle="rgba(200,230,255,.9)"; g.fillRect(x-1.2,y-4.2,2.4,1.3);
  if(era===5){g.fillStyle="rgba(80,220,255,.7)"; g.fillRect(x-2.4,y-0.6,4.8,0.7);}                             /* eléctrico */
}
function fuego(g,x,y,now){
  for(var k=0;k<4;k++){var f=Math.sin(now/90+k*1.7)*1.5, hx=x-6+k*4;
    g.fillStyle=k%2?"#ff9800":"#ff5722"; g.beginPath(); g.moveTo(hx-2.5,y-2); g.lineTo(hx,y-12-f-k); g.lineTo(hx+2.5,y-2); g.fill();
    g.fillStyle="#ffeb3b"; g.beginPath(); g.moveTo(hx-1,y-2); g.lineTo(hx,y-7-f); g.lineTo(hx+1,y-2); g.fill();}
  humo(g,x,y-14,now,0.3,true);
}

window.AxCiudadUI={portada:portada,juega:juega,cerrar:cerrar,
  estado:function(){return J&&J.s;},camara:function(){return J?{x:J.cam.x,y:J.cam.y,z:J.cam.z}:null;},
  /* para las pruebas: la casilla del mapa que se ve en un punto de la pantalla, y al revés */
  pantalla:function(dx,dy){if(!J)return null; var s=J.s, wx=s.cx+dx, wy=s.cy+dy, ix=(wx-wy)*HW, iy=(wx+wy)*HH-altTop(wx,wy)*ALT; return {x:(ix-J.cam.x)*J.cam.z+J.W/2,y:(iy-J.cam.y)*J.cam.z+J.H/2};},
  guarda:function(){return guarda();},vecinos:function(){return J?J.vecinos:null;},reloj:function(ms){desfase=ms;},log:function(){return J?J.log:null;}};
})();
