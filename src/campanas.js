/* ===========================================================
   THE FINAL TEST · Competencias de juego rápido para empresas (campañas)
   Una empresa o comunidad abre una convocatoria con uno de los juegos
   rápidos (trivia, memoria, cálculo, reflejos o del 1 al 25). La gente
   entra con el QR o el enlace (con Google o como invitado verificado),
   juega los intentos que permita la campaña y cuenta su mejor marca. El
   servidor genera cada partida con una semilla secreta, la cronometra y
   la puntúa, como en los retos.

   Premios de la campaña:
   · por puesto (1.º, 2.º–3.º…): se asignan al cerrar la campaña;
   · por puntaje («con 1500 puntos o más, 10 % de descuento»): al momento.
   Cada premio es un cupón único que la empresa valida en su panel.

     POST /api/campanas                          crear (administración u organizador de la empresa)
     GET  /api/campanas/:code                    ficha, ranking y lo mío (cupones incluidos)
     POST /api/campanas/:code/empezar            un intento: la partida, sin nada que puntuar en el navegador
     POST /api/campanas/:code/intentos/:id       { envio } → puntos, puesto y cupón si lo gana
     POST /api/campanas/:code/cerrar             terminarla ya y asignar los premios por puesto
     GET  /api/campanas/:code/resultados         participantes, marcas y cupones (quien gestiona)
     GET  /api/orgs/:id/campanas                 campañas de la empresa
     POST /api/campanas/cupones/validar          { codigo, canjear } estado de un cupón y canje

   Competencias sin fin (maratón: memoria sin fin, sudoku y Axioma):
   se juega paso a paso y el servidor comprueba cada uno. Al empezar
   llega el primer paso (o el que quedó a medias, si se recarga).
     POST /api/campanas/:code/intentos/:id/paso  { s } memoria · { k, n } sudoku · { cells, scope, shape } Axioma
     POST /api/campanas/:code/intentos/:id       { fin:true } plantarse con lo conseguido
   =========================================================== */
import "../public/rapidos-motor.js";
import "../public/maraton-motor.js";
import "../public/granja-motor.js";
import { perfil, puedePremio, rolOrg, esInvitado, esAcademica, esAdminPlataforma } from "./aula.js";
var R=globalThis.AxRapidos, X=globalThis.AxMaraton, GX=globalThis.AxGranja;

var ALFABETO="ABCDEFGHJKLMNPQRSTUVWXYZ23456789", DIA=86400000, TOL=1500;
var MIN_MS=10*60000, MAX_MS=92*DIA, MAX_ABIERTAS=30, TOP=50;
var MARGEN={trivia:15000,memoria:5000,calculo:0,reflejos:3000,numeros:0};
function limpia(s,max){return String(s==null?"":s).replace(/\s+/g," ").trim().slice(0,max);}
function codigo(n){var b=new Uint8Array(n);crypto.getRandomValues(b);var s="";for(var i=0;i<n;i++)s+=ALFABETO[b[i]%ALFABETO.length];return s;}
function estado(c,now){return c.cerrada_at||now>=c.ends_at?"terminado":now<c.starts_at?"pronto":"abierto";}
/* los juegos rápidos y los sin fin, con la misma forma */
function J(juego){return R.JUEGOS[juego]||X.JUEGOS[juego]||null;}
function formato(juego,score,seconds){return X.es(juego)?X.formato(juego,score):R.formato(juego,score,seconds);}
function compara(juego,a,b){return X.es(juego)?X.compara(juego,a,b):R.compara(juego,a,b);}
function orden(juego){return (J(juego)||{}).orden||"puntos";}
/* ¿a es mejor marca que b? (más puntos, o menos ms en reflejos y del 1 al 25; a igualdad, menos tiempo) */
function mejor(juego,a,b){ if(!b)return true; return compara(juego,a,b)<0; }
/* ¿la marca alcanza el umbral del premio por puntaje? */
function alcanza(juego,score,umbral){return umbral!=null&&(orden(juego)==="menos"?score<=umbral:score>=umbral);}

