# Neon Garage '93 - v0.10 / Local Opportunities

Játszható, körökre osztott autókereskedő-játék. Angol játékfelület, fiktív kaliforniai város, 1993. június 1., $5,000 kezdőtőke, két férőhely.

A teljes játékfelület angol. A korábbi mentések eseményei, hibaleírásai és pénzügyi bejegyzései betöltéskor angolra váltanak, a játékállás megtartásával.

A teljes fejlesztési irány, a következő szakaszok és a nyitott döntések a [ROADMAP.md](ROADMAP.md) dokumentumban vannak rögzítve.

A kattintható tárgyakat állandó, finom mentazöld pixel sarokjelölés emeli ki. Rámutatáskor vagy billentyűzetes kijelöléskor aranyszínű lesz és megjelenik a funkció neve. A saját autók sziluettje is enyhe jelölést kap. Az alsó súgó a számítógéphez irányítja az első játékost; a napváltási jelenetben a jelölések nem látszanak.

## Helyi döntések és vevői megbízások - v0.10

Az **Operations** clipboard ablakban vannak. Új meghívásnál vagy megbízásnál külön jelzés jelenik meg a garázs fölött, és a napi jelentés is felsorolja az új lehetőségeket, lejáratokat és aktív határidőket. Nem minden nap történik valami: egy jogosult reggelen 35% az esemény és 25% a megbízás esélye. Az események között legalább 3, a megbízások között legalább 4 nap telik el. Mentés/betöltés nem sorsolja őket újra. A régi mentésben nincs visszamenőleges esemény vagy jutalom.

### Nyolc helyi meghívás

| Esemény | Egyszeri díj | Hatás |
| --- | ---: | --- |
| Supplier prepay offer | $120 | A következő 3 javítás teljes árából 20% kedvezmény, legfeljebb 5 napig. Kis javításokon nem feltétlenül térül meg. |
| Silver Palms car meet | $80 | A következő 2 reggelen +20 százalékpont vevőérkezési esély; aznap új normál javítás nem foglalható. |
| Neighborhood flyer run | $50 | A következő 3 reggelen +12 százalékpont vevőérkezési esély. |
| Visiting mechanic | $110 | A mai és a következő 3 napban indított normál motor/váltó javítás 1 nap. Már futó munkát nem gyorsít. |
| Detailing shop partnership | $65 | A mai és a következő 3 napban 30% kedvezmény a cosmetic javítás teljes árából. |
| Classifieds photo package | $60 | A következő 2 reggelen +18 százalékpont vevőérkezési esély. |
| Local business open house | $90 | Azonnal +3 reputáció; aznap új normál javítás nem foglalható. |
| Inspection lane day pass | $45 | A mai és a következő 3 napban 25% vizsgálati kedvezmény, minimum $20-os vizsgálati díj. |

A meghívás az érkezés napján és a következő napon fogadható el. Elutasítás vagy figyelmen kívül hagyás ingyenes. Díj csak elfogadáskor kerül levonásra. Hátralék mellett fizetős esemény nem fogadható el. A műhelyt lefoglaló program csak üres normál műhely mellett vállalható; a külsős rush javítás továbbra is működik. A marketinghatások összeadódnak, de az ajánlatérkezés esélye legfeljebb 95%, és csak a meghirdetett autókra hatnak.

A javítási kedvezmények közül a legerősebb érvényesül; nem szorzódnak össze. Az előfizetés 3 használatából csak ténylegesen kifizetett, azzal kedvezményezett javítás vesz el egyet. Árajánlat vagy rejtett hiba feltárása nem fogyaszt használatot. Az eseménydíj külön vállalkozási kiadás: csökkenti a pénzt és a vállalkozásértéket; az autó profitjába a tényleges, kedvezményes javítási ár kerül. A díj nem jár vissza lejáratkor.

### Három megbízástípus

| Megbízás | Keresett autó | Állapot / futás | Idő elfogadástól | Fix vételár + bónusz |
| --- | --- | --- | ---: | ---: |
| Japanese weekend car | Japan / sport, roadster vagy hatch | legalább 75%, legfeljebb 150,000 miles | 4 nap | $7,500 + $300 |
| European daily driver | Europe / sedan vagy hatch | legalább 72%, legfeljebb 180,000 miles | 5 nap | $5,400 + $250 |
| American performance car | America / sport | legalább 78%, legfeljebb 140,000 miles | 5 nap | $9,500 + $400 |

