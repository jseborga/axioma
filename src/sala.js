/* ===========================================================
   THE FINAL TEST · salas en vivo (API y Durable Object)
   Una sala es una partida en tiempo real: un Durable Object por código
   mantiene abiertas las conexiones (WebSocket con hibernación), guarda
   el estado y aplica las reglas del juego, que son las mismas que usa
   el navegador (public/juegos/). Cada jugador recibe solo su vista: lo
   secreto (dados, cartas, respuestas) no sale del servidor.

     POST /api/salas                 crear { juego, opciones, acceso, org_id, titulo, premio }
     GET  /api/salas                 mis salas recientes
     GET  /api/salas/:code           ficha pública (juego, fase, marca, acceso)
     GET  /api/salas/:code/ws        conexión en vivo (?nombre=&dev= para acceso libre, ?rol=pantalla)
     POST /api/salas/:code/close     cerrarla (anfitrión o plataforma)

   Acceso: «libre» (basta un apodo: juegos entre amigos sin premio),
   «invitados» (Google o teléfono o correo verificado) o «cuenta» (Google).
   Los juegos para adultos exigen edad verificada de 18 o más.

   Mensajes del jugador: {t:"accion",...} · del anfitrión además {t:"empezar"},
   {t:"bot"}, {t:"quitar",id}, {t:"otra"}, {t:"opciones",opciones}.
   Del servidor: {t:"estado", yo, sala, g, ahora} o {t:"error", error}.
   =========================================================== */
import "./juegos.js";
import { perfil, rolOrg, esAdminPlataforma, esInvitado, esAcademica } from "./aula.js";
import { preguntasDeFuente } from "./mispreguntas.js";
var J=globalThis.AxJuegos;

var ALFABETO="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var MAX_ABIERTAS=20, LISTA_MAX=120, LISTA_JUEGO=40, DIFUSION_MS=150, GUARDA_MS=1500, BOT_MS=900, MSG_MAX=4000;
var NOMBRES_BOT=["Ana","Beto","Carla","Dani","Eli","Fede","Gabi","Hugo","Inés","Juan","Lola","Mateo"];

function codigo(){var b=new Uint8Array(6);crypto.getRandomValues(b);var s="";for(var i=0;i<6;i++)s+=ALFABETO[b[i]%ALFABETO.length];return s;}
function azar(){return J.rng(crypto.getRandomValues(new Uint32Array(1))[0]);}
function hex(buf){return Array.prototype.map.call(new Uint8Array(buf),function(b){return ("0"+b.toString(16)).slice(-2);}).join("");}
async function huella(texto){return hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(texto))).slice(0,20);}

/* ===================== API (en el Worker) ===================== */
export async function handleSalas(req,env,url,path,ctx){
  var json=ctx.json, user=ctx.user, m;
  if(!env.DB)return json({error:"not_configured"},null,503);
  if(!env.SALAS)return json({error:"live_unavailable"},null,503);
  try{
    if(path==="/salas"&&req.method==="POST")return await crea(req,env,user,json);
    if(path==="/salas"&&req.method==="GET")return await mias(env,user,json);
    if((m=path.match(/^\/salas\/([A-Z0-9]{6})$/))&&req.method==="GET")return await ficha(env,user,m[1],json);
    if((m=path.match(/^\/salas\/([A-Z0-9]{6})\/ws$/)))return await conecta(req,env,user,m[1],url,json);
    if((m=path.match(/^\/salas\/([A-Z0-9]{6})\/close$/))&&req.method==="POST")return await cierra(env,user,m[1],json);
  }catch(e){
    if(/no such table/i.test(String(e&&e.message)))return json({error:"not_configured"},null,503);
    throw e;
  }
  return json({error:"not_found"},null,404);
}
function stub(env,code){return env.SALAS.get(env.SALAS.idFromName(code));}
async function marcaDe(env,orgId){
  if(!orgId)return null;
  var o=await env.DB.prepare("SELECT name FROM orgs WHERE id=?").bind(orgId).first();
  var b=null; try{b=await env.DB.prepare("SELECT slug,color,logo,tagline FROM org_brand WHERE org_id=?").bind(orgId).first();}catch(e){}
  return {org_id:orgId,name:o?o.name:"",slug:b&&b.slug||"",color:b&&b.color||"",logo:b&&b.logo||"",tagline:b&&b.tagline||""};
}