async function carga(env,code){
  var c=await env.DB.prepare("SELECT * FROM campanas WHERE code=?").bind(code).first();
  if(c)c.premiosList=c.premios?JSON.parse(c.premios):[];
  if(c&&X.es(c.juego)){
    var m=await env.DB.prepare("SELECT reglas FROM campana_maraton WHERE code=?").bind(code).first();
    c.reglas=m?JSON.parse(m.reglas):X.reglas(c.juego,{});
  }
  /* Granja Express: los productos de la empresa (nombres de pan, jugo y torta) */
  if(c&&GX.es(c.juego)){
    try{var g=await env.DB.prepare("SELECT reglas FROM campana_maraton WHERE code=?").bind(code).first(); c.productos=g?(JSON.parse(g.reglas).productos||null):null;}catch(e){c.productos=null;}
  }
  return c;
}
async function gestiona(env,user,c){
  if(!user||esInvitado(user))return false;
  if(c.owner_id===user.id||esAdminPlataforma(env,user))return true;
  var r=await rolOrg(env,c.org_id,user.id); return r==="admin"||r==="docente";
}
async function marcaDe(env,orgId){
  var o=await env.DB.prepare("SELECT name FROM orgs WHERE id=?").bind(orgId).first(), b=null;
  try{b=await env.DB.prepare("SELECT slug,color,logo FROM org_brand WHERE org_id=?").bind(orgId).first();}catch(e){}
  return {org_name:o?o.name:"",brand:b?{slug:b.slug,color:b.color||"",logo:b.logo||""}:null};
}
/* mejor marca de cada persona (y cuántos intentos terminados) */
async function marcas(env,c){
  if(X.es(c.juego))await cierraVencidos(env,c.code,null);
  var r=((await env.DB.prepare("SELECT i.user_id,i.score,i.seconds,i.finished_at,u.name FROM campana_intentos i JOIN users u ON u.id=i.user_id WHERE i.code=? AND i.finished_at IS NOT NULL")
    .bind(c.code).all()).results)||[], por={};
  r.forEach(function(x){var p=por[x.user_id]||(por[x.user_id]={user_id:x.user_id,name:x.name,intentos:0,best:null});
    p.intentos++; var m={score:x.score,seconds:x.seconds,at:x.finished_at}; if(mejor(c.juego,m,p.best))p.best=m;});
  var lista=Object.keys(por).map(function(k){return por[k];});
  lista.sort(function(a,b){return compara(c.juego,a.best,b.best)||a.best.at-b.best.at;});
  lista.forEach(function(p,i){p.rank=i+1;});
  return lista;
}
function premioDe(c,rank){
  for(var i=0;i<c.premiosList.length;i++){var p=c.premiosList[i]; if(rank>=p.desde&&rank<=p.hasta)return p.texto;}
  return null;
}
/* al terminar: cupones de los premios por puesto (una sola vez) */
async function asignaPremios(env,c){
  if(c.premiados_at||!c.premiosList.length||estado(c,Date.now())!=="terminado")return;
  var r=await env.DB.prepare("UPDATE campanas SET premiados_at=? WHERE code=? AND premiados_at IS NULL").bind(Date.now(),c.code).run();
  if(!r.meta||r.meta.changes!==1)return;
  if(X.es(c.juego))await cierraTodos(env,c.code);          /* las partidas a medias cuentan con lo conseguido */
  var lista=await marcas(env,c), ops=[], now=Date.now();
  lista.forEach(function(p){var t=premioDe(c,p.rank); if(t)ops.push(env.DB.prepare(
    "INSERT INTO campana_cupones(codigo,code,user_id,tipo,puesto,premio,created_at) VALUES(?,?,?,?,?,?,?)").bind(codigo(8),c.code,p.user_id,"puesto",p.rank,t,now));});
  for(var i=0;i<ops.length;i+=50)await env.DB.batch(ops.slice(i,i+50));
  c.premiados_at=now;
}
function publica(c,now){
  return {code:c.code,name:c.nombre,description:c.descripcion||"",juego:c.juego,juego_nombre:(J(c.juego)||{}).nom||c.juego,
    maraton:X.es(c.juego)?(c.reglas||null):null,productos:c.productos||null,orden:orden(c.juego),intentos:c.intentos,publico:!!c.publico,guests:!!c.invitados,ranking_visible:!!c.ranking,
    premios:c.premiosList,umbral:c.umbral,umbral_premio:c.umbral_premio||"",starts_at:c.starts_at,ends_at:c.ends_at,state:estado(c,now)};
}

