/* Symulator selekcjonera: interfejs v4 (aplikacja jednoekranowa, przeciągnij i upuść) */
(function(){
'use strict';
var X=window.SS;if(!X)return;var MM=X.M;
var root=X.root,esc=X.esc,P=X.P,T=X.TEAMS,sur=X.sur;
function S(){return X.S()}
var UI={tab:'pulpit',cg:'BR',sel:[],modal:null,MV:null,spd:1,dbf:'ALL',dbs:'ovr',dbq:'',pick:null,comp:0,full:false,mm:0};
root.innerHTML='<div class="ss-app" id="ssApp"></div><div class="ss-toast" id="ssToast"></div>';
var app=document.getElementById('ssApp');

/* ---------- drobne elementy ---------- */
function tn(c){return T[c]?T[c].n:c}
function flag(c,sz){var t=T[c]||{c1:'#fff',c2:'#dc143c'};var F=window.SSFLAGS||{};return '<i class="ss-flag'+(sz?' '+sz:'')+'" style="'+(F[c]?'background:'+F[c]:'--c1:'+t.c1+';--c2:'+t.c2)+'"></i>'}
function tier(v){return v>=80?'g':v>=75?'s':v>=70?'b':'n'}
function formIc(p){var f=p.form;return '<em class="ss-fm '+(f>=1?'up':f<=-1?'dn':'eq')+'">'+(f>=1?'▲':f<=-1?'▼':'•')+'</em>'}
function btn(lbl,a,cls,extra){return '<button class="ss-btn '+(cls||'')+'" data-a="'+a+'"'+(extra||'')+'>'+lbl+'</button>'}
function dateStr(){var s=S();return X.MON[s.m]+' '+s.y}
function cta(hint,lbl,a,dis){return '<div class="ss-cta"><span class="ss-hint">'+(hint||'')+'</span>'+btn(lbl+' <i>›</i>',a,'go big'+(dis?' dis':''))+'</div>'}
function venue(m){return m.stage||(m.fr?'mecz towarzyski':m.neutral?'teren neutralny':m.home?'u siebie':'na wyjeździe')}
function sides(m){return (m.home||m.neutral)?['POL',m.opp]:[m.opp,'POL']}
function mob(){return window.innerWidth<760}

/* ---------- pełny ekran (tryb aplikacji) ---------- */
function setFull(on){UI.full=on;root.classList.toggle('ss-full',on);document.documentElement.classList.toggle('ss-lock',on);
 var d=document;if(on){var q=root.requestFullscreen||root.webkitRequestFullscreen;if(q&&!d.fullscreenElement){try{var pr=q.call(root);if(pr&&pr.catch)pr.catch(function(){})}catch(e){}}}
 else if(d.fullscreenElement||d.webkitFullscreenElement){try{(d.exitFullscreen||d.webkitExitFullscreen).call(d)}catch(e){}}
 app.querySelectorAll('[data-a=full]').forEach(function(b){if(b.classList.contains('ss-fs'))b.outerHTML=fsBtn()})}
document.addEventListener('fullscreenchange',function(){if(!document.fullscreenElement&&UI.full&&!mob())setFull(false)});

/* ---------- szkielet ---------- */
var TABS=[['pulpit','⚽','Pulpit'],['kadra','👥','Piłkarze'],['rozgr','🏆','Tabele'],['media','📰','Media'],['gab','💼','Gabinet']];
function gauge(k,ic,l,v){return '<button class="ss-g '+k+'" data-a="ginfo" data-v="'+k+'" style="--v:'+Math.round(v)+'"><i>'+ic+'</i><b>'+Math.round(v)+'</b><em>'+l+'</em></button>'}
function fsBtn(){return '<button class="ss-fs" data-a="full">'+(UI.full?'✕ <span>Zamknij pełny ekran</span>':'⛶ <span>Pełny ekran</span>')+'</button>'}
function header(){var s=S();
 return '<header class="ss-hd"><div class="ss-me">'+flag('POL','md')+'<div><b>'+esc(s.name)+'</b><small>'+dateStr()+'</small></div></div>'+
 '<div class="ss-gs">'+gauge('tr','❤','Kibice',s.trust)+gauge('pr','📰','Presja',s.press)+gauge('mo','💪','Szatnia',s.morale)+'<button class="ss-g rk" data-a="ginfo" data-v="rk"><i>🌍</i><b>'+X.polRank()+'.</b><em>Ranking</em></button></div>'+
 fsBtn()+'</header>'}
function nav(){return '<nav class="ss-nav">'+TABS.map(function(t){return '<button class="'+(UI.tab===t[0]?'on':'')+'" data-a="tab" data-v="'+t[0]+'"><i>'+t[1]+'</i><span>'+t[2]+'</span>'+(t[0]==='media'&&UI.mediaNew?'<b class="ss-dot"></b>':'')+'</button>'}).join('')+'</nav>'}

function norm(sv){if(!sv)return sv;if(sv.phase==='match'&&!UI.MV)sv.phase='pre';if(sv.phase==='press'&&!(UI.qs&&UI.qs[UI.pq])){sv.phase='pre';ensureXI()}if(sv.phase==='post'&&!UI.post){var w0=sv.win;sv.newSong=null;w0.mi++;if(w0.mi<w0.matches.length)sv.phase='pre';else{MM.finishWindow();sv.phase='wrap'}X.save()}if(sv.phase==='callup'&&!UI.callReady)prepCall();return sv}
function render(){var s=S();if(s)norm(s);
 if(!s){unmountMatch();app.className='ss-app st';app.innerHTML=startScreen();return}
 if(s.phase==='match'&&UI.MV){if(!UI.mm){app.className='ss-app inm';app.innerHTML=matchShell();UI.mm=1;mountMatch()}renderOv();return}
 unmountMatch();
 var scr=UI.tab==='pulpit'?pulpit():UI.tab==='kadra'?dbView():UI.tab==='rozgr'?compView():UI.tab==='media'?mediaView():gabView();
 app.className='ss-app';
 var key=UI.tab+':'+s.phase+':'+(UI.between?1:0);var na=UI.lastKey===key?' noanim':'';UI.lastKey=key;
 app.innerHTML=header()+'<div class="ss-body">'+nav()+'<main class="ss-scr k-'+(UI.tab==='pulpit'?(UI.between&&s.phase==='hub'?'news':s.phase):UI.tab)+na+'">'+scr+'</main></div>'+(UI.modal?'<div class="ss-modal" data-a="mclose"><div class="ss-mbox" data-a="noop">'+UI.modal+'</div></div>':'');
 if(s.newAch&&s.newAch.length){toast('🏆 Osiągnięcie: '+s.newAch.join(', '));s.newAch=[];X.save()}}

function startScreen(){var has=X.load();var form=!has||UI.newForm;
 return '<div class="ss-start"><div class="ss-stin"><h2>Symulator selekcjonera<em>reprezentacji Polski</em></h2>'+
 '<p class="ss-slog">Powołaj. Ustaw. Wygraj.</p>'+
 (has&&!UI.newForm?'<button class="ss-btn go big wide ss-cont" data-a="cont">▶ Kontynuuj<small>'+esc(has.name)+' · '+X.MON[has.m]+' '+has.y+'</small></button><button class="ss-lnk" data-a="newForm">Zacznij nową kadencję</button>':'')+
 (form?'<div class="ss-newg"><input id="ssName" maxlength="28" placeholder="Twoje imię i nazwisko" autocomplete="off">'+btn('▶ Zacznij','new','go big')+'</div>'+(has?'<button class="ss-lnk" data-a="newForm">Wróć</button>':''):'')+
 (mob()?'':'<button class="ss-lnk fs" data-a="full">⛶ Pełny ekran</button>')+'</div></div>'}

/* ---------- pulpit ---------- */
var STEPS=[['hub','Start'],['callup','Powołania'],['press','Konferencja'],['pre','Skład'],['match','Mecz'],['post','Media']];
function stepline(){var s=S(),ph=s.phase==='wrap'?'post':s.phase;var k=STEPS.map(function(x){return x[0]}).indexOf(ph);var w=s.win;
 return '<div class="ss-stp">'+STEPS.map(function(x,i){return '<i class="'+(i<k?'d':i===k?'o':'')+'"></i>'}).join('')+'<span>'+(STEPS[k]?STEPS[k][1]:'')+(w&&w.matches.length>1&&k>=3&&s.phase!=='wrap'?' · mecz '+(w.mi+1)+'/'+w.matches.length:'')+'</span></div>'}
function pulpit(){var ph=S().phase;if(ph==='hub'&&UI.between)return betweenView();var b=ph==='callup'?callup():ph==='press'?pressView():ph==='pre'?pre():ph==='post'?post():ph==='wrap'?wrap():hub();return stepline()+b}
function bigVs(m){var sd=sides(m),t=T[m.opp];
 return '<div class="ss-vs"><div class="ss-vt">'+flag(sd[0],'xl')+'<b>'+esc(tn(sd[0]))+'</b></div><div class="ss-vm"><em>VS</em><small>'+esc(venue(m))+'</small></div><div class="ss-vt">'+flag(sd[1],'xl')+'<b>'+esc(tn(sd[1]))+'</b></div></div>'+
 '<p class="ss-opp"><span>Siła rywala <b>'+Math.round(X.teamStr(m.opp))+'</b></span>'+(t&&t.stars&&t.stars.length?'<span>Gwiazda <b>'+esc(sur(t.stars[0]))+'</b></span>':'')+'</p>'}
function midVs(m){var sd=sides(m);var r=m.res?'<b class="ss-rs r'+m.res+'">'+((m.home||m.neutral)?m.gP+':'+m.gO:m.gO+':'+m.gP)+'</b>':'<em>vs</em>';
 return '<div class="ss-mv">'+flag(sd[0],mob()?'md':'lg')+'<b>'+esc(tn(sd[0]))+'</b>'+r+'<b>'+esc(tn(sd[1]))+'</b>'+flag(sd[1],mob()?'md':'lg')+'<small>'+esc(venue(m))+'</small></div>'}
function topHead(){var s=S();var m=s.media&&s.media[0];if(m)return m.t;var n=s.news&&s.news[0];return n?n.t:''}
function hub(){var s=S(),w=s.win,g=MM.setGoal(w);
 var h='<div class="ss-fill ss-hub"><p class="ss-eye">'+esc(w.title)+' · '+X.MON[w.m]+' '+w.y+'</p>';
 h+=w.matches.length===1?bigVs(w.matches[0]):'<div class="ss-mvs">'+w.matches.map(midVs).join('')+'</div>';
 if(g)h+='<p class="ss-goal"><i>🎯</i><span>Cel PZPN</span><b>'+esc(g.text)+'</b></p>';
 if(s.newSong)h+='<a class="ss-songp" href="https://www.youtube.com/watch?v='+X.SONGS[s.newSong].i+'" target="_blank" rel="noopener">🎵 Odblokowana piosenka: <b>'+esc(X.SONGS[s.newSong].t)+'</b> ▶</a>';
 var hd=topHead();if(hd)h+='<button class="ss-tick" data-a="tab" data-v="media"><i>📰</i><span>'+esc(hd)+'</span><em>›</em></button>';
 return h+'</div>'+cta(w.kind==='T'?'Turniej · kadra 26':w.kind==='PO'?'Mecz o wszystko':'','Powołaj kadrę','toCall')}

/* ---------- między zgrupowaniami ---------- */
function betweenView(){var s=S();var all=eligible().filter(function(p){return !p.ret});
 function row(p,txt,cls){return '<button class="ss-nr '+(cls||'')+'" data-a="pinfo" data-v="'+p.id+'"><i class="t'+tier(p.ovr)+'">'+p.ovr+'</i><span><b>'+esc(p.n)+'</b><small>'+txt+'</small></span>'+formIc(p)+'</button>'}
 function stat(p){var c=p.cs||{a:0,g:0};return esc(p.cl)+' · '+(c.g>0&&p.pos!=='GK'?c.g+' gol'+(c.g===1?'':c.g<5?'e':'i')+' w '+c.a+' m.':c.a+' m. w sezonie')}
 function why(p){return esc(p.cl)+' · '+(p.mins<.35?'siedzi na ławce':'słaba forma')}
 var hot=all.filter(function(p){return !p.inj&&p.mins>=.5&&p.form>=0}).sort(function(a,b){return (b.form*3+(b.cs?b.cs.g:0)*.8+b.ovr*.15)-(a.form*3+(a.cs?a.cs.g:0)*.8+a.ovr*.15)}).slice(0,4);
 var cold=all.filter(function(p){return !p.inj&&p.ovr>=70&&(p.form<=-1||p.mins<.35)}).sort(function(a,b){return b.ovr-a.ovr}).slice(0,3);
 var inj=all.filter(function(p){return p.inj}).sort(function(a,b){return b.ovr-a.ovr}).slice(0,4);
 var news=s.news.filter(function(n){return n.fresh}).slice(0,4);if(!news.length)news=s.news.slice(0,3);
 var h='<div class="ss-fill ss-betw"><div class="ss-bh"><p class="ss-eye">Między zgrupowaniami · '+dateStr()+'</p><h2>Co słychać u Polaków</h2></div><div class="ss-bg">'+
 '<div class="ss-bcd hot"><p class="ss-lbl">🔥 W formie</p>'+hot.map(function(p){return row(p,stat(p))}).join('')+'</div>'+
 '<div class="ss-bcd inj"><p class="ss-lbl">🚑 Kontuzje</p>'+(inj.length?inj.map(function(p){return row(p,esc(p.cl)+' · pauza '+p.inj+' tyg.','inj')}).join(''):'<p class="ss-mut">Wszyscy zdrowi. Rzadkość!</p>')+'</div>'+
 '<div class="ss-bcd cold"><p class="ss-lbl">❄ Problemy</p>'+(cold.length?cold.map(function(p){return row(p,why(p),'cold')}).join(''):'<p class="ss-mut">Nikt z czołówki nie zawodzi.</p>')+'</div>'+
 '<div class="ss-bcd nws"><p class="ss-lbl">📰 Z klubów</p>'+news.map(function(n){return '<div class="ss-ni"><b>'+esc(n.t)+'</b>'+(n.b?'<small>'+esc(n.b)+'</small>':'')+'</div>'}).join('')+'</div></div></div>';
 return h+cta('Następne: '+esc(s.win.title),'Dalej','betweenOk')}

/* ---------- powołania ---------- */
function eligible(){return X.plist().filter(function(p){return X.age(p)<=40})}
var NEED={BR:3,OBR:8,POM:8,NAP:5},GN={BR:'Bramkarze',OBR:'Obrońcy',POM:'Pomocnicy',NAP:'Napastnicy'};
function grpOf(p){return X.POSG[p.pos]}
function recSet(){var all=eligible().filter(function(p){return !p.inj});var by={BR:[],OBR:[],POM:[],NAP:[]};all.forEach(function(p){by[grpOf(p)].push(p)});var r={};
 Object.keys(by).forEach(function(g){by[g].sort(function(a,b){return X.eff(b)-X.eff(a)});by[g].slice(0,NEED[g]).forEach(function(p){r[p.id]=1})});return r}
function ptile(p,on,rec){var e=Math.round(X.eff(p)),dis=p.inj>0;var ic='';
 if(dis)ic='🚑'+p.inj+'t';else{if(p.form>=2)ic+='🔥';if(X.age(p)<=21&&p.pot>=82)ic+='🌱';if(p.mins<.35)ic+='🪑';if(p.caps===0)ic+='🆕'}
 return '<button class="ss-tl t'+tier(e)+(on?' on':'')+(dis?' inj':'')+'" data-a="tog" data-v="'+p.id+'"'+(dis?' disabled':'')+'>'+
 '<span class="ss-tr">'+e+'<small>'+X.POSN[p.pos]+'</small></span><span class="ss-tn"><b>'+esc(sur(p.n))+'</b><small>'+esc(p.cl)+'</small></span>'+
 '<span class="ss-ti">'+formIc(p)+(ic?'<em>'+ic+'</em>':'')+'</span>'+(rec&&!on&&!dis?'<i class="ss-rec">★</i>':'')+'<i class="ss-chk">✓</i></button>'}
function callup(){var sel=UI.sel,rec=recSet(),g=UI.cg;
 var list=eligible().filter(function(p){return grpOf(p)===g});list.sort(function(a,b){return (a.inj?1:0)-(b.inj?1:0)||X.eff(b)-X.eff(a)});
 var seg=['BR','OBR','POM','NAP'].map(function(k){var n=sel.filter(function(id){return grpOf(P(id))===k}).length;var st=n<NEED[k]-1?'lo':n>NEED[k]+2?'hi':'ok';
  return '<button class="'+(g===k?'on':'')+'" data-a="cg" data-v="'+k+'"><span class="l">'+GN[k]+'</span><span class="s">'+k+'</span><b class="'+st+'">'+n+'</b></button>'}).join('');
 var h='<div class="ss-bar"><div class="ss-seg">'+seg+'</div><div class="ss-tools">'+btn('★ Auto','autoCall','ghost sm')+(sel.length?btn('Wyczyść','clearCall','ghost sm'):'')+'</div></div>';
 if(UI.callInfo)h+='<p class="ss-info">'+UI.callInfo+'</p>';
 h+='<div class="ss-fill ss-grid">'+list.map(function(p){return ptile(p,sel.indexOf(p.id)>=0,rec[p.id])}).join('')+'</div>';
 var n=sel.length,ok=n>=20&&n<=26;
 return h+cta('<b class="'+(ok?'ok':'bad')+'">'+n+'</b><span>/26</span> powołanych','Zatwierdź','confCall',!ok)}
function autoCall(){var rec=recSet();var res=Object.keys(rec).map(Number);
 var all=eligible().filter(function(p){return !p.inj&&!rec[p.id]&&p.pos!=='GK'}).sort(function(a,b){return X.eff(b)-X.eff(a)});
 while(res.length<26&&all.length)res.push(all.shift().id);UI.sel=res;UI.callInfo=''}
function prepCall(){var s=S();UI.cg='BR';UI.callReady=1;var prev=(s.squad||[]).filter(function(id){var p=P(id);return p&&!p.ret});
 if(!prev.length){UI.sel=[];UI.callInfo='Stuknij kartę, żeby powołać. ★ = polecany. Albo ★ Auto.';return}
 var keep=prev.filter(function(id){return !P(id).inj}),out=prev.filter(function(id){return P(id).inj});
 UI.sel=keep;UI.callInfo=out.length?'🚑 Wypadli: '+out.map(function(id){return sur(P(id).n)}).join(', ')+'. Dobierz zastępców.':''}
function confCall(){var s=S(),sel=UI.sel;var nGK=sel.filter(function(id){return P(id).pos==='GK'}).length;
 if(sel.length<20){toast('Powołaj co najmniej 20 piłkarzy.');return}if(sel.length>26){toast('Maksymalnie 26 piłkarzy.');return}if(nGK<2){toast('Potrzebujesz 2 bramkarzy.');UI.cg='BR';render();return}
 s.squad=sel.slice();if(!s.cap||s.squad.indexOf(s.cap)<0){var c=s.squad.slice().sort(function(a,b){return (P(b).caps+P(b).ovr*2)-(P(a).caps+P(a).ovr*2)})[0];s.capTmp=c}else s.capTmp=s.cap;
 UI.callReact=MM.reactCallup();var w=s.win;var bad=UI.callReact.some(function(o){return o.tone==='bad'});
 var needPress=s.stats.p===0||w.kind==='T'||w.kind==='PO'||s.press>=60||s.streak.u>=3||bad;
 if(needPress){UI.qs=MM.pressQs();UI.pq=0;s.phase='press'}else{UI.qs=[];s.phase='pre';ensureXI();toast('📰 '+(UI.callReact[0]?UI.callReact[0].t:'Kadra ogłoszona'))}X.save();render()}

/* ---------- konferencja ---------- */
function pressView(){var q=UI.qs&&UI.qs[UI.pq];
 var h='<div class="ss-fill ss-press"><div class="ss-papers">'+(UI.callReact||[]).slice(0,2).map(function(o){return '<div class="ss-paper t'+o.tone+'"><small>Prasa</small><b>'+esc(o.t)+'</b></div>'}).join('')+'</div>';
 if(q)h+='<div class="ss-mic"><p class="ss-eye">🎤 Konferencja · '+(UI.pq+1)+'/'+UI.qs.length+'</p><h3>„'+esc(q.q)+'”</h3><div class="ss-ans">'+q.a.map(function(a,i){return '<button data-a="ans" data-v="'+i+'">'+esc(a.t)+'</button>'}).join('')+'</div></div>';
 return h+'</div>'}

/* ---------- skład ---------- */
var STYLES=[['bal','⚖️','Balans',{press:50,tempo:50,ment:50}],['att','🔥','Atak',{press:60,tempo:65,ment:82}],['prs','⚡','Pressing',{press:88,tempo:62,ment:60}],['cnt','🏹','Kontra',{press:38,tempo:78,ment:35}],['bus','🧱','Autobus',{press:30,tempo:32,ment:12}]];
function curStyle(){var t=S().tac,b=null,bd=1e9;STYLES.forEach(function(st){var v=st[3],d=Math.abs(v.press-t.press)+Math.abs(v.tempo-t.tempo)+Math.abs(v.ment-t.ment);if(d<bd){bd=d;b=st[0]}});return bd<12?b:null}
function stylesHTML(){var c=curStyle();return '<div class="ss-sty">'+STYLES.map(function(st){return '<button class="'+(c===st[0]?'on':'')+'" data-a="style" data-v="'+st[0]+'"><i>'+st[1]+'</i><span>'+st[2]+'</span></button>'}).join('')+'</div>'}
function ensureXI(){var s=S();var pool=s.squad.map(P).filter(function(p){return !p.inj});
 var ok=s.xi&&s.xi.length===11&&s.xi.every(function(e){return s.squad.indexOf(e.id)>=0&&!P(e.id).inj})&&s.xiF===s.tac.f;
 if(!ok){s.xi=X.autoXI(s.tac.f,pool);s.xiF=s.tac.f}}
function chancesArr(m,R){var so=X.teamStr(m.opp);var hm=m.neutral?0:m.home?1:-1;var lp=X.lam(R.att,so,hm>0)*R.vol,lo=X.lam(so,R.def,hm<0)*R.vol;
 function pf(l,k){var f=1;for(var i=2;i<=k;i++)f*=i;return Math.exp(-l)*Math.pow(l,k)/f}var w=0,d=0,l=0;for(var a=0;a<9;a++)for(var b=0;b<9;b++){var q=pf(lp,a)*pf(lo,b);if(a>b)w+=q;else if(a<b)l+=q;else d+=q}
 var t=w+d+l;w=Math.round(w/t*100);d=Math.round(d/t*100);return [w,d,100-w-d]}
function pTop(x){return 87-(x-.06)/.74*72}
function pitchHTML(xi,mode){var s=S(),F=X.FORM[s.tac.f];var cap=s.capTmp||s.cap;var M=UI.MV&&UI.MV.M;
 return '<div class="ss-pitch"><i class="pl a"></i><i class="pl b"></i><i class="pl c"></i><i class="pl d"></i>'+xi.map(function(e){var p=P(e.id),pos=F[e.i]||[e.slot,.5,.5];var f=X.fit(p.pos,e.slot);var key=(mode==='pre'?'x:':'m:')+(mode==='pre'?e.i:e.id);
  var yc=mode==='m'&&M&&M.ev.some(function(v){return v.kind==='yellow'&&v.sid===e.id&&v.min<=UI.MV.V.clock});
  return '<div class="ss-pt'+(f<.9?' bad':f<1?' meh':'')+(UI.pick===key?' pk':'')+'" style="left:'+(pos[2]*100).toFixed(1)+'%;top:'+pTop(pos[1]).toFixed(1)+'%" data-drag="'+key+'" data-drop="'+key+'" data-a="pt" data-v="'+key+'">'+
  '<i class="t'+tier(X.eff(p,e.slot))+'">'+Math.round(X.eff(p,e.slot))+'</i><b>'+esc(sur(p.n))+(cap===p.id?' ©':'')+(yc?' 🟨':'')+'</b><small>'+X.POSN[e.slot]+'</small></div>'}).join('')+'</div>'}
function benchHTML(ids,mode){if(!ids.length)return '<p class="ss-mut">Ławka pusta.</p>';
 return '<div class="ss-bench">'+ids.map(function(id){var p=P(id);var key='b:'+id;var e=Math.round(p.ovr);
  return '<div class="ss-bc'+(p.inj?' inj':'')+(UI.pick===key?' pk':'')+'" data-drag="'+key+'" data-drop="'+key+'" data-a="bc" data-v="'+key+'"><i class="t'+tier(e)+'">'+e+'</i><b>'+esc(sur(p.n))+'</b><small>'+X.POSN[p.pos]+'</small></div>'}).join('')+'</div>'}
function pre(){var s=S(),w=s.win,m=w.matches[w.mi];ensureXI();var R=MM.lineRatings(s.xi,s.tac);var ch=chancesArr(m,R);var sd=sides(m);
 var bench=s.squad.filter(function(id){return !s.xi.some(function(e){return e.id===id})&&!P(id).inj});
 var h='<div class="ss-fill ss-prew"><div class="ss-pc">'+
  '<div class="ss-oppb"><span>'+flag(sd[0],'sm')+'<b>'+esc(tn(sd[0]))+'</b></span><em>vs</em><span><b>'+esc(tn(sd[1]))+'</b>'+flag(sd[1],'sm')+'</span>'+
  '<div class="ss-chb" title="Szanse: wygrana / remis / porażka"><i class="w" style="flex:'+ch[0]+'">'+ch[0]+'%</i><i class="d" style="flex:'+ch[1]+'">'+ch[1]+'</i><i class="l" style="flex:'+ch[2]+'">'+ch[2]+'%</i></div></div>'+
  pitchHTML(s.xi,'pre')+'</div>'+
  '<div class="ss-side"><div class="ss-blk"><p class="ss-lbl">Formacja</p><div class="ss-chips">'+Object.keys(X.FORM).map(function(f){return '<button class="'+(s.tac.f===f?'on':'')+'" data-a="form" data-v="'+f+'">'+f+'</button>'}).join('')+'<button class="st" data-a="bestXI" title="Najlepsza jedenastka">★</button></div></div>'+
  '<div class="ss-blk"><p class="ss-lbl">Styl gry</p>'+stylesHTML()+'</div>'+
  '<div class="ss-blk grow"><p class="ss-lbl">Ławka <small>przeciągnij na boisko</small></p>'+benchHTML(bench,'pre')+'</div></div></div>';
 return h+cta('<span class="ss-rt">ATK <b>'+Math.round(R.att)+'</b> POM <b>'+Math.round(R.M)+'</b> OBR <b>'+Math.round(R.def)+'</b></span>','▶ Graj mecz','kick')}
function slotSheet(i){var s=S();var e=s.xi.filter(function(x){return x.i===i})[0];var cand=s.squad.map(P).filter(function(p){return !p.inj&&p.id!==e.id});
 cand.sort(function(a,b){return X.eff(b,e.slot)-X.eff(a,e.slot)});
 UI.modal='<p class="ss-eye">'+X.POSN[e.slot]+' · teraz: '+esc(sur(P(e.id).n))+'</p><h3>Kto zagra?</h3><div class="ss-opts">'+cand.slice(0,6).map(function(p){var inXI=s.xi.some(function(x){return x.id===p.id});var v=Math.round(X.eff(p,e.slot));
  return '<button class="ss-opt" data-a="put" data-v="'+i+'" data-p="'+p.id+'"><i class="t'+tier(v)+'">'+v+'</i><b>'+esc(sur(p.n))+'</b><small>'+X.POSN[p.pos]+(inXI?' · zamiana':'')+'</small>'+formIc(p)+'</button>'}).join('')+'</div>'+((s.capTmp||s.cap)!==e.id?btn('© '+esc(sur(P(e.id).n))+' kapitanem','setCap','ghost sm ss-mcap',' data-v="'+e.id+'"'):'<p class="ss-mut">© To twój kapitan.</p>');render()}
function capSheet(){var s=S();UI.modal='<h3>Kapitan</h3><div class="ss-opts">'+s.xi.map(function(e){return P(e.id)}).sort(function(a,b){return b.caps-a.caps}).map(function(p){return '<button class="ss-opt'+((s.capTmp||s.cap)===p.id?' on':'')+'" data-a="setCap" data-v="'+p.id+'"><i class="t'+tier(p.ovr)+'">'+p.ovr+'</i><b>'+esc(sur(p.n))+'</b><small>'+p.caps+' meczów</small></button>'}).join('')+'</div>';render()}

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
  else{var pid=+b[1];var old=e1.id;e1.id=pid;if(s.cap===old||s.capTmp===old){}toast('✅ '+sur(P(pid).n)+' w składzie')}
  X.save();render();return}
 if(s.phase==='match'&&UI.MV){var MV=UI.MV,M=MV.M;
  if(a[0]==='b'&&b[0]==='b')return;
  if(a[0]==='m'&&b[0]==='m'){var x1=M.xi.filter(function(x){return x.id===+a[1]})[0],x2=M.xi.filter(function(x){return x.id===+b[1]})[0];var tt=x1.id;x1.id=x2.id;x2.id=tt;MV.changed=1;toast('↔ Zamiana pozycji');renderOv();return}
  var out=a[0]==='m'?+a[1]:+b[1],inn=a[0]==='b'?+a[1]:+b[1];doSubUI(out,inn)}}
