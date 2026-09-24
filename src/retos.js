/* ===========================================================
   AXIOMA · Retos y sudoku en pareja (API)
   Todo requiere sesión iniciada: para un concurso con premio hace
   falta saber quién es quién.

   Retos
     POST /api/events                     crea un reto (con sus tableros)
     GET  /api/events                     mis retos
     GET  /api/events/:code               ficha, ronda de hoy y clasificación
     POST /api/events/:code/join          { team }
     GET  /api/events/:code/round/:r      tablero de la ronda (anota la hora)
     POST /api/events/:code/result        { round, grid, seconds, errors, hints }
   Pareja
     POST /api/coop                       { level, puzzle, solution, event_code, round }
     POST /api/coop/:code/join
     GET  /api/coop/:code?after=N         estado y jugadas nuevas
     POST /api/coop/:code/move            { k, n }
   =========================================================== */

import "../public/rapidos-motor.js";
var R=globalThis.AxRapidos;

var PEN_ERROR=30, PEN_PISTA=60, FALLOS_GRATIS=2, MAX_PISTAS=3, ULTRA=5;
var MAX_RONDAS=31, MAX_MIEMBROS=200;
var ALFABETO="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   /* sin 0/O ni 1/I */

export async function handleRetos(req,env,url,path,ctx){
  var json=ctx.json, user=ctx.user;
  if(!env.DB)return json({error:"not_configured"},null,503);
  if(!user)return json({error:"unauthorized"},null,401);
  var m;
  try{
    if(path==="/events"&&req.method==="POST")return await creaReto(req,env,user,ctx);
    if(path==="/events"&&req.method==="GET")return await misRetos(env,user,ctx);
    if((m=path.match(/^\/events\/([A-Z0-9]{6})$/))&&req.method==="GET")return await fichaReto(env,user,m[1],ctx);
    if((m=path.match(/^\/events\/([A-Z0-9]{6})\/join$/))&&req.method==="POST")return await unirse(req,env,user,m[1],ctx);
    if((m=path.match(/^\/events\/([A-Z0-9]{6})\/round\/(\d+)$/))&&req.method==="GET")return await tableroRonda(env,user,m[1],+m[2],ctx);
    if((m=path.match(/^\/events\/([A-Z0-9]{6})\/result$/))&&req.method==="POST")return await resultadoReto(req,env,user,m[1],ctx);
    if(path==="/coop"&&req.method==="POST")return await creaSala(req,env,user,ctx);
    if((m=path.match(/^\/coop\/([A-Z0-9]{6})\/join$/))&&req.method==="POST")return await entraSala(env,user,m[1],ctx);
    if((m=path.match(/^\/coop\/([A-Z0-9]{6})$/))&&req.method==="GET")return await estadoSala(env,user,m[1],url,ctx);
    if((m=path.match(/^\/coop\/([A-Z0-9]{6})\/move$/))&&req.method==="POST")return await jugadaSala(req,env,user,m[1],ctx);
  }catch(e){
    /* tablas sin crear: se avisa sin tumbar el resto de la API */
    if(/no such table/i.test(String(e&&e.message)))return json({error:"not_configured"},null,503);
    throw e;
  }
  return json({error:"not_found"},null,404);
}

/* ---------- utilidades ---------- */
function ahora(){return Math.floor(Date.now()/1000);}
function codigo(){
  var b=new Uint8Array(6); crypto.getRandomValues(b);
  var s=""; for(var i=0;i<6;i++)s+=ALFABETO[b[i]%ALFABETO.length];
  return s;
}
function rejillaValida(s){return typeof s==="string"&&/^[0-9]{81}$/.test(s);}
function solucionValida(s){
  if(!/^[1-9]{81}$/.test(s))return false;
  for(var u=0;u<27;u++){
    var vis=0;
    for(var i=0;i<9;i++){
      var k = u<9 ? u*9+i : u<18 ? i*9+(u-9) : (((u-18)/3|0)*3+(i/3|0))*9+((u-18)%3)*3+i%3;
      var bit=1<<(s.charCodeAt(k)-49);
      if(vis&bit)return false; vis|=bit;
    }
  }
  return true;
}
function tableroCoherente(p,s){
  for(var k=0;k<81;k++)if(p[k]!=="0"&&p[k]!==s[k])return false;
  return true;
}
function penalizacion(errors,hints){return Math.max(0,errors-FALLOS_GRATIS)*PEN_ERROR+hints*PEN_PISTA;}
function limpia(s,max){return String(s==null?"":s).replace(/\s+/g," ").trim().slice(0,max);}

