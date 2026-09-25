/* WYKOP NA KSIĘŻYC · gra Qastrod.pl · kop w prawo, odbijaj się, leć jak najdalej */
(function(){
'use strict';
var root=document.getElementById('wk'); if(!root) return;
var stage=root.querySelector('.lt-stage'), cv=stage.querySelector('canvas');
var ctx=cv.getContext('2d');
var W=720,H=960,PI=Math.PI,TAU=PI*2,BR=16,MOONM=15000;
var DEBUG=/[?&]debug=1/.test(location.search);
var TOUCH=!!(window.matchMedia&&matchMedia('(hover:none)').matches);

function el(tag,cls,html){var d=document.createElement(tag);d.className=cls;if(html)d.innerHTML=html;return d}
var ov=el('div','lt-ov'),toastEl=el('div','lt-toast'),popEl=el('div','lt-pop wk-pop'),shoutEl=el('div','lt-shout');
[ov,toastEl,popEl,shoutEl].forEach(function(d){stage.appendChild(d)});

/* ---------- dane ---------- */
var UPG=[
 ['kick','Siła strzału','Mocniejsze kopnięcie',80,8,'&#9917;'],
 ['aero','Opływowa piłka','Mniejszy opór',100,6,'&#127744;'],
 ['bounce','Sprężystość','Lepsze odbicia',110,6,'&#127936;'],
 ['taps','Podbicia','+1 podbicie',150,6,'&#128070;'],
 ['tpow','Mocne podbicie','Wyżej i dalej',120,6,'&#128165;'],
 ['mag','Magnes','Przyciąga monety',90,6,'&#129522;'],
 ['shield','Tarcza','Chroni przed przeszkodą',250,3,'&#128737;&#65039;']];
var ZONES=[
 ['Stadion',0,0,'#58b7ff','#bfe6ff','#1c8a4b','Klasyczna'],
 ['Miasto',300,150,'#4aa6f5','#c9ecff','#4a5568','Biało-czerwona'],
 ['Park',1000,400,'#62b6ff','#d8f1ff','#3f9a3f','Złota'],
 ['Góry',2500,1000,'#6aa8e8','#e8f3ff','#7a6a58','Ognista'],
 ['Plaża',5000,2500,'#ff9a5a','#ffd9a0','#e8c98a','Neonowa'],
 ['Kosmodrom',10000,6000,'#2a2466','#e07a6a','#8b93a7','Planeta'],
 ['Księżyc',15000,15000,'#000000','#0a0c1f','#9a9a92','Księżycowa']];
var COINV=[1,2,3,5,8,12,20];

/* ---------- zapis ---------- */
var KEY='qastrod_wykop_v2';
var UPK={kick:0,aero:0,bounce:0,taps:0,tpow:0,mag:0,shield:0};
var SV={coins:0,up:Object.assign({},UPK),best:0,zone:0,skin:0,runs:0,muted:false,moon:0};
var SVDEF=JSON.stringify(SV);
try{var d0=JSON.parse(localStorage.getItem(KEY)||'null');
  if(d0){SV.coins=+d0.coins||0;SV.best=+d0.best||0;SV.zone=+d0.zone||0;SV.skin=+d0.skin||0;SV.runs=+d0.runs||0;SV.muted=!!d0.muted;SV.moon=+d0.moon||0;
    SV.up=Object.assign({},UPK,d0.up||{})}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(SV))}catch(e){}}

/* ---------- pomocnicze ---------- */
function rnd(a,b){return a+Math.random()*(b-a)}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function clamp(v,a,b){return v<a?a:v>b?b:v}
function lerp(a,b,k){return a+(b-a)*k}
function num(n){return Math.round(n).toLocaleString('pl-PL')}
function m(px){return Math.max(0,Math.round(px/10))}
function upv(k){return SV.up[k]||0}
function upCost(k){var u=UPG.filter(function(x){return x[0]===k})[0];return Math.round(u[3]*Math.pow(1.7,SV.up[k])/10)*10}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function circ(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,TAU)}
function hexToRgb(h){var n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255]}
function mix(a,b,k){var A=hexToRgb(a),B=hexToRgb(b);return 'rgb('+Math.round(lerp(A[0],B[0],k))+','+Math.round(lerp(A[1],B[1],k))+','+Math.round(lerp(A[2],B[2],k))+')'}
function zoneAt(mm){var z=0;for(var i=0;i<ZONES.length;i++)if(mm>=ZONES[i][1])z=i;return z}
function zoneBlend(mm){var a=zoneAt(mm),n=ZONES[a+1];if(!n)return[[a,1]];var k=clamp((mm-ZONES[a][1])/(n[1]-ZONES[a][1]),0,1);k=clamp((k-.75)/.25,0,1);k=k*k*(3-2*k);return k<=0?[[a,1]]:[[a,1-k],[a+1,k]]}
function zoneW(bl,test){var w=0;bl.forEach(function(e){if(test(e[0]))w+=e[1]});return w}
function zoneMix(mm,idx){for(var i=ZONES.length-1;i>=0;i--)if(mm>=ZONES[i][1]){var n=ZONES[i+1];if(!n)return ZONES[i][idx];var k=clamp((mm-ZONES[i][1])/(n[1]-ZONES[i][1]),0,1);k=clamp((k-.75)/.25,0,1);return mix(ZONES[i][idx],n[idx],k)}return ZONES[0][idx]}

/* ---------- dźwięk ---------- */
var AC=null,master=null,musG=null;
function unlockAudio(){
  if(AC){if(AC.state==='suspended')AC.resume();return}
  try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=.5;master.connect(AC.destination);
    musG=AC.createGain();musG.gain.value=.33;musG.connect(master)}catch(e){AC=null}
}
function tone(f,d,type,vol,slide,delay,dest){
  if(!AC||SV.muted)return;var t=AC.currentTime+Math.max(0,delay||0);
  var o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol||.2,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g);g.connect(dest||master);o.start(t);o.stop(t+d+.03);
}
var NB=null;
function noise(d,vol,freq,delay,dest,type){
  if(!AC||SV.muted)return;var t=AC.currentTime+Math.max(0,delay||0);
  if(!NB){NB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);var ch=NB.getChannelData(0);for(var i=0;i<ch.length;i++)ch[i]=Math.random()*2-1}
  var s=AC.createBufferSource();s.buffer=NB;var f=AC.createBiquadFilter();f.type=type||'lowpass';f.frequency.value=freq||1200;
  var g=AC.createGain();g.gain.setValueAtTime(vol||.2,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  s.connect(f);f.connect(g);g.connect(dest||master);s.start(t,Math.random()*.5);s.stop(t+d+.02);
}
var SFX={
 step:function(){tone(170+Math.random()*40,.05,'square',.035);noise(.04,.06,900)},
 kick:function(){tone(90,.25,'sine',.6,40);noise(.15,.35,1800);tone(300,.08,'square',.08,120)},
 lock:function(){tone(880,.06,'square',.07)},
 perfect:function(){[784,988,1319,1568,2093].forEach(function(f,i){tone(f,.16,'square',.07,null,i*.05)})},
 bounce:function(){tone(160,.12,'sine',.25,90);noise(.06,.1,900)},
 tap:function(){tone(400,.1,'triangle',.12,900);noise(.1,.12,2500)},
 ring:function(){var p=1+Math.min(1.2,(S.combo||0)*.12);tone(880*p,.08,'sine',.12);tone(1320*p,.2,'sine',.1,null,.06)},
 coin:function(){tone(1400,.05,'square',.05);tone(1900,.09,'square',.05,null,.04)},
 pop:function(){noise(.12,.3,3000,0,null,'highpass');tone(600,.1,'sine',.1,1400)},
 boing:function(){tone(160,.35,'sine',.28,560)},
 rocket:function(){noise(.8,.3,900);tone(120,.6,'sawtooth',.08,400)},
 pass:function(){tone(90,.2,'sine',.45,40);noise(.1,.25,1600);tone(660,.1,'square',.06,null,.05)},
 hit:function(){tone(140,.25,'square',.12,60);noise(.2,.25,800)},
 splash:function(){noise(.4,.3,1400)},
 shield:function(){tone(600,.25,'triangle',.12,1200)},
 zone:function(){[523,659,784,1047,1319].forEach(function(f,i){tone(f,.22,'triangle',.14,null,i*.09)})},
 end:function(){[523,440,349,262].forEach(function(f,i){tone(f,.22,'triangle',.12,null,i*.12)})},
 rec:function(){[523,659,784,1047,784,1047,1319].forEach(function(f,i){tone(f,.22,'triangle',.15,null,i*.1)})},
 buy:function(){tone(660,.07,'square',.08);tone(990,.15,'square',.08,null,.07)},
 cheer:function(){noise(1.3,.16,900);noise(.9,.1,2600,.1)}
};
function sfx(n){try{SFX[n]&&SFX[n]()}catch(e){}}
var MUS={on:false,step:0,next:0,iv:0},ARP=[0,4,7,12,7,4,0,-5];
function musStart(){if(!AC||MUS.on)return;MUS.on=true;MUS.step=0;MUS.next=AC.currentTime+.05;MUS.iv=setInterval(musTick,25)}
function musStop(){MUS.on=false;clearInterval(MUS.iv)}
function musTick(){if(!AC||!MUS.on)return;var z=S.zone,bpm=118+z*5+Math.min(20,Math.abs(S.ball.vx)/120),spb=60/bpm/4;
  while(MUS.next<AC.currentTime+.12){var s=MUS.step,d=MUS.next-AC.currentTime;
    if(!SV.muted&&S.st==='fly'){var r0=110*Math.pow(2,[0,2,3,5,7,8,10][z]/12);
      if(s%8===0)tone(130,.14,'sine',.45,45,d,musG);if(s%8===4)noise(.1,.18,1800,d,musG,'bandpass');if(s%2===0)noise(.03,.04,8000,d,musG,'highpass');
      tone(r0*Math.pow(2,ARP[s%8]/12)*2,.12,'triangle',.07,null,d,musG);if(s%4===0)tone(r0/2,.2,'triangle',.18,null,d,musG)}
    MUS.next+=spb;MUS.step=(MUS.step+1)%32}}

/* ---------- skala ---------- */
var scale=1,dpr=1;
function resize(){dpr=Math.min(2,window.devicePixelRatio||1);var cw=stage.clientWidth||600;cv.width=Math.round(cw*dpr);cv.height=Math.round(cw*4/3*dpr);scale=cv.width/W}
window.addEventListener('resize',resize);if(window.ResizeObserver)new ResizeObserver(resize).observe(stage);resize();

/* ---------- stan ---------- */
var S={st:'menu',t:0,camX:0,camY:260,z:1.1,ball:{x:0,y:BR,vx:0,vy:0,rot:0},taps:2,tapsMax:2,maxX:0,coins:0,obj:[],genX:900,combo:0,comboT:0,
  shield:0,rocketT:0,zone:0,ang:.7,aPh:0,pPh:0,power:0,kickT:0,kx:-180,slow:0,hs:0,shake:0,endT:0,hint:true,newZones:[],stillT:0,tapCd:0,moonT:0};
