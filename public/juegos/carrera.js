/* ===========================================================
   Carrera matemática · reglas
   Cada jugador avanza su coche en la pantalla grande resolviendo en su
   teléfono operaciones que solo él ve. Un fallo lo frena un segundo.
   Llega primero quien resuelve todas. Los bots corren a ritmo fijo:
   fácil (una cada 5 s, a veces falla), medio (cada 3 s) y difícil
   (cada 1,5 s, sin fallar). Las operaciones las genera el servidor.
   =========================================================== */
(function(G){
"use strict";
var J=G.AxJuegos, LISTOS_MS=4000, FRENO_MS=1000, GRACIA_MS=15000, MAX_MS=240000;
var RITMO=[5000,3000,1500], ACIERTO=[0.8,0.92,1];

function op(E,id,i){ /* la misma operación para el mismo jugador y posición */
  var r=J.rng(J.semilla(E.g.seed+":"+id+":"+i));
  if(J.operacion)return J.operacion(E.opciones.nivel,r);
  var a=J.entre(r,2,20),b=J.entre(r,2,20);return {q:a+" + "+b,res:a+b};
}
function corredores(E){return E.jugadores.filter(function(j){return j.id!==E.host||E.opciones.hostJuega;});}
function llega(E,id,ahora){
  var g=E.g; g.llegada[id]=ahora-g.desde; g.lleg.push(id);
  if(g.lleg.length===1)g.hasta=Math.min(g.hasta,ahora+GRACIA_MS);
  var faltan=corredores(E).filter(function(j){return g.llegada[j.id]==null&&!j.bot;});
  if(!faltan.length){g.fin=true;g.fase="fin";g.hasta=null;}
}

J.registra("carrera",{
  nombre:"Carrera matemática",grupo:"vivo",min:1,max:60,bots:true,acceso:"libre",difusion:200,pausaBot:60,
  normaliza:function(o){var m=parseInt(o.meta,10),nv=parseInt(o.nivel,10),b=parseInt(o.bots,10);
    return {meta:[10,15,20,30].indexOf(m)>=0?m:15,nivel:[1,2,3].indexOf(nv)>=0?nv:1,bots:[0,1,2].indexOf(b)>=0?b:1,hostJuega:o.hostJuega!==false&&o.hostJuega!=="0"};},
  inicia:function(E,r,ahora){
    E.g={seed:Math.floor(r()*4294967295),pos:{},freno:{},llegada:{},lleg:[],fase:"listos",hasta:ahora+LISTOS_MS,fin:false,prox:{}};
    corredores(E).forEach(function(j){E.g.pos[j.id]=0;});
  },
  accion:function(E,id,m,ahora,r){
    var g=E.g; if(g.fin)return {error:"finished"};
    if(g.fase!=="juego"||g.pos[id]==null||g.llegada[id]!=null)return {error:"wait"};
    if(m.tipo!=="resp"||parseInt(m.i,10)!==g.pos[id])return {error:"stale"};
    if(g.freno[id]&&ahora<g.freno[id])return {error:"frenado"};
    var jj=J.jugador(E,id); if(jj&&jj.bot)g.prox[id]=ahora+RITMO[E.opciones.bots]*(0.85+(r?r():0.5)*0.3);   /* ritmo del bot */
    var v=Number(m.v);
    if(v===op(E,id,g.pos[id]).res){g.pos[id]++; if(g.pos[id]>=E.opciones.meta)llega(E,id,ahora);}
    else g.freno[id]=ahora+FRENO_MS;
  },
  tick:function(E,ahora){
    var g=E.g; if(g.fin||!g.hasta||ahora<g.hasta)return false;
    if(g.fase==="listos"){g.fase="juego";g.desde=ahora;g.hasta=ahora+MAX_MS;
      E.jugadores.forEach(function(j){if(j.bot)g.prox[j.id]=ahora+RITMO[E.opciones.bots];});return true;}
    g.fin=true;g.fase="fin";g.hasta=null;return true;
  },
  bot:function(E,id,r,ahora){
    var g=E.g; if(g.fin||g.fase!=="juego"||g.llegada[id]!=null||!g.prox[id]||ahora<g.prox[id])return null;
    var bien=r()<ACIERTO[E.opciones.bots], res=op(E,id,g.pos[id]).res;
    return {tipo:"resp",i:g.pos[id],v:bien?res:res+1};
  },
  proximo:function(E){var g=E.g, t=g.hasta; Object.keys(g.prox).forEach(function(id){if(g.llegada[id]==null&&g.prox[id]<t)t=g.prox[id];}); return t;},
  vista:function(E,quien){
    var g=E.g, v={fase:g.fase,hasta:g.hasta,meta:E.opciones.meta,pos:g.pos,lleg:g.lleg,fin:g.fin,nombres:{}};
    Object.keys(g.pos).forEach(function(id){v.nombres[id]=J.nombre(E,id);});
    if(quien!=="pantalla"&&g.pos[quien]!=null&&g.fase==="juego"&&g.llegada[quien]==null){
      var o=op(E,quien,g.pos[quien]); v.op={i:g.pos[quien],q:o.q}; v.freno=g.freno[quien]&&g.freno[quien]>Date.now()?g.freno[quien]:null;
    }
    if(g.llegada[quien]!=null)v.mia=g.llegada[quien];
    return v;
  },
  resultado:function(E){var g=E.g;
    var ids=Object.keys(g.pos).sort(function(a,b){
      var la=g.llegada[a], lb=g.llegada[b];
      if(la!=null&&lb!=null)return la-lb; if(la!=null)return -1; if(lb!=null)return 1; return g.pos[b]-g.pos[a];});
    return ids.map(function(id,i){return {id:id,puesto:i+1,puntos:g.llegada[id]!=null?Math.round(g.llegada[id]/100)/10:g.pos[id],
      unidad:g.llegada[id]!=null?"s":"de "+E.opciones.meta,nota:g.llegada[id]!=null?"llegó":"no llegó"};});}
});
})(typeof globalThis!=="undefined"?globalThis:this);
