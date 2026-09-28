/* ===========================================================
   THE FINAL TEST · salas de juego (pantalla)
   Catálogo de juegos, sala de espera con QR, conexión en vivo con
   reconexión automática, vista de proyector (?pantalla=CÓDIGO) y
   partidas locales contra el bot o a dos en el mismo teléfono.

   Cada juego registra su interfaz:
     AxSala.registra("gomoku", {
       icono, desc, reglas:[…],
       jugador(el, g, ctx)      pinta la vista del jugador (se llama en cada cambio)
       pantalla(el, g, ctx)     vista del proyector (si falta, se usa la del jugador)
       opciones(op)             html del formulario de opciones (opcional)
       leeOpciones(form)        → objeto de opciones
       local:true               se puede jugar sin conexión contra el bot o a dos
       botLocal(E, id)          → jugada del bot en el navegador (si falta, la del núcleo)
     })
   ctx = { envia(msg), yo, sala, ahora(), nombre(id), local, host }.
   Los elementos con data-hasta="<ms>" muestran solos la cuenta atrás.
   =========================================================== */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var panel=$("juegos-panel"); if(!panel)return;
var J=window.AxJuegos, UI={};
var ws=null, estado=null, desfase=0, codigoSala=null, esPantalla=false, intencional=false, reintento=0, tReconecta=null,
    tLatido=null, activo=false, localE=null, vista=null, ultimoRender="";

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function api(path,body){
  return fetch(path,{method:body?"POST":"GET",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined})
    .then(function(r){return r.json().then(function(j){if(!r.ok)throw j;return j;});});
}
function user(){return window.AxAccount&&AxAccount.user();}
function ahora(){return Date.now()+desfase;}
function guarda(k,v){try{if(v===undefined)return localStorage.getItem("tft_"+k);localStorage.setItem("tft_"+k,v);}catch(e){return null;}}
function enlace(p,c){return location.origin+location.pathname+"?"+p+"="+c;}
function hdr(t){var h=$("hdr");if(h)h.textContent=t;}
var ERR={not_found:"No hay ninguna sala con ese código.",login_required:"Esta sala pide identificarse: entra con Google o verifica tu teléfono o correo.",
  unauthorized:"Esta sala es solo para cuentas de Google.",google_required:"Para esto hace falta entrar con Google.",adults_only:"Este juego es solo para mayores de 18 años con la edad verificada.",
  profile_required:"Primero completa tu registro.",need_players:"Faltan jugadores para empezar.",not_your_turn:"No es tu turno.",bad_move:"Esa jugada no vale.",
  kicked:"El anfitrión te sacó de la sala.",too_many:"Tienes demasiadas salas abiertas.",live_unavailable:"Las salas en vivo no están activadas en este servidor.",
  not_configured:"Faltan las tablas de salas en la base de datos (ver SETUP.md).",bad_name:"Escribe un apodo de al menos 2 letras.",forbidden:"No tienes permiso para esto.",
  empty_pool:"Ese banco no tiene preguntas.",forbidden_bank:"No puedes usar ese banco.",org_pending:"La institución todavía no está aprobada.",bad_game:"Juego desconocido.",
  too_late:"Ya no se admite: se cerró el plazo.",already:"Eso ya está hecho.",wrong_word:"Esa no es la palabra secreta.",bad_bid:"Esa puja no es válida.",
  repeated_own:"Ya pujaste esa cantidad.",no_bids_left:"No te quedan pujas.",host_presents:"Quien presenta no participa.",out:"Te quedaste sin vidas.",
  own_statements:"No puedes votar tus propias frases.",finished:"La partida ya terminó.",wait:"Espera un momento.",bid_too_low:"Tienes que subir la apuesta."};
function error(e){return (e&&ERR[e.error||e])||(e&&e.error)||"No se pudo completar.";}

function registra(tipo,ui){UI[tipo]=ui;}

/* ---------- cuentas atrás automáticas ---------- */
setInterval(function(){
  if(!activo)return;
  var t=ahora(), els=panel.querySelectorAll("[data-hasta]"),i;
  for(i=0;i<els.length;i++){var h=+els[i].getAttribute("data-hasta"), s=Math.max(0,Math.ceil((h-t)/1000));
    if(els[i].hasAttribute("data-total")){var tot=+els[i].getAttribute("data-total");els[i].style.transform="scaleX("+Math.max(0,Math.min(1,(h-t)/tot))+")";}
    else els[i].textContent=s>=60?Math.floor(s/60)+":"+("0"+s%60).slice(-2):String(s);}
},200);

