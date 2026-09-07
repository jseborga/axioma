/* ===========================================================
   AXIOMA · API (Cloudflare Workers + D1)
   Rutas:
     GET  /api/config        → { googleClientId }  (vacío si no está configurado)
     GET  /api/me            → { user } o { user:null }
     POST /api/auth/google   → { credential } → verifica el ID token, crea sesión
     POST /api/auth/logout   → borra la sesión
     POST /api/scores        → { day, moves, hints } → guarda la puntuación del día (requiere sesión)
     GET  /api/ranking?day=N → { day, top:[…], me:{rank,total}|null }
   Variables de entorno: GOOGLE_CLIENT_ID, SESSION_SECRET. Binding D1: DB.
   =========================================================== */

var COOKIE="ax_session";
var SESSION_DAYS=30;
var TOP=20;

export async function handleApi(req,env,url){
  var path=url.pathname.replace(/^\/api/,"");
  try{
    if(path==="/config"&&req.method==="GET")
      /* solo se anuncia el inicio de sesión cuando las tres piezas están listas,
         para que el botón nunca aparezca si luego iría a fallar */
      return json({googleClientId:ready(env)?env.GOOGLE_CLIENT_ID:""});
    if(path==="/me"&&req.method==="GET")
      return json({user:await currentUser(req,env)});
    if(path==="/auth/google"&&req.method==="POST")
      return await loginWithGoogle(req,env);
    if(path==="/auth/logout"&&req.method==="POST")
      return json({ok:true},{"Set-Cookie":COOKIE+"=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"});
    if(path==="/scores"&&req.method==="POST")
      return await submitScore(req,env);
    if(path==="/ranking"&&req.method==="GET")
      return await ranking(req,env,url);
    return json({error:"not_found"},null,404);
  }catch(e){
    console.error("axioma api",path,e&&e.stack||e);   /* visible en Observability */
    return json({error:"server_error"},null,500);
  }
}

function ready(env){return !!(env.GOOGLE_CLIENT_ID&&env.SESSION_SECRET&&env.DB)}

/* ---------- respuestas ---------- */
function json(body,extraHeaders,status){
  var h={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};
  if(extraHeaders)for(var k in extraHeaders)h[k]=extraHeaders[k];
  return new Response(JSON.stringify(body),{status:status||200,headers:h});
}

/* ---------- día del reto (misma fórmula que app.js) ---------- */
function dayNumber(){
  var epoch=Date.UTC(2026,0,1);
  return Math.floor((Date.now()-epoch)/86400000)+1;
}

/* ---------- sesión: cookie firmada con HMAC, sin tabla de sesiones ---------- */
function b64url(bytes){
  var s=typeof bytes==="string"?bytes:String.fromCharCode.apply(null,new Uint8Array(bytes));
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function unb64url(s){
  s=s.replace(/-/g,"+").replace(/_/g,"/"); while(s.length%4)s+="=";
  return atob(s);
}
async function hmacKey(secret){
  return crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"]);
}
async function sign(payload,secret){
  var key=await hmacKey(secret), data=b64url(JSON.stringify(payload));
  var sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(data));
  return data+"."+b64url(sig);
}
async function verify(token,secret){
  if(!token||token.indexOf(".")<0)return null;
  var parts=token.split("."), key=await hmacKey(secret);
  var sigBytes=Uint8Array.from(unb64url(parts[1]),function(c){return c.charCodeAt(0)});
  var ok=await crypto.subtle.verify("HMAC",key,sigBytes,new TextEncoder().encode(parts[0]));
  if(!ok)return null;
  try{var p=JSON.parse(unb64url(parts[0]));}catch(e){return null}
  if(!p.sub||!p.exp||p.exp<Date.now()/1000)return null;
  return p;
}
function readCookie(req,name){
  var c=req.headers.get("Cookie")||"", m=c.match(new RegExp("(?:^|;\\s*)"+name+"=([^;]+)"));
  return m?decodeURIComponent(m[1]):null;
}
async function currentUser(req,env){
  if(!env.SESSION_SECRET||!env.DB)return null;
  var p=await verify(readCookie(req,COOKIE),env.SESSION_SECRET);
  if(!p)return null;
  var row=await env.DB.prepare("SELECT id,name,picture,email FROM users WHERE id=?").bind(p.sub).first();
  return row||null;
}

