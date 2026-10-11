# Neon Garage '93 - v0.12 / The Art of the Deal

Játszható, körökre osztott autókereskedő-játék. Angol játékfelület, fiktív kaliforniai város, 1993. június 1., $5,000 kezdőtőke, két férőhely.

A teljes játékfelület angol. A korábbi mentések eseményei, hibaleírásai és pénzügyi bejegyzései betöltéskor angolra váltanak, a játékállás megtartásával.

Dokumentáció frissítve: 2026. október 11. Játékverzió: 0.12.0.

A teljes fejlesztési irány, a következő szakaszok és a nyitott döntések a [ROADMAP.md](ROADMAP.md) dokumentumban vannak rögzítve.

A kattintható tárgyakat állandó, finom mentazöld pixel sarokjelölés emeli ki. Rámutatáskor vagy billentyűzetes kijelöléskor aranyszínű lesz és megjelenik a funkció neve. A saját autók sziluettje is enyhe jelölést kap. Az alsó súgó a számítógéphez irányítja az első játékost; a napváltási jelenetben a jelölések nem látszanak.

## Indítás

Nyisd meg az `index.html` fájlt Chrome-ban, Edge-ben, Firefoxban vagy Safariban. Nincs szükség telepítésre, regisztrációra, adatbázisra vagy játékszerverre.

Macen az `Indítás.command` fájlra is kattinthatsz kétszer. Ha a rendszer blokkolja ezt, nyisd meg közvetlenül az `index.html` fájlt.

A játék minden változtatás után a böngésző helyi tárhelyére ment. Ugyanabban a böngészőben, ugyanarról a helyről nyisd újra a fájlt. Privát ablak vagy a böngészőadatok törlése miatt a mentés elveszhet. Ha a tárolás nem engedélyezett, a játék figyelmeztet.

## Az első üzleted

1. Számítógép: **Car Market**. Kilenc kezdőhirdetés, később napi 1-3 új autó és tartósan megmaradó korábbi kínálat.
2. Nyisd meg az autót. **Call seller** mutatja az eladás okát. A sürgős tulajdonos és a türelmes gyűjtő másként tárgyal.
3. Opcionális: **Search vehicle records** ($35), **Mechanical inspection** (alapdíj $90) vagy dupla díjas **Specialist examination**. A vizsgálat nem garantáltan teljes. A feltárt tények mentődnek.
4. **Your offer**, **Your approach**, **Make offer**. A gyors fizetés sürgős helyzetben, a **Fault** valós bizonyítékkal segíthet. **Think overnight** vagy **End the call** több napra is eltolhatja az ügyletet.
5. **Accept & buy**: kialkudott vételár + $50 átírás. Az azonnali vétel is elérhető. Maradjon készpénz vizsgálatra, javításra és rezsire.
6. Saját autó: szükséges javítás, majd **List car for sale**. A meglévő műhelykapacitás, normál/rush javítás és két beálló megmaradt.
7. **Next Day** után kérdés vagy ajánlat érkezhet. Az **INQUIRY** előbb választ igényel. Utána elfogadás vagy személyiségfüggő ellenajánlat, végül eladás. A kapcsolat 2-5 napig is élhet.
8. A napzárás autonként $5 készlettartást és a $20 közös rezsit is terheli. Magas ár mellett hosszabb készletidő és lekötött tőke kockázata van. A fix dealer exit azonnali, óvatosabb ár.

A **Practice A / B / C** linkek külön mentésen kipróbálható üzleti helyzeteket nyitnak. A saját játékot a **Return to your dealership** linkkel éred el. A részletes audit, szabályok, migráció és szimulációeredmények: [TRADING-V012.md](TRADING-V012.md).

## Egységes pixel art garázs

A rádió, telefon, dealer mappa, album és operations clipboard a háttérbe rajzolt, fényekhez és perspektívához illeszkedő tárgyak. A lapos CSS-ikonok és az állandó menütáblák megszűntek. A tárgyra mutatva vagy billentyűzettel kijelölve jelenik meg a funkció neve; kattintásra ugyanaz az ablak nyílik meg. A business upgrade állapotát az eredeti szerszámokra, alkatrészekre és poszterre mutatva, illetve a Dealer File ablakban lehet ellenőrizni.

