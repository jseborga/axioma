/* ===========================================================
   THE FINAL TEST · Matemática Montessori · pantalla
   -----------------------------------------------------------
   Perfiles de niñas y niños (apodo y animalito), el mapa de su
   etapa con una escena que se llena de dibujos al dominar cada
   concepto, la lección en tres tiempos, el ciclo de trabajo que se
   adapta (concreto → dibujo → números), el control del error con
   un segundo intento, el refuerzo cuando hay muchos errores, la
   explicación con IA y la reflexión al terminar. «Para adultos»
   muestra el avance, lo que necesita refuerzo e ideas para casa.
   Los perfiles se guardan en el dispositivo y, con una cuenta de
   Google, también en el servidor.
     AxMateUI.portada() · AxMateUI.cerrar()
   =========================================================== */
(function(){
"use strict";
var M=window.AxMate, DB=window.AxMateDibujos;
if(!M||!DB)return;
var $=function(id){return document.getElementById(id);};
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function hoy(){var d=new Date(); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}
function semilla(){return (Math.floor(Math.random()*4294967295)^Date.now())>>>0;}
var RONDA=8, LS="ax-mate-v1";
var AVATARES=["🦁","🐼","🐯","🦊","🐸","🐧","🐨","🦄","🐙","🐢","🐰","🐻","🐶","🐱","🦉","🐬"];
var ACENTO=["#ff9f1c","#43c000","#2bb673","#1cb0f6","#7c5cff","#ff6b4a","#00a8e8","#8e5cf7","#ff4fa3"];
var FASES=[{ico:"🧱",nom:"Material"},{ico:"✏️",nom:"Dibujo"},{ico:"🔢",nom:"Números"}];
var SENTIR=[["😄","¡Feliz!"],["🙂","Bien"],["😐","Más o menos"],["😟","Me costó"]];
var INSIGNIAS=[[1,"🌱","Primer concepto dominado"],[5,"🎒","Exploradora o explorador"],[10,"🧭","Aventura matemática"],[20,"🏅","Gran constancia"],[30,"🎓","Pensamiento matemático"],[48,"👑","¡Todos los conceptos!"]];

/* ---------- datos: en el dispositivo y, con cuenta, en el servidor ---------- */
var D=carga();
function carga(){try{var j=JSON.parse(localStorage.getItem(LS)); if(j&&j.lista)return j;}catch(e){} return {act:null,lista:[],voz:true,borrados:[]};}
function guardaLocal(){try{localStorage.setItem(LS,JSON.stringify(D));}catch(e){}}
function perfil(id){for(var i=0;i<D.lista.length;i++)if(D.lista[i].id===id)return D.lista[i]; return null;}
function actual(){return perfil(D.act)||null;}
function usuario(){var u=window.AxAccount&&AxAccount.user?AxAccount.user():null; return u&&!u.guest?u:null;}
function api(path,metodo,body){
  return fetch(path,{method:metodo||"GET",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined})
    .then(function(r){return r.text().then(function(t){var j;try{j=JSON.parse(t);}catch(x){throw {error:"http",status:r.status};} if(!r.ok)throw j; return j;});});
}
var pendientes={}, tSube=null, nube={estado:"local"};
function cambia(pf){pf.upd=Date.now(); pendientes[pf.id]=1; guardaLocal(); if(tSube)clearTimeout(tSube); tSube=setTimeout(sube,1500);}
function sube(){
  tSube=null; if(!usuario())return;
  (D.borrados||[]).slice().forEach(function(id){api("/api/mate/perfiles/"+encodeURIComponent(id),"DELETE").then(function(){D.borrados=D.borrados.filter(function(x){return x!==id;}); guardaLocal();}).catch(function(){});});
  Object.keys(pendientes).forEach(function(id){var pf=perfil(id); if(!pf){delete pendientes[id]; return;}
    api("/api/mate/perfiles/"+encodeURIComponent(id),"PUT",{nombre:pf.nombre,avatar:pf.avatar,etapa:pf.etapa,datos:pf}).then(function(){delete pendientes[id]; nube.estado="ok";})
      .catch(function(e){nube.estado=e&&e.error==="mate_not_configured"?"sin_tablas":"error";});});
}
/* trae los perfiles de la cuenta y se queda con la versión más nueva de cada uno */
function baja(){
  if(!usuario())return Promise.resolve(false);
  return api("/api/mate/perfiles").then(function(r){
    var cambio=false;
    (r.perfiles||[]).forEach(function(s){var d=s.datos; if(!d||!d.id||(D.borrados||[]).indexOf(d.id)>=0)return; var l=perfil(d.id);
      if(!l){D.lista.push(d); cambio=true;} else if((d.upd||0)>(l.upd||0)){D.lista[D.lista.indexOf(l)]=d; cambio=true;}});
    D.lista.forEach(function(l){var esta=(r.perfiles||[]).some(function(s){return s.id===l.id;}); var srv=(r.perfiles||[]).filter(function(s){return s.id===l.id;})[0];
      if(!esta||(srv&&srv.datos&&(l.upd||0)>(srv.datos.upd||0)))pendientes[l.id]=1;});
    nube.estado="ok"; guardaLocal(); if(Object.keys(pendientes).length)sube(); return cambio;
  }).catch(function(e){nube.estado=e&&e.error==="mate_not_configured"?"sin_tablas":"error"; return false;});
}
function nuevoPerfil(nombre,avatar,etapa){
  var pf={id:"m"+Date.now().toString(36)+Math.random().toString(36).slice(2,7),nombre:nombre,avatar:avatar,etapa:etapa,prog:{},refl:[],dias:{},creado:Date.now(),upd:Date.now()};
  D.lista.push(pf); D.act=pf.id; cambia(pf); return pf;
}
function progDe(pf,cid){if(!pf.prog[cid])pf.prog[cid]=M.nuevo(); return pf.prog[cid];}
function dominados(pf,e){return M.CONCEPTOS.filter(function(c){return (e==null||c.e===e)&&pf.prog[c.id]&&pf.prog[c.id].dom;}).length;}
function racha(pf){var n=0, d=new Date(); for(var i=0;i<400;i++){var k=d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
  if(pf.dias&&pf.dias[k])n++; else if(i>0)break; d.setDate(d.getDate()-1);} return n;}
function insignias(pf){var t=dominados(pf), out=INSIGNIAS.filter(function(x){return t>=x[0];}).map(function(x){return {ico:x[1],nom:x[2]};});
  M.ETAPAS.forEach(function(E,i){if(M.etapaCompleta(pf.prog,i))out.push({ico:E.ico,nom:"Etapa completa: "+E.nom});}); return out;}

/* ---------- voz y sonido ---------- */
function vozEs(){try{var v=speechSynthesis.getVoices().filter(function(x){return /^es/i.test(x.lang);}); return v.filter(function(x){return /419|MX|US|AR|CO|BO/i.test(x.lang);})[0]||v[0]||null;}catch(e){return null;}}
function paraVoz(t){
  return String(t).replace(/[\uD83C-\uD83E][\uDC00-\uDFFF]|[☀-➿]|️|‍/g,"").replace(/−/g," menos ").replace(/×/g," por ").replace(/÷/g," entre ")
    .replace(/x²/g,"x al cuadrado").replace(/²/g," al cuadrado").replace(/³/g," al cubo").replace(/√/g,"raíz de ").replace(/(\d)\/(\d)/g,"$1 sobre $2").replace(/=/g," es igual a ").replace(/\?/g,"").replace(/\s+/g," ");
}
function habla(t){if(!window.speechSynthesis||!t)return; try{speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(paraVoz(t)); u.lang="es-ES"; var v=vozEs(); if(v){u.voice=v;u.lang=v.lang;} u.rate=0.92; speechSynthesis.speak(u);}catch(e){}}
function callaVoz(){try{if(window.speechSynthesis)speechSynthesis.cancel();}catch(e){}}
function vozAuto(t){if(D.voz)habla(t);}
var AC=null;
function mudo(){return !!(window.AxGranjaUI&&AxGranjaUI.mudo&&AxGranjaUI.mudo());}
function tono(notas,tipo,dur,vol){if(mudo())return; try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==="suspended")AC.resume(); var t=AC.currentTime;
  notas.forEach(function(f,i){var o=AC.createOscillator(),g=AC.createGain();o.type=tipo||"sine";o.frequency.value=f;g.gain.setValueAtTime(vol||0.05,t+i*dur);g.gain.exponentialRampToValueAtTime(0.0008,t+(i+1)*dur);o.connect(g);g.connect(AC.destination);o.start(t+i*dur);o.stop(t+(i+1)*dur+0.02);});}catch(e){}}