async function crea(req,env,user,json){
  var b=await req.json().catch(function(){return {};}), now=Date.now();
  if(esInvitado(user))return json({error:"google_required"},null,403);
  var orgId=String(b.org_id||""), rol=await rolOrg(env,orgId,user.id);
  if(rol!=="admin"&&rol!=="docente")return json({error:"forbidden"},null,403);
  var o=await env.DB.prepare("SELECT status,kind FROM orgs WHERE id=?").bind(orgId).first();
  if(!o||o.status!=="activa")return json({error:"org_pending"},null,403);
  if(esAcademica(o.kind))return json({error:"edu_no_contests"},null,403);
  var nombre=limpia(b.name,60), juego=String(b.juego||"");
  if(nombre.length<2)return json({error:"bad_name"},null,400);
  if(!J(juego))return json({error:"bad_game"},null,400);
  /* sin fin: las reglas (vidas, reloj) y, en sudoku y Axioma, los tableros que preparó el navegador */
  var maraton=null;
  if(X.es(juego)){
    maraton={reglas:X.reglas(juego,b.reglas),lote:null};
    if(X.plan(juego)){ if(!X.loteOk(juego,b.tableros))return json({error:"bad_boards"},null,400); maraton.lote=X.limpiaLote(juego,b.tableros); }
  }
  var productos=null;
  if(GX.es(juego)&&b.productos&&typeof b.productos==="object"){
    productos={}; ["p","j","k"].forEach(function(k){var v=limpia(b.productos[k],24); if(v)productos[k]=v;});
    if(!Object.keys(productos).length)productos=null;
  }
  var intentos=Math.max(0,Math.min(50,parseInt(b.intentos,10)||0));
  var ini=parseInt(b.starts_at,10)||now, fin=parseInt(b.ends_at,10);
  if(ini<now-120000||ini>now+120*DIA)return json({error:"bad_start"},null,400);
  if(ini<now)ini=now;
  if(!(fin>=ini+MIN_MS&&fin<=ini+MAX_MS))return json({error:"bad_end"},null,400);
  /* premios por puesto: [{desde,hasta,texto}] ordenados y sin solaparse */
  var premios=(Array.isArray(b.premios)?b.premios:[]).map(function(p){return {desde:parseInt(p.desde,10),hasta:parseInt(p.hasta||p.desde,10),texto:limpia(p.texto,120)};})
    .filter(function(p){return p.texto&&p.desde>=1&&p.hasta>=p.desde&&p.hasta<=1000;}).sort(function(a,b){return a.desde-b.desde;}).slice(0,10);
  for(var i=1;i<premios.length;i++)if(premios[i].desde<=premios[i-1].hasta)return json({error:"bad_prizes"},null,400);
  var umbral=b.umbral===null||b.umbral===undefined||b.umbral===""?null:parseInt(b.umbral,10), up=limpia(b.umbral_premio,120);
  if(umbral!==null&&(isNaN(umbral)||umbral<0||!up))return json({error:"bad_threshold"},null,400);
  if(umbral===null)up="";
  var ab=await env.DB.prepare("SELECT COUNT(*) AS n FROM campanas WHERE org_id=? AND ends_at>? AND cerrada_at IS NULL").bind(orgId,now).first();
  if(ab.n>=MAX_ABIERTAS)return json({error:"too_many"},null,400);
  var code,choque,k=0;
  do{code=codigo(6);choque=await env.DB.prepare("SELECT 1 FROM campanas WHERE code=?").bind(code).first();k++;}while(choque&&k<5);
  var ins=env.DB.prepare("INSERT INTO campanas(code,org_id,owner_id,nombre,descripcion,juego,intentos,publico,invitados,ranking,premios,umbral,umbral_premio,seed,starts_at,ends_at,created_at) "+
    "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(code,orgId,user.id,nombre,limpia(b.description,300)||null,juego,intentos,b.publico===false?0:1,b.guests===false?0:1,
    b.ranking===false?0:1,premios.length?JSON.stringify(premios):null,umbral,up||null,crypto.getRandomValues(new Uint32Array(1))[0],ini,fin,now);
  if(productos)await env.DB.batch([env.DB.prepare("INSERT INTO campana_maraton(code,reglas,tableros) VALUES(?,?,?)").bind(code,JSON.stringify({productos:productos}),null),ins]);
  else if(maraton)await env.DB.batch([env.DB.prepare("INSERT INTO campana_maraton(code,reglas,tableros) VALUES(?,?,?)")
    .bind(code,JSON.stringify(maraton.reglas),maraton.lote?JSON.stringify(maraton.lote):null),ins]);
  else await ins.run();
  return json({ok:true,code:code});
}

async function ficha(env,user,code,json){
  var c=await carga(env,code); if(!c)return json({error:"not_found"},null,404);
  await asignaPremios(env,c);
  var now=Date.now(), o=publica(c,now), m=await marcaDe(env,c.org_id);
  o.org_name=m.org_name; o.brand=m.brand; o.manage=await gestiona(env,user,c);
  var lista=await marcas(env,c);
  o.players=lista.length;
  if(c.ranking||o.state==="terminado"||o.manage)o.ranking=lista.slice(0,TOP).map(function(p){
    return {rank:p.rank,name:p.name,score:p.best.score,formato:formato(c.juego,p.best.score,p.best.seconds),me:!!(user&&p.user_id===user.id)};});
  if(user){
    var yo=lista.filter(function(p){return p.user_id===user.id;})[0];
    var usados=await env.DB.prepare("SELECT COUNT(*) AS n FROM campana_intentos WHERE code=? AND user_id=?").bind(code,user.id).first();
    var cup=((await env.DB.prepare("SELECT codigo,tipo,puesto,premio,created_at,canjeado_at FROM campana_cupones WHERE code=? AND user_id=? ORDER BY created_at").bind(code,user.id).all()).results)||[];
    var viva=X.es(c.juego)?await env.DB.prepare("SELECT 1 AS x FROM campana_intentos i JOIN campana_progreso p ON p.intento_id=i.id WHERE i.code=? AND i.user_id=? AND i.finished_at IS NULL AND p.vence_at>?")
      .bind(code,user.id,now).first():null;
    o.me={en_juego:!!viva,intentos:usados.n,restantes:c.intentos?Math.max(0,c.intentos-usados.n):null,best:yo?{score:yo.best.score,formato:formato(c.juego,yo.best.score,yo.best.seconds)}:null,
      rank:yo?yo.rank:null,cupones:cup.map(function(x){return {codigo:x.codigo,tipo:x.tipo,puesto:x.puesto,premio:x.premio,canjeado:!!x.canjeado_at};})};
  }
  return json(o);
}

