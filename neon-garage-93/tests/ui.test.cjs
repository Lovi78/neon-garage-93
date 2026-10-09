const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const root = path.join(__dirname, "..");
let dom = new JSDOM(fs.readFileSync(path.join(root, "index.html"), "utf8"), {
  url: "https://neon-garage.test/",
  runScripts: "outside-only",
});
let w = dom.window,
  d = w.document;
w.scrollTo = () => {};
w.Math.random = () => 0.4;
w.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
w.HTMLDialogElement.prototype.close = function () {
  this.open = false;
};
for (const name of [
  "cars",
  "catalog-v06",
  "scene",
  "economy",
  "progression",
  "finance",
  "collection",
  "negotiation",
  "legacy-language",
  "state",
  "ui",
]) {
  w.eval(fs.readFileSync(path.join(root, "js/" + name + ".js"), "utf8"));
  if (name === "state") {
    const fixture = w.NG.newState();
    fixture.progress.level = 3;
    fixture.progress.xp = 150;
    fixture.progress.points = 2;
    w.NG.save(fixture);
  }
}
const click = (selector) => {
  const b = d.querySelector(selector);
  assert(b, "Hiányzó elem: " + selector);
  assert(!b.disabled, "Tiltott elem: " + selector);
  b.click();
  assert.doesNotMatch(
    d.body.textContent,
    /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/,
    "A játékfelület teljesen angol",
  );
};
assert.equal(d.documentElement.lang, "en");
const saved = () => JSON.parse(w.localStorage.getItem(w.NG.saveKey));
assert.match(d.querySelector("h1").textContent, /NEON GARAGE/);
assert.equal(d.querySelectorAll(".empty-bay").length, 2);
assert.equal(d.querySelectorAll('[role="progressbar"]').length, 2);
click(".collection-album");
assert.equal(d.querySelectorAll(".album-card").length, 60);
let searchField = d.querySelector("#album-search");
searchField.value = "Skyline";
searchField.dispatchEvent(new w.Event("input", { bubbles: true }));
assert.equal(d.querySelectorAll(".album-card").length, 1);
click('[data-action="model-guide"]');
assert.match(d.querySelector("#details").textContent, /Nissan Skyline/);
assert(!d.querySelector('#details [data-action="buy"]'));
click('#details [data-action="view"][data-view="market"]');
assert(!d.querySelector("#details").open);
click('[data-action="view"][data-view="garage"]');
click(".computer");
assert(d.querySelector(".desk-window"));
assert.equal(d.querySelectorAll(".car-card").length, 9);
assert.match(d.querySelector(".desk-window").textContent, /60 models/);
click(".car-card");
assert(d.querySelector("#details").open);
click('[data-action="inspect"]');
assert.equal(saved().cash, 4910);
assert(saved().market[0].inspected);
const originalAsk = saved().market[0].ask;
const bid = Number(d.querySelector("#purchase-bid").value);
click('[data-action="haggle-buy"]');
assert.equal(saved().cash, 4910);
assert(saved().market[0].negotiation.closed);
assert(bid < originalAsk);
click('[data-action="buy"]');
assert.equal(saved().inventory[0].purchasePrice, bid);
assert.equal(saved().inventory.length, 1);
assert(!d.querySelector("#details").open);
assert(!d.querySelector(".desk-window"));
assert(d.querySelector(".parked-car.arriving"));
assert.equal(saved().progress.level, 4);
assert.equal(saved().progress.points, 3);
click(".dealer-folder");
assert.match(
  d.querySelector(".desk-window").textContent,
  /Personal development/,
);
click('[data-action="train-negotiation"]');
click('[data-action="train-negotiation"]');
click('[data-action="unlock-perk"]');
assert(saved().progress.oneMoreShot);
assert.equal(saved().progress.points, 0);
for (const id of ["tools", "supplier", "advertising"])
  click('[data-action="upgrade"][data-upgrade="' + id + '"]');
