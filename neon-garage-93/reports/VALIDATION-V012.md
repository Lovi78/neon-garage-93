# v0.12 ellenőrzési feljegyzés

Dátum: 2026. október 11. Branch: codex/v0.12-art-of-the-deal. Alap: 67c1d95.

- npm test: exit 0, 111 PASS bejegyzés, ebből 18 új teljes v0.12 integrációs teszt.
- npm run test:ui: exit 0, 15 sikeres tesztcsoport, köztük a három új gyakorlás.
- npm run test:simulation: exit 0, 25 darab 200 napos futás, naponta cash reconciliation, 25 naponta betöltött állapotból folytatás, külön azonos magú reprodukció.
- git diff --check: sikeres.
- Böngésző: valódi A vétel-eladás és B bizonyítékos alku; 490 pixel alapnézet, 1280 x 900 asztali méret. A tesztek külön practice mentést használtak.
- Régi, már nyitott tárgyalás migrációja, véletlen újraminimum/új hibasorsolás és tranzakcióduplikálás elleni ellenőrzés sikeres. Ez nem teljes biztonsági bizonyítás; kézi localStorage szerkesztés vagy kézzel visszaállított mentés nem védett.

A rádió hangját nem hallgattuk végig. Hosszabb emberi balanszpróba, üzletágas/javítós szimuláció és több környezetben végzett kompatibilitási próba továbbra is nyitott.

Utóellenőrzés: a konkurens érdeklődő miatti első körös várakozás és a visszahívás utáni azonnali újabb szünet javítva. 5%-os ajánlatra érdemi ellenajánlat, új hívásban új türelmi keret, hat régi előzmény egyszeri migrációja és dátumozott UI-beszélgetés regressziótesztje sikeres. A szimulációs riport és a dokumentáció táblázata a javított kódhoz frissítve.

v0.12.1: npm test és npm run test:ui exit 0. Két új ellenajánlati UI-regresszió sikeres. Külön böngészős fixture-ben $14,000-ra a vevő $12,698 ellenajánlatot adott; az érvénytelen összeg hibája az ajánlatkártyán látszott. Az összegek kontrollált tesztadatok, nem a játékos mentéséből származnak. Keskeny, 390 pixeles nézetben a mező teljesen látható maradt. Képi bizonyíték: counteroffer-fix.png.

v0.12.2 - UI-only: npm test exit 0, 111 PASS; npm run test:ui exit 0, 15 tesztcsoport. Új Operations-teszt: négy fül, látható teendők és blokkolási ok, munkavállalás, megbízási kifizetés, nagykereskedelmi kockázat, billentyűzetes navigáció, mentés változatlansága és elérhető vételi vezérlők. A korábbi teljes játékmenet, enterprise és kereskedési UI-tesztek az új nézetekkel sikeresek.

Böngészős összehasonlítás azonos, külön tesztmentésen: korábbi Operations 932 látható szó és 3317 pixeles tartalom; új Today 59 szó és 370 pixeles tartalom. Asztalon a kliensmagasság is 370 pixel, nincs belső görgetés. 390 pixeles mobilnézet: kliens/tartalom egyaránt 479 pixel, szélesség egyaránt 361 pixel; nincs belső vagy vízszintes túlcsordulás. Ez négy aktuális teendős fixture; több teendő és hosszabb Business/Requests lista továbbra is görgethető. Business fül korlátozott ablakban helyesen görgethető. Képi bizonyíték: operations-compact.png. Az ideiglenes QA-oldalak eltávolítva; a játékos mentése nem módosult.

Gazdasági kód nem változott; a korábbi reprodukálható szimuláció eredménye megmaradt, ebben az UI-körben nem futott újra.