function doSubUI(out,inn){var MV=UI.MV,M=MV.M;var mn=MV.sheet==='ht'?46:Math.floor(MV.V.clock);
 if(MM.doSub(M,out,inn,'',mn)){MV.changed=1;MV.flash=inn;toast('🔁 '+sur(P(inn).n)+' za '+sur(P(out).n))}else toast('Limit 5 zmian.');renderOv()}

/* ---------- mecz ---------- */
function matchShell(){var s=S(),m=s.win.matches[s.win.mi];var sd=sides(m);
 return '<div class="ss-match"><div class="ss-stage" id="ssStage"><canvas id="ssCv" width="800" height="500"></canvas></div>'+
 '<div class="ss-hud"><div class="ss-sb">'+flag(sd[0],'sm')+'<b>'+esc(sd[0])+'</b><strong id="ssSc">0 : 0</strong><b>'+esc(sd[1])+'</b>'+flag(sd[1],'sm')+'<em id="ssMin">0\'</em></div>'+
 '<div class="ss-pb" id="ssPb"><i style="width:50%"></i></div>'+
 '<div class="ss-htr"><button class="ss-hb" data-a="spd" id="ssSpd"><small>Tempo</small> x'+UI.spd+'</button><button class="ss-hb" data-a="skip">Przewiń do końca ⏭</button>'+(UI.full?'':'<button class="ss-hb" data-a="full">⛶</button>')+'</div>'+
 '<div class="ss-com" id="ssComm">Sędzia gwiżdże. Zaczynamy!</div><div class="ss-tip" id="ssNote"></div>'+
 '<div class="ss-ctl" id="ssCtl"><button class="ss-mb" data-a="sty">⚙ <span>Styl</span></button><button class="ss-mb go" data-a="subs">🔁 <span>Zmiany</span> <em id="ssSubs">0/5</em></button></div>'+
 '<div class="ss-end" id="ssEnd"></div></div><div class="ss-ov" id="ssOv"></div></div>'}
