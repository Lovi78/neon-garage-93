# v0.13.0 - Run the Lot

A vállalkozásvezetési szabályok jelenleg is érvényesek. A mai felület és ikonok leírása: [Premium Retro UX](UX-REDESIGN.md), a PR #1 már a v0.13-as fejlesztői ágba olvadt. A napi áttekintés **Business / Today**, személyzet **Business / Staff**, kiosztás **Business / Workshop**, megbízások **Business / Buyer requests**, beruházások **Business / Expansions**. Hitel: **Business / Finance**; eredmény/bér: **7-day business result & payroll** lenyitható rész. Az alábbi régi képek és böngészőméretek a management-kör idejét rögzítik, nem a legújabb felületet.

2026. október 12. Alap: v0.12.3. Fejlesztési ág: `codex/v0.13-run-the-lot`.

## Játszható rendszerek

- Tulajdonos: napi 8 munkaóra. Átvizsgálás 2, előéletkeresés 1, normál javítás indítása 3, első hirdetés előkészítése 2, vevői válasz 1 óra. Vétel, alku, eladás, árazás és újrahirdetés nem kap külön akciópontdíjat.
- Két munkakör, négy jelölt: Ray és Jo szerelő ($210/$420 hetente), Kim és Alex értékesítő ($175/$350). Skill, Speed, Reliability, Salary. Sebességből napi 6-7 óra; szerelői sebesség a hosszabb munkát rövidíti, skill a javított állapotot javítja; megbízhatóság mentett időpont/azonosító alapján késést vagy elmaradt visszahívást okozhat. Nincs titkos vevői plafon olvasása.
- Kezdő telken 1 alkalmazott; legalább 4 férőhelynél 2, Service Centernél 3, Fleet Workshopnál 4. Az alkalmazottak bére szünetelő üzletág mellett is jár; a keretet meghaladó régi személyzetet nem bocsátja el automatikusan.
- Felvételhez egyheti rezsi, meglévő és új bér, valamint a már megszolgált bérek fedezete kell. Ez nem kifizetés, csak likviditási feltétel.
- Heti bérfizetés, naponta időarányos bérteher. Heti ciklus a migráció/új játék napjától. Elbocsátáskor a részarányos bért ki kell fizetni. Fizetetlen bér tartozásként marad, csökkenti a nettó cégértéket és blokkolja a további delegált munkát. A tulajdonos tovább dolgozhat.
- Munkasor: konkrét autó, feladat, felelős. Napzáráskor prioritási sorrendben indul; sorba állításkor nincs pénzlevonás. Javítás csak szabad közös műhelyhellyel, munkaidővel és pénzzel indul. Áremelkedés után új jóváhagyás/újrafoglalás szükséges. A várakozás oka látszik; előresorolás és törlés lehetséges.
- Folyamatban lévő hosszabb javítás a következő napon is leköt 3 órát a felelősnél. Kilépő alkalmazott már elkezdett munkája a mentett időzítéssel, külső segítséggel befejeződik; várakozó feladata a tulajdonoshoz kerül.
- Routine ON: a szerelő az engedélyezett javítási és ügyfélmunka-foglalásokat végzi; az értékesítő napzáráskor vevői kérdésekre válaszol és hirdetési előkészítést végez. Konkrét feladat kézzel is kiosztható. Az értékesítő nem hirdet, nem módosítja az árat és nem ad el önállóan.
- Az értékesítő előkészítése kiváltja az első hirdetés 2 tulajdonosi munkaóráját. Újrahirdetés ingyenes időben. Junior munkatárs konzervatívabb ajánlatot készít; a játékos dönthet a személyes tárgyalás mellett.
- Ugyanaz a saját/ügyfélműhely, ugyanaz a foglaltság, költség és elkészülési nap. Rush továbbra is 1 nap, külön külső műhely, felár, saját munkaóra nélkül.

## Pénzügyek

Cash, becsült inventory value, nettó cégérték és hitel megmarad. Új Last 7 days: revenue, direct deal costs, contribution, közös üzemeltetés, egyéb kiadások, megszolgált payroll, kamat, business result, tényleges cash change.

