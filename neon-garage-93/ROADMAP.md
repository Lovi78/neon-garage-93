# Neon Garage '93 - fejlesztési roadmap

Rögzítve: 2026. október 9.
Jelenlegi játékverzió: v0.9 / Garage Radio.

Ez a dokumentum őrzi a megbeszélt termékirányt, funkciókat, fejlesztési sorrendet és nyitott döntéseket. A játék felülete angol; a fejlesztési egyeztetés és a dokumentáció magyar.

**Státuszok:** kész = a jelenlegi kódban működik; tervezett = még nincs megvalósítva; javaslat = a megbeszélésben felmerült, de a részlete nincs véglegesítve. A verziószámok a következő szakaszoknál tervezési jelölések, nem vállalt megjelenési dátumok.

## 1. A játék iránya

- Saját, hosszú távon fejleszthető indie autókereskedős tycoon.
- 1993. június 1-jén indul, a fiktív kaliforniai Silver Palms városban.
- Kezdőtőke $5,000; két beálló; induló reputáció 0.
- Alaphurok: autót keresni, alkudni, vásárolni, megvizsgálni, javítani, meghirdetni, eladni, majd a pénzt és tapasztalatot továbbfejlődésre használni.
- Körökre osztott napok, valós idejű időnyomás nélkül. Valódi döntések, nyereség és veszteség lehetősége; nem idle clicker.
- Böngészőben fut, egyszerűen indítható, automatikusan ment. Jelenleg nincs szükség szerverre, regisztrációra vagy adatbázisra.
- Pixel art világ. A garázs maga a fő felület, a tárgyak jelentik a menüt.
- Az autók kinézete a játék egyik fő vonzereje: felismerhető, szerethető, modellenként igényes grafika kell.
- A másik fő vonzerő a nagyon nagy, Gran Turismo léptékű autóválaszték. A hasonlat az állomány méretére vonatkozik; autóversenyzés továbbra sem része a jelenlegi feladatnak.
- A személyes fejlődés és a vállalkozás fejlesztése egyaránt a játék része lesz.

## 2. Jelenlegi alap - v0.1-v0.3

### Kész funkciók

- [x] Tíz modell és naponta frissülő, kilenc hirdetésből álló piac.
- [x] Csak 1993-ban vagy korábban létező modellek és megfelelő évjáratok.
- [x] Modell, évjárat, futás mérföldben, hirdetési ár, állításból készült becslés és valós állapot.
- [x] Készpénz- és garázskapacitás-korlátos vásárlás.
- [x] Fizetős átvizsgálás, rejtett hibák.
- [x] Motor, váltó, futómű, karosszéria és kozmetika javítása.
- [x] Javítási idő és javítás közben feltárható további hiba.
- [x] Hirdetés, érdeklődői ajánlatok, elfogadás és elutasítás.
- [x] Azonnali, alacsonyabb árú kereskedői eladás.
- [x] Profit a tényleges vételár, vizsgálati és javítási költség alapján.
- [x] Napváltás, változó piaci kereslet és egyszerű gazdasági események.
- [x] Helyi automatikus mentés, visszatöltés és megerősítést kérő új játék.
- [x] Teljes angol játékfelület; a korábbi magyar mentések szövegeinek átállítása.
- [x] Pixel art garázs és tíz külön autósprite.
- [x] Számítógép = piac; műhelyasztal = készlet; főkönyv = pénzügyek; falióra = napváltás.
- [x] A megvett autó animációval begurul a beállóba; az autóra kattintva megnyitható az adatlapja.
- [x] Javítási szikrák, tárgyjelölések és visszafogott hangulati animációk.
- [x] Vételi alku: legfeljebb három kör, elfogadás, ellenajánlat, végső ár és eladói visszalépés.
- [x] Eladási alku: ellenajánlat a magánvevőnek, elfogadás, végső ajánlat vagy távozás.
- [x] A tárgyalás mentődik. Az újranyitás nem sorsolja újra az árkorlátokat.

Az azonnali kereskedői eladási ár jelenleg fix. Az alku önmagában még nem mozgat pénzt: a vásárlás vagy az ajánlat elfogadása zárja le az üzletet.

### Ellenőrzési állapot

A v0.3 fejlesztésekor 16 gazdasági teszt és a teljes, vételi és eladási alkut is tartalmazó DOM-alapú működésteszt sikeres volt. A gazdasági ellenőrzés 1000 szimulált üzletet is tartalmazott.

