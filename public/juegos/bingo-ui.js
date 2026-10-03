/* ===========================================================
   THE FINAL TEST · Bingo (pantalla)
   En el teléfono, los cartones (se marcan solos con cada bola), la
   última bola en grande y, en el modo cantado, el botón ¡Línea! o
   ¡Bingo!. Quien organiza saca las bolas (o pausa el ritmo) desde su
   teléfono. El proyector muestra la bola en grande, el tablero de las
   75 y a los ganadores con su cartón; con «Voz» canta cada bola.
   =========================================================== */
(function(){
"use strict";
var S=window.AxSala, J=window.AxJuegos; if(!S||!J||!J.BINGO)return;
var B=J.BINGO, L=B.LETRAS;
function $(id){return document.getElementById(id);}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function reloj(h){return h?'<span class="jg-reloj" data-hasta="'+h+'"></span>':'';}
function col(n){return Math.floor((n-1)/15);}
function bola(n,cls){return n?'<span class="bg-bola L'+col(n)+(cls?' '+cls:'')+'"><small>'+B.letra(n)+'</small><b>'+n+'</b></span>':'<span class="bg-bola vacia'+(cls?' '+cls:'')+'"><b>?</b></span>';}
function salidas(g){var s={}; g.sacadas.forEach(function(n){s[n]=1;}); return s;}
function ultima(g){return g.sacadas[g.sacadas.length-1]||0;}
function premioTxt(g,ctx,p){var t=(g.modo==="largo"&&p==="linea")?g.premioLinea:ctx.sala.premio; return t?'🏆 '+esc(t):'';}
/* un cartón: cabecera B I N G O y 25 casillas; las de una línea completa, resaltadas */
function carton(c,sal,extra){
  var hechas={};
  B.LINEAS.forEach(function(l){ if(l.every(function(i){return c[i]===0||sal[c[i]];}))l.forEach(function(i){hechas[i]=1;}); });
  return '<div class="bg-carton'+(extra?' '+extra:'')+'"><div class="bg-cab">'+L.map(function(x,i){return '<span class="L'+i+'">'+x+'</span>';}).join("")+'</div>'+
    '<div class="bg-rej">'+c.map(function(n,i){var m=n===0||sal[n];
      return '<span class="bg-c'+(n===0?' libre':'')+(m?' m':'')+(hechas[i]?' linea':'')+'">'+(n===0?'★':n)+'</span>';}).join("")+'</div></div>';
}
function tablero(g){
  var sal=salidas(g), u=ultima(g);
  return '<div class="bg-tablero">'+L.map(function(x,c){var h='<span class="bg-tl L'+c+'">'+x+'</span>';
    for(var i=1;i<=15;i++){var n=c*15+i; h+='<span class="bg-tn'+(sal[n]?' s':'')+(n===u?' u':'')+'">'+n+'</span>';}
    return h;}).join("")+'</div>';
}
function ganadores(g,ctx,grande){
  var h="";
  g.premios.forEach(function(p){var gs=g.ganadores[p]; if(!gs||!gs.length)return;
    h+='<div class="bg-gana'+(grande?' grande':'')+'"><p><b>¡'+esc(g.nombres[p])+'!</b> '+gs.map(function(x){return esc(x.n)+(x.id===ctx.yo.id?' (tú)':'');}).join(", ")+
      ' <small>con la bola '+gs[0].bola+'</small></p>'+(premioTxt(g,ctx,p)?'<p class="bg-premio">'+premioTxt(g,ctx,p)+'</p>':'')+
      (grande||gs.some(function(x){return x.id===ctx.yo.id;})?'<div class="bg-cartones">'+gs.slice(0,grande?4:1).map(function(x){
        return x.cartones.map(function(c){return '<div class="bg-quien"><small>'+esc(x.n)+'</small>'+carton(c,salidas(g),"gana")+'</div>';}).join("");}).join("")+'</div>':'')+'</div>';});
  return h;
}
function estadoTxt(g){
  if(g.fase==="listos")return "¡Mira tu cartón! La primera bola sale enseguida";
  if(g.fin)return "Bingo terminado";
  var p=g.premio?g.nombres[g.premio]:"";
  return "Se juega: "+p+" · bola "+g.n+" de 75"+(g.pausa?" · en pausa":"")+(g.ventana?" · ¡alguien cantó!":"");
}
var vio={bola:0};
function jugador(el,g,ctx){
  var sal=salidas(g), u=ultima(g), nueva=!!u&&u!==vio.bola; vio.bola=u;   /* la bola recién salida rueda al entrar */
  var h='<div class="jg-turno'+(g.mis?' mio':'')+'"><span>'+esc(estadoTxt(g))+'</span>'+(g.fase==="listos"||(g.ritmo&&!g.pausa)?reloj(g.hasta):'')+'</div>';
  h+='<div class="bg-arriba">'+bola(u,"grande")+'<div class="bg-ult">'+g.sacadas.slice(-6,-1).reverse().map(function(n){return bola(n,"mini");}).join("")+'</div></div>';
  if(g.fase==="premio"||g.fin)h+=ganadores(g,ctx,false);
  else if(g.modo==="largo"&&g.premio&&premioTxt(g,ctx,g.premio))h+='<p class="bg-premio">Se juega '+esc(g.nombres[g.premio].toLowerCase())+': '+premioTxt(g,ctx,g.premio)+'</p>';
  if(g.host){
    h+='<div class="actions">'+(g.ritmo===0&&g.fase==="bolas"&&!g.ventana?'<button class="primary" id="bg-saca">🎱 Sacar bola</button>':'')+
      (g.ritmo&&g.fase!=="listos"&&!g.fin?'<button class="ghost" id="bg-pausa">'+(g.pausa?'▶ Reanudar':'⏸ Pausar')+'</button>':'')+
      '<a class="ghost" href="'+esc(location.origin+location.pathname+"?pantalla="+ctx.sala.code)+'" target="_blank" rel="noopener">Abrir en el proyector</a></div>'+
      '<p class="fine">'+g.total+(g.total===1?' jugador':' jugadores')+(g.casi?' · 🔥 '+g.casi+' a una bola':'')+'. '+(g.ritmo?'Sale una bola cada '+g.ritmo+' s.':'Tú sacas cada bola.')+'</p>';
  }
  if(g.mis){
    var cantar=g.cantar&&g.fase==="bolas"&&!g.fin;
    if(cantar)h+='<div class="actions bg-cantar">'+(g.cante?'<button class="primary" disabled>¡Cantaste! Comprobando…</button>':
      g.bloqueo?'<button class="primary" disabled>Cantaste en falso · espera '+reloj(g.bloqueo)+' s</button>':
      '<button class="primary" id="bg-canta">¡'+(g.premio==="bingo"?"BINGO":"LÍNEA")+'!</button>')+'</div>';
    h+='<div class="bg-cartones">'+g.mis.map(function(x,i){
      return '<div class="bg-quien"><small>'+(g.mis.length>1?'Cartón '+(i+1)+' · ':'')+(x.faltan==null?'':x.faltan===0?'<b>¡completo!</b>':x.faltan===1?'<b>¡te falta 1!</b>':'te faltan '+x.faltan)+'</small>'+carton(x.c,sal,x.faltan===1?"casi":"")+'</div>';}).join("")+'</div>'+
      (g.cantar?'<p class="fine">Modo cantado: cuando completes '+(g.premio==="bingo"?'el cartón':'una línea (fila, columna o diagonal)')+', pulsa el botón antes que nadie. Cantar en falso bloquea 10 s.</p>':
        '<p class="fine">Los números se marcan solos. Si completas '+(g.premio==="bingo"?'el cartón':'una línea (fila, columna o diagonal)')+', el premio es tuyo al momento.</p>');
  }else if(!g.host)h+='<p class="rt-hoy">Mira el bingo en la pantalla grande.</p>';
  if(el.getAttribute("data-h")===h)return; el.innerHTML=h; el.setAttribute("data-h",h);
  if($("bg-saca"))$("bg-saca").onclick=function(){this.disabled=true;ctx.envia({tipo:"bola"});};
  if($("bg-pausa"))$("bg-pausa").onclick=function(){ctx.envia({tipo:"pausa"});};
  if($("bg-canta"))$("bg-canta").onclick=function(){this.disabled=true;ctx.envia({tipo:"canta"});};
  if(nueva){var bg=el.querySelector(".bg-bola.grande"); if(bg)bg.classList.add("nueva"); if(navigator.vibrate)try{navigator.vibrate(40);}catch(e){}}
}
/* ---------- proyector, con voz opcional ---------- */
var voz={on:false,dicha:0,premio:""};
function di(t){try{if(!voz.on||!window.speechSynthesis)return; var u=new SpeechSynthesisUtterance(t); u.lang="es-ES"; u.rate=0.95; speechSynthesis.speak(u);}catch(e){}}
function pantalla(el,g,ctx){
  var u=ultima(g), nueva=!!u&&u!==voz.dicha;
  if(nueva){voz.dicha=u; di(B.letra(u)+" "+u);}
  var clavePremio=g.premios.map(function(p){return (g.ganadores[p]||[]).length;}).join(".");
  if(g.fase==="premio"&&voz.premio!==clavePremio){voz.premio=clavePremio; di("¡"+g.nombres[g.premios.filter(function(p){return g.ganadores[p];}).pop()]+"!");}
  var h=(g.fase==="premio"||g.fin?ganadores(g,ctx,true):'')+'<div class="bg-proy"><div class="bg-izq">'+bola(u,"enorme")+'<p class="bg-cuenta">Bola <b>'+g.n+'</b> de 75</p>'+
    '<p class="bg-estado">'+esc(estadoTxt(g))+'</p>'+(g.premio&&premioTxt(g,ctx,g.premio)?'<p class="bg-premio grande">'+premioTxt(g,ctx,g.premio)+'</p>':'')+
    (g.casi&&g.fase==="bolas"?'<p class="bg-casi">🔥 '+g.casi+(g.casi===1?' persona está':' personas están')+' a una bola</p>':'')+
    '<p class="fine">'+g.total+(g.total===1?' jugador':' jugadores')+'</p>'+
    '<button type="button" class="ghost" id="bg-voz">'+(voz.on?'🔊 Voz activada':'🔇 Activar voz')+'</button></div>'+
    '<div class="bg-der">'+tablero(g)+'<div class="bg-ult">'+g.sacadas.slice(-8,-1).reverse().map(function(n){return bola(n,"mini");}).join("")+'</div></div></div>';
  if(el.getAttribute("data-h")===h)return; el.innerHTML=h; el.setAttribute("data-h",h);
  if(nueva){var be=el.querySelector(".bg-bola.enorme"); if(be)be.classList.add("nueva");}
  $("bg-voz").onclick=function(){voz.on=!voz.on; if(voz.on)di("Voz activada"); this.textContent=voz.on?'🔊 Voz activada':'🔇 Activar voz';};
}

S.registra("bingo",{
  icono:"🎱",
  desc:"Bingo de 75 bolas para sortear premios: rápido (gana la primera línea) o largo (premio a la línea y gran premio al cartón lleno). El proyector canta las bolas.",
  reglas:["Cada participante recibe sus cartones de 5×5 (B, I, N, G, O; el centro es libre) al empezar. Los números se marcan solos.",
    "<b>Rápido</b>: gana la primera línea (fila, columna o diagonal); suele salir hacia la bola 15–20, en uno o dos minutos. <b>Largo</b>: primero la línea y después el cartón lleno, con su propio premio; en total, 60–70 bolas.",
    "Las bolas las baraja y saca el servidor con azar criptográfico: cada pocos segundos o cuando el anfitrión pulsa «Sacar bola».",
    "Premio automático (si varios completan con la misma bola, comparten) o cantado (hay que pulsar ¡Línea! o ¡Bingo!; quien canta abre 4 s para empates y cantar en falso bloquea 10 s).",
    "Con premio hace falta identificarse y no hay bots. Las bases y la entrega del premio son responsabilidad de quien organiza."],
  opciones:function(o){
    o=o||{};
    var sel=function(n,l,v){return '<select name="'+n+'">'+l.map(function(x){return '<option value="'+x[0]+'"'+(String(x[0])===String(v)?' selected':'')+'>'+x[1]+'</option>';}).join("")+'</select>';};
    return '<div class="rt-2"><label>Modalidad'+sel("modo",[["rapido","Rápido: gana la línea"],["largo","Largo: línea y cartón lleno"]],o.modo||"rapido")+'</label>'+
      '<label>Bolas'+sel("ritmo",[[3,"Cada 3 s"],[5,"Cada 5 s"],[8,"Cada 8 s"],[12,"Cada 12 s"],[0,"Las saco yo"]],o.ritmo==null?5:o.ritmo)+'</label></div>'+
      '<div class="rt-2"><label>Cartones por persona'+sel("cartones",[[1,"1"],[2,"2"],[3,"3"]],o.cartones||1)+'</label>'+
      '<label>Cómo se gana'+sel("cantar",[["0","Automático: lo detecta el servidor"],["1","Cantado: hay que pulsar ¡Bingo!"]],o.cantar?"1":"0")+'</label></div>'+
      '<label>Premio de la línea (solo en el largo; el gran premio es el de la sala)<input name="premioLinea" maxlength="120" value="'+esc(o.premioLinea||"")+'" placeholder="Un postre gratis"></label>'+
      '<label class="rt-check"><input type="checkbox" name="hostJuega"'+(o.hostJuega?' checked':'')+'> <span>Yo también juego con cartón (en familia; en un evento con premio, mejor solo presentar)</span></label>';
  },
  leeOpciones:function(f){return {modo:f.querySelector("[name=modo]").value,ritmo:+f.querySelector("[name=ritmo]").value,cartones:+f.querySelector("[name=cartones]").value,
    cantar:f.querySelector("[name=cantar]").value==="1",premioLinea:f.querySelector("[name=premioLinea]").value,hostJuega:f.querySelector("[name=hostJuega]").checked};},
  jugador:jugador,
  pantalla:pantalla,
  fin:function(g,ctx){ if(!g)return ""; return '<p class="vv-grande">¡Bingo terminado!</p>'+ganadores(g,ctx,ctx.yo.rol==="pantalla")+(ctx.yo.rol==="pantalla"?'':'<p class="fine">'+g.n+' bolas · '+g.total+' jugadores</p>'); }
});
})();
