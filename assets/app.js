/* Qastrod.pl — logika strony */
(function(){
  "use strict";
  var D = window.QD || {songs:[],shorts:[]};

  var CATNAMES = {
    "rap-battle":"Rap Battle","hymny":"Hymny klubowe","mundial":"Mundial 2026",
    "polska":"Polska","kluby":"Kluby","legendy":"Legendy","gwiazdy":"Gwiazdy",
    "swieta":"Okazjonalne","nostalgia":"Nostalgia"
  };

  function fmt(n){
    if(n>=1000000) return (n/1000000).toFixed(n>=10000000?0:1).replace(".",",")+" mln";
    if(n>=1000) return Math.round(n/1000)+" tys.";
    return String(n);
  }
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function slug(s){
    return s.toLowerCase()
      .replace(/ą/g,"a").replace(/ć/g,"c").replace(/ę/g,"e").replace(/ł/g,"l")
      .replace(/ń/g,"n").replace(/ó/g,"o").replace(/ś/g,"s").replace(/[żź]/g,"z")
      .normalize("NFD").replace(/[̀-ͯ]/g,"")
      .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70);
  }
  window.qdSlug = slug;

  /* ---------- karta wideo ---------- */
  function card(s, opts){
    opts = opts || {};
    var url = "https://www.youtube.com/watch?v=" + s.i;
    var num = opts.rank ? '<span class="shirt'+(opts.rank<=3?" top":"")+'">'+opts.rank+'</span>' : "";
    var isNew = (typeof s.o === "number" && s.o < 12);
    var flag = isNew ? '<span class="flag">Nowość</span>' : "";
    var tag = (s.c && s.c[0]) ? '<span class="tag">'+esc(CATNAMES[s.c[0]]||s.c[0])+'</span>' : "";
    return '<article class="card">'
      + '<button class="thumb'+(opts.vert?" vert":"")+'" data-yt="'+s.i+'" aria-label="Odtwórz: '+esc(s.t)+'">'
      + num + flag
      + '<img loading="lazy" src="https://i.ytimg.com/vi/'+s.i+'/hqdefault.jpg" alt="'+esc(s.t)+'" width="480" height="360">'
      + '<span class="play"><i></i></span></button>'
      + '<div class="card-b"><h3 class="card-t"><a href="'+url+'" rel="noopener" target="_blank">'+esc(s.t)+'</a></h3>'
      + '<div class="meta">'+tag+'<span class="views">'+fmt(s.v)+'</span></div></div></article>';
  }
  window.qdCard = card;

  /* ---------- lazy embed ---------- */
  document.addEventListener("click", function(e){
    var b = e.target.closest ? e.target.closest(".thumb[data-yt]") : null;
    if(!b) return;
    var id = b.getAttribute("data-yt");
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/"+id+"?autoplay=1&rel=0";
    f.title = b.getAttribute("aria-label") || "Odtwarzacz YouTube";
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    f.allowFullscreen = true;
    b.innerHTML = "";
    b.appendChild(f);
    b.removeAttribute("data-yt");
  });

  /* ---------- menu ---------- */
  var burger = document.querySelector(".burger");
  if(burger) burger.addEventListener("click", function(){
    var ul = document.querySelector(".nav ul");
    ul.classList.toggle("open");
    burger.setAttribute("aria-expanded", ul.classList.contains("open"));
  });

  /* ---------- katalog ---------- */
  var cat = document.getElementById("catalog");
  if(cat){
    var base = cat.dataset.cat ? D.songs.filter(function(s){return s.c.indexOf(cat.dataset.cat)>-1;})
             : cat.dataset.ent ? D.songs.filter(function(s){return s.e.indexOf(cat.dataset.ent)>-1;})
             : D.songs.slice();
    var q = document.getElementById("q"),
        sortSel = document.getElementById("sort"),
        chips = Array.prototype.slice.call(document.querySelectorAll(".chip[data-f]")),
        out = document.getElementById("results"),
        cnt = document.getElementById("count"),
        more = document.getElementById("more");
    var active = "", shown = 24;

    function filtered(){
      var text = (q && q.value || "").trim().toLowerCase();
      var list = base.filter(function(s){
        if(active && s.c.indexOf(active) < 0) return false;
        if(text && s.t.toLowerCase().indexOf(text) < 0) return false;
        return true;
      });
      var sv = sortSel ? sortSel.value : "pop";
      if(sv === "new") list = list.slice().sort(function(a,b){return a.o-b.o;});
      else if(sv === "az") list = list.slice().sort(function(a,b){return a.t.localeCompare(b.t,"pl");});
      else list = list.slice().sort(function(a,b){return b.v-a.v;});
      return list;
    }
    function render(){
      var list = filtered();
      out.innerHTML = list.slice(0, shown).map(function(s){return card(s);}).join("") ||
        '<p class="count">Nic nie znaleziono. Spróbuj innego słowa, np. „Messi”, „hymn”, „Legia”.</p>';
      if(cnt) cnt.innerHTML = '<b>' + list.length + '</b> ' + (list.length===1?'piosenka':(list.length%10>1&&list.length%10<5&&(list.length<10||list.length>20)?'piosenki':'piosenek'));
      if(more) more.style.display = list.length > shown ? "inline-flex" : "none";
    }
    try{
      var urlq = new URLSearchParams(location.search).get("q");
      if(urlq && q){ q.value = urlq; }
    }catch(err){}
    if(q) q.addEventListener("input", function(){shown=24;render();});
    if(sortSel) sortSel.addEventListener("change", function(){shown=24;render();});
    chips.forEach(function(c){
      c.addEventListener("click", function(){
        var f = c.dataset.f;
        active = (active === f) ? "" : f;
        chips.forEach(function(x){x.setAttribute("aria-pressed", x.dataset.f===active);});
        shown = 24; render();
      });
    });
    if(more) more.addEventListener("click", function(){shown += 24; render();});
    render();
  }

  /* ---------- listy na stronie głównej ---------- */
  document.querySelectorAll("[data-list]").forEach(function(el){
    var kind = el.dataset.list, n = parseInt(el.dataset.n||"8",10);
    var list = [];
    if(kind === "top") list = D.songs.slice(0,n);
    else if(kind === "new") list = D.songs.slice().sort(function(a,b){return a.o-b.o;}).slice(0,n);
    else if(kind === "shorts") list = D.shorts.slice(0,n);
    else list = D.songs.filter(function(s){return s.c.indexOf(kind)>-1;}).slice(0,n);
    el.innerHTML = list.map(function(s,i){
      return card(s, {vert: kind==="shorts", rank: el.dataset.rank ? i+1 : 0});
    }).join("");
  });

  /* ---------- QUIZ ---------- */
  var quiz = document.getElementById("quiz");
  if(quiz){
    var QS = [
      {q:"Jaki masz dziś nastrój?", a:[
        {t:"Nostalgia za dawnym futbolem", d:"Stare czasy, wielkie emocje", w:{nostalgia:3, legendy:2}},
        {t:"Potrzebuję motywacji", d:"Coś, co podnosi z kanapy", w:{polska:2, gwiazdy:2, mundial:1}},
        {t:"Chcę się pośmiać", d:"Luz, dystans, beka", w:{"rap-battle":3, swieta:1}},
        {t:"Duma i biało-czerwone", d:"Polska, Ekstraklasa, nasi", w:{polska:3, mundial:1}}
      ]},
      {q:"Kogo chcesz teraz posłuchać?", a:[
        {t:"Legendy futbolu", d:"Pelé, Maradona, Cruyff, Zidane", w:{legendy:3, nostalgia:1}},
        {t:"Gwiazdy dzisiejszej piłki", d:"Messi, Ronaldo, Mbappé, Yamal", w:{gwiazdy:3}},
        {t:"Mój klub", d:"Barca, Real, United, Legia...", w:{kluby:3, hymny:2}},
        {t:"Reprezentacja Polski", d:"Lewy, Szczęsny, Grosik", w:{polska:3}}
      ]},
      {q:"Jaki format wchodzi najlepiej?", a:[
        {t:"Klasyczna piosenka z historią", d:"Zwrotki, refren, emocje", w:{legendy:1, gwiazdy:1, polska:1}},
        {t:"Rap battle", d:"Dwóch zawodników, jedna mikrofonowa wojna", w:{"rap-battle":4}},
        {t:"Hymn do śpiewania", d:"Chóralnie, na cały głos", w:{hymny:4, kluby:1}},
        {t:"Coś mundialowego", d:"Klimat wielkiego turnieju", w:{mundial:4}}
      ]},
      {q:"Czego szukasz?", a:[
        {t:"Największych hitów kanału", d:"To, co pokochały setki tysięcy ludzi", w:{}, boost:"pop"},
        {t:"Czegoś świeżego", d:"Nowe kawałki z ostatnich miesięcy", w:{}, boost:"new"},
        {t:"Ukrytej perełki", d:"Mniej znane, a świetne", w:{}, boost:"deep"},
        {t:"Totalnej losowości", d:"Zaskocz mnie", w:{}, boost:"rnd"}
      ]}
    ];
    var step = 0, score = {}, boost = "pop";
    var elClock = quiz.querySelector(".qclock"),
        elQ = quiz.querySelector(".qq"),
        elA = quiz.querySelector(".answers"),
        elSegs = quiz.querySelectorAll(".qseg"),
        elBody = quiz.querySelector(".qbody"),
        elRes = quiz.querySelector(".result");

    function segs(){
      for(var i=0;i<elSegs.length;i++){
        elSegs[i].className = "qseg" + (i < step ? " done" : (i === step ? " on" : ""));
      }
    }
    function draw(){
      var Q = QS[step];
      if(elClock) elClock.textContent = (step+1) + " / " + QS.length;
      elQ.textContent = Q.q;
      segs();
      elA.innerHTML = Q.a.map(function(a,i){
        return '<button class="ans" data-i="'+i+'"><b>'+"ABCD"[i]+'</b><span>'+esc(a.t)+'<em>'+esc(a.d)+'</em></span></button>';
      }).join("");
    }
    elA && elA.addEventListener("click", function(e){
      var b = e.target.closest(".ans"); if(!b) return;
      var a = QS[step].a[+b.dataset.i];
      for(var k in a.w) score[k] = (score[k]||0) + a.w[k];
      if(a.boost) boost = a.boost;
      step++;
      if(step < QS.length) draw(); else finish();
    });
    function finish(){
      step = QS.length; segs();
      if(elClock) elClock.textContent = "KONIEC";
      var pool = D.songs.map(function(s){
        var sc = 0;
        s.c.forEach(function(c){ sc += (score[c]||0); });
        if(boost === "pop") sc += Math.min(6, s.v/120000);
        if(boost === "new") sc += Math.max(0, 6 - s.o/12);
        if(boost === "deep") sc += s.v < 20000 ? 4 : 0;
        if(boost === "rnd") sc += Math.random()*7;
        return {s:s, sc:sc + Math.random()*1.2};
      }).sort(function(a,b){return b.sc-a.sc;});
      var pick = pool[0].s, alts = pool.slice(1,4).map(function(x){return x.s;});
      elBody.style.display = "none";
      elRes.classList.add("on");
      elRes.innerHTML =
          '<div class="whistle"><div class="gol">Gol!</div><p>Twoja piosenka na teraz</p></div>'
        + '<div class="pick"><div>' + card(pick) + '</div>'
        + '<div class="pcard"><h3>' + esc(pick.t) + '</h3>'
        + '<ul class="pstats">'
        + '<li><span class="k">Kategoria</span><span class="v">' + esc(CATNAMES[pick.c[0]] || pick.c[0]) + '</span></li>'
        + '<li><span class="k">Wyświetlenia</span><span class="v hot">' + fmt(pick.v) + '</span></li>'
        + '<li><span class="k">Miejsce w rankingu</span><span class="v">#' + pick.r + ' z ' + D.songs.length + '</span></li>'
        + '<li><span class="k">Status</span><span class="v">' + (pick.o < 12 ? "Świeżynka" : (pick.r <= 30 ? "Klasyk kanału" : "Perełka")) + '</span></li>'
        + '</ul>'
        + '<div class="cta-row" style="margin-top:auto">'
        + '<button class="btn green" id="requiz">Losuj ponownie</button>'
        + '<a class="btn ghost" href="/piosenki-pilkarskie">Cały katalog</a></div></div></div>'
        + '<div class="bench"><h4>Ławka rezerwowych</h4><p>Gdyby pierwszy wybór nie trafił.</p>'
        + '<div class="grid g3">' + alts.map(function(s){return card(s);}).join("") + '</div></div>';
      try{ elRes.scrollIntoView({behavior:"smooth", block:"start"}); }catch(err){}
      document.getElementById("requiz").addEventListener("click", function(){
        step = 0; score = {}; boost = "pop";
        elRes.classList.remove("on"); elRes.innerHTML = "";
        elBody.style.display = ""; draw();
        try{ quiz.scrollIntoView({behavior:"smooth", block:"start"}); }catch(err){}
      });
    }
    draw();
  }
})();