A valódi böngészős vizuális ellenőrzés külön nyitott tétel. A beépített böngésző helyi fájlokra vonatkozó korlátozása miatt az elrendezést, az animáció megjelenését és a kattintási területeket a tényleges játékban még ellenőrizni kell. A sikeres működésteszt ezt nem helyettesíti.

## v0.4 - az első fejlődési kör állapota

A későbbi egyeztetésben elfogadott, szűkebb kör elkészült: a Negotiation az első működő skillág, One More Shot az első perk; Better Tools, Parts Supplier Deal és Local Newspaper Ad az első három business upgrade. Az eredeti három skillág / három perk / négy upgrade javaslat fennmaradó része tervezett későbbi bővítés, nem törölt ötlet.

- [x] Lezárt, árelőnyt hozó vételi és eladási alkukért egyszeri XP; 20 alap + minden $100 után 1, maximum 40.
- [x] Első szintküszöb 80 XP, majd szintenként +40; szintlépésenként 1 skillpont.
- [x] Negotiation 0-3: rangonként 1 skillpont és új tárgyalásokban 1% árkorlát-javítás.
- [x] One More Shot: Negotiation 2 után 1 pontért; négy eladói kör, lezárt tárgyalás újranyitása nélkül.
- [x] Better Tools $600: -15% munkadíj. Parts Supplier Deal $900: -20% alkatrészköltség.
- [x] Local Newspaper Ad $450: kapcsolható kampány, napi $20 és +15 százalékpont érdeklődés; pénzhiánynál leáll.
- [x] Reputációs célok 0 / 5 / 15 / 30 / 50 pontnál; érdeklődési bónusz 0 / 3 / 7 / 12 / 18 százalékpont.
- [x] Dealer File irodai mappa; angol fejlődési ablak; megvett szerszámok, alkatrészes láda és reklámplakát a garázsban.
- [x] Régi mentés kiegészítése a fejlődés alapértékeivel; korábbi tranzakciókra nincs becsült XP.
- [x] 16 korábbi gazdasági és 8 új fejlődési teszt; teljes DOM-működésteszt a fejlődési és vásárlási útvonalra is.
- [ ] Tényleges böngészős vizuális ellenőrzés továbbra is nyitott.

A részletes működési szabályok a README-ben vannak. Gyűjtői megkeresések, reklamáció, Mechanical Knowledge, Market Knowledge, Sharp Eye, Trend Spotter és további business upgrade-ek még nincsenek megvalósítva.

## v0.5 - áttekinthetőség és 30 modell

Rögzítve: 2026. október 10.

- [x] XP- és reputációs sáv a főképernyőn; skillrang-, perkfeltétel- és megfizethetőségi sáv a Dealer File-ban.
- [x] A Ledgerben napi profitsor és vállalkozásérték-sor, pontos dátumokkal és értékekkel.
- [x] Napi mentett snapshotok; mai pont frissítése minden művelet után. Régi mentéshez nem készül kitalált történet.
- [x] Katalógusbővítés 10-ről 30 külön modellre; a napi piac 9 hirdetés marad, belépőmodellekkel.
- [x] Húsz új átlátszó autósprite, két új atlaszban, modellenként ellenőrzött talajvonal-eltolással.
- [x] Eltérő szervizszorzó és hibakockázat az új modellekhez; a fejlesztési kedvezmények érvényesek maradnak.
- [x] Katalógusdokumentum, gyártói referenciaforrások és elmentett generáló promptok.
- [x] 31 gazdasági/fejlődési/pénzügyi/katalógusteszt és a bővített felületi működésteszt.
- [ ] Böngészős vizuális ellenőrzés továbbra is nyitott; a grafikai fájlok külön megtekintése és az automatizált DOM-teszt nem helyettesíti.
- [x] Car Collection album - v0.6-ban elkészült.
- [ ] Modellenként külön PNG-fájlokra bontás még tervezett; a v0.5-ös harminc sprite három atlaszban van; a v0.6-tal együtt hatvan sprite hat atlaszban.

Vállalkozásérték: készpénz + készlet azonnali kereskedői értéken. A chartban szereplő profit a realizált autóüzleti profit, nem az általános kiadásokkal csökkentett nettó üzleti eredmény. A fejlesztések és a marketing külön költségként látszanak a pénzmozgásokban.

## v0.6 - Car Collection és 60 modell

Rögzítve: 2026. október 10.

