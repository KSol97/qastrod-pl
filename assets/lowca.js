/* ŁOWCA TALENTÓW · gra Qastrod.pl · tryb meczu na czas */
(function(){
'use strict';
var root=document.getElementById('lt'); if(!root) return;
var stage=root.querySelector('.lt-stage'), cv=stage.querySelector('canvas');
var ctx=cv.getContext('2d');
var W=720,H=960,PITCH=214,PIV={x:360,y:214},L0=24,PI=Math.PI,TAU=PI*2;
var DEBUG=/[?&]debug=1/.test(location.search);
var TOUCH=!!(window.matchMedia&&matchMedia('(hover:none)').matches);

/* ---------- elementy DOM ---------- */
function el(tag,cls,html){var d=document.createElement(tag);d.className=cls;if(html)d.innerHTML=html;return d}
var ov=el('div','lt-ov'),toastEl=el('div','lt-toast'),popEl=el('div','lt-pop'),shoutEl=el('div','lt-shout'),misEl=el('div','lt-mis');
[ov,toastEl,popEl,shoutEl,misEl].forEach(function(d){stage.appendChild(d)});

/* ---------- dane ---------- */
var T={
 goldB:{r:38,w:7,v:500,k:'gold',n:'Złota piłka XL',tb:2.6},
 goldM:{r:27,w:3.5,v:250,k:'gold',n:'Złota piłka',tb:1.5},
 goldS:{r:16,w:1.6,v:80,k:'gold',n:'Złota piłeczka',tb:.6},
 trophy:{r:30,w:6,v:420,k:'prize',n:'Puchar',tb:2.4},
 medal:{r:17,w:1.3,v:140,k:'prize',n:'Medal',tb:1},
 star:{r:19,w:1,v:600,k:'prize',n:'Gwiazdka',tb:2},
 boots:{r:22,w:2.2,v:45,k:'gear',n:'Korki',tb:.4},
 ball:{r:19,w:1.8,v:25,k:'gear',n:'Piłka',tb:.3},
 cone:{r:22,w:4.5,v:10,k:'junk',n:'Pachołek',tb:-1},
 tire:{r:34,w:9,v:15,k:'junk',n:'Opona',tb:-1.5},
 bag:{r:21,w:1.5,v:0,k:'bag',n:'Torba',tb:0},
 runner:{r:24,w:1.2,v:500,k:'talent',n:'Talent',tb:2.6},
 dribbler:{r:26,w:1.6,v:750,k:'talent',n:'Drybler',tb:3.4},
 keeper:{r:28,w:3.2,v:380,k:'talent',n:'Bramkarz',tb:2.4},
 ref:{r:24,w:1.2,v:0,k:'ref',n:'Sędzia',tb:0},
 bomb:{r:19,w:1,v:0,k:'bomb',n:'Petarda',tb:0},
 pw:{r:18,w:1,v:0,k:'pw',n:'Boost',tb:0}
};
var MOVE={runner:1,dribbler:1,keeper:1,ref:1};
var PW={laser:['Celownik','#16d97d'],iso:['Izotonik','#35c8ff'],clock:['+5 s','#ffc93c'],whistle:['Gwizdek','#ffffff']};
var CARDS=[
 ['Olek Kopyto','OBR',0,4],['Szymon Siatka','BR',0,1],['Franek Florek','POM',0,8],['Staś Sprint','SKR',0,11],
 ['Bartek Bomba','NAP',0,9],['Igor Wślizg','OBR',0,5],['Julek Podcinka','POM',0,6],
 ['Antek Tunel','POM',1,10],['Nikola Główka','NAP',1,19],['Wiktor Wolej','NAP',1,17],['Maks Przewrotka','NAP',1,99],['Tymek Rabona','SKR',1,7],
 ['Leon Laser','POM',2,23],['Kuba Rakieta','SKR',2,77],['Adaś Albatros','BR',2,33],
 ['Filip Fenomen','NAP',3,10]];
var TIERS=[['Kartoflisko','rgba(255,160,70,.07)'],['Liga okręgowa',''],['I liga','rgba(90,130,255,.06)'],['Ekstraklasa','rgba(0,0,0,.06)'],['Liga Mistrzów','rgba(30,30,150,.14)'],['Mundial','rgba(255,205,80,.08)']];
var MAXL=30;
function goalOf(L){var n=L-1;return Math.round((1200+650*n+35*n*n)/50)*50}
function tierOf(L){return TIERS[Math.min(TIERS.length-1,Math.floor((L-1)/5))]}
function starsTotal(){var t=0;for(var k in SV.lvS)t+=SV.lvS[k];return t}
var RAR=['Zwykła','Rzadka','Epicka','Legenda'], RBASE=[66,76,85,94];
var UPG=[
 ['hook','Szybki rzut','Szybszy hak',60,5,'&#9889;'],
 ['arm','Mocne ramię','Szybsze zwijanie',70,5,'&#128170;'],
 ['time','Doliczony czas','+2 s na start',90,5,'&#9201;&#65039;'],
 ['tbu','Kondycja','+8% czasu za łup',100,5,'&#10084;&#65039;'],
 ['eye','Oko skauta','+5% punktów',80,5,'&#128064;'],
 ['whistle','Gwizdek','+1 na start',70,3,'&#128227;']];
var MIS=[
 ['s3','Zdobądź 3000 pkt w meczu','score',3000,15],['c3','Zrób serię x3','cmax',3,15],['t45','Przetrwaj 45 sekund','sec',45,20],
 ['f1','Wejdź w Szał kibiców','fever',1,25],['tal3','Złap 3 piłkarzy w meczu','tal',3,20],['boom4','Wysadź petardą 4 rzeczy','boom',4,20],
 ['gk','Złap bramkarza','gk',1,20],['s8','Zdobądź 8000 pkt w meczu','score',8000,30],['t75','Przetrwaj 75 sekund','sec',75,35],
 ['c7','Zrób serię x7','cmax',7,40],['leg','Złap gwiazdę, która przebiega boisko','leg',1,40],['f2','Dwa razy Szał kibiców w meczu','fever',2,45],
 ['s15','Zdobądź 15 000 pkt w meczu','score',15000,50],['t120','Przetrwaj 2 minuty','sec',120,70],['s30','Zdobądź 30 000 pkt w meczu','score',30000,90]];

/* ---------- zapis ---------- */
var KEY='qastrod_lowca_v2';
var UPK={hook:0,arm:0,time:0,tbu:0,eye:0,whistle:0};
var SV={ps:0,up:Object.assign({},UPK),album:[],best:0,bestT:0,runs:0,muted:false,mi:0,lvS:{},maxL:0};
var SVDEF=JSON.stringify(SV);
try{var d0=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!d0){var o1=JSON.parse(localStorage.getItem('qastrod_lowca_v1')||'null');if(o1)d0={album:o1.album,ps:o1.ps}}
  if(d0){SV.ps=+d0.ps||0;SV.best=+d0.best||0;SV.bestT=+d0.bestT||0;SV.runs=+d0.runs||0;SV.muted=!!d0.muted;SV.mi=+d0.mi||0;SV.lvS=d0.lvS&&typeof d0.lvS==='object'?d0.lvS:{};SV.maxL=+d0.maxL||0;SV.recL=+d0.recL||0;SV.reach=+d0.reach||0;
    SV.up=Object.assign({},UPK,d0.up||{});SV.album=Array.isArray(d0.album)?d0.album:[];}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(SV))}catch(e){}}

/* ---------- pomocnicze ---------- */
function rnd(a,b){return a+Math.random()*(b-a)}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function clamp(v,a,b){return v<a?a:v>b?b:v}
function num(n){return Math.round(n).toLocaleString('pl-PL')}
function fmt(n){return num(n)+' pkt'}
function mmss(s){s=Math.max(0,Math.floor(s));return Math.floor(s/60)+':'+('0'+s%60).slice(-2)}
function upCost(k){var u=UPG.filter(function(x){return x[0]===k})[0];return Math.round(u[3]*Math.pow(1.8,SV.up[k]))}
function albumCount(){return SV.album.length}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function circ(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,TAU)}
function poly(x,y,r,n,a0){ctx.beginPath();for(var i=0;i<n;i++){var a=a0+i*TAU/n;ctx[i?'lineTo':'moveTo'](x+Math.cos(a)*r,y+Math.sin(a)*r)}ctx.closePath()}
function starPath(x,y,R,r0,a0){ctx.beginPath();for(var i=0;i<10;i++){var a=a0+i*PI/5,q=i%2?r0:R;ctx[i?'lineTo':'moveTo'](x+Math.cos(a)*q,y+Math.sin(a)*q)}ctx.closePath()}

/* ---------- dźwięk i muzyka ---------- */
var AC=null,master=null,musG=null;
function unlockAudio(){
  if(AC){if(AC.state==='suspended')AC.resume();return}
  try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=.5;master.connect(AC.destination);
    musG=AC.createGain();musG.gain.value=.42;musG.connect(master)}catch(e){AC=null}
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
 shoot:function(){noise(.14,.1,2600);tone(560,.12,'triangle',.05,260)},
 grab:function(){tone(200,.1,'square',.1,90)},
 coin:function(){var p=1+Math.min(1,(S.combo||0)*.08);tone(988*p,.06,'square',.08);tone(1319*p,.2,'square',.08,null,.06)},
 big:function(){[784,988,1319,1568].forEach(function(f,i){tone(f,.15,'square',.07,null,i*.055)})},
 junk:function(){tone(120,.26,'sawtooth',.12,55);tone(90,.3,'square',.06,50,.05)},
 boom:function(){noise(.7,.5,700);tone(90,.5,'sine',.35,30);[1200,1500,900].forEach(function(f,i){tone(f,.08,'square',.05,null,.15+i*.07)})},
 whistle:function(){tone(2700,.08,'square',.06);tone(2700,.08,'square',.06,null,.12);tone(2900,.34,'square',.06,2650,.24)},
 final:function(){tone(2700,.2,'square',.07);tone(2700,.2,'square',.07,null,.3);tone(2900,.9,'square',.07,2600,.6)},
 beep:function(){tone(880,.12,'square',.08)},go:function(){tone(1320,.35,'square',.09)},
 tick:function(){tone(1500,.04,'square',.05)},
 heart:function(){tone(70,.12,'sine',.35,45);tone(62,.14,'sine',.3,40,.16)},
 reel:function(){tone(340,.025,'square',.02)},
 fever:function(){[523,659,784,1047,1319,1568].forEach(function(f,i){tone(f,.2,'square',.07,null,i*.05)});noise(1.6,.22,1100)},
 time:function(){tone(1760,.08,'sine',.07);tone(2349,.12,'sine',.06,null,.05)},
 lose:function(){tone(300,.18,'square',.08,150)},
 card:function(){[1047,1319,1568,2093,2637].forEach(function(f,i){tone(f,.15,'sine',.12,null,i*.05)})},
 buy:function(){tone(660,.07,'square',.08);tone(990,.15,'square',.08,null,.07)},
 rec:function(){[523,659,784,1047,784,1047,1319].forEach(function(f,i){tone(f,.22,'triangle',.16,null,i*.11)})},
 no:function(){tone(200,.16,'square',.07,150)},
 cheer:function(){noise(1.3,.16,900);noise(.9,.1,2600,.1)}
};
function sfx(n){try{SFX[n]&&SFX[n]()}catch(e){}}
/* sekwencer: bęben, klaskanie, bas, trybuny. Tempo rośnie z fazą meczu */
var MUS={on:false,step:0,next:0,iv:0};
var BASS=[55,55,65.4,49,55,55,73.4,65.4];
function musStart(){if(!AC||MUS.on)return;MUS.on=true;MUS.step=0;MUS.next=AC.currentTime+.06;MUS.iv=setInterval(musTick,25)}
function musStop(){MUS.on=false;clearInterval(MUS.iv)}
function musTick(){
  if(!AC||!MUS.on)return;
  var bpm=110+7*Math.min(8,S.lv-1)+(S.fever>0?14:0),spb=60/bpm/4;
  while(MUS.next<AC.currentTime+.12){playStep(MUS.step,MUS.next-AC.currentTime);MUS.next+=spb;MUS.step=(MUS.step+1)%32}
}
function playStep(s,d){
  if(SV.muted||S.st==='pause')return;var f=S.fever>0,lv=S.lv;
  if(s%8===0){tone(150,.14,'sine',.55,42,d,musG)}
  if(lv>=3&&s%16===10)tone(150,.12,'sine',.4,42,d,musG);
  if(s%8===4)noise(.12,.28,1800,d,musG,'bandpass');
  if(s%2===0||f)noise(.03,f?.07:.045,8000,d,musG,'highpass');
  if(s%4===0){var n=BASS[(s/4)%8]*(f?2:1);tone(n,.2,'triangle',.22,null,d,musG);tone(n*2,.12,'square',.03,null,d,musG)}
  if(f&&s%4===2)tone(BASS[(s>>2)%8]*4,.1,'square',.03,null,d,musG);
  if(s===0&&lv>=2)noise(1.8,.07,700,d,musG,'bandpass');
}

/* ---------- płótno i skala ---------- */
var scale=1,dpr=1;
function resize(){
  dpr=Math.min(2,window.devicePixelRatio||1);
  var cw=stage.clientWidth||600;
  cv.width=Math.round(cw*dpr);cv.height=Math.round(cw*4/3*dpr);
  scale=cv.width/W;
}
window.addEventListener('resize',resize);
if(window.ResizeObserver)new ResizeObserver(resize).observe(stage);
resize();

