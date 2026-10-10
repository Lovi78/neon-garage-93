# Neon Garage '93 - aktuális fejlesztési roadmap

Frissítve: 2026. október 10. Jelenlegi verzió: v0.11.0 / Business Empire.

A jelenlegi működés szabályai a [README-ben](README.md), az eredeti javaslatok és verziónkénti feljegyzések a [DEVELOPMENT-HISTORY.md](DEVELOPMENT-HISTORY.md) dokumentumban vannak. Az előzmények megmaradtak; az ottani régi státuszok nem a mai állapotot jelentik.

**Státuszok:** kész = megvalósult működés; nyitott = még szükséges ellenőrzés vagy döntés; terv = felhasználói cél, még nincs kész; javaslat = ajánlott következő lépés, nem új fejlesztési vállalás. A tesztek nem bizonyítják önmagukban a vizuális minőséget vagy a tartós játékélményt.

## Termékirány és elfogadott prioritások

- Angol felületű, pixel art autókereskedős tycoon. Magyar fejlesztési dokumentáció.
- Fiktív Silver Palms, Kalifornia; indulás 1993. június 1., $5,000, két saját beálló, 0 reputáció.
- Kézi napváltás, valós idejű kényszer nélkül. Pénzügyi döntések és veszteségkockázat, egyszerű böngészős indítás és helyi mentés.
- A garázs maga a menü; a tárgyak illeszkedjenek az eredeti pixel art világba. Legyen egyértelmű, mire lehet kattintani.
- Igényes, felismerhető autók és hosszú távon Gran Turismo léptékű állomány. A hasonlat a választékra vonatkozik; versenyzés nincs a jelenlegi feladatban.
- Személyes fejlődés alkukból, valamint vállalkozásfejlesztés. Elsősorban szerelés, marketing és működés, a több beálló másodlagos.
- A puszta vétel-eladás később repetitív: a fő prioritás tartalmas vállalkozásépítés, nagy tőkeigényű döntések és összetettebb üzemeltetés.
- A megbízások jó irány. Az apró, alacsony hatású fizetős események jelenlegi formáját elvetettük.
- Később releváns, ellenőrzött történelmi események a valódi naptári dátumukon.

## Kész rendszerek v0.11-ben

| Terület | Jelenlegi megvalósítás |
| --- | --- |
| Kereskedés | Naponta 9 hirdetés, vételi és eladási alku, vizsgálat, rejtett hibák, ötféle javítás, hirdetés, ajánlatok és fix kereskedői kiszállás |
| Autóállomány | 60 modell, korhű játékbeli évjáratok, saját sprite-ok, modellenkénti körvonalmaszk; Delta és Saab külön forrásképpel |
| Gyűjtemény | Kereshető/szűrhető album, vételi-javítási-eladási pecsétek, modellprofit és kozmetikai célok |
| Személyes fejlődés | Egyszeri XP lezárt árelőnyös alkukért, szintlépés és skillpont; Negotiation, Mechanical Knowledge, Market Knowledge 0-3 rang |
| Perkek | One More Shot, Sharp Eye, Trend Spotter; mindegyik a hozzá tartozó skill 2. rangja után 1 pontért |
| Kis fejlesztések | Better Tools $600, Parts Supplier Deal $900, Local Newspaper Ad $450, Diagnostic Equipment $1,000 |
| Reputáció | 0/5/15/30/50 mérföldkő, érdeklődési és alkubónusz, visszatérő vevők, bizalom, hibaközlés és reklamáció; üzletági és hitelfeltételek |
| Piac és üzemeltetés | Napi új, 2-4 napos régiós keresleti hullámok; rezsi, készlettartás, hátralék, közös műhelykapacitás és fizetett rush |
| Autómegbízások | Három vevői igény, fix vételár és bónusz, vállalási és szállítási határidő, követhető készültség, reputációs következmény |
| Nagy beruházások | Service Center $24k, Fleet Workshop $68k, Wholesale Trading Desk $45k; építési idő, reputációs feltétel és rendszeres költség |
| Új bevételi utak | Saját javítással közös kapacitású ügyfél-/flottamunkák, előfinanszírozás; 5 napos $25k/$50k nagykereskedelmi lekötés, tőkevesztés lehetőségével |
| Finanszírozás | Reputációhoz kötött $10k/$50k hitelkeret, napi kamat és kézi törlesztés; üzletági szüneteltetés és veszteséges felszámolás |
| Pénzügyek | Deal margin és vállalkozásérték grafikon, tételes Ledger, lekötött tőke, 7 napos költség és cash flow, bevétel nélküli cash runway |
| Követhetőség | Napzárás előtti megerősítés és lejárati figyelmeztetés, felugró napi jelentés, ajánlat-/megbízás-/ügyfélmunka-értesítések |
| Hangulat | Integrált pixel art tárgyak, kattinthatósági jelölések, autóbegurulás, javítási szikrák, kihagyható napzáró/nyitó jelenet, három saját fiktív rádióadó |
| Mentés | Helyi automatikus mentés, régi állások megtartása, új mezők alapértékei; nincs visszamenőleges becsült XP vagy új üzletági díj |

