/* ===========================================================
   AXIOMA · Juegos rápidos · pantalla
   Trivia, memoria, cálculo, reflejos y del 1 al 25. Se pueden
   practicar sueltos (menú → Juegos rápidos, con mejor marca local)
   o jugar como ronda de un reto, en cuyo caso los datos los da el
   servidor y el resultado se le devuelve para que lo puntúe.
   =========================================================== */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var R=window.AxRapidos, panel=$("rapido-panel");
if(!panel||!R)return;

var timers=[], tick=null, teclas=null;
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function espera(ms,f){var t=setTimeout(f,ms);timers.push(t);return t;}
function limpia(){timers.forEach(clearTimeout);timers=[];if(tick){clearInterval(tick);tick=null;}
  if(teclas){document.removeEventListener("keydown",teclas);teclas=null;}}
function pinta(h){panel.innerHTML=h;}
function guarda(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem("axr_"+k)||"null");localStorage.setItem("axr_"+k,JSON.stringify(v));}catch(e){return null}}
function cab(juego,sub){var j=R.JUEGOS[juego];
  return '<div class="rt-head"><h3>'+j.icono+' '+j.nom+'</h3>'+(sub?'<span class="chip activo" id="rp-sub">'+sub+'</span>':'')+'</div>';}
function seg(ms){return (ms/1000).toFixed(1).replace(".",",")+" s";}

/* ---------- práctica ---------- */
function practica(){
  limpia();
  var h='<h3>Juegos rápidos</h3>'+
    '<p class="fine">Cinco juegos de un minuto. Practica aquí cuando quieras; para competir con premio, crea un reto con uno de ellos.</p>';
  Object.keys(R.JUEGOS).forEach(function(k){
    var j=R.JUEGOS[k], b=guarda("best_"+k);
    h+='<button type="button" class="rt-card rp-card" data-j="'+k+'"><span class="rt-card-top"><b>'+j.icono+' '+esc(j.nom)+'</b><span class="chip">'+j.dur+'</span></span>'+
       '<small>'+esc(j.desc)+(b?' · <b>Mejor: '+esc(R.formato(k,b.score,b.seconds))+'</b>':'')+'</small></button>';
  });
  pinta(h);
  var bs=panel.querySelectorAll(".rp-card"),i;
  for(i=0;i<bs.length;i++)bs[i].onclick=function(){intro(this.getAttribute("data-j"),null);};
}

/* ---------- pantalla previa: instrucciones y Empezar ---------- */
function intro(juego,cfg){
  limpia();
  var j=R.JUEGOS[juego];
  pinta((cfg?'':'<button type="button" class="rt-back" id="rp-back">‹ Juegos rápidos</button>')+cab(juego,cfg?cfg.sub:null)+
    (cfg&&cfg.titulo?'<p class="rt-meta">'+esc(cfg.titulo)+'</p>':'')+
    '<p class="rp-desc">'+esc(j.desc)+'</p>'+
    (cfg?'<p class="fine">El tiempo empieza a contar al pulsar Empezar y solo vale el primer intento.</p>':'')+
    '<div class="actions"><button class="primary" id="rp-go">Empezar</button></div><p class="msg" id="rp-msg"></p>');
  if($("rp-back"))$("rp-back").onclick=practica;
  $("rp-go").onclick=function(){
    this.disabled=true;
    if(cfg){ cfg.pedirDatos().then(function(d){if(d)arranca(juego,d,cfg);})
      .catch(function(e){$("rp-go").disabled=false;$("rp-msg").className="msg bad";$("rp-msg").textContent=(cfg.error?cfg.error(e):"No se pudo cargar la ronda.");}); }
    else arranca(juego,R.genera(juego,(Math.random()*4294967296)>>>0),null);
  };
}
function arranca(juego,datos,cfg){
  limpia();
  JUEGO[juego](datos,cfg,function(envio){fin(juego,datos,envio,cfg);});
}
function fin(juego,datos,envio,cfg){
  limpia();
  var res=R.evalua(juego,datos,envio)||{score:0,seconds:0};
  if(cfg){cfg.alTerminar(envio,res);return;}
  var b=guarda("best_"+juego), mejor=!b||R.compara(juego,res,b)<0;
  if(mejor)guarda("best_"+juego,res);
  pinta(cab(juego,"Terminado")+
    '<div class="rp-res"><b>'+esc(R.formato(juego,res.score,res.seconds))+'</b>'+
    '<small>'+(mejor?"¡Mejor marca!":"Tu mejor marca: "+esc(R.formato(juego,b.score,b.seconds)))+'</small></div>'+
    '<div class="actions"><button class="primary" id="rp-otra">Otra vez</button><button class="ghost" id="rp-menu">Otro juego</button></div>');
  $("rp-otra").onclick=function(){intro(juego,null);};
  $("rp-menu").onclick=practica;
}

/* ---------- los juegos ---------- */
var JUEGO={};

