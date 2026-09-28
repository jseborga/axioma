/* ===========================================================
   THE FINAL TEST · aula (pantalla)
   Instituciones con su estructura configurable, miembros y roles;
   cursos por paralelo con enlace de ingreso; bancos de preguntas con
   importación desde Excel o texto y vista previa; cuestionarios de
   curso; registros con filtros; y la administración de la plataforma.
   Los cuestionarios se juegan y se revisan en la pantalla de concursos.
   =========================================================== */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var panel=$("aula-panel"); if(!panel)return;
var BF=window.AxBanco, XL=window.AxExcel;

var vista=null, activo=false, pendiente=null;
var TIPOS={universidad:"Universidad",instituto:"Instituto",colegio:"Colegio",empresa:"Empresa",comunidad:"Comunidad"};
var PLANTILLAS={universidad:["Facultad","Carrera","Materia"],instituto:["Carrera","Materia"],colegio:["Nivel","Curso","Materia"],empresa:["Área","Equipo"],comunidad:["Grupo"]};
var ROLES={admin:"Administración",docente:"Docente",auxiliar:"Auxiliar",estudiante:"Estudiante",auspiciador:"Auspiciador"};
var PARCIALES=["Práctica","Primer parcial","Segundo parcial","Tercer parcial","Examen final","Segunda instancia"];
var NIV={1:"Fácil",2:"Medio",3:"Difícil"};

/* ---------- utilidades ---------- */
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function api(path,body){
  return fetch(path,{method:body?"POST":"GET",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().then(function(j){if(!r.ok)throw j;return j;});});
}
/* si falta el registro con consentimiento, se pide y se reintenta */
function conRegistro(f){
  return f().catch(function(e){
    if(e&&e.error==="profile_required"&&window.AxRegistro)return AxRegistro.asegura().then(function(ok){if(ok)return f();throw e;});
    throw e;
  });
}
function user(){return window.AxAccount&&AxAccount.user();}
function pinta(h){panel.innerHTML=h;}
function fecha(ms){return new Date(ms).toLocaleString("es",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});}
function enlace(p,c){return location.origin+location.pathname+"?"+p+"="+c;}
function copia(t,b){var o=b.textContent;
  if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){b.textContent="Copiado";setTimeout(function(){b.textContent=o;},1400);});
  else prompt("Copia el enlace:",t);}
function ERR(e){return {not_configured:"Faltan las tablas del aula en la base de datos: hay que volver a ejecutar schema.sql (ver SETUP.md).",
  unauthorized:"Tienes que entrar con Google.",profile_required:"Primero completa tu registro.",forbidden:"No tienes permiso para esto.",
  not_found:"No existe o ya no está disponible.",org_pending:"La institución todavía no está aprobada por la administración de la plataforma.",
  org_suspended:"La institución está suspendida.",domain:"Esta institución solo admite cuentas del dominio @"+(e&&e.domain||"")+".",
  student_code_required:"Escribe tu registro universitario (o código de estudiante).",archived:"Este curso está archivado.",
  bad_name:"El nombre es demasiado corto.",bad_domain:"El dominio no es válido (ejemplo: umsa.bo).",levels_in_use:"No se puede quitar un nivel que tiene unidades.",
  unit_in_use:"No se puede borrar: tiene unidades, cursos o bancos asociados.",too_deep:"Ese nivel no existe en la estructura.",
  last_admin:"La institución no puede quedarse sin administración.",too_many:"Has llegado al límite.",empty_pool:"No hay preguntas con ese tema y nivel en el banco.",
  forbidden_bank:"No puedes usar ese banco en este curso.",bank_full:"El banco está lleno (máximo "+(e&&e.max||"")+" preguntas).",
  bad_end:"El cuestionario tiene que durar entre 5 minutos y 31 días.",bad_start:"La fecha de inicio no es válida.",invalid:(e&&e.errores||[]).join(" ")
  }[e&&e.error]||"No se pudo completar. Inténtalo otra vez.";}
function aviso(id,t,mal){var m=$(id);if(!m)return;m.className="msg"+(mal?" bad":" good");m.textContent=t;}
function atras(t,f){return '<button type="button" class="rt-back" id="au-back">‹ '+esc(t)+'</button>';}
function tabs(lista,actual){
  return '<div class="seg au-tabs" role="tablist">'+lista.map(function(t){
    return '<button type="button" role="tab" data-tab="'+t[0]+'" aria-selected="'+(t[0]===actual)+'">'+t[1]+'</button>';}).join("")+'</div>';
}
function ligaTabs(f){var bs=panel.querySelectorAll(".au-tabs [data-tab]"),i;for(i=0;i<bs.length;i++)bs[i].onclick=function(){f(this.getAttribute("data-tab"));};}
function chipEstado(s){return '<span class="chip '+(s==="activa"?"activo":s==="pendiente"?"pronto":"terminado")+'">'+
  ({activa:"Activa",pendiente:"Pendiente",suspendida:"Suspendida"}[s]||s)+'</span>';}
function aConcurso(code){ if(window.AxApp)AxApp.setMode("concurso"); if(window.AxConcursos)AxConcursos.ficha(code); }

/* ---------- entrada ---------- */
function abrir(){ activo=true; panel.hidden=false; var p=pendiente; pendiente=null;
  if(p)p(); else if(vista&&vista.render)vista.render(); else inicio(); }
function cerrar(){ activo=false; panel.hidden=true; }
document.addEventListener("ax-user",function(){ if(activo&&vista&&vista.render)vista.render(); });
document.addEventListener("ax-perfil",function(){ if(activo&&vista&&vista.render)vista.render(); });

/* ===================== INICIO DEL AULA ===================== */
function inicio(){
  vista={render:inicio}; $("hdr").textContent="Aula";
  var u=user();
  if(!u){
    pinta('<h3>Aula</h3><p>Cuestionarios de clase con registros para el docente: la institución organiza su estructura (facultades, carreras, materias…), cada docente crea sus cursos y bancos de preguntas, y los estudiantes entran con el enlace de su curso.</p>'+
      (window.AxAccount&&AxAccount.configurado()?'<div class="actions"><button class="primary" id="au-login">Entrar con Google</button></div>':'<p class="fine">El inicio de sesión no está configurado.</p>'));
    if($("au-login"))$("au-login").onclick=function(){AxAccount.abrirCuenta();};
    return;
  }
  pinta('<h3>Aula</h3><p class="fine">Cargando…</p>');
  api("/api/orgs").then(function(r){
    var h='<h3>Aula</h3>'+
      '<form class="rt-join" id="au-join"><input id="au-code" placeholder="Código de curso o de docente" maxlength="8" autocapitalize="characters" autocomplete="off" spellcheck="false"><button type="submit" class="primary">Unirme</button></form>'+
      '<p class="msg" id="au-msg"></p>';
    var cursos=r.courses.filter(function(c){return !c.archived;});
    h+='<h4>Tus cursos</h4>';
    h+=cursos.length?cursos.map(function(c){
      return '<button type="button" class="rt-card" data-curso="'+c.code+'"><span class="rt-card-top"><b>'+esc(c.name)+'</b>'+
        (c.status==="pendiente"?'<span class="chip pronto">Pendiente</span>':c.open?'<span class="chip activo">'+c.open+' abierto'+(c.open>1?'s':'')+'</span>':'<span class="chip">'+esc(ROLES[c.role]||c.role)+'</span>')+'</span>'+
        '<small>'+esc(c.org_name)+(c.unit_name?' · '+esc(c.unit_name):'')+(c.term?' · '+esc(c.term):'')+(c.status!=="pendiente"?' · '+esc(ROLES[c.role]||c.role):'')+'</small></button>';
    }).join(""):'<p class="fine">Todavía no estás en ningún curso. Pide a tu docente el código o el enlace del curso.</p>';
    h+='<h4>Tus instituciones</h4>';
    h+=r.orgs.length?r.orgs.map(function(o){
      return '<button type="button" class="rt-card" data-org="'+o.id+'"><span class="rt-card-top"><b>'+esc(o.name)+'</b>'+chipEstado(o.status)+'</span>'+
        '<small>'+esc(TIPOS[o.kind]||o.kind)+' · '+esc(ROLES[o.role]||o.role)+(o.email_domain?' · @'+esc(o.email_domain):'')+'</small></button>';
    }).join(""):'<p class="fine">No perteneces a ninguna institución.</p>';
    h+='<div class="actions"><button class="ghost" id="au-nueva">Registrar una institución</button></div>';
    if(r.platform_admin)h+='<div class="actions"><button class="ghost" id="au-plat">Administración de la plataforma'+(r.pending_orgs?' · '+r.pending_orgs+' pendiente'+(r.pending_orgs>1?'s':''):'')+'</button></div>';
    pinta(h);
    var bs=panel.querySelectorAll("[data-curso]"),i; for(i=0;i<bs.length;i++)bs[i].onclick=function(){curso(this.getAttribute("data-curso"));};
    bs=panel.querySelectorAll("[data-org]"); for(i=0;i<bs.length;i++)bs[i].onclick=function(){org(this.getAttribute("data-org"));};
    $("au-nueva").onclick=crearOrg;
    if($("au-plat"))$("au-plat").onclick=plataforma;
    $("au-join").onsubmit=function(e){
      e.preventDefault(); var c=$("au-code").value.trim().toUpperCase();
      if(c.length===6)curso(c);
      else if(c.length===8)uneDocente(c);
      else aviso("au-msg","Los cursos tienen códigos de 6 caracteres y los enlaces de docente, de 8.",true);
    };
  }).catch(function(e){
    if(e&&e.error==="profile_required"){
      pinta('<h3>Aula</h3><p>Para usar el aula primero completa tu registro: fecha de nacimiento y aceptación de términos y privacidad.</p>'+
        '<div class="actions"><button class="primary" id="au-reg">Completar mi registro</button></div>');
      $("au-reg").onclick=function(){AxRegistro.asegura().then(function(ok){if(ok)inicio();});};
      return;
    }
    pinta('<h3>Aula</h3><p class="fine bad">'+esc(ERR(e))+'</p>');
  });
}
function uneDocente(code){
  conRegistro(function(){return api("/api/orgs/join",{code:code});}).then(function(r){org(r.id,"cursos",r.already?"":"Ya formas parte de la institución como docente.");})
    .catch(function(e){ if($("au-msg"))aviso("au-msg",ERR(e),true); else pinta('<p class="fine bad">'+esc(ERR(e))+'</p>'); });
}

