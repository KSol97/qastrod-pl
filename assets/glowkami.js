/* GŁÓWKAMI · gra Qastrod.pl · dwie wielkie głowy, małe boisko, 40 sekund meczu */
(function(){
'use strict';
var root=document.getElementById('gk'); if(!root) return;
var stage=root.querySelector('.lt-stage'), cv=stage.querySelector('canvas');
var ctx=cv.getContext('2d');
var W=960,H=600,GY=528,PI=Math.PI,TAU=PI*2,BR=16,GW=70,CROSS=GY-146,MATCH=40;
var DEBUG=/[?&]debug=1/.test(location.search);
var TOUCH=!!(window.matchMedia&&(matchMedia('(hover:none)').matches||matchMedia('(pointer:coarse)').matches));

function el(tag,cls,html){var d=document.createElement(tag);d.className=cls;if(html)d.innerHTML=html;return d}
var ov=el('div','lt-ov'),toastEl=el('div','lt-toast'),shoutEl=el('div','lt-shout gk-shout');
[ov,toastEl,shoutEl].forEach(function(d){stage.appendChild(d)});

/* ---------- postacie: wygląd + superstrzał ---------- */
var SUPN={fire:'Ognista rakieta',banana:'Banan',zigzag:'Błyskawica',ice:'Lodowy strzał'};
var HEADS=[
 {n:'Skaut Qastrod',sk:'#f2c29a',hc:'#4a2c17',hs:6,sh:'#2b2bff',ey:'#3b2412',sp:'fire'},
 {n:'Olek Kopyto',sk:'#f3c7a0',hc:'#5a3317',hs:0,sh:'#e5243b',ey:'#5a3a1a',sp:'banana'},
 {n:'Franek Florek',fr:1,sk:'#f6cfa8',hc:'#d9973e',hs:1,sh:'#2b2bff',ey:'#2f6fbf',sp:'zigzag'},
 {n:'Staś Sprint',sk:'#9a6440',hc:'#1b1208',hs:5,sh:'#ffc93c',ey:'#3b2412',sp:'fire'},
 {n:'Bartek Bomba',sk:'#c68a5c',hc:'#2b1a0e',hs:4,sh:'#ff7a1a',ey:'#3b2412',sp:'ice'},
 {n:'Igor Wślizg',fr:1,sk:'#f6d2b0',hc:'#e9c46a',hs:0,sh:'#16d97d',ey:'#3f8f5a',sp:'banana'},
 {n:'Julek Podcinka',sk:'#e0ac80',hc:'#7a3b1a',hs:2,sh:'#ffffff',ey:'#5a3a1a',sp:'zigzag'},
 {n:'Antek Tunel',sk:'#6e4529',hc:'#140c05',hs:1,sh:'#e5243b',ey:'#2a170b',sp:'ice'},
 {n:'Nikola Główka',sk:'#f3c7a0',hc:'#1b1208',hs:4,sh:'#35c8ff',ey:'#2f6fbf',sp:'fire'},
 {n:'Maks Przewrotka',sk:'#f6d2b0',hc:'#d9973e',hs:2,sh:'#0d1c38',ey:'#3f8f5a',sp:'banana'},
 {n:'Leon Laser',sk:'#e0ac80',hc:'#1b1208',hs:3,sh:'#ffffff',ey:'#5a3a1a',sp:'zigzag'},
 {n:'Kuba Rakieta',sk:'#6e4529',hc:'#140c05',hs:5,sh:'#2b2bff',ey:'#2a170b',sp:'fire'},
 {n:'Filip Fenomen',sk:'#c68a5c',hc:'#1b1208',hs:0,sh:'#ffc93c',ey:'#3b2412',sp:'ice',lg:1}];
var LEAGUE=[
 [1,.12,'Podwórko'],[2,.22,'Podwórko'],[3,.30,'Podwórko'],
 [4,.38,'Liga okręgowa'],[5,.46,'Liga okręgowa'],[6,.54,'Liga okręgowa'],
 [7,.61,'Ekstraklasa'],[8,.68,'Ekstraklasa'],[9,.75,'Ekstraklasa'],
 [10,.82,'Liga Mistrzów'],[11,.89,'Liga Mistrzów'],[12,.96,'Finał Mundialu']];
var TIER={'Podwórko':0,'Liga okręgowa':1,'Ekstraklasa':2,'Liga Mistrzów':3,'Finał Mundialu':4};
var UPG=[
 ['spd','Szybkość','Szybszy bieg',70,5,'&#128095;'],
 ['jmp','Skoczność','Wyższy skok',70,5,'&#129432;'],
 ['kick','Strzał','Mocniejszy strzał',80,5,'&#9917;'],
 ['head','Główka','Celniejsze główki',80,5,'&#129504;'],
 ['sup','Supermoc','Szybciej się ładuje',100,5,'&#128293;']];

/* ---------- zapis ---------- */
var KEY='qastrod_glowkami_v2';
var SV={coins:0,up:{spd:0,jmp:0,kick:0,head:0,sup:0},stars:{},next:0,head:0,own:[0],muted:false,wins:0,goals:0};
var SVDEF=JSON.stringify(SV);
try{var d0=JSON.parse(localStorage.getItem(KEY)||'null');if(d0){for(var k0 in SV)if(d0[k0]!==undefined)SV[k0]=d0[k0];SV.up=Object.assign({spd:0,jmp:0,kick:0,head:0,sup:0},d0.up||{})}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(SV))}catch(e){}}

/* ---------- pomocnicze ---------- */
function rnd(a,b){return a+Math.random()*(b-a)}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function clamp(v,a,b){return v<a?a:v>b?b:v}
function num(n){return Math.round(n).toLocaleString('pl-PL')}
function upv(k){return SV.up[k]||0}
function upCost(k){var u=UPG.filter(function(x){return x[0]===k})[0];return Math.round(u[3]*Math.pow(1.7,SV.up[k])/10)*10}
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
 beep:function(){tone(880,.1,'square',.07)}
};
function sfx(n,a){try{SFX[n]&&SFX[n](a)}catch(e){}}

/* ---------- skala ---------- */
var scale=1,dpr=1;
function resize(){dpr=Math.min(2,window.devicePixelRatio||1);var cw=stage.clientWidth||900;cv.width=Math.round(cw*dpr);cv.height=Math.round(cw*H/W*dpr);scale=cv.width/W}
window.addEventListener('resize',resize);if(window.ResizeObserver)new ResizeObserver(resize).observe(stage);resize();

/* ---------- tło stadionu ---------- */
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
function drawBoards(TH,y,h){ctx.save();ctx.beginPath();ctx.rect(0,y,W,h);ctx.clip();ctx.fillStyle=TH.bt;ctx.font='400 '+Math.round(h*.55)+'px Anton, Impact, sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';var T='QASTROD.PL      ',tw=ctx.measureText(T).width,off=(S.t*70)%tw;for(var x=-off;x<W;x+=tw)ctx.fillText(T,x,y+h/2+1);ctx.restore()}
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
  var top=TH.sc==='trees'?280:TH.sc==='blocks'?250:TH.sc==='small'?200:150;
  drawBackdrop(c,TH,top,GY-40,7+lv*13);
  var dg=c.createLinearGradient(0,GY-220,0,GY-40);dg.addColorStop(0,'rgba(0,0,0,0)');dg.addColorStop(1,'rgba(0,0,0,.3)');c.fillStyle=dg;c.fillRect(0,GY-220,W,180);
  c.fillStyle=TH.board;c.fillRect(0,GY-40,W,40);c.fillStyle=TH.bt;c.fillRect(0,GY-43,W,3);
  
  for(var k=0;k<12;k++){c.fillStyle=k%2?TH.grass[0]:TH.grass[1];c.fillRect(k*80,GY,80,H-GY)}
  if(TH.snowGrass){c.fillStyle='rgba(255,255,255,.35)';for(var sn=0;sn<40;sn++){c.beginPath();c.ellipse(Math.random()*W,GY+8+Math.random()*(H-GY-10),10+Math.random()*20,3+Math.random()*3,0,0,TAU);c.fill()}}
  c.fillStyle='rgba(255,255,255,.85)';c.fillRect(0,GY,W,3);c.fillRect(W/2-1.5,GY,3,H-GY);
  c.beginPath();c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=3;c.ellipse(W/2,GY+36,90,22,0,PI,TAU);c.stroke();
  var vg=c.createRadialGradient(W/2,H*.5,H*.3,W/2,H*.5,H*.9);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,8,20,.4)');c.fillStyle=vg;c.fillRect(0,0,W,H);
  wxP=[];fwP=[];
}

