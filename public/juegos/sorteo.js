/* ===========================================================
   Sorteo gamificado · reglas
   Cada participante tiene al menos 1 boleto; gana más participando en
   las convocatorias y juegos de la institución que organiza (hasta +5,
   lo calcula el servidor) y con la palabra secreta del evento (+2).
   Al sortear, el servidor elige al ganador con azar criptográfico y
   ponderado por boletos ANTES de la animación: la lluvia de esferas del
   proyector solo lo desvela, no lo decide. Puede haber varios premios.
   =========================================================== */
(function(G){
"use strict";
var J=G.AxJuegos, ANIMA_MS=12000, MAX_BOLETOS=10;

function participantes(E){return E.jugadores.filter(function(j){return j.id!==E.host&&!j.bot;});}
function boletos(E,j){var g=E.g;return Math.min(MAX_BOLETOS,1+(j.extra&&j.extra.bono||0)+(g.palabra[j.id]?2:0));}

J.registra("sorteo",{
  nombre:"Sorteo gamificado",grupo:"especial",min:1,max:2000,bots:false,tarde:true,acceso:"invitados",difusion:400,
  normaliza:function(o,E){
    var n=parseInt(o.ganadores,10);
    if(E&&E.extra&&o.palabra!==undefined)E.extra.palabra=J.limpia(o.palabra,30).toLowerCase();   /* no se publica */
    return {ganadores:[1,2,3,5].indexOf(n)>=0?n:1,conPalabra:!!(E&&E.extra&&E.extra.palabra)};
  },
  inicia:function(E){E.g={fase:"inscripcion",palabra:{},gana:[],fin:false,hasta:null};},
  accion:function(E,id,m,ahora,r){
    var g=E.g; if(g.fin)return {error:"finished"};
    if(m.tipo==="palabra"){
      if(g.fase!=="inscripcion")return {error:"too_late"};
      if(!E.extra.palabra)return {error:"bad_move"};
      if(g.palabra[id])return {error:"already"};
      if(J.limpia(m.texto,30).toLowerCase()!==E.extra.palabra)return {error:"wrong_word"};
      g.palabra[id]=true; return;
    }
    if(m.tipo==="sortear"){
      if(id!==E.host)return {error:"forbidden"};
      if(g.fase!=="inscripcion")return {error:"already"};
      var ps=participantes(E); if(!ps.length)return {error:"need_players"};
      /* azar ponderado, sin repetir ganador; r es criptográfico en el servidor */
      var bolsa=ps.map(function(j){return {id:j.id,b:boletos(E,j)};}), k=Math.min(E.opciones.ganadores,bolsa.length);
      for(var n=0;n<k;n++){
        var tot=bolsa.reduce(function(s,x){return s+x.b;},0), t=r()*tot, i=0;
        while(t>=bolsa[i].b){t-=bolsa[i].b;i++;}
        g.gana.push(bolsa[i].id); bolsa.splice(i,1);
      }
      g.fase="sorteo"; g.desde=ahora; g.hasta=ahora+ANIMA_MS; g.semilla=Math.floor(r()*4294967295);
      g.foto=ps.map(function(j){return {id:j.id,n:j.nombre,b:boletos(E,j)};});   /* quién participó y con cuántos boletos */
      return;
    }
    return {error:"bad_move"};
  },
  tick:function(E,ahora){var g=E.g; if(g.fase!=="sorteo"||ahora<g.hasta)return false; g.fase="fin";g.fin=true;g.hasta=null;return true;},
  proximo:function(E){return E.g.hasta;},
  vista:function(E,quien){
    var g=E.g, ps=participantes(E), v={fase:g.fase,hasta:g.hasta,desde:g.desde,host:quien===E.host,total:ps.length,
      boletos:ps.reduce(function(s,j){return s+boletos(E,j);},0),conPalabra:E.opciones.conPalabra,ganadores:E.opciones.ganadores};
    var yo=J.jugador(E,quien);
    if(yo&&quien!==E.host){v.mios=boletos(E,yo);v.bono=yo.extra&&yo.extra.bono||0;v.palabra=!!g.palabra[quien];}
    if(g.fase!=="inscripcion"){
      /* la animación: hasta 80 esferas (los ganadores siempre) con su tamaño por boletos */
      var f=g.foto.slice().sort(function(a,b){return b.b-a.b;}), mues=f.slice(0,80);
      g.gana.forEach(function(id){if(!mues.some(function(x){return x.id===id;}))mues[mues.length-1]={id:id,n:J.nombre(E,id),b:boletos(E,J.jugador(E,id)||{})};});
      v.esferas=mues; v.semilla=g.semilla; v.gana=g.gana.map(function(id){return {id:id,n:J.nombre(E,id)};});
    }
    return v;
  },
  resultado:function(E){var g=E.g;
    return g.gana.map(function(id,i){return {id:id,puesto:i+1,puntos:boletos(E,J.jugador(E,id)||{}),unidad:"boletos",nota:"premio "+(i+1)};});}
});
})(typeof globalThis!=="undefined"?globalThis:this);