async function empieza(env,user,code,json){
  var c=await carga(env,code); if(!c)return json({error:"not_found"},null,404);
  var now=Date.now(), st=estado(c,now);
  if(st!=="abierto")return json({error:st==="pronto"?"not_started":"finished",starts_at:c.starts_at},null,400);
  if(esInvitado(user)&&!c.invitados)return json({error:"google_required"},null,403);
  if(!(await perfil(env,user.id)).complete)return json({error:"profile_required"},null,403);
  /* con premios, los menores necesitan el consentimiento de su tutor, como en las convocatorias */
  if((c.premiosList.length||c.umbral!=null)&&!(await puedePremio(env,user.id)))return json({error:"consent_required"},null,403);
  /* sin fin: si hay una partida a medias (se recargó la página), se sigue donde quedó */
  var lote=null;
  if(X.es(c.juego)){
    await cierraVencidos(env,code,user.id);
    lote=await cargaLote(env,code);
    var viva=await env.DB.prepare("SELECT i.*,p.estado FROM campana_intentos i JOIN campana_progreso p ON p.intento_id=i.id WHERE i.code=? AND i.user_id=? AND i.finished_at IS NULL")
      .bind(code,user.id).first();
    if(viva)return json({intento:viva.id,n:viva.n,restantes:c.intentos?Math.max(0,c.intentos-viva.n):null,reanuda:true,
      paso:vistaPaso(c,viva,JSON.parse(viva.estado),lote,now)});
  }
  var usados=await env.DB.prepare("SELECT COUNT(*) AS n FROM campana_intentos WHERE code=? AND user_id=?").bind(code,user.id).first();
  if(c.intentos&&usados.n>=c.intentos)return json({error:"no_attempts"},null,400);
  if(!c.intentos&&usados.n>=200)return json({error:"too_many"},null,429);
  var n=usados.n+1, seed=R.semilla(c.seed+":"+user.id+":"+n);
  /* condicional: dos pestañas a la vez no suman un intento de más */
  var r=await env.DB.prepare("INSERT INTO campana_intentos(code,user_id,n,seed,started_at,created_at) SELECT ?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM campana_intentos WHERE code=? AND user_id=? AND n=?)")
    .bind(code,user.id,n,seed,now,now,code,user.id,n).run();
  if(!r.meta||r.meta.changes!==1)return json({error:"busy"},null,409);
  if(X.es(c.juego)){
    var ti={id:r.meta.last_row_id,n:n,seed:seed,started_at:now}, e=estadoInicial(c,ti,now);
    await env.DB.batch([
      env.DB.prepare("INSERT INTO campana_progreso(intento_id,code,estado,vence_at,updated_at) VALUES(?,?,?,?,?)").bind(ti.id,code,JSON.stringify(e),vence(c,ti,e,now),now),
      env.DB.prepare("UPDATE campana_intentos SET score=0,seconds=0 WHERE id=?").bind(ti.id)]);
    return json({intento:ti.id,n:n,restantes:c.intentos?c.intentos-n:null,paso:vistaPaso(c,ti,e,lote,now)});
  }
  var datos=R.genera(c.juego,seed);
  /* en la trivia no se envía cuál es la correcta: se sabe al puntuar */
  if(c.juego==="trivia")datos={p:datos.p.map(function(q){return {q:q.q,o:q.o};})};
  return json({intento:r.meta.last_row_id,n:n,restantes:c.intentos?c.intentos-n:null,datos:datos});
}