var parts=[],floats=[],trail=[];

/* ---------- świat ---------- */
function addObj(o){o.t=0;o.ph=Math.random()*TAU;S.obj.push(o);return o}
function genChunk(x0){
  var a=m(x0),d=clamp(.1+a/15000,.1,.34),i;
  if(Math.random()<.45){var n=Math.floor(rnd(5,9)),cx=x0+rnd(100,600),cy=rnd(160,560);for(i=0;i<n;i++)addObj({k:'coin',x:cx+i*44,y:cy+Math.sin(i/(n-1)*PI)*90,r:14})}
  if(Math.random()<.32)addObj({k:'ring',x:x0+rnd(100,700),y:rnd(200,720),r:46});
  if(Math.random()<.2)addObj({k:'tramp',x:x0+rnd(100,700),y:0,r:40});
  if(Math.random()<.18)addObj({k:'balloon',x:x0+rnd(100,700),y:rnd(140,600),r:26,col:pick(['#e5243b','#2b2bff','#ffc93c','#16d97d','#ff7a1a','#ffffff'])});
  if(Math.random()<.12)addObj({k:'mate',x:x0+rnd(100,700),y:0,r:60,shirt:pick(['#2b2bff','#e5243b','#16d97d','#ffc93c'])});
  if(Math.random()<.09)addObj({k:'charge',x:x0+rnd(100,700),y:rnd(160,560),r:22});
  if(a>800&&Math.random()<(a>2500?.12:.06))addObj({k:'rocket',x:x0+rnd(100,700),y:rnd(200,600),r:24});
  if(a>4500&&Math.random()<.14)addObj({k:'pad',x:x0+rnd(100,700),y:0,r:50});
  if(a>60&&Math.random()<d)addObj({k:'mud',x:x0+rnd(100,700),y:0,r:70});
  if(a>150&&Math.random()<d*.8)addObj({k:'keeper',x:x0+rnd(100,700),y:0,r:50});
  if(a>300&&Math.random()<d)addObj({k:'bird',x:x0+rnd(100,700),y:rnd(180,700),r:22,vx:-rnd(60,140)});
  if(a>300&&a<2500&&Math.random()<d*.6)addObj({k:'bus',x:x0+rnd(100,700),y:0,r:70});
  if(a>2500&&a<5000&&Math.random()<d*.6)addObj({k:'rock',x:x0+rnd(100,700),y:0,r:48});
  if(a>5000&&Math.random()<d*.5)addObj({k:'crab',x:x0+rnd(100,700),y:0,r:30,vx:rnd(-40,40)});
  if(a>4000&&Math.random()<d*.4)addObj({k:'plane',x:x0+rnd(300,900),y:rnd(600,1000),r:34,vx:-rnd(200,300)});
}
function genWorld(){var right=S.camX+W*1.6/S.z;while(S.genX<right){genChunk(S.genX);S.genX+=800}
  var left=S.camX-W/S.z;S.obj=S.obj.filter(function(o){return !o.dead&&o.x>left-200})}

/* ---------- przebieg ---------- */
function newRun(){
  unlockAudio();
  S.st='angle';S.t0=S.t;S.ball={x:0,y:BR,vx:0,vy:0,rot:0};S.camX=-40;S.camY=150;S.z=1.25;S.obj=[];S.genX=900;S.maxX=0;S.coins=0;S.combo=0;
  S.tapsMax=2+upv('taps');S.taps=S.tapsMax;S.shield=upv('shield');S.rocketT=0;S.zone=0;S.aPh=0;S.pPh=0;S.kickT=0;S.kx=-180;S.newZones=[];
  S.slow=0;S.hs=0;S.endT=0;S.bchain=0;S.bestChain=0;S.bTap=null;S.sinceB=null;S.tti=9;S.missRest=.44;S.missVx=.8;S.rush=0;S.kq=0;S.stillT=0;S.bestCombo=0;S.moonWin=false;S.tapCd=0;parts=[];floats=[];trail=[];hideOv();musStop();
}
function angNow(){return .26+(Math.sin(S.aPh)+1)/2*.96}
function powNow(){return (Math.sin(S.pPh)+1)/2}
function tapInput(){
  if(S.st==='angle'){S.ang=angNow();S.st='power';S.pPh=-PI/2;sfx('lock');return}
  if(S.st==='power'){S.power=powNow();S.st='kick';S.kickT=0;S.hint=false;sfx(S.power>=.95?'perfect':'lock');return}
  if(S.st==='fly'){var b=S.ball;
    if(b.vy<-140&&S.tti<.24){S.bTap=S.tti;return}          // odbicie w punkt: tapnij, gdy piłka dotyka ziemi
    if(S.sinceB<.1&&!S.bGraded){gradeBounce(S.sinceB,true);return}
    podbicie()}
}
var RING0=-150,RING1=-24;
function ringK(){return S.kx<RING0?-1:clamp((S.kx-RING0)/(RING1-RING0),0,1.2)}
function strike(k){ // k=1 idealnie w piłkę
  var err=Math.abs(1-k),q=err<.1?1:err<.25?.65:.3;S.kq=q;
  S.power=clamp(.28+.47*S.rush+.25*q,0,1);S.st='kick';S.kickT=.3;S.hint=false;
  if(q===1){sfx('perfect')}else sfx('lock');
}
/* proca: pociągnij od piłki do tyłu, puść = kopnięcie */
var DRAGMAX=230;
function aimFrom(px,py){var bx=sx(S.ball.x),by=sy(S.ball.y),dx=bx-px,dy=py-by,len=Math.hypot(dx,dy);
  if(len<8){S.power=0;return}S.ang=clamp(Math.atan2(dy,dx),.12,1.4);S.power=clamp(len/DRAGMAX,0,1)}
function releaseKick(){if(S.st!=='aim')return;S.drag=null;if(S.power<.08){S.power=0;return}S.st='kick';S.kickT=0;S.hint=false;sfx(S.power>=.95?'perfect':'lock')}
function launch(){
  var p=S.power,a=S.ang,perfectP=p>=.95,perfectA=Math.abs(a-.72)<.06;
  var v0=1300*(.4+.6*p)*(1+.07*upv('kick'))*(perfectP?1.1:1)*(perfectA?1.06:1);
  S.ball.vx=Math.cos(a)*v0;S.ball.vy=Math.sin(a)*v0;
  S.st='fly';S.hs=.08;S.shake=perfectP?14:8;S.slow=perfectP&&perfectA?.6:perfectP?.4:0;sfx('kick');musStart();
  if(perfectP&&perfectA){sfx('perfect');shout('Petarda!','gold');burst(S.ball.x,S.ball.y,50,'#ffc93c')}
  else if(perfectP){sfx('perfect');shout('Idealnie!','gold');burst(S.ball.x,S.ball.y,30,'#ffc93c')}
  else shout(p>=.7?'Dobry strzał':'Słabo...',p>=.7?'blue':'red');
  burst(S.ball.x,S.ball.y,20,'#ffffff');
}
function gradeBounce(err,late){
  var b=S.ball;S.bGraded=true;var win=.075+.007*upv('bounce');
  if(err<=win){ // idealne
    if(late){b.vy=Math.abs(b.vy)/Math.max(.3,S.missRest)*.88}else b.vy=Math.abs(b.vy)*.88;
    b.vx=(late?b.vx/S.missVx:b.vx)*1.045+50;S.bchain=(S.bchain||0)+1;S.bestChain=Math.max(S.bestChain||0,S.bchain);
    S.coins+=COINV[S.zone]*S.bchain;sfx('perfect');S.shake=7;S.hs=.03;burst(b.x,BR,26,'#ffc93c',320);
    addFloat(S.bchain>1?'Odbicie x'+S.bchain+'!':'Idealne odbicie!','#ffc93c',S.bchain>2);if(S.bchain>=3)shout('Seria odbić x'+S.bchain,'gold')}
  else if(err<=win*2.1){
    if(late){b.vy=Math.abs(b.vy)/Math.max(.3,S.missRest)*.72}else b.vy=Math.abs(b.vy)*.72;
    b.vx=(late?b.vx/S.missVx:b.vx)*.93;S.bchain=0;sfx('tap');addFloat('Dobre odbicie','#ffffff')}
  else{if(!late){b.vy=Math.abs(b.vy)*S.missRest;b.vx*=S.missVx}S.bchain=0}
}
function podbicie(){
  if(S.tapCd>0)return;
  if(S.taps<=0){toast('Brak podbić. Łap niebieskie kule');return}
  S.taps--;S.tapCd=.25;var b=S.ball,pw=1+.12*upv('tpow');
  b.vy=Math.max(b.vy,0)+520*pw;b.vx=Math.max(b.vx,0)+220*pw;
  sfx('tap');burst(b.x-10,b.y-10,14,'#ffffff',220);addFloat('Podbicie!','#ffffff');
}
function endRun(){if(S.st!=='fly')return;S.st='end';S.endT=1.1;S.slow=.6;musStop();sfx('end');shout('Koniec!','red')}
function confettiMoon(){for(var i=0;i<60;i++)parts.push({x:S.ball.x+rnd(-200,200),y:S.ball.y+rnd(0,300),vx:rnd(-200,200),vy:rnd(0,300),t:0,life:rnd(1,2),col:pick(['#ffc93c','#fff','#35c8ff','#16d97d']),sz:rnd(3,7)})}
function moonLaunch(){S.st='moon';S.moonT=0;S.moonWin=true;musStop();sfx('rocket');sfx('cheer');shout('Na Księżyc!','gold');S.ball.vx=0;S.ball.vy=0}
function finishRun(){
  S.st='over';var dist=m(S.maxX),z=zoneAt(dist),bonus=0;
  var dc=Math.round(dist*.6),earn=S.coins+dc;
  for(var i=SV.zone+1;i<=z;i++)bonus+=ZONES[i][2];
  S.rec=dist>SV.best;S.prev=SV.best;if(S.rec)SV.best=dist;
  S.unlocked=[];if(z>SV.zone){for(var j=SV.zone+1;j<=z;j++)S.unlocked.push(j);SV.zone=z}
  if(S.moonWin)SV.moon++;
  SV.coins+=earn+bonus;SV.runs++;save();S.earn=earn;S.bonus=bonus;S.dist=dist;
  if(S.rec)sfx('rec');showOver();
}

