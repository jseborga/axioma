/* ===========================================================
   THE FINAL TEST · perfiles, grupos de amigos y actividad (API)

   Quien entra con Google es «jugador»: juega, guarda sus partidas,
   hace retos y grupos de amigos. Las secciones de gestión se abren
   con un perfil que da la administración de la plataforma
   (PLATFORM_ADMINS), o al pertenecer a una institución o empresa:
     educativo → registrar instituciones educativas (cursos, exámenes)
     empresas  → registrar empresas, comunidades y eventos; concursos públicos

     GET  /api/acceso                       qué ve y qué puede crear quien pregunta
     POST /api/acceso/solicitud             { perfil, nota } pedir un perfil
     GET  /api/admin/perfiles               perfiles dados y solicitudes (administración)
     POST /api/admin/perfiles               { email, perfil, accion: otorgar|quitar|rechazar, nota }

     GET  /api/grupos                       mis grupos
     POST /api/grupos                       { nombre } crear (devuelve el código)
     GET  /api/grupos/:code                 ficha: miembros, ranking de la semana (Axioma, sudoku, granja, en vivo) y retos recientes
     POST /api/grupos/:code                 { nombre } renombrar (quien lo creó)
     POST /api/grupos/:code/unirme | salir | borrar
     POST /api/grupos/:code/quitar          { user_id } (quien lo creó)

     GET  /api/actividad                    mis partidas guardadas
   =========================================================== */
import { esAdminPlataforma, esInvitado, tienePerfil } from "./aula.js";

export var PERFILES=["educativo","empresas"];
var ALFABETO="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var MAX_GRUPOS=20, MAX_MIEMBROS=50, DIA=86400000;

function codigo(n){var b=new Uint8Array(n);crypto.getRandomValues(b);var s="";for(var i=0;i<n;i++)s+=ALFABETO[b[i]%ALFABETO.length];return s;}
function limpia(s,max){return String(s==null?"":s).replace(/\s+/g," ").trim().slice(0,max);}
function correo(e){e=String(e||"").trim().toLowerCase();return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(e)?e:"";}
function dia(){return Math.floor((Date.now()-Date.UTC(2026,0,1))/DIA)+1;}

export async function handlePerfiles(req,env,url,path,ctx){
  var json=ctx.json, user=ctx.user, m;
  if(!env.DB)return json({error:"not_configured"},null,503);
  if(path==="/acceso"&&req.method==="GET")return await acceso(env,user,json);
  if(!user)return json({error:"unauthorized"},null,401);
  var b=req.method==="POST"?await req.json().catch(function(){return {};}):null;
  try{
    if(path==="/acceso/solicitud"&&req.method==="POST")return await solicita(env,user,b,json);
    if(path==="/admin/perfiles"){
      if(!esAdminPlataforma(env,user))return json({error:"forbidden"},null,403);
      return req.method==="GET"?await listaPerfiles(env,json):await cambiaPerfil(env,user,b,json);
    }
    if(path==="/actividad"&&req.method==="GET")return await actividad(env,user,json);
    if(esInvitado(user))return json({error:"google_required"},null,403);
    if(path==="/grupos"&&req.method==="GET")return await misGrupos(env,user,json);
    if(path==="/grupos"&&req.method==="POST")return await creaGrupo(env,user,b,json);
    if((m=path.match(/^\/grupos\/([A-Z0-9]{6})$/))&&req.method==="GET")return await fichaGrupo(env,user,m[1],json);
    if((m=path.match(/^\/grupos\/([A-Z0-9]{6})$/))&&req.method==="POST")return await renombra(env,user,m[1],b,json);
    if((m=path.match(/^\/grupos\/([A-Z0-9]{6})\/(unirme|salir|borrar|quitar)$/))&&req.method==="POST")return await accionGrupo(env,user,m[1],m[2],b,json);
  }catch(e){
    if(/no such table: (perfiles_plataforma|grupos|grupo_miembros)/i.test(String(e&&e.message)))return json({error:"perfiles_not_configured"},null,503);
    throw e;
  }
  return json({error:"not_found"},null,404);
}

