/* ===========================================================
   THE FINAL TEST · Ciudad Saber (API)
   Cada persona tiene su ciudad en una ranura de un mundo infinito
   (semilla del mundo) y las demás son sus vecinas. El navegador
   juega por tramos: al guardar manda las acciones del tramo y el
   servidor lo repite desde el último estado comprobado
   (public/ciudad-motor.js), con la semilla del tramo y las respuestas
   que registró. Si cuadra, guarda el estado y abre un tramo nuevo.

     GET  /api/ciudad/mundos                 → { mundos:[{code,nombre,tipo,ends_at,abierto,ciudades,mia}] }
     POST /api/ciudad/entrar   {mundo}       → { mundo, slot, estado|null, nuevo, seg, cerrado }
     POST /api/ciudad/guardar  {mundo,seg,envio:{a,fin}} → { ok, seg, resumen, rank, total }
     GET  /api/ciudad/vecinos?mundo=X        → { vecinos:[{slot,cx,cy,nombre,jugador,radio,tipo,nivel,pob}] }
     GET  /api/ciudad/ranking?mundo=X        → { top:[…], me, total }
     POST /api/ciudad/pregunta {mundo,tema,evita} → { id, tema, q, o } (sin la respuesta, sin repetir en 60 días)
     POST /api/ciudad/responde {mundo,id,o}  → { ok, correcta, dato } (vale la primera respuesta)
   Desafíos de ciudad (docentes):
     GET  /api/ciudad/desafios?course=C      → { desafios:[…], manage }
     POST /api/ciudad/desafios {course,nombre,dias,meta:{pob,fel,con}} → { code }
     POST /api/ciudad/desafios/:code/cerrar  → { ok }
     GET  /api/ciudad/reporte?mundo=X        → { mundo, alumnos:[…], temas:{tema:[aciertos,intentos]} }
   =========================================================== */
import "../public/ciudad-motor.js";
import { esInvitado, accesoCurso } from "./aula.js";
import { preguntaCiudad, eligeCiudad, TEMAS_CIUDAD } from "./ciudad-preguntas.js";

var A=globalThis.AxCiudad;
var ABIERTO="ABIERTO", TOP=20, VISTAS_MS=60*86400000, HOLGURA=3000;
var ALFABETO="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/* sin registro de respuestas (pruebas, retos futuros): se comprueba con el banco */
function oraculoBanco(qid,o,seg,tema){var p=preguntaCiudad(qid,seg); return p&&p.tema===tema?o===p.c:null;}
A.oraculo=oraculoBanco;

function codigo(n){var b=new Uint8Array(n);crypto.getRandomValues(b);var s="";for(var i=0;i<n;i++)s+=ALFABETO[b[i]%ALFABETO.length];return s;}
function azar32(){return crypto.getRandomValues(new Uint32Array(1))[0]>>>0;}
function limpia(s,max){return String(s==null?"":s).replace(/\s+/g," ").trim().slice(0,max);}
function mundoCode(x){x=String(x||"").toUpperCase(); return x===ABIERTO||/^[A-Z0-9]{6}$/.test(x)?x:"";}
function json(t){try{return JSON.parse(t||"null");}catch(e){return null;}}

export async function handleCiudad(req,env,url,path,ctx){
  var j=ctx.json, user=ctx.user;
  if(!env.DB)return j({error:"not_configured"},null,503);
  try{
    if(path==="/ciudad/ranking"&&req.method==="GET")return await ranking(env,user,url,ctx);
    if(!user)return j({error:"unauthorized"},null,401);
    if(esInvitado(user))return j({error:"google_required"},null,403);
    if(path==="/ciudad/mundos"&&req.method==="GET")return await mundos(env,user,ctx);
    if(path==="/ciudad/entrar"&&req.method==="POST")return await entrar(req,env,user,ctx);
    if(path==="/ciudad/guardar"&&req.method==="POST")return await guardar(req,env,user,ctx);
    if(path==="/ciudad/vecinos"&&req.method==="GET")return await vecinos(env,user,url,ctx);
    if(path==="/ciudad/pregunta"&&req.method==="POST")return await pregunta(req,env,user,ctx);
    if(path==="/ciudad/responde"&&req.method==="POST")return await responde(req,env,user,ctx);
    if(path==="/ciudad/desafios"&&req.method==="GET")return await desafios(env,user,url,ctx);
    if(path==="/ciudad/desafios"&&req.method==="POST")return await creaDesafio(req,env,user,ctx);
    var m=path.match(/^\/ciudad\/desafios\/([A-Z0-9]{6})\/cerrar$/);
    if(m&&req.method==="POST")return await cierraDesafio(env,user,m[1],ctx);
    if(path==="/ciudad/reporte"&&req.method==="GET")return await reporte(env,user,url,ctx);
  }catch(e){
    if(/no such table: ciudad_/i.test(String(e&&e.message)))return j({error:"ciudad_not_configured"},null,503);
    throw e;
  }
  return j({error:"not_found"},null,404);
}

