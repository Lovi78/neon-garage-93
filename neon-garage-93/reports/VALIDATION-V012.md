# v0.12 ellenőrzési feljegyzés

Dátum: 2026. október 11. Branch: codex/v0.12-art-of-the-deal. Alap: 67c1d95.

- npm test: exit 0, 111 PASS bejegyzés, ebből 18 új teljes v0.12 integrációs teszt.
- npm run test:ui: exit 0, 14 sikeres tesztcsoport, köztük a három új gyakorlás.
- npm run test:simulation: exit 0, 25 darab 200 napos futás, naponta cash reconciliation, 25 naponta betöltött állapotból folytatás, külön azonos magú reprodukció.
- git diff --check: sikeres.
- Böngésző: valódi A vétel-eladás és B bizonyítékos alku; 490 pixel alapnézet, 1280 x 900 asztali méret. A tesztek külön practice mentést használtak.
- Régi, már nyitott tárgyalás migrációja, véletlen újraminimum/új hibasorsolás és tranzakcióduplikálás elleni ellenőrzés sikeres. Ez nem teljes biztonsági bizonyítás; kézi localStorage szerkesztés vagy kézzel visszaállított mentés nem védett.

A rádió hangját nem hallgattuk végig. Hosszabb emberi balanszpróba, üzletágas/javítós szimuláció és több környezetben végzett kompatibilitási próba továbbra is nyitott.

Utóellenőrzés: a konkurens érdeklődő miatti első körös várakozás és a visszahívás utáni azonnali újabb szünet javítva. 5%-os ajánlatra érdemi ellenajánlat, új hívásban új türelmi keret, hat régi előzmény egyszeri migrációja és dátumozott UI-beszélgetés regressziótesztje sikeres. A szimulációs riport és a dokumentáció táblázata a javított kódhoz frissítve.

v0.12.1: npm test és npm run test:ui exit 0. Két új ellenajánlati UI-regresszió sikeres. Külön böngészős fixture-ben $14,000-ra a vevő $12,698 ellenajánlatot adott; az érvénytelen összeg hibája az ajánlatkártyán látszott. Az összegek kontrollált tesztadatok, nem a játékos mentéséből származnak. Keskeny, 390 pixeles nézetben a mező teljesen látható maradt. Képi bizonyíték: counteroffer-fix.png.