/* ---------- tło (renderowane raz) ---------- */
/* ---------- tła boisk: od kartofliska do finału mundialu ---------- */
var BGS=2,bg=document.createElement('canvas');bg.width=W*BGS;bg.height=H*BGS;var bgTier=-1,crowd=[];
function srand(seed){return function(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}}
function buildBg(ti){
  if(ti===bgTier)return;bgTier=ti;
  var c=bg.getContext('2d');c.setTransform(BGS,0,0,BGS,0,0);c.clearRect(0,0,W,H);
  var R=srand(1234+ti*77),r=function(a,b){return a+R()*(b-a)},i,x,y,g;
  function ellipse(x,y,rx,ry){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU)}
  /* --- otoczenie nad boiskiem --- */
  if(ti===0){
    g=c.createLinearGradient(0,0,0,152);g.addColorStop(0,'#5fb4f2');g.addColorStop(1,'#cdeefe');c.fillStyle=g;c.fillRect(0,0,W,152);
    c.fillStyle='rgba(255,246,200,.9)';c.beginPath();c.arc(620,34,20,0,TAU);c.fill();
    c.fillStyle='rgba(255,255,255,.85)';[[120,30],[330,22],[470,44]].forEach(function(p){ellipse(p[0],p[1],34,10);c.fill();ellipse(p[0]+22,p[1]-6,20,9);c.fill();ellipse(p[0]-20,p[1]-3,18,7);c.fill()});
    // dalekie pola i dom
    c.fillStyle='#8cc56a';c.fillRect(0,96,W,56);c.fillStyle='#c9a86a';c.fillRect(520,82,70,30);c.fillStyle='#a5452f';c.beginPath();c.moveTo(512,84);c.lineTo(555,62);c.lineTo(598,84);c.fill();
    c.fillStyle='#fff';c.fillRect(535,92,12,10);c.fillRect(562,92,12,10);
    // drzewa
    for(i=0;i<16;i++){x=r(0,W);if(x>505&&x<605)continue;var h=r(28,48);c.fillStyle='#5b3a1d';c.fillRect(x-2,112-h*.4,4,h*.4);
      c.fillStyle=['#2f7a34','#3d8f3c','#27692c'][i%3];c.beginPath();c.arc(x,112-h*.55,h*.38,0,TAU);c.fill();c.beginPath();c.arc(x-h*.2,112-h*.4,h*.26,0,TAU);c.fill();c.beginPath();c.arc(x+h*.2,112-h*.42,h*.28,0,TAU);c.fill()}
    // kilku kibiców za płotem
    for(i=0;i<11;i++){x=40+i*62+r(-14,14);if(Math.abs(x-360)<50)continue;var col=['#e5243b','#2b2bff','#ffc93c','#ffffff','#16d97d'][i%5];
      c.fillStyle=col;c.fillRect(x-5,100,10,14);c.fillStyle=['#f1c39b','#d9a47a','#b57a50'][i%3];c.beginPath();c.arc(x,95,5,0,TAU);c.fill()}
  }else{
    var night=ti===4,gold=ti===5;
    g=c.createLinearGradient(0,0,0,152);
    if(night){g.addColorStop(0,'#01020a');g.addColorStop(1,'#08103a')}else if(gold){g.addColorStop(0,'#07060a');g.addColorStop(1,'#1d1530')}
    else if(ti===1){g.addColorStop(0,'#6fa9d8');g.addColorStop(1,'#a9cde8')}else{g.addColorStop(0,'#040914');g.addColorStop(1,'#0c1a3c')}
    c.fillStyle=g;c.fillRect(0,0,W,152);
    if(ti===1){ // mała drewniana trybuna i drzewa
      for(i=0;i<10;i++){x=r(0,W);var h2=r(30,46);c.fillStyle='#2f6d33';c.beginPath();c.arc(x,92-h2*.3,h2*.4,0,TAU);c.fill()}
      c.fillStyle='#6b4a2b';c.fillRect(150,66,420,52);for(y=72;y<118;y+=11){c.fillStyle='#8a6238';c.fillRect(150,y,420,5)}
      c.fillStyle='#3d2a18';c.fillRect(140,58,440,8);
    }
    var y0=ti===1?70:ti===2?48:28,dens=[0,.45,.7,.97,.98,1][ti];
    var pal=night?['#2b2bff','#ffffff','#4d6bff','#9fb2d9','#16d97d','#35c8ff']:gold?['#ffffff','#e5243b','#ffc93c','#16d97d','#2b2bff','#ff7a1a','#35c8ff']:
      ti===1?['#e5243b','#ffffff','#2b2bff','#ffc93c','#5b3a1d']:['#2b2bff','#4d6bff','#ffffff','#16d97d','#ffc93c','#ff4d6d','#35c8ff','#9fb2d9','#6a7fae'];
    var x0=ti===1?156:4,x1=ti===1?566:W;
    for(y=y0;y<114;y+=7){for(x=x0;x<x1;x+=7){if(R()>dens)continue;
      c.globalAlpha=r(.4,.9)*(.55+.45*(y-y0)/(114-y0));c.fillStyle=pal[Math.floor(R()*pal.length)];c.beginPath();c.arc(x+r(-1.5,1.5),y+r(-1.2,1.2),2.3,0,TAU);c.fill()}}
    c.globalAlpha=1;
    if(ti>=2){c.strokeStyle='rgba(255,255,255,.05)';c.lineWidth=1;for(y=y0+10;y<116;y+=14){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke()}}
    if(gold){for(i=0;i<16;i++){x=r(20,W-20);y=r(34,100);var fl=pick([['#ffffff','#e5243b'],['#16d97d','#ffffff','#e5243b'],['#2b2bff','#ffc93c'],['#000000','#e5243b','#ffc93c']]);
      c.save();c.translate(x,y);c.rotate(r(-.25,.25));fl.forEach(function(cc,k){c.fillStyle=cc;c.fillRect(0,k*12/fl.length,20,12/fl.length)});c.restore()}}
    // jupitery
    if(ti>=1){var lc=night?'rgba(200,220,255,':gold?'rgba(255,230,160,':'rgba(255,250,220,',n=ti===1?1:ti===2?2:4;
      [[70,10],[W-70,10]].forEach(function(p){
        c.fillStyle='#1c2742';c.fillRect(p[0]-(ti===1?10:34),p[1]-6,ti===1?20:68,18);
        for(var a=0;a<n;a++){for(var b=0;b<2;b++){c.fillStyle='#fffbe6';c.beginPath();c.arc(p[0]-(n-1)*8+a*16,p[1]-1+b*8,3.2,0,TAU);c.fill()}}
        if(ti>=2){var lg=c.createRadialGradient(p[0],p[1],2,p[0],p[1],90);lg.addColorStop(0,lc+'.55)');lg.addColorStop(1,lc+'0)');c.fillStyle=lg;c.fillRect(p[0]-90,0,180,100)}
      })}
    if(ti>=2){var rg=c.createLinearGradient(0,0,0,26);rg.addColorStop(0,'#01040b');rg.addColorStop(1,'rgba(1,4,11,0)');c.fillStyle=rg;c.fillRect(0,0,W,26)}
  }
  /* --- murawa --- */
  var GR=[['#5f9c3d','#5f9c3d'],['#3f8f3f','#3a863a'],['#2a8f4a','#258244'],['#1c8a4b','#197c43'],['#146a3c','#115c34'],['#1f9a50','#1a8a47']][ti];
  for(y=152;y<H;y+=56){c.fillStyle=(Math.floor((y-152)/56)%2)?GR[1]:GR[0];c.fillRect(0,y,W,56)}
  if(ti===0){ // łysiny, piach, kępki
    for(i=0;i<26;i++){x=r(0,W);y=r(170,H);c.fillStyle='rgba(140,104,60,'+r(.25,.55)+')';ellipse(x,y,r(18,60),r(8,24));c.fill()}
    c.fillStyle='rgba(150,112,64,.6)';ellipse(360,H-60,120,60);c.fill();ellipse(360,236,70,30);c.fill();
    for(i=0;i<260;i++){x=r(0,W);y=r(160,H);c.fillStyle=R()<.5?'rgba(40,90,30,.5)':'rgba(150,200,90,.4)';c.fillRect(x,y,2,5)}
  }
  if(ti===1){for(i=0;i<10;i++){c.fillStyle='rgba(160,150,70,'+r(.12,.28)+')';ellipse(r(0,W),r(180,H),r(20,50),r(8,18));c.fill()}}
  if(ti===4){c.save();c.globalAlpha=.05;c.fillStyle='#ffffff';for(x=-H;x<W;x+=80){c.beginPath();c.moveTo(x,152);c.lineTo(x+40,152);c.lineTo(x+40+H,H+152);c.lineTo(x+H,H+152);c.fill()}c.restore()}
  if(ti===5){c.strokeStyle='rgba(255,255,255,.05)';c.lineWidth=18;for(var rad=60;rad<900;rad+=44){c.beginPath();c.arc(360,236,rad,0,PI);c.stroke()}}
  g=c.createLinearGradient(0,152,0,236);g.addColorStop(0,'rgba(0,0,0,'+(ti===0?.12:.34)+')');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,152,W,84);
  if(ti>=2){[[70,0],[W-70,0]].forEach(function(p){var lg=c.createRadialGradient(p[0],300,10,p[0],420,520);lg.addColorStop(0,night?'rgba(170,200,255,.12)':'rgba(255,255,230,.10)');lg.addColorStop(1,'rgba(255,255,230,0)');c.fillStyle=lg;c.fillRect(0,152,W,H-152)})}
  if(ti===0){g=c.createLinearGradient(0,152,W,H);g.addColorStop(0,'rgba(255,240,180,.12)');g.addColorStop(1,'rgba(255,240,180,0)');c.fillStyle=g;c.fillRect(0,152,W,H-152)}
  for(i=0;i<5200;i++){c.fillStyle=R()<.5?'rgba(0,0,0,.07)':'rgba(255,255,255,.035)';c.fillRect(r(0,W),r(152,H),1.2,1.2)}
  /* --- linie --- */
  var la=[.5,.72,.82,.85,.88,.9][ti];c.strokeStyle='rgba(255,255,255,'+la+')';c.fillStyle='rgba(255,255,255,'+la+')';c.lineWidth=ti===0?4:3.2;
  function ln(x1,y1,x2,y2){if(ti!==0){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();return}
    var n=Math.max(2,Math.round(Math.hypot(x2-x1,y2-y1)/24));c.beginPath();for(var k=0;k<=n;k++){var q=k/n,px=x1+(x2-x1)*q+r(-2,2),py=y1+(y2-y1)*q+r(-2,2);if(R()<.12){c.stroke();c.beginPath();c.moveTo(px,py);continue}k?c.lineTo(px,py):c.moveTo(px,py)}c.stroke()}
  ln(0,236,W,236);
  c.beginPath();c.arc(360,236,96,0,PI);c.stroke();c.beginPath();c.arc(360,236,5,0,TAU);c.fill();
  ln(128,H-165,592,H-165);ln(128,H-165,128,H);ln(592,H-165,592,H);
  ln(248,H-66,472,H-66);ln(248,H-66,248,H);ln(472,H-66,472,H);
  c.beginPath();c.arc(360,H-116,4.5,0,TAU);c.fill();c.beginPath();c.arc(360,H-116,78,PI*1.22,PI*1.78);c.stroke();
  c.beginPath();c.arc(0,236,22,0,PI/2);c.stroke();c.beginPath();c.arc(W,236,22,PI/2,PI);c.stroke();
  if(ti===4){c.fillStyle='rgba(255,255,255,.14)';for(i=0;i<8;i++){var a2=PI*(i+.5)/8;starPath2(c,360+Math.cos(a2)*66,236+Math.sin(a2)*66,9,3.8)}}
  if(ti===5){c.strokeStyle='rgba(255,201,60,.5)';c.lineWidth=4;c.beginPath();c.arc(360,236,110,0,PI);c.stroke()}
  var vg=c.createRadialGradient(W/2,H*.55,H*.3,W/2,H*.55,H*.82);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,ti===0?'rgba(0,20,0,.3)':night?'rgba(0,4,20,.65)':'rgba(0,8,20,.55)');
  c.fillStyle=vg;c.fillRect(0,0,W,H);
}
function starPath2(c,x,y,R,r0){c.beginPath();for(var i=0;i<10;i++){var a=-PI/2+i*PI/5,q=i%2?r0:R;c[i?'lineTo':'moveTo'](x+Math.cos(a)*q,y+Math.sin(a)*q)}c.closePath();c.fill()}
buildBg(3);

/* maska kropek do telebimu LED */
var dotPat=null;
(function(){var p=document.createElement('canvas');p.width=p.height=5;var c=p.getContext('2d');
  c.fillStyle='#02050c';c.fillRect(0,0,5,5);c.globalCompositeOperation='destination-out';c.beginPath();c.arc(2.5,2.5,1.75,0,TAU);c.fill();
  dotPat=ctx.createPattern(p,'repeat');})();
var LEDTXT='QASTROD.PL  •  PIOSENKI PIŁKARSKIE  •  ŁOWCA TALENTÓW  •  ';


/* ---------- stan meczu ---------- */
var S={st:'menu',lv:1,score:0,disp:0,time:25,el:0,combo:0,fever:0,fevers:0,fx:{},whistles:0,items:[],t:0,shake:0,hs:0,slow:0,zoom:0,
  spT:0,pwT:8,legT:30,endT:0,cd:0,hint:true,lastSec:-1,tpulse:0,tneg:0,ms:null,mood:null,reelT:0,crowd:0};
var hook={st:'swing',ph:0,a:0,len:L0,item:null,crank:0};
var floats=[],flyers=[],parts=[],flashes=[],booms=[];

/* misje */
function activeMis(){var a=[];for(var i=0;i<3;i++){var k=SV.mi+i;a.push({i:k,m:MIS[k%MIS.length],bonus:Math.floor(k/MIS.length)})}return a}
function misVal(m){return S.ms?S.ms[m[2]]||0:0}
function checkMis(){
  if(!S.ms)return;var loop=0;
  for(;loop<6;loop++){var a=activeMis(),hit=-1;for(var j=0;j<3;j++){if(misVal(a[j].m)>=a[j].m[3]){hit=j;break}}
    if(hit<0)break;var m=a[hit].m,rw=m[4]*(1+a[hit].bonus);
    // wykonana misja wypada, kolejne się przesuwają
    var ids=a.map(function(x){return x.i});ids.splice(hit,1);
    SV.mi++;SV.ps+=rw;S.psMis=(S.psMis||0)+rw;save();misPop(m[1],rw)}
}
function shout(h,cls){shoutEl.style.fontSize=h.length>12?'8.5cqw':'';shoutEl.textContent=h;shoutEl.className='lt-shout '+(cls||'');void shoutEl.offsetWidth;shoutEl.classList.add('on')}
var misT=0;function misPop(n,rw){misEl.innerHTML='<b>Misja wykonana!</b><span>'+n+'</span><i>+'+rw+' PS</i>';misEl.classList.add('on');sfx('card');clearTimeout(misT);misT=setTimeout(function(){misEl.classList.remove('on')},2600)}
function misHtml(){return '<div class="lt-miss">'+activeMis().map(function(a){var m=a.m,v=Math.min(misVal(m),m[3]),pc=Math.round(v/m[3]*100);return '<div><span>'+m[1]+'</span><b>+'+(m[4]*(1+a.bonus))+' PS</b><i style="--p:'+pc+'%"></i><em>'+(m[3]>=1000?num(v)+' / '+num(m[3]):v+' / '+m[3])+'</em></div>'}).join('')+'</div>'}
function toast(h){toastEl.innerHTML=h;toastEl.classList.remove('on');void toastEl.offsetWidth;toastEl.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(function(){toastEl.classList.remove('on')},1900)}

/* ---------- rozstawianie i dosypywanie ---------- */
function freeSpot(type,yMin,yMax){
  var t=T[type];
  for(var k=0;k<50;k++){
    var x=rnd(34+t.r,W-34-t.r),y=rnd(yMin,yMax),ok=true;
    for(var j=0;j<S.items.length;j++){var o=S.items[j];if(!o.caught&&Math.hypot(o.x-x,o.y-y)<o.r+t.r+14){ok=false;break}}
    if(ok&&Math.hypot(x-(W-74),y-(H-74))<t.r+66)ok=false;
    if(ok&&Math.abs(x-PIV.x)<60&&y<PITCH+150&&t.k!=='junk')ok=false;
    if(ok)return{x:x,y:y};
  }
  return null;
}
function mk(type,x,y,ex){
  var it={type:type,x:x,y:y,r:T[type].r,ph:Math.random()*TAU,col:pick(['#ff3d7f','#16d97d','#35c8ff','#ffc93c','#ff7a1a']),drop:0};
  if(ex)for(var q in ex)it[q]=ex[q];S.items.push(it);return it;
}
var TOP=PITCH+92,BOT=H-40;
function spawnStatic(type,drop,delay){
  var dep=T[type].v?Math.min(1,T[type].v/600):0,yMin=TOP+dep*(BOT-TOP)*.5,sp=freeSpot(type,yMin,BOT);if(!sp)return null;
  var ex={drop:drop?.5+(delay||0):0,dropD:delay||0};if(type==='pw')ex.pk=pick(Object.keys(PW));
  return mk(type,sp.x,sp.y,ex);
}
function spawnMover(type,fromEdge){
  var y0=type==='keeper'?H-140:TOP+80,y1=type==='keeper'?H-72:BOT-28;
  var sp=freeSpot(type,y0,y1);if(!sp)return null;
  var P=S.lv,v=(type==='dribbler'?rnd(95,130):type==='keeper'?rnd(45,70):type==='ref'?rnd(60,95):rnd(55,90))*(1+.07*(P-1));
  var dir=Math.random()<.5?-1:1,ex={vx:v*dir,ap:rnd(0,TAU),fs:dir,mode:'run',tt:rnd(1,2.5)};
  if(type==='keeper'){ex.x0=170;ex.x1=550}
  if(type!=='ref')ex.card=pickCardFor(type);
  var x=sp.x;if(fromEdge&&type!=='keeper'){x=dir>0?-24:W+24;ex.enter=1}
  return mk(type,x,sp.y,ex);
}
function want(){
  var P=S.lv;
  return{val:Math.max(5,9-Math.floor((P-1)/2)),junk:Math.min(10,3+P),bomb:P>=2?Math.min(3,1+Math.floor((P-2)/2)):0,
    runner:Math.min(3,1+Math.floor(P/2)),dribbler:P>=2?(P>=5?2:1):0,keeper:P>=3?1:0,ref:P>=2?Math.min(3,Math.floor(P/2)):0,bag:1};
}
function count(){
  var c={val:0,junk:0,bomb:0,runner:0,dribbler:0,keeper:0,ref:0,bag:0,pw:0};
  S.items.forEach(function(it){if(it.caught||it.leg)return;var k=T[it.type].k;
    if(MOVE[it.type])c[it.type]++;else if(k==='junk')c.junk++;else if(k==='bomb')c.bomb++;else if(k==='bag')c.bag++;else if(k==='pw')c.pw++;else c.val++});
  return c;
}
function pickVal(){
  var P=S.lv,w=[['goldS',26],['goldM',22],['goldB',8+P],['trophy',5+P],['medal',14],['star',4+P*.5],['boots',9],['ball',8]];
  var tot=w.reduce(function(a,b){return a+b[1]},0),r=Math.random()*tot;for(var i=0;i<w.length;i++){r-=w[i][1];if(r<=0)return w[i][0]}return 'goldS';
}
function refill(dt,instant){
  S.spT-=dt;if(S.spT>0&&!instant)return;
  var w=want(),c=count(),order=['val','runner','junk','dribbler','keeper','ref','bomb','bag'],done=false;
  for(var i=0;i<order.length;i++){var k=order[i];if(c[k]<w[k]){
    if(k==='val')spawnStatic(pickVal(),true,instant?rnd(0,.9):0);
    else if(k==='junk')spawnStatic(Math.random()<.6?'cone':'tire',true,instant?rnd(0,.9):0);
    else if(k==='bomb'||k==='bag')spawnStatic(k,true,instant?rnd(0,.9):0);
    else spawnMover(k,!instant);
    done=true;break}}
  if(S.st==='play'){S.pwT-=dt*(instant?0:1);if(S.pwT<=0&&c.pw<1){spawnStatic('pw',true);S.pwT=rnd(9,14)}}
  S.spT=done?.28:.1;
  return done;
}
function fillAll(){for(var g=0;g<60;g++){S.spT=0;if(!refill(0,true))break}}
function legendEvent(){
  var r=Math.random(),pool=[];CARDS.forEach(function(c,i){if(c[2]>=(r<.25?3:2)&&!LOOK[i].gk)pool.push(i)});
  var dir=Math.random()<.5?-1:1,y=rnd(TOP+140,BOT-80);
  mk('runner',dir>0?-30:W+30,y,{vx:175*dir,ap:0,fs:dir,mode:'run',tt:99,boost:1,card:pick(pool),leg:1,enter:1});
  shout('Gwiazda!','gold');sfx('cheer');S.crowd=S.t;
}