var three=0;function need3D(cb){if(window.THREE||UI.no3d){cb();return}if(three===1){setTimeout(function(){need3D(cb)},120);return}three=1;toast('⚽ Wchodzimy na stadion...');
 var sc=document.createElement('script');var me=document.querySelector('script[src*="ss_ui.js"]');sc.src=(me?me.src.replace(/ss_ui\.js.*$/,''):'assets/')+'three.min.js';sc.onload=function(){three=2;cb()};sc.onerror=function(){UI.no3d=1;three=2;cb()};document.head.appendChild(sc)}
function startMatch(){if(!window.THREE&&!UI.no3d){need3D(startMatch);return}var s=S(),w=s.win,m=w.matches[w.mi];if(s.capTmp)s.cap=s.capTmp;
 var M=MM.newMatch(m);MM.startHalf(M,1);UI.MV={M:M,per:'h1',end:false,tip:0,sheet:null};s.phase='match';UI.tab='pulpit';UI.pick=null;
 if(mob()&&!UI.full)setFull(true);render()}
function mountMatch(){var MV=UI.MV,M=MV.M;var stage=document.getElementById('ssStage'),cv=document.getElementById('ssCv');
 var r3d=null;if(window.SS3D&&window.THREE&&!UI.no3d){try{r3d=SS3D.create(stage,M,{})}catch(err){r3d=null;UI.no3d=1}}
 if(r3d)cv.style.display='none';MV.r3d=r3d;
 var V=SSV.create({cv:cv,M:M,r3d:r3d,onReplay:function(on){if(on)onText('Powtórka','rp')},speed:function(){return UI.spd||1},onInjury:function(e){if(e&&UI.MV&&UI.MV.M.xi.some(function(x){return x.id===e.sid})){UI.MV.V.stop();injurySheet(e)}},onText:onText,onScore:updScore,onPeriodEnd:onPeriodEnd,tick:tick});
 MV.V=V;updScore();tick(0);if(MV.end)showEnd();else if(!MV.sheet)V.start()}