/* ---------- mundos y acceso ---------- */
async function abierto(env){
  var w=await env.DB.prepare("SELECT * FROM ciudad_mundos WHERE code=?").bind(ABIERTO).first();
  if(w)return w;
  await env.DB.prepare("INSERT OR IGNORE INTO ciudad_mundos(code,nombre,tipo,seed,created_at) VALUES(?,?,?,?,?)")
    .bind(ABIERTO,"Mundo abierto","abierto",A.semilla("axioma:ciudad:mundo-abierto"),Date.now()).run();
  return env.DB.prepare("SELECT * FROM ciudad_mundos WHERE code=?").bind(ABIERTO).first();
}
/* el mundo y qué puede hacer la persona en él: jugar (miembro activo) o mirar el reporte (quien gestiona el curso) */
async function mundo(env,code,uid){
  code=mundoCode(code); if(!code)return null;
  var w=code===ABIERTO?await abierto(env):await env.DB.prepare("SELECT * FROM ciudad_mundos WHERE code=?").bind(code).first();
  if(!w)return null;
  if(w.tipo==="abierto")return {w:w,juega:true,gestiona:false};
  var a=await accesoCurso(env,w.ref,uid);
  if(!a)return null;
  return {w:w,juega:a.estudiante||a.gestiona,gestiona:a.gestiona,curso:a.curso};
}
function abiertoAhora(w,now){return (!w.starts_at||now>=w.starts_at)&&(!w.ends_at||now<w.ends_at);}
function publico(w,now){var meta=json(w.meta);
  return {code:w.code,nombre:w.nombre,tipo:w.tipo,curso:w.ref||null,starts_at:w.starts_at||null,ends_at:w.ends_at||null,abierto:abiertoAhora(w,now),meta:meta||null};}
function miCiudad(c){return c?{slot:c.slot,nombre:c.nombre,puntaje:c.puntaje,poblacion:c.poblacion,felicidad:c.felicidad,conocimiento:c.conocimiento,updated_at:c.updated_at}:null;}

async function mundos(env,user,ctx){
  var now=Date.now(), w=await abierto(env);
  var cursos=((await env.DB.prepare(
    "SELECT w.* FROM ciudad_mundos w WHERE w.tipo='curso' AND w.ref IN ("+
    " SELECT code FROM course_members WHERE user_id=? AND status='activo' UNION SELECT code FROM courses WHERE owner_id=?) "+
    "ORDER BY CASE WHEN w.ends_at IS NULL OR w.ends_at>? THEN 0 ELSE 1 END,w.created_at DESC LIMIT 30"
  ).bind(user.id,user.id,now).all()).results)||[];
  var todos=[w].concat(cursos), out=[];
  for(var i=0;i<todos.length;i++){
    var x=todos[i], p=publico(x,now);
    var c=await env.DB.prepare("SELECT * FROM ciudad_ciudades WHERE mundo=? AND user_id=?").bind(x.code,user.id).first();
    var n=await env.DB.prepare("SELECT COUNT(*) AS n FROM ciudad_ciudades WHERE mundo=?").bind(x.code).first();
    if(x.ref){var cu=await env.DB.prepare("SELECT name FROM courses WHERE code=?").bind(x.ref).first(); p.curso_nombre=cu?cu.name:"";}
    p.ciudades=n.n; p.mia=miCiudad(c); out.push(p);
  }
  return ctx.json({mundos:out});
}

