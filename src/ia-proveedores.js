/* ===========================================================
   THE FINAL TEST · proveedores de IA
   Las ayudas del plan Pro (generar y revisar preguntas, explicaciones)
   piden siempre lo mismo: un sistema, un contenido (texto y, a veces,
   un PDF) y un esquema JSON de la respuesta. Aquí se traduce esa
   petición a cada API:

     gemini      Google AI Studio (Gemini) · por defecto
     openrouter  OpenRouter (cientos de modelos con una sola clave)
     openai      OpenAI
     anthropic   Anthropic (Claude)
     compatible  cualquier API compatible con la de OpenAI (Groq,
                 DeepSeek, Mistral, Together, Ollama…) con AI_BASE_URL

   Las claves van SIEMPRE como Secrets en Cloudflare (nunca en la base de
   datos ni en el navegador). El proveedor y el modelo se eligen en el
   panel de la plataforma (tabla ajustes_plataforma) o con las variables
   AI_PROVIDER y <PROVEEDOR>_MODEL; si no se elige nada, se usa Gemini si
   está su clave y, si no, el primer proveedor que tenga clave.
   =========================================================== */

export var PROVEEDORES={
  gemini:{nombre:"Google AI Studio (Gemini)",claves:["GEMINI_API_KEY","GOOGLE_AI_API_KEY"],modeloEnv:"GEMINI_MODEL",defecto:"gemini-flash-latest",pdf:true,
    donde:"aistudio.google.com → Get API key",sugeridos:["gemini-flash-latest","gemini-flash-lite-latest","gemini-pro-latest","gemini-2.5-flash","gemini-2.5-pro"]},
  openrouter:{nombre:"OpenRouter",claves:["OPENROUTER_API_KEY"],modeloEnv:"OPENROUTER_MODEL",defecto:"openrouter/auto",pdf:true,
    donde:"openrouter.ai → Keys",sugeridos:["openrouter/auto","google/gemini-2.5-flash","openai/gpt-4o-mini","deepseek/deepseek-chat","meta-llama/llama-3.3-70b-instruct"]},
  openai:{nombre:"OpenAI",claves:["OPENAI_API_KEY"],modeloEnv:"OPENAI_MODEL",defecto:"gpt-4o-mini",pdf:true,
    donde:"platform.openai.com → API keys",sugeridos:["gpt-4o-mini","gpt-4o","gpt-4.1-mini"]},
  anthropic:{nombre:"Anthropic (Claude)",claves:["ANTHROPIC_API_KEY"],modeloEnv:"ANTHROPIC_MODEL",defecto:"",pdf:true,
    donde:"console.anthropic.com → API Keys",sugeridos:[]},
  compatible:{nombre:"Otra API compatible con OpenAI",claves:["AI_API_KEY"],modeloEnv:"AI_MODEL",defecto:"",pdf:false,
    donde:"la de tu proveedor; AI_BASE_URL es su dirección, p. ej. https://api.groq.com/openai/v1",sugeridos:[]}
};
export var ORDEN=["gemini","openrouter","openai","anthropic","compatible"];