A megkeresésre 3 napig lehet válaszolni. Elfogadáskor indul a fix határidő; legfeljebb 2 megbízás vállalható egyszerre. Nincs előleg, automatikus vásárlás vagy garantáltan megfelelő napi kínálat. A fix vevői árat a beszerzés és javítás várható költségéhez kell mérni.

Csak teljesen átvizsgált, minden hibájától megszabadított, javításból elkészült saját autó adható át, a határidő napját is beleértve. Az Operations ablak megmutatja a kész, megfelelő autókat, befektetésüket és várható profitjukat. Az átadás rendes eladás: az autó kikerül a garázsból, a fix vételár és bónusz egyszer érkezik meg, a profit, Ledger, album és pénzügyi grafikon frissül. +3 reputáció jár; alku nélkül nincs XP.

El nem vállalt megkeresés visszautasítása vagy lejárata ingyenes. Elfogadott megbízás elhagyása vagy lekésése 1 reputációt vesz el egyszer, készpénzbüntetés nélkül. A napzárás a mai megbízáshatáridőkre külön figyelmeztet, visszavezető gombbal. A reputáció nem mehet nulla alá.

Ezek fiktív helyi események. Az ellenőrzött történelmi hírek külön, későbbi roadmap-tétel maradnak. Az egyensúly kezdeti szabályai játékosi visszajelzés alapján finomítandók.

## Egységes pixel art garázs - v0.9.1

A rádió, telefon, dealer mappa, album és operations clipboard a háttérbe rajzolt, fényekhez és perspektívához illeszkedő tárgyak. A lapos CSS-ikonok és az állandó menütáblák megszűntek. A tárgyra mutatva vagy billentyűzettel kijelölve jelenik meg a funkció neve; kattintásra ugyanaz az ablak nyílik meg. A business upgrade állapotát az eredeti szerszámokra, alkatrészekre és poszterre mutatva, illetve a Dealer File ablakban lehet ellenőrizni.

## Garázshangulat és rádió - v0.9

- A megerősített napzárást 1,9 másodperces jelenet követi: leereszkedő redőny, esti elsötétülés, majd reggeli nyitás. Ezután nyílik meg a napi összefoglaló. **Skip animation** vagy Escape azonnal a jelentésre ugrik.
- A nap és minden pénzügyi változás a jelenet előtt mentődik. Kihagyás és újratöltés nem ismétli meg a napváltást; a még olvasatlan jelentés visszajön.
- Finoman mozgó porszemek és időnkénti utcai fények teszik élőbbé a garázst. A rendszer csökkentett mozgás beállításával a napváltási jelenet kimarad, a háttérmozgás leáll.
- A polcon lévő kis **RADIO** tárgy vagy az alsó rádiópanel nyitja a választót. Három fiktív, 1993 hangzását idéző adó saját, szintetizált instrumentális loopokkal: **Neon FM 94.3** (szintipop), **Palms Groove 93.0** (hiphop/funk), **Rust FM 101.7** (alternatív rock ihlette riffek).
- Az adóra kattintva indul a zene. Külön leállítás és hangerőcsúszka van; a kijelző játék közben mozog. Internetkapcsolat és letöltött zenefájl nem kell.
- Az adó és hangerő külön helyi beállításként mentődik. Újraindításkor a rádió csendben marad, amíg el nem indítod. A játékállást és a gazdaságot nem módosítja.

## Indítás

Nyisd meg az `index.html` fájlt Chrome-ban, Edge-ben, Firefoxban vagy Safariban. Nincs szükség telepítésre, regisztrációra, adatbázisra vagy játékszerverre.

Macen az `Indítás.command` fájlra is kattinthatsz kétszer. Ha a rendszer blokkolja ezt, nyisd meg közvetlenül az `index.html` fájlt.

