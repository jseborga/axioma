/* ===========================================================
   THE FINAL TEST · juegos de estrategia (pantalla)
   Tableros de Gomoku, Hex y Tres en raya cuántico, y los bots que
   corren en el propio teléfono (Hex usa Monte Carlo con UCB1).
   =========================================================== */
(function(){
"use strict";
var S=window.AxSala, J=window.AxJuegos; if(!S||!J)return;
var NIV=["Fácil","Medio","Difícil"];
var TIEMPOS='<label>Tiempo por jugada (en línea)<select name="tiempo"><option value="30">30 s</option><option value="60" selected>1 min</option><option value="120">2 min</option><option value="0">Sin límite</option></select></label>';
function leeTiempo(f){return {tiempo:+f.querySelector("[name=tiempo]").value};}

/* cabecera común: de quién es el turno y su reloj */
function turno(g,ctx,fichas){
  if(g.fin){
    var txt=g.gan?(g.gan===ctx.yo.id?"¡Ganaste!":(ctx.local&&!ctx.sala.jugadores.some(function(j){return j.bot;})?ctx.nombre(g.gan)+" gana":"Gana "+ctx.nombre(g.gan))):"Empate";
    return '<div class="jg-turno mio"><span>'+ctx.esc(txt)+(g.motivo==="tiempo"?" · por tiempo":"")+'</span></div>';
  }
  var mio=g.turno===ctx.yo.id;
  return '<div class="jg-turno'+(mio?' mio':'')+'"><span>'+(fichas[g.orden.indexOf(g.turno)]||"")+' '+
    (mio?(ctx.local&&!ctx.sala.jugadores.some(function(j){return j.bot;})?"Turno de "+ctx.esc(ctx.nombre(g.turno)):"Te toca"):"Turno de "+ctx.esc(ctx.nombre(g.turno)))+'</span>'+
    (g.hasta?'<span class="jg-reloj" data-hasta="'+g.hasta+'"></span>':'')+'</div>';
}

/* al terminar se deja a la vista el tablero final, con la línea o el camino ganador */
function tableroFinal(tipo){return function(g,ctx){if(!g)return ""; var d=document.createElement("div"); S.UI[tipo].jugador(d,g,ctx); return d.innerHTML;};}

/* ===================== GOMOKU ===================== */
S.registra("gomoku",{
  fin:tableroFinal("gomoku"),
  icono:"⚫",local:true,niveles:NIV,
  desc:"Cinco en línea en un tablero de 15×15: el primero que alinea cinco piezas gana.",
  reglas:["Se juega por turnos: negras y blancas colocan una pieza en cualquier casilla libre.","Gana quien alinee cinco o más seguidas en horizontal, vertical o diagonal.","Si se llena el tablero sin cinco en línea, es empate."],
  opciones:function(){return TIEMPOS;}, leeOpciones:leeTiempo,
  botLocal:function(E,id){var g=E.g;return {c:J.def("gomoku").mejor(g.t,g.n,g.turno+1,E.nivel,Math.random)};},
  jugador:function(el,g,ctx){
    var lin={}; (g.linea||[]).forEach(function(i){lin[i]=1;});
    var mio=!g.fin&&g.turno===ctx.yo.id, h=turno(g,ctx,["⚫","⚪"])+'<div class="gk-tab" style="--n:'+g.n+'">';
    for(var i=0;i<g.t.length;i++){var v=g.t[i];
      h+='<button type="button" class="gk-c'+(v?' p'+v:'')+(i===g.ult?' ult':'')+(lin[i]?' lin':'')+'" data-c="'+i+'"'+(v||!mio?' disabled':'')+' aria-label="Casilla '+(Math.floor(i/g.n)+1)+'-'+(i%g.n+1)+'"></button>';}
    h+='</div>';
    el.innerHTML=h;
    if(mio)el.querySelector(".gk-tab").onclick=function(e){var b=e.target.closest("[data-c]");if(b&&!b.disabled){b.disabled=true;ctx.envia({c:+b.getAttribute("data-c")});}};
  }
});

/* ===================== HEX ===================== */
/* bot del teléfono: Monte Carlo con UCB1 sobre las mejores candidatas.
   Cada partida simulada llena el tablero al azar; en Hex siempre gana alguien. */
function hexBot(E){
  var g=E.g, d=J.def("hex"), n=g.n, v=g.turno+1, nivel=E.nivel==null?1:E.nivel;
  if(nivel===0)return {c:d.heuristica(g.t,n,v,Math.random)};
  var libres=[],i; for(i=0;i<g.t.length;i++)if(!g.t[i])libres.push(i);
  /* jugada ganadora inmediata, o bloquear la del rival */
  for(i=0;i<libres.length;i++){g.t[libres[i]]=v; var w=d.distancia(g.t,n,v)===0; g.t[libres[i]]=0; if(w)return {c:libres[i]};}
  for(i=0;i<libres.length;i++){g.t[libres[i]]=3-v; var l=d.distancia(g.t,n,3-v)===0; g.t[libres[i]]=0; if(l)return {c:libres[i]};}
  var cand=libres;
  if(libres.length>24){ /* se estudian las 24 más prometedoras según las distancias */
    cand=libres.map(function(c){g.t[c]=v;var p=d.distancia(g.t,n,3-v)-d.distancia(g.t,n,v);g.t[c]=0;return {c:c,p:p};})
      .sort(function(a,b){return b.p-a.p;}).slice(0,24).map(function(x){return x.c;});
  }
  var gan=new Float64Array(cand.length), vis=new Float64Array(cand.length), total=0;
  var t=new Int8Array(g.t.length), vac=new Int32Array(libres.length), limite=Date.now()+(nivel===1?450:1300);
  var visto=new Int32Array(g.t.length), marca=0, cola=new Int32Array(g.t.length);
  function gano(){ /* ¿el jugador v conecta en el tablero lleno? BFS */
    marca++; var cab=0,fin=0;
    for(var k=0;k<n;k++){var s=v===1?k:k*n; if(t[s]===v){visto[s]=marca;cola[fin++]=s;}}
    while(cab<fin){var x=cola[cab++], r=(x/n)|0, c=x%n;
      if((v===1&&r===n-1)||(v===2&&c===n-1))return true;
      var vs=d.vecinos(n,x); for(var q=0;q<vs.length;q++){var y=vs[q]; if(t[y]===v&&visto[y]!==marca){visto[y]=marca;cola[fin++]=y;}}}
    return false;
  }
  while(Date.now()<limite||total<cand.length){
    for(var rep=0;rep<32;rep++){
      var b=0,bs=-1; for(i=0;i<cand.length;i++){var u=vis[i]===0?1e9:gan[i]/vis[i]+1.1*Math.sqrt(Math.log(total+1)/vis[i]); if(u>bs){bs=u;b=i;}}
      for(i=0;i<g.t.length;i++)t[i]=g.t[i];
      t[cand[b]]=v; var m=0; for(i=0;i<libres.length;i++)if(libres[i]!==cand[b])vac[m++]=libres[i];
      for(i=m-1;i>0;i--){var j=(Math.random()*(i+1))|0,tmp=vac[i];vac[i]=vac[j];vac[j]=tmp;}
      for(i=0;i<m;i++)t[vac[i]]=(i%2===0)?3-v:v;
      vis[b]++; total++; if(gano())gan[b]++;
    }
  }
  var mej=0; for(i=1;i<cand.length;i++)if(vis[i]>vis[mej])mej=i;
  return {c:cand[mej]};
}
S.registra("hex",{
  fin:tableroFinal("hex"),
  icono:"⬢",local:true,niveles:NIV,
  desc:"Une tus dos bordes del tablero antes que el rival. Sin capturas ni empates.",
  reglas:["Rojo empieza y une el borde de arriba con el de abajo; azul, el de la izquierda con el de la derecha.","Por turnos, cada uno pinta una casilla libre.","Gana quien forme un camino continuo entre sus dos bordes. En Hex nunca hay empate."],
  opciones:function(o){return '<label>Tamaño<select name="tam"><option value="7">7×7 · rápido</option><option value="9" selected>9×9</option><option value="11">11×11 · clásico</option></select></label>'+TIEMPOS;},
  leeOpciones:function(f){var o=leeTiempo(f);o.tam=+f.querySelector("[name=tam]").value;return o;},
  botLocal:hexBot,
  jugador:function(el,g,ctx){
    var n=g.n, s=20, w=Math.sqrt(3)*s, cam={}; (g.camino||[]).forEach(function(i){cam[i]=1;});
    function cx(r,c){return w*(c+r/2)+w*1.4;} function cy(r){return s*1.5*r+s*1.6;}
    var W=w*(n+(n-1)/2)+w*2.8, H=s*1.5*(n-1)+s*3.2, mio=!g.fin&&g.turno===ctx.yo.id;
    function hexa(x,y){var p=[];for(var k=0;k<6;k++){var a=Math.PI/180*(60*k-30);p.push((x+s*Math.cos(a)).toFixed(1)+","+(y+s*Math.sin(a)).toFixed(1));}return p.join(" ");}
    var h='<svg class="hx-svg" viewBox="0 0 '+W.toFixed(0)+' '+H.toFixed(0)+'" role="img" aria-label="Tablero de Hex">'+
      '<line x1="'+(cx(0,0)-w/2)+'" y1="'+(cy(0)-s*1.15)+'" x2="'+(cx(0,n-1)+w/2)+'" y2="'+(cy(0)-s*1.15)+'" class="hx-b1"/>'+
      '<line x1="'+(cx(n-1,0)-w/2)+'" y1="'+(cy(n-1)+s*1.15)+'" x2="'+(cx(n-1,n-1)+w/2)+'" y2="'+(cy(n-1)+s*1.15)+'" class="hx-b1"/>'+
      '<line x1="'+(cx(0,0)-w*0.95)+'" y1="'+(cy(0)-s*0.5)+'" x2="'+(cx(n-1,0)-w*0.95)+'" y2="'+(cy(n-1)+s*0.5)+'" class="hx-b2"/>'+
      '<line x1="'+(cx(0,n-1)+w*0.95)+'" y1="'+(cy(0)-s*0.5)+'" x2="'+(cx(n-1,n-1)+w*0.95)+'" y2="'+(cy(n-1)+s*0.5)+'" class="hx-b2"/>';
    for(var r=0;r<n;r++)for(var c=0;c<n;c++){var i=r*n+c,v=g.t[i];
      h+='<polygon points="'+hexa(cx(r,c),cy(r))+'" class="hx-c'+(v?' p'+v:(mio?' libre':''))+(i===g.ult?' ult':'')+(cam[i]?' cam':'')+'" data-c="'+i+'"/>';}
    h+='</svg>';
    el.innerHTML=turno(g,ctx,['<i class="hx-f p1"></i>','<i class="hx-f p2"></i>'])+h+
      '<p class="fine">Rojo: arriba ↔ abajo · Azul: izquierda ↔ derecha</p>';
    if(mio)el.querySelector(".hx-svg").onclick=function(e){var p=e.target.closest("[data-c]"); if(!p)return; var i=+p.getAttribute("data-c"); if(g.t[i])return; ctx.envia({c:i});};
  }
});

/* ===================== TRES EN RAYA CUÁNTICO ===================== */
var selQ=null;
S.registra("cuantico",{
  fin:tableroFinal("cuantico"),
  icono:"⚛️",local:true,niveles:["Fácil","Medio"],
  desc:"Cada jugada está en dos casillas a la vez hasta que el tablero se mide.",
  reglas:["En tu turno eliges DOS casillas: tu marca queda en superposición en ambas (por ejemplo X₁ en dos sitios).","Las marcas enlazan casillas. Cuando un enlace cierra un ciclo, el tablero se mide: el rival de quien lo cerró elige en cuál de sus dos casillas se queda esa marca, y las demás marcas del ciclo caen en cascada.","Las marcas medidas son definitivas. Gana quien forme tres en raya con marcas medidas.","Si los dos forman línea en la misma medición, gana la línea cuya marca más reciente es más antigua; el otro se lleva medio punto."],
  opciones:function(){return TIEMPOS;}, leeOpciones:leeTiempo,
  jugador:function(el,g,ctx){
    var yo=g.orden.indexOf(ctx.yo.id), mio=!g.fin&&g.turno===ctx.yo.id, lib=[], i, cl={};
    for(i=0;i<9;i++)if(!g.cas[i])lib.push(i);
    (g.lineas||[]).forEach(function(l){l.cas.forEach(function(c){cl[c]=1;});});
    var col=g.colapso?g.marcas[g.colapso.k-1]:null;
    if(!mio||col)selQ=null;
    var ayuda=g.fin?"":col?(mio?"Mide el tablero: elige en qué casilla se queda "+(col.j===0?"X":"O")+col.k+".":"Se cerró un ciclo: "+ctx.esc(ctx.nombre(g.turno))+" elige cómo se mide."):
      mio?(lib.length===1?"Última casilla libre: tu marca va directa.":selQ===null?"Elige la primera casilla de tu marca.":"Ahora la segunda casilla."):"";
    var h=turno(g,ctx,["✕","◯"])+(ayuda?'<p class="fine qt-ayuda">'+ayuda+'</p>':'')+'<div class="qt-tab">';
    for(i=0;i<9;i++){var c=g.cas[i], clase="qt-c", dentro="";
      if(c){clase+=" cl j"+c.j+(cl[i]?" lin":"");dentro='<b>'+(c.j===0?"✕":"◯")+'<sub>'+c.k+'</sub></b>';}
      else{
        dentro='<span class="qt-sp">'+g.marcas.filter(function(m){return m.c==null&&(m.a===i||m.b===i);}).map(function(m){
          return '<em class="j'+m.j+(col&&m.k===col.k?' ciclo':'')+'">'+(m.j===0?"✕":"◯")+m.k+'</em>';}).join("")+'</span>';
        if(mio&&(col?(i===col.a||i===col.b):true))clase+=" toca";
        if(selQ===i)clase+=" sel";
      }
      h+='<button type="button" class="'+clase+'" data-c="'+i+'"'+(clase.indexOf("toca")<0?' disabled':'')+'>'+dentro+'</button>';}
    h+='</div>'+(g.medida?'<p class="fine">Última medición: la marca '+g.medida.k+' se quedó en su casilla y el resto cayó en cascada.</p>':'');
    el.innerHTML=h;
    if(!mio)return;
    el.querySelector(".qt-tab").onclick=function(e){
      var b=e.target.closest("[data-c]"); if(!b||b.disabled)return; var i=+b.getAttribute("data-c");
      if(col){ctx.envia({tipo:"colapsa",casilla:i});return;}
      if(lib.length===1){ctx.envia({tipo:"marca",a:i,b:i});return;}
      if(selQ===null){selQ=i;S.UI.cuantico.jugador(el,g,ctx);return;}
      if(selQ===i){selQ=null;S.UI.cuantico.jugador(el,g,ctx);return;}
      var a=selQ; selQ=null; ctx.envia({tipo:"marca",a:a,b:i});
    };
  }
});
})();
