/* ZGADNIJ PIOSENKĘ · gra Qastrod.pl · fragment piosenki z kanału, 4 odpowiedzi, 10 rund */
(function(){
'use strict';
var root=document.getElementById('zp');if(!root)return;
var DEBUG=/[?&]debug=1/.test(location.search);
var ALL=(window.QD&&QD.songs||[]).filter(function(s){return s.i&&s.t});
var ROUNDS=10,KEY='qastrod_zgadnij_v1';
var SV={best:0,games:0,muted:false};
try{var d0=JSON.parse(localStorage.getItem(KEY)||'null');if(d0)for(var k in SV)if(d0[k]!==undefined)SV[k]=d0[k]}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(SV))}catch(e){}}
function rnd(a,b){return a+Math.random()*(b-a)}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function label(t){
  var s=t.replace(/\s*[-|]\s*tekst:.*$/i,'').replace(/\s*\|\s*Piosenka.*$/i,'').replace(/\s*-\s*Piosenka\s*$/i,'').replace(/^Piosenka\s*-\s*/i,'');
  return s.length>58?s.slice(0,56)+'…':s}

/* ---------- dźwięk (delikatny) ---------- */
var AC=null;function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC}
function tone(f,d,type,vol,delay){var a=ac();if(!a||SV.muted)return;var t=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.value=f;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol||.12,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.05)}
var SFX={ok:function(){[660,880,1320].forEach(function(f,i){tone(f,.22,'sine',.12,i*.07)})},bad:function(){tone(220,.28,'triangle',.12);tone(165,.35,'triangle',.1,.12)},
  tick:function(){tone(1200,.04,'square',.03)},end:function(){[523,659,784,1047].forEach(function(f,i){tone(f,.3,'triangle',.12,i*.1)})}};
function sfx(n){try{SFX[n]()}catch(e){}}

/* ---------- odtwarzacz YouTube ---------- */
var YTP=null,ytReady=false,pendingPlay=null,mock=DEBUG&&/[?&]mock=1/.test(location.search),LOCAL=location.protocol==='file:',fails=0,wd1=0,wd2=0;
var ytLoading=false,ytBroken=false;
function loadYT(){if(mock){ytReady=true;return}if(ytLoading||YTP)return;ytLoading=true;if(window.YT&&YT.Player){makePlayer();return}
  var s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';s.onerror=function(){ytBroken=true;if(S.st==='load')noYT()};document.head.appendChild(s);
  window.onYouTubeIframeAPIReady=makePlayer}
function makePlayer(){
  YTP=new YT.Player('zpPlayer',{width:'100%',height:'100%',host:'https://www.youtube-nocookie.com',
    playerVars:{controls:0,cc_load_policy:0,autoplay:1,disablekb:1,fs:0,iv_load_policy:3,modestbranding:1,playsinline:1,rel:0,origin:(location.protocol.indexOf('http')===0?location.origin:undefined)},
    events:{onReady:function(){ytReady=true;if(pendingPlay){var p=pendingPlay;pendingPlay=null;p()}},
      onError:function(e){if(S.st==='play'||S.st==='load')songFailed()},
      onStateChange:function(e){if(e.data===1){fails=0;clearWd();if(S.st==='load')startTimer()}}}})}
function playSong(id,start){
  if(mock){setTimeout(function(){if(S.st==='load')startTimer()},300);return}
  clearWd();
  wd1=setTimeout(function(){if(S.st==='load')resumeSong()},4000);
  wd2=setTimeout(function(){if(S.st==='load')stuck()},8000);
  var go=function(){try{YTP.loadVideoById({videoId:id,startSeconds:start});YTP.unMute();YTP.setVolume(SV.muted?0:90)}catch(e){songFailed()}};
  if(ytBroken){noYT();return}if(ytReady&&YTP)go();else{pendingPlay=go;loadYT()}}
