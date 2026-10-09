/* ===========================================================
   THE FINAL TEST · Inglés para niñas y niños · el motor
   -----------------------------------------------------------
   Un curso de inglés inicial por unidades (saludos, colores,
   números, animales, familia, comida…). Cada unidad es un camino
   de lecciones cortas:
     Palabras 1, 2, 3   palabras nuevas con dibujo y sonido
     Frases             armar y entender frases sencillas
     Escucha y habla    oír, deletrear y decir en voz alta
     Reto               todo lo de la unidad
   Los ejercicios se mezclan (elegir el dibujo, escuchar, traducir,
   parejas, deletrear, armar la frase, completar, hablar). Lo que
   se falla vuelve al final de la lección, y cada palabra guarda su
   fuerza: las más débiles vuelven en «Repasar mis palabras».
   Sin dependencias: lo usan el navegador y las pruebas.
   =========================================================== */
(function(G){
"use strict";
function rng(seed){var a=seed>>>0||1; return function(){a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296;};}
function ri(r,a,b){return a+Math.floor(r()*(b-a+1));}
function pick(r,a){return a[Math.floor(r()*a.length)];}
function baraja(r,a){a=a.slice(); for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;} return a;}
/* para comparar: minúsculas, sin signos de puntuación ni espacios de más */
function norm(s){return String(s==null?"":s).toLowerCase().replace(/[’']/g,"'").replace(/[.,!?¡¿;:"«»]/g," ").replace(/\s+/g," ").trim();}
function fichas(s){return String(s).replace(/[.,!?¡¿;:"«»]/g," ").split(/\s+/).filter(Boolean);}

/* ---------- el curso ----------
   palabra: [inglés, español, dibujo, color opcional (para los colores)]
   frase:   [inglés, español] */
var UNIDADES=[
 {id:"u1",nom:"¡Hola!",en:"Hello!",ico:"👋",col:"#58cc02",col2:"#8ee000",
  pal:[["hello","hola","👋"],["goodbye","adiós","🚪"],["good morning","buenos días","🌅"],["good night","buenas noches","🌙"],["please","por favor","🙏"],["thank you","gracias","💐"],["yes","sí","👍"],["no","no","👎"],["friend","amigo","🤝"],["name","nombre","📛"]],
  fra:[["Hello, my friend!","¡Hola, mi amigo!"],["Thank you!","¡Gracias!"],["Good morning!","¡Buenos días!"],["Goodbye, my friend!","¡Adiós, mi amigo!"],["Yes, please.","Sí, por favor."],["No, thank you.","No, gracias."],["My name is Leo.","Mi nombre es Leo."],["Good night!","¡Buenas noches!"]]},
 {id:"u2",nom:"Los colores",en:"Colors",ico:"🎨",col:"#ff4b9a",col2:"#ff8ac2",
  pal:[["red","rojo","🍎","#e53935"],["blue","azul","🌊","#1e88e5"],["yellow","amarillo","🌻","#fdd835"],["green","verde","🐸","#43a047"],["orange","anaranjado","🍊","#fb8c00"],["purple","morado","🍇","#8e24aa"],["pink","rosado","🌸","#f06292"],["black","negro","🎱","#212121"],["white","blanco","☁️","#fafafa"],["brown","café","🐻","#795548"]],
  fra:[["It is red.","Es rojo."],["I like blue.","Me gusta el azul."],["It is green.","Es verde."],["I like pink.","Me gusta el rosado."],["It is black and white.","Es negro y blanco."],["Red, blue and yellow.","Rojo, azul y amarillo."],["It is not brown.","No es café."],["I like purple.","Me gusta el morado."]]},
 {id:"u3",nom:"Los números",en:"Numbers",ico:"🔢",col:"#1cb0f6",col2:"#62d0ff",
  pal:[["one","uno","1️⃣"],["two","dos","2️⃣"],["three","tres","3️⃣"],["four","cuatro","4️⃣"],["five","cinco","5️⃣"],["six","seis","6️⃣"],["seven","siete","7️⃣"],["eight","ocho","8️⃣"],["nine","nueve","9️⃣"],["ten","diez","🔟"]],
  fra:[["I am seven.","Tengo siete años."],["One, two, three!","¡Uno, dos, tres!"],["I am six.","Tengo seis años."],["Five and five is ten.","Cinco y cinco es diez."],["I have two friends.","Tengo dos amigos."],["Four, five, six!","¡Cuatro, cinco, seis!"],["I am eight.","Tengo ocho años."]]},
 {id:"u4",nom:"Los animales",en:"Animals",ico:"🐶",col:"#ff9600",col2:"#ffc247",
  pal:[["dog","perro","🐶"],["cat","gato","🐱"],["bird","pájaro","🐦"],["fish","pez","🐟"],["cow","vaca","🐮"],["horse","caballo","🐴"],["duck","pato","🦆"],["rabbit","conejo","🐰"],["lion","león","🦁"],["elephant","elefante","🐘"],["monkey","mono","🐵"],["frog","rana","🐸"]],
  fra:[["I have a dog.","Tengo un perro."],["The cat is black.","El gato es negro."],["I like lions.","Me gustan los leones."],["The fish is orange.","El pez es anaranjado."],["It is a duck.","Es un pato."],["The frog is green.","La rana es verde."],["I have two rabbits.","Tengo dos conejos."],["The elephant is gray.","El elefante es gris."]]},
 {id:"u5",nom:"La familia",en:"Family",ico:"👨‍👩‍👧",col:"#ce82ff",col2:"#e3b5ff",
  pal:[["mother","mamá","👩"],["father","papá","👨"],["sister","hermana","👧"],["brother","hermano","👦"],["baby","bebé","👶"],["grandmother","abuela","👵"],["grandfather","abuelo","👴"],["family","familia","👨‍👩‍👧"]],
  fra:[["This is my mother.","Esta es mi mamá."],["I love my family.","Amo a mi familia."],["My brother is six.","Mi hermano tiene seis años."],["This is my grandfather.","Este es mi abuelo."],["I have a sister.","Tengo una hermana."],["The baby is small.","El bebé es pequeño."],["I love my father.","Amo a mi papá."]]},
 {id:"u6",nom:"La comida",en:"Food",ico:"🍎",col:"#ff4b4b",col2:"#ff8a80",
  pal:[["apple","manzana","🍎"],["banana","plátano","🍌"],["bread","pan","🍞"],["milk","leche","🥛"],["water","agua","💧"],["egg","huevo","🥚"],["cheese","queso","🧀"],["cake","pastel","🎂"],["juice","jugo","🧃"],["rice","arroz","🍚"],["chicken","pollo","🍗"],["ice cream","helado","🍦"]],
  fra:[["I like apples.","Me gustan las manzanas."],["I want water, please.","Quiero agua, por favor."],["The cake is pink.","El pastel es rosado."],["I eat bread.","Yo como pan."],["I drink milk.","Yo tomo leche."],["I like ice cream.","Me gusta el helado."],["I want rice and chicken.","Quiero arroz y pollo."]]},
 {id:"u7",nom:"Mi cuerpo",en:"My body",ico:"🙂",col:"#00c2a8",col2:"#5ee6d0",
  pal:[["face","cara","🙂"],["eyes","ojos","👀"],["nose","nariz","👃"],["mouth","boca","👄"],["ears","orejas","👂"],["hand","mano","✋"],["foot","pie","🦶"],["hair","cabello","💇"],["arm","brazo","💪"],["leg","pierna","🦵"],["teeth","dientes","🦷"]],
  fra:[["I have two eyes.","Tengo dos ojos."],["This is my nose.","Esta es mi nariz."],["My hair is brown.","Mi cabello es café."],["Touch your nose.","Toca tu nariz."],["I have two hands.","Tengo dos manos."],["Open your mouth.","Abre tu boca."],["I wash my face.","Me lavo la cara."]]},
 {id:"u8",nom:"La ropa",en:"Clothes",ico:"👕",col:"#7c5cff",col2:"#a993ff",
  pal:[["shirt","camisa","👕"],["pants","pantalón","👖"],["shoes","zapatos","👟"],["hat","sombrero","👒"],["dress","vestido","👗"],["socks","calcetines","🧦"],["jacket","chaqueta","🧥"],["glasses","lentes","👓"],["cap","gorra","🧢"]],
  fra:[["I have a red hat.","Tengo un sombrero rojo."],["My shoes are white.","Mis zapatos son blancos."],["The dress is pink.","El vestido es rosado."],["I like my jacket.","Me gusta mi chaqueta."],["My socks are blue.","Mis calcetines son azules."],["This is my cap.","Esta es mi gorra."]]},
 {id:"u9",nom:"La escuela",en:"School",ico:"🏫",col:"#1cb0f6",col2:"#7fd6ff",
  pal:[["book","libro","📖"],["pencil","lápiz","✏️"],["bag","mochila","🎒"],["teacher","profesor","🧑‍🏫"],["school","escuela","🏫"],["scissors","tijeras","✂️"],["crayon","crayón","🖍️"],["ruler","regla","📏"],["computer","computadora","💻"],["chair","silla","🪑"]],
  fra:[["This is my book.","Este es mi libro."],["I have a pencil.","Tengo un lápiz."],["My bag is blue.","Mi mochila es azul."],["Good morning, teacher!","¡Buenos días, profesor!"],["I like my school.","Me gusta mi escuela."],["I have red crayons.","Tengo crayones rojos."]]},
 {id:"u10",nom:"Mi casa",en:"My house",ico:"🏠",col:"#ff9600",col2:"#ffc46b",
  pal:[["house","casa","🏠"],["door","puerta","🚪"],["window","ventana","🪟"],["bed","cama","🛏️"],["bathroom","baño","🛁"],["kitchen","cocina","🍳"],["garden","jardín","🌷"],["sofa","sofá","🛋️"],["lamp","lámpara","💡"],["TV","televisión","📺"]],
  fra:[["This is my house.","Esta es mi casa."],["The door is red.","La puerta es roja."],["I sleep in my bed.","Yo duermo en mi cama."],["The cat is on the sofa.","El gato está en el sofá."],["Mom is in the kitchen.","Mamá está en la cocina."],["I like my garden.","Me gusta mi jardín."]]},
 {id:"u11",nom:"Acciones",en:"Actions",ico:"🏃",col:"#58cc02",col2:"#a5e85c",
  pal:[["run","correr","🏃"],["jump","saltar","🦘"],["swim","nadar","🏊"],["eat","comer","🍽️"],["drink","beber","🥤"],["sleep","dormir","😴"],["read","leer","📚"],["write","escribir","✍️"],["sing","cantar","🎤"],["dance","bailar","💃"],["play","jugar","⚽"]],
  fra:[["I can run.","Yo puedo correr."],["I like to dance.","Me gusta bailar."],["Fish can swim.","Los peces pueden nadar."],["I read a book.","Yo leo un libro."],["Birds can sing.","Los pájaros pueden cantar."],["I play with my friend.","Yo juego con mi amigo."],["I can jump.","Yo puedo saltar."]]},
 {id:"u12",nom:"Emociones",en:"Feelings",ico:"😊",col:"#ffc800",col2:"#ffe066",
  pal:[["happy","feliz","😊"],["sad","triste","😢"],["angry","enojado","😠"],["tired","cansado","🥱"],["scared","asustado","😨"],["hungry","con hambre","🤤"],["surprised","sorprendido","😮"],["calm","tranquilo","😌"]],
  fra:[["I am happy.","Estoy feliz."],["The baby is sad.","El bebé está triste."],["I am hungry.","Tengo hambre."],["Are you tired?","¿Estás cansado?"],["My dog is happy.","Mi perro está feliz."],["I am not scared.","No tengo miedo."]]},
 {id:"u13",nom:"El clima",en:"Weather",ico:"🌈",col:"#1cb0f6",col2:"#9be3ff",
  pal:[["sun","sol","☀️"],["rain","lluvia","🌧️"],["cloud","nube","☁️"],["wind","viento","🌬️"],["snow","nieve","❄️"],["rainbow","arcoíris","🌈"],["hot","calor","🥵"],["cold","frío","🥶"],["star","estrella","⭐"],["moon","luna","🌙"]],
  fra:[["It is sunny.","Hace sol."],["It is cold.","Hace frío."],["I like the rain.","Me gusta la lluvia."],["The sun is yellow.","El sol es amarillo."],["I see a rainbow.","Veo un arcoíris."],["It is hot today.","Hoy hace calor."]]},
 {id:"u14",nom:"Juguetes",en:"Toys",ico:"🧸",col:"#ff4b9a",col2:"#ffa3cd",
  pal:[["ball","pelota","🏀"],["doll","muñeca","🪆"],["teddy bear","osito","🧸"],["kite","cometa","🪁"],["car","auto","🚗"],["train","tren","🚂"],["robot","robot","🤖"],["balloon","globo","🎈"],["blocks","bloques","🧱"],["puzzle","rompecabezas","🧩"]],
  fra:[["I have a red ball.","Tengo una pelota roja."],["My robot is big.","Mi robot es grande."],["I play with my teddy bear.","Juego con mi osito."],["The kite is blue.","La cometa es azul."],["Where is my car?","¿Dónde está mi auto?"],["I like trains.","Me gustan los trenes."]]},
 {id:"u15",nom:"Opuestos",en:"Opposites",ico:"🐘",col:"#7c5cff",col2:"#b9a6ff",
  pal:[["big","grande","🐳"],["small","pequeño","🐜"],["fast","rápido","🐆"],["slow","lento","🐢"],["tall","alto","🦒"],["short","bajo","🐧"],["new","nuevo","🎁"],["old","viejo","🏚️"],["clean","limpio","🧼"],["dirty","sucio","🐷"]],
  fra:[["The elephant is big.","El elefante es grande."],["The ant is small.","La hormiga es pequeña."],["My bag is new.","Mi mochila es nueva."],["The cat is fast.","El gato es rápido."],["The giraffe is tall.","La jirafa es alta."],["My shoes are dirty.","Mis zapatos están sucios."]]}
];
var PAL={}, LISTA=[];
UNIDADES.forEach(function(u,ui){
  u.n=ui;
  u.palabras=u.pal.map(function(p){var w={en:p[0],es:p[1],e:p[2],c:p[3]||null,u:ui}; PAL[p[0]]=w; LISTA.push(w); return w;});
  u.frases=u.fra.map(function(f){return {en:f[0],es:f[1],u:ui};});
  u.lecciones=leccionesDe(u);
});
/* las lecciones de una unidad: grupos de 4 palabras nuevas (el último no queda de 1 o 2), frases, escucha y reto */
function leccionesDe(u){
  var ws=u.palabras.map(function(w){return w.en;}), grupos=[], i;
  for(i=0;i<ws.length;i+=4)grupos.push(ws.slice(i,i+4));
  if(grupos.length>1&&grupos[grupos.length-1].length<3){var ult=grupos.pop(); grupos[grupos.length-1]=grupos[grupos.length-1].concat(ult);}
  var out=[], vistas=[];
  grupos.forEach(function(g,k){out.push({tipo:"palabras",nom:"Palabras "+(k+1),ico:"⭐",nuevas:g,repaso:vistas.slice()}); vistas=vistas.concat(g);});
  out.push({tipo:"frases",nom:"Frases",ico:"💬"});
  out.push({tipo:"escucha",nom:"Escucha y habla",ico:"🎧"});
  out.push({tipo:"reto",nom:"Reto de la unidad",ico:"🏆"});
  out.forEach(function(l,k){l.id=u.id+"l"+(k+1); l.u=u.n; l.k=k;});
  return out;
}
var POR_ID={}; UNIDADES.forEach(function(u){u.lecciones.forEach(function(l){POR_ID[l.id]=l;});});

/* ---------- ejercicios ---------- */
/* opciones distintas (también en el dibujo) de la unidad y, si faltan, de las vistas */
function otras(r,w,n,pool){
  var c=baraja(r,pool.filter(function(x){return x.en!==w.en&&x.e!==w.e&&x.es!==w.es;}));
  var out=[]; c.forEach(function(x){if(out.length<n&&!out.some(function(y){return y.e===x.e||y.es===x.es;}))out.push(x);}); return out;
}
function conOk(r,w,dis){var ops=baraja(r,[w].concat(dis)); return {ops:ops.map(function(x){return x.en;}),ok:ops.indexOf(w)};}
var GEN={
  nueva:function(r,w){return {t:"nueva",w:w.en};},
  imagen:function(r,w,pool,n){var o=conOk(r,w,otras(r,w,n||3,pool)); return {t:"imagen",w:w.en,ops:o.ops,ok:o.ok};},
  escucha:function(r,w,pool){var o=conOk(r,w,otras(r,w,3,pool)); return {t:"escucha",w:w.en,ops:o.ops,ok:o.ok};},
  traduce:function(r,w,pool){var o=conOk(r,w,otras(r,w,2,pool)); return {t:"traduce",w:w.en,ops:o.ops,ok:o.ok};},
  alreves:function(r,w,pool){var o=conOk(r,w,otras(r,w,2,pool)); return {t:"alreves",w:w.en,ops:o.ops,ok:o.ok};},
  deletrea:function(r,w){var letras=w.en.replace(/\s/g,"").toLowerCase().split(""), extra="aeioubcdgmnprst".split("").filter(function(x){return letras.indexOf(x)<0;});
    return {t:"deletrea",w:w.en,letras:baraja(r,letras.concat(baraja(r,extra).slice(0,2)))};},
  habla:function(r,w){return {t:"habla",w:w.en};}
};
function parejas(r,ws){return {t:"parejas",ws:ws.map(function(w){return w.en;}),der:baraja(r,ws.map(function(w){return w.en;}))};}
function fraseEn(r,f,u){var tok=fichas(f.en), otras2=[];
  u.frases.forEach(function(g){fichas(g.en).forEach(function(x){if(tok.map(norm).indexOf(norm(x))<0&&otras2.map(norm).indexOf(norm(x))<0)otras2.push(x);});});
  return {t:"frase_en",f:[f.en,f.es],fichas:baraja(r,tok.concat(baraja(r,otras2).slice(0,Math.min(3,Math.max(2,Math.round(tok.length/2))))))};}
function fraseEs(r,f,u,audio){var dis=baraja(r,u.frases.filter(function(g){return g.es!==f.es;})).slice(0,2), ops=baraja(r,[f].concat(dis));
  return {t:"frase_es",f:[f.en,f.es],ops:ops.map(function(x){return x.es;}),ok:ops.indexOf(f),audio:!!audio};}
function completa(r,f,u){
  var tok=fichas(f.en), vocab=u.palabras.map(function(w){return w.en.toLowerCase();}), cand=[];
  tok.forEach(function(t,i){if(vocab.indexOf(t.toLowerCase())>=0)cand.push(i);});
  if(!cand.length)tok.forEach(function(t,i){if(t.length>2)cand.push(i);});
  var i=pick(r,cand), ok=tok[i], dis=baraja(r,u.palabras.filter(function(w){return norm(w.en)!==norm(ok)&&w.en.indexOf(" ")<0&&tok.map(norm).indexOf(norm(w.en))<0;})).slice(0,2).map(function(w){return w.en;});
  var ops=baraja(r,[ok].concat(dis));
  return {t:"completa",f:[f.en,f.es],hueco:i,ops:ops,ok:ops.indexOf(ok)};
}
/* las palabras para repasar: primero las débiles y las que se fallaron */
function debiles(prog,lista){
  var pal=(prog&&prog.pal)||{};
  return lista.slice().sort(function(a,b){var pa=pal[a.en]||{f:0,e:0}, pb=pal[b.en]||{f:0,e:0}; return (pa.f-pa.e*0.5)-(pb.f-pb.e*0.5);});
}
/* genera los ejercicios de una lección. ctx: {prog, voz, mic} */
function genera(lecId,seed,ctx){
  ctx=ctx||{}; var r=rng(seed>>>0), l=POR_ID[lecId]; if(!l)return [];
  var u=UNIDADES[l.u], pool=u.palabras, its=[], tipos, i;
  function de(en){return PAL[en];}
  function ponTipo(t){return (t==="escucha"&&!ctx.sinVoz)||t!=="escucha"?t:"imagen";}
  if(l.tipo==="palabras"){
    var nuevas=l.nuevas.map(de), viejas=l.repaso.map(de), todas=nuevas.concat(viejas);
    nuevas.forEach(function(w){its.push(GEN.nueva(r,w)); its.push(GEN[ponTipo(pick(r,["imagen","imagen","escucha"]))](r,w,pool));});
    var par=baraja(r,nuevas).concat(debiles(ctx.prog,viejas)).slice(0,5); if(par.length>=3)its.push(parejas(r,par));
    tipos=baraja(r,["traduce","alreves","escucha","deletrea","alreves","imagen"]);
    for(i=0;i<tipos.length;i++){var w=i%2?pick(r,nuevas):pick(r,todas.length>nuevas.length&&r()<0.4?debiles(ctx.prog,viejas).slice(0,3):nuevas);
      var t=ponTipo(tipos[i]); if(t==="deletrea"&&(w.en.length>8||w.en.indexOf(" ")>=0))t="alreves"; its.push(GEN[t](r,w,pool));}
  } else if(l.tipo==="frases"){
    var fs=baraja(r,u.frases);
    its.push(fraseEs(r,fs[0],u,false),fraseEs(r,fs[1],u,false),completa(r,fs[2],u),fraseEn(r,fs[0],u),completa(r,fs[3%fs.length],u),fraseEn(r,fs[1],u),fraseEs(r,fs[4%fs.length],u,!ctx.sinVoz),fraseEn(r,fs[2],u),completa(r,fs[5%fs.length],u),fraseEn(r,fs[3%fs.length],u));
  } else if(l.tipo==="escucha"){
    var ws=baraja(r,pool);
    for(i=0;i<4;i++)its.push(GEN[ponTipo("escucha")](r,ws[i],pool));
    for(i=4;i<7;i++){var w2=ws[i%ws.length]; its.push(w2.en.length<=8&&w2.en.indexOf(" ")<0?GEN.deletrea(r,w2):GEN.alreves(r,w2,pool));}
    if(ctx.mic){its.push(GEN.habla(r,ws[7%ws.length])); its.push({t:"habla",f:[pick(r,u.frases).en,""]});}
    its.push(fraseEs(r,pick(r,u.frases),u,!ctx.sinVoz));
    its.push(parejas(r,ws.slice(0,5)));
  } else {
    var ws3=baraja(r,pool), fs3=baraja(r,u.frases);
    its.push(parejas(r,ws3.slice(0,5)));
    tipos=["imagen","escucha","traduce","alreves","deletrea","escucha","alreves"];
    tipos.forEach(function(t,k){var w=ws3[(k+5)%ws3.length]; t=ponTipo(t); if(t==="deletrea"&&(w.en.length>8||w.en.indexOf(" ")>=0))t="traduce"; its.push(t==="imagen"?GEN.imagen(r,w,pool,3):GEN[t](r,w,pool));});
    its.push(fraseEn(r,fs3[0],u),completa(r,fs3[1],u),fraseEs(r,fs3[2],u,!ctx.sinVoz),fraseEn(r,fs3[3%fs3.length],u));
  }
  return its;
}
/* repaso personal: las palabras más débiles de las ya vistas */
function repaso(seed,ctx){
  ctx=ctx||{}; var r=rng(seed>>>0), vistas=LISTA.filter(function(w){var p=ctx.prog&&ctx.prog.pal&&ctx.prog.pal[w.en]; return p&&p.v;});
  if(vistas.length<4)return [];
  var flojas=debiles(ctx.prog,vistas).slice(0,8), its=[], tipos=["imagen","escucha","alreves","traduce","deletrea","alreves","escucha","imagen"];
  its.push(parejas(r,baraja(r,flojas).slice(0,Math.min(5,flojas.length))));
  tipos.forEach(function(t,k){var w=flojas[k%flojas.length], pool=UNIDADES[w.u].palabras; if(t==="escucha"&&ctx.sinVoz)t="imagen"; if(t==="deletrea"&&(w.en.length>8||w.en.indexOf(" ")>=0))t="traduce"; its.push(GEN[t](r,w,pool));});
  return its;
}

/* ---------- corregir ---------- */
function respuesta(it){
  if(it.t==="frase_en")return it.f[0];
  if(it.t==="frase_es")return it.f[1];
  if(it.t==="deletrea")return it.w;
  if(it.t==="imagen"||it.t==="escucha"||it.t==="alreves")return it.w;
  if(it.t==="traduce")return PAL[it.w].es;
  if(it.t==="completa")return it.ops[it.ok];
  if(it.t==="habla")return it.w||it.f[0];
  return "";
}
function corrige(it,resp){
  if(it.t==="imagen"||it.t==="escucha"||it.t==="traduce"||it.t==="alreves"||it.t==="frase_es"||it.t==="completa")return +resp===it.ok;
  if(it.t==="frase_en")return norm(resp)===norm(it.f[0]);
  if(it.t==="deletrea")return norm(resp).replace(/\s/g,"")===norm(it.w).replace(/\s/g,"");
  if(it.t==="habla"){var meta=norm(it.w||it.f[0]), dicho=norm(resp); if(!dicho)return false;
    if(dicho===meta||(" "+dicho+" ").indexOf(" "+meta+" ")>=0)return true;
    /* en frases basta con la mayoría de las palabras */
    var m=meta.split(" "), d=dicho.split(" "), n=m.filter(function(x){return d.indexOf(x)>=0;}).length; return m.length>1&&n/m.length>=0.7;}
  return true;
}
/* las palabras que toca un ejercicio (para su fuerza) */
function palabrasDe(it){
  if(it.w)return [it.w];
  if(it.t==="parejas")return it.ws.slice();
  if(it.f){var out=[]; fichas(it.f[0]).forEach(function(t){var w=PAL[t.toLowerCase()]||PAL[t]; if(w&&out.indexOf(w.en)<0)out.push(w.en);}); return out;}
  return [];
}

/* ---------- el avance ---------- */
function nuevo(){return {lec:{},pal:{},xp:0,dias:{},refl:[]};}
function hoy(){var d=new Date(); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}
/* una respuesta: la fuerza de cada palabra sube (hasta 5) o baja */
function registra(prog,it,ok){
  if(it.t==="nueva"){var p0=prog.pal[it.w]||(prog.pal[it.w]={f:0,e:0,v:0,t:0}); p0.v++; p0.t=Date.now(); return;}
  palabrasDe(it).forEach(function(w){var p=prog.pal[w]||(prog.pal[w]={f:0,e:0,v:0,t:0}); p.v++; p.t=Date.now();
    if(ok)p.f=Math.min(5,p.f+1); else {p.f=Math.max(0,p.f-2); p.e++;}});
}
/* al terminar una lección: estrellas por la precisión (terminar siempre da al menos una) y XP */
function termina(prog,lecId,bien,total){
  var prec=total?bien/total:1, est=prec>=0.9?3:prec>=0.7?2:1, xp=10+(prec===1?5:0)+Math.round(bien/2);
  var l=prog.lec[lecId]||(prog.lec[lecId]={e:0,v:0}); l.e=Math.max(l.e,est); l.v++;
  prog.xp+=xp; var d=hoy(); prog.dias[d]=(prog.dias[d]||0)+xp;
  var ks=Object.keys(prog.dias).sort(); while(ks.length>120)delete prog.dias[ks.shift()];
  return {estrellas:est,xp:xp,prec:prec};
}
function hecha(prog,lecId){return !!(prog&&prog.lec&&prog.lec[lecId]&&prog.lec[lecId].v);}
/* abierta: la primera de todas, o la anterior ya hecha */
function abierta(prog,lecId){
  var l=POR_ID[lecId]; if(!l)return false; if(hecha(prog,lecId))return true;
  if(l.k>0)return hecha(prog,UNIDADES[l.u].lecciones[l.k-1].id);
  if(l.u===0)return true;
  var ant=UNIDADES[l.u-1].lecciones; return hecha(prog,ant[ant.length-1].id);
}
function actualLec(prog){for(var i=0;i<UNIDADES.length;i++)for(var j=0;j<UNIDADES[i].lecciones.length;j++){var id=UNIDADES[i].lecciones[j].id; if(!hecha(prog,id))return id;} return null;}
function unidadHecha(prog,ui){return UNIDADES[ui].lecciones.every(function(l){return hecha(prog,l.id);});}
function aprendidas(prog){return LISTA.filter(function(w){var p=prog&&prog.pal&&prog.pal[w.en]; return p&&p.f>=3;}).length;}
function vistas(prog){return LISTA.filter(function(w){var p=prog&&prog.pal&&prog.pal[w.en]; return p&&p.v;}).length;}
/* para adultos y para el repaso: las que más cuestan */
function dificiles(prog,n){return LISTA.filter(function(w){var p=prog&&prog.pal&&prog.pal[w.en]; return p&&p.v&&(p.e>=2||p.f<2);})
  .sort(function(a,b){var pa=prog.pal[a.en],pb=prog.pal[b.en]; return (pb.e-pb.f)-(pa.e-pa.f);}).slice(0,n||12);}
function estrellasTot(prog){var t=0; Object.keys((prog&&prog.lec)||{}).forEach(function(k){t+=prog.lec[k].e||0;}); return t;}

var ANIMOS=["Amazing!","Great job!","Awesome!","Super!","Well done!","Excellent!","Fantastic!"];
var ANIMOS_ES={"Amazing!":"¡Increíble!","Great job!":"¡Gran trabajo!","Awesome!":"¡Genial!","Super!":"¡Súper!","Well done!":"¡Bien hecho!","Excellent!":"¡Excelente!","Fantastic!":"¡Fantástico!"};

G.AxIngles={UNIDADES:UNIDADES,PAL:PAL,LISTA:LISTA,POR_ID:POR_ID,genera:genera,repaso:repaso,corrige:corrige,respuesta:respuesta,palabrasDe:palabrasDe,norm:norm,fichas:fichas,
  nuevo:nuevo,registra:registra,termina:termina,hecha:hecha,abierta:abierta,actualLec:actualLec,unidadHecha:unidadHecha,aprendidas:aprendidas,vistas:vistas,dificiles:dificiles,estrellasTot:estrellasTot,
  ANIMOS:ANIMOS,ANIMOS_ES:ANIMOS_ES,rng:rng};
})(typeof window!=="undefined"?window:globalThis);
