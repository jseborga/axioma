/* ===========================================================
   THE FINAL TEST · ayudas con IA (plan Pro)
     GET  /api/ia/estado?org=ID       plan, cuota del mes y si la IA está configurada
     POST /api/ia/preguntas           { org_id, tema | texto | pdf (base64), n, nivel }
                                      → preguntas propuestas (no se guardan: se revisan
                                        en el importador del banco como las de Excel)
     POST /api/ia/revisar             { bank_id } → sugerencias para mejorar el banco
     GET  /api/admin/planes           planes de todas las instituciones (plataforma)
     POST /api/admin/planes/:org      { plan, cuota, hasta } (plataforma)
   Las explicaciones de las prácticas se generan en concursos.js con
   explicaciones(), que usa la misma cuota.

   El proveedor (Gemini de Google AI Studio por defecto, OpenRouter, OpenAI,
   Anthropic u otra API compatible) y el modelo se eligen en el panel de la
   plataforma; las claves van como Secrets en Cloudflare. Ver
   ia-proveedores.js. Sin clave, la IA queda desactivada. Con IA_PRUEBA=1
   (solo en desarrollo) se simulan las respuestas, sin llamar a ninguna API.
   Cada llamada gasta un uso de la cuota mensual de la institución.

     GET  /api/admin/ia               proveedores, claves presentes y el elegido (plataforma)
     POST /api/admin/ia               { proveedor, modelo } (plataforma)
     POST /api/admin/ia/probar        { proveedor?, modelo? } una llamada mínima de prueba
   =========================================================== */
import { rolOrg, esInvitado, esAdminPlataforma } from "./aula.js";
import { PROVEEDORES, configuracion, resumen, guarda, pideJSON } from "./ia-proveedores.js";

var MAX_PDF=12*1024*1024, MAX_TEXTO=60000;

function mes(){return new Date().toISOString().slice(0,7);}
function limpia(s,max){return String(s==null?"":s).replace(/\s+/g," ").trim().slice(0,max);}
/* la IA en uso: {proveedor, modelo, listo, prueba}; prueba = respuestas simuladas (desarrollo) */
async function ia(env){var c=await configuracion(env); c.prueba=!c.listo&&env.IA_PRUEBA==="1"; return c;}
export async function iaConfigurada(env){var c=await ia(env); return c.listo||c.prueba;}

/* ---------- plan y cuota ---------- */
export async function planDe(env,orgId){
  var p=null, u=null;
  try{
    p=await env.DB.prepare("SELECT * FROM org_planes WHERE org_id=?").bind(orgId).first();
    u=await env.DB.prepare("SELECT usos FROM ia_uso WHERE org_id=? AND mes=?").bind(orgId,mes()).first();
  }catch(e){return {plan:"gratis",pro:false,cuota:0,usados:0,disponibles:0,sin_tablas:true};}
  var pro=!!(p&&p.plan==="pro"&&(!p.hasta||p.hasta>Date.now()));
  var cuota=pro?(p.cuota||0):0, usados=u?u.usos:0;
  return {plan:pro?"pro":"gratis",pro:pro,cuota:cuota,usados:usados,disponibles:Math.max(0,cuota-usados),hasta:p&&p.hasta||null};
}
/* gasta un uso si queda cuota (de forma atómica); devuelve false si no hay */
async function gasta(env,orgId,cuota){
  var r=await env.DB.prepare("INSERT INTO ia_uso(org_id,mes,usos) VALUES(?,?,1) ON CONFLICT(org_id,mes) DO UPDATE SET usos=usos+1 WHERE usos<?")
    .bind(orgId,mes(),cuota).run();
  return !!(r.meta&&r.meta.changes===1);
}
async function devuelve(env,orgId){
  try{await env.DB.prepare("UPDATE ia_uso SET usos=MAX(0,usos-1) WHERE org_id=? AND mes=?").bind(orgId,mes()).run();}catch(e){}
}
/* comprueba permiso y cuota; si todo va bien, gasta un uso */
async function autoriza(env,user,orgId){
  if(!user)return {error:"unauthorized",st:401};
  if(esInvitado(user))return {error:"google_required",st:403};
  var rol=await rolOrg(env,orgId,user.id);
  if(rol!=="admin"&&rol!=="docente"&&rol!=="auxiliar")return {error:"forbidden",st:403};
  var cfg=await ia(env);
  if(!cfg.listo&&!cfg.prueba)return {error:"ia_not_configured",st:503};
  var p=await planDe(env,orgId);
  if(p.sin_tablas)return {error:"not_configured",st:503};
  if(!p.pro)return {error:"pro_required",st:402};
  if(!(await gasta(env,orgId,p.cuota)))return {error:"quota_exceeded",st:429,cuota:p.cuota};
  return {ok:true,cfg:cfg};
}