/* ===================== CATÁLOGO ===================== */
function abrir(){ activo=true; panel.hidden=false; if(!codigoSala&&!localE)catalogo(); }
function cerrar(){ activo=false; panel.hidden=true; }
function sal(){ intencional=true; if(ws)try{ws.close();}catch(e){} ws=null; codigoSala=null; estado=null; localE=null; clearTimeout(tReconecta); clearInterval(tLatido);
  document.body.removeAttribute("data-proyector"); colorMarca(null); }

function catalogo(){
  sal(); hdr("Juegos"); vista="catalogo";
  var h='<div class="panel retos"><h3>Más juegos</h3><p>Estrategia contra el bot o contra un amigo, juegos de mesa en grupo y dinámicas en vivo para eventos, con la pantalla grande como tablero y los teléfonos como mando.</p>'+
    '<form class="rt-join" id="jg-join"><input id="jg-code" placeholder="Código de sala" maxlength="6" autocapitalize="characters" autocomplete="off" spellcheck="false"><button type="submit" class="primary">Entrar</button></form><p class="msg" id="jg-msg"></p>';
  J.GRUPOS.forEach(function(gr){
    var lista=Object.keys(J.REG).map(function(k){return J.REG[k];}).filter(function(d){return d.grupo===gr[0]&&UI[d.tipo];});
    if(!lista.length)return;
    h+='<h4>'+esc(gr[1])+'</h4><div class="jg-grid">'+lista.map(function(d){var u=UI[d.tipo];
      return '<button type="button" class="jg-card" data-juego="'+d.tipo+'"><span class="jg-ico">'+(u.icono||"🎲")+'</span><span class="jg-t"><b>'+esc(d.nombre)+'</b>'+
        '<small>'+esc(u.desc||"")+'</small><em>'+(d.min===d.max?d.min:d.min+"–"+d.max)+' jugadores'+(u.local?' · contra el bot':'')+(d.adultos?' · +18':'')+'</em></span></button>';}).join("")+'</div>';
  });
  h+='</div>';
  panel.innerHTML=h;
  var bs=panel.querySelectorAll("[data-juego]"),i; for(i=0;i<bs.length;i++)bs[i].onclick=function(){fichaJuego(this.getAttribute("data-juego"));};
  $("jg-join").onsubmit=function(e){e.preventDefault();var c=$("jg-code").value.trim().toUpperCase();
    if(c.length!==6){var m=$("jg-msg");m.className="msg bad";m.textContent="Los códigos de sala tienen 6 caracteres.";return;} entra(c,false);};
}