function clearWd(){clearTimeout(wd1);clearTimeout(wd2)}
function stuck(){var w=$('#zpWait');if(w)w.innerHTML='Fragment się nie włączył. <button class="zp-btn go sm" data-a="kick">&#9654; Puść fragment</button> <button class="zp-btn ghost sm" data-a="skip">Inna piosenka</button>'}
function noYT(){S.st='menu';clearWd();pauseSong();cover(true);show('<div class="zp-menu"><p class="zp-kick">Ups</p><h2 class="zp-title">Nie mogę <em>puścić muzyki</em></h2>'+'<p class="zp-lead">'+(LOCAL?'YouTube nie odtwarza filmów w pliku otwartym z dysku. Zagraj na <b>qastrod.pl/gra-zgadnij-piosenke</b>.':'Nie udało się połączyć z YouTube. Sprawdź internet albo wyłącz blokadę reklam dla tej strony i spróbuj jeszcze raz.')+'</p>'+'<button class="zp-btn go" data-a="start">&#8635; Spróbuj ponownie</button></div>')}
function pauseSong(){try{if(YTP&&YTP.pauseVideo)YTP.pauseVideo()}catch(e){}}
function resumeSong(){try{if(YTP&&YTP.playVideo)YTP.playVideo()}catch(e){}}

/* ---------- stan gry ---------- */
var S={st:'menu',round:0,score:0,streak:0,best:0,correct:0,q:null,used:{},timer:0,left:0,raf:0,history:[]};
function pool(round){var lim=round<3?30:round<7?90:ALL.length;return ALL.filter(function(s){return (s.r||999)<=lim&&!S.used[s.i]})}
function makeQ(){
  var p=pool(S.round);if(!p.length)p=ALL.filter(function(s){return !S.used[s.i]});
  var ans=p[Math.floor(Math.random()*p.length)];S.used[ans.i]=1;
  var cat=(ans.c||[])[0],ent=(ans.e||[])[0];
  var others=ALL.filter(function(s){return s.i!==ans.i&&(!ent||(s.e||[])[0]!==ent)});
  var same=shuffle(others.filter(function(s){return (s.c||[])[0]===cat})),rest=shuffle(others.filter(function(s){return (s.c||[])[0]!==cat}));
  var opts=[ans],seen={};seen[label(ans.t)]=1;
  same.concat(rest).some(function(s){var l=label(s.t);if(seen[l])return false;seen[l]=1;opts.push(s);return opts.length>=4});
  var clip=S.round<3?10:S.round<7?8:6;
  return {ans:ans,opts:shuffle(opts),clip:clip,start:Math.round(rnd(38,70)),tries:0}}
function songFailed(){fails++;if(fails>=3){fails=0;noYT();return}if(S.q)S.q.tries++;S.used[S.q?S.q.ans.i:'']=1;if(S.q&&S.q.tries>3){S.q=makeQ()}else S.q=makeQ();renderRound();playSong(S.q.ans.i,S.q.start)}

/* ---------- widoki ---------- */
var $=function(s){return root.querySelector(s)};
var view=$('.zp-view');
function show(html){view.innerHTML=html}
function rankOf(c){return c>=10?['Qastrod Master','&#128081;']:c>=9?['Legenda trybun','&#127942;']:c>=7?['Ekspert Qastroda','&#11088;']:c>=4?['Ultras','&#128227;']:['Kibic z trybun','&#127903;&#65039;']}
function menu(){
  S.st='menu';pauseSong();cover(true);
  show('<div class="zp-menu"><p class="zp-kick">Gra Qastrod</p><h2 class="zp-title">Zgadnij <em>piosenkę</em></h2>'+
   '<p class="zp-lead">Leci fragment piosenki z kanału Qastrod. Zgadnij, co to za utwór, zanim skończy się czas.</p>'+
   '<div class="zp-how"><span>&#127925; 10 rund</span><span>&#9201;&#65039; coraz krótsze fragmenty</span><span>&#128293; seria = bonus</span></div>'+
   (SV.best?'<p class="zp-chip">&#127942; Twój rekord: <b>'+SV.best+' pkt</b></p>':'')+
   '<button class="zp-btn go" data-a="start">&#9654; Graj</button>'+
   (LOCAL&&!mock?'<p class="zp-note warn">Otwierasz plik z dysku: YouTube tu nie zagra. Pełna gra działa na qastrod.pl. <a href="?debug=1&amp;mock=1">Tryb próbny bez muzyki</a></p>':'<p class="zp-note">Włącz dźwięk &#128266;</p>')+'</div>')}
