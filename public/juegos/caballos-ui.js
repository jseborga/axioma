/* ===========================================================
   THE FINAL TEST · Carrera de caballos (pantalla)
   El hipódromo con los cuatro carriles: los caballos galopan hasta su
   casilla nueva al final de cada ronda (los elementos se reutilizan
   para que la transición se vea). En el teléfono, debajo, la elección
   de dificultad, la pregunta y el resultado de la ronda; en el
   proyector, la pista en grande y lo que pasa en la ronda.
   =========================================================== */
(function(){
"use strict";
var S=window.AxSala, J=window.AxJuegos; if(!S||!J)return;
var DIF={1:{nom:"Fácil",ico:"🐢",mas:1,menos:1},2:{nom:"Media",ico:"🐎",mas:2,menos:1},3:{nom:"Difícil",ico:"🔥",mas:3,menos:2}};
var BOTS=["fácil","medio","difícil"], FIG=["▲","◆","●","■"];
function $(id){return document.getElementById(id);}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function barra(h,total){return h?'<div class="jg-barra"><i data-hasta="'+h+'" data-total="'+total+'"></i></div>':'';}
function reloj(h){return h?'<span class="jg-reloj" data-hasta="'+h+'"></span>':'';}
function signo(n){return n>0?"+"+n:n<0?"−"+(-n):"±0";}
function nombre(g,id){return (g.bots[id]?"🤖 ":"")+(g.nombres[id]||"?");}

/* ---------- la pista ---------- */
function izq(pos,meta){return "calc("+(pos/meta)+" * (100% - 2.1em))";}
function pista(host,g,ctx,grande){
  var clave=g.orden.join(",")+"|"+g.meta+"|"+JSON.stringify(g.cas)+"|"+(grande?1:0);
  if(host.getAttribute("data-k")!==clave){
    host.setAttribute("data-k",clave);
    host.innerHTML='<div class="hc-pista'+(grande?' grande':'')+'" style="--meta:'+g.meta+'">'+g.orden.map(function(id,i){
      return '<div class="hc-carril c'+i+(id===ctx.yo.id?' yo':'')+'" data-id="'+esc(id)+'"><span class="hc-nom"><b>'+(i+1)+'</b>'+esc(nombre(g,id))+'<em class="hc-pos"></em></span>'+
        '<div class="hc-cesped">'+Object.keys(g.cas).map(function(p){return '<i class="hc-cas '+g.cas[p]+'" style="left:'+izq(+p,g.meta)+'" title="'+(g.cas[p]==="z"?"Zanahoria: +2":"Barro: −1")+'"><span>'+(g.cas[p]==="z"?"🥕":"💧")+'</span></i>';}).join("")+
        '<span class="hc-meta" aria-hidden="true"></span><span class="hc-caballo" style="left:'+izq(0,g.meta)+'"><b aria-hidden="true">🏇</b><em class="hc-delta"></em></span></div></div>';}).join("")+
      '</div><p class="hc-ley"><span>🥕 zanahoria +2</span><span>💧 barro −1</span><span>⚡ el más rápido +1</span></p>';
  }
  g.orden.forEach(function(id){
    var c=host.querySelector('.hc-carril[data-id="'+(window.CSS&&CSS.escape?CSS.escape(id):id)+'"]'); if(!c)return;
    var cab=c.querySelector(".hc-caballo"), p=g.pos[id]||0, antes=+cab.getAttribute("data-p")||0;
    if(cab.getAttribute("data-p")!==String(p)){
      cab.style.left=izq(p,g.meta);
      cab.classList.remove("galopa","atras"); void cab.offsetWidth; cab.classList.add(p>=antes?"galopa":"atras");
      cab.setAttribute("data-p",p);
    }
    c.querySelector(".hc-pos").textContent=g.llegadas.indexOf(id)>=0?"🏁 "+(g.llegadas.indexOf(id)+1)+".º":p+"/"+g.meta;
    var u=g.ult&&g.ult[id], dl=c.querySelector(".hc-delta");
    var t=(g.fase==="resultado"&&u)?signo(u.mov)+(u.rapido?" ⚡":"")+(u.extra==="z"?" 🥕":u.extra==="b"?" 💧":""):
      (g.fase==="pregunta"&&g.respondio[id])?"✔":(g.fase==="elige"&&g.eligio[id]!=null)?"listo":"";
    if(dl.textContent!==t){dl.textContent=t; dl.className="hc-delta"+(t?" on":"")+(u&&g.fase==="resultado"?(u.mov>0?" sube":u.mov<0?" baja":""):"");}
    c.classList.toggle("lider",g.orden.every(function(o){return (g.pos[o]||0)<=p;})&&p>0);
  });
}

/* ---------- lo que pasa en la ronda ---------- */
function resumen(g,ctx){
  if(!g.ult)return "";
  return '<ul class="hc-res">'+g.orden.map(function(id){var u=g.ult[id]; if(!u)return "";
    return '<li class="'+(u.ok?"bien":"mal")+(id===ctx.yo.id?" yo":"")+'"><span>'+esc(nombre(g,id))+'</span><small>'+DIF[u.d].ico+' '+DIF[u.d].nom+'</small>'+
      '<b>'+(u.ok?"✓":"✗")+' '+signo(u.mov)+'</b>'+(u.rapido?'<em>⚡ más rápido</em>':'')+(u.extra==="z"?'<em>🥕 zanahoria</em>':u.extra==="b"?'<em>💧 barro</em>':'')+'</li>';}).join("")+'</ul>';
}
function cabecera(g){
  var lider=null; g.orden.forEach(function(id){if(lider===null||g.pos[id]>g.pos[lider])lider=id;});
  return '<div class="jg-turno"><span>Ronda '+(g.ronda||1)+' · meta en '+g.meta+'</span>'+(g.hasta?reloj(g.hasta):'')+'</div>';
}
var hc={ronda:-1,fase:""};
function jugador(el,g,ctx){
  if(el.getAttribute("data-f")!=="hc"){el.setAttribute("data-f","hc");el.innerHTML='<div id="hc-cab"></div><div id="hc-pista"></div><div id="hc-panel"></div>';}
  pista($("hc-pista"),g,ctx,false);
  $("hc-cab").innerHTML=g.fase==="listos"?'':cabecera(g);
  var mi=g.mi, clave=g.fase+"|"+g.ronda+"|"+(mi?[mi.eleccion,mi.resp,(mi.ocultas||[]).join(".")].join("/"):"")+"|"+JSON.stringify(g.eligio)+JSON.stringify(g.respondio);
  var pn=$("hc-panel"); if(pn.getAttribute("data-k")===clave)return; pn.setAttribute("data-k",clave);
  var h="", seg=g.segundos*1000;
  if(g.fase==="listos")h='<p class="vv-grande">¡En sus marcas!</p><p class="vv-cuenta">'+reloj(g.hasta)+'</p><p class="fine hc-c">Elige en cada ronda a cuánto te la juegas: cuanto más difícil, más avanzas… y más retrocedes si fallas.</p>';
  else if(!mi)h='<p class="rt-hoy">Mira la carrera en la pantalla grande.</p>';
  else if(g.fase==="elige"){
    if(mi.eleccion)h='<p class="hc-espera">Vas con '+DIF[mi.eleccion].ico+' <b>'+DIF[mi.eleccion].nom+'</b>. Esperando a los demás…</p>';
    else h='<h4 class="hc-tit">¿A cuánto te la juegas?</h4>'+barra(g.hasta,9000)+'<div class="hc-difs">'+[1,2,3].map(function(d){
      return '<button type="button" class="hc-dif d'+d+'" data-d="'+d+'"><span>'+DIF[d].ico+'</span><b>'+DIF[d].nom+'</b><small>acierto <em>+'+DIF[d].mas+'</em> · fallo <em>−'+DIF[d].menos+'</em></small></button>';}).join("")+'</div>'+
      '<p class="fine hc-c">Te faltan '+(g.meta-(g.pos[ctx.yo.id]||0))+' casillas. Si no eliges, vas en Fácil.</p>';
  }else if(g.fase==="pregunta"&&mi.q){
    var oc=mi.ocultas||[], yaR=mi.resp!=null;
    h='<div class="hc-qcab"><span class="chip d'+mi.eleccion+'">'+DIF[mi.eleccion].ico+' '+DIF[mi.eleccion].nom+'</span>'+(mi.tema?'<span class="chip">'+esc(mi.tema)+'</span>':'')+'</div>'+barra(g.hasta,seg)+
      '<p class="vv-q hc-q">'+esc(mi.q)+'</p><div class="vv-ops n'+mi.o.length+'">'+mi.o.map(function(t,i){var fuera=oc.indexOf(i)>=0;
        return '<button type="button" class="vv-op o'+i+(fuera?' fuera':'')+(mi.resp===i?' mia':'')+'" data-i="'+i+'"'+(yaR||fuera?' disabled':'')+'><i>'+FIG[i]+'</i><span>'+esc(t)+'</span></button>';}).join("")+'</div>'+
      (yaR?'<p class="hc-espera">Respuesta enviada. Esperando a los demás…</p>':
        (!mi.comodin?'<div class="actions"><button type="button" class="ghost" id="hc-5050">🎯 Comodín 50:50 <small>(uno por carrera)</small></button></div>':''));
  }else if(g.fase==="resultado"&&g.ult&&g.ult[ctx.yo.id]){
    var u=g.ult[ctx.yo.id];
    h='<div class="vv-res '+(u.ok?'bien':'mal')+' hc-ban"><b>'+(u.ok?'¡Correcto! ':'Fallaste. ')+(u.mov>0?'Avanzas '+u.mov:u.mov<0?'Retrocedes '+(-u.mov):'Te quedas igual')+'</b>'+
      '<span>'+[u.rapido?'⚡ ¡El más rápido! +1':'',u.extra==="z"?'🥕 ¡Zanahoria! +2':u.extra==="b"?'💧 Barro: −1':'',
        u.resp==null?'Sin respuesta'+(mi.o&&mi.c!=null?' · era: '+esc(mi.o[mi.c]):''):(!u.ok&&mi.o&&mi.c!=null?'Era: '+esc(mi.o[mi.c]):'')].filter(Boolean).join(' · ')+'</span></div>'+resumen(g,ctx);
  }else if(g.fase==="resultado")h=resumen(g,ctx);
  pn.innerHTML=h;
  pn.querySelectorAll("[data-d]").forEach(function(b){b.onclick=function(){ctx.envia({tipo:"elige",d:+this.getAttribute("data-d")});};});
  pn.querySelectorAll(".vv-op[data-i]:not([disabled])").forEach(function(b){b.onclick=function(){
    pn.querySelectorAll(".vv-op").forEach(function(x){x.disabled=true;}); this.classList.add("mia"); ctx.envia({tipo:"resp",i:+this.getAttribute("data-i")});};});
  if($("hc-5050"))$("hc-5050").onclick=function(){this.disabled=true;ctx.envia({tipo:"comodin"});};
}
function pantalla(el,g,ctx){
  if(el.getAttribute("data-f")!=="hcp"){el.setAttribute("data-f","hcp");el.innerHTML='<div id="hc-cab"></div><div id="hc-pista"></div><div id="hc-panel"></div>';}
  pista($("hc-pista"),g,ctx,true);
  $("hc-cab").innerHTML=g.fase==="listos"?'<p class="vv-grande">¡En sus marcas!</p><p class="vv-cuenta">'+reloj(g.hasta)+'</p>':cabecera(g);
  var h="";
  if(g.fase==="elige")h='<p class="hc-proy">Ronda '+g.ronda+': cada jinete elige a cuánto se la juega… <b>'+Object.keys(g.eligio).length+' de '+g.orden.length+'</b></p>';
  else if(g.fase==="pregunta")h='<p class="hc-proy">'+g.orden.map(function(id){var d=g.eligio[id];
    return '<span class="chip d'+d+'">'+esc(nombre(g,id))+' · '+(DIF[d]?DIF[d].ico+' '+DIF[d].nom:'')+(g.respondio[id]?' ✔':'')+'</span>';}).join(" ")+'</p>';
  else if(g.fase==="resultado")h=resumen(g,ctx)+(g.preguntas?'<div class="hc-qs">'+Object.keys(g.preguntas).map(function(l){var q=g.preguntas[l];
    return '<p><small>'+DIF[l].ico+' '+DIF[l].nom+'</small> '+esc(q.q)+' <b>'+esc(q.correcta)+'</b></p>';}).join("")+'</div>':'');
  var pn=$("hc-panel"); if(pn.getAttribute("data-h")!==h){pn.innerHTML=h;pn.setAttribute("data-h",h);}
}

S.registra("caballos",{
  icono:"🏇",
  desc:"Carrera de preguntas para hasta 4 jinetes: elige la dificultad, acierta para galopar y no falles o retrocedes. Con bots de tres niveles.",
  reglas:["En cada ronda eliges a cuánto te la juegas: <b>Fácil</b> (+1 / −1), <b>Media</b> (+2 / −1) o <b>Difícil</b> (+3 / −2), y respondes una pregunta de esa dificultad.",
    "El acierto más rápido de la ronda galopa ⚡ una casilla más.","En la pista hay 🥕 zanahorias (+2) y 💧 charcos de barro (−1).",
    "Cada jinete tiene un comodín 50:50 para toda la carrera.","Gana quien cruza primero la meta. Las preguntas salen del banco general (más de mil, en 19 áreas) o de tus propias preguntas.",
    "Los asientos libres se llenan con bots: fácil, medio o difícil. Los bots arriesgan más cuando van por detrás."],
  contraBots:true,
  opciones:function(o){
    o=o||{};
    var sel=function(n,lista,v){return '<select name="'+n+'">'+lista.map(function(x){return '<option value="'+x[0]+'"'+(String(x[0])===String(v)?' selected':'')+'>'+x[1]+'</option>';}).join("")+'</select>';};
    setTimeout(function(){var el=document.getElementById("hc-areas"); if(el&&window.AxAreas)AxAreas.pinta(el,o.areas||[]);},0);
    return '<div class="rt-2"><label>Largo de la pista'+sel("meta",[[12,"Corta · 12"],[16,"Media · 16"],[20,"Larga · 20"],[25,"Maratón · 25"]],o.meta||16)+'</label>'+
      '<label>Tiempo por pregunta'+sel("segundos",[[10,"10 s"],[15,"15 s"],[20,"20 s"],[25,"25 s"]],o.segundos||15)+'</label></div>'+
      '<label>Nivel de los bots'+sel("bots",[[0,"Fácil: trotan y fallan a menudo"],[1,"Medio: aciertan casi siempre lo fácil"],[2,"Difícil: arriesgan y aciertan mucho"]],o.bots==null?1:o.bots)+'</label>'+
      (window.AxAreas?AxAreas.html("hc-areas"):'');
  },
  leeOpciones:function(f){return {meta:+f.querySelector("[name=meta]").value,segundos:+f.querySelector("[name=segundos]").value,bots:+f.querySelector("[name=bots]").value,
    areas:window.AxAreas?AxAreas.lee(f.querySelector("#hc-areas")):[]};},
  jugador:jugador,
  pantalla:pantalla,
  fin:function(g,ctx){
    if(!g)return "";
    var gana=g.llegadas[0]||g.orden.slice().sort(function(a,b){return g.pos[b]-g.pos[a];})[0];
    var el=document.createElement("div"); pista(el,g,ctx,ctx.yo.rol==="pantalla");
    return '<div class="hc-gana"><span>🏆</span><b>'+(gana===ctx.yo.id?'¡Ganaste la carrera!':'¡Gana '+esc(nombre(g,gana))+'!')+'</b><small>'+(g.ronda)+' rondas · bots '+BOTS[g.nivelBots]+'</small></div>'+el.innerHTML;
  }
});
})();