async function termina(req,env,user,code,iid,json){
  var c=await carga(env,code); if(!c)return json({error:"not_found"},null,404);
  var t=await env.DB.prepare("SELECT * FROM campana_intentos WHERE id=? AND code=?").bind(iid,code).first();
  if(!t||t.user_id!==user.id)return json({error:"not_found"},null,404);
  if(t.finished_at)return json({error:"already"},null,409);
  var b=await req.json().catch(function(){return {};}), now=Date.now();
  /* sin fin: plantarse y quedarse con lo conseguido */
  if(X.es(c.juego)){
    var pg=await env.DB.prepare("SELECT estado FROM campana_progreso WHERE intento_id=?").bind(iid).first();
    return json(await terminaMaraton(env,c,t,pg?JSON.parse(pg.estado):null,now,"plantado"));
  }
  if(now>c.ends_at+5*60000)return json({error:"finished"},null,400);   /* margen para quien empezó justo antes del cierre */
  var datos=R.genera(c.juego,t.seed), res=R.evalua(c.juego,datos,b.envio);
  if(!res)return json({error:"bad_result"},null,400);
  var realMs=now-t.started_at, declarado=res.seconds*1000;
  /* lo que declara el jugador no puede ser más rápido que el reloj del servidor */
  if(GX.es(c.juego)){ if(!GX.tiempoOk(res,realMs))return json({error:"bad_time"},null,400); }
  else if(c.juego==="numeros"){ if(res.score-(parseInt(b.envio.f,10)||0)*1000<realMs-TOL-MARGEN.numeros)return json({error:"bad_time"},null,400); }
  else if(c.juego==="calculo"){
    var resp=Array.isArray(b.envio.r)?b.envio.r:[], fallos=0, todas=resp.length>=datos.p.length;
    resp.forEach(function(v,k){if(v!=null&&datos.p[k]&&+v!==datos.p[k].r)fallos++;});
    if(realMs<(todas?20000:Math.max(0,45000-3000*fallos))-TOL)return json({error:"bad_time"},null,400);
  }else if(declarado<realMs-TOL-MARGEN[c.juego])return json({error:"bad_time"},null,400);
  var u=await env.DB.prepare("UPDATE campana_intentos SET finished_at=?,score=?,seconds=? WHERE id=? AND finished_at IS NULL").bind(now,res.score,res.seconds,iid).run();
  if(!u.meta||u.meta.changes!==1)return json({error:"already"},null,409);
  var cupon=await cuponUmbral(env,c,user.id,res.score,now);
  return json(await resultado(env,c,t,res.score,res.seconds,now,cupon));
}
/* premio por puntaje: un cupón por persona, en cuanto alcanza el umbral */
async function cuponUmbral(env,c,uid,score,now){
  if(!alcanza(c.juego,score,c.umbral))return null;
  var ya=await env.DB.prepare("SELECT codigo,premio FROM campana_cupones WHERE code=? AND user_id=? AND tipo='umbral'").bind(c.code,uid).first();
  if(ya)return {codigo:ya.codigo,premio:ya.premio,nuevo:false};
  var k=codigo(8);
  await env.DB.prepare("INSERT INTO campana_cupones(codigo,code,user_id,tipo,premio,created_at) SELECT ?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM campana_cupones WHERE code=? AND user_id=? AND tipo='umbral')")
    .bind(k,c.code,uid,"umbral",c.umbral_premio,now,c.code,uid).run();
  var y=await env.DB.prepare("SELECT codigo,premio FROM campana_cupones WHERE code=? AND user_id=? AND tipo='umbral'").bind(c.code,uid).first();
  return y?{codigo:y.codigo,premio:y.premio,nuevo:y.codigo===k}:null;
}
/* lo que se enseña al terminar un intento: la marca, la mejor, el puesto y el cupón */
async function resultado(env,c,t,score,seconds,now,cupon){
  var lista=await marcas(env,c), yo=lista.filter(function(p){return p.user_id===t.user_id;})[0];
  return {ok:true,score:score,formato:formato(c.juego,score,seconds),
    best:yo?{score:yo.best.score,formato:formato(c.juego,yo.best.score,yo.best.seconds)}:null,mejoro:!!yo&&yo.best.at===now,rank:yo?yo.rank:null,players:lista.length,
    restantes:c.intentos?Math.max(0,c.intentos-t.n):null,cupon:cupon};
}

/* ===========================================================
   Sin fin (maratón): una partida es una serie de pasos que comprueba
   el servidor. El estado de cada partida viva está en campana_progreso
   y vence_at dice cuándo se acaba sola (reloj agotado o, en la memoria,
   tres minutos sin jugar). La marca (score, seconds) se guarda en
   campana_intentos a cada paso: cuenta aunque se cierre la página.
   =========================================================== */
