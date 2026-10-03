/* Symulator selekcjonera reprezentacji Polski | qastrod.pl */
(function(){
'use strict';
var root=document.getElementById('ss');if(!root)return;
var DEBUG=/[?&]debug=1/.test(location.search);
var KEY='qastrod_selekcjoner_v4';
/* ---------- narzędzia ---------- */
function rnd(a,b){return a+Math.random()*(b-a)}
function ri(a,b){return Math.floor(rnd(a,b+1))}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function clamp(v,a,b){return v<a?a:v>b?b:v}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function gauss(){var u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function poisson(l){var L=Math.exp(-l),k=0,p=1;do{k++;p*=Math.random()}while(p>L&&k<20);return k-1}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function wpick(arr,w){var s=0,i;for(i=0;i<arr.length;i++)s+=w(arr[i]);var r=Math.random()*s;for(i=0;i<arr.length;i++){r-=w(arr[i]);if(r<=0)return arr[i]}return arr[arr.length-1]}
function sur(n){var p=n.split(' ');return p.length>1?p.slice(1).join(' '):n}
var MON={3:'Marzec',6:'Czerwiec',7:'Lipiec',9:'Wrzesień',10:'Październik',11:'Listopad'};
var MONG={3:'marca',6:'czerwca',7:'lipca',9:'września',10:'października',11:'listopada'};

/* ---------- dane ---------- */
var D=window.SSD;var TEAMS={},TL=[];
D.tm.split('\n').forEach(function(l){var f=l.split('|');var t={c:f[0],n:f[1],str:+f[2],c1:f[3],c2:f[4],stars:f[5].split(','),conf:f[6]};TEAMS[t.c]=t;TL.push(t)});
TEAMS.POL={c:'POL',n:'Polska',str:77,c1:'#ffffff',c2:'#dc143c',stars:[],conf:'E'};
var FN=D.fn.split(','),LN=D.ln.split(','),CL={};for(var k in D.cl)CL[k]=D.cl[k].split(',');
var LVAVG={1:61,2:68,3:73,4:78,5:83};
var POSG={GK:'BR',CB:'OBR',LB:'OBR',RB:'OBR',DM:'POM',CM:'POM',AM:'POM',LW:'NAP',RW:'NAP',ST:'NAP'};
var POSN={GK:'BR',CB:'ŚO',LB:'LO',RB:'PO',DM:'ŚPD',CM:'ŚP',AM:'ŚPO',LW:'LS',RW:'PS',ST:'N',LWB:'LWO',RWB:'PWO'};
/* utwory kanału Qastrod, które gra odblokowuje */
var SONGS={
 walka:{i:'6yxaR3YGWKs',t:'Każdy mecz to walka - Z orłem na piersi'},
 lewy:{i:'fqkJAbOsY3Q',t:'Lewandowski, droga do mistrzostwa'},
 lewy100:{i:'3PNzSICyB6c',t:'Lewandowski 100 goli w Lidze Mistrzów'},
 pasja:{i:'AfALsHrQ1zo',t:'Oni też kiedyś byli mali - PASJA'},
 yamal:{i:'jvzAPc10C8k',t:'Lamine Yamal to nowy Messi'},
 mbappe:{i:'2xncBfPQeGU',t:'Kylian Mbappé, król Madrytu'}
};

/* ---------- formacje ---------- */
var FORM={
 '4-2-3-1':[['GK',.06,.5],['LB',.27,.14],['CB',.22,.38],['CB',.22,.62],['RB',.27,.86],['DM',.42,.38],['DM',.42,.62],['LW',.63,.16],['AM',.62,.5],['RW',.63,.84],['ST',.8,.5]],
 '4-3-3':[['GK',.06,.5],['LB',.27,.14],['CB',.22,.38],['CB',.22,.62],['RB',.27,.86],['CM',.47,.3],['DM',.4,.5],['CM',.47,.7],['LW',.72,.16],['ST',.8,.5],['RW',.72,.84]],
 '4-4-2':[['GK',.06,.5],['LB',.27,.14],['CB',.22,.38],['CB',.22,.62],['RB',.27,.86],['LW',.52,.14],['CM',.47,.38],['CM',.47,.62],['RW',.52,.86],['ST',.77,.38],['ST',.77,.62]],
 '3-5-2':[['GK',.06,.5],['CB',.22,.25],['CB',.2,.5],['CB',.22,.75],['LWB',.45,.1],['CM',.48,.32],['DM',.4,.5],['CM',.48,.68],['RWB',.45,.9],['ST',.77,.38],['ST',.77,.62]],
 '5-3-2':[['GK',.06,.5],['LWB',.3,.1],['CB',.21,.3],['CB',.19,.5],['CB',.21,.7],['RWB',.3,.9],['CM',.47,.3],['DM',.42,.5],['CM',.47,.7],['ST',.75,.38],['ST',.75,.62]],
 '3-4-3':[['GK',.06,.5],['CB',.22,.25],['CB',.2,.5],['CB',.22,.75],['LWB',.45,.12],['CM',.45,.38],['CM',.45,.62],['RWB',.45,.88],['LW',.72,.18],['ST',.8,.5],['RW',.72,.82]]
};
var FIT={GK:{GK:1},CB:{CB:1,DM:.9,RB:.87,LB:.87},LB:{LB:1,LW:.9,RB:.9,CB:.87},RB:{RB:1,RW:.9,LB:.9,CB:.87},
 LWB:{LB:1,LW:.96,RB:.88,RW:.88},RWB:{RB:1,RW:.96,LB:.88,LW:.88},DM:{DM:1,CM:.96,CB:.9},CM:{CM:1,DM:.96,AM:.95},
 AM:{AM:1,CM:.95,LW:.92,RW:.92,ST:.9},LW:{LW:1,RW:.94,AM:.92,LB:.85,ST:.88},RW:{RW:1,LW:.94,AM:.92,RB:.85,ST:.88},ST:{ST:1,AM:.88,LW:.87,RW:.87}};
function fit(pp,slot){var f=FIT[slot];if(f[pp])return f[pp];if(slot==='GK'||pp==='GK')return .3;return .76}
var LINE={GK:'G',CB:'D',LB:'D',RB:'D',LWB:'DM',RWB:'DM',DM:'M',CM:'M',AM:'M',LW:'A',RW:'A',ST:'A'};

/* ---------- stan ---------- */
var S=null;
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function load(){try{localStorage.removeItem('qastrod_selekcjoner_v1');localStorage.removeItem('qastrod_selekcjoner_v2');localStorage.removeItem('qastrod_selekcjoner_v3')}catch(e){}try{var s=localStorage.getItem(KEY);if(s){var o=JSON.parse(s);if(o&&o.v===3)return o}}catch(e){}return null}
function P(id){return S.pl[id]}
function age(p){return S.y-p.by}
function plist(){var a=[];for(var id in S.pl){var p=S.pl[id];if(!p.ret)a.push(p)}return a}

function newGame(name){
 S={v:3,name:name||'Selekcjoner',y:2026,m:9,season:2026,pl:{},nid:1,elo:{},str:{},
  trust:55,press:35,morale:60,board:70,
  squad:[],cap:null,tac:{f:'4-2-3-1',press:50,tempo:50,ment:50},xi:null,
  news:[],media:[],ach:{},songs:{},hist:[],comps:{},win:null,phase:'hub',tab:'pulpit',
  q:{},nlTier:'B',streak:{w:0,u:0,l:0,nl:0},stats:{p:0,w:0,d:0,l:0,gf:0,ga:0},best:{},tour:[],pressMod:0,lastCall:[],windows:0,
  prev:{trust:55,press:35}};
 D.pl.split('\n').forEach(function(l){var f=l.split('|');var p={id:S.nid++,n:f[0],pos:f[1],by:+f[2],cl:f[3],lv:+f[4],ovr:+f[5],pot:+f[6],caps:+f[7],g:+f[8],
  form:Math.round(gauss()*1.2),mins:.7,inj:0,ret:0,cs:{a:0,g:0},mood:60};p.mins=minsFor(p);S.pl[p.id]=p});
 TL.concat([TEAMS.POL]).forEach(function(t){S.str[t.c]=t.str;S.elo[t.c]=1500+(t.str-70)*22});
 S.elo.POL=1500+(polStr()-70)*22;
 S.cap=byName('Robert Lewandowski');
 addNews('start','Nowy selekcjoner przejmuje kadrę','PZPN ogłosił: kadrę przejmuje '+S.name+'. Na start Liga Narodów, Dywizja B: Bośnia i Hercegowina, Szwecja i Rumunia. Kibice pamiętają porażkę ze Szwecją w barażu o mundial. Rewanż byłby miły.');
 media('Kim jest '+S.name+'? Internet już wie wszystko','Pierwsze memy pojawiły się 4 minuty po ogłoszeniu decyzji.','neutral');
 startNL(['BIH','SWE','ROU'],'B');
 planWindow();S.phase='hub';save();
}
function byName(n){for(var id in S.pl)if(S.pl[id].n===n)return +id;return null}
function minsFor(p){var d=p.ovr-LVAVG[p.lv];var b=d>=3?.88:d>=0?.72:d>=-4?.5:.22;if(p.inj>0)return 0;return clamp(b+gauss()*.12,.02,1)}

/* ---------- siła drużyn ---------- */
function eff(p,slot){var f=slot?fit(p.pos,slot):1;var m=(p.mood-60)/40;return p.ovr*f+p.form*1.1+m+(p.mins-.6)*2.5}
function polStr(){var xi=autoXI('4-2-3-1',plist().filter(function(p){return !p.inj&&age(p)<41}));var s=0;xi.forEach(function(e){s+=eff(P(e.id),e.slot)});return s/11}
function teamStr(c){return c==='POL'?polStr():S.str[c]}
function autoXI(f,pool){
 var slots=FORM[f].map(function(s,i){return{i:i,slot:s[0]}});var used={},res=[];
 var order=['GK','ST','CB','DM','AM','LB','RB','LWB','RWB','CM','LW','RW'];
 slots.sort(function(a,b){return order.indexOf(a.slot)-order.indexOf(b.slot)});
 slots.forEach(function(s){var best=null,bv=-1;pool.forEach(function(p){if(used[p.id])return;var v=eff(p,s.slot);if(v>bv){bv=v;best=p}});if(best){used[best.id]=1;res.push({i:s.i,slot:s.slot,id:best.id})}});
 res.sort(function(a,b){return a.i-b.i});return res}

/* ---------- newsy i media ---------- */
function addNews(kind,title,body,extra){S.news.unshift({k:kind,t:title,b:body||'',y:S.y,m:S.m,x:extra||null,fresh:1});if(S.news.length>80)S.news.length=80}
function media(title,body,tone,src){S.media.unshift({t:title,b:body||'',tone:tone||'neutral',src:src||pick(['Przegląd Futbolowy','Gazeta Kibica','SportNews24','Futbol Express','Portal Trybuna','Magazyn Bramka']),y:S.y,m:S.m});if(S.media.length>120)S.media.length=120}

/* ---------- rozgrywki ---------- */
function rrFixtures(teams,double){/* round robin */
 var t=teams.slice();if(t.length%2)t.push(null);var n=t.length,rounds=[],i,r;
 for(r=0;r<n-1;r++){var rd=[];for(i=0;i<n/2;i++){var a=t[i],b=t[n-1-i];if(a&&b)rd.push(r%2?[a,b]:[b,a])}rounds.push(rd);t.splice(1,0,t.pop())}
 if(double){var back=rounds.map(function(rd){return rd.map(function(m){return[m[1],m[0]]})});rounds=rounds.concat(back)}
 var fx=[];rounds.forEach(function(rd,ri_){rd.forEach(function(m){fx.push({r:ri_,h:m[0],a:m[1],hg:null,ag:null})})});return fx}
function mkGroup(id,type,name,teams,double){var c={id:id,type:type,name:name,teams:teams,fx:rrFixtures(shuffle(teams),double),nr:0,done:0};c.rounds=Math.max.apply(null,c.fx.map(function(f){return f.r}))+1;S.comps[id]=c;return c}
function table(c){var T={};c.teams.forEach(function(t){T[t]={c:t,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}});
 c.fx.forEach(function(f){if(f.hg===null)return;var h=T[f.h],a=T[f.a];h.p++;a.p++;h.gf+=f.hg;h.ga+=f.ag;a.gf+=f.ag;a.ga+=f.hg;
  if(f.hg>f.ag){h.w++;a.l++;h.pts+=3}else if(f.hg<f.ag){a.w++;h.l++;a.pts+=3}else{h.d++;a.d++;h.pts++;a.pts++}});
 return Object.keys(T).map(function(k){return T[k]}).sort(function(a,b){return b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||(S.elo[b.c]-S.elo[a.c])})}
function posIn(c){var t=table(c);for(var i=0;i<t.length;i++)if(t[i].c==='POL')return i+1;return 0}
function eurPool(){return TL.filter(function(t){return t.conf==='E'}).map(function(t){return t.c}).sort(function(a,b){return S.str[b]-S.str[a]})}
function worldPool(){return TL.map(function(t){return t.c}).sort(function(a,b){return S.str[b]-S.str[a]})}
function rankList(){var a=Object.keys(S.elo);a.sort(function(x,y){return S.elo[y]-S.elo[x]});return a}
function polRank(){return rankList().indexOf('POL')+1}

function startNL(opp,tier){var c=mkGroup('NL'+S.y,'NL','Liga Narodów '+S.y+'/'+((S.y+1)%100)+' · Dywizja '+tier,['POL'].concat(opp),true);c.tier=tier;S.nlTier=tier;return c}
function newNL(){var tiers={A:[0,16],B:[16,32],C:[32,48],D:[48,60]};var pool=eurPool().filter(function(c){return c!=='POL'});var r=tiers[S.nlTier];var cand=pool.slice(r[0],r[1]);if(cand.length<3)cand=pool.slice(-12);return startNL(shuffle(cand).slice(0,3),S.nlTier)}
function newQual(type){var pool=eurPool().filter(function(c){return c!=='POL'});var pots=[];for(var i=0;i<6;i++)pots.push(pool.slice(i*9,i*9+9));
 /* Polska trafia do koszyka wg rankingu */
 var all=eurPool();var pp=Math.min(5,Math.floor(all.indexOf('POL')/9));var opp=[];for(i=0;i<6;i++){if(i===pp)continue;var pt=pots[i].filter(function(c){return opp.indexOf(c)<0});if(pt.length)opp.push(pick(pt))}
 opp=opp.slice(0,5);var nm=type==='EQ'?'Eliminacje Euro '+(S.y+1):'Eliminacje mundialu '+(S.y+1);
 var c=mkGroup(type+S.y,type,nm,['POL'].concat(opp),true);return c}

/* ---------- plan zgrupowań ---------- */
function planWindow(){
 var y=S.y,m=S.m,w={y:y,m:m,matches:[],mi:0,kind:'F',comp:null,title:'Mecze towarzyskie'};
 var cyc=y%4;
 if(m>=9&&cyc%2===0){var nl=S.comps['NL'+y]||newNL();w.kind='G';w.comp=nl.id;w.title=nl.name}
 else if(cyc===3||cyc===1){var id=(cyc===3?'EQ':'WQ')+y;var c=S.comps[id]||newQual(cyc===3?'EQ':'WQ');w.kind='G';w.comp=c.id;w.title=c.name}
 else if(m===3){var po=cyc===0?S.q.euroPO:S.q.wcPO;if(po){w.kind='PO';w.title='Baraże o '+(cyc===0?'Euro ':'mundial ')+y;w.po={stage:0,big:cyc===0?'EURO':'WC'}}}
 else if(m===6){var ok=cyc===0?S.q.euro:S.q.wc;if(ok){w.kind='T';w.t=cyc===0?'EURO':'WC';w.title=(cyc===0?'Euro ':'Mistrzostwa świata ')+y;startTour(w)}else{w.title='Lato bez turnieju: mecze towarzyskie';w.noTour=cyc===0?'Euro':'mundial'}}
 if(w.kind==='G')fillGroupMatches(w);
 else if(w.kind==='F'){var pool=worldPool().filter(function(c){return c!=='POL'});var strong=pick(pool.slice(0,18)),weak=pick(pool.slice(30));w.matches=shuffle([{opp:strong,home:Math.random()<.5},{opp:weak,home:Math.random()<.6}]).map(function(x){x.fr=1;return x})}
 else if(w.kind==='PO'){var pl=eurPool().filter(function(c){return c!=='POL'});var r=eurPool().indexOf('POL');w.matches=[{opp:pick(pl.slice(Math.max(0,r-4),r+10)),home:Math.random()<.5,ko:1,stage:'Półfinał baraży'}]}
 S.win=w;S.windows++}
function fillGroupMatches(w){var c=S.comps[w.comp];var rs=[c.nr,c.nr+1];w.rounds=rs;w.matches=[];
 c.fx.forEach(function(f){if(rs.indexOf(f.r)>=0&&(f.h==='POL'||f.a==='POL'))w.matches.push({opp:f.h==='POL'?f.a:f.h,home:f.h==='POL',fx:c.fx.indexOf(f)})});
 w.matches.sort(function(a,b){return c.fx[a.fx].r-c.fx[b.fx].r})}
function startTour(w){var pool=(w.t==='EURO'?eurPool():worldPool()).filter(function(c){return c!=='POL'});
 var g=['POL',pick(pool.slice(0,6)),pick(pool.slice(6,16)),pick(pool.slice(16,30))];
 var c=mkGroup(w.t+S.y,'T',w.title+' · grupa',g,false);w.comp=c.id;w.kind='T';w.stage=0;fillTourGroup(w)}
function fillTourGroup(w){var c=S.comps[w.comp];w.matches=[];c.fx.forEach(function(f){if(f.h==='POL'||f.a==='POL')w.matches.push({opp:f.h==='POL'?f.a:f.h,home:true,neutral:1,fx:c.fx.indexOf(f),stage:'Faza grupowa'})});w.matches.sort(function(a,b){return c.fx[a.fx].r-c.fx[b.fx].r})}
var KO={EURO:['1/8 finału','Ćwierćfinał','Półfinał','Finał'],WC:['1/16 finału','1/8 finału','Ćwierćfinał','Półfinał','Finał']};

/* ---------- symulacja świata ---------- */
function lam(a,b,home){return clamp(1.15*Math.exp((a-b+(home?1.6:0))/17),.12,3.6)}
function simQuick(h,a,neutral){var sh=teamStr(h)+gauss()*2,sa=teamStr(a)+gauss()*2;return[poisson(lam(sh,sa,!neutral)),poisson(lam(sa,sh,false))]}
function eloUpd(h,a,hg,ag){var e=1/(1+Math.pow(10,(S.elo[a]-S.elo[h])/400));var r=hg>ag?1:hg<ag?0:.5;var k=30*(1+Math.min(3,Math.abs(hg-ag))*.25);S.elo[h]+=k*(r-e);S.elo[a]-=k*(r-e)}
function playOthers(c,rounds){c.fx.forEach(function(f){if(rounds.indexOf(f.r)>=0&&f.hg===null&&f.h!=='POL'&&f.a!=='POL'){var s=simQuick(f.h,f.a,c.type==='T');f.hg=s[0];f.ag=s[1];eloUpd(f.h,f.a,f.hg,f.ag)}})}

/* forma klubowa między zgrupowaniami */
function clubTick(weeks){
 var out={hot:[],cold:[],inj:[],back:[]};
 plist().forEach(function(p){
  if(p.inj>0){p.inj=Math.max(0,p.inj-weeks);if(!p.inj)out.back.push(p)}
  var d=p.ovr-LVAVG[p.lv];
  p.form=clamp(Math.round(p.form*.4+gauss()*1.5+(d>2?.4:d<-4?-.4:0)),-3,3);
  p.mins=minsFor(p);
  var ag=age(p),risk=.035+(ag>31?.02:0)+(p.mins>.8?.01:0);
  if(!p.inj&&Math.random()<risk*weeks/6){p.inj=ri(1,10);p.mins=0;out.inj.push(p)}
  var games=Math.round(weeks*.9*p.mins),gr={ST:.42,LW:.25,RW:.25,AM:.22,CM:.08,DM:.03,CB:.04,LB:.03,RB:.03,GK:0}[p.pos]*(1+(p.ovr-LVAVG[p.lv])/25)*(1+p.form*.15);
  var gs=0;for(var i=0;i<games;i++)if(Math.random()<gr)gs++;p.cs.a+=games;p.cs.g+=gs;p.lg=gs;p.lgm=games;
  if(p.form>=2&&p.mins>.6)out.hot.push(p);if(p.mins<.3&&p.ovr>=72&&!p.inj)out.cold.push(p)});
 out.hot.sort(function(a,b){return b.ovr+b.lg*2-(a.ovr+a.lg*2)});out.cold.sort(function(a,b){return b.ovr-a.ovr});
 out.hot.slice(0,3).forEach(function(p){addNews('club',sur(p.n)+' w gazie',p.n+' ('+p.cl+') '+(p.lg>0?'strzelił '+p.lg+' '+(p.lg===1?'gola':p.lg<5?'gole':'goli')+' w '+p.lgm+' meczach':'zbiera świetne oceny')+'. Kibice pytają, czy zagra w kadrze.')});
 out.cold.slice(0,2).forEach(function(p){addNews('club',sur(p.n)+' na ławce',p.n+' w '+p.cl+' gra mało ('+Math.round(p.mins*100)+'% minut). Forma meczowa pod znakiem zapytania.')});
 out.inj.filter(function(p){return p.ovr>=70}).slice(0,4).forEach(function(p){addNews('inj','Kontuzja: '+p.n,'Przerwa ok. '+p.inj+' tyg. '+(p.inj>=6?'Najbliższe zgrupowanie raczej bez niego.':'Może zdążyć na zgrupowanie.'))});
 out.back.filter(function(p){return p.ovr>=72}).slice(0,2).forEach(function(p){addNews('club',p.n+' wrócił do gry','Po kontuzji znów trenuje z zespołem '+p.cl+'.')});
}
function transfers(summer){
 plist().forEach(function(p){var d=p.ovr-LVAVG[p.lv],ag=age(p);
  if(p.lv<5&&d>=4&&ag<31&&Math.random()<(summer?.45:.15)){var old=p.cl;p.lv++;p.cl=pick(CL[p.lv]);p.mins=minsFor(p);
   addNews('tr','Transfer: '+p.n,p.n+' przechodzi z '+old+' do '+p.cl+'.'+(p.lv>=5?' To wielki krok w karierze!':''))}
  else if(p.lv>1&&(d<=-6||(ag>=33&&Math.random()<.3))&&Math.random()<(summer?.4:.12)){var old2=p.cl;p.lv=Math.max(1,p.lv-(ag>=33&&Math.random()<.5?2:1));p.cl=ag>=32&&Math.random()<.35?pick(['Al-Nassr','Al-Hilal','Inter Miami','LA Galaxy','Al-Ahli','Al-Ittihad','Wieczysta Kraków']):pick(CL[p.lv]);p.mins=minsFor(p);
   if(p.ovr>=70)addNews('tr','Transfer: '+p.n,p.n+' zmienia klub: '+old2+' → '+p.cl+'.')}})}
function newSeason(){
 S.season=S.y;var retd=[],youth=[];
 plist().forEach(function(p){var ag=age(p);
  var g;if(ag<=20)g=ri(1,5)*(p.pot-p.ovr)/12+rnd(0,1.5);else if(ag<=23)g=ri(0,3)*(p.pot-p.ovr)/10+rnd(-.5,1);else if(ag<=28)g=rnd(-1,1.5)*(p.pot>p.ovr?1:.5);else if(ag<=31)g=rnd(-1.5,.5);else if(ag<=34)g=rnd(-3,-.5);else g=rnd(-4.5,-1.5);
  p.ovr=clamp(Math.round(p.ovr+g),40,95);if(p.ovr>p.pot)p.pot=p.ovr;p.cs={a:0,g:0};
  var rp=ag>=38?.75:ag>=36?.45:ag>=34?.2:ag>=33?.08:0;if(p.ovr<64&&ag>=31)rp+=.25;
  if(Math.random()<rp){p.ret=1;retd.push(p)}});
 retd.sort(function(a,b){return b.caps-a.caps});
 retd.forEach(function(p,i){if(p.caps>=30){addNews('ret',p.n+' kończy karierę',p.n+' zawiesza buty na kołku. W kadrze: '+p.caps+' meczów, '+p.g+' goli. Dziękujemy!'+(p.n==='Robert Lewandowski'?' Koniec pewnej epoki. Na kanale Qastrod czeka piosenka o jego drodze.':''),p.n==='Robert Lewandowski'?{song:'lewy'}:null);if(p.n==='Robert Lewandowski'){unlockSong('lewy');media('KONIEC EPOKI. Lewandowski odchodzi','Kraj wstrzymał oddech. Selekcjoner '+S.name+' musi znaleźć nowego lidera.','big')}}});
 if(S.cap&&P(S.cap).ret){var c=autoCaptain();S.cap=c;if(c)addNews('cap','Nowy kapitan: '+P(c).n,'Opaskę przejmuje '+P(c).n+'. Możesz to zmienić w składzie meczowym.')}
 var n=ri(5,8);for(var i=0;i<n;i++)youth.push(makeYouth());
 youth.sort(function(a,b){return b.pot-a.pot});
 addNews('youth','Nowe talenty w polskiej piłce','Skauci polecają: '+youth.slice(0,3).map(function(p){return p.n+' ('+age(p)+' l., '+p.cl+')'}).join(', ')+'. Sprawdź ich w zakładce Kadra.');
 if(youth[0].pot>=86)media('Polski Yamal? Wszyscy mówią: '+youth[0].n,'Ma '+age(youth[0])+' lat i już porównują go do największych. Czy selekcjoner da mu szansę?','hype');
 transfers(true);
 for(var c in S.str){if(c==='POL')continue;S.str[c]=clamp(S.str[c]+Math.round(gauss()*1.2),40,92)}
}
function makeYouth(){var pos=wpick(['GK','CB','CB','LB','RB','DM','CM','CM','AM','LW','RW','ST','ST'],function(){return 1});
 var pot=Math.round(clamp(72+gauss()*6,64,92)),a=ri(17,18),lv=Math.random()<.2?3:Math.random()<.1?4:2;
 var p={id:S.nid++,n:pick(FN)+' '+pick(LN),pos:pos,by:S.y-a,cl:pick(CL[lv]),lv:lv,ovr:clamp(Math.round(pot-ri(10,22)),52,72),pot:pot,caps:0,g:0,form:0,mins:.5,inj:0,ret:0,cs:{a:0,g:0},mood:60,yt:1};
 p.mins=minsFor(p);S.pl[p.id]=p;return p}
var NPREF={'Lewandowski':9,'Zieliński':10,'Bednarek':5,'Kiwior':14,'Cash':2,'Szymański':20,'Zalewski':21,'Świderski':11,'Piątek':23,'Skorupski':1,'Bułka':1,'Grabara':12,'Moder':7,'Kamiński':13,'Frankowski':19,'Slisz':6,'Urbański':17};
var NPOS={BR:[1,12,22],OBR:[2,3,4,5,15,18,25,26,24],POM:[8,6,7,10,16,17,20,24,22],NAP:[9,11,19,23,7,18]};
function shirtNo(id){if(!S)return 1;S.nums=S.nums||{};var sq=S.squad||[];var taken={};sq.forEach(function(o){if(o!==id&&S.nums[o])taken[S.nums[o]]=1});
 var n=S.nums[id];if(n&&!taken[n])return n;var p=P(id);if(!p)return 99;var sn=p.n.split(' ').slice(-1)[0];
 var cand=[];if(NPREF[sn])cand.push(NPREF[sn]);cand=cand.concat(NPOS[POSG[p.pos]]||[]);for(var k=2;k<100;k++)cand.push(k);
 for(var i=0;i<cand.length;i++){if(!taken[cand[i]]&&!(cand[i]===1&&p.pos!=='GK')){S.nums[id]=cand[i];return cand[i]}}return 99}
function autoCaptain(){var a=plist().filter(function(p){return !p.inj}).sort(function(x,y){return (y.caps+y.ovr*2)-(x.caps+x.ovr*2)});return a.length?a[0].id:null}

/* ---------- przejście do kolejnego zgrupowania ---------- */
var NEXT={3:6,6:9,9:10,10:11,11:3};
function advance(){
 var m=S.m,y=S.y;var nm=NEXT[m];var weeks={3:10,6:12,9:4,10:5,11:16}[m];
 S.news.forEach(function(n){n.fresh=0});
 if(m===11){S.y++;transfers(false);yearReview()}
 if(m===6){S.y=y;/* lato */S.m=7;newSeason()}
 S.m=nm;clubTick(weeks);
 drama();pressureEvents();
 planWindow();S.phase='hub';S.squadDone=0;save()}
function yearReview(){var t=S.trust;var line=t>=75?'Prezes związku: "To najlepszy selekcjoner od lat. Rozmawiamy o przedłużeniu do 2050 roku."':t>=50?'Prezes związku: "Jestem zadowolony. No, w miarę."':t>=30?'Prezes związku: "Selekcjoner ma moje pełne zaufanie." (Kibice wiedzą, co to zwykle znaczy.)':'Prezes związku: "Nie zwalniamy. Jeszcze nie wymyśliliśmy, jak się to robi."';
 addNews('board','Podsumowanie roku '+(S.y-1),line+' Bilans kadencji: '+S.stats.w+' zw., '+S.stats.d+' rem., '+S.stats.l+' por.')}

/* afery i dramy */
function drama(){
 var called=S.lastCall||[];var cand;
 if(Math.random()<.35){cand=plist().filter(function(p){return p.ovr>=76&&p.caps>=20&&called.indexOf(p.id)<0&&!p.inj&&!p.ret});
  if(cand.length){var p=pick(cand);p.mood=clamp(p.mood-20,0,100);
   addNews('drama','Zgrzyt: '+p.n,pick([p.n+' w wywiadzie: "Nikt do mnie nie zadzwonił. Dowiedziałem się z internetu."',p.n+' po meczu klubowym: "Jestem gotowy. Reszta to nie moja decyzja." Dziennikarze czytają między wierszami.',p.n+' wrzucił zdjęcie z siłowni z podpisem "Czekam". Ma już 200 tys. polubień.']));
   media('Wojna na linii '+sur(p.n)+' - selekcjoner?','Media huczą po słowach '+p.n+'. Ekspert: "Takiego piłkarza się nie pomija".','bad');S.press=clamp(S.press+4,0,100)}}
 if(Math.random()<.18){var c=S.cap&&P(S.cap);if(c&&!c.ret){addNews('drama','Kapitan chce rozmowy',c.n+' poprosił o spotkanie w cztery oczy. Podobno chodzi o atmosferę i taktykę.');S.morale=clamp(S.morale-4,0,100)}}
 if(Math.random()<.2)addNews('board',pick(['Prezes wtrąca się w taktykę','Prezes ma pomysł','Telefon z federacji']),pick(['Prezes związku zasugerował grę "na dwóch napastników, jak za moich czasów".','Prezes związku zaproponował zgrupowanie w swoim ulubionym hotelu nad morzem. Wi-fi podobno działa.','Związek pyta, czy kadra mogłaby nagrać reklamę chipsów. Selekcjoner zgodził się pod warunkiem, że będą paprykowe.']));
 if(Math.random()<.22){cand=plist().filter(function(p){return age(p)<=19&&p.pot>=80});if(cand.length){var y_=pick(cand);addNews('youth','Talent puka do kadry',y_.n+' ('+age(y_)+' l.) robi furorę w '+y_.cl+'. Ekspert: "Ja bym go powołał już teraz."')}}
}
function pressureEvents(){
 var p=S.press;
 if(p>=95&&!S.best.p95){S.best.p95=1;media('Petycja: "Selekcjoner, dziękujemy, wystarczy" ma już 500 tys. podpisów','Selekcjoner '+S.name+' skomentował krótko: "Ja też umiem podpisywać różne rzeczy".','bad');}
 else if(p>=85&&Math.random()<.5)media(pick(['Kibice zrzucili się na billboard. Napis: "'+sur(S.name).toUpperCase()+' OUT"','Sondaż: 81% Polaków twierdzi, że poprowadziłoby kadrę lepiej','Taksówkarz z Warszawy: "Ja bym tego Lewandowskiego ustawił na stoperze"']),'Atmosfera wokół kadry gęstnieje.','bad');
 else if(p>=70&&Math.random()<.4)media(pick(['Eksperci w studiu kłócą się o skład. Jeden rzucił długopisem','Hasztag #'+sur(S.name).replace(/\s/g,'')+'Out na topie trendów','Mem tygodnia: selekcjoner tłumaczy taktykę na tablicy, a na tablicy jest rysunek kotka']),'Internet nie zapomina.','bad');
 if(S.trust>=85&&Math.random()<.4)media(pick(['Kibice śpiewają nazwisko selekcjonera na meczu ligowym','Pojawiła się koszulka z wizerunkiem selekcjonera. Wyprzedana w 2 godziny','Ankieta: selekcjoner wyprzedza prezydenta w rankingu zaufania']),'Złote czasy kadry?','good');
}

/* ---------- osiągnięcia ---------- */
var ACH=[
 ['first','Pierwsze zwycięstwo','Wygraj pierwszy mecz'],['ger','Pogromca Niemców','Pokonaj Niemcy'],['giant','Pogromca gigantów','Pokonaj drużynę z oceną 85+'],
 ['swe','Rewanż za baraż','Pokonaj Szwecję'],['rout','Pogrom','Wygraj różnicą 5 goli'],['unb10','Twierdza','10 meczów bez porażki z rzędu'],
 ['l5','Skóra słonia','Przetrwaj 5 porażek z rzędu'],['euroq','Jedziemy na Euro','Awansuj na Euro'],['wcq','Mundial!','Awansuj na mistrzostwa świata'],
 ['grp','Wyjście z grupy','Wyjdź z grupy na turnieju'],['qf','Ćwierćfinał','Dojdź do ćwierćfinału turnieju'],['sf','Półfinał','Dojdź do półfinału'],
 ['eurow','Mistrz Europy','Wygraj Euro'],['wcw','Mistrz świata','Wygraj mundial'],['nlup','Awans w Lidze Narodów','Wygraj grupę Ligi Narodów'],
 ['kid','Odwaga','Wystaw w meczu piłkarza w wieku 18 lat lub młodszego'],['deb5','Rewolucja','Powołaj 5 debiutantów na jedno zgrupowanie'],
 ['hat','Hat-trick','Twój piłkarz strzela 3 gole w meczu'],['lewy100','Setka Lewego','Lewandowski z 100 golami w kadrze'],
 ['s5','Weteran ławki','5 sezonów kadencji'],['s10','Legenda ławki','10 sezonów kadencji'],['t90','Ukochany przez naród','Zaufanie kibiców 90%'],['p100','Media w ogniu','Presja mediów 100%']];
function ach(id){if(S.ach[id])return;S.ach[id]={y:S.y,m:S.m};var a=ACH.filter(function(x){return x[0]===id})[0];if(a){S.newAch=S.newAch||[];S.newAch.push(a[1])}}
function unlockSong(k){if(S.songs[k])return;S.songs[k]=1;S.newSong=k}

/* ---------- eksport ---------- */
window.SS={S:function(){return S},newGame:newGame,advance:advance,planWindow:planWindow,P:P,plist:plist,age:age,autoXI:autoXI,eff:eff,polStr:polStr,teamStr:teamStr,
 table:table,posIn:posIn,polRank:polRank,playOthers:playOthers,eloUpd:eloUpd,lam:lam,simQuick:simQuick,addNews:addNews,media:media,ach:ach,unlockSong:unlockSong,
 rnd:rnd,ri:ri,pick:pick,clamp:clamp,shuffle:shuffle,gauss:gauss,poisson:poisson,esc:esc,wpick:wpick,sur:sur,MON:MON,MONG:MONG,TEAMS:TEAMS,FORM:FORM,fit:fit,LINE:LINE,
 POSG:POSG,POSN:POSN,SONGS:SONGS,ACH:ACH,KO:KO,eurPool:eurPool,worldPool:worldPool,mkGroup:mkGroup,fillTourGroup:fillTourGroup,newQual:newQual,save:save,load:load,
 setS:function(s){S=s},shirtNo:shirtNo,root:root,DEBUG:DEBUG,KEY:KEY,LVAVG:LVAVG,byName:byName,autoCaptain:autoCaptain};
})();