async function entrar(req,env,user,ctx){
  var b=await req.json().catch(function(){return {};}), now=Date.now();
  var m=await mundo(env,b.mundo,user.id);
  if(!m||!m.juega)return ctx.json({error:"not_found"},null,404);
  var w=m.w, c=await env.DB.prepare("SELECT * FROM ciudad_ciudades WHERE mundo=? AND user_id=?").bind(w.code,user.id).first();
  var cerrado=!abiertoAhora(w,now);
  if(!c){
    if(cerrado)return ctx.json({error:"closed"},null,409);
    var nombre=limpia("Ciudad de "+String(user.name||"").split(" ")[0],30);
    /* la siguiente ranura libre de la espiral (si dos entran a la vez, el índice único decide) */
    for(var intento=0;intento<4&&!c;intento++){
      var mx=await env.DB.prepare("SELECT MAX(slot) AS m FROM ciudad_ciudades WHERE mundo=?").bind(w.code).first();
      var slot=mx&&mx.m!=null?mx.m+1:0;
      try{
        await env.DB.prepare("INSERT INTO ciudad_ciudades(mundo,user_id,slot,nombre,updated_at) VALUES(?,?,?,?,?)").bind(w.code,user.id,slot,nombre,now).run();
      }catch(e){ if(!/UNIQUE|constraint/i.test(String(e&&e.message)))throw e; }
      c=await env.DB.prepare("SELECT * FROM ciudad_ciudades WHERE mundo=? AND user_id=?").bind(w.code,user.id).first();
    }
    if(!c)return ctx.json({error:"busy"},null,503);
  }
  var out={mundo:publico(w,now),slot:c.slot,estado:c.estado||null,nuevo:{mseed:w.seed>>>0,slot:c.slot,nombre:c.nombre},cerrado:cerrado,seg:0};
  if(!cerrado){
    /* un tramo nuevo: el de otra pestaña deja de valer */
    var seg=azar32();
    await env.DB.prepare("UPDATE ciudad_ciudades SET seg_seed=?,seg_at=? WHERE mundo=? AND user_id=?").bind(seg,now,w.code,user.id).run();
    await env.DB.prepare("DELETE FROM ciudad_respuestas WHERE mundo=? AND user_id=?").bind(w.code,user.id).run();
    out.seg=seg;
  }
  return ctx.json(out);
}

async function guardar(req,env,user,ctx){
  var b=await req.json().catch(function(){return {};}), now=Date.now();
  var m=await mundo(env,b.mundo,user.id);
  if(!m||!m.juega)return ctx.json({error:"not_found"},null,404);
  var w=m.w, c=await env.DB.prepare("SELECT * FROM ciudad_ciudades WHERE mundo=? AND user_id=?").bind(w.code,user.id).first();
  if(!c||c.seg_seed==null)return ctx.json({error:"not_started"},null,400);
  if(!abiertoAhora(w,now))return ctx.json({error:"closed"},null,409);
  var seg=parseInt(b.seg,10)>>>0;
  if(seg!==(c.seg_seed>>>0))return ctx.json({error:"stale"},null,409);
  var envio=b.envio||{}, fin=parseInt(envio.fin,10);
  if(!(fin>=0&&fin<=A.MAX_SEG))return ctx.json({error:"bad_result"},null,400);
  /* el juego va como mucho a ×2: el tramo no puede durar menos de la mitad de su tiempo simulado */
  if(now-c.seg_at<fin*A.TICK/2-HOLGURA)return ctx.json({error:"bad_time"},null,400);
  /* las respuestas valen las que registró /responde en este tramo, nada más */
  var reg={};
  (((await env.DB.prepare("SELECT qid,o,ok FROM ciudad_respuestas WHERE mundo=? AND user_id=? AND seg=?").bind(w.code,user.id,seg).all()).results)||[])
    .forEach(function(x){reg[x.qid]=x;});
  var s;
  A.oraculo=function(qid,o,sg,tema,dice){var p=preguntaCiudad(qid,sg); if(!p||p.tema!==tema)return null; var r=reg[qid]; return r&&r.o===o&&!!r.ok===dice?!!r.ok:null;};
  try{ s=A.repite(c.estado,{mseed:w.seed>>>0,slot:c.slot,nombre:c.nombre},seg,envio); }
  finally{ A.oraculo=oraculoBanco; }
  if(!s)return ctx.json({error:"bad_result"},null,400);
  var r=A.resumen(s), estado=A.serializa(s), nuevo=azar32();
  var u=await env.DB.prepare("UPDATE ciudad_ciudades SET estado=?,nombre=?,puntaje=?,poblacion=?,felicidad=?,conocimiento=?,temas=?,segundos=segundos+?,"+
    "seg_seed=?,seg_at=?,updated_at=? WHERE mundo=? AND user_id=? AND seg_seed=?")
    .bind(estado,s.nombre,r.puntaje,r.pob,r.felicidad,r.conocimiento,JSON.stringify(s.temas),Math.round(fin*A.TICK/1000),nuevo,now,now,w.code,user.id,c.seg_seed).run();
  if(!u.meta||u.meta.changes!==1)return ctx.json({error:"stale"},null,409);
  await env.DB.prepare("DELETE FROM ciudad_respuestas WHERE mundo=? AND user_id=? AND seg<>?").bind(w.code,user.id,nuevo).run();
  var pos=await env.DB.prepare("SELECT COUNT(*) AS n FROM ciudad_ciudades WHERE mundo=? AND estado IS NOT NULL AND (puntaje>? OR (puntaje=? AND updated_at<?))").bind(w.code,r.puntaje,r.puntaje,now).first();
  var tot=await env.DB.prepare("SELECT COUNT(*) AS n FROM ciudad_ciudades WHERE mundo=? AND estado IS NOT NULL").bind(w.code).first();
  return ctx.json({ok:true,seg:nuevo,resumen:r,rank:pos.n+1,total:tot.n});
}