/* ---------- start / koniec ---------- */
function resetHook(){hook.st='swing';hook.len=L0;hook.item=null}
function tip(){return{x:PIV.x+Math.sin(hook.a)*hook.len,y:PIV.y+Math.cos(hook.a)*hook.len}}
function startRun(mode,L,cont){
  unlockAudio();
  S.won=false;S.mode=mode||'lvl';S.L=S.mode==='lvl'?clamp(L||Math.min(MAXL,SV.maxL+1),1,MAXL):0;S.goal=S.mode==='lvl'?goalOf(S.L):0;
  S.lv=S.mode==='lvl'?Math.min(9,1+Math.floor((S.L-1)/4)):1;S.score=0;S.disp=0;S.time=30+2*SV.up.time;S.el=0;S.combo=0;S.fever=0;S.fevers=0;S.fx={};var keepW=cont?S.whistles:SV.up.whistle;S.whistles=keepW;
  S.items=[];S.pwT=7;S.legT=rnd(28,36);S.hint=S.runsHere?false:true;S.lastSec=-1;S.psMis=0;S.mood=null;S.slow=0;S.hs=0;
  S.ms={score:0,cmax:0,sec:0,fever:0,tal:0,boom:0,gk:0,leg:0};
  floats=[];flyers=[];parts=[];booms=[];resetHook();hook.ph=0;
  fillAll();
  SV.runs++;save();hideOv();
  S.st='count';S.cd=2.4;S.cdLast=4;musStop();
  if(S.mode==='lvl'){SV.reach=Math.max(SV.reach||0,S.L);save();toast(tierOf(S.L)[0]+' &middot; '+lvName(S.L)+' &middot; cel '+num(S.goal))}
}
function valueOf(it){
  var t=T[it.type],v=t.v*(it.card!=null&&CARDS[it.card]?1+.35*CARDS[it.card][2]:1)*(it.leg?2:1);
  return Math.max(5,Math.round(v*(1+.05*SV.up.eye+.01*albumCount())*(1+.15*(S.lv-1))/5)*5);
}
function reelSpeed(it){
  var f=(S.fever>0?2:1)*(S.fx.iso>0?1.6:1);
  if(!it)return 1050*Math.min(1.5,f);
  var ew=1+(T[it.type].w-1)*.7;
  return Math.max(46,520*(1+.14*SV.up.arm)*f/ew);
}
function fire(){if(S.st!=='play'||hook.st!=='swing')return;hook.st='shoot';S.hint=false;S.runsHere=1;sfx('shoot')}
function useWhistle(){
  if(S.st!=='play')return;
  if(hook.st!=='reel'||!hook.item){if(S.whistles>0)toast('Gwizdek działa, gdy ciągniesz łup');return}
  if(S.whistles<=0){sfx('no');toast('Brak gwizdków');return}
  S.whistles--;var it=hook.item;hook.item=null;var wi=S.items.indexOf(it);if(wi>=0)S.items.splice(wi,1);
  burst(it.x,it.y,26,'conf');addFloat(it.x,it.y-20,'Puszczone!','#ffffff');sfx('whistle');
}
function endRun(){
  if(S.st!=='play')return;
  S.st='end';S.endT=1.5;S.slow=1.2;resetHook();if(hook.item){hook.item.caught=false;hook.item=null}
  musStop();sfx('final');shout('Koniec!','red');
}
function winLevel(){
  S.won=true;S.st='win';S.endT=1.7;S.slow=1.1;S.zoom=.05;musStop();sfx('rec');shout('Awans!','gold');burst(W/2,H*.45,140,'conf');S.crowd=S.t+2;S.mood={k:'happy',t:S.t+9};
  var st=S.time>=20?3:S.time>=10?2:1,prev=SV.lvS[S.L]||0,ps=3+S.L+(prev===0?5:0)+3*Math.max(0,st-prev);
  if(st>prev)SV.lvS[S.L]=st;SV.maxL=Math.max(SV.maxL,S.L);SV.ps+=ps;save();
  S.wStars=st;S.wPrev=prev;S.lastPs=ps;
}
function finishRun(){
  if(S.mode==='lvl'){S.st='over';S.newRec=S.L>=(SV.recL||0)&&S.L>1;SV.recL=Math.max(SV.recL||0,S.L);var fps=Math.round(S.score/400);SV.ps+=fps;save();S.lastPs=fps;sfx('lose');showFail();return}
  S.st='over';
  var rec=S.score>SV.best,prev=SV.best,ps=Math.round(S.score/300)+2;
  SV.ps+=ps;if(rec){SV.best=Math.round(S.score)}if(S.el>SV.bestT)SV.bestT=Math.round(S.el);save();
  S.lastPs=ps;S.rec=rec;S.prev=prev;
  if(rec){sfx('rec');burst(W/2,H*.4,120,'conf')}else sfx('lose');
  showOver();
}

/* ---------- efekty ---------- */
function addFloat(x,y,txt,col,big){floats.push({x:x,y:y,txt:txt,col:col||'#ffc93c',t:0,life:1.2,big:!!big})}
function burst(x,y,n,kind,col){
  for(var i=0;i<n;i++){var a=rnd(0,TAU),s=rnd(90,kind==='conf'?420:260);
    parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-(kind==='conf'?160:60),t:0,life:rnd(.6,1.3),kind:kind,
      col:col||pick(kind==='conf'?['#2b2bff','#16d97d','#ffc93c','#ffffff','#ff4d6d','#35c8ff']:['#fff3b0','#ffc93c','#ffe27a']),
      sz:rnd(3,kind==='conf'?8:4),rot:rnd(0,TAU),vr:rnd(-12,12)})}
  if(parts.length>600)parts.splice(0,parts.length-600);
}
function explode(b){
  var idx=S.items.indexOf(b);if(idx<0)return;S.items.splice(idx,1);
  S.shake=Math.max(S.shake,16);S.zoom=.035;sfx('boom');burst(b.x,b.y,60,'conf');burst(b.x,b.y,20,'spark','#ffffff');S.mood={k:'wow',t:S.t};
  booms.push({x:b.x,y:b.y,t:0});var chain=[];
  S.items=S.items.filter(function(o){
    if(o.caught)return true;
    if(Math.hypot(o.x-b.x,o.y-b.y)<125+o.r){if(o.type==='bomb'){chain.push(o);return true}burst(o.x,o.y,10,'conf');if(S.ms)S.ms.boom++;return false}
    return true});
  chain.forEach(function(c){setTimeout(function(){explode(c)},130)});
  checkMis();
}
function addTime(s,x,y){
  if(!s)return;S.time=Math.max(0,S.time+s);
  if(s>0){S.tpulse=.5;floats.push({x:W-100,y:130,txt:'+'+s.toFixed(1).replace('.',',')+' s',col:'#16d97d',t:0,life:1,big:false});if(s>=2)sfx('time')}
  else{S.tneg=.5;floats.push({x:W-100,y:130,txt:s.toFixed(1).replace('.',',')+' s',col:'#ff4d6d',t:0,life:1,big:false})}
}
function addMoney(v,x,y,label){
  S.score+=v;if(S.ms){S.ms.score=S.score}
  if(S.mode==='lvl'&&S.st==='play'&&S.score>=S.goal)winLevel();
  addFloat(x,y,label||('+'+num(v)),'#ffc93c',v>=600);flyers.push({x0:x,y0:y,t:0,d:.5});checkMis();
}
function startFever(){
  S.fever=7;S.fevers++;if(S.ms)S.ms.fever=S.fevers;S.slow=.45;S.zoom=.05;sfx('fever');S.crowd=S.t+6;
  shout('Szał kibiców!','gold');burst(W/2,H*.45,90,'conf');checkMis();
}

/* ---------- łapanie ---------- */
function collect(it){
  var t=T[it.type],x=PIV.x,y=PIV.y+30,ms=S.ms;
  if(it.type==='bag'){
    var r=Math.random();
    if(r>.7){var v=Math.round(rnd(300,900)*(1+.15*(S.lv-1))/5)*5;addMoney(v,x,y,'Skarb! +'+num(v));sfx('big');S.mood={k:'happy',t:S.t};burst(x,y,30,'spark')}
    else{givePw(pick(Object.keys(PW)),x,y)}
    return;
  }
  if(it.type==='pw'){givePw(it.pk,x,y);return}
  if(it.type==='ref'){S.combo=0;addTime(-5);addFloat(x,y,'Żółta kartka!','#ffd400',true);sfx('whistle');S.mood={k:'sad',t:S.t};S.shake=8;return}
  var tb=t.tb*(1+.08*SV.up.tbu)*Math.max(.55,1-.05*(S.lv-1));
  if(t.k==='junk'){if(S.combo>=2)addFloat(x,y+50,'Seria przerwana','#a9bee3');S.combo=0;S.mood={k:'sad',t:S.t};sfx('junk');addTime(t.tb);addMoney(valueOf(it),x,y);return}
  S.combo++;ms.cmax=Math.max(ms.cmax,S.combo);
  if(MOVE[it.type])ms.tal++;if(it.type==='keeper')ms.gk++;if(it.leg)ms.leg++;
  var mult=Math.min(3,1+.25*(S.combo-1))*(S.fever>0?2:1);
  var val=Math.round(valueOf(it)*mult/5)*5;
  addMoney(val,x,y,'+'+num(val)+(mult>1?'  x'+(Math.round(mult*100)/100).toString().replace('.',','):''));
  addTime(tb+(S.combo>=3?Math.min(2,.25*(S.combo-2)):0));
  S.hs=.055;
  if(val>=600){sfx('big');sfx('cheer');burst(x,y,26,'spark');S.mood={k:'happy',t:S.t};S.crowd=S.t;S.zoom=.025;S.shake=Math.max(S.shake,5)}
  else{sfx('coin');if(val>=200)S.mood={k:'happy',t:S.t}}
  if(S.combo>=2){var sh=S.combo===3?'Hat-trick!':S.combo>=12?'Legenda!':S.combo>=8?'Kosmos!':'x'+S.combo;if(S.combo%5!==0)shout(sh)}
  if(S.combo%5===0)startFever();
  if(it.type==='star'&&Math.random()<.35)rollCard(x,y);
  if(it.card!=null&&CARDS[it.card])giveCard(it.card,x,y);
  checkMis();
}
function givePw(k,x,y){
  if(k==='laser'){S.fx.laser=(S.fx.laser>0?S.fx.laser:0)+12}
  else if(k==='iso'){S.fx.iso=(S.fx.iso>0?S.fx.iso:0)+10}
  else if(k==='clock'){addTime(5)}
  else if(k==='whistle'){S.whistles++}
  addFloat(x,y,PW[k][0]+'!',PW[k][1],true);sfx('buy');
}
function rollCard(x,y){
  var r=Math.random(),rar=r<.6?0:r<.88?1:r<.98?2:3,pool=[];
  CARDS.forEach(function(c,i){if(c[2]===rar)pool.push(i)});giveCard(pick(pool),x,y);
}

/* ---------- pętla ---------- */
function update(rdt){
  S.t+=rdt;
  if(S.hs>0){S.hs-=rdt;return}
  var dt=rdt;if(S.slow>0){S.slow-=rdt;dt*=.35}
  if(S.shake>0)S.shake=Math.max(0,S.shake-rdt*40);
  if(S.zoom>0)S.zoom=Math.max(0,S.zoom-rdt*.12);
  if(S.tpulse>0)S.tpulse-=rdt;if(S.tneg>0)S.tneg-=rdt;
  S.disp+=(S.score-S.disp)*Math.min(1,rdt*8);if(Math.abs(S.score-S.disp)<1)S.disp=S.score;
  var playing=S.st==='play';
  if(S.st==='count'){S.cd-=rdt;var c=Math.ceil(S.cd/.8);if(c!==S.cdLast&&c>=1&&c<=3){S.cdLast=c;shout(String(c),'num');sfx('beep')}
    if(S.cd<=0){S.st='play';shout('Gramy!','gold');sfx('go');sfx('whistle');musStart()}}
  if(S.st==='end'){S.endT-=rdt;if(S.endT<=0)finishRun()}
  if(S.st==='win'){S.endT-=rdt;if(S.endT<=0){S.st='over';showWin()}}
  // faza meczu
  if(playing){S.el+=dt;var P=1+Math.floor(S.el/20);if(S.mode==='inf'&&P!==S.lv){S.lv=P;shout('Faza '+P,'blue');sfx('whistle')}}
  // hak
  var swing=2.3+.16*Math.min(8,S.lv-1);
  if(hook.st==='swing'){if(S.st!=='pause'&&!window.__ltFreeze){hook.ph+=dt*swing;hook.a=Math.sin(hook.ph)*1.24}}
  else if(playing&&hook.st==='shoot'){
    hook.len+=640*(1+.12*SV.up.hook)*(S.fever>0?1.5:1)*dt;var p=tip();
    for(var i=0;i<S.items.length;i++){var it=S.items[i];if(it.drop>0||it.caught)continue;
      if(Math.hypot(it.x-p.x,it.y-p.y)<it.r+9){
        if(it.type==='bomb'){explode(it);hook.st='reel';hook.item=null}
        else{hook.item=it;it.caught=true;hook.st='reel';sfx('grab');if(it.leg||(it.card!=null&&CARDS[it.card][2]>=2)){S.slow=.5;S.zoom=.04}}
        break}}
    if(hook.st==='shoot'&&(p.x<6||p.x>W-6||p.y>H-6))hook.st='reel';
  }else if(playing&&hook.st==='reel'){
    hook.len-=reelSpeed(hook.item)*dt;hook.crank+=dt*(hook.item?9:22);
    S.reelT+=dt;if(S.reelT>.09){S.reelT=0;sfx('reel')}
    if(hook.item){var q=tip(),dx=Math.sin(hook.a),dy=Math.cos(hook.a);hook.item.x=q.x+dx*hook.item.r*.62;hook.item.y=q.y+dy*hook.item.r*.62}
    if(hook.len<=L0){hook.len=L0;var got=hook.item;hook.st='swing';hook.item=null;
      if(got){var k=S.items.indexOf(got);if(k>=0)S.items.splice(k,1);collect(got)}
      else if(S.combo>0){if(S.combo>=2)addFloat(PIV.x,PIV.y+40,'Pudło! Seria przerwana','#a9bee3');S.combo=0}}
  }
  // spadające przedmioty
  S.items.forEach(function(it){if(it.drop>0){if(it.dropD>0)it.dropD-=dt;else{it.drop-=dt;if(it.drop<=0){it.drop=0;burst(it.x,it.y+it.r*.8,6,'spark','rgba(220,240,200,.8)')}}}});
  // ruch piłkarzy
  if(playing||S.st==='count')S.items.forEach(function(it){if(!MOVE[it.type]||it.caught)return;
    it.tt=(it.tt||rnd(1,2.5))-dt;
    if(it.tt<=0&&!it.leg){var q=Math.random();it.mode='run';it.boost=1;it.tt=rnd(1.2,3);
      if(it.type==='runner'&&q<.2){it.mode='jug';it.tt=rnd(1.2,2)}
      else if(it.type==='keeper'&&q<.35){it.mode='ready';it.tt=rnd(.8,1.6)}
      else if(it.type==='ref'&&q<.25){it.cardUp=1.2}
      else{if(q<.45&&!it.enter)it.vx*=-1;if(q>.72)it.boost=1.9}}
    if(it.cardUp>0)it.cardUp-=dt;
    var fsT=it.vx<0?-1:1;it.fs=(it.fs||fsT)+(fsT-(it.fs||fsT))*Math.min(1,dt*10);if(Math.abs(it.fs)<.15)it.fs=it.fs<0?-.15:.15;
    var mvv=(it.mode==='jug'||it.mode==='ready')?0:it.vx*(it.boost||1)*(it.cardUp>0?.2:1);
    it.x+=mvv*dt;it.ap=(it.ap||0)+Math.abs(mvv)*dt/(it.type==='keeper'?5:6.5);
    var x0=it.x0||40,x1=it.x1||W-40;
    if(it.leg){if(it.x<-50||it.x>W+50)it.gone=1;return}
    if(it.enter){if(it.x>x0&&it.x<x1)it.enter=0;return}
    if(it.x<x0){it.x=x0;it.vx=Math.abs(it.vx)}if(it.x>x1){it.x=x1;it.vx=-Math.abs(it.vx)}
    if(it.boost>1&&Math.random()<dt*14)parts.push({x:it.x-Math.sign(it.vx)*8,y:it.y+22,vx:-it.vx*.3,vy:-30,t:0,life:.4,kind:'spark',col:'rgba(220,240,200,.7)',sz:3,rot:0,vr:0});});
  S.items=S.items.filter(function(it){return !it.gone});
  if(playing){
    refill(dt,false);
    S.legT-=dt;if(S.legT<=0){legendEvent();S.legT=rnd(30,42)}
    if(S.fx.laser>0)S.fx.laser-=dt;if(S.fx.iso>0)S.fx.iso-=dt;
    if(S.fever>0){S.fever-=dt;if(S.fever<=0){S.fever=0;0}}
    else S.time-=dt;
    var sec=Math.floor(S.el);if(sec!==S.lastSec){S.lastSec=sec;S.ms.sec=sec;checkMis();if(S.time<=5&&S.time>0&&S.fever<=0)sfx('heart')}
    if(S.time<=0){S.time=0;endRun()}
    if(DEBUG&&window.__ltBot&&hook.st==='swing'){var bh=rayHit();if(bh&&bh.type!=='bomb'&&bh.type!=='ref'&&T[bh.type].k!=='junk'&&Math.random()<dt*(window.__ltBot||6))fire();else if(Math.random()<dt*.15)fire()}
  }
  parts.forEach(function(p){p.t+=dt;p.vy+=(p.kind==='conf'?520:380)*dt;p.vx*=.985;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt});
  parts=parts.filter(function(p){return p.t<p.life});
  floats.forEach(function(f){f.t+=rdt});floats=floats.filter(function(f){return f.t<f.life});
  flyers.forEach(function(f){f.t+=rdt});flyers=flyers.filter(function(f){return f.t<f.d});
  booms.forEach(function(b){b.t+=dt});booms=booms.filter(function(b){return b.t<.45});
  var cr=(S.crowd&&S.t-S.crowd<1.3)||S.fever>0;
  if(Math.random()<rdt*(cr?70:5))flashes.push({x:rnd(10,W-10),y:rnd(34,110),t:0});
  flashes.forEach(function(f){f.t+=rdt});flashes=flashes.filter(function(f){return f.t<.16});
}

