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
    return env.ASSETS.fetch(request);
  }
};
