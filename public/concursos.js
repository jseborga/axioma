/* ===========================================================
   AXIOMA · Concursos de trivia (pantalla)
   Convocatorias con premio: te inscribes, juegas una sola vez hasta
   pasarte de los errores admitidos o acabar las preguntas, y al
   cerrarse se publica el ranking. Las preguntas llegan del servidor
   de una en una y sin la respuesta.
   =========================================================== */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var panel=$("concurso-panel");
if(!panel)return;

var NIVELES={1:"Fácil",2:"Medio",3:"Difícil",4:"Progresiva",5:"Mixta"};
var vista=null, refresco=null, reloj=null, desfase=0, teclas=null, activo=false;

/* ---------- utilidades ---------- */
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function api(path,body){
  return fetch(path,{method:body?"POST":"GET",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().then(function(j){if(!r.ok)throw j;return j;});});
}
function user(){return window.AxAccount&&AxAccount.user();}
function ahora(){return Date.now()+desfase;}
function pinta(h){panel.innerHTML=h;}
function para(){ if(refresco){clearTimeout(refresco);refresco=null;} if(reloj){clearInterval(reloj);reloj=null;}
  if(teclas){document.removeEventListener("keydown",teclas);teclas=null;} }
function fecha(ms){return new Date(ms).toLocaleString("es",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});}
function dura(ms){
  if(ms<=0)return "ahora";
  var s=Math.floor(ms/1000),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);
  if(d)return d+" d "+(h?h+" h":"");
  if(h)return h+" h "+(m?m+" min":"");
  if(m)return m+" min";
  return s+" s";
}
function tiempo(ms){var s=Math.round(ms/1000),m=Math.floor(s/60),g=s%60;return m+":"+(g<10?"0":"")+g;}
function avatar(u){return u.picture?'<img class="av" src="'+esc(u.picture)+'" alt="" referrerpolicy="no-referrer">':'<span class="av noimg"></span>';}
function enlace(code){return location.origin+location.pathname+"?concurso="+code;}
function ERR(e){if(e&&e.error==="practice_mode")return "Esta es una práctica: entra desde su ficha con «Empezar la práctica».";if(e&&e.error==="few_questions")return "En esas áreas hay "+e.available+" preguntas y hacen falta "+e.needed+": marca más áreas o elige menos preguntas.";
  return {not_configured:"Faltan las tablas de concursos en la base de datos. Hay que volver a ejecutar schema.sql (ver SETUP.md).",
  unauthorized:"Tienes que entrar con Google.",not_found:"No existe ningún concurso con ese código.",finished:"Ese concurso ya terminó.",
  not_registered:"Primero tienes que inscribirte.",not_started:"El concurso todavía no ha empezado.",bad_name:"Ponle un nombre.",
  bad_end:"El concurso tiene que durar entre 5 minutos y 31 días.",bad_start:"La fecha de inicio no es válida.",
  too_many:"Tienes demasiados concursos abiertos a la vez.",forbidden:"Solo quien lo organiza puede hacer eso.",
  profile_required:"Antes tienes que completar tu registro.",no_attempts:"Ya usaste todos tus intentos.",bad_result:"El resultado no es válido.",bad_time:"El tiempo no cuadra con el reloj del servidor.",busy:"Ya tienes una partida abriéndose.",already:"Esa partida ya estaba registrada.",edu_no_contests:"Las instituciones educativas no organizan concursos: usa exámenes y prácticas en sus cursos.",edu_bank:"Los bancos de las instituciones educativas son solo para sus exámenes y prácticas.",restricted:"Es solo para los miembros de su curso o institución.",
  consent_required:"Tienes menos de 18 años: para los concursos abiertos con premio hace falta el consentimiento de tu tutor o de tu institución.",
  org_pending:"La institución todavía no está aprobada.",
  google_required:"Esta convocatoria es para cuentas de Google: sal de la sesión de invitado y entra con Google.",
  guests_not_allowed:"Esta convocatoria no admite invitados."}[e&&e.error]||"No se pudo completar. Inténtalo otra vez.";}
function errTxt(n,max){return max&&n>=max?"Sin límite de errores: se responden todas":n===0?"Sin errores: el primer fallo termina la partida":n===1?"1 error admitido":n+" errores admitidos";}
function chip(c){
  var t=c.state==="pronto"?"Empieza en "+dura(c.starts_at-ahora()):c.state==="abierto"?"Termina en "+dura(c.ends_at-ahora()):"Terminado";
  return '<span class="chip '+(c.state==="abierto"?"activo":c.state)+'">'+t+'</span>';
}
function reglas(c){
  return NIVELES[c.level]+" · "+c.max_questions+(c.max_questions===100?" preguntas como máximo":" preguntas")+" · "+c.seconds_per_q+" s cada una · "+
         (c.max_errors===0?"sin errores":c.max_errors===1?"1 error admitido":c.max_errors+" errores admitidos")+(c.math?" · con cálculo":"");
}
function cab(){ $("hdr").textContent=vista&&vista.code?vista.code:"Trivia"; }
/* los exámenes y prácticas de un curso se juegan aquí, pero pertenecen a Educativo:
   la cabecera, el menú y la ayuda lo dicen, y no se mezclan con los concursos */
function seccion(educativo){
  var nom=educativo?"Educativo":"Concursos";
  if($("mode-label"))$("mode-label").textContent=nom;
  if($("status-cap"))$("status-cap").textContent=nom;
  document.body.setAttribute("data-mode",educativo?"aula":"concurso");
  if($("t-aula"))$("t-aula").setAttribute("aria-checked",String(!!educativo));
  if($("t-concurso"))$("t-concurso").setAttribute("aria-checked",String(!educativo));
}

/* ---------- entrada ---------- */
/* al volver a Concursos se retoma el último concurso visto, nunca un examen o una práctica (son de Educativo) */
function abrir(){ activo=true; panel.hidden=false; if(vista&&vista.camp)campana(vista.camp); else if(vista&&vista.code&&!vista.cuest)ficha(vista.code); else inicio(); }
function cerrar(){ activo=false; para(); panel.hidden=true; }
document.addEventListener("ax-user",function(){ if(activo&&vista&&!vista.jugando)(vista.camp?campana(vista.camp):vista.code?ficha(vista.code):inicio()); });

/* ---------- inicio ---------- */
function inicio(){ colorMarca(null); seccion(false);
  para(); vista={}; cab();
  var u=user(), conCuenta=window.AxAccount&&AxAccount.configurado&&AxAccount.configurado();
  pinta('<h3>Concursos de trivia</h3>'+
    '<p class="fine">Preguntas de cultura general y de cálculo. Te inscribes, juegas <b>una sola vez</b> hasta pasarte de los errores admitidos, y cuando se cierra el concurso se publica el ranking: quien más acierta se lleva el premio. <a href="#" data-guia="concurso">¿Cómo funciona?</a></p>'+
    (u?'<div class="actions"><button class="primary" id="cq-crear">Crear un concurso</button></div>'
      :conCuenta?'<div class="actions"><button class="primary" id="cq-login">Entrar con Google</button></div>':'')+
    '<form class="rt-join" id="cq-join"><input id="cq-code" placeholder="Código del concurso" maxlength="6" autocapitalize="characters" autocomplete="off" spellcheck="false"><button type="submit" class="ghost">Ver</button></form>'+
    '<div id="cq-listas"><p class="fine">Cargando…</p></div>');
  if($("cq-crear"))$("cq-crear").onclick=crear;
  if($("cq-login"))$("cq-login").onclick=function(){AxAccount.abrirCuenta();};
  $("cq-join").onsubmit=function(e){e.preventDefault();var c=$("cq-code").value.trim().toUpperCase();if(c.length===6)ficha(c);};
  api("/api/contests").then(function(r){
    if(!$("cq-listas"))return;          /* ya se abrió otra cosa (p. ej. una ficha) */
    desfase=r.now-Date.now();
    var h="";
    function tarjeta(c,extra){
      return '<button type="button" class="rt-card" data-code="'+c.code+'"><span class="rt-card-top"><b>'+esc(c.name)+'</b>'+chip(c)+'</span>'+
        '<small>'+(c.prize?'🏆 '+esc(c.prize)+' · ':'')+esc(reglas(c))+' · '+c.registered+(c.registered===1?" inscrito":" inscritos")+(extra||"")+'</small></button>';
    }
    if(r.mine.length){h+='<h4>Tus concursos</h4>';r.mine.forEach(function(c){
      var ex=c.owner?" · organizas tú":"";
      if(c.me&&c.me.finished)ex+=" · tu resultado: "+c.me.correct+" ✓";
      if(c.state==="terminado"&&c.winner)ex+=" · ganó "+esc(c.winner);
      h+=tarjeta(c,ex);});}
    h+='<h4>Abiertos</h4>';
    h+=r.open.length?r.open.map(function(c){return tarjeta(c);}).join(""):'<p class="fine">No hay concursos públicos abiertos ahora mismo.'+(u?' Crea uno.':'')+'</p>';
    if(r.recent.length){h+='<h4>Resultados</h4>';r.recent.forEach(function(c){h+=tarjeta(c,c.winner?" · ganó "+esc(c.winner):" · sin ganador");});}
    $("cq-listas").innerHTML=h;
    var bs=$("cq-listas").querySelectorAll(".rt-card"),i;
    for(i=0;i<bs.length;i++)bs[i].onclick=function(){ficha(this.getAttribute("data-code"));};
  }).catch(function(e){if($("cq-listas"))$("cq-listas").innerHTML='<p class="fine bad">'+esc(ERR(e))+'</p>';});
}

