const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { JSDOM } = require("jsdom");
const { root, html, scripts } = require("./runtime.cjs");
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
const s = w.NG.newState();
s.cash = 50000;
s.reputation = 25;
s.day = 100;
s.operations.arrears = 40;
s.enterprise.projects.service = { status: "active", started: 0, readyDay: 6 };
s.enterprise.orders = [
  {
    id: "ops-order",
    name: "Neighborhood repair order",
    status: "offered",
    cost: 1200,
    revenue: 2300,
    days: 2,
    tier: 1,
    deadline: 102,
  },
];
s.opportunities.requests = [
  {
    id: "ops-request",
    kind: "europe",
    status: "offered",
    offerUntil: 102,
    day: 100,
  },
];
w.NG.save(s);
w.eval(fs.readFileSync(path.join(root, "js/ui.js"), "utf8"));
const click = (selector) => {
  const el = d.querySelector(selector);
  assert(el, selector);
  assert(!el.disabled, selector);
  el.closest("details")?.setAttribute("open", "");
  el.click();
};
const save = () => w.localStorage.getItem(w.NG.saveKey);
click(".operations-board");
assert.equal(
  d.querySelector('[role="tab"][aria-selected="true"]').dataset.tab,
  "today",
);
assert(d.querySelector('[data-action="pay-bills"]'));
assert.match(
  d.querySelector("#ops-content").textContent,
  /NEW REQUEST|CLIENT WORK/,
);
assert(!d.querySelector('[data-action="enterprise-build"]'));
assert(!d.querySelector("#wholesale-segment"));
const before = save();
click('[role="tab"][data-tab="workshop"]');
assert(d.querySelector('[data-action="enterprise-order"]'));
assert(d.querySelector('[data-action="enterprise-order"]').disabled);
assert.match(
  d.querySelector("#ops-content").textContent,
  /Clear overdue bills/,
);
click('[role="tab"][data-tab="requests"]');
assert(d.querySelector('[data-action="request-accept"]'));
assert.match(d.querySelector("#ops-content").textContent, /5,650/);
click('[role="tab"][data-tab="business"]');
assert(!d.querySelector('[data-action="enterprise-borrow"]'));
assert(d.querySelector('[data-action="view"][data-view="finances"]'));
assert.match(
  d.querySelector("#ops-content").textContent,
  /Capital at risk.*5 days locked/,
);
assert.equal(
  save(),
  before,
  "Navigation and help do not mutate a saved dealership.",
);
const businessTab = d.querySelector('[role="tab"][data-tab="business"]');
businessTab.dispatchEvent(
  new w.KeyboardEvent("keydown", { key: "Home", bubbles: true }),
);
assert.equal(
  d.querySelector('[role="tab"][aria-selected="true"]').dataset.tab,
  "today",
);
assert.equal(d.activeElement.id, "ops-tab-today");
click('[data-action="pay-bills"]');
assert.equal(JSON.parse(save()).operations.arrears, 0);
click('[role="tab"][data-tab="workshop"]');
assert(!d.querySelector('[data-action="enterprise-order"]').disabled);
click('[data-action="enterprise-order"]');
assert.equal(JSON.parse(save()).enterprise.orders[0].status, "running");
assert.equal(
  d.querySelector('[role="tab"][aria-selected="true"]').dataset.tab,
  "workshop",
);
click('[data-action="view"][data-view="garage"]');
click(".dealer-folder");
assert(!d.querySelector(".enterprise-panel"));
assert(d.querySelector('[data-tab="business"]'));
click('[data-tab="business"]');
assert.equal(
  d.querySelector('[role="tab"][aria-selected="true"]').dataset.tab,
  "business",
);
click('[data-action="view"][data-view="garage"]');
click(".computer");
click(".market-row, .car-card"); // v0.14 market rows
assert(d.querySelector('[data-action="haggle-buy"]'));
assert(d.querySelector('[data-action="inspect"]'));
assert(d.querySelector(".inline-help:not([open])"));
console.log(
  "PASS compact UI: actionable Today, four tabs, debt warning, client acceptance, request payout, wholesale risk, keyboard navigation, unchanged save and accessible trading controls.",
);
dom.window.close();
