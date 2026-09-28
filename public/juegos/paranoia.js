/* ===========================================================
   Paranoia · reglas (solo mayores de 18)
   Por turnos, un jugador recibe en secreto una pregunta del tipo
   «¿Quién de la mesa…?» y elige en su teléfono a alguien. Todos ven a
   quién eligió, pero no la pregunta. Después, la persona elegida lanza
   la moneda: si sale cara, la pregunta se revela a todos; si sale cruz,
   queda en secreto para siempre. Nadie puntúa: al final se cuenta a
   quién eligieron más veces.
   =========================================================== */
(function(G){
"use strict";
var J=G.AxJuegos, RESULTADO_MS=7000;
var PREGUNTAS={
  suave:["¿Quién de la mesa tardaría más en arreglarse para una fiesta?","¿Quién sobreviviría menos en una isla desierta?","¿Quién se ríe de sus propios chistes antes de contarlos?",
    "¿Quién llegaría tarde a su propia boda?","¿Quién tiene el historial de búsquedas más raro?","¿Quién sería el primero en perderse en una ciudad nueva?",
    "¿Quién haría el peor karaoke?","¿Quién gastaría el premio de la lotería en una semana?","¿Quién guarda más secretos?","¿Quién sería el mejor detective?",
    "¿Quién llora con las películas de animación?","¿Quién se come lo que hay en la nevera de los demás?","¿Quién sería capaz de hablar con una pared durante una hora?",
    "¿Quién conquistaría a cualquiera en una cita?","¿Quién tiene más fotos inútiles en el teléfono?","¿Quién mentiría peor en un interrogatorio?",
    "¿Quién se apuntaría a un reality show?","¿Quién discute con el GPS?","¿Quién sería el líder en un apocalipsis zombi?","¿Quién tiene la risa más contagiosa?"],
  picante:["¿Quién de la mesa ha tenido la cita más desastrosa?","¿Quién sigue escribiendo a su ex de vez en cuando?","¿Quién ha stalkeado más perfiles en redes esta semana?",
    "¿Quién se enamora más rápido?","¿Quién tiene el pasado más misterioso?","¿Quién ha dado su número falso a alguien?","¿Quién coquetea sin darse cuenta?",
    "¿Quién ha inventado una excusa increíble para cancelar un plan?","¿Quién tiene un crush secreto en este momento?","¿Quién sería el peor guardando un secreto de pareja?",
    "¿Quién ha leído los mensajes de otro a escondidas?","¿Quién ha mandado un mensaje a la persona equivocada?","¿Quién ha fingido estar enfermo para no ir a algo?",
    "¿Quién escribiría la biografía más escandalosa?","¿Quién tendría más citas en un mes si se lo propusiera?","¿Quién ha mentido sobre su edad alguna vez?"]
};

function siguienteTurno(E,ahora,r){
  var g=E.g; g.n++;
  if(g.n>E.opciones.turnos){g.fin=true;g.fase="fin";g.hasta=null;return;}
  var vivos=E.jugadores.filter(function(j){return !j.bot&&j.conectado!==false;});
  if(vivos.length<2){g.fin=true;g.fase="fin";g.hasta=null;return;}
  g.idx=(g.idx+1)%E.jugadores.length; var a=E.jugadores[g.idx];
  var k=0; while((a.bot||a.conectado===false)&&k<E.jugadores.length){g.idx=(g.idx+1)%E.jugadores.length;a=E.jugadores[g.idx];k++;}
  if(!g.bolsa.length)g.bolsa=J.baraja(g.pool.slice(),r);
  g.turno={pregunta:a.id,q:g.bolsa.pop(),elegido:null,moneda:null};
  g.fase="pregunta"; g.hasta=ahora+E.opciones.tiempo*1000;
}

J.registra("paranoia",{
  nombre:"Paranoia",grupo:"adultos",adultos:true,min:3,max:12,bots:false,acceso:"invitados",
  normaliza:function(o){var t=parseInt(o.turnos,10), s=parseInt(o.tiempo,10);
    return {turnos:[10,20,30].indexOf(t)>=0?t:20,tiempo:[30,45,60].indexOf(s)>=0?s:45,tono:o.tono==="picante"?"picante":"suave"};},
  inicia:function(E,r,ahora){
    var pool=PREGUNTAS.suave.concat(E.opciones.tono==="picante"?PREGUNTAS.picante:[]);
    E.g={pool:pool,bolsa:[],n:0,idx:-1,nombrado:{},fin:false,hist:[]};
    E.jugadores.forEach(function(j){E.g.nombrado[j.id]=0;});
    siguienteTurno(E,ahora,r);
  },
  accion:function(E,id,m,ahora,r){
    var g=E.g, t=g.turno; if(g.fin)return {error:"finished"};
    if(m.tipo==="elige"){
      if(g.fase!=="pregunta"||t.pregunta!==id)return {error:"not_your_turn"};
      if(m.id===id||!J.jugador(E,m.id))return {error:"bad_move"};
      t.elegido=m.id; g.nombrado[m.id]=(g.nombrado[m.id]||0)+1; g.fase="moneda"; g.hasta=ahora+15000; return;
    }
    if(m.tipo==="moneda"){
      if(g.fase!=="moneda"||t.elegido!==id)return {error:"not_your_turn"};
      this.lanza(E,ahora,r||Math.random); return;
    }
    return {error:"bad_move"};
  },
  lanza:function(E,ahora,r){var g=E.g, t=g.turno; t.moneda=r()<0.5?"cara":"cruz";
    g.hist.unshift({pregunta:t.pregunta,elegido:t.elegido,q:t.moneda==="cara"?t.q:null}); g.hist=g.hist.slice(0,6);
    g.fase="resultado"; g.hasta=ahora+RESULTADO_MS;},
  une:function(E,j){E.g.nombrado[j.id]=0;},
  tick:function(E,ahora,r){
    var g=E.g; if(g.fin||!g.hasta||ahora<g.hasta)return false;
    if(g.fase==="pregunta"){siguienteTurno(E,ahora,r);return true;}          /* no eligió a tiempo: pasa */
    if(g.fase==="moneda"){this.lanza(E,ahora,r);return true;}
    if(g.fase==="resultado"){siguienteTurno(E,ahora,r);return true;}
    return false;
  },
  proximo:function(E){return E.g.hasta;},
  vista:function(E,quien){
    var g=E.g, t=g.turno||{}, v={fase:g.fase,hasta:g.hasta,n:g.n,turnos:E.opciones.turnos,pregunta:t.pregunta,elegido:t.elegido,moneda:t.moneda,
      hist:g.hist,fin:g.fin,nombrado:g.nombrado};
    /* la pregunta solo la ve quien la recibe, o todos si la moneda sale cara */
    if((quien===t.pregunta&&g.fase!=="resultado")||(g.fase==="resultado"&&t.moneda==="cara")||(g.fase==="resultado"&&quien===t.pregunta))v.q=t.q;
    return v;
  },
  resultado:function(E){var g=E.g;
    return J.puestos(E.jugadores.filter(function(j){return !j.bot;}).map(function(j){return {id:j.id,puntos:g.nombrado[j.id]||0,unidad:"veces elegido"};}),false);}
});
})(typeof globalThis!=="undefined"?globalThis:this);
