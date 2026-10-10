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
  "sprite-clips",
  "radio",
  "ambience",
  "scene",
  "economy",
  "progression",
  "strategy",
  "finance",
  "collection",
  "customers",
  "opportunities",
  "day-report",
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
  const dayBeforeClick = saved().day;
  b.click();
  if (b.dataset.action === "next") {
    assert.equal(saved().day, dayBeforeClick);
    assert(d.querySelector("#day-confirm").open);
    d.querySelector('#day-confirm [data-action="confirm-next"]').click();
    assert.equal(saved().day, dayBeforeClick + 1);
    assert(
      d.querySelector("#day-report").open,
      "Day change must open a report",
    );
    assert.match(d.querySelector("#day-report").textContent, /NEXT MORNING/);
    d.querySelector('#day-report [data-action="close-day-report"]').click();
  }
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
assert.equal(saved().cash, beforeDay - 45);
click('[data-view="inventory"]');
click(".car-card");
click('[data-action="list"]');
assert(saved().inventory[0].listed);
click('[data-action="close"]');
click('[data-action="next"]');
assert(d.querySelector(".offer-notification"));
assert.equal(saved().inventory[0].offers[0].seen, false);
click(".parked-car");
assert.equal(saved().inventory[0].offers[0].seen, true);
assert(d.querySelector(".offer-notification"));
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
  "sprite-clips",
  "radio",
  "ambience",
  "scene",
  "economy",
  "progression",
  "strategy",
  "finance",
  "collection",
  "customers",
  "opportunities",
  "day-report",
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
// A second real UI flow exercises listing disclosure and complaint settlement.
const complaintFixture = w.NG.newState(),
  faultyCar = complaintFixture.market[0];
complaintFixture.reputation = 20;
w.NG.buy(complaintFixture, faultyCar.id);
faultyCar.parts = {
  engine: 80,
  transmission: 80,
  suspension: 80,
  body: 80,
  cosmetic: 80,
};
faultyCar.inspected = true;
faultyCar.flaws = [{ ...w.NG.flaws[0], fixed: false, revealed: true }];
w.close();
dom = new JSDOM(fs.readFileSync(path.join(root, "index.html"), "utf8"), {
  url: "https://neon-garage.test/",
  runScripts: "outside-only",
});
w = dom.window;
d = w.document;
w.scrollTo = () => {};
w.Math.random = () => 0.4;
w.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
w.HTMLDialogElement.prototype.close = function () {
  this.open = false;
};
w.localStorage.setItem("neon-garage-93-v1", JSON.stringify(complaintFixture));
for (const name of [
  "cars",
  "catalog-v06",
  "sprite-clips",
  "radio",
  "ambience",
  "scene",
  "economy",
  "progression",
  "strategy",
  "finance",
  "collection",
  "customers",
  "opportunities",
  "day-report",
  "negotiation",
  "legacy-language",
  "state",
  "ui",
])
  w.eval(fs.readFileSync(path.join(root, "js/" + name + ".js"), "utf8"));
click(".parked-car");
const description = d.querySelector("#listing-mode");
description.value = "promise";
description.dispatchEvent(new w.Event("change", { bubbles: true }));
assert.match(d.querySelector("#listing-help").textContent, /complaint/);
click('[data-action="list"]');
click('[data-action="close"]');
click('[data-action="next"]');
click(".parked-car");
assert(saved().inventory[0].offers.length);
click('.offer [data-action="sell"]');
assert.equal(saved().claims[0].status, "scheduled");
click('[data-action="next"]');
click('[data-action="next"]');
assert.equal(saved().claims[0].status, "open");
assert(d.querySelector(".case-banner"));
click('.case-banner [data-action="view"]');
assert.match(d.querySelector(".claim-open").textContent, /Leaking head gasket/);
const refund = saved().claims[0].amount,
  cashBefore = saved().cash,
  profitBefore = saved().profit;
click('[data-action="resolve-claim"][data-decision="refund"]');
assert.equal(saved().cash, cashBefore - refund);
assert.equal(saved().profit, profitBefore - refund);
assert.equal(saved().claims[0].status, "settled");
assert(!d.querySelector(".case-banner"));
assert.equal(saved().customers[0].trust, 1);
console.log(
  "PASS UI listing description, customer contact, delayed complaint, notification, contribution and financial readback.",
);

