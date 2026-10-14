# v0.14.1 - Stability & UX Improvement

2026. október 14. Alap: `codex/v0.14-cut-and-flow` @ `fc471e5`. A munka kezdetén élő fetch alapján a main már v0.14-et tartalmazott (`6ad3408`), nem v0.11-et. Külön ág: `codex/v0.14.1-stability-ux`. Main merge és publikálás nem része ennek a körnek.

## Ellenőrzött hibák és változások

| Terület | Bizonyított korábbi viselkedés | v0.14.1 |
| --- | --- | --- |
| Gyors napátugrás | Csak az utólag érkezett eseményeket figyelte, meglévő ajánlat mellett is lépett | Minden lépés előtt döntésellenőrzés: látott és nem látott ajánlat, visszahívás/megállapodás, közelgő megbízáshatáridő, panasz, kész javítás, hátralék és fedezetlen következő számla. Új kapcsolatnál, javításnál, visszahívásnál és fontos fizetésnél megáll |
| Javítás | Foglaláskor javult az állapot és az autó értéke | A költség és foglalás azonnali; a külön mentett munkaterv csak elkészüléskor módosítja az alkatrészeket és a javított hibákat. Alkatrészes javítás és alkalmazotti minőség is ezt követi |
| Vevőérkezés | A helyi interest bónusz kétszer szerepelt a képletben | Egyszer alkalmazott bónusz, küszöbértékes regresszióval |
| Hibás mentés | Betöltési hiba után új játék indult, majd automatikusan felülírta a korábbi adatot | Betöltési hibánál írásvédelem és állandó figyelmeztetés. Options: Export Save, Import Save, Restore Previous Save. Import előtt szerkezeti és számérték-ellenőrzés, migráció |

Mentés: az eredeti `neon-garage-93-v1` kulcs megmarad. A `-backup` az előző eltérő, érvényes állapot. Új játék/import/helyreállítás előtt a hibás eredeti külön `-unreadable` kulcsba kerül. Hibás import nem aktiválódik. Tárolási hiba esetén a régi elsődleges mentés megmarad; a böngészős export külön fájlba menthető. Ez helyi védelem, nem felhős szinkronizálás.

Javítás: az új `pendingRepair` mező tartalmazza az alkatrészcélokat és a javítandó hibaindexeket. A régi foglalások ilyen mező nélkül már eleve a javított értékeket tartalmazzák, ezeket nem játsszuk vissza. Az aznapi Quick fix azonnal elkészül; az alkalmazotti késleltetés ezt is a tényleges elkészülési naphoz köti. Rejtett hiba feltárása és a rendelkezésre álló pénzből kifizetett alkatrészköltség foglaláskor történik; a hiba csak a munka végén lesz fixed. Nem finanszírozható hiba feltárva, de javítatlanul marad. A cégérték foglaláskor a készpénzkiadással csökken, az autó értéke az elkészüléskor nő. A piaci hullámok közben továbbra is módosíthatják az árat.

A régi audit javítási gazdaságról és négyfüles adatlapról szóló megállapításai a v0.13-ra vonatkoztak. A v0.14 már javított ezeken; itt nem állítottuk vissza a régi felületet és nem hangoltuk újra az értékgörbét.

## Célzott UX

- Cash, kapacitás és Next Day hangsúlyos; XP és REP végig látható. A ranglista kompakt, részletei egy kattintással megnyithatók.
- A v0.14 kétoszlopos autólap és a nagy autógrafika megmaradt. Az autóablakból kikerült a teljes ismételt navigáció. Az autó pénzügyi részletei lenyithatók.
- Javítási csomagok: nincs BEST RETURN vagy kiemelt elsődleges csomag. Az elérhető opciók tényleges költsége/ideje/értéke alapján Lowest cost, Fastest turnaround és Highest potential value címkék. A háttérmagyarázat lenyitható, a bot belső stratégiája megmaradt.
- Az alku kártyái nem választanak automatikusan taktikát. Választás nélkül az ajánlatküldés érthető hibát ad, és nem módosítja a tárgyalást. A kézzel választott munkameneti draft megmarad.
- A javításra váró autó alsó sávjából Next Day, vevő nélküli hirdetésből Wait for buyer érhető el. Ez csökkenti a bezárás-újranyitás terhét.

## Development Session Log

Aktiválás: az oldal URL-jében `?dev=1`. Normál játékban nincs panel vagy napló. A fejlesztői mód Options menüjéből Session JSON és Session CSV exportálható. A CSV tartalmazza a méréseket és az eseménysorokat is. Minden oldalbetöltés külön helyi session-kulcsot kap (`neon-garage-dev-session-<id>`); nincs hálózati adatküldés vagy szabad szövegű adatgyűjtés.

Méri a munkamenet időtartamát, az első vételt és nyereséges eladást, érdemi gomb-/választáskattintásokat, kézi/automatikus napokat, eseménytelen napokat, csomagstratégiát, új Season-célokat és navigációt. A flip számítása az autó első megnyitásától az eladásig tartó érdemi kattintásokat számolja; párhuzamos autók esetén a közben végzett más műveletek is beleszámítanak. A teljes session kattintásszáma a Marketbe lépést is tartalmazza. A napváltó gombok külön számlálóba kerülnek. Újratöltés új munkamenet, nem folyamatos emberi játékidő.

## Működési bizonyíték

