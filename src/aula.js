/* ===========================================================
   THE FINAL TEST · instituciones, cursos y bancos (API)

   Perfil y consentimiento
     GET  /api/profile                    estado del registro
     POST /api/profile                    { birthdate, accept, guardian_name, guardian_email }
   Instituciones
     GET  /api/orgs                       mis instituciones y mis cursos
     POST /api/orgs                       crear (queda pendiente si hay administradores de plataforma)
     GET  /api/orgs/:id                   ficha, estructura y permisos
     POST /api/orgs/:id/settings          nombre, dominio, niveles de la estructura (admin)
     POST /api/orgs/:id/units             { parent_id, name } (admin)
     POST /api/orgs/:id/units/:uid        { name } o { remove } (admin)
     GET  /api/orgs/:id/members           (admin)
     POST /api/orgs/:id/members/:uid      { role, consent_ok, remove } (admin)
     POST /api/orgs/:id/teacher-code      nuevo enlace de docentes (admin)
     POST /api/orgs/join                  { code } enlace de docentes
     GET  /api/orgs/:id/courses           cursos que puedo ver
     POST /api/orgs/:id/courses           crear curso (admin o docente)
     GET  /api/orgs/:id/banks             bancos que puedo usar
     POST /api/orgs/:id/banks             crear banco (admin o docente)
     GET  /api/orgs/:id/quizzes           registros con filtros (unidad, parcial, gestión)
   Cursos
     GET  /api/courses/:code              ficha (lo mínimo para unirse si no eres miembro)
     POST /api/courses/:code/join         { student_code }
     POST /api/courses/:code/settings     (quien gestiona el curso)
     POST /api/courses/:code/members/:uid { role, status, remove }
   Bancos
     GET  /api/banks/:id                  preguntas
     POST /api/banks/:id/import           { items } revalidadas aquí con las mismas reglas
     POST /api/banks/:id/questions/:qid   { remove } o una pregunta nueva
     GET  /api/orgs/:id/members           también las altas pendientes por correo
     POST /api/orgs/:id/invites           { email, role, remove } alta por correo (admin)
   Plataforma
     GET  /api/admin/orgs · POST /api/admin/orgs/:id { status }
   Los jugadores invitados (sin Google) no pueden usar nada de esto:
   solo participan en las convocatorias que los admiten.
   =========================================================== */
import "../public/banco-formato.js";
var B=globalThis.AxBanco;

export var TERMS_VERSION="2026-09-28.2";   /* versión 2: empresas, invitados y consentimiento de contacto */
var KINDS={universidad:["Facultad","Carrera","Materia"],instituto:["Carrera","Materia"],colegio:["Nivel","Curso","Materia"],
           empresa:["Área","Equipo"],comunidad:["Grupo"]};
var ROLES=["admin","docente","auxiliar","estudiante","auspiciador"];
var ALFABETO="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var MAX_BANCO=2000, MAX_IMPORT=500, MAX_NIVELES=6;

/* ---------- utilidades compartidas con concursos.js ---------- */
function codigo(n){var b=new Uint8Array(n);crypto.getRandomValues(b);var s="";for(var i=0;i<n;i++)s+=ALFABETO[b[i]%ALFABETO.length];return s;}
function limpia(s,max){return String(s==null?"":s).replace(/\s+/g," ").trim().slice(0,max);}
export function edad(fecha,ahora){
  var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha||""); if(!m)return null;
  var d=new Date(ahora||Date.now()), e=d.getUTCFullYear()-(+m[1]);
  if(d.getUTCMonth()+1<+m[2]||(d.getUTCMonth()+1===+m[2]&&d.getUTCDate()<+m[3]))e--;
  return e;
}
export function esAdminPlataforma(env,user){
  var l=String(env.PLATFORM_ADMINS||"").toLowerCase().split(/[,\s]+/).filter(Boolean);
  return !!(user&&user.email&&l.indexOf(String(user.email).toLowerCase())>=0);
}
function dominioOk(org,user){
  if(!org.email_domain)return true;
  var e=String(user.email||"").toLowerCase(), d=String(org.email_domain).toLowerCase();
  return e.endsWith("@"+d)||e.endsWith("."+d);
}
export function esInvitado(user){return !!(user&&String(user.id).indexOf("g_")===0);}
function correoOk(e){return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(e);}
/* altas por correo pendientes: se aplican cuando esa persona entra con Google */
export async function aceptaInvitaciones(env,user){
  if(!user||esInvitado(user)||!user.email)return;
  var r;
  try{r=await env.DB.prepare("SELECT org_id,role FROM org_invites WHERE email=?").bind(String(user.email).toLowerCase()).all();}catch(e){return;}
  var inv=r.results||[]; if(!inv.length)return;
  var now=Date.now(), ops=[];
  inv.forEach(function(i){
    ops.push(env.DB.prepare("INSERT INTO org_members(org_id,user_id,role,joined_at) VALUES(?,?,?,?) ON CONFLICT(org_id,user_id) DO UPDATE SET role=CASE WHEN excluded.role='admin' THEN 'admin' ELSE org_members.role END")
      .bind(i.org_id,user.id,i.role,now));
    ops.push(env.DB.prepare("DELETE FROM org_invites WHERE org_id=? AND email=?").bind(i.org_id,String(user.email).toLowerCase()));
  });
  await env.DB.batch(ops);
}
export async function invita(env,orgId,email,role,por){
  email=String(email||"").trim().toLowerCase();
  if(!correoOk(email))return {error:"bad_email"};
  if(["admin","docente"].indexOf(role)<0)role="admin";
  var u=await env.DB.prepare("SELECT id FROM users WHERE lower(email)=? AND substr(id,1,2)<>'g_'").bind(email).first();
  var now=Date.now();
  if(u){
    await env.DB.prepare("INSERT INTO org_members(org_id,user_id,role,joined_at) VALUES(?,?,?,?) ON CONFLICT(org_id,user_id) DO UPDATE SET role=excluded.role")
      .bind(orgId,u.id,role,now).run();
    return {ok:true,added:true};
  }
  await env.DB.prepare("INSERT INTO org_invites(org_id,email,role,invited_by,created_at) VALUES(?,?,?,?,?) ON CONFLICT(org_id,email) DO UPDATE SET role=excluded.role")
    .bind(orgId,email,role,por,now).run();
  return {ok:true,invited:true};
}
export async function perfil(env,uid){
  var p=await env.DB.prepare("SELECT * FROM profiles WHERE user_id=?").bind(uid).first();
  if(!p)return {complete:false,minor:false};
  var e=edad(p.birthdate);
  return {complete:p.terms_version===TERMS_VERSION&&e!==null,minor:e!==null&&e<18,age:e,
          birthdate:p.birthdate,guardian_name:p.guardian_name,guardian_email:p.guardian_email,guardian_ok:!!p.guardian_ok,
          terms_version:p.terms_version};
}
/* ¿puede entrar en concursos públicos con premio? (menores sin consentimiento, no) */
export async function puedePremio(env,uid){
  var p=await perfil(env,uid);
  if(!p.minor||p.guardian_ok)return true;
  var c=await env.DB.prepare("SELECT 1 FROM org_members WHERE user_id=? AND consent_ok=1").bind(uid).first();
  return !!c;
}
export async function rolOrg(env,orgId,uid){
  if(!orgId||!uid)return null;
  var r=await env.DB.prepare("SELECT role FROM org_members WHERE org_id=? AND user_id=?").bind(orgId,uid).first();
  return r?r.role:null;
}
/* quién gestiona un curso: su docente, sus auxiliares y la administración de la institución */
export async function accesoCurso(env,code,uid){
  var c=await env.DB.prepare("SELECT * FROM courses WHERE code=?").bind(code).first();
  if(!c)return null;
  var m=uid?await env.DB.prepare("SELECT role,status FROM course_members WHERE code=? AND user_id=?").bind(code,uid).first():null;
  var ro=await rolOrg(env,c.org_id,uid);
  var gestiona=!!uid&&(c.owner_id===uid||ro==="admin"||!!(m&&m.status==="activo"&&(m.role==="docente"||m.role==="auxiliar")));
  return {curso:c,miembro:m,rolOrg:ro,gestiona:gestiona,estudiante:!!(m&&m.status==="activo"&&m.role==="estudiante")};
}
/* bancos que un usuario puede usar para un cuestionario: los suyos y, si administra, los de su institución */
export async function puedeUsarBanco(env,bankId,uid){
  var b=await env.DB.prepare("SELECT * FROM banks WHERE id=?").bind(bankId).first();
  if(!b)return null;
  if(b.owner_id===uid)return b;
  return (await rolOrg(env,b.org_id,uid))==="admin"?b:null;
}

