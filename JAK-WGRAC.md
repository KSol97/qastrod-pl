# Qastrod.pl - jak uruchomić stronę

## 1. Wgranie na hosting
Skopiuj całą zawartość tego folderu do katalogu głównego domeny qastrod.pl
(zwykle `public_html/` albo `www/`). Struktura musi zostać zachowana:

```
index.html
piosenki-pilkarskie.html
... (51 pozostałych stron)
assets/style.css
assets/app.js
assets/data.js
assets/qastrod-logo.jpg
assets/qastrod-mark.jpg
sitemap.xml
robots.txt
```

Strona jest w pełni statyczna: bez PHP, bez bazy danych, bez backendu.
Działa na zwykłym hostingu, a także na Netlify, Vercel, Cloudflare Pages
i GitHub Pages (wystarczy przeciągnąć folder).

## 2. Po wgraniu - lista kontrolna SEO
1. Wymuś HTTPS i wybierz jedną wersję domeny (z `www` albo bez), drugą przekieruj.
2. Dodaj domenę w Google Search Console i potwierdź własność.
3. Wyślij `https://qastrod.pl/sitemap.xml` w Search Console -> Mapy witryny.
4. Sprawdź stronę w teście wyników z elementami rozszerzonymi Google
   (search.google.com/test/rich-results). Powinien wykryć FAQ, ItemList i okruszki.
5. Wklej link do qastrod.pl w opisie kanału YouTube oraz w opisach nowych filmów.
   To najmocniejszy sygnał, jaki masz na start.
6. W panelu hostingu włącz gzip lub brotli i cache dla plików z `assets/`.

## 3. Struktura serwisu (53 strony)

**Strony główne**
| Strona | Fraza |
|---|---|
| index.html | najlepsze piosenki piłkarskie |
| piosenki-pilkarskie.html | piosenki piłkarskie / piosenki o piłce nożnej |
| najnowsze-piosenki-pilkarskie.html | najnowsze piosenki piłkarskie |
| najlepsze-piosenki-pilkarskie.html | najlepsze piosenki piłkarskie ranking |
| wyszukiwarka-piosenek-pilkarskich.html | wyszukiwarka piosenek piłkarskich |
| shorty-pilkarskie.html | piłkarskie shorty |
| o-kanale.html | Qastrod kanał |

**Kategorie**
hymny-pilkarskie-po-polsku, rap-battle-pilkarski, piosenki-mundialowe-2026,
piosenki-o-polskich-pilkarzach, piosenki-o-legendach-futbolu, piosenki-o-klubach-pilkarskich

**40 podstron pod długi ogon** (fraza "piosenka o [nazwisko]"):
Messi, Cristiano Ronaldo, Lewandowski, Mbappé, Lamine Yamal, Neymar, Barcelona,
Real Madryt, Szczęsny, Błaszczykowski, Grosicki, Milik, Piszczek, Zieliński, Piątek,
reprezentacja Polski, Legia Warszawa, Lech Poznań, Widzew, Ekstraklasa,
Manchester United, Liverpool, Chelsea, Juventus, Borussia Dortmund, Ibrahimović,
Ronaldinho, Zidane, De Bruyne, Salah, Suárez, Iniesta, Xavi, Puyol, Pelé, Kanté,
Vinícius, Ramos, Balotelli, Guardiola.

Każda z nich ma własny tytuł, opis, listę utworów, sekcję FAQ i dane strukturalne.

## 4. Jak dodać nową piosenkę
Otwórz `assets/data.js`. Na początku tablicy `songs` dopisz obiekt:

```json
{"i":"ID_FILMU_YT","t":"Tytuł piosenki","v":1200,"c":["gwiazdy"],"e":["messi"],"r":1,"o":0}
```

- `i` - ID filmu z YouTube (część po `watch?v=`)
- `t` - tytuł
- `v` - liczba wyświetleń (liczba całkowita)
- `c` - kategorie: gwiazdy, legendy, polska, kluby, hymny, rap-battle, mundial, nostalgia, swieta
- `e` - encje: messi, ronaldo, lewandowski, mbappe, yamal, neymar, barcelona, real,
  szczesny, blaszczykowski, grosicki, milik, piszczek, zielinski, piatek, kadra, legia,
  lech, widzew, ekstraklasa, united, liverpool, chelsea, juventus, dortmund, ibrahimovic,
  ronaldinho, zidane, debruyne, salah, suarez, iniesta, xavi, puyol, pele, kante,
  vinicius, ramos, balotelli, guardiola
- `o` - kolejność publikacji (0 = najnowsza). Utwory z `o` mniejszym niż 12 dostają
  automatycznie plakietkę NOWOŚĆ i trafiają na stronę "Najnowsze".

Utwór pojawi się od razu w katalogu, w losowaniu, na stronach kategorii i na
podstronach encji, które mu przypiszesz.

## 5. Co dorobić w kolejnym kroku
- Podstrony pojedynczych piosenek z tekstami utworów. Ludzie masowo szukają
  "tekst piosenki o ...", a tej frazy nikt poza Tobą nie obsłuży.
- Blog pod frazy typu "piosenki kibicowskie", "piosenki na stadion",
  "historia hymnów klubowych".
- Dane strukturalne VideoObject na podstronach pojedynczych piosenek
  (wymagają daty publikacji filmu).