/* ---------- retos ---------- */
var JUEGOS=["sudoku","trivia","memoria","calculo","reflejos","numeros"];
var TOL=1500;   /* ms de margen entre el reloj del servidor y el del jugador */

function estadoReto(ev,hoy){
  var fin=ev.start_day+ev.days-1;
  return hoy<ev.start_day?"pronto":hoy>fin?"terminado":"activo";
}
/* Ronda que le toca a un jugador: con ritmo diario, la del día; con
   ritmo seguido, la primera que no haya jugado. rounds+1 = ya acabó. */
function rondaPara(ev,hoy,jugadas){
  if(estadoReto(ev,hoy)!=="activo")return 0;
  if(ev.pace==="diario")return hoy-ev.start_day+1;
  for(var r=1;r<=ev.rounds;r++)if(jugadas.indexOf(r)<0)return r;
  return ev.rounds+1;
}
function semillaRonda(ev,r){return R.semilla(ev.seed+":"+r);}

async function creaReto(req,env,user,ctx){
  var b=await req.json().catch(function(){return {}});
  var name=limpia(b.name,60), prize=limpia(b.prize,200), forfeit=limpia(b.forfeit,200);
  var game=JUEGOS.indexOf(b.game)>=0?b.game:"sudoku";
  var level=game==="sudoku"?parseInt(b.level,10):0;
  var rounds=parseInt(b.rounds,10), start=parseInt(b.start_day,10);
  var mode=(b.mode==="equipo"||b.mode==="pareja")?b.mode:"solo";
  var teamSize=mode==="solo"?1:mode==="pareja"?2:Math.min(10,Math.max(2,parseInt(b.team_size,10)||3));
  var pace=(game==="sudoku"&&b.pace!=="seguido")?"diario":"seguido";
  var days=pace==="diario"?rounds:Math.min(31,Math.max(1,parseInt(b.days,10)||1));
  var hoy=ctx.dayNumber();
  if(name.length<2)return ctx.json({error:"bad_name"},null,400);
  if(game==="sudoku"&&!(level>=1&&level<=5))return ctx.json({error:"bad_level"},null,400);
  if(mode==="pareja"&&(game!=="sudoku"||level===ULTRA))return ctx.json({error:"bad_level"},null,400);
  if(!(rounds>=1&&rounds<=MAX_RONDAS))return ctx.json({error:"bad_rounds"},null,400);
  if(!(start>=hoy&&start<=hoy+60))return ctx.json({error:"bad_start"},null,400);
  var boards=Array.isArray(b.boards)?b.boards:[], i;
  if(game==="sudoku"){
    if(boards.length!==rounds)return ctx.json({error:"bad_boards"},null,400);
    for(i=0;i<rounds;i++){
      var t=boards[i]||{};
      if(!rejillaValida(t.puzzle)||!solucionValida(t.solution)||!tableroCoherente(t.puzzle,t.solution))
        return ctx.json({error:"bad_boards"},null,400);
    }
  }
  var code, intentos=0;
  do{ code=codigo(); intentos++;
      var choque=await env.DB.prepare("SELECT 1 FROM events WHERE code=?").bind(code).first();
  }while(choque&&intentos<5);
  var now=ahora(), seed=crypto.getRandomValues(new Uint32Array(1))[0];
  var ops=[env.DB.prepare(
    "INSERT INTO events(code,name,owner_id,game,level,mode,team_size,pace,start_day,rounds,days,prize,forfeit,seed,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
  ).bind(code,name,user.id,game,level,mode,teamSize,pace,start,rounds,days,prize,forfeit,seed,now)];
  if(game==="sudoku")for(i=0;i<rounds;i++)ops.push(env.DB.prepare(
    "INSERT INTO event_rounds(event_code,round,puzzle,solution) VALUES(?,?,?,?)"
  ).bind(code,i+1,boards[i].puzzle,boards[i].solution));
  ops.push(env.DB.prepare(
    "INSERT INTO event_members(event_code,user_id,team,joined_at) VALUES(?,?,?,?)"
  ).bind(code,user.id,null,now));
  await env.DB.batch(ops);
  return ctx.json({ok:true,code:code});
}