async function cargaLote(env,code){
  var m=await env.DB.prepare("SELECT tableros FROM campana_maraton WHERE code=?").bind(code).first();
  return m&&m.tableros?JSON.parse(m.tableros):null;
}
function estadoInicial(c,t,now){
  var e={vidas:c.reglas.vidas,puntos:0,resueltos:0,t:now,ult:0,extra:0};
  if(c.juego==="memoria_inf")e.largo=X.MEM_INICIO;
  else{e.i=0; if(c.juego==="sudoku_mar")e.val="";}
  return e;
}
/* cuándo se acaba sola la partida (nunca después del cierre de la campaña) */
function vence(c,t,e,now){
  var v=c.juego==="memoria_inf"?e.t+X.MEM_OCIO:t.started_at+c.reglas.reloj*60000+e.extra;
  return Math.min(v,c.ends_at);
}
/* lo que ve quien juega en cada paso: nunca la solución */
function vistaPaso(c,t,e,lote,now){
  var o={juego:c.juego,vidas:e.vidas,vidas_max:c.reglas.vidas,puntos:e.puntos,resueltos:e.resueltos,formato:X.formato(c.juego,e.puntos)};
  if(c.juego==="memoria_inf"){ o.largo=e.largo; o.s=X.secuencia(t.seed,e.largo); o.mostrar=X.mostrar(e.largo); return o; }
  o.restante_ms=Math.max(0,vence(c,t,e,now)-now); o.extra_s=c.reglas.extra;
  var ord=X.orden(c.juego,lote,t.seed), tb=lote[ord[e.i]];
  o.i=e.i; o.total=ord.length; o.tipo=tb.t;
  if(c.juego==="sudoku_mar"){o.nivel=X.NIVEL_SUD[tb.t]; o.puzzle=tb.puzzle; o.val=e.val||"";}
  else o.tablero=X.axiomaPublico(tb);
  return o;
}
async function guardaEstado(env,c,t,antes,e,now){
  var r=await env.DB.prepare("UPDATE campana_progreso SET estado=?,vence_at=?,updated_at=? WHERE intento_id=? AND estado=?")
    .bind(JSON.stringify(e),vence(c,t,e,now),now,t.id,antes).run();
  if(!r.meta||r.meta.changes!==1)return false;             /* otra pestaña jugó a la vez */
  await env.DB.prepare("UPDATE campana_intentos SET score=?,seconds=? WHERE id=? AND finished_at IS NULL")
    .bind(e.puntos,Math.max(1,Math.round((now-t.started_at)/1000)),t.id).run();
  return true;
}
/* cierra una partida con lo conseguido: sin vidas, sin tiempo, plantándose o completándolo todo */
async function terminaMaraton(env,c,t,e,now,motivo){
  var score=e?e.puntos:(t.score||0), fin=e?Math.min(now,vence(c,t,e,now)+TOL):now;
  var seconds=Math.max(1,Math.round((Math.min(now,fin)-t.started_at)/1000));
  var u=await env.DB.prepare("UPDATE campana_intentos SET finished_at=?,score=?,seconds=? WHERE id=? AND finished_at IS NULL").bind(now,score,seconds,t.id).run();
  await env.DB.prepare("DELETE FROM campana_progreso WHERE intento_id=?").bind(t.id).run();
  if(!u.meta||u.meta.changes!==1)return {error:"already"};
  var cupon=await cuponUmbral(env,c,t.user_id,score,now);
  var out=await resultado(env,c,t,score,seconds,now,cupon);
  out.fin=true; out.motivo=motivo; return out;
}
/* partidas que se acabaron solas (reloj o abandono): su marca ya estaba guardada */
async function cierraVencidos(env,code,uid){
  var lim=Date.now()-TOL;
  var hay=await env.DB.prepare("SELECT COUNT(*) AS n FROM campana_progreso WHERE code=? AND vence_at<?").bind(code,lim).first();
  if(!hay||!hay.n)return;
  await env.DB.batch([
    env.DB.prepare("UPDATE campana_intentos SET finished_at=(SELECT p.vence_at FROM campana_progreso p WHERE p.intento_id=campana_intentos.id) "+
      "WHERE code=? AND finished_at IS NULL AND id IN (SELECT intento_id FROM campana_progreso WHERE code=? AND vence_at<?)").bind(code,code,lim),
    env.DB.prepare("DELETE FROM campana_progreso WHERE code=? AND vence_at<?").bind(code,lim)]);
}
/* al cerrar la campaña antes de tiempo, las partidas a medias se quedan con lo conseguido */
async function cierraTodos(env,code){
  var now=Date.now();
  await env.DB.batch([
    env.DB.prepare("UPDATE campana_intentos SET finished_at=? WHERE code=? AND finished_at IS NULL AND id IN (SELECT intento_id FROM campana_progreso WHERE code=?)").bind(now,code,code),
    env.DB.prepare("DELETE FROM campana_progreso WHERE code=?").bind(code)]);
}

