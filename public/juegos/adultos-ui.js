/* ===========================================================
   THE FINAL TEST · juegos solo para adultos (pantalla)
   Paranoia y Yo nunca: para mayores de 18 con la edad verificada,
   pensados para reuniones de amigos. Sin alcohol de por medio: en
   Yo nunca se pierden vidas, no se bebe.
   =========================================================== */
(function(){
"use strict";
var S=window.AxSala, J=window.AxJuegos; if(!S||!J)return;
function $(id){return document.getElementById(id);}
function reloj(h){return h?'<span class="jg-reloj" data-hasta="'+h+'"></span>':'';}
function sel(nombre,ops,actual,def){
  var v=actual!=null?actual:def;
  return '<select name="'+nombre+'">'+ops.map(function(o){return '<option value="'+o[0]+'"'+(String(o[0])===String(v)?' selected':'')+'>'+o[1]+'</option>';}).join("")+'</select>';
}
function pon(el,h,fn){if(el.getAttribute("data-h")===h)return; el.innerHTML=h; el.setAttribute("data-h",h); if(fn)fn();}

/* ===================== PARANOIA ===================== */
function historial(g,ctx){
  if(!g.hist||!g.hist.length)return "";
  return '<h4>Hasta ahora</h4><ul class="pa-hist">'+g.hist.map(function(x){
    return '<li><span><b>'+ctx.esc(ctx.nombre(x.pregunta))+'</b> eligió a <b>'+ctx.esc(ctx.nombre(x.elegido))+'</b></span>'+
      (x.q?'<em>'+ctx.esc(x.q)+'</em>':'<em class="oculta">🤐 pregunta secreta</em>')+'</li>';}).join("")+'</ul>';
}
function paranoiaVista(g,ctx,grande){
  var yo=ctx.yo.id, P=ctx.esc(ctx.nombre(g.pregunta)), E=g.elegido?ctx.esc(ctx.nombre(g.elegido)):"";
  var cab='<div class="jg-turno'+((g.fase==="pregunta"&&g.pregunta===yo)||(g.fase==="moneda"&&g.elegido===yo)?' mio':'')+'"><span>Turno '+g.n+' de '+g.turnos+'</span>'+reloj(g.hasta)+'</div>';
  var h;
  if(g.fase==="pregunta"){
    if(g.pregunta===yo&&!grande){
      var otros=ctx.sala.jugadores.filter(function(j){return j.id!==yo&&!j.bot;});
      h='<div class="pa-secreta"><small>Solo tú ves esta pregunta</small><p>'+ctx.esc(g.q)+'</p></div><p class="fine">Elige a quién señalas. Todos verán a quién, pero no la pregunta… salvo que la moneda salga cara.</p>'+
        '<div class="pa-nombres">'+otros.map(function(j){return '<button type="button" class="ghost" data-pa="'+ctx.esc(j.id)+'">'+ctx.esc(j.nombre)+'</button>';}).join("")+'</div>';
    }else h='<p class="pa-grande">🤫 <b>'+P+'</b> está leyendo una pregunta en secreto…</p>';
  }else if(g.fase==="moneda"){
    h='<p class="pa-grande"><b>'+P+'</b> señaló a <b>'+E+'</b></p>'+
      (g.elegido===yo&&!grande?'<p class="fine">¿Quieres saber por qué? Lanza la moneda: si sale cara, la pregunta se revela a todos.</p><div class="actions"><button type="button" class="primary pa-moneda-b" id="pa-lanza">🪙 Lanzar la moneda</button></div>':
        '<p class="fine" style="text-align:center">'+E+' lanza la moneda…</p>');
  }else if(g.fase==="resultado"){
    h='<div class="pa-moneda '+g.moneda+'"><span>'+(g.moneda==="cara"?'😮':'🤐')+'</span><b>'+(g.moneda==="cara"?'¡Cara!':'Cruz')+'</b></div>'+
      '<p class="pa-grande"><b>'+P+'</b> señaló a <b>'+E+'</b></p>'+
      (g.q?'<div class="pa-secreta abierta"><small>'+(g.moneda==="cara"?'La pregunta era':'Tu pregunta (queda en secreto)')+'</small><p>'+ctx.esc(g.q)+'</p></div>':'<p class="fine" style="text-align:center">La pregunta queda en secreto para siempre.</p>');
  }else h='';
  return cab+h+historial(g,ctx);
}
S.registra("paranoia",{
  icono:"🫣",
  desc:"«¿Quién de la mesa…?»: alguien recibe una pregunta en secreto y señala a otro. La moneda decide si todos se enteran de la pregunta.",
  reglas:["Solo para mayores de 18 con la edad verificada. Pensado para jugar en persona, con amigos.","Por turnos, a alguien le llega en secreto una pregunta del tipo «¿Quién de la mesa…?» y elige a una persona.",
    "Todos ven a quién eligió, pero no la pregunta. La persona señalada lanza la moneda: si sale cara, la pregunta se revela; si sale cruz, queda en secreto.",
    "Nadie gana ni pierde: al final se ve a quién señalaron más veces. Tono suave o picante, a elegir."],
  opciones:function(o){o=o||{};
    return '<div class="rt-2"><label>Turnos'+sel("turnos",[[10,"10"],[20,"20"],[30,"30"]],o.turnos,20)+'</label>'+
      '<label>Segundos para elegir'+sel("tiempo",[[30,"30"],[45,"45"],[60,"60"]],o.tiempo,45)+'</label></div>'+
      '<label>Tono'+sel("tono",[["suave","Suave (para todos)"],["picante","Picante"]],o.tono,"suave")+'</label>';},
  leeOpciones:function(f){return {turnos:+f.querySelector("[name=turnos]").value,tiempo:+f.querySelector("[name=tiempo]").value,tono:f.querySelector("[name=tono]").value};},
  jugador:function(el,g,ctx){
    pon(el,paranoiaVista(g,ctx,false),function(){
      el.querySelectorAll("[data-pa]").forEach(function(b){b.onclick=function(){el.querySelectorAll("[data-pa]").forEach(function(x){x.disabled=true;}); ctx.envia({tipo:"elige",id:this.getAttribute("data-pa")});};});
      if($("pa-lanza"))$("pa-lanza").onclick=function(){this.disabled=true; ctx.envia({tipo:"moneda"});};
    });
  },
  pantalla:function(el,g,ctx){pon(el,'<div class="pa-proy">'+paranoiaVista(g,ctx,true)+'</div>');},
  fin:function(g,ctx){if(!g)return ""; return historial(g,ctx);}
});

/* ===================== YO NUNCA ===================== */
function dedos(n,max){var h='<span class="yn-dedos" aria-label="'+n+' vidas">';for(var i=0;i<max;i++)h+='<i class="'+(i<n?'':'off')+'">☝️</i>';return h+'</span>';}
function vidasHtml(g,ctx){
  if(g.anonimo&&!g.fin)return '<p class="fine">Quedan <b>'+g.vivos+'</b> de '+g.jugando+' con vidas. Modo anónimo: nadie ve las vidas de los demás hasta el final.</p>';
  var ids=Object.keys(g.vidas).sort(function(a,b){return g.vidas[b]-g.vidas[a];});
  return '<ul class="yn-vidas">'+ids.map(function(id){return '<li class="'+(id===ctx.yo.id?'me':'')+(g.vidas[id]>0?'':' fuera')+'"><span>'+ctx.esc(ctx.nombre(id))+'</span>'+dedos(g.vidas[id],g.max)+'</li>';}).join("")+'</ul>';
}
function revelaHtml(g,ctx){
  if(g.fase!=="revela")return "";
  return '<div class="yn-revela"><b>'+(g.cuantos===0?'Nadie lo ha hecho':g.cuantos===1?'1 persona lo ha hecho':g.cuantos+' personas lo han hecho')+'</b>'+
    (g.si&&g.si.length?'<span>'+g.si.map(function(id){return ctx.esc(ctx.nombre(id));}).join(" · ")+'</span>':'')+'</div>';
}
S.registra("yonunca",{
  icono:"☝️",
  desc:"Sale una frase «Yo nunca…»: si tú sí lo has hecho, pierdes un dedo. Con modo anónimo y categorías. Sin alcohol: se juega con vidas.",
  reglas:["Solo para mayores de 18 con la edad verificada.","Sale una frase en la pantalla y en los teléfonos. Si tú SÍ lo has hecho, tócalo: pierdes una vida (un dedo).",
    "Después se ve cuántas personas lo han hecho (y quiénes, si no es anónimo).","Quien se queda sin vidas queda fuera; gana quien conserve más al final."],
  opciones:function(o){o=o||{}; var cats=o.categorias||["divertidas","viajes","estudios"];
    function ck(c,t){return '<label class="rt-check"><input type="checkbox" name="'+c+'"'+(cats.indexOf(c)>=0?' checked':'')+'> <span>'+t+'</span></label>';}
    return '<div class="rt-2"><label>Frases'+sel("frases",[[10,"10"],[15,"15"],[25,"25"]],o.frases,15)+'</label>'+
      '<label>Segundos por frase'+sel("tiempo",[[10,"10"],[15,"15"],[25,"25"]],o.tiempo,15)+'</label></div>'+
      '<label>Vidas'+sel("vidas",[[3,"3"],[5,"5"],[10,"10"]],o.vidas,5)+'</label>'+
      '<p class="fine">Categorías</p>'+ck("divertidas","Divertidas")+ck("viajes","Viajes")+ck("estudios","Estudios y trabajo")+ck("picante","Picante")+
      '<label class="rt-check"><input type="checkbox" name="anonimo"'+(o.anonimo?' checked':'')+'> <span>Anónimo: solo se ve cuántos lo han hecho, no quiénes</span></label>';},
  leeOpciones:function(f){var o={frases:+f.querySelector("[name=frases]").value,tiempo:+f.querySelector("[name=tiempo]").value,vidas:+f.querySelector("[name=vidas]").value,
    anonimo:f.querySelector("[name=anonimo]").checked};
    ["divertidas","viajes","estudios","picante"].forEach(function(c){o[c]=f.querySelector("[name="+c+"]").checked;}); return o;},
  jugador:function(el,g,ctx){
    var mias=g.vidas[ctx.yo.id], vivo=mias>0;
    var h='<div class="jg-turno'+(g.fase==="frase"&&vivo&&g.mia==null?' mio':'')+'"><span>Frase '+g.n+' de '+g.total+'</span>'+reloj(g.hasta)+'</div>'+
      (mias!=null?'<p class="yn-mias">'+dedos(mias,g.max)+'</p>':'')+
      '<p class="yn-frase">'+ctx.esc(g.frase||"")+'</p>';
    if(g.fase==="frase"){
      if(!vivo)h+='<p class="rt-hoy">Te quedaste sin vidas: sigue mirando.</p>';
      else if(g.mia==null)h+='<div class="yn-botones"><button type="button" class="primary" data-si="1">Yo sí 🙋</button><button type="button" class="ghost" data-si="0">Yo nunca 🙅</button></div>';
      else h+='<p class="rt-hoy">Respondiste «'+(g.mia?'yo sí':'yo nunca')+'». '+g.respondidas+' han respondido.</p>';
    }
    h+=revelaHtml(g,ctx)+vidasHtml(g,ctx);
    pon(el,h,function(){el.querySelectorAll("[data-si]").forEach(function(b){b.onclick=function(){
      el.querySelectorAll("[data-si]").forEach(function(x){x.disabled=true;}); ctx.envia({tipo:"responde",si:this.getAttribute("data-si")==="1"});};});});
  },
  pantalla:function(el,g,ctx){
    pon(el,'<div class="jg-turno"><span>Frase '+g.n+' de '+g.total+'</span><span>'+(g.fase==="frase"?g.respondidas+' han respondido · ':'')+reloj(g.hasta)+'</span></div>'+
      '<p class="yn-frase grande">'+ctx.esc(g.frase||"")+'</p>'+revelaHtml(g,ctx)+vidasHtml(g,ctx));
  },
  fin:function(g,ctx){return g?vidasHtml(g,ctx):"";}
});
})();