export async function handleAula(req,env,url,path,ctx){
  var json=ctx.json, user=ctx.user, m;
  if(!env.DB)return json({error:"not_configured"},null,503);
  try{
    if(path==="/profile"&&req.method==="GET")return await verPerfil(env,user,json);
    if((m=path.match(/^\/courses\/([A-Z0-9]{6})$/))&&req.method==="GET")return await fichaCurso(env,user,m[1],json);
    if(!user)return json({error:"unauthorized"},null,401);
    if(esInvitado(user))return json({error:"google_required"},null,403);
    if(path==="/profile"&&req.method==="POST")return await guardaPerfil(req,env,user,json);
    /* todo lo demás exige haber completado el registro con consentimiento */
    var pf=await perfil(env,user.id);
    if(!pf.complete)return json({error:"profile_required"},null,403);
    var body=req.method==="POST"?await req.json().catch(function(){return {};}):null;
    if(path==="/orgs"&&req.method==="GET")return await misOrgs(env,user,json);
    if(path==="/orgs"&&req.method==="POST")return await creaOrg(env,user,body,json);
    if(path==="/orgs/join"&&req.method==="POST")return await uneDocente(env,user,body,json);
    if((m=path.match(/^\/orgs\/([A-Z0-9]{6})$/))&&req.method==="GET")return await fichaOrg(env,user,m[1],json);
    if((m=path.match(/^\/orgs\/([A-Z0-9]{6})\/settings$/))&&req.method==="POST")return await ajustesOrg(env,user,m[1],body,json);
    if((m=path.match(/^\/orgs\/([A-Z0-9]{6})\/units$/))&&req.method==="POST")return await creaUnidad(env,user,m[1],body,json);
    if((m=path.match(/^\/orgs\/([A-Z0-9]{6})\/units\/(\d+)$/))&&req.method==="POST")return await cambiaUnidad(env,user,m[1],+m[2],body,json);
    if((m=path.match(/^\/orgs\/([A-Z0-9]{6})\/members$/))&&req.method==="GET")return await miembros(env,user,m[1],json);
    if((m=path.match(/^\/orgs\/([A-Z0-9]{6})\/members\/([^/]+)$/))&&req.method==="POST")return await cambiaMiembro(env,user,m[1],decodeURIComponent(m[2]),body,json);
    if((m=path.match(/^\/orgs\/([A-Z0-9]{6})\/invites$/))&&req.method==="POST")return await invitaOrg(env,user,m[1],body,json);
    if((m=path.match(/^\/orgs\/([A-Z0-9]{6})\/teacher-code$/))&&req.method==="POST")return await nuevoCodigo(env,user,m[1],json);
    if((m=path.match(/^\/orgs\/([A-Z0-9]{6})\/courses$/))&&req.method==="GET")return await cursosOrg(env,user,m[1],json);
    if((m=path.match(/^\/orgs\/([A-Z0-9]{6})\/courses$/))&&req.method==="POST")return await creaCurso(env,user,m[1],body,json);
    if((m=path.match(/^\/orgs\/([A-Z0-9]{6})\/banks$/))&&req.method==="GET")return await bancosOrg(env,user,m[1],json);
    if((m=path.match(/^\/orgs\/([A-Z0-9]{6})\/banks$/))&&req.method==="POST")return await creaBanco(env,user,m[1],body,json);
    if((m=path.match(/^\/orgs\/([A-Z0-9]{6})\/quizzes$/))&&req.method==="GET")return await registros(env,user,m[1],url,json);
    if((m=path.match(/^\/courses\/([A-Z0-9]{6})\/join$/))&&req.method==="POST")return await uneCurso(env,user,m[1],body,json);
    if((m=path.match(/^\/courses\/([A-Z0-9]{6})\/settings$/))&&req.method==="POST")return await ajustesCurso(env,user,m[1],body,json);
    if((m=path.match(/^\/courses\/([A-Z0-9]{6})\/members\/([^/]+)$/))&&req.method==="POST")return await cambiaAlumno(env,user,m[1],decodeURIComponent(m[2]),body,json);
    if((m=path.match(/^\/banks\/(\d+)$/))&&req.method==="GET")return await verBanco(env,user,+m[1],json);
    if((m=path.match(/^\/banks\/(\d+)\/import$/))&&req.method==="POST")return await importa(env,user,+m[1],body,json);
    if((m=path.match(/^\/banks\/(\d+)\/questions\/(\d+|nueva)$/))&&req.method==="POST")return await cambiaPregunta(env,user,+m[1],m[2],body,json);
    if(path==="/admin/orgs"&&req.method==="GET")return await adminOrgs(env,user,json);
    if((m=path.match(/^\/admin\/orgs\/([A-Z0-9]{6})$/))&&req.method==="POST")return await adminEstado(env,user,m[1],body,json);
  }catch(e){
    if(/no such table/i.test(String(e&&e.message)))return json({error:"not_configured"},null,503);
    throw e;
  }
  return json({error:"not_found"},null,404);
}

