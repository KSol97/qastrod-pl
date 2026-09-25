/* RZUTY KARNE · gra Qastrod.pl · seria jedenastek: strzelasz i bronisz */
(function(){
'use strict';
var root=document.getElementById('kr'); if(!root) return;
var stage=root.querySelector('.lt-stage'), cv=stage.querySelector('canvas');
var ctx=cv.getContext('2d');
var W=960,H=600,PI=Math.PI,TAU=PI*2;
var DEBUG=/[?&]debug=1/.test(location.search);
var TOUCH=!!(window.matchMedia&&matchMedia('(hover:none)').matches);
function el(tag,cls,html){var d=document.createElement(tag);d.className=cls;if(html)d.innerHTML=html;return d}
var ov=el('div','lt-ov'),toastEl=el('div','lt-toast'),shoutEl=el('div','lt-shout gk-shout');
[ov,toastEl,shoutEl].forEach(function(d){stage.appendChild(d)});

/* ---------- pomocnicze ---------- */
function rnd(a,b){return a+Math.random()*(b-a)}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function clamp(v,a,b){return v<a?a:v>b?b:v}
function num(n){return Math.round(n).toLocaleString('pl-PL')}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function circ(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,TAU)}
function mmss(s){s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+('0'+s%60).slice(-2)}
function shade(hex,k){var n=parseInt(hex.slice(1),16),r=n>>16&255,g=n>>8&255,b=n&255;function f(c){return Math.round(clamp(k>0?c+(255-c)*k:c*(1+k),0,255))}return 'rgb('+f(r)+','+f(g)+','+f(b)+')'}


/* ---------- dźwięk ---------- */
var AC=null,master=null,crowdG=null,crowdSrc=null;
function unlockAudio(){if(AC){if(AC.state==='suspended')AC.resume();return}
  try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=.5;master.connect(AC.destination)}catch(e){AC=null}}
