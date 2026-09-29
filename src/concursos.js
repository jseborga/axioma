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
     POST /api/contests/:code/join         inscribirse { marketing } (consentimiento de contacto de la empresa)
     POST /api/contests/:code/next         pregunta actual (la primera vez empieza la partida)
     POST /api/contests/:code/answer       { idx, o } → acierto o fallo
     POST /api/contests/:code/close        quien organiza la cierra ya
   =========================================================== */
import { explicaciones } from "./ia.js";
import { secuencia, secuenciaPool, semilla, CATEGORIAS, fichas, materializa, limpiaAreas, disponibles, hacenFalta, cuentaAreas } from "./preguntas.js";
import { perfil, puedePremio, rolOrg, accesoCurso, puedeUsarBanco, esInvitado } from "./aula.js";

var GRACIA=2000;               /* ms de margen por la red al responder */
var PREGUNTAS=[10,20,30,50,100], SEGUNDOS=[10,15,20,30,45,60];
var MIN_MS=5*60000, MAX_MS=31*86400000, MAX_ABIERTOS=20, TOP=100;
var ALFABETO="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export async function handleConcursos(req,env,url,path,ctx){
  var json=ctx.json, user=ctx.user, m;
  if(!env.DB)return json({error:"not_configured"},null,503);
  try{
    if(path==="/contests"&&req.method==="GET")return await lista(env,user,json);
    if(path==="/contests/areas"&&req.method==="GET")return json({areas:cuentaAreas()});
    if((m=path.match(/^\/contests\/([A-Z0-9]{6})$/))&&req.method==="GET")return await ficha(env,user,m[1],json);
    if(!user)return json({error:"unauthorized"},null,401);
    if(path==="/contests"&&req.method==="POST")return await crea(req,env,user,json);
    if((m=path.match(/^\/contests\/([A-Z0-9]{6})\/join$/))&&req.method==="POST")return await inscribe(req,env,user,m[1],json);
    if((m=path.match(/^\/contests\/([A-Z0-9]{6})\/next$/))&&req.method==="POST")return await siguiente(env,user,m[1],json);
    if((m=path.match(/^\/contests\/([A-Z0-9]{6})\/answer$/))&&req.method==="POST")return await responde(req,env,user,m[1],json);
    if((m=path.match(/^\/contests\/([A-Z0-9]{6})\/close$/))&&req.method==="POST")return await cierra(env,user,m[1],json);
    if((m=path.match(/^\/contests\/([A-Z0-9]{6})\/practica$/))&&req.method==="GET")return await practica(env,user,m[1],json);
    if((m=path.match(/^\/contests\/([A-Z0-9]{6})\/practica$/))&&req.method==="POST")return await intentoPractica(req,env,user,m[1],json);
    if((m=path.match(/^\/contests\/([A-Z0-9]{6})\/results$/))&&req.method==="GET")return await resultados(env,user,m[1],json);
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
/* el concurso con su alcance: a quién va dirigido y, si sale de un banco, sus preguntas congeladas */
async function carga(env,code){
  var c=await env.DB.prepare(
    "SELECT c.*,s.kind,s.audience,s.org_id,s.course_code,s.bank_id,s.partial,s.pool FROM contests c LEFT JOIN contest_scope s ON s.code=c.code WHERE c.code=?"
  ).bind(code).first();
  if(!c)return null;
  if(!c.kind)c.kind="concurso";
  if(!c.audience)c.audience=c.public?"publico":"enlace";
  c.poolList=c.pool?JSON.parse(c.pool):null;
  /* práctica o examen y grupo del curso (tabla opcional) */
  c.modo="examen"; c.grupo_id=null; c.explica=false;
  if(c.kind==="cuestionario")try{var op=await env.DB.prepare("SELECT modo,grupo_id,explica FROM cuestionario_opciones WHERE code=?").bind(code).first();
    if(op){c.modo=op.modo||"examen";c.grupo_id=op.grupo_id||null;c.explica=!!op.explica;}}catch(x){}
  /* áreas temáticas elegidas (tabla opcional) */
  try{var ar=await env.DB.prepare("SELECT areas FROM contest_areas WHERE code=?").bind(code).first(); c.areas=ar?JSON.parse(ar.areas):[];}catch(x){c.areas=[];}
  /* ¿admite jugadores invitados? (tabla opcional: bases anteriores a empresas no la tienen) */
  try{var op=await env.DB.prepare("SELECT guests FROM contest_options WHERE code=?").bind(code).first();c.guests=!!(op&&op.guests);}catch(e){c.guests=false;}
  return c;
}
/* quién lo gestiona: quien lo creó, quien gestiona el curso o la administración de la institución */
async function gestiona(env,c,user){
  if(!user)return false;
  if(c.owner_id===user.id)return true;
  if(c.audience==="curso"&&c.course_code){var a=await accesoCurso(env,c.course_code,user.id);return !!(a&&a.gestiona);}
  if(c.org_id)return (await rolOrg(env,c.org_id,user.id))==="admin";
  return false;
}
/* quién puede verlo y participar */
async function accede(env,c,user){
  if(c.audience==="org")return !!(user&&await rolOrg(env,c.org_id,user.id));
  if(c.audience==="curso"){ if(!user)return false; var a=await accesoCurso(env,c.course_code,user.id); if(!a)return false; if(a.gestiona)return true;
    if(!a.estudiante)return false;
    /* dirigido a un grupo del curso: solo sus integrantes */
    if(c.grupo_id){var g=await env.DB.prepare("SELECT 1 FROM course_group_members WHERE code=? AND user_id=? AND group_id=?").bind(c.course_code,user.id,c.grupo_id).first(); return !!g;}
    return true; }
  return true;
}
function entrada(env,code,uid){return env.DB.prepare("SELECT * FROM contest_entries WHERE code=? AND user_id=?").bind(code,uid).first();}
/* las preguntas de un participante: de su secuencia fijada (fichas) o,
   si empezó antes de que existieran, la secuencia original de siempre */
function preguntas(c,uid,f){
  if(c.poolList)return secuenciaPool(semilla(c.seed+":"+uid),c.poolList,c.max_questions,c.level===4);
  if(f)return materializa(c.seed+":"+uid,f);
  return secuencia(semilla(c.seed+":"+uid),c.level,!!c.math,c.max_questions);
}
var VISTAS_MS=60*86400000;          /* no repetir durante 60 días */
async function leeFichas(env,c,uid){
  if(c.poolList)return null;
  try{var r=await env.DB.prepare("SELECT qids FROM contest_seq WHERE code=? AND user_id=?").bind(c.code,uid).first(); return r?JSON.parse(r.qids):null;}
  catch(x){return null;}
}
/* al empezar: se fija la secuencia evitando lo que vio en los últimos 60 días */
async function fijaFichas(env,c,uid,now){
  if(c.poolList)return null;
  try{
    var v=await env.DB.prepare("SELECT qid FROM preguntas_vistas WHERE quien=? AND visto_at>? ORDER BY visto_at").bind(uid,now-VISTAS_MS).all();
    var f=fichas(semilla(c.seed+":"+uid),c.level,!!c.math,c.max_questions,{areas:c.areas,evita:(v.results||[]).map(function(x){return x.qid;})});
    await env.DB.prepare("INSERT OR IGNORE INTO contest_seq(code,user_id,qids,created_at) VALUES(?,?,?,?)").bind(c.code,uid,JSON.stringify(f),now).run();
    return await leeFichas(env,c,uid);
  }catch(x){return null;}                    /* sin las tablas nuevas: como antes */
}
function marcaVista(env,uid,q,now){
  if(!q||!q.id||q.cat==="mat"||typeof q.id!=="string")return null;
  return env.DB.prepare("INSERT INTO preguntas_vistas(quien,qid,visto_at) VALUES(?,?,?) ON CONFLICT(quien,qid) DO UPDATE SET visto_at=excluded.visto_at")
    .bind(uid,q.id,now);
}
function categoria(q){return CATEGORIAS[q.cat]||q.tema||"";}
function publico(c,now){
  return {code:c.code,name:c.name,prize:c.prize,description:c.description,level:c.level,max_errors:c.max_errors,
          max_questions:c.max_questions,seconds_per_q:c.seconds_per_q,math:!!c.math,public:!!c.public,
          starts_at:c.starts_at,ends_at:c.ends_at,state:estado(c,now),
          kind:c.kind||"concurso",audience:c.audience||(c.public?"publico":"enlace"),partial:c.partial||null,
          course_code:c.course_code||null,org_id:c.org_id||null,from_bank:!!c.pool,guests:!!c.guests,
          areas:(c.areas||[]).map(function(k){return CATEGORIAS[k]||k;}),modo:c.modo||"examen",group_id:c.grupo_id||null};
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
    "SELECT c.*,s.kind,s.audience,s.partial,s.course_code,s.org_id,"+cuenta+","+ganador+",e.started_at AS my_started,e.finished_at AS my_finished,e.correct AS my_correct,e.errors AS my_errors "+
    "FROM contests c LEFT JOIN contest_scope s ON s.code=c.code LEFT JOIN contest_entries e ON e.code=c.code AND e.user_id=? "+
    "WHERE c.owner_id=? OR e.user_id IS NOT NULL ORDER BY c.ends_at DESC LIMIT 30"
  ).bind(user.id,user.id).all();
  function sale(c){var o=publico(c,now);o.registered=c.inscritos;if(c.ganador!==undefined&&c.kind!=="cuestionario")o.winner=c.ganador;
    if(c.my_started!==undefined){o.owner=user&&c.owner_id===user.id;o.me=c.my_started===null&&c.my_finished===null&&c.my_correct===null?null:
      {started:!!c.my_started,finished:!!c.my_finished,correct:c.my_correct,errors:c.my_errors};}
    return o;}
  return json({now:now,open:(abiertos.results||[]).map(sale),recent:(recientes.results||[]).map(sale),mine:(mios.results||[]).map(sale)});
}

