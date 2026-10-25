/* ===========================================================
   THE FINAL TEST · Puertas de Color · motor
   Puzle de bloques: cada bloque de color se arrastra por el tablero
   hasta la puerta de su color y sale por ella. Inspirado en los
   «block jam», pero pensado para que nadie se frustre: sin vidas ni
   reloj obligatorio, con deshacer y pistas gratis y una curva sin
   picos que se adapta a cada persona.

   Todos los niveles tienen solución por construcción: se fabrican al
   revés, partiendo del tablero vacío y metiendo bloques por sus
   puertas y moviéndolos (cada paso inverso es una jugada válida), de
   modo que la secuencia invertida es una solución. No hace falta
   resolverlos para generarlos, y por eso el servidor puede rehacer el
   reto del día y repetir las jugadas enviadas sin gastar tiempo.

   Mecánicas por mundo: muros, bloques en raíl (solo horizontal o
   vertical), hielo (se mueve cuando ya salieron n bloques), capas (la
   capa de fuera sale por su puerta y queda el bloque de dentro) y
   puertas que alternan de color con cada jugada.

   Una jugada es [bloque, x, y, puerta]: el bloque va a (x,y), a donde
   pueda llegar arrastrándolo, y si puerta ≥ 0 sale por ella desde ahí.
   Lo usan por igual el navegador y el Worker (no toca window ni document).
   =========================================================== */
(function(G){
"use strict";

function semilla(txt){          /* FNV-1a de 32 bits sobre el texto */
  var h=0x811c9dc5, i; txt=String(txt);
  for(i=0;i<txt.length;i++){h^=txt.charCodeAt(i); h=Math.imul(h,0x01000193);}
  return h>>>0;
}
function rng(s){var a=s>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};}
function baraja(arr,r){for(var i=arr.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=arr[i];arr[i]=arr[j];arr[j]=t;}return arr;}
function entre(r,a,b){return a+Math.floor(r()*(b-a+1));}

/* ---------- formas (celdas relativas, esquina arriba a la izquierda) ---------- */
var FORMAS=[
  [[0,0]],
  [[0,0],[1,0]], [[0,0],[0,1]],
  [[0,0],[1,0],[2,0]], [[0,0],[0,1],[0,2]],
  [[0,0],[1,0],[0,1],[1,1]],
  [[0,0],[0,1],[1,1]], [[0,0],[1,0],[0,1]], [[1,0],[0,1],[1,1]], [[0,0],[1,0],[1,1]],
  [[0,0],[0,1],[0,2],[1,2]], [[1,0],[1,1],[1,2],[0,2]], [[0,0],[1,0],[2,0],[0,1]], [[0,0],[1,0],[2,0],[1,1]], [[0,0],[0,1],[0,2],[1,1]]
];
var DIM=FORMAS.map(function(f){var w=0,h=0;f.forEach(function(c){if(c[0]+1>w)w=c[0]+1;if(c[1]+1>h)h=c[1]+1;});return {w:w,h:h};});
var TIER=[[0,1,2],[0,1,2,3,4,5],[0,1,2,3,4,5,6,7,8,9],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14]];

/* ---------- mundos ---------- */
var POR_MUNDO=15;
var MUNDOS=[
  {id:"pradera", nombre:"Pradera",  nuevo:null,     txt:"Lleva cada bloque a la puerta de su color."},
  {id:"bosque",  nombre:"Bosque",   nuevo:"muros",  txt:"Aparecen rocas: nada puede atravesarlas."},
  {id:"rio",     nombre:"Río",      nuevo:"eje",    txt:"Bloques en raíl: las flechas dicen si solo van de lado a lado o de arriba abajo."},
  {id:"glaciar", nombre:"Glaciar",  nuevo:"hielo",  txt:"Bloques de hielo: el número dice cuántos bloques deben salir antes de que se derrita."},
  {id:"cristal", nombre:"Cristal",  nuevo:"capas",  txt:"Bloques con capa: la capa de fuera sale por su puerta y queda el bloque de dentro, de otro color."},
  {id:"arcoiris",nombre:"Arcoíris", nuevo:"alterna",txt:"Puertas que cambian de color con cada jugada: fíjate en el color que tendrá."},
  {id:"cosmos",  nombre:"Cosmos",   nuevo:"todo",   txt:"Todo mezclado, sin final: cada nivel es nuevo."}
];
function mundoDe(nivel){return Math.min(MUNDOS.length,1+Math.floor((nivel-1)/POR_MUNDO));}
function tipoNivel(nivel){                       /* sin picos: respiro cada 5 y desafío anunciado cada 10 */
  if(nivel%10===0)return "desafio";
  if(nivel%5===0)return "respiro";
  return "normal";
}