/* ---------- rysowanie obiektów ---------- */
function ball(x,y,r,gold,tw){
  var g=ctx.createRadialGradient(x-r*.35,y-r*.42,r*.08,x,y,r);
  if(gold){g.addColorStop(0,'#fff7cc');g.addColorStop(.45,'#ffc93c');g.addColorStop(1,'#9b6200')}
  else{g.addColorStop(0,'#ffffff');g.addColorStop(.6,'#e2e8f2');g.addColorStop(1,'#8d99ae')}
  ctx.fillStyle=g;circ(x,y,r);ctx.fill();
  ctx.save();circ(x,y,r);ctx.clip();
  var pc=gold?'rgba(125,72,0,.72)':'#1b2233';ctx.fillStyle=pc;
  poly(x,y,r*.34,5,-PI/2);ctx.fill();
  ctx.strokeStyle=pc;ctx.lineWidth=Math.max(1,r*.06);
  for(var i=0;i<5;i++){var a=-PI/2+i*TAU/5;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r*.34,y+Math.sin(a)*r*.34);ctx.lineTo(x+Math.cos(a)*r*.72,y+Math.sin(a)*r*.72);ctx.stroke();
    var b=a+PI/5;poly(x+Math.cos(b)*r*1.02,y+Math.sin(b)*r*1.02,r*.38,5,b+PI);ctx.fill()}
  var hg=ctx.createRadialGradient(x-r*.4,y-r*.45,0,x-r*.4,y-r*.45,r*.7);hg.addColorStop(0,'rgba(255,255,255,.75)');hg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=hg;ctx.fillRect(x-r,y-r,r*2,r*2);
  ctx.restore();
  ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1.5;circ(x,y,r);ctx.stroke();
  if(gold&&tw!==undefined){var s=Math.max(0,Math.sin(tw*2.2));if(s>.6){var k=(s-.6)/.4;ctx.fillStyle='rgba(255,255,255,'+k+')';starPath(x+r*.45,y-r*.5,r*.42*k+2,1.2,-PI/2);ctx.fill()}}
}
function trophy(x,y,r){
  var s=r/30;ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  var g=ctx.createLinearGradient(-22,0,22,0);g.addColorStop(0,'#8a5a00');g.addColorStop(.35,'#ffd65a');g.addColorStop(.5,'#fff3b8');g.addColorStop(.7,'#ffc93c');g.addColorStop(1,'#8a5a00');
  ctx.strokeStyle='#e0a820';ctx.lineWidth=5;
  ctx.beginPath();ctx.arc(-19,-15,9,-PI/2,PI/2,true);ctx.stroke();
  ctx.beginPath();ctx.arc(19,-15,9,-PI/2,PI/2,false);ctx.stroke();
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-20,-27);ctx.lineTo(20,-27);ctx.quadraticCurveTo(20,4,4,8);ctx.lineTo(-4,8);ctx.quadraticCurveTo(-20,4,-20,-27);ctx.closePath();ctx.fill();
  ctx.fillRect(-4,7,8,10);
  ctx.fillStyle='#fff8d6';ctx.beginPath();ctx.ellipse(0,-27,20,4,0,0,TAU);ctx.fill();
  ctx.fillStyle='#3a2410';rr(-15,16,30,12,3);ctx.fill();
  ctx.fillStyle='#ffc93c';ctx.fillRect(-8,19,16,5);
  ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(-12,-22,4,18);
  ctx.restore();
}
function medal(x,y,r){
  ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(x-r*.95,y-r*1.7);ctx.lineTo(x-r*.15,y-r*1.7);ctx.lineTo(x+r*.2,y-r*.5);ctx.lineTo(x-r*.35,y-r*.5);ctx.closePath();ctx.fill();
  ctx.fillStyle='#e5243b';ctx.beginPath();ctx.moveTo(x+r*.95,y-r*1.7);ctx.lineTo(x+r*.15,y-r*1.7);ctx.lineTo(x-r*.2,y-r*.5);ctx.lineTo(x+r*.35,y-r*.5);ctx.closePath();ctx.fill();
  var g=ctx.createRadialGradient(x-r*.3,y-r*.3,1,x,y,r);g.addColorStop(0,'#fff3b8');g.addColorStop(.55,'#ffc93c');g.addColorStop(1,'#9b6200');
  ctx.fillStyle=g;circ(x,y,r*.9);ctx.fill();ctx.strokeStyle='#8a5a00';ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle='#b27a00';starPath(x,y,r*.48,r*.2,-PI/2);ctx.fill();
}
function star(x,y,r,t){
  var p=1+Math.sin(t*4)*.08;
  var g=ctx.createRadialGradient(x,y,1,x,y,r*2.2);g.addColorStop(0,'rgba(126,249,255,.55)');g.addColorStop(1,'rgba(126,249,255,0)');
  ctx.fillStyle=g;circ(x,y,r*2.2);ctx.fill();
  var sg=ctx.createLinearGradient(x,y-r,x,y+r);sg.addColorStop(0,'#ffffff');sg.addColorStop(1,'#7ef9ff');
  ctx.fillStyle=sg;starPath(x,y,r*1.15*p,r*.5*p,-PI/2+Math.sin(t)*.1);ctx.fill();
  ctx.strokeStyle='#15a9cc';ctx.lineWidth=2;ctx.stroke();
}
function boots(x,y,r,col){
  var s=r/22;ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(-20,6);ctx.lineTo(-20,-7);ctx.quadraticCurveTo(-19,-15,-10,-15);ctx.lineTo(-4,-15);ctx.lineTo(0,-7);
  ctx.quadraticCurveTo(12,-5,19,0);ctx.quadraticCurveTo(23,4,20,7);ctx.closePath();ctx.fill();
  ctx.fillStyle='#10131a';ctx.fillRect(-20,5,40,4);
  for(var i=0;i<4;i++)ctx.fillRect(-16+i*10,9,4,4);
  ctx.strokeStyle='#ffffff';ctx.lineWidth=1.6;for(i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-2+i*4,-6+i*.5);ctx.lineTo(1+i*4,-3+i*.5);ctx.stroke()}
  ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(-17,-10,3,12);
  ctx.restore();
}
function cone(x,y,r){
  var s=r/22;ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  var g=ctx.createLinearGradient(-16,0,16,0);g.addColorStop(0,'#c24a00');g.addColorStop(.45,'#ff8a2a');g.addColorStop(1,'#b33f00');
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-3,-22);ctx.lineTo(3,-22);ctx.lineTo(15,13);ctx.lineTo(-15,13);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f4f6fb';ctx.beginPath();ctx.moveTo(-8.5,-5);ctx.lineTo(8.5,-5);ctx.lineTo(10.6,1);ctx.lineTo(-10.6,1);ctx.closePath();ctx.fill();
  ctx.fillStyle='#d4570a';rr(-21,12,42,7,3);ctx.fill();
  ctx.restore();
}
function tire(x,y,r){
  ctx.fillStyle='#24272e';ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.arc(x,y,r*.5,0,TAU,true);ctx.fill();
  ctx.strokeStyle='#444a56';ctx.lineWidth=3;
  for(var i=0;i<16;i++){var a=i*TAU/16;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r*.8,y+Math.sin(a)*r*.8);ctx.lineTo(x+Math.cos(a)*r*.97,y+Math.sin(a)*r*.97);ctx.stroke()}
  ctx.strokeStyle='rgba(255,255,255,.14)';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,y,r*.72,PI*1.1,PI*1.6);ctx.stroke();
  ctx.strokeStyle='#15171c';ctx.lineWidth=2;circ(x,y,r*.5);ctx.stroke();
}
function bag(x,y,r){
  var s=r/21;ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.strokeStyle='#0a1430';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-12,10,PI,0);ctx.stroke();
  var g=ctx.createLinearGradient(0,-13,0,15);g.addColorStop(0,'#2a47a3');g.addColorStop(1,'#132657');
  ctx.fillStyle=g;rr(-23,-13,46,28,9);ctx.fill();
  ctx.fillStyle='#2b2bff';ctx.fillRect(-23,3,46,4);
  ctx.fillStyle='#ffc93c';ctx.font='700 22px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('?',0,-3);
  ctx.restore();
}
function rayHit(){
  var dx=Math.sin(hook.a),dy=Math.cos(hook.a);
  for(var d=L0;d<1400;d+=5){var x=PIV.x+dx*d,y=PIV.y+dy*d;if(x<6||x>W-6||y>H-6)return null;
    for(var i=0;i<S.items.length;i++){var it=S.items[i];if(!it.caught&&Math.hypot(it.x-x,it.y-y)<it.r+9){it._rd=d;return it}}}
  return null;
}
function drawLaser(){
  var dx=Math.sin(hook.a),dy=Math.cos(hook.a),h=rayHit(),d=h?h._rd:0;
  if(!h){d=L0;while(d<1400){var x=PIV.x+dx*d,y=PIV.y+dy*d;if(x<6||x>W-6||y>H-6)break;d+=5}}
  var ex=PIV.x+dx*d,ey=PIV.y+dy*d,sx=PIV.x+dx*(L0+22),sy=PIV.y+dy*(L0+22);
  var bad=h&&(h.type==='bomb'||h.type==='ref'||T[h.type].k==='junk'),col=bad?'255,77,109':'22,255,140';
  ctx.save();ctx.lineCap='round';
  ctx.strokeStyle='rgba('+col+',.22)';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
  ctx.strokeStyle='rgba('+col+',.95)';ctx.lineWidth=3;ctx.setLineDash([14,9]);ctx.lineDashOffset=-S.t*60;ctx.stroke();
  ctx.setLineDash([]);
  if(h){var pr=h.r+12+Math.sin(S.t*8)*3;ctx.strokeStyle='rgba('+col+',1)';ctx.lineWidth=3;circ(h.x,h.y,pr);ctx.stroke();
    ctx.lineWidth=2.5;for(var k=0;k<4;k++){var a=k*PI/2+S.t*1.5;ctx.beginPath();ctx.moveTo(h.x+Math.cos(a)*(pr+2),h.y+Math.sin(a)*(pr+2));ctx.lineTo(h.x+Math.cos(a)*(pr+10),h.y+Math.sin(a)*(pr+10));ctx.stroke()}
    ctx.font='700 15px Barlow, Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    var lab=h.card!=null&&CARDS[h.card]?CARDS[h.card][0]:T[h.type].v?'+'+num(valueOf(h)):T[h.type].n;ctx.lineWidth=4;ctx.strokeStyle='rgba(6,14,32,.9)';ctx.strokeText(lab,h.x,h.y-pr-14);ctx.fillStyle='rgb('+col+')';ctx.fillText(lab,h.x,h.y-pr-14)}
  else{ctx.fillStyle='rgba('+col+',.9)';circ(ex,ey,5);ctx.fill()}
  ctx.restore();
}
/* wygląd każdego talentu z albumu: skóra, włosy, fryzura, koszulka, pasek, oczy */
var LOOK=[
 {sk:'#f3c7a0',hc:'#4a2c17',hs:0,sh:'#e5243b',st:'#ffffff',ey:'#5a3a1a'},
 {sk:'#e0ac80',hc:'#1b1208',hs:3,sh:'#c6ff00',st:null,ey:'#3b2412',gk:1},
 {sk:'#f3c7a0',hc:'#c98b3a',hs:1,sh:'#2b2bff',st:null,ey:'#2f6fbf'},
 {sk:'#9a6440',hc:'#1b1208',hs:5,sh:'#ffc93c',st:'#0d1c38',ey:'#3b2412'},
 {sk:'#c68a5c',hc:'#2b1a0e',hs:4,sh:'#ff7a1a',st:null,ey:'#3b2412'},
 {sk:'#f6d2b0',hc:'#e7c46a',hs:0,sh:'#16d97d',st:'#ffffff',ey:'#3f8f5a'},
 {sk:'#e0ac80',hc:'#7a3b1a',hs:2,sh:'#ffffff',st:'#2b2bff',ey:'#5a3a1a'},
 {sk:'#6e4529',hc:'#140c05',hs:1,sh:'#e5243b',st:null,ey:'#2a170b'},
 {sk:'#f3c7a0',hc:'#1b1208',hs:4,sh:'#35c8ff',st:'#ffffff',ey:'#2f6fbf'},
 {sk:'#c68a5c',hc:'#4a2c17',hs:0,sh:'#8a2be2',st:null,ey:'#3b2412'},
 {sk:'#f6d2b0',hc:'#c98b3a',hs:2,sh:'#0d1c38',st:'#ffc93c',ey:'#3f8f5a'},
 {sk:'#9a6440',hc:'#140c05',hs:3,sh:'#16d97d',st:'#0d1c38',ey:'#2a170b'},
 {sk:'#e0ac80',hc:'#1b1208',hs:4,sh:'#ffffff',st:'#e5243b',ey:'#5a3a1a'},
 {sk:'#6e4529',hc:'#140c05',hs:5,sh:'#2b2bff',st:'#ffffff',ey:'#2a170b'},
 {sk:'#f3c7a0',hc:'#e7c46a',hs:1,sh:'#ff7a1a',st:null,ey:'#2f6fbf',gk:1},
 {sk:'#c68a5c',hc:'#1b1208',hs:0,sh:'#ffc93c',st:'#ffffff',ey:'#3b2412',lg:1}];
var REFLOOK={sk:'#e0ac80',hc:'#1b1208',hs:3,sh:'#15171d',st:null,ey:'#3b2412'};
var RCOL=['#dfe7f5','#5ff5ad','#c7a4ff','#ffc93c'];
function pickCardFor(ty){
  var r=Math.random(),rar;
  if(ty==='keeper'){return r<.8?1:14}
  if(ty==='dribbler')rar=r<.45?1:r<.9?2:3; else rar=r<.64?0:r<.92?1:r<.985?2:3;
  var pool=[];CARDS.forEach(function(c,i){if(c[2]===rar&&!LOOK[i].gk)pool.push(i)});
  return pick(pool);
}
function giveCard(ci,x,y){
  var c=CARDS[ci];
  if(SV.album.indexOf(ci)>=0){var v=Math.round(80*(c[2]+1)*(1+.06*(S.lv-1))/5)*5;addMoney(v,x,y-44,c[0]+': duplikat +'+fmt(v))}
  else{SV.album.push(ci);save();showCard(ci);sfx('card');S.mood={k:'happy',t:S.t}}
}

/* ---- fryzura (widok z boku, twarz w stronę +x) ---- */
function hairSide(L,hx,hy,t){
  ctx.fillStyle=L.hc;
  switch(L.hs){
    case 0:ctx.beginPath();ctx.arc(hx,hy,8,PI*.95,PI*2.05);ctx.lineTo(hx+7,hy-2);ctx.quadraticCurveTo(hx+2,hy-5,hx-3,hy-3);ctx.lineTo(hx-7.5,hy+2);ctx.closePath();ctx.fill();break;
    case 1:ctx.beginPath();ctx.arc(hx,hy,7.9,PI,PI*2);ctx.fill();[-5,-1.5,2,5].forEach(function(o){circ(hx+o,hy-6.5,3.2);ctx.fill()});break;
    case 2:ctx.beginPath();ctx.arc(hx,hy,8,PI*.9,PI*2);ctx.fill();var sw=Math.sin(t*10)*2;ctx.beginPath();ctx.moveTo(hx-6,hy-3);ctx.quadraticCurveTo(hx-13,hy+1+sw,hx-11,hy+8+sw);ctx.quadraticCurveTo(hx-8,hy+3,hx-5,hy+1);ctx.fill();break;
    case 3:ctx.globalAlpha=.85;ctx.beginPath();ctx.arc(hx,hy,7.8,PI*1.02,PI*1.98);ctx.fill();ctx.globalAlpha=1;break;
    case 4:ctx.beginPath();ctx.arc(hx,hy,7.6,PI*1.05,PI*1.95);ctx.fill();ctx.beginPath();ctx.moveTo(hx-5,hy-6);ctx.lineTo(hx-3,hy-13);ctx.lineTo(hx-1,hy-7);ctx.lineTo(hx+1,hy-14);ctx.lineTo(hx+3,hy-7);ctx.lineTo(hx+5,hy-12);ctx.lineTo(hx+6,hy-5);ctx.closePath();ctx.fill();break;
    case 5:circ(hx-1.5,hy-3,10.5);ctx.fill();break;
  }
}
/* ---- noga: udo, kolano, łydka w getrze, but ---- */
function limbLeg(hx,hy,thigh,bend,L,sock,shorts){
  var kx=hx+Math.sin(thigh)*8,ky=hy+Math.cos(thigh)*8,sa=thigh-bend,fx=kx+Math.sin(sa)*8.5,fy=ky+Math.cos(sa)*8.5;
  ctx.strokeStyle=L.sk;ctx.lineWidth=4.4;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(kx,ky);ctx.stroke();
  ctx.strokeStyle=shorts;ctx.lineWidth=5.2;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+Math.sin(thigh)*3.5,hy+Math.cos(thigh)*3.5);ctx.stroke();
  ctx.strokeStyle=sock;ctx.lineWidth=4.2;ctx.beginPath();ctx.moveTo(kx+Math.sin(sa)*2,ky+Math.cos(sa)*2);ctx.lineTo(fx,fy);ctx.stroke();
  ctx.save();ctx.translate(fx,fy);ctx.rotate(-sa*.5);ctx.fillStyle='#10131a';rr(-2.5,-2,8.5,4.2,2);ctx.fill();ctx.fillStyle='#ffffff';ctx.fillRect(0,1.4,5,.9);ctx.restore();
  return{x:fx,y:fy};
}
function limbArm(sx,sy,up,bend,L,sleeve,glove){
  var ex=sx+Math.sin(up)*6.5,ey=sy+Math.cos(up)*6.5,fa=up+bend,hx=ex+Math.sin(fa)*6,hy=ey+Math.cos(fa)*6;
  ctx.strokeStyle=L.sk;ctx.lineWidth=3.6;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.lineTo(hx,hy);ctx.stroke();
  ctx.strokeStyle=sleeve;ctx.lineWidth=4.6;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+Math.sin(up)*(glove?6.5:3.2),sy+Math.cos(up)*(glove?6.5:3.2));if(glove)ctx.lineTo(hx,hy);ctx.stroke();
  if(glove){ctx.fillStyle='#ffffff';circ(hx,hy,3.6);ctx.fill();ctx.fillStyle='#16d97d';circ(hx,hy,1.8);ctx.fill()}
  else{ctx.fillStyle=L.sk;circ(hx,hy,2);ctx.fill()}
  return{x:hx,y:hy};
}
function player(it,t){
  var ty=it.type,L=ty==='ref'?REFLOOK:LOOK[it.card]||LOOK[0],caught=!!it.caught,mode=caught?'fly':(it.mode||'run');
  var p=it.ap||0,sp=it.boost||1,fs=it.fs||1,sc=ty==='keeper'?1.55:1.45;
  var shirt=L.sh,shorts=ty==='ref'?'#15171d':(shirt==='#ffffff'?'#0d1c38':'#ffffff'),sock=ty==='ref'?'#15171d':shirt;
  var amp=ty==='ref'?.55:ty==='keeper'?.6:.8*Math.min(1.25,sp),bob=0,lean=0;
  if(mode==='run'){bob=-Math.abs(Math.cos(p))*2.3*Math.min(1.3,sp);lean=ty==='ref'?.05:.1+.08*(sp-1)}
  if(mode==='jug'||mode==='ready')bob=-Math.abs(Math.sin(t*3))*1;
  ctx.save();ctx.translate(it.x,it.y);ctx.scale(sc*fs,sc);ctx.lineCap='round';ctx.lineJoin='round';
  var hipX=0,hipY=5+bob;
  // kąty kończyn zależnie od trybu
  var lA,lB,bA,bB,aA,aB,abA=.9,abB=.9,glove=!!L.gk||ty==='keeper';
  if(mode==='run'){lA=Math.sin(p)*amp;lB=Math.sin(p+PI)*amp;bA=.2+1.25*Math.max(0,Math.cos(p));bB=.2+1.25*Math.max(0,Math.cos(p+PI));aA=Math.sin(p+PI)*amp*.9;aB=Math.sin(p)*amp*.9;
    if(ty==='keeper'){aA=-1.2+Math.sin(p)*.25;aB=-1.3-Math.sin(p)*.25;abA=abB=.3}}
  else if(mode==='jug'){var k=Math.max(0,Math.sin(t*6));lA=-.1+k*1.1;bA=.3+k*.5;lB=-.08;bB=.1;aA=-.5;aB=.6;abA=abB=.6}
  else if(mode==='ready'){lA=.28;lB=-.28;bA=bB=.45;aA=-1.25+Math.sin(t*4)*.15;aB=-1.35-Math.sin(t*4)*.15;abA=abB=.3}
  else{var f=t*22;lA=Math.sin(f)*.5;lB=-Math.sin(f)*.5;bA=bB=.7;aA=PI*.85+Math.sin(f)*.3;aB=PI*.95-Math.sin(f)*.3;abA=abB=.3}
  if(ty==='ref'&&it.cardUp>0){aA=PI*.95;abA=.1}
  // tylna noga i ręka (ciemniejsze)
  ctx.globalAlpha=.9;
  limbLeg(hipX-1,hipY,lB,bB,L,sock,shorts);
  limbArm(-1,-9+bob,aB,abB,L,shirt,glove&&ty!=='ref');
  ctx.globalAlpha=1;
  // tułów
  ctx.save();ctx.translate(hipX,hipY);ctx.rotate(lean);
  ctx.fillStyle=shorts;rr(-5.5,-3,11,8,3);ctx.fill();
  ctx.fillStyle=shirt;rr(-6.5,-17,13,16,5);ctx.fill();
  if(L.st){ctx.fillStyle=L.st;ctx.fillRect(-1.5,-17,3,16)}
  if(ty==='ref'){ctx.fillStyle='#ffd400';ctx.fillRect(-6.5,-17,13,2.4)}
  ctx.fillStyle=shirt==='#ffffff'||shirt==='#ffc93c'||shirt==='#c6ff00'?'#0d1c38':'#ffffff';
  if(ty!=='ref'){ctx.font='700 7.5px Barlow, Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(CARDS[it.card]?CARDS[it.card][3]:'',-.5,-9)}
  ctx.restore();
  // głowa
  var hx=2+Math.sin(lean)*14,hy=-21+bob;
  if(L.hs===5)hairSide(L,hx,hy,t);
  ctx.fillStyle=L.sk;circ(hx,hy,7.4);ctx.fill();
  ctx.beginPath();ctx.moveTo(hx+6.8,hy-1.5);ctx.quadraticCurveTo(hx+9.4,hy+.5,hx+6.8,hy+1.8);ctx.fill();
  if(L.hs!==5)hairSide(L,hx,hy,t);
  ctx.fillStyle='rgba(0,0,0,.14)';circ(hx-1.8,hy+.6,1.9);ctx.fill();
  var wow=caught;
  ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(hx+4,hy-1,1.9,wow?2.5:2.1,0,0,TAU);ctx.fill();
  ctx.fillStyle=L.ey;circ(hx+4.7,hy-1,1.15);ctx.fill();
  ctx.strokeStyle=L.hc;ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(hx+2.3,hy-4.3-(wow?1:0));ctx.lineTo(hx+6,hy-4-(wow?1:0));ctx.stroke();
  if(wow){ctx.fillStyle='#7a1f24';ctx.beginPath();ctx.ellipse(hx+5,hy+3.6,1.3,1.7,0,0,TAU);ctx.fill()}
  else{ctx.strokeStyle='#7a1f24';ctx.lineWidth=1;ctx.beginPath();ctx.arc(hx+4.4,hy+2.4,1.9,.3,PI*.8);ctx.stroke()}
  if(L.lg){ctx.strokeStyle='#ffffff';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(hx,hy,7.6,PI*1.1,PI*1.9);ctx.stroke()}
  // przednia noga i ręka
  var foot=limbLeg(hipX+1,hipY,lA,bA,L,sock,shorts);
  var hand=limbArm(1,-9+bob,aA,abA,L,shirt,glove&&ty!=='ref');
  if(ty==='ref'&&it.cardUp>0){ctx.fillStyle=Math.sin(t*10)>0?'#ffd400':'#ffe45c';ctx.save();ctx.translate(hand.x,hand.y-4);ctx.rotate(.2);rr(-2.8,-4.5,5.6,8,1);ctx.fill();ctx.restore()}
  // piłka: żonglerka / drybling
  var ballPos=null;
  if(mode==='jug')ballPos={x:5,y:foot.y-4-Math.abs(Math.sin(t*6))*16};
  if(ty==='dribbler'&&mode==='run')ballPos={x:12+Math.max(0,Math.sin(p))*3,y:hipY+17.5};
  ctx.restore();
  if(ballPos){var bx=it.x+ballPos.x*fs*sc,by=it.y+ballPos.y*sc;ctx.save();ctx.translate(bx,by);ctx.rotate((it.ap||t*6)*fs*.7);ball(0,0,4.6*sc,false);ctx.restore()}
  // czytelna etykieta nad głową
  var my=it.y-46*sc+Math.sin(t*5+it.ph)*1.5;
  function tag(txt,bgc,fgc,x,y,glow){ctx.font='700 18px Barlow, Arial, sans-serif';var w=ctx.measureText(txt).width+20;
    if(glow){ctx.fillStyle=glow;rr(x-w/2-4,y-16,w+8,32,16);ctx.fill()}
    ctx.fillStyle=bgc;rr(x-w/2,y-12,w,24,12);ctx.fill();ctx.strokeStyle='rgba(6,14,32,.6)';ctx.lineWidth=1.6;ctx.stroke();
    ctx.fillStyle=fgc;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,x,y+.5);return w}
  if(!caught){
    if(ty==='ref'){var rw=tag('     -5 s','#e5243b','#ffffff',it.x,my);
      ctx.fillStyle='#ffd400';ctx.save();ctx.translate(it.x-rw/2+15,my);ctx.rotate(-.15);ctx.fillRect(-5,-8,10,15);ctx.restore()}
    else{var rar=CARDS[it.card][2],own=SV.album.indexOf(it.card)>=0;
      var RB=['#dfe7f5','#16d97d','#8a5cff','#ffc93c'],RF=['#0d1c38','#062312','#ffffff','#2a1200'],RN=['ZWYKŁY','RZADKI','EPICKI','LEGENDA'];
      var txt=it.leg?'GWIAZDA x2':RN[rar],gl=(rar>=2||it.leg)?(rar===3||it.leg?'rgba(255,201,60,'+(.35+.25*Math.sin(t*6))+')':'rgba(138,92,255,.35)'):null;
      var w2=tag(txt,it.leg?'#ffc93c':RB[rar],it.leg?'#2a1200':RF[rar],it.x,my,gl);
      if(!own){ctx.font='700 14px Barlow, Arial, sans-serif';var nw=ctx.measureText('NOWY').width+14;ctx.fillStyle='#e5243b';rr(it.x+w2/2-10,my-25,nw,19,9.5);ctx.fill();
        ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('NOWY',it.x+w2/2-10+nw/2,my-15)}}
  }
  ctx.lineCap='butt';ctx.lineJoin='miter';
}

