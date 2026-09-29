/* ===========================================================
   THE FINAL TEST · administración de la plataforma (API)
   Solo para los correos de PLATFORM_ADMINS.

     GET  /api/admin/summary              métricas globales y por institución
     GET  /api/admin/users                ?q=&org=&type=google|invitado|bloqueado&offset=
     POST /api/admin/users/:id            { blocked:true|false, reason }
     POST /api/admin/orgs                 { name, kind, admin_email, role } alta directa (activa)
     GET  /api/admin/orgs/:id/admins      administración y creadores de retos, y altas pendientes
     POST /api/admin/orgs/:id/admins      { email, role } designar por correo · { email, remove } quitar un alta pendiente
                                          { user_id, role } cambiar su rol · { user_id, remove } quitarlo de la institución
   (GET /api/admin/orgs y POST /api/admin/orgs/:id { status } siguen en aula.js)
   =========================================================== */
import { esAdminPlataforma, invita } from "./aula.js";

var KINDS={universidad:["Facultad","Carrera","Materia"],instituto:["Carrera","Materia"],colegio:["Nivel","Curso","Materia"],
           empresa:["Área","Equipo"],comunidad:["Grupo"]};
var ALFABETO="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export async function handlePlataforma(req,env,url,path,ctx){
  var json=ctx.json, user=ctx.user, m;
  if(!env.DB)return json({error:"not_configured"},null,503);
  if(!user)return json({error:"unauthorized"},null,401);
  if(!esAdminPlataforma(env,user))return json({error:"forbidden"},null,403);
  var b=req.method==="POST"?await req.json().catch(function(){return {};}):null;
  try{
    if(path==="/admin/summary"&&req.method==="GET")return await resumen(env,json);
    if(path==="/admin/users"&&req.method==="GET")return await usuarios(env,url,json);
    if((m=path.match(/^\/admin\/users\/([^/]+)$/))&&req.method==="POST")return await bloquea(env,user,decodeURIComponent(m[1]),b,json);
    if(path==="/admin/orgs"&&req.method==="POST")return await altaOrg(env,user,b,json);
    if((m=path.match(/^\/admin\/orgs\/([A-Z0-9]{6})\/admins$/))&&req.method==="GET")return await verAdmins(env,m[1],json);
    if((m=path.match(/^\/admin\/orgs\/([A-Z0-9]{6})\/admins$/))&&req.method==="POST")return await admins(env,user,m[1],b,json);
  }catch(e){
    if(/no such table/i.test(String(e&&e.message)))return json({error:"not_configured"},null,503);
    throw e;
  }
  return json({error:"not_found"},null,404);
}

function limpia(s,max){return String(s==null?"":s).replace(/\s+/g," ").trim().slice(0,max);}
function codigo(n){var b=new Uint8Array(n);crypto.getRandomValues(b);var s="";for(var i=0;i<n;i++)s+=ALFABETO[b[i]%ALFABETO.length];return s;}

