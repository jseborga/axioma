/* ===========================================================
   THE FINAL TEST · Puertas de Color · trabajador
   Genera niveles y busca pistas fuera del hilo de la pantalla para
   que la animación no se corte en los teléfonos más lentos.
   =========================================================== */
importScripts("bloques-motor.js");
var A=self.AxBloques;
self.onmessage=function(e){
  var d=e.data||{}, r=null;
  try{
    if(d.op==="nivel")r=A.nivel(d.n,d.aj);
    else if(d.op==="dia")r=A.delDia(d.dia);
    else if(d.op==="pista")r=A.pista(d.nv,d.st);
    else if(d.op==="par")r=A.resuelve(d.nv,A.inicial(d.nv),d.tope||4000,1);
    self.postMessage({id:d.id,r:r});
  }catch(x){self.postMessage({id:d.id,error:String(x&&x.message||x)});}
};