/* ---- portret na kartę albumu (fota talentu) ---- */
var PORT={};
function portrait(i){
  if(PORT[i])return PORT[i];
  var c=document.createElement('canvas');c.width=220;c.height=250;var g=c.getContext('2d'),L=LOOK[i],old=ctx;ctx=g;
  var cx=110;
  // poświata
  var bg2=g.createRadialGradient(cx,110,10,cx,120,120);bg2.addColorStop(0,'rgba(255,255,255,.5)');bg2.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=bg2;g.fillRect(0,0,220,250);
  // barki i koszulka
  g.fillStyle=L.sh;g.beginPath();g.moveTo(10,250);g.quadraticCurveTo(14,178,70,168);g.lineTo(150,168);g.quadraticCurveTo(206,178,210,250);g.closePath();g.fill();
  if(L.st){g.fillStyle=L.st;g.fillRect(cx-14,168,28,82)}
  g.fillStyle='rgba(0,0,0,.14)';g.beginPath();g.moveTo(10,250);g.quadraticCurveTo(14,178,70,168);g.lineTo(78,250);g.closePath();g.fill();
  // kołnierz
  g.fillStyle=L.sh==='#ffffff'?'#0d1c38':'#ffffff';g.beginPath();g.moveTo(84,166);g.lineTo(cx,198);g.lineTo(136,166);g.lineTo(126,166);g.lineTo(cx,186);g.lineTo(94,166);g.closePath();g.fill();
  // herb Q i numer
  // szyja
  g.fillStyle=L.sk;g.fillRect(cx-17,138,34,34);g.fillStyle='rgba(0,0,0,.16)';g.fillRect(cx-17,138,34,10);
  // afro za głową
  if(L.hs===5){g.fillStyle=L.hc;g.beginPath();g.arc(cx,82,62,0,TAU);g.fill()}
  if(L.hs===2){g.fillStyle=L.hc;var r2=function(x,y,w,h,q){g.beginPath();g.moveTo(x+q,y);g.arcTo(x+w,y,x+w,y+h,q);g.arcTo(x+w,y+h,x,y+h,q);g.arcTo(x,y+h,x,y,q);g.arcTo(x,y,x+w,y,q);g.closePath();g.fill()};r2(cx-56,64,26,96,12);r2(cx+30,64,26,96,12)}
  // uszy
  g.fillStyle=L.sk;g.beginPath();g.ellipse(cx-45,100,9,13,0,0,TAU);g.fill();g.beginPath();g.ellipse(cx+45,100,9,13,0,0,TAU);g.fill();
  // głowa
  var fg=g.createRadialGradient(cx-12,80,8,cx,96,60);fg.addColorStop(0,'rgba(255,255,255,.28)');fg.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=L.sk;g.beginPath();g.ellipse(cx,96,45,52,0,0,TAU);g.fill();g.fillStyle=fg;g.fill();
  // włosy
  g.fillStyle=L.hc;
  if(L.hs===0){g.beginPath();g.moveTo(cx-46,92);g.quadraticCurveTo(cx-50,36,cx,38);g.quadraticCurveTo(cx+50,36,cx+46,90);g.quadraticCurveTo(cx+30,58,cx+8,62);g.quadraticCurveTo(cx-20,54,cx-38,72);g.closePath();g.fill()}
  if(L.hs===1){g.beginPath();g.arc(cx,82,44,PI,0);g.fill();for(var k=0;k<9;k++){g.beginPath();g.arc(cx-40+k*10,50+(k%2)*6,12,0,TAU);g.fill()}}
  if(L.hs===2){g.beginPath();g.moveTo(cx-47,108);g.quadraticCurveTo(cx-52,38,cx,38);g.quadraticCurveTo(cx+52,38,cx+47,108);g.quadraticCurveTo(cx+36,66,cx+2,62);g.quadraticCurveTo(cx-34,66,cx-47,108);g.fill()}
  if(L.hs===3){g.globalAlpha=.75;g.beginPath();g.moveTo(cx-44,84);g.quadraticCurveTo(cx-46,44,cx,44);g.quadraticCurveTo(cx+46,44,cx+44,84);g.quadraticCurveTo(cx,62,cx-44,84);g.fill();g.globalAlpha=1}
  if(L.hs===4){g.beginPath();g.moveTo(cx-40,80);g.quadraticCurveTo(cx-44,54,cx-26,50);g.lineTo(cx-18,14);g.lineTo(cx-6,44);g.lineTo(cx+2,6);g.lineTo(cx+10,44);g.lineTo(cx+22,16);g.lineTo(cx+26,50);g.quadraticCurveTo(cx+44,54,cx+40,80);g.quadraticCurveTo(cx,62,cx-40,80);g.fill()}
  if(L.hs===5){g.beginPath();g.arc(cx,66,44,PI*1.05,PI*1.95);g.fill()}
  if(L.lg){g.fillStyle='#ffffff';g.fillRect(cx-46,64,92,9);g.fillStyle='#ffc93c';g.fillRect(cx-46,71,92,2)}
  // brwi
  g.strokeStyle=L.hc;g.lineWidth=5;g.lineCap='round';
  g.beginPath();g.moveTo(cx-30,78);g.quadraticCurveTo(cx-20,72,cx-9,77);g.moveTo(cx+9,77);g.quadraticCurveTo(cx+20,72,cx+30,78);g.stroke();
  // oczy
  [-19,19].forEach(function(o){g.fillStyle='#ffffff';g.beginPath();g.ellipse(cx+o,92,9.5,8.5,0,0,TAU);g.fill();
    g.fillStyle=L.ey;g.beginPath();g.arc(cx+o+1,93,5.4,0,TAU);g.fill();g.fillStyle='#10131a';g.beginPath();g.arc(cx+o+1,93,2.6,0,TAU);g.fill();
    g.fillStyle='#ffffff';g.beginPath();g.arc(cx+o-1.2,90.5,1.8,0,TAU);g.fill()});
  // nos, policzki, uśmiech
  g.strokeStyle='rgba(0,0,0,.22)';g.lineWidth=3;g.beginPath();g.moveTo(cx+2,100);g.quadraticCurveTo(cx+8,112,cx,114);g.stroke();
  g.fillStyle='rgba(255,110,110,.25)';g.beginPath();g.arc(cx-29,112,8,0,TAU);g.fill();g.beginPath();g.arc(cx+29,112,8,0,TAU);g.fill();
  g.fillStyle='#7a1f24';g.beginPath();g.moveTo(cx-17,122);g.quadraticCurveTo(cx,142,cx+17,122);g.quadraticCurveTo(cx,128,cx-17,122);g.fill();
  g.fillStyle='#ffffff';g.beginPath();g.moveTo(cx-14,123.5);g.quadraticCurveTo(cx,129,cx+14,123.5);g.lineTo(cx+12,127);g.quadraticCurveTo(cx,131,cx-12,127);g.closePath();g.fill();
  ctx=old;PORT[i]=c.toDataURL('image/png');return PORT[i];
}
function bomb(x,y,r,t){
  ctx.save();ctx.translate(x,y);ctx.rotate(-.3);
  ctx.strokeStyle='#caa472';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(0,-15);ctx.quadraticCurveTo(4,-24,10,-25);ctx.stroke();
  var g=ctx.createLinearGradient(-10,0,10,0);g.addColorStop(0,'#8e0f1f');g.addColorStop(.45,'#ff3b4e');g.addColorStop(1,'#8e0f1f');
  ctx.fillStyle=g;rr(-10,-16,20,34,5);ctx.fill();
  ctx.fillStyle='#ffffff';ctx.fillRect(-10,-6,20,4);ctx.fillRect(-10,6,20,4);
  ctx.restore();
  var sx=x+10*Math.cos(-.3)+25*Math.sin(-.3),sy=y+10*Math.sin(-.3)-25*Math.cos(-.3);
  var f=.6+Math.random()*.6;
  var sg=ctx.createRadialGradient(sx,sy,0,sx,sy,10*f);sg.addColorStop(0,'rgba(255,255,255,1)');sg.addColorStop(.4,'rgba(255,210,80,.9)');sg.addColorStop(1,'rgba(255,120,0,0)');
  ctx.fillStyle=sg;circ(sx,sy,10*f);ctx.fill();
}
function drawItem(it,t){
  var x=it.x,y=it.y,r=it.r;
  if(!it.caught&&!MOVE[it.type]&&it.type!=='pw'&&!(it.drop>0)){ctx.fillStyle='rgba(0,0,0,.24)';ctx.beginPath();ctx.ellipse(x+3,y+r*.8,r*.95,r*.3,0,0,TAU);ctx.fill()}
  if(MOVE[it.type]&&!it.caught){ctx.fillStyle='rgba(0,0,0,.26)';ctx.beginPath();ctx.ellipse(x,y+35,20,6,0,0,TAU);ctx.fill()}
  switch(it.type){
    case 'goldB':case 'goldM':case 'goldS':ball(x,y,r,true,t+it.ph);break;
    case 'ball':ball(x,y,r,false);break;
    case 'trophy':trophy(x,y,r);break;
    case 'medal':medal(x,y,r);break;
    case 'star':star(x,y,r,t+it.ph);break;
    case 'boots':boots(x,y,r,it.col);break;
    case 'cone':cone(x,y,r);break;
    case 'tire':tire(x,y,r);break;
    case 'bag':bag(x,y,r);break;
    case 'runner':case 'dribbler':case 'keeper':case 'ref':player(it,t);break;
    case 'bomb':bomb(x,y,r,t);break;
    case 'pw':powerup(it,t);break;
  }
}
function drawScout(t){
  var x=PIV.x,y=PIV.y,reel=hook.st==='reel',SK='#f0c49c',SKD='#d9a47a';
  var md=S.mood&&S.t-S.mood.t<1.4?S.mood.k:(S.st==='play'&&S.time<=5&&S.fever<=0?'worry':'');
  var bob=reel?Math.sin(S.t*18)*1.2:Math.sin(S.t*2.2)*.8;
  ctx.save();ctx.translate(x,y);ctx.scale(1.28,1.28);ctx.translate(-x,-y);
  // podest
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(x,y+4,66,9,0,0,TAU);ctx.fill();
  var pg=ctx.createLinearGradient(0,y-28,0,y+2);pg.addColorStop(0,'#1a2f66');pg.addColorStop(1,'#0a1430');
  ctx.fillStyle=pg;rr(x-58,y-28,116,30,8);ctx.fill();
  ctx.fillStyle='#2b2bff';ctx.fillRect(x-58,y-28,116,4);
  ctx.fillStyle='#2b2bff';circ(x-34,y-12,9);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='400 13px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Q',x-34,y-11.5);
  ctx.fillStyle='rgba(255,255,255,.55)';ctx.font='700 8px Barlow, Arial, sans-serif';ctx.fillText('SKAUT',x+2,y-11);
  // korba
  var cx=x+36,cy=y-46,ca=hook.crank;
  ctx.strokeStyle='#8b98b5';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx,y-28);ctx.stroke();
  ctx.fillStyle='#dfe5f2';circ(cx,cy,13);ctx.fill();ctx.fillStyle='#2e3b5c';circ(cx,cy,9.5);ctx.fill();
  ctx.strokeStyle='#dfe5f2';ctx.lineWidth=2.5;for(var i=0;i<3;i++){var a=ca+i*TAU/3;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*9.5,cy+Math.sin(a)*9.5);ctx.stroke()}
  ctx.fillStyle='#ffc93c';circ(cx,cy,3);ctx.fill();
  var hx=cx+Math.cos(ca)*12,hy=cy+Math.sin(ca)*12;
  ctx.translate(0,bob*.4);
  // nogi i buty
  ctx.fillStyle='#10204a';rr(x-13,y-62,11,36,4);ctx.fill();rr(x+2,y-62,11,36,4);ctx.fill();
  ctx.fillStyle='#ffffff';ctx.fillRect(x-13,y-60,2,32);ctx.fillRect(x+11,y-60,2,32);
  ctx.fillStyle='#ffffff';rr(x-17,y-31,16,7,3.5);ctx.fill();rr(x+1,y-31,16,7,3.5);ctx.fill();
  ctx.fillStyle='#16d97d';ctx.fillRect(x-17,y-26,16,2);ctx.fillRect(x+1,y-26,16,2);
  // tułów: bluza
  var jg=ctx.createLinearGradient(x-21,0,x+21,0);jg.addColorStop(0,'#1c1cc4');jg.addColorStop(.5,'#3d3dff');jg.addColorStop(1,'#1c1cc4');
  ctx.fillStyle=jg;ctx.beginPath();ctx.moveTo(x-14,y-102);ctx.lineTo(x+14,y-102);ctx.quadraticCurveTo(x+22,y-100,x+22,y-90);ctx.lineTo(x+20,y-58);ctx.lineTo(x-20,y-58);ctx.lineTo(x-22,y-90);ctx.quadraticCurveTo(x-22,y-100,x-14,y-102);ctx.closePath();ctx.fill();
  ctx.fillStyle='#10204a';ctx.fillRect(x-20,y-62,40,4);
  ctx.fillStyle='#16d97d';ctx.fillRect(x-22,y-82,5,3);ctx.fillRect(x+17,y-82,5,3);
  // kołnierz V + suwak
  ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(x-9,y-102);ctx.lineTo(x,y-92);ctx.lineTo(x+9,y-102);ctx.lineTo(x+5,y-102);ctx.lineTo(x,y-96);ctx.lineTo(x-5,y-102);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y-92);ctx.lineTo(x,y-62);ctx.stroke();
  // herb Q na piersi
  ctx.fillStyle='#ffc93c';circ(x+10,y-86,4);ctx.fill();ctx.fillStyle='#10204a';ctx.font='400 6px Anton, Impact, sans-serif';ctx.fillText('Q',x+10,y-85.7);
  // lornetka na szyi
  ctx.strokeStyle='#10131a';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x-8,y-101);ctx.quadraticCurveTo(x-12,y-84,x-8,y-76);ctx.moveTo(x-1,y-100);ctx.lineTo(x-1,y-78);ctx.stroke();
  ctx.fillStyle='#1b1f2a';rr(x-12,y-80,6,9,2);ctx.fill();rr(x-4,y-80,6,9,2);ctx.fill();
  ctx.fillStyle='#7fb2ff';circ(x-9,y-71.5,1.8);ctx.fill();circ(x-1,y-71.5,1.8);ctx.fill();
  // lewa ręka z notesem
  ctx.lineCap='round';ctx.strokeStyle='#2323d8';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x-17,y-96);ctx.quadraticCurveTo(x-28,y-86,x-30,y-74);ctx.stroke();
  ctx.save();ctx.translate(x-35,y-78);ctx.rotate(-.22);
  ctx.fillStyle='#8a5a2b';rr(-9,-12,18,23,2.5);ctx.fill();ctx.fillStyle='#fbfcff';rr(-7.5,-9,15,19,1.5);ctx.fill();
  ctx.fillStyle='#b9c3d8';ctx.fillRect(-2.5,-13,5,3);
  ctx.fillStyle='#8b98b5';ctx.fillRect(-5,-5,10,1.3);ctx.fillRect(-5,-1.5,10,1.3);ctx.fillRect(-5,2,6,1.3);
  ctx.fillStyle='#16d97d';starPath(3.5,5.5,2.6,1.1,-PI/2);ctx.fill();
  ctx.restore();
  ctx.fillStyle=SK;circ(x-30,y-72,3.6);ctx.fill();
  // prawa ręka na korbie
  var ex=reel?hx:x+30,ey=reel?hy-bob*.4:y-66;
  ctx.strokeStyle='#2323d8';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x+17,y-96);ctx.quadraticCurveTo(x+27,y-84,ex,ey);ctx.stroke();
  ctx.fillStyle=SK;circ(ex,ey,3.8);ctx.fill();
  ctx.lineCap='butt';
  // szyja
  ctx.fillStyle=SKD;rr(x-5,y-108,10,9,3);ctx.fill();
  // głowa
  var hyC=y-122;
  ctx.fillStyle=SKD;circ(x-15.5,hyC+1,4.2);ctx.fill();circ(x+15.5,hyC+1,4.2);ctx.fill();
  var fg=ctx.createRadialGradient(x-4,hyC-5,2,x,hyC,18);fg.addColorStop(0,'#f9d6b4');fg.addColorStop(1,SK);
  ctx.fillStyle=fg;ctx.beginPath();ctx.ellipse(x,hyC,15,16.5,0,0,TAU);ctx.fill();
  // włosy (baki)
  ctx.fillStyle='#4a2c17';ctx.beginPath();ctx.moveTo(x-15,hyC-6);ctx.quadraticCurveTo(x-16,hyC+2,x-13,hyC+4);ctx.lineTo(x-12,hyC-6);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(x+15,hyC-6);ctx.quadraticCurveTo(x+16,hyC+2,x+13,hyC+4);ctx.lineTo(x+12,hyC-6);ctx.closePath();ctx.fill();
  // czapka z daszkiem
  ctx.fillStyle='#10204a';ctx.beginPath();ctx.moveTo(x-16,hyC-6);ctx.quadraticCurveTo(x-16,hyC-22,x,hyC-22);ctx.quadraticCurveTo(x+16,hyC-22,x+16,hyC-6);ctx.closePath();ctx.fill();
  ctx.fillStyle='#2b2bff';ctx.fillRect(x-16,hyC-9,32,3);
  ctx.fillStyle='#16d97d';ctx.beginPath();ctx.ellipse(x,hyC-6.5,19,4.2,0,0,PI);ctx.fill();
  ctx.fillStyle='#ffffff';ctx.font='400 9px Anton, Impact, sans-serif';ctx.fillText('Q',x,hyC-14.5);
  // oczy śledzą hak
  var tp=tip(),dx=tp.x-x,dy=tp.y-hyC,dl=Math.hypot(dx,dy)||1;dx/=dl;dy/=dl;
  var blink=(S.t%3.7)<.12&&md!=='wow';
  var eyY=hyC-1;
  [-6,6].forEach(function(o){
    if(blink){ctx.strokeStyle='#2a1a10';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x+o-3.5,eyY);ctx.lineTo(x+o+3.5,eyY);ctx.stroke();return}
    if(md==='happy'){ctx.strokeStyle='#2a1a10';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+o,eyY+1.5,3.4,PI*1.15,PI*1.85);ctx.stroke();return}
    var ry=md==='wow'?5.4:4.6;
    ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(x+o,eyY,3.9,ry,0,0,TAU);ctx.fill();
    ctx.fillStyle='#3b2412';circ(x+o+dx*1.5,eyY+dy*1.9,2.4);ctx.fill();
    ctx.fillStyle='#ffffff';circ(x+o+dx*1.5-.8,eyY+dy*1.9-.9,.8);ctx.fill();
  });
  // brwi
  ctx.strokeStyle='#4a2c17';ctx.lineWidth=1.8;ctx.lineCap='round';
  var bu=md==='wow'?-3:0,tilt=md==='sad'||md==='worry'?1.6:(md==='happy'?-.6:0);
  ctx.beginPath();ctx.moveTo(x-9.5,eyY-6.5+bu-tilt);ctx.lineTo(x-3,eyY-7+bu+tilt);ctx.moveTo(x+3,eyY-7+bu+tilt);ctx.lineTo(x+9.5,eyY-6.5+bu-tilt);ctx.stroke();
  // nos i policzki
  ctx.strokeStyle=SKD;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,eyY+2);ctx.quadraticCurveTo(x+2.5,eyY+6,x,eyY+7);ctx.stroke();
  ctx.fillStyle='rgba(255,120,120,.28)';circ(x-9.5,eyY+7,3);ctx.fill();circ(x+9.5,eyY+7,3);ctx.fill();
  // usta
  var my=hyC+10;
  if(md==='happy'){ctx.fillStyle='#7a1f24';ctx.beginPath();ctx.moveTo(x-6,my-1);ctx.quadraticCurveTo(x,my+8,x+6,my-1);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ffffff';ctx.fillRect(x-4.5,my-1,9,1.6);ctx.fillStyle='#ff7a8a';circ(x,my+3.6,2);ctx.fill()}
  else if(md==='wow'){ctx.fillStyle='#7a1f24';ctx.beginPath();ctx.ellipse(x,my+1,2.6,3.4,0,0,TAU);ctx.fill()}
  else if(md==='sad'){ctx.strokeStyle='#7a1f24';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(x,my+5,4.5,PI*1.2,PI*1.8);ctx.stroke()}
  else if(md==='worry'){ctx.strokeStyle='#7a1f24';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(x-4,my+1);ctx.quadraticCurveTo(x-2,my-1,x,my+1);ctx.quadraticCurveTo(x+2,my+3,x+4,my+1);ctx.stroke()}
  else{ctx.strokeStyle='#7a1f24';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(x,my-3,5,PI*.2,PI*.8);ctx.stroke()}
  ctx.lineCap='butt';
  // kropla potu
  if(md==='worry'||md==='sad'){var sy=hyC-8+((S.t*14)%10);ctx.fillStyle='rgba(140,210,255,.9)';ctx.beginPath();ctx.moveTo(x+14,sy-4);ctx.quadraticCurveTo(x+17,sy+1,x+14,sy+2);ctx.quadraticCurveTo(x+11,sy+1,x+14,sy-4);ctx.fill()}
  ctx.translate(0,-bob*.4);
  // bloczek
  ctx.fillStyle='#c7d0e6';circ(x,y,6);ctx.fill();ctx.fillStyle='#2e3b5c';circ(x,y,2.5);ctx.fill();
  ctx.restore();
}
function drawHook(){
  var p=tip(),closed=!!hook.item;
  if(hook.st==='swing'&&S.st==='play'&&S.fx.laser>0)drawLaser();
  ctx.strokeStyle='rgba(5,10,25,.7)';ctx.lineWidth=4.5;ctx.beginPath();ctx.moveTo(PIV.x,PIV.y);ctx.lineTo(p.x,p.y);ctx.stroke();
  ctx.strokeStyle='#eef2fb';ctx.lineWidth=2;ctx.stroke();
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-hook.a);
  var o=closed?.55:0;
  ctx.fillStyle='#c7d0e6';rr(-7,-4,14,9,3);ctx.fill();
  ctx.strokeStyle='#ffc93c';ctx.lineWidth=4;ctx.lineCap='round';
  ctx.save();ctx.translate(-5,4);ctx.rotate(o);ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-12,8,-6,20);ctx.stroke();ctx.restore();
  ctx.save();ctx.translate(5,4);ctx.rotate(-o);ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(12,8,6,20);ctx.stroke();ctx.restore();
  ctx.lineCap='butt';ctx.restore();
}
function curTier(){return S.mode==='lvl'&&S.st!=='menu'?Math.min(5,Math.floor((S.L-1)/5)):3}
var LVN={21:'Faza grupowa',22:'Faza grupowa',23:'1/8 finału',24:'Półfinał',25:'Finał Ligi Mistrzów',26:'Mecz otwarcia',27:'1/8 finału',28:'Ćwierćfinał',29:'Półfinał',30:'Wielki finał'};
function lvName(L){return LVN[L]||('Poziom '+L)}
function drawLed(t){
  var ti=curTier(),y0=118,h=34,lvl=S.mode==='lvl'&&S.st!=='menu';
  if(ti===0){ // drewniany płot z ręcznie malowaną tablicą
    ctx.fillStyle='#7a5431';ctx.fillRect(0,y0,W,h);
    ctx.fillStyle='rgba(0,0,0,.18)';for(var x=0;x<W;x+=36)ctx.fillRect(x,y0,3,h);
    ctx.fillStyle='#5b3a1d';ctx.fillRect(0,y0-4,W,4);ctx.fillRect(0,y0+h,W,4);
    ctx.fillStyle='#f4ecd8';rr(210,y0+4,300,h-8,4);ctx.fill();
    ctx.fillStyle='#b8232f';ctx.font='italic 700 19px Barlow, Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.save();ctx.beginPath();rr(210,y0+4,300,h-8,4);ctx.clip();var T0='KS KARTOFLISKO  ·  POZIOM '+(lvl?S.L:1)+'  ·  QASTROD.PL  ·  ',tw0=ctx.measureText(T0).width,o0=(t*45)%tw0;ctx.textAlign='left';for(var xx=210-o0;xx<510;xx+=tw0)ctx.fillText(T0,xx,y0+h/2+1);ctx.restore();ctx.textAlign='center';
    ctx.fillStyle='#e8e2cf';rr(24,y0+6,150,h-12,3);ctx.fill();rr(546,y0+6,150,h-12,3);ctx.fill();
    ctx.fillStyle='#2b5d2e';ctx.font='700 13px Barlow, Arial, sans-serif';ctx.fillText('SKLEP U HENIA',99,y0+h/2+1);ctx.fillText('QASTROD.PL',621,y0+h/2+1);
    return;
  }
  if(ti===1||ti===2){ // drukowane bandy reklamowe
    var boards=ti===1?[['#ffffff','#b8232f','PIEKARNIA ZBYSZKO'],['#ffd400','#10204a','POZIOM '+(lvl?S.L:6)],['#ffffff','#2b2bff','QASTROD.PL'],['#16d97d','#062312','AUTO-MYJNIA TOP']]:
      [['#2b2bff','#ffffff','QASTROD.PL'],['#e5243b','#ffffff','I LIGA'],['#10204a','#ffc93c','POZIOM '+(lvl?S.L:11)],['#ffffff','#10204a','PIOSENKI PIŁKARSKIE']];
    var bw=W/boards.length;ctx.font='400 18px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    var bo=(t*40)%W;ctx.save();ctx.beginPath();ctx.rect(0,y0,W,h);ctx.clip();[-W,0].forEach(function(base){boards.forEach(function(b,k){var bx=base+bo+k*bw;ctx.fillStyle=b[0];ctx.fillRect(bx,y0,bw-3,h);ctx.fillStyle=b[1];ctx.fillText(b[2],bx+bw/2,y0+h/2+1)})});ctx.restore();
    if(ti===2){ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(0,y0,W,h/2)}
    ctx.fillStyle='#0a1430';ctx.fillRect(0,y0+h,W,4);return;
  }
  var LT=lvl?(lvName(S.L).toUpperCase()+'  •  '+tierOf(S.L)[0].toUpperCase()+'  •  QASTROD.PL  •  '):LEDTXT;
  ctx.fillStyle='#02050c';ctx.fillRect(0,y0,W,h);
  ctx.save();ctx.beginPath();ctx.rect(0,y0,W,h);ctx.clip();
  ctx.font='400 25px Anton, Impact, sans-serif';ctx.textBaseline='middle';ctx.textAlign='left';
  var tw=ctx.measureText(LT).width||600,off=(t*(ti===5?100:70))%tw;
  var g=ctx.createLinearGradient(0,0,W,0);
  if(ti===4){g.addColorStop(0,'#ffffff');g.addColorStop(.5,'#7fb2ff');g.addColorStop(1,'#ffffff')}
  else if(ti===5){g.addColorStop(0,'#fff3b0');g.addColorStop(.5,'#ffc93c');g.addColorStop(1,'#fff3b0')}
  else{g.addColorStop(0,'#ffc93c');g.addColorStop(.5,'#ffffff');g.addColorStop(1,'#16d97d')}
  ctx.fillStyle=g;for(var x2=-off;x2<W;x2+=tw)ctx.fillText(LT,x2,y0+h/2+1);
  ctx.fillStyle=dotPat;ctx.fillRect(0,y0,W,h);
  ctx.restore();
  ctx.fillStyle=ti===5?'#ffc93c':ti===4?'#4d6bff':'#2b2bff';ctx.fillRect(0,y0-3,W,3);ctx.fillStyle='#0a1430';ctx.fillRect(0,y0+h,W,4);
}
var fireworks=[],birds=[{x:-40,y:40,s:40},{x:-120,y:56,s:34},{x:-80,y:30,s:46}];
function drawAmbient(t){
  var ti=curTier();
  if(ti===0){ // ptaki
    ctx.strokeStyle='rgba(30,40,60,.7)';ctx.lineWidth=2;
    birds.forEach(function(b){b.x+=b.s/60;if(b.x>W+60)b.x=-60;var w=Math.sin(t*9+b.s)*4;ctx.beginPath();ctx.moveTo(b.x-7,b.y-w);ctx.quadraticCurveTo(b.x-3,b.y-3,b.x,b.y);ctx.quadraticCurveTo(b.x+3,b.y-3,b.x+7,b.y-w);ctx.stroke()});
    return;
  }
  ctx.save();ctx.globalCompositeOperation='lighter';
  if(ti>=3){var cx=((t*230)%(W+500))-250;
    var g=ctx.createLinearGradient(cx-110,0,cx+110,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,ti===4?'rgba(150,180,255,.18)':'rgba(190,210,255,.16)');g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g;ctx.fillRect(cx-110,26,220,90)}
  if(ti>=2)flashes.forEach(function(f){var a=1-f.t/.16;ctx.fillStyle='rgba(255,255,255,'+a+')';circ(f.x,f.y,2+a*3);ctx.fill();
    var fg=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,16);fg.addColorStop(0,'rgba(255,255,255,'+(a*.4)+')');fg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=fg;circ(f.x,f.y,16);ctx.fill()});
  if(ti===5){ // fajerwerki nad stadionem
    if(Math.random()<.035){var fx=rnd(60,W-60),fy=rnd(20,80),col=pick(['255,201,60','255,77,109','53,200,255','22,217,125','255,255,255']);for(var k=0;k<26;k++){var a2=k*TAU/26;fireworks.push({x:fx,y:fy,vx:Math.cos(a2)*rnd(40,70),vy:Math.sin(a2)*rnd(40,70),t:0,c:col})}}
    fireworks.forEach(function(p){p.t+=1/60;p.x+=p.vx/60;p.y+=p.vy/60;p.vy+=.6;var a3=Math.max(0,1-p.t/1.1);ctx.fillStyle='rgba('+p.c+','+a3+')';circ(p.x,p.y,2.2);ctx.fill()});
    fireworks=fireworks.filter(function(p){return p.t<1.1&&p.y<150});
  }
  ctx.restore();
}

