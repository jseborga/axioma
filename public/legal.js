/* The Final Test · rellena el correo de contacto de las páginas legales
   con el ajuste CONTACT_EMAIL que publica /api/config */
(function(){
  var els=document.querySelectorAll("[data-contacto]"); if(!els.length)return;
  fetch("/api/config",{credentials:"same-origin"}).then(function(r){return r.json();}).then(function(c){
    var m=c&&c.contactEmail; if(!m)return;
    for(var i=0;i<els.length;i++){
      var a=document.createElement("a"); a.href="mailto:"+m; a.textContent=m;
      els[i].textContent=""; els[i].appendChild(a);
    }
  }).catch(function(){});
})();