var SON={bien:function(){tono([523,659,784],"triangle",0.09,0.05);},otra:function(){tono([392,349],"sine",0.12,0.035);},
  sube:function(){tono([523,659,784,1047],"triangle",0.09,0.06);},domina:function(){tono([523,659,784,1047,1319,1568],"triangle",0.1,0.06);},toca:function(){tono([660],"sine",0.04,0.03);}};

/* ---------- pantalla ---------- */
var S={};             /* lo que se está haciendo ahora */
function panel(){return $("rapido-panel");}
function pinta(html,cls){var pn=panel(); if(!pn)return null; pn.hidden=false; callaVoz(); S.teclado=null;
  var pf=actual(), e=S.etapa!=null?S.etapa:pf?pf.etapa:0;
  pn.innerHTML='<div class="mt '+(cls||"")+'" data-etapa="'+e+'" style="--cielo1:'+M.ETAPAS[e].cielo[0]+';--cielo2:'+M.ETAPAS[e].cielo[1]+';--ac:'+ACENTO[e]+'">'+html+'</div>';
  var g=pn.querySelector(".mt");
  /* pantalla completa en todas las pantallas: en la barra de arriba o, si no hay, en la esquina */
  if(window.AxAprender&&!g.querySelector("[data-ap-full]")){var top=g.querySelector(".mt-top"); if(top)top.insertAdjacentHTML("beforeend",AxAprender.botonCompleta()); else g.insertAdjacentHTML("afterbegin",'<div class="ap-full-flota">'+AxAprender.botonCompleta()+'</div>');} try{if(pn.getBoundingClientRect().top<0)pn.scrollIntoView({block:"start"});}catch(x){} return g;}
function on(raiz,sel,fn){Array.prototype.forEach.call(raiz.querySelectorAll(sel),function(b){b.onclick=function(ev){ev.preventDefault();fn(b,ev);};});}
function btnVoz(t){return '<button type="button" class="mt-voz" data-voz="'+esc(t)+'" aria-label="Escuchar" title="Escuchar">🔊</button>';}
function activaVoz(raiz){on(raiz,"[data-voz]",function(b){habla(b.getAttribute("data-voz"));});}
function lumi(g,t){return window.AxAprender?'<div class="mt-lumi">'+AxAprender.mascota(g,t||64)+'</div>':'';}
function estrellas(n,max){var s='';for(var i=1;i<=max;i++)s+=i<=n?'★':'☆';return '<span class="mt-est" aria-label="nivel '+n+' de '+max+'">'+s+'</span>';}
function faseChips(f){return '<span class="mt-fases">'+FASES.map(function(x,i){return '<i class="'+(i<f?"hecho":i===f?"ahora":"")+'" title="'+x.nom+'">'+x.ico+'</i>';}).join("")+'</span>';}

/* ===================== PORTADA: elegir perfil ===================== */
function portada(materia){
  if(materia){D.materia=materia; guardaLocal();}
  baja().then(function(c){if(c&&S.portada)portadaPinta();});
  /* con un solo perfil se entra directo; con varios, cada quien elige el suyo */
  if(D.lista.length===1&&actual())return entra();
  portadaPinta();
}
/* la materia elegida: Matemática o Inglés */
function entra(){if(D.materia==="ingles"&&window.AxInglesUI)return AxInglesUI.mapa(); if(D.materia==="ciencias"&&window.AxCienciasUI)return AxCienciasUI.mapa(); mapa();}
function portadaPinta(){
  S={portada:true};
  if(!D.lista.length)return crear();
  var ing=D.materia==="ingles";
  var g=pinta('<div class="mt-portada">'+(window.AxAprender?AxAprender.globo("feliz",ing?"Hello! ¿Quién va a aprender inglés hoy?":"¡Hola! ¿Quién va a aprender hoy?","grande"):'')+
    '<h3>'+(ing?'🔤 Inglés para niñas y niños':'🧮 Matemática Montessori')+'</h3>'+
    '<p class="fine">'+(ing?'Un curso de inglés desde cero con juegos: palabras con dibujos y sonido, frases, escuchar y hablar. Lecciones cortas, a tu ritmo. <a href="#" class="guia-link" data-guia="ingles">¿Cómo funciona?</a>'
      :'Juegos para aprender matemática desde inicial hasta secundaria: primero con el material, luego con dibujos y al final con números. Cada quien avanza a su ritmo y los errores se convierten en ayuda. <a href="#" class="guia-link" data-guia="mate">¿Cómo funciona?</a>')+'</p>'+
    '<h4>¿Quién va a aprender hoy?</h4><div class="mt-perfiles">'+
    D.lista.map(function(pf){var E=M.ETAPAS[pf.etapa]||M.ETAPAS[0], r=racha(pf);
      return '<button type="button" class="mt-perfil" data-pf="'+esc(pf.id)+'"><span class="mt-ava">'+esc(pf.avatar)+'</span><b>'+esc(pf.nombre)+'</b><small>'+E.ico+' '+esc(E.nom)+'</small>'+
        '<small>⭐ '+dominados(pf)+(r?' · 🔥 '+r+(r===1?' día':' días'):'')+'</small></button>';}).join("")+
    (D.lista.length<8?'<button type="button" class="mt-perfil nuevo" id="mt-nuevo"><span class="mt-ava">＋</span><b>Nuevo perfil</b><small>para otra niña o niño</small></button>':'')+
    '</div><div class="actions"><button type="button" class="ghost" id="mt-adultos">👪 Para adultos</button></div>'+
    '<p class="fine">'+(usuario()?(nube.estado==="sin_tablas"?'Los perfiles se guardan en este dispositivo (faltan las tablas en el servidor).':'Los perfiles se guardan en tu cuenta y en este dispositivo.'):'Los perfiles se guardan en este dispositivo. Un adulto puede entrar con Google para guardarlos en su cuenta.')+'</p></div>');
  if(!g)return;
  on(g,"[data-pf]",function(b){D.act=b.getAttribute("data-pf"); guardaLocal(); entra();});
  if($("mt-nuevo"))$("mt-nuevo").onclick=function(){crear();};
  $("mt-adultos").onclick=function(){puerta(function(){adultos();});};
}

/* ===================== crear o editar un perfil ===================== */
function crear(pf){
  var av=pf?pf.avatar:pick(AVATARES), et=pf?pf.etapa:0;
  var g=pinta('<div class="mt-crear"><h3>'+(pf?'Editar perfil':'🧮 ¡Hola! Vamos a crear tu perfil')+'</h3>'+
    '<label class="mt-campo">Tu nombre o apodo<input id="mt-nom" maxlength="20" autocomplete="off" value="'+esc(pf?pf.nombre:"")+'" placeholder="Ej.: Sofi"></label>'+
    '<p class="fine">Usa solo un apodo: no hace falta el nombre completo.</p>'+
    '<h4>Elige tu animalito</h4><div class="mt-avatares">'+AVATARES.map(function(a){return '<button type="button" data-av="'+a+'" class="'+(a===av?"on":"")+'" aria-label="'+a+'">'+a+'</button>';}).join("")+'</div>'+
    '<h4>¿En qué curso estás?</h4><div class="mt-etapas-sel">'+M.ETAPAS.map(function(E,i){return '<button type="button" data-et="'+i+'" class="'+(i===et?"on":"")+'"><span>'+E.ico+'</span><b>'+esc(E.nom)+'</b><small>'+esc(E.sub)+'</small></button>';}).join("")+'</div>'+
    '<p class="fine">Puedes cambiar de etapa cuando quieras: si algo es muy fácil o muy difícil, elige otra.</p>'+
    '<p class="msg bad" id="mt-err" hidden></p><div class="actions">'+(D.lista.length?'<button type="button" class="ghost" id="mt-vuelve">Volver</button>':'')+'<button type="button" class="primary" id="mt-listo">'+(pf?'Guardar':'¡Listo, a jugar!')+'</button></div></div>');
  if(!g)return;
  on(g,"[data-av]",function(b){av=b.getAttribute("data-av"); Array.prototype.forEach.call(g.querySelectorAll("[data-av]"),function(x){x.classList.toggle("on",x===b);}); SON.toca();});
  on(g,"[data-et]",function(b){et=+b.getAttribute("data-et"); Array.prototype.forEach.call(g.querySelectorAll("[data-et]"),function(x){x.classList.toggle("on",x===b);}); SON.toca();});
  if($("mt-vuelve"))$("mt-vuelve").onclick=function(){pf?adultos():portadaPinta();};
  $("mt-listo").onclick=function(){
    var n=$("mt-nom").value.replace(/\s+/g," ").trim();
    if(!n){var er=$("mt-err"); er.hidden=false; er.textContent="Escribe tu nombre o un apodo."; $("mt-nom").focus(); return;}
    if(pf){pf.nombre=n.slice(0,20); pf.avatar=av; pf.etapa=et; cambia(pf); adultos(); return;}
    nuevoPerfil(n.slice(0,20),av,et); entra();
  };
  $("mt-nom").onkeydown=function(e){if(e.key==="Enter")$("mt-listo").click();};
}

