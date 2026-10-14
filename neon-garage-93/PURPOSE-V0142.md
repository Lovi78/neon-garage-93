# v0.14.2 - Purpose & Fair Requests

2026. október 14. Alap: v0.14.1 @ `78b934d`. Ág: `codex/v0.14.2-purpose-and-fair-requests`. A mainhez nem merge-eltük.

## Miért készült

A tényleges játékosi mentés a 23. napon 3 eladást, $6,450 cash-t, 11 REP-et és 4/8 teljesített Season-célt tartalmazott. A játékos jelezte a repetitivitást és a következő cél bizonytalanságát. Két megbízás hozta a három autóüzlet fedezetének 92,5%-át: a mechanikákat használta, mégis hasonló döntések ismétlődtek.

A Camaro-megbízás elbukott. Az archívum szerint volt Camaro a piacon, de a mentés már nem őrizte a futásteljesítményét. A konkrét történeti eset okát ezért nem állítjuk bizonyítottnak. A programhibát külön reprodukáltuk: a modell neve elég volt a `requestHasCar` számára, így egy alkalmatlan, 190,000 mérföldes Camaro blokkolta az új tippet egy legfeljebb 150,000 mérföldes megbízásnál.

## 1. Teljesíthető, méltányos megbízások

- A típus, karosszéria, futásteljesítmény, szükséges dokumentumok és baleseti előélet együtt számítanak. A névegyezés önmagában nem megfelelő kínálat.
- Az új megbízások beszerzési terve számol a vétellel, $50 átírással, vizsgálattal, szükséges előéletkereséssel, hibajavítással, műhelyvárakozással és ismert számlákkal. Nem gyárt kedvezményes vagy nyereséget garantáló autót.
- A vevő által biztosított, valóban finanszírozható példányt nem viheti el másik vevő és nem járhat le a teljesítési ablak alatt. Ez meglévő megfelelő hirdetésre is érvényes. A felület közvetlenül megnyitja a biztosított tippet és a piacon külön jelöli.
- Általános igényekhez is jár keresés, nem csak konkrét modellhez. Az előélet részleteit továbbra is a játékosnak kell ellenőriznie; a belső kínálatellenőrzés nem fedi fel a rejtett adatokat a felületen.
- Ha nincs megfelelő és finanszírozható beszerzési lehetőség, védett keresés indul. Három nap után a vállalás büntetés nélkül lezárulhat; a játékos ezalatt ingyen le is mondhatja. Ha közben lesz megfelelő autó, teljes új felkészítési ablakot kap.
- Ha a biztosított példány rendszeroldali okból eltűnik, új tipp és valódi felkészítési idő jár. A már megkapott lehetőség elmulasztása vagy a kért autó másnak történő eladása nem ad ingyen új határidőt. Ilyenkor a korábbi -1 REP szabály megmarad.
- A már kifizetett, átadásra kész saját autóhoz nem kell új pénztartalék. Eladható megbízásra akkor is, ha a cash átmenetileg elfogyott.
- A gyors napátugrás megáll új biztosított tippnél és a szükséges felkészítési idő elfogyása előtt. A már lefoglalt, határidőre elkészülő javítást hagyja befejeződni. A még el nem fogadott, lejáró felkérés határidejét is figyeli.

A régi, fix áras v0.11/v0.12 megbízások megtartják az eredeti pénzügyi feltételeiket. A már lezárt, elbukott Camaro-megbízást és a régi reputációt nem módosítjuk utólag. A játékosi exportot csak beolvastuk, nem írtuk át.

## 2. Látható következő cél

A kezdő szakasz után a garázs célkártyája a tényleges állapotból készül. Megmutatja a célt, miért érdekes, az előrehaladást, a pénteki ranglista előrejelzését és a feloldható új lehetőséget. Nem oszt jutalmat, nem választ automatikus üzletet.

A vizsgált játékosi mentésnél: Top 5, $6,450 / $7,450 előrejelzett cél, $1,000 hiány, következő pénteki rangzárás. A riválisok és költségek változnak, ez előrejelzés, nem biztos eredmény. A Showroom-autó külön alternatíva +2 REP-ért. Ha a kezdő játékos még nem teljesített megbízást, a kártya a vevői brief összevetésére irányítja. Top 5 után a showpiece és a célzott eladás, később a gyűjtői hálózat kerül előre. A már megszerzett rangjutalmat nem ígéri újra.

Mobilon a kártya a garázs alatt van. Saját autók mellett desktopon is a jelenet alá kerül, így nem takarja el a járműveket.

## 3. Különböző autó- és vevőhelyzetek

16 meglévő modell kapott játékbeli karakterprofilt: CRX, Golf, Volvo, Accord, Cressida, E30, MX-5, MR2, RX-7, 300ZX, Supra, 240SX, Silvia, Camaro, Fiero és Mustang. Nem bővült a katalógus.

