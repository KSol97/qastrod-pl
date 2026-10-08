/* Menedżer klubu (na silniku Symulatora selekcjonera | qastrod.pl) */
(function(){
'use strict';
var root=document.getElementById('ss');if(!root)return;
var DEBUG=/[?&]debug=1/.test(location.search);
var KEY='qastrod_menedzer_v1';
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
function money(v){v=Math.round(v);var a=Math.abs(v);var s=a>=1e6?(Math.round(a/1e5)/10).toString().replace('.',',')+' mln':a>=1e3?Math.round(a/1e3)+' tys.':a+'';return (v<0?'−':'')+s+' zł'}
var MONTHS=['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];

/* ---------- dane ---------- */
var D=window.KMD,DE=window.KME||{clubs:[],pools:{}};var TEAMS={},CLUBS=[],FCL=[];
function addTeam(c,lg){var t={c:c.c,n:c.n,lg0:lg,c1:c.k[0],c2:c.k[1],a1:c.k[2],a2:c.k[3],cr:c.cr,res:c.res||null,stars:[],bud0:c.bud||600000};TEAMS[c.c]=t;CLUBS.push(t);return t}
D.clubs.forEach(function(c){addTeam(c,c.lg)});D.pool.forEach(function(c){addTeam(c,'L3')});
DE.clubs.forEach(function(c){var t={c:c.c,n:c.n,cc:c.cc,f:1,s0:c.s,np:c.np,c1:c.k[0],c2:c.k[1],a1:c.k[2],a2:c.k[3],cr:c.cr,stars:[]};TEAMS[c.c]=t;FCL.push(t)});
var FN=D.fn.split(','),LN=D.ln.split(',');
var LG={E:'Superklasa',L1:'1 liga',L2:'2 liga',L3:'3 liga',EU:'Europa'};
var LVL={E:3,L1:2,L2:1,L3:0};
var POSG={GK:'BR',CB:'OBR',LB:'OBR',RB:'OBR',DM:'POM',CM:'POM',AM:'POM',LW:'NAP',RW:'NAP',ST:'NAP'};
var POSN={GK:'BR',CB:'ŚO',LB:'LO',RB:'PO',DM:'ŚPD',CM:'ŚP',AM:'ŚPO',LW:'LS',RW:'PS',ST:'N',LWB:'LWO',RWB:'PWO'};
var SONGS={
 walka:{i:'6yxaR3YGWKs',t:'Każdy mecz to walka'},
 pasja:{i:'AfALsHrQ1zo',t:'Oni też kiedyś byli mali - PASJA'}
};

/* ---------- formacje (bez zmian) ---------- */
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
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){try{for(var id in S.pl)if(S.pl[id].ret)delete S.pl[id];S.news.length=Math.min(S.news.length,40);S.trlog.length=Math.min(S.trlog.length,100);localStorage.setItem(KEY,JSON.stringify(S))}catch(e2){}}}
function load(){try{var s=localStorage.getItem(KEY);if(s){var o=JSON.parse(s);if(o&&(o.v===1||o.v===2))return o}}catch(e){}return null}
function P(id){return S.pl[id]}
function age(p){return S.y-p.by}
function isF(c){return !!(TEAMS[c]&&TEAMS[c].f)}
function isY(c){return typeof c==='string'&&c.length===4&&c.charAt(0)==='Y'}
function plist(){var a=[];for(var id in S.pl){var p=S.pl[id];if(!p.ret)a.push(p)}return a}
function squadOf(c){var a=[];for(var id in S.pl){var p=S.pl[id];if(!p.ret&&p.cl===c)a.push(p)}return a}
function mySquad(){return squadOf(S.me)}
function myYouth(){return squadOf('Y'+S.me)}
function tn(c){if(isY(c))return tn(c.slice(1))+' (juniorzy)';return TEAMS[c]?TEAMS[c].n:c}
function lgOf(c){if(isF(c))return 'EU';for(var k in S.lg)if(S.lg[k].indexOf(c)>=0)return k;return 'L3'}
function ftier(c){var s=teamStr(c);return s>=82?6:s>=76?5:s>=70?4:3}
function lvlOf(c){if(isF(c))return ftier(c);if(isY(c))return 0;return LVL[lgOf(c)]}
function bud(c){return S.bud[c]||0}
function mkPlayer(o){var p={id:S.nid++,n:o.n,pos:o.pos,by:o.by,cl:o.cl,ovr:o.ovr,pot:Math.max(o.pot,o.ovr),form:Math.round(gauss()*1.1),mins:.7,inj:0,ret:0,cs:{a:0,g:0,r:0,n:0},caps:0,g:0,mood:60,yt:o.yt||0,tl:0,lock:0};S.pl[p.id]=p;return p}
function genName(){return pick(FN).charAt(0)+'. '+pick(LN)}
var INIT='ABCDEFGHIJKLMNOPRSTVW';
function genFName(np){var pools=DE.pools||{};var pool=Math.random()<.62&&pools[np]?pools[np]:pools[pick(['br','af','ar','es','fr','pt','sl','nl'])]||LN;return INIT.charAt(ri(0,INIT.length-1))+'. '+pick(pool)}
function genPlayer(cl,pos,a,lvl,target){var t=target!=null?target:[50,55,61,66][lvl];var ovr=Math.round(clamp(t+gauss()*2.2+(a<=19?-5:a<=21?-3:a>=33?-1:0),40,90));
 var pot=ovr+(a<=18?ri(8,18):a<=20?ri(5,13):a<=23?ri(2,8):ri(0,2));return mkPlayer({n:isF(cl)?genFName(TEAMS[cl].np):genName(),pos:pos,by:S.y-a,cl:cl,ovr:ovr,pot:Math.min(92,pot)})}

function newGame(name,club){
 S={v:2,name:name||'Trener',me:club,y:2026,season:2026,pl:{},nid:1,str:{},bud:{},lg:{E:[],L1:[],L2:[],L3:[]},
  trust:60,press:30,morale:60,board:60,
  tac:{f:'4-2-3-1',press:50,tempo:50,ment:50},xi:null,xiF:null,
  news:[],media:[],ach:{},songs:{},hist:[],seasons:[],trlog:[],offers:[],
  streak:{w:0,u:0,l:0,nl:0},stats:{p:0,w:0,d:0,l:0,gf:0,ga:0},best:{},pressMod:0,phase:'hub',clubs:[club],
  ev:0,cal:[],fx:{},cup:null,po:null,goal:null,fs:{},euOpen:0,eu:null,euNext:null,ys:{},yl:null,ss:null};
 CLUBS.forEach(function(t){S.lg[t.lg0].push(t.c);S.bud[t.c]=t.bud0});
 FCL.forEach(function(t){S.fs[t.c]=t.s0});
 D.pl.split('\n').forEach(function(l){var f=l.split('|');mkPlayer({cl:f[0],n:f[1],pos:f[2],by:+f[3],ovr:+f[4],pot:+f[5]})});
 S.lg.L3.forEach(function(c){['GK','GK','CB','CB','CB','LB','RB','CB','DM','CM','CM','AM','LW','RW','CM','DM','ST','ST','ST','LW','RW','CB'].forEach(function(pos){genPlayer(c,pos,ri(18,32),0)})});
 /* europejskie puchary w pierwszym sezonie: wg kolejności tabeli w bazie */
 S.euNext=[];/* pierwszy sezon bez polskich klubów w pucharach */
 genYouth(club,18,15,18);
 startSeason(true);
 addNews('start','Nowy trener w '+tn(club),'Zarząd '+tn(club)+' ogłosił: drużynę przejmuje '+S.name+'. Cel na sezon: '+S.goal.text+'. Budżet transferowy: '+money(bud(club))+'.');
 media('Kim jest '+S.name+'? Kibice '+tn(club)+' już szukają w internecie','Pierwsze memy pojawiły się 4 minuty po ogłoszeniu decyzji.','neutral');
 S.phase='hub';save()}
function migrate(s){if(!s||s.v===2)return;S=s;S.v=2;S.fs={};FCL.forEach(function(t){S.fs[t.c]=t.s0});S.euOpen=0;S.eu={ent:[],q:{},comps:{},built:0};
 S.euNext=[];
 S.ys={};genYouth(S.me,18,15,18);buildYouthLeague(true);S.ss=newSS();plist().forEach(function(p){p.cs.r=p.cs.r||0;p.cs.n=p.cs.n||0})}

/* ---------- siła drużyn ---------- */
function eff(p,slot){var f=slot?fit(p.pos,slot):1;var m=(p.mood-60)/40;return p.ovr*f+p.form*1.1+m+(p.mins-.6)*2.5}
function autoXI(f,pool){
 var slots=FORM[f].map(function(s,i){return{i:i,slot:s[0]}});var used={},res=[];
 var order=['GK','ST','CB','DM','AM','LB','RB','LWB','RWB','CM','LW','RW'];
 slots.sort(function(a,b){return order.indexOf(a.slot)-order.indexOf(b.slot)});
 slots.forEach(function(s){var best=null,bv=-1;pool.forEach(function(p){if(used[p.id])return;var v=eff(p,s.slot);if(v>bv){bv=v;best=p}});if(best){used[best.id]=1;res.push({i:s.i,slot:s.slot,id:best.id})}});
 res.sort(function(a,b){return a.i-b.i});return res}
function poolStr(sq){var pool=sq.filter(function(p){return !p.inj});if(pool.length<11)pool=sq;var xi=autoXI('4-2-3-1',pool);if(!xi.length)return 45;var s=0;xi.forEach(function(e){s+=eff(P(e.id),e.slot)});return s/Math.max(11,xi.length)}
function clubStr(c){return poolStr(squadOf(c))}
function refreshStr(){RK=null;var all={};plist().forEach(function(p){(all[p.cl]=all[p.cl]||[]).push(p)});
 var list=S.euOpen?CLUBS.concat(FCL):CLUBS;
 list.forEach(function(t){var sq=(all[t.c]||[]);S.str[t.c]=poolStr(sq);
  t.stars=sq.filter(function(p){return p.pos!=='GK'&&!p.inj}).sort(function(a,b){return (b.ovr+(POSG[b.pos]==='NAP'?3:0))-(a.ovr+(POSG[a.pos]==='NAP'?3:0))}).slice(0,3).map(function(p){return p.n})});
 if(!S.euOpen)FCL.forEach(function(t){if(!t.stars.length)t.stars=[genFName(t.np),genFName(t.np),genFName(t.np)]})}
function teamStr(c){if(isY(c))return youthStr(c.slice(1));var v=S.str[c];if(v==null&&isF(c))v=S.fs[c];return v||50}
function myStr(){return clubStr(S.me)}

/* ---------- ceny i transfery ---------- */
function value(p){var a=age(p);var o=p.ovr;var b=o<=72?780000*Math.pow(1.16,o-66):780000*Math.pow(1.16,6)*Math.pow(1.22,o-72);
 var af=a<=20?1.35:a<=23?1.25:a<=27?1.15:a<=29?1:a<=31?.82:a<=33?.6:.4;
 var v=b*af*(1+Math.max(0,p.pot-p.ovr)*.025);if(isY(p.cl))v*=.7;return Math.max(20000,Math.round(v/10000)*10000)}
var RK=null;function rankIn(p){if(!RK){RK={};var by={};plist().forEach(function(x){(by[x.cl]=by[x.cl]||[]).push(x)});for(var c in by)by[c].sort(function(a,b){return b.ovr-a.ovr}).forEach(function(x,i){RK[x.id]=i+1})}return RK[p.id]||30}
function inCL(c){var e=S.eu&&S.eu.comps&&S.eu.comps.CL;return !!(e&&e.teams&&e.teams.indexOf(c)>=0)}
function blvl(buyer){return lvlOf(buyer)+(inCL(buyer)?1:0)}
function askPrice(p,buyer){var v=value(p);var r=rankIn(p);var k=r<=3?1.45:r<=8?1.25:r<=14?1.1:.95;
 var dl=lvlOf(p.cl)-blvl(buyer);if(dl>0)k*=1+dl*.12;if(lgOf(p.cl)==='L3'&&!isF(p.cl))k*=.85;return Math.round(v*k/10000)*10000}
/* czy zawodnik chce przejść (0..1) przy ofercie z mnożnikiem m (1, 1.25, 1.5, 2) */
function willing(p,buyer,m){var dl=lvlOf(p.cl)-blvl(buyer);var a=age(p),r=rankIn(p);var w;
 if(dl<=-1)w=.97;else if(dl===0)w=teamStr(buyer)>=teamStr(p.cl)-1?.9:.72;else if(dl===1)w=.3;else if(dl===2)w=.05;else w=.02;
 if(dl>=1){if(a>=31)w+=.12;if(r>14)w+=.12;w+=(m-1)*(dl===1?.55:dl===2?.12:.03)}
 else w+=(m-1)*.15;
 if(dl===0&&r>14)w+=.05;
 return clamp(w,.02,.98)}
function euWin(){return !!(S.euOpen&&S.euWinEnd&&S.ev<S.euWinEnd)}
function canBuy(p){return winOpen()||(isF(p.cl)&&euWin())}
function winOpen(){return S.ev<S.calWin1||(S.ev>=S.calW2a&&S.ev<S.calW2b)}
function winName(){return S.ev<S.calWin1?'letnie':'zimowe'}
function winId(){return S.season+(S.ev<S.calWin1?'L':'Z')}
function moveP(p,to,fee){RK=null;var old=p.cl;p.cl=to;p.tl=0;p.mood=65;p.form=0;p.mins=.7;
 if(!isF(to))S.bud[to]=(S.bud[to]||0)-fee;if(!isF(old))S.bud[old]=(S.bud[old]||0)+fee;
 if(S.ss){if(to===S.me)S.ss.trIn+=fee;if(old===S.me)S.ss.trOut+=fee}
 S.trlog.unshift({y:S.season,n:p.n,f:old,t:to,fee:fee,ovr:p.ovr});if(S.trlog.length>300)S.trlog.length=300;
 S.offers=S.offers.filter(function(o){return o.pid!==p.id});
 if(isF(to)&&!S.euOpen)p.ret=1}
function tryBuy(id,m){var p=P(id);var me=S.me;if(!canBuy(p))return{ok:0,msg:'Okno transferowe jest zamknięte.'};
 if(p.cl===me)return{ok:0,msg:'To już Twój zawodnik.'};
 if(isY(p.cl))return{ok:0,msg:'Juniorów innych klubów nie można kupić.'};
 if(p.lock===winId())return{ok:0,msg:'Ten zawodnik już odmówił w tym oknie.'};
 if(mySquad().length>=32)return{ok:0,msg:'Kadra jest pełna (32). Najpierw kogoś sprzedaj.'};
 var fee=Math.round(askPrice(p,me)*m/10000)*10000;if(fee>bud(me))return{ok:0,msg:'Za mało pieniędzy w budżecie.'};
 if(squadOf(p.cl).length<=17)return{ok:0,msg:tn(p.cl)+' ma za małą kadrę i nie sprzeda zawodnika.'};
 var w=willing(p,me,m);
 if(Math.random()>w){p.lock=winId();var dl=lvlOf(p.cl)-blvl(me);
  addNews('tr','Odmowa: '+p.n,p.n+' nie chce przejść do '+tn(me)+'.'+(dl>=2?' "Za duży krok w dół" - mówi jego agent.':dl===1?' Agent: "Liczyliśmy na lepszą ofertę".':''));
  return{ok:0,ref:1,msg:p.n+' odrzuca ofertę.'+(dl>=1?' Nie chce grać niżej.':'')}}
 var from=p.cl;moveP(p,me,fee);p.caps=0;p.nw=S.stats.p;
 addNews('tr','Transfer: '+p.n+' w '+tn(me),p.n+' ('+p.ovr+') przechodzi z '+tn(from)+' za '+money(fee)+'.');
 if(fee>=2000000)media('Hit transferowy! '+tn(me)+' płaci '+money(fee),'Kibice już kupują koszulki z nazwiskiem '+sur(p.n)+'.','good');
 if(!isF(from)&&LVL[lgOf(from)]-LVL[lgOf(me)]>=2)ach('steal');if(isF(from))ach('eustar');
 S.morale=clamp(S.morale+2,0,100);save();return{ok:1,msg:'✅ '+p.n+' jest Twój! ('+money(fee)+')'}}
function sellTo(o){var p=P(o.pid);if(!p||p.cl!==S.me)return{ok:0};if(mySquad().length<=16)return{ok:0,msg:'Za mała kadra: minimum 16 zawodników.'};
 if(!isF(o.from)&&bud(o.from)<o.amt)return{ok:0,msg:tn(o.from)+' nie ma już tyle pieniędzy.'};
 moveP(p,o.from,o.amt);if(S.xi)S.xi=null;
 addNews('tr','Sprzedaż: '+p.n,p.n+' odchodzi do '+tn(o.from)+' za '+money(o.amt)+'. Pieniądze trafiają do budżetu.');
 if(o.amt>=3000000)ach('sell3');if(o.amt>=value(p)*1.3)media('Świetny interes '+tn(S.me)+'! '+money(o.amt)+' za '+sur(p.n),'Eksperci chwalą: "Sprzedali drożej, niż był wart".','good');
 save();return{ok:1,msg:'💰 Sprzedany za '+money(o.amt)}}
function quickSale(id){var p=P(id);if(!winOpen())return{ok:0,msg:'Okno transferowe jest zamknięte.'};
 var amt=Math.round(value(p)*.6/10000)*10000;var buyers=CLUBS.filter(function(t){return t.c!==S.me&&lgOf(t.c)!=='L3'&&bud(t.c)>=amt&&squadOf(t.c).length<32});
 if(!buyers.length)return{ok:0,msg:'Nikt nie chce kupić.'};return sellTo({pid:id,from:pick(buyers).c,amt:amt})}
/* oferty za zawodników użytkownika: kluby AI z Polski i z Europy */
function aiOffers(){if(!winOpen())return;var me=S.me;var sq=mySquad();if(sq.length<=17)return;
 sq.forEach(function(p){if(S.offers.some(function(o){return o.pid===p.id}))return;var v=value(p);
  if(p.ovr>=67&&Math.random()<(p.tl?.25:.05)){var fb=FCL.filter(function(t){var s=teamStr(t.c);return s>=p.ovr+2&&s<=p.ovr+12});
   if(fb.length){var f=pick(fb).c;var amt0=Math.round(v*rnd(1.2,1.65)/10000)*10000;S.offers.push({pid:p.id,from:f,amt:amt0,id:S.nid++});addNews('offer','Oferta z Europy za '+p.n,tn(f)+' oferuje '+money(amt0)+' za '+p.n+'.');return}}
  var ch=p.tl?.45:(rankIn(p)<=4?.06:.02);if(Math.random()>ch)return;
  var buyers=CLUBS.filter(function(t){var lg=lgOf(t.c);if(t.c===me||lg==='L3'||t.res)return false;if(bud(t.c)<v*.9)return false;var sqb=squadOf(t.c);if(sqb.length>=32)return false;
   var srt=sqb.map(function(x){return x.ovr}).sort(function(a,b){return b-a});return p.ovr>=(srt[13]||0)});
  if(!buyers.length)return;var b=pick(buyers).c;var amt=Math.round(v*(p.tl?rnd(.8,1.12):rnd(1.05,1.45))/10000)*10000;amt=Math.min(amt,bud(b));
  S.offers.push({pid:p.id,from:b,amt:amt,id:S.nid++});addNews('offer','Oferta za '+p.n,tn(b)+' oferuje '+money(amt)+' za '+p.n+'. Zdecyduj w zakładce Transfery.')})}
/* transfery między klubami AI (tylko Polska) */
function aiWindow(summer){var me=S.me,all=plist();var n=0;
 var market=all.filter(function(p){return p.cl!==me&&!p.inj&&age(p)<=33&&!isF(p.cl)&&!isY(p.cl)});
 shuffle(CLUBS.filter(function(t){var lg=lgOf(t.c);return t.c!==me&&lg!=='L3'&&!t.res})).forEach(function(t){
  var tries=summer?ri(0,2):ri(0,1);for(var k=0;k<tries;k++){var sq=squadOf(t.c);if(sq.length>=30)break;
   var srt=sq.slice().sort(function(a,b){return b.ovr-a.ovr});var need=(srt[9]||srt[srt.length-1]||{ovr:50}).ovr;var lb=LVL[lgOf(t.c)];var budget=bud(t.c)*.55;
   var cand=market.filter(function(p){if(p.cl===t.c)return false;var ls=LVL[lgOf(p.cl)];if(ls-lb>1)return false;if(TEAMS[p.cl].res&&TEAMS[p.cl].res!==t.c)return false;return p.ovr>=need+1&&squadOf(p.cl).length>18});
   cand=cand.filter(function(p){return askPrice(p,t.c)<=budget});if(!cand.length)break;
   var p=wpick(cand.slice(0,60),function(x){return 1+(x.ovr-need)});var fee=askPrice(p,t.c);
   if(Math.random()>willing(p,t.c,1))continue;var from=p.cl;moveP(p,t.c,fee);n++;
   if(p.ovr>=67||fee>=1500000)addNews('tr','Transfer: '+p.n,p.n+' przechodzi z '+tn(from)+' do '+tn(t.c)+' za '+money(fee)+'.')}});
 CLUBS.forEach(function(t){if(t.c===me)return;var sq=squadOf(t.c);if(sq.length>32){sq.sort(function(a,b){return a.ovr-b.ovr}).slice(0,sq.length-32).forEach(function(p){p.ret=1})}fillSquad(t.c)});
 return n}
function fillSquad(c){var sq=squadOf(c);var lv=isF(c)?0:LVL[lgOf(c)];var tg=isF(c)?teamStr(c)-3:null;var need={GK:2,CB:4,LB:1,RB:1,CM:3,DM:1,ST:2};
 Object.keys(need).forEach(function(pos){var h=sq.filter(function(p){return p.pos===pos}).length;for(var i=h;i<need[pos];i++)sq.push(genPlayer(c,pos,ri(18,26),lv,tg))});
 while(sq.length<20)sq.push(genPlayer(c,pick(['CB','CM','ST','LW','RW','DM']),ri(18,25),lv,tg))}
/* rynek europejski: kadry zmyślonych klubów powstają, gdy wejdziesz do 1. Ligi Europejskiej */
function unlockEU(){if(S.euOpen)return;var T=['GK','GK','GK','CB','CB','CB','CB','CB','LB','LB','RB','RB','DM','DM','CM','CM','CM','AM','AM','LW','LW','RW','RW','ST','ST','ST'];
 FCL.forEach(function(t){var s=S.fs[t.c];T.forEach(function(pos,i){var a=ri(18,33);var core=i%13<8;var ovr=Math.round(clamp(s-1+(core?0:-3)+gauss()*2.4+(a<=20?-5:a<=22?-2:a>=32?-1:0),45,92));
  mkPlayer({n:genFName(t.np),pos:pos,by:S.y-a,cl:t.c,ovr:ovr,pot:Math.min(94,ovr+(a<=20?ri(5,14):a<=23?ri(2,7):ri(0,2)))})})});
 S.euOpen=1;S.euNew=1;S.euSeen=0;var ce=S.cal[S.ev],r0=ce&&ce.r!=null?ce.r:0,we=-1;S.cal.forEach(function(x,i){if(we<0&&x.t==='L'&&x.r===r0+3)we=i});S.euWinEnd=we>0?we:S.ev+6;refreshStr();addNews('eu','Rynek europejski otwarty!','Awans do europejskich pucharów otwiera drzwi do zawodników z całej Europy. Zakładka Transfery, filtr "Europa".');
 media('Europa patrzy na '+tn(S.me),'Agenci z całego kontynentu dzwonią do klubu. Teraz można kupować zawodników z Europy.','good')}

/* ---------- newsy i media ---------- */
function addNews(kind,title,body,extra){S.news.unshift({k:kind,t:title,b:body||'',y:S.y,m:S.m||7,x:extra||null,fresh:1});if(S.news.length>80)S.news.length=80}
function media(title,body,tone,src){S.media.unshift({t:title,b:body||'',tone:tone||'neutral',src:src||pick(['Przegląd Futbolowy','Gazeta Kibica','SportNews24','Futbol Express','Portal Trybuna','Magazyn Bramka']),y:S.y,m:S.m||7});if(S.media.length>120)S.media.length=120}
function prize(c,amt,kind,why){if(!amt||isF(c)||!c)return;S.bud[c]=(S.bud[c]||0)+amt;if(c===S.me&&S.ss){S.ss.prize[kind]=(S.ss.prize[kind]||0)+amt;if(why)addNews('cash','💰 '+money(amt)+': '+why,'Pieniądze trafiają do budżetu transferowego.')}}

/* ---------- rozgrywki krajowe ---------- */
function rrFixtures(teams){var t=shuffle(teams);if(t.length%2)t.push(null);var n=t.length,rounds=[],i,r;
 for(r=0;r<n-1;r++){var rd=[];for(i=0;i<n/2;i++){var a=t[i],b=t[n-1-i];if(a&&b)rd.push(r%2?[a,b]:[b,a])}rounds.push(rd);t.splice(1,0,t.pop())}
 var back=rounds.map(function(rd){return rd.map(function(m){return[m[1],m[0]]})});rounds=rounds.concat(back);
 var fx=[];rounds.forEach(function(rd,k){rd.forEach(function(m){fx.push({r:k,h:m[0],a:m[1],hg:null,ag:null})})});return fx}
function tableOf(teams,fx){var T={};teams.forEach(function(t){T[t]={c:t,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0,fm:[]}});
 fx.forEach(function(f){if(f.hg===null)return;var h=T[f.h],a=T[f.a];if(!h||!a)return;h.p++;a.p++;h.gf+=f.hg;h.ga+=f.ag;a.gf+=f.ag;a.ga+=f.hg;
  if(f.hg>f.ag){h.w++;a.l++;h.pts+=3;h.fm.push('W');a.fm.push('L')}else if(f.hg<f.ag){a.w++;h.l++;a.pts+=3;h.fm.push('L');a.fm.push('W')}else{h.d++;a.d++;h.pts++;a.pts++;h.fm.push('D');a.fm.push('D')}});
 return Object.keys(T).map(function(k){return T[k]}).sort(function(a,b){return b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||(teamStr(b.c)-teamStr(a.c))})}
function table(lg){return tableOf(S.lg[lg],S.fx[lg])}
function posOf(c){var lg=lgOf(c);if(!S.fx[lg])return 0;var t=table(lg);for(var i=0;i<t.length;i++)if(t[i].c===c)return i+1;return 0}
var CUPR=['1/32 finału','1/16 finału','1/8 finału','Ćwierćfinał','Półfinał','Finał'];
var CUPAT={3:0,8:1,13:2,20:3,26:4,31:5};var CUPPR=[50000,80000,120000,200000,350000,600000];
/* europejskie puchary: wydarzenia przed kolejnymi kolejkami ligi */
var EUAT={0:[['Q1',1]],1:[['Q1',2]],2:[['Q2',1]],3:[['Q2',2]],4:[['Q3',1]],5:[['Q3',2]],6:[['PO',1]],7:[['PO',2]],8:[['LP',1]],10:[['LP',2]],11:[['LP',3]],13:[['LP',4]],14:[['LP',5]],16:[['LP',6]],17:[['LP',7]],18:[['LP',8]],20:[['KPO',1]],21:[['KPO',2]],23:[['R16',1]],24:[['R16',2]],26:[['QF',1]],27:[['QF',2]],29:[['SF',1]],30:[['SF',2]]};
function buildCal(){var cal=[];for(var r=0;r<34;r++){(EUAT[r]||[]).forEach(function(x){cal.push(x[0]==='LP'?{t:'EU',k:'LP',md:x[1],r:r}:{t:'EU',k:x[0],leg:x[1],r:r})});
  if(CUPAT[r]!=null)cal.push({t:'C',k:CUPAT[r],r:r});cal.push({t:'L',r:r});if(r===16)cal.push({t:'ZIMA'})}
 cal.push({t:'EU',k:'F',leg:1,r:34});cal.push({t:'PO',k:0});cal.push({t:'PO',k:1});cal.push({t:'END'});S.cal=cal;
 var i4=-1,iz=-1,iz2=-1;cal.forEach(function(e,i){if(e.t==='L'&&e.r===4&&i4<0)i4=i;if(e.t==='ZIMA')iz=i;if(e.t==='L'&&e.r===19&&iz2<0)iz2=i});
 /* letnie okno trwa do 4. kolejki ligi (z eliminacjami przed nią) */
 var w1=i4;while(w1>0&&cal[w1-1].t!=='L')w1--;S.calWin1=w1;S.calW2a=iz;S.calW2b=iz2}
function cupDraw(teams){var t=shuffle(teams);var ties=[];for(var i=0;i+1<t.length;i+=2){var a=t[i],b=t[i+1];var la=LVL[lgOf(a)],lb=LVL[lgOf(b)];var h=a,aw=b;if(lb<la||(lb===la&&Math.random()<.5)){h=b;aw=a}ties.push({h:h,a:aw,hg:null,ag:null,pens:null,w:null})}return ties}
function startCup(){var top=S.lg.E.concat(S.lg.L1,S.lg.L2);var lower=shuffle(S.lg.L3).slice(0,64-top.length);
 S.cup={k:0,ties:cupDraw(top.concat(lower)),hist:[],win:null}}
function cupNext(){var c=S.cup;var w=c.ties.map(function(t){return t.w});w.forEach(function(x){prize(x,CUPPR[c.k],'cup',x===S.me?'awans w Pucharze Kraju':'')});c.hist.push({k:c.k,ties:c.ties});c.k++;if(w.length===1){c.win=w[0];return}c.ties=cupDraw(w)}
function myCupTie(){if(!S.cup||S.cup.win)return null;var t=null;S.cup.ties.forEach(function(x,i){if(x.h===S.me||x.a===S.me)t=i});return t}
function simTie(t){var s=simQuick(t.h,t.a,false);t.hg=s[0];t.ag=s[1];if(t.hg===t.ag){var e=simQuick(t.h,t.a,true);t.hg+=Math.round(e[0]*.33);t.ag+=Math.round(e[1]*.33);if(t.hg===t.ag){var p=Math.random()<.5+(teamStr(t.h)-teamStr(t.a))/60;t.pens=p?[5,4]:[4,5]}}
 t.w=t.hg>t.ag||(t.pens&&t.pens[0]>t.pens[1])?t.h:t.a;scoreGoals(t.h,t.hg);scoreGoals(t.a,t.ag)}
function startPO(){S.po={};['L1','L2'].forEach(function(lg){var t=table(lg).map(function(r){return r.c}).filter(function(c){return !(lg==='L2'&&TEAMS[c].res)});var q=t.slice(2,6);S.po[lg]={sf:[{h:q[0],a:q[3]},{h:q[1],a:q[2]}],f:null,w:null}})}
function myPO(){if(!S.po)return null;var lg=lgOf(S.me);var p=S.po[lg];if(!p)return null;var e=S.cal[S.ev];
 if(e.k===0){for(var i=0;i<2;i++)if(p.sf[i].h===S.me||p.sf[i].a===S.me)return p.sf[i]}else if(p.f&&(p.f.h===S.me||p.f.a===S.me))return p.f;return null}

/* ---------- symulacja ---------- */
function lam(a,b,home){return clamp(1.15*Math.exp((a-b+(home?1.6:0))/17),.12,3.6)}
function simQuick(h,a,neutral){var sh=teamStr(h)+gauss()*2.2,sa=teamStr(a)+gauss()*2.2;return[poisson(lam(sh,sa,!neutral)),poisson(lam(sa,sh,false))]}
function scoreGoals(c,n){if(!n||(isF(c)&&!S.euOpen))return;var sq=squadOf(c).filter(function(p){return !p.inj&&p.pos!=='GK'});if(!sq.length)return;
 var top=sq.sort(function(a,b){return b.ovr-a.ovr}).slice(0,13);for(var i=0;i<n;i++){var p=wpick(top,function(x){return ({ST:5,LW:3,RW:3,AM:2.6,CM:1.2,DM:.5,CB:.6,LB:.4,RB:.4}[x.pos]||1)*Math.pow(x.ovr/60,4)});p.cs.g++;p.g++}
 top.slice(0,11).forEach(function(p){p.cs.a++})}
function playRound(lg,r){S.fx[lg].forEach(function(f){if(f.r!==r||f.hg!==null)return;var s=simQuick(f.h,f.a,false);f.hg=s[0];f.ag=s[1];scoreGoals(f.h,f.hg);scoreGoals(f.a,f.ag)})}
function myFixture(r){var lg=lgOf(S.me);if(!S.fx[lg])return null;for(var i=0;i<S.fx[lg].length;i++){var f=S.fx[lg][i];if(f.r===r&&(f.h===S.me||f.a===S.me))return i}return null}

/* ---------- europejskie puchary ---------- */
var EUC={CL:{n:'1. Liga Europejska',s:'1LE',md:8,ic:'⭐'},EL:{n:'2. Liga Europejska',s:'2LE',md:8,ic:'🟠'},ECL:{n:'3. Liga Europejska',s:'3LE',md:6,ic:'🟢'}};
var EUR={Q1:'I runda eliminacji',Q2:'II runda eliminacji',Q3:'III runda eliminacji',PO:'Runda play-off',LP:'Faza ligowa',KPO:'Baraż fazy pucharowej',R16:'1/8 finału',QF:'Ćwierćfinał',SF:'Półfinał',F:'Finał'};
var QNEXT={Q1:'Q2',Q2:'Q3',Q3:'PO',PO:'LP'};
var QDROP={CL:{Q2:['EL','Q3'],Q3:['EL','PO'],PO:['EL','LP']},EL:{Q1:['ECL','Q2'],Q2:['ECL','Q3'],Q3:['ECL','PO'],PO:['ECL','LP']},ECL:{}};
var QBAND={CL:{Q2:[52,82],Q3:[44,72],PO:[38,62]},EL:{Q1:[82,112],Q2:[72,106],Q3:[62,96],PO:[56,86]},ECL:{Q2:[92,122],Q3:[86,122],PO:[76,116]}};
var EUPR={CL:{q:600000,lp:7000000,w:800000,d:270000,KPO:1000000,R16:3000000,QF:4000000,SF:5000000,F:7000000,win:5000000},
 EL:{q:300000,lp:2500000,w:300000,d:100000,KPO:400000,R16:1000000,QF:1500000,SF:2000000,F:3000000,win:2500000},
 ECL:{q:200000,lp:1500000,w:150000,d:50000,KPO:200000,R16:500000,QF:800000,SF:1200000,F:1500000,win:1500000}};
function fRank(){return FCL.map(function(t){return t.c}).sort(function(a,b){return teamStr(b)-teamStr(a)})}
function euStart(){S.eu={ent:(S.euNext||[]).filter(function(x){return x&&x.c&&!isF(x.c)}).map(function(x){return{c:x.c,comp:x.comp,rd:x.rd,out:0,path:[]}}),q:{},comps:{},built:0,qopp:{}};
 S.eu.ent.forEach(function(x){if(x.c===S.me)addNews('eu','Europa: '+EUC[x.comp].n,tn(S.me)+' zaczyna od: '+EUR[x.rd]+'.')})}
function myEnt(){if(!S.eu)return null;return S.eu.ent.filter(function(x){return x.c===S.me})[0]||null}
function newTie(a,b,comp,k){return{a:a,b:b,l1:null,l2:null,pens:null,w:null,comp:comp,k:k}}
function tieAgg(t){var a=(t.l1?t.l1[0]:0)+(t.l2?t.l2[0]:0),b=(t.l1?t.l1[1]:0)+(t.l2?t.l2[1]:0);return[a,b]}
function simLeg(t,leg){var single=t.k==='F';if(leg===1){var s=single?simQuick(t.a,t.b,true):simQuick(t.a,t.b,false);t.l1=[s[0],s[1]];scoreGoals(t.a,s[0]);scoreGoals(t.b,s[1]);if(single)resolveTie(t);return}
 var s2=simQuick(t.b,t.a,false);t.l2=[s2[1],s2[0]];scoreGoals(t.b,s2[0]);scoreGoals(t.a,s2[1]);resolveTie(t)}
function resolveTie(t){var g=tieAgg(t);if(g[0]===g[1]&&!t.pens){var e=simQuick(t.k==='F'?t.a:t.b,t.k==='F'?t.b:t.a,true);var ea=Math.round((t.k==='F'?e[0]:e[1])*.33),eb=Math.round((t.k==='F'?e[1]:e[0])*.33);
  if(t.k==='F'){t.l1[0]+=ea;t.l1[1]+=eb}else{t.l2[0]+=ea;t.l2[1]+=eb}g=tieAgg(t);if(g[0]===g[1]){var p=Math.random()<.5+(teamStr(t.a)-teamStr(t.b))/60;t.pens=p?[5,4]:[3,4]}}
 t.w=g[0]>g[1]||(g[0]===g[1]&&t.pens&&t.pens[0]>t.pens[1])?t.a:t.b}
function drawOpp(comp,rd,used){var R=fRank();var b=QBAND[comp][rd]||[60,100];var c=R.slice(b[0],Math.min(R.length,b[1])).filter(function(x){return used.indexOf(x)<0});if(!c.length)c=R.slice(-20);return pick(c)}
function lpDraw(teams,n){var best=null;for(var tr=0;tr<60;tr++){var fx=[],met={},home={},ok=true;teams.forEach(function(t){home[t]=0});
  for(var md=1;md<=n&&ok;md++){var left=shuffle(teams),pairs=[];while(left.length){var a=left.shift();var j=-1;for(var k=0;k<left.length;k++){var b=left[k];if(!met[a+b]&&!(!isF(a)&&!isF(b))){j=k;break}}if(j<0){ok=false;break}var b2=left.splice(j,1)[0];met[a+b2]=met[b2+a]=1;
    var h=home[a]<=home[b2]?a:b2,aw=h===a?b2:a;home[h]++;pairs.push({md:md,h:h,a:aw,hg:null,ag:null})}fx=fx.concat(pairs)}
  if(ok){best=fx;break}}
 if(!best){best=[];for(var md2=1;md2<=n;md2++){var l=shuffle(teams);for(var i=0;i<l.length;i+=2)best.push({md:md2,h:l[i],a:l[i+1],hg:null,ag:null})}}return best}
function buildLP(){var e=S.eu;if(e.built)return;e.built=1;var R=fRank();var used={};var pl={CL:[],EL:[],ECL:[]};
 e.ent.forEach(function(x){if(!x.out&&x.rd==='LP')pl[x.comp].push(x.c)});
 var FIX={CL:16,EL:8,ECL:0},POOLN={CL:40,EL:46,ECL:200};
 ['CL','EL','ECL'].forEach(function(comp){var need=36-pl[comp].length;var f=[];var av=R.filter(function(c){return !used[c]&&(e.qlost||[]).indexOf(c)<0});
  var fixed=av.slice(0,Math.min(FIX[comp],need));var rest=shuffle(av.slice(fixed.length,fixed.length+POOLN[comp])).slice(0,need-fixed.length);if(fixed.length+rest.length<need)rest=rest.concat(av.slice(fixed.length+POOLN[comp]).slice(0,need-fixed.length-rest.length));
  fixed.concat(rest).forEach(function(c){used[c]=1;f.push(c)});
  var teams=pl[comp].concat(f);e.comps[comp]={teams:teams,fx:lpDraw(teams,EUC[comp].md),ko:{},win:null,done:0};
  pl[comp].forEach(function(c){prize(c,EUPR[comp].lp,'eu',c===S.me?'awans do fazy ligowej: '+EUC[comp].n:'');if(c!==S.me)addNews('eu',tn(c)+' w fazie ligowej',tn(c)+' gra w fazie ligowej: '+EUC[comp].n+'.')})});
 if(inCL(S.me))ach('eulp');if(['CL','EL','ECL'].some(function(q){return e.comps[q]&&e.comps[q].teams.indexOf(S.me)>=0}))unlockEU()
 var me=myEnt();if(me&&me.rd==='LP')media(tn(S.me)+' w fazie ligowej! '+EUC[me.comp].n,'Kibice już planują wyjazdy po całej Europie.','good')}
function lpTable(comp){var c=S.eu.comps[comp];return tableOf(c.teams,c.fx.map(function(f){return f}))}
function finishLP(comp){var c=S.eu.comps[comp];if(c.done)return;c.done=1;var t=lpTable(comp).map(function(r){return r.c});c.final=t;
 c.ko.KPO=[];for(var j=0;j<8;j++)c.ko.KPO.push(newTie(t[23-j],t[8+j],comp,'KPO'));c.top8=t.slice(0,8);
 t.forEach(function(x,i){if(isF(x))return;var r=i<8?'awans prosto do 1/8 finału':i<24?'baraż o 1/8 finału':'koniec przygody';addNews('eu',tn(x)+': '+(i+1)+'. miejsce w fazie ligowej',EUC[comp].n+': '+r+'.');var en=S.eu.ent.filter(function(q){return q.c===x})[0];if(en){en.lpPos=i+1;en.stage=i<8?'R16':'KPO';if(i>=24){en.out=1;en.res='faza ligowa ('+(i+1)+'. miejsce)'}}})}
function koBuild(comp,k){var c=S.eu.comps[comp];if(!c||c.ko[k])return;var prev;
 if(k==='R16'){if(!c.ko.KPO)return;var w=c.ko.KPO.map(function(t){return t.w});c.ko.R16=[];for(var i=0;i<8;i++)c.ko.R16.push(newTie(w[7-i],c.top8[i],comp,'R16'))}
 else{prev={QF:'R16',SF:'QF',F:'SF'}[k];if(!c.ko[prev])return;var w2=c.ko[prev].map(function(t){return t.w});c.ko[k]=[];for(var j=0;j+1<w2.length;j+=2){var a=w2[j],b=w2[j+1];if(Math.random()<.5){var tt=a;a=b;b=tt}c.ko[k].push(newTie(a,b,comp,k))}}}
function euPrep(e){if(!S.eu)return;var E=S.eu;
 if(e.k==='LP'){if(e.md===1)buildLP();return}
 if(QNEXT[e.k]&&e.leg===1){E.ent.forEach(function(x){if(x.out||x.rd!==e.k||E.q[x.c])return;E.qopp[e.k]=E.qopp[e.k]||[];var o=drawOpp(x.comp,x.rd,E.qopp[e.k]);E.qopp[e.k].push(o);
   var t=Math.random()<.5?newTie(x.c,o,x.comp,x.rd):newTie(o,x.c,x.comp,x.rd);E.q[x.c]=t;if(x.c===S.me)addNews('eu','Losowanie: '+EUC[x.comp].n,EUR[x.rd]+': rywalem będzie '+tn(o)+'.')});return}
 if(['KPO','R16','QF','SF','F'].indexOf(e.k)>=0&&e.leg===1){['CL','EL','ECL'].forEach(function(comp){if(e.k!=='KPO')koBuild(comp,e.k)})}}
/* wszystkie dwumecze/mecze bieżącego wydarzenia europejskiego */
function euTiesNow(e){var out=[];var E=S.eu;if(!E)return out;
 if(QNEXT[e.k]){for(var c in E.q){var t=E.q[c];if(t.k===e.k)out.push(t)}}
 else if(e.k!=='LP'){['CL','EL','ECL'].forEach(function(comp){var cc=E.comps[comp];if(cc&&cc.ko[e.k])out=out.concat(cc.ko[e.k])})}return out}
function euFinish(e){var E=S.eu;if(!E)return;
 if(e.k==='LP'){['CL','EL','ECL'].forEach(function(comp){var c=E.comps[comp];if(!c||e.md>EUC[comp].md)return;c.fx.forEach(function(f){if(f.md!==e.md||f.hg!==null)return;var s=simQuick(f.h,f.a,false);f.hg=s[0];f.ag=s[1];scoreGoals(f.h,s[0]);scoreGoals(f.a,s[1])});
   c.fx.forEach(function(f){if(f.md!==e.md||f._paid)return;f._paid=1;[f.h,f.a].forEach(function(x){if(isF(x))return;var gs=x===f.h?f.hg:f.ag,go=x===f.h?f.ag:f.hg;prize(x,gs>go?EUPR[comp].w:gs===go?EUPR[comp].d:0,'eu',x===S.me&&gs>=go?(gs>go?'zwycięstwo':'remis')+' w fazie ligowej':'')})});
   if(e.md===EUC[comp].md)finishLP(comp)});return}
 var ties=euTiesNow(e);var leg=e.leg;
 ties.forEach(function(t){if(e.k==='F'){if(!t.w)simLeg(t,1)}else if(leg===1){if(!t.l1)simLeg(t,1)}else{if(!t.l2)simLeg(t,2);else if(!t.w)resolveTie(t)}});
 if(leg===2||e.k==='F')ties.forEach(function(t){afterTie(t,e)})}
function afterTie(t,e){var E=S.eu,comp=t.comp,lose=t.w===t.a?t.b:t.a,win=t.w;
 if(QNEXT[t.k]){var x=E.ent.filter(function(q){return q.c===win||q.c===lose}).filter(function(q){return !isF(q.c)})[0];if(!x)return;delete E.q[x.c];
  if(x.c===win){E.qlost=E.qlost||[];E.qlost.push(lose);prize(win,EUPR[comp].q,'eu',win===S.me?'awans w eliminacjach':'');x.path.push(EUR[t.k]+': '+tn(lose)+' ✓');x.rd=QNEXT[t.k];if(x.c===S.me)media(tn(S.me)+' gra dalej w Europie!','Wyeliminowany '+tn(lose)+'. Następny etap: '+EUR[x.rd]+'.','good')}
  else{x.path.push(EUR[t.k]+': '+tn(win)+' ✗');var d=QDROP[comp][t.k];if(d){x.comp=d[0];x.rd=d[1];if(x.c===S.me)media('Odpadamy z '+EUC[comp].n+', ale gramy dalej','Druga szansa: '+EUC[x.comp].n+', '+EUR[x.rd]+'.','neutral')}else{x.out=1;x.res=EUR[t.k];if(x.c===S.me)media('Koniec europejskiej przygody','Lepszy okazał się '+tn(win)+'.','bad')}}
  return}
 var c=E.comps[comp];var nxt={KPO:'R16',R16:'QF',QF:'SF',SF:'F',F:null}[t.k];
 if(!isF(win)&&nxt)prize(win,EUPR[comp][nxt]||0,'eu',win===S.me?'awans: '+EUR[nxt]:'');
 [win,lose].forEach(function(q){if(isF(q))return;var x=E.ent.filter(function(z){return z.c===q})[0];if(!x)return;x.path.push(EUR[t.k]+': '+tn(q===win?lose:win)+(q===win?' ✓':' ✗'));if(q===lose){x.out=1;x.res=EUR[t.k]}else if(nxt)x.stage=nxt});
 if(t.k==='F'){c.win=win;var x2=E.ent.filter(function(z){return z.c===win})[0];if(x2){x2.res='ZWYCIĘSTWO';x2.won=1}
  addNews('eu',EUC[comp].n+' dla '+tn(win)+'!',tn(win)+' wygrywa finał z '+tn(lose)+'.');
  if(!isF(win))prize(win,EUPR[comp].win,'eu',win===S.me?'zwycięstwo w '+EUC[comp].n:'');
  if(win===S.me){ach('eu'+comp.toLowerCase());media('TRIUMF W EUROPIE! '+tn(S.me)+' wygrywa '+EUC[comp].n,'Historyczny wieczór. '+S.name+' wchodzi do legendy klubu.','good');S.trust=100;S.board=clamp(S.board+30,0,100);S.trophy={t:EUC[comp].n,c:comp}}}
 if(t.k==='SF'||t.k==='QF'||t.k==='R16'){}}
function myEuMatch(e){var E=S.eu;if(!E)return null;var me=S.me;
 if(e.k==='LP'){var x=myEnt();if(!x||x.out||x.rd!=='LP')return null;var c=E.comps[x.comp];if(!c||e.md>EUC[x.comp].md)return null;
  var f=null,fi=-1;c.fx.forEach(function(q,i){if(q.md===e.md&&(q.h===me||q.a===me)){f=q;fi=i}});if(!f||f.hg!==null)return null;
  return{kind:'EU',comp:x.comp,k:'LP',md:e.md,fi:fi,opp:f.h===me?f.a:f.h,home:f.h===me,stage:EUC[x.comp].n+' · faza ligowa · '+e.md+'. kolejka',cmp:EUC[x.comp].n}}
 var ties=euTiesNow(e);var t=null,ti=-1;ties.forEach(function(q,i){if(q.a===me||q.b===me){t=q;ti=i}});if(!t||t.w)return null;
 var leg=e.k==='F'?1:e.leg;if(leg===1&&t.l1)return null;if(leg===2&&(t.l2||!t.l1))return null;
 var opp=t.a===me?t.b:t.a;var home=e.k==='F'?false:(leg===1?t.a===me:t.b===me);var agg=null;if(leg===2){agg=t.a===me?[t.l1[0],t.l1[1]]:[t.l1[1],t.l1[0]]}
 return{kind:'EU',comp:t.comp,k:t.k,leg:leg,opp:opp,home:home,neutral:e.k==='F',ko:e.k==='F'||leg===2,agg:agg,stage:EUC[t.comp].n+' · '+EUR[t.k]+(e.k==='F'?'':' · '+leg+'. mecz'),cmp:EUC[t.comp].n}}
function recordEU(spec,gP,gO,pens){var E=S.eu,me=S.me;
 if(spec.k==='LP'){var f=E.comps[spec.comp].fx[spec.fi];if(f.h===me){f.hg=gP;f.ag=gO}else{f.hg=gO;f.ag=gP}scoreGoals(spec.opp,gO);return}
 var e={k:spec.k,leg:spec.leg};var t=euTiesNow(e).filter(function(q){return q.a===me||q.b===me})[0];if(!t)return;
 var mA=t.a===me;if(spec.leg===1||spec.k==='F'){t.l1=mA?[gP,gO]:[gO,gP]}else{t.l2=mA?[gP,gO]:[gO,gP]}
 if(spec.k==='F'||spec.leg===2){if(pens)t.pens=mA?[pens[0],pens[1]]:[pens[1],pens[0]];resolveMine(t)}scoreGoals(spec.opp,gO)}
function resolveMine(t){var g=tieAgg(t);if(g[0]!==g[1]){t.w=g[0]>g[1]?t.a:t.b}else if(t.pens){t.w=t.pens[0]>t.pens[1]?t.a:t.b}else resolveTie(t)}
function euStatus(c){var x=S.eu&&S.eu.ent.filter(function(q){return q.c===c})[0];if(!x)return null;return{comp:EUC[x.comp].n,cc:x.comp,rd:x.won?'Zwycięzca':x.out?'Odpadł: '+(x.res||''):EUR[x.stage||x.rd]||x.rd,out:x.out,won:x.won,path:x.path,lpPos:x.lpPos}}
function euNextFromTable(tE){var champ=tE[0],cupW=S.cup&&S.cup.win;var list=[{c:champ,comp:'CL',rd:'Q2'}];var used=[champ];
 var elw=cupW&&used.indexOf(cupW)<0&&!TEAMS[cupW].res?cupW:tE[1];list.push({c:elw,comp:'EL',rd:'Q1'});used.push(elw);
 tE.forEach(function(c){if(list.length<4&&used.indexOf(c)<0){list.push({c:c,comp:'ECL',rd:'Q2'});used.push(c)}});return list}

/* ---------- młodzież ---------- */
var YBASE=[39,42,45,49];
function genYouth(club,n,a0,a1){var lv=LVL[lgOf(club)]||0;var out=[];for(var i=0;i<n;i++){var a=ri(a0,a1);var pot=Math.round(clamp([56,60,64,68][lv]+gauss()*5.5+(inCL(club)?2:0),48,90));
  var ovr=Math.round(clamp(pot-(19-a)*4-ri(10,16),34,66));out.push(mkPlayer({n:genName(),pos:pick(['GK','CB','CB','LB','RB','DM','CM','CM','AM','LW','RW','ST','ST']),by:S.y-a,cl:'Y'+club,ovr:ovr,pot:pot,yt:1}))}
 if(!myYouth().some(function(p){return p.pos==='GK'})&&club===S.me)mkPlayer({n:genName(),pos:'GK',by:S.y-17,cl:'Y'+club,ovr:44,pot:62,yt:1});return out}
function youthStr(c){if(c===S.me)return poolStr(myYouth());return (S.ys&&S.ys[c])||YBASE[LVL[lgOf(c)]||0]}
function buildYouthLeague(mid){var lg=lgOf(S.me);if(lg==='L3'||!S.lg[lg])return;var teams=S.lg[lg].slice();S.ys=S.ys||{};
 teams.forEach(function(c){if(c!==S.me)S.ys[c]=YBASE[LVL[lg]]+gauss()*2.2+(teamStr(c)-teamStr(teams[0]))*.15});
 S.yl={lg:lg,teams:teams,fx:rrFixtures(teams)};
 if(mid){var e=S.cal[S.ev];var r=e&&e.r!=null?e.r:0;for(var k=0;k<r;k++)playYouth(k)}}
function playYouth(r){var y=S.yl;if(!y)return;y.fx.forEach(function(f){if(f.r!==r||f.hg!==null)return;var sh=youthStr(f.h)+gauss()*2.5,sa=youthStr(f.a)+gauss()*2.5;f.hg=poisson(lam(sh,sa,true));f.ag=poisson(lam(sa,sh,false));
  if(f.h===S.me||f.a===S.me){var my=f.h===S.me?f.hg:f.ag;var yp=myYouth().filter(function(p){return !p.inj}).sort(function(a,b){return b.ovr-a.ovr});var xi=yp.slice(0,11);xi.forEach(function(p){p.cs.a++});var sh2=xi.filter(function(p){return p.pos!=='GK'});
   for(var i=0;i<my&&sh2.length;i++){var p=wpick(sh2,function(x){return ({ST:5,LW:3,RW:3,AM:2.6,CM:1.2}[x.pos]||.5)});p.cs.g++}
   y.last={h:f.h,a:f.a,hg:f.hg,ag:f.ag,r:r}}});
 myYouth().forEach(function(p){if(p.ovr<p.pot&&Math.random()<(p.cs.a>0?.07:.04))p.ovr++})}
function ytable(){var y=S.yl;if(!y)return[];return tableOf(y.teams,y.fx)}
function promoteYouth(id){var p=P(id);if(mySquad().length>=32)return{ok:0,msg:'Kadra seniorów jest pełna (32).'};p.cl=S.me;p.nw=S.stats.p;p.mood=70;p.cs={a:0,g:0,r:0,n:0};RK=null;addNews('youth','Awans z akademii: '+p.n,p.n+' ('+age(p)+' l.) dołącza do pierwszej drużyny.');save();return{ok:1,msg:'⬆ '+p.n+' w pierwszej drużynie'}}
function demoteYouth(id){var p=P(id);if(age(p)>19)return{ok:0,msg:'Do juniorów można przesunąć tylko zawodnika do 19 lat.'};if(mySquad().length<=16)return{ok:0,msg:'Za mała kadra seniorów.'};p.cl='Y'+S.me;RK=null;if(S.xi)S.xi=null;save();return{ok:1,msg:'⬇ '+p.n+' gra w juniorach'}}
function releaseYouth(id){var p=P(id);p.ret=1;save();return{ok:1,msg:p.n+' opuszcza akademię'}}

/* następny mecz użytkownika w bieżącym wydarzeniu (albo null) */
function nextMatch(){var e=S.cal[S.ev];if(!e)return null;
 if(e.t==='L'){var i=myFixture(e.r);if(i==null)return null;var f=S.fx[lgOf(S.me)][i];if(f.hg!==null)return null;return{kind:'L',opp:f.h===S.me?f.a:f.h,home:f.h===S.me,fi:i,stage:LG[lgOf(S.me)]+' · '+(e.r+1)+'. kolejka',comp:LG[lgOf(S.me)]}}
 if(e.t==='C'){var t=myCupTie();if(t==null)return null;var x=S.cup.ties[t];if(x.w)return null;return{kind:'C',opp:x.h===S.me?x.a:x.h,home:x.h===S.me,ti:t,ko:1,neutral:S.cup.k===5,stage:'Puchar Kraju · '+CUPR[S.cup.k],comp:'Puchar Kraju'}}
 if(e.t==='PO'){var p=myPO();if(!p||p.w)return null;return{kind:'PO',opp:p.h===S.me?p.a:p.h,home:p.h===S.me,ko:1,stage:'Baraż o awans · '+(e.k===0?'półfinał':'finał'),comp:'Baraże',po:p}}
 if(e.t==='EU')return myEuMatch(e);
 return null}
function evMonth(e){if(!e)return 7;if(e.t==='ZIMA')return 1;if(e.t==='END'||e.t==='PO')return 6;var r=e.r;if(r==null&&e.t==='C')return [8,9,10,3,4,5][e.k];if(r==null)return 6;if(r>=34)return 5;return r<2?7:r<6?8:r<10?9:r<13?10:r<16?11:r===16?12:r<20?2:r<24?3:r<28?4:5}
function evLabel(e){if(!e)return '';if(e.t==='L')return (e.r+1)+'. kolejka';if(e.t==='C')return 'Puchar · '+CUPR[e.k];if(e.t==='ZIMA')return 'Przerwa zimowa';if(e.t==='PO')return 'Baraże';if(e.t==='EU')return 'Europa · '+EUR[e.k];return 'Koniec sezonu'}
function setDate(){var e=S.cal[S.ev];S.m=evMonth(e);S.y=S.m>=7?S.season:S.season+1}

/* wynik meczu użytkownika zapisany w rozgrywkach */
function recordMine(spec,gP,gO,pens){
 if(spec.kind==='L'){var f=S.fx[lgOf(S.me)][spec.fi];if(f.h===S.me){f.hg=gP;f.ag=gO}else{f.hg=gO;f.ag=gP}scoreGoals(spec.opp,gO)}
 else if(spec.kind==='C'){var t=S.cup.ties[spec.ti];if(t.h===S.me){t.hg=gP;t.ag=gO;if(pens)t.pens=[pens[0],pens[1]]}else{t.hg=gO;t.ag=gP;if(pens)t.pens=[pens[1],pens[0]]}
  var meW=gP>gO||(pens&&pens[0]>pens[1]);t.w=meW?S.me:spec.opp;scoreGoals(spec.opp,gO)}
 else if(spec.kind==='PO'){var p=spec.po;var real=findPO(p);if(real.h===S.me){real.hg=gP;real.ag=gO}else{real.hg=gO;real.ag=gP}var w2=gP>gO||(pens&&pens[0]>pens[1]);real.w=w2?S.me:spec.opp}
 else if(spec.kind==='EU')recordEU(spec,gP,gO,pens)}
function findPO(p){var lg=lgOf(S.me),o=S.po[lg];if(o.f&&o.f.h===p.h&&o.f.a===p.a)return o.f;for(var i=0;i<2;i++)if(o.sf[i].h===p.h&&o.sf[i].a===p.a)return o.sf[i];return p}
/* statystyki sezonu użytkownika */
function newSS(){return{w:0,d:0,l:0,gf:0,ga:0,big:null,bud0:bud(S.me),prize:{},trIn:0,trOut:0,club:S.me}}
function statMatch(M){var s=S.ss;if(!s)return;if(M.res==='W')s.w++;else if(M.res==='L')s.l++;else s.d++;s.gf+=M.gP;s.ga+=M.gO;
 if(M.gP>M.gO&&(!s.big||M.gP-M.gO>s.big.d))s.big={d:M.gP-M.gO,t:M.gP+':'+M.gO+' z '+tn(M.opp)}}

/* zakończ bieżące wydarzenie: symuluj resztę świata i przejdź dalej */
function finishEvent(depth){var e=S.cal[S.ev];if(!e)return;
 if(e.t==='L'){['E','L1','L2'].forEach(function(lg){playRound(lg,e.r)});playYouth(e.r);tick(1);aiOffers();boardTick(e.r);
  if(e.r===33)endLeagues()}
 else if(e.t==='C'){S.cup.ties.forEach(function(t){if(!t.w)simTie(t)});var mine=S.cup.ties.filter(function(t){return t.h===S.me||t.a===S.me})[0];
  var k=S.cup.k;cupNext();if(S.cup.win){addNews('cup','Puchar Kraju dla '+tn(S.cup.win)+'!',tn(S.cup.win)+' wygrywa finał.');if(S.cup.win===S.me){ach('cup');media('PUCHAR KRAJU JEST NASZ!','Kibice '+tn(S.me)+' świętują do rana. '+S.name+' noszony na rękach.','good');S.trust=clamp(S.trust+15,0,100);S.board=clamp(S.board+15,0,100);S.trophy={t:'Puchar Kraju',c:'CUP'}}}
  else if(mine&&mine.w===S.me&&k>=3)media(tn(S.me)+' w '+(CUPR[k+1]||'finale').toLowerCase()+' Pucharu Kraju!','Pucharowa przygoda trwa.','good')}
 else if(e.t==='ZIMA'){aiWindow(false);aiOffers();addNews('win','Zimowe okno transferowe otwarte','Masz czas do 20. kolejki. Kluby AI też robią zakupy.')}
 else if(e.t==='EU'){euFinish(e)}
 else if(e.t==='PO'){['L1','L2'].forEach(function(lg){var o=S.po[lg];if(e.k===0){o.sf.forEach(function(t){if(!t.w)simTie(t)});o.f={h:o.sf[0].w,a:o.sf[1].w,hg:null,ag:null};var h0=posOf(o.f.h),a0=posOf(o.f.a);if(a0<h0){var tt=o.f.h;o.f.h=o.f.a;o.f.a=tt}}
   else{if(!o.f.w)simTie(o.f);o.w=o.f.w;addNews('po','Baraże: '+tn(o.w)+' awansuje!',tn(o.w)+' wygrywa finał baraży '+LG[lg]+'.')}})}
 S.ev++;var n=S.cal[S.ev];
 if(S.ev===S.calWin1)addNews('win','Letnie okno zamknięte','Do przerwy zimowej nie da się kupować ani sprzedawać.');
 if(S.ev===S.calW2b){S.offers=[];addNews('win','Zimowe okno zamknięte','Kolejne transfery dopiero latem.')}
 if(n&&n.t==='PO'&&n.k===0)startPO();
 if(n&&n.t==='EU')euPrep(n);
 setDate();if(!winOpen())S.offers=[];refreshStr();
 /* wydarzenia bez meczu użytkownika rozgrywają się same */
 if(n&&(n.t==='C'||n.t==='EU'||n.t==='PO')&&!nextMatch()&&(depth||0)<40){return finishEvent((depth||0)+1)}
 save()}
function playRestNow(){var e=S.cal[S.ev];if(!e)return;if(e.t==='L'){['E','L1','L2'].forEach(function(lg){playRound(lg,e.r)})}
 else if(e.t==='EU'&&e.k==='LP'&&S.eu){['CL','EL','ECL'].forEach(function(comp){var c=S.eu.comps[comp];if(!c)return;c.fx.forEach(function(f){if(f.md!==e.md||f.hg!==null)return;var s=simQuick(f.h,f.a,false);f.hg=s[0];f.ag=s[1];scoreGoals(f.h,s[0]);scoreGoals(f.a,s[1])})})}}
function tick(w){plist().forEach(function(p){if(isF(p.cl)&&!S.euOpen)return;if(p.inj>0){p.inj=Math.max(0,p.inj-w)}
 p.form=clamp(Math.round(p.form*.5+gauss()*1.1),-3,3);
 if(!p.inj&&Math.random()<.011*w){p.inj=ri(1,6);if(p.cl===S.me)addNews('inj','Kontuzja: '+p.n,'Przerwa ok. '+p.inj+' '+(p.inj===1?'kolejkę':p.inj<5?'kolejki':'kolejek')+'.')}
 if(p.cl===S.me&&S.xi&&!S.xi.some(function(e){return e.id===p.id})&&rankIn(p)<=13)p.mood=clamp(p.mood-1,20,100)})}

/* ---------- zarząd: cel i ocena ---------- */
function setGoal(){var lg=lgOf(S.me);var ranks=S.lg[lg].slice().sort(function(a,b){return teamStr(b)-teamStr(a)});var r=ranks.indexOf(S.me)+1;var g;
 if(lg==='E'){g=r<=2?{pos:3,text:'Walka o mistrzostwo (podium)'}:r<=6?{pos:6,text:'Miejsce w czołowej szóstce'}:r<=11?{pos:10,text:'Górna połowa tabeli'}:{pos:15,text:'Utrzymanie w Superklasie'}}
 else{g=r<=3?{pos:2,text:'Awans! (top 2)'}:r<=7?{pos:6,text:'Miejsce barażowe (top 6)'}:r<=12?{pos:10,text:'Górna połowa tabeli'}:{pos:15,text:'Utrzymanie w '+LG[lg]}}
 g.rank=r;S.goal=g;return g}
function boardTick(r){var pos=posOf(S.me),g=S.goal;if(!g||r<4||r%3)return;var d=pos-g.pos;
 var delta=d<=-3?2:d<=0?1:d<=3?0:d<=6?-2:-3;S.board=clamp(S.board+delta,0,100);
 if(S.board<=10&&r>=11&&!S.fired){S.fired='Zarząd stracił cierpliwość po '+(r+1)+' kolejkach ('+pos+'. miejsce).';}}

/* ---------- koniec sezonu ---------- */
function endLeagues(){var champ=table('E')[0].c;addNews('champ','Mistrz Superklasy: '+tn(champ),tn(champ)+' zdobywa mistrzostwo kraju!');
 if(champ===S.me){ach('champ');media('MISTRZOWIE! '+tn(S.me)+' z tytułem','Trener '+S.name+' przechodzi do historii klubu.','good')}}
function lgPrize(lg,pos){return lg==='E'?1000000+(18-pos)*200000:lg==='L1'?300000+(18-pos)*40000:lg==='L2'?120000+(18-pos)*12000:0}
function endSeason(){var me=S.me,lg=lgOf(me),pos=posOf(me);var res={pos:pos,lg:lg,promo:null,rel:null};
 var tE=table('E').map(function(r){return r.c}),t1=table('L1').map(function(r){return r.c}),t2=table('L2').map(function(r){return r.c});
 var myRow=table(lg).filter(function(r){return r.c===me})[0]||{pts:0,w:0,d:0,l:0,gf:0,ga:0};res.row=myRow;
 /* nagrody za miejsce w lidze dla wszystkich klubów */
 [['E',tE],['L1',t1],['L2',t2]].forEach(function(x){x[1].forEach(function(c,i){prize(c,lgPrize(x[0],i+1),'lg','')})});
 res.lgPrize=lgPrize(lg,pos);
 var downE=tE.slice(15),up1=t1.slice(0,2).concat(S.po.L1.w?[S.po.L1.w]:[]),down1=t1.slice(15);
 var t2ok=t2.filter(function(c){return !TEAMS[c].res});var up2=t2ok.slice(0,2).concat(S.po.L2.w?[S.po.L2.w]:[]),down2=t2.slice(15);
 var l3=S.lg.L3.slice().sort(function(a,b){return teamStr(b)-teamStr(a)});var up3=shuffle(l3.slice(0,7)).slice(0,down2.length);
 res.champ=tE[0];res.cup=S.cup&&S.cup.win;
 S.euNext=euNextFromTable(tE);res.euNext=S.euNext.filter(function(x){return x.c===me})[0]||null;
 if(res.euNext&&!S.euOpen){unlockEU();S.euNew=0;res.euUnlock=1}
 var es=euStatus(me);res.eu=es;
 S.lg.E=tE.filter(function(c){return downE.indexOf(c)<0}).concat(up1);
 S.lg.L1=t1.filter(function(c){return up1.indexOf(c)<0&&down1.indexOf(c)<0}).concat(downE,up2);
 S.lg.L2=t2.filter(function(c){return up2.indexOf(c)<0&&down2.indexOf(c)<0}).concat(down1,up3);
 S.lg.L3=S.lg.L3.filter(function(c){return up3.indexOf(c)<0}).concat(down2);
 up1.forEach(function(c){prize(c,5000000,'other','premia za awans do Superklasy')});up2.forEach(function(c){prize(c,1500000,'other','premia za awans do 1 ligi')});
 res.upE=up1;res.downE=downE;res.up2=up2;res.down1=down1;res.down2=down2;res.up3=up3;
 if(up1.indexOf(me)>=0||up2.indexOf(me)>=0){res.promo=1;ach('promo');S.board=clamp(S.board+30,0,100);S.trust=clamp(S.trust+20,0,100)}
 if(downE.indexOf(me)>=0||down1.indexOf(me)>=0||down2.indexOf(me)>=0){res.rel=1;S.board=clamp(S.board-35,0,100);S.trust=clamp(S.trust-20,0,100)}
 var g=S.goal;var ok=pos<=g.pos||res.promo;res.goalOk=ok;res.goal=g.text;
 if(!res.promo&&!res.rel)S.board=clamp(S.board+(ok?15:-(pos-g.pos)*5),0,100);
 if(down2.indexOf(me)>=0)S.fired='Spadek do 3 ligi. Klub znika z ligowej mapy, a zarząd szuka nowego trenera.';
 else if(res.rel&&S.board<45)S.fired='Spadek z ligi. Zarząd dziękuje za współpracę.';
 else if(S.board<20)S.fired='Cel sezonu nie został osiągnięty ('+pos+'. miejsce). Zarząd szuka nowego trenera.';
 /* statystyki i gwiazdy sezonu */
 var sq=mySquad();var ts=sq.slice().sort(function(a,b){return b.cs.g-a.cs.g})[0];res.top=ts&&ts.cs.g?{n:ts.n,g:ts.cs.g,id:ts.id}:null;
 var br=sq.filter(function(p){return (p.cs.n||0)>=6}).sort(function(a,b){return b.cs.r/b.cs.n-a.cs.r/a.cs.n})[0];res.best=br?{n:br.n,r:Math.round(br.cs.r/br.cs.n*10)/10,id:br.id}:null;
 var yg=sq.filter(function(p){return age(p)<=21&&p.cs.a>=3}).sort(function(a,b){return (b.cs.n?b.cs.r/b.cs.n:6)-(a.cs.n?a.cs.r/a.cs.n:6)})[0];res.young=yg?{n:yg.n,a:age(yg),ap:yg.cs.a,id:yg.id}:null;
 res.ss=S.ss;res.budEnd=bud(me);
 res.trophies=[];if(res.champ===me)res.trophies.push({t:'Mistrzostwo Superklasy',c:'LG'});if(res.cup===me)res.trophies.push({t:'Puchar Kraju',c:'CUP'});
 if(es&&es.won)res.trophies.push({t:es.comp,c:es.cc});if(res.promo)res.trophies.push({t:lg==='L1'?'Awans do Superklasy':'Awans do 1 ligi',c:'UP'});
 S.seasons.push({y:S.season,c:me,lg:lg,pos:pos,promo:res.promo,rel:res.rel,cup:res.cup===me,champ:res.champ===me,eu:es?es.comp+': '+es.rd:null,euw:es&&es.won?es.cc:null});
 if(S.seasons.length>=5)ach('s5');
 if(!S.fired&&(res.promo||(ok&&S.board>=70)))res.offers=jobOffers('good');
 if(S.fired)res.offers=jobOffers('fired');
 S.lastEnd=res;return res}
function jobOffers(kind){var me=S.me,ml=LVL[lgOf(me)],c=[];
 CLUBS.forEach(function(t){if(t.c===me||t.res)return;var l=LVL[lgOf(t.c)];if(l===0)return;
  if(kind==='good'){if(l===ml+1||(l===ml&&teamStr(t.c)>teamStr(me)+1))c.push(t.c)}else{if(l===ml-1||(l===ml&&teamStr(t.c)<teamStr(me))||(ml===1&&l===1))c.push(t.c)}});
 c=shuffle(c).slice(0,kind==='good'?2:3);if(kind==='fired'&&!c.length)c=shuffle(S.lg.L2.filter(function(x){return x!==me&&!TEAMS[x].res})).slice(0,2);return c}
function takeJob(c){var old=S.me;myYouth().forEach(function(p){p.ret=1});S.me=c;S.clubs.push(c);S.xi=null;S.offers=[];S.board=60;S.trust=55;S.morale=60;S.streak={w:0,u:0,l:0,nl:0};S.fired=null;
 genYouth(c,18,15,18);
 addNews('job','Nowa praca: '+tn(c),S.name+' zostaje trenerem '+tn(c)+'. Budżet transferowy: '+money(bud(c))+'.');media(S.name+' przejmuje '+tn(c),'Kibice '+tn(old)+' żegnają trenera.','neutral');
 var e=S.cal&&S.cal[S.ev];if(e&&e.t!=='END'){setGoal();buildYouthLeague(true);if(S.ss){S.ss=newSS()}}save()}
function newSeason(){
 S.season++;S.y=S.season;var retd=[];
 plist().forEach(function(p){var ag=age(p);
  var g;if(ag<=20)g=ri(1,5)*(p.pot-p.ovr)/12+rnd(0,1.5);else if(ag<=23)g=ri(0,3)*(p.pot-p.ovr)/10+rnd(-.5,1);else if(ag<=28)g=rnd(-1,1.5)*(p.pot>p.ovr?1:.5);else if(ag<=31)g=rnd(-1.9,.4);else if(ag<=34)g=rnd(-3,-.5);else g=rnd(-4.5,-1.5);
  if(p.cl===S.me&&p.cs.a>=15&&ag<=23)g+=.8;
  p.ovr=clamp(Math.round(p.ovr+g),36,94);if(p.ovr>p.pot)p.pot=p.ovr;p.cs={a:0,g:0,r:0,n:0};p.lock=0;p.inj=0;
  var rp=ag>=38?.8:ag>=36?.5:ag>=34?.22:ag>=33?.08:0;if(p.ovr<50&&ag>=30)rp+=.3;if(isY(p.cl))rp=0;
  if(Math.random()<rp){p.ret=1;if(p.cl===S.me)retd.push(p)}});
 if(retd.length)addNews('ret','Koniec kariery','Karierę kończą: '+retd.map(function(p){return p.n}).join(', ')+'.');
 /* juniorzy użytkownika: 19-latkowie przechodzą do seniorów albo odchodzą */
 var up=[],gone=[];myYouth().filter(function(p){return age(p)>=19}).sort(function(a,b){return b.ovr-a.ovr}).forEach(function(p){if(mySquad().length<30&&p.ovr>=46){p.cl=S.me;up.push(p)}else{p.ret=1;gone.push(p)}});
 if(up.length)addNews('youth','Z akademii do seniorów','Do pierwszej drużyny przechodzą: '+up.map(function(p){return p.n+' ('+p.ovr+')'}).join(', ')+'.');
 if(gone.length)addNews('youth','Pożegnania w akademii','Odchodzą: '+gone.map(function(p){return p.n}).join(', ')+'.');
 for(var id in S.pl)if(S.pl[id].ret)delete S.pl[id];
 var intake=genYouth(S.me,ri(4,6),15,16).sort(function(a,b){return b.pot-a.pot});
 addNews('youth','Nabór do akademii','Nowi juniorzy: '+intake.map(function(p){return p.n+' ('+age(p)+' l., potencjał '+p.pot+')'}).join(', ')+'.');
 if(intake[0]&&intake[0].pot>=80){media('Nowa perełka w akademii '+tn(S.me)+': '+intake[0].n,'Ma '+age(intake[0])+' lat i już porównują go do najlepszych.','hype');unlockSong('pasja')}
 /* kluby AI: juniorzy prosto do kadr */
 CLUBS.forEach(function(t){if(t.c===S.me)return;var lv=LVL[lgOf(t.c)];var n=ri(1,2);for(var i=0;i<n;i++){var a=ri(16,18);var pot=Math.round(clamp([56,60,64,68][lv]+gauss()*5,50,88));
  mkPlayer({n:genName(),pos:pick(['GK','CB','CB','LB','RB','DM','CM','CM','AM','LW','RW','ST','ST']),by:S.y-a,cl:t.c,ovr:clamp(pot-ri(10,18),40,70),pot:pot,yt:1})}});
 FCL.forEach(function(t){S.fs[t.c]=clamp(Math.round((S.fs[t.c]+gauss()*2+(t.s0-S.fs[t.c])*.2)*10)/10,50,90);if(S.euOpen){var sq=squadOf(t.c);if(sq.length>28)sq.sort(function(a,b){return a.ovr-b.ovr}).slice(0,sq.length-28).forEach(function(p){p.ret=1});
   var n2=ri(2,3);for(var k=0;k<n2;k++){var a2=ri(17,19);var pot2=Math.round(clamp(S.fs[t.c]+gauss()*5,55,94));mkPlayer({n:genFName(t.np),pos:pick(['GK','CB','LB','RB','DM','CM','AM','LW','RW','ST']),by:S.y-a2,cl:t.c,ovr:clamp(pot2-ri(8,15),45,80),pot:pot2})}}});
 CLUBS.forEach(function(t){fillSquad(t.c)});if(S.euOpen)FCL.forEach(function(t){fillSquad(t.c)});
 startSeason(false)}
function startSeason(first){S.fx={E:rrFixtures(S.lg.E),L1:rrFixtures(S.lg.L1),L2:rrFixtures(S.lg.L2)};buildCal();S.ev=0;startCup();S.po=null;setDate();refreshStr();
 if(!first)aiWindow(true);refreshStr();setGoal();S.offers=[];S.trophy=null;S.euWinEnd=0;
 S.ss=newSS();euStart();buildYouthLeague(false);
 if(!first){addNews('season','Sezon '+S.season+'/'+((S.season+1)%100)+' startuje',tn(S.me)+' gra w '+LG[lgOf(S.me)]+'. Cel zarządu: '+S.goal.text+'. Letnie okno transferowe otwarte do 4. kolejki.')}
 else addNews('win','Letnie okno transferowe otwarte','Kupuj i sprzedawaj do 4. kolejki. Budżet: '+money(bud(S.me))+'.');
 var e0=S.cal[0];if(e0&&e0.t==='EU')euPrep(e0);
 if(e0&&e0.t==='EU'&&!nextMatch())finishEvent(1)}

/* ---------- osiągnięcia ---------- */
var ACH=[
 ['first','Pierwsze zwycięstwo','Wygraj pierwszy mecz'],['rout','Pogrom','Wygraj różnicą 5 goli'],['unb10','Twierdza','10 meczów bez porażki z rzędu'],
 ['giant','Pogromca faworytów','Pokonaj drużynę silniejszą o 6 punktów'],['hat','Hat-trick','Twój piłkarz strzela 3 gole w meczu'],['kid','Odwaga','Wystaw w meczu 17-latka'],
 ['promo','Awans!','Awansuj do wyższej ligi'],['champ','Mistrz Superklasy','Zdobądź mistrzostwo kraju'],['cup','Puchar Kraju','Wygraj Puchar Kraju'],
 ['eulp','Elita Europy','Zagraj w fazie ligowej 1. Ligi Europejskiej'],['eustar','Gwiazda z Europy','Kup zawodnika z europejskiego klubu'],
 ['euecl','3. Liga Europejska','Wygraj 3. Ligę Europejską'],['euel','2. Liga Europejska','Wygraj 2. Ligę Europejską'],['eucl','Król Europy','Wygraj 1. Ligę Europejską'],
 ['sell3','Złoty interes','Sprzedaj zawodnika za 3 mln zł'],['steal','Kradzież stulecia','Ściągnij zawodnika z ligi o dwa poziomy wyżej'],
 ['l5','Skóra słonia','Przetrwaj 5 porażek z rzędu'],['s5','Weteran ławki','Rozegraj 5 sezonów']];
function ach(id){if(S.ach[id])return;S.ach[id]={y:S.y};var a=ACH.filter(function(x){return x[0]===id})[0];if(a){S.newAch=S.newAch||[];S.newAch.push(a[1])}}
function unlockSong(k){if(S.songs[k])return;S.songs[k]=1;S.newSong=k}
var NPOS={BR:[1,12,22,33],OBR:[2,3,4,5,15,18,25,26,24,44],POM:[8,6,7,10,16,17,20,14,22,21],NAP:[9,11,19,23,7,18,99]};
function shirtNo(id){if(!S)return 1;S.nums=S.nums||{};var sq=mySquad().map(function(p){return p.id});var taken={};sq.forEach(function(o){if(o!==id&&S.nums[o])taken[S.nums[o]]=1});
 var n=S.nums[id];if(n&&!taken[n])return n;var p=P(id);if(!p)return 99;
 var cand=(NPOS[POSG[p.pos]]||[]).slice();for(var k=2;k<100;k++)cand.push(k);
 for(var i=0;i<cand.length;i++){if(!taken[cand[i]]&&!(cand[i]===1&&p.pos!=='GK')){S.nums[id]=cand[i];return cand[i]}}return 99}

/* ---------- eksport ---------- */
window.SS={S:function(){return S},newGame:newGame,P:P,plist:plist,age:age,autoXI:autoXI,eff:eff,teamStr:teamStr,myStr:myStr,clubStr:clubStr,
 table:table,tableOf:tableOf,posOf:posOf,lam:lam,simQuick:simQuick,addNews:addNews,media:media,ach:ach,unlockSong:unlockSong,
 rnd:rnd,ri:ri,pick:pick,clamp:clamp,shuffle:shuffle,gauss:gauss,poisson:poisson,esc:esc,wpick:wpick,sur:sur,money:money,MONTHS:MONTHS,TEAMS:TEAMS,CLUBS:CLUBS,FCL:FCL,FORM:FORM,fit:fit,LINE:LINE,
 POSG:POSG,POSN:POSN,SONGS:SONGS,ACH:ACH,LG:LG,LVL:LVL,CUPR:CUPR,EUC:EUC,EUR:EUR,save:save,load:load,tn:tn,lgOf:lgOf,bud:bud,squadOf:squadOf,mySquad:mySquad,myYouth:myYouth,isF:isF,isY:isY,
 value:value,askPrice:askPrice,willing:willing,winOpen:winOpen,euWin:euWin,canBuy:canBuy,winName:winName,winId:winId,tryBuy:tryBuy,sellTo:sellTo,quickSale:quickSale,rankIn:rankIn,
 nextMatch:nextMatch,recordMine:recordMine,finishEvent:finishEvent,evLabel:evLabel,endSeason:endSeason,newSeason:newSeason,takeJob:takeJob,setGoal:setGoal,refreshStr:refreshStr,
 statMatch:statMatch,playRestNow:playRestNow,euStatus:euStatus,lpTable:lpTable,euTiesNow:euTiesNow,inCL:inCL,ytable:ytable,youthStr:youthStr,promoteYouth:promoteYouth,demoteYouth:demoteYouth,releaseYouth:releaseYouth,tieAgg:tieAgg,
 setS:function(s){S=s;if(S){if(S.v!==2)migrate(S);if(S.season===2026&&!S.eu1fix){S.eu1fix=1;if(S.eu&&S.eu.ent&&S.eu.ent.length){S.eu={ent:[],q:{},comps:{},built:0,qopp:{}};if(S.cur&&S.cur.kind==='EU'){S.cur=null;S.phase='hub'}}}refreshStr();if(!S.euOpen&&S.eu&&S.eu.ent&&S.eu.ent.some(function(x){return x.c===S.me}))unlockEU()}},shirtNo:shirtNo,root:root,DEBUG:DEBUG,KEY:KEY};
})();