/* ===================== la cabecera: quién, materia y botones ===================== */
function cabeza(pf,materia,linea,extra){
  return '<div class="mt-cab"><button type="button" class="mt-ava-btn" id="mt-cambiar" title="Cambiar de perfil">'+esc(pf.avatar)+'</button>'+
      '<div class="mt-quien"><b>'+esc(pf.nombre)+'</b><small>'+linea+'</small>'+(extra||'')+'</div>'+
      '<button type="button" class="mt-mini-btn" id="mt-voz-auto" title="Leer en voz alta">'+(D.voz?'🔊':'🔈')+'</button>'+
      (window.AxAprender?AxAprender.botonCompleta():'')+'<button type="button" class="mt-mini-btn" id="mt-adultos" title="Para adultos">👪</button></div>'+
    '<div class="ap-materias" role="tablist">'+[["mate","🧮","Matemática"],["ingles","🔤","Inglés"],["ciencias","🔬","Ciencias"]].filter(function(x){return x[0]==="mate"||(x[0]==="ingles"&&window.AxInglesUI)||(x[0]==="ciencias"&&window.AxCienciasUI);}).map(function(x){
      return '<button type="button" role="tab" data-materia="'+x[0]+'" aria-selected="'+(x[0]===materia)+'" class="m-'+x[0]+(x[0]===materia?' on':'')+'"><span>'+x[1]+'</span>'+x[2]+'</button>';}).join("")+'</div>';
}
/* al cambiar de materia desde las pestañas, el menú y la ayuda «?» también cambian */
function marcaModo(m){
  document.body.setAttribute("data-mode",m);
  var nom=m==="ingles"?"Inglés":m==="ciencias"?"Ciencias":"Matemática";
  if($("mode-label"))$("mode-label").textContent=nom; if($("hdr"))$("hdr").textContent=nom;
  ["mate","ingles","ciencias"].forEach(function(x){var b=$("t-"+x); if(b)b.setAttribute("aria-checked",x===m?"true":"false");});
}
function activaCabeza(g){
  on(g,"[data-materia]",function(b){var m=b.getAttribute("data-materia"); if(m===D.materia||(!D.materia&&m==="mate"))return; D.materia=m; guardaLocal(); SON.toca(); entra(); marcaModo(m);});
  $("mt-cambiar").onclick=function(){portadaPinta();};
  $("mt-adultos").onclick=function(){puerta(function(){adultos();});};
  $("mt-voz-auto").onclick=function(){D.voz=!D.voz; guardaLocal(); this.textContent=D.voz?'🔊':'🔈'; if(D.voz)habla("Voy a leer en voz alta.");};
}

/* ===================== el mapa de la etapa ===================== */
function mapa(etapa){
  var pf=actual(); if(!pf)return portadaPinta();
  if(etapa!=null&&etapa!==pf.etapa){pf.etapa=etapa; cambia(pf);}
  var e=pf.etapa, E=M.ETAPAS[e], cs=M.deEtapa(e), sug=M.sugerido(pf.prog,e), dom=dominados(pf,e), ins=insignias(pf), r=racha(pf);
  S={etapa:e}; if(D.materia!=="mate"){D.materia="mate"; guardaLocal();}
  var g=pinta(cabeza(pf,"mate",'⭐ '+dominados(pf)+' dominados'+(r?' · 🔥 '+r+(r===1?' día':' días seguidos'):''),
      ins.length?'<span class="mt-insig">'+ins.map(function(x){return '<i title="'+esc(x.nom)+'">'+x.ico+'</i>';}).join("")+'</span>':'')+
    '<div class="mt-etapas" role="tablist">'+M.ETAPAS.map(function(X,i){var c=M.etapaCompleta(pf.prog,i);
      return '<button type="button" role="tab" data-et="'+i+'" aria-selected="'+(i===e)+'" class="'+(i===e?"on":"")+(c?" completa":"")+'"><span>'+X.ico+'</span>'+esc(X.nom)+(c?' ✔':'')+'</button>';}).join("")+'</div>'+
    '<div class="mt-escena">'+DB.escena(e,pf.prog)+'<div class="mt-escena-pie"><b>'+E.ico+' '+esc(E.nom)+'</b><span>'+dom+' de '+cs.length+' conceptos dominados</span><i style="--p:'+Math.round(100*dom/cs.length)+'%"></i></div></div>'+
    (sug?'<button type="button" class="mt-sugerido" data-c="'+sug+'"><span>'+(window.AxAprender?AxAprender.mascota("anima",62):M.POR_ID[sug].dibujo)+'</span><b>Te sugiero: '+M.POR_ID[sug].dibujo+' '+esc(M.POR_ID[sug].nom)+'</b><small>'+esc(M.POR_ID[sug].obj)+'</small></button>'
      :'<div class="mt-sugerido listo"><span>🏆</span><b>¡Dominaste toda la etapa!</b><small>'+(e<M.ETAPAS.length-1?'Cuando quieras, pasa a '+esc(M.ETAPAS[e+1].nom)+'. También puedes repasar.':'Eres un ejemplo de constancia.')+'</small>'+(e<M.ETAPAS.length-1?'<button type="button" class="primary" data-et="'+(e+1)+'">Ir a '+esc(M.ETAPAS[e+1].nom)+'</button>':'')+'</div>')+
    '<div class="mt-conceptos">'+cs.map(function(c){var p=pf.prog[c.id], av=M.avance(p,c), est=!p?"nuevo":p.dom?"dom":M.necesitaRefuerzo(p)?"refuerzo":"camino";
      var chip={nuevo:"Nuevo",dom:"Dominado ✅",refuerzo:"Repasemos 💪",camino:"En camino"}[est];
      return '<button type="button" class="mt-concepto '+est+(c.id===sug?" sug":"")+'" data-c="'+c.id+'"><span class="mt-dib">'+c.dibujo+'</span><b>'+esc(c.nom)+'</b>'+
        '<span class="mt-barra"><i style="width:'+Math.round(av*100)+'%"></i></span><small><span class="chip">'+chip+'</span>'+(p&&!p.dom?' '+faseChips(p.f):'')+'</small></button>';}).join("")+'</div>');
  if(!g)return;
  on(g,"[data-c]",function(b){objetivo(b.getAttribute("data-c"));});
  Array.prototype.forEach.call(g.querySelectorAll(".mt-sticker"),function(s){s.addEventListener("click",function(){objetivo(s.getAttribute("data-c"));});});
  on(g,"[data-et]",function(b){mapa(+b.getAttribute("data-et"));});
  activaCabeza(g);
  var sel=g.querySelector(".mt-etapas .on"); if(sel&&sel.scrollIntoView)try{sel.scrollIntoView({block:"nearest",inline:"center"});}catch(x){}
}

/* ===================== el objetivo del concepto ===================== */
function objetivo(cid){
  var pf=actual(), c=M.POR_ID[cid]; if(!pf||!c)return mapa();
  var p=pf.prog[cid], nuevo=!p||!p.i;
  S={etapa:c.e,c:cid};
  var g=pinta('<div class="mt-top"><button type="button" class="mt-atras" id="mt-atras">← Mapa</button><b>'+c.dibujo+' '+esc(c.nom)+'</b></div>'+
    '<div class="mt-objetivo"><span class="mt-dib grande">'+c.dibujo+'</span>'+
    '<p class="mt-meta">🎯 <b>Mi objetivo:</b> '+esc(c.obj)+' '+btnVoz(c.obj)+'</p>'+
    '<p class="fine">🧰 <b>Material Montessori:</b> '+esc(c.mat)+'</p>'+
    (p?'<div class="mt-estado">'+faseChips(p.dom?3:p.f)+' '+estrellas(p.dom?c.nmax:p.n,c.nmax)+'<span class="mt-barra"><i style="width:'+Math.round(M.avance(p,c)*100)+'%"></i></span>'+
      (p.dom?'<p class="msg good">✅ ¡Ya dominas este concepto! Puedes practicar para no olvidarlo.</p>':M.necesitaRefuerzo(p)?'<p class="fine">💪 Vamos a repasarlo con calma, empezando con el material.</p>':'<p class="fine">Vas en la fase <b>'+FASES[p.f].ico+' '+FASES[p.f].nom+'</b>, nivel '+p.n+' de '+c.nmax+'.</p>')+'</div>'
      :'<p class="fine">Primero verás la lección en tres pasos: <b>esto es</b>, <b>muéstrame</b> y <b>¿qué es?</b>. Después practicarás a tu ritmo.</p>')+
    '<div class="actions">'+(nuevo?'<button type="button" class="primary grande" id="mt-leccion">▶ Empezar la lección</button>':
      '<button type="button" class="primary grande" id="mt-practica">▶ Practicar</button><button type="button" class="ghost" id="mt-leccion">📖 Ver la lección otra vez</button>')+'</div></div>');
  if(!g)return;
  activaVoz(g);
  $("mt-atras").onclick=function(){mapa();};
  $("mt-leccion").onclick=function(){leccion(cid,1);};
  if($("mt-practica"))$("mt-practica").onclick=function(){ronda(cid);};
  vozAuto(c.obj);
}

