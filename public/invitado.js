/* ===========================================================
   THE FINAL TEST · participar como invitado
   Para convocatorias de empresas y eventos que lo admiten: sin cuenta
   de Google, con nombre y un teléfono o correo que se verifica con un
   código de seis cifras. En modo de pruebas no se envía nada: el código
   aparece en pantalla.
   =========================================================== */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var host=$("inv"); if(!host)return;
var espera=null, datos=null;

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function api(path,body){
  return fetch(path,{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
    .then(function(r){return r.json().then(function(j){if(!r.ok)throw j;return j;});});
}
function edad(f){
  var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(f||""); if(!m)return null;
  var d=new Date(), e=d.getFullYear()-(+m[1]);
  if(d.getMonth()+1<+m[2]||(d.getMonth()+1===+m[2]&&d.getDate()<+m[3]))e--;
  return e;
}
var ERR={bad_name:"Escribe tu nombre.",bad_phone:"Revisa el teléfono: con el código de país, por ejemplo +591 70012345.",bad_email:"Revisa el correo.",
  bad_birthdate:"Revisa la fecha de nacimiento.",terms_required:"Para participar hay que aceptar los términos y la política de privacidad.",
  guardian_required:"Indica el nombre y un correo válido de tu madre, padre o tutor.",guests_not_allowed:"Esta convocatoria no admite invitados: entra con Google.",
  finished:"La convocatoria ya terminó.",blocked:"Este contacto está bloqueado por la administración de la plataforma.",
  too_many_codes:"Has pedido demasiados códigos. Espera un rato e inténtalo de nuevo.",verify_unavailable:"La verificación por código no está disponible ahora mismo. Entra con Google.",
  bad_code:"El código no es correcto.",code_expired:"El código caducó: pide otro.",code_used:"Ese código ya se usó: pide otro.",
  too_many_attempts:"Demasiados intentos con este código: pide otro.",not_configured:"El servicio no está disponible."};
function error(e){return (e&&ERR[e.error])||"No se pudo completar. Inténtalo otra vez.";}
function aviso(t,mal){var m=$("inv-msg");if(m){m.className="msg"+(mal?" bad":"");m.textContent=t||"";}}

/* o = { code | sala, org_name, prize } → promesa: true si quedó verificado */
function abre(o){
  return new Promise(function(resolve){ espera=resolve; datos=datos||{channel:"sms"}; datos.o=o; formulario(); });
}
function marco(cuerpo,nav){
  host.innerHTML='<div class="tut-card entra reg-card inv-card" role="dialog" aria-modal="true" aria-label="Participar como invitado">'+
    '<button class="close" id="inv-x" aria-label="Cerrar">×</button><div class="tut-body">'+cuerpo+'</div><div class="tut-nav">'+nav+'</div></div>';
  host.classList.add("on"); document.body.style.overflow="hidden";
  $("inv-x").onclick=function(){cierra(false);};
}
function formulario(){
  var o=datos.o, org=o.org_name||"quien organiza", hoy=new Date().toISOString().slice(0,10), tel=datos.channel!=="email";
  marco('<h2>Participar sin cuenta</h2>'+
    '<p>Te daremos un código para comprobar que eres tú. Con cada teléfono o correo se participa una sola vez.</p>'+
    '<form class="rt-form" id="inv-form">'+
    '<label>Tu nombre<input id="inv-n" maxlength="60" autocomplete="name" required value="'+esc(datos.name||"")+'"></label>'+
    '<div class="seg" role="radiogroup" aria-label="Verificar con"><button type="button" role="radio" data-c="sms" aria-checked="'+tel+'">Teléfono</button>'+
    '<button type="button" role="radio" data-c="email" aria-checked="'+(!tel)+'">Correo</button></div>'+
    '<label>'+(tel?'Teléfono (con código de país)':'Correo')+'<input id="inv-c" '+(tel?'type="tel" inputmode="tel" autocomplete="tel" placeholder="+591 70012345"':'type="email" autocomplete="email" placeholder="nombre@correo.com"')+
      ' maxlength="80" required value="'+esc(datos.contact||"")+'"></label>'+
    '<label>Fecha de nacimiento<input type="date" id="inv-f" max="'+hoy+'" min="1910-01-01" required value="'+esc(datos.birthdate||"")+'"></label>'+
    '<div id="inv-menor" hidden><p class="reg-aviso">Tienes menos de 18 años: indica los datos de tu madre, padre o tutor. Para participar en convocatorias con premio hace falta que la institución organizadora confirme el consentimiento de tu tutor.</p>'+
    '<label>Nombre de tu madre, padre o tutor<input id="inv-gn" maxlength="80" value="'+esc(datos.guardian_name||"")+'"></label>'+
    '<label>Su correo<input type="email" id="inv-ge" maxlength="120" value="'+esc(datos.guardian_email||"")+'"></label></div>'+
    '<label class="rt-check"><input type="checkbox" id="inv-ok"'+(datos.accept?' checked':'')+'> <span>Acepto los <a href="terminos.html" target="_blank" rel="noopener">Términos</a> y la <a href="privacidad.html" target="_blank" rel="noopener">Política de privacidad</a>.</span></label>'+
    '<label class="rt-check"><input type="checkbox" id="inv-mk"'+(datos.marketing?' checked':'')+'> <span>Acepto que '+esc(org)+' me contacte con novedades y promociones (opcional).</span></label>'+
    '<p class="fine">'+esc(org)+' verá tu nombre y tu contacto'+(o.prize?' para entregarte el premio si ganas':'')+'.</p>'+
    '<p class="msg" id="inv-msg"></p></form>',
    '<button class="ghost" id="inv-no" type="button">Cancelar</button><button class="primary" id="inv-si" type="submit" form="inv-form">Enviarme el código</button>');
  function menor(){var e=edad($("inv-f").value);$("inv-menor").hidden=!(e!==null&&e<18);}
  $("inv-f").oninput=$("inv-f").onchange=menor; menor();
  function guarda(){datos.name=$("inv-n").value;datos.contact=$("inv-c").value;datos.birthdate=$("inv-f").value;
    datos.guardian_name=$("inv-gn").value;datos.guardian_email=$("inv-ge").value;datos.accept=$("inv-ok").checked;datos.marketing=$("inv-mk").checked;}
  var bs=host.querySelectorAll("[data-c]"),i;
  for(i=0;i<bs.length;i++)bs[i].onclick=function(){guarda();var c=this.getAttribute("data-c");if(c!==datos.channel){datos.channel=c;datos.contact="";}formulario();};
  $("inv-no").onclick=function(){cierra(false);};
  $("inv-form").onsubmit=function(e){
    e.preventDefault(); guarda();
    if(!datos.accept){aviso(ERR.terms_required,true);return;}
    $("inv-si").disabled=true; aviso("Enviando…");
    api("/api/guest/start",{name:datos.name,channel:datos.channel,contact:datos.contact,birthdate:datos.birthdate,guardian_name:datos.guardian_name,
      guardian_email:datos.guardian_email,accept:true,marketing:datos.marketing,contest:o.code||null,sala:o.sala||null})
      .then(function(r){datos.id=r.id;datos.to=r.to;datos.test=r.test_code||"";datos.mode=r.mode;codigo();})
      .catch(function(er){$("inv-si").disabled=false;aviso(error(er),true);});
  };
}
function codigo(){
  marco('<h2>Escribe el código</h2>'+
    '<p>'+(datos.mode==="prueba"?'Es el código de verificación para ':'Te lo enviamos a ')+'<b>'+esc(datos.to)+'</b>. Caduca en 10 minutos.</p>'+
    (datos.mode==="prueba"?'<div class="inv-prueba"><small>Modo de pruebas</small><span>No se envían SMS ni correos todavía. Tu código es</span><b id="inv-t">'+esc(datos.test)+'</b>'+
      '<button type="button" class="ghost au-mini" id="inv-usa">Usar este código</button></div>':'')+
    '<form class="rt-form" id="inv-cf"><input id="inv-k" class="inv-k" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="\\d{6}" placeholder="••••••" required aria-label="Código de 6 cifras">'+
    '<p class="msg" id="inv-msg"></p></form>',
    '<button class="ghost" id="inv-atras" type="button">Cambiar datos</button><button class="primary" id="inv-ver" type="submit" form="inv-cf">Verificar</button>');
  $("inv-k").focus();
  if($("inv-usa"))$("inv-usa").onclick=function(){$("inv-k").value=datos.test;};
  $("inv-atras").onclick=formulario;
  $("inv-cf").onsubmit=function(e){
    e.preventDefault(); $("inv-ver").disabled=true; aviso("Comprobando…");
    api("/api/guest/verify",{id:datos.id,code:$("inv-k").value}).then(function(){
      var fin=function(){cierra(true);};
      if(window.AxAccount&&AxAccount.refresca)AxAccount.refresca().then(fin,fin); else fin();
    }).catch(function(er){
      $("inv-ver").disabled=false;
      aviso(error(er)+(er&&er.error==="bad_code"&&er.left>=0?" Te quedan "+er.left+" intento"+(er.left===1?"":"s")+".":""),true);
      if(er&&/code_expired|code_used|too_many_attempts/.test(er.error))setTimeout(formulario,1600);
    });
  };
}
function cierra(ok){
  host.classList.remove("on"); host.innerHTML=""; document.body.style.overflow="";
  if(ok&&datos){datos={channel:datos.channel};}
  var r=espera; espera=null; if(r)r(!!ok);
}
document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&host.classList.contains("on"))cierra(false); });

window.AxInvitado={abre:abre};
})();