/* ---------- stan ---------- */
var S={st:'menu',t:0,lv:0,time:MATCH,sc:[0,0],ball:null,P:[],pk:null,pkT:18,shake:0,slow:0,hs:0,goalT:0,endT:0,golden:false,lastTouch:0,cd:0,flash:0,flashCol:'#fff'};
var parts=[],floats=[],trail=[];
var keys={};
function newPlayer(side,headIx,skill){
  return{side:side,dir:side===0?1:-1,x:side===0?W*.3:W*.7,y:GY,vx:0,vy:0,onG:true,kickT:0,kickCd:0,charge:0,chg:false,head:headIx,R:42,big:0,freeze:0,boots:0,stun:0,sup:0,
    skill:skill,aiT:0,tx:W/2,jumpCd:0,mood:null,moodT:0,land:0,tilt:0};
}
function resetKickoff(toward){
  var b=S.ball;b.x=toward===0?W*.36:toward===1?W*.64:W/2;b.y=toward===-1?170:260;b.vx=0;b.vy=0;b.fire=0;b.sup=null;b.supT=0;
  S.P[0].x=toward===1?W*.13:W*.24;S.P[1].x=toward===0?W*.87:W*.76;S.P.forEach(function(p){p.y=GY;p.vx=p.vy=0;p.kickT=0;p.stun=0;p.freeze=0;p.charge=0;p.chg=false});
}
function startMatch(lv){
  unlockAudio();crowdOn();crowdSet(.05);
  S.lv=lv;var L=LEAGUE[lv];S.P=[newPlayer(0,SV.head,0),newPlayer(1,L[0],L[1])];
  S.ball={x:W/2,y:190,vx:0,vy:0,fire:0,rot:0,sup:null,supT:0};S.sc=[0,0];S.koT=9;S.koSide=null;S.time=MATCH;S.golden=false;S.gold=0;S.pk=null;S.pkT=rnd(16,22);S.goalT=0;S.endT=0;
  parts=[];floats=[];trail=[];resetKickoff(-1);S.st='count';S.cd=2.4;S.cdLast=4;hideOv();buildBg(lv);
}

/* ---------- efekty ---------- */
function burst(x,y,n,col,spd){for(var i=0;i<n;i++){var a=rnd(0,TAU),s=rnd(60,spd||360);parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,t:0,life:rnd(.4,1),col:col||'#fff',sz:rnd(2,5)})}if(parts.length>500)parts.splice(0,parts.length-500)}
function confetti(n){for(var i=0;i<n;i++)parts.push({x:rnd(0,W),y:rnd(-40,0),vx:rnd(-60,60),vy:rnd(40,200),t:0,life:rnd(1.4,2.4),col:pick(['#2b2bff','#16d97d','#ffc93c','#fff','#e5243b']),sz:rnd(3,7),conf:1})}
function addFloat(txt,x,y,col){floats.push({txt:txt,x:x,y:y,col:col||'#fff',t:0,life:1.1})}
function shout(h,cls){shoutEl.style.fontSize=h.length>12?'7cqw':'';shoutEl.textContent=h;shoutEl.className='lt-shout gk-shout '+(cls||'');void shoutEl.offsetWidth;shoutEl.classList.add('on')}
function toast(h){toastEl.innerHTML=h;toastEl.classList.remove('on');void toastEl.offsetWidth;toastEl.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(function(){toastEl.classList.remove('on')},1700)}
function setMood(p,m,t){p.mood=m;p.moodT=t||1.5}

/* ---------- fizyka: spokojna, przewidywalna ---------- */
function stats(p){var me=p.side===0,s=p.skill,X=(DEBUG&&window.__gkX)||{},q=function(k){return X[k]!=null?X[k]:s};return{spd:(me?370+22*upv('spd'):300+130*q('spd')),jmp:(me?850+22*upv('jmp'):845+15*q('jmp'))*(p.boots>0?1.22:1),
  kick:(me?1+.07*upv('kick'):.92+.3*q('kick')),head:(me?1+.08*upv('head'):1+.25*q('head')),sup:(me?1+.22*upv('sup'):.45+.6*q('sup'))}}