/* ---------- crear ---------- */
/* ejecuta una acción que exige registro completo; si falta, lo pide y reintenta */
function conRegistro(accion){
  return accion().catch(function(e){
    if(e&&e.error==="profile_required"&&window.AxRegistro)
      return AxRegistro.asegura().then(function(ok){ if(ok)return accion(); throw e; });
    throw e;
  });
}
function crear(){
  if(window.AxRegistro){ AxRegistro.asegura().then(function(ok){ if(ok)crearForm(); }); return; }
  crearForm();
}
function crearForm(){
  para(); vista={crear:true}; cab();
  pinta('<button type="button" class="rt-back" id="cq-back">‹ Concursos</button><h3>Crear un concurso</h3>'+
    '<form class="rt-form" id="cq-form">'+
    '<label>Nombre<input id="c-name" maxlength="60" required placeholder="Gran trivia de la fraternidad"></label>'+
    '<label>Premio para quien gane<input id="c-prize" maxlength="200" placeholder="Una cena para dos"></label>'+
    '<label>Descripción (opcional)<input id="c-desc" maxlength="300" placeholder="Solo para miembros; el premio se entrega el viernes"></label>'+
    '<div class="rt-2"><label>Dificultad<select id="c-level"><option value="1">Fácil</option><option value="2" selected>Medio</option><option value="3">Difícil</option><option value="4">Progresiva (empieza fácil y sube)</option></select></label>'+
    '<label>Errores admitidos<select id="c-err"><option value="0">Ninguno</option><option value="1">1</option><option value="2" selected>2</option><option value="3">3</option><option value="5">5</option></select></label></div>'+
    '<div class="rt-2"><label>Preguntas<select id="c-q"><option value="10">10</option><option value="20" selected>20</option><option value="30">30</option><option value="50">50</option><option value="100">Hasta quedar eliminado (máx. 100)</option></select></label>'+
    '<label>Tiempo por pregunta<select id="c-seg"><option value="10">10 s</option><option value="15" selected>15 s</option><option value="20">20 s</option><option value="30">30 s</option></select></label></div>'+
    '<label class="rt-check"><input type="checkbox" id="c-math" checked> Incluir operaciones matemáticas (una de cada cuatro)</label>'+
    (window.AxAreas?AxAreas.html("c-areas"):'')+
    '<div class="rt-2"><label>Empieza<select id="c-ini"><option value="0">Ahora</option><option value="15">En 15 minutos</option><option value="60">En 1 hora</option><option value="1440">Mañana a esta hora</option><option value="x">Elegir fecha y hora…</option></select></label>'+
    '<label>Dura<select id="c-dur"><option value="30">30 minutos</option><option value="60">1 hora</option><option value="180">3 horas</option><option value="1440" selected>1 día</option><option value="4320">3 días</option><option value="10080">1 semana</option><option value="x">Hasta fecha y hora…</option></select></label></div>'+
    '<div class="rt-2"><label id="c-ini-f-l" hidden>Fecha de inicio<input type="datetime-local" id="c-ini-f"></label>'+
    '<label id="c-fin-f-l" hidden>Fecha de cierre<input type="datetime-local" id="c-fin-f"></label></div>'+
    '<label>Visibilidad<select id="c-pub"><option value="1">Público: aparece en la lista de concursos</option><option value="0">Privado: solo con el código o el enlace</option></select></label>'+
    '<p class="fine" id="c-resumen"></p>'+
    '<div class="actions"><button class="primary" type="submit" id="c-go">Publicar el concurso</button></div><p class="msg" id="c-msg"></p></form>');
  $("cq-back").onclick=inicio;
  function local(ms){var d=new Date(ms-new Date(ms).getTimezoneOffset()*60000);return d.toISOString().slice(0,16);}
  function fechas(){
    var base=Date.now(), ini, fin;
    ini=$("c-ini").value==="x"?new Date($("c-ini-f").value).getTime():base+(+$("c-ini").value)*60000;
    fin=$("c-dur").value==="x"?new Date($("c-fin-f").value).getTime():ini+(+$("c-dur").value)*60000;
    return {ini:ini,fin:fin};
  }
  function resumen(){
    $("c-ini-f-l").hidden=$("c-ini").value!=="x"; $("c-fin-f-l").hidden=$("c-dur").value!=="x";
    if($("c-ini").value==="x"&&!$("c-ini-f").value)$("c-ini-f").value=local(Date.now()+3600000);
    if($("c-dur").value==="x"&&!$("c-fin-f").value)$("c-fin-f").value=local(Date.now()+86400000);
    var f=fechas(), e=+$("c-err").value;
    $("c-resumen").textContent=isNaN(f.ini)||isNaN(f.fin)?"":
      "Se podrá jugar del "+fecha(f.ini)+" al "+fecha(f.fin)+". Cada persona juega una vez; "+
      (e===0?"el primer fallo termina su partida":"con el fallo número "+(e+1)+" termina su partida")+
      ". Al cierre se publica el ranking: más aciertos, luego menos errores, luego menos tiempo y, si aún hay empate, quien empezó antes.";
  }
  if(window.AxAreas)AxAreas.pinta($("c-areas"),[]);
  ["c-ini","c-dur","c-err","c-ini-f","c-fin-f"].forEach(function(id){$(id).onchange=resumen;});
  resumen();
  $("cq-form").onsubmit=function(e){
    e.preventDefault();
    var f=fechas(), msg=$("c-msg"), go=$("c-go");
    if(isNaN(f.ini)||isNaN(f.fin)){msg.className="msg bad";msg.textContent="Revisa las fechas.";return;}
    go.disabled=true; msg.className="msg"; msg.textContent="Publicando…";
    conRegistro(function(){return api("/api/contests",{name:$("c-name").value,prize:$("c-prize").value,description:$("c-desc").value,level:+$("c-level").value,
      max_errors:+$("c-err").value,max_questions:+$("c-q").value,seconds_per_q:+$("c-seg").value,math:$("c-math").checked,
      public:$("c-pub").value==="1",starts_at:f.ini,ends_at:f.fin,areas:window.AxAreas?AxAreas.lee($("c-areas")):[]});})
      .then(function(r){ficha(r.code,true);})
      .catch(function(er){go.disabled=false;msg.className="msg bad";msg.textContent=ERR(er);});
  };
}