/* ---------- perfil y consentimiento ---------- */
async function verPerfil(env,user,json){
  if(!user)return json({user:null});
  await aceptaInvitaciones(env,user);
  var p=await perfil(env,user.id);
  return json({user:user,profile:p,terms_version:TERMS_VERSION,platform_admin:esAdminPlataforma(env,user),
               admins_configured:!!String(env.PLATFORM_ADMINS||"").trim()});
}
async function guardaPerfil(req,env,user,json){
  var b=await req.json().catch(function(){return {};});
  var e=edad(b.birthdate);
  if(e===null||e<10||e>110)return json({error:"bad_birthdate"},null,400);
  if(b.accept!==true)return json({error:"terms_required"},null,400);
  var gn=null, ge=null;
  if(e<18){
    gn=limpia(b.guardian_name,80); ge=limpia(b.guardian_email,120).toLowerCase();
    if(gn.length<3||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ge))return json({error:"guardian_required"},null,400);
  }
  var now=Date.now();
  await env.DB.prepare(
    "INSERT INTO profiles(user_id,birthdate,terms_version,terms_at,guardian_name,guardian_email,updated_at) VALUES(?,?,?,?,?,?,?) "+
    "ON CONFLICT(user_id) DO UPDATE SET birthdate=excluded.birthdate,terms_version=excluded.terms_version,terms_at=excluded.terms_at,"+
    "guardian_name=excluded.guardian_name,guardian_email=excluded.guardian_email,updated_at=excluded.updated_at"
  ).bind(user.id,b.birthdate,TERMS_VERSION,now,gn,ge,now).run();
  return json({ok:true,profile:await perfil(env,user.id)});
}