function powerup(it,t){
  var x=it.x,y=it.y+Math.sin(t*3+it.ph)*3,c=PW[it.pk]||PW.clock,r=it.r;
  var g=ctx.createRadialGradient(x,y,2,x,y,r*1.9);g.addColorStop(0,c[1]);g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.globalAlpha=.45+.2*Math.sin(t*6);ctx.fillStyle=g;circ(x,y,r*1.9);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle='rgba(6,14,32,.85)';circ(x,y,r);ctx.fill();ctx.strokeStyle=c[1];ctx.lineWidth=3;ctx.stroke();
  ctx.save();ctx.translate(x,y);ctx.strokeStyle=c[1];ctx.fillStyle=c[1];ctx.lineWidth=2.4;
  if(it.pk==='laser'){circ(0,0,8);ctx.stroke();ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(-4,0);ctx.moveTo(4,0);ctx.lineTo(12,0);ctx.moveTo(0,-12);ctx.lineTo(0,-4);ctx.moveTo(0,4);ctx.lineTo(0,12);ctx.stroke()}
  else if(it.pk==='iso'){rr(-5,-9,10,18,3);ctx.fill();ctx.fillStyle='#062312';ctx.fillRect(-5,-3,10,4)}
  else if(it.pk==='clock'){circ(0,0,9);ctx.stroke();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-6);ctx.moveTo(0,0);ctx.lineTo(4,2);ctx.stroke()}
  else{ctx.rotate(-.35);rr(-9,-4,13,9,4);ctx.fill();ctx.fillRect(2,-4,7,4)}
  ctx.restore();
}
function pill(x,y,w,h,glow){ctx.fillStyle='rgba(6,14,32,.84)';rr(x,y,w,h,18);ctx.fill();ctx.strokeStyle=glow||'rgba(77,107,255,.55)';ctx.lineWidth=2;ctx.stroke()}
function drawHud(t){
  var fev=S.fever>0;
  pill(14,12,262,92,fev?'rgba(255,201,60,.9)':null);
  ctx.textBaseline='alphabetic';ctx.textAlign='left';
  var LV=S.mode==='lvl',ref=LV?S.goal:SV.best;
  ctx.fillStyle='#a9bee3';ctx.font='700 14px Barlow, Arial, sans-serif';ctx.fillText(LV?'PUNKTY':'WYNIK',32,38);
  ctx.textAlign='right';
  if(LV){ctx.fillStyle=S.score>=S.goal?'#16d97d':'#ffffff';ctx.fillText('CEL '+num(S.goal),258,38)}
  else{ctx.fillStyle=S.score>SV.best&&SV.best>0?'#16d97d':'#ffffff';ctx.fillText(S.score>SV.best&&SV.best>0?'NOWY REKORD!':'REKORD '+num(SV.best),258,38)}
  ctx.textAlign='left';ctx.fillStyle='#ffc93c';ctx.font='400 36px Anton, Impact, sans-serif';ctx.fillText(num(S.disp),32,78);
  var pr=ref>0?clamp(S.disp/ref,0,1):0;
  ctx.fillStyle='rgba(255,255,255,.12)';rr(32,86,226,7,3.5);ctx.fill();
  if(pr>0){ctx.fillStyle=pr>=1?'#16d97d':'#2b2bff';rr(32,86,Math.max(7,226*pr),7,3.5);ctx.fill()}
  // zegar
  var low=S.time<=5&&S.st==='play'&&!fev,pulse=low?(.5+.5*Math.sin(t*14)):0;
  pill(W-14-176,12,176,92,fev?'rgba(255,201,60,.9)':low?'rgba(255,77,109,'+(.5+pulse*.5)+')':null);
  ctx.fillStyle='#a9bee3';ctx.font='700 14px Barlow, Arial, sans-serif';ctx.fillText(fev?'CZAS STOI':'CZAS',W-172,38);
  ctx.textAlign='right';ctx.fillStyle='#ffffff';ctx.fillText(LV?'POZIOM '+S.L:'FAZA '+S.lv,W-32,38);
  ctx.textAlign='left';
  var sc=1+(S.tpulse>0?S.tpulse*.5:0)+(S.tneg>0?S.tneg*.3:0),tt=S.time<10?S.time.toFixed(1).replace('.',','):String(Math.ceil(S.time));
  ctx.save();ctx.translate(W-172,86);ctx.scale(sc,sc);ctx.font='400 42px Anton, Impact, sans-serif';
  ctx.fillStyle=fev?'#ffc93c':S.tpulse>0?'#16d97d':S.tneg>0||low?'rgb(255,'+Math.round(90+90*(1-pulse))+','+Math.round(100*(1-pulse))+')':'#ffffff';
  ctx.fillText(tt+' s',0,0);ctx.restore();
  // seria + postęp do szału
  if(S.st==='play'||S.st==='end'){
    var y0=114;
    if(fev){var fw=W-28;ctx.fillStyle='rgba(6,14,32,.84)';rr(14,y0,fw,30,15);ctx.fill();
      var fg=ctx.createLinearGradient(14,0,14+fw,0);fg.addColorStop(0,'#ff7a1a');fg.addColorStop(.5,'#ffc93c');fg.addColorStop(1,'#fff3b0');
      ctx.fillStyle=fg;rr(14,y0,Math.max(30,fw*S.fever/7),30,15);ctx.fill();
      ctx.fillStyle='#2a1200';ctx.font='400 19px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.fillText('SZAŁ KIBICÓW  ·  PUNKTY x2  ·  CZAS STOI',W/2,y0+22);ctx.textAlign='left'}
    else if(S.combo>=2){var cm=Math.min(3,1+.25*(S.combo-1)),cw=236;
      var cg=ctx.createLinearGradient(14,0,14+cw,0);cg.addColorStop(0,'#ff7a1a');cg.addColorStop(1,'#ffc93c');
      ctx.fillStyle=S.combo>=2?cg:'rgba(6,14,32,.84)';rr(14,y0,cw,32,16);ctx.fill();
      ctx.fillStyle=S.combo>=2?'#2a1200':'#ffffff';ctx.font='400 19px Anton, Impact, sans-serif';ctx.fillText('SERIA x'+S.combo+(S.combo>=2?'  +'+Math.round((cm-1)*100)+'%':''),28,y0+23);
      var seg=S.combo%5;for(var k=0;k<5;k++){ctx.fillStyle=k<seg?(S.combo>=2?'#2a1200':'#ffc93c'):'rgba(0,0,0,.28)';circ(14+cw-68+k*12,y0+16,4.2);ctx.fill()}
      if(S.combo>=2)for(var fi=0;fi<3;fi++){var fx=26+fi*50+Math.sin(t*9+fi)*3,fy=y0-Math.abs(Math.sin(t*7+fi*2))*6;ctx.fillStyle='rgba(255,160,40,.85)';ctx.beginPath();ctx.moveTo(fx,fy+6);ctx.quadraticCurveTo(fx+4,fy,fx+1,fy-7);ctx.quadraticCurveTo(fx+8,fy-1,fx+6,fy+6);ctx.closePath();ctx.fill()}}
    // aktywne boosty
    var bx=W-40,bys=y0+16;[['laser',12],['iso',10]].forEach(function(b){var v=S.fx[b[0]];if(v>0){var c=PW[b[0]][1];
      ctx.fillStyle='rgba(6,14,32,.84)';circ(bx,bys,15);ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.arc(bx,bys,15,-PI/2,-PI/2+TAU*clamp(v/b[1],0,1));ctx.stroke();
      ctx.fillStyle=c;ctx.font='700 11px Barlow, Arial, sans-serif';ctx.textAlign='center';ctx.fillText(b[0]==='laser'?'LAS':'ISO',bx,bys+4);ctx.textAlign='left';bx-=38}});
  }
  // gwizdek
  var wx=W-74,wy=H-74,can=hook.st==='reel'&&hook.item&&S.whistles>0;
  ctx.fillStyle=can?'rgba(255,201,60,.95)':'rgba(6,14,32,.82)';circ(wx,wy,46);ctx.fill();
  ctx.strokeStyle=can?'#ffffff':'rgba(255,201,60,.8)';ctx.lineWidth=3;ctx.stroke();
  if(can){ctx.strokeStyle='rgba(255,201,60,'+(.5-.5*Math.sin(t*8))+')';ctx.lineWidth=4;circ(wx,wy,52+Math.sin(t*8)*3);ctx.stroke()}
  ctx.save();ctx.translate(wx-2,wy-4);ctx.rotate(-.35);
  ctx.fillStyle=can?'#0d1c38':'#ffc93c';rr(-18,-8,26,16,8);ctx.fill();ctx.fillRect(4,-8,14,7);
  ctx.fillStyle=can?'rgba(255,201,60,.95)':'rgba(6,14,32,1)';circ(-9,0,3.5);ctx.fill();ctx.restore();
  ctx.fillStyle=can?'#0d1c38':'#ffffff';ctx.font='700 13px Barlow, Arial, sans-serif';ctx.textAlign='center';ctx.fillText('GWIZDEK',wx,wy+30);
  ctx.fillStyle='#e5243b';circ(wx+33,wy-33,15);ctx.fill();ctx.fillStyle='#fff';ctx.font='400 17px Anton, Impact, sans-serif';ctx.textBaseline='middle';ctx.fillText(S.whistles,wx+33,wy-32);
  ctx.textBaseline='alphabetic';
  if(S.hint&&S.st==='play'&&hook.st==='swing'){
    ctx.globalAlpha=.65+.35*Math.sin(t*5);ctx.fillStyle='rgba(6,14,32,.85)';rr(W/2-200,H-66,400,44,22);ctx.fill();
    ctx.fillStyle='#ffffff';ctx.font='700 19px Barlow, Arial, sans-serif';ctx.textAlign='center';ctx.fillText(TOUCH?'Tapnij, żeby rzucić hak':'Kliknij lub spacja, żeby rzucić hak',W/2,H-37);ctx.globalAlpha=1;
  }
}
function drawFx(){
  booms.forEach(function(b){var k=b.t/.45;ctx.strokeStyle='rgba(255,230,150,'+(1-k)+')';ctx.lineWidth=8*(1-k)+1;circ(b.x,b.y,20+k*120);ctx.stroke();
    var g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,90);g.addColorStop(0,'rgba(255,255,220,'+(.8*(1-k))+')');g.addColorStop(1,'rgba(255,200,80,0)');ctx.fillStyle=g;circ(b.x,b.y,90);ctx.fill()});
  parts.forEach(function(p){var a=1-p.t/p.life;ctx.globalAlpha=Math.max(0,a);ctx.fillStyle=p.col;
    if(p.kind==='conf'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillRect(-p.sz/2,-p.sz/4,p.sz,p.sz/2);ctx.restore()}
    else{circ(p.x,p.y,p.sz*a+.5);ctx.fill()}});
  ctx.globalAlpha=1;
  flyers.forEach(function(f){var k=f.t/f.d,e=k*k*(3-2*k),x=f.x0+(120-f.x0)*e,y=f.y0+(66-f.y0)*e-Math.sin(k*PI)*80;ball(x,y,10,true)});
  floats.forEach(function(f){var k=f.t/f.life,a=k<.75?1:1-(k-.75)/.25,pop=k<.12?.6+k/.12*.55:k<.22?1.15-(k-.12)*1.5:1;ctx.globalAlpha=a;
    ctx.save();ctx.translate(f.x,f.y-k*70);ctx.scale(pop,pop);
    ctx.font='400 '+(f.big?42:30)+'px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.lineWidth=6;ctx.strokeStyle='rgba(6,14,32,.9)';ctx.strokeText(f.txt,0,0);ctx.fillStyle=f.col;ctx.fillText(f.txt,0,0);ctx.restore()});
  ctx.globalAlpha=1;ctx.textBaseline='alphabetic';
}
function drawVignette(t){
  if(S.fever>0){var a=.35+.2*Math.sin(t*10);ctx.strokeStyle='rgba(255,201,60,'+a+')';ctx.lineWidth=18;ctx.strokeRect(0,0,W,H);
    var g=ctx.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.75);g.addColorStop(0,'rgba(255,190,60,0)');g.addColorStop(1,'rgba(255,170,40,.28)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
  else if(S.st==='play'&&S.time<=5){var a2=(.18+.14*Math.sin(t*12))*(1-S.time/5+.3);var g2=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.75);g2.addColorStop(0,'rgba(255,40,60,0)');g2.addColorStop(1,'rgba(255,40,60,'+a2+')');ctx.fillStyle=g2;ctx.fillRect(0,0,W,H)}
}
function render(){
  var t=S.t;
  ctx.setTransform(scale,0,0,scale,0,0);
  if(S.zoom>0){ctx.translate(W/2,H/2);ctx.scale(1+S.zoom,1+S.zoom);ctx.translate(-W/2,-H/2)}
  if(S.shake>0){ctx.translate(rnd(-1,1)*S.shake*.6,rnd(-1,1)*S.shake*.6)}
  buildBg(curTier());ctx.drawImage(bg,0,0,W,H);
  drawAmbient(t);drawLed(t);
  S.items.forEach(function(it){if(it.caught||it.dropD>0)return;
    if(it.drop>0){var k=clamp(it.drop/.5,0,1),oy=k*k*340;
      ctx.fillStyle='rgba(0,0,0,'+(.25*(1-k))+')';ctx.beginPath();ctx.ellipse(it.x,it.y+it.r*.8,it.r*(1-k*.6),it.r*.3*(1-k*.6),0,0,TAU);ctx.fill();
      var yy=it.y;it.y=yy-oy;drawItem(it,t);it.y=yy}
    else drawItem(it,t)});
  drawScout(t);drawHook();
  if(hook.item)drawItem(hook.item,t);
  drawFx();drawVignette(t);
  if(S.st!=='menu'&&!window.__noHud)drawHud(t);
}
var last=0;
function frame(ts){
  var dt=Math.min(.05,(ts-last)/1000||0);last=ts;
  var ns=DEBUG?(window.__ltTS||1):1;for(var k=0;k<ns;k++)update(dt);render();requestAnimationFrame(frame);
}

/* ---------- nakładki ---------- */
function showOv(h,cls){popEl.classList.remove('on');ov.className='lt-ov on '+(cls||'');ov.innerHTML='<div class="lt-panel">'+h+'</div>'}
function hideOv(){ov.className='lt-ov';ov.innerHTML=''}
function cardHtml(i,locked){
  if(locked)return '<div class="lt-card lock"><span class="sil"></span><b>?</b><span class="rr">Nieodkryty</span></div>';
  var c=CARDS[i];return '<div class="lt-card r'+c[2]+'"><span class="ovr">'+(RBASE[c[2]]+(i%4))+'</span><span class="pos">'+c[1]+'</span><span class="no">'+c[3]+'</span><img class="ph" alt="" src="'+portrait(i)+'"><b>'+c[0]+'</b><span class="rr">'+RAR[c[2]]+'</span></div>';
}
function demoField(){S.st='menu';S.ms=null;S.lv=1;S.items=[];S.fx={};S.fever=0;S.combo=0;S.time=25;fillAll();S.items.forEach(function(it){it.drop=0;it.dropD=0});resetHook()}
function iconRow(items){return '<div class="lt-icons">'+items.map(function(x){return '<button class="lt-ib" data-a="'+x[0]+'"><i>'+x[1]+'</i><span>'+x[2]+'</span>'+(x[3]!=null?'<b>'+x[3]+'</b>':'')+'</button>'}).join('')+'</div>'}
function misReady(){return activeMis().length}
function hasProg(){return !!(SV.runs||SV.ps||SV.maxL||(SV.album&&SV.album.length))}
function showMenu(){
  demoField();musStop();var rl=SV.recL||0;
  showOv('<p class="lt-kick">Gra Qastrod</p><h2 class="lt-title">Łowca <em>talentów</em></h2>'+
   (rl?'<p class="lt-chip">&#127942; Rekord <b>poziom '+rl+'</b></p>':'<p class="lt-chip">Od kartofliska do <b>finału mundialu</b></p>')+
   '<button class="lt-btn go" data-a="play">'+(hasProg()?'&#9654; Kontynuuj':'&#9917; Graj')+'</button>'+(hasProg()?'<button class="lt-link" data-a="newgame">Nowa gra</button>':'')+
   '<div class="lt-how"><span><i>&#127919;</i>Zrób cel</span><span><i>&#128293;</i>x5 = Szał</span><span><i>&#128165;</i>Porażka = od nowa</span></div>'+
   iconRow([['map','&#128506;&#65039;','Kariera',null],['inf','&#9854;&#65039;','Bez końca',SV.best?num(SV.best):null],['upg','&#9889;','Ulepsz',SV.ps+' PS'],['album','&#127183;','Album',albumCount()+'/16'],['mis','&#127919;','Misje',null]]),'menu');
}
function showMap(){
  var rl=SV.recL||0,h='<h2 class="lt-h">Droga na mundial</h2><p class="lt-chip">&#127942; Rekord <b>'+(rl?'poziom '+rl:'brak')+'</b></p><div class="lt-map">';
  for(var ti=0;ti<TIERS.length;ti++){h+='<div class="lt-tier"><p>'+TIERS[ti][0]+'</p><div class="lt-nodes">';
    for(var L=ti*5+1;L<=ti*5+5;L++){var st=SV.lvS[L]||0,seen=L<=Math.max(1,rl),cls=L===rl?'next':st?'done':seen?'seen':'lock',sts='';
      for(var k=0;k<3;k++)sts+='<i'+(k<st?' class="on"':'')+'>&#9733;</i>';
      h+='<div class="lt-node '+cls+'"><b>'+(seen?L:'&#128274;')+'</b>'+(seen?'<span>'+sts+'</span>':'')+'</div>'}
    h+='</div></div>'}
  h+='</div><p class="lt-meta">Każdy mecz startuje od kartofliska</p><button class="lt-btn go" data-a="play">&#9917; Graj</button><button class="lt-link" data-a="back">Wróć</button>';
  showOv(h,'wide');
  var nx=ov.querySelector('.lt-node.next');if(nx&&nx.scrollIntoView)try{nx.scrollIntoView({block:'center'})}catch(e){}
}
function starsHtml(n,anim){var h='<div class="lt-stars">';for(var k=0;k<3;k++)h+='<i class="'+(k<n?'on':'')+(anim?' a':'')+'" style="animation-delay:'+(.25+k*.3)+'s">&#9733;</i>';return h+'</div>'}
function showWin(){
  var last=S.L>=MAXL,nt=last?null:tierOf(S.L+1)[0],newTier=!last&&nt!==tierOf(S.L)[0];
  showOv('<p class="lt-kick">'+tierOf(S.L)[0]+' &middot; '+lvName(S.L)+'</p><h2 class="lt-h big">Poziom '+S.L+' <em>zaliczony</em></h2>'+starsHtml(S.wStars,true)+
   '<div class="lt-chips"><span><i>&#9201;&#65039;</i>'+Math.floor(S.time)+' s</span><span><i>&#128293;</i>x'+(S.ms?S.ms.cmax:0)+'</span><span><i>&#11088;</i>+'+(S.lastPs+(S.psMis||0))+' PS</span></div>'+
   (newTier?'<p class="lt-rec">Awans: '+nt+'!</p>':'')+
   (last?'<p class="lt-rec">Mistrz świata!</p><button class="lt-btn go again" data-a="retry">&#9917; Od nowa</button>':'<button class="lt-btn go again" data-a="next">Poziom '+(S.L+1)+' &rsaquo;</button>')+
   iconRow([['map','&#128506;&#65039;','Kariera',null],['upg','&#9889;','Ulepsz',SV.ps+' PS'],['menu','&#8962;','Menu',null]]),'over');
  [0,1,2].forEach(function(k){if(k<S.wStars)setTimeout(function(){tone(880+k*220,.18,'square',.08)},250+k*300)});
}
function showFail(){
  var diff=Math.max(0,S.goal-S.score),bar=Math.round(clamp(S.score/S.goal,0,1)*100),close=diff<=S.goal*.15;
  showOv('<p class="lt-kick">'+tierOf(S.L)[0]+' &middot; '+lvName(S.L)+'</p><h2 class="lt-h big">Koniec <em>kariery</em></h2>'+
   (S.newRec?'<p class="lt-rec">&#127942; Rekord: poziom '+S.L+'!</p>':'<p class="lt-meta">Doszedłeś do poziomu <b>'+S.L+'</b> &middot; rekord: '+(SV.recL||S.L)+'</p>')+
   '<div class="lt-vs"><span>'+(close?'Tak blisko! ':'')+'Brakło <b>'+num(diff)+'</b> pkt</span><i style="--p:'+bar+'%"></i></div>'+
   '<div class="lt-chips"><span><i>&#127919;</i>'+num(S.score)+'</span><span><i>&#128293;</i>x'+(S.ms?S.ms.cmax:0)+'</span><span><i>&#11088;</i>+'+(S.lastPs+(S.psMis||0))+' PS</span></div>'+
   '<button class="lt-btn go again" data-a="retry">&#8635; Zagraj od nowa</button>'+nextUpgradeHint()+
   iconRow([['map','&#128506;&#65039;','Kariera',null],['upg','&#9889;','Ulepsz',null],['mis','&#127919;','Misje',null],['menu','&#8962;','Menu',null]]),'over');
}
function showMis(){
  showOv('<h2 class="lt-h">Misje</h2><p class="lt-meta">Wykonaj w meczu, zgarnij Punkty Skauta</p>'+misHtml()+'<button class="lt-btn" data-a="back">&lsaquo; Wróć</button>','wide');
}
function showUpg(){
  var h='<h2 class="lt-h">Ulepszenia</h2><p class="lt-ps">'+SV.ps+' <small>PS</small></p><div class="lt-ugrid">';
  UPG.forEach(function(u){var lv=SV.up[u[0]],max=lv>=u[4],c=upCost(u[0]),pips='',can=!max&&SV.ps>=c;
    for(var i=0;i<u[4];i++)pips+='<i'+(i<lv?' class="on"':'')+'></i>';
    h+='<button class="lt-ucard'+(can?' can':'')+(max?' max':'')+'" data-a="up" data-k="'+u[0]+'"'+(can?'':' disabled')+'><span class="ic">'+u[5]+'</span><b>'+u[1]+'</b><span class="ds">'+u[2]+'</span><span class="pips">'+pips+'</span><span class="pr">'+(max?'MAX':c+' PS')+'</span></button>'});
  h+='</div><p class="lt-meta">PS zdobywasz w każdym meczu i za misje</p><button class="lt-btn" data-a="back">&lsaquo; Wróć</button>';
  showOv(h,'wide');
}
function showAlbum(){
  var h='<h2 class="lt-h">Album <small>'+albumCount()+'/16</small></h2><p class="lt-meta">Złap piłkarza, zdobądź kartę. Każda karta +1% punktów</p><div class="lt-album">';
  CARDS.forEach(function(c,i){h+=cardHtml(i,SV.album.indexOf(i)<0)});
  h+='</div><button class="lt-btn" data-a="back">&lsaquo; Wróć</button>';
  showOv(h,'wide');
}
function nextUpgradeHint(){
  var best=null;UPG.forEach(function(u){if(SV.up[u[0]]>=u[4])return;var c=upCost(u[0]);if(!best||c<best.c)best={n:u[1],c:c}});
  if(!best)return '';
  return SV.ps>=best.c?'<button class="lt-nudge ok" data-a="upg">&#9889; Kup: <b>'+best.n+'</b> &rsaquo;</button>':
    '<p class="lt-nudge">Jeszcze <b>'+(best.c-SV.ps)+' PS</b> do: '+best.n+'</p>';
}
function showOver(){
  var diff=Math.max(0,S.prev-S.score),close=!S.rec&&S.prev>0&&diff<=S.prev*.2;
  var bar=S.prev>0?Math.round(clamp(S.score/S.prev,0,1)*100):100;
  showOv('<p class="lt-kick">Koniec meczu</p><h2 class="lt-score" id="ltScore">0</h2>'+
   (S.rec?'<p class="lt-rec">&#127942; Nowy rekord!</p>':S.prev>0?'<div class="lt-vs"><span>'+(close?'Tak blisko! ':'')+'Brakło <b>'+num(diff)+'</b> do rekordu</span><i style="--p:'+bar+'%"></i></div>':'')+
   '<div class="lt-chips"><span><i>&#9201;&#65039;</i>'+mmss(S.el)+'</span><span><i>&#128293;</i>x'+(S.ms?S.ms.cmax:0)+'</span><span><i>&#11088;</i>+'+(S.lastPs+(S.psMis||0))+' PS</span></div>'+
   '<button class="lt-btn go again" data-a="inf">&#8635; Zagraj ponownie</button>'+
   nextUpgradeHint()+
   iconRow([['upg','&#9889;','Ulepszenia',null],['mis','&#127919;','Misje',null],['share','&#128247;','Wynik',null],['menu','&#8962;','Menu',null]]),'over');
  var elS=document.getElementById('ltScore'),t0=performance.now(),goal=Math.round(S.score);
  (function step(now){var k=Math.min(1,(now-t0)/900),e=1-Math.pow(1-k,3);if(elS)elS.textContent=num(goal*e);if(k<1)requestAnimationFrame(step)})(t0);
}
function showPause(){
  showOv('<h2 class="lt-h big">Pauza</h2><button class="lt-btn go" data-a="resume">&#9654; Wznów</button>'+iconRow([['mute',SV.muted?'&#128263;':'&#128266;',SV.muted?'Dźwięk wył.':'Dźwięk wł.',null],['quit','&#9209;&#65039;','Zakończ',null]]),'pause');
}
var popT=0;
function showCard(i){
  popEl.innerHTML='<p>Nowa karta!</p>'+cardHtml(i,false);popEl.classList.add('on');
  clearTimeout(popT);popT=setTimeout(function(){popEl.classList.remove('on')},2200);
}
var backTo='menu';
function pause(){if(S.st==='play'){S.st='pause';musStop();showPause()}}
function resume(){if(S.st==='pause'){S.st='play';hideOv();musStart()}}

/* ---------- karta do udostępnienia ---------- */
var logo=new Image();logo.src='/assets/qastrod-logo.jpg';
function shareCard(){
  var c=document.createElement('canvas');c.width=1080;c.height=1920;var g=c.getContext('2d'),old=ctx;
  var bgG=g.createLinearGradient(0,0,0,1920);bgG.addColorStop(0,'#081226');bgG.addColorStop(.55,'#0d1c38');bgG.addColorStop(1,'#0d5c33');
  g.fillStyle=bgG;g.fillRect(0,0,1080,1920);
  for(var y=1100;y<1920;y+=90){g.fillStyle=(Math.floor(y/90)%2)?'rgba(22,217,125,.10)':'rgba(22,217,125,.04)';g.fillRect(0,y,1080,90)}
  try{if(logo.complete&&logo.naturalWidth)g.drawImage(logo,420,110,240,240)}catch(e){}
  g.textAlign='center';g.fillStyle='#16d97d';g.font='700 44px Barlow, Arial, sans-serif';g.fillText('GRA PIŁKARSKA ONLINE',540,440);
  g.fillStyle='#ffffff';g.font='400 150px Anton, Impact, sans-serif';g.fillText('ŁOWCA',540,600);g.fillStyle='#16d97d';g.fillText('TALENTÓW',540,760);
  g.fillStyle='#a9bee3';g.font='700 52px Barlow, Arial, sans-serif';g.fillText('MÓJ WYNIK',540,920);
  g.fillStyle='#ffc93c';g.font='400 210px Anton, Impact, sans-serif';g.fillText(num(S.score),540,1140);
  g.fillStyle='#ffffff';g.font='700 58px Barlow, Arial, sans-serif';g.fillText('Czas gry '+mmss(S.el)+'  ·  seria x'+(S.ms?S.ms.cmax:0),540,1260);
  g.fillText('Album: '+albumCount()+'/16 talentów',540,1340);
  ctx=g;ball(300,1540,90,true,0);trophy(540,1540,100);star(780,1540,70,0);ctx=old;
  g.fillStyle='#2b2bff';g.beginPath();g.moveTo(140,1720);g.arcTo(940,1720,940,1840,60);g.arcTo(940,1840,140,1840,60);g.arcTo(140,1840,140,1720,60);g.arcTo(140,1720,940,1720,60);g.closePath();g.fill();
  g.fillStyle='#ffffff';g.font='400 64px Anton, Impact, sans-serif';g.fillText('POBIJESZ? QASTROD.PL',540,1806);
  var name='lowca-talentow-'+Math.round(S.score)+'-pkt.png';
  c.toBlob(function(b){
    if(!b)return;
    function dl(){var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500)}
    try{var f=new File([b],name,{type:'image/png'});
      if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:'Łowca talentów',text:'Mam '+num(S.score)+' pkt w Łowcy talentów. Pobijesz? qastrod.pl/lowca-talentow'}).catch(function(e){if(!e||e.name!=='AbortError')dl()});return}}catch(e){}
    dl();
  },'image/png');
}