// Reports require acknowledgement, survive reload unread, and never advance twice.
const dayBefore = saved().day;
d.querySelector('[data-action="next"]').click();
assert.equal(saved().day, dayBefore);
assert(d.querySelector("#day-confirm").open);
d.querySelector('#day-confirm [data-action="confirm-next"]').click();
assert.equal(saved().day, dayBefore + 1);
assert(d.querySelector("#day-report").open);
assert.equal(saved().dayReport.read, false);
d.querySelector('[data-action="next"]').click();
assert.equal(saved().day, dayBefore + 1);
const pendingReportSave = saved();
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
w.localStorage.setItem("neon-garage-93-v1", JSON.stringify(pendingReportSave));
for (const name of [
  "cars",
  "catalog-v06",
  "sprite-clips",
  "radio",
  "ambience",
  "scene",
  "economy",
  "progression",
  "strategy",
  "finance",
  "collection",
  "customers",
  "opportunities",
  "day-report",
  "negotiation",
  "legacy-language",
  "state",
  "ui",
])
  w.eval(fs.readFileSync(path.join(root, "js/" + name + ".js"), "utf8"));
assert(d.querySelector("#day-report").open);
assert.match(d.querySelector("#day-report").textContent, /DAY’S CASH FLOW/);
click('#day-report [data-action="close-day-report"]');
assert(saved().dayReport.read);
assert.equal(saved().day, dayBefore + 1);
const cashAfterRead = saved().cash;
click('[data-action="show-day-report"]');
assert(d.querySelector("#day-report").open);
click('#day-report [data-action="report-go"][data-view="inventory"]');
assert(!d.querySelector("#day-report").open);
assert(d.querySelector(".desk-window"));
assert.equal(saved().cash, cashAfterRead);
assert.equal(saved().day, dayBefore + 1);
console.log(
  "PASS UI daily modal, advance guard, unread reload, acknowledgement, reopen and view offers.",
);

// Two pending offers: cancellation is lossless, review is per car, and alerts persist.
const notificationFixture = w.NG.newState();
w.NG.buy(notificationFixture, notificationFixture.market[0].id);
w.NG.buy(notificationFixture, notificationFixture.market[0].id);
for (const [index, car] of notificationFixture.inventory.entries()) {
  w.NG.list(notificationFixture, car.id, 3000, "as-is");
  car.offers = [
    {
      id: "pending-" + index,
      buyer: "Buyer " + index,
      price: 2000 + index * 100,
      seen: false,
    },
  ];
}
w.close();
function bootNotificationFixture(fixture) {
  dom = new JSDOM(fs.readFileSync(path.join(root, "index.html"), "utf8"), {
    url: "https://neon-garage.test/",
    runScripts: "outside-only",
  });
  w = dom.window;
  d = w.document;
  w.scrollTo = () => {};
  w.Math.random = () => 0.8;
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  w.localStorage.setItem("neon-garage-93-v1", JSON.stringify(fixture));
  for (const script of d.querySelectorAll("script[src]"))
    w.eval(
      fs.readFileSync(path.join(root, script.getAttribute("src")), "utf8"),
    );
}
bootNotificationFixture(notificationFixture);
assert.match(
  d.querySelector(".offer-notification").textContent,
  /2 LIVE OFFERS/,
);
const beforeConfirmation = JSON.stringify(saved());
d.querySelector('[data-action="next"]').click();
assert(d.querySelector("#day-confirm").open);
assert.equal(JSON.stringify(saved()), beforeConfirmation);
assert.match(
  d.querySelector("#day-confirm").textContent,
  /2 pending offers will expire/,
);
assert(d.activeElement.dataset.action === "cancel-next");
click('#day-confirm [data-action="cancel-next"]');
assert.equal(JSON.stringify(saved()), beforeConfirmation);
d.querySelector('[data-action="next"]').click();
click('#day-confirm [data-action="confirm-view-offers"]');
assert(!d.querySelector("#day-confirm").open);
assert.equal(saved().day, 0);
assert.equal(saved().inventory.filter((c) => c.offers[0].seen).length, 0);
click(".desk-window .car-card");
assert.equal(saved().inventory.filter((c) => c.offers[0].seen).length, 1);
assert.match(
  d.querySelector(".offer-notification").textContent,
  /1 NEEDS REVIEW/,
);
click('[data-action="close"]');
d.querySelector('[data-action="next"]').click();
d.querySelector("#day-confirm").dispatchEvent(
  new w.Event("cancel", { cancelable: true }),
);
assert(!d.querySelector("#day-confirm").open);
assert.equal(saved().day, 0);
d.querySelector('#day-confirm [data-action="confirm-next"]').click();
assert.equal(saved().day, 0);
const reviewSave = saved();
w.close();
bootNotificationFixture(reviewSave);
assert.match(
  d.querySelector(".offer-notification").textContent,
  /1 NEEDS REVIEW/,
);
click('[data-action="view-offers"]');
click(".desk-window .car-card");
click('.offer [data-action="reject"]');
click('[data-action="close"]');
assert.match(
  d.querySelector(".offer-notification").textContent,
  /1 LIVE OFFER/,
);
click('[data-action="view-offers"]');
assert(d.querySelector("#details").open);
assert.equal(saved().inventory[1].offers[0].seen, true);
assert.match(
  d.querySelector(".offer-notification").textContent,
  /PENDING DECISION/,
);
click('.offer [data-action="reject"]');
assert(!d.querySelector(".offer-notification"));
click('[data-action="close"]');
d.querySelector('[data-action="next"]').click();
assert.equal(saved().day, 0);
const confirmButton = d.querySelector(
  '#day-confirm [data-action="confirm-next"]',
);
confirmButton.click();
assert.equal(saved().day, 1);
assert(d.querySelector("#day-report").open);
confirmButton.click();
assert.equal(saved().day, 1);
click('#day-report [data-action="close-day-report"]');
console.log(
  "PASS UI explicit day confirmation, lossless cancel/Escape, pending-offer warning, stale/double confirm guard, persistent notifications and per-car review.",
);

