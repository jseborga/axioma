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
   =========================================================== */
import "../public/rapidos-motor.js";
import { perfil, puedePremio, rolOrg, esInvitado, esAcademica, esAdminPlataforma } from "./aula.js";
var R=globalThis.AxRapidos;

var ALFABETO="ABCDEFGHJKLMNPQRSTUVWXYZ23456789", DIA=86400000, TOL=1500;
var MIN_MS=10*60000, MAX_MS=92*DIA, MAX_ABIERTAS=30, TOP=50;
var MARGEN={trivia:15000,memoria:5000,calculo:0,reflejos:3000,numeros:0};
function limpia(s,max){return String(s==null?"":s).replace(/\s+/g," ").trim().slice(0,max);}
function codigo(n){var b=new Uint8Array(n);crypto.getRandomValues(b);var s="";for(var i=0;i<n;i++)s+=ALFABETO[b[i]%ALFABETO.length];return s;}
function estado(c,now){return c.cerrada_at||now>=c.ends_at?"terminado":now<c.starts_at?"pronto":"abierto";}
function orden(juego){return (R.JUEGOS[juego]||{}).orden||"puntos";}
/* ¿a es mejor marca que b? (más puntos, o menos ms en reflejos y del 1 al 25; a igualdad, menos tiempo) */
function mejor(juego,a,b){ if(!b)return true; return R.compara(juego,a,b)<0; }
/* ¿la marca alcanza el umbral del premio por puntaje? */
function alcanza(juego,score,umbral){return umbral!=null&&(orden(juego)==="menos"?score<=umbral:score>=umbral);}

