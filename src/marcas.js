/* ===========================================================
   THE FINAL TEST · marcas, convocatorias y métricas (API)
   Cada institución o empresa puede tener una marca pública: una página
   propia (?marca=slug) con su logo y su color, donde aparecen sus
   convocatorias abiertas, lista para compartir con un QR.

     GET  /api/brands                     marcas con convocatorias (directorio)
     GET  /api/brands/:slug               página pública de la marca
     GET  /api/orgs/:id/brand             ajustes de la marca (admin)
     POST /api/orgs/:id/brand             { slug, color, logo, tagline, description, website } (admin)
     GET  /api/orgs/:id/contests          convocatorias de la institución (admin o docente)
     GET  /api/orgs/:id/metrics           métricas (admin o plataforma)
     GET  /api/orgs/:id/participants      participantes con contacto y consentimiento (admin o plataforma)
   =========================================================== */
import { rolOrg, esAdminPlataforma, esInvitado } from "./aula.js";

var MAX_LOGO=120000;

export async function handleMarcas(req,env,url,path,ctx){
  var json=ctx.json, user=ctx.user, m;
  if(!env.DB)return json({error:"not_configured"},null,503);
  try{
    if(path==="/brands"&&req.method==="GET")return await directorio(env,json);
    if((m=path.match(/^\/brands\/([a-z0-9-]{3,40})$/))&&req.method==="GET")return await pagina(env,user,m[1],json);
    if(!user)return json({error:"unauthorized"},null,401);
    if(esInvitado(user))return json({error:"google_required"},null,403);
    if((m=path.match(/^\/orgs\/([A-Z0-9]{6})\/brand$/))){
      if(req.method==="GET")return await verMarca(env,user,m[1],json);
      if(req.method==="POST")return await guardaMarca(req,env,user,m[1],json);
    }
    if((m=path.match(/^\/orgs\/([A-Z0-9]{6})\/contests$/))&&req.method==="GET")return await convocatorias(env,user,m[1],json);
    if((m=path.match(/^\/orgs\/([A-Z0-9]{6})\/metrics$/))&&req.method==="GET")return await metricas(env,user,m[1],json);
    if((m=path.match(/^\/orgs\/([A-Z0-9]{6})\/participants$/))&&req.method==="GET")return await participantes(env,user,m[1],json);
  }catch(e){
    if(/no such table/i.test(String(e&&e.message)))return json({error:"not_configured"},null,503);
    throw e;
  }
  return json({error:"not_found"},null,404);
}

/* ---------- utilidades ---------- */
function limpia(s,max){return String(s==null?"":s).replace(/\s+/g," ").trim().slice(0,max);}
function estado(c,now){return now<c.starts_at?"pronto":now<c.ends_at?"abierto":"terminado";}
export function slugDe(t){
  return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40);
}
async function permiso(env,user,id,roles){
  var o=await env.DB.prepare("SELECT * FROM orgs WHERE id=?").bind(id).first();
  if(!o)return {err:"not_found",st:404};
  var r=await rolOrg(env,id,user.id), pa=esAdminPlataforma(env,user);
  if(roles.indexOf(r)<0&&!pa)return {err:"forbidden",st:403};
  return {org:o,rol:r,plataforma:pa};
}
function marcaPublica(o,b){
  return {org_id:o.id,name:o.name,kind:o.kind,slug:b.slug,color:b.color||"",logo:b.logo||"",tagline:b.tagline||"",
          description:b.description||"",website:b.website||""};
}
function convocatoria(c,now){
  return {code:c.code,name:c.name,prize:c.prize||"",description:c.description||"",starts_at:c.starts_at,ends_at:c.ends_at,
          state:estado(c,now),max_questions:c.max_questions,seconds_per_q:c.seconds_per_q,max_errors:c.max_errors,
          audience:c.audience,guests:!!c.guests,registered:c.inscritos||0,played:c.jugaron||0};
}
var CUENTAS="(SELECT COUNT(*) FROM contest_entries e WHERE e.code=c.code) AS inscritos,"+
            "(SELECT COUNT(*) FROM contest_entries e WHERE e.code=c.code AND e.started_at IS NOT NULL) AS jugaron,"+
            "(SELECT guests FROM contest_options p WHERE p.code=c.code) AS guests";