/* ---------- entrada con Google ---------- */
async function loginWithGoogle(req,env){
  if(!ready(env))return json({error:"not_configured"},null,503);
  var body=await req.json().catch(function(){return {}});
  if(!body.credential)return json({error:"missing_credential"},null,400);

  /* Google valida la firma del ID token y nos devuelve sus campos */
  var r=await fetch("https://oauth2.googleapis.com/tokeninfo?id_token="+encodeURIComponent(body.credential));
  if(!r.ok)return json({error:"invalid_token"},null,401);
  var t=await r.json();
  if(t.aud!==env.GOOGLE_CLIENT_ID)return json({error:"wrong_audience"},null,401);
  if(t.iss!=="accounts.google.com"&&t.iss!=="https://accounts.google.com")return json({error:"wrong_issuer"},null,401);
  if(t.email_verified!=="true"&&t.email_verified!==true)return json({error:"email_not_verified"},null,401);
  if(!t.sub)return json({error:"invalid_token"},null,401);

  var now=Math.floor(Date.now()/1000);
  var name=(t.name||t.given_name||t.email.split("@")[0]).slice(0,60);
  await env.DB.prepare(
    "INSERT INTO users(id,email,name,picture,created_at,last_seen) VALUES(?,?,?,?,?,?) "+
    "ON CONFLICT(id) DO UPDATE SET email=excluded.email,name=excluded.name,picture=excluded.picture,last_seen=excluded.last_seen"
  ).bind(t.sub,t.email,name,t.picture||"",now,now).run();

  var token=await sign({sub:t.sub,exp:now+SESSION_DAYS*86400},env.SESSION_SECRET);
  var cookie=COOKIE+"="+token+"; Path=/; Max-Age="+(SESSION_DAYS*86400)+"; HttpOnly; Secure; SameSite=Lax";
  return json({user:{id:t.sub,name:name,picture:t.picture||"",email:t.email}},{"Set-Cookie":cookie});
}

/* ---------- puntuaciones ---------- */
async function submitScore(req,env){
  var user=await currentUser(req,env);
  if(!user)return json({error:"unauthorized"},null,401);
  var body=await req.json().catch(function(){return {}});
  var day=parseInt(body.day,10), moves=parseInt(body.moves,10), hints=parseInt(body.hints,10)||0;
  var seconds=parseInt(body.seconds,10); if(!(seconds>=0)||seconds>86400)seconds=0;
  var today=dayNumber();
  if(!(day>=1)||day>today||day<today-1)return json({error:"bad_day"},null,400);   /* hoy o ayer (husos horarios) */
  if(!(moves>=1)||moves>999||hints<0||hints>99)return json({error:"bad_score"},null,400);
  var now=Math.floor(Date.now()/1000);
  /* Se conserva el mejor resultado del día: menos movidas, y a igualdad menos pistas */
  try{
    await env.DB.prepare(
      "INSERT INTO scores(user_id,day,moves,hints,seconds,created_at) VALUES(?,?,?,?,?,?) "+
      "ON CONFLICT(user_id,day) DO UPDATE SET moves=excluded.moves,hints=excluded.hints,seconds=excluded.seconds,created_at=excluded.created_at "+
      "WHERE excluded.moves<scores.moves OR (excluded.moves=scores.moves AND excluded.hints<scores.hints)"
    ).bind(user.id,day,moves,hints,seconds,now).run();
  }catch(e){
    /* base creada antes de existir la columna de tiempo: se guarda sin ella */
    await env.DB.prepare(
      "INSERT INTO scores(user_id,day,moves,hints,created_at) VALUES(?,?,?,?,?) "+
      "ON CONFLICT(user_id,day) DO UPDATE SET moves=excluded.moves,hints=excluded.hints,created_at=excluded.created_at "+
      "WHERE excluded.moves<scores.moves OR (excluded.moves=scores.moves AND excluded.hints<scores.hints)"
    ).bind(user.id,day,moves,hints,now).run();
  }
  var me=await myRank(env,user.id,day);
  return json({ok:true,day:day,me:me});
}

async function myRank(env,userId,day){
  var mine=await env.DB.prepare("SELECT moves,hints,created_at FROM scores WHERE user_id=? AND day=?").bind(userId,day).first();
  if(!mine)return null;
  var ahead=await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM scores WHERE day=? AND (moves<? OR (moves=? AND hints<?) OR (moves=? AND hints=? AND created_at<?))"
  ).bind(day,mine.moves,mine.moves,mine.hints,mine.moves,mine.hints,mine.created_at).first();
  var total=await env.DB.prepare("SELECT COUNT(*) AS n FROM scores WHERE day=?").bind(day).first();
  return {rank:(ahead.n||0)+1,total:total.n||0,moves:mine.moves,hints:mine.hints};
}

async function ranking(req,env,url){
  if(!env.DB)return json({error:"not_configured"},null,503);
  var day=parseInt(url.searchParams.get("day"),10)||dayNumber();
  var rows=await env.DB.prepare(
    "SELECT u.id,u.name,u.picture,s.moves,s.hints,s.created_at FROM scores s JOIN users u ON u.id=s.user_id "+
    "WHERE s.day=? ORDER BY s.moves ASC,s.hints ASC,s.created_at ASC LIMIT ?"
  ).bind(day,TOP).all();
  var user=await currentUser(req,env);
  var top=(rows.results||[]).map(function(r,i){
    return {rank:i+1,name:r.name,picture:r.picture,moves:r.moves,hints:r.hints,me:!!(user&&user.id===r.id)};
  });
  var total=await env.DB.prepare("SELECT COUNT(*) AS n FROM scores WHERE day=?").bind(day).first();
  return json({day:day,total:total.n||0,top:top,me:user?await myRank(env,user.id,day):null});
}
