/* ===========================================================
   THE FINAL TEST · jugadores invitados (API)
   Para las convocatorias de empresas y eventos: se participa sin cuenta
   de Google, con nombre y un teléfono o correo que se verifica con un
   código de seis cifras. El usuario se deriva del contacto verificado,
   así que un mismo teléfono o correo es siempre la misma persona y solo
   puede participar una vez en cada convocatoria.

     POST /api/guest/start   { name, channel:"sms"|"email", contact, birthdate,
                               guardian_name, guardian_email, accept, marketing, contest | sala }
                             → { id, channel, to, expires_in, mode, test_code? }
     POST /api/guest/verify  { id, code } → { user } y cookie de sesión

   Con VERIFY_MODE="prueba" (por defecto) no se envía nada: el código
   vuelve en la respuesta y la pantalla lo muestra. Con "real" se envía
   por el servicio de SMS o correo (función envia, aún sin conectar).

   Contra la trampa: códigos de un solo uso que caducan en 10 minutos,
   5 intentos por código, 3 códigos por contacto y hora, 20 por dirección
   IP y hora, contactos bloqueables por la plataforma, y una sola
   participación por contacto verificado.
   =========================================================== */
import { ajustes } from "./ajustes.js";
import { edad, TERMS_VERSION, esInvitado } from "./aula.js";
export { esInvitado };

var VIGENCIA=10*60000, INTENTOS=5, POR_CONTACTO=3, POR_IP=20, HORA=3600000;

export async function handleInvitados(req,env,url,path,ctx){
  var json=ctx.json;
  if(!env.DB||!env.SESSION_SECRET)return json({error:"not_configured"},null,503);
  try{
    if(path==="/guest/start"&&req.method==="POST")return await empieza(req,env,json);
    if(path==="/guest/verify"&&req.method==="POST")return await verifica(req,env,json,ctx.sesion);
  }catch(e){
    if(/no such table/i.test(String(e&&e.message)))return json({error:"not_configured"},null,503);
    throw e;
  }
  return json({error:"not_found"},null,404);
}

/* ---------- utilidades ---------- */
function limpia(s,max){return String(s==null?"":s).replace(/\s+/g," ").trim().slice(0,max);}
function hex(buf){return Array.prototype.map.call(new Uint8Array(buf),function(b){return ("0"+b.toString(16)).slice(-2);}).join("");}
async function hmac(secret,texto){
  var k=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return hex(await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(texto)));
}
/* contacto normalizado: correos en minúsculas y sin etiqueta +algo (y sin
   puntos en gmail); teléfonos solo con cifras y prefijo internacional */
