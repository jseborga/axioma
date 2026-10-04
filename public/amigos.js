/* ===========================================================
   THE FINAL TEST · perfiles, grupos de amigos y mis partidas
   Quien entra con Google es jugador: juega, guarda sus partidas y
   arma grupos con sus amigos. Educativo y Empresas aparecen con el
   perfil que da la administración de la plataforma, o al formar parte
   de una institución, una empresa o un curso.
     AxAcceso.datos()  → { admin, perfiles, ver, crear, solicitudes… }
     evento «ax-acceso» cuando cambia
   =========================================================== */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var panel=$("amigos-panel");
var acc=null, activo=false, vista=null;

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function api(path,body){
  return fetch(path,{method:body?"POST":"GET",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:body?JSON.stringify(body):undefined}).then(function(r){return r.text().then(function(t){var j;try{j=JSON.parse(t);}catch(x){throw {error:"http",status:r.status};}if(!r.ok)throw j;return j;});});
}
function user(){return window.AxAccount&&AxAccount.user();}
function fecha(ms){return new Date(ms).toLocaleDateString("es",{day:"numeric",month:"short"});}
function reloj(s){var m=Math.floor(s/60),g=s%60;return m+":"+(g<10?"0":"")+g;}
function aviso(id,t,mal){var m=$(id);if(!m)return;m.className="msg"+(mal?" bad":" good");m.textContent=t;}
var ERRS={bad_name:"Ponle un nombre de al menos 2 letras.",too_many:"Ya creaste el máximo de grupos (20).",group_full:"El grupo está lleno (50 personas).",
  owner_leaves:"Quien creó el grupo no puede salir: puede borrarlo.",not_found:"No hay ningún grupo con ese código.",forbidden:"Solo quien creó el grupo puede hacer eso.",
  google_required:"Para esto hace falta entrar con Google.",unauthorized:"Tu sesión caducó: vuelve a entrar con Google.",nota_required:"Cuéntanos de qué institución o empresa se trata.",
  perfiles_not_configured:"Falta crear las tablas de perfiles y grupos en la base de datos (ver SETUP.md).",bad_email:"Revisa el correo.",bad_perfil:"Elige un perfil."};
function ERR(e){
  if(e&&ERRS[e.error])return ERRS[e.error];
  if(e&&e.error==="server_error")return "Falló el servidor (referencia "+(e.ref||"—")+")"+(e.detalle?": "+e.detalle:".");
  if(e&&e.error==="http")return "El servidor respondió con un error "+e.status+".";
  if(e instanceof TypeError)return "Sin conexión con el servidor. Revisa tu internet.";
  return "No se pudo completar"+(e&&e.error?" ("+e.error+")":"")+".";
}

/* ===================== ACCESO ===================== */
var NADA={user:false,admin:false,perfiles:{},solicitudes:[],ver:{},crear:{}};
function aplica(){
  var a=acc||NADA, ve=function(id,v){var e=$(id);if(e)e.hidden=!v;};
  ve("t-aula",!!a.ver.educativo); ve("t-empresas",!!a.ver.empresas);
  ve("t-plat",!!a.admin); ve("t-plat-cap",!!a.admin);
  try{document.dispatchEvent(new CustomEvent("ax-acceso",{detail:a}));}catch(e){}
}
function carga(){
  return api("/api/acceso").then(function(r){acc=r;aplica();return r;},function(){acc=null;aplica();return NADA;});
}
document.addEventListener("ax-user",function(){carga();});
$("t-plat")&&($("t-plat").onclick=function(){
  var mm=$("mode-menu"); if(mm&&!mm.hidden)$("mode-btn").click();
  if(window.AxAula)AxAula.plataforma();
});
window.AxAcceso={datos:function(){return acc||NADA;},carga:carga,listo:function(){return acc!==null;},solicitar:solicitar};

/* ===================== PANEL ===================== */
function pinta(h){panel.innerHTML=h;}
function abrir(){activo=true;panel.hidden=false; if(vista)vista(); else inicio();}
function cerrar(){activo=false;panel.hidden=true;}
var quien;   /* solo se repinta si cambia la persona (el aviso de sesión puede llegar más de una vez) */
document.addEventListener("ax-user",function(e){var id=e.detail?e.detail.id:null; if(id===quien)return; var antes=quien; quien=id;
  if(activo&&antes!==undefined){vista=null;inicio();} else if(activo&&vista)vista();});