/* parámetros de un nivel. «ajuste» (−2…+2) viene de cómo le va a cada persona */
function parametros(nivel,ajuste){
  var M=mundoDe(nivel), t=tipoNivel(nivel), dentro=(nivel-1)%POR_MUNDO;
  var n=nivel+Math.round((ajuste||0)*3)+(t==="desafio"?4:t==="respiro"?-4:0);
  if(n<1)n=1;
  var W=Math.min(7,5+Math.floor(n/22)), H=Math.min(9,W+(n>6?1:0)+(n>40?1:0));
  var k=Math.min(6,2+Math.floor((n+2)/7));
  var tier=n<3?0:n<8?1:n<20?2:3;
  var area=W*H;
  var c={nivel:nivel,mundo:M,tipo:t,n:n,W:W,H:H,colores:k,formas:TIER[tier],
    bloques:Math.min(Math.floor(area*0.3),14,3+Math.floor(n/4)),
    relleno:Math.min(0.8,0.45+n*0.007),
    mezcla:n<3?0:n<10?1:2, mezclaFinal:Math.min(3,1+Math.floor(n/15)),
    bloqueo:Math.min(3,n/12),
    muros:0,eje:0,hielo:0,capas:0,alterna:0,esquinas:false};
  var intro=dentro<3?1:dentro<8?2:3;
  if(M>=2){c.muros=Math.min(5,1+Math.floor(dentro/4)+(M>2?1:0));c.esquinas=M>=2;}
  if(M===3)c.eje=Math.min(0.6,0.2+dentro*0.03);
  if(M===4)c.hielo=intro;
  if(M===5)c.capas=intro;
  if(M===6)c.alterna=Math.min(2,intro);
  if(M>=7){var r=rng(semilla("mix:"+nivel));c.eje=r()<0.5?0.3:0;c.hielo=r()<0.5?entre(r,1,2):0;c.capas=r()<0.5?entre(r,1,2):0;c.alterna=r()<0.4?1:0;}
  return c;
}

/* ---------- estado ---------- */
function inicial(nv){
  var n=nv.B.length, st={x:new Int16Array(n),y:new Int16Array(n),c:new Int8Array(n),k:new Int8Array(n),vivo:new Uint8Array(n),mov:0,sal:0};
  nv.B.forEach(function(b,i){st.x[i]=b.x;st.y[i]=b.y;st.c[i]=b.c;st.k[i]=b.k;st.vivo[i]=1;});
  return st;
}
function copia(s){return {x:new Int16Array(s.x),y:new Int16Array(s.y),c:new Int8Array(s.c),k:new Int8Array(s.k),vivo:new Uint8Array(s.vivo),mov:s.mov,sal:s.sal};}
function resuelto(s){for(var i=0;i<s.vivo.length;i++)if(s.vivo[i])return false;return true;}
function quedan(s){var n=0;for(var i=0;i<s.vivo.length;i++)if(s.vivo[i])n+=1+(s.k[i]>=0?1:0);return n;}

