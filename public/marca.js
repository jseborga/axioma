/* ===========================================================
   THE FINAL TEST · página pública de una marca
   ?marca=slug abre la página de una empresa, comunidad o institución:
   su logo, su color, sus convocatorias abiertas y el QR para compartir.
   Cada convocatoria lleva directo a su ficha, donde se puede participar
   con Google o como invitado verificado.
   =========================================================== */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var panel=$("marca-panel"); if(!panel)return;
var slug=null, activo=false;

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function get(p){return fetch(p,{credentials:"same-origin"}).then(function(r){return r.text().then(function(t){var j;try{j=JSON.parse(t);}catch(x){throw {error:"http",status:r.status};}if(!r.ok)throw j;return j;});});}
function fecha(ms){return new Date(ms).toLocaleString("es",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});}
function enlace(s){return location.origin+location.pathname+"?marca="+s;}
function color(c){
  panel.style.removeProperty("--accent"); panel.style.removeProperty("--accent-tint"); panel.style.removeProperty("--marca");
  if(/^#[0-9a-f]{6}$/i.test(c||"")){panel.style.setProperty("--accent",c);panel.style.setProperty("--accent-tint",c+"26");panel.style.setProperty("--marca",c);}
}

function abrir(){ activo=true; panel.hidden=false; if(slug)pinta(); else directorio(); }
function cerrar(){ activo=false; panel.hidden=true; }
function ver(s){ slug=s; if(window.AxApp)AxApp.setMode("marca"); }

/* sin marca elegida: el directorio de marcas con convocatorias */
function directorio(){
  color(null); $("hdr").textContent="Marcas";
  panel.innerHTML='<div class="panel"><p class="fine">Cargando…</p></div>';
  get("/api/brands").then(function(r){
    panel.innerHTML='<div class="panel retos"><h3>Empresas y eventos</h3><p>Convocatorias abiertas de empresas, comunidades e instituciones.</p>'+
      (r.brands.length?r.brands.map(tarjeta).join(""):'<p class="fine">Todavía no hay marcas publicadas.</p>')+'</div>';
    liga();
  }).catch(function(){panel.innerHTML='<div class="panel"><p class="fine bad">No se pudo cargar.</p></div>';});
}
function tarjeta(b){
  return '<button type="button" class="rt-card mc-tarjeta" data-slug="'+esc(b.slug)+'" style="--marca:'+esc(b.color||"var(--ink)")+'">'+
    '<span class="mc-logo">'+(b.logo?'<img src="'+esc(b.logo)+'" alt="">':'<i>'+esc((b.name||"?").charAt(0))+'</i>')+'</span>'+
    '<span class="mc-t"><b>'+esc(b.name)+'</b><small>'+esc(b.tagline||"")+'</small></span>'+
    (b.open?'<span class="chip activo">'+b.open+' abierta'+(b.open>1?'s':'')+'</span>':'')+'</button>';
}
function liga(){var bs=panel.querySelectorAll("[data-slug]"),i;for(i=0;i<bs.length;i++)bs[i].onclick=function(){slug=this.getAttribute("data-slug");pinta();};}

function pinta(){
  panel.innerHTML='<div class="panel"><p class="fine">Cargando…</p></div>';
  get("/api/brands/"+encodeURIComponent(slug)).then(function(b){
    if(!activo)return;
    color(b.color); $("hdr").textContent=b.name;
    var h='<header class="mc-cab">'+
      '<span class="mc-logo grande">'+(b.logo?'<img src="'+esc(b.logo)+'" alt="">':'<i>'+esc(b.name.charAt(0))+'</i>')+'</span>'+
      '<div><h2>'+esc(b.name)+'</h2>'+(b.tagline?'<p>'+esc(b.tagline)+'</p>':'')+'</div></header>'+
      '<div class="panel retos">'+
      (b.description?'<p class="mc-desc">'+esc(b.description)+'</p>':'')+
      '<div class="actions"><button class="ghost" id="mc-qr">Compartir con QR</button>'+
        (b.website?'<a class="ghost mc-web" href="'+esc(b.website)+'" target="_blank" rel="noopener">Sitio web</a>':'')+
        (b.manage?'<button class="ghost" id="mc-gest">Gestionar</button>':'')+'</div>'+
      '<h4>Convocatorias abiertas</h4>';
    h+=b.open.length?b.open.map(function(c){
      return '<button type="button" class="rt-card mc-conv" data-code="'+c.code+'"><span class="rt-card-top"><b>'+esc(c.name)+'</b>'+
        '<span class="chip '+(c.state==="abierto"?"activo":"pronto")+'">'+(c.state==="abierto"?"Abierta":"Pronto")+'</span></span>'+
        (c.prize?'<span class="mc-premio">🏆 '+esc(c.prize)+'</span>':'')+
        '<small>'+(c.state==="abierto"?"Hasta el "+fecha(c.ends_at):"Desde el "+fecha(c.starts_at))+' · '+c.max_questions+' preguntas · '+
        c.registered+(c.registered===1?' inscrito':' inscritos')+(c.guests?' · sin cuenta, con tu teléfono o correo':'')+'</small></button>';
    }).join(""):'<p class="fine">No hay convocatorias abiertas ahora mismo. Vuelve pronto.</p>';
    if(b.campanas&&b.campanas.length){
      var J=window.AxRapidos&&AxRapidos.JUEGOS||{}, MJ=window.AxMaraton&&AxMaraton.JUEGOS||{};
      h+='<h4>Competencias</h4>'+b.campanas.map(function(c){var j=J[c.juego]||MJ[c.juego]||{};
        return '<button type="button" class="rt-card mc-conv" data-camp="'+c.code+'"><span class="rt-card-top"><b>'+esc(j.icono||"🎮")+' '+esc(c.name)+'</b>'+
          '<span class="chip '+(c.state==="abierto"?"activo":"pronto")+'">'+(c.state==="abierto"?"Abierta":"Pronto")+'</span></span>'+
          (c.premio||c.umbral_premio?'<span class="mc-premio">🏆 '+esc(c.premio||c.umbral_premio)+'</span>':'')+
          '<small>'+esc(j.nom||c.juego)+' · '+(c.state==="abierto"?"hasta el "+fecha(c.ends_at):"desde el "+fecha(c.starts_at))+' · '+c.players+(c.players===1?' jugador':' jugadores')+
          (c.guests?' · sin cuenta, con tu teléfono o correo':'')+'</small></button>';}).join("");
    }
    if(b.recent.length){
      h+='<h4>Terminadas</h4>'+b.recent.map(function(c){
        return '<button type="button" class="rt-card" data-code="'+c.code+'"><span class="rt-card-top"><b>'+esc(c.name)+'</b><span class="chip terminado">Resultados</span></span>'+
          '<small>Cerró el '+fecha(c.ends_at)+' · '+c.played+(c.played===1?' participante':' participantes')+'</small></button>';
      }).join("");
    }
    h+='</div>';
    panel.innerHTML=h;
    var bs=panel.querySelectorAll("[data-code]"),i;
    for(i=0;i<bs.length;i++)bs[i].onclick=function(){var c=this.getAttribute("data-code");AxApp.setMode("concurso");AxConcursos.ficha(c);};
    panel.querySelectorAll("[data-camp]").forEach(function(x){x.onclick=function(){var c=this.getAttribute("data-camp");AxApp.setMode("concurso");AxConcursos.campana(c);};});
    $("mc-qr").onclick=function(){AxQR.abre({url:enlace(b.slug),titulo:b.name,subtitulo:b.tagline||"Convocatorias",marca:b.name,lema:b.tagline,color:b.color,logo:b.logo});};
    if($("mc-gest"))$("mc-gest").onclick=function(){AxApp.setMode("empresas");AxAula.org(b.org_id,"convocatorias");};
  }).catch(function(){
    color(null);
    panel.innerHTML='<div class="panel retos"><h3>No encontrada</h3><p>Esta página no existe o todavía no está disponible.</p>'+
      '<div class="actions"><button class="ghost" id="mc-dir">Ver todas las marcas</button></div></div>';
    $("mc-dir").onclick=function(){slug=null;directorio();};
  });
}

/* se publica antes de atender el enlace: si la sesión ya se conoce, el cambio de modo es inmediato */
window.AxMarca={abrir:abrir,cerrar:cerrar,ver:ver,directorio:function(){slug=null;if(window.AxApp)AxApp.setMode("marca");}};

/* ---------- enlace: ?marca=slug ---------- */
(function(){
  var q=new URLSearchParams(location.search), s=q.get("marca");
  if(!s)return;
  slug=s.toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,40);
  try{history.replaceState(null,"",location.pathname);}catch(e){}
  var ido=false, ir=function(){ if(ido)return; ido=true; if(window.AxApp)AxApp.setMode("marca"); };
  if(window.AxAccount&&AxAccount.listo())ir(); else document.addEventListener("ax-user",ir);
})();

})();
