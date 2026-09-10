/* ===========================================================
   AXIOMA · cuenta opcional (Google) y ranking diario
   Todo es opcional: si el backend no está configurado, nada de esto
   aparece y el juego funciona igual que sin conexión.
   =========================================================== */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var GICON='<svg class="g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.8 38 46.5 31.8 46.5 24.5z"/><path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C1 16.4 0 20.1 0 24s1 7.6 2.6 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.2 0 11.6-2 15.4-5.6l-7.5-5.8c-2.1 1.4-4.8 2.2-7.9 2.2-6.3 0-11.7-4.1-13.6-9.8l-7.8 6C6.5 42.6 14.6 48 24 48z"/></svg>';

var cfg=null, user=null, gsiLoaded=false, pending=null;

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function firstName(n){return String(n||"").split(" ")[0]}
function api(path,opts){
  var o=Object.assign({credentials:"same-origin",headers:{"Content-Type":"application/json"}},opts||{});
  return fetch(path,o).then(function(r){return r.json().then(function(j){if(!r.ok)throw j;return j;});});
}
function store(k,v){try{if(v===undefined)return localStorage.getItem("ax_"+k);if(v===null)localStorage.removeItem("ax_"+k);else localStorage.setItem("ax_"+k,v);}catch(e){return null}}
function dayNumber(){return Math.floor((Date.now()-Date.UTC(2026,0,1))/86400000)+1}

/* ---------- arranque ---------- */
function init(){
  api("/api/config").then(function(c){
    cfg=c;
    if(!c.googleClientId)return;
    $("acct").hidden=false;
    return api("/api/me").then(function(m){setUser(m.user||null);});
  }).catch(function(){ cfg=null; });
}

function setUser(u){
  user=u; renderAccount(); renderPanel();
  if(user){flushPending();enviaSud();}
  else {renderResultNote();notaSud();}
}

/* ---------- botón de cabecera ---------- */
function renderAccount(){
  var b=$("acct-btn");
  if(user){
    b.innerHTML=(user.picture?'<img src="'+esc(user.picture)+'" alt="" referrerpolicy="no-referrer">':'')+
                '<span>'+esc(firstName(user.name))+'</span>';
    b.classList.add("in"); b.setAttribute("aria-label","Cuenta de "+user.name);
  }else{
    b.innerHTML=GICON+'<span>Entrar</span>';
    b.classList.remove("in"); b.setAttribute("aria-label","Entrar con Google (opcional)");
  }
}

/* ---------- panel de cuenta ---------- */
function openPanel(){ $("acct-panel").hidden=false; renderPanel(); if(!user)loadGsi(); $("acct-panel").scrollIntoView({behavior:"smooth",block:"nearest"}); }
function closePanel(){ $("acct-panel").hidden=true; }
function renderPanel(){
  var p=$("acct-panel"); if(p.hidden)return;
  if(user){
    p.innerHTML='<div class="acct-me">'+
      (user.picture?'<img src="'+esc(user.picture)+'" alt="" referrerpolicy="no-referrer">':'')+
      '<div><b>'+esc(user.name)+'</b><small>'+esc(user.email||"")+'</small></div></div>'+
      '<p>Tus resultados del reto diario entran en el ranking automáticamente.</p>'+
      '<div class="actions"><button class="ghost" id="acct-rank">Ver ranking de hoy</button>'+
      '<button class="ghost" id="acct-out">Salir</button></div>'+
      '<button class="close" id="acct-close" aria-label="Cerrar">×</button>';
    $("acct-rank").onclick=function(){closePanel();showRanking(dayNumber());};
    $("acct-out").onclick=logout;
  }else{
    p.innerHTML='<h3>Ranking diario</h3>'+
      '<p>Entra con Google para que tu resultado del reto diario aparezca en el ranking. '+
      '<strong>Es opcional:</strong> puedes seguir jugando sin cuenta.</p>'+
      '<div id="gsi-btn" class="gsi"><span class="gsi-wait">Cargando Google…</span></div>'+
      '<p class="fine">Solo guardamos tu nombre, tu foto y tus puntuaciones. Nada más.</p>'+
      '<button class="close" id="acct-close" aria-label="Cerrar">×</button>';
    if(gsiLoaded)renderGsiButton();
  }
  $("acct-close").onclick=closePanel;
}