function headPos(p){var R=p.R*(p.big>0?1.45:1);return{x:p.x,y:p.y-44-R,R:R}}
var SWT=.26,SWA=1.75,SWR=50;
function swingA(p){if(p.kickT<=0)return 0;var u=1-p.kickT/SWT;return u<.62?SWA*Math.sin(u/.62*PI/2):SWA*(1-(u-.62)/.38)}
function footPos(p){var a=swingA(p),k=a/SWA;return{x:p.x+p.dir*(13+Math.sin(a)*SWR),y:p.y-8-SWR+Math.cos(a)*SWR,r:20+k*6,a:a,k:k,out:p.kickT>0&&(1-p.kickT/SWT)<.66}}
function collideCircle(cx,cy,cr,cvx,cvy,e,p,kind){
  var b=S.ball,dx=b.x-cx,dy=b.y-cy,d=Math.hypot(dx,dy),min=cr+BR;if(d>=min||d===0)return false;
  var nx=dx/d,ny=dy/d;b.x=cx+nx*min;b.y=cy+ny*min;
  var rvx=b.vx-cvx,rvy=b.vy-cvy,vn=rvx*nx+rvy*ny;
  if(vn<0){b.vx-=(1+e)*vn*nx;b.vy-=(1+e)*vn*ny}
  if(kind==='head'){
    var st=stats(p);
    // główka: kierunek z miejsca uderzenia, dodatkowa moc przy skoku
    // główka przewidywalna: zawsze do przodu; w wyskoku = mocna, płaska; na stojąco = podcinka
    if(nx*p.dir>-.55){
      var up=p.vy<-60,down=p.vy>60&&!p.onG;
      var fx=up?330:down?290:220,fy=up?-260:down?-300:-430;
      var hm=st.head-1;b.vx=p.dir*fx*(1+.5*hm)+p.vx*.3+nx*50;b.vy=fy*(1-.8*hm)-(ny<0?-ny*60:0);
      setMood(p,'kick',.35);
    }else{b.vx*=.6;b.vy=Math.min(b.vy,-200)}
    b.sup=null;b.fire=0;
  }
  var sp=Math.hypot(b.vx,b.vy);if(sp>1000){b.vx*=1000/sp;b.vy*=1000/sp}
  S.lastTouch=p.side;S.lastKind=kind;S.lastTX=b.x;S.lastTV=Math.round(b.vx);p.sup=Math.min(1,p.sup+(kind==='head'?.03:.018)*stats(p).sup);
  if(p.sup>=1&&!p.supReady){p.supReady=true;if(p.side===0){sfx('ready');addFloat('SUPER! Kopnij piłkę',p.x,p.y-170,'#ffc93c')}}
  return true;
}
function doKick(p,c){
  var f=footPos(p),b=S.ball,st=stats(p),d=Math.hypot(b.x-f.x,b.y-f.y);
  var inFront=(b.x-p.x)*p.dir>-10,reach=f.r+BR+22+(p.big>0?12:0);
  if(d>reach||!inFront||(b.sup&&b.supBy!==p.side))return false;
  setMood(p,'kick',.5);S.lastTouch=p.side;S.lastKind='kick'+(p.sup>=1?'S':'');S.lastTX=b.x;
  if(p.sup>=1){p.sup=0;p.supReady=false;var H2=HEADS[p.head],t=H2.sp;b.sup=t;b.supT=0;b.supDir=p.dir;b.supBy=p.side;// superstrzał = pewny gol: piłka leci po torze prosto do siatki, nic jej nie zatrzyma
    b.sx=b.x;b.sy=Math.min(b.y,GY-30);b.gx=p.dir>0?W-GW*.35:GW*.35;b.gy=GY-62;b.hit=false;
    b.sdur=clamp(Math.abs(b.gx-b.sx)/(t==='banana'?760:t==='fire'?1150:950),.35,1.05);b.fire=t==='fire'?2:0;
    sfx('super');S.shake=12;S.hs=.1;S.slow=.35;shout(SUPN[t]+'!','gold');burst(b.x,b.y,40,t==='ice'?'#9be7ff':t==='zigzag'?'#fff36b':'#ff7a1a');return true}
  // c = faza zamachu: nisko = płaski strzał, wysoko (koniec litery U) = piłka idzie w górę
  var pow=(620-120*c)*st.kick;
  b.vx=p.dir*pow+p.vx*.25;
  b.vy=-(260+560*c);
  var sp=Math.hypot(b.vx,b.vy);if(sp>1000){b.vx*=1000/sp;b.vy*=1000/sp}
  b.sup=null;b.fire=0;
  p.sup=Math.min(1,p.sup+.028*st.sup);if(p.sup>=1&&!p.supReady){p.supReady=true;if(p.side===0){sfx('ready');addFloat('SUPER! Kopnij piłkę',p.x,p.y-170,'#ffc93c')}}
  sfx('kick',.6);S.shake=Math.max(S.shake,4);burst(b.x,b.y,10,'#fff',280);
  return true;
}
function stepPlayer(p,dt,ctrl){
  var st=stats(p);
  if(p.freeze>0){p.freeze-=dt;ctrl={};p.chg=false;p.charge=0}if(p.stun>0){p.stun-=dt;ctrl={};p.chg=false;p.charge=0}
  if(p.big>0)p.big-=dt;if(p.boots>0)p.boots-=dt;if(p.kickT>0)p.kickT=Math.max(0,p.kickT-dt);if(p.kickCd>0)p.kickCd-=dt;if(p.jumpCd>0)p.jumpCd-=dt;
  if(p.moodT>0){p.moodT-=dt;if(p.moodT<=0)p.mood=null}if(p.land>0)p.land-=dt;
  var ax=(ctrl.r?1:0)-(ctrl.l?1:0),sp=st.spd;
  p.vx+=(ax*sp-p.vx)*Math.min(1,dt*(p.onG?16:7));
  if(ctrl.j&&p.onG&&p.jumpCd<=0){p.vy=-st.jmp;p.onG=false;p.jumpCd=.18;sfx('jump')}
  // strzał: przytrzymaj = mocniej, puść = kop
  // strzał: jedno kliknięcie, noga "szuka" piłki przez cały zamach
  if(ctrl.k&&p.kickCd<=0){p.kickT=SWT;p.kickCd=.36;p.swing=true;sfx('swing')}
  if(p.swing){var fo=footPos(p);if(fo.out){if(doKick(p,fo.k))p.swing=false}else if(p.kickT<=0)p.swing=false}
  p.vy+=2400*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
  if(p.y>=GY){if(!p.onG)p.land=.12;p.y=GY;p.vy=0;p.onG=true}
  p.tilt+=((p.onG?p.vx*.0006:-.12*p.dir*0)-p.tilt)*Math.min(1,dt*10);
  var R=headPos(p).R;p.x=clamp(p.x,GW*.5+R*.5,W-GW*.5-R*.5);
}
function stepBall(dt){
  var b=S.ball;
  if(b.sup){ // tor superstrzału
    b.supT+=dt;var k=Math.min(1,b.supT/b.sdur),ox=b.x,oy=b.y,e=k*k*(3-2*k)*.35+k*.65;
    var x=b.sx+(b.gx-b.sx)*e,y=b.sy+(b.gy-b.sy)*e;
    if(b.sup==='banana')y-=Math.sin(k*PI)*190;
    else if(b.sup==='zigzag')y+=Math.sin(k*PI*7)*46*(1-k*.6);
    else if(b.sup==='ice')y-=Math.sin(k*PI)*40;
    b.x=x;b.y=Math.min(GY-BR,y);b.vx=(b.x-ox)/Math.max(dt,1e-4);b.vy=(b.y-oy)/Math.max(dt,1e-4);b.rot+=b.vx*dt/BR;
    S.P.forEach(function(p){if(p.side===b.supBy||b.hit)return;var h=headPos(p);if(Math.abs(b.x-p.x)<h.R+BR+10&&b.y>h.y-h.R-BR){b.hit=true;S.shake=10;sfx('head');
      if(b.sup==='fire'||b.sup==='banana'){p.stun=1.1;p.vx=-p.dir*420;p.vy=-360;p.onG=false;addFloat('Nokaut!',h.x,h.y-70,'#ff4d6d')}
      else{p.freeze=2.2;sfx('freeze');addFloat(b.sup==='ice'?'Zamrożony!':'Porażony!',h.x,h.y-70,'#35c8ff')}}});
    trail.push({x:b.x,y:b.y,s:b.sup});if(trail.length>14)trail.shift();
    if(k>=1){var sd=b.supBy;b.sup=null;b.fire=0;b.vx*=.25;b.vy=0;goal(sd)}
    return;
  }
  {
    var g=b.sup==='banana'?1750:1250;b.vy+=g*dt;if(b.sup==='banana'){b.supT+=dt;b.vx+=b.supDir*520*dt;if(b.supT>1.6)b.sup=null}
    b.vx*=1-dt*.08;b.x+=b.vx*dt;b.y+=b.vy*dt}
  b.rot+=b.vx*dt/BR;if(b.fire>0)b.fire-=dt;if(b.sup==='fire'&&b.fire<=0)b.sup=null;
  if(b.y>GY-BR){b.y=GY-BR;if(b.vy>120)sfx('bounce');b.vy=-b.vy*.55;b.vx*=.93;if(Math.abs(b.vy)<50)b.vy=0;if(b.sup==='zigzag')b.sup=null}
  if(b.vy===0&&b.y>=GY-BR-.5)b.vx*=1-dt*.9;
  if(b.y<BR){b.y=BR;b.vy=Math.abs(b.vy)*.6}
  [[0,GW],[W-GW,W]].forEach(function(g){
    if(b.x>g[0]-4&&b.x<g[1]+4&&Math.abs(b.y-CROSS)<BR+5){if(b.vy>0&&b.y<CROSS){b.y=CROSS-BR-5;b.vy=-Math.abs(b.vy)*.5;b.vx*=.9;sfx('post')}else if(b.vy<0&&b.y>CROSS){b.y=CROSS+BR+5;b.vy=Math.abs(b.vy)*.4;sfx('post')}}
    var px=g[0]===0?GW:W-GW,dx=b.x-px,dy=b.y-CROSS,d=Math.hypot(dx,dy);if(d<BR+6&&d>0){var nx=dx/d,ny=dy/d,vn=b.vx*nx+b.vy*ny;if(vn<0){b.vx-=1.6*vn*nx;b.vy-=1.6*vn*ny;sfx('post');S.shake=6;addFloat('Słupek!',px,CROSS-40,'#fff')}b.x=px+nx*(BR+6);b.y=CROSS+ny*(BR+6);b.sup=null}});
  if(b.y>CROSS+6){if(b.x<GW-BR*.3)goal(1);else if(b.x>W-GW+BR*.3)goal(0)}
  if(b.x<BR){b.x=BR;b.vx=Math.abs(b.vx)*.6}if(b.x>W-BR){b.x=W-BR;b.vx=-Math.abs(b.vx)*.6}
  S.P.forEach(function(p){
    var h=headPos(p);
    if(b.sup&&b.supBy!==p.side&&Math.hypot(b.x-h.x,b.y-h.y)<h.R+BR+4){
      if(b.sup==='fire'){p.stun=1.1;p.vx=-p.dir*420;p.vy=-360;p.onG=false;addFloat('Nokaut!',h.x,h.y-70,'#ff4d6d')}
      else if(b.sup==='ice'){p.freeze=2.2;sfx('freeze');addFloat('Zamrożony!',h.x,h.y-70,'#35c8ff')}
      if(b.sup==='fire'||b.sup==='ice'){b.vx*=.55;b.sup=null;b.fire=0;S.shake=10;sfx('head');return}
    }
    if(b.sup&&b.supBy!==p.side)b.sup=null;
    collideCircle(h.x,h.y,h.R,p.vx,p.vy,.45,p,'head');
    collideCircle(p.x,p.y-38,22,p.vx,p.vy,.25,p,'body');
    if(p.kickT<=0){var f=footPos(p);collideCircle(f.x,f.y,f.r,p.vx,p.vy,.3,p,'foot')}
  });
  if(S.pk&&Math.hypot(b.x-S.pk.x,b.y-S.pk.y)<BR+28){givePk(S.lastTouch,S.pk.k);S.pk=null;S.pkT=rnd(16,22)}
  trail.push({x:b.x,y:b.y,s:b.sup});if(trail.length>14)trail.shift();
}
function givePk(side,k){
  var p=S.P[side],o=S.P[1-side];sfx(k==='freeze'?'freeze':'power');
  if(k==='big'){p.big=7;addFloat('Wielka głowa!',p.x,p.y-190,'#ffc93c')}
  else if(k==='freeze'){o.freeze=2.4;addFloat('Zamrożony!',o.x,o.y-190,'#35c8ff')}
  else if(k==='boots'){p.boots=7;addFloat('Sprężyny!',p.x,p.y-190,'#16d97d')}
  else if(k==='sup'){p.sup=1;p.supReady=true;addFloat('Supermoc!',p.x,p.y-190,'#ff7a1a')}
}
function goal(side){
  if(S.st!=='play')return;S.sc[side]++;S.st='goal';S.goalT=2.3;S.slow=.7;S.shake=16;S.flash=.3;S.flashCol=side===0?'#16d97d':'#ff4d6d';
  sfx('goal');crowdSet(.22);setTimeout(function(){crowdSet(.06)},1800);confetti(side===0?90:30);
  setMood(S.P[side],'happy',2.4);setMood(S.P[1-side],'sad',2.4);
  shout(side===0?'GOOOL!':'Gol rywala','gold'+(side===1?' red':''));burst(S.ball.x,S.ball.y,50,side===0?'#ffc93c':'#ff4d6d');
  S.nextKick=side===0?1:0;if(S.golden)S.endT=2.3;
}
function endMatch(){
  S.st='over';crowdSet(0);sfx('final');var me=S.sc[0],op=S.sc[1],res=me>op?'win':me<op?'lose':'draw',L=LEAGUE[S.lv];
  var coins=(res==='win'?30+10*S.lv:res==='draw'?12:6)+me*5,stars=0,unlock=null;
  if(res==='win'){stars=1;if(me-op>=2)stars=2;if(me-op>=2&&op===0)stars=3;
    var prev=SV.stars[S.lv]||0;if(stars>prev){SV.stars[S.lv]=stars;coins+=(stars-prev)*15}
    if(S.lv>=SV.next){SV.next=Math.min(LEAGUE.length,S.lv+1)}
    if(SV.own.indexOf(L[0])<0){SV.own.push(L[0]);unlock=L[0]}SV.wins++;sfx('win');confetti(80)}else sfx('lose');
  SV.goals+=me;SV.coins+=coins;save();S.res={res:res,coins:coins,stars:stars,unlock:unlock};
  setTimeout(showResult,900);
}

