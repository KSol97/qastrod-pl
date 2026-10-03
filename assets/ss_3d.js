/* Symulator selekcjonera: mecz 3D v4 (Three.js) - transmisja TV, gładkie modele z twarzami */
(function(){
'use strict';
var L=105,W=68,BR=.17;
function clamp(v,a,b){return v<a?a:v>b?b:v}
function lerp(a,b,k){return a+(b-a)*k}
function hexLum(h){h=String(h).replace('#','');if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];var r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16);return (r*.3+g*.59+b*.11)/255}
function lin(c){var T3=window.THREE;return (c&&c.isColor?c.clone():new T3.Color(c)).convertSRGBToLinear()}
function cvs(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c}
function shade(hex,k){var c=hex.clone?hex.clone():hex;return c.multiplyScalar(k)}

/* ---------- tekstury ---------- */
function pitchTex(T3,mob){var S=mob?9:12,M=4,c=cvs((L+2*M)*S,(W+2*M)*S),x=c.getContext('2d');
 x.fillStyle='#17602c';x.fillRect(0,0,c.width,c.height);
 for(var i=0;i<18;i++){x.fillStyle=i%2?'#1f7436':'#1a6830';x.fillRect(M*S+i*L*S/18,0,L*S/18+1,c.height)}
 var g=x.createRadialGradient(c.width/2,c.height/2,c.height*.2,c.width/2,c.height/2,c.width*.7);g.addColorStop(0,'rgba(255,255,255,.04)');g.addColorStop(1,'rgba(0,0,0,.18)');x.fillStyle=g;x.fillRect(0,0,c.width,c.height);
 for(var n=0;n<14000;n++){x.fillStyle=Math.random()<.5?'rgba(0,0,0,.05)':'rgba(255,255,255,.035)';x.fillRect(Math.random()*c.width,Math.random()*c.height,2,2)}
 x.strokeStyle='rgba(255,255,255,.95)';x.lineWidth=S*.14;var o=M*S;
 function R(a,b,w,h){x.strokeRect(o+a*S,o+b*S,w*S,h*S)}
 R(0,0,L,W);x.beginPath();x.moveTo(o+L/2*S,o);x.lineTo(o+L/2*S,o+W*S);x.stroke();
 x.beginPath();x.arc(o+L/2*S,o+W/2*S,9.15*S,0,7);x.stroke();
 R(0,W/2-20.16,16.5,40.32);R(L-16.5,W/2-20.16,16.5,40.32);R(0,W/2-9.16,5.5,18.32);R(L-5.5,W/2-9.16,5.5,18.32);
 [[11,1],[L-11,-1]].forEach(function(p){x.beginPath();x.arc(o+p[0]*S,o+W/2*S,9.15*S,p[1]>0?-0.93:Math.PI-0.93,p[1]>0?0.93:Math.PI+0.93);x.stroke();x.fillStyle='#fff';x.beginPath();x.arc(o+p[0]*S,o+W/2*S,S*.25,0,7);x.fill()});
 x.fillStyle='#fff';x.beginPath();x.arc(o+L/2*S,o+W/2*S,S*.3,0,7);x.fill();
 [[0,0,0],[L,0,.5],[0,W,1.5],[L,W,1]].forEach(function(p){x.beginPath();x.arc(o+p[0]*S,o+p[1]*S,S,p[2]*Math.PI,(p[2]+.5)*Math.PI);x.stroke()});
 var t=new T3.CanvasTexture(c);t.anisotropy=8;t.encoding=T3.sRGBEncoding;return t}
function crowdTex(T3,cols){var c=cvs(1024,512),x=c.getContext('2d');x.fillStyle='#0d1428';x.fillRect(0,0,1024,512);
 for(var r=0;r<32;r++){x.fillStyle=r%2?'#151d38':'#111831';x.fillRect(0,r*16,1024,16);for(var i=0;i<150;i++){var px=i*6.8+Math.random()*2,py=r*16+4+Math.random()*2;
  x.fillStyle=Math.random()<.75?cols[Math.floor(Math.random()*cols.length)]:['#2a2a2a','#555','#ddd','#8d5524'][Math.floor(Math.random()*4)];x.fillRect(px,py,5,8);
  x.fillStyle=['#f1c27d','#e0ac69','#c68642','#ffdbac'][Math.floor(Math.random()*4)];x.beginPath();x.arc(px+2.5,py-1.5,2.2,0,7);x.fill()}}
 var t=new T3.CanvasTexture(c);t.wrapS=T3.RepeatWrapping;t.encoding=T3.sRGBEncoding;return t}
function adTex(T3,k){var c=cvs(1024,64),x=c.getContext('2d');var g=x.createLinearGradient(0,0,1024,0);g.addColorStop(0,k?'#0d2a12':'#0b1a4a');g.addColorStop(1,k?'#0b3a1a':'#1a0b4a');x.fillStyle=g;x.fillRect(0,0,1024,64);
 x.font='900 42px Anton,Impact,Arial';x.textBaseline='middle';for(var i=0;i<4;i++){x.fillStyle=(i+(k||0))%2?'#16d97d':'#ffffff';x.fillText((i+(k||0))%2?'GRAJ ZA DARMO':'QASTROD.PL',24+i*256,34)}
 var t=new T3.CanvasTexture(c);t.wrapS=T3.RepeatWrapping;t.encoding=T3.sRGBEncoding;return t}
function netTex(T3){var c=cvs(128,128),x=c.getContext('2d');x.strokeStyle='rgba(255,255,255,.85)';x.lineWidth=2;for(var i=0;i<=128;i+=16){x.beginPath();x.moveTo(i,0);x.lineTo(i,128);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(128,i);x.stroke()}
 var t=new T3.CanvasTexture(c);t.wrapS=t.wrapT=T3.RepeatWrapping;return t}
function ballTex(T3){var c=cvs(512,256),x=c.getContext('2d');x.fillStyle='#f7f7f7';x.fillRect(0,0,512,256);
 function pent(cx,cy,r,col){x.fillStyle=col;x.beginPath();for(var k=0;k<5;k++){var a=k/5*6.283-1.57;x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}x.closePath();x.fill()}
 [[64,64],[192,128],[320,64],[448,128],[64,200],[320,200],[192,20],[448,20],[0,128],[512,128]].forEach(function(p,i){pent(p[0],p[1],26,i%3===1?'#dc143c':'#141414')});
 x.strokeStyle='rgba(0,0,0,.18)';x.lineWidth=2;for(var i=0;i<20;i++){x.beginPath();x.arc(Math.random()*512,Math.random()*256,40,0,1.2);x.stroke()}
 var t=new T3.CanvasTexture(c);t.encoding=T3.sRGBEncoding;return t}
