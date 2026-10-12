/* ===========================================================
   THE FINAL TEST · LuminaPets: El Valle de las Criaturas Mágicas · pantalla
   -----------------------------------------------------------
   La casa de la mascota (Lila, la gatita de la portada, es la
   primera), sus barras sin castigo y lo que pide. Para dárselo hay
   que aprender: la Cocina de Pociones (matemática y lógica) da
   bocadillos, el Árbol de las Palabras (letras, sonidos y lectura)
   da espuma para el baño y el Jardín de las Preguntas (ciencias,
   inglés y lógica) da gemas para vestirla. Cuidarla llena el
   Vínculo Mágico, que trae huevos sorpresa: se incuban frotando,
   cantando o meciendo, y la criatura que nace vive en la Aldea del
   Gran Árbol. Misiones de la vida real con PIN familiar, modo noche
   y ajustes detrás de la puerta para adultos. Usa los mismos
   perfiles y la misma cabecera que Matemática; todo va en perfil.lumi.
     AxLuminaUI.mapa() · AxLuminaUI.para() · AxLuminaUI.ajustes()
     AxLuminaUI.resumen(perfil)   (para el panel de adultos)
   =========================================================== */
(function(){
"use strict";
var L=window.AxLumina, DW=window.AxLuminaDibujos;
if(!L||!DW||!window.AxMateUI)return;
var C=AxMateUI.comun, esc=C.esc, on=C.on;
var $=function(id){return document.getElementById(id);};
var S=null, TM=[], AVISO=null, MOVER=null;
var ANIMOS=["¡Muy bien!","¡Lo lograste!","¡Genial!","¡Qué bien lo pensaste!","¡Excelente!","¡Bravo!"];
var CASI=["¡Casi! Prueba otra vez.","Mmm… mira con calma y prueba de nuevo.","¡Tú puedes! Intenta otra vez."];
var ALEGRE=["¡Me encanta estar contigo!","¿Aprendemos algo nuevo hoy?","¡Hoy me siento muy feliz!","¿Me haces un mimo? Tócame.","¡Vamos a cocinar pociones!"];
var BARRAS=[["fel","⭐","Energía"],["pan","🍓","Pancita"],["bri","🫧","Brillo"],["des","🌙","Descanso"]];
var EMOJIS_MISION=["⭐","🧹","🥦","🐶","🎨","🧺","🌱","🚿","🎹","⚽"];
function pick(a){return a[Math.floor(Math.random()*a.length)];}

/* ---------- utilidades ---------- */
function lumi(pf){
  if(!pf.lumi||typeof pf.lumi!=="object")pf.lumi=L.nuevo();
  var g=pf.lumi, n=L.nuevo();
  Object.keys(n).forEach(function(k){if(g[k]==null)g[k]=n[k];});
  if(!g.mascotas.length)g.mascotas=n.mascotas;
  if(!L.mascota(g))g.activa=g.mascotas[0].id;
  ["polvo","bocadillo","espuma","gema"].forEach(function(k){g.inv[k]=g.inv[k]||0;});
  ["cocina","arbol","jardin"].forEach(function(k){g.stats[k]=g.stats[k]||{r:0,ok:0,n:0}; g.niveles[k]=g.niveles[k]||0;});
  g.stats.temas=g.stats.temas||{};
  return g;
}
function modo(pf,g){return L.modoDe(g,pf.etapa||0);}
function vivo(){return !!document.querySelector(".mt.lp");}
function luego(fn,ms){var t=setTimeout(function(){if(vivo())fn();},ms); TM.push(t); return t;}
function limpia(){TM.forEach(clearTimeout); TM=[]; if(MOVER){window.removeEventListener("devicemotion",MOVER); MOVER=null;}}
function pinta(html,cls){limpia(); var el=C.pinta(html,"lp "+(cls||"")); if(el)vivos(el); return el;}
/* las criaturas grandes cobran vida con la malla animada (WebGL); las chicas quedan como imagen */
function vivos(raiz){
  if(!window.AxLuminaVivo)return; var n=0, noche=raiz.classList.contains("noche");
  Array.prototype.forEach.call(raiz.querySelectorAll(".lp-vivo[data-cid]"),function(h){
    if(h._vivo||n>=3)return; var r=h.getBoundingClientRect(); if(r.width<110)return;
    var c=AxLuminaVivo.monta(h,h.getAttribute("data-cid"),{gesto:h.getAttribute("data-gesto"),noche:noche,acc:h.parentNode.querySelectorAll(".lp-acc.z-cabeza,.lp-acc.z-ojos")});
    if(c){h._vivo=c; n++;}});
}
function ctl(pet){var h=pet&&pet.querySelector(".lp-vivo"); return h&&h._vivo;}
function decir(t){if(t)C.habla(t);}
function autoVoz(pf,g){return C.voz()||modo(pf,g)==="pre";}
function hablaEn(t){if(!window.speechSynthesis||!t)return; try{speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(t); u.lang="en-US";
  var v=speechSynthesis.getVoices().filter(function(x){return /^en/i.test(x.lang);}); if(v.length){u.voice=v.filter(function(x){return /US/i.test(x.lang);})[0]||v[0]; u.lang=u.voice.lang;} u.rate=0.85; speechSynthesis.speak(u);}catch(e){}}
var AC=null;
function nota(f,dur,vol){if(window.AxGranjaUI&&AxGranjaUI.mudo&&AxGranjaUI.mudo())return; try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==="suspended")AC.resume();
  var t=AC.currentTime, o=AC.createOscillator(), gn=AC.createGain(); o.type="sine"; o.frequency.value=f; gn.gain.setValueAtTime(vol||0.05,t); gn.gain.exponentialRampToValueAtTime(0.0008,t+(dur||0.3));
  o.connect(gn); gn.connect(AC.destination); o.start(t); o.stop(t+(dur||0.3)+0.02);}catch(e){}}
var CUNA=[392,330,392,330,349,294,330,262];
function cancionDeCuna(){CUNA.forEach(function(f,i){luego(function(){nota(f,0.55,0.04);},i*520);});}
function guardaLuego(pf){if(guardaLuego.t)clearTimeout(guardaLuego.t); guardaLuego.t=setTimeout(function(){C.cambia(pf);},700);}

/* la mascota con sus accesorios (cada uno en su zona) */
function petHTML(g,m,gesto,cls){
  var c=L.POR_ID[m.id];
  return '<div class="lp-pet '+(c.foto?'foto':'dib')+' '+(cls||'')+'">'+DW.criatura(c,{gesto:gesto})+
    (m.acc||[]).filter(function(id){return L.ACC[id];}).map(function(id){var a=L.ACC[id]; return '<span class="lp-acc z-'+a.zona+'" aria-hidden="true">'+a.ico+'</span>';}).join("")+'</div>';
}
function inventario(g){
  return '<div class="lp-inv"><span title="Polvo estelar">✨ <b>'+g.inv.polvo+'</b></span><span title="Bocadillos">🧁 <b>'+g.inv.bocadillo+'</b></span><span title="Espuma mágica">🫧 <b>'+g.inv.espuma+'</b></span><span title="Gemas">💎 <b>'+g.inv.gema+'</b></span>'+
    (g.huevos.length?'<span title="Huevos">🥚 <b>'+g.huevos.length+'</b></span>':'')+'</div>';
}
function barraV(g){return '<div class="lp-vinculo"><span>💖 Vínculo Mágico</span><i style="--p:'+Math.round(g.vinculo)+'%"></i><b>'+Math.round(g.vinculo)+'%</b></div>';}
function top(tit,volver){return '<div class="mt-top"><button type="button" class="mt-atras" id="lp-volver">← '+esc(volver||"Volver")+'</button><b>'+tit+'</b></div>';}
function chispas(raiz,n,ico){
  var z=document.createElement("div"); z.className="lp-chispas"; z.setAttribute("aria-hidden","true");
  for(var i=0;i<(n||14);i++){var s=document.createElement("i"), a=i/(n||14)*Math.PI*2, d=60+Math.random()*70;
    s.textContent=ico||pick(["✨","⭐","💫","🌟"]); s.style.setProperty("--x",Math.round(Math.cos(a)*d)+"px"); s.style.setProperty("--y",Math.round(Math.sin(a)*d)+"px"); s.style.animationDelay=(Math.random()*0.15).toFixed(2)+"s"; z.appendChild(s);}
  raiz.appendChild(z); setTimeout(function(){if(z.parentNode)z.parentNode.removeChild(z);},1600);
}

