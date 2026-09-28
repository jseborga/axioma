/* ===========================================================
   THE FINAL TEST · sorteos y subastas para eventos (pantalla)
   Sorteo gamificado con la «lluvia de esferas» en el proyector y
   subasta inversa (gana la menor oferta única). El servidor decide;
   la pantalla solo lo muestra.
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
function enlaceSala(c){return location.origin+location.pathname+"?sala="+c;}
function marcaGrande(ctx){var m=ctx.sala.marca; if(!m||!m.name)return "";
  return '<div class="vv-patro grande">'+(m.logo?'<img src="'+ctx.esc(m.logo)+'" alt="">':'')+'<div><b>'+ctx.esc(m.name)+'</b>'+(m.tagline?'<span>'+ctx.esc(m.tagline)+'</span>':'')+'</div></div>';}
function unete(ctx){ /* mientras se admite gente, el proyector sigue mostrando el QR */
  var l=enlaceSala(ctx.sala.code);
  return '<div class="jg-proy-espera so-unete"><div class="jg-proy-qr">'+(window.AxQR?AxQR.svg(l):'')+'</div><div><p class="jg-proy-paso">Participa en</p><p class="jg-proy-url">'+ctx.esc(location.host)+'</p>'+
    '<p class="jg-proy-paso">con el código</p><p class="jg-proy-code">'+ctx.esc(ctx.sala.code)+'</p></div></div>';
}
function bases(ctx){return ctx.sala.bases?'<details class="cq-review"><summary>Bases</summary><p class="fine">'+ctx.esc(ctx.sala.bases)+'</p></details>':'';}

/* ===================== SORTEO ===================== */
function ticketsHtml(g){
  var h='<div class="so-tickets">'; for(var i=0;i<g.mios;i++)h+='<span class="so-t">🎟️</span>'; return h+'</div>';
}
function desglose(g){
  return '<ul class="so-des"><li><span>Por participar</span><b>1</b></li>'+
    '<li><span>Por jugar con la institución</span><b>'+(g.bono?'+'+g.bono:'0')+'</b></li>'+
    (g.conPalabra?'<li><span>Palabra secreta</span><b>'+(g.palabra?'+2':'—')+'</b></li>':'')+'</ul>';
}
function ganadoresHtml(g,ctx,grande){
  if(!g.gana||!g.gana.length)return "";
  return '<ol class="so-gana'+(grande?' grande':'')+'">'+g.gana.map(function(x,i){return '<li class="'+(x.id===ctx.yo.id?'me':'')+'"><span>'+(g.gana.length>1?(i+1)+'.º premio':'🏆')+'</span><b>'+ctx.esc(x.n)+'</b></li>';}).join("")+'</ol>';
}