function blobTex(T3){var c=cvs(64,64),x=c.getContext('2d');var g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new T3.CanvasTexture(c)}
function faceTex(T3,skin,brow,beard){var c=cvs(256,128),x=c.getContext('2d');var col='#'+skin.getHexString();x.fillStyle=col;x.fillRect(0,0,256,128);
 var sd='rgba(0,0,0,.18)';
 /* oczy, brwi, nos, usta: środek twarzy u=0.25 -> x=64 */
 x.fillStyle=brow;x.fillRect(46,49,14,3.5);x.fillRect(68,49,14,3.5);
 x.fillStyle='#fff';x.beginPath();x.ellipse(53,58,5.5,3.2,0,0,7);x.fill();x.beginPath();x.ellipse(75,58,5.5,3.2,0,0,7);x.fill();
 x.fillStyle='#2b1d10';x.beginPath();x.arc(54,58,2.6,0,7);x.fill();x.beginPath();x.arc(74,58,2.6,0,7);x.fill();
 x.fillStyle=sd;x.fillRect(62,60,4,13);x.beginPath();x.ellipse(64,74,6,2.4,0,0,7);x.fill();
 x.fillStyle='rgba(120,30,30,.55)';x.beginPath();x.ellipse(64,84,8,2.2,0,0,7);x.fill();
 x.fillStyle='rgba(255,120,110,.10)';x.beginPath();x.arc(46,72,7,0,7);x.fill();x.beginPath();x.arc(82,72,7,0,7);x.fill();
 if(beard){x.fillStyle=brow;x.globalAlpha=.55;x.beginPath();x.ellipse(64,92,22,12,0,0,Math.PI);x.fill();x.fillRect(42,80,6,14);x.fillRect(80,80,6,14);x.globalAlpha=1}
 var t=new T3.CanvasTexture(c);t.encoding=T3.sRGBEncoding;return t}
function labelTex(T3,name,bg,num){var c=cvs(512,112),x=c.getContext('2d');x.font='800 60px Barlow,Arial';var txt=(num?num+'  ':'')+name;var w=Math.min(500,x.measureText(txt).width+56);
 x.fillStyle=bg;x.beginPath();if(x.roundRect)x.roundRect((512-w)/2,10,w,88,20);else x.rect((512-w)/2,10,w,88);x.fill();x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.fillText(txt,256,56);
 var t=new T3.CanvasTexture(c);t.encoding=T3.sRGBEncoding;return t}

