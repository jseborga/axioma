/* ===========================================================
   THE FINAL TEST · registro con consentimiento
   Se pide al entrar con Google si falta, y siempre antes de unirse a
   una institución, un curso o un concurso: fecha de nacimiento y
   aceptación de términos y privacidad. Menores de 18: datos de su
   madre, padre o tutor; pueden usar los cursos de su institución,
   pero no los concursos abiertos con premio sin ese consentimiento.
   =========================================================== */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var host=$("reg"); if(!host)return;
var estado=null, espera=null;

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function api(path,body){
  return fetch(path,{method:body?"POST":"GET",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().then(function(j){if(!r.ok)throw j;return j;});});
}
function carga(){ return api("/api/profile").then(function(p){estado=p;return p;}); }
function completo(){ return !!(estado&&estado.profile&&estado.profile.complete); }
function edad(f){
  var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(f||""); if(!m)return null;
  var d=new Date(), e=d.getFullYear()-(+m[1]);
  if(d.getMonth()+1<+m[2]||(d.getMonth()+1===+m[2]&&d.getDate()<+m[3]))e--;
  return e;
}

/* al entrar con Google: si falta el registro, se ofrece una vez por sesión */
document.addEventListener("ax-user",function(e){
  if(!e.detail){estado=null;return;}
  carga().then(function(){
    var visto=false; try{visto=sessionStorage.getItem("tft_reg")==="1";}catch(x){}
    if(!completo()&&!visto)abre(false);
  }).catch(function(){});
});

/* para las acciones que lo exigen: devuelve una promesa que dice si ya está completo */
function asegura(){
  if(completo())return Promise.resolve(true);
  return carga().then(function(){ return completo()?true:abre(true); },function(){ return abre(true); });
}

function abre(obligado){
  return new Promise(function(resolve){
    espera=resolve;
    var hoy=new Date().toISOString().slice(0,10), p=(estado&&estado.profile)||{};
    host.innerHTML='<div class="tut-card entra reg-card" role="dialog" aria-modal="true" aria-label="Completa tu registro">'+
      '<button class="close" id="reg-x" aria-label="Cerrar">×</button>'+
      '<div class="tut-body"><h2>Completa tu registro</h2>'+
      '<p>'+(obligado?'Para seguir necesitamos dos datos. ':'')+'Antes de unirte a una institución, un curso o un concurso, confirma tu fecha de nacimiento y acepta cómo tratamos tus datos.</p>'+
      '<form class="rt-form" id="reg-form">'+
      '<label>Fecha de nacimiento<input type="date" id="reg-f" max="'+hoy+'" min="1910-01-01" required value="'+esc(p.birthdate||"")+'"></label>'+
      '<div id="reg-menor" hidden><p class="reg-aviso">Tienes menos de 18 años. Indica los datos de tu madre, padre o tutor. Podrás usar los cursos de tu institución; para los concursos abiertos con premio hará falta su consentimiento o el de tu institución.</p>'+
      '<label>Nombre de tu madre, padre o tutor<input id="reg-gn" maxlength="80" value="'+esc(p.guardian_name||"")+'"></label>'+
      '<label>Su correo<input type="email" id="reg-ge" maxlength="120" value="'+esc(p.guardian_email||"")+'"></label></div>'+
      '<label class="rt-check"><input type="checkbox" id="reg-ok"> <span>He leído y acepto los <a href="terminos.html" target="_blank" rel="noopener">Términos</a> y la <a href="privacidad.html" target="_blank" rel="noopener">Política de privacidad</a>.</span></label>'+
      '<p class="msg" id="reg-msg"></p>'+
      '</form></div>'+
      '<div class="tut-nav"><button class="ghost" id="reg-no" type="button">Ahora no</button><button class="primary" id="reg-si" type="submit" form="reg-form">Guardar</button></div>'+
      '</div>';
    host.classList.add("on"); document.body.style.overflow="hidden";
    function menor(){var e=edad($("reg-f").value);$("reg-menor").hidden=!(e!==null&&e<18);}
    $("reg-f").oninput=menor; $("reg-f").onchange=menor; menor();
    $("reg-x").onclick=$("reg-no").onclick=function(){cierra(false);};
    $("reg-form").onsubmit=function(ev){
      ev.preventDefault();
      var msg=$("reg-msg"), f=$("reg-f").value, e=edad(f);
      if(e===null){msg.className="msg bad";msg.textContent="Indica tu fecha de nacimiento.";return;}
      if(!$("reg-ok").checked){msg.className="msg bad";msg.textContent="Para continuar hay que aceptar los términos y la política de privacidad.";return;}
      $("reg-si").disabled=true; msg.className="msg"; msg.textContent="Guardando…";
      api("/api/profile",{birthdate:f,accept:true,guardian_name:$("reg-gn").value,guardian_email:$("reg-ge").value}).then(function(r){
        estado=estado||{}; estado.profile=r.profile;
        try{document.dispatchEvent(new CustomEvent("ax-perfil",{detail:r.profile}));}catch(x){}
        cierra(true);
      }).catch(function(er){
        $("reg-si").disabled=false; msg.className="msg bad";
        msg.textContent={bad_birthdate:"Revisa la fecha de nacimiento.",guardian_required:"Indica el nombre y un correo válido de tu madre, padre o tutor.",
          terms_required:"Hay que aceptar los términos.",unauthorized:"Tu sesión caducó: vuelve a entrar con Google."}[er&&er.error]||"No se pudo guardar. Inténtalo otra vez.";
      });
    };
  });
}
function cierra(ok){
  host.classList.remove("on"); host.innerHTML=""; document.body.style.overflow="";
  if(!ok){try{sessionStorage.setItem("tft_reg","1");}catch(e){}}
  var r=espera; espera=null; if(r)r(!!ok);
}
document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&host.classList.contains("on"))cierra(false); });

window.AxRegistro={asegura:asegura,abre:abre,estado:function(){return estado;},recarga:carga};
})();
