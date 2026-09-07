/* ===========================================================
   AXIOMA · punto de entrada del Worker
   Las peticiones a /api/ las atiende la API; todo lo demás son
   archivos estáticos servidos desde la carpeta public.
   =========================================================== */
import { handleApi } from "./api.js";

export default {
  async fetch(request, env){
    var url=new URL(request.url);
    if(url.pathname.indexOf("/api/")===0) return handleApi(request,env,url);
    /* vínculo con la app de Android: se activa definiendo las dos variables */
    if(url.pathname==="/.well-known/assetlinks.json") return assetLinks(env);
    return env.ASSETS.fetch(request);
  }
};

/* Declaración que Android descarga para comprobar que esta app y este dominio
   pertenecen al mismo dueño, y así abrir la web sin barra de navegador.
   Variables: ANDROID_PACKAGE (p. ej. dev.workers.julioseborga.axioma) y
   ANDROID_FINGERPRINT (huella SHA-256 del certificado, en mayúsculas y con
   dos puntos; admite varias separadas por comas). */
function assetLinks(env){
  var pkg=env.ANDROID_PACKAGE, fp=env.ANDROID_FINGERPRINT;
  var body=[];
  if(pkg&&fp) body=[{
    relation:["delegate_permission/common.handle_all_urls"],
    target:{namespace:"android_app", package_name:pkg,
            sha256_cert_fingerprints:String(fp).split(",").map(function(x){return x.trim();}).filter(Boolean)}
  }];
  return new Response(JSON.stringify(body,null,2),{
    headers:{"Content-Type":"application/json","Cache-Control":"public, max-age=300"}});
}