function publico(ev,user){
  return {code:ev.code,name:ev.name,game:ev.game,level:ev.level,mode:ev.mode,team_size:ev.team_size,pace:ev.pace,
          start_day:ev.start_day,rounds:ev.rounds,days:ev.days,prize:ev.prize,forfeit:ev.forfeit,owner:ev.owner_id===user.id};
}
async function rondasJugadas(env,code,userId){
  var r=await env.DB.prepare("SELECT round FROM event_results WHERE event_code=? AND user_id=?").bind(code,userId).all();
  return (r.results||[]).map(function(x){return x.round;});
}

async function misRetos(env,user,ctx){
  var hoy=ctx.dayNumber();
  var rows=await env.DB.prepare(
    "SELECT e.*,m.team AS my_team,"+
    " (SELECT COUNT(*) FROM event_members x WHERE x.event_code=e.code) AS members "+
    "FROM events e JOIN event_members m ON m.event_code=e.code AND m.user_id=? "+
    "ORDER BY e.start_day DESC, e.created_at DESC LIMIT 50"
  ).bind(user.id).all();
  var mias=await env.DB.prepare("SELECT event_code,round FROM event_results WHERE user_id=?").bind(user.id).all();
  var jug={}; (mias.results||[]).forEach(function(x){(jug[x.event_code]=jug[x.event_code]||[]).push(x.round);});
  var lista=(rows.results||[]).map(function(e){
    var o=publico(e,user), j=jug[e.code]||[];
    o.team=e.my_team; o.members=e.members; o.played=j.length;
    o.state=estadoReto(e,hoy); o.today_round=rondaPara(e,hoy,j);
    return o;
  });
  return ctx.json({events:lista,day:hoy});
}

async function cargaReto(env,code){
  return env.DB.prepare("SELECT * FROM events WHERE code=?").bind(code).first();
}
async function miembro(env,code,userId){
  return env.DB.prepare("SELECT team FROM event_members WHERE event_code=? AND user_id=?").bind(code,userId).first();
}

async function fichaReto(env,user,code,ctx){
  var ev=await cargaReto(env,code);
  if(!ev)return ctx.json({error:"not_found"},null,404);
  var hoy=ctx.dayNumber();
  var yo=await miembro(env,code,user.id);
  var mem=await env.DB.prepare(
    "SELECT u.id,u.name,u.picture,m.team FROM event_members m JOIN users u ON u.id=m.user_id WHERE m.event_code=? ORDER BY m.joined_at"
  ).bind(code).all();
  var res=await env.DB.prepare(
    "SELECT user_id,round,team,seconds,score,errors,hints FROM event_results WHERE event_code=?"
  ).bind(code).all();
  var dueño=await env.DB.prepare("SELECT name FROM users WHERE id=?").bind(ev.owner_id).first();
  var todos=res.results||[];
  var mias=todos.filter(function(x){return x.user_id===user.id;}).map(function(x){return x.round;});
  var r=rondaPara(ev,hoy,mias);
  var clas=clasificacion(ev,mem.results||[],todos,user.id);
  var mio=todos.filter(function(x){return x.user_id===user.id&&x.round===r;})[0]||null;
  var o=publico(ev,user);
  o.owner_name=dueño?dueño.name:""; o.day=hoy; o.state=estadoReto(ev,hoy);
  o.today_round=r; o.my_played=mias.length; o.my_today=mio;
  o.member=!!yo; o.team=yo?yo.team:null; o.members=mem.results||[];
  o.players=clas.players; o.teams=clas.teams;
  return ctx.json(o);
}

/* Clasificación: primero quien lleva más rondas; a igualdad, según el
   juego: más puntos, menos milisegundos o menos tiempo. Un equipo
   completa una ronda cuando la han terminado todos sus miembros, y su
   marca en ella es la media. */