/* ===================== la casa ===================== */
function mapa(){
  var pf=C.actual(); if(!pf)return C.portada();
  var g=lumi(pf), md=modo(pf,g), noche=L.enNoche(g);
  L.actualiza(g,Date.now(),noche); C.cambia(pf);
  S=null; C.estado({lumi:true});
  if(noche)return nocheVista(pf,g);
  var m=L.mascota(g), c=L.POR_ID[m.id], nec=g.capullo?null:L.necesidad(g), hab=L.habitosHoy(g), pend=hab.filter(function(x){return x.n<x.max;}).length;
  /* lo que se destaca: la acción si ya hay con qué; si no, el minijuego que lo consigue */
  var marca=null, modPide=null;
  if(nec){if(nec.accion==="comer"&&g.inv.bocadillo<=0)modPide="cocina"; else if(nec.accion==="bano"&&g.inv.espuma<=0)modPide="arbol"; else if(nec.accion==="jugar")modPide="jardin"; else marca=nec.accion;}
  var dice=AVISO||(g.capullo?"Zzz… estoy en mi capullo de siesta. ¡Un abrazo me despierta!":nec?(modPide&&nec.accion!=="jugar"?nec.txt+" "+(modPide==="cocina"?"Hay que prepararla en la Cocina de Pociones.":"Necesito espuma del Árbol de las Palabras."):nec.txt):pick(ALEGRE));
  AVISO=null;
  var lugar=L.lugarDe(g,c), hora=L.franja();
  var linea='🐾 '+g.mascotas.length+'/'+L.CRIATURAS.length+' criaturas · '+(md==="pri"?'🌟 Primaria':'🌱 Preescolar');
  var html=C.cabeza(pf,"lumina",linea,'')+
    '<div class="lp-casa">'+inventario(g)+
    '<div class="lp-globo" id="lp-globo"><b>'+esc(m.nom)+'</b> '+esc(dice)+'<button type="button" class="lp-son" data-voz="'+esc(dice)+'" aria-label="Escuchar">🔊</button></div>'+
    '<div class="lp-escena'+(c.foto?' con-foto':'')+(g.capullo?' capullo':'')+(c.foto?' lugar-'+lugar.id+' hora-'+hora:'')+'" id="lp-escena" style="--cam:.5">'+(c.foto?mundoHTML(lugar):DW.habitacion())+
      '<button type="button" class="lp-pet-btn" id="lp-pet" aria-label="Hacer un mimo a '+esc(m.nom)+'">'+petHTML(g,m,g.capullo?"duerme":"feliz")+'</button>'+
      (g.capullo?'<div class="lp-capullo" aria-hidden="true"><span>💤</span></div>':'')+'</div>'+
    (g.capullo?'<button type="button" class="lp-abrazo" id="lp-abrazo">🤗 Darle un abrazo</button>':
      '<div class="lp-barras">'+BARRAS.map(function(b){var v=Math.round(g.barras[b[0]]); return '<div class="lp-barra'+(v<35?' baja':'')+'"><span>'+b[1]+'</span><i style="--p:'+v+'%"></i><small>'+esc(b[2])+'</small></div>';}).join("")+'</div>'+barraV(g)+
      '<div class="lp-dock">'+[["comer","🧁","Comer",g.inv.bocadillo],["bano","🛁","Baño",g.inv.espuma],["dormir","☁️","Dormir",""],["vestir","🎀","Vestir",""],
        ["huevos","🥚","Huevos",g.huevos.length||""],["aldea","🌳","Aldea",g.mascotas.length],["misiones","🦸","Misiones",pend||""],["lugar",lugar.ico,"Lugar",""]].map(function(x){
        return '<button type="button" data-acc="'+x[0]+'" class="'+(marca===x[0]?'pide':'')+'"><span>'+x[1]+'</span>'+x[2]+(x[3]!==""?'<i>'+x[3]+'</i>':'')+'</button>';}).join("")+'</div>'+
      (function(){var cm=L.caminoDe(g), nvm=L.nivelMascota(m.xp); return '<button type="button" class="lc-entrada" id="lc-ir"><span>🌈</span><div><b>Camino de las pruebas</b><small>Camina con '+esc(m.nom)+', supera pruebas y sube de nivel</small></div><i>⭐ '+nvm.n+' · '+esc(nvm.titulo)+'<br>🐾 '+Math.floor(cm.dist)+' m</i></button>';})()+
      '<h4 class="lp-h">✨ Aprende y consigue cosas para '+esc(m.nom)+'</h4><div class="lp-modulos">'+["cocina","arbol","jardin"].map(function(k){var M=L.MODULOS[k];
        return '<button type="button" class="lp-mod m-'+k+(modPide===k?' pide':'')+'" data-mod="'+k+'">'+(modPide===k?'<em>¡'+esc(m.nom)+' lo necesita!</em>':'')+'<span class="lp-mod-ico">'+M.ico+'</span><b>'+esc(M.nom)+'</b><small>'+esc(M.desc)+'</small>'+
          '<span class="lp-mod-pie"><i>Nivel '+L.nivelDe(g,k,md)+'</i><i>Ganas '+M.premioIco+'</i></span></button>';}).join("")+'</div>')+
    '<p class="fine lp-pie-nota">Sin anuncios ni compras: todo se consigue aprendiendo y cuidando. <a href="#" id="lp-familia">👪 Para la familia</a></p></div>';
  var el=pinta(html,"casa"); if(!el)return;
  C.activaCabeza(el);
  activaMundo(el);
  on(el,"[data-voz]",function(b){decir(b.getAttribute("data-voz"));});
  on(el,"[data-mod]",function(b){ronda(b.getAttribute("data-mod"));});
  if($("lc-ir"))$("lc-ir").onclick=function(){camino();};
  on(el,"[data-acc]",function(b){accion(b.getAttribute("data-acc"));});
  $("lp-familia").onclick=function(e){e.preventDefault(); C.puerta(function(){ajustes();});};
  if(g.capullo){$("lp-abrazo").onclick=function(){abrazo(pf,g,m);}; $("lp-pet").onclick=function(){abrazo(pf,g,m);};}
  else{caricias(pf,g,m,$("lp-pet")); vida($("lp-pet").querySelector(".lp-pet"),$("lp-escena"));}
  if(autoVoz(pf,g))decir(m.nom+" dice: "+dice);
}
/* el capullo de siesta: un abrazo y despierta bostezando, sin culpa */
function abrazo(pf,g,m){
  L.despierta(g); C.cambia(pf); C.SON.sube();
  var e=$("lp-escena"); if(e){e.classList.remove("capullo"); e.classList.add("despierta"); chispas(e,16,"💖");}
  AVISO="*Bosteza* ¡Gracias por el abrazo! Ya desperté. ¡Te extrañaba!";
  luego(mapa,1300);
}
/* acariciar: tocar es un mimo; arrastrar el dedo encima la acaricia (el pelo se mueve con el dedo,
   cierra los ojos, se apoya en la mano y ronronea); cada tramo de caricia también cuenta como mimo */
function caricias(pf,g,m,btn){
  var pet=btn.querySelector(".lp-pet"), ini=null, ult=null, recorrido=0, acum=0;
  btn.addEventListener("pointerdown",function(ev){ini=ult=[ev.clientX,ev.clientY]; recorrido=0;});
  btn.addEventListener("pointermove",function(ev){if(!ini)return;
    var h=pet.querySelector(".lp-vivo")||pet, r=h.getBoundingClientRect(), dx=ev.clientX-ult[0], dy=ev.clientY-ult[1]; ult=[ev.clientX,ev.clientY]; recorrido+=Math.abs(dx)+Math.abs(dy);
    var x=(ev.clientX-r.left)/r.width, y=(ev.clientY-r.top)/r.height; if(pet.classList.contains("izq")){x=1-x; dx=-dx;}
    var c=ctl(pet); if(c)c.caricia(x,y,dx/r.width,dy/r.height); else if(recorrido>40&&recorrido<60)accion1(pet,"feliz");
    acum+=Math.abs(dx)+Math.abs(dy); if(acum>r.width*0.7){acum=0; mimo(pf,g,m,ev,true);}});
  ["pointerup","pointercancel","pointerleave"].forEach(function(t){btn.addEventListener(t,function(ev){if(ini&&t==="pointerup"&&recorrido<12)mimo(pf,g,m,ev); ini=null; var c=ctl(pet); if(c)c.suelta();});});
}
function mimo(pf,g,m,ev,acaricia){
  var ahora=Date.now(); if(mimo.t&&ahora-mimo.t<350)return; mimo.t=ahora;
  var r=L.mimo(g); guardaLuego(pf); nota(880,0.12,0.03);
  var e=$("lp-escena"), p=$("lp-pet"); if(!e)return;
  var rc=e.getBoundingClientRect(), h=document.createElement("span"); h.className="lp-corazon"; h.textContent=pick(["💖","💕","💗","✨"]);
  h.style.left=(ev.clientX-rc.left)+"px"; h.style.top=(ev.clientY-rc.top)+"px"; e.appendChild(h); setTimeout(function(){if(h.parentNode)h.parentNode.removeChild(h);},1000);
  if(!acaricia)accion1(p.querySelector(".lp-pet"),p.querySelector(".lp-pet.dib")&&Math.random()<0.5?"salta":"feliz");
  var v=document.querySelector(".lp-vinculo"); if(v){v.querySelector("i").style.setProperty("--p",Math.round(g.vinculo)+"%"); v.querySelector("b").textContent=Math.round(g.vinculo)+"%";}
  if(r.huevos){AVISO="¡Llegó un huevo sorpresa! 🥚 Búscalo en Huevos."; luego(mapa,500);}
}

/* la mascota está viva: respira, parpadea y mueve la cola (CSS); de a ratos mira a un lado,
   mueve las orejas, menea la cola, salta, baila o pasea por la habitación; y sigue el dedo
   (o el ratón) con la mirada */
var DURA={mira:2300,mira2:2300,orejas:1200,cola:1600,feliz:800,salta:750,baila:1700};
function accion1(pet,a){if(!pet)return; var c=ctl(pet); if(c&&/^(mira|mira2|orejas|cola|feliz|nariz)$/.test(a)){c.accion(a); return;} pet.classList.remove("a-"+a); void pet.offsetWidth; pet.classList.add("a-"+a); setTimeout(function(){pet.classList.remove("a-"+a);},DURA[a]||1500);}
function vida(pet,escena,quieta){
  if(!pet)return;
  var foto=pet.classList.contains("foto"), recortada=!!pet.querySelector(".recortada"), lista=foto&&!recortada?["mira","mira2","cola","feliz","cola"]:quieta?["mira","mira2","orejas","cola","salta","feliz"]:["mira","mira2","orejas","cola","salta","baila","pasea","pasea","feliz"];
  if(foto&&!quieta&&recortada)lista=["mira","mira2","cola","orejas","nariz","salta","baila","pasea","pasea","feliz"];
  if(foto&&quieta)lista=["mira","mira2","cola","orejas","nariz","feliz"].concat(recortada?["salta"]:[]);
  /* hasta dónde puede caminar (en % de la escena): la dibujada mide 58 %, Lila 90 % */
  var rango=foto?[-12,5,22]:[2,21,40];
  function haz(){if(!pet.isConnected)return; var a=lista[Math.floor(Math.random()*lista.length)]; if(a==="pasea")pasea(); else accion1(pet,a); luego(haz,2400+Math.random()*3000);}
  function pasea(){var ahora=pet.style.left?parseFloat(pet.style.left):rango[1], dir=Math.random()<0.5?-1:1, nuevo;
    /* en un lugar panorámico la cámara la sigue: el fondo se desplaza y ella avanza un poco */
    var mundo=escena&&escena.querySelector(".lp-mundo");
    if(mundo){var cam=parseFloat(escena.style.getPropertyValue("--cam"))||0.5, camN=Math.max(0,Math.min(1,cam+dir*(0.18+Math.random()*0.24)));
      if(Math.abs(camN-cam)<0.05){dir=-dir; camN=Math.max(0,Math.min(1,cam+dir*(0.18+Math.random()*0.24)));}
      escena.style.setProperty("--cam",camN.toFixed(3)); nuevo=Math.max(rango[0],Math.min(rango[2],ahora+dir*(2+Math.random()*5)));}
    else nuevo=Math.max(rango[0],Math.min(rango[2],ahora+dir*(10+Math.random()*16)));
    if(!mundo&&Math.abs(nuevo-ahora)<4)return accion1(pet,"salta");
    pet.classList.toggle("izq",dir<0);
    var c=ctl(pet); if(c)c.camina(true);
    pet.classList.add("camina"); pet.style.left=nuevo.toFixed(1)+"%";
    setTimeout(function(){pet.classList.remove("camina","izq"); if(c)c.camina(false);},1850);}
  luego(haz,1200+Math.random()*1500);
  if(!escena)return;
  escena.addEventListener("pointermove",function(ev){var r=pet.getBoundingClientRect(); if(!r.width)return;
    var dx=Math.max(-1,Math.min(1,(ev.clientX-(r.left+r.width/2))/(r.width/2))), dy=Math.max(-1,Math.min(1,(ev.clientY-(r.top+r.height*0.45))/(r.height/2)));
    if(pet.classList.contains("izq"))dx=-dx;
    var c=ctl(pet); if(c){c.mira(dx,dy); return;}
    pet.style.setProperty("--mx",(dx*(foto?3:7)).toFixed(1)+"deg"); pet.style.setProperty("--px",(dx*3.5).toFixed(1)+"px"); pet.style.setProperty("--py",(dy*3).toFixed(1)+"px");});
  escena.addEventListener("pointerleave",function(){var c=ctl(pet); if(c)c.mira(null); ["--mx","--px","--py"].forEach(function(k){pet.style.removeProperty(k);});});
}