/* ---------- instituciones ---------- */
function orgPublica(o){
  return {id:o.id,name:o.name,kind:o.kind,email_domain:o.email_domain||"",levels:JSON.parse(o.levels||"[]"),status:o.status};
}
async function misOrgs(env,user,json){
  await aceptaInvitaciones(env,user);
  var orgs=await env.DB.prepare(
    "SELECT o.*,m.role FROM org_members m JOIN orgs o ON o.id=m.org_id WHERE m.user_id=? ORDER BY o.name"
  ).bind(user.id).all();
  var cursos=await env.DB.prepare(
    "SELECT c.code,c.name,c.term,c.archived,c.org_id,o.name AS org_name,cm.role,cm.status,u.name AS unit_name,"+
    " (SELECT COUNT(*) FROM contest_scope s JOIN contests x ON x.code=s.code WHERE s.course_code=c.code AND x.ends_at>?) AS abiertos "+
    "FROM course_members cm JOIN courses c ON c.code=cm.code JOIN orgs o ON o.id=c.org_id LEFT JOIN org_units u ON u.id=c.unit_id "+
    "WHERE cm.user_id=? ORDER BY c.archived, c.created_at DESC"
  ).bind(Date.now(),user.id).all();
  var pendientes=0;
  if(esAdminPlataforma(env,user)){var p=await env.DB.prepare("SELECT COUNT(*) AS n FROM orgs WHERE status='pendiente'").first();pendientes=p.n;}
  return json({orgs:(orgs.results||[]).map(function(o){var x=orgPublica(o);x.role=o.role;return x;}),
               courses:(cursos.results||[]).map(function(c){return {code:c.code,name:c.name,term:c.term,archived:!!c.archived,org_id:c.org_id,
                 org_name:c.org_name,role:c.role,status:c.status,unit_name:c.unit_name,open:c.abiertos};}),
               platform_admin:esAdminPlataforma(env,user),pending_orgs:pendientes});
}
async function creaOrg(env,user,b,json){
  var name=limpia(b.name,90), kind=KINDS[b.kind]?b.kind:"universidad";
  var dom=limpia(b.email_domain,80).toLowerCase().replace(/^@/,"");
  if(name.length<3)return json({error:"bad_name"},null,400);
  if(dom&&!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dom))return json({error:"bad_domain"},null,400);
  var cuantas=await env.DB.prepare("SELECT COUNT(*) AS n FROM orgs WHERE created_by=?").bind(user.id).first();
  if(cuantas.n>=5&&!esAdminPlataforma(env,user))return json({error:"too_many"},null,400);
  var niveles=Array.isArray(b.levels)&&b.levels.length?b.levels.map(function(x){return limpia(x,30);}).filter(Boolean).slice(0,MAX_NIVELES):KINDS[kind];
  /* con administradores de plataforma configurados, las nuevas quedan pendientes de aprobación */
  var estado=(esAdminPlataforma(env,user)||!String(env.PLATFORM_ADMINS||"").trim())?"activa":"pendiente";
  var id=codigo(6), now=Date.now();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO orgs(id,name,kind,email_domain,levels,status,teacher_code,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?)")
      .bind(id,name,kind,dom||null,JSON.stringify(niveles),estado,codigo(8),user.id,now),
    env.DB.prepare("INSERT INTO org_members(org_id,user_id,role,joined_at) VALUES(?,?,?,?)").bind(id,user.id,"admin",now)
  ]);
  return json({ok:true,id:id,status:estado});
}
async function cargaOrg(env,id){return env.DB.prepare("SELECT * FROM orgs WHERE id=?").bind(id).first();}
async function fichaOrg(env,user,id,json){
  var o=await cargaOrg(env,id);
  if(!o)return json({error:"not_found"},null,404);
  var rol=await rolOrg(env,id,user.id), pa=esAdminPlataforma(env,user);
  if(!rol&&!pa)return json({error:"forbidden"},null,403);
  var units=await env.DB.prepare("SELECT id,parent_id,depth,name FROM org_units WHERE org_id=? ORDER BY depth,name").bind(id).all();
  var n=await env.DB.prepare("SELECT role,COUNT(*) AS n FROM org_members WHERE org_id=? GROUP BY role").bind(id).all();
  var cuenta={}; (n.results||[]).forEach(function(r){cuenta[r.role]=r.n;});
  var out=orgPublica(o); out.role=rol; out.platform_admin=pa; out.units=units.results||[]; out.counts=cuenta;
  out.can={admin:rol==="admin",teach:rol==="admin"||rol==="docente",active:o.status==="activa"};
  if(rol==="admin")out.teacher_code=o.teacher_code;
  try{var br=await env.DB.prepare("SELECT slug,color,logo FROM org_brand WHERE org_id=?").bind(id).first();out.brand=br||null;}catch(e){out.brand=null;}
  return json(out);
}
async function soloAdmin(env,user,id){
  var o=await cargaOrg(env,id); if(!o)return {err:"not_found",st:404};
  if((await rolOrg(env,id,user.id))!=="admin")return {err:"forbidden",st:403};
  return {org:o};
}
async function ajustesOrg(env,user,id,b,json){
  var a=await soloAdmin(env,user,id); if(a.err)return json({error:a.err},null,a.st);
  var o=a.org, name=b.name!==undefined?limpia(b.name,90):o.name;
  var dom=b.email_domain!==undefined?limpia(b.email_domain,80).toLowerCase().replace(/^@/,""):(o.email_domain||"");
  if(name.length<3)return json({error:"bad_name"},null,400);
  if(dom&&!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dom))return json({error:"bad_domain"},null,400);
  var niveles=JSON.parse(o.levels);
  if(Array.isArray(b.levels)){
    var nuevos=b.levels.map(function(x){return limpia(x,30);}).filter(Boolean).slice(0,MAX_NIVELES);
    if(!nuevos.length)return json({error:"bad_levels"},null,400);
    /* se puede renombrar y añadir; quitar niveles solo si no tienen unidades */
    if(nuevos.length<niveles.length){
      var hay=await env.DB.prepare("SELECT COUNT(*) AS n FROM org_units WHERE org_id=? AND depth>=?").bind(id,nuevos.length).first();
      if(hay.n)return json({error:"levels_in_use"},null,400);
    }
    niveles=nuevos;
  }
  await env.DB.prepare("UPDATE orgs SET name=?,email_domain=?,levels=? WHERE id=?").bind(name,dom||null,JSON.stringify(niveles),id).run();
  return json({ok:true});
}
async function creaUnidad(env,user,id,b,json){
  var a=await soloAdmin(env,user,id); if(a.err)return json({error:a.err},null,a.st);
  var niveles=JSON.parse(a.org.levels), name=limpia(b.name,80), depth=0, parent=null;
  if(name.length<2)return json({error:"bad_name"},null,400);
  if(b.parent_id){
    var p=await env.DB.prepare("SELECT * FROM org_units WHERE id=? AND org_id=?").bind(+b.parent_id,id).first();
    if(!p)return json({error:"bad_parent"},null,400);
    parent=p.id; depth=p.depth+1;
  }
  if(depth>=niveles.length)return json({error:"too_deep"},null,400);
  var total=await env.DB.prepare("SELECT COUNT(*) AS n FROM org_units WHERE org_id=?").bind(id).first();
  if(total.n>=1000)return json({error:"too_many"},null,400);
  var r=await env.DB.prepare("INSERT INTO org_units(org_id,parent_id,depth,name,created_at) VALUES(?,?,?,?,?)").bind(id,parent,depth,name,Date.now()).run();
  return json({ok:true,id:r.meta&&r.meta.last_row_id});
}
async function cambiaUnidad(env,user,id,uid,b,json){
  var a=await soloAdmin(env,user,id); if(a.err)return json({error:a.err},null,a.st);
  var u=await env.DB.prepare("SELECT * FROM org_units WHERE id=? AND org_id=?").bind(uid,id).first();
  if(!u)return json({error:"not_found"},null,404);
  if(b.remove){
    var hijos=await env.DB.prepare("SELECT COUNT(*) AS n FROM org_units WHERE parent_id=?").bind(uid).first();
    var usos=await env.DB.prepare("SELECT (SELECT COUNT(*) FROM courses WHERE unit_id=?)+(SELECT COUNT(*) FROM banks WHERE unit_id=?) AS n").bind(uid,uid).first();
    if(hijos.n||usos.n)return json({error:"unit_in_use"},null,400);
    await env.DB.prepare("DELETE FROM org_units WHERE id=?").bind(uid).run();
    return json({ok:true});
  }
  var name=limpia(b.name,80); if(name.length<2)return json({error:"bad_name"},null,400);
  await env.DB.prepare("UPDATE org_units SET name=? WHERE id=?").bind(name,uid).run();
  return json({ok:true});
}
async function miembros(env,user,id,json){
  var a=await soloAdmin(env,user,id); if(a.err)return json({error:a.err},null,a.st);
  var r=await env.DB.prepare(
    "SELECT u.id,u.name,u.email,u.picture,m.role,m.student_code,m.consent_ok,m.joined_at,p.birthdate "+
    "FROM org_members m JOIN users u ON u.id=m.user_id LEFT JOIN profiles p ON p.user_id=m.user_id WHERE m.org_id=? ORDER BY m.role,u.name"
  ).bind(id).all();
  var inv={results:[]};
  try{inv=await env.DB.prepare("SELECT email,role,created_at FROM org_invites WHERE org_id=? ORDER BY created_at").bind(id).all();}catch(e){}
  return json({members:(r.results||[]).map(function(x){var e=edad(x.birthdate);
    return {id:x.id,name:x.name,email:x.email,picture:x.picture,role:x.role,student_code:x.student_code,consent_ok:!!x.consent_ok,
            minor:e!==null&&e<18,joined_at:x.joined_at,me:x.id===user.id,guest:esInvitado(x)};}),
    invites:inv.results||[]});
}
async function invitaOrg(env,user,id,b,json){
  var a=await soloAdmin(env,user,id); if(a.err)return json({error:a.err},null,a.st);
  if(b.remove){
    await env.DB.prepare("DELETE FROM org_invites WHERE org_id=? AND email=?").bind(id,String(b.email||"").trim().toLowerCase()).run();
    return json({ok:true});
  }
  var r=await invita(env,id,b.email,b.role,user.id);
  return r.error?json(r,null,400):json(r);
}
async function cambiaMiembro(env,user,id,uid,b,json){
  var a=await soloAdmin(env,user,id); if(a.err)return json({error:a.err},null,a.st);
  var m=await env.DB.prepare("SELECT * FROM org_members WHERE org_id=? AND user_id=?").bind(id,uid).first();
  if(!m)return json({error:"not_found"},null,404);
  /* nunca dejar la institución sin administración */
  if((b.remove||(b.role&&b.role!=="admin"))&&m.role==="admin"){
    var adm=await env.DB.prepare("SELECT COUNT(*) AS n FROM org_members WHERE org_id=? AND role='admin'").bind(id).first();
    if(adm.n<=1)return json({error:"last_admin"},null,400);
  }
  if(b.remove){
    await env.DB.batch([
      env.DB.prepare("DELETE FROM course_members WHERE user_id=? AND code IN (SELECT code FROM courses WHERE org_id=?)").bind(uid,id),
      env.DB.prepare("DELETE FROM org_members WHERE org_id=? AND user_id=?").bind(id,uid)
    ]);
    return json({ok:true});
  }
  var role=b.role!==undefined?b.role:m.role;
  if(ROLES.indexOf(role)<0)return json({error:"bad_role"},null,400);
  var consent=b.consent_ok!==undefined?(b.consent_ok?1:0):m.consent_ok;
  var sc=b.student_code!==undefined?limpia(b.student_code,30):m.student_code;
  await env.DB.prepare("UPDATE org_members SET role=?,consent_ok=?,student_code=? WHERE org_id=? AND user_id=?").bind(role,consent,sc,id,uid).run();
  return json({ok:true});
}
async function nuevoCodigo(env,user,id,json){
  var a=await soloAdmin(env,user,id); if(a.err)return json({error:a.err},null,a.st);
  var c=codigo(8);
  await env.DB.prepare("UPDATE orgs SET teacher_code=? WHERE id=?").bind(c,id).run();
  return json({ok:true,teacher_code:c});
}
async function uneDocente(env,user,b,json){
  var code=limpia(b.code,12).toUpperCase();
  var o=await env.DB.prepare("SELECT * FROM orgs WHERE teacher_code=?").bind(code).first();
  if(!o)return json({error:"not_found"},null,404);
  if(o.status==="suspendida")return json({error:"org_suspended"},null,403);
  if(!dominioOk(o,user))return json({error:"domain",domain:o.email_domain},null,403);
  var rol=await rolOrg(env,o.id,user.id);
  if(rol==="admin"||rol==="docente")return json({ok:true,id:o.id,already:true});
  await env.DB.prepare(
    "INSERT INTO org_members(org_id,user_id,role,joined_at) VALUES(?,?,'docente',?) ON CONFLICT(org_id,user_id) DO UPDATE SET role='docente'"
  ).bind(o.id,user.id,Date.now()).run();
  return json({ok:true,id:o.id});
}

