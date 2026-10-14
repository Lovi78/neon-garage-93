const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { JSDOM } = require("jsdom");
const { root, html, scripts } = require("./runtime.cjs");
function boot(make) {
  const dom = new JSDOM(html, {
      url: "https://purpose-ui.test/?dev=1",
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
  return {
    dom,
    w,
    d,
    state: () => JSON.parse(w.localStorage.getItem(w.NG.saveKey)),
    click: (q) => {
      const el = d.querySelector(q);
      assert(el, q);
      assert(!el.disabled, q);
      el.closest("details")?.setAttribute("open", "");
      el.click();
    },
  };
}
let count = 0;
const test = (name, fn) => {
  fn();
  console.log("PASS " + name);
  count++;
};
function player(N) {
  const s = N.newState();
  s.cash = 6450;
  s.day = 23;
  s.sold = 3;
  s.profit = 1785;
  s.sales = [{ id: "past", day: 22, price: 2000, cost: 1500, profit: 500 }];
  s.season.goals = { flip: {}, rent: {}, request: {}, margin: {} };
  return s;
}
test("After starter goals the garage says why the next deal matters and what unlocks", () => {
  const { dom, d, click } = boot(player);
  const card = d.querySelector(".objective-guide");
  assert.match(card.textContent, /Top 5/);
  assert.match(card.textContent, /buyer audiences/);
  assert.match(card.textContent, /forecast/);
  assert.match(card.textContent, /Showroom car/);
  click('.objective-guide [data-action="view"]');
  assert(d.querySelector(".market-row"));
  assert(d.querySelector(".row-character"));
  dom.window.close();
});
test("Old cars have a model playbook but no invented saved car story", () => {
  const { dom, w, d, click, state } = boot((N) => {
    const s = player(N);
    delete s.market[0].character;
    return s;
  });
  const before = state().market[0];
  click('#app [data-view="market"]');
  click(".market-row");
  assert.match(d.querySelector(".car-character").textContent, /MODEL PLAYBOOK/);
  const after = state().market.find((c) => c.id === before.id);
  assert.deepEqual(after.parts, before.parts);
  assert.deepEqual(after.flaws, before.flaws);
  assert(!after.character);
  dom.window.close();
});
test("Top 5 opens a real audience selector and the chosen ad is charged once", () => {
  const { dom, w, d, click, state } = boot((N) => {
    const s = player(N);
    s.cash = 20000;
    s.season.unlocked.top5 = 3;
    const c = s.market.find((c) => N.characterProfile(c)) || s.market[0];
    N.buy(s, c.id);
    c.inspected = true;
    c.flaws = [];
    return s;
  });
  click(".parked-car");
  assert(d.querySelector("#listing-audience"));
  d.querySelector("#listing-audience").value = "enthusiast";
  const before = state();
  click('[data-action="list"]');
  const after = state();
  assert.equal(after.cash, before.cash - 35);
  assert.equal(after.inventory[0].audience, "enthusiast");
  assert.match(
    d.querySelector(".listing-description").textContent,
    /Focused audience/,
  );
  assert.equal(after.ledger.filter((l) => l.type === "listing-ad").length, 1);
  dom.window.close();
});
test("Supply search has an explicit no-penalty message and free cancellation in the request UI", () => {
  const { dom, d, click, state } = boot((N) => {
    const s = N.newState();
    s.cash = 0;
    s.market = [];
    s.opportunities.requests = [
      {
        id: "waiting",
        kind: "custom",
        status: "offered",
        offerUntil: 2,
        spec: {
          title: "Camaro brief",
          buyer: "QA",
          tier: "specific",
          models: ["camaro"],
          grade: "clean",
          days: 8,
        },
      },
    ];
    return s;
  });
  click('#app [data-view="operations"][data-tab="requests"]');
  click('[data-action="request-accept"]');
  assert(state().opportunities.requests[0].waitingSupply);
  assert.match(d.querySelector(".request-card").textContent, /without penalty/);
  assert.match(
    d.querySelector(".request-card").textContent,
    /Cancel supply search \/ free/,
  );
  click('[data-action="request-abandon"]');
  assert.equal(state().opportunities.requests[0].status, "unavailable");
  dom.window.close();
});
console.log(count + " purpose UI tests passed.");
