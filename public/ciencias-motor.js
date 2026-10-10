/* ===========================================================
   THE FINAL TEST · Ciencias · el motor
   -----------------------------------------------------------
   Arma los ejercicios de cada unidad (ciencias-datos.js) y los
   cálculos de física y química, que se generan con una semilla.
   Cada unidad tiene cuatro lecciones:
     Descubre     las ideas clave con preguntas sencillas entre ellas
     Practica     ejercicios variados (primero los que costaron)
     Laboratorio  el experimento para casa, el laboratorio interactivo
                  y los de clasificar, ordenar y unir
     Reto         de todo
   Lo que se falla vuelve al final de la lección y queda anotado:
   «Repasar lo que me costó» lo practica de nuevo.
   Sin dependencias: lo usan el navegador, el servidor y las pruebas.
   =========================================================== */
(function(G){
"use strict";
var DAT=G.AxCienciasDatos;
if(!DAT)return;
function rng(seed){var a=seed>>>0||1; return function(){a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296;};}
function ri(r,a,b){return a+Math.floor(r()*(b-a+1));}
function pick(r,a){return a[Math.floor(r()*a.length)];}
function baraja(r,a){a=a.slice(); for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;} return a;}
function nt(x){var s=String(Math.round(x*1000)/1000); return s.replace(".",",").replace("-","−");}
function leeNumero(s){s=String(s==null?"":s).replace(/\s+/g,"").replace("−","-").replace(",","."); if(!/^-?\d+(\.\d+)?$/.test(s)&&!/^-?\.\d+$/.test(s))return NaN; return parseFloat(s);}

var NIVELES=DAT.NIVELES, UNIDADES=DAT.UNIDADES, POR_U={}, POR_ID={};
UNIDADES.forEach(function(u,i){
  u.n=i; POR_U[u.id]=u;
  u.lecciones=[{tipo:"descubre",nom:"Descubre",ico:"💡"},{tipo:"practica",nom:"Practica",ico:"✏️"},{tipo:"lab",nom:"Laboratorio",ico:"🧪"},{tipo:"reto",nom:"Reto",ico:"🏆"}];
  u.lecciones.forEach(function(l,k){l.id=u.id+"l"+(k+1); l.u=u.id; l.k=k; POR_ID[l.id]=l;});
});

/* ---------- cálculos de física y química ----------
   cada uno devuelve {q, ok, u (unidad), ex:[pasos], dec?} */
var ELEM=[["carbono","C",6,12],["oxígeno","O",8,16],["sodio","Na",11,23],["cloro","Cl",17,35],["hierro","Fe",26,56],["calcio","Ca",20,40],["litio","Li",3,7],["aluminio","Al",13,27],["potasio","K",19,39],["nitrógeno","N",7,14],["magnesio","Mg",12,24],["azufre","S",16,32]];
var MOLEC=[["H₂O","agua",{H:2,O:1}],["CO₂","dióxido de carbono",{C:1,O:2}],["H₂SO₄","ácido sulfúrico",{H:2,S:1,O:4}],["NaCl","cloruro de sodio",{Na:1,Cl:1}],["CH₄","metano",{C:1,H:4}],["C₆H₁₂O₆","glucosa",{C:6,H:12,O:6}],["NH₃","amoníaco",{N:1,H:3}],["CaCO₃","carbonato de calcio",{Ca:1,C:1,O:3}],["HNO₃","ácido nítrico",{H:1,N:1,O:3}],["O₂","oxígeno",{O:2}]];
var MASA={H:1,C:12,N:14,O:16,Na:23,Cl:35.5,Ca:40,S:32};
var NOM_EL={H:"hidrógeno",C:"carbono",N:"nitrógeno",O:"oxígeno",Na:"sodio",Cl:"cloro",Ca:"calcio",S:"azufre"};
var ECUAC=[["? H₂ + O₂ → 2 H₂O",2],["2 H₂ + ? O₂ → 2 H₂O",1],["N₂ + ? H₂ → 2 NH₃",3],["CH₄ + ? O₂ → CO₂ + 2 H₂O",2],["2 Na + Cl₂ → ? NaCl",2],["? Fe + 3 O₂ → 2 Fe₂O₃",4],["2 Mg + O₂ → ? MgO",2],["Zn + ? HCl → ZnCl₂ + H₂",2],["? KClO₃ → 2 KCl + 3 O₂",2],["C₃H₈ + ? O₂ → 3 CO₂ + 4 H₂O",5]];
var GEN={
  vel:function(r){var v=ri(r,2,30),t=ri(r,2,12),d=v*t; return {q:"Un ciclista recorre "+d+" m en "+t+" s. ¿Cuál es su velocidad?",ok:v,u:"m/s",ex:["v = d ÷ t",d+" ÷ "+t+" = "+v+" m/s"]};},
  dist:function(r){var v=ri(r,3,30),t=ri(r,2,15); return {q:"Un auto va a "+v+" m/s durante "+t+" s. ¿Qué distancia recorre?",ok:v*t,u:"m",ex:["d = v · t",v+" × "+t+" = "+(v*t)+" m"]};},
  tiempo:function(r){var v=ri(r,2,25),t=ri(r,2,12),d=v*t; return {q:"Un tren recorre "+d+" m a "+v+" m/s. ¿Cuánto tiempo tarda?",ok:t,u:"s",ex:["t = d ÷ v",d+" ÷ "+v+" = "+t+" s"]};},
  acel:function(r){var v0=ri(r,0,10),a=ri(r,1,5),t=ri(r,2,8),v=v0+a*t; return {q:"Un auto pasa de "+v0+" m/s a "+v+" m/s en "+t+" s. ¿Cuál es su aceleración?",ok:a,u:"m/s²",ex:["a = (v − v₀) ÷ t","("+v+" − "+v0+") ÷ "+t+" = "+a+" m/s²"]};},
  kmh:function(r){var v=pick(r,[5,10,15,20,25,30]),k=v*3.6; if(r()<0.5)return {q:"¿Cuánto es "+v+" m/s en km/h?",ok:k,u:"km/h",ex:["Para pasar de m/s a km/h se multiplica por 3,6.",v+" × 3,6 = "+nt(k)+" km/h"]};
    return {q:"¿Cuánto es "+nt(k)+" km/h en m/s?",ok:v,u:"m/s",ex:["Para pasar de km/h a m/s se divide entre 3,6.",nt(k)+" ÷ 3,6 = "+v+" m/s"]};},
  fuerza:function(r){var m=ri(r,2,50),a=ri(r,1,10); return {q:"¿Qué fuerza hace falta para acelerar "+m+" kg a "+a+" m/s²?",ok:m*a,u:"N",ex:["F = m · a",m+" × "+a+" = "+(m*a)+" N"]};},
  masa:function(r){var m=ri(r,2,40),a=ri(r,2,10),F=m*a; return {q:"Una fuerza de "+F+" N acelera un objeto a "+a+" m/s². ¿Cuál es su masa?",ok:m,u:"kg",ex:["m = F ÷ a",F+" ÷ "+a+" = "+m+" kg"]};},
  peso:function(r){var m=ri(r,2,80); return {q:"¿Cuánto pesa en la Tierra un objeto de "+m+" kg? (usa g = 10 m/s²)",ok:m*10,u:"N",ex:["P = m · g",m+" × 10 = "+(m*10)+" N"]};},
  trabajo:function(r){var F=ri(r,1,20)*5,d=ri(r,2,20); return {q:"Empujas una caja con "+F+" N a lo largo de "+d+" m. ¿Qué trabajo haces?",ok:F*d,u:"J",ex:["W = F · d",F+" × "+d+" = "+(F*d)+" J"]};},
  ec:function(r){var m=2*ri(r,1,20),v=ri(r,1,10); return {q:"¿Qué energía cinética tiene una pelota de "+m+" kg que va a "+v+" m/s?",ok:m*v*v/2,u:"J",ex:["Ec = ½ · m · v²","½ × "+m+" × "+v+"² = "+(m/2)+" × "+(v*v)+" = "+(m*v*v/2)+" J"]};},
  ep:function(r){var m=ri(r,1,20),h=ri(r,1,30); return {q:"¿Qué energía potencial tiene un objeto de "+m+" kg a "+h+" m de altura? (g = 10 m/s²)",ok:m*10*h,u:"J",ex:["Ep = m · g · h",m+" × 10 × "+h+" = "+(m*10*h)+" J"]};},
  potencia:function(r){var P=ri(r,2,40)*5,t=ri(r,2,10),W=P*t; return {q:"Un motor hace un trabajo de "+W+" J en "+t+" s. ¿Cuál es su potencia?",ok:P,u:"W",ex:["P = W ÷ t",W+" ÷ "+t+" = "+P+" W"]};},
  densidad:function(r){var d=pick(r,[1,2,3,5,8,11]),V=ri(r,2,20),m=d*V; return {q:"Un objeto tiene una masa de "+m+" g y un volumen de "+V+" cm³. ¿Cuál es su densidad?",ok:d,u:"g/cm³",ex:["d = m ÷ V",m+" ÷ "+V+" = "+d+" g/cm³",d>1?"Es más denso que el agua: se hunde.":"Igual que el agua."]};},
  presion:function(r){var P=ri(r,2,50)*10,A=pick(r,[1,2,4,5,10]),F=P*A; return {q:"Una fuerza de "+F+" N actúa sobre "+A+" m². ¿Qué presión ejerce?",ok:P,u:"Pa",ex:["P = F ÷ A",F+" ÷ "+A+" = "+P+" Pa"]};},
  ohmV:function(r){var I=ri(r,1,10),R=ri(r,2,50); return {q:"Por una resistencia de "+R+" Ω pasan "+I+" A. ¿Qué voltaje tiene?",ok:I*R,u:"V",ex:["V = I · R",I+" × "+R+" = "+(I*R)+" V"]};},
  ohmI:function(r){var I=ri(r,1,10),R=ri(r,2,40),V=I*R; return {q:"Una pila de "+V+" V se conecta a una resistencia de "+R+" Ω. ¿Qué corriente circula?",ok:I,u:"A",ex:["I = V ÷ R",V+" ÷ "+R+" = "+I+" A"]};},
  ohmR:function(r){var I=ri(r,1,10),R=ri(r,2,40),V=I*R; return {q:"Con "+V+" V circulan "+I+" A. ¿Cuál es la resistencia?",ok:R,u:"Ω",ex:["R = V ÷ I",V+" ÷ "+I+" = "+R+" Ω"]};},
  potElec:function(r){var V=pick(r,[3,6,9,12,110,220]),I=ri(r,1,10); return {q:"Un aparato funciona con "+V+" V y "+I+" A. ¿Cuál es su potencia?",ok:V*I,u:"W",ex:["P = V · I",V+" × "+I+" = "+(V*I)+" W"]};},
  onda:function(r){var l=ri(r,1,20),f=ri(r,2,50); if(r()<0.5)return {q:"Una onda tiene una longitud de "+l+" m y una frecuencia de "+f+" Hz. ¿Cuál es su velocidad?",ok:l*f,u:"m/s",ex:["v = λ · f",l+" × "+f+" = "+(l*f)+" m/s"]};
    return {q:"Una onda viaja a "+(l*f)+" m/s con una frecuencia de "+f+" Hz. ¿Cuál es su longitud de onda?",ok:l,u:"m",ex:["λ = v ÷ f",(l*f)+" ÷ "+f+" = "+l+" m"]};},
  periodo:function(r){var f=pick(r,[2,4,5,10,20,25,50]); return {q:"Una onda tiene una frecuencia de "+f+" Hz. ¿Cuál es su período?",ok:1/f,u:"s",dec:true,ex:["T = 1 ÷ f","1 ÷ "+f+" = "+nt(1/f)+" s"]};},
  neutrones:function(r){var e=pick(r,ELEM); return {q:"El "+e[0]+" ("+e[1]+") tiene Z = "+e[2]+" y A = "+e[3]+". ¿Cuántos neutrones tiene?",ok:e[3]-e[2],u:"neutrones",ex:["Neutrones = A − Z",e[3]+" − "+e[2]+" = "+(e[3]-e[2])]};},
  electrones:function(r){var e=pick(r,ELEM), t=ri(r,0,2);
    if(t===0)return {q:"¿Cuántos electrones tiene un átomo neutro de "+e[0]+" (Z = "+e[2]+")?",ok:e[2],u:"electrones",ex:["En un átomo neutro, electrones = protones = Z.","Tiene "+e[2]+" electrones."]};
    var io=t===1?[["Na",11,"+"],["K",19,"+"],["Li",3,"+"]]:[["Cl",17,"−"],["F",9,"−"],["Br",35,"−"]], x=pick(r,io), n=x[2]==="+"?x[1]-1:x[1]+1;
    return {q:"¿Cuántos electrones tiene el ion "+x[0]+x[2]+" (Z = "+x[1]+")?",ok:n,u:"electrones",ex:[x[2]==="+"?"El signo + significa que perdió 1 electrón.":"El signo − significa que ganó 1 electrón.",x[1]+(x[2]==="+"?" − 1 = ":" + 1 = ")+n]};},
  atomos:function(r){var m=pick(r,MOLEC), els=Object.keys(m[2]), tot=els.reduce(function(s,k){return s+m[2][k];},0);
    if(r()<0.5||els.length<2)return {q:"¿Cuántos átomos hay en total en una molécula de "+m[0]+" ("+m[1]+")?",ok:tot,u:"átomos",ex:["Suma los subíndices (sin número vale 1).",els.map(function(k){return m[2][k]+" de "+NOM_EL[k];}).join(" + ")+" = "+tot]};
    var k=pick(r,els); return {q:"¿Cuántos átomos de "+NOM_EL[k]+" hay en una molécula de "+m[0]+"?",ok:m[2][k],u:"átomos",ex:["El subíndice que sigue a "+k+" dice cuántos hay (sin número vale 1).","Hay "+m[2][k]+"."]};},
  masaMolar:function(r){var m=pick(r,MOLEC.filter(function(x){return Object.keys(x[2]).every(function(k){return MASA[k];});})), els=Object.keys(m[2]), tot=els.reduce(function(s,k){return s+m[2][k]*MASA[k];},0);
    return {q:"¿Cuál es la masa molar del "+m[1]+" ("+m[0]+")? Usa "+els.map(function(k){return k+" = "+nt(MASA[k]);}).join(", ")+".",ok:tot,u:"g/mol",dec:tot%1!==0,ex:[els.map(function(k){return m[2][k]+" × "+nt(MASA[k]);}).join(" + "),"= "+nt(tot)+" g/mol"]};},
  balanceo:function(r){var e=pick(r,ECUAC); return {q:"¿Qué coeficiente va en lugar de «?» para balancear: "+e[0],ok:e[1],u:"",ex:["Cuenta los átomos de cada elemento a cada lado: deben ser iguales.",e[0].replace("?",String(e[1]))]};}
};

/* ---------- laboratorios interactivos ---------- */
var SIMS={
  agua:{metas:{hierve:"Mueve el termómetro hasta que el agua hierva.",congela:"Mueve el termómetro hasta que el agua se congele."}},
  circuito:{metas:{enciende:"Elige un material para cerrar el circuito y enciende el foco."},
    mat:[["🪙 Moneda",true],["🪵 Palito de madera",false],["📎 Clip de metal",true],["🧴 Regla de plástico",false],["🥄 Cuchara de acero",true],["🧽 Borrador",false]]},
  velocidad:{metas:{}},
  ph:{metas:{base:"Prueba sustancias con el indicador de repollo morado y encuentra una base.",acido:"Prueba sustancias con el indicador de repollo morado y encuentra un ácido."},
    sus:[["🍋 Jugo de limón",2],["🫙 Vinagre",3],["☕ Café",5],["🥛 Leche",6.5],["💧 Agua pura",7],["🧂 Bicarbonato",9],["🧼 Jabón",10],["🧴 Lavandina",12]]}
};

/* ---------- un ejercicio del banco ----------
   u: unidad, k: posición en el banco, seed: para barajar y para los cálculos */
function item(u,k,seed){
  u=typeof u==="string"?POR_U[u]:u; if(!u||!u.q[k])return null;
  var r=rng((seed>>>0)^((k+1)*2654435761)), x=u.q[k], it={key:u.id+":"+k,u:u.id,k:k,seed:seed>>>0}, ops;
  switch(x[0]){
    case "e": ops=baraja(r,[x[2]].concat(x[3])); it.t="elige"; it.q=x[1]; it.ops=ops; it.ok=ops.indexOf(x[2]); it.ex=x[4]; break;
    case "v": it.t="vf"; it.q=x[1]; it.ops=["✅ Verdadero","❌ Falso"]; it.ok=x[2]?0:1; it.ex=x[3]; break;
    case "d": var dg=DIAG[x[1]], otras=baraja(r,dg.partes.filter(function(p){return p!==x[2];})).slice(0,3); ops=baraja(r,[x[2]].concat(otras));
      it.t="diagrama"; it.dg=x[1]; it.parte=x[2]; it.q="¿Qué parte señala la flecha?"; it.ops=ops; it.ok=ops.indexOf(x[2]); it.ex=x[3]; break;
    case "c": var cosas=baraja(r,x[3]).slice(0,Math.min(x[3].length,6)); it.t="clasifica"; it.q=x[1]; it.cajas=x[2]; it.cosas=cosas.map(function(c){return c[0];}); it.sol=cosas.map(function(c){return c[1];}); it.ex=x[4]; break;
    case "o": var idx=x[2].map(function(_,i){return i;}), mez=baraja(r,idx); if(mez.every(function(v,i){return v===i;}))mez.reverse();
      it.t="ordena"; it.q=x[1]; it.pasos=x[2]; it.mezcla=mez; it.ex=x[3]; break;
    case "p": it.t="parejas"; it.q=x[1]; it.izq=x[2].map(function(p){return p[0];}); it.der=baraja(r,x[2].map(function(p){return p[1];})); it.sol={}; x[2].forEach(function(p){it.sol[p[0]]=p[1];}); it.ex="¡Todas unidas!"; break;
    case "n": var g=GEN[x[1]](r); it.t="num"; it.gen=x[1]; it.q=g.q; it.ok=g.ok; it.uni=g.u; it.dec=!!g.dec||g.ok%1!==0; it.ex=g.ex.join(" "); it.pasos=g.ex; break;
    case "S": it.t="sim"; it.sim=x[1]; it.meta=x[2];
      if(x[1]==="velocidad"){it.obj=pick(r,[5,10,15,20,25]); it.q="Ajusta la distancia y el tiempo para que el auto vaya a "+it.obj+" m/s.";
        it.ex="v = d ÷ t: por ejemplo, "+(it.obj*4)+" m en 4 s = "+it.obj+" m/s.";}
      else{it.q=SIMS[x[1]].metas[x[2]]; it.ex={hierve:"A nivel del mar el agua hierve a 100 °C: pasa de líquido a gas.",congela:"A 0 °C el agua se solidifica y se vuelve hielo.",enciende:"Los metales son conductores: cierran el circuito y el foco se enciende.",base:"Las bases tienen pH mayor que 7: el indicador se pone verde o amarillo.",acido:"Los ácidos tienen pH menor que 7: el indicador se pone rojo o rosado."}[x[2]];}
      break;
    default: return null;
  }
  return it;
}
/* lo que se responde: índice, lista de cajas, orden, número o el estado del laboratorio */
function corrige(it,resp){
  switch(it.t){
    case "elige": case "vf": case "diagrama": return +resp===it.ok;
    case "clasifica": return Array.isArray(resp)&&resp.length===it.sol.length&&resp.every(function(v,i){return v===it.sol[i];});
    case "ordena": return Array.isArray(resp)&&resp.length===it.pasos.length&&resp.every(function(v,i){return v===i;});
    case "num": var v=leeNumero(resp); return !isNaN(v)&&Math.abs(v-it.ok)<1e-6;
    case "parejas": return !!resp;
    case "sim":
      if(it.sim==="agua")return it.meta==="hierve"?+resp>=100:+resp<=0;
      if(it.sim==="circuito")return resp===true;
      if(it.sim==="velocidad")return Math.abs(+resp-it.obj)<1e-9;
      if(it.sim==="ph")return it.meta==="base"?+resp>7:+resp<7;
  }
  return false;
}
function respuestaTxt(it){
  switch(it.t){
    case "elige": case "vf": case "diagrama": return it.ops[it.ok];
    case "clasifica": return it.cosas.map(function(c,i){return c+" → "+it.cajas[it.sol[i]];}).join(" · ");
    case "ordena": return it.pasos.join(" → ");
    case "parejas": return it.izq.map(function(a){return a+" — "+it.sol[a];}).join(" · ");
    case "num": return nt(it.ok)+(it.uni?" "+it.uni:"");
    case "sim": return it.sim==="agua"?(it.meta==="hierve"?"100 °C o más":"0 °C o menos"):it.sim==="velocidad"?it.obj+" m/s":it.sim==="ph"?(it.meta==="base"?"pH mayor que 7":"pH menor que 7"):"Un metal";
  }
  return "";
}

/* ---------- las lecciones ---------- */
/* el peso de un ejercicio para elegirlo: primero los que costaron */
function peso(prog,key){var f=prog&&prog.fallos&&prog.fallos[key]; return f?2+f:1;}
function elige(r,lista,n,prog){var out=[], c=lista.slice(); while(out.length<n&&c.length){var tot=c.reduce(function(s,k){return s+k.w;},0), x=r()*tot, i=0; for(;i<c.length;i++){x-=c[i].w; if(x<=0)break;} i=Math.min(i,c.length-1); out.push(c[i].k); c.splice(i,1);} return out;}
function genera(lecId,seed,ctx){
  ctx=ctx||{}; var l=POR_ID[lecId]; if(!l)return [];
  var u=POR_U[l.u], r=rng(seed>>>0), its=[], tipos=u.q.map(function(x){return x[0];});
  function de(filtro){return u.q.map(function(x,k){return {k:k,w:peso(ctx.prog,u.id+":"+k),t:x[0]};}).filter(function(x){return filtro(x.t);});}
  function pon(ks){ks.forEach(function(k){var it=item(u,k,ri(r,1,4e9)); if(it)its.push(it);});}
  if(l.tipo==="descubre"){
    /* las ideas, cada una seguida de preguntas sencillas */
    var faciles=elige(r,de(function(t){return t==="e"||t==="v"||t==="d";}),u.ideas.length*2,ctx.prog), j=0;
    u.ideas.forEach(function(idea,i){its.push({t:"idea",u:u.id,i:i,ico:idea[0],tit:idea[1],txt:idea[2]}); pon(faciles.slice(j,j+2)); j+=2;});
  } else if(l.tipo==="practica"){
    pon(elige(r,de(function(t){return t!=="S";}),8,ctx.prog));
  } else if(l.tipo==="lab"){
    its.push({t:"casa",u:u.id});
    var sims=de(function(t){return t==="S";}), manos=de(function(t){return t==="c"||t==="o"||t==="p";});
    pon(sims.map(function(x){return x.k;}));
    pon(elige(r,manos,Math.min(manos.length,4),ctx.prog));
    pon(elige(r,de(function(t){return t==="n"||t==="d"||t==="e";}),Math.max(0,7-its.length),ctx.prog));
  } else {
    pon(baraja(r,elige(r,de(function(){return true;}),10,ctx.prog)));
  }
  return its;
}
/* repaso: lo que más costó en todas las unidades */
function repaso(seed,ctx){
  var r=rng(seed>>>0), f=(ctx&&ctx.prog&&ctx.prog.fallos)||{}, ks=Object.keys(f).filter(function(k){return f[k]>0;}).sort(function(a,b){return f[b]-f[a];}).slice(0,10), its=[];
  baraja(r,ks).forEach(function(key){var p=key.split(":"), it=item(p[0],+p[1],ri(r,1,4e9)); if(it)its.push(it);});
  return its;
}

/* ---------- el avance ---------- */
function nuevo(){return {lec:{},fallos:{},xp:0,dias:{},refl:[],nivel:0};}
function hoy(){var d=new Date(); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}
function registra(prog,it,ok){if(!it.key)return; var f=prog.fallos[it.key]||0; if(ok){f=Math.max(0,f-1); if(f)prog.fallos[it.key]=f; else delete prog.fallos[it.key];} else prog.fallos[it.key]=f+1;}
function termina(prog,lecId,bien,total){
  var prec=total?bien/total:1, est=prec>=0.9?3:prec>=0.7?2:1, xp=10+(prec===1?5:0)+Math.round(bien/2);
  if(POR_ID[lecId]){var l=prog.lec[lecId]||(prog.lec[lecId]={e:0,v:0}); l.e=Math.max(l.e,est); l.v++;}
  prog.xp+=xp; var d=hoy(); prog.dias[d]=(prog.dias[d]||0)+xp;
  var ks=Object.keys(prog.dias).sort(); while(ks.length>120)delete prog.dias[ks.shift()];
  return {estrellas:est,xp:xp,prec:prec};
}
function hecha(prog,id){return !!(prog&&prog.lec&&prog.lec[id]&&prog.lec[id].v);}
/* Montessori: cada quien elige la unidad; dentro de ella las lecciones van en orden */
function abierta(prog,id){var l=POR_ID[id]; if(!l)return false; return l.k===0||hecha(prog,POR_U[l.u].lecciones[l.k-1].id);}
function unidadHecha(prog,uid){return POR_U[uid].lecciones.every(function(l){return hecha(prog,l.id);});}
function deNivel(n){return UNIDADES.filter(function(u){return u.nivel===n;});}
/* el nivel que conviene según la etapa de Matemática del perfil */
function nivelPara(etapa){return etapa<=1?1:etapa<=5?2:3;}
function sugerida(prog,n){var us=deNivel(n); for(var i=0;i<us.length;i++)for(var j=0;j<4;j++){var l=us[i].lecciones[j]; if(!hecha(prog,l.id))return l.id;} return null;}
function dificiles(prog,n){var f=(prog&&prog.fallos)||{}; return Object.keys(f).filter(function(k){return f[k]>0;}).sort(function(a,b){return f[b]-f[a];}).slice(0,n||8).map(function(k){var p=k.split(":"), u=POR_U[p[0]], x=u&&u.q[+p[1]]; return x?{key:k,u:u,txt:x[0]==="n"?"Cálculos: "+u.nom:x[0]==="d"?"Partes: "+x[2]:x[0]==="S"?"Laboratorio: "+u.nom:x[1],n:f[k]}:null;}).filter(Boolean);}
function estrellasTot(prog){var t=0; Object.keys((prog&&prog.lec)||{}).forEach(function(k){t+=prog.lec[k].e||0;}); return t;}

/* ---------- diagramas: partes y dónde apunta la flecha (en un lienzo de 240 × 200) ---------- */
var DIAG={
  planta:{partes:["Raíz","Tallo","Hoja","Flor"],pos:{"Raíz":[120,178],"Tallo":[120,118],"Hoja":[160,108],"Flor":[120,42]}},
  cuerpo:{partes:["Cerebro","Pulmones","Corazón","Estómago","Intestinos"],pos:{"Cerebro":[120,30],"Pulmones":[98,94],"Corazón":[128,102],"Estómago":[134,132],"Intestinos":[120,160]}},
  celula:{partes:["Núcleo","Membrana","Citoplasma","Mitocondria","Cloroplasto"],pos:{"Núcleo":[120,96],"Membrana":[36,150],"Citoplasma":[172,70],"Mitocondria":[74,62],"Cloroplasto":[178,140]}},
  ciclo:{partes:["Evaporación","Condensación","Precipitación","Escorrentía"],pos:{"Evaporación":[60,128],"Condensación":[132,40],"Precipitación":[176,92],"Escorrentía":[150,168]}},
  circuito:{partes:["Pila","Interruptor","Foco","Cable"],pos:{"Pila":[40,100],"Interruptor":[120,30],"Foco":[200,100],"Cable":[120,170]}},
  tierra:{partes:["Corteza","Manto","Núcleo externo","Núcleo interno"],pos:{"Corteza":[214,100],"Manto":[186,72],"Núcleo externo":[150,86],"Núcleo interno":[120,100]}},
  atomo:{partes:["Protón","Neutrón","Electrón"],pos:{"Protón":[112,94],"Neutrón":[128,106],"Electrón":[206,100]}}
};

G.AxCiencias={NIVELES:NIVELES,UNIDADES:UNIDADES,POR_U:POR_U,POR_ID:POR_ID,GEN:GEN,SIMS:SIMS,DIAG:DIAG,item:item,corrige:corrige,respuestaTxt:respuestaTxt,
  genera:genera,repaso:repaso,nuevo:nuevo,registra:registra,termina:termina,hecha:hecha,abierta:abierta,unidadHecha:unidadHecha,deNivel:deNivel,nivelPara:nivelPara,
  sugerida:sugerida,dificiles:dificiles,estrellasTot:estrellasTot,nt:nt,leeNumero:leeNumero,rng:rng};
})(typeof window!=="undefined"?window:globalThis);
