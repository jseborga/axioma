/* ===========================================================
   THE FINAL TEST · Competencias sin fin (maratón) · pantalla
   Memoria sin fin, maratón de sudoku y maratón de Axioma: se juega
   hasta perder todas las vidas o hasta que se acabe el reloj. Cada
   paso lo comprueba el servidor; aquí solo se pinta y se envía.
   Arriba queda un marcador con las vidas, la marca, el reloj y el
   tablero en juego; «Salir» deja la partida guardada y «Plantarme»
   la termina con lo conseguido.
   =========================================================== */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var X=window.AxMaraton, hud=$("mar-hud"), rp=$("rapido-panel");
if(!X||!hud||!rp)return;

var st=null;               /* {c, cfg, intento, paso, tab, fin, agotado, cupon, timers} */
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function espera(ms,f){if(!st)return; var t=setTimeout(function(){if(st)f();},ms); st.timers.push(t);}
function reloj(ms){var s=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(s/60),g=s%60;return m+":"+(g<10?"0":"")+g;}
function aviso(t,k){var a=$("mh-aviso"); if(!a)return; a.textContent=t||""; a.className="mh-aviso"+(k?" "+k:"");}
function extraTxt(s){return s>=60?(s/60)+(s===60?" minuto":" minutos"):s+" segundos";}
var MOTIVO={vidas:"Te quedaste sin vidas.",tiempo:"Se acabó el tiempo.",plantado:"Te plantaste.",completo:"¡Completaste todos los tableros!",
  inactivo:"La partida se cerró tras 3 minutos sin jugar.",cerrada:"La competencia se cerró."};

/* ---------- entrar y salir ---------- */
function jugar(c,cfg){
  cierra();
  st={c:c,cfg:cfg,intento:null,paso:null,tab:-1,fin:null,agotado:false,cupon:null,timers:[],latido:null,ocupado:false};
  intro();
}
function reglas(c){
  var m=c.maraton||X.reglas(c.juego,{}), l=[];
  l.push("Tienes <b>"+m.vidas+(m.vidas===1?" vida":" vidas")+"</b>: cada fallo quita una"+(c.juego==="memoria_inf"?" y repite la secuencia.":"."));
  if(c.juego==="memoria_inf"){
    l.push("Empieza con 3 casillas y suma una cada vez, sin tope; las casillas se encienden cada vez más rápido.");
    l.push("Tu marca es la secuencia más larga que repitas. Si dejas de jugar 3 minutos, la partida se cierra con lo que llevas.");
  }else{
    l.push("Reloj de <b>"+m.reloj+" minutos</b>"+(m.extra?"; cada "+(c.juego==="sudoku_mar"?"sudoku":"tablero")+" resuelto suma <b>"+extraTxt(m.extra)+"</b>.":"."));
    l.push(c.juego==="sudoku_mar"
      ?"Cada cifra bien puesta vale 1, 2, 3 o 4 puntos según el nivel (Fácil, Medio, Difícil, Experto), y completar el sudoku, 25, 50, 75 o 100 más. Puedes usar notas; no hay pistas."
      :"Cada tablero resuelto vale 10 puntos en 4×4 y más cuanto más grande. Elige las dos reglas y marca las celdas llenas; al comprobar mal pierdes una vida. Sin pistas.");
  }
  l.push("Tu partida se guarda paso a paso: si se corta la conexión, vuelve y sigue donde la dejaste.");
  return '<ul class="mi-reglas">'+l.map(function(x){return "<li>"+x+"</li>";}).join("")+'</ul>';
}
function intro(){
  var c=st.c, J=X.JUEGOS[c.juego], sigue=c.me&&c.me.en_juego;
  muestra("rapido");
  hud.hidden=true;
  rp.innerHTML='<button type="button" class="rt-back" id="mi-back">‹ '+esc(c.name)+'</button>'+
    '<div class="rt-head"><h3>'+J.icono+' '+esc(J.nom)+'</h3><span class="chip activo">Sin fin</span></div>'+
    '<p class="rt-meta">'+esc(c.name+" · "+c.org_name)+'</p><p class="rp-desc">'+esc(J.desc)+'</p>'+reglas(c)+
    '<div class="actions"><button class="primary" id="mi-go">'+(sigue?"Seguir mi partida":"Empezar")+'</button></div><p class="msg" id="mi-msg"></p>';
  $("mi-back").onclick=function(){sal(null);};
  $("mi-go").onclick=function(){
    var b=this; b.disabled=true;
    st.cfg.conRegistro(function(){return st.cfg.api("/api/campanas/"+st.c.code+"/empezar",{});}).then(function(r){
      if(!st)return;
      st.intento=r.intento; pintaHud(); aplica(r.paso);
      if(r.reanuda)aviso("Sigues tu partida donde la dejaste.","good");
    }).catch(function(e){
      if(!st)return; b.disabled=false;
      var m=$("mi-msg"); if(m){m.className="msg bad";m.textContent=st.cfg.ERR(e);}
      if(e&&e.error==="no_attempts")espera(1200,function(){sal(null);});
    });
  };
}
/* se vuelve a la ficha de la competencia; la partida (si la hay) queda guardada en el servidor */
function sal(avisoHtml,nuevo){
  var cfg=st&&st.cfg; cierra();
  if(cfg)cfg.vuelve(avisoHtml,nuevo);
}
function cierra(){
  if(st){st.timers.forEach(clearTimeout); if(st.latido)clearInterval(st.latido);}
  st=null;
  hud.hidden=true; hud.innerHTML="";
  if(document.body.getAttribute("data-sub")==="maraton"){
    document.body.removeAttribute("data-sub");
    rp.innerHTML=""; rp.hidden=true;
    $("sud-panel").hidden=true; $("sud-acts").hidden=true;
    if(window.AxSudoku)AxSudoku.pausa();
  }
}
/* qué pantalla se ve: el panel de rápidos (memoria), el sudoku o el tablero de Axioma */
function muestra(que){
  document.body.setAttribute("data-sub","maraton");
  document.body.setAttribute("data-game",que);
  rp.hidden=que!=="rapido";
  $("sud-panel").hidden=que!=="sudoku"; $("sud-acts").hidden=que!=="sudoku";
  $("diff").hidden=true; $("sud-diff").hidden=true;
  $("status-cap").textContent="Competencia sin fin"; $("hdr").textContent=X.JUEGOS[st.c.juego].nom;
}

