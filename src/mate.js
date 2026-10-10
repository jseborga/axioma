/* ===========================================================
   THE FINAL TEST · Matemática Montessori · servidor
     GET    /api/mate/perfiles        los perfiles de niñas y niños de la cuenta
     PUT    /api/mate/perfiles/:id    { nombre, avatar, etapa, datos } guarda uno
     DELETE /api/mate/perfiles/:id    lo borra
     POST   /api/mate/explica         { c, n, f, seed, resp } una explicación con IA (matemática)
                                      { materia:"ciencias", u, k, seed, resp } (ciencias)
   Los perfiles viven en el dispositivo; con una cuenta de Google se copian
   aquí para usarlos en otros dispositivos (gana la versión más nueva). Solo
   se guarda un apodo, el animalito, la etapa y el avance.
   La explicación con IA se pide sobre el ejercicio que el servidor vuelve a
   generar con el mismo motor (c, n, f, seed): no se confía en el texto que
   manda el navegador. Se guarda en ia_explicaciones y cada cuenta tiene un
   límite diario (MATE_IA_DIA, 20 por defecto). Con IA_PRUEBA=1 se simula.
   =========================================================== */
import "../public/mate-motor.js";
import "../public/ingles-motor.js";
import "../public/ciencias-datos.js";
import "../public/ciencias-motor.js";
import { esInvitado } from "./aula.js";
import { configuracion, pideJSON } from "./ia-proveedores.js";

var M=globalThis.AxMate, I=globalThis.AxIngles, K=globalThis.AxCiencias;
var MAX_PERFILES=8, MAX_DATOS=150000;

function dia(){return new Date().toISOString().slice(0,10);}
function limpia(s,max){return String(s==null?"":s).replace(/\s+/g," ").trim().slice(0,max);}
function idOk(id){return /^m[a-z0-9]{6,30}$/.test(id);}
function limite(env){var n=parseInt(env.MATE_IA_DIA,10); return n>=0?n:20;}

export async function handleMate(req,env,url,path,ctx){
  var j=ctx.json, user=ctx.user, m;
  if(!env.DB)return j({error:"not_configured"},null,503);
  if(!user)return j({error:"unauthorized"},null,401);
  if(esInvitado(user))return j({error:"google_required"},null,403);
  try{
    if(path==="/mate/perfiles"&&req.method==="GET")return await lista(env,user,j);
    if((m=path.match(/^\/mate\/perfiles\/([a-z0-9]+)$/))){
      if(!idOk(m[1]))return j({error:"bad_id"},null,400);
      if(req.method==="PUT")return await guarda(req,env,user,m[1],j);
      if(req.method==="DELETE")return await borra(env,user,m[1],j);
    }
    if(path==="/mate/explica"&&req.method==="POST")return await explica(req,env,user,j);
  }catch(e){
    if(/no such table: mate_/i.test(String(e&&e.message)))return j({error:"mate_not_configured"},null,503);
    throw e;
  }
  return j({error:"not_found"},null,404);
}

