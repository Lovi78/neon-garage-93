# v0.12 - The Art of the Deal

Fejlesztés: 2026. október 11. Alap: `67c1d95`, helyi main és a frissített `origin/main` azonos. Fejlesztői branch: `codex/v0.12-art-of-the-deal`. Offline-first, 60 modell, két beálló, változatlan pixel garázs és rádió.

## Kiinduló audit

1. **Leegyszerűsített mechanikák:** `economy.nextDay` naponta kilenc új autóra cserélte a teljes piacot. A `negotiation.hagglePurchase` az első ajánlatkor generált egy 83-93%-os minimumot, három körrel. Az eladás egyetlen ellenajánlat után lezárult. Az eladóknak nem volt tartós személyiségük.
2. **Gazdasági hiány:** az alap vétel, javítás, eladás és hiteltőke már következetesen volt kezelve. A készlettartás viszont közös rezsibe került, nem a konkrét autó fedezetébe. Nem volt átírási költség vagy vizsgálati kockázatsáv. A napi új, 12-30%-os hullámok túl nagy és rövid árelmozdulásokat okoztak.
3. **Kihasználhatóság és irreális információ:** a korábbi mentett alkuk már védtek a minimumár újranyitásával történő újrasorsolás ellen. A hirdetések napi eltűnése viszont törölte az eladóval való kapcsolat következményeit. A vizsgálat biztosan felfedett mindent, az átvizsgált érték pedig a titkos valódi értéket mutatta. A javítás közbeni hibafeltárás már következetes és új árajánlatos volt, ezt megtartottuk.
4. **Újrahasznált alap:** autók, alkatrészek és hibák, műhely, collection, reputáció, visszatérő ügyfelek, reklamáció, XP, vevői megbízások, napi jelentés, hitel és üzletágak, pénzügyi történet, mentési kulcs. Nem épült új banki vagy könyvelési rendszer.
5. **Migráció:** a `version:1` és a mentési kulcs megmarad. `trading.schema:12` jelöli az új bővítést. Hiányzó autóadatok determinisztikus, az autó azonosítójából képzett alapértékeket kapnak egyszer; a következő mentés rögzíti őket. A hiányzó régi előélet semleges/ismeretlen: nem generálunk utólag balesetet vagy óramanipulációt. Pénz, autó, hiba, régi minimumár, folyó régi tárgyalás, XP és kész eredmény megmarad. Nincs utólagos készlettartási vagy átírási díj.

## Megvalósított szabályok

### Tartós piac és eladók

- Kilenc induló hirdetés, napi 1-3 új autó, legfeljebb 14 aktív hirdetés. A kisvárosi kínálat aggregált, a belépőmodellek gyakoribbak. Nincs teljes városlakó-szimuláció.
- Minden autóhoz mentett megjelenési nap, eredeti ár, árnapló, státusz, 18-41 napos lejárat és eladó tartozik.
- Nyolc élethelyzet: költözés, új autó, család, pénzigény, öröklés, gyűjtemény, projekt és költséges fenntartás. A sürgősség, türelem és rugalmasság ténylegesen hat az árra, az alkura és a kivárásra. A tudás befolyásolja az árelvárás tévedését; a kockázatvállalás más érdeklődő esetén számít.
- Sürgős eladók háromnaponta felülvizsgálják az árat. A hirdetés lejárhat, visszavonható vagy külső vevő viheti el. A kifizetett vizsgálat ilyenkor valódi, elveszett költség.
- A régiós célok jellemzően 90-110%-osak, 8-16 naposak; új kilátás 7-13 naponta. Napi legfeljebb 1,2 százalékpont célkövetés és 0,3 százalékpont zaj. A régi mentés korábbi erősebb terve kifut, nem kerül újrasorsolásra.
- A tényleges értékben évjárat, futás, alkatrészállapot, hibák, dokumentumok, sérülési/módosítási/mérföldelőzmény, modell kínálata és roadster-szezonalitás szerepel. A modell alapára és felszereltsége a meglévő katalógusból jön. Ritkaságot a kínálat és modellválasztás közelít, nincs külön ritkasági árprémium.

### Vásárlás és megismerhető információ