## Alku vásárlásnál és eladásnál

A vételi tárgyalás nem fix három kör. Az eladó türelme, sürgőssége, bizalma, más érdeklődői és a friss bizonyíték határozza meg a reakciót. A régi ajánlatok, elutasítás és kivárás mentődik. A Conversation history dátumozva mutatja az ajánlatodat, taktikádat és az eladó válaszát. Másik érdeklődő mellett is először érdemi ellenajánlat érkezhet; nincs automatikus első körös várakozás. Visszahívás után a **Return seller’s call** folytatja az ügyletet, korábbi előzményekkel. A megállapodás a következő nap végéig él. Egy hirdetés közben elkelhet másnak.

A vevő lehet érdeklődő, ajánlattevő vagy már megegyezett partner. Az ajánlatot és a plafont a saját igényei alakítják: állapot, fenntartási költség, karosszéria, dokumentumok és a kereskedő hírneve. A szolgálati előélet vagy megbízhatóság csak az arra fogékony vevőnél indokol magasabb ellenajánlatot. A lezárásig nincs vételi/eladási pénzmozgás; a vizsgálat külön fizetett művelet.

Régi, már elkezdett v0.11-es tárgyalások saját mentett korlátaikkal folytatódnak. Új tárgyalások az új szabályokat követik. A régi mentésekhez nincs utólagos díj, új hiba vagy XP.

## Fejlődés és vállalkozásfejlesztések

Kattints a garázsban a **Dealer File** irodai mappára, vagy a felső fejlődési sávra.

- Lezárt, sikeres vételi és eladási alkuért 20 XP + minden $100 árelőny után 1 XP jár, legfeljebb 40 XP. Vételnél az eredeti hirdetési árhoz, eladásnál a vevő első ajánlatához képest számítjuk az előnyt. XP csak a tényleges tranzakciókor jár, egyszer; elutasításért és azonnali kereskedői eladásért nem.
- Az első szintlépéshez 80 XP kell, utána szintenként 40-nel nő az igény. A szintlépés 1 skillpontot ad, a többlet-XP megmarad.
- **Negotiation**: három rang, rangonként 1 skillpont. Új tárgyalásban rangonként 0,8% előny az eladói engedményben és a vevő ellenajánlati keretében. A már folyó tárgyalások korlátai változatlanok.
- **One More Shot**: Negotiation 2 után 1 skillpontért. Az eladó türelme egy lépéssel nő. A visszahívás külön, eladói helyzettől függő folyamat; a perk nem törli az előzményeket.
- **Better Tools**: $600, a javítás munkadíja 15%-kal alacsonyabb.
- **Parts Supplier Deal**: $900, a javítás alkatrészrésze és a feltárt hibák alkatrészköltsége 20%-kal alacsonyabb. Az alapjavítás munkadíj/alkatrész bontása 65/35; a kijelzett és levont ár a kedvezményeket tartalmazza.
- **Local Newspaper Ad**: $450 egyszeri befektetés. Ezután bekapcsolható és szüneteltethető a kampány: napi $20, +15 százalékpont érdeklődési esély. A napi díj napváltáskor jelentkezik, és pénzhiánynál automatikusan leáll a kampány. Nem keletkezik tartozás.

Reputációs mérföldkövek: 0 **Unknown Dealer**, 5 **Familiar Face**, 15 **Trusted Dealer**, 30 **Established Business**, 50 **Local Legend**. Az érdeklődés bónusza sorrendben 0, 3, 7, 12 és 18 százalékpont. A hirdetési ár továbbra is befolyásolja az érdeklődést; ajánlat nincs garantálva. A reputáció új tárgyalásokban továbbra is segít, legfeljebb 2% árkorlát-bónusszal. A **Dealer File** mutatja a következő célhoz hiányzó pontokat.

