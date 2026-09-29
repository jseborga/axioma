/* ===========================================================
   THE FINAL TEST · Repaso público (ingreso a la universidad, nivelación)
   Una universidad, instituto o colegio (su administración) o la
   plataforma publica un banco como «repaso». Cualquiera con cuenta lo
   practica gratis: el servidor corrige cada respuesta y dice si acertó
   y cuál era la correcta. Con un código de acceso (promociones por días)
   se desbloquean el desarrollo de cada pregunta y la calificación:
   nota sobre 100, desglose por tema e historial de intentos. Quien es
   miembro de la institución que publica tiene acceso sin código.

     GET  /api/repasos                         catálogo y mis accesos
     POST /api/repasos                         { bank_id, titulo, descripcion, n } publicar
     POST /api/repasos/:id                     { titulo, descripcion, n, activo } editar
     GET  /api/repasos/admin?org=ID            repasos y códigos (administración o plataforma)
     POST /api/repasos/codigos                 { repaso_id | org_id | todo, cantidad, dias, usos, nota, vence_dias }
     POST /api/repasos/canjear                 { codigo }
     POST /api/repasos/:id/empezar             un intento con preguntas al azar (sin respuestas)
     POST /api/repasos/intentos/:i/responder   { qid, o | v } → acierto, correcta y (con acceso) desarrollo
     POST /api/repasos/intentos/:i/terminar    resultado; con acceso, calificación e historial
   =========================================================== */
import "../public/banco-formato.js";
import { perfil, rolOrg, esInvitado, esAdminPlataforma, esAcademica, extrasBanco } from "./aula.js";
var B=globalThis.AxBanco;

