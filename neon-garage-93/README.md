# Neon Garage '93 - v0.5 / Showroom

Játszható, körökre osztott autókereskedő-játék. Angol játékfelület, fiktív kaliforniai város, 1993. június 1., $5,000 kezdőtőke, két férőhely.

A teljes játékfelület angol. A korábbi mentések eseményei, hibaleírásai és pénzügyi bejegyzései betöltéskor angolra váltanak, a játékállás megtartásával.

A teljes fejlesztési irány, a következő szakaszok és a nyitott döntések a [ROADMAP.md](ROADMAP.md) dokumentumban vannak rögzítve.

## Indítás

Nyisd meg az `index.html` fájlt Chrome-ban, Edge-ben, Firefoxban vagy Safariban. Nincs szükség telepítésre, regisztrációra, adatbázisra vagy játékszerverre.

Macen az `Indítás.command` fájlra is kattinthatsz kétszer. Ha a rendszer blokkolja ezt, nyisd meg közvetlenül az `index.html` fájlt.

A játék minden változtatás után a böngésző helyi tárhelyére ment. Ugyanabban a böngészőben, ugyanarról a helyről nyisd újra a fájlt. Privát ablak vagy a böngészőadatok törlése miatt a mentés elveszhet. Ha a tárolás nem engedélyezett, a játék figyelmeztet.

## Az első üzleted

1. Kattints a garázs bal oldalán álló **számítógépre**. Ez nyitja meg a **Car Market** ablakot. A Golf GTI, Volvo 240 és Honda CRX a kezdőtőkéhez igazodó belépőmodellek. A teljes adatbázis 30 modelles; a napi kínálat továbbra is 9 hirdetésből áll. Régi mentésben a húsz új modell a következő napváltástól kerülhet a piacra.
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

## Fejlődés és vállalkozásfejlesztések

Kattints a garázsban a **Dealer File** irodai mappára, vagy a felső fejlődési sávra.

- Lezárt, sikeres vételi és eladási alkuért 20 XP + minden $100 árelőny után 1 XP jár, legfeljebb 40 XP. Vételnél az eredeti hirdetési árhoz, eladásnál a vevő első ajánlatához képest számítjuk az előnyt. XP csak a tényleges tranzakciókor jár, egyszer; elutasításért és azonnali kereskedői eladásért nem.
- Az első szintlépéshez 80 XP kell, utána szintenként 40-nel nő az igény. A szintlépés 1 skillpontot ad, a többlet-XP megmarad.
- **Negotiation**: három rang, rangonként 1 skillpont. Új tárgyalásban rangonként a hirdetési ár 1%-ával alacsonyabb eladói minimum és a nyitó ajánlat 1%-ával magasabb vevői alkukeret. A már folyó tárgyalások korlátai változatlanok.
- **One More Shot**: Negotiation 2 után 1 skillpontért. Négy eladói alkukör a korábbi három helyett. A lezárt tárgyalást és a távozó eladót nem nyitja újra; magánvevői tárgyalásban nem ad új kört.
- **Better Tools**: $600, a javítás munkadíja 15%-kal alacsonyabb.
- **Parts Supplier Deal**: $900, a javítás alkatrészrésze és a feltárt hibák alkatrészköltsége 20%-kal alacsonyabb. Az alapjavítás munkadíj/alkatrész bontása 65/35; a kijelzett és levont ár a kedvezményeket tartalmazza.
- **Local Newspaper Ad**: $450 egyszeri befektetés. Ezután bekapcsolható és szüneteltethető a kampány: napi $20, +15 százalékpont érdeklődési esély. A napi díj napváltáskor jelentkezik, és pénzhiánynál automatikusan leáll a kampány. Nem keletkezik tartozás.

Reputációs mérföldkövek: 0 **Unknown Dealer**, 5 **Familiar Face**, 15 **Trusted Dealer**, 30 **Established Business**, 50 **Local Legend**. Az érdeklődés bónusza sorrendben 0, 3, 7, 12 és 18 százalékpont. A hirdetési ár továbbra is befolyásolja az érdeklődést; ajánlat nincs garantálva. A reputáció új tárgyalásokban továbbra is segít, legfeljebb 2% árkorlát-bónusszal. A **Dealer File** mutatja a következő célhoz hiányzó pontokat.