/* ---------- crear ----------
   kind: concurso (con premio y ranking) | cuestionario (de curso, con nota)
   audience: publico | enlace | org (miembros de la institución) | curso (estudiantes del curso)
   bank_id: si se indica, las preguntas salen de ese banco (filtradas por tema y nivel) y se congelan */
async function crea(req,env,user,json){
  var b=await req.json().catch(function(){return {}});
  var now=Date.now();
  if(esInvitado(user))return json({error:"google_required"},null,403);
  if(!(await perfil(env,user.id)).complete)return json({error:"profile_required"},null,403);
  var name=limpia(b.name,60), prize=limpia(b.prize,200), desc=limpia(b.description,300), partial=limpia(b.partial,40);
  var level=parseInt(b.level,10), maxErr=parseInt(b.max_errors,10), maxQ=parseInt(b.max_questions,10), seg=parseInt(b.seconds_per_q,10);
  var ini=parseInt(b.starts_at,10), fin=parseInt(b.ends_at,10);
  var kind=b.kind==="cuestionario"?"cuestionario":"concurso";
  var aud=["publico","enlace","org","curso"].indexOf(b.audience)>=0?b.audience:(b.public?"publico":"enlace");
  var bankId=parseInt(b.bank_id,10)||0, conBanco=bankId>0;
  if(name.length<2)return json({error:"bad_name"},null,400);
  if(!(level>=1&&level<=(conBanco?5:4)))return json({error:"bad_level"},null,400);
  if(!(maxErr>=0&&maxErr<=100))return json({error:"bad_errors"},null,400);
  if(conBanco?!(maxQ>=1&&maxQ<=100):PREGUNTAS.indexOf(maxQ)<0)return json({error:"bad_questions"},null,400);
  if(SEGUNDOS.indexOf(seg)<0)return json({error:"bad_seconds"},null,400);
  if(!(ini>=now-120000&&ini<=now+120*86400000))return json({error:"bad_start"},null,400);
  if(ini<now)ini=now;
  if(!(fin>=ini+MIN_MS&&fin<=ini+MAX_MS))return json({error:"bad_end"},null,400);
  if(kind==="cuestionario"&&aud!=="curso"&&aud!=="org")return json({error:"bad_audience"},null,400);

  /* a quién va dirigido y con qué permiso */
  var orgId=null, curso=null;
  if(aud==="curso"){
    var a=await accesoCurso(env,String(b.course_code||""),user.id);
    if(!a)return json({error:"not_found"},null,404);
    if(!a.gestiona)return json({error:"forbidden"},null,403);
    curso=a.curso.code; orgId=a.curso.org_id;
  }else if(aud==="org"||b.org_id){
    /* de una institución o empresa: para sus miembros, o convocatoria pública o por enlace con su marca */
    orgId=String(b.org_id||"");
    var r=await rolOrg(env,orgId,user.id);
    if(r!=="admin"&&r!=="docente")return json({error:"forbidden"},null,403);
  }
  /* invitados (sin Google, con código): solo en convocatorias abiertas de una institución o empresa */
  var invitados=b.guests===true&&!!orgId&&(aud==="publico"||aud==="enlace");
  if(orgId){
    var o=await env.DB.prepare("SELECT status FROM orgs WHERE id=?").bind(orgId).first();
    if(!o||o.status!=="activa")return json({error:"org_pending"},null,403);
  }

  /* preguntas del banco, congeladas en el momento de crear */
  var pool=null;
  if(conBanco){
    var bk=await puedeUsarBanco(env,bankId,user.id);
    if(!bk)return json({error:"forbidden_bank"},null,403);
    if(orgId&&bk.org_id!==orgId)return json({error:"forbidden_bank"},null,403);
    var bo=await env.DB.prepare("SELECT status FROM orgs WHERE id=?").bind(bk.org_id).first();
    if(!bo||bo.status!=="activa")return json({error:"org_pending"},null,403);
    var sql="SELECT id,level,topic,q,opts,answer FROM bank_questions WHERE bank_id=?", args=[bankId];
    var tema=limpia(b.topic,60); if(tema){sql+=" AND topic=?";args.push(tema);}
    if(level>=1&&level<=3){sql+=" AND level=?";args.push(level);}
    var st=env.DB.prepare(sql), filas=(await st.bind.apply(st,args).all()).results||[];
    if(!filas.length)return json({error:"empty_pool"},null,400);
    pool=filas.map(function(x){return {id:x.id,level:x.level,topic:x.topic||"",q:x.q,opts:JSON.parse(x.opts),answer:x.answer};});
    if(maxQ>pool.length)maxQ=pool.length;
  }

  /* cuestionario de curso: examen (un intento) o práctica (intentos ilimitados), para todo el curso o un grupo */
  var modo=kind==="cuestionario"&&b.modo==="practica"?"practica":"examen", grupo=null;
  if(kind==="cuestionario"&&b.group_id&&curso){
    var gg=await env.DB.prepare("SELECT id FROM course_groups WHERE id=? AND code=?").bind(+b.group_id,curso).first();
    if(!gg)return json({error:"bad_group"},null,400); grupo=gg.id;
  }
  if(modo==="practica")maxErr=Math.max(maxErr,maxQ);            /* en la práctica no se elimina a nadie */
  /* áreas temáticas del banco general */
  var areas=conBanco?[]:limpiaAreas(b.areas);
  if(areas.length){
    var hay=disponibles(areas), falta=hacenFalta(maxQ,b.math!==false);
    if(hay<falta)return json({error:"few_questions",available:hay,needed:falta},null,400);
  }
  var activos=await env.DB.prepare("SELECT COUNT(*) AS n FROM contests WHERE owner_id=? AND ends_at>?").bind(user.id,now).first();
  if(activos.n>=MAX_ABIERTOS*3)return json({error:"too_many"},null,400);
  var code,intentos=0,choque;
  do{code=codigo();intentos++;choque=await env.DB.prepare("SELECT 1 FROM contests WHERE code=?").bind(code).first();}while(choque&&intentos<5);
  var ops=[env.DB.prepare(
    "INSERT INTO contests(code,name,owner_id,prize,description,level,max_errors,max_questions,seconds_per_q,math,public,starts_at,ends_at,seed,created_at) "+
    "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
  ).bind(code,name,user.id,prize,desc,level,maxErr,maxQ,seg,(b.math===false||conBanco)?0:1,aud==="publico"?1:0,ini,fin,
         crypto.getRandomValues(new Uint32Array(1))[0],now)];
  if(invitados)ops.push(env.DB.prepare("INSERT INTO contest_options(code,guests,created_at) VALUES(?,?,?)").bind(code,1,now));
  if(kind!=="concurso"||aud==="org"||aud==="curso"||conBanco||partial||orgId)ops.push(env.DB.prepare(
    "INSERT INTO contest_scope(code,kind,audience,org_id,course_code,bank_id,partial,pool,created_at) VALUES(?,?,?,?,?,?,?,?,?)"
  ).bind(code,kind,aud,orgId,curso,conBanco?bankId:null,partial||null,pool?JSON.stringify(pool):null,now));
  if(areas.length)ops.push(env.DB.prepare("INSERT INTO contest_areas(code,areas) VALUES(?,?)").bind(code,JSON.stringify(areas)));
  if(kind==="cuestionario"&&(modo==="practica"||grupo))ops.push(env.DB.prepare("INSERT INTO cuestionario_opciones(code,modo,grupo_id,explica) VALUES(?,?,?,?)").bind(code,modo,grupo,b.explica?1:0));
  await env.DB.batch(ops);
  return json({ok:true,code:code,max_questions:maxQ,guests:invitados,areas:areas});
}