- [x] Car Album a garázsban; mind a 60 modell saját grafikával megtekinthető.
- [x] Vásárlási, befejezett javítási és eladási pecsétek, modell- és járműdarabszámok, rögzített modellprofit.
- [x] Keresés márka/modell/változat szerint; régió- és gyűjtési állapotszűrő; hiányzó modellek nézete.
- [x] Modellismertető és átjárás a napi piachoz. Az album nem helyettesíti a tényleges kínálatot.
- [x] Négy kozmetikai gyűjtési cél; a pecsétek és célok nem termelnek külön pénzt vagy XP-t.
- [x] Régi mentésekből csak bizonyítható készlet- és eladási előzmények átvétele. Ismeretlen javítási történet nincs visszabecsülve.
- [x] Bővítés 30-ról 60 modellre, három új átlátszó atlaszban harminc saját sprite-tal, külön bővítési adatfájllal.
- [x] Swift motorháztető és Thunderbird karosszéria célzott grafikai pontosítása, sprite-talajvonalak összehangolása.
- [x] 39 gazdasági/fejlődési/pénzügyi/katalógus/albumteszt; kibővített DOM-teszt az album keresésére, szűrésére, ismertetőjére és a teljes kereskedési útvonalra.
- [ ] Tényleges böngészős vizuális ellenőrzés továbbra is nyitott.
- [ ] Modellenként külön PNG-fájlokra bontás még tervezett; 60 sprite hat atlaszban van.

A 60 modelles mérföldkő elkészült. A következő javasolt kör a tycoon mélyítése a korábbi terv szerint: visszatérő vevők, hibák feltüntetése, egyszerű reklamáció és ezek reputációs következménye. A 150 és több száz modelles cél megmarad.

## v0.7 - vevőkapcsolatok és reputációs következmények

Rögzítve: 2026. október 10.

- [x] Hirdetési leírás: átvizsgált és minden hibát közlő, as-is vagy hibamentességet ígérő.
- [x] Az őszinte, hibás autó is építheti a hírnevet; az as-is eladás bizonytalanságát alacsonyabb ajánlat tükrözi.
- [x] Magánvevők könyve, preferált régióval, bizalommal, vásárlásszámmal és költéssel.
- [x] Bizalom és reputáció által támogatott visszatérő vevői kapcsolat, 3% lojalitási ajánlatfelárral a hirdetési árig.
- [x] Javítatlan hiba mellett tett hibamentes ígéret után késleltetett reklamáció.
- [x] Választható javítási hozzájárulás, elutasítás vagy határidő után lezáruló ügy; nincs automatikus pénzlevonás vagy negatív egyenleg.
- [x] Reputáció- és bizalomvesztés, korrekt rendezéskor részleges helyreállítás; új reputációs változások naplója.
- [x] Kifizetéskor az eredeti eladás profitja, a modellalbum profitja és a pénzügyi grafikon is frissül.
- [x] Vevői telefon és nyitott reklamációs értesítés a garázsban.
- [x] Régi mentések megőrzése; nincs visszamenőleg kitalált vevői adat, reklamáció vagy reputációs napló.
- [x] 48 gazdasági/fejlődési/katalógus/album/vevői teszt és két felületi működési útvonal, köztük reklamáció és rendezés.
- [ ] Valódi böngészős vizuális ellenőrzés továbbra is nyitott.

A részletes értékek és határidők a README-ben szerepelnek. A 60 modelles állomány ebben a körben nem változott. Ajánlások, gyűjtői megkeresések, beszámítás és összetett vevői személyiségek továbbra is későbbi lehetőségek. A következő javasolt szakasz a helyi események és a történelmi hírek alapja a korábbi terv szerint.

## v0.7.1 - sprite-kivágás és napzáró ablak

Rögzítve: 2026. október 10., felhasználói képernyőkép és visszajelzés alapján.

- [x] A hibás százalékos atlaszkivágás helyett mind a 60 modell saját körvonalmaszkot kapott.
- [x] A fizikailag összeérő Delta és Saab külön sprite; az Eclipse és a két problémás európai autó aktuális SVG-renderelése külön vizuálisan ellenőrizve.
- [x] Egységes megjelenítő a garázshoz, piachoz, albumhoz és adatlaphoz; teljes autó és közös talajvonal.
- [x] Minden napváltáskor felugró napzáró/új reggeli összefoglaló, pénzmozgásokkal, eredménnyel, XP-vel, hírekkel, javításokkal, ajánlatokkal és reklamációkkal.
- [x] Nyitott összefoglaló mellett nincs dupla naplépés; legutóbbi jelentés újranyitható, olvasatlan jelentés újratöltéskor visszajön.
- [x] 54 automatizált teszt és három felületi működési útvonal.
- [ ] A teljes garázs és modal böngészős vizuális ellenőrzése külön nyitott tétel; a sprite-kimenetek ellenőrzése ezt nem helyettesíti.

