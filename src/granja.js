/* ===========================================================
   THE FINAL TEST · Granja Express · la granja del día (API)
   La misma granja (semilla del día) para todo el mundo. Se juega
   cuantas veces se quiera y cuenta la mejor partida. El servidor no
   se fía de la marca: repite la partida con las acciones enviadas
   (public/granja-motor.js) y compara su duración con su reloj.

     POST /api/granja/dia/empieza   → { day, datos }
     POST /api/granja/dia/termina   { envio:{a,fin} } → { score, best, mejoro, rank, total }
     GET  /api/granja/ranking?day=N → { day, top:[…], me, total }
   =========================================================== */
import "../public/rapidos-motor.js";
import "../public/granja-motor.js";
import { esInvitado } from "./aula.js";

var R=globalThis.AxRapidos, A=globalThis.AxGranja;
var TOP=20;

export function datosDelDia(day){return R.genera("granja",R.semilla("granja:"+day));}

export async function handleGranja(req,env,url,path,ctx){
  var json=ctx.json, user=ctx.user;
  if(!env.DB)return json({error:"not_configured"},null,503);
  try{
    if(path==="/granja/ranking"&&req.method==="GET")return await ranking(env,user,url,ctx);
    if(!user)return json({error:"unauthorized"},null,401);
    if(esInvitado(user))return json({error:"google_required"},null,403);
    if(path==="/granja/dia/empieza"&&req.method==="POST")return await empieza(env,user,ctx);
    if(path==="/granja/dia/termina"&&req.method==="POST")return await termina(req,env,user,ctx);
  }catch(e){
    if(/no such table: granja_dia/i.test(String(e&&e.message)))return json({error:"granja_not_configured"},null,503);
    throw e;
  }
  return json({error:"not_found"},null,404);
}

async function empieza(env,user,ctx){
  var day=ctx.dayNumber(), now=Date.now();
  await env.DB.prepare("INSERT INTO granja_dia(user_id,day,best,seconds,entregas,nivel,intentos,started_at,updated_at) VALUES(?,?,NULL,0,0,0,1,?,?) "+
    "ON CONFLICT(user_id,day) DO UPDATE SET intentos=intentos+1,started_at=excluded.started_at").bind(user.id,day,now,now).run();
  return ctx.json({day:day,datos:datosDelDia(day)});
}

async function termina(req,env,user,ctx){
  var b=await req.json().catch(function(){return {};}), now=Date.now(), hoy=ctx.dayNumber();
  /* la partida abierta: la de hoy o, si se empezó antes de medianoche, la de ayer */
  var t=await env.DB.prepare("SELECT * FROM granja_dia WHERE user_id=? AND day>=? AND started_at IS NOT NULL ORDER BY day DESC LIMIT 1").bind(user.id,hoy-1).first();
  if(!t)return ctx.json({error:"not_started"},null,400);
  var res=R.evalua("granja",datosDelDia(t.day),b.envio);
  if(!res)return ctx.json({error:"bad_result"},null,400);
  if(!A.tiempoOk(res,now-t.started_at))return ctx.json({error:"bad_time"},null,400);
  /* solo una vez por partida empezada; la mejor se queda */
  var mejor=t.best===null||res.score>t.best;
  var st=env.DB.prepare("UPDATE granja_dia SET started_at=NULL"+(mejor?",best=?,seconds=?,entregas=?,nivel=?,updated_at=?":"")+" WHERE user_id=? AND day=? AND started_at=?");
  var args=mejor?[res.score,res.seconds,res.entregas,res.nivel,now,user.id,t.day,t.started_at]:[user.id,t.day,t.started_at];
  var r=await st.bind.apply(st,args).run();
  if(!r.meta||r.meta.changes!==1)return ctx.json({error:"already"},null,409);
  var best=mejor?res.score:t.best, at=mejor?now:t.updated_at;
  var pos=await env.DB.prepare("SELECT COUNT(*) AS n FROM granja_dia WHERE day=? AND best IS NOT NULL AND (best>? OR (best=? AND updated_at<?))").bind(t.day,best,best,at).first();
  var tot=await env.DB.prepare("SELECT COUNT(*) AS n FROM granja_dia WHERE day=? AND best IS NOT NULL").bind(t.day).first();
  return ctx.json({ok:true,day:t.day,score:res.score,entregas:res.entregas,nivel:res.nivel,best:best,mejoro:mejor,rank:pos.n+1,total:tot.n});
}

async function ranking(env,user,url,ctx){
  var day=parseInt(url.searchParams.get("day"),10); if(!(day>0))day=ctx.dayNumber();
  var r=await env.DB.prepare("SELECT g.user_id,g.best,g.entregas,g.nivel,g.updated_at,u.name,u.picture FROM granja_dia g JOIN users u ON u.id=g.user_id "+
    "WHERE g.day=? AND g.best IS NOT NULL ORDER BY g.best DESC,g.updated_at ASC LIMIT ?").bind(day,TOP).all();
  var tot=await env.DB.prepare("SELECT COUNT(*) AS n FROM granja_dia WHERE day=? AND best IS NOT NULL").bind(day).first();
  var top=(r.results||[]).map(function(x,i){return {rank:i+1,name:x.name,picture:x.picture,score:x.best,entregas:x.entregas,nivel:x.nivel,me:!!(user&&x.user_id===user.id)};});
  var me=null;
  if(user){
    var m=await env.DB.prepare("SELECT best,updated_at FROM granja_dia WHERE user_id=? AND day=? AND best IS NOT NULL").bind(user.id,day).first();
    if(m){var p=await env.DB.prepare("SELECT COUNT(*) AS n FROM granja_dia WHERE day=? AND best IS NOT NULL AND (best>? OR (best=? AND updated_at<?))").bind(day,m.best,m.best,m.updated_at).first();
      me={rank:p.n+1,score:m.best};}
  }
  return ctx.json({day:day,top:top,me:me,total:tot.n});
}