function puerta(){
  var u=user();
  if(!u){
    pinta('<h3>Mis grupos y partidas</h3><p>Entra con Google para guardar tus partidas, ver tu historial y armar grupos con tus amigos con su ranking de la semana.</p>'+
      (window.AxAccount&&AxAccount.configurado()?'<div class="actions"><button class="primary" id="am-login">Entrar con Google</button></div>':'<p class="fine">El inicio de sesión no está configurado.</p>'));
    if($("am-login"))$("am-login").onclick=function(){AxAccount.abrirCuenta();};
    return false;
  }
  if(u.guest){pinta('<h3>Mis grupos y partidas</h3><p>Participas como invitado. Para guardar tus partidas y crear grupos, entra con Google.</p>');return false;}
  return true;
}

function inicio(nota){
  var yo=vista=function(){inicio();};
  $("hdr").textContent="Mis grupos";
  if(!puerta())return;
  pinta('<h3>Mis grupos y partidas</h3><p class="fine">Cargando…</p>');
  Promise.all([api("/api/grupos").catch(function(e){return {error:e};}),carga()]).then(function(x){
    if(vista!==yo)return;   /* ya se abrió otra pantalla */
    var g=x[0], a=x[1]||NADA;
    var h='<h3>Mis grupos y partidas</h3>'+
      '<p class="fine">Arma grupos con tus amigos: cada grupo tiene un código, un ranking de la semana (Axioma diario, sudoku del día y partidas en vivo) y los retos en los que juegan. <a href="#" class="guia-link" data-guia="amigos">¿Cómo funciona?</a></p>'+
      (nota?'<p class="msg good">'+esc(nota)+'</p>':'')+
      '<form class="rt-join" id="am-join"><input id="am-code" placeholder="Código de grupo" maxlength="6" autocapitalize="characters" autocomplete="off" spellcheck="false"><button type="submit" class="primary">Unirme</button></form>'+
      '<p class="msg" id="am-msg"></p><h4>Tus grupos</h4>';
    if(g.error)h+='<p class="fine bad">'+esc(ERR(g.error))+'</p>';
    else h+=g.grupos.length?g.grupos.map(function(x){
      return '<button type="button" class="rt-card" data-grupo="'+x.code+'"><span class="rt-card-top"><b>'+esc(x.nombre)+'</b><span class="chip">'+x.miembros+(x.miembros===1?' persona':' personas')+'</span></span>'+
        '<small>Código '+x.code+(x.mio?' · lo creaste tú':'')+'</small></button>';}).join(""):'<p class="fine">Todavía no estás en ningún grupo. Crea uno o únete con el código que te pasen.</p>';
    h+='<form class="rt-join" id="am-nuevo"><input id="am-nom" placeholder="Nombre del grupo nuevo" maxlength="50" required><button type="submit" class="ghost">Crear grupo</button></form>'+
      '<div class="actions"><button class="ghost" id="am-hist">Mis partidas guardadas</button></div>'+
      tarjetaPerfil(a);
    pinta(h);
    var bs=panel.querySelectorAll("[data-grupo]"),i; for(i=0;i<bs.length;i++)bs[i].onclick=function(){grupo(this.getAttribute("data-grupo"));};
    $("am-join").onsubmit=function(e){e.preventDefault(); var c=$("am-code").value.trim().toUpperCase();
      if(c.length!==6){aviso("am-msg","Los códigos de grupo tienen 6 caracteres.",true);return;} grupo(c);};
    $("am-nuevo").onsubmit=function(e){e.preventDefault();
      api("/api/grupos",{nombre:$("am-nom").value}).then(function(r){grupo(r.code,"Grupo creado. Comparte el código o el enlace con tus amigos.");})
        .catch(function(er){aviso("am-msg",ERR(er),true);});};
    $("am-hist").onclick=function(){historial();};
    ligaPerfil();
  });
}