/* ===================== el mundo: lugares panorámicos que cambian ===================== */
/* partículas de cada lugar (capa lejana) y adornos cercanos que pasan más rápido (paralaje) */
var AMB={cuarto:["mota",14],jardin:["petalo",16],nubes:["nubecita",9],cristal:["destello",18]};
function mundoHTML(l){
  var a=AMB[l.id]||AMB.cuarto, p='';
  for(var i=0;i<a[1];i++)p+='<i class="'+a[0]+'" style="--x:'+(Math.random()*100).toFixed(1)+'%;--y:'+(Math.random()*70).toFixed(1)+'%;--d:'+(-Math.random()*12).toFixed(1)+'s;--t:'+(7+Math.random()*8).toFixed(1)+'s;--s:'+(0.6+Math.random()*0.9).toFixed(2)+'"></i>';
  var cerca=''; for(var j=0;j<7;j++)cerca+='<i style="--x:'+(j*15+Math.random()*8).toFixed(1)+'%;--s:'+(0.7+Math.random()*0.6).toFixed(2)+'"></i>';
  return '<div class="lp-mundo"><img class="lp-pan" src="'+l.img+'" alt="" draggable="false"></div><div class="lp-ambiente amb-'+l.id+'" aria-hidden="true">'+p+'</div>'+
    '<div class="lp-cerca cerca-'+l.id+'" aria-hidden="true">'+cerca+'</div><div class="lp-luz" aria-hidden="true"></div>';
}
function activaMundo(el){var im=el.querySelector(".lp-pan"); if(im)im.addEventListener("error",function(){im.src="lumina/cuarto.jpg"; im.classList.add("solo");});}
function lugares(){
  var pf=C.actual(), g=lumi(pf), m=L.mascota(g), c=L.POR_ID[m.id], act=g.lugar||"auto";
  var el=pinta(top("🏞️ ¿Dónde jugamos?")+'<div class="lp-lugares"><p class="lp-txt">Elige un lugar para pasear con '+esc(m.nom)+'.</p><div class="lp-lug-grid">'+
    '<button type="button" data-lug="auto" class="'+(act==="auto"?'on':'')+'"><span class="lp-lug-auto">✨</span><b>Automático</b><small>Cada criatura en su casa: ahora '+esc(L.lugarDe({lugar:"auto"},c).nom)+'</small></button>'+
    L.LUGARES.map(function(l){return '<button type="button" data-lug="'+l.id+'" class="'+(act===l.id?'on':'')+'"><img src="'+l.img+'" alt=""><b>'+l.ico+' '+esc(l.nom)+'</b></button>';}).join("")+'</div>'+
    '<p class="fine">La luz cambia con la hora: mañana, día y atardecer.</p></div>',"lugares");
  if(!el)return;
  $("lp-volver").onclick=function(){mapa();};
  on(el,"[data-lug]",function(b){g.lugar=b.getAttribute("data-lug"); C.cambia(pf); C.SON.toca(); var l=L.lugarDe(g,c); AVISO="¡Vamos a "+(l.id==="cuarto"?"mi habitación":l.nom)+"! "+l.ico; mapa();});
}

/* ===================== el camino infinito =====================
   Vista hacia adelante: el camino viene hacia la cámara y la mascota (de frente) camina hacia
   nosotros, así su marcha es creíble. El suelo avanza al mismo ritmo que sus pasos. Adornos del
   bioma a los lados, tronquitos que salta sola, estrellas que atrapa si se toca la pantalla, y
   cada tramo una piedra de prueba. Todo sale de una semilla: el camino no se acaba nunca. */
/* objetos realistas del camino (generados con el mismo modelo que las criaturas); el emoji es el respaldo */
var SPR={flor:"🌸",tulipan:"🌷",hongo:"🍄",girasol:"🌻",arbusto:"🌳",nube:"☁️",cristal:"💎",cristal2:"🔮",roca:"🪨",tronco:"🪵",piedra:"🪨",estrella:"⭐"}, SPR_IMG={};
function sprite(k){if(!SPR_IMG[k]){SPR_IMG[k]=new Image(); SPR_IMG[k].src="lumina/objetos/"+k+".webp";} var im=SPR_IMG[k]; return im.complete&&im.naturalWidth?im:null;}
var LC={jardin:{decor:["flor","tulipan","hongo","girasol","arbusto","flor"],suelo:["#a7df8f","#8fd17c"],sendero:["#f7ead0","#efdcb9"],img:"lumina/lugares/jardin.webp",nom:"Jardín Hada",ico:"🌸"},
  nubes:{decor:["nube","nube","estrella","nube","nube"],suelo:["#ffffff","#eef1ff"],sendero:["#ffe9f4","#fbd9ec"],img:"lumina/lugares/nubes.webp",nom:"Cielo de Nubes",ico:"☁️"},
  cristal:{decor:["cristal","cristal2","roca","cristal","hongo"],suelo:["#8a76c6","#7765b4"],sendero:["#c9b8f5","#b9a6ef"],img:"lumina/lugares/cristal.webp",nom:"Cueva de Cristal",ico:"💎"}};