/* ---------- marcador ---------- */
function pintaHud(){
  hud.innerHTML='<div class="mh-top"><button type="button" class="rt-back" id="mh-salir">‹ Salir</button><b>'+esc(st.c.name)+'</b>'+
    '<button type="button" class="ghost" id="mh-plantar">Plantarme</button></div>'+
    '<div class="mh-stats"><div><small>Vidas</small><b id="mh-vidas"></b></div><div><small>'+(st.c.juego==="memoria_inf"?"Récord":"Puntos")+'</small><b id="mh-pts"></b></div>'+
    '<div id="mh-reloj-w"'+(st.c.juego==="memoria_inf"?' hidden':'')+'><small>Reloj</small><b id="mh-reloj"></b></div>'+
    '<div><small id="mh-tab-l">'+(st.c.juego==="memoria_inf"?"Ahora":st.c.juego==="sudoku_mar"?"Sudoku":"Tablero")+'</small><b id="mh-tab"></b></div></div>'+
    '<p class="mh-aviso" id="mh-aviso" role="status" aria-live="polite"></p>';
  hud.hidden=false;
  $("mh-salir").onclick=function(){
    var reloj=st.c.juego!=="memoria_inf";
    sal('<p class="rt-hoy">Tu partida queda guardada: vuelve con «Seguir mi partida»'+(reloj?' (el reloj sigue corriendo).':' (se cierra sola tras 3 minutos sin jugar).')+'</p>');
  };
  $("mh-plantar").onclick=function(){
    if(!st||!st.paso||!confirm("¿Terminar ahora la partida con "+st.paso.formato+"?"))return;
    st.cfg.api("/api/campanas/"+st.c.code+"/intentos/"+st.intento,{fin:true}).then(termina).catch(fallo);
  };
  if(st.latido)clearInterval(st.latido);
  st.latido=setInterval(tic,250);
}
function actualiza(p){
  st.paso=p;
  var v="",i; for(i=0;i<p.vidas_max;i++)v+=i<p.vidas?"♥":"♡";
  $("mh-vidas").textContent=v; $("mh-vidas").className=p.vidas<=1?"ult":"";
  $("mh-pts").textContent=p.puntos;
  if(p.restante_ms!=null){st.fin=Date.now()+p.restante_ms; st.agotado=false;}
  $("mh-tab").textContent=st.c.juego==="memoria_inf"?p.largo:(p.i+1)+" · "+(p.nivel||(p.tablero?p.tablero.n+"×"+p.tablero.n:""));
  tic();
}
function tic(){
  if(!st||st.fin==null||!$("mh-reloj"))return;
  var r=st.fin-Date.now();
  $("mh-reloj").textContent=reloj(r); $("mh-reloj").className=r<30000?"ult":"";
  if(r<=0&&!st.agotado){ st.agotado=true; aviso("¡Se acabó el tiempo!","bad"); espera(1700,function(){pideFin(0);}); }
}
/* con el reloj agotado se le pregunta al servidor, que cierra la partida con su marca */
function pideFin(n){
  envia({}).then(function(r){ if(r&&r.fin)termina(r); }).catch(function(e){
    if(e&&e.error==="bad_move"&&n<5){espera(1000,function(){pideFin(n+1);});return;}
    fallo(e);
  });
}
function envia(b){return st.cfg.api("/api/campanas/"+st.c.code+"/intentos/"+st.intento+"/paso",b);}
function cuponPaso(r){
  if(r&&r.cupon){st.cupon=r.cupon.codigo; aviso("🎁 ¡Ganaste «"+r.cupon.premio+"»! Tu cupón queda guardado en la ficha.","good");}
}
function termina(r){
  if(!st)return;
  var h='<div class="vv-res bien"><b>'+esc(r.formato)+'</b><span>'+esc(MOTIVO[r.motivo]||"")+' '+
    (r.mejoro?'¡Tu mejor marca! ':(r.best?'Tu mejor marca: '+esc(r.best.formato)+' · ':''))+(r.rank?'Puesto '+r.rank+' de '+r.players:'')+'</span></div>';
  var nuevo=r.cupon&&r.cupon.nuevo?r.cupon.codigo:st.cupon;
  sal(h,nuevo);
}
function fallo(e){
  if(!st)return;
  if(e&&e.error==="busy"){recarga();return;}
  if(e&&(e.error==="already"||e.error==="not_found")){sal('<p class="rt-hoy">Esa partida ya terminó.</p>');return;}
  aviso(st.cfg.ERR(e),"bad");
}
/* otra pestaña jugó a la vez: se pide el estado de nuevo */
function recarga(){
  st.cfg.api("/api/campanas/"+st.c.code+"/empezar",{}).then(function(r){if(!st)return; st.intento=r.intento; st.tab=-1; aplica(r.paso);}).catch(fallo);
}
function aplica(p){
  actualiza(p);
  if(st.c.juego==="memoria_inf")memoria(p);
  else if(st.c.juego==="sudoku_mar")sudoku(p);
  else axioma(p);
}

