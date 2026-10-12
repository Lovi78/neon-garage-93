const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { JSDOM } = require("jsdom");
const { root, html, scripts } = require("./runtime.cjs");
function open(scenario, customize) {
  const dom = new JSDOM(html, {
      url: "https://neon-garage.test/?scenario=" + scenario,
      runScripts: "outside-only",
    }),
    w = dom.window,
    d = w.document;
  w.scrollTo = () => {};
  w.Math.random = () => 0.9;
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  for (const file of scripts) {
    if (file.endsWith("/ui.js") && customize) {
      const fixture = w.NG.practiceScenario(scenario);
      customize(fixture);
      const key = w.NG.saveKey;
      w.NG.saveKey += "-practice-" + scenario;
      w.NG.save(fixture);
      w.NG.saveKey = key;
    }
    w.eval(fs.readFileSync(path.join(root, file), "utf8"));
  }
  const state = () => JSON.parse(w.localStorage.getItem(w.NG.saveKey));
  const click = (selector) => {
    if (selector.includes('[data-action="buy"]') && !d.querySelector(selector))
      d.querySelector('#details [role="tab"][data-tab="deal"]')?.click();
    const b = d.querySelector(selector);
    assert(b, selector);
    assert(!b.disabled, selector);
    const panel = b.closest("[data-car-panel]");
    if (panel?.hidden)
      d.querySelector(
        `[role="tab"][data-tab="${panel.dataset.carPanel}"]`,
      ).click();
    b.closest("details")?.setAttribute("open", "");
    b.click();
  };
  return { dom, w, d, state, click };
}
{
  const { w, d, state, click } = open("A");
  assert.equal(state().practice, "A");
  assert.equal(w.localStorage.getItem("neon-garage-93-v1"), null);
  click(".computer");
  click(".car-card");
  click('[data-action="contact-seller"]');
  assert.match(d.querySelector("#details").textContent, /moving truck/);
  d.querySelector("#purchase-bid").value = 1800;
  d.querySelector("#purchase-tactic").value = "cash";
  click('[data-action="haggle-buy"]');
  assert.equal(state().market[0].negotiation.status, "agreed");
  click('[data-action="buy"]');
  assert.equal(state().cash, 3150);
  click(".parked-car");
  click('[data-action="inspect"]');
  click('[data-action="list"]');
  click('[data-action="close"]');
  // .9 doesn't spawn a buyer, so exercise several days then an actual UI dealer exit.
  click('[data-action="next"]');
  click('[data-action="confirm-next"]');
  click('[data-action="close-day-report"]');
  click(".parked-car");
  click('[data-action="sell"][data-offer="dealer"]');
  assert.equal(state().sold, 1);
  assert.equal(state().sales[0].holdingCost, 5);
  assert.equal(
    state().cash,
    5000 + state().ledger.reduce((n, l) => n + l.amount, 0),
  );
  assert.equal(w.localStorage.getItem("neon-garage-93-v1"), null);
  console.log(
    "PASS practice A: seller call, cash negotiation, inspection, listing, day close, sale and separate save.",
  );
}
{
  const { d, state, click } = open("B");
  click(".computer");
  click(".car-card");
  assert.doesNotMatch(
    d.querySelector("#details").textContent,
    /Leaking head gasket|Accident record found|Mileage discrepancy/,
  );
  d.querySelector("#purchase-bid").value = 2100;
  click('[data-action="haggle-buy"]');
  assert.notEqual(state().market[0].negotiation.status, "agreed");
  click('[data-action="inspect"]');
  click('[data-action="history-check"]');
  assert.match(
    d.querySelector("#details").textContent,
    /Leaking head gasket|Accident record found/,
  );
  d.querySelector("#purchase-bid").value = 2100;
  d.querySelector("#purchase-tactic").value = "fault";
  click('[data-action="haggle-buy"]');
  assert.equal(state().market[0].negotiation.status, "agreed");
  console.log(
    "PASS practice B: public information stays hidden until paid investigations change the deal.",
  );
}
{
  const { d, state, click } = open("C");
  assert.equal(state().inventory[0].listPrice, 4000);
  click(".parked-car");
  assert.match(d.querySelector("#details").textContent, /holding|Investment/);
  click('[data-action="unlist"]');
  d.querySelector("#list-price").value = 2200;
  click('[data-action="list"]');
  assert.equal(state().inventory[0].listPrice, 2200);
  assert.doesNotMatch(d.body.textContent, /NaN|undefined/);
  console.log(
    "PASS practice C: lower the stale stock asking price without losing the investment history.",
  );
}