A játék minden változtatás után a böngésző helyi tárhelyére ment. Ugyanabban a böngészőben, ugyanarról a helyről nyisd újra a fájlt. Privát ablak vagy a böngészőadatok törlése miatt a mentés elveszhet. Ha a tárolás nem engedélyezett, a játék figyelmeztet.

## Az első üzleted

1. Kattints a garázs bal oldalán álló **számítógépre**. Ez nyitja meg a **Car Market** ablakot. A Golf GTI, Volvo 240 és Honda CRX a kezdőtőkéhez igazodó belépőmodellek. A teljes adatbázis 60 modelles; a napi kínálat továbbra is 9 hirdetésből áll. Régi mentésben az új modellek a következő napváltástól kerülhet a piacra.
2. Kattints egy autóra. Az eladó állapotleírása és az abból készült értékbecslés tévedhet.
3. Az **alapáron $90-os átvizsgálás** (skillel és diagnosztikával olcsóbb) megmutatja az alkatrészek állapotát és a rejtett hibákat. A díjat akkor is kifizetted, ha végül nem veszed meg az autót.
4. Vásárolj. A piac bezáródik, és a megvett autó animációval begurul a garázsba. A készpénz és a két férőhely valódi korlát. Maradjon pénz a javításokra.
5. Kattints a beállóban álló autóra az adatlapjához, vagy a **műhelyasztalra** a **My Inventory** ablakhoz. Itt választhatsz javítást. A motor és váltó normál javítása két nap, a többi egy nap. Mechanical Knowledge 2-től a normál munkák is egynaposak; drágább külsős gyorsjavítás is választható. A javítás 95%-ra emeli az adott alkatrész állapotát; a hibajavítás külön költsége előre látszik. Újonnan felfedezett hiba esetén először új árat kapsz, automatikus pluszlevonás nincs.
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

A business upgrade és a reklám általános kiadásként szerepel a pénzügyekben; nem kerül automatikusan egyetlen autó profitjába. Az autóprofit eladás mínusz vétel, vizsgálat, javítás és a későbbi vevői hozzájárulás.

## Fejlődési sávok és pénzügyi grafikon

A felső sávban az XP és a következő reputációs mérföldkő is követhető. A Dealer File-ban a Negotiation rang, a perk rangkövetelménye és a business upgrade megfizethetősége is sávot kapott. A készpénzsáv azt jelzi, megengedheted-e a fejlesztést; nem jelent félretett pénzt vagy automatikus vásárlást.

A **Ledger** ablak két vonallal mutatja a **Trading profit** és **Business value** alakulását. A profit a lezárt autóüzletek eredménye az utólagos vevői javítási hozzájárulásokkal együtt; a vállalkozás értéke készpénz + készlet azonnali kereskedői értéken - lejárt üzemeltetési számlák. A fejlesztések és a reklám kiadásként csökkentik az értéket; becsült márkaértéket nem adunk hozzá.

Naponként egy pont van. A mai pont minden művelet után frissül, a korábbi napok megmaradnak. A pontok fölé vitt egér vagy a billentyűzetes fókusz pontos dátumot és összegeket mutat. Új játékban $5,000 érték és $0 profit az indulópont. Korábbi mentésben a grafikon a mostani játéknaptól indul: hiányzó régi készletértékeket nem becslünk vissza.

## A 60 modelles katalógus

A [MODEL-CATALOG.md](MODEL-CATALOG.md) listázza mind a 60 modellt és a játékban használt évjáratokat. Az első, v0.5-ös bővítés húsz autója között RX-7, Supra, 240SX, AE86, Civic, Integra, Celica, 3000GT, 280ZX, 323 GTX, Porsche 944 és 911, Mercedes 190E, Audi Quattro, Peugeot 205 GTI, Corvette, Firebird, Grand National, Dodge Stealth és Jeep Cherokee szerepel.

Az új modellek szervizszorzója és generáláskor alkalmazott hibakockázata eltér. Ezek játékegyensúlyhoz választott értékek, nem történelmi statisztikák. A szervizszorzó az adatlapon látható, a meglévő javítási kedvezmények továbbra is érvényesek. Az eredeti modellek azonosítói és mentett autói megmaradnak.