A régi v0.3-mentések megtartják a készpénzt, autókat és tárgyalásokat. Az új fejlődési adatok 1. szinttel, 0 XP-vel és fejlesztés nélkül indulnak. A korábbi üzletekre nincs utólag kitalált XP-jutalom.

A business upgrade és a reklám általános kiadásként szerepel a pénzügyekben; nem kerül automatikusan egyetlen autó profitjába. Az autófedezet eladás mínusz vétel, vizsgálat, javítás, $50 átírás, felmerült készlettartás és későbbi vevői hozzájárulás.

## Mozgó piac és üzemeltetés

### Tartós keresleti folyamatok

A régiós célok jellemzően 90-110%-osak és 8-16 napig élnek; új piaci kilátás 7-13 naponta érkezik. A kereslet naponta legfeljebb 1,2 százalékponttal közelít a célhoz, kis zajjal. A következő terv mentődik. A régi mentés korábbi erősebb hulláma fokozatosan kifut. A modell, helyi kínálat és roadster-szezonalitás is hat az árra.

A Moving markets panel mutatja az irányt. A hirdetés saját ára, a játékos megfigyelésekből számított becslése és a titkos NPC-értékek elkülönülnek. A panel nem garantál profitot.

### Új skillágak és perkek

A **Dealer File** két új ágat kapott; mindegyik 0-3 rang, rangonként 1 skillpont.

- **Mechanical Knowledge**: rangonként 15%-kal kisebb átvizsgálási alapdíj és 5%-kal kisebb javítási munkadíj. A meglévő eszközkedvezményekkel szorzódik. Rank 2-től az új normál motor-/váltójavítás is egy nap; a már megkezdett munkák határideje nem módosul.
- **Sharp Eye**: Mechanical Knowledge 2 után 1 pontért. Vásárlás előtt egy lehetséges rejtett hibára utaló ingyenes jel látszik. A perk nem végzi el az átvizsgálást és nem ad teljes állapotlapot.
- **Market Knowledge**: rangonként mérsékeltebb eladói állítás és szűkebb kockázati sáv. Nem olvassa vagy mutatja meg a titkos valódi értéket; nem jelöli az autót átvizsgáltnak.
- **Trend Spotter**: Market Knowledge 2 után 1 pontért. Megmutatja a következő tervezett régiós hullám célértékét és időtartamát; a napi zaj miatt ez előrejelzés, nem garantált profit.
- **Diagnostic Equipment**: $1,000-os business upgrade, további 20%-kal kisebb átvizsgálási díj. A minimális díj $30. A meglévő Negotiation és One More Shot változatlanul működik.

### Üzemeltetési költség és készpénztartalék

A garázs **Operations** tábláján követhető a következő számla, az esetleges hátralék és a műhely munkái.

- Bérleti és közüzemi költség: napi $20.
- Készlettartás: napi $5 autónként, a napváltáskor készleten lévő járművekre.
- A számla a következő reggelen fizetődik ki, a reklámdíj előtt. Napzárási megerősítésben előre látszik az összeg.
- Pénzhiánynál a készpénz nem megy negatívba; a fennmaradó számla hátralékba kerül és csökkenti a vállalkozás értékét.
- Hátralék mellett új autó, javítás és business upgrade nem vásárolható. A meglévő készlet továbbra is eladható, és az **Operations** ablakból a befolyt pénzzel rendezhetők a számlák.
- A kifizetés a Ledgerben holding / interest / overhead bontású. A $5/autó/nap holding a konkrét autó fedezetébe kerül, a közös rezsi és kamat külön marad. A hátralék is őrzi ezt a bontást, kettős költséglevonás nélkül.
- A régi mentésekben nincs utólagos számlaterhelés: az új költségek a következő tényleges napváltástól indulnak.

### Műhelykapacitás és gyorsjavítás

Alaphelyzetben egy normál, házon belüli munka lehet folyamatban. Nyitott Service Center mellett kettő, Fleet Workshop mellett három közös hely van; ezeken a saját javítások és az ügyfélmunkák osztoznak. A beállók száma továbbra is kettő; a műhelymunka korlátja külön működik.

