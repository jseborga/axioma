/* ===========================================================
   THE FINAL TEST · ajustes de la plataforma
   Todo lo configurable sin tocar código sale de aquí, leído de las
   variables del Worker ([vars] de wrangler.toml o del panel):
     APP_NAME       nombre que se muestra
     CONTACT_EMAIL  correo de contacto de términos, privacidad y pie
     MAIL_FROM      remitente de los correos que envíe la plataforma
                    (avisos, validaciones); si falta, CONTACT_EMAIL
   Los datos sensibles (PLATFORM_ADMINS, claves de servicios de correo)
   van como Secret y no se publican nunca en /api/config.
   =========================================================== */

var CORREO=/^[^\s@<>"]{1,64}@[a-z0-9.-]+\.[a-z]{2,}$/i;
function correo(v){ v=String(v||"").trim(); return CORREO.test(v)?v:""; }

export function ajustes(env){
  env=env||{};
  var contacto=correo(env.CONTACT_EMAIL);
  return {
    nombre:String(env.APP_NAME||"").trim()||"The Final Test",
    contacto:contacto,
    remitente:correo(env.MAIL_FROM)||contacto
  };
}

/* lo que puede ver cualquiera: va en GET /api/config */
export function ajustesPublicos(env){
  var a=ajustes(env);
  return {appName:a.nombre,contactEmail:a.contacto};
}
