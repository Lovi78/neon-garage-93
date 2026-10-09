# Neon Garage '93 - v0.1

Játszható, körökre osztott autókereskedő-játék. Angol játékfelület, fiktív kaliforniai város, 1993. június 1., $5,000 kezdőtőke, két férőhely.

A teljes játékfelület angol. A korábbi mentések eseményei, hibaleírásai és pénzügyi bejegyzései betöltéskor angolra váltanak, a játékállás megtartásával.

## Indítás

Nyisd meg az `index.html` fájlt Chrome-ban, Edge-ben, Firefoxban vagy Safariban. Nincs szükség telepítésre, regisztrációra, adatbázisra vagy játékszerverre.

Macen az `Indítás.command` fájlra is kattinthatsz kétszer. Ha a rendszer blokkolja ezt, nyisd meg közvetlenül az `index.html` fájlt.

A játék minden változtatás után a böngésző helyi tárhelyére ment. Ugyanabban a böngészőben, ugyanarról a helyről nyisd újra a fájlt. Privát ablak vagy a böngészőadatok törlése miatt a mentés elveszhet. Ha a tárolás nem engedélyezett, a játék figyelmeztet.

## Az első üzleted

1. Nyisd meg az **Car Market** képernyőt. A Golf GTI, Volvo 240 és Honda CRX a kezdőtőkéhez igazodó belépőmodellek.
2. Kattints egy autóra. Az eladó állapotleírása és az abból készült értékbecslés tévedhet.
3. A **$90-os átvizsgálás** megmutatja az alkatrészek állapotát és a rejtett hibákat. A díjat akkor is kifizetted, ha végül nem veszed meg az autót.
4. Vásárolj. A készpénz és a két férőhely valódi korlát. Maradjon pénz a javításokra.
5. A **My Inventory** adatlapján választhatsz javítást. Minden műhelymunka egy napot vesz igénybe. A javítás 95%-ra emeli az adott alkatrész állapotát; a hibajavítás külön költsége előre látszik. Újonnan felfedezett hiba esetén először új árat kapsz, automatikus pluszlevonás nincs.
6. Állíts be hirdetési árat, majd lépj a **Next Day** gombra. Az érdeklődő ajánlatát elfogadhatod vagy elutasíthatod. Magas árnál ritkább az érdeklődés.
7. Azonnali pénzhez a kereskedőnek is eladhatsz, a valós napi piaci érték 72%-áért. Javítás alatt nem lehet eladni.

Nincs időnyomás vagy automatikus napváltás. A következő nap lecseréli a piaci hirdetéseket és a korábbi ajánlatokat. Javítás előtt vedd le a hirdetést.

## Működő rendszerek

- Tíz, 1993-ban vagy korábban létező modell; naponta kilenc hirdetés.
- Évjárat, mérföldben megadott futás, eladói állítás, valós állapot és rejtett hibák.
- Vásárlás, átvizsgálás, ötféle javítás, hirdetés, vevői ajánlat és azonnali eladás.
- Garázskapacitás, hírnév, változó kereslet és négy gazdasági piaci esemény.
- Javítás során feltárható rejtett hibák.
- Pénzmozgások és eladásonkénti profit. Automatikus mentés és megerősítést kérő újrakezdés.
- Helyben generált SVG-autóillusztrációk és CSS-garázs; nincs külső képszolgáltatás.

**Profit = eladási ár - vételár - az adott autó vizsgálatai - javításai.** A meg nem vett autók vizsgálatai külön kiadásként csökkentik a készpénzt és a vagyont. A pénzügyi oldalon a vagyon készpénz + készlet azonnali kereskedői értéken. Az árak játékegyensúlyhoz igazított dollárösszegek, nem történelmi árjegyzék.

## Felépítés

- `js/cars.js`: modelladatok, alkatrészek, hibák, autóillusztrációk.
- `js/economy.js`: árak, vásárlás, javítás, eladás, napok és események.
- `js/state.js`: új játék, dátum, helyi mentés és visszatöltés.
- `js/ui.js`: képernyők és gombok.
- `styles.css`: arculat, garázsjelenet és kisebb képernyőkre igazított elrendezés.

A játék keretrendszer és csomagtelepítés nélkül fut. A Google Fonts betűkészletei opcionálisak; offline a beépített betűk helyettesítik őket.

## Ellenőrzés

A gazdasági tesztek futtatása, ha van Node.js: `node tests/economy.test.cjs`.

Ellenőrzött: indulás és elérhető belépőmodellek 500 új kínálatban, kapacitás és készpénzkorlát, dupla műveletek tiltása, vizsgálati díj, rejtett hiba, javítás ideje és ára, napi kereslet, ajánlatok érvényessége, profitképlet és mentési adatok visszatöltése. További 1000 szimulált üzlet ellenőrzi a pénzmozgások egyezőségét és a nyereség/veszteség lehetőségét.

A felületi működésteszt végigment a piac, adatlap, vizsgálat, vétel, javítás, napváltás, hirdetés, ajánlat, eladás és pénzügyek útvonalán. Külön ellenőrizte az új oldalpéldányba történő mentés-visszatöltést, az újrakezdés megszakítását és az új játékot. Ez DOM-alapú szerkezet- és interakcióteszt, nem valódi böngészős képi ellenőrzés. Fejlesztőknek: `npm install`, majd `npm run test:ui`. A játék futtatásához ezek nem szükségesek.

## Korlátok és következő lépések

A v0.1-ben nincs garázsbővítés, alkudozás, személyzet vagy több telephely. Nincs automatikus csődvége: ha kifogysz a pénzből, eladhatod a készleted vagy újrakezdhetsz. A mentés a böngészőhöz kötődik. A beépített böngésző helyi fájlokat tiltó szabálya miatt valódi böngészőben a vizuális elrendezés nem volt ellenőrizhető ebben a fejlesztési körben.

Javasolt sorrend:

1. Garázsbővítés és üzleti fejlődés, a megszerzett hírnévhez kötve.
2. Alkudozás és eltérő vevőtípusok, konkrét igényekkel.
3. Tartós piaci trendek és javítás előtti várható megtérülés.