async function crea(req,env,user,json){
  if(!user)return json({error:"unauthorized"},null,401);
  if(esInvitado(user))return json({error:"google_required"},null,403);
  var pf=await perfil(env,user.id);
  if(!pf.complete)return json({error:"profile_required"},null,403);
  var b=await req.json().catch(function(){return {};});
  var d=J.def(String(b.juego||""));
  if(!d)return json({error:"bad_game"},null,400);
  if(d.adultos&&!(pf.age>=18))return json({error:"adults_only"},null,403);
  var acceso=["libre","invitados","cuenta"].indexOf(b.acceso)>=0?b.acceso:(d.acceso||"libre");
  if(d.adultos&&acceso==="libre")acceso="invitados";          /* hace falta edad verificada */
  var titulo=J.limpia(b.titulo,60), premio=J.limpia(b.premio,120);
  if(premio&&acceso==="libre")acceso="invitados";              /* con premio, nada de apodos sueltos */
  var orgId=null;
  if(b.org_id){
    orgId=String(b.org_id);
    var r=await rolOrg(env,orgId,user.id);
    if(r!=="admin"&&r!=="docente"&&!esAdminPlataforma(env,user))return json({error:"forbidden"},null,403);
    var o=await env.DB.prepare("SELECT status,kind FROM orgs WHERE id=?").bind(orgId).first();
    if(!o||o.status!=="activa")return json({error:"org_pending"},null,403);
    /* los juegos son de empresas, comunidades y amigos: nada en nombre de una institución educativa */
    if(esAcademica(o.kind))return json({error:"edu_no_games"},null,403);
  }
  var now=Date.now();
  var n=await env.DB.prepare("SELECT COUNT(*) AS n FROM salas WHERE host_id=? AND estado<>'terminada' AND created_at>?").bind(user.id,now-86400000).first();
  if(n.n>=MAX_ABIERTAS)return json({error:"too_many"},null,400);
  /* preguntas propias (trivia en vivo): un banco personal ("m<id>") o de una empresa o comunidad ("b<id>");
     los bancos de las instituciones educativas no se usan en juegos */
  var extra={}, fuente=b.opciones&&(b.opciones.fuente||(b.opciones.banco?"b"+(parseInt(b.opciones.banco,10)||0):""));
  if(d.usaBanco&&fuente){
    var pf=await preguntasDeFuente(env,user,fuente);
    if(pf.error)return json({error:pf.error},null,pf.error==="forbidden_bank"?403:400);
    extra.preguntas=pf.preguntas;
  }else if(d.usaBanco){
    /* banco general: se evitan las preguntas que esta institución (o esta persona) usó en los últimos 60 días */
    extra.quien=orgId?"org:"+orgId:"host:"+user.id;
    try{extra.evita=((await env.DB.prepare("SELECT qid FROM preguntas_vistas WHERE quien=? AND visto_at>? ORDER BY visto_at")
      .bind(extra.quien,now-60*86400000).all()).results||[]).map(function(x){return x.qid;});}catch(e){extra.evita=[];}
  }
  var code,choque,i=0;
  do{code=codigo();choque=await env.DB.prepare("SELECT 1 FROM salas WHERE code=?").bind(code).first();i++;}while(choque&&i<5);
  var marca=await marcaDe(env,orgId);
  var ini=await stub(env,code).fetch("https://sala/init",{method:"POST",body:JSON.stringify({
    code:code,juego:d.tipo,opciones:b.opciones||{},extra:extra,acceso:acceso,titulo:titulo,premio:premio,
    host:{id:user.id,nombre:user.name},marca:marca,org_id:orgId,bases:J.limpia(b.bases,600)})});
  if(!ini.ok)return json(await ini.json(),null,ini.status);
  await env.DB.prepare("INSERT INTO salas(code,juego,host_id,org_id,acceso,titulo,premio,estado,jugadores,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)")
    .bind(code,d.tipo,user.id,orgId,acceso,titulo||null,premio||null,"espera",0,now).run();
  return json({ok:true,code:code,acceso:acceso});
}
async function mias(env,user,json){
  if(!user)return json({salas:[]});
  var r=await env.DB.prepare("SELECT code,juego,titulo,estado,jugadores,created_at FROM salas WHERE host_id=? ORDER BY created_at DESC LIMIT 20").bind(user.id).all();
  return json({salas:r.results||[]});
}
async function ficha(env,user,code,json){
  var s=await env.DB.prepare("SELECT * FROM salas WHERE code=?").bind(code).first();
  if(!s)return json({error:"not_found"},null,404);
  var info=await (await stub(env,code).fetch("https://sala/info")).json();
  var d=J.def(s.juego), edadOk=null;
  if(d&&d.adultos&&user){var pf=await perfil(env,user.id); edadOk=pf.age>=18;}   /* para avisar antes de intentar entrar */
  return json({code:code,edad_ok:edadOk,juego:s.juego,nombre:d?d.nombre:s.juego,grupo:d?d.grupo:"",adultos:!!(d&&d.adultos),titulo:s.titulo||"",premio:s.premio||"",
    acceso:s.acceso,estado:info.fase||s.estado,total:info.total||0,marca:info.marca||null,es_host:!!(user&&user.id===s.host_id),
    tarde:!!(d&&d.tarde),bases:info.bases||""});
}
async function cierra(env,user,code,json){
  if(!user)return json({error:"unauthorized"},null,401);
  var s=await env.DB.prepare("SELECT host_id FROM salas WHERE code=?").bind(code).first();
  if(!s)return json({error:"not_found"},null,404);
  if(s.host_id!==user.id&&!esAdminPlataforma(env,user))return json({error:"forbidden"},null,403);
  await stub(env,code).fetch("https://sala/close",{method:"POST"});
  return json({ok:true});
}
/* quién se conecta: la sesión (Google o invitado verificado), un apodo en salas
   libres o la pantalla del proyector; el Durable Object se fía de esta cabecera
   porque solo se le llega a través del Worker */