/* ---------- perfiles ---------- */
async function lista(env,user,j){
  var r=((await env.DB.prepare("SELECT id,datos,updated_at FROM mate_perfiles WHERE user_id=? ORDER BY created_at").bind(user.id).all()).results)||[];
  return j({perfiles:r.map(function(x){var d=null; try{d=JSON.parse(x.datos);}catch(e){} return {id:x.id,datos:d,updated_at:x.updated_at};}).filter(function(x){return x.datos;})});
}
async function guarda(req,env,user,id,j){
  var b=await req.json().catch(function(){return null;});
  if(!b||typeof b.datos!=="object"||!b.datos||Array.isArray(b.datos))return j({error:"bad_request"},null,400);
  var d=b.datos, nombre=limpia(b.nombre||d.nombre,20), etapa=parseInt(b.etapa,10);
  if(!nombre)return j({error:"bad_name"},null,400);
  if(!(etapa>=0&&etapa<M.ETAPAS.length))etapa=0;
  if(d.prog!=null&&(typeof d.prog!=="object"||Array.isArray(d.prog)))return j({error:"bad_request"},null,400);
  /* solo lo que usa el juego, con lo que se muestra ya limpio */
  var datos={id:id,nombre:nombre,avatar:limpia(b.avatar||d.avatar,8),etapa:etapa,prog:{},refl:[],dias:{},creado:+d.creado||Date.now(),upd:+d.upd||Date.now()};
  Object.keys(d.prog||{}).forEach(function(k){var p=d.prog[k], c=M.POR_ID[k]; if(!c||!p||typeof p!=="object")return;
    var e=function(x,lo,hi){x=Math.floor(+x||0); return Math.max(lo,Math.min(hi,x));};
    datos.prog[k]={f:e(p.f,0,2),n:e(p.n,1,c.nmax),h:(Array.isArray(p.h)?p.h:[]).slice(-10).map(function(x){return x?1:0;}),a:e(p.a,0,1e6),i:e(p.i,0,1e6),
      racha:e(p.racha,0,1e6),en:e(p.en,0,1e6),dom:!!p.dom,ref:e(p.ref,0,1e6),at:e(p.at,0,9e15)};});
  (Array.isArray(d.refl)?d.refl:[]).slice(-60).forEach(function(r){if(r&&M.POR_ID[r.c])datos.refl.push({c:r.c,t:+r.t||0,ok:+r.ok||0,n:+r.n||0,s:r.s==null?null:Math.max(0,Math.min(3,+r.s||0)),d:limpia(r.d,12),nota:limpia(r.nota,120)});});
  if(d.dias&&typeof d.dias==="object")Object.keys(d.dias).filter(function(k){return /^\d{4}-\d\d-\d\d$/.test(k);}).sort().slice(-120).forEach(function(k){datos.dias[k]=Math.max(0,Math.min(10000,+d.dias[k]||0));});
  if(d.ing&&typeof d.ing==="object"&&!Array.isArray(d.ing))datos.ing=ingles(d.ing);
  if(d.cie&&typeof d.cie==="object"&&!Array.isArray(d.cie))datos.cie=ciencias(d.cie);
  var txt=JSON.stringify(datos);
  if(txt.length>MAX_DATOS)return j({error:"too_large"},null,413);
  var ya=await env.DB.prepare("SELECT updated_at FROM mate_perfiles WHERE user_id=? AND id=?").bind(user.id,id).first();
  if(!ya){
    var n=await env.DB.prepare("SELECT COUNT(*) AS n FROM mate_perfiles WHERE user_id=?").bind(user.id).first();
    if(n&&n.n>=MAX_PERFILES)return j({error:"too_many"},null,400);
  }
  var now=Date.now();
  await env.DB.prepare("INSERT INTO mate_perfiles(user_id,id,nombre,avatar,etapa,datos,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) "+
    "ON CONFLICT(user_id,id) DO UPDATE SET nombre=excluded.nombre,avatar=excluded.avatar,etapa=excluded.etapa,datos=excluded.datos,updated_at=excluded.updated_at")
    .bind(user.id,id,nombre,datos.avatar,etapa,txt,now,now).run();
  return j({ok:true,updated_at:now});
}
/* el avance en inglés: lecciones, fuerza de cada palabra, XP, días y cómo se sintió */
function ingles(g){
  var e=function(x,lo,hi){x=Math.floor(+x||0); return Math.max(lo,Math.min(hi,x));}, o={lec:{},pal:{},xp:e(g.xp,0,1e7),dias:{},refl:[]};
  if(g.lec&&typeof g.lec==="object")Object.keys(g.lec).forEach(function(k){var l=g.lec[k]; if(I.POR_ID[k]&&l&&typeof l==="object")o.lec[k]={e:e(l.e,0,3),v:e(l.v,0,1e5)};});
  if(g.pal&&typeof g.pal==="object")Object.keys(g.pal).forEach(function(k){var p=g.pal[k]; if(I.PAL[k]&&p&&typeof p==="object")o.pal[k]={f:e(p.f,0,5),e:e(p.e,0,1e5),v:e(p.v,0,1e6),t:e(p.t,0,9e15)};});
  if(g.dias&&typeof g.dias==="object")Object.keys(g.dias).filter(function(k){return /^\d{4}-\d\d-\d\d$/.test(k);}).sort().slice(-120).forEach(function(k){o.dias[k]=e(g.dias[k],0,1e5);});
  (Array.isArray(g.refl)?g.refl:[]).slice(-30).forEach(function(r){if(r&&(I.POR_ID[r.l]||r.l==="repaso"))o.refl.push({l:r.l,t:e(r.t,0,9e15),ok:e(r.ok,0,1000),n:e(r.n,0,1000),s:r.s==null?null:e(r.s,0,3)});});
  return o;
}
/* el avance en ciencias: lecciones, lo que costó, XP, días, cómo se sintió y el nivel elegido */
function ciencias(g){
  var e=function(x,lo,hi){x=Math.floor(+x||0); return Math.max(lo,Math.min(hi,x));}, o={lec:{},fallos:{},xp:e(g.xp,0,1e7),dias:{},refl:[],nivel:e(g.nivel,0,K.NIVELES.length)};
  if(g.lec&&typeof g.lec==="object")Object.keys(g.lec).forEach(function(k){var l=g.lec[k]; if(K.POR_ID[k]&&l&&typeof l==="object")o.lec[k]={e:e(l.e,0,3),v:e(l.v,0,1e5)};});
  if(g.fallos&&typeof g.fallos==="object")Object.keys(g.fallos).slice(0,400).forEach(function(k){var p=k.split(":"), u=K.POR_U[p[0]]; if(u&&/^\d+$/.test(p[1]||"")&&u.q[+p[1]])o.fallos[k]=e(g.fallos[k],0,1000);});
  if(g.dias&&typeof g.dias==="object")Object.keys(g.dias).filter(function(k){return /^\d{4}-\d\d-\d\d$/.test(k);}).sort().slice(-120).forEach(function(k){o.dias[k]=e(g.dias[k],0,1e5);});
  (Array.isArray(g.refl)?g.refl:[]).slice(-30).forEach(function(r){if(r&&(K.POR_ID[r.l]||r.l==="repaso"))o.refl.push({l:r.l,t:e(r.t,0,9e15),ok:e(r.ok,0,1000),n:e(r.n,0,1000),s:r.s==null?null:e(r.s,0,3)});});
  return o;
}
async function borra(env,user,id,j){
  await env.DB.prepare("DELETE FROM mate_perfiles WHERE user_id=? AND id=?").bind(user.id,id).run();
  return j({ok:true});
}