function tone(f,d,type,vol,slide,delay){if(!AC||SV.muted)return;var t=AC.currentTime+Math.max(0,delay||0);var o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol||.2,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(master);o.start(t);o.stop(t+d+.03)}
var NB=null;function nbuf(){if(!NB){NB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);var ch=NB.getChannelData(0);for(var i=0;i<ch.length;i++)ch[i]=Math.random()*2-1}return NB}
function noise(d,vol,freq,delay,type){if(!AC||SV.muted)return;var t=AC.currentTime+Math.max(0,delay||0);var s=AC.createBufferSource();s.buffer=nbuf();var f=AC.createBiquadFilter();f.type=type||'lowpass';f.frequency.value=freq||1200;
  var g=AC.createGain();g.gain.setValueAtTime(vol||.2,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(g);g.connect(master);s.start(t,Math.random()*.5);s.stop(t+d+.02)}
function crowdOn(){if(!AC||crowdSrc)return;try{crowdSrc=AC.createBufferSource();crowdSrc.buffer=nbuf();crowdSrc.loop=true;var f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=700;f.Q.value=.6;crowdG=AC.createGain();crowdG.gain.value=0;crowdSrc.connect(f);f.connect(crowdG);crowdG.connect(master);crowdSrc.start()}catch(e){}}
function crowdSet(v){if(crowdG&&AC)crowdG.gain.setTargetAtTime(SV.muted?0:v,AC.currentTime,.3)}
var SFX={
 kick:function(p){tone(100+(p||0)*40,.16,'sine',.5,45);noise(.09,.25+.15*(p||0),2000)},
 swing:function(){noise(.07,.05,1600,0,'bandpass')},
 head:function(){tone(240,.12,'sine',.28,480);noise(.05,.12,1500)},
 bounce:function(){tone(170,.07,'sine',.12,110)},
 post:function(){tone(620,.5,'triangle',.18,600);tone(930,.4,'sine',.08,null,.02)},
 jump:function(){tone(300,.1,'triangle',.05,520)},
 goal:function(){noise(2.2,.4,900);[523,659,784,1047].forEach(function(f,i){tone(f,.3,'square',.08,null,.1+i*.1)});tone(220,.9,'sawtooth',.08,null,.05)},
 whistle:function(){tone(2700,.08,'square',.06);tone(2700,.08,'square',.06,null,.12);tone(2900,.34,'square',.06,2650,.24)},
 final:function(){tone(2700,.2,'square',.07);tone(2700,.2,'square',.07,null,.3);tone(2900,.9,'square',.07,2600,.6)},
 super:function(){noise(.6,.35,1200);tone(160,.5,'sawtooth',.12,900)},
 ready:function(){[660,880,1320].forEach(function(f,i){tone(f,.1,'square',.06,null,i*.05)})},
 power:function(){[880,1175,1568].forEach(function(f,i){tone(f,.12,'sine',.1,null,i*.06)})},
 freeze:function(){tone(1800,.4,'sine',.08,600);noise(.3,.15,6000,0,'highpass')},
 win:function(){[523,659,784,1047,1319].forEach(function(f,i){tone(f,.24,'triangle',.16,null,i*.1)})},
 lose:function(){[392,330,262].forEach(function(f,i){tone(f,.3,'triangle',.14,null,i*.16)})},
 buy:function(){tone(660,.07,'square',.08);tone(990,.15,'square',.08,null,.07)},
 beep:function(){tone(880,.1,'square',.07)},
 net:function(){noise(.5,.25,3000,0,'highpass')},
 save:function(){tone(140,.2,'sine',.5,60);noise(.12,.35,900)},
 dive:function(){noise(.18,.12,700)},
 miss:function(){[330,262].forEach(function(f,i){tone(f,.25,'triangle',.12,null,i*.14)})}
};
function sfx(n,a){try{SFX[n]&&SFX[n](a)}catch(e){}}

/* ---------- skala ---------- */
var scale=1,dpr=1;
function resize(){dpr=Math.min(2,window.devicePixelRatio||1);var cw=stage.clientWidth||900;cv.width=Math.round(cw*dpr);cv.height=Math.round(cw*H/W*dpr);scale=cv.width/W}
window.addEventListener('resize',resize);if(window.ResizeObserver)new ResizeObserver(resize).observe(stage);resize();


/* ---------- głowy (jak w Główkami) ---------- */
function headArt(x,y,R,L,dir,lx,ly,mood,tilt){
  var OL='rgba(22,18,48,.9)',HC=L.hc,HL=shade(HC,.4),HD=shade(HC,-.3);
  ctx.save();ctx.translate(x,y);ctx.rotate(tilt||0);ctx.scale(dir,1); // rysujemy twarzą w prawo
  ctx.lineJoin='round';ctx.lineCap='round';
  function hairG(){var g=ctx.createLinearGradient(0,-R*1.3,0,R*.1);g.addColorStop(0,shade(HC,.18));g.addColorStop(.6,HC);g.addColorStop(1,HD);return g}
  // czapka włosów: wychodzi minimalnie poza kontur głowy, więc go zakrywa
  function cap(front,top){var Re=R*1.07;top=top||1;
    ctx.beginPath();ctx.ellipse(0,0,Re,R*1.11*top,0,PI*.97,PI*1.94,false);
    ctx.quadraticCurveTo(R*.72,front[0],R*.3,front[1]);ctx.quadraticCurveTo(-R*.1,front[2],-R*.45,front[3]);ctx.quadraticCurveTo(-R*.7,front[4],-R*.72,R*.12);ctx.closePath()}
  var FR=[-R*.5,-R*.52,-R*.58,-R*.42,-R*.3];
  // --- włosy z tyłu (za głową)
  ctx.strokeStyle=OL;ctx.lineWidth=3;
  if(L.hs===5){ctx.fillStyle=hairG();ctx.beginPath();for(var ai=0;ai<=28;ai++){var aa=ai/28*TAU,r2=1+.05*Math.sin(ai*2.7);ctx[ai?'lineTo':'moveTo'](-R*.08+Math.cos(aa)*R*1.2*r2,-R*.42+Math.sin(aa)*R*1.02*r2)}ctx.closePath();ctx.fill();ctx.stroke()}
  if(L.hs===2){ctx.fillStyle=hairG();ctx.beginPath();ctx.moveTo(-R*.6,-R*.8);ctx.bezierCurveTo(-R*1.35,-R*.3,-R*1.25,R*.6,-R*.85,R*1.0);ctx.quadraticCurveTo(-R*.6,R*.72,-R*.3,R*.7);ctx.lineTo(-R*.2,-R*.3);ctx.closePath();ctx.fill();ctx.stroke()}
  if(L.hs===4){ctx.fillStyle=hairG();ctx.beginPath();ctx.moveTo(-R*1.0,-R*.25);
    [[-R*.98,-R*1.02],[-R*.62,-R*.86],[-R*.5,-R*1.42],[-R*.18,-R*1.0],[R*.06,-R*1.5],[R*.3,-R*1.02],[R*.58,-R*1.38],[R*.72,-R*.86],[R*1.08,-R*1.02],[R*1.0,-R*.4]].forEach(function(p){ctx.lineTo(p[0],p[1])});
    ctx.closePath();ctx.fill();ctx.stroke()}
  if(L.hs===1){ctx.fillStyle=HC;[[-R*.92,-R*.25],[-R*.9,-R*.66],[-R*.6,-R*.98],[-R*.18,-R*1.14],[R*.28,-R*1.1],[R*.68,-R*.88],[R*.95,-R*.5]].forEach(function(c){ctx.beginPath();ctx.arc(c[0],c[1],R*.32,0,TAU);ctx.fill();ctx.stroke()})}
  // --- głowa
  var sg=ctx.createRadialGradient(R*.25,-R*.35,R*.1,0,0,R*1.1);sg.addColorStop(0,shade(L.sk,.26));sg.addColorStop(.62,L.sk);sg.addColorStop(1,shade(L.sk,-.16));
  ctx.fillStyle=sg;ctx.beginPath();ctx.ellipse(0,0,R,R*1.04,0,0,TAU);ctx.fill();ctx.strokeStyle=OL;ctx.lineWidth=3.5;ctx.stroke();
  ctx.save();ctx.beginPath();ctx.ellipse(0,0,R,R*1.04,0,0,TAU);ctx.clip();ctx.fillStyle='rgba(0,0,0,.07)';ctx.beginPath();ctx.ellipse(-R*.1,R*1.05,R*1.1,R*.4,0,0,TAU);ctx.fill();ctx.restore();
  // nos
  ctx.fillStyle=shade(L.sk,.04);ctx.beginPath();ctx.moveTo(R*.93,-R*.02);ctx.quadraticCurveTo(R*1.13,R*.1,R*.94,R*.24);ctx.fill();ctx.strokeStyle=OL;ctx.lineWidth=3;ctx.stroke();
  // ucho
  ctx.fillStyle=shade(L.sk,-.05);ctx.beginPath();ctx.ellipse(-R*.42,R*.08,R*.17,R*.22,0,0,TAU);ctx.fill();ctx.strokeStyle=OL;ctx.lineWidth=2.5;ctx.stroke();ctx.fillStyle=shade(L.sk,-.25);ctx.beginPath();ctx.ellipse(-R*.42,R*.1,R*.07,R*.11,0,0,TAU);ctx.fill();
  // --- włosy z przodu
  ctx.strokeStyle=OL;ctx.lineWidth=3;
  function shine(a,b,c){ctx.save();ctx.strokeStyle=HL;ctx.globalAlpha=.7;ctx.lineWidth=R*.07;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.quadraticCurveTo(b[0],b[1],c[0],c[1]);ctx.stroke();ctx.restore()}
  if(L.hs===0){ // przedziałek, grzywka na bok
    ctx.fillStyle=hairG();cap([-R*.62,-R*.46,-R*.72,-R*.38,-R*.25]);ctx.fill();ctx.stroke();
    ctx.fillStyle=hairG();ctx.beginPath();ctx.moveTo(-R*.1,-R*.95);ctx.quadraticCurveTo(R*.6,-R*.9,R*.98,-R*.3);ctx.quadraticCurveTo(R*.6,-R*.5,R*.25,-R*.44);ctx.quadraticCurveTo(R*.05,-R*.7,-R*.1,-R*.95);ctx.closePath();ctx.fill();ctx.stroke();
    shine([-R*.5,-R*.78],[-R*.1,-R*1.0],[R*.35,-R*.85])}
  else if(L.hs===1){ // loki
    ctx.fillStyle=HC;cap([-R*.56,-R*.55,-R*.6,-R*.45,-R*.3]);ctx.fill();ctx.stroke();
    ctx.save();ctx.fillStyle=HL;ctx.globalAlpha=.5;[[-R*.62,-R*1.02],[-R*.2,-R*1.18],[R*.28,-R*1.14],[R*.7,-R*.92]].forEach(function(c){circ(c[0],c[1],R*.09);ctx.fill()});ctx.restore();
    ctx.fillStyle=HC;ctx.lineWidth=2;ctx.strokeStyle=HD;[[R*.05,-R*.6],[R*.45,-R*.55],[-R*.35,-R*.55]].forEach(function(c){ctx.beginPath();ctx.arc(c[0],c[1],R*.2,PI*.1,PI*.9);ctx.fill();ctx.stroke()})}
  else if(L.hs===2){ // dłuższe z grzywką
    ctx.fillStyle=hairG();cap([-R*.4,-R*.38,-R*.55,-R*.4,-R*.1]);ctx.fill();ctx.stroke();
    shine([-R*.55,-R*.72],[-R*.1,-R*1.0],[R*.4,-R*.86])}
  else if(L.hs===3){ // krótko ścięte
    ctx.fillStyle=hairG();cap([-R*.66,-R*.58,-R*.66,-R*.5,-R*.34],.98);ctx.fill();ctx.stroke();
    shine([-R*.35,-R*.86],[R*.05,-R*.98],[R*.45,-R*.84])}
  else if(L.hs===4){ // kolce: podstawa czapki zakrywa ich nasady
    ctx.fillStyle=hairG();cap([-R*.5,-R*.5,-R*.58,-R*.42,-R*.2]);ctx.fill();ctx.stroke();
    shine([-R*.45,-R*.76],[0,-R*.95],[R*.45,-R*.78])}
  else if(L.hs===5){ // afro
    ctx.fillStyle=hairG();cap([-R*.6,-R*.56,-R*.62,-R*.46,-R*.3]);ctx.fill();
    ctx.save();ctx.fillStyle=HL;ctx.globalAlpha=.28;for(var d2=0;d2<10;d2++){circ(-R*.8+d2*R*.18,-R*(1.05+.16*Math.sin(d2*1.9)),R*.07);ctx.fill()}ctx.restore()}
  else if(L.hs===6){ // czapka Qastrod
    ctx.fillStyle=HC;cap([-R*.4,-R*.3,-R*.4,-R*.3,-R*.1]);ctx.fill();ctx.stroke();
    var cg=ctx.createLinearGradient(0,-R*1.25,0,-R*.3);cg.addColorStop(0,'#253a80');cg.addColorStop(1,'#0e1b44');ctx.fillStyle=cg;
    ctx.beginPath();ctx.ellipse(0,0,R*1.08,R*1.14,0,PI*1.02,PI*1.97,false);ctx.quadraticCurveTo(0,-R*.52,-R*1.07,-R*.2);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#16d97d';ctx.beginPath();ctx.moveTo(R*.35,-R*.42);ctx.quadraticCurveTo(R*1.3,-R*.54,R*1.55,-R*.24);ctx.quadraticCurveTo(R*1.05,-R*.1,R*.45,-R*.24);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.16)';ctx.beginPath();ctx.ellipse(-R*.25,-R*.9,R*.4,R*.13,-.2,0,TAU);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='400 '+Math.round(R*.55)+'px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Q',-R*.08,-R*.74)}
  if(L.lg){ctx.fillStyle='#fff';ctx.strokeStyle=OL;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-R*1.06,-R*.44);ctx.quadraticCurveTo(0,-R*.7,R*1.02,-R*.5);ctx.lineTo(R*1.0,-R*.3);ctx.quadraticCurveTo(0,-R*.5,-R*1.04,-R*.24);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#ffc93c';ctx.fillRect(-R*.18,-R*.6,R*.36,R*.2)}
  // --- oczy (3/4: bliższe większe)
  var ey=-R*.08,look={x:clamp(lx*dir,-1,1),y:clamp(ly,-1,1)};
  var EYE=[[R*.4,1],[R*.8,.78]];
  EYE.forEach(function(e,i){var cx=e[0],sz=e[1],rx=R*.19*sz,ry=R*.24*sz;
    ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(cx,ey,rx,ry,0,0,TAU);ctx.fill();ctx.strokeStyle=OL;ctx.lineWidth=2.4;ctx.stroke();
    if(mood==='happy'){ctx.fillStyle=L.sk;ctx.fillRect(cx-rx-2,ey,rx*2+4,ry+3);ctx.strokeStyle=OL;ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,ey+ry*.3,rx*.8,PI*1.1,PI*1.9);ctx.stroke();return}
    ctx.save();ctx.beginPath();ctx.ellipse(cx,ey,rx,ry,0,0,TAU);ctx.clip();
    var px=cx+look.x*rx*.38,py=ey+look.y*ry*.35+ry*.05;
    var ig=ctx.createRadialGradient(px,py+rx*.2,rx*.05,px,py,rx*.68);ig.addColorStop(0,shade(L.ey,.45));ig.addColorStop(1,shade(L.ey,-.2));ctx.fillStyle=ig;circ(px,py,rx*.66);ctx.fill();
    ctx.fillStyle='#0b0b14';circ(px,py,rx*.32);ctx.fill();ctx.fillStyle='#fff';circ(px-rx*.22,py-ry*.24,rx*.2);ctx.fill();
    if(mood==='kick'||mood==='sad'){ctx.fillStyle=L.sk;ctx.beginPath();ctx.ellipse(cx,ey-ry*.95,rx*1.3,ry*.55,0,0,TAU);ctx.fill()}
    ctx.restore();
    ctx.strokeStyle=OL;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(cx,ey,rx,ry,0,PI*1.12,PI*1.88);ctx.stroke()});
  // --- brwi: każda nad swoim okiem, z odstępem
  ctx.fillStyle=HC==='#e9c46a'||HC==='#d9973e'?shade(HC,-.35):HC;var bt=mood==='kick'?.35:mood==='sad'?-.35:0;
  EYE.forEach(function(e,i){var w=R*.16*e[1];ctx.save();ctx.translate(e[0],ey-R*.24*e[1]-R*.12);ctx.rotate(bt*(i?-1:1)*.7+(i?.12:-.06));
    ctx.beginPath();ctx.moveTo(-w,R*.035);ctx.quadraticCurveTo(-w*.2,-R*.07,w,-R*.01);ctx.lineTo(w,R*.03);ctx.quadraticCurveTo(-w*.2,-R*.01,-w,R*.06);ctx.closePath();ctx.fill();ctx.restore()});
  // --- piegi
  if(L.fr){ctx.fillStyle=shade(L.sk,-.3);[[R*.26,R*.3],[R*.36,R*.36],[R*.3,R*.22],[R*.74,R*.28],[R*.83,R*.35]].forEach(function(q){circ(q[0],q[1],R*.028);ctx.fill()})}
  // policzek
  ctx.fillStyle='rgba(255,90,90,.2)';ctx.beginPath();ctx.ellipse(R*.3,R*.38,R*.16,R*.1,0,0,TAU);ctx.fill();
  // usta
  var mx=R*.55,my=R*.52;ctx.strokeStyle=OL;ctx.lineWidth=3;
  if(mood==='happy'){ctx.fillStyle='#7a1f24';ctx.beginPath();ctx.moveTo(mx-R*.3,my-R*.05);ctx.quadraticCurveTo(mx,my+R*.38,mx+R*.3,my-R*.05);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(mx-R*.25,my-R*.04,R*.5,R*.09);ctx.fillStyle='#ff7a8a';circ(mx,my+R*.15,R*.08);ctx.fill()}
  else if(mood==='kick'){ctx.fillStyle='#fff';rr(mx-R*.22,my-R*.06,R*.44,R*.16,R*.05);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(mx-R*.22,my+R*.02);ctx.lineTo(mx+R*.22,my+R*.02);ctx.stroke()}
  else if(mood==='sad'){ctx.beginPath();ctx.arc(mx,my+R*.2,R*.2,PI*1.15,PI*1.85);ctx.stroke()}
  else if(mood==='frozen'){ctx.fillStyle='#fff';rr(mx-R*.2,my-R*.05,R*.4,R*.14,R*.05);ctx.fill();ctx.stroke()}
  else{ctx.beginPath();ctx.arc(mx,my-R*.12,R*.22,PI*.2,PI*.8);ctx.stroke()}
  ctx.restore();
}

/* ---------- dane ---------- */
var HEADS=[
 {n:'Skaut Qastrod',sk:'#f2c29a',hc:'#4a2c17',hs:6,sh:'#2b2bff',ey:'#3b2412'},
 {n:'Olek Kopyto',sk:'#f3c7a0',hc:'#5a3317',hs:0,sh:'#e5243b',ey:'#5a3a1a'},
 {n:'Franek Florek',fr:1,sk:'#f6cfa8',hc:'#d9973e',hs:1,sh:'#2b2bff',ey:'#2f6fbf'},
 {n:'Staś Sprint',sk:'#9a6440',hc:'#1b1208',hs:5,sh:'#ffc93c',ey:'#3b2412'},
 {n:'Bartek Bomba',sk:'#c68a5c',hc:'#2b1a0e',hs:4,sh:'#ff7a1a',ey:'#3b2412'},
 {n:'Igor Wślizg',fr:1,sk:'#f6d2b0',hc:'#e9c46a',hs:0,sh:'#16d97d',ey:'#3f8f5a'},
 {n:'Julek Podcinka',sk:'#e0ac80',hc:'#7a3b1a',hs:2,sh:'#ffffff',ey:'#5a3a1a'},
 {n:'Antek Tunel',sk:'#6e4529',hc:'#140c05',hs:1,sh:'#e5243b',ey:'#2a170b'},
 {n:'Nikola Główka',sk:'#f3c7a0',hc:'#1b1208',hs:4,sh:'#35c8ff',ey:'#2f6fbf'},
 {n:'Maks Przewrotka',sk:'#f6d2b0',hc:'#d9973e',hs:2,sh:'#0d1c38',ey:'#3f8f5a'},
 {n:'Leon Laser',sk:'#e0ac80',hc:'#1b1208',hs:3,sh:'#ffffff',ey:'#5a3a1a'},
 {n:'Kuba Rakieta',sk:'#6e4529',hc:'#140c05',hs:5,sh:'#2b2bff',ey:'#2a170b'},
 {n:'Filip Fenomen',sk:'#c68a5c',hc:'#1b1208',hs:0,sh:'#ffc93c',ey:'#3b2412',lg:1}];
var LEAGUE=[
 [1,.08,'Podwórko'],[2,.17,'Podwórko'],[3,.26,'Podwórko'],
 [4,.34,'Liga okręgowa'],[5,.42,'Liga okręgowa'],[6,.50,'Liga okręgowa'],
 [7,.58,'Ekstraklasa'],[8,.65,'Ekstraklasa'],[9,.72,'Ekstraklasa'],
 [10,.80,'Liga Mistrzów'],[11,.88,'Liga Mistrzów'],[12,.96,'Finał Mundialu']];
var TIER={'Podwórko':0,'Liga okręgowa':1,'Ekstraklasa':2,'Liga Mistrzów':3,'Finał Mundialu':4};
var UPG=[
 ['acc','Celność','Szersza zielona strefa',70,5,'&#127919;'],
 ['pow','Siła','Szybszy strzał',80,5,'&#9917;'],
 ['ref','Refleks','Szybsza parada',80,5,'&#9889;'],
 ['rch','Zasięg','Dłuższe ręce',90,5,'&#129508;']];

/* ---------- zapis ---------- */
var KEY='qastrod_karne_v1';
var SV={coins:0,up:{acc:0,pow:0,ref:0,rch:0},stars:{},next:0,muted:false,wins:0,goals:0,saves:0,help:0};
var SVDEF=JSON.stringify(SV);
try{var d0=JSON.parse(localStorage.getItem(KEY)||'null');if(d0){for(var k0 in SV)if(d0[k0]!==undefined)SV[k0]=d0[k0];SV.up=Object.assign({acc:0,pow:0,ref:0,rch:0},d0.up||{})}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(SV))}catch(e){}}
function upv(k){return SV.up[k]||0}
function upCost(k){var u=UPG.filter(function(x){return x[0]===k})[0];return Math.round(u[3]*Math.pow(1.7,SV.up[k])/10)*10}