/* ---------- AI: jasne zasady zamiast losowości ---------- */
function predictX(b,t){var x=b.x+b.vx*t;if(x<BR)x=2*BR-x;if(x>W-BR)x=2*(W-BR)-x;return x}
function brain(p,dt,s0,myGoalRight){
  // Postrzeganie z opóźnieniem (refleks), ruch płynny co klatkę. Skill = refleks + precyzja + decyzje.
  var O=(DEBUG&&window.__gkO&&p.side===1)?window.__gkO:{};function S_(k){return O[k]!=null?O[k]:s0}
  var b=S.ball,o=S.P[1-p.side],c={},sgn=myGoalRight?1:-1,myGX=myGoalRight?W-GW:GW,s=s0;
  p.aiT-=dt;
  if(p.aiT<=0||!p.seen){
    p.aiT=.36-.26*S_(1);
    p.seen={x:b.x,y:b.y,vx:b.vx,vy:b.vy,age:0};
    p.err=(1-S_(2))*rnd(-60,60);
    p.rT=(p.rT||0)-1;if(p.rT<=0){p.rT=5;p.r1=Math.random();p.r2=Math.random();p.r3=Math.random()}
  }
  var sn=p.seen;sn.age+=dt;
  var look=sn.age+.1+.12*S_(2),bx=clamp(sn.x+sn.vx*look,BR,W-BR),by=Math.min(GY-BR,sn.y+sn.vy*look+625*look*look);
  var low=by>GY-110,behind=(bx-p.x)*sgn>6,onMySide=(bx-W/2)*sgn>0,oNear=Math.abs(o.x-bx)<120,oReady=(bx-o.x)*sgn>0;
  var hop=false,kp=null;
  if(sn.vx*sgn>120){ // piłka leci na moją bramkę: znajdź punkt przechwytu
    var q={x:sn.x,y:sn.y,vx:sn.vx,vy:sn.vy},sp=stats(p).spd,t=0,h=1/30;
    for(var i=0;i<45;i++){t+=h;q.vy+=1250*h;q.x+=q.vx*h;q.y+=q.vy*h;if(q.y>GY-BR){q.y=GY-BR;q.vy=-q.vy*.55}if(q.x<BR||q.x>W-BR){q.vx=-q.vx;q.x=clamp(q.x,BR,W-BR)}
      if(t<sn.age)continue;
      if(q.y>GY-235&&Math.abs(q.x-p.x)/sp<=t-sn.age+.05+.12*S_(5)){kp=q;kp.t=t-sn.age;break}}
  }
  if(!kp&&S.koT<1.6&&S.koSide===o.side){p.plan='hold';p.tx=myGX-sgn*(40+20*(1-S_(4)));}
  else if(behind&&sn.vx*sgn>200&&!kp&&p.r1<.4+.6*S_(5)){p.plan='back';p.tx=myGX-sgn*28;}
  else if(kp&&p.r1<.3+.7*S_(5)){
    p.plan='keep';p.tx=kp.x+sgn*(8+p.err*.5);
    if(kp.y<GY-120&&kp.t<.34&&Math.abs(kp.x-p.x)<70)hop=true;
  }else if(behind){
    p.plan='around';p.tx=clamp(bx+sgn*(66+20*S_(3)),GW+30,W-GW-30);
    if(low&&Math.abs(bx-p.x)<80+30*S_(3)&&p.onG)hop=true;
  }else if(((!onMySide&&oNear&&oReady)||(Math.abs(o.x-bx)+40<Math.abs(p.x-bx)&&oReady&&(bx-myGX)*sgn<-260))&&!(Math.abs(bx-p.x)<90)&&p.r1<.25+.7*S_(4)){
    p.plan='hold';p.tx=clamp(bx+(myGX-bx)*(.5+.25*S_(4)),GW+40,W-GW-40);
  }else{
    p.plan='attack';p.tx=bx+sgn*(26+(by<GY-100?14:0))+p.err;
  }
  var dx=p.tx-p.x,dead=8;if(dx<-dead)c.l=1;else if(dx>dead)c.r=1;
  // skok do główki: piłka nad głową i blisko
  var hx=headPos(p),near=Math.abs(bx-p.x)<50+30*S_(6);
  if(p.onG&&p.jumpCd<=0&&(hop||(near&&by<hx.y-20&&by>hx.y-200&&sn.vy>-200&&p.r2<.35+.65*S_(6))))c.j=1;
  // strzał: decyzja raz, przy naciśnięciu
  var f={x:p.x+p.dir*42,y:p.y-34},dB=Math.hypot(b.x-f.x,b.y-f.y),inF=(b.x-p.x)*p.dir>-10;
  if(p.kickCd<=0&&inF&&dB<105&&b.y>GY-140&&p.r3<.55+.45*S_(7))c.k=1;
  return c;
}

