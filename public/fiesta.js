/* ===========================================================
   THE FINAL TEST · juegos en grupo con un solo teléfono
   Para jugar en persona pasándose el teléfono (o con un proyector):
   La gran prueba, Frente, Tabú, El impostor, Pasa la bomba y Basta.
   Todo ocurre en este dispositivo: no hace falta cuenta ni conexión
   una vez cargada la app. El contenido está en public/fiesta/*.js.
   =========================================================== */
(function(){
"use strict";
var panel=document.getElementById("rapido-panel"); if(!panel)return;
function D(){return window.AxFiestaDatos||{};}
function $(id){return document.getElementById(id);}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function pinta(h){panel.innerHTML=h;panel.scrollIntoView({block:"start",behavior:"smooth"});}
function baraja(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function uno(a){return a[Math.floor(Math.random()*a.length)];}
function guarda(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem("axf_"+k)||"null");localStorage.setItem("axf_"+k,JSON.stringify(v));}catch(e){return null;}}

var JUEGOS={
  prueba:  {nom:"La gran prueba",icono:"🎲",gente:"2 a 6 equipos",desc:"Por equipos. En cada turno sale una tarjeta distinta: pregunta, mímica, describir sin decir, dibujar o un reto. Gana el primero en llegar a la meta."},
  frente:  {nom:"Frente",icono:"🤳",gente:"3 o más",desc:"Ponte el teléfono en la frente sin mirar: tu grupo te da pistas y tú adivinas todas las palabras que puedas antes de que acabe el tiempo."},
  tabu:    {nom:"Tabú",icono:"🤐",gente:"4 o más, por equipos",desc:"Describe la palabra a tu equipo sin decir ninguna de las prohibidas. Contra el reloj."},
  impostor:{nom:"El impostor",icono:"🕵️",gente:"3 a 12",desc:"El teléfono pasa de mano en mano: todos ven la palabra secreta menos uno. Hablad y descubrid quién es el impostor."},
  bomba:   {nom:"Pasa la bomba",icono:"💣",gente:"3 o más",desc:"Sale un tema: di una palabra que encaje y pasa el teléfono. A quien le explote en las manos, pierde."},
  basta:   {nom:"Basta",icono:"✍️",gente:"2 o más, con papel",desc:"Letra al azar y categorías. Escribe una palabra por categoría que empiece por esa letra y grita «¡Basta!» antes que nadie."}
};

/* ---------- utilidades de juego ---------- */
var timers=[], intervalo=null, bloqueo=null, volver=null;
function espera(ms,f){var t=setTimeout(f,ms);timers.push(t);return t;}
function para(){
  timers.forEach(clearTimeout); timers=[]; if(intervalo){clearInterval(intervalo);intervalo=null;}
  if(bloqueo){try{bloqueo.release();}catch(e){} bloqueo=null;}
}
/* que la pantalla no se apague mientras se juega */
function despierta(){ if(bloqueo||!navigator.wakeLock)return; navigator.wakeLock.request("screen").then(function(l){bloqueo=l;}).catch(function(){}); }
/* sonido y vibración (el audio se crea con el primer toque, como exigen los navegadores) */
var audio=null;
function pita(f,ms,vol){
  try{ if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();
    var o=audio.createOscillator(), g=audio.createGain(); o.frequency.value=f||660; o.type="sine";
    g.gain.value=vol||0.12; o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime+(ms||120)/1000);
  }catch(e){}
}
function vibra(p){try{if(navigator.vibrate)navigator.vibrate(p);}catch(e){}}
/* cuenta atrás visible: pinta en #fs-reloj y #fs-barra; al terminar llama a fin() */
function reloj(seg,fin,cadaSeg){
  if(intervalo)clearInterval(intervalo);
  var hasta=Date.now()+seg*1000, ultimo=-1;
  function paso(){
    var q=Math.max(0,hasta-Date.now()), s=Math.ceil(q/1000);
    var r=$("fs-reloj"), b=$("fs-barra");
    if(r)r.textContent=s>=60?Math.floor(s/60)+":"+("0"+s%60).slice(-2):String(s);
    if(b)b.style.transform="scaleX("+(q/(seg*1000))+")";
    if(s!==ultimo){ultimo=s; if(s<=5&&s>0)pita(880,80); if(cadaSeg)cadaSeg(s);}
    if(q<=0){clearInterval(intervalo);intervalo=null;pita(330,500,0.2);vibra([200,80,200]);fin();}
  }
  paso(); intervalo=setInterval(paso,200);
  return function(){if(intervalo){clearInterval(intervalo);intervalo=null;}};
}
function relojHtml(){return '<div class="fs-tiempo"><span id="fs-reloj"></span><div class="rp-bar"><i id="fs-barra"></i></div></div>';}
/* mazo sin repetir: se baraja y, al agotarse, se vuelve a barajar */
function mazo(lista){var m=[],i=0;return {saca:function(){if(i>=m.length){m=baraja(lista.slice());i=0;}return m[i++];},n:lista.length};}
function palabras(tipo,cats){
  var P=D().palabras||{}, out=[];
  Object.keys(P).forEach(function(k){var c=P[k]; if(tipo&&!c[tipo])return; if(cats&&cats.length&&cats.indexOf(k)<0)return;
    c.lista.forEach(function(w){out.push({w:w,cat:c.nombre});});});
  return out;
}
function cabecera(j,extra){var g=JUEGOS[j];
  return '<button type="button" class="rt-back" id="fs-back">‹ Juegos rápidos</button><div class="rt-head"><h3>'+g.icono+' '+g.nom+'</h3>'+(extra||'')+'</div>';}