async function conecta(req,env,user,code,url,json){
  if(req.headers.get("Upgrade")!=="websocket")return json({error:"websocket_required"},null,426);
  var s=await env.DB.prepare("SELECT juego,acceso,estado,org_id FROM salas WHERE code=?").bind(code).first();
  if(!s)return json({error:"not_found"},null,404);
  var d=J.def(s.juego), ident;
  if(url.searchParams.get("rol")==="pantalla"){
    ident={id:"p_"+hex(crypto.getRandomValues(new Uint8Array(6))),nombre:"Pantalla",rol:"pantalla"};
  }else if(user){
    if(s.acceso==="cuenta"&&esInvitado(user))return json({error:"google_required"},null,403);
    var pf=await perfil(env,user.id);
    if(d&&d.adultos&&!(pf.age>=18))return json({error:"adults_only"},null,403);
    ident={id:user.id,nombre:String(user.name||"").split(" ")[0].slice(0,24)||"Jugador",rol:"jugador",invitado:!!user.guest};
    /* sorteo: boletos extra por haber participado en lo de la institución (hasta +5) */
    if(d&&d.tipo==="sorteo"&&s.org_id){
      var a=await env.DB.prepare("SELECT COUNT(DISTINCT e.code) AS n FROM contest_entries e JOIN contest_scope c ON c.code=e.code WHERE c.org_id=? AND e.user_id=?").bind(s.org_id,user.id).first();
      var b=await env.DB.prepare("SELECT COUNT(*) AS n FROM sala_jugadores j JOIN salas x ON x.code=j.code WHERE x.org_id=? AND j.user_id=? AND x.code<>?").bind(s.org_id,user.id,code).first();
      ident.extra={bono:Math.min(5,(a.n||0)+(b.n||0))};
    }
  }else if(s.acceso==="libre"){
    var ap=J.limpia(url.searchParams.get("nombre"),24), dev=String(url.searchParams.get("dev")||"");
    if(ap.length<2)return json({error:"bad_name"},null,400);
    if(!/^[a-z0-9]{16,40}$/.test(dev))return json({error:"bad_device"},null,400);
    ident={id:"a_"+await huella((env.SESSION_SECRET||"")+":"+dev),nombre:ap,rol:"jugador",apodo:true};
  }else return json({error:s.acceso==="cuenta"?"unauthorized":"login_required",acceso:s.acceso},null,401);
  var h=new Headers(req.headers); h.set("X-Ident",JSON.stringify(ident));
  return stub(env,code).fetch(new Request("https://sala/ws",{headers:h}));
}