{
  const { d: e, click } = open("A", (fixture) => {
    const c = fixture.market[0];
    c.ask = 1000;
    Object.assign(c.seller, {
      competitors: true,
      urgency: 0.1,
      reservation: 940,
      risk: 1,
    });
  });
  click(".computer");
  click(".car-card");
  e.querySelector("#purchase-bid").value = 950;
  click('[data-action="haggle-buy"]');
  assert(e.querySelector('[data-action="haggle-buy"]'));
  assert.match(
    e.querySelector(".negotiation-history").textContent,
    /You:.*\$950/,
  );
  assert.match(
    e.querySelector(".negotiation-history").textContent,
    /Seller:.*\$980/,
  );
  assert.doesNotMatch(
    e.querySelector("#details").textContent,
    /saved conversation entries/,
  );
  assert.doesNotMatch(
    e.querySelector(".negotiation-history").textContent,
    /reservation|minimum|trust/,
  );
  console.log(
    "PASS UI competitor counteroffer remains actionable and shows dated player/seller conversation.",
  );
}

{
  const { d, state, click } = open("C", (fixture) => {
    const c = fixture.inventory[0];
    fixture.day = 175;
    c.inspected = true;
    c.listPrice = 14625;
    c.offers = [
      {
        id: "counter-regression",
        buyer: "Sam P.",
        price: 12137,
        stage: "offer",
        expiresDay: 176,
        seen: true,
        profile: {
          id: "budget",
          name: "Budget shopper",
          focus: "cost",
          budget: 13000,
          trust: 0.5,
          patience: 2,
        },
      },
    ];
  });
  click(".parked-car");
  const input = d.querySelector("#counter-price-counter-regression"),
    initial = state();
  input.value = 1400;
  click('[data-action="haggle-sell"]');
  const feedback = d.querySelector(".offer-feedback");
  assert.equal(feedback.hidden, false);
  assert.match(feedback.textContent, /above \$12,137.*\$14,625/);
  assert.equal(input.getAttribute("aria-invalid"), "true");
  assert.deepEqual(state(), initial);
  input.value = 14000;
  click('[data-action="haggle-sell"]');
  assert.equal(state().inventory[0].offers[0].negotiation.rounds, 1);
  assert(state().inventory[0].offers[0].price > 12137);
  assert.equal(state().cash, initial.cash);
  assert.match(
    d.querySelector(".buyer-offer .negotiation-dialogue").textContent,
    /I can stretch/,
  );
  assert.equal(d.querySelector(".offer-feedback").hidden, true);
  console.log(
    "PASS UI screenshot regression: invalid counter is visible inside the dialog; $14,000 counter receives a saved buyer reply without changing cash.",
  );
}
{
  const { d, state, click } = open("C", (fixture) => {
    const c = fixture.inventory[0];
    c.listPrice = 14625;
    c.offers = [
      {
        id: "walk-counter",
        buyer: "Sam P.",
        price: 12137,
        stage: "offer",
        expiresDay: 10,
        profile: { budget: 12600, trust: 0.45, patience: 2, focus: "cost" },
      },
    ];
  });
  click(".parked-car");
  d.querySelector("#counter-price-walk-counter").value = 14000;
  click('[data-action="haggle-sell"]');
  assert.equal(state().inventory[0].offers.length, 0);
  assert.match(
    d.querySelector("#details").textContent,
    /Too much for my needs/,
  );
  console.log(
    "PASS UI counteroffer withdrawal displays the buyer’s reason instead of silently ignoring the button.",
  );
}