var H_PREGUNTAS={name:"entregar_preguntas",description:"Entrega las preguntas de opción múltiple generadas.",
  input_schema:{type:"object",properties:{preguntas:{type:"array",items:{type:"object",properties:{
    pregunta:{type:"string",description:"Enunciado claro, de hasta 200 caracteres."},
    correcta:{type:"string",description:"La única respuesta correcta."},
    incorrectas:{type:"array",items:{type:"string"},minItems:2,maxItems:4,description:"Distractores plausibles y claramente incorrectos."},
    nivel:{type:"integer",enum:[1,2,3],description:"1 fácil, 2 medio, 3 difícil."},
    tema:{type:"string",description:"Tema corto (hasta 40 caracteres)."},
    explicacion:{type:"string",description:"Por qué la correcta es correcta, en una o dos frases."}},
    required:["pregunta","correcta","incorrectas","nivel","tema"]}}},required:["preguntas"]}};
var SISTEMA_PREGUNTAS="Eres un docente experto que redacta preguntas de opción múltiple en español (variante latinoamericana, con tildes correctas) para evaluaciones escolares y universitarias en Bolivia. "+
  "Reglas: cada pregunta tiene una sola respuesta correcta e indiscutible; los distractores son plausibles, del mismo tipo que la correcta y claramente incorrectos; "+
  "nada de «todas las anteriores» ni «ninguna de las anteriores»; enunciados breves y sin ambigüedad; no repitas preguntas; "+
  "si se te da un texto o documento, las preguntas deben poder responderse con ese contenido y no inventes datos que no estén en él. "+
  "Entrega siempre el resultado con la herramienta entregar_preguntas.";

/* respuestas simuladas para desarrollo (IA_PRUEBA=1) */
function simulaPreguntas(tema,n,nivel){
  var out=[]; for(var i=1;i<=n;i++)out.push({pregunta:"¿Pregunta de prueba "+i+" sobre "+(tema||"el texto")+"?",correcta:"Respuesta correcta "+i,
    incorrectas:["Distractor A"+i,"Distractor B"+i,"Distractor C"+i],nivel:nivel||1+(i%3),tema:(tema||"Texto").slice(0,40),explicacion:"Explicación simulada "+i+"."});
  return {preguntas:out};
}

async function generaPreguntas(req,env,user,json){
  var b=await req.json().catch(function(){return {};});
  var orgId=String(b.org_id||""), n=Math.max(3,Math.min(30,parseInt(b.n,10)||10)), nivel=[1,2,3].indexOf(+b.nivel)>=0?+b.nivel:0;
  var tema=limpia(b.tema,300), texto=String(b.texto||"").slice(0,MAX_TEXTO), pdf=b.pdf?String(b.pdf):"";
  if(!tema&&texto.trim().length<80&&!pdf)return json({error:"ia_need_input"},null,400);
  if(pdf&&pdf.length*0.75>MAX_PDF)return json({error:"ia_file_too_big"},null,400);
  var a=await autoriza(env,user,orgId); if(!a.ok)return json({error:a.error,cuota:a.cuota},null,a.st);
  var pide="Genera exactamente "+n+" preguntas de opción múltiple (4 opciones: 1 correcta y 3 incorrectas)"+
    (nivel?" de nivel "+["","fácil","medio","difícil"][nivel]:" variando la dificultad (fácil, media y difícil)")+
    (tema?" sobre: «"+tema+"».":".")+(texto||pdf?" Basa todas las preguntas en el contenido adjunto.":"");
  var contenido=[];
  if(pdf)contenido.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:pdf.replace(/^data:[^,]*,/,"")}});
  if(texto)contenido.push({type:"text",text:"Contenido de referencia:\n\n"+texto});
  contenido.push({type:"text",text:pide});
  var r;
  try{ r=a.cfg.prueba?simulaPreguntas(tema,n,nivel):await pideJSON(env,a.cfg,SISTEMA_PREGUNTAS,contenido,H_PREGUNTAS,Math.min(16000,900+n*450)); }
  catch(e){ await devuelve(env,orgId); console.error("ia preguntas",e&&e.message);
    return json({error:/ia_pdf_unsupported/.test(String(e&&e.message))?"ia_pdf_unsupported":"ia_failed"},null,502); }
  /* al formato del importador (se revalida allí y de nuevo en el servidor al importar) */
  var items=(r.preguntas||[]).slice(0,n).map(function(p,i){return {fila:i+1,q:limpia(p.pregunta,300),correcta:limpia(p.correcta,200),
    otras:(p.incorrectas||[]).map(function(x){return limpia(x,200);}).filter(Boolean).slice(0,5),nivel:p.nivel,tema:limpia(p.tema,60),explicacion:limpia(p.explicacion,400)};});
  return json({ok:true,items:items,plan:await planDe(env,orgId)});
}