/* ---------- cursos ---------- */
function cursoPublico(c){return {code:c.code,name:c.name,term:c.term,unit_id:c.unit_id,approval:!!c.approval,archived:!!c.archived,org_id:c.org_id};}
async function cursosOrg(env,user,id,json){
  var rol=await rolOrg(env,id,user.id);
  if(!rol)return json({error:"forbidden"},null,403);
  var q="SELECT c.*,u.name AS unit_name,us.name AS owner_name,"+
    " (SELECT COUNT(*) FROM course_members x WHERE x.code=c.code AND x.role='estudiante' AND x.status='activo') AS alumnos,"+
    " (SELECT COUNT(*) FROM course_members x WHERE x.code=c.code AND x.status='pendiente') AS pendientes "+
    "FROM courses c LEFT JOIN org_units u ON u.id=c.unit_id JOIN users us ON us.id=c.owner_id WHERE c.org_id=? ";
  var r=rol==="admin"
    ? await env.DB.prepare(q+"ORDER BY c.archived,c.created_at DESC").bind(id).all()
    : await env.DB.prepare(q+"AND c.code IN (SELECT code FROM course_members WHERE user_id=?) ORDER BY c.archived,c.created_at DESC").bind(id,user.id).all();
  return json({courses:(r.results||[]).map(function(c){var x=cursoPublico(c);x.unit_name=c.unit_name;x.owner_name=c.owner_name;
    x.students=c.alumnos;x.pending=c.pendientes;x.mine=c.owner_id===user.id;return x;})});
}
async function creaCurso(env,user,id,b,json){
  var o=await cargaOrg(env,id); if(!o)return json({error:"not_found"},null,404);
  var rol=await rolOrg(env,id,user.id);
  if(rol!=="admin"&&rol!=="docente")return json({error:"forbidden"},null,403);
  if(o.status!=="activa")return json({error:"org_pending"},null,403);
  var name=limpia(b.name,90), term=limpia(b.term,20), unit=b.unit_id?+b.unit_id:null;
  if(name.length<2)return json({error:"bad_name"},null,400);
  if(unit){var u=await env.DB.prepare("SELECT 1 FROM org_units WHERE id=? AND org_id=?").bind(unit,id).first();if(!u)return json({error:"bad_unit"},null,400);}
  var code, now=Date.now(), choque, n=0;
  do{code=codigo(6);choque=await env.DB.prepare("SELECT 1 FROM courses WHERE code=?").bind(code).first();n++;}while(choque&&n<5);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO courses(code,org_id,unit_id,name,term,owner_id,approval,created_at) VALUES(?,?,?,?,?,?,?,?)")
      .bind(code,id,unit,name,term||null,user.id,b.approval?1:0,now),
    env.DB.prepare("INSERT INTO course_members(code,user_id,role,status,joined_at) VALUES(?,?,'docente','activo',?)").bind(code,user.id,now)
  ]);
  return json({ok:true,code:code});
}
async function fichaCurso(env,user,code,json){
  var a=await accesoCurso(env,code,user&&user.id);
  if(!a)return json({error:"not_found"},null,404);
  var c=a.curso, o=await cargaOrg(env,c.org_id);
  var unit=c.unit_id?await env.DB.prepare("SELECT name FROM org_units WHERE id=?").bind(c.unit_id).first():null;
  var docente=await env.DB.prepare("SELECT name FROM users WHERE id=?").bind(c.owner_id).first();
  var out=cursoPublico(c);
  out.org_name=o.name; out.org_kind=o.kind; out.email_domain=o.email_domain||""; out.unit_name=unit?unit.name:"";
  out.teacher_name=docente?docente.name:""; out.manage=a.gestiona; out.member=a.miembro?{role:a.miembro.role,status:a.miembro.status}:null;
  out.org_role=a.rolOrg; out.org_active=o.status==="activa";
  /* lo demás, solo para miembros activos o quien gestiona */
  if(!a.gestiona&&!(a.miembro&&a.miembro.status==="activo"))return json(out);
  var now=Date.now();
  var qz=await env.DB.prepare(
    "SELECT x.code,x.name,x.starts_at,x.ends_at,x.max_questions,x.max_errors,x.seconds_per_q,s.partial,s.kind,"+
    " (SELECT COUNT(*) FROM contest_entries e WHERE e.code=x.code AND e.started_at IS NOT NULL) AS jugaron,"+
    " e2.correct AS my_correct,e2.errors AS my_errors,e2.finished_at AS my_finished,e2.started_at AS my_started "+
    "FROM contest_scope s JOIN contests x ON x.code=s.code LEFT JOIN contest_entries e2 ON e2.code=x.code AND e2.user_id=? "+
    "WHERE s.course_code=? ORDER BY x.starts_at DESC"
  ).bind(user?user.id:"",code).all();
  out.quizzes=(qz.results||[]).map(function(x){
    return {code:x.code,name:x.name,partial:x.partial,kind:x.kind,starts_at:x.starts_at,ends_at:x.ends_at,
            state:now<x.starts_at?"pronto":now<x.ends_at?"abierto":"terminado",max_questions:x.max_questions,
            max_errors:x.max_errors,seconds_per_q:x.seconds_per_q,played:x.jugaron,
            me:x.my_started?{correct:x.my_correct,errors:x.my_errors,finished:!!x.my_finished}:null};
  });
  out.now=now;
  if(a.gestiona){
    var mem=await env.DB.prepare(
      "SELECT u.id,u.name,u.email,u.picture,cm.role,cm.status,cm.joined_at,om.student_code FROM course_members cm JOIN users u ON u.id=cm.user_id "+
      "LEFT JOIN org_members om ON om.org_id=? AND om.user_id=cm.user_id WHERE cm.code=? ORDER BY cm.status DESC,cm.role,u.name"
    ).bind(c.org_id,code).all();
    out.members=(mem.results||[]).map(function(x){return {id:x.id,name:x.name,email:x.email,picture:x.picture,role:x.role,status:x.status,
      student_code:x.student_code,me:x.id===user.id,owner:x.id===c.owner_id};});
    var bancos=await env.DB.prepare(
      "SELECT b.id,b.name,(SELECT COUNT(*) FROM bank_questions q WHERE q.bank_id=b.id) AS n FROM banks b WHERE b.org_id=? AND (b.owner_id=? OR ?='admin') ORDER BY b.name"
    ).bind(c.org_id,user.id,a.rolOrg||"").all();
    out.banks=bancos.results||[];
  }
  return json(out);
}
async function uneCurso(env,user,code,b,json){
  var a=await accesoCurso(env,code,user.id);
  if(!a)return json({error:"not_found"},null,404);
  var c=a.curso, o=await cargaOrg(env,c.org_id);
  if(o.status!=="activa")return json({error:"org_pending"},null,403);
  if(c.archived)return json({error:"archived"},null,400);
  if(a.miembro)return json({ok:true,already:true,status:a.miembro.status});
  if(!dominioOk(o,user))return json({error:"domain",domain:o.email_domain},null,403);
  var sc=limpia(b.student_code,30), now=Date.now(), estado=c.approval?"pendiente":"activo";
  if(!sc&&!a.rolOrg)return json({error:"student_code_required"},null,400);
  var ops=[env.DB.prepare("INSERT INTO course_members(code,user_id,role,status,joined_at) VALUES(?,?,'estudiante',?,?)").bind(code,user.id,estado,now)];
  if(!a.rolOrg)ops.push(env.DB.prepare("INSERT INTO org_members(org_id,user_id,role,student_code,joined_at) VALUES(?,?,'estudiante',?,?)").bind(c.org_id,user.id,sc,now));
  else if(sc)ops.push(env.DB.prepare("UPDATE org_members SET student_code=COALESCE(student_code,?) WHERE org_id=? AND user_id=?").bind(sc,c.org_id,user.id));
  await env.DB.batch(ops);
  return json({ok:true,status:estado});
}
async function ajustesCurso(env,user,code,b,json){
  var a=await accesoCurso(env,code,user.id);
  if(!a)return json({error:"not_found"},null,404);
  if(!a.gestiona)return json({error:"forbidden"},null,403);
  var c=a.curso, name=b.name!==undefined?limpia(b.name,90):c.name;
  if(name.length<2)return json({error:"bad_name"},null,400);
  var unit=b.unit_id!==undefined?(b.unit_id?+b.unit_id:null):c.unit_id;
  if(unit&&unit!==c.unit_id){var u=await env.DB.prepare("SELECT 1 FROM org_units WHERE id=? AND org_id=?").bind(unit,c.org_id).first();if(!u)return json({error:"bad_unit"},null,400);}
  await env.DB.prepare("UPDATE courses SET name=?,term=?,unit_id=?,approval=?,archived=? WHERE code=?").bind(
    name,b.term!==undefined?(limpia(b.term,20)||null):c.term,unit,b.approval!==undefined?(b.approval?1:0):c.approval,
    b.archived!==undefined?(b.archived?1:0):c.archived,code).run();
  return json({ok:true});
}
async function cambiaAlumno(env,user,code,uid,b,json){
  var a=await accesoCurso(env,code,user.id);
  if(!a)return json({error:"not_found"},null,404);
  if(!a.gestiona)return json({error:"forbidden"},null,403);
  if(uid===a.curso.owner_id)return json({error:"owner"},null,400);
  var m=await env.DB.prepare("SELECT * FROM course_members WHERE code=? AND user_id=?").bind(code,uid).first();
  if(!m)return json({error:"not_found"},null,404);
  if(b.remove){await env.DB.prepare("DELETE FROM course_members WHERE code=? AND user_id=?").bind(code,uid).run();return json({ok:true});}
  var role=b.role||m.role, status=b.status||m.status;
  if(["auxiliar","estudiante"].indexOf(role)<0||["activo","pendiente"].indexOf(status)<0)return json({error:"bad_role"},null,400);
  await env.DB.prepare("UPDATE course_members SET role=?,status=? WHERE code=? AND user_id=?").bind(role,status,code,uid).run();
  return json({ok:true});
}

