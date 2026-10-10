# Sprite-kivágási javítás - v0.7.1

Dátum: 2026. október 10. A javítás a jelenlegi v0.11-ben is érvényes; a megnevezés az elkészülési verziót jelöli.

A generált atlaszok nem pontos 5x2-es rácsra igazodtak. A korábbi százalékos CSS-kivágás ezért a szomszéd autót is megmutathatta, vagy levághatta a kiválasztott jármű szélét. A renderelő most minden modellhez külön SVG-körvonalmaszkot használ, egységes 400x400 nézettel és talajvonallal. A PNG-ket a futó játék nem módosítja.

- `js/sprite-clips.js`: mind a 60 modell forrásképe, tényleges körvonala és befoglalója.
- `scripts/build-sprite-clips.py`: az atlaszokat beolvasó, klipadatot és ellenőrzési jegyzéket készítő fejlesztői segéd. Node.js és Pillow kell hozzá; a játék indításához nem.
- `assets/SPRITE-CLIP-AUDIT.json`: modellhez tartozó befoglalók és az eltérő azonosított járműtest-pixelek számának ellenőrzése.
- `car-delta-isolated.png` és `car-saab-isolated.png`: két külön sprite; az eredeti atlaszban a körvonaluk összeért. Az eredeti európai atlasz másik nyolc modellje megmaradt.

Az Eclipse, Delta és Saab aktuális `NG.carArt` SVG-kimenetét külön képrenderelővel is megtekintettük: nincs szomszéd autó a képben. Ez tényleges sprite-renderelési ellenőrzés, de nem teljes böngészős garázs-layout ellenőrzés.

A két külön sprite a beépített ImageGen eszközzel készült, az eredeti európai atlaszt használva szerkesztési referenciának. A végső játékmegjelenésben a körvonalmaszk a halvány háttérfényeket is levágja.

## Delta kiválasztási prompt

Background-extraction / precise-object-edit. Extract ONLY the red Lancia Delta HF Integrale, the second car from the left in the BOTTOM ROW of the reference sprite sheet. Output one complete isolated red Lancia Delta on genuinely transparent background with generous padding. Preserve its front-left view, pixel art styling, proportions, red paint, four round headlights, widened fenders, wheels and identity. Exclude absolutely every pixel of the neighboring gray Saab and all other nine cars. Reconstruct the right outline cleanly where it touched the Saab. The whole car must fit in the frame, nose facing left. No text, no floor, no shadows outside the car, no sprite grid. Only the ONE Delta.

## Saab kiválasztási prompt

Background-extraction / precise-object-edit. Extract ONLY the gray Saab 900 Turbo, the middle (third from the left) car in the BOTTOM ROW of the reference sprite sheet. Output one complete isolated gray Saab 900 on genuinely transparent background with generous padding. Preserve its front-left view, original long hood, curved windshield, three-door hatchback shape, gray paint, wheel design, pixel art styling and identity. Exclude absolutely every pixel of the neighboring red Delta and all other nine cars. Reconstruct its full front bumper cleanly where it touched the Delta. The whole car must fit in the frame, nose facing left. No text, no floor, no shadows outside the car, no sprite grid. Only the ONE Saab.