/* ---------- resumen ---------- */
async function resumen(env,json){
  var now=Date.now(), s=Math.floor(now/1000), desde=Math.floor(s/86400)*86400-29*86400;   /* 30 días naturales (UTC), hoy incluido */
  var q=function(sql){var a=[].slice.call(arguments,1),st=env.DB.prepare(sql);return a.length?st.bind.apply(st,a):st;};
  var r=await env.DB.batch([
    q("SELECT COUNT(*) AS n FROM users WHERE substr(id,1,2)<>'g_'"),
    q("SELECT verified_by,COUNT(*) AS n FROM guests GROUP BY verified_by"),
    q("SELECT kind,status,COUNT(*) AS n FROM orgs GROUP BY kind,status"),
    q("SELECT COUNT(*) AS n,SUM(ends_at>? AND starts_at<=?) AS abiertos FROM contests",now,now),
    q("SELECT SUM(joined_at>?) AS semana,SUM(joined_at>?) AS mes,COUNT(*) AS total FROM contest_entries",now-7*86400000,now-30*86400000),
    q("SELECT COUNT(*) AS n FROM user_blocks"),
    q("SELECT CAST((created_at-?)/86400 AS INTEGER) AS d,SUM(substr(id,1,2)='g_') AS inv,SUM(substr(id,1,2)<>'g_') AS goo FROM users WHERE created_at>=? GROUP BY d",desde,desde),
    q("SELECT o.id,o.name,o.kind,o.status,o.created_at,b.slug,"+
      " (SELECT COUNT(*) FROM org_members m WHERE m.org_id=o.id) AS miembros,"+
      " (SELECT COUNT(*) FROM org_members m WHERE m.org_id=o.id AND m.role='admin') AS admins,"+
      " (SELECT COUNT(*) FROM org_invites i WHERE i.org_id=o.id) AS invitaciones,"+
      " (SELECT COUNT(*) FROM contest_scope s WHERE s.org_id=o.id) AS convocatorias,"+
      " (SELECT COUNT(DISTINCT e.user_id) FROM contest_entries e JOIN contest_scope s ON s.code=e.code WHERE s.org_id=o.id) AS personas,"+
      " (SELECT MAX(e.joined_at) FROM contest_entries e JOIN contest_scope s ON s.code=e.code WHERE s.org_id=o.id) AS actividad "+
      "FROM orgs o LEFT JOIN org_brand b ON b.org_id=o.id ORDER BY o.status='pendiente' DESC, personas DESC, o.created_at DESC LIMIT 300"),
    q("SELECT org_id,email,role,created_at FROM org_invites ORDER BY created_at")
  ]);
  var rows=function(i){return r[i].results||[];}, uno=function(i){return rows(i)[0]||{};};
  var salas={total:0,month:0};
  try{var sr=await env.DB.prepare("SELECT COUNT(*) AS n,SUM(created_at>?) AS mes FROM salas").bind(now-30*86400000).first(); salas={total:sr.n||0,month:sr.mes||0};}catch(er){}
  var invitados={}, totalInv=0; rows(1).forEach(function(x){invitados[x.verified_by]=x.n;totalInv+=x.n;});
  var orgs={}; rows(2).forEach(function(x){var k=orgs[x.kind]||(orgs[x.kind]={total:0});k.total+=x.n;k[x.status]=x.n;});
  var dias=[],porDia={}; rows(6).forEach(function(x){porDia[x.d]={g:x.goo||0,i:x.inv||0};});
  for(var d=0;d<30;d++){var v=porDia[d]||{g:0,i:0};dias.push({day:new Date((desde+d*86400)*1000).toISOString().slice(0,10),google:v.g,guests:v.i});}
  var inv={}; rows(8).forEach(function(x){(inv[x.org_id]=inv[x.org_id]||[]).push({email:x.email,role:x.role});});
  return json({rooms:salas,users:uno(0).n||0,guests:totalInv,guests_by:invitados,blocked:uno(5).n||0,orgs_by_kind:orgs,
    contests:uno(3).n||0,open_contests:uno(3).abiertos||0,
    entries:{week:uno(4).semana||0,month:uno(4).mes||0,total:uno(4).total||0},daily:dias,
    orgs:rows(7).map(function(o){return {id:o.id,name:o.name,kind:o.kind,status:o.status,created_at:o.created_at,slug:o.slug||"",
      members:o.miembros,admins:o.admins,invites:inv[o.id]||[],contests:o.convocatorias,people:o.personas,last_activity:o.actividad};}),
    verify_mode:String(env.VERIFY_MODE||"").toLowerCase()==="real"?"real":"prueba"});
}

/* ---------- usuarios ---------- */
async function usuarios(env,url,json){
  var qs=url.searchParams, texto=limpia(qs.get("q"),60), org=limpia(qs.get("org"),6), tipo=qs.get("type")||"", off=Math.max(0,parseInt(qs.get("offset"),10)||0);
  var where=" WHERE 1=1", args=[];
  if(texto){var t="%"+texto.replace(/[%_]/g,"")+"%";where+=" AND (u.name LIKE ? OR u.email LIKE ? OR g.contact LIKE ?)";args.push(t,t,t);}
  if(tipo==="google")where+=" AND substr(u.id,1,2)<>'g_'";
  else if(tipo==="invitado")where+=" AND substr(u.id,1,2)='g_'";
  else if(tipo==="bloqueado")where+=" AND bl.user_id IS NOT NULL";
  if(org){where+=" AND (u.id IN (SELECT user_id FROM org_members WHERE org_id=?) OR u.id IN (SELECT e.user_id FROM contest_entries e JOIN contest_scope s ON s.code=e.code WHERE s.org_id=?))";args.push(org,org);}
  var base=" FROM users u LEFT JOIN guests g ON g.user_id=u.id LEFT JOIN user_blocks bl ON bl.user_id=u.id"+where;
  var st=env.DB.prepare("SELECT COUNT(*) AS n"+base), total=await st.bind.apply(st,args).first();
  var st2=env.DB.prepare(
    "SELECT u.id,u.name,u.email,u.created_at,u.last_seen,g.channel,g.contact,g.verified_by,bl.reason AS bloqueo,"+
    " (SELECT COUNT(*) FROM contest_entries e WHERE e.user_id=u.id) AS participaciones,"+
    " (SELECT group_concat(o.name||' · '||CASE m.role WHEN 'admin' THEN 'administración' WHEN 'docente' THEN "+
    "CASE WHEN o.kind IN ('universidad','instituto','colegio') THEN 'docente' ELSE 'organizador' END ELSE m.role END,', ') "+
    "FROM org_members m JOIN orgs o ON o.id=m.org_id WHERE m.user_id=u.id) AS instituciones"+
    base+" ORDER BY u.last_seen DESC LIMIT 100 OFFSET ?");
  var r=await st2.bind.apply(st2,args.concat([off])).all();
  return json({total:total.n,offset:off,users:(r.results||[]).map(function(u){
    var inv=!!u.channel;
    return {id:u.id,name:u.name,email:inv?(u.channel==="email"?u.contact:""):u.email,phone:u.channel==="sms"?u.contact:"",
            type:inv?"invitado":"google",verified_by:inv?u.verified_by:"google",created_at:u.created_at*1000,last_seen:u.last_seen*1000,
            entries:u.participaciones,orgs:u.instituciones||"",blocked:u.bloqueo!==null&&u.bloqueo!==undefined,block_reason:u.bloqueo||""};})});
}
async function bloquea(env,admin,uid,b,json){
  var u=await env.DB.prepare("SELECT id,email FROM users WHERE id=?").bind(uid).first();
  if(!u)return json({error:"not_found"},null,404);
  if(u.id===admin.id||esAdminPlataforma(env,u))return json({error:"cannot_block_admin"},null,400);
  if(b.blocked){
    await env.DB.prepare("INSERT INTO user_blocks(user_id,reason,blocked_by,created_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET reason=excluded.reason")
      .bind(uid,limpia(b.reason,200)||"—",admin.id,Date.now()).run();
  }else await env.DB.prepare("DELETE FROM user_blocks WHERE user_id=?").bind(uid).run();
  return json({ok:true});
}

