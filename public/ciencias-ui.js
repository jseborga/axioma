/* ===========================================================
   THE FINAL TEST · Ciencias naturales, física y química · pantalla
   -----------------------------------------------------------
   Cinco niveles (Explorar, Descubrir, Biología y Tierra, Física y
   Química) con sus unidades como caminos de cuatro lecciones:
   Descubre (ideas clave), Practica, Laboratorio (experimento para
   casa y laboratorio interactivo) y Reto. Cada quien elige la
   unidad que quiera (Montessori); dentro de ella, las lecciones van
   en orden. Lumi responde, lo fallado vuelve al final y queda para
   «Repasar lo que me costó». Usa los mismos perfiles, cabecera y
   panel de adultos que Matemática; el avance va en perfil.cie.
     AxCienciasUI.mapa() · AxCienciasUI.para()
   =========================================================== */
(function(){
"use strict";
var K=window.AxCiencias, DW=window.AxCienciasDibujos;
if(!K||!DW||!window.AxMateUI)return;
var C=AxMateUI.comun, esc=C.esc, on=C.on;
var $=function(id){return document.getElementById(id);};
var META=20, S=null;
var ANIMOS=["¡Excelente!","¡Lo descubriste!","¡Muy bien pensado!","¡Genial!","¡Como en un laboratorio!","¡Así se hace ciencia!"];
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function cie(pf){if(!pf.cie||typeof pf.cie!=="object")pf.cie=K.nuevo(); var g=pf.cie; g.lec=g.lec||{}; g.fallos=g.fallos||{}; g.dias=g.dias||{}; g.refl=g.refl||[]; g.xp=g.xp||0; return g;}
function hoyXP(g){return (g.dias&&g.dias[C.hoy()])||0;}
function racha(g){var n=0, d=new Date(); for(var i=0;i<400;i++){var k=d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
  if(g.dias&&g.dias[k])n++; else if(i>0)break; d.setDate(d.getDate()-1);} return n;}
function decir(t){if(t)C.habla(t);}
function btnVoz(t){return '<button type="button" class="ig-son" data-voz="'+esc(t)+'" aria-label="Escuchar">🔊</button>';}
function activaVoz(raiz){on(raiz,"[data-voz]",function(b){decir(b.getAttribute("data-voz"));});}
function tile(ico,cls){return '<span class="ig-pic cie-pic '+(cls||"")+'" aria-hidden="true">'+ico+'</span>';}

/* ===================== el mapa ===================== */
var ZIG=[0,52,0,-52];
function mapa(nivel){
  var pf=C.actual(); if(!pf)return C.portada();
  var g=cie(pf);
  if(nivel){g.nivel=nivel; C.cambia(pf);}
  if(!g.nivel)g.nivel=K.nivelPara(pf.etapa||0);
  var n=g.nivel, N=K.NIVELES[n-1], us=K.deNivel(n), listas=us.filter(function(u){return K.unidadHecha(g,u.id);}).length, sug=K.sugerida(g,n), dif=K.dificiles(g,20), xh=hoyXP(g), r=racha(g);
  C.estado({cie:true});
  var saludo=!Object.keys(g.lec).length?"¡Hola! Soy Lumi. Vamos a descubrir cómo funciona el mundo: elige una unidad.":dif.length>=4?"Hay "+dif.length+" cosas que costaron. ¡Repasarlas te hará más fuerte! 💪":xh>=META?"¡Cumpliste tu meta de hoy! 🎯":"¿Qué quieres descubrir hoy?";
  var html=C.cabeza(pf,"ciencias",'⚡ '+g.xp+' XP · ⭐ '+K.estrellasTot(g)+(r?' · 🔥 '+r+(r===1?' día':' días'):''),'')+
    '<div class="mt-etapas cie-niveles" role="tablist">'+K.NIVELES.map(function(x){var u2=K.deNivel(x.n), ok=u2.every(function(u){return K.unidadHecha(g,u.id);});
      return '<button type="button" role="tab" data-nivel="'+x.n+'" aria-selected="'+(x.n===n)+'" class="'+(x.n===n?"on":"")+(ok?" completa":"")+'"><span>'+x.ico+'</span>'+esc(x.nom)+(ok?' ✔':'')+'</button>';}).join("")+'</div>'+
    '<div class="ig-meta"><span>🎯 Meta de hoy</span><i style="--p:'+Math.min(100,Math.round(100*xh/META))+'%"></i><b>'+Math.min(xh,META)+'/'+META+' XP</b></div>'+
    (window.AxAprender?AxAprender.globo(dif.length>=4?"anima":"feliz",saludo):'')+
    '<div class="ig-nivel cie-n'+n+'"><span>'+N.ico+'</span><div><b>'+esc(N.nom)+'</b><small>'+esc(N.sub)+' · '+listas+' de '+us.length+' unidades</small></div></div>'+
    (dif.length?'<button type="button" class="ig-repaso'+(dif.length>=4?' fuerte':'')+'" id="cie-repaso"><span>💪</span><b>Repasar lo que me costó</b><small>'+dif.length+(dif.length===1?' ejercicio':' ejercicios')+' para practicar otra vez</small></button>':'')+
    '<div class="ig-camino">'+us.map(function(u){var hecha=K.unidadHecha(g,u.id), k=0;
      return '<section class="ig-unidad" style="--c:'+u.col+';--c2:'+u.col2+'"><div class="ig-banda"><span class="ig-u-ico">'+u.ico+'</span><div><small>'+(hecha?'✔ completa':K.hecha(g,u.lecciones[0].id)?'en camino':'nueva')+'</small><b>'+esc(u.nom)+'</b><em>'+u.ideas.length+' ideas · 🧪 '+esc(u.casa.nom)+'</em></div>'+
        '<button type="button" class="ig-vocab" data-ficha="'+u.id+'" title="Ideas y experimento">📖</button></div>'+
        '<div class="ig-nodos cie-nodos'+(u.lecciones.some(function(l){return l.id===sug;})?' con-actual':'')+'">'+u.lecciones.map(function(l){var h=K.hecha(g,l.id), ab=K.abierta(g,l.id), cur=l.id===sug, x=ZIG[(k++)%ZIG.length], e=h?g.lec[l.id].e:0;
          return '<div class="ig-nodo-fila" style="--x:'+x+'px">'+(cur&&window.AxAprender?'<span class="ig-lumi-camino'+(x>0?' izq':'')+'">'+AxAprender.mascota("feliz",60)+'</span>':'')+
            '<button type="button" class="ig-nodo '+(h?'hecho':cur?'actual':ab?'abierto':'cerrado')+'" data-lec="'+l.id+'" aria-label="'+esc(l.nom)+'">'+(cur?'<span class="ig-empieza">¡Empieza!</span>':'')+'<span class="ig-n-ico">'+(h?'✔':ab?l.ico:'🔒')+'</span></button>'+
            '<small class="ig-n-nom">'+esc(l.nom)+(h?'<i>'+'★★★'.slice(0,e)+'<s>'+'★★★'.slice(e)+'</s></i>':'')+'</small></div>';}).join("")+'</div></section>';}).join("")+'</div>'+
    '<p class="fine ig-pie-nota">Elige la unidad que quieras: dentro de cada una, las lecciones se abren en orden. 📖 muestra sus ideas y el experimento para casa.</p>';
  var el=C.pinta(html,"ing cie"); if(!el)return;
  C.activaCabeza(el);
  on(el,"[data-nivel]",function(b){mapa(+b.getAttribute("data-nivel"));});
  on(el,"[data-lec]",function(b){var id=b.getAttribute("data-lec"); if(!K.abierta(g,id)){aviso(el,"🔒 Termina la lección anterior de esta unidad."); return;} inicia(id);});
  on(el,"[data-ficha]",function(b){ficha(b.getAttribute("data-ficha"));});
  if($("cie-repaso"))$("cie-repaso").onclick=function(){inicia("repaso");};
  var sel=el.querySelector(".cie-niveles .on"); if(sel&&sel.scrollIntoView)try{sel.scrollIntoView({block:"nearest",inline:"center"});}catch(x){}
}
function aviso(raiz,t){var a=raiz.querySelector(".ig-aviso"); if(!a){a=document.createElement("div"); a.className="ig-aviso"; raiz.appendChild(a);} a.textContent=t; a.classList.remove("on"); void a.offsetWidth; a.classList.add("on");}

/* la ficha de una unidad: sus ideas y el experimento para casa */
function casaHTML(c){return '<div class="cie-casa"><span class="cie-etq">🧪 Experimento para casa</span><h3>'+esc(c.nom)+'</h3>'+
  '<h4>Necesitas</h4><ul>'+c.mat.map(function(m){return '<li>'+esc(m)+'</li>';}).join("")+'</ul>'+
  '<h4>Pasos</h4><ol>'+c.pasos.map(function(p){return '<li>'+esc(p)+'</li>';}).join("")+'</ol>'+
  '<p class="cie-preg">🤔 '+esc(c.pregunta)+'</p>'+(c.seg?'<p class="cie-seg">⚠️ '+esc(c.seg)+'</p>':'')+'<p class="fine">Hazlo con un adulto y anota lo que observas: así trabajan los científicos.</p></div>';}
function ficha(uid){
  var u=K.POR_U[uid]; C.estado({cie:true});
  var el=C.pinta('<div class="mt-top"><button type="button" class="mt-atras" id="cie-volver">← Volver</button><b>'+u.ico+' '+esc(u.nom)+'</b></div>'+
    '<div class="cie-ideas">'+u.ideas.map(function(i){return '<div class="cie-idea-l">'+tile(i[0],"sm")+'<div><b>'+esc(i[1])+'</b><p>'+esc(i[2])+'</p></div>'+btnVoz(i[1]+". "+i[2])+'</div>';}).join("")+'</div>'+casaHTML(u.casa),"ing cie");
  if(!el)return; activaVoz(el); $("cie-volver").onclick=function(){mapa();};
}

/* ===================== una lección ===================== */
function inicia(id){
  var pf=C.actual(), g=cie(pf), seed=C.semilla(), ctx={prog:g};
  var its=id==="repaso"?K.repaso(seed,ctx):K.genera(id,seed,ctx);
  if(!its.length)return mapa();
  its.forEach(function(it){it._n=1;});
  S={id:id,cola:its,i:0,tot:its.filter(function(x){return x.t!=="idea"&&x.t!=="casa";}).length,bien:0,combo:0,maxCombo:0,t0:Date.now(),uds:{}};
  muestra();
}
function para(){S=null; C.callaVoz();}
function barra(){var total=S.cola.length; return '<div class="ig-prog"><i style="width:'+Math.round(100*S.i/Math.max(1,total))+'%"></i></div>';}
function muestra(){
  if(!S)return mapa();
  if(S.i>=S.cola.length)return resultados();
  var it=S.cola[S.i], cuerpo="", u=K.POR_U[it.u];
  S.sel=null; S.listo=false; S.uds[it.u]=1;
  C.estado({cie:true});
  var preg=function(t){return '<div class="cie-q"><h3 class="ig-q">'+esc(t)+'</h3>'+btnVoz(t)+'</div>';};
  switch(it.t){
    case "idea": cuerpo='<div class="cie-idea"><span class="cie-etq">💡 Idea clave · '+esc(u.nom)+'</span>'+tile(it.ico,"xl")+'<h3>'+esc(it.tit)+'</h3><p>'+esc(it.txt)+'</p>'+btnVoz(it.tit+". "+it.txt)+'</div>'; break;
    case "casa": cuerpo=casaHTML(u.casa); break;
    case "elige": cuerpo=preg(it.q)+ops(it.ops); break;
    case "vf": cuerpo='<h3 class="ig-q">¿Verdadero o falso?</h3><div class="cie-afirma">'+esc(it.q)+' '+btnVoz(it.q)+'</div><div class="ig-ops cie-vf">'+it.ops.map(function(o,k){return '<button type="button" class="ig-op" data-op="'+k+'">'+esc(o)+'</button>';}).join("")+'</div>'; break;
    case "diagrama": cuerpo=preg(it.q)+'<div class="cie-dib">'+DW.diagrama(it.dg,it.parte)+'</div>'+ops(it.ops); break;
    case "clasifica": cuerpo=preg(it.q)+'<p class="fine">Toca una tarjeta y luego la caja donde va.</p><div class="cie-cajas n'+it.cajas.length+'">'+it.cajas.map(function(c,k){return '<div class="cie-caja" data-caja="'+k+'"><b>'+esc(c)+'</b><div class="cie-caja-in"></div></div>';}).join("")+'</div>'+
      '<div class="cie-pool" id="cie-pool">'+it.cosas.map(function(c,k){return '<button type="button" class="cie-cosa" data-cosa="'+k+'">'+esc(c)+'</button>';}).join("")+'</div>'; break;
    case "ordena": cuerpo=preg(it.q)+'<ol class="cie-orden" id="cie-orden"></ol><div class="cie-pool" id="cie-pool">'+it.mezcla.map(function(k){return '<button type="button" class="cie-cosa" data-paso="'+k+'">'+esc(it.pasos[k])+'</button>';}).join("")+'</div>'; break;
    case "parejas": cuerpo='<h3 class="ig-q">'+esc(it.q)+'</h3><div class="ig-parejas cie-parejas"><div>'+it.izq.map(function(x,k){return '<button type="button" class="ig-par" data-izq="'+k+'">'+esc(x)+'</button>';}).join("")+'</div><div>'+
      it.der.map(function(x,k){return '<button type="button" class="ig-par" data-der="'+k+'">'+esc(x)+'</button>';}).join("")+'</div></div>'; break;
    case "num": cuerpo=preg(it.q)+'<div class="mt-pantalla cie-num"><span id="cie-num"></span><i class="mt-cursor"></i>'+(it.uni?'<small>'+esc(it.uni)+'</small>':'')+'</div>'+
      '<div class="mt-teclado">'+["1","2","3","4","5","6","7","8","9",",","0","⌫"].map(function(t){return '<button type="button" data-k="'+t+'">'+t+'</button>';}).join("")+'</div>'; break;
    case "sim": cuerpo=preg(it.q)+'<div class="cie-sim" id="cie-sim"></div>'; break;
  }
  var info=it.t==="idea"||it.t==="casa";
  var el=C.pinta('<div class="mt-top ig-top"><button type="button" class="ig-x" id="ig-salir" aria-label="Salir">✕</button>'+barra()+(S.combo>=3?'<span class="ig-combo">🔥 '+S.combo+'</span>':'')+'</div>'+
    '<div class="ig-cuerpo cie-cuerpo t-'+it.t+'">'+cuerpo+'</div>'+
    (it.t!=="parejas"?'<div class="ig-pie" id="ig-pie"><div class="ig-pie-in"><button type="button" class="ig-check" id="ig-comprobar"'+(info?'':' disabled')+'>'+(it.t==="casa"?'¡Lo haré en casa!':info?'Continuar':'Comprobar')+'</button></div></div>':''),"ing cie jugando-ing");
  if(!el)return;
  activaVoz(el);
  $("ig-salir").onclick=function(){if(confirm("¿Salir de la lección? Lo que llevas no cuenta como lección terminada."))return (para(),mapa());};
  if(info){$("ig-comprobar").onclick=function(){S.i++; muestra();}; C.teclado(function(k){if(k==="Enter"){$("ig-comprobar").click(); return true;}}); if(C.voz())decir(it.t==="idea"?it.tit+". "+it.txt:u.casa.nom); return;}
  if(C.voz())decir(it.q);
  activa(el,it);
}
function ops(lista){return '<div class="ig-ops texto largas">'+lista.map(function(o,k){return '<button type="button" class="ig-op" data-op="'+k+'"><i class="ig-num">'+(k+1)+'</i>'+esc(o)+'</button>';}).join("")+'</div>';}

/* elegir, clasificar, ordenar, calcular o experimentar; después «Comprobar» */
function activa(el,it){
  var bt=$("ig-comprobar");
  function listo(v){S.sel=v; if(bt)bt.disabled=v==null;}
  if(it.ops){
    on(el,"[data-op]",function(b){if(S.listo)return; Array.prototype.forEach.call(el.querySelectorAll("[data-op]"),function(x){x.classList.toggle("on",x===b);}); C.SON.toca(); listo(+b.getAttribute("data-op"));});
    C.teclado(function(k){var n=+k; if(n>=1&&n<=it.ops.length&&!S.listo){el.querySelector('[data-op="'+(n-1)+'"]').click(); return true;} if(k==="Enter"&&bt&&!bt.disabled){bt.click(); return true;}});
  }
  if(it.t==="clasifica"){
    var donde=it.cosas.map(function(){return null;}), elegida=null;
    function pinta(){
      /* las fichas se mueven (no se vuelven a crear): cada una a su caja o al montón */
      Array.prototype.forEach.call(el.querySelectorAll("[data-cosa]"),function(b){var k=+b.getAttribute("data-cosa"); b.classList.toggle("on",k===elegida);
        if(donde[k]!=null)el.querySelector('[data-caja="'+donde[k]+'"] .cie-caja-in').appendChild(b); else $("cie-pool").appendChild(b);});
      listo(donde.every(function(x){return x!=null;})?donde.slice():null);
    }
    on(el,"[data-cosa]",function(b){if(S.listo)return; var k=+b.getAttribute("data-cosa"); if(donde[k]!=null){donde[k]=null; elegida=null;} else elegida=elegida===k?null:k; C.SON.toca(); pinta();});
    Array.prototype.forEach.call(el.querySelectorAll("[data-caja]"),function(c){c.addEventListener("click",function(ev){if(S.listo||elegida==null||ev.target.closest("[data-cosa]"))return; donde[elegida]=+c.getAttribute("data-caja"); elegida=null; C.SON.toca(); pinta();});});
    S.marca=function(){Array.prototype.forEach.call(el.querySelectorAll("[data-cosa]"),function(b){var k=+b.getAttribute("data-cosa"); b.classList.add(donde[k]===it.sol[k]?"bien":"mal");});};
    C.teclado(function(k){if(k==="Enter"&&bt&&!bt.disabled){bt.click(); return true;}});
  }
  if(it.t==="ordena"){
    var orden=[];
    function pintaO(){var ol=$("cie-orden"), pool=$("cie-pool");
      /* primero todas las fichas vuelven al montón; luego las elegidas pasan a la lista en su orden */
      Array.prototype.forEach.call(el.querySelectorAll("[data-paso]"),function(b){pool.appendChild(b);});
      ol.innerHTML=orden.length?"":'<li class="vacio">Toca los pasos en orden</li>';
      orden.forEach(function(k){var li=document.createElement("li"); li.appendChild(el.querySelector('[data-paso="'+k+'"]')); ol.appendChild(li);});
      Array.prototype.forEach.call(it.mezcla,function(k){var b=pool.querySelector('[data-paso="'+k+'"]'); if(b)pool.appendChild(b);});
      listo(orden.length===it.pasos.length?orden.slice():null);}
    on(el,"[data-paso]",function(b){if(S.listo)return; var k=+b.getAttribute("data-paso"), i=orden.indexOf(k); if(i>=0)orden.splice(i,1); else orden.push(k); C.SON.toca(); pintaO();});
    pintaO();
    S.marca=function(){Array.prototype.forEach.call(el.querySelectorAll("#cie-orden [data-paso]"),function(b,i){b.classList.add(+b.getAttribute("data-paso")===i?"bien":"mal");});};
    C.teclado(function(k){if(k==="Enter"&&bt&&!bt.disabled){bt.click(); return true;} if(k==="Backspace"&&orden.length){orden.pop(); pintaO(); return true;}});
  }
  if(it.t==="parejas"){
    var izq=null, der=null, hechas=0, errores=0;
    function prueba(){
      if(izq==null||der==null)return;
      var bi=el.querySelector('[data-izq="'+izq+'"]'), bd=el.querySelector('[data-der="'+der+'"]');
      if(it.sol[it.izq[izq]]===it.der[der]){bi.classList.add("hecha"); bd.classList.add("hecha"); bi.disabled=bd.disabled=true; hechas++; C.SON.bien();}
      else{errores++; bi.classList.add("mal"); bd.classList.add("mal"); C.SON.otra(); setTimeout(function(){bi.classList.remove("mal"); bd.classList.remove("mal");},500);}
      Array.prototype.forEach.call(el.querySelectorAll(".ig-par"),function(x){x.classList.remove("on");}); izq=der=null;
      if(hechas===it.izq.length){S.listo=true; setTimeout(function(){fin(it,errores<=1,null);},350);}
    }
    on(el,"[data-izq]",function(b){if(b.disabled)return; izq=+b.getAttribute("data-izq"); Array.prototype.forEach.call(el.querySelectorAll("[data-izq]"),function(x){x.classList.toggle("on",x===b);}); C.SON.toca(); prueba();});
    on(el,"[data-der]",function(b){if(b.disabled)return; der=+b.getAttribute("data-der"); Array.prototype.forEach.call(el.querySelectorAll("[data-der]"),function(x){x.classList.toggle("on",x===b);}); C.SON.toca(); prueba();});
  }
  if(it.t==="num"){
    var val="";
    function tecla(k){if(S.listo)return; if(k==="⌫")val=val.slice(0,-1); else if(k===","){if(val.indexOf(",")<0)val+=(val?"":"0")+",";} else if(val.replace(/\D/g,"").length<8)val+=k;
      $("cie-num").textContent=val; C.SON.toca(); listo(val&&val!==","?val:null);}
    on(el,"[data-k]",function(b){tecla(b.getAttribute("data-k"));});
    C.teclado(function(k){if(/^[0-9]$/.test(k))tecla(k); else if(k===","||k===".")tecla(","); else if(k==="Backspace")tecla("⌫"); else if(k==="Enter"){if(bt&&!bt.disabled)bt.click();} else return; return true;});
  }
  if(it.t==="sim")sim(el,it,listo);
  if(bt)bt.onclick=function(){if(S.listo){siguiente(); return;} if(S.sel==null)return; fin(it,K.corrige(it,S.sel),S.sel);};
}

/* ---------- los laboratorios ---------- */
function sim(el,it,listo){
  var z=$("cie-sim");
  if(it.sim==="agua"){
    z.innerHTML='<div class="cie-sim-vista" id="cie-v"></div><label class="cie-rango">🌡️ Temperatura: <b id="cie-t">20 °C</b><input type="range" id="cie-r" min="-20" max="120" step="1" value="20"></label><p class="cie-estado" id="cie-e"></p>';
    function upd(){var t=+$("cie-r").value, a=DW.agua(t); $("cie-v").innerHTML=a.svg; $("cie-t").textContent=t+" °C"; $("cie-e").textContent="Estado del agua: "+a.estado+({sólido:" 🧊",líquido:" 💧",gas:" ♨️"})[a.estado]; listo(t);}
    $("cie-r").oninput=upd; upd();
  }
  if(it.sim==="circuito"){
    var mat=null, cerrado=false, M=K.SIMS.circuito.mat;
    z.innerHTML='<div class="cie-sim-vista" id="cie-v"></div><div class="cie-mats">'+M.map(function(m,k){return '<button type="button" class="cie-cosa" data-mat="'+k+'">'+esc(m[0])+'</button>';}).join("")+'</div>'+
      '<button type="button" class="cie-interr" id="cie-sw">🔌 Cerrar el interruptor</button><p class="cie-estado" id="cie-e"></p>';
    function upd(){var m=mat!=null?M[mat]:null, luz=!!(m&&cerrado&&m[1]);
      $("cie-v").innerHTML=DW.circuito(m?m[0].split(" ")[0]:null,cerrado,m&&m[1]);
      $("cie-sw").textContent=cerrado?"🔌 Abrir el interruptor":"🔌 Cerrar el interruptor";
      $("cie-e").textContent=!m?"Elige un material para el hueco.":!cerrado?"El interruptor está abierto: la corriente no pasa.":luz?"💡 ¡El foco se encendió! "+m[0].replace(/^\S+\s/,"")+": conduce la electricidad.":"El foco no enciende. "+m[0].replace(/^\S+\s/,"")+": es aislante.";
      if(luz)C.SON.bien(); listo(m&&cerrado?luz:null);}
    on(z,"[data-mat]",function(b){if(S.listo)return; mat=+b.getAttribute("data-mat"); Array.prototype.forEach.call(z.querySelectorAll("[data-mat]"),function(x){x.classList.toggle("on",x===b);}); upd();});
    $("cie-sw").onclick=function(){if(S.listo)return; cerrado=!cerrado; C.SON.toca(); upd();};
    upd();
  }
  if(it.sim==="velocidad"){
    z.innerHTML='<div class="cie-sim-vista" id="cie-v"></div><label class="cie-rango">📏 Distancia: <b id="cie-d">50 m</b><input type="range" id="cie-rd" min="10" max="200" step="10" value="50"></label>'+
      '<label class="cie-rango">⏱️ Tiempo: <b id="cie-ti">10 s</b><input type="range" id="cie-rt" min="1" max="20" step="1" value="10"></label><p class="cie-estado" id="cie-e"></p>';
    function upd(){var d=+$("cie-rd").value, t=+$("cie-rt").value, v=d/t; $("cie-d").textContent=d+" m"; $("cie-ti").textContent=t+" s";
      $("cie-v").innerHTML=DW.pista(v); $("cie-e").innerHTML="v = d ÷ t = "+d+" ÷ "+t+" = <b>"+K.nt(Math.round(v*100)/100)+" m/s</b>"+(Math.abs(v-it.obj)<1e-9?" 🎯":""); listo(v);}
    $("cie-rd").oninput=upd; $("cie-rt").oninput=upd; upd();
  }
  if(it.sim==="ph"){
    var L=K.SIMS.ph.sus;
    z.innerHTML='<div class="cie-sim-vista cie-ph"><div id="cie-v"></div><div class="cie-escala"><i id="cie-m"></i></div><div class="cie-escala-n"><span>0 ácido</span><span>7 neutro</span><span>14 básico</span></div></div>'+
      '<div class="cie-mats">'+L.map(function(s,k){return '<button type="button" class="cie-cosa" data-sus="'+k+'">'+esc(s[0])+'</button>';}).join("")+'</div><p class="cie-estado" id="cie-e">Elige una sustancia para ponerla en el indicador.</p>';
    $("cie-v").innerHTML=DW.vaso(null); $("cie-m").style.display="none";
    on(z,"[data-sus]",function(b){if(S.listo)return; var s=L[+b.getAttribute("data-sus")]; Array.prototype.forEach.call(z.querySelectorAll("[data-sus]"),function(x){x.classList.toggle("on",x===b);});
      $("cie-v").innerHTML=DW.vaso(s[1]); var m=$("cie-m"); m.style.display="block"; m.style.left=(100*s[1]/14)+"%";
      $("cie-e").textContent=s[0].replace(/^\S+\s/,"")+": pH ≈ "+K.nt(s[1])+" → "+(s[1]<7?"ácido":s[1]>7?"base":"neutro"); C.SON.toca(); listo(s[1]);});
  }
}

/* ---------- comprobar: acierto o la respuesta (y el ejercicio vuelve al final) ---------- */
function fin(it,ok,resp){
  if(!S)return;
  S.listo=true;
  var pf=C.actual(), g=cie(pf), primera=it._n===1;
  K.registra(g,it,ok);
  if(primera){if(ok)S.bien++;}
  if(ok){S.combo++; S.maxCombo=Math.max(S.maxCombo,S.combo); C.SON.bien();}
  else{S.combo=0; C.SON.otra(); if(it._n<2){var copia=JSON.parse(JSON.stringify(it)); copia._n=2; S.cola.push(copia);}}
  C.cambia(pf);
  var cuerpo=document.querySelector(".ig-cuerpo");
  if(it.ops&&cuerpo){Array.prototype.forEach.call(cuerpo.querySelectorAll("[data-op]"),function(x){x.classList.remove("on");}); var bo=cuerpo.querySelector('[data-op="'+it.ok+'"]'); if(bo)bo.classList.add("bien"); if(!ok&&resp!=null){var bm=cuerpo.querySelector('[data-op="'+resp+'"]'); if(bm)bm.classList.add("mal");}}
  if(S.marca){S.marca(); S.marca=null;}
  var animo=pick(ANIMOS), txt;
  if(ok)txt='<b>'+(S.combo>=3?'🔥 ¡'+S.combo+' seguidas! ':'')+esc(animo)+'</b><p>💡 '+esc(it.ex)+'</p>';
  else txt='<b>¡Casi! La respuesta es:</b><p><b>'+esc(K.respuestaTxt(it))+'</b></p><p>💡 '+esc(it.ex)+'</p><small>'+(it._n<2?'Lo repasaremos al final 💪':'¡Ya lo vas aprendiendo! 🌱')+'</small><div id="cie-ia"></div>';
  var pie=$("ig-pie");
  if(!pie){pie=document.createElement("div"); pie.id="ig-pie"; document.querySelector(".mt.ing").appendChild(pie);}
  pie.className="ig-pie "+(ok?"bien":"mal");
  pie.innerHTML='<div class="ig-pie-in">'+(window.AxAprender?'<span class="ig-pie-lumi">'+AxAprender.mascota(ok?(S.combo>=3?"wow":"feliz"):"anima",64)+'</span>':'')+
    '<div class="ig-pie-txt">'+txt+'</div>'+(!ok&&it.t!=="sim"&&it.t!=="parejas"?'<button type="button" class="ig-ia" id="cie-ia-btn">🤖 Explícamelo</button>':'')+
    '<button type="button" class="ig-check" id="ig-comprobar">Continuar</button></div>';
  if(C.voz())decir((ok?animo+" ":"La respuesta es "+K.respuestaTxt(it)+". ")+it.ex);
  if($("cie-ia-btn"))$("cie-ia-btn").onclick=function(){explica(it,resp,$("cie-ia"),this);};
  var bt=$("ig-comprobar"); bt.onclick=siguiente; try{bt.focus({preventScroll:true});}catch(x){}
  C.teclado(function(k){if(k==="Enter"||k===" "){siguiente(); return true;}});
}
function siguiente(){if(!S)return; S.i++; muestra();}
/* la explicación con IA: el servidor arma el mismo ejercicio con la misma semilla */
function explica(it,resp,z,btn){
  btn.disabled=true; z.innerHTML='<p class="fine">🤖 Pensando una explicación…</p>';
  fetch("/api/mate/explica",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({materia:"ciencias",u:it.u,k:it.k,seed:it.seed,resp:Array.isArray(resp)?null:resp==null?null:String(resp).slice(0,40)})})
  .then(function(r){return r.json().then(function(j){if(!r.ok)throw j; return j;});})
  .then(function(r){z.innerHTML='<div class="mt-ia"><p>🤖 '+esc(r.explicacion)+'</p>'+(r.ejemplo?'<p>🧪 '+esc(r.ejemplo)+'</p>':'')+(r.pregunta?'<p>❓ '+esc(r.pregunta)+'</p>':'')+'</div>'; if(C.voz())decir(r.explicacion);})
  .catch(function(e){var m={unauthorized:"La explicación con IA está disponible cuando un adulto entra con su cuenta de Google.",google_required:"La explicación con IA está disponible cuando un adulto entra con su cuenta de Google.",
    limit:"Por hoy ya se usaron todas las explicaciones con IA. ¡Mañana hay más!",ia_not_configured:"La IA no está configurada en este servidor."};
    z.innerHTML='<p class="fine">'+esc(m[e&&e.error]||"No se pudo pedir la explicación ahora.")+'</p>'; btn.disabled=false;});
}

/* ===================== al terminar ===================== */
function resultados(){
  var pf=C.actual(), g=cie(pf), id=S.id, tot=Math.max(1,S.tot), bien=S.bien, seg=Math.round((Date.now()-S.t0)/1000), antes=hoyXP(g), L=K.POR_ID[id], u=L?K.POR_U[L.u]:null;
  var unidadAntes=u?K.unidadHecha(g,u.id):false, r=K.termina(g,id,bien,tot);
  if(S.maxCombo>=5){g.xp+=3; r.xp+=3; g.dias[C.hoy()]+=3;}
  C.cambia(pf);
  var unidadAhora=u?K.unidadHecha(g,u.id):false, meta=antes<META&&hoyXP(g)>=META, sel=null, idL=id, dif=K.dificiles(g,6);
  var est='';for(var k=1;k<=3;k++)est+='<i class="'+(k<=r.estrellas?'on':'')+'" style="--d:'+(k*0.25)+'s">★</i>';
  S=null;
  var el=C.pinta('<div class="ig-fin">'+(window.AxAprender?AxAprender.mascota(r.prec>=0.6?"celebra":"anima",130):'')+
    '<h3>'+(id==="repaso"?'¡Repaso completo!':'¡Lección completa!')+'</h3>'+(u?'<p class="fine">'+u.ico+' '+esc(u.nom)+' · '+esc(L.nom)+'</p>':'')+
    '<div class="ig-estrellas">'+est+'</div>'+
    '<div class="ig-kpis"><div class="xp"><small>XP</small><b>+'+r.xp+'</b></div><div class="pr"><small>Aciertos</small><b>'+Math.round(r.prec*100)+' %</b></div><div class="ti"><small>Tiempo</small><b>'+Math.floor(seg/60)+':'+("0"+seg%60).slice(-2)+'</b></div></div>'+
    (unidadAhora&&!unidadAntes?'<p class="ig-trofeo">🏆 ¡Completaste la unidad <b>'+esc(u.nom)+'</b>!</p>':'')+
    (meta?'<p class="ig-trofeo meta">🎯 ¡Cumpliste tu meta de hoy!</p>':'')+
    (L&&L.tipo==="lab"?'<p class="ig-trofeo cie-recuerda">🧪 No olvides hacer en casa: <b>'+esc(u.casa.nom)+'</b>. Está en 📖.</p>':'')+
    (r.prec<0.6&&dif.length?'<div class="ig-flojas">'+(window.AxAprender?AxAprender.globo("anima","Algunas preguntas costaron. ¡Repasarlas te hará más fuerte!"):'')+'<button type="button" class="ig-repaso fuerte" id="cie-rep"><span>💪</span><b>Repasar ahora</b><small>'+dif.length+' ejercicios para practicar</small></button></div>':'')+
    '<h4>¿Cómo te sentiste?</h4><div class="mt-sentir">'+C.SENTIR.map(function(x,i){return '<button type="button" data-s="'+i+'"><span>'+x[0]+'</span>'+x[1]+'</button>';}).join("")+'</div>'+
    '<div class="actions"><button type="button" class="ghost" id="ig-otra">Repetir</button><button type="button" class="primary grande" id="ig-sigue">Continuar →</button></div></div>',"ing cie fin");
  if(!el)return;
  function guarda(){g.refl.push({l:idL,t:Date.now(),ok:bien,n:tot,s:sel}); while(g.refl.length>30)g.refl.shift(); C.cambia(pf);}
  on(el,"[data-s]",function(b){var nuevo=sel==null; sel=+b.getAttribute("data-s"); Array.prototype.forEach.call(el.querySelectorAll("[data-s]"),function(x){x.classList.toggle("on",x===b);}); C.SON.toca();
    if(nuevo)guarda(); else{g.refl[g.refl.length-1].s=sel; C.cambia(pf);}});
  $("ig-sigue").onclick=function(){mapa();};
  $("ig-otra").onclick=function(){inicia(idL);};
  if($("cie-rep"))$("cie-rep").onclick=function(){inicia("repaso");};
  C.SON.sube();
  if(C.voz())decir(r.prec>=0.9?"¡Excelente! Lección completa.":r.prec>=0.6?"¡Muy bien! Lección completa.":"¡Buen intento! Sigamos practicando.");
}

window.AxCienciasUI={mapa:mapa,para:para,inicia:inicia,_estado:function(){return S;}};
})();