/* ---------- ficha ---------- */
async function ficha(env,user,code,json){
  var c=await carga(env,code);
  if(!c)return json({error:"not_found"},null,404);
  var now=Date.now(), o=publico(c,now);
  if(c.org_id){
    var org=await env.DB.prepare("SELECT name FROM orgs WHERE id=?").bind(c.org_id).first();
    o.org_name=org?org.name:"";
    try{var br=await env.DB.prepare("SELECT slug,color,logo FROM org_brand WHERE org_id=?").bind(c.org_id).first();if(br)o.brand=br;}catch(e){}
  }
  if(c.course_code){
    var cu=await env.DB.prepare("SELECT name,term FROM courses WHERE code=?").bind(c.course_code).first();
    o.course_name=cu?cu.name:""; o.course_term=cu?cu.term:"";
  }
  o.manage=await gestiona(env,c,user);
  if(!o.manage&&!(await accede(env,c,user))){
    /* restringido: solo lo necesario para saber a qué curso o institución unirse */
    return json({error:"restricted",name:c.name,kind:o.kind,audience:o.audience,course_code:c.course_code,course_name:o.course_name||"",
                 org_name:o.org_name||""},null,403);
  }
  var dueño=await env.DB.prepare("SELECT name FROM users WHERE id=?").bind(c.owner_id).first();
  var n=await env.DB.prepare(
    "SELECT COUNT(*) AS inscritos, SUM(started_at IS NOT NULL) AS jugaron, SUM(finished_at IS NOT NULL) AS terminaron FROM contest_entries WHERE code=?"
  ).bind(code).first();
  o.now=now; o.owner=!!(user&&user.id===c.owner_id); o.owner_name=dueño?dueño.name:"";
  o.registered=n.inscritos||0; o.played=n.jugaron||0; o.finished=n.terminaron||0;
  var e=user?await entrada(env,code,user.id):null;
  o.me=resumen(e);
  if(c.modo==="practica"&&user)try{var pb=await env.DB.prepare("SELECT MAX(aciertos*100/total) AS mejor,COUNT(*) AS n FROM practica_intentos WHERE code=? AND user_id=?").bind(code,user.id).first();
    o.practica={best:pb.mejor,attempts:pb.n};}catch(x){}

  /* el ranking y las respuestas correctas solo se publican al terminar;
     en un cuestionario, cada estudiante ve solo lo suyo y el docente lo ve todo en /results */
  if(o.state==="terminado"&&o.kind==="cuestionario"){
    if(e&&e.started_at)o.review=await revision(env,c,user.id);
  }else if(o.state==="terminado"){
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
      o.review=await revision(env,c,user.id);
    }
  }
  return json(o);
}
async function revision(env,c,uid){
  var resp=await env.DB.prepare("SELECT idx,chosen,ok FROM contest_answers WHERE code=? AND user_id=? ORDER BY idx").bind(c.code,uid).all();
  var qs=preguntas(c,uid,await leeFichas(env,c,uid));
  return (resp.results||[]).map(function(a){
    var q=qs[a.idx];
    return {n:a.idx+1,cat:categoria(q),q:q.q,chosen:a.chosen>=0?q.o[a.chosen]:null,answer:q.o[q.c],ok:!!a.ok,dato:q.dato||""};
  });
}

