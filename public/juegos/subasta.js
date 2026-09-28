/* ===========================================================
   Subasta inversa (la menor oferta única) · reglas
   Durante unos minutos cada participante hace pujas gratuitas por el
   premio. Gana la oferta MÁS BAJA que nadie más haya repetido. Tras
   cada puja se sabe si es única y la más baja por ahora, única pero no
   la más baja, o repetida. Visitar al patrocinador da 2 pujas más y
   desbloquea el mapa de pistas (dónde hay ofertas repetidas).
   Las pujas son gratis: no hay dinero de por medio.
   =========================================================== */
(function(G){
"use strict";
var J=G.AxJuegos, TRAMOS=10;

function participantes(E){return E.jugadores.filter(function(j){return j.id!==E.host&&!j.bot;});}
function cuenta(g){var c={};Object.keys(g.pujas).forEach(function(id){g.pujas[id].forEach(function(v){c[v]=(c[v]||0)+1;});});return c;}
function menorUnica(c){var m=null;Object.keys(c).forEach(function(k){var v=+k;if(c[k]===1&&(m===null||v<m))m=v;});return m;}
function dueno(g,v){var ids=Object.keys(g.pujas);for(var i=0;i<ids.length;i++)if(g.pujas[ids[i]].indexOf(v)>=0)return ids[i];return null;}

J.registra("subasta",{
  nombre:"Subasta inversa",grupo:"especial",min:2,max:2000,bots:false,tarde:true,acceso:"invitados",difusion:400,
  normaliza:function(o){
    var d=parseInt(o.duracion,10), p=parseInt(o.pujas,10), mx=parseInt(o.maximo,10);
    return {duracion:[60,120,180,300].indexOf(d)>=0?d:120,pujas:[3,5,10].indexOf(p)>=0?p:5,maximo:[10,50,100,500].indexOf(mx)>=0?mx:100,
      enlace:/^https?:\/\/[^\s<>"]+$/i.test(String(o.enlace||"").trim())?String(o.enlace).trim().slice(0,200):""};
  },
  inicia:function(E,r,ahora){E.g={fase:"abierta",pujas:{},extra:{},visita:{},hasta:ahora+E.opciones.duracion*1000,fin:false,gana:null,valor:null};},
  accion:function(E,id,m,ahora){
    var g=E.g; if(g.fin)return {error:"finished"};
    if(id===E.host)return {error:"host_presents"};
    if(m.tipo==="visita"){
      if(!E.opciones.enlace)return {error:"bad_move"};
      if(!g.visita[id]){g.visita[id]=true;g.extra[id]=2;} return;
    }
    if(m.tipo!=="puja")return {error:"bad_move"};
    if(g.fase!=="abierta"||ahora>g.hasta)return {error:"too_late"};
    var v=Math.round(Number(m.valor)*100);                 /* en centavos */
    if(!(v>=1&&v<=E.opciones.maximo*100))return {error:"bad_bid"};
    var mias=g.pujas[id]||(g.pujas[id]=[]);
    if(mias.indexOf(v)>=0)return {error:"repeated_own"};
    if(mias.length>=E.opciones.pujas+(g.extra[id]||0))return {error:"no_bids_left"};
    mias.push(v);
  },
  tick:function(E,ahora){
    var g=E.g; if(g.fin||ahora<g.hasta)return false;
    var c=cuenta(g), m=menorUnica(c);
    g.fin=true; g.fase="fin"; g.valor=m; g.gana=m===null?null:dueno(g,m); g.hasta=null;
    g.cierre=Object.keys(c).map(Number).sort(function(a,b){return a-b;}).slice(0,12).map(function(v){return {v:v,n:c[v]};});
    return true;
  },
  proximo:function(E){return E.g.hasta;},
  vista:function(E,quien){
    var g=E.g, c=cuenta(g), total=Object.keys(g.pujas).reduce(function(s,id){return s+g.pujas[id].length;},0);
    var v={fase:g.fase,hasta:g.hasta,maximo:E.opciones.maximo,enlace:E.opciones.enlace,total:total,personas:Object.keys(g.pujas).length,host:quien===E.host,fin:g.fin};
    if(g.fin){v.valor=g.valor;v.gana=g.gana?{id:g.gana,n:J.nombre(E,g.gana)}:null;v.cierre=g.cierre;}
    if(quien!=="pantalla"&&quien!==E.host&&J.jugador(E,quien)){
      var m=menorUnica(c), mias=(g.pujas[quien]||[]).slice().sort(function(a,b){return a-b;});
      v.mias=mias.map(function(x){return {v:x,e:c[x]>1?"repetida":x===m?"ganadora":"unica"};});
      v.quedan=E.opciones.pujas+(g.extra[quien]||0)-mias.length; v.visito=!!g.visita[quien];
      if(g.visita[quien]){ /* pistas: cuántas repetidas y únicas hay en cada tramo */
        var paso=E.opciones.maximo*100/TRAMOS; v.mapa=[];
        for(var t=0;t<TRAMOS;t++)v.mapa.push({rep:0,uni:0});
        Object.keys(c).forEach(function(k){var i=Math.min(TRAMOS-1,Math.floor((+k-1)/paso)); if(c[k]>1)v.mapa[i].rep++; else v.mapa[i].uni++;});
      }
    }
    return v;
  },
  resultado:function(E){var g=E.g;
    return Object.keys(g.pujas).map(function(id){return {id:id,puesto:id===g.gana?1:null,puntos:g.pujas[id].length,unidad:"pujas",
      nota:id===g.gana?"gana con Bs "+(g.valor/100).toFixed(2):""};}).sort(function(a,b){return (a.puesto||9)-(b.puesto||9);});}
});
})(typeof globalThis!=="undefined"?globalThis:this);