async function paso(req,env,user,code,iid,json){
  var c=await carga(env,code); if(!c)return json({error:"not_found"},null,404);
  if(!X.es(c.juego))return json({error:"bad_game"},null,400);
  var t=await env.DB.prepare("SELECT * FROM campana_intentos WHERE id=? AND code=?").bind(iid,code).first();
  if(!t||t.user_id!==user.id)return json({error:"not_found"},null,404);
  if(t.finished_at)return json({error:"already"},null,409);
  var pg=await env.DB.prepare("SELECT estado FROM campana_progreso WHERE intento_id=?").bind(iid).first();
  if(!pg)return json({error:"already"},null,409);
  var b=await req.json().catch(function(){return {};}), now=Date.now(), antes=pg.estado, e=JSON.parse(antes);
  if(estado(c,now)==="terminado")return json(await terminaMaraton(env,c,t,e,now,"cerrada"));
  if(now>vence(c,t,e,now)+TOL)return json(await terminaMaraton(env,c,t,e,now,c.juego==="memoria_inf"?"inactivo":"tiempo"));
  var lote=c.juego==="memoria_inf"?null:await cargaLote(env,code);
  var bien=false, completo=false, puntos0=e.puntos, i;

  if(c.juego==="memoria_inf"){
    var s=Array.isArray(b.s)?b.s:null;
    if(!s||s.length!==e.largo)return json({error:"bad_move"},null,400);
    /* nadie repite una secuencia antes de que termine de verse */
    if(now-e.t<X.minimoMemoria(e.largo)-300)return json({error:"too_fast"},null,400);
    var esperada=X.secuencia(t.seed,e.largo);
    bien=esperada.every(function(v,k){return parseInt(s[k],10)===v;});
    if(bien){e.puntos=e.largo; e.resueltos++; e.largo++; completo=true;}
    else e.vidas--;
    e.t=now;
    if(e.largo>X.MEM_MAX)return json(Object.assign({ok:bien},await terminaMaraton(env,c,t,e,now,"completo")));
  }else{
    var ord=X.orden(c.juego,lote,t.seed), tb=lote[ord[e.i]];
    if(c.juego==="sudoku_mar"){
      var k=parseInt(b.k,10), n=parseInt(b.n,10), val=(e.val||"").length===81?e.val.split(""):tb.puzzle.split("").map(function(){return "0";});
      if(!(k>=0&&k<81)||!(n>=1&&n<=9)||tb.puzzle[k]!=="0"||val[k]!=="0")return json({error:"bad_move"},null,400);
      if(now-e.ult<X.SUD_MIN_JUGADA)return json({error:"too_fast"},null,400);
      e.ult=now;
      bien=String(n)===tb.solution[k];
      if(bien){
        val[k]=String(n); e.puntos+=X.puntosCifra(tb.t); e.val=val.join("");
        for(i=0;i<81;i++)if(tb.puzzle[i]==="0"&&val[i]==="0")break;
        if(i===81){completo=true; e.puntos+=X.puntosSudoku(tb.t); e.resueltos++; e.extra+=c.reglas.extra*1000; e.i++; e.val=""; e.t=now;}
      }else e.vidas--;
    }else{
      var cells=Array.isArray(b.cells)?b.cells.map(String):null;
      if(!cells||cells.length!==tb.k)return json({error:"bad_move"},null,400);
      if(now-e.t<X.AX_MIN_TABLERO)return json({error:"too_fast"},null,400);
      var sol={}; tb.sol.forEach(function(x){sol[x]=1;});
      bien=b.scope===tb.scope&&b.shape===tb.shape&&cells.every(function(x){return sol[x];})&&Object.keys(cells.reduce(function(a,x){a[x]=1;return a;},{})).length===tb.k;
      if(bien){completo=true; e.puntos+=X.puntosAxioma(tb.t); e.resueltos++; e.extra+=c.reglas.extra*1000; e.i++; e.t=now;}
      else e.vidas--;
    }
    if(completo&&e.i>=ord.length)return json(Object.assign({ok:true,completo:true},await terminaMaraton(env,c,t,e,now,"completo")));
  }
  if(e.vidas<=0)return json(Object.assign({ok:false},await terminaMaraton(env,c,t,e,now,"vidas")));
  if(!(await guardaEstado(env,c,t,antes,e,now)))return json({error:"busy"},null,409);
  var cupon=e.puntos>puntos0?await cuponUmbral(env,c,user.id,e.puntos,now):null;
  return json({ok:bien,completo:completo,paso:vistaPaso(c,t,e,lote,now),cupon:cupon&&cupon.nuevo?cupon:null});
}

async function cierra(env,user,code,json){
  var c=await carga(env,code); if(!c)return json({error:"not_found"},null,404);
  if(!(await gestiona(env,user,c)))return json({error:"forbidden"},null,403);
  if(!c.cerrada_at)await env.DB.prepare("UPDATE campanas SET cerrada_at=? WHERE code=? AND cerrada_at IS NULL").bind(Date.now(),code).run();
  if(X.es(c.juego))await cierraTodos(env,code);
  c=await carga(env,code); await asignaPremios(env,c);
  return json({ok:true});
}

async function resultados(env,user,code,json){
  var c=await carga(env,code); if(!c)return json({error:"not_found"},null,404);
  if(!(await gestiona(env,user,c)))return json({error:"forbidden"},null,403);
  await asignaPremios(env,c);
  var lista=await marcas(env,c), ids=lista.map(function(p){return p.user_id;}), extra={};
  if(ids.length){
    /* contacto solo de quien aceptó que la empresa lo contacte */
    for(var i=0;i<ids.length;i+=90){
      var parte=ids.slice(i,i+90), st=env.DB.prepare("SELECT u.id,u.email,g.channel,g.contact,cc.marketing FROM users u LEFT JOIN guests g ON g.user_id=u.id "+
        "LEFT JOIN contact_consents cc ON cc.user_id=u.id AND cc.org_id=? WHERE u.id IN ("+parte.map(function(){return "?";}).join(",")+")");
      (((await st.bind.apply(st,[c.org_id].concat(parte)).all()).results)||[]).forEach(function(x){extra[x.id]=x;});
    }
  }
  var cup=((await env.DB.prepare("SELECT k.*,u.name FROM campana_cupones k JOIN users u ON u.id=k.user_id WHERE k.code=? ORDER BY k.tipo,k.puesto,k.created_at").bind(code).all()).results)||[];
  var o=publica(c,Date.now()), m=await marcaDe(env,c.org_id); o.org_name=m.org_name; o.brand=m.brand;
  o.rows=lista.map(function(p){var x=extra[p.user_id]||{}, ok=!!x.marketing;
    return {rank:p.rank,name:p.name,intentos:p.intentos,score:p.best.score,formato:formato(c.juego,p.best.score,p.best.seconds),
      guest:!!x.channel,marketing:ok,contacto:ok?(x.channel?x.contact:x.email||""):""};});
  o.cupones=cup.map(function(k){return {codigo:k.codigo,name:k.name,tipo:k.tipo,puesto:k.puesto,premio:k.premio,created_at:k.created_at,canjeado_at:k.canjeado_at};});
  return json(o);
}