/* rejilla de ocupación: −1 muro, 0 libre, b+1 bloque (sin el bloque «sin») */
function ocupa(nv,s,sin){
  var o=new Int16Array(nv.W*nv.H),i,b,f;
  for(i=0;i<o.length;i++)if(nv.m[i])o[i]=-1;
  for(b=0;b<s.vivo.length;b++){if(!s.vivo[b]||b===sin)continue;f=FORMAS[nv.B[b].f];
    for(i=0;i<f.length;i++)o[(s.y[b]+f[i][1])*nv.W+s.x[b]+f[i][0]]=b+1;}
  return o;
}
function cabe(nv,o,fi,x,y){
  var f=FORMAS[fi],d=DIM[fi],i;
  if(x<0||y<0||x+d.w>nv.W||y+d.h>nv.H)return false;
  for(i=0;i<f.length;i++)if(o[(y+f[i][1])*nv.W+x+f[i][0]])return false;
  return true;
}
/* posiciones a las que llega un bloque arrastrándolo (respeta el raíl) */
function alcance(nv,o,fi,x0,y0,eje){
  var W=nv.W, vis=new Uint8Array(W*nv.H), cola=[x0,y0], out=[], q=0, x, y;
  vis[y0*W+x0]=1;
  var dirs=eje===1?[[1,0],[-1,0]]:eje===2?[[0,1],[0,-1]]:[[1,0],[-1,0],[0,1],[0,-1]];
  while(q<cola.length){
    x=cola[q++];y=cola[q++];out.push(x,y);
    for(var i=0;i<dirs.length;i++){var nx=x+dirs[i][0],ny=y+dirs[i][1];
      if(nx<0||ny<0||nx>=W||ny>=nv.H||vis[ny*W+nx])continue;
      if(!cabe(nv,o,fi,nx,ny))continue;
      vis[ny*W+nx]=1;cola.push(nx,ny);}
  }
  return out;
}
function colorPuerta(p,mov){return p.c[mov%p.c.length];}
/* ¿puede salir el bloque (forma fi en x,y) por la puerta p? */
function encaja(nv,o,fi,x,y,p){
  var f=FORMAS[fi],d=DIM[fi],W=nv.W,H=nv.H,i,j,cx,cy;
  if(p.s==="N"){if(y!==0||x<p.a||x+d.w>p.a+p.l)return false;}
  else if(p.s==="S"){if(y+d.h!==H||x<p.a||x+d.w>p.a+p.l)return false;}
  else if(p.s==="O"){if(x!==0||y<p.a||y+d.h>p.a+p.l)return false;}
  else {if(x+d.w!==W||y<p.a||y+d.h>p.a+p.l)return false;}
  for(i=0;i<f.length;i++){cx=x+f[i][0];cy=y+f[i][1];          /* camino libre hasta el borde (formas en L) */
    if(p.s==="N"){for(j=0;j<cy;j++)if(o[j*W+cx])return false;}
    else if(p.s==="S"){for(j=cy+1;j<H;j++)if(o[j*W+cx])return false;}
    else if(p.s==="O"){for(j=0;j<cx;j++)if(o[cy*W+j])return false;}
    else {for(j=cx+1;j<W;j++)if(o[cy*W+j])return false;}
  }
  return true;
}
function movible(nv,s,b){return s.vivo[b]&&s.sal>=(nv.B[b].h||0);}

/* aplica una jugada; devuelve el estado nuevo o null si no vale */
function aplica(nv,s,m){
  if(!m||m.length<4)return null;
  var b=m[0]|0,x=m[1]|0,y=m[2]|0,pi=m[3]|0;
  if(b<0||b>=s.vivo.length||!movible(nv,s,b))return null;
  var B=nv.B[b], o=ocupa(nv,s,b);
  if(!cabe(nv,o,B.f,x,y))return null;
  if(x!==s.x[b]||y!==s.y[b]){
    var al=alcance(nv,o,B.f,s.x[b],s.y[b],B.e||0),ok=false;
    for(var i=0;i<al.length;i+=2)if(al[i]===x&&al[i+1]===y){ok=true;break;}
    if(!ok)return null;
  }else if(pi<0)return null;
  var n=copia(s);
  n.x[b]=x;n.y[b]=y;
  if(pi>=0){
    var p=nv.P[pi]; if(!p||colorPuerta(p,s.mov)!==s.c[b]||!encaja(nv,o,B.f,x,y,p))return null;
    if(n.k[b]>=0){n.c[b]=n.k[b];n.k[b]=-1;}
    else {n.vivo[b]=0;n.sal++;}
  }
  n.mov++;
  return n;
}
/* repite una lista de jugadas desde el principio: {ok, estado, jugadas} */
function repite(nv,jugadas){
  var s=inicial(nv),i;
  if(!Array.isArray(jugadas)||jugadas.length>2000)return {ok:false,estado:s,jugadas:0};
  for(i=0;i<jugadas.length;i++){var n=aplica(nv,s,jugadas[i]);if(!n)return {ok:false,estado:s,jugadas:i,error:i};s=n;}
  return {ok:resuelto(s),estado:s,jugadas:jugadas.length};
}

