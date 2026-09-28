/* ===========================================================
   Trivia en vivo · reglas
   Todos responden la misma pregunta a la vez mirando la pantalla
   grande; el teléfono es el mando. Acertar da de 500 a 1000 puntos
   según lo rápido que se responda (lo mide el servidor). Entre
   pregunta y pregunta se ven la respuesta, el reparto de votos, el
   podio y el espacio del patrocinador. Quien crea la sala presenta y
   no juega; puede adelantar el paso con «Siguiente».
   =========================================================== */
(function(G){
"use strict";
var J=G.AxJuegos, INTRO_MS=4000, RESULTADO_MS=8000;

function jugadores(E){return E.jugadores.filter(function(j){return j.id!==E.host&&!j.bot;});}
function pregunta(E,ahora){
  var g=E.g; g.idx++;
  if(g.idx>=g.qs.length){g.fin=true;g.fase="fin";g.hasta=null;return;}
  g.fase="pregunta"; g.resp={}; g.desde=ahora; g.hasta=ahora+E.opciones.segundos*1000;
}
function cierra(E,ahora){
  var g=E.g, q=g.qs[g.idx];
  g.reparto=q.o.map(function(_,i){return Object.keys(g.resp).filter(function(id){return g.resp[id].i===i;}).length;});
  g.fase="resultado"; g.hasta=ahora+RESULTADO_MS;
  g.orden=Object.keys(g.puntos).sort(function(a,b){return g.puntos[b]-g.puntos[a];});
  g.pos={}; g.orden.forEach(function(id,i){g.pos[id]=i+1;});
}

J.registra("trivia",{
  nombre:"Trivia en vivo",grupo:"vivo",min:1,max:1000,bots:false,tarde:true,acceso:"invitados",usaBanco:true,difusion:250,
  normaliza:function(o,E){
    var n=parseInt(o.n,10), s=parseInt(o.segundos,10), nv=parseInt(o.nivel,10);
    var op={n:[5,10,15,20].indexOf(n)>=0?n:10,segundos:[10,15,20,30].indexOf(s)>=0?s:20,nivel:[1,2,3,4].indexOf(nv)>=0?nv:4,
      patrocinio:J.limpia(o.patrocinio,140)};
    if(o.banco)op.banco=parseInt(o.banco,10)||null;
    return op;
  },
  inicia:function(E,r,ahora){
    var o=E.opciones, qs;
    var banco=E.extra&&E.extra.preguntas;
    if(banco&&banco.length){
      qs=J.baraja(banco.slice(),r).slice(0,o.n).map(function(x){
        var idx=J.baraja(x.o.map(function(_,i){return i;}),r);
        return {q:x.q,o:idx.map(function(i){return x.o[i];}),c:idx.indexOf(x.c),tema:x.tema||""};});
    }else qs=J.preguntasGenerales?J.preguntasGenerales(o.n,o.nivel,Math.floor(r()*4294967295)):[];
    E.g={qs:qs,idx:-1,fase:"intro",hasta:ahora+INTRO_MS,puntos:{},aciertos:{},resp:{},fin:false,orden:[],pos:{}};
    jugadores(E).forEach(function(j){E.g.puntos[j.id]=0;E.g.aciertos[j.id]=0;});
  },
  une:function(E,j){if(j.id!==E.host){E.g.puntos[j.id]=0;E.g.aciertos[j.id]=0;}},
  accion:function(E,id,m,ahora){
    var g=E.g; if(g.fin)return {error:"finished"};
    if(m.tipo==="siguiente"){
      if(id!==E.host)return {error:"forbidden"};
      g.hasta=ahora; return this.tick(E,ahora)?undefined:undefined;
    }
    if(m.tipo!=="responde")return {error:"bad_move"};
    if(id===E.host)return {error:"host_presents"};
    if(g.fase!=="pregunta")return {error:"too_late"};
    if(g.resp[id])return {error:"already"};
    var q=g.qs[g.idx], i=parseInt(m.i,10), ms=ahora-g.desde, lim=E.opciones.segundos*1000;
    if(!(i>=0&&i<q.o.length))return {error:"bad_move"};
    if(ms>lim+1500)return {error:"too_late"};
    var bien=i===q.c, pts=bien?Math.round(500+500*Math.max(0,1-ms/lim)):0;
    g.resp[id]={i:i,ms:ms,pts:pts};
    if(g.puntos[id]==null){g.puntos[id]=0;g.aciertos[id]=0;}
    g.puntos[id]+=pts; if(bien)g.aciertos[id]++;
    /* si ya respondieron todos los conectados, no se espera al reloj */
    var faltan=jugadores(E).filter(function(j){return j.conectado!==false&&!g.resp[j.id];});
    if(!faltan.length)cierra(E,ahora);
  },
  tick:function(E,ahora){
    var g=E.g; if(g.fin||!g.hasta||ahora<g.hasta)return false;
    if(g.fase==="intro"||g.fase==="resultado"){pregunta(E,ahora);return true;}
    if(g.fase==="pregunta"){cierra(E,ahora);return true;}
    return false;
  },
  proximo:function(E){return E.g.hasta;},
  vista:function(E,quien){
    var g=E.g, q=g.qs[g.idx], v={fase:g.fase,hasta:g.hasta,i:g.idx,n:g.qs.length,fin:g.fin,host:quien===E.host,
      respondidas:Object.keys(g.resp).length,total:jugadores(E).length,patrocinio:E.opciones.patrocinio||""};
    if(q&&(g.fase==="pregunta"||g.fase==="resultado")){v.q=q.q;v.o=q.o;v.tema=q.tema;}
    if(g.fase==="resultado"||g.fin){
      if(q){v.c=q.c;v.reparto=g.reparto;}
      v.top=g.orden.slice(0,5).map(function(id){return {id:id,puntos:g.puntos[id]};});
      v.nombres={}; v.top.forEach(function(x){v.nombres[x.id]=J.nombre(E,x.id);});
    }
    if(quien!=="pantalla"&&g.puntos[quien]!=null){
      v.mis={puntos:g.puntos[quien],aciertos:g.aciertos[quien],pos:g.pos[quien]||null,resp:g.resp[quien]||null};
    }
    return v;
  },
  resultado:function(E){var g=E.g;
    return J.puestos(Object.keys(g.puntos).map(function(id){return {id:id,puntos:g.puntos[id],unidad:"pts",nota:g.aciertos[id]+" aciertos"};}),false);}
});
})(typeof globalThis!=="undefined"?globalThis:this);