/* ficha de un juego: reglas, jugar contra el bot o crear sala */
function fichaJuego(tipo){
  sal();                                   /* si venías de una sala, se sale de ella */
  var d=J.def(tipo), u=UI[tipo], yo=user(); vista="ficha"; hdr(d.nombre);
  var vivo=d.grupo==="vivo"||d.grupo==="especial";
  var h='<div class="panel retos"><button type="button" class="rt-back" id="jg-back">‹ Juegos</button>'+
    '<div class="rt-head"><h3>'+(u.icono||"")+' '+esc(d.nombre)+'</h3>'+(d.adultos?'<span class="chip pronto">+18</span>':'')+'</div>'+
    '<p>'+esc(u.desc||"")+'</p>'+(u.reglas?'<ul class="jg-reglas">'+u.reglas.map(function(x){return '<li>'+x+'</li>';}).join("")+'</ul>':'');
  if(u.local)h+='<h4>Sin conexión</h4><div class="actions"><button class="primary" id="jg-bot">Contra el bot</button>'+(d.dosLocal!==false?'<button class="ghost" id="jg-dos">Dos en este teléfono</button>':'')+'</div>'+
    (u.niveles?'<div class="seg jg-nivel" role="radiogroup" aria-label="Nivel del bot">'+u.niveles.map(function(n,i){return '<button type="button" role="radio" data-nv="'+i+'" aria-checked="'+(i===1)+'">'+n+'</button>';}).join("")+'</div>':'');
  h+='<h4>'+(u.local?'En línea con amigos':'Crear una sala')+'</h4>';
  if(!yo||yo.guest)h+='<p class="fine">Para crear una sala entra con Google. Quien se una puede hacerlo'+(d.adultos?' con su cuenta o su teléfono verificado.':' solo con un apodo.')+'</p>'+
    (window.AxAccount&&AxAccount.configurado()?'<div class="actions"><button class="ghost" id="jg-login">Entrar con Google</button></div>':'');
  else{
    h+='<form class="rt-form" id="jg-form">'+(u.opciones?u.opciones(d.opciones||{}):'')+
      (vivo?'<label>Título (opcional)<input id="jg-tit" maxlength="60" placeholder="'+esc(d.nombre)+' · Evento"></label><label>Premio (opcional)<input id="jg-pre" maxlength="120" placeholder="Cupón de descuento para el ganador"></label>':'')+
      (d.tipo==="sorteo"||d.tipo==="subasta"?'<label>Bases (se muestran a todos)<textarea id="jg-bases" maxlength="600" rows="3" placeholder="Quién puede participar, cómo se elige al ganador, cómo se entrega el premio…"></textarea></label>'+
        '<label class="rt-check"><input type="checkbox" id="jg-legal"> <span>Organizo este '+(d.tipo==="sorteo"?'sorteo':'juego')+' bajo mi responsabilidad y cuento con las autorizaciones que exija la ley (en Bolivia, la de la AJ para sorteos promocionales).</span></label>':'')+
      '<label>Quién puede unirse<select id="jg-acc">'+(d.adultos?'':'<option value="libre"'+(d.acceso==="libre"?' selected':'')+'>Cualquiera con el enlace, con un apodo</option>')+
        '<option value="invitados"'+(d.acceso!=="libre"||d.adultos?' selected':'')+'>Con Google o con teléfono o correo verificado</option><option value="cuenta">Solo con cuenta de Google</option></select></label>'+
      '<p class="fine">Si pones un premio, hará falta identificarse (Google o teléfono o correo verificado) para evitar trampas.</p>'+
      '<div id="jg-org"></div>'+
      '<div class="actions"><button class="primary" type="submit" id="jg-crear">Crear sala</button></div><p class="msg" id="jg-cmsg"></p></form>';
  }
  h+='</div>';
  panel.innerHTML=h;
  $("jg-back").onclick=catalogo;
  var nivel=1;
  var nv=panel.querySelectorAll("[data-nv]"),i; for(i=0;i<nv.length;i++)nv[i].onclick=function(){nivel=+this.getAttribute("data-nv");
    for(var k=0;k<nv.length;k++)nv[k].setAttribute("aria-checked",String(nv[k]===this));};
  if($("jg-bot"))$("jg-bot").onclick=function(){local(tipo,{bot:true,nivel:nivel,opciones:u.leeOpciones&&$("jg-form")?u.leeOpciones($("jg-form")):{}});};
  if($("jg-dos"))$("jg-dos").onclick=function(){local(tipo,{bot:false,opciones:u.leeOpciones&&$("jg-form")?u.leeOpciones($("jg-form")):{}});};
  if($("jg-login"))$("jg-login").onclick=function(){AxAccount.abrirCuenta();};
  if(!$("jg-form"))return;
  /* salas de una institución o empresa, con su marca en la pantalla */
  api("/api/orgs").then(function(r){
    var mias=r.orgs.filter(function(o){return (o.role==="admin"||o.role==="docente")&&o.status==="activa";});
    if(mias.length&&$("jg-org"))$("jg-org").innerHTML='<label>En nombre de<select id="jg-orgsel"><option value="">Solo yo</option>'+
      mias.map(function(o){return '<option value="'+o.id+'">'+esc(o.name)+'</option>';}).join("")+'</select></label>'+
      (d.usaBanco?'<label id="jg-bancol" hidden>Preguntas<select id="jg-banco"></select></label>':'');
    if($("jg-orgsel")&&d.usaBanco)$("jg-orgsel").onchange=function(){
      var id=this.value,l=$("jg-bancol"); if(!id){l.hidden=true;return;}
      api("/api/orgs/"+id+"/banks").then(function(b){ $("jg-banco").innerHTML='<option value="">Cultura general de la plataforma</option>'+
        b.banks.map(function(x){return '<option value="'+x.id+'">'+esc(x.name)+' ('+x.questions+')</option>';}).join(""); l.hidden=false; });
    };
  }).catch(function(){});
  $("jg-form").onsubmit=function(e){
    e.preventDefault(); var m=$("jg-cmsg");
    if($("jg-legal")&&!$("jg-legal").checked){m.className="msg bad";m.textContent="Confirma que cuentas con las autorizaciones.";return;}
    var op=u.leeOpciones?u.leeOpciones(this):{};
    if($("jg-banco")&&$("jg-banco").value)op.banco=+$("jg-banco").value;
    $("jg-crear").disabled=true;
    var fn=function(){return api("/api/salas",{juego:tipo,opciones:op,acceso:$("jg-acc").value,org_id:$("jg-orgsel")?$("jg-orgsel").value||null:null,
      titulo:$("jg-tit")?$("jg-tit").value:"",premio:$("jg-pre")?$("jg-pre").value:"",bases:$("jg-bases")?$("jg-bases").value:""});};
    fn().catch(function(er){ if(er&&er.error==="profile_required"&&window.AxRegistro)return AxRegistro.asegura().then(function(ok){if(ok)return fn();throw er;}); throw er; })
      .then(function(r){entra(r.code,false);})
      .catch(function(er){$("jg-crear").disabled=false;m.className="msg bad";m.textContent=error(er);});
  };
}

