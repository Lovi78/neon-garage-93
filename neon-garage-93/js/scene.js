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
NG.carArt = (car, large = false) => {
  const frame = NG.spriteFrames[car.model];
  return `<span class="car-art pixel-car ${large ? "large" : ""}" role="img" aria-label="${NG.model(car).name} pixel art" style="--sprite-x:${(frame % 5) * 25}%;--sprite-y:${Math.floor(frame / 5) * 100}%;--sprite-drop:${frame >= 5 ? 16 : 0}%"></span>`;
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