/* ---------- directorio y página pública ---------- */
async function directorio(env,json){
  var now=Date.now();
  var r=await env.DB.prepare(
    "SELECT o.id,o.name,o.kind,b.slug,b.color,b.logo,b.tagline,"+
    " (SELECT COUNT(*) FROM contest_scope s JOIN contests c ON c.code=s.code WHERE s.org_id=o.id AND s.audience='publico' AND s.kind='concurso' AND c.ends_at>?) AS abiertas "+
    "FROM org_brand b JOIN orgs o ON o.id=b.org_id WHERE o.status='activa' ORDER BY abiertas DESC, o.name LIMIT 60"
  ).bind(now).all();
  return json({brands:(r.results||[]).map(function(x){return {slug:x.slug,name:x.name,kind:x.kind,color:x.color||"",logo:x.logo||"",
    tagline:x.tagline||"",open:x.abiertas};})});
}
async function pagina(env,user,slug,json){
  var b=await env.DB.prepare("SELECT * FROM org_brand WHERE slug=?").bind(slug).first();
  if(!b)return json({error:"not_found"},null,404);
  var o=await env.DB.prepare("SELECT * FROM orgs WHERE id=?").bind(b.org_id).first();
  if(!o||o.status!=="activa")return json({error:"not_found"},null,404);
  var now=Date.now();
  var r=await env.DB.prepare(
    "SELECT c.*,s.audience,"+CUENTAS+" FROM contest_scope s JOIN contests c ON c.code=s.code "+
    "WHERE s.org_id=? AND s.audience='publico' AND s.kind='concurso' AND c.ends_at>? ORDER BY c.starts_at<=? DESC, c.ends_at ASC LIMIT 30"
  ).bind(o.id,now-30*86400000,now).all();
  var todas=(r.results||[]).map(function(c){return convocatoria(c,now);});
  var out=marcaPublica(o,b);
  out.open=todas.filter(function(c){return c.state!=="terminado";});
  out.recent=todas.filter(function(c){return c.state==="terminado";});
  /* competencias de juego rápido abiertas (tabla opcional) */
  out.campanas=[];
  try{out.campanas=((await env.DB.prepare("SELECT c.code,c.nombre,c.juego,c.intentos,c.premios,c.umbral_premio,c.starts_at,c.ends_at,c.invitados,"+
      "(SELECT COUNT(DISTINCT user_id) FROM campana_intentos i WHERE i.code=c.code AND i.finished_at IS NOT NULL) AS jugadores "+
      "FROM campanas c WHERE c.org_id=? AND c.publico=1 AND c.cerrada_at IS NULL AND c.ends_at>? ORDER BY c.ends_at ASC LIMIT 20").bind(o.id,now).all()).results||[])
    .map(function(c){var p=c.premios?JSON.parse(c.premios):[];return {code:c.code,name:c.nombre,juego:c.juego,intentos:c.intentos,starts_at:c.starts_at,ends_at:c.ends_at,
      guests:!!c.invitados,players:c.jugadores,premio:p.length?p[0].texto:"",umbral_premio:c.umbral_premio||"",state:now<c.starts_at?"pronto":"abierto"};});}catch(e){}
  out.manage=!!(user&&!esInvitado(user)&&((await rolOrg(env,o.id,user.id))==="admin"||esAdminPlataforma(env,user)));
  return json(out);
}

