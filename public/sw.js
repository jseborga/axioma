/* The Final Test · service worker: la app entera queda en caché y funciona sin conexión */
var CACHE="tft-v28";
var FILES=["./","./index.html","./axioma.css","./app.js","./account.js","./rapidos-motor.js","./rapidos.js","./concursos.js","./banco-formato.js","./xlsx.js","./vendor/qrcode.js","./qr.js","./invitado.js","./marca.js","./registro.js","./aula.js","./inicio.js","./fiesta.js","./fiesta/palabras.js","./fiesta/tabu.js","./fiesta/preguntas.js","./fiesta/pruebas.js","./areas.js","./sala.js","./juegos/nucleo.js","./juegos/gomoku.js","./juegos/hex.js","./juegos/cuantico.js","./juegos/dudo.js","./juegos/sexta.js","./juegos/verdades.js","./juegos/trivia.js","./juegos/hype.js","./juegos/carrera.js","./juegos/sorteo.js","./juegos/subasta.js","./juegos/paranoia.js","./juegos/yonunca.js","./juegos/estrategia-ui.js","./juegos/grupo-ui.js","./juegos/vivo-ui.js","./juegos/especial-ui.js","./juegos/adultos-ui.js","./terminos.html","./privacidad.html","./legal.css","./legal.js","./retos.js","./tutorial.js","./sudoku.js","./manifest.json","./icon.svg","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./apple-touch-icon.png","./como-jugar.svg"];

self.addEventListener("install",function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener("fetch",function(e){
  if(e.request.method!=="GET")return;
  var u=new URL(e.request.url);
  if(u.origin!==location.origin||u.pathname.indexOf("/api/")===0)return;
  e.respondWith(caches.match(e.request).then(function(hit){
    return hit||fetch(e.request).then(function(res){
      var copy=res.clone();
      caches.open(CACHE).then(function(c){c.put(e.request,copy);});
      return res;
    }).catch(function(){return caches.match("./index.html");});
  }));
});
