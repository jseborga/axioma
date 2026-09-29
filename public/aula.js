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

var vista=null, activo=false, pendiente=null, seccion="aula";
var TIPOS={universidad:"Universidad",instituto:"Instituto",colegio:"Colegio",empresa:"Empresa",comunidad:"Comunidad"};
var ACADEMICAS={universidad:1,instituto:1,colegio:1};
function academica(k){return !!ACADEMICAS[k];}
function tiposDe(sec){return Object.keys(TIPOS).filter(function(k){return sec==="empresas"?!academica(k):academica(k);});}
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
function ERR(e){if(e&&e.error==="quota_exceeded")return "Se agotaron los "+e.cuota+" usos de IA de este mes. Pide a la plataforma que amplíe el plan.";
  return {pro_required:"Las ayudas con IA son del plan Pro. Pide a la administración de la plataforma que lo active para tu institución.",
  ia_not_configured:"La IA no está configurada en esta instalación (falta la clave ANTHROPIC_API_KEY).",ia_failed:"La IA no respondió bien. Inténtalo otra vez en un momento.",
  ia_need_input:"Escribe un tema, pega un texto (de al menos unas líneas) o adjunta un archivo.",ia_file_too_big:"El archivo es demasiado grande (máximo 12 MB).",bad_group:"Ese grupo no existe en el curso.",too_many:"Has llegado al límite.",not_configured:"Faltan las tablas de la sección Educativo en la base de datos: hay que volver a ejecutar schema.sql (ver SETUP.md).",
  unauthorized:"Tienes que entrar con Google.",profile_required:"Primero completa tu registro.",forbidden:"No tienes permiso para esto.",
  not_found:"No existe o ya no está disponible.",org_pending:"La institución todavía no está aprobada por la administración de la plataforma.",
  org_suspended:"La institución está suspendida.",domain:"Esta institución solo admite cuentas del dominio @"+(e&&e.domain||"")+".",
  student_code_required:"Escribe tu registro universitario (o código de estudiante).",archived:"Este curso está archivado.",
  bad_name:"El nombre es demasiado corto.",bad_domain:"El dominio no es válido (ejemplo: umsa.bo).",levels_in_use:"No se puede quitar un nivel que tiene unidades.",
  unit_in_use:"No se puede borrar: tiene unidades, cursos o bancos asociados.",too_deep:"Ese nivel no existe en la estructura.",
  last_admin:"La institución no puede quedarse sin administración.",too_many:"Has llegado al límite.",empty_pool:"No hay preguntas con ese tema y nivel en el banco.",
  forbidden_bank:"No puedes usar ese banco en este curso.",bank_full:"El banco está lleno (máximo "+(e&&e.max||"")+" preguntas).",
  bad_end:"Tiene que durar entre 5 minutos y 31 días.",bad_start:"La fecha de inicio no es válida.",invalid:(e&&e.errores||[]).join(" "),
  bad_slug:"La dirección de la página solo admite letras, números y guiones (de 3 a 40).",slug_taken:"Esa dirección ya la usa otra marca.",
  bad_color:"El color no es válido.",bad_logo:"El logo no es válido o es demasiado grande.",bad_website:"El sitio web tiene que empezar por https://",
  bad_email:"Revisa el correo.",google_required:"Para esto hace falta entrar con Google.",cannot_block_admin:"No se puede bloquear a la administración de la plataforma."

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
function nombreSeccion(){return seccion==="empresas"?"Empresas":"Educativo";}
/* en empresas, el rol «docente» es quien crea retos, convocatorias y premios */
function nombreRol(r,kind){return r==="docente"&&kind&&!academica(kind)?"Organizador":(ROLES[r]||r);}

/* ---------- entrada ---------- */
function abrir(m){ activo=true; panel.hidden=false; var p=pendiente; pendiente=null;
  var sec=m==="empresas"?"empresas":m==="aula"?"aula":seccion;
  if(sec!==seccion){seccion=sec;vista=null;}
  if(p)p(); else if(vista&&vista.render)vista.render(); else inicio(); }
function cerrar(){ activo=false; panel.hidden=true; }
document.addEventListener("ax-user",function(){ if(activo&&vista&&vista.render)vista.render(); });
document.addEventListener("ax-perfil",function(){ if(activo&&vista&&vista.render)vista.render(); });

/* ===================== INICIO DEL AULA ===================== */
function inicio(){
  if(seccion==="empresas")return inicioEmpresas();
  vista={render:inicio}; $("hdr").textContent="Educativo";
  var u=user();
  if(u&&u.guest){pinta('<h3>Educativo</h3><p>'+esc(ERR({error:"google_required"}))+' Ahora participas como invitado.</p>');return;}
  if(!u){
    pinta('<h3>Educativo</h3><p>Cuestionarios de clase con registros para el docente: la institución organiza su estructura (facultades, carreras, materias…), cada docente crea sus cursos y bancos de preguntas, y los estudiantes entran con el enlace de su curso. <a href="#" class="guia-link" data-guia="aula">¿Cómo funciona?</a></p>'+
      (window.AxAccount&&AxAccount.configurado()?'<div class="actions"><button class="primary" id="au-login">Entrar con Google</button></div>':'<p class="fine">El inicio de sesión no está configurado.</p>'));
    if($("au-login"))$("au-login").onclick=function(){AxAccount.abrirCuenta();};
    return;
  }
  pinta('<h3>Educativo</h3><p class="fine">Cargando…</p>');
  api("/api/orgs").then(function(r){
    var h='<h3>Educativo</h3><p class="fine">Cursos, bancos de preguntas y cuestionarios de clase. <a href="#" class="guia-link" data-guia="aula">¿Cómo funciona?</a></p>'+
      '<form class="rt-join" id="au-join"><input id="au-code" placeholder="Código de curso o de docente" maxlength="8" autocapitalize="characters" autocomplete="off" spellcheck="false"><button type="submit" class="primary">Unirme</button></form>'+
      '<p class="msg" id="au-msg"></p>';
    var cursos=r.courses.filter(function(c){return !c.archived;});
    h+='<h4>Tus cursos</h4>';
    h+=cursos.length?cursos.map(function(c){
      return '<button type="button" class="rt-card" data-curso="'+c.code+'"><span class="rt-card-top"><b>'+esc(c.name)+'</b>'+
        (c.status==="pendiente"?'<span class="chip pronto">Pendiente</span>':c.open?'<span class="chip activo">'+c.open+' abierto'+(c.open>1?'s':'')+'</span>':'<span class="chip">'+esc(ROLES[c.role]||c.role)+'</span>')+'</span>'+
        '<small>'+esc(c.org_name)+(c.unit_name?' · '+esc(c.unit_name):'')+(c.term?' · '+esc(c.term):'')+(c.status!=="pendiente"?' · '+esc(ROLES[c.role]||c.role):'')+'</small></button>';
    }).join(""):'<p class="fine">Todavía no estás en ningún curso. Pide a tu docente el código o el enlace del curso.</p>';
    var mias=r.orgs.filter(function(o){return academica(o.kind);});
    h+='<h4>Tus instituciones</h4>';
    h+=mias.length?mias.map(function(o){
      return '<button type="button" class="rt-card" data-org="'+o.id+'"><span class="rt-card-top"><b>'+esc(o.name)+'</b>'+chipEstado(o.status)+'</span>'+
        '<small>'+esc(TIPOS[o.kind]||o.kind)+' · '+esc(nombreRol(o.role,o.kind))+(o.email_domain?' · @'+esc(o.email_domain):'')+'</small></button>';
    }).join(""):'<p class="fine">No perteneces a ninguna institución.</p>';
    h+='<div class="actions"><button class="ghost" id="au-nueva">Registrar una institución</button></div>'+
      (r.orgs.length>mias.length?'<p class="fine">Tus empresas y comunidades están en <a href="#" id="au-emp">Empresas y eventos</a>.</p>':'');
    if(r.platform_admin)h+='<div class="actions"><button class="ghost" id="au-plat">Administración de la plataforma'+(r.pending_orgs?' · '+r.pending_orgs+' pendiente'+(r.pending_orgs>1?'s':''):'')+'</button></div>';
    pinta(h);
    var bs=panel.querySelectorAll("[data-curso]"),i; for(i=0;i<bs.length;i++)bs[i].onclick=function(){curso(this.getAttribute("data-curso"));};
    bs=panel.querySelectorAll("[data-org]"); for(i=0;i<bs.length;i++)bs[i].onclick=function(){org(this.getAttribute("data-org"));};
    $("au-nueva").onclick=crearOrg;
    if($("au-emp"))$("au-emp").onclick=function(e){e.preventDefault();AxApp.setMode("empresas");};
    if($("au-plat"))$("au-plat").onclick=function(){plataforma();};
    $("au-join").onsubmit=function(e){
      e.preventDefault(); var c=$("au-code").value.trim().toUpperCase();
      if(c.length===6)curso(c);
      else if(c.length===8)uneDocente(c);
      else aviso("au-msg","Los cursos tienen códigos de 6 caracteres y los enlaces de docente, de 8.",true);
    };
  }).catch(function(e){
    if(e&&e.error==="profile_required"){
      pinta('<h3>Educativo</h3><p>Para usar la sección Educativo primero completa tu registro: fecha de nacimiento y aceptación de términos y privacidad.</p>'+
        '<div class="actions"><button class="primary" id="au-reg">Completar mi registro</button></div>');
      $("au-reg").onclick=function(){AxRegistro.asegura().then(function(ok){if(ok)inicio();});};
      return;
    }
    pinta('<h3>Educativo</h3><p class="fine bad">'+esc(ERR(e))+'</p>');
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
  var emp=seccion==="empresas", tipos=tiposDe(seccion);
  pinta(atras(nombreSeccion())+'<h3>'+(emp?'Registrar una empresa o comunidad':'Registrar una institución')+'</h3>'+
    '<form class="rt-form" id="au-form">'+
    '<label>Nombre<input id="o-name" maxlength="90" required placeholder="'+(emp?'Café Central':'Universidad Mayor de San Andrés')+'"></label>'+
    '<label>Tipo<select id="o-kind">'+tipos.map(function(k){return '<option value="'+k+'">'+TIPOS[k]+'</option>';}).join("")+'</select></label>'+
    (emp?'<p class="fine">Una empresa, marca, comunidad o evento: tendrás tu página con logo y color, convocatorias con QR para que la gente participe sin trámites, bancos de preguntas y métricas.</p>':
    '<label>Dominio de correo (opcional)<input id="o-dom" maxlength="80" placeholder="umsa.bo"></label>'+
    '<p class="fine">Con dominio, solo pueden entrar cuentas de ese correo institucional. Déjalo vacío para admitir cualquier cuenta de Google.</p>'+
    '<label>Estructura</label><div id="o-niveles" class="au-niveles"></div>'+
    '<p class="fine">Son los niveles con los que se organiza la institución; los cursos y bancos cuelgan del último. Se pueden cambiar después.</p>')+
    '<div class="actions"><button class="primary" type="submit" id="o-go">Registrar</button></div><p class="msg" id="o-msg"></p></form>');
  $("au-back").onclick=inicio;
  var niveles=PLANTILLAS[tipos[0]].slice();
  function pintaNiveles(){ if(!$("o-niveles"))return; $("o-niveles").innerHTML=editorNiveles(niveles); ligaNiveles($("o-niveles"),niveles,pintaNiveles); }
  $("o-kind").onchange=function(){niveles=PLANTILLAS[this.value].slice();pintaNiveles();};
  pintaNiveles();
  $("au-form").onsubmit=function(e){
    e.preventDefault(); $("o-go").disabled=true;
    api("/api/orgs",{name:$("o-name").value,kind:$("o-kind").value,email_domain:$("o-dom")?$("o-dom").value:"",levels:$("o-niveles")?leeNiveles($("o-niveles")):null})
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
    var acad=academica(o.kind), lista=[];
    if(acad)lista.push(["cursos","Cursos"]);
    if(o.can.teach)lista.push(["convocatorias","Convocatorias"],["bancos","Bancos"]);
    if(o.can.teach&&acad)lista.push(["registros","Registros"]);
    if(o.can.admin||o.platform_admin)lista.push(["metricas","Métricas"]);
    if(o.can.admin&&acad)lista.push(["estructura","Estructura"]);
    if(o.can.admin)lista.push(["miembros","Miembros"],["ajustes",acad?"Ajustes":"Marca y ajustes"]);
    if(!lista.length)lista.push(["cursos","Cursos"]);
    if(!tab||!lista.some(function(t){return t[0]===tab;}))tab=lista[0][0];
    pinta(atras(nombreSeccion())+'<div class="rt-head"><h3>'+esc(o.name)+'</h3>'+chipEstado(o.status)+'</div>'+
      '<p class="rt-meta">'+esc(TIPOS[o.kind]||o.kind)+' · tu rol: '+esc(o.role?nombreRol(o.role,o.kind):"—")+(o.email_domain?' · solo @'+esc(o.email_domain):'')+
        ' · '+Object.keys(o.counts).map(function(k){return o.counts[k]+' '+nombreRol(k,o.kind).toLowerCase();}).join(", ")+'</p>'+
      (o.status==="pendiente"?'<p class="rt-hoy">Pendiente de aprobación por la administración de la plataforma. Puedes preparar la estructura y los miembros; los cursos se abren al aprobarla.</p>':'')+
      (o.status==="suspendida"?'<p class="rt-hoy">Institución suspendida por la administración de la plataforma.</p>':'')+
      (nota?'<p class="fine ok">'+esc(nota)+'</p>':'')+
      (!o.role&&o.platform_admin?'<p class="rt-hoy">Estás viendo esta institución como administración de la plataforma.</p>':'')+
      (lista.length>1?tabs(lista,tab):'')+'<div id="au-tab"></div>');
    $("au-back").onclick=inicio;
    ligaTabs(function(t){org(id,t);});
    ({cursos:tabCursos,convocatorias:tabConvocatorias,bancos:tabBancos,registros:tabRegistros,metricas:tabMetricas,estructura:tabEstructura,
      miembros:tabMiembros,ajustes:tabAjustes})[tab](o);
  }).catch(function(e){pinta(atras("Educativo")+'<p class="fine bad">'+esc(ERR(e))+'</p>');$("au-back").onclick=inicio;});
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
        return '<tr><td>'+esc(m.name)+(m.me?' <em>(tú)</em>':'')+'<small>'+esc(m.email||(m.guest?"invitado":""))+'</small></td><td>'+esc(m.student_code||"—")+'</td>'+
          '<td><select data-rol="'+m.id+'">'+Object.keys(ROLES).filter(function(k){return k!=="auspiciador"||k===m.role;}).map(function(k){return '<option value="'+k+'"'+(k===m.role?' selected':'')+'>'+nombreRol(k,o.kind)+'</option>';}).join("")+'</select></td>'+
          '<td>'+(m.minor?'<label class="au-cons"><input type="checkbox" data-cons="'+m.id+'"'+(m.consent_ok?' checked':'')+'> Menor: la institución tiene el consentimiento</label>':'<small>Mayor de edad</small>')+'</td>'+
          '<td>'+(m.me?'':'<button type="button" class="ghost au-mini" data-quita="'+m.id+'">Quitar</button>')+'</td></tr>';
      }).join("")+'</tbody></table></div><p class="msg" id="m-msg"></p>'+
      '<h4>Dar de alta por correo</h4><form class="rt-join au-invita" id="m-inv"><input id="m-email" type="email" placeholder="correo@ejemplo.com" autocomplete="off">'+
      '<select id="m-rol"><option value="admin">Administración</option><option value="docente">'+(academica(o.kind)?'Docente':'Organizador')+'</option></select>'+
      '<button type="submit" class="primary">Dar de alta</button></form>'+
      '<p class="fine">Si ya tiene cuenta queda dada de alta al momento; si no, en cuanto entre con Google con ese correo.</p>'+
      (r.invites&&r.invites.length?'<ul class="au-inv">'+r.invites.map(function(i){return '<li><span>'+esc(i.email)+' · '+esc(nombreRol(i.role,o.kind))+' · pendiente</span>'+
        '<button type="button" class="ghost au-mini" data-desinv="'+esc(i.email)+'">Quitar</button></li>';}).join("")+'</ul>':'');
    t.innerHTML=h;
    $("m-inv").onsubmit=function(e){e.preventDefault();
      api("/api/orgs/"+o.id+"/invites",{email:$("m-email").value,role:$("m-rol").value}).then(function(x){
        tabMiembros(o); setTimeout(function(){aviso("m-msg",x.added?"Dado de alta.":"Invitación guardada: se aplicará cuando entre con Google.");},300);})
        .catch(function(er){aviso("m-msg",ERR(er),true);});};
    var di=t.querySelectorAll("[data-desinv]"),j; for(j=0;j<di.length;j++)di[j].onclick=function(){
      api("/api/orgs/"+o.id+"/invites",{email:this.getAttribute("data-desinv"),remove:true}).then(function(){tabMiembros(o);});};
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
  t.innerHTML='<h4>Marca y página pública</h4><div id="a-marca"><p class="fine">Cargando…</p></div>'+
    '<h4>Datos</h4><form class="rt-form" id="a-form"><label>Nombre<input id="a-name" maxlength="90" value="'+esc(o.name)+'"></label>'+
    (academica(o.kind)?'<label>Dominio de correo (opcional)<input id="a-dom" maxlength="80" value="'+esc(o.email_domain)+'" placeholder="umsa.bo"></label>'+
    '<p class="fine">Con dominio, solo entran cuentas de ese correo. Quien ya es miembro no se ve afectado.</p>':'')+
    '<div class="actions"><button class="primary" type="submit">Guardar</button></div><p class="msg" id="a-msg"></p></form>';
  $("a-form").onsubmit=function(e){e.preventDefault();
    api("/api/orgs/"+o.id+"/settings",$("a-dom")?{name:$("a-name").value,email_domain:$("a-dom").value}:{name:$("a-name").value}).then(function(){org(o.id,"ajustes","Guardado.");})
      .catch(function(er){aviso("a-msg",ERR(er),true);});};
  editorMarca(o);
}

/* ===================== CURSO ===================== */
function curso(code,nota,tab){
  vista={render:function(){curso(code,null,tab);}};
  pinta('<p class="fine">Cargando…</p>');
  api("/api/courses/"+code).then(function(c){
    $("hdr").textContent=c.code;
    var cab=atras("Educativo")+'<div class="rt-head"><h3>'+esc(c.name)+'</h3>'+(c.archived?'<span class="chip terminado">Archivado</span>':'')+'</div>'+
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
    if(!c.manage){ pinta(cab+listaCuestionarios(c,false)+(c.extras?'<h4>Mi avance</h4><div id="au-avance"><p class="fine">Cargando…</p></div>':''));
      $("au-back").onclick=inicio; ligaCuestionarios(); if(c.extras)miAvance(c); return; }
    /* vista de quien gestiona el curso */
    var pend=(c.members||[]).filter(function(x){return x.status==="pendiente";}).length;
    tab=tab||"cuest";
    pinta(cab+'<div class="rt-code"><span>Código del curso</span><b>'+c.code+'</b><button type="button" class="ghost" id="cu-copy">Copiar enlace</button>'+
        (navigator.share?'<button type="button" class="ghost" id="cu-share">Invitar</button>':'')+'</div>'+
      tabs([["cuest","Cuestionarios"]].concat(c.extras?[["libreta","Libreta"]]:[]).concat([["alumnos","Estudiantes"+(pend?" ("+pend+")":"")],["ajustes","Ajustes"]]),tab)+'<div id="au-tab"></div>');
    $("au-back").onclick=inicio;
    $("cu-copy").onclick=function(){copia(enlace("curso",c.code),this);};
    if($("cu-share"))$("cu-share").onclick=function(){navigator.share({text:"Únete a «"+c.name+"» en The Final Test: "+enlace("curso",c.code)}).catch(function(){});};
    ligaTabs(function(t){curso(code,null,t);});
    var t=$("au-tab");
    if(tab==="cuest"){
      t.innerHTML=(c.archived?'':'<div class="actions"><button class="primary" id="cu-nuevo">Nuevo cuestionario</button></div>')+listaCuestionarios(c,true);
      if($("cu-nuevo"))$("cu-nuevo").onclick=function(){crearCuestionario(c);};
      ligaCuestionarios();
    }else if(tab==="libreta")tabLibreta(c,t);
    else if(tab==="alumnos")tabAlumnos(c,t);
    else tabAjustesCurso(c,t);
  }).catch(function(e){pinta(atras("Educativo")+'<p class="fine bad">'+esc(ERR(e))+'</p>');$("au-back").onclick=inicio;});
}
/* ---------- libreta de notas ---------- */
function celda(q,x){
  if(x&&x.na)return '<td class="na" title="No es de su grupo">·</td>';
  if(!x)return '<td class="vacia">—</td>';
  if(q.modo==="practica")return '<td title="'+x.attempts+' intentos">'+x.best+' %<small>'+x.attempts+'×</small></td>';
  return '<td class="'+(x.nota>=51?'ok':'mal')+'" title="'+x.correct+' aciertos · '+x.errors+' errores">'+x.nota+'</td>';
}
function textoCelda(q,x){if(x&&x.na)return "";if(!x)return "";return q.modo==="practica"?x.best+"% ("+x.attempts+")":x.nota;}
function tabLibreta(c,t){
  t.innerHTML='<p class="fine">Cargando…</p>';
  api("/api/courses/"+c.code+"/libreta").then(function(L){
    if(!L.columns.length){t.innerHTML='<p class="fine">Todavía no hay cuestionarios en este curso.</p>';return;}
    var grupos={}; L.rows.forEach(function(r){if(r.group)grupos[r.group]=1;});
    var filtro='<div class="rt-form"><div class="rt-2"><label>Grupo<select id="lb-g"><option value="">Todos</option>'+Object.keys(grupos).sort().map(function(g){return '<option>'+esc(g)+'</option>';}).join("")+'</select></label>'+
      '<div class="actions" style="align-self:end"><button type="button" class="ghost" id="lb-xls">Descargar Excel</button></div></div></div>';
    function tabla(g){
      var rows=L.rows.filter(function(r){return !g||r.group===g;});
      return '<div class="tabla-wrap"><table class="tabla au-libreta"><thead><tr><th>Estudiante</th><th>Registro</th>'+(Object.keys(grupos).length?'<th>Grupo</th>':'')+
        L.columns.map(function(q){return '<th title="'+esc(q.name)+'">'+esc(q.name.length>18?q.name.slice(0,17)+"…":q.name)+'<small>'+(q.modo==="practica"?'práctica':'examen')+(q.group_name?' · '+esc(q.group_name):'')+'</small></th>';}).join("")+
        '<th>Promedio<small>exámenes</small></th></tr></thead><tbody>'+
        rows.map(function(r){return '<tr><td>'+esc(r.name)+'<small>'+esc(r.email)+'</small></td><td>'+esc(r.student_code||"—")+'</td>'+(Object.keys(grupos).length?'<td>'+esc(r.group||"—")+'</td>':'')+
          L.columns.map(function(q,i){return celda(q,r.notas[i]);}).join("")+'<td class="prom">'+(r.promedio==null?'—':r.promedio)+'</td></tr>';}).join("")+
        '</tbody></table></div>'+(rows.length?'':'<p class="fine">Nadie en este grupo.</p>');
    }
    t.innerHTML=filtro+'<div id="lb-t">'+tabla("")+'</div><p class="fine">Exámenes: nota de 0 a 100 según los aciertos sobre el total de preguntas (un examen cerrado sin responder cuenta 0 en el promedio). Prácticas: el mejor intento y cuántos hizo. «·»: no es de su grupo.</p>';
    $("lb-g").onchange=function(){$("lb-t").innerHTML=tabla(this.value);};
    $("lb-xls").onclick=function(){
      var g=$("lb-g").value, cab=["Estudiante","Correo","Registro","Grupo"].concat(L.columns.map(function(q){return q.name+(q.modo==="practica"?" (práctica)":"");})).concat(["Promedio exámenes"]);
      var filas=[cab].concat(L.rows.filter(function(r){return !g||r.group===g;}).map(function(r){
        return [r.name,r.email,r.student_code,r.group].concat(L.columns.map(function(q,i){return textoCelda(q,r.notas[i]);})).concat([r.promedio==null?"":r.promedio]);}));
      AxExcel.descarga(AxExcel.escribir([{nombre:"Libreta",filas:filas,anchos:[28,30,14,14].concat(L.columns.map(function(){return 16;})).concat([12])}]),
        ("Libreta - "+c.name+(g?" - "+g:"")).replace(/[\\/:*?"<>|]+/g," ").trim()+".xlsx");
    };
  }).catch(function(e){t.innerHTML='<p class="fine bad">'+esc(ERR(e))+'</p>';});
}
function miAvance(c){
  api("/api/courses/"+c.code+"/libreta").then(function(L){
    var r=L.rows[0], el=$("au-avance"); if(!el)return;
    if(!r||!L.columns.length){el.innerHTML='<p class="fine">Aquí verás tus notas y tus prácticas.</p>';return;}
    el.innerHTML=(r.promedio!=null?'<div class="cq-mio"><small>Promedio de exámenes</small><b>'+r.promedio+'</b><span>sobre 100</span></div>':'')+
      '<ul class="au-avance">'+L.columns.map(function(q,i){var x=r.notas[i]; if(x&&x.na)return "";
        return '<li><span>'+esc(q.name)+'<small>'+(q.modo==="practica"?'Práctica':'Examen')+'</small></span><b>'+(!x?'—':q.modo==="practica"?x.best+' % · '+x.attempts+(x.attempts===1?' intento':' intentos'):x.nota)+'</b></li>';}).join("")+'</ul>';
  }).catch(function(){var el=$("au-avance"); if(el)el.innerHTML='';});
}
function listaCuestionarios(c,gestor){
  if(!c.quizzes||!c.quizzes.length)return '<p class="fine">'+(gestor?'Todavía no hay cuestionarios. Crea el primero a partir de un banco de preguntas.':'Todavía no hay cuestionarios en este curso.')+'</p>';
  var grupos={abierto:[],pronto:[],terminado:[]};
  c.quizzes.forEach(function(q){grupos[q.state].push(q);});
  var h="";
  [["abierto","Abiertos"],["pronto","Próximos"],["terminado","Cerrados"]].forEach(function(g){
    if(!grupos[g[0]].length)return;
    h+='<h4>'+g[1]+'</h4>'+grupos[g[0]].map(function(q){
      var pr=q.modo==="practica";
      var yo=pr?(q.me?'Tu mejor intento: '+q.me.best+' % ('+q.me.attempts+')':(q.state==="abierto"&&!gestor?'Sin practicar':''))
        :q.me?(q.me.finished?'Tu resultado: '+q.me.correct+' ✓ · '+q.me.errors+' ✗':'A medias'):(q.state==="abierto"&&!gestor?'Sin responder':'');
      return '<button type="button" class="rt-card" data-quiz="'+q.code+'"><span class="rt-card-top"><b>'+esc(q.name)+'</b>'+
        '<span class="au-chips">'+(pr?'<span class="chip activo">Práctica</span>':'<span class="chip">Examen</span>')+(q.group_name?'<span class="chip">'+esc(q.group_name)+'</span>':'')+
        (q.partial&&q.partial!=="Práctica"?'<span class="chip">'+esc(q.partial)+'</span>':'')+'</span></span>'+
        '<small>'+(q.state==="pronto"?'Se abre el '+fecha(q.starts_at):q.state==="abierto"?'Cierra el '+fecha(q.ends_at):'Cerró el '+fecha(q.ends_at))+
        ' · '+q.max_questions+' preguntas · '+q.seconds_per_q+' s'+(gestor?' · '+q.played+(pr?' practicaron':' respondieron'):'')+(yo?' · <b>'+yo+'</b>':'')+'</small></button>';
    }).join("");
  });
  return h;
}
function ligaCuestionarios(){var bs=panel.querySelectorAll("[data-quiz]"),i;for(i=0;i<bs.length;i++)bs[i].onclick=function(){aConcurso(this.getAttribute("data-quiz"));};}

function tabAlumnos(c,t){
  var pend=c.members.filter(function(x){return x.status==="pendiente";}), act=c.members.filter(function(x){return x.status==="activo";});
  var G=c.groups||[], hayG=c.extras;
  function selGrupo(m){return '<select data-grp="'+m.id+'"><option value="">—</option>'+G.map(function(g){return '<option value="'+g.id+'"'+(g.id===m.group_id?' selected':'')+'>'+esc(g.name)+'</option>';}).join("")+'</select>';}
  var h="";
  if(pend.length)h+='<h4>Por aprobar</h4>'+pend.map(function(m){return '<div class="au-fila"><div><b>'+esc(m.name)+'</b><small>'+esc(m.email)+' · registro '+esc(m.student_code||"—")+'</small></div>'+
    '<button type="button" class="primary au-mini" data-apr="'+m.id+'">Aprobar</button><button type="button" class="ghost au-mini" data-quita="'+m.id+'">Rechazar</button></div>';}).join("");
  h+='<h4>En el curso ('+act.length+')</h4>'+
    '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Nombre</th><th>Registro</th>'+(hayG&&G.length?'<th>Grupo</th>':'')+'<th>Rol</th><th></th></tr></thead><tbody>'+
    act.map(function(m){return '<tr><td>'+esc(m.name)+(m.me?' <em>(tú)</em>':'')+'<small>'+esc(m.email)+'</small></td><td>'+esc(m.student_code||"—")+'</td>'+
      (hayG&&G.length?'<td>'+(m.owner||m.role!=="estudiante"?'':selGrupo(m))+'</td>':'')+
      '<td>'+(m.owner?'Docente':'<select data-rol="'+m.id+'"><option value="estudiante"'+(m.role==="estudiante"?' selected':'')+'>Estudiante</option><option value="auxiliar"'+(m.role==="auxiliar"?' selected':'')+'>Auxiliar</option></select>')+'</td>'+
      '<td>'+(m.owner||m.me?'':'<button type="button" class="ghost au-mini" data-quita="'+m.id+'">Quitar</button>')+'</td></tr>';}).join("")+
    '</tbody></table></div><p class="fine">Los auxiliares pueden crear cuestionarios en este curso y ver sus registros.</p><p class="msg" id="al-msg"></p>';
  if(hayG){
    /* grupos del curso */
    h+='<h4>Grupos</h4><p class="fine">Divide el curso en grupos (laboratorio, turno…) para dar prácticas o exámenes solo a uno de ellos. Cada estudiante va en un grupo como mucho.</p>'+
      (G.length?'<ul class="au-grupos">'+G.map(function(g){return '<li><b>'+esc(g.name)+'</b><small>'+g.n+(g.n===1?' estudiante':' estudiantes')+'</small>'+
        '<button type="button" class="ghost au-mini" data-gren="'+g.id+'" data-nom="'+esc(g.name)+'">Renombrar</button><button type="button" class="ghost au-mini" data-gdel="'+g.id+'">Borrar</button></li>';}).join("")+'</ul>':'')+
      '<form class="rt-join" id="gr-f"><input id="gr-n" maxlength="40" placeholder="Nombre del grupo" style="text-transform:none;letter-spacing:0"><button type="submit" class="ghost">Crear grupo</button></form>';
    /* alta masiva */
    h+='<details class="au-nuevo" id="am-d"><summary>Alta masiva desde Excel</summary><div class="au-caja">'+
      '<p class="fine">Sube un Excel (.xlsx) o CSV con las columnas <b>nombre</b>, <b>correo</b> y <b>registro</b>, o pega las filas copiadas de Excel. Quien ya tiene cuenta queda inscrito al momento; el resto, en cuanto entre con Google con ese correo.</p>'+
      '<div class="actions au-acciones"><label class="ghost au-archivo">Elegir archivo<input type="file" id="am-f" accept=".xlsx,.csv,.txt" hidden></label></div>'+
      '<textarea id="am-t" rows="5" placeholder="Ana Pérez&#9;ana@correo.com&#9;2024-001&#10;Luis Rojas&#9;luis@correo.com&#9;2024-002"></textarea>'+
      (G.length?'<label>Añadirlos al grupo<select id="am-g"><option value="">Ninguno</option>'+G.map(function(g){return '<option value="'+g.id+'">'+esc(g.name)+'</option>';}).join("")+'</select></label>':'')+
      '<div id="am-prev"></div><div class="actions"><button type="button" class="ghost" id="am-ver">Revisar</button><button type="button" class="primary" id="am-go" disabled>Dar de alta</button></div><p class="msg" id="am-msg"></p></div></details>';
    if(c.invites&&c.invites.length)h+='<h4>Altas pendientes ('+c.invites.length+')</h4><p class="fine">Entrarán en el curso en cuanto usen la app con ese correo.</p><ul class="au-inv">'+
      c.invites.map(function(x){return '<li><span>'+esc(x.name||"")+' · '+esc(x.email)+(x.student_code?' · '+esc(x.student_code):'')+'</span><button type="button" class="ghost au-mini" data-desinv="'+esc(x.email)+'">Quitar</button></li>';}).join("")+'</ul>';
  }
  t.innerHTML=h;
  function recarga(){curso(c.code,null,"alumnos");}
  function hace(uid,d){api("/api/courses/"+c.code+"/members/"+encodeURIComponent(uid),d).then(recarga).catch(function(er){aviso("al-msg",ERR(er),true);});}
  var s=t.querySelectorAll("[data-apr]"),i; for(i=0;i<s.length;i++)s[i].onclick=function(){hace(this.getAttribute("data-apr"),{status:"activo"});};
  s=t.querySelectorAll("[data-quita]"); for(i=0;i<s.length;i++)s[i].onclick=function(){if(confirm("¿Quitar del curso?"))hace(this.getAttribute("data-quita"),{remove:true});};
  s=t.querySelectorAll("[data-rol]"); for(i=0;i<s.length;i++)s[i].onchange=function(){hace(this.getAttribute("data-rol"),{role:this.value});};
  s=t.querySelectorAll("[data-grp]"); for(i=0;i<s.length;i++)s[i].onchange=function(){hace(this.getAttribute("data-grp"),{group_id:this.value||null});};
  if(!hayG)return;
  $("gr-f").onsubmit=function(e){e.preventDefault(); var n=$("gr-n").value.trim(); if(!n)return;
    api("/api/courses/"+c.code+"/groups",{name:n}).then(recarga).catch(function(er){aviso("al-msg",ERR(er),true);});};
  s=t.querySelectorAll("[data-gren]"); for(i=0;i<s.length;i++)s[i].onclick=function(){var n=prompt("Nuevo nombre del grupo",this.getAttribute("data-nom")); if(!n)return;
    api("/api/courses/"+c.code+"/groups/"+this.getAttribute("data-gren"),{name:n}).then(recarga).catch(function(er){aviso("al-msg",ERR(er),true);});};
  s=t.querySelectorAll("[data-gdel]"); for(i=0;i<s.length;i++)s[i].onclick=function(){if(!confirm("¿Borrar el grupo? Sus estudiantes siguen en el curso."))return;
    api("/api/courses/"+c.code+"/groups/"+this.getAttribute("data-gdel"),{remove:true}).then(recarga).catch(function(er){aviso("al-msg",ERR(er),true);});};
  s=t.querySelectorAll("[data-desinv]"); for(i=0;i<s.length;i++)s[i].onclick=function(){api("/api/courses/"+c.code+"/alta",{remove:this.getAttribute("data-desinv")}).then(recarga);};
  /* alta masiva: se leen las filas, se reconocen las columnas y se revisan antes de enviar */
  var filas=[];
  function interpreta(tabla){
    tabla=tabla.filter(function(r){return r&&r.some(function(x){return String(x==null?"":x).trim();});});
    if(!tabla.length)return [];
    var cab=tabla[0].map(function(x){return String(x||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();});
    var iN=-1,iC=-1,iR=-1;
    cab.forEach(function(h,k){if(iC<0&&/correo|e-?mail|mail/.test(h))iC=k; else if(iN<0&&/nombre|estudiante|alumno|apellido/.test(h))iN=k; else if(iR<0&&/registro|codigo|matricula|carnet|ci\b/.test(h))iR=k;});
    var conCab=iC>=0; if(!conCab){ /* sin cabecera: se busca la columna que parece correo */
      var ej=tabla[0]; ej.forEach(function(x,k){if(iC<0&&/@/.test(String(x)))iC=k;});
      iN=iC===0?1:0; iR=[0,1,2].filter(function(k){return k!==iC&&k!==iN;})[0];
    }
    return tabla.slice(conCab?1:0).map(function(r){return {nombre:String(r[iN]==null?"":r[iN]).trim(),correo:String(r[iC]==null?"":r[iC]).trim(),registro:iR>=0?String(r[iR]==null?"":r[iR]).trim():""};});
  }
  function muestra(){
    var ok=filas.filter(function(f){return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(f.correo);});
    $("am-prev").innerHTML=filas.length?'<p class="fine">'+ok.length+' de '+filas.length+' filas con un correo válido.'+(ok.length<filas.length?' Las demás se ignorarán.':'')+'</p>'+
      '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Nombre</th><th>Correo</th><th>Registro</th></tr></thead><tbody>'+
      filas.slice(0,8).map(function(f){var v=/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(f.correo);return '<tr class="'+(v?'':'mal')+'"><td>'+esc(f.nombre)+'</td><td>'+esc(f.correo)+'</td><td>'+esc(f.registro)+'</td></tr>';}).join("")+
      '</tbody></table></div>'+(filas.length>8?'<p class="fine">… y '+(filas.length-8)+' más.</p>':''):'<p class="fine bad">No se encontraron filas.</p>';
    $("am-go").disabled=!ok.length; $("am-go").textContent="Dar de alta ("+ok.length+")";
  }
  $("am-ver").onclick=function(){
    var txt=$("am-t").value; filas=interpreta(txt.split(/\r?\n/).map(function(l){return l.split(/\t|;|,(?=[^@]*@)|,/);})); muestra();};
  $("am-f").onchange=function(){
    var f=this.files[0]; if(!f)return;
    var r=new FileReader();
    if(/\.xlsx$/i.test(f.name)){r.onload=function(){AxExcel.leer(r.result).then(function(t){filas=interpreta(t);muestra();}).catch(function(){aviso("am-msg","No se pudo leer el Excel.",true);});}; r.readAsArrayBuffer(f);}
    else{r.onload=function(){filas=interpreta(String(r.result).split(/\r?\n/).map(function(l){return l.split(/\t|;|,/);}));muestra();}; r.readAsText(f);}
  };
  $("am-go").onclick=function(){
    var b=this; b.disabled=true;
    api("/api/courses/"+c.code+"/alta",{filas:filas,group_id:$("am-g")?$("am-g").value||null:null}).then(function(r){
      recarga(); setTimeout(function(){aviso("al-msg",r.inscritos+" inscritos al momento · "+r.invitados+" entrarán al usar la app"+(r.errores.length?" · "+r.errores.length+" filas con errores":"")+".",false);},400);
    }).catch(function(er){b.disabled=false;aviso("am-msg",ERR(er),true);});
  };
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

/* ===================== PREGUNTAS DE UN CUESTIONARIO O CONVOCATORIA =====================
   Bloque común: de qué banco salen las preguntas, tema, dificultad,
   cuántas, tiempo, errores y fechas. */
function camposPreguntas(bancos,errDef){
  var errs=[["100","Sin límite: se responden todas"],["0","Ninguno: el primer fallo termina"],["1","1"],["2","2"],["3","3"],["5","5"]];
  return '<label>Preguntas<select id="q-bank">'+bancos.map(function(b){return '<option value="'+b.id+'">Banco: '+esc(b.name)+' ('+b.n+')</option>';}).join("")+
      '<option value="0">Cultura general de la plataforma</option></select></label>'+
    '<div class="rt-2"><label>Tema<select id="q-tema"><option value="">Todos</option></select></label>'+
    '<label>Dificultad<select id="q-level"></select></label></div>'+
    '<p class="fine" id="q-disp"></p>'+
    (window.AxAreas?'<div id="q-areas-b" hidden>'+AxAreas.html("q-areas")+'</div>':'')+
    '<div class="rt-2"><label>Número de preguntas<input type="number" id="q-n" min="1" max="100" value="10"></label>'+
    '<label>Tiempo por pregunta<select id="q-seg"><option value="10">10 s</option><option value="15">15 s</option><option value="20">20 s</option><option value="30" selected>30 s</option><option value="45">45 s</option><option value="60">60 s</option></select></label></div>'+
    '<label>Errores admitidos<select id="q-err">'+errs.map(function(e){return '<option value="'+e[0]+'"'+(e[0]===String(errDef)?' selected':'')+'>'+e[1]+'</option>';}).join("")+'</select></label>'+
    '<div class="rt-2"><label>Se abre<select id="q-ini"><option value="0">Ahora</option><option value="15">En 15 minutos</option><option value="60">En 1 hora</option><option value="1440">Mañana a esta hora</option><option value="x">Fecha y hora…</option></select></label>'+
    '<label>Dura<select id="q-dur"><option value="30">30 minutos</option><option value="60" selected>1 hora</option><option value="120">2 horas</option><option value="1440">1 día</option><option value="10080">1 semana</option><option value="x">Hasta fecha y hora…</option></select></label></div>'+
    '<div class="rt-2"><label id="q-ini-f-l" hidden>Apertura<input type="datetime-local" id="q-ini-f"></label><label id="q-fin-f-l" hidden>Cierre<input type="datetime-local" id="q-fin-f"></label></div>';
}
/* liga el bloque y devuelve una función que lee sus valores (null si las fechas no valen) */
function ligaPreguntas(){
  var info=null;
  function local(ms){var d=new Date(ms-new Date(ms).getTimezoneOffset()*60000);return d.toISOString().slice(0,16);}
  function niveles(){
    if(!$("q-bank"))return;                  /* ya se salió del formulario */
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
    $("q-disp").textContent=n+" pregunta"+(n===1?"":"s")+" disponible"+(n===1?"":"s")+" con ese tema y nivel"+(+$("q-n").value>n?": tendrá "+n+".":".");
  }
  function cargaBanco(){
    var b=+$("q-bank").value; info=null; $("q-tema").innerHTML='<option value="">Todos</option>';
    $("q-tema").disabled=!b;
    if($("q-areas-b")){$("q-areas-b").hidden=!!b; if(!b&&!$("q-areas").querySelector("[data-area]"))AxAreas.pinta($("q-areas"),[]);}
    if(!b){niveles();return;}
    api("/api/banks/"+b).then(function(r){
      if(!$("q-tema"))return;
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
  return function(){
    var ini=$("q-ini").value==="x"?new Date($("q-ini-f").value).getTime():Date.now()+(+$("q-ini").value)*60000;
    var fin=$("q-dur").value==="x"?new Date($("q-fin-f").value).getTime():ini+(+$("q-dur").value)*60000;
    if(isNaN(ini)||isNaN(fin))return null;
    var b=+$("q-bank").value, n=Math.max(1,Math.min(100,+$("q-n").value||10));
    /* las preguntas generales van en tandas fijas */
    if(!b&&[10,20,30,50,100].indexOf(n)<0){n=[10,20,30,50,100].filter(function(x){return x>=n;})[0]||100;}
    var err=+$("q-err").value; if(err===100)err=Math.max(n,10);
    return {bank_id:b||null,topic:$("q-tema").value,level:+$("q-level").value,max_questions:n,max_errors:err,
            seconds_per_q:+$("q-seg").value,math:!b,starts_at:ini,ends_at:fin,areas:!b&&window.AxAreas?AxAreas.lee($("q-areas")):[]};
  };
}

/* ===================== NUEVO CUESTIONARIO ===================== */
function crearCuestionario(c){
  vista={render:function(){crearCuestionario(c);}};
  pinta(atras("Volver al curso")+'<h3>Nuevo cuestionario</h3><p class="rt-meta">'+esc(c.name)+'</p>'+
    '<form class="rt-form" id="q-form">'+
    '<label>Nombre<input id="q-name" maxlength="60" required placeholder="Parcial 1 · Derivadas"></label>'+
    '<label>Parcial<input id="q-par" maxlength="40" list="q-pars" placeholder="Primer parcial"><datalist id="q-pars">'+PARCIALES.map(function(p){return '<option value="'+p+'">';}).join("")+'</datalist></label>'+
    '<label>Tipo<select id="q-modo"><option value="examen">Examen: un solo intento y nota al cierre</option><option value="practica">Práctica: intentos ilimitados y corrección al momento</option></select></label>'+
    ((c.groups||[]).length?'<label>Para<select id="q-grupo"><option value="">Todo el curso</option>'+c.groups.map(function(g){return '<option value="'+g.id+'">Grupo '+esc(g.name)+' ('+g.n+')</option>';}).join("")+'</select></label>':'')+
    camposPreguntas(c.banks||[],100)+
    '<label class="rt-check" id="q-explica-l" hidden><input type="checkbox" id="q-explica" checked> <span>✨ Explicación con IA en cada pregunta (plan Pro)</span></label>'+
    '<p class="fine" id="q-practica" hidden>En una práctica cada estudiante la repite las veces que quiera mientras esté abierta: cada intento trae preguntas al azar, ve al momento si acertó y la respuesta correcta, y en la libreta cuenta su mejor intento. No hay límite de errores.</p>'+
    '<p class="fine" id="q-examen">Cada estudiante responde una sola vez y recibe su propia selección al azar: si el banco tiene más preguntas de las que pides, a cada uno le pueden tocar preguntas distintas, siempre en otro orden y con las opciones barajadas. Las respuestas correctas se muestran al cierre.</p>'+
    '<div class="actions"><button class="primary" type="submit" id="q-go">Crear cuestionario</button></div><p class="msg" id="q-msg"></p></form>');
  $("au-back").onclick=function(){curso(c.code);};
  var lee=ligaPreguntas();
  var pro=false; estadoIA(c.org_id).then(function(p){pro=!!p.pro; $("q-explica-l")&&($("q-explica-l").hidden=!(pro&&$("q-modo").value==="practica"));});
  $("q-modo").onchange=function(){var pr=this.value==="practica"; $("q-practica").hidden=!pr; $("q-examen").hidden=pr; $("q-explica-l").hidden=!(pr&&pro);
    var le=$("q-err").closest("label"); if(le)le.hidden=pr; if(pr&&!$("q-par").value)$("q-par").value="Práctica";};
  $("q-form").onsubmit=function(e){
    e.preventDefault();
    var v=lee(); if(!v){aviso("q-msg","Revisa las fechas.",true);return;}
    $("q-go").disabled=true;
    api("/api/contests",Object.assign(v,{name:$("q-name").value,kind:"cuestionario",audience:"curso",course_code:c.code,partial:$("q-par").value,
      modo:$("q-modo").value,group_id:$("q-grupo")?$("q-grupo").value||null:null,explica:$("q-modo").value==="practica"&&pro&&$("q-explica").checked}))
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
      '<div class="actions au-acciones ia-acciones"><button class="ghost ia-btn" id="bk-ia">✨ Generar con IA</button>'+(b.questions.length?'<button class="ghost ia-btn" id="bk-iarev">✨ Revisar con IA</button>':'')+'</div>'+
      '<p class="fine" id="bk-plan"></p><div id="bk-zona"></div>';
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
    estadoIA(b.org_id).then(function(p){var e=$("bk-plan"); if(!e)return;
      e.innerHTML=p.pro?'✨ Plan Pro · quedan <b>'+p.disponibles+'</b> de '+p.cuota+' usos de IA este mes.':'✨ Generar y revisar preguntas con IA es parte del <b>plan Pro</b>.';});
    $("bk-ia").onclick=function(){iaGenera(b);};
    if($("bk-iarev"))$("bk-iarev").onclick=function(){iaRevisa(b);};
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
  }).catch(function(e){pinta(atras("Educativo")+'<p class="fine bad">'+esc(ERR(e))+'</p>');$("au-back").onclick=inicio;});
}
/* ===================== AYUDAS CON IA (plan Pro) ===================== */
var planesIA={};
function estadoIA(org){
  if(!org)return Promise.resolve({pro:false});
  return (planesIA[org]=planesIA[org]||api("/api/ia/estado?org="+org).catch(function(){delete planesIA[org];return {pro:false};}));
}
function sinPro(z){
  z.innerHTML='<div class="au-caja"><h4>✨ Ayudas con IA · plan Pro</h4><p>Con el plan Pro, la IA te ayuda a:</p><ul class="ia-lista">'+
    '<li><b>Generar preguntas desde un tema</b>, por ejemplo «Fotosíntesis, secundaria».</li><li><b>Generar preguntas desde tus apuntes</b>: pega un texto o sube un PDF o Word.</li>'+
    '<li><b>Revisar tu banco</b>: detecta preguntas ambiguas o con errores y propone correcciones.</li><li><b>Explicar las respuestas</b> en las prácticas de tus estudiantes.</li></ul>'+
    '<p class="fine">Siempre revisas lo que propone antes de guardarlo. Importar desde Excel sigue siendo gratis. Para activar el plan, escribe a la administración de la plataforma.</p>'+
    '<div class="actions"><button type="button" class="ghost" id="ia-cierra">Cerrar</button></div></div>';
  $("ia-cierra").onclick=function(){z.innerHTML="";};
}
function iaGenera(b){
  var z=$("bk-zona");
  estadoIA(b.org_id).then(function(p){
    if(!p.pro){sinPro(z);return;}
    z.innerHTML='<div class="au-caja"><h4>✨ Generar preguntas con IA</h4>'+
      '<div class="seg" role="radiogroup" id="ia-seg"><button type="button" role="radio" aria-checked="true" data-m="tema">Desde un tema</button><button type="button" role="radio" aria-checked="false" data-m="texto">Desde un texto o archivo</button></div>'+
      '<form class="rt-form" id="ia-f"><label id="ia-tema-l">Tema<input id="ia-tema" maxlength="300" placeholder="Fotosíntesis, nivel secundaria" style="text-transform:none;letter-spacing:0"></label>'+
      '<div id="ia-texto-l" hidden><label>Texto o apuntes<textarea id="ia-texto" rows="6" placeholder="Pega aquí el contenido…"></textarea></label>'+
      '<div class="actions au-acciones"><label class="ghost au-archivo">Adjuntar PDF, Word o TXT<input type="file" id="ia-file" accept=".pdf,.docx,.txt" hidden></label><span class="fine" id="ia-fn"></span></div></div>'+
      '<div class="rt-2"><label>Cuántas'+'<select id="ia-n"><option>5</option><option selected>10</option><option>15</option><option>20</option><option>30</option></select></label>'+
      '<label>Dificultad<select id="ia-niv"><option value="0">Variada</option><option value="1">Fácil</option><option value="2">Media</option><option value="3">Difícil</option></select></label></div>'+
      '<p class="fine">Gasta 1 de tus '+p.disponibles+' usos de este mes. Revisarás cada pregunta antes de guardarla.</p>'+
      '<div class="actions"><button type="button" class="ghost" id="ia-no">Cancelar</button><button type="submit" class="primary" id="ia-go">✨ Generar</button></div><p class="msg" id="ia-msg"></p></form></div>';
    z.scrollIntoView({behavior:"smooth",block:"start"});
    var modo="tema", pdf=null;
    panel.querySelectorAll("#ia-seg [data-m]").forEach(function(x){x.onclick=function(){modo=this.getAttribute("data-m");
      panel.querySelectorAll("#ia-seg [data-m]").forEach(function(y){y.setAttribute("aria-checked",String(y===x));});
      $("ia-tema-l").hidden=modo!=="tema"; $("ia-texto-l").hidden=modo!=="texto";};});
    $("ia-no").onclick=function(){z.innerHTML="";};
    $("ia-file").onchange=function(){
      var f=this.files[0]; if(!f)return; pdf=null; $("ia-fn").textContent="Leyendo «"+f.name+"»…";
      if(/\.pdf$/i.test(f.name)){ if(f.size>12*1024*1024){aviso("ia-msg",ERR({error:"ia_file_too_big"}),true);return;}
        var r=new FileReader(); r.onload=function(){pdf=String(r.result);$("ia-fn").textContent="PDF adjunto: "+f.name;}; r.readAsDataURL(f); }
      else if(/\.docx$/i.test(f.name))f.arrayBuffer().then(XL.textoDocx).then(function(t){$("ia-texto").value=t;$("ia-fn").textContent="Texto leído de "+f.name;}).catch(function(er){aviso("ia-msg",er.message,true);});
      else f.text().then(function(t){$("ia-texto").value=t;$("ia-fn").textContent="Texto leído de "+f.name;});
    };
    $("ia-f").onsubmit=function(e){e.preventDefault();
      var cuerpo={org_id:b.org_id,n:+$("ia-n").value,nivel:+$("ia-niv").value};
      if(modo==="tema")cuerpo.tema=$("ia-tema").value; else{cuerpo.texto=$("ia-texto").value; if(pdf)cuerpo.pdf=pdf;}
      $("ia-go").disabled=true; aviso("ia-msg","Generando preguntas… puede tardar hasta un minuto.");
      api("/api/ia/preguntas",cuerpo).then(function(r){
        delete planesIA[b.org_id];
        importador(b,r.items,"✨ Preguntas propuestas por la IA · revísalas antes de importar");
        estadoIA(b.org_id).then(function(p2){var e2=$("bk-plan"); if(e2&&p2.pro)e2.innerHTML='✨ Plan Pro · quedan <b>'+p2.disponibles+'</b> de '+p2.cuota+' usos de IA este mes.';});
      }).catch(function(er){$("ia-go").disabled=false;aviso("ia-msg",ERR(er),true);});
    };
  });
}
function iaRevisa(b){
  var z=$("bk-zona");
  estadoIA(b.org_id).then(function(p){
    if(!p.pro){sinPro(z);return;}
    if(!confirm("La IA revisará hasta 80 preguntas de este banco y propondrá correcciones. Gasta 1 de tus "+p.disponibles+" usos del mes. ¿Seguir?"))return;
    z.innerHTML='<div class="au-caja"><h4>✨ Revisión con IA</h4><p class="fine">Revisando… puede tardar hasta un minuto.</p></div>';
    api("/api/ia/revisar",{bank_id:b.id}).then(function(r){
      delete planesIA[b.org_id];
      var porId={}; b.questions.forEach(function(q){porId[q.id]=q;});
      var sug=r.sugerencias.filter(function(x){return porId[x.id];});
      z.innerHTML='<div class="au-caja"><h4>✨ Revisión con IA</h4><p class="fine">'+r.revisadas+' preguntas revisadas · '+(sug.length?sug.length+' con algo que mejorar.':'no encontró problemas.')+' Aplica solo lo que te convenza.</p>'+
        sug.map(function(x,i){var q=porId[x.id], o=q.opts.slice(), c=o.splice(q.answer,1)[0];
          var nueva={q:x.pregunta||q.q,correcta:x.correcta||c,otras:x.incorrectas||o,nivel:x.nivel||q.level,tema:x.tema||q.topic||""};
          return '<div class="ia-sug" id="ia-s'+i+'"><p class="ia-prob">⚠ '+esc(x.problema)+'</p>'+
            '<div class="ia-antes"><small>Ahora</small><b>'+esc(q.q)+'</b><span>✓ '+esc(c)+' · '+esc(o.join(" · "))+'</span></div>'+
            '<div class="ia-despues"><small>Propuesta</small><b>'+esc(nueva.q)+'</b><span>✓ '+esc(nueva.correcta)+' · '+esc(nueva.otras.join(" · "))+'</span></div>'+
            '<div class="actions"><button type="button" class="primary au-mini" data-ap="'+i+'">Aplicar</button><button type="button" class="ghost au-mini" data-desc="'+i+'">Descartar</button></div></div>';}).join("")+
        '<div class="actions"><button type="button" class="ghost" id="ia-fin">Terminar</button></div><p class="msg" id="ia-msg"></p></div>';
      $("ia-fin").onclick=function(){banco(b.id);};
      panel.querySelectorAll("[data-desc]").forEach(function(x){x.onclick=function(){$("ia-s"+this.getAttribute("data-desc")).remove();};});
      panel.querySelectorAll("[data-ap]").forEach(function(x){x.onclick=function(){
        var i=+this.getAttribute("data-ap"), s=sug[i], q=porId[s.id], o=q.opts.slice(), c=o.splice(q.answer,1)[0], btn=this;
        var opts=[s.correcta||c].concat(s.incorrectas||o); btn.disabled=true;
        api("/api/banks/"+b.id+"/questions/"+s.id,{q:s.pregunta||q.q,opts:opts,answer:0,level:s.nivel||q.level,topic:s.tema||q.topic||""})
          .then(function(){var d=$("ia-s"+i); d.classList.add("hecha"); d.querySelector(".actions").innerHTML='<p class="fine ok">Aplicada.</p>';})
          .catch(function(er){btn.disabled=false;aviso("ia-msg",ERR(er)+(er.errores?" "+er.errores.join(" "):""),true);});};});
    }).catch(function(er){z.innerHTML='<div class="au-caja"><p class="fine bad">'+esc(ERR(er))+'</p></div>';});
  });
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
function importador(b,iniciales,titulo){
  var z=$("bk-zona");
  z.innerHTML='<div class="au-caja"><h4>Importar preguntas</h4><div id="im-in">'+
    '<p class="fine">Sube un Excel (.xlsx) o un CSV, o pega aquí filas copiadas de Excel o texto con opciones A) B) C) y la línea ANSWER: con la letra correcta. Antes de guardar verás cada pregunta revisada.</p>'+
    '<div class="actions au-acciones"><label class="ghost au-archivo">Elegir archivo<input type="file" id="im-f" accept=".xlsx,.csv,.txt" hidden></label>'+
    '<button type="button" class="ghost au-mini" id="im-ej1">Ejemplo de texto</button><button type="button" class="ghost au-mini" id="im-ej2">Ejemplo de tabla</button></div>'+
    '<textarea id="im-t" rows="8" placeholder="¿Cuál es la derivada de x²?\nA) 2x\nB) x\nC) x²/2\nANSWER: A\nNIVEL: 2\nTEMA: Derivadas"></textarea>'+
    '<div class="actions"><button type="button" class="ghost" id="im-no">Cancelar</button><button type="button" class="primary" id="im-rev">Revisar</button></div></div>'+
    '<p class="msg" id="im-msg"></p><div id="im-prev"></div></div>';
  z.scrollIntoView({behavior:"smooth",block:"start"});
  $("im-no").onclick=function(){z.innerHTML="";};
  $("im-ej1").onclick=function(){$("im-t").value=BF.EJEMPLO_TEXTO;};
  $("im-ej2").onclick=function(){$("im-t").value=BF.PLANTILLA.map(function(f){return f.join("\t");}).join("\n");};
  $("im-rev").onclick=function(){revisa(BF.desdeTexto($("im-t").value));};
  if(iniciales){ var h4=z.querySelector("h4"); if(h4&&titulo)h4.textContent=titulo; $("im-in").hidden=true;
    $("im-prev").insertAdjacentHTML("afterend",'<div class="actions"><button type="button" class="ghost" id="im-no2">Descartar</button></div>');
    $("im-no2").onclick=function(){z.innerHTML="";}; revisa(iniciales); }
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

/* ===================== EMPRESAS Y EVENTOS ===================== */
function inicioEmpresas(){
  vista={render:inicioEmpresas}; $("hdr").textContent="Empresas";
  var u=user();
  var cab='<h3>Empresas y eventos</h3><p>Para empresas, marcas, comunidades y eventos: tu página con logo y color, convocatorias de trivia con premio que la gente abre desde un QR '+
    'y juega sin trámites (con Google o con su teléfono o correo verificado), bancos de preguntas propios y métricas de participación. <a href="#" class="guia-link" data-guia="empresas">¿Cómo funciona?</a></p>';
  function directorio(){
    api("/api/brands").then(function(r){
      var d=$("em-dir"); if(!d)return;
      d.innerHTML=r.brands.length?r.brands.map(function(b){
        return '<button type="button" class="rt-card mc-tarjeta" data-slug="'+esc(b.slug)+'" style="--marca:'+esc(b.color||"var(--ink)")+'">'+
          '<span class="mc-logo">'+(b.logo?'<img src="'+esc(b.logo)+'" alt="">':'<i>'+esc(b.name.charAt(0))+'</i>')+'</span>'+
          '<span class="mc-t"><b>'+esc(b.name)+'</b><small>'+esc(b.tagline||TIPOS[b.kind]||"")+'</small></span>'+
          (b.open?'<span class="chip activo">'+b.open+' abierta'+(b.open>1?'s':'')+'</span>':'')+'</button>';}).join(""):'<p class="fine">Todavía no hay marcas publicadas.</p>';
      var bs=d.querySelectorAll("[data-slug]"),i; for(i=0;i<bs.length;i++)bs[i].onclick=function(){AxMarca.ver(this.getAttribute("data-slug"));};
    }).catch(function(){var d=$("em-dir");if(d)d.innerHTML='<p class="fine">No se pudo cargar.</p>';});
  }
  if(!u||u.guest){
    pinta(cab+(u?'<p class="fine">Participas como invitado. Para registrar tu empresa, entra con Google.</p>':
      (window.AxAccount&&AxAccount.configurado()?'<div class="actions"><button class="primary" id="em-login">Entrar con Google para registrar mi empresa</button></div>':''))+
      '<h4>Marcas con convocatorias</h4><div id="em-dir"><p class="fine">Cargando…</p></div>');
    if($("em-login"))$("em-login").onclick=function(){AxAccount.abrirCuenta();};
    directorio(); return;
  }
  pinta(cab+'<p class="fine">Cargando…</p>');
  api("/api/orgs").then(function(r){
    var mias=r.orgs.filter(function(o){return !academica(o.kind);});
    var h=cab+'<h4>Tus empresas y comunidades</h4>'+
      (mias.length?mias.map(function(o){
        return '<button type="button" class="rt-card" data-org="'+o.id+'"><span class="rt-card-top"><b>'+esc(o.name)+'</b>'+chipEstado(o.status)+'</span>'+
          '<small>'+esc(TIPOS[o.kind]||o.kind)+' · '+esc(nombreRol(o.role,o.kind))+'</small></button>';}).join(""):
        '<p class="fine">Todavía no administras ninguna. Regístrala o pide a la administración de la plataforma que te dé de alta.</p>')+
      '<div class="actions"><button class="ghost" id="em-nueva">Registrar una empresa o comunidad</button></div>'+
      (r.platform_admin?'<div class="actions"><button class="ghost" id="au-plat">Administración de la plataforma'+(r.pending_orgs?' · '+r.pending_orgs+' pendiente'+(r.pending_orgs>1?'s':''):'')+'</button></div>':'')+
      '<h4>Marcas con convocatorias</h4><div id="em-dir"><p class="fine">Cargando…</p></div>';
    pinta(h);
    var bs=panel.querySelectorAll("[data-org]"),i; for(i=0;i<bs.length;i++)bs[i].onclick=function(){org(this.getAttribute("data-org"));};
    $("em-nueva").onclick=crearOrg;
    if($("au-plat"))$("au-plat").onclick=function(){plataforma();};
    directorio();
  }).catch(function(e){
    if(e&&e.error==="profile_required"){
      pinta(cab+'<p>Primero completa tu registro: fecha de nacimiento y aceptación de términos y privacidad.</p><div class="actions"><button class="primary" id="au-reg">Completar mi registro</button></div>');
      $("au-reg").onclick=function(){AxRegistro.asegura().then(function(ok){if(ok)inicioEmpresas();});};
      return;
    }
    pinta(cab+'<p class="fine bad">'+esc(ERR(e))+'</p>');
  });
}

/* convocatorias de la institución o empresa */
function enlaceConcurso(code){return location.origin+location.pathname+"?concurso="+code;}
function enlaceMarca(slug){return location.origin+location.pathname+"?marca="+slug;}
function qrConvocatoria(o,c){AxQR.abre({url:enlaceConcurso(c.code),titulo:c.name,subtitulo:c.prize?"Premio: "+c.prize:"",marca:o.name,
  color:o.brand&&o.brand.color,logo:o.brand&&o.brand.logo,directo:true});}
function tabConvocatorias(o){
  var t=$("au-tab"); t.innerHTML='<p class="fine">Cargando…</p>';
  api("/api/orgs/"+o.id+"/contests").then(function(r){
    var h="";
    if(o.status!=="activa")h+='<p class="rt-hoy">Las convocatorias se abren cuando la institución esté aprobada.</p>';
    else h+='<div class="actions"><button class="primary" id="cv-nueva">Nueva convocatoria</button></div>';
    h+=o.brand?'<div class="rt-code"><span>Tu página</span><b class="au-codigo">'+esc(o.brand.slug)+'</b><button type="button" class="ghost" id="cv-ver">Ver</button>'+
        '<button type="button" class="ghost" id="cv-qrp">QR de la página</button></div>':
      (o.can.admin?'<p class="fine">Configura tu marca en <a href="#" id="cv-marca">'+(academica(o.kind)?"Ajustes":"Marca y ajustes")+'</a> para tener página propia con tus convocatorias y su QR.</p>':'');
    h+=r.contests.length?r.contests.map(function(c){
      return '<div class="au-conv"><button type="button" class="rt-card" data-conv="'+c.code+'"><span class="rt-card-top"><b>'+esc(c.name)+'</b>'+
          '<span class="chip '+(c.state==="abierto"?"activo":c.state)+'">'+({pronto:"Pronto",abierto:"Abierta",terminado:"Cerrada"}[c.state])+'</span></span>'+
          '<small>'+({publico:"Pública",enlace:"Con enlace o QR",org:"Solo miembros"}[c.audience]||"")+(c.guests?' · admite invitados':'')+
          (c.prize?' · 🏆 '+esc(c.prize):'')+' · '+c.registered+' inscritos · '+c.played+' jugaron'+(c.mine?'':' · de '+esc(c.owner_name))+'</small></button>'+
        (c.state!=="terminado"?'<button type="button" class="ghost au-mini" data-qr="'+c.code+'">QR</button>':'')+'</div>';
    }).join(""):'<p class="fine">Todavía no hay convocatorias. Crea la primera a partir de un banco de preguntas o con las preguntas generales de la plataforma.</p>';
    t.innerHTML=h;
    if($("cv-nueva"))$("cv-nueva").onclick=function(){crearConvocatoria(o);};
    if($("cv-ver"))$("cv-ver").onclick=function(){AxMarca.ver(o.brand.slug);};
    if($("cv-qrp"))$("cv-qrp").onclick=function(){AxQR.abre({url:enlaceMarca(o.brand.slug),titulo:o.name,subtitulo:"Convocatorias",marca:o.name,color:o.brand.color,logo:o.brand.logo});};
    if($("cv-marca"))$("cv-marca").onclick=function(e){e.preventDefault();org(o.id,"ajustes");};
    var bs=t.querySelectorAll("[data-conv]"),i; for(i=0;i<bs.length;i++)bs[i].onclick=function(){aConcurso(this.getAttribute("data-conv"));};
    bs=t.querySelectorAll("[data-qr]"); for(i=0;i<bs.length;i++)bs[i].onclick=function(){var k=this.getAttribute("data-qr");qrConvocatoria(o,r.contests.filter(function(c){return c.code===k;})[0]);};
  }).catch(function(e){t.innerHTML='<p class="fine bad">'+esc(ERR(e))+'</p>';});
}
function crearConvocatoria(o){
  vista={render:function(){crearConvocatoria(o);}};
  pinta('<p class="fine">Cargando…</p>');
  api("/api/orgs/"+o.id+"/banks").then(function(r){
    var bancos=r.banks.map(function(b){return {id:b.id,name:b.name,n:b.questions};});
    pinta(atras(o.name)+'<h3>Nueva convocatoria</h3><p class="rt-meta">'+esc(o.name)+'</p>'+
      '<form class="rt-form" id="q-form">'+
      '<label>Nombre<input id="q-name" maxlength="60" required placeholder="Trivia del aniversario"></label>'+
      '<label>Premio (opcional)<input id="q-prize" maxlength="200" placeholder="Un café gratis para el ganador"></label>'+
      '<label>Descripción (opcional)<input id="q-desc" maxlength="300" placeholder="Cómo se entrega el premio, dónde, bases…"></label>'+
      camposPreguntas(bancos,3)+
      '<label>Quién puede participar<select id="q-aud"><option value="publico">Cualquiera: aparece en tu página y en Concursos</option>'+
        '<option value="enlace">Solo quien tenga el enlace o el QR</option><option value="org">Solo los miembros de '+esc(o.name)+'</option></select></label>'+
      '<label class="rt-check"><input type="checkbox" id="q-inv" checked> <span>Admitir invitados: participan sin cuenta, con su teléfono o correo verificado por código</span></label>'+
      '<p class="fine">Una sola participación por persona (por cuenta de Google o por teléfono o correo verificado). Los menores de 18 años solo entran en convocatorias con premio si la institución confirma, en Miembros, el consentimiento de su tutor.</p>'+
      '<div class="actions"><button class="primary" type="submit" id="q-go">Publicar convocatoria</button></div><p class="msg" id="q-msg"></p></form>');
    $("au-back").onclick=function(){org(o.id,"convocatorias");};
    $("q-aud").onchange=function(){$("q-inv").disabled=this.value==="org";if(this.value==="org")$("q-inv").checked=false;};
    var lee=ligaPreguntas();
    $("q-form").onsubmit=function(e){
      e.preventDefault();
      var v=lee(); if(!v){aviso("q-msg","Revisa las fechas.",true);return;}
      $("q-go").disabled=true;
      api("/api/contests",Object.assign(v,{name:$("q-name").value,prize:$("q-prize").value,description:$("q-desc").value,kind:"concurso",
        audience:$("q-aud").value,org_id:o.id,guests:$("q-inv").checked}))
        .then(function(x){aConcurso(x.code);})
        .catch(function(er){$("q-go").disabled=false;aviso("q-msg",ERR(er),true);});
    };
  }).catch(function(e){pinta(atras(o.name)+'<p class="fine bad">'+esc(ERR(e))+'</p>');$("au-back").onclick=function(){org(o.id,"convocatorias");};});
}

/* ---------- métricas ---------- */
function pl(n,uno,varios){return n===1?uno:varios;}
function kpi(v,t,s){return '<div class="mt-kpi"><b>'+esc(v)+'</b><span>'+esc(t)+'</span>'+(s?'<small>'+esc(s)+'</small>':'')+'</div>';}
/* barras de 30 días: una sola serie, con detalle al pasar el dedo o el ratón y la tabla debajo */
function barras(titulo,dias,valor,detalle){
  var max=Math.max.apply(null,dias.map(valor).concat([1])), total=dias.reduce(function(a,d){return a+valor(d);},0);
  function dia(s){var p=s.split("-");return +p[2]+"/"+(+p[1]);}
  return '<figure class="mt-barras"><figcaption>'+esc(titulo)+' <small>'+total+' en 30 días</small></figcaption>'+
    '<div class="mt-plot" role="img" aria-label="'+esc(titulo)+': '+total+' en 30 días">'+dias.map(function(d){var v=valor(d);
      return '<span class="mt-col" tabindex="0" data-tip="'+esc(dia(d.day)+": "+(detalle?detalle(d):v))+'"><i style="height:'+(v?Math.max(4,Math.round(100*v/max)):0)+'%"></i></span>';}).join("")+'</div>'+
    '<div class="mt-eje"><span>'+dia(dias[0].day)+'</span><span>'+max+' máx.</span><span>'+dia(dias[dias.length-1].day)+'</span></div>'+
    '<details class="mt-tabla"><summary>Ver como tabla</summary><table class="tabla"><thead><tr><th>Día</th><th>Valor</th></tr></thead><tbody>'+
      dias.filter(function(d){return valor(d);}).map(function(d){return '<tr><td>'+dia(d.day)+'</td><td>'+esc(detalle?detalle(d):valor(d))+'</td></tr>';}).join("")+
    '</tbody></table></details></figure>';
}
function tabMetricas(o){
  var t=$("au-tab"); t.innerHTML='<p class="fine">Cargando…</p>';
  api("/api/orgs/"+o.id+"/metrics").then(function(m){
    var conv=m.contests.concurso||{total:0,open:0}, cues=m.contests.cuestionario||{total:0,open:0};
    var h='<div class="mt-kpis">'+
      kpi(m.people,pl(m.people,"persona","personas"),"participaron en algo")+kpi(m.guests,pl(m.guests,"invitado","invitados"),"sin cuenta, verificados")+
      kpi(m.plays,pl(m.plays,"partida","partidas"),m.finished+pl(m.finished," terminada"," terminadas"))+kpi(m.avg_correct===null?"—":m.avg_correct,"aciertos de media","por partida")+
      kpi(conv.total,pl(conv.total,"convocatoria","convocatorias"),conv.open+pl(conv.open," abierta"," abiertas"))+(academica(o.kind)?kpi(cues.total,pl(cues.total,"cuestionario","cuestionarios"),cues.open+pl(cues.open," abierto"," abiertos")):"")+
      kpi(m.marketing,pl(m.marketing,"acepta contacto","aceptan contacto"),"de "+m.consents+pl(m.consents," que respondió"," que respondieron"))+kpi(m.questions,pl(m.questions,"pregunta","preguntas"),m.banks+pl(m.banks," banco"," bancos"))+
      (m.rooms?kpi(m.rooms,pl(m.rooms,"sala de juego","salas de juego"),(m.room_players||0)+" participaciones"):"")+'</div>'+
      barras("Inscripciones por día",m.daily,function(d){return d.n;});
    if(m.top.length){
      h+='<h4>Con más participación</h4><div class="tabla-wrap"><table class="tabla"><thead><tr><th>Convocatoria</th><th>Tipo</th><th>Estado</th><th>Inscritos</th><th>Jugaron</th></tr></thead><tbody>'+
        m.top.map(function(c){return '<tr class="clic" data-quiz="'+c.code+'"><td><b>'+esc(c.name)+'</b></td><td>'+(c.kind==="cuestionario"?"Cuestionario":"Convocatoria")+'</td>'+
          '<td>'+({pronto:"Próxima",abierto:"Abierta",terminado:"Cerrada"}[c.state])+'</td><td>'+c.registered+'</td><td>'+c.played+'</td></tr>';}).join("")+'</tbody></table></div>';
    }
    h+='<p class="fine">Miembros: '+Object.keys(m.members).map(function(k){return m.members[k]+' '+nombreRol(k,o.kind).toLowerCase();}).join(", ")+
      (academica(o.kind)?' · cursos: '+m.active_courses+' activos de '+m.courses:'')+'.</p>'+
      '<div class="actions"><button class="ghost" id="mt-xlsx">Exportar participantes a Excel</button></div><p class="msg" id="mt-msg"></p>';
    t.innerHTML=h;
    var bs=t.querySelectorAll("[data-quiz]"),i; for(i=0;i<bs.length;i++)bs[i].onclick=function(){aConcurso(this.getAttribute("data-quiz"));};
    $("mt-xlsx").onclick=function(){
      aviso("mt-msg","Preparando…");
      api("/api/orgs/"+o.id+"/participants").then(function(r){
        var f=[["Nombre","Correo","Teléfono","Tipo","Verificación","Acepta contacto","Convocatorias","Partidas","Mejor resultado","Última actividad"]];
        r.people.forEach(function(p){f.push([p.name,p.email,p.phone,p.type==="invitado"?"Invitado":"Google",p.verified_by==="prueba"?"Código de prueba":p.type==="invitado"?"Código":"Google",
          p.marketing===true?"Sí":p.marketing===false?"No":"",p.contests,p.played,p.best,p.last?new Date(p.last).toLocaleString("es"):""]);});
        XL.descarga(XL.escribir([{nombre:"Participantes",filas:f,anchos:[28,30,18,10,16,14,12,10,14,20]}]),"Participantes "+o.name+".xlsx");
        aviso("mt-msg",r.people.length+" participante"+(r.people.length===1?"":"s")+" exportado"+(r.people.length===1?"":"s")+". Contacta solo a quien aceptó.");
      }).catch(function(er){aviso("mt-msg",ERR(er),true);});
    };
  }).catch(function(e){t.innerHTML='<p class="fine bad">'+esc(ERR(e))+'</p>';});
}

/* ---------- marca ---------- */
/* el logo se reduce en el navegador a 256 px como máximo antes de guardarlo */
function reduceLogo(file){
  return new Promise(function(resolve,reject){
    var r=new FileReader();
    r.onload=function(){var im=new Image();
      im.onload=function(){
        var k=Math.min(1,256/Math.max(im.width,im.height)), cv=document.createElement("canvas");
        cv.width=Math.max(1,Math.round(im.width*k)); cv.height=Math.max(1,Math.round(im.height*k));
        cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);
        var d=cv.toDataURL("image/png"); if(d.length>110000)d=cv.toDataURL("image/jpeg",.85);
        resolve(d);
      };
      im.onerror=function(){reject(new Error("No se pudo leer la imagen."));}; im.src=r.result;};
    r.onerror=function(){reject(new Error("No se pudo leer la imagen."));}; r.readAsDataURL(file);
  });
}
function editorMarca(o){
  var z=$("a-marca");
  api("/api/orgs/"+o.id+"/brand").then(function(r){
    var b=r.brand||{slug:r.suggested_slug,color:"#1c1c1e",logo:"",tagline:"",description:"",website:""}, logo=b.logo||"";
    z.innerHTML='<form class="rt-form" id="mb-form">'+
      '<div class="mb-prev" id="mb-prev"></div>'+
      '<label>Dirección de la página<span class="mb-url">'+esc(location.host+location.pathname)+'?marca=<input id="mb-slug" maxlength="40" value="'+esc(b.slug)+'"></span></label>'+
      '<div class="rt-2"><label>Color<input type="color" id="mb-color" value="'+esc(b.color||"#1c1c1e")+'"></label>'+
      '<div class="mb-campo"><span>Logo</span><span class="mb-logo-acc"><label class="ghost au-archivo">Subir imagen<input type="file" id="mb-logo" accept="image/png,image/jpeg,image/webp" hidden></label>'+
        '<button type="button" class="ghost au-mini" id="mb-sinlogo">Quitar</button></span></div></div>'+
      '<label>Lema<input id="mb-tag" maxlength="80" value="'+esc(b.tagline)+'" placeholder="El mejor café del barrio"></label>'+
      '<label>Descripción<textarea id="mb-desc" maxlength="400" rows="3" placeholder="Qué hacéis y qué ganan quienes participan">'+esc(b.description)+'</textarea></label>'+
      '<label>Sitio web (opcional)<input id="mb-web" maxlength="200" value="'+esc(b.website)+'" placeholder="https://"></label>'+
      '<div class="actions"><button class="primary" type="submit" id="mb-go">Guardar marca</button>'+(r.brand?'<button type="button" class="ghost" id="mb-ver">Ver página</button>':'')+'</div>'+
      '<p class="msg" id="mb-msg"></p></form>';
    function prev(){
      var c=$("mb-color").value;
      $("mb-prev").innerHTML='<div class="mc-cab mini" style="--marca:'+esc(c)+'"><span class="mc-logo grande">'+(logo?'<img src="'+esc(logo)+'" alt="">':'<i>'+esc(o.name.charAt(0))+'</i>')+'</span>'+
        '<div><h2>'+esc(o.name)+'</h2><p>'+esc($("mb-tag").value)+'</p></div></div>';
    }
    prev(); $("mb-color").oninput=prev; $("mb-tag").oninput=prev;
    $("mb-logo").onchange=function(){var f=this.files[0]; if(!f)return;
      reduceLogo(f).then(function(d){logo=d;prev();aviso("mb-msg","Logo listo: guarda para publicarlo.");}).catch(function(er){aviso("mb-msg",er.message,true);});};
    $("mb-sinlogo").onclick=function(){logo="";prev();};
    if($("mb-ver"))$("mb-ver").onclick=function(){AxMarca.ver(b.slug);};
    $("mb-form").onsubmit=function(e){e.preventDefault(); $("mb-go").disabled=true;
      api("/api/orgs/"+o.id+"/brand",{slug:$("mb-slug").value,color:$("mb-color").value,logo:logo,tagline:$("mb-tag").value,description:$("mb-desc").value,website:$("mb-web").value})
        .then(function(x){org(o.id,"ajustes","Marca guardada: tu página es ?marca="+x.slug);})
        .catch(function(er){$("mb-go").disabled=false;aviso("mb-msg",ERR(er),true);});};
  }).catch(function(e){z.innerHTML='<p class="fine bad">'+esc(ERR(e))+'</p>';});
}

/* ===================== PLATAFORMA =====================
   Resumen con métricas globales, instituciones (aprobar, suspender, dar
   de alta con su administración) y usuarios (buscar, filtrar, bloquear). */
function plataforma(tab,filtro){
  tab=tab||"resumen"; filtro=filtro||{};
  vista={render:function(){plataforma(tab,filtro);}};
  pinta(atras(nombreSeccion())+'<h3>Administración de la plataforma</h3>'+tabs([["resumen","Resumen"],["orgs","Instituciones"],["usuarios","Usuarios"]],tab)+'<div id="au-tab"><p class="fine">Cargando…</p></div>');
  $("au-back").onclick=inicio;
  ligaTabs(function(t){plataforma(t);});
  var t=$("au-tab");
  api("/api/admin/summary").then(function(r){
    if(tab==="resumen")platResumen(t,r);
    else if(tab==="orgs")platOrgs(t,r);
    else platUsuarios(t,r,filtro);
  }).catch(function(e){t.innerHTML='<p class="fine bad">'+esc(ERR(e))+'</p>';});
}
function platResumen(t,r){
  var k=r.orgs_by_kind, pend=r.orgs.filter(function(o){return o.status==="pendiente";}).length;
  var porTipo=Object.keys(k).map(function(x){return (TIPOS[x]||x)+": "+k[x].total;}).join(" · ")||"ninguna";
  t.innerHTML=(r.verify_mode==="prueba"?'<p class="rt-hoy">Verificación de invitados en <b>modo de pruebas</b>: los códigos se muestran en pantalla y no se envía nada. '+
      'Cambia VERIFY_MODE a "real" cuando conectes el servicio de SMS o correo.</p>':'')+
    '<div class="mt-kpis">'+kpi(r.users,pl(r.users,"cuenta de Google","cuentas de Google"))+kpi(r.guests,pl(r.guests,"invitado","invitados"),(r.guests_by.prueba||0)+" con código de prueba")+
      kpi(r.orgs.length,pl(r.orgs.length,"institución","instituciones"),pend?pend+pl(pend," pendiente"," pendientes"):"")+kpi(r.open_contests,pl(r.open_contests,"abierta ahora","abiertas ahora"),"de "+r.contests+" en total")+
      kpi(r.entries.week,pl(r.entries.week,"inscripción","inscripciones"),"últimos 7 días")+kpi(r.entries.month,pl(r.entries.month,"inscripción","inscripciones"),"últimos 30 días")+kpi(r.blocked,pl(r.blocked,"bloqueado","bloqueados"))+
      (r.rooms?kpi(r.rooms.month,pl(r.rooms.month,"sala de juego","salas de juego"),"últimos 30 días · "+r.rooms.total+" en total"):"")+'</div>'+
    '<p class="fine">Por tipo: '+esc(porTipo)+'.</p>'+
    barras("Usuarios nuevos por día",r.daily,function(d){return d.google+d.guests;},function(d){return (d.google+d.guests)+" ("+d.google+" Google, "+d.guests+" invitados)";});
}
function platOrgs(t,r){
  t.innerHTML='<details class="au-nuevo"><summary>Dar de alta una institución o empresa</summary><form class="rt-form" id="po-form">'+
      '<label>Nombre<input id="po-name" maxlength="90" required></label>'+
      '<div class="rt-2"><label>Tipo<select id="po-kind">'+Object.keys(TIPOS).map(function(k){return '<option value="'+k+'"'+(k==="empresa"?' selected':'')+'>'+TIPOS[k]+'</option>';}).join("")+'</select></label>'+
      '<label>Correo de su administración<input id="po-email" type="email" placeholder="responsable@empresa.com"></label></div>'+
      '<p class="fine">Queda activa al momento. Si esa persona ya tiene cuenta, es administradora ya; si no, lo será en cuanto entre con Google con ese correo.</p>'+
      '<div class="actions"><button class="primary" type="submit" id="po-go">Dar de alta</button></div><p class="msg" id="po-msg"></p></form></details>'+
    (r.orgs.length?r.orgs.map(function(o){
      return '<div class="po-bloque"><div class="au-fila po-org"><div><b>'+esc(o.name)+'</b> '+chipEstado(o.status)+' <span data-planchip="'+o.id+'"></span>'+
        (o.admins?'':' <span class="chip pronto">Sin administración</span>')+
        '<small>'+esc(TIPOS[o.kind]||o.kind)+' · '+o.members+' miembro'+(o.members===1?'':'s')+' · '+o.admins+' admin. · '+o.contests+' convocatorias y cuestionarios · '+
          o.people+' participante'+(o.people===1?'':'s')+(o.last_activity?' · última actividad '+fecha(o.last_activity):'')+(o.slug?' · ?marca='+esc(o.slug):'')+'</small>'+
        (o.invites.length?'<small>Altas pendientes: '+o.invites.map(function(i){return esc(i.email)+' ('+esc(nombreRol(i.role,o.kind))+')';}).join(", ")+'</small>':'')+'</div>'+
        (o.status!=="activa"?'<button type="button" class="primary au-mini" data-est="activa" data-id="'+o.id+'">Aprobar</button>':'')+
        (o.status!=="suspendida"?'<button type="button" class="ghost au-mini" data-est="suspendida" data-id="'+o.id+'">Suspender</button>':'')+
        '<button type="button" class="primary au-mini" data-adm="'+o.id+'" aria-expanded="false">Administración</button>'+
        '<button type="button" class="ghost au-mini" data-met="'+o.id+'">Métricas</button>'+
        '<button type="button" class="ghost au-mini" data-usr="'+o.id+'">Usuarios</button>'+
        '<button type="button" class="ghost au-mini" data-plan="'+o.id+'">Plan</button></div>'+
        '<div class="po-adm" id="po-adm-'+o.id+'" hidden></div><div class="po-adm" id="po-plan-'+o.id+'" hidden></div></div>';
    }).join(""):'<p class="fine">No hay instituciones.</p>')+'<p class="msg" id="po-res"></p>';
  $("po-form").onsubmit=function(e){e.preventDefault(); $("po-go").disabled=true;
    api("/api/admin/orgs",{name:$("po-name").value,kind:$("po-kind").value,admin_email:$("po-email").value}).then(function(x){
      plataforma("orgs"); setTimeout(function(){aviso("po-res",x.admin&&x.admin.invited?"Alta hecha. La administración quedará asignada cuando esa persona entre con Google.":"Alta hecha.");},400);
    }).catch(function(er){$("po-go").disabled=false;aviso("po-msg",ERR(er),true);});};
  /* plan Pro y cuota de IA de cada institución */
  var PL={planes:{}};
  function chipPlan(id){var p=PL.planes[id]; return p&&p.pro?'<span class="chip activo">Pro · '+p.usados+'/'+p.cuota+' IA</span>':'<span class="chip">Gratis</span>';}
  api("/api/admin/planes").then(function(x){PL=x; t.querySelectorAll("[data-planchip]").forEach(function(e){e.innerHTML=chipPlan(e.getAttribute("data-planchip"));});
    if(!x.ia)aviso("po-res","La IA no está configurada: añade en Cloudflare los Secrets ANTHROPIC_API_KEY y AI_MODEL para que funcionen las ayudas del plan Pro.",true);}).catch(function(){});
  t.querySelectorAll("[data-plan]").forEach(function(btn){btn.onclick=function(){
    var id=this.getAttribute("data-plan"), z=$("po-plan-"+id); z.hidden=!z.hidden; if(z.hidden)return;
    var p=PL.planes[id]||{plan:"gratis",cuota:100,hasta:null}, hasta=p.hasta?new Date(p.hasta).toISOString().slice(0,10):"";
    z.innerHTML='<form class="rt-form po-planf"><div class="rt-2"><label>Plan<select name="plan"><option value="gratis">Gratis</option><option value="pro"'+(p.plan==="pro"?' selected':'')+'>Pro (con IA)</option></select></label>'+
      '<label>Usos de IA al mes<input name="cuota" type="number" min="0" max="100000" value="'+(p.cuota||100)+'"></label></div>'+
      '<label>Válido hasta (opcional)<input name="hasta" type="date" value="'+hasta+'"></label>'+
      '<p class="fine">Cada generación de preguntas, revisión del banco o tanda de explicaciones gasta un uso. Este mes lleva '+(p.usados||0)+'.</p>'+
      '<div class="actions"><button class="primary" type="submit">Guardar plan</button></div><p class="msg"></p></form>';
    z.querySelector("form").onsubmit=function(e){e.preventDefault(); var f=this, h=f.hasta.value;
      api("/api/admin/planes/"+id,{plan:f.plan.value,cuota:+f.cuota.value,hasta:h?new Date(h+"T23:59:59").getTime():null}).then(function(r){
        PL.planes[id]={plan:f.plan.value,cuota:+f.cuota.value,hasta:h?new Date(h+"T23:59:59").getTime():null,usados:r.plan.usados,pro:r.plan.pro};
        t.querySelector('[data-planchip="'+id+'"]').innerHTML=chipPlan(id); f.querySelector(".msg").className="msg ok"; f.querySelector(".msg").textContent="Plan guardado.";
      }).catch(function(er){f.querySelector(".msg").className="msg bad";f.querySelector(".msg").textContent=ERR(er);});};
  };});
  var s=t.querySelectorAll("[data-est]"),i;
  for(i=0;i<s.length;i++)s[i].onclick=function(){
    api("/api/admin/orgs/"+this.getAttribute("data-id"),{status:this.getAttribute("data-est")}).then(function(){plataforma("orgs");}).catch(function(er){alert(ERR(er));});};
  s=t.querySelectorAll("[data-adm]");
  for(i=0;i<s.length;i++)s[i].onclick=function(){
    var id=this.getAttribute("data-adm"), z=$("po-adm-"+id), abre=z.hidden;
    z.hidden=!abre; this.setAttribute("aria-expanded",String(abre));
    if(abre)gestores(id);
  };
  s=t.querySelectorAll("[data-met]"); for(i=0;i<s.length;i++)s[i].onclick=function(){org(this.getAttribute("data-met"),"metricas");};
  s=t.querySelectorAll("[data-usr]"); for(i=0;i<s.length;i++)s[i].onclick=function(){plataforma("usuarios",{org:this.getAttribute("data-usr")});};
}
/* quién gestiona una institución, desde la administración de la plataforma */
function gestores(id,nota){
  var z=$("po-adm-"+id); if(!z)return;
  z.innerHTML='<p class="fine">Cargando…</p>';
  api("/api/admin/orgs/"+id+"/admins").then(function(r){
    var k=r.kind, opts=function(sel){return ["admin","docente"].map(function(x){return '<option value="'+x+'"'+(x===sel?' selected':'')+'>'+nombreRol(x,k)+'</option>';}).join("");};
    z.innerHTML='<p class="fine">La <b>administración</b> gestiona todo: marca, miembros, convocatorias, premios, bancos'+(academica(k)?', cursos y cuestionarios':'')+
        '. '+(academica(k)?'Los <b>docentes</b> crean sus cursos, bancos, cuestionarios y convocatorias.':'Quien <b>crea retos</b> hace bancos de preguntas y convocatorias con premio.')+'</p>'+
      (r.people.length?'<ul class="au-inv">'+r.people.map(function(p){
        return '<li><span><b>'+esc(p.name)+'</b> · '+esc(p.email)+'</span><span class="po-acc"><select data-rolg="'+esc(p.id)+'">'+opts(p.role)+'</select>'+
          '<button type="button" class="ghost au-mini" data-quitag="'+esc(p.id)+'">Quitar</button></span></li>';}).join("")+'</ul>':
        '<p class="rt-hoy">Todavía no tiene a nadie que la administre. Designa a alguien por su correo.</p>')+
      (r.invites.length?'<ul class="au-inv">'+r.invites.map(function(i){return '<li><span>'+esc(i.email)+' · '+nombreRol(i.role,k)+' · <em>pendiente: se aplica cuando entre con Google</em></span>'+
        '<button type="button" class="ghost au-mini" data-quitai="'+esc(i.email)+'">Quitar</button></li>';}).join("")+'</ul>':'')+
      '<form class="rt-join au-invita" data-desg="'+id+'"><input type="email" required placeholder="correo@empresa.com" autocomplete="off" aria-label="Correo">'+
        '<select aria-label="Rol">'+opts("admin")+'</select><button type="submit" class="primary">Designar</button></form>'+
      '<p class="msg" id="po-adm-msg-'+id+'">'+(nota?esc(nota):'')+'</p>';
    if(nota)$("po-adm-msg-"+id).className="msg good";
    function hace(datos,msg){api("/api/admin/orgs/"+id+"/admins",datos).then(function(x){gestores(id,msg||(x&&x.added?"Designado: ya puede gestionarla.":x&&x.invited?"Guardado: tendrá acceso en cuanto entre con Google con ese correo.":"Guardado."));})
      .catch(function(er){aviso("po-adm-msg-"+id,ERR(er),true);});}
    var f=z.querySelector("[data-desg]");
    f.onsubmit=function(e){e.preventDefault();hace({email:f.querySelector("input").value,role:f.querySelector("select").value});};
    var q=z.querySelectorAll("[data-rolg]"),j;
    for(j=0;j<q.length;j++)q[j].onchange=function(){hace({user_id:this.getAttribute("data-rolg"),role:this.value},"Rol cambiado.");};
    q=z.querySelectorAll("[data-quitag]");
    for(j=0;j<q.length;j++)q[j].onclick=function(){if(!confirm("¿Quitar a esta persona de la institución?"))return;hace({user_id:this.getAttribute("data-quitag"),remove:true},"Quitado.");};
    q=z.querySelectorAll("[data-quitai]");
    for(j=0;j<q.length;j++)q[j].onclick=function(){hace({email:this.getAttribute("data-quitai"),remove:true},"Alta pendiente anulada.");};
  }).catch(function(e){z.innerHTML='<p class="fine bad">'+esc(ERR(e))+'</p>';});
}
function platUsuarios(t,r,f){
  t.innerHTML='<form class="au-filtros" id="pu-f"><label>Buscar<input id="pu-q" value="'+esc(f.q||"")+'" placeholder="Nombre, correo o teléfono"></label>'+
    '<label>Tipo<select id="pu-t"><option value="">Todos</option><option value="google"'+(f.type==="google"?' selected':'')+'>Google</option>'+
      '<option value="invitado"'+(f.type==="invitado"?' selected':'')+'>Invitados</option><option value="bloqueado"'+(f.type==="bloqueado"?' selected':'')+'>Bloqueados</option></select></label>'+
    '<label>Institución<select id="pu-o"><option value="">Todas</option>'+r.orgs.map(function(o){return '<option value="'+o.id+'"'+(o.id===f.org?' selected':'')+'>'+esc(o.name)+'</option>';}).join("")+'</select></label></form>'+
    '<div id="pu-lista"><p class="fine">Cargando…</p></div>';
  function busca(){plataforma("usuarios",{q:$("pu-q").value,type:$("pu-t").value,org:$("pu-o").value});}
  $("pu-f").onsubmit=function(e){e.preventDefault();busca();};
  $("pu-t").onchange=$("pu-o").onchange=busca;
  var q=["offset="+(f.offset||0)]; if(f.q)q.push("q="+encodeURIComponent(f.q)); if(f.type)q.push("type="+f.type); if(f.org)q.push("org="+f.org);
  api("/api/admin/users?"+q.join("&")).then(function(u){
    var h='<p class="fine">'+u.total+' usuario'+(u.total===1?'':'s')+(u.total>u.users.length?' · mostrando '+(u.offset+1)+'–'+(u.offset+u.users.length):'')+'</p>';
    if(u.users.length){
      h+='<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Usuario</th><th>Tipo</th><th>Instituciones</th><th>Particip.</th><th>Última vez</th><th></th></tr></thead><tbody>'+
        u.users.map(function(x){return '<tr class="'+(x.blocked?"apagada":"")+'"><td>'+esc(x.name)+'<small>'+esc(x.phone||x.email||"—")+'</small></td>'+
          '<td>'+(x.type==="invitado"?'Invitado<small>'+(x.verified_by==="prueba"?"código de prueba":"verificado")+'</small>':'Google')+(x.blocked?'<small>Bloqueado: '+esc(x.block_reason)+'</small>':'')+'</td>'+
          '<td><small>'+esc(x.orgs||"—")+'</small></td><td>'+x.entries+'</td><td>'+fecha(x.last_seen)+'</td>'+
          '<td class="po-acc">'+(x.type==="google"&&x.email&&!x.blocked?'<button type="button" class="ghost au-mini" data-dg="'+esc(x.email)+'">Designar</button>':'')+
            '<button type="button" class="ghost au-mini" data-bl="'+esc(x.id)+'" data-v="'+(x.blocked?0:1)+'">'+(x.blocked?"Desbloquear":"Bloquear")+'</button></td></tr>'+
          (x.type==="google"&&x.email?'<tr class="po-dg" hidden data-dgf="'+esc(x.email)+'"><td colspan="6"><form class="rt-join au-invita"><span class="po-dg-t">Designar a '+esc(x.name)+' en</span>'+
            '<select aria-label="Institución">'+r.orgs.map(function(o){return '<option value="'+o.id+'" data-k="'+o.kind+'">'+esc(o.name)+'</option>';}).join("")+'</select>'+
            '<select aria-label="Rol"><option value="admin">Administración</option><option value="docente">Docente u organizador</option></select>'+
            '<button type="submit" class="primary">Designar</button></form></td></tr>':'');}).join("")+
        '</tbody></table></div>';
      if(u.total>u.offset+u.users.length)h+='<div class="actions"><button class="ghost" id="pu-mas">Siguientes</button></div>';
    }
    h+='<p class="msg" id="pu-msg"></p>';
    $("pu-lista").innerHTML=h;
    if(f.nota){aviso("pu-msg",f.nota);delete f.nota;}
    if($("pu-mas"))$("pu-mas").onclick=function(){plataforma("usuarios",Object.assign({},f,{offset:(f.offset||0)+100}));};
    var dg=$("pu-lista").querySelectorAll("[data-dg]"),n;
    for(n=0;n<dg.length;n++)dg[n].onclick=function(){
      var fila=$("pu-lista").querySelector('[data-dgf="'+this.getAttribute("data-dg")+'"]'); fila.hidden=!fila.hidden;};
    var fs=$("pu-lista").querySelectorAll("[data-dgf] form");
    for(n=0;n<fs.length;n++)fs[n].onsubmit=function(e){
      e.preventDefault(); var fm=this, sel=fm.querySelectorAll("select"), email=fm.parentNode.parentNode.getAttribute("data-dgf");
      if(!r.orgs.length){aviso("pu-msg","Primero da de alta una institución o empresa.",true);return;}
      api("/api/admin/orgs/"+sel[0].value+"/admins",{email:email,role:sel[1].value}).then(function(){
        plataforma("usuarios",Object.assign({},f,{nota:email+" ya gestiona «"+sel[0].options[sel[0].selectedIndex].text+"»."}));})
        .catch(function(er){aviso("pu-msg",ERR(er),true);});};
    var s=$("pu-lista").querySelectorAll("[data-bl]"),i;
    for(i=0;i<s.length;i++)s[i].onclick=function(){
      var id=this.getAttribute("data-bl"), v=this.getAttribute("data-v")==="1", motivo="";
      if(v){motivo=prompt("Motivo del bloqueo (lo verá la administración):","Uso indebido");if(motivo===null)return;}
      api("/api/admin/users/"+encodeURIComponent(id),{blocked:v,reason:motivo}).then(function(){plataforma("usuarios",f);}).catch(function(er){aviso("pu-msg",ERR(er),true);});
    };
  }).catch(function(e){$("pu-lista").innerHTML='<p class="fine bad">'+esc(ERR(e))+'</p>';});
}

/* se publica antes de atender el enlace: si la sesión ya se conoce, el cambio de modo es inmediato */
window.AxAula={abrir:abrir,cerrar:cerrar,curso:function(code){activo=true;panel.hidden=false;curso(code);},
  org:function(id,tab){activo=true;panel.hidden=false;org(id,tab);}};

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

})();