/* ===================== la lección en tres tiempos ===================== */
function leccion(cid,paso){
  var c=M.POR_ID[cid], pf=actual(); if(!c||!pf)return mapa();
  S={etapa:c.e,c:cid,modo:"t"+paso};
  var cab='<div class="mt-top"><button type="button" class="mt-atras" id="mt-atras">← '+esc(c.nom)+'</button><span class="mt-pasos">'+
    ["Esto es","Muéstrame","¿Qué es?"].map(function(t,i){return '<i class="'+(i+1<paso?"hecho":i+1===paso?"ahora":"")+'">'+(i+1)+'. '+t+'</i>';}).join("")+'</span></div>';
  if(paso===1){
    var it=M.ejercicio(cid,1,0,semilla());
    var g=pinta(cab+'<div class="mt-tres"><h3>1 · Esto es</h3><p class="mt-pres">'+esc(c.pres)+' '+btnVoz(c.pres)+'</p>'+
      '<div class="mt-tarea"><p class="mt-preg">'+esc(it.q)+'</p>'+(it.v?DB.vis(it.v):'')+
      '<div class="mt-modelo"><b>Mira cómo se hace:</b><ol>'+it.ex.map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ol><p>Respuesta: <b>'+esc(muestra(it))+'</b></p></div></div>'+
      '<div class="actions"><button type="button" class="primary grande" id="mt-sigue">Ahora tú →</button></div></div>');
    if(!g)return; activaVoz(g); activaVis(g,it);
    $("mt-atras").onclick=function(){objetivo(cid);};
    $("mt-sigue").onclick=function(){leccion(cid,2);};
    vozAuto(c.pres+". "+it.ex.join(" "));
    return;
  }
  /* 2: muéstrame (elegir entre tres) · 3: ¿qué es? (responder) */
  /* para elegir entre tres, lo que se arma con el material se muestra ya dibujado */
  var it2=M.ejercicio(cid,1,0,semilla());
  if(paso===2&&it2.r.t!=="op"&&it2.r.t!=="num")it2=M.ejercicio(cid,1,1,semilla());
  if(paso===2&&it2.r.t==="num")it2=M.comoOpciones(it2);
  item(it2,{cab:cab,titulo:paso===2?"2 · Muéstrame":"3 · ¿Qué es?",leccion:true,
    alFin:function(){ if(paso===2)leccion(cid,3); else{var pf2=actual(); progDe(pf2,cid); cambia(pf2); ronda(cid,true);} }});
  $("mt-atras").onclick=function(){objetivo(cid);};
}
function muestra(it){var r=it.r; if(r.t==="op"){var o=r.ops[r.ok]; return typeof o==="string"?o:"la opción "+(r.ok+1);} if(r.t==="bandeja")return r.ok+" "+(r.ok===1?M.OBJ[r.e][0]:M.OBJ[r.e][1]); return M.respuestaTxt(it);}

/* ===================== el ciclo de trabajo ===================== */
function ronda(cid,trasLeccion){
  var pf=actual(); if(!pf)return portadaPinta();
  S={etapa:M.POR_ID[cid].e,c:cid,ronda:{i:0,ok:0,res:[],eventos:[],trasLeccion:!!trasLeccion}};
  siguiente();
}
function siguiente(){
  var R=S.ronda, pf=actual(), c=M.POR_ID[S.c]; if(!R||!pf)return mapa();
  if(R.domina)return celebra();
  if(R.i>=RONDA)return reflexion();
  var p=progDe(pf,S.c), it=M.ejercicio(S.c,p.n,p.f,semilla());
  var dots='';for(var i=0;i<RONDA;i++)dots+='<i class="'+(i<R.res.length?(R.res[i]?"bien":"ayuda"):i===R.i?"ahora":"")+'"></i>';
  item(it,{cab:'<div class="mt-top"><button type="button" class="mt-atras" id="mt-atras">← '+esc(c.nom)+'</button><span class="mt-dots" aria-label="ejercicio '+(R.i+1)+' de '+RONDA+'">'+dots+'</span>'+
    '<span class="mt-fase-chip" title="'+FASES[p.f].nom+'">'+FASES[p.f].ico+' '+FASES[p.f].nom+' '+estrellas(p.n,c.nmax)+'</span></div>',practica:true});
  $("mt-atras").onclick=function(){if(R.res.length)reflexion(); else objetivo(S.c);};
}