A v0.5-ös húsz új sprite és a generáló promptok az [EXPANSION-V05.md](assets/EXPANSION-V05.md) szerint vannak tárolva. A képek átlátszó hátterű, helyi atlaszok; a modellenként külön PNG-állomány későbbi feladat marad. A v0.6 további harminc modelljét az album leírása és a teljes modellkatalógus sorolja fel.

## Car Collection album

A garázsban kattints a **Car Album** tárgyra. Az album mind a 60 modellt megmutatja, saját grafikával. Kereshetsz márkára, modellre vagy változatra, és szűrhetsz régióra, megvett/javított/eladott vagy még hiányzó modellekre.

- A vásárlás lezárásakor megjelenik a **BOUGHT** pecsét.
- A **REPAIRED** pecsét csak a fizetett javítás tényleges befejezésekor jelenik meg, napváltás után. Átvizsgálás és új hiba felfedezése nem számít javításnak.
- Eladáskor megjelenik a **SOLD** pecsét, és a modell összes autóüzleti profitja frissül.
- Egy jármű szakaszonként egyszer számít. Több azonos modellű autó emeli a darabszámot, a különböző modellek gyűjtési célját nem duplázza.
- A kártyára kattintva modellismertető, darabszámok és rögzített kereskedési profit látható. Innen megnyitható a mai piac; az album nem árul automatikusan minden modellt.
- Célok: First Five (5 modell megvéve), Hands On (5 modell megjavítva), Wide Selection (15 modell eladva), Complete Catalog (mind a 60 modell megvéve). Ezek kozmetikai célok; nem adnak plusz pénzt vagy XP-t.
- Collectible tier: Regular, Rare és Legendary játékbeli értékkategória; nem történelmi gyártási ritkaság állítása.

A régi mentésekből az aktuális készlet és a névvel vagy modellazonosítóval bizonyítható eladási napló kerül az albumba. Korábbi javítás csak külön meglévő javítási adat alapján igazolható. Nem becslünk vissza ismeretlen javításokat; az átállítás nem ad pénzt vagy XP-t. A folyamatban lévő javítás csak elkészüléskor számít.

A második bővítés harminc új modellje külön adatfájlban van. Többek között Skyline, Silvia, Pulsar, Prelude, Accord, M5, Ferrari 328, Countach, Lancia Delta, Saab 900, Thunderbird, S-10, Chevelle és Charger kerülhet a piacra. A rajzok és generáló promptok az [EXPANSION-V06.md](assets/EXPANSION-V06.md) dokumentumban szerepelnek.

## Vevők, hibafeltüntetés és reklamáció

Hirdetés előtt a **What do you tell the buyer?** mezőben választhatsz:

- **Inspected / disclose all faults**: teljes átvizsgálás kell. Az összes megmaradt hiba fel van tüntetve. A normál, állapotfüggő +1/+2 reputáció mellé +1 jár a korrekt tájékoztatásért. Ilyen leírás mellett nem érkezik elhallgatott hibára reklamáció.
- **As-is / condition not guaranteed**: őszintén vállalod a bizonytalanságot. Az ajánlatok alapértéke 5%-kal alacsonyabb, az eladás +1 reputációt ad. Nincs hibamentességi ígéret és ebből következő reklamáció.
- **Advertise as fault-free**: a vevő hibalevonás nélkül értékeli az autót. Ha ténylegesen maradt javítatlan rejtett hiba, az eladás után két játék nappal reklamáció érkezik. Ha minden hiba javított, nincs ilyen reklamáció.

A garázs **Customers** telefonja megnyitja a vevői mappát. Magáneladáskor elmentődik a vevő, a preferált régió, a vásárlásszám, a nettó költés és a bizalom. A kereskedői eladás nem hoz vevőkapcsolatot. Legalább 1 bizalomponttal a vevő visszatérhet egy megfelelő régiójú autóhoz. Az alap visszatérési esély 15%, reputációpontonként +0.5 százalékpont, maximum 60%, ha a napi ajánlat egyébként létrejön. A visszatérő ajánlat 3% lojalitási felárat kap, legfeljebb a hirdetési árig. Ez nem garantált napi vásárlás.

### Reklamáció kezelése