/* salidas posibles de un bloque desde las posiciones que alcanza */
function salidas(nv,s,b,o,al){
  var out=[],B=nv.B[b],i,pi;
  for(pi=0;pi<nv.P.length;pi++){var p=nv.P[pi];if(colorPuerta(p,s.mov)!==s.c[b])continue;
    for(i=0;i<al.length;i+=2)if(encaja(nv,o,B.f,al[i],al[i+1],p)){out.push([b,al[i],al[i+1],pi]);break;}}
  return out;
}
function sucesores(nv,s,alterna){
  var out=[],b,i;
  var o=ocupa(nv,s,-1),W=nv.W;
  for(b=0;b<s.vivo.length;b++){
    if(!movible(nv,s,b))continue;
    var B=nv.B[b],f=FORMAS[B.f];
    for(i=0;i<f.length;i++)o[(s.y[b]+f[i][1])*W+s.x[b]+f[i][0]]=0;      /* se quita el bloque un momento */
    var al=alcance(nv,o,B.f,s.x[b],s.y[b],B.e||0),sal=salidas(nv,s,b,o,al);
    for(i=0;i<f.length;i++)o[(s.y[b]+f[i][1])*W+s.x[b]+f[i][0]]=b+1;
    if(sal.length)return [sal[0]];       /* salir (o soltar la capa) casi nunca estorba: se hace ya y no se ramifica */
    for(i=2;i<al.length;i+=2)out.push([b,al[i],al[i+1],-1]);
  }
  return out;
}
function siguiente(s,m){
  var n=copia(s),b=m[0];
  n.x[b]=m[1];n.y[b]=m[2];
  if(m[3]>=0){if(n.k[b]>=0){n.c[b]=n.k[b];n.k[b]=-1;}else{n.vivo[b]=0;n.sal++;}}
  n.mov++;
  return n;
}
function clave(s,alterna){
  var t="",b;
  for(b=0;b<s.vivo.length;b++)t+=s.vivo[b]?String.fromCharCode(48+s.x[b],48+s.y[b],60+s.c[b]):"-";
  return alterna?t+(s.mov&1):t;
}
function hayAlterna(nv){for(var i=0;i<nv.P.length;i++)if(nv.P[i].c.length>1)return true;return false;}

/* A* con peso: la solución (lista de jugadas) o null si se acaba el presupuesto de nodos */
function resuelve(nv,s0,tope,peso){
  tope=tope||20000; peso=peso||1;
  var alterna=hayAlterna(nv), visto={}, heap=[], nodos=0;
  function push(n){heap.push(n);var i=heap.length-1;while(i>0){var p=(i-1)>>1;if(heap[p].f<=n.f)break;heap[i]=heap[p];i=p;}heap[i]=n;}
  function pop(){var top=heap[0],last=heap.pop();if(heap.length){var i=0,L=heap.length;for(;;){var l=2*i+1,r=l+1,m=i;
    if(l<L&&heap[l].f<(m===i?last.f:heap[m].f))m=l; if(r<L&&heap[r].f<(m===i?last.f:heap[m].f))m=r;
    if(m===i)break; heap[i]=heap[m]; i=m;} heap[i]=last;} return top;}
  if(resuelto(s0))return [];
  push({s:s0,g:0,f:quedan(s0)*peso,p:null,m:null});
  visto[clave(s0,alterna)]=0;
  while(heap.length){
    var n=pop(); if(++nodos>tope)return null;
    var su=sucesores(nv,n.s,alterna);
    for(var i=0;i<su.length;i++){
      var ns=siguiente(n.s,su[i]);
      var nn={s:ns,g:n.g+1,p:n,m:su[i]};
      if(resuelto(ns)){var sol=[];for(var q=nn;q.p;q=q.p)sol.unshift(q.m);return sol;}
      var k=clave(ns,alterna); if(visto[k]!==undefined&&visto[k]<=nn.g)continue;
      visto[k]=nn.g; nn.f=nn.g+quedan(ns)*peso; push(nn);
    }
  }
  return null;
}
/* la mejor jugada siguiente (para la pista): primero exacta, si no, más rápida */
function pista(nv,s){
  var sol=resuelve(nv,s,6000,1)||resuelve(nv,s,15000,2)||resuelve(nv,s,30000,4);
  return sol&&sol.length?sol[0]:null;
}