/* ---------- acceso ---------- */
async function acceso(env,user,json){
  var nada={user:false,admin:false,perfiles:{educativo:false,empresas:false},solicitudes:[],
            ver:{educativo:false,empresas:false},crear:{educativo:false,empresas:false}};
  if(!user)return json(nada);
  if(esInvitado(user)){nada.user=true;nada.invitado=true;return json(nada);}
  var admin=esAdminPlataforma(env,user), abierto=!String(env.PLATFORM_ADMINS||"").trim();
  var per={educativo:false,empresas:false}, sol=[], tabla=true;
  try{
    var r=await env.DB.prepare("SELECT perfil,estado FROM perfiles_plataforma WHERE email=?").bind(String(user.email||"").toLowerCase()).all();
    (r.results||[]).forEach(function(x){ if(x.estado==="activo")per[x.perfil]=true; else if(x.estado==="solicitado")sol.push(x.perfil); });
  }catch(e){tabla=false;}
  var o=await env.DB.prepare(
    "SELECT SUM(o.kind IN ('universidad','instituto','colegio')) AS edu,SUM(o.kind NOT IN ('universidad','instituto','colegio')) AS emp "+
    "FROM org_members m JOIN orgs o ON o.id=m.org_id WHERE m.user_id=? AND m.role IN ('admin','docente','auxiliar')").bind(user.id).first();
  var c=await env.DB.prepare("SELECT COUNT(*) AS n FROM course_members WHERE user_id=?").bind(user.id).first();
  /* sin la tabla de perfiles todavía, todo sigue como antes: cualquiera registra (y queda pendiente) */
  var crea=function(p){return admin||abierto||per[p]||!tabla;};
  return json({user:true,admin:admin,tabla:tabla,perfiles:per,solicitudes:sol,
    ver:{educativo:admin||per.educativo||!tabla||abierto||(o&&o.edu>0)||(c&&c.n>0),empresas:admin||per.empresas||!tabla||abierto||(o&&o.emp>0)},
    gestiona:{educativo:!!(o&&o.edu>0),empresas:!!(o&&o.emp>0)},cursos:c?c.n:0,
    crear:{educativo:crea("educativo"),empresas:crea("empresas")}});
}
async function solicita(env,user,b,json){
  if(esInvitado(user))return json({error:"google_required"},null,403);
  var p=PERFILES.indexOf(b.perfil)>=0?b.perfil:null, nota=limpia(b.nota,300);
  if(!p)return json({error:"bad_perfil"},null,400);
  if(nota.length<3)return json({error:"nota_required"},null,400);
  var email=String(user.email||"").toLowerCase();
  /* si ya lo tiene no se toca; si se rechazó, se puede volver a pedir */
  await env.DB.prepare("INSERT INTO perfiles_plataforma(email,perfil,estado,nota,user_id,otorgado_por,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) "+
    "ON CONFLICT(email,perfil) DO UPDATE SET estado=CASE WHEN perfiles_plataforma.estado='activo' THEN 'activo' ELSE 'solicitado' END,"+
    "nota=CASE WHEN perfiles_plataforma.estado='activo' THEN perfiles_plataforma.nota ELSE excluded.nota END,user_id=excluded.user_id,updated_at=excluded.updated_at")
    .bind(email,p,"solicitado",nota,user.id,null,Date.now(),Date.now()).run();
  return json({ok:true});
}
async function listaPerfiles(env,json){
  var r=await env.DB.prepare(
    "SELECT p.email,p.perfil,p.estado,p.nota,p.created_at,p.updated_at,u.name,u.id AS uid,o.email AS por "+
    "FROM perfiles_plataforma p LEFT JOIN users u ON lower(u.email)=p.email AND substr(u.id,1,2)<>'g_' LEFT JOIN users o ON o.id=p.otorgado_por "+
    "WHERE p.estado IN ('activo','solicitado') ORDER BY p.estado='solicitado' DESC,p.updated_at DESC LIMIT 500").all();
  return json({perfiles:(r.results||[]).map(function(x){return {email:x.email,perfil:x.perfil,estado:x.estado,nota:x.nota||"",
    nombre:x.name||"",registrado:!!x.uid,por:x.por||"",fecha:x.updated_at};})});
}
async function cambiaPerfil(env,admin,b,json){
  var email=correo(b.email), p=PERFILES.indexOf(b.perfil)>=0?b.perfil:null, now=Date.now();
  if(!email)return json({error:"bad_email"},null,400);
  if(!p)return json({error:"bad_perfil"},null,400);
  if(b.accion==="otorgar"){
    var nota=limpia(b.nota,300);
    await env.DB.prepare("INSERT INTO perfiles_plataforma(email,perfil,estado,nota,user_id,otorgado_por,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) "+
      "ON CONFLICT(email,perfil) DO UPDATE SET estado='activo',nota=CASE WHEN excluded.nota<>'' THEN excluded.nota ELSE perfiles_plataforma.nota END,"+
      "otorgado_por=excluded.otorgado_por,updated_at=excluded.updated_at")
      .bind(email,p,"activo",nota,null,admin.id,now,now).run();
    return json({ok:true});
  }
  if(b.accion==="quitar"||b.accion==="rechazar"){
    await env.DB.prepare("UPDATE perfiles_plataforma SET estado=?,otorgado_por=?,updated_at=? WHERE email=? AND perfil=?")
      .bind(b.accion==="quitar"?"retirado":"rechazado",admin.id,now,email,p).run();
    return json({ok:true});
  }
  return json({error:"bad_action"},null,400);
}