- Gyors vétel továbbra is lehetséges. Vagy: **Call seller**, opcionális kérdés, **Search vehicle records**, vizsgálat, taktika és ajánlat, **Accept & buy**.
- Mentett előélet: tulajdonosok, baleset, szervizdokumentáció, elmaradt karbantartás, módosítás, futáseltérés és festés.
- Alapvizsgálat: az állapot látható, hibafeltárás 58% + Mechanical-rangonként 8%. Szakvizsgálat: dupla vizsgálati díj, 88%-os hibafeltárás, dokumentumkereséssel. A véletlen felismerhetőségi érték az autó/hiba létrehozásakor mentődik, nem minden kattintáskor. Ismételt vizsgálat nem ad ingyenes új esélyt. A dokumentumkeresés $35.
- A nyilvános értékbecslés csak állapotmegfigyelést, eladói állítást és feltárt tényeket használ. Market Knowledge mérsékli az optimista állítást és szűkíti a kockázati tartalékot, nem olvassa a titkos valós értéket. A Sharp Eye korábbi ingyenes jelzése megmaradt.
- Deal Summary: ár, $50 átírás, ismert hibák javítási többlete, kockázati tartalék, várható értékesítési sáv, megmaradó készpénz és napi készlettartás. A hibaköltség nem tartalmazza az alkatrészek teljes feljavítását; az külön műhelyajánlat.

### Tárgyalás

- **Direct**, **Cash**, **Fault**, **Inspection**: eltérő feltételek között működnek. A gyors fizetés a sürgős eladónál erősebb; a hibás érveléshez friss, feltárt bizonyíték kell. A bizonyíték egyszer használható engedményhez, az alaptalan hibahivatkozás csökkenti a bizalmat.
- Minimum alapja a létrehozáskor mentett eladói rezerváció. Az eladó árcsökkentése, skill, reputáció és bizonyíték alakíthatja, új véletlen minimum nincs.
- Állapotok: active, waiting, walked, callback, agreed. A körök, napok, ajánlatok, taktika, bizonyíték és válasz története mentődik. Megszakítás után nincs azonnali újrapróba; az eladó később visszahívhat. A korábbi ajánlatok és elhasznált türelem nem törlődnek.
- Megállapodás a következő nap végéig érvényes. Új bizonyíték sértés nélkül megszakadt/lezárt alkut újranyithat. Az ismert áron történő közvetlen vétel továbbra is lehetséges; várakozó vagy visszahívásos állapotból előbb folytatni kell a beszélgetést.
- Negotiation rangonként 0,8% tárgyalási előny. One More Shot egy türelmi lépést ad. A régi, már elkezdett v0.11 tárgyalás saját régi korlátait megtartja.

### Vevők

- Napi ingázó, hétvégi rajongó, költségérzékeny vevő és családi autós. A karosszéria, műszaki állapot, szervizigény, dokumentáció, reputáció és hűség különbözően hat a fizetési hajlandóságra.
- A vevő lehet csak kérdező. Az **INQUIRY** nem eladható ajánlat: előbb választ kell adni. A bizonyíték nélküli állítás alacsonyabb ajánlatot eredményez.
- Nyitó ajánlat jellemzően a saját keret 94%-a, átvizsgált autónál 96%-a. A bizalom és a vevőnek releváns bizonyíték befolyásolja az ellenajánlat plafonját. Nagy kérésre visszaléphet, vagy több lépésben közelít a végső ajánlatához.
- Kapcsolat és ajánlat személyiségtől függően 2-5 napig él, legfeljebb három érdeklődő autónként. Visszatérő vevő ugyanazt a preferenciát tartja meg; új autóhoz új fizetési keret tartozik.
- A hirdetés újraárazása a régi ajánlatokat megszünteti. A lejárati figyelmeztetés csak valóban lejáró kapcsolatokat számol.

### Pénzügyek

- Vétel készpénzmozgás és készletbeszerzés, nem realizált veszteség. Hitel tőkéje továbbra sem bevétel vagy profit.
- Autófedezet = eladási ár - vétel - vizsgálat - javítás - átírás - vásárlástól felmerült $5/nap készlettartás - későbbi reklamációs hozzájárulás.
- A napi $20 közös rezsi, reklám, üzletági költség és kamat külön marad. A készlettartás már a konkrét autóhoz tartozik, nem vonjuk le újra közös rezsiként.
- A bill payment bontása holding / interest / overhead. A hátralék is megtartja ezt a bontást, így eladás után fizetett készlettartás sem lesz újra rezsi. Régi, ismeretlen összetételű hátralékból nem találunk ki utólag bontást.
- A készlet realizálható értékének óvatos becslése továbbra is a jelenlegi kereskedői kilépési ár. A nyilvántartás külön mutatja a bekerülést, javítást, átírást, felmerült holdingot, ténylegesen fizetett közös költséget/kamatot, cash flow-t és nettó vagyont.
- Nincs új adózási vagy banki alrendszer. A finanszírozás, üzletágak, megbízások és reklamációk meglévő integrációja megmaradt.

## Három kipróbálható helyzet

Az alsó **Practice** linkek külön mentést használnak. A **Return to your dealership** visszavisz a saját játékhoz. Practice New Game csak az adott gyakorlást kezdi újra.

