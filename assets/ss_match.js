/* Symulator selekcjonera: silnik meczu, wyniki, media, konferencje */
(function(){
'use strict';
var X=window.SS;if(!X)return;
var rnd=X.rnd,ri=X.ri,pick=X.pick,clamp=X.clamp,gauss=X.gauss,poisson=X.poisson,sur=X.sur,P=X.P,T=X.TEAMS;
function S(){return X.S()}
function tn(c){return T[c]?T[c].n:c}

/* ---------- siła składu ---------- */
function lineRatings(xi,tac){var s=S(),L={G:[],D:[],M:[],A:[]};
 xi.forEach(function(e){var p=P(e.id);var v=X.eff(p,e.slot)+(e.tired?-2:0);var ln=X.LINE[e.slot];if(ln==='DM'){L.D.push(v);L.M.push(v)}else L[ln].push(v)});
 function av(a){return a.length?a.reduce(function(x,y){return x+y},0)/a.length:55}
 var G=av(L.G),D=av(L.D),M=av(L.M),A=av(L.A);
 var att=.5*A+.4*M+.1*D,def=.45*D+.3*M+.25*G;
 var pr=(tac.press-50)/50,te=(tac.tempo-50)/50,me=(tac.ment-50)/50;
 att+=2.6*me+1.1*pr;def+=-2.1*me+.9*pr;
 var mor=(s.morale-60)/20;att+=mor;def+=mor;
 return{att:att,def:def,vol:1+.16*te,G:G,D:D,M:M,A:A}}
function oppRatings(c,form){var st=X.teamStr(c)+form+4.2;return{att:st+gauss()*.8,def:st+gauss()*.8,vol:1}}

/* ---------- mecz ---------- */
function newMatch(spec){var s=S();
 var M={opp:spec.opp,home:!!spec.home,neutral:!!spec.neutral,ko:!!spec.ko,fr:!!spec.fr,stage:spec.stage||'',fx:spec.fx,
  min:0,gP:0,gO:0,ev:[],hl:[],half:0,subs:0,used:[],rt:{},sc:{},as:{},oform:gauss()*1.6,et:0,pens:null,done:0,pos:[],saves:0};
 M.xi=s.xi.map(function(e){return{slot:e.slot,id:e.id,i:e.i}});
 M.used=M.xi.map(function(e){return e.id});
 M.bench=s.squad.filter(function(id){return M.used.indexOf(id)<0&&!P(id).inj});
 return M}
function shooter(xi){return X.wpick(xi.filter(function(e){return e.slot!=='GK'}),function(e){var p=P(e.id);var w={ST:5,LW:3,RW:3,AM:3,CM:1.4,DM:.6,LWB:.7,RWB:.7,LB:.45,RB:.45,CB:.6}[e.slot]||1;return w*Math.pow(p.ovr/70,3)*(1+p.form*.12)})}
function assister(xi,sid){var c=xi.filter(function(e){return e.slot!=='GK'&&e.id!==sid});return X.wpick(c,function(e){var w={AM:4,LW:3.2,RW:3.2,CM:2.4,ST:1.8,LWB:2,RWB:2,LB:1.4,RB:1.4,DM:1.2,CB:.5}[e.slot]||1;return w*Math.pow(P(e.id).ovr/70,2)})}
function oppName(c){var t=T[c];var st=t.stars&&t.stars.length?t.stars:['zawodnik rywala'];return X.wpick(st,function(n){return 3-st.indexOf(n)*.8})}
var PAT=['build','build','build','build','counter','counter','counter','solo','solo','wing','wing','long','long','corner'];
function simPeriod(M,from,to,frac){
 if(to<from)return M;
 var s=S(),tac=s.tac;var R=lineRatings(M.xi,tac),O=oppRatings(M.opp,M.oform);
 var home=M.neutral?0:(M.home?1:-1);
 var lp=X.lam(R.att,O.def,home>0)*R.vol*frac,lo=X.lam(O.att,R.def,home<0)*R.vol*frac;
 M.pos.push({from:from,to:to,v:clamp(Math.round(50+((R.att+R.def)/2-(O.att+O.def)/2)*1.1+(s.tac.tempo-50)*.04-(s.tac.ment<35?6:0)),28,72)});
 var gkP=P(M.xi.filter(function(e){return e.slot==='GK'})[0].id);
 var ch=[],n=poisson(lp*2.7),i;
 for(i=0;i<n;i++){var sh=shooter(M.xi),p=P(sh.id);var pc=clamp(.37*(1+(p.ovr-75)/55)*(1+p.form*.05)-(X.teamStr(M.opp)-75)/250,.12,.6);ch.push({t:'P',min:ri(from,to),sid:sh.id,goal:Math.random()<pc})}
 n=poisson(lo*2.7);for(i=0;i<n;i++){var pc2=clamp(.37*(1-(gkP.ovr-75)/70)-(gkP.form*.02),.12,.6);ch.push({t:'O',min:ri(from,to),name:oppName(M.opp),goal:Math.random()<pc2})}
 ch.sort(function(a,b){return a.min-b.min});
 var shownP=0,shownO=0,cap=Math.max(1,Math.round(3*frac/.5));
 ch.forEach(function(c){c.pat=pick(PAT);c.kind='shot';
  if(c.goal){if(c.t==='P'){M.gP++;var a=Math.random()<.78?assister(M.xi,c.sid):null;c.aid=a?a.id:null;M.sc[c.sid]=(M.sc[c.sid]||0)+1;if(c.aid)M.as[c.aid]=(M.as[c.aid]||0)+1}else{M.gO++}
   c.kind='goal';c.gP=M.gP;c.gO=M.gO;c.show=1}
  else{c.kind=Math.random()<.45?'save':Math.random()<.2?'post':'miss';if(c.t==='O'&&c.kind==='save')M.saves++}
  if(c.t==='P'&&!c.aid){var a2=assister(M.xi,c.sid);c.bid=a2?a2.id:null}
  M.ev.push(c)});
 /* skrót: wszystkie gole + kilka sytuacji, razem 3-5 akcji na połowę */
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
 /* połowa nie może się skończyć faulem: ostatnia akcja to zawsze strzał */
 var inP=M.hl.filter(function(h){return h.min>=from&&h.min<=to});inP.sort(function(a,b){return a.min-b.min});var lastH=inP[inP.length-1];
 if(lastH&&(lastH.kind==='foul'||lastH.kind==='foulInj')){var shots=inP.filter(function(h){return h.kind!=='foul'&&h.kind!=='foulInj'});var lm=shots.length?shots[shots.length-1].min:from;
  if(!shots.length||lm<=lastH.min){var tt2=Math.random()<.5?'P':'O';var f2={t:tt2,min:Math.min(to,lastH.min+ri(1,4)),kind:Math.random()<.5?'save':'miss',pat:pick(PAT),show:1};if(tt2==='P')f2.sid=shooter(M.xi).id;else{f2.name=oppName(M.opp);if(f2.kind==='save')M.saves++}if(f2.min<=lastH.min){var nm2=Math.max(from,lastH.min-ri(1,5));lastH.min=nm2;if(lastH.ev)lastH.ev.min=nm2;f2.min=Math.min(to,nm2+1)}M.ev.push(f2);M.hl.push(f2)}}
 M.hl.sort(function(a,b){return a.min-b.min});M.ev.sort(function(a,b){return a.min-b.min});
 return M}
function startHalf(M,h){if(h===1){M.half=1;simPeriod(M,1,45,.5)}else{M.half=2;simPeriod(M,46,90,.5)}}
function extraTime(M){M.et=1;M.half=3;simPeriod(M,91,120,.33)}
/* zmiana w trakcie: przelicz resztę połowy */
function resimFrom(M,minute){var end=M.half===1?45:M.half===2?90:120;if(minute>=end-1)return;
 M.ev=M.ev.filter(function(e){return !(e.min>minute&&e.min<=end&&(e.kind==='goal'||e.kind==='save'||e.kind==='post'||e.kind==='miss'||e.kind==='yellow'||e.kind==='injury'))});
 M.hl=M.hl.filter(function(e){return !(e.min>minute&&e.min<=end)});
 /* przelicz gole i strzelców od nowa */
 M.gP=0;M.gO=0;M.sc={};M.as={};M.saves=0;M.ev.forEach(function(e){if(e.kind==='goal'){if(e.t==='P'){M.gP++;M.sc[e.sid]=(M.sc[e.sid]||0)+1;if(e.aid)M.as[e.aid]=(M.as[e.aid]||0)+1}else M.gO++;e.gP=M.gP;e.gO=M.gO}else if(e.kind==='save'&&e.t==='O')M.saves++});
 var frac=(end-minute)/(end===120?90:90);simPeriod(M,minute+1,end,frac)}
function stats(M,minute){var st={shP:0,shO:0,onP:0,onO:0,pos:50};M.ev.forEach(function(e){if(e.min>minute)return;if(e.kind==='goal'||e.kind==='save'||e.kind==='post'||e.kind==='miss'){if(e.t==='P'){st.shP++;if(e.kind==='goal'||e.kind==='save')st.onP++}else{st.shO++;if(e.kind==='goal'||e.kind==='save')st.onO++}}});
 var w=0,v=0;M.pos.forEach(function(p){if(p.from>minute)return;var len=Math.min(minute,p.to)-p.from+1;w+=len;v+=len*p.v});if(w)st.pos=Math.round(v/w);return st}
function playHalf(M){if(M.half===0)startHalf(M,1);else if(M.half===1){startHalf(M,2)}else if(M.half===2){if(M.ko&&M.gP===M.gO){extraTime(M);M.half=3}}if(M.half>=2&&!(M.ko&&M.gP===M.gO&&M.half===2)){if(M.ko&&M.gP===M.gO&&!M.pens)penalties(M);if(!M.done)finishMatch(M)}}
function bestBench(M,slot){var b=null,bv=-1;M.bench.forEach(function(id){if(M.used.indexOf(id)>=0)return;var v=X.eff(P(id),slot);if(v>bv){bv=v;b=id}});return b}
function benchOptions(M,slot,n){return M.bench.filter(function(id){return M.used.indexOf(id)<0}).sort(function(a,b){return X.eff(P(b),slot)-X.eff(P(a),slot)}).slice(0,n||20)}
function doSub(M,outId,inId,why,minute){if(M.subs>=5)return false;M.xi.forEach(function(e){if(e.id===outId)e.id=inId});M.used.push(inId);M.subs++;M.ev.push({t:'P',min:minute!=null?minute:(M.half===1?46:ri(60,80)),kind:'sub',sid:inId,oid:outId,why:why||''});M.ev.sort(function(a,b){return a.min-b.min});return true}
function penalties(M){var kick=M.xi.filter(function(e){return e.slot!=='GK'}).map(function(e){return P(e.id)}).sort(function(a,b){return b.ovr-a.ovr}).slice(0,5);
 var seq=[],sp=0,so=0,gk=P(M.xi.filter(function(e){return e.slot==='GK'})[0].id);
 for(var r=0;r<12;r++){var pk=kick[r%5];var okP=Math.random()<clamp(.74+(pk.ovr-75)/150,.6,.9);var okO=Math.random()<clamp(.76-(gk.ovr-75)/120,.6,.88);
  if(okP)sp++;if(okO)so++;seq.push({p:pk.n,okP:okP,okO:okO});
  if(r<5){var left=4-r;if(sp>so+left||so>sp+left)break}else if(sp!==so)break}
 M.pens={p:sp,o:so,seq:seq}}
function winner(M){if(M.gP!==M.gO)return M.gP>M.gO?'P':'O';if(M.pens)return M.pens.p>M.pens.o?'P':'O';return 'D'}

/* ---------- po meczu ---------- */
function finishMatch(M){var s=S();M.done=1;
 var w=winner(M);var res=M.gP>M.gO?'W':M.gP<M.gO?'L':(M.pens?(w==='P'?'W':'L'):'D');M.res=res;
 /* oceny */
 var diff=M.gP-M.gO;
 M.used.forEach(function(id){var p=P(id),e=M.xi.filter(function(x){return x.id===id})[0];var slot=e?e.slot:p.pos;
  var r=6.4+diff*.22+gauss()*.45+(M.sc[id]||0)*1.05+(M.as[id]||0)*.6;
  if(slot==='GK')r+=-.35*M.gO+(M.saves||0)*.25+(M.gO===0?.6:0);else if(X.LINE[slot]==='D')r+=-.15*M.gO+(M.gO===0?.4:0);
  M.rt[id]=Math.round(clamp(r,3.5,10)*10)/10});
 /* statystyki */
 var deb=[];
 M.used.forEach(function(id){var p=P(id);if(p.caps===0)deb.push(p);p.caps++;p.g+=(M.sc[id]||0);
  var r=M.rt[id];p.mood=clamp(p.mood+(r>=7?4:r<6?-3:1),0,100);if(X.age(p)<=18)X.ach('kid')});
 M.deb=deb;
 for(var id in M.sc)if(M.sc[id]>=3)X.ach('hat');
 var lew=X.byName('Robert Lewandowski');if(lew&&P(lew).g>=100)X.ach('lewy100');
 s.stats.p++;s.stats.gf+=M.gP;s.stats.ga+=M.gO;if(res==='W')s.stats.w++;else if(res==='L')s.stats.l++;else s.stats.d++;
 var st=s.streak;var wasU=st.u;
 if(res==='W'){st.w++;st.u=0;st.nl++;st.l=0}else if(res==='D'){st.w=0;st.u++;st.nl++;st.l=0}else{st.w=0;st.u++;st.nl=0;st.l++}
 if(res==='W')X.ach('first');if(res==='W'&&M.opp==='GER')X.ach('ger');if(res==='W'&&X.teamStr(M.opp)>=85)X.ach('giant');if(res==='W'&&M.opp==='SWE')X.ach('swe');
 if(res==='W'&&diff>=5)X.ach('rout');if(st.nl>=10)X.ach('unb10');if(st.l>=5)X.ach('l5');
 s.hist.unshift({y:s.y,m:s.m,opp:M.opp,home:M.home,neutral:M.neutral,gP:M.gP,gO:M.gO,pens:M.pens?[M.pens.p,M.pens.o]:null,comp:s.win.title,stage:M.stage,fr:M.fr,sc:Object.keys(M.sc).map(function(i){return sur(P(i).n)+(M.sc[i]>1?' x'+M.sc[i]:'')})});
 if(s.hist.length>200)s.hist.length=200;
 if(M.home||M.neutral)X.eloUpd('POL',M.opp,M.gP,M.gO);else X.eloUpd(M.opp,'POL',M.gO,M.gP);
 /* tabela */
 var win=s.win;
 if(M.fx!=null&&win.comp){var c=s.comps[win.comp],f=c.fx[M.fx];if(f.h==='POL'){f.hg=M.gP;f.ag=M.gO}else{f.hg=M.gO;f.ag=M.gP}X.playOthers(c,[f.r])}
 reactMatch(M,wasU);
 if(st.u===0&&wasU>=3&&res==='W'){X.unlockSong('walka');X.media('PRZEŁAMANIE! Koniec serii bez wygranej','Po '+wasU+' meczach bez zwycięstwa kadra znowu wygrywa. Na kanale Qastrod leci "Każdy mecz to walka".','good')}
 if(s.trust>=90)X.ach('t90');if(s.press>=100)X.ach('p100');
 X.save()}

/* ---------- media po meczu ---------- */
function scoreStr(M){var a=M.home||M.neutral?['Polska',tn(M.opp),M.gP,M.gO]:[tn(M.opp),'Polska',M.gO,M.gP];return a[0]+' - '+a[1]+' '+a[2]+':'+a[3]+(M.pens?' (k. '+(M.home||M.neutral?M.pens.p+':'+M.pens.o:M.pens.o+':'+M.pens.p)+')':'')}
function reactMatch(M,wasU){var s=S();
 var sp=X.polStr(),so=X.teamStr(M.opp),h=M.neutral?0:M.home?1.8:-1.8;
 var e=1/(1+Math.exp(-(sp-so+h)/5));var r=M.res==='W'?1:M.res==='L'?0:.5;if(M.pens)r=M.res==='W'?.75:.35;
 var wgt=M.fr?.45:s.win.kind==='T'?1.6:1;var perf=(r-e)+s.pressMod*.15;
 var margin=M.gP-M.gO;
 var dT=(perf*20+(margin>=3?3:margin<=-3?-4:0))*wgt;dT=Math.round(dT>0?dT*(1-s.trust/110):dT*(1-(100-s.trust)/200));
 var dP=Math.round((-perf*17+(s.streak.u>=3?4:0)+(s.streak.l>=2?3:0))*wgt);
 s.trust=clamp(s.trust+dT,0,100);s.press=clamp(s.press+dP,0,100);s.morale=clamp(s.morale+(M.res==='W'?6:M.res==='L'?-6:0),10,100);
 M.dT=dT;M.dP=dP;s.pressMod=0;
 var top=null,tv=0;for(var id in M.sc)if(M.sc[id]>tv){tv=M.sc[id];top=P(id)}
 var bestR=null,bv=0;for(var id2 in M.rt)if(M.rt[id2]>bv){bv=M.rt[id2];bestR=P(id2)}
 var scorer=top?sur(top.n):bestR?sur(bestR.n):'Kadra';var sc=scoreStr(M);var sel=sur(s.name);
 var cat;
 if(M.res==='W'){cat=margin>=3?'big':e<.4?'shock':e>.75&&margin===1?'meh':'win'}else if(M.res==='D'){cat=e<.4?'dgood':e>.65?'dbad':'draw'}else{cat=e<.35?(margin<=-3?'lbig':'lexp'):e>.6?'lshock':'loss'}
 var H={big:['DEMOLKA! '+sc,'Taki mecz chcemy oglądać co tydzień',scorer+' rozstrzelał rywala'],
  shock:['SENSACJA! '+sc,'Historyczny wieczór: '+sc,'Cud? Nie, to plan selekcjonera'],
  win:['Trzy punkty są! '+sc,'Bez fajerwerków, ale skutecznie',scorer+' bohaterem wieczoru'],
  meh:['Męczarnie, ale wygrana: '+sc,sc+'. Styl? Jaki styl?','Wygrali, ale kibice ziewali'],
  dgood:['Remis, który cieszy: '+sc,'Punkt z faworytem. Kibice biją brawo'],
  dbad:['Wstyd! Tylko '+sc,'Remis jak porażka','Gwizdy po końcowym gwizdku: '+sc],
  draw:['Podział punktów: '+sc,'Remis i dużo pytań'],
  lexp:['Lekcja futbolu: '+sc,'Za wysokie progi','Przegrana, ale bez wstydu'],
  lbig:['Bolesna lekcja: '+sc,'Lanie. Nie ma innego słowa','Kibice wychodzili przed końcem'],
  lshock:['KOMPROMITACJA! '+sc,'Najczarniejszy dzień tej kadencji','Kibice nie wierzą: '+sc],
  loss:['Porażka: '+sc,'Znowu to samo','Selekcjoner '+sel+' pod ostrzałem po '+sc]};
 var tone={big:'good',shock:'good',win:'good',meh:'neutral',dgood:'good',dbad:'bad',draw:'neutral',lexp:'neutral',lbig:'bad',lshock:'bad',loss:'bad'}[cat];
 var body=tone==='good'?pick([sel+' zbiera pochwały. Ekspert w studiu: "Wreszcie widać pomysł na grę".','Najlepszy na boisku: '+(bestR?bestR.n:'')+'. Szatnia w świetnych nastrojach.','Selekcjoner po meczu: "Chłopaki zostawili serce na boisku".']):
  tone==='bad'?pick(['Kibice pytają o pomysł na grę. Selekcjoner '+sel+' tłumaczy: "Mieliśmy plan. Plan nie wyszedł".','Ekspert: "Ja bym od razu zmienił ustawienie". Ekspert nie mówi, na jakie.','Konferencja trwała 4 minuty. Selekcjoner wyszedł bez słowa.']):
  pick(['Dużo do poprawy, ale są też pozytywy.','Selekcjoner: "Wyciągniemy wnioski". Media: "Słyszeliśmy to już".']);
 M.head=[{t:pick(H[cat]),b:body,tone:tone}];
 if(M.deb&&M.deb.length)M.head.push({t:'Debiut: '+M.deb.map(function(p){return p.n}).join(', '),b:M.deb.length>1?'Selekcjoner stawia na nowe twarze.':(X.age(M.deb[0])<=19?'Ma dopiero '+X.age(M.deb[0])+' lat. Internet już pisze o nowej gwieździe.':'Pierwszy mecz w reprezentacji.'),tone:'neutral'});
 if(s.streak.u>=3&&M.res!=='W')M.head.push({t:'Seria bez wygranej: już '+s.streak.u+' '+(s.streak.u<5?'mecze':'meczów'),b:'Media liczą każdy kolejny mecz. Sondaż: '+Math.round(100-s.trust)+'% chce zmiany selekcjonera.',tone:'bad'});
 if(s.streak.w>=4)M.head.push({t:s.streak.w+' zwycięstw z rzędu!','b':'Takiej serii dawno nie było. Kibice zaczynają marzyć.',tone:'good'});
 M.head.forEach(function(h){X.media(h.t,h.b,h.tone)});
 var GOOD=[scorer+' to jest kozak, nie dyskutujemy 🔥','Dawno nie oglądałem kadry z takim uśmiechem',sel+' na prezydenta','Ten mecz pokażę wnukom','Odpalam piosenkę Qastroda i idę świętować 🎵','Kto mówił, że to się nie uda? 😎'];
 var BAD=['Ja bym to lepiej ustawił. A gram w gry piłkarskie od 2009','Selekcjonerze, oddaj klucze do szatni','Wyłączyłem w 60. minucie i nie żałuję','Ile jeszcze? 😩','Mama pyta, czemu płaczę. Oglądałem kadrę','Moja babcia lepiej by ustawiła obronę. A babcia ogląda tylko seriale'];
 var NEU=['Remis to nie porażka. Ani zwycięstwo. Nic to','Dobrze, że chociaż kiełbasa z grilla była dobra','Ok, ale czemu on nie powołał mojego kolegi z podwórka?','Druga połowa lepsza. Pierwsza też była'];
 var handles=['@KibicZTrybun','@TikiTakaJanusz','@TaktykZFotela','@PrawdziwyEkspert99','@OrzełNaPiersi','@FutbolowaMama','@Zbyszek_z_Sektora','@AnalitykZOsiedla'];
 var pool=tone==='good'?GOOD:tone==='bad'?BAD:NEU;M.social=X.shuffle(pool).slice(0,3).map(function(t){return{h:pick(handles),t:t}})}

/* ---------- reakcja na powołania ---------- */
function reactCallup(){var s=S();var sq=s.squad.map(P);var all=X.plist().filter(function(p){return !p.inj});
 all.sort(function(a,b){return X.eff(b)-X.eff(a)});var top=all.slice(0,10);var miss=top.filter(function(p){return s.squad.indexOf(p.id)<0});
 var young=sq.filter(function(p){return X.age(p)<=20}),deb=sq.filter(function(p){return p.caps===0}),hot=X.plist().filter(function(p){return p.form>=2&&p.ovr>=72&&s.squad.indexOf(p.id)<0&&!p.inj});
 var cold=sq.filter(function(p){return p.mins<.3&&p.form<=-1});
 var out=[];
 if(deb.length>=5)X.ach('deb5');
 if(miss.length>=3){out.push({t:'Poza kadrą: '+miss.slice(0,3).map(function(p){return sur(p.n)}).join(', ')+'. Rewolucja czy szaleństwo?',tone:'bad'});s.press=clamp(s.press+5,0,100);s.trust=clamp(s.trust-3,0,100)}
 else if(miss.length){var m=miss[0];out.push({t:'Pominięty: '+m.n+'. Internet płonie',tone:'bad'});s.press=clamp(s.press+2,0,100)}
 if(young.length>=2)out.push({t:'Odważnie! '+young.length+' nastolatków w kadrze',tone:'good'}),s.trust=clamp(s.trust+2,0,100);
 if(deb.length)out.push({t:'Powołania na debiut: '+deb.slice(0,3).map(function(p){return p.n}).join(', '),tone:'neutral'});
 if(hot.length){out.push({t:hot[0].n+' w życiowej formie, a poza kadrą!',tone:'bad'});s.press=clamp(s.press+2,0,100)}
 if(cold.length)out.push({t:'Kolesiostwo? '+sur(cold[0].n)+' powołany mimo ławki w klubie',tone:'bad'});
 if(!out.length)out.push({t:'Kadra bez niespodzianek. Eksperci kiwają głowami',tone:'neutral'});
 out.forEach(function(o){X.media(o.t,'',o.tone)});
 /* zgrzyty pominiętych gwiazd */
 miss.forEach(function(p){p.mood=X.clamp(p.mood-6,0,100)});
 sq.forEach(function(p){p.mood=X.clamp(p.mood+3,0,100)});
 s.lastCall=s.squad.slice();return out}

/* ---------- konferencja prasowa ---------- */
function pressQs(){var s=S(),w=s.win,qs=[];var opp=w.matches[0]?tn(w.matches[0].opp):'rywal';
 var all=X.plist().filter(function(p){return !p.inj}).sort(function(a,b){return X.eff(b)-X.eff(a)}).slice(0,8);
 var miss=all.filter(function(p){return s.squad.indexOf(p.id)<0});
 if(miss.length)qs.push({q:miss[0].n+' poza kadrą. Dlaczego?',a:[
  {t:'To decyzja sportowa. Kropka.',e:{press:3,morale:1}},
  {t:'Forma w klubie musi wrócić. Drzwi są otwarte.',e:{press:-2,trust:1}},
  {t:'A kto by go zastąpił w moim sercu? Żartuję. Na razie nie ma miejsca.',e:{press:1,trust:2}}]});
 if(s.streak.u>=3)qs.push({q:'Seria bez wygranej trwa. Rozważa Pan dymisję?',a:[
  {t:'Nigdy! Przełamiemy to.',e:{trust:2,press:2,mod:.3}},
  {t:'Zdecydują wyniki, nie nagłówki.',e:{press:-1}},
  {t:'A Pan by sobie poradził? Zapraszam na trening.',e:{press:5,trust:3}}]});
 qs.push({q:'Jaki cel na mecz z '+(w.matches[0]?'rywalem ('+opp+')':'rywalem')+'?',a:[
  {t:'Tylko zwycięstwo. Nic innego mnie nie interesuje.',e:{trust:3,mod:-.5,morale:3}},
  {t:'Gramy swoje i patrzymy na siebie.',e:{}},
  {t:'Rywal jest faworytem. Spokojnie z oczekiwaniami.',e:{trust:-2,mod:.5,morale:-2}}]});
 qs.push(pick([{q:'Czy czuje Pan presję mediów?',a:[{t:'Presja to przywilej.',e:{trust:2}},{t:'Nie czytam gazet. Tylko komentarze.',e:{press:2,trust:1}},{t:'Proszę zapytać po meczu.',e:{press:1}}]},
  {q:'Kibice pytają o ustawienie. Zdradzi Pan taktykę?',a:[{t:'Ofensywa od pierwszej minuty!',e:{trust:2,morale:2}},{t:'Taktyka zostaje w szatni.',e:{}},{t:'Gramy na 0:0 i liczymy na stałe fragmenty.',e:{trust:-3,press:2}}]},
  {q:'Ekspert z telewizji twierdzi, że poprowadziłby kadrę lepiej. Komentarz?',a:[{t:'Zapraszam, posadzę go na ławce. Rezerwowych.',e:{press:3,trust:2}},{t:'Każdy w Polsce jest selekcjonerem. To piękne.',e:{trust:2,press:-2}},{t:'Bez komentarza.',e:{}}]}]));
 return qs.slice(0,2)}
function applyAns(e){var s=S();if(e.press)s.press=clamp(s.press+e.press,0,100);if(e.trust)s.trust=clamp(s.trust+e.trust,0,100);if(e.morale)s.morale=clamp(s.morale+e.morale,0,100);if(e.mod)s.pressMod+=e.mod}

/* ---------- koniec zgrupowania / rozstrzygnięcia ---------- */
function afterMatch(M){var s=S(),w=s.win;
 if(w.kind==='PO'){if(M.res==='W'){if(w.po.stage===0){w.po.stage=1;var pl=X.eurPool().filter(function(c){return c!=='POL'&&c!==M.opp});var r=X.eurPool().indexOf('POL');w.matches.push({opp:pick(pl.slice(Math.max(0,r-6),r+10)),home:Math.random()<.5,ko:1,stage:'Finał baraży'})}
   else{if(w.po.big==='EURO'){s.q.euro=1;X.ach('euroq');X.media('JEDZIEMY NA EURO!','Baraż wygrany! Kraj świętuje, a '+s.name+' zostaje bohaterem narodu. Przynajmniej do pierwszego meczu.','good')}else{s.q.wc=1;X.ach('wcq');X.media('MUNDIAL! POLSKA JEDZIE NA MISTRZOSTWA ŚWIATA!','Finał baraży wygrany. Selekcjoner '+s.name+' noszony na rękach.','good')}s.trust=clamp(s.trust+12,0,100);X.unlockSong('walka')}}
  else{X.media(w.po.big==='EURO'?'Koniec marzeń o Euro':'Mundial bez Polski','Baraż przegrany. Prezes związku: "Selekcjoner zostaje. Nie wiemy, jak inaczej".','bad');s.press=clamp(s.press+15,0,100);s.trust=clamp(s.trust-12,0,100)}}
 if(w.kind==='T'){var c=s.comps[w.comp];
  if(w.stage===0&&w.mi>=2){/* koniec grupy */X.playOthers(c,[0,1,2]);var tb=X.table(c);var pos=X.posIn(c);var me=tb[pos-1];var thr=pos===3&&(me.pts>=4||(w.t==='WC'&&me.pts>=3&&me.gf-me.ga>=0));
   if(pos<=2||thr){X.ach('grp');w.stage=1;w.ko=0;addKO(w);X.media('Wyjście z grupy!','Polska gra dalej! Miejsce w grupie: '+pos+'.','good');s.trust=clamp(s.trust+6,0,100)}
   else{w.over='Faza grupowa';s.tour.push({n:w.title,r:'faza grupowa'});X.media('Koniec turnieju po fazie grupowej','Walizki spakowane. Media: "Jak zwykle". Selekcjoner: "Nie jak zwykle, tylko jak w tym roku".','bad');s.press=clamp(s.press+12,0,100)}}
  else if(w.stage===1){if(M.res==='W'){w.ko++;var names=X.KO[w.t];
    if(w.ko>=names.length){w.over='Mistrz';s.tour.push({n:w.title,r:'MISTRZOSTWO'});X.ach(w.t==='EURO'?'eurow':'wcw');X.media((w.t==='EURO'?'MISTRZOWIE EUROPY':'MISTRZOWIE ŚWIATA')+'!!!','Nie ma słów. Selekcjoner '+s.name+' przechodzi do historii. Ulice pełne kibiców do rana.','good');s.trust=100;s.press=0}
    else{var stn=names[w.ko];if(stn==='Ćwierćfinał')X.ach('qf');if(stn==='Półfinał')X.ach('sf');addKO(w)}}
   else{var stn2=X.KO[w.t][w.ko];w.over=stn2;s.tour.push({n:w.title,r:stn2});X.media('Koniec przygody: '+stn2,(w.ko>=2?'Wielki turniej mimo wszystko. Kibice dziękują.':'Smutny powrót do domu.'),w.ko>=2?'good':'bad')}}}
}
function addKO(w){var s=S();var pool=(w.t==='EURO'?X.eurPool():X.worldPool()).filter(function(c){return c!=='POL'});var names=X.KO[w.t];var left=names.length-w.ko;
 var lim=Math.max(4,Math.min(pool.length,left*5));var opp=pick(pool.slice(0,lim));w.matches.push({opp:opp,home:true,neutral:1,ko:1,stage:names[w.ko]})}
function finishWindow(){var s=S(),w=s.win;var out=[];judgeGoal(w);
 if(w.kind==='G'){var c=s.comps[w.comp];X.playOthers(c,w.rounds);c.nr+=2;
  if(c.nr>=c.rounds&&!c.done){c.done=1;var pos=X.posIn(c);
   if(c.type==='NL'){if(pos===1){if(s.nlTier!=='A'){s.nlTier=String.fromCharCode(s.nlTier.charCodeAt(0)-1);X.media('Awans do Dywizji '+s.nlTier+' Ligi Narodów!','Polska wygrywa grupę.','good')}X.ach('nlup')}
    else if(pos===4&&s.nlTier!=='D'){s.nlTier=String.fromCharCode(s.nlTier.charCodeAt(0)+1);X.media('Spadek do Dywizji '+s.nlTier+'. Wstyd na całą Europę','Ostatnie miejsce w grupie Ligi Narodów.','bad');s.press=clamp(s.press+8,0,100)}}
   else if(c.type==='EQ'){s.q.euro=pos<=2?1:0;s.q.euroPO=pos===3?1:0;if(pos<=2){X.ach('euroq');X.media('AWANS NA EURO!','Polska kończy eliminacje na '+pos+'. miejscu i jedzie na turniej.','good');s.trust=clamp(s.trust+10,0,100)}else if(pos===3)X.media('Baraże o Euro','Trzecie miejsce. W marcu walka o wszystko.','neutral');else{X.media('Bez Euro! Katastrofa w eliminacjach','Miejsce '+pos+' w grupie. Kraj w żałobie.','bad');s.press=clamp(s.press+18,0,100);s.trust=clamp(s.trust-15,0,100)}}
   else if(c.type==='WQ'){s.q.wc=pos===1?1:0;s.q.wcPO=pos===2?1:0;if(pos===1){X.ach('wcq');X.media('MUNDIAL! Polska wygrywa grupę eliminacyjną','Bezpośredni awans na mistrzostwa świata.','good');s.trust=clamp(s.trust+12,0,100)}else if(pos===2)X.media('Drugie miejsce: czekają nas baraże','W marcu dwa mecze o mundial.','neutral');else{X.media('Mundial bez nas. Znowu','Miejsce '+pos+'. Eksperci już szukają winnych. Wiadomo kogo.','bad');s.press=clamp(s.press+18,0,100);s.trust=clamp(s.trust-15,0,100)}}}}
 if(w.noTour){X.media((w.noTour==='Euro'?'Euro':'Mundial')+' bez Polski. Oglądamy w telewizji','Kadra gra towarzysko, a kibice kupują koszulki innych reprezentacji.','bad')}
 /* presja wraca powoli do normy */
 s.press=Math.round(s.press*.9+30*.1);s.trust=Math.round(s.trust*.88+50*.12);
 var seasons=s.y-2026+(s.m>=9?0:0);if(seasons>=5)X.ach('s5');if(seasons>=10)X.ach('s10');
 X.save()}

/* ---------- cel zgrupowania ---------- */
function probs(m){var R=lineRatings(X.autoXI(S().tac.f,S().squad.length?S().squad.map(P).filter(function(p){return !p.inj}):X.plist().filter(function(p){return !p.inj})),S().tac);var so=X.teamStr(m.opp);var hm=m.neutral?0:m.home?1:-1;
 var lp=X.lam(R.att,so,hm>0),lo=X.lam(so,R.def,hm<0);function pf(l,k){var f=1;for(var i=2;i<=k;i++)f*=i;return Math.exp(-l)*Math.pow(l,k)/f}var w=0,d=0;for(var a=0;a<9;a++)for(var b=0;b<9;b++){var q=pf(lp,a)*pf(lo,b);if(a>b)w+=q;else if(a===b)d+=q}return{w:w,d:d}}
function setGoal(w){if(w.goal)return w.goal;var g;
 if(w.kind==='T'){var top=X.teamStr(w.matches[0].opp);g={kind:'tour',text:X.polRank()<=12?'Wyjście z grupy i walka o ćwierćfinał':'Wyjście z grupy'}}
 else if(w.kind==='PO')g={kind:'po',text:'Awans! Wygraj baraże'};
 else{var ex=0,best=null,bp=0;w.matches.forEach(function(m){var p=probs(m);ex+=3*p.w+p.d;if(p.w>bp){bp=p.w;best=m}});var pts=Math.max(1,Math.round(ex-.35));
  g={kind:'pts',pts:pts,text:'Zdobądź co najmniej '+pts+' pkt'+(best&&bp>.55?' (obowiązkowo wygraj z rywalem: '+tn(best.opp)+')':'')}}
 w.goal=g;return g}
function judgeGoal(w){var g=w.goal;if(!g||g.done)return g;var s=S();var pts=0;w.matches.forEach(function(m){if(m.res==='W')pts+=3;else if(m.res==='D')pts+=1});
 var ok=g.kind==='pts'?pts>=g.pts:g.kind==='po'?(w.matches.length>=2&&w.matches[w.matches.length-1].res==='W'):(w.over&&w.over!=='Faza grupowa');
 g.ok=ok;g.done=1;g.got=pts;s.trust=clamp(s.trust+(ok?6:-7),0,100);s.board=clamp((s.board||70)+(ok?5:-8),0,100);
 X.media(ok?'Cel zgrupowania wykonany':'Cel zgrupowania nie został osiągnięty',ok?'Prezes związku zadowolony. Kibice też.':'Prezes związku: "Oczekiwaliśmy więcej." Media liczą każdy punkt.',ok?'good':'bad');return g}
X.M={setGoal:setGoal,judgeGoal:judgeGoal,probs:probs,newMatch:newMatch,playHalf:playHalf,startHalf:startHalf,extraTime:extraTime,resimFrom:resimFrom,stats:stats,benchOptions:benchOptions,penalties:penalties,finishMatch:finishMatch,afterMatch:afterMatch,finishWindow:finishWindow,reactCallup:reactCallup,pressQs:pressQs,applyAns:applyAns,
 doSub:doSub,bestBench:bestBench,lineRatings:lineRatings,scoreStr:scoreStr,tn:tn,winner:winner};
})();