/* ---------- explicación con IA ---------- */
var H_EXPLICA={name:"entregar_explicacion",description:"Entrega la explicación para la niña o el niño.",
  input_schema:{type:"object",properties:{
    explicacion:{type:"string",description:"La explicación paso a paso, en frases cortas y sencillas (máx. 450 caracteres)."},
    ejemplo_concreto:{type:"string",description:"Un ejemplo con el material Montessori u objetos cotidianos (máx. 250 caracteres)."},
    pregunta_para_probar:{type:"string",description:"Una pregunta parecida y más sencilla para que lo intente (máx. 160 caracteres), sin la respuesta."}},
    required:["explicacion","ejemplo_concreto","pregunta_para_probar"]}};
/* lo que se pide a la IA según la materia: {clave, sistema, datos, simulada} */
var TONO="Construye confianza: valora el intento, nunca digas que algo «es fácil» ni hagas sentir mal por equivocarse. "+
  "Si la respuesta del niño o la niña es incorrecta, ayúdale a ver dónde estuvo la confusión sin repetir «está mal». No uses LaTeX ni markdown. Usa la herramienta entregar_explicacion.";
function pideMate(b){
  var c=M.POR_ID[String(b.c||"")]; if(!c)return null;
  var n=parseInt(b.n,10), f=parseInt(b.f,10), seed=Number(b.seed);
  if(!(n>=1&&n<=c.nmax)||!(f>=0&&f<=2)||!(seed>=0&&seed<4294967296)||Math.floor(seed)!==seed)return null;
  var it=M.ejercicio(c.id,n,f,seed), resp=textoDe(it,b.resp), E=M.ETAPAS[c.e];
  return {clave:"mate:"+c.id+":"+n+":"+f+":"+seed+":"+(resp==null?"-":resp),
    sistema:"Eres una guía Montessori cálida y paciente. Explicas matemática a niñas y niños de "+E.sub+" ("+E.nom+"), en español sencillo de Latinoamérica, con frases cortas. "+
      "Parte de lo concreto (el material Montessori o cosas cotidianas) y luego pasa a los números. Muestra el razonamiento paso a paso. "+TONO,
    datos:{concepto:c.nom,objetivo:c.obj,material:c.mat,idea_clave:c.pres,ejercicio:it.qa||it.q,respuesta_correcta:correctaDe(it),respuesta_del_estudiante:resp,pasos_del_juego:it.ex},
    simulada:{explicacion:"(Simulada) "+it.ex.join(" "),ejemplo_concreto:"Usa el material: "+c.mat+".",pregunta_para_probar:"¿Lo intentas con un número más pequeño?"}};
}
function pideCiencias(b){
  var u=K.POR_U[String(b.u||"")], k=parseInt(b.k,10), seed=Number(b.seed);
  if(!u||!(k>=0&&k<u.q.length)||!(seed>=0&&seed<4294967296)||Math.floor(seed)!==seed)return null;
  var it=K.item(u,k,seed); if(!it||it.t==="sim"||it.t==="parejas")return null;
  var resp=null;
  if(b.resp!=null&&b.resp!==""){if(it.ops){var o=it.ops[+b.resp]; resp=o==null?null:o;} else if(it.t==="num")resp=limpia(b.resp,20);}
  var N=K.NIVELES[u.nivel-1];
  return {clave:"cie:"+u.id+":"+k+":"+seed+":"+(resp==null?"-":resp),
    sistema:"Eres una guía de ciencias cálida y paciente, con el método Montessori. Explicas ciencias naturales, física y química a estudiantes del nivel «"+N.nom+"» ("+N.sub+"), "+
      "en español sencillo de Latinoamérica, con frases cortas. Relaciona la idea con algo que se pueda ver o tocar en casa o en Bolivia y, en los cálculos, muestra la fórmula y cada paso. "+TONO,
    datos:{unidad:u.nom,ideas_clave:u.ideas.map(function(i){return i[1]+": "+i[2];}),ejercicio:it.q,respuesta_correcta:K.respuestaTxt(it),respuesta_del_estudiante:resp,explicacion_del_juego:it.ex},
    simulada:{explicacion:"(Simulada) "+it.ex,ejemplo_concreto:"Prueba el experimento: "+u.casa.nom+".",pregunta_para_probar:"¿Puedes dar otro ejemplo de tu casa?"}};
}
/* lo que se ve de una respuesta: el texto de la opción o el número */
function textoDe(it,resp){
  var r=it.r;
  if(r.t==="op"){var o=r.ops[+resp]; if(o==null)return null; if(typeof o==="string")return o; return o.v&&o.v.t==="objetos"?"un grupo de "+o.v.n:"otra opción";}
  if(resp==null||resp==="")return null;
  return limpia(resp,20);
}
function correctaDe(it){var r=it.r; if(r.t==="op"){var o=r.ops[r.ok]; return typeof o==="string"?o:(o.v&&o.v.t==="objetos"?"el grupo de "+o.v.n:"la opción "+(r.ok+1));} return M.respuestaTxt(it);}
async function gasta(env,user,max){
  var r=await env.DB.prepare("INSERT INTO mate_ia(user_id,dia,usos) VALUES(?,?,1) ON CONFLICT(user_id,dia) DO UPDATE SET usos=usos+1 WHERE usos<?").bind(user.id,dia(),max).run();
  return !!(r.meta&&r.meta.changes===1);
}
async function devuelve(env,user){try{await env.DB.prepare("UPDATE mate_ia SET usos=MAX(0,usos-1) WHERE user_id=? AND dia=?").bind(user.id,dia()).run();}catch(e){}}
async function explica(req,env,user,j){
  var b=await req.json().catch(function(){return {};});
  var P=b.materia==="ciencias"?pideCiencias(b):pideMate(b);
  if(!P)return j({error:"bad_request"},null,400);
  var clave=P.clave;
  var ya=await env.DB.prepare("SELECT texto FROM ia_explicaciones WHERE clave=?").bind(clave).first();
  if(ya){try{var g=JSON.parse(ya.texto); g.guardada=true; return j(g);}catch(e){}}
  var cfg=await configuracion(env), prueba=!cfg.listo&&env.IA_PRUEBA==="1";
  if(!cfg.listo&&!prueba)return j({error:"ia_not_configured"},null,503);
  if(!(await gasta(env,user,limite(env))))return j({error:"limit"},null,429);
  var res;
  try{
    if(prueba)res=P.simulada;
    else res=await pideJSON(env,cfg,P.sistema,[{type:"text",text:JSON.stringify(P.datos)}],H_EXPLICA,900);
  }catch(e){await devuelve(env,user); console.error("mate explica",e&&e.message); return j({error:"ia_failed"},null,502);}
  var out={explicacion:limpia(res&&res.explicacion,600),ejemplo:limpia(res&&res.ejemplo_concreto,320),pregunta:limpia(res&&res.pregunta_para_probar,220)};
  if(!out.explicacion){await devuelve(env,user); return j({error:"ia_failed"},null,502);}
  if(!prueba)await env.DB.prepare("INSERT OR REPLACE INTO ia_explicaciones(clave,texto,created_at) VALUES(?,?,?)").bind(clave,JSON.stringify(out),Date.now()).run();
  return j(out);
}