/* ---------- pętla ---------- */
function update(rdt){
  S.t+=rdt;if(S.hs>0){S.hs-=rdt;return}
  var dt=rdt;if(S.slow>0){S.slow-=rdt;dt*=.35}
  if(S.shake>0)S.shake=Math.max(0,S.shake-rdt*40);if(S.flash>0)S.flash-=rdt;
  if(S.st==='count'){S.cd-=rdt;var c=Math.ceil(S.cd/.8);if(c!==S.cdLast&&c>=1&&c<=3){S.cdLast=c;shout(String(c),'num');sfx('beep')}if(S.cd<=0){S.st='play';shout('Gramy!','gold');sfx('whistle');crowdSet(.08)}}
  if(S.st==='play'||S.st==='goal'){
    var me=S.P[0],cpu=S.P[1],play=S.st==='play';
    var ctrl=play?(DEBUG&&window.__gkBot?brain(me,dt,window.__gkBot,false):{l:keys.l,r:keys.r,j:keys.j,k:keys.k}):{};
    keys.j=false;keys.k=false;
    stepPlayer(me,dt,ctrl);stepPlayer(cpu,dt,play?brain(cpu,dt,cpu.skill,true):{});
    var h0=headPos(me),h1=headPos(cpu),dx=h1.x-h0.x,dy=h1.y-h0.y,d=Math.hypot(dx,dy),mn=h0.R+h1.R-4;
    if(d<mn&&d>0){var push=(mn-d)/2;me.x-=dx/d*push;cpu.x+=dx/d*push;if(dy/d>.55&&me.vy>0){me.vy=-420;me.onG=false}if(dy/d<-.55&&cpu.vy>0){cpu.vy=-420;cpu.onG=false}}
    if(play){stepBall(dt);S.koT=(S.koT||0)+dt;
      if(!S.golden){S.time-=dt;if(S.time<=0){S.time=0;if(S.sc[0]===S.sc[1]){S.golden=true;shout('Złoty gol!','gold');sfx('whistle')}else endMatch()}}
      else{S.gold+=dt;if(S.gold>30)endMatch()}
      S.pkT-=dt;if(S.pkT<=0&&!S.pk){S.pk={x:rnd(W*.32,W*.68),y:rnd(190,290),k:pick(['big','freeze','boots','sup']),t:0}}
      if(S.pk){S.pk.t+=dt;if(S.pk.t>8){S.pk=null;S.pkT=rnd(12,18)}}
      if(S.time<=10&&S.time>0&&Math.ceil(S.time)!==S.lastSec){S.lastSec=Math.ceil(S.time);sfx('beep')}
    }
    if(S.st==='goal'){var b=S.ball;b.vy+=1250*dt;b.vx*=1-dt*3;b.x=clamp(b.x+b.vx*dt*.3,BR+6,W-BR-6);b.y=Math.min(GY-BR,b.y+b.vy*dt);if(b.y>=GY-BR)b.vy=0;S.goalT-=rdt;
      if(S.goalT<=0){if(S.golden&&S.endT>0){endMatch()}else{S.st='play';S.koT=0;S.koSide=S.nextKick;resetKickoff(S.nextKick);sfx('whistle')}}}
  }
  parts.forEach(function(p){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.conf?60:500)*dt});parts=parts.filter(function(p){return p.t<p.life});
  floats.forEach(function(f){f.t+=rdt});floats=floats.filter(function(f){return f.t<f.life});
}