export function normaliza(canal,valor){
  var v=String(valor||"").trim();
  if(canal==="email"){
    v=v.toLowerCase();
    var m=/^([^\s@<>"]{1,64})@([a-z0-9.-]+\.[a-z]{2,})$/.exec(v); if(!m)return "";
    var local=m[1].split("+")[0], dom=m[2];
    if(dom==="gmail.com"||dom==="googlemail.com"){local=local.replace(/\./g,"");dom="gmail.com";}
    return local?local+"@"+dom:"";
  }
  if(canal==="sms"){
    var d=v.replace(/[^\d+]/g,""); if(d.indexOf("00")===0)d="+"+d.slice(2);
    var solo=d.replace(/\D/g,"");
    if(solo.length<8||solo.length>15)return "";
    return "+"+solo;
  }
  return "";
}
function oculta(canal,c){
  if(canal==="email"){var p=c.split("@");return p[0].slice(0,2)+"•••@"+p[1];}
  return c.slice(0,4)+" ••• "+c.slice(-3);
}
export async function idInvitado(env,canal,contacto){return "g_"+(await hmac(env.SESSION_SECRET,"invitado:"+canal+":"+contacto)).slice(0,24);}
function ipDe(req){return req.headers.get("CF-Connecting-IP")||req.headers.get("X-Forwarded-For")||"local";}

/* Envío real del código. Cuando se conecte un servicio (SMS o correo),
   aquí va la llamada; hasta entonces devuelve false y la API responde
   que la verificación real no está disponible. */
async function envia(env,canal,contacto,codigo){ return false; }

/* ---------- 1. pedir código ---------- */
async function empieza(req,env,json){
  var b=await req.json().catch(function(){return {};});
  var modo=ajustes(env).verificacion;
  var nombre=limpia(b.name,60), canal=b.channel==="sms"?"sms":"email", contacto=normaliza(canal,b.contact);
  if(nombre.length<2)return json({error:"bad_name"},null,400);
  if(!contacto)return json({error:canal==="sms"?"bad_phone":"bad_email"},null,400);
  var e=edad(b.birthdate);
  if(e===null||e<10||e>110)return json({error:"bad_birthdate"},null,400);
  if(b.accept!==true)return json({error:"terms_required"},null,400);
  var gn=null, ge=null;
  if(e<18){
    gn=limpia(b.guardian_name,80); ge=limpia(b.guardian_email,120).toLowerCase();
    if(gn.length<3||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ge))return json({error:"guardian_required"},null,400);
  }
  /* solo para convocatorias abiertas que admiten invitados */
  /* para una convocatoria que admite invitados, o para una sala en vivo con ese acceso */
  var code, sala=null;
  if(b.sala){
    sala=String(b.sala).toUpperCase(); code="";
    var sl=await env.DB.prepare("SELECT acceso,estado FROM salas WHERE code=?").bind(sala).first();
    if(!sl||sl.acceso!=="invitados")return json({error:"guests_not_allowed"},null,403);
  }else{
    code=String(b.contest||"").toUpperCase();
    var c=await env.DB.prepare("SELECT c.code,c.ends_at,o.guests FROM contests c JOIN contest_options o ON o.code=c.code WHERE c.code=?").bind(code).first();
    if(!c||!c.guests)return json({error:"guests_not_allowed"},null,403);
    if(c.ends_at<=Date.now())return json({error:"finished"},null,400);
  }

  var uid=await idInvitado(env,canal,contacto);
  if(await env.DB.prepare("SELECT 1 FROM user_blocks WHERE user_id=?").bind(uid).first())return json({error:"blocked"},null,403);
  var now=Date.now(), ip=(await hmac(env.SESSION_SECRET,"ip:"+ipDe(req))).slice(0,16);
  var pc=await env.DB.prepare("SELECT COUNT(*) AS n FROM verify_codes WHERE contact=? AND created_at>?").bind(canal+":"+contacto,now-HORA).first();
  if(pc.n>=POR_CONTACTO)return json({error:"too_many_codes"},null,429);
  var pi=await env.DB.prepare("SELECT COUNT(*) AS n FROM verify_codes WHERE ip=? AND created_at>?").bind(ip,now-HORA).first();
  if(pi.n>=POR_IP)return json({error:"too_many_codes"},null,429);

  var n=new Uint32Array(2); crypto.getRandomValues(n);
  var cod=String(100000+n[0]%900000), id=hex(crypto.getRandomValues(new Uint8Array(12)));
  if(modo==="real"&&!(await envia(env,canal,contacto,cod)))return json({error:"verify_unavailable"},null,503);
  await env.DB.prepare("INSERT INTO verify_codes(id,channel,contact,code_hash,data,ip,expires_at,created_at) VALUES(?,?,?,?,?,?,?,?)")
    .bind(id,canal,canal+":"+contacto,await hmac(env.SESSION_SECRET,"codigo:"+id+":"+cod),
          JSON.stringify({name:nombre,birthdate:b.birthdate,gn:gn,ge:ge,marketing:b.marketing===true,contest:code,sala:sala}),ip,now+VIGENCIA,now).run();
  var out={id:id,channel:canal,to:oculta(canal,contacto),expires_in:VIGENCIA/1000,mode:modo};
  if(modo==="prueba")out.test_code=cod;
  return json(out);
}

/* ---------- 2. comprobar el código y abrir sesión ---------- */
async function verifica(req,env,json,sesion){
  var b=await req.json().catch(function(){return {};});
  var id=String(b.id||""), cod=String(b.code||"").replace(/\D/g,"");
  var v=await env.DB.prepare("SELECT * FROM verify_codes WHERE id=?").bind(id).first();
  var now=Date.now();
  if(!v)return json({error:"not_found"},null,404);
  if(v.used_at)return json({error:"code_used"},null,400);
  if(v.expires_at<now)return json({error:"code_expired"},null,400);
  if(v.attempts>=INTENTOS)return json({error:"too_many_attempts"},null,429);
  if(await hmac(env.SESSION_SECRET,"codigo:"+id+":"+cod)!==v.code_hash){
    await env.DB.prepare("UPDATE verify_codes SET attempts=attempts+1 WHERE id=?").bind(id).run();
    return json({error:"bad_code",left:INTENTOS-v.attempts-1},null,400);
  }
  /* un solo uso, también si llegan dos a la vez */
  var r=await env.DB.prepare("UPDATE verify_codes SET used_at=? WHERE id=? AND used_at IS NULL").bind(now,id).run();
  if(!r.meta||r.meta.changes!==1)return json({error:"code_used"},null,400);

  var d=JSON.parse(v.data), canal=v.channel, contacto=v.contact.slice(canal.length+1);
  var uid=await idInvitado(env,canal,contacto);
  if(await env.DB.prepare("SELECT 1 FROM user_blocks WHERE user_id=?").bind(uid).first())return json({error:"blocked"},null,403);
  var modo=ajustes(env).verificacion==="real"?canal:"prueba", s=Math.floor(now/1000);
  var ops=[
    env.DB.prepare("INSERT INTO users(id,email,name,picture,created_at,last_seen) VALUES(?,?,?,?,?,?) "+
      "ON CONFLICT(id) DO UPDATE SET name=excluded.name,last_seen=excluded.last_seen")
      .bind(uid,canal==="email"?contacto:"",d.name,"",s,s),
    env.DB.prepare("INSERT INTO guests(user_id,channel,contact,verified_by,created_at,verified_at) VALUES(?,?,?,?,?,?) "+
      "ON CONFLICT(user_id) DO UPDATE SET verified_by=excluded.verified_by,verified_at=excluded.verified_at")
      .bind(uid,canal,contacto,modo,now,now),
    env.DB.prepare("INSERT INTO profiles(user_id,birthdate,terms_version,terms_at,guardian_name,guardian_email,updated_at) VALUES(?,?,?,?,?,?,?) "+
      "ON CONFLICT(user_id) DO UPDATE SET birthdate=excluded.birthdate,terms_version=excluded.terms_version,terms_at=excluded.terms_at,"+
      "guardian_name=excluded.guardian_name,guardian_email=excluded.guardian_email,updated_at=excluded.updated_at")
      .bind(uid,d.birthdate,TERMS_VERSION,now,d.gn,d.ge,now)
  ];
  /* consentimiento de contacto para la empresa que organiza la convocatoria */
  var org=d.sala?await env.DB.prepare("SELECT org_id FROM salas WHERE code=?").bind(d.sala).first()
                :await env.DB.prepare("SELECT org_id FROM contest_scope WHERE code=?").bind(d.contest).first();
  if(org&&org.org_id)ops.push(env.DB.prepare(
    "INSERT INTO contact_consents(user_id,org_id,marketing,created_at) VALUES(?,?,?,?) ON CONFLICT(user_id,org_id) DO UPDATE SET marketing=excluded.marketing,created_at=excluded.created_at"
  ).bind(uid,org.org_id,d.marketing?1:0,now));
  await env.DB.batch(ops);
  var cookie=await sesion(uid);
  return json({ok:true,contest:d.contest,sala:d.sala||null,user:{id:uid,name:d.name,picture:"",email:canal==="email"?contacto:"",guest:true,verified_by:modo}},{"Set-Cookie":cookie});
}