async function deOrg(env,user,orgId,json){
  var rol=await rolOrg(env,orgId,user.id);
  if(rol!=="admin"&&rol!=="docente"&&!esAdminPlataforma(env,user))return json({error:"forbidden"},null,403);
  var now=Date.now();
  var r=((await env.DB.prepare("SELECT c.*,(SELECT COUNT(DISTINCT user_id) FROM campana_intentos i WHERE i.code=c.code AND i.finished_at IS NOT NULL) AS jugadores,"+
    "(SELECT COUNT(*) FROM campana_cupones k WHERE k.code=c.code) AS cupones,(SELECT COUNT(*) FROM campana_cupones k WHERE k.code=c.code AND k.canjeado_at IS NOT NULL) AS canjeados "+
    "FROM campanas c WHERE c.org_id=? ORDER BY c.ends_at DESC LIMIT 100").bind(orgId).all()).results)||[];
  return json({campanas:r.map(function(c){c.premiosList=c.premios?JSON.parse(c.premios):[];var o=publica(c,now);o.players=c.jugadores;o.cupones=c.cupones;o.canjeados=c.canjeados;return o;})});
}

async function valida(req,env,user,json){
  var b=await req.json().catch(function(){return {};}), k=String(b.codigo||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  if(k.length!==8)return json({error:"bad_code"},null,400);
  var x=await env.DB.prepare("SELECT k.*,u.name,c.org_id,c.nombre FROM campana_cupones k JOIN users u ON u.id=k.user_id JOIN campanas c ON c.code=k.code WHERE k.codigo=?").bind(k).first();
  if(!x)return json({error:"bad_code"},null,404);
  if(!(await gestiona(env,user,{owner_id:null,org_id:x.org_id})))return json({error:"forbidden"},null,403);
  var out={codigo:k,campana:x.nombre,code:x.code,name:x.name,tipo:x.tipo,puesto:x.puesto,premio:x.premio,canjeado_at:x.canjeado_at};
  if(b.canjear&&!x.canjeado_at){
    var r=await env.DB.prepare("UPDATE campana_cupones SET canjeado_at=?,canjeado_por=? WHERE codigo=? AND canjeado_at IS NULL").bind(Date.now(),user.id,k).run();
    if(!r.meta||r.meta.changes!==1)return json({error:"code_used"},null,400);
    out.canjeado_at=Date.now(); out.recien=true;
  }
  return json(out);
}

export async function handleCampanas(req,env,url,path,ctx){
  var json=ctx.json, user=ctx.user, m;
  if(!env.DB)return json({error:"not_configured"},null,503);
  try{
    if((m=path.match(/^\/campanas\/([A-Z0-9]{6})$/))&&req.method==="GET")return await ficha(env,user,m[1],json);
    if(!user)return json({error:"unauthorized"},null,401);
    if(path==="/campanas"&&req.method==="POST")return await crea(req,env,user,json);
    if(path==="/campanas/cupones/validar"&&req.method==="POST")return await valida(req,env,user,json);
    if((m=path.match(/^\/orgs\/([A-Z0-9]{6})\/campanas$/))&&req.method==="GET")return await deOrg(env,user,m[1],json);
    if((m=path.match(/^\/campanas\/([A-Z0-9]{6})\/empezar$/))&&req.method==="POST")return await empieza(env,user,m[1],json);
    if((m=path.match(/^\/campanas\/([A-Z0-9]{6})\/intentos\/(\d+)$/))&&req.method==="POST")return await termina(req,env,user,m[1],+m[2],json);
    if((m=path.match(/^\/campanas\/([A-Z0-9]{6})\/intentos\/(\d+)\/paso$/))&&req.method==="POST")return await paso(req,env,user,m[1],+m[2],json);
    if((m=path.match(/^\/campanas\/([A-Z0-9]{6})\/cerrar$/))&&req.method==="POST")return await cierra(env,user,m[1],json);
    if((m=path.match(/^\/campanas\/([A-Z0-9]{6})\/resultados$/))&&req.method==="GET")return await resultados(env,user,m[1],json);
  }catch(e){
    if(/no such table: campana_(maraton|progreso)/i.test(String(e&&e.message)))return json({error:"maraton_not_configured"},null,503);
    if(/no such table/i.test(String(e&&e.message)))return json({error:"not_configured"},null,503);
    throw e;
  }
  return json({error:"not_found"},null,404);
}