A **Workshop booking** mezőben választható **Outsourced rush**: mindig egynapos, a teljes javítási ajánlatra +25% felárat tesz, minimum $80-at. A díj azonnal a bekerülés része, és a munka nem foglalja a házon belüli munkasávot. A műhely foglaltsága, a teljes költség és az elkészülési dátum látszik. Egy autó továbbra sem javítható és adható el párhuzamosan.

Ezekből valódi választás következik: megvárod a hullámot és kifizeted a készlettartást, olcsóbban de lassabban javítasz, vagy felárért gyorsan piacra lépsz. A játék továbbra is kézi napváltással működik, valós idejű nyomás nélkül.

## Vevői autómegbízások

Az **Operations** ablakban érhetők el. Jogosult reggelen 25% eséllyel érkezik új megkeresés, legalább négy napos közökkel; egyszerre legfeljebb egy el nem vállalt megkeresés vár döntésre. A feltételek mentődnek, betöltés nem sorsolja őket újra. Új megkeresésről értesítés és napi jelentés szól.

A korábbi nyolc fizetős helyi meghívásból nem generálódik új. A régi mentések függő meghívásai és fizetett hatásai kifutnak; szabályaik a [fejlesztési előzményekben](DEVELOPMENT-HISTORY.md) maradtak meg.

### Három megbízástípus

| Megbízás | Keresett autó | Állapot / futás | Idő elfogadástól | Fix vételár + bónusz |
| --- | --- | --- | ---: | ---: |
| Japanese weekend car | Japan / sport, roadster vagy hatch | legalább 75%, legfeljebb 150,000 miles | 4 nap | $7,500 + $300 |
| European daily driver | Europe / sedan vagy hatch | legalább 72%, legfeljebb 180,000 miles | 5 nap | $5,400 + $250 |
| American performance car | America / sport | legalább 78%, legfeljebb 140,000 miles | 5 nap | $9,500 + $400 |

A megkeresésre 3 napig lehet válaszolni. Elfogadáskor indul a fix határidő; legfeljebb 2 megbízás vállalható egyszerre. Nincs előleg, automatikus vásárlás vagy garantáltan megfelelő napi kínálat. A fix vevői árat a beszerzés és javítás várható költségéhez kell mérni.

Csak teljesen átvizsgált, minden hibájától megszabadított, javításból elkészült saját autó adható át, a határidő napját is beleértve. Az Operations ablak megmutatja a kész, megfelelő autókat, befektetésüket és várható profitjukat. Az átadás rendes eladás: az autó kikerül a garázsból, a fix vételár és bónusz egyszer érkezik meg, a profit, Ledger, album és pénzügyi grafikon frissül. +3 reputáció jár; alku nélkül nincs XP.

El nem vállalt megkeresés visszautasítása vagy lejárata ingyenes. Elfogadott megbízás elhagyása vagy lekésése 1 reputációt vesz el egyszer, készpénzbüntetés nélkül. A napzárás a mai megbízáshatáridőkre külön figyelmeztet, visszavezető gombbal. A reputáció nem mehet nulla alá.

Ezek fiktív vevői autómegbízások. Az ellenőrzött történelmi hírek külön, későbbi roadmap-tétel maradnak. Az egyensúly kezdeti szabályai játékosi visszajelzés alapján finomítandók.

## Nagy vállalkozási döntések

A **Dealer File** és az **Operations** ablakban új Business / Capital & Commitments rész van. A régi mentés pénze, autói és eredményei megmaradnak: új költség csak vállalt beruházással vagy hitellel keletkezik. A garázs továbbra is két saját autót tart; a bővítés üzletágat és műhelykapacitást nyit, nem új beállókat rajzol.

| Beruházás | Induló tőke | Építés | Napi fix költség nyitástól | Új működés |
| --- | ---: | ---: | ---: | --- |
| Independent Service Center | $24,000 | 6 nap | $180 | 2 közös műhelyhely, külsős javítási megrendelések; legalább 10 REP |
| Regional Fleet Workshop | $68,000 | 10 nap | további $320 | 3 közös műhelyhely, nagyobb flottamunkák; legalább 25 REP és nyitott Service Center |
| Wholesale Trading Desk | $45,000 | 8 nap | $250 | Legfeljebb két, 5 napra lekötött nagykereskedelmi tétel; legalább 20 REP |