A három nagy beruházás összesen $137k és aktívan $750/nap, a normál rezsi, készlettartás, reklám és kamat előtt. A szerviz és flotta bevétele nem nettó nyereség; a nagykereskedelmi tétel legfeljebb 40% tőkét veszíthet. A két saját autóbeálló változatlan.

## Lezárt döntések és kivezetett funkció

- Sikeres alku: ténylegesen lezárt, eredeti vételi árhoz vagy első vevői ajánlathoz képest árelőnyt hozó ügylet. XP: 20 + egész $100-onként 1, maximum 40; szintküszöb 80, majd +40 szintenként. Alkumentes eladás és megbízásátadás nem ad XP-t.
- A One More Shot csak eladói tárgyalásban ad negyedik kört; lezárt tárgyalást nem nyit újra.
- A három kezdő skillág, három perk és négy kis vállalkozásfejlesztés már kész. Új fokozatok és tartalmak későbbi döntések.
- Az album céljai jelenleg kozmetikaiak, nem termelnek külön pénzt vagy XP-t.
- A nyolc kis v0.10-es helyi meghívás új generálása megszűnt. Meglévő mentésben a meghívás és fizetett hatás az eredeti feltételekkel kifut. Nincs visszatérítés vagy utólagos büntetés.
- A piaci keresleti hírek, javítás közbeni hibák, vevői reklamációk és autómegbízások megmaradtak. A kis meghívások kivezetése ezeket nem érinti.

## Következő javasolt fejlesztési sorrend

1. **Vállalkozási egyensúly és hosszabb játékosi próba.** Mérni, melyik üzletág mikor térül meg, mennyire nehéz előfinanszírozni, és mi ad célt 100-200 nap után. A pénzügyi kockázat legyen előre érthető és befolyásolható.
2. **Üzletáganként mélyebb fejlődés.** Változó ügyfélkereslet, tartós partnerkapcsolatok, szerződéses munkák és egymást kizáró pénzügyi vállalások. Újabb bónuszgombok helyett eltérő üzleti stratégiák.
3. **Megbízások bővítése.** Többféle keresett autó, visszatérő megbízók, tárgyalható feltételek. A határidő, kapacitás és várható margin együtt alakítsa a döntést.
4. **Autótartalom bővítése.** Következő modelllista és gyártási folyamat véglegesítése, majd 150 és több száz modell. A grafikai minőség és kezelhetőség maradjon feltétel.
5. **Ellenőrzött történelmi hírek.** Kezdő időszakra forrásolt idővonal, külön megjelölt játékbeli hatásokkal, később hosszabb naptári lefedés.

Ez ajánlott sorrend. A konkrét következő fejlesztési csomag, ára és szabályai még nem véglegesek.

## Megmaradó tartalmi tervek és nyitott döntések

### Vállalkozás és reputáció

