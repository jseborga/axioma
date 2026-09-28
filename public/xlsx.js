/* ===========================================================
   THE FINAL TEST · Excel sin librerías
   leer(buffer)  → Promise de filas (texto) de la primera hoja
   escribir(hojas) → Blob .xlsx; hojas = [{nombre, filas, anchos?}]
   Un .xlsx es un zip de XML: para leer se descomprime con
   DecompressionStream («deflate-raw»), que traen los navegadores
   actuales; para escribir se usa un zip sin comprimir, que Excel,
   LibreOffice y Google Sheets abren sin problema.
   =========================================================== */
(function(G){
"use strict";
var TD=new TextDecoder("utf-8"), TE=new TextEncoder();

/* ---------- zip: lectura ---------- */
function u16(b,o){return b[o]|(b[o+1]<<8);}
function u32(b,o){return (b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0;}
function entradas(b){
  var e=-1,i;
  for(i=b.length-22;i>=Math.max(0,b.length-65557);i--)if(u32(b,i)===0x06054b50){e=i;break;}
  if(e<0)throw new Error("No es un archivo .xlsx válido.");
  var n=u16(b,e+10), p=u32(b,e+16), out={};
  for(i=0;i<n;i++){
    if(u32(b,p)!==0x02014b50)throw new Error("Archivo .xlsx dañado.");
    var metodo=u16(b,p+10), comp=u32(b,p+20), ln=u16(b,p+28), lx=u16(b,p+30), lc=u16(b,p+32), off=u32(b,p+42);
    var nombre=TD.decode(b.subarray(p+46,p+46+ln));
    out[nombre]={metodo:metodo,comp:comp,off:off};
    p+=46+ln+lx+lc;
  }
  return out;
}
function extrae(b,en){
  var o=en.off, ini=o+30+u16(b,o+26)+u16(b,o+28), datos=b.subarray(ini,ini+en.comp);
  if(en.metodo===0)return Promise.resolve(TD.decode(datos));
  if(en.metodo!==8)return Promise.reject(new Error("Compresión no admitida."));
  if(typeof DecompressionStream==="undefined")return Promise.reject(new Error("Este navegador no puede leer .xlsx; pega las filas copiadas desde Excel."));
  var s=new Blob([datos]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(s).arrayBuffer().then(function(ab){return TD.decode(new Uint8Array(ab));});
}
function xml(txt){return new DOMParser().parseFromString(txt,"application/xml");}
function textoDe(nodo){
  var ts=nodo.getElementsByTagName("t"),s="",i;
  for(i=0;i<ts.length;i++)s+=ts[i].textContent;
  return s;
}
function colIdx(ref){var m=/^([A-Z]+)/.exec(ref||""),n=0,i;if(!m)return -1;for(i=0;i<m[1].length;i++)n=n*26+(m[1].charCodeAt(i)-64);return n-1;}

function leer(buffer){
  var b=new Uint8Array(buffer), en;
  try{en=entradas(b);}catch(e){return Promise.reject(e);}
  var hojas=Object.keys(en).filter(function(k){return /^xl\/worksheets\/sheet\d+\.xml$/.test(k);})
    .sort(function(a,c){return parseInt(a.replace(/\D/g,""),10)-parseInt(c.replace(/\D/g,""),10);});
  if(!hojas.length)return Promise.reject(new Error("El archivo no tiene hojas."));
  var compartidas=en["xl/sharedStrings.xml"]?extrae(b,en["xl/sharedStrings.xml"]):Promise.resolve("");
  return Promise.all([compartidas,extrae(b,en[hojas[0]])]).then(function(r){
    var ss=[];
    if(r[0]){var si=xml(r[0]).getElementsByTagName("si");for(var i=0;i<si.length;i++)ss.push(textoDe(si[i]));}
    var filas=[], rows=xml(r[1]).getElementsByTagName("row");
    for(var j=0;j<rows.length;j++){
      var fila=[], cs=rows[j].getElementsByTagName("c");
      for(var k=0;k<cs.length;k++){
        var c=cs[k], t=c.getAttribute("t"), idx=colIdx(c.getAttribute("r")), v=c.getElementsByTagName("v")[0], val="";
        if(t==="s")val=v?(ss[parseInt(v.textContent,10)]||""):"";
        else if(t==="inlineStr")val=textoDe(c);
        else val=v?v.textContent:"";
        if(idx<0)idx=fila.length;
        while(fila.length<idx)fila.push("");
        fila[idx]=val;
      }
      filas.push(fila);
    }
    return filas;
  });
}

/* ---------- zip: escritura sin comprimir ---------- */
var CRC=(function(){var t=new Uint32Array(256),n,c,k;for(n=0;n<256;n++){c=n;for(k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(d){var c=0xFFFFFFFF,i;for(i=0;i<d.length;i++)c=CRC[(c^d[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function zip(archivos){
  var partes=[], central=[], off=0;
  function cab(n){var b=new Uint8Array(n);return {b:b,dv:new DataView(b.buffer)};}
  archivos.forEach(function(f){
    var nom=TE.encode(f.nombre), dat=TE.encode(f.texto), crc=crc32(dat);
    var l=cab(30); l.dv.setUint32(0,0x04034b50,true); l.dv.setUint16(4,20,true); l.dv.setUint16(6,0x0800,true);
    l.dv.setUint16(8,0,true); l.dv.setUint32(14,crc,true); l.dv.setUint32(18,dat.length,true); l.dv.setUint32(22,dat.length,true);
    l.dv.setUint16(26,nom.length,true);
    var c=cab(46); c.dv.setUint32(0,0x02014b50,true); c.dv.setUint16(4,20,true); c.dv.setUint16(6,20,true); c.dv.setUint16(8,0x0800,true);
    c.dv.setUint32(16,crc,true); c.dv.setUint32(20,dat.length,true); c.dv.setUint32(24,dat.length,true);
    c.dv.setUint16(28,nom.length,true); c.dv.setUint32(42,off,true);
    partes.push(l.b,nom,dat); central.push(c.b,nom);
    off+=30+nom.length+dat.length;
  });
  var tam=central.reduce(function(s,x){return s+x.length;},0);
  var e=cab(22); e.dv.setUint32(0,0x06054b50,true); e.dv.setUint16(8,archivos.length,true); e.dv.setUint16(10,archivos.length,true);
  e.dv.setUint32(12,tam,true); e.dv.setUint32(16,off,true);
  return partes.concat(central,[e.b]);
}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];})
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"");}
function col(i){var s="";i++;while(i>0){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26);}return s;}
function hojaXml(h){
  var anchos=h.anchos||[], cols=h.filas[0]?h.filas[0].map(function(_,i){return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+(anchos[i]||18)+'" customWidth="1"/>';}).join(""):"";
  var filas=h.filas.map(function(f,r){
    return '<row r="'+(r+1)+'">'+f.map(function(v,c){
      var ref=col(c)+(r+1), st=r===0?' s="1"':'';
      if(typeof v==="number"&&isFinite(v))return '<c r="'+ref+'"'+st+'><v>'+v+'</v></c>';
      if(v===null||v===undefined||v==="")return "";
      return '<c r="'+ref+'" t="inlineStr"'+st+'><is><t xml:space="preserve">'+esc(v)+'</t></is></c>';
    }).join("")+'</row>';
  }).join("");
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'+
    (cols?'<cols>'+cols+'</cols>':'')+'<sheetData>'+filas+'</sheetData></worksheet>';
}
function escribir(hojas){
  var nombres=hojas.map(function(h,i){return esc(String(h.nombre||("Hoja"+(i+1))).replace(/[\\\/?*\[\]:]/g," ").slice(0,31));});
  var archivos=[
    {nombre:"[Content_Types].xml",texto:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'+
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+
      hojas.map(function(_,i){return '<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';}).join("")+'</Types>'},
    {nombre:"_rels/.rels",texto:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
    {nombre:"xl/workbook.xml",texto:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+
      nombres.map(function(n,i){return '<sheet name="'+n+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>';}).join("")+'</sheets></workbook>'},
    {nombre:"xl/_rels/workbook.xml.rels",texto:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
      hojas.map(function(_,i){return '<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>';}).join("")+
      '<Relationship Id="rId'+(hojas.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
    {nombre:"xl/styles.xml",texto:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
      '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'+
      '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'+
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'+
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
      '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>'+
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'+
      '</styleSheet>'}
  ];
  hojas.forEach(function(h,i){archivos.push({nombre:"xl/worksheets/sheet"+(i+1)+".xml",texto:hojaXml(h)});});
  return new Blob(zip(archivos),{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
}
function descarga(blob,nombre){
  var a=document.createElement("a"), u=URL.createObjectURL(blob);
  /* sin tildes ni símbolos: algunos navegadores descartan el nombre si no es ASCII */
  nombre=String(nombre||"archivo.xlsx").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\w .()-]+/g,"-").replace(/-{2,}/g,"-").replace(/\s+/g," ").trim();
  a.href=u; a.download=nombre; document.body.appendChild(a); a.click();
  setTimeout(function(){URL.revokeObjectURL(u);a.remove();},1500);
}

G.AxExcel={leer:leer,escribir:escribir,descarga:descarga};
})(typeof globalThis!=="undefined"?globalThis:this);
