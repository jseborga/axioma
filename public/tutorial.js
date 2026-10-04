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
  d:"«Alrededor» no significa lo mismo en todos los tableros. Hay tres maneras de mirar y tres maneras de agruparse, y se cruzan como una tabla. En el reto diario, de las nueve combinaciones solo una tiene solución: esa es la que buscas. En Flash y en Libre hay menos en juego; la frase bajo el tablero te dice cuántas.",
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
  d:"Elige una regla en cada eje que aparezca (si un eje no sale, su regla es fija y la frase del tablero te la dice), toca las casillas y fíjate en los colores. Verde quiere decir que esa pista ya está cumplida; rojo, que con esas reglas es imposible. Si se te pone todo rojo, cambia de combinación antes de borrar nada.",
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
  d:"Toca una casilla vacía y elige la cifra en el teclado de abajo. Solo entra la cifra correcta: como el tablero tiene una sola solución, cualquier otra es un fallo seguro y se rechaza en rojo. Los dos primeros fallos no cuestan nada; desde el tercero, cada uno suma 30 segundos. El teclado lleva la cuenta de cuántas quedan de cada cifra.",
  a:function(){return trio([
      [["5.3","o..","..7"],["Toca","una casilla vacía"],26],
      [["5.3","4..","..7"],["Pulsa la cifra","y queda puesta"],26],
      [["5.3","...","..7"],["Un fallo","no entra"],26]]);}
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
  d:"Hay cinco niveles y cada uno tiene su propio sudoku del día, igual para todo el mundo. En Ultra no hay ayudas: entra cualquier cifra, nada se marca, no hay pistas y solo se comprueba al completar la rejilla. El cronómetro corre desde tu primera jugada (en un reto, desde que abres el tablero) y las penalizaciones por fallos y pistas ya van dentro, así que el ranking por tiempo es justo. Al terminar puedes entrar con Google para aparecer en el de ese día y ese nivel. Otro tablero te da uno de práctica que no cuenta.",
  a:function(){return '<div class="tut-niv">'+
      '<div><b>Fácil</b><span>unas 42 casillas dadas</span></div>'+
      '<div><b>Medio</b><span>unas 34 dadas</span></div>'+
      '<div><b>Difícil</b><span>unas 28 dadas</span></div>'+
      '<div><b>Experto</b><span>unas 24 dadas</span></div>'+
      '<div><b>Ultra</b><span>unas 22 dadas · sin ayudas ni pistas, solo se comprueba al final</span></div>'+
      '</div><p class="tut-note">Nunca hace falta adivinar: todos los tableros tienen una sola solución.</p>';}
},
{
  t:"Botones y atajos",
  d:"Deshacer quita tu última cifra y Borrar vacía la casilla elegida (las dadas no se tocan). Notas cambia entre cifra definitiva y apunte a lápiz. Con teclado: las cifras del 1 al 9, la N para Notas, las flechas para moverte y Retroceso para borrar.",
  a:function(){return tarjetas([["Deshacer","la última cifra"],["Borrar","la casilla elegida"],["Notas · N","apuntes a lápiz"],["Teclado","1-9, flechas y Retroceso"]],
    'Para jugar con amigos, mira <a href="#" data-guia="reto">Retos</a> y <a href="#" data-guia="pareja">En pareja</a>.');}
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
  d:"Solo una combinación de alcance y forma tiene una única solución posible. Elígela arriba, marca las celdas y pulsa Comprobar. Si te atascas, el botón Pista te echa una mano, pero suma 3 movidas.",
  a:function(){return '<div class="tut-art">'+grid(["2..#.",".#..1","..o..","1.#.o","..1.#"],34)+'</div>';}
},
{
  t:"Movidas y ranking",
  d:"Cada toque en una casilla y cada cambio de regla cuenta como una movida; una pista suma 3. El mínimo posible es una movida por cada celda llena, más una por cada eje con opciones. En el reto diario, el ranking ordena por menos movidas y, a igualdad, por menos pistas; empezar de nuevo limpia el tablero, pero no pone a cero las movidas ni el tiempo.",
  a:function(){return tarjetas([["Toque o cambio de regla","+1 movida"],["Pista","+3 movidas"],["Ranking diario","menos movidas, luego menos pistas"]]);}
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


/* ===========================================================
   Guías «Cómo funciona» de cada sección
   Se abren con el «?» de la cabecera (la guía de la sección en la que
   estés) o con cualquier elemento data-guia="nombre".
   =========================================================== */
function ico(e){return '<div class="tut-ico" aria-hidden="true">'+e+'</div>';}
function tarjetas(items,nota){
  return '<div class="tut-niv">'+items.map(function(x){return '<div><b>'+x[0]+'</b><span>'+x[1]+'</span></div>';}).join("")+'</div>'+
    (nota?'<p class="tut-note">'+nota+'</p>':'');
}
function pasos(items,nota){
  return '<ol class="tut-pasos">'+items.map(function(x){return '<li><b>'+x[0]+'</b><span>'+x[1]+'</span></li>';}).join("")+'</ol>'+
    (nota?'<p class="tut-note">'+nota+'</p>':'');
}
var GUIAS={};
GUIAS.inicio=[
{t:"Qué hay en The Final Test",d:"Aprende, compite y demuéstralo. Cambia de sección con el menú de arriba; el botón «?» abre siempre la ayuda de la sección en la que estás.",
 a:function(){return tarjetas([["Juegos","Axioma, Sudoku, Juegos rápidos y Más juegos en sala."],["Con amigos","Retos con código, premio y penitencia, el sudoku en pareja y tus grupos de amigos con su ranking."],
   ["Concursos","Trivia con premio: te inscribes, juegas una vez y gana quien más acierta."],["Educativo","Cursos y cuestionarios de clase. Aparece si estás en un curso o tienes el perfil educativo."],["Empresas y eventos","Marca, convocatorias con QR y métricas. Aparece con el perfil de empresa."]],
   "Al entrar con Google eres jugador. Los perfiles educativo y de empresa los da la administración de la plataforma: se solicitan en «Mis grupos y partidas».");}},
{t:"Entrar con un código",d:"El cuadro de la portada acepta los códigos de seis caracteres de un curso, de un concurso o convocatoria, de una sala de juego y de un grupo de amigos. Los códigos de un reto o de un sudoku en pareja se escriben en su sección (Retos o En pareja). También puedes abrir el enlace o escanear el QR que te pasen.",
 a:function(){return ico("🔑")+'<p class="tut-note">Ejemplo: <b>K7M2QX</b>. Da igual si lo escribes en minúsculas.</p>';}},
{t:"¿Hace falta cuenta?",d:"Depende de lo que quieras hacer.",
 a:function(){return tarjetas([["Sin cuenta","Axioma, Sudoku, Juegos rápidos de práctica y salas de juego que admiten apodo."],
   ["Con Google","Educativo, concursos, retos, rankings y crear salas de juego."],
   ["Como invitado","En las convocatorias de empresas y salas que lo permiten: nombre, teléfono o correo y un código de verificación."]],
   "La primera vez se pide la fecha de nacimiento y aceptar los términos. Los menores de 18 no participan en concursos abiertos con premio salvo que su institución confirme el consentimiento de su tutor.");}}
];
GUIAS.aula=[
{t:"Qué es la sección Educativo",d:"Cuestionarios de clase con registros para el docente. Cada institución organiza su estructura (facultades, carreras, materias…), cada docente crea sus cursos y bancos de preguntas, y los estudiantes responden desde el móvil.",
 a:function(){return tarjetas([["Estudiante","Entra en el curso con su código y responde los cuestionarios."],["Docente","Crea cursos, bancos y cuestionarios y ve los registros."],["Administración","Registra la institución, su estructura y a sus docentes."]]);}},
{t:"Si eres estudiante",d:"",
 a:function(){return pasos([["Pide el código del curso","Seis caracteres; también sirve el enlace o el QR que comparta tu docente."],
   ["Entra en el curso","Con el cuadro de la portada (o en Educativo, si ya lo ves). La primera vez escribe tu nombre completo y tu teléfono; el registro universitario es opcional. Si el curso pide aprobación, espera a que el docente te acepte."],
   ["Exámenes","Una sola vez cada uno, con tiempo por pregunta. Si recargas, sigues en la misma pregunta con el mismo reloj. Al cierre ves tus respuestas y las correctas."],
   ["Prácticas","Repítelas cuantas veces quieras mientras estén abiertas: tras cada respuesta ves si acertaste y la correcta. Cuenta tu mejor intento."],
   ["Mi avance","En tu curso ves tus notas, tu promedio de exámenes y tu mejor intento en cada práctica. No hay ranking público."],
   ["Repaso de ingreso","En Educativo → «Repaso de ingreso y nivelación» practicas gratis exámenes publicados por universidades e institutos. Con un código de acceso ves el desarrollo de cada pregunta y tu calificación."]]);}},
{t:"Si eres docente",d:"",
 a:function(){return pasos([["Crea un curso","Nombre (por ejemplo, «Cálculo I · Paralelo A») y gestión. Comparte su código o QR con tus estudiantes."],
   ["Prepara un banco de preguntas","Cada banco es de una materia. Sube un Excel o CSV, o pega filas o texto con opciones A) B) C); antes de guardar ves cada pregunta revisada. Los docentes de esa materia pueden usarlo, pero solo tú y la administración lo editan."],
   ["Inscribe a tus estudiantes","Con el código del curso, o de golpe con «Alta masiva desde Excel» (nombre, correo y registro). Puedes dividir el curso en grupos."],
   ["Crea exámenes y prácticas","Examen: un solo intento y nota al cierre. Práctica: intentos ilimitados con corrección al momento. Para todo el curso o para un grupo."],
   ["Tipos de pregunta","Opción múltiple (con imágenes si quieres), verdadero o falso, numérica con tolerancia y texto libre. Cada una puede llevar imagen y su desarrollo. El texto libre lo calificas en «Por revisar»."],
   ["Sigue la libreta","Cada estudiante con sus notas y su mejor intento en las prácticas, el promedio y la descarga en Excel. En cada cuestionario, además, la estadística por pregunta."]],
   "Cada estudiante recibe su propia selección al azar: si el banco tiene más preguntas de las que pides, pueden tocarle preguntas distintas, siempre en otro orden y con las opciones barajadas. Con preguntas generales, el número se redondea a 10, 20, 30, 50 o 100.");}},
{t:"Si administras una institución",d:"",
 a:function(){return pasos([["Registra la institución","Necesitas el perfil educativo que da la administración de la plataforma (se solicita en «Mis grupos y partidas»). Nombre, tipo y, si quieres, el dominio de correo."],
   ["Define la estructura","Facultades, carreras, materias… los niveles que necesites."],
   ["Suma docentes","Con el enlace para docentes o dándolos de alta por correo. También puedes nombrar auxiliares en cada curso."],
   ["Sigue las métricas","Participación, cuestionarios y cursos activos de toda la institución."]]);}},
{t:"Ayudas con IA · plan Pro",d:"",
 a:function(){return pasos([["Genera preguntas","En el banco, «✨ Generar con IA»: desde un tema o desde tus apuntes (texto, PDF o Word). Revisas cada pregunta antes de importarla."],
   ["Revisa tu banco","«✨ Revisar con IA» señala preguntas ambiguas o con errores y propone la corrección; aplicas solo las que te convenzan."],
   ["Explica las prácticas","Al crear una práctica, marca «Explicación con IA» y cada estudiante verá por qué la correcta es la correcta."]],
   "El plan Pro lo activa la plataforma para cada institución, con un número de usos al mes. Importar desde Excel es gratis para todos.");}}
];
GUIAS.empresas=[
{t:"Empresas y eventos",d:"Para empresas e instituciones que quieren promocionar un evento o una marca con juegos: una página propia con logo y color, convocatorias con premio que se abren con un QR, y métricas de participación.",
 a:function(){return ico("🏢");}},
{t:"De cero a tu primera convocatoria",d:"",
 a:function(){return pasos([["Registra tu empresa","Necesitas el perfil de empresa que da la administración de la plataforma (se solicita en «Mis grupos y partidas»)."],
   ["Personaliza tu marca","Logo, color, lema y la dirección de tu página (?marca=…)."],
   ["Crea una convocatoria","Una trivia con premio, fechas, dificultad y áreas temáticas. Decide si admite invitados sin cuenta de Google."],
   ["Compártela","Con el enlace, el QR o el cartel listo para imprimir."],
   ["Mide el resultado","Métricas por día, participantes y quién acepta que la marca lo contacte, con descarga en Excel."]]);}},
{t:"Competencias de juego rápido",d:"",
 a:function(){return pasos([["Crea la competencia","Convocatorias → Nueva competencia de juego rápido: juego (trivia, memoria, cálculo, reflejos o del 1 al 25), intentos y duración."],
   ["Pon los premios","Por puesto (1.º, 2.º a 10.º…), que se asignan al cerrar, y por puntaje (p. ej. 10 % de descuento con 1200 puntos), que llegan al momento."],
   ["Compártela","Con el QR o el enlace. Se juega con Google o como invitado verificado; cuenta la mejor marca."],
   ["Valida los cupones","Cada premio es un cupón único. En caja, «Validar cupón» dice de quién es y lo marca como canjeado."]],
   "El servidor genera, cronometra y puntúa cada partida: nadie puede inventarse una marca.");}},
{t:"Competencias sin fin",d:"",
 a:function(){return pasos([["Elige un juego sin fin","En Nueva competencia, grupo «Sin fin»: Memoria sin fin (la secuencia crece sin tope), Maratón de sudoku o Maratón de Axioma (tableros cada vez más difíciles)."],
   ["Pon las reglas","Vidas (cada fallo quita una) y, en sudoku y Axioma, el reloj inicial y el tiempo extra por tablero resuelto."],
   ["Se juega hasta perder","Sin vidas o sin tiempo se acaba la partida y cuenta lo conseguido; también se puede plantar. Gana quien llega más lejos."],
   ["Premios como siempre","Por puesto al cerrar y por puntaje al momento (en la memoria, por casillas)."]],
   "Los tableros los prepara tu navegador al publicar; el servidor guarda las soluciones y comprueba cada paso.");}},
{t:"Cómo participa la gente",d:"Quien escanea el QR entra directo a la convocatoria. Puede hacerlo con Google o como invitado: nombre, teléfono o correo, fecha de nacimiento y un código de verificación. Cada persona participa una sola vez, y el mismo teléfono o correo es siempre la misma persona.",
 a:function(){return ico("📱")+'<p class="tut-note">Mientras la plataforma esté en <b>modo de pruebas</b>, el código de verificación se muestra en pantalla en lugar de enviarse por SMS o correo.</p>';}},
{t:"Equipo y juegos en vivo",d:"La administración de la empresa gestiona la marca, los miembros y las métricas; los organizadores crean convocatorias. Para un evento presencial, en Más juegos puedes abrir en nombre de la empresa una trivia en vivo con proyector, el botón del hype, un sorteo o una subasta inversa. Los bancos de la empresa sirven para sus convocatorias, sus trivias en vivo y los retos de quien la administra.",
 a:function(){return tarjetas([["Administración","Marca, miembros, convocatorias y métricas."],["Organizador","Crea y gestiona convocatorias."]],
   "En convocatorias abiertas con premio, los menores de 18 solo participan si la institución confirma el consentimiento de su tutor.");}}
];
GUIAS.marca=GUIAS.empresas;
GUIAS.concurso=[
{t:"Concursos de trivia",d:"Te inscribes, juegas una sola vez cuando quieras mientras esté abierto y, al cierre, se publica el ranking con el ganador.",
 a:function(){return ico("🏆");}},
{t:"Cómo se juega",d:"",
 a:function(){return pasos([["Una pregunta cada vez","Con sus opciones y su tiempo. Si se agota, cuenta como fallo."],
   ["Errores admitidos","Cada concurso admite unos cuantos; con el siguiente fallo tu partida termina."],
   ["Sin segunda oportunidad","La partida empieza con la primera pregunta. Si cierras o recargas, vuelves a la misma pregunta con el mismo reloj."]],
   "La respuesta correcta no llega a tu teléfono hasta el cierre, así que nadie puede mirarla antes.");}},
{t:"Quién gana",d:"Más aciertos; a igualdad, menos errores; luego menos tiempo respondiendo y, si aún empatan, quien empezó antes. Si nadie acierta ninguna, no hay ganador. Al cierre ves tus respuestas, las correctas y un «¿Sabías que…?» de cada pregunta.",
 a:function(){return ico("🥇");}},
{t:"Crear un concurso",d:"Pon nombre y premio, elige dificultad (Progresiva: 8 fáciles, luego 10 medias y después difíciles), número de preguntas, tiempo, si incluye cálculo y de qué áreas temáticas salen. Cada jugador recibe su propia secuencia al azar y no se le repiten preguntas que haya visto en los últimos 60 días.",
 a:function(){return ico("✍️")+'<p class="tut-note">Para un premio importante, usa un tiempo por pregunta corto y, si puedes, que todos jueguen a la vez en el mismo sitio.</p>';}}
];
GUIAS.reto=[
{t:"Retos entre amigos",d:"Un concurso privado con código: todos juegan lo mismo, hay clasificación, un premio para el primero y una penitencia para el último (o la ruleta de penitencias).",
 a:function(){return ico("🎯");}},
{t:"Qué se juega",d:"",
 a:function(){return tarjetas([["Sudoku","Un tablero por día durante los días que elijas, el mismo para todos. Gana quien completa más rondas y, a igualdad, quien suma menos tiempo."],
   ["Juego rápido","De 1 a 10 rondas seguidas de Trivia, Memoria, Cálculo, Reflejos o Del 1 al 25, durante un día, tres o una semana."]],
   "En el sudoku de un reto, el tiempo cuenta desde que abres el tablero.");}},
{t:"Trivia con tus propias preguntas",d:"",
 a:function(){return pasos([["Crea tu banco","Retos → Mis preguntas: ponle nombre y pega filas de Excel, texto con A) B) C) o sube un Excel. Antes de guardar ves cada pregunta revisada."],
   ["Llega a 10","Una partida de trivia usa 10 preguntas: el banco necesita al menos esas."],
   ["Elígelo en el reto","Al crear un reto de Trivia, en «Preguntas» eliges tu banco (o el de tu empresa). Se congela en el reto: si luego lo cambias, el reto no cambia."]],
   "Tu banco solo lo ves tú. También sirve para una trivia en vivo en Más juegos. Los bancos de colegios y universidades no se usan en juegos: son para sus exámenes y prácticas.");}},
{t:"Modalidades",d:"",
 a:function(){return tarjetas([["Individual","Cada uno por su cuenta."],["Por equipos","El equipo completa una ronda cuando la juegan todos; cuenta la media de sus marcas."],
   ["Por parejas","Cada ronda de sudoku se juega a cuatro manos. Solo cuenta si la resolvéis los dos."]]);}},
{t:"Detalles importantes",d:"En los retos de sudoku, una ronda que no juegas ese día se pierde, y quien se une tarde no recupera las anteriores. Los días cambian a medianoche UTC, es decir, a las 20:00 en Bolivia. Si al final hay empate en todo, se ordena por nombre.",
 a:function(){return pasos([["Crear","Retos → Crear un reto; te da un código."],["Unirse","Retos → escribe el código → Unirme (con Google)."]],
   '<a href="#" data-guia="sudoku">Cómo se juega el sudoku</a> · <a href="#" data-guia="rapido">Los juegos rápidos</a>');}}
];
GUIAS.amigos=[
{t:"Mis grupos y partidas",d:"Todo lo que juegas con tu cuenta de Google queda guardado, y puedes armar grupos con tus amigos.",
 a:function(){return ico("👥");}},
{t:"Grupos de amigos",d:"",
 a:function(){return pasos([["Crea un grupo","Ponle nombre y comparte su código o su enlace. Hasta 50 personas."],
   ["Ranking de la semana","3 puntos por cada Axioma diario, 2 por cada sudoku del día y 1 por partida en vivo (+2 si la ganas), en los últimos 7 días."],
   ["Retos del grupo","Los retos del último mes en los que juega alguien del grupo aparecen en su página."]]);}},
{t:"Mis partidas",d:"Tus Axiomas diarios, sudokus del día, retos, concursos y partidas en vivo, con tus mejores marcas.",
 a:function(){return ico("📒");}},
{t:"Tu perfil",d:"Al entrar con Google eres jugador. Si eres docente o representas a una institución educativa, una empresa o un evento, solicita el perfil: la administración de la plataforma lo revisa y, al aprobarlo, aparece la sección en el menú.",
 a:function(){return ico("🪪");}}
];
GUIAS.pareja=[
{t:"Sudoku en pareja",d:"Dos personas resuelven el mismo tablero a la vez, cada una desde su móvil. El tiempo es de la pareja.",
 a:function(){return pasos([["Crea la sala","Elige el nivel (de Fácil a Experto) y comparte el código."],["Tu pareja entra","En En pareja, con ese código."],
   ["Jugad a la vez","Tus cifras salen en azul y las de tu pareja en morado. Solo entra la cifra correcta; dos fallos no cuestan y desde el tercero suman 30 s. No hay pistas."]],
   'Hace falta entrar con Google. <a href="#" data-guia="sudoku">Reglas del sudoku</a>');}}
];
GUIAS.rapido=[
{t:"Juegos rápidos",d:"Cinco juegos cortos, de 30 segundos a 2 minutos. Practica cuando quieras: tu mejor marca se guarda en este teléfono. Para competir con amigos, crea un reto con uno de ellos.",
 a:function(){var R=window.AxRapidos; if(!R)return "";
   return tarjetas(Object.keys(R.JUEGOS).filter(function(k){return k.indexOf("granja")<0;}).map(function(k){var j=R.JUEGOS[k];return [j.icono+" "+j.nom+" · "+j.dur,j.desc];}));}},
{t:"Detalles",d:"En la Trivia de práctica no se repiten preguntas que ya viste en los últimos 60 días en este teléfono. En Memoria no hay reloj: cada acierto añade una casilla más, hasta 14. En un reto solo vale el primer intento de cada ronda.",
 a:function(){return ico("⚡");}},
{t:"En grupo, con un solo teléfono",d:"Para jugar en persona pasándoos el teléfono (o en la pantalla grande), sin cuentas ni conexión. Cada juego explica sus reglas antes de empezar y recuerda los nombres de los equipos o jugadores.",
 a:function(){var F=window.AxFiesta; if(!F)return "";
   return tarjetas(Object.keys(F.JUEGOS).map(function(k){var j=F.JUEGOS[k];return [j.icono+" "+j.nom,j.gente];}));}}
];
GUIAS.granja=[
{t:"Granja Express",d:"Un arcade de 8 bits de estrategia y velocidad: siembra, fabrica y entrega los pedidos antes de que se vayan, y acierta preguntas para mejorar tu granja. Cuatro minutos para juntar todas las monedas que puedas.",
 a:function(){return ico("🚜");}},
{t:"Cómo se juega",d:"",
 a:function(){return pasos([["Siembra","Elige la semilla a la derecha y toca una parcela vacía. Cuando brille, tócala para cosechar: cada parcela da 2."],
   ["Fabrica","Toca una fábrica para ponerla a trabajar (hasta 3 en cola): el molino hace harina con 2 de trigo, el horno pan con harina… Lo hecho va solo al granero."],
   ["Entrega","Arriba llegan los pedidos en camión, tren, avión y barco. Cuando tengas todo (sale con borde verde), tócalo. La barra de abajo es su plazo; la ✕ lo descarta."],
   ["Sube de nivel","Con 100, 300 y 650 monedas se abren la zanahoria, el gallinero, los jugos, la pastelería y más andenes."],
   ["Acierta y mejora","Cada 40 s se enciende «¡Pregunta!» (junto a las fábricas). La granja se detiene mientras respondes; si aciertas ganas 10 monedas y eliges una de tres mejoras: abono, parcela nueva, granero grande, fábricas turbo, cosecha triple, vida extra… Las preguntas son de cultura general y no se repiten."]]);}},
{t:"Trucos",d:"",
 a:function(){return tarjetas([["Combo","Si entregas otro pedido antes de 10 s, cada entrega vale un 10 % más (hasta +50 %)."],["Rapidez","Cuanto antes entregues, más monedas extra."],
   ["Granero","Caben 24. Si se llena, entrega o usa «Vender» (a mitad de precio)."],["Vidas","Si se te va un pedido pierdes una; con tres perdidas se acaba la partida."]]);}},
{t:"Dónde se juega",d:"",
 a:function(){return tarjetas([["La granja del día","La misma para todos; cuenta tu mejor partida del día y hay ranking. Suma en el ranking de tus grupos."],
   ["Práctica y sin fin","Una granja nueva cada vez, o sin reloj hasta perder tres pedidos."],["Granja Grande","8 minutos en un mapa que se recorre arrastrando: mejoras tus 8 máquinas, compras parcelas, amplías el granero y el silo, y automatizas con cosechadora, fábricas automáticas y camión de reparto (botón ⚙ Mejoras)."],["Retos y competencias","Con amigos en Retos, o con premio en las competencias de las empresas (con su marca en el camión)."]],
   "El servidor repite tu partida con cada toque que hiciste y calcula él las monedas: nadie puede enviar una marca inventada.");}}
];
GUIAS.ciudad=[
{t:"Ciudad Saber",d:"Un constructor de ciudades en un mundo infinito: cada persona funda su ciudad en una ranura del mundo y las de al lado son sus vecinas. Haz que crezca con servicios bien pensados y resuelve sus problemas respondiendo preguntas de ingeniería básica, servicios y cultura general.",
 a:function(){return ico("🏙️");}},
{t:"Cómo se juega",d:"",
 a:function(){return pasos([["Calles","En 🛣️ Vías, toca o arrastra para trazar calles. Las zonas solo crecen junto a una calle."],
   ["Zonas","🏘️ Residencial (viviendas), Comercial (tiendas y oficinas) e Industrial (fábricas). Las barras R C I dicen qué hace falta."],
   ["Servicios","⚡ Energía y 💧 agua para que crezcan; policía, bomberos, hospital y escuela para que suban de nivel y la gente esté feliz."],
   ["Cultura","Bibliotecas, plazas, teatros, museos y la universidad suman 🎭 cultura: la cultura amplía tu territorio (el círculo punteado)."],
   ["Preguntas","🔬 Investiga tecnologías (eólica, solar, hidroeléctrica, rascacielos…) acertando una pregunta de su tema. Los ⚠️ problemas (apagón, sequía, atasco, incendio…) se resuelven igual, antes de que venza su plazo. La ciudad se detiene mientras respondes y siempre ves la explicación."]]);}},
{t:"Épocas y encuentros",d:"",
 a:function(){return pasos([["Épocas de la historia","🏺 Antigüedad → 🏰 Edad Media → 🎨 Renacimiento → 🏭 Revolución Industrial → 🏙️ Era Moderna → 💻 Era Digital. Toca la época (arriba) para ver sus metas: habitantes, cultura y aciertos."],
   ["Pregunta de historia","Con las metas cumplidas, pasas de época acertando una pregunta de historia de esa época. Cada época cambia el aspecto de la ciudad, sube el nivel máximo de las zonas y trae edificios y tecnologías. La electricidad llega con la Revolución Industrial."],
   ["Influencia cultural","Tu cultura se extiende por el mundo: territorio + 7 casillas por época (el círculo dorado). Cuando toca la de una ciudad vecina, ¡se encuentran!"],
   ["Tratados","En 🌍 Vecinos, firma un tratado con la ciudad que encontraste acertando una pregunta de cultura: se abre una ruta comercial con caravanas o camiones (+8 % de ingresos, más comercio y cultura)."]]);}},
{t:"Trucos",d:"",
 a:function(){return tarjetas([["🔍 Mirar","Toca una casilla y te dice por qué crece o no: falta calle, energía, agua, demanda, escuela…"],
   ["🗺️ Capas","Contaminación, seguridad, bomberos, salud, educación y ocio pintadas sobre el mapa."],
   ["Impuestos","En 🏛️ Alcaldía: más impuestos dan más dinero, pero bajan la felicidad y frenan el crecimiento."],
   ["Contaminación","La industria y la central térmica contaminan; los parques, el reciclaje y la depuradora limpian."]]);}},
{t:"Vecinos y desafíos",d:"",
 a:function(){return tarjetas([["Mundo abierto","Tus vecinos ven tu ciudad y tú la suya (🌍 Vecinos, o 🌐 para ver el mundo desde arriba), con ranking del mundo. Lo que hacen te llega al guardar y cada minuto. Puntaje: habitantes × felicidad + 30 por acierto + cultura + 200 por época."],
   ["Desafíos de curso","El docente crea un mundo para su curso, con fechas y metas, y ve un reporte de aciertos por tema de cada estudiante."]],
   "Tu ciudad se guarda sola cada ~40 s: el servidor repite lo que hiciste con su propio banco de preguntas, así que nadie puede inventar una ciudad o un acierto.");}}
];
GUIAS.juegos=[
{t:"Más juegos",d:"Juegos en sala con código: estrategia 1 contra 1, juegos de mesa en grupo, dinámicas en vivo para eventos, sorteos y subastas, y juegos solo para adultos. Cada juego explica sus reglas en su ficha.",
 a:function(){return tarjetas([["Estrategia","Gomoku, Hex, tres en raya cuántico: contra el bot sin conexión, a dos en un teléfono o en línea."],
   ["En grupo","Dudo, La sexta carta, Dos verdades y una mentira y la carrera de caballos de preguntas (hasta 4, con bots)."],["En vivo","Trivia con proyector, botón del hype, carrera matemática."],
   ["Sorteos y subastas","Sorteo, bingo rápido o largo y subasta inversa, para eventos con bases y premio."],["Solo adultos","Paranoia y Yo nunca, para mayores de 18 según su fecha de nacimiento."]]);}},
{t:"Crear una sala",d:"",
 a:function(){return pasos([["Elige el juego y sus opciones","Hace falta entrar con Google para crear."],
   ["Decide quién puede unirse","Con un apodo, con Google o con teléfono o correo verificado, o solo con Google. Si hay premio, siempre hay que identificarse."],
   ["Comparte el código o el QR","La sala de espera muestra los dos. Puedes añadir bots en los juegos que los tienen."],
   ["Empieza la partida","Solo el anfitrión empieza. Al terminar, «Otra partida» vuelve a la sala de espera."]]);}},
{t:"Unirse y proyectar",d:"Para unirte, escribe el código en Más juegos o en la portada, o escanea el QR. Para eventos, pulsa «Abrir en el proyector» y abre ese enlace en el ordenador conectado a la pantalla grande, a pantalla completa (F11): muestra el QR, el juego en grande y los resultados, y tú lo controlas desde el teléfono.",
 a:function(){return ico("📽️")+'<p class="tut-note">Si se corta la conexión, la sala vuelve a conectarse sola y sigues donde estabas.</p>';}}
];
GUIAS.pantalla=GUIAS.juegos;

/* ---------- navegación ---------- */
var STEPS=SIMPLE, i=0, primera=false;
function render(){
  var s=STEPS[i], puntos="",j;
  for(j=0;j<STEPS.length;j++)puntos+='<b class="'+(j===i?"on":"")+'"></b>';
  host.innerHTML=
    '<div class="tut-card'+(primera?' entra':'')+'" role="dialog" aria-modal="true" aria-label="Cómo se juega">'+
      '<button class="close" id="tut-x" aria-label="Cerrar">×</button>'+
      '<div class="tut-body">'+
        (s.d?s.a()+'<h2>'+s.t+'</h2><p>'+s.d+'</p>':'<h2>'+s.t+'</h2>'+s.a())+   /* los pasos numerados, con el título arriba */
      '</div>'+
      '<div class="tut-dots">'+puntos+'</div>'+
      '<div class="tut-nav">'+
        (i>0?'<button class="ghost" id="tut-prev">Atrás</button>':'<button class="ghost" id="tut-skip">Saltar</button>')+
        '<button class="primary" id="tut-next">'+(i===STEPS.length-1?(STEPS===SIMPLE||STEPS===TECNICA||STEPS===SUDOKU||STEPS===GUIAS.rapido?"Empezar a jugar":"Entendido"):"Siguiente")+'</button>'+
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

/* "Cómo se juega" abre la guía sencilla; el interrogante, la detallada.
   En cada sección, las dos abren la guía de esa sección. */
function enSudoku(){return document.body.getAttribute("data-game")==="sudoku"&&document.body.getAttribute("data-mode")==="sud";}
function seccion(){var m=document.body.getAttribute("data-mode")||"";return GUIAS[m]?m:null;}
function guia(detallada){var g=seccion(); if(g)return GUIAS[g]; return enSudoku()?SUDOKU:(detallada?TECNICA:SIMPLE);}
function liga(sel,cual){
  var bs=document.querySelectorAll(sel),j;
  for(j=0;j<bs.length;j++)(function(b){
    b.onclick=function(ev){ev.preventDefault();abrir(typeof cual==="function"?cual():cual);};
  })(bs[j]);
}
/* con el sudoku abierto, las dos ayudas explican el sudoku */
liga("[data-how]",function(){return guia(false);});
liga("[data-tut]",function(){return guia(true);});
/* enlaces a una guía concreta: data-guia="sudoku", "axioma", "tecnica", "rapido", "reto"… */
var POR_NOMBRE=function(n){return n==="sudoku"?SUDOKU:n==="axioma"?SIMPLE:n==="tecnica"?TECNICA:GUIAS[n];};
document.addEventListener("click",function(ev){
  var b=ev.target.closest&&ev.target.closest("[data-guia]"); if(!b)return;
  var g=POR_NOMBRE(b.getAttribute("data-guia")); if(!g)return;
  ev.preventDefault(); abrir(g);
});
/* el enlace del último paso sencillo se crea al vuelo, así que se enlaza al pintar */
var _render=render;
render=function(){_render();liga(".tut-card [data-tut]",TECNICA);};

/* ya no se abre sola al cargar: la portada es The Final Test, y la guía
   aparece la primera vez que alguien entra en Axioma */
window.AxTutorial={primeraVez:function(){
  try{ if(!localStorage.getItem("ax_tut")) setTimeout(function(){abrir(SIMPLE);},300); }catch(e){}
},
/* la guía del sudoku, la primera vez que se abre el sudoku */
primeraVezSudoku:function(){
  try{ if(!localStorage.getItem("ax_tut_sud")){localStorage.setItem("ax_tut_sud","1");setTimeout(function(){abrir(SUDOKU);},300);} }catch(e){}
},
abre:function(n){var g=POR_NOMBRE(n); if(g)abrir(g);}};
})();