/* ---------- bancos de preguntas ---------- */
async function bancosOrg(env,user,id,json){
  var rol=await rolOrg(env,id,user.id);
  if(rol!=="admin"&&rol!=="docente"&&rol!=="auxiliar")return json({error:"forbidden"},null,403);
  var r=await env.DB.prepare(
    "SELECT b.*,u.name AS unit_name,us.name AS owner_name,(SELECT COUNT(*) FROM bank_questions q WHERE q.bank_id=b.id) AS n "+
    "FROM banks b LEFT JOIN org_units u ON u.id=b.unit_id JOIN users us ON us.id=b.owner_id WHERE b.org_id=? AND (b.owner_id=? OR ?='admin') ORDER BY b.name"
  ).bind(id,user.id,rol).all();
  return json({banks:(r.results||[]).map(function(b){return {id:b.id,name:b.name,unit_id:b.unit_id,unit_name:b.unit_name,
    owner_name:b.owner_name,mine:b.owner_id===user.id,questions:b.n};})});
}
async function creaBanco(env,user,id,b,json){
  var o=await cargaOrg(env,id); if(!o)return json({error:"not_found"},null,404);
  var rol=await rolOrg(env,id,user.id);
  if(rol!=="admin"&&rol!=="docente")return json({error:"forbidden"},null,403);
  var name=limpia(b.name,80), unit=b.unit_id?+b.unit_id:null;
  if(name.length<2)return json({error:"bad_name"},null,400);
  if(unit){var u=await env.DB.prepare("SELECT 1 FROM org_units WHERE id=? AND org_id=?").bind(unit,id).first();if(!u)return json({error:"bad_unit"},null,400);}
  var r=await env.DB.prepare("INSERT INTO banks(org_id,owner_id,name,unit_id,created_at) VALUES(?,?,?,?,?)").bind(id,user.id,name,unit,Date.now()).run();
  return json({ok:true,id:r.meta&&r.meta.last_row_id});
}
async function bancoEditable(env,user,bid){
  var b=await env.DB.prepare("SELECT * FROM banks WHERE id=?").bind(bid).first();
  if(!b)return {err:"not_found",st:404};
  if(b.owner_id!==user.id&&(await rolOrg(env,b.org_id,user.id))!=="admin")return {err:"forbidden",st:403};
  return {banco:b};
}
async function verBanco(env,user,bid,json){
  var a=await bancoEditable(env,user,bid); if(a.err)return json({error:a.err},null,a.st);
  var q=await env.DB.prepare("SELECT id,level,topic,q,opts,answer FROM bank_questions WHERE bank_id=? ORDER BY topic,level,id").bind(bid).all();
  var u=a.banco.unit_id?await env.DB.prepare("SELECT name FROM org_units WHERE id=?").bind(a.banco.unit_id).first():null;
  return json({id:a.banco.id,name:a.banco.name,org_id:a.banco.org_id,unit_name:u?u.name:"",mine:a.banco.owner_id===user.id,
    questions:(q.results||[]).map(function(x){return {id:x.id,level:x.level,topic:x.topic||"",q:x.q,opts:JSON.parse(x.opts),answer:x.answer};})});
}
async function clavesBanco(env,bid){
  var r=await env.DB.prepare("SELECT q FROM bank_questions WHERE bank_id=?").bind(bid).all(), k={};
  (r.results||[]).forEach(function(x){k[B.clave(x.q)]=1;});
  return {claves:k,total:(r.results||[]).length};
}
/* lo que llega del navegador ya viene validado, pero aquí se vuelve a validar con las mismas reglas */
function aItems(lista){
  return (Array.isArray(lista)?lista:[]).map(function(x,i){
    var opts=Array.isArray(x.opts)?x.opts:[], ans=parseInt(x.answer,10)||0;
    return {fila:x.fila||i+1,q:x.q,correcta:opts[ans]||"",otras:opts.filter(function(_,k){return k!==ans;}),nivel:x.level,tema:x.topic};
  });
}
async function importa(env,user,bid,b,json){
  var a=await bancoEditable(env,user,bid); if(a.err)return json({error:a.err},null,a.st);
  var items=aItems(b.items);
  if(!items.length)return json({error:"empty"},null,400);
  if(items.length>MAX_IMPORT)return json({error:"too_many",max:MAX_IMPORT},null,400);
  var ya=await clavesBanco(env,bid);
  var v=B.valida(items,ya.claves), buenas=v.filter(function(x){return x.ok;});
  if(ya.total+buenas.length>MAX_BANCO)return json({error:"bank_full",max:MAX_BANCO},null,400);
  var now=Date.now(), ops=buenas.map(function(x){
    return env.DB.prepare("INSERT INTO bank_questions(bank_id,level,topic,q,opts,answer,created_at) VALUES(?,?,?,?,?,0,?)")
      .bind(bid,x.level,x.topic||null,x.q,JSON.stringify(x.opts),now);
  });
  for(var i=0;i<ops.length;i+=50)await env.DB.batch(ops.slice(i,i+50));
  return json({ok:true,added:buenas.length,rejected:v.filter(function(x){return !x.ok;}).map(function(x){return {fila:x.fila,q:x.q,errores:x.errores};})});
}
async function cambiaPregunta(env,user,bid,qid,b,json){
  var a=await bancoEditable(env,user,bid); if(a.err)return json({error:a.err},null,a.st);
  if(qid!=="nueva"){
    var q=await env.DB.prepare("SELECT * FROM bank_questions WHERE id=? AND bank_id=?").bind(+qid,bid).first();
    if(!q)return json({error:"not_found"},null,404);
    if(b.remove){await env.DB.prepare("DELETE FROM bank_questions WHERE id=?").bind(+qid).run();return json({ok:true});}
  }
  var ya=await clavesBanco(env,bid);
  if(qid!=="nueva"){ delete ya.claves[B.clave(q.q)]; }
  else if(ya.total>=MAX_BANCO)return json({error:"bank_full",max:MAX_BANCO},null,400);
  var v=B.valida(aItems([b]),ya.claves)[0];
  if(!v.ok)return json({error:"invalid",errores:v.errores},null,400);
  if(qid==="nueva"){
    var r=await env.DB.prepare("INSERT INTO bank_questions(bank_id,level,topic,q,opts,answer,created_at) VALUES(?,?,?,?,?,0,?)")
      .bind(bid,v.level,v.topic||null,v.q,JSON.stringify(v.opts),Date.now()).run();
    return json({ok:true,id:r.meta&&r.meta.last_row_id});
  }
  await env.DB.prepare("UPDATE bank_questions SET level=?,topic=?,q=?,opts=?,answer=0 WHERE id=?").bind(v.level,v.topic||null,v.q,JSON.stringify(v.opts),+qid).run();
  return json({ok:true});
}