- **A - Moving seller:** számítógép, Golf, Call seller, $1,700 ajánlat + Cash taktika. A $2,200-as hirdetés sürgős eladója elfogadja. Dönthetsz vizsgálatról, javításról, hirdetésről és várakozásról.
- **B - Suspicious car:** Golf, $2,100 közvetlen ajánlat. Még nem egyeztek meg. Mechanical inspection + Search vehicle records után fejhiba és problémás előélet derül ki. Ugyanaz a $2,100 ajánlat Fault taktikával már megegyezéshez vezet. A kedvezmény mellett a javítási kockázat is valós.
- **C - Slow stock:** már készleten lévő, $4,000-ért hirdetett Golf. Várj, figyeld a felmerülő holdingot és érdeklődést, vagy Remove listing után adj alacsonyabb árat. Az azonnali dealer exit pénzt szabadít fel, de veszteséget okozhat.

## Ellenőrzés és korlátok

A régi modulok regressziós tesztjei a régi API/kompatibilitási alapot vizsgálják. Az új `runtime.cjs` a tényleges `index.html` betöltési sorrendjét használja; az új 15 tárgyalási teszt és a DOM-tesztek a teljes v0.12 integrációt ellenőrzik. A korábbi UI-tesztben a vevői kérdés megválaszolását hozzá kellett adni: az érdeklődés tudatosan már nem azonnal elfogadható ajánlat.

25 reprodukálható, 200 napos futás, öt stratégia és öt mag. Naponta készpénz-napló egyeztetés; 25 naponta valódi mentésből folytatás. A botok nem olvassák az eladói rezervációt, rejtett hibát vagy vevői keretet. A készlettartási és közös költségek miatt az ügyletfedezet nem egyenlő a nettó vagyon változásával.

Valódi böngészős ellenőrzés: 490 pixel széles alapnézet és 1280 x 900 asztali ablak. A teljes A vétel-eladás körben $1,800 vétel, $50 átírás, $90 vizsgálat és $20 holding mellett $1,767 eladás történt: -$193 ügyletfedezet. A külön $80 rezsivel a záró készpénz $4,727 volt. A dokumentumot kérő családi vevő alacsonyabb ajánlatát elfogadtuk, ezért a veszteségnek értelmezhető oka volt. B-ben a $2,100 ajánlat vizsgálat előtt ellenajánlatot, a feltárt fejhiba és előélet után megegyezést eredményezett. Képi bizonyíték: [v012-browser-deal.png](reports/v012-browser-deal.png).

A botok egyszerűek: nem javítanak és nem nyitnak üzletágat. A magas áras bot szélsőségesen sokat vár; az agresszív bot gyakran sértő vagy nem elfogadható ajánlatot tesz. Ez összehasonlító első balanszmérés, nem történelmi realizmusbizonyíték vagy végleges játékosi egyensúly. Részletes adatok: [trading-simulation.json](reports/trading-simulation.json).

| Stratégia | Eladások | Átlagos készletnap | Nyereséges / veszteséges | Átlagfedezet | Cash-hiányos nap | Záró nettó vagyon |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Gyors | 35.4 | 3.73 | 13.8 / 21.6 | $-59 | 42.2 | $-545.6 |
| Óvatos | 62 | 2.47 | 51.2 / 10.8 | $383.6 | 0 | $17405.6 |
| Agresszív | 22.8 | 3.9 | 10.6 / 12 | $7 | 22 | $2613.2 |
| Magas áron kiváró | 6.6 | 36.14 | 2 / 4.6 | $-224.2 | 45.2 | $-188.8 |
| Sok készletet tartó | 21.4 | 7.93 | 6.8 / 14.4 | $-107.2 | 52 | $-814 |

Az adatok öt futás átlagai. Induló nettó vagyon: $5,000. Negatív vagyon lehetséges a számlahátralék miatt; a készpénz nem megy negatívba.

## Későbbi Real Economy fejlesztés

- Feltételes, vizsgálathoz kötött szerződés és foglaló; tesztvezetés, beszámítás, részletfizetés.
- Jobb árbecslő tanulás, megfigyelt összehasonlító eladások és mélyebb modell/motorváltozat szerinti kereslet.
- Nem pénzmozgás jellegű költségelhatárolás teljes vállalati eredménykimutatással; nem csak a kifizetett közös költségek kijelzése.
- Részletes karbantartási dokumentumok, előélet és hibák erősebb fizikai kapcsolata.
- Hosszabb emberi játékosi próba, több stratégia, javítást és üzletági befektetést is végző botok.
- Adózás és komplex bankrendszer külön verzióban.
