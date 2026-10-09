/* ===========================================================
   THE FINAL TEST · Inglés para niñas y niños · pantalla
   -----------------------------------------------------------
   Un camino de lecciones por unidad (como un juego de mesa): cada
   lección son ejercicios cortos y variados con dibujos, sonido y
   colores. Se elige, se comprueba y Lumi responde: si se acierta,
   celebra; si no, muestra la respuesta y ese ejercicio vuelve al
   final. Al terminar: estrellas, XP, la meta del día y cómo me
   sentí. «Repasar mis palabras» practica las que más cuestan.
   Usa los mismos perfiles, cabecera y panel de adultos que
   Matemática (AxMateUI.comun); el avance va en perfil.ing.
     AxInglesUI.mapa() · AxInglesUI.para()
   =========================================================== */
(function(){
"use strict";
var I=window.AxIngles;
if(!I||!window.AxMateUI)return;
var C=AxMateUI.comun, esc=C.esc, on=C.on;
var $=function(id){return document.getElementById(id);};
var META=20;                      /* XP de la meta del día */
var S=null;                       /* la lección en curso */
var micHasta=0;                   /* «ahora no puedo hablar»: sin micrófono por un rato */
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function ing(pf){if(!pf.ing||typeof pf.ing!=="object")pf.ing=I.nuevo(); var g=pf.ing; g.lec=g.lec||{}; g.pal=g.pal||{}; g.dias=g.dias||{}; g.refl=g.refl||[]; g.xp=g.xp||0; return g;}
function hoyXP(g){return (g.dias&&g.dias[C.hoy()])||0;}
function racha(g){var n=0, d=new Date(); for(var i=0;i<400;i++){var k=d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
  if(g.dias&&g.dias[k])n++; else if(i>0)break; d.setDate(d.getDate()-1);} return n;}

/* ---------- voz en inglés y micrófono ---------- */
var hayVoz=!!window.speechSynthesis;
function vozEn(){try{var v=speechSynthesis.getVoices().filter(function(x){return /^en/i.test(x.lang);}); return v.filter(function(x){return /en[-_]US/i.test(x.lang);})[0]||v.filter(function(x){return /en[-_]GB/i.test(x.lang);})[0]||v[0]||null;}catch(e){return null;}}
function di(t,lento){if(!hayVoz||!t)return; try{speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(String(t)); u.lang="en-US"; var v=vozEn(); if(v){u.voice=v; u.lang=v.lang;} u.rate=lento?0.55:0.85; u.pitch=1.05; speechSynthesis.speak(u);}catch(e){}}
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function hayMic(){return !!SR&&Date.now()>micHasta;}
function btnDi(t,cls){return '<button type="button" class="ig-son '+(cls||"")+'" data-di="'+esc(t)+'" aria-label="Escuchar en inglés">🔊</button>';}
function btnLento(t){return '<button type="button" class="ig-son lento" data-di="'+esc(t)+'" data-lento="1" aria-label="Escuchar despacio">🐢</button>';}
function activaDi(raiz){on(raiz,"[data-di]",function(b){di(b.getAttribute("data-di"),b.getAttribute("data-lento")==="1");});}

/* ---------- dibujos: el emoji en una ficha de color (o una mancha del color) ---------- */
var FONDOS=[["#fff3c4","#ffd166"],["#d7f9e9","#7be0b4"],["#dff1ff","#8ccfff"],["#ffe1ec","#ff9ec0"],["#ece4ff","#b9a2ff"],["#ffe8d6","#ffb37a"],["#e4fbd5","#a6e77a"]];
function hash(s){var h=0; for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0; return Math.abs(h);}
function dibujo(w,cls){
  if(w.c)return '<span class="ig-pic color '+(cls||"")+'" style="--c:'+w.c+'" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="M50 6c14 0 18 12 30 16s16 16 12 28-2 22-14 30-22 14-34 10S20 82 14 70 2 52 10 38 36 6 50 6z" fill="'+w.c+'" stroke="rgba(0,0,0,.18)" stroke-width="2"/>'+
    '<ellipse cx="36" cy="30" rx="12" ry="7" fill="#fff" opacity=".35" transform="rotate(-25 36 30)"/></svg><i>'+w.e+'</i></span>';
  if(/^\d+$/.test(w.e))return '<span class="ig-pic num '+(cls||"")+'" aria-hidden="true"><b>'+w.e+'</b></span>';
  if(/^[A-ZÁÉÍÓÚ]{3}$/.test(w.e))return '<span class="ig-pic cal '+(cls||"")+'" aria-hidden="true"><i></i><b>'+w.e+'</b></span>';
  var f=FONDOS[hash(w.en)%FONDOS.length];
  return '<span class="ig-pic '+(cls||"")+'" style="--f1:'+f[0]+';--f2:'+f[1]+'" aria-hidden="true">'+w.e+'</span>';
}

/* ===================== el camino ===================== */
var ZIG=[0,46,70,46,0,-46,-70,-46];
function mapa(){
  var pf=C.actual(); if(!pf)return C.portada();
  var g=ing(pf), act=I.actualLec(g), xh=hoyXP(g), r=racha(g), dif=I.dificiles(g,20), vistas=I.vistas(g);
  C.estado({ing:true});
  var saludo=!vistas?"Hello! Soy Lumi. ¡Vamos a aprender inglés jugando!":dif.length>=4?"Tienes "+dif.length+" palabras para repasar. ¡Practiquémoslas! 💪":xh>=META?"¡Cumpliste tu meta de hoy! Great job! 🎯":"Let's learn! ¡Sigamos con tu camino!";
  var html=C.cabeza(pf,"ingles",'⚡ '+g.xp+' XP · ⭐ '+I.estrellasTot(g)+(r?' · 🔥 '+r+(r===1?' día':' días'):''),'')+
    '<div class="ig-meta"><span>🎯 Meta de hoy</span><i style="--p:'+Math.min(100,Math.round(100*xh/META))+'%"></i><b>'+Math.min(xh,META)+'/'+META+' XP</b></div>'+
    (window.AxAprender?AxAprender.globo(dif.length>=4?"anima":"feliz",saludo):'')+
    (vistas>=4?'<button type="button" class="ig-repaso'+(dif.length>=4?' fuerte':'')+'" id="ig-repaso"><span>💪</span><b>Repasar mis palabras</b><small>'+(dif.length?dif.slice(0,6).map(function(w){return w.e;}).join(" ")+' y más':'Practica lo que ya aprendiste')+'</small></button>':'')+
    '<div class="ig-camino">'+I.UNIDADES.map(function(u,ui){
      var abierta=I.abierta(g,u.lecciones[0].id), hecha=I.unidadHecha(g,ui), k=0, cab='';
      if(!ui||I.UNIDADES[ui-1].nivel!==u.nivel){var N=I.NIVELES.filter(function(x){return x.n===u.nivel;})[0]||{nom:"Nivel "+u.nivel,ico:"⭐"}, delNivel=I.UNIDADES.filter(function(x){return x.nivel===u.nivel;}),
        listas=delNivel.filter(function(x){return I.unidadHecha(g,x.n);}).length;
        cab='<div class="ig-nivel n'+u.nivel+'"><span>'+N.ico+'</span><div><b>'+esc(N.nom)+'</b><small>'+listas+' de '+delNivel.length+' unidades</small></div></div>'+
          (u.nivel>1&&!I.nivelAbierto(g,u.nivel)?'<button type="button" class="ig-salto" data-salto="'+u.nivel+'"><span>🚀</span><b>¿Ya sabes lo del nivel anterior?</b><small>Haz una prueba de 12 ejercicios: con 80 % o más se abre el '+esc(N.nom)+'.</small></button>':'');}
      return cab+'<section class="ig-unidad'+(abierta?'':' cerrada')+'" style="--c:'+u.col+';--c2:'+u.col2+'">'+
        '<div class="ig-banda"><span class="ig-u-ico">'+u.ico+'</span><div><small>Unidad '+(ui+1)+(hecha?' · ✔ completa':'')+'</small><b>'+esc(u.en)+'</b><em>'+esc(u.nom)+'</em></div>'+
          '<button type="button" class="ig-vocab" data-vocab="'+ui+'" title="Ver las palabras">📖</button></div>'+
        '<div class="ig-nodos'+(u.lecciones.some(function(l){return l.id===act;})?' con-actual':'')+'">'+u.lecciones.map(function(l){var h=I.hecha(g,l.id), ab=I.abierta(g,l.id), cur=l.id===act, x=ZIG[(k++)%ZIG.length], e=h?g.lec[l.id].e:0;
          return '<div class="ig-nodo-fila" style="--x:'+x+'px">'+
            (cur&&window.AxAprender?'<span class="ig-lumi-camino'+(x>0?' izq':'')+'">'+AxAprender.mascota("feliz",64)+'</span>':'')+
            '<button type="button" class="ig-nodo '+(h?'hecho':cur?'actual':ab?'abierto':'cerrado')+'" data-lec="'+l.id+'" aria-label="'+esc(l.nom)+(h?' (hecha)':ab?'':' (cerrada)')+'">'+
              (cur?'<span class="ig-empieza">¡Empieza!</span>':'')+'<span class="ig-n-ico">'+(h?'✔':ab?l.ico:'🔒')+'</span></button>'+
            '<small class="ig-n-nom">'+esc(l.nom)+(h?'<i>'+'★★★'.slice(0,e)+'<s>'+'★★★'.slice(e)+'</s></i>':'')+'</small></div>';}).join("")+'</div></section>';}).join("")+'</div>'+
    '<p class="fine ig-pie-nota">Las lecciones se abren en orden. Toca 📖 para ver y escuchar las palabras de cada unidad.</p>';
  var el=C.pinta(html,"ing"); if(!el)return;
  C.activaCabeza(el);
  on(el,"[data-lec]",function(b){var id=b.getAttribute("data-lec");
    if(!I.abierta(g,id)){aviso(el,"🔒 Termina la lección anterior para abrir esta."); return;}
    inicia(id);});
  on(el,"[data-vocab]",function(b){vocab(+b.getAttribute("data-vocab"));});
  if($("ig-repaso"))$("ig-repaso").onclick=function(){inicia("repaso");};
  on(el,"[data-salto]",function(b){inicia("salto"+b.getAttribute("data-salto"));});
  var cur=el.querySelector(".ig-nodo.actual"); if(cur&&cur.scrollIntoView)setTimeout(function(){try{cur.scrollIntoView({block:"center",behavior:"smooth"});}catch(x){}},120);
  if(C.voz()&&!vistas)di("Hello! Let's learn English!");
}
function aviso(raiz,t){var a=raiz.querySelector(".ig-aviso"); if(!a){a=document.createElement("div"); a.className="ig-aviso"; raiz.appendChild(a);} a.textContent=t; a.classList.remove("on"); void a.offsetWidth; a.classList.add("on");}

/* las palabras de una unidad, para mirar y escuchar */
function vocab(ui){
  var u=I.UNIDADES[ui], pf=C.actual(), g=ing(pf);
  C.estado({ing:true});
  var el=C.pinta('<div class="mt-top"><button type="button" class="mt-atras" id="ig-volver">← Volver</button><b>'+u.ico+' '+esc(u.en)+' · '+esc(u.nom)+'</b></div>'+
    '<p class="fine">Toca una tarjeta para escucharla en inglés.</p><div class="ig-vocab-grid">'+u.palabras.map(function(w){var p=g.pal[w.en];
      return '<button type="button" class="ig-carta" data-di="'+esc(w.en)+'">'+dibujo(w)+'<b>'+esc(w.en)+'</b><small>'+esc(w.es)+'</small>'+(p&&p.f>=3?'<i class="ig-ok">✔</i>':'')+'</button>';}).join("")+'</div>'+
    '<h4>Frases</h4><div class="ig-frases">'+u.frases.map(function(f){return '<button type="button" class="ig-frase-l" data-di="'+esc(f.en)+'"><b>🔊 '+esc(f.en)+'</b><small>'+esc(f.es)+'</small></button>';}).join("")+'</div>',"ing");
  if(!el)return; activaDi(el); $("ig-volver").onclick=function(){mapa();};
}

/* ===================== una lección ===================== */
function inicia(id){
  var pf=C.actual(), g=ing(pf), seed=C.semilla(), ctx={prog:g,sinVoz:!hayVoz,mic:hayMic()};
  var its=id==="repaso"?I.repaso(seed,ctx):/^salto\d+$/.test(id)?I.salto(+id.slice(5),seed,ctx):I.genera(id,seed,ctx);
  if(!its.length)return mapa();
  its.forEach(function(it){it._n=1;});
  S={id:id,cola:its,i:0,tot:its.filter(function(x){return x.t!=="nueva";}).length,bien:0,hechos:0,combo:0,maxCombo:0,t0:Date.now(),pal:{},extra:0};
  muestra();
}
function para(){S=null; try{if(window.speechSynthesis)speechSynthesis.cancel();}catch(e){} if(rec){try{rec.abort();}catch(e){} rec=null;}}
function barra(){var total=S.cola.length, hecho=S.i; return '<div class="ig-prog" role="progressbar" aria-valuemin="0" aria-valuemax="'+total+'" aria-valuenow="'+hecho+'"><i style="width:'+Math.round(100*hecho/Math.max(1,total))+'%"></i></div>';}
function muestra(){
  if(!S)return mapa();
  if(S.i>=S.cola.length)return resultados();
  var it=S.cola[S.i], w=it.w?I.PAL[it.w]:null, cuerpo="", pie=true;
  S.sel=null; S.listo=false; S.otraVez=false;
  C.estado({ing:true});
  switch(it.t){
    case "nueva":
      cuerpo='<div class="ig-nueva"><span class="ig-etq">✨ Palabra nueva</span>'+dibujo(w,"xl")+'<div class="ig-palabra"><b>'+esc(w.en)+'</b>'+btnDi(w.en,"grande")+btnLento(w.en)+'</div><p class="ig-es">= '+esc(w.es)+'</p></div>'; break;
    case "imagen":
      cuerpo='<h3 class="ig-q">¿Cuál es…?</h3><div class="ig-pregunta"><b class="ig-chip">'+esc(w.en)+'</b>'+btnDi(w.en)+'</div>'+opsDibujo(it); break;
    case "escucha":
      cuerpo='<h3 class="ig-q">Escucha y elige el dibujo</h3><div class="ig-escucha">'+btnDi(w.en,"enorme")+btnLento(w.en)+'</div>'+opsDibujo(it); break;
    case "traduce":
      cuerpo='<h3 class="ig-q">¿Qué significa?</h3><div class="ig-pregunta col">'+dibujo(w,"md")+'<span><b class="ig-chip">'+esc(w.en)+'</b>'+btnDi(w.en)+'</span></div>'+opsTexto(it.ops.map(function(x){return I.PAL[x].es;})); break;
    case "alreves":
      cuerpo='<h3 class="ig-q">¿Cómo se dice en inglés?</h3><div class="ig-pregunta"><b class="ig-chip es">«'+esc(w.es)+'»</b></div>'+opsTexto(it.ops,true); break;
    case "parejas":
      cuerpo='<h3 class="ig-q">Une cada palabra con su dibujo</h3><div class="ig-parejas"><div>'+it.ws.map(function(x){return '<button type="button" class="ig-par izq" data-izq="'+esc(x)+'">'+esc(x)+'</button>';}).join("")+'</div><div>'+
        it.der.map(function(x){return '<button type="button" class="ig-par der" data-der="'+esc(x)+'">'+dibujo(I.PAL[x],"sm")+'</button>';}).join("")+'</div></div>'; pie=false; break;
    case "deletrea":
      cuerpo='<h3 class="ig-q">Escribe la palabra</h3><div class="ig-pregunta col">'+dibujo(w,"md")+'<span>'+btnDi(w.en)+btnLento(w.en)+' <small class="ig-es">'+esc(w.es)+'</small></span></div>'+
        '<div class="ig-huecos" id="ig-huecos"></div><div class="ig-letras" id="ig-letras">'+it.letras.map(function(l,k){return '<button type="button" class="ig-letra" data-k="'+k+'">'+esc(l)+'</button>';}).join("")+'</div>'; break;
    case "frase_en":
      cuerpo='<h3 class="ig-q">Arma la frase en inglés</h3>'+(window.AxAprender?AxAprender.globo("feliz",it.f[1],"chico"):'<p>'+esc(it.f[1])+'</p>')+
        '<div class="ig-linea" id="ig-linea"></div><div class="ig-banco" id="ig-banco">'+it.fichas.map(function(x,k){return '<button type="button" class="ig-ficha" data-k="'+k+'">'+esc(x)+'</button>';}).join("")+'</div>'; break;
    case "frase_es":
      cuerpo='<h3 class="ig-q">'+(it.audio?'Escucha y elige qué significa':'¿Qué significa esta frase?')+'</h3><div class="ig-pregunta'+(it.audio?' ig-escucha':'')+'">'+(it.audio?btnDi(it.f[0],"enorme")+btnLento(it.f[0]):'<b class="ig-chip frase">'+esc(it.f[0])+'</b>'+btnDi(it.f[0]))+'</div>'+opsTexto(it.ops,false,true); break;
    case "completa":
      var tok=I.fichas(it.f[0]); tok[it.hueco]='<span class="ig-blanco" id="ig-blanco">____</span>';
      cuerpo='<h3 class="ig-q">Completa la frase</h3><div class="ig-pregunta col"><b class="ig-chip frase">'+tok.map(function(x,k){return k===it.hueco?x:esc(x);}).join(" ")+'</b><small class="ig-es">'+esc(it.f[1])+'</small></div>'+opsTexto(it.ops,true); break;
    case "habla":
      var meta=it.w||it.f[0], wd=it.w?I.PAL[it.w]:null;
      cuerpo='<h3 class="ig-q">Dilo en voz alta</h3><div class="ig-pregunta col">'+(wd?dibujo(wd,"md"):'')+'<span><b class="ig-chip frase">'+esc(meta)+'</b>'+btnDi(meta)+btnLento(meta)+'</span></div>'+
        '<button type="button" class="ig-mic" id="ig-mic"><span>🎤</span><b>Toca y habla</b></button><p class="ig-oido" id="ig-oido" aria-live="polite"></p>'+
        '<button type="button" class="ghost ig-nopuedo" id="ig-nopuedo">Ahora no puedo hablar</button>'; break;
  }
  var el=C.pinta('<div class="mt-top ig-top"><button type="button" class="ig-x" id="ig-salir" aria-label="Salir de la lección">✕</button>'+barra()+(S.combo>=3?'<span class="ig-combo">🔥 '+S.combo+'</span>':'')+'</div>'+
    '<div class="ig-cuerpo t-'+it.t+'">'+cuerpo+'</div>'+
    (pie||it.t==="nueva"?'<div class="ig-pie" id="ig-pie"><div class="ig-pie-in"><button type="button" class="ig-check" id="ig-comprobar"'+(it.t==="nueva"?'':' disabled')+'>'+(it.t==="nueva"?'Continuar':'Comprobar')+'</button></div></div>':''),"ing jugando-ing");
  if(!el)return;
  activaDi(el);
  $("ig-salir").onclick=function(){if(confirm("¿Salir de la lección? Lo que llevas no cuenta como lección terminada."))return (para(),mapa());};
  if(it.t==="nueva"){di(w.en); $("ig-comprobar").onclick=function(){var pf=C.actual(); I.registra(ing(pf),it,true); C.cambia(pf); S.i++; muestra();}; C.teclado(function(k){if(k==="Enter"){$("ig-comprobar").click(); return true;}}); return;}
  if(it.t==="escucha"||(it.t==="frase_es"&&it.audio))setTimeout(function(){di(it.f?it.f[0]:w.en);},250);
  else if(it.t==="imagen"||it.t==="habla")setTimeout(function(){di(it.w||it.f[0]);},250);
  activa(el,it);
}
function opsDibujo(it){return '<div class="ig-ops dibujos n'+it.ops.length+'">'+it.ops.map(function(x,k){return '<button type="button" class="ig-op" data-op="'+k+'"><i class="ig-num">'+(k+1)+'</i>'+dibujo(I.PAL[x],"lg")+'</button>';}).join("")+'</div>';}
function opsTexto(ops,decir,largas){return '<div class="ig-ops texto'+(largas?' largas':'')+'">'+ops.map(function(x,k){return '<button type="button" class="ig-op" data-op="'+k+'"'+(decir?' data-decir="'+esc(x)+'"':'')+'><i class="ig-num">'+(k+1)+'</i>'+esc(x)+'</button>';}).join("")+'</div>';}

/* elegir, armar o hablar; después «Comprobar» */
function activa(el,it){
  var bt=$("ig-comprobar");
  function listo(v){S.sel=v; if(bt)bt.disabled=v==null||v===""||(Array.isArray(v)&&!v.length);}
  if(it.ops){
    on(el,"[data-op]",function(b){if(S.listo)return; Array.prototype.forEach.call(el.querySelectorAll("[data-op]"),function(x){x.classList.toggle("on",x===b);}); C.SON.toca();
      if(b.getAttribute("data-decir"))di(b.getAttribute("data-decir"));
      if(it.t==="completa"){var bl=$("ig-blanco"); bl.textContent=it.ops[+b.getAttribute("data-op")]; bl.classList.add("lleno");}
      listo(+b.getAttribute("data-op"));});
    C.teclado(function(k){var n=+k; if(n>=1&&n<=it.ops.length&&!S.listo){el.querySelector('[data-op="'+(n-1)+'"]').click(); return true;} if(k==="Enter"){if(bt&&!bt.disabled)bt.click(); return true;}});
  }
  if(it.t==="deletrea"){
    var puestas=[], hu=$("ig-huecos"), n=it.w.replace(/\s/g,"").length;
    function pintaH(){var h='';for(var k=0;k<n;k++){var p=puestas[k]; h+='<button type="button" class="ig-hueco'+(p!=null?' lleno':'')+'" data-h="'+k+'">'+(p!=null?esc(it.letras[p]):'')+'</button>';} hu.innerHTML=h;
      on(hu,"[data-h]",function(b){if(S.listo)return; var k=+b.getAttribute("data-h"), p=puestas[k]; if(p==null)return; puestas.splice(k,1); var l=el.querySelector('.ig-letra[data-k="'+p+'"]'); if(l)l.classList.remove("usada"); pintaH();});
      listo(puestas.length===n?puestas.map(function(k){return it.letras[k];}).join(""):null);}
    pintaH();
    on(el,".ig-letra",function(b){if(S.listo||b.classList.contains("usada")||puestas.length>=n)return; puestas.push(+b.getAttribute("data-k")); b.classList.add("usada"); C.SON.toca(); pintaH();});
    C.teclado(function(k){if(k==="Enter"){if(bt&&!bt.disabled)bt.click(); return true;}
      if(k==="Backspace"&&puestas.length){var p=puestas.pop(), l=el.querySelector('.ig-letra[data-k="'+p+'"]'); if(l)l.classList.remove("usada"); pintaH(); return true;}
      if(/^[a-z]$/i.test(k)){var libre=Array.prototype.filter.call(el.querySelectorAll(".ig-letra:not(.usada)"),function(x){return x.textContent.toLowerCase()===k.toLowerCase();})[0]; if(libre){libre.click(); return true;}}});
  }
  if(it.t==="frase_en"){
    var orden=[], li=$("ig-linea");
    function pintaL(){li.innerHTML=orden.map(function(k){return '<button type="button" class="ig-ficha en-linea" data-l="'+k+'">'+esc(it.fichas[k])+'</button>';}).join("")||'<small>Toca las palabras en orden</small>';
      on(li,"[data-l]",function(b){if(S.listo)return; var k=+b.getAttribute("data-l"); orden.splice(orden.indexOf(k),1); el.querySelector('#ig-banco [data-k="'+k+'"]').classList.remove("usada"); pintaL();});
      listo(orden.length?orden.map(function(k){return it.fichas[k];}).join(" "):null);}
    pintaL();
    on(el,"#ig-banco .ig-ficha",function(b){if(S.listo||b.classList.contains("usada"))return; var k=+b.getAttribute("data-k"); orden.push(k); b.classList.add("usada"); di(it.fichas[k]); pintaL();});
    C.teclado(function(k){if(k==="Enter"){if(bt&&!bt.disabled)bt.click(); return true;} if(k==="Backspace"&&orden.length){var x=orden.pop(); el.querySelector('#ig-banco [data-k="'+x+'"]').classList.remove("usada"); pintaL(); return true;}});
  }
  if(it.t==="parejas")parejas(el,it);
  if(it.t==="habla")habla(el,it,listo);
  if(bt)bt.onclick=function(){if(S.listo){siguiente(); return;} if(S.sel==null)return; comprueba(it,S.sel);};
}
function parejas(el,it){
  var izq=null, der=null, hechas=0, errores=0;
  function prueba(){
    if(izq==null||der==null)return;
    var bi=el.querySelector('[data-izq="'+izq+'"]'), bd=el.querySelector('[data-der="'+der+'"]');
    if(izq===der){bi.classList.add("hecha"); bd.classList.add("hecha"); bi.disabled=bd.disabled=true; hechas++; C.SON.bien(); I.registra(ing(C.actual()),{t:"x",w:izq},true);}
    else{errores++; bi.classList.add("mal"); bd.classList.add("mal"); C.SON.otra(); I.registra(ing(C.actual()),{t:"x",w:izq},false); setTimeout(function(){bi.classList.remove("mal"); bd.classList.remove("mal");},500);}
    Array.prototype.forEach.call(el.querySelectorAll(".ig-par"),function(x){x.classList.remove("on");}); izq=der=null;
    if(hechas===it.ws.length){S.listo=true; setTimeout(function(){fin(it,errores<=1,null,errores);},350);}
  }
  on(el,"[data-izq]",function(b){if(b.disabled)return; izq=b.getAttribute("data-izq"); di(izq); Array.prototype.forEach.call(el.querySelectorAll("[data-izq]"),function(x){x.classList.toggle("on",x===b);}); prueba();});
  on(el,"[data-der]",function(b){if(b.disabled)return; der=b.getAttribute("data-der"); C.SON.toca(); Array.prototype.forEach.call(el.querySelectorAll("[data-der]"),function(x){x.classList.toggle("on",x===b);}); prueba();});
}
var rec=null;
function habla(el,it,listo){
  var b=$("ig-mic"), oido=$("ig-oido");
  $("ig-nopuedo").onclick=function(){micHasta=Date.now()+15*60000; S.cola.splice(S.i,1); S.tot--; muestra();};
  b.onclick=function(){
    if(S.listo)return;
    if(!SR){oido.textContent="Este navegador no puede escuchar."; return;}
    try{if(rec)rec.abort();}catch(e){}
    rec=new SR(); rec.lang="en-US"; rec.interimResults=false; rec.maxAlternatives=4;
    b.classList.add("escucha"); b.querySelector("b").textContent="Te escucho…"; oido.textContent="";
    rec.onresult=function(ev){var alts=[], r=ev.results[0]; for(var k=0;k<r.length;k++)alts.push(r[k].transcript);
      var ok=alts.some(function(a){return I.corrige(it,a);}); oido.textContent="Escuché: «"+alts[0]+"»";
      /* una oportunidad más: a veces el micrófono entiende mal */
      if(!ok&&!S.otraVez){S.otraVez=true; oido.textContent="Escuché «"+alts[0]+"». ¡Casi! Escucha 🔊 y dilo otra vez."; C.SON.otra(); return;}
      listo(alts[0]); comprueba(it,ok?(it.w||it.f[0]):alts[0]);};
    rec.onerror=function(ev){oido.textContent=ev.error==="not-allowed"?"Hace falta permitir el micrófono.":ev.error==="no-speech"?"No te escuché. ¡Inténtalo otra vez!":"No se pudo escuchar. Inténtalo otra vez.";};
    rec.onend=function(){b.classList.remove("escucha"); b.querySelector("b").textContent="Toca y habla"; rec=null;};
    try{rec.start();}catch(e){oido.textContent="No se pudo usar el micrófono.";}
  };
}
/* comprobar: acierto o la respuesta correcta (y el ejercicio vuelve al final) */
function comprueba(it,resp){fin(it,I.corrige(it,resp),resp);}
function fin(it,ok,resp,errores){
  if(!S)return;
  S.listo=true;
  var pf=C.actual(), g=ing(pf), primera=it._n===1;
  if(it.t!=="parejas")I.registra(g,it,ok);
  I.palabrasDe(it).forEach(function(w){S.pal[w]=1;});
  if(primera){S.hechos++; if(ok)S.bien++;}
  if(ok){S.combo++; S.maxCombo=Math.max(S.maxCombo,S.combo); C.SON.bien();}
  else{S.combo=0; C.SON.otra(); if(it._n<2){var copia=JSON.parse(JSON.stringify(it)); copia._n=2; S.cola.push(copia);}}
  C.cambia(pf);
  /* marcar en pantalla la correcta y la elegida */
  if(it.ops){var el=document.querySelector(".ig-cuerpo"); if(el){var bOk=el.querySelector('[data-op="'+it.ok+'"]'); Array.prototype.forEach.call(el.querySelectorAll("[data-op]"),function(x){x.classList.remove("on");}); if(bOk)bOk.classList.add("bien"); if(!ok&&resp!=null){var bm=el.querySelector('[data-op="'+resp+'"]'); if(bm)bm.classList.add("mal");}}}
  var correcta=I.respuesta(it), enIngles=it.t==="traduce"?it.w:it.t==="frase_es"?it.f[0]:it.t==="completa"?it.f[0]:correcta;
  var animo=pick(I.ANIMOS), txt;
  if(ok)txt='<b>'+(S.combo>=3?'🔥 ¡'+S.combo+' seguidas! ':'')+esc(animo)+'</b><small>'+esc(I.ANIMOS_ES[animo])+'</small>'+(it.t==="parejas"?'':'<p>'+mostrar(it)+'</p>');
  else txt='<b>¡Casi! La respuesta es:</b><p>'+mostrar(it)+'</p><small>'+(it._n<2?'Lo repasaremos al final 💪':'¡Ya la vas aprendiendo! 🌱')+'</small>';
  var pie=$("ig-pie");
  if(!pie){pie=document.createElement("div"); pie.className="ig-pie"; pie.id="ig-pie"; document.querySelector(".mt.ing").appendChild(pie);}
  pie.className="ig-pie "+(ok?"bien":"mal");
  pie.innerHTML='<div class="ig-pie-in">'+(window.AxAprender?'<span class="ig-pie-lumi">'+AxAprender.mascota(ok?(S.combo>=3?"wow":"feliz"):"anima",64)+'</span>':'')+
    '<div class="ig-pie-txt">'+txt+'</div>'+(enIngles?btnDi(enIngles):'')+'<button type="button" class="ig-check" id="ig-comprobar">Continuar</button></div>';
  activaDi(pie);
  if(enIngles)di(enIngles);
  var bt=$("ig-comprobar"); bt.onclick=siguiente; try{bt.focus({preventScroll:true});}catch(x){}
  C.teclado(function(k){if(k==="Enter"||k===" "){siguiente(); return true;}});
}
function mostrar(it){
  if(it.t==="traduce")return esc(it.w)+' = <b>'+esc(I.PAL[it.w].es)+'</b>';
  if(it.t==="imagen"||it.t==="escucha"||it.t==="alreves"||it.t==="deletrea"){var w=I.PAL[it.w]; return w.e+' <b>'+esc(w.en)+'</b> = '+esc(w.es);}
  if(it.t==="frase_es")return '<b>'+esc(it.f[0])+'</b> = '+esc(it.f[1]);
  if(it.t==="completa"){var t=I.fichas(it.f[0]); t[it.hueco]='<u>'+esc(t[it.hueco])+'</u>'; return '<b>'+t.map(function(x,k){return k===it.hueco?x:esc(x);}).join(" ")+'</b>';}
  if(it.t==="frase_en")return '<b>'+esc(it.f[0])+'</b>';
  if(it.t==="habla")return '<b>'+esc(it.w||it.f[0])+'</b>';
  return '';
}
function siguiente(){if(!S)return; S.i++; muestra();}

/* ===================== al terminar ===================== */
function resultados(){
  var pf=C.actual(), g=ing(pf), id=S.id, tot=Math.max(1,S.tot), bien=S.bien, seg=Math.round((Date.now()-S.t0)/1000), r, antes=hoyXP(g);
  var L0=I.POR_ID[id], unidadAntes=L0?I.unidadHecha(g,L0.u):false, salto=/^salto\d+$/.test(id)?+id.slice(5):0, aprobo=false;
  if(salto){aprobo=bien/tot>=0.8; if(aprobo)I.saltaNivel(g,salto);}
  if(!L0){var xp=5+Math.round(bien/2); g.xp+=xp; var d=C.hoy(); g.dias[d]=(g.dias[d]||0)+xp; r={estrellas:bien/tot>=0.9?3:bien/tot>=0.7?2:1,xp:xp,prec:bien/tot};}
  else r=I.termina(g,id,bien,tot);
  if(S.maxCombo>=5){g.xp+=3; r.xp+=3; g.dias[C.hoy()]+=3;}
  C.cambia(pf);
  var L=I.POR_ID[id], u=L?I.UNIDADES[L.u]:null, unidadAhora=L?I.unidadHecha(g,L.u):false, ahora=hoyXP(g), meta=antes<META&&ahora>=META;
  var palabras=Object.keys(S.pal).map(function(k){return I.PAL[k];}).filter(Boolean), flojas=palabras.filter(function(w){var p=g.pal[w.en]; return p&&p.f<2;});
  var sel=null, idL=id;
  var est='';for(var k=1;k<=3;k++)est+='<i class="'+(k<=r.estrellas?'on':'')+'" style="--d:'+(k*0.25)+'s">★</i>';
  S=null;
  var el=C.pinta('<div class="ig-fin">'+(window.AxAprender?AxAprender.mascota(r.prec>=0.6?"celebra":"anima",130):'')+
    '<h3>'+(salto?(aprobo?'¡Prueba aprobada!':'¡Buen intento!'):id==="repaso"?'¡Repaso completo!':'¡Lección completa!')+'</h3>'+
    (salto?'<p class="ig-trofeo'+(aprobo?' meta':'')+'">'+(aprobo?'🚀 ¡Se abrió el '+esc((I.NIVELES.filter(function(x){return x.n===salto;})[0]||{nom:"nivel"}).nom)+'! Las lecciones anteriores quedan hechas y puedes repasarlas cuando quieras.':'Para saltar hace falta 80 % de aciertos. Sigue con las lecciones del camino o inténtalo otra vez: ¡cada intento te ayuda a aprender!')+'</p>':'')+(u?'<p class="fine">'+u.ico+' '+esc(u.en)+' · '+esc(L.nom)+'</p>':'')+
    '<div class="ig-estrellas">'+est+'</div>'+
    '<div class="ig-kpis"><div class="xp"><small>XP</small><b>+'+r.xp+'</b></div><div class="pr"><small>Aciertos</small><b>'+Math.round(r.prec*100)+' %</b></div><div class="ti"><small>Tiempo</small><b>'+Math.floor(seg/60)+':'+("0"+seg%60).slice(-2)+'</b></div></div>'+
    (unidadAhora&&!unidadAntes?'<p class="ig-trofeo">🏆 ¡Terminaste la unidad <b>'+esc(u.en)+'</b>! Se abrió la siguiente.</p>':'')+
    (meta?'<p class="ig-trofeo meta">🎯 ¡Cumpliste tu meta de hoy!</p>':'')+
    (r.prec<0.6&&flojas.length?'<div class="ig-flojas">'+(window.AxAprender?AxAprender.globo("anima","Algunas palabras costaron un poquito. ¡Repasarlas te hará más fuerte!"):'')+'<button type="button" class="ig-repaso fuerte" id="ig-rep"><span>💪</span><b>Repasar ahora</b><small>'+flojas.slice(0,6).map(function(w){return w.e+' '+esc(w.en);}).join(" · ")+'</small></button></div>':'')+
    (palabras.length?'<h4>Palabras de hoy</h4><div class="ig-hoy">'+palabras.map(function(w){return '<button type="button" class="ig-mini" data-di="'+esc(w.en)+'">'+w.e+' '+esc(w.en)+'</button>';}).join("")+'</div>':'')+
    '<h4>¿Cómo te sentiste?</h4><div class="mt-sentir">'+C.SENTIR.map(function(x,i){return '<button type="button" data-s="'+i+'"><span>'+x[0]+'</span>'+x[1]+'</button>';}).join("")+'</div>'+
    '<div class="actions"><button type="button" class="ghost" id="ig-otra">Repetir</button><button type="button" class="primary grande" id="ig-sigue">Continuar →</button></div></div>',"ing fin");
  if(!el)return;
  activaDi(el);
  function guarda(){g.refl.push({l:idL,t:Date.now(),ok:bien,n:tot,s:sel}); while(g.refl.length>30)g.refl.shift(); C.cambia(pf);}
  on(el,"[data-s]",function(b){var nuevo=sel==null; sel=+b.getAttribute("data-s"); Array.prototype.forEach.call(el.querySelectorAll("[data-s]"),function(x){x.classList.toggle("on",x===b);}); C.SON.toca();
    if(nuevo)guarda(); else{g.refl[g.refl.length-1].s=sel; C.cambia(pf);}
    if(sel===3)di("You are brave! Keep trying!");});
  $("ig-sigue").onclick=function(){mapa();};
  $("ig-otra").onclick=function(){inicia(idL);};
  if($("ig-rep"))$("ig-rep").onclick=function(){inicia("repaso");};
  C.SON.sube();
  di(r.prec>=0.9?"Amazing! Lesson complete!":r.prec>=0.6?"Great job! Lesson complete!":"Good try! Keep practicing!");
}

window.AxInglesUI={mapa:mapa,para:para,inicia:inicia,_estado:function(){return S;}};
})();