function clave(env,p){var c=PROVEEDORES[p].claves; for(var i=0;i<c.length;i++)if(env[c[i]])return env[c[i]]; return "";}
function base(env){return String(env.AI_BASE_URL||"").trim().replace(/\/+$/,"");}
/* qué está listo para usar: la clave (y, en «compatible», la dirección) */
export function tieneClave(env,p){return !!clave(env,p)&&(p!=="compatible"||/^https?:\/\//.test(base(env)));}

/* ajustes guardados desde el panel (si la tabla existe) */
async function guardados(env){
  try{var r=await env.DB.prepare("SELECT clave,valor FROM ajustes_plataforma WHERE clave IN ('ia_proveedor','ia_modelos')").all(), o={};
    (r.results||[]).forEach(function(x){o[x.clave]=x.valor;}); return {proveedor:o.ia_proveedor||"",modelos:o.ia_modelos?JSON.parse(o.ia_modelos):{},tabla:true};}
  catch(e){return {proveedor:"",modelos:{},tabla:false};}
}
/* el modelo de un proveedor: el del panel, el de su variable o el de por defecto
   (AI_MODEL, la variable de siempre, sirve para Anthropic y para «compatible») */
function modeloDe(env,p,g){
  var d=PROVEEDORES[p];
  return String((g.modelos&&g.modelos[p])||env[d.modeloEnv]||(p==="anthropic"?env.AI_MODEL:"")||d.defecto||"").trim();
}
/* la configuración en uso: {proveedor, modelo, listo, fuente} */
export async function configuracion(env){
  var g=await guardados(env), p=g.proveedor, fuente="panel";
  if(!PROVEEDORES[p]){p=String(env.AI_PROVIDER||"").trim().toLowerCase(); fuente="variable";}
  if(!PROVEEDORES[p]){
    fuente="automático";
    p=tieneClave(env,"gemini")?"gemini":(ORDEN.filter(function(x){return tieneClave(env,x);})[0]||"gemini");
  }
  var m=modeloDe(env,p,g);
  return {proveedor:p,nombre:PROVEEDORES[p].nombre,modelo:m,listo:tieneClave(env,p)&&!!m,fuente:fuente,tabla:g.tabla,guardados:g};
}
/* para el panel: todos los proveedores, con lo que tienen y lo que falta */
export async function resumen(env){
  var c=await configuracion(env);
  return {actual:{proveedor:c.proveedor,nombre:c.nombre,modelo:c.modelo,listo:c.listo,fuente:c.fuente},tabla:c.tabla,
    proveedores:ORDEN.map(function(p){var d=PROVEEDORES[p];
      return {id:p,nombre:d.nombre,clave:tieneClave(env,p),secretos:d.claves.concat(p==="compatible"?["AI_BASE_URL"]:[]),donde:d.donde,
        modelo:modeloDe(env,p,c.guardados),defecto:d.defecto,sugeridos:d.sugeridos,pdf:d.pdf};})};
}
export async function guarda(env,user,proveedor,modelo){
  var now=Date.now(), modelos=(await guardados(env)).modelos||{};
  modelos[proveedor]=String(modelo||"").trim().slice(0,120);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO ajustes_plataforma(clave,valor,updated_at,updated_by) VALUES('ia_proveedor',?,?,?) ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor,updated_at=excluded.updated_at,updated_by=excluded.updated_by").bind(proveedor,now,user.id),
    env.DB.prepare("INSERT INTO ajustes_plataforma(clave,valor,updated_at,updated_by) VALUES('ia_modelos',?,?,?) ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor,updated_at=excluded.updated_at,updated_by=excluded.updated_by").bind(JSON.stringify(modelos),now,user.id)]);
}

/* ===========================================================
   La petición, en cada formato
   contenido: [{type:"text",text}, {type:"document",source:{media_type,data}}]
   herramienta: {name, description, input_schema} (JSON Schema)
   =========================================================== */
function falla(proveedor,status,texto){
  var e=new Error(proveedor+" "+status+": "+String(texto||"").slice(0,300)); e.status=status; e.proveedor=proveedor; return e;
}
/* si un modelo contesta con texto en vez de JSON puro, se busca el objeto */
function sacaJSON(t){
  t=String(t||"").trim().replace(/^```(?:json)?\s*/i,"").replace(/```\s*$/,"");
  try{return JSON.parse(t);}catch(e){}
  var i=t.indexOf("{"), j=t.lastIndexOf("}");
  if(i>=0&&j>i){try{return JSON.parse(t.slice(i,j+1));}catch(e){}}
  throw new Error("La IA no devolvió JSON válido.");
}
function pdfDe(contenido){return contenido.filter(function(c){return c.type==="document";})[0]||null;}

/* ---------- Gemini (Google AI Studio) ---------- */
/* su esquema es un subconjunto de OpenAPI: tipos en mayúsculas y enum solo en textos */
function esquemaGemini(s){
  if(!s||typeof s!=="object")return s;
  var o={type:String(s.type||"string").toUpperCase()};
  if(s.description)o.description=s.description;
  if(s.enum&&o.type==="STRING")o.enum=s.enum.map(String);
  if(s.properties){o.properties={}; Object.keys(s.properties).forEach(function(k){o.properties[k]=esquemaGemini(s.properties[k]);});}
  if(s.required)o.required=s.required.slice();
  if(s.items)o.items=esquemaGemini(s.items);
  if(s.minItems!=null)o.minItems=s.minItems; if(s.maxItems!=null)o.maxItems=s.maxItems;
  return o;
}
async function gemini(env,cfg,sistema,contenido,herr){
  var partes=contenido.map(function(c){return c.type==="document"?{inline_data:{mime_type:c.source.media_type,data:c.source.data}}:{text:c.text};});
  var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(cfg.modelo)+":generateContent",{method:"POST",
    headers:{"x-goog-api-key":clave(env,"gemini"),"content-type":"application/json"},
    body:JSON.stringify({systemInstruction:{parts:[{text:sistema}]},contents:[{role:"user",parts:partes}],
      generationConfig:{responseMimeType:"application/json",responseSchema:esquemaGemini(herr.input_schema),temperature:0.4}})});
  if(!r.ok)throw falla("Gemini",r.status,await r.text().catch(function(){return "";}));
  var j=await r.json(), c=j.candidates&&j.candidates[0];
  var t=c&&c.content&&(c.content.parts||[]).map(function(p){return p.text||"";}).join("");
  if(!t)throw new Error("Gemini no devolvió respuesta"+(c&&c.finishReason?" ("+c.finishReason+")":"")+".");
  return sacaJSON(t);
}