var H_REVISION={name:"entregar_revision",description:"Entrega la revisión del banco de preguntas.",
  input_schema:{type:"object",properties:{sugerencias:{type:"array",items:{type:"object",properties:{
    id:{type:"integer",description:"id de la pregunta revisada"},
    problema:{type:"string",description:"Qué falla: ambigüedad, error, respuesta dudosa, distractor demasiado obvio o también correcto, falta de tilde, nivel mal puesto…"},
    pregunta:{type:"string",description:"Enunciado mejorado (si hace falta)."},
    correcta:{type:"string",description:"Respuesta correcta mejorada (si hace falta)."},
    incorrectas:{type:"array",items:{type:"string"},description:"Distractores mejorados (si hace falta)."},
    nivel:{type:"integer",enum:[1,2,3]},tema:{type:"string"}},required:["id","problema"]}}},required:["sugerencias"]}};
async function revisaBanco(req,env,user,json){
  var b=await req.json().catch(function(){return {};});
  var bk=await env.DB.prepare("SELECT * FROM banks WHERE id=?").bind(parseInt(b.bank_id,10)||0).first();
  if(!bk)return json({error:"not_found"},null,404);
  var rol=user?await rolOrg(env,bk.org_id,user.id):null;
  if(!user||(bk.owner_id!==user.id&&rol!=="admin"))return json({error:"forbidden"},null,403);
  var qs=((await env.DB.prepare("SELECT id,q,opts,answer,level,topic FROM bank_questions WHERE bank_id=? ORDER BY id LIMIT 80").bind(bk.id).all()).results)||[];
  if(!qs.length)return json({error:"empty_pool"},null,400);
  var a=await autoriza(env,user,bk.org_id); if(!a.ok)return json({error:a.error,cuota:a.cuota},null,a.st);
  var lista=qs.map(function(q){var o=JSON.parse(q.opts);return {id:q.id,pregunta:q.q,correcta:o[q.answer],incorrectas:o.filter(function(_,i){return i!==q.answer;}),nivel:q.level,tema:q.topic||""};});
  var r;
  try{
    if(a.cfg.prueba)r={sugerencias:[{id:lista[0].id,problema:"Sugerencia simulada: el enunciado podría ser más preciso.",pregunta:lista[0].pregunta.replace(/\?$/,"")+" (versión mejorada)?"}]};
    else r=await pideJSON(env,a.cfg,"Eres un revisor experto de evaluaciones en español. Revisa cada pregunta de opción múltiple y señala SOLO las que tengan algún problema real: "+
      "respuesta incorrecta o discutible, más de una opción defendible, ambigüedad, faltas de ortografía o tildes, distractores absurdos o que delatan la respuesta, o nivel mal asignado. "+
      "Para cada una, explica el problema en una frase y propone la versión corregida solo de los campos que cambian. No incluyas las preguntas que están bien. Usa la herramienta entregar_revision.",
      [{type:"text",text:"Banco «"+bk.name+"»:\n"+JSON.stringify(lista)}],H_REVISION,12000);
  }catch(e){ await devuelve(env,bk.org_id); console.error("ia revisar",e&&e.message); return json({error:"ia_failed"},null,502); }
  var ids={}; qs.forEach(function(q){ids[q.id]=1;});
  return json({ok:true,revisadas:qs.length,sugerencias:(r.sugerencias||[]).filter(function(s){return ids[s.id];}).map(function(s){
    return {id:s.id,problema:limpia(s.problema,300),pregunta:s.pregunta?limpia(s.pregunta,300):null,correcta:s.correcta?limpia(s.correcta,200):null,
      incorrectas:Array.isArray(s.incorrectas)&&s.incorrectas.length?s.incorrectas.map(function(x){return limpia(x,200);}).filter(Boolean).slice(0,5):null,
      nivel:[1,2,3].indexOf(s.nivel)>=0?s.nivel:null,tema:s.tema?limpia(s.tema,60):null};}),plan:await planDe(env,bk.org_id)});
}