/* ---------- vecinos: las ciudades de las ranuras de alrededor ---------- */
function anillo(k){return k<=0?0:Math.ceil((Math.sqrt(k+1)-1)/2);}
async function vecinos(env,user,url,ctx){
  var m=await mundo(env,url.searchParams.get("mundo"),user.id);
  if(!m||!m.juega)return ctx.json({error:"not_found"},null,404);
  var w=m.w, c=await env.DB.prepare("SELECT slot FROM ciudad_ciudades WHERE mundo=? AND user_id=?").bind(w.code,user.id).first();
  if(!c)return ctx.json({vecinos:[]});
  var r=anillo(c.slot), desde=r>=2?(2*r-3)*(2*r-3):0, hasta=(2*r+3)*(2*r+3)-1, yo=A.centroSlot(c.slot);
  var rows=((await env.DB.prepare("SELECT c.slot,c.nombre,c.estado,c.poblacion,c.puntaje,u.name FROM ciudad_ciudades c JOIN users u ON u.id=c.user_id "+
    "WHERE c.mundo=? AND c.slot BETWEEN ? AND ? AND c.user_id<>? AND c.estado IS NOT NULL").bind(w.code,desde,hasta,user.id).all()).results)||[];
  var out=[];
  rows.forEach(function(x){
    var p=A.centroSlot(x.slot); if(Math.max(Math.abs(p.x-yo.x),Math.abs(p.y-yo.y))>A.SEPARA)return;
    var e=json(x.estado); if(!e)return;
    out.push({slot:x.slot,cx:p.x,cy:p.y,nombre:x.nombre,jugador:String(x.name||"").split(" ")[0],radio:A.radio(e),tipo:e.tipo,nivel:e.nivel,pob:x.poblacion,puntaje:x.puntaje});
  });
  return ctx.json({vecinos:out.slice(0,8)});
}

async function ranking(env,user,url,ctx){
  var code=mundoCode(url.searchParams.get("mundo")||ABIERTO);
  if(!code)return ctx.json({error:"not_found"},null,404);
  if(code!==ABIERTO){var m=await mundo(env,code,user&&user.id); if(!m||!m.juega)return ctx.json({error:"not_found"},null,404);}
  var rows=((await env.DB.prepare("SELECT c.user_id,c.nombre,c.puntaje,c.poblacion,c.felicidad,c.conocimiento,c.updated_at,u.name,u.picture FROM ciudad_ciudades c JOIN users u ON u.id=c.user_id "+
    "WHERE c.mundo=? AND c.estado IS NOT NULL ORDER BY c.puntaje DESC,c.updated_at ASC LIMIT ?").bind(code,TOP).all()).results)||[];
  var tot=await env.DB.prepare("SELECT COUNT(*) AS n FROM ciudad_ciudades WHERE mundo=? AND estado IS NOT NULL").bind(code).first();
  var top=rows.map(function(x,i){return {rank:i+1,name:x.name,picture:x.picture,ciudad:x.nombre,score:x.puntaje,pob:x.poblacion,fel:x.felicidad,con:x.conocimiento,me:!!(user&&x.user_id===user.id)};});
  var me=null;
  if(user){
    var c=await env.DB.prepare("SELECT puntaje,updated_at FROM ciudad_ciudades WHERE mundo=? AND user_id=? AND estado IS NOT NULL").bind(code,user.id).first();
    if(c){var p=await env.DB.prepare("SELECT COUNT(*) AS n FROM ciudad_ciudades WHERE mundo=? AND estado IS NOT NULL AND (puntaje>? OR (puntaje=? AND updated_at<?))").bind(code,c.puntaje,c.puntaje,c.updated_at).first();
      me={rank:p.n+1,score:c.puntaje};}
  }
  return ctx.json({mundo:code,top:top,me:me,total:tot.n});
}

