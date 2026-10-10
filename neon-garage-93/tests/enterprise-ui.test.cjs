const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { JSDOM } = require("jsdom");
const root = path.join(__dirname, ".."),
  html = fs.readFileSync(path.join(root, "index.html"), "utf8");
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
const files = [...html.matchAll(/src="(js\/[^" ]+)"/g)].map((m) => m[1]);
for (const file of files.filter((f) => !f.endsWith("/ui.js")))
  w.eval(fs.readFileSync(path.join(root, file), "utf8"));
const fixture = w.NG.newState();
fixture.cash = 104259;
fixture.reputation = 57;
fixture.day = 147;
fixture.progress.level = 6;
fixture.business.tools = true;
fixture.business.supplier = true;
w.NG.save(fixture);
w.eval(fs.readFileSync(path.join(root, "js/ui.js"), "utf8"));
const state = () => JSON.parse(w.localStorage.getItem(w.NG.saveKey));
const click = (selector) => {
  const el = d.querySelector(selector);
  assert(el, selector);
  assert(!el.disabled, selector);
  const details = el.closest("details");
  if (details) details.open = true;
  el.click();
};
const next = () => {
  click('[data-action="next"]');
  click('[data-action="confirm-next"]');
  assert(d.querySelector("#day-report").open);
  click('[data-action="close-day-report"]');
};
click(".dealer-folder");
assert(d.querySelector(".enterprise-panel"));
assert.match(d.querySelector(".enterprise-panel").textContent, /CASH RUNWAY/);
const initialNet = w.NG.businessValue(state());
click('[data-action="enterprise-borrow"]');
assert.equal(state().cash, 114259);
assert.equal(w.NG.businessValue(state()), initialNet);
click('[data-action="enterprise-build"][data-id="service"]');
assert.equal(state().cash, 90259);
assert.equal(state().enterprise.projects.service.status, "building");
assert(
  d.querySelector('[data-action="enterprise-build"][data-id="wholesale"]')
    .disabled,
);
for (let i = 0; i < 6; i++) next();
assert.equal(state().enterprise.projects.service.status, "active");
assert(d.querySelector('.offer-notification [data-view="operations"]'));
click(".operations-board");
assert.match(
  d.querySelector(".enterprise-panel").textContent,
  /shared capacity 0 \/ 2/,
);
const order = state().enterprise.orders.find((j) => j.status === "offered"),
  cash = state().cash;
click('[data-action="enterprise-order"]');
assert.equal(state().cash, cash - order.cost);
assert.equal(state().enterprise.orders[0].status, "running");
const beforePause = state().enterprise.projects.service.status;
click('[data-action="enterprise-pause"][data-id="service"]');
assert.equal(state().enterprise.projects.service.status, beforePause);
for (let i = 0; i < order.days; i++) next();
assert.equal(state().enterprise.orders[0].status, "completed");
assert.equal(state().enterprise.profit, order.revenue - order.cost);
click(".operations-board");
click('[data-action="enterprise-build"][data-id="wholesale"]');
for (let i = 0; i < 8; i++) next();
click(".operations-board");
assert.equal(state().enterprise.projects.wholesale.status, "active");
click('[data-action="enterprise-pause"][data-id="wholesale"]');
assert.equal(state().enterprise.projects.wholesale.status, "paused");
assert(d.querySelector('[data-action="enterprise-wholesale"]').disabled);
click('[data-action="enterprise-resume"][data-id="wholesale"]');
const committed = state().cash;
click('[data-action="enterprise-wholesale"][data-cost="25000"]');
assert.equal(state().cash, committed - 25000);
assert.equal(state().enterprise.lots.length, 1);
click('[data-action="enterprise-sell"][data-id="wholesale"]');
assert(state().enterprise.projects.wholesale); // locked capital prevents shutdown
for (let i = 0; i < 5; i++) next();
assert.equal(state().enterprise.lots[0].status, "settled");
assert.equal(state().enterprise.lots.length, 1);
click(".operations-board");
click('[data-action="enterprise-repay"]');
assert.equal(state().enterprise.loan, 0);
click(".ledger-object");
assert.match(d.querySelector(".finance-chart").textContent, /Deal margin/);
assert.match(d.querySelector(".ledger").textContent, /wholesale settlement/);
assert.match(d.querySelector(".finance-chart").textContent, /credit principal/);
assert.equal(state().financialHistory.at(-1).profit, w.NG.totalMargin(state()));
console.log(
  "PASS UI late-game migration, capital review, credit, construction, service work, shared slots, blocked shutdown, pause/reopen, wholesale settlement, repayment and financial readback.",
);
dom.window.close();
