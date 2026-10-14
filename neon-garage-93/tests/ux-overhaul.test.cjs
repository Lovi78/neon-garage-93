const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { JSDOM } = require("jsdom");
const { root, html, scripts } = require("./runtime.cjs");
function boot(make) {
  const dom = new JSDOM(html, {
      url: "https://neon-garage.test/",
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
  for (const file of scripts.filter((f) => !f.endsWith("/ui.js")))
    w.eval(fs.readFileSync(path.join(root, file), "utf8"));
  // v0.13 day closing; v0.14 flow has its own tests.
  w.NG.newGameFlow = false;
  w.NG.save(make(w.NG));
  w.eval(fs.readFileSync(path.join(root, "js/ui.js"), "utf8"));
  const state = () => JSON.parse(w.localStorage.getItem(w.NG.saveKey));
  const click = (selector) => {
    const el = d.querySelector(selector);
    assert(el, selector);
    assert(!el.disabled, selector);
    assert(
      !el.closest("[data-car-panel][hidden]"),
      "Attempt to use a hidden car panel: " + selector,
    );
    el.closest("details")?.setAttribute("open", "");
    el.click();
  };
  const tab = (key) => click('#details [role="tab"][data-tab="' + key + '"]');
  return { dom, w, d, state, click, tab };
}
{
  const { w, d, state, click, tab } = boot((N) => N.practiceScenario("A"));
  const start = JSON.stringify(state());
  for (const view of [
    "market",
    "inventory",
    "deals",
    "operations",
    "finances",
    "customers",
    "upgrades",
    "collection",
  ]) {
    click('#app .retro-nav [data-view="' + view + '"]');
    assert(d.querySelector(".desk-window"));
    assert(!d.querySelector("#details").open);
  }
  assert.equal(JSON.stringify(state()), start);
  click('#app .retro-nav [data-view="market"]');
  click(".car-card");
  assert.equal(
    d.querySelector('#details [role="tab"][aria-selected="true"]').dataset.tab,
    "overview",
  );
  assert.equal(d.querySelectorAll("[data-car-panel]:not([hidden])").length, 1);
  tab("negotiation");
  d.querySelector("#purchase-bid").value = 1700;
  d.querySelector("#purchase-tactic").value = "cash";
  tab("inspection");
  tab("deal");
  tab("negotiation");
  assert.equal(d.querySelector("#purchase-bid").value, "1700");
  assert.equal(d.querySelector("#purchase-tactic").value, "cash");
  click('#details .dialog-nav [data-view="operations"]');
  assert(!d.querySelector("#details").open);
  click('[data-action="view-back"]');
  assert.equal(d.querySelector(".desk-window").dataset.windowView, "market");
  click(".car-card");
  assert.equal(d.querySelector("#purchase-bid").value, "1700");
  assert.equal(d.querySelector("#purchase-tactic").value, "cash");
  assert.equal(
    d.querySelector('[role="tab"][aria-selected="true"]').dataset.tab,
    "negotiation",
  );
  tab("inspection");
  click('[data-action="inspect"]');
  tab("negotiation");
  assert.equal(d.querySelector("#purchase-bid").value, "1700");
  click('[data-action="haggle-buy"]');
  assert.equal(state().market[0].negotiation.status, "agreed");
  assert.match(d.querySelector(".player-line").textContent, /1,700/);
  tab("deal");
  const before = state().cash;
  click('[data-action="buy"]');
  assert.equal(state().cash, before - 1750);
  assert(!d.querySelector("#details").open);
  click(".parked-car");
  tab("selling");
  assert.equal(
    d.querySelector("#listing-mode").value,
    "honest",
    "Untouched defaults must update after inspection.",
  );
  d.querySelector("#list-price").value = 2250;
  tab("finances");
  tab("workshop");
  tab("selling");
  assert.equal(d.querySelector("#list-price").value, "2250");
  click('[data-action="list"]');
  click('[data-action="close"]');
  click('[data-action="next"]');
  click('[data-action="confirm-next"]');
  click('[data-action="close-day-report"]');
  assert(state().inventory[0].offers.length);
  click('.priorities [data-tab="selling"]');
  assert.equal(
    d.querySelector('#details [role="tab"][aria-selected="true"]').dataset.tab,
    "selling",
  );
  if (d.querySelector('[data-action="answer-buyer"]'))
    click('[data-action="answer-buyer"]');
  const offer = state().inventory[0].offers[0],
    input = d.querySelector("#counter-price-" + offer.id);
  input.value = Math.min(state().inventory[0].listPrice, offer.price + 25);
  const draft = input.value;
  tab("finances");
  tab("selling");
  assert.equal(d.querySelector("#counter-price-" + offer.id).value, draft);
  click('[data-action="haggle-sell"]');
  const price = state().inventory[0].offers[0].price,
    cash = state().cash;
  click('.buyer-offer [data-action="sell"]');
  assert.equal(state().cash, cash + price);
  assert.equal(state().sold, 1);
  assert.equal(state().inventory.length, 0);
  console.log(
    "PASS UX complete trade: all navigation destinations, focused panels, draft preservation across tabs/routes/inspection, agreement, listing, priority deep link, buyer counter and sale.",
  );
  w.close();
}
{
  const { w, d, state, click, tab } = boot((N) => {
    const s = N.newState();
    s.day = 3;
    s.operations.arrears = 40;
    const a = s.market.shift(),
      b = s.market.shift();
    Object.assign(a, {
      purchasePrice: 1500,
      listed: true,
      listPrice: 2500,
      offers: [
        {
          id: "question",
          buyer: "Sam",
          stage: "question",
          price: 2000,
          expiresDay: 4,
          seen: false,
          profile: { budget: 2200, focus: "cost", trust: 0.5, patience: 3 },
        },
      ],
    });
    Object.assign(b, {
      purchasePrice: 1600,
      repairCost: 200,
      readyDay: 3,
      listed: false,
    });
    s.inventory = [a, b];
    s.opportunities.requests = [
      {
        id: "due",
        kind: "europe",
        status: "active",
        acceptedDay: 0,
        deadline: 3,
      },
    ];
    for (const c of s.market)
      c.negotiation = {
        schema: 12,
        flowRevision: 1,
        price: c.ask,
        rounds: 1,
        lastBid: 100,
        closed: false,
        walked: false,
        status: "active",
        evidenceUsed: 0,
        history: [],
      };
    return s;
  });
  assert(d.querySelector(".priority-more"));
  assert(d.querySelector('.priorities [data-tab="requests"]'));
  const initial = state();
  click('.priorities [data-tab="today"]');
  assert(d.querySelector('[data-action="pay-bills"]'));
  assert.equal(state().cash, initial.cash);
  click('#app .retro-nav [data-view="garage"]');
  click('.priorities [data-tab="selling"]');
  assert.equal(
    d.querySelector("[data-car-panel]:not([hidden])").dataset.carPanel,
    "selling",
  );
  assert(d.querySelector('[data-action="answer-buyer"]'));
  assert.deepEqual(state().inventory[0].parts, initial.inventory[0].parts);
  assert.equal(state().cash, initial.cash);
  click('[data-action="close"]');
  click('.priorities [data-tab="workshop"][data-action="detail"]');
  assert.equal(
    d.querySelector("[data-car-panel]:not([hidden])").dataset.carPanel,
    "workshop",
  );
  assert(!("drafts" in state()));
  console.log(
    "PASS UX priorities: bounded list, correct debt/request/question/repair destinations, no cash or mechanical mutation, no UI fields added to the save.",
  );
  w.close();
}
{
  const { w, d, state, click, tab } = boot((N) => {
    const s = N.practiceScenario("B");
    delete s.trading;
    const c = s.market[0];
    delete c.vehicleHistory;
    delete c.seller;
    delete c.listing;
    c.negotiation = {
      price: 2500,
      minimum: 2300,
      rounds: 1,
      lastBid: 2000,
      closed: false,
      walked: false,
    };
    return s;
  });
  const initial = state();
  click('#app .retro-nav [data-view="market"]');
  click(".car-card");
  tab("negotiation");
  assert.equal(state().market[0].negotiation.minimum, 2300);
  assert.equal(state().cash, initial.cash);
  d.querySelector("#purchase-bid").value = 2400;
  tab("inspection");
  tab("negotiation");
  assert.equal(d.querySelector("#purchase-bid").value, "2400");
  click('[data-action="haggle-buy"]');
  assert.equal(state().market[0].negotiation.price, 2400);
  const key = d.querySelector('#details [role="tab"][data-tab="negotiation"]');
  key.dispatchEvent(
    new w.KeyboardEvent("keydown", { key: "Home", bubbles: true }),
  );
  assert.equal(
    d.querySelector('#details [role="tab"][aria-selected="true"]').dataset.tab,
    "overview",
  );
  console.log(
    "PASS UX legacy save: original limits and cash retained, old negotiation still works, drafts and keyboard tabs work.",
  );
  w.close();
}