function unmountMatch(){if(!UI.mm)return;UI.mm=0;var MV=UI.MV;if(MV){if(MV.V)MV.V.stop();if(MV.r3d){MV.r3d.dispose();MV.r3d=null}}}
function renderOv(){var el=document.getElementById('ssOv');if(!el)return;var MV=UI.MV;var h='';
 if(MV.sheet==='ht'||MV.sheet==='subs')h=subsSheet(MV.sheet);else if(MV.sheet==='inj')h=MV.injH;else if(MV.sheet==='pen')h=MV.penH;else if(MV.sheet==='sty')h='<div class="ss-pop" data-a="noop"><p>Styl gry · zmiana od razu</p>'+stylesHTML()+'</div>';
 el.innerHTML=h;el.className='ss-ov'+(h?' on':'')+(MV.sheet==='sty'?' pop':'');
 var su=document.getElementById('ssSubs');if(su)su.textContent=MV.M.subs+'/5';var ctl=document.getElementById('ssCtl');if(ctl)ctl.style.display=MV.end?'none':''}
function statRow(l,a,b,u){var t=(a+b)||1;return '<div class="ss-str"><b>'+a+(u||'')+'</b><span><i style="width:'+(a/t*100)+'%"></i></span><small>'+l+'</small><span class="r"><i style="width:'+(b/t*100)+'%"></i></span><b>'+b+(u||'')+'</b></div>'}
function scorers(M,t){return M.hl.filter(function(h){return h.kind==='goal'&&h.t===t&&h._done&&h.min<=UI.MV.V.clock}).map(function(h){return esc(t==='P'?sur(P(h.sid).n):sur(h.name||'rywal'))+' '+h.min+'\''}).join(', ')}
function subsSheet(kind){var MV=UI.MV,M=MV.M,V=MV.V;var s=S(),m=s.win.matches[s.win.mi],sd=sides(m),hm=sd[0]==='POL';var st=MM.stats(M,V.clock);
 var h='<div class="ss-sheet'+(kind==='ht'?' ht':'')+'" data-a="noop">';
 if(kind==='ht'){var a=V.shown.P,b=V.shown.O;var sP=scorers(M,'P'),sO=scorers(M,'O');
  h+='<div class="ss-hth"><p class="ss-eye">Przerwa</p><div class="ss-hts">'+flag(sd[0],'md')+'<b>'+(hm?a:b)+' : '+(hm?b:a)+'</b>'+flag(sd[1],'md')+'</div>'+((sP||sO)?'<p class="ss-hsc">'+(sP?'⚽ '+sP:'')+(sP&&sO?' · ':'')+(sO?'<span>'+sO+'</span>':'')+'</p>':'')+
  '<div class="ss-hst">'+statRow('Posiadanie',st.pos,100-st.pos,'%')+statRow('Strzały',st.shP,st.shO)+statRow('Celne',st.onP,st.onO)+'</div></div>'}
 else h+='<div class="ss-shh"><b>Zmiany</b><span>'+Math.floor(V.clock)+'\' · wynik '+(hm?V.shown.P+':'+V.shown.O:V.shown.O+':'+V.shown.P)+'</span></div>';
 h+=stylesHTML();
 var bench=M.bench.filter(function(id){return M.used.indexOf(id)<0});
 h+='<div class="ss-subw"><div class="ss-subp">'+pitchHTML(M.xi,'m')+'</div><div class="ss-subb"><p class="ss-lbl">Ławka <small>przeciągnij na zawodnika</small></p>'+benchHTML(bench,'m')+'</div></div>';
 h+='<div class="ss-cta"><span class="ss-hint"><b>'+M.subs+'</b>/5 zmian</span>'+btn((kind==='ht'?'▶ Druga połowa':'▶ Graj dalej')+' <i>›</i>','sheetGo','go big')+'</div></div>';return h}
