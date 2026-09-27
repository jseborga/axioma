/* ===========================================================
   AXIOMA · Concursos de trivia (API)
   Quien organiza abre una convocatoria con premio, fechas, dificultad
   y errores admitidos. Cada jugador se inscribe y juega una sola vez:
   el servidor le manda las preguntas de una en una, sin la respuesta,
   y mide él mismo el tiempo de cada una. Al terminar el plazo se
   publica el ranking.

     GET  /api/contests                    abiertos, tuyos y resultados (sin sesión: solo públicos)
     POST /api/contests                    crea una convocatoria
     GET  /api/contests/:code              ficha; ranking y revisión solo al terminar
     POST /api/contests/:code/join         inscribirse
     POST /api/contests/:code/next         pregunta actual (la primera vez empieza la partida)
     POST /api/contests/:code/answer       { idx, o } → acierto o fallo
     POST /api/contests/:code/close        quien organiza la cierra ya
   =========================================================== */
import { secuencia, semilla, CATEGORIAS } from "./preguntas.js";

var GRACIA=2000;               /* ms de margen por la red al responder */
var PREGUNTAS=[10,20,30,50,100], SEGUNDOS=[10,15,20,30];
var MIN_MS=5*60000, MAX_MS=31*86400000, MAX_ABIERTOS=20, TOP=100;
var ALFABETO="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export async function handleConcursos(req,env,url,path,ctx){
  var json=ctx.json, user=ctx.user, m;
  if(!env.DB)return json({error:"not_configured"},null,503);
  try{
    if(path==="/contests"&&req.method==="GET")return await lista(env,user,json);
    if((m=path.match(/^\/contests\/([A-Z0-9]{6})$/))&&req.method==="GET")return await ficha(env,user,m[1],json);
    if(!user)return json({error:"unauthorized"},null,401);
    if(path==="/contests"&&req.method==="POST")return await crea(req,env,user,json);
    if((m=path.match(/^\/contests\/([A-Z0-9]{6})\/join$/))&&req.method==="POST")return await inscribe(env,user,m[1],json);
    if((m=path.match(/^\/contests\/([A-Z0-9]{6})\/next$/))&&req.method==="POST")return await siguiente(env,user,m[1],json);
    if((m=path.match(/^\/contests\/([A-Z0-9]{6})\/answer$/))&&req.method==="POST")return await responde(req,env,user,m[1],json);
    if((m=path.match(/^\/contests\/([A-Z0-9]{6})\/close$/))&&req.method==="POST")return await cierra(env,user,m[1],json);
  }catch(e){
    if(/no such table/i.test(String(e&&e.message)))return json({error:"not_configured"},null,503);
    throw e;
  }
  return json({error:"not_found"},null,404);
}

/* ---------- utilidades ---------- */
function limpia(s,max){return String(s==null?"":s).replace(/\s+/g," ").trim().slice(0,max);}
function codigo(){var b=new Uint8Array(6);crypto.getRandomValues(b);var s="";for(var i=0;i<6;i++)s+=ALFABETO[b[i]%ALFABETO.length];return s;}
function estado(c,now){return now<c.starts_at?"pronto":now<c.ends_at?"abierto":"terminado";}
function carga(env,code){return env.DB.prepare("SELECT * FROM contests WHERE code=?").bind(code).first();}
function entrada(env,code,uid){return env.DB.prepare("SELECT * FROM contest_entries WHERE code=? AND user_id=?").bind(code,uid).first();}
function preguntas(c,uid){return secuencia(semilla(c.seed+":"+uid),c.level,!!c.math,c.max_questions);}
function publico(c,now){
  return {code:c.code,name:c.name,prize:c.prize,description:c.description,level:c.level,max_errors:c.max_errors,
          max_questions:c.max_questions,seconds_per_q:c.seconds_per_q,math:!!c.math,public:!!c.public,
          starts_at:c.starts_at,ends_at:c.ends_at,state:estado(c,now)};
}
function resumen(e){
  if(!e)return null;
  return {joined:true,started:!!e.started_at,finished:!!e.finished_at,answered:e.idx,correct:e.correct,
          errors:e.errors,total_ms:e.total_ms,reason:e.end_reason||null};
}