/* ---------- generador (al revés: siempre tiene solución) ---------- */
function posicionesPuerta(nv,o,fi,p){
  var d=DIM[fi],out=[],i;
  if(p.s==="N"||p.s==="S"){var y=p.s==="N"?0:nv.H-d.h;for(i=p.a;i+d.w<=p.a+p.l;i++)out.push(i,y);}
  else {var x=p.s==="O"?0:nv.W-d.w;for(i=p.a;i+d.h<=p.a+p.l;i++)out.push(x,i);}
  var ok=[];
  for(i=0;i<out.length;i+=2)if(cabe(nv,o,fi,out[i],out[i+1])&&encaja(nv,o,fi,out[i],out[i+1],p))ok.push(out[i],out[i+1]);
  return ok;
}
function cabePuerta(fi,p){var d=DIM[fi];return (p.s==="N"||p.s==="S")?d.w<=p.l:d.h<=p.l;}
/* celdas delante de cada puerta (las que conviene tapar para que haya que pensar) */
function zonas(nv){
  var z=[],pi,i,j;
  for(pi=0;pi<nv.P.length;pi++){var p=nv.P[pi],c=new Uint8Array(nv.W*nv.H);
    for(i=p.a;i<p.a+p.l;i++)for(j=0;j<2;j++){
      if(p.s==="N")c[j*nv.W+i]=1; else if(p.s==="S")c[(nv.H-1-j)*nv.W+i]=1;
      else if(p.s==="O")c[i*nv.W+j]=1; else c[i*nv.W+nv.W-1-j]=1;}
    z.push(c);}
  return z;
}
function distPuerta(nv,p,fi,x,y){
  var d=DIM[fi],cx=x+d.w/2,cy=y+d.h/2,px,py;
  if(p.s==="N"){px=p.a+p.l/2;py=0;}else if(p.s==="S"){px=p.a+p.l/2;py=nv.H;}
  else if(p.s==="O"){px=0;py=p.a+p.l/2;}else {px=nv.W;py=p.a+p.l/2;}
  return Math.abs(cx-px)+Math.abs(cy-py);
}