/* ---------- preguntas del tramo ---------- */
async function ciudadAbierta(env,user,code){
  var m=await mundo(env,code,user.id);
  if(!m||!m.juega)return null;
  var c=await env.DB.prepare("SELECT seg_seed FROM ciudad_ciudades WHERE mundo=? AND user_id=?").bind(m.w.code,user.id).first();
  return c&&c.seg_seed!=null?{w:m.w,seg:c.seg_seed>>>0}:null;
}
async function pregunta(req,env,user,ctx){
  var b=await req.json().catch(function(){return {};}), tema=String(b.tema||"");
  if(TEMAS_CIUDAD.indexOf(tema)<0)return ctx.json({error:"bad_request"},null,400);
  var c=await ciudadAbierta(env,user,b.mundo);
  if(!c)return ctx.json({error:"not_started"},null,400);
  var evita=[];
  try{evita=(((await env.DB.prepare("SELECT qid FROM preguntas_vistas WHERE quien=? AND visto_at>? ORDER BY visto_at").bind(user.id,Date.now()-VISTAS_MS).all()).results)||[]).map(function(x){return x.qid;});}catch(e){}
  evita=evita.concat((Array.isArray(b.evita)?b.evita:[]).slice(-200).map(function(x){return String(x).slice(0,24);}));
  var id=eligeCiudad(tema,evita,azar32()/4294967296), p=id&&preguntaCiudad(id,c.seg);
  if(!p)return ctx.json({error:"not_found"},null,404);
  return ctx.json({id:p.id,tema:p.tema,q:p.q,o:p.o,seg:c.seg});
}
async function responde(req,env,user,ctx){
  var b=await req.json().catch(function(){return {};}), o=parseInt(b.o,10);
  if(!(o>=-1&&o<=3))return ctx.json({error:"bad_request"},null,400);
  var c=await ciudadAbierta(env,user,b.mundo);
  if(!c)return ctx.json({error:"not_started"},null,400);
  var p=preguntaCiudad(String(b.id||""),c.seg);
  if(!p)return ctx.json({error:"not_found"},null,404);
  var now=Date.now();
  /* vale la primera respuesta: preguntar dos veces no deja cambiarla */
  await env.DB.prepare("INSERT OR IGNORE INTO ciudad_respuestas(mundo,user_id,seg,qid,o,ok,at) VALUES(?,?,?,?,?,?,?)").bind(c.w.code,user.id,c.seg,p.id,o,o===p.c?1:0,now).run();
  var r=await env.DB.prepare("SELECT o,ok FROM ciudad_respuestas WHERE mundo=? AND user_id=? AND seg=? AND qid=?").bind(c.w.code,user.id,c.seg,p.id).first();
  try{await env.DB.prepare("INSERT INTO preguntas_vistas(quien,qid,visto_at) VALUES(?,?,?) ON CONFLICT(quien,qid) DO UPDATE SET visto_at=excluded.visto_at").bind(user.id,p.id,now).run();}catch(e){}
  return ctx.json({ok:!!r.ok,o:r.o,correcta:p.c,dato:p.dato,tema:p.tema});
}

/* ---------- desafíos de ciudad de un curso ---------- */
function metaDe(x){x=x||{}; var n=function(v,max){v=parseInt(v,10); return v>0?Math.min(v,max):0;};
  var m={pob:n(x.pob,100000),fel:n(x.fel,100),con:n(x.con,500)}; return m.pob||m.fel||m.con?m:null;}