A régi v0.3-mentések megtartják a készpénzt, autókat és tárgyalásokat. Az új fejlődési adatok 1. szinttel, 0 XP-vel és fejlesztés nélkül indulnak. A korábbi üzletekre nincs utólag kitalált XP-jutalom.

A business upgrade és a reklám általános kiadásként szerepel a pénzügyekben; nem kerül automatikusan egyetlen autó profitjába. Az autóprofit továbbra is eladás mínusz vétel, vizsgálat és javítás.

## Fejlődési sávok és pénzügyi grafikon

A felső sávban az XP és a következő reputációs mérföldkő is követhető. A Dealer File-ban a Negotiation rang, a perk rangkövetelménye és a business upgrade megfizethetősége is sávot kapott. A készpénzsáv azt jelzi, megengedheted-e a fejlesztést; nem jelent félretett pénzt vagy automatikus vásárlást.

A **Ledger** ablak két vonallal mutatja a **Trading profit** és **Business value** alakulását. A profit a lezárt autóüzletek eredménye; a vállalkozás értéke készpénz + készlet azonnali kereskedői értéken. A fejlesztések és a reklám kiadásként csökkentik az értéket; becsült márkaértéket nem adunk hozzá.

Naponként egy pont van. A mai pont minden művelet után frissül, a korábbi napok megmaradnak. A pontok fölé vitt egér vagy a billentyűzetes fókusz pontos dátumot és összegeket mutat. Új játékban $5,000 érték és $0 profit az indulópont. Korábbi mentésben a grafikon a mostani játéknaptól indul: hiányzó régi készletértékeket nem becslünk vissza.

## A 30 modelles katalógus

A [MODEL-CATALOG.md](MODEL-CATALOG.md) listázza mind a 30 modellt és a játékban használt évjáratokat. A húsz új autó között RX-7, Supra, 240SX, AE86, Civic, Integra, Celica, 3000GT, 280ZX, 323 GTX, Porsche 944 és 911, Mercedes 190E, Audi Quattro, Peugeot 205 GTI, Corvette, Firebird, Grand National, Dodge Stealth és Jeep Cherokee szerepel.

Az új modellek szervizszorzója és generáláskor alkalmazott hibakockázata eltér. Ezek játékegyensúlyhoz választott értékek, nem történelmi statisztikák. A szervizszorzó az adatlapon látható, a meglévő javítási kedvezmények továbbra is érvényesek. Az eredeti modellek azonosítói és mentett autói megmaradnak.

A húsz új sprite és a generáló promptok az [EXPANSION-V05.md](assets/EXPANSION-V05.md) szerint vannak tárolva. A képek átlátszó hátterű, helyi atlaszok; a modellenként külön PNG-állomány későbbi feladat marad.

## Működő rendszerek

- XP, szintlépés, Negotiation skill, One More Shot perk és három vállalkozásfejlesztés.
- Látható reputációs mérföldkövek és érezhető érdeklődési bónuszok.
- Harminc, 1993-ban vagy korábban létező modell; naponta kilenc hirdetés.
- Évjárat, mérföldben megadott futás, eladói állítás, valós állapot és rejtett hibák.
- Vásárlás, átvizsgálás, ötféle javítás, hirdetés, vevői ajánlat és azonnali eladás.
- Garázskapacitás, hírnév, változó kereslet és négy gazdasági piaci esemény.
- Javítás során feltárható rejtett hibák.
- Pénzmozgások és eladásonkénti profit. Automatikus mentés és megerősítést kérő újrakezdés.
- Pixel art garázs, harminc külön autósprite, begurulási animáció és javítási szikrák.
- Tárgyakra épülő kezelés: számítógép = piac, műhelyasztal = készlet, főkönyv = pénzügyek, falióra = napváltás.
- A grafikák a projektben vannak; nincs külső képszolgáltatás vagy betűkészlet-letöltés.

**Profit = eladási ár - vételár - az adott autó vizsgálatai - javításai.** A meg nem vett autók vizsgálatai külön kiadásként csökkentik a készpénzt és a vagyont. A pénzügyi oldalon a vagyon készpénz + készlet azonnali kereskedői értéken. Az árak játékegyensúlyhoz igazított dollárösszegek, nem történelmi árjegyzék.