/* ---------- geometria: bramka widziana zza strzelca ---------- */
var GX=480,GL=330,GHW=230,GHH=180,SPOT={x:480,y:520};
function gp(u,v){return{x:GX+u*GHW,y:GL-v*GHH}}
function toG(x,y){return{u:(x-GX)/GHW,v:(GL-y)/GHH}}
var KC_V=.41; // środek ciała bramkarza (wysokość)

/* ---------- tło ---------- */
var bg=document.createElement('canvas');bg.width=W*2;bg.height=H*2;var bgT=-1;
/* ---------- motywy: każdy poziom ma inną scenerię ---------- */
var THEMES=[
 {n:'Poranek na podwórku',sky:['#8fd0ff','#e2f5ff'],sc:'trees',sun:[.82,.18,'#fff6c8'],grass:['#3fae57','#379c4e'],board:'#1a2a18',bt:'#ffe08a'},
 {n:'Boisko pod blokiem',sky:['#6fb8ff','#cdeeff'],sc:'blocks',grass:['#35a352','#2f944a'],board:'#1a2a18',bt:'#ffe08a'},
 {n:'Zachód słońca',sky:['#ff8a5c','#ffd9a0'],sc:'trees',sun:[.2,.5,'#ffe4a8'],dusk:1,grass:['#2e9449','#298642'],board:'#2a1a12',bt:'#ffc93c'},
 {n:'Pochmurna niedziela',sky:['#9fb2c9','#dfe6ee'],sc:'small',cr:['#e5243b','#ffffff','#e5243b','#9fb2d9'],dens:.55,clouds:1,grass:['#2f9a4d','#2a8a45'],board:'#10151f',bt:'#ffffff'},
 {n:'Deszczowy mecz',sky:['#6d7f96','#a9b6c6'],sc:'small',cr:['#2b2bff','#ffc93c','#2b2bff','#ffffff'],dens:.6,clouds:2,wx:'rain',grass:['#27864a','#227a42'],board:'#0b1020',bt:'#ffc93c'},
 {n:'Wieczór przy jupiterach',sky:['#243b6b','#5d7fb8'],sc:'small',cr:['#16d97d','#ffffff','#16d97d','#0a5a34'],dens:.7,lights:1,grass:['#23884a','#1e7a42'],board:'#04120b',bt:'#16d97d'},
 {n:'Derby w nocy',sky:['#0c1a3c','#1c3a86'],sc:'big',cr:['#e5243b','#ffffff','#ff7a1a','#e5243b'],dens:.95,lights:1,flares:1,grass:['#1f8a4d','#1b7c45'],board:'#02050c',bt:'#ffc93c'},
 {n:'Żółta ściana',sky:['#0e1633','#23346e'],sc:'big',cr:['#ffc93c','#111111','#ffc93c','#ffe27a'],dens:1,lights:1,banner:'QASTROD',grass:['#1f8a4d','#1b7c45'],board:'#02050c',bt:'#ffc93c'},
 {n:'Zimowy wieczór',sky:['#1b2a4a','#51688f'],sc:'big',cr:['#e5243b','#ffffff','#9fb2d9','#ffffff'],dens:.9,lights:1,wx:'snow',snowGrass:1,grass:['#2c8a57','#27804f'],board:'#02050c',bt:'#ffffff'},
 {n:'Noc Ligi Mistrzów',sky:['#02030f','#0a1450'],sc:'big',cr:['#ffffff','#4d6bff','#9fb2ff','#ffffff'],dens:.95,lights:1,stars:1,cl:1,grass:['#1c8a4b','#197c43'],board:'#020818',bt:'#9fb2ff'},
 {n:'Półfinał w blasku fleszy',sky:['#12052a','#3a1a6e'],sc:'big',cr:['#b388ff','#ffffff','#ffc93c','#7c4dff'],dens:1,lights:1,stars:1,flags:1,flash:1,grass:['#1c8a4b','#197c43'],board:'#0b0418',bt:'#e0c8ff'},
 {n:'Finał Mundialu',sky:['#120c02','#3a2a08'],sc:'big',cr:['#ffffff','#e5243b','#ffc93c','#16d97d','#2b2bff'],dens:1,lights:1,stars:1,gold:1,fireworks:1,flash:1,grass:['#1c8a4b','#197c43'],board:'#140c02',bt:'#ffc93c'}];