A készletvásárlás cash outflow, eredményben csak az eladott autó bekerülése szerepel. Az autónkénti holding a deal contribution része, ezért a közös üzemeltetésből kivonjuk. A reklamáció kifizetése az aktuális időszak eredményét terheli. A még meg nem vett autó új átvizsgálása költség; vásárláskor ezt átsoroljuk a készlet bekerülésébe. Bér az eredményben naponta, cash flowban tényleges fizetéskor jelenik meg. Beruházás és hiteltőke cash flow, kamat eredménytétel. Az eszközök átértékelése nem része a működési eredménynek; a nettó cégértékben jelenik meg.

A korábbi mentéshez nincs visszamenőleges bér vagy munkaidő. A korábbi üzemeltetési accrual-részletek hiányozhatnak az első hét áttekintéséből; a felület ezt jelzi.

A Service Center/Fleet alapdíja már tartalmaz külsős munkadíjat. A felvett szerelő napi bérének fele helyettesíti ezt az allowance-t, összesen legfeljebb $60/$160 naponta. A teljes alkalmazotti bért egyszer számoljuk el. A megmaradó facility díj a rezsit, eszközt és további külsős segítséget fedezi. Üres műhelyben is vannak fix költségek.

A cash buffer hét napnyi ismert rezsit, reklámot, időarányos új bért, már megszolgált béreket és rezsihátralékot von le; új eladást nem feltételez. Ez konzervatív becslés, nem garantált előrejelzés.

## Három helyzet

A. $5,000, két autóhely, alkalmazott nélkül: az átvizsgálást és az első hirdetést te intézed. Nem kell alkalmazott a vételhez vagy eladáshoz. Tarts készpénzt javításra és legalább egy hét rezsire.

B. $8,000, rendszeresen várakozó javítás: Ray $210/hetes bére akkor indokolható, ha a te időd valóban szűk keresztmetszet. Nem ad új műhelyhelyet. Ritka javításnál a rush felár lehet olcsóbb a folyamatos bérnél.

C. Nyitott Service Center, több autó, Jo + Kim: Jo a közös helyeken javít, Kim kérdéseket válaszol és előkészít. Heti $595 bér mellett ügyfélalkatrész-előleg, üzemeltetés és készletlekötés is versenyez a cashért. Előresorolhatod a vevővel rendelkező autót az alacsony keresletű készlet elé.

## Balanszmérés és korlátok

30 determinisztikus futás, 180 nap/futás, 5 mag, 3 stratégia, 2 lépték. Összesen 5,400 nap. Ugyanaz a nyilvános információra építő vásárlási/tárgyalási politika, eltérő munkaellátás: solo / korai Jo / outsource. A nagyobb lépték $35k induló cash, 6 készlethely és aktív Service Center teszt-fixture; nem új kezdőjáték vagy feloldható új telephely. Nincs titkos állapotból választott vétel.

Az alacsony forgalmú kezdőmintában a solo átlagos végső nettó értéke $4,369, a korai drága alkalmazotté -$7,244, a rendszeres rushé $317. A növekvő műhelymintában $83,340 / $154,508 / $98,339. A negatív nettó érték kötelezettség, nem negatív cash. A munkatársat tartósan megtartó bot szándékosan nem menti meg magát elbocsátással: ez túlzott fixköltség-stresszteszt.

Ez nem bizonyítja a teljes játék optimális balanszát. A ritka kezdőforgalom nem nő automatikusan; javítás és rossz vétel könnyen megeszi a margin-t. A service fixture nagy kapacitásán Jo lényegesen jobb áteresztést ad. Következő hangolási pont: szerelő sebességelőnye és facility munkadíj-helyettesítés, korai bérek megtérülési ideje, értékesítő szerepe hosszú emberi játékban. Nincs minden tesztelt környezetben győztes egyetlen stratégia.

Nyers adatok: [management-simulation.json](reports/management-simulation.json). Korábbi 25 x 200 napos trading szimuláció is fut a teljes új betöltési sorrenddel.

## Ellenőrzés

17 új management integrációs teszt és új management UI-folyamat. Meglévő gazdasági/kereskedési és UI tesztek. Valódi Chrome: 1366 x 768, kezdőképernyő görgetés nélkül, felvétel, delegált vizsgálat és Finance, böngészőhiba nélkül. A hosszú panelek belül görgethetők; a pixel art és a navigáció szerkezete megmaradt.

Képek: [Overview](reports/v013-overview.png), [Staff](reports/v013-staff.png), [Finance](reports/v013-finance.png).
