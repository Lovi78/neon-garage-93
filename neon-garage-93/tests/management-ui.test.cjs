const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { JSDOM } = require("jsdom");
const { root, html, scripts } = require("./runtime.cjs");
const dom = new JSDOM(html, {
    url: "https://neon.test",
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
for (const f of scripts) w.eval(fs.readFileSync(path.join(root, f), "utf8"));
const click = (q) => {
  const b = d.querySelector(q);
  assert(b, q);
  assert(!b.disabled, q);
  b.click();
};
const saved = () => JSON.parse(w.localStorage.getItem(w.NG.saveKey));
click('#app .retro-nav [data-view="operations"]');
click('[role="tab"][data-tab="staff"]');
click('[data-action="staff-hire"][data-id="ray"]');
assert.equal(saved().management.staff[0].id, "ray");
click('[data-action="staff-auto"]');
assert(saved().management.staff[0].auto);
click('[role="tab"][data-tab="workshop"]');
d.getElementById("work-kind").value = "inspect";
d.getElementById("work-worker").value = "ray";
click('[data-action="work-now"]');
assert.equal(saved().management.staff[0].used, 2);
assert(saved().market[0].inspected);
d.getElementById("work-car").selectedIndex = 1;
click('[data-action="work-queue"]');
assert.equal(saved().management.queue.length, 1);
click('[data-action="work-cancel"]');
assert.equal(saved().management.queue.length, 0);
click('[role="tab"][data-tab="staff"]');
click('[data-action="staff-fire"]');
assert.equal(saved().management.staff.length, 0);
click('#app .retro-nav [data-view="finances"]');
assert.match(d.getElementById("app").textContent, /Payroll earned/);
assert.match(d.getElementById("app").textContent, /Cash change/);
// Persistent repaired-but-unlisted priority, even on a later morning.
const s = w.NG.load(),
  c = s.market[0];
s.cash = 10000;
w.NG.buy(s, c.id);
s.day = 10;
c.readyDay = 2;
c.listed = false;
w.NG.save(s);
w.eval(fs.readFileSync(path.join(root, "js/ui.js"), "utf8"));
assert(d.querySelector('.priorities [data-tab="workshop"]'));
console.log(
  "PASS management UI: hire, delegation, real inspection, queue/cancel, dismissal, finance and persistent priorities.",
);