var ALFABETO="ABCDEFGHJKLMNPQRSTUVWXYZ23456789", DIA=86400000;
var MAX_CODIGOS=500, MAX_INTENTOS_DIA=40;
function limpia(s,max){return String(s==null?"":s).replace(/\s+/g," ").trim().slice(0,max);}
function codigo(n){var b=new Uint8Array(n);crypto.getRandomValues(b);var s="";for(var i=0;i<n;i++)s+=ALFABETO[b[i]%ALFABETO.length];return s;}
function baraja(a){for(var i=a.length-1;i>0;i--){var r=new Uint32Array(1);crypto.getRandomValues(r);var j=r[0]%(i+1),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function normCodigo(c){return String(c||"").toUpperCase().replace(/[^A-Z0-9]/g,"");}

/* preguntas de un banco aptas para repaso: todas menos las de texto libre (no hay quien las corrija) */
async function preguntasRepaso(env,bankId){
  var ex=await extrasBanco(env,bankId);
  var r=((await env.DB.prepare("SELECT id,level,topic,q,opts,answer FROM bank_questions WHERE bank_id=?").bind(bankId).all()).results)||[];
  return r.map(function(x){var e=ex[x.id]||{};return {id:x.id,tema:x.topic||"",nivel:x.level,q:x.q,opts:JSON.parse(x.opts),answer:x.answer,
    tipo:e.tipo||"opcion",num:e.num||null,img:e.imagen||null,oimg:e.opt_imgs||null,des:e.desarrollo||""};})
    .filter(function(p){return p.tipo!=="abierta";});
}
/* ¿tiene acceso completo (desarrollo y calificación)? */
async function acceso(env,user,rep){
  if(!user)return null;
  if(rep.org_id&&await rolOrg(env,rep.org_id,user.id))return {miembro:true};
  var r=await env.DB.prepare("SELECT MAX(hasta) AS hasta FROM repaso_accesos WHERE user_id=? AND hasta>? AND alcance IN (?,?,'todo')")
    .bind(user.id,Date.now(),"r"+rep.id,"o"+(rep.org_id||"")).first();
  return r&&r.hasta?{hasta:r.hasta}:null;
}
/* quién publica y gestiona: la administración de la institución educativa del banco, o la plataforma */
async function gestionaOrg(env,user,orgId){
  if(esAdminPlataforma(env,user))return true;
  if(!orgId)return false;
  var o=await env.DB.prepare("SELECT kind FROM orgs WHERE id=?").bind(orgId).first();
  return !!(o&&esAcademica(o.kind)&&(await rolOrg(env,orgId,user.id))==="admin");
}

async function catalogo(env,user,json){
  var r=((await env.DB.prepare("SELECT r.*,o.name AS org_name,(SELECT COUNT(*) FROM bank_questions q WHERE q.bank_id=r.bank_id) AS preguntas "+
    "FROM repasos r LEFT JOIN orgs o ON o.id=r.org_id WHERE r.activo=1 ORDER BY r.created_at DESC LIMIT 200").all()).results)||[];
  var out=[];
  for(var i=0;i<r.length;i++){var x=r[i], a=await acceso(env,user,x);
    out.push({id:x.id,titulo:x.titulo,descripcion:x.descripcion||"",org_name:x.origen==="plataforma"?"The Final Test":(x.org_name||""),origen:x.origen,
      n:x.n,preguntas:x.preguntas,acceso:a?(a.miembro?"miembro":a.hasta):null});}
  return json({repasos:out});
}
async function publica(req,env,user,json){
  var b=await req.json().catch(function(){return {};});
  var bk=await env.DB.prepare("SELECT * FROM banks WHERE id=?").bind(parseInt(b.bank_id,10)||0).first();
  if(!bk)return json({error:"not_found"},null,404);
  var pa=esAdminPlataforma(env,user);
  if(!pa&&!(await gestionaOrg(env,user,bk.org_id)))return json({error:"forbidden"},null,403);
  var titulo=limpia(b.titulo,80), n=Math.max(5,Math.min(50,parseInt(b.n,10)||10));
  if(titulo.length<3)return json({error:"bad_name"},null,400);
  var qs=await preguntasRepaso(env,bk.id);
  if(qs.length<5)return json({error:"few_questions",available:qs.length,needed:5},null,400);
  /* la plataforma publica en su nombre si no administra esa institución */
  var origen=pa&&(await rolOrg(env,bk.org_id,user.id))!=="admin"?"plataforma":"institucion";
  var r=await env.DB.prepare("INSERT INTO repasos(bank_id,org_id,titulo,descripcion,n,origen,publicado_por,activo,created_at) VALUES(?,?,?,?,?,?,?,1,?)")
    .bind(bk.id,bk.org_id,titulo,limpia(b.descripcion,300)||null,Math.min(n,qs.length),origen,user.id,Date.now()).run();
  return json({ok:true,id:r.meta&&r.meta.last_row_id});
}
async function edita(req,env,user,id,json){
  var rep=await env.DB.prepare("SELECT * FROM repasos WHERE id=?").bind(id).first();
  if(!rep)return json({error:"not_found"},null,404);
  if(!(await gestionaOrg(env,user,rep.org_id)))return json({error:"forbidden"},null,403);
  var b=await req.json().catch(function(){return {};});
  var titulo=b.titulo!==undefined?limpia(b.titulo,80):rep.titulo, n=b.n!==undefined?Math.max(5,Math.min(50,parseInt(b.n,10)||10)):rep.n;
  if(titulo.length<3)return json({error:"bad_name"},null,400);
  await env.DB.prepare("UPDATE repasos SET titulo=?,descripcion=?,n=?,activo=? WHERE id=?")
    .bind(titulo,b.descripcion!==undefined?(limpia(b.descripcion,300)||null):rep.descripcion,n,b.activo===undefined?rep.activo:(b.activo?1:0),id).run();
  return json({ok:true});
}
async function admin(env,user,url,json){
  var org=String(url.searchParams.get("org")||""), pa=esAdminPlataforma(env,user);
  if(org?!(await gestionaOrg(env,user,org)):!pa)return json({error:"forbidden"},null,403);
  var rs=((await (org?env.DB.prepare("SELECT r.*,b.name AS bank_name,o.name AS org_name FROM repasos r JOIN banks b ON b.id=r.bank_id LEFT JOIN orgs o ON o.id=r.org_id WHERE r.org_id=? ORDER BY r.created_at DESC").bind(org)
    :env.DB.prepare("SELECT r.*,b.name AS bank_name,o.name AS org_name FROM repasos r JOIN banks b ON b.id=r.bank_id LEFT JOIN orgs o ON o.id=r.org_id ORDER BY r.created_at DESC LIMIT 300")).all()).results)||[];
  var cs=((await (org?env.DB.prepare("SELECT * FROM repaso_codigos WHERE org_id=? OR repaso_id IN (SELECT id FROM repasos WHERE org_id=?) ORDER BY created_at DESC LIMIT 1000").bind(org,org)
    :env.DB.prepare("SELECT * FROM repaso_codigos ORDER BY created_at DESC LIMIT 1000")).all()).results)||[];
  var usados=((await env.DB.prepare("SELECT repaso_id,COUNT(*) AS n,COUNT(DISTINCT user_id) AS u FROM repaso_intentos GROUP BY repaso_id").all()).results)||[], uso={};
  usados.forEach(function(x){uso[x.repaso_id]=x;});
  return json({repasos:rs.map(function(r){return {id:r.id,titulo:r.titulo,descripcion:r.descripcion||"",n:r.n,activo:!!r.activo,origen:r.origen,bank_id:r.bank_id,
      bank_name:r.bank_name,org_name:r.org_name||"",intentos:uso[r.id]?uso[r.id].n:0,personas:uso[r.id]?uso[r.id].u:0};}),
    codigos:cs.map(function(c){return {codigo:c.codigo,repaso_id:c.repaso_id,org_id:c.org_id,todo:!c.repaso_id&&!c.org_id,dias:c.dias,
      usos:c.usos,usos_max:c.usos_max,nota:c.nota||"",vence:c.vence,created_at:c.created_at};})});
}
async function creaCodigos(req,env,user,json){
  var b=await req.json().catch(function(){return {};}), pa=esAdminPlataforma(env,user), repId=null, org=null;
  if(b.repaso_id){var rep=await env.DB.prepare("SELECT * FROM repasos WHERE id=?").bind(parseInt(b.repaso_id,10)||0).first();
    if(!rep)return json({error:"not_found"},null,404); if(!(await gestionaOrg(env,user,rep.org_id)))return json({error:"forbidden"},null,403); repId=rep.id;}
  else if(b.org_id){org=String(b.org_id); if(!(await gestionaOrg(env,user,org)))return json({error:"forbidden"},null,403);}
  else if(!(b.todo&&pa))return json({error:"forbidden"},null,403);
  var cant=Math.max(1,Math.min(200,parseInt(b.cantidad,10)||1)), dias=Math.max(1,Math.min(730,parseInt(b.dias,10)||30)),
      usos=Math.max(1,Math.min(1000,parseInt(b.usos,10)||1)), vd=parseInt(b.vence_dias,10)||0, now=Date.now();
  var total=await env.DB.prepare("SELECT COUNT(*) AS n FROM repaso_codigos WHERE creado_por=? AND created_at>?").bind(user.id,now-DIA).first();
  if(total.n+cant>MAX_CODIGOS)return json({error:"too_many"},null,400);
  var out=[], ops=[];
  for(var i=0;i<cant;i++){var c=codigo(10); out.push(c);
    ops.push(env.DB.prepare("INSERT INTO repaso_codigos(codigo,repaso_id,org_id,dias,usos_max,usos,nota,creado_por,vence,created_at) VALUES(?,?,?,?,?,0,?,?,?,?)")
      .bind(c,repId,org,dias,usos,limpia(b.nota,80)||null,user.id,vd>0?now+vd*DIA:null,now));}
  await env.DB.batch(ops);
  return json({ok:true,codigos:out,dias:dias,usos:usos});
}
async function canjea(req,env,user,json){
  var b=await req.json().catch(function(){return {};}), c=normCodigo(b.codigo), now=Date.now();
  if(c.length!==10)return json({error:"bad_code"},null,400);
  var k=await env.DB.prepare("SELECT * FROM repaso_codigos WHERE codigo=?").bind(c).first();
  if(!k)return json({error:"bad_code"},null,404);
  if(k.vence&&k.vence<now)return json({error:"code_expired"},null,400);
  var alcance=k.repaso_id?"r"+k.repaso_id:k.org_id?"o"+k.org_id:"todo";
  var ya=await env.DB.prepare("SELECT 1 FROM repaso_accesos WHERE user_id=? AND codigo=?").bind(user.id,c).first();
  if(ya)return json({error:"code_used"},null,400);
  /* un uso más, solo si quedan (atómico) */
  var r=await env.DB.prepare("UPDATE repaso_codigos SET usos=usos+1 WHERE codigo=? AND usos<usos_max").bind(c).run();
  if(!r.meta||r.meta.changes!==1)return json({error:"code_used"},null,400);
  var prev=await env.DB.prepare("SELECT hasta FROM repaso_accesos WHERE user_id=? AND alcance=?").bind(user.id,alcance).first();
  var hasta=Math.max(now,prev?prev.hasta:0)+k.dias*DIA;
  await env.DB.prepare("INSERT INTO repaso_accesos(user_id,alcance,hasta,codigo,created_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,alcance) DO UPDATE SET hasta=excluded.hasta,codigo=excluded.codigo")
    .bind(user.id,alcance,hasta,c,now).run();
  var nombre=k.repaso_id?(await env.DB.prepare("SELECT titulo FROM repasos WHERE id=?").bind(k.repaso_id).first()||{}).titulo:
    k.org_id?"todos los repasos de "+((await env.DB.prepare("SELECT name FROM orgs WHERE id=?").bind(k.org_id).first())||{}).name:"todos los repasos";
  return json({ok:true,alcance:alcance,hasta:hasta,para:nombre||""});
}
/* la pregunta tal como la ve quien responde: sin la correcta */
function publica_(p){
  var t=p.tipo, orden=t==="opcion"?baraja(p.opts.map(function(_,k){return k;})):t==="vf"?[0,1]:[];
  return {pub:{qid:p.id,q:p.q,tema:p.tema,tipo:t,o:orden.map(function(k){return p.opts[k];}),img:p.img?"/api/img/"+p.img:null,
    oimg:p.oimg&&orden.length?orden.map(function(k){return p.oimg[k]?"/api/img/"+p.oimg[k]:null;}):null},orden:orden};
}
async function empieza(env,user,id,json){
  var rep=await env.DB.prepare("SELECT * FROM repasos WHERE id=? AND activo=1").bind(id).first();
  if(!rep)return json({error:"not_found"},null,404);
  var hoy=await env.DB.prepare("SELECT COUNT(*) AS n FROM repaso_intentos WHERE user_id=? AND created_at>?").bind(user.id,Date.now()-DIA).first();
  if(hoy.n>=MAX_INTENTOS_DIA)return json({error:"too_many"},null,429);
  var qs=baraja(await preguntasRepaso(env,rep.bank_id)).slice(0,rep.n);
  if(!qs.length)return json({error:"empty_pool"},null,400);
  var pubs=qs.map(publica_), plan=qs.map(function(p,i){return {id:p.id,orden:pubs[i].orden};});
  var r=await env.DB.prepare("INSERT INTO repaso_intentos(repaso_id,user_id,plan,respuestas,aciertos,total,created_at) VALUES(?,?,?,?,0,?,?)")
    .bind(rep.id,user.id,JSON.stringify(plan),"{}",qs.length,Date.now()).run();
  var a=await acceso(env,user,rep);
  return json({intento:r.meta&&r.meta.last_row_id,titulo:rep.titulo,acceso:!!a,questions:pubs.map(function(x){return x.pub;})});
}
async function intento(env,user,iid){
  var t=await env.DB.prepare("SELECT * FROM repaso_intentos WHERE id=?").bind(iid).first();
  return t&&t.user_id===user.id?t:null;
}
async function responde(req,env,user,iid,json){
  var t=await intento(env,user,iid); if(!t)return json({error:"not_found"},null,404);
  if(t.terminado_at)return json({error:"finished"},null,400);
  var b=await req.json().catch(function(){return {};}), qid=parseInt(b.qid,10), plan=JSON.parse(t.plan), resp=JSON.parse(t.respuestas||"{}");
  var pl=plan.filter(function(x){return x.id===qid;})[0]; if(!pl)return json({error:"bad_request"},null,400);
  if(resp[qid])return json({error:"already"},null,409);
  var rep=await env.DB.prepare("SELECT * FROM repasos WHERE id=?").bind(t.repaso_id).first();
  var p=(await preguntasRepaso(env,rep.bank_id)).filter(function(x){return x.id===qid;})[0]; if(!p)return json({error:"not_found"},null,404);
  var ok, correcta;
  if(p.tipo==="numerica"){ok=B.numeroOk(limpia(b.v,40),p.num); correcta=String(p.num.v).replace(".",",")+(p.num.tol?" ± "+String(p.num.tol).replace(".",","):"");}
  else{var o=parseInt(b.o,10), k=pl.orden[o]; ok=k===p.answer; correcta=p.opts[p.answer];}
  resp[qid]={ok:ok?1:0,tema:p.tema};
  /* condicional: si llegan dos respuestas a la vez, solo cuenta la primera */
  var r=await env.DB.prepare("UPDATE repaso_intentos SET respuestas=?,aciertos=aciertos+? WHERE id=? AND respuestas=?").bind(JSON.stringify(resp),ok?1:0,iid,t.respuestas).run();
  if(!r.meta||r.meta.changes!==1)return json({error:"already"},null,409);
  var a=await acceso(env,user,rep);
  return json({ok:true,correct:ok,answer:correcta,desarrollo:a?p.des||"":null,locked:!a&&!!p.des});
}
async function termina(env,user,iid,json){
  var t=await intento(env,user,iid); if(!t)return json({error:"not_found"},null,404);
  if(!t.terminado_at)await env.DB.prepare("UPDATE repaso_intentos SET terminado_at=? WHERE id=? AND terminado_at IS NULL").bind(Date.now(),iid).run();
  t=await intento(env,user,iid);
  var rep=await env.DB.prepare("SELECT * FROM repasos WHERE id=?").bind(t.repaso_id).first(), a=await acceso(env,user,rep);
  var resp=JSON.parse(t.respuestas||"{}"), respondidas=Object.keys(resp).length;
  var out={ok:true,titulo:rep.titulo,aciertos:t.aciertos,total:t.total,respondidas:respondidas,acceso:!!a};
  if(!a)return json(out);
  /* calificación: nota sobre 100, desglose por tema e historial */
  var temas={}; Object.keys(resp).forEach(function(k){var x=resp[k], n=x.tema||"General", g=temas[n]||(temas[n]={tema:n,aciertos:0,total:0}); g.total++; g.aciertos+=x.ok;});
  out.nota=Math.round(100*t.aciertos/Math.max(1,t.total));
  out.temas=Object.keys(temas).map(function(k){var g=temas[k];g.pct=Math.round(100*g.aciertos/g.total);return g;}).sort(function(x,y){return x.pct-y.pct;});
  out.historial=(((await env.DB.prepare("SELECT aciertos,total,created_at FROM repaso_intentos WHERE repaso_id=? AND user_id=? AND terminado_at IS NOT NULL ORDER BY created_at DESC LIMIT 20")
    .bind(rep.id,user.id).all()).results)||[]).map(function(x){return {nota:Math.round(100*x.aciertos/Math.max(1,x.total)),fecha:x.created_at};});
  return json(out);
}

export async function handleRepaso(req,env,url,path,ctx){
  var json=ctx.json, user=ctx.user, m;
  if(!env.DB)return json({error:"not_configured"},null,503);
  try{
    if(path==="/repasos"&&req.method==="GET")return await catalogo(env,user,json);
    if(!user)return json({error:"unauthorized"},null,401);
    if(esInvitado(user))return json({error:"google_required"},null,403);
    if(!(await perfil(env,user.id)).complete)return json({error:"profile_required"},null,403);
    if(path==="/repasos"&&req.method==="POST")return await publica(req,env,user,json);
    if(path==="/repasos/admin"&&req.method==="GET")return await admin(env,user,url,json);
    if(path==="/repasos/codigos"&&req.method==="POST")return await creaCodigos(req,env,user,json);
    if(path==="/repasos/canjear"&&req.method==="POST")return await canjea(req,env,user,json);
    if((m=path.match(/^\/repasos\/(\d+)$/))&&req.method==="POST")return await edita(req,env,user,+m[1],json);
    if((m=path.match(/^\/repasos\/(\d+)\/empezar$/))&&req.method==="POST")return await empieza(env,user,+m[1],json);
    if((m=path.match(/^\/repasos\/intentos\/(\d+)\/responder$/))&&req.method==="POST")return await responde(req,env,user,+m[1],json);
    if((m=path.match(/^\/repasos\/intentos\/(\d+)\/terminar$/))&&req.method==="POST")return await termina(env,user,+m[1],json);
  }catch(e){
    if(/no such table/i.test(String(e&&e.message)))return json({error:"not_configured"},null,503);
    throw e;
  }
  return json({error:"not_found"},null,404);
}