/* ---------- grupos de amigos ---------- */
async function misGrupos(env,user,json){
  var r=await env.DB.prepare(
    "SELECT g.code,g.nombre,g.owner_id,g.created_at,(SELECT COUNT(*) FROM grupo_miembros x WHERE x.grupo=g.code) AS n "+
    "FROM grupo_miembros m JOIN grupos g ON g.code=m.grupo WHERE m.user_id=? ORDER BY m.joined_at DESC").bind(user.id).all();
  return json({grupos:(r.results||[]).map(function(g){return {code:g.code,nombre:g.nombre,miembros:g.n,mio:g.owner_id===user.id};})});
}
async function creaGrupo(env,user,b,json){
  var nombre=limpia(b.nombre,50);
  if(nombre.length<2)return json({error:"bad_name"},null,400);
  var n=await env.DB.prepare("SELECT COUNT(*) AS n FROM grupos WHERE owner_id=?").bind(user.id).first();
  if(n.n>=MAX_GRUPOS)return json({error:"too_many"},null,400);
  var code=codigo(6), now=Date.now();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO grupos(code,nombre,owner_id,created_at) VALUES(?,?,?,?)").bind(code,nombre,user.id,now),
    env.DB.prepare("INSERT INTO grupo_miembros(grupo,user_id,joined_at) VALUES(?,?,?)").bind(code,user.id,now)
  ]);
  return json({ok:true,code:code});
}
async function fichaGrupo(env,user,code,json){
  var g=await env.DB.prepare("SELECT * FROM grupos WHERE code=?").bind(code).first();
  if(!g)return json({error:"not_found"},null,404);
  var soy=await env.DB.prepare("SELECT 1 AS x FROM grupo_miembros WHERE grupo=? AND user_id=?").bind(code,user.id).first();
  var cuantos=await env.DB.prepare("SELECT COUNT(*) AS n FROM grupo_miembros WHERE grupo=?").bind(code).first();
  var dueño=await env.DB.prepare("SELECT name FROM users WHERE id=?").bind(g.owner_id).first();
  var out={code:g.code,nombre:g.nombre,miembros:cuantos.n,creador:dueño?dueño.name:"",soy:!!soy,mio:g.owner_id===user.id,max:MAX_MIEMBROS};
  if(!soy)return json(out);
  var hoy=dia(), desde=hoy-6, hace30=Date.now()-30*DIA;
  var r=await env.DB.batch([
    env.DB.prepare("SELECT u.id,u.name,u.picture,m.joined_at FROM grupo_miembros m JOIN users u ON u.id=m.user_id WHERE m.grupo=? ORDER BY m.joined_at").bind(code),
    /* la semana: retos diarios de Axioma resueltos (menos movimientos, mejor) y sudokus del día */
    env.DB.prepare("SELECT s.user_id,COUNT(*) AS dias,SUM(s.moves) AS movs,SUM(s.day=?) AS hoy FROM scores s JOIN grupo_miembros m ON m.user_id=s.user_id AND m.grupo=? WHERE s.day>=? GROUP BY s.user_id").bind(hoy,code,desde),
    env.DB.prepare("SELECT s.user_id,COUNT(*) AS tableros,SUM(s.seconds) AS segs FROM sudoku s JOIN grupo_miembros m ON m.user_id=s.user_id AND m.grupo=? WHERE s.day>=? GROUP BY s.user_id").bind(code,desde),
    env.DB.prepare("SELECT j.user_id,COUNT(*) AS partidas,SUM(j.puesto=1) AS victorias FROM sala_jugadores j JOIN grupo_miembros m ON m.user_id=j.user_id AND m.grupo=? WHERE j.created_at>=? GROUP BY j.user_id").bind(code,Date.now()-7*DIA),
    /* retos en los que está alguien del grupo, del último mes */
    env.DB.prepare("SELECT e.code,e.name,e.game,e.rounds,e.created_at,COUNT(*) AS del_grupo,SUM(em.user_id=?) AS yo "+
      "FROM event_members em JOIN grupo_miembros m ON m.user_id=em.user_id AND m.grupo=? JOIN events e ON e.code=em.event_code "+
      "WHERE e.created_at>=? GROUP BY e.code ORDER BY e.created_at DESC LIMIT 12").bind(user.id,code,Math.floor(hace30/1000))   /* events.created_at va en segundos */
  ]);
  var por={}, filas=function(i){return r[i].results||[];};
  out.personas=filas(0).map(function(u){var x={id:u.id,nombre:u.name,foto:u.picture||"",yo:u.id===user.id,creador:u.id===g.owner_id,
    axioma:0,movs:0,hoy:false,sudoku:0,salas:0,victorias:0}; por[u.id]=x; return x;});
  filas(1).forEach(function(s){var x=por[s.user_id]; if(x){x.axioma=s.dias;x.movs=s.movs;x.hoy=!!s.hoy;}});
  filas(2).forEach(function(s){var x=por[s.user_id]; if(x)x.sudoku=s.tableros;});
  filas(3).forEach(function(s){var x=por[s.user_id]; if(x){x.salas=s.partidas;x.victorias=s.victorias||0;}});
  /* Granja Express del día (si ya está su tabla): días jugados y mejor marca de la semana */
  out.personas.forEach(function(x){x.granja=0;x.granja_mejor=0;});
  try{
    var gj=await env.DB.prepare("SELECT g.user_id,COUNT(*) AS dias,MAX(g.best) AS mejor FROM granja_dia g JOIN grupo_miembros m ON m.user_id=g.user_id AND m.grupo=? WHERE g.day>=? AND g.best IS NOT NULL GROUP BY g.user_id").bind(code,desde).all();
    (gj.results||[]).forEach(function(s){var x=por[s.user_id]; if(x){x.granja=s.dias;x.granja_mejor=s.mejor||0;}});
  }catch(e){}
  /* puntos de la semana: 3 por Axioma diario, 2 por sudoku del día, 2 por granja del día, 1 por partida y 2 más por victoria */
  out.personas.forEach(function(x){x.puntos=x.axioma*3+x.sudoku*2+x.granja*2+x.salas+x.victorias*2;});
  out.ranking=out.personas.slice().sort(function(a,b){return b.puntos-a.puntos||b.axioma-a.axioma||a.movs-b.movs||a.nombre.localeCompare(b.nombre);})
    .map(function(x){return x.id;});
  out.retos=filas(4).map(function(e){return {code:e.code,nombre:e.name,juego:e.game,rondas:e.rounds,del_grupo:e.del_grupo,yo:!!e.yo,creado:e.created_at*1000};});
  return json(out);
}
async function renombra(env,user,code,b,json){
  var g=await env.DB.prepare("SELECT owner_id FROM grupos WHERE code=?").bind(code).first();
  if(!g)return json({error:"not_found"},null,404);
  if(g.owner_id!==user.id)return json({error:"forbidden"},null,403);
  var nombre=limpia(b.nombre,50); if(nombre.length<2)return json({error:"bad_name"},null,400);
  await env.DB.prepare("UPDATE grupos SET nombre=? WHERE code=?").bind(nombre,code).run();
  return json({ok:true});
}
async function accionGrupo(env,user,code,acc,b,json){
  var g=await env.DB.prepare("SELECT owner_id FROM grupos WHERE code=?").bind(code).first();
  if(!g)return json({error:"not_found"},null,404);
  if(acc==="unirme"){
    var n=await env.DB.prepare("SELECT COUNT(*) AS n FROM grupo_miembros WHERE grupo=?").bind(code).first();
    var ya=await env.DB.prepare("SELECT 1 AS x FROM grupo_miembros WHERE grupo=? AND user_id=?").bind(code,user.id).first();
    if(ya)return json({ok:true,already:true});
    if(n.n>=MAX_MIEMBROS)return json({error:"group_full"},null,400);
    await env.DB.prepare("INSERT INTO grupo_miembros(grupo,user_id,joined_at) VALUES(?,?,?)").bind(code,user.id,Date.now()).run();
    return json({ok:true});
  }
  if(acc==="salir"){
    if(g.owner_id===user.id)return json({error:"owner_leaves"},null,400);
    await env.DB.prepare("DELETE FROM grupo_miembros WHERE grupo=? AND user_id=?").bind(code,user.id).run();
    return json({ok:true});
  }
  if(g.owner_id!==user.id)return json({error:"forbidden"},null,403);
  if(acc==="borrar"){
    await env.DB.batch([env.DB.prepare("DELETE FROM grupo_miembros WHERE grupo=?").bind(code),env.DB.prepare("DELETE FROM grupos WHERE code=?").bind(code)]);
    return json({ok:true});
  }
  var uid=String(b.user_id||"");
  if(!uid||uid===user.id)return json({error:"bad_user"},null,400);
  await env.DB.prepare("DELETE FROM grupo_miembros WHERE grupo=? AND user_id=?").bind(code,uid).run();
  return json({ok:true});
}