/* Trivia: diez preguntas, doce segundos cada una */
JUEGO.trivia=function(d,cfg,done){
  var i=0, r=[], pts=0, t0=0, TMAX=12000;
  function pregunta(){
    if(i>=10){done({r:r});return;}
    var q=d.p[i];
    pinta(cab("trivia",(i+1)+" de 10")+
      '<div class="rp-bar"><i id="rp-fill"></i></div>'+
      '<p class="rp-q">'+esc(q.q)+'</p>'+
      '<div class="rp-opts">'+q.o.map(function(o,k){return '<button type="button" class="rp-opt" data-k="'+k+'">'+esc(o)+'</button>';}).join("")+'</div>'+
      '<p class="fine rp-pts" id="rp-pts">'+pts+' pts</p>');
    t0=Date.now();
    var fill=$("rp-fill");
    tick=setInterval(function(){var p=Math.max(0,1-(Date.now()-t0)/TMAX);fill.style.transform="scaleX("+p+")";if(p<=0)responde(-1);},100);
    var bs=panel.querySelectorAll(".rp-opt"),k;
    for(k=0;k<bs.length;k++)bs[k].onclick=function(){responde(+this.getAttribute("data-k"));};
    teclas=function(e){if(e.key>="1"&&e.key<="4")responde(+e.key-1);};
    document.addEventListener("keydown",teclas);
  }
  function responde(k){
    if(!tick)return;
    clearInterval(tick);tick=null; document.removeEventListener("keydown",teclas);teclas=null;
    var ms=Math.min(TMAX,Date.now()-t0), q=d.p[i], bs=panel.querySelectorAll(".rp-opt"),j;
    for(j=0;j<bs.length;j++){bs[j].disabled=true; if(j===q.c)bs[j].classList.add("ok"); else if(j===k)bs[j].classList.add("mal");}
    if(k===q.c)pts+=100+Math.floor(Math.max(0,TMAX-ms)/TMAX*60);
    $("rp-pts").textContent=pts+" pts"+(k===q.c?" · ¡correcto!":k<0?" · sin tiempo":" · era: "+q.o[q.c]);
    r.push({o:k,ms:ms}); i++;
    espera(900,pregunta);
  }
  pregunta();
};

/* Memoria: repite la secuencia de casillas, cada vez una más */
JUEGO.memoria=function(d,cfg,done){
  var n=3, t0=Date.now(), pos=0, fase="mira", cels;
  function tablero(){
    pinta(cab("memoria","Secuencia de "+n)+
      '<p class="rp-desc" id="rp-est">Mira…</p>'+
      '<div class="rp-grid9">'+[0,1,2,3,4,5,6,7,8].map(function(k){return '<button type="button" class="rp-tile" data-k="'+k+'"></button>';}).join("")+'</div>');
    cels=panel.querySelectorAll(".rp-tile");
    for(var k=0;k<cels.length;k++)cels[k].onclick=function(){toca(+this.getAttribute("data-k"));};
  }
  function muestra(){
    fase="mira"; pos=0; $("rp-est").textContent="Mira…";
    var j=0;
    function paso(){
      if(j>=n){fase="repite";$("rp-est").textContent="Tu turno: repite la secuencia.";return;}
      var c=cels[d.s[j]]; c.classList.add("on");
      espera(500,function(){c.classList.remove("on");j++;espera(200,paso);});
    }
    espera(600,paso);
  }
  function toca(k){
    if(fase!=="repite")return;
    var c=cels[k]; c.classList.add(k===d.s[pos]?"on":"mal");
    espera(220,function(){c.classList.remove("on");c.classList.remove("mal");});
    if(k!==d.s[pos]){fase="fin";$("rp-est").textContent="Casi. Llegaste a "+(n-1)+".";espera(900,function(){done({n:n-1,ms:Date.now()-t0});});return;}
    pos++;
    if(pos>=n){
      fase="mira"; $("rp-est").textContent="¡Bien!";
      if(n>=14){espera(600,function(){done({n:14,ms:Date.now()-t0});});return;}
      n++; espera(700,function(){$("rp-sub").textContent="Secuencia de "+n;muestra();});
    }
  }
  tablero(); muestra();
};