Egy építkezés folyhat egyszerre. A beruházás ára előre kifizetendő; az új fix költség a nyitást követő reggeltől él. A flottaműhely a Service Center költségére rakódik: együtt $500/nap. A három üzletág összesen $137k beruházás és $750/nap személyzeti/üzemeltetési költség, a normál rezsi, készlettartás, reklám és hitelkamat előtt.

A beruházás megkezdése előtt külön áttekintés mutatja a maradó pénzt és az új heti fix terhet. Az aktuális 7 napos költség, bevétel nélküli készpénz-fedezet és az elmúlt 7 nap tényleges működési pénzmozgása külön látszik. A 7 napos költség és cash runway az ismert építkezési nyitásokat és hátralékot is figyelembe veszi. A jelenlegi készletet és reklámállapotot feltételezi, további döntéseket vagy befolyó munkadíjat nem. Ez nem garantált jövőbeli pénzállás.

### Szerviz mint második bevételi forrás

Nyitott szerviz mellett legkorábban 2 naponta érkezik új, 3 napig megválaszolható ügyfélmunka; egyszerre egy új megkeresés vár döntésre. Normál munkánál $1,200-$3,200 alkatrészt kell előfinanszírozni, a költség fölötti számlamargin $900-$1,900, átfutás 2-4 nap. Nyitott flottaműhelynél 60% eséllyel nagyobb munka jön: $6k-$12k előlegnyi alkatrészköltség, $3k-$6k számlamargin, 4-6 nap átfutás.

A teljes költség, számla és idő elfogadás előtt látható, a konkrét feltételek mentődnek. A költséget azonnal levonja, a fix számlát elkészüléskor egyszer fizeti ki a játék. Elutasítás és az el nem vállalt ajánlat lejárata ingyenes. Az ügyfélmunka ugyanazokat a műhelyhelyeket foglalja, mint a saját autók normál javítása. A rush javítás külön marad. A fizetett ügyfélmunkát nem lehet félbehagyni; személyzeti költség üres műhely mellett is van. A számlamargin nem nettó nyereség: a fix költségeket még ki kell termelni.

### Nagykereskedelmi tőkelekötés

A Wholesale Trading Deskben szegmens és $25k vagy $50k tétel választható. Az összeg azonnal kikerül a szabad készpénzből; 5 napig nincs korai kiszállás. A belépési kereslet és a végrehajtási eltérés mentődik, újratöltés nem sorsolja újra.

Elszámolás: `tőke × (1.10 × záró kereslet / belépési kereslet + végrehajtási eltérés)`, ahol az eltérés -4 és +4 százalékpont közötti. A kifizetés a tőke 60%-a és 150%-a közé korlátozott. Egy $50k tétel így $30k-$75k között fizethet vissza, azaz $20k veszteség vagy $25k nyereség is lehet a külön fizetett működési költségek előtt. Nincs garantált tőkevisszafizetés. A záró kereslet az elszámolás reggelén, a napi piaci változás után érvényes érték.

### Finanszírozás és visszavonulás

- Business credit: 10 REP-től $10k, 25 REP-től $50k hitelkeret. A felvétel és törlesztés $10k-os lépésekben történik; az utolsó kisebb tartozás egyben törleszthető. Egyszerű kamat: heti 2%, naponta kerekített összeggel. A tőke addig tartozás marad, amíg vissza nem fizeted; nincs automatikus tőketörlesztés.
- A hitel nem bevétel, és nem növeli a nettó vállalkozásértéket. Kamatát a következő reggeli üzemeltetési számla tartalmazza. Hitelből a lejárt számla is rendezhető. Hátralék mellett új beruházás, ügyfélmunka és nagykereskedelmi tétel nem indul.
- Szüneteltetéskor nincs új üzletági tevékenység, de 25% napi megtartási költség marad. Aktív ügyfélmunka vagy nagykereskedelmi tétel mellett nem szüneteltethető vagy eladható az érintett üzletág. Műhelykapacitás-csökkentést akadályoz a túl sok saját futó javítás; a Service Center előtt a ráépülő flottaműhelyt kell felszámolni.
- Építkezés lemondásakor 50%, kész üzletág eladásakor 40% beruházási ár térül vissza. A különbözet valódi befektetési veszteség. Az újranyitás ismét a teljes napi költséget indítja.
- Kevés készpénznél a meglévő számlahátralék-szabály lép életbe. Az eszközérték vagy lekötött tőke nem fizeti ki automatikusan a napi számlát. Egy aznap elkészülő munka kifizetése a rezsi levonása után jön; ilyenkor a maradó hátralék kézzel rendezhető.