async function carga(env,code){
  var c=await env.DB.prepare("SELECT * FROM campanas WHERE code=?").bind(code).first();
  if(c)c.premiosList=c.premios?JSON.parse(c.premios):[];
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
  var r=((await env.DB.prepare("SELECT i.user_id,i.score,i.seconds,i.finished_at,u.name FROM campana_intentos i JOIN users u ON u.id=i.user_id WHERE i.code=? AND i.finished_at IS NOT NULL")
    .bind(c.code).all()).results)||[], por={};
  r.forEach(function(x){var p=por[x.user_id]||(por[x.user_id]={user_id:x.user_id,name:x.name,intentos:0,best:null});
    p.intentos++; var m={score:x.score,seconds:x.seconds,at:x.finished_at}; if(mejor(c.juego,m,p.best))p.best=m;});
  var lista=Object.keys(por).map(function(k){return por[k];});
  lista.sort(function(a,b){return R.compara(c.juego,a.best,b.best)||a.best.at-b.best.at;});
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
  var lista=await marcas(env,c), ops=[], now=Date.now();
  lista.forEach(function(p){var t=premioDe(c,p.rank); if(t)ops.push(env.DB.prepare(
    "INSERT INTO campana_cupones(codigo,code,user_id,tipo,puesto,premio,created_at) VALUES(?,?,?,?,?,?,?)").bind(codigo(8),c.code,p.user_id,"puesto",p.rank,t,now));});
  for(var i=0;i<ops.length;i+=50)await env.DB.batch(ops.slice(i,i+50));
  c.premiados_at=now;
}
function publica(c,now){
  return {code:c.code,name:c.nombre,description:c.descripcion||"",juego:c.juego,juego_nombre:(R.JUEGOS[c.juego]||{}).nom||c.juego,
    orden:orden(c.juego),intentos:c.intentos,publico:!!c.publico,guests:!!c.invitados,ranking_visible:!!c.ranking,
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
  if(!R.JUEGOS[juego])return json({error:"bad_game"},null,400);
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
  await env.DB.prepare("INSERT INTO campanas(code,org_id,owner_id,nombre,descripcion,juego,intentos,publico,invitados,ranking,premios,umbral,umbral_premio,seed,starts_at,ends_at,created_at) "+
    "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(code,orgId,user.id,nombre,limpia(b.description,300)||null,juego,intentos,b.publico===false?0:1,b.guests===false?0:1,
    b.ranking===false?0:1,premios.length?JSON.stringify(premios):null,umbral,up||null,crypto.getRandomValues(new Uint32Array(1))[0],ini,fin,now).run();
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
    return {rank:p.rank,name:p.name,score:p.best.score,formato:R.formato(c.juego,p.best.score,p.best.seconds),me:!!(user&&p.user_id===user.id)};});
  if(user){
    var yo=lista.filter(function(p){return p.user_id===user.id;})[0];
    var usados=await env.DB.prepare("SELECT COUNT(*) AS n FROM campana_intentos WHERE code=? AND user_id=?").bind(code,user.id).first();
    var cup=((await env.DB.prepare("SELECT codigo,tipo,puesto,premio,created_at,canjeado_at FROM campana_cupones WHERE code=? AND user_id=? ORDER BY created_at").bind(code,user.id).all()).results)||[];
    o.me={intentos:usados.n,restantes:c.intentos?Math.max(0,c.intentos-usados.n):null,best:yo?{score:yo.best.score,formato:R.formato(c.juego,yo.best.score,yo.best.seconds)}:null,
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
  var usados=await env.DB.prepare("SELECT COUNT(*) AS n FROM campana_intentos WHERE code=? AND user_id=?").bind(code,user.id).first();
  if(c.intentos&&usados.n>=c.intentos)return json({error:"no_attempts"},null,400);
  if(!c.intentos&&usados.n>=200)return json({error:"too_many"},null,429);
  var n=usados.n+1, seed=R.semilla(c.seed+":"+user.id+":"+n);
  /* condicional: dos pestañas a la vez no suman un intento de más */
  var r=await env.DB.prepare("INSERT INTO campana_intentos(code,user_id,n,seed,started_at,created_at) SELECT ?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM campana_intentos WHERE code=? AND user_id=? AND n=?)")
    .bind(code,user.id,n,seed,now,now,code,user.id,n).run();
  if(!r.meta||r.meta.changes!==1)return json({error:"busy"},null,409);
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
  if(now>c.ends_at+5*60000)return json({error:"finished"},null,400);   /* margen para quien empezó justo antes del cierre */
  var datos=R.genera(c.juego,t.seed), res=R.evalua(c.juego,datos,b.envio);
  if(!res)return json({error:"bad_result"},null,400);
  var realMs=now-t.started_at, declarado=res.seconds*1000;
  /* lo que declara el jugador no puede ser más rápido que el reloj del servidor */
  if(c.juego==="numeros"){ if(res.score-(parseInt(b.envio.f,10)||0)*1000<realMs-TOL-MARGEN.numeros)return json({error:"bad_time"},null,400); }
  else if(c.juego==="calculo"){
    var resp=Array.isArray(b.envio.r)?b.envio.r:[], fallos=0, todas=resp.length>=datos.p.length;
    resp.forEach(function(v,k){if(v!=null&&datos.p[k]&&+v!==datos.p[k].r)fallos++;});
    if(realMs<(todas?20000:Math.max(0,45000-3000*fallos))-TOL)return json({error:"bad_time"},null,400);
  }else if(declarado<realMs-TOL-MARGEN[c.juego])return json({error:"bad_time"},null,400);
  var u=await env.DB.prepare("UPDATE campana_intentos SET finished_at=?,score=?,seconds=? WHERE id=? AND finished_at IS NULL").bind(now,res.score,res.seconds,iid).run();
  if(!u.meta||u.meta.changes!==1)return json({error:"already"},null,409);
  /* premio por puntaje: un cupón por persona, en cuanto alcanza el umbral */
  var cupon=null;
  if(alcanza(c.juego,res.score,c.umbral)){
    var ya=await env.DB.prepare("SELECT codigo,premio FROM campana_cupones WHERE code=? AND user_id=? AND tipo='umbral'").bind(code,user.id).first();
    if(ya)cupon={codigo:ya.codigo,premio:ya.premio,nuevo:false};
    else{var k=codigo(8); await env.DB.prepare("INSERT INTO campana_cupones(codigo,code,user_id,tipo,premio,created_at) VALUES(?,?,?,?,?,?)").bind(k,code,user.id,"umbral",c.umbral_premio,now).run();
      cupon={codigo:k,premio:c.umbral_premio,nuevo:true};}
  }
  var lista=await marcas(env,c), yo=lista.filter(function(p){return p.user_id===user.id;})[0];
  return json({ok:true,score:res.score,formato:R.formato(c.juego,res.score,res.seconds),
    best:{score:yo.best.score,formato:R.formato(c.juego,yo.best.score,yo.best.seconds)},mejoro:yo.best.at===now,rank:yo.rank,players:lista.length,
    restantes:c.intentos?Math.max(0,c.intentos-t.n):null,cupon:cupon});
}

async function cierra(env,user,code,json){
  var c=await carga(env,code); if(!c)return json({error:"not_found"},null,404);
  if(!(await gestiona(env,user,c)))return json({error:"forbidden"},null,403);
  if(!c.cerrada_at)await env.DB.prepare("UPDATE campanas SET cerrada_at=? WHERE code=? AND cerrada_at IS NULL").bind(Date.now(),code).run();
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
    return {rank:p.rank,name:p.name,intentos:p.intentos,score:p.best.score,formato:R.formato(c.juego,p.best.score,p.best.seconds),
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
    if((m=path.match(/^\/campanas\/([A-Z0-9]{6})\/cerrar$/))&&req.method==="POST")return await cierra(env,user,m[1],json);
    if((m=path.match(/^\/campanas\/([A-Z0-9]{6})\/resultados$/))&&req.method==="GET")return await resultados(env,user,m[1],json);
  }catch(e){
    if(/no such table/i.test(String(e&&e.message)))return json({error:"not_configured"},null,503);
    throw e;
  }
  return json({error:"not_found"},null,404);
}