A hibamentes ígéret megszegése a reklamáció megérkezésekor -4 reputációt és -2 vevői bizalmat okoz. Felső értesítősáv és a telefon jelzése mutatja a nyitott ügyet. A **Customers** ablakban látszik az autó, a feltárt hiba, az összeg és a válasz határideje.

- **Contribute to repairs**: a megmaradt hibák költségének fele, legalább $50, de legfeljebb az eladási ár 15%-a fizethető. A minimumot a 15%-os felső határ felülírhatja. Az ügy rendezése +1 reputációt visszaad és +3 vevői bizalmat ad. A készpénz, az eredeti eladás profitja, az album modellprofitja és a mai grafikonpont is csökken a kifizetéssel.
- **Decline**: nincs fizetés, további -2 reputáció és -1 bizalom.
- **Válasz nélkül hagyás**: a megérkezéstől számított harmadik napra lépve lezárul az ügy, további -3 reputációval és -1 bizalommal. Nincs automatikus pénzlevonás.

A reputáció nem mehet nulla alá. Pénzhiány esetén a hozzájárulás nem fizethető ki; rendezheted a határidő előtt, ha pénzhez jutottál, vagy elutasíthatod. Nincs hitel vagy automatikus negatív egyenleg. Egy ügy csak egyszer rendezhető. Függő vagy nyitott reklamáció alatt az érintett vevő nem ad visszatérő ajánlatot.

A vevői mappában reputációs napló is van, minden új változás okával. Korábbi reputációs változásokat és reklamációkat nem találunk ki utólag. A régi mentések ajánlatai megmaradnak; a leírás nélkül mentett régi hirdetés as-is állapotként kezelődik az új eladásnál.

Ez egyszerű, játékbeli customer-care rendszer. Az állapotot a hirdetés tényleges leírása rögzíti; a leírás változtatásához előbb le kell venni és újra fel kell adni a hirdetést, ami törli az ajánlatokat.

## Napzáró felugró összefoglaló

A **Next Day** vagy falióra-kattintás először megerősítést kér. A nap csak a **Yes, close day** (függő ajánlatnál **Close day & expire offers**) gomb után vált, és ekkor nyílik meg a napi összefoglaló. A **Keep playing**, a bezárás és az Escape nem változtatja a napot, a pénzt vagy az ajánlatokat. A lezárt nap és a következő reggel külön szakasz:

- Záró készpénz, napi készpénzmozgás, realizált autóüzleti eredmény, szint, kapott XP és záró reputáció.
- Lenyitható tételes pénzmozgások a lezárt napról.
- Új piaci hír, keresleti állapot, friss hirdetések és lejárt ajánlatok.
- Elkészült javítások és új vevői ajánlatok, konkrét autóval és összeggel.
- Új és válasz nélkül lezárt reklamációk, összeggel és határidővel.
- Éjszakai reklámköltség és reputációváltozás.

A **Continue to garage** bezárja az ablakot. A **View offers** vagy **Customer care** közvetlenül a megfelelő mappát nyitja meg. Amíg az összefoglaló nyitva van, a következő nap nem indítható újra. A legutóbbi összefoglaló a **DAY REPORT** gombbal újranyitható; ez nem lépteti az időt és nem von le újabb költséget. Ha olvasás előtt bezárod a böngészőt, a mentett összefoglaló újranyitáskor megjelenik.

A napi autóüzleti eredmény az aznap lezárt autók eladási ára mínusz bekerülése, levonva az aznap kifizetett vevői hozzájárulásokat. A készpénzmozgás az aznapi beszerzést, javítást és üzleti kiadást is tartalmazza. A következő reggel reklámdíja külön jelenik meg.

## Bejövő ajánlatok értesítése

A garázs és a mappák felett megmaradó **LIVE OFFERS** értesítősáv mutatja az ajánlatok számát, a modelleket és összegeket. A **NEEDS REVIEW** szám azokat jelöli, amelyeket még nem nyitottál meg az autó adatlapján. A készletkártyák is **NEW OFFER** vagy **PENDING OFFER** jelzést kapnak.

