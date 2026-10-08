/* Menedżer klubu: silnik meczu (z Symulatora selekcjonera), wyniki, media, konferencje */
(function(){
'use strict';
var X=window.SS;if(!X)return;
var rnd=X.rnd,ri=X.ri,pick=X.pick,clamp=X.clamp,gauss=X.gauss,poisson=X.poisson,sur=X.sur,P=X.P,T=X.TEAMS;
function S(){return X.S()}
function tn(c){return T[c]?T[c].n:c}

/* ---------- siła składu ---------- */
function lineRatings(xi,tac){var s=S(),L={G:[],D:[],M:[],A:[]};
 xi.forEach(function(e){var p=P(e.id);var v=X.eff(p,e.slot)+(e.tired?-2:0);var ln=X.LINE[e.slot];if(ln==='DM'){L.D.push(v);L.M.push(v)}else L[ln].push(v)});
 function av(a){return a.length?a.reduce(function(x,y){return x+y},0)/a.length:45}
 var G=av(L.G),D=av(L.D),M=av(L.M),A=av(L.A);
 var att=.5*A+.4*M+.1*D,def=.45*D+.3*M+.25*G;
 var pr=(tac.press-50)/50,te=(tac.tempo-50)/50,me=(tac.ment-50)/50;
 att+=2.6*me+1.1*pr;def+=-2.1*me+.9*pr;
 var mor=(s.morale-60)/20;att+=mor;def+=mor;
 return{att:att,def:def,vol:1+.16*te,G:G,D:D,M:M,A:A}}
var OPPB=.3;
function oppRatings(c,form){var st=X.teamStr(c)+form+OPPB;return{att:st+gauss()*.8,def:st+gauss()*.8,vol:1}}

/* ---------- mecz ---------- */
function newMatch(spec){var s=S();
 var M={opp:spec.opp,home:!!spec.home,neutral:!!spec.neutral,ko:!!spec.ko,fr:0,stage:spec.stage||'',spec:spec,
  min:0,gP:0,gO:0,ev:[],hl:[],half:0,subs:0,used:[],rt:{},sc:{},as:{},oform:gauss()*1.6,et:0,pens:null,done:0,pos:[],saves:0};
 M.xi=s.xi.map(function(e){return{slot:e.slot,id:e.id,i:e.i}});
 M.used=M.xi.map(function(e){return e.id});
 var rest=X.mySquad().filter(function(p){return M.used.indexOf(p.id)<0&&!p.inj}).sort(function(a,b){return b.ovr-a.ovr});var gk=rest.filter(function(p){return p.pos==='GK'})[0];
 M.bench=(gk?[gk]:[]).concat(rest.filter(function(p){return p!==gk}).slice(0,gk?8:9)).map(function(p){return p.id});
 kits(M);return M}
function lum(h){h=(h||'#888').replace('#','');var r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16);return (.299*r+.587*g+.114*b)/255}
function cdist(a,b){a=a.replace('#','');b=b.replace('#','');var d=0;for(var i=0;i<3;i++)d+=Math.abs(parseInt(a.substr(i*2,2),16)-parseInt(b.substr(i*2,2),16));return d}
function kits(M){var me=T[S().me],op=T[M.opp];var kP={c1:me.c1,c2:me.c2},kO={c1:op.c1,c2:op.c2};
 if(cdist(kP.c1,kO.c1)<150){if(M.home)kO={c1:op.a1,c2:op.a2};else kP={c1:me.a1,c2:me.a2}}
 if(cdist(kP.c1,kO.c1)<150)kO={c1:op.a1===kP.c1?op.c2:op.a1,c2:op.a2};M.kP=kP;M.kO=kO}
function shooter(xi){return X.wpick(xi.filter(function(e){return e.slot!=='GK'}),function(e){var p=P(e.id);var w={ST:5,LW:3,RW:3,AM:3,CM:1.4,DM:.6,LWB:.7,RWB:.7,LB:.45,RB:.45,CB:.6}[e.slot]||1;return w*Math.pow(p.ovr/62,3)*(1+p.form*.12)})}
function assister(xi,sid){var c=xi.filter(function(e){return e.slot!=='GK'&&e.id!==sid});return X.wpick(c,function(e){var w={AM:4,LW:3.2,RW:3.2,CM:2.4,ST:1.8,LWB:2,RWB:2,LB:1.4,RB:1.4,DM:1.2,CB:.5}[e.slot]||1;return w*Math.pow(P(e.id).ovr/62,2)})}
function oppName(c){var t=T[c];var st=t.stars&&t.stars.length?t.stars:['zawodnik rywala'];return X.wpick(st,function(n){return 3-st.indexOf(n)*.8})}
var PAT=['build','build','build','build','counter','counter','counter','solo','solo','wing','wing','long','long','corner'];
function simPeriod(M,from,to,frac){
 if(to<from)return M;
 var s=S(),tac=s.tac;var R=lineRatings(M.xi,tac),O=oppRatings(M.opp,M.oform);
 var home=M.neutral?0:(M.home?1:-1);
 var lp=X.lam(R.att,O.def,home>0)*R.vol*frac,lo=X.lam(O.att,R.def,home<0)*R.vol*frac;
 M.pos.push({from:from,to:to,v:clamp(Math.round(50+((R.att+R.def)/2-(O.att+O.def)/2)*1.1+(s.tac.tempo-50)*.04-(s.tac.ment<35?6:0)),28,72)});
 var gkE=M.xi.filter(function(e){return e.slot==='GK'})[0];var gkP=gkE?P(gkE.id):{ovr:45,form:0};
 var ost=X.teamStr(M.opp);
 var ch=[],n=poisson(lp*2.7),i;
 for(i=0;i<n;i++){var sh=shooter(M.xi),p=P(sh.id);var pc=clamp(.37*(1+(p.ovr-ost)/55)*(1+p.form*.05),.12,.6);ch.push({t:'P',min:ri(from,to),sid:sh.id,goal:Math.random()<pc})}
 n=poisson(lo*2.7);for(i=0;i<n;i++){var pc2=clamp(.37*(1-(gkP.ovr-ost)/70)-(gkP.form*.02),.12,.6);ch.push({t:'O',min:ri(from,to),name:oppName(M.opp),goal:Math.random()<pc2})}
 ch.sort(function(a,b){return a.min-b.min});
 ch.forEach(function(c){c.pat=pick(PAT);c.kind='shot';
  if(c.goal){if(c.t==='P'){M.gP++;var a=Math.random()<.78?assister(M.xi,c.sid):null;c.aid=a?a.id:null;M.sc[c.sid]=(M.sc[c.sid]||0)+1;if(c.aid)M.as[c.aid]=(M.as[c.aid]||0)+1}else{M.gO++}
   c.kind='goal';c.gP=M.gP;c.gO=M.gO;c.show=1}
  else{c.kind=Math.random()<.45?'save':Math.random()<.2?'post':'miss';if(c.t==='O'&&c.kind==='save')M.saves++}
  if(c.t==='P'&&!c.aid){var a2=assister(M.xi,c.sid);c.bid=a2?a2.id:null}
  M.ev.push(c)});
 var tgt=frac>=.45?ri(3,5):frac>=.3?ri(2,3):Math.max(1,Math.round(frac*8));
 var goals=ch.filter(function(c){return c.kind==='goal'});var rest=ch.filter(function(c){return c.kind!=='goal'});rest.sort(function(){return Math.random()-.5});
 goals.forEach(function(c){M.hl.push(c)});var nP=0,nO=0;
 for(var q=0;q<rest.length&&goals.length+nP+nO<tgt;q++){var c2=rest[q];if(c2.t==='P'&&nP>nO+1)continue;if(c2.t==='O'&&nO>nP+1)continue;c2.show=1;M.hl.push(c2);if(c2.t==='P')nP++;else nO++}
 var have=goals.length+nP+nO,used={};M.hl.forEach(function(h){used[h.min]=1});
 while(have<tgt){var tt=Math.random()<lp/(lp+lo+1e-6)?'P':'O';var mm=ri(from,to),g2=0;while(used[mm]&&g2++<20)mm=ri(from,to);used[mm]=1;
  var fk=Math.random()<.4?'save':Math.random()<.25?'post':'miss';var f={t:tt,min:mm,kind:fk,pat:pick(PAT),show:1};
  if(tt==='P'){var s3=shooter(M.xi);f.sid=s3.id}else{f.name=oppName(M.opp);if(fk==='save')M.saves++}
  M.ev.push(f);M.hl.push(f);have++}
 if(Math.random()<.4*frac*2){var e=pick(M.xi.filter(function(x){return x.slot!=='GK'&&x.slot!=='ST'}));var ym=ri(from,to);var yev={t:'P',min:ym,kind:'yellow',sid:e.id};M.ev.push(yev);M.hl.push({t:'O',min:ym,kind:'foul',sid:e.id,pat:'foul',ev:yev})}
 if(Math.random()<.06*frac*2&&from<85){var inj=pick(M.xi.filter(function(x){return x.slot!=='GK'}));var iev={t:'P',min:ri(from,Math.min(to,85)),kind:'injury',sid:inj.id};M.ev.push(iev);M.hl.push({t:'P',min:iev.min,kind:'foulInj',sid:inj.id,ev:iev,pat:'foul'})}
 var inP=M.hl.filter(function(h){return h.min>=from&&h.min<=to});inP.sort(function(a,b){return a.min-b.min});var lastH=inP[inP.length-1];
 if(lastH&&(lastH.kind==='foul'||lastH.kind==='foulInj')){var shots=inP.filter(function(h){return h.kind!=='foul'&&h.kind!=='foulInj'});var lm=shots.length?shots[shots.length-1].min:from;
  if(!shots.length||lm<=lastH.min){var tt2=Math.random()<.5?'P':'O';var f2={t:tt2,min:Math.min(to,lastH.min+ri(1,4)),kind:Math.random()<.5?'save':'miss',pat:pick(PAT),show:1};if(tt2==='P')f2.sid=shooter(M.xi).id;else{f2.name=oppName(M.opp);if(f2.kind==='save')M.saves++}if(f2.min<=lastH.min){var nm2=Math.max(from,lastH.min-ri(1,5));lastH.min=nm2;if(lastH.ev)lastH.ev.min=nm2;f2.min=Math.min(to,nm2+1)}M.ev.push(f2);M.hl.push(f2)}}
 M.hl.sort(function(a,b){return a.min-b.min});M.ev.sort(function(a,b){return a.min-b.min});
 return M}
function startHalf(M,h){if(h===1){M.half=1;simPeriod(M,1,45,.5)}else{M.half=2;simPeriod(M,46,90,.5)}}
function extraTime(M){M.et=1;M.half=3;simPeriod(M,91,120,.33)}
function resimFrom(M,minute){var end=M.half===1?45:M.half===2?90:120;if(minute>=end-1)return;
 M.ev=M.ev.filter(function(e){return !(e.min>minute&&e.min<=end&&(e.kind==='goal'||e.kind==='save'||e.kind==='post'||e.kind==='miss'||e.kind==='yellow'||e.kind==='injury'))});
 M.hl=M.hl.filter(function(e){return !(e.min>minute&&e.min<=end)});
 M.gP=0;M.gO=0;M.sc={};M.as={};M.saves=0;M.ev.forEach(function(e){if(e.kind==='goal'){if(e.t==='P'){M.gP++;M.sc[e.sid]=(M.sc[e.sid]||0)+1;if(e.aid)M.as[e.aid]=(M.as[e.aid]||0)+1}else M.gO++;e.gP=M.gP;e.gO=M.gO}else if(e.kind==='save'&&e.t==='O')M.saves++});
 var frac=(end-minute)/90;simPeriod(M,minute+1,end,frac)}
function stats(M,minute){var st={shP:0,shO:0,onP:0,onO:0,pos:50};M.ev.forEach(function(e){if(e.min>minute)return;if(e.kind==='goal'||e.kind==='save'||e.kind==='post'||e.kind==='miss'){if(e.t==='P'){st.shP++;if(e.kind==='goal'||e.kind==='save')st.onP++}else{st.shO++;if(e.kind==='goal'||e.kind==='save')st.onO++}}});
 var w=0,v=0;M.pos.forEach(function(p){if(p.from>minute)return;var len=Math.min(minute,p.to)-p.from+1;w+=len;v+=len*p.v});if(w)st.pos=Math.round(v/w);return st}
function benchOptions(M,slot,n){return M.bench.filter(function(id){return M.used.indexOf(id)<0}).sort(function(a,b){return X.eff(P(b),slot)-X.eff(P(a),slot)}).slice(0,n||20)}
function doSub(M,outId,inId,why,minute){if(M.subs>=5)return false;M.xi.forEach(function(e){if(e.id===outId)e.id=inId});M.used.push(inId);M.subs++;M.ev.push({t:'P',min:minute!=null?minute:(M.half===1?46:ri(60,80)),kind:'sub',sid:inId,oid:outId,why:why||''});M.ev.sort(function(a,b){return a.min-b.min});return true}
function penalties(M){var kick=M.xi.filter(function(e){return e.slot!=='GK'}).map(function(e){return P(e.id)}).sort(function(a,b){return b.ovr-a.ovr}).slice(0,5);
 var seq=[],sp=0,so=0,gkE=M.xi.filter(function(e){return e.slot==='GK'})[0],gk=gkE?P(gkE.id):{ovr:45};var ost=X.teamStr(M.opp);
 for(var r=0;r<12;r++){var pk=kick[r%5];var okP=Math.random()<clamp(.74+(pk.ovr-ost)/150,.6,.9);var okO=Math.random()<clamp(.76-(gk.ovr-ost)/120,.6,.88);
  if(okP)sp++;if(okO)so++;seq.push({p:pk.n,okP:okP,okO:okO});
  if(r<5){var left=4-r;if(sp>so+left||so>sp+left)break}else if(sp!==so)break}
 M.pens={p:sp,o:so,seq:seq}}
function agg(M){return M.spec&&M.spec.agg?M.spec.agg:[0,0]}
function koTie(M){if(!M.ko)return false;var a=agg(M);return M.gP+a[0]===M.gO+a[1]}
function winner(M){var a=agg(M),x=M.gP+a[0],y=M.gO+a[1];if(x!==y)return x>y?'P':'O';if(M.pens)return M.pens.p>M.pens.o?'P':'O';return 'D'}
/* szybki wynik bez oglądania */
function quick(spec){var M=newMatch(spec);startHalf(M,1);startHalf(M,2);if(koTie(M)){extraTime(M);if(koTie(M))penalties(M)}M.quick=1;finishMatch(M);return M}

/* ---------- po meczu ---------- */
function finishMatch(M){var s=S();if(M.done)return;M.done=1;
 var w=winner(M);var res=M.gP>M.gO?'W':M.gP<M.gO?'L':(M.pens&&!M.spec.agg?(w==='P'?'W':'L'):'D');M.res=res;if(M.ko)M.adv=w==='P';
 var diff=M.gP-M.gO;
 M.used.forEach(function(id){var p=P(id),e=M.xi.filter(function(x){return x.id===id})[0];var slot=e?e.slot:p.pos;
  var r=6.4+diff*.22+gauss()*.45+(M.sc[id]||0)*1.05+(M.as[id]||0)*.6;
  if(slot==='GK')r+=-.35*M.gO+(M.saves||0)*.25+(M.gO===0?.6:0);else if(X.LINE[slot]==='D')r+=-.15*M.gO+(M.gO===0?.4:0);
  M.rt[id]=Math.round(clamp(r,3.5,10)*10)/10});
 var deb=[];
 M.used.forEach(function(id){var p=P(id);if(p.caps===0&&X.age(p)<=20)deb.push(p);p.caps++;p.cs.a++;p.cs.r=(p.cs.r||0)+M.rt[id];p.cs.n=(p.cs.n||0)+1;p.g+=(M.sc[id]||0);p.cs.g+=(M.sc[id]||0);
  var r=M.rt[id];p.mood=clamp(p.mood+(r>=7?4:r<6?-3:1),0,100);if(X.age(p)<=17)X.ach('kid')});
 M.ev.forEach(function(e){if(e.kind==='injury'&&P(e.sid)){P(e.sid).inj=ri(1,4)}});
 X.mySquad().forEach(function(p){if(M.used.indexOf(p.id)<0&&X.rankIn(p)<=14)p.mood=clamp(p.mood-2,20,100)});
 M.deb=deb;
 for(var id in M.sc)if(M.sc[id]>=3)X.ach('hat');
 s.stats.p++;s.stats.gf+=M.gP;s.stats.ga+=M.gO;if(res==='W')s.stats.w++;else if(res==='L')s.stats.l++;else s.stats.d++;
 var st=s.streak;var wasU=st.u;
 if(res==='W'){st.w++;st.u=0;st.nl++;st.l=0}else if(res==='D'){st.w=0;st.u++;st.nl++;st.l=0}else{st.w=0;st.u++;st.nl=0;st.l++}
 var gap=X.teamStr(M.opp)-X.myStr();
 if(res==='W')X.ach('first');if(res==='W'&&gap>=6)X.ach('giant');if(res==='W'&&diff>=5)X.ach('rout');if(st.nl>=10)X.ach('unb10');if(st.l>=5)X.ach('l5');
 s.hist.unshift({y:s.season,c:s.me,opp:M.opp,home:M.home,neutral:M.neutral,gP:M.gP,gO:M.gO,pens:M.pens?[M.pens.p,M.pens.o]:null,comp:M.spec.cmp||M.spec.comp,stage:M.stage,sc:Object.keys(M.sc).map(function(i){return sur(P(i).n)+(M.sc[i]>1?' x'+M.sc[i]:'')})});
 if(s.hist.length>200)s.hist.length=200;
 X.recordMine(M.spec,M.gP,M.gO,M.pens?[M.pens.p,M.pens.o]:null);X.statMatch(M);
 reactMatch(M,wasU);
 if(st.u===0&&wasU>=4&&res==='W'){X.unlockSong('walka');X.media('PRZEŁAMANIE! Koniec serii bez wygranej','Po '+wasU+' meczach bez zwycięstwa '+tn(s.me)+' znowu wygrywa. Na kanale Qastrod leci "Każdy mecz to walka".','good')}
 X.save()}

/* ---------- media po meczu ---------- */
function scoreStr(M){var me=tn(S().me);var a=M.home||M.neutral?[me,tn(M.opp),M.gP,M.gO]:[tn(M.opp),me,M.gO,M.gP];return a[0]+' - '+a[1]+' '+a[2]+':'+a[3]+(M.pens?' (k. '+(M.home||M.neutral?M.pens.p+':'+M.pens.o:M.pens.o+':'+M.pens.p)+')':'')}
function expect(M){var sp=X.myStr(),so=X.teamStr(M.opp),h=M.neutral?0:M.home?1.6:-1.6;return 1/(1+Math.exp(-(sp-so+h)/4.5))}
function reactMatch(M,wasU){var s=S();
 var e=expect(M);var r=M.res==='W'?1:M.res==='L'?0:.5;if(M.pens)r=M.res==='W'?.75:.35;
 var wgt=M.spec.kind==='L'?1:M.spec.kind==='EU'?.8:1.3;var perf=(r-e)+s.pressMod*.15;
 var margin=M.gP-M.gO;
 var dT=(perf*18+(margin>=3?3:margin<=-3?-4:0))*wgt;dT=Math.round(dT>0?dT*(1-s.trust/110):dT*(1-(100-s.trust)/200));
 var dP=Math.round((-perf*15+(s.streak.u>=3?4:0)+(s.streak.l>=2?3:0))*wgt);
 var dB=Math.round(perf*4*wgt+(s.streak.l>=3?-2:0)+(s.streak.w>=3?1:0));
 s.trust=clamp(s.trust+dT,0,100);s.press=clamp(s.press+dP,0,100);s.board=clamp(s.board+dB,0,100);s.morale=clamp(s.morale+(M.res==='W'?6:M.res==='L'?-6:0),10,100);
 M.dT=dT;M.dP=dP;M.dB=dB;s.pressMod=0;
 var top=null,tv=0;for(var id in M.sc)if(M.sc[id]>tv){tv=M.sc[id];top=P(id)}
 var bestR=null,bv=0;for(var id2 in M.rt)if(M.rt[id2]>bv){bv=M.rt[id2];bestR=P(id2)}
 var me=tn(s.me);var scorer=top?sur(top.n):bestR?sur(bestR.n):me;var sc=scoreStr(M);var sel=sur(s.name);
 var cat;
 if(M.res==='W'){cat=margin>=3?'big':e<.35?'shock':e>.72&&margin===1?'meh':'win'}else if(M.res==='D'){cat=e<.38?'dgood':e>.65?'dbad':'draw'}else{cat=e<.35?(margin<=-3?'lbig':'lexp'):e>.62?'lshock':'loss'}
 var H={big:['DEMOLKA! '+sc,'Takie mecze chcemy oglądać co tydzień',scorer+' rozstrzelał rywala'],
  shock:['SENSACJA! '+sc,'Faworyt na kolanach: '+sc,'Cud? Nie, to plan trenera '+sel],
  win:['Trzy punkty są! '+sc,'Bez fajerwerków, ale skutecznie',scorer+' bohaterem meczu'],
  meh:['Męczarnie, ale wygrana: '+sc,sc+'. Styl? Jaki styl?','Wygrali, ale kibice ziewali'],
  dgood:['Remis, który cieszy: '+sc,'Punkt z faworytem. Kibice biją brawo'],
  dbad:['Wstyd! Tylko '+sc,'Remis jak porażka','Gwizdy po końcowym gwizdku: '+sc],
  draw:['Podział punktów: '+sc,'Remis i dużo pytań'],
  lexp:['Lekcja futbolu: '+sc,'Za wysokie progi','Przegrana, ale bez wstydu'],
  lbig:['Bolesna lekcja: '+sc,'Lanie. Nie ma innego słowa','Kibice wychodzili przed końcem'],
  lshock:['KOMPROMITACJA! '+sc,'Najczarniejszy dzień sezonu','Kibice nie wierzą: '+sc],
  loss:['Porażka: '+sc,'Znowu to samo','Trener '+sel+' pod ostrzałem po '+sc]};
 var tone={big:'good',shock:'good',win:'good',meh:'neutral',dgood:'good',dbad:'bad',draw:'neutral',lexp:'neutral',lbig:'bad',lshock:'bad',loss:'bad'}[cat];
 var body=tone==='good'?pick([sel+' zbiera pochwały. Ekspert w studiu: "Wreszcie widać pomysł na grę".','Najlepszy na boisku: '+(bestR?bestR.n:'')+'. Szatnia w świetnych nastrojach.','Trener po meczu: "Chłopaki zostawili serce na boisku".']):
  tone==='bad'?pick(['Kibice pytają o pomysł na grę. Trener '+sel+' tłumaczy: "Mieliśmy plan. Plan nie wyszedł".','Ekspert: "Ja bym od razu zmienił ustawienie". Ekspert nie mówi, na jakie.','Konferencja trwała 4 minuty. Trener wyszedł bez słowa.']):
  pick(['Dużo do poprawy, ale są też pozytywy.','Trener: "Wyciągniemy wnioski". Media: "Słyszeliśmy to już".']);
 M.head=[{t:pick(H[cat]),b:body,tone:tone}];
 if(M.deb&&M.deb.length)M.head.push({t:'Debiut: '+M.deb.map(function(p){return p.n}).join(', '),b:'Ma dopiero '+X.age(M.deb[0])+' lat. Kibice '+me+' już śpiewają jego nazwisko.',tone:'neutral'});
 if(s.streak.u>=3&&M.res!=='W')M.head.push({t:'Seria bez wygranej: już '+s.streak.u+' '+(s.streak.u<5?'mecze':'meczów'),b:'Zarząd '+me+' zaczyna się niecierpliwić.',tone:'bad'});
 if(s.streak.w>=4)M.head.push({t:s.streak.w+' zwycięstw z rzędu!','b':'Takiej serii dawno nie było. Kibice zaczynają marzyć.',tone:'good'});
 M.head.forEach(function(h){X.media(h.t,h.b,h.tone)});
 var GOOD=[scorer+' to jest kozak, nie dyskutujemy 🔥','Dawno nie oglądałem '+me+' z takim uśmiechem',sel+' na prezesa','Ten mecz pokażę wnukom','Odpalam piosenkę Qastroda i idę świętować 🎵','Kto mówił, że to się nie uda? 😎'];
 var BAD=['Ja bym to lepiej ustawił. A gram w gry piłkarskie od 2009','Trenerze, oddaj klucze do szatni','Wyłączyłem w 60. minucie i nie żałuję','Ile jeszcze? 😩','Mama pyta, czemu płaczę. Oglądałem '+me,'Moja babcia lepiej by ustawiła obronę. A babcia ogląda tylko seriale'];
 var NEU=['Remis to nie porażka. Ani zwycięstwo. Nic to','Dobrze, że chociaż kiełbasa z grilla była dobra','Ok, ale czemu nie gra mój kolega z podwórka?','Druga połowa lepsza. Pierwsza też była'];
 var handles=['@KibicZTrybun','@TikiTakaJanusz','@TaktykZFotela','@PrawdziwyEkspert99','@SzalikiWGórę','@FutbolowaMama','@Zbyszek_z_Sektora','@AnalitykZOsiedla'];
 if(M.res==='W'&&tone==='neutral')NEU=['Trzy punkty to trzy punkty','Wygrana, ale serce boli od oglądania','Brzydko, ale skutecznie. Biorę','Punkty się liczą, nie styl'];if(M.res==='L'&&tone==='neutral')NEU=['Przegrana, ale ambicji nie brakowało','Głowa do góry, następny mecz'];var pool=tone==='good'?GOOD:tone==='bad'?BAD:NEU;M.social=X.shuffle(pool).slice(0,3).map(function(t){return{h:pick(handles),t:t}})}

/* ---------- konferencja prasowa ---------- */
function pressQs(spec){var s=S(),qs=[];var opp=tn(spec.opp);var me=tn(s.me);
 var pos=X.posOf(s.me);var star=X.mySquad().sort(function(a,b){return b.ovr-a.ovr})[0];
 if(s.streak.u>=3)qs.push({q:'Seria bez wygranej trwa. Boi się Pan zwolnienia?',a:[
  {t:'Nigdy! Przełamiemy to.',e:{trust:2,press:2,mod:.3}},
  {t:'Zdecydują wyniki, nie nagłówki.',e:{press:-1}},
  {t:'A Pan by sobie poradził? Zapraszam na trening.',e:{press:5,trust:3}}]});
 if(spec.kind==='EU')qs.push({q:'Europa patrzy. Czy '+me+' może powalczyć z '+opp+'?',a:[
  {t:'Nie przyjechaliśmy tu na wycieczkę.',e:{trust:3,morale:3,mod:-.3}},
  {t:'To dla nas lekcja i wielka szansa.',e:{press:-2,mod:.3}},
  {t:'Rywal ma większy budżet, ale piłka jest okrągła.',e:{trust:1}}]});
 if(spec.kind==='C')qs.push({q:'Puchar to dla '+me+' priorytet czy przerywnik?',a:[
  {t:'Gramy o trofeum. Wystawię najmocniejszy skład.',e:{trust:3,morale:2}},
  {t:'Liga jest ważniejsza, ale nie odpuszczamy.',e:{}},
  {t:'Dam szansę rezerwowym.',e:{trust:-2,mod:.3,morale:1}}]});
 qs.push({q:'Jaki cel na mecz z '+opp+'?',a:[
  {t:'Tylko zwycięstwo. Nic innego mnie nie interesuje.',e:{trust:3,mod:-.5,morale:3}},
  {t:'Gramy swoje i patrzymy na siebie.',e:{}},
  {t:'Rywal jest faworytem. Spokojnie z oczekiwaniami.',e:{trust:-2,mod:.5,morale:-2}}]});
 qs.push(pick([{q:'Czy czuje Pan presję zarządu?',a:[{t:'Presja to przywilej.',e:{trust:2}},{t:'Prezes dzwoni codziennie. Odbieram co drugi raz.',e:{press:2,trust:1}},{t:'Proszę zapytać po meczu.',e:{press:1}}]},
  {q:'Kibice pytają o transfery. Będą wzmocnienia?',a:[{t:'Szukamy. Budżet jest, cierpliwości.',e:{trust:2}},{t:'Mam swoich ludzi. Ufam tej szatni.',e:{morale:3,trust:-1}},{t:'O transferach mówię, kiedy są podpisane.',e:{}}]},
  {q:(star?star.n+' to Wasza gwiazda. Nie boi się Pan, że ktoś go kupi?':'Kto jest liderem tej drużyny?'),a:[{t:'Nie sprzedajemy. Kropka.',e:{trust:3,morale:2}},{t:'Każdy ma swoją cenę.',e:{trust:-2,press:1}},{t:'Liczy się drużyna, nie jedno nazwisko.',e:{morale:1}}]},
  {q:'Ekspert z telewizji twierdzi, że poprowadziłby '+me+' lepiej. Komentarz?',a:[{t:'Zapraszam, posadzę go na ławce. Rezerwowych.',e:{press:3,trust:2}},{t:'Każdy w Polsce jest trenerem. To piękne.',e:{trust:2,press:-2}},{t:'Bez komentarza.',e:{}}]}]));
 if(pos&&pos<=3&&spec.kind==='L')qs.unshift({q:me+' w czołówce tabeli ('+pos+'. miejsce). Mówimy o '+(X.lgOf(s.me)==='E'?'mistrzostwie':'awansie')+'?',a:[
  {t:'Tak. Gramy o najwyższe cele.',e:{trust:3,press:3,morale:2}},{t:'Mecz po meczu. Daleka droga.',e:{press:-2}},{t:'Nie zapeszajmy.',e:{trust:1}}]});
 return qs.slice(0,2)}
function applyAns(e){var s=S();if(e.press)s.press=clamp(s.press+e.press,0,100);if(e.trust)s.trust=clamp(s.trust+e.trust,0,100);if(e.morale)s.morale=clamp(s.morale+e.morale,0,100);if(e.mod)s.pressMod+=e.mod}
/* szanse W/R/P na podstawie składu */
function chances(spec,R){var so=X.teamStr(spec.opp)+OPPB;var hm=spec.neutral?0:spec.home?1:-1;var lp=X.lam(R.att,so,hm>0)*R.vol,lo=X.lam(so,R.def,hm<0)*R.vol;
 function pf(l,k){var f=1;for(var i=2;i<=k;i++)f*=i;return Math.exp(-l)*Math.pow(l,k)/f}var w=0,d=0,l=0;for(var a=0;a<9;a++)for(var b=0;b<9;b++){var q=pf(lp,a)*pf(lo,b);if(a>b)w+=q;else if(a<b)l+=q;else d+=q}
 var t=w+d+l;w=Math.round(w/t*100);d=Math.round(d/t*100);return [w,d,100-w-d]}
X.M={koTie:koTie,newMatch:newMatch,startHalf:startHalf,extraTime:extraTime,resimFrom:resimFrom,stats:stats,benchOptions:benchOptions,penalties:penalties,finishMatch:finishMatch,pressQs:pressQs,applyAns:applyAns,
 doSub:doSub,lineRatings:lineRatings,scoreStr:scoreStr,tn:tn,winner:winner,quick:quick,chances:chances};
})();