function start(){if(ytBroken&&!LOCAL){ytBroken=false;ytLoading=false;loadYT()}if(!ALL.length)ALL=(window.QD&&QD.songs||[]).filter(function(s){return s.i&&s.t});ac();S.round=0;S.score=0;S.streak=0;S.best=0;S.correct=0;S.used={};S.history=[];nextRound()}
function nextRound(){
  if(S.round>=ROUNDS){finish();return}
  S.q=makeQ();S.st='load';cover(true);renderRound();playSong(S.q.ans.i,S.q.start)}
function hud(){return '<div class="zp-hud"><span class="zp-r">Runda <b>'+(S.round+1)+'</b>/'+ROUNDS+'</span><span class="zp-s"><b id="zpScore">'+S.score+'</b> pkt</span>'+
  (S.streak>=2?'<span class="zp-streak">&#128293; x'+S.streak+'</span>':'<span class="zp-streak off">&#128293;</span>')+'</div>'}
function renderRound(){
  var q=S.q;
  show(hud()+'<p class="zp-q">Co to za piosenka?</p>'+
   '<div class="zp-timer"><i id="zpBar"></i></div>'+
   '<div class="zp-opts">'+q.opts.map(function(o,i){return '<button class="zp-opt" data-a="ans" data-i="'+i+'"><span class="zp-k">'+'ABCD'[i]+'</span><span class="zp-l">'+esc(label(o.t))+'</span></button>'}).join('')+'</div>'+
   '<p class="zp-wait" id="zpWait">&#127911; Ładuję fragment...</p>')}
function startTimer(){
  if(S.st!=='load')return;S.st='play';var w=$('#zpWait');if(w)w.textContent='Słuchaj i wybierz odpowiedź';
  S.timer=S.q.clip;S.left=S.q.clip;var t0=performance.now(),lastSec=Math.ceil(S.left);
  cancelAnimationFrame(S.raf);
  (function tick(){if(S.st!=='play')return;var el=(performance.now()-t0)/1000;S.left=Math.max(0,S.timer-el);
    var b=$('#zpBar');if(b){b.style.width=(S.left/S.timer*100)+'%';b.className=S.left<3?'low':''}
    var cs=Math.ceil(S.left);if(cs!==lastSec&&cs<=3&&cs>0){lastSec=cs;sfx('tick')}
    if(S.left<=0){answer(-1);return}S.raf=requestAnimationFrame(tick)})()}
function answer(i){
  if(S.st!=='play'&&!(S.st==='load'&&i>=0))return;
  var q=S.q,ok=i>=0&&q.opts[i]===q.ans,pts=0;S.st='reveal';cancelAnimationFrame(S.raf);
  if(ok){S.streak++;S.correct++;S.best=Math.max(S.best,S.streak);pts=Math.round((100+Math.round(S.left*15))*(S.streak>=3?1.5:1));S.score+=pts;sfx('ok')}else{S.streak=0;sfx('bad')}
  S.history.push(ok?'g':'x');
  root.querySelectorAll('.zp-opt').forEach(function(b,j){b.disabled=true;if(q.opts[j]===q.ans)b.classList.add('ok');else if(j===i)b.classList.add('bad');else b.classList.add('dim')});
  cover(false);if(!ok&&i<0)resumeSong();
  var yt='https://www.youtube.com/watch?v='+q.ans.i+'&t='+q.start+'s';
  var w=$('#zpWait');if(w)w.outerHTML='<div class="zp-res '+(ok?'ok':'bad')+'"><b>'+(ok?'Dobrze! +'+pts+(S.streak>=3?' (seria x1,5)':''):i<0?'Koniec czasu!':'Pudło!')+'</b>'+
    '<span>To było: <strong>'+esc(q.ans.t)+'</strong></span>'+
    '<div class="zp-row"><a class="zp-btn yt" href="'+yt+'" target="_blank" rel="noopener">&#9654; Posłuchaj całej na YouTube</a>'+
    '<button class="zp-btn go" data-a="next">'+(S.round+1>=ROUNDS?'Wynik &rsaquo;':'Dalej &rsaquo;')+'</button></div></div>';
  var sc=$('#zpScore');if(sc)sc.textContent=S.score;
  S.round++}
