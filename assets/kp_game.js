/* Zostań piłkarzem: symulator kariery piłkarza | qastrod.pl */
(function(){
'use strict';
var root=document.getElementById('kp');if(!root)return;
var T3=window.THREE;if(!T3){root.innerHTML='<p style="padding:20px;color:#fff">Brak WebGL lub biblioteki 3D.</p>';return}
var DEBUG=/[?&]debug=1/.test(location.search);
var KEY='qastrod_kariera_v1';
function clamp(v,a,b){return v<a?a:v>b?b:v}
function lerp(a,b,k){return a+(b-a)*k}
function rnd(a,b){return a+Math.random()*(b-a)}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var mob=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||window.innerWidth<760;

/* ---------- dane ---------- */
var STATS=[['STR','Strzał'],['TEC','Technika'],['DRY','Drybling'],['POD','Podania'],['SZY','Szybkość']];
var ARCH={snajper:{n:'Snajper',d:'Zabójczy strzał',b:{STR:9,TEC:3}},drybler:{n:'Drybler',d:'Mija wszystkich',b:{DRY:9,SZY:3}},rozgr:{n:'Rozgrywający',d:'Widzi całe boisko',b:{POD:9,TEC:4}},sprinter:{n:'Sprinter',d:'Szybki jak błyskawica',b:{SZY:10,DRY:2}}};
var POS={N:{n:'Napastnik',w:{STR:.35,TEC:.15,DRY:.2,POD:.1,SZY:.2}},S:{n:'Skrzydłowy',w:{STR:.15,TEC:.1,DRY:.3,POD:.15,SZY:.3}},P:{n:'Pomocnik',w:{STR:.1,TEC:.25,DRY:.15,POD:.35,SZY:.15}}};
var DREAM=[['blau','Blaugrana Barcelona','#a50044','#004d98'],['krol','Królewscy Madryt','#ffffff','#d4af37'],['baw','Bawarczycy Monachium','#dc052d','#ffffff'],['blek','Błękitni Manchester','#6cabdd','#1c2c5b'],['diab','Czerwone Diabły Manchester','#da291c','#fbe122'],['dama','Stara Dama Turyn','#111111','#ffffff'],['ksiaz','Książęta Paryż','#004170','#da291c'],['reds','The Reds Liverpool','#c8102e','#00b2a9']];
var MG={jug:{n:'Żonglerka',ico:'🦶',st:'TEC',st2:'POD',th:[12,30,55],k:2,d:'Tapnij, gdy piłka spada w zielony krąg.'},shot:{n:'Tarcze w bramce',ico:'🎯',st:'STR',st2:'TEC',th:[8,16,24],k:3,d:'Narysuj palcem linię od piłki do tarczy. Piłka poleci tam, gdzie skończysz linię. Wygięta linia podkręca strzał.'},rajd:{n:'Rajd na bramkę',ico:'⚡',st:'DRY',st2:'SZY',th:[8,16,26],k:2,d:'Prowadź piłkę i mijaj obrońców (palcem lub strzałkami). Pod bramką narysuj linię strzału.'}};
var MEDAL=['','🥉','🥈','🥇'],MEDALN=['Bez medalu','Brąz','Srebro','Złoto'];
var BARS_K=[['forma','💪','Forma'],['szkola','📚','Szkoła'],['rodzice','🏠','Rodzice'],['kumple','🤝','Kumple']];
var BARS_P=[['forma','💪','Forma'],['trener','🧢','Trener'],['kibice','📣','Kibice'],['media','📰','Media']];
function BARS(){return S&&S.age>=19?BARS_P:BARS_K}
var EVENTS=KPD.EV;
function stage(){return S.age<=15?'kid':S.age<=18?'teen':(S.c&&S.c.lv>=4?'star':'pro')}

/* ---------- stan ---------- */
var S=null;
function blank(){return {v:1,created:0,name:'',pos:'N',arch:'snajper',foot:'R',dream:'blau',coins:0,fol:12,age:12,
 look:{skin:2,hair:1,hairCol:1,eyes:0,brows:0,boots:0,shirt:0,band:0,num:10,kid:1},cele:0,
 st:{STR:40,TEC:40,DRY:40,POD:40,SZY:40},own:{hair:[],hairCol:[],boots:[],band:[],cele:[]},ach:{},
 best:{jug:0,shot:0,rajd:0},med:{jug:0,shot:0,rajd:0},plays:{jug:0,shot:0,rajd:0},
 rel:{forma:60,szkola:55,rodzice:65,kumple:60,trener:55,kibice:50,media:50},ev:null,evSeen:[],acts:0,m:{n:0,g:0,a:0,w:0,best:0},scout:0,
 c:newCareer(),shop:[],hist:[],tro:[],kad:{caps:0,g:0,on:0},peak:0,retired:0}}
function newCareer(){return{lv:0,club:0,season:1,year:2026,week:0,weeks:7,tr:-1,role:'start',sal:12,ctr:2,tab:null,opp:null,sg:0,sa:0,sr:[],sap:0,kw:-1,kdone:0}}
function load(){try{var s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.v===1){['best','med','plays'].forEach(function(k){if(s[k].rajd==null)s[k].rajd=0;delete s[k].sla});if(!s.c){s.c=newCareer();s.shop=[];s.hist=[];s.tro=[];s.kad={caps:0,g:0,on:0};s.peak=0}['trener','kibice','media'].forEach(function(k){if(s.rel[k]==null)s.rel[k]=55});return s}}catch(e){}return null}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function base(){var st={STR:40,TEC:40,DRY:40,POD:40,SZY:40},b=ARCH[S.arch].b;for(var k in b)st[k]+=b[k];return st}
function ovr(){var w=POS[S.pos].w,s=0;for(var k in w)s+=S.st[k]*w[k];return Math.min(99,Math.round(s+6))}
/* wpływ wskaźników na grę */
function mods(){var r=S.rel,kid=S.age<19;var f=r.forma,t=kid?r.szkola:r.media,ch=kid?r.kumple:r.trener,hm=kid?r.rodzice:r.kibice;
 return{zone:clamp(1+(f-50)*.007,.72,1.3),time:clamp(.8+t/250,.8,1.2),chem:clamp(.82+ch/280,.82,1.18),home:clamp(1.06-hm/330,.76,1.06)}}
function barFx(k,v){var lo=v<35,hi=v>=70;switch(k){case 'forma':return lo?'mniejsze pola w minigrach':hi?'większe pola w minigrach':'pola w minigrach normalne';
 case 'szkola':return (lo?'mniej':hi?'więcej':'normalnie')+' czasu na decyzje';case 'media':return (lo?'presja, mniej':hi?'luz, więcej':'normalnie')+' czasu na decyzje';
 case 'kumple':return lo?'koledzy grają słabiej':hi?'koledzy grają lepiej':'zgranie z kolegami';case 'trener':return lo?'mniej minut, słabsze zgranie':hi?'więcej minut, lepsze zgranie':'normalne minuty';
 case 'rodzice':return lo?'forma spada co tydzień':hi?'kieszonkowe i forma w górę':'spokój w domu';case 'kibice':return lo?'rywale strzelają celniej':hi?'doping: rywale pudłują':'zwykły doping'}return ''}
function potF(v){return clamp((93-v)/48,.07,1)}
function stoch(x){var f=Math.floor(x);return f+(Math.random()<x-f?1:0)}
function tier(o){return o>=85?'icon':o>=75?'gold':o>=60?'silver':'bronze'}
function owned(cat,i){var it=KPChar.LOOK[cat][i];if(!it)return false;if(it.ach)return !!S.ach[it.ach];return !it.p||S.own[cat].indexOf(i)>=0}

/* ---------- 3D ---------- */
var CH=KPChar.make(T3),WD=KPWorld.make(T3,mob),GW=6,GH=2.2;function useScene(o){GW=o.GW||6;GH=o.GH||2.2}
root.innerHTML='<div class="kp-app"><canvas class="kp-c"></canvas><canvas class="kp-hud"></canvas><div class="kp-ui"></div><div class="kp-fx"></div></div>';
var app=root.querySelector('.kp-app'),cv=root.querySelector('.kp-c'),hud=root.querySelector('.kp-hud'),uiEl=root.querySelector('.kp-ui'),fxEl=root.querySelector('.kp-fx');
var hx=hud.getContext('2d');
var renderer;try{renderer=new T3.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'})}catch(e){uiEl.innerHTML='<p style="padding:20px">Twoja przeglądarka nie obsługuje grafiki 3D.</p>';return}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,mob?1.75:2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T3.PCFSoftShadowMap;renderer.outputEncoding=T3.sRGBEncoding;renderer.toneMapping=T3.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
var cam=new T3.PerspectiveCamera(40,1,.1,800);
var VW=1,VH=1,DPR=1;
function resize(){var r=app.getBoundingClientRect();VW=Math.max(200,r.width);VH=Math.max(200,r.height);renderer.setSize(VW,VH,false);DPR=Math.min(window.devicePixelRatio||1,2);hud.width=VW*DPR;hud.height=VH*DPR;hx.setTransform(DPR,0,0,DPR,0,0);cam.aspect=VW/VH;cam.updateProjectionMatrix();if(cur&&cur.resize)cur.resize()}
var W={};function world(k){if(!W[k])W[k]=WD[k]();return W[k]}
var ME=null;function cmH(){var h0=S.hcm||(S.hcm=176+Math.round((S.name||'x').length%5)*2);return S.age>=18?h0:Math.round(h0*Math.max(.8,.8+(S.age-12)*.2/6))}
function lookA(){S.look.age=S.age;return S.look}
function me(){if(!ME){ME=CH.build(lookA())}return ME}
var tall=function(){return VH>VW*1.05};
/* projekcja na ekran */
var pv=new T3.Vector3();function scr(x,y,z){pv.set(x,y,z).project(cam);return{x:(pv.x+1)/2*VW,y:(1-pv.y)/2*VH,b:pv.z<1}}
/* promień z ekranu na płaszczyznę x=X */
var rc=new T3.Raycaster(),ndc=new T3.Vector2();function rayX(sx,sy,X){ndc.set(sx/VW*2-1,-(sy/VH*2-1));rc.setFromCamera(ndc,cam);var o=rc.ray.origin,d=rc.ray.direction;if(Math.abs(d.x)<1e-5)return null;var t=(X-o.x)/d.x;return{y:o.y+d.y*t,z:o.z+d.z*t}}
function camSet(px,py,pz,tx,ty,tz,k){if(!camSet.p){camSet.p=new T3.Vector3(px,py,pz);camSet.t=new T3.Vector3(tx,ty,tz)}var kk=k==null?1:k;camSet.p.lerp(pv.set(px,py,pz),kk);var tt=new T3.Vector3(tx,ty,tz);camSet.t.lerp(tt,kk);cam.position.copy(camSet.p);cam.lookAt(camSet.t)}
function fov(w,t){var f=tall()?t:w;if(cam.fov!==f){cam.fov=f;cam.updateProjectionMatrix()}}

/* ---------- pętla ---------- */
var cur=null,last=0,slow=1;
function setMode(m){if(cur&&cur.exit)cur.exit();cur=m;camSet.p=null;cam.clearViewOffset();hx.clearRect(0,0,VW,VH);if(m.enter)m.enter();resize()}
function loop(t){requestAnimationFrame(loop);var dt=Math.min(.05,(t-(last||t))/1000);last=t;if(!cur)return;
 hx.clearRect(0,0,VW,VH);cur.update(dt);if(cur.scene)renderer.render(cur.scene,cam)}
var ro=window.ResizeObserver?new ResizeObserver(resize):null;if(ro)ro.observe(app);else window.addEventListener('resize',resize);

/* ---------- efekty tekstowe ---------- */
function pop(txt,cls,x,y){var e=document.createElement('div');e.className='kp-pop '+(cls||'');e.textContent=txt;if(x!=null){e.style.left=x+'px';e.style.top=y+'px'}fxEl.appendChild(e);setTimeout(function(){e.remove()},1300)}
function banner(big,small,cls){var e=document.createElement('div');e.className='kp-ban '+(cls||'');e.innerHTML='<b>'+esc(big)+'</b>'+(small?'<span>'+esc(small)+'</span>':'');fxEl.appendChild(e);setTimeout(function(){e.classList.add('out')},1700);setTimeout(function(){e.remove()},2200)}
function flash(){var e=document.createElement('div');e.className='kp-flash';fxEl.appendChild(e);setTimeout(function(){e.remove()},500)}

/* ---------- wejście ---------- */
var ptr={down:false,pts:[],id:null};
function evp(e){var r=app.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top,t:performance.now()}}
app.addEventListener('pointerdown',function(e){if(e.target.closest('.kp-ui button,.kp-ui input,.kp-ui .kp-panel,.kp-ui a,.kp-card'))return;var p=evp(e);ptr.down=true;ptr.pts=[p];ptr.id=e.pointerId;try{app.setPointerCapture(e.pointerId)}catch(_){}if(cur&&cur.down)cur.down(p);e.preventDefault()});
app.addEventListener('pointermove',function(e){var p=evp(e);if(ptr.down)ptr.pts.push(p);if(cur&&cur.move)cur.move(p,ptr.down)});
app.addEventListener('pointerup',function(e){if(!ptr.down)return;ptr.down=false;var p=evp(e);ptr.pts.push(p);if(cur&&cur.up)cur.up(p,ptr.pts)});
app.addEventListener('pointercancel',function(){ptr.down=false});
window.addEventListener('keydown',function(e){if(cur&&cur.key&&!/INPUT/.test(document.activeElement&&document.activeElement.tagName||'')){if(cur.key(e.key,true)!==false&&/^(Arrow|\s)/.test(e.key))e.preventDefault()}});
window.addEventListener('keyup',function(e){if(cur&&cur.key)cur.key(e.key,false)});
function swipe(pts){var s=pts[0],e=pts[pts.length-1],dx=e.x-s.x,dy=e.y-s.y,len=Math.hypot(dx,dy),dur=Math.max(30,e.t-s.t);var dev=0;if(len>10){var nx=-dy/len,ny=dx/len;pts.forEach(function(p){var d=(p.x-s.x)*nx+(p.y-s.y)*ny;if(Math.abs(d)>Math.abs(dev))dev=d})}return{s:s,e:e,dx:dx,dy:dy,len:len,dur:dur,dev:dev,speed:len/dur,pts:pts}}
function trail(pts,col){if(pts.length<2)return;hx.lineCap='round';hx.lineJoin='round';for(var i=1;i<pts.length;i++){var a=i/pts.length;hx.strokeStyle=col||'rgba(255,255,255,'+(.25+.6*a)+')';hx.lineWidth=4+8*a;hx.beginPath();hx.moveTo(pts[i-1].x,pts[i-1].y);hx.lineTo(pts[i].x,pts[i].y);hx.stroke()}}

/* ---------- strzał z machnięcia (wspólny dla tarcz i meczu) ---------- */
function shotFrom(sw,ball,GX,press){if(sw.dy>-25||sw.len<35)return null;
 var gb=scr(GX,0,0),E={x:sw.e.x,y:sw.e.y};
 if(E.y>gb.y-6){var gc=scr(GX,.9,0);var r=(gc.y-sw.s.y)/sw.dy;E={x:sw.s.x+sw.dx*r,y:gc.y}}
 var hit=rayX(E.x,E.y,GX);if(!hit)return null;
 var str=S.st.STR,noise=(1-clamp((str-30)/65,0,1))*.32*(press||1);
 var z=hit.z+rnd(-1,1)*noise,y=clamp(hit.y+rnd(-1,1)*noise*.6,.02,3.8);
 /* podkręcenie: punkt linii najdalej od prostej, rzutowany na płaszczyznę w połowie drogi */
 var s0=sw.s,best=null,bd=0,L=Math.max(1,sw.len),nx=-sw.dy/L,ny=sw.dx/L;sw.pts.forEach(function(p){var d=(p.x-s0.x)*nx+(p.y-s0.y)*ny;if(Math.abs(d)>Math.abs(bd)){bd=d;best=p}});
 var bend=0;if(best&&Math.abs(bd)>8){var mx=(ball.x+GX)/2,h1=rayX(best.x,best.y,mx),h0=rayX(best.x-bd*nx,best.y-bd*ny,mx);if(h1&&h0)bend=clamp((h1.z-h0.z)*2.2,-4,4)}
 var dist=Math.hypot(GX-ball.x,z-ball.z),v=clamp(15+sw.speed*7,15,29);var T=dist/v*(1+Math.abs(bend)*.04);
 return {P0:{x:ball.x,y:ball.y||0,z:ball.z},C:{x:(ball.x+GX)/2,z:(ball.z+z)/2+bend},P1:{x:GX,y:y,z:z},T:T,arc:y>1.4?.18:y<.35?0:.08,curve:Math.abs(bend)}}
function bez(a,c,b,t){var u=1-t;return u*u*a+2*u*t*c+t*t*b}
function shotPos(s,t){var tt=Math.min(t,1.25);return{x:bez(s.P0.x,s.C.x,s.P1.x,tt),z:bez(s.P0.z,s.C.z,s.P1.z,tt),y:Math.max(0,lerp(s.P0.y,s.P1.y,tt)+s.arc*4*tt*(1-tt))}}
function shotVel(s){var a=shotPos(s,.97),b=shotPos(s,1),dt=.03*s.T;return{vx:(b.x-a.x)/dt,vy:(b.y-a.y)/dt,vz:(b.z-a.z)/dt}}
/* piłka po przekroczeniu linii: siatka łapie, słupek odbija, pudło leci dalej */
function freeBall(f,dt,GX){f.vy-=9.8*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.z+=f.vz*dt;if(f.y<0){f.y=0;f.vy=-f.vy*.45;f.vx*=.8;f.vz*=.8}
 var gx=f.gx!=null?f.gx:GX,dr=gx>0?1:-1;if(f.net){if((f.x-gx)*dr>1.05){f.x=gx+dr*1.05;f.vx=-f.vx*.15;f.vz*=.3}if(f.y>GH-.12&&f.vy>0){f.vy=0}if(Math.abs(f.z)>GW/2-.12){f.z=Math.sign(f.z)*(GW/2-.12);f.vz=-f.vz*.2}}}
function goalCheck(y,z){var az=Math.abs(z);if(az<GW/2-.03&&y<GH-.03)return 'in';if((az<GW/2+.15&&y<GH+.15))return 'post';return 'out'}
var netK=[0,0];function netShake(o,i){netK[i||0]=1}
function netUpd(o,dt){o.goals.forEach(function(gl,i){if(netK[i]>0){netK[i]=Math.max(0,netK[i]-dt*.8);gl.back.position.x=gl.dir*(1.2+Math.sin(netK[i]*16)*.35*netK[i])}})}
function saveK(s,gkx){var d=s.P1.x-s.P0.x;if(Math.abs(d)<.5)return .92;return clamp((gkx+(d>0?.25:-.25)-s.P0.x)/d,.55,.96)}

/* ====================================================== */
/* ---------- UI: renderowanie ekranów ---------- */
function ui(h){uiEl.innerHTML=h}
function coinsH(){return '<span class="kp-coin">🪙 '+fmtN(S.coins)+'</span>'}
function topbar(){var o=ovr();return '<div class="kp-top"><div class="kp-who"><b>'+esc(S.name||'Ty')+'</b><span>'+S.age+' lat · '+POS[S.pos].n+' · '+esc(S.c.lv===0?'Orlik · Twoje osiedle':clubName())+'</span></div><div class="kp-topr"><span class="kp-fol">📱 '+fmtN(S.fol)+' fanów</span>'+coinsH()+'</div></div>'}
function cardH(sm){var o=ovr(),t=tier(o);var d=DREAM.filter(function(x){return x[0]===S.dream})[0];
 return '<div class="kp-pcard '+t+(sm?' sm':'')+'"><div class="kp-pc-top"><div class="kp-pc-ovr"><b>'+o+'</b><span>'+S.pos+'</span></div><div class="kp-pc-nm">'+esc(S.name||'Ty')+'</div></div>'+
  (sm?'':'<div class="kp-pc-st">'+STATS.map(function(s){var v=S.st[s[0]];return '<div><span>'+s[1]+'</span><i><em style="width:'+v+'%"></em></i><b>'+v+'</b></div>'}).join('')+'</div>')+
  '<div class="kp-pc-ft">'+ARCH[S.arch].n+' · cel:<span class="kp-dreamp"><i style="background:linear-gradient(135deg,'+d[2]+' 50%,'+d[3]+' 50%)"></i>'+esc(d[1])+'</span></div></div>'}

/* ---------- START ---------- */
var Room={scene:null,enter:function(){var r=world('room');this.scene=r.scene;var P=me();r.scene.add(P.g);P.g.position.set(0,0,0);P.yaw=.35;P.sp=0;P.ready=false;P.cele=null;this.t=0},
 update:function(dt){this.t+=dt;var P=me();if(P.g.parent!==this.scene){this.scene.add(P.g);P.g.position.set(0,0,0)}if(this.drag==null){if(this.spin)P.yaw+=dt*this.spin;else{this.rel=(this.rel||0)+dt;if(this.rel>.6){var ty=this.face||0,dy=ty-P.yaw;while(dy>Math.PI)dy-=6.283;while(dy<-Math.PI)dy+=6.283;P.yaw+=dy*Math.min(1,dt*6)}}}CH.animate(P,dt);
  var zoom=this.zoom||0,hs=(ME&&ME.hs)||1;var ty=lerp(1.0,1.6,zoom)*hs,dist=lerp(4.6,2.1,zoom)*(.55+.45*hs);if(tall()&&this.panelH){var f=VH/(VH+this.panelH);dist/=Math.max(.45,f)*(zoom?.95:.8);ty=lerp(1.05,1.6,zoom)*hs+.14}fov(36,46);camSet(0,ty+.15,dist,0,ty,0,Math.min(1,dt*5));
  var pw=this.panelW||0,ph=this.panelH||0;if(pw)cam.setViewOffset(VW+pw,VH,pw,0,VW,VH);else if(ph)cam.setViewOffset(VW,VH+ph,0,ph,VW,VH);else cam.clearViewOffset()},
 down:function(p){this.drag=p.x;this.dy0=me().yaw},move:function(p,d){if(d&&this.drag!=null){me().yaw=this.dy0+(p.x-this.drag)*.012}},up:function(){this.drag=null;this.rel=0},
 resize:function(){var pn=uiEl.querySelector('.kp-panel');this.panelW=0;this.panelH=0;if(pn&&!tall())this.panelW=pn.offsetWidth+24;else if(pn&&tall())this.panelH=pn.offsetHeight}};
function startScreen(){setMode(Room);Room.zoom=0;Room.spin=.35;Room.face=0;var has=S.created;
 ui('<div class="kp-start"><div class="kp-logo"><small>Gra Qastrod</small><h1>ZOSTAŃ<br><em>PIŁKARZEM</em></h1><p>Od podwórka do wielkiego klubu. Twoja kariera, Twoje decyzje.</p></div>'+
  '<div class="kp-start-b">'+(has?'<button class="kp-btn big" data-a="cont">▶ Kontynuuj: '+esc(S.name)+' ('+ovr()+')</button><p class="kp-proto">'+S.age+' lat · '+esc(S.c.lv===0?'Orlik':clubName())+'</p><button class="kp-link" data-a="newc">Nowa kariera</button>':'<button class="kp-btn big" data-a="newc">▶ Stwórz piłkarza</button>')+'<p class="kp-proto">Postęp zapisuje się automatycznie w tej przeglądarce</p></div></div>')}

/* ---------- KREATOR ---------- */
var CR={tab:'look',buy:null};
var TABS=[['look','Twarz'],['hair','Włosy'],['kit','Strój'],['cele','Cieszynka'],['me','Piłkarz']];
function itemsH(cat,cur0,names){var L=KPChar.LOOK[cat];return '<div class="kp-items">'+L.map(function(it,i){var ow=owned(cat,i),sel=cur0===i;var sw=it.c!=null?'<i class="sw" style="background:#'+new T3.Color(it.c).getHexString()+'"></i>':'';
  var lock=ow?'':(it.ach?'<em>🏆</em>':'<em>🪙'+it.p+'</em>');return '<button class="kp-it'+(sel?' on':'')+(ow?'':' lock')+'" data-a="pick" data-c="'+cat+'" data-v="'+i+'">'+sw+'<span>'+esc(it.n)+'</span>'+lock+'</button>'}).join('')+'</div>'}
function creator(){var pb0=uiEl.querySelector('.kp-pb'),sc0=pb0?pb0.scrollTop:0,tab0=CR.lastTab;if(cur!==Room)setMode(Room);Room.spin=0;
 var lk=S.look,t=CR.tab,b='';
 if(t==='look'){b='<p class="kp-lbl">Kolor skóry</p><div class="kp-sws">'+KPChar.LOOK.skin.map(function(c,i){return '<button class="kp-sw'+(lk.skin===i?' on':'')+'" data-a="set" data-c="skin" data-v="'+i+'" style="background:#'+new T3.Color(c).getHexString()+'"></button>'}).join('')+'</div>'+
  '<p class="kp-lbl">Oczy</p><div class="kp-sws">'+KPChar.LOOK.eyes.map(function(c,i){return '<button class="kp-sw'+(lk.eyes===i?' on':'')+'" data-a="set" data-c="eyes" data-v="'+i+'" style="background:'+c+'"></button>'}).join('')+'</div>'+
  '<p class="kp-lbl">Brwi</p><div class="kp-chips">'+KPChar.LOOK.brows.map(function(c,i){return '<button class="kp-chip'+(lk.brows===i?' on':'')+'" data-a="set" data-c="brows" data-v="'+i+'">'+c.n+'</button>'}).join('')+'</div>'}
 else if(t==='hair'){b='<p class="kp-lbl">Fryzura</p>'+itemsH('hair',lk.hair)+'<p class="kp-lbl">Kolor włosów</p>'+itemsH('hairCol',lk.hairCol)}
 else if(t==='kit'){b=(S.c&&S.c.lv>0?'<p class="kp-lbl">Koszulka</p><div class="kp-clubkit"><i style="background:linear-gradient(135deg,'+club().c1+' 50%,'+club().c2+' 50%)"></i><span>Grasz w barwach klubu <b>'+esc(clubName())+'</b></span></div>':'<p class="kp-lbl">Koszulka osiedlowej drużyny</p><div class="kp-sws">'+KPChar.LOOK.shirt.map(function(c,i){return '<button class="kp-sw'+(lk.shirt===i?' on':'')+'" data-a="set" data-c="shirt" data-v="'+i+'" style="background:#'+new T3.Color(c.c).getHexString()+'"></button>'}).join('')+'</div>')+
  '<p class="kp-lbl">Korki</p>'+itemsH('boots',lk.boots)+'<p class="kp-lbl">Opaska</p>'+itemsH('band',lk.band)+
  '<p class="kp-lbl">Numer</p><div class="kp-num"><button data-a="num" data-v="-1">−</button><b>'+lk.num+'</b><button data-a="num" data-v="1">+</button></div>'}
 else if(t==='cele'){b='<p class="kp-lbl">Cieszynka po golu</p><div class="kp-items">'+KPChar.LOOK.cele.map(function(it,i){var ow=!it.p||S.own.cele.indexOf(i)>=0;return '<button class="kp-it'+(S.cele===i?' on':'')+(ow?'':' lock')+'" data-a="pick" data-c="cele" data-v="'+i+'"><span>'+esc(it.n)+'</span>'+(ow?'':'<em>🪙'+it.p+'</em>')+'</button>'}).join('')+'</div><p class="kp-hint">Podgląd: kliknij cieszynkę, a Twój piłkarz ją pokaże.</p>'}
 else{b='<p class="kp-lbl">Imię i nazwisko</p><input class="kp-in" id="kpName" maxlength="22" placeholder="np. Kuba Nowak" value="'+esc(S.name)+'">'+
  '<p class="kp-lbl">Pozycja</p><div class="kp-chips">'+Object.keys(POS).map(function(k){return '<button class="kp-chip'+(S.pos===k?' on':'')+'" data-a="pos" data-v="'+k+'">'+POS[k].n+'</button>'}).join('')+'</div>'+
  '<p class="kp-lbl">Styl gry'+(S.created?' (wybrany na stałe)':'')+'</p><div class="kp-arch">'+Object.keys(ARCH).map(function(k){var a=ARCH[k];return '<button class="kp-ar'+(S.arch===k?' on':'')+'"'+(S.created?' disabled':'')+' data-a="arch" data-v="'+k+'"><b>'+a.n+'</b><span>'+a.d+'</span><em>'+Object.keys(a.b).map(function(s){return '+'+a.b[s]+' '+STATS.filter(function(x){return x[0]===s})[0][1]}).join(', ')+'</em></button>'}).join('')+'</div>'+
  '<p class="kp-lbl">Lepsza noga</p><div class="kp-chips"><button class="kp-chip'+(S.foot==='R'?' on':'')+'" data-a="foot" data-v="R">Prawa</button><button class="kp-chip'+(S.foot==='L'?' on':'')+'" data-a="foot" data-v="L">Lewa</button></div>'+
  '<p class="kp-lbl">Klub marzeń</p><div class="kp-dreams">'+DREAM.map(function(d){return '<button class="kp-dr'+(S.dream===d[0]?' on':'')+'" data-a="dream" data-v="'+d[0]+'"><i style="background:linear-gradient(135deg,'+d[2]+' 50%,'+d[3]+' 50%)"></i><span>'+esc(d[1])+'</span></button>'}).join('')+'</div>'}
 var buy='';if(CR.buy){var it=CR.buy.cat==='cele'?KPChar.LOOK.cele[CR.buy.i]:KPChar.LOOK[CR.buy.cat][CR.buy.i];if(it.ach)buy='<div class="kp-buy"><span>🏆 '+esc(it.n)+': '+(it.ach==='zlote'?'zdobądź złoto we wszystkich trzech treningach':'strzel pierwszego gola w meczu')+'</span></div>';
  else buy='<div class="kp-buy"><span>'+esc(it.n)+' · 🪙 '+it.p+'</span>'+(S.coins>=it.p?'<button class="kp-btn sm" data-a="buy">Kup</button>':'<button class="kp-btn sm ghost" disabled>Brakuje 🪙 '+(it.p-S.coins)+'</button>')+'</div>'}
 ui('<div class="kp-panel"><div class="kp-ph"><div class="kp-phl"><b>'+(S.created?'Szafa':'Stwórz piłkarza')+'</b><span class="kp-agep" title="'+(S.age<18?'Rośniesz co sezon aż do 18 lat':'Pełny wzrost')+'">'+S.age+' lat · '+cmH()+' cm'+(S.age<18?' · jeszcze rośniesz':'')+'</span></div>'+coinsH()+'</div><div class="kp-tabs">'+TABS.map(function(x){return '<button class="'+(t===x[0]?'on':'')+'" data-a="tab" data-v="'+x[0]+'">'+x[1]+'</button>'}).join('')+'</div><div class="kp-pb">'+b+'</div>'+buy+
  '<div class="kp-pf"><button class="kp-btn" data-a="'+(S.created?'toHub':'done')+'">'+(S.created?'Gotowe ›':'Zacznij karierę ›')+'</button></div></div><p class="kp-rot">↔ przeciągnij, żeby obrócić</p>');
 var pb1=uiEl.querySelector('.kp-pb');if(pb1&&tab0===t)pb1.scrollTop=sc0;CR.lastTab=t;
 Room.zoom=(t==='look'||t==='hair')?1:0;resize()}
function previewLook(cat,i){var lk=JSON.parse(JSON.stringify(S.look));lk[cat]=i;me().set(lk,myKit())}

/* ---------- HUB ---------- */
var Hub={enter:function(){var st=S.c.lv>0;var o=world(st?'stadium':'orlik');this.scene=o.scene;useScene(o);if(st&&o.setCrowd){var cl=club(),k='h'+cl.c1+cl.c2;if(o._ck!==k){o._ck=k;o.setCrowd([cl.c1,cl.c2,cl.c1],(L().crowd||.3)*.4)}}
  var P=me();P.set(lookA(),myKit());o.scene.add(P.g);P.g.position.set(-2,0,1);P.yaw=.6;P.sp=0;P.ready=false;P.cele=null;P.juggle=0;P.dive=null;P.slide=null;this.o=o;o.ball.set(-1.4,0,1.4);this.t=0},
 update:function(dt){this.t+=dt;var P=me();CH.animate(P,dt);var a=this.t*.07;fov(40,55);var r=tall()?11:7.5;camSet(-2+Math.cos(a+1.2)*r,tall()?3.6:2.4,1+Math.sin(a+1.2)*r,-2,tall()?.6:1.0,1,1);
  if(tall()){var ph=VH*.5;cam.setViewOffset(VW,VH+ph,0,ph,VW,VH)}else cam.clearViewOffset()}};
function warnH(){var w=[],r=S.rel;if(S.age<=18){if(r.szkola<35)w.push(['📚','Szkoła '+r.szkola+': poniżej 22 szlaban na mecz']);if(r.rodzice<35)w.push(['🏠','Rodzice '+r.rodzice+': poniżej 22 szlaban na mecz']);if(r.kumple<30)w.push(['🤝','Kumple '+r.kumple+': tracisz formę co tydzień'])}else{if(r.trener<40)w.push(['🧢','Trener '+r.trener+': grasz mniej, poniżej 22 cały mecz na ławce']);if(r.media<30)w.push(['📰','Media '+r.media+': psują relację z trenerem'])}
 if(r.forma<35)w.push(['💪','Forma '+r.forma+': trudniejsze mecze i słabsze treningi']);else if(r.forma>=75)w.push(['🔥','Forma '+r.forma+': bonus do treningów i łatwiejsze mecze','ok']);
 return w.length?'<div class="kp-warn">'+w.map(function(x){return '<p class="'+(x[2]||'')+'"><i>'+x[0]+'</i>'+esc(x[1])+'</p>'}).join('')+'</div>':''}
function hub(){MT=null;if(!S.c.fix)newSeason();if(S.retired){retire();return}if(S.c.week>=S.c.weeks){seasonEnd();return}if(S.ev&&EVENTS.some(function(e){return e.id===S.ev})){setMode(Hub);evScreen();return}
 setMode(Hub);var c=S.c,ev=S.ev?EVENTS.filter(function(e){return e.id===S.ev})[0]:null,oi=oppIdx(),th=club(oi.i),rl=role(),nat=S.kad.on&&c.week===c.natWeek&&!c.natDone,trDone=c.tr===c.week;
 if(nat&&!c.natOpp){c.natOpp=pick(KPD.NATIONS);save()}
 var tiles=Object.keys(MG).map(function(k){var g=MG[k];return '<button class="kp-tile'+(trDone?' done':'')+'" data-a="mg" data-v="'+k+'"'+(trDone?' disabled':'')+'><i>'+g.ico+'</i><b>'+g.n+'</b><span>Rekord '+S.best[k]+(S.med[k]?' '+MEDAL[S.med[k]]:'')+'</span><em>'+(trDone?'✓':'+'+STATS.filter(function(x){return x[0]===g.st})[0][1]+(g.st2?' +'+STATS.filter(function(x){return x[0]===g.st2})[0][1]:''))+'</em></button>'}).join('');
 var mc=nat?'<button class="kp-match nat" data-a="natMatch"><small>Reprezentacja Polski · mecz towarzyski</small><b>vs '+esc(c.natOpp[0])+'</b><span>Powołanie! Zagraj z orzełkiem na piersi</span><em>▶ Graj</em></button>'
  :'<button class="kp-match" data-a="match" style="--c1:'+th.c1+'"><small>'+esc(L().short)+' · kolejka '+(c.week+1)+'/'+c.weeks+' · '+(oi.home?'u siebie':'na wyjeździe')+'</small><b>vs '+esc(th.n)+'</b><span>'+ROLE[rl]+' · '+(c.week?myPos()+'. miejsce w tabeli':'start sezonu '+c.year)+'</span><em>▶ Graj</em></button><button class="kp-sim" data-a="sim">⏩ Symuluj mecz (bez rozwoju)</button>';
 ui(topbar()+'<div class="kp-hub"><div class="kp-hub-l">'+cardH()+'<div class="kp-bars2">'+BARS().map(function(b){var v=S.rel[b[0]];return '<div><span>'+b[1]+'</span><div><p><b>'+b[2]+'</b><em>'+v+'</em></p><i><u style="width:'+v+'%;background:'+(v<25?'#ff3b5c':v<50?'#ffb020':'#16d97d')+'"></u></i><small>'+barFx(b[0],v)+'</small></div></div>'}).join('')+'</div>'+lifeH()+'</div>'+
  '<div class="kp-hub-r">'+warnH()+mc+
  '<p class="kp-lbl">'+(trDone?'Trening zaliczony ✓ · kolejny po meczu':'Trening tygodnia · tylko jeden, wybierz mądrze')+'</p><div class="kp-tiles">'+tiles+'</div>'+
  '<div class="kp-hgrid"><button data-a="wardrobe"><i>👕</i>Szafa</button><button data-a="shop"><i>🛍️</i>Sklep</button><button data-a="tabela"><i>📊</i>Tabela</button><button data-a="gablota"><i>🏆</i>Gablota</button><button data-a="menu" class="m"><i>≡</i>Menu</button></div></div></div>')}

/* ====================================================== */
/* ---------- KARIERA: ligi, tabela, tygodnie ---------- */
var LG=KPD.LEAGUES;
var SAL=[15,60,2500,9000,30000],FOLK=[1,3,20,80,300],MCOIN=[1,2,20,60,150];
var ROLE={start:'Podstawowy skład',rot:'Rotacja',bench:'Ławka rezerwowych'};
function fmtN(n){n=Math.round(n||0);var a=Math.abs(n);if(a>=1e6)return (n/1e6).toFixed(a>=1e7?0:1).replace('.',',').replace(',0','')+' mln';if(a>=1e4)return (n/1e3).toFixed(a>=1e5?0:1).replace('.',',').replace(',0','')+' tys.';return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function L(){return LG[S.c.lv]}
function clubAt(lv,i){var c=LG[lv].clubs[i];return{n:c[0],str:c[1],c1:c[2],c2:c[3],key:c[4]||null,lv:lv,i:i}}
function club(i){var cl=clubAt(S.c.lv,i==null?S.c.club:i);if(S.c.lv===0&&cl.i===0){cl.c1='#'+new T3.Color(KPChar.LOOK.shirt[S.look.shirt].c).getHexString();cl.c2='#ffffff'}return cl}
function clubName(i){return club(i).n}
function shortN(n,lv){if(lv===9)return n;if(lv===0){var w=n.split(' ');return n==='Twoje osiedle'?'Ty':w[w.length-1]}var s=n.replace('Akademia ','').split(' ');return s.length>1?s.slice(0,-1).join(' '):s[0]}
function hexN(h){return parseInt(h.slice(1),16)}
function cdist(a,b){var x=hexN(a),y=hexN(b);return Math.hypot((x>>16)-(y>>16),((x>>8)&255)-((y>>8)&255),(x&255)-(y&255))}
function kitOf(cl,away){var c1=away?cl.c2:cl.c1,c2=away?cl.c1:cl.c2;if(cdist(c1,c2)<60)c2=cdist(c1,'#111111')<200?'#ffffff':'#111111';return{sh:{c:hexN(c1),t:hexN(c2)},sp:hexN(c2),so:hexN(c1)}}
function myKit(){if(MT&&cur===Match&&MT.kind!=='league')return kitOf(MT.us);return S.c.lv===0?null:kitOf(club())}
function fixKit(us,th){var t={n:th.n,str:th.str,c1:th.c1,c2:th.c2,lv:th.lv,key:th.key,i:th.i};if(cdist(t.c1,us.c1)<120){t.c1=th.c2;t.c2=th.c1}if(cdist(t.c1,us.c1)<120||(cdist(t.c1,us.c2)<130&&cdist(t.c2,us.c1)<130)){var wh=cdist(us.c1,'#ffffff')<150;t.c1=wh?'#111827':'#f8fafc';t.c2=th.c1===t.c1?th.c2:th.c1}return t}
function pois(l){var e=Math.exp(-l),k=0,p=1;do{k++;p*=Math.random()}while(p>e);return k-1}
function simScore(a,b){return[pois(clamp(1.35+(a-b)*.07,.3,3.2)),pois(clamp(1.35+(b-a)*.07,.3,3.2))]}
function rr(n){var t=[],R=[],i,r;for(i=0;i<n;i++)t.push(i);for(r=0;r<n-1;r++){var pr=[];for(i=0;i<n/2;i++){var a=t[i],b=t[n-1-i];pr.push(r%2?[b,a]:[a,b])}R.push(pr);t.splice(1,0,t.pop())}return R.sort(function(){return Math.random()-.5})}
function newSeason(){var c=S.c;c.fix=rr(8);c.tab=[];for(var i=0;i<8;i++)c.tab.push({p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});c.week=0;c.weeks=7;c.tr=-1;c.sg=0;c.sa=0;c.sr=[];c.res=[];c.natDone=0;c.natWeek=S.kad.on?3:-1;c.tour=null;c.topR=Math.round(rnd(4,7));save()}
function addRes(i,gf,ga){var r=S.c.tab[i];r.p++;r.gf+=gf;r.ga+=ga;if(gf>ga){r.w++;r.pts+=3}else if(gf===ga){r.d++;r.pts++}else r.l++}
function sortTab(){return S.c.tab.map(function(r,i){return{i:i,r:r}}).sort(function(a,b){return b.r.pts-a.r.pts||(b.r.gf-b.r.ga)-(a.r.gf-a.r.ga)||b.r.gf-a.r.gf||a.i-b.i})}
function myPos(){var t=sortTab();for(var k=0;k<t.length;k++)if(t[k].i===S.c.club)return k+1;return 8}
function oppIdx(){var r=S.c.fix[S.c.week]||S.c.fix[0];for(var k=0;k<r.length;k++){if(r[k][0]===S.c.club)return{i:r[k][1],home:true};if(r[k][1]===S.c.club)return{i:r[k][0],home:false}}return{i:1,home:true}}
function role(){if(S.c.lv===0)return 'start';var d=ovr()-club().str+(S.age>=19?(S.rel.trener-50)*.18:0)+(S.rel.forma-50)*.12;return d>=-5?'start':d>=-11?'rot':'bench'}
function weekPay(){return S.c.sal||SAL[S.c.lv]}
function signSal(lv,str){return Math.max(SAL[lv],Math.round(SAL[lv]*clamp(1+(ovr()-str)/22,.6,2.4)/5)*5)}
function blocked(){if(S.age<=18&&(S.rel.rodzice<22||S.rel.szkola<22))return 'szlaban';if(S.age>=19&&S.rel.trener<22)return 'lawka';return null}
/* zapis wyniku tygodnia + reszta kolejki */
function finishWeek(gf,ga,rt,pl){var c=S.c,o=oppIdx();addRes(c.club,gf,ga);addRes(o.i,ga,gf);
 c.fix[c.week].forEach(function(p){if(p[0]===c.club||p[1]===c.club)return;var s=simScore(club(p[0]).str,club(p[1]).str);addRes(p[0],s[0],s[1]);addRes(p[1],s[1],s[0])});
 c.res.push({o:o.i,h:o.home?1:0,gf:gf,ga:ga,r:rt,pl:pl?1:0});if(pl&&rt)c.sr.push(rt);var pay=weekPay(),R=S.rel;if(S.age<=18){if(R.rodzice>=60)R.forma=clamp(R.forma+2,0,100);if(R.rodzice<30)R.forma=clamp(R.forma-3,0,100);if(R.rodzice>=75)pay+=Math.round(SAL[c.lv]*.5);if(R.kumple>=75)S.fol+=Math.round(6*FOLK[c.lv]);if(R.kumple<30)R.forma=clamp(R.forma-4,0,100);if(R.szkola<30)R.rodzice=clamp(R.rodzice-5,0,100)}else{if(R.kibice>=75)S.fol+=Math.round(10*FOLK[c.lv]);if(R.media>=75)S.fol+=Math.round(8*FOLK[c.lv]);if(R.media<30)R.trener=clamp(R.trener-3,0,100)}S.coins+=pay;c.week++;S.peak=Math.max(S.peak||0,ovr());save();return pay}
/* szybka symulacja meczu (bez minigier) */
function quickSim(why){var c=S.c,o=oppIdx(),us=club(),th=club(o.i),play=!why,me0=play?(ovr()-us.str)*.25:0;var sc=simScore(us.str+me0+(o.home?2:0),th.str-(o.home?0:2));
 var g=0,a=0,rt=null;if(play){var pg=clamp(.18+(S.st.STR-us.str)*.01+(S.pos==='N'?.12:0),.08,.6);for(var k=0;k<sc[0];k++){var q=Math.random();if(q<pg)g++;else if(q<pg+.25+(S.st.POD-60)*.005)a++}rt=Math.round(clamp(6+g*1.1+a*.7+(sc[0]>sc[1]?.4:sc[0]<sc[1]?-.4:0)+rnd(-.6,.4)-.4,4,9.5)*10)/10}
 c.sg+=g;c.sa+=a;if(play){S.m.n++;S.m.g+=g;S.m.a+=a;if(sc[0]>sc[1])S.m.w++}S.fol+=Math.round((g*6+2)*FOLK[c.lv]);
 if(why==='szlaban'){S.rel.rodzice=Math.max(S.rel.rodzice,35);S.rel.szkola=Math.max(S.rel.szkola,35)}if(why==='lawka')S.rel.trener=Math.max(S.rel.trener,35);
 S.rel.forma=clamp(S.rel.forma+(play?-1:3),0,100);var pay=finishWeek(sc[0],sc[1],rt,play);maybeEvent(1);save();
 var hd=why==='szlaban'?'<div class="kp-medal">🚫</div><h3>Szlaban!</h3><p class="kp-next">Rodzice nie puścili Cię na mecz. Popraw oceny i relacje w domu.</p>':why==='lawka'?'<div class="kp-medal">🪑</div><h3>Cały mecz na ławce</h3><p class="kp-next">Trener jest na Ciebie zły. Popraw relację z trenerem.</p>':'<p class="kp-eye">Mecz zasymulowany</p>';
 ui('<div class="kp-res"><div class="kp-res-c">'+hd+'<div class="kp-fin"><span>'+esc(shortN(us.n,c.lv))+'</span><b>'+sc[0]+' : '+sc[1]+'</b><span>'+esc(shortN(th.n,c.lv))+'</span></div>'+
  (rt?'<div class="kp-rate"><b>'+rt.toFixed(1)+'</b><span>Twoja ocena</span></div>':'')+'<div class="kp-rew"><span>🪙 +'+fmtN(pay)+' pensja</span>'+(play?'<span>⚽ '+g+'</span><span>🅰 '+a+'</span>':'')+'</div>'+
  (play?'<p class="kp-next">Symulacja nie daje punktów rozwoju. Zagraj sam, żeby rosnąć szybciej.</p>':'')+'<div class="kp-res-b"><button class="kp-btn" data-a="afterMatch">Dalej ›</button></div></div></div>')}
function afterMatch(){if(S.c.week>=S.c.weeks)seasonEnd();else hub()}

/* ---------- koniec sezonu ---------- */
function trophy(ico,t,n){S.tro.push({ico:ico,t:t,n:n,y:S.c.year});return '<div class="kp-tro-n"><i>'+ico+'</i><b>'+esc(t)+'</b><span>'+esc(n)+'</span></div>'}
function avgR(){var a=S.c.sr;return a.length?a.reduce(function(x,y){return x+y},0)/a.length:0}
function seasonEnd(){var c=S.c,pos=myPos(),lg=L(),aw='',ar=avgR();setMode(Hub);
 if(pos===1)aw+=trophy('🏆','Mistrzostwo',lg.n+' '+c.year);
 if(c.sg>=c.topR&&c.sg>0)aw+=trophy('👟','Król strzelców',lg.n+' · '+c.sg+' goli');
 if(c.sa>=6)aw+=trophy('🅰️','Król asyst',lg.n+' · '+c.sa+' asyst');
 if(ar>=7.6&&c.sr.length>=4)aw+=trophy('⭐','Piłkarz sezonu',lg.n+' · średnia '+ar.toFixed(1));
 if(c.lv>=2&&S.age<=21&&ar>=7.3)aw+=trophy('🌟','Złoty Chłopiec','najlepszy młody piłkarz '+c.year);
 var zp=null;if(c.lv>=3){var sc=ar*10+(c.sg+c.sa)*1.6+(pos===1?14:0)+(ovr()-78)*2.2+(c.lv===4?8:0)+(c.tw?12:0);zp=Math.max(1,Math.round((128-sc)/3.5)+1);if(zp===1)aw+=trophy('🥇','Złota Piłka',String(c.year));}
 S.hist.push({y:c.year,age:S.age,club:clubName(),lv:c.lv,pos:pos,g:c.sg,a:c.sa,r:Math.round(ar*10)/10,m:c.sr.length});
 var kadTxt='';if(c.lv>=2&&ovr()>=71&&!S.kad.on){S.kad.on=1;kadTxt='<p class="kp-ach">🇵🇱 POWOŁANIE! Selekcjoner widzi Cię w reprezentacji Polski.</p>'}else if(S.kad.on&&ovr()<68){S.kad.on=0;kadTxt='<p class="kp-next">Selekcjoner na razie nie widzi Cię w kadrze.</p>'}
 var tour=S.kad.on&&c.year%2===0&&!kadTxt;c.tourPend=tour?1:0;save();
 var t=sortTab();
 ui('<div class="kp-scr"><div class="kp-scr-c"><p class="kp-eye">Koniec sezonu '+c.year+' · '+esc(lg.n)+'</p><h2>'+(pos===1?'MISTRZOSTWO!':pos+'. miejsce')+'</h2>'+
  '<div class="kp-sum"><div><b>'+c.sg+'</b><span>gole</span></div><div><b>'+c.sa+'</b><span>asysty</span></div><div><b>'+(ar?ar.toFixed(1):'-')+'</b><span>średnia ocen</span></div><div><b>'+ovr()+'</b><span>OVR</span></div></div>'+
  (aw?'<p class="kp-lbl">Nagrody</p><div class="kp-tro-l">'+aw+'</div>':'')+(zp&&zp>1?'<p class="kp-next">Ranking Złotej Piłki: '+zp+'. miejsce</p>':'')+kadTxt+
  '<p class="kp-lbl">Tabela końcowa</p>'+tabH(t,3)+
  '<div class="kp-res-b"><button class="kp-btn" data-a="'+(tour?'tour':'offers')+'">'+(tour?'🇵🇱 Turniej reprezentacji ›':'Okno transferowe ›')+'</button></div></div></div>');
 if(pos===1){banner('MISTRZOSTWO!',lg.n,'gold')}}
function tabH(t,cut){var c=S.c;return '<table class="kp-tbl"><tr><th>#</th><th>Klub</th><th>M</th><th>Br.</th><th>Pkt</th></tr>'+t.map(function(x,k){var r=x.r,mine=x.i===c.club;return '<tr class="'+(mine?'me':'')+(k===0?' first':'')+'"><td>'+(k+1)+'</td><td><i style="background:'+club(x.i).c1+';border-color:'+club(x.i).c2+'"></i>'+esc(club(x.i).n)+'</td><td>'+r.p+'</td><td>'+r.gf+':'+r.ga+'</td><td><b>'+r.pts+'</b></td></tr>'}).join('')+'</table>'}
/* turniej reprezentacji (lata parzyste) */
function tourName(){return S.c.year%4===2?'Mistrzostwa Świata':'Mistrzostwa Europy'}
function tourScreen(){var c=S.c,o=ovr(),p=clamp(.38+(o-74)*.035,.2,.85),adv=Math.random()<p,semi=adv&&Math.random()<p+.05;
 var opps=KPD.NATIONS.slice().sort(function(){return Math.random()-.5});c.natOpp=opps[0];c.tourPend=0;save();
 var h='<p class="kp-eye">'+tourName()+' '+c.year+'</p><h2>🇵🇱 Polska</h2><div class="kp-tour"><p>Faza grupowa: <b>'+(adv?'awans ✅':'odpadamy ❌')+'</b></p>'+(adv?'<p>Ćwierćfinał i półfinał: <b>'+(semi?'wygrane ✅':'porażka w ćwierćfinale ❌')+'</b></p>':'')+'</div>';
 if(semi){h+='<p class="kp-ach">🔥 POLSKA W FINALE! Rywal: '+esc(c.natOpp[0])+'. Zagrasz w tym meczu.</p><div class="kp-res-b"><button class="kp-btn" data-a="natFinal">▶ Graj finał</button></div>'}
 else h+='<p class="kp-next">Tym razem się nie udało. Za dwa lata kolejna szansa.</p><div class="kp-res-b"><button class="kp-btn" data-a="offers">Okno transferowe ›</button></div>';
 ui('<div class="kp-scr"><div class="kp-scr-c">'+h+'</div></div>')}

/* ---------- okno transferowe ---------- */
function genOffers(){var o=ovr(),a=S.age,lv=S.c.lv,res=[];
 function add(l,i,tag){if(res.some(function(x){return x.lv===l&&x.i===i}))return;var cl=clubAt(l,i);res.push({lv:l,i:i,sal:signSal(l,cl.str),tag:tag||''})}
 function pickC(l,mx){var cs=[];LG[l].clubs.forEach(function(c,i){if(l===lv&&i===S.c.club)return;if(c[4]&&c[4]===S.dream)return;if(c[1]<=mx)cs.push(i)});if(!cs.length){var w=0;LG[l].clubs.forEach(function(c,i){if(c[1]<LG[l].clubs[w][1])w=i});cs=[w]}return pick(cs)}
 if(!S.retiring)add(lv,S.c.club,'stay');
 if(lv===0&&a>=13&&(o>=51||a>=14)){add(1,pickC(1,o+14),'up');if(o>=55)add(1,pickC(1,o+14),'up')}
 if(lv===1&&a>=16&&(o>=60||a>=18)){add(2,pickC(2,o+9),'up');if(o>=64)add(2,pickC(2,o+9),'up')}
 if(lv===2&&a>=18&&o>=70){add(3,pickC(3,o+7),'up');if(o>=74)add(3,pickC(3,o+7),'up')}
 if(lv===3&&o>=79){add(4,pickC(4,o+5),'up')}
 if(lv>=3&&o>=82&&!(lv===4&&club().key===S.dream)){var di=-1;LG[4].clubs.forEach(function(c,i){if(c[4]===S.dream)di=i});if(di>=0)add(4,di,'dream')}
 if(lv>=1&&o>=club().str+4){var b=-1;LG[lv].clubs.forEach(function(c,i){if(i!==S.c.club&&c[1]>club().str&&c[1]<=o+4&&!c[4]&&(b<0||c[1]>LG[lv].clubs[b][1]))b=i});if(b>=0)add(lv,b,'better')}
 if(lv>=2&&a>=30&&o<club().str-7)add(lv-1,pickC(lv-1,o+6),'down');
 return res}
function offersScreen(){var c=S.c,list=genOffers(),canRet=S.age>=33,mustRet=S.age>=37;c.offers=list;save();setMode(Hub);
 var h='<p class="kp-eye">Okno transferowe · lato '+(c.year)+'</p><h2>'+(mustRet?'Czas na pożegnanie':'Twoja decyzja')+'</h2><p class="kp-next">Wiek po wakacjach: '+(S.age+1)+' lat · OVR '+ovr()+'</p><div class="kp-offs">';
 if(!mustRet)list.forEach(function(f,k){var cl=clubAt(f.lv,f.i),tg=f.tag==='stay'?'Zostajesz':f.tag==='dream'?'⭐ KLUB MARZEŃ':f.tag==='up'?'Awans':f.tag==='better'?'Mocniejszy klub':f.tag==='down'?'Niższa liga':'';
  h+='<button class="kp-off '+f.tag+'" data-a="sign" data-v="'+k+'"><i style="background:linear-gradient(135deg,'+cl.c1+' 50%,'+cl.c2+' 50%)"></i><div><small>'+tg+' · '+esc(LG[f.lv].n)+'</small><b>'+esc(cl.n)+'</b><span>Siła '+cl.str+' · pensja 🪙 '+fmtN(f.sal)+'/tydz.</span></div><em>Podpisz ›</em></button>'});
 if(canRet)h+='<button class="kp-off ret" data-a="retire"><i>🏁</i><div><small>Koniec kariery</small><b>Zawieszam buty na kołku</b><span>Zobacz kartę legendy i podsumowanie</span></div><em>›</em></button>';
 h+='</div>';if(list.length===1&&!mustRet&&c.lv<4)h+='<p class="kp-next">'+nextGoalTxt()+'</p>';
 ui('<div class="kp-scr"><div class="kp-scr-c">'+h+'</div></div>')}
function nextGoalTxt(){var lv=S.c.lv,a=S.age;if(lv===0)return a<13?'Skauci akademii patrzą na 13-latków. Trenuj i graj!':'Akademie chcą OVR 51+. Trenuj!';if(lv===1)return a<16?'Ekstraklasa bierze juniorów od 17 lat.':'Ekstraklasa chce OVR 60+.';if(lv===2)return 'Kluby zagraniczne chcą OVR 70+ i wieku 19+.';if(lv===3)return 'Wielkie kluby patrzą na OVR 79+. Klub marzeń: 82+.';return ''}
function sign(k){var f=S.c.offers[k];if(!f)return;var c=S.c,moved=!(f.lv===c.lv&&f.i===c.club),dream=f.tag==='dream';
 c.lv=f.lv;c.club=f.i;c.sal=f.sal;ageUp();newSeason();if(moved)S.rel.trener=55;
 if(dream&&!S.ach.dream){S.ach.dream=1;S.tro.push({ico:'❤️',t:'Klub marzeń',n:club().n,y:c.year})}save();
 me().set(lookA(),myKit());hub();if(moved)banner(dream?'KLUB MARZEŃ!':'TRANSFER!',club().n,'gold');else banner('SEZON '+c.year,club().n,'')}
function ageUp(){var c=S.c,ups=[];S.age++;c.year++;c.season++;
 if(S.age<=17)STATS.forEach(function(s){S.st[s[0]]=clamp(S.st[s[0]]+stoch(potF(S.st[s[0]])),1,99)});
 if(S.age>=30){S.st.SZY=clamp(S.st.SZY-(S.age>=33?3:2),1,99);S.st.DRY=clamp(S.st.DRY-1,1,99);if(S.age>=32)['STR','TEC','POD'].forEach(function(k){S.st[k]=clamp(S.st[k]-1,1,99)});if(S.age>=34)STATS.forEach(function(q){S.st[q[0]]=clamp(S.st[q[0]]-1,1,99)})}
 if(S.age>=17&&S.look.kid){S.look.kid=0}
 if(S.age===19){S.rel.trener=55;S.rel.kibice=50;S.rel.media=50}
 S.c.sal=S.c.sal||SAL[c.lv]}

/* ---------- emerytura: karta legendy ---------- */
function careerTot(){var g=0,a=0,m=0,cl=[];S.hist.forEach(function(h){g+=h.g;a+=h.a;m+=h.m;if(cl.indexOf(h.club)<0)cl.push(h.club)});return{g:g+S.kad.g,a:a,m:m,cl:cl}}
function snapPlayer(){try{var r=world('room'),P=me();P.set(lookA(),S.c.lv?kitOf(club()):null);r.scene.add(P.g);P.g.position.set(0,0,0);P.yaw=.3;P.sp=0;P.ready=false;P.dive=null;P.slide=null;P.cele={type:0,t:0};for(var i=0;i<14;i++)CH.animate(P,.05);
  var c2=new T3.PerspectiveCamera(27,.8,.1,100);c2.position.set(.12,1.3,5.7);c2.lookAt(0,1.3,0);cam.clearViewOffset();renderer.setSize(480,600,false);renderer.render(r.scene,c2);var u=cv.toDataURL('image/png');P.cele=null;resize();return u}catch(e){return null}}
function legendCanvas(img){var W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d'),t=careerTot(),pk=S.peak||ovr();
 var g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#0b1430');g.addColorStop(1,'#3a0a1e');x.fillStyle=g;x.fillRect(0,0,W,H);
 x.fillStyle='rgba(255,255,255,.035)';for(var i=0;i<14;i++)x.fillRect(i*80,0,40,H);
 var tr=tier(pk),cols=tr==='icon'?['#ffffff','#d6c7ff','#8b5cf6']:tr==='gold'?['#fff1a8','#e8b923','#b8860b']:tr==='silver'?['#f2f5f8','#b9c2cc','#8a96a3']:['#e9b37b','#b9733a','#8c4f22'];var cg=x.createLinearGradient(90,140,990,1060);cg.addColorStop(0,cols[0]);cg.addColorStop(.55,cols[1]);cg.addColorStop(1,cols[2]);
 x.fillStyle='#16d97d';x.font='800 34px Barlow,Arial';x.textAlign='center';x.fillText('ZOSTAŃ PIŁKARZEM · KARTA LEGENDY',W/2,95);
 x.fillStyle=cg;rr2(x,90,135,900,930,48);x.fill();
 if(img){x.save();rr2(x,125,170,420,525,30);x.clip();x.drawImage(img,125,170,420,525);x.restore();x.lineWidth=6;x.strokeStyle='rgba(0,0,0,.25)';rr2(x,125,170,420,525,30);x.stroke()}
 var ink=tr==='icon'?'#1e0b3d':'#1a1205';x.fillStyle=ink;x.textAlign='left';x.font='400 200px Anton,Impact';x.fillText(String(pk),585,375);x.font='800 44px Barlow,Arial';x.fillText(POS[S.pos].n.toUpperCase(),592,440);
 var rows=[[t.m,'MECZÓW'],[t.g,'GOLI'],[t.a,'ASYST'],[S.tro.length,'TROFEÓW']];if(S.kad.caps)rows.push([S.kad.caps,'W KADRZE']);
 rows.forEach(function(r,k){var y=520+k*46;x.textAlign='right';x.font='400 42px Anton,Impact';x.fillText(String(r[0]),720,y);x.textAlign='left';x.font='800 29px Barlow,Arial';x.fillText(r[1],738,y)});
 x.textAlign='center';var nm=(S.name||'Legenda').toUpperCase();fitF(x,nm,840,100,'400','Anton,Impact');x.fillText(nm,W/2,805);
 x.font='700 36px Barlow,Arial';x.fillText('Kariera '+2026+'–'+S.c.year+' · '+S.age+' lat',W/2,862);
 var best=S.tro.filter(function(q){return /Złota|Mistrzostwa|Mistrzostwo|Klub marzeń|Król/.test(q.t)}),seen={},bl=[];best.forEach(function(q){if(!seen[q.t]){seen[q.t]=0;bl.push(q)}seen[q.t]++});
 fitF(x,bl.slice(0,4).map(function(q){return q.ico+' '+q.t+(seen[q.t]>1?' ×'+seen[q.t]:'')}).join('    ')||'Od podwórka do wielkiej piłki',840,32,'800','Barlow,Arial');x.fillText(bl.slice(0,4).map(function(q){return q.ico+' '+q.t+(seen[q.t]>1?' ×'+seen[q.t]:'')}).join('    ')||'Od podwórka do wielkiej piłki',W/2,930);
 var cl=t.cl.slice(-4).join(' → ');fitF(x,cl,840,28,'700','Barlow,Arial');x.fillText(cl,W/2,995);
 x.fillStyle='#fff';x.font='400 66px Anton,Impact';x.fillText('A TY? JAK DALEKO ZAJDZIESZ?',W/2,1165);x.font='800 54px Barlow,Arial';x.fillStyle='#ffd24a';x.fillText('qastrod.pl',W/2,1245);
 x.font='600 28px Barlow,Arial';x.fillStyle='#9fb3d9';x.fillText('Darmowa gra w przeglądarce',W/2,1295);return c}
function fitF(x,t,mw,sz,w,f){do{x.font=w+' '+sz+'px '+f;sz-=2}while(x.measureText(t).width>mw&&sz>12)}
function rr2(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
function retire(){S.retired=1;save();var ph=snapPlayer();setMode(Hub);ui('<div class="kp-scr"><div class="kp-scr-c"><h2>Koniec kariery...</h2></div></div>');var im=new Image();im.onload=function(){retire2(im)};im.onerror=function(){retire2(null)};if(ph)im.src=ph;else retire2(null)}
function retire2(img){var cv2=legendCanvas(img),url=cv2.toDataURL('image/png'),t=careerTot();LEG={cv:cv2,url:url};
 ui('<div class="kp-scr"><div class="kp-scr-c wide"><p class="kp-eye">Koniec kariery</p><h2>Dziękujemy, '+esc(S.name)+'!</h2><img class="kp-leg" src="'+url+'" alt="Karta legendy">'+
  '<div class="kp-sum"><div><b>'+t.m+'</b><span>mecze</span></div><div><b>'+t.g+'</b><span>gole</span></div><div><b>'+t.a+'</b><span>asysty</span></div><div><b>'+S.tro.length+'</b><span>trofea</span></div></div>'+
  '<div class="kp-res-b"><button class="kp-btn alt" data-a="legDl">⬇ Pobierz kartę</button>'+(navigator.share?'<button class="kp-btn" data-a="legShare">Udostępnij</button>':'')+'</div><div class="kp-res-b" style="margin-top:10px"><button class="kp-btn ghost" data-a="gablota">🏆 Gablota</button><button class="kp-btn ghost" data-a="newc">Nowa kariera</button></div></div></div>')}
var LEG=null;
function legDl(){if(!LEG)return;var a=document.createElement('a');a.href=LEG.url;a.download='zostan-pilkarzem-'+(S.name||'legenda').toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]+/gi,'-')+'.png';document.body.appendChild(a);a.click();a.remove()}
function legShare(){if(!LEG)return;LEG.cv.toBlob(function(b){var f=new File([b],'karta-legendy.png',{type:'image/png'});var d={title:'Zostań piłkarzem',text:'Moja kariera w grze Zostań piłkarzem! A Ty jak daleko zajdziesz? qastrod.pl',url:'https://qastrod.pl/gra-kariera-pilkarza.html'};if(navigator.canShare&&navigator.canShare({files:[f]}))d.files=[f];navigator.share(d).catch(function(){})})}

/* ---------- ekrany: tabela, gablota, sklep ---------- */
function scr2(title,body){ui('<div class="kp-scr"><div class="kp-scr-c"><button class="kp-x" data-a="toHub">✕</button><h2>'+title+'</h2>'+body+'</div></div>')}
function tableScreen(){var c=S.c,res=c.res.map(function(r){var o=club(r.o);return '<div class="kp-rs '+(r.gf>r.ga?'w':r.gf===r.ga?'d':'l')+'"><b>'+r.gf+':'+r.ga+'</b><span>'+(r.h?'dom':'wyjazd')+' · '+esc(shortN(o.n,c.lv))+'</span>'+(r.r?'<em>'+r.r.toFixed(1)+'</em>':'<em>-</em>')+'</div>'}).join('');
 scr2('Tabela','<p class="kp-eye">'+esc(L().n)+' · sezon '+c.year+' · kolejka '+Math.min(c.week+1,c.weeks)+'/'+c.weeks+'</p>'+tabH(sortTab())+(res?'<p class="kp-lbl">Twoje mecze</p><div class="kp-rsl">'+res+'</div>':''))}
function gablota(){var t=careerTot();var tr=S.tro.length?'<div class="kp-tro-l">'+S.tro.slice().reverse().map(function(q){return '<div class="kp-tro-n"><i>'+q.ico+'</i><b>'+esc(q.t)+'</b><span>'+esc(q.n)+'</span></div>'}).join('')+'</div>':'<p class="kp-next">Pusto. Pierwszy puchar czeka na Ciebie!</p>';
 var hs=S.hist.length?'<table class="kp-tbl hist"><tr><th>Rok</th><th>Klub</th><th>Msc.</th><th>⚽</th><th>🅰</th><th>Ocena</th></tr>'+S.hist.slice().reverse().map(function(h){return '<tr><td>'+h.y+'</td><td>'+esc(h.club)+'<small>'+h.age+' lat</small></td><td>'+h.pos+'.</td><td>'+h.g+'</td><td>'+h.a+'</td><td>'+(h.r||'-')+'</td></tr>'}).join('')+'</table>':'';
 scr2('Gablota','<div class="kp-sum"><div><b>'+t.m+'</b><span>mecze</span></div><div><b>'+t.g+'</b><span>gole</span></div><div><b>'+t.a+'</b><span>asysty</span></div><div><b>'+(S.peak||ovr())+'</b><span>najwyższy OVR</span></div></div>'+
  (S.kad.caps?'<p class="kp-ach">🇵🇱 Reprezentacja: '+S.kad.caps+' meczów, '+S.kad.g+' goli</p>':'')+'<p class="kp-lbl">Trofea i nagrody</p>'+tr+(hs?'<p class="kp-lbl">Historia kariery</p>'+hs:''))}
function shopScreen(){var it=KPD.SHOP.map(function(s){var own=S.shop.indexOf(s.id)>=0,can=S.coins>=s.p;return '<button class="kp-shi'+(own?' own':'')+'" data-a="'+(own?'':'shopBuy')+'" data-v="'+s.id+'"'+(own||!can?' disabled':'')+'><i>'+s.ico+'</i><b>'+esc(s.n)+'</b><span>📱 +'+fmtN(s.fans)+' fanów'+(s.f?' · 💪 +'+s.f*2:'')+'</span><em>'+(own?'✓ Masz':'🪙 '+fmtN(s.p))+'</em></button>'}).join('');
 scr2('Sklep i styl życia','<p class="kp-next">Pensja: 🪙 '+fmtN(weekPay())+' na tydzień. Każdy zakup daje fanów i formę.</p><div class="kp-shop">'+it+'</div><p class="kp-hint">Fryzury, korki i cieszynki kupisz w Szafie.</p>')}
function shopBuy(id){var s=KPD.SHOP.filter(function(q){return q.id===id})[0];if(!s||S.coins<s.p||S.shop.indexOf(id)>=0)return;S.coins-=s.p;S.shop.push(id);S.fol+=s.fans;S.rel.forma=clamp(S.rel.forma+s.f*2,0,100);save();pop(s.ico+' Kupione!','gold',VW/2,VH*.4);shopScreen()}
function lifeH(){if(!S.shop.length)return '';return '<div class="kp-life">'+S.shop.map(function(id){var s=KPD.SHOP.filter(function(q){return q.id===id})[0];return s?'<i title="'+esc(s.n)+'">'+s.ico+'</i>':''}).join('')+'</div>'}

/* ---------- WYDARZENIE (karta do przesunięcia) ---------- */
function evScale(o){var lv=S.c.lv,r={};Object.keys(o).forEach(function(k){var v=o[k];if(S.rel[k]!=null)r[k]=Math.round(v*1.7);else if(k==='coins')r[k]=Math.round(v*[1,1.5,3,4,6][lv]);else if(k==='fol')r[k]=Math.round(v*[1,1.5,3,4,5][lv]);else if(S.st[k]!=null)r[k]=v*2;else r[k]=v});return r}
function evScreen(){var ev=EVENTS.filter(function(e){return e.id===S.ev})[0];if(!ev){hub();return}
 function fx(o){return Object.keys(o).map(function(k){var v=o[k],b=BARS_K.concat(BARS_P).filter(function(x){return x[0]===k})[0];var lab=b?b[1]:k==='coins'?'🪙':k==='fol'?'📱':STATS.filter(function(x){return x[0]===k})[0]?STATS.filter(function(x){return x[0]===k})[0][1]:k;return '<i class="'+(v>0?'p':'m')+'">'+lab+(v>0?' +':' ')+v+'</i>'}).join('')}
 var el=document.createElement('div');el.className='kp-evwrap';el.innerHTML='<div class="kp-bars top">'+BARS().map(function(b){var v=S.rel[b[0]];return '<div><span>'+b[1]+'</span><i><em style="width:'+v+'%"></em></i></div>'}).join('')+'</div>'+
  '<div class="kp-card"><div class="kp-card-i">'+ev.ico+'</div><p>'+esc(ev.t)+'</p><div class="kp-card-o"><span class="l">‹ '+esc(ev.L[0])+'</span><span class="r">'+esc(ev.R[0])+' ›</span></div></div>'+
  '<div class="kp-evbtn"><button data-a="evL"><b>'+esc(ev.L[0])+'</b>'+fx(evScale(ev.L[1]))+'</button><button data-a="evR"><b>'+esc(ev.R[0])+'</b>'+fx(evScale(ev.R[1]))+'</button></div><p class="kp-hint">Musisz zdecydować · przesuń kartę albo kliknij wybór</p>';
 uiEl.innerHTML='';uiEl.appendChild(el);var card=el.querySelector('.kp-card'),x0=null,dx=0;
 card.addEventListener('pointerdown',function(e){x0=e.clientX;card.setPointerCapture(e.pointerId);card.style.transition='none'});
 card.addEventListener('pointermove',function(e){if(x0==null)return;dx=e.clientX-x0;card.style.transform='translateX('+dx+'px) rotate('+dx*.06+'deg)';card.classList.toggle('L',dx<-40);card.classList.toggle('R',dx>40)});
 card.addEventListener('pointerup',function(){card.style.transition='';if(Math.abs(dx)>90)evPick(dx<0?'L':'R');else{card.style.transform='';card.classList.remove('L','R')}x0=null;dx=0})}
function evPick(side){var ev=EVENTS.filter(function(e){return e.id===S.ev})[0];if(!ev)return;var o=evScale(ev[side][1]);
 Object.keys(o).forEach(function(k){if(S.rel[k]!=null)S.rel[k]=clamp(S.rel[k]+o[k],0,100);else if(k==='coins')S.coins+=o[k];else if(k==='fol')S.fol+=o[k];else if(S.st[k]!=null)S.st[k]=clamp(S.st[k]+o[k],1,99)});
 S.evSeen.push(ev.id);S.ev=null;save();var c=uiEl.querySelector('.kp-card');if(c){c.style.transform='translateX('+(side==='L'?-600:600)+'px) rotate('+(side==='L'?-30:30)+'deg)';c.style.opacity=0}setTimeout(hub,350)}
function maybeEvent(force){S.acts++;if(S.ev||!force)return;S.evGap=(S.evGap||0)+1;if(S.evGap<2||(S.evGap<4&&Math.random()>.45))return;S.evGap=0;var stg=stage(),ok=function(e){return e.st===stg||(stg==='star'&&e.st==='pro')};S.evRec=S.evRec||[];
 var pool=EVENTS.filter(function(e){return ok(e)&&S.evSeen.indexOf(e.id)<0&&S.evRec.indexOf(e.id)<0});if(!pool.length){S.evSeen=[];pool=EVENTS.filter(function(e){return ok(e)&&S.evRec.indexOf(e.id)<0})}if(!pool.length)return;var e=pick(pool);S.ev=e.id;S.evRec.push(e.id);if(S.evRec.length>8)S.evRec.shift()}

/* ====================================================== */
/* ---------- MINIGRY ---------- */
var MGM=null;
function trainWorld(){var st=S.c.lv>0,o=world(st?'stadium':'orlik');useScene(o);if(st&&o.setCrowd){var cl=club(),k='h'+cl.c1+cl.c2;if(o._ck!==k){o._ck=k;o.setCrowd([cl.c1,cl.c2,cl.c1],(L().crowd||.3)*.4)}}return o}
function mgStart(id){if(S.c&&S.c.tr===S.c.week){pop('Trening już był w tym tygodniu','bad',VW/2,VH*.4);return}var g=MG[id];MGM=GAMES[id]();MGM.id=id;MGM.score=0;MGM.on=false;setMode(MGM);
 var first=!S.plays[id];
 ui('<button class="kp-x" data-a="mgQuit">✕</button><div class="kp-mgh"><b>'+g.ico+' '+g.n+'</b><span class="kp-sc">0</span><span class="kp-sub"></span></div><div class="kp-intro"><div><h3>'+g.n+'</h3><p>'+g.d+'</p><p class="kp-th">🥉 '+g.th[0]+'  ·  🥈 '+g.th[1]+'  ·  🥇 '+g.th[2]+'</p><button class="kp-btn big" data-a="mgGo">'+(first?'Zaczynamy!':'Start')+'</button></div></div>')}
function mgHud(){var e=uiEl.querySelector('.kp-sc');if(e)e.textContent=MGM.score;var s=uiEl.querySelector('.kp-sub');if(s&&MGM.sub)s.textContent=MGM.sub()}
function countdown(cb){var n=3;var e=document.createElement('div');e.className='kp-cd';fxEl.appendChild(e);(function tick(){if(n===0){e.textContent='START!';e.className='kp-cd go';setTimeout(function(){e.remove()},500);cb();return}e.textContent=n;e.className='kp-cd';void e.offsetWidth;e.className='kp-cd on';n--;setTimeout(tick,600)})()}
function mgEnd(){var id=MGM.id,g=MG[id],sc=MGM.score;MGM.on=false;MGM.done=true;
 var med=sc>=g.th[2]?3:sc>=g.th[1]?2:sc>=g.th[0]?1:0;var rec=sc>S.best[id];if(rec)S.best[id]=sc;var newMed=med>S.med[id];if(newMed)S.med[id]=med;S.plays[id]++;
 var coins=(sc*g.k+[0,10,20,40][med])*[1,1,3,6,10][S.c.lv];S.coins+=coins;
 var wk=S.c.tr!==S.c.week,st=S.st[g.st],gain=0,gain2=0;if(wk){var bg=med?[0,.9,1.3,1.9][med]+(newMed?.7:0):(sc>=Math.round(g.th[0]/2)?.5:0);if(S.rel.forma>=75)bg+=.5;if(S.rel.forma<30)bg-=.6;if(S.age>=30)bg*=.5;gain=stoch(Math.max(0,bg)*potF(st));S.st[g.st]=clamp(st+gain,1,99);if(g.st2&&med>=2){gain2=stoch(.9*potF(S.st[g.st2]));S.st[g.st2]=clamp(S.st[g.st2]+gain2,1,99)}S.c.tr=S.c.week}else{coins=Math.round(coins*.5)}S.peak=Math.max(S.peak||0,ovr());
 if(S.med.jug===3&&S.med.shot===3&&S.med.rajd===3&&!S.ach.zlote){S.ach.zlote=1;var achTxt='🏆 Odblokowane: Złote korki!'}
 S.rel.forma=clamp(S.rel.forma+3,0,100);save();
 var name=STATS.filter(function(x){return x[0]===g.st})[0][1],n2=g.st2?STATS.filter(function(x){return x[0]===g.st2})[0][1]:'';
 setTimeout(function(){ui('<div class="kp-res"><div class="kp-res-c"><p class="kp-eye">'+g.n+'</p><div class="kp-medal m'+med+'">'+(MEDAL[med]||'💪')+'</div><h3>'+(med?MEDALN[med]+'!':'Dasz radę lepiej!')+'</h3><div class="kp-res-sc"><b>'+sc+'</b><span>'+(rec?'🔥 NOWY REKORD':'rekord: '+S.best[id])+'</span></div>'+
  '<div class="kp-rew"><span>🪙 +'+coins+'</span>'+(gain?'<span class="up">'+name+' +'+gain+'</span>':'')+(gain2?'<span class="up">'+n2+' +'+gain2+'</span>':'')+'</div>'+(achTxt?'<p class="kp-ach">'+achTxt+'</p>':'')+
  '<p class="kp-next">Trening tygodnia zaliczony. Kolejny po meczu. '+(med<3?'Następny medal: '+MEDAL[med+1]+' za '+g.th[med]+' pkt.':'Masz złoto!')+'</p><div class="kp-res-b"><button class="kp-btn" data-a="toHub">Dalej ›</button></div></div></div>')},900)}
var GAMES={};
/* ---- Żonglerka ---- */
GAMES.jug=function(){var M={scene:null,o:null};var b={y:.9,vy:0,x:0,vx:0,z:0},hY=.42,g0=9.8*.6,touches=0,combo=0,state='wait',miss=false,endT=0,msg=null;
 M.enter=function(){var o=trainWorld();M.o=o;M.scene=o.scene;var P=me();P.set(lookA(),myKit());hY=.42*(P.hs||1);o.scene.add(P.g);P.g.position.set(0,0,0);P.yaw=.45;P.sp=0;P.ready=false;P.cele=null;P.watch=true;b={y:1.25,vy:0,x:.05,vx:0,z:.42};o.ball.set(b.x,b.y,b.z);o.ball.m.visible=true};
 M.go=function(){state='play';M.on=true;b.y=1.3;b.vy=1.6};
 M.sub=function(){return combo>=3?'seria x'+combo:''};
 function zone(){var k=(.85+S.st.TEC/250)*Math.max(.62,1-touches*.006)*mods().zone;return{lo:hY-.25*k,hi:hY+.36*k}}
 function gk(){return g0*(1+Math.min(1.6,touches*.032))}
 M.update=function(dt){var P=me(),o=M.o;CH.animate(P,dt);fov(42,58);var t=tall();camSet(t?2.4:2.7,t?1.5:1.25,t?3.6:3.0,0,t?.95:.9,.2,Math.min(1,dt*4));
  var g=gk();
  if(state==='play'||state==='wait'){if(state==='play'){b.vy-=g*dt;b.y+=b.vy*dt;b.x+=b.vx*dt;b.vx*=.98;b.x+=(0-b.x)*dt*.6}
   P.g.position.x+=(b.x*.5-P.g.position.x)*Math.min(1,dt*6);
   if(b.y<.02&&state==='play'){state='drop';endT=0;b.vy=1.2;b.vx=rnd(-1.5,1.5);pop('Spadła!','bad');P.watch=false;P.sp=0}}
  else if(state==='drop'){b.vy-=9.8*dt;b.y+=b.vy*dt;if(b.y<0){b.y=0;b.vy=-b.vy*.45}b.x+=b.vx*dt;b.z+=dt*.8;endT+=dt;if(endT>1.1&&!M.done){M.done=true;mgEnd()}}
  o.ball.set(b.x,b.y,b.z,dt);
  /* wskaźnik */
  if(state==='play'){var zn=zone(),tp=scr(b.x,hY,b.z),bp=scr(b.x,b.y+.11,b.z);var inZ=b.vy<0&&b.y<zn.hi&&b.y>zn.lo;
   hx.lineWidth=4;hx.strokeStyle=inZ?'rgba(22,217,125,.95)':'rgba(255,255,255,.55)';hx.beginPath();hx.arc(tp.x,tp.y,30,0,7);hx.stroke();
   if(b.vy<0){var rr=30+Math.max(0,b.y-hY)*110;hx.strokeStyle=inZ?'#16d97d':'rgba(255,210,74,.9)';hx.lineWidth=3;hx.beginPath();hx.arc(bp.x,bp.y,Math.min(rr,160),0,7);hx.stroke()}}};
 M.down=function(){if(state!=='play')return;var zn=zone(),P=me();
  if(b.vy<0&&b.y<zn.hi&&b.y>zn.lo){var q=1-Math.abs(b.y-hY)/(zn.hi-hY+.001);q=clamp(q,0,1);touches++;combo++;var pts=q>.7?2:1;M.score+=pts;
   var apex=(Math.max(.78,1.6-touches*.016)+(q>.7?.08:0))*(.6+.4*(P.hs||1));b.vy=Math.sqrt(2*gk()*Math.max(.25,apex-b.y));if(touches===15||touches===30||touches===45)banner('SZYBCIEJ!','','');b.vx=rnd(-1,1)*(.15+(1-q)*.45);
   P.foot=b.x>0?'L':'R';P.juggle=.3;var sp=scr(b.x,b.y+.3,b.z);pop(q>.7?'Idealnie! +2':'Dobrze +1',q>.7?'gold':'',sp.x,sp.y);
   if(touches%10===0){M.score+=5;banner(touches+' podbić!','+5 bonus','gold')}mgHud()}
  else{combo=0;var sp2=scr(b.x,b.y,b.z);pop('Za wcześnie!','bad',sp2.x,sp2.y);mgHud()}};
 M.key=function(k,d){if(d&&(k===' '||k==='Enter'||k==='ArrowUp'))M.down()};
 return M};
/* ---- Tarcze ---- */
GAMES.shot=function(){var M={};var left=10,targets=[],shot=null,t=0,ball={x:0,y:0,z:0},rest=0,phase='aim',GX=0,X0=0,fb=null,shards=[],crossed=false;
 function tgTex(pts){var c=document.createElement('canvas');c.width=c.height=128;var x=c.getContext('2d');var col=pts>=5?'#ffd24a':pts>=3?'#ff3b5c':'#16d97d';x.fillStyle='rgba(255,255,255,.95)';x.beginPath();x.arc(64,64,62,0,7);x.fill();x.fillStyle=col;x.beginPath();x.arc(64,64,52,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(64,64,34,0,7);x.fill();x.fillStyle=col;x.beginPath();x.arc(64,64,20,0,7);x.fill();x.fillStyle='#0b1430';x.font='900 30px Anton,Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(pts,64,66);var tt=new T3.CanvasTexture(c);tt.encoding=T3.sRGBEncoding;return tt}
 var tex={};
 function clear(){targets.forEach(function(q){M.o.scene.remove(q.m)});targets=[]}
 function place(){clear();var lvl=10-left;
  var spots=[[GH-.42,GW/2-.48,3],[GH-.42,-GW/2+.48,3],[.4,GW/2-.48,3],[.4,-GW/2+.48,3],[1.1,0,1],[1.0,1.35,1],[1.0,-1.35,1],[1.6,.7,1],[.6,-.8,1]];spots.sort(function(){return Math.random()-.5});
  var n=lvl<4?3:2;for(var i=0;i<n;i++){var s=spots[i];targets.push(mk(s[0],s[1],s[2],s[2]===3?.36:.46,false))}
  if(lvl>=4)targets.push(mk(1.25,0,5,.34,true))}
 function mk(y,z,pts,r,mov){if(!tex[pts])tex[pts]=tgTex(pts);var m=new T3.Mesh(new T3.CircleGeometry(r,32),new T3.MeshBasicMaterial({map:tex[pts],transparent:true,side:T3.DoubleSide}));m.position.set(GX-.05,y,z);m.rotation.y=-Math.PI/2;M.o.scene.add(m);return{m:m,y:y,z:z,r:r,pts:pts,mov:mov,ph:Math.random()*6,hit:0}}
 function shatter(q){var cols=q.pts>=5?0xffd24a:q.pts>=3?0xff3b5c:0x16d97d;for(var i=0;i<12;i++){var sm=new T3.Mesh(new T3.CircleGeometry(.07+Math.random()*.06,3),new T3.MeshBasicMaterial({color:i%3?cols:0xffffff,side:T3.DoubleSide,transparent:true}));sm.position.copy(q.m.position);M.o.scene.add(sm);shards.push({m:sm,vx:rnd(-1,2.5),vy:rnd(1,4),vz:rnd(-3,3),r:rnd(-9,9),t:0})}q.m.visible=false}
 M.enter=function(){var o=trainWorld();M.o=o;M.scene=o.scene;GX=o.GX;X0=GX-11;var P=me();P.set(lookA(),myKit());o.scene.add(P.g);P.cele=null;P.watch=false;P.juggle=0;reset();place()};
 M.exit=function(){clear();shards.forEach(function(s){M.o.scene.remove(s.m)});shards=[]};
 function reset(){ball={x:X0,y:0,z:rnd(-1.5,1.5)};var P=me();P.g.position.set(ball.x-.9,0,ball.z+(S.foot==='R'?-.55:.55));P.yaw=Math.PI/2;P.sp=0;P.ready=true;M.o.ball.set(ball.x,0,ball.z);shot=null;fb=null;crossed=false;phase='aim'}
 M.go=function(){M.on=true};M.sub=function(){return 'strzały: '+left};
 function score(p){var got=0;targets.forEach(function(q){if(!q.hit&&Math.hypot(p.y-q.y,p.z-q.z)<q.r+.14){q.hit=1;got+=q.pts;shatter(q)}});return got}
 M.update=function(dt){var P=me(),o=M.o;CH.animate(P,dt);netUpd(o,dt);fov(40,60);var tl=tall();var sd2=S.foot==='R'?1:-1;if(phase==='aim'||!M.cp)M.cp=[X0-(tl?4.4:6),tl?1.9:2.0,ball.z+sd2*(tl?.6:.8)];camSet(M.cp[0],M.cp[1],M.cp[2],GX,tl?.55:0,ball.z*.3,Math.min(1,dt*5));
  targets.forEach(function(q){if(q.mov&&!q.hit){q.ph+=dt*1.3;q.z=Math.sin(q.ph)*(GW/2-.6);q.m.position.z=q.z}});
  for(var i=shards.length-1;i>=0;i--){var sh=shards[i];sh.t+=dt;sh.vy-=9.8*dt;sh.m.position.x+=sh.vx*dt;sh.m.position.y+=sh.vy*dt;sh.m.position.z+=sh.vz*dt;sh.m.rotation.z+=sh.r*dt;sh.m.rotation.x+=sh.r*dt*.6;sh.m.material.opacity=Math.max(0,1-sh.t);if(sh.t>1){o.scene.remove(sh.m);shards.splice(i,1)}}
  if(phase==='fly'){t+=dt/shot.T;if(t<1){var p=shotPos(shot,t);ball=p;o.ball.set(p.x,p.y,p.z,dt)}else{var pe=shotPos(shot,1);resolve(pe);var v=shotVel(shot);fb={x:pe.x,y:pe.y,z:pe.z,vx:v.vx,vy:v.vy,vz:v.vz,net:shot.res==='in'};if(shot.res==='post'){fb.vx=-fb.vx*.5;fb.vz+=rnd(-2,2)}phase='after';rest=0}}
  else if(phase==='after'){if(fb){freeBall(fb,dt,GX);o.ball.set(fb.x,fb.y,fb.z,dt)}rest+=dt;if(rest>1.1){if(left<=0){if(!M.done){M.done=true;mgEnd()}}else{if((10-left)%2===0)place();reset()}}}
  if(M.on&&phase==='aim'&&ptr.down)trail(ptr.pts,'rgba(255,255,255,.85)');
  if(M.on&&phase==='aim'&&!ptr.down&&left===10){var bp=scr(ball.x,.1,ball.z),gp=scr(GX,1.2,targets[0]?targets[0].z:0);var k=(performance.now()%1400)/1400;hx.globalAlpha=1-k;hx.fillStyle='#fff';hx.beginPath();hx.arc(lerp(bp.x,gp.x,k),lerp(bp.y,gp.y,k),12,0,7);hx.fill();hx.globalAlpha=1}};
 function resolve(p){var r=goalCheck(p.y,p.z);shot.res=r;var got=0;
  if(r==='in'){got=score(p);netShake(M.o);if(got){M.score+=got;var sp=scr(GX,p.y+.4,p.z);pop('+'+got,'gold',sp.x,sp.y);if(shot.curve>1.1)pop('Podkręcona!','',VW/2,VH*.3)}else pop('Obok tarczy','',VW/2,VH*.35)}
  else if(r==='post')pop('Słupek!','bad',VW/2,VH*.35);else pop('Pudło','bad',VW/2,VH*.35);mgHud()}
 M.up=function(p,pts){if(!M.on||phase!=='aim')return;var sw=swipe(pts);var s=shotFrom(sw,ball,GX);if(!s){pop('Narysuj linię w stronę bramki!','',VW/2,VH*.6);return}
  shot=s;t=0;phase='fly';left--;var P=me();P.kick=.38;P.foot=S.foot;P.ready=false;mgHud()};
 return M};
/* ---- Rajd na bramkę: drybling między obrońcami i strzał ---- */
var TPOOL=null;
function tpool(o){if(!TPOOL){TPOOL=[];for(var j=0;j<5;j++){var lk=randLook(j+3);var e=mkEnt(lk,{sh:OPP_KIT.sh,sp:OPP_KIT.sp,so:OPP_KIT.so},OPP_NAMES[j%5]);o.scene.add(e.P.g);TPOOL.push(e)}var gk=mkEnt(randLook(9),{sh:{c:0x1f2937,t:0x16d97d},sp:0x111111,so:0x1f2937,gk:true},'Bramkarz');o.scene.add(gk.P.g);TPOOL.push(gk)}TPOOL.forEach(function(e){o.scene.add(e.P.g);e.P.g.visible=true});return TPOOL}
GAMES.rajd=function(){var M={};var o,GX,run=0,RUNS=5,x,z,tz,vz,spd,defs,gk,phase='wait',kp={l:0,r:0},ph=0,t=0,shot=null,fb=null,rest=0,info='';
 M.enter=function(){o=trainWorld();M.o=o;M.scene=o.scene;GX=o.GX;var P=me();P.set(lookA(),myKit());o.scene.add(P.g);P.cele=null;P.watch=false;P.ready=false;P.juggle=0;var pool=tpool(o);defs=pool.slice(0,5);gk=pool[5];setup()};
 M.exit=function(){if(TPOOL)TPOOL.forEach(function(e){e.P.g.visible=false;e.P.dive=null})};
 function setup(){x=GX-42;z=rnd(-3,3);tz=z;vz=0;spd=6.2+run*.35+(S.st.SZY-40)*.03;phase=M.on?'run':'wait';shot=null;fb=null;rest=0;t=0;
  var n=[2,2,3,4,4][run]||4;defs.forEach(function(d,i){var on=i<n;d.P.g.visible=on;d.on=on;d.state='wait';d.P.dive=null;d.P.slide=null;d.P.ready=false;d.P.sp=0;var fx=lerp(GX-32,GX-14,n>1?i/(n-1):.5)+rnd(-1.5,1.5);d.x=d.tx=fx;d.z=d.tz=clamp(rnd(-5,5),-9,9);d.spd=3.9+run*.25;d.P.slide=null;d.P.g.position.set(d.x,0,d.z);d.P.yaw=-Math.PI/2});
  gk.x=gk.tx=GX-.7;gk.z=gk.tz=0;gk.P.dive=null;gk.P.ready=true;gk.P.g.position.set(gk.x,0,0);gk.P.yaw=-Math.PI/2;camSet.p=null}
 M.go=function(){M.on=true;phase='run'};M.sub=function(){return 'akcja '+Math.min(run+1,RUNS)+'/'+RUNS+(info?'  ·  '+info:'')};
 function endRun(msg,cls){phase='end';rest=0;if(msg)banner(msg,'',cls)}
 M.update=function(dt){var P=me(),sd=dt*slow;
  if(phase==='run'){var maxv=6+S.st.DRY*.06;if(kp.l)tz-=dt*9;if(kp.r)tz+=dt*9;tz=clamp(tz,-11,11);var want=clamp((tz-z)*7,-maxv,maxv);vz+=(want-vz)*Math.min(1,dt*12);z+=vz*dt;x+=spd*dt;
   defs.forEach(function(d){if(!d.on)return;var dx=d.x-x,dist=Math.hypot(dx,d.z-z);
    if(d.state==='wait'&&dx<10&&dx>-1){d.state='chase'}
    if(d.state==='chase'){d.tx=x+Math.max(1.2,dx*.5);d.tz=z+vz*.35;var mv=Math.hypot(d.tx-d.x,d.tz-d.z);if(mv>.05){var st=Math.min(mv,d.spd*dt);d.x+=(d.tx-d.x)/mv*st;d.z+=(d.tz-d.z)/mv*st}d.P.sp=d.spd;d.P.yaw=Math.atan2(x-d.x,z-d.z);
     if(dist<2.1&&dx>-.3){d.state='lunge';d.lt=0;d.lx=x+spd*.36;d.lz=z+vz*.3;d.l0={x:d.x,z:d.z};d.P.slide={t:0};d.P.yaw=Math.atan2(d.lx-d.x,d.lz-d.z);d.P.sp=0}}
    else if(d.state==='lunge'){d.lt+=dt;var k=Math.min(1,d.lt/.38);d.x=lerp(d.l0.x,d.lx,k);d.z=lerp(d.l0.z,d.lz,k);
     if(k>=1&&d.state==='lunge'){d.state='down';if(Math.hypot(x-d.lx,z-d.lz)<.72+run*.02){var sp=scr(x,1.2,z);pop('ODEBRAŁ!','bad',sp.x,sp.y);M.o.shake=.5;endRun(null)}else{M.score+=1;var sp2=scr(d.x,1.2,d.z);pop('Minięty! +1','',sp2.x,sp2.y);mgHud()}}}
    d.P.g.position.set(d.x,0,d.z);CH.animate(d.P,dt)});
   if(x>=GX-12.5&&phase==='run'){phase='shot';t=0;slow=1;P.sp=0;P.ready=true;camSet.p=null;info='strzelaj!';mgHud()}}
  else defs.forEach(function(d){if(d.on){d.P.sp=0;CH.animate(d.P,dt)}});
  /* zawodnik i piłka */
  P.g.position.set(x,0,z);P.sp=phase==='run'?spd:0;P.yaw=Math.PI/2-Math.atan2(vz,Math.max(1,spd))*.8;ph+=dt*spd*1.1;if(phase==='run'&&Math.sin(ph)>.97&&!P.kick){P.kick=.25;P.foot=Math.random()<.5?'L':'R'}CH.animate(P,dt);
  if(phase==='run'||phase==='wait')o.ball.set(x+.55+Math.max(0,Math.sin(ph))*.25,0,z+vz*.06,dt);
  if(phase==='shot'){t+=dt;var lim=3.2;timerHud(1-t/lim);if(t>lim){fire({P0:{x:o.ball.x,y:0,z:o.ball.z},C:{x:(o.ball.x+GX)/2,z:o.ball.z*.5},P1:{x:GX,y:.3,z:rnd(-.5,.5)},T:.9,arc:0,curve:0},true)}}
  if(phase==='fly'){var kS=shot.kS||1;t+=dt/shot.T;if(t<(shot.save?kS:1)){var p=shotPos(shot,t);o.ball.set(p.x,p.y,p.z,dt)}else{var pe=shotPos(shot,shot.save?kS:1),v=shotVel(shot);fb={x:pe.x,y:pe.y,z:pe.z,vx:v.vx,vy:v.vy,vz:v.vz,net:!shot.save&&shot.res==='in'};
    if(shot.save){fb.vx=-6;fb.vy=3;fb.vz=rnd(-3,3);endRun('OBRONIONA!','opp')}else if(shot.res==='in'){var pts=3+(Math.abs(pe.z)>GW/2-1?1:0);M.score+=pts;netShake(o);var P2=me();P2.cele={type:S.cele,t:0};setTimeout(function(){P2.cele=null},1600);endRun('GOOOL! +'+pts,'gold');mgHud()}else{if(shot.res==='post'){fb.vx=-fb.vx*.5}endRun(shot.res==='post'?'SŁUPEK!':'PUDŁO','opp')}}}
  if(fb){freeBall(fb,dt,GX);o.ball.set(fb.x,fb.y,fb.z,dt)}
  netUpd(o,dt);gk.P.g.position.set(gk.x,0,gk.z);CH.animate(gk.P,dt);if(gk.P.dive&&gk.tz!=null){gk.z+=(gk.tz-gk.z)*Math.min(1,dt*9)}
  if(phase==='end'){rest+=dt;timerHud(null);if(rest>1.7){run++;info='';if(run>=RUNS){if(!M.done){M.done=true;mgEnd()}}else{setup();phase='run';mgHud()}}}
  /* kamera */
  var tl=tall(),sh=o.shake||0;o.shake=Math.max(0,sh-dt);
  if(phase==='shot'||phase==='fly'||(phase==='end'&&shot)){fov(42,60);camSet(x-(tl?4.6:5.2),tl?2.1:2.0,z+(tl?.5:.8),GX,tl?.6:.3,z*.3,Math.min(1,dt*6))}
  else{fov(46,62);camSet(x-(tl?5.6:6.2),tl?3.6:3.2,z*.7+(Math.random()-.5)*sh*.4,x+8,.3,z*.6,Math.min(1,dt*5))}
  if(phase==='shot'){if(ptr.down)trail(ptr.pts,'rgba(255,255,255,.85)')}};
 function timerHud(k){var e=uiEl.querySelector('.kp-tbar');if(!e){var d=document.createElement('div');d.className='kp-tbar';d.innerHTML='<i></i>';uiEl.appendChild(d);e=d}if(k==null){e.className='kp-tbar';return}e.className='kp-tbar on';e.firstChild.style.width=Math.max(0,k)*100+'%'}
 function fire(s,weak){phase='fly';t=0;var P=me();P.kick=.38;P.foot=S.foot;P.ready=false;timerHud(null);info='';var r=gkSave(s,gk,weak,1.05);s.res=r.res;s.save=r.save;s.kS=saveK(s,gk.x);shot=s;setTimeout(function(){if(r.dive){gk.P.ready=false;gk.P.dive={t:0,s:r.dz>0?-1:1,high:s.P1.y>1.3};gk.tz=clamp(s.save?s.P1.z-(r.dz>0?.55:-.55):gk.z+r.dz*.4,-GW/2,GW/2)}},60)}
 M.up=function(p,pts){if(phase!=='shot')return;var sw=swipe(pts);var s=shotFrom(sw,{x:o.ball.x,y:0,z:o.ball.z},GX,1.15);if(!s){pop('Narysuj linię w stronę bramki!','',VW/2,VH*.6);return}fire(s,false)};
 M.move=function(p,d){if(phase!=='run')return;if(d||p.pointerType!=='touch')tz=clamp((p.x/VW-.5)*24,-11,11)};
 M.down=function(p){if(phase==='run')tz=clamp((p.x/VW-.5)*24,-11,11)};
 M.key=function(k,d){if(k==='ArrowLeft'||k==='a'||k==='A')kp.l=d?1:0;if(k==='ArrowRight'||k==='d'||k==='D')kp.r=d?1:0};
 return M};
/* bramkarz: czy obroni (wspólne dla meczu i rajdu) */
function gkSave(s,gk,weak,diff){var dz=s.P1.z-gk.z,y=s.P1.y,res=goalCheck(y,s.P1.z),corner=Math.abs(s.P1.z)>GW/2-.95,high=y>GH-.6,reach=Math.abs(dz)<1.35+(y<1.4?.25:0)&&y<2.35;
 var p=0;if(res==='in'&&reach){p=corner?(high?.12:.32):Math.abs(dz)<.6?.93:.7;p-=s.curve>1.4?.12:0;p-=(S.st.STR-40)*.004;p*=diff||1}if(weak)p=.95;
 return{res:res,save:res==='in'&&Math.random()<clamp(p,0,.97),dz:dz,dive:res==='in'&&Math.abs(dz)>.35||weak}}
/* ====================================================== */
/* ---------- FIZYKA STRZAŁU: piłka odbija się od ciała bramkarza, słupków i poprzeczki.
   Gol jest wtedy i tylko wtedy, gdy cała piłka przejdzie linię bramkową między słupkami i pod poprzeczką. ---------- */
var BRB=.11,_pv=new T3.Vector3();
var GKS=[['handL',.17],['handR',.17],['farmL',.11],['farmR',.11],['uarmL',.1],['uarmR',.1],['head',.15],['chest',.22],['spine',.2],['hips',.19],['thighL',.12],['thighR',.12],['shinL',.1],['shinR',.1],['footL',.1],['footR',.1]];
var WALLS=[['head',.14],['chest',.23],['spine',.21],['hips',.2],['thighL',.12],['thighR',.12],['shinL',.11],['shinR',.11]];
function bodySph(e,list){var P=e.P,out=[];P.g.updateMatrixWorld(true);list.forEach(function(q){var b=P.B[q[0]];if(!b)return;b.getWorldPosition(_pv);out.push({x:_pv.x,y:_pv.y+(q[0]==='head'?.1:q[0]==='chest'?.06:0),z:_pv.z,r:q[1],n:q[0]})});return out}
/* tabela rzutu bramkarza (zmierzona z animacji): czas, zasięg w bok, wysokość wyższej ręki */
var DV_T=[0,.08,.15,.22,.28,.35,.42,.5],DV_R=[.41,1.07,1.49,1.63,1.75,1.81,1.81,1.81],DV_H=[1.03,1.61,1.85,1.45,1.19,1.01,.91,.8];
function itp(X,Y,x){if(x<=X[0])return Y[0];for(var i=1;i<X.length;i++)if(x<=X[i]){var k=(x-X[i-1])/(X[i]-X[i-1]);return lerp(Y[i-1],Y[i],k)}return Y[Y.length-1]}
function gauss(){return (Math.random()+Math.random()+Math.random()-1.5)*1.15}
function aiOpp(s){var M=MT,d=M.diff||1;return{rd:clamp(.21-(d-1)*.35,.11,.27),sig:clamp(.3-(d-1)*.45,.12,.42)+(s.curve>1.4?.2:0)+Math.max(0,.7-s.T)*.35,cv:clamp(18+(d-1)*20,15,22),cp:clamp(.5+(d-1),.35,.7)}}
function aiOur(){return{rd:.17,sig:.26,cv:19,cp:.5}}
/* start strzału: s = krzywa (P0,C,P1,T,arc), gk = bramkarz, o = {dir,gx,ai,wall,pen} */
function physShot(s,gk,o,cb){var M=MT,q=shotPos(s,0);M.mst=M.mst||{pos:50,sh:[0,0]};M.mst.sh[o.dir>0?0:1]++;M.ball.owner=null;M.ball.path=null;M.ball.free=null;M.ball.held=null;
 var sh={s:s,gk:gk,o:o,cb:cb,t:0,T:0,mode:'path',p:{x:q.x,y:q.y+BRB,z:q.z},v:{x:0,y:0,z:0},cd:0,touched:null,post:0,done:false,age:0};
 if(!o.gx)o.gx=o.dir*Match.o.GX;gkPlan(sh);M.sh=sh;return sh}
function gkPlan(sh){var gk=sh.gk,s=sh.s,o=sh.o,dir=o.dir,ai=o.ai,k,q;for(k=0;k<=1.2;k+=.01){q=shotPos(s,k);if((q.x-gk.x)*dir>=0)break}
 var tc=k*s.T,py=q.y+BRB,aim=q.z+gauss()*ai.sig,need=aim-gk.z,an=Math.abs(need),g={z0:gk.z,aim:aim,py:py,tc:tc,side:need>0?1:-1};
 if(o.pen){g.mode=o.pen.guess?'dive':'stand';g.side=o.pen.guess||1;g.tds=.03;g.sh=0;g.py=rnd(.5,1.4)}
 else if(an<.62){g.mode='stand'}
 else{g.mode='dive';var best=.3,bd=9;for(var t=.1;t<=.5;t+=.02){var gh=gk.P&&gk.P.hs||1,dd=Math.abs(itp(DV_T,DV_H,t)*gh-py)+(py<.7&&t<.4?.6:0);if(dd<bd){bd=dd;best=t}}
  var reach=itp(DV_T,DV_R,best)*gh;g.tds=Math.max(ai.rd,tc-best);g.sh=Math.min(Math.max(0,an-reach+.1),Math.max(0,g.tds-ai.rd)*4.5)}
 sh.g=g}
function gkAI(sh){var g=sh.g,gk=sh.gk,o=sh.o,t=sh.T;if(!g||sh.gkDone)return;gk.face={x:gk.x-o.dir*10,z:gk.z};
 if(!o.pen&&t<o.ai.rd){gk.P.ready=true;return}
 if(g.mode==='stand'){gk.P.ready=true;gk.tx=gk.x;gk.tz=clamp(g.aim,g.z0-.7,g.z0+.7);gk.spd=5;return}
 if(t<g.tds){gk.P.ready=true;gk.tx=gk.x;gk.tz=g.z0+g.side*g.sh;gk.spd=4.5;return}
 gk.P.ready=false;gk.P.dive={t:0,s:-o.dir*g.side,high:g.py>1.3};gk.tx=gk.x;gk.tz=gk.z;sh.gkDone=1}
function sphHit(sh,c){var p=sh.p,v=sh.v,nx=p.x-c.x,ny=p.y-c.y,nz=p.z-c.z,d=Math.hypot(nx,ny,nz);if(d>=c.r+BRB||d<1e-6)return false;nx/=d;ny/=d;nz/=d;var vn=v.x*nx+v.y*ny+v.z*nz;if(vn>=0)return false;
 var pen=c.r+BRB-d;p.x+=nx*pen;p.y+=ny*pen;p.z+=nz*pen;return{nx:nx,ny:ny,nz:nz,vn:vn}}
function bounce(v,h,e){v.x-=(1+e)*h.vn*h.nx;v.y-=(1+e)*h.vn*h.ny;v.z-=(1+e)*h.vn*h.nz}
function shFinish(sh,res){if(sh.done)return;sh.done=true;sh.res=res;var M=MT,p=sh.p,v=sh.v;M.sh=null;if(DEBUG||window.__kpLog)(window.__kpShots=window.__kpShots||[]).push({res:res,x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2),gx:sh.o.gx,gk:+sh.gk.z.toFixed(2),t:+sh.T.toFixed(2),post:sh.post,touch:sh.touched,mode:sh.g&&sh.g.mode});
 if(res==='catch'){M.ball.held=sh.gk}else{M.ball.free={x:p.x,y:Math.max(0,p.y-BRB),z:p.z,vx:v.x,vy:v.y,vz:v.z,net:res==='goal'?1:0,gx:sh.o.gx}}
 if(res==='goal')netShake(Match.o,sh.o.dir>0?0:1);if(sh.cb)sh.cb(res,{post:sh.post,touched:sh.touched})}
function shStep(sh,dt){if(sh.done)return;var M=MT,O=Match.o,s=sh.s,o=sh.o,dir=o.dir,gx=o.gx;sh.T+=dt;gkAI(sh);
 var sp=bodySph(sh.gk,GKS),wsp=[];if(o.wall)o.wall.forEach(function(e){wsp=wsp.concat(bodySph(e,WALLS))});
 var n=Math.max(1,Math.ceil(dt/.005)),h=dt/n;
 for(var i=0;i<n&&!sh.done;i++){var p0={x:sh.p.x,y:sh.p.y,z:sh.p.z};
  if(sh.mode==='path'){sh.t+=h;var k=sh.t/s.T;var q=shotPos(s,Math.min(k,1.2));var np={x:q.x,y:q.y+BRB,z:q.z};sh.v={x:(np.x-p0.x)/h,y:(np.y-p0.y)/h,z:(np.z-p0.z)/h};sh.p=np;if(k>=1.2)sh.mode='free'}
  else if(sh.mode==='free'){var v=sh.v;v.y-=9.8*h;sh.p={x:p0.x+v.x*h,y:p0.y+v.y*h,z:p0.z+v.z*h};if(sh.p.y<BRB){sh.p.y=BRB;v.y=Math.abs(v.y)*.45;v.x*=.86;v.z*=.86}}
  var p=sh.p;
  /* bramkarz */
  if(sh.cd>0)sh.cd-=h;else for(var j=0;j<sp.length;j++){var hh=sphHit(sh,sp[j]);if(!hh)continue;var spd=Math.hypot(sh.v.x,sh.v.y,sh.v.z),c=sp[j].n;
   if(!sh.touched&&/hand|farm|chest|spine|head/.test(c)&&spd<o.ai.cv&&Math.random()<o.ai.cp&&!o.pen){sh.touched='gk';shFinish(sh,'catch');return}
   bounce(sh.v,hh,.25);var vv=sh.v;vv.x*=.4;vv.y*=.4;vv.z*=.4;if(vv.x*dir>-1.5)vv.x=-dir*rnd(1.5,3.5);vv.y=clamp(vv.y,rnd(.8,2),4.5);vv.z=clamp(vv.z+(sh.p.z>=sh.gk.z?1:-1)*rnd(.5,2),-6,6);sh.mode='free';sh.touched='gk';sh.tAt=sh.T;sh.cd=.2;break}
  /* mur */
  for(j=0;j<wsp.length&&!sh.done;j++){var hw=sphHit(sh,wsp[j]);if(!hw)continue;bounce(sh.v,hw,.3);if(sh.v.x*dir>0)sh.v.x*=-.5;sh.mode='free';sh.touched=sh.touched||'wall';sh.tAt=sh.T;break}
  /* słupki i poprzeczka */
  [-1,1].forEach(function(sg){var dx=p.x-gx,dz=p.z-sg*GW/2,d=Math.hypot(dx,dz);if(d<.06+BRB&&d>1e-6&&p.y<GH+.06){var nx=dx/d,nz=dz/d,vn=sh.v.x*nx+sh.v.z*nz;if(vn<0){sh.v.x-=1.6*vn*nx;sh.v.z-=1.6*vn*nz;p.x=gx+nx*(.06+BRB);p.z=sg*GW/2+nz*(.06+BRB);sh.mode='free';sh.post=sh.post||1;sh.tAt=sh.T}}});
  var bx=p.x-gx,by=p.y-GH,bd=Math.hypot(bx,by);if(Math.abs(p.z)<GW/2&&bd<.06+BRB&&bd>1e-6){var bnx=bx/bd,bny=by/bd,bvn=sh.v.x*bnx+sh.v.y*bny;if(bvn<0){sh.v.x-=1.6*bvn*bnx;sh.v.y-=1.6*bvn*bny;p.x=gx+bnx*(.06+BRB);p.y=GH+bny*(.06+BRB);sh.mode='free';sh.post=2;sh.tAt=sh.T}}
  /* linia bramkowa: cała piłka za linią */
  var a0=(p0.x-gx)*dir,a1=(p.x-gx)*dir;if(a0<BRB&&a1>=BRB){if(Math.abs(p.z)<GW/2&&p.y<GH){shFinish(sh,'goal');break}else{shFinish(sh,sh.touched==='gk'?'save':sh.post?'post':sh.touched==='wall'?'wall':'miss');break}}
  if(a1>BRB+3){shFinish(sh,'miss');break}
 }
 if(!sh.done){var sv=Math.hypot(sh.v.x,sh.v.z);if(sh.touched&&(sh.T-sh.tAt>1.1||sv<1.2))shFinish(sh,sh.touched==='gk'?'save':'wall');else if(sh.post&&sh.T-sh.tAt>1.1)shFinish(sh,'post');else if(sh.T>4)shFinish(sh,'miss')}
 O.ball.set(sh.p.x,Math.max(0,sh.p.y-BRB),sh.p.z,dt)}
/* piłka złapana: trzyma ją bramkarz w rękach */
function heldPos(gk){var a=bodySph(gk,[['handL',0],['handR',0]]);return{x:(a[0].x+a[1].x)/2,y:Math.max(0,(a[0].y+a[1].y)/2-BRB),z:(a[0].z+a[1].z)/2}}

/* ---------- POWTÓRKA: zapis ostatnich sekund i odtworzenie ---------- */
function recFrame(dt){var M=MT,o=Match.o;if(!M.rec)M.rec=[];var ents=M.all.map(function(e){var P=e.P;return[e.x,e.z,P.yaw,P.sp,P.kick||0,P.head||0,P.dive?P.dive.t:-1,P.dive?P.dive.s:0,P.dive&&P.dive.high?1:0,P.slide?P.slide.t:-1,P.cele?P.cele.t:-1,P.cele?P.cele.type:0,P.ready?1:0,P.g.visible?1:0]});
 M.rec.push({dt:dt,b:[o.ball.x,o.ball.y,o.ball.z],e:ents,cam:[cam.position.x,cam.position.y,cam.position.z]});var tot=0;for(var i=M.rec.length-1;i>=0;i--){tot+=M.rec[i].dt;if(tot>12){M.rec.splice(0,i);M.recBase=(M.recBase||0)+i;break}}}
function markGoal(){var M=MT;M.gIdx=(M.recBase||0)+(M.rec?M.rec.length:0)}
function repBtn(onRep,onSkip,ms){var b=document.createElement('button');b.className='kp-repb';b.innerHTML='📺 Zobacz powtórkę';uiEl.appendChild(b);var done=false;
 function fin(rep){if(done)return;done=true;clearTimeout(tm);b.remove();(rep?onRep:onSkip)()}var tm=setTimeout(function(){fin(false)},ms||3400);b.addEventListener('click',function(e){e.stopPropagation();fin(true)})}
function startReplay(cb){var M=MT;if(!M.rec||!M.rec.length){cb();return}var B0=M.recBase||0,g=clamp((M.gIdx||B0+M.rec.length)-B0,1,M.rec.length),i0=g,tt=0,lo=Math.max(0,Math.min(g-1,(M.actIdx||0)-B0));while(i0>lo&&tt<5){i0--;tt+=M.rec[i0].dt}var i1=g;tt=0;while(i1<M.rec.length-1&&tt<1.3){tt+=M.rec[i1].dt;i1++}
 var save=M.all.map(function(e){var P=e.P;return{x:e.x,z:e.z,tx:e.tx,tz:e.tz,yaw:P.yaw,cele:P.cele,dive:P.dive,slide:P.slide,ready:P.ready}}),bs=[Match.o.ball.x,Match.o.ball.y,Match.o.ball.z];
 var lb=M.rec[Math.min(g,M.rec.length-1)].b;fxEl.innerHTML='';timerBar(null);prompt(null);M.rp={dir:lb[0]>0?1:-1,side:lb[2]>=0?1:-1,fr:M.rec.slice(i0,i1+1),i:0,acc:0,cb:function(){M.all.forEach(function(e,k){var q=save[k],P=e.P;e.x=q.x;e.z=q.z;e.tx=q.tx;e.tz=q.tz;P.yaw=q.yaw;P.cele=q.cele;P.dive=q.dive;P.slide=q.slide;P.ready=q.ready;P.g.position.set(e.x,0,e.z)});Match.o.ball.set(bs[0],bs[1],bs[2]);var el=uiEl.querySelector('.kp-rpl');if(el)el.remove();camSet.p=null;cb()}};
 var el=document.createElement('div');el.className='kp-rpl';el.innerHTML='<b>POWTÓRKA</b><button>Pomiń ⏭</button>';uiEl.appendChild(el);el.querySelector('button').addEventListener('click',function(e){e.stopPropagation();if(M.rp){var c=M.rp.cb;M.rp=null;c()}});camSet.p=null}
function replayStep(dt){var M=MT,R=M.rp,o=Match.o;R.acc+=dt*.6;while(R.i<R.fr.length-1&&R.acc>=R.fr[R.i].dt){R.acc-=R.fr[R.i].dt;R.i++}
 var f=R.fr[R.i],rdt=f.dt*.6;o.ball.set(f.b[0],f.b[1],f.b[2],rdt);
 M.all.forEach(function(e,k){var q=f.e[k];if(!q)return;var P=e.P;e.x=q[0];e.z=q[1];P.yaw=q[2];P.sp=q[3];P.kick=q[4]>0?q[4]+rdt:0;P.head=q[5]>0?q[5]+rdt:0;P.dive=q[6]>=0?{t:Math.max(0,q[6]-rdt),s:q[7],high:!!q[8]}:null;P.slide=q[9]>=0?{t:Math.max(0,q[9]-rdt)}:null;P.cele=q[10]>=0?{t:Math.max(0,q[10]-rdt),type:q[11]}:null;P.ready=!!q[12];P.g.position.set(e.x,0,e.z);CH.animate(P,rdt)});
 var dir=R.dir,gx=dir*o.GX;fov(42,58);camSet(gx-dir*(tall()?14:11),tall()?4.5:3.6,R.side*(tall()?9:13),o.ball.x,.8,o.ball.z,Math.min(1,dt*4));
 if(R.i>=R.fr.length-1){var cb=R.cb;M.rp=null;cb()}}
/* cięcie kamery (zasłania przestawienie zawodników) */
function faceNow(e,x,z){e.P.yaw=Math.atan2(x-e.x,z-e.z);var f={x:x,z:z};e.face=f;setTimeout(function(){if(e.face===f)e.face=null},450)}
function banOn(){return !!fxEl.querySelector('.kp-ban:not(.out)')||!!uiEl.querySelector('.kp-intro')}
function cut(){var e=document.createElement('div');e.className='kp-cut';fxEl.appendChild(e);setTimeout(function(){e.remove()},520)}

/* ====================================================== */
/* ---------- MECZ NA ORLIKU (kluczowe momenty) ---------- */
var MT=null;
var OPP_KIT={sh:{c:0xff8a00,t:0x111111},sp:0x111111,so:0xff8a00};
var MATE_NAMES=['Kacper','Szymon','Bartek','Olek','Filip','Antek'],OPP_NAMES=['Wiktor','Maks','Tymek','Igor','Leon'];
function mkEnt(look,kit,name){var P=CH.build(look,kit);return{P:P,x:0,z:0,tx:0,tz:0,spd:6,name:name,face:null}}
function randLook(i){return{skin:(i*3+1)%8,hair:[1,2,3,4,5,0,1,3][i%8],hairCol:[0,1,2,3,1,0,4,2][i%8],eyes:i%5,brows:i%3,boots:i%2,shirt:S.look.shirt,band:0,num:[7,8,11,4,6,3][i%6],kid:1}}
var POOL=null,POOLX=null;
function poolShow(v){if(POOL)POOL.forEach(function(e){e.P.g.visible=v});if(POOLX)POOLX.forEach(function(e){e.P.g.visible=v&&!!(MT&&MT.eleven)})}
/* ---- 11 na 11: ustawienie 4-3-3 (u: od własnej bramki 0..1, v: szerokość 0..1) ---- */
var F433=[['GK',.02,.5],['RB',.24,.86],['CB',.17,.62],['CB',.17,.38],['LB',.24,.14],['CM',.44,.68],['DM',.36,.5],['CM',.44,.32],['RW',.66,.84],['ST',.72,.5],['LW',.66,.16]];
function isGK(e){return e===MT.gk||e===MT.ourGk}
function shapeT(e,bx,bz,poss){var o=Match.o,GX=o.GX,W=o.W,sl=e.sl;if(!sl)return null;var us=e.tm==='us',bp=clamp((bx+GX)/(2*GX),0,1),own=us?bp:1-bp,att=us?poss==='us':poss==='th';
 var u=clamp(sl[1]*.45+own*.4+(att?.1:.02),.05,.86),x=us?-GX+2*GX*u:GX-2*GX*u,z=(us?(sl[2]-.5):(.5-sl[2]))*W*.74+bz*.3;
 if(MT.setp==='pen'&&x>GX-18)x=GX-18-Math.random()*3;
 if(MT.clr){var c=MT.clr;if((x-c.x)*(GX-c.x)>0&&Math.abs(x-c.x)<Math.abs(GX-c.x)+1){var lz=lerp(c.z,0,(x-c.x)/(GX-c.x));if(Math.abs(z-lz)<3)z=lz+(z>=lz?3:-3)}}
 if(MT.clrR){var r=MT.clrR;if(x>r.x0&&x<r.x1&&Math.abs(z-r.z)<r.w)z=r.z+(z>=r.z?r.w:-r.w)}
 return{x:x,z:clamp(z,-W/2+1.5,W/2-1.5)}}
function shapeSnap(bx,bz,poss){var M=MT;M.all.forEach(function(e){if(!e.sl||isGK(e))return;var t=shapeT(e,bx,bz,poss);e.x=e.tx=t.x;e.z=e.tz=t.z})}
function tvCam(){var M=MT,o=Match.o,bx=o.ball.x,bz=o.ball.z,fb=clamp(bx,-o.GX+8,o.GX-8);M.cam=tall()?{p:[fb-17,15,bz*.8],t:[fb+4,0,bz*.9],k:1.6,fw:40,ft:56}:{p:[fb*.95,13,bz*.45+30],t:[fb,0,bz*.8-1],k:1.6,fw:38,ft:56}}
/* krótkie rozegranie 2-3 podań do zawodnika C */
function buildUp(tm,C,cb){var M=MT,o=Match.o,dir=tm==='us'?1:-1;M.poss=tm;var fin=false;
 var mates=M.all.filter(function(e){return e.tm===tm&&e.sl&&e!==C&&!isGK(e)&&e!==M.me&&e.P.g.visible});
 if(!mates.length){cb();return}
 var st=mates.slice().sort(function(a,b){return Math.abs(a.x-(C.x-dir*22))-Math.abs(b.x-(C.x-dir*22))})[0];
 var mid=mates.filter(function(e){return e!==st}).sort(function(a,b){return Math.hypot(a.x-(st.x+C.x)/2,a.z-(st.z+C.z)/2)-Math.hypot(b.x-(st.x+C.x)/2,b.z-(st.z+C.z)/2)})[0];
 var seq=[st,mid||C,C];if(seq[1]===C)seq=[st,C];o.ball.set(st.x,0,st.z);M.ball.owner=st;M.ball.path=null;M.ball.free=null;
 var ws=M.step;M.step=function(){tvCam()};tvCam();camSet.p=null;
 var k=0;(function nx(){if(!live())return;k++;if(k>=seq.length){M.step=ws;cb();return}var a=seq[k-1],b=seq[k];b.recv=1;b.tx=b.x;b.tz=b.z;setTimeout(function(){if(!live())return;faceNow(a,b.x,b.z);a.P.kick=.3;var dd=Math.hypot(b.x-a.x,b.z-a.z);ballTo(lineFn({x:o.ball.x,z:o.ball.z},{x:b.x,z:b.z},dd>20?1.4:.3),clamp(dd/17,.4,1.4),function(){b.recv=0;M.ball.owner=b;nx()})},k===1?500:350)})()}

var Match={enter:function(){var M=MT;var o=world(M.scn);this.o=o;this.scene=o.scene;useScene(o);if(o.setCrowd){var ck=M.us.c1+M.th.c1+M.crowd;if(o._ck!==ck){o._ck=ck;o.setCrowd([M.us.c1,M.us.c2,M.us.c1,M.th.c1],M.crowd)}}var P=me();P.set(lookA(),myKit());o.scene.add(P.g);P.cele=null;P.juggle=0;P.watch=false;P.ready=false;M.me={P:P,x:0,z:0,tx:0,tz:0,spd:6,name:S.name};
  if(!POOL){POOL=[];for(var i=0;i<3;i++){var e=mkEnt(randLook(i),null,MATE_NAMES[i]);o.scene.add(e.P.g);POOL.push(e)}
   for(var j=0;j<3;j++){var lk=randLook(j+4);var e2=mkEnt(lk,{sh:OPP_KIT.sh,sp:OPP_KIT.sp,so:OPP_KIT.so},OPP_NAMES[j]);o.scene.add(e2.P.g);POOL.push(e2)}
   POOL.push(mkEnt(randLook(7),{sh:{c:0x1f2937,t:0x16d97d},sp:0x111111,so:0x1f2937,gk:true},'Bramkarz'));POOL[6].kit0={sh:{c:0x1f2937,t:0x16d97d},sp:0x111111,so:0x1f2937,gk:true};o.scene.add(POOL[6].P.g);POOL.push(mkEnt(randLook(8),{sh:{c:0xfacc15,t:0x111111},sp:0x111111,so:0xfacc15,gk:true},'Mati'));POOL[7].kit0={sh:{c:0xfacc15,t:0x111111},sp:0x111111,so:0xfacc15,gk:true};o.scene.add(POOL[7].P.g)}
  POOL.forEach(function(e){o.scene.add(e.P.g)});var usK=M.orl?null:kitOf(M.us),thK=kitOf(M.th),kid=S.age<17?1:0,used=[S.name].concat(S.name.split(' '));
  function nm(f){for(var q=0;q<20;q++){var n=S.age<16?pick(f?KPD.FOREIGN:KPD.FIRST):pick(f?KPD.FLAST:KPD.LAST);if(used.indexOf(n)<0){used.push(n);return n}}return n}
  var yAge=(M.lv<=1||M.lv===9&&S.age<18)?S.age:18;POOL.forEach(function(e,i){var lk=e.P.look;lk.kid=kid;lk.age=yAge<18?yAge+(i%3===1?1:i%3===2?-.5:0):18;if(i<3){lk.shirt=S.look.shirt;e.P.set(lk,usK);e.name=nm(M.lv>=3&&M.lv<9&&Math.random()<.6)}else if(i<6){e.P.set(lk,thK);e.name=nm(M.lv>=3)}else{e.P.set(lk,e.kit0);e.name=nm(i===6?M.lv>=3:M.lv>=3&&M.lv<9&&Math.random()<.5)}});
  M.mates=POOL.slice(0,3);M.opps=POOL.slice(3,6);M.gk=POOL[6];M.ourGk=POOL[7];M.eleven=!M.orl;M.ex=[];
  M.me.tm='us';M.mates.forEach(function(e){e.tm='us'});M.opps.forEach(function(e){e.tm='th'});M.gk.tm='th';M.ourGk.tm='us';M.me.sl=null;POOL.forEach(function(e){e.sl=null});
  if(M.eleven){if(!POOLX){POOLX=[];for(var x=0;x<14;x++){var ex=mkEnt(randLook(x+11),null,'');ex.ex=1;POOLX.push(ex)}}POOLX.forEach(function(e){o.scene.add(e.P.g)});
   var myS=S.pos==='N'?9:S.pos==='S'?8:5,mS=[9,8,10,5,7].filter(function(q){return q!==myS}).slice(0,3),rU=[1,2,3,4,5,6,7,8,9,10].filter(function(q){return q!==myS&&mS.indexOf(q)<0}),oS=[2,3,9],rO=[1,4,5,6,7,8,10];
   M.me.sl=F433[myS];M.mates.forEach(function(e,i){e.sl=F433[mS[i]]});M.opps.forEach(function(e,i){e.sl=F433[oS[i]]});
   POOLX.forEach(function(e,i){var lk=e.P.look;lk.kid=kid;lk.age=yAge<18?yAge+(i%3===1?1:i%3===2?-.5:0):18;if(i<7){e.tm='us';e.sl=F433[rU[i]];lk.shirt=S.look.shirt;e.P.set(lk,usK);e.name=nm(M.lv>=3&&M.lv<9&&Math.random()<.6)}else{e.tm='th';e.sl=F433[rO[i-7]];e.P.set(lk,thK);e.name=nm(M.lv>=3)}e.jx=0;e.jz=0});M.ex=POOLX}
  M.all=[M.me].concat(M.mates,M.opps,[M.gk,M.ourGk],M.ex);poolShow(true)},
 exit:function(){poolShow(false)},
 update:function(dt){var M=MT,o=this.o,sd=dt*slow;if(M.rp){replayStep(dt);return}netUpd(o,dt);if(M.clockFn)M.clockFn(dt);
  if(M.eleven){var amb=M.step&&M.step===M.ambStep;M.shT=(M.shT||0)-dt;if(M.shT<=0){M.shT=.3;M.jT=(M.jT||0)-.3;var jit=M.jT<=0;if(jit)M.jT=2;
   M.all.forEach(function(e){if(!e.sl||isGK(e))return;if(!e.ex&&!amb)return;if(M.ball.owner===e&&amb)return;if(e.recv||e.chase)return;if(jit){e.jx=rnd(-1.5,1.5);e.jz=rnd(-1.5,1.5)}var t=shapeT(e,o.ball.x,o.ball.z,M.poss);e.tx=t.x+(e.jx||0);e.tz=t.z+(e.jz||0);e.spd=e.ex?7.2:Math.max(e.spd,6.5)})}}
  M.all.forEach(function(e){var dx=e.tx-e.x,dz=e.tz-e.z,d=Math.hypot(dx,dz);var gkd=e.P.dive&&(e===M.gk||e===M.ourGk);var v=gkd?(d>.03?e.spd:0):(d>.15?Math.min(e.spd*(M.eleven&&!isGK(e)?1.15:1),d*4):0);if(e.P.slide&&e.P.slide.t>.5)v=0;if(e.P.dive&&e.P.dive.t>.6&&e.slot!=='gk')v=Math.min(v,e===MT.gk||e===MT.ourGk?v:0);if(d>.01){e.x+=dx/d*Math.min(d,v*sd);e.z+=dz/d*Math.min(d,v*sd)}e.P.sp=v;
   var fx,fz;if(e.face&&!(v>2.2&&!isGK(e)&&((e.face.x-e.x)*dx+(e.face.z-e.z)*dz)<0)){fx=e.face.x-e.x;fz=e.face.z-e.z}else if(v>.5){fx=dx;fz=dz}else if(M.eleven&&e.sl){fx=o.ball.x-e.x;fz=o.ball.z-e.z}if(fx!=null&&(fx||fz)){var ty=Math.atan2(fx,fz),dy=ty-e.P.yaw;while(dy>Math.PI)dy-=6.283;while(dy<-Math.PI)dy+=6.283;e.P.yaw+=dy*Math.min(1,sd*8)}
   e.P.g.position.set(e.x,0,e.z);CH.animate(e.P,sd)});
  /* piłka */
  var B=M.ball;if(M.sh)shStep(M.sh,sd);else if(B.held){var hp=heldPos(B.held);o.ball.set(hp.x,hp.y,hp.z,sd)}else if(B.path){B.path.t+=sd/B.path.T;var k=Math.min(1,B.path.t),p=B.path.fn(k);o.ball.set(p.x,p.y,p.z,sd);if(B.path.t>=1){var cb=B.path.cb;B.path=null;if(cb)cb()}}
  else if(B.owner){var e=B.owner;o.ball.set(e.x+Math.sin(e.P.yaw)*.45,0,e.z+Math.cos(e.P.yaw)*.45,sd)}
  else if(B.free){freeBall(B.free,sd,o.GX);B.free.vx*=.995;B.free.vz*=.995;o.ball.set(B.free.x,B.free.y,B.free.z,sd)}
  if(M.step)M.step(dt,sd);recFrame(sd);
  /* kamera */
  var c=M.cam||{};fov(c.fw||42,c.ft||58);var tl=tall();if(c.p)camSet(c.p[0],c.p[1],c.p[2],c.t[0],c.t[1],c.t[2],Math.min(1,dt*(c.k||2.5)));
  if(M.draw)M.draw()},
 up:function(p,pts){if(MT.onUp)MT.onUp(p,pts)},down:function(p){if(MT.onDown)MT.onDown(p)},key:function(k,d){if(MT.onKey)return MT.onKey(k,d)}};
function live(){return MT&&cur===Match}
function ballTo(fn,T,cb){if(!live())return;MT.sh=null;MT.ball.held=null;MT.ball.owner=null;MT.ball.free=null;MT.ball.path={fn:fn,T:T,t:0,cb:cb}}
function lineFn(a,b,h){return function(k){return{x:lerp(a.x,b.x,k),z:lerp(a.z,b.z,k),y:(h||0)*4*k*(1-k)}}}
function mHud(){var M=MT;var e=uiEl.querySelector('.kp-msc');if(e)e.innerHTML='<i class="t1" style="background:'+M.us.c1+'"></i><span>'+esc(shortN(M.us.n,M.lv))+'</span><b>'+M.sc[0]+' : '+M.sc[1]+'</b><span>'+esc(shortN(M.th.n,M.lv))+'</span><i class="t2" style="background:'+M.th.c1+'"></i><em>'+mm()+"'</em>"}
function feed(t,cls){var f=uiEl.querySelector('.kp-feed');if(!f)return;var p=document.createElement('p');p.className=cls||'';p.innerHTML=t;f.prepend(p);while(f.children.length>3)f.lastChild.remove()}
function prompt(t,sub){var e=uiEl.querySelector('.kp-prm');if(!e)return;if(!t){e.className='kp-prm';return}e.innerHTML='<b>'+t+'</b>'+(sub?'<span>'+sub+'</span>':'');e.className='kp-prm on'}
function timerBar(k){var e=uiEl.querySelector('.kp-tbar');if(!e)return;if(k==null){e.className='kp-tbar';return}e.className='kp-tbar on';e.firstChild.style.width=(k*100)+'%'}
function mm(){var M=MT;return Math.max(1,Math.min(mxMin(),Math.floor(M.clk!=null?M.clk:M.min*M.minK)+1))}
function matchStart(kind){kind=kind||'league';var c=S.c,lg=L(),us,th,title,home=true;
 if(kind==='league'){var oi=oppIdx();us=club();th=club(oi.i);us.lv=th.lv=c.lv;home=oi.home;title=(c.lv===0?'Liga Orlików':lg.n)+' · kolejka '+(c.week+1)}
 else{if(!c.natOpp)c.natOpp=pick(KPD.NATIONS);var n=c.natOpp;us={n:'Polska',str:Math.round(clamp(ovr()-1,76,85)),c1:'#ffffff',c2:'#dc2626',lv:9};th={n:n[0],str:n[1]+(kind==='final'?2:0),c1:n[2],c2:n[3],lv:9};title=kind==='final'?tourName()+' · FINAŁ':'Reprezentacja · mecz towarzyski'}
 th=fixKit(us,th);
 var orl=kind==='league'&&c.lv===0,gap=th.str-us.str,rl=kind==='league'?role():'start';
 var mins=rl==='start'?[4,8,12,16]:rl==='rot'?[8,12,16]:[12,16];
 MT={sc:[0,0],min:0,mom:0,goals:0,ast:0,drb:0,bad:0,ball:{},stats:[],ents:null,kind:kind,us:us,th:th,home:home,away:0,lv:kind==='league'?c.lv:9,orl:orl,scn:orl?'orlik':'stadium',crowd:kind==='league'?(lg.crowd||0):1,minK:orl?1:4.5,
  diff:(kind==='league'?lg.diff:1.12)*(1+gap*.008)*(1+(50-S.rel.forma)*.005),oppP:clamp(.42+gap*.03,.18,.72),teamP:clamp(.3-gap*.02,.12,.5),role:rl,mins:mins};
 var base=['shot','drib','pass','head','tackle'].sort(function(){return Math.random()-.5}).slice(0,mins.length);if(mins.length>=3&&Math.random()<.55)base[Math.floor(Math.random()*base.length)]=pick(['free','free','pen']);MT.plan=base;MT.goal=pick([['g','Strzel gola',40],['a','Zalicz asystę',35],['w','Wygraj mecz',40]]);
 setMode(Match);
 ui('<div class="kp-mtop"><button class="kp-x" data-a="mQuit">✕</button><div class="kp-msc"></div></div><div class="kp-feed"></div><div class="kp-prm"></div><div class="kp-tbar"><i></i></div>'+
  '<div class="kp-intro"><div><p class="kp-eye">'+esc(title)+' · '+(orl?'2 × 10 minut':'90 minut')+'</p>'+(stakes(kind,us,th)?'<p class="kp-stake">'+stakes(kind,us,th)+'</p>':'')+'<h3>'+esc(us.n)+'<br><small>vs</small> '+esc(th.n)+'</h3><p>'+(rl==='start'?'Grasz od pierwszej minuty. ':rl==='rot'?'Trener wpuści Cię w trakcie pierwszej połowy. ':'Zaczynasz na ławce. Wejdziesz w drugiej połowie. ')+'Mecz leci sam. Kiedy piłka trafi do Ciebie, czas zwolni.</p><p class="kp-mgoal">🎯 Cel trenera: <b>'+MT.goal[1]+'</b> · 🪙 +'+fmtN(MT.goal[2]*MCOIN[c.lv])+'</p><button class="kp-btn big" data-a="mGo">▶ Pierwszy gwizdek</button></div></div>');
 mHud();setupAmbient();var sx=Match.o.GX/28;MT.cam={p:[-10,16+(sx-1)*8,30+(sx-1)*14],t:[0,0,0],k:1}}
function setupAmbient(){var M=MT;M.step=null;M.draw=null;M.onUp=null;M.onDown=null;M.onKey=null;slow=1;prompt(null);timerBar(null);M.clr=null;M.clrR=null;M.setp=null;M.sh=null;M.ball.held=null;M.all.forEach(function(e){e.recv=0;e.chase=0});
 if(M.eleven){var o0=Match.o,hh=M.hint,h=hh||{x:0,z:0,poss:'us'};M.hint=null;var deep=Math.abs(o0.ball.x)>o0.GX-16,snap=!!hh||!M.snapped||deep;M.snapped=1;M.setp=h.setp||null;if(!hh&&deep&&M.snapped){var sg=o0.ball.x>0?1:-1;h={x:sg*(o0.GX-26),z:rnd(-6,6),poss:sg>0?'th':'us'}}if(!hh&&!snap){h={x:o0.ball.x,z:o0.ball.z,poss:M.poss||'us'}}M.poss=h.poss;M.ball.path=null;M.ball.free=null;M.all.forEach(function(e){e.face=null;e.P.ready=false;e.P.cele=null;e.P.dive=null;e.P.slide=null;e.spd=6.5});
  if(snap){if(M.min>0)cut();M.actIdx=(M.recBase||0)+(M.rec?M.rec.length:0);o0.ball.set(h.x,0,h.z);shapeSnap(h.x,h.z,h.poss)}M.gk.x=M.gk.tx=o0.GX-.7;M.gk.z=M.gk.tz=0;M.ourGk.x=M.ourGk.tx=-o0.GX+.7;M.ourGk.z=M.ourGk.tz=0;M.gk.face={x:0,z:0};M.ourGk.face={x:0,z:0};
  var cands=M.all.filter(function(e){return e.tm===h.poss&&e.sl&&!isGK(e)}).sort(function(a,b){return Math.hypot(a.x-h.x,a.z-h.z)-Math.hypot(b.x-h.x,b.z-h.z)});M.ball.owner=cands[0];M.pT=.7;
  M.ambStep=function(dt){tvCam();var B=M.ball,ow=B.owner;if(B.path)return;if(!ow){var nr=M.all.filter(function(e){return e.sl&&!isGK(e)}).sort(function(a,b){return Math.hypot(a.x-o0.ball.x,a.z-o0.ball.z)-Math.hypot(b.x-o0.ball.x,b.z-o0.ball.z)})[0];if(!B.free&&Math.hypot(nr.x-o0.ball.x,nr.z-o0.ball.z)>.9){B.free={x:o0.ball.x,y:0,z:o0.ball.z,vx:0,vy:0,vz:0}}nr.chase=1;nr.tx=o0.ball.x;nr.tz=o0.ball.z;nr.spd=7.8;if(Math.hypot(nr.x-o0.ball.x,nr.z-o0.ball.z)<.9){nr.chase=0;B.free=null;B.owner=nr;M.poss=nr.tm}return}
   var dir=ow.tm==='us'?1:-1,deep=ow.x*dir>o0.GX-26,T=M.tgt,mine=T&&ow.tm===T.poss;if(mine){var dd0=T.x-ow.x;ow.tx=Math.abs(dd0)>5?ow.x+Math.sign(dd0)*3:ow.x;deep=false}else ow.tx=clamp(ow.x+dir*(deep?-2:3),-o0.GX+6,o0.GX-6);ow.tz=ow.z*.96;ow.spd=6.8;ow.face=null;M.pT-=dt;if(T&&!mine&&M.segK>.04)M.pT=Math.min(M.pT,.3);if(T&&mine&&Math.abs(ow.x-T.x)>12)M.pT=Math.min(M.pT,.9);
   if(M.pT<=0){M.pT=rnd(.9,1.7);var tms=M.all.filter(function(e){return e.tm===ow.tm&&e!==ow&&e.sl&&!isGK(e)});var cand=tms.filter(function(e){var dd=Math.hypot(e.x-ow.x,e.z-ow.z);return dd>6&&dd<26&&(deep?(e.x-ow.x)*dir<0:(e.x-ow.x)*dir>-6)});var tg=cand.length?pick(cand):pick(tms);if(T&&mine){var c2=tms.filter(function(e){var dd=Math.hypot(e.x-ow.x,e.z-ow.z);return dd>6&&dd<30}).sort(function(a,b){return Math.abs(a.x-T.x)-Math.abs(b.x-T.x)});if(c2.length)tg=c2[Math.floor(Math.random()*Math.min(2,c2.length))];if(Math.abs(ow.x-T.x)<7)M.pT=rnd(1.2,1.8)}
    var rec=tg;if(T?(!mine&&M.segK>.04):Math.random()<.16){var mx=(ow.x+tg.x)/2,mz=(ow.z+tg.z)/2;rec=M.all.filter(function(e){return e.tm!==ow.tm&&e.sl&&!isGK(e)}).sort(function(a,b){return Math.hypot(a.x-mx,a.z-mz)-Math.hypot(b.x-mx,b.z-mz)})[0]}
    faceNow(ow,rec.x,rec.z);ow.P.kick=.3;var dd=Math.hypot(rec.x-ow.x,rec.z-ow.z),ang=Math.atan2(rec.x-ow.x,rec.z-ow.z);rec.recv=1;rec.tx=rec.x;rec.tz=rec.z;rec.face={x:ow.x,z:ow.z};var rp={x:rec.x-Math.sin(ang)*.45,z:rec.z-Math.cos(ang)*.45};B.owner=null;ballTo(lineFn({x:o0.ball.x,z:o0.ball.z},rp,dd>18?1.3:.25),clamp(dd/17,.35,1.4),function(){rec.recv=0;rec.face=null;M.ball.owner=rec;M.poss=rec.tm})}};
  M.step=M.ambStep;tvCam();return}
 var o=Match.o,sx=o.GX/28,sz=o.W/30;var spots=[[-6,-6],[-10,4],[2,8],[8,-3],[-2,0],[12,6],[6,-9]].map(function(q){return[q[0]*sx,q[1]*sz]});M.me.x=M.me.tx=-4*sx;M.me.z=M.me.tz=-2*sz;
 M.mates.forEach(function(e,i){e.x=e.tx=spots[i][0];e.z=e.tz=spots[i][1]});M.opps.forEach(function(e,i){e.x=e.tx=spots[i+3][0];e.z=e.tz=spots[i+3][1]});M.gk.x=M.gk.tx=o.GX-.7;M.gk.z=M.gk.tz=0;M.ourGk.x=M.ourGk.tx=-o.GX+.7;M.ourGk.z=M.ourGk.tz=0;
 M.all.forEach(function(e){e.face=null;e.P.ready=false;e.P.cele=null;e.P.dive=null;e.P.slide=null;e.spd=4});M.gk.face={x:0,z:0};M.ourGk.face={x:0,z:0};M.ball.owner=M.mates[1];
 M.step=function(dt){M.amb=(M.amb||0)+dt;if(M.amb>1.2){M.amb=0;M.all.forEach(function(e){if(e!==M.gk&&e!==M.ourGk){e.tx=clamp(e.x+rnd(-5,5)*sx,-24*sx,22*sx);e.tz=clamp(e.z+rnd(-4,4)*sz,-12*sz,12*sz)}});var ow=pick(M.all.filter(function(e){return e!==M.gk&&e!==M.ourGk}));M.ball.owner=ow}};
 M.cam={p:[-4,15+(sx-1)*8,27+(sx-1)*14],t:[0,0,0],k:1.2,fw:42,ft:62}}
/* ---------- ZEGAR MECZU: jeden plan wydarzeń, minuty płyną razem z akcjami ---------- */
function stakes(kind,us,th){if(kind==='final')return '🏆 Finał! Gra o złoto dla Polski';if(kind==='nat')return '🇵🇱 Grasz z orzełkiem na piersi';var c=S.c;if(!c.week)return 'Pierwszy mecz sezonu';var t=sortTab(),pm=myPos(),po=0;t.forEach(function(x,k){if(club(x.i).n===th.n)po=k+1});
 var cityU=us.n.split(' ').pop(),cityT=th.n.split(' ').pop();if(cityU===cityT&&c.lv>0)return '🔥 DERBY '+cityU.toUpperCase()+'! Całe miasto patrzy';
 if(c.week>=c.weeks-1&&pm<=2)return '🏆 Ostatnia kolejka! Walka o mistrzostwo';if(pm<=2&&po<=2)return '⚔️ Hit kolejki: '+pm+'. miejsce kontra '+po+'.';if(pm>=7)return '⚠️ Jesteś w dole tabeli, każdy punkt na wagę złota';if(po===1)return '💪 Grasz z liderem tabeli';return ''}
function mxMin(){return MT.orl?20:90}
function buildSchedule(){var M=MT,mx=mxMin(),K=mx/90,ev=[],n=M.plan.length;
 var lo=M.role==='start'?6*K:M.role==='rot'?28*K:52*K;
 for(var i=0;i<n;i++)ev.push({m:lo+(mx-4*K-lo)*(i+rnd(.25,.75))/n,k:'mom',type:M.plan[i]});
 var ns=M.orl?3:3;for(var j=0;j<ns;j++){var r=Math.random(),e=r<.55?{t:'def',out:Math.random()<.22?'tackle':'shot'}:{t:'team',out:'shot'};ev.push({m:rnd(4*K,mx-10*K),k:'sim',ev:e})}
 if(M.role!=='start')ev.push({m:lo-3*K,k:'sub'});
 var hf=mx/2;if(!ev.some(function(e){return e.m>=hf-7*K&&e.m<=hf-1*K}))ev.push({m:rnd(hf-6*K,hf-2*K),k:'sim',ev:{t:Math.random()<.5?'def':'team',out:'shot'}});
 ev.sort(function(a,b){return a.m-b.m});for(var q=1;q<ev.length;q++)if(ev[q].m<ev[q-1].m+5*K)ev[q].m=ev[q-1].m+5*K;
 var last=ev[ev.length-1];if(last.k!=='sub')last.m=Math.max(last.m,rnd(mx-6*K,mx-1.5*K));
 for(q=ev.length-1;q>0;q--)if(ev[q].m>mx-1*K)ev[q].m=mx-1*K;
 ev.forEach(function(e){e.m=Math.round(e.m*10)/10});M.sched=ev;M.si=0;M.clk=0}
function lines(){var M=MT,d=M.sc[0]-M.sc[1],late=M.clk>mxMin()*.7;if(Math.random()<.45){var c=d<0?(late?['Twoja drużyna rzuca wszystko do ataku!','Kibice ponaglają, czasu coraz mniej','Trener krzyczy przy linii: do przodu!']:['Trzeba odrobić straty, drużyna szuka szansy','Rywale mądrze kontrolują grę']):d>0?(late?['Rywale ruszyli do ataku, trzeba dowieźć wynik!','Twoja drużyna broni się całym zespołem','Kibice odliczają minuty']:['Prowadzenie dodaje skrzydeł','Rywale szukają odpowiedzi']):(late?['Remis wisi w powietrzu, kto pierwszy?','Nerwowa końcówka, każdy błąd może kosztować']:['Wyrównany mecz, nikt nie odpuszcza']);return c}return[M.mates[0].name+' wrzuca z autu',M.mates[1].name+' fauluje na środku','Rywale klepią piłkę w obronie',M.mates[2].name+' wybija na aut','Bramkarz rywali wykopuje daleko',M.ourGk.name+' łapie dośrodkowanie','Ostra walka w środku pola',M.opps[0].name+' dostaje żółtą kartkę','Kibice niosą drużynę!','Rywale próbują długiej piłki','Twoja drużyna cierpliwie rozgrywa']}
/* gra toczy się sama aż do minuty `target` (secs = ile sekund trwa ten fragment) */
function playTo(target,secs,cb,tg){var M=MT,half=mxMin()/2;if(tg===undefined&&M.nextTg!==undefined){tg=M.nextTg;M.nextTg=undefined}setupAmbient();M.tgt=tg||null;M.segK=0;

 tickShow();if(tg&&M.eleven){var need=Math.abs(Match.o.ball.x-tg.x)/10+1.5;secs=Math.max(secs,Math.min(8,need))}var c0=M.clk,t=0,fl=0;M.mst=M.mst||{pos:50,sh:[0,0]};M.clockFn=function(dt){if(M.tkFast){t=secs}t+=dt;fl+=dt;M.mst.pos=clamp(M.mst.pos+((M.poss==='us'?62:38)-M.mst.pos)*dt*.04,25,75);M.segK=Math.min(1,t/secs);M.clk=lerp(c0,target,Math.min(1,t/secs));M.min=M.clk/M.minK;mHud();tickUpd();if(fl>1.1){fl=0;if(Math.random()<.6)tickFeed('<b>'+mm()+"'</b> "+pick(lines()))}if(t>=secs){M.clockFn=null;M.clk=target;M.min=M.clk/M.minK;mHud();M.tgt=null;cb()}}}
function runClock(){if(!live())return;var M=MT,mx=mxMin();if(M.ended)return;
 if(!M.drama&&M.clk>=mx*.72&&M.clk<mx-6*mx/90&&M.sc[0]<M.sc[1]&&M.sc[1]-M.sc[0]<=1){M.drama=1;var nm=Math.min(mx-2*mx/90,M.clk+5*mx/90);M.sched.splice(M.si,0,{m:nm,k:'mom',type:pick(['shot','head','drib'])});M.sched.sort(function(a,b){return a.m-b.m});tickShow();tickFeed('<b>'+mm()+"'</b> Trener: wszyscy do ataku! Masz szansę to odwrócić!")}
 else if(!M.drama&&M.clk>=mx*.72&&M.clk<mx-6*mx/90&&M.sc[0]>M.sc[1]&&M.sc[0]-M.sc[1]<=1){M.drama=1;var nm2=Math.min(mx-2*mx/90,M.clk+4*mx/90);M.sched.splice(M.si,0,{m:nm2,k:'sim',ev:{t:'def',out:'shot'}});M.sched.sort(function(a,b){return a.m-b.m});tickShow();tickFeed('<b>'+mm()+"'</b> Rywale ruszają do szturmu, trzeba dowieźć wynik!")}
 if(!M.halfDone&&M.clk>=mx/2-7*mx/90){halfTime();return}
 if(M.si>=M.sched.length){playTo(mx,clamp((mx-M.clk)/mx*30,1,2.5),whistle);return}
 var e=M.sched[M.si];M.si++;if(e.k==='sim'&&e.ev.t==='def'&&M.lastWin)e.ev={t:'team',out:'shot'};M.lastWin=0;var secs=clamp((e.m-M.clk)/mx*34,2.2,5),isLast=M.si>=M.sched.length;
 var GXc=Match.o.GX,tgz=e.k==='sub'?null:e.k==='mom'?(e.type==='tackle'?{x:-GXc+32,poss:'th'}:{x:GXc-28,poss:'us'}):(e.ev.t==='def'?{x:-GXc+34,poss:'th'}:{x:GXc-34,poss:'us'});
 M.nextTg=tgz;playTo(e.m,secs,function(){if(!live())return;if(e.k!=='sub')tickHide();
  if(e.k==='sub'){tickFeed('<b>'+mm()+"'</b> Zmiana! Wchodzisz na boisko.");banner('WCHODZISZ!','Trener daje Ci szansę','');setTimeout(runClock,1200);return}
  if(e.k==='sim'){simAction(e.ev,function(){if(!live())return;if(isLast){whistle();return}runClock()});return}
  var k=e.type;if(M.eleven)M.hint=k==='tackle'?{x:-Match.o.GX+30,z:0,poss:'th'}:{x:Match.o.GX-24,z:0,poss:'us',setp:k==='pen'?'pen':null};M.lastMom=isLast;
  M.actIdx=(M.recBase||0)+(M.rec?M.rec.length:0);if(isLast&&Math.abs(M.sc[0]-M.sc[1])<=1){M.clockFn=null;banner('OSTATNIA AKCJA!',M.sc[0]<M.sc[1]?'Musisz wyrównać!':M.sc[0]===M.sc[1]?'Gol daje zwycięstwo!':'Dowieź wynik!','gold');setTimeout(function(){if(live())MOM[k]()},2300)}else MOM[k]()})}
/* po każdej akcji zawodnika: dalej zegar albo koniec meczu, jeśli to była ostatnia akcja */
function leadIn(tm,e){var M=MT;if(!M.eleven)return;var tx=e.tx,tz=e.tz,ca=M.cam;e.tx=e.x;e.tz=e.z;buildUp(tm,e,function(){if(!live())return;e.tx=tx;e.tz=tz;M.cam=ca;camSet.p=null;if(tm==='th')M.ball.owner=null})}
/* ---------- TICKER (jak w FM): między akcjami kluczowymi gra nie jest pokazywana ---------- */
function tickShow(){var M=MT;var el=uiEl.querySelector('.kp-tick');if(!el){el=document.createElement('div');el.className='kp-tick';el.innerHTML='<div class="kp-tk-c"><div class="kp-tk-h"><span>MECZ TRWA</span><b class="kp-tk-min"></b></div><div class="kp-tk-sc"><i style="background:'+M.us.c1+'"></i><span>'+esc(shortN(M.us.n,M.lv))+'</span><b></b><span>'+esc(shortN(M.th.n,M.lv))+'</span><i style="background:'+M.th.c1+'"></i></div><div class="kp-tk-st"></div><div class="kp-tk-feed"></div><button class="kp-tk-skip" data-a="tkSkip">Następna kluczowa akcja ›</button></div>';uiEl.appendChild(el)}tickUpd();return el}
function tickHide(){var el=uiEl.querySelector('.kp-tick');if(el)el.remove();if(MT)MT.tkFast=0}
function tickFeed(t){var f=uiEl.querySelector('.kp-tk-feed');if(!f){feed(t);return}var p=document.createElement('p');p.innerHTML=t;f.prepend(p);while(f.children.length>5)f.lastChild.remove()}
function tickUpd(){var M=MT,el=uiEl.querySelector('.kp-tick');if(!el)return;el.querySelector('.kp-tk-min').textContent=mm()+"'";el.querySelector('.kp-tk-sc b').textContent=M.sc[0]+' : '+M.sc[1];
 var st=M.mst||{pos:50,sh:[0,0]},p=Math.round(st.pos),row=function(l,a,b,pa){return '<div><b>'+a+'</b><span>'+l+'</span><b>'+b+'</b><i><u style="width:'+pa+'%;background:'+M.us.c1+'"></u></i></div>'};
 el.querySelector('.kp-tk-st').innerHTML=row('Posiadanie piłki',p+'%',(100-p)+'%',p)+row('Strzały',st.sh[0],st.sh[1],st.sh[0]+st.sh[1]?st.sh[0]/(st.sh[0]+st.sh[1])*100:50)}
function halfTime(){var M=MT,hf=mxMin()/2;M.halfDone=1;M.clockFn=null;M.step=null;M.clk=hf;M.min=hf/M.minK;mHud();M.all.forEach(function(e){e.tx=e.x;e.tz=e.z});M.ball.owner=null;
 tickShow();tickFeed('<b>'+hf+"'</b> Sędzia kończy pierwszą połowę");banner('PRZERWA',M.us.n.split(' ')[0]+' '+M.sc[0]+' : '+M.sc[1]+' '+shortN(M.th.n,M.lv),'');
 setTimeout(function(){if(!live())return;M.clk=hf+.05;M.hint={x:0,z:0,poss:'th'};setupAmbient();tickFeed('<b>'+(hf+1)+"'</b> Rusza druga połowa!");runClock()},2400)}
function nextMoment(){if(!live())return;var M=MT;if(M.si>=M.sched.length){whistle();return}runClock()}
function whistle(){if(!live())return;var M=MT;if(M.ended)return;tickHide();M.ended=1;M.clockFn=null;M.step=null;M.draw=null;M.onUp=M.onDown=M.onKey=null;slow=1;prompt(null);timerBar(null);M.sh=null;
 M.clk=Math.max(M.clk,mxMin()-.5);M.min=M.clk/M.minK;mHud();
 M.all.forEach(function(e){e.tx=e.x;e.tz=e.z;e.face=null});M.ball.owner=null;M.ball.path=null;
 banner('KONIEC MECZU',M.us.n.split(' ')[0]+' '+M.sc[0]+' : '+M.sc[1]+' '+shortN(M.th.n,M.lv),'');feed('<b>'+mm()+"'</b> Sędzia kończy mecz!",'half');setTimeout(function(){if(live())matchEnd()},2100)}
/* akcje, w których grają koledzy i rywale (oglądasz) */
/* gole w akcjach symulowanych */
function oppGoal(A,txt){var M=MT;M.sc[1]++;mHud();flash();banner('GOL RYWALA',A.name+' · '+mm()+"'",'opp');feed('⚽ <b>'+mm()+"'</b> "+esc(A.name)+(txt||' trafia do siatki.'),'opp');A.P.cele={type:pick([0,1]),t:0};setTimeout(function(){A.P.cele=null},2200)}
function teamGoal(C,cont){var M=MT;M.sc[0]++;mHud();flash();markGoal();banner('GOOOL!',C.name+' · '+mm()+"'",'gold');feed('⚽ <b>'+mm()+"'</b> "+esc(C.name)+' trafia!','me');C.P.cele={type:pick([0,1,4]),t:0};C.tx=C.x;C.tz=C.z;
 M.cam={p:[C.x-4.5,1.9,C.z+(C.z>0?-4.5:4.5)],t:[C.x,1.1,C.z],k:1.4,fw:40,ft:55};repBtn(function(){C.P.cele=null;startReplay(cont)},function(){C.P.cele=null;cont()},3000)}
/* akcje drużyn (oglądasz): kontra, dośrodkowanie, strzał z dystansu, prostopadłe podanie */
function simAction(ev,done){if(!live())return;var M=MT,o=Match.o,GX=o.GX,W=o.W;M.step=null;var fin=false;function end(d){if(fin)return;fin=true;setTimeout(function(){if(live())done()},d||1800)}
 var tm=ev.t==='def'?'th':'us',dir=tm==='us'?1:-1,gx=dir*GX,sc=M.orl?.62:1,gk=tm==='us'?M.gk:M.ourGk,att=tm==='us'?M.mates:M.opps,dfd=tm==='us'?M.opps:M.mates;
 function X(a){return gx-dir*a*sc}
 var type=ev.out==='tackle'?'counter':pick(['counter','cross','through','combo','combo','cross','through','long']);M.lastType=type;M.actIdx=(M.recBase||0)+(M.rec?M.rec.length:0);
 if(M.eleven){cut();shapeSnap(X(30),0,tm)}
 M.all.forEach(function(e){e.face=null;e.spd=6.5;e.P.cele=null;e.P.dive=null;e.P.slide=null;e.P.ready=false;e.recv=0;e.chase=0});M.poss=tm;M.sh=null;M.ball.held=null;M.ball.free=null;M.ball.path=null;
 [M.gk,M.ourGk].forEach(function(g){var gd=g===M.gk?1:-1;g.x=g.tx=gd*GX-gd*.7;g.z=g.tz=0;g.face={x:g.x-gd*10,z:0}});gk.P.ready=true;
 var C=(tm==='th'&&M.eleven)?M.opps[2]:pick(att),H=att.filter(function(e){return e!==C})[0],D=pick(dfd),D2=dfd.filter(function(e){return e!==D})[0];
 if(tm==='us'){M.me.x=X(30);M.me.z=rnd(-8,8);M.me.tx=X(18);M.me.tz=M.me.z*.7;M.me.spd=5}else{M.me.x=X(40);M.me.z=-4;M.me.tx=X(30);M.me.tz=-2;M.me.spd=4}
 var who=tm==='us'?'':'opp',lab=tm==='us'?'':'Rywale: ';
 function outcome(sh0,res,inf){if(!live())return;if(res==='goal'){if(tm==='us')teamGoal(sh0,function(){end(300)});else{oppGoal(sh0);end(2400)}return}
  var t=shotTxt(res,inf);if(res==='save'||res==='catch'){if(tm==='th'){banner(M.ourGk.name.toUpperCase()+' BRONI!',res==='catch'?'Pewny chwyt':'Świetna parada','');feed('<b>'+mm()+"'</b> "+esc(M.ourGk.name)+' broni strzał '+esc(sh0.name)+'!','me')}else{banner(res==='catch'?'ZŁAPANA':'OBRONIONA','Strzał '+sh0.name,'opp');feed('<b>'+mm()+"'</b> Bramkarz broni strzał "+esc(sh0.name)+'.')}end(1900)}
  else{if(res==='post')banner(t[0],sh0.name,tm==='us'?'opp':'');feed('<b>'+mm()+"'</b> "+esc(sh0.name)+' '+t[2]+(tm==='th'?' Uff!':''));end(1600)}}
 function shoot(sh0,hd,q){if(!live())return;faceNow(sh0,gx,0);if(hd){sh0.P.head=.7}else{sh0.P.kick=.38}var s=aiShotS(o.ball.x,o.ball.z,dir,clamp((q||.66)*(tm==='us'?mods().chem:mods().home),.2,.95));if(hd){s.P0.y=1.55;s.T=Math.hypot(gx-o.ball.x,s.P1.z-o.ball.z)/rnd(12,16);s.arc=0}
  physShot(s,gk,{dir:dir,ai:tm==='us'?aiOpp(s):aiOur()},function(res,inf){outcome(sh0,res,inf)});var bz=o.ball.z;M.cam={p:[gx-dir*11,3.2,bz*.5+(bz>0?-6:6)],t:[gx,1,0],k:2}}
 function go(first,start){if(M.eleven){var stp=M.step;M.step=null;first.tx=first.x;first.tz=first.z;buildUp(tm,first,function(){M.ball.owner=first;start()})}else{M.ball.owner=first;start()}}
 if(type==='counter'){var z0=rnd(-6,6);C.x=X(28);C.z=z0;C.tx=C.x;C.tz=C.z;C.spd=7.4;D.x=X(31);D.z=z0+(z0>0?-5:5);D.tx=D.x;D.tz=D.z;D.spd=ev.out==='tackle'?8.6:6.8;
  feed('<b>'+mm()+"'</b> "+(tm==='th'?'Kontra rywali! ':'Kontra! ')+esc(C.name)+' pędzi na bramkę...',who);
  go(C,function(){C.tx=X(13);C.tz=z0*.35;M.cam={p:[gx-dir*19,6.5,C.z+15],t:[gx-dir*9,0,C.z*.3],k:1.8,fw:44,ft:64};var shot=false;
   M.step=function(){if(fin||shot)return;if(ev.out==='tackle'){D.tx=C.x-dir*1.2;D.tz=C.z;if(Math.hypot(D.x-C.x,D.z-C.z)<2.6&&!D.P.slide){D.P.slide={t:0};D.face={x:C.x+dir*3,z:C.z};D.tx=C.x+dir*1.8;D.tz=C.z;D.spd=8;shot=true;
      setTimeout(function(){if(!live())return;M.ball.owner=null;M.ball.free={x:o.ball.x,y:0,z:o.ball.z,vx:-dir*3,vy:.5,vz:rnd(-2,2)};C.P.dive={t:0,s:1,high:false};C.tx=C.x;C.tz=C.z;banner('ODBIÓR!',D.name+' wślizgiem',tm==='th'?'':'opp');feed('<b>'+mm()+"'</b> "+esc(D.name)+' czystym wślizgiem odbiera piłkę!',tm==='th'?'me':'')},260);end(2000)}}
    else{D.tx=C.x+dir*.8;D.tz=C.z+(C.z>0?-1:1)}
    if(!shot&&(C.x-X(13.5))*dir>=0){shot=true;shoot(C)}}})}
 else if(type==='cross'){var sg=pick([-1,1]),wz=sg*Math.min(W/2-4,20),Wg=H;Wg.x=X(22);Wg.z=sg*Math.min(W/2-7,16);Wg.tx=Wg.x;Wg.tz=Wg.z;C.x=X(18);C.z=-sg*2;C.tx=C.x;C.tz=C.z;D.x=X(13);D.z=-sg*1;D.tx=D.x;D.tz=D.z;if(D2){D2.x=X(10);D2.z=sg*2;D2.tx=D2.x;D2.tz=D2.z}
  feed('<b>'+mm()+"'</b> "+esc(Wg.name)+' ucieka skrzydłem...',who);
  go(Wg,function(){Wg.tx=X(8);Wg.tz=wz;Wg.spd=7.6;C.tx=X(15);C.tz=-sg*1;M.cam={p:[gx-dir*24,8,-sg*14],t:[gx-dir*9,0,sg*4],k:1.6,fw:44,ft:64};var cr=false;
   M.step=function(){if(fin||cr)return;if((Wg.x-X(8.5))*dir>=0){cr=true;var meet={x:X(9.5),z:sg*rnd(-1.5,1)};faceNow(Wg,meet.x,meet.z);Wg.P.kick=.38;var a={x:o.ball.x,z:o.ball.z};C.tx=meet.x;C.tz=meet.z;C.spd=Math.max(5,Math.hypot(meet.x-C.x,meet.z-C.z)/.9);D.tx=meet.x+dir*.8;D.tz=meet.z+sg*.8;D.spd=5;
     ballTo(function(k){return{x:lerp(a.x,meet.x,k),z:lerp(a.z,meet.z,k),y:lerp(0,1.45,k)+3.4*4*k*(1-k)}},1,function(){if(!live())return;if(Math.random()<.22){M.ball.free={x:o.ball.x,y:o.ball.y,z:o.ball.z,vx:-dir*3,vy:2,vz:sg*3};D.P.head=.7;banner('WYBITA',D.name+' głową','');feed('<b>'+mm()+"'</b> "+esc(D.name)+' wybija dośrodkowanie.');end(1500);return}o.ball.set(meet.x,1.45,meet.z);shoot(C,true,.6)})}}})}
 else if(type==='long'){var lz=rnd(-9,9);C.x=X(31);C.z=lz;C.tx=C.x;C.tz=C.z;D.x=X(22);D.z=lz*.6;D.tx=D.x;D.tz=D.z;
  feed('<b>'+mm()+"'</b> "+esc(C.name)+' szuka miejsca do strzału z dystansu...',who);
  go(C,function(){C.tx=X(25);C.tz=lz*.85;C.spd=6;D.tx=X(21);D.tz=lz*.6;M.cam={p:[C.x-dir*7,2.8,C.z*.8+(C.z>0?-5:5)],t:[gx,1,0],k:2};var sh=false;
   M.step=function(){if(fin||sh)return;if((C.x-X(25.6))*dir>=0){sh=true;shoot(C,false,.42)}}})}
 else if(type==='combo'){var cz=rnd(-5,5);H.x=X(24);H.z=cz+rnd(-3,3);H.tx=H.x;H.tz=H.z;C.x=X(19);C.z=cz;C.tx=C.x;C.tz=C.z;D.x=X(15);D.z=cz;D.tx=D.x;D.tz=D.z;if(D2){D2.x=X(13);D2.z=cz+3;D2.tx=D2.x;D2.tz=D2.z}
  feed('<b>'+mm()+"'</b> "+esc(H.name)+' i '+esc(C.name)+' klepią piłkę przed polem karnym...',who);
  go(H,function(){M.cam={p:[gx-dir*30,9,cz+15],t:[gx-dir*14,0,cz*.4],k:1.8,fw:44,ft:64};function ps(a,b,tg,T,cb){faceNow(a,tg.x,tg.z);a.P.kick=.3;b.tx=tg.x;b.tz=tg.z;b.spd=Math.max(5,Math.hypot(tg.x-b.x,tg.z-b.z)/T);ballTo(lineFn({x:o.ball.x,z:o.ball.z},tg,.2),T,function(){M.ball.owner=b;cb()})}
   setTimeout(function(){if(!live())return;ps(H,C,{x:C.x,z:C.z},.55,function(){H.tx=X(11);H.tz=cz*.5+rnd(-1,1);H.spd=8;D.tx=C.x+dir*1;D.tz=C.z;setTimeout(function(){if(!live())return;ps(C,H,{x:X(11.5),z:H.tz},.6,function(){setTimeout(function(){if(live())shoot(H,false,.74)},180)})},350)})},300)})}
 else{var tz=rnd(-6,6),Pz=H;Pz.x=X(33);Pz.z=rnd(-8,8);Pz.tx=Pz.x;Pz.tz=Pz.z;C.x=X(20);C.z=tz;C.tx=C.x;C.tz=C.z;D.x=X(18);D.z=tz-2;D.tx=D.x;D.tz=D.z;if(D2){D2.x=X(18);D2.z=tz+3;D2.tx=D2.x;D2.tz=D2.z}
  feed('<b>'+mm()+"'</b> "+esc(Pz.name)+' szuka prostopadłego podania...',who);
  go(Pz,function(){M.cam={p:[gx-dir*30,10,tz+16],t:[gx-dir*14,0,tz*.4],k:1.6,fw:44,ft:64};setTimeout(function(){if(!live())return;var tg={x:X(12),z:tz*.6};faceNow(Pz,tg.x,tg.z);Pz.P.kick=.38;C.tx=tg.x;C.tz=tg.z;C.spd=Math.hypot(tg.x-C.x,tg.z-C.z)/1.05;D.tx=tg.x-dir*1.5;D.tz=tg.z-1.5;D.spd=5.2;
    ballTo(lineFn({x:o.ball.x,z:o.ball.z},tg,.25),1.1,function(){if(!live())return;M.ball.owner=C;C.tx=X(10.5);C.tz=tg.z*.8;C.spd=5;var sh=false;M.step=function(){if(fin||sh)return;if((C.x-X(11))*dir>=0){sh=true;shoot(C,false,.72)}}})},350)})}
}

function shootPhase(fromE,after,opt){opt=opt||{};if(!live())return;var M=MT,o=Match.o,GX=o.GX;var me0=M.me;M.clr={x:me0.x,z:me0.z};me0.tx=me0.x;me0.tz=me0.z;me0.face={x:GX,z:0};slow=.06;
 M.cam={p:[me0.x-(tall()?6.5:5.4),tall()?2.6:2.1,me0.z*.85],t:[GX,tall()?.9:1.0,me0.z*.3],k:3,fw:46,ft:62};camSet.p=null;
 prompt('STRZELAJ!','Narysuj linię strzału do bramki');var lim=(opt.pen?4:3.2)*mods().time,tt=0,done=false;M.gk.P.ready=true;M.gk.face={x:me0.x,z:me0.z};
 M.step=function(dt){if(done)return;if(!banOn())tt+=dt;timerBar(1-tt/lim);if(tt>=lim){done=true;fire({P0:{x:o.ball.x,y:0,z:o.ball.z},C:{x:(o.ball.x+GX)/2,z:o.ball.z*.5},P1:{x:GX,y:.3,z:rnd(-.6,.6)},T:1.1,arc:.05,curve:0},true)}};
 M.draw=function(){if(done)return;if(ptr.down){trail(ptr.pts);return}var bp=scr(o.ball.x,.1,o.ball.z),gp=scr(GX,1.1,0);var k=(performance.now()%1300)/1300;hx.globalAlpha=(1-k)*.9;hx.fillStyle='#fff';hx.beginPath();hx.arc(lerp(bp.x,gp.x,k*.55),lerp(bp.y,gp.y,k*.55),11,0,7);hx.fill();hx.globalAlpha=1};
 M.onUp=function(p,pts){if(done)return;var sw=swipe(pts);var s=shotFrom(sw,{x:o.ball.x,y:0,z:o.ball.z},GX,opt.pen?1.5:1.3);if(!s){pop('Narysuj linię w stronę bramki!','',VW/2,VH*.6);return}done=true;fire(s,false)};
 function fire(s,weak){prompt(null);timerBar(null);slow=1;var P=me0.P;P.kick=.38;P.foot=S.foot;M.ball.owner=null;M.clr=null;
  var ai=aiOpp(s);if(weak){ai.rd=.05;ai.sig=.1}var pen=null;if(opt.pen&&!weak)pen={guess:Math.random()<.2?0:(Math.random()<.5?-1:1)};
  M.cam={p:[me0.x-4,2.4,me0.z*.6+(me0.z>0?-4:4)],t:[GX,1,s.P1.z*.5],k:1.6};
  physShot(s,M.gk,{dir:1,ai:ai,wall:opt.wall?M.opps:null,pen:pen},function(res,inf){if(!live())return;if(res==='goal'){goal(me0,after);return}
   var t=shotTxt(res,inf);banner(t[0],t[1],res==='miss'?'':'opp');feed('<b>'+mm()+"'</b> "+esc(S.name)+' '+t[2]);M.stats.push('s0');setTimeout(after,1700)})}}
function shotTxt(res,inf){return res==='catch'?['ZŁAPANA!','Bramkarz pewnie łapie piłkę','strzela, bramkarz łapie.']:res==='save'?['OBRONIONA!','Bramkarz odbija piłkę','strzela, bramkarz broni!']:res==='post'?[inf.post===2?'POPRZECZKA!':'SŁUPEK!','Tak blisko!','trafia w '+(inf.post===2?'poprzeczkę!':'słupek!')]:res==='wall'?['W MUR!','Spróbuj podkręcić nad lub obok muru','trafia w mur.']:['PUDŁO','Obok bramki','pudłuje.']}
/* strzał komputera: q = szansa na celny strzał */
function aiShotS(fx,fz,dir,q){var GX=Match.o.GX,gx=dir*GX,wide=Math.random()>q;var gz=wide?pick([-1,1])*rnd(GW/2+.25,GW/2+1.6):rnd(-1,1)*(GW/2-.25)*Math.sqrt(Math.random()),gy=wide&&Math.random()<.4?rnd(GH+.2,GH+1.2):(Math.random()<.2?rnd(1.3,GH-.3):rnd(.12,1.3));var d=Math.hypot(gx-fx,gz-fz);return{P0:{x:fx,y:0,z:fz},C:{x:(fx+gx)/2,z:(fz+gz)/2+rnd(-.8,.8)},P1:{x:gx,y:gy,z:gz},T:d/rnd(18,26),arc:.05,curve:0}}
function goal(scorer,after,assist){if(!live())return;var M=MT,o=Match.o;M.sc[0]++;mHud();flash();
 if(scorer===M.me){M.goals++;S.fol+=8+Math.floor(Math.random()*12);banner('GOOOL!',S.name+' · '+mm()+"'",'gold');feed('⚽ <b>'+mm()+"'</b> GOL! "+esc(S.name)+'!','me');if(!S.ach.opaska){S.ach.opaska=1}}
 else{banner('GOOOL!',scorer.name+' · asysta: '+S.name,'gold');feed('⚽ <b>'+mm()+"'</b> "+esc(scorer.name)+' strzela po Twoim podaniu!','me')}
 var P=scorer.P;P.cele={type:scorer===M.me?S.cele:pick([0,1,4]),t:0};scorer.tx=scorer.x-1;scorer.tz=scorer.z;
 M.mates.concat([M.me]).forEach(function(e){if(e!==scorer){e.tx=scorer.x-1.5+rnd(-1,1);e.tz=scorer.z+rnd(-1.5,1.5);e.spd=7}});
 M.cam={p:[scorer.x-4.5,1.9,scorer.z+(scorer.z>0?-4.5:4.5)],t:[scorer.x,1.1,scorer.z],k:1.4,fw:40,ft:55};
 markGoal();repBtn(function(){P.cele=null;startReplay(after)},function(){P.cele=null;after()},3300)}
var MOM={};
MOM.shot=function(){if(!live())return;var M=MT,o=Match.o,GX=o.GX;setupAmbient();M.step=null;var me0=M.me,a=M.mates[0];
 me0.x=GX-19;me0.z=-3.5;me0.tx=GX-14;me0.tz=-2.2;me0.spd=6;a.x=GX-24;a.z=5;a.tx=GX-23;a.tz=4.5;
 M.opps[0].x=GX-10;M.opps[0].z=0;M.opps[0].tx=GX-12;M.opps[0].tz=-1.5;M.opps[1].x=GX-13;M.opps[1].z=5;M.opps[1].tx=GX-14;M.opps[1].tz=3;M.opps[2].x=GX-20;M.opps[2].z=-8;M.opps[2].tx=GX-18;M.opps[2].tz=-6;
 M.mates[1].x=GX-16;M.mates[1].z=7;M.mates[1].tx=GX-11;M.mates[1].tz=6;M.mates[2].x=GX-30;M.mates[2].z=-2;M.mates[2].tx=GX-27;M.mates[2].tz=-1;
 M.gk.x=M.gk.tx=GX-.7;M.gk.z=M.gk.tz=0;M.ball.owner=a;a.face={x:me0.x,z:me0.z};
 M.cam={p:[GX-28,6,me0.z+14],t:[GX-12,0,0],k:2};feed('<b>'+mm()+"'</b> "+a.name+' rozgląda się i widzi Ciebie...');
 var go=function(){setTimeout(function(){if(!live())return;var tgt={x:GX-14.3,z:-2.3};faceNow(a,tgt.x,tgt.z);a.P.kick=.38;ballTo(lineFn({x:o.ball.x,z:o.ball.z},tgt,0),.9,function(){M.ball.owner=me0;shootPhase(me0,nextMoment)})},M.eleven?250:900)};if(M.eleven){var ca=M.cam,mtx=me0.tx;me0.tx=me0.x;buildUp('us',a,function(){M.cam=ca;camSet.p=null;me0.tx=mtx;go()})}else go()};
MOM.free=function(){if(!live())return;var M=MT,o=Match.o,GX=o.GX;setupAmbient();M.step=null;var me0=M.me,st=o.kind==='stadium';var bz=rnd(-5,5),bx=GX-(st?21:17.5);M.ball.owner=null;M.ball.free=null;o.ball.set(bx,0,bz);
 me0.x=me0.tx=bx-1.6;me0.z=me0.tz=bz+(S.foot==='R'?-.6:.6);me0.face={x:GX,z:0};var d=Math.hypot(GX-bx,bz),ux=(GX-bx)/d,uz=-bz/d,wd=st?9.15:5.5,wx=bx+ux*wd,wz=bz+uz*wd;
 M.opps.forEach(function(e,i){e.x=e.tx=wx;e.z=e.tz=wz+(i-1)*.62;e.face={x:bx,z:bz};e.P.ready=true});M.mates.forEach(function(e,i){e.x=e.tx=GX-9+i;e.z=e.tz=(i-1)*4;e.face={x:GX,z:0}});M.gk.x=M.gk.tx=GX-.7;M.gk.z=M.gk.tz=bz>0?-.6:.6;
 feed('<b>'+mm()+"'</b> Faul na Tobie! Rzut wolny z '+(st?21:18)+' metrów.");M.cam={p:[bx-6,2.4,bz*.85],t:[GX,.9,bz*.3],k:3};
 setTimeout(function(){if(!live())return;shootPhase(me0,nextMoment,{wall:{x:wx,z:wz}});prompt('RZUT WOLNY!','Podkręć nad murem albo obok niego')},700)};
MOM.pen=function(){if(!live())return;var M=MT,o=Match.o,GX=o.GX;setupAmbient();M.step=null;var me0=M.me,st=o.kind==='stadium';var bx=GX-(st?11:7);M.ball.owner=null;M.ball.free=null;o.ball.set(bx,0,0);
 me0.x=me0.tx=bx-1.8;me0.z=me0.tz=S.foot==='R'?-.5:.5;me0.face={x:GX,z:0};M.opps.forEach(function(e,i){e.x=e.tx=GX-(st?18:13.5)-i*.6;e.z=e.tz=[-9,9,-12][i];e.face={x:bx,z:0}});M.mates.forEach(function(e,i){e.x=e.tx=GX-(st?18.5:14)-i*.5;e.z=e.tz=[-10.5,10.5,12.5][i];e.face={x:bx,z:0}});M.gk.x=M.gk.tx=GX-.4;M.gk.z=M.gk.tz=0;
 banner('RZUT KARNY!','Ty podchodzisz do piłki','gold');feed('<b>'+mm()+"'</b> Rzut karny dla Twojej drużyny!");M.cam={p:[bx-5,2.1,0],t:[GX,1,0],k:3};
 setTimeout(function(){if(!live())return;shootPhase(me0,nextMoment,{pen:true});prompt('KARNY!','Bramkarz zgaduje. Celuj blisko słupka')},1300)};
MOM.tackle=function(){if(!live())return;var M=MT,o=Match.o,GX=o.GX,G0=-GX;setupAmbient();M.step=null;var me0=M.me,A=pick(M.opps),gk=M.ourGk;
 var z0=rnd(-4,4);me0.x=me0.tx=G0+15;me0.z=me0.tz=z0;me0.face=A;me0.P.ready=true;A.x=G0+31;A.z=z0+rnd(-2,2);A.tx=G0+8;A.tz=z0*.6;A.spd=5.6;A.face=null;M.ball.owner=null;M.ball.free=null;
 M.mates.forEach(function(e,i){e.x=e.tx=G0+18+i*4;e.z=e.tz=[-8,8,0][i];e.face=A});M.opps.forEach(function(e){if(e!==A){e.x=e.tx=A.x+3;e.z=e.tz=rnd(-8,8)}});gk.x=gk.tx=G0+.7;gk.z=gk.tz=0;gk.face=A;gk.P.ready=true;
 feed('<b>'+mm()+"'</b> "+esc(A.name)+' drybluje prosto na Ciebie!','opp');M.clrR={x0:me0.x-7,x1:A.x+4,z:me0.z,w:3.6};
 var phase='run',ph=Math.random()*6,dirS=Math.random()<.5?-1:1,spd=0,feint=rnd(.35,.8),tt=0,lim=2.6*mods().time,amp=1.1,lat=0,inZ=false,zc={x:0,z:0};
 var zr=clamp(.24+(S.st.SZY-40)*.0022+(S.st.DRY-40)*.0012-(M.diff-1)*.25,.18,.4)*mods().zone,baseSp=clamp(3.4+(M.diff-1)*4+Math.random()*.4,3.2,4.8);
 A.tz=me0.z;M.cam={p:[me0.x-7,3.6,me0.z*.7],t:[me0.x+6,.4,me0.z*.6],k:2.4,fw:44,ft:62};camSet.p=null;
 M.step=function(dt,sd){zc.x=me0.x+1.15;zc.z=me0.z;
  if(phase==='run'){var bp0={x:A.x-.55,z:A.z+Math.sin(ph)*.5};ph+=sd*6;o.ball.set(bp0.x,0,bp0.z,sd);
   if(A.x-me0.x<3.4){phase='pick';A.tx=A.x;A.tz=A.z;A.spd=1.2;A.face={x:me0.x,z:me0.z};slow=.25;spd=baseSp;prompt('ODBIERZ!','Tapnij, gdy piłka jest w zielonym polu');M.cam={p:[me0.x-3.6,3.1,me0.z+.45],t:[me0.x+1.6,.15,me0.z],k:3,fw:46,ft:64};camSet.p=null}}
  if(phase==='pick'){if(!banOn())tt+=dt;timerBar(1-tt/lim);feint-=dt;if(feint<=0){feint=rnd(.3,.75);if(Math.random()<.55)dirS=-dirS;spd=baseSp*rnd(.85,1.25)}
   ph+=dt*spd*dirS;lat=Math.sin(ph)*amp;var bx=zc.x,bz=me0.z+lat;o.ball.set(bx,0,bz,dt);A.z+=(me0.z+lat*.45-A.z)*Math.min(1,dt*6);A.tz=A.z;A.x=A.tx=Math.max(A.x,me0.x+2.15);
   inZ=Math.abs(lat)<zr;if(tt>=lim)miss('late')}};
 M.draw=function(){if(phase!=='pick')return;var c=scr(zc.x,0,zc.z),e=scr(zc.x,0,zc.z+zr),rx=Math.max(12,Math.abs(e.x-c.x)+Math.abs(e.y-c.y)*.2),ry=Math.max(9,rx*.38);
  hx.lineWidth=5;hx.strokeStyle=inZ?'#16d97d':'rgba(255,255,255,.95)';hx.fillStyle=inZ?'rgba(22,217,125,.7)':'rgba(22,217,125,.35)';hx.beginPath();hx.ellipse(c.x,c.y,rx,ry,0,0,7);hx.fill();hx.stroke();
  var q=scr(o.ball.x,.11,o.ball.z);hx.strokeStyle=inZ?'#16d97d':'#ffd24a';hx.lineWidth=4;hx.beginPath();hx.arc(q.x,q.y,20,0,7);hx.stroke()};
 function win(){phase='done';prompt(null);timerBar(null);slow=1;me0.P.ready=false;me0.P.slide={t:0};me0.face={x:A.x,z:A.z};me0.tx=me0.x+1.6;me0.tz=me0.z;me0.spd=7;M.tkl=(M.tkl||0)+1;M.lastWin=1;M.poss='us';
  setTimeout(function(){if(!live())return;A.P.dive={t:0,s:1,high:false};A.tx=A.x;A.tz=A.z;M.ball.free={x:o.ball.x,y:0,z:o.ball.z,vx:4,vy:.6,vz:rnd(-1.5,1.5)};banner('ODBIÓR!','Czysty wślizg '+S.name,'gold');feed('<b>'+mm()+"'</b> "+esc(S.name)+' czysto odbiera piłkę!','me')},200);setTimeout(nextMoment,1900)}
 function miss(why){if(phase!=='pick')return;phase='lost';prompt(null);timerBar(null);A.face=null;slow=1;me0.P.ready=false;if(why!=='late'){me0.P.slide={t:0};me0.face={x:A.x,z:A.z+1}}M.bad++;A.spd=7;A.tx=G0+11.5;A.tz=A.z*.3;M.ball.owner=A;banner('MINĄŁ CIĘ!',why==='late'?'Za późno':'Wślizg w powietrze','opp');
  M.cam={p:[G0+16,5,A.z+11],t:[G0+6,0,0],k:2};var shot=false;
  M.step=function(){if(shot||!live())return;if(A.x<=G0+12.5){shot=true;A.P.kick=.38;var s=aiShotS(o.ball.x,o.ball.z,-1,clamp(.7*mods().home,.3,.9));physShot(s,gk,{dir:-1,ai:aiOur()},function(res,inf){if(!live())return;if(res==='goal'){oppGoal(A,' mija Cię i trafia.')}else if(res==='save'||res==='catch'){banner(M.ourGk.name.toUpperCase()+' BRONI!','Uratował Cię bramkarz','');feed('<b>'+mm()+"'</b> "+esc(M.ourGk.name)+' ratuje po Twojej stracie.')}else feed('<b>'+mm()+"'</b> "+esc(A.name)+' '+shotTxt(res,inf)[2]);setTimeout(nextMoment,res==='goal'?2400:1900)})}}}
 M.onDown=function(){if(phase!=='pick')return;if(inZ)win();else miss('wrong')};M.onKey=function(k,d){if(d&&(k===' '||k==='Enter'))M.onDown()};leadIn('th',A)};
MOM.drib=function(){if(!live())return;var M=MT,o=Match.o,GX=o.GX;setupAmbient();M.step=null;var me0=M.me,d=M.opps[0];
 me0.x=GX-24;me0.z=1;me0.tx=GX-19;me0.tz=.5;me0.spd=6.5;M.ball.owner=me0;d.x=GX-13;d.z=.5;d.tx=GX-16.5;d.tz=.5;d.spd=5;d.face=me0;
 M.opps[1].x=GX-9;M.opps[1].z=-5;M.opps[1].tx=GX-10;M.opps[1].tz=-4;M.opps[2].x=GX-12;M.opps[2].z=7;M.mates[0].x=GX-20;M.mates[0].z=-7;M.mates[0].tx=GX-14;M.mates[0].tz=-6;
 M.gk.x=M.gk.tx=GX-.7;M.gk.z=M.gk.tz=0;M.cam={p:[GX-30,5,me0.z+11],t:[GX-16,0,0],k:2};feed('<b>'+mm()+"'</b> Przejmujesz piłkę i ruszasz na obrońcę!");M.clrR={x0:me0.x-7,x1:GX,z:me0.z,w:3.6};
 var phase='run',tt=0,lim=3.4*mods().time,ph=Math.random()*6,dirS=Math.random()<.5?-1:1,spd=0,feint=rnd(.35,.8),amp=1.1,lat=0,inZ=false,side=Math.random()<.5?-1:1,gz=0,read=rnd(.8,1.3),zc={x:0,z:0};
 var zr=clamp(.34+(S.st.DRY-40)*.0025+(S.st.TEC-40)*.001-(M.diff-1)*.2,.28,.52)*mods().zone,baseSp=clamp(2.6+(M.diff-1)*3+Math.random()*.3,2.4,3.6);
 M.step=function(dt,sd){if(phase==='run'&&Math.hypot(me0.x-d.x,me0.z-d.z)<3.4){phase='pick';slow=.25;me0.tx=me0.x;me0.tz=me0.z;M.ball.owner=null;d.tx=me0.x+3;d.tz=me0.z;d.spd=6;d.face={x:me0.x,z:me0.z};me0.face={x:d.x,z:d.z};spd=baseSp;gz=side*.62;
   prompt('KIWAJ!','Tapnij, gdy piłka wejdzie w zieloną lukę');M.cam={p:[me0.x-2.4,6.6,me0.z+1.2],t:[me0.x+2,0,me0.z],k:3,fw:46,ft:64};camSet.p=null}
  if(phase==='pick'){if(!banOn())tt+=dt;timerBar(1-tt/lim);feint-=dt;read-=dt;if(feint<=0){feint=rnd(.3,.75);if(Math.random()<.55)dirS=-dirS;spd=baseSp*rnd(.85,1.25)}
   if(read<=0){read=rnd(1.1,1.7);if(Math.random()<.3)side=-side}gz+=(side*.62-gz)*Math.min(1,dt*5);zc.x=me0.x+1.6;zc.z=me0.z+gz;
   ph+=dt*spd*dirS;lat=Math.sin(ph)*amp;o.ball.set(zc.x,0,me0.z+lat,dt);d.tz=me0.z-gz*.7;d.tx=me0.x+3;inZ=Math.abs(lat-gz)<zr;if(tt>=lim)fail()}};
 M.draw=function(){if(phase!=='pick')return;var c=scr(zc.x,0,zc.z),e=scr(zc.x,0,zc.z+zr),rx=Math.max(12,Math.abs(e.x-c.x)+Math.abs(e.y-c.y)*.2),ry=Math.max(9,rx*.38);
  hx.lineWidth=5;hx.strokeStyle=inZ?'#16d97d':'rgba(255,255,255,.95)';hx.fillStyle=inZ?'rgba(22,217,125,.7)':'rgba(22,217,125,.35)';hx.beginPath();hx.ellipse(c.x,c.y,rx,ry,0,0,7);hx.fill();hx.stroke();
  var q=scr(o.ball.x,.11,o.ball.z);hx.strokeStyle=inZ?'#16d97d':'#ffd24a';hx.lineWidth=4;hx.beginPath();hx.arc(q.x,q.y,20,0,7);hx.stroke()};
 function ok(){var dir=side;phase='done';prompt(null);timerBar(null);slow=1;M.drb++;banner('MINĄŁEŚ GO!','','');M.ball.owner=me0;me0.face=null;me0.tz=me0.z+dir*2.2;me0.tx=me0.x+4;me0.spd=8;d.P.kick=.3;d.face=null;d.tx=d.x+1;d.tz=d.z-dir*1.5;
  setTimeout(function(){d.P.dive={t:0,s:dir,high:false}},150);setTimeout(function(){shootPhase(me0,nextMoment)},700)}
 function fail(){if(phase!=='pick')return;phase='done';prompt(null);timerBar(null);slow=1;M.bad++;me0.face=null;d.face=null;d.P.kick=.3;banner('STRATA',tt>=lim?'Za długo zwlekałeś':'Obrońca był czujny','opp');d.tx=d.x-2;M.ball.owner=d;feed('<b>'+mm()+"'</b> Obrońca odbiera Ci piłkę.");M.stats.push('d0');setTimeout(nextMoment,1500)}
 M.onDown=function(){if(phase!=='pick')return;if(inZ)ok();else fail()};M.onKey=function(k,d0){if(d0&&phase==='pick'&&(k===' '||k==='Enter'))M.onDown()};leadIn('us',me0)};
MOM.pass=function(){if(!live())return;var M=MT,o=Match.o,GX=o.GX;setupAmbient();M.step=null;var me0=M.me;
 me0.x=GX-27;me0.z=0;me0.tx=GX-24;me0.tz=0;me0.spd=5;M.ball.owner=me0;
 var free=Math.floor(Math.random()*3),pos=[[GX-12,-7],[GX-11,6.5],[GX-17,1]];
 M.mates.forEach(function(e,i){e.x=pos[i][0]-4;e.z=pos[i][1];e.tx=pos[i][0];e.tz=pos[i][1];e.spd=5;e.face={x:GX,z:0}});
 var marked=[0,1,2].filter(function(q){return q!==free});M.opps.forEach(function(e,i){if(i===2){e.tx=GX-20;e.tz=-3}else{var tgt=M.mates[marked[i]];e.tx=tgt.tx+1.1;e.tz=tgt.tz+(tgt.tz>0?-.8:.8)}e.x=e.tx+2;e.z=e.tz;e.face=me0});
 M.gk.x=M.gk.tx=GX-.7;M.gk.z=M.gk.tz=0;M.cam={p:tall()?[GX-42,17,0]:[GX-38,11,0],t:[GX-16,0,0],k:2.2,fw:46,ft:70};feed('<b>'+mm()+"'</b> Masz piłkę w środku pola...");
 var phase='run',tt=0,lim=(2.3+(S.st.POD-40)*.015)*mods().time;
 M.step=function(dt){if(phase==='run'&&me0.x>GX-24.5){phase='pick';slow=.05;prompt('PODAJ!','Tapnij niekrytego kolegę');}if(phase==='pick'){if(!banOn())tt+=dt;timerBar(1-tt/lim);if(tt>lim){choose(-1)}}};
 M.draw=function(){if(phase!=='pick')return;M.opps.forEach(function(e){var p=scr(e.x,0,e.z);var r=Math.max(16,VH*.03);hx.fillStyle='rgba(255,138,0,.35)';hx.beginPath();hx.ellipse(p.x,p.y,r*1.2,r*.5,0,0,7);hx.fill()});M.mates.forEach(function(e,i){var p=scr(e.x,0,e.z);hx.lineWidth=3;hx.strokeStyle='rgba(255,255,255,.9)';hx.fillStyle='rgba(255,255,255,.14)';var r=Math.max(26,VH*.045);hx.beginPath();hx.ellipse(p.x,p.y,r*1.2,r*.55,0,0,7);hx.fill();hx.stroke();
   hx.fillStyle='#fff';hx.font='700 14px Barlow,Arial';hx.textAlign='center';hx.fillText((i+1)+'. '+e.name,p.x,p.y-r*.75)})};
 function choose(i){if(phase!=='pick')return;phase='done';prompt(null);timerBar(null);slow=1;var e=i>=0?M.mates[i]:M.mates[(free+1)%3];faceNow(me0,e.x,e.z);me0.P.kick=.38;me0.P.foot=S.foot;
  if(i===free){var tgt={x:e.x+1.2,z:e.z};ballTo(lineFn({x:o.ball.x,z:o.ball.z},tgt,.4),.85,function(){M.ball.owner=e;e.face={x:GX,z:0};setTimeout(function(){e.P.kick=.38;var s=aiShotS(o.ball.x,o.ball.z,1,clamp(.72*mods().chem,.4,.92));physShot(s,M.gk,{dir:1,ai:aiOpp(s)},function(res,inf){if(!live())return;if(res==='goal'){M.ast++;goal(e,nextMoment,true);return}var t=shotTxt(res,inf);banner(t[0],'Dobre podanie, '+e.name+' nie trafił','opp');feed('<b>'+mm()+"'</b> Świetne podanie, "+esc(e.name)+' '+t[2]);M.stats.push('p1');setTimeout(nextMoment,1700)})},450)})}
  else{var opp=M.opps.reduce(function(a,b){return Math.hypot(b.x-e.x,b.z-e.z)<Math.hypot(a.x-e.x,a.z-e.z)?b:a});ballTo(lineFn({x:o.ball.x,z:o.ball.z},{x:opp.x,z:opp.z},.3),.6,function(){M.ball.owner=opp;opp.tx=opp.x-8;banner('PRZECHWYT','Ten kolega był kryty','opp');feed('<b>'+mm()+"'</b> Podanie przechwycone.");M.bad++;M.stats.push('p0');setTimeout(nextMoment,1500)})}}
 M.onUp=function(p){if(phase!=='pick')return;var best=-1,bd=1e9;M.mates.forEach(function(e,i){var q=scr(e.x,.3,e.z);var d=Math.hypot(q.x-p.x,q.y-p.y);if(d<bd){bd=d;best=i}});if(bd<Math.max(90,VW*.12))choose(best)};
 M.onKey=function(k,d){if(d&&phase==='pick'&&/^[123]$/.test(k))choose(+k-1)};leadIn('us',me0)};
MOM.head=function(){if(!live())return;var M=MT,o=Match.o,GX=o.GX;setupAmbient();M.step=null;var me0=M.me,c=M.mates[0];
 c.x=c.tx=GX-.6;c.z=c.tz=-Math.min(o.W/2-.6,16);M.ball.owner=null;o.ball.set(c.x,0,c.z);M.ball.free=null;c.face={x:GX-6,z:0};
 me0.x=GX-11;me0.z=1.5;me0.tx=GX-5.5;me0.tz=.4;me0.spd=4.5;M.opps[0].x=GX-8;M.opps[0].z=-.5;M.opps[0].tx=GX-5;M.opps[0].tz=-.4;M.opps[1].x=GX-7;M.opps[1].z=3;M.opps[1].tx=GX-4;M.opps[1].tz=2.6;M.mates[1].x=GX-9;M.mates[1].z=-3;M.mates[1].tx=GX-4.5;M.mates[1].tz=-2.8;
 M.gk.x=M.gk.tx=GX-.7;M.gk.z=M.gk.tz=-.3;M.gk.face=c;M.cam={p:[GX-16,5.5,10],t:[GX-4,1,-2],k:2};feed('<b>'+mm()+"'</b> Rzut rożny dla Twojej drużyny!");
 var meet={x:GX-5.4,z:.4,y:1.95*(me0.P.hs||1)},phase='wait',tt=0,T=.95,q=0,OV=1.18;
 setTimeout(function(){if(!live())return;c.P.kick=.38;phase='fly';var a={x:c.x,z:c.z};ballTo(function(k){var kk=k*OV;if(kk<=1)return{x:lerp(a.x,meet.x,kk),z:lerp(a.z,meet.z,kk),y:lerp(0,meet.y,kk)+4.2*4*kk*(1-kk)*(1-kk*.2)};var e=kk-1;return{x:meet.x+(meet.x-a.x)*e,z:meet.z+(meet.z-a.z)*e,y:Math.max(0,meet.y-e*9)}},T*OV,function(){if(phase==='fly'){phase='done';miss()}})},800);
 function KK(){return M.ball.path?M.ball.path.t*OV:OV}
 M.step=function(dt){if(phase==='fly'&&M.ball.path){var k=KK();if(k>.6){slow=.22;if(!M.pr){M.pr=1;prompt('GŁÓWKA!','Tapnij, gdy piłka wpadnie w krąg');M.cam={p:[me0.x-5,2.6,me0.z+3.5],t:[GX,1.6,0],k:2.5};camSet.p=null}}}};
 M.draw=function(){if(phase!=='fly'||!M.ball.path)return;var k=KK();if(k<.5)return;var tp=scr(meet.x,meet.y+.1,meet.z),bp=scr(o.ball.x,o.ball.y+.11,o.ball.z);var dd=Math.hypot(tp.x-bp.x,tp.y-bp.y);var hw=.08*mods().zone,inZ=k>1-hw&&k<1+hw;
  hx.lineWidth=5;hx.strokeStyle=inZ?'#16d97d':'rgba(255,255,255,.85)';hx.fillStyle=inZ?'rgba(22,217,125,.25)':'rgba(0,0,0,0)';hx.beginPath();hx.arc(tp.x,tp.y,32,0,7);hx.fill();hx.stroke();hx.strokeStyle=inZ?'#16d97d':'rgba(255,210,74,.95)';hx.lineWidth=3;hx.beginPath();hx.arc(bp.x,bp.y,32+Math.min(140,dd),0,7);hx.stroke()};
 function hit(){if(phase!=='fly')return;var k=KK();if(k<.86){phase='done';prompt(null);M.pr=0;slow=1;me0.P.head=.7;pop('Za wcześnie!','bad',VW/2,VH*.4);setTimeout(function(){if(!live())return;M.ball.path=null;M.ball.free={x:o.ball.x,y:o.ball.y,z:o.ball.z,vx:-2,vy:0,vz:3};banner('MINĄŁEŚ SIĘ Z PIŁKĄ','Skoczyłeś za wcześnie','opp');feed('<b>'+mm()+"'</b> Piłka przelatuje nad głowami.");M.bad++;setTimeout(nextMoment,1400)},350);return}
  if(k>1.1){return}phase='done';prompt(null);M.pr=0;slow=1;q=clamp(1-Math.abs(k-1)/(.08*mods().zone),0,1);me0.P.head=.7;if(q<.25){M.ball.path=null;M.ball.free={x:o.ball.x,y:o.ball.y,z:o.ball.z,vx:-4,vy:2,vz:2};banner('OBROŃCA WYBIJA','Nie trafiłeś czysto','opp');feed('<b>'+mm()+"'</b> Obrońca był szybszy.");M.bad++;M.stats.push('h0');setTimeout(nextMoment,1500);return}
  M.ball.path=null;o.ball.set(meet.x,meet.y,meet.z);
  var gz=(M.gk.z>0?-1:1)*(GW/2-lerp(1.7,.45,q))+rnd(-.3,.3),gy=lerp(1.6,.25,q),s={P0:{x:meet.x,y:meet.y,z:meet.z},C:{x:(meet.x+GX)/2,z:(meet.z+gz)/2},P1:{x:GX,y:gy,z:gz},T:lerp(.75,.42,q),arc:0,curve:0};
  physShot(s,M.gk,{dir:1,ai:aiOpp(s)},function(res,inf){if(!live())return;if(res==='goal'){goal(me0,nextMoment);return}var t=shotTxt(res,inf);banner(t[0],q>.6?'Mocna główka!':'Za słabo uderzona','opp');feed('<b>'+mm()+"'</b> Główka "+esc(S.name)+': '+t[2]);M.stats.push('h0');setTimeout(nextMoment,1700)})}
 function miss(){prompt(null);M.pr=0;slow=1;M.ball.free={x:o.ball.x,y:o.ball.y,z:o.ball.z,vx:-2,vy:0,vz:3};banner('MINĄŁEŚ SIĘ Z PIŁKĄ','','opp');feed('<b>'+mm()+"'</b> Piłka przelatuje nad głowami.");M.bad++;setTimeout(nextMoment,1400)}
 M.onDown=function(){hit()};M.onKey=function(k,d){if(d&&(k===' '||k==='Enter'))hit()}};
function matchEnd(){if(!live())return;var M=MT,c=S.c;M.ended=1;M.clockFn=null;M.step=null;var w=M.sc[0]>M.sc[1],d=M.sc[0]===M.sc[1];
 var r=clamp(6+M.goals*1.3+M.ast*.9+M.drb*.4+(M.tkl||0)*.5-M.bad*.4+(w?.5:d?0:-.4)-(M.role==='bench'?.3:0),3,10);r=Math.round(r*10)/10;var motm=r>=8;
 var pens='';if(M.kind==='final'&&d){var wp=Math.random()<.5+(ovr()-80)*.01;pens=wp?'Karne wygrane 5:4!':'Karne przegrane 3:4';w=wp;d=false}
 var mk=MCOIN[c.lv],gOk=M.goal[0]==='g'?M.goals>0:M.goal[0]==='a'?M.ast>0:w;var coins=(25+M.goals*15+M.ast*10+(w?20:0)+(motm?15:0)+(gOk?M.goal[2]:0))*mk;S.coins+=coins;S.m.n++;S.m.g+=M.goals;S.m.a+=M.ast;if(w)S.m.w++;if(r>S.m.best)S.m.best=r;
 var ups=[];function up(k,lab){var n=stoch(.9*potF(S.st[k]));if(n<=0)return;S.st[k]=clamp(S.st[k]+n,1,99);ups.push(lab+' +'+n)}if(r>=6.5){var cand=[];if(M.goals)cand.push(['STR','Strzał']);if(M.ast)cand.push(['POD','Podania']);if(M.drb)cand.push(['DRY','Drybling']);if(M.tkl)cand.push(['SZY','Szybkość']);if(cand.length){var cu=pick(cand);up(cu[0],cu[1])}}S.peak=Math.max(S.peak||0,ovr());
 var cons=[];function rc(k,v){if(!v)return;S.rel[k]=clamp(S.rel[k]+v,0,100);var b=BARS_K.concat(BARS_P).filter(function(x){return x[0]===k})[0];cons.push((b?b[1]:'')+(v>0?' +':' ')+v)}rc('forma',w?5:d?0:-4);if(S.age>=19){rc('kibice',(w?4:d?0:-5)+M.goals*3);rc('trener',r>=8?8:r>=7?4:r<5.5?-7:0);rc('media',motm?7:r<5?-6:0)}else{rc('kumple',r>=8?5:0);rc('rodzice',r>=8?4:0)}
 S.fol+=Math.round(((w?6:2)+M.goals*(8+Math.random()*10))*FOLK[c.lv]*(M.kind==='league'?1:4));
 var scout=c.lv===0&&r>=7.5&&!S.scout;if(scout)S.scout=1;var pay=0,extra='',next='afterMatch',lab='Dalej ›';
 if(M.kind==='league'){c.sg+=M.goals;c.sa+=M.ast;pay=finishWeek(M.sc[0],M.sc[1],r,true)}
 else{S.kad.caps++;S.kad.g+=M.goals;if(M.kind==='nat'){c.natDone=1;next='toHub';lab='Wróć do klubu ›'}else{next='offers';lab='Okno transferowe ›';if(w){c.tw=1;S.tro.push({ico:'🏆',t:tourName(),n:'Polska · '+c.year,y:c.year});extra='<p class="kp-ach">🏆 POLSKA MISTRZEM! Złoty medal '+tourName()+'!</p>'}else extra='<p class="kp-next">Srebrny medal. Byliście tak blisko!</p>'}}
 maybeEvent(M.kind==='league');save();
 MT.cam={p:[-6,6,16],t:[0,1,0],k:1};
 ui('<div class="kp-res"><div class="kp-res-c"><p class="kp-eye">Koniec meczu</p><div class="kp-fin"><span>'+esc(shortN(M.us.n,M.lv))+'</span><b>'+M.sc[0]+' : '+M.sc[1]+'</b><span>'+esc(shortN(M.th.n,M.lv))+'</span></div>'+(pens?'<p class="kp-next">'+pens+'</p>':'')+'<h3>'+(w?'Wygrana!':d?'Remis':'Porażka')+'</h3>'+
  '<p class="kp-mgoal '+(gOk?'ok':'no')+'">'+(gOk?'✅':'❌')+' Cel trenera: '+M.goal[1]+(gOk?' · 🪙 +'+fmtN(M.goal[2]*mk):'')+'</p><div class="kp-rate'+(motm?' motm':'')+'"><b>'+r.toFixed(1)+'</b><span>'+(motm?'⭐ ZAWODNIK MECZU':'Twoja ocena')+'</span></div><div class="kp-rew"><span>🪙 +'+fmtN(coins+pay)+'</span><span>⚽ '+M.goals+'</span><span>🅰 '+M.ast+'</span>'+ups.map(function(u){return '<span class="up">'+u+'</span>'}).join('')+cons.map(function(u){return '<span class="'+(u.indexOf('+')>0?'up':'dn')+'">'+u+'</span>'}).join('')+'</div>'+extra+
  (scout?'<p class="kp-ach">👀 Na trybunach siedział skaut akademii. Zapisał Twoje nazwisko...</p>':'')+(S.ach.opaska&&M.goals&&S.m.g===M.goals?'<p class="kp-ach">🏆 Odblokowane: Złota opaska (pierwszy gol)!</p>':'')+
  '<div class="kp-res-b"><button class="kp-btn" data-a="'+next+'">'+lab+'</button></div></div></div>')}

/* ====================================================== */
/* ---------- akcje ---------- */
uiEl.addEventListener('input',function(e){if(e.target.id==='kpName'){S.name=e.target.value.slice(0,22);save()}});
uiEl.addEventListener('click',function(e){var el=e.target.closest('[data-a]');if(!el)return;var a=el.dataset.a,v=el.dataset.v,c=el.dataset.c;
 if(a==='newc'){var keep=S&&S.created?confirmNew():true;if(!keep)return;S=blank();S.st=base();save();if(ME&&ME.g.parent)ME.g.parent.remove(ME.g);ME=null;CR.tab='look';CR.buy=null;creator();return}
 if(a==='cont'){hub();return}
 if(a==='tab'){Room.face=0;CR.tab=v;CR.buy=null;me().set(lookA(),myKit());creator();return}
 if(a==='set'){Room.face=0;S.look[c]=+v;save();me().set(lookA(),myKit());creator();return}
 if(a==='pick'){Room.face=0;var i=+v;if(c==='cele'){var it=KPChar.LOOK.cele[i];var ow=!it.p||S.own.cele.indexOf(i)>=0;if(ow){S.cele=i;CR.buy=null;save()}else CR.buy={cat:'cele',i:i};var P=me();P.cele={type:i,t:0};P.yaw=0;clearTimeout(CR.ct);CR.ct=setTimeout(function(){if(P.cele&&P.cele.type===i)P.cele=null},3200);creator();return}
  if(owned(c,i)){S.look[c]=i;CR.buy=null;save();me().set(lookA(),myKit())}else{CR.buy={cat:c,i:i};previewLook(c,i)}creator();return}
 if(a==='buy'){var b=CR.buy;if(!b)return;var it2=b.cat==='cele'?KPChar.LOOK.cele[b.i]:KPChar.LOOK[b.cat][b.i];if(S.coins<it2.p)return;S.coins-=it2.p;S.own[b.cat].push(b.i);if(b.cat==='cele')S.cele=b.i;else S.look[b.cat]=b.i;CR.buy=null;save();me().set(lookA(),myKit());pop('Odblokowane!','gold',VW*.3,VH*.4);creator();return}
 if(a==='num'){S.look.num=clamp(S.look.num+(+v),1,99);save();me().set(lookA(),myKit());Room.face=Math.PI;Room.rel=1;creator();return}
 if(a==='pos'){S.pos=v;save();creator();return}
 if(a==='arch'){if(S.created)return;S.arch=v;S.st=base();save();creator();return}
 if(a==='foot'){S.foot=v;save();creator();return}
 if(a==='dream'){S.dream=v;save();creator();return}
 if(a==='done'){if(!S.name.trim()){CR.tab='me';creator();var inp=uiEl.querySelector('#kpName');if(inp){inp.focus();inp.classList.add('err')}return}S.created=1;S.ev='matma';newSeason();save();me().set(lookA(),myKit());hub();return}
 if(a==='toHub'){MT=null;CR.buy=null;hub();return}
 if(a==='wardrobe'){CR.tab='hair';CR.buy=null;creator();return}
 if(a==='menu'){startScreen();return}
 if(a==='ev'){evScreen();return}
 if(a==='evL'){evPick('L');return}if(a==='evR'){evPick('R');return}
 if(a==='mg'){mgStart(v);return}
 if(a==='mgGo'){var it3=uiEl.querySelector('.kp-intro');if(it3)it3.remove();countdown(function(){MGM.go();mgHud()});return}
 if(a==='mgAgain'){mgStart(MGM.id);return}
 if(a==='mgQuit'){MGM.on=false;MGM.done=true;hub();return}
 if(a==='match'){var bl=blocked();if(bl){quickSim(bl);return}matchStart('league');return}
 if(a==='sim'){quickSim();return}
 if(a==='natMatch'){matchStart('nat');return}
 if(a==='natFinal'){matchStart('final');return}
 if(a==='afterMatch'){MT=null;afterMatch();return}
 if(a==='offers'){MT=null;offersScreen();return}
 if(a==='tour'){tourScreen();return}
 if(a==='sign'){sign(+v);return}
 if(a==='retire'){if(window.confirm('Na pewno kończysz karierę?'))retire();return}
 if(a==='legDl'){legDl();return}if(a==='legShare'){legShare();return}
 if(a==='tabela'){tableScreen();return}if(a==='gablota'){gablota();return}if(a==='shop'){shopScreen();return}if(a==='shopBuy'){shopBuy(v);return}
 if(a==='mGo'){var it4=uiEl.querySelector('.kp-intro');if(it4)it4.remove();feed('<b>1\'</b> Pierwszy gwizdek!');buildSchedule();runClock();return}
 if(a==='tkSkip'){if(MT)MT.tkFast=1;return}
 if(a==='mQuit'){var K=MT&&MT.kind;MT=null;if(K==='league')quickSim();else if(K==='final')offersScreen();else{S.c.natDone=1;save();hub()}return}
});
function confirmNew(){return window.confirm('Zacząć nową karierę? Obecny piłkarz zostanie usunięty.')}

/* ---------- start ---------- */
S=load()||blank();if(!S.created&&!S.name)S.st=base();
resize();requestAnimationFrame(loop);startScreen();
window.__kp={trainSim:function(id,sc){MGM={id:id,score:sc,on:true};mgEnd()},genOffers:genOffers,sign:sign,evPick:evPick,blocked:blocked,MGd:MG,ovr:ovr,role:role,goal:goal,MOM:MOM,bodySph:bodySph,GKS:GKS,physShot:physShot,aiOpp:aiOpp,shootPhase:shootPhase,seasonEnd:seasonEnd,offers:offersScreen,retire:retire,quickSim:quickSim,newSeason:newSeason,world:world,CH:CH,shotFrom:shotFrom,swipe:swipe,scr:scr,S:function(){return S},hub:hub,creator:creator,mg:mgStart,match:matchStart,setMode:setMode,save:save,cur:function(){return cur},MT:function(){return MT},me:me,cam:cam,renderer:renderer};
})();
