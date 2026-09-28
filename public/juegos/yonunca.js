/* ===========================================================
   Yo nunca · reglas (solo mayores de 18, sin alcohol)
   La app lanza afirmaciones «Yo nunca…». Cada jugador responde en su
   teléfono: si SÍ lo ha hecho, pierde una vida (un dedo). Se revela
   quién lo ha hecho y se pasa a la siguiente. Quien se queda sin vidas
   queda fuera; gana quien conserve más al final.
   =========================================================== */
(function(G){
"use strict";
var J=G.AxJuegos, REVELA_MS=6000;
var FRASES={
  divertidas:["Yo nunca he fingido saber cantar una canción que no me sabía.","Yo nunca me he quedado dormido en el transporte y me he pasado de parada.","Yo nunca he hablado solo por la calle.",
    "Yo nunca he buscado mi propio nombre en internet.","Yo nunca he saludado a alguien que en realidad saludaba a otro.","Yo nunca me he comido algo que se había caído al suelo.",
    "Yo nunca he fingido una llamada para escapar de una conversación.","Yo nunca he llorado viendo un anuncio.","Yo nunca he olvidado el nombre de alguien justo al presentarlo.",
    "Yo nunca he mandado un audio de más de cinco minutos.","Yo nunca he dicho «ya casi llego» sin haber salido de casa.","Yo nunca he bailado solo frente al espejo."],
  viajes:["Yo nunca he perdido un vuelo o un bus.","Yo nunca he viajado solo a otro país.","Yo nunca me he perdido en una ciudad sin batería en el teléfono.",
    "Yo nunca he dormido en un aeropuerto.","Yo nunca he probado una comida sin saber qué era.","Yo nunca he hecho un viaje improvisado de un día para otro."],
  estudios:["Yo nunca he copiado en un examen.","Yo nunca he estudiado todo la noche anterior.","Yo nunca me he dormido en clase o en una reunión.",
    "Yo nunca he entregado un trabajo en el último minuto.","Yo nunca he inventado una excusa para no ir a clase o al trabajo.","Yo nunca he fingido entender algo para no preguntar."],
  picante:["Yo nunca he tenido una cita a ciegas.","Yo nunca he escrito a mi ex a medianoche.","Yo nunca me he enamorado de alguien de este grupo.",
    "Yo nunca he dado un beso en la primera cita.","Yo nunca he usado una aplicación de citas.","Yo nunca he dejado a alguien en visto a propósito.",
    "Yo nunca he mentido para quedar bien con alguien que me gustaba.","Yo nunca he tenido un crush con un profesor o un jefe."]
};

function siguiente(E,ahora,r){
  var g=E.g; g.n++;
  var vivos=Object.keys(g.vidas).filter(function(id){return g.vidas[id]>0;});
  if(g.n>E.opciones.frases||vivos.length<=1||!g.bolsa.length){g.fin=true;g.fase="fin";g.hasta=null;return;}
  g.frase=g.bolsa.pop(); g.resp={}; g.fase="frase"; g.hasta=ahora+E.opciones.tiempo*1000;
}
function revela(E,ahora){
  var g=E.g; g.si=Object.keys(g.resp).filter(function(id){return g.resp[id];});
  g.si.forEach(function(id){if(g.vidas[id]>0)g.vidas[id]--;});
  g.fase="revela"; g.hasta=ahora+REVELA_MS;
}

J.registra("yonunca",{
  nombre:"Yo nunca",grupo:"adultos",adultos:true,min:3,max:30,bots:false,acceso:"invitados",
  normaliza:function(o){var f=parseInt(o.frases,10), t=parseInt(o.tiempo,10), v=parseInt(o.vidas,10);
    var cats=["divertidas","viajes","estudios","picante"].filter(function(c){return o[c]!==false&&o[c]!=="0"&&(c!=="picante"||o.picante===true||o.picante==="1");});
    return {frases:[10,15,25].indexOf(f)>=0?f:15,tiempo:[10,15,25].indexOf(t)>=0?t:15,vidas:[3,5,10].indexOf(v)>=0?v:5,
      categorias:cats.length?cats:["divertidas"],anonimo:o.anonimo===true||o.anonimo==="1"};},
  inicia:function(E,r,ahora){
    var pool=[]; E.opciones.categorias.forEach(function(c){pool=pool.concat(FRASES[c]||[]);});
    E.g={bolsa:J.baraja(pool,r),vidas:{},n:0,resp:{},si:[],fin:false};
    E.jugadores.forEach(function(j){if(!j.bot)E.g.vidas[j.id]=E.opciones.vidas;});
    siguiente(E,ahora,r);
  },
  accion:function(E,id,m,ahora){
    var g=E.g; if(g.fin)return {error:"finished"};
    if(m.tipo!=="responde")return {error:"bad_move"};
    if(g.fase!=="frase")return {error:"too_late"};
    if(!(g.vidas[id]>0))return {error:"out"};
    g.resp[id]=!!m.si;
    var faltan=Object.keys(g.vidas).filter(function(x){var j=J.jugador(E,x);return g.vidas[x]>0&&g.resp[x]==null&&j&&j.conectado!==false;});
    if(!faltan.length)revela(E,ahora);
  },
  une:function(E,j){E.g.vidas[j.id]=E.opciones.vidas;},
  tick:function(E,ahora,r){
    var g=E.g; if(g.fin||!g.hasta||ahora<g.hasta)return false;
    if(g.fase==="frase"){revela(E,ahora);return true;}
    if(g.fase==="revela"){siguiente(E,ahora,r||Math.random);return true;}
    return false;
  },
  proximo:function(E){return E.g.hasta;},
  vista:function(E,quien){
    var g=E.g, v={fase:g.fase,hasta:g.hasta,frase:g.frase,n:g.n,total:E.opciones.frases,vidas:g.vidas,max:E.opciones.vidas,fin:g.fin,
      respondidas:Object.keys(g.resp).length,anonimo:E.opciones.anonimo,
      vivos:Object.keys(g.vidas).filter(function(id){return g.vidas[id]>0;}).length,jugando:Object.keys(g.vidas).length};
    /* en modo anónimo las vidas de los demás delatarían quién dijo que sí: cada uno ve solo las suyas hasta el final */
    if(E.opciones.anonimo&&!g.fin){v.vidas={}; if(g.vidas[quien]!=null)v.vidas[quien]=g.vidas[quien];}
    if(g.resp[quien]!=null)v.mia=g.resp[quien];
    if(g.fase==="revela"){v.cuantos=g.si.length; if(!E.opciones.anonimo)v.si=g.si;}
    return v;
  },
  resultado:function(E){var g=E.g;
    return J.puestos(Object.keys(g.vidas).map(function(id){return {id:id,puntos:g.vidas[id],unidad:"vidas"};}),false);}
});
})(typeof globalThis!=="undefined"?globalThis:this);