/* ---------- inscripción ---------- */
async function inscribe(req,env,user,code,json){
  var b=await req.json().catch(function(){return {};});
  var c=await carga(env,code);
  if(!c)return json({error:"not_found"},null,404);
  if(estado(c,Date.now())==="terminado")return json({error:"finished"},null,400);
  /* un invitado solo entra en convocatorias que admiten invitados */
  if(esInvitado(user)&&!c.guests)return json({error:"google_required"},null,403);
  if(!(await perfil(env,user.id)).complete)return json({error:"profile_required"},null,403);
  if(!(await accede(env,c,user)))return json({error:"restricted"},null,403);
  /* menores sin consentimiento del tutor: fuera de concursos abiertos con premio */
  if((c.audience==="publico"||c.audience==="enlace")&&c.prize&&!(await puedePremio(env,user.id)))
    return json({error:"consent_required"},null,403);
  await env.DB.prepare("INSERT INTO contest_entries(code,user_id,joined_at) VALUES(?,?,?) ON CONFLICT DO NOTHING")
    .bind(code,user.id,Date.now()).run();
  /* consentimiento para que la empresa u organización lo contacte */
  if(c.org_id&&typeof b.marketing==="boolean"){
    try{await env.DB.prepare("INSERT INTO contact_consents(user_id,org_id,marketing,created_at) VALUES(?,?,?,?) ON CONFLICT(user_id,org_id) DO UPDATE SET marketing=excluded.marketing,created_at=excluded.created_at")
      .bind(user.id,c.org_id,b.marketing?1:0,Date.now()).run();}catch(e){}
  }
  return json({ok:true});
}