A fejlesztési segéd és a kivágási jegyzék is a projektben van, hogy a későbbi autóbővítésnél az oszlopeltolódás ellenőrizhető legyen. A katalógus változatlanul 60 modelles, a mentési kulcs és a meglévő játékállás megmarad.

## v0.7.2 - tudatos napzárás és ajánlatértesítés

Rögzítve: 2026. október 10., a napzárási visszajelzés alapján.

- [x] A Next Day és a falióra először megerősítést kér, nem léptet azonnal napot.
- [x] Keep playing, bezárás és Escape: nincs idő-, pénz- vagy ajánlatváltozás.
- [x] Függő ajánlatok tételes felsorolása és kifejezett lejárati figyelmeztetés a napzárási ablakban; közvetlen visszatérés az ajánlatokhoz.
- [x] Megmaradó LIVE OFFERS értesítés, összeggel és átnézendő darabszámmal; készletkártyás jelzés.
- [x] Egy autónál közvetlen adatlap, több autónál készletnézet; az átnézés csak a megnyitott autó ajánlataira vonatkozik.
- [x] Az átnézett, de még el nem fogadott vagy el nem utasított ajánlat értesítése megmarad.
- [x] Olvasási jelölés mentése, régi mentések kompatibilitása; régi jelöletlen ajánlatok átnézendőként kezelése.
- [x] Dupla és már bezárt jóváhagyás nem léptet napot; a meglévő napzáró összefoglaló megmarad.
- [x] 54 automatizált teszt és négy felületi működési útvonal, külön megerősítési/értesítési ellenőrzéssel.
- [ ] Teljes böngészős vizuális ellenőrzés továbbra is nyitott.

A megerősítés a játékos döntésére vár, nincs valós idejű időnyomás. A katalógus, árképzés és gazdasági szabályok ebben a körben nem változtak.

## v0.8 - stratégiai döntések a repetitív kör helyett

Rögzítve: 2026. október 10. Prioritásváltás a felhasználói visszajelzés alapján: a játék követhető, de lapos; gyorsabb trendváltozás, több skill és nagyobb üzemeltetési kihívás szükséges.

- [x] Naponta új régiós keresleti hullám, 12-30%-os célváltozással, 2-4 napos várható időtartammal; párhuzamos régiós trendek, napi zaj és 70-135%-os szorzókorlát.
- [x] Aktuális trendpanel, tegnaphoz viszonyított változás és várható lejárat a piacon és az Operations ablakban.
- [x] Mechanical Knowledge és Market Knowledge 0-3 rang; Sharp Eye és Trend Spotter rank 2-höz kötött perk.
- [x] Mentett következő piaci hullám; Trend Spotterrel előre megtekinthető, újranyitással nem sorsolható újra.
- [x] Diagnostic Equipment és tényleges műszaki tudásból származó ár-/időkedvezmények.
- [x] Napi $20 alapüzemeltetés + $5 autónként; reklám külön költség. Előre kijelzett számla, részleges kifizetés és követhető hátralék.
- [x] A hátralék csökkenti a vállalkozás értékét és blokkolja a bővítést; meglévő autó eladható és számla rendezhető, nincs negatív készpénz vagy visszamenőleges számlázás.
- [x] Egy házon belüli műhelymunka; motor/váltó 2 nap, egyéb 1 nap. Mechanical rank 2-től új munkánál 1 nap. Külsős, egynapos gyorsjavítás +25%, minimum $80 felárral.
- [x] Operations tábla a garázsban, műhelyütemezéssel, számlákkal és trendekkel; a napzáró riport az üzemeltetési költséget is tartalmazza.
- [x] Régi mentések, skillek, folyamatban lévő javítások és aktuális értékszorzók megőrzése.
- [x] 62 automatizált teszt és öt felületi működési útvonal; 30 napos gazdasági szimuláció.
- [ ] Szubjektív játszhatósági egyensúly és teljes böngészős vizuális ellenőrzés még nyitott.

