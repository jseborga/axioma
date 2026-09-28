/* ===========================================================
   THE FINAL TEST · áreas temáticas del banco general de trivia
   Casillas para elegir de qué áreas salen las preguntas (sin marcar
   ninguna: todas). Las usan los concursos, los cuestionarios y
   convocatorias de institución y la trivia en vivo.
     AxAreas.html(id)          bloque vacío con ese id
     AxAreas.pinta(el, marcadas) lo llena (carga la lista una vez)
     AxAreas.lee(el)            → ["bol","his",…]
   =========================================================== */
(function(){
"use strict";
var cache=null;
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function carga(){
  if(!cache)cache=fetch("/api/contests/areas",{credentials:"same-origin"}).then(function(r){return r.json();})
    .then(function(j){return j.areas||[];}).catch(function(){cache=null;return [];});
  return cache;
}
function html(id){return '<fieldset class="ar-box"><legend>Áreas temáticas</legend><div id="'+id+'"><p class="fine">Cargando áreas…</p></div></fieldset>';}
function lee(el){
  if(!el)return [];
  return Array.prototype.map.call(el.querySelectorAll("input[data-area]:checked"),function(i){return i.value;});
}
function pinta(el,marcadas){
  if(!el)return Promise.resolve();
  marcadas=marcadas||[];
  return carga().then(function(a){
    if(!a.length){el.innerHTML='<p class="fine">No se pudo cargar la lista de áreas: se usarán todas.</p>';return;}
    var total=a.reduce(function(s,x){return s+x.n;},0);
    el.innerHTML='<div class="ar-grid">'+a.map(function(x){
      return '<label class="ar-chip"><input type="checkbox" data-area value="'+esc(x.id)+'"'+(marcadas.indexOf(x.id)>=0?' checked':'')+(x.n?'':' disabled')+'>'+
        '<span>'+esc(x.nombre)+' <small>'+x.n+'</small></span></label>';}).join("")+'</div><p class="fine ar-nota"></p>';
    function nota(){
      var s=lee(el), n=s.length?a.filter(function(x){return s.indexOf(x.id)>=0;}).reduce(function(t,x){return t+x.n;},0):total;
      el.querySelector(".ar-nota").textContent=s.length?n+" preguntas en las áreas elegidas.":"Sin marcar ninguna salen de todas las áreas ("+total+" preguntas).";
    }
    el.onchange=nota; nota();
  });
}
window.AxAreas={carga:carga,html:html,pinta:pinta,lee:lee};
})();
