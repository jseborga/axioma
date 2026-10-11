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
function pinta(html,cls){limpia(); return C.pinta(html,"lp "+(cls||""));}
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
  var linea='🐾 '+g.mascotas.length+'/'+L.CRIATURAS.length+' criaturas · '+(md==="pri"?'🌟 Primaria':'🌱 Preescolar');
  var html=C.cabeza(pf,"lumina",linea,'')+
    '<div class="lp-casa">'+inventario(g)+
    '<div class="lp-globo" id="lp-globo"><b>'+esc(m.nom)+'</b> '+esc(dice)+'<button type="button" class="lp-son" data-voz="'+esc(dice)+'" aria-label="Escuchar">🔊</button></div>'+
    '<div class="lp-escena'+(c.foto?' con-foto':'')+(g.capullo?' capullo':'')+'" id="lp-escena">'+(c.fondo?'<img class="lp-fondo-foto" src="'+c.fondo+'" alt="" draggable="false">':c.foto?'':DW.habitacion())+
      '<button type="button" class="lp-pet-btn" id="lp-pet" aria-label="Hacer un mimo a '+esc(m.nom)+'">'+petHTML(g,m,g.capullo?"duerme":"feliz")+'</button>'+
      (g.capullo?'<div class="lp-capullo" aria-hidden="true"><span>💤</span></div>':'')+'</div>'+
    (g.capullo?'<button type="button" class="lp-abrazo" id="lp-abrazo">🤗 Darle un abrazo</button>':
      '<div class="lp-barras">'+BARRAS.map(function(b){var v=Math.round(g.barras[b[0]]); return '<div class="lp-barra'+(v<35?' baja':'')+'"><span>'+b[1]+'</span><i style="--p:'+v+'%"></i><small>'+esc(b[2])+'</small></div>';}).join("")+'</div>'+barraV(g)+
      '<div class="lp-dock">'+[["comer","🧁","Comer",g.inv.bocadillo],["bano","🛁","Baño",g.inv.espuma],["dormir","☁️","Dormir",""],["vestir","🎀","Vestir",""],
        ["huevos","🥚","Huevos",g.huevos.length||""],["aldea","🌳","Aldea",g.mascotas.length],["misiones","🦸","Misiones",pend||""]].map(function(x){
        return '<button type="button" data-acc="'+x[0]+'" class="'+(marca===x[0]?'pide':'')+'"><span>'+x[1]+'</span>'+x[2]+(x[3]!==""?'<i>'+x[3]+'</i>':'')+'</button>';}).join("")+'</div>'+
      '<h4 class="lp-h">✨ Aprende y consigue cosas para '+esc(m.nom)+'</h4><div class="lp-modulos">'+["cocina","arbol","jardin"].map(function(k){var M=L.MODULOS[k];
        return '<button type="button" class="lp-mod m-'+k+(modPide===k?' pide':'')+'" data-mod="'+k+'">'+(modPide===k?'<em>¡'+esc(m.nom)+' lo necesita!</em>':'')+'<span class="lp-mod-ico">'+M.ico+'</span><b>'+esc(M.nom)+'</b><small>'+esc(M.desc)+'</small>'+
          '<span class="lp-mod-pie"><i>Nivel '+L.nivelDe(g,k,md)+'</i><i>Ganas '+M.premioIco+'</i></span></button>';}).join("")+'</div>')+
    '<p class="fine lp-pie-nota">Sin anuncios ni compras: todo se consigue aprendiendo y cuidando. <a href="#" id="lp-familia">👪 Para la familia</a></p></div>';
  var el=pinta(html,"casa"); if(!el)return;
  C.activaCabeza(el);
  on(el,"[data-voz]",function(b){decir(b.getAttribute("data-voz"));});
  on(el,"[data-mod]",function(b){ronda(b.getAttribute("data-mod"));});
  on(el,"[data-acc]",function(b){accion(b.getAttribute("data-acc"));});
  $("lp-familia").onclick=function(e){e.preventDefault(); C.puerta(function(){ajustes();});};
  if(g.capullo){$("lp-abrazo").onclick=function(){abrazo(pf,g,m);}; $("lp-pet").onclick=function(){abrazo(pf,g,m);};}
  else{$("lp-pet").addEventListener("pointerdown",function(ev){mimo(pf,g,m,ev);}); vida($("lp-pet").querySelector(".lp-pet"),$("lp-escena"));}
  if(autoVoz(pf,g))decir(m.nom+" dice: "+dice);
}
/* el capullo de siesta: un abrazo y despierta bostezando, sin culpa */
function abrazo(pf,g,m){
  L.despierta(g); C.cambia(pf); C.SON.sube();
  var e=$("lp-escena"); if(e){e.classList.remove("capullo"); e.classList.add("despierta"); chispas(e,16,"💖");}
  AVISO="*Bosteza* ¡Gracias por el abrazo! Ya desperté. ¡Te extrañaba!";
  luego(mapa,1300);
}
function mimo(pf,g,m,ev){
  var ahora=Date.now(); if(mimo.t&&ahora-mimo.t<350)return; mimo.t=ahora;
  var r=L.mimo(g); guardaLuego(pf); nota(880,0.12,0.03);
  var e=$("lp-escena"), p=$("lp-pet"); if(!e)return;
  var rc=e.getBoundingClientRect(), h=document.createElement("span"); h.className="lp-corazon"; h.textContent=pick(["💖","💕","💗","✨"]);
  h.style.left=(ev.clientX-rc.left)+"px"; h.style.top=(ev.clientY-rc.top)+"px"; e.appendChild(h); setTimeout(function(){if(h.parentNode)h.parentNode.removeChild(h);},1000);
  accion1(p.querySelector(".lp-pet"),p.querySelector(".lp-pet.dib,.recortada")?(Math.random()<0.5?"salta":"feliz"):"feliz");
  var v=document.querySelector(".lp-vinculo"); if(v){v.querySelector("i").style.setProperty("--p",Math.round(g.vinculo)+"%"); v.querySelector("b").textContent=Math.round(g.vinculo)+"%";}
  if(r.huevos){AVISO="¡Llegó un huevo sorpresa! 🥚 Búscalo en Huevos."; luego(mapa,500);}
}

