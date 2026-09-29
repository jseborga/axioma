/* ===========================================================
   THE FINAL TEST · Mis preguntas (bancos personales para jugar)
   Los bancos de las instituciones educativas son para sus exámenes y
   prácticas y no salen de la sección Educativo. Para jugar con
   preguntas propias (retos entre amigos, trivia en vivo) cada persona
   tiene sus bancos personales, y las empresas y comunidades usan los
   suyos.

     GET  /api/mis-bancos                   mis bancos y los de mis empresas que puedo usar
     POST /api/mis-bancos                   { name } crea un banco personal
     GET  /api/mis-bancos/:id               el banco con sus preguntas
     POST /api/mis-bancos/:id               { name } renombra · { remove:true } lo borra
     POST /api/mis-bancos/:id/import        { items:[{q,opts,answer,level,topic}] }
     POST /api/mis-bancos/:id/questions/:q  { remove:true }

   Una fuente de preguntas para un juego es "m<id>" (banco personal) o
   "b<id>" (banco de una empresa o comunidad).
   =========================================================== */
import "../public/banco-formato.js";
import { rolOrg, esInvitado, esAcademica } from "./aula.js";
var B=globalThis.AxBanco;

var MAX_BANCOS=20, MAX_PREGUNTAS=500, MAX_IMPORT=500;
export var MIN_JUEGO=10;      /* una partida de trivia necesita al menos diez preguntas */

function limpia(s,max){return String(s==null?"":s).replace(/\s+/g," ").trim().slice(0,max);}

async function miBanco(env,user,id){
  var b=await env.DB.prepare("SELECT * FROM mis_bancos WHERE id=?").bind(id).first();
  return b&&b.owner_id===user.id?b:null;
}

/* bancos de empresas y comunidades que esta persona puede usar para jugar
   (los que creó o los de las que administra); nunca los educativos */
async function bancosDeEmpresa(env,user){
  var r=await env.DB.prepare(
    "SELECT b.id,b.name,b.org_id,o.name AS org_name,o.kind,(SELECT COUNT(*) FROM bank_questions q WHERE q.bank_id=b.id) AS questions "+
    "FROM banks b JOIN orgs o ON o.id=b.org_id LEFT JOIN org_members m ON m.org_id=b.org_id AND m.user_id=? "+
    "WHERE o.status='activa' AND (b.owner_id=? OR m.role='admin') ORDER BY o.name,b.name").bind(user.id,user.id).all();
  return (r.results||[]).filter(function(x){return !esAcademica(x.kind);})
    .map(function(x){return {fuente:"b"+x.id,id:x.id,name:x.name,org_id:x.org_id,org_name:x.org_name,questions:x.questions};});
}

/* preguntas de una fuente, listas para un juego: [{q,o,c,nivel,tema}] */
export async function preguntasDeFuente(env,user,fuente){
  var m=/^([mb])(\d+)$/.exec(String(fuente||""));
  if(!m)return {error:"bad_source"};
  var id=+m[2], filas;
  if(m[1]==="m"){
    var b=await miBanco(env,user,id); if(!b)return {error:"forbidden_bank"};
    filas=(await env.DB.prepare("SELECT q,opts,answer,level,topic FROM mis_preguntas WHERE banco_id=?").bind(id).all()).results||[];
  }else{
    var ok=(await bancosDeEmpresa(env,user)).some(function(x){return x.id===id;});
    if(!ok)return {error:"forbidden_bank"};
    filas=(await env.DB.prepare("SELECT q,opts,answer,level,topic FROM bank_questions WHERE bank_id=?").bind(id).all()).results||[];
  }
  if(!filas.length)return {error:"empty_pool"};
  return {preguntas:filas.map(function(x){return {q:x.q,o:JSON.parse(x.opts),c:x.answer,nivel:x.level,tema:x.topic||""};})};
}

