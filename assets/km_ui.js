/* Menedżer klubu: interfejs (na bazie Symulatora selekcjonera v4) */
(function(){
'use strict';
var X=window.SS;if(!X)return;var MM=X.M;
var root=X.root,esc=X.esc,P=X.P,T=X.TEAMS,sur=X.sur,money=X.money;
function S(){return X.S()}
var UI={tab:'pulpit',modal:null,MV:null,spd:1,dbf:'ALL',pick:null,full:false,mm:0,tlg:null,mk:{lg:'ALL',g:'ALL',max:0,s:'ovr',q:''},startSel:null,startLg:'E'};
root.innerHTML='<div class="ss-app" id="ssApp"></div><div class="ss-toast" id="ssToast"></div>';
var app=document.getElementById('ssApp');

/* ---------- drobne elementy ---------- */
function tn(c){return X.tn(c)}
function isNew(p){var s=S();return p&&p.nw!=null&&s.stats.p<=p.nw}
function nwB(p){return isNew(p)?'<em class="km-role nw">NOWY</em>':''}
function flagI(c){var t=T[c];if(!t||!t.cc)return '';var F=window.SSFLAGS||{};return F[t.cc]?'<i class="ss-flag sm km-fl" style="background:'+F[t.cc]+'" title="'+t.cc+'"></i>':'<small class="km-cc">'+t.cc+'</small>'}
function crest(c,sz){var t=T[c];return '<i class="km-cr'+(sz?' '+sz:'')+'">'+(t&&window.KMCREST?KMCREST(c,t):'')+'</i>'}
function tier(v){return v>=68?'g':v>=63?'s':v>=57?'b':'n'}
function formIc(p){var f=p.form;return '<em class="ss-fm '+(f>=1?'up':f<=-1?'dn':'eq')+'">'+(f>=1?'▲':f<=-1?'▼':'•')+'</em>'}
function btn(lbl,a,cls,extra){return '<button class="ss-btn '+(cls||'')+'" data-a="'+a+'"'+(extra||'')+'>'+lbl+'</button>'}
function dateStr(){var s=S();var e=s.cal[s.ev];return X.MONTHS[(s.m||7)-1]+' '+s.y+(e?' · '+X.evLabel(e):'')}
function cta(hint,lbl,a,dis,extra){return '<div class="ss-cta"><span class="ss-hint">'+(hint||'')+'</span>'+(extra||'')+btn(lbl+' <i>›</i>',a,'go big'+(dis?' dis':''))+'</div>'}
function venue(m){return m.stage||(m.neutral?'teren neutralny':m.home?'u siebie':'na wyjeździe')}
function sides(m){return (m.home||m.neutral)?[S().me,m.opp]:[m.opp,S().me]}
function mob(){return window.innerWidth<760}
function lgName(c){return X.LG[X.lgOf(c)]}
function posTxt(c){var p=X.posOf(c);return p?p+'. '+lgName(c):lgName(c)}

/* ---------- pełny ekran ---------- */
function setFull(on){UI.full=on;root.classList.toggle('ss-full',on);document.documentElement.classList.toggle('ss-lock',on);
 var d=document;if(on){var q=root.requestFullscreen||root.webkitRequestFullscreen;if(q&&!d.fullscreenElement){try{var pr=q.call(root);if(pr&&pr.catch)pr.catch(function(){})}catch(e){}}}
 else if(d.fullscreenElement||d.webkitFullscreenElement){try{(d.exitFullscreen||d.webkitExitFullscreen).call(d)}catch(e){}}
 app.querySelectorAll('[data-a=full]').forEach(function(b){if(b.classList.contains('ss-fs'))b.outerHTML=fsBtn()})}
document.addEventListener('fullscreenchange',function(){if(!document.fullscreenElement&&UI.full&&!mob())setFull(false)});

/* ---------- szkielet ---------- */
var TABS=[['pulpit','⚽','Pulpit'],['kadra','👥','Kadra'],['mlodz','🌱','Młodzież'],['trans','💰','Transfery'],['rozgr','🏆','Tabele'],['euro','⭐','Europa'],['media','📰','Media'],['gab','💼','Gabinet']];
function gauge(k,ic,l,v){return '<button class="ss-g '+k+'" data-a="ginfo" data-v="'+k+'" style="--v:'+Math.round(v)+'"><i>'+ic+'</i><b>'+Math.round(v)+'</b><em>'+l+'</em></button>'}
function fsBtn(){return '<button class="ss-fs" data-a="full">'+(UI.full?'✕ <span>Zamknij pełny ekran</span>':'⛶ <span>Pełny ekran</span>')+'</button>'}
function header(){var s=S();
 return '<header class="ss-hd"><div class="ss-me">'+crest(s.me,'md')+'<div><b>'+esc(tn(s.me))+'</b><small>'+esc(s.name)+' · '+dateStr()+'</small></div></div>'+
 '<div class="ss-gs">'+gauge('tr','❤','Kibice',s.trust)+gauge('bd','🏛','Zarząd',s.board)+gauge('mo','💪','Szatnia',s.morale)+'<button class="ss-g km-bud" data-a="tab" data-v="trans"><i>💰</i><b>'+money(X.bud(s.me)).replace(' zł','')+'</b><em>Budżet'+(X.winOpen()?' · okno':'')+'</em></button></div>'+
 fsBtn()+'</header>'}
function nav(){var s=S();return '<nav class="ss-nav">'+TABS.map(function(t){var dot=(t[0]==='media'&&UI.mediaNew)||(t[0]==='trans'&&s.offers&&s.offers.length);var gl=t[0]==='trans'&&s.euOpen&&!s.euSeen;return '<button class="'+(UI.tab===t[0]?'on':'')+(gl?' km-glow':'')+'" data-a="tab" data-v="'+t[0]+'">'+(gl?'<em class="km-nb">EU</em>':'')+'<i>'+t[1]+'</i><span>'+t[2]+'</span>'+(dot?'<b class="ss-dot"></b>':'')+'</button>'}).join('')+'</nav>'}

function norm(s){if(!s)return s;
 if(s.phase==='match'&&!UI.MV)s.phase='pre';
 if(s.phase==='press'&&!(UI.qs&&UI.qs[UI.pq]))s.phase='pre';
 if((s.phase==='pre'||s.phase==='press')&&!s.cur)s.phase='hub';
 if(s.phase==='pre')ensureXI();
 if(s.phase==='post'&&!UI.post){s.phase='hub';X.finishEvent();X.save()}
 return s}
function render(){var s=S();if(s)norm(s);
 if(!s){unmountMatch();app.className='ss-app st';app.innerHTML=startScreen();return}
 if(s.phase==='match'&&UI.MV){if(!UI.mm){app.className='ss-app inm';app.innerHTML=matchShell();UI.mm=1;mountMatch()}renderOv();return}
 unmountMatch();
 var scr=UI.tab==='pulpit'?pulpit():UI.tab==='kadra'?squadView():UI.tab==='mlodz'?youthView():UI.tab==='trans'?transView():UI.tab==='rozgr'?compView():UI.tab==='euro'?euroView():UI.tab==='media'?mediaView():gabView();
 app.className='ss-app';
 var key=UI.tab+':'+s.phase+':'+s.ev;var na=UI.lastKey===key?' noanim':'';UI.lastKey=key;
 app.innerHTML=header()+'<div class="ss-body">'+nav()+'<main class="ss-scr k-'+(UI.tab==='pulpit'?s.phase:UI.tab)+na+'">'+scr+'</main></div>'+(UI.modal?'<div class="ss-modal" data-a="mclose"><div class="ss-mbox" data-a="noop">'+UI.modal+'</div></div>':'')+(UI.cel?celHTML(UI.cel):(s.euNew&&s.phase!=='match'?euUnlockHTML():''));
 if(s.newAch&&s.newAch.length){toast('🏆 Osiągnięcie: '+s.newAch.join(', '));s.newAch=[];X.save()}}

/* ---------- start ---------- */
function startScreen(){var has=X.load();var form=!has||UI.newForm;
 var h='<div class="ss-start km-start"><div class="ss-stin"><h2>Symulator trenera<em>w polskiej lidze</em></h2><p class="ss-slog">Superklasa · 1 liga · 2 liga · Europa</p>';
 if(has&&!UI.newForm)return h+'<button class="ss-btn go big wide ss-cont" data-a="cont">▶ Kontynuuj<small>'+esc(has.name)+' · '+esc(tn(has.me))+' · sezon '+has.season+'/'+((has.season+1)%100)+'</small></button><button class="ss-lnk" data-a="newForm">Zacznij nową karierę</button>'+(mob()?'':'<button class="ss-lnk fs" data-a="full">⛶ Pełny ekran</button>')+'</div></div>';
 var lg=UI.startLg;var list=X.CLUBS.filter(function(t){return t.lg0===lg&&!t.res});
 h+='<div class="km-pick"><input id="ssName" maxlength="28" placeholder="Twoje imię i nazwisko" autocomplete="off" value="'+esc(UI.nm||'')+'">'+
  '<div class="ss-seg sm">'+['E','L1','L2'].map(function(k){return '<button class="'+(lg===k?'on':'')+'" data-a="slg" data-v="'+k+'">'+X.LG[k]+'</button>'}).join('')+'</div>'+
  '<div class="km-clubs">'+list.map(function(t){var on=UI.startSel===t.c;return '<button class="km-club'+(on?' on':'')+'" data-a="ssel" data-v="'+t.c+'">'+crest(t.c,'lg')+'<b>'+esc(t.n)+'</b><small>'+money(t.bud0)+'</small></button>'}).join('')+'</div>'+
  '<p class="ss-mut">Im niższa liga, tym mniejszy budżet i trudniej ściągnąć zawodników z góry.</p>'+
  btn('▶ Zacznij'+(UI.startSel?' w '+esc(tn(UI.startSel)):''),'new','go big'+(UI.startSel?'':' dis'))+(has?'<button class="ss-lnk" data-a="newForm">Wróć</button>':'')+'</div>';
 return h+'</div></div>'}

/* ---------- pulpit ---------- */
var STEPS=[['hub','Start'],['press','Konferencja'],['pre','Skład'],['match','Mecz'],['post','Media']];
function stepline(){var s=S(),k=STEPS.map(function(x){return x[0]}).indexOf(s.phase);if(k<0)return '';
 return '<div class="ss-stp">'+STEPS.map(function(x,i){return '<i class="'+(i<k?'d':i===k?'o':'')+'"></i>'}).join('')+'<span>'+STEPS[k][1]+'</span></div>'}
function pulpit(){var s=S();var e=s.cal[s.ev];
 if(e&&e.t==='END')return seasonEnd();if(s.fired)return firedView();
 var ph=s.phase;var b=ph==='press'?pressView():ph==='pre'?pre():ph==='post'?post():hub();return stepline()+b}
function bigVs(m){var sd=sides(m);
 return '<div class="ss-vs"><div class="ss-vt">'+crest(sd[0],'xl')+'<b>'+esc(tn(sd[0]))+'</b><small class="km-ps">'+esc(posTxt(sd[0]))+'</small></div><div class="ss-vm"><em>VS</em><small>'+esc(m.home?'u siebie':m.neutral?'teren neutralny':'na wyjeździe')+'</small></div><div class="ss-vt">'+crest(sd[1],'xl')+'<b>'+esc(tn(sd[1]))+'</b><small class="km-ps">'+esc(posTxt(sd[1]))+'</small></div></div>'+
 '<p class="ss-opp"><span>Siła rywala <b>'+Math.round(X.teamStr(m.opp))+'</b></span><span>Twoja siła <b>'+Math.round(X.myStr())+'</b></span>'+(T[m.opp].stars[0]?'<span>Gwiazda <b>'+esc(T[m.opp].stars[0])+'</b></span>':'')+'</p>'}
function topHead(){var s=S();var m=s.media&&s.media[0];if(m)return m.t;var n=s.news&&s.news[0];return n?n.t:''}
function winBanner(){var s=S();if(!X.winOpen())return '';var n=(s.offers||[]).length;
 return '<button class="km-win" data-a="tab" data-v="trans"><i>💰</i><span><b>Okno transferowe ('+X.winName()+') otwarte</b><small>Budżet '+money(X.bud(s.me))+(n?' · ofert za Twoich zawodników: '+n:'')+'</small></span><em>›</em></button>'}
function hub(){var s=S(),e=s.cal[s.ev];var m=X.nextMatch();
 var h='<div class="ss-fill ss-hub">';
 if(e.t==='ZIMA'){h+='<p class="ss-eye">Przerwa zimowa · '+s.season+'/'+((s.season+1)%100)+'</p><h2 class="km-h">Półmetek sezonu</h2>'+
   '<p class="ss-goal"><i>📊</i><span>Twoje miejsce</span><b>'+esc(posTxt(s.me))+'</b></p><p class="ss-goal"><i>🎯</i><span>Cel zarządu</span><b>'+esc(s.goal.text)+'</b></p>'+
   '<p class="ss-mut">Zimowe okno transferowe jest otwarte do 20. kolejki. Kluby też kupują, więc warto zajrzeć do zakładki Transfery.</p>'+tick()+'</div>';
  return h+cta('','Dalej','evNext')}
 if(!m){var why=e.t==='C'?'Twoja drużyna nie gra już w Pucharze Kraju.':e.t==='PO'?'Twoja drużyna nie gra w barażach.':'Pauza w tej kolejce.';
  h+='<p class="ss-eye">'+esc(X.evLabel(e))+'</p><h2 class="km-h">Bez meczu</h2><p class="ss-mut">'+why+' Pozostałe mecze zostaną rozegrane.</p>'+winBanner()+tick()+'</div>';
  return h+cta('','Dalej','evNext')}
 h+='<p class="ss-eye">'+esc(m.stage)+' · '+X.MONTHS[(s.m||7)-1]+' '+s.y+'</p>'+bigVs(m);
 if(m.kind==='EU'&&m.agg)h+='<p class="km-agg">Pierwszy mecz: <b>'+m.agg[0]+':'+m.agg[1]+'</b> dla '+(m.agg[0]>m.agg[1]?'nas':m.agg[0]<m.agg[1]?'rywala':'nikogo')+'. Liczy się suma bramek z dwumeczu.</p>';
 h+='<p class="ss-goal"><i>🎯</i><span>Cel zarządu</span><b>'+esc(s.goal.text)+'</b></p>'+standChip()+euChip();
 if(s.newSong)h+='<a class="ss-songp" href="https://www.youtube.com/watch?v='+X.SONGS[s.newSong].i+'" target="_blank" rel="noopener">🎵 Odblokowana piosenka: <b>'+esc(X.SONGS[s.newSong].t)+'</b> ▶</a>';
 h+=winBanner()+tick();
 return h+'</div>'+cta('','Ustaw skład','toPre',0,btn('⚡ Szybki wynik','quick','ghost'))}
function euChip(){var st=X.euStatus(S().me);if(!st)return '';return '<button class="km-stand km-euc" data-a="tab" data-v="euro">'+X.EUC[st.cc].ic+' <b>'+esc(st.comp)+'</b> · '+esc(st.rd)+' <em>›</em></button>'}
function standChip(){var s=S();var lg=X.lgOf(s.me);var t=X.table(lg);var i=t.map(function(r){return r.c}).indexOf(s.me);if(i<0||!t[i].p)return '';
 return '<button class="km-stand" data-a="tab" data-v="rozgr">📊 <b>'+(i+1)+'. miejsce</b> · '+t[i].pts+' pkt · '+t[i].w+'-'+t[i].d+'-'+t[i].l+' <em>›</em></button>'}
function tick(){var hd=topHead();return hd?'<button class="ss-tick" data-a="tab" data-v="media"><i>📰</i><span>'+esc(hd)+'</span><em>›</em></button>':''}
function needPress(m){var s=S(),e=s.cal[s.ev];if(m.kind!=='L')return true;if(s.streak.u>=3)return true;if(s.press>=70)return true;return e.r%4===0}
function toPre(){var s=S();var m=X.nextMatch();if(!m)return;s.cur=m;
 if(needPress(m)){UI.qs=MM.pressQs(m);UI.pq=0;s.phase='press'}else{s.phase='pre';ensureXI()}X.save();render()}
function quickPlay(){var s=S();var m=X.nextMatch();if(!m)return;s.cur=m;ensureXI();var M=MM.quick(m);UI.post=M;s.phase='post';X.save();render()}

/* ---------- konferencja ---------- */
function pressView(){var q=UI.qs&&UI.qs[UI.pq];
 var h='<div class="ss-fill ss-press">';
 if(q)h+='<div class="ss-mic"><p class="ss-eye">🎤 Konferencja przed meczem · '+(UI.pq+1)+'/'+UI.qs.length+'</p><h3>„'+esc(q.q)+'”</h3><div class="ss-ans">'+q.a.map(function(a,i){return '<button data-a="ans" data-v="'+i+'">'+esc(a.t)+'</button>'}).join('')+'</div></div>';
 return h+'</div>'}

/* ---------- skład ---------- */
var STYLES=[['bal','⚖️','Balans',{press:50,tempo:50,ment:50}],['att','🔥','Atak',{press:60,tempo:65,ment:82}],['prs','⚡','Pressing',{press:88,tempo:62,ment:60}],['cnt','🏹','Kontra',{press:38,tempo:78,ment:35}],['bus','🧱','Autobus',{press:30,tempo:32,ment:12}]];
function curStyle(){var t=S().tac,b=null,bd=1e9;STYLES.forEach(function(st){var v=st[3],d=Math.abs(v.press-t.press)+Math.abs(v.tempo-t.tempo)+Math.abs(v.ment-t.ment);if(d<bd){bd=d;b=st[0]}});return bd<12?b:null}
function stylesHTML(){var c=curStyle();return '<div class="ss-sty">'+STYLES.map(function(st){return '<button class="'+(c===st[0]?'on':'')+'" data-a="style" data-v="'+st[0]+'"><i>'+st[1]+'</i><span>'+st[2]+'</span></button>'}).join('')+'</div>'}
function avail(){return X.mySquad().filter(function(p){return !p.inj})}
function ensureXI(){var s=S();var ids=avail().map(function(p){return p.id});
 var ok=s.xi&&s.xi.length===11&&s.xi.every(function(e){return ids.indexOf(e.id)>=0})&&s.xiF===s.tac.f;
 if(!ok){s.xi=X.autoXI(s.tac.f,avail());s.xiF=s.tac.f}}
function pTop(x){return 87-(x-.06)/.74*72}
function pickSlot(){var s=S(),pk=UI.pick;if(!pk)return null;var a=pk.split(':');if(a[0]==='x'){var e=(s.xi||[]).filter(function(x){return x.i===+a[1]})[0];return e?e.slot:null}if(a[0]==='m'&&UI.MV){var e2=UI.MV.M.xi.filter(function(x){return x.id===+a[1]})[0];return e2?e2.slot:null}return null}
function pickBench(){var pk=UI.pick;if(pk&&pk.charAt(0)==='b')return P(+pk.split(':')[1]);return null}
function fitCls(pos,slot){var f=X.fit(pos,slot);return f>=1?' f1':f>=.9?' f2':' f3'}
function pitchHTML(xi,mode){var s=S(),F=X.FORM[s.tac.f];var M=UI.MV&&UI.MV.M;var pb=pickBench();
 return '<div class="ss-pitch"><i class="pl a"></i><i class="pl b"></i><i class="pl c"></i><i class="pl d"></i>'+xi.map(function(e){var p=P(e.id),pos=F[e.i]||[e.slot,.5,.5];var f=X.fit(p.pos,e.slot);var key=(mode==='pre'?'x:':'m:')+(mode==='pre'?e.i:e.id);
  var yc=mode==='m'&&M&&M.ev.some(function(v){return v.kind==='yellow'&&v.sid===e.id&&v.min<=UI.MV.V.clock});
  var hl=pb?fitCls(pb.pos,e.slot):'';
  return '<div class="ss-pt'+(f<.9?' bad':f<1?' meh':'')+(UI.pick===key?' pk':'')+hl+'" style="left:'+(pos[2]*100).toFixed(1)+'%;top:'+pTop(pos[1]).toFixed(1)+'%" data-drag="'+key+'" data-drop="'+key+'" data-a="pt" data-v="'+key+'">'+
  '<i class="t'+tier(X.eff(p,e.slot))+'">'+Math.round(X.eff(p,e.slot))+'</i><b>'+esc(sur(p.n))+(yc?' 🟨':'')+(isNew(p)?' 🆕':'')+'</b><small>'+X.POSN[e.slot]+(p.pos!==e.slot&&X.POSN[p.pos]!==X.POSN[e.slot]?' <u>('+X.POSN[p.pos]+')</u>':'')+'</small></div>'}).join('')+'</div>'}
function benchHTML(ids,mode){if(!ids.length)return '<p class="ss-mut">Ławka pusta.</p>';var sl=pickSlot();
 if(sl)ids=ids.slice().sort(function(a,b){return X.eff(P(b),sl)-X.eff(P(a),sl)});
 return '<div class="ss-bench">'+ids.map(function(id){var p=P(id);var key='b:'+id;var e=Math.round(sl?X.eff(p,sl):p.ovr);var hl=sl?fitCls(p.pos,sl):'';
  return '<div class="ss-bc km-bc'+(p.inj?' inj':'')+(UI.pick===key?' pk':'')+hl+'" data-drag="'+key+'" data-drop="'+key+'" data-a="bc" data-v="'+key+'"><i class="t'+tier(e)+'">'+e+'</i><b>'+esc(sur(p.n))+(isNew(p)?' 🆕':'')+'</b><small>'+X.POSN[p.pos]+'</small><em class="km-bt">ŁAWKA</em></div>'}).join('')+'</div>'}
function legendFit(){return '<div class="km-fitl"><span class="f1"><i></i>nominalna pozycja</span><span class="f2"><i></i>da radę</span><span class="f3"><i></i>obca pozycja</span></div>'}
function pre(){var s=S(),m=s.cur;ensureXI();var R=MM.lineRatings(s.xi,s.tac);var ch=MM.chances(m,R);var sd=sides(m);
 var bench=avail().filter(function(p){return !s.xi.some(function(e){return e.id===p.id})}).sort(function(a,b){return b.ovr-a.ovr}).map(function(p){return p.id});
 var inj=X.mySquad().filter(function(p){return p.inj});
 var h='<div class="ss-fill ss-prew"><div class="ss-pc">'+
  '<div class="ss-oppb"><span>'+crest(sd[0],'sm')+'<b>'+esc(tn(sd[0]))+'</b></span><em>vs</em><span><b>'+esc(tn(sd[1]))+'</b>'+crest(sd[1],'sm')+'</span>'+
  '<div class="ss-chb" title="Szanse: wygrana / remis / porażka"><i class="w" style="flex:'+ch[0]+'">'+ch[0]+'%</i><i class="d" style="flex:'+ch[1]+'">'+ch[1]+'</i><i class="l" style="flex:'+ch[2]+'">'+ch[2]+'%</i></div></div>'+
  '<p class="km-xil">Wyjściowa jedenastka · kliknij zawodnika, żeby go zmienić</p>'+pitchHTML(s.xi,'pre')+'</div>'+
  '<div class="ss-side"><div class="ss-blk"><p class="ss-lbl">Formacja</p><div class="ss-chips">'+Object.keys(X.FORM).map(function(f){return '<button class="'+(s.tac.f===f?'on':'')+'" data-a="form" data-v="'+f+'">'+f+'</button>'}).join('')+'<button class="st" data-a="bestXI" title="Najlepsza jedenastka">★ Najlepsi</button><button class="st km-res" data-a="resXI" title="Skład z rezerwowych">🔄 Rezerwowi</button></div></div>'+
  '<div class="ss-blk"><p class="ss-lbl">Styl gry</p>'+stylesHTML()+'</div>'+
  '<div class="ss-blk grow"><p class="ss-lbl">Ławka rezerwowych ('+bench.length+') <small>'+(UI.pick?'kolory: pasuje na zaznaczoną pozycję':'kliknij zawodnika na boisku, żeby zobaczyć, kto pasuje')+'</small></p>'+(UI.pick?legendFit():'')+benchHTML(bench,'pre')+(inj.length?'<p class="ss-mut">🚑 '+inj.map(function(p){return esc(sur(p.n))+' ('+p.inj+')'}).join(', ')+'</p>':'')+'</div></div></div>';
 return h+cta('<span class="ss-rt">ATK <b>'+Math.round(R.att)+'</b> POM <b>'+Math.round(R.M)+'</b> OBR <b>'+Math.round(R.def)+'</b></span>','▶ Graj mecz','kick',0,btn('⚡ Wynik','quickPre','ghost sm'))}
function slotSheet(i){var s=S();var e=s.xi.filter(function(x){return x.i===i})[0];var cur=P(e.id);
 var bench=avail().filter(function(p){return !s.xi.some(function(x){return x.id===p.id})});
 bench.sort(function(a,b){return (X.fit(b.pos,e.slot)>=1?1:0)-(X.fit(a.pos,e.slot)>=1?1:0)||X.eff(b,e.slot)-X.eff(a,e.slot)});
 var xi=s.xi.filter(function(x){return x.id!==e.id}).map(function(x){return P(x.id)});xi.sort(function(a,b){return X.eff(b,e.slot)-X.eff(a,e.slot)});
 function opt(p,inXI){var v=Math.round(X.eff(p,e.slot));var f=X.fit(p.pos,e.slot);var xs=inXI?s.xi.filter(function(x){return x.id===p.id})[0]:null;
  return '<button class="ss-opt km-opt'+fitCls(p.pos,e.slot)+(inXI?' sw':'')+'" data-a="put" data-v="'+i+'" data-p="'+p.id+'"><i class="t'+tier(v)+'">'+v+'</i><b>'+esc(sur(p.n))+(isNew(p)?' 🆕':'')+'</b><small>'+X.POSN[p.pos]+(f>=1?' · ✔ pasuje':f>=.9?' · może grać':' · obca pozycja')+(inXI?' · teraz '+X.POSN[xs.slot]:'')+'</small><em class="km-bt'+(inXI?' xi':'')+'">'+(inXI?'1. SKŁAD':'ŁAWKA')+'</em>'+formIc(p)+'</button>'}
 UI.modal='<p class="ss-eye">Pozycja: '+X.POSN[e.slot]+' · gra teraz: '+esc(sur(cur.n))+' ('+Math.round(X.eff(cur,e.slot))+')</p><h3>Kto wchodzi z ławki?</h3>'+legendFit()+
  '<div class="ss-opts km-opts">'+(bench.length?bench.slice(0,10).map(function(p){return opt(p,0)}).join(''):'<p class="ss-mut">Brak zdrowych rezerwowych.</p>')+'</div>'+
  '<details class="km-sw"><summary>↔ Albo zamień miejscami z kimś z jedenastki</summary><div class="ss-opts km-opts">'+xi.slice(0,10).map(function(p){return opt(p,1)}).join('')+'</div></details>';render()}
/* ---------- przeciągnij i upuść ---------- */
var DR=null,noClick=0;
root.addEventListener('pointerdown',function(e){var el=e.target.closest('[data-drag]');if(!el||e.button>0)return;DR={el:el,src:el.getAttribute('data-drag'),x0:e.clientX,y0:e.clientY,g:null,ov:null}});
window.addEventListener('pointermove',function(e){if(!DR)return;var dx=e.clientX-DR.x0,dy=e.clientY-DR.y0;
 if(!DR.g){if(dx*dx+dy*dy<64)return;var g=DR.el.cloneNode(true);g.className+=' ss-ghost';g.removeAttribute('style');g.style.width=DR.el.offsetWidth+'px';root.appendChild(g);DR.g=g;DR.el.classList.add('ss-src');root.classList.add('ss-dragging')}
 DR.g.style.transform='translate('+(e.clientX-DR.g.offsetWidth/2)+'px,'+(e.clientY-DR.g.offsetHeight/2)+'px) scale(1.12)';
 var t=document.elementFromPoint(e.clientX,e.clientY);t=t&&t.closest('[data-drop]');if(t===DR.el)t=null;if(DR.ov!==t){if(DR.ov)DR.ov.classList.remove('ss-over');if(t)t.classList.add('ss-over');DR.ov=t}
 if(e.cancelable)e.preventDefault()},{passive:false});
function endDrag(e){if(!DR)return;var d=DR;DR=null;if(!d.g)return;noClick=Date.now();d.g.remove();d.el.classList.remove('ss-src');root.classList.remove('ss-dragging');if(d.ov)d.ov.classList.remove('ss-over');
 if(d.ov&&e.type==='pointerup')onDrop(d.src,d.ov.getAttribute('data-drop'))}
window.addEventListener('pointerup',endDrag);window.addEventListener('pointercancel',endDrag);
function onDrop(src,dst){var s=S();UI.pick=null;if(src===dst)return;var a=src.split(':'),b=dst.split(':');
 if(s.phase==='pre'){
  if(a[0]==='b'&&b[0]==='b')return;
  if(a[0]==='b'){var t=a;a=b;b=t}
  var e1=s.xi.filter(function(x){return x.i===+a[1]})[0];if(!e1)return;
  if(b[0]==='x'){var e2=s.xi.filter(function(x){return x.i===+b[1]})[0];var t2=e1.id;e1.id=e2.id;e2.id=t2;toast('↔ '+sur(P(e1.id).n)+' i '+sur(P(e2.id).n)+' zamienieni')}
  else{var pid=+b[1];e1.id=pid;toast('✅ '+sur(P(pid).n)+' w składzie')}
  X.save();render();return}
 if(s.phase==='match'&&UI.MV){var MV=UI.MV,M=MV.M;
  if(a[0]==='b'&&b[0]==='b')return;
  if(a[0]==='m'&&b[0]==='m'){var x1=M.xi.filter(function(x){return x.id===+a[1]})[0],x2=M.xi.filter(function(x){return x.id===+b[1]})[0];var tt=x1.id;x1.id=x2.id;x2.id=tt;MV.changed=1;toast('↔ Zamiana pozycji');renderOv();return}
  var out=a[0]==='m'?+a[1]:+b[1],inn=a[0]==='b'?+a[1]:+b[1];doSubUI(out,inn)}}
function doSubUI(out,inn){var MV=UI.MV,M=MV.M;var mn=MV.sheet==='ht'?46:Math.floor(MV.V.clock);
 if(MM.doSub(M,out,inn,'',mn)){MV.changed=1;MV.flash=inn;toast('🔁 '+sur(P(inn).n)+' za '+sur(P(out).n))}else toast('Limit 5 zmian.');renderOv()}

/* ---------- mecz ---------- */
function code(c){return c.replace(/2$/,'II')}
function matchShell(){var s=S(),m=s.cur;var sd=sides(m);
 return '<div class="ss-match"><div class="ss-stage" id="ssStage" data-a="stageTap"><canvas id="ssCv" width="800" height="500"></canvas></div>'+
 '<div class="ss-hud"><div class="ss-sb">'+crest(sd[0],'sm')+'<b>'+esc(code(sd[0]))+'</b><strong id="ssSc">0 : 0</strong><b>'+esc(code(sd[1]))+'</b>'+crest(sd[1],'sm')+'<em id="ssMin">0\'</em></div>'+
 '<div class="ss-pb" id="ssPb"><i style="width:50%"></i></div>'+
 '<div class="ss-htr"><button class="ss-hb km-rep" data-a="skipRep" id="kmRep">⏭ Pomiń powtórkę</button><button class="ss-hb" data-a="repTog" id="kmRT"><small>Powtórki</small> '+(UI.noRep?'wył.':'wł.')+'</button><button class="ss-hb" data-a="spd" id="ssSpd"><small>Tempo</small> x'+UI.spd+'</button><button class="ss-hb" data-a="skip">Przewiń do końca ⏭</button>'+(UI.full?'':'<button class="ss-hb" data-a="full">⛶</button>')+'</div>'+
 '<div class="ss-com" id="ssComm">Sędzia gwiżdże. Zaczynamy!</div><div class="ss-tip" id="ssNote"></div>'+
 '<div class="ss-ctl" id="ssCtl"><button class="ss-mb" data-a="sty">⚙ <span>Styl</span></button><button class="ss-mb go" data-a="subs">🔁 <span>Zmiany</span> <em id="ssSubs">0/5</em></button></div>'+
 '<div class="ss-end" id="ssEnd"></div></div><div class="ss-ov" id="ssOv"></div></div>'}
var three=0;function need3D(cb){if(window.THREE||UI.no3d){cb();return}if(three===1){setTimeout(function(){need3D(cb)},120);return}three=1;toast('⚽ Wchodzimy na stadion...');
 var sc=document.createElement('script');var me=document.querySelector('script[src*="km_ui.js"]');sc.src=(me?me.src.replace(/km_ui\.js.*$/,''):'assets/')+'three.min.js';sc.onload=function(){three=2;cb()};sc.onerror=function(){UI.no3d=1;three=2;cb()};document.head.appendChild(sc)}
function startMatch(){if(!window.THREE&&!UI.no3d){need3D(startMatch);return}var s=S(),m=s.cur;
 var M=MM.newMatch(m);MM.startHalf(M,1);UI.MV={M:M,per:'h1',end:false,tip:0,sheet:null};s.phase='match';UI.tab='pulpit';UI.pick=null;
 if(mob()&&!UI.full)setFull(true);render()}
function mountMatch(){var MV=UI.MV,M=MV.M;var stage=document.getElementById('ssStage'),cv=document.getElementById('ssCv');
 var r3d=null;if(window.SS3D&&window.THREE&&!UI.no3d){try{r3d=SS3D.create(stage,M,{})}catch(err){r3d=null;UI.no3d=1}}
 if(r3d)cv.style.display='none';MV.r3d=r3d;
 var V=SSV.create({cv:cv,M:M,r3d:r3d,onReplay:function(on){var b=document.getElementById('kmRep');if(b)b.classList.toggle('on',!!on);if(on){if(UI.noRep&&UI.MV&&UI.MV.V){setTimeout(function(){if(UI.MV&&UI.MV.V)UI.MV.V.skipReplay()},0)}else onText('Powtórka · kliknij boisko, żeby pominąć','rp')}},speed:function(){return UI.spd||1},onInjury:function(e){if(e&&UI.MV&&UI.MV.M.xi.some(function(x){return x.id===e.sid})){UI.MV.V.stop();injurySheet(e)}},onText:onText,onScore:updScore,onPeriodEnd:onPeriodEnd,tick:tickM});
 MV.V=V;updScore();tickM(0);if(MV.end)showEnd();else if(!MV.sheet)V.start()}
function unmountMatch(){if(!UI.mm)return;UI.mm=0;var MV=UI.MV;if(MV){if(MV.V)MV.V.stop();if(MV.r3d){MV.r3d.dispose();MV.r3d=null}}}
function renderOv(){var el=document.getElementById('ssOv');if(!el)return;var MV=UI.MV;var h='';
 if(MV.sheet==='ht'||MV.sheet==='subs')h=subsSheet(MV.sheet);else if(MV.sheet==='inj')h=MV.injH;else if(MV.sheet==='pen')h=MV.penH;else if(MV.sheet==='sty')h='<div class="ss-pop" data-a="noop"><p>Styl gry · zmiana od razu</p>'+stylesHTML()+'</div>';
 el.innerHTML=h;el.className='ss-ov'+(h?' on':'')+(MV.sheet==='sty'?' pop':'');
 var su=document.getElementById('ssSubs');if(su)su.textContent=MV.M.subs+'/5';var ctl=document.getElementById('ssCtl');if(ctl)ctl.style.display=MV.end?'none':''}
function statRow(l,a,b,u){var t=(a+b)||1;return '<div class="ss-str"><b>'+a+(u||'')+'</b><span><i style="width:'+(a/t*100)+'%"></i></span><small>'+l+'</small><span class="r"><i style="width:'+(b/t*100)+'%"></i></span><b>'+b+(u||'')+'</b></div>'}
function scorers(M,t){return M.hl.filter(function(h){return h.kind==='goal'&&h.t===t&&h._done&&h.min<=UI.MV.V.clock}).map(function(h){return esc(t==='P'?sur(P(h.sid).n):sur(h.name||'rywal'))+' '+h.min+'\''}).join(', ')}
function subsSheet(kind){var MV=UI.MV,M=MV.M,V=MV.V;var s=S(),m=s.cur,sd=sides(m),hm=sd[0]===s.me;var st=MM.stats(M,V.clock);
 var h='<div class="ss-sheet'+(kind==='ht'?' ht':'')+'" data-a="noop">';
 if(kind==='ht'){var a=V.shown.P,b=V.shown.O;var sP=scorers(M,'P'),sO=scorers(M,'O');
  h+='<div class="ss-hth"><p class="ss-eye">Przerwa</p><div class="ss-hts">'+crest(sd[0],'md')+'<b>'+(hm?a:b)+' : '+(hm?b:a)+'</b>'+crest(sd[1],'md')+'</div>'+((sP||sO)?'<p class="ss-hsc">'+(sP?'⚽ '+sP:'')+(sP&&sO?' · ':'')+(sO?'<span>'+sO+'</span>':'')+'</p>':'')+
  '<div class="ss-hst">'+statRow('Posiadanie',st.pos,100-st.pos,'%')+statRow('Strzały',st.shP,st.shO)+statRow('Celne',st.onP,st.onO)+'</div></div>'}
 else h+='<div class="ss-shh"><b>Zmiany</b><span>'+Math.floor(V.clock)+'\' · wynik '+(hm?V.shown.P+':'+V.shown.O:V.shown.O+':'+V.shown.P)+'</span></div>';
 h+=stylesHTML();
 var bench=M.bench.filter(function(id){return M.used.indexOf(id)<0});
 h+='<div class="ss-subw"><div class="ss-subp">'+pitchHTML(M.xi,'m')+'</div><div class="ss-subb"><p class="ss-lbl">Ławka <small>przeciągnij na zawodnika</small></p>'+benchHTML(bench,'m')+'</div></div>';
 h+='<div class="ss-cta"><span class="ss-hint"><b>'+M.subs+'</b>/5 zmian</span>'+btn((kind==='ht'?'▶ Druga połowa':'▶ Graj dalej')+' <i>›</i>','sheetGo','go big')+'</div></div>';return h}
function updScore(){var MV=UI.MV,V=MV&&MV.V;if(!V)return;var s=S(),m=s.cur;var hm=m.home||m.neutral;var el=document.getElementById('ssSc');if(!el)return;
 var a=V.shown.P,b=V.shown.O;el.textContent=hm?a+' : '+b:b+' : '+a;var mn=document.getElementById('ssMin');if(mn)mn.textContent=Math.min(120,Math.floor(V.clock))+'\''+(MV.per==='et'?' DOGR.':'')}
function onText(t,cls){var el=document.getElementById('ssComm');if(el){el.textContent=t;el.className='ss-com on '+(cls||'');clearTimeout(UI.cT);UI.cT=setTimeout(function(){el.classList.remove('on')},3800)}}
var lastStat=-1;
function tickM(clock){var MV=UI.MV,M=MV.M;var mi=Math.floor(clock);
 if(mi!==lastStat){lastStat=mi;var st=MM.stats(M,clock);MV.V.setPos(st.pos);var pb=document.getElementById('ssPb');if(pb)pb.firstChild.style.width=st.pos+'%';
  if(!MV.tip&&clock>=62&&clock<80&&MV.V.shown.P<MV.V.shown.O){MV.tip=1;note('Przegrywamy. Atakujemy?','tipAtt','🔥 Atak')}
  else if(!MV.tip&&clock>=75&&MV.V.shown.P>MV.V.shown.O){MV.tip=1;note('Prowadzimy. Bronimy wyniku?','tipBus','🧱 Autobus')}}
 updScore()}
function note(t,a,lbl){var el=document.getElementById('ssNote');if(!el)return;el.innerHTML='<span>📋 '+t+'</span>'+btn(lbl,a,'go sm')+'<button class="ss-x" data-a="noteX">✕</button>';el.className='ss-tip on'}
function applyChange(){var MV=UI.MV,V=MV.V,M=MV.M;var mn=Math.floor(V.clock);if(MV.per!=='ht'){MM.resimFrom(M,mn)}V.syncXI()}
function openSheet(kind){var MV=UI.MV;MV.sheet=kind;MV.V.stop();UI.pick=null;renderOv()}
function injurySheet(e){var MV=UI.MV,M=MV.M;var x=M.xi.filter(function(q){return q.id===e.sid})[0];if(!x){MV.V.start();return}
 MV.inj=e;var opts=MM.benchOptions(M,x.slot,4);
 MV.injH='<div class="ss-sheet sm" data-a="noop"><p class="ss-eye">🚑 Kontuzja · '+e.min+'\'</p><h3>'+esc(P(e.sid).n)+' nie da rady</h3><p class="ss-mut">Kto wchodzi na '+X.POSN[x.slot]+'?</p><div class="ss-opts">'+
  (M.subs<5?opts.map(function(id){var p=P(id),v=Math.round(X.eff(p,x.slot));return '<button class="ss-opt" data-a="injIn" data-v="'+id+'"><i class="t'+tier(v)+'">'+v+'</i><b>'+esc(sur(p.n))+'</b><small>'+X.POSN[p.pos]+'</small></button>'}).join(''):'<p>Limit zmian wykorzystany.</p>')+'</div><div class="ss-cta">'+btn('Gra dalej osłabiony','injStay','ghost')+'</div></div>';
 MV.sheet='inj';renderOv()}
function closeSheet(){var MV=UI.MV;var k=MV.sheet;MV.sheet=null;UI.pick=null;renderOv();
 if(k==='ht'){MM.startHalf(MV.M,2);MV.per='h2';MV.V.start('h2')}else MV.V.start()}
function onPeriodEnd(ph){var MV=UI.MV,M=MV.M;
 if(ph==='h1'){MV.per='ht';openSheet('ht')}
 else if(ph==='h2'){if(MM.koTie(M)){MM.extraTime(M);MV.per='et';onText('Remis! Dogrywka!','');MV.V.start('et')}else endMatch()}
 else{if(MM.koTie(M)){MM.penalties(M);penSheet()}else endMatch()}}
function penSheet(){var MV=UI.MV,M=MV.M,pe=M.pens;MV.sheet='pen';var k=0;MV.V.stop();
 function draw(){var sp=0,so=0;pe.seq.slice(0,k).forEach(function(q){if(q.okP)sp++;if(q.okO)so++});
  var dots=function(t){return pe.seq.map(function(q,i){return '<i class="'+(i<k?((t==='P'?q.okP:q.okO)?'ok':'no'):'')+'"></i>'}).join('')};
  var last=k>0?pe.seq[k-1]:null;
  MV.penH='<div class="ss-sheet sm pen" data-a="noop"><p class="ss-eye">Rzuty karne</p><div class="ss-pens"><div><b>'+esc(tn(S().me))+'</b><span>'+dots('P')+'</span><strong>'+sp+'</strong></div><div><b>'+esc(tn(M.opp))+'</b><span>'+dots('O')+'</span><strong>'+so+'</strong></div></div>'+
  (last?'<p class="ss-pl">'+(last.okP?'✅ ':'❌ ')+esc(sur(last.p))+'</p>':'<p class="ss-pl">Do piłki...</p>')+
  (k>=pe.seq.length?'<div class="ss-cta">'+btn(pe.p>pe.o?'🎉 WYGRALIŚMY!':'Koniec... <i>›</i>','penEnd','go big')+'</div>':'')+'</div>';renderOv()}
 draw();var iv=setInterval(function(){k++;draw();if(k>=pe.seq.length)clearInterval(iv)},1000)}
function endMatch(){var MV=UI.MV,M=MV.M,s=S();if(MV.end)return;MV.V&&MV.V.stop();
 M.hl.forEach(function(h){h._done=1});MV.V.shown={P:M.gP,O:M.gO};MV.V.clock=M.et?120:90;updScore();
 MM.finishMatch(M);UI.post=M;MV.end=1;MV.sheet=null;X.save();
 showEnd();renderOv()}
function showEnd(){var M=UI.MV.M;var el=document.getElementById('ssEnd');if(!el)return;var nt=document.getElementById('ssNote');if(nt)nt.className='ss-tip';
 el.innerHTML='<div class="ss-endc r'+M.res+'"><p>'+(M.res==='W'?'ZWYCIĘSTWO':M.res==='L'?'PORAŻKA':'REMIS')+'</p><b>'+esc(MM.scoreStr(M))+'</b>'+btn('Pomeczowe <i>›</i>','toPost','go big')+'</div>';el.className='ss-end on'}
function skipMatch(){var MV=UI.MV,M=MV.M;if(MV.end)return;MV.V.stop();MV.sheet=null;
 if(M.half===1)MM.startHalf(M,2);if(MM.koTie(M)&&!M.et)MM.extraTime(M);if(MM.koTie(M)&&!M.pens)MM.penalties(M);endMatch()}

/* ---------- po meczu ---------- */
function postTable(m){var s=S();if(m.kind==='L'){var lg=X.lgOf(s.me);var t=X.table(lg),Z=zones(lg);var e=s.cal[s.ev];var res=s.fx[lg].filter(function(f){return e&&f.r===e.r});
  return '<div class="km-pt"><div><p class="ss-lbl">Wyniki kolejki</p><div class="km-rr">'+res.map(function(f){var me=f.h===s.me||f.a===s.me;return '<div class="'+(me?'me':'')+'"><span>'+crest(f.h,'xs')+esc(tn(f.h))+'</span><b>'+(f.hg==null?'-':f.hg+':'+f.ag)+'</b><span>'+esc(tn(f.a))+crest(f.a,'xs')+'</span></div>'}).join('')+'</div></div>'+
  '<div><p class="ss-lbl">Tabela · '+esc(X.LG[lg])+'</p><div class="ss-tab km-tab km-ptab"><table><tr><th></th><th></th><th>M</th><th>Br.</th><th>Pkt</th></tr>'+t.map(function(r,i){return '<tr class="'+(r.c===s.me?'me ':'')+(Z[i+1]?'z-'+Z[i+1][0]:'')+'"><td>'+(i+1)+'</td><td>'+crest(r.c,'xs')+' '+esc(tn(r.c))+'</td><td>'+r.p+'</td><td>'+r.gf+':'+r.ga+'</td><td><b>'+r.pts+'</b></td></tr>'}).join('')+'</table></div></div></div>'}
 if(m.kind==='EU'&&m.k==='LP'){var lt=X.lpTable(m.comp);var mi=lt.map(function(r){return r.c}).indexOf(s.me);var rows=lt.map(function(r,i){r.i=i;return r}).filter(function(r){return r.i<8||Math.abs(r.i-mi)<=3});
  return '<div class="km-pt one"><div><p class="ss-lbl">'+esc(X.EUC[m.comp].n)+' · faza ligowa</p><div class="ss-tab km-tab km-ptab"><table><tr><th></th><th></th><th>M</th><th>Br.</th><th>Pkt</th></tr>'+rows.map(function(r){return '<tr class="'+(r.c===s.me?'me ':'')+'z-'+(r.i<8?'up':r.i<24?'po':'dn')+'"><td>'+(r.i+1)+'</td><td>'+crest(r.c,'xs')+' '+flagI(r.c)+esc(tn(r.c))+'</td><td>'+r.p+'</td><td>'+r.gf+':'+r.ga+'</td><td><b>'+r.pts+'</b></td></tr>'}).join('')+'</table></div></div></div>'}
 return ''}
function post(){var s=S(),M=UI.post;if(!M){s.phase='hub';return hub()}
 if(!M.restDone){M.restDone=1;X.playRestNow()}
 if(M.adv&&!M.celShown){var sp=M.spec;if((sp.kind==='C'&&s.cup&&s.cup.k===5)||(sp.kind==='EU'&&sp.k==='F')){M.celShown=1;UI.cel={t:sp.kind==='C'?'PUCHAR KRAJU!':X.EUC[sp.comp].n.toUpperCase()+'!',s:tn(s.me)+' zdobywa trofeum',c:sp.kind==='C'?'CUP':sp.comp}}}
 var m=s.cur,sd=sides(m),hm=sd[0]===s.me;var a=hm?M.gP:M.gO,b=hm?M.gO:M.gP;
 var sc=Object.keys(M.sc).map(function(id){return esc(sur(P(id).n))+(M.sc[id]>1?' ×'+M.sc[id]:'')}).join(', ');
 var rts=M.used.slice().sort(function(x,y){return M.rt[y]-M.rt[x]});var mvp=rts[0];var hd=M.head[0]||{t:'',b:'',tone:'n'};var tw=M.social&&M.social[0];
 function dl(l,v,inv){v=v||0;var good=inv?v<0:v>0;return '<span class="ss-dl '+(v===0?'':good?'up':'dn')+'">'+l+' <b>'+(v>0?'+':'')+v+'</b></span>'}
 var h='<div class="ss-fill ss-post km-post r'+M.res+'"><p class="ss-eye">'+esc(m.stage)+(M.quick?' · szybki wynik':'')+'</p>'+
 '<div class="ss-res"><div>'+crest(sd[0],'xl')+'<b>'+esc(tn(sd[0]))+'</b></div><strong>'+a+':'+b+'</strong><div>'+crest(sd[1],'xl')+'<b>'+esc(tn(sd[1]))+'</b></div></div>'+
 '<p class="ss-rl">'+(M.res==='W'?'ZWYCIĘSTWO':M.res==='L'?'PORAŻKA':'REMIS')+(M.pens?' · karne '+M.pens.p+':'+M.pens.o:'')+'</p>'+(m.agg?'<p class="km-agg big '+(M.adv?'ok':'bad')+'">Dwumecz '+(M.gP+m.agg[0])+':'+(M.gO+m.agg[1])+' · '+(M.adv?'AWANS!':'ODPADAMY')+'</p>':(M.ko&&m.kind!=='L'?'<p class="km-agg big '+(M.adv?'ok':'bad')+'">'+(M.adv?'AWANS!':'ODPADAMY')+'</p>':''))+(sc?'<p class="ss-scr2">⚽ '+sc+'</p>':'')+
 '<div class="ss-dls">'+dl('❤ Kibice',M.dT)+dl('🏛 Zarząd',M.dB)+(mvp?'<span class="ss-dl mvp">⭐ '+esc(sur(P(mvp).n))+' <b>'+M.rt[mvp].toFixed(1)+'</b></span>':'')+'</div>'+
 '<div class="ss-paper big t'+hd.tone+'"><small>Gazeta</small><b>'+esc(hd.t)+'</b>'+(hd.b?'<p>'+esc(hd.b)+'</p>':'')+'</div>'+
 (tw?'<p class="ss-tw"><b>'+esc(tw.h)+'</b> '+esc(tw.t)+'</p>':'')+postTable(m)+'</div>';
 return h+cta('','Dalej','next')}
function nextAfterPost(){var s=S();s.newSong=null;UI.post=null;UI.MV=null;s.cur=null;s.phase='hub';X.finishEvent();UI.mediaNew=1;X.save();render()}

/* ---------- koniec sezonu i zwolnienie ---------- */
function seasonEnd(){var s=S();if(!s.endDone){X.endSeason();s.endDone=1;X.save();var r0=s.lastEnd;if(r0.trophies.length){UI.cel={u:r0.euUnlock?'Rynek transferowy w Europie! Od nowego sezonu kupujesz zawodników ze 122 europejskich klubów.':r0.euNext&&r0.euNext.comp==='CL'?(s.euOpen?'Eliminacje 1. Ligi Europejskiej. Gracie o elitę Europy i wielkie premie.':'Eliminacje 1. Ligi Europejskiej. Przejdź eliminacje, a w fazie ligowej otworzy się rynek europejski z zawodnikami z 122 klubów.'):(r0.euNext?'Europejskie puchary: '+X.EUC[r0.euNext.comp].n+'.':''),t:r0.trophies[0].t.toUpperCase()+'!',s:tn(s.me)+' · sezon '+s.season+'/'+((s.season+1)%100)+(r0.trophies.length>1?' · i jeszcze: '+r0.trophies.slice(1).map(function(x){return x.t}).join(', '):''),c:r0.trophies[0].c,list:r0.trophies}}else UI.cel=null}var r=s.lastEnd;var ss=r.ss||{prize:{}};
 function row(c){return '<div class="km-tr">'+crest(c,'sm')+'<span>'+esc(tn(c))+'</span></div>'}
 function kpi(l,v,cls){return '<div class="km-k'+(cls?' '+cls:'')+'"><b>'+v+'</b><small>'+l+'</small></div>'}
 var h='<div class="ss-fill ss-wrap km-end"><p class="ss-eye">Podsumowanie sezonu '+s.season+'/'+((s.season+1)%100)+'</p>'+
  '<div class="km-endh">'+crest(s.me,'xl')+'<div><h2>'+esc(tn(s.me))+'</h2><p>'+r.pos+'. miejsce · '+esc(X.LG[r.lg])+'</p></div></div>';
 if(r.euUnlock)h+='<div class="km-euunl"><i>🌍</i><div><p class="km-eye">Odblokowano</p><h3>RYNEK TRANSFEROWY W EUROPIE</h3><p>'+esc(tn(s.me))+' gra w nowym sezonie w '+esc(X.EUC[r.euNext.comp].n.replace('Liga','Lidze').replace('Europejska','Europejskiej'))+'. Od teraz możesz kupować zawodników ze 122 klubów z całej Europy: Transfery → filtr „⭐ Europa”. Kupujesz w letnim oknie, od startu nowego sezonu.</p></div></div>';
 if(r.euNext)h+='<div class="km-unlbox'+(r.euNext.comp==='CL'?' cl':'')+'"><b>🔓 Odblokowano na nowy sezon: '+esc(X.EUC[r.euNext.comp].n)+'</b><span>Start: '+esc(X.EUR[r.euNext.rd])+'. '+(r.euNext.comp==='CL'?(s.euOpen?'Rynek transferowy w Europie jest otwarty.':''):'Mecze z drużynami z całej Europy i duże premie.')+'</span></div>';
 if(r.trophies.length)h+='<div class="km-trs">'+r.trophies.map(function(t){return '<span class="km-tro c'+t.c+'">🏆 '+esc(t.t)+'</span>'}).join('')+'</div>';
 if(r.rel)h+='<p class="ss-big bad">⬇ Spadek z '+esc(X.LG[r.lg])+'</p>';
 h+='<div class="km-kpis">'+kpi('Miejsce',r.pos+'.')+kpi('Punkty',r.row.pts)+kpi('Bilans ligi',r.row.w+'-'+r.row.d+'-'+r.row.l)+kpi('Bramki ligi',r.row.gf+':'+r.row.ga)+kpi('Wygrane mecze',ss.w+'/'+(ss.w+ss.d+ss.l))+'</div>';
 h+='<p class="ss-goal '+(r.goalOk?'ok':'bad')+'"><i>'+(r.goalOk?'✅':'❌')+'</i><span>Cel zarządu</span><b>'+esc(r.goal)+'</b></p>';
 h+='<div class="km-sum">';
 h+='<div class="km-box"><p class="ss-lbl">⭐ Gwiazdy sezonu</p>'+(r.top?'<p>⚽ Król strzelców: <b>'+esc(r.top.n)+'</b> ('+r.top.g+' goli)</p>':'')+(r.best?'<p>📈 Najlepsze oceny: <b>'+esc(r.best.n)+'</b> (śr. '+r.best.r.toFixed(1)+')</p>':'')+(r.young?'<p>🌱 Odkrycie: <b>'+esc(r.young.n)+'</b> ('+r.young.a+' l., '+r.young.ap+' meczów)</p>':'')+(ss.big?'<p>💥 Najwyższa wygrana: <b>'+esc(ss.big.t)+'</b></p>':'')+'</div>';
 var pr=ss.prize||{};var inc=(pr.lg||0)+(pr.cup||0)+(pr.eu||0)+(pr.other||0);
 function fl(l,v,neg){return '<div class="km-fr"><span>'+l+'</span><b class="'+(neg?'no':v>0?'ok':'')+'">'+(neg&&v?'−':v>0?'+':'')+money(Math.abs(v)).replace('−','')+'</b></div>'}
 h+='<div class="km-box"><p class="ss-lbl">💰 Finanse sezonu</p>'+'<div class="km-fr"><span>Budżet na start</span><b>'+money(ss.bud0||0)+'</b></div>'+fl('Miejsce w lidze',pr.lg||0)+fl('Puchar Kraju',pr.cup||0)+fl('Europa',pr.eu||0)+(pr.other?fl('Premie (awans)',pr.other):'')+fl('Sprzedaż zawodników',ss.trOut||0)+fl('Zakupy',ss.trIn||0,1)+'<div class="km-fr tot"><span>Budżet teraz</span><b>'+money(r.budEnd)+'</b></div></div>';
 h+='<div class="km-box"><p class="ss-lbl">🌍 Europa</p>'+(r.eu?'<p><b>'+esc(r.eu.comp)+'</b>: '+esc(r.eu.rd)+'</p>'+(r.eu.path||[]).slice(-4).map(function(x){return '<p class="ss-mut">'+esc(x)+'</p>'}).join(''):'<p class="ss-mut">W tym sezonie bez pucharów.</p>')+
  '<p>Następny sezon: <b>'+(r.euNext?esc(X.EUC[r.euNext.comp].n)+' ('+esc(X.EUR[r.euNext.rd])+')':'bez Europy')+'</b></p></div>';
 h+='<div class="km-box"><p class="ss-lbl">🏆 Rozstrzygnięcia</p><p>Mistrz: </p>'+row(r.champ)+(r.cup?'<p>Puchar Kraju:</p>'+row(r.cup):'')+'<p>Awans do Superklasy:</p>'+r.upE.map(row).join('')+'<p>Spadek z Superklasy:</p>'+r.downE.map(row).join('')+'</div>';
 h+='</div>';
 if(s.fired){h+='<div class="ss-paper big tbad"><small>Zarząd</small><b>Zwolniony!</b><p>'+esc(s.fired)+'</p></div>'}
 if(r.offers&&r.offers.length){h+='<p class="ss-lbl">📨 Oferty pracy</p><div class="km-offers">'+r.offers.map(function(c){return '<button class="km-club" data-a="job" data-v="'+c+'">'+crest(c,'lg')+'<b>'+esc(tn(c))+'</b><small>'+esc(lgName(c))+' · '+money(X.bud(c))+'</small></button>'}).join('')+'</div>'}
 h+='</div>';
 if(s.fired)return h+cta(r.offers&&r.offers.length?'Wybierz nowy klub':'Brak ofert','Nowa kariera','restart');
 return h+cta(r.offers&&r.offers.length?'Możesz przyjąć ofertę albo zostać':'','Zostaję. Nowy sezon','newSeason')}
function trophySVG(c){var g1=c==='CL'?'#e8eef7':c==='EL'?'#ffb347':c==='ECL'?'#7be0a5':'#ffd54a',g2=c==='CL'?'#9aa8bf':c==='EL'?'#d9771f':c==='ECL'?'#2f9c62':'#c9921a';
 if(c==='UP')return '<svg viewBox="0 0 120 140"><defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="#7cf2b5"/><stop offset="1" stop-color="#12a05a"/></linearGradient></defs><path d="M60 10L105 60H78V120H42V60H15Z" fill="url(#tg)" stroke="#0b5a2c" stroke-width="3"/></svg>';
 return '<svg viewBox="0 0 120 140"><defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="'+g1+'"/><stop offset=".5" stop-color="#fff8dc"/><stop offset="1" stop-color="'+g2+'"/></linearGradient></defs>'+
  '<path d="M30 14H90V40C90 66 76 80 60 82C44 80 30 66 30 40Z" fill="url(#tg)" stroke="'+g2+'" stroke-width="2"/><path d="M30 22H14C14 44 24 54 34 56M90 22H106C106 44 96 54 86 56" fill="none" stroke="url(#tg)" stroke-width="6"/>'+
  '<rect x="54" y="82" width="12" height="20" fill="url(#tg)"/><path d="M38 102H82L88 122H32Z" fill="url(#tg)" stroke="'+g2+'" stroke-width="2"/><rect x="28" y="122" width="64" height="10" rx="3" fill="#3a2a10"/><path d="M48 26L52 36L62 36L54 42L57 52L48 46L39 52L42 42L34 36L44 36Z" fill="#fff" opacity=".55"/></svg>'}
function euUnlockHTML(){var top=X.plist().filter(function(p){return X.isF(p.cl)}).sort(function(a,b){return b.ovr-a.ovr}).slice(0,3);
 return '<div class="km-cel km-eu" data-a="noop"><div class="km-rays"></div><div class="km-celin"><div class="km-euic">🌍</div><p class="km-eye">Nowa funkcja odblokowana</p><h2>RYNEK EUROPEJSKI OTWARTY!</h2><p>'+esc(tn(S().me))+' gra w europejskich pucharach. Od teraz możesz kupować zawodników z 122 klubów z całej Europy.'+
 '<div class="km-unl"><b>⭐ Największe gwiazdy</b><span>'+top.map(function(p){return esc(p.n)+' ('+p.ovr+', '+esc(tn(p.cl))+')'}).join(' · ')+'</span></div>'+
 '<div class="km-unl"><b>💡 Jak kupować</b><span>Transfery → filtr „⭐ Europa”. Gwiazdy wielkich klubów zwykle odmawiają, ale rezerwowych da się przekonać wyższą ofertą. Kupować można tylko w oknie transferowym.</span></div>'+
 btn('⭐ Zobacz rynek europejski <i>›</i>','euGo','go big')+'<button class="ss-lnk" data-a="euLater">Później</button></div></div>'}
function celHTML(c){var me=T[S().me];var cols=[me.c1,me.c2,'#ffd54a','#ffffff','#ffd54a'];var cf='';for(var i=0;i<70;i++){cf+='<i style="left:'+(Math.random()*100).toFixed(1)+'%;background:'+cols[i%cols.length]+';animation-delay:'+(Math.random()*2.4).toFixed(2)+'s;animation-duration:'+(2.6+Math.random()*2.2).toFixed(2)+'s;transform:rotate('+Math.round(Math.random()*360)+'deg)"></i>'}
 return '<div class="km-cel" data-a="noop"><div class="km-conf">'+cf+'</div><div class="km-rays"></div><div class="km-celin"><div class="km-tro3">'+trophySVG(c.c)+'</div>'+crest(S().me,'lg')+'<h2>'+esc(c.t)+'</h2><p>'+esc(c.s)+'</p>'+(c.u?'<div class="km-unl"><b>🔓 ODBLOKOWANO</b><span>'+esc(c.u)+'</span></div>':'')+btn('Dalej <i>›</i>','celX','go big')+'</div></div>'}
function firedView(){var s=S();if(!s.firedOffers){var all=X.CLUBS.filter(function(t){return t.c!==s.me&&!t.res&&X.lgOf(t.c)!=='L3'&&X.LVL[X.lgOf(t.c)]<=X.LVL[X.lgOf(s.me)]});s.firedOffers=X.shuffle(all).slice(0,3).map(function(t){return t.c});X.save()}
 var h='<div class="ss-fill ss-wrap"><p class="ss-eye">'+dateStr()+'</p><h2>Zwolniony z '+esc(tn(s.me))+'</h2><div class="ss-paper big tbad"><small>Zarząd</small><b>Dziękujemy za współpracę</b><p>'+esc(s.fired)+'</p></div>'+
  '<p class="ss-lbl">📨 Oferty pracy</p><div class="km-offers">'+s.firedOffers.map(function(c){return '<button class="km-club" data-a="job" data-v="'+c+'">'+crest(c,'lg')+'<b>'+esc(tn(c))+'</b><small>'+esc(posTxt(c))+' · '+money(X.bud(c))+'</small></button>'}).join('')+'</div></div>';
 return h+cta('Wybierz klub, żeby grać dalej','Nowa kariera','restart')}

/* ---------- kadra ---------- */
var GN={BR:'Bramkarze',OBR:'Obrońcy',POM:'Pomocnicy',NAP:'Napastnicy'};
function prow(p,mine){var v=X.value(p);var listed=p.tl?'<em class="km-tl">na liście</em>':'';var s=S();var role='';
 if(mine){var inXI=s.xi&&s.xi.some(function(e){return e.id===p.id});role=p.inj?'<em class="km-role inj">KONTUZJA</em>':inXI?'<em class="km-role xi">1. SKŁAD</em>':'<em class="km-role bn">ŁAWKA</em>'}
 return '<button class="ss-row" data-a="pinfo" data-v="'+p.id+'"><i class="t'+tier(p.ovr)+'">'+p.ovr+'</i><span><b>'+esc(p.n)+role+nwB(p)+listed+'</b><small>'+X.POSN[p.pos]+' · '+X.age(p)+' l. · pot. '+p.pot+' · '+(mine?p.cs.a+' m. '+p.cs.g+' g.':flagI(p.cl)+' '+esc(tn(p.cl)))+(p.inj?' · 🚑 '+p.inj:'')+'</small></span>'+formIc(p)+'<em class="km-val">'+money(v)+'</em></button>'}
function squadView(){var s=S();var sq=X.mySquad();var g=UI.dbf;var q=(UI.kq||'').toLowerCase();var list=sq.filter(function(p){return (g==='ALL'||X.POSG[p.pos]===g)&&(!q||p.n.toLowerCase().indexOf(q)>=0)});
 var ord={BR:0,OBR:1,POM:2,NAP:3};list.sort(function(a,b){return ord[X.POSG[a.pos]]-ord[X.POSG[b.pos]]||b.ovr-a.ovr});
 var tot=sq.reduce(function(a,p){return a+X.value(p)},0);
 return '<div class="ss-bar"><div class="ss-seg sm">'+[['ALL','Wszyscy'],['BR','BR'],['OBR','OBR'],['POM','POM'],['NAP','NAP']].map(function(f){return '<button class="'+(UI.dbf===f[0]?'on':'')+'" data-a="dbf" data-v="'+f[0]+'">'+f[1]+'</button>'}).join('')+'</div></div><div class="km-kqw"><input class="ss-q km-kq" data-a="kq" placeholder="🔎 Szukaj po nazwisku..." value="'+esc(UI.kq||'')+'"></div>'+
 '<div class="ss-sortb"><span>'+sq.length+' zawodników (16-32) · wartość kadry '+money(tot)+' · siła '+Math.round(X.myStr())+'</span></div>'+
 '<div class="ss-fill ss-list">'+list.map(function(p){return prow(p,1)}).join('')+'</div>'}
function pinfo(id){var s=S(),p=P(id);function c(l,v){return '<div><small>'+l+'</small><b>'+v+'</b></div>'}var mine=p.cl===s.me;
 var h='<div class="ss-pi"><i class="t'+tier(p.ovr)+'">'+p.ovr+'</i><div><h3>'+esc(p.n)+'</h3><p class="ss-mut">'+X.POSN[p.pos]+' · '+X.age(p)+' lat · '+crest(p.cl,'sm')+' '+esc(tn(p.cl))+'</p></div></div><div class="ss-pg">'+
 c('Potencjał',p.pot)+c('Forma',formIc(p))+c('Wartość',money(X.value(p)))+c('Sezon',p.cs.a+' m. / '+p.cs.g+' g.')+c('Zdrowie',p.inj?'🚑 '+p.inj+' kol.':'✅')+c('Nastrój',p.mood>=70?'😀':p.mood>=45?'🙂':'😠')+'</div>';
 if(mine){var op=X.winOpen();
  h+='<div class="km-act">'+btn(p.tl?'Zdejmij z listy transferowej':'📋 Wystaw na listę transferową','tl','ghost',' data-v="'+id+'"')+(X.age(p)<=19?btn('⬇ Do juniorów','ydown','ghost',' data-v="'+id+'"'):'')+
   (op?btn('💸 Sprzedaj od ręki za '+money(Math.round(X.value(p)*.6/10000)*10000),'qsell','bad',' data-v="'+id+'"'):'')+'</div>'+
   '<p class="ss-mut">'+(op?'Zawodnik z listy dostaje oferty co kolejkę, póki trwa okno. Sprzedaż od ręki: 60% wartości, od razu.':'Okno transferowe jest zamknięte. Lista działa, gdy otworzy się okno.')+'</p>'}
 else h+=buyBox(p);
 UI.modal=h;render()}
function buyBox(p){var s=S();var ask=X.askPrice(p,s.me);var b=X.bud(s.me);var dl=X.LVL[X.lgOf(p.cl)]!=null?X.LVL[X.lgOf(p.cl)]-X.LVL[X.lgOf(s.me)]:(X.willing(p,s.me,1)<.2?2:X.willing(p,s.me,1)<.5?1:0);
 var h='<p class="ss-lbl">Oferta transferowa · cena wywoławcza '+money(ask)+'</p>';
 if(!X.canBuy(p))return h+'<p class="ss-mut">🔒 Okno transferowe jest zamknięte. Wróć latem (do 4. kolejki) albo zimą (do 20. kolejki).</p>';
 if(p.lock===X.winId())return h+'<p class="ss-mut">❌ Ten zawodnik odmówił w tym oknie.</p>';
 if(dl>=2)h+='<p class="ss-mut">⚠ Zawodnik gra dwie ligi wyżej. Prawie na pewno odmówi.</p>';else if(dl===1)h+='<p class="ss-mut">⚠ Zawodnik gra ligę wyżej. Wyższa oferta zwiększa szansę.</p>';
 h+='<div class="km-bids">'+[[1,'Cena'],[1.25,'+25%'],[1.5,'+50%'],[2,'×2']].map(function(o){var fee=Math.round(ask*o[0]/10000)*10000;var w=Math.round(X.willing(p,s.me,o[0])*100);var dis=fee>b;
  return '<button class="km-bid'+(dis?' dis':'')+'" data-a="buy" data-v="'+p.id+'" data-m="'+o[0]+'"'+(dis?' disabled':'')+'><b>'+o[1]+'</b><span>'+money(fee)+'</span><small class="'+(w>=70?'ok':w>=35?'mid':'lo')+'">szansa '+w+'%</small></button>'}).join('')+'</div>'+
  '<p class="ss-mut">Budżet: '+money(b)+'. Jedna próba na zawodnika w oknie.</p>';return h}

/* ---------- transfery ---------- */
function transView(){var s=S();var op=X.winOpen();var mk=UI.mk;if(s.euOpen&&!s.euSeen){s.euSeen=1;X.save()}
 var h='<div class="ss-fill ss-list km-trans">';
 h+=s.euOpen?'<button class="km-eubn'+(mk.lg==='EU'?' on':'')+'" data-a="mkl" data-v="EU"><i>🌍</i><span><b>Rynek europejski</b><small>Zawodnicy ze 122 klubów z całej Europy'+(mk.lg==='EU'?' · pokazuję teraz':' · kliknij, żeby przeglądać')+'</small></span><em>⭐</em></button>':'<div class="km-eubn lock"><i>🔒</i><span><b>Rynek europejski</b><small>Odblokujesz go, gdy Twój klub awansuje do dowolnej Ligi Europejskiej: mistrzostwo, 2. lub 3. miejsce w Superklasie albo Puchar Kraju.</small></span></div>';
 if(X.euWin()&&!op)h+='<div class="km-tst on"><b>🌍 Specjalne okno europejskie otwarte</b><small>Po wejściu do 1. Ligi Europejskiej przez 3 kolejki możesz kupować zawodników z europejskich klubów. Potem zwykłe okna: lato i zima.</small></div>';
 h+='<div class="km-tst '+(op?'on':'off')+'"><b>'+(op?'🟢 Okno '+X.winName()+' otwarte':'🔒 Okno transferowe zamknięte')+'</b><span>Budżet: <strong>'+money(X.bud(s.me))+'</strong></span><small>'+(op?'Kupujesz i sprzedajesz do '+(X.winName()==='letnie'?'4.':'20.')+' kolejki.':'Okna: lato (start sezonu do 4. kolejki) i zima (przerwa do 20. kolejki). Możesz przeglądać rynek.')+'</small></div>';
 if(s.offers&&s.offers.length){h+='<p class="ss-lbl">📨 Oferty za Twoich zawodników</p>'+s.offers.map(function(o){var p=P(o.pid);if(!p)return '';return '<div class="km-off"><span>'+crest(o.from,'sm')+' <b>'+esc(tn(o.from))+'</b> chce <b>'+esc(p.n)+'</b> ('+p.ovr+')<small>Oferta '+money(o.amt)+' · wartość '+money(X.value(p))+'</small></span>'+btn('✅ Sprzedaj','offY','go sm',' data-v="'+o.id+'"')+btn('✕','offN','ghost sm',' data-v="'+o.id+'"')+'</div>'}).join('')}
 var max=[0,200000,500000,1000000,3000000];
 h+='<p class="ss-lbl">🔎 Rynek</p><div class="km-flt"><div class="ss-seg sm">'+[['ALL','Wszystkie'],['E','Superklasa'],['L1','1 liga'],['L2','2 liga'],['L3','3 liga']].concat(s.euOpen?[['EU','⭐ Europa']]:[]).map(function(f){return '<button class="'+(mk.lg===f[0]?'on':'')+'" data-a="mkl" data-v="'+f[0]+'">'+f[1]+'</button>'}).join('')+'</div>'+
  '<div class="ss-seg sm">'+[['ALL','Poz.'],['BR','BR'],['OBR','OBR'],['POM','POM'],['NAP','NAP']].map(function(f){return '<button class="'+(mk.g===f[0]?'on':'')+'" data-a="mkg" data-v="'+f[0]+'">'+f[1]+'</button>'}).join('')+'</div>'+
  '<div class="ss-seg sm">'+max.map(function(v){return '<button class="'+(mk.max===v?'on':'')+'" data-a="mkm" data-v="'+v+'">'+(v?'do '+money(v).replace(' zł',''):'Każda cena')+'</button>'}).join('')+'</div>'+
  '<input class="ss-q" data-a="mkq" placeholder="Szukaj nazwiska lub klubu..." value="'+esc(mk.q)+'"></div>'+
  '<div class="ss-sortb">'+[['ovr','Ocena'],['pot','Potencjał'],['cheap','Cena'],['young','Wiek']].map(function(o){return '<button class="'+(mk.s===o[0]?'on':'')+'" data-a="mks" data-v="'+o[0]+'">'+o[1]+'</button>'}).join('')+'</div>';
 var q=mk.q.toLowerCase();var all=X.plist().filter(function(p){if(p.cl===s.me||X.isY(p.cl))return false;if(X.isF(p.cl)&&!s.euOpen)return false;var lg=X.lgOf(p.cl);if(mk.lg!=='ALL'&&lg!==mk.lg)return false;if(mk.g!=='ALL'&&X.POSG[p.pos]!==mk.g)return false;
  if(q&&p.n.toLowerCase().indexOf(q)<0&&tn(p.cl).toLowerCase().indexOf(q)<0)return false;return true});
 if(mk.max)all=all.filter(function(p){return X.value(p)<=mk.max});
 var sk={ovr:function(p){return -p.ovr*100+X.age(p)},pot:function(p){return -p.pot*100+X.age(p)},cheap:function(p){return X.value(p)},young:function(p){return X.age(p)*100-p.pot}}[mk.s];
 all.sort(function(a,b){return sk(a)-sk(b)});
 h+='<p class="ss-mut">'+all.length+' zawodników · pokazuję 60 · cena zależy od ligi i roli w klubie</p>'+all.slice(0,60).map(function(p){return mrow(p)}).join('');
 var log=s.trlog.filter(function(t){return t.y===s.season}).slice(0,10);
 if(log.length)h+='<p class="ss-lbl">🔁 Ostatnie transfery w lidze</p>'+log.map(function(t){return '<div class="km-lg"><b>'+esc(t.n)+'</b> <span>'+esc(tn(t.f))+' → '+esc(tn(t.t))+'</span><em>'+money(t.fee)+'</em></div>'}).join('');
 return h+'</div>'}
function mrow(p){var s=S();var ask=X.askPrice(p,s.me);var lk=p.lock===X.winId();
 return '<button class="ss-row" data-a="pinfo" data-v="'+p.id+'"><i class="t'+tier(p.ovr)+'">'+p.ovr+'</i><span><b>'+esc(p.n)+(lk?' ❌':'')+'</b><small>'+X.POSN[p.pos]+' · '+X.age(p)+' l. · pot. '+p.pot+' · '+crest(p.cl,'xs')+' '+flagI(p.cl)+esc(tn(p.cl))+'</small></span>'+formIc(p)+'<em class="km-val'+(ask>X.bud(s.me)?' no':'')+'">'+money(ask)+'</em></button>'}

/* ---------- tabele ---------- */
function zones(lg){var z={};if(lg==='E'){z[1]=['up','Mistrz'];z[16]=z[17]=z[18]=['dn','Spadek']}else{z[1]=z[2]=['up','Awans'];z[3]=z[4]=z[5]=z[6]=['po','Baraże'];z[16]=z[17]=z[18]=['dn','Spadek']}return z}
function legend(Z){var seen={},h='';Object.keys(Z).forEach(function(k){var v=Z[k];if(seen[v[1]])return;seen[v[1]]=1;var ks=Object.keys(Z).filter(function(q){return Z[q][1]===v[1]});h+='<span class="z-'+v[0]+'"><i></i>'+(ks.length>1?ks[0]+'-'+ks[ks.length-1]:ks[0])+'. '+esc(v[1])+'</span>'});return h?'<div class="ss-leg">'+h+'</div>':''}
function tableHTML(lg){var s=S(),t=X.table(lg),Z=zones(lg);
 return '<div class="ss-tab km-tab"><table><tr><th></th><th></th><th>M</th><th>Br.</th><th>Pkt</th><th class="km-fm">Forma</th></tr>'+t.map(function(r,i){return '<tr class="'+(r.c===s.me?'me ':'')+(Z[i+1]?'z-'+Z[i+1][0]:'')+'"><td>'+(i+1)+'</td><td>'+crest(r.c,'xs')+' '+esc(tn(r.c))+(T[r.c].res?' <small>(rez.)</small>':'')+'</td><td>'+r.p+'</td><td>'+r.gf+':'+r.ga+'</td><td><b>'+r.pts+'</b></td><td class="km-fm">'+r.fm.slice(-5).map(function(x){return '<i class="r'+x+'"></i>'}).join('')+'</td></tr>'}).join('')+'</table>'+legend(Z)+'</div>'}
function cupHTML(){var s=S(),c=s.cup;if(!c)return '';var h='<div class="km-cup">';
 if(c.win)h+='<p class="ss-big">🏆 '+esc(tn(c.win))+'</p>';
 var rounds=c.hist.slice().reverse();if(!c.win)rounds.unshift({k:c.k,ties:c.ties,cur:1});
 rounds.forEach(function(r){var ties=r.ties.slice().sort(function(a,b){var am=a.h===s.me||a.a===s.me?0:1,bm=b.h===s.me||b.a===s.me?0:1;return am-bm});
  h+='<p class="ss-lbl">'+X.CUPR[r.k]+(r.cur?' · następna runda':'')+'</p><div class="km-ties">'+ties.slice(0,r.k<2?8:16).map(function(t){var me=t.h===s.me||t.a===s.me;return '<div class="km-tie'+(me?' me':'')+'"><span class="'+(t.w===t.h?'w':'')+'">'+crest(t.h,'xs')+esc(tn(t.h))+'</span><b>'+(t.hg==null?'-':t.hg+':'+t.ag+(t.pens?' k':''))+'</b><span class="'+(t.w===t.a?'w':'')+'">'+esc(tn(t.a))+crest(t.a,'xs')+'</span></div>'}).join('')+(r.ties.length>(r.k<2?8:16)?'<p class="ss-mut">... i '+(r.ties.length-(r.k<2?8:16))+' innych par</p>':'')+'</div>'});
 return h+'</div>'}
function scorersHTML(lg){var s=S();var cl=s.lg[lg];var a=X.plist().filter(function(p){return cl.indexOf(p.cl)>=0&&p.cs.g>0}).sort(function(x,y){return y.cs.g-x.cs.g}).slice(0,15);
 return '<div class="ss-tab"><table><tr><th></th><th>Zawodnik</th><th>Klub</th><th>Gole</th></tr>'+a.map(function(p,i){return '<tr class="'+(p.cl===s.me?'me':'')+'"><td>'+(i+1)+'</td><td>'+esc(p.n)+'</td><td>'+crest(p.cl,'xs')+' '+esc(tn(p.cl))+'</td><td><b>'+p.cs.g+'</b></td></tr>'}).join('')+'</table>'+(a.length?'':'<p class="ss-mut">Sezon jeszcze się nie zaczął.</p>')+'</div>'}
function fixturesHTML(){var s=S(),lg=X.lgOf(s.me);var fx=s.fx[lg].filter(function(f){return f.h===s.me||f.a===s.me}).sort(function(a,b){return a.r-b.r});
 return '<div class="km-fx">'+fx.map(function(f){var home=f.h===s.me,opp=home?f.a:f.h;var res='';if(f.hg!==null){var g1=home?f.hg:f.ag,g2=home?f.ag:f.hg;res='<b class="ss-rs r'+(g1>g2?'W':g1<g2?'L':'D')+'">'+f.hg+':'+f.ag+'</b>'}else res='<b class="km-nx">'+(f.r+1)+'. kol.</b>';
  return '<div class="km-fxr"><small>'+(f.r+1)+'</small>'+crest(opp,'xs')+'<span>'+(home?'':'@ ')+esc(tn(opp))+'</span>'+res+'</div>'}).join('')+'</div>'}
function compView(){var s=S();var v=UI.tlg||X.lgOf(s.me);if(v==='L3')v='E';
 var segs=[['E','Superklasa'],['L1','1 liga'],['L2','2 liga'],['CUP','Puchar'],['SC','Strzelcy'],['FX','Terminarz']];
 var h='<div class="ss-fill ss-comp"><div class="ss-seg sm">'+segs.map(function(x){return '<button class="'+(v===x[0]?'on':'')+'" data-a="tlg" data-v="'+x[0]+'">'+x[1]+'</button>'}).join('')+'</div>';
 if(v==='CUP')h+=cupHTML();else if(v==='SC')h+='<p class="ss-lbl">Strzelcy · '+esc(lgName(s.me))+'</p>'+scorersHTML(X.lgOf(s.me));else if(v==='FX')h+='<p class="ss-lbl">Terminarz · '+esc(tn(s.me))+'</p>'+fixturesHTML();
 else h+='<p class="ss-lbl">'+X.LG[v]+' '+s.season+'/'+((s.season+1)%100)+'</p>'+tableHTML(v);
 return h+'</div>'}
function youthView(){var s=S();var yl=X.myYouth().sort(function(a,b){return b.pot-a.pot||b.ovr-a.ovr});var yt=X.ytable();var yi=yt.map(function(r){return r.c}).indexOf(s.me);var last=s.yl&&s.yl.last;
 var h='<div class="ss-fill ss-list km-youth"><div class="km-tst on"><b>🌱 Akademia '+esc(tn(s.me))+'</b><span>Siła juniorów: <strong>'+Math.round(X.youthStr(s.me))+'</strong></span><small>Juniorzy (15-18 lat) grają w lidze juniorów i rosną. Kliknij zawodnika, żeby przesunąć go do pierwszej drużyny. Po skończeniu 19 lat juniorzy sami przechodzą do seniorów albo odchodzą.</small></div>';
 if(last)h+='<p class="km-agg">Ostatni mecz juniorów: '+crest(last.h,'xs')+' '+esc(tn(last.h))+' <b>'+last.hg+':'+last.ag+'</b> '+esc(tn(last.a))+' '+crest(last.a,'xs')+'</p>';
 h+='<p class="ss-lbl">Juniorzy ('+yl.length+')</p>'+yl.map(function(p){var st='★★★★★'.slice(0,p.pot>=80?5:p.pot>=74?4:p.pot>=68?3:p.pot>=62?2:1);
  return '<button class="ss-row" data-a="yinfo" data-v="'+p.id+'"><i class="t'+tier(p.ovr)+'">'+p.ovr+'</i><span><b>'+esc(p.n)+'</b><small>'+X.POSN[p.pos]+' · '+X.age(p)+' l. · '+p.cs.a+' m. '+p.cs.g+' g.'+(p.inj?' · 🚑':'')+'</small></span><em class="ss-pot">'+st+'</em><em class="km-val">pot. '+p.pot+'</em></button>'}).join('');
 if(yt.length){var Z={};Z[1]=['up','Mistrz juniorów'];h+='<p class="ss-lbl">Liga juniorów · '+esc(X.LG[s.yl.lg])+(yi>=0?' · Twoje miejsce: '+(yi+1)+'.':'')+'</p><div class="ss-tab km-tab"><table><tr><th></th><th></th><th>M</th><th>Br.</th><th>Pkt</th></tr>'+yt.map(function(r,i){return '<tr class="'+(r.c===s.me?'me ':'')+(Z[i+1]?'z-'+Z[i+1][0]:'')+'"><td>'+(i+1)+'</td><td>'+crest(r.c,'xs')+' '+esc(tn(r.c))+'</td><td>'+r.p+'</td><td>'+r.gf+':'+r.ga+'</td><td><b>'+r.pts+'</b></td></tr>'}).join('')+'</table></div>'}
 return h+'</div>'}
function yinfo(id){var p=P(id);function c(l,v){return '<div><small>'+l+'</small><b>'+v+'</b></div>'}
 UI.modal='<div class="ss-pi"><i class="t'+tier(p.ovr)+'">'+p.ovr+'</i><div><h3>'+esc(p.n)+'</h3><p class="ss-mut">'+X.POSN[p.pos]+' · '+X.age(p)+' lat · junior</p></div></div><div class="ss-pg">'+c('Potencjał',p.pot)+c('Forma',formIc(p))+c('Wartość',money(X.value(p)))+c('Sezon',p.cs.a+' m. / '+p.cs.g+' g.')+'</div>'+
  '<div class="km-act">'+btn('⬆ Do pierwszej drużyny','yup','go',' data-v="'+id+'"')+btn('Zwolnij z akademii','yrel','bad',' data-v="'+id+'"')+'</div><p class="ss-mut">W pierwszej drużynie junior gra o skład z seniorami, a w meczach szybciej się rozwija.</p>';render()}
function tieRow(t){var s=S();var g=X.tieAgg(t);var me=t.a===s.me||t.b===s.me;var res=t.l1?(t.k==='F'?t.l1[0]+':'+t.l1[1]:t.l1[0]+':'+t.l1[1]+(t.l2?' · '+t.l2[1]+':'+t.l2[0]+' (rewanż)':'')):'-';
 return '<div class="km-tie'+(me?' me':'')+'"><span class="'+(t.w===t.a?'w':'')+'">'+crest(t.a,'xs')+flagI(t.a)+esc(tn(t.a))+'</span><b>'+(t.l1?g[0]+':'+g[1]+(t.pens?' k':''):'-')+'</b><span class="'+(t.w===t.b?'w':'')+'">'+esc(tn(t.b))+flagI(t.b)+crest(t.b,'xs')+'</span><small>'+res+'</small></div>'}
function euroView(){var s=S(),E=s.eu;var h='<div class="ss-fill ss-comp km-euro">';
 if(!E){return h+'<p class="ss-mut">Europejskie puchary wystartują w nowym sezonie.</p></div>'}
 var my=E.ent.filter(function(x){return x.c===s.me})[0];
 if(!E.ent.length)return h+'<div class="km-tst"><b>⭐ Europejskie puchary</b><small>'+(s.season===2026?'W pierwszym sezonie polskie kluby nie grają w Europie.':'W tym sezonie żaden polski klub nie gra w Europie.')+' Do pucharów awansują: mistrz Superklasy (eliminacje 1. Ligi Europejskiej), zdobywca Pucharu Kraju (2. Liga Europejska), 2. i 3. drużyna (3. Liga Europejska). Awans do dowolnej Ligi Europejskiej otwiera rynek transferowy w Europie.</small></div></div>';
 h+='<div class="km-tst '+(my&&!my.out?'on':'')+'"><b>⭐ Europejskie puchary '+s.season+'/'+((s.season+1)%100)+'</b><small>1. Liga Europejska, 2. Liga Europejska i 3. Liga Europejska. Mistrz Superklasy startuje w eliminacjach 1. Ligi, zdobywca Pucharu Kraju w 2. Lidze, 2. i 3. drużyna w 3. Lidze. Kto odpadnie z wyższych eliminacji, spada do niższego pucharu. Faza ligowa: 36 drużyn, 1-8 awans do 1/8 finału, 9-24 baraż.'+(s.euOpen?'':' Awans do dowolnej Ligi Europejskiej otwiera rynek transferowy w Europie.')+'</small></div>';
 h+='<p class="ss-lbl">Polskie kluby w Europie</p><div class="km-pl">'+(E.ent.length?E.ent.map(function(x){var st=X.euStatus(x.c);return '<div class="km-plr'+(x.c===s.me?' me':'')+(x.out?' out':'')+'">'+crest(x.c,'sm')+'<span><b>'+esc(tn(x.c))+'</b><small>'+X.EUC[x.comp].ic+' '+esc(st.comp)+' · '+esc(st.rd)+'</small></span></div>'}).join(''):'<p class="ss-mut">'+(s.season===2026?'W pierwszym sezonie polskie kluby nie grają w pucharach. Mistrz Superklasy, 2. i 3. drużyna oraz zdobywca Pucharu Kraju zagrają w Europie od następnego sezonu.':'Brak polskich klubów w tym sezonie.')+'</p>')+'</div>';
 var qs=[];for(var c in E.q)qs.push(E.q[c]);if(qs.length)h+='<p class="ss-lbl">Eliminacje</p><div class="km-ties">'+qs.map(tieRow).join('')+'</div>';
 var cc=UI.euc||(my?my.comp:'CL');
 h+='<div class="ss-seg sm">'+['CL','EL','ECL'].map(function(k){return '<button class="'+(cc===k?'on':'')+'" data-a="euc" data-v="'+k+'">'+X.EUC[k].ic+' '+X.EUC[k].n+'</button>'}).join('')+'</div>';
 var C=E.comps[cc];
 if(!C)h+='<p class="ss-mut">Faza ligowa rusza we wrześniu, po eliminacjach.</p>';
 else{if(C.win)h+='<p class="ss-big">🏆 '+esc(tn(C.win))+'</p>';
  ['F','SF','QF','R16','KPO'].forEach(function(k){if(C.ko[k])h+='<p class="ss-lbl">'+X.EUR[k]+'</p><div class="km-ties">'+C.ko[k].map(tieRow).join('')+'</div>'});
  var t=X.lpTable(cc);h+='<p class="ss-lbl">Faza ligowa · '+X.EUC[cc].md+' kolejek</p><div class="ss-tab km-tab"><table><tr><th></th><th></th><th>M</th><th>Br.</th><th>Pkt</th></tr>'+t.map(function(r,i){var z=i<8?'up':i<24?'po':'dn';return '<tr class="'+(r.c===s.me?'me ':'')+'z-'+z+'"><td>'+(i+1)+'</td><td>'+crest(r.c,'xs')+' '+flagI(r.c)+esc(tn(r.c))+'</td><td>'+r.p+'</td><td>'+r.gf+':'+r.ga+'</td><td><b>'+r.pts+'</b></td></tr>'}).join('')+'</table><div class="ss-leg"><span class="z-up"><i></i>1-8. 1/8 finału</span><span class="z-po"><i></i>9-24. baraż</span><span class="z-dn"><i></i>25-36. odpadają</span></div></div>'}
 return h+'</div>'}
function mediaView(){var s=S();UI.mediaNew=0;var no=Math.round(100-s.trust);
 return '<div class="ss-poll"><p>Czy trener '+esc(tn(s.me))+' powinien odejść?</p><div><i style="width:'+no+'%">TAK '+no+'%</i><span>NIE '+(100-no)+'%</span></div></div>'+
 '<div class="ss-fill ss-list">'+s.media.slice(0,10).map(function(m){return '<div class="ss-paper t'+m.tone+'"><small>'+esc(m.src)+' · '+X.MONTHS[(m.m||7)-1]+' '+m.y+'</small><b>'+esc(m.t)+'</b></div>'}).join('')+
 s.news.slice(0,12).map(function(n){return '<div class="ss-paper tn"><small>Wiadomości</small><b>'+esc(n.t)+'</b>'+(n.b?'<p>'+esc(n.b)+'</p>':'')+'</div>'}).join('')+'</div>'}
function gabView(){var s=S(),st=s.stats;function c(l,v){return '<div><b>'+v+'</b><small>'+l+'</small></div>'}
 var sg=Object.keys(s.songs);var my=s.trlog.filter(function(t){return t.f===s.me||t.t===s.me}).slice(0,12);
 return '<div class="ss-fill ss-gab"><div class="ss-kpi">'+c('Mecze',st.p)+c('Wygrane',st.w)+c('Remisy',st.d)+c('Porażki',st.l)+c('Bramki',st.gf+':'+st.ga)+c('% wygr.',(st.p?Math.round(st.w/st.p*100):0)+'%')+'</div>'+
 (s.seasons.length?'<p class="ss-lbl">Sezony</p><div class="km-seas">'+s.seasons.slice().reverse().map(function(x){return '<div>'+crest(x.c,'xs')+'<span>'+x.y+'/'+((x.y+1)%100)+' · '+esc(tn(x.c))+'</span><b>'+x.pos+'. '+esc(X.LG[x.lg])+'</b>'+(x.promo?'<em>⬆</em>':'')+(x.rel?'<em>⬇</em>':'')+(x.champ?'<em>🏆</em>':'')+(x.cup?'<em>🏆P</em>':'')+(x.euw?'<em>⭐</em>':'')+(x.eu?'<small>'+esc(x.eu)+'</small>':'')+'</div>'}).join('')+'</div>':'')+
 (my.length?'<p class="ss-lbl">Twoje transfery</p>'+my.map(function(t){var buy=t.t===s.me;return '<div class="km-lg"><b>'+(buy?'⬅ ':'➡ ')+esc(t.n)+'</b> <span>'+esc(tn(buy?t.f:t.t))+'</span><em class="'+(buy?'no':'')+'">'+(buy?'−':'+')+money(t.fee)+'</em></div>'}).join(''):'')+
 '<p class="ss-lbl">Osiągnięcia '+Object.keys(s.ach).length+'/'+X.ACH.length+'</p><div class="ss-ach">'+X.ACH.map(function(a){var on=s.ach[a[0]];return '<button class="'+(on?'on':'')+'" data-a="achi" data-v="'+a[0]+'" title="'+esc(a[1]+': '+a[2])+'">'+(on?'🏆':'🔒')+'<span>'+esc(a[1])+'</span></button>'}).join('')+'</div>'+
 '<p class="ss-lbl">Piosenki Qastroda ('+sg.length+')</p><div class="ss-songs">'+(sg.length?sg.map(function(k){var so=X.SONGS[k];return so?'<a href="https://www.youtube.com/watch?v='+so.i+'" target="_blank" rel="noopener">▶ '+esc(so.t)+'</a>':''}).join(''):'<p class="ss-mut">Przełam złą serię albo wypromuj młody talent, a kibice zaśpiewają.</p>')+'</div>'+
 '<div class="ss-mini">'+(UI.confNew?btn('Tak, usuń karierę','newConf','bad sm')+btn('Anuluj','newNo','ghost sm'):btn('Nowa kariera','newAsk','ghost sm'))+'</div></div>'}

/* ---------- toast ---------- */
var tT=0;function toast(m){var el=document.getElementById('ssToast');el.textContent=m;el.classList.add('on');clearTimeout(tT);tT=setTimeout(function(){el.classList.remove('on')},2600)}
var GI={tr:'❤ Zaufanie kibiców. Spada po porażkach, rośnie po wygranych.',bd:'🏛 Zaufanie zarządu. Gdy spadnie bardzo nisko, zostaniesz zwolniony. Rośnie, gdy realizujesz cel sezonu.',mo:'💪 Nastrój w szatni. Wpływa na grę drużyny.'};

/* ---------- zdarzenia ---------- */
root.addEventListener('click',function(e){if(Date.now()-noClick<300&&e.target.closest('[data-drag],[data-drop]'))return;var b=e.target.closest('[data-a]');if(!b||!root.contains(b))return;var a=b.getAttribute('data-a'),v=b.getAttribute('data-v');var s=S();
 if(a==='noop')return;
 if(a==='stageTap'){if(UI.MV&&UI.MV.V&&UI.MV.V.replay)UI.MV.V.skipReplay();return}
 if(a==='celX'){UI.cel=null;render();return}
 if(a==='euGo'){s.euNew=0;s.euSeen=1;UI.tab='trans';UI.mk.lg='EU';UI.mk.s='ovr';X.save();render();return}
 if(a==='euLater'){s.euNew=0;X.save();render();return}
 if(a==='skipRep'){if(UI.MV&&UI.MV.V)UI.MV.V.skipReplay();return}
 if(a==='repTog'){UI.noRep=!UI.noRep;b.innerHTML='<small>Powtórki</small> '+(UI.noRep?'wył.':'wł.');if(UI.noRep&&UI.MV&&UI.MV.V)UI.MV.V.skipReplay();return}
 if(a==='euc'){UI.euc=v;render();return}
 if(a==='yinfo'){yinfo(+v);return}
 if(a==='yup'){var ry=X.promoteYouth(+v);toast(ry.msg);UI.modal=null;render();return}
 if(a==='yrel'){var rr=X.releaseYouth(+v);toast(rr.msg);UI.modal=null;render();return}
 if(a==='ydown'){var rd=X.demoteYouth(+v);toast(rd.msg);UI.modal=null;render();return}
 if(a==='mclose'){if(e.target===b){UI.modal=null;render()}return}
 if(a==='full'){setFull(!UI.full);if(b.classList.contains('ss-hb'))b.remove();return}
 if(a==='slg'){UI.nm=(document.getElementById('ssName')||{}).value||'';UI.startLg=v;render();return}
 if(a==='ssel'){UI.nm=(document.getElementById('ssName')||{}).value||'';UI.startSel=v;render();return}
 if(a==='new'){if(!UI.startSel){toast('Wybierz klub.');return}var nm=(document.getElementById('ssName')||{}).value||'';nm=nm.trim()||'Jan Kowalski';X.newGame(nm,UI.startSel);UI.tab='pulpit';UI.newForm=0;if(mob())setFull(true);render();return}
 if(a==='cont'){X.setS(X.load());norm(S());if(mob())setFull(true);render();return}
 if(a==='newForm'){UI.newForm=!UI.newForm;render();return}
 if(a==='ginfo'){toast(GI[v]||'');return}
 if(a==='tab'){UI.tab=v;UI.modal=null;render();return}
 if(a==='toPre'){toPre();return}
 if(a==='quick'){quickPlay();return}
 if(a==='quickPre'){var M0=MM.quick(s.cur);UI.post=M0;s.phase='post';X.save();render();return}
 if(a==='evNext'){X.finishEvent();UI.mediaNew=1;render();return}
 if(a==='ans'){var q=UI.qs[UI.pq];MM.applyAns(q.a[+v].e);UI.pq++;if(UI.pq>=UI.qs.length){s.phase='pre';ensureXI();toast('🎤 Konferencja zakończona. Ustal skład.')}X.save();render();return}
 if(a==='bestXI'){s.xi=null;ensureXI();X.save();render();toast('★ Najlepsza jedenastka');return}
 if(a==='form'){var cur=(s.xi||[]).map(function(e){return P(e.id)}).filter(function(p){return p&&!p.inj&&p.cl===s.me});s.tac.f=v;if(cur.length===11){s.xi=X.autoXI(v,cur);s.xiF=v}else{s.xi=null;ensureXI()}X.save();render();toast('Formacja '+v+' · ten sam skład');return}
 if(a==='resXI'){var all=avail();var best=X.autoXI(s.tac.f,all).map(function(e){return e.id});var rest=all.filter(function(p){return best.indexOf(p.id)<0});if(!rest.some(function(p){return p.pos==='GK'})){var gk=all.filter(function(p){return p.pos==='GK'})[0];if(gk)rest.push(gk)}if(rest.length<11){toast('Za mało zdrowych rezerwowych.');return}s.xi=X.autoXI(s.tac.f,rest);s.xiF=s.tac.f;X.save();render();toast('🔄 Grają rezerwowi');return}
 if(a==='pt'||a==='bc'){var pk=UI.pick;
  if(pk&&pk!==v&&!(pk[0]==='b'&&v[0]==='b')){onDrop(pk,v);if(s.phase==='match')renderOv();return}
  if(pk===v){UI.pick=null}else if(a==='pt'&&s.phase==='pre'&&!pk){slotSheet(+v.split(':')[1]);return}else UI.pick=v;
  if(s.phase==='match')renderOv();else render();return}
 if(a==='put'){var si=+v,pid=+b.getAttribute('data-p');var e1=s.xi.filter(function(x){return x.i===si})[0];var other=s.xi.filter(function(x){return x.id===pid})[0];if(other)other.id=e1.id;e1.id=pid;UI.modal=null;X.save();render();return}
 if(a==='style'){var st=STYLES.filter(function(x){return x[0]===v})[0];s.tac.press=st[3].press;s.tac.tempo=st[3].tempo;s.tac.ment=st[3].ment;X.save();
  if(s.phase==='match'&&UI.MV){var MV=UI.MV;if(MV.sheet==='sty'){MV.sheet=null;applyChange();renderOv();MV.V.start();toast(st[1]+' Styl: '+st[2])}else{MV.changed=1;renderOv()}}else render();return}
 if(a==='kick'){startMatch();return}
 if(a==='spd'){UI.spd=UI.spd===1?2:UI.spd===2?4:1;b.innerHTML='<small>Tempo</small> x'+UI.spd;return}
 if(a==='skip'){skipMatch();return}
 if(a==='subs'){if(UI.MV&&!UI.MV.end)openSheet('subs');return}
 if(a==='sty'){var M2=UI.MV;if(!M2||M2.end)return;if(M2.sheet==='sty'){M2.sheet=null;renderOv();M2.V.start()}else openSheet('sty');return}
 if(a==='sheetGo'){var MV2=UI.MV;if(MV2.changed&&MV2.sheet!=='ht')applyChange();else if(MV2.changed)MV2.V.syncXI();MV2.changed=0;closeSheet();return}
 if(a==='injIn'){var MV3=UI.MV,ie=MV3.inj;MM.doSub(MV3.M,ie.sid,+v,'kontuzja',ie.min);applyChange();toast('🔁 '+sur(P(+v).n)+' wchodzi');closeSheet();return}
 if(a==='injStay'){closeSheet();return}
 if(a==='tipAtt'||a==='tipBus'){var st2=STYLES.filter(function(x){return x[0]===(a==='tipAtt'?'att':'bus')})[0];s.tac.press=st2[3].press;s.tac.tempo=st2[3].tempo;s.tac.ment=st2[3].ment;UI.MV.V.stop();applyChange();UI.MV.V.start();var n=document.getElementById('ssNote');if(n)n.className='ss-tip';toast(st2[1]+' Styl: '+st2[2]);return}
 if(a==='noteX'){var n2=document.getElementById('ssNote');if(n2)n2.className='ss-tip';return}
 if(a==='penEnd'){UI.MV.sheet=null;endMatch();return}
 if(a==='toPost'){s.phase='post';X.save();render();return}
 if(a==='next'){nextAfterPost();return}
 if(a==='dbf'){UI.dbf=v;render();return}
 if(a==='tlg'){UI.tlg=v;render();return}
 if(a==='pinfo'){pinfo(+v);return}
 if(a==='tl'){var p=P(+v);p.tl=p.tl?0:1;X.save();toast(p.tl?'📋 '+sur(p.n)+' na liście transferowej':'Zdjęty z listy');pinfo(+v);return}
 if(a==='qsell'){var r=X.quickSale(+v);UI.modal=null;toast(r.msg||'');render();return}
 if(a==='buy'){var r2=X.tryBuy(+v,+b.getAttribute('data-m'));toast(r2.msg);if(r2.ok){UI.modal=null;s.xi=null;render()}else pinfo(+v);return}
 if(a==='offY'){var o=s.offers.filter(function(x){return x.id===+v})[0];if(o){var r3=X.sellTo(o);toast(r3.msg||'');s.offers=s.offers.filter(function(x){return x.id!==+v});X.save()}render();return}
 if(a==='offN'){var o2=s.offers.filter(function(x){return x.id===+v})[0];if(o2){var p2=P(o2.pid);if(p2&&!p2.tl)p2.mood=X.clamp(p2.mood+3,0,100)}s.offers=s.offers.filter(function(x){return x.id!==+v});X.save();toast('Oferta odrzucona');render();return}
 if(a==='mkl'){UI.mk.lg=v;render();return}if(a==='mkg'){UI.mk.g=v;render();return}if(a==='mkm'){UI.mk.max=+v;render();return}if(a==='mks'){UI.mk.s=v;render();return}
 if(a==='job'){X.takeJob(v);s.firedOffers=null;if(s.cal[s.ev]&&s.cal[s.ev].t==='END'){s.endDone=0;s.lastEnd=null;X.newSeason()}s.phase='hub';UI.tab='pulpit';X.save();toast('🤝 Witamy w '+tn(v)+'!');render();return}
 if(a==='newSeason'){s.endDone=0;s.lastEnd=null;X.newSeason();s.phase='hub';X.save();UI.mediaNew=1;render();return}
 if(a==='restart'||a==='newConf'){UI.confNew=0;try{localStorage.removeItem(X.KEY)}catch(x){}X.setS(null);UI.tab='pulpit';UI.newForm=0;render();return}
 if(a==='achi'){var ac=X.ACH.filter(function(x){return x[0]===v})[0];if(ac)toast((s.ach[v]?'🏆 ':'🔒 ')+ac[1]+': '+ac[2]);return}
 if(a==='newAsk'){UI.confNew=1;render();return}if(a==='newNo'){UI.confNew=0;render();return}
});
root.addEventListener('input',function(e){var t=e.target;if(t.getAttribute('data-a')==='kq'){UI.kq=t.value;clearTimeout(UI.kT);UI.kT=setTimeout(function(){var pos=t.selectionStart;render();var n=app.querySelector('[data-a=kq]');if(n){n.focus();n.setSelectionRange(pos,pos)}},200);return}if(t.getAttribute('data-a')==='mkq'){UI.mk.q=t.value;clearTimeout(UI.qT);UI.qT=setTimeout(function(){var pos=t.selectionStart;render();var n=app.querySelector('[data-a=mkq]');if(n){n.focus();n.setSelectionRange(pos,pos)}},300)}});
root.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.id==='ssName'){var b=app.querySelector('[data-a=new]');if(b)b.click()}});

/* start */
X.setS(null);render();
if(X.DEBUG)window.__km={UI:UI,render:render,startMatch:startMatch,skipMatch:skipMatch,nextAfterPost:nextAfterPost,setFull:setFull};
})();