function drawBoards(TH,y,h){ctx.save();ctx.beginPath();ctx.rect(0,y,W,h);ctx.clip();ctx.fillStyle=TH.bt;ctx.font='400 '+Math.round(h*.58)+'px Anton, Impact, sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';var T='QASTROD.PL      ',tw=ctx.measureText(T).width,off=(S.t*70)%tw;for(var x=-off;x<W;x+=tw)ctx.fillText(T,x,y+h/2+1);ctx.restore()}
function themeOf(lv){return THEMES[clamp(lv|0,0,THEMES.length-1)]}
/* rysuje niebo, scenerię i trybuny w pasie 0..bottom (top = góra trybun) */
function drawBackdrop(c,TH,top,bottom,seed0){
  var seed=seed0||7;function R(){seed=(seed*16807)%2147483647;return seed/2147483647}
  var g=c.createLinearGradient(0,0,0,bottom);g.addColorStop(0,TH.sky[0]);g.addColorStop(1,TH.sky[1]);c.fillStyle=g;c.fillRect(0,0,W,bottom);
  if(TH.stars){c.fillStyle='rgba(255,255,255,.85)';for(var s=0;s<80;s++){c.beginPath();c.arc(R()*W,R()*top*.9,R()*1.4+.3,0,TAU);c.fill()}}
  if(TH.sun){var sx=TH.sun[0]*W,sy=TH.sun[1]*bottom,sg=c.createRadialGradient(sx,sy,6,sx,sy,120);sg.addColorStop(0,TH.sun[2]);sg.addColorStop(.25,'rgba(255,240,200,.6)');sg.addColorStop(1,'rgba(255,240,200,0)');c.fillStyle=sg;c.fillRect(sx-120,sy-120,240,240);c.fillStyle=TH.sun[2];c.beginPath();c.arc(sx,sy,26,0,TAU);c.fill()}
  if(TH.clouds){for(var k=0;k<7;k++){var cx=R()*W,cy=R()*top*.8+14,cw=60+R()*90;c.fillStyle=TH.clouds>1?'rgba(90,100,118,.55)':'rgba(255,255,255,.7)';for(var q=0;q<4;q++){c.beginPath();c.ellipse(cx+q*cw*.28,cy+(q%2)*6,cw*.3,cw*.18,0,0,TAU);c.fill()}}}
  if(TH.sc==='trees'){
    var tc=TH.dusk?'#2a4a2c':'#2f7a34',tc2=TH.dusk?'#1f3a22':'#276a2c';
    for(var t2=0;t2<13;t2++){var tx=t2*80+R()*30-10,ty=top+18+R()*14,tr=40+R()*26;c.fillStyle=t2%2?tc:tc2;c.beginPath();c.arc(tx,ty,tr,0,TAU);c.fill()}
    c.fillStyle=TH.dusk?'#5a3a22':'#7a5431';c.fillRect(0,top+34,W,bottom-top-34);c.fillStyle='rgba(0,0,0,.18)';for(var x0=0;x0<W;x0+=28)c.fillRect(x0,top+34,3,bottom-top-34);
    c.fillStyle='rgba(255,255,255,.08)';c.fillRect(0,top+34,W,4);
    return}
  if(TH.sc==='blocks'){
    for(var bI=0;bI<6;bI++){var bx=bI*170-20+R()*30,bw=140,bh=90+R()*70,by=top+60-bh;c.fillStyle=bI%2?'#d9d2c3':'#c9c1b0';c.fillRect(bx,by,bw,bh+60);
      for(var wy=by+10;wy<top+50;wy+=18)for(var wx=bx+10;wx<bx+bw-10;wx+=20){c.fillStyle=R()<.25?'#ffe9a8':'#6d8fb3';c.fillRect(wx,wy,11,10)}}
    c.fillStyle='#5a6a5a';c.fillRect(0,top+50,W,bottom-top-50);c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1.5;
    for(var fx=0;fx<W;fx+=14){c.beginPath();c.moveTo(fx,top+50);c.lineTo(fx+14,bottom);c.moveTo(fx+14,top+50);c.lineTo(fx,bottom);c.stroke()}
    return}
  // trybuny
  var st=TH.sc==='small'?top+40:top;
  if(TH.sc==='small'){c.fillStyle='#3b4a63';c.beginPath();c.moveTo(0,st);c.lineTo(W,st);c.lineTo(W,st-16);c.lineTo(0,st-16);c.fill();c.fillStyle='#56657f';for(var r0=0;r0<W;r0+=120)c.fillRect(r0,st-40,6,26)}
  var sg2=c.createLinearGradient(0,st,0,bottom);sg2.addColorStop(0,'#0a1733');sg2.addColorStop(1,'#12234a');c.fillStyle=sg2;c.fillRect(0,st,W,bottom-st);
  var pal=TH.cr||['#2b2bff','#ffffff','#16d97d','#ffc93c','#e5243b','#9fb2d9'],dens=TH.dens||.8;
  for(var y=st+6;y<bottom-4;y+=9)for(var x=4;x<W;x+=9){if(R()>dens)continue;c.globalAlpha=.4+.55*(y-st)/(bottom-st);c.fillStyle=pal[Math.floor(R()*pal.length)];c.beginPath();c.arc(x,y,2.8,0,TAU);c.fill()}
  c.globalAlpha=1;
  if(TH.banner){c.save();c.fillStyle='rgba(0,0,0,.35)';c.fillRect(W*.25,st+18,W*.5,34);c.fillStyle='#ffc93c';c.font='400 28px Anton, Impact, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(TH.banner,W/2,st+36);c.restore()}
  if(TH.cl){c.save();c.strokeStyle='rgba(180,200,255,.5)';c.lineWidth=2;for(var sI=0;sI<5;sI++){var scx=W*(.15+sI*.175),scy=st+40;c.beginPath();for(var a5=0;a5<5;a5++){var an=-PI/2+a5*TAU*2/5;c[a5?'lineTo':'moveTo'](scx+Math.cos(an)*16,scy+Math.sin(an)*16)}c.closePath();c.stroke()}c.restore()}
  if(TH.flags){for(var fI=0;fI<8;fI++){var fxp=60+fI*120,fyp=st+10;c.fillStyle='#ddd';c.fillRect(fxp,fyp,2,40);c.fillStyle=pick(pal);c.beginPath();c.moveTo(fxp+2,fyp);c.quadraticCurveTo(fxp+20,fyp+6,fxp+34,fyp+2);c.lineTo(fxp+34,fyp+20);c.quadraticCurveTo(fxp+20,fyp+24,fxp+2,fyp+18);c.fill()}}
  if(TH.gold){var gg=c.createLinearGradient(0,st,0,bottom);gg.addColorStop(0,'rgba(255,201,60,.18)');gg.addColorStop(1,'rgba(255,201,60,0)');c.fillStyle=gg;c.fillRect(0,st,W,bottom-st)}
  if(TH.lights){[[70,Math.max(24,st-26)],[W-70,Math.max(24,st-26)]].forEach(function(p){c.fillStyle='#1c2742';c.fillRect(p[0]-40,p[1]-8,80,20);for(var i=0;i<5;i++){c.fillStyle='#fffbe6';c.beginPath();c.arc(p[0]-32+i*16,p[1]+2,4,0,TAU);c.fill()}
    var lg=c.createRadialGradient(p[0],p[1],4,p[0],p[1],200);lg.addColorStop(0,'rgba(255,250,220,.45)');lg.addColorStop(1,'rgba(255,250,220,0)');c.fillStyle=lg;c.fillRect(p[0]-200,0,400,300)})}
}
/* pogoda i efekty co klatkę */
var wxP=[],fwP=[];
function drawWeather(TH,t,dt,ground){
  if(!TH)return;
  if(TH.wx==='rain'){while(wxP.length<120)wxP.push({x:rnd(0,W),y:rnd(-H,0),v:rnd(700,950)});ctx.strokeStyle='rgba(200,220,255,.45)';ctx.lineWidth=1.5;ctx.beginPath();
    wxP.forEach(function(p){p.y+=p.v*dt;p.x-=p.v*.12*dt;if(p.y>ground){p.y=rnd(-60,0);p.x=rnd(0,W+60)}ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+2,p.y-14)});ctx.stroke()}
  else if(TH.wx==='snow'){while(wxP.length<90)wxP.push({x:rnd(0,W),y:rnd(-H,0),v:rnd(30,70),r:rnd(1.5,3.5),ph:rnd(0,TAU)});ctx.fillStyle='rgba(255,255,255,.85)';
    wxP.forEach(function(p){p.y+=p.v*dt;p.x+=Math.sin(t*1.5+p.ph)*12*dt;if(p.y>ground){p.y=rnd(-40,0);p.x=rnd(0,W)}ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.fill()})}
  if(TH.flares){ctx.save();ctx.globalCompositeOperation='lighter';[[W*.12,0],[W*.88,1]].forEach(function(f){var fl=.5+.5*Math.sin(t*9+f[1]*2)*Math.sin(t*3.3),gx=f[0],gy=ground*.5;var g=ctx.createRadialGradient(gx,gy,2,gx,gy,70+fl*20);g.addColorStop(0,'rgba(255,90,40,'+(.55+.3*fl)+')');g.addColorStop(1,'rgba(255,60,20,0)');ctx.fillStyle=g;ctx.fillRect(gx-100,gy-100,200,200)});ctx.restore()}
  if(TH.flash&&Math.random()<.2){var fx=rnd(20,W-20),fy=rnd(ground*.25,ground*.85);ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.arc(fx,fy,2.5,0,TAU);ctx.fill()}
  if(TH.fireworks){if(Math.random()<.03){var ox=rnd(80,W-80),oy=rnd(20,ground*.3),col=pick(['255,201,60','255,77,109','53,200,255','22,217,125','255,255,255']);for(var k=0;k<28;k++){var a=k*TAU/28;fwP.push({x:ox,y:oy,vx:Math.cos(a)*rnd(50,90),vy:Math.sin(a)*rnd(50,90),t:0,c:col})}}
    ctx.save();ctx.globalCompositeOperation='lighter';fwP.forEach(function(p){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=40*dt;ctx.fillStyle='rgba('+p.c+','+Math.max(0,1-p.t/1.2)+')';ctx.beginPath();ctx.arc(p.x,p.y,2.2,0,TAU);ctx.fill()});ctx.restore();fwP=fwP.filter(function(p){return p.t<1.2})}
}

function buildBg(lv){
  if(lv===bgT)return;bgT=lv;var TH=themeOf(lv),c=bg.getContext('2d');c.setTransform(2,0,0,2,0,0);
  var top=TH.sc==='trees'?150:TH.sc==='blocks'?150:TH.sc==='small'?100:50;
  drawBackdrop(c,TH,top,292,11+lv*17);
  c.fillStyle=TH.board;c.fillRect(0,292,W,34);c.fillStyle=TH.bt;c.fillRect(0,289,W,3);
  
  var y0=326,n=9;for(var k=0;k<n;k++){var a=y0+(H-y0)*Math.pow(k/n,1.5),b=y0+(H-y0)*Math.pow((k+1)/n,1.5);c.fillStyle=k%2?TH.grass[0]:TH.grass[1];c.fillRect(0,a,W,b-a+1)}
  if(TH.snowGrass){c.fillStyle='rgba(255,255,255,.3)';for(var sn=0;sn<50;sn++){var yy=y0+Math.random()*(H-y0);c.beginPath();c.ellipse(Math.random()*W,yy,(8+Math.random()*16)*(yy/H),(2+Math.random()*3)*(yy/H),0,0,TAU);c.fill()}}
  var sh=c.createLinearGradient(0,y0,0,y0+60);sh.addColorStop(0,'rgba(0,0,0,.25)');sh.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=sh;c.fillRect(0,y0,W,60);
  c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=3;
  c.beginPath();c.moveTo(0,GL);c.lineTo(W,GL);c.stroke();
  c.beginPath();c.moveTo(170,GL);c.lineTo(140,378);c.lineTo(820,378);c.lineTo(790,GL);c.stroke();
  c.lineWidth=3.5;c.beginPath();c.moveTo(40,GL);c.lineTo(-60,470);c.lineTo(1020,470);c.lineTo(920,GL);c.stroke();
  c.beginPath();c.ellipse(480,472,120,26,0,0,PI);c.stroke();
  c.fillStyle='#fff';c.beginPath();c.ellipse(SPOT.x,SPOT.y+4,9,3.5,0,0,TAU);c.fill();
  var vg=c.createRadialGradient(W/2,H*.5,H*.35,W/2,H*.5,H*.95);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,8,20,.4)');c.fillStyle=vg;c.fillRect(0,0,W,H);
  wxP=[];fwP=[];
}

/* ---------- stan ---------- */
var S={st:'menu',t:0,lv:0,kicks:[[],[]],turn:0,sd:false,ball:null,K:null,shooter:null,aim:{x:GX,y:GL-110},meter:0,mT:0,phT:0,res:null,shake:0,slow:0,flash:0,flashCol:'#fff',net:0,netX:0,netY:0};
var parts=[],floats=[];
function mySkill(){return 0}
function oppS(){return LEAGUE[S.lv][1]}
function oppHead(){return LEAGUE[S.lv][0]}
function keeperHead(){return S.turn===0?oppHead():0}
function shooterHead(){return S.turn===0?0:oppHead()}

function goalsOf(i){return S.kicks[i].filter(function(x){return x==='g'}).length}
function startMatch(lv){
  unlockAudio();crowdOn();crowdSet(.05);
  S.lv=lv;S.kicks=[[],[]];S.turn=0;S.sd=false;S.saves=0;parts=[];floats=[];hideOv();buildBg(lv);
  S.t0=S.t;nextKick();
}
function decided(){
  var a=S.kicks[0],b=S.kicks[1],ga=goalsOf(0),gb=goalsOf(1);
  if(a.length<=5&&b.length<=5&&!(a.length===5&&b.length===5)){
    var ra=5-a.length,rb=5-b.length;
    if(ga>gb+rb)return 0;if(gb>ga+ra)return 1;return -1;
  }
  if(a.length===b.length&&ga!==gb)return ga>gb?0:1;
  return -1;
}
function nextKick(){
  var d=decided();if(d>=0){endMatch(d);return}
  S.turn=S.kicks[0].length>S.kicks[1].length?1:0;
  if(S.kicks[0].length>=5&&S.kicks[1].length>=5&&!S.sd){S.sd=true;shout('Dogrywka karnych!','gold');toast('Seria do pierwszej pomyłki')}
  S.ball={x:SPOT.x,y:SPOT.y,r:15,rot:0,mode:'spot'};S.res=null;S.net=0;
  S.K={u:0,v:KC_V,du:0,dv:KC_V,dive:false,dt:0,ang:0,side:0,mood:null,bob:0};
  S.shooter={x:SPOT.x-70,y:SPOT.y+62,run:0,kick:0,lean:0};
  if(S.turn===0){S.st='aim';S.aimSet=false;S.meter=0;S.mT=0;
    S.hint=TOUCH?'Stuknij w bramkę: tam strzelisz':'Wskaż myszką miejsce w bramce i kliknij';}
  else{S.st='cpuwait';S.phT=rnd(.7,1.2);S.dived=false;planCpuShot();
    S.hint=TOUCH?'Broń! Stuknij w bramkę, gdzie poleci piłka':'Broń! Kliknij w bramkę, gdzie poleci piłka';}
  sfx('whistle');
}
/* strzał gracza */
function meterSpeed(){return 1.35+.09*S.lv}
function greenZone(){return .09+.03*upv('acc')}
function lockAim(){S.aimSet=true;S.st='meter';S.mT=0;S.hint=TOUCH?'Stuknij, gdy wskazówka będzie w zielonym':'Kliknij, gdy wskazówka będzie w zielonym';sfx('beep')}
function stopMeter(){
  var x=S.meter,gz=greenZone(),err=Math.max(0,Math.abs(x)-gz)/(1-gz);
  var a=toG(S.aim.x,S.aim.y),ang=rnd(0,TAU),mag=err*.6;
  var qual=err<=0?'perfect':err<.35?'ok':'bad';
  S.shot={by:0,u:a.u+Math.cos(ang)*mag,v:a.v+Math.sin(ang)*mag*.8,T:.66-.036*upv('pow'),qual:qual};
  addFloat(qual==='perfect'?'Idealnie!':qual==='ok'?'Dobrze':'Krzywo!',W/2,420,qual==='perfect'?'#16d97d':qual==='ok'?'#ffc93c':'#ff4d6d');
  S.st='run';S.phT=0;S.hint='';planCpuKeeper();
}
/* bramkarz CPU */
function planCpuKeeper(){
  var s=oppS(),sh=S.shot,K=S.K,r=Math.random();
  K.spd=450+450*s;K.reach=30+10*s;K.maxD=140+60*s;
  var pRead=.18+.42*s,pStay=.1;
  if(r<pRead){K.gu=sh.u+rnd(-1,1)*(1-s)*.18;K.gv=sh.v+rnd(-1,1)*(1-s)*.2}
  else if(r<pRead+pStay){K.gu=rnd(-.1,.1);K.gv=rnd(.4,.8)}
  else{K.gu=pick([-1,1])*rnd(.45,.85);K.gv=rnd(.15,.8)}
  K.react=.06+.28*(1-s)+rnd(0,.06);
}
/* strzał CPU: czerwony znacznik na ułamek sekundy przed kopnięciem */
function markDur(){return .28-.13*oppS()}
function drawMark(){
  if(S.turn!==1||S.st!=='run'||!S.shot)return;var left=.5-S.phT;if(left>markDur())return;
  var p=gp(S.shot.u,S.shot.v),k=left/markDur(),sz=30+10*k;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(PI/4*k);
  ctx.fillStyle='rgba(255,40,60,.35)';ctx.fillRect(-sz/2,-sz/2,sz,sz);ctx.strokeStyle='#ff2d4a';ctx.lineWidth=4;ctx.strokeRect(-sz/2,-sz/2,sz,sz);ctx.restore()}