/* ---------- ficha ---------- */
function colorMarca(c){
  panel.style.removeProperty("--accent"); panel.style.removeProperty("--accent-tint");
  if(c&&c.brand&&/^#[0-9a-f]{6}$/i.test(c.brand.color||"")){panel.style.setProperty("--accent",c.brand.color);panel.style.setProperty("--accent-tint",c.brand.color+"26");}
}
function ficha(code,recien){
  para(); vista={code:code}; cab();
  api("/api/contests/"+code).then(function(c){
    desfase=c.now-Date.now(); colorMarca(c);
    var u=user(), me=c.me, cuest=c.kind==="cuestionario", volver=c.course_code?"‹ Volver al curso":"‹ Concursos";
    seccion(cuest); if(vista&&vista.code===code)vista.cuest=cuest;
    if(c.brand)volver="‹ "+c.org_name;
    var h='<button type="button" class="rt-back" id="cq-back">'+esc(volver)+'</button>'+
      (c.brand?'<div class="cq-marca">'+(c.brand.logo?'<img src="'+esc(c.brand.logo)+'" alt="">':'')+'<span>Convocatoria de <b>'+esc(c.org_name)+'</b></span></div>':'')+
      '<div class="rt-head"><h3>'+esc(c.name)+'</h3>'+chip(c)+'</div>'+
      (c.course_code||c.org_name?'<p class="cq-ambito">'+(cuest?"Cuestionario":"Concurso")+
        (c.course_name?' · '+esc(c.course_name)+(c.course_term?' ('+esc(c.course_term)+')':''):'')+
        (c.org_name?' · '+esc(c.org_name):'')+(c.partial?' · <b>'+esc(c.partial)+'</b>':'')+'</p>':'')+
      '<p class="rt-meta">'+(cuest?'Docente: ':'Organiza ')+esc(c.owner?"tú":c.owner_name)+' · '+c.registered+(c.registered===1?" inscrito":" inscritos")+
        (c.played?' · '+c.played+' ya '+(c.played===1?"jugó":"jugaron"):'')+'</p>'+
      (c.prize?'<p class="rt-prize">🏆 '+esc(c.prize)+'</p>':'')+
      (c.description?'<p>'+esc(c.description)+'</p>':'')+
      '<div class="cq-reglas">'+
        '<div><small>Dificultad</small><b>'+NIVELES[c.level]+'</b></div>'+
        '<div><small>Errores</small><b>'+(c.max_errors>=c.max_questions?"Sin límite":c.max_errors===0?"Ninguno":c.max_errors)+'</b></div>'+
        '<div><small>Preguntas</small><b>'+(c.max_questions===100?"Hasta 100":c.max_questions)+'</b></div>'+
        '<div><small>Por pregunta</small><b>'+segTxt(c.seconds_per_q)+'</b></div>'+
      '</div>'+
      '<p class="fine">'+(c.state==="terminado"?"Terminó el "+fecha(c.ends_at)+".":"Del "+fecha(c.starts_at)+" al "+fecha(c.ends_at)+".")+
        (c.math?" Incluye operaciones matemáticas.":"")+(c.areas&&c.areas.length?" Áreas: "+esc(c.areas.join(", "))+".":"")+'</p>';

    if(c.manage)h+='<div class="actions"><button type="button" class="primary" id="cq-registros">Registros y estadísticas</button>'+
      (cuest?'<button type="button" class="ghost" id="cq-revisar">Por revisar'+(c.to_review?' ('+c.to_review+')':'')+'</button>':'')+'</div>';
    if(c.state!=="terminado"&&!cuest)h+='<div class="rt-code"><span>Código</span><b>'+c.code+'</b><button type="button" class="ghost" id="cq-copy">Copiar enlace</button>'+
      (window.AxQR?'<button type="button" class="ghost" id="cq-qr">QR</button>':'')+
      (navigator.share?'<button type="button" class="ghost" id="cq-share">Invitar</button>':'')+'</div>';
    if(recien)h+='<p class="fine ok">Concurso publicado. Comparte el código o el enlace para que la gente se inscriba.</p>';

    if(c.modo==="practica"){
      h+=practicaFicha(c,u);
    }else if(c.state==="terminado"&&cuest){
      h+=(me&&me.started?'<div class="cq-mio"><small>Tu resultado</small><b>'+me.correct+' aciertos · '+me.errors+(me.errors===1?" error":" errores")+'</b>'+
          '<span>'+motivo(me.reason)+' · '+tiempo(me.total_ms)+' respondiendo</span></div>'+
          (me.pending?'<p class="rt-hoy">'+me.pending+(me.pending===1?' respuesta escrita está':' respuestas escritas están')+' por revisar: tu nota puede subir.</p>':''):'<p class="rt-hoy">No participaste en este cuestionario.</p>')+
         revisionHtml(c.review);
    }else if(c.state==="terminado"){
      h+=resultado(c);
    }else if(!u&&c.guests){
      h+='<div class="actions"><button class="primary" id="cq-inv">Participar con mi teléfono o correo</button></div>'+
         (window.AxAccount&&AxAccount.configurado()?'<div class="actions"><button class="ghost" id="cq-login">o entra con Google</button></div>':'')+
         '<p class="fine">Sin cuenta: te damos un código para comprobar que eres tú. Con cada teléfono o correo se participa una sola vez.</p>';
    }else if(!u){
      h+=(window.AxAccount&&AxAccount.configurado()?'<div class="actions"><button class="primary" id="cq-login">Entrar con Google para inscribirte</button></div>':
         '<p class="fine">El inicio de sesión no está configurado en esta instalación.</p>');
    }else if(!me&&u.guest&&!c.guests){
      h+='<p class="rt-hoy">'+ERR({error:"google_required"})+'</p><div class="actions"><button class="ghost" id="cq-login">Mi cuenta</button></div>';
    }else if(!me){
      var mk=c.org_id&&(c.audience==="publico"||c.audience==="enlace")&&!u.guest;
      h+=(mk?'<label class="rt-check cq-mk"><input type="checkbox" id="cq-mk"> <span>Acepto que '+esc(c.org_name||"quien organiza")+' me contacte con novedades y promociones (opcional).</span></label>':'')+
         '<div class="actions"><button class="primary" id="cq-inscribir">Inscribirme</button></div>'+
         '<p class="fine">Inscribirte no te obliga a jugar ya: podrás hacerlo en cualquier momento hasta el cierre.</p>';
    }else if(me.finished){
      h+='<div class="cq-mio"><small>Tu participación</small><b>'+me.correct+' aciertos · '+me.errors+(me.errors===1?" error":" errores")+'</b>'+
         '<span>'+motivo(me.reason)+' · '+tiempo(me.total_ms)+' respondiendo</span></div>'+
         '<p class="fine">'+(cuest?'Las respuestas correctas se publican al cierre, el ':'El ranking se publica al cierre, el ')+fecha(c.ends_at)+'.</p>';
    }else if(c.state==="pronto"){
      h+='<p class="rt-hoy ok">Estás inscrito. Podrás jugar a partir del '+fecha(c.starts_at)+'.</p>';
    }else if(me.started){
      h+='<div class="actions"><button class="primary" id="cq-jugar">Continuar mi partida</button></div>'+
         '<p class="fine">Tu partida está a medias. Si la pregunta pendiente se quedó sin tiempo, cuenta como fallo.</p>';
    }else{
      h+='<div class="actions"><button class="primary" id="cq-jugar">Jugar ahora</button></div>'+
         '<p class="fine"><b>Solo tienes una oportunidad.</b> En cuanto aparezca la primera pregunta ya cuenta como tu participación, aunque salgas. '+
         errTxt(c.max_errors)+'.</p>';
    }
    if(c.manage&&c.state!=="terminado")h+='<div class="actions"><button type="button" class="ghost" id="cq-cerrar">'+
      (cuest?'Cerrar el cuestionario ahora':'Cerrar el concurso ahora y publicar el ranking')+'</button></div>';
    pinta(h);

    $("cq-back").onclick=function(){
      if(c.brand&&window.AxMarca){AxMarca.ver(c.brand.slug);return;}
      if(c.course_code&&window.AxAula){AxApp.setMode("aula");AxAula.curso(c.course_code);} else if(cuest)AxApp.setMode("aula"); else inicio(); };
    if($("cq-registros"))$("cq-registros").onclick=function(){registros(c);};
    if($("cq-revisar"))$("cq-revisar").onclick=function(){revisar(c);};
    if($("cq-practica"))$("cq-practica").onclick=function(){practicar(c);};
    if($("cq-copy"))$("cq-copy").onclick=function(){var b=this,t=enlace(c.code);
      if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){b.textContent="Copiado";setTimeout(function(){b.textContent="Copiar enlace";},1400);});
      else prompt("Copia el enlace:",t);};
    if($("cq-share"))$("cq-share").onclick=function(){navigator.share({text:"Participa en «"+c.name+"»"+(c.prize?" y gana "+c.prize:"")+": "+enlace(c.code)}).catch(function(){});};
    if($("cq-login"))$("cq-login").onclick=function(){AxAccount.abrirCuenta();};
    if($("cq-inscribir"))$("cq-inscribir").onclick=function(){this.disabled=true;
      var cuerpo=$("cq-mk")?{marketing:$("cq-mk").checked}:{};
      conRegistro(function(){return api("/api/contests/"+code+"/join",cuerpo);}).then(function(){ficha(code);}).catch(function(e){alert(ERR(e));ficha(code);});};
    if($("cq-inv"))$("cq-inv").onclick=function(){
      AxInvitado.abre({code:code,org_name:c.org_name,prize:c.prize}).then(function(ok){
        if(!ok)return;
        api("/api/contests/"+code+"/join",{}).then(function(){ficha(code);}).catch(function(e){alert(ERR(e));ficha(code);});
      });};
    if($("cq-qr"))$("cq-qr").onclick=function(){AxQR.abre({url:enlace(c.code),titulo:c.name,subtitulo:c.prize?"Premio: "+c.prize:"",marca:c.org_name||"",
      color:c.brand&&c.brand.color,logo:c.brand&&c.brand.logo,directo:true});};
    if($("cq-jugar"))$("cq-jugar").onclick=function(){juego(c);};
    if($("cq-cerrar"))$("cq-cerrar").onclick=function(){
      if(!confirm(cuest?"¿Cerrar «"+c.name+"» ahora? Nadie más podrá responder y cada estudiante verá sus respuestas.":"¿Cerrar «"+c.name+"» ahora? Nadie más podrá jugar y se publicará el ranking."))return;
      api("/api/contests/"+code+"/close",{}).then(function(){ficha(code);}).catch(function(e){alert(ERR(e));});};
    /* mientras está abierto se refresca solo; al llegar el cierre aparece el ranking */
    if(c.state!=="terminado"){
      var falta=(c.state==="pronto"?c.starts_at:c.ends_at)-ahora();
      refresco=setTimeout(function(){ if(activo&&vista&&vista.code===code&&!vista.jugando)ficha(code); },Math.max(1000,Math.min(20000,falta+800)));
    }
  }).catch(function(e){
    if(e&&e.error==="restricted"){
      var ec=e.kind==="cuestionario"; seccion(ec);
      pinta('<button type="button" class="rt-back" id="cq-back">‹ '+(ec?'Educativo':'Concursos')+'</button><h3>'+esc(e.name)+'</h3>'+
        '<p>'+(e.kind==="cuestionario"?"Este cuestionario":"Este concurso")+' es solo para '+
        (e.course_name?'el curso <b>'+esc(e.course_name)+'</b>':'los miembros de <b>'+esc(e.org_name)+'</b>')+'.</p>'+
        (e.course_code?'<div class="actions"><button class="primary" id="cq-curso">Ir al curso para unirme</button></div>':'')+
        (user()?'':'<p class="fine">Si ya perteneces, entra con Google.</p>'));
      $("cq-back").onclick=ec?function(){AxApp.setMode("aula");}:inicio;
      if($("cq-curso"))$("cq-curso").onclick=function(){AxApp.setMode("aula");AxAula.curso(e.course_code);};
      return;
    }
    pinta('<button type="button" class="rt-back" id="cq-back">‹ Concursos</button><p class="fine bad">'+esc(ERR(e))+'</p>');
    $("cq-back").onclick=inicio;
  });
}
/* ---------- tipos de pregunta: opción (con o sin imágenes), V/F, numérica y texto libre ---------- */
function imgPregunta(q){return q.img?'<img class="cq-img" src="'+esc(q.img)+'" alt="Imagen de la pregunta">':'';}
function escrita(q){return q.tipo==="numerica"||q.tipo==="abierta";}
function respuestaHtml(q){
  if(q.tipo==="numerica")return '<form class="cq-escribe" id="cq-escribe"><input id="cq-v" inputmode="decimal" autocomplete="off" maxlength="40" placeholder="Tu respuesta (un número)" aria-label="Tu respuesta">'+
    '<button class="primary" type="submit">Responder</button></form>';
  if(q.tipo==="abierta")return '<form class="cq-escribe abierta" id="cq-escribe"><textarea id="cq-t" rows="5" maxlength="4000" placeholder="Escribe tu respuesta…" aria-label="Tu respuesta"></textarea>'+
    '<button class="primary" type="submit">Enviar respuesta</button><p class="fine">Esta respuesta la revisa tu docente.</p></form>';
  var conImg=q.oimg&&q.oimg.some(Boolean);
  return '<div class="rp-opts'+(conImg?' con-img':'')+'">'+q.o.map(function(o,k){var im=q.oimg&&q.oimg[k];
    return '<button type="button" class="rp-opt" data-k="'+k+'">'+(im?'<img src="'+esc(im)+'" alt="">':'')+esc(o)+'</button>';}).join("")+'</div>';
}
function segTxt(s){return s>=60?(s%60?Math.floor(s/60)+" min "+(s%60)+" s":(s/60)+" min"):s+" s";}

