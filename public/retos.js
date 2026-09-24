/* ===========================================================
   AXIOMA · Retos y sudoku en pareja (pantalla)
   Retos: concursos entre amigos con código, un sudoku igual para
   todos cada día y clasificación individual o por equipos.
   Pareja: dos personas resuelven el mismo tablero a la vez, cada
   una desde su móvil; las jugadas pasan por el servidor.
   Todo requiere la cuenta de Google: hace falta saber quién es quién.
   =========================================================== */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var M=window.AxSudokuMotor, panel=$("retos-panel");
if(!panel||!M)return;

var sub=null, vista=null, sondeo=null, salaCode=null, ultSeq=0, fichaCode=null;
var NIVELES=M.NIVELES, MODOS={solo:"Individual",equipo:"Por equipos",pareja:"Por parejas"};
var R=window.AxRapidos, RUI=window.AxRapidosUI;
function nomJuego(f){return f.game==="sudoku"?("Sudoku "+NIVELES[f.level].nom):(R.JUEGOS[f.game].icono+" "+R.JUEGOS[f.game].nom);}
function marca(f,x){return f.game==="sudoku"?reloj(x.seconds):R.formato(f.game,x.score,x.seconds);}

/* ---------- utilidades ---------- */
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function api(path,body,method){
  return fetch(path,{method:method||(body?"POST":"GET"),credentials:"same-origin",
    headers:{"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined})
    .then(function(r){return r.json().then(function(j){if(!r.ok)throw j;return j;});});
}
function user(){return window.AxAccount&&AxAccount.user();}
function dia(){return Math.floor((Date.now()-Date.UTC(2026,0,1))/86400000)+1;}
function reloj(s){var m=Math.floor(s/60),g=s%60;return m+":"+(g<10?"0":"")+g;}
function fecha(d){var t=new Date(Date.UTC(2026,0,1)+(d-1)*86400000);
  return t.toLocaleDateString("es",{day:"numeric",month:"short",timeZone:"UTC"});}
function enlace(tipo,code){return location.origin+location.pathname+"?"+tipo+"="+code;}
function tablero(nivel){var P=M.genera(nivel,Math.random);return {puzzle:P.puzzle.join(""),solution:P.solucion.join("")};}
function ERR(e){return {not_configured:"Faltan las tablas de retos en la base de datos. Pídele al administrador que ejecute schema.sql.",
  unauthorized:"Tienes que entrar con Google.",not_found:"No existe ningún reto con ese código.",
  finished:"Ese reto ya ha terminado.",full:"Está completo.",team_full:"Ese equipo ya está completo.",
  bad_team:"Escribe el nombre de tu equipo.",wrong_round:"Esa ronda no es la de hoy.",not_member:"No estás en ese reto.",
  already_played:"Ya jugaste esta ronda.",wrong_solution:"La rejilla no coincide con el tablero.",
  bad_time:"El tiempo no cuadra con el reloj del servidor.",use_coop:"Este reto se juega en pareja.",
  bad_level:"Nivel no válido.",bad_boards:"Los tableros no son válidos.",bad_result:"El resultado no es válido.",
  not_started:"Primero hay que abrir la ronda."}[e&&e.error]||"No se pudo completar. Inténtalo otra vez.";}
function avatar(u,cls){return u.picture?'<img class="'+(cls||"av")+'" src="'+esc(u.picture)+'" alt="" referrerpolicy="no-referrer">':'<span class="'+(cls||"av")+' noimg"></span>';}
function copia(texto,boton){
  var ok=function(){var t=boton.textContent;boton.textContent="Copiado";setTimeout(function(){boton.textContent=t;},1400);};
  if(navigator.clipboard)navigator.clipboard.writeText(texto).then(ok,function(){prompt("Copia el enlace:",texto);});
  else prompt("Copia el enlace:",texto);
}
function comparte(texto){
  if(navigator.share)navigator.share({text:texto}).catch(function(){});
  else if(navigator.clipboard)navigator.clipboard.writeText(texto);
}

/* ---------- entrada y salida del modo ---------- */
function abrir(m){
  sub=m; panel.hidden=false; ocultaJuego();
  if(m==="reto")verLista(); else verInicioPareja();
}
function cerrar(){ sub=null; panel.hidden=true; vista=null; paraSondeo(); ocultaJuego(); }
function ocultaJuego(){ $("sud-panel").hidden=true; $("sud-acts").hidden=true; $("sud-result").classList.remove("on"); if(RUI)RUI.cerrar(); }
function muestraJuego(){ $("sud-panel").hidden=false; $("sud-acts").hidden=false; }
function paraSondeo(){ if(sondeo){clearInterval(sondeo);sondeo=null;} salaCode=null; }
function pinta(h){ panel.innerHTML=h; }
function cab(){ if(sub)$("hdr").textContent=fichaCode||salaCode||"—"; }

/* Sin cuenta no hay retos: se explica y se ofrece entrar */
function puerta(){
  if(!window.AxAccount||!AxAccount.listo()){pinta('<p class="fine">Cargando…</p>');return false;}
  if(!AxAccount.configurado()){
    pinta('<h3>'+(sub==="reto"?"Retos":"Sudoku en pareja")+'</h3>'+
      '<p>Esta parte necesita cuentas para saber quién es quién, y en esta instalación el inicio de sesión no está configurado.</p>'+
      '<p class="fine">Quien administra la app puede activarlo siguiendo SETUP.md.</p>');
    return false;
  }
  if(!user()){
    pinta('<h3>'+(sub==="reto"?"Retos":"Sudoku en pareja")+'</h3>'+
      '<p>'+(sub==="reto"
        ? 'Concursos entre amigos: un código, un sudoku igual para todos cada día, una clasificación y un premio. Para participar hace falta entrar con Google, así cada resultado tiene nombre.'
        : 'Dos personas resuelven el mismo tablero a la vez, cada una desde su móvil, y el tiempo es de la pareja. Para jugar hace falta entrar con Google.')+'</p>'+
      '<div class="actions"><button class="primary" id="rt-login">Entrar con Google</button></div>');
    $("rt-login").onclick=function(){AxAccount.abrirCuenta();};
    return false;
  }
  return true;
}
document.addEventListener("ax-user",function(){ if(sub&&vista)vista(); });

/* ===================== RETOS ===================== */
function verLista(){
  vista=verLista; fichaCode=null; cab(); paraSondeo(); ocultaJuego();
  if(!puerta())return;
  pinta('<h3>Retos</h3>'+
    '<p class="fine">Concursos entre amigos: un código, un sudoku igual para todos cada día y una clasificación. Quien organiza pone el premio.</p>'+
    '<div class="actions"><button class="primary" id="rt-crear">Crear un reto</button></div>'+
    '<form class="rt-join" id="rt-join"><input id="rt-code" placeholder="Código del reto" maxlength="6" autocapitalize="characters" autocomplete="off" spellcheck="false"><button type="submit" class="ghost">Unirme</button></form>'+
    '<h4>Tus retos</h4><div id="rt-lista"><p class="fine">Cargando…</p></div>');
  $("rt-crear").onclick=verCrear;
  $("rt-join").onsubmit=function(e){e.preventDefault();var c=$("rt-code").value.trim().toUpperCase();if(c.length===6)verFicha(c);};
  api("/api/events").then(function(r){
    var h="";
    if(!r.events.length)h='<p class="fine">Todavía no estás en ningún reto. Crea uno o entra con el código que te hayan pasado.</p>';
    r.events.forEach(function(e){
      var est=e.state==="activo"?(e.today_round>e.rounds?"Has jugado todo":"Ronda "+e.today_round+" de "+e.rounds):e.state==="pronto"?("Empieza el "+fecha(e.start_day)):"Terminado";
      h+='<button type="button" class="rt-card" data-code="'+e.code+'">'+
        '<span class="rt-card-top"><b>'+esc(e.name)+'</b><span class="chip '+e.state+'">'+est+'</span></span>'+
        '<small>'+esc(nomJuego(e))+' · '+MODOS[e.mode]+(e.mode==="equipo"?" de "+e.team_size:"")+' · '+e.members+(e.members===1?" jugador":" jugadores")+
        (e.prize?' · Premio: '+esc(e.prize):'')+(e.owner?' · Organizas tú':'')+'</small></button>';
    });
    $("rt-lista").innerHTML=h;
    var bs=$("rt-lista").querySelectorAll(".rt-card"),i;
    for(i=0;i<bs.length;i++)bs[i].onclick=function(){verFicha(this.getAttribute("data-code"));};
  }).catch(function(e){$("rt-lista").innerHTML='<p class="fine bad">'+esc(ERR(e))+'</p>';});
}

function verCrear(){
  vista=verCrear; if(!puerta())return;
  var hoy=dia(), niv="",l, jgs='<option value="sudoku">Sudoku</option>';
  for(l=1;l<=5;l++)niv+='<option value="'+l+'">'+NIVELES[l].nom+' · '+NIVELES[l].pistas+' pistas'+(l===5?" · sin ayudas":"")+'</option>';
  Object.keys(R.JUEGOS).forEach(function(k){jgs+='<option value="'+k+'">'+R.JUEGOS[k].icono+' '+R.JUEGOS[k].nom+' · '+R.JUEGOS[k].dur+'</option>';});
  pinta('<button type="button" class="rt-back" id="rt-back">‹ Tus retos</button><h3>Crear un reto</h3>'+
    '<form class="rt-form" id="rt-form">'+
    '<label>Nombre<input id="f-name" maxlength="60" required placeholder="Copa de la fraternidad"></label>'+
    '<label>Juego<select id="f-game">'+jgs+'</select></label>'+
    '<p class="fine" id="f-jdesc">Un sudoku por día, el mismo para todos. Gana quien complete más rondas y, a igualdad, quien sume menos tiempo.</p>'+
    '<label id="f-level-l">Nivel del sudoku<select id="f-level">'+niv+'</select></label>'+
    '<label>Modalidad<select id="f-mode"><option value="solo">Individual</option><option value="equipo">Por equipos</option><option value="pareja" id="f-mode-pareja">Por parejas (a cuatro manos)</option></select></label>'+
    '<label id="f-size-l" hidden>Jugadores por equipo<input id="f-size" type="number" min="2" max="10" value="3"></label>'+
    '<div class="rt-2"><label>Empieza<select id="f-start"><option value="0">Hoy</option><option value="1">Mañana</option><option value="2">Pasado mañana</option><option value="7">Dentro de una semana</option></select></label>'+
    '<label id="f-rounds-l">Días (un tablero por día)<input id="f-rounds" type="number" min="1" max="31" value="1"></label></div>'+
    '<label id="f-days-l" hidden>Se puede jugar durante<select id="f-days"><option value="1">Ese día</option><option value="3">Tres días</option><option value="7">Una semana</option></select></label>'+
    '<label>Premio para quien gane<input id="f-prize" maxlength="200" placeholder="Una pizza"></label>'+
    '<label>Penitencia para quien quede último<input id="f-forfeit" maxlength="200" placeholder="Lava los platos (o gira la ruleta)"></label>'+
    '<p class="fine" id="f-nota">Cada jugador compite por su cuenta.</p>'+
    '<div class="actions"><button class="primary" type="submit" id="f-go">Crear y obtener el código</button></div>'+
    '<p class="msg" id="f-msg"></p></form>');
  $("rt-back").onclick=verLista;
  function ajusta(){
    var g=$("f-game").value, m=$("f-mode").value, sud=(g==="sudoku");
    $("f-level-l").hidden=!sud; $("f-days-l").hidden=sud;
    $("f-rounds-l").firstChild.textContent=sud?"Días (un tablero por día)":"Rondas (partidas seguidas)";
    $("f-rounds").max=sud?31:10; if(!sud&&+$("f-rounds").value>10)$("f-rounds").value=10;
    $("f-mode-pareja").disabled=!sud; if(!sud&&m==="pareja"){$("f-mode").value="solo";m="solo";}
    $("f-size-l").hidden=(m!=="equipo");
    var lv=$("f-level"); lv.querySelector('[value="5"]').disabled=(m==="pareja"); if(m==="pareja"&&lv.value==="5")lv.value="4";
    $("f-jdesc").textContent = sud ? "Un sudoku por día, el mismo para todos. Gana quien complete más rondas y, a igualdad, quien sume menos tiempo."
      : R.JUEGOS[g].desc+" Las rondas se juegan una tras otra, cada una con "+(R.JUEGOS[g].orden==="puntos"?"sus puntos":"su tiempo")+", y gana quien complete más rondas y, a igualdad, quien "+(R.JUEGOS[g].orden==="puntos"?"sume más puntos":"sume menos tiempo")+".";
    $("f-nota").textContent = m==="equipo" ? "Cada jugador juega su ronda; el equipo completa una ronda cuando la han terminado todos, con la media de sus marcas. Al unirse, cada uno escribe el nombre de su equipo."
      : m==="pareja" ? "Cada ronda se juega a cuatro manos: una persona crea la sala desde el reto y su pareja entra con el código. El tiempo es de la pareja."
      : "Cada jugador compite por su cuenta.";
  }
  $("f-game").onchange=ajusta; $("f-mode").onchange=ajusta; ajusta();
  $("rt-form").onsubmit=function(e){
    e.preventDefault();
    var g=$("f-game").value, sud=(g==="sudoku");
    var level=+$("f-level").value, rounds=Math.min(sud?31:10,Math.max(1,+$("f-rounds").value||1)), mode=$("f-mode").value;
    var msg=$("f-msg"), go=$("f-go"); go.disabled=true; msg.className="msg"; msg.textContent=sud?("Generando "+rounds+(rounds>1?" tableros…":" tablero…")):"Creando…";
    setTimeout(function(){
      var boards=[],i; if(sud)for(i=0;i<rounds;i++)boards.push(tablero(level));
      api("/api/events",{name:$("f-name").value,game:g,level:level,mode:mode,team_size:+$("f-size").value,
                         pace:sud?"diario":"seguido",days:+$("f-days").value,
                         start_day:hoy+(+$("f-start").value),rounds:rounds,prize:$("f-prize").value,forfeit:$("f-forfeit").value,boards:boards})
        .then(function(r){verFicha(r.code,true);})
        .catch(function(e){go.disabled=false;msg.className="msg bad";msg.textContent=ERR(e);});
    },30);
  };
}

var refresco=null;
function verFicha(code,recien){
  vista=function(){verFicha(code);}; fichaCode=code; cab(); paraSondeo(); ocultaJuego();
  if(refresco){clearTimeout(refresco);refresco=null;}
  if(!puerta())return;
  api("/api/events/"+code).then(function(f){
    var todas=f.today_round>f.rounds, seguido=f.pace==="seguido";
    var est=f.state==="activo"?(todas?"Has jugado todo":"Ronda "+f.today_round+" de "+f.rounds):f.state==="pronto"?("Empieza el "+fecha(f.start_day)):"Terminado";
    var h='<button type="button" class="rt-back" id="rt-back">‹ Tus retos</button>'+
      '<div class="rt-head"><h3>'+esc(f.name)+'</h3><span class="chip '+f.state+'">'+est+'</span></div>'+
      '<p class="rt-meta">'+esc(nomJuego(f))+' · '+MODOS[f.mode]+(f.mode==="equipo"?" de "+f.team_size:"")+' · '+
        (seguido ? (f.rounds+(f.rounds===1?" ronda":" rondas seguidas")+(f.days===1?", el "+fecha(f.start_day):", del "+fecha(f.start_day)+" al "+fecha(f.start_day+f.days-1)))
                 : (f.rounds===1?"un día, el "+fecha(f.start_day):f.rounds+" días desde el "+fecha(f.start_day)))+
        ' · organiza '+esc(f.owner?"tú":f.owner_name)+'</p>'+
      (f.prize?'<p class="rt-prize">🏆 '+esc(f.prize)+'</p>':'')+
      (f.forfeit?'<p class="rt-forfeit">😈 Penitencia para el último: '+esc(f.forfeit)+'</p>':'')+
      final(f)+
      '<div class="rt-code"><span>Código</span><b>'+f.code+'</b><button type="button" class="ghost" id="rt-copy">Copiar enlace</button>'+
        (navigator.share?'<button type="button" class="ghost" id="rt-share">Invitar</button>':'')+'</div>'+
      (recien?'<p class="fine ok">Reto creado. Pasa el código o el enlace a quien quieras que participe.</p>':'');

    /* qué puede hacer quien mira */
    if(!f.member){
      h+='<form class="rt-form" id="rt-unir">'+(f.mode==="equipo"?
        '<label>Tu equipo<input id="rt-team" maxlength="30" required list="rt-teams" placeholder="Nombre del equipo"><datalist id="rt-teams">'+
          equipos(f.members).map(function(t){return '<option value="'+esc(t)+'">';}).join("")+'</datalist></label>':'')+
        '<div class="actions"><button class="primary" type="submit"'+(f.state==="terminado"?" disabled":"")+'>Unirme al reto</button></div><p class="msg" id="rt-msg"></p></form>';
    }else if(f.mode==="equipo"&&!f.team&&f.state!=="terminado"){
      /* está dentro (p. ej. quien lo organizó) pero aún sin equipo */
      h+='<form class="rt-form" id="rt-unir"><label>Tu equipo<input id="rt-team" maxlength="30" required list="rt-teams" placeholder="Nombre del equipo"><datalist id="rt-teams">'+
          equipos(f.members).map(function(t){return '<option value="'+esc(t)+'">';}).join("")+'</datalist></label>'+
          '<div class="actions"><button class="primary" type="submit">Elegir equipo</button></div><p class="fine">Para jugar hace falta estar en un equipo. Si solo organizas, no elijas ninguno.</p><p class="msg" id="rt-msg"></p></form>';
    }else if(f.state==="activo"){
      if(todas){
        h+='<p class="rt-hoy ok">Has jugado las '+f.rounds+' rondas. Mira cómo queda la clasificación.</p>';
      }else if(f.my_today){
        h+='<p class="rt-hoy ok">Hoy ya jugaste: <b>'+esc(marca(f,f.my_today))+'</b>'+(f.my_today.errors?" · "+f.my_today.errors+" fallos":"")+(f.my_today.hints?" · "+f.my_today.hints+" pistas":"")+'. Mañana habrá otro tablero.</p>';
      }else if(f.mode==="pareja"){
        h+='<div class="actions"><button class="primary" id="rt-sala">Crear sala para la ronda de hoy</button></div>'+
           '<form class="rt-join" id="rt-join-sala"><input id="rt-sala-code" placeholder="Código de la sala de tu pareja" maxlength="6" autocapitalize="characters" autocomplete="off"><button type="submit" class="ghost">Entrar</button></form>'+
           '<p class="fine">Una persona crea la sala y le pasa el código a su pareja. Cuando estéis las dos, a jugar: el tiempo cuenta para el reto.</p><p class="msg" id="rt-msg"></p>';
      }else{
        h+='<div class="actions"><button class="primary" id="rt-jugar">Jugar la ronda '+f.today_round+(seguido?" de "+f.rounds:" de hoy")+'</button></div>'+
           '<p class="fine">'+(f.game==="sudoku"?"El tiempo empieza a contar en cuanto abras el tablero y solo vale el primer intento.":"Solo vale el primer intento de cada ronda.")+'</p>';
      }
      if(f.team)h+='<p class="fine">Tu equipo: <b>'+esc(f.team)+'</b></p>';
    }else if(f.state==="pronto"){
      h+='<p class="rt-hoy">Estás dentro. El primer tablero se abre el '+fecha(f.start_day)+'.</p>';
    }

    /* clasificación */
    if(f.teams&&f.teams.length){
      h+='<h4>Equipos</h4><ol class="rt-rank">';
      f.teams.forEach(function(t){
        h+='<li'+(t.me?' class="me"':'')+'><span class="pos">'+t.rank+'</span><span class="who"><b>'+esc(t.team)+'</b><small>'+esc(t.names.join(", "))+'</small></span>'+
           '<span class="pts"><b>'+t.rounds+'/'+f.rounds+'</b><small>'+(t.rounds?esc(marca(f,t)):"—")+'</small></span></li>';
      });
      h+='</ol>';
    }
    h+='<h4>'+(f.teams?"Jugadores":"Clasificación")+'</h4>';
    if(!f.players.length)h+='<p class="fine">Todavía no hay nadie.</p>';
    else{
      h+='<ol class="rt-rank">';
      f.players.forEach(function(p){
        h+='<li'+(p.me?' class="me"':'')+'><span class="pos">'+p.rank+'</span>'+avatar(p)+'<span class="who">'+esc(p.name)+(p.me?' <em>(tú)</em>':'')+(p.team?'<small>'+esc(p.team)+'</small>':'')+'</span>'+
           '<span class="pts"><b>'+p.rounds+'/'+f.rounds+'</b><small>'+(p.rounds?esc(marca(f,p)):"—")+'</small></span></li>';
      });
      h+='</ol>';
    }
    var ord=f.game==="sudoku"?"tiempo":R.JUEGOS[f.game].orden;
    h+='<p class="fine">Cuenta más rondas y, a igualdad, '+(ord==="puntos"?"más puntos en total":ord==="menos"?"menos tiempo en total":"menos tiempo total (fallos y pistas ya penalizados)")+'. '+
       (f.state==="terminado"?'El reto ha terminado.':'Se actualiza sola cada pocos segundos.')+'</p>'+
       '<div class="actions"><button type="button" class="ghost" id="rt-ruleta">🎲 Ruleta de penitencias</button></div><p class="rt-ruleta" id="rt-ruleta-txt" hidden></p>';
    pinta(h);
    $("rt-ruleta").onclick=ruleta;

    $("rt-back").onclick=verLista;
    $("rt-copy").onclick=function(){copia(enlace("reto",f.code),this);};
    if($("rt-share"))$("rt-share").onclick=function(){comparte("Únete a mi reto «"+f.name+"» en Axioma: "+enlace("reto",f.code));};
    if($("rt-unir"))$("rt-unir").onsubmit=function(e){
      e.preventDefault();
      api("/api/events/"+code+"/join",{team:$("rt-team")?$("rt-team").value:""}).then(function(){verFicha(code);})
        .catch(function(er){$("rt-msg").className="msg bad";$("rt-msg").textContent=ERR(er);});
    };
    if($("rt-jugar"))$("rt-jugar").onclick=function(){jugarRonda(f);};
    if($("rt-sala"))$("rt-sala").onclick=function(){
      this.disabled=true;
      api("/api/coop",{level:f.level,puzzle:"",solution:"",event_code:f.code}).then(function(r){abrirSala(r.code,f);})
        .catch(function(er){$("rt-msg").className="msg bad";$("rt-msg").textContent=ERR(er);});
    };
    if($("rt-join-sala"))$("rt-join-sala").onsubmit=function(e){
      e.preventDefault(); var c=$("rt-sala-code").value.trim().toUpperCase();
      if(c.length===6)entrarSala(c,f,function(er){$("rt-msg").className="msg bad";$("rt-msg").textContent=ERR(er);});
    };
    if(f.state!=="terminado")refresco=setTimeout(function(){ if(vista&&fichaCode===code&&$("sud-panel").hidden)verFicha(code); },15000);
  }).catch(function(e){
    pinta('<button type="button" class="rt-back" id="rt-back">‹ Tus retos</button><p class="fine bad">'+esc(ERR(e))+'</p>');
    $("rt-back").onclick=verLista;
  });
}
function equipos(members){
  var v={},o=[]; members.forEach(function(m){if(m.team&&!v[m.team]){v[m.team]=1;o.push(m.team);}}); return o;
}

/* al terminar el reto: quién ganó y a quién le toca la penitencia */
function final(f){
  if(f.state!=="terminado")return "";
  var lista=(f.teams&&f.teams.length)?f.teams:f.players, con=lista.filter(function(x){return x.rounds>0;});
  if(!con.length)return '<div class="rt-final"><p>Nadie llegó a jugar. Otra vez será.</p></div>';
  var nom=function(x){return x.team?x.team:x.name;};
  var h='<div class="rt-final"><p>🏆 <b>'+esc(nom(con[0]))+'</b> gana'+(f.prize?': '+esc(f.prize):'')+'.</p>';
  if(lista.length>1){var ult=lista[lista.length-1];h+='<p>😈 Penitencia para <b>'+esc(nom(ult))+'</b>'+(f.forfeit?': '+esc(f.forfeit):' (gira la ruleta)')+'.</p>';}
  return h+'</div>';
}
function ruleta(){
  var t=$("rt-ruleta-txt"), b=$("rt-ruleta"); if(!t)return;
  t.hidden=false; b.disabled=true;
  var n=0, L=R.PENITENCIAS, fin=L[Math.floor(Math.random()*L.length)];
  var giro=setInterval(function(){
    t.textContent=L[Math.floor(Math.random()*L.length)];
    if(++n>=12){clearInterval(giro);t.textContent="😈 "+fin;b.disabled=false;}
  },90);
}

function jugarRonda(f){
  if(f.game!=="sudoku"){jugarRapida(f);return;}
  api("/api/events/"+f.code+"/round/"+f.today_round).then(function(t){
    AxSudoku.cargar({
      modo:"reto",nivel:t.level,puzzle:t.puzzle,solucion:t.solution,hecho:t.done,
      brief:'Reto <strong>'+esc(f.name)+'</strong> · ronda '+t.round+' de '+f.rounds+'. El mismo tablero para todos.',
      titulo:"Reto «"+f.name+"» · ronda "+t.round+" · "+NIVELES[t.level].nom,
      alTerminar:function(res){
        api("/api/events/"+f.code+"/result",{round:t.round,grid:res.grid,seconds:res.seconds,errors:res.errors,hints:res.hints})
          .then(function(r){verFicha(f.code);muestraJuego();$("sud-msg").textContent="¡Registrado en el reto: "+reloj(r.seconds)+" según el reloj del servidor!";})
          .catch(function(er){$("sud-msg").className="msg bad";$("sud-msg").textContent="No se pudo registrar: "+ERR(er);});
      }
    });
    muestraJuego(); $("sud-panel").scrollIntoView({behavior:"smooth",block:"start"});
  }).catch(function(e){alert(ERR(e));});
}
/* ronda de un juego rápido: los datos llegan al pulsar Empezar (ahí
   arranca el reloj del servidor) y el resultado se envía al acabar */
function jugarRapida(f){
  if(!RUI)return;
  var ronda=f.today_round;
  panel.hidden=true;
  RUI.jugar({
    juego:f.game, sub:"Ronda "+ronda+" de "+f.rounds, titulo:"Reto «"+f.name+"»",
    pedirDatos:function(){
      return api("/api/events/"+f.code+"/round/"+ronda).then(function(t){
        if(t.done){panel.hidden=false;RUI.cerrar();verFicha(f.code);return null;}
        return t.datos;
      });
    },
    error:ERR,
    alTerminar:function(envio,res){
      api("/api/events/"+f.code+"/result",{round:ronda,envio:envio}).then(function(r){
        panel.hidden=false; RUI.cerrar(); verFicha(f.code);
        $("hdr").textContent=r.formato||"";
        setTimeout(function(){var m=panel.querySelector(".rt-hoy,.actions");
          var p=document.createElement("p");p.className="rt-hoy ok";p.innerHTML="Ronda "+ronda+" registrada: <b>"+esc(r.formato||"")+"</b>";
          panel.insertBefore(p,panel.querySelector(".rt-code").nextSibling);},600);
      }).catch(function(er){
        panel.hidden=false; RUI.cerrar(); verFicha(f.code);
        setTimeout(function(){var p=document.createElement("p");p.className="rt-hoy";p.textContent="No se pudo registrar: "+ERR(er);
          panel.insertBefore(p,panel.querySelector(".rt-code").nextSibling);},600);
      });
    }
  });
  $("rapido-panel").scrollIntoView({behavior:"smooth",block:"start"});
}

/* ===================== PAREJA ===================== */
function verInicioPareja(){
  vista=verInicioPareja; fichaCode=null; cab(); paraSondeo(); ocultaJuego();
  if(!puerta())return;
  var niv="",l; for(l=1;l<=4;l++)niv+='<option value="'+l+'">'+NIVELES[l].nom+'</option>';
  pinta('<h3>Sudoku en pareja</h3>'+
    '<p class="fine">Dos personas, un tablero, cada una desde su móvil. Las cifras que pone una las ve la otra al instante y el tiempo es de las dos. Solo entra la cifra correcta; dos fallos no cuestan, desde el tercero suman 30 s. Sin pistas.</p>'+
    '<form class="rt-form" id="pj-crear"><label>Nivel<select id="pj-level">'+niv+'</select></label>'+
    '<div class="actions"><button class="primary" type="submit">Crear sala</button></div></form>'+
    '<form class="rt-join" id="pj-join"><input id="pj-code" placeholder="Código de la sala" maxlength="6" autocapitalize="characters" autocomplete="off" spellcheck="false"><button type="submit" class="ghost">Entrar</button></form>'+
    '<p class="msg" id="pj-msg"></p>'+
    '<p class="fine">¿Queréis competir contra otras parejas? Crea un reto <b>por parejas</b> en Retos y cada ronda se jugará en una sala como esta.</p>');
  $("pj-crear").onsubmit=function(e){
    e.preventDefault(); var lvl=+$("pj-level").value, t=tablero(lvl);
    api("/api/coop",{level:lvl,puzzle:t.puzzle,solution:t.solution}).then(function(r){abrirSala(r.code);})
      .catch(function(er){$("pj-msg").className="msg bad";$("pj-msg").textContent=ERR(er);});
  };
  $("pj-join").onsubmit=function(e){
    e.preventDefault(); var c=$("pj-code").value.trim().toUpperCase();
    if(c.length===6)entrarSala(c,null,function(er){$("pj-msg").className="msg bad";$("pj-msg").textContent=ERR(er);});
  };
}

function entrarSala(code,f,alFallar){
  api("/api/coop/"+code+"/join",{}).then(function(){abrirSala(code,f);}).catch(function(er){if(alFallar)alFallar(er);else alert(ERR(er));});
}

function abrirSala(code,f){
  vista=function(){abrirSala(code,f);}; salaCode=code; fichaCode=f?f.code:null; cab(); ultSeq=0;
  if(sondeo){clearInterval(sondeo);sondeo=null;}
  api("/api/coop/"+code).then(function(e){
    if(!f&&e.event_code)fichaCode=e.event_code;   /* sala de un reto abierta por enlace */
    AxSudoku.cargar({
      modo:"pareja",nivel:e.level,puzzle:e.puzzle,
      brief:(f?'Reto <strong>'+esc(f.name)+'</strong> · ronda '+e.round+' de '+f.rounds+' · ':'')+'Sudoku <strong>a cuatro manos</strong>.',
      titulo:(f?"Reto «"+f.name+"» · ronda "+e.round+" · en pareja":"Sudoku de Axioma en pareja · "+NIVELES[e.level].nom),
      jugar:function(k,n){return api("/api/coop/"+code+"/move",{k:k,n:n}).catch(function(er){
        if(er&&er.error==="finished")return null; throw er;});},
      alTerminar:function(){ paraSondeo(); salaCode=code;
        api("/api/coop/"+code).then(function(s){pintaSala(s,true);}).catch(function(){pintaSala(e,true);}); }
    });
    pintaSala(e,false); aplica(e); muestraJuego();
    sondeo=setInterval(function(){
      api("/api/coop/"+code+"?after="+ultSeq).then(function(s){ aplica(s); pintaSala(s,!!s.finished_at); if(s.finished_at)paraSondeo(); })
        .catch(function(){});
    },2000);
  }).catch(function(er){
    pinta('<button type="button" class="rt-back" id="rt-back">‹ Volver</button><p class="fine bad">'+esc(ERR(er))+'</p>');
    $("rt-back").onclick=f?function(){verFicha(f.code);}:verInicioPareja;
  });
}
function aplica(s){
  (s.moves||[]).forEach(function(m){if(m.seq>ultSeq)ultSeq=m.seq;});
  AxSudoku.sincroniza(s);
}
function pintaSala(s,fin){
  var f=fichaCode, dos=s.members.length>=2;
  var h='<button type="button" class="rt-back" id="rt-back">‹ '+(f?"Volver al reto":"Salas")+'</button>'+
    '<div class="rt-head"><h3>Sala '+s.code+'</h3><span class="chip '+(fin?"terminado":dos?"activo":"pronto")+'">'+(fin?"Resuelto":dos?"En juego":"Esperando")+'</span></div>'+
    '<div class="rt-pj">'+s.members.map(function(m){return '<span class="rt-pj-m'+(m.me?" me":"")+'">'+avatar(m)+esc(m.me?"Tú":m.name)+'</span>';}).join("")+
    (dos?'':'<span class="rt-pj-m falta">Tu pareja…</span>')+'</div>';
  if(!dos&&!fin)h+='<div class="rt-code"><span>Código</span><b>'+s.code+'</b><button type="button" class="ghost" id="rt-copy">Copiar enlace</button>'+
      (navigator.share?'<button type="button" class="ghost" id="rt-share">Invitar</button>':'')+'</div>'+
      '<p class="fine">Pásale el código a tu pareja. Podéis empezar ya; el reloj arranca con la primera cifra.</p>';
  if(fin&&s.seconds!=null)h+='<p class="rt-hoy ok">Resuelto en <b>'+reloj(s.seconds)+'</b>'+(s.errors?' · '+s.errors+' fallos':'')+(f?'. El tiempo ya cuenta en el reto.':'')+'</p>';
  pinta(h);
  $("rt-back").onclick=function(){paraSondeo();if(f)verFicha(f);else verInicioPareja();};
  if($("rt-copy"))$("rt-copy").onclick=function(){copia(enlace("pareja",s.code),this);};
  if($("rt-share"))$("rt-share").onclick=function(){comparte("Resolvamos un sudoku a cuatro manos en Axioma: "+enlace("pareja",s.code));};
}

/* ---------- entrada por enlace ---------- */
(function(){
  var q=new URLSearchParams(location.search), r=q.get("reto"), p=q.get("pareja");
  if(!r&&!p||!window.AxApp)return;
  var code=(r||p).toUpperCase().slice(0,6);
  try{history.replaceState(null,"",location.pathname);}catch(e){}
  var ido=false;
  var ir=function(){
    if(ido)return; ido=true;
    AxApp.setMode(r?"reto":"pareja");
    if(r)verFicha(code); else entrarSala(code,null,function(er){pinta('<p class="fine bad">'+esc(ERR(er))+'</p>');});
  };
  if(window.AxAccount&&AxAccount.listo())ir(); else document.addEventListener("ax-user",ir);
})();

window.AxRetos={abrir:abrir,cerrar:cerrar};
})();