/* ---------- un ejercicio: el material, la respuesta y el control del error ---------- */
function item(it,o){
  var c=M.POR_ID[it.c];
  S.it=it; S.o=o; S.intento=0; S.listo=false;
  var vis=it.ocultaVisual?'':DB.vis(it.v);
  var g=pinta(o.cab+(o.titulo?'<h3 class="mt-tit">'+o.titulo+'</h3>':'')+
    '<div class="mt-tarea'+(it.ocultaVisual?' abstracto':'')+'"><div class="mt-preg-fila"><p class="mt-preg">'+esc(it.q)+'</p>'+btnVoz(it.q)+'</div>'+
    '<div class="mt-area" id="mt-area">'+vis+(it.ocultaVisual?'<button type="button" class="mt-ver-mat" id="mt-ver-mat">🧱 Ver el material</button>':'')+'</div>'+
    '<div class="mt-resp" id="mt-resp"></div><div class="mt-fb" id="mt-fb" aria-live="polite"></div></div>',"jugando");
  if(!g)return;
  activaVoz(g); activaVis(g,it);
  if($("mt-ver-mat"))$("mt-ver-mat").onclick=function(){verMaterial();};
  respuestaUI(it);
  vozAuto(it.q);
}
function verMaterial(){var a=$("mt-area"); if(!a||!S.it)return; a.innerHTML=DB.vis(S.it.v); activaVis(a,S.it); S.vioMaterial=true;}
/* material que se mueve: repartir de a uno en los platos */
function activaVis(raiz,it){
  var rp=raiz.querySelector(".mt-reparto"); if(!rp)return;
  var n=+rp.getAttribute("data-n"), k=+rp.getAttribute("data-k"), e=rp.getAttribute("data-e"), puestos=0;
  var b=document.createElement("button"); b.type="button"; b.className="mt-mini-btn mt-repartir"; b.textContent="🤲 Repartir una vuelta"; rp.appendChild(b);
  b.onclick=function(){ if(puestos>=n)return; var cesta=rp.querySelectorAll(".mt-cesta span"), platos=rp.querySelectorAll(".mt-plato");
    for(var i=0;i<k&&puestos<n;i++){var s=cesta[cesta.length-1-puestos]; if(s)s.style.visibility="hidden"; var x=document.createElement("span"); x.textContent=e; platos[i].appendChild(x); puestos++;}
    SON.toca(); if(puestos>=n){b.disabled=true; b.textContent="¡Repartido! Cuenta un plato";} };
}
function respuestaUI(it){
  var z=$("mt-resp"), r=it.r; if(!z)return;
  if(r.t==="op"){
    var visuales=r.ops.some(function(x){return typeof x!=="string";});
    z.innerHTML='<div class="mt-ops'+(visuales?' visuales':'')+(r.ops.length===2?' dos':'')+'">'+r.ops.map(function(x,i){
      return '<button type="button" class="mt-op" data-i="'+i+'">'+(typeof x==="string"?esc(x):DB.vis(x.v))+'</button>';}).join("")+'</div>';
    on(z,"[data-i]",function(b){if(S.listo||b.disabled)return; var i=+b.getAttribute("data-i"); var ok=M.corrige(it,i); b.classList.add(ok?"bien":"mal"); if(!ok)b.disabled=true; responde(i,ok);});
    S.teclado=function(k){var i="123".indexOf(k); if(i>=0&&i<r.ops.length){var b=z.querySelector('[data-i="'+i+'"]'); if(b&&!b.disabled)b.click(); return true;}};
    return;
  }
  if(r.t==="num"){
    var extra=[];
    if(r.neg)extra.push("−"); if(r.dec)extra.push(","); if(r.frac)extra.push("/");
    var teclas=["1","2","3","4","5","6","7","8","9"].concat([extra[0]||"",  "0","⌫"]);
    z.innerHTML='<div class="mt-pantalla"><span id="mt-num" aria-live="polite"></span><i class="mt-cursor"></i>'+(r.u?'<small>'+esc(r.u)+'</small>':'')+'</div>'+
      '<div class="mt-teclado">'+teclas.map(function(t){return t?'<button type="button" data-k="'+t+'">'+t+'</button>':'<span></span>';}).join("")+
      (extra.length>1?extra.slice(1).map(function(t){return '<button type="button" data-k="'+t+'">'+t+'</button>';}).join(""):"")+
      '<button type="button" class="primary ok" data-k="ok">✓ Comprobar</button></div>';
    var val="";
    function pon(){var n=$("mt-num"); if(n)n.textContent=val;}
    function tecla(k){ if(S.listo)return;
      if(k==="ok"){ if(!val||val==="−")return; var ok=M.corrige(it,val); responde(val,ok); if(!ok&&!S.listo){val=""; setTimeout(pon,900);} return; }
      if(k==="⌫"){val=val.slice(0,-1);}
      else if(k==="−"){val=val.charAt(0)==="−"?val.slice(1):"−"+val;}
      else if(k===","){if(val.indexOf(",")<0&&val.indexOf("/")<0)val+=(val&&val!=="−"?"":"0")+",";}
      else if(k==="/"){if(val&&val.indexOf("/")<0&&val.indexOf(",")<0&&/\d$/.test(val))val+="/";}
      else if(val.replace(/\D/g,"").length<7)val+=k;
      SON.toca(); pon();
    }
    on(z,"[data-k]",function(b){tecla(b.getAttribute("data-k"));});
    S.teclado=function(k){ if(/^[0-9]$/.test(k))tecla(k); else if(k==="Backspace")tecla("⌫"); else if(k==="Enter")tecla("ok");
      else if((k===","||k===".")&&r.dec)tecla(","); else if(k==="-"&&r.neg)tecla("−"); else if(k==="/"&&r.frac)tecla("/"); else return; return true; };
    return;
  }
  if(r.t==="bandeja"){
    var n=0;
    z.innerHTML='<div class="mt-bandeja" id="mt-band" aria-label="canasta"></div><div class="mt-acc"><button type="button" class="mt-grande" id="mt-mas">'+r.e+' Poner una</button><button type="button" class="ghost" id="mt-menos">↩ Quitar</button>'+
      '<button type="button" class="primary" id="mt-ok">✓ Listo</button></div>';
    function band(){var s='';for(var i=0;i<n;i++)s+='<span>'+r.e+'</span>'; $("mt-band").innerHTML=s||'<small>La canasta está vacía</small>';}
    band();
    $("mt-mas").onclick=function(){if(S.listo||n>=r.max)return; n++; SON.toca(); band();};
    $("mt-menos").onclick=function(){if(S.listo||!n)return; n--; band();};
    $("mt-ok").onclick=function(){if(S.listo)return; var ok=M.corrige(it,n); responde(n,ok);};
    S.teclado=function(k){if(k==="+"||k==="ArrowUp")$("mt-mas").click(); else if(k==="-"||k==="Backspace")$("mt-menos").click(); else if(k==="Enter")$("mt-ok").click(); else return; return true;};
    return;
  }
  if(r.t==="perlas"){
    var cc=0, dd=0, uu=0, cien=r.max>=100;
    z.innerHTML='<div class="mt-armado" id="mt-arm"></div><div class="mt-perla-btns">'+
      (cien?'<span><button type="button" data-p="c+">＋ cien</button><button type="button" data-p="c-">− cien</button></span>':'')+
      '<span><button type="button" data-p="d+">＋ barra de diez</button><button type="button" data-p="d-">− diez</button></span>'+
      '<span><button type="button" data-p="u+">＋ perla</button><button type="button" data-p="u-">− perla</button></span></div>'+
      '<div class="actions"><button type="button" class="primary" id="mt-ok">✓ Listo</button></div>';
    function arm(){$("mt-arm").innerHTML=(cc||dd||uu)?DB.vis({t:"perlas",m:0,c:cc,d:dd,u:uu}):'<small>Pon las perlas aquí</small>';}
    arm();
    on(z,"[data-p]",function(b){if(S.listo)return; var p=b.getAttribute("data-p"), d=p.charAt(1)==="+"?1:-1;
      if(p.charAt(0)==="c")cc=Math.max(0,Math.min(9,cc+d)); else if(p.charAt(0)==="d")dd=Math.max(0,Math.min(9,dd+d)); else uu=Math.max(0,Math.min(9,uu+d)); SON.toca(); arm();});
    $("mt-ok").onclick=function(){if(S.listo)return; var v=cc*100+dd*10+uu, ok=M.corrige(it,v); responde(v,ok);};
    return;
  }
  if(r.t==="pastel"){
    var pint={};
    z.innerHTML='<div class="mt-armado" id="mt-pas">'+DB.pastelSVG(0,r.den,true,180)+'</div><p class="fine">Toca las partes para pintarlas.</p><div class="actions"><button type="button" class="primary" id="mt-ok">✓ Listo</button></div>';
    Array.prototype.forEach.call(z.querySelectorAll(".mt-parte"),function(pt){pt.addEventListener("click",function(){if(S.listo)return; var i=pt.getAttribute("data-i"); pint[i]=!pint[i]; pt.classList.toggle("on",!!pint[i]); pt.setAttribute("fill",pint[i]?"#e53935":"#fff"); SON.toca();});});
    $("mt-ok").onclick=function(){if(S.listo)return; var v=Object.keys(pint).filter(function(k){return pint[k];}).length, ok=M.corrige(it,v); responde(v,ok);};
  }
}

/* responder: acierto, segundo intento o explicación */
function responde(val,ok){
  var it=S.it, o=S.o, fb=$("mt-fb"), c=M.POR_ID[it.c]; if(!fb)return;
  if(ok){
    S.listo=true; SON.bien();
    var ayuda=S.intento>0, ev=o.practica?registra(true,ayuda):{};
    var txt=pick(M.ANIMOS_BIEN);
    fb.className="mt-fb bien";
    fb.innerHTML=lumi(ev.domina||ev.fase||ev.nivel?"wow":"feliz")+'<p class="mt-animo">'+(ayuda?'🌟 ¡Lo corregiste tú! '+esc(txt):'🌟 '+esc(txt))+'</p>'+eventoTxt(ev)+
      '<details class="mt-porque"'+(o.leccion?' open':'')+'><summary>¿Por qué?</summary><ol>'+it.ex.map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ol></details>'+
      '<div class="actions"><button type="button" class="primary grande" id="mt-sig">'+(o.leccion?'Seguir →':'Siguiente →')+'</button></div>';
    vozAuto(ayuda?"¡Lo corregiste! "+txt:txt);
    sigueCon(o);
    return;
  }
  S.intento++;
  if(S.intento===1){
    /* control del error: una pista y otra oportunidad, sin castigo */
    SON.otra();
    fb.className="mt-fb otra";
    var ani=pick(M.ANIMOS_MAL);
    fb.innerHTML=lumi("piensa")+'<p class="mt-animo">🤔 '+esc(ani)+'</p><p class="mt-pista">💡 '+esc(it.pista)+'</p>';
    if(it.ocultaVisual&&!S.vioMaterial)verMaterial();
    vozAuto(ani+" "+it.pista);
    return;
  }
  /* segundo error: lo vemos juntos, paso a paso */
  S.listo=true;
  var rz=$("mt-resp"); if(rz)rz.classList.add("cerrado");
  var ev2=o.practica?registra(false,true):{};
  if(it.ocultaVisual&&!S.vioMaterial)verMaterial();
  var bot=$("mt-resp"); if(bot&&it.r.t==="op"){var bk=bot.querySelector('[data-i="'+it.r.ok+'"]'); if(bk)bk.classList.add("es");}
  fb.className="mt-fb juntos";
  fb.innerHTML=lumi("anima")+'<p class="mt-animo">🤝 Vamos a verlo juntos. Equivocarse es parte de aprender.</p>'+
    '<ol class="mt-pasos-ex">'+it.ex.map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ol><p>La respuesta es <b>'+esc(muestra(it))+'</b>. '+btnVoz(it.ex.join(" ")+" La respuesta es "+muestra(it))+'</p>'+
    eventoTxt(ev2)+'<div id="mt-ia"></div>'+
    '<div class="actions"><button type="button" class="ghost" id="mt-ia-btn">🤖 Explícamelo de otra forma</button><button type="button" class="primary" id="mt-sig">Entendido, sigamos →</button></div>';
  activaVoz(fb);
  $("mt-ia-btn").onclick=function(){explicaIA(it,val,$("mt-ia"),this);};
  sigueCon(o);
}
function sigueCon(o){var b=$("mt-sig"); if(!b)return; var fb=$("mt-fb"); if(fb&&fb.scrollIntoView)try{fb.scrollIntoView({block:"nearest",behavior:"smooth"});}catch(x){} try{b.focus({preventScroll:true});}catch(x){}
  b.onclick=function(){ if(o.alFin)return o.alFin(); var R=S.ronda; if(R&&R.refuerzo){R.refuerzo=false; return refuerzo();} siguiente(); };
  S.teclado=function(k){if(k==="Enter"||k===" "){b.click(); return true;}};}