// Advanced dealer: skill choices, overdue bills, workshop bottleneck and forecasts.
const strategyFixture = w.NG.newState();
strategyFixture.cash = 12000;
strategyFixture.progress.level = 9;
strategyFixture.progress.points = 8;
w.NG.buy(strategyFixture, strategyFixture.market[0].id);
w.NG.buy(strategyFixture, strategyFixture.market[0].id);
const [normalJob, rushJob] = strategyFixture.inventory;
w.NG.inspect(strategyFixture, normalJob.id);
w.NG.inspect(strategyFixture, rushJob.id);
w.NG.repair(strategyFixture, normalJob.id, "engine");
strategyFixture.operations.arrears = 40;
w.close();
bootNotificationFixture(strategyFixture);
click(".operations-board");
assert.match(d.querySelector(".desk-window").textContent, /Workshop schedule/);
const cashBeforeBills = saved().cash;
click('[data-action="pay-bills"]');
assert.equal(saved().cash, cashBeforeBills - 40);
assert.equal(saved().operations.arrears, 0);
click('[data-action="view"][data-view="upgrades"]');
for (const skill of ["mechanical", "market"]) {
  click('[data-action="train-skill"][data-skill="' + skill + '"]');
  click('[data-action="train-skill"][data-skill="' + skill + '"]');
}
click('[data-action="specialist-perk"][data-perk="sharpEye"]');
click('[data-action="specialist-perk"][data-perk="trendSpotter"]');
assert.equal(saved().progress.points, 2);
click('[data-action="upgrade"][data-upgrade="diagnostics"]');
click('[data-action="view"][data-view="garage"]');
click('.parked-car[data-id="' + rushJob.id + '"]');
assert(
  d.querySelector('[data-action="repair"][data-part="cosmetic"]').disabled,
);
const mode = d.querySelector("#repair-mode");
mode.value = "rush";
mode.dispatchEvent(new w.Event("change", { bubbles: true }));
const expectedRush = w.NG.repairQuote(
    saved().inventory[1],
    "cosmetic",
    saved(),
    "rush",
  ),
  cashBeforeRush = saved().cash;