/* ---------- prácticas: intentos ilimitados y corrección al momento ---------- */
function practicaFicha(c,u){
  var p=c.practica||{}, h='<div class="cq-mio"><small>Práctica · intentos ilimitados</small><b>'+(p.attempts?'Tu mejor intento: '+p.best+' %':'Todavía no la has hecho')+'</b>'+
    '<span>'+(p.attempts?p.attempts+(p.attempts===1?' intento':' intentos'):'Se corrige al momento y cuenta tu mejor intento')+'</span></div>';
  if(c.state==="abierto"&&u)h+='<div class="actions"><button class="primary" id="cq-practica">'+(p.attempts?'Practicar otra vez':'Empezar la práctica')+'</button></div>'+
    '<p class="fine">Cada intento trae preguntas al azar. Tras cada respuesta ves si acertaste, la correcta y, si la hay, una explicación. Tu docente ve tu mejor intento en la libreta.</p>';
  else if(c.state==="pronto")h+='<p class="rt-hoy">Se abre el '+fecha(c.starts_at)+'.</p>';
  else if(c.state==="terminado")h+='<p class="rt-hoy">La práctica está cerrada.</p>';
  else h+='<p class="fine">Entra con tu cuenta para practicar.</p>';
  return h;
}
function practicar(c){
  para(); vista={code:c.code};
  pinta('<p class="fine">Preparando la práctica…</p>');
  api("/api/contests/"+c.code+"/practica").then(function(r){
    var i=0, bien=0, t0=Date.now(), n=r.questions.length;
    function salir(){$("cq-back").onclick=function(){if(i===0||confirm("¿Dejar la práctica? Este intento no se guardará."))ficha(c.code);};}
    function una(){
      var q=r.questions[i];
      pinta('<button type="button" class="rt-back" id="cq-back">‹ Salir de la práctica</button>'+
        '<div class="rt-head"><h3>Pregunta '+(i+1)+' <small>de '+n+'</small></h3><span class="chip activo">'+bien+' ✓</span></div>'+
        (q.cat?'<p class="cq-cat">'+esc(q.cat)+'</p>':'')+'<p class="rp-q">'+esc(q.q)+'</p>'+imgPregunta(q)+respuestaHtml(q)+'<div id="pr-fb"></div>');
      salir();
      var dato=q.dato?'<div class="vv-dato"><b>💡 '+(c.from_bank?'Desarrollo':'¿Sabías que…?')+'</b> '+esc(q.dato).replace(/\n/g,"<br>")+'</div>':'';
      function sigue(ok,extra){ if(ok)bien++;
        $("pr-fb").innerHTML='<div class="vv-res '+(ok?'bien':'mal')+'"><b>'+(ok?'¡Correcto!':'Incorrecto')+'</b>'+(extra||'')+'</div>'+dato+
          '<div class="actions"><button class="primary" id="pr-sig">'+(i+1<n?'Siguiente':'Ver mi resultado')+'</button></div>';
        $("pr-sig").onclick=function(){i++; if(i<n)una(); else fin();};
        $("pr-sig").focus();
      }
      if(q.tipo==="numerica")$("cq-escribe").onsubmit=function(e){e.preventDefault(); var v=$("cq-v").value; if(!v.trim())return;
        $("cq-v").disabled=true; this.querySelector("button").disabled=true;
        var ok=window.AxBanco&&AxBanco.numeroOk(v,q.num);
        sigue(ok,ok?'':'<span>La correcta: '+esc(String(q.num.v).replace(".",","))+(q.num.tol?' ± '+esc(String(q.num.tol).replace(".",",")):'')+'</span>');};
      else if(q.tipo==="abierta")$("cq-escribe").onsubmit=function(e){e.preventDefault(); if(!$("cq-t").value.trim())return;
        $("cq-t").disabled=true; this.querySelector("button").disabled=true;
        /* texto libre: se compara con la respuesta modelo y cada uno decide */
        $("pr-fb").innerHTML='<div class="vv-dato"><b>Respuesta modelo</b> '+(q.modelo?esc(q.modelo):'(el docente no dejó una)')+'</div>'+dato+
          '<p class="fine">¿Tu respuesta era correcta?</p><div class="actions"><button class="primary" id="pr-si">Sí, la tenía bien</button><button class="ghost" id="pr-no">No</button></div>';
        dato=""; $("pr-si").onclick=function(){sigue(true);}; $("pr-no").onclick=function(){sigue(false);};};
      else{
        var bs=panel.querySelectorAll(".rp-opt"),j;
        for(j=0;j<bs.length;j++)bs[j].onclick=function(){
          var k=+this.getAttribute("data-k"), ok=k===q.c;
          for(var x=0;x<bs.length;x++){bs[x].disabled=true; if(x===q.c)bs[x].classList.add("ok"); else if(x===k)bs[x].classList.add("mal");}
          sigue(ok,ok?'':'<span>La correcta: '+esc(q.o[q.c])+'</span>');
        };
      }
    }
    function fin(){
      pinta('<button type="button" class="rt-back" id="cq-back">‹ Volver a la práctica</button>'+
        '<div class="cq-mio"><small>Resultado del intento</small><b>'+bien+' de '+n+'</b><span>'+Math.round(100*bien/n)+' %</span></div>'+
        '<p class="fine" id="pr-guarda">Guardando…</p><div class="actions"><button class="primary" id="pr-otra">Otra vez</button></div>');
      $("cq-back").onclick=function(){ficha(c.code);}; $("pr-otra").onclick=function(){practicar(c);};
      api("/api/contests/"+c.code+"/practica",{aciertos:bien,total:n,ms:Date.now()-t0})
        .then(function(x){$("pr-guarda").textContent="Guardado. Tu mejor intento: "+x.best+" % · "+x.attempts+(x.attempts===1?" intento.":" intentos.");})
        .catch(function(e){var g=$("pr-guarda"); g.className="fine bad"; g.textContent=ERR(e);});
    }
    una();
  }).catch(function(e){pinta('<button type="button" class="rt-back" id="cq-back">‹ Volver</button><p class="fine bad">'+esc(ERR(e))+'</p>');$("cq-back").onclick=function(){ficha(c.code);};});
}
function motivo(r){return r==="errores"?"Superaste los errores admitidos":r==="completo"?"Respondiste todas las preguntas":r==="tiempo"?"Se cerró el concurso":"";}