function registra(ok,ayuda){
  var pf=actual(), R=S.ronda, c=M.POR_ID[S.c], p=progDe(pf,S.c), ev=M.registra(p,c,ok,ayuda);
  pf.dias=pf.dias||{}; var d=hoy(); pf.dias[d]=(pf.dias[d]||0)+1;
  var ks=Object.keys(pf.dias).sort(); while(ks.length>120)delete pf.dias[ks.shift()];
  R.res.push(ok&&!ayuda); if(ok&&!ayuda)R.ok++; R.i++;
  if(ev.refuerzo)R.refuerzo=true;
  if(ev.domina){R.domina=true; SON.domina();} else if(ev.fase||ev.nivel)SON.sube();
  R.eventos.push(ev); cambia(pf); return ev;
}
function eventoTxt(ev){
  if(ev.domina)return '<p class="mt-evento dom">🏆 ¡Dominaste el concepto!</p>';
  if(ev.fase)return '<p class="mt-evento">🎉 ¡Subes a la fase '+FASES[ev.fase].ico+' '+FASES[ev.fase].nom+'!</p>';
  if(ev.nivel)return '<p class="mt-evento">⭐ ¡Nivel '+ev.nivel+'! Un poquito más de desafío.</p>';
  if(ev.refuerzo)return '<p class="mt-evento suave">💪 Vamos a volver un momento al material para entenderlo mejor.</p>';
  return '';
}

/* ---------- explicación con IA (o la del material, si no hay) ---------- */
function explicaIA(it,resp,z,btn){
  if(!z)return; btn.disabled=true; z.innerHTML='<p class="fine">🤖 Pensando una explicación…</p>';
  api("/api/mate/explica","POST",{c:it.c,n:it.n,f:it.f,seed:it.seed,resp:resp==null?"":String(resp).slice(0,40)}).then(function(r){
    z.innerHTML='<div class="mt-ia"><p>🤖 '+esc(r.explicacion)+'</p>'+(r.ejemplo?'<p>🧱 '+esc(r.ejemplo)+'</p>':'')+(r.pregunta?'<p>❓ '+esc(r.pregunta)+'</p>':'')+
      btnVoz([r.explicacion,r.ejemplo,r.pregunta].filter(Boolean).join(" "))+'</div>';
    activaVoz(z); vozAuto(r.explicacion+" "+(r.ejemplo||""));
  }).catch(function(e){
    var m={unauthorized:"La explicación con IA está disponible cuando un adulto entra con su cuenta de Google.",google_required:"La explicación con IA está disponible cuando un adulto entra con su cuenta de Google.",
      limit:"Por hoy ya se usaron todas las explicaciones con IA. ¡Mañana hay más!",ia_not_configured:"La IA no está configurada en este servidor.",mate_not_configured:"Falta preparar el servidor para la IA (ver SETUP.md)."};
    var c=M.POR_ID[it.c];
    z.innerHTML='<div class="mt-ia"><p class="fine">'+esc(m[e&&e.error]||"No se pudo pedir la explicación ahora.")+'</p><p>🧱 Recuerda: '+esc(c.pres)+'</p></div>';
    btn.disabled=false;
  });
}

/* ===================== refuerzo: volver a lo concreto ===================== */
function refuerzo(){
  var c=M.POR_ID[S.c], it=M.ejercicio(S.c,1,0,semilla()), R=S.ronda;
  var g=pinta('<div class="mt-top"><button type="button" class="mt-atras" id="mt-atras">← '+esc(c.nom)+'</button></div>'+
    '<div class="mt-refuerzo">'+(window.AxAprender?AxAprender.globo("anima","¡Tranquilidad! Equivocarse es parte de aprender. Lo vemos juntos."):'')+'<h3>💪 Volvamos al material</h3><p>Hubo varios errores seguidos, y eso está bien: <b>significa que estás aprendiendo algo nuevo</b>. Vamos a mirar el concepto otra vez, con calma.</p>'+
    '<p class="mt-pres">🧱 '+esc(c.pres)+' '+btnVoz(c.pres)+'</p>'+
    '<div class="mt-tarea"><p class="mt-preg">'+esc(it.q)+'</p>'+DB.vis(it.v)+'<div class="mt-modelo"><b>Paso a paso:</b><ol>'+it.ex.map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ol><p>Respuesta: <b>'+esc(muestra(it))+'</b></p></div></div>'+
    '<div id="mt-ia"></div><p class="mt-afirma">«Equivocarme me ayuda a aprender.» '+btnVoz("Equivocarme me ayuda a aprender.")+'</p>'+
    '<div class="actions"><button type="button" class="ghost" id="mt-ia-btn">🤖 Explícamelo con IA</button><button type="button" class="primary grande" id="mt-sig">Lo intento otra vez →</button></div></div>');
  if(!g)return; activaVoz(g); activaVis(g,it);
  $("mt-atras").onclick=function(){reflexion();};
  $("mt-ia-btn").onclick=function(){explicaIA(it,null,$("mt-ia"),this);};
  $("mt-sig").onclick=function(){siguiente();};
  vozAuto("Volvamos al material. "+c.pres);
}

/* ===================== dominio: la celebración ===================== */
function celebra(){
  var pf=actual(), c=M.POR_ID[S.c], E=M.ETAPAS[c.e], completa=M.etapaCompleta(pf.prog,c.e), R=S.ronda;
  R.domina=false; R.celebrado=true;
  var conf='';for(var i=0;i<24;i++)conf+='<i style="--x:'+Math.round(Math.random()*100)+'%;--d:'+(Math.random()*1.5).toFixed(2)+'s;--c:'+pick(["#ef5350","#42a5f5","#66bb6a","#ffca28","#ab47bc"])+'"></i>';
  var g=pinta('<div class="mt-celebra"><div class="mt-confeti">'+conf+'</div><div class="mt-cel-fila">'+(window.AxAprender?AxAprender.mascota("celebra",130):'')+'<span class="mt-dib enorme">'+c.dibujo+'</span></div>'+
    '<h3>¡Dominaste «'+esc(c.nom)+'»!</h3><p>Tu '+c.dibujo+' ya brilla en la escena de '+esc(E.nom)+'.</p>'+
    (completa?'<p class="mt-evento dom">'+E.ico+' ¡Completaste toda la etapa '+esc(E.nom)+'! Ganaste su insignia.</p>':'')+
    '<p class="mt-afirma">«Soy capaz de aprender cosas difíciles.» '+btnVoz("Soy capaz de aprender cosas difíciles.")+'</p>'+
    '<div class="actions"><button type="button" class="primary grande" id="mt-sig">Seguir →</button></div></div>',"fiesta");
  if(!g)return; activaVoz(g);
  $("mt-sig").onclick=function(){reflexion();};
  vozAuto("¡Felicidades! Dominaste "+c.nom+". Soy capaz de aprender cosas difíciles.");
}