/* ---------- Google Identity Services ---------- */
function loadGsi(){
  if(gsiLoaded||!cfg||!cfg.googleClientId)return;
  if(window.google&&window.google.accounts){gsiLoaded=true;renderGsiButton();return;}
  var s=document.createElement("script");
  s.src="https://accounts.google.com/gsi/client"; s.async=true; s.defer=true;
  s.onload=function(){gsiLoaded=true;renderGsiButton();};
  setTimeout(function(){ if(!gsiLoaded){var h=$("gsi-btn");if(h)h.innerHTML='<span class="gsi-wait">Google tarda en responder. Revisa tu conexión e inténtalo de nuevo.</span>';} },10000);
  s.onerror=function(){var h=$("gsi-btn");if(h)h.innerHTML='<span class="gsi-wait">No se pudo cargar Google. Inténtalo más tarde.</span>';};
  document.head.appendChild(s);
}
function renderGsiButton(){
  var host=$("gsi-btn"); if(!host||!window.google)return;
  host.innerHTML="";
  google.accounts.id.initialize({client_id:cfg.googleClientId,callback:onCredential,ux_mode:"popup",auto_select:false});
  google.accounts.id.renderButton(host,{theme:"outline",size:"large",shape:"pill",text:"signin_with",locale:"es",width:260});
}
function onCredential(resp){
  var host=$("gsi-btn"); if(host)host.innerHTML='<span class="gsi-wait">Entrando…</span>';
  api("/api/auth/google",{method:"POST",body:JSON.stringify({credential:resp.credential})})
    .then(function(r){setUser(r.user);})
    .catch(function(){ if(host)host.innerHTML='<span class="gsi-wait">No se pudo iniciar sesión. Inténtalo de nuevo.</span>'; renderPanel(); });
}
function logout(){
  api("/api/auth/logout",{method:"POST"}).catch(function(){}).then(function(){
    if(window.google&&google.accounts)google.accounts.id.disableAutoSelect();
    setUser(null); closePanel();
  });
}

/* ---------- puntuaciones ---------- */
function onDailySolved(s){
  pending={day:s.day,moves:s.moves,hints:s.hints};
  store("pending",JSON.stringify(pending));
  if(!cfg||!cfg.googleClientId){renderResultNote();return;}
  if(user){flushPending();enviaSud();} else renderResultNote();
}
function flushPending(){
  if(!pending){try{pending=JSON.parse(store("pending")||"null");}catch(e){pending=null}}
  if(!pending||pending.day<dayNumber()-1){pending=null;store("pending",null);renderResultNote();return;}
  var p=pending;
  api("/api/scores",{method:"POST",body:JSON.stringify(p)}).then(function(r){
    pending=null; store("pending",null);
    renderResultNote(r.me,p.day);
  }).catch(function(){renderResultNote(null,p.day,true);});
}
function renderResultNote(me,day,failed){
  var n=$("rank-note"); if(!n)return;
  if(!cfg||!cfg.googleClientId){n.hidden=true;return;}
  var solvedToday=pending||me;
  if(!solvedToday){n.hidden=true;return;}
  n.hidden=false;
  if(me){
    n.innerHTML='<span>Puesto <b>#'+me.rank+'</b> de '+me.total+' hoy</span>'+
                '<button class="ghost" id="rank-see">Ver ranking</button>';
    $("rank-see").onclick=function(){showRanking(day||dayNumber());};
  }else if(user&&failed){
    n.innerHTML='<span>No se pudo enviar tu resultado.</span><button class="ghost" id="rank-retry">Reintentar</button>';
    $("rank-retry").onclick=flushPending;
  }else if(!user){
    n.innerHTML='<span>¿Quieres aparecer en el ranking de hoy?</span>'+
                '<button class="ghost" id="rank-login">'+GICON+' Entrar</button>';
    $("rank-login").onclick=openPanel;
  }else n.hidden=true;
}

/* ---------- ranking ---------- */
function showRanking(day){
  var box=$("ranking"); box.hidden=false;
  box.innerHTML='<h3>Ranking · reto nº '+day+'</h3><p class="fine">Cargando…</p>';
  box.scrollIntoView({behavior:"smooth",block:"nearest"});
  api("/api/ranking?day="+day).then(function(r){
    var h='<h3>Ranking · reto nº '+r.day+'</h3>';
    if(!r.top.length)h+='<p class="fine">Todavía nadie ha resuelto este reto. ¡Sé el primero!</p>';
    else{
      h+='<ol class="rank-list">';
      r.top.forEach(function(e){
        h+='<li'+(e.me?' class="me"':'')+'><span class="pos">'+e.rank+'</span>'+
           (e.picture?'<img src="'+esc(e.picture)+'" alt="" referrerpolicy="no-referrer">':'<span class="noimg"></span>')+
           '<span class="who">'+esc(e.name)+(e.me?' <em>(tú)</em>':'')+'</span>'+
           '<span class="pts"><b>'+e.moves+'</b> mov'+(e.hints?' · '+e.hints+' pista'+(e.hints>1?'s':''):'')+'</span></li>';
      });
      h+='</ol>';
      if(r.me&&r.me.rank>r.top.length)h+='<p class="fine">Tu puesto: <b>#'+r.me.rank+'</b> de '+r.total+'.</p>';
      else if(r.total>r.top.length)h+='<p class="fine">'+r.total+' jugadores hoy.</p>';
    }
    h+='<button class="close" id="rank-close" aria-label="Cerrar">×</button>';
    box.innerHTML=h;
    $("rank-close").onclick=function(){box.hidden=true;};
  }).catch(function(){
    box.innerHTML='<h3>Ranking</h3><p class="fine">No se pudo cargar el ranking.</p><button class="close" id="rank-close" aria-label="Cerrar">×</button>';
    $("rank-close").onclick=function(){box.hidden=true;};
  });
}