var ICO_RETO={cocina:"🧪",arbol:"🌳",jardin:"🌼"}, PASO_M=1.15, RES_CAMINO=null;
function azarK(semilla,k){var x=Math.sin((k+1)*12.9898+semilla*78.233)*43758.5453; return x-Math.floor(x);}
function camino(){
  var pf=C.actual(); if(!pf)return C.portada(); var g=lumi(pf), md=modo(pf,g); if(L.enNoche(g))return mapa();
  var cm=L.caminoDe(g), m=L.mascota(g), c=L.POR_ID[m.id], nv=L.nivelMascota(m.xp), hab=L.habilidad(nv.n);
  var el=pinta(top("🌈 Camino de las pruebas","Casa")+
    '<div class="lc-hud"><span>🐾 <b id="lc-dist">'+Math.floor(cm.dist)+'</b> m</span><span class="lc-niv"><b>⭐ Nivel '+nv.n+' · '+esc(nv.titulo)+'</b><i style="--p:'+Math.round(nv.pct*100)+'%"></i></span><span>🏆 '+Math.floor(cm.record)+' m</span></div>'+
    '<div class="lc-mundo hora-'+L.franja()+'" id="lc-mundo"><canvas id="lc-cv" aria-label="Camino"></canvas><div class="lp-luz" aria-hidden="true"></div>'+
      '<div class="lc-pet'+(hab.aura?' aura':'')+(hab.halo?' halo':'')+'" id="lc-pet">'+petHTML(g,m,"feliz")+'</div>'+
      '<div class="lc-bioma" id="lc-bioma" hidden></div><button type="button" class="lc-globo" id="lc-globo" hidden></button></div>'+
    '<div class="lc-ctrl"><button type="button" class="ghost" id="lc-anda">⏸ Descansar</button><button type="button" class="primary" id="lc-salto">⬆️ Saltar</button></div>'+
    '<p class="fine">La mascota camina sola. Toca la pantalla o «Saltar» para atrapar estrellas ⭐. En cada piedra mágica hay una prueba: ¡al aprender sube de nivel, camina más rápido y salta más alto!</p>',"camino");
  if(!el)return;
  $("lp-volver").onclick=function(){guardar(); mapa();};
  var cv=$("lc-cv"), cx=cv.getContext("2d"), mundo=$("lc-mundo"), petEl=$("lc-pet"), host=petEl.querySelector(".lp-vivo");
  var z=cm.dist, vel=0, andando=true, quieto=false, estZ=(cm.est+1)*L.TRAMO, imgs={}, atrapadas={}, ultGuardado=Date.now(), tPrev=performance.now(), polvoGanado=0;
  if(estZ<z+12)estZ=Math.ceil((z+12)/L.TRAMO)*L.TRAMO;
  function img(b){if(!imgs[b]){imgs[b]=new Image(); imgs[b].src=LC[b].img;} return imgs[b];}
  var bioma=L.biomaCamino(cm.est), biomaAnt=bioma, mezcla=1;
  /* guarda solo lo caminado desde el último guardado (así nunca pisa la distancia guardada) */
  var zGuardado=z;
  function guardar(){if(z>zGuardado){L.avanzaCamino(g,z-zGuardado); zGuardado=z; C.cambia(pf);}}
  function ctlPet(){return host&&host._vivo;}
  function anuncia(t){var b=$("lc-bioma"); if(!b)return; b.textContent=t; b.hidden=false; b.classList.remove("on"); void b.offsetWidth; b.classList.add("on"); setTimeout(function(){if(b)b.hidden=true;},2600);}
  anuncia(LC[bioma].ico+" "+LC[bioma].nom);
  function salta(){var k=ctlPet(); if(k&&!k.saltando()){k.salta(hab.salto); nota(660,0.12,0.03); return true;} return false;}
  $("lc-anda").onclick=function(){andando=!andando; this.textContent=andando?"⏸ Descansar":"▶ Caminar"; C.SON.toca();};
  $("lc-salto").onclick=function(){salta();};
  /* tocar el mundo: salta; frente a la piedra, abre la prueba */
  mundo.addEventListener("pointerdown",function(ev){if(ev.target.closest("button"))return; if(quieto)abreReto(); else salta();});
  /* proyección: z' metros por delante → altura en pantalla y escala */
  function proy(W,H,dz){var hy=H*0.4, z0=1.4, k=z0/Math.max(0.35,dz); return {y:hy+(H*0.98-hy)*k,s:k};}
  function cuadro(ahora){
    if(!cv.isConnected){guardar(); return;}
    requestAnimationFrame(cuadro);
    var dt=Math.min(0.05,(ahora-tPrev)/1000); tPrev=ahora;
    var r=mundo.getBoundingClientRect(), dpr=Math.min(2,window.devicePixelRatio||1), W=Math.round(r.width*dpr), H=Math.round(r.height*dpr);
    if(cv.width!==W||cv.height!==H){cv.width=W; cv.height=H;}
    /* la marcha: el suelo avanza exactamente lo que dan los pasos */
    var cerca=estZ-z; quieto=cerca<2.2;
    var vObj=andando&&!quieto?hab.vel:0; vel+=(vObj-vel)*Math.min(1,dt*2.5);
    var k=ctlPet(); if(k)k.marcha(vel);
    var vSuelo=vel>0.02?(1.25+vel*1.6)*PASO_M:0; z+=vSuelo*dt;
    if(quieto&&$("lc-globo").hidden){var gl2=$("lc-globo"); gl2.innerHTML='<b>¡Una piedra mágica '+ICO_RETO[["cocina","arbol","jardin"][cm.est%3]]+'!</b><span>Toca para resolver la prueba</span>'; gl2.hidden=false; nota(880,0.2,0.04); luego(function(){nota(1175,0.25,0.04);},180); decir("¡Una piedra mágica! Toca para resolver la prueba."); if(k)k.accion("feliz");}
    if($("lc-dist"))$("lc-dist").textContent=Math.floor(z);
    if(Date.now()-ultGuardado>3000){ultGuardado=Date.now(); guardar();}
    /* el bioma cambia con suavidad */
    var bNuevo=L.biomaCamino(cm.est); if(bNuevo!==bioma){biomaAnt=bioma; bioma=bNuevo; mezcla=0; anuncia(LC[bioma].ico+" "+LC[bioma].nom);} mezcla=Math.min(1,mezcla+dt*0.6);
    dibuja(W,H,ahora/1000);
  }
  function dibuja(W,H,t){
    var hy=H*0.4, B=LC[bioma], A=LC[biomaAnt];
    cx.clearRect(0,0,W,H);
    /* el cielo: el panorama del bioma, con un leve vaivén del camino */
    var curva=Math.sin(z/45)*0.08;
    [[A,1-mezcla],[B,mezcla]].forEach(function(par){if(par[1]<=0.01)return; var im=img(par[0]===B?bioma:biomaAnt); if(!im.complete||!im.naturalWidth)return;
      cx.globalAlpha=par[1]; var ih=hy*1.55, iw=ih*im.naturalWidth/im.naturalHeight, x0=-(iw-W)*(0.5+curva); cx.drawImage(im,x0,hy-ih*0.9,iw,ih);});
    cx.globalAlpha=1;
    /* el suelo a los lados: empieza con el color real del pie del panorama (sin corte en el horizonte) y
       se vuelve el pasto, las nubes o el piso de cristal del bioma; el sendero tiene baldosas que vienen hacia nosotros */
    var hc=colorHorizonte(bioma)||B.suelo[1];
    var g1=cx.createLinearGradient(0,hy,0,H); g1.addColorStop(0,hc); g1.addColorStop(0.35,B.suelo[1]); g1.addColorStop(1,B.suelo[0]); cx.fillStyle=g1; cx.fillRect(0,hy,W,H-hy);
    var anchoAbajo=W*0.62, cxm=W/2+curva*W*0.6;
    for(var i=0;i<46;i++){var z1=Math.floor(z)+i-(z%1), za=Math.max(0.35,z1-z+0.35), zb=Math.max(0.35,z1+1-z+0.35);
      var pa=proy(W,H,za), pb=proy(W,H,zb), wa=anchoAbajo*pa.s/1, wb=anchoAbajo*pb.s;
      var xa=W/2+(cxm-W/2)*(1-pa.s), xb=W/2+(cxm-W/2)*(1-pb.s);
      cx.fillStyle=B.sendero[(Math.floor(z)+i)%2]; cx.beginPath(); cx.moveTo(xa-wa/2,pa.y); cx.lineTo(xa+wa/2,pa.y); cx.lineTo(xb+wb/2,pb.y); cx.lineTo(xb-wb/2,pb.y); cx.closePath(); cx.fill();}
    /* niebla en el horizonte */
    var g2=cx.createLinearGradient(0,hy-6,0,hy+H*0.12); g2.addColorStop(0,"rgba(255,255,255,.55)"); g2.addColorStop(1,"rgba(255,255,255,0)"); cx.fillStyle=g2; cx.fillRect(0,hy-6,W,H*0.12+6);
    /* objetos: de lejos a cerca */
    var objs=[];
    for(var q=Math.floor(z)+40;q>=Math.floor(z)-1;q--){var dz=q-z+0.35; if(dz<0.3)continue; var p=proy(W,H,dz), xs=function(lado){return W/2+(cxm-W/2)*(1-p.s)+lado*anchoAbajo*p.s*0.5;};
      var a1=azarK(cm.semilla,q), a2=azarK(cm.semilla+7,q);
      if(a1<0.55){var lado=a2<0.5?-1:1, d=B.decor[Math.floor(azarK(cm.semilla+3,q)*B.decor.length)]; objs.push({y:p.y,s:p.s,x:xs(lado)+lado*(0.25+a2*0.6)*W*0.25*p.s*2,e:d,tam:0.42+a1*0.3});}
      if(q%23===7&&q<estZ-4){objs.push({y:p.y,s:p.s,x:xs(0),e:"tronco",tam:0.2,tronco:q});}
      if(q%11===4&&q<estZ-4&&!atrapadas[q]){objs.push({y:p.y-H*0.17*p.s*2.2,s:p.s,x:xs(0)+(azarK(cm.semilla+11,q)-0.5)*W*0.2*p.s,e:"estrella",tam:0.16,estrella:q,brilla:1});}
      if(q===estZ){objs.push({y:p.y,s:p.s,x:xs(0),e:"piedra",tam:0.55,piedra:1});}}
    objs.sort(function(a,b){return a.y-b.y;});
    var k=ctlPet(), enAire=k&&k.saltando();
    objs.forEach(function(o){
      /* tamaño con tope; lo que pasa muy cerca de la cámara se desvanece para no tapar la vista */
      var fs=Math.min(H*0.42,Math.max(4,H*o.tam*o.s)), alfa=1-ss01(1.05,1.55,o.s); if(alfa<=0.02)return;
      cx.save(); cx.globalAlpha=alfa;
      /* sombra de contacto en el piso */
      if(!o.estrella){cx.fillStyle="rgba(60,40,90,.18)"; cx.beginPath(); cx.ellipse(o.x,o.y-fs*0.02,fs*0.38,fs*0.07,0,0,Math.PI*2); cx.fill();}
      if(o.piedra||o.brilla){cx.shadowColor=o.piedra?"rgba(255,230,120,.95)":"rgba(255,220,90,1)"; cx.shadowBlur=(o.piedra?34:18)*dpr2()*(o.piedra?o.s+0.3:1);}
      var im=sprite(o.e);
      if(im){var hh=fs, ww=hh*im.naturalWidth/im.naturalHeight; if(o.estrella){var gi=1+0.08*Math.sin(t*6+o.estrella); hh*=gi; ww*=gi;} cx.drawImage(im,o.x-ww/2,o.y-hh,ww,hh);}
      else{cx.font=fs+"px serif"; cx.textAlign="center"; cx.textBaseline="bottom"; cx.fillText(SPR[o.e]||o.e,o.x,o.y);}
      if(o.piedra){cx.shadowBlur=0; cx.font=(fs*0.42)+"px serif"; cx.textAlign="center"; cx.textBaseline="bottom"; cx.fillText(ICO_RETO[["cocina","arbol","jardin"][cm.est%3]],o.x,o.y-fs*0.55);
        cx.font=(fs*0.22)+"px serif"; for(var j=0;j<6;j++){var an=t*1.4+j*1.047; cx.fillText("✨",o.x+Math.cos(an)*fs*0.62,o.y-fs*0.5+Math.sin(an)*fs*0.32);}}
      cx.restore();
      /* tronquitos: los salta sola; estrellas: se atrapan saltando */
      if(o.tronco!=null&&o.s>0.75&&o.s<1.15&&k&&!k.saltando())k.salta(hab.salto*0.8);
      if(o.estrella!=null&&o.s>0.9&&enAire&&!atrapadas[o.estrella]){atrapadas[o.estrella]=1; polvoGanado++; g.inv.polvo++; nota(1320,0.12,0.04); chispas(petEl,8,"⭐");}});
  }
  function dpr2(){return Math.min(2,window.devicePixelRatio||1);}
  /* el color promedio del borde de abajo del panorama, para fundir el suelo */
  var HC={};
  function colorHorizonte(b){if(HC[b])return HC[b]; var im=img(b); if(!im.complete||!im.naturalWidth)return null;
    try{var c2=document.createElement("canvas"); c2.width=64; c2.height=32; var x2=c2.getContext("2d"); x2.drawImage(im,0,0,64,32); var d=x2.getImageData(0,28,64,4).data, r=0,gg=0,bb=0,n=0;
      for(var i=0;i<d.length;i+=4){r+=d[i]; gg+=d[i+1]; bb+=d[i+2]; n++;} HC[b]="rgb("+Math.round(r/n)+","+Math.round(gg/n)+","+Math.round(bb/n)+")";}catch(e){HC[b]=B0(b);} return HC[b];}
  function B0(b){return LC[b].suelo[1];}
  function ss01(a,b,x){var u=Math.max(0,Math.min(1,(x-a)/(b-a))); return u*u*(3-2*u);}
  /* la piedra: tocarla abre la prueba */
  $("lc-globo").onclick=function(){abreReto();};
  var abriendo=false;
  function abreReto(){if(!quieto||abriendo)return; abriendo=true; guardar(); var rr=L.retoCamino(g,md,C.semilla());
    reto(rr.mod,rr.it,function(ok){var res=L.resultadoCamino(g,rr.mod,rr.it,ok,md); C.cambia(pf); RES_CAMINO=res; camino();});}
  requestAnimationFrame(cuadro);
  /* al volver de una prueba: el premio */
  if(RES_CAMINO){var res=RES_CAMINO; RES_CAMINO=null;
    luego(function(){var M2=L.MODULOS[["cocina","arbol","jardin"][(cm.est+2)%3]];
      var t=res.subio?"¡"+m.nom+" subió al nivel "+res.nivel.n+"! Ahora es "+res.nivel.titulo+": camina más rápido y salta más alto.":(res.ok?"¡Muy bien! +"+res.xp+" de experiencia":"¡Buen intento! +"+res.xp+" de experiencia. ¡Sigamos!");
      var b=$("lc-bioma"); if(b){b.innerHTML=(res.subio?"🎉 ":"⭐ ")+esc(t)+(res.premio?" · "+L.MODULOS[res.premio==="bocadillo"?"cocina":res.premio==="espuma"?"arbol":"jardin"].premioIco+" +1":"")+(res.huevos?" · 🥚 ¡huevo sorpresa!":""); b.hidden=false; b.classList.remove("on"); void b.offsetWidth; b.classList.add("on"); setTimeout(function(){if(b)b.hidden=true;},3800);}
      var k=ctlPet(); if(k){k.accion("feliz"); if(res.subio)k.salta(hab.salto);} chispas(petEl,res.subio?24:12,res.subio?"🌟":"✨"); if(res.subio)C.SON.domina(); else C.SON.bien(); decir(t);},500);}
}

/* ===================== cuidados ===================== */
function accion(k){
  var pf=C.actual(), g=lumi(pf), m=L.mascota(g);
  if(k==="comer")return comer(pf,g,m);
  if(k==="bano")return bano(pf,g,m);
  if(k==="dormir")return dormir(pf,g,m);
  if(k==="vestir")return vestir();
  if(k==="huevos")return huevos();
  if(k==="aldea")return aldea();
  if(k==="misiones")return misiones();
  if(k==="lugar")return lugares();
}
function comer(pf,g,m){
  if(g.inv.bocadillo<=0){AVISO="¡No quedan bocadillos! Prepáralos en la Cocina de Pociones 🧪."; return mapa();}
  if(g.barras.pan>=95){AVISO="¡Estoy llenita! Gracias. Guardemos el bocadillo para después."; return mapa();}
  var r=L.comer(g); C.cambia(pf);
  var el=pinta(top("🧁 ¡A comer!")+'<div class="lp-accion lp-come"><div class="lp-escena-mini">'+petHTML(g,m,"come","ñam")+'<span class="lp-vuela">🧁</span></div><p class="lp-txt">¡Ñam, ñam! ¡Qué rico!</p></div>',"accion");
  if(!el)return;
  $("lp-volver").onclick=function(){mapa();};
  [0,260,520].forEach(function(t){luego(function(){nota(520+t/2,0.1,0.04);},500+t);});
  luego(function(){chispas(el.querySelector(".lp-escena-mini"),10,"💖");},900);
  AVISO=r.huevos?"¡Gracias! ¡Mira, llegó un huevo sorpresa! 🥚":"¡Gracias! Tenía mucha hambre. 💖";
  luego(mapa,2000);
}
/* el baño: se revientan las burbujas una por una */
function bano(pf,g,m){
  if(g.barras.bri>=90){AVISO="¡Ya estoy brillante! ✨ Báñame cuando me ensucie."; return mapa();}
  var espuma=g.inv.espuma>0, n=espuma?12:6;
  var el=pinta(top("🛁 Baño de burbujas")+'<div class="lp-accion lp-banera"><div class="lp-agua" id="lp-agua">'+petHTML(g,m,"feliz")+'<div class="lp-burbujas" id="lp-burb"></div></div>'+
    '<p class="lp-txt" id="lp-txt">'+(espuma?'¡Con espuma mágica! Revienta todas las burbujas.':'Sin espuma mágica el baño es cortito. Consigue 🫧 en el Árbol de las Palabras.')+'</p></div>',"accion");
  if(!el)return;
  $("lp-volver").onclick=function(){mapa();};
  var z=$("lp-burb"), quedan=n;
  for(var i=0;i<n;i++){var b=document.createElement("button"); b.type="button"; b.className="lp-burbuja"; b.setAttribute("aria-label","burbuja");
    var t=34+Math.round(Math.random()*26); b.style.width=b.style.height=t+"px"; b.style.left=(4+Math.random()*80)+"%"; b.style.top=(4+Math.random()*70)+"%"; b.style.animationDelay=(Math.random()*2).toFixed(2)+"s";
    b.onpointerdown=function(ev){ev.preventDefault(); if(this.classList.contains("pum"))return; this.classList.add("pum"); nota(600+Math.random()*500,0.08,0.04); quedan--;
      var self=this; setTimeout(function(){if(self.parentNode)self.parentNode.removeChild(self);},300);
      if(!quedan){var r=L.bano(g,espuma); C.cambia(pf); C.SON.bien(); chispas($("lp-agua"),14); $("lp-txt").textContent="✨ ¡Qué brillo! ¡Gracias!";
        AVISO=r.huevos?"¡Quedé brillante! Y llegó un huevo sorpresa 🥚":"¡Quedé muy brillante! ✨"; luego(mapa,1500);}};
    z.appendChild(b);}
  if(autoVoz(pf,g))decir(espuma?"¡Revienta todas las burbujas!":"Sin espuma mágica el baño es cortito. Revienta las burbujas.");
}
/* a dormir en el nido de nubes, con canción de cuna */
function dormir(pf,g,m){
  if(g.barras.des>=95){AVISO="¡No tengo sueño! Quiero jugar. 😺"; return mapa();}
  var el=pinta(top("☁️ Nido de nubes")+'<div class="lp-accion lp-nido"><div class="lp-cielo-n"><span class="lp-luna">🌙</span><span class="lp-zz">Z z z</span>'+petHTML(g,m,"duerme","dormida")+'<div class="lp-nubes"></div></div><p class="lp-txt">Shhh… '+esc(m.nom)+' está durmiendo una siesta.</p></div>',"accion noche");
  if(!el)return;
  $("lp-volver").onclick=function(){mapa();};
  cancionDeCuna();
  luego(function(){var r=L.dormir(g); C.cambia(pf); AVISO=r.huevos?"¡Qué buena siesta! Y llegó un huevo sorpresa 🥚":"¡Qué buena siesta! Tengo energía para aprender. ☀️"; mapa();},4400);
}