/* ===================== NUEVA INSTITUCIÓN ===================== */
function crearOrg(){
  AxRegistro.asegura().then(function(ok){ if(!ok)return;
  vista={render:crearOrg};
  pinta(atras("Aula")+'<h3>Registrar una institución</h3>'+
    '<form class="rt-form" id="au-form">'+
    '<label>Nombre<input id="o-name" maxlength="90" required placeholder="Universidad Mayor de San Andrés"></label>'+
    '<label>Tipo<select id="o-kind">'+Object.keys(TIPOS).map(function(k){return '<option value="'+k+'">'+TIPOS[k]+'</option>';}).join("")+'</select></label>'+
    '<label>Dominio de correo (opcional)<input id="o-dom" maxlength="80" placeholder="umsa.bo"></label>'+
    '<p class="fine">Con dominio, solo pueden entrar cuentas de ese correo institucional. Déjalo vacío para admitir cualquier cuenta de Google.</p>'+
    '<label>Estructura</label><div id="o-niveles" class="au-niveles"></div>'+
    '<p class="fine">Son los niveles con los que se organiza la institución; los cursos y bancos cuelgan del último. Se pueden cambiar después.</p>'+
    '<div class="actions"><button class="primary" type="submit" id="o-go">Registrar</button></div><p class="msg" id="o-msg"></p></form>');
  $("au-back").onclick=inicio;
  var niveles=PLANTILLAS.universidad.slice();
  function pintaNiveles(){ $("o-niveles").innerHTML=editorNiveles(niveles); ligaNiveles($("o-niveles"),niveles,pintaNiveles); }
  $("o-kind").onchange=function(){niveles=PLANTILLAS[this.value].slice();pintaNiveles();};
  pintaNiveles();
  $("au-form").onsubmit=function(e){
    e.preventDefault(); $("o-go").disabled=true;
    api("/api/orgs",{name:$("o-name").value,kind:$("o-kind").value,email_domain:$("o-dom").value,levels:leeNiveles($("o-niveles"))})
      .then(function(r){org(r.id,"cursos",r.status==="pendiente"?"Institución registrada. Queda pendiente de aprobación por la administración de la plataforma; mientras tanto puedes preparar su estructura.":"Institución registrada.");})
      .catch(function(er){$("o-go").disabled=false;aviso("o-msg",ERR(er),true);});
  };
  });
}
function editorNiveles(niv){
  return niv.map(function(n,i){return '<div class="au-nivel"><span>'+(i+1)+'</span><input data-i="'+i+'" value="'+esc(n)+'" maxlength="30">'+
    (i===niv.length-1&&niv.length>1?'<button type="button" class="ghost au-mini" data-quita="1" title="Quitar este nivel">✕</button>':'')+'</div>';}).join("")+
    (niv.length<6?'<button type="button" class="ghost au-mini" data-anade="1">+ Añadir nivel</button>':'');
}
function ligaNiveles(cont,niv,repinta){
  var ins=cont.querySelectorAll("input[data-i]"),i;
  for(i=0;i<ins.length;i++)ins[i].oninput=function(){niv[+this.getAttribute("data-i")]=this.value;};
  var q=cont.querySelector("[data-quita]"); if(q)q.onclick=function(){niv.pop();repinta();};
  var a=cont.querySelector("[data-anade]"); if(a)a.onclick=function(){niv.push("");repinta();cont.querySelector('input[data-i="'+(niv.length-1)+'"]').focus();};
}
function leeNiveles(cont){return [].map.call(cont.querySelectorAll("input[data-i]"),function(x){return x.value.trim();}).filter(Boolean);}

/* ===================== INSTITUCIÓN ===================== */
function org(id,tab,nota){
  vista={render:function(){org(id,tab);}};
  pinta('<p class="fine">Cargando…</p>');
  api("/api/orgs/"+id).then(function(o){
    $("hdr").textContent=o.name;
    var lista=[["cursos","Cursos"]];
    if(o.can.teach)lista.push(["bancos","Bancos"],["registros","Registros"]);
    if(o.can.admin)lista.push(["estructura","Estructura"],["miembros","Miembros"],["ajustes","Ajustes"]);
    if(!tab||!lista.some(function(t){return t[0]===tab;}))tab="cursos";
    pinta(atras("Aula")+'<div class="rt-head"><h3>'+esc(o.name)+'</h3>'+chipEstado(o.status)+'</div>'+
      '<p class="rt-meta">'+esc(TIPOS[o.kind]||o.kind)+' · tu rol: '+esc(ROLES[o.role]||o.role||"—")+(o.email_domain?' · solo @'+esc(o.email_domain):'')+
        ' · '+Object.keys(o.counts).map(function(k){return o.counts[k]+' '+(ROLES[k]||k).toLowerCase();}).join(", ")+'</p>'+
      (o.status==="pendiente"?'<p class="rt-hoy">Pendiente de aprobación por la administración de la plataforma. Puedes preparar la estructura y los miembros; los cursos se abren al aprobarla.</p>':'')+
      (o.status==="suspendida"?'<p class="rt-hoy">Institución suspendida por la administración de la plataforma.</p>':'')+
      (nota?'<p class="fine ok">'+esc(nota)+'</p>':'')+
      (lista.length>1?tabs(lista,tab):'')+'<div id="au-tab"></div>');
    $("au-back").onclick=inicio;
    ligaTabs(function(t){org(id,t);});
    ({cursos:tabCursos,bancos:tabBancos,registros:tabRegistros,estructura:tabEstructura,miembros:tabMiembros,ajustes:tabAjustes})[tab](o);
  }).catch(function(e){pinta(atras("Aula")+'<p class="fine bad">'+esc(ERR(e))+'</p>');$("au-back").onclick=inicio;});
}
function opcionesUnidades(o,soloHojas,sel){
  var niv=o.levels, porPadre={};
  o.units.forEach(function(u){(porPadre[u.parent_id||0]=porPadre[u.parent_id||0]||[]).push(u);});
  var out=[];
  function recorre(pid,pref){(porPadre[pid]||[]).forEach(function(u){
    var hoja=u.depth===niv.length-1;
    if(!soloHojas||hoja)out.push('<option value="'+u.id+'"'+(sel===u.id?' selected':'')+'>'+esc(pref+u.name)+(soloHojas?'':' ('+esc(niv[u.depth])+')')+'</option>');
    recorre(u.id,pref+u.name+" › ");
  });}
  recorre(0,"");
  return out.join("");
}