/* ---------- sudoku ---------- */
var sudPend=null;
function sudokuResuelto(s2){
  sudPend=s2; store("sudpend",JSON.stringify(s2));
  if(!cfg||!cfg.googleClientId){notaSud();return;}
  if(user)enviaSud(); else notaSud();
}
function enviaSud(){
  if(!sudPend){try{sudPend=JSON.parse(store("sudpend")||"null");}catch(e){sudPend=null}}
  if(!sudPend||sudPend.day<dayNumber()-1){sudPend=null;store("sudpend",null);notaSud();return;}
  var p=sudPend;
  api("/api/sudoku",{method:"POST",body:JSON.stringify(p)}).then(function(r){
    sudPend=null; store("sudpend",null); notaSud(r.me,p.day,p.level);
  }).catch(function(){notaSud(null,p.day,p.level,true);});
}
function reloj(s2){var m=Math.floor(s2/60),g=s2%60;return m+":"+(g<10?"0":"")+g;}
function notaSud(me,day,level,falló){
  var n=$("sud-rank-note"); if(!n)return;
  if(!cfg||!cfg.googleClientId){n.hidden=true;return;}
  if(!sudPend&&!me){n.hidden=true;return;}
  n.hidden=false;
  if(me){
    n.innerHTML='<span>Puesto <b>#'+me.rank+'</b> de '+me.total+' hoy</span>'+
                '<button class="ghost" id="sud-ver">Ver ranking</button>';
    $("sud-ver").onclick=function(){verSud(day||dayNumber(),level||1);};
  }else if(user&&falló){
    n.innerHTML='<span>No se pudo enviar tu tiempo.</span><button class="ghost" id="sud-otra">Reintentar</button>';
    $("sud-otra").onclick=enviaSud;
  }else if(!user){
    n.innerHTML='<span>¿Quieres aparecer en el ranking por tiempo?</span>'+
                '<button class="ghost" id="sud-entra">'+GICON+' Entrar</button>';
    $("sud-entra").onclick=openPanel;
  }else n.hidden=true;
}
function verSud(day,level){
  var box=$("sud-ranking"); box.hidden=false;
  box.innerHTML='<h3>Ranking por tiempo</h3><p class="fine">Cargando…</p>';
  box.scrollIntoView({behavior:"smooth",block:"nearest"});
  api("/api/sudoku/ranking?day="+day+"&level="+level).then(function(r){
    var niv={1:"Fácil",2:"Medio",3:"Difícil",4:"Experto"}[r.level]||"";
    var h='<h3>Ranking · sudoku '+esc(niv)+'</h3>';
    if(!r.top.length)h+='<p class="fine">Nadie lo ha resuelto todavía hoy en este nivel.</p>';
    else{
      h+='<ol class="rank-list">';
      r.top.forEach(function(e){
        h+='<li'+(e.me?' class="me"':'')+'><span class="pos">'+e.rank+'</span>'+
           (e.picture?'<img src="'+esc(e.picture)+'" alt="" referrerpolicy="no-referrer">':'<span class="noimg"></span>')+
           '<span class="who">'+esc(e.name)+(e.me?' <em>(tú)</em>':'')+'</span>'+
           '<span class="pts"><b>'+reloj(e.seconds)+'</b>'+
             (e.hints||e.errors?'<small>'+(e.hints?e.hints+' pista'+(e.hints>1?'s':''):'')+
               (e.hints&&e.errors?' · ':'')+(e.errors?e.errors+' error'+(e.errors>1?'es':''):'')+'</small>':'')+
           '</span></li>';
      });
      h+='</ol>';
      if(r.me&&r.me.rank>r.top.length)h+='<p class="fine">Tu puesto: <b>#'+r.me.rank+'</b> de '+r.total+'.</p>';
      else if(r.total>r.top.length)h+='<p class="fine">'+r.total+' jugadores hoy.</p>';
    }
    h+='<button class="close" id="sud-cerrar" aria-label="Cerrar">×</button>';
    box.innerHTML=h;
    $("sud-cerrar").onclick=function(){box.hidden=true;};
  }).catch(function(){
    box.innerHTML='<h3>Ranking por tiempo</h3><p class="fine">Todavía no está disponible: falta crear la tabla del sudoku en la base de datos.</p>'+
                  '<button class="close" id="sud-cerrar" aria-label="Cerrar">×</button>';
    $("sud-cerrar").onclick=function(){box.hidden=true;};
  });
}

/* ---------- API pública para app.js ---------- */
window.AxAccount={onDailySolved:onDailySolved,showRanking:showRanking,
  sudokuResuelto:sudokuResuelto,verRankingSudoku:verSud,user:function(){return user}};

$("acct-btn").onclick=function(){ if($("acct-panel").hidden)openPanel(); else closePanel(); };
init();
})();
