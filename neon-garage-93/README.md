# Neon Garage '93 - v0.3 / Negotiation

Játszható, körökre osztott autókereskedő-játék. Angol játékfelület, fiktív kaliforniai város, 1993. június 1., $5,000 kezdőtőke, két férőhely.

A teljes játékfelület angol. A korábbi mentések eseményei, hibaleírásai és pénzügyi bejegyzései betöltéskor angolra váltanak, a játékállás megtartásával.

A teljes fejlesztési irány, a következő szakaszok és a nyitott döntések a [ROADMAP.md](ROADMAP.md) dokumentumban vannak rögzítve.

## Indítás

Nyisd meg az `index.html` fájlt Chrome-ban, Edge-ben, Firefoxban vagy Safariban. Nincs szükség telepítésre, regisztrációra, adatbázisra vagy játékszerverre.

Macen az `Indítás.command` fájlra is kattinthatsz kétszer. Ha a rendszer blokkolja ezt, nyisd meg közvetlenül az `index.html` fájlt.

A játék minden változtatás után a böngésző helyi tárhelyére ment. Ugyanabban a böngészőben, ugyanarról a helyről nyisd újra a fájlt. Privát ablak vagy a böngészőadatok törlése miatt a mentés elveszhet. Ha a tárolás nem engedélyezett, a játék figyelmeztet.

## Az első üzleted

1. Kattints a garázs bal oldalán álló **számítógépre**. Ez nyitja meg a **Car Market** ablakot. A Golf GTI, Volvo 240 és Honda CRX a kezdőtőkéhez igazodó belépőmodellek.
2. Kattints egy autóra. Az eladó állapotleírása és az abból készült értékbecslés tévedhet.
3. A **$90-os átvizsgálás** megmutatja az alkatrészek állapotát és a rejtett hibákat. A díjat akkor is kifizetted, ha végül nem veszed meg az autót.
4. Vásárolj. A piac bezáródik, és a megvett autó animációval begurul a garázsba. A készpénz és a két férőhely valódi korlát. Maradjon pénz a javításokra.
5. Kattints a beállóban álló autóra az adatlapjához, vagy a **műhelyasztalra** a **My Inventory** ablakhoz. Itt választhatsz javítást. Minden műhelymunka egy napot vesz igénybe. A javítás 95%-ra emeli az adott alkatrész állapotát; a hibajavítás külön költsége előre látszik. Újonnan felfedezett hiba esetén először új árat kapsz, automatikus pluszlevonás nincs.
6. Állíts be hirdetési árat, majd kattints a **Next Day** gombra vagy a faliórára. Az érdeklődő ajánlatát elfogadhatod vagy elutasíthatod. Magas árnál ritkább az érdeklődés.
7. Azonnali pénzhez a kereskedőnek is eladhatsz, a valós napi piaci érték 72%-áért. Javítás alatt nem lehet eladni.

Nincs időnyomás vagy automatikus napváltás. A következő nap lecseréli a piaci hirdetéseket és a korábbi ajánlatokat. Javítás előtt vedd le a hirdetést.

## Alku vásárlásnál és eladásnál

Az autó piaci adatlapján a **Your offer** mezőbe írj egy összeget, majd kattints a **Make offer** gombra. Az eladó elfogadhatja, ellenajánlatot adhat, vagy sértően alacsony ajánlatnál végleg visszaléphet az aznapi üzlettől. Legfeljebb három kör van; újabb körben emelned kell a saját ajánlatodat. Az **Accept & buy** gombbal a látható kialkudott áron vásárolsz. Az eredeti áron továbbra is vásárolhatsz alku nélkül.

A beérkező vevői ajánlatnál a **Your counteroffer** mezőben kérhetsz magasabb árat, legfeljebb a meghirdetett összegig. A **Counteroffer** gombra a vevő elfogadhatja az árat, adhat egy végső ajánlatot, vagy távozhat. Az **Accept** gomb zárja le az eladást a válaszban szereplő áron. A kereskedő azonnali ára fix; alkudni a magánvevőkkel lehet.

Az alku közben nincs pénzmozgás. A kialkudott vételár és eladási ár szerepel a profitban és a pénzmozgások között. A tárgyalás mentődik, újranyitással nem kap új árkorlátot vagy köröket. Napváltáskor a hirdetések és ajánlatok szokás szerint lecserélődnek.

## Működő rendszerek

