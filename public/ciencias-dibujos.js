/* ===========================================================
   THE FINAL TEST · Ciencias · los dibujos
   -----------------------------------------------------------
   Diagramas en SVG (planta, cuerpo humano, célula, ciclo del agua,
   circuito, capas de la Tierra, átomo) con una flecha que señala una
   parte, y los laboratorios interactivos: el agua que se congela o
   hierve, el circuito con materiales, el auto y su velocidad, y el
   indicador de repollo morado.
     AxCienciasDibujos.diagrama(nombre, parte)
     AxCienciasDibujos.agua(t) · circuito(material, cerrado) · pista(v) · vaso(ph)
   =========================================================== */
(function(){
"use strict";
var C=window.AxCiencias;
if(!C)return;
var UID=0;
function uid(){return "cd"+(++UID);}
function svg(w,h,inner,cls,label){return '<svg class="cd-svg '+(cls||"")+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+(label||"dibujo")+'">'+inner+'</svg>';}
function f1(x){return Math.round(x*10)/10;}

/* ---------- diagramas ---------- */
var DIB={
  planta:function(){var g=uid();
    return '<defs><linearGradient id="'+g+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3f6ff"/><stop offset="1" stop-color="#fffbe6"/></linearGradient></defs>'+
      '<rect width="240" height="150" fill="url(#'+g+')"/><rect y="150" width="240" height="50" fill="#a1745a"/><rect y="150" width="240" height="6" fill="#7cb342"/>'+
      '<g stroke="#e8d3b0" stroke-width="3.5" fill="none" stroke-linecap="round"><path d="M120 152 C118 168 104 176 96 192"/><path d="M120 152 C122 170 136 178 146 194"/><path d="M120 152 L121 196"/><path d="M108 178 L94 182"/><path d="M134 180 L150 178"/></g>'+
      '<path d="M120 152 L120 54" stroke="#3e9a3e" stroke-width="7" stroke-linecap="round"/>'+
      '<ellipse cx="156" cy="106" rx="28" ry="11" transform="rotate(-24 156 106)" fill="#66bb6a"/><path d="M122 116 L180 94" stroke="#2e7d32" stroke-width="1.5"/>'+
      '<ellipse cx="86" cy="124" rx="26" ry="10" transform="rotate(24 86 124)" fill="#66bb6a"/>'+
      '<g fill="#f06292">'+[0,60,120,180,240,300].map(function(a){var r=a*Math.PI/180; return '<circle cx="'+f1(120+12*Math.cos(r))+'" cy="'+f1(42+12*Math.sin(r))+'" r="10"/>';}).join("")+'</g><circle cx="120" cy="42" r="8" fill="#ffd54f"/>';},
  cuerpo:function(){
    return '<rect width="240" height="200" fill="#f3f8ff"/>'+
      '<path d="M84 64 Q120 52 156 64 L166 120 Q170 190 120 194 Q70 190 74 120Z" fill="#ffe0c2" stroke="#e0a77c" stroke-width="2"/>'+
      '<path d="M84 66 L54 140" stroke="#ffe0c2" stroke-width="16" stroke-linecap="round"/><path d="M156 66 L186 140" stroke="#ffe0c2" stroke-width="16" stroke-linecap="round"/>'+
      '<circle cx="120" cy="32" r="25" fill="#ffe0c2" stroke="#e0a77c" stroke-width="2"/>'+
      '<path d="M104 30 Q104 16 120 16 Q136 16 136 30 Q136 40 120 40 Q104 40 104 30Z" fill="#f48fb1" stroke="#d81b60" stroke-width="1"/><path d="M112 22 Q116 30 112 36 M120 18 L120 40 M128 22 Q124 30 128 36" stroke="#d81b60" stroke-width="1" fill="none"/>'+
      '<ellipse cx="102" cy="94" rx="13" ry="21" fill="#ef9a9a" stroke="#c62828" stroke-width="1"/><ellipse cx="140" cy="94" rx="12" ry="20" fill="#ef9a9a" stroke="#c62828" stroke-width="1"/>'+
      '<path d="M128 112 C114 102 116 92 123 94 C126 95 128 98 128 100 C128 98 130 95 133 94 C140 92 142 102 128 112Z" fill="#e53935"/>'+
      '<ellipse cx="136" cy="133" rx="15" ry="9" transform="rotate(-20 136 133)" fill="#ffb74d" stroke="#ef6c00" stroke-width="1"/>'+
      '<path d="M100 150 Q120 142 140 150 Q148 160 136 166 Q120 172 104 166 Q92 160 100 150 M106 156 Q120 150 134 156 M108 162 Q120 158 132 162" fill="#ce93d8" stroke="#8e24aa" stroke-width="1.2"/>';},
  celula:function(){
    return '<rect width="240" height="200" fill="#f5fff5"/>'+
      '<rect x="20" y="20" width="200" height="160" rx="20" fill="#c8e6c9" stroke="#2e7d32" stroke-width="7"/>'+
      '<rect x="32" y="32" width="176" height="136" rx="14" fill="#eaf8ea" stroke="#7cb342" stroke-width="2.5" stroke-dasharray="6 3"/>'+
      '<circle cx="120" cy="96" r="23" fill="#9575cd" stroke="#5e35b1" stroke-width="2"/><circle cx="125" cy="91" r="7" fill="#4527a0"/>'+
      '<g><ellipse cx="74" cy="62" rx="17" ry="8" fill="#ff8a65" stroke="#d84315" stroke-width="1.2"/><path d="M60 62 l4 -4 l4 8 l4 -8 l4 8 l4 -8 l4 8 l4 -4" stroke="#bf360c" stroke-width="1" fill="none"/></g>'+
      '<g fill="#43a047" stroke="#1b5e20" stroke-width="1"><ellipse cx="178" cy="140" rx="13" ry="7"/><ellipse cx="70" cy="140" rx="12" ry="6" transform="rotate(20 70 140)"/><ellipse cx="160" cy="152" rx="10" ry="5"/></g>';},
  ciclo:function(){var g=uid();
    return '<defs><linearGradient id="'+g+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#e8f7ff"/></linearGradient></defs>'+
      '<rect width="240" height="200" fill="url(#'+g+')"/>'+
      '<circle cx="28" cy="28" r="17" fill="#ffd54f"/>'+
      '<polygon points="110,190 178,62 240,190" fill="#8d6e63"/><polygon points="164,88 178,62 192,88 184,84 178,90 172,84" fill="#fff"/>'+
      '<path d="M0 150 Q30 142 60 150 T120 150 L120 200 L0 200Z" fill="#1e88e5"/>'+
      '<path d="M176 118 Q166 140 156 160 Q140 174 110 172" stroke="#29b6f6" stroke-width="6" fill="none" stroke-linecap="round"/>'+
      '<g fill="#fff"><ellipse cx="140" cy="40" rx="34" ry="14"/><ellipse cx="160" cy="32" rx="22" ry="14"/><ellipse cx="184" cy="42" rx="22" ry="12"/></g>'+
      '<g stroke="#1e88e5" stroke-width="2.5" stroke-linecap="round"><line x1="168" y1="62" x2="164" y2="76"/><line x1="180" y1="64" x2="176" y2="80"/><line x1="192" y1="62" x2="188" y2="76"/><line x1="174" y1="86" x2="170" y2="100"/><line x1="188" y1="88" x2="184" y2="102"/></g>'+
      '<g stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"><path d="M40 140 q-6 -10 0 -20 q6 -10 0 -20"/><path d="M60 140 q-6 -10 0 -20 q6 -10 0 -20"/><path d="M80 140 q-6 -10 0 -20 q6 -10 0 -20"/></g>';},
  circuito:function(){return circuitoSVG(null,true,true,false);},
  tierra:function(){
    return '<rect width="240" height="200" fill="#0d1b3e"/>'+
      '<circle cx="120" cy="100" r="98" fill="#6d4c41"/><circle cx="120" cy="100" r="90" fill="#ef6c00"/><circle cx="120" cy="100" r="52" fill="#ffa726"/><circle cx="120" cy="100" r="25" fill="#fff59d"/>'+
      '<path d="M120 100 L120 2 A98 98 0 0 0 22 100Z" fill="#2e7d32" opacity=".9"/><path d="M120 100 L120 2 A98 98 0 0 0 22 100Z" fill="none" stroke="#1b5e20" stroke-width="2"/>'+
      '<g fill="#1e88e5" opacity=".9"><path d="M60 60 q10 -10 22 -4 q-6 12 -18 10z"/><path d="M40 92 q12 -4 20 6 q-10 6 -20 0z"/></g>';},
  atomo:function(){
    var o='<rect width="240" height="200" fill="#0f1b33"/>';
    [0,60,120].forEach(function(a){o+='<ellipse cx="120" cy="100" rx="86" ry="30" transform="rotate('+a+' 120 100)" fill="none" stroke="#64b5f6" stroke-width="1.6"/>';});
    [[112,94,"p"],[126,92,"n"],[118,106,"p"],[128,106,"n"],[106,104,"n"],[120,98,"p"]].forEach(function(c){o+='<circle cx="'+c[0]+'" cy="'+c[1]+'" r="7" fill="'+(c[2]==="p"?"#ef5350":"#b0bec5")+'" stroke="#263238" stroke-width="1"/>'+(c[2]==="p"?'<text x="'+c[0]+'" y="'+(c[1]+3)+'" font-size="8" text-anchor="middle" fill="#fff" font-weight="700">+</text>':'');});
    [[206,100],[77,63],[163,137]].forEach(function(e){o+='<circle cx="'+e[0]+'" cy="'+e[1]+'" r="6" fill="#42a5f5" stroke="#fff" stroke-width="1.5"/><text x="'+e[0]+'" y="'+(e[1]+3)+'" font-size="9" text-anchor="middle" fill="#fff" font-weight="700">−</text>';});
    return o;}
};
/* la flecha que señala una parte */
function flecha(x,y){
  var dx=x<120?-1:1, sx=Math.max(10,Math.min(230,x+dx*40)), sy=y-38<10?y+38:y-38, a=Math.atan2(y-sy,x-sx), ex=x-Math.cos(a)*15, ey=y-Math.sin(a)*15;
  return '<g class="cd-flecha"><circle cx="'+x+'" cy="'+y+'" r="13" fill="none" stroke="#ff1744" stroke-width="3.5"/>'+
    '<line x1="'+f1(sx)+'" y1="'+f1(sy)+'" x2="'+f1(ex)+'" y2="'+f1(ey)+'" stroke="#ff1744" stroke-width="4" stroke-linecap="round"/>'+
    '<path d="M'+f1(ex)+' '+f1(ey)+' l'+f1(-Math.cos(a-0.5)*11)+' '+f1(-Math.sin(a-0.5)*11)+' M'+f1(ex)+' '+f1(ey)+' l'+f1(-Math.cos(a+0.5)*11)+' '+f1(-Math.sin(a+0.5)*11)+'" stroke="#ff1744" stroke-width="4" stroke-linecap="round"/>'+
    '<circle cx="'+f1(sx)+'" cy="'+f1(sy)+'" r="10" fill="#ff1744"/><text x="'+f1(sx)+'" y="'+f1(sy+4.5)+'" font-size="13" font-weight="900" text-anchor="middle" fill="#fff">?</text></g>';
}
function diagrama(nombre,parte){var d=C.DIAG[nombre], f=DIB[nombre]; if(!f)return ""; var p=parte&&d.pos[parte];
  return svg(240,200,f()+(p?flecha(p[0],p[1]):''),"cd-diagrama","diagrama: "+nombre);}

/* ---------- laboratorio: el agua ---------- */
function agua(t){
  var estado=t<=0?"sólido":t>=100?"gas":"líquido", o='<rect width="240" height="200" fill="#f4f9ff"/>';
  /* el vaso */
  o+='<path d="M50 40 L60 180 Q62 188 70 188 L150 188 Q158 188 160 180 L170 40" fill="rgba(255,255,255,.7)" stroke="#78909c" stroke-width="3"/>';
  if(t<=0){[[70,150],[98,156],[126,148],[84,124],[114,128],[100,104]].forEach(function(c){o+='<rect x="'+c[0]+'" y="'+c[1]+'" width="26" height="24" rx="4" fill="#b3e5fc" stroke="#4fc3f7" stroke-width="2" transform="rotate('+((c[0]%7)-3)*4+' '+(c[0]+13)+' '+(c[1]+12)+')"/>';});
    o+='<text x="56" y="34" font-size="12">❄️</text><text x="152" y="34" font-size="12">❄️</text>';}
  else{var nivel=t>=100?120:96; o+='<path d="M'+f1(50+10*(nivel-40)/140)+' '+nivel+' L'+f1(170-10*(nivel-40)/140)+' '+nivel+' L160 180 Q158 188 150 188 L70 188 Q62 188 60 180Z" fill="'+(t>60?"#4fc3f7":"#29b6f6")+'" opacity=".85"/>';
    if(t>=100){for(var i=0;i<9;i++){o+='<circle class="cd-burbuja" style="--d:'+(i*0.17).toFixed(2)+'s" cx="'+(72+i*10)+'" cy="'+(178-(i%3)*14)+'" r="'+(3+i%3)+'" fill="#e1f5fe"/>';}
      o+='<g class="cd-vapor" stroke="#b0bec5" stroke-width="4" fill="none" stroke-linecap="round"><path d="M80 36 q-8 -10 0 -18 q8 -8 0 -16"/><path d="M110 36 q-8 -10 0 -18 q8 -8 0 -16"/><path d="M140 36 q-8 -10 0 -18 q8 -8 0 -16"/></g>';}}
  /* el termómetro */
  var h=Math.max(0,Math.min(1,(t+20)/140));
  o+='<rect x="196" y="24" width="16" height="150" rx="8" fill="#fff" stroke="#90a4ae" stroke-width="2"/><circle cx="204" cy="180" r="12" fill="#e53935"/><rect x="200" y="'+f1(174-146*h)+'" width="8" height="'+f1(146*h+6)+'" fill="#e53935"/>';
  [[-20,"-20"],[0,"0"],[50,"50"],[100,"100"]].forEach(function(m){var y=f1(174-146*((m[0]+20)/140)); o+='<line x1="214" y1="'+y+'" x2="222" y2="'+y+'" stroke="#546e7a" stroke-width="1.5"/><text x="224" y="'+(y+4)+'" font-size="9" fill="#546e7a">'+m[1]+'</text>';});
  return {svg:svg(240,200,o,"cd-agua","vaso con agua a "+t+" grados"),estado:estado};
}

/* ---------- laboratorio: el circuito ---------- */
function circuitoSVG(material,cerrado,diagrama,encendido){
  var g=uid(), o='<defs><radialGradient id="'+g+'"><stop offset="0" stop-color="#fffde7"/><stop offset=".5" stop-color="#ffee58"/><stop offset="1" stop-color="rgba(255,235,59,0)"/></radialGradient></defs><rect width="240" height="200" fill="#f7f9fc"/>';
  var cable='stroke="#455a64" stroke-width="4" fill="none" stroke-linecap="round"';
  o+='<path d="M40 82 L40 30 L104 30" '+cable+'/><path d="M136 30 L200 30 L200 84" '+cable+'/><path d="M200 116 L200 170 '+(diagrama?'L40 170':'L148 170')+'" '+cable+'/>'+(diagrama?'':'<path d="M92 170 L40 170" '+cable+'/>')+'<path d="M40 170 L40 120" '+cable+'/>';
  /* el interruptor */
  o+='<circle cx="104" cy="30" r="4" fill="#263238"/><circle cx="136" cy="30" r="4" fill="#263238"/>'+(cerrado?'<line x1="104" y1="30" x2="136" y2="30" stroke="#263238" stroke-width="5" stroke-linecap="round"/>':'<line x1="104" y1="30" x2="132" y2="12" stroke="#263238" stroke-width="5" stroke-linecap="round"/>');
  /* la pila */
  o+='<rect x="26" y="82" width="28" height="38" rx="4" fill="#ffca28" stroke="#f57f17" stroke-width="2"/><rect x="34" y="78" width="12" height="5" fill="#9e9e9e"/><text x="40" y="98" font-size="11" text-anchor="middle" font-weight="900" fill="#5d4037">+</text><text x="40" y="115" font-size="12" text-anchor="middle" font-weight="900" fill="#5d4037">−</text>';
  /* el foco */
  if(encendido)o+='<circle cx="200" cy="96" r="38" fill="url(#'+g+')"/>';
  o+='<circle cx="200" cy="94" r="15" fill="'+(encendido?"#fff59d":"#eceff1")+'" stroke="#90a4ae" stroke-width="2"/><path d="M194 100 l3 -8 l3 6 l3 -6 l3 8" stroke="'+(encendido?"#ff8f00":"#90a4ae")+'" stroke-width="1.5" fill="none"/><rect x="193" y="108" width="14" height="10" rx="2" fill="#9e9e9e"/>';
  /* el hueco para probar materiales */
  if(!diagrama)o+='<rect x="96" y="156" width="48" height="28" rx="6" fill="'+(material?"#fff":"#fafafa")+'" stroke="#90a4ae" stroke-dasharray="'+(material?"0":"4 3")+'" stroke-width="2"/><text x="120" y="'+(material?177:175)+'" font-size="'+(material?18:10)+'" text-anchor="middle" fill="#90a4ae">'+(material?material:"¿material?")+'</text>';
  return svg(240,200,o,"cd-circuito","circuito eléctrico");
}
function circuito(material,cerrado,conduce){return circuitoSVG(material,cerrado,false,!!(material&&cerrado&&conduce));}

/* ---------- laboratorio: la velocidad ---------- */
function pista(v){
  var dur=v>0?Math.max(0.6,Math.min(12,60/v)):0;
  return '<div class="cd-pista"><span class="cd-auto" style="'+(v>0?'animation-duration:'+dur.toFixed(2)+'s':'animation:none')+'">🏎️</span><i></i></div>';
}

/* ---------- laboratorio: el indicador de repollo morado ---------- */
function colorPH(ph){return ph<=3?"#e53935":ph<=5?"#ec407a":ph<=7.5?"#8e24aa":ph<=9.5?"#3949ab":ph<=11?"#43a047":"#fdd835";}
function vaso(ph){
  var o='<rect width="200" height="170" fill="#f8f5ff"/><path d="M50 30 L58 156 Q60 162 66 162 L134 162 Q140 162 142 156 L150 30" fill="rgba(255,255,255,.8)" stroke="#78909c" stroke-width="3"/>';
  o+='<path d="M54 70 L146 70 L142 156 Q140 162 134 162 L66 162 Q60 162 58 156Z" fill="'+(ph==null?"#8e24aa":colorPH(ph))+'" opacity=".85"/>';
  o+='<ellipse cx="80" cy="86" rx="6" ry="16" fill="#fff" opacity=".35"/>';
  return svg(200,170,o,"cd-vaso","vaso con indicador");
}

window.AxCienciasDibujos={diagrama:diagrama,agua:agua,circuito:circuito,pista:pista,vaso:vaso,colorPH:colorPH};
})();
