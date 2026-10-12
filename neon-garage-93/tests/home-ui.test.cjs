const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { JSDOM } = require("jsdom");
const { root, html, scripts } = require("./runtime.cjs");
function boot(make = (N) => N.newState()) {
  const dom = new JSDOM(html, {
      url: "https://neon-home.test",
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
  for (const f of scripts.filter((f) => !f.endsWith("/ui.js")))
    w.eval(fs.readFileSync(path.join(root, f), "utf8"));
  w.NG.save(make(w.NG));
  const before = w.localStorage.getItem(w.NG.saveKey);
  w.eval(fs.readFileSync(path.join(root, "js/ui.js"), "utf8"));
  const click = (q) => {
    const el = d.querySelector(q);
    assert(el, q);
    assert(!el.disabled, q);
    if (el.tagName !== "SUMMARY")
      el.closest("details")?.setAttribute("open", "");
    el.click();
  };
  return {
    w,
    d,
    before,
    click,
    saved: () => JSON.parse(w.localStorage.getItem(w.NG.saveKey)),
  };
}
{
  const { w, d, before, click } = boot();
  assert.equal(d.querySelector(".priorities"), null);
  assert.equal(d.querySelector(".progress-strip"), null);
  assert.equal(d.querySelectorAll(".game-hud .stats > div").length, 2);
  assert.deepEqual(
    [
      ...d.querySelectorAll(
        "#app > .game-shell > .retro-nav > button, #app > .game-shell > .retro-nav > details > summary",
      ),
    ].map((b) => b.textContent),
    ["Garage", "Market", "My Cars", "Deals", "Dealer", "Business"],
  );
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
    const entry = d.querySelector(`#app .retro-nav [data-view="${view}"]`);
    if (entry.closest("details")) {
      click("#app .nav-business summary");
      assert(d.querySelector(".nav-business").open);
    }
    click(`#app .retro-nav [data-view="${view}"]`);
    assert.equal(d.querySelector(".desk-window").dataset.windowView, view);
    click('.window-title [data-view="garage"]');
  }
  click("#app .nav-business summary");
  click('#app .nav-business [data-tab="business"]');
  assert.equal(
    d.querySelector("#ops-tab-business").getAttribute("aria-selected"),
    "true",
  );
  click('.window-title [data-view="garage"]');
  click("#app .nav-business summary");
  const summary = d.querySelector(".nav-business summary");
  summary.focus();
  summary.dispatchEvent(
    new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  assert(!d.querySelector(".nav-business").open);
  assert.equal(d.activeElement, summary);
  click("#app .nav-business summary");
  click(".game-logo h1");
  assert(!d.querySelector(".nav-business").open);
  assert.equal(w.localStorage.getItem(w.NG.saveKey), before);
  console.log(
    "PASS garage-first home: six categories, persistent progress, all destinations in one/two clicks, keyboard menus and unchanged save.",
  );
}
{
  const { d, click, saved } = boot((N) => {
    const s = N.newState();
    s.progress.points = 1;
    return s;
  });
  assert(d.querySelector(".progress-notice"));
  click(".progress-notice");
  assert(d.querySelector(".rep-panel"));
  assert.match(d.querySelector(".driver-progress").textContent, /XP/);
  click('[data-action="train-negotiation"]');
  assert.equal(saved().progress.points, 0);
  click('.window-title [data-view="garage"]');
  assert.equal(d.querySelector(".priorities"), null);
  console.log(
    "PASS progression stays in Dealer File; available skill point alert persists until spent.",
  );
}
{
  const { d, click, saved } = boot((N) => {
    const s = N.newState();
    s.cash = 30000;
    const a = s.market[0],
      b = s.market[1];
    N.buy(s, a.id);
    N.buy(s, b.id);
    N.list(s, a.id, 5000, "as-is");
    s.day = 5;
    a.offers = [
      {
        id: "home-offer",
        buyer: "Pat",
        price: 5000,
        seen: false,
        stage: "offer",
        expiresDay: 6,
      },
    ];
    b.readyDay = 2;
    b.listed = false;
    s.management.unpaid = 50;
    return s;
  });
  assert(d.querySelector('.priorities [data-tab="workshop"]'));
  assert.match(d.querySelector(".priorities").textContent, /Payment overdue/);
  click('.priorities [data-tab="selling"]');
  assert(saved().inventory[0].offers[0].seen);
  assert(
    d.querySelector('.priorities [data-tab="selling"]'),
    "Reading is not resolving an offer",
  );
  click('#details [data-action="close"]');
  click('.priorities [data-tab="today"]');
  click('[data-action="staff-pay"]');
  assert.equal(saved().management.unpaid, 0);
  assert(!d.querySelector('.priorities [data-tab="today"]'));
  click('.window-title [data-view="garage"]');
  click('.priorities [data-tab="selling"]');
  click('.offer [data-action="sell"]');
  assert.equal(saved().sold, 1);
  assert(!d.querySelector('.priorities [data-tab="selling"]'));
  assert(
    d.querySelector('.priorities [data-tab="workshop"]'),
    "Old completed repair stays actionable",
  );
  console.log(
    "PASS actionable notifications: read offer persists, paid wages clear, closed sale clears, completed unlisted repair persists.",
  );
}
