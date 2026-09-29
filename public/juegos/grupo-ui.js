/* ===========================================================
   THE FINAL TEST · juegos en grupo (pantalla)
   Dudo, La sexta carta y Dos verdades y una mentira: la vista de cada
   teléfono (con lo secreto de cada uno) y la del proyector.
   =========================================================== */
(function(){
"use strict";
var S=window.AxSala, J=window.AxJuegos; if(!S||!J)return;
var CARA=["","⚀","⚁","⚂","⚃","⚄","⚅"];
function reloj(h){return h?'<span class="jg-reloj" data-hasta="'+h+'"></span>':'';}
function marcador(ids,puntos,ctx,turno,unidad,menos){
  var o=ids.slice().sort(function(a,b){return menos?puntos[a]-puntos[b]:puntos[b]-puntos[a];});
  return '<div class="jg-marcador">'+o.map(function(id){return '<span class="'+(id===ctx.yo.id?'yo':'')+(id===turno?' turno':'')+'">'+ctx.esc(ctx.nombre(id))+' · <b>'+puntos[id]+'</b>'+(unidad?' '+unidad:'')+'</span>';}).join("")+'</div>';
}

/* ===================== DUDO ===================== */
var du={q:1,c:2,clave:""};
function mesaDudo(g,ctx,grande){
  return '<div class="du-mesa'+(grande?' grande':'')+'">'+g.orden.map(function(id){var n=g.cuantos[id];
    return '<div class="du-pj'+(id===g.turno?' turno':'')+(n?'':' fuera')+(id===ctx.yo.id?' yo':'')+'"><b>'+ctx.esc(ctx.nombre(id))+'</b><span>'+(n?'🎲 × '+n:'fuera')+'</span></div>';}).join("")+'</div>';
}
function apuestaDudo(g,ctx){
  if(!g.apuesta)return '<p class="du-ap vacia">Nadie ha apostado todavía en esta ronda.</p>';
  return '<p class="du-ap"><small>'+ctx.esc(ctx.nombre(g.apuesta.id))+' apuesta</small><b>'+g.apuesta.q+' × <span class="du-d">'+CARA[g.apuesta.c]+'</span></b></p>';
}
function revelaDudo(g,ctx){
  var rv=g.revela, c=rv.apuesta.c;
  return '<div class="du-rev"><p><b>'+ctx.esc(ctx.nombre(rv.dudo))+'</b> dudó de '+rv.apuesta.q+' × '+CARA[c]+'. Había <b>'+rv.hay+'</b>.</p>'+
    '<p class="du-pierde">'+ctx.esc(ctx.nombre(rv.pierde))+' pierde un dado</p>'+
    Object.keys(rv.dados).map(function(id){return '<div class="du-fila"><span>'+ctx.esc(ctx.nombre(id))+'</span>'+
      rv.dados[id].map(function(v){return '<i class="du-d'+(v===c||(rv.comodines&&c!==1&&v===1)?' cuenta':'')+'">'+CARA[v]+'</i>';}).join("")+'</div>';}).join("")+
    (g.fin?'':'<p class="fine">Nueva ronda en '+reloj(g.hasta)+' s</p>')+'</div>';
}
S.registra("dudo",{
  icono:"🎲",
  desc:"Dados mentirosos: apuesta cuántos dados de una cara hay en la mesa o grita «¡Dudo!».",
  reglas:["Cada jugador tiene cinco dados que solo ve él.","Por turnos se apuesta cuántos dados de una cara hay en TODA la mesa (por ejemplo «cuatro cincos»), siempre subiendo: más dados, o los mismos con una cara más alta.",
    "Si la sala tiene comodines (se elige en las opciones), los unos cuentan como cualquier cara. Para pasar a apostar unos basta la mitad de dados; para volver de los unos, el doble más uno.",
    "Quien no se lo crea dice «¡Dudo!»: se levantan los dados. Si hay al menos los apostados, pierde un dado quien dudó; si no, quien apostó. Quien pierde el dado empieza la ronda siguiente.","Si se te acaba el tiempo del turno, se juega automáticamente por ti.","Gana el último que conserve dados."],
  opciones:function(o){return '<label>Tiempo por turno<select name="tiempo"><option value="20">20 s</option><option value="45" selected>45 s</option><option value="90">90 s</option></select></label>'+
    '<label class="rt-check"><input type="checkbox" name="comodines" checked> <span>Los unos son comodines</span></label>';},
  leeOpciones:function(f){return {tiempo:+f.querySelector("[name=tiempo]").value,comodines:f.querySelector("[name=comodines]").checked};},
  jugador:function(el,g,ctx){
    var mio=g.turno===ctx.yo.id, h;
    if(g.revela)h=mesaDudo(g,ctx)+revelaDudo(g,ctx);
    else{
      h='<div class="jg-turno'+(mio?' mio':'')+'"><span>'+(mio?'Te toca':'Turno de '+ctx.esc(ctx.nombre(g.turno)))+' · ronda '+g.ronda+'</span>'+reloj(g.hasta)+'</div>'+
        mesaDudo(g,ctx)+apuestaDudo(g,ctx)+
        (g.mios?'<p class="du-mios"><small>Tus dados</small>'+g.mios.map(function(v){return '<i class="du-d">'+CARA[v]+'</i>';}).join("")+'</p>':'<p class="fine">Estás fuera: mira cómo acaba.</p>')+
        '<p class="fine">'+g.total+' dados en la mesa'+(g.comodines?' · los ⚀ son comodines':'')+'</p>';
      if(mio){
        var clave=JSON.stringify(g.apuesta);
        if(du.clave!==clave){du.clave=clave;du.c=g.apuesta?g.apuesta.c:2;du.q=1;while(!J.def("dudo").sube(g.apuesta,du.q,du.c,g.comodines)&&du.q<g.total)du.q++;}
        var vale=J.def("dudo").sube(g.apuesta,du.q,du.c,g.comodines)&&du.q<=g.total;
        h+='<div class="du-ctl"><div class="du-q"><button type="button" class="ghost" data-q="-1">−</button><b>'+du.q+'</b><button type="button" class="ghost" data-q="1">+</button></div>'+
          '<div class="du-caras">'+[1,2,3,4,5,6].map(function(c){return '<button type="button" class="'+(c===du.c?'sel':'')+'" data-cara="'+c+'">'+CARA[c]+'</button>';}).join("")+'</div>'+
          '<div class="actions"><button class="primary" id="du-ap"'+(vale?'':' disabled')+'>Apostar '+du.q+' × '+CARA[du.c]+'</button>'+
          (g.apuesta?'<button class="du-dudo" id="du-dudo">¡Dudo!</button>':'')+'</div></div>';
      }
      if(g.hist.length)h+='<p class="fine du-hist">'+g.hist.map(function(x){return ctx.esc(ctx.nombre(x.id))+': '+x.q+'×'+CARA[x.c];}).join(" · ")+'</p>';
    }
    el.innerHTML=h;
    if(!mio||g.revela)return;
    var self=this;
    el.querySelectorAll("[data-q]").forEach(function(b){b.onclick=function(){du.q=Math.max(1,Math.min(g.total,du.q+(+this.getAttribute("data-q"))));self.jugador(el,g,ctx);};});
    el.querySelectorAll("[data-cara]").forEach(function(b){b.onclick=function(){du.c=+this.getAttribute("data-cara");self.jugador(el,g,ctx);};});
    if($("du-ap"))$("du-ap").onclick=function(){this.disabled=true;ctx.envia({tipo:"apuesta",q:du.q,c:du.c});};
    if($("du-dudo"))$("du-dudo").onclick=function(){this.disabled=true;ctx.envia({tipo:"dudo"});};
  },
  pantalla:function(el,g,ctx){
    el.innerHTML=(g.revela?mesaDudo(g,ctx,true)+revelaDudo(g,ctx):
      '<div class="jg-turno"><span>Turno de <b>'+ctx.esc(ctx.nombre(g.turno))+'</b> · ronda '+g.ronda+'</span>'+reloj(g.hasta)+'</div>'+mesaDudo(g,ctx,true)+apuestaDudo(g,ctx)+
      '<p class="fine">'+g.total+' dados en la mesa</p>');
  }
});
function $(id){return document.getElementById(id);}

/* ===================== LA SEXTA CARTA ===================== */
var CAB=J.def("sexta")?J.def("sexta").cabezas:function(){return 1;};
function carta(n,extra){var c=CAB(n);return '<span class="sx-c c'+c+'"'+(extra||'')+'><b>'+n+'</b><i>'+"▼".repeat(c)+'</i></span>';}
function filas(g,ctx,elegir){
  return '<div class="sx-filas">'+g.filas.map(function(f,i){
    return '<div class="sx-fila'+(elegir?' elige':'')+'"'+(elegir?' data-fila="'+i+'" role="button" tabindex="0"':'')+'>'+f.map(function(n){return carta(n);}).join("")+
      '<span class="sx-hueco">'+"·".repeat(Math.max(0,5-f.length))+'</span><em>'+g.cabezas[i]+' ▼</em></div>';}).join("")+'</div>';
}
function ultima(g,ctx){
  if(!g.ultima||!g.ultima.length)return "";
  return '<p class="fine sx-ult">'+g.ultima.map(function(x){return ctx.esc(ctx.nombre(x.id))+' '+x.carta+' → fila '+(x.fila+1)+(x.lleva?' <b>(+'+x.lleva+' ▼)</b>':'');}).join(" · ")+'</p>';
}
S.registra("sexta",{
  icono:"🃏",
  desc:"Todos eligen carta a la vez; quien coloca la sexta de una fila se la lleva. Gana quien menos cabezas junte.",
  reglas:["Cada uno recibe 10 cartas del 1 al 104. En la mesa hay cuatro filas.","En cada turno todos eligen en secreto una carta. Se revelan a la vez y se colocan de la más baja a la más alta.",
    "Cada carta va a la fila cuyo último número es el más alto por debajo de ella.","Quien pone la sexta carta de una fila se lleva las cinco anteriores; su carta empieza la fila.",
    "Si tu carta es más baja que todos los finales, eliges qué fila te llevas.","Cada carta tiene cabezas ▼ en contra (de 1 a 7). Gana quien menos cabezas acumule.","Si no eliges a tiempo, se juega tu carta más baja; si no eliges fila, te llevas la de menos cabezas."],
  opciones:function(){return '<label>Tiempo para elegir<select name="tiempo"><option value="20">20 s</option><option value="30" selected>30 s</option><option value="60">60 s</option></select></label>'+
    '<label>Rondas de 10 cartas<select name="rondas"><option value="1" selected>1</option><option value="2">2</option><option value="3">3</option></select></label>';},
  leeOpciones:function(f){return {tiempo:+f.querySelector("[name=tiempo]").value,rondas:+f.querySelector("[name=rondas]").value};},
  jugador:function(el,g,ctx){
    var yoFila=g.fase==="fila"&&g.pendiente&&g.pendiente.id===ctx.yo.id, h;
    h='<div class="jg-turno'+(yoFila||(g.fase==="elige"&&g.elegida==null)?' mio':'')+'"><span>'+
      (g.fase==="elige"?(g.elegida==null?'Elige una carta':'Esperando a los demás ('+g.listos.length+'/'+g.orden.length+')'):
       g.fase==="fila"?(yoFila?'Tu '+g.pendiente.carta+' es la más baja: elige qué fila te llevas':ctx.esc(ctx.nombre(g.pendiente.id))+' elige fila'):'')+
      ' · turno '+g.turno+(g.rondas>1?' · ronda '+g.ronda+'/'+g.rondas:'')+'</span>'+reloj(g.hasta)+'</div>'+
      filas(g,ctx,yoFila)+ultima(g,ctx);
    if(g.mano)h+='<div class="sx-mano">'+g.mano.map(function(n){return '<button type="button" class="sx-b'+(n===g.elegida?' sel':'')+'" data-carta="'+n+'"'+
      (g.fase!=="elige"||g.elegida!=null?' disabled':'')+'>'+carta(n)+'</button>';}).join("")+'</div>';
    h+=marcador(g.orden,g.puntos,ctx,null,"▼",true);
    el.innerHTML=h;
    el.querySelectorAll("[data-carta]").forEach(function(b){b.onclick=function(){if(this.disabled)return;
      el.querySelectorAll("[data-carta]").forEach(function(x){x.disabled=true;}); this.classList.add("sel"); ctx.envia({tipo:"elige",carta:+this.getAttribute("data-carta")});};});
    if(yoFila)el.querySelectorAll("[data-fila]").forEach(function(f){f.onclick=function(){ctx.envia({tipo:"fila",fila:+this.getAttribute("data-fila")});};});
  },
  pantalla:function(el,g,ctx){
    el.innerHTML='<div class="jg-turno"><span>'+(g.fase==="elige"?'Eligiendo cartas: '+g.listos.length+'/'+g.orden.length:g.fase==="fila"?ctx.esc(ctx.nombre(g.pendiente.id))+' elige qué fila se lleva':'')+
      ' · turno '+g.turno+'</span>'+reloj(g.hasta)+'</div>'+filas(g,ctx,false)+
      (g.reveladas?'<p class="sx-rev">'+g.reveladas.map(function(x){return '<span>'+ctx.esc(ctx.nombre(x.id))+' '+carta(x.carta)+'</span>';}).join("")+'</p>':'')+
      ultima(g,ctx)+marcador(g.orden,g.puntos,ctx,null,"▼",true);
  }
});

/* ===================== DOS VERDADES Y UNA MENTIRA ===================== */
var LET=["A","B","C"];
S.registra("verdades",{
  icono:"🤥",
  desc:"Cada uno escribe dos verdades y una mentira sobre sí mismo; los demás adivinan cuál es la falsa.",
  reglas:["Al empezar, cada jugador escribe en secreto tres frases sobre sí mismo y marca cuál es mentira.","Las frases de cada autor salen una a una, en orden al azar, y el resto vota cuál es la mentira.",
    "Acertar da 1 punto. Al autor, cada persona que engaña le da 1 punto."],
  opciones:function(){return '<label>Tiempo para escribir<select name="escribir"><option value="60">1 min</option><option value="120" selected>2 min</option><option value="180">3 min</option></select></label>'+
    '<label>Tiempo para votar<select name="votar"><option value="15">15 s</option><option value="25" selected>25 s</option><option value="40">40 s</option></select></label>';},
  leeOpciones:function(f){return {escribir:+f.querySelector("[name=escribir]").value,votar:+f.querySelector("[name=votar]").value};},
  jugador:function(el,g,ctx){
    var h;
    if(g.fase==="escribe"){
      var listo=g.listos.indexOf(ctx.yo.id)>=0;
      if(listo){ h='<div class="jg-turno"><span>Listo. Esperando a los demás ('+g.listos.length+'/'+ctx.sala.total+')</span>'+reloj(g.hasta)+'</div>'+
        '<ol class="vd-mias">'+g.mias.t.map(function(t,i){return '<li class="'+(i===g.mias.mentira?'mentira':'')+'">'+ctx.esc(t)+(i===g.mias.mentira?' <small>(mentira)</small>':'')+'</li>';}).join("")+'</ol>';
        if(el.getAttribute("data-f")!=="listo"){el.innerHTML=h;el.setAttribute("data-f","listo");} else el.innerHTML=h; return; }
      if(el.getAttribute("data-f")==="escribe")return;   /* no se borra lo que estás escribiendo */
      el.setAttribute("data-f","escribe");
      el.innerHTML='<div class="jg-turno mio"><span>Escribe dos verdades y una mentira sobre ti</span>'+reloj(g.hasta)+'</div>'+
        '<form class="rt-form vd-form" id="vd-f">'+[0,1,2].map(function(i){return '<label class="vd-l"><span>Frase '+(i+1)+'</span><textarea name="t'+i+'" maxlength="140" rows="2" required></textarea>'+
          '<span class="rt-check vd-m"><input type="radio" name="mentira" value="'+i+'"'+(i===2?' checked':'')+'> esta es la mentira</span></label>';}).join("")+
        '<div class="actions"><button class="primary" type="submit">Enviar</button></div><p class="msg" id="vd-msg"></p></form>';
      $("vd-f").onsubmit=function(e){e.preventDefault(); var f=this, t=[0,1,2].map(function(i){return f.querySelector("[name=t"+i+"]").value.trim();});
        if(t.some(function(x){return x.length<3;})){$("vd-msg").className="msg bad";$("vd-msg").textContent="Escribe las tres frases.";return;}
        ctx.envia({tipo:"frases",frases:t,mentira:+f.querySelector("[name=mentira]:checked").value});};
      return;
    }
    el.removeAttribute("data-f");
    if(g.fase==="vota"||g.fase==="revela"){
      var autor=g.autor===ctx.yo.id, rv=g.revela;
      h='<div class="jg-turno'+(!autor&&g.mivoto==null&&!rv?' mio':'')+'"><span>'+(autor?'Tus frases':'Frases de <b>'+ctx.esc(ctx.nombre(g.autor))+'</b>')+' · '+(g.i+1)+' de '+g.n+'</span>'+
        (rv?'':reloj(g.hasta))+'</div>'+
        '<div class="vd-frases">'+g.frases.map(function(t,i){
          var cls=rv?(i===rv.mentira?' mentira':' verdad'):(g.mivoto===i?' sel':'');
          return '<button type="button" class="vd-f'+cls+'" data-v="'+i+'"'+(autor||rv||g.mivoto!=null?' disabled':'')+'><b>'+LET[i]+'</b><span>'+ctx.esc(t)+'</span>'+
            (rv?'<em>'+g.recuento[i]+' voto'+(g.recuento[i]===1?'':'s')+'</em>':'')+'</button>';}).join("")+'</div>'+
        (rv?'<p class="rt-hoy">'+(rv.engano?ctx.esc(ctx.nombre(g.autor))+' engañó a '+rv.engano+(rv.engano===1?' persona':' personas'):'¡Nadie cayó!')+
            (!autor&&g.mivoto!=null?' · '+(g.mivoto===rv.mentira?'acertaste':'fallaste'):'')+'</p>':
          '<p class="fine">'+(autor?'Espera los votos de los demás.':g.mivoto!=null?'Voto enviado.':'¿Cuál es la mentira?')+' '+g.votaron+'/'+g.faltan+' han votado.</p>')+
        marcador(Object.keys(g.puntos),g.puntos,ctx,null,"");
      el.innerHTML=h;
      el.querySelectorAll("[data-v]").forEach(function(b){b.onclick=function(){if(this.disabled)return;ctx.envia({tipo:"voto",i:+this.getAttribute("data-v")});};});
    }
  },
  pantalla:function(el,g,ctx){
    if(g.fase==="escribe"){el.innerHTML='<p class="vd-grande">Escribid en el teléfono dos verdades y una mentira.</p><p class="jg-proy-n">'+g.listos.length+' de '+ctx.sala.total+' listos · '+reloj(g.hasta)+' s</p>';return;}
    var rv=g.revela;
    el.innerHTML='<div class="jg-turno"><span>Frases de <b>'+ctx.esc(ctx.nombre(g.autor))+'</b></span>'+(rv?'':reloj(g.hasta))+'</div>'+
      '<div class="vd-frases grande">'+g.frases.map(function(t,i){return '<div class="vd-f'+(rv?(i===rv.mentira?' mentira':' verdad'):'')+'"><b>'+LET[i]+'</b><span>'+ctx.esc(t)+'</span>'+
        (rv?'<em>'+g.recuento[i]+'</em>':'')+'</div>';}).join("")+'</div>'+
      (rv?'<p class="rt-hoy">'+(rv.engano?ctx.esc(ctx.nombre(g.autor))+' engañó a '+rv.engano:'¡Nadie cayó!')+'</p>':'<p class="fine">'+g.votaron+'/'+g.faltan+' han votado</p>')+
      marcador(Object.keys(g.puntos),g.puntos,ctx,null,"");
  }
});
})();