A **View offers** egyetlen érintett autónál közvetlenül az adatlapot nyitja, több autónál a készletet. Csak a ténylegesen megnyitott autó ajánlatai lesznek átnézettnek jelölve. Az értesítés ettől még megmarad: az elfogadás, elutasítás vagy a külön megerősített napzárás zárja le az ajánlatokat. A jelölés mentődik; korábbi, jelölés nélküli ajánlatok átnézendőnek számítanak.

Napzárás előtt a megerősítő ablak felsorolja a függő ajánlatokat és figyelmeztet a lejáratukra, akkor is, ha már átnézted őket. A **Review offers first** visszavisz az ajánlatokhoz napváltás nélkül. A nyitott megerősítés újrakattintása, a dupla jóváhagyás vagy egy már bezárt ablak régi gombja nem okoz újabb naplépést. A jóváhagyásra váró megerősítés nem léptet napot a böngésző újranyitásakor sem.

## Autóképek kivágása

Mind a 60 modell saját SVG-körvonalmaszkot kapott. A megjelenítés a tényleges járműből dolgozik, az atlasz feltételezett oszlophatárai helyett. A kivágás a garázsban, a piacon, az albumon és az adatlapokon közös. Az eredeti sprite-fájlok megmaradtak; a fizikailag összeérő Delta és Saab külön forrásképet kapott. A megoldás és a generáló promptok a [SPRITE-FIX-V071.md](assets/SPRITE-FIX-V071.md) dokumentumban vannak.

## Mozgó piac és összetettebb üzemeltetés - v0.8

### Piaci hullámok

Mindennap új keresleti hullám indul valamelyik régióban. A célérték a semleges szinthez képest 12-30%-kal magasabb vagy alacsonyabb; egy hullám 2-4 napig tarthat. Az új hullám felülírhatja ugyanannak a régiónak az előző hullámát. A többi aktív trend tovább él, napi legfeljebb 2 százalékpont zajjal; a keresleti szorzó 70-135% között marad.

A **Moving markets** panel a piacon és az **Operations** ablakban mutatja az aktuális szorzókat, a tegnaphoz képest történt változást és a hullám várható hátralévő idejét. Az eladói árak, a készlet értéke és a vevői ajánlatok követik a keresletet. A fizetésnapi és ritka hirdetéses helyi események továbbra is előfordulhatnak.

A következő hullám terve mentődik, újranyitással nem sorsolható újra. A hullám nem garantált eladási ár: a vevői érdeklődés, a hirdetési ár és a napi zaj továbbra is számít.

### Új skillágak és perkek

A **Dealer File** két új ágat kapott; mindegyik 0-3 rang, rangonként 1 skillpont.

- **Mechanical Knowledge**: rangonként 15%-kal kisebb átvizsgálási alapdíj és 5%-kal kisebb javítási munkadíj. A meglévő eszközkedvezményekkel szorzódik. Rank 2-től az új normál motor-/váltójavítás is egy nap; a már megkezdett munkák határideje nem módosul.
- **Sharp Eye**: Mechanical Knowledge 2 után 1 pontért. Vásárlás előtt egy lehetséges rejtett hibára utaló ingyenes jel látszik. A perk nem végzi el az átvizsgálást és nem ad teljes állapotlapot.
- **Market Knowledge**: rangonként a becslés 25%-kal közelebb kerül a tényleges állapotalapú értékhez, a seller-claim becslésből kiindulva. Rank 3-nál is marad bizonytalanság; nem jelöli az autót átvizsgáltnak.
- **Trend Spotter**: Market Knowledge 2 után 1 pontért. Megmutatja a következő tervezett régiós hullám célértékét és időtartamát; a napi zaj miatt ez előrejelzés, nem garantált profit.
- **Diagnostic Equipment**: $1,000-os business upgrade, további 20%-kal kisebb átvizsgálási díj. A minimális díj $30. A meglévő Negotiation és One More Shot változatlanul működik.

### Üzemeltetési költség és készpénztartalék

A garázs **Operations** tábláján követhető a következő számla, az esetleges hátralék és a műhely munkái.