/* ---------- rysowanie ---------- */
function drawGoal(left){
  var x0=left?0:W-GW,x1=left?GW:W;
  ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(x0,CROSS,GW,GY-CROSS);
  ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=1.5;
  for(var x=x0+8;x<x1;x+=11){ctx.beginPath();ctx.moveTo(x,CROSS);ctx.lineTo(x,GY);ctx.stroke()}
  for(var y=CROSS+10;y<GY;y+=11){ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke()}
  ctx.fillStyle='#ffffff';ctx.fillRect(x0,CROSS-6,GW,10);var px=left?GW:W-GW;ctx.fillRect(px-5,CROSS-6,10,GY-CROSS+6);
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x0,CROSS+4,GW,4);
}
/* głowa w stylu kreskówki: obrys, cieniowanie, oczy śledzą piłkę, mina zależy od sytuacji */
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
function drawHead(p,t){
  var L=HEADS[p.head],h=headPos(p),R=h.R,dir=p.dir,b=S.ball||{x:p.x+dir*100,y:p.y-100};
  var lx=(b.x-h.x)/220,ly=(b.y-h.y)/220,run=p.onG&&Math.abs(p.vx)>40,bob=run?Math.abs(Math.sin(t*14))*3:0,sq=p.land>0?.9:1;
  // cień
  ctx.fillStyle='rgba(0,0,0,.3)';var hk=clamp(1-(GY-p.y)/300,.3,1);ctx.beginPath();ctx.ellipse(p.x,GY+3,40*hk,8*hk,0,0,TAU);ctx.fill();
  // nogi: dwie, kopiąca wysuwa się do przodu
  var f=footPos(p),bk={x:p.x-dir*12,y:p.y-8},rs=run&&p.kickT<=0?Math.sin(t*14)*7:0,fx=f.x+rs*dir,bx2=bk.x-rs*dir,BC=p.side===0?'#16d97d':'#ff3d7f';
  function leg(x0,x1,y1){ctx.lineCap='round';ctx.strokeStyle='rgba(20,14,40,.9)';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(x0,p.y-20);ctx.lineTo(x1,y1);ctx.stroke();ctx.strokeStyle='#f4f4f4';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x0,p.y-20);ctx.lineTo(x1,y1);ctx.stroke();ctx.lineCap='butt'}
  function boot(x,y,rot){ctx.save();ctx.translate(x,y);ctx.scale(dir,1);ctx.rotate(rot);ctx.fillStyle=BC;rr(-12,-9,34,18,8);ctx.fill();ctx.strokeStyle='rgba(20,14,40,.9)';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(2,-3,11,3.2);ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillRect(-10,5,30,3);ctx.restore()}
  leg(p.x-dir*8,bx2,bk.y);boot(bx2,bk.y,0);
  var OL='rgba(20,14,40,.9)';ctx.fillStyle=L.sh;ctx.strokeStyle=OL;ctx.lineWidth=3;rr(p.x-22,p.y-62-bob,44,40,12);ctx.fill();ctx.stroke();
  ctx.fillStyle=L.sh==='#ffffff'||L.sh==='#ffc93c'?'#10204a':'#ffffff';ctx.font='400 15px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.side===0&&p.head===0?'Q':String(p.head+1),p.x,p.y-42-bob);
  ctx.fillStyle='#10204a';rr(p.x-18,p.y-26,36,13,5);ctx.fill();ctx.stroke();
  leg(p.x+dir*8,fx-dir*6,f.y);boot(fx,f.y,-f.a*.55);
  if(p.kickT>0&&f.a>.2){var cy0=p.y-8-SWR,cx0=p.x+dir*13;ctx.strokeStyle='rgba(255,255,255,'+(.25+.35*f.k)+')';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();for(var q=0;q<=12;q++){var aa=f.a*q/12;var X=cx0+dir*Math.sin(aa)*SWR,Y=cy0+Math.cos(aa)*SWR;q?ctx.lineTo(X,Y):ctx.moveTo(X,Y)}ctx.stroke();ctx.lineCap='butt'}
  // ładowanie strzału
  if(p.sup>=1){var pu=.5+.5*Math.sin(t*10);ctx.save();ctx.globalCompositeOperation='lighter';var fg=ctx.createRadialGradient(f.x,f.y,2,f.x,f.y,34);fg.addColorStop(0,'rgba(255,170,40,'+(.7+.3*pu)+')');fg.addColorStop(1,'rgba(255,90,20,0)');ctx.fillStyle=fg;circ(f.x,f.y,34);ctx.fill();ctx.restore()}
  // głowa
  ctx.save();ctx.translate(h.x,h.y-bob+R*(1-sq));ctx.scale(1/sq*.98+.02,sq);ctx.translate(-h.x,-h.y);
  headArt(h.x,h.y,R,L,dir,lx,ly,p.freeze>0?'frozen':p.stun>0?'sad':p.kickT>0?'kick':p.mood,p.tilt+(p.onG?0:-.08*dir));
  ctx.restore();
  if(p.freeze>0){ctx.fillStyle='rgba(160,220,255,.42)';rr(h.x-R*1.2,h.y-R*1.3,R*2.4,R*2.4+70,16);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=2.5;ctx.stroke()}
  if(p.stun>0){for(var s2=0;s2<3;s2++){var a=t*6+s2*TAU/3;ctx.fillStyle='#ffc93c';ctx.save();ctx.translate(h.x+Math.cos(a)*R*.8,h.y-R*1.15+Math.sin(a)*8);ctx.beginPath();for(var i2=0;i2<10;i2++){var aa=-PI/2+i2*PI/5,q2=i2%2?3:8;ctx[i2?'lineTo':'moveTo'](Math.cos(aa)*q2,Math.sin(aa)*q2)}ctx.fill();ctx.restore()}}
  if(p.sup>=1){ctx.strokeStyle='rgba(255,160,40,'+(.45+.35*Math.sin(t*9))+')';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(h.x,h.y,R+8,R*1.04+8,0,0,TAU);ctx.stroke()}
  if(p.sup>=1){var ty=h.y-R-26+Math.sin(t*8)*3;ctx.font='400 20px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';var tw=ctx.measureText('SUPER!').width+18;
    ctx.fillStyle='#ff7a1a';rr(h.x-tw/2,ty-13,tw,26,13);ctx.fill();ctx.fillStyle='#fff';ctx.fillText('SUPER!',h.x,ty+1);ctx.textBaseline='alphabetic'}
}
function drawBall(){
  var b=S.ball,col=b.sup==='fire'?'255,122,26':b.sup==='ice'?'155,231,255':b.sup==='zigzag'?'255,243,107':b.sup==='banana'?'255,214,64':'255,255,255';
  ctx.lineCap='round';for(var i=1;i<trail.length;i++){var a=trail[i-1],c=trail[i],k=i/trail.length;ctx.strokeStyle='rgba('+(c.s?col:'255,255,255')+','+(k*(c.s?.9:.25))+')';ctx.lineWidth=BR*1.6*k*(c.s?1.5:1);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(c.x,c.y);ctx.stroke()}ctx.lineCap='butt';
  ctx.fillStyle='rgba(0,0,0,.28)';var hk=clamp(1-(GY-b.y)/400,.2,1);ctx.beginPath();ctx.ellipse(b.x,GY+2,BR*hk,BR*.3*hk,0,0,TAU);ctx.fill();
  if(b.sup){var gl=ctx.createRadialGradient(b.x,b.y,4,b.x,b.y,BR*3);gl.addColorStop(0,'rgba('+col+',.85)');gl.addColorStop(1,'rgba('+col+',0)');ctx.fillStyle=gl;circ(b.x,b.y,BR*3);ctx.fill()}
  ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rot);ctx.fillStyle='#fff';circ(0,0,BR);ctx.fill();ctx.save();circ(0,0,BR);ctx.clip();ctx.fillStyle='#1b2233';
  function pent(px,py,r){ctx.beginPath();for(var i=0;i<5;i++){var a=-PI/2+i*TAU/5;ctx[i?'lineTo':'moveTo'](px+Math.cos(a)*r,py+Math.sin(a)*r)}ctx.closePath();ctx.fill()}
  pent(0,0,BR*.36);for(var j=0;j<5;j++){var a2=-PI/2+j*TAU/5+PI/5;pent(Math.cos(a2)*BR,Math.sin(a2)*BR,BR*.36)}ctx.restore();
  ctx.strokeStyle='rgba(20,14,40,.8)';ctx.lineWidth=2;circ(0,0,BR);ctx.stroke();ctx.restore();
}
function drawPk(){var p=S.pk;if(!p)return;var cols={big:'#ffc93c',freeze:'#35c8ff',boots:'#16d97d',sup:'#ff7a1a'};
  var c=cols[p.k],y=p.y+Math.sin(p.t*2.5)*6,g=ctx.createRadialGradient(p.x,y,4,p.x,y,44);g.addColorStop(0,c);g.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=.5+.2*Math.sin(S.t*6);ctx.fillStyle=g;circ(p.x,y,44);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle='rgba(6,14,32,.88)';circ(p.x,y,24);ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=3;ctx.stroke();ctx.fillStyle=c;ctx.font='400 24px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('?',p.x,y+1);
  ctx.font='700 13px Barlow, Arial, sans-serif';ctx.lineWidth=4;ctx.strokeStyle='rgba(6,14,32,.9)';var lb={big:'WIELKA GŁOWA',freeze:'ZAMRAŻACZ',boots:'SPRĘŻYNY',sup:'SUPERMOC'}[p.k];ctx.strokeText(lb,p.x,y-38);ctx.fillText(lb,p.x,y-38)}
