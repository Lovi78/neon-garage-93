/* v0.14 workshop UI: packages are the main repair decision, parts are advanced. */
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { JSDOM } = require("jsdom");
const { root, html, scripts } = require("./runtime.cjs");
function boot(make) {
  const dom = new JSDOM(html, {
      url: "https://restoration-ui.test/",
      runScripts: "outside-only",
    }),
    w = dom.window,
    d = w.document;
  w.scrollTo = () => {};
  w.Math.random = () => 0.4;
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  for (const f of scripts.filter((f) => f !== "js/ui.js"))
    w.eval(fs.readFileSync(path.join(root, f), "utf8"));
  w.NG.save(make(w.NG));
  w.eval(fs.readFileSync(path.join(root, "js/ui.js"), "utf8"));
  const state = () => JSON.parse(w.localStorage.getItem(w.NG.saveKey));
  const click = (q) => {
    const el = d.querySelector(q);
    assert(el, q);
    assert(!el.disabled, q);
    el.click();
  };
  return { dom, w, d, state, click };
}
let count = 0;
function test(name, run) {
  run();
  count++;
  console.log("PASS " + name);
}
const ownedCar = (N, model, level) => {
  const s = N.newState(),
    c = N.generateCar(
      s,
      N.catalog.findIndex((m) => m.id === model),
      () => 0.4,
    );
  c.parts = {
    engine: level,
    transmission: level,
    suspension: level,
    body: level,
    cosmetic: level,
  };
  c.flaws = [];
  c.inspected = true;
  s.market.unshift(c);
  s.cash = 20000;
  N.buy(s, c.id);
  s.ledger = [];
  return s;
};
test("Workshop tab shows three packages with grade, cost, time and profit change", () => {
  const { dom, w, d, click } = boot((N) => ownedCar(N, "300zx", 58));
  click(".parked-car");
  // One-screen car file (v0.14): the workshop section is already visible.
  const cards = [...d.querySelectorAll(".package-card")];
  assert.deepEqual(
    cards.map((c) => c.querySelector("h4").textContent),
    ["Quick fix", "Driver-ready", "Full restoration"],
  );
  const full = cards[2].textContent;
  assert.match(full, /Runner.*Showroom/);
  assert.match(full, /3 days/);
  assert.match(full, /Profit change\+\$/);
  assert(!d.querySelector(".package-card.recommended"));
  assert.match(cards[0].textContent, /Lowest cost.*Fastest turnaround/);
  assert.match(cards[2].textContent, /Highest potential value/);
  assert.match(
    d.querySelector('[data-car-panel="workshop"] h3').textContent,
    /58% Runner/,
  );
  // Grades explain themselves: tooltip with range and meaning, and a value ladder.
  assert.match(
    d.querySelector('[data-car-panel="workshop"] h3 .grade-chip').title,
    /Runner \(55-74% condition\): Runs and drives/,
  );
  const rungs = [...d.querySelectorAll(".grade-ladder .rung")];
  assert.deepEqual(
    rungs.map((r) => r.querySelector("b").textContent),
    ["Project", "Runner", "Clean", "Showroom"],
  );
  assert.match(
    d.querySelector(".grade-ladder .rung.here").textContent,
    /Runner55-74%now \$/,
  );
  // Single-part repairs are still there, folded away for advanced players.
  const advanced = d.querySelector("details.single-part-repairs");
  assert(advanced && !advanced.open);
  assert.equal(advanced.querySelectorAll('[data-action="repair"]').length, 5);
  dom.window.close();
});
test("Booking a package charges the quote and puts the car in the workshop", () => {
  const { dom, w, d, state, click } = boot((N) => ownedCar(N, "300zx", 58));
  click(".parked-car");
  // One-screen car file (v0.14): the workshop section is already visible.
  const before = state(),
    quote = w.NG.packageQuote(before, before.inventory[0], "driver");
  click('[data-action="repair-package"][data-package="driver"]');
  const after = state(),
    c = after.inventory[0];
  assert.equal(after.cash, before.cash - quote.cost);
  assert.equal(c.repairPackage, "driver");
  assert.equal(c.readyDay, after.day + 1);
  assert(Object.values(c.parts).every((p) => p === 58));
  assert(c.pendingRepair);
  assert.match(
    d.querySelector(".dialog-feedback").textContent,
    /Driver-ready booked/,
  );
  assert(
    [...d.querySelectorAll('[data-action="repair-package"]')].every(
      (b) => b.disabled,
    ),
  );
  dom.window.close();
});
test("A cheap car gets an honest 'sell as it is' hint when no package pays", () => {
  const { dom, d, click } = boot((N) => ownedCar(N, "volvo", 74));
  click(".parked-car");
  // One-screen car file (v0.14): the workshop section is already visible.
  const panel = d.querySelector(".repair-packages").textContent;
  if (!d.querySelector(".package-card.recommended"))
    assert.match(panel, /Selling as it is/);
  assert.match(
    d.querySelector(".package-card:nth-child(3)").textContent,
    /Profit change-\$/,
  );
  dom.window.close();
});
console.log(count + " restoration UI tests passed.");