/* ---------- explicaciones para las prácticas ----------
   preguntas: [{clave, q, o, c}]. Devuelve {clave: texto}. Se guardan para
   no volver a pedirlas; una tanda nueva gasta un uso de la cuota. */
var H_EXPLICA={name:"entregar_explicaciones",description:"Entrega una explicación breve por pregunta.",
  input_schema:{type:"object",properties:{explicaciones:{type:"array",items:{type:"object",properties:{clave:{type:"string"},texto:{type:"string",description:"Una o dos frases (máx. 280 caracteres) que explican por qué la respuesta correcta es la correcta."}},required:["clave","texto"]}}},required:["explicaciones"]}};
export async function explicaciones(env,orgId,preguntas){
  var out={}; if(!preguntas.length)return out;
  try{
    var claves=preguntas.map(function(p){return p.clave;});
    var st=env.DB.prepare("SELECT clave,texto FROM ia_explicaciones WHERE clave IN ("+claves.map(function(){return "?";}).join(",")+")");
    var r=await st.bind.apply(st,claves).all();
    (r.results||[]).forEach(function(x){out[x.clave]=x.texto;});
    var faltan=preguntas.filter(function(p){return !out[p.clave];});
    var cfg=await ia(env);
    if(!faltan.length||!orgId||!(cfg.listo||cfg.prueba))return out;
    var p=await planDe(env,orgId); if(!p.pro||!(await gasta(env,orgId,p.cuota)))return out;
    var res;
    try{
      if(cfg.prueba)res={explicaciones:faltan.map(function(f){return {clave:f.clave,texto:"Explicación simulada: «"+f.o[f.c]+"» es la correcta."};})};
      else res=await pideJSON(env,cfg,"Eres un docente paciente. Para cada pregunta de opción múltiple, escribe en español una explicación breve (una o dos frases, máximo 280 caracteres) de por qué la respuesta correcta es la correcta, "+
        "útil para que un estudiante aprenda. No repitas el enunciado. Usa la herramienta entregar_explicaciones.",
        [{type:"text",text:JSON.stringify(faltan.map(function(f){return {clave:f.clave,pregunta:f.q,correcta:f.o[f.c],opciones:f.o};}))}],H_EXPLICA,Math.min(8000,400+faltan.length*160));
    }catch(e){await devuelve(env,orgId);console.error("ia explica",e&&e.message);return out;}
    var ok={}; faltan.forEach(function(f){ok[f.clave]=1;}); var now=Date.now(), ops=[];
    (res.explicaciones||[]).forEach(function(x){ if(!ok[x.clave]||!x.texto)return; var t=limpia(x.texto,400); out[x.clave]=t;
      ops.push(env.DB.prepare("INSERT OR REPLACE INTO ia_explicaciones(clave,texto,created_at) VALUES(?,?,?)").bind(x.clave,t,now)); });
    if(ops.length)await env.DB.batch(ops);
  }catch(e){console.error("explicaciones",e&&e.message);}
  return out;
}