/* ===================== vestir ===================== */
function vestir(){
  var pf=C.actual(), g=lumi(pf), m=L.mascota(g);
  var el=pinta(top("🎀 Vestir a "+esc(m.nom))+'<div class="lp-vestir">'+inventario(g)+'<div class="lp-escena-mini">'+petHTML(g,m,"feliz")+'</div>'+
    '<div class="lp-tienda">'+L.ACCES.map(function(a){var tiene=g.acc.indexOf(a.id)>=0, puesto=m.acc.indexOf(a.id)>=0, k=a.precio.gema?"gema":"polvo", n=a.precio[k], puede=g.inv[k]>=n;
      return '<button type="button" data-a="'+a.id+'" class="'+(puesto?'puesto':tiene?'tiene':puede?'':'caro')+'"><span>'+a.ico+'</span><b>'+esc(a.nom)+'</b><small>'+(puesto?'Puesto ✔':tiene?'Ponérselo':(k==="gema"?'💎 ':'✨ ')+n)+'</small></button>';}).join("")+'</div>'+
    '<p class="fine">✨ El polvo estelar se gana en todos los juegos. 💎 Las gemas salen del Jardín de las Preguntas y de las misiones.</p></div>',"vestir");
  if(!el)return;
  $("lp-volver").onclick=function(){mapa();};
  on(el,"[data-a]",function(b){var id=b.getAttribute("data-a"), a=L.ACC[id];
    if(g.acc.indexOf(id)<0){if(!L.compra(g,id)){var k=a.precio.gema?"gema":"polvo"; aviso(el,"Te falta"+(k==="gema"?"n 💎 gemas":" ✨ polvo estelar")+". ¡Juega y aprende para conseguirlo!"); C.SON.otra(); return;} C.SON.sube();}
    else C.SON.toca();
    L.viste(g,m.id,id); C.cambia(pf); vestir();});
}
function aviso(raiz,t){var a=raiz.querySelector(".ig-aviso"); if(!a){a=document.createElement("div"); a.className="ig-aviso"; raiz.appendChild(a);} a.textContent=t; a.classList.remove("on"); void a.offsetWidth; a.classList.add("on");}

/* ===================== huevos e incubación ===================== */
function huevos(){
  var pf=C.actual(), g=lumi(pf), m=L.mascota(g);
  var el=pinta(top("🥚 Huevos sorpresa")+'<div class="lp-huevos">'+
    (g.huevos.length?'<p class="lp-txt">Elige un huevo para darle calor. ¡Algo se mueve adentro!</p><div class="lp-nido-h">'+g.huevos.map(function(h){
      return '<button type="button" data-h="'+esc(h.id)+'">'+DW.huevo(h.tono,h.calor,0)+'<small>'+(h.especial?'🌟 Especial · ':'')+'🔥 '+Math.round(h.calor)+'%</small></button>';}).join("")+'</div>'
      :'<div class="lp-vacio"><span>🪺</span><p>Aún no hay huevos.</p><p class="fine">Llena el 💖 Vínculo Mágico aprendiendo y cuidando a '+esc(m.nom)+', o completa todas las misiones del día.</p></div>')+
    barraV(g)+'<p class="fine">Colección: '+g.mascotas.length+' de '+L.CRIATURAS.length+' criaturas.</p></div>',"huevos");
  if(!el)return;
  $("lp-volver").onclick=function(){mapa();};
  on(el,"[data-h]",function(b){incuba(b.getAttribute("data-h"));});
}
function incuba(hid){
  var pf=C.actual(), g=lumi(pf), h=g.huevos.filter(function(x){return x.id===hid;})[0]; if(!h)return huevos();
  var grietas=0;
  var el=pinta(top("🥚 Darle calor","Huevos")+'<div class="lp-incuba"><div class="lp-huevo-zona" id="lp-hz"><div class="lp-huevo" id="lp-huevo">'+DW.huevo(h.tono,h.calor,0)+'</div></div>'+
    '<div class="lp-calor"><span>🔥</span><i id="lp-cal" style="--p:'+h.calor+'%"></i><b id="lp-calp">'+Math.round(h.calor)+'%</b></div><p class="lp-txt" id="lp-txt"></p>'+
    '<div class="lp-formas" id="lp-formas"><div class="lp-forma"><b>✋ Frótalo</b><small>Pasa el dedo suavemente sobre el huevo.</small></div>'+
      '<div class="lp-forma"><b>🎵 Cántale</b><div class="lp-notas">'+[["Do",262],["Re",294],["Mi",330],["Fa",349],["Sol",392]].map(function(x){return '<button type="button" data-f="'+x[1]+'">'+x[0]+'</button>';}).join("")+'</div></div>'+
      '<div class="lp-forma"><b>🤲 Mécelo</b><button type="button" class="ghost" id="lp-mece">Mecer el huevo</button><small>También puedes mover el teléfono despacito.</small></div></div></div>',"incuba");
  if(!el)return;
  $("lp-volver").onclick=function(){C.cambia(pf); huevos();};
  var zona=$("lp-hz"), egg=$("lp-huevo");
  function pintaH(){egg.innerHTML=DW.huevo(h.tono,h.calor,grietas); $("lp-cal").style.setProperty("--p",h.calor+"%"); $("lp-calp").textContent=Math.round(h.calor)+"%";
    $("lp-txt").textContent=h.calor>=100?(grietas?"¡Sigue! ¡Ya casi sale!":"¡Está listo! Toca el huevo para ayudarle a salir."):h.calor>=60?"¡Se mueve! Le gusta tu cariño.":"Dale calor con cariño.";
    if(h.calor>=100)$("lp-formas").classList.add("listo");}
  function calor(n){if(h.calor>=100)return; L.calienta(g,hid,n); guardaLuego(pf); pintaH(); egg.classList.remove("mueve"); void egg.offsetWidth; egg.classList.add("mueve");
    if(h.calor>=100){C.SON.sube(); chispas(zona,10); if(autoVoz(pf,g))decir("¡Está listo! Toca el huevo para ayudarle a salir.");}}
  /* frotar: cada tramo de dedo sobre el huevo da un poquito de calor */
  var ultimo=null, recorrido=0;
  zona.addEventListener("pointerdown",function(ev){
    if(h.calor>=100){grietas++; nota(300+grietas*120,0.15,0.05); pintaH(); egg.classList.remove("mueve"); void egg.offsetWidth; egg.classList.add("mueve");
      if(grietas>=4)nacer(pf,g,hid); return;}
    ultimo=[ev.clientX,ev.clientY]; try{zona.setPointerCapture(ev.pointerId);}catch(x){}});
  zona.addEventListener("pointermove",function(ev){if(!ultimo||h.calor>=100)return; recorrido+=Math.abs(ev.clientX-ultimo[0])+Math.abs(ev.clientY-ultimo[1]); ultimo=[ev.clientX,ev.clientY];
    if(recorrido>=45){recorrido=0; calor(2); if(Math.random()<0.4){var s=document.createElement("span"); s.className="lp-corazon"; s.textContent="✨"; var rc=zona.getBoundingClientRect(); s.style.left=(ev.clientX-rc.left)+"px"; s.style.top=(ev.clientY-rc.top)+"px"; zona.appendChild(s); setTimeout(function(){if(s.parentNode)s.parentNode.removeChild(s);},900);}}});
  ["pointerup","pointercancel","pointerleave"].forEach(function(t){zona.addEventListener(t,function(){ultimo=null;});});
  on(el,"[data-f]",function(b){nota(+b.getAttribute("data-f"),0.4,0.06); calor(4);});
  $("lp-mece").onclick=function(){egg.classList.remove("mece"); void egg.offsetWidth; egg.classList.add("mece"); calor(6);
    /* el acelerómetro (en iPhone hay que pedir permiso) */
    if(!MOVER&&window.DeviceMotionEvent){var pedir=DeviceMotionEvent.requestPermission; var activa=function(){var t0=0; MOVER=function(e){var a=e.accelerationIncludingGravity||{}, ahora=Date.now(), f=Math.abs(a.x||0)+Math.abs(a.z||0);
        if(ahora-t0>450&&f>14){t0=ahora; calor(3); egg.classList.remove("mece"); void egg.offsetWidth; egg.classList.add("mece");}}; window.addEventListener("devicemotion",MOVER);};
      if(typeof pedir==="function")pedir().then(function(s){if(s==="granted")activa();}).catch(function(){}); else activa();}};
  pintaH();
  if(autoVoz(pf,g))decir("Dale calor al huevo: frótalo, cántale o mécelo.");
}
/* la eclosión: partículas doradas y la criatura nueva */
function nacer(pf,g,hid){
  var r=L.nace(g,hid,C.semilla()); C.cambia(pf); if(!r)return huevos();
  var c=r.criatura;
  var el=pinta('<div class="lp-nace">'+(c?'<div class="lp-revela" id="lp-rev"><div class="lp-rayos"></div>'+petHTML(g,{id:c.id,acc:[]},"wow","aparece")+'</div>'+
      '<h3>¡Nació '+esc(c.nom)+'!</h3><p class="lp-titulo">'+esc(L.titulo(c))+'</p><p><span class="lp-rar r'+c.rar+'">'+L.RAREZA[c.rar]+'</span> <span class="lp-bioma">'+bioma(c.bioma).ico+' Vivirá en '+esc(bioma(c.bioma).nom)+'</span></p>'+
      '<div class="actions"><button type="button" class="ghost" id="lp-aldea">🌳 Ver la Aldea</button><button type="button" class="primary grande" id="lp-activa">🏠 Que sea mi mascota</button></div>'
    :'<div class="lp-revela" id="lp-rev"><span class="lp-cofre">🎁</span></div><h3>¡Ya tienes todas las criaturas!</h3><p>El huevo traía un tesoro: 💎 5 gemas y ✨ 30 de polvo estelar.</p><div class="actions"><button type="button" class="primary grande" id="lp-activa">🏠 Volver a casa</button></div>')+
    (g.huevos.length?'<p><button type="button" class="ghost" id="lp-otro">🥚 Incubar otro huevo</button></p>':'')+'</div>',"nace");
  if(!el)return;
  C.SON.domina(); chispas($("lp-rev"),22); luego(function(){chispas($("lp-rev"),16,"🌟");},500);
  if(c)decir("¡Nació "+c.nom+", "+L.titulo(c)+"!");
  if($("lp-aldea"))$("lp-aldea").onclick=function(){aldea();};
  if($("lp-otro"))$("lp-otro").onclick=function(){huevos();};
  $("lp-activa").onclick=function(){if(c){g.activa=c.id; C.cambia(pf); AVISO="¡Hola! Soy "+c.nom+". ¡Gracias por cuidarme tanto!";} mapa();};
}
function bioma(id){return L.BIOMAS.filter(function(b){return b.id===id;})[0]||L.BIOMAS[0];}