/* ---------- efekty ---------- */
function burst(x,y,n,col,spd){for(var i=0;i<n;i++){var a=rnd(0,TAU),s=rnd(80,spd||380);parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,t:0,life:rnd(.5,1.1),col:col||'#fff',sz:rnd(2.5,6)})}if(parts.length>500)parts.splice(0,parts.length-500)}
function addFloat(txt,col,big){floats.push({txt:txt,col:col||'#ffc93c',t:0,life:1,big:!!big,x:W*.42+rnd(-40,40),y:H*.42})}
function shout(h,cls){shoutEl.style.fontSize=h.length>12?'8.5cqw':'';shoutEl.textContent=h;shoutEl.className='lt-shout '+(cls||'');void shoutEl.offsetWidth;shoutEl.classList.add('on')}
function toast(h){toastEl.innerHTML=h;toastEl.classList.remove('on');void toastEl.offsetWidth;toastEl.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(function(){toastEl.classList.remove('on')},1700)}
var popT=0;function pop(html){popEl.innerHTML=html;popEl.classList.add('on');clearTimeout(popT);popT=setTimeout(function(){popEl.classList.remove('on')},2400)}

/* ---------- zderzenia ---------- */
function obstacle(o,fn){
  if(o.used)return;o.used=1;
  if(S.shield>0){S.shield--;sfx('shield');burst(S.ball.x,S.ball.y,20,'#35c8ff',260);addFloat('Tarcza!','#35c8ff',true);return}
  S.combo=0;sfx('hit');S.shake=12;S.hs=.06;fn();burst(S.ball.x,S.ball.y,14,'#ff4d6d',240);
}
function hit(o){
  var b=S.ball;
  switch(o.k){
    case 'coin':o.dead=1;S.coins+=COINV[S.zone];sfx('coin');burst(o.x,o.y,5,'#ffc93c',160);break;
    case 'ring':if(o.used)return;o.used=1;S.combo++;S.comboT=3;b.vx+=420+60*S.zone+S.combo*40;b.vy=Math.max(b.vy,250)+220;sfx('ring');S.hs=.04;
      burst(o.x,o.y,18,'#ffe27a',260);if(S.combo>=2)shout(S.combo===3?'Hat-trick!':'x'+S.combo,'gold');S.coins+=COINV[S.zone]*2;break;
    case 'balloon':o.dead=1;b.vy=Math.max(b.vy+200,760);b.vx+=80;sfx('pop');burst(o.x,o.y,26,o.col,300);break;
    case 'tramp':if(b.y>o.r+BR+10||o.used)return;o.used=1;b.vy=Math.max(Math.abs(b.vy),950);b.vx+=200;b.y=o.r+BR;sfx('boing');o.squash=1;addFloat('Trampolina!','#16d97d');break;
    case 'mate':if(b.y>150||o.used)return;o.used=1;o.kickT=.4;b.vx=Math.max(b.vx,700)+300;b.vy=Math.max(b.vy,650);sfx('pass');S.hs=.05;shout('Podanie!','blue');burst(b.x,b.y,20,'#ffffff');break;
    case 'charge':o.dead=1;S.taps=Math.min(S.tapsMax+3,S.taps+1);sfx('buy');addFloat('+1 podbicie','#35c8ff');break;
    case 'pad':if(b.y>90||o.used)return;o.used=1;b.vx+=1300;b.vy=Math.max(b.vy,1100);sfx('rocket');shout('Wyrzutnia!','gold');S.shake=12;S.rocketT=.5;break;
    case 'rocket':o.dead=1;S.rocketT=1.2;b.vy=Math.max(b.vy,300);sfx('rocket');shout('Rakieta!','gold');S.shake=10;break;
    case 'mud':if(b.y>BR+14||o.used)return;obstacle(o,function(){b.vx*=.45;b.vy*=.3;sfx('splash');addFloat('Błoto!','#c9a86a')});break;
    case 'keeper':if(b.y>150)return;obstacle(o,function(){o.catchT=1;b.vx*=.25;b.vy=Math.min(b.vy,120);addFloat('Bramkarz łapie!','#ff4d6d',true)});break;
    case 'bus':if(b.y>150)return;obstacle(o,function(){b.vx=-Math.abs(b.vx)*.3;b.vy=Math.abs(b.vy)*.4+120;addFloat('Autobus!','#ff4d6d',true)});break;
    case 'rock':if(b.y>110)return;obstacle(o,function(){b.vx*=.35;b.vy=Math.abs(b.vy)*.5+200;addFloat('Skała!','#ff4d6d')});break;
    case 'crab':if(b.y>70)return;obstacle(o,function(){b.vx*=.5;addFloat('Krab!','#ff4d6d')});break;
    case 'bird':obstacle(o,function(){b.vx*=.55;b.vy=b.vy*.4-100;addFloat('Au! Ptak','#ff4d6d')});break;
    case 'plane':obstacle(o,function(){b.vx*=.45;b.vy=-200;addFloat('Samolot!','#ff4d6d',true)});break;
  }
  S.bestCombo=Math.max(S.bestCombo||0,S.combo);
}

/* ---------- pętla ---------- */
function update(rdt){
  S.t+=rdt;if(S.hs>0){S.hs-=rdt;return}
  var dt=rdt;if(S.slow>0){S.slow-=rdt;dt*=.35}
  if(S.shake>0)S.shake=Math.max(0,S.shake-rdt*40);
  if(S.tapCd>0)S.tapCd-=rdt;
  var b=S.ball;

  if(S.st==='angle')S.aPh+=dt*(3.3+Math.min(1.2,SV.runs*.05));
  if(S.st==='power')S.pPh+=dt*(4.6+Math.min(2,SV.runs*.06));
  if(S.st==='kick'){S.kickT+=dt;S.kx=lerp(-180,-44,clamp(S.kickT/.4,0,1));if(S.kickT>=.4)launch()}
  if(S.st==='fly'||S.st==='end'){
    var sp=Math.hypot(b.vx,b.vy),cd=.00006*(1-.09*upv('aero'));
    var onMoon=m(b.x)>=MOONM;if(onMoon)cd*=.5;
    var ax=-cd*b.vx*sp,ay=-1100*(onMoon?.45:1)-cd*b.vy*sp;
    if(S.rocketT>0){S.rocketT-=dt;ax+=2600;ay+=900;parts.push({x:b.x-BR,y:b.y+rnd(-5,5),vx:-rnd(200,400),vy:rnd(-60,60),t:0,life:.4,col:pick(['#ffc93c','#ff7a1a','#fff']),sz:rnd(3,7)})}
    b.vx+=ax*dt;b.vy+=ay*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.rot+=b.vx*dt/(BR*1.4);
    if(b.y<BR){b.y=BR;
      if(b.vy<-140){S.missRest=.42+.03*upv('bounce');S.missVx=.74+.015*upv('bounce');sfx('bounce');S.shake=Math.max(S.shake,3);burst(b.x,0,8,zoneMix(m(b.x),5),160);
        if(S.bTap!=null){var e2=S.bTap;S.bTap=null;S.bGraded=false;gradeBounce(e2,false)}
        else{b.vy=-b.vy*S.missRest;b.vx*=S.missVx;S.bGraded=false;S.sinceB=0;S.bchain=0}}
      else{b.vy=0;b.vx-=Math.sign(b.vx)*Math.min(Math.abs(b.vx),(520-45*upv('bounce'))*dt)}}
    if(b.x>S.maxX)S.maxX=b.x;
    var gg=1100*(m(b.x)>=MOONM?.45:1);S.tti=b.vy<0?(b.vy+Math.sqrt(b.vy*b.vy+2*gg*Math.max(0,b.y-BR)))/gg:9;
    if(S.sinceB!=null)S.sinceB+=dt;if(S.bTap!=null&&b.vy>0)S.bTap=null;
    var dm=m(b.x),z=zoneAt(dm);
    if(z>S.zone){S.zone=z;if(z>SV.zone&&S.newZones.indexOf(z)<0){S.newZones.push(z);sfx('zone');sfx('cheer');shout(ZONES[z][0]+'!','gold');
      pop('<p>Nowa strefa!</p><div class="wk-card"><b>'+ZONES[z][0]+'</b><span>'+num(ZONES[z][1])+' m</span><i>+'+num(ZONES[z][2])+' &#129689;</i></div>');burst(b.x,b.y,50,'#ffc93c')}
      else shout(ZONES[z][0],'blue')}
    if(S.st==='fly'&&dm>=MOONM&&!S.moonWin){S.moonWin=true;sfx('rocket');sfx('cheer');shout('Księżyc! Leć dalej!','gold');burst(b.x,b.y,70,'#ffc93c');confettiMoon();S.coins+=500}
    if(S.st==='fly'){if(b.y<=BR+1&&Math.abs(b.vx)<30){S.stillT+=dt;if(S.stillT>.35)endRun()}else S.stillT=0}
    if(S.comboT>0){S.comboT-=dt;if(S.comboT<=0)S.combo=0}
    var tz=clamp(1.08-b.y/2600-Math.max(0,sp-1400)/9000,.5,1.08);S.z=lerp(S.z,tz,Math.min(1,rdt*2));
    S.camX=lerp(S.camX,b.x+b.vx*.12,Math.min(1,rdt*7));
    S.camY=lerp(S.camY,Math.max(260/S.z*.8,b.y*.55+120),Math.min(1,rdt*4));
    genWorld();
    var mr=upv('mag')*55;
    S.obj.forEach(function(o){o.t+=dt;if(o.vx)o.x+=o.vx*dt;if(o.squash)o.squash=Math.max(0,o.squash-dt*3);if(o.kickT)o.kickT=Math.max(0,o.kickT-dt);if(o.catchT)o.catchT=Math.max(0,o.catchT-dt);
      if(o.dead)return;var dx=o.x-b.x,dy=o.y-b.y,dd=Math.hypot(dx,dy);
      if(o.k==='coin'&&mr>0&&dd<mr+40){o.x-=dx*Math.min(1,dt*8);o.y-=dy*Math.min(1,dt*8)}
      var ground=o.y===0;
      if(S.st==='fly'&&(ground?Math.abs(dx)<o.r*.6+BR:dd<o.r+BR))hit(o)});
    trail.push({x:b.x,y:b.y});if(trail.length>22)trail.shift();
  }
  if(S.st==='moon'){S.moonT+=rdt;b.y+=1600*rdt*(1+S.moonT);S.camY=lerp(S.camY,b.y,Math.min(1,rdt*3));S.camX=lerp(S.camX,b.x,rdt*3);
    parts.push({x:b.x+rnd(-6,6),y:b.y-BR,vx:rnd(-40,40),vy:-rnd(300,500),t:0,life:.5,col:pick(['#ffc93c','#ff7a1a','#fff']),sz:rnd(4,8)});
    if(S.moonT>3){finishRun()}}
  if(S.st==='end'){S.endT-=rdt;if(S.endT<=0)finishRun()}
  parts.forEach(function(p){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy-=300*dt});parts=parts.filter(function(p){return p.t<p.life});
  floats.forEach(function(f){f.t+=rdt});floats=floats.filter(function(f){return f.t<f.life});
  if(DEBUG&&window.__wkBot)bot(dt);
}
function bot(dt){
  var sk=window.__wkBot;
  if(S.st==='angle'&&Math.abs(angNow()-.72)<(sk>=5?.03:.2))tapInput();
  if(S.st==='power'&&powNow()>(sk>=5?.95:.6))tapInput();
  if(S.st==='fly'&&S.ball.vy<-140&&S.tti<.05+rnd(0,sk>=5?.04:.14)&&S.bTap==null&&Math.random()<(sk>=5?.9:.6))tapInput();
  if(S.st==='fly'){var b=S.ball;if(S.taps>0&&S.tapCd<=0){
    var want=S.obj.some(function(o){return !o.dead&&!o.used&&(o.k==='ring'||o.k==='balloon'||o.k==='charge')&&o.x>b.x&&o.x-b.x<260&&o.y>b.y+40&&o.y-b.y<320});
    var danger=b.y<160&&S.obj.some(function(o){return !o.used&&(o.k==='keeper'||o.k==='bus'||o.k==='mud'||o.k==='rock')&&o.x>b.x&&o.x-b.x<(Math.abs(b.vx)*.5+60)});
    var slow=b.y<40&&Math.abs(b.vx)<300;
    if((want&&Math.random()<dt*(sk>=5?8:2))||(danger&&sk>=5)||(slow&&Math.random()<dt*3))podbicie()}}
}