async function desafios(env,user,url,ctx){
  var code=String(url.searchParams.get("course")||"").toUpperCase();
  var a=await accesoCurso(env,code,user.id);
  if(!a||!(a.gestiona||a.estudiante))return ctx.json({error:"not_found"},null,404);
  var now=Date.now();
  var rows=((await env.DB.prepare("SELECT w.*,(SELECT COUNT(*) FROM ciudad_ciudades c WHERE c.mundo=w.code AND c.estado IS NOT NULL) AS n FROM ciudad_mundos w "+
    "WHERE w.tipo='curso' AND w.ref=? ORDER BY w.created_at DESC").bind(code).all()).results)||[];
  var out=[];
  for(var i=0;i<rows.length;i++){
    var p=publico(rows[i],now); p.ciudades=rows[i].n;
    p.mia=miCiudad(await env.DB.prepare("SELECT * FROM ciudad_ciudades WHERE mundo=? AND user_id=?").bind(rows[i].code,user.id).first());
    out.push(p);
  }
  return ctx.json({desafios:out,manage:a.gestiona});
}
async function creaDesafio(req,env,user,ctx){
  var b=await req.json().catch(function(){return {};});
  var code=String(b.course||"").toUpperCase(), a=await accesoCurso(env,code,user.id);
  if(!a||!a.gestiona)return ctx.json({error:"forbidden"},null,403);
  var nombre=limpia(b.nombre,60); if(!nombre)return ctx.json({error:"bad_request"},null,400);
  var dias=Math.max(1,Math.min(120,parseInt(b.dias,10)||14)), now=Date.now(), meta=metaDe(b.meta);
  for(var k=0;k<5;k++){
    var nuevo=codigo(6);
    try{
      await env.DB.prepare("INSERT INTO ciudad_mundos(code,nombre,tipo,ref,seed,owner_id,meta,starts_at,ends_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)")
        .bind(nuevo,nombre,"curso",code,azar32(),user.id,meta?JSON.stringify(meta):null,now,now+dias*86400000,now).run();
      return ctx.json({ok:true,code:nuevo});
    }catch(e){ if(!/UNIQUE|constraint/i.test(String(e&&e.message)))throw e; }
  }
  return ctx.json({error:"busy"},null,503);
}
async function cierraDesafio(env,user,code,ctx){
  var m=await mundo(env,code,user.id);
  if(!m||!m.gestiona)return ctx.json({error:"forbidden"},null,403);
  await env.DB.prepare("UPDATE ciudad_mundos SET ends_at=? WHERE code=? AND (ends_at IS NULL OR ends_at>?)").bind(Date.now(),m.w.code,Date.now()).run();
  return ctx.json({ok:true});
}
/* el reporte del docente: cada estudiante del curso con su ciudad y sus aciertos por tema */
async function reporte(env,user,url,ctx){
  var m=await mundo(env,url.searchParams.get("mundo"),user.id);
  if(!m||!m.gestiona)return ctx.json({error:"forbidden"},null,403);
  var w=m.w, now=Date.now();
  var rows=((await env.DB.prepare(
    "SELECT u.id,u.name,u.email,cm.role,c.nombre,c.puntaje,c.poblacion,c.felicidad,c.conocimiento,c.temas,c.segundos,c.updated_at,c.estado IS NOT NULL AS jugo "+
    "FROM course_members cm JOIN users u ON u.id=cm.user_id LEFT JOIN ciudad_ciudades c ON c.mundo=? AND c.user_id=cm.user_id "+
    "WHERE cm.code=? AND cm.status='activo' AND cm.role='estudiante' ORDER BY c.puntaje DESC,u.name").bind(w.code,w.ref).all()).results)||[];
  var meta=json(w.meta)||{}, total={};
  var alumnos=rows.map(function(x){
    var t=json(x.temas)||{}, ac=0, in_=0;
    Object.keys(t).forEach(function(k){ac+=t[k][0]; in_+=t[k][1]; var g=total[k]||(total[k]=[0,0]); g[0]+=t[k][0]; g[1]+=t[k][1];});
    var cumple=!!x.jugo&&(!meta.pob||x.poblacion>=meta.pob)&&(!meta.fel||x.felicidad>=meta.fel)&&(!meta.con||x.conocimiento>=meta.con);
    return {id:x.id,name:x.name,email:x.email,jugo:!!x.jugo,ciudad:x.nombre||"",puntaje:x.puntaje||0,pob:x.poblacion||0,fel:x.felicidad||0,con:x.conocimiento||0,
      aciertos:ac,preguntas:in_,temas:t,minutos:Math.round((x.segundos||0)/60),updated_at:x.updated_at||null,cumple:(meta.pob||meta.fel||meta.con)?cumple:null};
  });
  return ctx.json({mundo:publico(w,now),alumnos:alumnos,temas:total,nombres:A.TEMAS});
}