function clasificacion(ev,members,results,me){
  var porUsuario={}, orden=(R.JUEGOS[ev.game]||{}).orden||"tiempo";
  function cmp(a,b){
    return b.rounds-a.rounds || (orden==="puntos"?b.score-a.score:orden==="menos"?a.score-b.score:0) ||
           a.seconds-b.seconds || String(a.name||a.team).localeCompare(String(b.name||b.team));
  }
  members.forEach(function(m){porUsuario[m.id]={id:m.id,name:m.name,picture:m.picture,team:m.team,rounds:0,seconds:0,score:0,errors:0,hints:0,per:{}};});
  results.forEach(function(r){
    var u=porUsuario[r.user_id]; if(!u)return;
    u.rounds++; u.seconds+=r.seconds; u.score+=r.score||0; u.errors+=r.errors; u.hints+=r.hints;
    u.per[r.round]={seconds:r.seconds,score:r.score||0};
    if(r.team&&!u.team)u.team=r.team;
  });
  var players=Object.keys(porUsuario).map(function(k){return porUsuario[k];});
  players.sort(cmp);
  players.forEach(function(p,i){p.rank=i+1;p.me=(p.id===me);});

  var teams=null;
  if(ev.mode!=="solo"){
    var porEquipo={};
    players.forEach(function(u){
      if(!u.team)return;
      var t=porEquipo[u.team]||(porEquipo[u.team]={team:u.team,members:[],rounds:0,seconds:0,score:0});
      t.members.push(u);
    });
    teams=Object.keys(porEquipo).map(function(k){
      var t=porEquipo[k];
      for(var r=1;r<=ev.rounds;r++){
        var marcas=t.members.map(function(u){return u.per[r];});
        if(marcas.every(function(x){return x!==undefined;})){
          t.rounds++;
          t.seconds+=Math.round(marcas.reduce(function(a,x){return a+x.seconds;},0)/marcas.length);
          t.score+=Math.round(marcas.reduce(function(a,x){return a+x.score;},0)/marcas.length);
        }
      }
      return {team:t.team,size:t.members.length,names:t.members.map(function(u){return u.name;}),
              rounds:t.rounds,seconds:t.seconds,score:t.score,me:t.members.some(function(u){return u.me;})};
    });
    teams.sort(cmp);
    teams.forEach(function(t,i){t.rank=i+1;});
  }
  players.forEach(function(p){delete p.id;delete p.per;});
  return {players:players,teams:teams};
}

async function unirse(req,env,user,code,ctx){
  var ev=await cargaReto(env,code);
  if(!ev)return ctx.json({error:"not_found"},null,404);
  var b=await req.json().catch(function(){return {}});
  var team=ev.mode==="equipo"?limpia(b.team,30):null;
  if(ev.mode==="equipo"&&team.length<2)return ctx.json({error:"bad_team"},null,400);
  if(estadoReto(ev,ctx.dayNumber())==="terminado")return ctx.json({error:"finished"},null,400);
  var n=await env.DB.prepare("SELECT COUNT(*) AS n FROM event_members WHERE event_code=?").bind(code).first();
  var ya=await miembro(env,code,user.id);
  if(!ya&&n.n>=MAX_MIEMBROS)return ctx.json({error:"full"},null,400);
  if(ev.mode==="equipo"){
    var cuantos=await env.DB.prepare("SELECT COUNT(*) AS n FROM event_members WHERE event_code=? AND team=? AND user_id<>?")
      .bind(code,team,user.id).first();
    if(cuantos.n>=ev.team_size)return ctx.json({error:"team_full"},null,400);
  }
  await env.DB.prepare(
    "INSERT INTO event_members(event_code,user_id,team,joined_at) VALUES(?,?,?,?) "+
    "ON CONFLICT(event_code,user_id) DO UPDATE SET team=COALESCE(excluded.team,event_members.team)"
  ).bind(code,user.id,team,ahora()).run();
  return ctx.json({ok:true});
}

/* Abre una ronda: devuelve el tablero o los datos del juego y anota la
   hora (en milisegundos) la primera vez. El tiempo de la ronda lo mide
   el servidor desde ese momento. */
