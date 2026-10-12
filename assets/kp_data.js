/* Zostań piłkarzem: dane kariery (zmyślone kluby, ligi, wydarzenia, sklep) | qastrod.pl */
window.KPD=(function(){
'use strict';
/* lv: 0 Orlik, 1 akademie, 2 Ekstraklasa, 3 liga zagraniczna, 4 topowe kluby. str: siła drużyny. c1/c2: barwy */
var LEAGUES=[
 {lv:0,n:'Liga Orlików',short:'Orlik',sal:12,diff:.82,scene:'orlik',min:20,clubs:[
  ['Twoje osiedle',58,'#2563eb','#ffffff'],['Osiedle Słoneczne',58,'#ff8a00','#111111'],['Bloki Zachód',55,'#16a34a','#ffffff'],['Orliki Północ',60,'#111827','#facc15'],
  ['Stara Kamienica',54,'#7c3aed','#ffffff'],['Zielone Wzgórze',57,'#0f766e','#ffffff'],['Os. Kwiatowe',53,'#db2777','#ffffff'],['Port Wschód',59,'#0369a1','#ffffff']]},
 {lv:1,n:'Centralna Liga Juniorów',short:'Akademia',sal:35,diff:.92,scene:'stadium',crowd:.25,min:90,clubs:[
  ['Akademia Kolejorz Poznań',66,'#0b4fa8','#ffffff'],['Akademia Wojskowi Warszawa',66,'#ffffff','#16a34a'],['Akademia Medaliki Częstochowa',65,'#b91c1c','#1d4ed8'],['Akademia Biała Gwiazda Kraków',63,'#ffffff','#dc2626'],
  ['Akademia Portowcy Szczecin',62,'#1e3a8a','#b91c1c'],['Akademia Jaga Białystok',62,'#facc15','#dc2626'],['Akademia Górnicy Zabrze',61,'#ffffff','#1d4ed8'],['Akademia Pasy Kraków',60,'#ffffff','#dc2626']]},
 {lv:2,n:'Ekstraklasa',short:'Ekstraklasa',sal:160,diff:1,scene:'stadium',crowd:.6,min:90,clubs:[
  ['Kolejorz Poznań',72,'#0b4fa8','#ffffff'],['Wojskowi Warszawa',72,'#ffffff','#16a34a'],['Medaliki Częstochowa',71,'#b91c1c','#1d4ed8'],['Jaga Białystok',69,'#facc15','#dc2626'],
  ['Portowcy Szczecin',68,'#1e3a8a','#b91c1c'],['Biała Gwiazda Kraków',67,'#ffffff','#dc2626'],['Górnicy Zabrze',66,'#ffffff','#1d4ed8'],['Pasy Kraków',65,'#ffffff','#dc2626']]},
 {lv:3,n:'Liga zagraniczna',short:'Zagranica',sal:520,diff:1.08,scene:'stadium',crowd:.8,min:90,clubs:[
  ['Wilki Wolfsburg',77,'#65a30d','#ffffff'],['Kozły Kolonia',76,'#ffffff','#dc2626'],['Lisy Leicester',76,'#1d4ed8','#ffffff'],['Sroki Newcastle',78,'#111111','#ffffff'],
  ['Nietoperze Walencja',77,'#ffffff','#111111'],['Żółta Łódź Villarreal',78,'#facc15','#1e3a8a'],['Orły Rzym',77,'#7dd3fc','#ffffff'],['Fiołki Florencja',76,'#6d28d9','#ffffff']]},
 {lv:4,n:'Liga gwiazd',short:'Top klub',sal:1400,diff:1.16,scene:'stadium',crowd:1,min:90,clubs:[
  ['Blaugrana Barcelona',87,'#a50044','#004d98','blau'],['Królewscy Madryt',88,'#ffffff','#d4af37','krol'],['Bawarczycy Monachium',87,'#dc052d','#ffffff','baw'],['Błękitni Manchester',87,'#6cabdd','#1c2c5b','blek'],
  ['Czerwone Diabły Manchester',84,'#da291c','#fbe122','diab'],['Stara Dama Turyn',84,'#111111','#ffffff','dama'],['Książęta Paryż',86,'#004170','#da291c','ksiaz'],['The Reds Liverpool',86,'#c8102e','#00b2a9','reds']]}
];
var NATIONS=[['Niemcy',84,'#ffffff','#111111'],['Hiszpania',86,'#c60b1e','#ffc400'],['Francja',86,'#1d4ed8','#ffffff'],['Anglia',85,'#ffffff','#1d4ed8'],['Brazylia',86,'#facc15','#16a34a'],['Argentyna',87,'#7dd3fc','#ffffff'],['Portugalia',84,'#b91c1c','#16a34a'],['Holandia',83,'#f97316','#ffffff'],['Włochy',83,'#1d4ed8','#ffffff'],['Chorwacja',81,'#ffffff','#dc2626']];
var FIRST=['Kacper','Szymon','Bartek','Olek','Filip','Antek','Wiktor','Maks','Tymek','Igor','Leon','Kuba','Michał','Oskar','Franek','Staś','Julek','Adam','Dawid','Mateusz','Nikodem','Hubert','Marcel','Bruno','Tomek','Kamil','Ksawery','Borys','Iwo','Remek'];
var LAST=['Nowak','Wójcik','Mazur','Krawczyk','Zając','Król','Wieczorek','Wróbel','Dudek','Pawlak','Sikora','Baran','Duda','Szulc','Kubiak','Lis','Kowal','Bąk','Chmiel','Sowa','Wilk','Kruk','Kos','Gaj','Rak','Mróz','Bies','Grad'];
var FOREIGN=['Marco','Lucas','Mateo','Jonas','Noah','Luca','Hugo','Enzo','Diego','Rafa','Leo','Theo','Milan','Ivan','Sven','Pablo','Nico','Jules','Tiago','Ruben'];
var FLAST=['Rossi','García','Müller','Silva','Dubois','Fernández','Bianchi','Schmidt','Costa','Moreau','López','Weber','Santos','Ricci','Bauer','Martin','Kovač','Jansen','Romero','Ferrari'];
/* sklep: styl życia (daje fanów i formę) */
var SHOP=[
 {id:'rower',ico:'🚲',n:'Rower BMX',p:150,fans:20,f:2},{id:'konsola',ico:'🎮',n:'Konsola',p:350,fans:40,f:1},{id:'buty',ico:'👟',n:'Limitowane sneakersy',p:900,fans:120,f:0},
 {id:'skuter',ico:'🛵',n:'Skuter',p:2500,fans:250,f:2},{id:'auto',ico:'🚗',n:'Pierwsze auto',p:9000,fans:600,f:2},{id:'mieszk',ico:'🏢',n:'Mieszkanie w centrum',p:30000,fans:1500,f:4},
 {id:'sport',ico:'🏎️',n:'Auto sportowe',p:90000,fans:5000,f:2},{id:'willa',ico:'🏡',n:'Willa z basenem',p:250000,fans:15000,f:5},{id:'jacht',ico:'🛥️',n:'Jacht',p:600000,fans:40000,f:3},{id:'jet',ico:'🛩️',n:'Prywatny odrzutowiec',p:1500000,fans:120000,f:4}];
/* wydarzenia: st = etap (kid 12-15, teen 16-18, pro 19+, star top kluby) */
var EV=[
 {id:'matma',st:'kid',ico:'📝',t:'Dwója z matmy. Mama: „Bez poprawy nie ma meczu!”',L:['Siadam do książek',{szkola:15,rodzice:10,forma:-5}],R:['Uciekam na trening',{forma:8,rodzice:-15,szkola:-10}]},
 {id:'fifa',st:'kid',ico:'🎮',t:'Kumple grają w FIFĘ do północy. Jutro rano trening.',L:['Idę spać',{forma:6,kumple:-8}],R:['Gramy do rana!',{kumple:12,forma:-8}]},
 {id:'babcia',st:'kid',ico:'👵',t:'Babcia dała Ci 50 zł na urodziny.',L:['Odkładam',{rodzice:8,coins:30}],R:['Nowe getry!',{coins:50,kumple:4}]},
 {id:'trener',st:'kid',ico:'🧢',t:'Trener: „Zostajesz po treningu na dodatkowe strzały?”',L:['Spieszę się',{kumple:4}],R:['Jasne, trenerze!',{forma:6,STR:1}]},
 {id:'pilka',st:'kid',ico:'😠',t:'Starszy chłopak z osiedla zabrał Ci piłkę.',L:['Mówię trenerowi',{rodzice:5,kumple:-6}],R:['Odbieram ją sam!',{kumple:10,rodzice:-6}]},
 {id:'wycieczka',st:'kid',ico:'🚌',t:'Klasa jedzie na wycieczkę w dzień meczu.',L:['Jadę z klasą',{kumple:10,szkola:5,forma:-6}],R:['Gram mecz',{forma:6,kumple:-6}]},
 {id:'viral',st:'kid',ico:'📱',t:'Ktoś nagrał Twojego gola. 2 tys. wyświetleń!',L:['Nie chcę się chwalić',{rodzice:5}],R:['Wrzucam na profil!',{fol:120,kumple:5}]},
 {id:'sportowa',st:'kid',ico:'🏫',t:'Mama pyta, czy chcesz iść do szkoły sportowej.',L:['Zostaję z kumplami',{kumple:8}],R:['Tak, marzę o tym!',{forma:6,szkola:-4,TEC:1}]},
 {id:'deszcz',st:'kid',ico:'🌧️',t:'Leje jak z cebra. Trening na Orliku odwołany.',L:['Gram w domu w FIFĘ',{kumple:5,forma:-3}],R:['Żongluję w garażu',{TEC:1,rodzice:-3}]},
 {id:'kontuzjakol',st:'kid',ico:'🩹',t:'Kumpel z drużyny skręcił kostkę. Potrzebuje pomocy z lekcjami.',L:['Pomagam mu',{kumple:10,szkola:5,forma:-3}],R:['Nie mam czasu',{forma:4,kumple:-8}]},
 {id:'swiadectwo',st:'kid',ico:'📜',t:'Koniec roku. Świadectwo z paskiem?',L:['Wkuwam do końca',{szkola:15,rodzice:12,forma:-6}],R:['Liczy się piłka',{forma:5,rodzice:-10}]},
 {id:'nowekorki',st:'kid',ico:'👟',t:'Stare korki się rozpadają. Tata mówi, że w tym miesiącu nie ma kasy.',L:['Kleję je taśmą',{rodzice:8}],R:['Kupuję za swoje',{coins:-40,forma:5}]},
 {id:'agent',st:'teen',ico:'🕴️',t:'Agent w drogim garniturze obiecuje Ci kontrakt marzeń. Chce 20% od wszystkiego.',L:['Dziękuję, nie',{rodzice:8}],R:['Podpisuję!',{coins:200,rodzice:-10,fol:200}]},
 {id:'osiemnastka',st:'teen',ico:'🎉',t:'Osiemnastka kumpla w sobotę. Mecz w niedzielę rano.',L:['Wpadam na godzinę',{kumple:6,forma:-2}],R:['Balujemy do rana!',{kumple:14,forma:-12}]},
 {id:'matura',st:'teen',ico:'🎓',t:'Matura za pasem. Trener chce Cię na obozie w tym samym czasie.',L:['Zdaję maturę',{szkola:20,rodzice:12,forma:-8}],R:['Jadę na obóz',{forma:10,szkola:-15,DRY:1}]},
 {id:'tiktok',st:'teen',ico:'🎬',t:'Twój filmik z trikiem ma 500 tys. wyświetleń!',L:['Skupiam się na grze',{forma:4}],R:['Nagrywam więcej!',{fol:3000,forma:-4}]},
 {id:'dziewczyna',st:'teen',ico:'💌',t:'Ktoś z klasy zaprasza Cię do kina w dzień przed meczem.',L:['Może po meczu',{forma:4,kumple:-3}],R:['Idę!',{kumple:8,forma:-3}]},
 {id:'dodatkowy',st:'teen',ico:'🏋️',t:'Trener przygotowania fizycznego proponuje dodatkową siłownię.',L:['Odpuszczam',{kumple:4}],R:['Wchodzę w to',{forma:8,SZY:1}]},
 {id:'wywiad',st:'pro',ico:'🎤',t:'Dziennikarz pyta, czy trener dobrze Cię ustawia.',L:['Wszystko gra',{trener:10,media:-4}],R:['Mógłbym grać więcej',{trener:-12,media:10,fol:400}]},
 {id:'impreza',st:'pro',ico:'🍾',t:'Koledzy z szatni idą w miasto po zwycięstwie.',L:['Wracam do domu',{forma:6,kibice:-2}],R:['Idę z nimi',{trener:-6,forma:-8,fol:300}]},
 {id:'kibic',st:'pro',ico:'🧒',t:'Mały kibic czeka pod stadionem z Twoją koszulką.',L:['Spieszę się',{kibice:-8}],R:['Robię zdjęcie i podpisuję!',{kibice:12,fol:500}]},
 {id:'reklama',st:'pro',ico:'📺',t:'Marka napojów chce Cię do reklamy. Dobra kasa, dużo nagrań.',L:['Odmawiam',{forma:4}],R:['Biorę!',{coins:1500,forma:-6,fol:2000}]},
 {id:'kontuzja',st:'pro',ico:'🤕',t:'Coś strzyka w udzie. Lekarz radzi odpocząć tydzień.',L:['Odpoczywam',{forma:10,trener:-4}],R:['Gram na blokadzie',{forma:-15,trener:8}]},
 {id:'kapitan',st:'pro',ico:'©️',t:'Trener rozważa, czy dać Ci opaskę kapitana.',L:['Nie jestem gotowy',{trener:-3}],R:['Biorę odpowiedzialność!',{trener:10,kibice:8,media:5}]},
 {id:'krytyk',st:'pro',ico:'📰',t:'Ekspert w telewizji: „Ten chłopak jest przereklamowany”.',L:['Ignoruję',{forma:4}],R:['Odpowiadam na Twitterze',{media:-10,fol:1500,kibice:4}]},
 {id:'fundacja',st:'pro',ico:'💛',t:'Możesz otworzyć Orlik swojego imienia na rodzinnym osiedlu.',L:['Może kiedyś',{}],R:['Robię to!',{coins:-800,kibice:15,fol:3000}]},
 {id:'gala',st:'star',ico:'🏆',t:'Zaproszenie na galę piłkarską w Paryżu w środku tygodnia.',L:['Zostaję na treningu',{forma:8,trener:6}],R:['Lecę na galę',{media:12,fol:20000,forma:-5}]},
 {id:'arabia',st:'star',ico:'💰',t:'Klub z Arabii oferuje pięć razy wyższą pensję.',L:['Gram o trofea',{kibice:12,media:5}],R:['Pytam o szczegóły',{kibice:-15,coins:5000}]},
 {id:'dokument',st:'star',ico:'🎥',t:'Platforma streamingowa chce nakręcić o Tobie serial dokumentalny.',L:['Chronię prywatność',{forma:5}],R:['Kręcimy!',{fol:50000,forma:-6,coins:8000}]},
 {id:'mlody',st:'star',ico:'🌱',t:'Do kadry wchodzi 17-latek z Orlika. Media mówią, że to „nowy Ty”.',L:['Spokojnie, to dzieciak',{media:-4}],R:['Biorę go pod skrzydła',{kibice:10,trener:6,media:8}]}
,
 {id:'nowykolega',st:'kid',ico:'🧒',t:'Nowy chłopak w klasie gra w piłkę lepiej od Ciebie.',L:['Unikam go',{kumple:-6,forma:2}],R:['Zapraszam go na Orlik',{kumple:10,TEC:1}]},
 {id:'pies',st:'kid',ico:'🐕',t:'Sąsiadka prosi, żebyś wyprowadzał jej psa przed treningiem.',L:['Nie mam czasu',{forma:3,rodzice:-5}],R:['Pomagam',{rodzice:8,coins:30,forma:-2}]},
 {id:'telefon',st:'kid',ico:'📵',t:'Rodzice zabierają telefon za słabe oceny.',L:['Oddaję bez gadania',{rodzice:8,szkola:6}],R:['Kłócę się',{rodzice:-12,kumple:4}]},
 {id:'bramka',st:'kid',ico:'🧤',t:'Na Orliku brakuje bramkarza. Staniesz na bramce?',L:['Nigdy!',{kumple:-6}],R:['Staję na bramce',{kumple:9,forma:-2,SZY:1}]},
 {id:'turniej',st:'kid',ico:'🏟️',t:'Turniej dzielnicowy w ten sam dzień co urodziny siostry.',L:['Idę na urodziny',{rodzice:12,forma:-4}],R:['Gram turniej',{forma:6,fol:60,rodzice:-10}]},
 {id:'praca',st:'teen',ico:'🍕',t:'Wakacje: praca w pizzerii albo obóz piłkarski.',L:['Praca',{coins:250,forma:-6}],R:['Obóz',{forma:10,coins:-80}]},
 {id:'kostka',st:'teen',ico:'🦶',t:'Skręcona kostka na WF-ie. Weekendowy mecz pod znakiem zapytania.',L:['Odpoczywam',{forma:-6,szkola:5}],R:['Gram z bólem',{forma:-14,trener:4}]},
 {id:'derby',st:'teen',ico:'🔥',t:'Derby juniorów. Kibice skandują Twoje nazwisko.',L:['Skupiam się na grze',{forma:6}],R:['Cieszynka pod trybuną!',{fol:800,kumple:6,forma:-2}]},
 {id:'dieta',st:'teen',ico:'🥗',t:'Dietetyk akademii proponuje plan żywienia.',L:['Pizza zostaje',{kumple:4,forma:-5}],R:['Wchodzę w plan',{forma:10,coins:-60}]},
 {id:'plotki',st:'pro',ico:'🗞️',t:'Media piszą o Twoim rzekomym transferze.',L:['Dementuję',{trener:8,kibice:4}],R:['Nic nie mówię',{media:10,trener:-6}]},
 {id:'kryzys',st:'pro',ico:'🤝',t:'Kolega z drużyny ma kryzys formy i prosi o pomoc.',L:['Zostaję z nim po treningu',{trener:6,forma:-2}],R:['Skupiam się na sobie',{forma:5,kibice:-3}]},
 {id:'charytatywny',st:'pro',ico:'💛',t:'Zaproszenie na mecz charytatywny w przerwie zimowej.',L:['Odpoczywam',{forma:6}],R:['Gram dla dzieciaków',{kibice:10,media:8,forma:-3}]},
 {id:'podcast',st:'pro',ico:'🎧',t:'Popularny podcast chce Cię w odcinku o młodych gwiazdach.',L:['Odmawiam',{forma:3}],R:['Idę',{fol:2500,media:8,trener:-3}]},
 {id:'karne',st:'pro',ico:'⚽',t:'Trener pyta, kto będzie strzelał karne.',L:['Niech strzela kapitan',{trener:3}],R:['Ja!',{trener:6,kibice:5,STR:1}]},
 {id:'okladka',st:'star',ico:'🕹️',t:'Twoja twarz może trafić na okładkę gry komputerowej.',L:['Odmawiam',{forma:4}],R:['Zgadzam się',{coins:8000,fol:60000,forma:-4}]},
 {id:'rywal',st:'star',ico:'🥊',t:'Wielki rywal w walce o Złotą Piłkę szydzi z Ciebie w wywiadzie.',L:['Ignoruję',{forma:6}],R:['Odpowiadam',{media:10,fol:30000,trener:-4}]},
 {id:'przedluzenie',st:'star',ico:'✍️',t:'Klub proponuje przedłużenie kontraktu na gorszych warunkach.',L:['Negocjuję twardo',{coins:6000,kibice:-8}],R:['Podpisuję z sercem',{kibice:14,trener:6}]},
 {id:'akademia',st:'star',ico:'🏫',t:'Możesz otworzyć własną akademię piłkarską w rodzinnym mieście.',L:['Może później',{}],R:['Otwieram!',{coins:-8000,kibice:15,media:12,fol:40000}]}
];
return {LEAGUES:LEAGUES,NATIONS:NATIONS,FIRST:FIRST,LAST:LAST,FOREIGN:FOREIGN,FLAST:FLAST,SHOP:SHOP,EV:EV}
})();