Az eredeti három skillág és három perk most mind megvalósult. A történelmi hírek, gyűjtői megkeresések és további helyi döntéses események megmaradnak a tervben; ezek előtt most a meglévő játékmenet döntési mélysége kapott elsőbbséget. A részletes képletek és költségek a README-ben vannak; ezek játékegyensúlyozási induló értékek, tesztelői visszajelzés alapján finomítandók.

## v0.9 - garázshangulat és választható rádió

A 2026. október 10-i kérés: rövid animációk napzáráskor és nyitáskor, kis hangulati részletek, három korhű hangzású rádióadó.

- [x] 1,9 másodperces esti zárás/reggeli nyitás a meglévő megerősítés után, a napi jelentés előtt.
- [x] Kihagyás gomb, Escape és a rendszer csökkentett mozgás beállításának követése.
- [x] Egyszeri napváltás és azonnali mentés; a jelenet nem változtat pénzügyeket vagy jelentésadatokat.
- [x] Finom por- és utcai fényanimáció, lejátszáskor mozgó rádiókijelző.
- [x] Kattintható garázsrádió és három fiktív adó: Neon FM, Palms Groove, Rust FM.
- [x] Saját offline instrumentális loopok: szintipop, hiphop/funk, alternatív rock ihlette hangzás. Nem valódi történelmi rádióműsorok vagy licencelt dalok.
- [x] Hangerő, leállítás, adó/hangerő megjegyzése; kattintás nélkül nincs automatikus zene.
- [x] 63 automatizált működésteszt és hat felületi tesztútvonal. A rádióteszt ellenőrzi a hangcsatornák bekötését, adóváltást, időzítőt, leállítást, késleltetett indítás megszakítását és újratöltést. A jelenetteszt ellenőrzi a nyitást, kihagyást, Escape-et és csökkentett mozgást.
- [ ] Valódi böngészős kép- és hangellenőrzés: az automatizált tesztek nem igazolják a zene hallgatási minőségét vagy a jelenet vizuális élményét.

További hangulatbővítésként nyitott: több saját zenei loop, rövid bemondói szövegek és a későbbi történelmi hírek rádióba kapcsolása.

## 3. Reputáció - érezhető bizalom és új lehetőségek

**Felhasználói igény:** legyen világos, mire jó a reputáció, és legyen érezhető üzleti következménye.

**Jelenleg:** a reputáció javítja az érdeklődést és az alkupozíciót, és segíti a visszatérő vevők megjelenését. A v0.7-ben a hirdetés leírása, a reklamáció és annak rendezése is hat rá; a vevők külön bizalmi állapotot kapnak.

### Tervezett szerep

- [ ] Több érdeklődő és jobb esély az eladásra.
- [ ] Visszatérő vevők, ajánlások és ismerősi megkeresések.
- [ ] Bizonyos vevők kisebb felárat is elfogadnak a megbízható kereskedőnél.
- [ ] Reputációs mérföldkövekhez kötött új vevőkör és üzleti lehetőségek.
- [ ] Magasabb szinten gyűjtők, beszámítások és külön magánhirdetések.
- [x] A korrekt eladások építik, az eltitkolt hibák és rosszul kezelt reklamációk rontják a reputációt - v0.7.
- [x] Hibás autó őszinte, megfelelően árazott eladása is építhet bizalmat - v0.7.
- [ ] A felület megmutatja a jelenlegi előnyöket, a következő mérföldkövet és a reputáció változásának okát.

**Függőség:** az őszinteséghez kötött reputációhoz szükséges a feltárt hibák feltüntetése és egy egyszerű reklamációs rendszer. Ez a függőség v0.7-ben teljesült: az átvizsgált és őszinte, illetve az as-is leírás elkerüli az elhallgatott hiba miatti reklamációt. A büntetés oka követhető.

**Nyitott:** a skála, a mérföldkövek, a bónuszok felső határa és a reputációvesztés pontos szabályai. Ezek egyensúlyozási döntések, még nem végleges értékek.

## 4. Personal upgrades - XP, skillek és perkek

**Felhasználói igény:** egy sikeres ártárgyalás adjon XP-t, amelyből skilleket lehet fejleszteni és külön perkeket feloldani.

### XP és szintlépés