async function tableroRonda(env,user,code,r,ctx){
  var ev=await cargaReto(env,code);
  if(!ev)return ctx.json({error:"not_found"},null,404);
  if(!await miembro(env,code,user.id))return ctx.json({error:"not_member"},null,403);
  var jug=await rondasJugadas(env,code,user.id);
  var toca=rondaPara(ev,ctx.dayNumber(),jug);
  var hecho=await env.DB.prepare("SELECT seconds,score,errors,hints FROM event_results WHERE event_code=? AND round=? AND user_id=?")
    .bind(code,r,user.id).first();
  if(r!==toca&&!hecho)return ctx.json({error:"wrong_round",today_round:toca},null,400);
  var out={round:r,game:ev.game,level:ev.level,done:hecho||null};
  if(ev.game==="sudoku"){
    var t=await env.DB.prepare("SELECT puzzle,solution FROM event_rounds WHERE event_code=? AND round=?").bind(code,r).first();
    if(!t)return ctx.json({error:"not_found"},null,404);
    out.puzzle=t.puzzle; out.solution=t.solution;
  }else{
    out.datos=hecho?null:R.genera(ev.game,semillaRonda(ev,r));
  }
  if(!hecho)await env.DB.prepare(
    "INSERT INTO event_starts(event_code,round,user_id,started_at) VALUES(?,?,?,?) ON CONFLICT DO NOTHING"
  ).bind(code,r,user.id,Date.now()).run();
  return ctx.json(out);
}

async function resultadoReto(req,env,user,code,ctx){
  var ev=await cargaReto(env,code);
  if(!ev)return ctx.json({error:"not_found"},null,404);
  if(ev.mode==="pareja")return ctx.json({error:"use_coop"},null,400);
  var yo=await miembro(env,code,user.id);
  if(!yo)return ctx.json({error:"not_member"},null,403);
  var b=await req.json().catch(function(){return {}});
  var r=parseInt(b.round,10);
  var jug=await rondasJugadas(env,code,user.id);
  if(jug.indexOf(r)>=0)return ctx.json({ok:true,already:true});
  if(r!==rondaPara(ev,ctx.dayNumber(),jug))return ctx.json({error:"wrong_round"},null,400);
  var ini=await env.DB.prepare("SELECT started_at FROM event_starts WHERE event_code=? AND round=? AND user_id=?").bind(code,r,user.id).first();
  if(!ini)return ctx.json({error:"not_started"},null,400);
  var realMs=Date.now()-ini.started_at, seconds, score=0, errors=0, hints=0;

  if(ev.game==="sudoku"){
    errors=parseInt(b.errors,10)||0; hints=parseInt(b.hints,10)||0;
    if(!rejillaValida(b.grid))return ctx.json({error:"bad_grid"},null,400);
    if(hints<0||hints>MAX_PISTAS||errors<0)return ctx.json({error:"bad_hints"},null,400);
    if(ev.level===ULTRA&&(hints||errors))return ctx.json({error:"bad_hints"},null,400);
    var t=await env.DB.prepare("SELECT solution FROM event_rounds WHERE event_code=? AND round=?").bind(code,r).first();
    if(!t||b.grid!==t.solution)return ctx.json({error:"wrong_solution"},null,400);
    /* el tiempo lo pone el servidor: desde que se abrió el tablero, más penalizaciones */
    seconds=Math.max(1,Math.round(realMs/1000))+penalizacion(errors,hints);
  }else{
    var datos=R.genera(ev.game,semillaRonda(ev,r));
    var res=R.evalua(ev.game,datos,b.envio);
    if(!res)return ctx.json({error:"bad_result"},null,400);
    /* lo que declara el jugador no puede ser más rápido que el reloj del servidor */
    var declarado=res.seconds*1000, margen={trivia:15000,memoria:5000,calculo:0,reflejos:3000,numeros:0}[ev.game];
    if(ev.game==="numeros"){
      if(res.score-(parseInt(b.envio.f,10)||0)*1000 < realMs-TOL-margen)return ctx.json({error:"bad_time"},null,400);
    }else if(ev.game==="calculo"){
      if(realMs<45000-TOL)return ctx.json({error:"bad_time"},null,400);
    }else if(declarado<realMs-TOL-margen)return ctx.json({error:"bad_time"},null,400);
    seconds=res.seconds; score=res.score;
  }
  await env.DB.prepare(
    "INSERT INTO event_results(event_code,round,user_id,team,seconds,score,errors,hints,created_at) VALUES(?,?,?,?,?,?,?,?,?)"
  ).bind(code,r,user.id,yo.team,seconds,score,errors,hints,ahora()).run();
  return ctx.json({ok:true,seconds:seconds,score:score,formato:R.formato(ev.game,score,seconds)});
}