function revisionHtml(rv){
  if(!rv||!rv.length)return "";
  var h='<details class="cq-review"><summary>Tus respuestas ('+rv.filter(function(x){return x.ok;}).length+' de '+rv.length+')</summary><ol>';
  rv.forEach(function(x){
    var linea;
    if(x.tipo==="abierta")linea='<span>'+(x.pending?'⏳ Por revisar':x.ok?'✓ Correcta':'✗ Incorrecta')+'</span><span class="cq-tuya">Tu respuesta: '+(x.chosen===null?"sin responder a tiempo":esc(x.chosen))+'</span>'+
      (x.comment?'<span class="cq-coment">Comentario del docente: '+esc(x.comment)+'</span>':'')+(x.answer?'<span>Respuesta modelo: '+esc(x.answer)+'</span>':'');
    else linea=x.ok?'<span>✓ '+esc(x.answer)+(x.tipo==="numerica"&&x.chosen?' (escribiste '+esc(x.chosen)+')':'')+'</span>':
      '<span>✗ '+(x.chosen===null?"sin responder a tiempo":esc(x.chosen))+' · correcta: <b>'+esc(x.answer)+'</b></span>';
    h+='<li class="'+(x.pending?"pend":x.ok?"ok":"mal")+'"><small>'+esc(x.cat)+'</small><b>'+esc(x.q)+'</b>'+(x.img?'<img class="cq-img mini" src="'+esc(x.img)+'" alt="">':'')+linea+
      (x.desarrollo?'<details class="cq-des"><summary>Desarrollo</summary><p>'+esc(x.desarrollo).replace(/\n/g,"<br>")+'</p></details>':'')+
      (x.dato?'<em class="cq-dato">💡 ¿Sabías que…? '+esc(x.dato)+'</em>':'')+'</li>';
  });
  return h+'</ol></details>';
}

/* ---------- respuestas de texto libre: el docente las califica ---------- */
function revisar(c){
  para(); vista={code:c.code};
  pinta('<p class="fine">Cargando…</p>');
  api("/api/contests/"+c.code+"/revisar").then(function(r){
    var h='<button type="button" class="rt-back" id="cq-back">‹ '+esc(c.name)+'</button><h3>Respuestas por revisar</h3>'+
      '<p class="fine">'+(r.answers.length?r.pending+' pendiente'+(r.pending===1?'':'s')+' de '+r.answers.length+'. Al marcar «Correcta» se suma un acierto a la nota de esa persona (y se resta si luego la cambias).':'Este cuestionario no tiene respuestas de texto libre.')+'</p>';
    h+=r.answers.map(function(x,i){
      return '<div class="au-caja cq-rev '+x.estado+'" id="rv-'+i+'"><small>'+esc(x.name)+' · pregunta '+x.n+'</small><b>'+esc(x.q)+'</b>'+(x.img?'<img class="cq-img mini" src="'+esc(x.img)+'" alt="">':'')+
        '<p class="cq-tuya">'+esc(x.texto).replace(/\n/g,"<br>")+'</p>'+
        (x.modelo?'<p class="fine">Respuesta modelo: '+esc(x.modelo)+'</p>':'')+
        '<input class="rv-com" maxlength="300" placeholder="Comentario para la persona (opcional)" value="'+esc(x.comentario)+'">'+
        '<div class="actions"><button type="button" class="'+(x.estado==="correcta"?"primary":"ghost")+'" data-rv="'+i+'" data-est="correcta">✓ Correcta</button>'+
        '<button type="button" class="'+(x.estado==="incorrecta"?"primary":"ghost")+'" data-rv="'+i+'" data-est="incorrecta">✗ Incorrecta</button>'+
        '<span class="chip '+(x.estado==="pendiente"?"pronto":"activo")+'">'+{pendiente:"Pendiente",correcta:"Correcta",incorrecta:"Incorrecta"}[x.estado]+'</span></div></div>';}).join("");
    pinta(h);
    $("cq-back").onclick=function(){ficha(c.code);};
    panel.querySelectorAll("[data-rv]").forEach(function(b){b.onclick=function(){
      var i=+this.getAttribute("data-rv"), x=r.answers[i], est=this.getAttribute("data-est"), caja=$("rv-"+i);
      api("/api/contests/"+c.code+"/revisar",{user_id:x.user_id,idx:x.idx,estado:est,comentario:caja.querySelector(".rv-com").value})
        .then(function(){x.estado=est; caja.className="au-caja cq-rev "+est;
          caja.querySelectorAll("[data-rv]").forEach(function(y){y.className=y.getAttribute("data-est")===est?"primary":"ghost";});
          var ch=caja.querySelector(".chip"); ch.className="chip activo"; ch.textContent=est==="correcta"?"Correcta":"Incorrecta";})
        .catch(function(e){alert(ERR(e));});};});
  }).catch(function(e){pinta('<button type="button" class="rt-back" id="cq-back">‹ Volver</button><p class="fine bad">'+esc(ERR(e))+'</p>');$("cq-back").onclick=function(){ficha(c.code);};});
}

