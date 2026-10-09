/* ===========================================================
   THE FINAL TEST · portada
   Lo que hay en la plataforma: la sección Educativo (instituciones, cursos y
   cuestionarios), los concursos, los juegos de lógica —Axioma entre
   ellos— y los retos con amigos. Con un código se entra directo a
   un curso o a un concurso.
   =========================================================== */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var panel=$("inicio-panel"); if(!panel)return;

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function get(path){return fetch(path,{credentials:"same-origin"}).then(function(r){return r.text().then(function(t){var j;try{j=JSON.parse(t);}catch(x){throw {error:"http",status:r.status};}if(!r.ok)throw j;return j;});});}
function user(){return window.AxAccount&&AxAccount.user();}
function ir(m){if(window.AxApp)AxApp.setMode(m);}

var ICONO={
  aula:'<svg viewBox="0 0 24 24"><path d="M12 4 2 9l10 5 8-4v6h2V9L12 4z"/><path d="M6 12.6V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.4l-6 3-6-3z" opacity=".55"/></svg>',
  concurso:'<svg viewBox="0 0 24 24"><path d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V17h3v3H8v-3h3v-2.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3V3zm0 4H6v1a2 2 0 0 0 1.2 1.8A6 6 0 0 1 7 8.7V7zm10 0v1.7c0 .4 0 .8-.2 1.1A2 2 0 0 0 18 8V7h-1z"/></svg>',
  axioma:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="5" height="5" rx="1.2"/><rect x="9.5" y="3" width="5" height="5" rx="1.2" opacity=".35"/><rect x="16" y="3" width="5" height="5" rx="1.2"/><rect x="3" y="9.5" width="5" height="5" rx="1.2" opacity=".35"/><rect x="9.5" y="9.5" width="5" height="5" rx="1.2"/><rect x="16" y="9.5" width="5" height="5" rx="1.2" opacity=".35"/><rect x="3" y="16" width="5" height="5" rx="1.2"/><rect x="9.5" y="16" width="5" height="5" rx="1.2" opacity=".35"/><rect x="16" y="16" width="5" height="5" rx="1.2"/></svg>',
  sudoku:'<svg viewBox="0 0 24 24"><path d="M3 3h18v18H3V3zm2 2v4h4V5H5zm6 0v4h2V5h-2zm4 0v4h4V5h-4zM5 11v2h4v-2H5zm6 0v2h2v-2h-2zm4 0v2h4v-2h-4zM5 15v4h4v-4H5zm6 0v4h2v-4h-2zm4 0v4h4v-4h-4z"/></svg>',
  empresa:'<svg viewBox="0 0 24 24"><path d="M4 21V5.5L12 3l8 2.5V21h-6v-4h-4v4H4zm3-13v2h2V8H7zm4 0v2h2V8h-2zm4 0v2h2V8h-2zM7 12v2h2v-2H7zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2z"/></svg>',
  rapido:'<svg viewBox="0 0 24 24"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>',
  juegos:'<svg viewBox="0 0 24 24"><path d="M7 6h10a5 5 0 0 1 4.9 6l-.9 4.4a2.7 2.7 0 0 1-4.6 1.3L14.2 15H9.8l-2.2 2.7a2.7 2.7 0 0 1-4.6-1.3L2.1 12A5 5 0 0 1 7 6zm0 3v1.5H5.5V12H7v1.5h1.5V12H10v-1.5H8.5V9H7zm9.5 0a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zm-2 2.4a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z"/></svg>',
  granja:'<svg viewBox="0 0 24 24"><path d="M3 11 12 4l9 7v9h-6v-5H9v5H3v-9z"/><path d="M10 9h4v3h-4z" opacity=".55"/></svg>',
  ciudad:'<svg viewBox="0 0 24 24"><path d="M3 21V10l5-3v14z"/><path d="M9 21V4h7v17z" opacity=".75"/><path d="M17 21v-9h4v9z" opacity=".55"/></svg>',
  grupo:'<svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="3.2"/><circle cx="5" cy="9.5" r="2.4" opacity=".55"/><circle cx="19" cy="9.5" r="2.4" opacity=".55"/><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6H6z"/><path d="M1 19.5c0-2.4 1.8-4.3 4-4.3.6 0 1.1.1 1.6.3A7.6 7.6 0 0 0 4.9 19.5H1zm22 0h-3.9a7.6 7.6 0 0 0-1.7-4c.5-.2 1-.3 1.6-.3 2.2 0 4 1.9 4 4.3z" opacity=".55"/></svg>',
  mate:'<svg viewBox="0 0 24 24"><circle cx="5" cy="5" r="2.2"/><circle cx="10" cy="5" r="2.2"/><circle cx="15" cy="5" r="2.2" opacity=".55"/><rect x="3" y="10" width="4" height="11" rx="2" opacity=".75"/><path d="M10 14h4m-2-2v4M16 13h5m-5 4h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
  ingles:'<svg viewBox="0 0 24 24"><path d="M3 5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3a2 2 0 0 1-2-2V5z"/><path d="M10 15h5l4 3v-3a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1v4a4 4 0 0 1-4 4h-4z" opacity=".55"/></svg>',
  reto:'<svg viewBox="0 0 24 24"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3.3 3.1-6 7-6s7 2.7 7 6H2zm15.5 0c0-2-.7-3.7-1.9-5 .5-.1.9-.1 1.4-.1 3.1 0 5 2.2 5 5.1h-4.5z"/></svg>'
};