/* ---------- memoria sin fin ---------- */
function memoria(p){
  muestra("rapido");
  var fase="mira", entrada=[], cels;
  rp.innerHTML='<p class="rp-desc" id="mm-est">Mira…</p><div class="rp-grid9">'+
    [0,1,2,3,4,5,6,7,8].map(function(k){return '<button type="button" class="rp-tile" data-k="'+k+'"></button>';}).join("")+'</div>';
  cels=rp.querySelectorAll(".rp-tile");
  for(var k=0;k<cels.length;k++)cels[k].onclick=function(){toca(+this.getAttribute("data-k"));};
  var on=Math.round(p.mostrar*0.7), off=p.mostrar-on, j=0;
  function enciende(){
    if(j>=p.s.length){fase="repite"; $("mm-est").textContent="Tu turno: repite las "+p.largo+" casillas."; return;}
    var c=cels[p.s[j]]; c.classList.add("on");
    espera(on,function(){c.classList.remove("on"); j++; espera(off,enciende);});
  }
  espera(600,enciende);
  function toca(k){
    if(fase!=="repite")return;
    var bien=k===p.s[entrada.length], c=cels[k];
    c.classList.add(bien?"on":"mal"); espera(200,function(){c.classList.remove("on");c.classList.remove("mal");});
    entrada.push(k);
    if(!bien){ while(entrada.length<p.largo)entrada.push(-1); }
    if(entrada.length<p.largo)return;
    fase="enviando"; $("mm-est").textContent=bien?"¡Bien!":"Casi…";
    manda(entrada.slice(),0);
  }
  function manda(s,n){
    envia({s:s}).then(function(r){
      if(!st)return;
      if(r.fin){ aviso(r.ok?"":MOTIVO[r.motivo],r.ok?"":"bad"); espera(900,function(){termina(r);}); return; }
      cuponPaso(r); actualiza(r.paso);
      if(r.ok){ if(!r.cupon)aviso("¡Bien! Ahora "+r.paso.largo+" casillas.","good"); espera(700,function(){memoria(r.paso);}); }
      else{ aviso("Fallaste: "+(r.paso.vidas===1?"te queda 1 vida":"te quedan "+r.paso.vidas+" vidas")+". Mira otra vez.","bad"); espera(1300,function(){memoria(r.paso);}); }
    }).catch(function(e){
      if(e&&e.error==="too_fast"&&n<3){espera(600,function(){manda(s,n+1);});return;}
      fallo(e);
    });
  }
}