/* ---------- tu perfil: jugador, y si quiere, pedir el de institución o empresa ---------- */
var NOMPERF={educativo:"Educativo (institución educativa)",empresas:"Empresas y eventos"};
function tarjetaPerfil(a){
  var tiene=[], pend=a.solicitudes||[];
  if(a.admin)tiene.push("Administración de la plataforma");
  ["educativo","empresas"].forEach(function(p){if(a.perfiles&&a.perfiles[p])tiene.push(NOMPERF[p]);});
  var faltan=["educativo","empresas"].filter(function(p){return !(a.perfiles&&a.perfiles[p])&&!a.admin;});
  return '<div class="au-caja"><h4>Tu perfil</h4><p class="fine">Jugador'+(tiene.length?' · '+esc(tiene.join(" · ")):'')+
    (pend.length?' · <em>solicitado: '+esc(pend.map(function(p){return NOMPERF[p];}).join(", "))+'</em>':'')+'</p>'+
    (faltan.length&&a.tabla!==false?'<p class="fine">¿Eres docente o representas a una institución educativa, una empresa o un evento? Pide el perfil y la administración de la plataforma lo revisa.</p>'+
      '<div class="actions">'+faltan.map(function(p){return '<button type="button" class="ghost" data-pide="'+p+'">Solicitar '+(p==="educativo"?"perfil educativo":"perfil de empresa")+'</button>';}).join("")+'</div>'+
      '<div id="am-sol"></div>':'')+'</div>';
}
function ligaPerfil(){
  var bs=panel.querySelectorAll("[data-pide]"),i; for(i=0;i<bs.length;i++)bs[i].onclick=function(){formSolicitud($("am-sol"),this.getAttribute("data-pide"));};
}
function formSolicitud(z,p,listo){
  if(!z)return;
  z.innerHTML='<form class="rt-form" id="am-solf"><label>'+(p==="educativo"?"Institución, cargo y un teléfono":"Empresa o evento, tu cargo y un teléfono")+
    '<input id="am-nota" maxlength="300" required placeholder="'+(p==="educativo"?"Universidad Mayor de San Andrés · docente de Cálculo · 70000000":"Café Central · marketing · 70000000")+'"></label>'+
    '<div class="actions"><button class="primary" type="submit">Enviar solicitud</button></div><p class="msg" id="am-solm"></p></form>';
  $("am-solf").onsubmit=function(e){e.preventDefault();
    api("/api/acceso/solicitud",{perfil:p,nota:$("am-nota").value}).then(function(){
      z.innerHTML='<p class="msg good">Solicitud enviada. Cuando la administración la apruebe, verás la sección en el menú.</p>';
      carga(); if(listo)listo();
    }).catch(function(er){aviso("am-solm",ERR(er),true);});};
}
/* lo usan Educativo y Empresas cuando falta el perfil */
function solicitar(z,p){formSolicitud(z,p);}