### Pénzügyi követés

A **Deal margin** az autók lezárt profitját és a szerviz/nagykereskedelem lezárt számlamarginját együtt mutatja. Nem tartalmazza a rezsit, kamatot vagy beruházási veszteséget; ezek a Ledgerben, készpénzben és vállalkozásértékben látszanak. A 7 napos operating cash flow minden tényleges pénzmozgást számít, kivéve tőkeberuházást/felszámolást és hitelfelvételt/tőketörlesztést; a készletvásárlás benne van.

A nettó érték: készpénz + saját autók azonnali kereskedői értéke + épülő üzletágak 50%-os/kész üzletágak 40%-os felszámolási értéke + futó munkák előfinanszírozása és nagykereskedelmi tőke bekerülési áron - hiteltőke - számlahátralék. A bekerülési érték nem ígéret a megtérülésre. A napi jelentésben a nyitások, új munkák és lezárt kifizetések is megjelennek.

Az apró v0.10-es választható helyi eseményekből nem érkezik több. A korábban kifizetett hatás és meglévő meghívás az eredeti feltételekkel kifut; a vevői autómegbízások változatlanul megmaradnak. A következő fejezetek is a jelenlegi működést írják le; a korábbi állapotok külön történeti dokumentumban vannak.

Az összegek és kockázatok játékegyensúly-szabályok, nem valós 1993-as gazdasági adatok. A működési és késői mentési tesztek sikeresek; 25 darab 200 napos automatizált balanszmérés és böngészős próba készült; hosszabb emberi játékosi egyensúlyteszt továbbra is szükséges.

## Fejlődési sávok és pénzügyi grafikon

A felső sávban az XP és a következő reputációs mérföldkő is követhető. A Dealer File-ban a Negotiation rang, a perk rangkövetelménye és a business upgrade megfizethetősége is sávot kapott. A készpénzsáv azt jelzi, megengedheted-e a fejlesztést; nem jelent félretett pénzt vagy automatikus vásárlást.

A **Ledger** két vonallal mutatja a **Deal margin** és **Business value** alakulását. A margin az autóüzletek és a lezárt szerviz/nagykereskedelmi munkák eredménye; nem nettó üzleti profit. A nettó vállalkozásérték az üzletági eszközöket, lekötéseket, hitelt és hátralékot is számolja. A pontos képletek a „Nagy vállalkozási döntések” fejezetben szerepelnek. Becsült márkaértéket nem adunk hozzá.

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

- **Inspected / disclose observed faults**: átvizsgálás kell. A felismert megmaradt hibák vannak feltüntetve, az ismeretlenekre nincs hibamentességi ígéret. A normál, állapotfüggő +1/+2 reputáció mellé +1 jár a korrekt tájékoztatásért. Ilyen leírás mellett nem érkezik elhallgatott hibára reklamáció.
- **As-is / condition not guaranteed**: őszintén vállalod a bizonytalanságot. Az ajánlatok alapértéke 5%-kal alacsonyabb, az eladás +1 reputációt ad. Nincs hibamentességi ígéret és ebből következő reklamáció.
- **Advertise as fault-free**: a vevő hibalevonás nélkül értékeli az autót. Ha ténylegesen maradt javítatlan rejtett hiba, az eladás után két játék nappal reklamáció érkezik. Ha minden hiba javított, nincs ilyen reklamáció.

