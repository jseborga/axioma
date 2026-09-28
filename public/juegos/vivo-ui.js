/* ===========================================================
   THE FINAL TEST · juegos en vivo para eventos (pantalla)
   Trivia en vivo, Botón del hype y Carrera matemática: el proyector
   muestra el juego en grande y el teléfono es el mando.
   =========================================================== */
(function(){
"use strict";
var S=window.AxSala, J=window.AxJuegos; if(!S||!J)return;
var LET=["A","B","C","D","E","F"], FIG=["▲","◆","●","■","★","✚"];
function $(id){return document.getElementById(id);}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function reloj(h){return h?'<span class="jg-reloj" data-hasta="'+h+'"></span>':'';}
function barra(h,total){return h?'<div class="jg-barra"><i data-hasta="'+h+'" data-total="'+total+'"></i></div>':'';}
function patrocinio(ctx,g,grande){
  var m=ctx.sala.marca; if(!m&&!g.patrocinio)return "";
  return '<div class="vv-patro'+(grande?' grande':'')+'">'+(m&&m.logo?'<img src="'+ctx.esc(m.logo)+'" alt="">':'')+
    '<div>'+(m&&m.name?'<b>'+ctx.esc(m.name)+'</b>':'')+(g.patrocinio?'<span>'+ctx.esc(g.patrocinio)+'</span>':m&&m.tagline?'<span>'+ctx.esc(m.tagline)+'</span>':'')+'</div></div>';
}

/* ===================== TRIVIA EN VIVO ===================== */
function topHtml(g,ctx){
  return '<ol class="rt-rank vv-top">'+(g.top||[]).map(function(x,i){return '<li class="'+(x.id===ctx.yo.id?'me':'')+'"><span class="pos">'+(i+1)+'</span>'+
    '<span class="who">'+ctx.esc(ctx.nombre(x.id))+'</span><span class="pts"><b>'+x.puntos+'</b></span></li>';}).join("")+'</ol>';
}
function opciones(g,ctx,interactivo,mia){
  return '<div class="vv-ops n'+g.o.length+'">'+g.o.map(function(t,i){
    var cls="vv-op o"+i+(g.c!=null?(i===g.c?" bien":" mal"):"")+(mia===i?" mia":"");
    return '<button type="button" class="'+cls+'" data-i="'+i+'"'+(interactivo?'':' disabled')+'><i>'+FIG[i]+'</i><span>'+ctx.esc(t)+'</span>'+
      (g.reparto?'<em>'+g.reparto[i]+'</em>':'')+'</button>';}).join("")+'</div>';
}
/* áreas del banco general (si se usa un banco de la institución, no cuentan) */
function areasTrivia(o){
  if(!window.AxAreas)return "";
  setTimeout(function(){var el=document.getElementById("tv-areas"); if(el)AxAreas.pinta(el,(o&&o.areas)||[]);},0);
  return AxAreas.html("tv-areas");
}
function dato(g,grande){return g.dato?'<div class="vv-dato'+(grande?' grande':'')+'"><b>💡 ¿Sabías que…?</b> '+esc(g.dato)+'</div>':'';}
S.registra("trivia",{
  icono:"🏆",
  desc:"Estilo concurso de televisión: todos responden a la vez mirando la pantalla grande. Puntúa acertar y ser rápido.",
  reglas:["Quien crea la sala presenta: abre la vista de proyector y los demás se unen con el QR.","Cada pregunta sale en la pantalla grande y en los teléfonos; se responde tocando la opción.",
    "Acertar da entre 500 y 1000 puntos según la rapidez (la mide el servidor, no el teléfono).","Entre preguntas se ven la respuesta, el reparto de votos, el podio y el espacio del patrocinador."],
  opciones:function(o){return '<div class="rt-2"><label>Preguntas<select name="n"><option value="5">5</option><option value="10" selected>10</option><option value="15">15</option><option value="20">20</option></select></label>'+
    '<label>Segundos por pregunta<select name="segundos"><option value="10">10</option><option value="15">15</option><option value="20" selected>20</option><option value="30">30</option></select></label></div>'+
    '<label>Dificultad (preguntas generales)<select name="nivel"><option value="1">Fácil</option><option value="2">Media</option><option value="3">Difícil</option><option value="4" selected>Progresiva</option></select></label>'+
    '<label>Mensaje del patrocinador (opcional)<input name="patrocinio" maxlength="140" placeholder="Visítanos en el stand 12 · 2×1 hoy"></label>'+
    areasTrivia(o);},
  leeOpciones:function(f){return {n:+f.querySelector("[name=n]").value,segundos:+f.querySelector("[name=segundos]").value,nivel:+f.querySelector("[name=nivel]").value,
    patrocinio:f.querySelector("[name=patrocinio]").value,areas:window.AxAreas?AxAreas.lee(f.querySelector("#tv-areas")):[]};},
  jugador:function(el,g,ctx){
    var h, tot=ctx.sala.opciones.segundos*1000;
    if(g.host){ /* quien presenta: control del ritmo */
      h='<div class="jg-turno mio"><span>Presentas · '+(g.fase==="intro"?'empieza enseguida':g.fase==="pregunta"?'pregunta '+(g.i+1)+' de '+g.n:g.fase==="resultado"?'resultados de la '+(g.i+1):'')+'</span>'+reloj(g.hasta)+'</div>'+
        (g.q?'<p class="vv-q">'+ctx.esc(g.q)+'</p>':'')+(g.fase==="pregunta"?'<p class="fine">'+g.respondidas+' de '+g.total+' han respondido</p>':'')+
        (g.fase==="resultado"?opciones(g,ctx,false)+dato(g)+topHtml(g,ctx):'')+
        '<div class="actions"><button class="primary" id="vv-sig">Siguiente</button></div><p class="fine">Abre «Abrir en el proyector» en la pantalla grande para que todos lo vean.</p>';
      el.innerHTML=h; $("vv-sig").onclick=function(){this.disabled=true;ctx.envia({tipo:"siguiente"});}; return;
    }
    var m=g.mis||{};
    if(g.fase==="intro")h='<p class="vv-grande">¡Atención!</p><p class="fine" style="text-align:center">La primera pregunta sale en '+reloj(g.hasta)+' s</p>';
    else if(g.fase==="pregunta"){
      var resp=m.resp;
      h='<div class="jg-turno'+(resp?'':' mio')+'"><span>Pregunta '+(g.i+1)+' de '+g.n+(g.tema?' · '+ctx.esc(g.tema):'')+'</span>'+reloj(g.hasta)+'</div>'+barra(g.hasta,tot)+
        '<p class="vv-q">'+ctx.esc(g.q)+'</p>'+opciones(g,ctx,!resp,resp?resp.i:null)+
        (resp?'<p class="rt-hoy">Respuesta enviada. Mira la pantalla…</p>':'');
    }else if(g.fase==="resultado"){
      var r=m.resp, bien=r&&r.i===g.c;
      h='<div class="vv-res '+(bien?'bien':'mal')+'"><b>'+(r?(bien?'¡Correcto! +'+r.pts:'Incorrecto'):'Sin respuesta')+'</b>'+
        '<span>'+(m.puntos||0)+' puntos'+(m.pos?' · puesto '+m.pos+' de '+g.total:'')+'</span></div>'+
        '<p class="vv-q">'+ctx.esc(g.q)+'</p>'+opciones(g,ctx,false,r?r.i:null)+dato(g)+topHtml(g,ctx)+patrocinio(ctx,g);
    }else h='';
    el.innerHTML=h;
    if(g.fase==="pregunta"&&!m.resp)el.querySelectorAll("[data-i]").forEach(function(b){b.onclick=function(){
      el.querySelectorAll("[data-i]").forEach(function(x){x.disabled=true;}); this.classList.add("mia"); ctx.envia({tipo:"responde",i:+this.getAttribute("data-i")});};});
  },
  fin:function(g,ctx){
    if(!g||ctx.yo.rol==="pantalla")return '<p class="vv-grande">¡Enhorabuena!</p>'+patrocinio(ctx,g||{},true);
    var m=g.mis; if(!m)return "";
    return '<div class="vv-res bien"><b>'+m.puntos+' puntos</b><span>'+m.aciertos+' de '+g.n+' aciertos</span></div>';
  },
  pantalla:function(el,g,ctx){
    var tot=ctx.sala.opciones.segundos*1000, h;
    if(g.fase==="intro")h='<p class="vv-grande">¡Atentos a la primera pregunta!</p><p class="vv-cuenta">'+reloj(g.hasta)+'</p>'+patrocinio(ctx,g,true);
    else if(g.fase==="pregunta")h='<div class="jg-turno"><span>Pregunta '+(g.i+1)+' de '+g.n+(g.tema?' · '+ctx.esc(g.tema):'')+'</span><span>'+g.respondidas+' / '+g.total+' · '+reloj(g.hasta)+'</span></div>'+
      barra(g.hasta,tot)+'<p class="vv-q grande">'+ctx.esc(g.q)+'</p>'+opciones(g,ctx,false);
    else if(g.fase==="resultado")h='<p class="vv-q">'+ctx.esc(g.q)+'</p>'+opciones(g,ctx,false)+dato(g,true)+'<div class="vv-dos">'+topHtml(g,ctx)+patrocinio(ctx,g,true)+'</div>';
    else h='';
    el.innerHTML=h;
  }
});

/* ===================== BOTÓN DEL HYPE ===================== */
var hy={pend:0,t:null};
function globos(g,ctx,grande){
  return '<div class="hy-equipos'+(grande?' grande':'')+'">'+g.equipos.map(function(e,k){var f=g.llenado[k], m=ctx.sala.marca;
    return '<div class="hy-eq'+(g.gana===k?' gana':'')+'" style="--c:'+e.c+'"><div class="hy-globo" style="--f:'+f.toFixed(3)+'">'+
      (m&&m.logo?'<img src="'+ctx.esc(m.logo)+'" alt="">':'<span>'+(g.objeto?ctx.esc(g.objeto):'🎈')+'</span>')+'</div>'+
      '<b>'+e.n+'</b><span>'+Math.round(f*100)+' % · '+g.miembros[k]+' pers.</span></div>';}).join("")+'</div>';
}
S.registra("hype",{
  icono:"🎈",
  desc:"El público, por equipos, pulsa sin parar para inflar el objeto de su equipo en la pantalla. Gana quien lo llena primero.",
  reglas:["El público se reparte solo en 2 o 3 equipos equilibrados.","Tras la cuenta atrás, pulsa tu botón tan rápido como puedas: tu equipo infla su objeto en la pantalla grande.",
    "La meta crece con el tamaño de cada equipo, para que sea justo. Gana el primero en llenarlo, o el que más lleve al acabar el tiempo.","Si hay cupón, el equipo ganador lo recibe en su teléfono."],
  opciones:function(){return '<div class="rt-2"><label>Equipos<select name="equipos"><option value="2" selected>2</option><option value="3">3</option></select></label>'+
    '<label>Duración<select name="duracion"><option value="20">20 s</option><option value="30" selected>30 s</option><option value="45">45 s</option></select></label></div>'+
    '<label>Dificultad<select name="intensidad"><option value="60">Fácil</option><option value="90" selected>Normal</option><option value="120">Difícil</option></select></label>'+
    '<label>Qué se infla (opcional)<input name="objeto" maxlength="40" placeholder="🎈 o el nombre del producto"></label>'+
    '<label>Cupón para el equipo ganador (opcional, solo lo ven ellos)<input name="cupon" maxlength="60" placeholder="HYPE20"></label>';},
  leeOpciones:function(f){return {equipos:+f.querySelector("[name=equipos]").value,duracion:+f.querySelector("[name=duracion]").value,
    intensidad:+f.querySelector("[name=intensidad]").value,objeto:f.querySelector("[name=objeto]").value,cupon:f.querySelector("[name=cupon]").value};},
  jugador:function(el,g,ctx){
    if(g.mio==null){el.innerHTML='<p class="rt-hoy">Presentas: abre la vista de proyector.</p>'+globos(g,ctx);return;}
    var e=g.equipos[g.mio];
    if(g.fase==="juego"){
      if(el.getAttribute("data-f")!=="juego"){
        el.setAttribute("data-f","juego");
        el.innerHTML='<div class="jg-turno mio" style="--accent:'+e.c+'"><span>Equipo '+e.n+'</span>'+reloj(g.hasta)+'</div>'+
          '<button type="button" class="hy-boton" id="hy-b" style="--c:'+e.c+'">¡PULSA!</button><p class="hy-mis" id="hy-mis"></p><div id="hy-g"></div>';
        var b=$("hy-b");
        b.addEventListener("pointerdown",function(ev){ev.preventDefault();hy.pend++;b.classList.remove("toc");void b.offsetWidth;b.classList.add("toc");
          if(!hy.t)hy.t=setTimeout(function(){hy.t=null;if(hy.pend){var n=hy.pend;hy.pend=0;ctx.envia({tipo:"toques",n:n});}},250);});
      }
      $("hy-mis").textContent=g.toques+" toques tuyos";
      $("hy-g").innerHTML=globos(g,ctx);
      return;
    }
    el.removeAttribute("data-f");
    if(g.fase==="listos")el.innerHTML='<p class="vv-grande" style="color:'+e.c+'">Equipo '+e.n+'</p><p class="vv-cuenta">'+reloj(g.hasta)+'</p>'+globos(g,ctx);
    else el.innerHTML='<div class="vv-res '+(g.gana===g.mio?'bien':'mal')+'"><b>'+(g.gana===g.mio?'¡Tu equipo gana!':'Gana el equipo '+g.equipos[g.gana].n)+'</b>'+
      '<span>'+g.toques+' toques tuyos</span></div>'+(g.cupon?'<div class="hy-cupon"><small>Tu cupón</small><b>'+ctx.esc(g.cupon)+'</b></div>':'')+globos(g,ctx);
  },
  fin:function(g,ctx){
    if(!g)return "";
    if(g.mio==null)return '<p class="vv-grande">¡Gana el equipo '+g.equipos[g.gana].n+'!</p>'+globos(g,ctx,ctx.yo.rol==="pantalla");
    return '<div class="vv-res '+(g.gana===g.mio?'bien':'mal')+'"><b>'+(g.gana===g.mio?'¡Tu equipo gana!':'Gana el equipo '+g.equipos[g.gana].n)+'</b>'+
      '<span>'+g.toques+' toques tuyos</span></div>'+(g.cupon?'<div class="hy-cupon"><small>Tu cupón</small><b>'+ctx.esc(g.cupon)+'</b></div>':'')+globos(g,ctx);
  },
  pantalla:function(el,g,ctx){
    el.innerHTML=(g.fase==="listos"?'<p class="vv-grande">¡Preparados!</p><p class="vv-cuenta">'+reloj(g.hasta)+'</p>':
      g.fase==="juego"?'<div class="jg-turno"><span>¡Pulsad!</span>'+reloj(g.hasta)+'</div>':
      '<p class="vv-grande">¡Gana el equipo '+g.equipos[g.gana].n+'!</p>')+globos(g,ctx,true);
  }
});

/* ===================== CARRERA MATEMÁTICA ===================== */
var cr={i:-1,v:""};
function pistas(g,ctx,max){
  var ids=Object.keys(g.pos).sort(function(a,b){return g.pos[b]-g.pos[a];}).slice(0,max||30);
  return '<div class="cr-pistas">'+ids.map(function(id){var p=Math.min(1,g.pos[id]/g.meta), llego=g.lleg.indexOf(id);
    return '<div class="cr-pista'+(id===ctx.yo.id?' yo':'')+'"><span class="cr-n">'+ctx.esc(ctx.nombre(id))+'</span><div class="cr-via"><i style="left:calc('+(p*100).toFixed(1)+'% - '+(p*1.6).toFixed(2)+'em)">'+(llego>=0?'🏁':'🏎️')+'</i></div>'+
      '<span class="cr-p">'+(llego>=0?'#'+(llego+1):g.pos[id]+'/'+g.meta)+'</span></div>';}).join("")+'</div>';
}
S.registra("carrera",{
  icono:"🏎️",
  desc:"Resuelve operaciones en tu teléfono para que tu coche avance en la pantalla grande. Con bots de tres niveles.",
  reglas:["Cada uno ve en su teléfono operaciones distintas; cada acierto hace avanzar su coche.","Un fallo te frena un segundo.","Llega primero quien resuelve todas. Los bots corren a ritmo fijo: fácil, medio o difícil."],
  opciones:function(){return '<div class="rt-2"><label>Operaciones hasta la meta<select name="meta"><option value="10">10</option><option value="15" selected>15</option><option value="20">20</option><option value="30">30</option></select></label>'+
    '<label>Dificultad<select name="nivel"><option value="1" selected>Fácil</option><option value="2">Media</option><option value="3">Difícil</option></select></label></div>'+
    '<label>Nivel de los bots<select name="bots"><option value="0">Fácil (una cada 5 s)</option><option value="1" selected>Medio (cada 3 s)</option><option value="2">Difícil (cada 1,5 s)</option></select></label>';},
  leeOpciones:function(f){return {meta:+f.querySelector("[name=meta]").value,nivel:+f.querySelector("[name=nivel]").value,bots:+f.querySelector("[name=bots]").value};},
  jugador:function(el,g,ctx){
    if(g.fase==="juego"&&g.op){
      if(el.getAttribute("data-f")!=="juego"){
        el.setAttribute("data-f","juego");
        el.innerHTML='<div class="jg-turno mio"><span id="cr-prog"></span>'+reloj(g.hasta)+'</div><p class="cr-op"><span id="cr-q"></span> = <b id="cr-v">?</b></p>'+
          '<p class="msg" id="cr-msg"></p><div class="rp-pad cr-pad">'+["1","2","3","4","5","6","7","8","9","−","0","⌫"].map(function(k){return '<button type="button" class="rp-key" data-k="'+k+'">'+k+'</button>';}).join("")+
          '</div><div class="actions"><button class="primary" id="cr-ok">Enviar</button></div><div id="cr-mini"></div>';
        el.querySelectorAll("[data-k]").forEach(function(b){b.onclick=function(){var k=this.getAttribute("data-k");
          if(k==="⌫")cr.v=cr.v.slice(0,-1); else if(k==="−")cr.v=cr.v.charAt(0)==="-"?cr.v.slice(1):"-"+cr.v; else if(cr.v.replace("-","").length<6)cr.v+=k;
          $("cr-v").textContent=cr.v||"?";};});
        $("cr-ok").onclick=function(){if(!cr.v||cr.v==="-")return; ctx.envia({tipo:"resp",i:cr.i,v:Number(cr.v)}); cr.v=""; $("cr-v").textContent="?";};
      }
      if(cr.i!==g.op.i){cr.i=g.op.i;cr.v="";$("cr-v").textContent="?";}
      $("cr-q").textContent=g.op.q; $("cr-prog").textContent=g.pos[ctx.yo.id]+" de "+g.meta;
      var m=$("cr-msg"); m.className="msg"+(g.freno?" bad":""); m.textContent=g.freno?"¡Fallo! Espera un segundo…":"";
      $("cr-mini").innerHTML=pistas(g,ctx,6);
      return;
    }
    el.removeAttribute("data-f");
    if(g.fase==="listos")el.innerHTML='<p class="vv-grande">¡Preparados!</p><p class="vv-cuenta">'+reloj(g.hasta)+'</p>';
    else el.innerHTML=(g.mia!=null?'<div class="vv-res bien"><b>¡Llegaste! Puesto '+(g.lleg.indexOf(ctx.yo.id)+1)+'</b><span>'+(g.mia/1000).toFixed(1)+' s</span></div>':
      g.pos[ctx.yo.id]==null?'<p class="rt-hoy">Mira la carrera en la pantalla grande.</p>':'')+pistas(g,ctx,10);
  },
  fin:function(g,ctx){
    if(!g)return "";
    return (g.mia!=null?'<div class="vv-res bien"><b>¡Llegaste! Puesto '+(g.lleg.indexOf(ctx.yo.id)+1)+'</b><span>'+(g.mia/1000).toFixed(1)+' s</span></div>':'')+pistas(g,ctx,ctx.yo.rol==="pantalla"?30:10);
  },
  pantalla:function(el,g,ctx){
    el.innerHTML=(g.fase==="listos"?'<p class="vv-grande">¡Preparados!</p><p class="vv-cuenta">'+reloj(g.hasta)+'</p>':'<div class="jg-turno"><span>Meta: '+g.meta+' operaciones</span>'+reloj(g.hasta)+'</div>')+pistas(g,ctx,30);
  }
});
})();