/* ===================== ENTRAR EN UNA SALA ===================== */
function entra(code,pantalla){
  sal(); intencional=false; codigoSala=code; esPantalla=!!pantalla; vista="sala";
  panel.innerHTML='<div class="panel"><p class="fine">Conectando…</p></div>';
  api("/api/salas/"+code).then(function(info){
    if(esPantalla){conecta("rol=pantalla");return;}
    var u=user();
    if(u&&info.adultos&&info.edad_ok===false)throw {error:"adults_only"};
    if(u){conecta("");return;}
    if(info.acceso==="libre")return pideApodo(info);
    identificate(info);
  }).catch(function(e){panel.innerHTML='<div class="panel retos"><button type="button" class="rt-back" id="jg-back">‹ Juegos</button><p class="fine bad">'+esc(error(e))+'</p></div>';$("jg-back").onclick=catalogo;});
}
function dispositivo(){
  var d=guarda("dev"); if(d&&/^[a-z0-9]{16,40}$/.test(d))return d;
  var a=new Uint8Array(12); crypto.getRandomValues(a); d=Array.prototype.map.call(a,function(b){return ("0"+b.toString(16)).slice(-2);}).join("");
  guarda("dev",d); return d;
}
function cabSala(info){
  return '<button type="button" class="rt-back" id="jg-back">‹ Juegos</button>'+
    (info.marca&&info.marca.name?'<div class="cq-marca">'+(info.marca.logo?'<img src="'+esc(info.marca.logo)+'" alt="">':'')+'<span>'+esc(info.marca.name)+'</span></div>':'')+
    '<h3>'+esc(info.titulo||info.nombre)+'</h3>'+(info.premio?'<p class="rt-prize">🏆 '+esc(info.premio)+'</p>':'');
}
function pideApodo(info){
  colorMarca(info.marca);
  panel.innerHTML='<div class="panel retos">'+cabSala(info)+'<p>Te unes a la sala <b>'+esc(info.code)+'</b>. Escribe cómo quieres que te vean los demás.</p>'+
    '<form class="rt-join" id="jg-ap"><input id="jg-apodo" maxlength="24" placeholder="Tu apodo" value="'+esc(guarda("apodo")||"")+'" autocomplete="nickname" style="text-transform:none;letter-spacing:0"><button class="primary" type="submit">Unirme</button></form>'+
    (window.AxAccount&&AxAccount.configurado()?'<p class="fine">O <a href="#" id="jg-g">entra con Google</a> para guardar tus resultados.</p>':'')+'<p class="msg" id="jg-msg"></p></div>';
  $("jg-back").onclick=catalogo;
  if($("jg-g"))$("jg-g").onclick=function(e){e.preventDefault();AxAccount.abrirCuenta();};
  $("jg-ap").onsubmit=function(e){e.preventDefault(); var a=$("jg-apodo").value.trim();
    if(a.length<2){var m=$("jg-msg");m.className="msg bad";m.textContent=ERR.bad_name;return;}
    guarda("apodo",a); conecta("nombre="+encodeURIComponent(a)+"&dev="+dispositivo());};
}
function identificate(info){
  colorMarca(info.marca);
  panel.innerHTML='<div class="panel retos">'+cabSala(info)+
    '<p>'+(info.adultos?'Este juego es solo para mayores de 18: hace falta una edad verificada.':'Para participar necesitas identificarte.')+'</p>'+
    (info.acceso==="invitados"&&window.AxInvitado?'<div class="actions"><button class="primary" id="jg-inv">Con mi teléfono o correo</button></div>':'')+
    (window.AxAccount&&AxAccount.configurado()?'<div class="actions"><button class="ghost" id="jg-g">Entrar con Google</button></div>':'')+'</div>';
  $("jg-back").onclick=catalogo;
  if($("jg-inv"))$("jg-inv").onclick=function(){AxInvitado.abre({sala:info.code,org_name:info.marca&&info.marca.name,prize:info.premio}).then(function(ok){if(ok)conecta("");});};
  if($("jg-g"))$("jg-g").onclick=function(){AxAccount.abrirCuenta();};
}
/* al entrar con Google en medio del proceso, se conecta solo */
document.addEventListener("ax-user",function(e){ if(activo&&codigoSala&&!ws&&!esPantalla&&e.detail)conecta(""); });

