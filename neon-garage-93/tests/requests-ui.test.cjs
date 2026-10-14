/* v0.14 request UI: tracker on every screen, car badges, checklist, icon navigation. */
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { JSDOM } = require("jsdom");
const { root, html, scripts } = require("./runtime.cjs");
function boot(make) {
  const dom = new JSDOM(html, {
      url: "https://requests-ui.test/",
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
function scenario(N) {
  const s = N.newState();
  s.cash = 20000;
  const mx = N.generateCar(
    s,
    N.catalog.findIndex((m) => m.id === "mx5"),
    () => 0.4,
  );
  mx.parts = {
    engine: 70,
    transmission: 70,
    suspension: 70,
    body: 70,
    cosmetic: 70,
  };
  mx.flaws = [];
  mx.inspected = true;
  mx.mileage = 98000;
  s.market.unshift(mx);
  N.buy(s, mx.id);
  const roadster = N.generateCar(
    s,
    N.catalog.findIndex((m) => m.id === "mgb"),
    () => 0.3,
  );
  roadster.mileage = 80000;
  s.market.unshift(roadster);
  s.opportunities.requests.push({
    id: "request-ui",
    kind: "custom",
    status: "active",
    day: 0,
    acceptedDay: 0,
    deadline: 5,
    spec: {
      tier: "easy",
      buyer: "Riley S.",
      days: 5,
      rep: 0,
      title: "Weekend fun car",
      line: "Something fun for Sundays.",
      shapes: ["sport", "roadster"],
      grade: "driver",
      mileage: 160000,
    },
  });
  s.ledger = [];
  return s;
}
test("Main navigation is icon-only with an accessible name and hover label on every entry", () => {
  const { dom, d } = boot(scenario);
  const entries = [
    ...d.querySelectorAll(
      "#app .retro-nav > .nav-button, #app .nav-business > summary",
    ),
  ];
  assert.equal(entries.length, 6);
  for (const e of entries) {
    assert(e.classList.contains("nav-icon-only"), e.outerHTML);
    assert(e.getAttribute("aria-label"));
    assert(e.querySelector(".ui-icon"));
    assert.equal(
      e.querySelector(".game-nav-label").textContent,
      e.getAttribute("aria-label"),
    );
  }
  dom.window.close();
});
test("Active request tracker shows on the garage screen and delivers in one click", () => {
  const { dom, w, d, state, click } = boot(scenario);
  const chip = d.querySelector(".request-tracker .request-chip");
  assert.match(chip.textContent, /Riley S\. \/ 5 days left/);
  assert.match(chip.textContent, /Weekend fun car/);
  const before = state(),
    q = before.opportunities.requests[0],
    pay = w.NG.requestPayout(before, q, before.inventory[0]);
  assert.match(chip.textContent, new RegExp("Deliver Mazda MX-5"));
  click('.request-tracker [data-action="request-deliver"]');
  const after = state();
  assert.equal(after.cash, before.cash + pay);
  assert.equal(after.inventory.length, 0);
  assert.equal(after.opportunities.requests[0].status, "fulfilled");
  assert(!d.querySelector(".request-tracker"));
  dom.window.close();
});
test("Market and garage cards carry the buyer badge; the car file lists what is missing", () => {
  const { dom, d, click } = boot((N) => {
    const s = scenario(N);
    for (const k of Object.keys(s.inventory[0].parts))
      s.inventory[0].parts[k] = 45; // Rough: needs work first
    return s;
  });
  click('#app [data-action="view"][data-view="market"]');
  assert(
    [...d.querySelectorAll(".car-card, .market-row")].some((c) =>
      /FOR RILEY S\./.test(c.textContent),
    ),
  );
  const chip = d.querySelector(".request-tracker .request-chip");
  assert.match(chip.textContent, /Mazda MX-5: Runner or better/);
  click('.request-tracker [data-action="detail"]');
  const checklist = d.querySelector(".car-request .request-checklist");
  assert.match(checklist.textContent, /✗ Runner or better/);
  assert.match(checklist.textContent, /Driver-ready gets it there\./);
  assert(!d.querySelector('.car-request [data-action="request-deliver"]'));
  // Workshop card tells which package satisfies the request.
  assert.match(
    d.querySelector('[data-package="driver"]').closest(".package-card")
      .textContent,
    /Meets Riley S\./,
  );
  dom.window.close();
});
test("Closing the day with a new-style request due today warns, then fails it cleanly", () => {
  const { dom, d, state, click } = boot((N) => {
    const s = scenario(N);
    s.inventory = [];
    s.opportunities.requests[0].deadline = s.day;
    return s;
  });
  click('#app .game-hud [data-action="next"]');
  const warning = d.querySelector(".confirm-offer-warning");
  assert(warning, "deadline warning missing");
  assert.match(warning.textContent, /Weekend fun car \/ closing now misses/);
  click('[data-action="confirm-next"]');
  const after = state();
  assert.equal(after.day, 1);
  assert.equal(after.opportunities.requests[0].status, "failed");
  assert(!/Cannot read/.test(d.querySelector("#toast")?.textContent || ""));
  dom.window.close();
});
console.log(count + " request UI tests passed.");