/* ---------- partida ---------- */
function preguntaPublica(c,e,q,msLeft){
  /* nunca se envía cuál es la correcta */
  return {idx:e.idx,number:e.idx+1,max:c.max_questions,cat:categoria(q),q:q.q,o:q.o,ms:Math.max(0,msLeft),
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
  if(c.modo==="practica")return json({error:"practice_mode"},null,400);
  var now=Date.now(), e=await entrada(env,code,user.id);
  if(!e)return json({error:"not_registered"},null,403);
  if(e.finished_at)return json(fin(e));
  if(now<c.starts_at)return json({error:"not_started",starts_at:c.starts_at},null,400);
  if(now>=c.ends_at){
    await env.DB.prepare("UPDATE contest_entries SET finished_at=?,end_reason='tiempo',q_sent_at=NULL WHERE code=? AND user_id=? AND finished_at IS NULL")
      .bind(now,code,user.id).run();
    return json(fin(await entrada(env,code,user.id)));
  }
  var f=await leeFichas(env,c,user.id);
  if(!e.started_at){
    if(!f)f=await fijaFichas(env,c,user.id,now);
    await env.DB.prepare("UPDATE contest_entries SET started_at=? WHERE code=? AND user_id=? AND started_at IS NULL").bind(now,code,user.id).run();
  }
  var lim=c.seconds_per_q*1000, qs=preguntas(c,user.id,f);
  if(e.q_sent_at){
    var pasado=now-e.q_sent_at;
    if(pasado<=lim+GRACIA)return json(preguntaPublica(c,e,qs[e.idx],lim-pasado));   /* recarga: misma pregunta, mismo reloj */
    /* se quedó sin responder: cuenta como fallo por tiempo */
    var perdida=qs[e.idx];
    e=await registra(env,c,e,-1,false,lim,now);
    if(!e)e=await entrada(env,code,user.id);
    var mv=marcaVista(env,user.id,perdida,now); if(mv)try{await mv.run();}catch(x){}
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
  var q=preguntas(c,user.id,await leeFichas(env,c,user.id))[e.idx], o=parseInt(b.o,10);
  var aTiempo=pasado<=lim+GRACIA, ok=aTiempo&&o===q.c;
  var e2=await registra(env,c,e,aTiempo&&o>=0&&o<q.o.length?o:-1,ok,Math.min(pasado,lim),now);
  if(!e2)return json({error:"stale",idx:e.idx},null,409);
  var mv=marcaVista(env,user.id,q,now); if(mv)try{await mv.run();}catch(x){}
  return json({ok:true,correct:ok,timeout:!aTiempo,finished:!!e2.finished_at,me:resumen(e2),max_errors:c.max_errors});
}

/* ---------- prácticas ----------
   Intentos ilimitados mientras esté abierta. Cada intento recibe una
   selección nueva al azar CON las respuestas y el «¿Sabías que…?», para
   corregir al momento: en una práctica no hay nada que proteger. El
   resultado de cada intento se guarda para la libreta del curso. */
var MAX_INTENTOS_DIA=60;
async function practica(env,user,code,json){
  var c=await carga(env,code);
  if(!c)return json({error:"not_found"},null,404);
  if(c.modo!=="practica")return json({error:"not_practice"},null,400);
  if(!(await gestiona(env,c,user))&&!(await accede(env,c,user)))return json({error:"restricted"},null,403);
  var now=Date.now();
  if(estado(c,now)!=="abierto")return json({error:estado(c,now)==="pronto"?"not_started":"finished",starts_at:c.starts_at},null,400);
  var seed=crypto.getRandomValues(new Uint32Array(1))[0], qs;
  if(c.poolList)qs=secuenciaPool(seed,c.poolList,c.max_questions,c.level===4);
  else qs=materializa(String(seed),fichas(seed,c.level,!!c.math,c.max_questions,{areas:c.areas}));
  /* explicaciones con IA (plan Pro): se generan la primera vez y se guardan */
  var clave=function(q){return q.id?(c.poolList?"b":"g")+q.id:null;}, exp={};
  if(c.explica)exp=await explicaciones(env,c.org_id,qs.filter(function(q){return clave(q)&&!q.dato;}).map(function(q){return {clave:clave(q),q:q.q,o:q.o,c:q.c};}));
  return json({code:code,name:c.name,seconds_per_q:c.seconds_per_q,
    questions:qs.map(function(q){return {id:q.id||null,q:q.q,o:q.o,c:q.c,cat:categoria(q),dato:q.dato||exp[clave(q)]||""};})});
}
async function intentoPractica(req,env,user,code,json){
  var c=await carga(env,code);
  if(!c)return json({error:"not_found"},null,404);
  if(c.modo!=="practica")return json({error:"not_practice"},null,400);
  if(!(await accede(env,c,user)))return json({error:"restricted"},null,403);
  var b=await req.json().catch(function(){return {};});
  var total=parseInt(b.total,10), ac=parseInt(b.aciertos,10), ms=Math.max(0,Math.min(3600000,parseInt(b.ms,10)||0));
  if(!(total>=1&&total<=c.max_questions&&ac>=0&&ac<=total))return json({error:"bad_result"},null,400);
  var hoy=await env.DB.prepare("SELECT COUNT(*) AS n FROM practica_intentos WHERE code=? AND user_id=? AND created_at>?").bind(code,user.id,Date.now()-86400000).first();
  if(hoy.n>=MAX_INTENTOS_DIA)return json({error:"too_many"},null,429);
  await env.DB.prepare("INSERT INTO practica_intentos(code,user_id,aciertos,total,ms,created_at) VALUES(?,?,?,?,?,?)").bind(code,user.id,ac,total,ms,Date.now()).run();
  var best=await env.DB.prepare("SELECT MAX(aciertos*100/total) AS mejor,COUNT(*) AS n FROM practica_intentos WHERE code=? AND user_id=?").bind(code,user.id).first();
  return json({ok:true,best:best.mejor,attempts:best.n});
}

async function cierra(env,user,code,json){
  var c=await carga(env,code);
  if(!c)return json({error:"not_found"},null,404);
  if(!(await gestiona(env,c,user)))return json({error:"forbidden"},null,403);
  var now=Date.now();
  if(estado(c,now)==="terminado")return json({ok:true});
  await env.DB.prepare("UPDATE contests SET ends_at=?,starts_at=MIN(starts_at,?) WHERE code=?").bind(now,now,code).run();
  return json({ok:true});
}

/* ---------- registros para el docente ----------
   Todos los participantes (y, en un cuestionario de curso, también quienes
   no participaron), con su registro universitario, y la estadística de
   cada pregunta: cuántos la respondieron y cuántos acertaron. */
async function resultados(env,user,code,json){
  var c=await carga(env,code);
  if(!c)return json({error:"not_found"},null,404);
  if(!(await gestiona(env,c,user)))return json({error:"forbidden"},null,403);
  var orden=" ORDER BY e.started_at IS NULL,e.correct DESC,e.errors ASC,e.total_ms ASC,e.started_at ASC", ent;
  try{
    /* con los datos de invitados y el consentimiento de contacto */
    ent=await env.DB.prepare(
      "SELECT e.*,u.name,u.email,om.student_code,g.channel AS g_channel,g.contact AS g_contact,g.verified_by AS g_verified,cc.marketing "+
      "FROM contest_entries e JOIN users u ON u.id=e.user_id LEFT JOIN org_members om ON om.org_id=? AND om.user_id=e.user_id "+
      "LEFT JOIN guests g ON g.user_id=e.user_id LEFT JOIN contact_consents cc ON cc.user_id=e.user_id AND cc.org_id=? WHERE e.code=?"+orden
    ).bind(c.org_id||"",c.org_id||"",code).all();
  }catch(x){
    ent=await env.DB.prepare(
      "SELECT e.*,u.name,u.email,om.student_code FROM contest_entries e JOIN users u ON u.id=e.user_id "+
      "LEFT JOIN org_members om ON om.org_id=? AND om.user_id=e.user_id WHERE e.code=?"+orden
    ).bind(c.org_id||"",code).all();
  }
  var filas=(ent.results||[]).map(function(e){
    return {user_id:e.user_id,name:e.name,email:e.email,student_code:e.student_code||"",
            phone:e.g_channel==="sms"?e.g_contact:"",guest:!!e.g_channel,verified_by:e.g_verified||(e.g_channel?"":"google"),
            marketing:e.marketing===undefined||e.marketing===null?null:!!e.marketing,
            status:e.finished_at?"terminado":e.started_at?"en curso":"inscrito",
            correct:e.correct,errors:e.errors,answered:e.idx,total_ms:e.total_ms,reason:e.end_reason||"",
            started_at:e.started_at,finished_at:e.finished_at};
  });
  if(c.course_code){
    var faltan=await env.DB.prepare(
      "SELECT u.id,u.name,u.email,om.student_code FROM course_members cm JOIN users u ON u.id=cm.user_id "+
      "LEFT JOIN org_members om ON om.org_id=? AND om.user_id=cm.user_id "+
      "WHERE cm.code=? AND cm.role='estudiante' AND cm.status='activo' AND cm.user_id NOT IN (SELECT user_id FROM contest_entries WHERE code=?) ORDER BY u.name"
    ).bind(c.org_id||"",c.course_code,code).all();
    (faltan.results||[]).forEach(function(u){
      filas.push({user_id:u.id,name:u.name,email:u.email,student_code:u.student_code||"",status:"no participó",
                  correct:0,errors:0,answered:0,total_ms:0,reason:"",started_at:null,finished_at:null});
    });
  }
  var pos=0; filas.forEach(function(f){ if(f.started_at)f.rank=++pos; });

  /* estadística por pregunta: se reconstruye la secuencia de cada participante */
  var resp=await env.DB.prepare("SELECT user_id,idx,ok FROM contest_answers WHERE code=?").bind(code).all();
  var porPregunta={}, secs={}, fi={};
  if(!c.poolList)try{((await env.DB.prepare("SELECT user_id,qids FROM contest_seq WHERE code=?").bind(code).all()).results||[])
    .forEach(function(x){fi[x.user_id]=JSON.parse(x.qids);});}catch(x){}
  (resp.results||[]).forEach(function(a){
    var sec=secs[a.user_id]||(secs[a.user_id]=preguntas(c,a.user_id,fi[a.user_id])), q=sec[a.idx]; if(!q)return;
    var k=q.id?("#"+q.id):q.q, x=porPregunta[k]||(porPregunta[k]={q:q.q,cat:categoria(q),level:q.nivel||null,answered:0,correct:0});
    x.answered++; if(a.ok)x.correct++;
  });
  var preguntasEst=Object.keys(porPregunta).map(function(k){var x=porPregunta[k];x.pct=Math.round(100*x.correct/x.answered);return x;})
    .sort(function(a,b){return a.pct-b.pct||b.answered-a.answered;});
  var o=publico(c,Date.now());
  if(c.course_code){var cu=await env.DB.prepare("SELECT name,term FROM courses WHERE code=?").bind(c.course_code).first();o.course_name=cu?cu.name:"";o.course_term=cu?cu.term:"";}
  o.rows=filas; o.questions=preguntasEst;
  return json(o);
}