function tabCursos(o){
  var t=$("au-tab"); t.innerHTML='<p class="fine">Cargando…</p>';
  api("/api/orgs/"+o.id+"/courses").then(function(r){
    var h="";
    if(o.can.teach&&o.status==="activa"){
      h+='<details class="au-nuevo"'+(r.courses.length?'':' open')+'><summary>Nuevo curso</summary><form class="rt-form" id="c-form">'+
        '<label>Nombre<input id="c-name" maxlength="90" required placeholder="Cálculo I · Paralelo A"></label>'+
        '<div class="rt-2"><label>'+esc(o.levels[o.levels.length-1])+'<select id="c-unit"><option value="">(ninguna)</option>'+opcionesUnidades(o,true)+'</select></label>'+
        '<label>Gestión<input id="c-term" maxlength="20" placeholder="2/2026"></label></div>'+
        '<label class="rt-check"><input type="checkbox" id="c-apr"> Aprobar a cada estudiante antes de que entre</label>'+
        '<div class="actions"><button class="primary" type="submit" id="c-go">Crear curso</button></div><p class="msg" id="c-msg"></p></form></details>';
    }
    h+=r.courses.length?r.courses.map(function(c){
      return '<button type="button" class="rt-card" data-curso="'+c.code+'"><span class="rt-card-top"><b>'+esc(c.name)+'</b>'+
        (c.archived?'<span class="chip terminado">Archivado</span>':c.pending?'<span class="chip pronto">'+c.pending+' por aprobar</span>':'<span class="chip">'+c.students+' estudiante'+(c.students===1?'':'s')+'</span>')+'</span>'+
        '<small>'+(c.unit_name?esc(c.unit_name)+' · ':'')+(c.term?esc(c.term)+' · ':'')+'docente: '+esc(c.mine?"tú":c.owner_name)+' · código '+c.code+'</small></button>';
    }).join(""):'<p class="fine">'+(o.can.teach?'Todavía no hay cursos.':'No estás en ningún curso de esta institución.')+'</p>';
    t.innerHTML=h;
    var bs=t.querySelectorAll("[data-curso]"),i; for(i=0;i<bs.length;i++)bs[i].onclick=function(){curso(this.getAttribute("data-curso"));};
    if($("c-form"))$("c-form").onsubmit=function(e){
      e.preventDefault(); $("c-go").disabled=true;
      api("/api/orgs/"+o.id+"/courses",{name:$("c-name").value,term:$("c-term").value,unit_id:$("c-unit").value||null,approval:$("c-apr").checked})
        .then(function(r2){curso(r2.code,"Curso creado. Comparte el código o el enlace con tus estudiantes.");})
        .catch(function(er){$("c-go").disabled=false;aviso("c-msg",ERR(er),true);});
    };
  }).catch(function(e){t.innerHTML='<p class="fine bad">'+esc(ERR(e))+'</p>';});
}

function tabBancos(o){
  var t=$("au-tab"); t.innerHTML='<p class="fine">Cargando…</p>';
  api("/api/orgs/"+o.id+"/banks").then(function(r){
    var h='<details class="au-nuevo"'+(r.banks.length?'':' open')+'><summary>Nuevo banco de preguntas</summary><form class="rt-form" id="b-form">'+
      '<label>Nombre<input id="b-name" maxlength="80" required placeholder="Cálculo I · derivadas"></label>'+
      '<label>'+esc(o.levels[o.levels.length-1])+' (opcional)<select id="b-unit"><option value="">(ninguna)</option>'+opcionesUnidades(o,true)+'</select></label>'+
      '<div class="actions"><button class="primary" type="submit" id="b-go">Crear banco</button></div><p class="msg" id="b-msg"></p></form></details>';
    h+=r.banks.length?r.banks.map(function(b){
      return '<button type="button" class="rt-card" data-banco="'+b.id+'"><span class="rt-card-top"><b>'+esc(b.name)+'</b><span class="chip">'+b.questions+' pregunta'+(b.questions===1?'':'s')+'</span></span>'+
        '<small>'+(b.unit_name?esc(b.unit_name)+' · ':'')+'de '+esc(b.mine?"ti":b.owner_name)+'</small></button>';
    }).join(""):'<p class="fine">Todavía no tienes bancos. Crea uno y súbele preguntas desde Excel o texto.</p>';
    t.innerHTML=h;
    var bs=t.querySelectorAll("[data-banco]"),i; for(i=0;i<bs.length;i++)bs[i].onclick=function(){banco(+this.getAttribute("data-banco"));};
    $("b-form").onsubmit=function(e){
      e.preventDefault(); $("b-go").disabled=true;
      api("/api/orgs/"+o.id+"/banks",{name:$("b-name").value,unit_id:$("b-unit").value||null}).then(function(r2){banco(r2.id,"Banco creado. Ahora súbele preguntas.");})
        .catch(function(er){$("b-go").disabled=false;aviso("b-msg",ERR(er),true);});
    };
  }).catch(function(e){t.innerHTML='<p class="fine bad">'+esc(ERR(e))+'</p>';});
}

function tabRegistros(o,filtro){
  filtro=filtro||{};
  var t=$("au-tab"); t.innerHTML='<p class="fine">Cargando…</p>';
  var q=[]; if(filtro.unit)q.push("unit="+filtro.unit); if(filtro.partial)q.push("partial="+encodeURIComponent(filtro.partial)); if(filtro.term)q.push("term="+encodeURIComponent(filtro.term));
  api("/api/orgs/"+o.id+"/quizzes"+(q.length?"?"+q.join("&"):"")).then(function(r){
    var h='<div class="au-filtros">'+
      '<label>Unidad<select id="f-unit"><option value="">Todas</option>'+opcionesUnidades(o,false,+filtro.unit||null)+'</select></label>'+
      '<label>Parcial<select id="f-par"><option value="">Todos</option>'+r.partials.map(function(p){return '<option'+(p===filtro.partial?' selected':'')+'>'+esc(p)+'</option>';}).join("")+'</select></label>'+
      '<label>Gestión<select id="f-term"><option value="">Todas</option>'+r.terms.map(function(p){return '<option'+(p===filtro.term?' selected':'')+'>'+esc(p)+'</option>';}).join("")+'</select></label></div>';
    if(!r.quizzes.length)h+='<p class="fine">No hay cuestionarios con esos filtros.</p>';
    else{
      h+='<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Cuestionario</th><th>Curso</th><th>Parcial</th><th>Participación</th><th>Media</th><th>Estado</th></tr></thead><tbody>'+
        r.quizzes.map(function(x){return '<tr class="clic" data-quiz="'+x.code+'"><td><b>'+esc(x.name)+'</b><small>'+fecha(x.starts_at)+'</small></td>'+
          '<td>'+esc(x.course_name||"—")+'<small>'+esc([x.unit_name,x.term].filter(Boolean).join(" · "))+'</small></td><td>'+esc(x.partial||"—")+'</td>'+
          '<td>'+x.played+(x.students?' de '+x.students:'')+'</td><td>'+(x.avg===null?'—':x.avg)+'</td><td>'+({pronto:"Próximo",abierto:"Abierto",terminado:"Cerrado"}[x.state])+'</td></tr>';}).join("")+
        '</tbody></table></div><p class="fine">Toca un cuestionario para ver sus registros por estudiante y por pregunta, y descargarlos en Excel.</p>';
    }
    t.innerHTML=h;
    function cambia(){tabRegistros(o,{unit:$("f-unit").value,partial:$("f-par").value,term:$("f-term").value});}
    $("f-unit").onchange=$("f-par").onchange=$("f-term").onchange=cambia;
    var bs=t.querySelectorAll("[data-quiz]"),i; for(i=0;i<bs.length;i++)bs[i].onclick=function(){aConcurso(this.getAttribute("data-quiz"));};
  }).catch(function(e){t.innerHTML='<p class="fine bad">'+esc(ERR(e))+'</p>';});
}