function finish(){
  S.st='over';pauseSong();cover(true);SV.games++;var rec=S.score>SV.best;if(rec)SV.best=S.score;save();sfx('end');
  var rk=rankOf(S.correct),dots=S.history.map(function(h){return h==='g'?'&#129001;':'&#11035;'}).join('');
  var share='Zgadłem '+S.correct+'/'+ROUNDS+' piosenek Qastroda! '+S.score+' pkt '+S.history.map(function(h){return h==='g'?'🟩':'⬛'}).join('')+' Spróbuj: qastrod.pl/gra-zgadnij-piosenke';
  S.shareText=share;
  show('<div class="zp-over"><p class="zp-kick">Wynik</p><div class="zp-rank"><i>'+rk[1]+'</i><b>'+rk[0]+'</b></div>'+
   '<p class="zp-big">'+S.correct+'<small>/'+ROUNDS+'</small></p><p class="zp-pts">'+S.score+' pkt'+(rec?' &middot; <em>nowy rekord!</em>':'')+'</p>'+
   '<p class="zp-dots">'+dots+'</p>'+
   '<div class="zp-row"><button class="zp-btn go" data-a="start">&#8635; Zagraj jeszcze raz</button><button class="zp-btn ghost" data-a="share">&#128228; Udostępnij wynik</button></div>'+
   '<a class="zp-link" href="https://www.youtube.com/@Qastrod" target="_blank" rel="noopener">Wszystkie piosenki na kanale Qastrod &rsaquo;</a></div>')}
function doShare(){var t=S.shareText||'';
  if(navigator.share){navigator.share({text:t}).catch(function(){});return}
  try{navigator.clipboard.writeText(t);toast('Skopiowano! Wklej znajomym')}catch(e){toast(t)}}
var toastT=0;function toast(m){var el=$('.zp-toast');el.textContent=m;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('on')},2200)}
function cover(on){var c=$('.zp-cover');if(c)c.classList.toggle('open',!on);root.classList.toggle('playing',S.st==='play'||S.st==='load')}

root.addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(!b||b.disabled)return;var a=b.getAttribute('data-a');
  if(a==='start')start();else if(a==='ans')answer(+b.getAttribute('data-i'));else if(a==='next')nextRound();else if(a==='share')doShare();else if(a==='kick'){if(!YTP||!ytReady){noYT();return}resumeSong();clearWd();wd2=setTimeout(function(){if(S.st==='load')noYT()},6000)}
  else if(a==='skip'){if(S.q)S.used[S.q.ans.i]=1;S.q=makeQ();renderRound();playSong(S.q.ans.i,S.q.start)}
  else if(a==='mute'){SV.muted=!SV.muted;save();try{YTP&&YTP.setVolume(SV.muted?0:90)}catch(x){}b.innerHTML=SV.muted?'&#128263; Dźwięk: wył.':'&#128266; Dźwięk: wł.'}});
window.addEventListener('keydown',function(e){if(S.st==='play'||S.st==='load'){var n='1234abcd'.indexOf(e.key.toLowerCase());if(n>=0){e.preventDefault();answer(n%4)}}
  else if(S.st==='reveal'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();nextRound()}});
var mb=root.querySelector('[data-a=mute]');if(mb)mb.innerHTML=SV.muted?'&#128263; Dźwięk: wył.':'&#128266; Dźwięk: wł.';
menu();loadYT();
if(DEBUG)window.__zp={S:S,start:start,answer:answer,nextRound:nextRound,startTimer:startTimer,finish:finish,label:label};
})();