/* ===================== la Aldea del Gran Árbol ===================== */
function aldea(){
  var pf=C.actual(), g=lumi(pf), tengo={}; g.mascotas.forEach(function(m){tengo[m.id]=m;});
  var el=pinta(top("🌳 La Aldea")+'<div class="lp-aldea"><p class="lp-txt">Aquí viven tus criaturas, en las ramas del Gran Árbol.</p><div class="lp-arbol">'+DW.aldea()+
      L.BIOMAS.map(function(b){return '<div class="lp-rama r-'+b.id+'">'+g.mascotas.filter(function(m){var c=L.POR_ID[m.id]; return c&&c.bioma===b.id;}).map(function(m,i){
        return '<button type="button" class="lp-vecino'+(m.id===g.activa?' activa':'')+'" data-m="'+m.id+'" style="--d:'+(i*0.4).toFixed(1)+'s" aria-label="'+esc(m.nom)+'">'+petHTML(g,m,"feliz")+'</button>';}).join("")+'</div>';}).join("")+'</div>'+
    '<p class="lp-txt">Toca una criatura para que sea tu compañera en casa.</p>'+
    L.BIOMAS.map(function(b){return '<h4 class="lp-h">'+b.ico+' '+esc(b.nom)+'</h4><div class="lp-album">'+L.CRIATURAS.filter(function(c){return c.bioma===b.id;}).map(function(c){var m=tengo[c.id];
      return m?'<button type="button" data-m="'+c.id+'" class="'+(c.id===g.activa?'activa':'')+'">'+petHTML(g,m,"feliz")+'<b>'+esc(m.nom)+'</b><small>'+esc(L.titulo(c))+'</small></button>'
        :'<div class="falta"><span>❔</span><b>???</b><small>'+L.RAREZA[c.rar]+'</small></div>';}).join("")+'</div>';}).join("")+
    '<p class="fine">Colección: '+g.mascotas.length+' de '+L.CRIATURAS.length+'. Cada huevo trae una criatura que todavía no tienes.</p></div>',"aldea");
  if(!el)return;
  $("lp-volver").onclick=function(){mapa();};
  on(el,"[data-m]",function(b){g.activa=b.getAttribute("data-m"); C.cambia(pf); C.SON.toca(); var m=L.mascota(g); AVISO="¡Hola! Hoy me quedo contigo en casa. Soy "+m.nom+"."; mapa();});
  Array.prototype.forEach.call(el.querySelectorAll(".lp-vecino .lp-pet"),function(p){vida(p,null,true);});
}

/* ===================== misiones de pequeños héroes ===================== */
var BLOQUEO=0, FALLOS=0;
function misiones(pinPara){
  var pf=C.actual(), g=lumi(pf), hab=L.habitosHoy(g);
  var hechas=hab.filter(function(x){return x.n>=x.max;}).length;
  var cuerpo;
  if(pinPara){var h=hab.filter(function(x){return x.h.id===pinPara;})[0];
    cuerpo='<div class="lp-pin"><p>👪 Un adulto confirma con el <b>PIN familiar</b>:</p><p class="lp-mision-n">'+h.h.ico+' '+esc(h.h.nom)+'</p><div class="lp-puntos" id="lp-pts"><i></i><i></i><i></i><i></i></div>'+
      '<p class="msg bad" id="lp-pin-e" hidden></p><div class="mt-teclado lp-teclado">'+["1","2","3","4","5","6","7","8","9","↩","0","⌫"].map(function(t){return '<button type="button" data-k="'+t+'">'+t+'</button>';}).join("")+'</div></div>';}
  else cuerpo=(!hab.length?'<p class="fine">No hay misiones activas. Un adulto puede elegirlas en 👪 Para la familia.</p>':
    '<div class="lp-misiones">'+hab.map(function(x){var ok=x.n>=x.max;
      return '<div class="lp-mision'+(ok?' hecha':'')+'"><span>'+x.h.ico+'</span><div><b>'+esc(x.h.nom)+'</b><small>'+(x.max>1?x.n+' de '+x.max+' veces hoy':ok?'¡Hecha hoy!':'Para hoy')+'</small></div>'+
        (ok?'<i>✔</i>':'<button type="button" class="primary" data-hab="'+esc(x.h.id)+'">¡Lo hice!</button>')+'</div>';}).join("")+'</div>')+
    '<p class="fine">Cada misión confirmada trae un cometa con 💎 2 gemas y ✨ 10 de polvo. Si completas todas las del día, ¡llega un huevo especial! 🌟</p>'+
    (!g.pin?'<div class="mt-tarjeta"><b>🔐 Falta el PIN familiar</b><p>Para que las misiones cuenten, un adulto debe crear un PIN de 4 números.</p><button type="button" class="ghost" id="lp-crear-pin">👪 Crear el PIN</button></div>':'');
  var el=pinta(top("🦸 Misiones de pequeños héroes")+'<div class="lp-mis-cab"><span>☄️</span><b>'+hechas+' de '+hab.length+' misiones de hoy</b></div>'+cuerpo,"misiones");
  if(!el)return;
  $("lp-volver").onclick=function(){pinPara?misiones():mapa();};
  if($("lp-crear-pin"))$("lp-crear-pin").onclick=function(){C.puerta(function(){ajustes();});};
  on(el,"[data-hab]",function(b){if(!g.pin){aviso(el,"Primero un adulto debe crear el PIN familiar."); return;} misiones(b.getAttribute("data-hab"));});
  if(pinPara){
    var pin="";
    function tecla(k){if(Date.now()<BLOQUEO){$("lp-pin-e").hidden=false; $("lp-pin-e").textContent="Espera un momento antes de volver a intentar."; return;}
      if(k==="↩")return misiones(); if(k==="⌫")pin=pin.slice(0,-1); else if(pin.length<4)pin+=k; C.SON.toca();
      Array.prototype.forEach.call($("lp-pts").children,function(x,i){x.classList.toggle("on",i<pin.length);});
      if(pin.length===4){if(L.pinOk(g,pin)){FALLOS=0; var r=L.validaHabito(g,pinPara); C.cambia(pf); if(r)cometa(r); else misiones();}
        else{FALLOS++; pin=""; if(FALLOS>=3){BLOQUEO=Date.now()+30000; FALLOS=0;} $("lp-pin-e").hidden=false; $("lp-pin-e").textContent="Ese no es el PIN. Pide ayuda a un adulto."; C.SON.otra();
          Array.prototype.forEach.call($("lp-pts").children,function(x){x.classList.remove("on");});}}}
    on(el,"[data-k]",function(b){tecla(b.getAttribute("data-k"));});
    C.teclado(function(k){if(/^[0-9]$/.test(k))tecla(k); else if(k==="Backspace")tecla("⌫"); else return; return true;});
  }
}
/* el cometa que cruza el cielo con el cofre */
function cometa(r){
  var el=pinta('<div class="lp-cometa-cielo"><span class="lp-cometa">☄️</span><div class="lp-cofre-z" id="lp-cofre"><span class="lp-cofre">🎁</span></div>'+
    '<div class="lp-ganas" id="lp-ganas" hidden><span>💎 +'+r.gemas+'</span><span>✨ +'+r.polvo+'</span>'+(r.huevo?'<span>🥚 ¡Huevo especial!</span>':'')+'</div>'+
    '<h3 id="lp-cometa-t">¡Un cometa trae tu premio!</h3><div class="actions"><button type="button" class="primary grande" id="lp-sigue">¡Gracias! →</button></div></div>',"cometa noche");
  if(!el)return;
  nota(880,0.3,0.04); luego(function(){nota(1175,0.3,0.04);},250);
  luego(function(){$("lp-cofre").classList.add("abre"); $("lp-ganas").hidden=false; C.SON.domina(); chispas($("lp-cofre"),18); $("lp-cometa-t").textContent=r.huevo?"¡Completaste todas las misiones de hoy!":"¡Misión cumplida, pequeño héroe!";},1300);
  decir(r.huevo?"¡Completaste todas las misiones de hoy! El cometa trae un huevo especial.":"¡Misión cumplida! El cometa trae gemas y polvo estelar.");
  $("lp-sigue").onclick=function(){misiones();};
}