function ligaVolver(){var b=$("fs-back"); if(b)b.onclick=function(){if(confirm("¿Salir del juego?")){para();if(volver)volver();}};}
function sinDatos(){pinta('<p class="fine bad">No se pudo cargar el contenido del juego. Recarga la página.</p>');}

/* ---------- equipos y jugadores ---------- */
var COLORES=["Rojo","Azul","Verde","Amarillo","Morado","Naranja"];
function formNombres(tipo,min,max,def){
  var guardados=guarda(tipo)||[], n=Math.max(min,Math.min(max,guardados.length||def)), h='<div class="fs-nombres" id="fs-nombres" data-min="'+min+'" data-max="'+max+'">';
  for(var i=0;i<n;i++)h+=filaNombre(tipo,i,guardados[i]);
  return h+'</div><div class="actions fs-mas"><button type="button" class="ghost au-mini" id="fs-mas">+ Añadir</button><button type="button" class="ghost au-mini" id="fs-menos">− Quitar</button></div>';
}
function filaNombre(tipo,i,v){
  var ph=tipo==="equipos"?"Equipo "+COLORES[i%6]:"Jugador "+(i+1);
  return '<input class="fs-nom" maxlength="20" placeholder="'+ph+'" value="'+esc(v||"")+'">';
}
function ligaNombres(tipo){
  var c=$("fs-nombres"), min=+c.getAttribute("data-min"), max=+c.getAttribute("data-max");
  $("fs-mas").onclick=function(){var n=c.querySelectorAll("input").length; if(n<max)c.insertAdjacentHTML("beforeend",filaNombre(tipo,n,""));};
  $("fs-menos").onclick=function(){var l=c.querySelectorAll("input"); if(l.length>min)l[l.length-1].remove();};
}
function leeNombres(tipo){
  var l=Array.prototype.map.call($("fs-nombres").querySelectorAll("input"),function(x,i){return x.value.trim()||x.placeholder;});
  guarda(tipo,Array.prototype.map.call($("fs-nombres").querySelectorAll("input"),function(x){return x.value.trim();}));
  return l;
}
function sel(nombre,ops,def){return '<select id="'+nombre+'">'+ops.map(function(o){return '<option value="'+o[0]+'"'+(String(o[0])===String(def)?' selected':'')+'>'+o[1]+'</option>';}).join("")+'</select>';}
function marcador(nombres,puntos,turno,meta){
  return '<div class="fs-marcador">'+nombres.map(function(n,i){return '<div class="'+(i===turno?'turno':'')+'"><span>'+esc(n)+'</span><b>'+puntos[i]+'</b>'+
    (meta?'<i style="width:'+Math.min(100,puntos[i]/meta*100)+'%"></i>':'')+'</div>';}).join("")+'</div>';
}
function podio(nombres,puntos,unidad){
  var o=nombres.map(function(n,i){return {n:n,p:puntos[i]};}).sort(function(a,b){return b.p-a.p;});
  return '<ol class="rt-rank fs-podio">'+o.map(function(x,i){return '<li><span class="pos">'+(i+1)+'</span><span class="who">'+esc(x.n)+'</span><span class="pts"><b>'+x.p+'</b><small>'+(unidad||"puntos")+'</small></span></li>';}).join("")+'</ol>';
}

/* ---------- entrada ---------- */
function tarjetas(){
  return '<h4>En grupo · un solo teléfono</h4><p class="fine">Para jugar en persona pasándoos el teléfono (o en la pantalla grande). No hace falta cuenta ni conexión.</p>'+
    Object.keys(JUEGOS).map(function(k){var j=JUEGOS[k];
      return '<button type="button" class="rt-card rp-card fs-card" data-fiesta="'+k+'"><span class="rt-card-top"><b>'+j.icono+' '+esc(j.nom)+'</b><span class="chip">'+esc(j.gente)+'</span></span>'+
        '<small>'+esc(j.desc)+'</small></button>';}).join("");
}
function abre(j,alVolver){
  para(); volver=alVolver||volver; if(!D().palabras){sinDatos();return;}
  ({prueba:prueba,frente:frente,tabu:tabu,impostor:impostor,bomba:bomba,basta:basta})[j]();
}