/* ===================== reflexión al terminar ===================== */
function reflexion(){
  var pf=actual(), c=M.POR_ID[S.c], R=S.ronda||{res:[],ok:0}, n=R.res.length, p=pf.prog[S.c];
  if(!n)return objetivo(S.c);
  var af=pick(M.AFIRMACIONES), sel={s:null,d:null};
  var bien='';for(var i=0;i<n;i++)bien+=R.res[i]?'🌟':'🌱';
  var g=pinta('<div class="mt-reflexion"><h3>✨ ¡Terminaste tu trabajo!</h3>'+
    '<p class="mt-resumen">'+bien+'</p><p class="fine">'+R.ok+' de '+n+' a la primera'+(n-R.ok?', y '+(n-R.ok)+' '+(n-R.ok===1?'semilla':'semillas')+' 🌱 que te ayudaron a aprender':'')+'.</p>'+
    (p?'<div class="mt-estado">'+faseChips(p.dom?3:p.f)+' '+estrellas(p.dom?c.nmax:p.n,c.nmax)+'<span class="mt-barra"><i style="width:'+Math.round(M.avance(p,c)*100)+'%"></i></span></div>':'')+
    '<h4>¿Cómo te sentiste?</h4><div class="mt-sentir">'+SENTIR.map(function(x,i){return '<button type="button" data-s="'+i+'"><span>'+x[0]+'</span>'+x[1]+'</button>';}).join("")+'</div>'+
    '<h4>¿Cómo te pareció?</h4><div class="mt-dific">'+["Fácil","Justo","Difícil"].map(function(x){return '<button type="button" data-d="'+x+'">'+x+'</button>';}).join("")+'</div>'+
    (c.e>=1?'<label class="mt-campo">Hoy aprendí… (si quieres)<input id="mt-nota" maxlength="120" autocomplete="off" placeholder="Por ejemplo: que 10 unidades son una decena"></label>':'')+
    '<p class="mt-msg" id="mt-msg" hidden></p>'+
    '<div class="mt-afirma grande">'+lumi("feliz",58)+'<div><small>Repite conmigo:</small>«'+esc(af)+'» '+btnVoz(af)+'</div></div>'+
    '<div class="actions"><button type="button" class="ghost" id="mt-mapa">🗺️ Volver al mapa</button><button type="button" class="primary" id="mt-otra">Otra ronda ▶</button></div></div>');
  if(!g)return; activaVoz(g);
  var guardado=false;
  function guarda(){
    var e={c:S.c,t:Date.now(),ok:R.ok,n:n,s:sel.s,d:sel.d,nota:$("mt-nota")?$("mt-nota").value.trim().slice(0,120):""};
    if(guardado)pf.refl[pf.refl.length-1]=e; else{pf.refl.push(e); guardado=true;}
    while(pf.refl.length>60)pf.refl.shift(); cambia(pf);
  }
  function mensaje(){var m=$("mt-msg"), t="";
    if(sel.s===3||sel.d==="Difícil")t="Gracias por contarlo. Lo difícil se vuelve fácil practicando: la próxima vez empezaremos con calma y con el material. ¡Eres valiente por intentarlo!";
    else if(sel.s===0&&sel.d==="Fácil")t="¡Qué bien! Cuando algo es fácil, es momento de un nuevo desafío.";
    else if(sel.s!=null)t="¡Gracias por contarlo! Conocer cómo te sientes también es aprender.";
    m.hidden=!t; m.textContent=t; if(t)vozAuto(t);}
  on(g,"[data-s]",function(b){sel.s=+b.getAttribute("data-s"); Array.prototype.forEach.call(g.querySelectorAll("[data-s]"),function(x){x.classList.toggle("on",x===b);}); SON.toca(); guarda(); mensaje();});
  on(g,"[data-d]",function(b){sel.d=b.getAttribute("data-d"); Array.prototype.forEach.call(g.querySelectorAll("[data-d]"),function(x){x.classList.toggle("on",x===b);}); SON.toca(); guarda(); mensaje();});
  $("mt-mapa").onclick=function(){guarda(); mapa();};
  $("mt-otra").onclick=function(){guarda(); var cid=S.c, pp=actual().prog[cid]; if(pp&&pp.dom){var sg=M.sugerido(actual().prog,c.e); if(sg&&sg!==cid)return objetivo(sg);} ronda(cid);};
  vozAuto("¡Terminaste tu trabajo! ¿Cómo te sentiste? Repite conmigo: "+af);
}