- `npm test`: 191 sikeres szabályteszt, ebből 15 új stabilitási regresszió. [Teljes napló](reports/v0141-rules-output.txt).
- `npm run test:ui`: 50 sikeres DOM-folyamatteszt. [Napló](reports/v0141-ui-output.txt).
- `npm run test:simulation`: 25 x 200 kereskedési, 30 x 180 management, 400 x 100 javításstratégiai nap, összesen 50 400 szimulált nap. Napi pénzegyeztetés, mentés-visszaolvasás, egyszeri XP/REP/szezonjutalmak és véges értékek. [Napló](reports/v0141-simulation-output.txt), [javításadatok](reports/v0141-repair-simulation.json).
- Chromium külön ideiglenes profillal: 1440 x 900, 1280 x 800, 390 x 844 és 375 x 844. Dokumentumszélesség, adatlap belső görgetése, ténylegesen kattintható gombok és viewporton belüli döntési sáv ellenőrizve. Nincs JavaScript-hiba. [Eredmények](reports/v0141-browser-results.json).
- Új mentés, 42-es véletlenmag, látható becslés és ár alapján választott kezdőautó: vétel, vizsgálat, tudatos alku, hirdetés, két automatikus nap és ajánlatelfogadás. $104 profit, 10 érdemi kattintás a teljes sessionben, 9 az autó megnyitásától számolt flipben. Egy Season-cél. [Session](reports/v0141-browser-session.json).
- Külön javításos QA-állapot: Nissan 300ZX, 58%-os eredeti állapot, Driver-ready munkaterv, változatlan állapot munka közben. Ez finanszírozott tesztfixture, nem kezdőjátékos-balanszbizonyíték.
- Valódi böngészős export fájlba, visszaimport és pénzegyezőség; hibás mentés újratöltés utáni megőrzése és előző állapot visszaállítása.
- v0.11/v0.12 sémarekonstrukció, v0.13 solo/staff fixture és v0.14 folyamatban lévő régi/új javítás. Nem csatolt valódi játékosi mentésből származnak. A régi szabályú mentés megtartja a staff- és üzletági rendszereit.

Az npm cache jogosultsági hibáját külön ideiglenes cache használatával kerültük meg, a felhasználói cache módosítása nélkül.

| Stratégia | Átlagos nettó érték, 80 mag x 100 nap |
| --- | ---: |
| Soha ne javíts | $18,802 |
| Quick fix | $19,951 |
| Driver-ready | $22,436 (+19,3%) |
| Full minden autón | $10,372 |
| Belső smart bot | $23,595 |

Nincs minden magon domináló stratégia. A forráság kódjával azonos mérésben a never/quick/driver eredmények változatlanok; a javítás időzítésének korrekciója a Full és smart stratégiát érinti: Full $11,428 -> $10,372 (-9,2%), smart $23,536 -> $23,595 (+0,3%). [Forrásági kontrollmérés](reports/v0141-baseline-repair-simulation.json). A korábbi `repair-after-v014-100d.json` más köztes v0.14 állapotot mért, ezért nem közvetlen előtte-utána alap.

## Friss képernyőképek

| Nézet | Desktop | Mobil |
| --- | --- | --- |
| Garage | [1440](reports/v0141-garage-1440.png), [1280](reports/v0141-garage-1280.png) | [390](reports/v0141-garage-390.png), [375](reports/v0141-garage-375.png) |
| Vásárlás | [1440](reports/v0141-purchase-1440.png), [1280](reports/v0141-purchase-1280.png) | [390](reports/v0141-purchase-390.png), [375](reports/v0141-purchase-375.png) |
| Folyamatban lévő javítás | [1440](reports/v0141-repair-1440.png) | [390](reports/v0141-repair-390.png) |

A régi képek történeti bizonyítékként megmaradnak; a jelenlegi felülethez ezek az új képek az irányadók. Ismételhető böngészős teszt: `tests/stability-browser.cjs`, opcionális Playwright QA-függőséggel és külön helyi kiszolgálóval. Beállítások: `GAME_URL`, `PLAYWRIGHT_MODULE`, opcionális `CHROME_PATH`. Nem használja a játékos böngészőprofilját.

## Nyitott elfogadási feltételek

- Nem történt 20-30 perces emberi játékteszt. Az automatikus első vétel/eladás ezredmásodperces ideje nem értelmezhető emberi eredményként.
- A 3 perces vétel, 10 perces nyereséges eladás, 30 perc alatt 3 Season-cél és a következő lépés valódi megértése emberi tesztet igényel. A <=12 kattintás egy kezdőútvonalon bizonyított, nem minden autón és stratégián.
- Az első, költséget figyelmen kívül hagyó Driver-ready böngészős próba ugyanazon olcsó autón -$335 eredményt hozott. A végleges próba a látható negatív várható javítási eredmény miatt nem javított. A címkék nem profitígéretek.
- Safari/Firefox, fizikai telefon és valódi játékosi export ellenőrzése még szükséges. A minták nem helyettesítik ezeket.
- Régi nagy kapacitású garázs guide-takarása és örökölt magas heti üzletági költségek a korábbi roadmap nyitott pontjai maradnak. Új rendszert vagy Season 2 tartalmat nem készítettünk.

Következő három feladat: 1. két emberi 20-30 perces teszt session-exporttal; 2. a javítási döntések, kezdő profit és Season-célok ütemének korrekciója a mérések alapján; 3. v0.15 Cars with Character külön specifikációja 15-20 jellegzetes modellre. A kód és tesztek elkészültek, a teljes emberi játékélmény-elfogadás nyitott.