/* ======================= LA GRAN PRUEBA ======================= */
var TIPOS={pregunta:{n:"Pregunta",i:"❓",p:1},mimica:{n:"Mímica",i:"🎭",p:2},describe:{n:"Describe sin decir",i:"🤐",p:2},dibuja:{n:"Dibuja",i:"✏️",p:2},reto:{n:"Reto",i:"⚡",p:1}};
function prueba(){
  pinta(cabecera("prueba")+
    '<p class="fine">Cada equipo, en su turno, saca una tarjeta. Las preguntas y los retos valen 1 punto; mímica, describir y dibujar, 2. Quien lee o controla el teléfono decide si vale.</p>'+
    '<form class="rt-form" id="fs-f"><label>Equipos</label>'+formNombres("equipos",2,6,2)+
    '<div class="rt-2"><label>Meta'+sel("fs-meta",[[8,"8 puntos"],[12,"12 puntos"],[16,"16 puntos"],[20,"20 puntos"]],12)+'</label>'+
    '<label>Tiempo por tarjeta'+sel("fs-t",[[45,"45 s"],[60,"60 s"],[90,"90 s"]],60)+'</label></div>'+
    '<p class="fine">Qué tarjetas salen</p><div class="fs-tipos">'+Object.keys(TIPOS).map(function(k){return '<label class="ar-chip"><input type="checkbox" value="'+k+'" checked><span>'+TIPOS[k].i+' '+TIPOS[k].n+'</span></label>';}).join("")+'</div>'+
    '<label>Preguntas'+sel("fs-niv",[["1","Fáciles"],["2","Fáciles y medias"],["3","De todo"]],"2")+'</label>'+
    '<div class="actions"><button class="primary" type="submit">Empezar</button></div><p class="msg" id="fs-msg"></p></form>');
  ligaVolver(); ligaNombres("equipos");
  $("fs-f").onsubmit=function(e){e.preventDefault();
    var tipos=Array.prototype.map.call(panel.querySelectorAll(".fs-tipos input:checked"),function(x){return x.value;});
    if(!tipos.length){$("fs-msg").className="msg bad";$("fs-msg").textContent="Elige al menos un tipo de tarjeta.";return;}
    var niv=+$("fs-niv").value, P=D();
    var E={eq:leeNombres("equipos"),meta:+$("fs-meta").value,t:+$("fs-t").value,tipos:tipos,turno:0,ult:[],
      m:{pregunta:mazo((P.preguntas||[]).filter(function(q){return q[0]<=niv;})),mimica:mazo(palabras("mimica")),
         dibuja:mazo(palabras("dibujo")),describe:mazo(P.tabu||[]),reto:mazo(P.retos||[])}};
    E.pts=E.eq.map(function(){return 0;});
    tipos=tipos.filter(function(k){return E.m[k].n>0;}); E.tipos=tipos;
    despierta(); pruebaTurno(E);
  };
}
function pruebaTurno(E){
  para(); despierta();
  pinta(cabecera("prueba")+marcador(E.eq,E.pts,E.turno,E.meta)+
    '<div class="fs-turno"><small>Turno de</small><b>'+esc(E.eq[E.turno])+'</b></div>'+
    '<div class="actions"><button class="primary fs-grande" id="fs-sacar">Sacar tarjeta</button></div>');
  ligaVolver();
  $("fs-sacar").onclick=function(){
    /* no más de dos seguidas del mismo tipo */
    var cand=E.tipos.filter(function(k){return !(E.ult.length>=2&&E.ult[0]===k&&E.ult[1]===k);}); if(!cand.length)cand=E.tipos;
    var tipo=uno(cand); E.ult.unshift(tipo); E.ult=E.ult.slice(0,2);
    pruebaTarjeta(E,tipo,E.m[tipo].saca());
  };
}
function pruebaTarjeta(E,tipo,c){
  var T=TIPOS[tipo], cab=cabecera("prueba",'<span class="chip activo">'+esc(E.eq[E.turno])+'</span>')+
    '<div class="fs-tipo fs-'+tipo+'"><span>'+T.i+'</span><b>'+T.n+'</b><small>'+T.p+(T.p===1?' punto':' puntos')+'</small></div>';
  function resultado(bien){ if(bien)E.pts[E.turno]+=T.p; pita(bien?990:220,bien?160:300); vibra(bien?60:[80,60,80]);
    if(E.pts[E.turno]>=E.meta)return pruebaFin(E); E.turno=(E.turno+1)%E.eq.length; pruebaTurno(E);}
  function botones(txtSi,txtNo){return '<div class="fs-veredicto"><button type="button" class="fs-si" id="fs-si">✓ '+txtSi+'</button><button type="button" class="fs-no" id="fs-no">✗ '+txtNo+'</button></div>';}
  function ligaVeredicto(){$("fs-si").onclick=function(){resultado(true);};$("fs-no").onclick=function(){resultado(false);};}
  if(tipo==="pregunta"){
    var ops=baraja(c.slice(3,7)), correcta=c[3];
    pinta(cab+'<p class="fs-tema">'+esc(c[1])+'</p><p class="fs-pregunta">'+esc(c[2])+'</p>'+
      '<ol class="fs-ops" type="A">'+ops.map(function(o){return '<li data-ok="'+(o===correcta?1:0)+'">'+esc(o)+'</li>';}).join("")+'</ol>'+
      relojHtml()+'<div class="actions"><button class="primary" id="fs-ver">Ver respuesta</button></div><div id="fs-v"></div>');
    ligaVolver();
    var parar=reloj(Math.min(30,E.t),function(){ver();});
    function ver(){parar(); var li=panel.querySelector('.fs-ops [data-ok="1"]'); if(li)li.classList.add("ok"); $("fs-ver").hidden=true;
      $("fs-v").innerHTML='<p class="fs-resp">Respuesta: <b>'+esc(correcta)+'</b></p>'+botones("Acertaron","Fallaron"); ligaVeredicto();}
    $("fs-ver").onclick=ver; return;
  }
  var quien={mimica:"quien va a hacer la mímica",dibuja:"quien va a dibujar",describe:"quien va a describir",reto:"todo el equipo"}[tipo];
  var cuerpo=tipo==="describe"?'<p class="fs-palabra">'+esc(c[0])+'</p><p class="fine">No puedes decir:</p><ul class="fs-prohibidas">'+c[1].map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ul>'
    :tipo==="reto"?'<p class="fs-reto">'+esc(c)+'</p>'
    :'<p class="fs-cat">'+esc(c.cat)+'</p><p class="fs-palabra">'+esc(c.w)+'</p>'+(tipo==="dibuja"?'<p class="fine">Sin letras ni números. Tu equipo adivina.</p>':'<p class="fine">Sin hablar ni hacer sonidos. Tu equipo adivina.</p>');
  if(tipo==="reto"){
    pinta(cab+cuerpo+'<div class="actions"><button class="primary" id="fs-go">Empezar ('+Math.min(E.t,60)+' s)</button></div>'+botones("Lo cumplieron","No"));
    ligaVolver(); ligaVeredicto();
    $("fs-go").onclick=function(){this.outerHTML=relojHtml(); reloj(Math.min(E.t,60),function(){});};
    return;
  }
  pinta(cab+'<div class="fs-secreto"><p>Que mire solo <b>'+quien+'</b>.</p><div class="actions"><button class="primary" id="fs-mira">Ver la tarjeta</button></div></div>');
  ligaVolver();
  $("fs-mira").onclick=function(){
    pinta(cab+cuerpo+'<div class="actions"><button class="primary fs-grande" id="fs-go">¡Empezar! ('+E.t+' s)</button></div>');
    ligaVolver();
    $("fs-go").onclick=function(){
      pinta(cab+'<div id="fs-carta" class="fs-carta">'+cuerpo+'</div><button type="button" class="ghost au-mini" id="fs-oculta">Ocultar tarjeta</button>'+relojHtml()+botones("¡Lo adivinaron!","No"));
      ligaVolver(); ligaVeredicto();
      $("fs-oculta").onclick=function(){var c2=$("fs-carta"); c2.hidden=!c2.hidden; this.textContent=c2.hidden?"Mostrar tarjeta":"Ocultar tarjeta";};
      reloj(E.t,function(){var t=panel.querySelector(".fs-tiempo"); if(t)t.insertAdjacentHTML("afterend",'<p class="fs-fin">¡Tiempo!</p>');});
    };
  };
}
function pruebaFin(E){
  para();
  pinta(cabecera("prueba")+'<div class="fs-gana">🏆<b>¡Gana '+esc(E.eq[E.turno])+'!</b></div>'+podio(E.eq,E.pts)+
    '<div class="actions"><button class="primary" id="fs-otra">Otra partida</button><button class="ghost" id="fs-cambia">Cambiar equipos</button></div>');
  ligaVolver(); pita(660,150); espera(160,function(){pita(990,300);});
  $("fs-otra").onclick=function(){E.pts=E.eq.map(function(){return 0;});E.turno=0;pruebaTurno(E);};
  $("fs-cambia").onclick=prueba;
}