function construye(cfg,r){
  var W=cfg.W,H=cfg.H,nv={W:W,H:H,m:new Array(W*H).fill(0),P:[],B:[],sol:[]},i,j;
  /* muros: dentro del tablero, y alguna esquina recortada */
  if(cfg.esquinas&&r()<0.5){var es=[0,W-1,(H-1)*W,H*W-1];baraja(es,r);for(i=0;i<entre(r,1,2);i++)nv.m[es[i]]=1;}
  for(i=0;i<cfg.muros;i++){for(j=0;j<20;j++){var mx=entre(r,1,W-2),my=entre(r,1,H-2);if(!nv.m[my*W+mx]){nv.m[my*W+mx]=1;break;}}}
  /* puertas: una por color, sin pisarse */
  var colores=baraja([0,1,2,3,4,5,6,7],r).slice(0,cfg.colores), lados=["N","S","O","E"];
  function bordeLibre(s,a,l){for(var t=a;t<a+l;t++){var c=s==="N"?t:s==="S"?(H-1)*W+t:s==="O"?t*W:t*W+W-1;if(nv.m[c])return false;}return true;}
  for(i=0;i<colores.length;i++){
    var hecha=false;
    for(j=0;j<60&&!hecha;j++){
      var s=lados[(i+j+Math.floor(r()*4))%4],len=(s==="N"||s==="S")?W:H;
      var l=Math.min(len-1,j<30?entre(r,1,3):entre(r,1,2)), a=entre(r,0,len-l);
      if(!bordeLibre(s,a,l))continue;
      var choca=nv.P.some(function(p){return p.s===s&&a<p.a+p.l+1&&p.a<a+l+1;});
      if(choca)continue;
      nv.P.push({s:s,a:a,l:l,c:[colores[i]]});hecha=true;
    }
  }
  if(nv.P.length<2)return null;
  var Z=zonas(nv);
  /* bloques: entran por su puerta y se mueven (al revés de jugar) */
  var st={x:[],y:[],c:[],k:[],vivo:[],mov:0,sal:0}, ops=[], libres=0, ocupadas=0, cuenta={};
  for(i=0;i<W*H;i++)if(!nv.m[i])libres++;
  function S(){return {x:Int16Array.from(st.x),y:Int16Array.from(st.y),c:Int8Array.from(st.c),k:Int8Array.from(st.k),vivo:Uint8Array.from(st.vivo),mov:0,sal:0};}
  function mezcla(b){
    var s=S(),o=ocupa(nv,s,b),B=nv.B[b],al=alcance(nv,o,B.f,st.x[b],st.y[b],B.e||0);
    if(al.length<=2)return;
    var p=nv.P.filter(function(q){return q.c[0]===st.c[b];})[0], mejor=-1e9, bx=0, by=0;
    for(var t=2;t<al.length;t+=2){
      var x=al[t],y=al[t+1],tapa=0,f=FORMAS[B.f];
      for(var u=0;u<f.length;u++){var cel=(y+f[u][1])*W+x+f[u][0];for(var zi=0;zi<Z.length;zi++)if(Z[zi][cel]&&nv.P[zi].c[0]!==st.c[b])tapa++;}
      var v=(p?distPuerta(nv,p,B.f,x,y):0)*0.6+tapa*cfg.bloqueo+r()*2.5;
      if(v>mejor){mejor=v;bx=x;by=y;}
    }
    ops.push({t:"m",b:b,fx:st.x[b],fy:st.y[b]}); st.x[b]=bx; st.y[b]=by;
  }
  for(var it=0;it<300&&nv.B.length<cfg.bloques&&ocupadas<libres*cfg.relleno;it++){
    /* la puerta del color con menos bloques */
    var orden=baraja(nv.P.map(function(p,k){return k;}),r).sort(function(a,b){return (cuenta[a]||0)-(cuenta[b]||0);}), puesto=false;
    for(var oi=0;oi<orden.length&&!puesto;oi++){
      var pi=orden[oi],p=nv.P[pi],fs=baraja(cfg.formas.filter(function(f){return cabePuerta(f,p);}),r),o=ocupa(nv,S(),-1);
      for(var fi=0;fi<fs.length&&!puesto;fi++){
        var pos=posicionesPuerta(nv,o,fs[fi],p); if(!pos.length)continue;
        var q=2*Math.floor(r()*pos.length/2), b=nv.B.length;
        /* en raíl: va y viene en la dirección de su puerta (y la construcción ya lo respeta) */
        var eje=cfg.eje>0&&r()<cfg.eje?((p.s==="N"||p.s==="S")?2:1):0;
        nv.B.push({f:fs[fi],c:p.c[0],x:0,y:0,k:-1,e:eje,h:0});
        st.x.push(pos[q]);st.y.push(pos[q+1]);st.c.push(p.c[0]);st.k.push(-1);st.vivo.push(1);
        ops.push({t:"i",b:b,x:pos[q],y:pos[q+1],d:pi}); cuenta[pi]=(cuenta[pi]||0)+1; ocupadas+=FORMAS[fs[fi]].length; puesto=true;
        /* capa: el bloque se viste con el color de otra puerta que alcance */
        if(cfg.capas>0&&nv.B.length>1&&r()<0.5){
          var s2=S(),o2=ocupa(nv,s2,b),al2=alcance(nv,o2,fs[fi],st.x[b],st.y[b],nv.B[b].e||0);
          for(var pj=0;pj<nv.P.length;pj++){var p2=nv.P[pj];if(p2.c[0]===st.c[b]||!cabePuerta(fs[fi],p2))continue;
            for(var t2=0;t2<al2.length;t2+=2)if(encaja(nv,o2,fs[fi],al2[t2],al2[t2+1],p2)){
              if(al2[t2]!==st.x[b]||al2[t2+1]!==st.y[b]){ops.push({t:"m",b:b,fx:st.x[b],fy:st.y[b]});st.x[b]=al2[t2];st.y[b]=al2[t2+1];}
              ops.push({t:"p",b:b,x:st.x[b],y:st.y[b],d:pj}); st.k[b]=st.c[b]; st.c[b]=p2.c[0]; cfg=Object.assign({},cfg,{capas:cfg.capas-1}); break;}
            if(st.k[b]>=0)break;}
        }
      }
    }
    for(i=0;i<cfg.mezcla&&nv.B.length;i++)mezcla(Math.floor(r()*nv.B.length));
    if(!puesto&&it>40)break;
  }
  for(j=0;j<cfg.mezclaFinal;j++)for(i=0;i<nv.B.length;i++)mezcla(i);
  if(nv.B.length<2)return null;
  for(i=0;i<nv.B.length;i++){nv.B[i].x=st.x[i];nv.B[i].y=st.y[i];nv.B[i].c=st.c[i];nv.B[i].k=st.k[i];}
  /* la solución: las operaciones al revés, juntando jugadas seguidas del mismo bloque */
  var sol=[];
  for(i=ops.length-1;i>=0;i--){var op=ops[i],m=op.t==="m"?[op.b,op.fx,op.fy,-1]:[op.b,op.x,op.y,op.d];
    var u=sol[sol.length-1]; if(u&&u[0]===m[0]&&u[3]<0)sol[sol.length-1]=m; else sol.push(m);}
  /* fuera las que no mueven nada */
  var s0=inicial(nv),lim=[];
  for(i=0;i<sol.length;i++){if(sol[i][3]<0&&s0.x[sol[i][0]]===sol[i][1]&&s0.y[sol[i][0]]===sol[i][2])continue;
    var ns=aplica(nv,s0,sol[i]); if(!ns)return null; lim.push(sol[i]); s0=ns;}
  if(!resuelto(s0))return null;
  nv.sol=lim;
  mecanicas(nv,cfg,r);
  return nv;
}