/* lluvia de esferas: la misma semilla da la misma animación en cualquier pantalla */
var PALETA=["#f5b82e","#4f8cff","#ff5c8a","#35c28f","#a46bff","#ff8a3d","#2fc4d6","#e8e8e8"];
function lluvia(canvas,g,ctx){
  var c2=canvas.getContext("2d"), dpr=window.devicePixelRatio||1, W=0, H=0;
  function mide(){W=canvas.clientWidth;H=canvas.clientHeight;canvas.width=W*dpr;canvas.height=H*dpr;c2.setTransform(dpr,0,0,dpr,0,0);}
  mide();
  var r=J.rng(g.semilla>>>0), gana={}, n=g.esferas.length;
  g.gana.forEach(function(x,i){gana[x.id]=i+1;});
  var base=Math.max(9,Math.min(34,Math.sqrt(W*H/(n*9))));
  var es=g.esferas.map(function(x,i){
    return {id:x.id,n:x.n,b:x.b,rad:base*Math.sqrt(x.b)/Math.sqrt(2),x:0.1+r()*0.8,y:-0.1-r()*0.9,vx:(r()-0.5)*0.004,vy:0,
      col:PALETA[i%PALETA.length],sale:r(),gana:gana[x.id]||0};
  });
  /* orden en que se apagan las que no ganan (de 6 s a 9,5 s) */
  var fuera=es.filter(function(e){return !e.gana;}).sort(function(a,b){return a.sale-b.sale;});
  fuera.forEach(function(e,i){e.apaga=6000+3500*(i/Math.max(1,fuera.length));});
  var copa={x:0.5,y:0.86};
  var ultimo=null;
  function paso(dt,t){
    es.forEach(function(e){
      if(e.gana&&t>9500){ /* los ganadores vuelan a la copa */
        var k=Math.min(1,(t-9500)/1500), ox=copa.x+(e.gana-1-(g.gana.length-1)/2)*0.17;
        e.x+=(ox-e.x)*k*0.2; e.y+=(copa.y-0.12-e.y)*k*0.2; return;
      }
      e.vy+=0.0000025*dt; e.x+=e.vx*dt/16; e.y+=e.vy*dt;
      var rx=e.rad/W, ry=e.rad/H;
      if(e.x<rx){e.x=rx;e.vx=Math.abs(e.vx);} if(e.x>1-rx){e.x=1-rx;e.vx=-Math.abs(e.vx);}
      if(e.y>0.95-ry){e.y=0.95-ry;e.vy=-Math.abs(e.vy)*0.55; if(t<6000)e.vx+=(r()-0.5)*0.004;}
    });
    /* choques sencillos entre esferas visibles */
    for(var i=0;i<es.length;i++)for(var j=i+1;j<es.length;j++){
      var a=es[i], b=es[j]; if(a.y<0||b.y<0||(a.apaga&&t>a.apaga)||(b.apaga&&t>b.apaga))continue;
      var dx=(b.x-a.x)*W, dy=(b.y-a.y)*H, d=Math.sqrt(dx*dx+dy*dy)||1, m=a.rad+b.rad;
      if(d<m){var s=(m-d)/2/d; a.x-=dx*s/W; a.y-=dy*s/H; b.x+=dx*s/W; b.y+=dy*s/H;}
    }
  }
  function dibuja(t){
    c2.clearRect(0,0,W,H);
    /* la copa */
    var cx=copa.x*W, cy=copa.y*H, cw=Math.min(W*0.22,260);
    c2.fillStyle="rgba(245,184,46,.18)"; c2.strokeStyle="#f5b82e"; c2.lineWidth=4;
    c2.beginPath(); c2.moveTo(cx-cw/2,cy-cw*0.35); c2.lineTo(cx+cw/2,cy-cw*0.35); c2.lineTo(cx+cw*0.3,cy+cw*0.12); c2.lineTo(cx-cw*0.3,cy+cw*0.12); c2.closePath(); c2.fill(); c2.stroke();
    es.forEach(function(e){
      var alfa=1; if(e.apaga&&t>e.apaga)alfa=Math.max(0,1-(t-e.apaga)/400); if(alfa<=0||e.y<-0.2)return;
      var rad=e.rad*(e.gana&&t>9500?1+Math.min(1,(t-9500)/1500)*0.6:1), x=e.x*W, y=e.y*H;
      c2.globalAlpha=alfa;
      var gr=c2.createRadialGradient(x-rad*0.35,y-rad*0.35,rad*0.1,x,y,rad);
      gr.addColorStop(0,"#fff"); gr.addColorStop(0.25,e.col); gr.addColorStop(1,"rgba(0,0,0,.55)");
      c2.fillStyle=gr; c2.beginPath(); c2.arc(x,y,rad,0,Math.PI*2); c2.fill();
      if(rad>16){c2.fillStyle="#111"; c2.font="700 "+Math.round(rad*0.7)+"px system-ui,sans-serif"; c2.textAlign="center"; c2.textBaseline="middle";
        c2.fillText((e.n||"?").trim().charAt(0).toUpperCase(),x,y);}
      if(e.gana&&t>10500){c2.globalAlpha=Math.min(1,(t-10500)/600); c2.fillStyle="#fff"; c2.font="800 "+Math.round(Math.max(18,W/34))+"px system-ui,sans-serif";
        c2.textAlign="center"; c2.textBaseline="bottom"; c2.fillText(e.n,x,y-rad-8);}
    });
    c2.globalAlpha=1;
  }
  function frame(){
    if(!document.body.contains(canvas))return;
    var t=ctx.ahora()-g.desde;
    if(canvas.clientWidth!==W)mide();
    /* si la pantalla se abrió tarde, se simula lo ya pasado a paso grueso */
    if(ultimo===null){for(var s=0;s<Math.min(t,12000);s+=32)paso(32,s); ultimo=t;}
    var dt=Math.max(0,Math.min(50,t-ultimo)); ultimo=t; paso(dt,t); dibuja(t);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

S.registra("sorteo",{
  icono:"🎟️",
  desc:"Sorteo para eventos: más boletos por participar en los juegos de la institución y por la palabra secreta. El proyector lo desvela con una lluvia de esferas.",
  reglas:["Quien organiza abre la sala y la proyecta; el público se une con el QR (hace falta verificar el teléfono, el correo o entrar con Google).",
    "Todos empiezan con 1 boleto. Participar en convocatorias y juegos de la institución da hasta 5 más; la palabra secreta que se diga en el evento, 2 más (máximo 10).",
    "El ganador se elige en el servidor con azar criptográfico ponderado por boletos. La animación solo lo desvela.",
    "Las bases y la entrega del premio son responsabilidad de quien organiza."],
  opciones:function(o){o=o||{};
    return '<label>Ganadores'+sel("ganadores",[[1,"1"],[2,"2"],[3,"3"],[5,"5"]],o.ganadores,1)+'</label>'+
      '<label>Palabra secreta (opcional, da +2 boletos)<input name="palabra" maxlength="30" autocomplete="off" placeholder="'+(o.conPalabra?'Ya hay una: escribe otra para cambiarla':'Se dice en voz alta durante el evento')+'"></label>';},
  leeOpciones:function(f){var o={ganadores:+f.querySelector("[name=ganadores]").value}, p=f.querySelector("[name=palabra]").value.trim(); if(p)o.palabra=p; return o;},
  jugador:function(el,g,ctx){
    var h;
    if(g.host){
      if(g.fase==="inscripcion"){
        h='<div class="jg-turno mio"><span>Organizas · inscripción abierta</span></div>'+
          '<div class="so-cifras"><div><b>'+g.total+'</b><span>participantes</span></div><div><b>'+g.boletos+'</b><span>boletos</span></div></div>'+
          '<p class="fine">Abre la vista de proyector: muestra el QR mientras la gente se une y luego la lluvia de esferas. Sortea '+g.ganadores+(g.ganadores>1?' premios':' premio')+'.</p>'+
          '<div class="actions"><a class="ghost" href="'+ctx.esc(location.origin+location.pathname+"?pantalla="+ctx.sala.code)+'" target="_blank" rel="noopener">Abrir en el proyector</a>'+
          '<button class="primary" id="so-sortea"'+(g.total?'':' disabled')+'>Sortear ahora</button></div>';
      }else h='<p class="vv-grande">Sorteando…</p><p class="vv-cuenta">'+reloj(g.hasta)+'</p>'+ganadoresHtml(g,ctx);
      if(el.getAttribute("data-h")===h)return; el.innerHTML=h; el.setAttribute("data-h",h);
      if($("so-sortea"))$("so-sortea").onclick=function(){if(!confirm("¿Sortear ya? Después no entra nadie más."))return; this.disabled=true; ctx.envia({tipo:"sortear"});};
      return;
    }
    if(g.fase==="inscripcion"){
      h='<div class="jg-turno"><span>Estás dentro del sorteo</span></div><p class="so-mios"><b>'+g.mios+'</b> '+(g.mios===1?'boleto':'boletos')+'</p>'+ticketsHtml(g)+desglose(g)+
        (g.conPalabra&&!g.palabra?'<form class="rt-join" id="so-pal"><input id="so-palabra" maxlength="30" placeholder="Palabra secreta" autocomplete="off" style="text-transform:none;letter-spacing:0"><button class="primary" type="submit">+2</button></form>':'')+
        '<p class="fine">'+g.total+' participantes · '+g.boletos+' boletos en juego. El sorteo se ve en la pantalla grande.</p>'+bases(ctx);
    }else h='<p class="vv-grande">¡Sorteando!</p><p class="fine" style="text-align:center">Mira la pantalla grande…</p><p class="vv-cuenta">'+reloj(g.hasta)+'</p>';
    if(el.getAttribute("data-h")===h)return;
    var tecleo=$("so-palabra")?$("so-palabra").value:"";   /* no se borra lo que escribías */
    el.innerHTML=h; el.setAttribute("data-h",h);
    if($("so-palabra")){$("so-palabra").value=tecleo; $("so-pal").onsubmit=function(e){e.preventDefault(); var t=$("so-palabra").value.trim(); if(t)ctx.envia({tipo:"palabra",texto:t});};}
  },
  pantalla:function(el,g,ctx){
    if(g.fase==="inscripcion"){
      var h='<div class="so-proy">'+unete(ctx)+'<div class="so-cifras grande"><div><b>'+g.total+'</b><span>participantes</span></div><div><b>'+g.boletos+'</b><span>boletos</span></div></div>'+
        (g.conPalabra?'<p class="so-pista">🔑 ¿Oíste la palabra secreta? Escríbela en tu teléfono: +2 boletos</p>':'')+marcaGrande(ctx)+'</div>';
      if(el.getAttribute("data-h")!==h){el.innerHTML=h;el.setAttribute("data-h",h);}
      return;
    }
    if(el.getAttribute("data-h")==="lluvia")return;
    el.setAttribute("data-h","lluvia");
    el.innerHTML='<div class="jg-turno"><span>Sorteo entre '+g.total+' participantes · '+g.boletos+' boletos</span>'+reloj(g.hasta)+'</div><canvas class="so-lluvia" id="so-cv"></canvas>';
    lluvia($("so-cv"),g,ctx);
  },
  fin:function(g,ctx){
    if(!g)return "";
    var yo=g.gana&&g.gana.some(function(x){return x.id===ctx.yo.id;});
    return (ctx.yo.rol==="pantalla"?'<p class="vv-grande">¡Enhorabuena!</p>':yo?'<div class="vv-res bien"><b>¡Has ganado!</b><span>Sigue las indicaciones de quien organiza para recoger el premio.</span></div>':
      g.mios?'<div class="vv-res mal"><b>Esta vez no hubo suerte</b><span>Participaste con '+g.mios+(g.mios===1?' boleto':' boletos')+'.</span></div>':'')+
      ganadoresHtml(g,ctx,ctx.yo.rol==="pantalla")+(ctx.yo.rol==="pantalla"?marcaGrande(ctx):'');
  }
});

/* ===================== SUBASTA INVERSA ===================== */
var ESTADO={ganadora:["Única y la más baja por ahora","ok"],unica:["Única, pero no la más baja","med"],repetida:["Repetida: alguien más la eligió","bad"]};
function bs(c){return "Bs "+(c/100).toFixed(2).replace(".",",");}
function mapaHtml(g){
  if(!g.mapa)return "";
  var mx=Math.max(1,Math.max.apply(null,g.mapa.map(function(x){return x.rep+x.uni;}))), paso=g.maximo/g.mapa.length;
  return '<h4>Mapa de pistas</h4><div class="su-mapa">'+g.mapa.map(function(x,i){
    return '<div class="su-tramo" title="'+x.rep+' repetidas · '+x.uni+' únicas"><div class="su-barra"><i class="rep" style="height:'+(x.rep/mx*100)+'%"></i><i class="uni" style="height:'+(x.uni/mx*100)+'%"></i></div>'+
      '<small>'+(i*paso).toFixed(paso<1?1:0)+'</small></div>';}).join("")+'</div><p class="fine"><span class="su-ley rep"></span> repetidas · <span class="su-ley uni"></span> únicas, por tramos de Bs '+paso.toFixed(paso<1?1:0)+'.</p>';
}
function cierreHtml(g,ctx,grande){
  if(!g.fin)return "";
  return (g.gana?'<div class="vv-res bien'+(grande?' grande':'')+'"><b>'+(g.gana.id===ctx.yo.id?'¡Ganas tú!':'Gana '+ctx.esc(g.gana.n))+'</b><span>con la oferta única más baja: '+bs(g.valor)+'</span></div>':
      '<div class="vv-res mal"><b>Sin ganador</b><span>Ninguna oferta quedó única.</span></div>')+
    (g.cierre&&g.cierre.length?'<div class="su-cierre">'+g.cierre.map(function(x){return '<span class="'+(x.n>1?'rep':x.v===g.valor?'gana':'uni')+'">'+bs(x.v)+(x.n>1?' ×'+x.n:'')+'</span>';}).join("")+'</div>':'');
}
S.registra("subasta",{
  icono:"🔻",
  desc:"Gana quien hace la oferta más baja que nadie más repita. Pujas gratis, un reloj y un mapa de pistas para quien visite al patrocinador.",
  reglas:["Durante unos minutos cada participante hace sus pujas (gratis) por el premio, con céntimos.","Gana la oferta MÁS BAJA que sea ÚNICA: si otra persona puja lo mismo, esa cantidad ya no vale.",
    "Tras cada puja sabes si es única y la más baja por ahora, única pero no la más baja, o repetida.","Visitar la web del patrocinador da 2 pujas más y un mapa de pistas con dónde hay ofertas repetidas.",
    "No hay dinero de por medio. Las bases y la entrega del premio son responsabilidad de quien organiza."],
  opciones:function(o){o=o||{};
    return '<div class="rt-2"><label>Duración'+sel("duracion",[[60,"1 min"],[120,"2 min"],[180,"3 min"],[300,"5 min"]],o.duracion,120)+'</label>'+
      '<label>Pujas por persona'+sel("pujas",[[3,"3"],[5,"5"],[10,"10"]],o.pujas,5)+'</label></div>'+
      '<label>Oferta máxima'+sel("maximo",[[10,"Bs 10"],[50,"Bs 50"],[100,"Bs 100"],[500,"Bs 500"]],o.maximo,100)+'</label>'+
      '<label>Web del patrocinador (opcional: visitarla da 2 pujas y el mapa)<input name="enlace" type="url" maxlength="200" placeholder="https://…" value="'+(o.enlace?String(o.enlace).replace(/"/g,"&quot;"):'')+'"></label>';},
  leeOpciones:function(f){return {duracion:+f.querySelector("[name=duracion]").value,pujas:+f.querySelector("[name=pujas]").value,
    maximo:+f.querySelector("[name=maximo]").value,enlace:f.querySelector("[name=enlace]").value.trim()};},
  jugador:function(el,g,ctx){
    if(g.host||g.mias==null){
      var hh='<div class="jg-turno mio"><span>'+(g.fin?'Subasta cerrada':'Presentas · subasta abierta')+'</span>'+reloj(g.hasta)+'</div>'+
        '<div class="so-cifras"><div><b>'+g.total+'</b><span>pujas</span></div><div><b>'+g.personas+'</b><span>personas</span></div></div>'+cierreHtml(g,ctx);
      if(el.getAttribute("data-h")!==hh){el.innerHTML=hh;el.setAttribute("data-h",hh);} return;
    }
    el.removeAttribute("data-h");
    if(el.getAttribute("data-f")!=="puja"){
      el.setAttribute("data-f","puja");
      el.innerHTML='<div class="jg-turno mio"><span id="su-q"></span>'+reloj(g.hasta)+'</div>'+
        '<form class="rt-join su-form" id="su-f"><span class="su-bs">Bs</span><input id="su-v" type="number" inputmode="decimal" step="0.01" min="0.01" max="'+g.maximo+'" placeholder="0,00" style="text-transform:none;letter-spacing:0"><button class="primary" type="submit" id="su-ok">Pujar</button></form>'+
        '<p class="fine">Entre Bs 0,01 y Bs '+g.maximo+'. Gana la más baja que nadie más repita.</p><div id="su-vis"></div><div id="su-mias"></div><div id="su-mapa"></div>'+bases(ctx);
      $("su-f").onsubmit=function(e){e.preventDefault(); var v=parseFloat(String($("su-v").value).replace(",","."));
        if(!(v>0))return; ctx.envia({tipo:"puja",valor:Math.round(v*100)/100}); $("su-v").value=""; $("su-v").focus();};
    }
    $("su-q").textContent=g.quedan>0?"Te quedan "+g.quedan+(g.quedan===1?" puja":" pujas"):"Sin pujas";
    $("su-ok").disabled=!(g.quedan>0);
    var vis=g.enlace&&!g.visito?'<div class="actions"><button type="button" class="ghost" id="su-visita">Visitar al patrocinador · +2 pujas y mapa</button></div>':'';
    if($("su-vis").getAttribute("data-h")!==vis){$("su-vis").innerHTML=vis;$("su-vis").setAttribute("data-h",vis);
      if($("su-visita"))$("su-visita").onclick=function(){window.open(g.enlace,"_blank","noopener"); ctx.envia({tipo:"visita"});};}
    var mi=g.mias.length?'<h4>Tus pujas</h4><ul class="su-mias">'+g.mias.map(function(x){var e=ESTADO[x.e];return '<li class="'+e[1]+'"><b>'+bs(x.v)+'</b><span>'+e[0]+'</span></li>';}).join("")+'</ul>':'';
    if($("su-mias").getAttribute("data-h")!==mi){$("su-mias").innerHTML=mi;$("su-mias").setAttribute("data-h",mi);}
    var mp=mapaHtml(g); if($("su-mapa").getAttribute("data-h")!==mp){$("su-mapa").innerHTML=mp;$("su-mapa").setAttribute("data-h",mp);}
  },
  pantalla:function(el,g,ctx){
    var h='<div class="su-proy"><div class="jg-turno"><span>La oferta más baja que nadie repita gana</span></div><p class="vv-cuenta su-reloj">'+reloj(g.hasta)+'</p>'+
      '<div class="so-cifras grande"><div><b>'+g.total+'</b><span>pujas</span></div><div><b>'+g.personas+'</b><span>personas</span></div></div>'+
      '<div class="su-uno">'+unete(ctx)+marcaGrande(ctx)+'</div></div>';
    if(el.getAttribute("data-h")!==h){el.innerHTML=h;el.setAttribute("data-h",h);}
  },
  fin:function(g,ctx){
    if(!g)return "";
    var mias=g.mias&&g.mias.length?'<h4>Tus pujas</h4><div class="su-cierre">'+g.mias.map(function(x){return '<span class="'+(x.e==="repetida"?'rep':x.e==="ganadora"?'gana':'uni')+'">'+bs(x.v)+'</span>';}).join("")+'</div>':'';
    return cierreHtml(g,ctx,ctx.yo.rol==="pantalla")+mias+(ctx.yo.rol==="pantalla"?marcaGrande(ctx):'');
  }
});
})();