- [ ] Vételi és eladási sikeres alku is adhat XP-t.
- [ ] XP a ténylegesen lezárt üzlet után jár. Egy elküldött ellenajánlat vagy puszta elfogadó válasz önmagában még nem jutalom.
- [ ] Egyazon vételi vagy eladási tranzakció csak egyszer adhat XP-t.
- [ ] Újrahirdetés, újranyitás vagy ugyanazon ajánlat ismétlése nem termelhet XP-t.
- [ ] Szintlépéskor skillpont jár, amelyről a játékos dönt.
- [ ] Az XP, a szint, a skillpontok és a perkek mentődnek.
- [ ] A lezárt üzletnél látszik a kapott XP és az esetleges szintlépés.

**Nyitott:** mi minősül sikeres alkunak, mennyi XP jár érte, számít-e a kialkudott árelőny nagysága, és hogyan növekszik a szintek XP-igénye. Az alkumentes üzletek jutalmazása sincs még eldöntve.

### Három javasolt skillág

| Skillág              | Hatás                                                       | Javasolt perk                                         |
| -------------------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| Negotiation          | Tárgyalópartnerek jobb felismerése és nagyobb alkumozgástér | One More Shot: még egy tárgyalási kör                 |
| Mechanical Knowledge | Pontosabb állapotbecslés és jobb hibafelismerés             | Sharp Eye: vizsgálat előtt észrevehető egy gyanús jel |
| Market Knowledge     | Piaci érték, kereslet és ritkaság jobb felismerése          | Trend Spotter: egy keresleti hullám előrejelzése      |

A három ág és a perknevek a v0.8-ban megvalósultak; a kezdeti szabályokat a v0.8 szakasz és a README rögzíti. A konkrét szintek és hatások még véglegesítendők. A One More Shot esetén külön el kell dönteni, hogy az eladóval, a vevővel vagy mindkettővel használható-e.

**Alapelv:** a perkek új információt vagy döntési lehetőséget is adjanak. A fejlődés ne csak egymásra rakott százalékos bónuszokból álljon.

## 5. Business upgrades - a vállalkozás fejlődése

**Felhasználói prioritás:** elsőként olcsóbb és jobb szerelés, valamint jobb marketing. A több beálló nem a következő fejlesztési kör fő célja.

A vállalkozás fejlesztése pénzbe kerüljön. A játékos mérlegelje: új autót vásárol, vagy a későbbi üzleteket javító fejlesztésre költ. A fontos fejlesztések látszódjanak a pixel garázson is.

| Fejlesztési lehetőség | Tervezett üzleti hatás                                      | Vizuális változás                     |
| --------------------- | ----------------------------------------------------------- | ------------------------------------- |
| Better Tools          | Bizonyos javítások olcsóbbak                                | Új szerszámok, emelő                  |
| Diagnostic Equipment  | Megbízhatóbb vizsgálat, kevesebb javítás közbeni meglepetés | Diagnosztikai műszer                  |
| Parts Supplier Deal   | Olcsóbb alkatrészek; lehetséges szállítási várakozás        | Alkatrészes polcok                    |
| Detailing Station     | Jobb kozmetikai felújítás, vonzóbb hirdetés                 | Mosó- és polírozóállomás              |
| Local Advertising     | Több érdeklődő, rendszeres kiadás mellett                   | Újsághirdetés, plakát                 |
| Showroom Presentation | Jobb első benyomás és vevői bizalom                         | Világítás, rendezett tér, új cégtábla |

Ezek fejlesztési jelöltek, nem már megvalósított funkciók. A következő körhöz négyet javasolt kiválasztani; a végleges négyes még nincs eldöntve.

- [ ] Vásárlás előtt látszik az ár, a hatás és az esetleges rendszeres költség.
- [ ] A megvett fejlesztés ténylegesen módosítja a gazdaságot, és mentődik.
- [ ] A rendszeres költség nem rejtett: napváltáskor a pénzügyekben is követhető.
- [ ] A kedvezményeknek és bónuszoknak van felső határuk; nem vezetnek ingyenes javításhoz vagy garantált végtelen profithoz.

**Szerepek:** a marketing eléri a vevőket; a reputáció bizalmat épít; a személyes skill segít felismerni és lezárni a jó üzletet.

**Nyitott:** vételárak, fenntartási díjak, fejlesztési fokozatok, feloldási feltételek és a kedvezmények összeadódása. A garázsbővítés későbbi lehetőség marad, jelenleg nincs előre sorolva.

## 6. Nagy autóállomány - a fő hosszú távú feature

**Felhasználói cél:** nagyon sokféle autó, Gran Turismo léptékű választék. Az autókat ehhez külön meg kell rajzolni; a megjelenés kulcsfontosságú.