/* ---------- lista ---------- */
async function lista(env,user,json){
  var now=Date.now();
  var cuenta="(SELECT COUNT(*) FROM contest_entries x WHERE x.code=c.code) AS inscritos";
  var ganador="(SELECT u.name FROM contest_entries g JOIN users u ON u.id=g.user_id WHERE g.code=c.code AND g.started_at IS NOT NULL AND g.correct>0 "+
              "ORDER BY g.correct DESC,g.errors ASC,g.total_ms ASC,g.started_at ASC LIMIT 1) AS ganador";
  var abiertos=await env.DB.prepare("SELECT c.*,"+cuenta+" FROM contests c WHERE c.public=1 AND c.ends_at>? ORDER BY c.starts_at<=? DESC, c.ends_at ASC LIMIT 30")
    .bind(now,now).all();
  var recientes=await env.DB.prepare("SELECT c.*,"+cuenta+","+ganador+" FROM contests c WHERE c.public=1 AND c.ends_at<=? AND c.ends_at>? ORDER BY c.ends_at DESC LIMIT 20")
    .bind(now,now-14*86400000).all();
  var mios={results:[]};
  if(user)mios=await env.DB.prepare(
    "SELECT c.*,"+cuenta+","+ganador+",e.started_at AS my_started,e.finished_at AS my_finished,e.correct AS my_correct,e.errors AS my_errors "+
    "FROM contests c LEFT JOIN contest_entries e ON e.code=c.code AND e.user_id=? "+
    "WHERE c.owner_id=? OR e.user_id IS NOT NULL ORDER BY c.ends_at DESC LIMIT 30"
  ).bind(user.id,user.id).all();
  function sale(c){var o=publico(c,now);o.registered=c.inscritos;if(c.ganador!==undefined)o.winner=c.ganador;
    if(c.my_started!==undefined){o.owner=user&&c.owner_id===user.id;o.me=c.my_started===null&&c.my_finished===null&&c.my_correct===null?null:
      {started:!!c.my_started,finished:!!c.my_finished,correct:c.my_correct,errors:c.my_errors};}
    return o;}
  return json({now:now,open:(abiertos.results||[]).map(sale),recent:(recientes.results||[]).map(sale),mine:(mios.results||[]).map(sale)});
}

/* ---------- crear ---------- */
async function crea(req,env,user,json){
  var b=await req.json().catch(function(){return {}});
  var now=Date.now();
  var name=limpia(b.name,60), prize=limpia(b.prize,200), desc=limpia(b.description,300);
  var level=parseInt(b.level,10), maxErr=parseInt(b.max_errors,10), maxQ=parseInt(b.max_questions,10), seg=parseInt(b.seconds_per_q,10);
  var ini=parseInt(b.starts_at,10), fin=parseInt(b.ends_at,10);
  if(name.length<2)return json({error:"bad_name"},null,400);
  if(!(level>=1&&level<=4))return json({error:"bad_level"},null,400);
  if(!(maxErr>=0&&maxErr<=10))return json({error:"bad_errors"},null,400);
  if(PREGUNTAS.indexOf(maxQ)<0)return json({error:"bad_questions"},null,400);
  if(SEGUNDOS.indexOf(seg)<0)return json({error:"bad_seconds"},null,400);
  if(!(ini>=now-120000&&ini<=now+60*86400000))return json({error:"bad_start"},null,400);
  if(ini<now)ini=now;
  if(!(fin>=ini+MIN_MS&&fin<=ini+MAX_MS))return json({error:"bad_end"},null,400);
  var activos=await env.DB.prepare("SELECT COUNT(*) AS n FROM contests WHERE owner_id=? AND ends_at>?").bind(user.id,now).first();
  if(activos.n>=MAX_ABIERTOS)return json({error:"too_many"},null,400);
  var code,intentos=0,choque;
  do{code=codigo();intentos++;choque=await env.DB.prepare("SELECT 1 FROM contests WHERE code=?").bind(code).first();}while(choque&&intentos<5);
  await env.DB.prepare(
    "INSERT INTO contests(code,name,owner_id,prize,description,level,max_errors,max_questions,seconds_per_q,math,public,starts_at,ends_at,seed,created_at) "+
    "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
  ).bind(code,name,user.id,prize,desc,level,maxErr,maxQ,seg,b.math===false?0:1,b.public?1:0,ini,fin,
         crypto.getRandomValues(new Uint32Array(1))[0],now).run();
  return json({ok:true,code:code});
}

