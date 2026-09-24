/* ===========================================================
   AXIOMA · Juegos rápidos · motor
   Cinco juegos de un minuto para retos entre amigos: trivia,
   memoria, cálculo, reflejos y del 1 al 25. Este archivo lo usan
   por igual el navegador y el Worker: cada ronda se genera a partir
   de una semilla, así el servidor puede reconstruirla y puntuar lo
   que envía el jugador sin fiarse de él.
   No toca window ni document: solo define globalThis.AxRapidos.
   =========================================================== */
(function(G){
"use strict";

/* ---------- azar reproducible ---------- */
function semilla(txt){          /* FNV-1a de 32 bits sobre el texto */
  var h=0x811c9dc5, i; txt=String(txt);
  for(i=0;i<txt.length;i++){h^=txt.charCodeAt(i); h=Math.imul(h,0x01000193);}
  return h>>>0;
}
function rng(s){var a=s>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};}
function baraja(arr,r){for(var i=arr.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=arr[i];arr[i]=arr[j];arr[j]=t;}return arr;}
function entre(r,a,b){return a+Math.floor(r()*(b-a+1));}

/* ---------- los juegos ---------- */
var JUEGOS={
  trivia:  {nom:"Trivia",     icono:"❓", orden:"puntos", desc:"Diez preguntas, doce segundos cada una. Cuanto antes aciertes, más puntos.", dur:"2 min"},
  memoria: {nom:"Memoria",    icono:"🧠", orden:"puntos", desc:"Mira qué casillas se encienden y repítelas en orden. Cada vez una más.", dur:"1 min"},
  calculo: {nom:"Cálculo",    icono:"➕", orden:"puntos", desc:"Cuarenta y cinco segundos de cuentas mentales. Cada fallo te quita tres segundos.", dur:"45 s"},
  reflejos:{nom:"Reflejos",   icono:"⚡", orden:"menos",  desc:"Toca en cuanto la pantalla se ponga verde. Cinco veces; cuenta la media.", dur:"30 s"},
  numeros: {nom:"Del 1 al 25",icono:"🔢", orden:"menos",  desc:"Toca los números en orden lo más rápido que puedas. Cada fallo suma un segundo.", dur:"30 s"}
};

/* ---------- trivia: banco de preguntas ----------
   [pregunta, [correcta, otra, otra, otra]]. La correcta va siempre la
   primera aquí; el orden se baraja al generar la ronda. */
var BANCO=[
["¿Cuál es el río más largo de Sudamérica?",["Amazonas","Paraná","Orinoco","Magdalena"]],
["¿Cuál es la capital de Australia?",["Canberra","Sídney","Melbourne","Perth"]],
["¿Cuál es el país más grande del mundo por superficie?",["Rusia","Canadá","China","Estados Unidos"]],
["¿Cuál es el desierto cálido más grande del mundo?",["Sahara","Gobi","Atacama","Kalahari"]],
["¿Cuál es el lago navegable más alto del mundo?",["Titicaca","Baikal","Victoria","Superior"]],
["¿En qué país está Machu Picchu?",["Perú","Bolivia","Ecuador","Colombia"]],
["¿Cuál es la capital de Canadá?",["Ottawa","Toronto","Montreal","Vancouver"]],
["¿Cuál es el océano más grande?",["Pacífico","Atlántico","Índico","Ártico"]],
["¿Cuál es el salar más grande del mundo?",["Salar de Uyuni","Salinas Grandes","Salar de Atacama","Bonneville"]],
["¿Cuál es la montaña más alta del mundo?",["Everest","K2","Aconcagua","Kilimanjaro"]],
["¿Cuál es el pico más alto de América?",["Aconcagua","Huascarán","Illimani","Denali"]],
["¿Cuál es la capital de Brasil?",["Brasilia","Río de Janeiro","São Paulo","Salvador"]],
["¿Qué país tiene forma de bota?",["Italia","Grecia","Portugal","Chile"]],
["¿En qué continente está Egipto?",["África","Asia","Europa","Oceanía"]],
["¿Cuál es el país más pequeño del mundo?",["Ciudad del Vaticano","Mónaco","San Marino","Liechtenstein"]],
["¿Qué cordillera recorre el oeste de Sudamérica?",["Los Andes","Los Alpes","El Himalaya","Las Rocosas"]],
["¿Cuál es la capital constitucional de Bolivia?",["Sucre","La Paz","Santa Cruz","Cochabamba"]],
["¿Qué estrecho separa Europa de África?",["Gibraltar","Bering","Magallanes","Bósforo"]],
["¿Cuál es el planeta más grande del sistema solar?",["Júpiter","Saturno","Neptuno","Tierra"]],
["¿Qué gas necesitamos respirar para vivir?",["Oxígeno","Nitrógeno","Hidrógeno","Dióxido de carbono"]],
["¿Cuál es el símbolo químico del oro?",["Au","Ag","Or","Go"]],
["¿Cuántos huesos tiene el cuerpo humano adulto?",["206","180","250","300"]],
["¿Cuál es el planeta más cercano al Sol?",["Mercurio","Venus","Tierra","Marte"]],
["¿A qué velocidad viaja aproximadamente la luz?",["300 000 km/s","30 000 km/s","3 000 km/s","3 millones de km/s"]],
["¿Qué órgano bombea la sangre?",["El corazón","El hígado","El pulmón","El riñón"]],
["¿Cuál es el animal terrestre más rápido?",["El guepardo","El león","El caballo","El antílope"]],
["¿Qué metal es líquido a temperatura ambiente?",["El mercurio","El plomo","El estaño","El aluminio"]],
["¿Qué planeta es conocido como el planeta rojo?",["Marte","Venus","Júpiter","Saturno"]],
["¿Cuántos lados tiene un hexágono?",["6","5","7","8"]],
["¿Cuál es el hueso más largo del cuerpo humano?",["El fémur","La tibia","El húmero","El radio"]],
["¿Cuál es el mamífero más grande?",["La ballena azul","El elefante africano","La jirafa","El hipopótamo"]],
["¿En qué parte de la planta ocurre sobre todo la fotosíntesis?",["En las hojas","En las raíces","En el tallo","En las flores"]],
["H₂O es la fórmula de…",["El agua","La sal","El oxígeno","El azúcar"]],
["¿Cuántos planetas tiene el sistema solar?",["8","9","7","10"]],
["¿Quién formuló la teoría de la relatividad?",["Albert Einstein","Isaac Newton","Galileo Galilei","Nikola Tesla"]],
["¿Cuál es el órgano más grande del cuerpo humano?",["La piel","El hígado","El intestino","El cerebro"]],
["¿A cuántos grados hierve el agua al nivel del mar?",["100 °C","90 °C","120 °C","80 °C"]],
["¿Cuántos cromosomas tiene una célula humana normal?",["46","23","48","44"]],
["¿En qué año llegó Colón a América?",["1492","1500","1482","1521"]],
["¿Quién fue la primera persona en pisar la Luna?",["Neil Armstrong","Buzz Aldrin","Yuri Gagarin","John Glenn"]],
["¿En qué año terminó la Segunda Guerra Mundial?",["1945","1939","1948","1918"]],
["¿Qué civilización construyó las pirámides de Giza?",["Los egipcios","Los mayas","Los romanos","Los griegos"]],
["¿De qué libertador toma su nombre Bolivia?",["Simón Bolívar","José de San Martín","Antonio José de Sucre","Bernardo O'Higgins"]],
["¿Qué muro cayó en 1989?",["El muro de Berlín","La muralla china","El muro de Adriano","El muro de Jerusalén"]],
["¿Quién pintó la Mona Lisa?",["Leonardo da Vinci","Miguel Ángel","Rafael","Botticelli"]],
["¿En qué año se fundó Bolivia?",["1825","1810","1830","1821"]],
["¿Qué imperio tenía su capital en Cusco?",["El inca","El azteca","El maya","El romano"]],
["¿Quién fue el primer presidente de Estados Unidos?",["George Washington","Abraham Lincoln","Thomas Jefferson","Benjamin Franklin"]],
["¿Qué barco famoso se hundió en 1912?",["El Titanic","El Lusitania","El Britannic","El Bismarck"]],
["¿Quién escribió «Cien años de soledad»?",["Gabriel García Márquez","Mario Vargas Llosa","Julio Cortázar","Jorge Luis Borges"]],
["¿Quién escribió «Don Quijote de la Mancha»?",["Miguel de Cervantes","Lope de Vega","Francisco de Quevedo","Federico García Lorca"]],
["¿En qué año se celebró el primer Mundial de fútbol?",["1930","1950","1920","1934"]],
["¿En qué país se celebró el primer Mundial de fútbol?",["Uruguay","Brasil","Italia","Argentina"]],
["¿Cuántos jugadores tiene un equipo de fútbol en el campo?",["11","10","12","9"]],
["¿Cada cuántos años se celebran los Juegos Olímpicos de verano?",["4","2","3","5"]],
["¿Qué país ha ganado más Mundiales de fútbol?",["Brasil","Alemania","Italia","Argentina"]],
["¿Cuántos puntos vale un triple en baloncesto?",["3","2","1","4"]],
["¿En qué deporte se usa raqueta y volante (pluma)?",["Bádminton","Tenis","Squash","Pádel"]],
["¿Cuánto dura un partido de fútbol reglamentario, sin descuento?",["90 minutos","80 minutos","100 minutos","120 minutos"]],
["¿En qué país nació el fútbol moderno?",["Inglaterra","Brasil","Italia","España"]],
["¿Qué selección ganó el Mundial de 2022?",["Argentina","Francia","Brasil","Croacia"]],
["¿Cuántos jugadores tiene un equipo de voleibol en la cancha?",["6","5","7","8"]],
["¿En qué ciudad juegan de local The Strongest y Bolívar?",["La Paz","Cochabamba","Santa Cruz","Oruro"]],
["¿Cuántos anillos tiene la bandera olímpica?",["5","4","6","7"]],
["¿Cómo se llama el mago protagonista de la saga de J. K. Rowling?",["Harry Potter","Frodo","Percy Jackson","Gandalf"]],
["¿Qué instrumento tiene 88 teclas?",["El piano","La guitarra","El acordeón","El arpa"]],
["¿Cuántas cuerdas tiene una guitarra clásica?",["6","4","5","7"]],
["¿Qué superhéroe viene del planeta Krypton?",["Superman","Batman","Spider-Man","Thor"]],
["¿En qué ciudad está la Torre Eiffel?",["París","Londres","Roma","Berlín"]],
["¿Qué baile es típico de Argentina?",["El tango","La samba","La cumbia","La salsa"]],
["¿Qué baile es originario de Brasil?",["La samba","El tango","El merengue","La bachata"]],
["¿Cómo se llama el ratón más famoso de Disney?",["Mickey","Jerry","Stuart","Remy"]],
["¿Qué banda británica cantaba «Yesterday»?",["The Beatles","The Rolling Stones","Queen","Pink Floyd"]],
["¿Cómo se llama la moneda de Japón?",["El yen","El won","El yuan","La rupia"]],
["¿Cuántos colores tiene el arcoíris, según se enseña tradicionalmente?",["7","6","5","8"]],
["¿Qué fiesta boliviana es famosa por la diablada?",["El Carnaval de Oruro","La Fiesta del Gran Poder","Alasitas","Todos Santos"]],
["¿Qué instrumento andino de cuerdas se hacía tradicionalmente con caparazón de quirquincho?",["El charango","La zampoña","La quena","El bombo"]],
["¿Cuál es el idioma con más hablantes nativos del mundo?",["El chino mandarín","El inglés","El español","El hindi"]],
["¿En qué idioma se escribió originalmente «El Principito»?",["Francés","Inglés","Español","Alemán"]],
["¿Cuántos días tiene un año bisiesto?",["366","365","364","360"]],
["¿Qué empresa creó el iPhone?",["Apple","Samsung","Google","Microsoft"]],
["¿Qué comida boliviana de media mañana es una masa rellena de carne con caldito?",["La salteña","El tamal","La arepa","La humita"]],
["¿De qué país es originaria la pizza?",["Italia","Francia","Grecia","España"]],
["¿Cuál es el ingrediente principal del guacamole?",["El aguacate (palta)","El tomate","El pimiento","El maíz"]],
["¿De qué se obtiene el chocolate?",["Del cacao","Del café","De la vainilla","De la caña"]],
["¿Qué bebida se prepara con hojas de yerba mate?",["El mate","El té verde","El café","La chicha"]],
["¿Qué comida japonesa combina arroz con pescado crudo?",["El sushi","El ramen","La tempura","El miso"]],
["¿Cuál es el plural de «el lápiz»?",["Los lápices","Los lápizes","Los lápiz","Los lapizes"]],
["¿Cuántas letras tiene el alfabeto español actual?",["27","26","28","29"]],
["¿Cuál es un sinónimo de «rápido»?",["Veloz","Lento","Pesado","Tardo"]],
["¿Cuánto es 7 × 8?",["56","54","64","48"]],
["¿Cuál es la raíz cuadrada de 144?",["12","14","11","13"]],
["Si un tren sale a las 9:40 y tarda 50 minutos, ¿a qué hora llega?",["10:30","10:20","10:40","10:10"]],
["¿Cuántos minutos tiene un día?",["1440","1240","1400","1640"]],
["¿Cuántos gramos tiene un kilo?",["1000","100","10 000","500"]],
["¿Cuál de estos números es primo?",["17","15","21","27"]],
["¿Cuál es el 25 % de 200?",["50","25","75","40"]],
["¿Qué mes tiene 28 días en un año no bisiesto?",["Febrero","Enero","Abril","Junio"]],
["¿Cuál es el felino más grande de América?",["El jaguar","El puma","El ocelote","El lince"]],
["¿Cuál es el ave nacional de Bolivia?",["El cóndor","El águila","El tucán","El colibrí"]],
["¿Cuántas patas tiene una araña?",["8","6","10","4"]],
["¿Qué animal produce la miel?",["La abeja","La avispa","La hormiga","La mariposa"]],
["¿Cuál es el ave más grande que no vuela?",["El avestruz","El pingüino","El ñandú","El kiwi"]],
["¿Cuál es el reptil vivo más grande?",["El cocodrilo de agua salada","La anaconda","La tortuga laúd","El dragón de Komodo"]],
["¿Qué planeta tiene los anillos más visibles?",["Saturno","Júpiter","Urano","Neptuno"]],
["¿Cuál es la moneda de Bolivia?",["El boliviano","El peso","El sol","El bolívar"]],
["¿Cuál es la moneda de Perú?",["El sol","El peso","El boliviano","El real"]],
["¿De qué país es capital Lima?",["Perú","Ecuador","Chile","Colombia"]],
["¿Cuál es la capital de Argentina?",["Buenos Aires","Córdoba","Rosario","Mendoza"]],
["¿Cuál es la capital de Colombia?",["Bogotá","Medellín","Cali","Cartagena"]],
["¿Con cuántos países limita Bolivia?",["5","4","6","3"]],
["¿Cuál es el departamento más poblado de Bolivia?",["Santa Cruz","La Paz","Cochabamba","Potosí"]],
["¿Qué ciudad boliviana es famosa por su Cerro Rico?",["Potosí","Oruro","Sucre","Tarija"]],
["¿Cuál es la lengua indígena más hablada en Bolivia?",["El quechua","El aymara","El guaraní","El mojeño"]],
["¿Cuál es el sistema operativo de Google para móviles?",["Android","iOS","Windows","Linux"]],
["¿Qué significa «www» en una dirección web?",["World Wide Web","World Web Wide","Web World Wide","Wide World Web"]],
["¿Cuántos bits tiene un byte?",["8","4","16","10"]],
["¿Qué es el ADN?",["La molécula con la información genética","Una proteína de los músculos","Un tipo de azúcar","Un virus"]],
["¿Quién compuso la Novena Sinfonía, con el «Himno a la alegría»?",["Beethoven","Mozart","Bach","Vivaldi"]],
["¿Cuántos jugadores tiene un equipo de básquetbol en la cancha?",["5","6","7","4"]],
["¿Qué pieza de ajedrez solo se mueve en diagonal?",["El alfil","La torre","El caballo","El peón"]],
["¿Cuántas casillas tiene un tablero de ajedrez?",["64","100","81","49"]],
["¿Cuántos jugadores tiene en cancha un equipo de fútbol sala?",["5","6","7","11"]],
["¿Cuál es la capital de España?",["Madrid","Barcelona","Sevilla","Valencia"]],
["¿Cuál es la capital de Chile?",["Santiago","Valparaíso","Concepción","Antofagasta"]],
["¿Cuál es la capital de Paraguay?",["Asunción","Ciudad del Este","Encarnación","Montevideo"]],
["¿Cuál es el metal que mejor conduce la electricidad de estos?",["La plata","El hierro","El plomo","El estaño"]],
["¿Cuántos segundos tiene una hora?",["3600","360","6000","1800"]],
["¿Cuál es el resultado de 15 × 4?",["60","54","64","45"]],
["¿Cuántos ceros tiene un millón?",["6","5","7","9"]],
["¿Qué vitamina aporta sobre todo el sol a la piel?",["La vitamina D","La vitamina C","La vitamina A","La vitamina B12"]],
["¿Qué instrumento mide la temperatura?",["El termómetro","El barómetro","El altímetro","El cronómetro"]],
["¿Cuál es el continente más poblado?",["Asia","África","Europa","América"]],
["¿Cuántos años tiene un siglo?",["100","10","1000","50"]]
];

var PENITENCIAS=[
"Canta el estribillo de la última canción que escuchaste.",
"Habla con acento extranjero hasta la próxima ronda.",
"Cuenta un chiste; si nadie se ríe, cuenta otro.",
"Haz diez sentadillas mientras dices el abecedario.",
"Imita a alguien del grupo hasta que adivinen quién es.",
"Baila treinta segundos sin música.",
"Di tres cosas buenas de cada persona del grupo.",
"Habla solo con preguntas durante cinco minutos.",
"Recita un trabalenguas tres veces seguidas.",
"Sé quien sirve las bebidas durante la próxima ronda.",
"Cuenta tu momento más vergonzoso.",
"Manda un mensaje de voz cantando a tu madre.",
"Llama a alguien y cántale el cumpleaños feliz aunque no sea su cumpleaños.",
"Deja que el ganador te ponga un apodo hasta el final del reto.",
"Recoge la mesa (o lava los platos) cuando termine la reunión.",
"Haz una postura de yoga y mantenla treinta segundos.",
"Cuenta hasta veinte en otro idioma (vale inventarlo).",
"Improvisa un poema sobre el ganador.",
"Sostén una cuchara en la nariz durante un minuto.",
"Camina como un cangrejo de un lado a otro de la sala.",
"Haz tu mejor imitación de un animal que elija el grupo.",
"Lleva un calcetín en la mano durante la próxima ronda.",
"Cuenta una historia de terror con voz de bebé.",
"Di un piropo respetuoso a la persona de tu derecha.",
"Haz de estatua un minuto; si te mueves, otro minuto más.",
"Invita al próximo refresco de la mesa.",
"Haz quince saltos de tijera contando en voz alta.",
"Recita la tabla del 7 al revés.",
"Deja que el grupo te haga un peinado nuevo.",
"Habla en tercera persona hasta la siguiente ronda.",
"Di diez países que empiecen por la misma letra en treinta segundos.",
"Canta una canción cambiando todas las vocales por la i.",
"Da un discurso de un minuto sobre por qué perdiste.",
"Cuenta la partida como si fueras presentador de noticias.",
"Aplaude al ganador veinte segundos sin parar.",
"Sé el fotógrafo oficial del grupo el resto de la reunión.",
"Deja que el ganador elija tu fondo de pantalla por un día.",
"Explica las reglas del sudoku como si fueras un pirata.",
"Haz cinco flexiones o, si no puedes, cinco reverencias al ganador.",
"Cuéntale a la persona de tu izquierda un secreto inofensivo."
];

/* ---------- generación de una ronda ---------- */
function genera(juego,seed){
  var r=rng(seed), i;
  if(juego==="trivia"){
    var idx=baraja(BANCO.map(function(_,j){return j;}),r).slice(0,10);
    return {p:idx.map(function(j){
      var q=BANCO[j], orden=baraja([0,1,2,3],r);
      return {q:q[0],o:orden.map(function(k){return q[1][k];}),c:orden.indexOf(0)};
    })};
  }
  if(juego==="memoria"){
    var s=[],ult=-1;
    for(i=0;i<14;i++){var c;do{c=entre(r,0,8);}while(c===ult);s.push(c);ult=c;}
    return {s:s};
  }
  if(juego==="calculo"){
    var p=[];
    for(i=0;i<40;i++){
      var t=entre(r,0,2),a,b;
      if(t===0){a=entre(r,2,99);b=entre(r,2,99);p.push({t:a+" + "+b,r:a+b});}
      else if(t===1){a=entre(r,10,99);b=entre(r,2,a);p.push({t:a+" − "+b,r:a-b});}
      else{a=entre(r,2,12);b=entre(r,2,12);p.push({t:a+" × "+b,r:a*b});}
    }
    return {p:p};
  }
  if(juego==="reflejos"){
    var d=[]; for(i=0;i<5;i++)d.push(entre(r,1000,3500));
    return {d:d};
  }
  if(juego==="numeros"){
    var n=[]; for(i=1;i<=25;i++)n.push(i);
    return {n:baraja(n,r)};
  }
  return null;
}

/* ---------- evaluación de lo que envía el jugador ----------
   Devuelve {score, seconds} o null si el envío no es válido.
   score: puntos (más es mejor) o milisegundos (menos es mejor),
   según JUEGOS[juego].orden. */
function evalua(juego,datos,e){
  if(!datos||!e||typeof e!=="object")return null;
  var i, score=0, ms=0;
  if(juego==="trivia"){
    var rs=e.r; if(!Array.isArray(rs)||rs.length!==10)return null;
    for(i=0;i<10;i++){
      var x=rs[i]||{}, t=parseInt(x.ms,10), o=parseInt(x.o,10);
      if(!(t>=0)||t>12500)return null;
      /* nadie lee y acierta en menos de 250 ms: esa respuesta no puntúa */
      if(o===datos.p[i].c&&t>=250)score+=100+Math.floor(Math.max(0,12000-t)/12000*60);
      ms+=t;
    }
    return {score:score,seconds:Math.max(1,Math.round(ms/1000))};
  }
  if(juego==="memoria"){
    var n=parseInt(e.n,10), t2=parseInt(e.ms,10);
    if(!(n>=0&&n<=14)||!(t2>=0))return null;
    /* como mínimo, lo que tardan en enseñarse las secuencias completadas */
    var minimo=0; for(i=3;i<=n;i++)minimo+=i*700;
    if(t2<minimo*0.5)return null;
    return {score:n,seconds:Math.max(1,Math.round(t2/1000))};
  }
  if(juego==="calculo"){
    var ans=e.r; if(!Array.isArray(ans)||ans.length>40)return null;
    for(i=0;i<ans.length;i++){ if(ans[i]===null||ans[i]===undefined)continue; if(parseInt(ans[i],10)===datos.p[i].r)score++; }
    return {score:score,seconds:45};
  }
  if(juego==="reflejos"){
    var ts=e.t; if(!Array.isArray(ts)||ts.length!==5)return null;
    var suma=0;
    for(i=0;i<5;i++){var v=parseInt(ts[i],10); if(!(v>=0)||v>5000)return null; if(v<120)v=1000; suma+=v; ms+=datos.d[i]+v;}
    return {score:Math.round(suma/5),seconds:Math.max(1,Math.round(ms/1000))};
  }
  if(juego==="numeros"){
    var t3=parseInt(e.ms,10), f=parseInt(e.f,10)||0;
    if(!(t3>=4000)||t3>600000||f<0||f>200)return null;
    return {score:t3+f*1000,seconds:Math.max(1,Math.round((t3+f*1000)/1000))};
  }
  return null;
}

/* ---------- cómo se enseña una marca ---------- */
function formato(juego,score,seconds){
  if(juego==="trivia")return score+" pts";
  if(juego==="memoria")return score+(score===1?" casilla":" casillas");
  if(juego==="calculo")return score+(score===1?" acierto":" aciertos");
  if(juego==="reflejos")return score+" ms";
  if(juego==="numeros")return (score/1000).toFixed(1).replace(".",",")+" s";
  var m=Math.floor(seconds/60),g=seconds%60; return m+":"+(g<10?"0":"")+g;
}
/* comparación según el juego: negativo si a va antes que b */
function compara(juego,a,b){
  var o=(JUEGOS[juego]||{}).orden||"tiempo";
  if(o==="puntos")return (b.score-a.score)||(a.seconds-b.seconds);
  if(o==="menos")return (a.score-b.score)||(a.seconds-b.seconds);
  return a.seconds-b.seconds;
}

G.AxRapidos={JUEGOS:JUEGOS,BANCO:BANCO,PENITENCIAS:PENITENCIAS,semilla:semilla,rng:rng,
             genera:genera,evalua:evalua,formato:formato,compara:compara};
})(typeof globalThis!=="undefined"?globalThis:this);
