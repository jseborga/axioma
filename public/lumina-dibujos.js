/* ===========================================================
   THE FINAL TEST · LuminaPets · los dibujos
   -----------------------------------------------------------
   Criaturas de peluche en SVG con el estilo de Lila (la imagen de
   portada): cabeza grande y esponjosa, ojos enormes con brillos,
   mejillas rosadas, sudadera pastel y patitas con almohadillas.
   Cuatro especies (gatito, conejito, zorrito, osito) y cuatro rasgos
   mágicos (cuerno de unicornio, alas de hada, estrella, alitas de
   dragón). También el huevo, la habitación, la tarta astral y la
   Aldea del Gran Árbol.
     AxLuminaDibujos.criatura(c, {gesto, tam}) · huevo(tono, calor, grietas)
     habitacion() · aldea() · tarta(n, d, tam)
   =========================================================== */
(function(){
"use strict";
var L=window.AxLumina;
if(!L)return;
var UID=0;
function uid(){return "lp"+(++UID);}
function f1(x){return Math.round(x*10)/10;}
var SUDADERA={lavanda:"#c9e7ff",rosa:"#d8f5e6",menta:"#ffe1ef",celeste:"#fff1c9",durazno:"#e6dcff",limon:"#ffd9e6"};

/* el contorno esponjoso: un círculo con pelitos */
function pelusa(cx,cy,r,n,amp){var d="";for(var i=0;i<=n;i++){var a=i/n*Math.PI*2, rr=r+(i%2?amp:-amp*0.3); d+=(i?"L":"M")+f1(cx+rr*Math.cos(a))+" "+f1(cy+rr*Math.sin(a));} return d+"Z";}
function ojos(gesto){
  if(gesto==="duerme")return '<path d="M60 96 Q76 106 92 96" stroke="#4a3426" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M108 96 Q124 106 140 96" stroke="#4a3426" stroke-width="4" fill="none" stroke-linecap="round"/>';
  if(gesto==="come")return '<path d="M60 100 Q76 84 92 100" stroke="#4a3426" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M108 100 Q124 84 140 100" stroke="#4a3426" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
  var g=uid(), o='<defs><radialGradient id="'+g+'" cx="50%" cy="60%" r="60%"><stop offset="0" stop-color="#e8b04a"/><stop offset=".6" stop-color="#a86a1c"/><stop offset="1" stop-color="#4a2a0c"/></radialGradient></defs>';
  [76,124].forEach(function(x){var big=gesto==="wow"?1.12:1;
    o+='<ellipse cx="'+x+'" cy="94" rx="'+f1(19*big)+'" ry="'+f1(21*big)+'" fill="#2b1d14"/><circle cx="'+x+'" cy="95" r="'+f1(16*big)+'" fill="url(#'+g+')"/><circle cx="'+x+'" cy="96" r="'+f1(8.5*big)+'" fill="#1a0f08"/>'+
      '<circle cx="'+(x-6)+'" cy="87" r="'+f1(6.5*big)+'" fill="#fff"/><circle cx="'+(x+6)+'" cy="102" r="3" fill="#fff" opacity=".9"/><circle cx="'+(x+8)+'" cy="88" r="1.6" fill="#fff"/>';});
  return o;
}
function orejas(c,col){
  var a=col[1], d=col[2], rosa="#f7a8c4";
  if(c.esp==="gato")return '<path d="M44 66 L50 18 Q54 12 60 18 L88 46Z" fill="'+a+'" stroke="'+d+'" stroke-width="2" stroke-linejoin="round"/><path d="M54 54 L56 28 L76 46Z" fill="'+rosa+'"/>'+
    '<path d="M156 66 L150 18 Q146 12 140 18 L112 46Z" fill="'+a+'" stroke="'+d+'" stroke-width="2" stroke-linejoin="round"/><path d="M146 54 L144 28 L124 46Z" fill="'+rosa+'"/>';
  if(c.esp==="conejo")return '<ellipse cx="72" cy="22" rx="15" ry="40" transform="rotate(-12 72 22)" fill="'+a+'" stroke="'+d+'" stroke-width="2"/><ellipse cx="72" cy="24" rx="7" ry="30" transform="rotate(-12 72 24)" fill="'+rosa+'"/>'+
    '<ellipse cx="128" cy="22" rx="15" ry="40" transform="rotate(12 128 22)" fill="'+a+'" stroke="'+d+'" stroke-width="2"/><ellipse cx="128" cy="24" rx="7" ry="30" transform="rotate(12 128 24)" fill="'+rosa+'"/>';
  if(c.esp==="zorro")return '<path d="M40 70 L44 8 L92 44Z" fill="'+a+'" stroke="'+d+'" stroke-width="2" stroke-linejoin="round"/><path d="M44 8 L50 28 L60 20Z" fill="'+d+'"/><path d="M52 58 L50 26 L78 46Z" fill="#fff4ec"/>'+
    '<path d="M160 70 L156 8 L108 44Z" fill="'+a+'" stroke="'+d+'" stroke-width="2" stroke-linejoin="round"/><path d="M156 8 L150 28 L140 20Z" fill="'+d+'"/><path d="M148 58 L150 26 L122 46Z" fill="#fff4ec"/>';
  return '<circle cx="54" cy="40" r="20" fill="'+a+'" stroke="'+d+'" stroke-width="2"/><circle cx="54" cy="42" r="11" fill="'+rosa+'"/><circle cx="146" cy="40" r="20" fill="'+a+'" stroke="'+d+'" stroke-width="2"/><circle cx="146" cy="42" r="11" fill="'+rosa+'"/>';
}
function cola(c,col){
  if(c.esp==="gato")return '<path d="M146 168 Q192 160 184 112 Q180 96 170 104 Q178 140 142 150Z" fill="'+col[1]+'" stroke="'+col[2]+'" stroke-width="2"/>';
  if(c.esp==="conejo")return '<circle cx="152" cy="168" r="16" fill="#fff" stroke="'+col[1]+'" stroke-width="2"/>';
  if(c.esp==="zorro")return '<path d="M140 170 Q200 172 192 118 Q188 98 172 112 Q176 148 136 152Z" fill="'+col[1]+'" stroke="'+col[2]+'" stroke-width="2"/><path d="M190 120 Q188 100 174 110 Q180 118 190 120Z" fill="#fff"/>';
  return '<circle cx="150" cy="172" r="10" fill="'+col[1]+'"/>';
}
function rasgoAtras(c){
  if(c.rasgo==="hada")return '<g opacity=".85"><ellipse cx="44" cy="126" rx="30" ry="18" transform="rotate(-30 44 126)" fill="#e6f7ff" stroke="#9fd6f2" stroke-width="2"/><ellipse cx="156" cy="126" rx="30" ry="18" transform="rotate(30 156 126)" fill="#e6f7ff" stroke="#9fd6f2" stroke-width="2"/>'+
    '<ellipse cx="48" cy="152" rx="18" ry="11" transform="rotate(20 48 152)" fill="#fff0fa" stroke="#f3b6d8" stroke-width="2"/><ellipse cx="152" cy="152" rx="18" ry="11" transform="rotate(-20 152 152)" fill="#fff0fa" stroke="#f3b6d8" stroke-width="2"/></g>';
  if(c.rasgo==="dragon")return '<path d="M58 132 L18 104 L26 126 L10 128 L30 142 L22 154 Z" fill="#b49cf0" stroke="#7d62c9" stroke-width="2" stroke-linejoin="round"/><path d="M142 132 L182 104 L174 126 L190 128 L170 142 L178 154 Z" fill="#b49cf0" stroke="#7d62c9" stroke-width="2" stroke-linejoin="round"/>';
  return '';
}
function rasgoFrente(c){
  if(c.rasgo==="unicornio"){var g=uid(); return '<defs><linearGradient id="'+g+'" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd1e8"/><stop offset=".5" stop-color="#fff3b0"/><stop offset="1" stop-color="#c7f0ff"/></linearGradient></defs>'+
    '<path d="M88 40 L100 0 L112 40Z" fill="url(#'+g+')" stroke="#e7a8c8" stroke-width="1.5" stroke-linejoin="round"/><path d="M92 30 L108 26 M94 18 L106 14" stroke="#e7a8c8" stroke-width="1.5"/>';}
  if(c.rasgo==="estrella")return '<path d="M100 36 l5 10 11 2 -8 8 2 11 -10 -5 -10 5 2 -11 -8 -8 11 -2z" fill="#ffe066" stroke="#f5b700" stroke-width="1.5" stroke-linejoin="round"/>'+
    '<g fill="#ffe066"><circle cx="30" cy="70" r="3"/><circle cx="172" cy="60" r="4"/><circle cx="178" cy="150" r="2.5"/></g>';
  if(c.rasgo==="dragon")return '<path d="M84 30 L90 14 L96 28Z M104 28 L110 14 L116 30Z" fill="#b49cf0" stroke="#7d62c9" stroke-width="1.5" stroke-linejoin="round"/>';
  if(c.rasgo==="hada")return '<g fill="#fff59d"><circle cx="34" cy="80" r="2.5"/><circle cx="168" cy="72" r="3"/><circle cx="26" cy="112" r="2"/></g>';
  return '';
}
/* una criatura de peluche; Lila es la foto de portada */
function criatura(c,o){
  o=o||{}; if(typeof c==="string")c=L.POR_ID[c];
  if(c.foto)return '<img class="lp-foto'+(o.gesto==="duerme"?" duerme":"")+'" src="'+c.foto+'" alt="'+c.nom+'" draggable="false">';
  var col=L.COLORES[c.col], g=uid(), gb=uid(), sud=SUDADERA[c.col]||"#e8f4ff";
  var s='<defs><radialGradient id="'+g+'" cx="45%" cy="38%" r="65%"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="'+col[0]+'"/><stop offset="1" stop-color="'+col[1]+'"/></radialGradient>'+
    '<linearGradient id="'+gb+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+sud+'"/><stop offset="1" stop-color="'+sombra(sud,.88)+'"/></linearGradient></defs>';
  s+='<ellipse cx="100" cy="190" rx="58" ry="8" fill="rgba(80,60,120,.18)"/>';
  s+=rasgoAtras(c)+cola(c,col);
  /* el cuerpo con su sudadera */
  s+='<ellipse cx="100" cy="152" rx="52" ry="40" fill="url(#'+g+')"/>';
  s+='<path d="M54 150 Q56 118 100 116 Q144 118 146 150 L142 178 Q100 190 58 178Z" fill="url(#'+gb+')" stroke="'+sombra(sud,.8)+'" stroke-width="2"/>';
  s+='<path d="M92 122 L92 146 M108 122 L108 146" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><circle cx="92" cy="148" r="2.5" fill="#fff"/><circle cx="108" cy="148" r="2.5" fill="#fff"/>';
  s+='<path d="M70 150 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="#ffd166"/><path d="M128 156 c-4 -6 -12 -2 -8 4 l8 7 8 -7 c4 -6 -4 -10 -8 -4z" fill="#ff8fab"/>';
  /* patitas con almohadillas */
  [78,122].forEach(function(x){s+='<ellipse cx="'+x+'" cy="180" rx="17" ry="12" fill="'+col[0]+'" stroke="'+col[1]+'" stroke-width="2"/><ellipse cx="'+x+'" cy="183" rx="6" ry="4.5" fill="#f7a8c4"/>'+
    '<circle cx="'+(x-8)+'" cy="176" r="2.6" fill="#f7a8c4"/><circle cx="'+x+'" cy="174" r="2.6" fill="#f7a8c4"/><circle cx="'+(x+8)+'" cy="176" r="2.6" fill="#f7a8c4"/>';});
  /* la cabeza grande y esponjosa */
  s+=orejas(c,col);
  s+='<path d="'+pelusa(100,90,62,44,3.2)+'" fill="url(#'+g+')" stroke="'+col[1]+'" stroke-width="1.5" stroke-linejoin="round"/>';
  if(c.esp==="zorro")s+='<path d="M100 132 Q66 132 56 104 Q80 112 100 98 Q120 112 144 104 Q134 132 100 132Z" fill="#fff8f2" opacity=".9"/>';
  s+=rasgoFrente(c);
  s+=ojos(o.gesto);
  s+='<ellipse cx="58" cy="116" rx="11" ry="7" fill="#ff9ec2" opacity=".55"/><ellipse cx="142" cy="116" rx="11" ry="7" fill="#ff9ec2" opacity=".55"/>';
  s+='<path d="M95 110 Q100 106 105 110 Q102 115 100 115 Q98 115 95 110Z" fill="#f48fb1"/>';
  s+=o.gesto==="come"?'<ellipse cx="100" cy="124" rx="7" ry="6" fill="#c2185b"/>':o.gesto==="wow"?'<ellipse cx="100" cy="124" rx="5" ry="6" fill="#c2185b"/>':'<path d="M90 118 Q95 124 100 118 Q105 124 110 118" stroke="#4a3426" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  if(c.esp==="gato"||c.esp==="zorro")s+='<g stroke="#fff" stroke-width="1.5" opacity=".8"><path d="M40 108 L64 112 M40 118 L64 116 M160 108 L136 112 M160 118 L136 116"/></g>';
  return '<svg class="lp-svg" viewBox="0 0 200 200" role="img" aria-label="'+c.nom+'">'+s+'</svg>';
}
function sombra(hex,f){var n=parseInt(hex.slice(1),16); return "rgb("+Math.round((n>>16)*f)+","+Math.round(((n>>8)&255)*f)+","+Math.round((n&255)*f)+")";}

/* ---------- el huevo sorpresa ---------- */
var TONOS=[["#ffe6f0","#f7b6cf"],["#e3f3ff","#a9d6f7"],["#e3fbf1","#a8e6cc"],["#fff6d6","#f7e08c"],["#efe6ff","#cbb6f2"],["#fff0e3","#fbc8a1"],["#fff7c2","#ffd54f"]];
function huevo(tono,calor,grietas){
  var t=TONOS[tono%TONOS.length], g=uid(), s='<defs><radialGradient id="'+g+'" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="'+t[0]+'"/><stop offset="1" stop-color="'+t[1]+'"/></radialGradient></defs>';
  if(calor>=40)s+='<ellipse cx="100" cy="112" rx="'+f1(70+calor*0.15)+'" ry="'+f1(84+calor*0.15)+'" fill="rgba(255,214,102,'+f1(Math.min(0.45,calor/250))+')"/>';
  s+='<ellipse cx="100" cy="192" rx="46" ry="7" fill="rgba(80,60,120,.18)"/>';
  s+='<path d="M100 22 C146 22 162 96 162 128 C162 166 134 190 100 190 C66 190 38 166 38 128 C38 96 54 22 100 22Z" fill="url(#'+g+')" stroke="'+t[1]+'" stroke-width="2.5"/>';
  s+='<g fill="#fff" opacity=".85"><path d="M78 80 l3 6 6 1 -4 4 1 6 -6 -3 -6 3 1 -6 -4 -4 6 -1z"/><circle cx="124" cy="104" r="6"/><circle cx="88" cy="140" r="4"/><path d="M128 150 l2 4 4 1 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -1z"/></g>';
  s+='<ellipse cx="80" cy="60" rx="10" ry="18" transform="rotate(20 80 60)" fill="#fff" opacity=".5"/>';
  if(grietas>0)s+='<path d="M60 110 L76 100 L86 114 L100 98 L112 116 L126 102 L140 112" stroke="#8d6e63" stroke-width="3" fill="none" stroke-linejoin="round"/>';
  if(grietas>1)s+='<path d="M70 140 L84 130 L94 146 L108 132 L122 148 L134 136" stroke="#8d6e63" stroke-width="3" fill="none" stroke-linejoin="round"/>';
  if(grietas>2)s+='<path d="M90 60 L98 74 L106 62 L114 76" stroke="#8d6e63" stroke-width="3" fill="none" stroke-linejoin="round"/>';
  return '<svg class="lp-svg lp-huevo-svg" viewBox="0 0 200 200" role="img" aria-label="huevo sorpresa">'+s+'</svg>';
}

/* ---------- la habitación (para las criaturas dibujadas) ---------- */
function habitacion(){
  var g=uid(), p=uid();
  return '<svg class="lp-fondo" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="'+g+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9e2fb"/><stop offset="1" stop-color="#f8e9f3"/></linearGradient>'+
    '<linearGradient id="'+p+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e3ef"/><stop offset="1" stop-color="#e3d8f6"/></linearGradient></defs>'+
    '<rect width="400" height="300" fill="url(#'+g+')"/><rect y="210" width="400" height="90" fill="url(#'+p+')"/><path d="M0 210 H400" stroke="#d9c9ef" stroke-width="3"/>'+
    '<rect x="290" y="30" width="80" height="100" rx="10" fill="#fffaf0" stroke="#e7d7f5" stroke-width="5"/><rect x="296" y="36" width="68" height="88" rx="6" fill="#dff1ff"/><path d="M330 36 V124 M296 80 H364" stroke="#fff" stroke-width="4"/>'+
    '<path d="M282 24 Q300 90 286 140 L276 140 L276 24Z" fill="#f9c6d8"/><path d="M378 24 Q360 90 374 140 L384 140 L384 24Z" fill="#f9c6d8"/>'+
    '<rect x="160" y="26" width="70" height="46" rx="6" fill="#fff" stroke="#e8dcf6" stroke-width="4"/><path d="M172 64 Q195 36 218 64" fill="none" stroke="#ff9eb5" stroke-width="5"/><path d="M178 64 Q195 44 212 64" fill="none" stroke="#ffd36e" stroke-width="5"/><path d="M184 64 Q195 52 206 64" fill="none" stroke="#8fd3ff" stroke-width="5"/>'+
    '<rect x="16" y="70" width="90" height="10" rx="4" fill="#f3d6b6"/><rect x="16" y="140" width="90" height="10" rx="4" fill="#f3d6b6"/>'+
    '<rect x="24" y="44" width="10" height="26" rx="2" fill="#a9d6f7"/><rect x="36" y="48" width="10" height="22" rx="2" fill="#f7b6cf"/><rect x="48" y="40" width="12" height="30" rx="2" fill="#cbb6f2"/><text x="78" y="68" font-size="24">🧸</text>'+
    '<rect x="26" y="116" width="22" height="22" rx="4" fill="#f7e68c"/><rect x="52" y="120" width="18" height="18" rx="4" fill="#a8e6cc"/><text x="76" y="136" font-size="20">🪴</text>'+
    '<g opacity=".95"><rect x="300" y="240" width="34" height="34" rx="6" fill="#f7b6cf"/><rect x="340" y="250" width="28" height="28" rx="6" fill="#a9d6f7"/><rect x="318" y="214" width="28" height="28" rx="6" fill="#f7e68c"/></g>'+
    '<rect x="20" y="246" width="30" height="30" rx="6" fill="#cbb6f2"/><text x="56" y="276" font-size="26">🧸</text></svg>';
}

/* ---------- la tarta astral ---------- */
function tarta(n,d,tam){
  var r=44, c=50, s='<circle cx="50" cy="50" r="48" fill="#fff3f8" stroke="#f3b6d0" stroke-width="2"/>';
  for(var i=0;i<d;i++){var a0=-Math.PI/2+i*2*Math.PI/d, a1=a0+2*Math.PI/d, gran=(a1-a0)>Math.PI?1:0;
    s+=d===1?'<circle cx="50" cy="50" r="'+r+'" fill="#ffc1d9"/>':'<path d="M50 50 L'+f1(c+r*Math.cos(a0))+' '+f1(c+r*Math.sin(a0))+' A'+r+' '+r+' 0 '+gran+' 1 '+f1(c+r*Math.cos(a1))+' '+f1(c+r*Math.sin(a1))+'Z" fill="'+(i<n?"#f5f5f5":"#ffc1d9")+'" stroke="#fff" stroke-width="2.5"/>';
    if(i>=n){var am=(a0+a1)/2; s+='<circle cx="'+f1(c+r*0.62*Math.cos(am))+'" cy="'+f1(c+r*0.62*Math.sin(am))+'" r="4" fill="#e53950"/>';}}
  s+='<circle cx="50" cy="50" r="5" fill="#ffe066"/>';
  return '<svg class="lp-tarta" viewBox="0 0 100 100" width="'+(tam||90)+'" height="'+(tam||90)+'" aria-label="tarta">'+s+'</svg>';
}

/* ---------- la Aldea del Gran Árbol ---------- */
function aldea(){
  var g=uid();
  return '<svg class="lp-aldea-svg" viewBox="0 0 400 520" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><linearGradient id="'+g+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3ff"/><stop offset=".6" stop-color="#f3e8ff"/><stop offset="1" stop-color="#fde6f1"/></linearGradient></defs>'+
    '<rect width="400" height="520" fill="url(#'+g+')"/>'+
    '<g fill="#fff" opacity=".9"><ellipse cx="70" cy="70" rx="44" ry="16"/><ellipse cx="96" cy="60" rx="26" ry="16"/><ellipse cx="320" cy="50" rx="40" ry="14"/><ellipse cx="342" cy="40" rx="22" ry="14"/></g>'+
    '<path d="M180 520 Q186 380 170 300 L230 300 Q214 380 220 520Z" fill="#b48a6a"/><path d="M190 520 Q194 400 186 320" stroke="#9a7254" stroke-width="4" fill="none"/>'+
    '<path d="M176 330 Q120 300 70 300" stroke="#b48a6a" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M224 300 Q284 250 330 248" stroke="#b48a6a" stroke-width="16" fill="none" stroke-linecap="round"/>'+
    '<g fill="#9be7b0"><circle cx="200" cy="170" r="110"/><circle cx="120" cy="210" r="70"/><circle cx="290" cy="200" r="74"/><circle cx="200" cy="90" r="70"/></g>'+
    '<g fill="#7fd99a" opacity=".7"><circle cx="160" cy="140" r="40"/><circle cx="250" cy="120" r="34"/><circle cx="230" cy="230" r="44"/></g>'+
    '<g font-size="16"><text x="110" y="160">🌸</text><text x="270" y="170">✨</text><text x="190" y="80">🌟</text><text x="150" y="250">🍎</text><text x="300" y="240">🌼</text></g>'+
    '<path d="M28 300 Q70 288 112 300 L106 312 Q70 304 34 312Z" fill="#c69c7c"/><path d="M290 248 Q330 236 370 248 L364 260 Q330 252 296 260Z" fill="#c69c7c"/>'+
    '<g fill="#fff" opacity=".95"><ellipse cx="330" cy="250" rx="46" ry="12"/></g>'+
    '<g><polygon points="60,470 74,430 88,470" fill="#c7b8ff"/><polygon points="84,476 100,420 116,476" fill="#a4e4ff"/><polygon points="300,478 314,440 328,478" fill="#ffc6e0"/><polygon points="322,478 340,428 358,478" fill="#c7b8ff"/></g>'+
    '<path d="M0 480 Q200 456 400 480 L400 520 L0 520Z" fill="#c7e9b0"/></svg>';
}

window.AxLuminaDibujos={criatura:criatura,huevo:huevo,habitacion:habitacion,tarta:tarta,aldea:aldea};
})();