/* Cálculo: 45 segundos de cuentas; cada fallo resta tres segundos */
JUEGO.calculo=function(d,cfg,done){
  var i=0, r=[], txt="", fin=Date.now()+45000, aciertos=0, fallos=0;
  function pantalla(){
    pinta(cab("calculo",aciertos+" aciertos")+
      '<div class="rp-bar"><i id="rp-fill"></i></div>'+
      '<p class="rp-q rp-num" id="rp-op">'+esc(d.p[i].t)+' = <span id="rp-in">&nbsp;</span></p>'+
      '<div class="rp-pad">'+[1,2,3,4,5,6,7,8,9].map(function(x){return '<button type="button" class="rp-key" data-x="'+x+'">'+x+'</button>';}).join("")+
      '<button type="button" class="rp-key" data-x="del">⌫</button><button type="button" class="rp-key" data-x="0">0</button><button type="button" class="rp-key ok" data-x="ok">✓</button></div>');
    var ks=panel.querySelectorAll(".rp-key"),k;
    for(k=0;k<ks.length;k++)ks[k].onclick=function(){tecla(this.getAttribute("data-x"));};
    var fill=$("rp-fill");
    tick=setInterval(function(){var p=Math.max(0,(fin-Date.now())/45000);fill.style.transform="scaleX("+p+")";if(p<=0)acaba();},100);
    teclas=function(e){
      if(e.key>="0"&&e.key<="9")tecla(e.key); else if(e.key==="Backspace")tecla("del"); else if(e.key==="Enter")tecla("ok"); else return;
      e.preventDefault();
    };
    document.addEventListener("keydown",teclas);
  }
  function tecla(x){
    if(!tick)return;
    if(x==="del")txt=txt.slice(0,-1);
    else if(x==="ok"){
      if(!txt)return;
      r[i]=+txt;
      var bien=(+txt===d.p[i].r); if(bien)aciertos++; else {fallos++;fin-=3000;}
      var op=$("rp-op"); op.classList.add(bien?"ok":"mal");
      $("rp-sub").textContent=aciertos+" aciertos"+(fallos?" · "+fallos+" fallos":"");
      i++; txt="";
      if(i>=d.p.length){acaba();return;}
      espera(250,function(){op.classList.remove("ok");op.classList.remove("mal");op.innerHTML=esc(d.p[i].t)+' = <span id="rp-in">&nbsp;</span>';});
      return;
    }
    else if(txt.length<4)txt+=x;
    $("rp-in").innerHTML=txt||"&nbsp;";
  }
  function acaba(){if(!tick)return;clearInterval(tick);tick=null;done({r:r});}
  pantalla();
};

/* Reflejos: toca cuando se ponga verde, cinco veces */
JUEGO.reflejos=function(d,cfg,done){
  var i=0, t=[], t0=0, verde=false, esperando=null;
  function ronda(){
    verde=false;
    pinta(cab("reflejos",(i+1)+" de 5")+
      '<button type="button" class="rp-zona" id="rp-zona"><b>Espera…</b><small>cuando se ponga verde, toca</small></button>'+
      '<p class="fine" id="rp-lista">'+t.map(function(x){return x<120?"pronto":x+" ms";}).join(" · ")+'</p>');
    var z=$("rp-zona");
    z.onclick=toca;
    esperando=espera(d.d[i],function(){verde=true;t0=Date.now();z.classList.add("verde");z.innerHTML="<b>¡Toca!</b>";});
    teclas=function(e){if(e.key===" "){toca();e.preventDefault();}};
    document.addEventListener("keydown",teclas);
  }
  function toca(){
    var z=$("rp-zona"); if(!z||z.classList.contains("hecho"))return;
    z.classList.add("hecho"); document.removeEventListener("keydown",teclas);teclas=null;
    var v;
    if(verde){v=Date.now()-t0; z.innerHTML="<b>"+v+" ms</b>";}
    else {clearTimeout(esperando); v=0; z.classList.add("mal"); z.innerHTML="<b>Demasiado pronto</b><small>cuenta como 1000 ms</small>";}
    t.push(v); i++;
    espera(900,function(){ if(i>=5)done({t:t}); else ronda(); });
  }
  ronda();
};

/* Del 1 al 25: toca los números en orden */
JUEGO.numeros=function(d,cfg,done){
  var sig=1, f=0, t0=Date.now();
  pinta(cab("numeros","Siguiente: 1")+
    '<p class="fine" id="rp-est">0,0 s</p>'+
    '<div class="rp-grid25">'+d.n.map(function(v){return '<button type="button" class="rp-tile num" data-v="'+v+'">'+v+'</button>';}).join("")+'</div>');
  tick=setInterval(function(){$("rp-est").textContent=seg(Date.now()-t0)+(f?" · "+f+" fallos":"");},100);
  var bs=panel.querySelectorAll(".rp-tile"),k;
  for(k=0;k<bs.length;k++)bs[k].onclick=function(){
    var v=+this.getAttribute("data-v"), b=this;
    if(v===sig){b.classList.add("hecho");b.disabled=true;sig++;
      if(sig>25){clearInterval(tick);tick=null;done({ms:Date.now()-t0,f:f});return;}
      $("rp-sub").textContent="Siguiente: "+sig;
    }else{f++;b.classList.add("mal");espera(250,function(){b.classList.remove("mal");});}
  };
};

/* ---------- API ---------- */
window.AxRapidosUI={
  practica:practica,
  /* cfg: {juego, sub, titulo, pedirDatos():Promise<datos>, alTerminar(envio,res), error(e)} */
  jugar:function(cfg){panel.hidden=false;intro(cfg.juego,cfg);},
  cerrar:function(){limpia();panel.innerHTML="";panel.hidden=true;}
};
})();
