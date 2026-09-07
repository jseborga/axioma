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

/* ---------- pasos ---------- */
var STEPS=[
{
  t:"El tablero esconde celdas llenas",
  d:"Así se ve un tablero ya resuelto: los cuadros oscuros son las celdas llenas. Al empezar solo verás los números, que son las pistas, y tendrás que deducir dónde va cada llena.",
  a:function(){return '<div class="tut-art">'+grid([".1..#","..#..","2...1","..#..","#..2."],34)+'</div>';}
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
var i=0;
function render(){
  var s=STEPS[i], puntos="",j;
  for(j=0;j<STEPS.length;j++)puntos+='<b class="'+(j===i?"on":"")+'"></b>';
  host.innerHTML=
    '<div class="tut-card" role="dialog" aria-modal="true" aria-label="Cómo se juega">'+
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
}
function abrir(){ i=0; host.classList.add("on"); document.body.style.overflow="hidden"; render(); }
function cerrar(){
  host.classList.remove("on"); host.innerHTML=""; document.body.style.overflow="";
  try{localStorage.setItem("ax_tut","1");}catch(e){}
}
document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&host.classList.contains("on"))cerrar(); });
host.addEventListener("click",function(e){ if(e.target===host)cerrar(); });

var botones=document.querySelectorAll("[data-how]"),bi;
for(bi=0;bi<botones.length;bi++)botones[bi].onclick=abrir;
try{ if(!localStorage.getItem("ax_tut")) setTimeout(abrir,400); }catch(e){}
})();
