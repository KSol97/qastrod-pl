/* Menedżer klubu: herby klubów rysowane w SVG (własne, uproszczone interpretacje barw i motywów) */
(function(){
'use strict';
function lum(h){h=h.replace('#','');var r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16);return (.299*r+.587*g+.114*b)/255}
function contrast(bg,cols){var best=null,bd=-1;cols.concat(['#ffffff','#161616']).forEach(function(c){var d=Math.abs(lum(c)-lum(bg));if(d>bd+.12){bd=d;best=c}});return best}
function hash(s){var h=7;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h}
var SH={shield:'M10 7H90V54C90 81 71 97 50 105C29 97 10 81 10 54Z',kite:'M8 7H92L86 60C82 82 66 96 50 106C34 96 18 82 14 60Z'};
function motif(m,c,t){var g='';
 switch(m){
 case 'crown':g='<path d="M28 66V40L39 52L50 32L61 52L72 40V66Z" fill="'+c+'"/><rect x="27" y="68" width="46" height="7" rx="2" fill="'+c+'"/><circle cx="50" cy="30" r="4" fill="'+c+'"/><circle cx="27" cy="38" r="3.5" fill="'+c+'"/><circle cx="73" cy="38" r="3.5" fill="'+c+'"/>';break;
 case 'eagle':g='<path d="M50 30C55 30 58 34 57 39L63 37L60 42C68 40 78 33 84 26C82 40 74 52 62 56L66 64L58 61L56 76L50 70L44 76L42 61L34 64L38 56C26 52 18 40 16 26C22 33 32 40 40 42L37 37L43 39C42 34 45 30 50 30Z" fill="'+c+'"/>';break;
 case 'griffin':g='<path d="M40 82L44 64C34 62 28 54 30 44L38 50L36 40L44 46C44 36 50 28 60 28L70 24L66 32C72 36 72 44 66 48L72 54L62 54L58 64L64 82H56L52 70L48 82Z" fill="'+c+'"/><circle cx="60" cy="35" r="2.2" fill="#00000055"/>';break;
 case 'lion':g='<g fill="'+c+'"><circle cx="50" cy="52" r="20"/>'+[0,1,2,3,4,5,6,7,8,9,10,11].map(function(i){var a=i/12*6.283,x=50+Math.cos(a)*24,y=52+Math.sin(a)*24;return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="6"/>'}).join('')+'</g><circle cx="43" cy="49" r="2.6" fill="#00000066"/><circle cx="57" cy="49" r="2.6" fill="#00000066"/><path d="M45 60Q50 64 55 60" stroke="#00000066" stroke-width="2.4" fill="none"/>';break;
 case 'star':g='<path d="M50 26L57 45H77L61 57L67 76L50 64L33 76L39 57L23 45H43Z" fill="'+c+'"/>';break;
 case 'anchor':g='<g fill="none" stroke="'+c+'" stroke-width="6" stroke-linecap="round"><circle cx="50" cy="30" r="6"/><path d="M50 36V80M38 46H62M28 62C30 74 40 80 50 80C60 80 70 74 72 62"/></g>';break;
 case 'hammers':g='<g stroke="'+c+'" stroke-width="6" stroke-linecap="round"><path d="M32 78L66 40M68 78L34 40"/></g><g fill="'+c+'"><rect x="56" y="26" width="20" height="10" rx="2" transform="rotate(45 66 31)"/><rect x="24" y="26" width="20" height="10" rx="2" transform="rotate(-45 34 31)"/></g>';break;
 case 'ball':g='<circle cx="50" cy="54" r="22" fill="'+c+'"/><path d="M50 44L59 50L56 61H44L41 50Z" fill="#00000077"/><path d="M50 32V44M59 50L71 46M56 61L63 72M44 61L37 72M41 50L29 46" stroke="#00000055" stroke-width="2"/>';break;
 case 'mountains':g='<path d="M18 76L40 38L52 56L62 44L82 76Z" fill="'+c+'"/><path d="M40 38L46 48L40 46L35 47Z" fill="#ffffffcc"/>';break;
 case 'tree':g='<g fill="'+c+'"><path d="M50 22L66 46H58L72 64H28L42 46H34Z"/><rect x="46" y="64" width="8" height="14"/></g>';break;
 case 'flame':g='<path d="M50 22C58 36 70 44 68 62C66 76 58 82 50 82C42 82 34 76 32 64C31 54 38 48 42 40C44 50 48 52 50 52C52 44 46 34 50 22Z" fill="'+c+'"/>';break;
 case 'sword':g='<g fill="'+c+'"><path d="M47 24H53V66H47Z"/><path d="M50 18L54 26H46Z"/><rect x="34" y="64" width="32" height="6" rx="3"/><rect x="47" y="70" width="6" height="10"/><circle cx="50" cy="84" r="4"/></g>';break;
 case 'waves':g='<g fill="none" stroke="'+c+'" stroke-width="5" stroke-linecap="round"><path d="M22 64Q31 56 40 64T58 64T78 64"/><path d="M22 76Q31 68 40 76T58 76T78 76"/></g>';break;
 case 'wings':g='<path d="M50 50C40 40 26 36 14 38C22 44 26 48 30 52C24 52 20 54 16 58C28 60 40 58 50 56C60 58 72 60 84 58C80 54 76 52 70 52C74 48 78 44 86 38C74 36 60 40 50 50Z" fill="'+c+'"/>';break;
 case 'bird':g='<path d="M20 48C34 44 44 46 52 52L66 40C70 36 76 36 80 40L74 42L78 46L68 50C66 62 58 70 46 74L50 64C40 66 30 62 24 56L36 56C30 54 24 52 20 48Z" fill="'+c+'"/>';break;
 case 'sun':g='<circle cx="50" cy="56" r="13" fill="'+c+'"/><g stroke="'+c+'" stroke-width="4" stroke-linecap="round">'+[0,1,2,3,4,5,6,7].map(function(i){var a=i/8*6.283,x1=50+Math.cos(a)*19,y1=56+Math.sin(a)*19,x2=50+Math.cos(a)*27,y2=56+Math.sin(a)*27;return '<path d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+'L'+x2.toFixed(1)+' '+y2.toFixed(1)+'"/>'}).join('')+'</g>';break;
 }
 return g}
function letters(t,c,big){var fs=t.length>=3?28:t.length===2?36:46;if(!big)fs=Math.round(fs*.5);
 return '<text x="50" y="'+(big?62:30)+'" text-anchor="middle" dominant-baseline="middle" font-family="Anton,Impact,Arial Black,sans-serif" font-size="'+fs+'" fill="'+c+'" letter-spacing="1">'+t+'</text>'}
var cache={};
function svg(code,t){if(cache[code])return cache[code];
 var cr=t.cr,cols=cr.cols,c0=cols[0],c1=cols[1]||'#ffffff',c2=cols[2]||null,h=hash(code),id='k'+code;
 var round=cr.s==='round',path=SH[h%3===0?'kite':'shield'];
 var clip=round?'<circle cx="50" cy="55" r="44"/>':'<path d="'+path+'"/>';
 var body='<rect x="0" y="0" width="100" height="110" fill="'+c0+'"/>';
 var fill=c0;
 if(cr.st){for(var i=0;i<5;i++)body+='<rect x="'+(10+i*16)+'" y="0" width="8" height="110" fill="'+c1+'"/>';}
 else if(cr.s==='half'){body+='<rect x="50" y="0" width="50" height="110" fill="'+c1+'"/>';}
 else{var pat=h%4;
  if(pat===0)body+='<rect x="0" y="86" width="100" height="24" fill="'+c1+'"/>'+(c2?'<rect x="0" y="82" width="100" height="4" fill="'+c2+'"/>':'');
  else if(pat===1)body+='<path d="M0 110L100 70V110Z" fill="'+c1+'"/>'+(c2?'<path d="M0 104L100 64V70L0 110Z" fill="'+c2+'"/>':'');
  else if(pat===2)body+='<rect x="0" y="0" width="100" height="22" fill="'+c1+'"/>'+(c2?'<rect x="0" y="22" width="100" height="4" fill="'+c2+'"/>':'');
  else body+=(c2?'<rect x="0" y="0" width="16" height="110" fill="'+c2+'"/><rect x="84" y="0" width="16" height="110" fill="'+c2+'"/>':'<rect x="0" y="0" width="14" height="110" fill="'+c1+'"/><rect x="86" y="0" width="14" height="110" fill="'+c1+'"/>');}
 var mc=cr.st||cr.s==='half'?'#ffffff':contrast(fill,[c1].concat(c2?[c2]:[]));
 var fg='';
 if(cr.st||cr.s==='half'){fg='<circle cx="50" cy="56" r="25" fill="'+(lum(c0)>.5?c1:c0)+'" stroke="#ffffff" stroke-width="3"/>';mc='#ffffff'}
 if(cr.m==='letters')fg+=letters(cr.t||t.n.charAt(0),mc,1);
 else{fg+=motif(cr.m,mc);if(cr.t)fg+='';}
 var border=round?'<circle cx="50" cy="55" r="44" fill="none" stroke="'+(lum(c1)>.85&&lum(c0)>.85?'#13234a':c1)+'" stroke-width="5"/><circle cx="50" cy="55" r="47.5" fill="none" stroke="#0b1430" stroke-width="2"/>':
  '<path d="'+path+'" fill="none" stroke="'+(lum(c1)>.85&&lum(c0)>.85?'#13234a':c1)+'" stroke-width="5"/><path d="'+path+'" fill="none" stroke="#0b1430" stroke-width="1.5" transform="translate(-2.6 -2.4) scale(1.052)"/>';
 var s='<svg viewBox="-2 -2 104 112" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="'+id+'">'+clip+'</clipPath></defs><g clip-path="url(#'+id+')">'+body+fg+'</g>'+border+'</svg>';
 cache[code]=s;return s}
window.KMCREST=svg;
})();