/* ---------- alta de instituciones y de su administración ---------- */
async function altaOrg(env,admin,b,json){
  var name=limpia(b.name,90), kind=KINDS[b.kind]?b.kind:"empresa";
  if(name.length<3)return json({error:"bad_name"},null,400);
  var id=codigo(6), now=Date.now();
  await env.DB.prepare("INSERT INTO orgs(id,name,kind,email_domain,levels,status,teacher_code,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?)")
    .bind(id,name,kind,null,JSON.stringify(KINDS[kind]),"activa",codigo(8),admin.id,now).run();
  var r={ok:true,id:id};
  if(b.admin_email){
    var i=await invita(env,id,b.admin_email,b.role||"admin",admin.id);
    if(i.error)return json({error:i.error,id:id},null,400);
    r.admin=i;
  }
  return json(r);
}
/* quién gestiona una institución: administración (todo) y creadores de retos o docentes
   (bancos, convocatorias, cuestionarios y premios); más las altas por correo pendientes */
async function verAdmins(env,id,json){
  var o=await env.DB.prepare("SELECT id,name,kind FROM orgs WHERE id=?").bind(id).first();
  if(!o)return json({error:"not_found"},null,404);
  var m=await env.DB.prepare(
    "SELECT u.id,u.name,u.email,m.role,m.joined_at FROM org_members m JOIN users u ON u.id=m.user_id "+
    "WHERE m.org_id=? AND m.role IN ('admin','docente') ORDER BY m.role,u.name"
  ).bind(id).all();
  var i=await env.DB.prepare("SELECT email,role,created_at FROM org_invites WHERE org_id=? ORDER BY created_at").bind(id).all();
  return json({id:o.id,name:o.name,kind:o.kind,people:m.results||[],invites:i.results||[]});
}
async function admins(env,admin,id,b,json){
  var o=await env.DB.prepare("SELECT id FROM orgs WHERE id=?").bind(id).first();
  if(!o)return json({error:"not_found"},null,404);
  if(b.user_id){
    var uid=String(b.user_id), mb=await env.DB.prepare("SELECT role FROM org_members WHERE org_id=? AND user_id=?").bind(id,uid).first();
    if(!mb)return json({error:"not_found"},null,404);
    if(b.remove){
      await env.DB.batch([
        env.DB.prepare("DELETE FROM course_members WHERE user_id=? AND code IN (SELECT code FROM courses WHERE org_id=?)").bind(uid,id),
        env.DB.prepare("DELETE FROM org_members WHERE org_id=? AND user_id=?").bind(id,uid)
      ]);
      return json({ok:true});
    }
    if(["admin","docente","estudiante"].indexOf(b.role)<0)return json({error:"bad_role"},null,400);
    await env.DB.prepare("UPDATE org_members SET role=? WHERE org_id=? AND user_id=?").bind(b.role,id,uid).run();
    return json({ok:true});
  }
  var email=String(b.email||"").trim().toLowerCase();
  if(b.remove){
    await env.DB.prepare("DELETE FROM org_invites WHERE org_id=? AND email=?").bind(id,email).run();
    return json({ok:true});
  }
  var i=await invita(env,id,email,b.role||"admin",admin.id);
  return i.error?json(i,null,400):json(i);
}