- Tíz, 1993-ban vagy korábban létező modell; naponta kilenc hirdetés.
- Évjárat, mérföldben megadott futás, eladói állítás, valós állapot és rejtett hibák.
- Vásárlás, átvizsgálás, ötféle javítás, hirdetés, vevői ajánlat és azonnali eladás.
- Garázskapacitás, hírnév, változó kereslet és négy gazdasági piaci esemény.
- Javítás során feltárható rejtett hibák.
- Pénzmozgások és eladásonkénti profit. Automatikus mentés és megerősítést kérő újrakezdés.
- Pixel art garázs, tíz külön autósprite, begurulási animáció és javítási szikrák.
- Tárgyakra épülő kezelés: számítógép = piac, műhelyasztal = készlet, főkönyv = pénzügyek, falióra = napváltás.
- A grafikák a projektben vannak; nincs külső képszolgáltatás vagy betűkészlet-letöltés.

**Profit = eladási ár - vételár - az adott autó vizsgálatai - javításai.** A meg nem vett autók vizsgálatai külön kiadásként csökkentik a készpénzt és a vagyont. A pénzügyi oldalon a vagyon készpénz + készlet azonnali kereskedői értéken. Az árak játékegyensúlyhoz igazított dollárösszegek, nem történelmi árjegyzék.

## Felépítés

- `js/cars.js`: modelladatok, alkatrészek, hibák, autóillusztrációk.
- `js/economy.js`: árak, vásárlás, javítás, eladás, napok és események.
- `js/negotiation.js`: vételi és eladási alku, mentett árkorlátok és körök.
- `js/state.js`: új játék, dátum, helyi mentés és visszatöltés.
- `js/ui.js`: ablakok, adatlapok és gombok.
- `js/scene.js`: interaktív garázs, sprite-kiosztás és beállók.
- `pixel.css`: jelenet, pixel felület és animációk.
- `assets/`: helyi grafikai fájlok és a generáláshoz használt promptok.
- `styles.css`: arculat, garázsjelenet és kisebb képernyőkre igazított elrendezés.

A játék keretrendszer, külső betűkészlet és csomagtelepítés nélkül fut. A mozgáscsökkentést kérő rendszerbeállítást tiszteletben tartja.

## Ellenőrzés

A gazdasági tesztek futtatása, ha van Node.js: `node tests/economy.test.cjs`.

Ellenőrzött: indulás és elérhető belépőmodellek 500 új kínálatban, kapacitás és készpénzkorlát, dupla műveletek tiltása, vizsgálati díj, rejtett hiba, javítás ideje és ára, napi kereslet, ajánlatok érvényessége, profitképlet és mentési adatok visszatöltése. További 1000 szimulált üzlet ellenőrzi a pénzmozgások egyezőségét és a nyereség/veszteség lehetőségét.

A pixel garázs felületi működéstesztje ellenőrizte a számítógépről megnyíló piacot, az érkező autó animációs állapotát és a garázsból megnyíló autóadatlapot. Emellett végigment a piac, adatlap, vizsgálat, vétel, javítás, napváltás, hirdetés, ajánlat, eladás és pénzügyek útvonalán. Külön ellenőrizte az új oldalpéldányba történő mentés-visszatöltést, az újrakezdés megszakítását és az új játékot. Ez DOM-alapú szerkezet- és interakcióteszt, nem valódi böngészős képi ellenőrzés. Fejlesztőknek: `npm install`, majd `npm run test:ui`. A játék futtatásához ezek nem szükségesek.

Az alku külön tesztjei ellenőrizték az elfogadást, ellenajánlatot, végső árat, visszalépést, hibás összegeket, körkorlátot, mentés-visszatöltést és a kialkudott árhoz tartozó profitot. A teljes felületi útvonalon vételi és eladási alku is szerepel.

## Korlátok és következő lépések

A v0.3-ban nincs garázsbővítés, személyzet vagy több telephely. Nincs automatikus csődvége: ha kifogysz a pénzből, eladhatod a készleted vagy újrakezdhetsz. A mentés a böngészőhöz kötődik. A beépített böngésző helyi fájlokat tiltó szabálya miatt valódi böngészőben a vizuális elrendezés nem volt ellenőrizhető ebben a fejlesztési körben.

A következő javasolt kör az XP, a személyes skillek és perkek, az érezhető reputációs előnyök, valamint a szerelést és marketinget javító vállalkozásfejlesztések. A több beálló későbbi lehetőség. A nagy autóállomány, a helyi események és a történelmi hírek részletes sorrendjét a [roadmap](ROADMAP.md) tartalmazza.