/* ---------- registros: cuestionarios de la institución con filtros ---------- */
async function registros(env,user,id,url,json){
  var rol=await rolOrg(env,id,user.id);
  if(rol!=="admin"&&rol!=="docente"&&rol!=="auxiliar")return json({error:"forbidden"},null,403);
  var unidad=parseInt(url.searchParams.get("unit"),10)||0, parcial=limpia(url.searchParams.get("partial"),40), gestion=limpia(url.searchParams.get("term"),20);
  var sql="SELECT x.code,x.name,x.starts_at,x.ends_at,s.partial,s.kind,c.code AS course_code,c.name AS course_name,c.term,c.unit_id,u.name AS unit_name,"+
    " (SELECT COUNT(*) FROM contest_entries e WHERE e.code=x.code AND e.started_at IS NOT NULL) AS jugaron,"+
    " (SELECT AVG(e.correct) FROM contest_entries e WHERE e.code=x.code AND e.started_at IS NOT NULL) AS media,"+
    " (SELECT COUNT(*) FROM course_members m WHERE m.code=c.code AND m.role='estudiante' AND m.status='activo') AS alumnos "+
    "FROM contest_scope s JOIN contests x ON x.code=s.code LEFT JOIN courses c ON c.code=s.course_code LEFT JOIN org_units u ON u.id=c.unit_id "+
    "WHERE s.org_id=?", args=[id];
  if(rol!=="admin"){sql+=" AND (x.owner_id=? OR s.course_code IN (SELECT code FROM course_members WHERE user_id=? AND role IN ('docente','auxiliar') AND status='activo'))";args.push(user.id,user.id);}
  if(unidad){sql+=" AND (c.unit_id=? OR c.unit_id IN (SELECT id FROM org_units WHERE parent_id=?) OR c.unit_id IN (SELECT id FROM org_units WHERE parent_id IN (SELECT id FROM org_units WHERE parent_id=?)))";args.push(unidad,unidad,unidad);}
  if(parcial){sql+=" AND s.partial=?";args.push(parcial);}
  if(gestion){sql+=" AND c.term=?";args.push(gestion);}
  sql+=" ORDER BY x.starts_at DESC LIMIT 200";
  var st=env.DB.prepare(sql), r=await st.bind.apply(st,args).all();
  var now=Date.now();
  var parciales=await env.DB.prepare("SELECT DISTINCT partial FROM contest_scope WHERE org_id=? AND partial IS NOT NULL ORDER BY partial").bind(id).all();
  var gestiones=await env.DB.prepare("SELECT DISTINCT term FROM courses WHERE org_id=? AND term IS NOT NULL ORDER BY term DESC").bind(id).all();
  return json({quizzes:(r.results||[]).map(function(x){return {code:x.code,name:x.name,partial:x.partial,kind:x.kind,course_code:x.course_code,
      course_name:x.course_name,term:x.term,unit_name:x.unit_name,starts_at:x.starts_at,ends_at:x.ends_at,
      state:now<x.starts_at?"pronto":now<x.ends_at?"abierto":"terminado",played:x.jugaron,students:x.alumnos,
      avg:x.media===null?null:Math.round(x.media*10)/10};}),
    partials:(parciales.results||[]).map(function(x){return x.partial;}),terms:(gestiones.results||[]).map(function(x){return x.term;})});
}