/* ---------- sterowanie ---------- */
function toLogical(e){var r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H}}
cv.addEventListener('pointerdown',function(e){
  unlockAudio();if(S.st!=='play')return;e.preventDefault();
  var p=toLogical(e);if(Math.hypot(p.x-(W-74),p.y-(H-74))<56){useWhistle();return}
  fire();
});
root.addEventListener('click',function(e){
  var b=e.target.closest('[data-a]');if(!b||b.disabled)return;unlockAudio();
  var a=b.getAttribute('data-a');
  switch(a){
    case 'play':startRun('lvl',1);break;
    case 'inf':startRun('inf');break;
    case 'next':startRun('lvl',S.L+1,true);break;
    case 'retry':startRun(S.mode,1);break;
    case 'map':backTo='menu';showMap();break;
    case 'upg':if(ov.querySelector('.lt-ugrid')==null)backTo=S.st==='over'?'over':'menu';showUpg();break;
    case 'album':backTo='menu';showAlbum();break;
    case 'mis':backTo=S.st==='over'?'over':'menu';showMis();break;
    case 'back':if(backTo==='over'){if(S.mode==='lvl'){S.won?showWin():showFail()}else showOver()}else showMenu();break;
    case 'up':var k=b.getAttribute('data-k'),c=upCost(k);if(SV.ps>=c){SV.ps-=c;SV.up[k]++;save();sfx('buy')}showUpg();break;
    case 'menu':showMenu();break;
    case 'newgame':showOv('<h2 class="lt-h">Nowa gra?</h2><p class="lt-meta">Postęp, monety i ulepszenia zostaną wyczyszczone. Zaczniesz od zera.</p><button class="lt-btn go" data-a="newok">Tak, zacznij od nowa</button><button class="lt-link" data-a="menu">Anuluj</button>','menu');break;
    case 'newok':var mu=SV.muted,d=JSON.parse(SVDEF);Object.keys(SV).forEach(function(k){delete SV[k]});Object.assign(SV,d);SV.muted=mu;save();showMenu();toast('Nowa gra! Powodzenia');break;
    case 'share':shareCard();break;
    case 'pause':if(S.st==='play')pause();else if(S.st==='pause')resume();break;
    case 'resume':resume();break;
    case 'quit':S.st='play';S.time=0;endRun();hideOv();break;
    case 'mute':SV.muted=!SV.muted;save();syncBar();if(S.st==='pause')showPause();break;
    case 'fs':toggleFs();break;
  }
});
window.addEventListener('keydown',function(e){
  var k=e.key,inView=root.getBoundingClientRect().top<innerHeight*.6;
  if(S.st==='play'){
    if(k===' '||k==='ArrowDown'){e.preventDefault();unlockAudio();fire()}
    else if(k==='ArrowUp'||k==='g'||k==='G'){e.preventDefault();useWhistle()}
    else if(k==='p'||k==='P'||k==='Escape'){pause()}
  }else if(S.st==='pause'&&(k==='p'||k==='P'||k==='Escape'||k===' ')){e.preventDefault();resume()}
  else if((S.st==='over'||S.st==='menu')&&(k===' '||k==='Enter')&&inView&&!e.target.closest('input,textarea')){e.preventDefault();if(S.st==='menu')startRun('lvl',1);else if(ov.querySelector('[data-a=next]'))startRun('lvl',S.L+1,true);else startRun(S.mode,1)}
  if(k==='m'||k==='M'){SV.muted=!SV.muted;save();syncBar()}
});
document.addEventListener('visibilitychange',function(){if(document.hidden)pause()});
function toggleFs(){
  var d=document;
  if(d.fullscreenElement||d.webkitFullscreenElement){(d.exitFullscreen||d.webkitExitFullscreen).call(d)}
  else{var f=root.requestFullscreen||root.webkitRequestFullscreen;if(f)f.call(root)}
}
function syncBar(){var m=root.querySelector('[data-a="mute"].lt-tool');if(m)m.innerHTML=SV.muted?'&#128263; Dźwięk: wył.':'&#128266; Dźwięk: wł.'}
if(!(document.fullscreenEnabled||document.webkitFullscreenEnabled)){var fb=root.querySelector('[data-a="fs"]');if(fb)fb.style.display='none'}
syncBar();

/* ---------- start ---------- */
showMenu();
function boot(){requestAnimationFrame(function(ts){last=ts;requestAnimationFrame(frame)})}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(boot,boot);else boot();

if(DEBUG)window.__lt={S:S,SV:SV,hook:hook,startRun:startRun,endRun:endRun,fire:fire,useWhistle:useWhistle,startFever:startFever,legend:legendEvent,
  aimAt:function(x,y){var a=Math.atan2(x-PIV.x,y-PIV.y);hook.a=a;hook.ph=Math.asin(clamp(a/1.24,-1,1))},
  freeze:function(){hook.ph=0;window.__ltFreeze=true},showCard:showCard,save:save};
})();