## Felépítés

- `js/cars.js`: modelladatok, alkatrészek, hibák, autóillusztrációk.
- `js/economy.js`: árak, vásárlás, javítás, eladás, napok és események.
- `js/negotiation.js`: vételi és eladási alku, mentett árkorlátok és körök.
- `js/state.js`: új játék, dátum, helyi mentés és visszatöltés.
- `js/finance.js`: napi érték- és profitsnapshotok, vonaldiagram és fejlődési sávok.
- `js/progression.js`: XP, szintek, skill, perk, vállalkozásfejlesztések, marketing és reputációs mérföldkövek.
- `js/ui.js`: ablakok, adatlapok és gombok.
- `js/scene.js`: interaktív garázs, sprite-kiosztás és beállók.
- `pixel.css`: jelenet, pixel felület és animációk.
- `assets/`: helyi grafikai fájlok és a generáláshoz használt promptok.
- `styles.css`: arculat, garázsjelenet és kisebb képernyőkre igazított elrendezés.

A játék keretrendszer, külső betűkészlet és csomagtelepítés nélkül fut. A mozgáscsökkentést kérő rendszerbeállítást tiszteletben tartja.

## Ellenőrzés

A gazdasági tesztek futtatása, ha van Node.js: `npm test` (16 eredeti gazdasági + 8 fejlődési + 7 pénzügyi/katalógusteszt).

Ellenőrzött: indulás és elérhető belépőmodellek 500 új kínálatban, kapacitás és készpénzkorlát, dupla műveletek tiltása, vizsgálati díj, rejtett hiba, javítás ideje és ára, napi kereslet, ajánlatok érvényessége, profitképlet és mentési adatok visszatöltése. További 1000 szimulált üzlet ellenőrzi a pénzmozgások egyezőségét és a nyereség/veszteség lehetőségét.

A pixel garázs felületi működéstesztje ellenőrizte a számítógépről megnyíló piacot, az érkező autó animációs állapotát és a garázsból megnyíló autóadatlapot. Emellett végigment a piac, adatlap, vizsgálat, vétel, javítás, napváltás, hirdetés, ajánlat, eladás és pénzügyek útvonalán. Külön ellenőrizte az új oldalpéldányba történő mentés-visszatöltést, az újrakezdés megszakítását és az új játékot. Ez DOM-alapú szerkezet- és interakcióteszt, nem valódi böngészős képi ellenőrzés. Fejlesztőknek: `npm install`, majd `npm run test:ui`. A játék futtatásához ezek nem szükségesek.

Az alku külön tesztjei ellenőrizték az elfogadást, ellenajánlatot, végső árat, visszalépést, hibás összegeket, körkorlátot, mentés-visszatöltést és a kialkudott árhoz tartozó profitot. A teljes felületi útvonalon vételi és eladási alku, XP és szintlépés, skillpontköltés, perkfeloldás, mindhárom vállalkozásfejlesztés és reklámaktiválás is szerepel. A teszt ellenőrzi a fejlesztések jeleneten megjelenő elemeit, a napi díjat, a mentést és az új játékot is. Ez továbbra is működésteszt, nem valódi böngészős vizuális ellenőrzés.

## Korlátok és következő lépések

A v0.5-ben nincs garázsbővítés, személyzet vagy több telephely. Nincs automatikus csődvége: ha kifogysz a pénzből, eladhatod a készleted vagy újrakezdhetsz. A mentés a böngészőhöz kötődik. A beépített böngésző helyi fájlokat tiltó szabálya miatt valódi böngészőben a vizuális elrendezés nem volt ellenőrizhető ebben a fejlesztési körben.

Az első fejlődési kör elkészült. A kínálat 30 modellre bővült, és elkészültek az áttekinthetőséget javító sávok és a pénzügyi grafikon. A következő tartalmi körben a gyűjtőalbum és a további bővítés előkészítése következhet. A további skillágak, perkek és vállalkozásfejlesztések a roadmapben maradnak. A több beálló későbbi lehetőség. A nagy autóállomány, a helyi események és a történelmi hírek részletes sorrendjét a [roadmap](ROADMAP.md) tartalmazza.