/* ---------- ajustes de la marca ---------- */
async function verMarca(env,user,id,json){
  var p=await permiso(env,user,id,["admin"]); if(p.err)return json({error:p.err},null,p.st);
  var b=await env.DB.prepare("SELECT * FROM org_brand WHERE org_id=?").bind(id).first();
  return json({brand:b?marcaPublica(p.org,b):null,suggested_slug:slugDe(p.org.name)});
}
async function guardaMarca(req,env,user,id,json){
  var p=await permiso(env,user,id,["admin"]); if(p.err)return json({error:p.err},null,p.st);
  var b=await req.json().catch(function(){return {};});
  var slug=slugDe(b.slug||p.org.name);
  if(!/^[a-z0-9-]{3,40}$/.test(slug))return json({error:"bad_slug"},null,400);
  var color=String(b.color||"").trim().toLowerCase();
  if(color&&!/^#[0-9a-f]{6}$/.test(color))return json({error:"bad_color"},null,400);
  var logo=String(b.logo||"");
  if(logo&&(!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(logo)||logo.length>MAX_LOGO))return json({error:"bad_logo"},null,400);
  var web=limpia(b.website,200);
  if(web&&!/^https?:\/\/[^\s<>"]+$/i.test(web))return json({error:"bad_website"},null,400);
  var otro=await env.DB.prepare("SELECT org_id FROM org_brand WHERE slug=?").bind(slug).first();
  if(otro&&otro.org_id!==id)return json({error:"slug_taken"},null,400);
  await env.DB.prepare(
    "INSERT INTO org_brand(org_id,slug,color,logo,tagline,description,website,updated_at) VALUES(?,?,?,?,?,?,?,?) "+
    "ON CONFLICT(org_id) DO UPDATE SET slug=excluded.slug,color=excluded.color,logo=excluded.logo,tagline=excluded.tagline,"+
    "description=excluded.description,website=excluded.website,updated_at=excluded.updated_at"
  ).bind(id,slug,color||null,logo||null,limpia(b.tagline,80)||null,limpia(b.description,400)||null,web||null,Date.now()).run();
  return json({ok:true,slug:slug});
}

/* ---------- convocatorias de la institución ---------- */
async function convocatorias(env,user,id,json){
  var p=await permiso(env,user,id,["admin","docente"]); if(p.err)return json({error:p.err},null,p.st);
  var now=Date.now(), sql=
    "SELECT c.*,s.audience,u.name AS owner_name,"+CUENTAS+" FROM contest_scope s JOIN contests c ON c.code=s.code JOIN users u ON u.id=c.owner_id "+
    "WHERE s.org_id=? AND s.kind='concurso' AND s.course_code IS NULL", args=[id];
  if(p.rol!=="admin"&&!p.plataforma){sql+=" AND c.owner_id=?";args.push(user.id);}
  sql+=" ORDER BY c.ends_at>? DESC, c.starts_at DESC LIMIT 200"; args.push(now);
  var st=env.DB.prepare(sql), r=await st.bind.apply(st,args).all();
  return json({contests:(r.results||[]).map(function(c){var x=convocatoria(c,now);x.owner_name=c.owner_name;x.mine=c.owner_id===user.id;return x;})});
}

/* ---------- métricas ----------
   Todo lo que ocurre en los concursos, cuestionarios y convocatorias de
   la institución: participación, invitados frente a cuentas de Google,
   actividad de los últimos 30 días y convocatorias con más gente. */
export async function metricasOrg(env,id){
  var now=Date.now(), desde=Math.floor(now/86400000)*86400000-29*86400000;   /* 30 días naturales (UTC), hoy incluido */
  var q=function(sql){var a=[].slice.call(arguments,1),st=env.DB.prepare(sql);return st.bind.apply(st,a);};
  var res=await env.DB.batch([
    q("SELECT role,COUNT(*) AS n FROM org_members WHERE org_id=? GROUP BY role",id),
    q("SELECT COUNT(*) AS n,SUM(archived=0) AS activos FROM courses WHERE org_id=?",id),
    q("SELECT COUNT(DISTINCT b.id) AS bancos,COUNT(bq.id) AS preguntas FROM banks b LEFT JOIN bank_questions bq ON bq.bank_id=b.id WHERE b.org_id=?",id),
    q("SELECT s.kind,COUNT(*) AS n,SUM(c.ends_at>? AND c.starts_at<=?) AS abiertos FROM contest_scope s JOIN contests c ON c.code=s.code WHERE s.org_id=? GROUP BY s.kind",now,now,id),
    q("SELECT COUNT(*) AS inscripciones,SUM(e.started_at IS NOT NULL) AS partidas,SUM(e.finished_at IS NOT NULL) AS terminadas,"+
      "COUNT(DISTINCT e.user_id) AS personas,COUNT(DISTINCT CASE WHEN substr(e.user_id,1,2)='g_' THEN e.user_id END) AS invitados,"+
      "AVG(CASE WHEN e.started_at IS NOT NULL THEN e.correct END) AS media "+
      "FROM contest_entries e JOIN contest_scope s ON s.code=e.code WHERE s.org_id=?",id),
    q("SELECT CAST((e.joined_at-?)/86400000 AS INTEGER) AS d,COUNT(*) AS n FROM contest_entries e JOIN contest_scope s ON s.code=e.code "+
      "WHERE s.org_id=? AND e.joined_at>=? GROUP BY d ORDER BY d",desde,id,desde),
    q("SELECT c.code,c.name,s.kind,c.ends_at,c.starts_at,COUNT(e.user_id) AS n,SUM(e.started_at IS NOT NULL) AS jugaron "+
      "FROM contest_scope s JOIN contests c ON c.code=s.code LEFT JOIN contest_entries e ON e.code=c.code WHERE s.org_id=? "+
      "GROUP BY c.code ORDER BY n DESC,c.starts_at DESC LIMIT 10",id),
    q("SELECT COUNT(*) AS n,SUM(marketing) AS si FROM contact_consents WHERE org_id=?",id)
  ]);
  var filas=function(i){return res[i].results||[];}, uno=function(i){return filas(i)[0]||{};};
  var miembros={}; filas(0).forEach(function(r){miembros[r.role]=r.n;});
  var tipos={}; filas(3).forEach(function(r){tipos[r.kind]={total:r.n,open:r.abiertos||0};});
  var dias=[],porDia={}; filas(5).forEach(function(r){porDia[r.d]=r.n;});
  for(var d=0;d<30;d++)dias.push({day:new Date(desde+d*86400000).toISOString().slice(0,10),n:porDia[d]||0});
  var e=uno(4), salas={rooms:0,room_players:0};
  /* salas de juego en vivo (si ya existen sus tablas) */
  try{var sr=await env.DB.prepare("SELECT COUNT(*) AS n,SUM(jugadores) AS j FROM salas WHERE org_id=?").bind(id).first(); salas={rooms:sr.n||0,room_players:sr.j||0};}catch(er){}
  return {rooms:salas.rooms,room_players:salas.room_players,members:miembros,courses:uno(1).n||0,active_courses:uno(1).activos||0,banks:uno(2).bancos||0,questions:uno(2).preguntas||0,
    contests:tipos,registrations:e.inscripciones||0,plays:e.partidas||0,finished:e.terminadas||0,people:e.personas||0,guests:e.invitados||0,
    avg_correct:e.media===null||e.media===undefined?null:Math.round(e.media*10)/10,daily:dias,
    top:filas(6).map(function(c){return {code:c.code,name:c.name,kind:c.kind,state:estado(c,now),registered:c.n,played:c.jugaron||0};}),
    consents:uno(7).n||0,marketing:uno(7).si||0};
}
async function metricas(env,user,id,json){
  var p=await permiso(env,user,id,["admin"]); if(p.err)return json({error:p.err},null,p.st);
  var m=await metricasOrg(env,id); m.name=p.org.name; m.kind=p.org.kind;
  return json(m);
}

/* ---------- participantes ----------
   Una fila por persona que participó en algo de la institución, con su
   contacto (correo de Google, o el teléfono o correo verificado del
   invitado) y si aceptó que la institución la contacte. */
async function participantes(env,user,id,json){
  var p=await permiso(env,user,id,["admin"]); if(p.err)return json({error:p.err},null,p.st);
  var r=await env.DB.prepare(
    "SELECT u.id,u.name,u.email,g.channel,g.contact,g.verified_by,cc.marketing,COUNT(e.code) AS convocatorias,"+
    " SUM(e.started_at IS NOT NULL) AS jugadas,MAX(e.correct) AS mejor,MAX(e.joined_at) AS ultima "+
    "FROM contest_entries e JOIN contest_scope s ON s.code=e.code JOIN users u ON u.id=e.user_id "+
    "LEFT JOIN guests g ON g.user_id=u.id LEFT JOIN contact_consents cc ON cc.user_id=u.id AND cc.org_id=s.org_id "+
    "WHERE s.org_id=? GROUP BY u.id ORDER BY ultima DESC LIMIT 5000"
  ).bind(id).all();
  return json({name:p.org.name,people:(r.results||[]).map(function(x){
    return {name:x.name,email:x.channel==="sms"?"":(x.email||x.contact||""),phone:x.channel==="sms"?x.contact:"",
            type:x.channel?"invitado":"google",verified_by:x.verified_by||"google",marketing:x.marketing===null?null:!!x.marketing,
            contests:x.convocatorias,played:x.jugadas||0,best:x.mejor||0,last:x.ultima};})});
}
