/* ===========================================================
   AXIOMA · Sudoku · motor
   Los tableros del día son iguales para todo el mundo: se generan
   con una semilla derivada de la fecha y del nivel, de modo que el
   ranking por tiempo es comparable entre jugadores.

   Todo el trabajo pesado va con máscaras de bits: cada fila, columna
   y caja guarda en nueve bits qué cifras tiene ya. Comprobar o
   deshacer una jugada es entonces una operación entera, no un
   recorrido, que es lo que hace viable generar en el móvil.
   =========================================================== */
(function(){
"use strict";

var BIT=[0,1,2,4,8,16,32,64,128,256];
var POP=(function(){var t=new Int8Array(512),i;for(i=1;i<512;i++)t[i]=t[i>>1]+(i&1);return t;})();
var CAJA=(function(){var t=new Int8Array(81),k;for(k=0;k<81;k++)t[k]=((k/27)|0)*3+(((k%9)/3)|0);return t;})();
var UNI=(function(){          /* las 27 unidades: 9 filas, 9 columnas, 9 cajas */
  var u=[],i,j,r,c;
  for(i=0;i<9;i++){var f=[],co=[];for(j=0;j<9;j++){f.push(i*9+j);co.push(j*9+i);}u.push(f);u.push(co);}
  for(r=0;r<9;r+=3)for(c=0;c<9;c+=3){var b=[];
    for(i=0;i<3;i++)for(j=0;j<3;j++)b.push((r+i)*9+c+j);
    u.push(b);}
  return u;
})();

function barajar(a,rng){for(var i=a.length-1;i>0;i--){var j=Math.floor(rng()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function bits(m){var l=[];while(m){var b=m&-m;m^=b;l.push(b);}return l;}
function mascaras(g){
  var f=new Int32Array(9),c=new Int32Array(9),b=new Int32Array(9),k,n;
  for(k=0;k<81;k++){n=g[k];if(!n)continue;var bit=BIT[n];
    f[(k/9)|0]|=bit; c[k%9]|=bit; b[CAJA[k]]|=bit;}
  return {f:f,c:c,b:b};
}

/* cuenta soluciones hasta el tope indicado */
function resolver(g,cap,rng){
  var m=mascaras(g), val=g.slice(), sol=0;
  (function rec(){
    var mejor=-1,mejorMask=0,mejorN=10,k,libre,cnt;
    for(k=0;k<81;k++){
      if(val[k])continue;
      libre=511&~(m.f[(k/9)|0]|m.c[k%9]|m.b[CAJA[k]]);
      cnt=POP[libre];
      if(!cnt)return;
      if(cnt<mejorN){mejorN=cnt;mejor=k;mejorMask=libre;if(cnt===1)break;}
    }
    if(mejor<0){sol++;return;}
    var r=(mejor/9)|0,c=mejor%9,b=CAJA[mejor],lista=bits(mejorMask),i;
    if(rng)barajar(lista,rng);
    for(i=0;i<lista.length;i++){
      var bit=lista[i];
      val[mejor]=POP[bit-1]+1; m.f[r]|=bit; m.c[c]|=bit; m.b[b]|=bit;
      rec();
      val[mejor]=0; m.f[r]^=bit; m.c[c]^=bit; m.b[b]^=bit;
      if(sol>=cap)return;
    }
  })();
  return sol;
}

/* rejilla completa al azar */
function completo(rng){
  var g=new Array(81).fill(0), m=mascaras(g);
  (function rec(k){
    if(k===81)return true;
    var r=(k/9)|0,c=k%9,b=CAJA[k];
    var lista=barajar(bits(511&~(m.f[r]|m.c[c]|m.b[b])),rng),i;
    for(i=0;i<lista.length;i++){
      var bit=lista[i];
      g[k]=POP[bit-1]+1; m.f[r]|=bit; m.c[c]|=bit; m.b[b]|=bit;
      if(rec(k+1))return true;
      g[k]=0; m.f[r]^=bit; m.c[c]^=bit; m.b[b]^=bit;
    }
    return false;
  })(0);
  return g;
}

/* --- técnicas de resolución, solo para graduar la dificultad --- */
function candidatos(g){
  var m=mascaras(g), c=[],k;
  for(k=0;k<81;k++){
    if(g[k]){c.push(null);continue;}
    c.push(bits(511&~(m.f[(k/9)|0]|m.c[k%9]|m.b[CAJA[k]])).map(function(b){return POP[b-1]+1;}));
  }
  return c;
}
function tecnicas(g,nivel){   /* 1 solo desnudos · 2 +ocultos · 3 +parejas y apuntadores */
  var t=g.slice(), sigue=true, vueltas=0;
  while(sigue&&vueltas++<120){
    sigue=false;
    var c=candidatos(t),k,i,n,u;
    for(k=0;k<81;k++)if(c[k]){
      if(!c[k].length)return null;
      if(c[k].length===1){t[k]=c[k][0];sigue=true;}
    }
    if(sigue)continue;
    if(nivel>=2){
      for(u=0;u<UNI.length&&!sigue;u++)for(n=1;n<=9&&!sigue;n++){
        var donde=[];
        for(i=0;i<9;i++){var kk=UNI[u][i]; if(c[kk]&&c[kk].indexOf(n)>=0)donde.push(kk);}
        if(donde.length===1){t[donde[0]]=n;sigue=true;}
      }
      if(sigue)continue;
    }
    if(nivel>=3 && (parejas(c)||apuntadores(c))){
      for(k=0;k<81;k++)if(c[k]&&c[k].length===1){t[k]=c[k][0];sigue=true;}
      if(sigue)continue;
    }
  }
  for(var q=0;q<81;q++)if(!t[q])return null;
  return t;
}
function parejas(c){
  var hecho=false,u,i,j;
  for(u=0;u<UNI.length;u++){
    var un=UNI[u];
    for(i=0;i<9;i++)for(j=i+1;j<9;j++){
      var a=c[un[i]],b=c[un[j]];
      if(!a||!b||a.length!==2||b.length!==2||a[0]!==b[0]||a[1]!==b[1])continue;
      for(var q=0;q<9;q++){
        var k=un[q]; if(k===un[i]||k===un[j]||!c[k])continue;
        var antes=c[k].length;
        c[k]=c[k].filter(function(n){return n!==a[0]&&n!==a[1];});
        if(c[k].length!==antes)hecho=true;
      }
    }
  }
  return hecho;
}
function apuntadores(c){
  var hecho=false,r,co,n,i,j;
  for(r=0;r<9;r+=3)for(co=0;co<9;co+=3){
    var caja=[];
    for(i=0;i<3;i++)for(j=0;j<3;j++)caja.push((r+i)*9+co+j);
    for(n=1;n<=9;n++){
      var donde=caja.filter(function(k){return c[k]&&c[k].indexOf(n)>=0;});
      if(donde.length<2||donde.length>3)continue;
      var f0=(donde[0]/9)|0, c0=donde[0]%9;
      var enFila=donde.every(function(k){return ((k/9)|0)===f0;});
      var enCol =donde.every(function(k){return k%9===c0;});
      if(!enFila&&!enCol)continue;
      for(var k=0;k<81;k++){
        if(!c[k]||caja.indexOf(k)>=0)continue;
        if(enFila? ((k/9)|0)!==f0 : k%9!==c0)continue;
        var antes=c[k].length;
        c[k]=c[k].filter(function(x){return x!==n;});
        if(c[k].length!==antes)hecho=true;
      }
    }
  }
  return hecho;
}
function grado(p){
  if(tecnicas(p,1))return 1;
  if(tecnicas(p,2))return 2;
  if(tecnicas(p,3))return 3;
  return 4;
}

var NIVELES={1:{nom:"Fácil",pistas:42},2:{nom:"Medio",pistas:34},
             3:{nom:"Difícil",pistas:28},4:{nom:"Experto",pistas:24}};

/* Generación en tres fases: se cava hasta el número de pistas del nivel;
   si el tablero se queda fácil se sigue cavando, y si se ha pasado de
   dificultad se devuelven pistas hasta bajar al grado buscado. Así el
   nivel pedido se alcanza siempre, en vez de depender de la suerte. */
function genera(nivel,rng){
  var obj=NIVELES[nivel].pistas, mejor=null, mejorDist=99;
  for(var intento=0;intento<20;intento++){
    var full=completo(rng), p=full.slice(), pistas=81, quitadas=[], i, k, g;
    var orden=barajar(Array.from({length:81},function(_,j){return j;}),rng);

    for(i=0;i<orden.length&&pistas>obj;i++){          /* fase 1: hasta el objetivo */
      k=orden[i]; if(!p[k])continue;
      g=p[k]; p[k]=0;
      if(resolver(p,2)!==1){p[k]=g;continue;}
      quitadas.push(k); pistas--;
    }
    for(;i<orden.length&&grado(p)<nivel;i++){         /* fase 2: si se queda corto */
      k=orden[i]; if(!p[k])continue;
      g=p[k]; p[k]=0;
      if(resolver(p,2)!==1){p[k]=g;continue;}
      quitadas.push(k); pistas--;
    }
    while(quitadas.length&&grado(p)>nivel){           /* fase 3: si se ha pasado */
      k=quitadas.pop(); p[k]=full[k]; pistas++;
    }
    var gf=grado(p), dist=Math.abs(gf-nivel);
    if(!dist)return {puzzle:p,solucion:full,pistas:pistas,nivel:nivel};
    if(dist<mejorDist){mejorDist=dist;mejor={puzzle:p.slice(),solucion:full,pistas:pistas,nivel:gf};}
  }
  return mejor;   /* nunca se devuelve nada: como mucho, un grado contiguo */
}

/* mulberry32, el mismo generador que usa el reto diario de Axioma */
function semilla(s){var a=s>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};}

window.AxSudokuMotor={UNI:UNI,CAJA:CAJA,resolver:resolver,completo:completo,candidatos:candidatos,
  genera:genera,grado:grado,semilla:semilla,NIVELES:NIVELES,tecnicas:tecnicas};
})();

/* ===========================================================
   AXIOMA · Sudoku · pantalla
   =========================================================== */
(function(){
"use strict";
var M=window.AxSudokuMotor;
var $=function(id){return document.getElementById(id)};
if(!$("sud-board"))return;

var nivel=1, P=null, val=null, notas=null, sel=-1, modoNotas=false,
    errores=0, pistas=0, hechas=[], listo=false, diario=true,
    ms=0, desde=0, corriendo=false, latido=null;

/* ---------- tiempo ---------- */
function dia(){return Math.floor((Date.now()-Date.UTC(2026,0,1))/86400000)+1;}
function transcurrido(){return ms+(corriendo?Date.now()-desde:0);}
function reloj(t){var s=Math.floor(t/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60),g=s%60;
  var d=function(x){return x<10?"0"+x:""+x};return h?(h+":"+d(m)+":"+d(g)):(m+":"+d(g));}
function pintaTiempo(){$("sud-time").textContent=reloj(transcurrido());}
function arranca(){if(corriendo||listo)return;corriendo=true;desde=Date.now();latido=setInterval(pintaTiempo,1000);}
function detiene(){if(!corriendo)return;ms+=Date.now()-desde;corriendo=false;
  if(latido){clearInterval(latido);latido=null;}pintaTiempo();}
function cero(){detiene();ms=0;pintaTiempo();}
document.addEventListener("visibilitychange",function(){
  if(document.body.getAttribute("data-game")!=="sudoku")return;
  if(document.hidden)detiene(); else if(!listo&&hechas.length)arranca();
});

/* ---------- guardado local ---------- */
function guarda(k,v){try{if(v===undefined)return localStorage.getItem("axs_"+k);
  if(v===null)localStorage.removeItem("axs_"+k);else localStorage.setItem("axs_"+k,v);}catch(e){return null}}
function registro(){
  try{var r=JSON.parse(guarda("done")||"{}");var k=dia()+"-"+nivel;return r[k]||null;}catch(e){return null}
}
function anota(){
  if(!diario||registro())return;
  try{var r=JSON.parse(guarda("done")||"{}");
    r[dia()+"-"+nivel]={ms:transcurrido(),err:errores,pistas:pistas};
    guarda("done",JSON.stringify(r));}catch(e){}
}

/* ---------- conflictos ---------- */
function choca(k,n){
  if(!n)return false;
  var f=(k/9)|0,c=k%9,b=M.CAJA[k],i;
  for(i=0;i<81;i++){
    if(i===k)continue;
    if(((i/9)|0)===f||i%9===c||M.CAJA[i]===b){
      var v=P.puzzle[i]||val[i];
      if(v===n)return true;
    }
  }
  return false;
}
function restantes(n){
  var c=0,i;for(i=0;i<81;i++)if((P.puzzle[i]||val[i])===n)c++;
  return 9-c;
}

/* ---------- pintado ---------- */
function pinta(){
  var host=$("sud-board"), o=[], bx, i, j;
  var selN = sel>=0 ? (P.puzzle[sel]||val[sel]) : 0;
  /* la rejilla se dibuja como nueve cajas de tres por tres: así las
     líneas gruesas salen del propio hueco entre cajas */
  for(bx=0;bx<9;bx++){
    o.push('<div class="sbox">');
    var r0=((bx/3)|0)*3, c0=(bx%3)*3;
    for(i=0;i<3;i++)for(j=0;j<3;j++){
      var k=(r0+i)*9+c0+j;
      var fijo=P.puzzle[k], v=fijo||val[k], cls="sc";
      if(fijo)cls+=" fija";
      if(k===sel)cls+=" sel";
      else if(sel>=0){
        var f=(k/9)|0,c=k%9;
        if(f===((sel/9)|0)||c===sel%9||M.CAJA[k]===M.CAJA[sel])cls+=" peer";
      }
      if(v&&selN&&v===selN)cls+=" igual";
      if(!fijo&&v&&choca(k,v))cls+=" mal";
      var dentro=v?String(v):(notas[k]?nota(k):"");
      o.push('<button class="'+cls+'" data-k="'+k+'" type="button" aria-label="Fila '+
        (((k/9)|0)+1)+', columna '+(k%9+1)+(v?", "+v:", vacía")+'">'+dentro+'</button>');
    }
    o.push('</div>');
  }
  host.innerHTML=o.join("");
  var bs=host.querySelectorAll(".sc");
  for(i=0;i<bs.length;i++)bs[i].onclick=function(){sel=+this.getAttribute("data-k");pinta();};

  var pad=$("sud-pad"), p=[], n, k;
  for(n=1;n<=9;n++){
    var q=restantes(n);
    p.push('<button class="pk'+(q<=0?" hecho":"")+'" data-n="'+n+'" type="button">'+n+
           '<small>'+(q>0?q:"")+'</small></button>');
  }
  pad.innerHTML=p.join("");
  var ps=pad.querySelectorAll(".pk");
  for(i=0;i<ps.length;i++)ps[i].onclick=function(){pon(+this.getAttribute("data-n"));};

  var quedan=0;for(k=0;k<81;k++)if(!P.puzzle[k]&&!val[k])quedan++;
  $("sud-left").textContent=quedan;
  $("sud-err").textContent=errores;
  $("sud-hints").textContent=pistas;
  pintaTiempo();
}
function nota(k){
  var m=notas[k],o=[],n;
  for(n=1;n<=9;n++)o.push('<i>'+((m>>(n-1))&1?n:"")+'</i>');
  return '<span class="nt">'+o.join("")+'</span>';
}

/* ---------- jugadas ---------- */
function pon(n){
  if(listo||sel<0||P.puzzle[sel])return;
  arranca();
  if(modoNotas){
    hechas.push({k:sel,v:val[sel],nt:notas[sel]});
    notas[sel]^= (1<<(n-1)); val[sel]=0;
  }else{
    hechas.push({k:sel,v:val[sel],nt:notas[sel]});
    val[sel] = (val[sel]===n) ? 0 : n;
    notas[sel]=0;
    if(val[sel]&&choca(sel,val[sel])){errores++;}
  }
  pinta(); comprueba();
}
function borra(){
  if(listo||sel<0||P.puzzle[sel])return;
  hechas.push({k:sel,v:val[sel],nt:notas[sel]});
  val[sel]=0; notas[sel]=0; pinta();
}
function deshaz(){
  if(listo||!hechas.length)return;
  var h=hechas.pop(); val[h.k]=h.v; notas[h.k]=h.nt; sel=h.k; pinta();
}
function pista(){
  if(listo)return;
  var libres=[],k;
  for(k=0;k<81;k++)if(!P.puzzle[k]&&val[k]!==P.solucion[k])libres.push(k);
  if(!libres.length)return;
  var k2 = (sel>=0&&libres.indexOf(sel)>=0) ? sel : libres[Math.floor(Math.random()*libres.length)];
  arranca();
  hechas.push({k:k2,v:val[k2],nt:notas[k2]});
  val[k2]=P.solucion[k2]; notas[k2]=0; pistas++; sel=k2;
  pinta(); comprueba();
}
function comprueba(){
  var k;
  for(k=0;k<81;k++)if(!(P.puzzle[k]||val[k]))return;
  for(k=0;k<81;k++)if((P.puzzle[k]||val[k])!==P.solucion[k]){
    di("La rejilla está completa pero hay alguna cifra equivocada.","bad");return;
  }
  listo=true; detiene(); anota();
  di("¡Resuelto en "+reloj(transcurrido())+"!","good");
  comparte();
  if(diario&&window.AxAccount&&AxAccount.sudokuResuelto)
    AxAccount.sudokuResuelto({day:dia(),level:nivel,seconds:Math.round(transcurrido()/1000),
                             errors:errores,hints:pistas});
  pinta();
}
function di(t,c){var m=$("sud-msg");m.textContent=t;m.className="msg"+(c?" "+c:"");}
function comparte(){
  var txt="Sudoku de Axioma · "+M.NIVELES[nivel].nom+(diario?" · nº "+dia():"")+"\n"+
          reloj(transcurrido())+(errores?" · "+errores+" error"+(errores>1?"es":""):"")+
          (pistas?" · "+pistas+" pista"+(pistas>1?"s":""):"");
  $("sud-share").textContent=txt;
  $("sud-result").classList.add("on");
}

/* ---------- tablero nuevo ---------- */
function nuevo(esDiario){
  diario=(esDiario!==false);
  var rng = diario ? M.semilla((dia()*9973+nivel*7919)>>>0) : Math.random;
  P=M.genera(nivel,rng);
  val=new Array(81).fill(0); notas=new Array(81).fill(0);
  sel=-1; errores=0; pistas=0; hechas=[]; listo=false; modoNotas=false;
  cero(); di("");
  $("sud-result").classList.remove("on");
  $("sud-ranking").hidden=true;
  $("sud-notes").setAttribute("aria-pressed","false");
  $("sud-notes").innerHTML='Notas <small>apagadas</small>';
  $("sud-brief").innerHTML = diario
    ? ('Sudoku de hoy en nivel <strong>'+M.NIVELES[nivel].nom+'</strong>. El mismo para todo el mundo.')
    : ('Tablero de práctica en nivel <strong>'+M.NIVELES[nivel].nom+'</strong>. No cuenta para el ranking.');
  var rec=diario?registro():null;
  if(rec){                                   /* ya resuelto hoy: se recupera */
    for(var k=0;k<81;k++)if(!P.puzzle[k])val[k]=P.solucion[k];
    ms=rec.ms; errores=rec.err; pistas=rec.pistas; listo=true;
    di("Ya resolviste el sudoku de hoy en este nivel.","good");
    comparte();
  }
  pinta();
}

/* ---------- controles ---------- */
$("sud-notes").onclick=function(){
  modoNotas=!modoNotas;
  this.setAttribute("aria-pressed",modoNotas?"true":"false");
  this.innerHTML='Notas <small>'+(modoNotas?"encendidas":"apagadas")+'</small>';
};
$("sud-erase").onclick=borra;
$("sud-undo").onclick=deshaz;
$("sud-hint").onclick=pista;
$("sud-new").onclick=function(){nuevo(false);};
$("sud-b-share").onclick=function(){
  var t=$("sud-share").textContent+"\n"+location.href;
  if(navigator.share)navigator.share({text:t}).catch(function(){});
  else if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){di("Resultado copiado.","good");});
};
(function(){
  var bs=$("sud-seg").querySelectorAll("[data-lvl]"),i;
  for(i=0;i<bs.length;i++)(function(b){
    b.onclick=function(){
      var l=+b.getAttribute("data-lvl"); if(l===nivel)return;
      nivel=l; try{guarda("nivel",String(l));}catch(e){}
      pintaNivel(); nuevo(true);
      var h=document.getElementById("hdr"); if(h)h.textContent=M.NIVELES[nivel].nom;
    };
  })(bs[i]);
})();
function pintaNivel(){
  var bs=$("sud-seg").querySelectorAll("[data-lvl]"),i;
  for(i=0;i<bs.length;i++)bs[i].setAttribute("aria-checked",(+bs[i].getAttribute("data-lvl")===nivel)?"true":"false");
}
document.addEventListener("keydown",function(e){
  if(document.body.getAttribute("data-game")!=="sudoku")return;
  if(e.key>="1"&&e.key<="9"){pon(+e.key);e.preventDefault();return;}
  if(e.key==="Backspace"||e.key==="Delete"){borra();e.preventDefault();return;}
  if(e.key==="n"||e.key==="N"){$("sud-notes").click();return;}
  var d={ArrowUp:-9,ArrowDown:9,ArrowLeft:-1,ArrowRight:1}[e.key];
  if(d!==undefined){
    if(sel<0)sel=0; else{var t=sel+d;if(t>=0&&t<81&&!(Math.abs(d)===1&&((t/9)|0)!==((sel/9)|0)))sel=t;}
    pinta(); e.preventDefault();
  }
});

try{var l=parseInt(guarda("nivel")||"1",10); if(M.NIVELES[l])nivel=l;}catch(e){}

window.AxSudoku={
  abrir:function(){ pintaNivel(); if(!P)nuevo(true); else pinta(); },
  nivel:function(){return nivel;},
  nombreNivel:function(){return M.NIVELES[nivel].nom;},
  dia:dia,
  pausa:detiene
};
})();
