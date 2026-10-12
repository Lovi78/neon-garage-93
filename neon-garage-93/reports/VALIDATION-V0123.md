# v0.12.3 - végső ellenőrzés

Dátum: 2026. október 12. Branch: codex/v0.12-art-of-the-deal. Alap: 220a9f2 / v0.12.2.

- npm test: exit 0, 111 PASS, ebből 18 kereskedési integrációs teszt.
- npm run test:ui: exit 0, 18 tesztcsoport. Három új UX-csoport: teljes vétel-eladás és draftmegőrzés; helyes prioritáscélpontok és érintetlen pénz/mentés; régi mentés és eredeti tárgyalási limit, billentyűzetes tabkezelés.
- npm run test:simulation: exit 0, 25 reprodukálható, 200 napos futás. A riport változatlan gazdasági eredményt adott.
- git diff --check és a JavaScript szintaktikai ellenőrzése sikeres.
- Gazdasági / NPC / state / finance / enterprise forrás: nincs változás a v0.12.2-höz képest.

Valódi böngészős próba külön QA-mentésen: eladói telefon, fülváltáskor megőrzött $1,700 ajánlat és Cash taktika, megállapodás, rögzített $1,750 teljes vételi gomb; vásárlás, $90 vizsgálat, megőrzött $2,250 hirdetési ár, két napváltás, prioritásból megnyitott vevői kérdés, válasz, ellenajánlat és rögzített eladási elfogadás. Eladás $1,891; közvetlen költség $1,850; ügyletfedezet +$41; két napi $20 közös rezsi után készpénz $5,001. Egy lezárt eladás, üres garázs, 3 REP.

Desktop nézet és 390 x 844 mobilnézet ellenőrizve. Mobiladatlap: kliens- és tartalomszélesség egyaránt 352 pixel, magasság 754 pixel a 844 pixeles viewportban; négy fül, egy látható panel. Hosszú panel korlátozottan görgethető, az alsó döntési sáv rögzített. Képek: v0123-overview.png, v0123-selling.png.

A böngészős QA külön tárolási kulcsot használt; a játékos eredeti mentése nem módosult. A források nem tárolják a draftokat a játékállásban: az el nem küldött mezőket csak munkameneten belül őrizzük. Több böngésző és hosszabb új-játékosi használati próba további finomítást adhat. A rádió hangját ebben a körben nem teszteltük újra.