/* ---------- maratón de sudoku ---------- */
function sudoku(p){
  muestra("sudoku");
  if(st.tab===p.i)return;
  st.tab=p.i;
  AxSudoku.cargar({modo:"maraton",nivel:p.tipo,puzzle:p.puzzle,val:p.val,
    brief:'Sudoku <strong>'+(p.i+1)+'</strong> · nivel <strong>'+esc(p.nivel)+'</strong>. Cada cifra equivocada cuesta una vida.',
    titulo:st.c.name,
    jugar:function(k,n){
      return envia({k:k,n:n}).then(function(r){
        if(!st)return null;
        if(r.fin){ aviso(r.completo?MOTIVO.completo:r.ok?"":MOTIVO[r.motivo],r.ok?"good":"bad"); espera(r.ok?900:1500,function(){termina(r);}); return r.ok?{ok:true}:{wrong:true}; }
        cuponPaso(r); actualiza(r.paso);
        if(r.completo){
          if(!r.cupon)aviso("¡Sudoku resuelto!"+(st.paso.extra_s?" +"+extraTxt(st.paso.extra_s)+" de reloj.":""),"good");
          espera(1100,function(){sudoku(r.paso);});
          return {ok:true};
        }
        if(!r.ok)aviso(r.paso.vidas===1?"Te queda 1 vida.":"Te quedan "+r.paso.vidas+" vidas.","bad"); else if(!r.cupon)aviso("");
        return r.ok?{ok:true}:{wrong:true};
      }).catch(function(e){
        if(e&&e.error==="too_fast"){aviso("Más despacio: una cifra cada vez.","bad");return null;}
        fallo(e); return null;
      });
    }});
  $("sud-panel").scrollIntoView({behavior:"smooth",block:"start"});
}

/* ---------- maratón de Axioma ---------- */
function axioma(p){
  muestra("axioma");
  if(st.tab===p.i)return;
  st.tab=p.i;
  var t=p.tablero;
  AxApp.maraton({tablero:t,
    brief:'Tablero <strong>'+(p.i+1)+'</strong> de '+t.n+'×'+t.n+': marca las <strong>'+t.k+' celdas llenas</strong>'+
      (t.scopes.length*t.shapes.length>1?' y elige el par de reglas':'')+'. Comprobar mal cuesta una vida.',
    enviar:function(cells,scope,shape){
      return envia({cells:cells,scope:scope,shape:shape}).then(function(r){
        if(!st)return;
        if(r.fin){ AxApp.maratonAviso(r.ok?"¡Correcto!":"No es correcto.",r.ok?"good":"bad"); aviso(r.completo?MOTIVO.completo:r.ok?"":MOTIVO[r.motivo],r.ok?"good":"bad");
          espera(r.ok?900:1500,function(){termina(r);}); return; }
        cuponPaso(r); actualiza(r.paso);
        if(r.ok){
          AxApp.maratonAviso("¡Correcto!"+(st.paso.extra_s?" +"+extraTxt(st.paso.extra_s)+" de reloj.":""),"good");
          espera(1100,function(){axioma(r.paso);});
        }else AxApp.maratonAviso("No es correcto: pierdes una vida ("+(r.paso.vidas===1?"te queda 1":"te quedan "+r.paso.vidas)+").","bad");
      }).catch(function(e){
        if(e&&e.error==="too_fast"){AxApp.maratonAviso("Tómate un momento: revisa el tablero antes de comprobar.","bad");return;}
        fallo(e);
      });
    }});
}

window.AxMaratonUI={jugar:jugar,cerrar:cierra,activo:function(){return !!st;}};
})();