/* ===================== GRUPO ===================== */
var JUEGO={sudoku:"Sudoku",trivia:"Trivia",memoria:"Memoria",calculo:"Cálculo",reflejos:"Reflejos",numeros:"Del 1 al 25",granja:"Granja Express",granja_sinfin:"Granja sin fin"};
function enlace(code){return location.origin+location.pathname+"?grupo="+code;}
function grupo(code,nota){
  var yo=vista=function(){grupo(code);};
  if(!puerta())return;
  pinta('<button type="button" class="rt-back" id="am-back">‹ Mis grupos</button><p class="fine">Cargando…</p>');
  $("am-back").onclick=function(){inicio();};
  api("/api/grupos/"+code).then(function(g){
    if(vista!==yo)return;
    var h='<button type="button" class="rt-back" id="am-back">‹ Mis grupos</button><h3>'+esc(g.nombre)+'</h3>';
    if(!g.soy){
      h+='<p>Grupo de <b>'+esc(g.creador)+'</b> · '+g.miembros+(g.miembros===1?' persona':' personas')+'.</p>'+
        '<div class="actions"><button class="primary" id="am-unir">Unirme al grupo</button></div><p class="msg" id="am-msg"></p>';
      pinta(h); $("am-back").onclick=function(){inicio();};
      $("am-unir").onclick=function(){api("/api/grupos/"+code+"/unirme",{}).then(function(){grupo(code,"Ya formas parte del grupo.");}).catch(function(er){aviso("am-msg",ERR(er),true);});};
      return;
    }
    var por={}; g.personas.forEach(function(p){por[p.id]=p;});
    h+=(nota?'<p class="msg good">'+esc(nota)+'</p>':'')+
      '<div class="au-caja"><p class="fine">Código <b class="am-cod">'+g.code+'</b> · '+g.miembros+' de '+g.max+'</p>'+
      '<div class="actions"><button class="ghost" id="am-copia">Copiar enlace de invitación</button>'+(navigator.share?'<button class="ghost" id="am-comp">Compartir</button>':'')+'</div><p class="msg" id="am-msg"></p></div>'+
      '<h4>Ranking de la semana</h4><p class="fine">3 puntos por cada Axioma diario, 2 por cada sudoku del día, 2 por cada granja del día y 1 por partida en vivo (+2 si la ganas). Últimos 7 días.</p>'+
      '<ol class="rank-list am-rank">'+g.ranking.map(function(id,i){var p=por[id];
        return '<li'+(p.yo?' class="me"':'')+'><span class="pos">'+(i+1)+'</span>'+
          (p.foto?'<img src="'+esc(p.foto)+'" alt="" referrerpolicy="no-referrer">':'<span class="noimg"></span>')+
          '<span class="who">'+esc(p.nombre)+(p.yo?' <em>(tú)</em>':'')+(p.hoy?' <span class="chip activo" title="Ya resolvió el Axioma de hoy">hoy ✓</span>':'')+
            '<small>Axioma '+p.axioma+(p.axioma?' ('+p.movs+' mov)':'')+' · sudoku '+p.sudoku+' · granja '+(p.granja||0)+(p.granja_mejor?' (mejor '+p.granja_mejor+')':'')+' · en vivo '+p.salas+(p.victorias?' ('+p.victorias+' 🏆)':'')+'</small></span>'+
          '<span class="pts"><b>'+p.puntos+'</b> pts</span>'+
          (g.mio&&!p.yo?'<button type="button" class="ghost au-mini" data-quita="'+esc(p.id)+'" title="Quitar del grupo">✕</button>':'')+'</li>';}).join("")+'</ol>'+
      '<div class="actions"><button class="primary" id="am-axioma">Jugar el Axioma de hoy</button><button class="ghost" id="am-sud">Sudoku del día</button><button class="ghost" id="am-granja">Granja del día</button>'+
        '<button class="ghost" id="am-reto">Crear un reto para el grupo</button><button class="ghost" id="am-sala">Jugar en vivo</button></div>'+
      '<h4>Retos del grupo</h4>'+
      (g.retos.length?g.retos.map(function(r){
        return '<button type="button" class="rt-card" data-reto="'+r.code+'"><span class="rt-card-top"><b>'+esc(r.nombre)+'</b><span class="chip">'+esc(JUEGO[r.juego]||r.juego)+'</span></span>'+
          '<small>'+r.del_grupo+' del grupo · '+r.rondas+(r.rondas===1?' ronda':' rondas')+' · '+fecha(r.creado)+(r.yo?'':' · todavía no estás')+'</small></button>';}).join(""):
        '<p class="fine">Los retos de los últimos 30 días en los que juegue alguien del grupo aparecen aquí. Crea uno y comparte su código en el grupo.</p>')+
      '<div class="actions">'+(g.mio?'<button class="ghost" id="am-ren">Cambiar el nombre</button><button class="ghost" id="am-borra">Borrar el grupo</button>':'<button class="ghost" id="am-sale">Salir del grupo</button>')+'</div>';
    pinta(h);
    $("am-back").onclick=function(){inicio();};
    $("am-copia").onclick=function(){
      var t=enlace(g.code);
      (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){aviso("am-msg","Enlace copiado: "+t);},function(){aviso("am-msg",t);});};
    if($("am-comp"))$("am-comp").onclick=function(){navigator.share({title:g.nombre,text:"Únete a mi grupo «"+g.nombre+"» en The Final Test",url:enlace(g.code)}).catch(function(){});};
    $("am-axioma").onclick=function(){AxApp.setMode("day");};
    $("am-sud").onclick=function(){AxApp.setMode("sud");};
    $("am-granja").onclick=function(){AxApp.setMode("granja");};
    $("am-reto").onclick=function(){AxApp.setMode("reto");};
    $("am-sala").onclick=function(){AxApp.setMode("juegos");};
    var bs=panel.querySelectorAll("[data-reto]"),i; for(i=0;i<bs.length;i++)bs[i].onclick=function(){if(window.AxRetos)AxRetos.ficha(this.getAttribute("data-reto"));};
    bs=panel.querySelectorAll("[data-quita]"); for(i=0;i<bs.length;i++)bs[i].onclick=function(){
      if(!confirm("¿Quitar a esta persona del grupo?"))return;
      api("/api/grupos/"+code+"/quitar",{user_id:this.getAttribute("data-quita")}).then(function(){grupo(code,"Quitado del grupo.");}).catch(function(er){aviso("am-msg",ERR(er),true);});};
    if($("am-ren"))$("am-ren").onclick=function(){var n=prompt("Nuevo nombre del grupo:",g.nombre); if(!n)return;
      api("/api/grupos/"+code,{nombre:n}).then(function(){grupo(code,"Nombre cambiado.");}).catch(function(er){aviso("am-msg",ERR(er),true);});};
    if($("am-borra"))$("am-borra").onclick=function(){if(!confirm("¿Borrar el grupo para todos? Las partidas de cada uno no se pierden."))return;
      api("/api/grupos/"+code+"/borrar",{}).then(function(){inicio("Grupo borrado.");}).catch(function(er){aviso("am-msg",ERR(er),true);});};
    if($("am-sale"))$("am-sale").onclick=function(){if(!confirm("¿Salir del grupo?"))return;
      api("/api/grupos/"+code+"/salir",{}).then(function(){inicio("Saliste del grupo.");}).catch(function(er){aviso("am-msg",ERR(er),true);});};
  }).catch(function(e){
    pinta('<button type="button" class="rt-back" id="am-back">‹ Mis grupos</button><p class="fine bad">'+esc(ERR(e))+'</p>');
    $("am-back").onclick=function(){inicio();};
  });
}