/* ---------- rysowanie ---------- */
function sx(wx){return W*.36+(wx-S.camX)*S.z}
function sy(wy){return H*.58-(wy-S.camY)*S.z}
function drawSky(){
  var mm=m(S.camX);var top=zoneMix(mm,3),bot=zoneMix(mm,4);
  if(S.st==='moon'){var k=clamp(S.moonT/2.5,0,1);top=mix('#2a2466','#000000',k);bot=mix('#e07a6a','#0a0c1f',k)}
  var g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,top);g.addColorStop(1,bot);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  var bl=S.st==='moon'?[[6,1]]:zoneBlend(mm),day=zoneW(bl,function(z){return z<5}),beach=zoneW(bl,function(z){return z===4}),night=1-day;
  if(day>0){ctx.globalAlpha=day;ctx.fillStyle=beach>.5?'rgba(255,220,150,.9)':'rgba(255,248,210,.85)';circ(W*.8,120+120*beach,36+24*beach);ctx.fill();ctx.globalAlpha=1}
  if(night>0){ctx.globalAlpha=night;ctx.fillStyle='rgba(255,255,255,.8)';for(var i=0;i<60;i++){circ((i*137+S.camX*.01)%W,(i*71)%(H*.6),(i%3)*.6+.6);ctx.fill()}
    var mw=zoneW(bl,function(z){return z===6});
    if(mw<1){ctx.globalAlpha=night*(1-mw);var mr=60,gm=ctx.createRadialGradient(W*.72-mr*.3,150-mr*.3,4,W*.72,150,mr);gm.addColorStop(0,'#f4f4ee');gm.addColorStop(1,'#9a9a92');ctx.fillStyle=gm;circ(W*.72,150,mr);ctx.fill()}
    if(mw>0){ctx.globalAlpha=mw;var er=70,ex=W*.7,ey=170,eg=ctx.createRadialGradient(ex-er*.3,ey-er*.3,6,ex,ey,er);eg.addColorStop(0,'#8fd0ff');eg.addColorStop(1,'#1d4fa8');ctx.fillStyle=eg;circ(ex,ey,er);ctx.fill();
      ctx.fillStyle='#2e9e4f';ctx.beginPath();ctx.ellipse(ex-18,ey-10,24,14,.5,0,TAU);ctx.fill();ctx.beginPath();ctx.ellipse(ex+22,ey+18,18,10,-.4,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.ellipse(ex,ey-er*.6,er*.5,8,0,0,TAU);ctx.fill();
      var at=ctx.createRadialGradient(ex,ey,er*.9,ex,ey,er*1.3);at.addColorStop(0,'rgba(120,190,255,.35)');at.addColorStop(1,'rgba(120,190,255,0)');ctx.fillStyle=at;circ(ex,ey,er*1.3);ctx.fill()}
    ctx.globalAlpha=1}
  if(day>0){ctx.globalAlpha=day;ctx.fillStyle='rgba(255,255,255,.7)';for(var c=0;c<6;c++){var cx=((c*260-S.camX*.12)%(W+300)+W+300)%(W+300)-150;cloud(cx,90+(c*47)%220,30+(c%3)*12)}ctx.globalAlpha=1}
}
function cloud(x,y,s){ctx.beginPath();ctx.ellipse(x,y,s*1.6,s*.6,0,0,TAU);ctx.fill();ctx.beginPath();ctx.arc(x-s*.5,y-s*.35,s*.55,0,TAU);ctx.fill();ctx.beginPath();ctx.arc(x+s*.35,y-s*.45,s*.7,0,TAU);ctx.fill()}
/* dalekie tło: ciągłe sylwetki z paralaksą (bez przeskoków) */
function ridge(xw,a,b,c){var p1=1-Math.abs(Math.sin(xw*a)),p2=1-Math.abs(Math.sin(xw*b+1.7)),p3=1-Math.abs(Math.sin(xw*c+4.1));return Math.pow(p1,1.6)*.6+Math.pow(p2,1.4)*.28+p3*.12}
function layerX(px,par){return (px-W*.36)/S.z+S.camX*par}
function farZone(z,gy){
  var st=6;
  if(z<=1){ // miasto: dwa rzędy bloków z oknami
    [[.12,'#8fb3d9',.55],[.22,'#6f8fb8',.8]].forEach(function(L,li){var par=L[0],w=70,base=layerX(0,par),x0=Math.floor(base/w)*w;
      for(var x=x0;x<base+W/S.z+w;x+=w){var id=Math.floor(x/w),hh=(80+((id*37+li*11)%7)*26)*L[2]*S.z,px=W*.36+(x-S.camX*par)*S.z,bw=(w-8)*S.z;
        ctx.fillStyle=L[1];ctx.fillRect(px,gy-hh,bw,hh);ctx.fillStyle=li?'rgba(255,240,180,.55)':'rgba(255,255,255,.35)';
        for(var wy=gy-hh+10*S.z;wy<gy-12*S.z;wy+=16*S.z)for(var wx=px+6*S.z;wx<px+bw-10*S.z;wx+=14*S.z)if(((id*7+Math.round(wy)+Math.round(wx))%5)<2)ctx.fillRect(wx,wy,6*S.z,7*S.z)}})}
  else if(z===2){ // park: linia drzew
    [[.14,'#5aa663',.7],[.26,'#3f8a47',1]].forEach(function(L,li){var par=L[0],w=56,base=layerX(0,par),x0=Math.floor(base/w)*w;
      for(var x=x0;x<base+W/S.z+w;x+=w){var id=Math.floor(x/w),px=W*.36+(x-S.camX*par)*S.z,rr2=(30+(id*13%5)*6)*L[2]*S.z,hy=gy-(40+(id*7%4)*14)*L[2]*S.z;
        ctx.fillStyle='#5a3a22';ctx.fillRect(px-3*S.z,hy,6*S.z,gy-hy);ctx.fillStyle=L[1];ctx.beginPath();ctx.arc(px,hy,rr2,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,.1)';ctx.beginPath();ctx.arc(px-rr2*.3,hy-rr2*.3,rr2*.45,0,TAU);ctx.fill()}})}
  else if(z===3){ // góry: dwa pasma, ośnieżone szczyty
    [[.08,520,'#8e9cc0','#c3cde6'],[.18,340,'#5b6887','#7d8aab']].forEach(function(L,li){var par=L[0],amp=L[1]*S.z,pts=[];
      for(var px=-10;px<=W+10;px+=st){var xw=layerX(px,par),h=(ridge(xw,.0019+li*.0009,.0047,.0113)*.85+.12)*amp;pts.push([px,gy-h])}
      var g=ctx.createLinearGradient(0,gy-amp,0,gy);g.addColorStop(0,L[3]);g.addColorStop(1,L[2]);ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-10,gy);pts.forEach(function(p){ctx.lineTo(p[0],p[1])});ctx.lineTo(W+10,gy);ctx.closePath();ctx.fill();
      // śnieg: tylko powyżej linii
      var sl=gy-amp*.62;ctx.save();ctx.beginPath();ctx.moveTo(-10,gy);pts.forEach(function(p){ctx.lineTo(p[0],p[1])});ctx.lineTo(W+10,gy);ctx.closePath();ctx.clip();
      ctx.fillStyle='rgba(255,255,255,.92)';ctx.beginPath();ctx.moveTo(-10,sl);for(var qx=-10;qx<=W+10;qx+=st){ctx.lineTo(qx,sl+Math.sin(layerX(qx,par)*.03)*6*S.z+8*S.z)}ctx.lineTo(W+10,0);ctx.lineTo(-10,0);ctx.closePath();ctx.fill();ctx.restore()})}
  else if(z===4){ // plaża: morze z falami i palmy
    var sh=70*S.z,sg=ctx.createLinearGradient(0,gy-sh,0,gy);sg.addColorStop(0,'#3aa0d8');sg.addColorStop(1,'#7fd3f0');ctx.fillStyle=sg;ctx.fillRect(0,gy-sh,W,sh);
    ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;for(var wv=0;wv<3;wv++){ctx.beginPath();for(var qx2=0;qx2<=W;qx2+=8){var yy=gy-sh*.25-wv*sh*.25+Math.sin(qx2*.05+S.t*2+wv)*3;qx2?ctx.lineTo(qx2,yy):ctx.moveTo(qx2,yy)}ctx.stroke()}
    var par=.3,w=260,base=layerX(0,par),x0=Math.floor(base/w)*w;
    for(var x=x0;x<base+W/S.z+w;x+=w){var px=W*.36+(x-S.camX*par)*S.z,ph=150*S.z;ctx.strokeStyle='#7a5431';ctx.lineWidth=8*S.z;ctx.beginPath();ctx.moveTo(px,gy);ctx.quadraticCurveTo(px+20*S.z,gy-ph*.5,px+10*S.z,gy-ph);ctx.stroke();
      ctx.fillStyle='#2e9e4f';for(var lf=0;lf<5;lf++){var la=-PI/2+(lf-2)*.55;ctx.beginPath();ctx.ellipse(px+10*S.z+Math.cos(la)*34*S.z,gy-ph+Math.sin(la)*18*S.z+14*S.z,36*S.z,9*S.z,la,0,TAU);ctx.fill()}}}
  else if(z===6){ // Księżyc: szare wzgórza i kratery
    [[.1,160,'#5d5d58'],[.2,90,'#7a7a72']].forEach(function(L,li){var par=L[0],amp=L[1]*S.z;ctx.fillStyle=L[2];ctx.beginPath();ctx.moveTo(-10,gy);for(var px=-10;px<=W+10;px+=8){var xw=layerX(px,par);ctx.lineTo(px,gy-(Math.sin(xw*.004+li)*.5+.6+Math.sin(xw*.011)*.2)*amp)}ctx.lineTo(W+10,gy);ctx.closePath();ctx.fill();
      var base=layerX(0,par),w=180,x0=Math.floor(base/w)*w;ctx.fillStyle='rgba(0,0,0,.18)';for(var x=x0;x<base+W/S.z+w;x+=w){var px2=W*.36+(x-S.camX*par)*S.z;ctx.beginPath();ctx.ellipse(px2,gy-amp*.35,26*S.z,7*S.z,0,0,TAU);ctx.fill()}})}
  else{ // kosmodrom: wieże i rakiety
    var par2=.2,w2=220,base2=layerX(0,par2),xs=Math.floor(base2/w2)*w2;
    for(var x3=xs;x3<base2+W/S.z+w2;x3+=w2){var id2=Math.floor(x3/w2),px3=W*.36+(x3-S.camX*par2)*S.z,th=(240+(id2*29%4)*40)*S.z;
      ctx.fillStyle='#3a3f5c';ctx.fillRect(px3,gy-th,24*S.z,th);ctx.strokeStyle='rgba(160,170,200,.6)';ctx.lineWidth=2;for(var ly=gy-th;ly<gy;ly+=18*S.z){ctx.beginPath();ctx.moveTo(px3,ly);ctx.lineTo(px3+24*S.z,ly+18*S.z);ctx.stroke()}
      ctx.fillStyle='#e8ecf6';rr(px3+34*S.z,gy-th*.85,22*S.z,th*.85,10*S.z);ctx.fill();ctx.fillStyle='#e5243b';ctx.beginPath();ctx.moveTo(px3+34*S.z,gy-th*.85+2);ctx.lineTo(px3+45*S.z,gy-th*.85-24*S.z);ctx.lineTo(px3+56*S.z,gy-th*.85+2);ctx.fill();
      ctx.fillStyle=Math.sin(S.t*4+id2)>0?'#ff5a4a':'#7a2a2a';circ(px3+12*S.z,gy-th-6,5);ctx.fill()}}
}
function drawFar(){
  var gy=sy(0),mm=m(S.camX),bl=zoneBlend(mm);
  bl.forEach(function(e){if(e[1]<=0)return;ctx.save();ctx.globalAlpha=e[1];farZone(e[0],gy);ctx.restore()});
  var st0=sx(-420),st1=sx(600);if(st1>0){ctx.fillStyle='#0d1c38';ctx.fillRect(st0,gy-200*S.z,st1-st0,200*S.z);
    for(var r=0;r<10;r++)for(var c=0;c<120;c++){var px=st0+c*9+(r%2)*4;if(px>st1)break;ctx.fillStyle=['#2b2bff','#ffffff','#16d97d','#ffc93c','#e5243b','#9fb2d9'][(c*7+r*3)%6];ctx.globalAlpha=.85;circ(px,gy-190*S.z+r*16*S.z,3.2*S.z);ctx.fill()}
    ctx.globalAlpha=1;ctx.fillStyle='#02050c';ctx.fillRect(st0,gy-36*S.z,st1-st0,30*S.z);ctx.fillStyle='#ffc93c';ctx.font='400 '+Math.round(19*S.z)+'px Anton, Impact, sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';
    var bt='QASTROD.PL  •  WYKOP NA KSIĘŻYC  •  ',bw2=ctx.measureText(bt).width;ctx.save();ctx.beginPath();ctx.rect(st0,gy-36*S.z,st1-st0,30*S.z);ctx.clip();for(var q=st0-(S.t*60)%bw2;q<st1;q+=bw2)ctx.fillText(bt,q,gy-21*S.z);ctx.restore()}
}
function drawGround(){
  var gy=sy(0),mm=m(S.camX),z=zoneAt(mm);
  ctx.fillStyle=zoneMix(mm,5);ctx.fillRect(0,gy,W,H-gy+10);
  var step=90*S.z,o=((S.camX*S.z)%(step*2)+step*2)%(step*2);
  ctx.fillStyle='rgba(0,0,0,.07)';for(var x=-o;x<W;x+=step*2)ctx.fillRect(x,gy,step,H-gy);
  ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(0,gy,W,3);
  var lw=zoneW(zoneBlend(mm),function(q){return q===1});if(lw>0){ctx.fillStyle='rgba(255,255,255,'+(.6*lw)+')';for(var x2=-o;x2<W;x2+=step)ctx.fillRect(x2,gy+30*S.z,step*.5,6*S.z)}
  ctx.fillStyle='rgba(255,255,255,.75)';ctx.font='700 '+Math.round(14*S.z)+'px Barlow, Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='top';
  var mStep=S.z>.8?50:100,first=Math.floor(m(S.camX-W/S.z)/mStep)*mStep;
  for(var mk=first;mk<first+mStep*24;mk+=mStep){var px=sx(mk*10);if(px<-40||px>W+40||mk<=0)continue;ctx.fillRect(px-1,gy,2,12*S.z);ctx.fillText(mk+' m',px,gy+16*S.z)}
  for(var i=1;i<ZONES.length;i++){var zx=sx(ZONES[i][1]*10);if(zx<-120||zx>W+120)continue;ctx.fillStyle='#3a2410';ctx.fillRect(zx-3,gy-110*S.z,6,110*S.z);
    ctx.fillStyle='#ffc93c';rr(zx-80*S.z,gy-150*S.z,160*S.z,46*S.z,8);ctx.fill();ctx.fillStyle='#2a1200';ctx.font='400 '+Math.round(20*S.z)+'px Anton, Impact, sans-serif';ctx.textBaseline='middle';ctx.fillText(ZONES[i][0].toUpperCase(),zx,gy-133*S.z);
    ctx.font='700 '+Math.round(12*S.z)+'px Barlow, Arial, sans-serif';ctx.fillText(num(ZONES[i][1])+' m',zx,gy-114*S.z)}
  if(SV.best>0){var fx=sx(SV.best*10);if(fx>-60&&fx<W+60){ctx.fillStyle='#ffffff';ctx.fillRect(fx-2,gy-120*S.z,4,120*S.z);ctx.fillStyle='#ffc93c';ctx.beginPath();ctx.moveTo(fx+2,gy-120*S.z);ctx.lineTo(fx+80*S.z,gy-100*S.z);ctx.lineTo(fx+2,gy-80*S.z);ctx.fill();
    ctx.fillStyle='#2a1200';ctx.font='400 '+Math.round(13*S.z)+'px Anton, Impact, sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText('REKORD',fx+8,gy-100*S.z)}}
  ctx.textBaseline='alphabetic';
}
function person(x,y,s,shirt,pose,t){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.lineCap='round';
  var la,lb,aa;
  if(pose==='kick'){la=-1.2;lb=.25;aa=.9}else if(pose==='run'){la=Math.sin(t)*.8;lb=-la;aa=.5+Math.sin(t)*.3}
  else if(pose==='jump'){la=.5;lb=-.5;aa=2.6}else if(pose==='catch'){la=.3;lb=-.3;aa=2.8}else{la=.12;lb=-.12;aa=.35+Math.sin(t*3)*.05}
  ctx.strokeStyle='#f0c49c';ctx.lineWidth=7;
  [lb,la].forEach(function(a){var fx=-Math.sin(a)*26,fy=-28+Math.cos(a)*26;ctx.beginPath();ctx.moveTo(0,-28);ctx.lineTo(fx,fy);ctx.stroke();ctx.fillStyle='#10131a';rr(fx-3,fy-3,12,6,3);ctx.fill()});
  ctx.fillStyle='#fff';rr(-9,-36,18,11,4);ctx.fill();ctx.fillStyle=shirt;rr(-10,-60,20,26,7);ctx.fill();
  ctx.strokeStyle=shirt;ctx.lineWidth=6;[-aa,aa].forEach(function(a){ctx.beginPath();ctx.moveTo(0,-54);ctx.lineTo(Math.sin(a)*18,-54+Math.cos(a)*18);ctx.stroke()});
  ctx.fillStyle='#f0c49c';circ(3,-72,11);ctx.fill();ctx.fillStyle='#4a2c17';ctx.beginPath();ctx.arc(3,-74,11.5,PI*.95,PI*2.02);ctx.fill();
  ctx.fillStyle='#fff';circ(9,-72,2.6);ctx.fill();ctx.fillStyle='#3b2412';circ(9.8,-72,1.5);ctx.fill();
  ctx.strokeStyle='#7a1f24';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(8,-66,2.6,.3,PI*.8);ctx.stroke();
  ctx.restore();ctx.lineCap='butt';
}
function drawKicker(){
  var gy=sy(0),x=sx(S.kx),s=S.z*1.7,st=S.st;if(x<-120)return;
  if(st==='kick')person(x,gy,s,'#2b2bff',S.kickT>.3?'kick':'run',S.kickT*22);
  else person(x,gy,s,'#2b2bff',(st==='fly'||st==='end'||st==='over')?'jump':'stand',S.t);
  if(st==='angle'||st==='power'){var a=st==='angle'?angNow():S.ang,bx=sx(S.ball.x),by=sy(S.ball.y),L=180;
    ctx.fillStyle='rgba(22,217,125,.45)';ctx.beginPath();ctx.moveTo(bx,by);ctx.arc(bx,by,L*1.05,-.78,-.66);ctx.closePath();ctx.fill();ctx.strokeStyle='#16d97d';ctx.lineWidth=3;ctx.stroke();
    ctx.strokeStyle='#fff';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+Math.cos(a)*L,by-Math.sin(a)*L);ctx.stroke();
    var tx=bx+Math.cos(a)*L,ty=by-Math.sin(a)*L;ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(tx+Math.cos(a)*18,ty-Math.sin(a)*18);ctx.lineTo(tx+Math.cos(a+2.4)*16,ty-Math.sin(a+2.4)*16);ctx.lineTo(tx+Math.cos(a-2.4)*16,ty-Math.sin(a-2.4)*16);ctx.fill();ctx.lineCap='butt';
    ctx.font='700 16px Barlow, Arial, sans-serif';ctx.textAlign='left';ctx.lineWidth=5;ctx.strokeStyle='rgba(6,14,32,.9)';var lx=bx+Math.cos(.72)*L*.72+26,ly=by-Math.sin(.72)*L*.72;ctx.strokeText('IDEALNY KĄT',lx,ly);ctx.fillStyle='#16d97d';ctx.fillText('IDEALNY KĄT',lx,ly)}
}
var SKINS=[
 function(r){ctx.fillStyle='#ffffff';circ(0,0,r);ctx.fill();ctx.fillStyle='#1b2233';pent(0,0,r*.36);for(var i=0;i<5;i++){var a=-PI/2+i*TAU/5+PI/5;pent(Math.cos(a)*r*.98,Math.sin(a)*r*.98,r*.36)}},
 function(r){ctx.fillStyle='#ffffff';circ(0,0,r);ctx.fill();ctx.fillStyle='#e5243b';ctx.beginPath();ctx.arc(0,0,r,0,PI);ctx.fill();ctx.fillStyle='rgba(0,0,0,.2)';pent(0,0,r*.3)},
 function(r){var g=ctx.createRadialGradient(-r*.3,-r*.3,1,0,0,r);g.addColorStop(0,'#fff6c4');g.addColorStop(.5,'#ffc93c');g.addColorStop(1,'#9b6200');ctx.fillStyle=g;circ(0,0,r);ctx.fill();ctx.fillStyle='rgba(125,72,0,.7)';pent(0,0,r*.34)},
 function(r){var g=ctx.createRadialGradient(0,0,1,0,0,r);g.addColorStop(0,'#fff3b0');g.addColorStop(.45,'#ff9a1a');g.addColorStop(1,'#c21e1e');ctx.fillStyle=g;circ(0,0,r);ctx.fill();ctx.fillStyle='rgba(120,20,0,.5)';pent(0,0,r*.34)},
 function(r){ctx.fillStyle='#0d1030';circ(0,0,r);ctx.fill();ctx.strokeStyle='#35c8ff';ctx.lineWidth=3;circ(0,0,r-1.5);ctx.stroke();ctx.strokeStyle='#ff3df0';ctx.lineWidth=2;pentS(0,0,r*.4)},
 function(r){var g=ctx.createRadialGradient(-r*.3,-r*.3,1,0,0,r);g.addColorStop(0,'#8fd0ff');g.addColorStop(1,'#1d4fa8');ctx.fillStyle=g;circ(0,0,r);ctx.fill();ctx.fillStyle='#2e9e4f';ctx.beginPath();ctx.ellipse(-r*.3,-r*.1,r*.35,r*.2,.5,0,TAU);ctx.fill();ctx.beginPath();ctx.ellipse(r*.35,r*.3,r*.28,r*.16,-.3,0,TAU);ctx.fill()},
 function(r){var g=ctx.createRadialGradient(-r*.3,-r*.3,1,0,0,r);g.addColorStop(0,'#f4f4ee');g.addColorStop(1,'#8a8a82');ctx.fillStyle=g;circ(0,0,r);ctx.fill();ctx.fillStyle='rgba(0,0,0,.15)';circ(-r*.3,-r*.1,r*.22);ctx.fill();circ(r*.3,r*.3,r*.16);ctx.fill();circ(r*.2,-r*.4,r*.12);ctx.fill()}];
var TRAILC=['#ffffff','#e5243b','#ffc93c','#ff7a1a','#35c8ff','#5fb4f2','#e8e8e0'];
function pent(x,y,r){ctx.beginPath();for(var i=0;i<5;i++){var a=-PI/2+i*TAU/5;ctx[i?'lineTo':'moveTo'](x+Math.cos(a)*r,y+Math.sin(a)*r)}ctx.closePath();ctx.fill()}
function pentS(x,y,r){ctx.beginPath();for(var i=0;i<5;i++){var a=-PI/2+i*TAU/5;ctx[i?'lineTo':'moveTo'](x+Math.cos(a)*r,y+Math.sin(a)*r)}ctx.closePath();ctx.stroke()}
function drawBallAt(x,y,r,rot,skin){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.save();circ(0,0,r);ctx.clip();SKINS[skin](r);
  var hg=ctx.createRadialGradient(-r*.4,-r*.45,0,-r*.4,-r*.45,r*.8);hg.addColorStop(0,'rgba(255,255,255,.6)');hg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=hg;ctx.fillRect(-r,-r,r*2,r*2);ctx.restore();
  ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1.5;circ(0,0,r);ctx.stroke();ctx.restore()}
function drawBall(){
  var b=S.ball,x=sx(b.x),y=sy(b.y),r=Math.max(16,BR*S.z*1.4),sp=Math.hypot(b.vx,b.vy);
  var gy=sy(0),hk=clamp(1-b.y/900,.2,1);ctx.fillStyle='rgba(0,0,0,'+(.25*hk)+')';ctx.beginPath();ctx.ellipse(x,gy+2,r*1.2*hk,r*.3*hk,0,0,TAU);ctx.fill();
  if(S.st==='fly'&&b.vy<-140&&S.tti<.5){var k2=S.tti/.5,good=S.tti<.075+.007*upv('bounce');ctx.strokeStyle=S.bTap!=null?'rgba(255,255,255,.5)':good?'#16d97d':'#ffc93c';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(x,gy+2,r*1.3+k2*r*4,(r*1.3+k2*r*4)*.32,0,0,TAU);ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='rgba(255,255,255,.6)';ctx.beginPath();ctx.ellipse(x,gy+2,r*1.3,r*.42,0,0,TAU);ctx.stroke()}
  if(S.st==='fly'||S.st==='end'||S.st==='moon'){ctx.lineCap='round';for(var i=1;i<trail.length;i++){var a=trail[i-1],c=trail[i],k=i/trail.length;
    ctx.strokeStyle=TRAILC[SV.skin];ctx.globalAlpha=k*.45*clamp(sp/1200,.15,1);ctx.lineWidth=r*1.5*k;ctx.beginPath();ctx.moveTo(sx(a.x),sy(a.y));ctx.lineTo(sx(c.x),sy(c.y));ctx.stroke()}ctx.globalAlpha=1;ctx.lineCap='butt'}
  if(SV.skin===3||SV.skin===4){var gl=ctx.createRadialGradient(x,y,r*.5,x,y,r*2.4);gl.addColorStop(0,SV.skin===3?'rgba(255,140,30,.5)':'rgba(53,200,255,.45)');gl.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gl;circ(x,y,r*2.4);ctx.fill()}
  drawBallAt(x,y,r,b.rot,SV.skin);
  if(S.shield>0&&S.st==='fly'){ctx.strokeStyle='rgba(53,200,255,'+(.5+.3*Math.sin(S.t*6))+')';ctx.lineWidth=3;circ(x,y,r+9);ctx.stroke()}
}
function drawObj(o){
  var x=sx(o.x),y=sy(o.y),t=S.t+o.ph;if(x<-160||x>W+160)return;
  ctx.save();ctx.translate(x,y);ctx.scale(S.z,S.z);ctx.textAlign='center';ctx.textBaseline='middle';
  switch(o.k){
    case 'coin':var q=Math.abs(Math.cos(t*4));ctx.scale(Math.max(.2,q),1);ctx.fillStyle='#b77a00';circ(0,0,14);ctx.fill();ctx.fillStyle='#ffc93c';circ(0,0,11.5);ctx.fill();ctx.fillStyle='#8a5a00';ctx.font='400 14px Anton, Impact, sans-serif';ctx.fillText('Q',0,1);break;
    case 'ring':ctx.globalAlpha=o.used?.25:1;var pl=1+Math.sin(t*5)*.05;ctx.scale(pl,pl);var g=ctx.createLinearGradient(0,-46,0,46);g.addColorStop(0,'#b37700');g.addColorStop(.5,'#fff3b0');g.addColorStop(1,'#b37700');
      ctx.strokeStyle='rgba(255,201,60,.35)';ctx.lineWidth=18;ctx.beginPath();ctx.ellipse(0,0,18,46,0,0,TAU);ctx.stroke();ctx.strokeStyle=g;ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(0,0,18,46,0,0,TAU);ctx.stroke();
      if(!o.used){ctx.fillStyle='#fff3b0';ctx.font='700 13px Barlow, Arial, sans-serif';ctx.fillText('BOOST',0,-62)}break;
    case 'balloon':ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,26);ctx.quadraticCurveTo(6,40,0,56);ctx.stroke();var bg=ctx.createRadialGradient(-8,-10,2,0,0,30);bg.addColorStop(0,'rgba(255,255,255,.7)');bg.addColorStop(.3,o.col);bg.addColorStop(1,o.col);
      ctx.fillStyle=bg;ctx.beginPath();ctx.ellipse(0,0,24,28,0,0,TAU);ctx.fill();ctx.fillStyle=o.col==='#ffffff'||o.col==='#ffc93c'?'#10204a':'#fff';ctx.font='400 18px Anton, Impact, sans-serif';ctx.fillText('Q',0,1);break;
    case 'tramp':var sq=o.squash||0;ctx.fillStyle='#2e3b5c';ctx.fillRect(-40,-24,6,24);ctx.fillRect(34,-24,6,24);ctx.fillStyle='#16d97d';ctx.beginPath();ctx.ellipse(0,-26+sq*8,46,9-sq*3,0,0,TAU);ctx.fill();
      if(!o.used){ctx.fillStyle='#16d97d';rr(-30,-66,60,22,11);ctx.fill();ctx.fillStyle='#062312';ctx.font='700 13px Barlow, Arial, sans-serif';ctx.fillText('SKOK',0,-55)}break;
    case 'mate':ctx.restore();ctx.save();person(x,y,S.z*1.5,o.shirt,o.kickT>0?'kick':'stand',t);ctx.translate(x,y);ctx.scale(S.z,S.z);ctx.textAlign='center';ctx.textBaseline='middle';
      if(!o.used){ctx.fillStyle='#16d97d';rr(-44,-150,88,24,12);ctx.fill();ctx.fillStyle='#062312';ctx.font='700 14px Barlow, Arial, sans-serif';ctx.fillText('PODANIE',0,-138)}break;
    case 'charge':var cg=ctx.createRadialGradient(0,0,2,0,0,34);cg.addColorStop(0,'rgba(53,200,255,.7)');cg.addColorStop(1,'rgba(53,200,255,0)');ctx.fillStyle=cg;circ(0,0,34);ctx.fill();ctx.fillStyle='#0d1c38';circ(0,0,18);ctx.fill();ctx.strokeStyle='#35c8ff';ctx.lineWidth=3;ctx.stroke();
      ctx.fillStyle='#35c8ff';ctx.font='400 18px Anton, Impact, sans-serif';ctx.fillText('+1',0,1);break;
    case 'rocket':var rg=ctx.createRadialGradient(0,0,2,0,0,40);rg.addColorStop(0,'rgba(255,160,40,.6)');rg.addColorStop(1,'rgba(255,160,40,0)');ctx.fillStyle=rg;circ(0,0,40);ctx.fill();ctx.rotate(PI/2);
      ctx.fillStyle='#f4f6fb';ctx.beginPath();ctx.moveTo(0,-24);ctx.quadraticCurveTo(10,-10,9,12);ctx.lineTo(-9,12);ctx.quadraticCurveTo(-10,-10,0,-24);ctx.fill();ctx.fillStyle='#e5243b';ctx.beginPath();ctx.moveTo(-9,4);ctx.lineTo(-15,16);ctx.lineTo(-9,14);ctx.fill();ctx.beginPath();ctx.moveTo(9,4);ctx.lineTo(15,16);ctx.lineTo(9,14);ctx.fill();break;
    case 'pad':ctx.fillStyle='#2e3b5c';ctx.beginPath();ctx.moveTo(-50,0);ctx.lineTo(50,0);ctx.lineTo(50,-40);ctx.closePath();ctx.fill();ctx.fillStyle=Math.sin(t*8)>0?'#ffc93c':'#ff7a1a';ctx.fillRect(-40,-6,80,4);
      if(!o.used){ctx.fillStyle='#ffc93c';rr(-50,-76,100,24,12);ctx.fill();ctx.fillStyle='#2a1200';ctx.font='700 13px Barlow, Arial, sans-serif';ctx.fillText('WYRZUTNIA',0,-64)}break;
    case 'mud':ctx.fillStyle='#6b4a2b';ctx.beginPath();ctx.ellipse(0,4,70,12,0,0,TAU);ctx.fill();ctx.fillStyle='#8a6238';ctx.beginPath();ctx.ellipse(-10,2,40,6,0,0,TAU);ctx.fill();
      if(!o.used){ctx.fillStyle='#e5243b';rr(-32,-34,64,22,11);ctx.fill();ctx.fillStyle='#fff';ctx.font='700 13px Barlow, Arial, sans-serif';ctx.fillText('BŁOTO',0,-23)}break;
    case 'keeper':ctx.restore();ctx.save();person(x,y,S.z*1.6,'#c6ff00',o.catchT>0?'catch':'stand',t);ctx.translate(x,y);ctx.scale(S.z,S.z);ctx.textAlign='center';ctx.textBaseline='middle';
      if(!o.used){ctx.fillStyle='#e5243b';rr(-48,-165,96,24,12);ctx.fill();ctx.fillStyle='#fff';ctx.font='700 14px Barlow, Arial, sans-serif';ctx.fillText('BRAMKARZ',0,-153)}break;
    case 'bus':ctx.fillStyle='#ffc93c';rr(-70,-80,140,70,10);ctx.fill();ctx.fillStyle='#35c8ff';for(var w=0;w<4;w++)ctx.fillRect(-60+w*32,-72,24,22);ctx.fillStyle='#10131a';circ(-40,-8,12);ctx.fill();circ(40,-8,12);ctx.fill();ctx.fillStyle='#2a1200';ctx.font='400 14px Anton, Impact, sans-serif';ctx.fillText('KIBICE',0,-30);break;
    case 'rock':ctx.fillStyle='#6b6258';ctx.beginPath();ctx.moveTo(-48,0);ctx.lineTo(-30,-60);ctx.lineTo(10,-78);ctx.lineTo(44,-40);ctx.lineTo(50,0);ctx.fill();ctx.fillStyle='rgba(255,255,255,.15)';ctx.beginPath();ctx.moveTo(-30,-60);ctx.lineTo(10,-78);ctx.lineTo(0,-40);ctx.fill();break;
    case 'crab':ctx.fillStyle='#e5243b';ctx.beginPath();ctx.ellipse(0,-12,22,12,0,0,TAU);ctx.fill();ctx.strokeStyle='#e5243b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-18,-14);ctx.lineTo(-30,-26+Math.sin(t*8)*4);ctx.moveTo(18,-14);ctx.lineTo(30,-26-Math.sin(t*8)*4);ctx.stroke();ctx.fillStyle='#fff';circ(-6,-24,4);ctx.fill();circ(6,-24,4);ctx.fill();break;
    case 'bird':var fl=Math.sin(t*14)*8;ctx.strokeStyle='#1b2233';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-18,-fl);ctx.quadraticCurveTo(-8,-6,0,0);ctx.quadraticCurveTo(8,-6,18,-fl);ctx.stroke();ctx.fillStyle='#f4f6fb';ctx.beginPath();ctx.ellipse(0,2,9,5,0,0,TAU);ctx.fill();ctx.lineCap='butt';break;
    case 'plane':ctx.scale(-1,1);ctx.fillStyle='#f4f6fb';rr(-34,-7,68,14,7);ctx.fill();ctx.fillStyle='#c7d0e6';ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(-20,20);ctx.lineTo(-10,20);ctx.lineTo(8,0);ctx.fill();ctx.fillStyle='#2b2bff';ctx.fillRect(-30,-2,60,3);break;
  }
  ctx.restore();ctx.textBaseline='alphabetic';
}
function pill(x,y,w,h){ctx.fillStyle='rgba(6,14,32,.8)';rr(x,y,w,h,18);ctx.fill();ctx.strokeStyle='rgba(77,107,255,.55)';ctx.lineWidth=2;ctx.stroke()}
function drawHud(){
  var b=S.ball,t=S.t;ctx.textAlign='center';
  if(S.st==='fly'||S.st==='end'||S.st==='moon'){
    var dm=m(Math.max(b.x,0));pill(W/2-150,12,300,86);ctx.fillStyle='#a9bee3';ctx.font='700 14px Barlow, Arial, sans-serif';ctx.fillText(ZONES[zoneAt(dm)][0].toUpperCase(),W/2,36);
    ctx.fillStyle='#fff';ctx.font='400 46px Anton, Impact, sans-serif';ctx.fillText(num(dm)+' m',W/2,84);
    pill(14,12,120,56);ctx.fillStyle='#ffc93c';ctx.font='400 26px Anton, Impact, sans-serif';ctx.textAlign='left';ctx.fillText('● '+num(S.coins),30,50);
    pill(W-134,12,120,56);ctx.fillStyle='#fff';ctx.textAlign='right';ctx.font='400 24px Anton, Impact, sans-serif';ctx.fillText(num(Math.abs(b.vx)*.36)+' km/h',W-28,49);
    if(S.combo>=2){ctx.fillStyle='#ffc93c';rr(W/2-70,106,140,30,15);ctx.fill();ctx.fillStyle='#2a1200';ctx.font='400 19px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.fillText('SERIA x'+S.combo,W/2,128)}
    var n=S.taps,tot=Math.max(S.tapsMax,n),cw=44,bw=tot*cw+120,bx0=W/2-bw/2;ctx.fillStyle='rgba(6,14,32,.82)';rr(bx0,H-80,bw,60,30);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='700 13px Barlow, Arial, sans-serif';ctx.textAlign='left';ctx.fillText('PODBICIA',bx0+18,H-45);
    for(var i=0;i<tot;i++){var cx=bx0+104+i*cw;if(i<n){ctx.fillStyle='#35c8ff';circ(cx,H-50,16);ctx.fill();ctx.fillStyle='#0d1c38';ctx.font='400 15px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.fillText('▲',cx,H-44)}
      else{ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=2;circ(cx,H-50,15);ctx.stroke()}}
    if(S.st==='fly'&&SV.runs<4&&S.t-S.t0<14){ctx.globalAlpha=.75+.25*Math.sin(t*5);ctx.fillStyle='rgba(6,14,32,.85)';rr(W/2-280,150,560,46,23);ctx.fill();ctx.fillStyle='#fff';ctx.font='700 19px Barlow, Arial, sans-serif';ctx.textAlign='center';
      ctx.fillText(TOUCH?'Tapnij, gdy piłka dotyka ziemi = odbicie!':'Klik, gdy piłka dotyka ziemi = odbicie!',W/2,180);ctx.globalAlpha=1}
  }
  if(S.st==='angle'||S.st==='power'||S.st==='kick'){
    ctx.globalAlpha=.85+.15*Math.sin(t*6);ctx.fillStyle='rgba(6,14,32,.88)';rr(W/2-230,120,460,56,28);ctx.fill();ctx.fillStyle='#fff';ctx.font='700 22px Barlow, Arial, sans-serif';ctx.textAlign='center';
    ctx.fillText(S.st==='angle'?'1. Kąt: tapnij w zieleni':S.st==='power'?'2. Siła: tapnij w zieleni':'Strzał!',W/2,156);ctx.globalAlpha=1;
    if(S.st!=='angle'){var mx=W-86,my=230,mh=380,p=S.st==='power'?powNow():S.power;ctx.fillStyle='rgba(6,14,32,.85)';rr(mx-8,my-8,52,mh+16,26);ctx.fill();
      var mg=ctx.createLinearGradient(0,my+mh,0,my);mg.addColorStop(0,'#e5243b');mg.addColorStop(.55,'#ffc93c');mg.addColorStop(.92,'#ffc93c');mg.addColorStop(.95,'#16d97d');mg.addColorStop(1,'#8affc4');ctx.fillStyle=mg;rr(mx,my,36,mh,18);ctx.fill();
      ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.strokeRect(mx-4,my,44,mh*.05);var py=my+mh*(1-p);ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(mx-16,py-10);ctx.lineTo(mx-2,py);ctx.lineTo(mx-16,py+10);ctx.fill();ctx.fillRect(mx-2,py-3,40,6)}
    if(SV.best>0){ctx.fillStyle='rgba(6,14,32,.8)';rr(16,16,220,44,22);ctx.fill();ctx.fillStyle='#ffc93c';ctx.textAlign='left';ctx.font='400 21px Anton, Impact, sans-serif';ctx.fillText('REKORD '+num(SV.best)+' m',32,46)}
  }
}
function render(){
  ctx.setTransform(scale,0,0,scale,0,0);
  if(S.shake>0)ctx.translate(rnd(-1,1)*S.shake*.6,rnd(-1,1)*S.shake*.6);
  drawSky();drawFar();drawGround();
  S.obj.forEach(drawObj);drawKicker();drawBall();
  parts.forEach(function(p){var a=1-p.t/p.life;ctx.globalAlpha=Math.max(0,a);ctx.fillStyle=p.col;circ(sx(p.x),sy(p.y),p.sz*a+.5);ctx.fill()});ctx.globalAlpha=1;
  floats.forEach(function(f){var k=f.t/f.life;ctx.globalAlpha=k<.7?1:1-(k-.7)/.3;ctx.font='400 '+(f.big?40:30)+'px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.lineWidth=6;ctx.strokeStyle='rgba(6,14,32,.9)';ctx.strokeText(f.txt,f.x,f.y-k*60);ctx.fillStyle=f.col;ctx.fillText(f.txt,f.x,f.y-k*60)});ctx.globalAlpha=1;ctx.textBaseline='alphabetic';
  if(S.st!=='menu'&&!window.__noHud)drawHud();
}
var last=0;
function frame(ts){var dt=Math.min(.05,(ts-last)/1000||0);last=ts;var ns=DEBUG?(window.__wkTS||1):1;for(var k=0;k<ns;k++)update(dt);render();requestAnimationFrame(frame)}

/* ---------- nakładki ---------- */
function showOv(h,cls){popEl.classList.remove('on');ov.className='lt-ov on '+(cls||'');ov.innerHTML='<div class="lt-panel">'+h+'</div>'}
function hideOv(){ov.className='lt-ov';ov.innerHTML=''}
function iconRow(items){return '<div class="lt-icons">'+items.map(function(x){return '<button class="lt-ib" data-a="'+x[0]+'"><i>'+x[1]+'</i><span>'+x[2]+'</span>'+(x[3]!=null?'<b>'+x[3]+'</b>':'')+'</button>'}).join('')+'</div>'}
function coinChip(){return '<p class="lt-chip">&#129689; <b>'+num(SV.coins)+'</b></p>'}
function hasProg(){return !!(SV.runs||SV.coins||SV.best)}
function showMenu(){
  S.st='menu';S.camX=-40;S.camY=150;S.z=1.25;S.ball={x:0,y:BR,vx:0,vy:0,rot:0};S.kx=-180;S.obj=[];musStop();
  showOv('<p class="lt-kick">Gra Qastrod</p><h2 class="lt-title">Wykop <em>na Księżyc</em></h2>'+
   (SV.best?'<p class="lt-chip">&#127942; Rekord <b>'+num(SV.best)+' m</b></p>':'<p class="lt-chip">Cel: <b>Księżyc, '+num(MOONM)+' m</b></p>')+
   '<button class="lt-btn go" data-a="play">'+(hasProg()?'&#9654; Kontynuuj':'&#9917; Kopnij!')+'</button>'+(hasProg()?'<button class="lt-link" data-a="newgame">Nowa gra</button>':'')+
   '<div class="lt-how"><span><i>&#127919;</i>Kąt i siła</span><span><i>&#128070;</i>Tap przy ziemi = odbicie</span><span><i>&#11093;</i>Łap boosty</span></div>'+
   iconRow([['upg','&#128295;','Szatnia',num(SV.coins)],['skin','&#9917;','Piłki',(SV.zone+1)+'/7'],['map','&#128506;&#65039;','Droga',ZONES[SV.zone][0]]]),'menu');
}
function showUpg(){
  var h='<h2 class="lt-h">Szatnia</h2>'+coinChip()+'<div class="lt-ugrid">';
  UPG.forEach(function(u){var lv=SV.up[u[0]],max=lv>=u[4],c=upCost(u[0]),pips='',can=!max&&SV.coins>=c;
    for(var i=0;i<u[4];i++)pips+='<i'+(i<lv?' class="on"':'')+'></i>';
    h+='<button class="lt-ucard'+(can?' can':'')+(max?' max':'')+'" data-a="up" data-k="'+u[0]+'"'+(can?'':' disabled')+'><span class="ic">'+u[5]+'</span><b>'+u[1]+'</b><span class="ds">'+u[2]+'</span><span class="pips">'+pips+'</span><span class="pr">'+(max?'MAX':num(c))+'</span></button>'});
  h+='</div><button class="lt-btn" data-a="back">&lsaquo; Wróć</button>';showOv(h,'wide');
}
var skinCache={};
function skinImg(i){if(skinCache[i])return skinCache[i];var c=document.createElement('canvas');c.width=c.height=120;var old=ctx;ctx=c.getContext('2d');drawBallAt(60,60,48,.3,i);ctx=old;return skinCache[i]=c.toDataURL()}
function showSkins(){
  var h='<h2 class="lt-h">Piłki</h2><p class="lt-meta">Nowa piłka za każdą nową strefę</p><div class="wk-skins">';
  ZONES.forEach(function(z,i){var own=i<=SV.zone,sel=SV.skin===i;
    h+='<button class="wk-skin'+(sel?' sel':'')+(own?'':' lock')+'" data-a="pick" data-i="'+i+'"'+(own?'':' disabled')+'>'+(own?'<img alt="" src="'+skinImg(i)+'">':'<i>&#128274;</i>')+'<b>'+z[6]+'</b><span>'+(own?(sel?'Wybrana':'Wybierz'):z[0])+'</span></button>'});
  h+='</div><button class="lt-btn" data-a="back">&lsaquo; Wróć</button>';showOv(h,'wide');
}
function showMap(){
  var h='<h2 class="lt-h">Droga na Księżyc</h2><div class="wk-road">';
  for(var i=ZONES.length-1;i>=0;i--){var z=ZONES[i],got=i<=SV.zone,cur=i===SV.zone+1;
    h+='<div class="wk-stop'+(got?' got':'')+(cur?' cur':'')+'"><i>'+(got?'&#10003;':cur?'&#9654;':'&#128274;')+'</i><b>'+z[0]+'</b><span>'+num(z[1])+' m</span>'+(z[2]?'<em>+'+num(z[2])+' &#129689;</em>':'')+'</div>'}
  h+='</div><button class="lt-btn go" data-a="play">&#9917; Kopnij!</button><button class="lt-link" data-a="back">Wróć</button>';showOv(h,'wide');
}
function nextHint(){var best=null;UPG.forEach(function(u){if(SV.up[u[0]]>=u[4])return;var c=upCost(u[0]);if(!best||c<best.c)best={n:u[1],c:c}});if(!best)return '';
  return SV.coins>=best.c?'<button class="lt-nudge ok" data-a="upg">&#128295; Kup: <b>'+best.n+'</b> &rsaquo;</button>':'<p class="lt-nudge">Jeszcze <b>'+num(best.c-SV.coins)+'</b> monet do: '+best.n+'</p>'}
function showOver(){
  var dist=S.dist,diff=Math.max(0,S.prev-dist),bar=S.prev>0?Math.round(clamp(dist/S.prev,0,1)*100):100,nz=ZONES[Math.min(ZONES.length-1,zoneAt(dist)+1)];
  showOv('<p class="lt-kick">'+ZONES[zoneAt(dist)][0]+'</p><h2 class="lt-score" id="wkScore">0</h2><p class="lt-unit">metrów</p>'+
   (S.moonWin?'<p class="lt-rec">&#127769; Doleciałeś na Księżyc!</p>':S.rec?'<p class="lt-rec">&#127942; Nowy rekord!</p>':S.prev>0?'<div class="lt-vs"><span>Do rekordu brakło <b>'+num(diff)+' m</b></span><i style="--p:'+bar+'%"></i></div>':'')+
   (S.unlocked.length?'<p class="lt-nudge ok">Nowa piłka: <b>'+ZONES[S.unlocked[S.unlocked.length-1]][6]+'</b></p>':'')+
   '<div class="lt-chips"><span><i>&#129689;</i>+'+num(S.earn+S.bonus)+'</span><span><i>&#11093;</i>x'+Math.max(1,S.bestCombo||0)+'</span><span><i>&#127937;</i>'+(nz[1]>dist?nz[0]+': '+num(nz[1]-dist)+' m':'Księżyc!')+'</span></div>'+
   '<button class="lt-btn go again" data-a="play">&#9917; Kopnij jeszcze raz</button>'+nextHint()+
   iconRow([['upg','&#128295;','Szatnia',num(SV.coins)],['skin','&#9917;','Piłki',null],['map','&#128506;&#65039;','Droga',null],['menu','&#8962;','Menu',null]]),'over');
  var e1=document.getElementById('wkScore'),t0=performance.now(),goal=dist;(function st(n){var k=Math.min(1,(n-t0)/900),e=1-Math.pow(1-k,3);if(e1)e1.textContent=num(goal*e);if(k<1)requestAnimationFrame(st)})(t0);
}
function showPause(){showOv('<h2 class="lt-h big">Pauza</h2><button class="lt-btn go" data-a="resume">&#9654; Wznów</button>'+iconRow([['mute',SV.muted?'&#128263;':'&#128266;',SV.muted?'Dźwięk wył.':'Dźwięk wł.',null],['quit','&#9209;&#65039;','Zakończ',null]]),'pause')}
var backTo='menu',pausedFrom=null;
function pause(){if(S.st==='fly'||S.st==='angle'||S.st==='power'){pausedFrom=S.st;S.st='pause';musStop();showPause()}}
function resume(){if(S.st==='pause'){S.st=pausedFrom;hideOv();if(S.st==='fly')musStart()}}

/* ---------- sterowanie ---------- */
cv.addEventListener('pointerdown',function(e){unlockAudio();e.preventDefault();tapInput()});
window.addEventListener('keydown',function(e){var k=e.key,inView=root.getBoundingClientRect().top<innerHeight*.6;
  if((S.st==='angle'||S.st==='power'||S.st==='fly')&&(k===' '||k==='Enter'||k==='ArrowUp')){e.preventDefault();if(!e.repeat)tapInput();return}
  if(S.st==='fly'&&(k==='p'||k==='P'||k==='Escape'))pause();
  else if(S.st==='pause'&&(k==='p'||k==='P'||k==='Escape'))resume();
  else if((S.st==='over'||S.st==='menu')&&(k===' '||k==='Enter')&&inView){e.preventDefault();newRun()}
  if(k==='m'||k==='M'){SV.muted=!SV.muted;save();syncBar()}});
root.addEventListener('click',function(e){
  var b=e.target.closest('[data-a]');if(!b||b.disabled)return;unlockAudio();var a=b.getAttribute('data-a');
  switch(a){
    case 'play':newRun();break;
    case 'upg':if(!ov.querySelector('.lt-ugrid'))backTo=S.st==='over'?'over':'menu';showUpg();break;
    case 'skin':if(!ov.querySelector('.wk-skins'))backTo=S.st==='over'?'over':'menu';showSkins();break;
    case 'map':backTo=S.st==='over'?'over':'menu';showMap();break;
    case 'back':if(backTo==='over')showOver();else showMenu();break;
    case 'up':var k=b.getAttribute('data-k'),c=upCost(k);if(SV.coins>=c){SV.coins-=c;SV.up[k]++;save();sfx('buy')}showUpg();break;
    case 'pick':SV.skin=+b.getAttribute('data-i');save();sfx('buy');showSkins();break;
    case 'menu':showMenu();break;
    case 'newgame':showOv('<h2 class="lt-h">Nowa gra?</h2><p class="lt-meta">Postęp, monety i ulepszenia zostaną wyczyszczone. Zaczniesz od zera.</p><button class="lt-btn go" data-a="newok">Tak, zacznij od nowa</button><button class="lt-link" data-a="menu">Anuluj</button>','menu');break;
    case 'newok':var mu=SV.muted,d=JSON.parse(SVDEF);Object.keys(SV).forEach(function(k){delete SV[k]});Object.assign(SV,d);SV.muted=mu;save();showMenu();toast('Nowa gra! Powodzenia');break;
    case 'pause':if(S.st==='pause')resume();else pause();break;
    case 'resume':resume();break;
    case 'quit':S.st='fly';hideOv();endRun();break;
    case 'mute':SV.muted=!SV.muted;save();syncBar();if(S.st==='pause')showPause();break;
    case 'fs':var d=document;if(d.fullscreenElement||d.webkitFullscreenElement)(d.exitFullscreen||d.webkitExitFullscreen).call(d);else{var f=root.requestFullscreen||root.webkitRequestFullscreen;if(f)f.call(root)}break;
  }});
document.addEventListener('visibilitychange',function(){if(document.hidden)pause()});
function syncBar(){var mb=root.querySelector('[data-a="mute"].lt-tool');if(mb)mb.innerHTML=SV.muted?'&#128263; Dźwięk: wył.':'&#128266; Dźwięk: wł.'}
if(!(document.fullscreenEnabled||document.webkitFullscreenEnabled)){var fb=root.querySelector('[data-a="fs"]');if(fb)fb.style.display='none'}
syncBar();
showMenu();
function boot(){requestAnimationFrame(function(ts){last=ts;requestAnimationFrame(frame)})}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(boot,boot);else boot();
if(DEBUG)window.__wk={S:S,SV:SV,newRun:newRun,tapInput:tapInput,endRun:endRun,save:save,update:update};
})();
