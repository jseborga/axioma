/* ===========================================================
   THE FINAL TEST · Puertas de Color · reto del día y progreso (API)
   El mismo tablero (semilla del día) para todo el mundo. Cuenta la
   solución con menos jugadas y, si empatan, la más rápida. El servidor
   no se fía de la marca: repite las jugadas con el motor compartido
   (public/bloques-motor.js) y comprueba que resuelven el tablero.
   El tablero del día se genera una vez y queda guardado.

     POST /api/bloques/dia/empieza   → { day, nivel }  (sin la solución)
     POST /api/bloques/dia/termina   { jugadas:[[b,x,y,p]…] } → { movs, segundos, best, mejoro, rank, total }
     GET  /api/bloques/ranking?day=N → { day, top:[…], me, total }
     GET  /api/bloques/progreso      → { data }   (niveles, estrellas, ajustes)
     POST /api/bloques/progreso      { data }     → { ok }
   =========================================================== */
import "../public/bloques-motor.js";
import { esInvitado } from "./aula.js";

var A=globalThis.AxBloques;
var TOP=20, MAX_PROG=60000;

async function nivelDelDia(env,day){
  var r=await env.DB.prepare("SELECT data FROM bloques_nivel WHERE day=?").bind(day).first();
  if(r)return JSON.parse(r.data);
  var nv=A.delDia(day);
  await env.DB.prepare("INSERT INTO bloques_nivel(day,data) VALUES(?,?) ON CONFLICT(day) DO NOTHING").bind(day,JSON.stringify(nv)).run();
  return nv;
}
function sinSolucion(nv){var c={};for(var k in nv)if(k!=="sol")c[k]=nv[k];return c;}

export async function handleBloques(req,env,url,path,ctx){
  var json=ctx.json, user=ctx.user;
  if(!env.DB)return json({error:"not_configured"},null,503);
  try{
    if(path==="/bloques/ranking"&&req.method==="GET")return await ranking(env,user,url,ctx);
    if(!user)return json({error:"unauthorized"},null,401);
    if(path==="/bloques/progreso"&&req.method==="GET"){
      var p=await env.DB.prepare("SELECT data FROM bloques_prog WHERE user_id=?").bind(user.id).first();
      return json({data:p?JSON.parse(p.data):null});
    }
    if(path==="/bloques/progreso"&&req.method==="POST"){
      var b=await req.json().catch(function(){return {};}), txt=JSON.stringify(b.data||null);
      if(!b.data||typeof b.data!=="object"||txt.length>MAX_PROG)return json({error:"bad_request"},null,400);
      await env.DB.prepare("INSERT INTO bloques_prog(user_id,data,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at").bind(user.id,txt,Date.now()).run();
      return json({ok:true});
    }
    if(esInvitado(user))return json({error:"google_required"},null,403);
    if(path==="/bloques/dia/empieza"&&req.method==="POST")return await empieza(env,user,ctx);
    if(path==="/bloques/dia/termina"&&req.method==="POST")return await termina(req,env,user,ctx);
  }catch(e){
    if(/no such table: bloques_/i.test(String(e&&e.message)))return json({error:"bloques_not_configured"},null,503);
    throw e;
  }
  return json({error:"not_found"},null,404);
}

async function empieza(env,user,ctx){
  var day=ctx.dayNumber(), now=Date.now(), nv=await nivelDelDia(env,day);
  await env.DB.prepare("INSERT INTO bloques_dia(user_id,day,best,seconds,intentos,started_at,updated_at) VALUES(?,?,NULL,0,1,?,?) "+
    "ON CONFLICT(user_id,day) DO UPDATE SET intentos=intentos+1,started_at=excluded.started_at").bind(user.id,day,now,now).run();
  return ctx.json({day:day,nivel:sinSolucion(nv)});
}