function updScore(){var MV=UI.MV,V=MV&&MV.V;if(!V)return;var s=S(),m=s.win.matches[s.win.mi];var hm=m.home||m.neutral;var el=document.getElementById('ssSc');if(!el)return;
 var a=V.shown.P,b=V.shown.O;el.textContent=hm?a+' : '+b:b+' : '+a;var mn=document.getElementById('ssMin');if(mn)mn.textContent=Math.min(120,Math.floor(V.clock))+'\''+(MV.per==='et'?' DOGR.':'')}
function onText(t,cls){var el=document.getElementById('ssComm');if(el){el.textContent=t;el.className='ss-com on '+(cls||'');clearTimeout(UI.cT);UI.cT=setTimeout(function(){el.classList.remove('on')},3800)}}
var lastStat=-1;
function tick(clock){var MV=UI.MV,M=MV.M;var mi=Math.floor(clock);
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
 else if(ph==='h2'){if(M.ko&&M.gP===M.gO){MM.extraTime(M);MV.per='et';onText('Remis! Dogrywka!','');MV.V.start('et')}else endMatch()}
 else{if(M.ko&&M.gP===M.gO){MM.penalties(M);penSheet()}else endMatch()}}
function penSheet(){var MV=UI.MV,M=MV.M,pe=M.pens;MV.sheet='pen';var k=0;MV.V.stop();
 function draw(){var sp=0,so=0;pe.seq.slice(0,k).forEach(function(q){if(q.okP)sp++;if(q.okO)so++});
  var dots=function(t){return pe.seq.map(function(q,i){return '<i class="'+(i<k?((t==='P'?q.okP:q.okO)?'ok':'no'):'')+'"></i>'}).join('')};
  var last=k>0?pe.seq[k-1]:null;
  MV.penH='<div class="ss-sheet sm pen" data-a="noop"><p class="ss-eye">Rzuty karne</p><div class="ss-pens"><div><b>Polska</b><span>'+dots('P')+'</span><strong>'+sp+'</strong></div><div><b>'+esc(tn(M.opp))+'</b><span>'+dots('O')+'</span><strong>'+so+'</strong></div></div>'+
  (last?'<p class="ss-pl">'+(last.okP?'✅ ':'❌ ')+esc(sur(last.p))+'</p>':'<p class="ss-pl">Do piłki...</p>')+
  (k>=pe.seq.length?'<div class="ss-cta">'+btn(pe.p>pe.o?'🎉 WYGRALIŚMY!':'Koniec... <i>›</i>','penEnd','go big')+'</div>':'')+'</div>';renderOv()}
 draw();var iv=setInterval(function(){k++;draw();if(k>=pe.seq.length)clearInterval(iv)},1000)}