**Javasolt számszerű cél:** hosszú távon 300-500 külön modell. Ez a fejlesztési javaslat, nem a felhasználó által már jóváhagyott darabszám és nem egy Gran Turismo-játék tényleges autószámára vonatkozó állítás.

**Bővítési lépcsők:** 10 -> 30 -> 60 (jelenlegi, elkészült állomány) -> 150 -> több száz. Az eredeti javaslat első két bővítése elkészült. A minőségellenőrzés minden lépcsőnél szükséges.

### Minden modell tartalma

- [ ] Felismerhető karosszéria és igényes, saját sprite.
- [ ] Márka, modell, változat és korhű évjárati elérhetőség.
- [ ] Egyedi javítási költségek, megbízhatóság és tipikus hibák.
- [ ] Vevőkör, kereslet és eladhatóság.
- [ ] Ritkaság és esetleges gyűjtői érdekesség.
- [ ] Gazdasági hely a játékban: belépőautó, hétköznapi jármű, sportautó, klasszikus vagy ritkaság.

### Grafikai és adatgyártási folyamat

- [ ] Modellenként külön grafikai fájl; az induló tízes képlap megmaradt, a jelenlegi hatvan sprite hat atlaszban van.
- [ ] Egységes kameraállás, méretarány, talajvonal, fény és pixelkezelés.
- [ ] Ellenőrizni kell a modell felismerhetőségét, a sprite széleit, a kerekeket és a beállóba illeszkedést.
- [ ] Azonos karosszériájú változatok közös grafikai alapból készülhetnek, a különbségeik megtartásával.
- [ ] Minden grafika a projektben marad; nem függ instabil külső képforrástól.
- [ ] A katalógus adatai külön maradnak a gazdasági szabályoktól és a felülettől.
- [ ] A nagy készlethez megfelelő keresés és szűrés kell; több száz modell mellett is kezelhető maradjon a piac.

A bővítés előtt dönteni kell a modell és a felszereltségi/motorváltozat számításáról. A nagyságrend önmagában nem helyettesíti a vizuális és játékmeneti különbségeket.

### Car Collection album - v0.6-ban megvalósítva

- [x] Megmutatja, mely modelleket vetted, javítottad és adtad már el.
- [x] Láthatóak a még hiányzó ritkaságok és a gyűjtési előrehaladás.
- [x] Tartós célokat ad a profit és a fejlesztések mellett.

**Nyitott:** a végleges állományméret, a következő bővítés modelllistája (az első húsz és az azt követő harminc modell már bekerült), a grafikai gyártás tempója és az album részletes jutalmazása.

## 7. Véletlen helyi események

**Felhasználói sorrend:** a valódi tycoon-fejlődés után következzenek a gazdagabb kis random események.

A jelenlegi keresleti események és javítás közbeni hibák maradnak az alapban. A következő réteg személyesebb, a kereskedéshez kötődő helyzeteket adjon.

Javasolt események:

- Sürgős eladó vagy sürgős vevő.
- Helyi autóstalálkozó, amely egy kategória iránt növeli a keresletet.
- Alkatrészhiány és szállítási késés.
- Gyűjtői megkeresés egy konkrét modellre.
- Különleges magánhirdetés vagy beszámítási ajánlat.
- Vevői ajánlás, visszatérő vásárló vagy reklamáció.

- [ ] Az eseménynek tényleges gazdasági következménye vagy játékosi döntése van.
- [ ] A hatás időtartama és oka követhető.
- [ ] Az események nem teszik teljesen kiszámíthatatlanná a játékot.
- [ ] Az egyszer már aktivált jutalom nem kérhető újra mentés-visszatöltéssel.

## 8. Történelmi események és hírek

**Felhasználói igény:** a valódi naptári napon jelenjen meg, mi történt a világban, és a releváns események hassanak a kis vállalkozásra is.

### Két külön eseményréteg

1. **Valós világ:** ellenőrzött történelmi hír az esemény tényleges dátumán.
2. **Silver Palms:** véletlenszerű, fiktív helyi események.

### Történelmi tartalom szabályai