- Bérleti és közüzemi költség: napi $20.
- Készlettartás: napi $5 autónként, a napváltáskor készleten lévő járművekre.
- A számla a következő reggelen fizetődik ki, a reklámdíj előtt. Napzárási megerősítésben előre látszik az összeg.
- Pénzhiánynál a készpénz nem megy negatívba; a fennmaradó számla hátralékba kerül és csökkenti a vállalkozás értékét.
- Hátralék mellett új autó, javítás és business upgrade nem vásárolható. A meglévő készlet továbbra is eladható, és az **Operations** ablakból a befolyt pénzzel rendezhetők a számlák.
- A kifizetés a Ledgerben külön üzemeltetési költség. A realizált autóprofitba nem osztjuk szét; a készpénzt és a vállalkozás értékét érinti.
- A régi mentésekben nincs utólagos számlaterhelés: az új költségek a következő tényleges napváltástól indulnak.

### Műhelykapacitás és gyorsjavítás

Egy normál, házon belüli munka lehet folyamatban. A beállók száma továbbra is kettő; a műhelymunka korlátja külön működik.

A **Workshop booking** mezőben választható **Outsourced rush**: mindig egynapos, a teljes javítási ajánlatra +25% felárat tesz, minimum $80-at. A díj azonnal a bekerülés része, és a munka nem foglalja a házon belüli munkasávot. A műhely foglaltsága, a teljes költség és az elkészülési dátum látszik. Egy autó továbbra sem javítható és adható el párhuzamosan.

Ezekből valódi választás következik: megvárod a hullámot és kifizeted a készlettartást, olcsóbban de lassabban javítasz, vagy felárért gyorsan piacra lépsz. A játék továbbra is kézi napváltással működik, valós idejű nyomás nélkül.

## Működő rendszerek

- XP, szintlépés, Negotiation skill, One More Shot perk és három vállalkozásfejlesztés.
- Látható reputációs mérföldkövek és érezhető érdeklődési bónuszok.
- Hatvan, 1993-ban vagy korábban létező modell; naponta kilenc hirdetés.
- Évjárat, mérföldben megadott futás, eladói állítás, valós állapot és rejtett hibák.
- Vásárlás, átvizsgálás, ötféle javítás, hirdetés, vevői ajánlat és azonnali eladás.
- Garázskapacitás, hírnév, változó kereslet és négy gazdasági piaci esemény.
- Javítás során feltárható rejtett hibák.
- Pénzmozgások és eladásonkénti profit. Automatikus mentés és megerősítést kérő újrakezdés.
- Pixel art garázs, hatvan külön autósprite, begurulási animáció és javítási szikrák.
- Tárgyakra épülő kezelés: számítógép = piac, műhelyasztal = készlet, főkönyv = pénzügyek, falióra = napváltás.
- A grafikák a projektben vannak; nincs külső képszolgáltatás vagy betűkészlet-letöltés.

**Profit = eladási ár - vételár - az adott autó vizsgálatai - javításai - utólagos vevői javítási hozzájárulás.** A meg nem vett autók vizsgálatai külön kiadásként csökkentik a készpénzt és a vagyont. A pénzügyi oldalon a vagyon készpénz + készlet azonnali kereskedői értéken - lejárt üzemeltetési számlák. Az árak játékegyensúlyhoz igazított dollárösszegek, nem történelmi árjegyzék.

## Felépítés

- `js/catalog-v06.js`: a második harminc modell és a hozzájuk tartozó sprite-manifest.
- `js/strategy.js`: többnapos piaci hullámok, tervezett következő trend, üzemeltetési számlák, műhelyidő, specialistaskillek és perkek.
- `js/day-report.js`: lezárt nap és következő reggel összesítése, menthető összefoglaló.
- `js/sprite-clips.js`: generált, modellenkénti körvonalas kivágások.
- `scripts/build-sprite-clips.py`: a kivágási adatok újraépítése fejlesztéskor.
- `js/customers.js`: hirdetési leírások, vevőkapcsolatok, lojalitási ajánlatok, reklamációk és reputációs napló.
- `js/collection.js`: vásárlási, javítási és eladási gyűjtési állapot, korábbi mentések bizonyított adatainak átvétele.
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

A gazdasági tesztek futtatása, ha van Node.js: `npm test` (16 gazdasági + 8 fejlődési + 8 pénzügyi/katalógus + 8 album + 9 vevői + 5 napi összefoglaló + 8 stratégiai + 1 rádió-életciklus + 16 helyi esemény/megbízás teszt).