function endMatch(){var MV=UI.MV,M=MV.M,s=S();if(MV.end)return;MV.V&&MV.V.stop();
 M.hl.forEach(function(h){h._done=1});MV.V.shown={P:M.gP,O:M.gO};MV.V.clock=M.et?120:90;updScore();
 MM.finishMatch(M);MM.afterMatch(M);var w=s.win;w.matches[w.mi].res=M.res;w.matches[w.mi].gP=M.gP;w.matches[w.mi].gO=M.gO;UI.post=M;MV.end=1;MV.sheet=null;X.save();
 showEnd();renderOv()}
function showEnd(){var M=UI.MV.M;var el=document.getElementById('ssEnd');if(!el)return;var nt=document.getElementById('ssNote');if(nt)nt.className='ss-tip';
 el.innerHTML='<div class="ss-endc r'+M.res+'"><p>'+(M.res==='W'?'ZWYCIĘSTWO':M.res==='L'?'PORAŻKA':'REMIS')+'</p><b>'+esc(MM.scoreStr(M))+'</b>'+btn('Pomeczowe <i>›</i>','toPost','go big')+'</div>';el.className='ss-end on'}
function skipMatch(){var MV=UI.MV,M=MV.M;if(MV.end)return;MV.V.stop();MV.sheet=null;
 if(M.half===1)MM.startHalf(M,2);if(M.ko&&M.gP===M.gO&&!M.et)MM.extraTime(M);if(M.ko&&M.gP===M.gO&&!M.pens)MM.penalties(M);endMatch()}

/* ---------- po meczu ---------- */
function post(){var s=S(),M=UI.post;if(!M){s.phase='hub';return hub()}
 var m=s.win.matches[s.win.mi],sd=sides(m),hm=sd[0]==='POL';var a=hm?M.gP:M.gO,b=hm?M.gO:M.gP;
 var sc=Object.keys(M.sc).map(function(id){return esc(sur(P(id).n))+(M.sc[id]>1?' ×'+M.sc[id]:'')}).join(', ');
 var rts=M.used.slice().sort(function(x,y){return M.rt[y]-M.rt[x]});var mvp=rts[0];var hd=M.head[0]||{t:'',b:'',tone:'n'};var tw=M.social&&M.social[0];
 function dl(l,v,inv){v=v||0;var good=inv?v<0:v>0;return '<span class="ss-dl '+(v===0?'':good?'up':'dn')+'">'+l+' <b>'+(v>0?'+':'')+v+'</b></span>'}
 var h='<div class="ss-fill ss-post r'+M.res+'"><p class="ss-eye">'+esc(venue(m))+'</p>'+
 '<div class="ss-res"><div>'+flag(sd[0],'xl')+'<b>'+esc(tn(sd[0]))+'</b></div><strong>'+a+':'+b+'</strong><div>'+flag(sd[1],'xl')+'<b>'+esc(tn(sd[1]))+'</b></div></div>'+
 '<p class="ss-rl">'+(M.res==='W'?'ZWYCIĘSTWO':M.res==='L'?'PORAŻKA':'REMIS')+(M.pens?' · karne '+M.pens.p+':'+M.pens.o:'')+'</p>'+(sc?'<p class="ss-scr2">⚽ '+sc+'</p>':'')+
 '<div class="ss-dls">'+dl('❤ Kibice',M.dT)+dl('📰 Presja',M.dP,1)+(mvp?'<span class="ss-dl mvp">⭐ '+esc(sur(P(mvp).n))+' <b>'+M.rt[mvp].toFixed(1)+'</b></span>':'')+'</div>'+
 '<div class="ss-paper big t'+hd.tone+'"><small>Gazeta</small><b>'+esc(hd.t)+'</b>'+(hd.b?'<p>'+esc(hd.b)+'</p>':'')+'</div>'+
 (tw?'<p class="ss-tw"><b>'+esc(tw.h)+'</b> '+esc(tw.t)+'</p>':'')+'</div>';
 var w=s.win;var more=w.mi+1<w.matches.length;
 return h+cta(more?'Kolejny mecz zgrupowania':'Koniec zgrupowania',more?'Następny mecz':'Podsumowanie','next')}
function nextAfterPost(){var s=S(),w=s.win;s.newSong=null;w.mi++;UI.post=null;UI.MV=null;
 if(w.mi<w.matches.length){s.phase='pre';ensureXI()}else{MM.finishWindow();s.phase='wrap'}X.save();render()}
function wrap(){var s=S(),w=s.win;var g=w.goal;
 var h='<div class="ss-fill ss-wrap"><p class="ss-eye">Koniec zgrupowania · '+X.MON[w.m]+' '+w.y+'</p><h2>'+esc(w.title)+'</h2>';
 if(g)h+='<p class="ss-goal '+(g.ok?'ok':'bad')+'"><i>'+(g.ok?'✅':'❌')+'</i><span>Cel PZPN</span><b>'+esc(g.text)+'</b><em>'+(g.ok?'Kibice +6':'Kibice −7')+'</em></p>';
 if(w.over)h+='<p class="ss-big">'+(w.over==='Mistrz'?'🏆 MISTRZOSTWO!':'Koniec turnieju: '+esc(w.over))+'</p>';
 h+='<div class="ss-mvs">'+w.matches.map(midVs).join('')+'</div>';
 if(w.comp&&s.comps[w.comp])h+=tableHTML(s.comps[w.comp]);
 return h+'</div>'+cta('Wracamy do klubów','Dalej','adv')}
function zones(c){var z={};var tr=c.tier||'B',up=String.fromCharCode(tr.charCodeAt(0)-1),dn=String.fromCharCode(tr.charCodeAt(0)+1);
 if(c.type==='NL'){z[1]=['up',tr==='A'?'Zwycięstwo w Dywizji A':'Awans do Dywizji '+up];if(tr!=='D')z[4]=['dn','Spadek do Dywizji '+dn]}
 else if(c.type==='EQ'){z[1]=z[2]=['up','Awans na Euro'];z[3]=['po','Baraże']}
 else if(c.type==='WQ'){z[1]=['up','Awans na mundial'];z[2]=['po','Baraże']}
 else if(c.type==='T'){z[1]=z[2]=['up','Wyjście z grupy'];z[3]=['po','Szansa jako jedna z najlepszych 3. drużyn']}return z}
function legend(Z){var seen={},h='';Object.keys(Z).forEach(function(k){var v=Z[k];if(seen[v[1]])return;seen[v[1]]=1;var ks=Object.keys(Z).filter(function(q){return Z[q][1]===v[1]});h+='<span class="z-'+v[0]+'"><i></i>'+(ks.length>1?ks[0]+'-'+ks[ks.length-1]:ks[0])+'. '+esc(v[1])+'</span>'});return h?'<div class="ss-leg">'+h+'</div>':''}
function stake(c){var tr=c.tier||'B',up=String.fromCharCode(tr.charCodeAt(0)-1),dn=String.fromCharCode(tr.charCodeAt(0)+1);
 if(c.type==='NL')return tr==='A'?'Walczymy o zwycięstwo w najwyższej dywizji. Ostatnie miejsce oznacza spadek do Dywizji B.':'1. miejsce daje awans do Dywizji '+up+'.'+(tr!=='D'?' 4. miejsce oznacza spadek do Dywizji '+dn+'.':'');
 if(c.type==='EQ')return '1-2 miejsce: bezpośredni awans na Euro. 3. miejsce: baraże w marcu (mecz o wszystko). Niżej: Euro bez Polski.';
 if(c.type==='WQ')return '1. miejsce: bezpośredni awans na mundial. 2. miejsce: baraże w marcu (mecz o wszystko). Niżej: mundial bez Polski.';
 if(c.type==='T')return '1-2 miejsce: awans do fazy pucharowej. 3. miejsce: awans tylko jako jedna z najlepszych drużyn z trzecich miejsc.';return ''}