/* ---------- mis partidas ---------- */
async function actividad(env,user,json){
  var uid=user.id, q=function(sql){var a=[].slice.call(arguments,1),st=env.DB.prepare(sql);return st.bind.apply(st,a);};
  var ops=[
    q("SELECT COUNT(*) AS n,MIN(moves) AS mejor,MAX(day) AS ultimo FROM scores WHERE user_id=?",uid),
    q("SELECT day,moves,hints,seconds FROM scores WHERE user_id=? ORDER BY day DESC LIMIT 10",uid),
    q("SELECT level,COUNT(*) AS n,MIN(seconds) AS mejor FROM sudoku WHERE user_id=? GROUP BY level ORDER BY level",uid),
    q("SELECT day,level,seconds,errors,hints FROM sudoku WHERE user_id=? ORDER BY day DESC,level DESC LIMIT 10",uid),
    q("SELECT e.code,e.name,e.game,e.rounds,e.created_at,(SELECT COUNT(*) FROM event_results r WHERE r.event_code=e.code AND r.user_id=?) AS jugadas,"+
      "(SELECT COUNT(*) FROM event_members x WHERE x.event_code=e.code) AS jugadores "+
      "FROM event_members m JOIN events e ON e.code=m.event_code WHERE m.user_id=? ORDER BY e.created_at DESC LIMIT 20",uid,uid),
    q("SELECT c.code,c.name,e.correct,e.errors,e.finished_at,e.joined_at,c.ends_at,s.kind FROM contest_entries e JOIN contests c ON c.code=e.code "+
      "LEFT JOIN contest_scope s ON s.code=c.code WHERE e.user_id=? ORDER BY e.joined_at DESC LIMIT 20",uid),
    q("SELECT j.code,j.puesto,j.puntos,j.created_at,x.juego,x.titulo,x.jugadores FROM sala_jugadores j LEFT JOIN salas x ON x.code=j.code "+
      "WHERE j.user_id=? ORDER BY j.created_at DESC LIMIT 20",uid)
  ];
  var r=await env.DB.batch(ops), f=function(i){return r[i].results||[];};
  var ax=f(0)[0]||{}, granja=[];
  try{granja=((await env.DB.prepare("SELECT day,best,entregas,nivel,intentos FROM granja_dia WHERE user_id=? AND best IS NOT NULL ORDER BY day DESC LIMIT 10").bind(uid).all()).results)||[];}catch(e){}
  return json({
    axioma:{resueltos:ax.n||0,mejor:ax.mejor,ultimo:ax.ultimo,hoy:dia(),recientes:f(1)},
    sudoku:{niveles:f(2),recientes:f(3)},
    granja:granja.map(function(g){return {dia:g.day,monedas:g.best,entregas:g.entregas,nivel:g.nivel,intentos:g.intentos};}),
    retos:f(4).map(function(e){return {code:e.code,nombre:e.name,juego:e.game,rondas:e.rounds,jugadas:e.jugadas,jugadores:e.jugadores,creado:e.created_at*1000};}),
    concursos:f(5).map(function(c){return {code:c.code,nombre:c.name,aciertos:c.correct,errores:c.errors,terminado:!!c.finished_at,
      fecha:c.joined_at,cierra:c.ends_at,cuestionario:c.kind==="cuestionario"};}),
    salas:f(6).map(function(s){return {code:s.code,juego:s.juego||"",titulo:s.titulo||"",puesto:s.puesto,puntos:s.puntos,jugadores:s.jugadores,fecha:s.created_at};})
  });
}