/* hielo, raíles y puertas que alternan, puestos sobre la solución ya conocida */
function mecanicas(nv,cfg,r){
  var i,b;
  /* vale si la solución conocida sigue sirviendo o, si no, si el buscador encuentra otra */
  var intentos=cfg.sinSolver?0:4;
  function vale(soloRepite){
    if(repite(nv,nv.sol).ok)return true;
    if(soloRepite||intentos<=0)return false;
    intentos--;
    var otra=resuelve(nv,inicial(nv),600,1); if(otra){nv.sol=otra;return true;}
    return false;
  }
  var copiaSol=nv.sol.slice(),ejes=nv.B.map(function(x){return x.e;});
  if(cfg.hielo>0){
    var cand=baraja(nv.B.map(function(x,k){return k;}),r),puestos=0;
    for(i=0;i<cand.length&&puestos<cfg.hielo;i++){b=cand[i];
      nv.B[b].h=Math.min(nv.B.length-1,entre(r,1,puestos?3:2));
      if(vale())puestos++; else nv.B[b].h=0;}
  }
  if(cfg.eje>0){
    var orden=baraja(nv.B.map(function(x,k){return k;}),r);
    for(i=0;i<orden.length;i++){b=orden[i];if(nv.B[b].e||r()>cfg.eje/2||nv.B[b].h)continue;
      var e0=r()<0.5?1:2; nv.B[b].e=e0; if(vale(true))continue;
      nv.B[b].e=3-e0; if(!vale(true))nv.B[b].e=0;}
  }
  if(cfg.alterna>0){
    var hechas=0,pis=baraja(nv.P.map(function(x,k){return k;}),r);
    for(i=0;i<pis.length&&hechas<cfg.alterna;i++){
      var pi=pis[i],p=nv.P[pi],otros=nv.P.map(function(q){return q.c[0];}).filter(function(c){return c!==p.c[0];});
      if(!otros.length)continue;
      var otro=otros[Math.floor(r()*otros.length)], antes=p.c;
      p.c=r()<0.5?[antes[0],otro]:[otro,antes[0]];
      if(vale())hechas++; else p.c=antes;
    }
  }
  if(!repite(nv,nv.sol).ok){nv.B.forEach(function(x,k){x.e=ejes[k];x.h=0;});nv.P.forEach(function(p){p.c=[p.c[0]];});nv.sol=copiaSol;}
}

/* cuántos bloques pueden salir ya al empezar (cuantos menos, más hay que pensar) */
function inmediatas(nv){
  var s=inicial(nv),n=0;
  for(var b=0;b<nv.B.length;b++){if(!movible(nv,s,b))continue;var o=ocupa(nv,s,b),B=nv.B[b];
    if(salidas(nv,s,b,o,alcance(nv,o,B.f,s.x[b],s.y[b],B.e||0)).length)n++;}
  return n;
}