/* ---------- registros para quien gestiona ---------- */
function registros(c){
  para(); vista={code:c.code,registros:true}; cab();
  pinta('<p class="fine">Cargando registros…</p>');
  api("/api/contests/"+c.code+"/results").then(function(r){
    var jugaron=r.rows.filter(function(x){return x.started_at;}).length;
    var h='<button type="button" class="rt-back" id="cq-back">‹ Volver</button>'+
      '<div class="rt-head"><h3>Registros · '+esc(r.name)+'</h3>'+chip(r)+'</div>'+
      '<p class="rt-meta">'+(r.course_name?esc(r.course_name)+(r.course_term?' ('+esc(r.course_term)+')':'')+' · ':'')+(r.partial?esc(r.partial)+' · ':'')+
        jugaron+' de '+r.rows.length+' participaron</p>'+
      '<div class="actions"><button class="primary" id="cq-xlsx">Descargar Excel</button></div>';
    if(!r.rows.length)h+='<p class="fine">Todavía no hay nadie.</p>';
    else{
      var curso=!!r.course_code;
      h+='<div class="tabla-wrap"><table class="tabla"><thead><tr><th>#</th><th>'+(curso?"Estudiante":"Participante")+'</th><th>'+(curso?"Registro":"Contacto")+'</th><th>Aciertos</th><th>Errores</th><th>Resp.</th><th>Tiempo</th><th>Estado</th></tr></thead><tbody>';
      r.rows.forEach(function(x){
        var contacto=curso?esc(x.student_code||"—"):(esc(x.phone||x.email||"—")+'<small>'+(x.guest?"Invitado · "+(x.verified_by==="prueba"?"código de prueba":"verificado"):"Google")+
          (x.marketing===true?" · acepta contacto":"")+'</small>');
        h+='<tr class="'+(x.status==="no participó"?"apagada":"")+'"><td>'+(x.rank||"—")+'</td><td>'+esc(x.name)+(curso?'<small>'+esc(x.email)+'</small>':'')+'</td><td>'+contacto+'</td>'+
          '<td><b>'+(x.started_at?x.correct:"—")+'</b></td><td>'+(x.started_at?x.errors:"—")+'</td><td>'+(x.started_at?x.answered:"—")+'</td>'+
          '<td>'+(x.started_at?tiempo(x.total_ms):"—")+'</td><td>'+esc(x.status)+'</td></tr>';
      });
      h+='</tbody></table></div>';
    }
    if(r.questions.length){
      h+='<h4>Preguntas, de la más fallada a la más acertada</h4><ol class="cq-est">';
      r.questions.forEach(function(q){
        h+='<li><div><b>'+esc(q.q)+'</b><small>'+esc(q.cat||"")+(q.level?' · '+({1:"fácil",2:"media",3:"difícil"}[q.level]||""):'')+' · '+q.correct+' de '+q.answered+'</small></div>'+
           '<span class="cq-barra"><i style="width:'+q.pct+'%" class="'+(q.pct<50?"baja":q.pct<75?"media":"alta")+'"></i><em>'+q.pct+' %</em></span></li>';
      });
      h+='</ol>';
    }
    pinta(h);
    $("cq-back").onclick=function(){ficha(c.code);};
    $("cq-xlsx").onclick=function(){
      var filas=[["Puesto","Participante","Correo","Teléfono","Registro","Tipo","Verificación","Acepta contacto","Aciertos","Errores","Respondidas","Tiempo (s)","Estado","Motivo del final","Inicio","Fin"]];
      r.rows.forEach(function(x){
        filas.push([x.rank||"",x.name,x.email||"",x.phone||"",x.student_code||"",x.guest?"Invitado":"Google",x.verified_by==="prueba"?"Código de prueba":x.guest?"Código":"Google",
          x.marketing===true?"Sí":x.marketing===false?"No":"",x.started_at?x.correct:"",x.started_at?x.errors:"",x.started_at?x.answered:"",
          x.started_at?Math.round(x.total_ms/1000):"",x.status,motivo(x.reason),x.started_at?new Date(x.started_at).toLocaleString("es"):"",
          x.finished_at?new Date(x.finished_at).toLocaleString("es"):""]);
      });
      var pq=[["Pregunta","Tema","Nivel","Respondida por","Aciertos","% de acierto"]];
      r.questions.forEach(function(q){pq.push([q.q,q.cat||"",q.level?({1:"Fácil",2:"Medio",3:"Difícil"}[q.level]):"",q.answered,q.correct,q.pct]);});
      var blob=AxExcel.escribir([{nombre:"Resultados",filas:filas,anchos:[8,28,28,16,14,10,16,14,10,10,12,11,14,26,20,20]},{nombre:"Preguntas",filas:pq,anchos:[60,20,10,14,10,12]}]);
      AxExcel.descarga(blob,(r.name+(r.partial?" - "+r.partial:"")).replace(/[\\/:*?"<>|]+/g," ").trim()+".xlsx");
    };
  }).catch(function(e){pinta('<p class="fine bad">'+esc(ERR(e))+'</p>');});
}

function resultado(c){
  var h="";
  if(c.winner)h+='<div class="cq-ganador">'+avatar(c.winner)+'<div><small>Gana</small><b>'+esc(c.winner.name)+'</b>'+
    '<span>'+c.winner.correct+' aciertos · '+c.winner.errors+(c.winner.errors===1?" error":" errores")+' · '+tiempo(c.winner.total_ms)+'</span>'+
    (c.prize?'<span class="cq-premio">🏆 '+esc(c.prize)+'</span>':'')+'</div></div>';
  else h+='<p class="rt-hoy">Nadie acertó ninguna pregunta: no hay ganador.</p>';
  h+='<h4>Ranking</h4>';
  if(!c.ranking.length)h+='<p class="fine">Nadie llegó a jugar.</p>';
  else{
    h+='<ol class="rt-rank">';
    c.ranking.forEach(function(p){
      h+='<li'+(p.me?' class="me"':'')+'><span class="pos">'+p.rank+'</span>'+avatar(p)+'<span class="who">'+esc(p.name)+(p.me?' <em>(tú)</em>':'')+'</span>'+
         '<span class="pts"><b>'+p.correct+' ✓</b><small>'+p.errors+' ✗ · '+tiempo(p.total_ms)+'</small></span></li>';
    });
    h+='</ol>';
    if(c.my_rank)h+='<p class="fine">Tu puesto: <b>#'+c.my_rank+'</b>.</p>';
  }
  h+='<p class="fine">Orden: más aciertos; a igualdad, menos errores; luego menos tiempo respondiendo y, si aún empatan, quien empezó antes.</p>';
  if(c.review&&c.review.length){
    h+='<details class="cq-review"><summary>Tus respuestas ('+c.review.filter(function(x){return x.ok;}).length+' de '+c.review.length+')</summary><ol>';
    c.review.forEach(function(x){
      h+='<li class="'+(x.ok?"ok":"mal")+'"><small>'+esc(x.cat)+'</small><b>'+esc(x.q)+'</b>'+
        (x.ok?'<span>✓ '+esc(x.answer)+'</span>':'<span>✗ '+(x.chosen===null?"sin responder a tiempo":esc(x.chosen))+' · correcta: <b>'+esc(x.answer)+'</b></span>')+
      (x.dato?'<em class="cq-dato">💡 ¿Sabías que…? '+esc(x.dato)+'</em>':'')+'</li>';
    });
    h+='</ol></details>';
  }
  return h;
}

/* ---------- partida ---------- */
function juego(c){
  para(); vista={code:c.code,jugando:true}; cab();
  var espera=false;
  function carga(){
    api("/api/contests/"+c.code+"/next",{}).then(function(q){
      if(q.finished){termina(q.me);return;}
      pregunta(q);
    }).catch(function(e){pinta('<p class="fine bad">'+esc(ERR(e))+'</p><div class="actions"><button class="ghost" id="cq-volver">Volver al concurso</button></div>');
      $("cq-volver").onclick=function(){ficha(c.code);};});
  }
  function vidas(q){
    if(q.max_errors>=q.max)return '';                /* sin límite de errores */
    var tot=q.max_errors+1, h='';
    for(var i=0;i<tot;i++)h+='<i class="'+(i<q.errors?"gastada":"")+'"></i>';
    return '<span class="cq-vidas" title="'+esc(errTxt(q.max_errors))+'">'+h+'</span>';
  }
  function pregunta(q){
    espera=false;
    var fin=Date.now()+q.ms;
    pinta('<div class="rt-head"><h3>Pregunta '+q.number+(q.max<100?' <small>de '+q.max+'</small>':'')+'</h3>'+vidas(q)+'</div>'+
      '<div class="rp-bar"><i id="cq-fill"></i></div>'+
      '<p class="cq-cat">'+esc(q.cat)+' · <span id="cq-seg">'+Math.ceil(q.ms/1000)+' s</span></p>'+
      '<p class="rp-q">'+esc(q.q)+'</p>'+imgPregunta(q)+respuestaHtml(q)+
      '<p class="fine rp-pts" id="cq-est">'+q.correct+' aciertos · '+(q.max_errors>=q.max?q.errors+(q.errors===1?' fallo':' fallos'):q.errors+' de '+q.max_errors+' errores admitidos')+'</p>');
    var fill=$("cq-fill");
    reloj=setInterval(function(){
      var r=fin-Date.now(), p=Math.max(0,r/q.limit);
      fill.style.transform="scaleX("+p+")"; $("cq-seg").textContent=Math.max(0,Math.ceil(r/1000))+" s";
      if(r<=0)responde(q,escrita(q)?{v:$("cq-v")?$("cq-v").value:"",t:$("cq-t")?$("cq-t").value:""}:-1);
    },100);
    if(escrita(q)){
      $("cq-escribe").onsubmit=function(e){e.preventDefault(); var v=$("cq-v")?$("cq-v").value:"", t=$("cq-t")?$("cq-t").value:"";
        if(!(v||t).trim())return; responde(q,{v:v,t:t});};
      ($("cq-v")||$("cq-t")).focus();
    }else{
      var bs=panel.querySelectorAll(".rp-opt"),k;
      for(k=0;k<bs.length;k++)bs[k].onclick=function(){responde(q,+this.getAttribute("data-k"));};
      teclas=function(e){var k=+e.key; if(k>=1&&k<=q.o.length)responde(q,k-1);};
      document.addEventListener("keydown",teclas);
    }
  }
  function responde(q,k){
    if(espera)return; espera=true; para();
    var bs=panel.querySelectorAll(".rp-opt, #cq-escribe input, #cq-escribe textarea, #cq-escribe button"),j, cuerpo={idx:q.idx};
    for(j=0;j<bs.length;j++)bs[j].disabled=true;
    if(typeof k==="object"){cuerpo.v=k.v;cuerpo.t=k.t;k=-2;} else cuerpo.o=k;
    api("/api/contests/"+c.code+"/answer",cuerpo).then(function(r){
      if(k>=0&&bs[k])bs[k].classList.add(r.correct?"ok":"mal");
      var m=r.me;
      $("cq-est").textContent=(r.pending?"Respuesta enviada: la revisará tu docente. ":r.correct?"¡Correcto! ":r.timeout||k===-1?"Se acabó el tiempo. ":"Incorrecto. ")+m.correct+" aciertos · "+m.errors+" de "+r.max_errors+" errores admitidos";
      $("cq-est").className="fine rp-pts "+(r.correct||r.pending?"ok":"bad");
      setTimeout(function(){ if(r.finished)termina(m); else carga(); },r.correct||r.pending?650:1100);
    }).catch(function(e){ if(e&&e.error==="stale")carga(); else {espera=false;$("cq-est").textContent=ERR(e)+" Reintentando…";setTimeout(carga,1500);} });
  }
  function termina(m){
    para(); vista={code:c.code};
    pinta('<div class="rt-head"><h3>¡Partida terminada!</h3><span class="chip activo">'+esc(c.name)+'</span></div>'+
      '<div class="rp-res"><b>'+m.correct+' aciertos</b><small>'+m.errors+(m.errors===1?" error":" errores")+' · '+tiempo(m.total_ms)+' respondiendo · '+esc(motivo(m.reason))+'</small></div>'+
      '<p class="fine">Ya no puedes volver a jugar este concurso. El ranking y las respuestas correctas se publican al cierre, el '+fecha(c.ends_at)+'.</p>'+
      '<div class="actions"><button class="primary" id="cq-volver">Volver al concurso</button></div>');
    $("cq-volver").onclick=function(){ficha(c.code);};
  }
  carga();
}

/* ---------- competencias de juego rápido de empresas (campañas) ----------
   Se juega con el motor de los juegos rápidos: el servidor da la partida,
   la cronometra y la puntúa. Cuenta la mejor marca; los premios por puntaje
   llegan al momento como cupón y los de puesto, al cerrar. */
function enlaceCampana(code){return location.origin+location.pathname+"?campana="+code;}
function umbralTxt(c){return c.umbral==null?"":(c.orden==="menos"?"con "+c.umbral+" ms o menos":"con "+c.umbral+" puntos o más");}
function campana(code,aviso,nuevo){
  para(); vista={camp:code}; $("hdr").textContent=code; seccion(false);
  pinta('<p class="fine">Cargando…</p>');
  api("/api/campanas/"+code).then(function(c){
    colorMarca(c);
    var u=user(), me=c.me, J=(window.AxRapidos&&AxRapidos.JUEGOS[c.juego])||{};
    var h='<button type="button" class="rt-back" id="cq-back">‹ '+esc(c.brand?c.org_name:"Concursos")+'</button>'+
      (c.brand?'<div class="cq-marca">'+(c.brand.logo?'<img src="'+esc(c.brand.logo)+'" alt="">':'')+'<span>Competencia de <b>'+esc(c.org_name)+'</b></span></div>':'<p class="rt-meta">'+esc(c.org_name)+'</p>')+
      '<div class="rt-head"><h3>'+esc(J.icono||"🎮")+' '+esc(c.name)+'</h3><span class="chip '+(c.state==="abierto"?"activo":c.state)+'">'+({pronto:"Pronto",abierto:"Abierta",terminado:"Terminada"}[c.state])+'</span></div>'+
      (c.description?'<p>'+esc(c.description)+'</p>':'')+
      '<div class="cq-reglas"><div><small>Juego</small><b>'+esc(c.juego_nombre)+'</b></div><div><small>Intentos</small><b>'+(c.intentos?c.intentos:"Libres")+'</b></div>'+
        '<div><small>Cuenta</small><b>Tu mejor marca</b></div><div><small>Jugadores</small><b>'+c.players+'</b></div></div>'+
      '<p class="fine">'+(c.state==="terminado"?"Terminó el "+fecha(c.ends_at)+".":c.state==="pronto"?"Empieza el "+fecha(c.starts_at)+".":"Se puede jugar hasta el "+fecha(c.ends_at)+".")+' '+esc(J.desc||"")+'</p>';
    if(c.premios.length||c.umbral!=null){
      h+='<div class="cp-premios"><h4>Premios</h4><ul>'+c.premios.map(function(p){return '<li><b>'+(p.desde===p.hasta?p.desde+'.º':p.desde+'.º a '+p.hasta+'.º')+'</b> '+esc(p.texto)+'</li>';}).join("")+
        (c.umbral!=null?'<li><b>'+esc(umbralTxt(c))+'</b> '+esc(c.umbral_premio)+' <small>(al momento, a cada persona que lo logre)</small></li>':'')+'</ul>'+
        (c.premios.length?'<p class="fine">Los premios por puesto se asignan al cerrar la competencia. Cada premio es un cupón único que muestras en '+esc(c.org_name)+'.</p>':'')+'</div>';
    }
    if(aviso)h+=aviso;
    if(me&&(me.best||me.cupones.length)){
      h+='<div class="cq-mio"><small>Tu mejor marca</small><b>'+(me.best?esc(me.best.formato):"—")+'</b><span>'+(me.rank?'Puesto '+me.rank+' de '+c.players:'')+
        (me.restantes!==null&&c.state==="abierto"?' · te quedan '+me.restantes+(me.restantes===1?' intento':' intentos'):'')+'</span></div>';
      if(me.cupones.length)h+='<div class="cp-cupones">'+me.cupones.map(function(k){
        return '<div class="cp-cupon'+(k.canjeado?' usado':'')+(k.codigo===nuevo?' nuevo':'')+'"><small>'+(k.codigo===nuevo?'¡Ganaste un premio! · ':'')+(k.tipo==="puesto"?'Premio por el puesto '+k.puesto:'Premio por tu puntaje')+'</small><b>'+esc(k.premio)+'</b>'+
          '<code>'+k.codigo.slice(0,4)+'-'+k.codigo.slice(4)+'</code><span>'+(k.canjeado?'Canjeado':'Muéstralo en '+esc(c.org_name)+' para canjearlo')+'</span></div>';}).join("")+'</div>';
    }
    if(c.state==="abierto"){
      if(!u&&c.guests)h+='<div class="actions"><button class="primary" id="cp-inv">Jugar con mi teléfono o correo</button></div>'+
        (window.AxAccount&&AxAccount.configurado()?'<div class="actions"><button class="ghost" id="cq-login">o entra con Google</button></div>':'');
      else if(!u)h+=(window.AxAccount&&AxAccount.configurado()?'<div class="actions"><button class="primary" id="cq-login">Entrar con Google para jugar</button></div>':'');
      else if(u.guest&&!c.guests)h+='<p class="rt-hoy">Esta competencia es solo con cuenta de Google.</p>';
      else if(!me||me.restantes===null||me.restantes>0)h+='<div class="actions"><button class="primary" id="cp-jugar">'+(me&&me.intentos?'Jugar otra vez':'Jugar')+'</button></div>';
      else h+='<p class="rt-hoy">Ya usaste tus '+c.intentos+' intentos. Cuenta tu mejor marca.</p>';
    }
    if(c.ranking){
      h+='<h4>Ranking'+(c.state==="terminado"?' final':'')+'</h4>'+(c.ranking.length?'<ol class="rt-rank">'+c.ranking.map(function(r){
        return '<li'+(r.me?' class="me"':'')+'><span class="pos">'+r.rank+'</span><span class="who">'+esc(r.name)+(r.me?' <em>(tú)</em>':'')+'</span><span class="pts"><b>'+esc(r.formato)+'</b></span></li>';}).join("")+'</ol>':'<p class="fine">Todavía nadie ha jugado. ¡Sé el primero!</p>');
    }else h+='<p class="fine">El ranking se publica al cerrar la competencia.</p>';
    if(c.state!=="terminado")h+='<div class="rt-code"><span>Código</span><b>'+c.code+'</b><button type="button" class="ghost" id="cp-copy">Copiar enlace</button>'+(window.AxQR?'<button type="button" class="ghost" id="cp-qr">QR</button>':'')+'</div>';
    pinta(h);
    $("cq-back").onclick=function(){ if(c.brand&&window.AxMarca){AxMarca.ver(c.brand.slug);return;} inicio(); };
    if($("cq-login"))$("cq-login").onclick=function(){AxAccount.abrirCuenta();};
    if($("cp-inv"))$("cp-inv").onclick=function(){AxInvitado.abre({campana:code,org_name:c.org_name,prize:c.premios.length?c.premios[0].texto:c.umbral_premio}).then(function(ok){if(ok)campana(code);});};
    if($("cp-jugar"))$("cp-jugar").onclick=function(){juegaCampana(c);};
    if($("cp-copy"))$("cp-copy").onclick=function(){var b=this,t=enlaceCampana(code);
      if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){b.textContent="Copiado";setTimeout(function(){b.textContent="Copiar enlace";},1400);}); else prompt("Copia el enlace:",t);};
    if($("cp-qr"))$("cp-qr").onclick=function(){AxQR.abre({url:enlaceCampana(code),titulo:c.name,subtitulo:c.premios.length?"Premio: "+c.premios[0].texto:c.umbral_premio,marca:c.org_name,
      color:c.brand&&c.brand.color,logo:c.brand&&c.brand.logo,directo:true});};
  }).catch(function(e){pinta('<button type="button" class="rt-back" id="cq-back">‹ Concursos</button><p class="fine bad">'+esc(ERR(e))+'</p>');$("cq-back").onclick=inicio;});
}
function juegaCampana(c){
  var RUI=window.AxRapidosUI; if(!RUI)return;
  var intento=null, vuelve=function(aviso,nuevo){document.body.setAttribute("data-game","concurso");RUI.cerrar();panel.hidden=false;campana(c.code,aviso,nuevo);};
  /* el panel de los juegos rápidos se muestra en lugar de la ficha mientras dura la partida */
  panel.hidden=true; document.body.setAttribute("data-game","rapido");
  RUI.jugar({juego:c.juego,sub:c.intentos?"Intento "+((c.me?c.me.intentos:0)+1)+" de "+c.intentos:"Competencia",titulo:c.name+" · "+c.org_name,
    nota:"El tiempo empieza a contar al pulsar Empezar. Cuenta tu mejor marca"+(c.intentos?" de tus "+c.intentos+" intentos.":"."),
    pedirDatos:function(){
      var fn=function(){return api("/api/campanas/"+c.code+"/empezar",{});};
      return conRegistro(fn).then(function(r){intento=r.intento;return r.datos;});
    },
    error:function(e){if(e&&e.error==="no_attempts")setTimeout(function(){vuelve();},1200);return ERR(e);},
    alTerminar:function(envio){
      api("/api/campanas/"+c.code+"/intentos/"+intento,{envio:envio}).then(function(r){
        var h='<div class="vv-res bien"><b>'+esc(r.formato)+'</b><span>'+(r.mejoro?'¡Tu mejor marca! ':'Tu mejor marca: '+esc(r.best.formato)+' · ')+'Puesto '+r.rank+' de '+r.players+'</span></div>';
        /* el cupón nuevo se ve resaltado en «tus premios» */
        vuelve(h,r.cupon&&r.cupon.nuevo?r.cupon.codigo:null);
      }).catch(function(e){vuelve('<p class="rt-hoy">No se pudo registrar: '+esc(ERR(e))+'</p>');});
    }});
  var rp=$("rapido-panel"); if(rp)rp.scrollIntoView({behavior:"smooth",block:"start"});
}

/* se publica antes de atender el enlace: si la sesión ya se conoce, el cambio de modo es inmediato */
window.AxConcursos={abrir:abrir,cerrar:cerrar,ficha:function(code){activo=true;panel.hidden=false;ficha(code);},
  campana:function(code){activo=true;panel.hidden=false;campana(code);}};

/* ---------- entrada por enlace: ?concurso=CÓDIGO ---------- */
(function(){
  var q=new URLSearchParams(location.search), code=q.get("concurso"), camp=q.get("campana");
  if(!(code||camp)||!window.AxApp)return;
  code=(code||camp).toUpperCase().slice(0,6);
  try{history.replaceState(null,"",location.pathname);}catch(e){}
  var ido=false, ir=function(){ if(ido)return; ido=true; vista=camp?{camp:code}:{code:code}; AxApp.setMode("concurso"); };
  if(window.AxAccount&&AxAccount.listo())ir(); else document.addEventListener("ax-user",ir);
})();

})();
