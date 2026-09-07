(function(){
"use strict";

/* ---------- reglas ---------- */
var SCOPES=["ORTO","REY","RAYO"], SHAPES=["CADENA","AISLADO","PAREJAS"];
var SNAME={ORTO:["Orto","4 lados"],REY:["Rey","8 vecinos"],RAYO:["Rayo","en línea"]};
var HNAME={CADENA:["Cadena","todo unido"],AISLADO:["Aislado","sin tocarse"],PAREJAS:["Parejas","en pares"]};
var EXPL={
 ORTO:"Cuenta solo las cuatro casillas que la tocan por un lado. Las diagonales no cuentan.",
 REY:"Cuenta las ocho casillas que la rodean, diagonales incluidas.",
 RAYO:"Mira en línea recta en las cuatro direcciones hasta el borde. Otra casilla numérica corta el rayo.",
 CADENA:"Todas las llenas forman un único grupo unido por los lados.",
 AISLADO:"Ninguna llena toca a otra por un lado. En diagonal sí pueden tocarse.",
 PAREJAS:"Las llenas van de dos en dos, unidas por un lado. Ni sueltas ni de tres."};
var SAMPLE={CADENA:[[1,1],[1,2],[2,2],[3,2],[3,3]],
            AISLADO:[[0,0],[0,2],[2,1],[2,3],[4,0],[4,2]],
            PAREJAS:[[0,0],[0,1],[2,2],[3,2],[4,0],[4,1]]};
var D4=[[1,0],[-1,0],[0,1],[0,-1]], D8=D4.concat([[1,1],[1,-1],[-1,1],[-1,-1]]);

function key(r,c){return r+","+c}
function rnd(){return RNG()}
function pick(a){return a[Math.floor(rnd()*a.length)]}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
var RNG=Math.random;
function seeded(s){var a=s>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

function scopeCells(r,c,n,clues,sc){
  var out=[],i,rr,cc,d;
  if(sc==="ORTO"||sc==="REY"){
    d=(sc==="ORTO")?D4:D8;
    for(i=0;i<d.length;i++){rr=r+d[i][0];cc=c+d[i][1];
      if(rr<0||rr>=n||cc<0||cc>=n)continue;
      if(clues[key(rr,cc)])continue;
      out.push([rr,cc]);}
  }else{
    for(i=0;i<4;i++){rr=r+D4[i][0];cc=c+D4[i][1];
      while(rr>=0&&rr<n&&cc>=0&&cc<n){
        if(clues[key(rr,cc)])break;
        out.push([rr,cc]); rr+=D4[i][0]; cc+=D4[i][1];}}
  }
  return out;
}
function groups(F){
  var seen={},out=[],k;
  for(k in F){ if(seen[k])continue;
    var st=[k]; seen[k]=1; var size=0;
    while(st.length){var cur=st.pop(); size++;
      var p=cur.split(","),r=+p[0],c=+p[1],i;
      for(i=0;i<4;i++){var kk=key(r+D4[i][0],c+D4[i][1]);
        if(F[kk]&&!seen[kk]){seen[kk]=1;st.push(kk);}}}
    out.push(size);}
  return out;
}
function shapeHolds(F,sh){
  var ks=Object.keys(F),i;
  if(!ks.length)return false;
  if(sh==="AISLADO"){
    for(i=0;i<ks.length;i++){var p=ks[i].split(","),r=+p[0],c=+p[1];
      if(F[key(r+1,c)]||F[key(r,c+1)])return false;}
    return true;}
  var g=groups(F);
  if(sh==="CADENA")return g.length===1;
  return g.every(function(x){return x===2});
}

/* backtracking: cuenta soluciones hasta cap, sobre todas las reglas ofrecidas */
function countSolutions(n,clues,nums,k,scopes,shapes,cap){
  var unknown=[],r,c,i,total=0;
  for(r=0;r<n;r++)for(c=0;c<n;c++)if(!clues[key(r,c)])unknown.push([r,c]);
  var index={}; unknown.forEach(function(p,i){index[key(p[0],p[1])]=i;});
  var clueKeys=Object.keys(nums);
  for(var s=0;s<scopes.length;s++){
    var sc=scopes[s], track=[], owners=[];
    for(i=0;i<unknown.length;i++)owners.push([]);
    for(i=0;i<clueKeys.length;i++){
      var p=clueKeys[i].split(","),cells=scopeCells(+p[0],+p[1],n,clues,sc),ids=[],j;
      for(j=0;j<cells.length;j++){var id=index[key(cells[j][0],cells[j][1])];ids.push(id);owners[id].push(i);}
      track.push([nums[clueKeys[i]],0,ids.length]);
    }
    var order=unknown.map(function(_,i){return i;})
                     .sort(function(a,b){return owners[b].length-owners[a].length;});
    var val=new Array(unknown.length).fill(0), filled=0, halt=false;
    (function rec(pos){
      if(halt)return;
      if(pos===order.length){
        if(filled!==k)return;
        var F={},i;
        for(i=0;i<unknown.length;i++)if(val[i])F[key(unknown[i][0],unknown[i][1])]=1;
        for(i=0;i<shapes.length;i++)if(shapeHolds(F,shapes[i])){total++;if(total>=cap){halt=true;return;}}
        return;
      }
      var ci=order[pos], own=owners[ci], j, t;
      for(var v=1;v>=0;v--){
        if(v&&filled>=k)continue;
        if(!v&&filled+(order.length-pos)<k)continue;
        var ok=true;
        for(j=0;j<own.length;j++){t=track[own[j]];t[1]+=v;t[2]--;
          if(t[1]>t[0]||t[1]+t[2]<t[0])ok=false;}
        if(ok){val[ci]=v;filled+=v;rec(pos+1);filled-=v;val[ci]=0;}
        for(j=0;j<own.length;j++){t=track[own[j]];t[1]-=v;t[2]++;}
        if(halt)return;
      }
    })(0);
    if(total>=cap)break;
  }
  return total;
}

function drawShape(n,k,sh){
  var t,i,j;
  for(t=0;t<400;t++){
    var F={},count=0,cells=[];
    for(i=0;i<n;i++)for(j=0;j<n;j++)cells.push([i,j]);
    shuffle(cells);
    if(sh==="AISLADO"){
      for(i=0;i<cells.length&&count<k;i++){
        var r=cells[i][0],c=cells[i][1];
        if(F[key(r+1,c)]||F[key(r-1,c)]||F[key(r,c+1)]||F[key(r,c-1)])continue;
        F[key(r,c)]=1;count++;}
    }else if(sh==="CADENA"){
      F[key(cells[0][0],cells[0][1])]=1;count=1;
      while(count<k){
        var edge=[],kk;
        for(kk in F){var p=kk.split(",");
          for(j=0;j<4;j++){var rr=+p[0]+D4[j][0],cc=+p[1]+D4[j][1];
            if(rr>=0&&rr<n&&cc>=0&&cc<n&&!F[key(rr,cc)])edge.push([rr,cc]);}}
        if(!edge.length)break;
        var g=edge[Math.floor(rnd()*edge.length)];
        F[key(g[0],g[1])]=1;count++;}
    }else{
      if(k%2)return null;
      var dom=[];
      for(i=0;i<n;i++)for(j=0;j<n;j++){
        if(j+1<n)dom.push([[i,j],[i,j+1]]);
        if(i+1<n)dom.push([[i,j],[i+1,j]]);}
      shuffle(dom);
      for(i=0;i<dom.length&&count<k;i++){
        var a=dom[i][0],b=dom[i][1];
        if(F[key(a[0],a[1])]||F[key(b[0],b[1])])continue;
        var clash=false,pts=[a,b];
        for(j=0;j<2;j++)for(var q=0;q<4;q++)
          if(F[key(pts[j][0]+D4[q][0],pts[j][1]+D4[q][1])])clash=true;
        if(clash)continue;
        F[key(a[0],a[1])]=1;F[key(b[0],b[1])]=1;count+=2;}
    }
    if(count===k&&shapeHolds(F,sh))return F;
  }
  return null;
}

function buildBoard(cfg){
  var n=cfg.n,t;
  for(t=0;t<260;t++){
    var sh=pick(cfg.shapes), sc=pick(cfg.scopes);
    var F=drawShape(n,cfg.k,sh);
    if(!F)continue;
    var free=[],r,c;
    for(r=0;r<n;r++)for(c=0;c<n;c++)if(!F[key(r,c)])free.push([r,c]);
    if(free.length<cfg.clues)continue;
    shuffle(free);
    var spots=free.slice(0,cfg.clues), clues={}, nums={}, i, fine=true;
    for(i=0;i<spots.length;i++)clues[key(spots[i][0],spots[i][1])]=1;
    for(i=0;i<spots.length;i++){
      var cells=scopeCells(spots[i][0],spots[i][1],n,clues,sc);
      if(!cells.length){fine=false;break;}
      var cnt=0,j;
      for(j=0;j<cells.length;j++)if(F[key(cells[j][0],cells[j][1])])cnt++;
      nums[key(spots[i][0],spots[i][1])]=cnt;
    }
    if(!fine)continue;
    if(countSolutions(n,clues,nums,cfg.k,cfg.scopes,cfg.shapes,2)===1)
      return {n:n,k:cfg.k,clues:clues,nums:nums,scopes:cfg.scopes,shapes:cfg.shapes,scope:sc,shape:sh,sol:F};
  }
  return null;
}

/* ---------- estado ---------- */
var MODES={
  day  :{n:5,k:7,clues:7,scopes:SCOPES,shapes:SHAPES},
  flash:{n:4,k:4,clues:5,scopes:["ORTO","REY"],shapes:["CADENA"]},
  free :{n:5,k:6,clues:7,scopes:["ORTO","REY"],shapes:["CADENA","AISLADO"]}
};
var mode="day", B=null, marks={}, scope=null, shape=null, beam=null,
    moves=0, solved=false, hintsUsed=0, freeLevel=1, wave=false, stamped=null;

function $(id){return document.getElementById(id)}

function dayNumber(){
  var epoch=Date.UTC(2026,0,1);
  return Math.floor((Date.now()-epoch)/86400000)+1;
}
function store(k,v){try{if(v===undefined)return localStorage.getItem("ax_"+k);localStorage.setItem("ax_"+k,v);}catch(e){return null}}

function optimum(){return B.k+(B.scopes.length>1?1:0)+(B.shapes.length>1?1:0);}

function renderStreak(){
  var s=parseInt(store("streak")||"0",10), last=store("last"), today=dayNumber();
  var alive=s>0&&(last===String(today)||last===String(today-1));
  $("streak").hidden=!(mode==="day"&&alive);
  $("streak-n").textContent=s;
}

function newBoard(){
  var cfg=MODES[mode];
  if(mode==="day"){RNG=seeded(dayNumber()*2654435761);}
  else if(mode==="free"){
    RNG=Math.random;
    cfg={n:freeLevel<3?4:5,k:freeLevel<3?5:6+Math.min(2,freeLevel-3),
         clues:freeLevel<3?5:7,
         scopes:freeLevel<2?["ORTO"]:(freeLevel<4?["ORTO","REY"]:SCOPES),
         shapes:freeLevel<3?["CADENA","AISLADO"]:SHAPES};
  } else {RNG=Math.random;}
  var b=null,tries=0;
  while(!b&&tries<3){b=buildBoard(cfg);tries++;}
  if(!b)b=buildBoard(MODES.flash);
  B=b; marks={}; beam=null; moves=0; solved=false; hintsUsed=0; wave=false; stamped=null;
  $("verdict").hidden=true;
  scope=B.scopes.length===1?B.scopes[0]:null;
  shape=B.shapes.length===1?B.shapes[0]:null;
  $("result").classList.remove("on");
  say("");
  $("ax-scope").hidden=B.scopes.length<=1;
  $("ax-shape").hidden=B.shapes.length<=1;
  $("rules").hidden=B.scopes.length<=1&&B.shapes.length<=1;
  $("help").classList.remove("on");
  var combos=B.scopes.length*B.shapes.length;
  $("hdr").textContent = mode==="day"?("Nº "+dayNumber()) : mode==="flash"?"Flash" : ("Nivel "+freeLevel);
  $("brief").innerHTML = combos===1
    ? ("Marca las <strong>"+B.k+" celdas llenas</strong> que cumplen todas las pistas.")
    : ("Marca <strong>"+B.k+" celdas llenas</strong> y descubre cuál de las <strong>"+combos+" combinaciones</strong> de reglas es la única posible.");
  $("b-new").textContent = mode==="free"&&solved ? "Siguiente nivel" : "Otro tablero";
  renderStreak(); renderChips(); render();
}

function renderChips(){
  function build(host,list,current,set,dict){
    host.innerHTML="";
    list.forEach(function(id){
      var b=document.createElement("button");
      b.className="chip"; b.setAttribute("aria-pressed",current===id?"true":"false");
      b.innerHTML='<b>'+dict[id][0]+'</b><i>'+dict[id][1]+'</i>'+
                  '<span class="q" role="img" aria-label="Qué significa '+dict[id][0]+'">?</span>';
      b.addEventListener("click",function(ev){
        if(ev.target.classList.contains("q")){showHelp(id);return;}
        if(solved||current===id)return;
        set(id); moves++; wave=true; renderChips(); render();
      });
      host.appendChild(b);
    });
  }
  build($("chips-scope"),B.scopes,scope,function(v){scope=v;},SNAME);
  build($("chips-shape"),B.shapes,shape,function(v){shape=v;},HNAME);
}

function sampleSvg(id){
  var n=5,s=17,isScope=SCOPES.indexOf(id)>=0,clues={},hi={},out=[],r,c;
  if(isScope){clues[key(2,2)]=1; if(id==="RAYO")clues[key(2,0)]=1;
    scopeCells(2,2,n,clues,id).forEach(function(p){hi[key(p[0],p[1])]=1;});}
  else SAMPLE[id].forEach(function(p){hi[key(p[0],p[1])]=1;});
  out.push('<svg width="94" height="94" viewBox="0 0 '+(n*s+2)+' '+(n*s+2)+'" aria-hidden="true">');
  for(r=0;r<n;r++)for(c=0;c<n;c++){
    var x=1+c*s,y=1+r*s,k=key(r,c),fill="var(--inset-2)",stroke="none";
    if(isScope&&clues[k]){fill="var(--card)";stroke="var(--ink-2)";}
    else if(hi[k]){fill="var(--accent)";stroke="none";}
    out.push('<rect x="'+(x+1.5)+'" y="'+(y+1.5)+'" width="'+(s-3)+'" height="'+(s-3)+'" rx="3" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.5"/>');
    if(isScope&&k===key(2,2))out.push('<text x="'+(x+s/2)+'" y="'+(y+s/2+3.5)+'" text-anchor="middle" font-size="10" font-weight="700" fill="var(--ink)">3</text>');
  }
  out.push('</svg>');
  return out.join("");
}
function showHelp(id){
  var dict=SCOPES.indexOf(id)>=0?SNAME:HNAME, box=$("help");
  box.innerHTML=sampleSvg(id)+'<div><b>'+dict[id][0]+' · '+dict[id][1]+'</b><p>'+EXPL[id]+'</p>'+
                '<button id="help-close">Entendido</button></div>';
  box.classList.add("on");
  $("help-close").onclick=function(){box.classList.remove("on");};
}

function filledSet(){var F={},k;for(k in marks)if(marks[k]===1)F[k]=1;return F;}
function filledCount(){var n=0,k;for(k in marks)if(marks[k]===1)n++;return n;}

function render(){
  var host=$("board"),n=B.n,r,c,closed=0,broken=0;
  host.style.setProperty("--n",n);
  host.innerHTML="";
  for(r=0;r<n;r++)for(c=0;c<n;c++){
    var k=key(r,c), el=document.createElement("div");
    el.setAttribute("role","button"); el.tabIndex=0;
    el.addEventListener("keydown",function(ev){
      if(ev.key===" "||ev.key==="Enter"){ev.preventDefault();this.click();}
    });
    if(B.clues[k]){
      var want=B.nums[k], cls="cell clue", mark="";
      if(scope){
        var cells=scopeCells(r,c,n,B.clues,scope),have=0,open=0,i;
        for(i=0;i<cells.length;i++){var kk=key(cells[i][0],cells[i][1]);
          if(marks[kk]===1)have++; else if(!marks[kk])open++;}
        if(have>want||have+open<want){cls+=" broken";mark="!";broken++;}
        else if(have===want&&open===0){cls+=" sat";mark="✓";closed++;}
      }
      if(beam===k)cls+=" beam";
      if(wave){cls+=" wave"; el.style.setProperty("--d",((r+c)*40)+"ms");}
      el.className=cls;
      el.innerHTML=want+(mark?'<span class="mark" aria-hidden="true">'+mark+'</span>':'');
      el.setAttribute("aria-label","Pista "+want+" en fila "+(r+1)+", columna "+(c+1)+
        (mark==="✓"?", cerrada":mark==="!"?", imposible":""));
      (function(kk){el.addEventListener("click",function(){beam=(beam===kk)?null:kk;render();});})(k);
    }else{
      var v=marks[k]||0;
      el.className="cell "+(v===1?"full":v===2?"void":"open");
      el.setAttribute("aria-label","Casilla fila "+(r+1)+", columna "+(c+1)+": "+(v===1?"llena":v===2?"descartada":"sin decidir"));
      if(stamped===k)el.className+=" stamp";
      if(wave){el.className+=" wave"; el.style.setProperty("--d",((r+c)*40)+"ms");}
      if(solved&&v===1&&!B.sol[k])el.className+=" wrong";
      if(beam&&scope){
        var p=beam.split(","),lit=scopeCells(+p[0],+p[1],n,B.clues,scope),q;
        for(q=0;q<lit.length;q++)if(key(lit[q][0],lit[q][1])===k)el.className+=" beam";
      }
      (function(kk){el.addEventListener("click",function(){
        if(solved)return; marks[kk]=((marks[kk]||0)+1)%3; moves++; stamped=kk; render();});})(k);
    }
    host.appendChild(el);
  }
  var total=Object.keys(B.nums).length, th="";
  for(var q=0;q<total;q++)
    th+='<b class="'+(broken>0?"no":(q<closed?"on":""))+'"></b>';
  $("tally").innerHTML=th;
  $("tally-n").textContent=closed+"/"+total;
  if(wave){wave=false; setTimeout(function(){
    var els=host.querySelectorAll(".wave");
    for(var i=0;i<els.length;i++)els[i].classList.remove("wave");},900);}
  stamped=null;
  var fc=filledCount(), rf=$("r-fill");
  rf.textContent=fc+" / "+B.k;
  rf.className=fc>B.k?"bad":fc===B.k?"ok":"";
  $("r-moves").textContent=moves;
  var out=$("r-shape"),F=filledSet();
  if(!shape||!fc){out.textContent="—";out.className="";}
  else if(shapeHolds(F,shape)){out.textContent="cumple";out.className="ok";}
  else{out.textContent="falla";out.className="bad";}
}

function say(text,kind){
  var m=$("msg");
  m.textContent=text; m.className="msg"+(kind?" "+kind:"");
}

function check(){
  if(!scope||!shape){say("Elige una regla de cada eje antes de comprobar.","bad");return;}
  if(filledCount()!==B.k){say("Necesitas exactamente "+B.k+" celdas llenas.","bad");return;}
  var F=filledSet(), same=Object.keys(B.sol).every(function(k){return F[k];});
  if(!same){say("Alguna celda no encaja con esas reglas.","bad");return;}
  if(scope!==B.scope||shape!==B.shape){say("El tablero es correcto, pero el par de reglas no.","bad");return;}
  solved=true;
  /* al resolver, las casillas sin decidir quedan descartadas: el tablero se cierra del todo */
  for(var r=0;r<B.n;r++)for(var c=0;c<B.n;c++){var kk=key(r,c);if(!B.clues[kk]&&!marks[kk])marks[kk]=2;}
  var opt=optimum(), perfect=moves===opt;
  var vd=$("verdict");
  vd.hidden=false;
  vd.textContent="El axioma era "+SNAME[B.scope][0]+" con "+HNAME[B.shape][0]+".";
  say("Resuelto en "+moves+" movidas"+(perfect?". ¡Partida perfecta!":" (el mínimo es "+opt+")."),"good");
  if(mode==="day"){recordStreak();renderStreak();
    if(window.AxAccount)AxAccount.onDailySolved({day:dayNumber(),moves:moves,hints:hintsUsed});}
  if(mode==="free")$("b-new").textContent="Siguiente nivel";
  buildShare(perfect);
  render();
  $("result").scrollIntoView({behavior:"smooth",block:"nearest"});
}

function recordStreak(){
  var today=String(dayNumber()), last=store("last"), streak=parseInt(store("streak")||"0",10);
  if(last===today)return;
  streak=(last===String(dayNumber()-1))?streak+1:1;
  store("last",today); store("streak",String(streak));
}
function buildShare(perfect){
  var streak=mode==="day"?parseInt(store("streak")||"1",10):0;
  var opt=optimum(), extra=moves-opt;
  var bar=""; for(var i=0;i<Math.min(opt,10);i++)bar+="■";
  for(i=0;i<Math.min(Math.max(extra,0),6);i++)bar+="□";
  var head=mode==="day"?("Axioma nº "+dayNumber()):(mode==="flash"?"Axioma Flash":"Axioma libre · nivel "+freeLevel);
  var txt=head+"\n"+bar+"\n"+moves+" movidas · mínimo "+opt+
          (perfect?" · perfecta":"")+(hintsUsed?" · "+hintsUsed+" pista"+(hintsUsed>1?"s":""):"")+
          (streak?"\nRacha: "+streak+" días":"");
  $("share-text").textContent=txt;
  $("result").classList.add("on");
}

function hint(){
  if(solved)return;
  hintsUsed++; moves+=3;
  if(!scope||!shape){
    var dead=[],i,j;
    for(i=0;i<B.scopes.length;i++)for(j=0;j<B.shapes.length;j++)
      if(!countSolutions(B.n,B.clues,B.nums,B.k,[B.scopes[i]],[B.shapes[j]],1))
        dead.push(SNAME[B.scopes[i]][0]+" con "+HNAME[B.shapes[j]][0]);
    say(dead.length?("Puedes descartar "+dead[Math.floor(Math.random()*dead.length)]+": no tiene ninguna solución.")
                   :"Elige una regla de cada eje primero.");
    render(); return;
  }
  var n=B.n,r,c,found=null;
  for(r=0;r<n&&!found;r++)for(c=0;c<n&&!found;c++){
    var k=key(r,c); if(!B.clues[k])continue;
    var cells=scopeCells(r,c,n,B.clues,scope),have=0,open=[],i;
    for(i=0;i<cells.length;i++){var kk=key(cells[i][0],cells[i][1]);
      if(marks[kk]===1)have++; else if(!marks[kk])open.push(kk);}
    if(!open.length)continue;
    if(have===B.nums[k])found={k:k,why:"ya tiene todas sus llenas, así que el resto de su alcance está vacío."};
    else if(have+open.length===B.nums[k])found={k:k,why:"necesita todas las casillas libres de su alcance."};
  }
  if(found){beam=found.k;say("Mira la pista resaltada: "+found.why);}
  else say("Ninguna pista se cierra sola ahora mismo. Prueba con otra regla.");
  render();
}

/* ---------- controles ---------- */
function setMode(m){
  mode=m;
  ["day","flash","free"].forEach(function(x){
    $("t-"+x).setAttribute("aria-selected",x===m?"true":"false");
  });
  newBoard();
}
$("t-day").onclick=function(){setMode("day");};
$("t-flash").onclick=function(){setMode("flash");};
$("t-free").onclick=function(){setMode("free");};
$("b-check").onclick=check;
$("b-hint").onclick=hint;
$("b-reset").onclick=function(){
  marks={};moves=0;solved=false;beam=null;
  scope=B.scopes.length===1?B.scopes[0]:null;
  shape=B.shapes.length===1?B.shapes[0]:null;
  $("result").classList.remove("on");
  $("verdict").hidden=true;
  say("");renderChips();render();};
$("b-new").onclick=function(){
  if(mode==="day"){say("El tablero diario es el mismo para todo el mundo. Prueba Libre o Flash.");return;}
  if(mode==="free"&&solved)freeLevel++;
  newBoard();};
$("b-share").onclick=function(){
  var txt=$("share-text").textContent+"\n"+location.href;
  if(navigator.share){navigator.share({text:txt}).catch(function(){});}
  else if(navigator.clipboard){navigator.clipboard.writeText(txt).then(function(){
    say("Resultado copiado al portapapeles.","good");});}
};

if("serviceWorker" in navigator)
  window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){});});

setMode("day");
})();