function statusLine(c,t,Z){var i=t.map(function(r){return r.c}).indexOf('POL');if(i<0)return '';var me=t[i],pos=i+1,z=Z[pos];var left=Math.max(0,(c.rounds||0)-me.p);
 var lbl=z?z[1]:'bez nagrody';var h='<b>Polska: '+pos+'. miejsce · '+me.pts+' pkt</b> · '+(c.done||left===0?'koniec rozgrywek':'zostało meczów: '+left)+' · '+(c.done||left===0?'wynik: ':'teraz: ')+'<em class="'+(z?'z-'+z[0]:'')+'">'+esc(lbl)+'</em>';
 var best=Object.keys(Z).filter(function(k){return Z[k][0]==='up'}).map(Number);var bm=best.length?Math.max.apply(null,best):0;
 if(!c.done&&left>0&&bm&&pos>bm){var gap=t[bm-1].pts-me.pts;h+=' · do miejsca '+bm+'. brakuje '+gap+' pkt'+(gap>left*3?' (już poza zasięgiem)':'')}
 return '<p class="ss-stat">'+h+'</p>'}
function tableHTML(c){var t=X.table(c),Z=zones(c);return '<div class="ss-tab"><p class="ss-lbl">'+esc(c.name)+'</p><p class="ss-stake">🎯 '+stake(c)+'</p>'+statusLine(c,t,Z)+'<table><tr><th></th><th></th><th>M</th><th>Br.</th><th>Pkt</th></tr>'+t.map(function(r,i){return '<tr class="'+(r.c==='POL'?'me ':'')+(Z[i+1]?'z-'+Z[i+1][0]:'')+'"><td>'+(i+1)+'</td><td>'+flag(r.c,'sm')+' '+esc(tn(r.c))+'</td><td>'+r.p+'</td><td>'+r.gf+':'+r.ga+'</td><td><b>'+r.pts+'</b></td></tr>'}).join('')+'</table>'+legend(Z)+'</div>'}

/* ---------- zakładki ---------- */
function dbView(){var all=eligible();var q=UI.dbq.toLowerCase();var list=all.filter(function(p){return (UI.dbf==='ALL'||X.POSG[p.pos]===UI.dbf||(UI.dbf==='U21'&&X.age(p)<=21))&&(!q||p.n.toLowerCase().indexOf(q)>=0||p.cl.toLowerCase().indexOf(q)>=0)});
 var sk={ovr:function(p){return -p.ovr},pot:function(p){return -p.pot},form:function(p){return -p.form},age:function(p){return X.age(p)}}[UI.dbs];list.sort(function(a,b){return sk(a)-sk(b)});
 return '<div class="ss-bar"><div class="ss-seg sm">'+[['ALL','Wszyscy'],['BR','BR'],['OBR','OBR'],['POM','POM'],['NAP','NAP'],['U21','U21']].map(function(f){return '<button class="'+(UI.dbf===f[0]?'on':'')+'" data-a="dbf" data-v="'+f[0]+'">'+f[1]+'</button>'}).join('')+'</div>'+
 '<input class="ss-q" data-a="dbq" placeholder="Szukaj..." value="'+esc(UI.dbq)+'"></div>'+
 '<div class="ss-sortb">'+[['ovr','Ocena'],['pot','Potencjał'],['form','Forma'],['age','Wiek']].map(function(o){return '<button class="'+(UI.dbs===o[0]?'on':'')+'" data-a="dbs" data-v="'+o[0]+'">'+o[1]+'</button>'}).join('')+'<span>'+list.length+' piłkarzy</span></div>'+
 '<div class="ss-fill ss-list">'+list.map(function(p){return '<button class="ss-row" data-a="pinfo" data-v="'+p.id+'"><i class="t'+tier(p.ovr)+'">'+p.ovr+'</i><span><b>'+esc(p.n)+'</b><small>'+X.POSN[p.pos]+' · '+esc(p.cl)+' · '+X.age(p)+' l.'+(p.inj?' · 🚑':'')+'</small></span>'+formIc(p)+'<em class="ss-pot">'+'★★★★★'.slice(0,p.pot>=88?5:p.pot>=82?4:p.pot>=76?3:p.pot>=70?2:1)+'</em></button>'}).join('')+'</div>'}
function pinfo(id){var p=P(id);function c(l,v){return '<div><small>'+l+'</small><b>'+v+'</b></div>'}
 UI.modal='<div class="ss-pi"><i class="t'+tier(p.ovr)+'">'+p.ovr+'</i><div><h3>'+esc(p.n)+'</h3><p class="ss-mut">'+X.POSN[p.pos]+' · '+X.age(p)+' lat · '+esc(p.cl)+'</p></div></div><div class="ss-pg">'+
 c('Potencjał',p.pot)+c('Forma',formIc(p))+c('Minuty w klubie',Math.round(p.mins*100)+'%')+c('Kadra',p.caps+' m. / '+p.g+' g.')+c('Sezon',p.cs.a+' m. / '+p.cs.g+' g.')+c('Zdrowie',p.inj?'🚑 '+p.inj+' tyg.':'✅')+'</div>';render()}
function compView(){var s=S();var ids=Object.keys(s.comps).reverse().slice(0,3);var i=Math.min(UI.comp,ids.length-1);
 var h='<div class="ss-fill ss-comp">';
 if(ids.length)h+='<div class="ss-seg sm">'+ids.map(function(id,k){return '<button class="'+(k===i?'on':'')+'" data-a="comp" data-v="'+k+'">'+esc(s.comps[id].name.replace('Liga Narodów','LN').replace('Eliminacje','El.'))+'</button>'}).join('')+'</div>'+tableHTML(s.comps[ids[i]]);
 h+='<div class="ss-cols"><div><p class="ss-lbl">Ostatnie mecze</p><div class="ss-hist">'+s.hist.slice(0,5).map(function(r){var res=r.gP>r.gO||(r.pens&&r.pens[0]>r.pens[1])?'W':r.gP<r.gO||(r.pens&&r.pens[0]<r.pens[1])?'L':'D';return '<div>'+flag(r.opp,'sm')+'<span>'+esc(tn(r.opp))+'</span><b class="ss-rs r'+res+'">'+r.gP+':'+r.gO+(r.pens?'k':'')+'</b></div>'}).join('')+(s.hist.length?'':'<p class="ss-mut">Jeszcze nie grałeś.</p>')+'</div></div>';
 var rk=Object.keys(s.elo).sort(function(a,b){return s.elo[b]-s.elo[a]});var pi=rk.indexOf('POL');
 h+='<div><p class="ss-lbl">Ranking</p><div class="ss-hist">'+rk.slice(Math.max(0,pi-2),pi+3).map(function(c){return '<div class="'+(c==='POL'?'me':'')+'"><small>'+(rk.indexOf(c)+1)+'.</small>'+flag(c,'sm')+'<span>'+esc(tn(c))+'</span></div>'}).join('')+'</div></div></div>';
 if(s.tour.length)h+='<p class="ss-tours">'+s.tour.slice(-3).map(function(t){return '🏆 '+esc(t.n)+': <b>'+esc(t.r)+'</b>'}).join(' · ')+'</p>';
 return h+'</div>'}
function mediaView(){var s=S();UI.mediaNew=0;var no=Math.round(100-s.trust);
 return '<div class="ss-poll"><p>Czy selekcjoner powinien odejść?</p><div><i style="width:'+no+'%">TAK '+no+'%</i><span>NIE '+(100-no)+'%</span></div></div>'+
 '<div class="ss-fill ss-list">'+s.media.slice(0,10).map(function(m){return '<div class="ss-paper t'+m.tone+'"><small>'+esc(m.src)+' · '+X.MON[m.m]+' '+m.y+'</small><b>'+esc(m.t)+'</b></div>'}).join('')+
 s.news.slice(0,8).map(function(n){return '<div class="ss-paper tn"><small>Wiadomości</small><b>'+esc(n.t)+'</b></div>'}).join('')+'</div>'}