function tarjeta(modo,icono,titulo,texto,extra,clase){
  return '<button type="button" class="ini-card '+(clase||"")+'" data-modo="'+modo+'"><span class="ini-ico">'+ICONO[icono]+'</span>'+
    '<span class="ini-txt"><b>'+titulo+'</b><small>'+texto+'</small>'+(extra?'<em>'+extra+'</em>':'')+'</span></button>';
}

function abrir(){
  panel.hidden=false;
  var u=user(), ac=window.AxAcceso?AxAcceso.datos():{ver:{educativo:true,empresas:true}};
  panel.innerHTML=
    '<div class="ini-hero"><h2>Aprende, compite y demuéstralo.</h2>'+
    '<p>Cuestionarios de clase con registros para el docente, concursos de trivia con premio y juegos de lógica, en un mismo lugar. <a href="#" class="guia-link" data-guia="inicio">¿Cómo funciona?</a></p>'+
    '<form class="rt-join ini-codigo" id="ini-form"><input id="ini-code" placeholder="Código de curso, concurso o sala" maxlength="6" autocapitalize="characters" autocomplete="off" spellcheck="false"><button type="submit" class="primary">Entrar</button></form>'+
    '<p class="msg" id="ini-msg"></p></div>'+
    '<div class="ini-grid">'+
      (ac.ver.educativo?tarjeta("aula","aula","Educativo","Instituciones, cursos por paralelo, bancos de preguntas y cuestionarios de parcial con registros y Excel.",'<span id="ini-aula">'+(u&&!u.guest?"Tus cursos…":"Para universidades e institutos")+'</span>',"grande"):'')+
      (ac.ver.empresas?tarjeta("empresas","empresa","Empresas y eventos","Tu marca, convocatorias con premio que se abren con un QR y se juegan sin trámites, y métricas.",'<span id="ini-emp">Cargando…</span>',"grande"):'')+
      tarjeta("concurso","concurso","Concursos de trivia","Te inscribes, juegas una sola vez y al cierre se publica el ranking y el ganador.",'<span id="ini-conc">Cargando…</span>',"grande")+
      (ac.ver.educativo&&ac.ver.empresas?'':tarjeta("amigos","grupo","Mis grupos y partidas","Tus amigos con su ranking de la semana, y todo lo que has jugado guardado en tu cuenta.",u&&!u.guest?"Crea tu grupo":"Entra con Google","grande"))+
    '</div>'+
    '<h4 class="ini-cap">Aprender jugando</h4>'+
    '<div class="ini-grid">'+
      tarjeta("mate","mate","Matemática Montessori","De inicial a secundaria: cada concepto con su material, luego con dibujos y al final con números. Se adapta a cada niña o niño, refuerza cuando hay errores y explica con IA.","Perfiles para toda la familia","grande")+
      tarjeta("ingles","ingles","Inglés para niñas y niños","Un curso desde cero con juegos y colores: palabras con dibujos y sonido, frases, escuchar y hablar. Lecciones cortas en un camino, estrellas y repaso de lo que cuesta.","30 unidades · con voz y micrófono","grande")+
    '</div>'+
    '<h4 class="ini-cap">Juegos de lógica</h4>'+
    '<div class="ini-grid">'+
      tarjeta("day","axioma","Axioma","El reto diario: deduce el tablero y descubre la regla que lo gobierna.")+
      tarjeta("sud","sudoku","Sudoku","Cinco niveles, tablero del día y ranking por tiempo.")+
      tarjeta("granja","granja","Granja Express","Arcade retro de estrategia y velocidad: siembra, fabrica y entrega. Ranking del día.")+
      tarjeta("ciudad","ciudad","Ciudad Saber","Constructor de ciudades en un mundo infinito con vecinos: energía, agua y servicios que se resuelven respondiendo.")+
      tarjeta("rapido","rapido","Juegos rápidos","Trivia, memoria, cálculo, reflejos y del 1 al 25.")+
    '</div>'+
    '<h4 class="ini-cap">Con amigos</h4>'+
    '<div class="ini-grid">'+
      tarjeta("juegos","juegos","Más juegos","Gomoku, Hex, Dudo, trivia en vivo con proyector, sorteos, subastas y más.")+
      tarjeta("reto","reto","Retos","Concursos con código, premio para el primero y penitencia para el último.")+
      tarjeta("pareja","sudoku","En pareja","Un sudoku a cuatro manos, cada uno desde su móvil.")+
      (ac.ver.educativo&&ac.ver.empresas?tarjeta("amigos","grupo","Mis grupos y partidas","Tus amigos, su ranking de la semana y tu historial."):'')+
    '</div>'+
    (u&&!u.guest&&!(ac.ver.educativo&&ac.ver.empresas)&&ac.tabla!==false?'<p class="fine ini-perfil">¿Eres docente, institución educativa o empresa? <a href="#" id="ini-perfil">Solicita tu perfil</a> para registrarla.</p>':'');
  var bs=panel.querySelectorAll("[data-modo]"),i;
  for(i=0;i<bs.length;i++)bs[i].onclick=function(){ir(this.getAttribute("data-modo"));};
  if($("ini-perfil"))$("ini-perfil").onclick=function(e){e.preventDefault();ir("amigos");};
  $("ini-form").onsubmit=function(e){
    e.preventDefault();
    var c=$("ini-code").value.trim().toUpperCase(), msg=$("ini-msg");
    if(c.length!==6){msg.className="msg bad";msg.textContent="Los códigos tienen seis caracteres.";return;}
    msg.className="msg"; msg.textContent="Buscando…";
    /* primero curso, luego concurso y por último sala de juego */
    get("/api/courses/"+c).then(function(){ if(window.AxAula){ir("aula");AxAula.curso(c);} })
      .catch(function(){ return get("/api/contests/"+c).then(function(){ir("concurso");if(window.AxConcursos)AxConcursos.ficha(c);},function(er){
        if(er&&er.error==="restricted"){ir("concurso");if(window.AxConcursos)AxConcursos.ficha(c);return;}
        return get("/api/salas/"+c).then(function(){ir("juegos");if(window.AxSala)AxSala.entra(c,false);},function(){
          return get("/api/grupos/"+c).then(function(){ir("amigos");if(window.AxAmigos)AxAmigos.grupo(c);},function(){
          msg.className="msg bad"; msg.textContent="No hay ningún curso, concurso, sala ni grupo con ese código."; }); }); }); });
  };
  get("/api/contests").then(function(r){
    var n=r.open.filter(function(c){return c.state==="abierto";}).length;
    $("ini-conc").textContent=n?(n===1?"1 abierto ahora":n+" abiertos ahora"):"Ninguno abierto: crea el primero";
  }).catch(function(){ $("ini-conc").textContent="Ver concursos"; });
  if(ac.ver.empresas)get("/api/brands").then(function(r){
    var n=r.brands.reduce(function(a,b){return a+b.open;},0), e=$("ini-emp"); if(!e)return;
    e.textContent=n?(n===1?"1 convocatoria abierta":n+" convocatorias abiertas"):(r.brands.length?r.brands.length+(r.brands.length===1?" marca":" marcas"):"Registra tu empresa");
  }).catch(function(){ var e=$("ini-emp"); if(e)e.textContent="Registra tu empresa"; });
  if(u&&!u.guest&&ac.ver.educativo)get("/api/orgs").then(function(r){
    var activos=r.courses.filter(function(c){return !c.archived&&c.status==="activo";});
    var abiertos=activos.reduce(function(s,c){return s+(c.open||0);},0);
    $("ini-aula").textContent=activos.length?(activos.length+(activos.length===1?" curso":" cursos")+(abiertos?" · "+abiertos+" cuestionario"+(abiertos>1?"s":"")+" abierto"+(abiertos>1?"s":""):"")):
      (r.orgs.length?r.orgs.length+(r.orgs.length===1?" institución":" instituciones"):"Únete con el código de tu curso");
  }).catch(function(){ var e=$("ini-aula"); if(e)e.textContent="Completa tu registro para empezar"; });
}
function cerrar(){ panel.hidden=true; }
document.addEventListener("ax-user",function(){ if(!panel.hidden)abrir(); });
document.addEventListener("ax-perfil",function(){ if(!panel.hidden)abrir(); });
document.addEventListener("ax-acceso",function(){ if(!panel.hidden)abrir(); });

window.AxInicio={abrir:abrir,cerrar:cerrar};
/* app.js elige la portada antes de que se cargue este archivo */
if(document.body.getAttribute("data-game")==="inicio")abrir();
})();