/* ===================== los minijuegos ===================== */
function ronda(mod){
  var pf=C.actual(), g=lumi(pf), md=modo(pf,g);
  if(L.enNoche(g))return mapa();
  var nivel=L.nivelDe(g,mod,md), its=L.ronda(mod,nivel,C.semilla());
  S={mod:mod,its:its,i:0,primeras:[],nivel:nivel,md:md};
  muestra();
}
function para(){limpia(); S=null; C.callaVoz();}
/* una sola prueba (la del camino): usa la misma pantalla de juego y al terminar llama a fin(ok) */
function reto(mod,it,fin){var pf=C.actual(), g=lumi(pf); S={mod:mod,its:[it],i:0,primeras:[],nivel:0,md:modo(pf,g),fin:fin,titulo:"🌈 Prueba del camino"}; muestra();}
function puntos(){return '<span class="lp-prog">'+S.its.map(function(x,i){return '<i class="'+(i<S.i?(S.primeras[i]?'bien':'hecho'):i===S.i?'ahora':'')+'"></i>';}).join("")+'</span>';}
function opHTML(h){return h&&typeof h==="object"&&h.tarta?DW.tarta(h.tarta[0],h.tarta[1],82):h;}
var EXTRA=["🍄","💧","🍓","⭐","🌸","🫐"];
function muestra(){
  if(!S)return mapa();
  if(S.i>=S.its.length){if(S.fin){var fin=S.fin, ok=!!S.primeras[0]; S=null; return fin(ok);} return premio();}
  var pf=C.actual(), g=lumi(pf), m=L.mascota(g), M=L.MODULOS[S.mod], it=S.its[S.i], cuerpo="";
  S.fallos=0; S.listo=false; C.estado({lumi:true});
  var vis=it.vis?(typeof it.vis==="string"?it.vis:'<div class="lp-vis-tarta">'+opHTML(it.vis)+'</div>'):"";
  if(it.t==="op")cuerpo='<div class="lp-vis">'+vis+'</div><div class="lp-ops n'+it.ops.length+'">'+it.ops.map(function(o,k){return '<button type="button" class="lp-op" data-op="'+k+'">'+opHTML(o.h)+'</button>';}).join("")+'</div>';
  if(it.t==="contar"){var usados=it.ing.map(function(x){return x.e;}), extra=EXTRA.filter(function(e){return usados.indexOf(e)<0;}); S.ing=it.ing.map(function(x){return x.e;}).concat([extra[Math.floor(Math.random()*extra.length)]]).sort(function(){return Math.random()-0.5;});
    cuerpo='<div class="lp-caldero"><div class="lp-cal-in" id="lp-cal-in"></div><span class="lp-vapor">✨</span></div>'+
      '<div class="lp-ingr">'+S.ing.map(function(e){return '<button type="button" data-ing="'+e+'"><span>'+e+'</span></button>';}).join("")+'</div>'+
      '<div class="lp-ctrl"><button type="button" class="ghost" id="lp-quita">↩ Sacar uno</button><button type="button" class="ig-check" id="lp-listo">¡Listo! 🧪</button></div>';}
  if(it.t==="multi")cuerpo='<div class="lp-multi">'+it.celdas.map(function(c,k){return '<button type="button" data-c="'+k+'">'+c.h+'</button>';}).join("")+'</div><div class="lp-ctrl"><button type="button" class="ig-check" id="lp-listo">¡Listo! ✔</button></div>';
  if(it.t==="trazo")cuerpo='<div class="lp-trazo">'+trazoSVG(it.letra)+'</div>';
  var el=pinta('<div class="mt-top lp-top"><button type="button" class="ig-x" id="lp-salir" aria-label="Salir">✕</button><b>'+(S.titulo?esc(S.titulo):M.ico+' '+esc(M.nom))+'</b>'+puntos()+'</div>'+
    '<div class="lp-juego t-'+it.t+'"><div class="lp-pide"><span class="lp-pide-pet">'+petHTML(g,m,"feliz")+'</span><div class="lp-q"><b>'+esc(it.q)+'</b>'+
      '<button type="button" class="lp-son" id="lp-oir" aria-label="Escuchar">🔊</button>'+(it.en?'<button type="button" class="lp-son en" id="lp-en" aria-label="Escuchar en inglés">🇬🇧 '+esc(it.en)+'</button>':'')+'</div></div>'+cuerpo+'</div>',"juego m-"+S.mod);
  if(!el)return;
  vida(el.querySelector(".lp-pide-pet .lp-pet"),null,true);
  $("lp-salir").onclick=function(){var vuelve=S&&S.fin; para(); if(vuelve)camino(); else mapa();};
  $("lp-oir").onclick=function(){decir(it.q); if(it.en)luego(function(){hablaEn(it.en);},1600);};
  if($("lp-en"))$("lp-en").onclick=function(){hablaEn(it.en);};
  if(autoVoz(pf,g)){decir(it.q); if(it.en)luego(function(){hablaEn(it.en);},1900);} else if(it.en)luego(function(){hablaEn(it.en);},300);
  if(it.t==="op"){
    on(el,"[data-op]",function(b){if(S.listo||b.classList.contains("mal"))return; var k=+b.getAttribute("data-op"), o=it.ops[k];
      if(o.voz&&!it.en)decir(o.voz);
      responde(el,it,L.corrige(it,k),function(){b.classList.add("bien");},function(){b.classList.add("mal");},function(){var x=el.querySelector('[data-op="'+okIdx(it)+'"]'); if(x)x.classList.add("bien");});});
    C.teclado(function(k){var n=+k; if(n>=1&&n<=it.ops.length){el.querySelector('[data-op="'+(n-1)+'"]').click(); return true;}});
  }
  if(it.t==="contar"){
    var puestos=[];
    function pintaC(){var z=$("lp-cal-in"); z.innerHTML=puestos.map(function(e,i){return '<span style="--i:'+i+'">'+e+'</span>';}).join("");}
    on(el,"[data-ing]",function(b){if(S.listo||puestos.length>=24)return; puestos.push(b.getAttribute("data-ing")); nota(500+puestos.length*25,0.08,0.04); pintaC();});
    $("lp-quita").onclick=function(){if(S.listo)return; puestos.pop(); C.SON.toca(); pintaC();};
    $("lp-listo").onclick=function(){if(S.listo)return; var resp={}; puestos.forEach(function(e){resp[e]=(resp[e]||0)+1;});
      var sobra=Object.keys(resp).filter(function(e){return !it.ing.some(function(x){return x.e===e;});});
      var ok=L.corrige(it,resp)&&!sobra.length;
      var pista=it.ing.map(function(x){var n=resp[x.e]||0; return n===x.n?null:(n>x.n?"Sobran "+(n-x.n)+" "+x.e:"Faltan "+(x.n-n)+" "+x.e);}).filter(Boolean).concat(sobra.map(function(e){return "Saca "+e+": no va en esta poción";}));
      responde(el,it,ok,null,function(){puestos=[]; luego(pintaC,700);},null,pista.join(". ")+".");};
  }
  if(it.t==="multi"){
    var sel=[];
    on(el,"[data-c]",function(b){if(S.listo)return; var k=+b.getAttribute("data-c"), i=sel.indexOf(k); if(i>=0)sel.splice(i,1); else sel.push(k); b.classList.toggle("on",i<0); C.SON.toca();});
    $("lp-listo").onclick=function(){if(S.listo)return;
      responde(el,it,L.corrige(it,sel),function(){sel.forEach(function(k){el.querySelector('[data-c="'+k+'"]').classList.add("bien");});},
        function(){sel.forEach(function(k){if(!it.celdas[k].ok)el.querySelector('[data-c="'+k+'"]').classList.add("mal");});
          luego(function(){Array.prototype.forEach.call(el.querySelectorAll("[data-c]"),function(x){x.classList.remove("mal","on");}); sel=[];},900);},
        function(){it.celdas.forEach(function(c,k){if(c.ok)el.querySelector('[data-c="'+k+'"]').classList.add("bien");});});};
  }
  if(it.t==="trazo")trazo(el,it);
}
function okIdx(it){for(var i=0;i<it.ops.length;i++)if(it.ops[i].ok)return i; return -1;}
/* acierto: festejo y explicación. Error: otra oportunidad con cariño; a la segunda, se muestra la respuesta */
function responde(el,it,ok,marcaBien,marcaMal,muestraOk,pista){
  if(S.primeras[S.i]==null)S.primeras[S.i]=ok;
  var pet=el.querySelector(".lp-pide-pet");
  if(ok){S.listo=true; if(marcaBien)marcaBien(); C.SON.bien(); if(pet){pet.classList.add("salta"); accion1(pet.querySelector(".lp-pet"),"feliz");} chispas(el.querySelector(".lp-pide"),8); pie(el,true,it); return;}
  S.fallos++; C.SON.otra(); if(marcaMal)marcaMal();
  if(pet){pet.classList.remove("no"); void pet.offsetWidth; pet.classList.add("no");}
  if(S.fallos>=2&&it.t!=="contar"){S.listo=true; if(muestraOk)muestraOk(); pie(el,false,it); return;}
  if(S.fallos>=3){S.listo=true; pie(el,false,it); return;}
  var t=(pista?pista+" ":"")+pick(CASI); aviso(el,t); decir(t);
}
function pie(el,ok,it){
  var p=document.createElement("div"); p.className="ig-pie "+(ok?"bien":"mal"); p.id="ig-pie";
  var animo=pick(ANIMOS);
  p.innerHTML='<div class="ig-pie-in"><div class="ig-pie-txt"><b>'+(ok?esc(animo):'¡Así se hace!')+'</b><p>💡 '+esc(it.ex)+'</p></div><button type="button" class="ig-check" id="lp-sig">Continuar ▶</button></div>';
  el.appendChild(p);
  decir((ok?animo+" ":"")+it.ex);
  var b=$("lp-sig"); b.onclick=function(){S.i++; muestra();}; try{b.focus({preventScroll:true});}catch(x){}
  C.teclado(function(k){if(k==="Enter"||k===" "){b.click(); return true;}});
}

/* trazar una letra uniendo estrellas en orden (dedo o ratón) */
function trazoSVG(letra){
  var T=L.TRAZOS[letra]||L.TRAZOS.A, s='';
  T.forEach(function(tr){s+='<polyline points="'+tr.map(function(p){return p.join(",");}).join(" ")+'" class="lp-guia"/>';});
  s+='<g id="lp-hechas"></g>';
  var n=0; T.forEach(function(tr,ti){tr.forEach(function(p,pi){s+='<g class="lp-estrella" data-p="'+n+'" transform="translate('+p[0]+' '+p[1]+')"><circle r="7.5"/><path d="M0 -5 L1.5 -1.5 5 -1.5 2.2 1 3.2 4.6 0 2.4 -3.2 4.6 -2.2 1 -5 -1.5 -1.5 -1.5Z"/></g>'; n++;});});
  return '<svg viewBox="-8 -8 116 136" id="lp-tz" role="img" aria-label="Letra '+letra+' para trazar">'+s+'</svg>';
}
function trazo(el,it){
  var T=L.TRAZOS[it.letra]||L.TRAZOS.A, pts=[]; T.forEach(function(tr,ti){tr.forEach(function(p,pi){pts.push({x:p[0],y:p[1],nuevo:pi===0});});});
  var sv=$("lp-tz"), sig=0, abajo=false, hechas=$("lp-hechas");
  function marca(){Array.prototype.forEach.call(sv.querySelectorAll(".lp-estrella"),function(g,i){g.setAttribute("class","lp-estrella"+(i<sig?" on":i===sig?" sig":""));});}
  function aSvg(ev){var r=sv.getBoundingClientRect(); return {x:-8+(ev.clientX-r.left)/r.width*116,y:-8+(ev.clientY-r.top)/r.height*136};}
  function prueba(ev){if(S.listo||sig>=pts.length)return; var q=aSvg(ev), p=pts[sig];
    if(Math.abs(q.x-p.x)<13&&Math.abs(q.y-p.y)<13){
      if(!p.nuevo){var a=pts[sig-1]; var ln=document.createElementNS("http://www.w3.org/2000/svg","line"); ln.setAttribute("x1",a.x); ln.setAttribute("y1",a.y); ln.setAttribute("x2",p.x); ln.setAttribute("y2",p.y); ln.setAttribute("class","lp-linea"); hechas.appendChild(ln);}
      sig++; nota(440+sig*40,0.1,0.04); marca();
      if(sig>=pts.length){abajo=false; luego(function(){responde(el,it,true);},250);}}}
  sv.addEventListener("pointerdown",function(ev){ev.preventDefault(); abajo=true; try{sv.setPointerCapture(ev.pointerId);}catch(x){} prueba(ev);});
  sv.addEventListener("pointermove",function(ev){if(abajo)prueba(ev);});
  ["pointerup","pointercancel"].forEach(function(t){sv.addEventListener(t,function(){abajo=false;});});
  marca();
}

