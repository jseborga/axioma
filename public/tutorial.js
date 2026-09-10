/* ===========================================================
   AXIOMA · tutorial guiado
   Se abre solo la primera vez y desde el botón "Cómo se juega".
   Los tableros de ejemplo se dibujan en SVG, así que se ven
   nítidos en cualquier pantalla y siguen el tema claro u oscuro.
   =========================================================== */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var host=$("tut"); if(!host)return;

/* ---------- dibujo de tableros de ejemplo ----------
   . vacía   # llena   x descartada
   o vacía resaltada   O llena resaltada
   0-9 pista                                          */
function grid(rows,cell){
  cell=cell||28;
  var gap=4, n=rows[0].length, m=rows.length;
  var w=n*cell+(n-1)*gap, h=m*cell+(m-1)*gap, out=[],r,c;
  out.push('<svg class="mini" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'" aria-hidden="true">');
  for(r=0;r<m;r++)for(c=0;c<n;c++){
    var ch=rows[r].charAt(c), x=c*(cell+gap), y=r*(cell+gap);
    var fill="var(--inset-2)", stroke="none", sw=0, txt="", tcol="var(--ink)";
    if(ch==="#"){fill="var(--fill)";}
    else if(ch==="O"){fill="var(--fill)";stroke="var(--accent)";sw=2;}
    else if(ch==="o"){fill="var(--accent-tint)";stroke="var(--accent)";sw=1.5;}
    else if(ch==="x"){fill="transparent";stroke="var(--inset-2)";sw=1.5;}
    else if(ch>="0"&&ch<="9"){fill="var(--card)";stroke="var(--hair)";sw=1.5;txt=ch;}
    out.push('<rect x="'+x+'" y="'+y+'" width="'+cell+'" height="'+cell+'" rx="'+(cell*0.26)+
             '" fill="'+fill+'"'+(sw?' stroke="'+stroke+'" stroke-width="'+sw+'"':'')+'/>');
    if(txt)out.push('<text x="'+(x+cell/2)+'" y="'+(y+cell/2)+'" text-anchor="middle" dominant-baseline="central" '+
                    'font-size="'+(cell*0.5)+'" font-weight="700" fill="'+tcol+'" font-family="-apple-system,system-ui,sans-serif">'+txt+'</text>');
    if(ch==="x"){var p=cell*0.3,cx=x+cell/2,cy=y+cell/2;
      out.push('<path d="M'+(cx-p/1.4)+' '+(cy-p/1.4)+'L'+(cx+p/1.4)+' '+(cy+p/1.4)+'M'+(cx+p/1.4)+' '+(cy-p/1.4)+'L'+(cx-p/1.4)+' '+(cy+p/1.4)+
                '" stroke="var(--ink-3)" stroke-width="2" stroke-linecap="round"/>');}
  }
  out.push('</svg>');
  return out.join("");
}
function trio(items){
  return '<div class="tut-trio">'+items.map(function(it){
    return '<figure>'+grid(it[0],it[2]||22)+'<figcaption><b>'+it[1][0]+'</b>'+it[1][1]+'</figcaption></figure>';
  }).join("")+'</div>';
}

/* ---------- guía sencilla: para quien nunca ha jugado ---------- */
var SIMPLE=[
{
  t:"De qué va el juego",
  d:"El tablero esconde unas casillas llenas y tienes que encontrarlas todas. La vuelta de tuerca es que tampoco sabes con qué reglas se cuenta: eso también hay que averiguarlo.",
  a:function(){return '<div class="tut-art">'+grid([".1..#","..#..","2...1","..#..","#..2."],34)+'</div>'+
      '<p class="tut-note">Un tablero resuelto. Al empezar solo verás los números.</p>';}
},
{
  t:"Qué significa cada número",
  d:"Cada número es una pista y cuenta las casillas llenas que tiene a su alrededor. Un 2 avisa de que hay dos llenas cerca. Un 0 avisa de que no hay ninguna, así que todo su alrededor está vacío.",
  a:function(){return trio([
      [[".#.",".2#","..."],["Un 2","dos llenas cerca"],26],
      [["...",".0.","..."],["Un 0","ninguna cerca"],26],
      [[".x.","x0x",".x."],["Por eso","se descarta todo"],26]]);}
},
{
  t:"Cómo se cruzan las reglas",
  d:"«Alrededor» no significa lo mismo en todos los tableros. Hay tres maneras de mirar y tres maneras de agruparse, y se cruzan como una tabla. De las nueve casillas de esa tabla, solo una tiene solución: esa es la que buscas.",
  a:function(){
    var alc=["Orto","Rey","Rayo"], frm=["Cadena","Aislado","Parejas"], buena=[0,1];
    var h='<div class="tut-matrix"><div></div>';
    frm.forEach(function(f){h+='<div class="mx-hd">'+f+'</div>';});
    alc.forEach(function(a,r){
      h+='<div class="mx-rw">'+a+'</div>';
      frm.forEach(function(f,c){
        var ok=(r===buena[0]&&c===buena[1]);
        h+='<div class="mx-c'+(ok?' si':'')+'">'+(ok?'✓':'✕')+'</div>';
      });
    });
    return h+'</div><p class="tut-note">Ocho combinaciones no cuadran. Una sí.</p>';}
},
{
  t:"Para empezar",
  d:"Elige una regla de cada eje, toca las casillas y fíjate en los colores. Verde quiere decir que esa pista ya está cumplida; rojo, que con esas reglas es imposible. Si se te pone todo rojo, cambia de combinación antes de borrar nada.",
  a:function(){return trio([
      [["#"],["Un toque","llena"],40],
      [["x"],["Dos toques","descartada"],40],
      [["."],["Tres toques","en blanco"],40]])+
      '<p class="tut-note">Cuando estén todas puestas, pulsa <b>Comprobar</b>. '+
      '<a href="#" data-tut>¿Quieres el detalle?</a></p>';}
}];

/* ---------- dibujo de sudokus de ejemplo ----------
   81 caracteres; "." es casilla vacía.
   marca resalta una fila, una columna o una caja de 3x3.   */
function sgrid(vals,cell,marca){
  cell=cell||14;
  var w=cell*9, out=[], r,c;
  out.push('<svg class="mini" viewBox="0 0 '+(w+2)+' '+(w+2)+'" width="'+(w+2)+'" height="'+(w+2)+'" '+
           'preserveAspectRatio="xMidYMid meet" aria-hidden="true">');
  out.push('<rect x="1" y="1" width="'+w+'" height="'+w+'" rx="4" fill="var(--card)"/>');
  for(r=0;r<9;r++)for(c=0;c<9;c++){
    var ch=vals.charAt(r*9+c), x=1+c*cell, y=1+r*cell;
    var caja=((r/3)|0)*3+((c/3)|0);
    if(marca&&(marca.fila===r||marca.col===c||marca.caja===caja))
      out.push('<rect x="'+x+'" y="'+y+'" width="'+cell+'" height="'+cell+'" fill="var(--accent-tint)"/>');
    if(ch>="1"&&ch<="9")
      out.push('<text x="'+(x+cell/2)+'" y="'+(y+cell/2)+'" text-anchor="middle" dominant-baseline="central" '+
               'font-size="'+(cell*0.62)+'" font-weight="700" fill="var(--ink)" '+
               'font-family="-apple-system,system-ui,sans-serif">'+ch+'</text>');
  }
  for(r=1;r<9;r++){
    var q=1+r*cell, gruesa=(r%3===0), sw=gruesa?1.4:0.6;
    out.push('<line x1="'+q+'" y1="1" x2="'+q+'" y2="'+(w+1)+'" stroke="var(--hair)" stroke-width="'+sw+'"/>');
    out.push('<line x1="1" y1="'+q+'" x2="'+(w+1)+'" y2="'+q+'" stroke="var(--hair)" stroke-width="'+sw+'"/>');
  }
  out.push('<rect x="1" y="1" width="'+w+'" height="'+w+'" rx="4" fill="none" stroke="var(--ink-3)" stroke-width="1.4"/>');
  out.push('</svg>');
  return out.join("");
}
/* una sola casilla con sus candidatos apuntados a lápiz */
function celdaNotas(cands,cell){
  cell=cell||40;
  var out=['<svg class="mini" viewBox="0 0 '+cell+' '+cell+'" width="'+cell+'" height="'+cell+'" aria-hidden="true">'];
  out.push('<rect x="0.5" y="0.5" width="'+(cell-1)+'" height="'+(cell-1)+'" rx="'+(cell*0.2)+
           '" fill="var(--card)" stroke="var(--hair)" stroke-width="1.2"/>');
  for(var j=0;j<9;j++){
    if(cands.indexOf(String(j+1))<0)continue;
    var x=(cell/6)*(2*(j%3)+1), y=(cell/6)*(2*((j/3)|0)+1);
    out.push('<text x="'+x+'" y="'+y+'" text-anchor="middle" dominant-baseline="central" font-size="'+(cell*0.24)+
             '" font-weight="600" fill="var(--ink-3)" font-family="-apple-system,system-ui,sans-serif">'+(j+1)+'</text>');
  }
  return out.join("")+'</svg>';
}

/* ---------- guía del sudoku ---------- */
var LLENO=
  "534678912"+"672195348"+"198342567"+
  "859761423"+"426853791"+"713924856"+
  "961537284"+"287419635"+"345286179";
var SUDOKU=[
{
  t:"De qué va el sudoku",
  d:"Rellena las 81 casillas con cifras del 1 al 9. La única condición es que ninguna cifra se repita en la misma fila, ni en la misma columna, ni dentro de la misma caja de 3x3.",
  a:function(){return '<div class="tut-trio">'+
      '<figure>'+sgrid(LLENO,14,{fila:3})+'<figcaption><b>Fila</b>del 1 al 9</figcaption></figure>'+
      '<figure>'+sgrid(LLENO,14,{col:4})+'<figcaption><b>Columna</b>del 1 al 9</figcaption></figure>'+
      '<figure>'+sgrid(LLENO,14,{caja:4})+'<figcaption><b>Caja de 3x3</b>del 1 al 9</figcaption></figure>'+
      '</div><p class="tut-note">Un tablero terminado: las tres condiciones se cumplen a la vez.</p>';}
},
{
  t:"Cómo se juega aquí",
  d:"Toca una casilla vacía y elige la cifra en el teclado de abajo. Solo entra la cifra correcta: como el tablero tiene una sola solución, cualquier otra es un fallo seguro, se rechaza en rojo y suma 30 segundos al cronómetro. El teclado lleva la cuenta de cuántas quedan de cada cifra.",
  a:function(){return trio([
      [["5.3","o..","..7"],["Toca","una casilla vacía"],26],
      [["5.3","4..","..7"],["Pulsa la cifra","y queda puesta"],26],
      [["5.3","...","..7"],["Un fallo","no entra: +30 s"],26]]);}
},
{
  t:"Apuntar candidatos",
  d:"Cuando no estés seguro, activa Notas y las cifras que pulses se apuntan pequeñas, como a lápiz. Sirven para ir descartando sin comprometerte. Al escribir la cifra definitiva, las notas de esa casilla desaparecen solas.",
  a:function(){return '<div class="tut-trio">'+
      '<figure>'+celdaNotas("249",46)+'<figcaption><b>Con notas</b>tres candidatos</figcaption></figure>'+
      '<figure>'+grid(["4"],46)+'<figcaption><b>Decidido</b>una sola cifra</figcaption></figure>'+
      '</div><p class="tut-note">Pista rellena una casilla por ti, pero cuesta un minuto y solo hay tres por tablero.</p>';}
},
{
  t:"Niveles y ranking por tiempo",
  d:"Hay cuatro niveles y cada uno tiene su propio sudoku del día, igual para todo el mundo. El cronómetro corre desde tu primera jugada y las penalizaciones por fallos y pistas ya van dentro, así que el ranking por tiempo es justo. Al terminar puedes entrar con Google para aparecer en el de ese día y ese nivel. Otro tablero te da uno de práctica que no cuenta.",
  a:function(){return '<div class="tut-niv">'+
      '<div><b>Fácil</b><span>42 pistas</span></div>'+
      '<div><b>Medio</b><span>34 pistas</span></div>'+
      '<div><b>Difícil</b><span>28 pistas</span></div>'+
      '<div><b>Experto</b><span>24 pistas</span></div>'+
      '</div><p class="tut-note">Nunca hace falta adivinar: todos los tableros tienen una sola solución.</p>';}
}];

/* ---------- guía detallada ---------- */
var TECNICA=[
{
  t:"El objetivo del juego",
  d:"Encuentra las celdas llenas que esconde el tablero y descubre, a la vez, qué par de reglas lo gobierna. De todas las combinaciones posibles solo una tiene solución, y esa es el axioma. Nunca hace falta adivinar: siempre hay una única respuesta.",
  a:function(){return '<div class="tut-art">'+grid([".1..#","..#..","2...1","..#..","#..2."],34)+'</div>'+
      '<p class="tut-note">Así se ve un tablero ya resuelto. Al empezar solo verás los números.</p>';}
},
{
  t:"Toca una casilla para marcarla",
  d:"Cada toque cambia su estado. Marca en oscuro lo que creas lleno y pon la equis en lo que hayas descartado, así no pierdes el hilo.",
  a:function(){return trio([
      [["#"],["Un toque","llena"],44],
      [["x"],["Dos toques","descartada"],44],
      [["."],["Tres toques","en blanco"],44]])+
      '<p class="tut-note">Las casillas con número son pistas y no se pueden marcar. Al tocarlas se resalta su alcance.</p>';}
},
{
  t:"Cada pista cuenta lo que tiene a su alcance",
  d:"El número dice cuántas celdas llenas hay dentro de su alcance, marcado en azul. Pero el alcance cambia según la regla, y esa es la gracia del juego.",
  a:function(){return trio([
      [[".....","..o..",".o2o.","..o..","....."],["Orto","los 4 lados"],17],
      [[".....",".ooo.",".o2o.",".ooo.","....."],["Rey","los 8 vecinos"],17],
      [["..o..","..o..","oo2oo","..o..","..o.."],["Rayo","hasta el borde"],17]]);}
},
{
  t:"Y las llenas se agrupan de una forma",
  d:"Además del alcance, hay una segunda regla que dice cómo se colocan las celdas llenas entre sí.",
  a:function(){return trio([
      [["##.",".#.",".##"],["Cadena","todas unidas"]],
      [["#.#",".#.","#.#"],["Aislado","sin tocarse"]],
      [["##.","...",".##"],["Parejas","de dos en dos"]]]);}
},
{
  t:"Pruébalo tú",
  d:"Esta pista vale 2 y usa el alcance Orto. Toca dos de las casillas azules para que se cumpla.",
  a:function(){return '<div class="tut-play" id="tut-play"></div><p class="tut-note" id="tut-msg">Te faltan 2 casillas.</p>';},
  after:playStep
},
{
  t:"Descubre cuál es el axioma",
  d:"Solo una combinación de alcance y forma tiene una única solución posible. Elígela arriba, marca las celdas y pulsa Comprobar. Si te atascas, el botón Pista te echa una mano.",
  a:function(){return '<div class="tut-art">'+grid(["2..#.",".#..1","..o..","1.#.o","..1.#"],34)+'</div>';}
},
{
  t:"Para ganar la partida",
  d:"Cuando estas cuatro cosas se cumplen a la vez, el tablero está resuelto. Si no te cuadra, prueba a cambiar de regla antes de borrar casillas: puede que las celdas ya estén bien.",
  a:function(){
    var items=[
      ["Una regla elegida en cada eje","Alcance y forma, las dos"],
      ["El número exacto de llenas","Ni una de más ni una de menos"],
      ["Todas las pistas en verde","Con su alcance sin casillas por decidir"],
      ["La forma cumplida","El indicador debe decir «cumple»"]];
    return '<ul class="tut-check">'+items.map(function(it){
      return '<li><span class="tick" aria-hidden="true"></span><b>'+it[0]+'</b><small>'+it[1]+'</small></li>';
    }).join("")+'</ul>'+
    '<p class="tut-note"><a href="como-jugar.svg" target="_blank" rel="noopener">Ver la guía completa paso a paso</a></p>';
  }
}];

/* ---------- paso interactivo ---------- */
function playStep(){
  var host=$("tut-play"), msg=$("tut-msg"); if(!host)return;
  /* cruz de 3x3: la pista en el centro, las cuatro casillas de los lados son tocables */
  var lleno={}, celdas=[[0,1],[1,0],[1,2],[2,1]];
  function pinta(){
    var n=0,k; for(k in lleno)if(lleno[k])n++;
    var html='<div class="tut-board">',r,c;
    for(r=0;r<3;r++)for(c=0;c<3;c++){
      var key=r+","+c, esCentro=(r===1&&c===1);
      var tocable=celdas.some(function(p){return p[0]===r&&p[1]===c;});
      if(esCentro) html+='<div class="tb clue'+(n===2?' ok':'')+'">2'+(n===2?'<span class="tick">✓</span>':'')+'</div>';
      else if(tocable) html+='<button class="tb hit'+(lleno[key]?' full':'')+'" data-k="'+key+'" aria-label="Casilla"></button>';
      else html+='<div class="tb"></div>';
    }
    html+='</div>';
    host.innerHTML=html;
    var bs=host.querySelectorAll(".hit"),i;
    for(i=0;i<bs.length;i++)bs[i].onclick=function(){
      var k=this.getAttribute("data-k"); lleno[k]=!lleno[k]; pinta();
    };
    if(msg){
      if(n===2){msg.textContent="¡Eso es! La pista se cumple y se pone verde.";msg.className="tut-note ok";}
      else if(n>2){msg.textContent="Ahora hay "+n+", una de más. Toca otra vez para quitarla.";msg.className="tut-note bad";}
      else {msg.textContent="Te faltan "+(2-n)+(2-n===1?" casilla.":" casillas.");msg.className="tut-note";}
    }
  }
  pinta();
}

/* ---------- navegación ---------- */
var STEPS=SIMPLE, i=0, primera=false;
function render(){
  var s=STEPS[i], puntos="",j;
  for(j=0;j<STEPS.length;j++)puntos+='<b class="'+(j===i?"on":"")+'"></b>';
  host.innerHTML=
    '<div class="tut-card'+(primera?' entra':'')+'" role="dialog" aria-modal="true" aria-label="Cómo se juega">'+
      '<button class="close" id="tut-x" aria-label="Cerrar">×</button>'+
      '<div class="tut-body">'+
        s.a()+
        '<h2>'+s.t+'</h2><p>'+s.d+'</p>'+
      '</div>'+
      '<div class="tut-dots">'+puntos+'</div>'+
      '<div class="tut-nav">'+
        (i>0?'<button class="ghost" id="tut-prev">Atrás</button>':'<button class="ghost" id="tut-skip">Saltar</button>')+
        '<button class="primary" id="tut-next">'+(i===STEPS.length-1?"Empezar a jugar":"Siguiente")+'</button>'+
      '</div>'+
    '</div>';
  if(s.after)s.after();
  $("tut-x").onclick=cerrar;
  var sk=$("tut-skip"); if(sk)sk.onclick=cerrar;
  var pv=$("tut-prev"); if(pv)pv.onclick=function(){i--;render();};
  $("tut-next").onclick=function(){ if(i===STEPS.length-1)cerrar(); else {i++;render();} };
  host.querySelector(".tut-body").scrollTop=0;
  primera=false;
}
function abrir(cual){ STEPS=cual||SIMPLE; i=0; primera=true; host.classList.add("on"); document.body.style.overflow="hidden"; render(); }
function cerrar(){
  host.classList.remove("on"); host.innerHTML=""; document.body.style.overflow="";
  try{localStorage.setItem("ax_tut","1");}catch(e){}
}
document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&host.classList.contains("on"))cerrar(); });
host.addEventListener("click",function(e){ if(e.target===host)cerrar(); });

/* "Cómo se juega" abre la guía sencilla; el interrogante, la detallada */
function enSudoku(){return document.body.getAttribute("data-game")==="sudoku";}
function liga(sel,cual){
  var bs=document.querySelectorAll(sel),j;
  for(j=0;j<bs.length;j++)(function(b){
    b.onclick=function(ev){ev.preventDefault();abrir(typeof cual==="function"?cual():cual);};
  })(bs[j]);
}
/* con el sudoku abierto, las dos ayudas explican el sudoku */
liga("[data-how]",function(){return enSudoku()?SUDOKU:SIMPLE;});
liga("[data-tut]",function(){return enSudoku()?SUDOKU:TECNICA;});
/* el enlace del último paso sencillo se crea al vuelo, así que se enlaza al pintar */
var _render=render;
render=function(){_render();liga(".tut-card [data-tut]",TECNICA);};

try{ if(!localStorage.getItem("ax_tut")) setTimeout(function(){abrir(SIMPLE);},400); }catch(e){}
})();
