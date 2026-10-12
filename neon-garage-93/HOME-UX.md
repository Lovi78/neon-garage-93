# Garage-first főképernyő

Ez a korábbi Garage-first kör feljegyzése. A jelenlegi, XP/REP HUD-ot és hat belépőt tartalmazó felületet a [Premium Retro UX](UX-REDESIGN.md) írja le.

2026. október 12. A v0.13 játékmechanikájára épülő, kizárólag felületi finomítás.

- Kompakt fejléc: kisebb logó, Cash, Garage, dátum és jól látható Next Day.
- Öt kategória: Garage / Market / My Cars / Deals / Business.
- Business menü: Operations, Finance, Customers, Business upgrades, Dealer File, Collection. Egy vagy két kattintás; a garázs eredeti tárgyai is ugyanoda vezetnek.
- Üres Today's Priorities helyett nincs sáv. Megoldatlan ajánlat, lejárat, elkészült és nem hirdetett javítás, esedékes megbízás és pénzügyi probléma esetén kompakt értesítés jelenik meg. Olvasás után is megmarad az ajánlat; fizetés vagy lezárás után eltűnik a megfelelő értesítés.
- XP, skillek és részletes reputáció a Dealer File alatt. Elkölthető skillpont esetén visszafogott, kattintható jelzés, amely a pont elköltéséig megmarad.
- Közös szélességű, középre rendezett fejléc, navigáció és garázs. A hír részletei és az Options lenyithatók; a rádió megmaradt.
- A grafika, animációk, hotspotok, gazdasági modulok és a mentési adatmodell változatlanok. A menük nyitottsága nem kerül a mentésbe.

## Valódi Chrome-mérés, új játék, értesítés nélkül

| Kijelző | Garázs teteje előtte / utána | Grafika magassága előtte / utána | Grafika területnövekedése |
|---|---|---|---|
| 1440 x 900 | 236 / 116 px | 525 / 675 px | kb. 65% |
| 1280 x 800 | 245 / 116 px | 425 / 575 px | kb. 83% |
| 390 x 844 | 440 / 132 px | 201 / 201 px | változatlan szélesség, lényegesen korábbi megjelenés |

Mindkét laptopméreten kifér a teljes főképernyő. Mobilon a teljes, változatlan 16:9 garázskép látszik, vágás és torzítás nélkül. 320, 375, 390 és 768 px szélességnél is ellenőrzött navigáció; nincs vízszintes túllógás. Értesítésekkel a garázs a rendelkezésre álló helyhez igazodik.

## Képek

- 1440 px: [előtte](reports/home-before-1440.png), [utána](reports/home-after-1440.png).
- 1280 px: [előtte](reports/home-before-1280.png), [utána](reports/home-after-1280.png).
- Mobil: [előtte](reports/home-before-390.png), [utána](reports/home-after-390.png).
- [Aktív értesítések](reports/home-after-alerts.png).

## Ellenőrzés

- A meglévő teljes funkcionális tesztkör: 128 sikeres ellenőrzés.
- A 19 meglévő UI-folyamat és 3 új célzott főképernyő-teszt sikeres. Kizárólag a két, már megszüntetett fejléc-/XP-megjelenítésre vonatkozó régi elvárás változott.
- Az új tesztek: öt kategória, összes célpont, változatlan mentés, Escape/külső kattintás, skillpont-jelzés, tartós és rendezéskor megszűnő értesítések.
- Chrome: minden korábbi nézet, a hét garázstárgy nézetváltása, rádió, óra/napzárás megszakítása, Options/új játék megszakítása, lenyitható hírek. Az ellenőrzés nem módosította a játékállást.
- Meglévő szimulációk: 25 x 200 + 30 x 180 nap, változatlan gazdasági eredmények. Ez regressziós ellenőrzés, nem új balanszhangolás.

Naplók: [funkcionális](reports/home-test-output.txt), [UI](reports/home-ui-output.txt), [szimuláció](reports/home-simulation-output.txt).