/* ---------- sudoku en pareja ---------- */
async function creaSala(req,env,user,ctx){
  var b=await req.json().catch(function(){return {}});
  var level=parseInt(b.level,10);
  var eventCode=null, round=null;
  if(!b.event_code){
    if(!(level>=1&&level<=4))return ctx.json({error:"bad_level"},null,400);
    if(!rejillaValida(b.puzzle)||!solucionValida(b.solution)||!tableroCoherente(b.puzzle,b.solution))
      return ctx.json({error:"bad_boards"},null,400);
  }else{
    var ev=await cargaReto(env,String(b.event_code));
    if(!ev||ev.mode!=="pareja")return ctx.json({error:"bad_event"},null,400);
    if(!await miembro(env,ev.code,user.id))return ctx.json({error:"not_member"},null,403);
    var jugadas=await rondasJugadas(env,ev.code,user.id);
    round=rondaPara(ev,ctx.dayNumber(),jugadas);
    if(round<1||round>ev.rounds)return ctx.json({error:round>ev.rounds?"already_played":"wrong_round"},null,400);
    if(jugadas.indexOf(round)>=0)return ctx.json({error:"already_played"},null,400);
    /* en un reto el tablero es el de la ronda, no el que trae el cliente */
    var t=await env.DB.prepare("SELECT puzzle,solution FROM event_rounds WHERE event_code=? AND round=?").bind(ev.code,round).first();
    b.puzzle=t.puzzle; b.solution=t.solution; level=ev.level; eventCode=ev.code;
  }
  var code=codigo(), now=ahora();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO coop(code,level,puzzle,solution,owner_id,event_code,round,created_at) VALUES(?,?,?,?,?,?,?,?)")
      .bind(code,level,b.puzzle,b.solution,user.id,eventCode,round,now),
    env.DB.prepare("INSERT INTO coop_members(code,user_id,joined_at) VALUES(?,?,?)").bind(code,user.id,now)
  ]);
  return ctx.json({ok:true,code:code});
}

async function cargaSala(env,code){return env.DB.prepare("SELECT * FROM coop WHERE code=?").bind(code).first();}

async function entraSala(env,user,code,ctx){
  var s=await cargaSala(env,code);
  if(!s)return ctx.json({error:"not_found"},null,404);
  if(s.finished_at)return ctx.json({error:"finished"},null,400);
  var n=await env.DB.prepare("SELECT COUNT(*) AS n FROM coop_members WHERE code=?").bind(code).first();
  var ya=await env.DB.prepare("SELECT 1 FROM coop_members WHERE code=? AND user_id=?").bind(code,user.id).first();
  if(!ya&&n.n>=2)return ctx.json({error:"full"},null,400);
  if(s.event_code&&!ya){
    if(!await miembro(env,s.event_code,user.id))return ctx.json({error:"not_member"},null,403);
    var hecho=await env.DB.prepare("SELECT 1 FROM event_results WHERE event_code=? AND round=? AND user_id=?").bind(s.event_code,s.round,user.id).first();
    if(hecho)return ctx.json({error:"already_played"},null,400);
  }
  if(!ya)await env.DB.prepare("INSERT INTO coop_members(code,user_id,joined_at) VALUES(?,?,?)").bind(code,user.id,ahora()).run();
  return ctx.json({ok:true});
}

async function estadoSala(env,user,code,url,ctx){
  var s=await cargaSala(env,code);
  if(!s)return ctx.json({error:"not_found"},null,404);
  var yo=await env.DB.prepare("SELECT 1 FROM coop_members WHERE code=? AND user_id=?").bind(code,user.id).first();
  if(!yo)return ctx.json({error:"not_member"},null,403);
  var after=parseInt(url.searchParams.get("after"),10)||0;
  var mem=await env.DB.prepare(
    "SELECT u.id,u.name,u.picture FROM coop_members m JOIN users u ON u.id=m.user_id WHERE m.code=? ORDER BY m.joined_at"
  ).bind(code).all();
  var mv=await env.DB.prepare("SELECT seq,user_id,k,v FROM coop_moves WHERE code=? AND seq>? ORDER BY seq").bind(code,after).all();
  return ctx.json({
    code:s.code,level:s.level,puzzle:s.puzzle,event_code:s.event_code,round:s.round,
    members:(mem.results||[]).map(function(u){return {id:u.id,name:u.name,picture:u.picture,me:u.id===user.id};}),
    moves:mv.results||[],errors:s.errors,started_at:s.started_at,finished_at:s.finished_at,now:ahora(),
    seconds:s.finished_at?tiempoSala(s):null
  });
}
function tiempoSala(s){return (s.finished_at-s.started_at)+penalizacion(s.errors,0);}

