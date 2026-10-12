/* Zostań piłkarzem: sceny 3D (szatnia, Orlik, boisko treningowe) | qastrod.pl */
(function(){
'use strict';
function cvs(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c}
var OL=56,OW=30,GW=6,GH=2.2,BR=.11;
function make(T3,mob){
 function tex(c,rep){var t=new T3.CanvasTexture(c);t.encoding=T3.sRGBEncoding;t.anisotropy=8;if(rep){t.wrapS=t.wrapT=T3.RepeatWrapping}return t}
 function skyTex(top,mid,bot){var c=cvs(16,512),x=c.getContext('2d');var g=x.createLinearGradient(0,0,0,512);g.addColorStop(0,top);g.addColorStop(.55,mid);g.addColorStop(1,bot);x.fillStyle=g;x.fillRect(0,0,16,512);return tex(c)}
 function sky(scene,top,mid,bot){var m=new T3.Mesh(new T3.SphereGeometry(400,24,12),new T3.MeshBasicMaterial({map:skyTex(top,mid,bot),side:T3.BackSide,fog:false,depthWrite:false}));m.renderOrder=-1;scene.add(m);return m}
 function ballTex(){var c=cvs(512,256),x=c.getContext('2d');x.fillStyle='#f7f7f7';x.fillRect(0,0,512,256);
  function pent(cx,cy,r,col){x.fillStyle=col;x.beginPath();for(var k=0;k<5;k++){var a=k/5*6.283-1.57;x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}x.closePath();x.fill()}
  [[64,64],[192,128],[320,64],[448,128],[64,200],[320,200],[192,20],[448,20],[0,128],[512,128]].forEach(function(p,i){pent(p[0],p[1],26,i%3===1?'#16d97d':'#141414')});return tex(c)}
 var ballT=ballTex();
 function mkBall(scene){var b=new T3.Mesh(new T3.SphereGeometry(BR,24,16),new T3.MeshStandardMaterial({map:ballT,roughness:.45}));b.castShadow=true;scene.add(b);
  var sh=new T3.Mesh(new T3.CircleGeometry(.14,16),new T3.MeshBasicMaterial({color:0,transparent:true,opacity:.35,depthWrite:false}));sh.rotation.x=-Math.PI/2;scene.add(sh);
  var o={m:b,sh:sh,x:0,y:0,z:0,lx:0,lz:0,ly:0,set:function(x,y,z,dt){o.x=x;o.y=y;o.z=z;b.position.set(x,y+BR,z);sh.position.set(x,.013,z);var hs=Math.max(.3,1-y/5);sh.scale.setScalar(hs);sh.material.opacity=.35*hs;
   if(dt){var dx=x-o.lx,dz=z-o.lz,d=Math.hypot(dx,dz);if(d>1e-4&&d<5){var ax=new T3.Vector3(dz,0,-dx).normalize();b.rotateOnWorldAxis(ax,d/BR)}}o.lx=x;o.lz=z;o.ly=y}};
  return o}
 function lights(scene,warm){var h=new T3.HemisphereLight(warm?0xffe9d0:0xdde8ff,0x2d4a2a,.75);scene.add(h);
  var s=new T3.DirectionalLight(warm?0xffe2b8:0xffffff,warm?1.25:1.1);s.position.set(-20,40,25);s.castShadow=true;s.shadow.mapSize.set(mob?1024:2048,mob?1024:2048);var c=s.shadow.camera;c.left=-22;c.right=22;c.top=22;c.bottom=-22;c.near=1;c.far=120;s.shadow.bias=-.0006;scene.add(s);scene.add(s.target);return s}
 /* ---------- Orlik ---------- */
 function turfTex(){var S=mob?14:20,M=3,c=cvs((OL+2*M)*S,(OW+2*M)*S),x=c.getContext('2d');
  x.fillStyle='#2f8a3e';x.fillRect(0,0,c.width,c.height);
  for(var i=0;i<14;i++){x.fillStyle=i%2?'#349546':'#2e863c';x.fillRect(M*S+i*OL*S/14,M*S,OL*S/14+1,OW*S)}
  x.fillStyle='#a2402c';x.fillRect(0,0,c.width,M*S*.7);x.fillRect(0,c.height-M*S*.7,c.width,M*S*.7);x.fillRect(0,0,M*S*.7,c.height);x.fillRect(c.width-M*S*.7,0,M*S*.7,c.height);
  for(var n=0;n<26000;n++){x.fillStyle=Math.random()<.5?'rgba(0,0,0,.05)':'rgba(255,255,255,.04)';x.fillRect(Math.random()*c.width,Math.random()*c.height,2,2)}
  x.strokeStyle='rgba(255,255,255,.95)';x.lineWidth=S*.12;var o=M*S;function R(a,b,w,h){x.strokeRect(o+a*S,o+b*S,w*S,h*S)}
  R(0,0,OL,OW);x.beginPath();x.moveTo(o+OL/2*S,o);x.lineTo(o+OL/2*S,o+OW*S);x.stroke();x.beginPath();x.arc(o+OL/2*S,o+OW/2*S,4*S,0,7);x.stroke();
  R(0,OW/2-8,9,16);R(OL-9,OW/2-8,9,16);R(0,OW/2-4,3,8);R(OL-3,OW/2-4,3,8);
  x.fillStyle='#fff';[[7,1],[OL-7,1],[OL/2,1]].forEach(function(p){x.beginPath();x.arc(o+p[0]*S,o+OW/2*S,S*.2,0,7);x.fill()});
  return tex(c)}
 function windowsTex(seed){var c=cvs(256,512),x=c.getContext('2d');x.fillStyle=['#d9d2c3','#c9d3d8','#e2c9a8','#b9c4b0'][seed%4];x.fillRect(0,0,256,512);
  for(var r=0;r<11;r++)for(var k=0;k<6;k++){var on=Math.random()<.32;x.fillStyle=on?'#ffd98a':'#5a6b7d';x.fillRect(14+k*40,16+r*45,24,28);x.fillStyle='rgba(255,255,255,.25)';x.fillRect(14+k*40,16+r*45,24,3)}
  x.fillStyle='rgba(0,0,0,.08)';for(var b=0;b<6;b++)x.fillRect(0,b*90,256,6);return tex(c)}
 function goal(scene,dir,netMat,gw,gh,gx){var GW=gw||6,GH=gh||2.2;var g=new T3.Group(),wm=new T3.MeshStandardMaterial({color:0xffffff,roughness:.35});
  function post(x,y,z,h,rx){var m=new T3.Mesh(new T3.CylinderGeometry(.05,.05,h,12),wm);m.position.set(x,y,z);if(rx)m.rotation.x=rx;m.castShadow=true;g.add(m)}
  post(0,GH/2,-GW/2,GH);post(0,GH/2,GW/2,GH);post(0,GH,0,GW+.1,Math.PI/2);
  var dp=1.2;var back=new T3.Mesh(new T3.PlaneGeometry(GW,GH),netMat);back.position.set(dir*dp,GH/2,0);back.rotation.y=Math.PI/2;g.add(back);
  var top=new T3.Mesh(new T3.PlaneGeometry(dp,GW),netMat);top.rotation.x=Math.PI/2;top.position.set(dir*dp/2,GH,0);g.add(top);
  [-1,1].forEach(function(s){var sd=new T3.Mesh(new T3.PlaneGeometry(dp,GH),netMat);sd.position.set(dir*dp/2,GH/2,s*GW/2);g.add(sd)});
  g.position.set(dir*(gx||OL/2),0,0);scene.add(g);return {g:g,back:back,dir:dir}}
 function netTex(){var c=cvs(128,128),x=c.getContext('2d');x.strokeStyle='rgba(255,255,255,.9)';x.lineWidth=2;for(var i=0;i<=128;i+=16){x.beginPath();x.moveTo(i,0);x.lineTo(i,128);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(128,i);x.stroke()}var t=tex(c,1);t.repeat.set(6,3);return t}
 function fenceTex(){var c=cvs(64,64),x=c.getContext('2d');x.strokeStyle='rgba(40,90,60,.85)';x.lineWidth=2;x.beginPath();x.moveTo(0,0);x.lineTo(64,64);x.moveTo(64,0);x.lineTo(0,64);x.stroke();var t=tex(c,1);return t}
 function orlik(){var scene=new T3.Scene();scene.fog=new T3.Fog(0xf2b88a,70,240);sky(scene,'#3a6fb5','#f4b98a','#ffd9a8');var sun=lights(scene,true);
  var p=new T3.Mesh(new T3.PlaneGeometry(OL+6,OW+6),new T3.MeshStandardMaterial({map:turfTex(),roughness:.95}));p.rotation.x=-Math.PI/2;p.receiveShadow=true;scene.add(p);
  var gr=new T3.Mesh(new T3.PlaneGeometry(600,600),new T3.MeshLambertMaterial({color:0x5c7d3a}));gr.rotation.x=-Math.PI/2;gr.position.y=-.02;scene.add(gr);
  var nm=new T3.MeshBasicMaterial({map:netTex(),transparent:true,side:T3.DoubleSide,depthWrite:false});
  var goals=[goal(scene,1,nm),goal(scene,-1,nm)];
  /* płot */
  var ft=fenceTex();var fh=4,mx=OL/2+4,mz=OW/2+4;var fm=new T3.MeshBasicMaterial({map:ft,transparent:true,side:T3.DoubleSide,depthWrite:false});
  [[0,-mz,OL+8,0],[0,mz,OL+8,0],[-mx,0,OW+8,1],[mx,0,OW+8,1]].forEach(function(f){var t2=ft.clone();t2.needsUpdate=true;t2.repeat.set(f[2]/1.2,fh/1.2);var m=new T3.Mesh(new T3.PlaneGeometry(f[2],fh),new T3.MeshBasicMaterial({map:t2,transparent:true,side:T3.DoubleSide,depthWrite:false}));m.position.set(f[0],fh/2,f[1]);if(f[3])m.rotation.y=Math.PI/2;scene.add(m)});
  var pm=new T3.MeshStandardMaterial({color:0x2a5e3c,roughness:.6});for(var i=0;i<=16;i++){[[-mx+i*(2*mx/16),-mz],[-mx+i*(2*mx/16),mz]].forEach(function(q){var pl=new T3.Mesh(new T3.CylinderGeometry(.05,.05,fh,6),pm);pl.position.set(q[0],fh/2,q[1]);scene.add(pl)})}
  /* lampy */
  [[-mx,-mz],[mx,-mz],[-mx,mz],[mx,mz]].forEach(function(q){var pl=new T3.Mesh(new T3.CylinderGeometry(.12,.16,12,8),new T3.MeshStandardMaterial({color:0x8f9aa6}));pl.position.set(q[0],6,q[1]);scene.add(pl);var hd=new T3.Mesh(new T3.BoxGeometry(1.6,.8,.3),new T3.MeshBasicMaterial({color:0xfff6d8}));hd.position.set(q[0]*.97,12,q[1]*.97);hd.lookAt(0,0,0);scene.add(hd)});
  /* bloki i drzewa */
  for(var b=0;b<14;b++){var side=b%2?1:-1,w=14+Math.random()*10,h=14+Math.random()*16,d=10;var bx=-80+b*12+Math.random()*4,bz=side*(46+Math.random()*16);
   var bt=windowsTex(b);bt.repeat.set(Math.round(w/8),Math.round(h/9));bt.wrapS=bt.wrapT=T3.RepeatWrapping;var bl=new T3.Mesh(new T3.BoxGeometry(w,h,d),new T3.MeshLambertMaterial({map:bt}));bl.position.set(bx,h/2,bz);scene.add(bl)}
  [-1,1].forEach(function(s){for(var b2=0;b2<4;b2++){var bt2=windowsTex(b2+3);bt2.repeat.set(2,3);bt2.wrapS=bt2.wrapT=T3.RepeatWrapping;var bl2=new T3.Mesh(new T3.BoxGeometry(10,24+b2*3,18),new T3.MeshLambertMaterial({map:bt2}));bl2.position.set(s*(70+b2*4),12+b2*1.5,-40+b2*26);scene.add(bl2)}});
  var tm=new T3.MeshLambertMaterial({color:0x3f7a32}),trk=new T3.MeshLambertMaterial({color:0x6a4a2e});
  for(var t=0;t<38;t++){var a=t/38*Math.PI*2,r=40+Math.random()*10;var tx=Math.cos(a)*r*1.2,tz=Math.sin(a)*r*.75;if(Math.abs(tz)<OW/2+6&&Math.abs(tx)<OL/2+6)continue;
   var tr=new T3.Mesh(new T3.CylinderGeometry(.25,.35,2.4,6),trk);tr.position.set(tx,1.2,tz);scene.add(tr);var cr=new T3.Mesh(new T3.SphereGeometry(2+Math.random()*1.4,8,6),tm);cr.position.set(tx,3.6+Math.random(),tz);scene.add(cr)}
  /* ławka */
  var bm=new T3.MeshStandardMaterial({color:0x2563eb});var bench=new T3.Mesh(new T3.BoxGeometry(6,.5,.5),bm);bench.position.set(0,.6,-mz+1.2);scene.add(bench);
  var ball=mkBall(scene);
  return {scene:scene,sun:sun,goals:goals,ball:ball,GX:OL/2,L:OL,W:OW,GW:6,GH:2.2,kind:'orlik'}}
 /* ---------- stadion (akademia i seniorzy) ---------- */
 var SL=105,SW=68;
 function grassTex(){var S=mob?8:11,M=4,c=cvs((SL+2*M)*S,(SW+2*M)*S),x=c.getContext('2d');x.fillStyle='#1d6e33';x.fillRect(0,0,c.width,c.height);
  for(var i=0;i<18;i++){x.fillStyle=i%2?'#237a3b':'#1f7136';x.fillRect(M*S+i*SL*S/18,0,SL*S/18+1,c.height)}
  for(var n=0;n<16000;n++){x.fillStyle=Math.random()<.5?'rgba(0,0,0,.05)':'rgba(255,255,255,.035)';x.fillRect(Math.random()*c.width,Math.random()*c.height,2,2)}
  x.strokeStyle='rgba(255,255,255,.95)';x.lineWidth=S*.14;var o=M*S;function R(a,b,w,h){x.strokeRect(o+a*S,o+b*S,w*S,h*S)}
  R(0,0,SL,SW);x.beginPath();x.moveTo(o+SL/2*S,o);x.lineTo(o+SL/2*S,o+SW*S);x.stroke();x.beginPath();x.arc(o+SL/2*S,o+SW/2*S,9.15*S,0,7);x.stroke();
  R(0,SW/2-20.16,16.5,40.32);R(SL-16.5,SW/2-20.16,16.5,40.32);R(0,SW/2-9.16,5.5,18.32);R(SL-5.5,SW/2-9.16,5.5,18.32);
  [[11,1],[SL-11,-1]].forEach(function(p){x.beginPath();x.arc(o+p[0]*S,o+SW/2*S,9.15*S,p[1]>0?-0.93:Math.PI-0.93,p[1]>0?0.93:Math.PI+0.93);x.stroke();x.fillStyle='#fff';x.beginPath();x.arc(o+p[0]*S,o+SW/2*S,S*.25,0,7);x.fill()});
  x.fillStyle='#fff';x.beginPath();x.arc(o+SL/2*S,o+SW/2*S,S*.3,0,7);x.fill();
  [[0,0,0],[SL,0,.5],[0,SW,1.5],[SL,SW,1]].forEach(function(p){x.beginPath();x.arc(o+p[0]*S,o+p[1]*S,S,p[2]*Math.PI,(p[2]+.5)*Math.PI);x.stroke()});
  return tex(c)}
 function crowdCanvas(cols,fill){var c=cvs(1024,512),x=c.getContext('2d');x.fillStyle='#141c33';x.fillRect(0,0,1024,512);
  for(var r=0;r<32;r++){x.fillStyle=r%2?'#1b2440':'#172038';x.fillRect(0,r*16,1024,16);for(var i=0;i<150;i++){if(Math.random()>fill)continue;var px=i*6.8+Math.random()*2,py=r*16+4+Math.random()*2;
   x.fillStyle=Math.random()<.78?cols[Math.floor(Math.random()*cols.length)]:['#2a2a2a','#555','#ddd','#8d5524'][Math.floor(Math.random()*4)];x.fillRect(px,py,5,8);
   x.fillStyle=['#f1c27d','#e0ac69','#c68642','#ffdbac','#8d5524'][Math.floor(Math.random()*5)];x.beginPath();x.arc(px+2.5,py-1.5,2.2,0,7);x.fill()}}return c}
 function adCanvas(){var c=cvs(1024,64),x=c.getContext('2d');var g=x.createLinearGradient(0,0,1024,0);g.addColorStop(0,'#0b1a4a');g.addColorStop(1,'#1a0b4a');x.fillStyle=g;x.fillRect(0,0,1024,64);
  x.font='900 42px Anton,Impact,Arial';x.textBaseline='middle';for(var i=0;i<4;i++){x.fillStyle=i%2?'#16d97d':'#ffffff';x.fillText(i%2?'GRAJ ZA DARMO':'QASTROD.PL',24+i*256,34)}return c}
 function stadium(){var scene=new T3.Scene();scene.fog=new T3.Fog(0x0b1430,120,320);sky(scene,'#06102a','#16244d','#2a3c6e');
  var h=new T3.HemisphereLight(0xdde8ff,0x2d4a2a,.8);scene.add(h);var s=new T3.DirectionalLight(0xffffff,1.05);s.position.set(-30,60,30);s.castShadow=true;s.shadow.mapSize.set(mob?1024:2048,mob?1024:2048);var sc=s.shadow.camera;sc.left=-60;sc.right=60;sc.top=40;sc.bottom=-40;sc.far=160;s.shadow.bias=-.0006;scene.add(s);scene.add(s.target);
  var p=new T3.Mesh(new T3.PlaneGeometry(SL+8,SW+8),new T3.MeshStandardMaterial({map:grassTex(),roughness:.95}));p.rotation.x=-Math.PI/2;p.receiveShadow=true;scene.add(p);
  var ring=new T3.Mesh(new T3.PlaneGeometry(SL+40,SW+40),new T3.MeshLambertMaterial({color:0x1a5c2c}));ring.rotation.x=-Math.PI/2;ring.position.y=-.02;scene.add(ring);
  var nm=new T3.MeshBasicMaterial({map:netTex(),transparent:true,side:T3.DoubleSide,depthWrite:false});
  var goals=[goal(scene,1,nm,7.32,2.44,SL/2),goal(scene,-1,nm,7.32,2.44,SL/2)];
  /* reklamy */
  var at=tex(adCanvas(),1);[[0,-SW/2-3,SL+6,0],[0,SW/2+3,SL+6,0],[-SL/2-4,0,SW,1],[SL/2+4,0,SW,1]].forEach(function(f){var t2=at.clone();t2.needsUpdate=true;t2.repeat.set(f[2]/22,1);var m=new T3.Mesh(new T3.PlaneGeometry(f[2],1),new T3.MeshBasicMaterial({map:t2}));m.position.set(f[0],.5,f[1]);if(f[3])m.rotation.y=f[0]<0?Math.PI/2:-Math.PI/2;else if(f[1]>0)m.rotation.y=Math.PI;scene.add(m)});
  /* trybuny: wysokość zależy od poziomu, kolor kibiców od klubu */
  var ctex=tex(crowdCanvas(['#ffffff'],1),1);var cmat=new T3.MeshLambertMaterial({map:ctex});var stands=[];
  function stand(w,x,z,ry){var g=new T3.Group();var m=new T3.Mesh(new T3.PlaneGeometry(w,30),cmat);m.position.y=8;m.rotation.x=-.62;g.add(m);var roof=new T3.Mesh(new T3.BoxGeometry(w,.6,10),new T3.MeshStandardMaterial({color:0x1b2440}));roof.position.set(0,20,-6);g.add(roof);g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);stands.push(g);return g}
  stand(SL+20,0,-SW/2-16,0);stand(SL+20,0,SW/2+16,Math.PI);stand(SW+10,-SL/2-17,0,Math.PI/2);stand(SW+10,SL/2+17,0,-Math.PI/2);
  ctex.repeat.set(6,1.6);
  /* maszty */
  [[-SL/2-20,-SW/2-20],[SL/2+20,-SW/2-20],[-SL/2-20,SW/2+20],[SL/2+20,SW/2+20]].forEach(function(q){var pl=new T3.Mesh(new T3.CylinderGeometry(.5,.7,40,8),new T3.MeshStandardMaterial({color:0x8f9aa6}));pl.position.set(q[0],20,q[1]);scene.add(pl);var hd=new T3.Mesh(new T3.BoxGeometry(6,3,.6),new T3.MeshBasicMaterial({color:0xfff6d8}));hd.position.set(q[0],40,q[1]);hd.lookAt(0,0,0);scene.add(hd)});
  var ball=mkBall(scene);
  var O={scene:scene,sun:s,goals:goals,ball:ball,GX:SL/2,L:SL,W:SW,GW:7.32,GH:2.44,kind:'stadium'};
  O.setCrowd=function(cols,size){var cv=crowdCanvas(cols,clamp01(.2+size*.8));ctex.image=cv;ctex.needsUpdate=true;stands.forEach(function(g){g.scale.y=.45+.55*size;g.visible=size>0})};
  return O}
 function clamp01(v){return v<0?0:v>1?1:v}
 /* ---------- boisko treningowe (slalom): nieskończony pas ---------- */
 function stripeTex(){var c=cvs(256,256),x=c.getContext('2d');x.fillStyle='#2f8a3e';x.fillRect(0,0,256,256);x.fillStyle='#37964a';x.fillRect(0,0,128,256);for(var n=0;n<4000;n++){x.fillStyle=Math.random()<.5?'rgba(0,0,0,.05)':'rgba(255,255,255,.04)';x.fillRect(Math.random()*256,Math.random()*256,2,2)}
  x.fillStyle='rgba(255,255,255,.9)';x.fillRect(0,0,256,3);var t=tex(c,1);return t}
 function track(){var scene=new T3.Scene();scene.fog=new T3.Fog(0xcfe3f5,30,110);sky(scene,'#2f6fd6','#9cc6f0','#e3f0fb');var sun=lights(scene,false);
  var st=stripeTex();st.repeat.set(40,4);var p=new T3.Mesh(new T3.PlaneGeometry(240,24),new T3.MeshStandardMaterial({map:st,roughness:.95}));p.rotation.x=-Math.PI/2;p.receiveShadow=true;scene.add(p);
  var gr=new T3.Mesh(new T3.PlaneGeometry(600,600),new T3.MeshLambertMaterial({color:0x4f7d3a}));gr.rotation.x=-Math.PI/2;gr.position.y=-.02;scene.add(gr);
  var tm=new T3.MeshLambertMaterial({color:0x3a7230});var trees=[];for(var t=0;t<40;t++){var tr=new T3.Mesh(new T3.ConeGeometry(1.6,5,7),tm);tr.position.set(t*6,2.5,(t%2?1:-1)*(16+Math.random()*8));scene.add(tr);trees.push(tr)}
  var ball=mkBall(scene);
  return {scene:scene,sun:sun,plane:p,tex:st,trees:trees,ball:ball}}
 /* ---------- szatnia ---------- */
 function room(){var scene=new T3.Scene();scene.background=new T3.Color(0x0b1430);
  var h=new T3.HemisphereLight(0xbfd4ff,0x7a6a5a,.8);var fr=new T3.DirectionalLight(0xfff1e0,.55);fr.position.set(0,1.4,6);scene.add(fr);scene.add(h);
  var sp=new T3.SpotLight(0xffffff,1.6,30,.55,.5,1);sp.position.set(2,7,6);sp.castShadow=true;sp.shadow.mapSize.set(1024,1024);scene.add(sp);sp.target.position.set(0,1,0);scene.add(sp.target);
  var rim=new T3.DirectionalLight(0x6aa8ff,.8);rim.position.set(-4,3,-5);scene.add(rim);
  var fl=new T3.Mesh(new T3.CircleGeometry(14,48),new T3.MeshStandardMaterial({color:0x1c2747,roughness:.85}));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;scene.add(fl);
  var ring=new T3.Mesh(new T3.RingGeometry(1.05,1.18,64),new T3.MeshBasicMaterial({color:0x16d97d}));ring.rotation.x=-Math.PI/2;ring.position.y=.01;scene.add(ring);
  var disc=new T3.Mesh(new T3.CircleGeometry(1.05,48),new T3.MeshStandardMaterial({color:0x26345e,roughness:.6}));disc.rotation.x=-Math.PI/2;disc.position.y=.008;disc.receiveShadow=true;scene.add(disc);
  /* szafki */
  var lm=new T3.MeshStandardMaterial({color:0x1d3a8a,roughness:.5,metalness:.2}),dm=new T3.MeshStandardMaterial({color:0x14275e,roughness:.5});
  for(var i=-5;i<=5;i++){var a=i*.16;var lk=new T3.Group();var bx=new T3.Mesh(new T3.BoxGeometry(.9,2.4,.6),lm);bx.position.y=1.2;lk.add(bx);var vent=new T3.Mesh(new T3.BoxGeometry(.5,.12,.02),dm);vent.position.set(0,2.0,.31);lk.add(vent);var vent2=vent.clone();vent2.position.y=1.85;lk.add(vent2);
   lk.position.set(Math.sin(a)*6,0,-Math.cos(a)*6);lk.rotation.y=-a;scene.add(lk)}
  var ben=new T3.Mesh(new T3.BoxGeometry(5,.4,.5),new T3.MeshStandardMaterial({color:0x8b5a2b}));ben.position.set(0,.45,-4.6);scene.add(ben);
  return {scene:scene}}
 return {orlik:orlik,stadium:stadium,track:track,room:room,mkBall:mkBall,OL:OL,OW:OW,GW:GW,GH:GH,BR:BR}
}
window.KPWorld={make:make,GW:GW,GH:GH,BR:BR,OL:OL,OW:OW};
})();