function conecta(q){
  clearTimeout(tReconecta); intencional=false;
  var url=(location.protocol==="https:"?"wss://":"ws://")+location.host+"/api/salas/"+codigoSala+"/ws"+(q?"?"+q:"");
  var yo=codigoSala, este=new WebSocket(url); ws=este; conecta.q=q;
  este.onopen=function(){if(ws!==este)return; reintento=0; clearInterval(tLatido); tLatido=setInterval(function(){try{ws.send('{"t":"ping"}');}catch(e){}},25000); aviso("");};
  este.onmessage=function(ev){
    if(ws!==este)return;                 /* mensajes rezagados de una sala que ya dejaste */
    var m; try{m=JSON.parse(ev.data);}catch(e){return;}
    if(m.t==="estado"){desfase=m.ahora-Date.now(); estado=m; pinta();}
    else if(m.t==="error"){ if(m.error==="kicked"){intencional=true;} aviso(error(m),true); }
  };
  este.onclose=function(ev){
    if(ws!==este)return;
    clearInterval(tLatido); ws=null;
    if(intencional||codigoSala!==yo)return;
    if(!estado){ /* no llegó a entrar: la respuesta HTTP dice por qué, se consulta la ficha */
      api("/api/salas/"+yo).then(function(){aviso("No se pudo entrar en la sala.",true);},function(e){aviso(error(e),true);});
      if(reintento>=2)return;
    }
    if(estado&&estado.sala.fase==="cerrada")return;
    var espera=Math.min(15000,1000*Math.pow(2,reintento++)); aviso("Conexión perdida. Reconectando…",true);
    tReconecta=setTimeout(function(){if(codigoSala===yo)conecta(conecta.q);},espera);
  };
}
function aviso(t,mal){var a=$("jg-aviso"); if(!a){if(!t)return; var p=panel.querySelector(".panel")||panel; a=document.createElement("p"); a.id="jg-aviso"; p.insertBefore(a,p.firstChild);}
  a.className="msg"+(mal?" bad":""); a.textContent=t||""; a.hidden=!t;}