/* ===================== MIS PARTIDAS ===================== */
var NIV={1:"Fácil",2:"Medio",3:"Difícil",4:"Experto",5:"Ultra"};
function historial(){
  var yo=vista=function(){historial();};
  if(!puerta())return;
  pinta('<button type="button" class="rt-back" id="am-back">‹ Mis grupos</button><h3>Mis partidas</h3><p class="fine">Cargando…</p>');
  $("am-back").onclick=function(){inicio();};
  api("/api/actividad").then(function(r){
    if(vista!==yo)return;
    var ax=r.axioma, sudT=r.sudoku.niveles.reduce(function(s,x){return s+x.n;},0);
    var h='<button type="button" class="rt-back" id="am-back">‹ Mis grupos</button><h3>Mis partidas</h3>'+
      '<p class="fine">Todo lo que juegas con tu cuenta queda guardado: el Axioma diario, los sudokus del día, tus retos, concursos y partidas en vivo.</p>'+
      '<div class="mt-kpis">'+kpi(ax.resueltos,"Axioma diario",ax.resueltos?"mejor: "+ax.mejor+" movidas":"")+kpi(sudT,"sudokus del día","")+kpi((r.granja||[]).length,"granjas del día",(r.granja||[]).length?"mejor: "+Math.max.apply(null,r.granja.map(function(g){return g.monedas;}))+" monedas":"")+
        kpi(r.retos.length,"retos","")+kpi(r.salas.length,"partidas en vivo",r.salas.filter(function(s){return s.puesto===1;}).length+" ganadas")+'</div>';
    h+='<h4>Axioma diario</h4>'+(ax.recientes.length?'<ul class="am-lista">'+ax.recientes.map(function(s){
        return '<li><b>Reto nº '+s.day+'</b>'+(s.day===ax.hoy?' <span class="chip activo">hoy</span>':'')+'<span>'+s.moves+' movidas'+(s.hints?' · '+s.hints+' pista'+(s.hints>1?'s':''):'')+(s.seconds?' · '+reloj(s.seconds):'')+'</span></li>';}).join("")+'</ul>':
      '<p class="fine">Todavía no has resuelto ningún Axioma diario con tu cuenta.</p>');
    h+='<h4>Sudoku</h4>'+(r.sudoku.niveles.length?'<p class="fine">'+r.sudoku.niveles.map(function(x){return esc(NIV[x.level]||x.level)+': '+x.n+' (mejor '+reloj(x.mejor)+')';}).join(" · ")+'</p>'+
      '<ul class="am-lista">'+r.sudoku.recientes.map(function(s){return '<li><b>Día '+s.day+' · '+esc(NIV[s.level]||"")+'</b><span>'+reloj(s.seconds)+(s.errors?' · '+s.errors+' error'+(s.errors>1?'es':''):'')+'</span></li>';}).join("")+'</ul>':
      '<p class="fine">Sin sudokus del día todavía.</p>');
    h+='<h4>Granja Express</h4>'+((r.granja||[]).length?'<ul class="am-lista">'+r.granja.map(function(g){
        return '<li><b>Granja del día '+g.dia+'</b><span>'+g.monedas+' monedas · '+g.entregas+' pedidos · nivel '+g.nivel+(g.intentos>1?' · '+g.intentos+' partidas':'')+'</span></li>';}).join("")+'</ul>':
      '<p class="fine">Todavía no has jugado la granja del día.</p>');
    h+='<h4>Retos</h4>'+(r.retos.length?r.retos.map(function(e){
        return '<button type="button" class="rt-card" data-reto="'+e.code+'"><span class="rt-card-top"><b>'+esc(e.nombre)+'</b><span class="chip">'+esc(JUEGO[e.juego]||e.juego)+'</span></span>'+
          '<small>'+e.jugadas+' de '+e.rondas+' rondas jugadas · '+e.jugadores+' jugadores · '+fecha(e.creado)+'</small></button>';}).join(""):'<p class="fine">Sin retos todavía.</p>');
    h+='<h4>Concursos y cuestionarios</h4>'+(r.concursos.length?r.concursos.map(function(c){
        return '<button type="button" class="rt-card" data-conc="'+c.code+'"><span class="rt-card-top"><b>'+esc(c.nombre)+'</b><span class="chip">'+(c.cuestionario?'Cuestionario':'Concurso')+'</span></span>'+
          '<small>'+(c.terminado?c.aciertos+' aciertos · '+c.errores+' errores':'sin terminar')+' · '+fecha(c.fecha)+'</small></button>';}).join(""):'<p class="fine">Sin concursos todavía.</p>');
    h+='<h4>Partidas en vivo</h4>'+(r.salas.length?'<ul class="am-lista">'+r.salas.map(function(s){
        var d=window.AxJuegos&&AxJuegos.def(s.juego);
        return '<li><b>'+esc(s.titulo||(d?d.nombre:s.juego))+'</b><span>'+(s.puesto?'puesto '+s.puesto+(s.jugadores?' de '+s.jugadores:''):'')+(s.puntos!=null?' · '+s.puntos+' pts':'')+' · '+fecha(s.fecha)+'</span></li>';}).join("")+'</ul>':
      '<p class="fine">Sin partidas en vivo todavía.</p>');
    pinta(h);
    $("am-back").onclick=function(){inicio();};
    var bs=panel.querySelectorAll("[data-reto]"),i; for(i=0;i<bs.length;i++)bs[i].onclick=function(){if(window.AxRetos)AxRetos.ficha(this.getAttribute("data-reto"));};
    bs=panel.querySelectorAll("[data-conc]"); for(i=0;i<bs.length;i++)bs[i].onclick=function(){var c=this.getAttribute("data-conc");AxApp.setMode("concurso");if(window.AxConcursos)AxConcursos.ficha(c);};
  }).catch(function(e){
    pinta('<button type="button" class="rt-back" id="am-back">‹ Mis grupos</button><p class="fine bad">'+esc(ERR(e))+'</p>');
    $("am-back").onclick=function(){inicio();};
  });
}
function kpi(v,t,s){return '<div class="mt-kpi"><b>'+esc(v)+'</b><span>'+esc(t)+'</span>'+(s?'<small>'+esc(s)+'</small>':'')+'</div>';}

window.AxAmigos={abrir:abrir,cerrar:cerrar,grupo:function(c){activo=true;panel.hidden=false;grupo(c);},historial:function(){activo=true;panel.hidden=false;historial();}};

/* ---------- enlace: ?grupo=CÓDIGO ---------- */
(function(){
  var q=new URLSearchParams(location.search), c=q.get("grupo");
  if(!c||!window.AxApp)return;
  c=c.toUpperCase().slice(0,6);
  try{history.replaceState(null,"",location.pathname);}catch(e){}
  var ido=false, ir=function(){ if(ido)return; ido=true; AxApp.setMode("amigos"); grupo(c); };
  if(window.AxAccount&&AxAccount.listo())ir(); else document.addEventListener("ax-user",ir);
})();
})();