/* ======================= FRENTE ======================= */
function frente(){
  var P=D().palabras;
  pinta(cabecera("frente")+
    '<p class="fine">Por turnos, cada jugador se pone el teléfono en la frente con la pantalla hacia el grupo, sin mirarla. Los demás dan pistas (sin decir la palabra) y el jugador intenta adivinar todas las que pueda. Quien sostiene el teléfono (o alguien del grupo) toca <b>¡La tengo!</b> o <b>Paso</b>.</p>'+
    '<form class="rt-form" id="fs-f"><label>Jugadores</label>'+formNombres("jugadores",2,12,3)+
    '<div class="rt-2"><label>Tiempo por turno'+sel("fs-t",[[45,"45 s"],[60,"60 s"],[90,"90 s"]],60)+'</label>'+
    '<label>Turnos por jugador'+sel("fs-r",[[1,"1"],[2,"2"],[3,"3"]],1)+'</label></div>'+
    '<p class="fine">Categorías (ninguna marcada = todas)</p><div class="fs-tipos">'+Object.keys(P).map(function(k){return '<label class="ar-chip"><input type="checkbox" value="'+k+'"><span>'+esc(P[k].nombre)+'</span></label>';}).join("")+'</div>'+
    '<div class="actions"><button class="primary" type="submit">Empezar</button></div></form>');
  ligaVolver(); ligaNombres("jugadores");
  $("fs-f").onsubmit=function(e){e.preventDefault();
    var cats=Array.prototype.map.call(panel.querySelectorAll(".fs-tipos input:checked"),function(x){return x.value;});
    var E={js:leeNombres("jugadores"),t:+$("fs-t").value,rondas:+$("fs-r").value,turno:0,vuelta:1,m:mazo(palabras(null,cats))};
    E.pts=E.js.map(function(){return 0;}); despierta(); frenteTurno(E);
  };
}
function frenteTurno(E){
  para(); despierta();
  pinta(cabecera("frente")+marcador(E.js,E.pts,E.turno)+
    '<div class="fs-turno"><small>Turno '+E.vuelta+' de '+E.rondas+' · adivina</small><b>'+esc(E.js[E.turno])+'</b></div>'+
    '<p class="fine" style="text-align:center">Ponte el teléfono en la frente, con la pantalla hacia el grupo, y pulsa cuando estés listo.</p>'+
    '<div class="actions"><button class="primary fs-grande" id="fs-listo">Estoy listo</button></div>');
  ligaVolver();
  $("fs-listo").onclick=function(){
    var n=3; pinta('<div class="fs-frente fs-cuenta"><b id="fs-n">3</b></div>'); pita(660,120);
    var t=setInterval(function(){n--; if(n>0){$("fs-n").textContent=n;pita(660,120);}else{clearInterval(t);frenteJuego(E);}},900); intervalo=t;
  };
}
function frenteJuego(E){
  var hechas=[], actual=E.m.saca();
  pinta('<div class="fs-frente"><div class="fs-frente-top"><span id="fs-reloj"></span><span id="fs-cuenta">0</span></div>'+
    '<p class="fs-cat" id="fs-fc"></p><p class="fs-palabra fs-enorme" id="fs-fw"></p>'+
    '<div class="fs-frente-bot"><button type="button" class="fs-no" id="fs-paso">Paso</button><button type="button" class="fs-si" id="fs-bien">¡La tengo!</button></div>'+
    '<div class="rp-bar"><i id="fs-barra"></i></div></div>');
  function muestra(){$("fs-fc").textContent=actual.cat;$("fs-fw").textContent=actual.w;}
  function sig(ok){hechas.push({w:actual.w,ok:ok}); if(ok){E.pts[E.turno]++;pita(990,140);vibra(50);}else{pita(300,160);vibra([40,40,40]);}
    $("fs-cuenta").textContent=hechas.filter(function(x){return x.ok;}).length; actual=E.m.saca(); muestra();}
  muestra();
  $("fs-bien").onclick=function(){sig(true);}; $("fs-paso").onclick=function(){sig(false);};
  reloj(E.t,function(){
    var bien=hechas.filter(function(x){return x.ok;}).length;
    E.turno++; if(E.turno>=E.js.length){E.turno=0;E.vuelta++;}
    var fin=E.vuelta>E.rondas;
    pinta(cabecera("frente")+'<div class="fs-turno"><small>¡Tiempo!</small><b>'+bien+(bien===1?' acertada':' acertadas')+'</b></div>'+
      '<ul class="fs-hechas">'+hechas.map(function(x){return '<li class="'+(x.ok?'ok':'mal')+'">'+(x.ok?'✓ ':'✗ ')+esc(x.w)+'</li>';}).join("")+'</ul>'+
      (fin?'<h4>Resultado final</h4>'+podio(E.js,E.pts,"acertadas")+'<div class="actions"><button class="primary" id="fs-otra">Otra partida</button></div>'
          :'<div class="actions"><button class="primary" id="fs-sig">Siguiente: '+esc(E.js[E.turno])+'</button></div>'));
    ligaVolver();
    if(fin)$("fs-otra").onclick=function(){E.pts=E.js.map(function(){return 0;});E.turno=0;E.vuelta=1;frenteTurno(E);};
    else $("fs-sig").onclick=function(){frenteTurno(E);};
  });
}