function create(wrap,M,opts){var T3=window.THREE;if(!T3)return null;opts=opts||{};
 var renderer;try{renderer=new T3.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}catch(e){return null}
 if(!renderer.getContext())return null;
 var mob=Math.min(window.innerWidth,window.innerHeight)<700||/Mobi|Android/i.test(navigator.userAgent);
 function size(){return[Math.max(200,wrap.clientWidth||800),Math.max(200,wrap.clientHeight||500)]}
 var sz=size(),tall=sz[1]>sz[0]*1.05;
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,mob?1.6:2));renderer.setSize(sz[0],sz[1],false);
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T3.PCFSoftShadowMap;renderer.outputEncoding=T3.sRGBEncoding;renderer.toneMapping=T3.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 renderer.domElement.className='ss3-cv';wrap.insertBefore(renderer.domElement,wrap.firstChild);
 var scene=new T3.Scene();scene.background=lin(0x0b1430);scene.fog=new T3.Fog(lin(0x0b1430),120,300);
 var cam=new T3.PerspectiveCamera(30,sz[0]/sz[1],.3,600);
 scene.add(new T3.HemisphereLight(0xdfe9ff,0x2a4a2a,.55));
 var amb=new T3.AmbientLight(0xffffff,.08);scene.add(amb);
 var sun=new T3.DirectionalLight(0xfff4e0,1.25);sun.position.set(-30,60,40);sun.castShadow=true;var sc=sun.shadow.camera;sc.left=-30;sc.right=30;sc.top=30;sc.bottom=-30;sc.near=10;sc.far=160;sun.shadow.mapSize.set(mob?1024:2048,mob?1024:2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;scene.add(sun);scene.add(sun.target);
 var fill=new T3.DirectionalLight(0xbcd4ff,.35);fill.position.set(30,30,-40);scene.add(fill);
 /* boisko */
 var pm=new T3.Mesh(new T3.PlaneGeometry(L+8,W+8),new T3.MeshStandardMaterial({map:pitchTex(T3,mob),roughness:.95,metalness:0}));pm.rotation.x=-Math.PI/2;pm.receiveShadow=true;scene.add(pm);
 var gr=new T3.Mesh(new T3.PlaneGeometry(300,220),new T3.MeshLambertMaterial({color:lin(0x16502a)}));gr.rotation.x=-Math.PI/2;gr.position.y=-.02;scene.add(gr);
 /* bandy */
 [[0,W/2+3.4,0,L+8,0],[0,-W/2-3.4,Math.PI,L+8,1],[L/2+5,0,-Math.PI/2,W+8,1],[-L/2-5,0,Math.PI/2,W+8,0]].forEach(function(b){var t=adTex(T3,b[4]);t.repeat.set(b[3]/26,1);var m=new T3.Mesh(new T3.BoxGeometry(b[3],1,.15),new T3.MeshBasicMaterial({map:t}));if(Math.abs(b[2])===Math.PI/2){m.position.set(b[0],.5,b[1]);m.rotation.y=b[2]}else{m.position.set(b[0],.5,b[1]);m.rotation.y=b[2]}scene.add(m)});
 /* trybuny */
 var oc=(window.SS&&window.SS.TEAMS[M.opp])||{c1:'#333',c2:'#fff'};
 var ct=crowdTex(T3,['#ffffff','#dc143c','#ffffff','#dc143c','#dc143c',oc.c1,oc.c2]);
 function stand(w,x,z,ry){var g=new T3.Group();var t=ct.clone();t.needsUpdate=true;t.repeat.set(w/36,1);var mt=new T3.MeshLambertMaterial({map:t});
  var s1=new T3.Mesh(new T3.PlaneGeometry(w,26),mt);s1.rotation.x=-.6;s1.position.set(0,9.5,-2);g.add(s1);
  var lip=new T3.Mesh(new T3.BoxGeometry(w,1.6,.6),new T3.MeshLambertMaterial({color:lin(0x1c2a55)}));lip.position.set(0,.8,7.6);g.add(lip);
  var roof=new T3.Mesh(new T3.BoxGeometry(w+4,.8,16),new T3.MeshLambertMaterial({color:lin(0x0a1128)}));roof.position.set(0,22,-4);roof.rotation.x=.08;g.add(roof);
  var edge=new T3.Mesh(new T3.BoxGeometry(w+4,.25,.25),new T3.MeshBasicMaterial({color:0xfff2c8}));edge.position.set(0,21.4,4);g.add(edge);
  g.position.set(x,0,z);g.rotation.y=ry;scene.add(g)}
 stand(140,0,-(W/2+14),0);stand(140,0,(W/2+14),Math.PI);stand(90,-(L/2+15),0,Math.PI/2);stand(90,(L/2+15),0,-Math.PI/2);
 [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(p){var pole=new T3.Mesh(new T3.CylinderGeometry(.4,.6,38,8),new T3.MeshLambertMaterial({color:lin(0x8899aa)}));pole.position.set(p[0]*(L/2+22),19,p[1]*(W/2+24));scene.add(pole);
  var lamp=new T3.Mesh(new T3.BoxGeometry(7,3.5,1),new T3.MeshBasicMaterial({color:0xfff6d8}));lamp.position.set(p[0]*(L/2+22),39,p[1]*(W/2+24));lamp.lookAt(0,0,0);scene.add(lamp)});
 /* bramki */
 var nets=[];var nt=netTex(T3);
 function goal(dir){var g=new T3.Group(),wm=new T3.MeshStandardMaterial({color:0xffffff,roughness:.4});
  function post(x,y,z,h,rx){var m=new T3.Mesh(new T3.CylinderGeometry(.07,.07,h,12),wm);m.position.set(x,y,z);if(rx)m.rotation.x=rx;m.castShadow=true;g.add(m)}
  post(0,1.22,-3.66,2.44);post(0,1.22,3.66,2.44);post(0,2.44,0,7.46,Math.PI/2);
  var t1=nt.clone();t1.needsUpdate=true;t1.repeat.set(9,3);var nm=new T3.MeshBasicMaterial({map:t1,transparent:true,side:T3.DoubleSide,opacity:.7,depthWrite:false});
  var back=new T3.Mesh(new T3.PlaneGeometry(7.32,2.44),nm);back.position.set(dir*2,1.22,0);back.rotation.y=Math.PI/2;g.add(back);
  var top=new T3.Mesh(new T3.PlaneGeometry(2,7.32),nm);top.rotation.x=-Math.PI/2;top.rotation.z=Math.PI/2;top.position.set(dir*1,2.44,0);g.add(top);
  [-3.66,3.66].forEach(function(z){var sd=new T3.Mesh(new T3.PlaneGeometry(2,2.44),nm);sd.position.set(dir*1,1.22,z);g.add(sd)});
  g.position.set(dir*L/2,0,0);scene.add(g);nets.push({g:g,back:back,dir:dir})}
 goal(-1);goal(1);
 /* piłka */
 var ball=new T3.Mesh(new T3.SphereGeometry(BR,24,16),new T3.MeshStandardMaterial({map:ballTex(T3),roughness:.45}));ball.castShadow=true;scene.add(ball);
 var blobT=blobTex(T3),blobM=new T3.MeshBasicMaterial({map:blobT,transparent:true,depthWrite:false,color:0x000000});
 var bsh=new T3.Mesh(new T3.CircleGeometry(.2,16),new T3.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.35,depthWrite:false}));bsh.rotation.x=-Math.PI/2;scene.add(bsh);
 /* ---------- zawodnicy: jedna gładka siatka ze szkieletem (skinning) ---------- */
 var polAway=hexLum(oc.c1)>.8;
 var oc1=new T3.Color(oc.c1),oc2=new T3.Color(oc.c2);var oppNum=hexLum(oc.c1)>.6?'#111111':'#ffffff';
 var KIT={P:{sh:new T3.Color(polAway?0xc8102e:0xf6f7fb),tr:new T3.Color(polAway?0xffffff:0xdc143c),sp:new T3.Color(polAway?0xf6f7fb:0xb0102c),so:new T3.Color(polAway?0xb0102c:0xf6f7fb),num:polAway?'#ffffff':'#dc143c',gk:new T3.Color(0x18c47a)},
  O:{sh:oc1,tr:oc2,sp:hexLum(oc.c1)>.8?oc2:oc1.clone().multiplyScalar(.85),so:oc1,num:oppNum,gk:new T3.Color(0x333844)}};
 var SKIN_PL=[0xf3d3bb,0xefc9ab,0xe9c0a0,0xf6dcc8,0xecc6a6];
 var SKIN_W=[0xf3d3bb,0xe8bc98,0xd8a47a,0xb57a52,0x8a5a3a,0x6b4329,0xefc9ab];
 var HAIR=[0x2b1b0e,0x141008,0x5a3a1e,0xc9a060,0x3a2614,0x7a5530,0x1a1410];
 var EYES=['#3b6fa8','#4a3420','#5b7f4a','#2d2018','#6a8fb5'];
 var BOOTS=[0x111111,0xf2f2f2,0xff6a00,0x1e90ff,0xffd200,0xe11d48];
 var BN=['root','hips','spine','chest','neck','head','uarmL','farmL','handL','uarmR','farmR','handR','thighL','shinL','footL','thighR','shinR','footR'];
 var BP={root:[null,0,0,0],hips:['root',0,.96,0],spine:['hips',0,1.1,0],chest:['spine',0,1.3,0],neck:['chest',0,1.5,0],head:['neck',0,1.6,0],
  uarmL:['chest',.195,1.44,0],farmL:['uarmL',.215,1.17,0],handL:['farmL',.225,.94,0],uarmR:['chest',-.195,1.44,0],farmR:['uarmR',-.215,1.17,0],handR:['farmR',-.225,.94,0],
  thighL:['hips',.1,.93,0],shinL:['thighL',.1,.51,0],footL:['shinL',.1,.09,0],thighR:['hips',-.1,.93,0],shinR:['thighR',-.1,.51,0],footR:['shinR',-.1,.09,0]};
 var BI={};BN.forEach(function(n,i){BI[n]=i});
 function mkBones(){var map={},arr=[];BN.forEach(function(n){var d=BP[n];var b=new T3.Bone();b.name=n;if(d[0]){var pp=BP[d[0]];b.position.set(d[1]-pp[1],d[2]-pp[2],d[3]-pp[3]);map[d[0]].add(b)}else b.position.set(d[1],d[2],d[3]);map[n]=b;arr.push(b)});return{map:map,arr:arr}}
 function GB(){this.pos=[];this.col=[];this.uv=[];this.si=[];this.sw=[];this.idx=[]}
 GB.prototype.v=function(x,y,z,c,w,u,v){this.pos.push(x,y,z);this.col.push(c.r,c.g,c.b);this.uv.push(u||0,v||0);var ks=Object.keys(w),a=[0,0,0,0],ww=[0,0,0,0],s=0;ks.slice(0,4).forEach(function(k,i){a[i]=BI[k];ww[i]=w[k];s+=w[k]});this.si.push(a[0],a[1],a[2],a[3]);this.sw.push(ww[0]/s,ww[1]/s,ww[2]/s,ww[3]/s);return this.pos.length/3-1};
 /* rura z pierścieni (od góry do dołu), domknięta czapeczkami */
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
 /* elipsoida z UV (twarz na u=0.25, czyli z przodu +z) */
 GB.prototype.ell=function(cx,cy,cz,rx,ry,rz,c,w,rows,N,tmax){rows=rows||10;N=N||14;tmax=tmax||Math.PI;var B=this,st=B.pos.length/3;
  for(var j=0;j<=rows;j++){var th=j/rows*tmax;for(var i=0;i<=N;i++){var a=i/N*Math.PI*2;B.v(cx+rx*Math.sin(th)*Math.cos(a),cy+ry*Math.cos(th),cz+rz*Math.sin(th)*Math.sin(a),c,w,i/N,1-th/Math.PI)}}
  for(j=0;j<rows;j++)for(i=0;i<N;i++){var a0=st+j*(N+1)+i,a1=a0+N+1;B.idx.push(a0,a0+1,a1,a0+1,a1+1,a1)}};
 function W1(b){var o={};o[b]=1;return o}
 function W2(a,b,k){var o={};o[a]=1-k;o[b]=k;return o}
 var gcache={};
 function bodyGeo(key,o){if(gcache[key])return gcache[key];var B=new GB();
  var sk=lin(o.skin),sh=lin(o.shirt),sp=lin(o.shorts),so=lin(o.sock),tr=lin(o.trim),bt=lin(o.boot),hc=lin(o.hair),gl=lin(o.glove||o.skin);
  function R(x,y,z,rx,rz,c,w,cap){return{x:x,y:y,z:z,rx:rx,rz:rz,c:c,w:w,cap:cap}}
  /* tułów */
  B.tube([R(0,1.54,0,.064,.06,tr,W2('chest','neck',.5),.01),R(0,1.525,0,.085,.07,tr,W1('chest')),R(0,1.515,0,.105,.08,sh,W1('chest')),R(0,1.485,0,.2,.105,sh,W1('chest')),R(0,1.445,-.004,.24,.122,sh,W1('chest')),R(0,1.4,-.002,.238,.127,sh,W1('chest')),R(0,1.34,.005,.22,.13,sh,W1('chest')),
   R(0,1.24,.008,.19,.122,sh,W2('spine','chest',.4)),R(0,1.13,.005,.17,.112,sh,W1('spine')),R(0,1.05,0,.165,.108,sh,W2('hips','spine',.5)),R(0,1.035,0,.168,.11,sp,W2('hips','spine',.3)),
   R(0,.97,-.005,.172,.115,sp,W1('hips')),R(0,.9,-.005,.15,.105,sp,W1('hips'),.03)],16);
  /* szyja */
  B.tube([R(0,1.66,.005,.05,.05,sk,W1('head')),R(0,1.6,.005,.054,.052,sk,W2('neck','head',.3)),R(0,1.52,0,.058,.056,sk,W1('neck'),.02)],10);
  /* nogi */
  [1,-1].forEach(function(s){var S=s>0?'L':'R';var th='thigh'+S,sn='shin'+S,ft='foot'+S;var x=s*.1;
   B.tube([R(x*.9,1.0,0,.1,.1,sp,W2('hips',th,.5),.02),R(x,.92,0,.108,.106,sp,W1(th)),R(x*1.03,.8,.006,.105,.103,sp,W1(th)),R(x*1.03,.79,.006,.096,.096,sk,W1(th)),
    R(x*1.01,.66,.008,.086,.088,sk,W1(th)),R(x,.53,.01,.066,.07,sk,W2(th,sn,.5)),R(x,.47,.004,.066,.07,so,W2(th,sn,.85)),R(x,.37,-.012,.072,.08,so,W1(sn)),R(x,.24,0,.05,.054,so,W1(sn)),R(x,.12,0,.042,.044,so,W2(sn,ft,.35),.02)],14);
   B.ell(x,.055,.045,.052,.05,.135,bt,W1(ft),6,12);
   B.ell(x,.1,0,.045,.04,.05,bt,W2(sn,ft,.6),4,10)});
  /* ręce: rękaw, przedramię, dłoń */
  [1,-1].forEach(function(s){var S=s>0?'L':'R';var ua='uarm'+S,fa='farm'+S,hd='hand'+S;var x=s*.215;var sl=o.gk?sh:sk;
   var gw=o.gk?1.25:1;
   B.tube([R(x*.86,1.47,0,.056,.054,sh,W2('chest',ua,.6),.02),R(x*.98,1.43,0,.068,.064,sh,W2('chest',ua,.85)),R(x*1.05,1.34,0,.064,.06,sh,W1(ua)),R(x*1.07,1.3,0,.062,.058,o.gk?sh:tr,W1(ua)),R(x*1.07,1.288,0,.053,.052,sl,W1(ua)),
    R(x*1.08,1.17,.005,.048,.047,sl,W2(ua,fa,.5)),R(x*1.1,1.06,.01,.045,.042,sl,W1(fa)),R(x*1.12,.975,.012,.032,.029,sl,W2(fa,hd,.3)),R(x*1.125,.94,.014,.036*gw,.024*gw,gl,W1(hd)),R(x*1.13,.89,.016,.04*gw,.022*gw,gl,W1(hd)),R(x*1.13,.845,.016,.03*gw,.018*gw,gl,W1(hd),.015)],14)});
  /* włosy i uszy (kolor), nos */
  if(o.hs!==0){var tm=o.hs===1?.95:o.hs===2?1.25:1.55;B.ell(0,1.725,-.012,.1,.128,.114,hc,W1('head'),7,18,tm)}
  [1,-1].forEach(function(s){B.ell(s*.093,1.71,-.002,.016,.03,.022,sk,W1('head'),4,8)});
  B.ell(0,1.7,.1,.011,.02,.014,sk,W1('head'),4,8);
  var n0=B.idx.length;
  /* głowa z twarzą (osobny materiał) */
  B.ell(0,1.715,.008,.093,.12,.105,new T3.Color(1,1,1),W1('head'),14,20);
  var g=new T3.BufferGeometry();g.setIndex(B.idx);g.setAttribute('position',new T3.Float32BufferAttribute(B.pos,3));g.setAttribute('color',new T3.Float32BufferAttribute(B.col,3));g.setAttribute('uv',new T3.Float32BufferAttribute(B.uv,2));
  g.setAttribute('skinIndex',new T3.Uint16BufferAttribute(B.si,4));g.setAttribute('skinWeight',new T3.Float32BufferAttribute(B.sw,4));g.computeVertexNormals();
  g.addGroup(0,n0,0);g.addGroup(n0,B.idx.length-n0,1);gcache[key]=g;return g}
 function faceTex2(skin,hair,eye,beard,hs){var c=cvs(512,256),x=c.getContext('2d');var sc='#'+skin.getHexString(),hcol='#'+hair.getHexString();
  x.fillStyle=sc;x.fillRect(0,0,512,256);
  /* cień na policzkach i pod brodą */
  var g=x.createLinearGradient(0,150,0,256);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(90,40,20,.25)');x.fillStyle=g;x.fillRect(0,150,512,106);
  /* włosy z tyłu i na górze (u 0.5-1.0 to tył głowy) */
  if(hs!==0){x.fillStyle=hcol;x.fillRect(0,0,512,hs===3?70:48);x.beginPath();x.ellipse(384,60,150,hs>=2?120:80,0,0,7);x.fill()}
  else{x.fillStyle='rgba(40,25,15,.35)';x.fillRect(0,0,512,40);x.beginPath();x.ellipse(384,50,140,70,0,0,7);x.fill()}
  var cx=128;
  /* brwi */
  x.strokeStyle=hcol;x.lineWidth=7;x.lineCap='round';x.beginPath();x.moveTo(cx-38,98);x.quadraticCurveTo(cx-24,90,cx-10,96);x.stroke();x.beginPath();x.moveTo(cx+10,96);x.quadraticCurveTo(cx+24,90,cx+38,98);x.stroke();
  /* oczy */
  [-1,1].forEach(function(s){var ex=cx+s*22,ey=113;x.fillStyle='rgba(90,50,30,.18)';x.beginPath();x.ellipse(ex,ey-3,14,8,0,0,7);x.fill();x.fillStyle='#f6f4ef';x.beginPath();x.ellipse(ex,ey,10,5.5,0,0,7);x.fill();x.fillStyle=eye;x.beginPath();x.arc(ex+s*.5,ey,4.8,0,7);x.fill();x.fillStyle='#111';x.beginPath();x.arc(ex+s*.5,ey,2.3,0,7);x.fill();x.fillStyle='#fff';x.fillRect(ex-1,ey-4,2,2);
   x.strokeStyle='rgba(40,20,10,.85)';x.lineWidth=2.5;x.beginPath();x.ellipse(ex,ey,10,5.5,0,Math.PI*1.05,Math.PI*1.95);x.stroke()});
  /* nos i usta */
  x.fillStyle='rgba(120,60,40,.25)';x.beginPath();x.ellipse(cx,146,10,5,0,0,7);x.fill();x.fillStyle='rgba(120,60,40,.18)';x.fillRect(cx-3,112,6,30);
  x.fillStyle='#b5645a';x.beginPath();x.ellipse(cx,172,17,5.5,0,0,7);x.fill();x.strokeStyle='rgba(80,20,20,.7)';x.lineWidth=2;x.beginPath();x.moveTo(cx-17,172);x.quadraticCurveTo(cx,175,cx+17,172);x.stroke();
  x.fillStyle='rgba(255,140,120,.12)';x.beginPath();x.arc(cx-40,150,14,0,7);x.fill();x.beginPath();x.arc(cx+40,150,14,0,7);x.fill();
  if(beard){x.fillStyle=hcol;x.globalAlpha=.5;x.beginPath();x.ellipse(cx,188,46,30,0,0,Math.PI);x.fill();x.fillRect(cx-50,150,12,40);x.fillRect(cx+38,150,12,40);x.globalAlpha=1}
  var t=new T3.CanvasTexture(c);t.encoding=T3.sRGBEncoding;t.anisotropy=4;return t}
 var bodyM=new T3.MeshStandardMaterial({vertexColors:true,roughness:.72,metalness:0});
 var numMats={};function numMat(n,col){var k=n+col;if(!numMats[k]){var cc=cvs(128,128),x=cc.getContext('2d');x.font='400 118px Anton,Impact,Arial';x.lineWidth=6;x.strokeStyle=col==='#ffffff'?'rgba(0,0,0,.35)':'rgba(255,255,255,.35)';x.textAlign='center';x.textBaseline='middle';x.strokeText(String(n),64,70);x.fillStyle=col;x.fillText(String(n),64,70);var tt=new T3.CanvasTexture(cc);tt.encoding=T3.sRGBEncoding;numMats[k]=new T3.MeshBasicMaterial({map:tt,transparent:true,depthWrite:false})}return numMats[k]}
 var numG=new T3.PlaneGeometry(.3,.3),blobG=new T3.PlaneGeometry(1.1,1.1);
 var men=[];var SC=1.1;
 function mkPlayer(d,i){var k=KIT[d.t],gk=d.slot==='GK';var g=new T3.Group();
  var pal=d.t==='P'?SKIN_PL:SKIN_W;var si=(i*5+(d.t==='O'?3:1))%pal.length,hi=(i*3+(d.t==='O'?2:0))%HAIR.length,bi=(i*2+(d.t==='O'?3:0))%BOOTS.length,hs=[1,1,2,0,1,3,2][(i*5+2)%7];
  var o={skin:pal[si],shirt:gk?k.gk:k.sh,shorts:gk?new T3.Color(0x161616):k.sp,sock:gk?new T3.Color(0x161616):k.so,trim:gk?new T3.Color(0x0b0b0b):k.tr,boot:BOOTS[bi],hair:HAIR[hi],hs:hs,gk:gk,glove:gk?0xf2f2f2:null};
  var key=d.t+(gk?'g':'')+'_'+si+'_'+hi+'_'+bi+'_'+hs;var geo=bodyGeo(key,o);
  var face=new T3.MeshStandardMaterial({map:faceTex2(new T3.Color(pal[si]),new T3.Color(HAIR[hi]),EYES[(i+si)%EYES.length],(i*7)%5===2,hs),roughness:.7});
  var mesh=new T3.SkinnedMesh(geo,[bodyM,face]);var bs=mkBones();mesh.add(bs.arr[0]);mesh.bind(new T3.Skeleton(bs.arr));mesh.castShadow=true;mesh.frustumCulled=false;
  var ncol=gk?'#ffffff':k.num;var nb=new T3.Mesh(numG,numMat(d.num||i%11+1,ncol));nb.position.set(0,.03,-.131);nb.rotation.y=Math.PI;bs.map.chest.add(nb);
  g.add(mesh);var blob=new T3.Mesh(blobG,blobM);blob.rotation.x=-Math.PI/2;blob.position.y=.015;g.add(blob);
  g.scale.setScalar(SC);scene.add(g);
  return {g:g,B:bs.map,nb:nb,ncol:ncol,num:d.num,ph:Math.random()*6,yaw:d.t==='P'?Math.PI/2:-Math.PI/2,lab:null,labName:null,lsp:0}}
 function label(m,d,show){if(!show||!d.name){if(m.lab)m.lab.visible=false;return}
  if(m.labName!==d.name){if(m.lab){scene.remove(m.lab);m.lab.material.map.dispose()}var sp=new T3.Sprite(new T3.SpriteMaterial({map:labelTex(T3,d.name,d.t==='P'?'rgba(220,20,60,.95)':'rgba(6,12,30,.9)',d.num),depthTest:false,sizeAttenuation:false}));var ls=tall?.16:.11;sp.scale.set(ls,ls*.22,1);sp.renderOrder=10;scene.add(sp);m.lab=sp;m.labName=d.name}
  m.lab.visible=true;m.lab.position.set(m.g.position.x,2.55*SC,m.g.position.z)}
 /* konfetti */
 var CN=mob?120:240,conf=new T3.InstancedMesh(new T3.PlaneGeometry(.22,.13),new T3.MeshBasicMaterial({side:T3.DoubleSide}),CN);conf.visible=false;scene.add(conf);
 var cp=[];var dummy=new T3.Object3D();
 function confetti(x,z,cols){cp=[];for(var i=0;i<CN;i++){cp.push({x:x+(Math.random()-.5)*14,y:6+Math.random()*10,z:z+(Math.random()-.5)*14,vy:-(1.6+Math.random()*2),vx:(Math.random()-.5)*2,r:Math.random()*6});conf.setColorAt(i,new T3.Color(cols[i%cols.length]))}conf.instanceColor.needsUpdate=true;conf.visible=true}
 /* nakładka DOM */
 var ov=document.createElement('div');ov.className='ss3-ov';ov.innerHTML='<div class="ss3-fade"></div><div class="ss3-flash"></div><div class="ss3-ban"><b></b><span></span></div><div class="ss3-big"></div><div class="ss3-card"><i></i><b></b><span>ŻÓŁTA KARTKA</span></div><div class="ss3-min"></div><button class="ss3-rep" data-a="skipRep">POWTÓRKA · pomiń ⏭</button>';wrap.appendChild(ov);
 var eFade=ov.querySelector('.ss3-fade'),eFlash=ov.querySelector('.ss3-flash'),eBan=ov.querySelector('.ss3-ban'),eBig=ov.querySelector('.ss3-big'),eRep=ov.querySelector('.ss3-rep');var eCard=ov.querySelector('.ss3-card'),eMin=ov.querySelector('.ss3-min');
 var shake=0,netK=0,netDir=1,lastBan=null,orb=0;
 function onResize(){var s2=size();renderer.setSize(s2[0],s2[1],false);cam.aspect=s2[0]/s2[1];tall=s2[1]>s2[0]*1.05;cam.fov=tall?52:30;cam.updateProjectionMatrix()}
 onResize();var ro=window.ResizeObserver?new ResizeObserver(onResize):null;if(ro)ro.observe(wrap);else window.addEventListener('resize',onResize);
 var R={ok:true},camPos=null,tmp=new T3.Vector3(),tmp2=new T3.Vector3(),lk=null;
 function ease(v){return v<0?0:v>1?1:v}
 R.frame=function(V,dt){dt=dt||0;
  if(!men.length)V.dots.forEach(function(d,i){men.push(mkPlayer(d,i))});
  var b=V.ball,bx=b.x-L/2,bz=b.y-W/2;
  V.dots.forEach(function(d,i){var m=men[i],B=m.B;if(d.tackle>(m.ltk||0)+.01)m.tk0=d.tackle;m.ltk=d.tackle||0;if(m.num!==d.num){m.num=d.num;m.nb.material=numMat(d.num,m.ncol)}var x=d.x-L/2,z=d.y-W/2;var sp=Math.hypot(d.vx,d.vy);m.lsp+=(sp-m.lsp)*Math.min(1,dt*8);sp=m.lsp;
   m.g.position.set(x,0,z);var faceBall=(d.slot==='GK'&&b.owner!==d)||(d.t!==V.poss&&sp<4.5&&!d.task);var ty=(sp>.8&&!faceBall)?Math.atan2(d.vx,d.vy):Math.atan2(bx-x,bz-z);var dy=ty-m.yaw;while(dy>Math.PI)dy-=6.283;while(dy<-Math.PI)dy+=6.283;if(!d.fall&&!d.slide)m.yaw+=dy*Math.min(1,dt*(sp>3?9:5));m.g.rotation.y=m.yaw;
   var amp=(d.fall||d.slide)?0:clamp(sp/7,0,1),spr=(d.fall||d.slide)?0:clamp((sp-5)/3,0,1);m.ph+=dt*(4+sp*1.3);var sw=Math.sin(m.ph),cw=Math.cos(m.ph);
   /* poza bazowa: bieg albo spokojne stanie */
   var A=.55+.35*spr;
   B.root.position.set(0,Math.abs(cw)*.05*amp-.025*amp,0);B.root.rotation.set(0,0,0);
   B.hips.rotation.set(0,-sw*.12*amp,0);B.spine.rotation.set(.1*amp+.04*spr,sw*.08*amp,0);B.chest.rotation.set(.04*amp,sw*.08*amp,0);B.neck.rotation.set(-.06*amp,0,0);B.head.rotation.set(-.05*amp,0,0);
   B.thighL.rotation.set(sw*A*amp-.04*amp,0,-.03);B.thighR.rotation.set(-sw*A*amp-.04*amp,0,.03);
   B.shinL.rotation.set(Math.max(0,-cw)*1.35*amp+.06,0,0);B.shinR.rotation.set(Math.max(0,cw)*1.35*amp+.06,0,0);
   B.footL.rotation.set(-.2*amp*Math.max(0,cw),0,0);B.footR.rotation.set(-.2*amp*Math.max(0,-cw),0,0);
   B.uarmL.rotation.set(-sw*.75*amp,0,.1+.06*amp);B.uarmR.rotation.set(sw*.75*amp,0,-.1-.06*amp);
   B.farmL.rotation.set(-.3-1.0*amp,0,0);B.farmR.rotation.set(-.3-1.0*amp,0,0);
   if(amp<.12){var br=Math.sin(m.ph*.45)*.02;B.spine.rotation.x=.03+br;B.uarmL.rotation.z=.14;B.uarmR.rotation.z=-.14;B.farmL.rotation.x=-.25;B.farmR.rotation.x=-.25;B.thighL.rotation.z=-.06;B.thighR.rotation.z=.06}
   /* kopnięcie prawą nogą */
   if(d.kick>0){var kt=1-d.kick/.38;B.thighR.rotation.x=kt<.45?.9*(kt/.45):.9-2.2*((kt-.45)/.55);B.shinR.rotation.x=kt<.5?1.3*(kt/.5):Math.max(.08,1.3-(kt-.5)*3.6);B.thighL.rotation.x=.05;B.shinL.rotation.x=.2;
    B.uarmL.rotation.z=.9;B.uarmR.rotation.z=-.7;B.uarmL.rotation.x=-.3;B.spine.rotation.set(-.08,.25,0)}
   if(d.head>0){var hk=clamp(1-d.head/.7,0,1);var air=Math.sin(hk*Math.PI);B.root.position.y=air*.62;var arch=hk<.5?-.45*(hk/.5):-.45+1.0*((hk-.5)/.5);B.spine.rotation.x=arch*.8;B.chest.rotation.x=arch*.5;B.neck.rotation.x=arch*.6;B.head.rotation.x=arch*.5;B.uarmL.rotation.set(-.6*air,0,.6+.8*air);B.uarmR.rotation.set(-.6*air,0,-.6-.8*air);B.farmL.rotation.x=-.9;B.farmR.rotation.x=-.9;B.thighL.rotation.x=-.5*air;B.thighR.rotation.x=-.2*air;B.shinL.rotation.x=1.1*air;B.shinR.rotation.x=1.3*air}
   /* wślizg albo wypad do odbioru */
   if(d.slide){var sk0=Math.min(1,((m.tk0||1.6)-d.tackle)/.3),sk=sk0*sk0*(3-2*sk0)*Math.min(1,d.tackle/.5),rs=-.95*sk;B.root.rotation.x=rs;var hy=lerp(.96,.32,sk);B.root.position.z=-.96*Math.sin(rs);B.root.position.y=hy-.96*Math.cos(rs);B.thighR.rotation.set(-.55*sk,0,0);B.shinR.rotation.x=.05;B.footR.rotation.x=-.4*sk;B.thighL.rotation.set(-.1*sk,0,-.15*sk);B.shinL.rotation.x=1.5*sk;B.spine.rotation.set(.55*sk,0,0);B.neck.rotation.x=.25*sk;B.uarmL.rotation.set(.9*sk,0,.35);B.farmL.rotation.x=-.1;B.uarmR.rotation.set(-.3,0,-.9*sk)}
   else if(d.tackle>0){var tq=Math.sin(clamp(1-d.tackle/(m.tk0||.5),0,1)*Math.PI);B.thighR.rotation.x=lerp(B.thighR.rotation.x,-.85,tq);B.shinR.rotation.x=lerp(B.shinR.rotation.x,.15,tq);B.thighL.rotation.x=lerp(B.thighL.rotation.x,.3,tq);B.shinL.rotation.x=lerp(B.shinL.rotation.x,.7,tq);B.spine.rotation.x=lerp(B.spine.rotation.x,.25,tq);B.root.position.y-=.1*tq;B.uarmL.rotation.z=lerp(B.uarmL.rotation.z,.5,tq);B.uarmR.rotation.z=lerp(B.uarmR.rotation.z,-.4,tq)}
   /* upadek po faulu */
   if(d.fall){var t1=Math.min(1,d.fall/.3),t2=clamp((d.fall-.2)/.55,0,1),rf=1.38*t2*t2*(3-2*t2);B.root.rotation.x=rf;var hy2=Math.max(.2,.96*Math.cos(rf)-.15*t1*(1-t2))+.08*Math.sin(t2*Math.PI);B.root.position.z=.3*t2-.96*Math.sin(rf);B.root.position.y=hy2-.96*Math.cos(rf);B.thighL.rotation.set(-.5*t1*(1-t2)+.05,0,-.08);B.shinL.rotation.x=.9*t1*(1-t2)+.15*t2;B.thighR.rotation.set(.35*t1,0,.08);B.shinR.rotation.x=.7*t1*(1-t2)+.5*t2;B.spine.rotation.set(-.15*t2,0,0);B.neck.rotation.x=-.5*t2;B.head.rotation.x=-.2*t2;B.uarmL.rotation.set(-.7*t1-.9*t2,0,.35);B.uarmR.rotation.set(-.7*t1-.9*t2,0,-.35);B.farmL.rotation.x=-.9*t2;B.farmR.rotation.x=-.9*t2}
   /* radość po golu */
   if(d.cele){var cs=i%3;if(cs===0){B.uarmL.rotation.set(0,0,2.75);B.uarmR.rotation.set(0,0,-2.75);B.root.position.y=Math.abs(Math.sin(m.ph*1.2))*.4}else if(cs===1){B.uarmL.rotation.set(0,0,1.45);B.uarmR.rotation.set(0,0,-1.45);B.spine.rotation.z=Math.sin(m.ph*.6)*.25}else{B.uarmL.rotation.set(-2.6,0,.3);B.uarmR.rotation.set(-2.6,0,-.3);B.root.position.y=Math.abs(Math.sin(m.ph))*.25}B.farmL.rotation.x=-.2;B.farmR.rotation.x=-.2}
   if(d.touch>0&&!d.kick){var tq=Math.sin((1-d.touch/.22)*Math.PI);B.thighR.rotation.x=-.5*tq;B.shinR.rotation.x=.25+.35*tq}
   if(d.slot==='GK'&&!d.dv&&!d.hold&&V.hl&&V.hl.stage==='shot'&&V.hl.gk===d){B.root.position.y=-.1;B.thighL.rotation.set(-.4,0,-.12);B.thighR.rotation.set(-.4,0,.12);B.shinL.rotation.x=.75;B.shinR.rotation.x=.75;B.spine.rotation.x=.35;B.uarmL.rotation.set(-.5,0,.55);B.uarmR.rotation.set(-.5,0,-.55);B.farmL.rotation.x=-.5;B.farmR.rotation.x=-.5}
   if(d.hold&&!d.dv){B.uarmL.rotation.set(-1.25,0,-.15);B.uarmR.rotation.set(-1.25,0,.15);B.farmL.rotation.x=-.6;B.farmR.rotation.x=-.6}
   /* bramkarz: parada */
   if(d.dv){var v=d.dv,fy=d.t==='P'?Math.PI/2:-Math.PI/2;m.yaw=fy;m.g.rotation.y=fy;m.lsp=0;var p1=clamp(v.t/.38,0,1),ep=1-(1-p1)*(1-p1),up=v.t>1.5?clamp((v.t-1.5)/.6,0,1):0;
    B.thighL.rotation.set(0,0,0);B.thighR.rotation.set(0,0,0);B.shinL.rotation.x=.1;B.shinR.rotation.x=.1;B.spine.rotation.set(0,0,0);B.hips.rotation.set(0,0,0);B.chest.rotation.set(0,0,0);
    if(v.stand){var cr=Math.min(1,v.t/.25)*(1-up);B.root.position.y=-.12*cr;B.thighL.rotation.x=-.5*cr;B.thighR.rotation.x=-.5*cr;B.shinL.rotation.x=.9*cr;B.shinR.rotation.x=.9*cr;B.spine.rotation.x=.35*cr;
     B.uarmL.rotation.set(-1.35*cr,0,-.1);B.uarmR.rotation.set(-1.35*cr,0,.1);B.farmL.rotation.x=-.5*cr;B.farmR.rotation.x=-.5*cr}
    else{var rl=(v.roll||1.3)*ep*(1-up)*v.s*(d.t==='P'?1:-1);B.root.rotation.z=rl;var dxs=rl>=0?-1:1,lat=.85*ep*(1-up),arc=(v.high?.55:.3)*Math.sin(Math.min(1,v.t/.5)*Math.PI)*(1-up),hipY=Math.max(.24,.96*Math.cos(rl))+arc;B.root.position.x=dxs*lat+.96*Math.sin(rl);B.root.position.y=hipY-.96*Math.cos(rl);
     var ar=2.95*Math.min(1,v.t/.2)*(1-up);B.uarmL.rotation.set(0,0,Math.max(.12,ar));B.uarmR.rotation.set(0,0,-Math.max(.12,ar));B.farmL.rotation.x=-.08;B.farmR.rotation.x=-.08;
     B.thighL.rotation.set(-.25*ep,0,-.2*ep);B.thighR.rotation.set(.2*ep,0,.15*ep);B.shinL.rotation.x=.5*ep;B.shinR.rotation.x=.25*ep;B.spine.rotation.set(-.1*ep,0,0);B.neck.rotation.x=-.2*ep}}
   label(m,d,V.focus.indexOf(d)>=0)});
  ball.position.set(bx,BR+b.z,bz);var bv=dt?Math.hypot(b.x-(R.lbx||b.x),b.y-(R.lby||b.y))/dt:0;if(bv>.01&&bv<60&&dt&&R.lbx!=null){var ang=Math.atan2(b.y-R.lby,b.x-R.lbx);ball.rotateOnWorldAxis(tmp.set(Math.sin(ang),0,-Math.cos(ang)).normalize(),-bv*dt/BR)}R.lbx=b.x;R.lby=b.y;
  bsh.position.set(bx,.012,bz);var hs=clamp(1-b.z/6,.3,1);bsh.scale.set(hs,hs,hs);bsh.material.opacity=.38*hs;
  /* gol: siatka, konfetti, wstrząs */
  var f=V.fx;if(f.banner&&f.banner!==lastBan){lastBan=f.banner;netK=1;netDir=f.banner.team==='P'?1:-1;shake=1;var cl=f.banner.team==='P'?[0xffffff,0xdc143c]:[oc1.getHex(),oc2.getHex()];confetti(netDir*(L/2-9),0,cl)}
  if(netK>0){netK=Math.max(0,netK-dt*.7);nets.forEach(function(n){if(n.dir===netDir)n.back.position.x=n.dir*(2+Math.sin(netK*16)*.45*netK)})}
  if(conf.visible){var alive=0;cp.forEach(function(p,i){p.y+=p.vy*dt;p.x+=p.vx*dt;p.r+=dt*5;if(p.y>0)alive++;dummy.position.set(p.x,Math.max(0,p.y),p.z);dummy.rotation.set(p.r,p.r*.7,0);dummy.updateMatrix();conf.setMatrixAt(i,dummy.matrix)});conf.instanceMatrix.needsUpdate=true;if(!alive)conf.visible=false}
  /* kamera: TV z boku (poziomo) albo zza bramki (pionowo) */
  var mode=V.camMode,H=V.hl,pos=tmp,tg=tmp2,sp2=2.2;var fbx=clamp(bx,-L/2+6,L/2-6);
  if(mode==='replay'){var dir=V.replay&&V.replay.tm==='O'?-1:1;if(tall)pos.set(bx-dir*8,3.4,bz*.75+2.5);else pos.set(bx-dir*4.5,2.3,Math.min(bz+9.5,W/2+2.5));tg.set(bx+dir*1.2,.9,bz);sp2=5}
  else if(mode==='celebrate'&&H&&H.shooter){var sm=men[V.dots.indexOf(H.shooter)];orb+=dt*.35;var cd=H.t==='O'?-1:1;pos.set(sm.g.position.x-cd*5+Math.sin(orb)*2.5,3.4,sm.g.position.z+(sm.g.position.z>0?-7.5:7.5));tg.set(sm.g.position.x,1.2,sm.g.position.z);sp2=4}
  else if(tall){var near=mode==='shot'||mode==='close';
   if(mode==='shot'){var d2=H&&H.t==='O'?-1:1;pos.set(d2*L/2-d2*20,8,bz*.4);tg.set(d2*L/2-d2*3,.6,bz*.2);sp2=5}
   else pos.set(fbx-(near?14:17),near?12:16,bz*.82),tg.set(fbx+(near?3:4),0,bz*.95);orb=0}
  else{if(mode==='shot'){var d3=H&&H.t==='O'?-1:1;pos.set(d3*L/2-d3*21,7.5,bz*.4+19);tg.set(d3*L/2-d3*6,.8,bz*.3);sp2=5}
   else if(mode==='close'){pos.set(fbx*.97-1.5,10,bz*.55+25);tg.set(fbx+1,0,bz*.85-.5)}
   else{pos.set(fbx*.95,13,bz*.5+31);tg.set(fbx,0,bz*.82-1)}orb=0}
  if(!camPos||!isFinite(camPos.x+camPos.y+camPos.z+lk.x+lk.y+lk.z)){camPos=pos.clone();lk=tg.clone()}
  var kk=Math.min(1,dt*sp2);if(V.fx.fade>.95||(R.lm!==mode&&(mode==='replay'||R.lm==='replay')))kk=1;R.lm=mode;camPos.lerp(pos,kk);lk.lerp(tg,kk);
  cam.position.copy(camPos);if(shake>0){shake=Math.max(0,shake-dt*1.1);cam.position.x+=(Math.random()-.5)*shake*.5;cam.position.y+=(Math.random()-.5)*shake*.35}cam.lookAt(lk);
  sun.position.set(lk.x-30,60,lk.z+40);sun.target.position.copy(lk);
  /* nakładki */
  eFade.style.opacity=V.fx.fade||0;eFlash.style.opacity=f.flash?f.flash*.5:0;
  if(f.banner){eBan.className='ss3-ban on '+(f.banner.team==='P'?'p':'o');eBan.querySelector('b').textContent=f.banner.team==='P'?'GOOOL!':'GOL RYWALA';eBan.querySelector('span').textContent=(f.banner.name||'')+'  '+f.banner.min+'\''}else eBan.className='ss3-ban';
  if(f.big){eBig.textContent=f.big.txt;eBig.className='ss3-big on'}else eBig.className='ss3-big';
  eRep.className='ss3-rep'+(f.replay?' on':'');
  if(f.card){eCard.className='ss3-card on';eCard.querySelector('b').textContent=f.card.name}else eCard.className='ss3-card';
  if(f.minute){eMin.className='ss3-min on';eMin.textContent=f.minute.end?(V.phase==='h1'?'Koniec 1. połowy':V.phase==='h2'?'Koniec meczu':'Koniec dogrywki'):f.minute.min+'\''}else eMin.className='ss3-min';
  renderer.render(scene,cam)};
 R.cam=cam;R.ball=ball;R.bsh=bsh;R.scene=scene;R.renderer=renderer;R.men=function(){return men};window.__ss3=R;
 R.dispose=function(){if(ro)ro.disconnect();else window.removeEventListener('resize',onResize);renderer.dispose();if(renderer.domElement.parentNode)renderer.domElement.parentNode.removeChild(renderer.domElement);if(ov.parentNode)ov.parentNode.removeChild(ov)};
 return R}
window.SS3D={create:create};
})();
