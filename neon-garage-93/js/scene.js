/* Scene objects are real buttons: keyboard access works alongside point-and-click. */
window.NG = window.NG || {};
NG.spriteFrames = {
  crx: 0,
  mr2: 1,
  mx5: 2,
  e30: 3,
  golf: 4,
  "300zx": 5,
  legacy: 6,
  mustang: 7,
  camaro: 8,
  volvo: 9,
};
NG.spriteSheets = {};
for (const id of Object.keys(NG.spriteFrames))
  NG.spriteSheets[id] = "cars-pixel.png";
NG.spriteFrames["rx7"] = 0;
NG.spriteSheets["rx7"] = "cars-japan-pixel.png";
NG.spriteFrames["supra"] = 1;
NG.spriteSheets["supra"] = "cars-japan-pixel.png";
NG.spriteFrames["240sx"] = 2;
NG.spriteSheets["240sx"] = "cars-japan-pixel.png";
NG.spriteFrames["ae86"] = 3;
NG.spriteSheets["ae86"] = "cars-japan-pixel.png";
NG.spriteFrames["civic"] = 4;
NG.spriteSheets["civic"] = "cars-japan-pixel.png";
NG.spriteFrames["integra"] = 5;
NG.spriteSheets["integra"] = "cars-japan-pixel.png";
NG.spriteFrames["celica"] = 6;
NG.spriteSheets["celica"] = "cars-japan-pixel.png";
NG.spriteFrames["3000gt"] = 7;
NG.spriteSheets["3000gt"] = "cars-japan-pixel.png";
NG.spriteFrames["280zx"] = 8;
NG.spriteSheets["280zx"] = "cars-japan-pixel.png";
NG.spriteFrames["323gtx"] = 9;
NG.spriteSheets["323gtx"] = "cars-japan-pixel.png";
NG.spriteFrames["944"] = 0;
NG.spriteSheets["944"] = "cars-west-pixel.png";
NG.spriteFrames["911"] = 1;
NG.spriteSheets["911"] = "cars-west-pixel.png";
NG.spriteFrames["190e"] = 2;
NG.spriteSheets["190e"] = "cars-west-pixel.png";
NG.spriteFrames["quattro"] = 3;
NG.spriteSheets["quattro"] = "cars-west-pixel.png";
NG.spriteFrames["205gti"] = 4;
NG.spriteSheets["205gti"] = "cars-west-pixel.png";
NG.spriteFrames["corvette"] = 5;
NG.spriteSheets["corvette"] = "cars-west-pixel.png";
NG.spriteFrames["firebird"] = 6;
NG.spriteSheets["firebird"] = "cars-west-pixel.png";
NG.spriteFrames["grandnational"] = 7;
NG.spriteSheets["grandnational"] = "cars-west-pixel.png";
NG.spriteFrames["stealth"] = 8;
NG.spriteSheets["stealth"] = "cars-west-pixel.png";
NG.spriteFrames["cherokee"] = 9;
NG.spriteSheets["cherokee"] = "cars-west-pixel.png";
NG.spriteDrop = {
  rx7: 4.5,
  supra: 4.8,
  "240sx": 4.5,
  ae86: 4,
  civic: 4,
  integra: 14,
  celica: 14.4,
  "3000gt": 14.4,
  "280zx": 13.8,
  "323gtx": 13.8,
  944: -2,
  911: -1.5,
  "190e": -1.8,
  quattro: -1.8,
  "205gti": -1.2,
  corvette: 12,
  firebird: 12.8,
  grandnational: 11.5,
  stealth: 11,
  cherokee: 10.1,
};
NG.carArt = (car, large = false) => {
  const frame = NG.spriteFrames[car.model];
  return `<span class="car-art pixel-car ${large ? "large" : ""}" role="img" aria-label="${NG.model(car).name} pixel art" style="--sprite-sheet:url('assets/${NG.spriteSheets[car.model]}');--sprite-x:${(frame % 5) * 25}%;--sprite-y:${Math.floor(frame / 5) * 100}%;--sprite-drop:${NG.spriteDrop[car.model] ?? (frame >= 5 ? 16 : 0)}%"></span>`;
};
NG.garageScene = (state, arrival = null) => {
  const offers = state.inventory.reduce((n, c) => n + c.offers.length, 0);
  return `<div class="garage-world" aria-label="Interactive garage">
    <img class="garage-backdrop" src="assets/garage-pixel.png" alt="Your pixel art garage at dusk in Silver Palms" draggable="false">
    <div class="ambient-light" aria-hidden="true"></div>
    <button class="scene-object computer" data-action="view" data-view="market" aria-label="Computer: open car market"><span class="object-marker">▸</span><span class="object-label">COMPUTER <small>CAR MARKET</small></span></button>
    <button class="scene-object ledger-object" data-action="view" data-view="finances" aria-label="Ledger: open finances"><span class="object-marker">▸</span><span class="object-label">LEDGER <small>FINANCES</small></span></button>
    <button class="scene-object dealer-folder" data-action="view" data-view="upgrades" aria-label="Office folder: open skills and business upgrades"><span class="folder-art" aria-hidden="true"></span><span class="object-label">DEALER FILE <small>SKILLS &amp; UPGRADES</small></span></button>
    ${state.business?.tools ? '<span class="installed-tools" aria-label="Better tools installed"><i></i><i></i><i></i></span>' : ""}
    ${state.business?.supplier ? '<span class="parts-crate" aria-label="Parts supplier deal installed">PARTS</span>' : ""}
    ${state.business?.advertising ? '<span class="ad-poster" aria-label="Local newspaper advertising installed">USED<br>CARS<small>GOOD DEALS</small></span>' : ""}
    <button class="scene-object workbench" data-action="view" data-view="inventory" aria-label="Workbench: open inventory"><span class="object-marker">▸</span><span class="object-label">WORKBENCH <small>MY INVENTORY${offers ? " / " + offers + " OFFER" + (offers === 1 ? "" : "S") : ""}</small></span></button>
    <button class="scene-object wall-clock" data-action="next" aria-label="Clock: advance to next day"><span class="object-marker">▸</span><span class="object-label">CLOSE UP <small>NEXT DAY</small></span></button>
    ${Array.from({ length: state.capacity }, (_, i) => {
      const car = state.inventory[i];
      return car
        ? `<button class="parked-car bay-${i} ${arrival === car.id ? "arriving" : ""} ${NG.busy(state, car) ? "under-repair" : ""}" data-action="detail" data-id="${car.id}" aria-label="${NG.model(car).name}: inspect, repair or sell">${NG.carArt(car, true)}<span class="parking-label">${NG.model(car).name}<small>${NG.busy(state, car) ? "IN THE WORKSHOP" : car.offers.length ? "NEW OFFER" : car.listed ? "FOR SALE" : "CLICK TO INSPECT"}</small></span>${NG.busy(state, car) ? '<span class="repair-spark" aria-hidden="true">✦</span>' : ""}</button>`
        : `<div class="empty-bay bay-${i}" aria-label="Empty garage space ${i + 1}"><span>BAY 0${i + 1}<small>WAITING FOR YOUR NEXT FIND</small></span></div>`;
    }).join("")}
    <span class="scene-coordinate">SILVER PALMS, CA · 1993</span>
    <div class="scene-help">CLICK AN OBJECT TO GET STARTED <span>COMPUTER · WORKBENCH · LEDGER</span></div>
  </div>`;
};