/* ======================= TABÚ ======================= */
function tabu(){
  pinta(cabecera("tabu")+
    '<p class="fine">Por equipos. En tu turno, alguien de tu equipo describe las palabras sin decir la palabra ni ninguna de las prohibidas; el resto adivina. Cada acierto suma 1 punto; decir una prohibida resta 1. Alguien del otro equipo vigila la tarjeta y pulsa <b>Tabú</b>.</p>'+
    '<form class="rt-form" id="fs-f"><label>Equipos</label>'+formNombres("equipos",2,4,2)+
    '<div class="rt-2"><label>Tiempo por turno'+sel("fs-t",[[60,"60 s"],[90,"90 s"],[120,"2 min"]],60)+'</label>'+
    '<label>Turnos por equipo'+sel("fs-r",[[2,"2"],[3,"3"],[4,"4"],[5,"5"]],3)+'</label></div>'+
    '<div class="actions"><button class="primary" type="submit">Empezar</button></div></form>');
  ligaVolver(); ligaNombres("equipos");
  $("fs-f").onsubmit=function(e){e.preventDefault();
    var E={eq:leeNombres("equipos"),t:+$("fs-t").value,rondas:+$("fs-r").value,turno:0,vuelta:1,m:mazo(D().tabu||[])};
    E.pts=E.eq.map(function(){return 0;}); despierta(); tabuTurno(E);
  };
}
function tabuTurno(E){
  para(); despierta();
  pinta(cabecera("tabu")+marcador(E.eq,E.pts,E.turno)+
    '<div class="fs-turno"><small>Turno '+E.vuelta+' de '+E.rondas+'</small><b>'+esc(E.eq[E.turno])+'</b></div>'+
    '<p class="fine" style="text-align:center">Elegid quién describe. El teléfono lo ven quien describe y alguien del otro equipo.</p>'+
    '<div class="actions"><button class="primary fs-grande" id="fs-go">Empezar ('+E.t+' s)</button></div>');
  ligaVolver();
  $("fs-go").onclick=function(){
    var hechas=[], c=E.m.saca();
    pinta(cabecera("tabu",'<span class="chip activo" id="fs-cuenta">0</span>')+relojHtml()+'<div id="fs-carta"></div>'+
      '<div class="fs-veredicto tres"><button type="button" class="fs-no" id="fs-tabu">🚫 Tabú</button><button type="button" class="ghost" id="fs-paso">Paso</button><button type="button" class="fs-si" id="fs-bien">✓ Acertada</button></div>');
    ligaVolver();
    function muestra(){$("fs-carta").innerHTML='<p class="fs-palabra">'+esc(c[0])+'</p><ul class="fs-prohibidas">'+c[1].map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ul>';}
    function sig(r){hechas.push({w:c[0],r:r}); E.pts[E.turno]+=r==="bien"?1:r==="tabu"?-1:0;
      if(r==="bien"){pita(990,140);vibra(50);}else if(r==="tabu"){pita(200,300);vibra([100,50,100]);}
      $("fs-cuenta").textContent=hechas.filter(function(x){return x.r==="bien";}).length-hechas.filter(function(x){return x.r==="tabu";}).length;
      c=E.m.saca(); muestra();}
    muestra();
    $("fs-bien").onclick=function(){sig("bien");}; $("fs-tabu").onclick=function(){sig("tabu");}; $("fs-paso").onclick=function(){sig("paso");};
    reloj(E.t,function(){
      E.turno++; if(E.turno>=E.eq.length){E.turno=0;E.vuelta++;}
      var fin=E.vuelta>E.rondas;
      pinta(cabecera("tabu")+'<div class="fs-turno"><small>¡Tiempo!</small><b>'+hechas.filter(function(x){return x.r==="bien";}).length+' acertadas</b></div>'+
        '<ul class="fs-hechas">'+hechas.map(function(x){return '<li class="'+(x.r==="bien"?'ok':x.r==="tabu"?'mal':'')+'">'+(x.r==="bien"?'✓ ':x.r==="tabu"?'🚫 ':'→ ')+esc(x.w)+'</li>';}).join("")+'</ul>'+
        (fin?'<h4>Resultado final</h4>'+podio(E.eq,E.pts)+'<div class="actions"><button class="primary" id="fs-otra">Otra partida</button></div>'
            :marcador(E.eq,E.pts,E.turno)+'<div class="actions"><button class="primary" id="fs-sig">Turno de '+esc(E.eq[E.turno])+'</button></div>'));
      ligaVolver();
      if(fin)$("fs-otra").onclick=function(){E.pts=E.eq.map(function(){return 0;});E.turno=0;E.vuelta=1;tabuTurno(E);};
      else $("fs-sig").onclick=function(){tabuTurno(E);};
    });
  };
}

/* ======================= EL IMPOSTOR ======================= */
function impostor(){
  var P=D().palabras, cats=Object.keys(P).filter(function(k){return P[k].impostor;});
  pinta(cabecera("impostor")+
    '<p class="fine">El teléfono pasa de mano en mano: cada uno mira su papel a escondidas. Todos ven la misma palabra secreta menos el impostor, que solo sabe la categoría. Por turnos, cada uno dice una palabra relacionada (sin ser demasiado obvio) y después se vota en voz alta quién es el impostor. Si lo descubrís, gana el grupo; si no, gana el impostor. Si lo descubren, el impostor aún puede ganar adivinando la palabra.</p>'+
    '<form class="rt-form" id="fs-f"><label>Jugadores</label>'+formNombres("jugadores",3,12,4)+
    '<div class="rt-2"><label>Categoría'+sel("fs-c",[["","Al azar"]].concat(cats.map(function(k){return [k,P[k].nombre];})),"")+'</label>'+
    '<label>Impostores'+sel("fs-i",[[1,"1"],[2,"2 (desde 7 jugadores)"]],1)+'</label></div>'+
    '<label>Tiempo para hablar'+sel("fs-t",[[120,"2 min"],[180,"3 min"],[300,"5 min"]],180)+'</label>'+
    '<div class="actions"><button class="primary" type="submit">Repartir papeles</button></div></form>');
  ligaVolver(); ligaNombres("jugadores");
  $("fs-f").onsubmit=function(e){e.preventDefault();
    var E={js:leeNombres("jugadores"),cat:$("fs-c").value,n:+$("fs-i").value,t:+$("fs-t").value,cats:cats};
    if(E.js.length<7)E.n=1; despierta(); impostorReparte(E);
  };
}
function impostorReparte(E){
  para(); despierta();
  var P=D().palabras, k=E.cat||uno(E.cats), w=uno(P[k].lista), imp=baraja(E.js.map(function(_,i){return i;})).slice(0,E.n), i=0;
  function pasa(){
    if(i>=E.js.length)return impostorHabla(E,w,P[k].nombre,imp);
    pinta(cabecera("impostor")+'<div class="fs-turno"><small>Pasa el teléfono a</small><b>'+esc(E.js[i])+'</b></div>'+
      '<p class="fine" style="text-align:center">Que nadie más mire la pantalla.</p><div class="actions"><button class="primary fs-grande" id="fs-ver">Ver mi papel</button></div>');
    ligaVolver();
    $("fs-ver").onclick=function(){
      var soy=imp.indexOf(i)>=0;
      pinta(cabecera("impostor")+(soy?'<div class="fs-papel impostor"><span>🕵️</span><b>Eres el impostor</b><small>Categoría: '+esc(P[k].nombre)+'</small></div>'
        :'<div class="fs-papel"><small>La palabra secreta es</small><b>'+esc(w)+'</b><small>Categoría: '+esc(P[k].nombre)+'</small></div>')+
        '<div class="actions"><button class="primary" id="fs-ok">Ocultar y pasar</button></div>');
      ligaVolver(); vibra(40);
      $("fs-ok").onclick=function(){i++;pasa();};
    };
  }
  pasa();
}
function impostorHabla(E,w,cat,imp){
  var empieza=uno(E.js.filter(function(_,i){return imp.indexOf(i)<0;}).concat(E.js));
  pinta(cabecera("impostor")+'<div class="fs-turno"><small>Todos tienen su papel. Empieza</small><b>'+esc(empieza)+'</b></div>'+
    '<p class="fine" style="text-align:center">Por turnos, cada uno dice una palabra relacionada con la palabra secreta. Cuando acabe el tiempo, votad en voz alta.</p>'+
    relojHtml()+'<div class="actions"><button class="ghost" id="fs-ya">Ya hemos votado</button></div>');
  ligaVolver();
  function revela(){
    para();
    pinta(cabecera("impostor")+'<div class="fs-papel impostor"><span>🕵️</span><small>'+(imp.length>1?'Los impostores eran':'El impostor era')+'</small><b>'+imp.map(function(i){return esc(E.js[i]);}).join(" y ")+'</b></div>'+
      '<div class="fs-papel"><small>La palabra secreta era</small><b>'+esc(w)+'</b><small>'+esc(cat)+'</small></div>'+
      '<div class="actions"><button class="primary" id="fs-otra">Otra ronda</button><button class="ghost" id="fs-cambia">Cambiar jugadores</button></div>');
    ligaVolver(); $("fs-otra").onclick=function(){impostorReparte(E);}; $("fs-cambia").onclick=impostor;
  }
  reloj(E.t,function(){var b=$("fs-ya"); if(b)b.textContent="Revelar al impostor";});
  $("fs-ya").onclick=function(){ if(confirm("¿Revelar quién era el impostor?"))revela(); };
}

/* ======================= PASA LA BOMBA ======================= */
function bomba(){
  pinta(cabecera("bomba")+
    '<p class="fine">Sale un tema. Quien tiene el teléfono dice una palabra que encaje (sin repetir) y lo pasa al de al lado. La bomba explota en un momento al azar: quien la tenga en las manos pierde la ronda.</p>'+
    '<form class="rt-form" id="fs-f"><label class="rt-check"><input type="checkbox" id="fs-cuenta" checked> <span>Llevar la cuenta de quién pierde</span></label>'+
    '<div id="fs-jn">'+formNombres("jugadores",2,12,4)+'</div>'+
    '<label>Duración de la mecha'+sel("fs-t",[["corta","Corta (10 a 25 s)"],["media","Media (20 a 45 s)"],["larga","Larga (35 a 70 s)"]],"media")+'</label>'+
    '<div class="actions"><button class="primary" type="submit">Empezar</button></div></form>');
  ligaVolver(); ligaNombres("jugadores");
  $("fs-cuenta").onchange=function(){$("fs-jn").hidden=!this.checked;};
  $("fs-f").onsubmit=function(e){e.preventDefault();
    var cuenta=$("fs-cuenta").checked, E={cuenta:cuenta,js:cuenta?leeNombres("jugadores"):[],mecha:$("fs-t").value,m:mazo(D().bomba||[]),ronda:0};
    E.pts=E.js.map(function(){return 0;}); despierta(); bombaRonda(E);
  };
}
function bombaRonda(E){
  para(); despierta(); E.ronda++;
  var tema=E.m.saca();
  pinta(cabecera("bomba",'<span class="chip">Ronda '+E.ronda+'</span>')+'<p class="fine" style="text-align:center">El tema es</p><p class="fs-palabra">'+esc(tema)+'</p>'+
    '<div class="actions"><button class="primary fs-grande" id="fs-go">💣 Encender la mecha</button></div>'+
    (E.cuenta&&E.ronda>1?'<h4>Explosiones</h4>'+podio(E.js,E.pts,"veces"):''));
  ligaVolver();
  $("fs-go").onclick=function(){
    var r={corta:[10,25],media:[20,45],larga:[35,70]}[E.mecha], dura=(r[0]+Math.random()*(r[1]-r[0]))*1000, t0=Date.now();
    pinta('<div class="fs-bomba"><p class="fs-palabra">'+esc(tema)+'</p><div class="fs-mecha" id="fs-b">💣</div><p class="fine">Di una palabra y pasa el teléfono.</p></div>');
    /* el tic-tac se acelera, pero sin decir cuánto falta */
    function tic(){
      var p=(Date.now()-t0)/dura; if(p>=1)return boom();
      pita(p<0.6?1200:1500,40,0.08); var b=$("fs-b"); if(b){b.classList.remove("late");void b.offsetWidth;b.classList.add("late");}
      espera(Math.max(140,700-560*p),tic);
    }
    function boom(){
      pita(90,700,0.3); vibra([400,100,400]);
      pinta('<div class="fs-bomba boom"><div class="fs-mecha">💥</div><b>¡BUM!</b></div>'+
        (E.cuenta?'<p class="fine" style="text-align:center">¿Quién la tenía?</p><div class="fs-quien">'+E.js.map(function(n,i){return '<button type="button" class="ghost" data-i="'+i+'">'+esc(n)+'</button>';}).join("")+'</div>'
                 :'<div class="actions"><button class="primary" id="fs-sig">Otra ronda</button></div>'));
      if(E.cuenta)panel.querySelectorAll(".fs-quien [data-i]").forEach(function(b){b.onclick=function(){E.pts[+this.getAttribute("data-i")]++;bombaRonda(E);};});
      else $("fs-sig").onclick=function(){bombaRonda(E);};
    }
    tic();
  };
}

/* ======================= BASTA ======================= */
var LETRAS="ABCDEFGHIJLMNOPRSTUV".split("");
function basta(){
  pinta(cabecera("basta")+
    '<p class="fine">Cada uno, en un papel, escribe una palabra por categoría que empiece con la letra que salga. Quien termine primero grita «¡Basta!» (o se acaba el tiempo) y todos dejan de escribir. Puntos: 10 si nadie más puso esa palabra, 5 si se repite y 0 si está vacía o no vale.</p>'+
    '<form class="rt-form" id="fs-f"><div class="rt-2"><label>Categorías'+sel("fs-n",[[5,"5"],[6,"6"],[8,"8"],[10,"10"]],6)+'</label>'+
    '<label>Tiempo'+sel("fs-t",[[60,"1 min"],[90,"1 min 30"],[120,"2 min"],[0,"Sin límite"]],90)+'</label></div>'+
    '<label class="rt-check"><input type="checkbox" id="fs-clasicas" checked> <span>Empezar con las clásicas (Nombre, Animal, Fruta, País, Color…)</span></label>'+
    '<div class="actions"><button class="primary" type="submit">Empezar</button></div></form>');
  ligaVolver();
  $("fs-f").onsubmit=function(e){e.preventDefault();
    var todas=(D().basta||[]).slice(), n=+$("fs-n").value, cl=$("fs-clasicas").checked?todas.slice(0,Math.min(5,n)):[];
    var resto=baraja(todas.filter(function(x){return cl.indexOf(x)<0;})).slice(0,n-cl.length);
    var E={cats:cl.concat(resto),t:+$("fs-t").value,usadas:[],ronda:0};
    despierta(); bastaRonda(E);
  };
}
function bastaRonda(E){
  para(); despierta(); E.ronda++;
  var libres=LETRAS.filter(function(l){return E.usadas.indexOf(l)<0;}); if(!libres.length){E.usadas=[];libres=LETRAS;}
  var letra=uno(libres); E.usadas.push(letra);
  var lista='<ol class="fs-basta">'+E.cats.map(function(c){return '<li>'+esc(c)+'</li>';}).join("")+'</ol>';
  pinta(cabecera("basta",'<span class="chip">Ronda '+E.ronda+'</span>')+'<div class="fs-letra" id="fs-l">?</div>'+lista+'<div id="fs-z"></div>');
  ligaVolver();
  /* la letra «gira» un momento antes de quedarse */
  var k=0, giro=setInterval(function(){$("fs-l").textContent=uno(LETRAS);pita(500+k*30,30,0.05);if(++k>14){clearInterval(giro);intervalo=null;$("fs-l").textContent=letra;pita(990,200);empieza();}},70); intervalo=giro;
  function empieza(){
    $("fs-z").innerHTML=(E.t?relojHtml():'')+'<div class="actions"><button class="primary fs-grande fs-basta-b" id="fs-b">¡BASTA!</button></div>';
    var fin=function(){para();$("fs-z").innerHTML='<p class="fs-fin">¡Basta! Dejad de escribir.</p><p class="fine" style="text-align:center">Leed en voz alta: 10 puntos si nadie más la puso, 5 si se repite, 0 si no vale.</p>'+
      '<div class="actions"><button class="primary" id="fs-sig">Otra letra</button><button class="ghost" id="fs-cat">Otras categorías</button></div>';
      pita(220,400,0.2); vibra([200,80,200]); $("fs-sig").onclick=function(){bastaRonda(E);}; $("fs-cat").onclick=basta;};
    $("fs-b").onclick=fin;
    if(E.t)reloj(E.t,fin);
  }
}

window.AxFiesta={JUEGOS:JUEGOS,tarjetas:tarjetas,abre:abre,para:para};
})();