/* ---------- planes (administración de la plataforma) ---------- */
async function planes(env,user,json){
  if(!esAdminPlataforma(env,user))return json({error:"forbidden"},null,403);
  var r=((await env.DB.prepare("SELECT p.*,(SELECT usos FROM ia_uso u WHERE u.org_id=p.org_id AND u.mes=?) AS usados FROM org_planes p").bind(mes()).all()).results)||[];
  var out={}; r.forEach(function(p){out[p.org_id]={plan:p.plan,cuota:p.cuota,hasta:p.hasta,usados:p.usados||0,pro:p.plan==="pro"&&(!p.hasta||p.hasta>Date.now())};});
  var c=await ia(env);
  return json({planes:out,ia:c.listo||c.prueba,prueba:c.prueba,proveedor:c.nombre,modelo:c.modelo});
}
/* ---------- proveedor de IA (administración de la plataforma) ---------- */
async function verIA(env,user,json){
  if(!esAdminPlataforma(env,user))return json({error:"forbidden"},null,403);
  var r=await resumen(env); r.prueba=!r.actual.listo&&env.IA_PRUEBA==="1"; return json(r);
}
async function ponIA(req,env,user,json){
  if(!esAdminPlataforma(env,user))return json({error:"forbidden"},null,403);
  var b=await req.json().catch(function(){return {};}), p=String(b.proveedor||"");
  if(!PROVEEDORES[p])return json({error:"bad_provider"},null,400);
  var m=String(b.modelo||"").trim();
  if(m&&!/^[A-Za-z0-9._:\/@+-]{1,120}$/.test(m))return json({error:"bad_model"},null,400);
  try{await guarda(env,user,p,m);}catch(e){ if(/no such table/i.test(String(e&&e.message)))return json({error:"settings_not_configured"},null,503); throw e; }
  return verIA(env,user,json);
}
/* una llamada mínima para comprobar clave y modelo (no gasta cuota de ninguna institución) */
var H_PRUEBA={name:"responder",description:"Responde a la prueba.",input_schema:{type:"object",properties:{ok:{type:"boolean"},saludo:{type:"string"}},required:["ok","saludo"]}};
async function pruebaIA(req,env,user,json){
  if(!esAdminPlataforma(env,user))return json({error:"forbidden"},null,403);
  var b=await req.json().catch(function(){return {};}), cfg=await ia(env);
  if(b.proveedor&&PROVEEDORES[b.proveedor]){
    var r0=await resumen(env), x=r0.proveedores.filter(function(q){return q.id===b.proveedor;})[0];
    cfg={proveedor:b.proveedor,nombre:x.nombre,modelo:String(b.modelo||x.modelo||"").trim(),listo:x.clave};
  }
  if(!cfg.listo)return json({ok:false,error:"ia_not_configured",proveedor:cfg.nombre});
  if(!cfg.modelo)return json({ok:false,error:"bad_model",proveedor:cfg.nombre});
  var t0=Date.now();
  try{
    var r=await pideJSON(env,cfg,"Eres una prueba de conexión. Contesta con la herramienta o el JSON pedido.",[{type:"text",text:"Saluda en español en cinco palabras o menos y pon ok en true."}],H_PRUEBA,300);
    return json({ok:!!(r&&(r.ok||r.saludo)),proveedor:cfg.nombre,modelo:cfg.modelo,ms:Date.now()-t0,saludo:String(r&&r.saludo||"").slice(0,80)});
  }catch(e){
    return json({ok:false,proveedor:cfg.nombre,modelo:cfg.modelo,ms:Date.now()-t0,detalle:String(e&&e.message||e).slice(0,300)});
  }
}
async function ponPlan(req,env,user,orgId,json){
  if(!esAdminPlataforma(env,user))return json({error:"forbidden"},null,403);
  var o=await env.DB.prepare("SELECT id FROM orgs WHERE id=?").bind(orgId).first(); if(!o)return json({error:"not_found"},null,404);
  var b=await req.json().catch(function(){return {};});
  var plan=b.plan==="pro"?"pro":"gratis", cuota=Math.max(0,Math.min(100000,parseInt(b.cuota,10)||0)), hasta=parseInt(b.hasta,10)||null;
  await env.DB.prepare("INSERT INTO org_planes(org_id,plan,cuota,hasta,updated_at,updated_by) VALUES(?,?,?,?,?,?) ON CONFLICT(org_id) DO UPDATE SET plan=excluded.plan,cuota=excluded.cuota,hasta=excluded.hasta,updated_at=excluded.updated_at,updated_by=excluded.updated_by")
    .bind(orgId,plan,cuota,hasta,Date.now(),user.id).run();
  return json({ok:true,plan:await planDe(env,orgId)});
}

export async function handleIA(req,env,url,path,ctx){
  var json=ctx.json, user=ctx.user, m;
  if(!env.DB)return json({error:"not_configured"},null,503);
  try{
    if(path==="/ia/estado"&&req.method==="GET"){
      var org=String(url.searchParams.get("org")||"");
      if(!user||!(await rolOrg(env,org,user.id)))return json({error:"forbidden"},null,403);
      var p=await planDe(env,org); p.ia=await iaConfigurada(env); return json(p);
    }
    if(path==="/ia/preguntas"&&req.method==="POST")return await generaPreguntas(req,env,user,json);
    if(path==="/ia/revisar"&&req.method==="POST")return await revisaBanco(req,env,user,json);
    if(path==="/admin/planes"&&req.method==="GET")return await planes(env,user,json);
    if(path==="/admin/ia"&&req.method==="GET")return await verIA(env,user,json);
    if(path==="/admin/ia"&&req.method==="POST")return await ponIA(req,env,user,json);
    if(path==="/admin/ia/probar"&&req.method==="POST")return await pruebaIA(req,env,user,json);
    if((m=path.match(/^\/admin\/planes\/([A-Z0-9]{6})$/))&&req.method==="POST")return await ponPlan(req,env,user,m[1],json);
  }catch(e){
    if(/no such table/i.test(String(e&&e.message)))return json({error:"not_configured"},null,503);
    throw e;
  }
  return json({error:"not_found"},null,404);
}