/* ===================== para adultos ===================== */
function puerta(fn){
  var a=12+Math.floor(Math.random()*30), b=13+Math.floor(Math.random()*40);
  var g=pinta('<div class="mt-puerta"><h3>👪 Para adultos</h3><p>Para entrar, resuelve: <b>'+a+' + '+b+'</b></p>'+
    '<input id="mt-pu" inputmode="numeric" autocomplete="off" aria-label="resultado"><p class="msg bad" id="mt-pu-e" hidden>No es correcto.</p>'+
    '<div class="actions"><button type="button" class="ghost" id="mt-pu-no">Volver</button><button type="button" class="primary" id="mt-pu-ok">Entrar</button></div></div>');
  if(!g)return;
  $("mt-pu").focus();
  $("mt-pu-no").onclick=function(){actual()?entra():portadaPinta();};
  $("mt-pu-ok").onclick=function(){if(+$("mt-pu").value===a+b)fn(); else $("mt-pu-e").hidden=false;};
  $("mt-pu").onkeydown=function(e){if(e.key==="Enter")$("mt-pu-ok").click();};
}
/* el avance en inglés, para el panel de adultos */
function ingAdultos(pf){
  var I=window.AxIngles, g=pf.ing||I.nuevo(), hechas=Object.keys(g.lec||{}).length, tot=Object.keys(I.POR_ID).length, dif=I.dificiles(g,10);
  var u=I.UNIDADES.filter(function(x,i){return I.unidadHecha(g,i);}).length, sent=(g.refl||[]).slice(-6).reverse();
  return '<h4>🔤 Inglés</h4><div class="mt-kpis"><div><b>'+hechas+'/'+tot+'</b><small>lecciones</small></div><div><b>'+u+'</b><small>unidades completas</small></div><div><b>'+I.aprendidas(g)+'</b><small>palabras aprendidas</small></div><div><b>'+(g.xp||0)+'</b><small>XP</small></div></div>'+
    (dif.length?'<div class="mt-tarjeta ref"><b>💪 Palabras para repasar</b><p>'+dif.map(function(w){return w.e+' <b>'+esc(w.en)+'</b> ('+esc(w.es)+')';}).join(' · ')+'</p><p>🏠 <b>En casa:</b> nombren estas cosas en inglés cuando las vean (por ejemplo, al poner la mesa o al vestirse). El botón «Repasar mis palabras» del curso las practica.</p></div>':'')+
    (sent.length?'<div class="mt-lista">'+sent.map(function(r){var L=I.POR_ID[r.l]; return '<span>'+(r.s!=null?SENTIR[r.s][0]:'·')+' '+esc(L?I.UNIDADES[L.u].en+' · '+L.nom:r.l)+' <small>'+r.ok+'/'+r.n+'</small></span>';}).join("")+'</div>':'');
}
/* el avance en ciencias, para el panel de adultos */
function cieAdultos(pf){
  var K=window.AxCiencias, g=pf.cie||K.nuevo(), hechas=Object.keys(g.lec||{}).length, tot=Object.keys(K.POR_ID).length, dif=K.dificiles(g,8);
  var porNivel=K.NIVELES.map(function(N){var us=K.deNivel(N.n); return {N:N,us:us,ok:us.filter(function(u){return K.unidadHecha(g,u.id);}).length,emp:us.filter(function(u){return K.hecha(g,u.lecciones[0].id);}).length};});
  var labs=K.UNIDADES.filter(function(u){return K.hecha(g,u.lecciones[2].id);}).slice(-3);
  return '<h4>🔬 Ciencias</h4><div class="mt-kpis"><div><b>'+hechas+'/'+tot+'</b><small>lecciones</small></div><div><b>'+K.UNIDADES.filter(function(u){return K.unidadHecha(g,u.id);}).length+'</b><small>unidades completas</small></div><div><b>'+K.estrellasTot(g)+'</b><small>estrellas</small></div><div><b>'+(g.xp||0)+'</b><small>XP</small></div></div>'+
    '<div class="mt-avance">'+porNivel.map(function(x){return '<div><span>'+x.N.ico+' '+esc(x.N.nom)+'</span><i style="--p:'+Math.round(100*x.ok/x.us.length)+'%"></i><small>'+x.ok+'/'+x.us.length+(x.emp>x.ok?' · '+(x.emp-x.ok)+' en camino':'')+'</small></div>';}).join("")+'</div>'+
    (dif.length?'<div class="mt-tarjeta ref"><b>💪 Lo que más le costó</b><p>'+dif.map(function(d){return d.u.ico+' '+esc(d.txt);}).join('<br>')+'</p><p>El botón «Repasar lo que me costó» del mapa de Ciencias lo practica de nuevo.</p></div>':'')+
    (labs.length?'<div class="mt-tarjeta"><b>🧪 Experimentos para hacer juntos</b><p>'+labs.map(function(u){return u.ico+' <b>'+esc(u.casa.nom)+'</b>: '+esc(u.casa.mat.join(", "))+'.';}).join('<br>')+'</p></div>':'');
}
function adultos(){
  var pf=actual()||D.lista[0]; if(!pf)return crear(); D.act=pf.id; guardaLocal();
  var tot=0, ok=0; Object.keys(pf.prog).forEach(function(k){tot+=pf.prog[k].i; ok+=pf.prog[k].a;});
  var ref=M.CONCEPTOS.filter(function(c){return M.necesitaRefuerzo(pf.prog[c.id]);});
  var camino=M.CONCEPTOS.filter(function(c){var p=pf.prog[c.id]; return p&&p.i&&!p.dom&&!M.necesitaRefuerzo(p);});
  var refl=pf.refl.slice(-8).reverse();
  var u=usuario();
  var g=pinta('<div class="mt-top"><button type="button" class="mt-atras" id="mt-atras">← Volver</button><b>👪 Para adultos</b></div><div class="mt-adultos">'+
    (D.lista.length>1?'<div class="mt-etapas">'+D.lista.map(function(x){return '<button type="button" data-pf="'+esc(x.id)+'" class="'+(x.id===pf.id?"on":"")+'"><span>'+esc(x.avatar)+'</span>'+esc(x.nombre)+'</button>';}).join("")+'</div>':'')+
    '<div class="mt-kpis"><div><b>'+dominados(pf)+'</b><small>conceptos dominados</small></div><div><b>'+tot+'</b><small>ejercicios</small></div><div><b>'+(tot?Math.round(100*ok/tot):0)+' %</b><small>aciertos</small></div><div><b>'+racha(pf)+'</b><small>días seguidos</small></div></div>'+
    '<h4>Avance por etapa</h4><div class="mt-avance">'+M.ETAPAS.map(function(E,i){var n=M.deEtapa(i).length, d=dominados(pf,i), emp=M.deEtapa(i).filter(function(c){return pf.prog[c.id]&&pf.prog[c.id].i;}).length;
      return '<div class="'+(i===pf.etapa?"actual":"")+'"><span>'+E.ico+' '+esc(E.nom)+'</span><i style="--p:'+Math.round(100*d/n)+'%"></i><small>'+d+'/'+n+(emp>d?' · '+(emp-d)+' en camino':'')+'</small></div>';}).join("")+'</div>'+
    '<h4>💪 Necesita refuerzo</h4>'+(ref.length?ref.map(function(c){var p=pf.prog[c.id];
      return '<div class="mt-tarjeta ref"><b>'+c.dibujo+' '+esc(c.nom)+'</b><small>'+Math.round(100*p.a/Math.max(1,p.i))+' % de aciertos en '+p.i+' ejercicios · '+p.ref+(p.ref===1?' refuerzo':' refuerzos')+'</small><p>🏠 <b>Para hacer en casa:</b> '+esc(c.casa)+'</p></div>';}).join(""):'<p class="fine">Nada por ahora. ¡Va muy bien!</p>')+
    (camino.length?'<h4>🚶 En camino</h4><div class="mt-lista">'+camino.map(function(c){var p=pf.prog[c.id]; return '<span>'+c.dibujo+' '+esc(c.nom)+' <small>'+FASES[p.f].ico+' '+Math.round(M.avance(p,c)*100)+' %</small></span>';}).join("")+'</div>':'')+
    (window.AxIngles?ingAdultos(pf):'')+(window.AxCiencias?cieAdultos(pf):'')+
    '<h4>💬 Sus reflexiones</h4>'+(refl.length?'<div class="mt-refls">'+refl.map(function(r){var c=M.POR_ID[r.c]; return '<div><span>'+(r.s!=null?SENTIR[r.s][0]:'·')+'</span><b>'+esc(c?c.nom:r.c)+'</b><small>'+new Date(r.t).toLocaleDateString()+' · '+r.ok+'/'+r.n+(r.d?' · '+esc(r.d):'')+'</small>'+(r.nota?'<p>«'+esc(r.nota)+'»</p>':'')+'</div>';}).join("")+'</div>':'<p class="fine">Aún no hay reflexiones.</p>')+
    '<h4>🌱 Cómo acompañar</h4><ul class="mt-tips"><li>Elogia el <b>esfuerzo</b> y las estrategias, no la rapidez ni «ser inteligente».</li><li>Deja que se equivoque: el juego da una pista y otra oportunidad antes de explicar.</li>'+
      '<li>Si hay muchos errores, el juego vuelve solo al material concreto. En casa, usen objetos reales (las ideas de arriba).</li><li>Pregunta «¿cómo lo pensaste?» antes que «¿cuánto te salió?».</li><li>Sesiones cortas (una ronda de '+RONDA+' ejercicios) y frecuentes funcionan mejor que una larga.</li></ul>'+
    '<h4>⚙️ Ajustes</h4><div class="actions"><button type="button" class="ghost" id="mt-edit">✏️ Editar perfil o etapa</button><button type="button" class="ghost" id="mt-vozt">'+(D.voz?'🔊 Lectura en voz alta: sí':'🔈 Lectura en voz alta: no')+'</button><button type="button" class="ghost bad" id="mt-borra">🗑️ Borrar perfil</button></div>'+
    '<p class="fine">'+(u?'Los perfiles se guardan en la cuenta de '+esc(u.name||u.email||"Google")+' y en este dispositivo. Solo se guarda el apodo, el animalito y el avance.':'Los perfiles están solo en este dispositivo. Entra con Google (menú de la cuenta) para guardarlos en la nube y usarlos en otros dispositivos.')+'</p>'+
    '</div>');
  if(!g)return;
  $("mt-atras").onclick=function(){entra();};
  on(g,"[data-pf]",function(b){D.act=b.getAttribute("data-pf"); guardaLocal(); adultos();});
  $("mt-edit").onclick=function(){crear(pf);};
  $("mt-vozt").onclick=function(){D.voz=!D.voz; guardaLocal(); adultos();};
  $("mt-borra").onclick=function(){
    if(!confirm("¿Borrar el perfil de "+pf.nombre+" y todo su avance? No se puede deshacer."))return;
    D.lista=D.lista.filter(function(x){return x.id!==pf.id;}); delete pendientes[pf.id];
    D.borrados=(D.borrados||[]).concat([pf.id]); D.act=D.lista[0]?D.lista[0].id:null; guardaLocal(); sube(); portadaPinta();
  };
}

/* ---------- teclado físico ---------- */
document.addEventListener("keydown",function(e){
  var md=document.body.getAttribute("data-mode"); if(!S.teclado||(md!=="mate"&&md!=="ingles"&&md!=="ciencias"))return;
  var t=e.target; if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"))return;
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(S.teclado(e.key))e.preventDefault();
});
/* la cuenta llega después de abrir la sección: traer sus perfiles */
document.addEventListener("ax-user",function(){var md=document.body.getAttribute("data-mode"); if((md==="mate"||md==="ingles"||md==="ciencias")&&usuario())baja().then(function(c){if(c&&S.portada)portadaPinta();});});

function cerrar(){callaVoz(); if(tSube){clearTimeout(tSube); sube();} S={}; if(window.AxAprender&&AxAprender.enCompleta())AxAprender.completa(false); if(window.AxInglesUI)AxInglesUI.para(); if(window.AxCienciasUI)AxCienciasUI.para();}

/* lo que usa Inglés: los mismos perfiles, la misma cabecera y el mismo panel */
var comun={actual:actual,cambia:cambia,pinta:pinta,on:on,esc:esc,cabeza:cabeza,activaCabeza:activaCabeza,puerta:puerta,adultos:adultos,portada:portadaPinta,
  SON:SON,habla:habla,callaVoz:callaVoz,voz:function(){return !!D.voz;},SENTIR:SENTIR,hoy:hoy,semilla:semilla,
  teclado:function(fn){S.teclado=fn;},estado:function(o){S=o||{};}};
window.AxMateUI={portada:portada,cerrar:cerrar,comun:comun,
  /* para las pruebas */
  _datos:function(){return D;},_estado:function(){return S;}};
})();