- Eltérő alkatrész-hangsúlyok és súlyozott hibatípusok. A kezdeti súlyozott összállapotot a profil nem emeli, és nem ad általános értékbónuszt. Egy mechanikailag gyengébb, de szebb példány más javítási döntést igényel.
- Az újonnan generált autó mentett rövid történetet kap. A régi példányok állapotát, hibáit, eladói adatait és történetét nem sorsoljuk újra; náluk csak a modell általános playbookja látható.
- A modellhez illő vevőközönség nagyobb eséllyel érdeklődik. A meglévő vevőprofilok ár-, dokumentum-, állapot- és alkuviselkedése marad. A visszatérő vevő korábbi profilját nem cseréljük le.
- Ezek fiktív játékmeneti profilok, nem állítások a valódi autók hibastatisztikáiról. A playbook nem bizonyítja egy konkrét autó hibáját; a szemle megmarad.

A Top 5 most valódi értékesítési választást is nyit: Open market / Enthusiast circle / Family network / Budget board / Commuter board. Nyílt piacon nincs extra díj; célzott hirdetésenként egyszeri $35, 25%-kal kisebb vevőérkezési esély és a választott közönség javára súlyozott érdeklődés. Ez nem garantált prémium. A sportautó rajongói ára és a budget vevő magas állapotra nem fizető szabálya továbbra is működik. A díj a konkrét autó bekerülésébe kerül, ezért egyszer szerepel az üzleti fedezetben; nem vonjuk le újra közös marketingköltségként. Átárazás/újrahirdetés új célzott kampánnyal újabb díjat jelent.

Ez a modellkarakter és fejlődés első célzott köre. Teljes v0.15 modellismereti rendszer, új telephely, aukció és Season 2 nem készült.

## Ellenőrzés és korlátok

- `npm test`: 211 sikeres szabályteszt, ebből 19 új purpose/megbízás-regresszió. [Napló](reports/v0142-rules-output.txt).
- `npm run test:ui`: 54 sikeres DOM-folyamatteszt, ebből 4 új cél/playbook/audience/supply teszt. [Napló](reports/v0142-ui-output.txt).
- `npm run test:simulation`: 25 x 200 kereskedési, 30 x 180 management, 400 x 100 javításstratégiai nap, plusz 120 megbízásos eset 107 napváltással. Napi pénzegyeztetés és mentés-visszaolvasás. [Napló](reports/v0142-simulation-output.txt).
- Megbízásszimuláció: 112/120 teljesítés, 8/120 kínálat hiányában büntetés nélküli lezárás; 105 teljesítés nyereséges. Minden finanszírozható vállalás határidőn belül teljesült a vizsgált stratégiával. A tesztbot az ellenőrző motor belső felkészítési tervét használja; ez elérhetőségi ellenőrzés, nem emberi döntéshozatali vagy balanszbizonyíték. [Adatok](reports/v0142-request-supply-simulation.json).
- Javítás: never $19,468, Quick $21,100, Driver-ready $23,673 (+21,6%), Full $12,117, smart $26,990 átlagos nettó érték, 80 mag x 100 nap. Több nyerő stratégia; Full minden autón továbbra is gyengébb. [Adatok](reports/v0142-repair-simulation.json).
- Valódi Chromium: 1440 x 900, 1280 x 800, 390 x 844 és 375 x 844. Görgetés, túlcsordulás, tényleges CTA-elérés, változatlanul beimportált játékosi állás, biztosított megbízás vállalása/autóvétel/felkészítés/átadás és $35 célzott hirdetés. Nincs JavaScript-hiba. [Új folyamatok](reports/v0142-browser-results.json), [megtartott stabilitási útvonal](reports/v0142-stability-browser-results.json).

A korábbi mentés pénze, reputációja, eladásai, meglévő alkatrészei/hibái/árai változatlanok maradtak a beolvasáskor. Az export fájlja nem változott. A böngészős ellenőrzés külön ideiglenes profilt használ, a játékos valódi böngészős mentését nem írja felül.

A játékélmény tartós javulása emberi újrapróbát igényel. A modellkarakter, vevőközönség, célzott díj és rangfeloldás hosszabb balansza még nem tekinthető véglegesnek. Safari/Firefox és fizikai telefon nem volt tesztelve. A két új stratégiai út nem azt jelenti, hogy bármelyik minden modellen nyereséges.

## Aktuális képek

- Célkártya: [desktop 1440](reports/v0142-goal-1440.png), [laptop 1280](reports/v0142-goal-1280.png), [mobil 390](reports/v0142-goal-390.png), [mobil 375](reports/v0142-goal-375.png).
- Modellkarakter: [desktop](reports/v0142-character-1440.png), [mobil](reports/v0142-character-390.png).
- Feloldott vevőközönség: [desktop](reports/v0142-audience-1440.png), [mobil](reports/v0142-audience-390.png).

Böngészős újrafuttatás: `npm run test:browser`, opcionális Playwright QA-függőséggel; `GAME_URL`, `PLAYWRIGHT_MODULE`, opcionális `CHROME_PATH`, a valódi mentés külön QA-importjához opcionális `PLAYER_SAVE`. A korábbi v0.14.1 képeket megtartjuk, az új stabilitási futás külön `v0142-stability-*` fájlokba ír.