var pcv={};
function portraitCanvas(ix){if(pcv[ix])return pcv[ix];var c=document.createElement('canvas');c.width=c.height=160;var old=ctx;ctx=c.getContext('2d');headArt(78,86,58,HEADS[ix],1,.4,0,null,0);ctx=old;return pcv[ix]=c}
function miniHead(x,y,R,ix,dir){var c=portraitCanvas(ix);ctx.save();if(dir<0){ctx.translate(x,0);ctx.scale(-1,1);ctx.translate(-x,0)}ctx.drawImage(c,x-R*1.4,y-R*.1,R*2.8,R*2.8);ctx.restore()}
function drawHud(){
  var L=LEAGUE[S.lv],me=HEADS[S.P[0].head],op=HEADS[S.P[1].head];
  ctx.fillStyle='rgba(6,14,32,.9)';rr(W/2-240,10,480,72,20);ctx.fill();ctx.strokeStyle='rgba(77,107,255,.6)';ctx.lineWidth=2;ctx.stroke();
  miniHead(W/2-204,12,22,S.P[0].head,1);miniHead(W/2+204,12,22,S.P[1].head,-1);
  ctx.fillStyle='#fff';ctx.font='400 46px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(S.sc[0]+'  :  '+S.sc[1],W/2,42);
  ctx.font='700 12px Barlow, Arial, sans-serif';ctx.fillStyle='#a9bee3';ctx.textAlign='left';ctx.fillText(me.n.toUpperCase(),W/2-172,24);ctx.textAlign='right';ctx.fillText(op.n.toUpperCase(),W/2+172,24);
  var low=S.time<=10&&!S.golden;ctx.fillStyle=S.golden?'#ffc93c':low?'#e5243b':'#16d97d';rr(W/2-54,80,108,30,15);ctx.fill();ctx.fillStyle=S.golden||!low?'#062312':'#fff';ctx.font='400 20px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.fillText(S.golden?'ZŁOTY GOL':mmss(S.time),W/2,96);
  [0,1].forEach(function(s){var p=S.P[s],x=s===0?W/2-232:W/2+84,full=p.sup>=1;ctx.fillStyle='rgba(6,14,32,.85)';rr(x,86,148,20,10);ctx.fill();
    var g=ctx.createLinearGradient(x,0,x+148,0);g.addColorStop(0,'#ff7a1a');g.addColorStop(1,'#ffc93c');ctx.fillStyle=g;if(p.sup>0){rr(x+2,88,Math.max(12,144*p.sup),16,8);ctx.fill()}
    ctx.fillStyle=full?'#2a1200':'#fff';ctx.font='700 11px Barlow, Arial, sans-serif';ctx.textAlign='center';var tx0=full?(p.side===0?'SUPER! KOPNIJ PIŁKĘ':SUPN[HEADS[p.head].sp].toUpperCase()):'SUPERMOC';if(ctx.measureText(tx0).width>136)ctx.font='700 9px Barlow, Arial, sans-serif';ctx.fillText(tx0,x+74,97);
    if(full&&s===0){ctx.strokeStyle='rgba(255,201,60,'+(.5+.5*Math.sin(S.t*8))+')';ctx.lineWidth=3;rr(x-2,84,152,24,12);ctx.stroke()}});
  ctx.fillStyle='rgba(255,255,255,.75)';ctx.font='700 12px Barlow, Arial, sans-serif';ctx.textAlign='left';ctx.fillText(L[2].toUpperCase()+' · MECZ '+(S.lv+1)+'/'+LEAGUE.length,14,24);
  ctx.textBaseline='alphabetic';
}
function render(){
  ctx.setTransform(scale,0,0,scale,0,0);if(S.shake>0)ctx.translate(rnd(-1,1)*S.shake*.5,rnd(-1,1)*S.shake*.5);
  ctx.drawImage(bg,0,0,W,H);
  drawBoards(themeOf(S.P.length?S.lv:9),GY-40,40);
  drawGoal(true);drawGoal(false);
  if(S.P.length){drawPk();S.P.forEach(function(p){drawHead(p,S.t)});drawBall()}
  drawWeather(themeOf(S.P.length?S.lv:9),S.t,1/60,GY);
  parts.forEach(function(p){var a=1-p.t/p.life;ctx.globalAlpha=Math.max(0,a);ctx.fillStyle=p.col;if(p.conf){ctx.fillRect(p.x,p.y,p.sz,p.sz*.5)}else{circ(p.x,p.y,p.sz*a+.5);ctx.fill()}});ctx.globalAlpha=1;
  floats.forEach(function(f){var k=f.t/f.life;ctx.globalAlpha=k<.7?1:1-(k-.7)/.3;ctx.font='400 28px Anton, Impact, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=6;ctx.strokeStyle='rgba(6,14,32,.9)';ctx.strokeText(f.txt,f.x,f.y-k*50);ctx.fillStyle=f.col;ctx.fillText(f.txt,f.x,f.y-k*50)});ctx.globalAlpha=1;
  if(S.flash>0){ctx.globalAlpha=S.flash*.8;ctx.fillStyle=S.flashCol;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}
  if(S.P.length&&S.st!=='menu'&&!window.__noHud)drawHud();
  if((S.st==='play'||S.st==='count')&&S.t-(S.t0||0)<7){ctx.globalAlpha=.85;ctx.fillStyle='rgba(6,14,32,.88)';rr(W/2-350,H-46,700,36,18);ctx.fill();ctx.fillStyle='#fff';ctx.font='700 16px Barlow, Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(TOUCH?'STRZAŁ: kopnij piłkę · pełny pasek = następny strzał to SUPER':'Strzałki: bieg i skok · Spacja: strzał · pełny pasek = SUPERSTRZAŁ (pewny gol)',W/2,H-28);ctx.globalAlpha=1;ctx.textBaseline='alphabetic'}
}
var last=0;
function frame(ts){var dt=Math.min(.033,(ts-last)/1000||0);last=ts;var ns=DEBUG?(window.__gkTS||1):1;for(var k=0;k<ns;k++)update(dt);render();requestAnimationFrame(frame)}
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
  S.st='menu';crowdSet(0);buildBg(9);S.P=[];
  var nx=nextLv(),L=LEAGUE[nx];
  showOv('<p class="lt-kick">Gra Qastrod</p><h2 class="lt-title">1v1 <em>Główkami</em></h2>'+
   '<div class="gk-vs"><img alt="" src="'+portrait(SV.head)+'"><b>VS</b><img alt="" src="'+portrait(L[0])+'"></div>'+
   '<p class="lt-chip">'+L[2]+' <b>Mecz '+(nx+1)+'/'+LEAGUE.length+'</b></p>'+
   '<button class="lt-btn go" data-a="play">'+(hasProg()?'&#9654; Kontynuuj: ':'&#9917; Graj: ')+HEADS[L[0]].n+'</button>'+(hasProg()?'<button class="lt-link" data-a="newgame">Nowa gra</button>':'')+
   iconRow([['league','&#127942;','Liga',(SV.next)+'/'+LEAGUE.length],['upg','&#128295;','Szatnia',num(SV.coins)],['heads','&#128578;','Postacie',SV.own.length+'/'+HEADS.length]]),'menu gk-menu');
}
function showLeague(){
  var h='<h2 class="lt-h">Liga</h2><div class="gk-league">';
  LEAGUE.forEach(function(L,i){var open=i<=SV.next,st=SV.stars[i]||0;
    h+='<button class="gk-opp'+(open?'':' lock')+(i===SV.next?' cur':'')+'" data-a="lv" data-i="'+i+'"'+(open?'':' disabled')+'>'+(open?'<img alt="" src="'+portrait(L[0])+'">':'<i>&#128274;</i>')+
      '<b>'+(open?HEADS[L[0]].n:'???')+'</b><span>'+L[2]+'</span><em>'+starsTxt(st)+'</em></button>'});
  h+='</div><button class="lt-btn" data-a="back">&lsaquo; Wróć</button>';showOv(h,'wide');
}
function showHeads(){
  var h='<h2 class="lt-h">Postacie</h2><p class="lt-meta">Pokonaj rywala, żeby grać jego głową</p><div class="gk-league heads">';
  HEADS.forEach(function(H2,i){var own=SV.own.indexOf(i)>=0,sel=SV.head===i;
    h+='<button class="gk-opp'+(own?'':' lock')+(sel?' cur':'')+'" data-a="pickh" data-i="'+i+'"'+(own?'':' disabled')+'>'+(own?'<img alt="" src="'+portrait(i)+'">':'<i>&#128274;</i>')+'<b>'+(own?H2.n:'???')+'</b><span>'+(own?SUPN[H2.sp]:'Zablokowany')+'</span>'+(sel?'<em>Wybrany</em>':'')+'</button>'});
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
  showOv('<p class="lt-kick">'+L[2]+' &middot; mecz '+(lv+1)+'</p><div class="gk-vs big"><div><img alt="" src="'+portrait(SV.head)+'"><b>'+HEADS[SV.head].n+'</b></div><strong>VS</strong><div><img alt="" src="'+portrait(L[0])+'"><b>'+HEADS[L[0]].n+'</b></div></div>'+
   '<div class="lt-how"><span><i>&#11013;&#65039;&#10145;&#65039;</i>Bieg</span><span><i>&#11014;&#65039;</i>Skok</span><span><i>&#9917;</i>'+(TOUCH?'STRZAŁ':'Spacja')+' = strzał</span><span><i>&#128293;</i>Pełny pasek = super</span></div>'+
   '<button class="lt-btn go" data-a="kick">&#9917; Start!</button><button class="lt-link" data-a="back">Wróć</button>','menu');
}
function nextHint(){var best=null;UPG.forEach(function(u){if(SV.up[u[0]]>=u[4])return;var c=upCost(u[0]);if(!best||c<best.c)best={n:u[1],c:c}});if(!best)return '';
  return SV.coins>=best.c?'<button class="lt-nudge ok" data-a="upg">&#128295; Kup: <b>'+best.n+'</b> &rsaquo;</button>':'<p class="lt-nudge">Jeszcze <b>'+num(best.c-SV.coins)+'</b> monet do: '+best.n+'</p>'}
function showResult(){
  var r=S.res,win=r.res==='win',last=S.lv>=LEAGUE.length-1;
  var t=win?'Wygrana!':r.res==='draw'?'Remis':'Porażka';
  showOv('<p class="lt-kick">'+LEAGUE[S.lv][2]+' &middot; mecz '+(S.lv+1)+'</p><h2 class="lt-h big">'+(win?'<em>'+t+'</em>':t)+'</h2>'+
   '<div class="gk-vs"><img alt="" src="'+portrait(S.P[0].head)+'"><b>'+S.sc[0]+' : '+S.sc[1]+'</b><img alt="" src="'+portrait(S.P[1].head)+'"></div>'+
   (win?'<div class="lt-stars">'+[0,1,2].map(function(i){return '<i class="'+(i<r.stars?'on a':'')+'" style="animation-delay:'+(.2+i*.25)+'s">&#9733;</i>'}).join('')+'</div>':'<p class="lt-meta">Wygraj 2 golami i bez straty gola, żeby mieć 3 gwiazdki</p>')+
   (r.unlock!=null?'<p class="lt-nudge ok">Nowa postać: <b>'+HEADS[r.unlock].n+'</b></p>':'')+
   '<div class="lt-chips"><span><i>&#129689;</i>+'+r.coins+'</span><span><i>&#9917;</i>'+S.sc[0]+' gol'+(S.sc[0]===1?'':'e')+'</span></div>'+
   (win&&!last?'<button class="lt-btn go again" data-a="next">Następny mecz &rsaquo;</button>':'<button class="lt-btn go again" data-a="retry">&#8635; '+(win?'Zagraj jeszcze raz':'Rewanż')+'</button>')+nextHint()+
   iconRow([['league','&#127942;','Liga',null],['upg','&#128295;','Szatnia',num(SV.coins)],['heads','&#128578;','Postacie',null],['menu','&#8962;','Menu',null]]),'over');
}
function showPause(){showOv('<h2 class="lt-h big">Pauza</h2><button class="lt-btn go" data-a="resume">&#9654; Wznów</button>'+iconRow([['mute',SV.muted?'&#128263;':'&#128266;',SV.muted?'Dźwięk wył.':'Dźwięk wł.',null],['quit','&#9209;&#65039;','Poddaj',null]]),'pause')}
var backTo='menu',pausedFrom=null;
function pause(){if(S.st==='play'||S.st==='count'||S.st==='goal'){pausedFrom=S.st;S.st='pause';crowdSet(0);showPause()}}
function resume(){if(S.st==='pause'){S.st=pausedFrom;hideOv();crowdSet(.08)}}

/* ---------- sterowanie ---------- */
var KM={ArrowLeft:'l',a:'l',A:'l',ArrowRight:'r',d:'r',D:'r',ArrowUp:'j',w:'j',W:'j',' ':'k',s:'k',S:'k',ArrowDown:'k'};
window.addEventListener('keydown',function(e){var k=KM[e.key],inView=root.getBoundingClientRect().top<innerHeight*.6;
  if(S.st==='play'||S.st==='count'||S.st==='goal'){if(k){e.preventDefault();if(k==='k'){if(!e.repeat)keys.k=true}else if(k==='j'){if(!e.repeat)keys.j=true}else keys[k]=true}if(e.key==='p'||e.key==='P'||e.key==='Escape')pause();return}
  if(S.st==='pause'&&(e.key==='p'||e.key==='P'||e.key==='Escape'))resume();
  if(S.st==='over'&&(e.key===' '||e.key==='Enter')&&inView){e.preventDefault();var n=ov.querySelector('[data-a=next],[data-a=retry]');if(n)n.click()}
  if(e.key==='m'||e.key==='M'){SV.muted=!SV.muted;save();syncBar()}});
window.addEventListener('keyup',function(e){var k=KM[e.key];if(k==='l'||k==='r')keys[k]=false});
// przyciski dotykowe
var pad=root.querySelector('.gk-pad');
if(pad){pad.addEventListener('pointerdown',function(e){var b=e.target.closest('[data-k]');if(!b)return;e.preventDefault();unlockAudio();var k=b.getAttribute('data-k');if(k==='k'||k==='j')keys[k]=true;else keys[k]=true;b.classList.add('on');try{b.setPointerCapture(e.pointerId)}catch(x){}});
  ['pointerup','pointercancel','pointerleave'].forEach(function(ev){pad.addEventListener(ev,function(e){var b=e.target.closest('[data-k]');if(!b)return;var k=b.getAttribute('data-k');if(k==='l'||k==='r')keys[k]=false;b.classList.remove('on')})});
  pad.addEventListener('contextmenu',function(e){e.preventDefault()})}
root.addEventListener('click',function(e){
  var b=e.target.closest('[data-a]');if(!b||b.disabled)return;unlockAudio();var a=b.getAttribute('data-a');
  switch(a){
    case 'play':showVs(nextLv());break;
    case 'kick':S.t0=S.t;startMatch(S.pending);break;
    case 'lv':showVs(+b.getAttribute('data-i'));break;
    case 'next':showVs(Math.min(LEAGUE.length-1,S.lv+1));break;
    case 'retry':S.t0=S.t;startMatch(S.lv);break;
    case 'league':backTo=S.st==='over'?'over':'menu';showLeague();break;
    case 'heads':if(!ov.querySelector('.gk-league')||!ov.querySelector('[data-a=pickh]'))backTo=S.st==='over'?'over':'menu';showHeads();break;
    case 'upg':if(!ov.querySelector('.lt-ugrid'))backTo=S.st==='over'?'over':'menu';showUpg();break;
    case 'back':if(backTo==='over')showResult();else showMenu();break;
    case 'up':var k=b.getAttribute('data-k'),c=upCost(k);if(SV.coins>=c){SV.coins-=c;SV.up[k]++;save();sfx('buy')}showUpg();break;
    case 'pickh':SV.head=+b.getAttribute('data-i');save();sfx('buy');showHeads();break;
    case 'menu':showMenu();break;
    case 'newgame':showOv('<h2 class="lt-h">Nowa gra?</h2><p class="lt-meta">Postęp, monety i ulepszenia zostaną wyczyszczone. Zaczniesz od zera.</p><button class="lt-btn go" data-a="newok">Tak, zacznij od nowa</button><button class="lt-link" data-a="menu">Anuluj</button>','menu');break;
    case 'newok':var mu=SV.muted,d=JSON.parse(SVDEF);Object.keys(SV).forEach(function(k){delete SV[k]});Object.assign(SV,d);SV.muted=mu;save();showMenu();toast('Nowa gra! Powodzenia');break;
    case 'pause':if(S.st==='pause')resume();else pause();break;
    case 'resume':resume();break;
    case 'quit':S.sc[1]=Math.max(S.sc[1],S.sc[0]+1);S.st='play';hideOv();endMatch();break;
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
if(DEBUG)window.__gk={S:S,SV:SV,startMatch:startMatch,endMatch:endMatch,save:save,keys:keys,update:update};
})();