/* strzał CPU */
function planCpuShot(){
  var s=oppS(),side=pick([-1,1]);
  var tu=side*rnd(.5+.25*s,.8+.12*s),tv=rnd(.1,.6+.3*s);
  if(Math.random()<.08*(1-s)){tu=rnd(-.2,.2);tv=rnd(.2,.6)}
  var e=(1-s)*.2;
  S.shot={by:1,u:tu+rnd(-e,e),v:tv+rnd(-e,e)*.8,T:.53-.08*s+rnd(-.02,.02)};
  S.shooter.lean=side*(.35+.65*(1-s))*(Math.abs(tu)>.25?1:0);
  var K=S.K;K.spd=540+55*upv('ref');K.reach=30+4*upv('rch');K.maxD=150+14*upv('rch');
}
function diveTo(gu,gv){ // gracz rzuca się w bramce
  var K=S.K;if(S.turn!==1||K.dive||S.dived)return;S.dived=true;startDive(K,gu,gv);sfx('dive')}
function startDive(K,gu,gv){
  var sx=gp(K.u,K.v),tx=gp(gu,gv),dx=tx.x-sx.x,dy=tx.y-sx.y,d=Math.hypot(dx,dy);
  if(d>K.maxD){dx*=K.maxD/d;dy*=K.maxD/d;d=K.maxD}
  K.dive=true;K.fromX=sx.x;K.fromY=sx.y;K.toX=sx.x+dx;K.toY=sx.y+dy;K.dd=d;K.dt=0;K.dur=Math.max(.12,d/K.spd);
  K.side=dx>18?1:dx<-18?-1:0;K.hi=dy<-40;
}
function keeperPos(K){
  if(!K.dive)return gp(K.u,K.v);
  var k=Math.min(1,K.dt/K.dur),e=1-Math.pow(1-k,2);
  return{x:K.fromX+(K.toX-K.fromX)*e,y:K.fromY+(K.toY-K.fromY)*e-Math.sin(k*PI)*(K.hi?10:22)};
}
function keeperAxis(K){ // oś ciała: od nóg do rąk
  var p=keeperPos(K),k=K.dive?Math.min(1,K.dt/K.dur):0,a=K.side*1.3*k+(K.side===0&&K.dive?0:0);
  return{p:p,a:a};
}
function saveCheck(bx,by){
  var K=S.K,ax=keeperAxis(K),p=ax.p,a=ax.a;
  // odcinek od bioder do dłoni
  var ux=Math.sin(a),uy=-Math.cos(a),x1=p.x-ux*40,y1=p.y-uy*40,x2=p.x+ux*64,y2=p.y+uy*64;
  var vx=x2-x1,vy=y2-y1,t=clamp(((bx-x1)*vx+(by-y1)*vy)/(vx*vx+vy*vy),0,1),qx=x1+vx*t,qy=y1+vy*t;
  var body=Math.hypot(bx-qx,by-qy),rad=K.reach+(t>.7?6:0);
  return body<rad;
}
/* lot piłki */
function kickBall(){
  var sh=S.shot,b=S.ball,tp=gp(sh.u,sh.v);
  b.mode='fly';b.t=0;b.T=sh.T;b.sx=SPOT.x;b.sy=SPOT.y;b.tx=tp.x;b.ty=tp.y;b.curve=(Math.random()-.5)*40;
  sfx('kick');S.shake=5;burst(SPOT.x,SPOT.y,10,'#fff',260);crowdSet(.12);
}
function outcome(){
  var sh=S.shot,u=Math.abs(sh.u),v=sh.v;
  if(v<-.02)v=0;
  if(u>1.07||v>1.07)return 'miss';
  if(u>=.97||v>=.97)return v>=.97&&u<.97?'bar':'post';
  return 'in';
}
function update(rdt){
  if(S.freeze)return;S.t+=rdt;var dt=rdt;if(S.slow>0){S.slow-=rdt;dt*=.3}
  if(S.shake>0)S.shake=Math.max(0,S.shake-rdt*30);if(S.flash>0)S.flash-=rdt;if(S.net>0)S.net-=rdt*1.6;
  var K=S.K,b=S.ball,sh=S.shooter;
  if(!K)return;
  K.bob+=dt;
  if(S.st==='meter'){S.mT+=dt;S.meter=Math.sin(S.mT*meterSpeed()*PI)}
  if(S.st==='cpuwait'){S.phT-=dt;if(S.phT<=0){S.st='run';S.phT=0}}
  if(S.st==='run'){S.phT+=dt;var k=Math.min(1,S.phT/.5);sh.run=k;sh.x=SPOT.x-70+52*k;sh.y=SPOT.y+62-40*k;
    if(k>=1){sh.kick=.3;kickBall();S.st='fly';
      if(S.turn===0){}
      if(DEBUG&&window.__krBot&&S.turn===1)botKeeper()}}
  if(sh.kick>0)sh.kick-=dt;
  if(S.st==='fly'){
    b.t+=dt;var e=Math.min(1,b.t/b.T);
    if(S.turn===0&&!K.dive&&b.t>=K.react)startDive(K,K.gu,K.gv);
    if(DEBUG&&window.__krBot&&S.turn===1&&S.botAt!=null&&b.t>=S.botAt&&!S.dived){diveTo(S.botU,S.botV)}
    b.x=b.sx+(b.tx-b.sx)*e+Math.sin(e*PI)*b.curve;b.y=b.sy+(b.ty-b.sy)*e-Math.sin(e*PI)*(26+30*S.shot.v);b.r=15-6*e;b.rot+=dt*18;
    if(e>=1)resolve();
  }
  if(K.dive){K.dt+=dt}
  if(S.st==='res'){S.phT-=rdt;
    if(b.mode==='in'){b.t+=dt;var q=Math.min(1,b.t/.25);b.r=9-1.5*q;b.y=b.ty-8*q+Math.min(40,Math.max(0,b.t-.25)*120);b.y=Math.min(b.y,GL-7);}
    else if(b.mode==='out'){b.vy+=900*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.r=Math.max(5,b.r-dt*2);b.rot+=dt*10;if(b.y>GL+40&&b.vy>0){b.vy*=-.35}}
    if(S.phT<=0){S.st='next';nextKick()}}
  parts.forEach(function(p){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.conf?60:500)*dt});parts=parts.filter(function(p){return p.t<p.life});
  floats.forEach(function(f){f.t+=rdt});floats=floats.filter(function(f){return f.t<f.life});
}
function resolve(){
  var b=S.ball,o=outcome(),me=S.turn===0,res;
  if(o==='in'&&saveCheck(b.tx,b.ty))o='save';
  if(o==='in'){res='g';b.mode='in';b.t=0;S.net=1;S.netX=b.tx;S.netY=b.ty;sfx('net');sfx('goal');S.shake=12;S.slow=.35;
    shout(me?'GOOOL!':'Gol rywala',me?'gold':'gold red');crowdSet(me?.3:.08);setTimeout(function(){crowdSet(.06)},1500);
    if(me)confetti(70);S.K.mood='sad';S.flash=.25;S.flashCol=me?'#16d97d':'#ff4d6d'}
  else{res='x';b.mode='out';
    if(o==='save'){var ax=keeperAxis(S.K);b.vx=(b.x-ax.p.x)*4+S.K.side*120;b.vy=-260-rnd(0,160);sfx('save');S.shake=10;S.slow=.45;
      shout(me?'Obronił!':'OBRONA!',me?'gold red':'gold');if(!me){S.saves++;confetti(60);crowdSet(.3);setTimeout(function(){crowdSet(.06)},1500)}else crowdSet(.02);S.K.mood='happy';burst(b.x,b.y,24,'#fff',300)}
    else if(o==='post'||o==='bar'){b.vx=(b.x<GX?-1:1)*rnd(180,320);b.vy=o==='bar'?-380:rnd(-200,80);sfx('post');S.shake=8;shout(o==='bar'?'Poprzeczka!':'Słupek!',me?'gold red':'gold')}
    else{b.vx=(b.x-GX)*.6;b.vy=-120;shout('Pudło!',me?'gold red':'gold');sfx('miss')}
    if(me)crowdSet(.03)}
  S.lastO=o;S.kicks[S.turn].push(res);S.st='res';S.phT=1.55;S.lastRes=res;
}
function endMatch(w){
  S.st='over';crowdSet(0);sfx('final');var L=LEAGUE[S.lv],win=w===0,ga=goalsOf(0),gb=goalsOf(1);
  var coins=(win?40+12*S.lv:10)+ga*6+S.saves*8,stars=0;
  if(win){stars=1;if(S.kicks[0].indexOf('x')<0)stars=2;if(stars===2&&S.saves>=2)stars=3;
    var prev=SV.stars[S.lv]||0;if(stars>prev){SV.stars[S.lv]=stars;coins+=(stars-prev)*15}
    if(S.lv>=SV.next)SV.next=Math.min(LEAGUE.length,S.lv+1);SV.wins++;sfx('win');confetti(90)}else sfx('lose');
  SV.goals+=ga;SV.saves+=S.saves;SV.coins+=coins;save();S.res={win:win,coins:coins,stars:stars,ga:ga,gb:gb};
  setTimeout(showResult,1000);
}
/* bot testowy */
function botKeeper(){var b=window.__krBot;S.botAt=.42-.12*b+rnd(0,.26)-markDur();S.botU=S.shot.u+rnd(-1,1)*(1-b)*.4;S.botV=S.shot.v+rnd(-1,1)*(1-b)*.4;if(Math.random()<.2*(1-b))S.botU=-S.botU}
function botShoot(){var b=window.__krBot;S.aim=gp(pick([-1,1])*rnd(.55,.85),rnd(.15,.8));lockAim();S.meter=pick([-1,1])*rnd(0,(1-b)*1.15*meterSpeed()/1.4);S.meter=clamp(S.meter,-1,1);stopMeter()}