function tabEstructura(o){
  var t=$("au-tab"), niv=o.levels.slice();
  var porPadre={}; o.units.forEach(function(u){(porPadre[u.parent_id||0]=porPadre[u.parent_id||0]||[]).push(u);});
  function arbol(pid,depth){
    var h='<ul class="au-arbol">';
    (porPadre[pid]||[]).forEach(function(u){
      h+='<li><div class="au-unidad"><span class="au-niv">'+esc(niv[u.depth]||"")+'</span><b>'+esc(u.name)+'</b>'+
        (u.depth<niv.length-1?'<button type="button" class="ghost au-mini" data-hijo="'+u.id+'" data-d="'+(u.depth+1)+'">+ '+esc(niv[u.depth+1])+'</button>':'')+
        '<button type="button" class="ghost au-mini" data-ren="'+u.id+'">Renombrar</button><button type="button" class="ghost au-mini" data-borra="'+u.id+'">Borrar</button></div>'+
        arbol(u.id,depth+1)+'</li>';
    });
    return h+'</ul>';
  }
  t.innerHTML='<h4>Niveles</h4><div id="e-niv" class="au-niveles"></div><div class="actions"><button class="ghost" id="e-guarda">Guardar niveles</button></div><p class="msg" id="e-msg"></p>'+
    '<h4>Unidades</h4>'+(o.units.length?arbol(0,0):'<p class="fine">Todavía no hay unidades. Empieza por '+esc(niv[0]).toLowerCase()+'.</p>')+
    '<div class="actions"><button class="ghost" data-hijo="" data-d="0">+ '+esc(niv[0])+'</button></div>';
  function pintaNiv(){$("e-niv").innerHTML=editorNiveles(niv);ligaNiveles($("e-niv"),niv,pintaNiv);}
  pintaNiv();
  $("e-guarda").onclick=function(){
    api("/api/orgs/"+o.id+"/settings",{levels:leeNiveles($("e-niv"))}).then(function(){org(o.id,"estructura","Niveles guardados.");})
      .catch(function(er){aviso("e-msg",ERR(er),true);});
  };
  var bs=t.querySelectorAll("[data-hijo]"),i;
  for(i=0;i<bs.length;i++)bs[i].onclick=function(){
    var d=+this.getAttribute("data-d"), n=prompt("Nombre de la nueva unidad ("+niv[d]+"):"); if(!n)return;
    api("/api/orgs/"+o.id+"/units",{name:n,parent_id:this.getAttribute("data-hijo")||null}).then(function(){org(o.id,"estructura");}).catch(function(er){alert(ERR(er));});
  };
  bs=t.querySelectorAll("[data-ren]");
  for(i=0;i<bs.length;i++)bs[i].onclick=function(){
    var n=prompt("Nuevo nombre:"); if(!n)return;
    api("/api/orgs/"+o.id+"/units/"+this.getAttribute("data-ren"),{name:n}).then(function(){org(o.id,"estructura");}).catch(function(er){alert(ERR(er));});
  };
  bs=t.querySelectorAll("[data-borra]");
  for(i=0;i<bs.length;i++)bs[i].onclick=function(){
    if(!confirm("¿Borrar esta unidad?"))return;
    api("/api/orgs/"+o.id+"/units/"+this.getAttribute("data-borra"),{remove:true}).then(function(){org(o.id,"estructura");}).catch(function(er){alert(ERR(er));});
  };
}

function tabMiembros(o){
  var t=$("au-tab"); t.innerHTML='<p class="fine">Cargando…</p>';
  api("/api/orgs/"+o.id+"/members").then(function(r){
    var h='<div class="rt-code"><span>Enlace de docentes</span><b class="au-codigo">'+esc(o.teacher_code)+'</b>'+
      '<button type="button" class="ghost" id="m-copy">Copiar enlace</button><button type="button" class="ghost" id="m-nuevo">Cambiar</button></div>'+
      '<p class="fine">Quien entre con este enlace se une como docente. Los estudiantes no lo necesitan: entran con el código de su curso. Si el enlace circula de más, cámbialo.</p>'+
      '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Miembro</th><th>Registro</th><th>Rol</th><th>Consentimiento</th><th></th></tr></thead><tbody>'+
      r.members.map(function(m){
        return '<tr><td>'+esc(m.name)+(m.me?' <em>(tú)</em>':'')+'<small>'+esc(m.email)+'</small></td><td>'+esc(m.student_code||"—")+'</td>'+
          '<td><select data-rol="'+m.id+'">'+Object.keys(ROLES).map(function(k){return '<option value="'+k+'"'+(k===m.role?' selected':'')+'>'+ROLES[k]+'</option>';}).join("")+'</select></td>'+
          '<td>'+(m.minor?'<label class="au-cons"><input type="checkbox" data-cons="'+m.id+'"'+(m.consent_ok?' checked':'')+'> Menor: la institución tiene el consentimiento</label>':'<small>Mayor de edad</small>')+'</td>'+
          '<td>'+(m.me?'':'<button type="button" class="ghost au-mini" data-quita="'+m.id+'">Quitar</button>')+'</td></tr>';
      }).join("")+'</tbody></table></div><p class="msg" id="m-msg"></p>';
    t.innerHTML=h;
    $("m-copy").onclick=function(){copia(enlace("docente",o.teacher_code),this);};
    $("m-nuevo").onclick=function(){ if(!confirm("El enlace actual dejará de funcionar. ¿Cambiarlo?"))return;
      api("/api/orgs/"+o.id+"/teacher-code",{}).then(function(){org(o.id,"miembros");}); };
    function cambia(uid,datos){api("/api/orgs/"+o.id+"/members/"+encodeURIComponent(uid),datos).then(function(){aviso("m-msg","Guardado.");})
      .catch(function(er){aviso("m-msg",ERR(er),true);tabMiembros(o);});}
    var s=t.querySelectorAll("[data-rol]"),i; for(i=0;i<s.length;i++)s[i].onchange=function(){cambia(this.getAttribute("data-rol"),{role:this.value});};
    s=t.querySelectorAll("[data-cons]"); for(i=0;i<s.length;i++)s[i].onchange=function(){cambia(this.getAttribute("data-cons"),{consent_ok:this.checked});};
    s=t.querySelectorAll("[data-quita]"); for(i=0;i<s.length;i++)s[i].onclick=function(){
      if(!confirm("¿Quitar a esta persona de la institución y de sus cursos?"))return;
      api("/api/orgs/"+o.id+"/members/"+encodeURIComponent(this.getAttribute("data-quita")),{remove:true}).then(function(){tabMiembros(o);}).catch(function(er){aviso("m-msg",ERR(er),true);});
    };
  }).catch(function(e){t.innerHTML='<p class="fine bad">'+esc(ERR(e))+'</p>';});
}

function tabAjustes(o){
  var t=$("au-tab");
  t.innerHTML='<form class="rt-form" id="a-form"><label>Nombre<input id="a-name" maxlength="90" value="'+esc(o.name)+'"></label>'+
    '<label>Dominio de correo (opcional)<input id="a-dom" maxlength="80" value="'+esc(o.email_domain)+'" placeholder="umsa.bo"></label>'+
    '<p class="fine">Con dominio, solo entran cuentas de ese correo. Quien ya es miembro no se ve afectado.</p>'+
    '<div class="actions"><button class="primary" type="submit">Guardar</button></div><p class="msg" id="a-msg"></p></form>';
  $("a-form").onsubmit=function(e){e.preventDefault();
    api("/api/orgs/"+o.id+"/settings",{name:$("a-name").value,email_domain:$("a-dom").value}).then(function(){org(o.id,"ajustes","Guardado.");})
      .catch(function(er){aviso("a-msg",ERR(er),true);});};
}

