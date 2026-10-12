/* Zostań piłkarzem: model 3D piłkarza z kreatorem wyglądu | qastrod.pl */
(function(){
'use strict';
function clamp(v,a,b){return v<a?a:v>b?b:v}
function lerp(a,b,k){return a+(b-a)*k}
function cvs(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c}

/* ---------- katalog wyglądu (cena 0 = od razu dostępne) ---------- */
var LOOK={
 skin:[0xf6dcc8,0xf3d3bb,0xe9c0a0,0xd8a47a,0xc68a5e,0xa86c45,0x8a5a3a,0x5e3a24],
 hair:[
  {n:'Na zero',p:0},{n:'Krótkie',p:0},{n:'Grzywka',p:0},{n:'Loki',p:0},{n:'Undercut',p:0},{n:'Kok',p:0},
  {n:'Irokez',p:120},{n:'Kolce',p:150},{n:'Afro',p:200},{n:'Długie',p:250},{n:'Dredy',p:300},{n:'Platynowy quiff',p:400}],
 hairCol:[{c:0x1a1410,n:'Czarne',p:0},{c:0x3a2614,n:'Ciemny brąz',p:0},{c:0x6b4423,n:'Brąz',p:0},{c:0xc9a060,n:'Blond',p:0},{c:0x9c4a1e,n:'Rude',p:0},
  {c:0xe8e2d0,n:'Platyna',p:180},{c:0x2f6bff,n:'Niebieskie',p:260},{c:0xff3b5c,n:'Czerwone',p:260},{c:0x16d97d,n:'Zielone',p:320}],
 eyes:['#4a3420','#3b6fa8','#5b7f4a','#2d2018','#7a8a99'],
 brows:[{n:'Normalne'},{n:'Grube'},{n:'Cienkie'}],
 boots:[{c:0x111111,n:'Czarne',p:0},{c:0xf2f2f2,n:'Białe',p:0},{c:0xff6a00,n:'Pomarańczowe',p:60},{c:0x1e90ff,n:'Niebieskie',p:60},{c:0xe11d48,n:'Czerwone',p:80},{c:0x16d97d,n:'Neonowe',p:120},{c:0xffd200,n:'Złote',p:0,ach:'zlote'}],
 shirt:[{c:0x2563eb,t:0xffffff,n:'Niebieska'},{c:0xdc143c,t:0xffffff,n:'Czerwona'},{c:0x16a34a,t:0xffffff,n:'Zielona'},{c:0x111827,t:0xffd200,n:'Czarna'},{c:0xf6f7fb,t:0xdc143c,n:'Biała'},{c:0x7c3aed,t:0xffffff,n:'Fioletowa'}],
 band:[{n:'Brak',p:0},{n:'Biała opaska',c:0xffffff,p:40},{n:'Czerwona opaska',c:0xe11d48,p:40},{n:'Czarna opaska',c:0x111111,p:40},{n:'Złota opaska',c:0xffd200,p:0,ach:'opaska'}],
 cele:[{n:'Ręce w górę',p:0},{n:'Samolot',p:0},{n:'Ślizg na kolanach',p:150},{n:'Cicho kibice',p:200},{n:'Serce',p:120},{n:'Salto',p:500},{n:'Skok z obrotem',p:350},{n:'Łucznik',p:250},{n:'Kołyska',p:150},{n:'Taniec',p:200},{n:'Na kolana',p:180},{n:'Salut',p:120},{n:'Ukłon',p:100}]
};

var BN=['root','hips','spine','chest','neck','head','uarmL','farmL','handL','uarmR','farmR','handR','thighL','shinL','footL','thighR','shinR','footR'];
var BP={root:[null,0,0,0],hips:['root',0,.96,0],spine:['hips',0,1.1,0],chest:['spine',0,1.3,0],neck:['chest',0,1.5,0],head:['neck',0,1.6,0],
 uarmL:['chest',.195,1.44,0],farmL:['uarmL',.215,1.17,0],handL:['farmL',.225,.94,0],uarmR:['chest',-.195,1.44,0],farmR:['uarmR',-.215,1.17,0],handR:['farmR',-.225,.94,0],
 thighL:['hips',.1,.93,0],shinL:['thighL',.1,.51,0],footL:['shinL',.1,.09,0],thighR:['hips',-.1,.93,0],shinR:['thighR',-.1,.51,0],footR:['shinR',-.1,.09,0]};
var BI={};BN.forEach(function(n,i){BI[n]=i});

function make(T3){
 function lin(c){return (c&&c.isColor?c.clone():new T3.Color(c)).convertSRGBToLinear()}
 function mkBones(){var map={},arr=[];BN.forEach(function(n){var d=BP[n];var b=new T3.Bone();b.name=n;if(d[0]){var pp=BP[d[0]];b.position.set(d[1]-pp[1],d[2]-pp[2],d[3]-pp[3]);map[d[0]].add(b)}else b.position.set(d[1],d[2],d[3]);map[n]=b;arr.push(b)});return{map:map,arr:arr}}
 function GB(){this.pos=[];this.col=[];this.uv=[];this.si=[];this.sw=[];this.idx=[]}
 GB.prototype.v=function(x,y,z,c,w,u,v){this.pos.push(x,y,z);this.col.push(c.r,c.g,c.b);this.uv.push(u||0,v||0);var ks=Object.keys(w),a=[0,0,0,0],ww=[0,0,0,0],s=0;ks.slice(0,4).forEach(function(k,i){a[i]=BI[k];ww[i]=w[k];s+=w[k]});this.si.push(a[0],a[1],a[2],a[3]);this.sw.push(ww[0]/s,ww[1]/s,ww[2]/s,ww[3]/s);return this.pos.length/3-1};
 function cr(p0,p1,p2,p3,t){var t2=t*t,t3=t2*t;return .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3)}
 function smoothR(K,sub){if(K.length<3)return K;var out=[];for(var i=0;i<K.length-1;i++){var a=K[Math.max(0,i-1)],b=K[i],c=K[i+1],d=K[Math.min(K.length-1,i+2)];
   for(var j=0;j<sub;j++){var t=j/sub;if(j===0){out.push(b);continue}var w={},kk;for(kk in b.w)w[kk]=(w[kk]||0)+b.w[kk]*(1-t);for(kk in c.w)w[kk]=(w[kk]||0)+c.w[kk]*t;
    out.push({x:cr(a.x,b.x,c.x,d.x,t),y:cr(a.y,b.y,c.y,d.y,t),z:cr(a.z,b.z,c.z,d.z,t),rx:Math.max(.005,cr(a.rx,b.rx,c.rx,d.rx,t)),rz:Math.max(.005,cr(a.rz,b.rz,c.rz,d.rz,t)),c:t<.5?b.c:c.c,w:w})}}
  out.push(K[K.length-1]);return out}
 GB.prototype.tube=function(R,N){N=N||14;R=smoothR(R,3);var B=this,top=R[0],bot=R[R.length-1];var ct=B.v(top.x,top.y+(top.cap||0),top.z,top.c,top.w);var R0=ct+1;
  R.forEach(function(r){for(var i=0;i<N;i++){var a=i/N*Math.PI*2;B.v(r.x+r.rx*Math.cos(a),r.y,r.z+r.rz*Math.sin(a),r.c,r.w)}});
  var cb=B.v(bot.x,bot.y-(bot.cap||0),bot.z,bot.c,bot.w),i;
  for(i=0;i<N;i++)B.idx.push(ct,R0+(i+1)%N,R0+i);
  for(var r=0;r<R.length-1;r++){var a0=R0+r*N,a1=R0+(r+1)*N;for(i=0;i<N;i++){var i1=(i+1)%N;B.idx.push(a0+i,a0+i1,a1+i,a0+i1,a1+i1,a1+i)}}
  var RL=R0+(R.length-1)*N;for(i=0;i<N;i++)B.idx.push(cb,RL+i,RL+(i+1)%N)};
 GB.prototype.ell=function(cx,cy,cz,rx,ry,rz,c,w,rows,N,tmax){rows=rows||10;N=N||14;tmax=tmax||Math.PI;var B=this,st=B.pos.length/3;
  for(var j=0;j<=rows;j++){var th=j/rows*tmax;for(var i=0;i<=N;i++){var a=i/N*Math.PI*2;B.v(cx+rx*Math.sin(th)*Math.cos(a),cy+ry*Math.cos(th),cz+rz*Math.sin(th)*Math.sin(a),c,w,i/N,1-th/Math.PI)}}
  for(j=0;j<rows;j++)for(i=0;i<N;i++){var a0=st+j*(N+1)+i,a1=a0+N+1;B.idx.push(a0,a0+1,a1,a0+1,a1+1,a1)}};
 function W1(b){var o={};o[b]=1;return o}
 function W2(a,b,k){var o={};o[a]=1-k;o[b]=k;return o}
 var gcache={};
 function bodyGeo(o){var key=[o.skin,o.shirt,o.shorts,o.sock,o.trim,o.boot,o.gk?1:0].join('_');if(gcache[key])return gcache[key];var B=new GB();
  var sk=lin(o.skin),sh=lin(o.shirt),sp=lin(o.shorts),so=lin(o.sock),tr=lin(o.trim),bt=lin(o.boot),gl=lin(o.gk?0xf2f2f2:o.skin);
  function R(x,y,z,rx,rz,c,w,cap){return{x:x,y:y,z:z,rx:rx,rz:rz,c:c,w:w,cap:cap}}
  B.tube([R(0,1.54,0,.064,.06,tr,W2('chest','neck',.5),.01),R(0,1.525,0,.085,.07,tr,W1('chest')),R(0,1.515,0,.105,.08,sh,W1('chest')),R(0,1.485,0,.2,.105,sh,W1('chest')),R(0,1.445,-.004,.24,.122,sh,W1('chest')),R(0,1.4,-.002,.238,.127,sh,W1('chest')),R(0,1.34,.005,.22,.13,sh,W1('chest')),
   R(0,1.24,.008,.19,.122,sh,W2('spine','chest',.4)),R(0,1.13,.005,.17,.112,sh,W1('spine')),R(0,1.05,0,.165,.108,sh,W2('hips','spine',.5)),R(0,1.035,0,.168,.11,sp,W2('hips','spine',.3)),
   R(0,.97,-.005,.172,.115,sp,W1('hips')),R(0,.9,-.005,.15,.105,sp,W1('hips'),.03)],16);
  B.tube([R(0,1.66,.005,.05,.05,sk,W1('head')),R(0,1.6,.005,.054,.052,sk,W2('neck','head',.3)),R(0,1.52,0,.058,.056,sk,W1('neck'),.02)],10);
  [1,-1].forEach(function(s){var S=s>0?'L':'R';var th='thigh'+S,sn='shin'+S,ft='foot'+S;var x=s*.1;
   B.tube([R(x*.9,1.0,0,.1,.1,sp,W2('hips',th,.5),.02),R(x,.92,0,.108,.106,sp,W1(th)),R(x*1.03,.8,.006,.105,.103,sp,W1(th)),R(x*1.03,.79,.006,.096,.096,sk,W1(th)),
    R(x*1.01,.66,.008,.086,.088,sk,W1(th)),R(x,.53,.01,.066,.07,sk,W2(th,sn,.5)),R(x,.47,.004,.066,.07,so,W2(th,sn,.85)),R(x,.37,-.012,.072,.08,so,W1(sn)),R(x,.24,0,.05,.054,so,W1(sn)),R(x,.12,0,.042,.044,so,W2(sn,ft,.35),.02)],14);
   B.ell(x,.055,.045,.052,.05,.135,bt,W1(ft),6,12);
   B.ell(x,.1,0,.045,.04,.05,bt,W2(sn,ft,.6),4,10)});
  [1,-1].forEach(function(s){var S=s>0?'L':'R';var ua='uarm'+S,fa='farm'+S,hd='hand'+S;var x=s*.215;var sl=o.gk?sh:sk;var gw=o.gk?1.25:1;
   B.tube([R(x*.86,1.47,0,.056,.054,sh,W2('chest',ua,.6),.02),R(x*.98,1.43,0,.068,.064,sh,W2('chest',ua,.85)),R(x*1.05,1.34,0,.064,.06,sh,W1(ua)),R(x*1.07,1.3,0,.062,.058,o.gk?sh:tr,W1(ua)),R(x*1.07,1.288,0,.053,.052,sl,W1(ua)),
    R(x*1.08,1.17,.005,.048,.047,sl,W2(ua,fa,.5)),R(x*1.1,1.06,.01,.045,.042,sl,W1(fa)),R(x*1.12,.975,.012,.032,.029,sl,W2(fa,hd,.3)),R(x*1.125,.94,.014,.036*gw,.024*gw,gl,W1(hd)),R(x*1.13,.89,.016,.04*gw,.022*gw,gl,W1(hd)),R(x*1.13,.845,.016,.03*gw,.018*gw,gl,W1(hd),.015)],14)});
  [1,-1].forEach(function(s){B.ell(s*.093,1.71,-.002,.016,.03,.022,sk,W1('head'),4,8)});
  B.ell(0,1.7,.1,.011,.02,.014,sk,W1('head'),4,8);
  var n0=B.idx.length;
  B.ell(0,1.715,.008,.093,.12,.105,new T3.Color(1,1,1),W1('head'),14,20);
  var g=new T3.BufferGeometry();g.setIndex(B.idx);g.setAttribute('position',new T3.Float32BufferAttribute(B.pos,3));g.setAttribute('color',new T3.Float32BufferAttribute(B.col,3));g.setAttribute('uv',new T3.Float32BufferAttribute(B.uv,2));
  g.setAttribute('skinIndex',new T3.Uint16BufferAttribute(B.si,4));g.setAttribute('skinWeight',new T3.Float32BufferAttribute(B.sw,4));g.computeVertexNormals();
  g.addGroup(0,n0,0);g.addGroup(n0,B.idx.length-n0,1);gcache[key]=g;return g}
 /* twarz: u=0.25 (x=128) to środek twarzy, góra tekstury to czubek głowy */
 function faceTex(o){var c=cvs(512,256),x=c.getContext('2d');var sc='#'+new T3.Color(o.skin).getHexString(),hcol='#'+new T3.Color(o.hairC).getHexString();var hs=o.hair;
  x.fillStyle=sc;x.fillRect(0,0,512,256);
  var g=x.createLinearGradient(0,150,0,256);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(255,230,210,.18)');x.fillStyle=g;x.fillRect(0,150,512,106);
  /* linia włosów wg profilu fryzury */
  var pr=(hs===4||hs===6)?[.34,.46,.62]:PROF[hs]||(hs===0?[.33,.44,.6]:null);var shaved=hs===0||hs===4||hs===6;
  if(pr){x.beginPath();x.moveTo(0,0);for(var px=0;px<=512;px+=4){var a=px/512*Math.PI*2;var yy=thMax(pr,a)/Math.PI*256;x.lineTo(px,yy)}x.lineTo(512,0);x.closePath();
   x.fillStyle=shaved?(hs===0?'rgba(30,20,12,.32)':'rgba(30,20,12,.5)'):hcol;x.fill();if(hs===4||hs===6){x.beginPath();x.moveTo(0,0);for(var p2=0;p2<=512;p2+=4){var a2=p2/512*Math.PI*2;var d2=Math.abs(((a2-Math.PI/2)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI);x.lineTo(p2,(hs===6?(d2<.35||d2>2.8?.5:.06):.22)*256*(hs===6?1:1))}x.lineTo(512,0);x.closePath();x.fillStyle=hcol;x.globalAlpha=hs===6?.0:.9;x.fill();x.globalAlpha=1}}
  var cx=128;
  var bw=o.brows===1?10:o.brows===2?4:7;x.strokeStyle=hcol;x.lineWidth=bw;x.lineCap='round';
  x.beginPath();x.moveTo(cx-38,98);x.quadraticCurveTo(cx-24,90,cx-10,96);x.stroke();x.beginPath();x.moveTo(cx+10,96);x.quadraticCurveTo(cx+24,90,cx+38,98);x.stroke();
  [-1,1].forEach(function(s){var ex=cx+s*22,ey=113;x.fillStyle='rgba(90,50,30,.18)';x.beginPath();x.ellipse(ex,ey-3,14,8,0,0,7);x.fill();x.fillStyle='#f6f4ef';x.beginPath();x.ellipse(ex,ey,10.5,6,0,0,7);x.fill();x.fillStyle=o.eye;x.beginPath();x.arc(ex+s*.5,ey,5,0,7);x.fill();x.fillStyle='#111';x.beginPath();x.arc(ex+s*.5,ey,2.4,0,7);x.fill();x.fillStyle='#fff';x.fillRect(ex-1,ey-4,2.4,2.4);
   x.strokeStyle='rgba(40,20,10,.85)';x.lineWidth=2.5;x.beginPath();x.ellipse(ex,ey,10.5,6,0,Math.PI*1.05,Math.PI*1.95);x.stroke()});
  x.fillStyle='rgba(120,60,40,.25)';x.beginPath();x.ellipse(cx,146,10,5,0,0,7);x.fill();x.fillStyle='rgba(120,60,40,.16)';x.fillRect(cx-3,112,6,30);
  x.fillStyle='#b5645a';x.beginPath();x.ellipse(cx,170,16,5,0,0,7);x.fill();x.strokeStyle='rgba(80,20,20,.7)';x.lineWidth=2;x.beginPath();x.moveTo(cx-16,169);x.quadraticCurveTo(cx,175,cx+16,169);x.stroke();
  x.fillStyle='rgba(255,140,120,.14)';x.beginPath();x.arc(cx-40,150,14,0,7);x.fill();x.beginPath();x.arc(cx+40,150,14,0,7);x.fill();
  var t=new T3.CanvasTexture(c);t.encoding=T3.sRGBEncoding;t.anisotropy=4;return t}
 /* fryzury: osobne bryły przyczepione do kości głowy (środek głowy względem kości: 0,.115,.008) */
 /* fryzury: powłoka dopasowana do elipsoidy głowy (środek względem kości głowy: 0,.115,.008) */
 var HC=[0,.115,.008],RX=.093,RY=.12,RZ=.105;
 /* profil linii włosów [przód, bok, tył] w ułamkach PI (kąt od czubka głowy) */
 var PROF={1:[.34,.44,.62],2:[.4,.45,.62],3:[.33,.45,.62],4:[.3,.24,.3],5:[.34,.44,.6],7:[.33,.43,.6],8:[.3,.52,.66],9:[.36,.6,.84],10:[.34,.45,.64],11:[.34,.42,.6]};
 function sm(t){return t*t*(3-2*t)}
 function thMax(pr,a){var d=Math.abs(((a-Math.PI/2)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI);var t=d/Math.PI;return Math.PI*(t<.5?lerp(pr[0],pr[1],sm(t/.5)):lerp(pr[1],pr[2],sm((t-.5)/.5)))}
 function surf(th,a,k){return new T3.Vector3(HC[0]+RX*k*Math.sin(th)*Math.cos(a),HC[1]+RY*k*Math.cos(th),HC[2]+RZ*k*Math.sin(th)*Math.sin(a))}
 function nrm(th,a){return new T3.Vector3(Math.sin(th)*Math.cos(a)/RX,Math.cos(th)/RY,Math.sin(th)*Math.sin(a)/RZ).normalize()}
 function shell(pr,k,noise,vol){vol=vol||0;var N=48,R=16,pos=[],idx=[],uvs=[];for(var j=0;j<=N;j++){var a=j/N*Math.PI*2,tm=thMax(pr,a);for(var i=0;i<=R;i++){var th=i/R*tm;var fr=i/R;var kk=k+vol*(1-fr*fr)+(noise?noise*(Math.sin(a*9+i)*.5+Math.sin(th*13+a*5)*.5):0);if(i===R)kk=1.005;var p=surf(th,a,kk);pos.push(p.x,p.y,p.z);uvs.push(j/N*10,fr)}}
  for(j=0;j<N;j++)for(var i2=0;i2<R;i2++){var q=j*(R+1)+i2,w=q+R+1;idx.push(q,w,q+1,q+1,w,w+1)}
  var g=new T3.BufferGeometry();g.setIndex(idx);g.setAttribute('position',new T3.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T3.Float32BufferAttribute(uvs,2));g.computeVertexNormals();return g}
 var HTEX=(function(){var c=cvs(128,16),x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,128,16);for(var i=0;i<128;i++){var v=Math.round(255*(.62+Math.random()*.38));x.fillStyle='rgb('+v+','+v+','+v+')';x.fillRect(i,0,1,16)}var t=new T3.CanvasTexture(c);t.wrapS=t.wrapT=T3.RepeatWrapping;return t})();
 function mergeG(list){var pos=[],nor=[],uv=[],idx=[],off=0;list.forEach(function(g){var P=g.attributes.position,Nn=g.attributes.normal,U=g.attributes.uv;for(var i=0;i<P.count;i++){pos.push(P.getX(i),P.getY(i),P.getZ(i));nor.push(Nn.getX(i),Nn.getY(i),Nn.getZ(i));uv.push(U?U.getX(i):0,U?U.getY(i):0)}if(g.index){for(var k=0;k<g.index.count;k++)idx.push(g.index.getX(k)+off)}else for(var k2=0;k2<P.count;k2++)idx.push(k2+off);off+=P.count;g.dispose()});
  var G=new T3.BufferGeometry();G.setIndex(idx);G.setAttribute('position',new T3.Float32BufferAttribute(pos,3));G.setAttribute('normal',new T3.Float32BufferAttribute(nor,3));G.setAttribute('uv',new T3.Float32BufferAttribute(uv,2));return G}
 function afroGeo(pr){var L=[],mt=new T3.Matrix4();for(var i=0;i<130;i++){var a=Math.random()*Math.PI*2,tm=thMax(pr,a),fr=Math.sqrt(Math.random()),th=fr*tm*.97,front=Math.max(0,Math.cos(a-Math.PI/2));if(front>.55&&fr>.68)continue;var p=surf(th,a,1.0),n=nrm(th,a),off=.05+.035*(1-fr)-front*fr*.03,r=.052+Math.random()*.02-front*fr*.012;
   var g=new T3.IcosahedronGeometry(r,1);mt.makeTranslation(p.x+n.x*off,p.y+n.y*off,p.z+n.z*off);g.applyMatrix4(mt);L.push(g)}return mergeG(L)}
 function dreadGeo(pr){var L=[];for(var i=0;i<64;i++){var a=Math.random()*Math.PI*2,da=Math.abs(((a-Math.PI/2)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI);if(da<1.0){i--;continue}var tm=thMax(pr,a),th=tm*(.45+Math.random()*.5),p=surf(th,a,1.05),n=nrm(th,a);
   var len=da<1.5?.12+Math.random()*.05:.2+Math.random()*.09,o2=.04+(1-th/tm)*.03;var pts=[p,new T3.Vector3(p.x+n.x*o2,p.y+n.y*o2,p.z+n.z*o2),new T3.Vector3(p.x+n.x*(o2+.012),p.y-len*.5,p.z+n.z*(o2+.012)),new T3.Vector3(p.x+n.x*(o2+.02)+Math.random()*.01,p.y-len,p.z+n.z*(o2+.02))];
   var g=new T3.TubeGeometry(new T3.CatmullRomCurve3(pts),8,.0125+Math.random()*.003,5,false);L.push(g);var tip=new T3.SphereGeometry(.014,6,4);var e=pts[3];tip.translate(e.x,e.y,e.z);L.push(tip)}return mergeG(L)}
 function curtainGeo(pr){var N=40,R=9,pos=[],uv=[],idx=[],a0=Math.PI/2+1.05,a1=Math.PI/2+2*Math.PI-1.05,yb=HC[1]-.37;for(var j=0;j<=N;j++){var a=lerp(a0,a1,j/N),tm=thMax(pr,a),top=surf(tm-.04,a,1.06),ed=Math.min(1,Math.min(j,N-j)/5);
   for(var i=0;i<=R;i++){var f=i/R,fl=1+.32*f*f,y=lerp(top.y,yb+(1-ed)*.12,f),wv=Math.sin(a*7+f*4)*.006;pos.push(HC[0]+(top.x-HC[0])*fl+wv,y,HC[2]+(top.z-HC[2])*fl-.012*f);uv.push(j/N*8,f)}}
  for(j=0;j<N;j++)for(var i2=0;i2<R;i2++){var q=j*(R+1)+i2,w=q+R+1;idx.push(q,w,q+1,q+1,w,w+1)}var G=new T3.BufferGeometry();G.setIndex(idx);G.setAttribute('position',new T3.Float32BufferAttribute(pos,3));G.setAttribute('uv',new T3.Float32BufferAttribute(uv,2));G.computeVertexNormals();return G}
 function hairGroup(st,col,band){var g=new T3.Group(),m=new T3.MeshStandardMaterial({color:col,roughness:.8,side:T3.DoubleSide,map:HTEX});
  function add(geo){var x=new T3.Mesh(geo,m);g.add(x);return x}
  function onSurf(mesh,th,a,k,out){var p=surf(th,a,k);mesh.position.copy(p);if(out){var n=nrm(th,a);mesh.quaternion.setFromUnitVectors(new T3.Vector3(0,1,0),n)}g.add(mesh);return mesh}
  var pr=PROF[st];
  if(st===1)add(shell(pr,1.03,.006,.04));
  else if(st===2){add(shell(pr,1.03,.006,.05));for(var f=0;f<9;f++){var a=Math.PI/2+(f-4)*.17;var b=new T3.Mesh(new T3.SphereGeometry(1,10,8),m);b.scale.set(.03,.016,.026);onSurf(b,thMax(pr,a)-.06,a,1.07,true)}}
  else if(st===3){add(shell(pr,1.03,0));for(var c=0;c<80;c++){var a3=Math.random()*Math.PI*2,t3=Math.random()*(thMax(pr,a3)-.05);var s3=new T3.Mesh(new T3.SphereGeometry(.026+Math.random()*.008,8,6),m);onSurf(s3,t3,a3,1.08,false)}}
  else if(st===4){add(shell(pr,1.02,.004,.13))}
  else if(st===5){add(shell(pr,1.03,.004,.03));var bun=new T3.Mesh(new T3.SphereGeometry(.048,14,10),m);onSurf(bun,.33*Math.PI,1.5*Math.PI,1.28,false);var tie=new T3.Mesh(new T3.TorusGeometry(.03,.008,6,14),new T3.MeshStandardMaterial({color:0x111111}));onSurf(tie,.36*Math.PI,1.5*Math.PI,1.1,true)}
  else if(st===6){var crest=[];for(var q=0;q<=10;q++){var tt=lerp(-.3,.5,q/10)*Math.PI;var a6=tt<0?Math.PI/2:1.5*Math.PI;var th6=Math.abs(tt);var cn=new T3.Mesh(new T3.ConeGeometry(.024,.07+.03*Math.sin(q/10*Math.PI),6),m);onSurf(cn,th6,a6,1.0,true);var bx=new T3.Mesh(new T3.BoxGeometry(.03,.03,.04),m);onSurf(bx,th6,a6,1.0,true)}}
  else if(st===7){add(shell(pr,1.03,.004,.03));for(var k7=0;k7<22;k7++){var a7=Math.random()*Math.PI*2,t7=Math.random()*thMax(pr,a7)*.75;var cn7=new T3.Mesh(new T3.ConeGeometry(.022,.075,6),m);onSurf(cn7,t7,a7,1.06,true)}}
  else if(st===8){add(shell(pr,1.04,.01,.05));add(afroGeo(pr))}
  else if(st===9){add(shell(pr,1.04,.006,.05));add(curtainGeo(pr))}
  else if(st===10){add(shell(pr,1.03,.004,.04));add(dreadGeo(pr))}
  else if(st===11){add(shell(pr,1.03,.004,.05));var qf=new T3.Mesh(new T3.SphereGeometry(1,16,12),m);qf.scale.set(.075,.045,.07);onSurf(qf,.2*Math.PI,Math.PI/2,1.08,true);qf.rotateX(-.35)}
  if(band&&band.c!=null){var bm=new T3.Mesh(new T3.TorusGeometry(1,.12,8,40),new T3.MeshStandardMaterial({color:band.c,roughness:.6}));var bh=.34*Math.PI;bm.scale.set(RX*Math.sin(bh)*1.12,RZ*Math.sin(bh)*1.12,.12);bm.rotation.x=Math.PI/2;bm.position.set(HC[0],HC[1]+RY*Math.cos(bh)*1.0,HC[2]);g.add(bm)}
  g.traverse(function(o){if(o.isMesh)o.castShadow=true});
  return g}
 var numMats={};function numMat(n,col){var k=n+'_'+col;if(!numMats[k]){var cc=cvs(128,128),x=cc.getContext('2d');x.font='400 112px Anton,Impact,Arial';x.lineWidth=6;x.strokeStyle='rgba(0,0,0,.3)';x.textAlign='center';x.textBaseline='middle';x.strokeText(String(n),64,70);x.fillStyle=col;x.fillText(String(n),64,70);var tt=new T3.CanvasTexture(cc);tt.encoding=T3.sRGBEncoding;numMats[k]=new T3.MeshBasicMaterial({map:tt,transparent:true,depthWrite:false})}return numMats[k]}
 var numG=new T3.PlaneGeometry(.3,.3);
 var bodyM=new T3.MeshStandardMaterial({vertexColors:true,roughness:.72,metalness:0});
 var blobT=(function(){var c=cvs(64,64),x=c.getContext('2d');var gr=x.createRadialGradient(32,32,2,32,32,32);gr.addColorStop(0,'rgba(0,0,0,.5)');gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return new T3.CanvasTexture(c)})();
 var blobM=new T3.MeshBasicMaterial({map:blobT,transparent:true,depthWrite:false,color:0x000000});
 /* look: {skin,hair,hairCol,eyes,brows,boots,shirt,band,num}; kit nadpisuje strój (rywale) */
 function build(look,kit){var g=new T3.Group(),P={g:g,ph:Math.random()*6,yaw:0,sp:0,lsp:0};
  P.set=function(lk,kt){lk=lk||{};P.look=lk;kt=kt||null;
   if(P.mesh){g.remove(P.mesh);P.mesh.material[1].map.dispose();P.mesh.material[1].dispose()}
   var sh=kt?kt.sh:LOOK.shirt[lk.shirt||0];var o={skin:LOOK.skin[lk.skin||0],shirt:sh.c,shorts:kt?kt.sp:0x111827,sock:kt?kt.so:sh.c,trim:sh.t,boot:LOOK.boots[lk.boots||0].c,gk:kt&&kt.gk};
   var hc=LOOK.hairCol[lk.hairCol||0].c;
   var face=new T3.MeshStandardMaterial({map:faceTex({skin:o.skin,hairC:hc,hair:lk.hair||0,eye:LOOK.eyes[lk.eyes||0],brows:lk.brows||0}),roughness:.7});
   var mesh=new T3.SkinnedMesh(bodyGeo(o),[bodyM,face]);var bs=mkBones();mesh.add(bs.arr[0]);mesh.bind(new T3.Skeleton(bs.arr));mesh.castShadow=true;mesh.frustumCulled=false;
   P.B=bs.map;P.mesh=mesh;g.add(mesh);
   P.hairG=hairGroup(lk.hair||0,lin(hc),LOOK.band[lk.band||0]);P.B.head.add(P.hairG);
   var nb=new T3.Mesh(numG,numMat(lk.num||10,'#'+new T3.Color(sh.t).getHexString()));nb.position.set(0,.03,-.131);nb.rotation.y=Math.PI;P.B.chest.add(nb);
   var ag=lk.age,s=ag==null||ag>=18?1:Math.max(.8,.8+(ag-12)*.2/6);P.hs=s;mesh.scale.setScalar(s);P.B.head.scale.setScalar((lk.kid?1.04:1)+(1-s)*.35)};
  P.set(look,kit);
  var blob=new T3.Mesh(new T3.PlaneGeometry(1.1,1.1),blobM);blob.rotation.x=-Math.PI/2;blob.position.y=.012;g.add(blob);P.blob=blob;
  return P}
 /* ---------- animacje: P.sp (m/s), P.kick (s pozostałe z .38), P.foot 'R'/'L', P.juggle, P.head, P.cele{type,t}, P.dive, P.ready ---------- */
 function animate(P,dt){var B=P.B;P.lsp+=(P.sp-P.lsp)*Math.min(1,dt*8);var sp=P.lsp;
  var amp=clamp(sp/7,0,1),spr=clamp((sp-5)/3,0,1);P.ph+=dt*(4+sp*1.3);var sw=Math.sin(P.ph),cw=Math.cos(P.ph);var A=.55+.35*spr;
  B.root.position.set(0,Math.abs(cw)*.05*amp-.025*amp,0);B.root.rotation.set(0,0,0);
  B.hips.rotation.set(0,-sw*.12*amp,0);B.spine.rotation.set(.1*amp+.04*spr,sw*.08*amp,0);B.chest.rotation.set(.04*amp,sw*.08*amp,0);B.neck.rotation.set(-.06*amp,0,0);B.head.rotation.set(-.05*amp,0,0);
  B.thighL.rotation.set(sw*A*amp-.04*amp,0,-.03);B.thighR.rotation.set(-sw*A*amp-.04*amp,0,.03);
  B.shinL.rotation.set(Math.max(0,-cw)*1.35*amp+.06,0,0);B.shinR.rotation.set(Math.max(0,cw)*1.35*amp+.06,0,0);
  B.footL.rotation.set(-.2*amp*Math.max(0,cw),0,0);B.footR.rotation.set(-.2*amp*Math.max(0,-cw),0,0);
  B.uarmL.rotation.set(-sw*.75*amp,0,.1+.06*amp);B.uarmR.rotation.set(sw*.75*amp,0,-.1-.06*amp);
  B.farmL.rotation.set(-.3-1.0*amp,0,0);B.farmR.rotation.set(-.3-1.0*amp,0,0);
  if(amp<.12){var br=Math.sin(P.ph*.45)*.02;B.spine.rotation.x=.03+br;B.uarmL.rotation.z=.14;B.uarmR.rotation.z=-.14;B.farmL.rotation.x=-.25;B.farmR.rotation.x=-.25;B.thighL.rotation.z=-.06;B.thighR.rotation.z=.06}
  if(P.ready){B.root.position.y=-.06;B.thighL.rotation.x=-.25;B.thighR.rotation.x=-.25;B.shinL.rotation.x=.45;B.shinR.rotation.x=.45;B.spine.rotation.x=.22;B.uarmL.rotation.set(-.4,0,.45);B.uarmR.rotation.set(-.4,0,-.45);B.farmL.rotation.x=-.6;B.farmR.rotation.x=-.6}
  /* kopnięcie */
  if(P.kick>0){P.kick-=dt;var kt=clamp(1-P.kick/.38,0,1);var R=P.foot==='L'?'L':'R',O=R==='L'?'R':'L';
   B['thigh'+R].rotation.x=kt<.45?.9*(kt/.45):.9-2.2*((kt-.45)/.55);B['shin'+R].rotation.x=kt<.5?1.3*(kt/.5):Math.max(.08,1.3-(kt-.5)*3.6);B['thigh'+O].rotation.x=.05;B['shin'+O].rotation.x=.2;
   B.uarmL.rotation.set(-.3,0,.9);B.uarmR.rotation.set(0,0,-.7);B.spine.rotation.set(-.08,R==='R'?.25:-.25,0)}
  /* podbicie przy żonglerce: udo w górę, stopa płasko */
  if(P.juggle>0){P.juggle-=dt;var jt=Math.sin(clamp(1-P.juggle/.3,0,1)*Math.PI);var J=P.foot==='L'?'L':'R';
   B['thigh'+J].rotation.x=-1.05*jt;B['shin'+J].rotation.x=.55*jt+.06;B['foot'+J].rotation.x=-.25*jt;B.uarmL.rotation.z=.35+.2*jt;B.uarmR.rotation.z=-.35-.2*jt;B.spine.rotation.x=.08;B.head.rotation.x=.35;B.neck.rotation.x=.2}
  else if(P.watch){B.head.rotation.x=.3;B.neck.rotation.x=.15;B.uarmL.rotation.z=.32;B.uarmR.rotation.z=-.32}
  /* główka */
  if(P.head>0){P.head-=dt;var hk=clamp(1-P.head/.7,0,1);var air=Math.sin(hk*Math.PI);B.root.position.y=air*.55;var arch=hk<.5?-.45*(hk/.5):-.45+1.0*((hk-.5)/.5);B.spine.rotation.x=arch*.8;B.chest.rotation.x=arch*.5;B.neck.rotation.x=arch*.6;B.head.rotation.x=arch*.5;B.uarmL.rotation.set(-.6*air,0,.6+.8*air);B.uarmR.rotation.set(-.6*air,0,-.6-.8*air);B.farmL.rotation.x=-.9;B.farmR.rotation.x=-.9;B.thighL.rotation.x=-.5*air;B.thighR.rotation.x=-.2*air;B.shinL.rotation.x=1.1*air;B.shinR.rotation.x=1.3*air}
  /* bramkarz: parada (P.dive={t,s:1/-1,high}) */
  if(P.dive){var v=P.dive;v.t+=dt;var p1=clamp(v.t/.38,0,1),ep=1-(1-p1)*(1-p1),up=v.t>1.6?clamp((v.t-1.6)/.6,0,1):0;
   B.thighL.rotation.set(0,0,0);B.thighR.rotation.set(0,0,0);B.shinL.rotation.x=.1;B.shinR.rotation.x=.1;B.spine.rotation.set(0,0,0);B.hips.rotation.set(0,0,0);B.chest.rotation.set(0,0,0);
   var rl=1.3*ep*(1-up)*v.s;B.root.rotation.z=rl;var dxs=rl>=0?-1:1,lat=.8*ep*(1-up),arc=(v.high?.55:.28)*Math.sin(Math.min(1,v.t/.5)*Math.PI)*(1-up),hipY=Math.max(.24,.96*Math.cos(rl))+arc;B.root.position.x=dxs*lat+.96*Math.sin(rl);B.root.position.y=hipY-.96*Math.cos(rl);
   var ar=2.95*Math.min(1,v.t/.2)*(1-up);B.uarmL.rotation.set(0,0,Math.max(.12,ar));B.uarmR.rotation.set(0,0,-Math.max(.12,ar));B.farmL.rotation.x=-.08;B.farmR.rotation.x=-.08;
   B.thighL.rotation.set(-.25*ep,0,-.2*ep);B.thighR.rotation.set(.2*ep,0,.15*ep);B.shinL.rotation.x=.5*ep;B.shinR.rotation.x=.25*ep;if(v.t>2.4)P.dive=null}
  /* wślizg (P.slide={t}) nogami do przodu */
  if(P.slide){var vs=P.slide;vs.t+=dt;var sk=clamp(vs.t/.16,0,1)*(vs.t>1.25?clamp(1-(vs.t-1.25)/.45,0,1):1),rs=-.95*sk;B.root.rotation.x=rs;var hy=lerp(.96,.32,sk);B.root.position.z=-.96*Math.sin(rs);B.root.position.y=hy-.96*Math.cos(rs);
   B.thighR.rotation.set(-.55*sk,0,0);B.shinR.rotation.x=.05;B.footR.rotation.x=-.4*sk;B.thighL.rotation.set(-.1*sk,0,-.15*sk);B.shinL.rotation.x=1.5*sk;B.spine.rotation.set(.55*sk,0,0);B.neck.rotation.x=.25*sk;B.uarmL.rotation.set(.9*sk,0,.35);B.farmL.rotation.x=-.1;B.uarmR.rotation.set(-.3,0,-.9*sk);if(vs.t>1.75)P.slide=null}
  /* cieszynki */
  if(P.cele){var c=P.cele;c.t+=dt;var t=c.t;c.yo=0;
   if(c.type===0){var pu=Math.abs(Math.sin(t*6));B.root.position.y=pu*.38;B.uarmL.rotation.set(0,0,2.55+pu*.3);B.uarmR.rotation.set(0,0,-2.55-pu*.3);B.farmL.rotation.x=-.6+pu*.4;B.farmR.rotation.x=-.6+pu*.4;B.thighL.rotation.x=-.3*pu;B.thighR.rotation.x=-.3*pu;B.shinL.rotation.x=.5*pu;B.shinR.rotation.x=.5*pu;B.head.rotation.x=-.25}
   else if(c.type===1){var rs=Math.sin(t*9);B.uarmL.rotation.set(0,0,1.5);B.uarmR.rotation.set(0,0,-1.5);B.farmL.rotation.x=0;B.farmR.rotation.x=0;B.root.rotation.z=Math.sin(t*2.2)*.3;B.spine.rotation.x=.25;B.thighL.rotation.x=rs*.55;B.thighR.rotation.x=-rs*.55;B.shinL.rotation.x=Math.max(0,-Math.cos(t*9))*1.1;B.shinR.rotation.x=Math.max(0,Math.cos(t*9))*1.1;B.root.position.y=Math.abs(Math.cos(t*9))*.05;c.yo=t*1.3}
   else if(c.type===2){var k=clamp(t/.35,0,1);B.root.position.y=-.42*k;B.root.position.z=.9*(1-Math.exp(-t*2.5));B.root.rotation.x=-.35*k;B.thighL.rotation.x=.25*k;B.thighR.rotation.x=.25*k;B.shinL.rotation.x=1.6*k;B.shinR.rotation.x=1.6*k;B.spine.rotation.x=-.45*k;B.uarmL.rotation.set(0,0,2.3+Math.sin(t*4)*.15);B.uarmR.rotation.set(0,0,-2.3-Math.sin(t*4)*.15);B.head.rotation.x=-.4*k}
   else if(c.type===3){B.uarmR.rotation.set(-2.25,0,-.3);B.farmR.rotation.x=-2.0;B.uarmL.rotation.set(-.3,0,.6);B.farmL.rotation.x=-.3;B.spine.rotation.y=Math.sin(t*1.4)*.35;B.head.rotation.y=Math.sin(t*1.4)*.45;B.thighL.rotation.z=-.08;B.thighR.rotation.z=.08}
   else if(c.type===4){var bb=Math.abs(Math.sin(t*3));B.uarmL.rotation.set(-1.45,.35,-.25);B.uarmR.rotation.set(-1.45,-.35,.25);B.farmL.rotation.set(-1.25,0,0);B.farmR.rotation.set(-1.25,0,0);B.root.position.y=bb*.1;B.head.rotation.x=.1;B.spine.rotation.y=Math.sin(t*1.2)*.25}
   else if(c.type===5){var s=clamp((t%2.2-.3)/.75,0,1),e2=s*s*(3-2*s);B.root.position.y=Math.sin(s*Math.PI)*1.15;B.root.rotation.x=-e2*Math.PI*2;var tuck=Math.sin(s*Math.PI);B.thighL.rotation.x=-1.2*tuck;B.thighR.rotation.x=-1.2*tuck;B.shinL.rotation.x=1.6*tuck;B.shinR.rotation.x=1.6*tuck;B.uarmL.rotation.set(-1*tuck,0,.4+1.6*(1-tuck));B.uarmR.rotation.set(-1*tuck,0,-.4-1.6*(1-tuck))}
   else if(c.type===6){var tc=t%3.2,j1=clamp((tc-.25)/.55,0,1),air=Math.sin(j1*Math.PI),land=clamp((tc-.8)/.2,0,1);if(tc<.25){B.root.position.y=-.12*(tc/.25);B.thighL.rotation.x=-.3;B.thighR.rotation.x=-.3;B.shinL.rotation.x=.6;B.shinR.rotation.x=.6}
     B.root.position.y=tc<.25?B.root.position.y:air*.75;c.yo=Math.PI*(j1*j1*(3-2*j1));if(j1<1){B.uarmL.rotation.set(0,0,2.6*air);B.uarmR.rotation.set(0,0,-2.6*air);B.thighL.rotation.x=-.5*air;B.thighR.rotation.x=-.5*air;B.shinL.rotation.x=.9*air;B.shinR.rotation.x=.9*air}
     else{B.thighL.rotation.set(0,0,-.32*land);B.thighR.rotation.set(0,0,.32*land);B.uarmL.rotation.set(.35,0,.55);B.uarmR.rotation.set(.35,0,-.55);B.farmL.rotation.x=-.15;B.farmR.rotation.x=-.15;B.spine.rotation.x=-.18;B.head.rotation.x=-.3;B.root.position.y=-.05*land}}
   else if(c.type===7){B.thighL.rotation.set(-.15,0,-.3);B.thighR.rotation.set(.15,0,.3);B.spine.rotation.z=.22;B.uarmL.rotation.set(-.5,0,2.25);B.farmL.rotation.x=0;B.uarmR.rotation.set(-1.35,0,-.15);B.farmR.rotation.x=-1.7;B.head.rotation.set(-.2,.5,0);B.root.position.y=Math.sin(t*2)*.02}
   else if(c.type===8){var sw=Math.sin(t*3.2);B.uarmL.rotation.set(-1.15,0,-.3);B.uarmR.rotation.set(-1.15,0,.3);B.farmL.rotation.x=-1.35;B.farmR.rotation.x=-1.35;B.spine.rotation.y=sw*.45;B.chest.rotation.y=sw*.15;B.root.rotation.z=sw*.08;B.head.rotation.y=sw*.3}
   else if(c.type===9){var dn=Math.sin(t*5.5),up=Math.abs(Math.sin(t*5.5));B.hips.rotation.z=dn*.18;B.spine.rotation.z=-dn*.14;B.uarmL.rotation.set(0,0,dn>0?2.6:.4);B.uarmR.rotation.set(0,0,dn>0?-.4:-2.6);B.farmL.rotation.x=-.4;B.farmR.rotation.x=-.4;B.root.position.y=up*.08;B.thighL.rotation.x=-.25*up;B.shinL.rotation.x=.5*up;B.thighR.rotation.x=-.25*(1-up);B.shinR.rotation.x=.5*(1-up)}
   else if(c.type===10){var k2=clamp(t/.4,0,1);B.root.position.y=-.42*k2;B.thighL.rotation.x=.25*k2;B.thighR.rotation.x=.25*k2;B.shinL.rotation.x=1.6*k2;B.shinR.rotation.x=1.6*k2;B.spine.rotation.x=-.3*k2;B.uarmL.rotation.set(-.4,0,2.2);B.uarmR.rotation.set(-.4,0,-2.2);B.farmL.rotation.x=-.1;B.farmR.rotation.x=-.1;B.head.rotation.x=-.55*k2}
   else if(c.type===11){B.uarmR.rotation.set(-1.55,0,-1.25);B.farmR.rotation.x=-2.15;B.uarmL.rotation.set(0,0,.06);B.farmL.rotation.x=-.05;B.spine.rotation.x=-.06;B.head.rotation.x=-.08}
   else if(c.type===12){var bw=Math.max(0,Math.sin(t*1.8));B.spine.rotation.x=.75*bw;B.chest.rotation.x=.2*bw;B.head.rotation.x=.2*bw;B.uarmR.rotation.set(-1.3,0,.5);B.farmR.rotation.x=-1.4;B.uarmL.rotation.set(.4,0,.5)}}
  P.g.rotation.y=P.yaw+(P.cele&&P.cele.yo||0)}
 return {build:build,animate:animate,LOOK:LOOK}
}
window.KPChar={make:make,LOOK:LOOK};
})();