/* ---------- efekty ---------- */
function burst(x,y,n,col,spd){for(var i=0;i<n;i++){var a=rnd(0,TAU),s=rnd(60,spd||360);parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,t:0,life:rnd(.4,1),col:col||'#fff',sz:rnd(2,5)})}if(parts.length>500)parts.splice(0,parts.length-500)}
function confetti(n){for(var i=0;i<n;i++)parts.push({x:rnd(0,W),y:rnd(-40,0),vx:rnd(-60,60),vy:rnd(40,200),t:0,life:rnd(1.4,2.4),col:pick(['#2b2bff','#16d97d','#ffc93c','#fff','#e5243b']),sz:rnd(3,7),conf:1})}
function addFloat(txt,x,y,col){floats.push({txt:txt,x:x,y:y,col:col||'#fff',t:0,life:1.1})}
function shout(h,cls){shoutEl.style.fontSize=h.length>12?'7cqw':'';shoutEl.textContent=h;shoutEl.className='lt-shout gk-shout '+(cls||'');void shoutEl.offsetWidth;shoutEl.classList.add('on')}
function toast(h){toastEl.innerHTML=h;toastEl.classList.remove('on');void toastEl.offsetWidth;toastEl.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(function(){toastEl.classList.remove('on')},1700)}

/* ---------- rysowanie ---------- */
function drawGoal(){
  var l=GX-GHW,r=GX+GHW,t=GL-GHH,bl=GX-GHW*.86,br=GX+GHW*.86,bt=t+26,bb=GL-18;
  // siatka
  ctx.fillStyle='rgba(8,16,34,.42)';ctx.beginPath();ctx.moveTo(l,t);ctx.lineTo(r,t);ctx.lineTo(br,bt);ctx.lineTo(br,bb);ctx.lineTo(r,GL);ctx.lineTo(l,GL);ctx.lineTo(bl,bb);ctx.lineTo(bl,bt);ctx.closePath();ctx.fill();
  ctx.save();ctx.beginPath();ctx.rect(l,t,r-l,GL-t);ctx.clip();
  ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.2;
  var bul=S.net>0?S.net:0;
  function bump(x,y){if(!bul)return[x,y];var dx=x-S.netX,dy=y-S.netY,d=Math.hypot(dx,dy),k=Math.max(0,1-d/110)*bul;return[x-dx*.25*k,y-dy*.25*k-10*k]}
  for(var x=bl;x<=br+1;x+=15){ctx.beginPath();for(var y=bt;y<=bb;y+=8){var q=bump(x,y);y===bt?ctx.moveTo(q[0],q[1]):ctx.lineTo(q[0],q[1])}ctx.stroke()}
  for(var y2=bt;y2<=bb+1;y2+=14){ctx.beginPath();for(var x2=bl;x2<=br;x2+=10){var q2=bump(x2,y2);x2===bl?ctx.moveTo(q2[0],q2[1]):ctx.lineTo(q2[0],q2[1])}ctx.stroke()}
  ctx.restore();
  ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=1.2;[[l,t,bl,bt],[r,t,br,bt],[l,GL,bl,bb],[r,GL,br,bb]].forEach(function(a){ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(a[2],a[3]);ctx.stroke()});
  ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;ctx.strokeRect(bl,bt,br-bl,bb-bt);
}
function drawPosts(){
  var l=GX-GHW,r=GX+GHW,t=GL-GHH;
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(l-5,GL-2,r-l+10,8);
  ctx.fillStyle='#f4f6fb';ctx.strokeStyle='rgba(20,14,40,.6)';ctx.lineWidth=2;
  ctx.fillRect(l-9,t-9,9,GHH+9);ctx.fillRect(r,t-9,9,GHH+9);ctx.fillRect(l-9,t-9,r-l+18,9);
  ctx.strokeRect(l-9,t-9,r-l+18,GHH+9);
  ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(l-3,t,3,GHH);ctx.fillRect(r+6,t,3,GHH);
}
function drawKeeper(){
  var K=S.K;if(!K)return;var ax=keeperAxis(K),p=ax.p,a=ax.a,L=HEADS[keeperHead()],me=S.turn===1;
  var jersey=me?'#16d97d':'#ff7a1a',idle=!K.dive,bob=idle?Math.sin(K.bob*6)*2:0,sway=idle?Math.sin(K.bob*3.2)*6:0;
  // cień
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(p.x,GL+4,46,8,0,0,TAU);ctx.fill();
  ctx.save();ctx.translate(p.x+sway,p.y+bob);ctx.rotate(a);ctx.scale(.86,.86);
  var OL='rgba(20,14,40,.9)';
  // nogi
  ctx.lineCap='round';ctx.strokeStyle=OL;ctx.lineWidth=15;ctx.beginPath();ctx.moveTo(-12,24);ctx.lineTo(-20,74);ctx.moveTo(12,24);ctx.lineTo(20,74);ctx.stroke();
  ctx.strokeStyle='#10204a';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(-12,24);ctx.lineTo(-20,74);ctx.moveTo(12,24);ctx.lineTo(20,74);ctx.stroke();
  ctx.fillStyle='#10131a';rr(-32,68,22,12,5);ctx.fill();rr(10,68,22,12,5);ctx.fill();
  // ręce w górę / do parady
  var up=K.dive?1:.55+.1*Math.sin(K.bob*5);
  ctx.strokeStyle=OL;ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(-20,-18);ctx.lineTo(-40,-18-44*up);ctx.moveTo(20,-18);ctx.lineTo(40,-18-44*up);ctx.stroke();
  ctx.strokeStyle=jersey;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(-20,-18);ctx.lineTo(-40,-18-44*up);ctx.moveTo(20,-18);ctx.lineTo(40,-18-44*up);ctx.stroke();ctx.lineCap='butt';
  // tułów
  ctx.fillStyle=jersey;ctx.strokeStyle=OL;ctx.lineWidth=3;rr(-26,-30,52,58,14);ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(-26,-6,52,6);
  ctx.fillStyle='#10204a';ctx.font='400 20px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('1',0,6);
  // rękawice
  [[-40,-18-44*up],[40,-18-44*up]].forEach(function(g){ctx.fillStyle='#ffffff';ctx.strokeStyle=OL;ctx.lineWidth=3;circ(g[0],g[1],12);ctx.fill();ctx.stroke();ctx.fillStyle=me?'#16d97d':'#ff3d7f';ctx.fillRect(g[0]-8,g[1]+3,16,4)});
  // głowa
  var b=S.ball||{x:GX,y:SPOT.y};headArt(0,-62,34,L,1,(b.x-p.x)/300,.5,K.mood||(K.dive?'kick':null),0);
  ctx.restore();
}
function drawShooter(){
  var sh=S.shooter;if(!sh)return;var L=HEADS[shooterHead()],me=S.turn===0,x=sh.x,y=sh.y,OL='rgba(20,14,40,.9)';
  var run=S.st==='run'?Math.sin(S.phT*22)*6:0,kk=sh.kick>0?sh.kick/.3:0,lean=sh.lean*(S.st==='run'?sh.run:0);
  ctx.save();ctx.translate(x,y);ctx.rotate(lean*.18);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(0,4,40,9,0,0,TAU);ctx.fill();
  ctx.lineCap='round';
  function leg(x0,x1,y1){ctx.strokeStyle=OL;ctx.lineWidth=17;ctx.beginPath();ctx.moveTo(x0,-44);ctx.lineTo(x1,y1);ctx.stroke();ctx.strokeStyle='#f4f4f4';ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(x0,-44);ctx.lineTo(x1,y1);ctx.stroke()}
  leg(-12,-16+run,-4);leg(12,16-run+kk*20,-4-kk*40);
  ctx.fillStyle=me?'#16d97d':'#ff3d7f';rr(-30+run,-12,26,14,6);ctx.fill();rr(4-run+kk*20,-12-kk*40,26,14,6);ctx.fill();ctx.lineCap='butt';
  ctx.fillStyle='#10204a';ctx.strokeStyle=OL;ctx.lineWidth=3;rr(-26,-62,52,24,8);ctx.fill();ctx.stroke();
  ctx.fillStyle=L.sh;rr(-30,-118,60,60,16);ctx.fill();ctx.stroke();
  ctx.fillStyle=L.sh==='#ffffff'||L.sh==='#ffc93c'?'#10204a':'#fff';ctx.font='400 30px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(me?'Q':String(oppHead()+1),0,-86);
  // głowa od tyłu
  var R=36,hy=-150;ctx.fillStyle=L.sk;ctx.strokeStyle=OL;ctx.lineWidth=3;circ(-R+3,hy+4,8);ctx.fill();ctx.stroke();circ(R-3,hy+4,8);ctx.fill();ctx.stroke();
  circ(0,hy,R);ctx.fill();ctx.stroke();
  ctx.save();circ(0,hy,R-1.5);ctx.clip();ctx.fillStyle=L.hc;
  if(L.hs===6){ctx.beginPath();ctx.ellipse(0,hy+R*.1,R*1.02,R*.85,0,0,TAU);ctx.fill();ctx.fillStyle='#10204a';ctx.fillRect(-R,hy-R,2*R,R*1.0);ctx.fillStyle='#16d97d';ctx.fillRect(-R,hy-2,2*R,4);ctx.fillStyle='rgba(255,255,255,.15)';ctx.beginPath();ctx.ellipse(-10,hy-R*.6,14,6,-.3,0,TAU);ctx.fill()}
  else{ctx.beginPath();ctx.ellipse(0,hy-6,R*1.05,R*(L.hs===3?.75:.95),0,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,.14)';ctx.beginPath();ctx.ellipse(-10,hy-20,12,6,-.4,0,TAU);ctx.fill()}
  ctx.restore();ctx.lineWidth=3;ctx.strokeStyle=OL;circ(0,hy,R);ctx.stroke();
  ctx.restore();
}
function drawBallAt(x,y,r,rot){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);ctx.fillStyle='#fff';circ(0,0,r);ctx.fill();ctx.save();circ(0,0,r);ctx.clip();ctx.fillStyle='#1b2233';
  function pent(px,py,rr2){ctx.beginPath();for(var i=0;i<5;i++){var a=-PI/2+i*TAU/5;ctx[i?'lineTo':'moveTo'](px+Math.cos(a)*rr2,py+Math.sin(a)*rr2)}ctx.closePath();ctx.fill()}
  pent(0,0,r*.36);for(var j=0;j<5;j++){var a2=-PI/2+j*TAU/5+PI/5;pent(Math.cos(a2)*r,Math.sin(a2)*r,r*.36)}ctx.restore();
  ctx.strokeStyle='rgba(20,14,40,.8)';ctx.lineWidth=Math.max(1,r*.14);circ(0,0,r);ctx.stroke();ctx.restore();
}
function drawBall(){
  var b=S.ball;if(!b)return;
  if(b.mode==='fly'){var e=b.t/b.T,gy=SPOT.y+(GL-SPOT.y)*e;ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(b.x,gy+2,b.r*1.1,b.r*.35,0,0,TAU);ctx.fill()}
  else if(b.mode==='spot'){ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(b.x,b.y+11,14,4,0,0,TAU);ctx.fill()}
  drawBallAt(b.x,b.y,b.r,b.rot);
}
function drawAim(){
  if(S.st!=='aim'&&S.st!=='meter')return;
  var a=S.aim,pul=1+.08*Math.sin(S.t*8),lock=S.st==='meter';
  ctx.save();ctx.translate(a.x,a.y);ctx.strokeStyle=lock?'#ffc93c':'#fff';ctx.lineWidth=4;ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=6;
  circ(0,0,20*pul);ctx.stroke();ctx.beginPath();ctx.moveTo(-30,0);ctx.lineTo(-10,0);ctx.moveTo(10,0);ctx.lineTo(30,0);ctx.moveTo(0,-30);ctx.lineTo(0,-10);ctx.moveTo(0,10);ctx.lineTo(0,30);ctx.stroke();
  if(lock){ // strefa rozrzutu
    var gz=greenZone(),x=Math.abs(S.meter),err=Math.max(0,x-gz)/(1-gz);ctx.setLineDash([6,6]);ctx.lineWidth=2;ctx.strokeStyle=err>0?'rgba(255,77,109,.9)':'rgba(22,217,125,.9)';ctx.beginPath();ctx.ellipse(0,0,6+err*.6*GHW,6+err*.6*GHH*.8,0,0,TAU);ctx.stroke();ctx.setLineDash([])}
  ctx.restore();
}
function drawMeter(){
  if(S.st!=='meter')return;
  var w=420,h=28,x=W/2-w/2,y=402,gz=greenZone();
  ctx.fillStyle='rgba(6,14,32,.85)';rr(x-10,y-10,w+20,h+20,18);ctx.fill();
  var g=ctx.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#ff4d6d');g.addColorStop(.35,'#ffc93c');g.addColorStop(.5-gz/2,'#ffc93c');g.addColorStop(.5-gz/2+.001,'#16d97d');g.addColorStop(.5+gz/2-.001,'#16d97d');g.addColorStop(.5+gz/2,'#ffc93c');g.addColorStop(.65,'#ffc93c');g.addColorStop(1,'#ff4d6d');
  ctx.fillStyle=g;rr(x,y,w,h,12);ctx.fill();
  var nx=x+w/2+S.meter*w/2;ctx.fillStyle='#fff';ctx.strokeStyle='#06101f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(nx,y-6);ctx.lineTo(nx-9,y-18);ctx.lineTo(nx+9,y-18);ctx.closePath();ctx.fill();ctx.stroke();rr(nx-3,y-4,6,h+8,3);ctx.fill();ctx.stroke();
}
function pill(txt,y,col){ctx.font='700 19px Barlow, Arial, sans-serif';var w=ctx.measureText(txt).width+44;ctx.fillStyle='rgba(6,14,32,.88)';rr(W/2-w/2,y-19,w,38,19);ctx.fill();ctx.fillStyle=col||'#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,W/2,y+1)}
var pcv={};
function portraitCanvas(ix){if(pcv[ix])return pcv[ix];var c=document.createElement('canvas');c.width=c.height=160;var old=ctx;ctx=c.getContext('2d');headArt(78,86,58,HEADS[ix],1,.4,0,null,0);ctx=old;return pcv[ix]=c}
function miniHead(x,y,R,ix,flip){var c=portraitCanvas(ix);ctx.save();if(flip){ctx.translate(x,0);ctx.scale(-1,1);ctx.translate(-x,0)}ctx.drawImage(c,x-R,y-R,R*2,R*2);ctx.restore()}
function drawHud(){
  var x=W/2-250,y=10,w=500,h=86;ctx.fillStyle='rgba(6,14,32,.88)';rr(x,y,w,h,18);ctx.fill();ctx.strokeStyle='rgba(77,107,255,.6)';ctx.lineWidth=2;ctx.stroke();
  miniHead(x+44,y+43,36,0,false);miniHead(x+w-44,y+43,36,oppHead(),true);
  ctx.fillStyle='#fff';ctx.font='400 44px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(goalsOf(0)+' : '+goalsOf(1),W/2,y+36);
  [0,1].forEach(function(i){var arr=S.kicks[i],n=Math.max(5,arr.length+(S.sd?1:0)),st0=Math.max(0,n-5),cy=y+(i?74:62);
    for(var j=0;j<5;j++){var ix=st0+j,r=arr[ix],cx=(i===0?x+96:x+w-96-4*22)+j*22;
      ctx.fillStyle=r==='g'?'#16d97d':r==='x'?'#ff4d6d':'rgba(255,255,255,.18)';circ(cx,cy-6,7);ctx.fill();
      if(r==='x'){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-3.5,cy-9.5);ctx.lineTo(cx+3.5,cy-2.5);ctx.moveTo(cx+3.5,cy-9.5);ctx.lineTo(cx-3.5,cy-2.5);ctx.stroke()}
      if(!r&&ix===arr.length&&S.turn===i&&S.st!=='over'){ctx.strokeStyle='#ffc93c';ctx.lineWidth=2.5;circ(cx,cy-6,9.5);ctx.stroke()}}});
  ctx.fillStyle='rgba(255,255,255,.75)';ctx.font='700 13px Barlow, Arial, sans-serif';ctx.textAlign='left';ctx.textBaseline='alphabetic';
  ctx.fillText(LEAGUE[S.lv][2].toUpperCase()+' · MECZ '+(S.lv+1)+'/12',16,26);
  ctx.textAlign='right';ctx.fillText(S.sd?'DOGRYWKA KARNYCH':'SERIA '+Math.min(5,Math.max(S.kicks[0].length+(S.turn===0?1:0),S.kicks[1].length+1))+'/5',W-16,26);
  // kto teraz
  var who=S.turn===0?'TY STRZELASZ':'TY BRONISZ';ctx.font='400 18px Anton, Impact, sans-serif';var tw=ctx.measureText(who).width+26;
  ctx.fillStyle=S.turn===0?'#16d97d':'#ffc93c';rr(W/2-tw/2,y+h-4,tw,26,13);ctx.fill();ctx.fillStyle='#06101f';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(who,W/2,y+h+10);
}
function render(){
  ctx.setTransform(scale,0,0,scale,0,0);
  var sx=0,sy=0;if(S.shake>0){sx=rnd(-1,1)*S.shake;sy=rnd(-1,1)*S.shake}
  ctx.save();ctx.translate(sx,sy);
  ctx.drawImage(bg,0,0,W,H);
  drawBoards(S.K?themeOf(S.lv):themeOf(9),292,34);
  drawGoal();
  var b=S.ball,behind=b&&b.mode==='in';
  if(behind)drawBall();
  drawPosts();drawKeeper();
  if(b&&b.mode!=='in'&&b.mode!=='spot')drawBall();
  if(b&&b.mode==='spot')drawBall();
  drawShooter();
  drawAim();drawMark();
  drawWeather(S.K?themeOf(S.lv):themeOf(9),S.t,1/60,GL+200);
  parts.forEach(function(p){ctx.globalAlpha=Math.max(0,1-p.t/p.life);ctx.fillStyle=p.col;if(p.conf)ctx.fillRect(p.x,p.y,p.sz,p.sz*.6);else{circ(p.x,p.y,p.sz);ctx.fill()}});ctx.globalAlpha=1;
  ctx.restore();
  drawMeter();
  floats.forEach(function(f){var k=f.t/f.life;ctx.globalAlpha=k<.7?1:1-(k-.7)/.3;ctx.font='400 30px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=6;ctx.strokeStyle='rgba(6,14,32,.9)';ctx.strokeText(f.txt,f.x,f.y-k*40);ctx.fillStyle=f.col;ctx.fillText(f.txt,f.x,f.y-k*40)});ctx.globalAlpha=1;
  if(S.flash>0){ctx.globalAlpha=S.flash*.7;ctx.fillStyle=S.flashCol;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}
  if(S.st!=='menu'&&S.K&&!window.__noHud)drawHud();
  if(S.hint&&(S.st==='aim'||S.st==='meter'||S.st==='cpuwait'||(S.st==='run'&&S.turn===1)||(S.st==='fly'&&S.turn===1&&!S.dived)))pill(S.hint,H-30,S.turn===1?'#ffc93c':'#fff');
  ctx.textBaseline='alphabetic';
}
var last=0;
function frame(ts){var dt=Math.min(.033,(ts-last)/1000||0);last=ts;var ns=DEBUG?(window.__krTS||1):1;for(var k=0;k<ns;k++){update(dt);if(DEBUG&&window.__krBot&&S.st==='aim')botShoot()}render();requestAnimationFrame(frame)}

/* ---------- nakładki ---------- */
var portraits={};
function portrait(ix){if(portraits[ix])return portraits[ix];return portraits[ix]=portraitCanvas(ix).toDataURL()}
function showOv(h,cls){ov.className='lt-ov on '+(cls||'');ov.innerHTML='<div class="lt-panel">'+h+'</div>'}
function hideOv(){ov.className='lt-ov';ov.innerHTML=''}
function iconRow(items){return '<div class="lt-icons">'+items.map(function(x){return '<button class="lt-ib" data-a="'+x[0]+'"><i>'+x[1]+'</i><span>'+x[2]+'</span>'+(x[3]!=null?'<b>'+x[3]+'</b>':'')+'</button>'}).join('')+'</div>'}
function starsTxt(n){var s='';for(var i=0;i<3;i++)s+='<i class="'+(i<n?'on':'')+'">&#9733;</i>';return s}
function nextLv(){return Math.min(LEAGUE.length-1,SV.next)}
function hasProg(){return !!(SV.next||SV.coins||SV.wins)}
function showMenu(){
  S.st='menu';crowdSet(0);buildBg(9);S.K=null;S.shooter=null;S.ball=null;
  var nx=nextLv(),L=LEAGUE[nx];
  showOv('<p class="lt-kick">Gra Qastrod</p><h2 class="lt-title">Rzuty <em>karne</em></h2>'+
   '<div class="gk-vs"><img alt="" src="'+portrait(0)+'"><b>VS</b><img alt="" src="'+portrait(L[0])+'"></div>'+
   '<p class="lt-chip">'+L[2]+' <b>Mecz '+(nx+1)+'/'+LEAGUE.length+'</b></p>'+
   '<button class="lt-btn go" data-a="play">'+(hasProg()?'&#9654; Kontynuuj: ':'&#9917; Graj: ')+HEADS[L[0]].n+'</button>'+(hasProg()?'<button class="lt-link" data-a="newgame">Nowa gra</button>':'')+
   iconRow([['league','&#127942;','Liga',SV.next+'/'+LEAGUE.length],['upg','&#128295;','Szatnia',num(SV.coins)]]),'menu gk-menu');
}
function showLeague(){
  var h='<h2 class="lt-h">Liga</h2><div class="gk-league">';
  LEAGUE.forEach(function(L,i){var open=i<=SV.next,st=SV.stars[i]||0;
    h+='<button class="gk-opp'+(open?'':' lock')+(i===SV.next?' cur':'')+'" data-a="lv" data-i="'+i+'"'+(open?'':' disabled')+'>'+(open?'<img alt="" src="'+portrait(L[0])+'">':'<i>&#128274;</i>')+
      '<b>'+(open?HEADS[L[0]].n:'???')+'</b><span>'+L[2]+'</span><em>'+starsTxt(st)+'</em></button>'});
  h+='</div><button class="lt-btn" data-a="back">&lsaquo; Wróć</button>';showOv(h,'wide');
}
function showUpg(){
  var h='<h2 class="lt-h">Szatnia</h2><p class="lt-chip">&#129689; <b>'+num(SV.coins)+'</b></p><div class="lt-ugrid">';
  UPG.forEach(function(u){var lv=SV.up[u[0]],max=lv>=u[4],c=upCost(u[0]),pips='',can=!max&&SV.coins>=c;for(var i=0;i<u[4];i++)pips+='<i'+(i<lv?' class="on"':'')+'></i>';
    h+='<button class="lt-ucard'+(can?' can':'')+(max?' max':'')+'" data-a="up" data-k="'+u[0]+'"'+(can?'':' disabled')+'><span class="ic">'+u[5]+'</span><b>'+u[1]+'</b><span class="ds">'+u[2]+'</span><span class="pips">'+pips+'</span><span class="pr">'+(max?'MAX':num(c))+'</span></button>'});
  h+='</div><button class="lt-btn" data-a="back">&lsaquo; Wróć</button>';showOv(h,'wide');
}
function showVs(lv){
  var L=LEAGUE[lv];S.pending=lv;
  showOv('<p class="lt-kick">'+L[2]+' &middot; mecz '+(lv+1)+'</p><div class="gk-vs big"><div><img alt="" src="'+portrait(0)+'"><b>'+HEADS[0].n+'</b></div><strong>VS</strong><div><img alt="" src="'+portrait(L[0])+'"><b>'+HEADS[L[0]].n+'</b></div></div>'+
   '<div class="lt-how"><span><i>&#127919;</i>Strzał: wskaż miejsce</span><span><i>&#128994;</i>Zatrzymaj w zielonym</span><span><i>&#129508;</i>Obrona: kliknij w czerwony kwadrat</span></div>'+
   '<button class="lt-btn go" data-a="kick">&#9917; Start!</button><button class="lt-link" data-a="back">Wróć</button>','menu');
}
function nextHint(){var best=null;UPG.forEach(function(u){if(SV.up[u[0]]>=u[4])return;var c=upCost(u[0]);if(!best||c<best.c)best={n:u[1],c:c}});if(!best)return '';
  return SV.coins>=best.c?'<button class="lt-nudge ok" data-a="upg">&#128295; Kup: <b>'+best.n+'</b> &rsaquo;</button>':'<p class="lt-nudge">Jeszcze <b>'+num(best.c-SV.coins)+'</b> monet do: '+best.n+'</p>'}
function showResult(){
  var r=S.res,win=r.win,last=S.lv>=LEAGUE.length-1;
  showOv('<p class="lt-kick">'+LEAGUE[S.lv][2]+' &middot; mecz '+(S.lv+1)+'</p><h2 class="lt-h big">'+(win?'<em>Wygrana!</em>':'Porażka')+'</h2>'+
   '<div class="gk-vs"><img alt="" src="'+portrait(0)+'"><b>'+r.ga+' : '+r.gb+'</b><img alt="" src="'+portrait(oppHead())+'"></div>'+
   (win?'<div class="lt-stars">'+[0,1,2].map(function(i){return '<i class="'+(i<r.stars?'on a':'')+'" style="animation-delay:'+(.2+i*.25)+'s">&#9733;</i>'}).join('')+'</div>':'<p class="lt-meta">Strzelaj w rogi i broń uważnie. Monety wydaj w Szatni.</p>')+
   '<div class="lt-chips"><span><i>&#129689;</i>+'+r.coins+'</span><span><i>&#9917;</i>'+r.ga+' gol'+(r.ga===1?'':r.ga>=2&&r.ga<=4?'e':'i')+'</span><span><i>&#129508;</i>'+S.saves+' obron'+(S.saves===1?'a':S.saves>=2&&S.saves<=4?'y':'')+'</span></div>'+
   (win&&!last?'<button class="lt-btn go again" data-a="next">Następny mecz &rsaquo;</button>':'<button class="lt-btn go again" data-a="retry">&#8635; '+(win?'Zagraj jeszcze raz':'Rewanż')+'</button>')+nextHint()+
   iconRow([['league','&#127942;','Liga',null],['upg','&#128295;','Szatnia',num(SV.coins)],['menu','&#8962;','Menu',null]]),'over');
}
function showPause(){showOv('<h2 class="lt-h big">Pauza</h2><button class="lt-btn go" data-a="resume">&#9654; Wznów</button>'+iconRow([['mute',SV.muted?'&#128263;':'&#128266;',SV.muted?'Dźwięk wył.':'Dźwięk wł.',null],['quit','&#9209;&#65039;','Poddaj',null]]),'pause')}
var backTo='menu',pausedFrom=null;
function inGame(){return ['aim','meter','run','fly','res','cpuwait','next'].indexOf(S.st)>=0}
function pause(){if(inGame()){pausedFrom=S.st;S.st='pause';crowdSet(0);showPause()}}
function resume(){if(S.st==='pause'){S.st=pausedFrom;hideOv();crowdSet(.06)}}

/* ---------- sterowanie ---------- */
function logical(e){var r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
function clampAim(p){return{x:clamp(p.x,GX-GHW*1.12,GX+GHW*1.12),y:clamp(p.y,GL-GHH*1.12,GL-6)}}
cv.addEventListener('pointermove',function(e){if(S.st==='aim'&&e.pointerType==='mouse')S.aim=clampAim(logical(e))});
cv.addEventListener('pointerdown',function(e){unlockAudio();var p=logical(e);
  if(S.st==='aim'){e.preventDefault();S.aim=clampAim(p);lockAim()}
  else if(S.st==='meter'){e.preventDefault();stopMeter()}
  else if(S.turn===1&&(S.st==='run'||S.st==='fly'||S.st==='cpuwait')){e.preventDefault();if(S.st==='cpuwait')return;var g=toG(p.x,p.y);diveTo(clamp(g.u,-1.1,1.1),clamp(g.v,0,1.1))}});
var KD={a:[-.8,.2],q:[-.8,.8],w:[0,.85],e:[.8,.8],d:[.8,.2],s:[0,.3],ArrowLeft:[-.8,.3],ArrowRight:[.8,.3],ArrowUp:[0,.85],ArrowDown:[0,.3]};
window.addEventListener('keydown',function(e){var inView=root.getBoundingClientRect().top<innerHeight*.6;
  if(inGame()){
    if(e.key==='p'||e.key==='P'||e.key==='Escape'){pause();return}
    if(e.key===' '||e.key==='Enter'){e.preventDefault();if(e.repeat)return;if(S.st==='aim')lockAim();else if(S.st==='meter')stopMeter();return}
    if(S.st==='aim'&&KD[e.key]){e.preventDefault();var t=KD[e.key];S.aim=gp(t[0],t[1]);return}
    var k=KD[e.key]||KD[(e.key||'').toLowerCase()];if(k&&S.turn===1&&(S.st==='run'||S.st==='fly')){e.preventDefault();diveTo(k[0],k[1])}
    return}
  if(S.st==='pause'&&(e.key==='p'||e.key==='P'||e.key==='Escape'))resume();
  if(S.st==='over'&&(e.key===' '||e.key==='Enter')&&inView){e.preventDefault();var n=ov.querySelector('[data-a=next],[data-a=retry]');if(n)n.click()}
  if(e.key==='m'||e.key==='M'){SV.muted=!SV.muted;save();syncBar()}});
root.addEventListener('click',function(e){
  var b=e.target.closest('[data-a]');if(!b||b.disabled)return;unlockAudio();var a=b.getAttribute('data-a');
  switch(a){
    case 'play':showVs(nextLv());break;
    case 'kick':startMatch(S.pending);break;
    case 'lv':showVs(+b.getAttribute('data-i'));break;
    case 'next':showVs(Math.min(LEAGUE.length-1,S.lv+1));break;
    case 'retry':startMatch(S.lv);break;
    case 'league':backTo=S.st==='over'?'over':'menu';showLeague();break;
    case 'upg':if(!ov.querySelector('.lt-ugrid'))backTo=S.st==='over'?'over':'menu';showUpg();break;
    case 'back':if(backTo==='over')showResult();else showMenu();break;
    case 'up':var k=b.getAttribute('data-k'),c=upCost(k);if(SV.coins>=c){SV.coins-=c;SV.up[k]++;save();sfx('buy')}showUpg();break;
    case 'menu':showMenu();break;
    case 'newgame':showOv('<h2 class="lt-h">Nowa gra?</h2><p class="lt-meta">Postęp, monety i ulepszenia zostaną wyczyszczone. Zaczniesz od zera.</p><button class="lt-btn go" data-a="newok">Tak, zacznij od nowa</button><button class="lt-link" data-a="menu">Anuluj</button>','menu');break;
    case 'newok':var mu=SV.muted,d=JSON.parse(SVDEF);Object.keys(SV).forEach(function(k){delete SV[k]});Object.assign(SV,d);SV.muted=mu;save();showMenu();toast('Nowa gra! Powodzenia');break;
    case 'pause':if(S.st==='pause')resume();else pause();break;
    case 'resume':resume();break;
    case 'quit':S.st='x';hideOv();endMatch(1);break;
    case 'mute':SV.muted=!SV.muted;save();syncBar();if(S.st==='pause')showPause();break;
    case 'fs':var d=document;if(d.fullscreenElement||d.webkitFullscreenElement)(d.exitFullscreen||d.webkitExitFullscreen).call(d);else{var f=root.requestFullscreen||root.webkitRequestFullscreen;if(f)f.call(root)}break;
  }});
document.addEventListener('visibilitychange',function(){if(document.hidden)pause()});
function syncBar(){var mb=root.querySelector('[data-a="mute"].lt-tool');if(mb)mb.innerHTML=SV.muted?'&#128263; Dźwięk: wył.':'&#128266; Dźwięk: wł.'}
if(!(document.fullscreenEnabled||document.webkitFullscreenEnabled)){var fb=root.querySelector('[data-a="fs"]');if(fb)fb.style.display='none'}
syncBar();
showMenu();
function boot(){requestAnimationFrame(function(ts){last=ts;requestAnimationFrame(frame)})}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){portraits={};pcv={};if(S.st==='menu')showMenu();boot()},boot);else boot();
if(DEBUG)window.__kr={S:S,SV:SV,startMatch:startMatch,save:save,update:update,diveTo:diveTo,botShoot:botShoot};
})();