/* ===================== CURSO ===================== */
function curso(code,nota,tab){
  vista={render:function(){curso(code,null,tab);}};
  pinta('<p class="fine">Cargando…</p>');
  api("/api/courses/"+code).then(function(c){
    $("hdr").textContent=c.code;
    var cab=atras("Aula")+'<div class="rt-head"><h3>'+esc(c.name)+'</h3>'+(c.archived?'<span class="chip terminado">Archivado</span>':'')+'</div>'+
      '<p class="rt-meta">'+esc(c.org_name)+(c.unit_name?' · '+esc(c.unit_name):'')+(c.term?' · '+esc(c.term):'')+' · docente: '+esc(c.teacher_name)+'</p>'+
      (nota?'<p class="fine ok">'+esc(nota)+'</p>':'');
    var u=user(), m=c.member;
    if(!c.manage&&!(m&&m.status==="activo")){
      var h=cab;
      if(!u)h+='<p>Para unirte a este curso entra con Google.</p>'+(window.AxAccount&&AxAccount.configurado()?'<div class="actions"><button class="primary" id="cu-login">Entrar con Google</button></div>':'');
      else if(m&&m.status==="pendiente")h+='<p class="rt-hoy">Tu solicitud está pendiente: el docente tiene que aprobarla.</p>';
      else if(!c.org_active)h+='<p class="rt-hoy">La institución todavía no está habilitada.</p>';
      else h+='<form class="rt-form" id="cu-join"><label>Tu registro universitario (o código de estudiante)<input id="cu-sc" maxlength="30" autocomplete="off"></label>'+
        (c.email_domain?'<p class="fine">Solo se admiten cuentas @'+esc(c.email_domain)+'.</p>':'')+
        '<p class="fine">Al unirte, tu docente verá tu nombre, tu correo, tu registro y tus resultados en los cuestionarios de este curso.</p>'+
        '<div class="actions"><button class="primary" type="submit" id="cu-go">Unirme al curso</button></div><p class="msg" id="cu-msg"></p></form>';
      pinta(h); $("au-back").onclick=inicio;
      if($("cu-login"))$("cu-login").onclick=function(){AxAccount.abrirCuenta();};
      if($("cu-join"))$("cu-join").onsubmit=function(e){e.preventDefault();$("cu-go").disabled=true;
        conRegistro(function(){return api("/api/courses/"+code+"/join",{student_code:$("cu-sc").value});})
          .then(function(r){curso(code,r.status==="pendiente"?"Solicitud enviada. Tu docente tiene que aprobarla.":"¡Ya estás en el curso!");})
          .catch(function(er){$("cu-go").disabled=false;aviso("cu-msg",ERR(er),true);});};
      return;
    }
    if(!c.manage){ pinta(cab+listaCuestionarios(c,false)); $("au-back").onclick=inicio; ligaCuestionarios(); return; }
    /* vista de quien gestiona el curso */
    var pend=(c.members||[]).filter(function(x){return x.status==="pendiente";}).length;
    tab=tab||"cuest";
    pinta(cab+'<div class="rt-code"><span>Código del curso</span><b>'+c.code+'</b><button type="button" class="ghost" id="cu-copy">Copiar enlace</button>'+
        (navigator.share?'<button type="button" class="ghost" id="cu-share">Invitar</button>':'')+'</div>'+
      tabs([["cuest","Cuestionarios"],["alumnos","Estudiantes"+(pend?" ("+pend+")":"")],["ajustes","Ajustes"]],tab)+'<div id="au-tab"></div>');
    $("au-back").onclick=inicio;
    $("cu-copy").onclick=function(){copia(enlace("curso",c.code),this);};
    if($("cu-share"))$("cu-share").onclick=function(){navigator.share({text:"Únete a «"+c.name+"» en The Final Test: "+enlace("curso",c.code)}).catch(function(){});};
    ligaTabs(function(t){curso(code,null,t);});
    var t=$("au-tab");
    if(tab==="cuest"){
      t.innerHTML=(c.archived?'':'<div class="actions"><button class="primary" id="cu-nuevo">Nuevo cuestionario</button></div>')+listaCuestionarios(c,true);
      if($("cu-nuevo"))$("cu-nuevo").onclick=function(){crearCuestionario(c);};
      ligaCuestionarios();
    }else if(tab==="alumnos")tabAlumnos(c,t);
    else tabAjustesCurso(c,t);
  }).catch(function(e){pinta(atras("Aula")+'<p class="fine bad">'+esc(ERR(e))+'</p>');$("au-back").onclick=inicio;});
}
function listaCuestionarios(c,gestor){
  if(!c.quizzes||!c.quizzes.length)return '<p class="fine">'+(gestor?'Todavía no hay cuestionarios. Crea el primero a partir de un banco de preguntas.':'Todavía no hay cuestionarios en este curso.')+'</p>';
  var grupos={abierto:[],pronto:[],terminado:[]};
  c.quizzes.forEach(function(q){grupos[q.state].push(q);});
  var h="";
  [["abierto","Abiertos"],["pronto","Próximos"],["terminado","Cerrados"]].forEach(function(g){
    if(!grupos[g[0]].length)return;
    h+='<h4>'+g[1]+'</h4>'+grupos[g[0]].map(function(q){
      var yo=q.me?(q.me.finished?'Tu resultado: '+q.me.correct+' ✓ · '+q.me.errors+' ✗':'A medias'):(q.state==="abierto"&&!gestor?'Sin responder':'');
      return '<button type="button" class="rt-card" data-quiz="'+q.code+'"><span class="rt-card-top"><b>'+esc(q.name)+'</b>'+
        (q.partial?'<span class="chip">'+esc(q.partial)+'</span>':'')+'</span>'+
        '<small>'+(q.state==="pronto"?'Se abre el '+fecha(q.starts_at):q.state==="abierto"?'Cierra el '+fecha(q.ends_at):'Cerró el '+fecha(q.ends_at))+
        ' · '+q.max_questions+' preguntas · '+q.seconds_per_q+' s'+(gestor?' · '+q.played+' respondieron':'')+(yo?' · <b>'+yo+'</b>':'')+'</small></button>';
    }).join("");
  });
  return h;
}
function ligaCuestionarios(){var bs=panel.querySelectorAll("[data-quiz]"),i;for(i=0;i<bs.length;i++)bs[i].onclick=function(){aConcurso(this.getAttribute("data-quiz"));};}

