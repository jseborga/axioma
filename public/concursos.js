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

var NIVELES={1:"Fácil",2:"Medio",3:"Difícil",4:"Progresiva"};
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
function ERR(e){return {not_configured:"Faltan las tablas de concursos en la base de datos. Hay que volver a ejecutar schema.sql (ver SETUP.md).",
  unauthorized:"Tienes que entrar con Google.",not_found:"No existe ningún concurso con ese código.",finished:"Ese concurso ya terminó.",
  not_registered:"Primero tienes que inscribirte.",not_started:"El concurso todavía no ha empezado.",bad_name:"Ponle un nombre.",
  bad_end:"El concurso tiene que durar entre 5 minutos y 31 días.",bad_start:"La fecha de inicio no es válida.",
  too_many:"Tienes demasiados concursos abiertos a la vez.",forbidden:"Solo quien lo organiza puede hacer eso."}[e&&e.error]||"No se pudo completar. Inténtalo otra vez.";}
function errTxt(n){return n===0?"Sin errores: el primer fallo termina la partida":n===1?"1 error admitido":n+" errores admitidos";}
function chip(c){
  var t=c.state==="pronto"?"Empieza en "+dura(c.starts_at-ahora()):c.state==="abierto"?"Termina en "+dura(c.ends_at-ahora()):"Terminado";
  return '<span class="chip '+(c.state==="abierto"?"activo":c.state)+'">'+t+'</span>';
}
function reglas(c){
  return NIVELES[c.level]+" · "+c.max_questions+(c.max_questions===100?" preguntas como máximo":" preguntas")+" · "+c.seconds_per_q+" s cada una · "+
         (c.max_errors===0?"sin errores":c.max_errors===1?"1 error admitido":c.max_errors+" errores admitidos")+(c.math?" · con cálculo":"");
}
function cab(){ $("hdr").textContent=vista&&vista.code?vista.code:"Trivia"; }

/* ---------- entrada ---------- */
function abrir(){ activo=true; panel.hidden=false; if(vista&&vista.code)ficha(vista.code); else inicio(); }
function cerrar(){ activo=false; para(); panel.hidden=true; }
document.addEventListener("ax-user",function(){ if(activo&&vista&&!vista.jugando)(vista.code?ficha(vista.code):inicio()); });

/* ---------- inicio ---------- */
function inicio(){
  para(); vista={}; cab();
  var u=user(), conCuenta=window.AxAccount&&AxAccount.configurado&&AxAccount.configurado();
  pinta('<h3>Concursos de trivia</h3>'+
    '<p class="fine">Preguntas de cultura general y de cálculo. Te inscribes, juegas <b>una sola vez</b> hasta pasarte de los errores admitidos, y cuando se cierra el concurso se publica el ranking: quien más acierta se lleva el premio.</p>'+
    (u?'<div class="actions"><button class="primary" id="cq-crear">Crear un concurso</button></div>'
      :conCuenta?'<div class="actions"><button class="primary" id="cq-login">Entrar con Google para participar</button></div>':'')+
    '<form class="rt-join" id="cq-join"><input id="cq-code" placeholder="Código del concurso" maxlength="6" autocapitalize="characters" autocomplete="off" spellcheck="false"><button type="submit" class="ghost">Ver</button></form>'+
    '<div id="cq-listas"><p class="fine">Cargando…</p></div>');
  if($("cq-crear"))$("cq-crear").onclick=crear;
  if($("cq-login"))$("cq-login").onclick=function(){AxAccount.abrirCuenta();};
  $("cq-join").onsubmit=function(e){e.preventDefault();var c=$("cq-code").value.trim().toUpperCase();if(c.length===6)ficha(c);};
  api("/api/contests").then(function(r){
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
  }).catch(function(e){$("cq-listas").innerHTML='<p class="fine bad">'+esc(ERR(e))+'</p>';});
}

/* ---------- crear ---------- */
function crear(){
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
      ". Al cierre se publica el ranking: más aciertos, luego menos errores y luego menos tiempo.";
  }
  ["c-ini","c-dur","c-err","c-ini-f","c-fin-f"].forEach(function(id){$(id).onchange=resumen;});
  resumen();
  $("cq-form").onsubmit=function(e){
    e.preventDefault();
    var f=fechas(), msg=$("c-msg"), go=$("c-go");
    if(isNaN(f.ini)||isNaN(f.fin)){msg.className="msg bad";msg.textContent="Revisa las fechas.";return;}
    go.disabled=true; msg.className="msg"; msg.textContent="Publicando…";
    api("/api/contests",{name:$("c-name").value,prize:$("c-prize").value,description:$("c-desc").value,level:+$("c-level").value,
      max_errors:+$("c-err").value,max_questions:+$("c-q").value,seconds_per_q:+$("c-seg").value,math:$("c-math").checked,
      public:$("c-pub").value==="1",starts_at:f.ini,ends_at:f.fin})
      .then(function(r){ficha(r.code,true);})
      .catch(function(er){go.disabled=false;msg.className="msg bad";msg.textContent=ERR(er);});
  };
}