async function jugadaSala(req,env,user,code,ctx){
  var s=await cargaSala(env,code);
  if(!s)return ctx.json({error:"not_found"},null,404);
  if(s.finished_at)return ctx.json({error:"finished"},null,400);
  var yo=await env.DB.prepare("SELECT 1 FROM coop_members WHERE code=? AND user_id=?").bind(code,user.id).first();
  if(!yo)return ctx.json({error:"not_member"},null,403);
  var b=await req.json().catch(function(){return {}});
  var k=parseInt(b.k,10), n=parseInt(b.n,10);
  if(!(k>=0&&k<81)||!(n>=1&&n<=9))return ctx.json({error:"bad_move"},null,400);
  if(s.puzzle[k]!=="0")return ctx.json({error:"fixed"},null,400);
  var now=ahora();
  if(!s.started_at){await env.DB.prepare("UPDATE coop SET started_at=? WHERE code=? AND started_at IS NULL").bind(now,code).run();s.started_at=now;}
  if(String(n)!==s.solution[k]){
    await env.DB.prepare("UPDATE coop SET errors=errors+1 WHERE code=?").bind(code).run();
    return ctx.json({ok:false,wrong:true,errors:s.errors+1});
  }
  var ya=await env.DB.prepare("SELECT seq FROM coop_moves WHERE code=? AND k=?").bind(code,k).first();
  if(ya)return ctx.json({ok:true,dup:true});
  var ult=await env.DB.prepare("SELECT COALESCE(MAX(seq),0) AS s FROM coop_moves WHERE code=?").bind(code).first();
  await env.DB.prepare("INSERT INTO coop_moves(code,seq,user_id,k,v,created_at) VALUES(?,?,?,?,?,?)")
    .bind(code,ult.s+1,user.id,k,n,now).run();
  /* ¿completa? tantas jugadas como huecos */
  var huecos=(s.puzzle.match(/0/g)||[]).length;
  var hechas=await env.DB.prepare("SELECT COUNT(*) AS n FROM coop_moves WHERE code=?").bind(code).first();
  var out={ok:true,seq:ult.s+1};
  if(hechas.n>=huecos){
    await env.DB.prepare("UPDATE coop SET finished_at=? WHERE code=? AND finished_at IS NULL").bind(now,code).run();
    s.finished_at=now;
    out.done=true; out.seconds=tiempoSala(s);
    if(s.event_code)await resultadoPareja(env,s,ctx);
  }
  return out.done?ctx.json(out):ctx.json(out);
}

/* la sala de un reto vale como resultado de la pareja: los dos reciben
   el mismo tiempo y quedan en el mismo equipo */
async function resultadoPareja(env,s,ctx){
  var mem=await env.DB.prepare("SELECT user_id FROM coop_members WHERE code=? ORDER BY user_id").bind(s.code).all();
  var ids=(mem.results||[]).map(function(m){return m.user_id;});
  if(ids.length<2)return;   /* en un reto hace falta ser dos */
  var equipo=await env.DB.prepare(
    "SELECT u.name FROM users u WHERE u.id IN (?,?) ORDER BY u.name"
  ).bind(ids[0],ids[1]).all();
  var nombre=(equipo.results||[]).map(function(u){return String(u.name).split(" ")[0];}).join(" y ");
  var seg=tiempoSala(s), now=ahora(), ops=[];
  ids.forEach(function(id){
    ops.push(env.DB.prepare(
      "INSERT INTO event_results(event_code,round,user_id,team,seconds,score,errors,hints,created_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING"
    ).bind(s.event_code,s.round,id,nombre,seg,0,s.errors,0,now));
    ops.push(env.DB.prepare("UPDATE event_members SET team=? WHERE event_code=? AND user_id=?").bind(nombre,s.event_code,id));
  });
  await env.DB.batch(ops);
}