/* la mascota está viva: respira, parpadea y mueve la cola (CSS); de a ratos mira a un lado,
   mueve las orejas, menea la cola, salta, baila o pasea por la habitación; y sigue el dedo
   (o el ratón) con la mirada */
var DURA={mira:2300,mira2:2300,orejas:1200,cola:1600,feliz:800,salta:750,baila:1700};
function accion1(pet,a){if(!pet)return; pet.classList.remove("a-"+a); void pet.offsetWidth; pet.classList.add("a-"+a); setTimeout(function(){pet.classList.remove("a-"+a);},DURA[a]||1500);}
function vida(pet,escena,quieta){
  if(!pet)return;
  var foto=pet.classList.contains("foto"), recortada=!!pet.querySelector(".recortada"), lista=foto&&!recortada?["mira","mira2","cola","feliz","cola"]:quieta?["mira","mira2","orejas","cola","salta","feliz"]:["mira","mira2","orejas","cola","salta","baila","pasea","pasea","feliz"];
  if(foto&&!quieta&&recortada)lista=["mira","mira2","cola","salta","baila","pasea","pasea","feliz"];
  if(foto&&quieta)lista=["mira","mira2","cola","feliz"].concat(recortada?["salta"]:[]);
  /* hasta dónde puede caminar (en % de la escena): la dibujada mide 58 %, Lila 90 % */
  var rango=foto?[-12,5,22]:[2,21,40];
  function haz(){if(!pet.isConnected)return; var a=lista[Math.floor(Math.random()*lista.length)]; if(a==="pasea")pasea(); else accion1(pet,a); luego(haz,2400+Math.random()*3000);}
  function pasea(){var ahora=pet.style.left?parseFloat(pet.style.left):rango[1], nuevo=Math.max(rango[0],Math.min(rango[2],ahora+(Math.random()<0.5?-1:1)*(10+Math.random()*16)));
    if(Math.abs(nuevo-ahora)<4)return accion1(pet,"salta");
    pet.classList.toggle("izq",nuevo<ahora); pet.classList.add("camina"); pet.style.left=nuevo.toFixed(1)+"%";
    setTimeout(function(){pet.classList.remove("camina","izq");},1850);}
  luego(haz,1200+Math.random()*1500);
  if(!escena)return;
  escena.addEventListener("pointermove",function(ev){var r=pet.getBoundingClientRect(); if(!r.width)return;
    var dx=Math.max(-1,Math.min(1,(ev.clientX-(r.left+r.width/2))/(r.width/2))), dy=Math.max(-1,Math.min(1,(ev.clientY-(r.top+r.height*0.45))/(r.height/2)));
    if(pet.classList.contains("izq"))dx=-dx;
    pet.style.setProperty("--mx",(dx*(foto?3:7)).toFixed(1)+"deg"); pet.style.setProperty("--px",(dx*3.5).toFixed(1)+"px"); pet.style.setProperty("--py",(dy*3).toFixed(1)+"px");});
  escena.addEventListener("pointerleave",function(){["--mx","--px","--py"].forEach(function(k){pet.style.removeProperty(k);});});
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
function puntos(){return '<span class="lp-prog">'+S.its.map(function(x,i){return '<i class="'+(i<S.i?(S.primeras[i]?'bien':'hecho'):i===S.i?'ahora':'')+'"></i>';}).join("")+'</span>';}
function opHTML(h){return h&&typeof h==="object"&&h.tarta?DW.tarta(h.tarta[0],h.tarta[1],82):h;}
var EXTRA=["🍄","💧","🍓","⭐","🌸","🫐"];
function muestra(){
  if(!S)return mapa();
  if(S.i>=S.its.length)return premio();
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
  var el=pinta('<div class="mt-top lp-top"><button type="button" class="ig-x" id="lp-salir" aria-label="Salir">✕</button><b>'+M.ico+' '+esc(M.nom)+'</b>'+puntos()+'</div>'+
    '<div class="lp-juego t-'+it.t+'"><div class="lp-pide"><span class="lp-pide-pet">'+petHTML(g,m,"feliz")+'</span><div class="lp-q"><b>'+esc(it.q)+'</b>'+
      '<button type="button" class="lp-son" id="lp-oir" aria-label="Escuchar">🔊</button>'+(it.en?'<button type="button" class="lp-son en" id="lp-en" aria-label="Escuchar en inglés">🇬🇧 '+esc(it.en)+'</button>':'')+'</div></div>'+cuerpo+'</div>',"juego m-"+S.mod);
  if(!el)return;
  vida(el.querySelector(".lp-pide-pet .lp-pet"),null,true);
  $("lp-salir").onclick=function(){para(); mapa();};
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