/* al terminar la ronda: los premios, el vínculo y quizá un huevo */
function premio(){
  var pf=C.actual(), g=lumi(pf), m=L.mascota(g), mod=S.mod, M=L.MODULOS[mod], antes=S.nivel, primeras=S.its.map(function(x,i){return !!S.primeras[i];});
  var r=L.terminaRonda(g,mod,S.its,primeras,S.md); C.cambia(pf); S=null;
  var est=''; for(var k=0;k<3;k++)est+='<i class="'+(k<r.ok?'on':'')+'" style="--d:'+(0.2+k*0.25)+'s">★</i>';
  var usa=mod==="cocina"&&g.barras.pan<95?["comer","🧁 Darle la merienda"]:mod==="arbol"&&g.barras.bri<90?["bano","🛁 Darle un baño"]:mod==="jardin"?["vestir","🎀 Vestir a "+m.nom]:null;
  var el=pinta('<div class="lp-premio"><div class="lp-escena-mini" id="lp-fiesta">'+petHTML(g,m,"wow","celebra")+'</div><h3>'+(r.ok===3?'¡Perfecto!':r.ok?'¡Ronda completa!':'¡Buen intento!')+'</h3>'+
    '<div class="ig-estrellas">'+est+'</div><div class="lp-ganas"><span>'+M.premioIco+' +'+r.cant+'</span><span>✨ +'+r.polvo+'</span></div>'+barraV(g)+
    (r.huevos?'<p class="ig-trofeo">🥚 ¡El Vínculo Mágico se llenó! Llegó un huevo sorpresa.</p>':'')+
    (r.nivel>antes?'<p class="ig-trofeo meta">⬆️ ¡Subiste al nivel '+r.nivel+' de '+esc(M.nom)+'!</p>':'')+
    '<div class="actions">'+(r.huevos?'<button type="button" class="primary grande" data-ir="huevos">🥚 Ver el huevo</button>':usa?'<button type="button" class="primary grande" data-ir="'+usa[0]+'">'+esc(usa[1])+'</button>':'')+
      '<button type="button" class="ghost" id="lp-otra">🔁 Otra ronda</button><button type="button" class="ghost" data-ir="casa">🏠 Volver a casa</button></div></div>',"premio");
  if(!el)return;
  C.SON.sube(); chispas($("lp-fiesta"),18); accion1(el.querySelector("#lp-fiesta .lp-pet"),"feliz"); vida(el.querySelector("#lp-fiesta .lp-pet"),$("lp-fiesta"),true);
  decir((r.ok===3?"¡Perfecto! ":"¡Muy bien! ")+"Ganaste "+r.cant+" "+M.premioNom+".");
  $("lp-otra").onclick=function(){ronda(mod);};
  on(el,"[data-ir]",function(b){var k=b.getAttribute("data-ir"); if(k==="casa")return mapa(); accion(k);});
}

/* ===================== modo noche ===================== */
function nocheVista(pf,g){
  var m=L.mascota(g);
  var el=pinta(C.cabeza(pf,"lumina",'🌙 Modo noche','')+'<div class="lp-noche-v"><div class="lp-cielo-n grande"><span class="lp-luna">🌙</span><span class="lp-zz">Z z z</span>'+petHTML(g,m,"duerme","dormida")+'<div class="lp-nubes"></div></div>'+
    '<h3>Buenas noches 💤</h3><p class="lp-txt">'+esc(m.nom)+' y sus amigos ya duermen en el Gran Árbol. ¡Tú también a descansar! Mañana seguimos aprendiendo.</p>'+
    '<div class="actions"><button type="button" class="ghost" id="lp-cuna">🎵 Canción de cuna</button></div><p class="fine">Las criaturas despiertan a las '+esc(g.noche.hasta)+'. Un adulto puede cambiar el horario en 👪.</p></div>',"noche");
  if(!el)return;
  C.activaCabeza(el);
  $("lp-cuna").onclick=function(){cancionDeCuna();};
}

/* ===================== para la familia ===================== */
function ajustes(){
  var pf=C.actual(); if(!pf)return C.portada();
  var g=lumi(pf), st=g.stats, temas={mate:"🔢 Matemática",logica:"🧩 Lógica",lectura:"🔤 Lectura y escritura",ciencia:"🔬 Ciencias",ingles:"🇬🇧 Inglés"};
  var sem=0, d=new Date(); for(var i=0;i<7;i++){var k=L.hoy(d); if(g.dias[k])sem++; d.setDate(d.getDate()-1);}
  var mis7=0, d2=new Date(); for(var j=0;j<7;j++){var h=g.hechos[L.hoy(d2)]; if(h)Object.keys(h).forEach(function(x){if(x!=="_huevo")mis7+=h[x];}); d2.setDate(d2.getDate()-1);}
  var el=pinta(top("👪 LuminaPets · Para la familia")+'<div class="mt-adultos lp-ajustes">'+
    '<div class="mt-kpis"><div><b>'+(st.cocina.r+st.arbol.r+st.jardin.r)+'</b><small>rondas</small></div><div><b>'+sem+'/7</b><small>días esta semana</small></div><div><b>'+g.mascotas.length+'/'+L.CRIATURAS.length+'</b><small>criaturas</small></div><div><b>'+mis7+'</b><small>misiones (7 días)</small></div></div>'+
    '<h4>📈 Lo que está aprendiendo</h4><div class="mt-avance">'+Object.keys(temas).map(function(k){var t=st.temas[k]||{ok:0,n:0};
      return '<div><span>'+temas[k]+'</span><i style="--p:'+(t.n?Math.round(100*t.ok/t.n):0)+'%"></i><small>'+(t.n?Math.round(100*t.ok/t.n)+' % de '+t.n:'aún nada')+'</small></div>';}).join("")+'</div>'+
    '<div class="mt-lista">'+["cocina","arbol","jardin"].map(function(k){return '<span>'+L.MODULOS[k].ico+' '+esc(L.MODULOS[k].nom)+' <small>nivel '+L.nivelDe(g,k,modo(pf,g))+' · '+st[k].r+' rondas</small></span>';}).join("")+'</div>'+
    '<h4>🧠 Modo de aprendizaje</h4><div class="mt-etapas">'+[["","Automático (según el curso)"],["pre","Preescolar 4–6"],["pri","Primaria inicial 7–9"]].map(function(x){
      return '<button type="button" data-modo="'+x[0]+'" class="'+((g.modo||"")===x[0]?"on":"")+'">'+esc(x[1])+'</button>';}).join("")+'</div>'+
    '<p class="fine">Ahora: <b>'+(modo(pf,g)==="pri"?'Primaria inicial':'Preescolar')+'</b>. Dentro de cada modo la dificultad se ajusta sola: sube con tres aciertos y baja si cuesta.</p>'+
    '<h4>🦸 Misiones de la vida real</h4><div class="lp-hab-lista">'+g.habitos.map(function(h,i){
      return '<label class="lp-hab"><input type="checkbox" data-hon="'+i+'"'+(h.on?' checked':'')+'><span>'+esc(h.ico)+'</span><b>'+esc(h.nom)+'</b>'+(h.veces>1?'<small>'+h.veces+' veces al día</small>':'')+
        (/^c/.test(h.id)?'<button type="button" class="ghost bad" data-hdel="'+i+'" aria-label="Quitar">🗑️</button>':'')+'</label>';}).join("")+'</div>'+
    (g.habitos.length<12?'<div class="lp-hab-nueva"><select id="lp-hico" aria-label="Dibujo">'+EMOJIS_MISION.map(function(e){return '<option>'+e+'</option>';}).join("")+'</select><input id="lp-hnom" maxlength="40" placeholder="Otra misión, p. ej.: Guardar la ropa"><button type="button" class="ghost" id="lp-hadd">＋ Agregar</button></div>':'')+
    '<h4>🔐 PIN familiar</h4><p class="fine">'+(g.pin?'El PIN ya está creado. Puedes cambiarlo aquí.':'Crea un PIN de 4 números para confirmar las misiones. No se lo digas a la niña o al niño.')+'</p>'+
    '<div class="lp-hab-nueva"><input id="lp-pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="4 números" aria-label="PIN"><button type="button" class="ghost" id="lp-pin-ok">'+(g.pin?'Cambiar PIN':'Crear PIN')+'</button></div><p class="msg" id="lp-pin-m" hidden></p>'+
    '<h4>🌙 Modo noche</h4><label class="lp-hab"><input type="checkbox" id="lp-n-on"'+(g.noche.on?' checked':'')+'><b>Las criaturas se van a dormir y los juegos se pausan</b></label>'+
    '<div class="lp-horas"><label>Desde <input type="time" id="lp-n-d" value="'+esc(g.noche.desde)+'"></label><label>Hasta <input type="time" id="lp-n-h" value="'+esc(g.noche.hasta)+'"></label></div>'+
    '<h4>🛡️ Privacidad y diseño ético</h4><ul class="mt-tips"><li>No pedimos nombre completo, correo, ubicación, cámara ni micrófono de la niña o el niño: solo un apodo.</li><li>Sin anuncios, sin compras dentro del juego y sin cajas de premios pagadas: todo se gana aprendiendo, cuidando y cumpliendo misiones.</li>'+
      '<li>Las mascotas nunca enferman ni mueren: si pasan días sin jugar, solo duermen en un capullo y despiertan con un abrazo.</li><li>Los ajustes están detrás de una cuenta escrita en palabras, para adultos.</li></ul>'+
    '<h4>🌱 Cómo acompañar</h4><ul class="mt-tips"><li>Jueguen juntos los primeros días y pregunten «¿qué le preparaste a '+esc(L.mascota(g).nom)+'?».</li><li>Confirmen las misiones solo cuando estén hechas: así el juego refuerza hábitos reales.</li><li>Sesiones cortas: una o dos rondas por módulo bastan.</li></ul>'+
    '</div>',"ajustes");
  if(!el)return;
  $("lp-volver").onclick=function(){mapa();};
  on(el,"[data-modo]",function(b){g.modo=b.getAttribute("data-modo")||null; C.cambia(pf); ajustes();});
  Array.prototype.forEach.call(el.querySelectorAll("[data-hon]"),function(x){x.onchange=function(){g.habitos[+x.getAttribute("data-hon")].on=x.checked; C.cambia(pf);};});
  on(el,"[data-hdel]",function(b){g.habitos.splice(+b.getAttribute("data-hdel"),1); C.cambia(pf); ajustes();});
  if($("lp-hadd"))$("lp-hadd").onclick=function(){var n=$("lp-hnom").value.replace(/\s+/g," ").trim().slice(0,40); if(!n){$("lp-hnom").focus(); return;}
    g.habitos.push({id:"c"+Date.now().toString(36),nom:n,ico:$("lp-hico").value,on:true,veces:1}); C.cambia(pf); ajustes();};
  $("lp-pin-ok").onclick=function(){var v=$("lp-pin").value, mm=$("lp-pin-m"); mm.hidden=false;
    if(!/^\d{4}$/.test(v)){mm.className="msg bad"; mm.textContent="El PIN debe tener 4 números."; return;}
    g.pin=L.hashPin(v); C.cambia(pf); $("lp-pin").value=""; mm.className="msg good"; mm.textContent="✔ PIN guardado.";};
  $("lp-n-on").onchange=function(){g.noche.on=this.checked; C.cambia(pf);};
  $("lp-n-d").onchange=function(){if(/^\d{2}:\d{2}$/.test(this.value)){g.noche.desde=this.value; C.cambia(pf);}};
  $("lp-n-h").onchange=function(){if(/^\d{2}:\d{2}$/.test(this.value)){g.noche.hasta=this.value; C.cambia(pf);}};
}
/* un resumen para el panel de adultos común */
function resumen(pf){
  if(!pf.lumi)return '';
  var g=lumi(pf), st=g.stats, r=st.cocina.r+st.arbol.r+st.jardin.r, n=st.cocina.n+st.arbol.n+st.jardin.n, ok=st.cocina.ok+st.arbol.ok+st.jardin.ok;
  return '<h4>🐾 LuminaPets</h4><div class="mt-kpis"><div><b>'+r+'</b><small>rondas</small></div><div><b>'+(n?Math.round(100*ok/n):0)+' %</b><small>aciertos</small></div><div><b>'+g.mascotas.length+'/'+L.CRIATURAS.length+'</b><small>criaturas</small></div><div><b>'+L.habitosHoy(g).filter(function(x){return x.n>=x.max;}).length+'</b><small>misiones hoy</small></div></div>'+
    '<div class="actions"><button type="button" class="ghost" id="lp-ajustes">⚙️ Misiones, PIN y modo noche de LuminaPets</button></div>';
}

window.AxLuminaUI={mapa:mapa,para:para,ajustes:ajustes,resumen:resumen,ronda:ronda,_estado:function(){return S;}};
})();