- [ ] Üzletági fejlődési fokozatok és eltérő stratégiák; egyedi személyzet, ha valódi döntést ad.
- [ ] Detailing Station és Showroom Presentation: eredeti jelöltek, még nincsenek megvalósítva.
- [ ] Alkatrészszállítási várakozás/hiány, garázsbővítés és új telephelyek: későbbi lehetőségek, nem a mostani fő prioritás.
- [ ] Vevői ajánlások, ismerősi megkeresések, gyűjtők, beszámítás és különleges magánhirdetések.
- [ ] További skillek/perkek: hatások és feloldások kiválasztása; az új információ és döntési lehetőség fontosabb a puszta százalékhalmozásnál.
- [ ] A jelenlegi költségek, reputációs bónuszok és XP-ütem finomítása hosszabb játékosi tapasztalat alapján.

### Nagy autóállomány

- [x] 10 -> 30 -> 60 modell és gyűjtőalbum.
- [ ] 150, majd több száz modell. A 300-500-as sáv korábbi fejlesztési javaslat, nem jóváhagyott végleges darabszám.
- [ ] Eldönteni, hogyan számoljuk az azonos modell motor-/felszereltségi változatait, és mi lehet közös grafikai alap.
- [ ] Modellenként részletesebb tipikus hibák, megbízhatóság és vevőkör. Most modelladatok, régiós kereslet és szerviz-/hibakockázati eltérések vannak, a hibatípusok közös készletből származnak.
- [ ] Modellenként külön grafikai fájl gyártási folyamata. Most hat atlasz és két izolált javítókép, közös körvonalas megjelenítéssel.
- [ ] Teljes grafikai/évjárati minőségellenőrzés és több száz modellre skálázott keresés/szűrés. A jelenlegi album keresése és régiós/gyűjtési szűrése kész.
- [ ] Végleges állományméret, következő modelllista, gyártási tempó és további gyűjtési célok/jutalmazás.

A sprite-ok maradjanak helyben, azonos kameraállással, megfelelő talajvonallal és felismerhető karosszériával. A mennyiség nem helyettesíti a vizuális és játékmeneti különbségeket.

### Események és történelem

- [ ] Csak érdemi következményt adó helyi helyzetek: például alkatrészhiány, különleges beszámítás, gyűjtői igény vagy nagyobb keresleti esemény. A kivezetett apró meghívások változatlan visszahozása nincs előirányozva.
- [ ] Valódi dátumokra épülő, forrásolt 1993-as idővonal: gazdasági/kamatkörnyezet, üzemanyag, autóipar és modellbevezetések.
- [ ] A történelmi tény és a hozzá választott játékbeli gazdasági hatás külön kezelése.
- [ ] Visszakereshető dátum, forrás és hatás; egyszeri aktiválás, mentés, élő hírszolgáltatás nélkül.
- [ ] Hírek elérhetősége rádión/újságon keresztül. A jelenlegi rádió nem történelmi hírszolgáltatás.
- [ ] Lefedett játékévek, releváns országok/piacok és a későbbi autók naptári feloldása. Ezt a nagy katalógusbővítés előtt tisztázni kell.

## Ellenőrzés és elfogadási feltételek

- [x] v0.11-ben 93 szabályteszt és 8 DOM-alapú felületi útvonal sikeres; pénzmozgások, egyszeri jutalmak/kifizetések, kapacitás, határidők és mentés ellenőrizve.
- [x] A pixel art garázs és az angol felület maradt az alap; a régi mentésekhez nincs kitalált múlt vagy utólagos új üzletági terhelés.
- [ ] Valódi böngészős vizuális próba: tárgyjelölések, kattintási területek, garázs/autóilleszkedés, ablakok, animáció és kisebb képernyő.
- [ ] Rádió meghallgatása valódi böngészőben; a jelenlegi teszt hangkörnyezet-helyettesítéssel működik.
- [ ] Hosszabb játékosi egyensúlyteszt, különösen a nagy beruházások, üresjárati költségek, hitel és tőkelekötés mellett.

Új döntést ide kell rögzíteni, a jelenlegi működési szabályt a README-be, a lezárt fejlesztési kör feljegyzését az előzményekbe. Készre jelöléskor a megvalósítást és ellenőrzését külön kell megnevezni.