function tabAlumnos(c,t){
  var pend=c.members.filter(function(x){return x.status==="pendiente";}), act=c.members.filter(function(x){return x.status==="activo";});
  var h="";
  if(pend.length)h+='<h4>Por aprobar</h4>'+pend.map(function(m){return '<div class="au-fila"><div><b>'+esc(m.name)+'</b><small>'+esc(m.email)+' · registro '+esc(m.student_code||"—")+'</small></div>'+
    '<button type="button" class="primary au-mini" data-apr="'+m.id+'">Aprobar</button><button type="button" class="ghost au-mini" data-quita="'+m.id+'">Rechazar</button></div>';}).join("");
  h+='<h4>En el curso ('+act.length+')</h4>'+
    '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Nombre</th><th>Registro</th><th>Rol</th><th></th></tr></thead><tbody>'+
    act.map(function(m){return '<tr><td>'+esc(m.name)+(m.me?' <em>(tú)</em>':'')+'<small>'+esc(m.email)+'</small></td><td>'+esc(m.student_code||"—")+'</td>'+
      '<td>'+(m.owner?'Docente':'<select data-rol="'+m.id+'"><option value="estudiante"'+(m.role==="estudiante"?' selected':'')+'>Estudiante</option><option value="auxiliar"'+(m.role==="auxiliar"?' selected':'')+'>Auxiliar</option></select>')+'</td>'+
      '<td>'+(m.owner||m.me?'':'<button type="button" class="ghost au-mini" data-quita="'+m.id+'">Quitar</button>')+'</td></tr>';}).join("")+
    '</tbody></table></div><p class="fine">Los auxiliares pueden crear cuestionarios en este curso y ver sus registros.</p><p class="msg" id="al-msg"></p>';
  t.innerHTML=h;
  function hace(uid,d){api("/api/courses/"+c.code+"/members/"+encodeURIComponent(uid),d).then(function(){curso(c.code,null,"alumnos");}).catch(function(er){aviso("al-msg",ERR(er),true);});}
  var s=t.querySelectorAll("[data-apr]"),i; for(i=0;i<s.length;i++)s[i].onclick=function(){hace(this.getAttribute("data-apr"),{status:"activo"});};
  s=t.querySelectorAll("[data-quita]"); for(i=0;i<s.length;i++)s[i].onclick=function(){if(confirm("¿Quitar del curso?"))hace(this.getAttribute("data-quita"),{remove:true});};
  s=t.querySelectorAll("[data-rol]"); for(i=0;i<s.length;i++)s[i].onchange=function(){hace(this.getAttribute("data-rol"),{role:this.value});};
}
function tabAjustesCurso(c,t){
  t.innerHTML='<form class="rt-form" id="ca-form"><label>Nombre<input id="ca-name" maxlength="90" value="'+esc(c.name)+'"></label>'+
    '<label>Gestión<input id="ca-term" maxlength="20" value="'+esc(c.term||"")+'"></label>'+
    '<label class="rt-check"><input type="checkbox" id="ca-apr"'+(c.approval?' checked':'')+'> Aprobar a cada estudiante antes de que entre</label>'+
    '<label class="rt-check"><input type="checkbox" id="ca-arch"'+(c.archived?' checked':'')+'> Archivar (fin de la gestión: nadie más entra y no se crean cuestionarios)</label>'+
    '<div class="actions"><button class="primary" type="submit">Guardar</button></div><p class="msg" id="ca-msg"></p></form>';
  $("ca-form").onsubmit=function(e){e.preventDefault();
    api("/api/courses/"+c.code+"/settings",{name:$("ca-name").value,term:$("ca-term").value,approval:$("ca-apr").checked,archived:$("ca-arch").checked})
      .then(function(){curso(c.code,"Guardado.","ajustes");}).catch(function(er){aviso("ca-msg",ERR(er),true);});};
}

/* ===================== NUEVO CUESTIONARIO ===================== */
function crearCuestionario(c){
  vista={render:function(){crearCuestionario(c);}};
  var bancos=c.banks||[];
  pinta(atras("Volver al curso")+'<h3>Nuevo cuestionario</h3><p class="rt-meta">'+esc(c.name)+'</p>'+
    '<form class="rt-form" id="q-form">'+
    '<label>Nombre<input id="q-name" maxlength="60" required placeholder="Parcial 1 · Derivadas"></label>'+
    '<label>Parcial<input id="q-par" maxlength="40" list="q-pars" placeholder="Primer parcial"><datalist id="q-pars">'+PARCIALES.map(function(p){return '<option value="'+p+'">';}).join("")+'</datalist></label>'+
    '<label>Preguntas<select id="q-bank">'+bancos.map(function(b){return '<option value="'+b.id+'">Banco: '+esc(b.name)+' ('+b.n+')</option>';}).join("")+
      '<option value="0">Cultura general de la plataforma</option></select></label>'+
    '<div class="rt-2"><label>Tema<select id="q-tema"><option value="">Todos</option></select></label>'+
    '<label>Dificultad<select id="q-level"></select></label></div>'+
    '<p class="fine" id="q-disp"></p>'+
    '<div class="rt-2"><label>Número de preguntas<input type="number" id="q-n" min="1" max="100" value="10"></label>'+
    '<label>Tiempo por pregunta<select id="q-seg"><option value="15">15 s</option><option value="20">20 s</option><option value="30" selected>30 s</option><option value="45">45 s</option><option value="60">60 s</option></select></label></div>'+
    '<label>Errores admitidos<select id="q-err"><option value="100" selected>Sin límite: se responden todas</option><option value="0">Ninguno: el primer fallo termina</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="5">5</option></select></label>'+
    '<div class="rt-2"><label>Se abre<select id="q-ini"><option value="0">Ahora</option><option value="15">En 15 minutos</option><option value="60">En 1 hora</option><option value="1440">Mañana a esta hora</option><option value="x">Fecha y hora…</option></select></label>'+
    '<label>Dura<select id="q-dur"><option value="30">30 minutos</option><option value="60" selected>1 hora</option><option value="120">2 horas</option><option value="1440">1 día</option><option value="10080">1 semana</option><option value="x">Hasta fecha y hora…</option></select></label></div>'+
    '<div class="rt-2"><label id="q-ini-f-l" hidden>Apertura<input type="datetime-local" id="q-ini-f"></label><label id="q-fin-f-l" hidden>Cierre<input type="datetime-local" id="q-fin-f"></label></div>'+
    '<p class="fine">Cada estudiante recibe las preguntas en otro orden y con las opciones barajadas, una sola vez. Las respuestas correctas se muestran al cierre.</p>'+
    '<div class="actions"><button class="primary" type="submit" id="q-go">Crear cuestionario</button></div><p class="msg" id="q-msg"></p></form>');
  $("au-back").onclick=function(){curso(c.code);};
  var info=null;
  function local(ms){var d=new Date(ms-new Date(ms).getTimezoneOffset()*60000);return d.toISOString().slice(0,16);}
  function niveles(){
    var b=+$("q-bank").value, sel=$("q-level"), prev=sel.value;
    sel.innerHTML=b?'<option value="5">Mixta (todas)</option><option value="1">Solo fáciles</option><option value="2">Solo medias</option><option value="3">Solo difíciles</option><option value="4">Progresiva (de fácil a difícil)</option>':
      '<option value="1">Fácil</option><option value="2" selected>Medio</option><option value="3">Difícil</option><option value="4">Progresiva</option>';
    if(prev&&sel.querySelector('[value="'+prev+'"]'))sel.value=prev;
    disponibles();
  }
  function disponibles(){
    var b=+$("q-bank").value;
    if(!b||!info){$("q-disp").textContent=b?"":"Preguntas generales de la plataforma (cultura general y cálculo).";return;}
    var tema=$("q-tema").value, lv=+$("q-level").value;
    var n=info.questions.filter(function(q){return (!tema||q.topic===tema)&&(lv>=4||q.level===lv);}).length;
    $("q-disp").textContent=n+" pregunta"+(n===1?"":"s")+" disponible"+(n===1?"":"s")+" con ese tema y nivel"+(+$("q-n").value>n?": el cuestionario tendrá "+n+".":".");
  }
  function cargaBanco(){
    var b=+$("q-bank").value; info=null; $("q-tema").innerHTML='<option value="">Todos</option>';
    $("q-tema").disabled=!b;
    if(!b){niveles();return;}
    api("/api/banks/"+b).then(function(r){
      info=r; var temas={};
      r.questions.forEach(function(q){if(q.topic)temas[q.topic]=(temas[q.topic]||0)+1;});
      $("q-tema").innerHTML='<option value="">Todos</option>'+Object.keys(temas).sort().map(function(t){return '<option value="'+esc(t)+'">'+esc(t)+' ('+temas[t]+')</option>';}).join("");
      niveles();
    }).catch(function(){niveles();});
  }
  $("q-bank").onchange=cargaBanco; $("q-tema").onchange=disponibles; $("q-level").onchange=disponibles; $("q-n").oninput=disponibles;
  $("q-ini").onchange=$("q-dur").onchange=function(){
    $("q-ini-f-l").hidden=$("q-ini").value!=="x"; $("q-fin-f-l").hidden=$("q-dur").value!=="x";
    if($("q-ini").value==="x"&&!$("q-ini-f").value)$("q-ini-f").value=local(Date.now()+86400000);
    if($("q-dur").value==="x"&&!$("q-fin-f").value)$("q-fin-f").value=local(Date.now()+2*86400000);
  };
  cargaBanco();
  $("q-form").onsubmit=function(e){
    e.preventDefault();
    var ini=$("q-ini").value==="x"?new Date($("q-ini-f").value).getTime():Date.now()+(+$("q-ini").value)*60000;
    var fin=$("q-dur").value==="x"?new Date($("q-fin-f").value).getTime():ini+(+$("q-dur").value)*60000;
    if(isNaN(ini)||isNaN(fin)){aviso("q-msg","Revisa las fechas.",true);return;}
    var b=+$("q-bank").value, n=Math.max(1,Math.min(100,+$("q-n").value||10));
    if(!b&&[10,20,30,50,100].indexOf(n)<0){n=[10,20,30,50,100].filter(function(x){return x>=n;})[0]||100;}
    var err=+$("q-err").value; if(err===100)err=Math.max(n,10);
    $("q-go").disabled=true;
    api("/api/contests",{name:$("q-name").value,kind:"cuestionario",audience:"curso",course_code:c.code,bank_id:b||null,topic:$("q-tema").value,
      level:+$("q-level").value,partial:$("q-par").value,max_questions:n,max_errors:err,seconds_per_q:+$("q-seg").value,
      math:!b,starts_at:ini,ends_at:fin})
      .then(function(r){aConcurso(r.code);})
      .catch(function(er){$("q-go").disabled=false;aviso("q-msg",ERR(er),true);});
  };
}