A garázs **Customers** telefonja megnyitja a vevői mappát. Magáneladáskor elmentődik a vevő, a preferált régió, a vásárlásszám, a nettó költés és a bizalom. A kereskedői eladás nem hoz vevőkapcsolatot. Legalább 1 bizalomponttal a vevő visszatérhet egy megfelelő régiójú autóhoz. Az alap visszatérési esély 15%, reputációpontonként +0.5 százalékpont, maximum 60%, ha a napi ajánlat egyébként létrejön. A visszatérő ajánlat 3% lojalitási felárat kap, legfeljebb a hirdetési árig. Ez nem garantált napi vásárlás.

### Reklamáció kezelése

A hibamentes ígéret megszegése a reklamáció megérkezésekor -4 reputációt és -2 vevői bizalmat okoz. Felső értesítősáv és a telefon jelzése mutatja a nyitott ügyet. A **Customers** ablakban látszik az autó, a feltárt hiba, az összeg és a válasz határideje.

- **Contribute to repairs**: a megmaradt hibák költségének fele, legalább $50, de legfeljebb az eladási ár 15%-a fizethető. A minimumot a 15%-os felső határ felülírhatja. Az ügy rendezése +1 reputációt visszaad és +3 vevői bizalmat ad. A készpénz, az eredeti eladás profitja, az album modellprofitja és a mai grafikonpont is csökken a kifizetéssel.
- **Decline**: nincs fizetés, további -2 reputáció és -1 bizalom.
- **Válasz nélkül hagyás**: a megérkezéstől számított harmadik napra lépve lezárul az ügy, további -3 reputációval és -1 bizalommal. Nincs automatikus pénzlevonás.

A reputáció nem mehet nulla alá. Pénzhiány esetén a hozzájárulás nem fizethető ki; rendezheted a határidő előtt, ha pénzhez jutottál, vagy elutasíthatod. Nincs automatikus negatív egyenleg. A reputációhoz kötött Business credit külön, kézi finanszírozási lehetőség. Egy ügy csak egyszer rendezhető. Függő vagy nyitott reklamáció alatt az érintett vevő nem ad visszatérő ajánlatot.

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

## Garázshangulat és rádió

- A megerősített napzárást 1,9 másodperces jelenet követi: leereszkedő redőny, esti elsötétülés, majd reggeli nyitás. Ezután nyílik meg a napi összefoglaló. **Skip animation** vagy Escape azonnal a jelentésre ugrik.
- A nap és minden pénzügyi változás a jelenet előtt mentődik. Kihagyás és újratöltés nem ismétli meg a napváltást; a még olvasatlan jelentés visszajön.
- Finoman mozgó porszemek és időnkénti utcai fények teszik élőbbé a garázst. A rendszer csökkentett mozgás beállításával a napváltási jelenet kimarad, a háttérmozgás leáll.
- A polcon lévő kis **RADIO** tárgy vagy az alsó rádiópanel nyitja a választót. Három fiktív, 1993 hangzását idéző adó saját, szintetizált instrumentális loopokkal: **Neon FM 94.3** (szintipop), **Palms Groove 93.0** (hiphop/funk), **Rust FM 101.7** (alternatív rock ihlette riffek).
- Az adóra kattintva indul a zene. Külön leállítás és hangerőcsúszka van; a kijelző játék közben mozog. Internetkapcsolat és letöltött zenefájl nem kell.
- Az adó és hangerő külön helyi beállításként mentődik. Újraindításkor a rádió csendben marad, amíg el nem indítod. A játékállást és a gazdaságot nem módosítja.

## Autóképek kivágása

Mind a 60 modell saját SVG-körvonalmaszkot kapott. A megjelenítés a tényleges járműből dolgozik, az atlasz feltételezett oszlophatárai helyett. A kivágás a garázsban, a piacon, az albumon és az adatlapokon közös. Az eredeti sprite-fájlok megmaradtak; a fizikailag összeérő Delta és Saab külön forrásképet kapott. A megoldás és a generáló promptok a [SPRITE-FIX-V071.md](assets/SPRITE-FIX-V071.md) dokumentumban vannak.