function envia(m){ if(localE)return localEnvia(m); if(ws&&ws.readyState===1)ws.send(JSON.stringify(m)); }
function colorMarca(m){
  [panel,document.body].forEach(function(el){["--accent","--accent-tint","--marca","--marca-ink"].forEach(function(k){el.style.removeProperty(k);});});
  if(m&&/^#[0-9a-f]{6}$/i.test(m.color||"")){var el=esPantalla?document.body:panel;el.style.setProperty("--accent",m.color);el.style.setProperty("--accent-tint",m.color+"26");el.style.setProperty("--marca",m.color);el.style.setProperty("--marca-ink","#fff");}
}

/* ===================== PINTAR LA SALA ===================== */
function nombreDe(id){var s=estado&&estado.sala; if(!s)return "?";
  if(estado.g&&estado.g.nombres&&estado.g.nombres[id])return estado.g.nombres[id]; for(var i=0;i<s.jugadores.length;i++)if(s.jugadores[i].id===id)return s.jugadores[i].nombre; return "?";}
function ctx(){var s=estado.sala;return {envia:function(m){m.t="accion";envia(m);},yo:estado.yo,sala:s,ahora:ahora,nombre:nombreDe,local:!!localE,host:estado.yo.host,esc:esc};}
function pinta(){
  if(!activo||!estado)return;
  var s=estado.sala, d=J.def(s.juego), u=UI[s.juego]||{};
  if(esPantalla){document.body.setAttribute("data-proyector","1");}
  colorMarca(s.marca); hdr(localE?d.nombre:s.code);
  var marco=$("jg-sala");
  var clave=s.fase+"|"+(esPantalla?"p":"j");
  if(!marco||marco.getAttribute("data-clave")!==clave){
    panel.innerHTML='<div class="panel retos jg-salap'+(esPantalla?' jg-proy':'')+'" id="jg-sala" data-clave="'+clave+'"><div id="jg-cab"></div><div id="jg-cuerpo"></div></div>';
    marco=$("jg-sala");
  }
  var cab=$("jg-cab"), cuerpo=$("jg-cuerpo"), host=estado.yo.host;
  var cabH=(esPantalla?'':'<button type="button" class="rt-back" id="jg-back">‹ '+(localE?'Juegos':'Salir de la sala')+'</button>')+
    (s.marca&&s.marca.name?'<div class="cq-marca jg-marca">'+(s.marca.logo?'<img src="'+esc(s.marca.logo)+'" alt="">':'')+'<span>'+esc(s.marca.name)+(s.marca.tagline&&esPantalla?' · '+esc(s.marca.tagline):'')+'</span></div>':'')+
    '<div class="rt-head"><h3>'+(u.icono||"")+' '+esc(s.titulo||d.nombre)+'</h3>'+(localE?'':'<span class="chip">'+esc(s.code)+'</span>')+'</div>'+
    (s.premio?'<p class="rt-prize">🏆 '+esc(s.premio)+'</p>':'');
  if(cab.getAttribute("data-h")!==cabH){cab.innerHTML=cabH;cab.setAttribute("data-h",cabH);
    if($("jg-back"))$("jg-back").onclick=function(){ if(localE||confirm("¿Salir de la sala?"))catalogo(); };}
  if(s.fase==="espera")espera(cuerpo,s,host,d,u);
  else if(s.fase==="juego"){
    var fn=(esPantalla&&u.pantalla)||u.jugador;
    if(fn)fn(cuerpo,estado.g,ctx());
  }else if(s.fase==="fin")fin(cuerpo,s,host,d,u);
  else cuerpo.innerHTML='<p class="rt-hoy">La sala está cerrada.</p>';
}
function espera(el,s,host,d,u){
  var link=enlace("sala",s.code), qr=window.AxQR?AxQR.svg(link):"";
  var lista=s.jugadores.map(function(j){return '<span class="jg-pj'+(j.bot?' bot':'')+(j.conectado?'':' off')+'">'+(j.bot?'🤖 ':'')+esc(j.nombre)+
    (j.id===s.host?' <small>anfitrión</small>':'')+(host&&j.id!==s.host&&!esPantalla?'<button type="button" class="jg-x" data-quita="'+esc(j.id)+'" aria-label="Quitar">×</button>':'')+'</span>';}).join("");
  var h;
  if(esPantalla){
    h='<div class="jg-proy-espera"><div class="jg-proy-qr">'+qr+'</div><div><p class="jg-proy-paso">Escanea el código o entra en</p><p class="jg-proy-url">'+esc(location.host)+'</p>'+
      '<p class="jg-proy-paso">con el código</p><p class="jg-proy-code">'+esc(s.code)+'</p><p class="jg-proy-n"><b>'+s.total+'</b> '+(s.total===1?'jugador':'jugadores')+'</p></div></div>'+
      '<div class="jg-pjs">'+lista+'</div>';
  }else{
    h='<div class="jg-espera"><div class="jg-qr">'+qr+'</div><div class="jg-esp-t"><p>Que se unan con el código <b class="jg-code">'+esc(s.code)+'</b> o escaneando el QR.</p>'+
      '<div class="actions"><button type="button" class="ghost au-mini" id="jg-copia">Copiar enlace</button>'+(host?'<a class="ghost au-mini" id="jg-proy" href="'+esc(enlace("pantalla",s.code))+'" target="_blank" rel="noopener">Abrir en el proyector</a>':'')+'</div></div></div>'+
      '<h4>'+s.total+(s.total===1?' jugador':' jugadores')+' · de '+s.min+(s.max<1000?' a '+s.max:' en adelante')+'</h4><div class="jg-pjs">'+lista+'</div>';
    if(host){
      h+=(u.opciones&&u.leeOpciones?'<details class="au-nuevo"><summary>Opciones</summary><form class="rt-form" id="jg-op">'+u.opciones(s.opciones||{})+
        '<div class="actions"><button class="ghost" type="submit">Guardar opciones</button></div></form></details>':'')+
        '<div class="actions">'+(s.bots&&s.jugadores.length<s.max?'<button type="button" class="ghost" id="jg-addbot">+ Añadir bot</button>':'')+
        '<button type="button" class="primary" id="jg-empieza"'+(s.jugadores.length<s.min?' disabled':'')+'>Empezar</button></div>'+
        (s.jugadores.length<s.min?'<p class="fine">Hacen falta al menos '+s.min+' jugadores'+(s.bots?' (puedes añadir bots)':'')+'.</p>':'');
    }else h+='<p class="rt-hoy">Esperando a que '+esc(s.hostNombre||"el anfitrión")+' empiece…</p>';
  }
  if(s.bases)h+='<details class="cq-review"><summary>Bases</summary><p class="fine">'+esc(s.bases)+'</p></details>';
  if(el.getAttribute("data-h")===h)return; el.innerHTML=h; el.setAttribute("data-h",h);
  if($("jg-copia"))$("jg-copia").onclick=function(){var b=this; if(navigator.clipboard)navigator.clipboard.writeText(link).then(function(){b.textContent="Copiado";}); else prompt("Copia el enlace:",link);};
  if($("jg-addbot"))$("jg-addbot").onclick=function(){envia({t:"bot"});};
  if($("jg-empieza"))$("jg-empieza").onclick=function(){envia({t:"empezar"});};
  if($("jg-op"))$("jg-op").onsubmit=function(e){e.preventDefault();envia({t:"opciones",opciones:u.leeOpciones(this)});};
  var q=el.querySelectorAll("[data-quita]"),i; for(i=0;i<q.length;i++)q[i].onclick=function(){envia({t:"quitar",id:this.getAttribute("data-quita")});};
}
function fin(el,s,host,d,u){
  var res=(s.resultados||[]).slice().sort(function(a,b){return (a.puesto||99)-(b.puesto||99);});
  var extra=u.fin?u.fin(estado.g,ctx()):"";
  var h=(extra||'')+'<ol class="rt-rank jg-podio">'+res.map(function(x){var yo=x.id===estado.yo.id;
      return '<li class="'+(yo?'me':'')+'"><span class="pos">'+(x.puesto||"—")+'</span><span class="who">'+esc(x.nombre||nombreDe(x.id))+(x.nota?'<small>'+esc(x.nota)+'</small>':'')+'</span>'+
        (x.puntos!=null?'<span class="pts"><b>'+esc(x.puntos)+'</b>'+(x.unidad?'<small>'+esc(x.unidad)+'</small>':'')+'</span>':'')+'</li>';}).join("")+'</ol>'+
    (host&&!esPantalla?'<div class="actions"><button class="primary" id="jg-otra">Otra partida</button></div>':'')+
    (localE?'<div class="actions"><button class="primary" id="jg-rev">Revancha</button></div>':'');
  if(el.getAttribute("data-h")===h)return; el.innerHTML=h; el.setAttribute("data-h",h);
  if($("jg-otra"))$("jg-otra").onclick=function(){envia({t:"otra"});};
  if($("jg-rev"))$("jg-rev").onclick=function(){local(localE.juego,localE.cfg);};
}

/* ===================== PARTIDA LOCAL ===================== */
/* contra el bot o a dos en el mismo teléfono, con las mismas reglas y sin conexión */
function local(tipo,cfg){
  sal(); activo=true; var d=J.def(tipo), r=J.rng(Date.now()>>>0);
  var js=cfg.bot?[{id:"yo",nombre:"Tú"},{id:"bot",nombre:"Bot",bot:true}]:[{id:"j1",nombre:"Jugador 1"},{id:"j2",nombre:"Jugador 2"}];
  if(cfg.bot&&Math.random()<0.5)js.reverse();          /* quién empieza, a suertes */
  localE={juego:tipo,opciones:d.normaliza?d.normaliza(cfg.opciones||{},{}):(cfg.opciones||{}),jugadores:js,fase:"juego",g:null,cfg:cfg,r:r,nivel:cfg.nivel==null?1:cfg.nivel};
  localE.opciones.nivel=localE.nivel; localE.opciones.local=true;   /* sin reloj: se juega al ritmo de cada uno */
  d.inicia(localE,r,Date.now());
  refrescaLocal(); botLocal();
}
function turnoLocal(){var d=J.def(localE.juego);return d.turno?d.turno(localE):null;}
function localEnvia(m){
  var d=J.def(localE.juego), quien=localE.cfg.bot?"yo":turnoLocal();
  if(m.t==="otra"){local(localE.juego,localE.cfg);return;}
  if(m.t!=="accion")return;
  var x=d.accion(localE,quien,m,Date.now(),localE.r);
  if(x&&x.error){aviso(error(x),true);return;} aviso("");
  refrescaLocal(); botLocal();
}
function botLocal(){
  var E=localE; if(!E||E.g.fin)return; var d=J.def(E.juego), u=UI[E.juego];
  var t=turnoLocal(); if(!t||t!=="bot")return;
  setTimeout(function(){
    if(localE!==E||E.g.fin)return;
    var mv=u.botLocal?u.botLocal(E,"bot"):d.bot(E,"bot",E.r,Date.now());
    if(mv){d.accion(E,"bot",mv,Date.now(),E.r);refrescaLocal();botLocal();}
  },450);
}
function refrescaLocal(){
  var E=localE, d=J.def(E.juego), yo=E.cfg.bot?"yo":(turnoLocal()||"j1");
  if(E.g.fin&&E.fase!=="fin"){E.fase="fin";E.resultados=d.resultado?d.resultado(E):[];E.resultados.forEach(function(x){x.nombre=J.nombre(E,x.id);});}
  estado={yo:{id:yo,nombre:"Tú",rol:"jugador",host:false},sala:{code:"LOCAL",juego:E.juego,titulo:"",premio:"",fase:E.fase,host:"",total:2,min:2,max:2,
    jugadores:E.jugadores.map(function(j){return {id:j.id,nombre:j.nombre,bot:!!j.bot,conectado:true};}),resultados:E.resultados||null,opciones:E.opciones},
    g:d.vista(E,yo)};
  pinta();
}

/* se publica antes de atender los enlaces: si la sesión ya se conoce, el cambio de modo es inmediato */
window.AxSala={registra:registra,abrir:abrir,cerrar:cerrar,catalogo:catalogo,ficha:fichaJuego,entra:function(c,p){activo=true;panel.hidden=false;entra(c,p);},local:local,UI:UI,
  activo:function(){return activo;}};

/* ---------- enlaces: ?sala=CÓDIGO y ?pantalla=CÓDIGO ---------- */
(function(){
  var q=new URLSearchParams(location.search), c=q.get("sala"), p=q.get("pantalla");
  if(!c&&!p)return;
  var code=String(c||p).toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
  try{history.replaceState(null,"",location.pathname);}catch(e){}
  var ido=false, ir=function(){ if(ido)return; ido=true; if(window.AxApp){AxApp.setMode(p?"pantalla":"juegos"); entra(code,!!p);} };
  if(window.AxAccount&&AxAccount.listo())ir(); else document.addEventListener("ax-user",ir);
})();
})();
