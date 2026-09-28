/* ===========================================================
   Botón del hype · reglas
   El público se reparte en 2 o 3 equipos. Durante 30 segundos todos
   pulsan su botón para inflar el objeto de su equipo en la pantalla
   grande; la meta crece con el tamaño del equipo para que sea justo.
   Gana el primero que lo llena (o el que más lleve al acabar). Cada
   teléfono envía sus toques agrupados y el servidor limita el ritmo a
   lo humanamente posible. El equipo ganador ve el cupón en su teléfono.
   =========================================================== */
(function(G){
"use strict";
var J=G.AxJuegos, LISTOS_MS=4000, MAX_TPS=14;
var EQUIPOS=[{n:"Rojo",c:"#FF3B30"},{n:"Azul",c:"#0A84FF"},{n:"Verde",c:"#34C759"}];

function participantes(E){return E.jugadores.filter(function(j){return j.id!==E.host&&!j.bot;});}
function asigna(E,j){
  var g=E.g, cuenta=g.equipos.map(function(){return 0;});
  Object.keys(g.eq).forEach(function(id){cuenta[g.eq[id]]++;});
  var k=cuenta.indexOf(Math.min.apply(null,cuenta)); g.eq[j.id]=k; j.equipo=k; g.toques[j.id]=0;
}
function meta(E,k){var g=E.g, n=Object.keys(g.eq).filter(function(id){return g.eq[id]===k;}).length;
  return Math.max(40,n*E.opciones.intensidad);}
function llenado(E){var g=E.g;return g.equipos.map(function(_,k){return Math.min(1,g.suma[k]/meta(E,k));});}

J.registra("hype",{
  nombre:"Botón del hype",grupo:"vivo",min:2,max:1000,bots:false,tarde:true,acceso:"libre",difusion:300,
  normaliza:function(o,E){
    var eq=parseInt(o.equipos,10), d=parseInt(o.duracion,10), it=parseInt(o.intensidad,10);
    if(E&&E.extra&&o.cupon!==undefined)E.extra.cupon=J.limpia(o.cupon,60);   /* el cupón no se publica a todos */
    return {equipos:[2,3].indexOf(eq)>=0?eq:2,duracion:[20,30,45].indexOf(d)>=0?d:30,intensidad:[60,90,120].indexOf(it)>=0?it:90,
      objeto:J.limpia(o.objeto,40)};
  },
  inicia:function(E,r,ahora){
    E.g={equipos:EQUIPOS.slice(0,E.opciones.equipos),eq:{},toques:{},ult:{},suma:[0,0,0].slice(0,E.opciones.equipos),
      fase:"listos",hasta:ahora+LISTOS_MS,fin:false,gana:null};
    J.baraja(participantes(E),r).forEach(function(j){asigna(E,j);});
  },
  une:function(E,j){if(j.id!==E.host)asigna(E,j);},
  accion:function(E,id,m,ahora){
    var g=E.g; if(g.fin)return {error:"finished"};
    if(m.tipo!=="toques")return {error:"bad_move"};
    if(g.fase!=="juego"||g.eq[id]==null)return;
    var n=Math.max(0,parseInt(m.n,10)||0), desde=g.ult[id]||g.desde;
    var tope=Math.ceil((ahora-desde)/1000*MAX_TPS)+3;          /* no más rápido que un humano */
    n=Math.min(n,tope,60); g.ult[id]=ahora;
    g.toques[id]+=n; g.suma[g.eq[id]]+=n;
    var f=llenado(E);
    for(var k=0;k<f.length;k++)if(f[k]>=1){g.fin=true;g.gana=k;g.fase="fin";g.hasta=null;g.duro=ahora-g.desde;break;}
  },
  tick:function(E,ahora){
    var g=E.g; if(g.fin||!g.hasta||ahora<g.hasta)return false;
    if(g.fase==="listos"){g.fase="juego";g.desde=ahora;g.hasta=ahora+E.opciones.duracion*1000;return true;}
    var f=llenado(E); g.gana=f.indexOf(Math.max.apply(null,f)); g.fin=true; g.fase="fin"; g.hasta=null; g.duro=ahora-g.desde; return true;
  },
  proximo:function(E){return E.g.hasta;},
  vista:function(E,quien){
    var g=E.g, v={fase:g.fase,hasta:g.hasta,equipos:g.equipos,llenado:llenado(E),suma:g.suma,fin:g.fin,gana:g.gana,
      objeto:E.opciones.objeto||"",miembros:g.equipos.map(function(_,k){return Object.keys(g.eq).filter(function(id){return g.eq[id]===k;}).length;}),
      duracion:E.opciones.duracion};
    if(quien!=="pantalla"&&g.eq[quien]!=null){v.mio=g.eq[quien];v.toques=g.toques[quien];
      if(g.fin&&g.gana===g.eq[quien]&&E.extra&&E.extra.cupon)v.cupon=E.extra.cupon;}
    return v;
  },
  resultado:function(E){var g=E.g, f=llenado(E), orden=f.map(function(x,k){return k;}).sort(function(a,b){return f[b]-f[a];});
    return Object.keys(g.eq).map(function(id){return {id:id,puesto:orden.indexOf(g.eq[id])+1,puntos:g.toques[id],unidad:"toques",nota:"equipo "+g.equipos[g.eq[id]].n};});}
});
})(typeof globalThis!=="undefined"?globalThis:this);