/* ---------- administración de la plataforma ---------- */
async function adminOrgs(env,user,json){
  if(!esAdminPlataforma(env,user))return json({error:"forbidden"},null,403);
  var r=await env.DB.prepare(
    "SELECT o.*,u.name AS creator_name,u.email AS creator_email,(SELECT COUNT(*) FROM org_members m WHERE m.org_id=o.id) AS miembros "+
    "FROM orgs o JOIN users u ON u.id=o.created_by ORDER BY o.status='pendiente' DESC,o.created_at DESC LIMIT 200"
  ).all();
  return json({orgs:(r.results||[]).map(function(o){var x=orgPublica(o);x.creator_name=o.creator_name;x.creator_email=o.creator_email;
    x.members=o.miembros;x.created_at=o.created_at;return x;})});
}
async function adminEstado(env,user,id,b,json){
  if(!esAdminPlataforma(env,user))return json({error:"forbidden"},null,403);
  if(["activa","pendiente","suspendida"].indexOf(b.status)<0)return json({error:"bad_status"},null,400);
  var r=await env.DB.prepare("UPDATE orgs SET status=? WHERE id=?").bind(b.status,id).run();
  if(!r.meta||!r.meta.changes)return json({error:"not_found"},null,404);
  return json({ok:true});
}
