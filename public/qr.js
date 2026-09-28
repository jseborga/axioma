/* ===========================================================
   THE FINAL TEST · códigos QR
   Genera el QR de una marca o de una convocatoria (con la librería
   qrcode-generator, MIT, en vendor/qrcode.js), lo muestra en una ventana
   con el enlace para copiar o compartir, y lo descarga como un cartel
   PNG listo para imprimir o publicar.
   =========================================================== */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var host=$("qr-modal");

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function matriz(texto){
  var q=window.qrcode(0,"M"); q.addData(texto); q.make();
  var n=q.getModuleCount(), m=[];
  for(var r=0;r<n;r++){m.push([]);for(var c=0;c<n;c++)m[r].push(q.isDark(r,c));}
  return m;
}
/* SVG nítido a cualquier tamaño, con margen de 4 módulos */
function svg(texto,color){
  var m=matriz(texto), n=m.length, t=n+8, d="";
  for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(m[r][c])d+="M"+(c+4)+" "+(r+4)+"h1v1h-1z";
  return '<svg class="qr-svg" viewBox="0 0 '+t+' '+t+'" shape-rendering="crispEdges" role="img" aria-label="Código QR">'+
    '<rect width="'+t+'" height="'+t+'" fill="#fff"/><path d="'+d+'" fill="'+(color||"#000")+'"/></svg>';
}
function lineas(ctx,texto,ancho){
  var pal=String(texto||"").split(" "), out=[], l="";
  pal.forEach(function(p){var prueba=l?l+" "+p:p; if(ctx.measureText(prueba).width>ancho&&l){out.push(l);l=p;}else l=prueba;});
  if(l)out.push(l); return out.slice(0,3);
}
/* cartel de 1080×1350 con la marca, el título, el QR y el enlace */
function cartel(o){
  return new Promise(function(resolve){
    var W=1080,H=1350,cv=document.createElement("canvas"); cv.width=W; cv.height=H;
    var x=cv.getContext("2d"), color=o.color||"#1C1C1E", fuente='-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';
    x.fillStyle="#fff"; x.fillRect(0,0,W,H);
    x.fillStyle=color; x.fillRect(0,0,W,210);
    function sigue(logo){
      var tx=logo?220:80;
      if(logo){x.fillStyle="#fff";x.fillRect(60,45,120,120);x.drawImage(logo,66,51,108,108);}
      x.fillStyle="#fff"; x.font="700 54px "+fuente; x.textBaseline="middle";
      x.fillText(String(o.marca||"The Final Test").slice(0,28),tx,o.lema?92:105);
      if(o.lema){x.font="400 32px "+fuente;x.globalAlpha=.85;x.fillText(String(o.lema).slice(0,48),tx,148);x.globalAlpha=1;}
      x.fillStyle="#1C1C1E"; x.font="700 58px "+fuente; x.textAlign="center"; x.textBaseline="alphabetic";
      var ls=lineas(x,o.titulo||"",W-140), y=300;
      ls.forEach(function(l){x.fillText(l,W/2,y);y+=68;});
      if(o.subtitulo){x.fillStyle="#6E6E73";x.font="400 34px "+fuente;x.fillText(String(o.subtitulo).slice(0,60),W/2,y+6);y+=50;}
      var m=matriz(o.url), n=m.length, lado=Math.min(640,H-y-230), k=Math.floor(lado/(n+8)), q=k*(n+8), qx=(W-q)/2, qy=y+30;
      x.fillStyle="#fff"; x.fillRect(qx,qy,q,q); x.fillStyle="#000";
      for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(m[r][c])x.fillRect(qx+(c+4)*k,qy+(r+4)*k,k,k);
      x.fillStyle=color; x.font="700 40px "+fuente; x.fillText("Escanea para participar",W/2,qy+q+70);
      x.fillStyle="#6E6E73"; x.font="400 28px "+fuente; x.fillText(String(o.url).replace(/^https?:\/\//,"").slice(0,70),W/2,qy+q+120);
      x.fillStyle="#AEAEB2"; x.font="600 24px "+fuente; x.fillText("The Final Test",W/2,H-40);
      cv.toBlob(resolve,"image/png");
    }
    if(o.logo){var im=new Image();im.onload=function(){sigue(im);};im.onerror=function(){sigue(null);};im.src=o.logo;}else sigue(null);
  });
}
function nombreArchivo(t){return String(t||"qr").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^\w-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,50)||"qr";}

function abre(o){
  host.innerHTML='<div class="tut-card entra qr-card" role="dialog" aria-modal="true" aria-label="Código QR">'+
    '<button class="close" id="qr-x" aria-label="Cerrar">×</button>'+
    '<div class="tut-body"><h2>'+esc(o.titulo||"Código QR")+'</h2>'+(o.subtitulo?'<p>'+esc(o.subtitulo)+'</p>':'')+
    '<div class="qr-caja">'+svg(o.url)+'</div>'+
    '<p class="qr-url">'+esc(o.url)+'</p>'+
    '<p class="fine">Imprime el cartel o publícalo: quien lo escanee llega directo'+(o.directo?' a la convocatoria':' a la página')+'.</p></div>'+
    '<div class="tut-nav"><button class="ghost" id="qr-copia" type="button">Copiar enlace</button>'+
    (navigator.share?'<button class="ghost" id="qr-comp" type="button">Compartir</button>':'')+
    '<button class="primary" id="qr-baja" type="button">Descargar cartel</button></div></div>';
  host.classList.add("on"); document.body.style.overflow="hidden";
  $("qr-x").onclick=cierra;
  $("qr-copia").onclick=function(){var b=this;
    if(navigator.clipboard)navigator.clipboard.writeText(o.url).then(function(){b.textContent="Copiado";setTimeout(function(){b.textContent="Copiar enlace";},1400);});
    else prompt("Copia el enlace:",o.url);};
  if($("qr-comp"))$("qr-comp").onclick=function(){navigator.share({title:o.titulo,text:o.titulo+(o.marca?" · "+o.marca:""),url:o.url}).catch(function(){});};
  $("qr-baja").onclick=function(){var b=this; b.disabled=true;
    cartel(o).then(function(blob){
      var a=document.createElement("a"),u=URL.createObjectURL(blob); a.href=u; a.download=nombreArchivo((o.marca?o.marca+" ":"")+(o.titulo||""))+".png";
      document.body.appendChild(a); a.click(); setTimeout(function(){URL.revokeObjectURL(u);a.remove();},1500); b.disabled=false;
    });};
}
function cierra(){host.classList.remove("on");host.innerHTML="";document.body.style.overflow="";}
document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&host&&host.classList.contains("on"))cierra(); });

window.AxQR={svg:svg,abre:abre,cierra:cierra,cartel:cartel};
})();