/* ---------- ficha ---------- */
async function ficha(env,user,code,json){
  var c=await carga(env,code);
  if(!c)return json({error:"not_found"},null,404);
  var now=Date.now(), o=publico(c,now);
  var dueño=await env.DB.prepare("SELECT name FROM users WHERE id=?").bind(c.owner_id).first();
  var n=await env.DB.prepare(
    "SELECT COUNT(*) AS inscritos, SUM(started_at IS NOT NULL) AS jugaron, SUM(finished_at IS NOT NULL) AS terminaron FROM contest_entries WHERE code=?"
  ).bind(code).first();
  o.now=now; o.owner=!!(user&&user.id===c.owner_id); o.owner_name=dueño?dueño.name:"";
  o.registered=n.inscritos||0; o.played=n.jugaron||0; o.finished=n.terminaron||0;
  var e=user?await entrada(env,code,user.id):null;
  o.me=resumen(e);

  /* el ranking y las respuestas correctas solo se publican al terminar */
  if(o.state==="terminado"){
    var rows=await env.DB.prepare(
      "SELECT e.user_id,u.name,u.picture,e.correct,e.errors,e.total_ms,e.idx FROM contest_entries e JOIN users u ON u.id=e.user_id "+
      "WHERE e.code=? AND e.started_at IS NOT NULL ORDER BY e.correct DESC,e.errors ASC,e.total_ms ASC,e.started_at ASC LIMIT ?"
    ).bind(code,TOP).all();
    o.ranking=(rows.results||[]).map(function(r,i){
      return {rank:i+1,name:r.name,picture:r.picture,correct:r.correct,errors:r.errors,total_ms:r.total_ms,answered:r.idx,
              me:!!(user&&r.user_id===user.id)};
    });
    var g=o.ranking[0];
    o.winner=(g&&g.correct>0)?{name:g.name,picture:g.picture,correct:g.correct,errors:g.errors,total_ms:g.total_ms}:null;
    if(e&&e.started_at){
      if(!o.ranking.some(function(r){return r.me;})){
        var ant=await env.DB.prepare(
          "SELECT COUNT(*) AS n FROM contest_entries WHERE code=? AND started_at IS NOT NULL AND "+
          "(correct>? OR (correct=? AND (errors<? OR (errors=? AND (total_ms<? OR (total_ms=? AND started_at<?))))))"
        ).bind(code,e.correct,e.correct,e.errors,e.errors,e.total_ms,e.total_ms,e.started_at).first();
        o.my_rank=(ant.n||0)+1;
      }
      var resp=await env.DB.prepare("SELECT idx,chosen,ok FROM contest_answers WHERE code=? AND user_id=? ORDER BY idx").bind(code,user.id).all();
      var qs=preguntas(c,user.id);
      o.review=(resp.results||[]).map(function(a){
        var q=qs[a.idx];
        return {n:a.idx+1,cat:CATEGORIAS[q.cat],q:q.q,chosen:a.chosen>=0?q.o[a.chosen]:null,answer:q.o[q.c],ok:!!a.ok};
      });
    }
  }
  return json(o);
}

/* ---------- inscripción ---------- */
async function inscribe(env,user,code,json){
  var c=await carga(env,code);
  if(!c)return json({error:"not_found"},null,404);
  if(estado(c,Date.now())==="terminado")return json({error:"finished"},null,400);
  await env.DB.prepare("INSERT INTO contest_entries(code,user_id,joined_at) VALUES(?,?,?) ON CONFLICT DO NOTHING")
    .bind(code,user.id,Date.now()).run();
  return json({ok:true});
}

/* ---------- partida ---------- */
function preguntaPublica(c,e,q,msLeft){
  /* nunca se envía cuál es la correcta */
  return {idx:e.idx,number:e.idx+1,max:c.max_questions,cat:CATEGORIAS[q.cat],q:q.q,o:q.o,ms:Math.max(0,msLeft),
          limit:c.seconds_per_q*1000,correct:e.correct,errors:e.errors,max_errors:c.max_errors};
}
function fin(e){return {finished:true,me:resumen(e)};}

/* Registra la respuesta a la pregunta idx con una actualización
   condicional: si llegan dos a la vez, solo cuenta la primera. */
