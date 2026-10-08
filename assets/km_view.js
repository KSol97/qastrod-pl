/* Symulator selekcjonera: silnik skrótów meczu v6
   Każda akcja to zamknięta całość: ustawienie, rozegranie (podania, drybling, pressing), wykończenie (strzał albo faul).
   Między akcjami zegar przeskakuje do kolejnej minuty. Piłka porusza się tylko fizycznie, bez teleportów. */
(function(){
'use strict';
var X=window.SS;if(!X)return;
var L=105,W=68,P=X.P,T=X.TEAMS,sur=X.sur;
function clamp(v,a,b){return v<a?a:v>b?b:v}
function lerp(a,b,k){return a+(b-a)*k}
function rnd(a,b){return a+Math.random()*(b-a)}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
var OPPF=[['GK',.04,.5],['RB',.24,.85],['CB',.18,.62],['CB',.18,.38],['LB',.24,.15],['RW',.48,.86],['CM',.42,.62],['CM',.42,.38],['LW',.48,.14],['ST',.7,.62],['ST',.7,.38]];

function create(o){
 var M=o.M,s=X.S(),cv=o.cv;var oc=M.kO?{c1:M.kO.c1,c2:M.kO.c2,stars:(T[M.opp]||{}).stars||[]}:(T[M.opp]||{c1:'#333',c2:'#fff',stars:[]});var pk=M.kP||{c1:'#fff',c2:'#dc143c'};
 var V={M:M,clock:0,phase:'h1',run:false,hl:null,dots:[],ball:{x:L/2,y:W/2,z:0,vx:0,vy:0,vz:0,fl:null,owner:null},shown:{P:0,O:0},
  fx:{flash:0,shake:0,banner:null,big:null,replay:0,fade:0,card:null,minute:null},poss:'P',carrier:null,focus:[],camMode:'tv',replay:null,cut:null,posNow:50,ts:1,rt:0,gap:null};
 /* ---------- zawodnicy ---------- */
 function numOf(id){return (X.shirtNo&&X.shirtNo(id))||1}
 function buildDots(){V.dots=[];var F=X.FORM[s.tac.f];var stn=(oc.stars||[]);
  M.xi.forEach(function(e){var f=F[e.i];V.dots.push({t:'P',slot:e.slot,id:e.id,name:sur(P(e.id).n),num:0,bx:f[1]*L,by:f[2]*W,x:0,y:0,vx:0,vy:0,task:null})});
  OPPF.forEach(function(f,i){var nm=i===9?stn[0]:i===10?stn[1]:i===8?stn[2]:null;V.dots.push({t:'O',slot:f[0],id:null,name:nm?sur(nm):null,bx:(1-f[1])*L,by:f[2]*W,x:0,y:0,vx:0,vy:0,task:null})});
  V.dots.forEach(function(d,i){d.num=d.t==='P'?numOf(d.id):d.slot==='GK'?1:[0,2,4,5,3,6,8,7,11,9,10][i%11]||i%11+1;d.spd=d.t==='P'&&d.id?7.3+(P(d.id).ovr-70)*.06:7.3})}
 buildDots();
 V.syncXI=function(){var F=X.FORM[s.tac.f];M.xi.forEach(function(e,k){var d=V.dots[k];var f=F[e.i];d.id=e.id;d.name=sur(P(e.id).n);d.slot=e.slot;d.num=numOf(e.id);d.bx=f[1]*L;d.by=f[2]*W})};
 function team(t){return V.dots.filter(function(d){return d.t===t})}
 function field(t){return V.dots.filter(function(d){return d.t===t&&d.slot!=='GK'})}
 function gkOf(t){return V.dots.filter(function(d){return d.t===t&&d.slot==='GK'})[0]}
 function byId(id){return V.dots.filter(function(d){return d.id===id})[0]}
 function dirOf(t){return t==='P'?1:-1}
 function oth(t){return t==='P'?'O':'P'}
 function uOf(t,x){return t==='P'?x/L:1-x/L}
 function xOf(t,u){return t==='P'?u*L:(1-u)*L}
 function goalX(t){return t==='P'?L:0}
 function nm(d){return d&&d.name?d.name:(d&&d.t==='O'?'rywal':'nasz zawodnik')}
 function say(t,cls){t=t.charAt(0).toUpperCase()+t.slice(1);if(!V.replay&&o.onText)o.onText(t,cls||'')}
 function resetFlags(d){d.task=null;d.cele=0;d.dv=null;d.hold=0;d.kick=0;d.head=0;d.tackle=0;d.slide=0;d.fall=0;d.vx=d.vy=0}
 /* ---------- ustawienie drużyn ---------- */
 function shapeTarget(d){var b=V.ball,dir=dirOf(d.t),att=d.t===V.poss;
  var sh=(b.x-L/2)*.45,push=(att?7:-3)*dir;var tx=d.bx+sh+push,ty=d.by+(b.y-W/2)*.28;
  if(d.slot==='GK'){tx=d.t==='P'?clamp(1.5+Math.max(0,(b.x-20)*.04),1.2,4.5):clamp(L-1.5-Math.max(0,(L-20-b.x)*.04),L-4.5,L-1.2);ty=W/2+(b.y-W/2)*.12;return[tx,ty]}
  if(!att){ty=W/2+(d.by-W/2)*.72+(b.y-W/2)*.38;var gO=d.t==='P'?0:L,dB=Math.abs(b.x-gO),lw={D:1,DM:1.25,M:1.5,A:2.2}[X.LINE[d.slot]]||1.3,minD=clamp(dB*.5,6,38)*lw;if(d.t==='P')tx=Math.max(tx,minD);else tx=Math.min(tx,L-minD);if(d.t==='P')tx=Math.min(tx,b.x-2);else tx=Math.max(tx,b.x+2)}
  else{tx=d.t==='P'?Math.min(tx,L-7):Math.max(tx,7);/* bez spalonego: nie dalej niż ostatni obrońca rywala */var dl=field(oth(d.t)).map(function(q){return q.x});if(d.t==='P')tx=Math.min(tx,Math.max.apply(null,dl)-.5);else tx=Math.max(tx,Math.min.apply(null,dl)+.5)}
  return[clamp(tx,2,L-2),clamp(ty,2.5,W-2.5)]}
 function placeShape(){for(var k=0;k<2;k++)V.dots.forEach(function(d){var t=shapeTarget(d);d.x=t[0]+(k?rnd(-1.5,1.5):0);d.y=clamp(t[1]+(k?rnd(-1.5,1.5):0),2,W-2)})}
 function steer(d,tx,ty,maxs,dt){var dx=tx-d.x,dy=ty-d.y,dd=Math.hypot(dx,dy);var ds=Math.min(maxs,dd*1.8);var dvx=dd>.05?dx/dd*ds:0,dvy=dd>.05?dy/dd*ds:0;
  var ax=dvx-d.vx,ay=dvy-d.vy,am=Math.hypot(ax,ay),amax=11*dt;if(am>amax){ax*=amax/am;ay*=amax/am}d.vx+=ax;d.vy+=ay;d.x+=d.vx*dt;d.y+=d.vy*dt}
 function movePlayers(dt){var b=V.ball,H=V.hl,car=b.owner||V.carrier;
  var presser=null,press2=null;if(car&&H&&H.stage==='build'&&!car.hold&&!H.frozen){var ds=field(oth(car.t)).filter(function(d){return !d.task&&!d.tackle&&d!==H.fouler}).sort(function(a,z){return dist(a,car)-dist(z,car)});presser=ds[0]&&dist(ds[0],car)<40?ds[0]:null;press2=ds[1]&&dist(ds[1],car)<20&&Math.hypot(car.vx,car.vy)>3?ds[1]:null}
  var mark=new Map();if(car&&H&&H.stage==='build'&&!H.frozen){var att=field(car.t).filter(function(q){return q!==car}).sort(function(a,z){return uOf(car.t,z.x)-uOf(car.t,a.x)});var free=field(oth(car.t)).filter(function(q){return q!==presser&&q!==press2&&!q.task&&!q.tackle&&!q.fall&&q!==H.fouler});
   att.forEach(function(a){var best=null,bd=20;free.forEach(function(q){if(mark.has(q))return;var dd=dist(q,a);if(dd<bd){bd=dd;best=q}});if(best)mark.set(best,a)})}
  V.dots.forEach(function(d){if(d.tcd>0)d.tcd-=dt;
   if(d.dv){var v=d.dv;v.t+=dt;var p=clamp(v.t/.38,0,1),ep=1-(1-p)*(1-p);d.y=lerp(v.y0,v.y1,ep);d.vx=d.vy=0;return}
   if(d.fall){d.fall+=dt;d.vx*=Math.exp(-3*dt);d.vy*=Math.exp(-3*dt);d.x+=d.vx*dt;d.y+=d.vy*dt;return}
   if(d.tackle>0){d.tackle=Math.max(0,d.tackle-dt);if(d.slide){d.vx*=Math.exp(-2.4*dt);d.vy*=Math.exp(-2.4*dt);d.x+=d.vx*dt;d.y+=d.vy*dt;return}d.vx*=.9;d.vy*=.9;d.x+=d.vx*dt;d.y+=d.vy*dt;return}
   if(d.task){var tx3=d.task.x;if(d.t===V.poss&&d!==b.owner&&!(b.fl&&V.carrier===d)&&H&&H.stage==='build'){var dl3=field(oth(d.t)).map(function(q){return q.x});if(d.t==='P')tx3=Math.min(tx3,Math.max.apply(null,dl3)-.5);else tx3=Math.max(tx3,Math.min.apply(null,dl3)+.5)}steer(d,tx3,d.task.y,d.task.s||d.spd,dt);return}
   if(d===b.owner){steer(d,d.x+dirOf(d.t)*3,d.y,d.hold?0:2.2,dt);return}
   if(d===presser&&dist(d,car)<1.8&&!(d.tcd>0)&&car===b.owner&&!car.hold&&Math.random()<dt*2.5){d.tackle=.42;d.tcd=1.3;d.vx=(car.x-d.x)*2;d.vy=(car.y-d.y)*2;car.vy+=(Math.random()<.5?-1:1)*3;if(Math.random()<.4)say(pick([nm(d)+' próbuje odebrać... '+nm(car)+' ucieka!',nm(car)+' gubi '+(d.t==='O'?'rywala':'obrońcę')+'.',nm(d)+' wybija nogę, ale bez skutku.']));return}
   if(d===presser||d===press2){var lead=d===presser?1.3:4;var cs=Math.hypot(car.vx,car.vy);steer(d,car.x+car.vx*.35+dirOf(car.t)*lead,car.y+car.vy*.35+(d===press2?(car.y<W/2?3:-3):0),d.spd*(cs>3?.98:.85),dt);return}
   var t=shapeTarget(d);var mk=mark.get(d);if(mk){var gx2=goalX(car.t),mx=mk.x+(gx2-mk.x)*Math.min(1,1.8/Math.max(1,Math.abs(gx2-mk.x)));mx=gx2===0?Math.max(mx,4):Math.min(mx,L-4);var my=mk.y+(W/2-mk.y)*.06;t=[lerp(t[0],mx,.7),lerp(t[1],my,.7)];steer(d,t[0],t[1],d.spd*.92,dt);return}
   steer(d,t[0],t[1],d.spd*(d.t===V.poss?.75:.85),dt)});
  for(var i=0;i<V.dots.length;i++)for(var j=i+1;j<V.dots.length;j++){var a=V.dots[i],c=V.dots[j],dx=c.x-a.x,dy=c.y-a.y,dd=Math.hypot(dx,dy);if(dd<1.1&&dd>.001){var pp=(1.1-dd)/2;dx/=dd;dy/=dd;if(a!==b.owner&&!a.dv&&!a.fall&&!a.slide){a.x-=dx*pp;a.y-=dy*pp}if(c!==b.owner&&!c.dv&&!c.fall&&!c.slide){c.x+=dx*pp;c.y+=dy*pp}}}
  V.dots.forEach(function(d){d.x=clamp(d.x,-1,L+1);d.y=clamp(d.y,-1,W+1)})}
 /* ---------- piłka ---------- */
 function kick(to,T_,h,cb,shot,delay){var b=V.ball;var kr=b.owner||V.carrier;var near=kr&&dist(kr,b)<2.2;
  if(near&&!(kr.head>0)){if(b.z>.9&&!kr.hold)kr.head=.7;else kr.kick=.38}
  if(b.owner)b.owner.hold=0;b.owner=null;b.vx=b.vy=b.vz=0;
  b.fl={x1:to[0],y1:to[1],t:-(delay!=null?delay:(near&&(b.z<.9||(kr&&kr.hold))?.12:0)),T:T_,h:h||0,cb:cb,shot:shot,curve:shot?rnd(-.8,.8):(h?0:rnd(-.3,.3)),endZ:0,started:0}}
 function eas(f,k){var a=f.shot?.35:f.h?.5:1.4;return (1-Math.exp(-a*k))/(1-Math.exp(-a))}
 function moveBall(dt){var b=V.ball;if(!dt)return;
  if(b.fl){var f=b.fl;f.t+=dt;if(f.t<0)return;
   if(!f.started){f.started=1;f.x0=b.x;f.y0=b.y;f.z0=b.z}
   var k=clamp(f.t/f.T,0,1),e=eas(f,k);var px=b.x,py=b.y,pz=b.z;
   b.x=lerp(f.x0,f.x1,e);b.y=lerp(f.y0,f.y1,e)+Math.sin(Math.PI*k)*f.curve;
   if(f.shot)b.z=Math.max(0,lerp(f.z0,f.h,k)+Math.sin(Math.PI*k)*Math.min(1,f.T)*(f.h>1.5?.25:.5));
   else if(f.h)b.z=lerp(f.z0,f.endZ,k)+4*f.h*k*(1-k);else b.z=lerp(f.z0,0,Math.min(1,k*3));
   b.vx=(b.x-px)/dt;b.vy=(b.y-py)/dt;b.vz=(b.z-pz)/dt;
   if(k>=1){b.fl=null;if(f.cb)f.cb()}return}
  if(b.owner){var d=b.owner;
   if(d.hold){var fd=dirOf(d.t),lie=d.dv&&!d.dv.stand&&d.dv.t<1.6;b.x=lerp(b.x,d.x+fd*.35,Math.min(1,dt*12));b.y=lerp(b.y,d.y+(lie?d.dv.s*1.6:0),Math.min(1,dt*12));b.z=lerp(b.z,lie?.35:1.05,Math.min(1,dt*10));b.vx=b.vy=b.vz=0;return}
   var sp=Math.hypot(d.vx,d.vy),fx=sp>.3?d.vx/sp:dirOf(d.t),fy=sp>.3?d.vy/sp:0;var pr=(V.dr||0)%1;V.dr=(V.dr||0)+dt*sp/3.4;var p2=V.dr%1;if(sp>1.5&&p2<pr){d.touch=.22}var off=sp>1.5?(p2<.16?.4+1.05*(p2/.16):1.45-1.05*((p2-.16)/.84)):.45;
   var tx=d.x+fx*off,ty=d.y+fy*off,kk=Math.min(1,dt*12);b.vx=(tx-b.x)*kk/Math.max(dt,1e-3);b.vy=(ty-b.y)*kk/Math.max(dt,1e-3);b.x=lerp(b.x,tx,kk);b.y=lerp(b.y,ty,kk);b.z=Math.max(0,b.z-dt*6);return}
  /* swobodna piłka */
  b.vz-=9.8*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;
  if(b.z<=0){b.z=0;if(b.vz<-1.2){b.vz=-b.vz*.5;b.vx*=.82;b.vy*=.82}else b.vz=0}
  if(b.z===0){var fr=Math.exp(-1.2*dt);b.vx*=fr;b.vy*=fr}
  if(b.inNet){var gx=b.inNet>0?L:0;if(Math.abs(b.x-gx)>1.85){b.x=gx+b.inNet*1.85;b.vx*=-.1;b.vy*=.4;b.vz*=.3}b.y=clamp(b.y,W/2-3.5,W/2+3.5);b.z=Math.min(b.z,2.3)}
  if(b.x<-6||b.x>L+6){b.x=clamp(b.x,-6,L+6);b.vx=0;b.vy*=.3}
  if(b.y<-4||b.y>W+4){b.y=clamp(b.y,-4,W+4);b.vy=0;b.vx*=.3}
  if(b.z===0&&Math.hypot(b.vx,b.vy)<.05){b.vx=b.vy=0}}
 /* ---------- akcje ---------- */
 function passTo(c,r,opt){opt=opt||{};var b=V.ball,dir=dirOf(c.t);
  var aim=opt.to||{x:clamp(r.x+dir*rnd(3,6),3,L-3),y:clamp(r.y+rnd(-2,2),3,W-3)};var lofted=!!opt.lofted;
  /* odbiorca musi zdążyć: skracamy zagranie, jeśli ma za daleko */
  for(var it=0;it<3&&!opt.cb;it++){var dd=Math.hypot(aim.x-b.x,aim.y-b.y);var Tb=lofted?dd/16+.45:dd/17+.15;var run=Math.hypot(aim.x-r.x,aim.y-r.y);var can=r.spd*.92*(Tb+.1);
   if(run>can){var k=can/Math.max(.1,run);aim={x:lerp(r.x,aim.x,k),y:lerp(r.y,aim.y,k)}}}
  var dd2=Math.hypot(aim.x-b.x,aim.y-b.y);var T_=lofted?dd2/16+.45:dd2/17+.15;if(opt.cb)T_=Math.max(T_,Math.hypot(aim.x-r.x,aim.y-r.y)/(r.spd*.92)+.1);
  r.task={x:aim.x,y:aim.y,s:r.spd*.95};
  kick([aim.x,aim.y],T_,lofted?clamp(dd2*.1,1.8,6):0,function(){r.task=null;V.carrier=r;if(opt.cb){opt.cb();return}b.owner=r;V.poss=r.t},false);if(lofted&&opt.cb){b.fl.endZ=rnd(1.6,1.9);tm(function(){r.head=.7},Math.max(0,T_+.12-.35))}
  V.carrier=r;if(opt.txt)say(opt.txt)}
 function startAction(h){var t=h.t,dir=dirOf(t),opp=oth(t);V.dots.forEach(resetFlags);timers.length=0;var b=V.ball;b.fl=null;b.inNet=0;b.vx=b.vy=b.vz=0;b.owner=null;V.ts=1;
  var H={h:h,t:t,stage:'build',steps:0,next:.4,frames:[],gk:gkOf(opp),pat:h.pat||'build',frozen:1};V.hl=H;V.poss=t;V.camMode='tv';
  if(h.kind==='foul'||h.kind==='foulInj')H.pat='foul';
  var u0={build:rnd(.36,.46),wing:rnd(.4,.5),counter:rnd(.24,.32),long:rnd(.22,.3),solo:rnd(.45,.55),corner:.5,foul:rnd(.42,.55)}[H.pat]||.4;
  var by=clamp(W/2+rnd(-14,14),10,W-10);
  b.x=xOf(t,u0);b.y=by;b.z=0;placeShape();
  var sh=null;if(t==='P'){sh=byId(h.sid);if(!sh||h.kind==='foul'||h.kind==='foulInj')sh=field('P').filter(function(d){return d.slot==='ST'})[0]||field('P')[9]}
  else{sh=field('O').filter(function(d){return d.slot==='ST'})[Math.random()<.5?0:1]||field('O')[9];if(h.name&&h.kind!=='foul')sh.name=sur(h.name)}
  H.shooter=sh;var su=H.pat==='long'?rnd(.8,.84):H.pat==='wing'||H.pat==='corner'?rnd(.88,.92):rnd(.8,.87);
  H.spot={x:xOf(t,su),y:clamp(W/2+rnd(-8,8),22,46)};H.maxSteps=H.pat==='counter'?2:H.pat==='long'?1:H.pat==='solo'?1:3+(Math.random()*3|0);
  var c;if(h.kind==='foulInj'){c=byId(h.sid)||field('P')[6]}else{var cand=field(t).filter(function(d){return d!==sh});cand.sort(function(a,z){return Math.hypot(a.x-b.x,a.y-by)-Math.hypot(z.x-b.x,z.y-by)});c=cand[0]}
  c.x=b.x-dir*.6;c.y=by;c.vx=0;c.vy=0;b.owner=c;V.carrier=c;
  if(h.kind==='foul'){var fo=byId(h.sid);if(fo){H.fouler=fo;fo.x=clamp(c.x+dir*rnd(6,9),3,L-3);fo.y=clamp(c.y+rnd(-3,3),3,W-3)}}
  if(h.kind==='foulInj'){H.victim=c;var df=field('O').slice().sort(function(a,z){return dist(a,c)-dist(z,c)})[0];H.fouler=df;df.x=clamp(c.x+dir*rnd(6,9),3,L-3);df.y=clamp(c.y+rnd(-3,3),3,W-3)}
  if(H.pat==='corner')setCorner(H);
  else if(H.pat==='counter'&&!H.fouler)say(pick(['Odbiór w środku pola! '+nm(c)+' rusza z kontrą.','Przechwyt! '+(t==='P'?'Nasi':'Rywale')+' wyprowadzają kontrę.']));
  else if(!H.fouler)say(t==='P'?pick(['Spokojne rozegranie piłki.','Nasza drużyna przy piłce. '+nm(c)+' szuka podania.']):pick(['Rywale atakują.','Akcja rywali. Uwaga!']));
  else say(nm(c)+' z piłką.');
  H.frames.push(snap())}
 function setCorner(H){var t=H.t,dir=dirOf(t),gx=goalX(t),side=Math.random()<.5?0:W;var tk=field(t).filter(function(d){return d!==H.shooter&&(d.slot==='LW'||d.slot==='RW'||d.slot==='AM'||d.slot==='CM')})[0]||field(t)[6];
  V.dots.forEach(function(d){d.vx=d.vy=0;if(d.slot==='GK'){d.x=d.t===t?xOf(t,.25):gx-dir*.8;d.y=W/2;return}
   var u2=d.t===t?rnd(.83,.93):rnd(.86,.97);d.x=xOf(t,u2);d.y=W/2+rnd(-11,11);if(d.t===t&&(d.slot==='CB'||d.slot==='LB'||d.slot==='RB')&&Math.random()<.6)d.x=xOf(t,.55)});
  tk.x=gx-dir*.5;tk.y=side?W-.5:.5;var b=V.ball;b.x=gx-dir*.4;b.y=side?W-.9:.9;b.z=0;b.owner=tk;V.carrier=tk;H.taker=tk;H.next=.7;H.cornerReady=1;
  H.shooter.x=H.spot.x-dir*5;H.shooter.y=W/2+rnd(-5,5);say('Rzut rożny dla '+(t==='P'?'nas':'rywala')+'. Do piłki podchodzi '+nm(tk)+'.')}
 function runHL(dt){var H=V.hl,b=V.ball,t=H.t,dir=dirOf(t);H.frames.push(snap());
  if(H.stage==='after'){H.after-=dt;if(H.after<=0)endHL(H);return}
  if(H.stage!=='build')return;
  if(b.fl)return;H.next-=dt;if(H.next>0)return;H.frozen=0;var c=b.owner;if(!c)return;var u=uOf(t,c.x),sh=H.shooter;
  /* faul: obrońca dochodzi do posiadacza i wchodzi wślizgiem */
  if(H.fouler&&(H.steps>=1||H.h.kind==='foulInj')){var fo=H.fouler;if(dist(fo,c)>2.3&&(H.wait||0)<3){fo.task={x:c.x+c.vx*.3,y:c.y+c.vy*.3,s:fo.spd*1.15};if(!c.task)c.task={x:clamp(c.x+dir*6,3,L-3),y:c.y,s:c.spd*.8};H.next=.1;H.wait=(H.wait||0)+.1;return}
   foul(H,fo,c);return}
  if(H.cornerReady){H.cornerReady=0;passTo(c,sh,{lofted:true,to:{x:H.spot.x,y:H.spot.y},txt:'Dośrodkowanie w pole karne!',cb:function(){shoot(H,true)}});return}
  if(sh!==c&&!H.fouler&&(u>=.5||H.steps>=H.maxSteps)){var dl=field(oth(t)).map(function(q){return q.x});var line=t==='P'?Math.max.apply(null,dl)-.6:Math.min.apply(null,dl)+.6;var sx=t==='P'?Math.min(H.spot.x,line):Math.max(H.spot.x,line);sh.task={x:sx,y:H.spot.y,s:sh.spd*.85}}
  var dG=Math.hypot(goalX(t)-c.x,W/2-c.y);
  if(c===sh&&dG<=24&&(u>=uOf(t,H.spot.x)-.04||H.dribbled>=2||dG<17)){shoot(H,false);return}
  if(c===sh){var tx=H.spot.x,ty=H.spot.y;if(dG>24&&uOf(t,tx)-u<.03){tx=xOf(t,.84);ty=clamp(c.y+(W/2-c.y)*.5,22,46)}c.task={x:tx,y:ty,s:c.spd*.95};H.dribbled=(H.dribbled||0)+1;
   var df=field(oth(t)).sort(function(a,z){return dist(a,c)-dist(z,c)})[0];
   if(df&&dist(df,c)<9){df.task={x:c.x+dir*2,y:c.y,s:df.spd};tm(function(){df.task=null;if(dist(df,c)<2.8&&V.ball.owner===c){df.tackle=.55;df.vx=(c.x-df.x)*1.5;df.vy=(c.y-df.y)*1.5;say(pick([nm(c)+' mija obrońcę!',nm(c)+' gubi obrońcę!',nm(df)+' nie trafia w piłkę!']))}},.55)}
   else say(pick([nm(c)+' wchodzi w pole karne!',nm(c)+' przyspiesza z piłką!']));
   H.next=Math.min(1.4,Math.hypot(tx-c.x,ty-c.y)/(c.spd*.95)+.05);return}
  H.steps++;
  if(H.pat==='wing'&&!H.wide&&!H.fouler){var side=c.y<W/2?4:W-4;var wi=field(t).filter(function(d){return d!==c&&d!==sh&&Math.abs(d.y-side)<18}).sort(function(a,z){return uOf(t,z.x)-uOf(t,a.x)})[0];
   if(wi){H.wide=wi;passTo(c,wi,{to:{x:clamp(wi.x+dir*10,3,L-3),y:side},txt:nm(c)+' ➜ '+nm(wi)+' na skrzydło'});H.next=.15;return}}
  if(H.wide&&c===H.wide&&!H.crossed){if(u<.83){c.task={x:goalX(t)-dir*rnd(10,14),y:c.y<W/2?3:W-3,s:c.spd};say(nm(c)+' gna skrzydłem!');H.next=Math.min(2,Math.abs(c.task.x-c.x)/c.spd+.1);return}
   H.crossed=1;c.task=null;sh.task={x:H.spot.x,y:H.spot.y,s:sh.spd*1.1};if(Math.random()<.4){passTo(c,sh,{lofted:true,to:{x:H.spot.x,y:H.spot.y},txt:nm(c)+' dośrodkowuje!',cb:function(){shoot(H,true)}})}else{passTo(c,sh,{to:{x:H.spot.x,y:H.spot.y},txt:nm(c)+' wycofuje piłkę ➜ '+nm(sh)+'!'});H.dribbled=2;H.next=.05}return}
  if(!H.fouler&&(u>=.62||H.steps>H.maxSteps)){var lof=(H.pat==='counter'||H.pat==='long')&&u<.5;passTo(c,sh,{lofted:lof,to:{x:lerp(sh.x,H.spot.x,.5),y:lerp(sh.y,H.spot.y,.5)},txt:lof?pick(['Długie podanie ➜ '+nm(sh)+'!','Piłka za plecy obrońców!']):pick([nm(c)+' ➜ '+nm(sh)+'!',nm(c)+' zagrywa prostopadle!'])});H.next=.1;return}
  var mates=field(t).filter(function(d){return d!==c&&d!==sh&&d!==H.fouler});var fw=mates.filter(function(d){var du=uOf(t,d.x);return du>u+.03&&du<u+.28}).sort(function(a,z){return dist(a,c)-dist(z,c)});
  if(Math.random()<.24||!fw.length){c.task={x:clamp(c.x+dir*rnd(7,11),3,L-3),y:clamp(c.y+rnd(-4,4),4,W-4),s:c.spd*.88};say(pick([nm(c)+' prowadzi piłkę...',nm(c)+' rusza do przodu.']));
   var df2=field(oth(t)).filter(function(d){return d!==H.fouler}).sort(function(a,z){return dist(a,c)-dist(z,c)})[0];if(df2&&dist(df2,c)<10)tm(function(){if(dist(df2,c)<2.6&&V.ball.owner===c){df2.tackle=.5;df2.vx=(c.x-df2.x)*1.2;df2.vy=(c.y-df2.y)*1.2;say(pick([nm(c)+' wygrywa pojedynek.',nm(df2)+' spóźniony, '+nm(c)+' ucieka.']))}},.6);
   tm(function(){if(V.ball.owner===c)c.task=null},1.1);H.next=1.1;return}
  var far=mates.filter(function(d){var du=uOf(t,d.x);return du>u-.05&&dist(d,c)>22&&dist(d,c)<42});
  if(far.length&&Math.random()<.3){var rf=pick(far);passTo(c,rf,{lofted:true,txt:pick(['Długa piłka ➜ '+nm(rf)+'!','Zmiana strony! '+nm(c)+' ➜ '+nm(rf)])});H.next=.2;return}
  var r=fw[0];passTo(c,r,{txt:nm(c)+' ➜ '+nm(r)});H.next=.15}
 function foul(H,fo,c){var b=V.ball,dir=dirOf(c.t);H.stage='after';fo.task=null;fo.tackle=1.6;fo.slide=1;fo.vx=(c.x-fo.x)*2.4;fo.vy=(c.y-fo.y)*2.4;
  c.task=null;c.fall=.001;c.vx=dir*3.2;c.vy=0;b.owner=null;b.vx=dir*rnd(2,4);b.vy=rnd(-1.5,1.5);V.camMode='close';
  if(H.h.kind==='foul'){say('Faul! Sędzia gwiżdże. Faulował: '+nm(fo)+'.','sh');tm(function(){V.fx.card={t:0,name:P(H.h.sid)?P(H.h.sid).n:nm(fo),c:'y'};say('🟨 Żółta kartka: '+(P(H.h.sid)?P(H.h.sid).n:nm(fo))+' za faul','yc')},1.1)}
  else{say('Faul! '+nm(c)+' zostaje na murawie...','go');H.inj=1}
  H.after=H.h.kind==='foul'?3.4:2.6}
 var timers=[];function tm(f,t){timers.push({f:f,t:t})}
 function timersTick(dt){for(var i=timers.length-1;i>=0;i--){timers[i].t-=dt;if(timers[i].t<=0){var f=timers[i].f;timers.splice(i,1);f()}}}
 function shoot(H,header){var t=H.t,dir=dirOf(t),gx=goalX(t),b=V.ball,sh=H.shooter,k=H.h.kind,gk=H.gk;H.stage='shot';V.camMode='shot';V.ts=.5;H.shotT=V.rt;sh.task=null;
  var sgn=Math.random()<.5?-1:1;var gy,hz=header?rnd(.6,1.7):rnd(.2,1.8),tgx;
  if(k==='goal'){gy=W/2+sgn*rnd(1.2,3);hz=Math.min(hz,2);tgx=gx+dir*1.6}
  else if(k==='save'){gy=W/2+rnd(-2.6,2.6);tgx=gx-dir*.7}
  else if(k==='post'){gy=W/2+sgn*3.5;tgx=gx-dir*.25;hz=rnd(.4,1.8)}
  else{if(Math.random()<.5){gy=W/2+sgn*rnd(5,7.5);hz=rnd(.2,1.6)}else{gy=W/2+rnd(-3,3);hz=rnd(3.3,4)}tgx=gx+dir*3}
  var dd=Math.hypot(tgx-b.x,gy-b.y),T_=dd/(header?15:24)+.08,delay=header?0:.12;
  if(header&&!(sh.head>0))sh.head=.35;say(header?nm(sh)+' główkuje!':pick([nm(sh)+' strzela!',nm(sh)+' uderza!',nm(sh)+' próbuje!']),'sh');
  gk.dv=null;gk.hold=0;gk.task={x:gx-dir*.9,y:clamp(W/2+(b.y-W/2)*.3,W/2-2.4,W/2+2.4),s:6};
  var aimY=k==='save'?gy:k==='goal'?gy-sgn*rnd(1,1.7):k==='post'?gy-sgn*rnd(1.3,1.8):gy-sgn*rnd(1.5,3);
  var dodive=k==='miss'?Math.random()<.4:true;
  tm(function(){gk.task=null;var dy=aimY-gk.y;
   if(k==='save'&&Math.abs(dy)<.9){gk.dv={t:0,s:dy>=0?1:-1,y0:gk.y,y1:gk.y,stand:1};return}if(!dodive)return;
   var s2=dy>=0?1:-1,reach=Math.min(Math.abs(dy),2.3),roll=Math.asin(clamp(reach/2.3,.35,1))*1.05;
   gk.dv={t:0,s:s2,y0:gk.y,y1:gk.y+s2*Math.max(.1,Math.abs(dy)-2.4),roll:Math.min(1.4,roll),high:hz>1.4}},Math.max(.05,delay+T_-.4));
  kick([tgx,gy],T_,hz,function(){afterShot(H)},true,delay);H.frames.push(snap())}
 function afterShot(H){var t=H.t,dir=dirOf(t),gx=goalX(t),k=H.h.kind,b=V.ball,gk=H.gk;V.ts=1;H.stage='after';V.camMode=k==='goal'?'celebrate':'close';
  if(k==='goal'){b.inNet=dir;b.vx=dir*Math.max(3,Math.abs(b.vx)*.5);b.vy*=.3;V.fx.flash=1;V.fx.shake=1;V.fx.banner={t:0,team:t,name:t==='P'?(P(H.h.sid)?P(H.h.sid).n:''):H.h.name,min:H.h.min};V.shown[t]++;o.onScore&&o.onScore(V.shown.P,V.shown.O);
   say('GOOOL! '+(t==='P'?nm(H.shooter)+'!':'Bramka dla rywala. '+nm(H.shooter)+'.'),t==='P'?'gp':'go');var sc=H.shooter;sc.cele=1;sc.task={x:gx-dir*rnd(6,10),y:sc.y<W/2?4:W-4,s:sc.spd};
   field(t).forEach(function(d){if(d!==sc&&dist(d,sc)<30)d.task={x:sc.task.x-dir*rnd(1,3),y:sc.task.y+(sc.task.y<W/2?rnd(1,4):-rnd(1,4)),s:d.spd*.8}});H.after=3}
  else if(k==='save'){var stand=gk.dv&&gk.dv.stand;var catchIt=stand||Math.random()<.4;
   if(catchIt){b.owner=gk;gk.hold=1;V.fx.big={t:0,txt:'OBRONA!'};say(pick(['Bramkarz łapie pewnie!','Pewne ręce bramkarza!']))}
   else{V.fx.big={t:0,txt:'PARADA!'};say(pick(['Fantastyczna parada!','Bramkarz odbija piłkę!','Co za interwencja!']));b.vx=-dir*rnd(4,8);b.vy=(gk.dv?gk.dv.s:(Math.random()<.5?-1:1))*rnd(3,7);b.vz=rnd(1.5,3.5)}
   H.after=2}
  else if(k==='post'){V.fx.big={t:0,txt:'SŁUPEK!'};say('SŁUPEK! Co za pech!');b.vx=-dir*rnd(5,9);b.vy=(W/2-b.y)*rnd(.3,.8);b.vz=rnd(.8,2.5);H.after=1.9}
  else{V.fx.big={t:0,txt:'UUUUH!'};say(b.z>2.4?'Nad poprzeczką!':'Minimalnie obok!');H.after=1.7}
  H.frames.push(snap())}
 function endHL(H){V.hl=null;timers.length=0;
  if(H.h.kind==='goal'){var fr=H.frames,st=H.shotT||fr[0].t;cutTo(function(){var t0=Math.max(fr[0].t,st-3.4),t1=Math.min(fr[fr.length-1].t,st+1.7);var i=0;while(i<fr.length-2&&fr[i+1].t<=t0)i++;V.replay={fr:fr,i:i,t:t0,end:t1,tm:H.t};V.camMode='replay';V.fx.replay=1;o.onReplay&&o.onReplay(true)});return}
  nextGap();if(H.inj&&o.onInjury)o.onInjury(H.h.ev)}
 function snap(){var b=V.ball;return{t:V.rt,d:V.dots.map(function(d){var v=d.dv;return[d.x,d.y,d.vx,d.vy,d.cele||0,d.kick||0,d.head||0,v?{t:v.t,s:v.s,y0:v.y0,y1:v.y1,stand:v.stand,roll:v.roll,high:v.high}:null,d.hold||0,d.tackle||0,d.fall||0,d.slide||0]}),b:[b.x,b.y,b.z]}}
 function playReplay(dt){var R=V.replay,fr=R.fr;R.t+=dt*.5;while(R.i<fr.length-2&&fr[R.i+1].t<=R.t)R.i++;
  if(R.t>=R.end||R.i>=fr.length-1){V.replay=null;V.fx.replay=0;o.onReplay&&o.onReplay(false);V.camMode='tv';nextGap();return}
  var a=fr[R.i],c=fr[R.i+1]||a;var k=c.t>a.t?clamp((R.t-a.t)/(c.t-a.t),0,1):0;
  V.dots.forEach(function(d,j){var A=a.d[j],B=c.d[j];d.x=lerp(A[0],B[0],k);d.y=lerp(A[1],B[1],k);d.vx=A[2];d.vy=A[3];d.cele=A[4];d.kick=A[5];d.head=A[6];d.dv=A[7]?{t:lerp(A[7].t,B[7]?B[7].t:A[7].t,k),s:A[7].s,y0:A[7].y0,y1:A[7].y1,stand:A[7].stand,roll:A[7].roll,high:A[7].high}:null;d.hold=A[8];d.tackle=A[9];d.fall=A[10];d.slide=A[11]});
  V.ball.x=lerp(a.b[0],c.b[0],k);V.ball.y=lerp(a.b[1],c.b[1],k);V.ball.z=lerp(a.b[2],c.b[2],k)}
 V.skipReplay=function(){if(V.replay)V.replay.t=V.replay.end};
 /* ---------- przejścia między akcjami ---------- */
 function cutTo(fn){V.cut={fn:fn,t:0,done:0}}
 function cutTick(dt){var c=V.cut;if(!c)return false;c.t+=dt;if(!c.done&&c.t>=.35){c.done=1;c.fn()}V.fx.fade=c.t<.35?c.t/.35:Math.max(0,1-(c.t-.35)/.35);if(c.t>=.7){V.cut=null;V.fx.fade=0}return !c.done}
 function lim(){return V.phase==='h1'?45:V.phase==='h2'?90:120}
 function lo(){return V.phase==='h1'?1:V.phase==='h2'?46:91}
 function nextHL(){var a=lo(),b=lim(),best=null;M.hl.forEach(function(h){if(h._done||h.min<a||h.min>b)return;if(!best||h.min<best.min)best=h});return best}
 function validHL(h){if(h.kind==='foul'||h.kind==='foulInj')return !!byId(h.sid);return true}
 function nextGap(){var h=nextHL();while(h&&!validHL(h)){h._done=1;h=nextHL()}
  V.gap={from:V.clock,to:h?Math.max(h.min,V.clock):lim(),t:0,dur:h?.8:1.1,h:h};V.camMode='tv'}
 function gapTick(dt){var g=V.gap;g.t+=dt;var k=clamp(g.t/g.dur,0,1);
  V.fx.fade=g.t<.2?g.t/.2*.9:k>.75?.9*(1-(k-.75)/.25):.9;V.clock=lerp(g.from,g.to,clamp((g.t-.2)/(g.dur-.4),0,1));V.fx.minute={min:Math.min(lim(),Math.floor(V.clock)),end:!g.h};o.tick&&o.tick(V.clock);
  if(g.h&&g.t>=.2&&!g.started){g.started=1;g.h._done=1;startAction(g.h);V.hl.next=.02+(g.dur-.2)*.8}
  if(k>=1){V.gap=null;V.fx.minute=null;V.fx.fade=0;V.clock=g.to;if(!g.h){V.run=false;render(0);o.onPeriodEnd&&o.onPeriodEnd(V.phase);return 'stop'}}}
 /* ---------- pętla ---------- */
 var raf=0,last=0;
 function step(dt){
  var pdt=dt*V.ts;timersTick(pdt);if(!V.replay){V.rt+=pdt;V.dots.forEach(function(d){if(d.kick>0)d.kick=Math.max(0,d.kick-pdt);if(d.head>0)d.head=Math.max(0,d.head-pdt);if(d.touch>0)d.touch=Math.max(0,d.touch-pdt)})}
  var ct=cutTick(dt);
  if(V.replay){if(!ct)playReplay(dt);return}
  if(ct)return;
  if(V.gap){var r=gapTick(dt);if(r)return r;if(!V.hl)return}
  if(!V.hl){nextGap();return}
  if(!V.gap)runHL(pdt);if(V.hl&&!V.hl.frozen){movePlayers(pdt);moveBall(pdt)}o.tick&&!V.gap&&o.tick(V.clock);
  V.focus=[V.ball.owner||V.carrier];if(V.hl){V.focus.push(V.hl.shooter);if(V.hl.fouler)V.focus.push(V.hl.fouler)}}
 function loop(ts){if(!V.run)return;var dt=Math.min(.05,(ts-last)/1000);last=ts;var spd=o.speed();
  var n=spd>2?3:spd>1?2:1,sd=dt*spd/n;for(var i=0;i<n;i++){if(step(sd)==='stop')return}
  fxTick(dt*spd);render(dt);raf=requestAnimationFrame(loop)}
 function fxTick(dt){var f=V.fx;f.flash=Math.max(0,f.flash-dt*1.6);f.shake=Math.max(0,f.shake-dt*1.2);if(f.banner){f.banner.t+=dt;if(f.banner.t>2.6)f.banner=null}if(f.big){f.big.t+=dt;if(f.big.t>1.3)f.big=null}if(f.card){f.card.t+=dt;if(f.card.t>2.6)f.card=null}}
 /* ---------- widok 2D (zapasowy) ---------- */
 var c=cv.getContext('2d'),CH=cv.height;
 function draw2d(){var z=7.4,ox=(800-L*z)/2,oy=(CH-W*z)/2;function sx(x){return ox+x*z}function sy(y){return oy+y*z}
  c.fillStyle='#14532d';c.fillRect(0,0,800,CH);for(var i=0;i<12;i++){c.fillStyle=i%2?'#1f8a45':'#1b7c3d';c.fillRect(sx(i*L/12),sy(0),L/12*z+1,W*z)}
  c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=2;c.strokeRect(sx(0),sy(0),L*z,W*z);c.beginPath();c.moveTo(sx(L/2),sy(0));c.lineTo(sx(L/2),sy(W));c.stroke();c.beginPath();c.arc(sx(L/2),sy(W/2),9.15*z,0,7);c.stroke();
  c.strokeRect(sx(0),sy(W/2-20.16),16.5*z,40.32*z);c.strokeRect(sx(L-16.5),sy(W/2-20.16),16.5*z,40.32*z);
  V.dots.forEach(function(d){c.beginPath();c.arc(sx(d.x),sy(d.y),8,0,7);c.fillStyle=d.t==='P'?pk.c1:oc.c1;c.fill();c.lineWidth=3;c.strokeStyle=d.t==='P'?pk.c2:oc.c2;c.stroke();
   if(V.focus.indexOf(d)>=0&&d.name){c.font='700 14px Barlow,sans-serif';c.fillStyle='#fff';c.textAlign='center';c.fillText(d.name,sx(d.x),sy(d.y)-13);c.textAlign='left'}});
  c.beginPath();c.arc(sx(V.ball.x),sy(V.ball.y)-V.ball.z*3,5,0,7);c.fillStyle='#fff';c.fill();c.strokeStyle='#111';c.lineWidth=1.5;c.stroke();
  if(V.fx.fade){c.fillStyle='rgba(0,0,0,'+V.fx.fade+')';c.fillRect(0,0,800,CH)}
  if(V.fx.minute){c.fillStyle='#fff';c.font='400 64px Anton,Impact,sans-serif';c.textAlign='center';c.fillText(V.fx.minute.min+'\'',400,CH/2+20);c.textAlign='left'}}
 function render(dt){if(o.r3d)o.r3d.frame(V,dt);else draw2d()}
 V.start=function(phase){if(phase&&phase!==V.phase){V.phase=phase;V.hl=null;V.gap=null;V.clock=Math.max(V.clock,lo()-1)}V.run=true;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)};
 V.stop=function(){V.run=false;cancelAnimationFrame(raf)};
 V.draw=function(){render(0)};V.dbgStep=function(dt,n){for(var i=0;i<(n||1);i++){if(step(dt)==='stop')return 'stop';fxTick(dt)}render(dt)};
 V.setPos=function(v){V.posNow=v};V.buildDots=buildDots;
 /* ustawienie początkowe: środek boiska */
 placeShape();var ks=field('P').filter(function(d){return d.slot==='ST'})[0]||field('P')[9];ks.x=L/2-.6;ks.y=W/2;V.ball.owner=ks;V.carrier=ks;
 if(!o.r3d)draw2d();return V}
window.SSV={create:create};
})();