click('[data-action="repair"][data-part="cosmetic"]');
assert.equal(saved().cash, cashBeforeRush - expectedRush);
assert.equal(saved().inventory[1].readyDay, 1);
assert.equal(saved().inventory[0].readyDay, 2);
click('[data-action="close"]');
click('[data-action="next"]');
assert.equal(saved().day, 1);
assert.equal(saved().dayReport.completedRepairs.length, 1);
click(".computer");
assert(d.querySelector(".trend-board"));
assert(d.querySelector(".forecast"));
click(".car-card");
assert.match(d.querySelector("#details").textContent, /SHARP EYE/);
assert(!saved().market[0].inspected);
const fee = w.NG.inspectionPrice(saved()),
  cashBeforeInspection = saved().cash;
click('[data-action="inspect"]');
assert.equal(saved().cash, cashBeforeInspection - fee);
console.log(
  "PASS UI operating bills, two new skills/perks, diagnostics, workshop contention, paid rush work, completed-job report, forecast and discounted inspection.",
);

// Radio controls never change the saved game.
const beforeRadio = w.localStorage.getItem("neon-garage-93-v1");
click(".garage-radio");
assert(d.querySelector("#radio-dialog").open);
assert.equal(d.querySelectorAll(".radio-station").length, 3);
const volume = d.querySelector("#radio-volume");
volume.value = "43";
volume.dispatchEvent(new w.Event("input", { bubbles: true }));
assert.equal(w.NG.radio.volume, 0.43);
assert.equal(d.querySelector("#radio-volume-value").textContent, "43%");
click('[data-action="radio-close"]');
assert.equal(w.localStorage.getItem("neon-garage-93-v1"), beforeRadio);
// Exercise the real transition flow with motion enabled and controlled timers.
w.matchMedia = () => ({ matches: false });
const nativeTimeout = w.setTimeout,
  nativeClear = w.clearTimeout;
const transitionTimers = new Map();
let timerId = 0;
w.setTimeout = (fn, delay) => {
  transitionTimers.set(++timerId, { fn, delay });
  return timerId;
};
w.clearTimeout = (id) => transitionTimers.delete(id);
click('[data-action="view"][data-view="garage"]');
const dayBeforeAnimation = saved().day;
d.querySelector('[data-action="next"]').click();
assert(d.querySelector("#day-confirm").open);
click('[data-action="confirm-next"]');
assert.equal(saved().day, dayBeforeAnimation + 1);
assert(d.querySelector("#garage-transition").open);
assert(!d.querySelector("#day-report").open);
const snapshotAfterClose = w.localStorage.getItem("neon-garage-93-v1");
const dawn = [...transitionTimers.values()].find((t) => t.delay === 900);
dawn.fn();
assert.equal(
  d.querySelector("#transition-label").textContent,
  "OPEN FOR A NEW DAY",
);
click("#skip-transition");
assert(!d.querySelector("#garage-transition").open);
assert(d.querySelector("#day-report").open);
assert.equal(w.localStorage.getItem("neon-garage-93-v1"), snapshotAfterClose);
assert.equal(transitionTimers.size, 0);
click('[data-action="close-day-report"]');
let completed = 0;
const scene = d.querySelector(".garage-world").outerHTML;
w.NG.playGarageTransition(scene, scene, "June 3, 1993", () => completed++);
d.querySelector("#garage-transition").dispatchEvent(
  new w.Event("cancel", { cancelable: true }),
);
assert.equal(completed, 1);
assert.equal(transitionTimers.size, 0);
w.NG.playGarageTransition(scene, scene, "June 3, 1993", () => completed++);
[...transitionTimers.values()].find((t) => t.delay === 1900).fn();
assert.equal(completed, 2);
assert(!d.querySelector("#garage-transition").open);
w.matchMedia = () => ({ matches: true });
w.NG.playGarageTransition(scene, scene, "June 3, 1993", () => completed++);
assert.equal(completed, 3);
assert.equal(transitionTimers.size, 0);
w.setTimeout = nativeTimeout;
w.clearTimeout = nativeClear;
console.log(
  "PASS UI radio settings, unchanged save, closing/dawn/report sequence, skip, Escape, automatic completion and reduced motion.",
);