Ellenőrzött: indulás és elérhető belépőmodellek 500 új kínálatban, kapacitás és készpénzkorlát, dupla műveletek tiltása, vizsgálati díj, rejtett hiba, javítás ideje és ára, napi kereslet, ajánlatok érvényessége, profitképlet és mentési adatok visszatöltése. További 1000 szimulált üzlet ellenőrzi a pénzmozgások egyezőségét és a nyereség/veszteség lehetőségét.

A pixel garázs felületi működéstesztje ellenőrizte a számítógépről megnyíló piacot, az érkező autó animációs állapotát és a garázsból megnyíló autóadatlapot. Emellett végigment a piac, adatlap, vizsgálat, vétel, javítás, napváltás, hirdetés, ajánlat, eladás és pénzügyek útvonalán. Külön ellenőrizte az új oldalpéldányba történő mentés-visszatöltést, az újrakezdés megszakítását és az új játékot. Ez DOM-alapú szerkezet- és interakcióteszt, nem valódi böngészős képi ellenőrzés. Fejlesztőknek: `npm install`, majd `npm run test:ui`. A játék futtatásához ezek nem szükségesek.

Az alku külön tesztjei ellenőrizték az elfogadást, ellenajánlatot, végső árat, visszalépést, hibás összegeket, körkorlátot, mentés-visszatöltést és a kialkudott árhoz tartozó profitot. A teljes felületi útvonalon vételi és eladási alku, XP és szintlépés, skillpontköltés, perkfeloldás, mindhárom vállalkozásfejlesztés és reklámaktiválás is szerepel. A teszt ellenőrzi a fejlesztések jeleneten megjelenő elemeit, a napi díjat, a mentést és az új játékot is. A második felületi tesztútvonal a hibamentes hirdetéstől az eladáson át a késleltetett reklamációig és a hozzájárulás rendezéséig is végigment, pénzügyi visszaellenőrzéssel. A harmadik útvonal a megerősítés utáni napi modal megnyitását, a dupla naplépés tiltását, az olvasatlan összefoglaló visszatöltését, nyugtázását és újranyitását is ellenőrzi. A sprite-kimeneteket külön renderelővel is megnéztük. A negyedik útvonal külön ellenőrzi a veszteségmentes visszalépést, az Escape-et, az ajánlatlejárati figyelmeztetést, a több autóhoz tartozó ajánlatok külön átnézését, a mentés utáni értesítést és a dupla vagy már bezárt jóváhagyás tiltását. Az ötödik útvonal az új skilleket és perkeket, számlarendezést, műhelyfoglaltságot, fizetett gyorsjavítást, diagnosztikai kedvezményt és előrejelzést ellenőrzi. Egy 30 napos szimuláció a pénzmegmaradást, a piaci értéktartományt és a mentett grafikont is végigellenőrizte. Ez nem szubjektív játszhatósági vagy teljes böngészős vizuális teszt.

## Korlátok és következő lépések

A v0.8-ban nincs garázsbővítés, személyzet vagy több telephely. Nincs automatikus csődvége: ha kifogysz a pénzből, eladhatod a készleted vagy újrakezdhetsz. A mentés a böngészőhöz kötődik. A beépített böngésző helyi fájlokat tiltó szabálya miatt valódi böngészőben a vizuális elrendezés nem volt ellenőrizhető ebben a fejlesztési körben.

Az első fejlődési kör elkészült. A kínálat 60 modellre bővült, és a gyűjtőalbum elkészült. A tycoon mélyítés első köre elkészült: visszatérő vevők, hibafeltüntetés és egyszerű reklamáció. A következő javasolt kör a helyi események gazdagítása és az ellenőrzött történelmi hírek alapja. A további autóbővítés a roadmap szerint folytatható. A további skillágak, perkek és vállalkozásfejlesztések a roadmapben maradnak. A több beálló későbbi lehetőség. A nagy autóállomány, a helyi események és a történelmi hírek részletes sorrendjét a [roadmap](ROADMAP.md) tartalmazza.
