/* ===========================================================
   THE FINAL TEST · Aprender · piezas comunes
   -----------------------------------------------------------
   Lo que comparten Matemática Montessori e Inglés:
     AxAprender.mascota(gesto,tam)   Lumi, la mascota (SVG): feliz,
                                     wow, piensa, anima, celebra, duerme
     AxAprender.globo(gesto,texto)   Lumi diciendo algo
     AxAprender.botonCompleta()      botón de pantalla completa
     AxAprender.completa(on)         entra o sale de pantalla completa
   La pantalla completa usa la del navegador cuando existe y, además,
   deja el juego ocupando toda la ventana (así también funciona en
   iPhone, que no deja poner una página en pantalla completa).
   =========================================================== */
(function(){
"use strict";
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
var UID=0;

/* ---------- Lumi ---------- */
function mascota(gesto,tam){
  gesto=gesto||"feliz"; tam=tam||96; var id="lumi"+(++UID);
  var ojos, boca, brazos, extra="";
  var pupila=function(x,y){return '<circle cx="'+x+'" cy="'+y+'" r="6.4" fill="#2b2140"/><circle cx="'+(x+2.2)+'" cy="'+(y-2.4)+'" r="2.3" fill="#fff"/>';};
  ojos='<ellipse cx="45" cy="56" rx="11" ry="13" fill="#fff"/><ellipse cx="75" cy="56" rx="11" ry="13" fill="#fff"/>';
  if(gesto==="piensa"){ojos+=pupila(47,51)+pupila(77,51); boca='<path d="M54 82 Q62 79 68 82" stroke="#2b2140" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
    extra='<g fill="#fff" stroke="#b8a9e8" stroke-width="1.5"><circle cx="100" cy="26" r="5"/><circle cx="108" cy="14" r="7"/></g>';}
  else if(gesto==="wow"){ojos+=pupila(45,57)+pupila(75,57); boca='<ellipse cx="60" cy="83" rx="7" ry="8" fill="#7a1f3d"/><ellipse cx="60" cy="86" rx="4" ry="3" fill="#ff8fab"/>';
    extra='<text x="98" y="30" font-size="18">✨</text><text x="4" y="34" font-size="14">✨</text>';}
  else if(gesto==="anima"){ojos='<ellipse cx="45" cy="56" rx="11" ry="13" fill="#fff"/>'+pupila(45,57)+'<path d="M65 58 Q75 50 85 58" stroke="#2b2140" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
    boca='<path d="M48 77 Q60 90 72 77" stroke="#2b2140" stroke-width="3.4" fill="#ff8fab" stroke-linecap="round"/>';}
  else if(gesto==="duerme"){ojos='<path d="M35 58 Q45 64 55 58" stroke="#2b2140" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M65 58 Q75 64 85 58" stroke="#2b2140" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
    boca='<ellipse cx="60" cy="82" rx="4" ry="3" fill="#7a1f3d"/>'; extra='<text x="92" y="30" font-size="16" fill="#7c5cff" font-weight="800">z</text><text x="102" y="18" font-size="12" fill="#7c5cff" font-weight="800">z</text>';}
  else{ojos+=pupila(45,57)+pupila(75,57); boca='<path d="M47 76 Q60 92 73 76 Z" fill="#7a1f3d"/><path d="M52 83 Q60 88 68 83 Q60 91 52 83Z" fill="#ff8fab"/>';}
  if(gesto==="celebra"){brazos='<ellipse cx="13" cy="58" rx="7" ry="13" transform="rotate(-55 13 58)" fill="url(#'+id+'c)"/><ellipse cx="107" cy="58" rx="7" ry="13" transform="rotate(55 107 58)" fill="url(#'+id+'c)"/>';
    extra+='<g font-size="13"><text x="2" y="18">🎉</text><text x="98" y="16">⭐</text></g>';}
  else brazos='<ellipse cx="17" cy="76" rx="8" ry="13" transform="rotate(25 17 76)" fill="url(#'+id+'c)"/><ellipse cx="103" cy="76" rx="8" ry="13" transform="rotate(-25 103 76)" fill="url(#'+id+'c)"/>';
  return '<svg class="ap-lumi g-'+gesto+'" viewBox="0 0 120 120" width="'+tam+'" height="'+tam+'" role="img" aria-label="Lumi">'+
    '<defs><radialGradient id="'+id+'c" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="#fff1a8"/><stop offset=".55" stop-color="#ffcf3a"/><stop offset="1" stop-color="#ff9f1c"/></radialGradient></defs>'+
    '<ellipse cx="60" cy="112" rx="34" ry="5" fill="rgba(0,0,0,.12)"/>'+brazos+
    '<path d="M58 22 C50 8 64 2 70 12 C64 12 60 16 58 22Z" fill="#4caf50"/><path d="M60 22 C62 12 76 8 82 16 C72 16 66 20 60 22Z" fill="#7bd36b"/>'+
    '<circle cx="60" cy="64" r="44" fill="url(#'+id+'c)"/><ellipse cx="60" cy="84" rx="26" ry="18" fill="#fff6c9" opacity=".75"/>'+
    '<ellipse cx="44" cy="34" rx="12" ry="6" fill="#fff" opacity=".45" transform="rotate(-20 44 34)"/>'+
    ojos+'<ellipse cx="31" cy="74" rx="7" ry="4.5" fill="#ff7aa8" opacity=".55"/><ellipse cx="89" cy="74" rx="7" ry="4.5" fill="#ff7aa8" opacity=".55"/>'+boca+extra+'</svg>';
}
function globo(gesto,texto,cls){
  return '<div class="ap-globo '+(cls||"")+'">'+mascota(gesto,74)+'<p>'+esc(texto)+'</p></div>';
}

/* ---------- pantalla completa ---------- */
function enCompleta(){return document.body.classList.contains("ap-full");}
function completa(on){
  if(on==null)on=!enCompleta();
  document.body.classList.toggle("ap-full",!!on);
  try{
    var de=document.documentElement;
    if(on&&!document.fullscreenElement&&de.requestFullscreen){var p=de.requestFullscreen({navigationUI:"hide"}); if(p&&p.catch)p.catch(function(){});}
    else if(!on&&document.fullscreenElement&&document.exitFullscreen){var q=document.exitFullscreen(); if(q&&q.catch)q.catch(function(){});}
  }catch(e){}
  marca();
}
function marca(){Array.prototype.forEach.call(document.querySelectorAll("[data-ap-full]"),function(b){var on=enCompleta(); b.setAttribute("aria-pressed",on?"true":"false"); b.title=on?"Salir de pantalla completa":"Pantalla completa"; b.innerHTML=icono(on);});}
function icono(on){return on?'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  :'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
function botonCompleta(){var on=enCompleta(); return '<button type="button" class="ap-full-btn" data-ap-full aria-pressed="'+on+'" title="'+(on?"Salir de pantalla completa":"Pantalla completa")+'" aria-label="Pantalla completa">'+icono(on)+'</button>';}
/* los botones se pintan con cada pantalla: un solo oyente para todos */
document.addEventListener("click",function(e){var b=e.target&&e.target.closest&&e.target.closest("[data-ap-full]"); if(b){e.preventDefault(); completa();}});
/* si se sale con Esc o con el gesto del sistema, el juego vuelve a su lugar */
document.addEventListener("fullscreenchange",function(){if(!document.fullscreenElement&&enCompleta()){document.body.classList.remove("ap-full"); marca();}});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&enCompleta()&&!document.fullscreenElement)completa(false);});

window.AxAprender={mascota:mascota,globo:globo,completa:completa,enCompleta:enCompleta,botonCompleta:botonCompleta};
})();