- [ ] Előre összeállított, forrással ellenőrzött idővonal; nincs kitalált történelmi dátum vagy tény.
- [ ] Elsőként az 1993-as kezdőidőszak kereskedésre releváns eseményei.
- [ ] Vizsgálandó témák: üzemanyagárak, gazdasági és kamatkörnyezet, autóipari hírek, modellbevezetések és az adott piacot érintő változások.
- [ ] A történelmi tény és a hozzá rendelt játékbeli hatás külön szerepel. A játékegyensúlyhoz választott százalékos hatás nem történelmi adat.
- [ ] A hírek a garázs rádióján és egy kattintható újságon keresztül is elérhetőek lehetnek.
- [ ] A hír elolvasása után visszakereshető a dátum, a forrás és az aktív gazdasági hatás.
- [ ] A hírek és hatásaik mentődnek; ugyanaz a történelmi esemény nem aktiválódik kétszer.
- [ ] A működéshez nincs szükség napi élő hírszolgáltatásra.

**Nyitott:** a játék hány évet fed le; a későbbi modellek a naptár előrehaladtával nyílnak-e meg; mely országok/piacok hatásai relevánsak Silver Palms számára. A több száz autós cél és a korhű évjárati szabály miatt ezt a nagy katalógusbővítés előtt tisztázni kell.

## 9. Javasolt fejlesztési sorrend

| Szakasz                           | Tartalom                                                                                                                       | Elkészülési feltétel                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| v0.4 - Progression foundation     | Lezárt alkukért XP, szintlépés, skillpontok; három skillág és három kezdő perk; reputációs mérföldkövek; négy business upgrade | A fejlődés mentődik, látszik és ténylegesen módosítja a játékmenetet; nincs jutalomfarmolás     |
| Tartalmi szakasz - v0.5-v0.6 kész | Autóadat- és sprite-gyártási alap; bővítés 30 modellre; Car Collection alapja                                                  | A modellek felismerhetőek, korhűek, gazdaságilag eltérőek és megfelelően jelennek meg           |
| Tycoon mélyítés                   | Visszatérő vevők, hibafeltüntetés, egyszerű reklamáció, reputációhoz kapcsolódó új üzletek; fejlesztések finomítása            | A bizalom és az üzleti döntések következménye érthető és befolyásolható                         |
| Élőbb világ                       | Gazdagabb helyi random események és az első ellenőrzött történelmi hírcsomag                                                   | Az események hatása követhető, időben korlátozott és helyesen mentett                           |
| Folyamatos tartalombővítés        | 60, 150, majd több száz autó; gyűjtési célok, ritkaságok és szükséges piaci szűrők                                             | A mennyiség növekedése mellett megmarad a grafikai minőség, kezelhetőség és gazdasági egyensúly |

A történelmi idővonal tervezése és az autólista előkészítése korábban is elkezdhető. A funkciók játékba építésének javasolt sorrendje a fenti; a felhasználó később módosíthatja.

## 10. A következő kör végrehajtható kerete

Az eredeti teljes fejlődési javaslat következő bővítéséhez a fennmaradó döntések:

- [x] Az első XP-jutalom és szintlépési ütem - v0.4-ben megvalósítva.
- [ ] A három kezdő perk pontos hatása és feloldása.
- [ ] Az első négy business upgrade kiválasztása, ára és hatása.
- [x] Kezdeti reputációs mérföldkövek és bónuszkorlátok - v0.4-ben megvalósítva.

Elfogadási feltételek:

- [x] Vételi és eladási alku lezárásakor helyes, egyszeri XP-jutalom.
- [x] Fejlődésre költhető skillpont és működő perk.
- [x] Megvásárolható, ténylegesen ható vállalkozásfejlesztések.
- [x] Látható reputációs előnyök és következő cél.
- [x] Régi v0.3-mentés adatvesztés nélkül betölthető; a hiányzó fejlődési adatok megfelelő alapértéket kapnak.
- [x] Az üzlet eredménye, a pénzmozgások és az új költségek egyeznek.
- [x] Az angol pixel garázs marad a játék fő felülete; az új fejlődési funkciók is a világba illeszkednek.
- [ ] Gazdasági és mentési működéstesztek, valamint tényleges böngészős vizuális ellenőrzés.

## 11. A roadmap használata

Új döntést ide kell rögzíteni, megkülönböztetve az ötletet, a véglegesített szabályt és a megvalósult funkciót. Egy tétel csak ellenőrzött megvalósítás után jelölhető késznek. A [README](README.md) a jelenlegi játék indítását és működését írja le; ez a roadmap a jövőbeli fejlesztés közös hivatkozási pontja.

A még nyitott tételek továbbra is tervek. A v0.4 fent részletezett szabályai már működnek; a későbbi bővítések előtt az új döntéseket külön kell rögzíteni.