/* ===================== Durable Object ===================== */
export class Sala{
  constructor(ctx,env){
    this.ctx=ctx; this.env=env; this.E=null; this.ultimo=new Map(); this.tDif=null; this.tGuarda=null;
    ctx.blockConcurrencyWhile(async()=>{ this.E=(await ctx.storage.get("E"))||null; });
    /* el latido de los teléfonos se contesta sin despertar a la sala */
    try{ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('{"t":"ping"}','{"t":"pong"}'));}catch(e){}
  }
  async fetch(req){
    var u=new URL(req.url);
    if(u.pathname==="/init")return this.init(await req.json());
    if(u.pathname==="/info"){var E=this.E;
      return Response.json(E?{fase:E.fase,total:E.jugadores.filter(function(j){return !j.bot;}).length,juego:E.juego,marca:E.marca,bases:E.bases}:{});}
    if(u.pathname==="/close"){ if(this.E){this.E.fase="cerrada";await this.guardaYa();this.difundeYa();
      this.ctx.getWebSockets().forEach(function(ws){try{ws.close(1000,"cerrada");}catch(e){}});} return Response.json({ok:true}); }
    if(u.pathname==="/ws")return this.abre(req);
    return new Response("no",{status:404});
  }
  async init(b){
    if(this.E)return Response.json({error:"exists"},{status:409});
    var d=J.def(b.juego); if(!d)return Response.json({error:"bad_game"},{status:400});
    var E={code:b.code,juego:b.juego,host:b.host.id,hostNombre:b.host.nombre,acceso:b.acceso,titulo:b.titulo,premio:b.premio,
      marca:b.marca,org_id:b.org_id,bases:b.bases||"",fase:"espera",jugadores:[],g:null,rev:0,creada:Date.now(),extra:b.extra||{}};
    E.opciones=d.normaliza?d.normaliza(b.opciones||{},E):(b.opciones||{});
    if(E.opciones&&E.opciones.error)return Response.json({error:E.opciones.error},{status:400});
    this.E=E; await this.guardaYa();
    return Response.json({ok:true});
  }
  abre(req){
    var ident=JSON.parse(req.headers.get("X-Ident")||"{}"), E=this.E;
    if(!E)return new Response("sin sala",{status:404});
    var par=new WebSocketPair(), ws=par[1];
    this.ctx.acceptWebSocket(ws,[ident.id]);
    ws.serializeAttachment(ident);
    var d=J.def(E.juego);
    if(ident.rol==="jugador"&&E.fase!=="cerrada"){
      var j=J.jugador(E,ident.id);
      if(!j&&(E.fase==="espera"||(d.tarde&&E.fase==="juego"))&&E.jugadores.length<d.max){
        j={id:ident.id,nombre:ident.nombre,bot:false,invitado:!!ident.invitado,apodo:!!ident.apodo,unido:Date.now(),extra:ident.extra||null};
        E.jugadores.push(j);
        if(E.fase==="juego"&&d.une)d.une(E,j,Date.now(),azar());
        this.cambio();
      }
      if(j){j.conectado=true; if(ident.extra)j.extra=ident.extra;}
    }
    this.enviaA(ws,true);
    this.difunde();
    return new Response(null,{status:101,webSocket:par[0]});
  }
  async webSocketMessage(ws,data){
    var E=this.E; if(!E||typeof data!=="string"||data.length>MSG_MAX)return;
    var m; try{m=JSON.parse(data);}catch(e){return;}
    var yo=ws.deserializeAttachment()||{}, d=J.def(E.juego), ahora=Date.now(), r=azar(), host=yo.id===E.host;
    if(m.t==="ping"){ws.send('{"t":"pong"}');return;}
    if(yo.rol!=="jugador"&&!(host&&yo.rol==="pantalla"))return;
    var err=null;
    if(m.t==="accion"){
      if(E.fase!=="juego")err="not_playing";
      else if(!J.jugador(E,yo.id))err="not_player";
      else{var x=d.accion(E,yo.id,m,ahora,r); if(x&&x.error)err=x.error; else this.tras(ahora);}
    }else if(host&&m.t==="empezar"){
      if(E.fase!=="espera")err="already_started";
      else if(E.jugadores.length<d.min)err="need_players";
      else{E.fase="juego";E.inicio=ahora;d.inicia(E,r,ahora);this.tras(ahora);}
    }else if(host&&m.t==="bot"){
      if(!d.bots||E.fase!=="espera"||E.jugadores.length>=d.max)err="no_bots";
      else{var nb=E.jugadores.filter(function(j){return j.bot;}).length;
        E.jugadores.push({id:"b_"+nb+"_"+ahora%10000,nombre:"Bot "+NOMBRES_BOT[nb%NOMBRES_BOT.length],bot:true,conectado:true});this.cambio();}
    }else if(host&&m.t==="quitar"){
      if(m.id===E.host)err="forbidden";
      else{
        var q=J.jugador(E,m.id);
        if(q&&(E.fase==="espera"||q.bot)){E.jugadores=E.jugadores.filter(function(j){return j.id!==m.id;});this.cambio();}
        this.ctx.getWebSockets(String(m.id)).forEach(function(s){try{s.send('{"t":"error","error":"kicked"}');s.close(1000,"fuera");}catch(e){}});
      }
    }else if(host&&m.t==="otra"){
      if(E.fase!=="fin")err="not_finished";
      else{E.fase="espera";E.g=null;E.resultados=null;E.jugadores.forEach(function(j){delete j.equipo;});this.cambio();}
    }else if(host&&m.t==="opciones"){
      if(E.fase!=="espera")err="already_started";
      else{var op=d.normaliza?d.normaliza(m.opciones||{},E):(m.opciones||{}); if(op.error)err=op.error; else {E.opciones=op;this.cambio();}}
    }else err="bad_message";
    if(err){ws.send(JSON.stringify({t:"error",error:err}));return;}
    if(E.fase==="juego"&&E.g&&E.g.fin)await this.termina();
    this.programa();
  }
  async webSocketClose(ws){
    var yo=ws.deserializeAttachment()||{}, E=this.E; if(!E)return;
    var quedan=this.ctx.getWebSockets(String(yo.id)).filter(function(s){return s!==ws;}).length;
    var j=J.jugador(E,yo.id);
    if(j&&!quedan){j.conectado=false;
      /* en la sala de espera, quien se va deja su sitio (salvo el anfitrión) */
      if(E.fase==="espera"&&yo.id!==E.host)E.jugadores=E.jugadores.filter(function(x){return x.id!==yo.id;});
      this.cambio();}
  }
  async webSocketError(ws){ return this.webSocketClose(ws); }
  async alarm(){
    var E=this.E; if(!E||E.fase!=="juego")return;
    var d=J.def(E.juego), ahora=Date.now(), r=azar();
    if(d.tick&&d.tick(E,ahora,r))this.cambio();
    /* los bots juegan de uno en uno, con una pausa humana entre jugadas */
    if(d.bot&&!E.g.fin){
      for(var i=0;i<E.jugadores.length;i++){var j=E.jugadores[i];
        if(!j.bot)continue; var mv=d.bot(E,j.id,r,ahora);
        if(mv){d.accion(E,j.id,mv,ahora,r);this.cambio();break;}}
    }
    if(E.g.fin)await this.termina();
    this.programa();
  }
  /* ---------- tras cada jugada ---------- */
  tras(ahora){this.cambio();}
  cambio(){this.E.rev++;this.difunde();this.guarda();}
  programa(){
    var E=this.E, d=J.def(E.juego); if(E.fase!=="juego"){return;}
    var cuando=null, ahora=Date.now();
    var t=d.proximo?d.proximo(E):(E.g&&E.g.hasta); if(t)cuando=t;
    if(d.bot&&E.jugadores.some(function(j){return j.bot;})){
      var toca=E.jugadores.some(function(j){return j.bot&&d.bot(E,j.id,function(){return 0.5;},ahora);});
      if(toca)cuando=Math.min(cuando||Infinity,ahora+(d.pausaBot||BOT_MS));
    }
    if(cuando)this.ctx.storage.setAlarm(Math.max(ahora+50,cuando));
  }
  async termina(){
    var E=this.E, d=J.def(E.juego); if(E.fase==="fin")return;
    E.fase="fin"; E.fin=Date.now();
    var res=d.resultado?d.resultado(E):[];
    res.forEach(function(x){x.nombre=J.nombre(E,x.id);});
    E.resultados=res;
    this.cambio(); await this.guardaYa();
    /* resultados para las métricas de la plataforma y de la institución */
    try{
      var db=this.env.DB, humanos=E.jugadores.filter(function(j){return !j.bot;});
      var ops=[db.prepare("UPDATE salas SET estado='terminada',jugadores=?,ended_at=? WHERE code=?").bind(humanos.length,E.fin,E.code)];
      res.forEach(function(x){var j=J.jugador(E,x.id); if(!j||j.bot)return;
        ops.push(db.prepare("INSERT INTO sala_jugadores(code,user_id,nombre,puesto,puntos,created_at) VALUES(?,?,?,?,?,?) "+
          "ON CONFLICT(code,user_id) DO UPDATE SET puesto=excluded.puesto,puntos=excluded.puntos,created_at=excluded.created_at")
          .bind(E.code,j.id,j.nombre,x.puesto||null,x.puntos==null?null:Math.round(x.puntos),E.fin));});
      await db.batch(ops);
    }catch(e){ console.error("sala resultados",e&&e.message); }
    /* preguntas del banco general ya usadas: no se repiten en 60 días (tampoco en «otra partida») */
    var usadas=d.usadas?d.usadas(E):[];
    if(usadas.length&&E.extra&&E.extra.quien){
      E.extra.evita=(E.extra.evita||[]).filter(function(x){return usadas.indexOf(x)<0;}).concat(usadas);
      try{var db2=this.env.DB, t=E.fin;
        await db2.batch(usadas.map(function(q){return db2.prepare("INSERT INTO preguntas_vistas(quien,qid,visto_at) VALUES(?,?,?) ON CONFLICT(quien,qid) DO UPDATE SET visto_at=excluded.visto_at").bind(E.extra.quien,q,t);}));
      }catch(e){ console.error("preguntas vistas",e&&e.message); }
    }
  }
  /* ---------- envío: agrupado y solo si cambió lo que ve cada uno ---------- */
  difunde(){
    if(this.tDif)return;
    var d=J.def(this.E.juego), ms=(d&&d.difusion)||DIFUSION_MS, self=this;
    this.tDif=setTimeout(function(){self.tDif=null;self.difundeYa();},ms);
  }
  difundeYa(){var self=this; this.ctx.getWebSockets().forEach(function(ws){self.enviaA(ws,false);});}
  enviaA(ws,forzar){
    var E=this.E, yo=ws.deserializeAttachment()||{}, d=J.def(E.juego);
    var quien=yo.rol==="pantalla"?"pantalla":yo.id, total=0;
    var lista=E.jugadores.filter(function(j){if(!j.bot)total++;return true;});
    var sala={code:E.code,juego:E.juego,titulo:E.titulo,premio:E.premio,fase:E.fase,host:E.host,hostNombre:E.hostNombre,acceso:E.acceso,
      opciones:E.opciones,marca:E.marca,bases:E.bases,total:total,min:d.min,max:d.max,bots:!!d.bots,
      jugadores:lista.slice(E.fase==="espera"?-LISTA_MAX:-LISTA_JUEGO).map(function(j){return {id:j.id,nombre:j.nombre,bot:!!j.bot,conectado:j.bot||!!j.conectado,equipo:j.equipo};}),
      resultados:E.fase==="fin"?E.resultados:null};
    var g=(E.fase==="juego"||E.fase==="fin")&&E.g?d.vista(E,quien):null;
    var cuerpo=JSON.stringify({sala:sala,g:g,yo:{id:yo.id,nombre:yo.nombre,rol:yo.rol,host:yo.id===E.host}});
    if(!forzar&&this.ultimo.get(ws)===cuerpo)return;
    this.ultimo.set(ws,cuerpo);
    try{ws.send('{"t":"estado","ahora":'+Date.now()+','+cuerpo.slice(1));}catch(e){}
  }
  /* ---------- guardado: agrupado, salvo en los cambios de fase ---------- */
  guarda(){
    if(this.tGuarda)return; var self=this;
    this.tGuarda=setTimeout(function(){self.tGuarda=null;self.ctx.storage.put("E",self.E);},GUARDA_MS);
  }
  async guardaYa(){ if(this.tGuarda){clearTimeout(this.tGuarda);this.tGuarda=null;} await this.ctx.storage.put("E",this.E); }
}