async function lista(env,user,json){
  var r=await env.DB.prepare("SELECT b.id,b.name,(SELECT COUNT(*) FROM mis_preguntas q WHERE q.banco_id=b.id) AS questions FROM mis_bancos b WHERE b.owner_id=? ORDER BY b.name")
    .bind(user.id).all();
  return json({bancos:(r.results||[]).map(function(x){return {fuente:"m"+x.id,id:x.id,name:x.name,questions:x.questions};}),
    empresas:await bancosDeEmpresa(env,user),min:MIN_JUEGO});
}
async function crea(req,env,user,json){
  var b=await req.json().catch(function(){return {};}), name=limpia(b.name,60);
  if(name.length<2)return json({error:"bad_name"},null,400);
  var n=await env.DB.prepare("SELECT COUNT(*) AS n FROM mis_bancos WHERE owner_id=?").bind(user.id).first();
  if(n.n>=MAX_BANCOS)return json({error:"too_many",max:MAX_BANCOS},null,400);
  var r=await env.DB.prepare("INSERT INTO mis_bancos(owner_id,name,created_at) VALUES(?,?,?)").bind(user.id,name,Date.now()).run();
  return json({ok:true,id:r.meta&&r.meta.last_row_id});
}
async function ver(env,user,id,json){
  var b=await miBanco(env,user,id); if(!b)return json({error:"not_found"},null,404);
  var q=(await env.DB.prepare("SELECT id,q,opts,answer,level,topic FROM mis_preguntas WHERE banco_id=? ORDER BY id").bind(id).all()).results||[];
  return json({id:b.id,fuente:"m"+b.id,name:b.name,min:MIN_JUEGO,
    questions:q.map(function(x){return {id:x.id,q:x.q,opts:JSON.parse(x.opts),answer:x.answer,level:x.level,topic:x.topic||""};})});
}
async function cambia(req,env,user,id,json){
  var b=await miBanco(env,user,id); if(!b)return json({error:"not_found"},null,404);
  var d=await req.json().catch(function(){return {};});
  if(d.remove){
    await env.DB.batch([env.DB.prepare("DELETE FROM mis_preguntas WHERE banco_id=?").bind(id),env.DB.prepare("DELETE FROM mis_bancos WHERE id=?").bind(id)]);
    return json({ok:true});
  }
  var name=limpia(d.name,60); if(name.length<2)return json({error:"bad_name"},null,400);
  await env.DB.prepare("UPDATE mis_bancos SET name=? WHERE id=?").bind(name,id).run();
  return json({ok:true});
}
/* se valida otra vez con las mismas reglas que en el navegador (banco-formato.js) */
async function importa(req,env,user,id,json){
  var b=await miBanco(env,user,id); if(!b)return json({error:"not_found"},null,404);
  var d=await req.json().catch(function(){return {};});
  var items=(Array.isArray(d.items)?d.items:[]).map(function(x,i){
    var opts=Array.isArray(x.opts)?x.opts:[], ans=parseInt(x.answer,10)||0;
    return {fila:x.fila||i+1,q:x.q,correcta:opts[ans]||"",otras:opts.filter(function(_,k){return k!==ans;}),nivel:x.level,tema:x.topic};
  });
  if(!items.length)return json({error:"empty"},null,400);
  if(items.length>MAX_IMPORT)return json({error:"too_many",max:MAX_IMPORT},null,400);
  var ya=(await env.DB.prepare("SELECT q FROM mis_preguntas WHERE banco_id=?").bind(id).all()).results||[], claves={};
  ya.forEach(function(x){claves[B.clave(x.q)]=1;});
  var v=B.valida(items,claves), buenas=v.filter(function(x){return x.ok;});
  if(ya.length+buenas.length>MAX_PREGUNTAS)return json({error:"bank_full",max:MAX_PREGUNTAS},null,400);
  var now=Date.now(), ops=buenas.map(function(x){
    return env.DB.prepare("INSERT INTO mis_preguntas(banco_id,q,opts,answer,level,topic,created_at) VALUES(?,?,?,0,?,?,?)")
      .bind(id,x.q,JSON.stringify(x.opts),x.level,x.topic||null,now);
  });
  for(var i=0;i<ops.length;i+=50)await env.DB.batch(ops.slice(i,i+50));
  return json({ok:true,added:buenas.length,rejected:v.filter(function(x){return !x.ok;}).map(function(x){return {fila:x.fila,q:x.q,errores:x.errores};})});
}
async function cambiaPregunta(req,env,user,id,qid,json){
  var b=await miBanco(env,user,id); if(!b)return json({error:"not_found"},null,404);
  var d=await req.json().catch(function(){return {};});
  if(!d.remove)return json({error:"bad_request"},null,400);
  await env.DB.prepare("DELETE FROM mis_preguntas WHERE id=? AND banco_id=?").bind(qid,id).run();
  return json({ok:true});
}

export async function handleMisPreguntas(req,env,url,path,ctx){
  var json=ctx.json, user=ctx.user, m;
  if(!env.DB)return json({error:"not_configured"},null,503);
  if(!user)return json({error:"unauthorized"},null,401);
  if(esInvitado(user))return json({error:"google_required"},null,403);
  try{
    if(path==="/mis-bancos"&&req.method==="GET")return await lista(env,user,json);
    if(path==="/mis-bancos"&&req.method==="POST")return await crea(req,env,user,json);
    if((m=path.match(/^\/mis-bancos\/(\d+)$/))&&req.method==="GET")return await ver(env,user,+m[1],json);
    if((m=path.match(/^\/mis-bancos\/(\d+)$/))&&req.method==="POST")return await cambia(req,env,user,+m[1],json);
    if((m=path.match(/^\/mis-bancos\/(\d+)\/import$/))&&req.method==="POST")return await importa(req,env,user,+m[1],json);
    if((m=path.match(/^\/mis-bancos\/(\d+)\/questions\/(\d+)$/))&&req.method==="POST")return await cambiaPregunta(req,env,user,+m[1],+m[2],json);
  }catch(e){
    if(/no such table/i.test(String(e&&e.message)))return json({error:"not_configured"},null,503);
    throw e;
  }
  return json({error:"not_found"},null,404);
}