// Local choices and buyer requests use the real Operations UI and save path.
click('[data-action="close"]');
let opportunityState = saved();
opportunityState.opportunities.events = [
  {
    id: "ui-meet",
    kind: "meet",
    status: "pending",
    day: opportunityState.day,
    deadline: opportunityState.day + 1,
  },
];
opportunityState.opportunities.requests = [
  {
    id: "ui-request",
    kind: "japan",
    status: "offered",
    day: opportunityState.day,
    offerUntil: opportunityState.day + 2,
  },
];
opportunityState.opportunities.requests.push({
  id: "ui-due",
  kind: "europe",
  status: "active",
  day: opportunityState.day - 5,
  acceptedDay: opportunityState.day - 5,
  deadline: opportunityState.day,
});
opportunityState.operations.arrears = 0;
opportunityState.cash = 10000;
const deliveryCar = opportunityState.inventory[0];
deliveryCar.model = "crx";
deliveryCar.inspected = true;
deliveryCar.flaws = [];
deliveryCar.mileage = 100000;
deliveryCar.readyDay = 0;
deliveryCar.listed = false;
for (const key of Object.keys(deliveryCar.parts)) deliveryCar.parts[key] = 90;
w.NG.save(opportunityState);
// Re-evaluate the UI module as a page reload, removing earlier DOM click handlers.
// Use a new window below to keep precisely one listener per action.
const localDom = new JSDOM(
  fs.readFileSync(path.join(root, "index.html"), "utf8"),
  { url: "https://neon-garage.test/", runScripts: "outside-only" },
);
const lw = localDom.window,
  ld = lw.document;
lw.scrollTo = () => {};
lw.Math.random = () => 0.4;
lw.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
lw.HTMLDialogElement.prototype.close = function () {
  this.open = false;
};
lw.localStorage.setItem(w.NG.saveKey, JSON.stringify(opportunityState));
for (const name of [
  "cars",
  "catalog-v06",
  "sprite-clips",
  "radio",
  "ambience",
  "scene",
  "economy",
  "progression",
  "strategy",
  "finance",
  "collection",
  "customers",
  "opportunities",
  "day-report",
  "negotiation",
  "legacy-language",
  "state",
  "ui",
])
  lw.eval(fs.readFileSync(path.join(root, "js", name + ".js"), "utf8"));
const lc = (selector) => {
  const el = ld.querySelector(selector);
  assert(el, selector);
  assert(!el.disabled, selector);
  el.click();
};
const ls = () => JSON.parse(lw.localStorage.getItem(lw.NG.saveKey));
if (ld.querySelector("#day-report").open)
  lc('[data-action="close-day-report"]');
assert(ld.querySelector(".local-notification"));
lc('.local-notification [data-view="operations"]');
assert.match(ld.querySelector(".local-board").textContent, /No deposits/);
const stateBeforeWarning = lw.localStorage.getItem(lw.NG.saveKey);
lc('[data-action="next"]');
assert.match(
  ld.querySelector("#day-confirm").textContent,
  /Buyer request deadline today/,
);
lc('[data-action="confirm-view-requests"]');
assert(!ld.querySelector("#day-confirm").open);
assert(ld.querySelector(".local-board"));
assert.equal(lw.localStorage.getItem(lw.NG.saveKey), stateBeforeWarning);
const eventCash = ls().cash;
lc('[data-action="local-accept"]');
assert.equal(ls().cash, eventCash - 80);
assert.equal(ls().opportunities.events[0].status, "accepted");
lc('[data-action="request-accept"]');
assert.equal(ls().opportunities.requests[0].deadline, ls().day + 4);
assert(ld.querySelector('[data-action="request-deliver"]'));
const requestCash = ls().cash,
  requestRep = ls().reputation,
  requestProfit = ls().profit;
lc('[data-action="request-deliver"]');
assert.equal(ls().cash, requestCash + 7800);
assert.equal(ls().reputation, requestRep + 3);
assert.equal(ls().profit, requestProfit + 7800 - lw.NG.cost(deliveryCar));
assert.equal(ls().opportunities.requests[0].status, "fulfilled");
assert(!ls().inventory.some((c) => c.id === deliveryCar.id));
assert(!ld.querySelector('[data-action="request-deliver"][data-id="ui-request"]'));
lc('[data-action="view"][data-view="finances"]');
assert.match(ld.querySelector(".ledger").textContent, /Car meet|car meet/);
localDom.window.close();
console.log(
  "PASS UI opportunity notification, terms, fee, request acceptance, delivery, bonus, reputation, single sale and ledger.",
);

w.close();