/* un nivel: entre unos cuantos candidatos, el que mejor se ajusta a la dificultad buscada */
function metas(nv){var t=0;nv.B.forEach(function(b){t+=1+(b.k>=0?1:0);});return t;}
function genera(semillaTxt,cfg,candidatos,conSolver){
  var r=rng(semilla(semillaTxt)),mejor=null,mv=1e9,i;
  var objInm=Math.max(0.1,0.8-cfg.n*0.012), objExtra=cfg.n<6?0:Math.min(6,(cfg.n-4)/9);
  for(i=0;i<(candidatos||5);i++){
    var nv=construye(cfg,r); if(!nv)continue;
    var N=nv.B.length, inm=inmediatas(nv)/N;
    /* las jugadas de más que hacen falta de verdad (A* acotado); si no llega, la cota de la construcción */
    var opt=conSolver===false?null:resuelve(nv,inicial(nv),700,1);
    if(opt&&opt.length<nv.sol.length)nv.sol=opt;
    var extra=nv.sol.length-metas(nv);
    var v=Math.abs(inm-objInm)*4+Math.abs(extra-objExtra)*(opt?1:0.3)+Math.abs(N-cfg.bloques)*0.3+(opt?0:1.5);
    if(v<mv){mv=v;mejor=nv;}
  }
  if(!mejor)return null;
  mejor.semilla=semillaTxt; mejor.mundo=cfg.mundo; mejor.tipo=cfg.tipo; mejor.nivel=cfg.nivel;
  mejor.par=mejor.sol.length;
  return mejor;
}
function nivel(n,ajuste){
  var aj=Math.max(-2,Math.min(2,Math.round(ajuste||0)));
  var cfg=parametros(n,aj), nv=null, i;
  for(i=0;!nv&&i<5;i++)nv=genera("bloques:"+n+":"+aj+(i?":"+i:""),cfg);
  return nv;
}
/* el reto del día: igual para todo el mundo, dificultad media-alta y todas las mecánicas */
function delDia(dia){
  var r=rng(semilla("bloques-dia:"+dia)), base=20+Math.floor(r()*50);
  var cfg=parametros(base,0);
  cfg.mundo=7; cfg.tipo="dia"; cfg.eje=r()<0.5?0.3:0; cfg.hielo=r()<0.4?1:0; cfg.capas=r()<0.4?1:0; cfg.alterna=r()<0.3?1:0;
  cfg.muros=entre(r,1,4); cfg.esquinas=true; cfg.sinSolver=true;
  var nv=null,i;
  for(i=0;!nv&&i<5;i++)nv=genera("bloques-dia:"+dia+(i?":"+i:""),cfg,4,false);
  if(nv){nv.dia=dia;nv.nivel=0;}
  return nv;
}
/* estrellas: 3 con el par o menos, 2 cerca, 1 al terminar */
function estrellas(movs,par,martillo){
  var e=movs<=par?3:movs<=Math.ceil(par*1.35)+1?2:1;
  return martillo?Math.min(2,e):e;
}
/* el reto del día cuenta si las jugadas lo resuelven; el tiempo mínimo creíble */
function evalua(nv,jugadas,segundos){
  var r=repite(nv,jugadas);
  if(!r.ok)return null;
  if(!(segundos>=Math.max(3,jugadas.length*0.4)))return null;
  return {movs:jugadas.length,segundos:Math.round(segundos)};
}

G.AxBloques={FORMAS:FORMAS,DIM:DIM,MUNDOS:MUNDOS,POR_MUNDO:POR_MUNDO,semilla:semilla,rng:rng,
  mundoDe:mundoDe,tipoNivel:tipoNivel,parametros:parametros,nivel:nivel,delDia:delDia,genera:genera,
  inicial:inicial,copia:copia,resuelto:resuelto,quedan:quedan,ocupa:ocupa,cabe:cabe,alcance:alcance,
  encaja:encaja,colorPuerta:colorPuerta,movible:movible,aplica:aplica,repite:repite,salidas:salidas,
  resuelve:resuelve,pista:pista,inmediatas:inmediatas,estrellas:estrellas,evalua:evalua};
})(typeof globalThis!=="undefined"?globalThis:this);