async function termina(req,env,user,ctx){
  var b=await req.json().catch(function(){return {};}), now=Date.now(), hoy=ctx.dayNumber();
  /* el intento abierto: el de hoy o, si se empezó antes de medianoche, el de ayer */
  var t=await env.DB.prepare("SELECT * FROM bloques_dia WHERE user_id=? AND day>=? AND started_at IS NOT NULL ORDER BY day DESC LIMIT 1").bind(user.id,hoy-1).first();
  if(!t)return ctx.json({error:"not_started"},null,400);
  var jug=Array.isArray(b.jugadas)?b.jugadas.slice(0,2001).map(function(m){return Array.isArray(m)?m.slice(0,4).map(function(v){return v|0;}):null;}):null;
  var nv=await nivelDelDia(env,t.day);
  var seg=(now-t.started_at)/1000, res=jug&&A.evalua(nv,jug,seg);
  if(!res)return ctx.json({error:jug&&A.repite(nv,jug).ok?"bad_time":"bad_result"},null,400);
  /* menos jugadas gana; si empatan, menos tiempo */
  var mejor=t.best===null||res.movs<t.best||(res.movs===t.best&&res.segundos<t.seconds);
  var st=env.DB.prepare("UPDATE bloques_dia SET started_at=NULL"+(mejor?",best=?,seconds=?,updated_at=?":"")+" WHERE user_id=? AND day=? AND started_at=?");
  var args=mejor?[res.movs,res.segundos,now,user.id,t.day,t.started_at]:[user.id,t.day,t.started_at];
  var r=await st.bind.apply(st,args).run();
  if(!r.meta||r.meta.changes!==1)return ctx.json({error:"already"},null,409);
  var best=mejor?res.movs:t.best, secs=mejor?res.segundos:t.seconds, at=mejor?now:t.updated_at;
  var pos=await env.DB.prepare("SELECT COUNT(*) AS n FROM bloques_dia WHERE day=? AND best IS NOT NULL AND (best<? OR (best=? AND (seconds<? OR (seconds=? AND updated_at<?))))").bind(t.day,best,best,secs,secs,at).first();
  var tot=await env.DB.prepare("SELECT COUNT(*) AS n FROM bloques_dia WHERE day=? AND best IS NOT NULL").bind(t.day).first();
  return ctx.json({ok:true,day:t.day,movs:res.movs,segundos:res.segundos,best:best,mejoro:mejor,rank:pos.n+1,total:tot.n});
}

async function ranking(env,user,url,ctx){
  var day=parseInt(url.searchParams.get("day"),10); if(!(day>0))day=ctx.dayNumber();
  var r=await env.DB.prepare("SELECT d.user_id,d.best,d.seconds,d.updated_at,u.name,u.picture FROM bloques_dia d JOIN users u ON u.id=d.user_id "+
    "WHERE d.day=? AND d.best IS NOT NULL ORDER BY d.best ASC,d.seconds ASC,d.updated_at ASC LIMIT ?").bind(day,TOP).all();
  var tot=await env.DB.prepare("SELECT COUNT(*) AS n FROM bloques_dia WHERE day=? AND best IS NOT NULL").bind(day).first();
  var top=(r.results||[]).map(function(x,i){return {rank:i+1,name:x.name,picture:x.picture,movs:x.best,seconds:x.seconds,me:!!(user&&x.user_id===user.id)};});
  var me=null;
  if(user){
    var m=await env.DB.prepare("SELECT best,seconds,updated_at FROM bloques_dia WHERE user_id=? AND day=? AND best IS NOT NULL").bind(user.id,day).first();
    if(m){var p=await env.DB.prepare("SELECT COUNT(*) AS n FROM bloques_dia WHERE day=? AND best IS NOT NULL AND (best<? OR (best=? AND (seconds<? OR (seconds=? AND updated_at<?))))").bind(day,m.best,m.best,m.seconds,m.seconds,m.updated_at).first();
      me={rank:p.n+1,movs:m.best,seconds:m.seconds};}
  }
  return ctx.json({day:day,top:top,me:me,total:tot.n});
}
