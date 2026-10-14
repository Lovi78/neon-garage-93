const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { JSDOM } = require("jsdom");
const { root, html, scripts } = require("./runtime.cjs");
function boot(make = (N) => N.newState()) {
  const dom = new JSDOM(html, {
      url: "https://premium-ui.test/",
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
  // v0.13 day closing; v0.14 flow has its own tests.
  w.NG.newGameFlow = false;
  w.NG.save(make(w.NG));
  const initial = w.localStorage.getItem(w.NG.saveKey);
  w.eval(fs.readFileSync(path.join(root, "js/ui.js"), "utf8"));
  const state = () => JSON.parse(w.localStorage.getItem(w.NG.saveKey));
  const click = (q) => {
    const el = d.querySelector(q);
    assert(el, q);
    assert(!el.disabled, q);
    assert(!el.closest("[data-dealer-panel][hidden]"), q + " hidden");
    el.closest("details")?.setAttribute("open", "");
    el.click();
  };
  return { dom, w, d, initial, state, click };
}
let count = 0;
function test(name, run) {
  run();
  count++;
  console.log("PASS " + name);
}
test("Fresh garage guides the first purchase and HUD exposes XP and next reputation rank without mutating saves", () => {
  const { dom, w, d, initial, click } = boot();
  assert.match(d.querySelector(".garage-guide").textContent, /Buy smart/);
  assert.equal(
    d.querySelector('[aria-label="Experience"]').getAttribute("aria-valuemax"),
    "80",
  );
  assert.match(
    d.querySelector(".hud-rep").textContent,
    /5 REP to Familiar Face/,
  );
  click(".garage-guide .primary");
  assert.equal(d.querySelector(".desk-window").dataset.windowView, "market");
  assert.equal(w.localStorage.getItem(w.NG.saveKey), initial);
  dom.window.close();
});
test("Dealer tabs and HUD deep links preserve state and support keyboard navigation", () => {
  const { dom, w, d, initial, click } = boot();
  click(".hud-rep");
  assert(!d.querySelector('[data-dealer-panel="reputation"]').hidden);
  assert(d.querySelector('[data-dealer-panel="skills"]').hidden);
  d.querySelector("#dealer-tab-reputation").dispatchEvent(
    new w.KeyboardEvent("keydown", { key: "Home", bubbles: true }),
  );
  assert.equal(d.activeElement.id, "dealer-tab-skills");
  assert(!d.querySelector('[data-dealer-panel="skills"]').hidden);
  click("#dealer-tab-investments");
  assert(!d.querySelector('[data-dealer-panel="investments"]').hidden);
  assert.equal(w.localStorage.getItem(w.NG.saveKey), initial);
  dom.window.close();
});
test("Locked expansions list cash, trust and dependency gaps; credit has one Finance home", () => {
  const { dom, d, click } = boot();
  click('#app .nav-business [data-tab="business"]');
  const fleet = d.querySelectorAll(".expansion-locked")[1];
  assert.match(fleet.textContent, /63,000 more cash/);
  assert.match(fleet.textContent, /25 more REP/);
  assert.match(fleet.textContent, /Open Service Center/);
  assert.match(fleet.textContent, /320 \/ day/);
  assert.equal(d.querySelector('[data-action="enterprise-borrow"]'), null);
  click('.ops-bill-strip [data-view="finances"]');
  assert(d.querySelector('[data-action="enterprise-borrow"]').disabled);
  assert.match(d.querySelector(".window-body").textContent, /Reach 10 REP/);
  dom.window.close();
});
test("Eligible expansion precedes locked projects and UI investment matches engine state exactly", () => {
  const { dom, w, d, state, click } = boot((N) => {
    const s = N.newState();
    s.cash = 30000;
    s.reputation = 10;
    return s;
  });
  click('#app .nav-business [data-tab="business"]');
  assert(
    !d.querySelector(".expansion-card").classList.contains("expansion-locked"),
  );
  const expected = state();
  w.NG.startEnterprise(expected, "service");
  w.NG.snapshotFinance(expected);
  click('[data-action="enterprise-build"][data-id="service"]');
  assert.deepEqual(state(), JSON.parse(JSON.stringify(expected)));
  dom.window.close();
});
test("Closed negotiated sale shows actual XP, level, point and REP milestone with no duplicated or invented award", () => {
  const { dom, w, d, state, click } = boot((N) => {
    const s = N.newState();
    s.cash = 20000;
    const c = s.market[0];
    N.buy(s, c.id);
    c.inspected = true;
    for (const k of Object.keys(c.parts)) c.parts[k] = 95;
    c.flaws = [];
    N.list(s, c.id, 6000, "honest");
    c.offers = [
      {
        id: "premium-offer",
        buyer: "Alex",
        price: 5500,
        stage: "agreed",
        expiresDay: 1,
        seen: false,
        negotiation: { openingPrice: 5000, closed: true },
      },
    ];
    s.progress.xp = 70;
    s.reputation = 4;
    return s;
  });
  const c = state().inventory[0],
    expected = state();
  w.NG.sell(expected, c.id, "premium-offer");
  click('.priorities [data-tab="selling"]');
  expected.inventory[0]?.offers.forEach((o) => (o.seen = true));
  // Compare the engine outcome starting from the UI's read acknowledgement.
  const control = state();
  w.NG.sell(control, c.id, "premium-offer");
  w.NG.snapshotFinance(control);
  assert(d.querySelector('#details .modal-hud [aria-label="Experience"]'));
  click('#details [data-action="sell"][data-offer="premium-offer"]');
  assert.deepEqual(state(), JSON.parse(JSON.stringify(control)));
  const t = d.querySelector("#toast");
  assert.equal(t.dataset.kind, "milestone");
  // v0.14: the deal's 25 XP plus the season goal's 30 XP, shown once as a total.
  assert.match(
    t.textContent,
    /Season goal: Sell a car for a profit \/ \+30 XP/,
  );
  assert.match(t.textContent, /\+55 XP/);
  assert.match(t.textContent, /Level 2! \+1 skill point/);
  assert.match(t.textContent, /Familiar Face/);
  assert.equal((t.textContent.match(/\+55 XP/g) || []).length, 1);
  assert.equal(state().progress.xp, 45);
  dom.window.close();
});
test("Reputation loss displays negative feedback; old saves retain progression and finances", () => {
  const { dom, d, state, click } = boot((N) => {
    const s = N.newState();
    const c = s.market[0];
    N.buy(s, c.id);
    N.sell(s, c.id, "dealer");
    s.reputation = 15;
    s.claims = [
      {
        id: "premium-claim",
        saleId: s.sales[0].id,
        status: "open",
        buyer: "Alex",
        model: c.model,
        faults: ["Leak"],
        amount: 100,
        deadline: 2,
      },
    ];
    return s;
  });
  click('#app .nav-business [data-view="customers"]');
  click('[data-action="resolve-claim"][data-decision="decline"]');
  assert.equal(state().reputation, 13);
  assert.equal(d.querySelector("#toast").dataset.kind, "warning");
  assert.match(d.querySelector("#toast").textContent, /-2 REP/);
  dom.window.close();
});
test("Skill and upgrade transactions remain identical to engine results and clear actionable alerts", () => {
  const { dom, w, d, state, click } = boot((N) => {
    const s = N.newState();
    s.progress.points = 1;
    return s;
  });
  click(".hud-xp");
  const expected = state();
  w.NG.trainNegotiation(expected);
  w.NG.snapshotFinance(expected);
  click('[data-action="train-negotiation"]');
  assert.deepEqual(state(), JSON.parse(JSON.stringify(expected)));
  assert.equal(d.querySelector(".progress-notice"), null);
  click("#dealer-tab-investments");
  const control = state();
  w.NG.buyUpgrade(control, "tools");
  w.NG.snapshotFinance(control);
  click('[data-action="upgrade"][data-upgrade="tools"]');
  assert.deepEqual(state(), JSON.parse(JSON.stringify(control)));
  assert.match(d.querySelector("#toast").textContent, /Better Tools purchased/);
  dom.window.close();
});
test("Routine car feedback stays next to the decision and modal HUD navigation cancels day closing safely", () => {
  const { dom, d, state, click } = boot((N) => N.practiceScenario("A"));
  click('#app .retro-nav [data-view="market"]');
  click(".car-card");
  click("#car-tab-negotiation");
  const cash = state().cash;
  click('[data-action="contact-seller"]');
  assert.equal(state().cash, cash);
  assert(!d.querySelector(".dialog-feedback").hidden);
  assert.equal(
    d.querySelector(".dialog-feedback").getAttribute("role"),
    "status",
  );
  assert(!d.querySelector("#toast").classList.contains("show"));
  click('#details [data-action="close"]');
  click('#app .game-hud [data-action="next"]');
  assert(d.querySelector("#day-confirm").open);
  const day = state().day;
  click("#day-confirm .hud-xp");
  assert(!d.querySelector("#day-confirm").open);
  assert.equal(state().day, day);
  assert.equal(d.querySelector(".desk-window").dataset.windowView, "upgrades");
  dom.window.close();
});
console.log(count + " premium UX integration tests passed.");