/* ---------- ficha ---------- */
function ficha(code,recien){
  para(); vista={code:code}; cab();
  api("/api/contests/"+code).then(function(c){
    desfase=c.now-Date.now();
    var u=user(), me=c.me, h='<button type="button" class="rt-back" id="cq-back">‹ Concursos</button>'+
      '<div class="rt-head"><h3>'+esc(c.name)+'</h3>'+chip(c)+'</div>'+
      '<p class="rt-meta">Organiza '+esc(c.owner?"tú":c.owner_name)+' · '+c.registered+(c.registered===1?" inscrito":" inscritos")+
        (c.played?' · '+c.played+' ya '+(c.played===1?"jugó":"jugaron"):'')+'</p>'+
      (c.prize?'<p class="rt-prize">🏆 '+esc(c.prize)+'</p>':'')+
      (c.description?'<p>'+esc(c.description)+'</p>':'')+
      '<div class="cq-reglas">'+
        '<div><small>Dificultad</small><b>'+NIVELES[c.level]+'</b></div>'+
        '<div><small>Errores</small><b>'+(c.max_errors===0?"Ninguno":c.max_errors)+'</b></div>'+
        '<div><small>Preguntas</small><b>'+(c.max_questions===100?"Hasta 100":c.max_questions)+'</b></div>'+
        '<div><small>Por pregunta</small><b>'+c.seconds_per_q+' s</b></div>'+
      '</div>'+
      '<p class="fine">'+(c.state==="terminado"?"Terminó el "+fecha(c.ends_at)+".":"Del "+fecha(c.starts_at)+" al "+fecha(c.ends_at)+".")+
        (c.math?" Incluye operaciones matemáticas.":"")+'</p>';

    if(c.state!=="terminado")h+='<div class="rt-code"><span>Código</span><b>'+c.code+'</b><button type="button" class="ghost" id="cq-copy">Copiar enlace</button>'+
      (navigator.share?'<button type="button" class="ghost" id="cq-share">Invitar</button>':'')+'</div>';
    if(recien)h+='<p class="fine ok">Concurso publicado. Comparte el código o el enlace para que la gente se inscriba.</p>';

    if(c.state==="terminado"){
      h+=resultado(c);
    }else if(!u){
      h+=(window.AxAccount&&AxAccount.configurado()?'<div class="actions"><button class="primary" id="cq-login">Entrar con Google para inscribirte</button></div>':
         '<p class="fine">El inicio de sesión no está configurado en esta instalación.</p>');
    }else if(!me){
      h+='<div class="actions"><button class="primary" id="cq-inscribir">Inscribirme</button></div>'+
         '<p class="fine">Inscribirte no te obliga a jugar ya: podrás hacerlo en cualquier momento hasta el cierre.</p>';
    }else if(me.finished){
      h+='<div class="cq-mio"><small>Tu participación</small><b>'+me.correct+' aciertos · '+me.errors+(me.errors===1?" error":" errores")+'</b>'+
         '<span>'+motivo(me.reason)+' · '+tiempo(me.total_ms)+' respondiendo</span></div>'+
         '<p class="fine">El ranking se publica al cierre, el '+fecha(c.ends_at)+'.</p>';
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
    if(c.owner&&c.state!=="terminado")h+='<div class="actions"><button type="button" class="ghost" id="cq-cerrar">Cerrar el concurso ahora y publicar el ranking</button></div>';
    pinta(h);

    $("cq-back").onclick=inicio;
    if($("cq-copy"))$("cq-copy").onclick=function(){var b=this,t=enlace(c.code);
      if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){b.textContent="Copiado";setTimeout(function(){b.textContent="Copiar enlace";},1400);});
      else prompt("Copia el enlace:",t);};
    if($("cq-share"))$("cq-share").onclick=function(){navigator.share({text:"Participa en «"+c.name+"»"+(c.prize?" y gana "+c.prize:"")+": "+enlace(c.code)}).catch(function(){});};
    if($("cq-login"))$("cq-login").onclick=function(){AxAccount.abrirCuenta();};
    if($("cq-inscribir"))$("cq-inscribir").onclick=function(){this.disabled=true;
      api("/api/contests/"+code+"/join",{}).then(function(){ficha(code);}).catch(function(e){alert(ERR(e));ficha(code);});};
    if($("cq-jugar"))$("cq-jugar").onclick=function(){juego(c);};
    if($("cq-cerrar"))$("cq-cerrar").onclick=function(){
      if(!confirm("¿Cerrar «"+c.name+"» ahora? Nadie más podrá jugar y se publicará el ranking."))return;
      api("/api/contests/"+code+"/close",{}).then(function(){ficha(code);}).catch(function(e){alert(ERR(e));});};
    /* mientras está abierto se refresca solo; al llegar el cierre aparece el ranking */
    if(c.state!=="terminado"){
      var falta=(c.state==="pronto"?c.starts_at:c.ends_at)-ahora();
      refresco=setTimeout(function(){ if(activo&&vista&&vista.code===code&&!vista.jugando)ficha(code); },Math.max(1000,Math.min(20000,falta+800)));
    }
  }).catch(function(e){
    pinta('<button type="button" class="rt-back" id="cq-back">‹ Concursos</button><p class="fine bad">'+esc(ERR(e))+'</p>');
    $("cq-back").onclick=inicio;
  });
}
function motivo(r){return r==="errores"?"Superaste los errores admitidos":r==="completo"?"Respondiste todas las preguntas":r==="tiempo"?"Se cerró el concurso":"";}

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
  h+='<p class="fine">Orden: más aciertos; a igualdad, menos errores; y luego menos tiempo respondiendo.</p>';
  if(c.review&&c.review.length){
    h+='<details class="cq-review"><summary>Tus respuestas ('+c.review.filter(function(x){return x.ok;}).length+' de '+c.review.length+')</summary><ol>';
    c.review.forEach(function(x){
      h+='<li class="'+(x.ok?"ok":"mal")+'"><small>'+esc(x.cat)+'</small><b>'+esc(x.q)+'</b>'+
        (x.ok?'<span>✓ '+esc(x.answer)+'</span>':'<span>✗ '+(x.chosen===null?"sin responder a tiempo":esc(x.chosen))+' · correcta: <b>'+esc(x.answer)+'</b></span>')+'</li>';
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
      '<p class="rp-q">'+esc(q.q)+'</p>'+
      '<div class="rp-opts">'+q.o.map(function(o,k){return '<button type="button" class="rp-opt" data-k="'+k+'">'+esc(o)+'</button>';}).join("")+'</div>'+
      '<p class="fine rp-pts" id="cq-est">'+q.correct+' aciertos · '+q.errors+' de '+q.max_errors+' errores admitidos</p>');
    var fill=$("cq-fill");
    reloj=setInterval(function(){
      var r=fin-Date.now(), p=Math.max(0,r/q.limit);
      fill.style.transform="scaleX("+p+")"; $("cq-seg").textContent=Math.max(0,Math.ceil(r/1000))+" s";
      if(r<=0)responde(q,-1);
    },100);
    var bs=panel.querySelectorAll(".rp-opt"),k;
    for(k=0;k<bs.length;k++)bs[k].onclick=function(){responde(q,+this.getAttribute("data-k"));};
    teclas=function(e){if(e.key>="1"&&e.key<="4")responde(q,+e.key-1);};
    document.addEventListener("keydown",teclas);
  }
  function responde(q,k){
    if(espera)return; espera=true; para();
    var bs=panel.querySelectorAll(".rp-opt"),j;
    for(j=0;j<bs.length;j++)bs[j].disabled=true;
    api("/api/contests/"+c.code+"/answer",{idx:q.idx,o:k}).then(function(r){
      if(k>=0&&bs[k])bs[k].classList.add(r.correct?"ok":"mal");
      var m=r.me;
      $("cq-est").textContent=(r.correct?"¡Correcto! ":r.timeout||k<0?"Se acabó el tiempo. ":"Incorrecto. ")+m.correct+" aciertos · "+m.errors+" de "+r.max_errors+" errores admitidos";
      $("cq-est").className="fine rp-pts "+(r.correct?"ok":"bad");
      setTimeout(function(){ if(r.finished)termina(m); else carga(); },r.correct?650:1100);
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

/* ---------- entrada por enlace: ?concurso=CÓDIGO ---------- */
(function(){
  var q=new URLSearchParams(location.search), code=q.get("concurso");
  if(!code||!window.AxApp)return;
  code=code.toUpperCase().slice(0,6);
  try{history.replaceState(null,"",location.pathname);}catch(e){}
  var ido=false, ir=function(){ if(ido)return; ido=true; vista={code:code}; AxApp.setMode("concurso"); };
  if(window.AxAccount&&AxAccount.listo())ir(); else document.addEventListener("ax-user",ir);
})();

window.AxConcursos={abrir:abrir,cerrar:cerrar};
})();