## Felépítés

- `js/enterprise.js`: tőkeberuházások, külső szerviz/flottamunkák, nagykereskedelmi lekötések, hitel, likviditás és üzletági érték.
- `js/opportunities.js`: vevői autómegbízások és a korábbi mentések kifutó helyi eseményei.
- `js/ambience.js`: napváltási jelenet, kihagyás és mozgáscsökkentés.
- `js/radio.js`: három saját Web Audio adó, hangerő és rádióbeállítások.
- `js/legacy-language.js`: régi magyar mentési szövegek angolra alakítása.

- `js/catalog-v06.js`: a második harminc modell és a hozzájuk tartozó sprite-manifest.
- `js/strategy.js`: többnapos piaci hullámok, tervezett következő trend, üzemeltetési számlák, műhelyidő, specialistaskillek és perkek.
- `js/day-report.js`: lezárt nap és következő reggel összesítése, menthető összefoglaló.
- `js/sprite-clips.js`: generált, modellenkénti körvonalas kivágások.
- `scripts/build-sprite-clips.py`: a kivágási adatok újraépítése fejlesztéskor.
- `js/customers.js`: hirdetési leírások, vevőkapcsolatok, lojalitási ajánlatok, reklamációk és reputációs napló.
- `js/collection.js`: vásárlási, javítási és eladási gyűjtési állapot, korábbi mentések bizonyított adatainak átvétele.
- `js/cars.js`: modelladatok, alkatrészek, hibák, autóillusztrációk.
- `js/economy.js`: árak, vásárlás, javítás, eladás, napok és események.
- `js/trading.js` - v0.12 tartós piac, NPC-k, vizsgálati információ és tranzakciós integráció.
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

A játék indításához nincs telepítés. Fejlesztői ellenőrzéshez a játék mappájában:

```sh
npm install
npm test
npm run test:ui
npm run test:simulation
```

A régi modulok regressziós alaptesztjei mellett az új 18 integrált teszt a tényleges játék betöltési sorrendjével ellenőrzi az NPC-döntést, hirdetéséletciklust, vizsgálatot, információrejtést, vételt/eladást, pénzmozgást, migrációt, visszahívást és szélsőséges likviditást. A teljes DOM-játékmenet és a három új gyakorlóhelyzet is tesztelt.

A szimuláció 5 stratégia x 5 véletlenmag x 200 nap. Minden nap készpénz-napló egyeztetés, 25 naponta mentésből folytatás; külön reprodukálhatósági ellenőrzés. Kimenet: [reports/trading-simulation.json](reports/trading-simulation.json). A számok első balanszmérésből származnak; nem történelmi gazdasági adatok.

Valódi böngészős próba helyi kiszolgálással is készült. Ez nem játékfüggőség: a játék továbbra is közvetlen `index.html` megnyitással működik. A rádió hangját és hosszabb emberi játékélményt külön játékosi próba tudja megítélni.

## Korlátok és következő lépések

- 60 modell és két saját autóbeálló. A nagy beruházások kapacitást és üzletágat nyitnak, külön új telephelygrafika nincs.
- A személyzet költségként jelenik meg; egyedi alkalmazottak felvétele és beosztása nincs.
- Nincs automatikus csődvége. Készleteladás, hitel és a kötelezettségektől függő üzletági felszámolás segíthet a likviditási gondokon.
- A mentés helyi, ugyanahhoz a böngészőhöz és fájlhelyhez kötődik. Felhőmentés és mentésexport nincs.
- Az új kis helyi meghívások generálása megszűnt; a vevői megbízások megmaradtak.
- Valós, dátumhoz kötött történelmi hírek még nincsenek. A rádió fiktív saját zenét játszik.
- A következő javasolt irány a vállalkozási döntések mélyítése és egyensúlyozása, majd a megbízások bővítése. A 150 és több száz autós cél megmarad. A részletek a [roadmapben](ROADMAP.md), az eredeti ötletek és verzióelőzmények a [fejlesztési előzményekben](DEVELOPMENT-HISTORY.md) vannak.