async function registra(env,c,e,chosen,ok,ms,now){
  var errores=e.errors+(ok?0:1), aciertos=e.correct+(ok?1:0), idx=e.idx+1, motivo=null;
  if(errores>c.max_errors)motivo="errores";
  else if(idx>=c.max_questions)motivo="completo";
  else if(now>=c.ends_at)motivo="tiempo";
  var r=await env.DB.prepare(
    "UPDATE contest_entries SET idx=?,correct=?,errors=?,total_ms=total_ms+?,q_sent_at=NULL,finished_at=?,end_reason=? "+
    "WHERE code=? AND user_id=? AND idx=? AND q_sent_at=? AND finished_at IS NULL"
  ).bind(idx,aciertos,errores,ms,motivo?now:null,motivo,c.code,e.user_id,e.idx,e.q_sent_at).run();
  if(!r.meta||r.meta.changes!==1)return null;
  await env.DB.prepare("INSERT OR IGNORE INTO contest_answers(code,user_id,idx,chosen,ok,ms) VALUES(?,?,?,?,?,?)")
    .bind(c.code,e.user_id,e.idx,chosen,ok?1:0,ms).run();
  return entrada(env,c.code,e.user_id);
}

async function siguiente(env,user,code,json){
  var c=await carga(env,code);
  if(!c)return json({error:"not_found"},null,404);
  var now=Date.now(), e=await entrada(env,code,user.id);
  if(!e)return json({error:"not_registered"},null,403);
  if(e.finished_at)return json(fin(e));
  if(now<c.starts_at)return json({error:"not_started",starts_at:c.starts_at},null,400);
  if(now>=c.ends_at){
    await env.DB.prepare("UPDATE contest_entries SET finished_at=?,end_reason='tiempo',q_sent_at=NULL WHERE code=? AND user_id=? AND finished_at IS NULL")
      .bind(now,code,user.id).run();
    return json(fin(await entrada(env,code,user.id)));
  }
  if(!e.started_at){
    await env.DB.prepare("UPDATE contest_entries SET started_at=? WHERE code=? AND user_id=? AND started_at IS NULL").bind(now,code,user.id).run();
  }
  var lim=c.seconds_per_q*1000, qs=preguntas(c,user.id);
  if(e.q_sent_at){
    var pasado=now-e.q_sent_at;
    if(pasado<=lim+GRACIA)return json(preguntaPublica(c,e,qs[e.idx],lim-pasado));   /* recarga: misma pregunta, mismo reloj */
    /* se quedó sin responder: cuenta como fallo por tiempo */
    e=await registra(env,c,e,-1,false,lim,now);
    if(!e)e=await entrada(env,code,user.id);
    if(e.finished_at)return json(fin(e));
  }
  var r=await env.DB.prepare(
    "UPDATE contest_entries SET q_sent_at=? WHERE code=? AND user_id=? AND idx=? AND q_sent_at IS NULL AND finished_at IS NULL"
  ).bind(now,code,user.id,e.idx).run();
  e=await entrada(env,code,user.id);
  if(e.finished_at)return json(fin(e));
  return json(preguntaPublica(c,e,qs[e.idx],r.meta&&r.meta.changes===1?lim:lim-(now-e.q_sent_at)));
}

async function responde(req,env,user,code,json){
  var c=await carga(env,code);
  if(!c)return json({error:"not_found"},null,404);
  var e=await entrada(env,code,user.id);
  if(!e)return json({error:"not_registered"},null,403);
  if(e.finished_at)return json(fin(e));
  var b=await req.json().catch(function(){return {}});
  if(!e.q_sent_at||parseInt(b.idx,10)!==e.idx)return json({error:"stale",idx:e.idx},null,409);
  var now=Date.now(), lim=c.seconds_per_q*1000, pasado=now-e.q_sent_at;
  var q=preguntas(c,user.id)[e.idx], o=parseInt(b.o,10);
  var aTiempo=pasado<=lim+GRACIA, ok=aTiempo&&o===q.c;
  var e2=await registra(env,c,e,aTiempo&&o>=0&&o<4?o:-1,ok,Math.min(pasado,lim),now);
  if(!e2)return json({error:"stale",idx:e.idx},null,409);
  return json({ok:true,correct:ok,timeout:!aTiempo,finished:!!e2.finished_at,me:resumen(e2),max_errors:c.max_errors});
}

async function cierra(env,user,code,json){
  var c=await carga(env,code);
  if(!c)return json({error:"not_found"},null,404);
  if(c.owner_id!==user.id)return json({error:"forbidden"},null,403);
  var now=Date.now();
  if(estado(c,now)==="terminado")return json({ok:true});
  await env.DB.prepare("UPDATE contests SET ends_at=?,starts_at=MIN(starts_at,?) WHERE code=?").bind(now,now,code).run();
  return json({ok:true});
}