assert(d.querySelector(".installed-tools"));
assert(d.querySelector(".parts-crate"));
assert(d.querySelector(".ad-poster"));
click('[data-action="toggle-ad"]');
assert(saved().business.adActive);
click('[data-action="view"][data-view="garage"]');
click(".parked-car");
assert.match(d.querySelector("#details").textContent, /Sell your car/);
click('[data-action="repair"][data-part="cosmetic"]');
assert.equal(saved().inventory[0].readyDay, 1);
const beforeDay = saved().cash;
assert(d.querySelector('[data-action="sell"]').disabled);
click('[data-action="close"]');
click('[data-action="next"]');
assert.equal(saved().day, 1);
assert.equal(saved().cash, beforeDay - 20);
click('[data-view="inventory"]');
click(".car-card");
click('[data-action="list"]');
assert(saved().inventory[0].listed);
click('[data-action="close"]');
click('[data-action="next"]');
click(".car-card");
assert.equal(d.querySelectorAll(".offer").length, 1);
const originalOffer = saved().inventory[0].offers[0].price;
click('[data-action="haggle-sell"]');
assert(saved().inventory[0].offers[0].price > originalOffer);
assert(d.querySelector(".negotiation-dialogue"));
click('.offer [data-action="sell"]');
assert.equal(saved().inventory.length, 0);
assert.equal(d.querySelectorAll(".parked-car").length, 0);
assert.equal(saved().sold, 1);
assert(!d.querySelector("#details").open);
click('[data-view="finances"]');
assert.equal(d.querySelectorAll("tbody tr").length, 1);
assert(d.querySelector(".history-chart .profit-line"));
assert(d.querySelector(".history-chart .value-line"));
assert.equal(d.querySelectorAll(".chart-point").length, 3);
assert(!d.querySelector(".history-chart").innerHTML.includes("NaN"));
click('[data-action="view"][data-view="garage"]');
click(".collection-album");
searchField = d.querySelector("#album-search");
searchField.value = "";
searchField.dispatchEvent(new w.Event("input", { bubbles: true }));
assert.equal(d.querySelectorAll(".album-card.collected").length, 1);
const ownedModel = saved().inventory[0]?.model || "golf";
assert.equal(saved().collection.models[ownedModel].purchased, 1);
assert.equal(saved().collection.models[ownedModel].repaired, 1);
assert.equal(saved().collection.models[ownedModel].sold, 1);
const statusField = d.querySelector("#album-status");
statusField.value = "missing";
statusField.dispatchEvent(new w.Event("change", { bubbles: true }));
searchField = d.querySelector("#album-search");
searchField.value = "";
searchField.dispatchEvent(new w.Event("input", { bubbles: true }));
assert.equal(d.querySelectorAll(".album-card").length, 59);
const snap = saved();
w.close();
dom = new JSDOM(fs.readFileSync(path.join(root, "index.html"), "utf8"), {
  url: "https://neon-garage.test/",
  runScripts: "outside-only",
});
w = dom.window;
d = w.document;
w.scrollTo = () => {};
w.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
w.HTMLDialogElement.prototype.close = function () {
  this.open = false;
};
w.localStorage.setItem("neon-garage-93-v1", JSON.stringify(snap));
for (const name of [
  "cars",
  "catalog-v06",
  "scene",
  "economy",
  "progression",
  "finance",
  "collection",
  "negotiation",
  "legacy-language",
  "state",
  "ui",
])
  w.eval(fs.readFileSync(path.join(root, "js/" + name + ".js"), "utf8"));
assert.deepEqual(saved(), snap);
assert.match(d.querySelector(".stats").textContent, /1 completed sale/);
click('[data-action="reset"]');
click('[data-action="close-reset"]');
assert.deepEqual(saved(), snap);
click('[data-action="reset"]');
click('[data-action="confirm-reset"]');
assert.deepEqual(saved().collection.models, {});
assert.equal(saved().progress.xp, 0);
assert(!saved().business.tools);
assert.equal(saved().cash, 5000);
assert.equal(saved().day, 0);
assert.equal(saved().inventory.length, 0);
console.log(
  "PASS Teljes DOM-játékmenet: piac, adatlap, vizsgálat, vétel, javítás, napváltás, hirdetés, ajánlat, eladás, pénzügyek, visszatöltés, reset megszakítása és új játék.",
);
console.log("Ez szerkezet- és interakcióteszt, nem vizuális böngészőteszt.");
w.close();
