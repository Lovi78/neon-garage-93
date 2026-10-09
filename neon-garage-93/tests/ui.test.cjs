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
  "scene",
  "economy",
  "negotiation",
  "legacy-language",
  "state",
  "ui",
])
  w.eval(fs.readFileSync(path.join(root, "js/" + name + ".js"), "utf8"));
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
click(".computer");
assert(d.querySelector(".desk-window"));
assert.equal(d.querySelectorAll(".car-card").length, 9);
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
click(".parked-car");
assert.match(d.querySelector("#details").textContent, /Sell your car/);
click('[data-action="repair"][data-part="cosmetic"]');
assert.equal(saved().inventory[0].readyDay, 1);
assert(d.querySelector('[data-action="sell"]').disabled);
click('[data-action="close"]');
click('[data-action="next"]');
assert.equal(saved().day, 1);
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
  "scene",
  "economy",
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
assert.equal(saved().cash, 5000);
assert.equal(saved().day, 0);
assert.equal(saved().inventory.length, 0);
console.log(
  "PASS Teljes DOM-játékmenet: piac, adatlap, vizsgálat, vétel, javítás, napváltás, hirdetés, ajánlat, eladás, pénzügyek, visszatöltés, reset megszakítása és új játék.",
);
console.log("Ez szerkezet- és interakcióteszt, nem vizuális böngészőteszt.");
w.close();
