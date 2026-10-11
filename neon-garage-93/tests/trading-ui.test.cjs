const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { JSDOM } = require("jsdom");
const { root, html, scripts } = require("./runtime.cjs");
function open(scenario) {
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
  for (const file of scripts)
    w.eval(fs.readFileSync(path.join(root, file), "utf8"));
  const state = () => JSON.parse(w.localStorage.getItem(w.NG.saveKey));
  const click = (selector) => {
    const b = d.querySelector(selector);
    assert(b, selector);
    assert(!b.disabled, selector);
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