/* ---------- OpenAI, OpenRouter y compatibles (chat completions) ---------- */
async function chat(env,cfg,sistema,contenido,herr,maxTokens){
  var p=cfg.proveedor, url=p==="openai"?"https://api.openai.com/v1":p==="openrouter"?"https://openrouter.ai/api/v1":base(env);
  var pdf=pdfDe(contenido);
  if(pdf&&!PROVEEDORES[p].pdf)throw falla(PROVEEDORES[p].nombre,415,"ia_pdf_unsupported");
  var partes=contenido.map(function(c){return c.type==="document"?
    {type:"file",file:{filename:"documento.pdf",file_data:"data:"+c.source.media_type+";base64,"+c.source.data}}:{type:"text",text:c.text};});
  var h={"Authorization":"Bearer "+clave(env,p),"content-type":"application/json"};
  if(p==="openrouter"){h["X-Title"]="The Final Test";}
  function cuerpo(conHerramienta){
    var b={model:cfg.modelo,messages:[{role:"system",content:sistema+(conHerramienta?"":"\n\nResponde SOLO con un objeto JSON que cumpla este esquema, sin texto alrededor:\n"+JSON.stringify(herr.input_schema))},
      {role:"user",content:partes}]};
    if(p==="openai")b.max_completion_tokens=maxTokens; else b.max_tokens=maxTokens;
    if(conHerramienta){b.tools=[{type:"function",function:{name:herr.name,description:herr.description,parameters:herr.input_schema}}];
      b.tool_choice={type:"function",function:{name:herr.name}};}
    else b.response_format={type:"json_object"};
    return JSON.stringify(b);
  }
  var r=await fetch(url+"/chat/completions",{method:"POST",headers:h,body:cuerpo(true)});
  /* hay modelos sin llamadas a herramientas: se repite pidiendo JSON directamente */
  if(!r.ok&&(r.status===400||r.status===404||r.status===422)){
    var t0=await r.text().catch(function(){return "";});
    if(!/tool|function/i.test(t0))throw falla(PROVEEDORES[p].nombre,r.status,t0);
    r=await fetch(url+"/chat/completions",{method:"POST",headers:h,body:cuerpo(false)});
  }
  if(!r.ok)throw falla(PROVEEDORES[p].nombre,r.status,await r.text().catch(function(){return "";}));
  var j=await r.json(), m=j.choices&&j.choices[0]&&j.choices[0].message;
  if(!m)throw new Error(PROVEEDORES[p].nombre+" no devolvió respuesta"+(j.error&&j.error.message?": "+j.error.message:"")+".");
  var tc=(m.tool_calls||[]).filter(function(x){return x.function&&x.function.name===herr.name;})[0];
  return sacaJSON(tc?tc.function.arguments:m.content);
}

/* ---------- Anthropic (Claude) ---------- */
async function anthropic(env,cfg,sistema,contenido,herr,maxTokens){
  var r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",
    headers:{"x-api-key":clave(env,"anthropic"),"anthropic-version":"2023-06-01","content-type":"application/json"},
    body:JSON.stringify({model:cfg.modelo,max_tokens:maxTokens,system:sistema,tools:[herr],tool_choice:{type:"tool",name:herr.name},
      messages:[{role:"user",content:contenido}]})});
  if(!r.ok)throw falla("Anthropic",r.status,await r.text().catch(function(){return "";}));
  var j=await r.json(), uso=(j.content||[]).filter(function(c){return c.type==="tool_use";})[0];
  if(!uso)throw new Error("La IA no devolvió el formato esperado.");
  return uso.input;
}

/* la llamada común: devuelve el objeto JSON de la respuesta */
export async function pideJSON(env,cfg,sistema,contenido,herr,maxTokens){
  maxTokens=maxTokens||8000;
  if(cfg.proveedor==="gemini")return gemini(env,cfg,sistema,contenido,herr);
  if(cfg.proveedor==="anthropic")return anthropic(env,cfg,sistema,contenido,herr,maxTokens);
  return chat(env,cfg,sistema,contenido,herr,maxTokens);
}