/* ===================== BANCO DE PREGUNTAS ===================== */
function banco(id,nota,filtro){
  vista={render:function(){banco(id,null,filtro);}};
  pinta('<p class="fine">Cargando…</p>');
  api("/api/banks/"+id).then(function(b){
    var temas={}; b.questions.forEach(function(q){temas[q.topic||"(sin tema)"]=(temas[q.topic||"(sin tema)"]||0)+1;});
    var lista=b.questions.filter(function(q){return !filtro||(q.topic||"(sin tema)")===filtro;});
    var h=atras("Bancos")+'<div class="rt-head"><h3>'+esc(b.name)+'</h3><span class="chip">'+b.questions.length+' preguntas</span></div>'+
      '<p class="rt-meta">'+(b.unit_name?esc(b.unit_name)+' · ':'')+Object.keys(temas).length+' tema'+(Object.keys(temas).length===1?'':'s')+'</p>'+
      (nota?'<p class="fine ok">'+esc(nota)+'</p>':'')+
      '<div class="actions au-acciones"><button class="primary" id="bk-imp">Importar preguntas</button><button class="ghost" id="bk-una">Añadir una</button>'+
      '<button class="ghost" id="bk-plant">Plantilla Excel</button>'+(b.questions.length?'<button class="ghost" id="bk-exp">Exportar a Excel</button>':'')+'</div>'+
      '<div id="bk-zona"></div>';
    if(b.questions.length){
      h+='<div class="au-filtros"><label>Tema<select id="bk-tema"><option value="">Todos ('+b.questions.length+')</option>'+
        Object.keys(temas).sort().map(function(t){return '<option'+(t===filtro?' selected':'')+'>'+esc(t)+'</option>';}).join("")+'</select></label></div>';
      h+='<ol class="au-preguntas">'+lista.map(function(q){
        return '<li><div class="au-pq"><span class="au-nivel-chip n'+q.level+'">'+NIV[q.level]+'</span>'+(q.topic?'<small>'+esc(q.topic)+'</small>':'')+
          '<b>'+esc(q.q)+'</b><ul>'+q.opts.map(function(o,i){return '<li class="'+(i===q.answer?"ok":"")+'">'+(i===q.answer?'✓ ':'')+esc(o)+'</li>';}).join("")+'</ul></div>'+
          '<div class="au-pq-acc"><button type="button" class="ghost au-mini" data-edita="'+q.id+'">Editar</button><button type="button" class="ghost au-mini" data-borra="'+q.id+'">Borrar</button></div></li>';
      }).join("")+'</ol>';
    }else h+='<p class="fine">El banco está vacío. Importa preguntas desde un Excel o pegando texto, o añádelas de una en una.</p>';
    pinta(h);
    $("au-back").onclick=function(){org(b.org_id,"bancos");};
    $("bk-imp").onclick=function(){importador(b);};
    $("bk-una").onclick=function(){editor(b,null);};
    $("bk-plant").onclick=function(){XL.descarga(XL.escribir([{nombre:"Preguntas",filas:BF.PLANTILLA,anchos:[50,24,24,24,24,8,18]}]),"plantilla-preguntas.xlsx");};
    if($("bk-exp"))$("bk-exp").onclick=function(){
      var filas=[["Pregunta","Correcta","Incorrecta 1","Incorrecta 2","Incorrecta 3","Incorrecta 4","Incorrecta 5","Nivel","Tema"]];
      b.questions.forEach(function(q){var o=q.opts.slice(),c=o.splice(q.answer,1)[0];while(o.length<5)o.push("");filas.push([q.q,c].concat(o,[q.level,q.topic||""]));});
      XL.descarga(XL.escribir([{nombre:"Preguntas",filas:filas,anchos:[50,24,24,24,24,24,24,8,18]}]),b.name.replace(/[\\/:*?"<>|]+/g," ").trim()+".xlsx");
    };
    if($("bk-tema"))$("bk-tema").onchange=function(){banco(id,null,this.value||null);};
    var s=panel.querySelectorAll("[data-borra]"),i;
    for(i=0;i<s.length;i++)s[i].onclick=function(){ if(!confirm("¿Borrar esta pregunta del banco? Los cuestionarios ya creados no cambian."))return;
      api("/api/banks/"+id+"/questions/"+this.getAttribute("data-borra"),{remove:true}).then(function(){banco(id,null,filtro);}); };
    s=panel.querySelectorAll("[data-edita]");
    for(i=0;i<s.length;i++)s[i].onclick=function(){var qid=+this.getAttribute("data-edita");editor(b,b.questions.filter(function(q){return q.id===qid;})[0]);};
  }).catch(function(e){pinta(atras("Aula")+'<p class="fine bad">'+esc(ERR(e))+'</p>');$("au-back").onclick=inicio;});
}
function editor(b,q){
  var z=$("bk-zona"), o=q?q.opts.slice():["","","",""];
  if(q){var c=o.splice(q.answer,1)[0];o.unshift(c);}
  while(o.length<4)o.push("");
  z.innerHTML='<form class="rt-form au-caja" id="ed-form"><h4>'+(q?"Editar pregunta":"Nueva pregunta")+'</h4>'+
    '<label>Enunciado<textarea id="ed-q" maxlength="300" rows="2" required>'+esc(q?q.q:"")+'</textarea></label>'+
    '<label>Respuesta correcta<input id="ed-o0" maxlength="150" required value="'+esc(o[0])+'"></label>'+
    [1,2,3,4,5].map(function(i){return '<label'+(i>3&&!o[i]?' hidden':'')+' data-extra="'+i+'">Incorrecta '+i+'<input id="ed-o'+i+'" maxlength="150" value="'+esc(o[i]||"")+'"></label>';}).join("")+
    '<button type="button" class="ghost au-mini" id="ed-mas">+ Otra opción</button>'+
    '<div class="rt-2"><label>Nivel<select id="ed-lv"><option value="1">Fácil</option><option value="2">Medio</option><option value="3">Difícil</option></select></label>'+
    '<label>Tema<input id="ed-t" maxlength="60" value="'+esc(q?q.topic:"")+'"></label></div>'+
    '<div class="actions"><button type="button" class="ghost" id="ed-no">Cancelar</button><button class="primary" type="submit" id="ed-go">Guardar</button></div><p class="msg" id="ed-msg"></p></form>';
  $("ed-lv").value=String(q?q.level:2);
  $("ed-mas").onclick=function(){var h=z.querySelector("label[data-extra][hidden]");if(h)h.hidden=false;};
  $("ed-no").onclick=function(){z.innerHTML="";};
  z.scrollIntoView({behavior:"smooth",block:"start"});
  $("ed-form").onsubmit=function(e){
    e.preventDefault();
    var opts=[0,1,2,3,4,5].map(function(i){return $("ed-o"+i).value.trim();}).filter(function(x,i){return i===0||x;});
    var it=BF.valida([{fila:1,q:$("ed-q").value,correcta:opts[0],otras:opts.slice(1),nivel:$("ed-lv").value,tema:$("ed-t").value}],{})[0];
    if(!it.ok){aviso("ed-msg",it.errores.join(" "),true);return;}
    $("ed-go").disabled=true;
    api("/api/banks/"+b.id+"/questions/"+(q?q.id:"nueva"),{q:it.q,opts:it.opts,answer:0,level:it.level,topic:it.topic})
      .then(function(){banco(b.id,q?"Pregunta guardada.":"Pregunta añadida.");})
      .catch(function(er){$("ed-go").disabled=false;aviso("ed-msg",ERR(er),true);});
  };
}
function importador(b){
  var z=$("bk-zona");
  z.innerHTML='<div class="au-caja"><h4>Importar preguntas</h4>'+
    '<p class="fine">Sube un Excel (.xlsx) o un CSV, o pega aquí filas copiadas de Excel o texto con opciones A) B) C) y la línea ANSWER: con la letra correcta. Antes de guardar verás cada pregunta revisada.</p>'+
    '<div class="actions au-acciones"><label class="ghost au-archivo">Elegir archivo<input type="file" id="im-f" accept=".xlsx,.csv,.txt" hidden></label>'+
    '<button type="button" class="ghost au-mini" id="im-ej1">Ejemplo de texto</button><button type="button" class="ghost au-mini" id="im-ej2">Ejemplo de tabla</button></div>'+
    '<textarea id="im-t" rows="8" placeholder="¿Cuál es la derivada de x²?\nA) 2x\nB) x\nC) x²/2\nANSWER: A\nNIVEL: 2\nTEMA: Derivadas"></textarea>'+
    '<div class="actions"><button type="button" class="ghost" id="im-no">Cancelar</button><button type="button" class="primary" id="im-rev">Revisar</button></div>'+
    '<p class="msg" id="im-msg"></p><div id="im-prev"></div></div>';
  z.scrollIntoView({behavior:"smooth",block:"start"});
  $("im-no").onclick=function(){z.innerHTML="";};
  $("im-ej1").onclick=function(){$("im-t").value=BF.EJEMPLO_TEXTO;};
  $("im-ej2").onclick=function(){$("im-t").value=BF.PLANTILLA.map(function(f){return f.join("\t");}).join("\n");};
  $("im-rev").onclick=function(){revisa(BF.desdeTexto($("im-t").value));};
  $("im-f").onchange=function(){
    var f=this.files[0]; if(!f)return;
    aviso("im-msg","Leyendo «"+f.name+"»…");
    if(/\.xlsx$/i.test(f.name))f.arrayBuffer().then(XL.leer).then(function(filas){revisa(BF.desdeFilas(filas));}).catch(function(er){aviso("im-msg",er.message||"No se pudo leer el archivo.",true);});
    else f.text().then(function(t){$("im-t").value=t;revisa(BF.desdeTexto(t));});
  };
  function revisa(items){
    var ya={}; api("/api/banks/"+b.id).then(function(r){
      r.questions.forEach(function(q){ya[BF.clave(q.q)]=1;});
      var v=BF.valida(items,ya), buenas=v.filter(function(x){return x.ok;}), malas=v.length-buenas.length, avisos=v.filter(function(x){return x.ok&&x.avisos.length;}).length;
      if(!v.length){aviso("im-msg","No se encontró ninguna pregunta. Revisa el formato.",true);$("im-prev").innerHTML="";return;}
      aviso("im-msg",v.length+" leída"+(v.length===1?"":"s")+": "+buenas.length+" válida"+(buenas.length===1?"":"s")+(malas?", "+malas+" con errores (no se importan)":"")+(avisos?", "+avisos+" con avisos":"")+".",!buenas.length);
      $("im-prev").innerHTML='<div class="tabla-wrap"><table class="tabla au-prev"><thead><tr><th>Fila</th><th>Revisión</th><th>Pregunta</th><th>Correcta</th><th>Otras</th><th>Nivel</th><th>Tema</th></tr></thead><tbody>'+
        v.map(function(x){return '<tr class="'+(x.ok?(x.avisos.length?"aviso":"bien"):"mal")+'"><td>'+(x.fila||"")+'</td>'+
          '<td class="au-rev">'+(x.ok?(x.avisos.length?'⚠ '+esc(x.avisos.join(" ")):'✓'):'✗ '+esc(x.errores.join(" ")))+'</td>'+
          '<td>'+esc(x.q||"—")+'</td><td>'+esc(x.opts[0]||"—")+'</td>'+
          '<td>'+esc(x.opts.slice(1).join(" | "))+'</td><td>'+NIV[x.level]+'</td><td>'+esc(x.topic||"")+'</td></tr>';}).join("")+
        '</tbody></table></div>'+(buenas.length?'<div class="actions"><button type="button" class="primary" id="im-go">Importar '+buenas.length+' pregunta'+(buenas.length===1?'':'s')+'</button></div>':'');
      if($("im-go"))$("im-go").onclick=function(){
        this.disabled=true;
        var lotes=[],i; for(i=0;i<buenas.length;i+=500)lotes.push(buenas.slice(i,i+500));
        var total=0,rech=0;
        lotes.reduce(function(p,l){return p.then(function(){
          return api("/api/banks/"+b.id+"/import",{items:l.map(function(x){return {fila:x.fila,q:x.q,opts:x.opts,answer:0,level:x.level,topic:x.topic};})})
            .then(function(r2){total+=r2.added;rech+=r2.rejected.length;});});},Promise.resolve())
          .then(function(){banco(b.id,total+" pregunta"+(total===1?" importada":"s importadas")+(rech?" · "+rech+" rechazada"+(rech===1?"":"s")+" por el servidor":"")+".");})
          .catch(function(er){aviso("im-msg",ERR(er),true);});
      };
    });
  }
}

/* ===================== PLATAFORMA ===================== */
function plataforma(){
  vista={render:plataforma};
  pinta('<p class="fine">Cargando…</p>');
  api("/api/admin/orgs").then(function(r){
    var h=atras("Aula")+'<h3>Administración de la plataforma</h3><p class="fine">Las instituciones nuevas quedan pendientes hasta que las apruebes. Suspender una impide que entren nuevos miembros y que se creen cursos o cuestionarios.</p>';
    h+=r.orgs.length?r.orgs.map(function(o){
      return '<div class="au-fila"><div><b>'+esc(o.name)+'</b> '+chipEstado(o.status)+'<small>'+esc(TIPOS[o.kind]||o.kind)+' · '+o.members+' miembro'+(o.members===1?'':'s')+
        ' · solicitó '+esc(o.creator_name)+' ('+esc(o.creator_email)+') · '+fecha(o.created_at)+(o.email_domain?' · @'+esc(o.email_domain):'')+'</small></div>'+
        (o.status!=="activa"?'<button type="button" class="primary au-mini" data-est="activa" data-id="'+o.id+'">Aprobar</button>':'')+
        (o.status!=="suspendida"?'<button type="button" class="ghost au-mini" data-est="suspendida" data-id="'+o.id+'">Suspender</button>':'')+'</div>';
    }).join(""):'<p class="fine">No hay instituciones.</p>';
    pinta(h); $("au-back").onclick=inicio;
    var s=panel.querySelectorAll("[data-est]"),i;
    for(i=0;i<s.length;i++)s[i].onclick=function(){
      api("/api/admin/orgs/"+this.getAttribute("data-id"),{status:this.getAttribute("data-est")}).then(plataforma).catch(function(er){alert(ERR(er));});
    };
  }).catch(function(e){pinta(atras("Aula")+'<p class="fine bad">'+esc(ERR(e))+'</p>');$("au-back").onclick=inicio;});
}

/* ---------- enlaces: ?curso=CÓDIGO y ?docente=CÓDIGO ---------- */
(function(){
  var q=new URLSearchParams(location.search), c=q.get("curso"), d=q.get("docente");
  if(!c&&!d)return;
  try{history.replaceState(null,"",location.pathname);}catch(e){}
  var ido=false, ir=function(){
    if(ido)return; ido=true;
    pendiente=c?function(){curso(c.toUpperCase().slice(0,6));}:function(){
      if(!user()){inicio();return;}
      uneDocente(d.toUpperCase().slice(0,8));
    };
    if(window.AxApp)AxApp.setMode("aula");
  };
  if(window.AxAccount&&AxAccount.listo())ir(); else document.addEventListener("ax-user",ir);
})();

window.AxAula={abrir:abrir,cerrar:cerrar,curso:function(code){activo=true;panel.hidden=false;curso(code);},org:org};
})();