function gabView(){var s=S(),st=s.stats;function c(l,v){return '<div><b>'+v+'</b><small>'+l+'</small></div>'}
 var sg=Object.keys(s.songs);
 return '<div class="ss-fill ss-gab"><div class="ss-kpi">'+c('Mecze',st.p)+c('Wygrane',st.w)+c('Remisy',st.d)+c('Porażki',st.l)+c('Bramki',st.gf+':'+st.ga)+c('% wygr.',(st.p?Math.round(st.w/st.p*100):0)+'%')+'</div>'+
 '<p class="ss-lbl">Osiągnięcia '+Object.keys(s.ach).length+'/'+X.ACH.length+'</p><div class="ss-ach">'+X.ACH.map(function(a){var on=s.ach[a[0]];return '<button class="'+(on?'on':'')+'" data-a="achi" data-v="'+a[0]+'" title="'+esc(a[1]+': '+a[2])+'">'+(on?'🏆':'🔒')+'<span>'+esc(a[1])+'</span></button>'}).join('')+'</div>'+
 '<p class="ss-lbl">Piosenki Qastroda ('+sg.length+')</p><div class="ss-songs">'+(sg.length?sg.map(function(k){var so=X.SONGS[k];return so?'<a href="https://www.youtube.com/watch?v='+so.i+'" target="_blank" rel="noopener">▶ '+esc(so.t)+'</a>':''}).join(''):'<p class="ss-mut">Wygrywaj ważne mecze, a kibice zaśpiewają.</p>')+'</div>'+
 '<div class="ss-mini">'+(UI.confNew?btn('Tak, usuń kadencję','newConf','bad sm')+btn('Anuluj','newNo','ghost sm'):btn('Nowa kadencja','newAsk','ghost sm'))+'</div></div>'}

/* ---------- toast ---------- */
var tT=0;function toast(m){var el=document.getElementById('ssToast');el.textContent=m;el.classList.add('on');clearTimeout(tT);tT=setTimeout(function(){el.classList.remove('on')},2400)}
var GI={tr:'❤ Zaufanie kibiców. Spada po porażkach, rośnie po wygranych.',pr:'📰 Presja mediów. Im wyżej, tym ostrzejsze nagłówki.',mo:'💪 Nastrój w szatni. Pominięci gwiazdorzy go psują.',rk:'🌍 Miejsce Polski w rankingu.'};

/* ---------- zdarzenia ---------- */
root.addEventListener('click',function(e){if(Date.now()-noClick<300&&e.target.closest('[data-drag],[data-drop]'))return;var b=e.target.closest('[data-a]');if(!b||!root.contains(b))return;var a=b.getAttribute('data-a'),v=b.getAttribute('data-v');var s=S();
 if(a==='noop')return;
 if(a==='mclose'){if(e.target===b){UI.modal=null;render()}return}
 if(a==='full'){setFull(!UI.full);if(b.classList.contains('ss-hb'))b.remove();return}
 if(a==='new'){var nm=(document.getElementById('ssName')||{}).value||'';nm=nm.trim()||'Jan Kowalski';X.newGame(nm);UI.tab='pulpit';if(mob())setFull(true);render();return}
 if(a==='cont'){X.setS(X.load());norm(S());if(mob())setFull(true);render();return}
 if(a==='newForm'){UI.newForm=!UI.newForm;render();var i=document.getElementById('ssName');if(i)i.focus();return}
 if(a==='ginfo'){toast(GI[v]||'');return}
 if(a==='tab'){UI.tab=v;UI.modal=null;render();return}
 if(a==='toCall'){s.phase='callup';prepCall();render();return}
 if(a==='cg'){UI.cg=v;render();return}
 if(a==='tog'){var id=+v,i=UI.sel.indexOf(id);if(i>=0)UI.sel.splice(i,1);else UI.sel.push(id);UI.callInfo='';var gr=app.querySelector('.ss-grid'),y=gr?gr.scrollTop:0;render();gr=app.querySelector('.ss-grid');if(gr)gr.scrollTop=y;return}
 if(a==='autoCall'){autoCall();render();toast('★ Asystent wybrał 26 piłkarzy');return}
 if(a==='clearCall'){UI.sel=[];render();return}
 if(a==='confCall'){confCall();return}
 if(a==='ans'){var q=UI.qs[UI.pq];MM.applyAns(q.a[+v].e);UI.pq++;if(UI.pq>=UI.qs.length){s.phase='pre';ensureXI();toast('🎤 Konferencja zakończona. Ustal skład.')}X.save();render();return}
 if(a==='bestXI'){s.xi=null;ensureXI();X.save();render();toast('★ Najlepsza jedenastka');return}
 if(a==='form'){s.tac.f=v;s.xi=null;ensureXI();X.save();render();return}
 if(a==='pt'||a==='bc'){var pk=UI.pick;
  if(pk&&pk!==v&&!(pk[0]==='b'&&v[0]==='b')){onDrop(pk,v);if(s.phase==='match')renderOv();return}
  if(pk===v){UI.pick=null}else if(a==='pt'&&s.phase==='pre'&&!pk){slotSheet(+v.split(':')[1]);return}else UI.pick=v;
  if(s.phase==='match')renderOv();else render();return}
 if(a==='put'){var si=+v,pid=+b.getAttribute('data-p');var e1=s.xi.filter(function(x){return x.i===si})[0];var other=s.xi.filter(function(x){return x.id===pid})[0];if(other)other.id=e1.id;e1.id=pid;UI.modal=null;X.save();render();return}
 if(a==='capSel'){capSheet();return}
 if(a==='setCap'){s.capTmp=+v;s.cap=+v;UI.modal=null;render();toast('© '+sur(P(+v).n)+' kapitanem');return}
 if(a==='style'){var st=STYLES.filter(function(x){return x[0]===v})[0];s.tac.press=st[3].press;s.tac.tempo=st[3].tempo;s.tac.ment=st[3].ment;X.save();
  if(s.phase==='match'&&UI.MV){var MV=UI.MV;if(MV.sheet==='sty'){MV.sheet=null;applyChange();renderOv();MV.V.start();toast(st[1]+' Styl: '+st[2])}else{MV.changed=1;renderOv()}}else render();return}
 if(a==='kick'){startMatch();return}
 if(a==='spd'){UI.spd=UI.spd===1?2:UI.spd===2?4:1;b.innerHTML='<small>Tempo</small> x'+UI.spd;return}
 if(a==='skip'){skipMatch();return}
 if(a==='skipRep'){if(UI.MV&&UI.MV.V)UI.MV.V.skipReplay();return}
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
 if(a==='adv'){X.advance();UI.tab='pulpit';UI.mediaNew=1;UI.between=1;render();return}
 if(a==='betweenOk'){UI.between=0;render();return}
 if(a==='dbf'){UI.dbf=v;render();return}
 if(a==='dbs'){UI.dbs=v;render();return}
 if(a==='comp'){UI.comp=+v;render();return}
 if(a==='pinfo'){pinfo(+v);return}
 if(a==='achi'){var ac=X.ACH.filter(function(x){return x[0]===v})[0];if(ac)toast((s.ach[v]?'🏆 ':'🔒 ')+ac[1]+': '+ac[2]);return}
 if(a==='newAsk'){UI.confNew=1;render();return}if(a==='newNo'){UI.confNew=0;render();return}
 if(a==='newConf'){UI.confNew=0;try{localStorage.removeItem(X.KEY)}catch(x){}X.setS(null);UI.tab='pulpit';render();return}
});
root.addEventListener('input',function(e){var t=e.target;if(t.getAttribute('data-a')==='dbq'){UI.dbq=t.value;clearTimeout(UI.qT);UI.qT=setTimeout(function(){var pos=t.selectionStart;render();var n=app.querySelector('[data-a=dbq]');if(n){n.focus();n.setSelectionRange(pos,pos)}},250)}});
root.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.id==='ssName'){var b=app.querySelector('[data-a=new]');if(b)b.click()}});

/* start */
X.setS(null);render();
if(X.DEBUG)window.__ss={UI:UI,render:render,startMatch:startMatch,skipMatch:skipMatch,autoCall:autoCall,confCall:confCall,nextAfterPost:nextAfterPost,setFull:setFull};
})();
