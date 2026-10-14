/* v0.14 day rhythm and cuts in the real UI. */
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { JSDOM } = require("jsdom");
const { root, html, scripts } = require("./runtime.cjs");
function boot(make) {
  const dom = new JSDOM(html, {
      url: "https://flow-ui.test/",
      runScripts: "outside-only",
    }),
    w = dom.window,
    d = w.document;
  w.scrollTo = () => {};
  w.Math.random = () => 0.99;
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
    el.closest("details")?.setAttribute("open", "");
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
const fresh = (N) => {
  const s = N.newState();
  s.market = s.market.slice(0, 3);
  return s;
};
test("Next Day is one click: no confirmation, no report window, a morning strip", () => {
  const { dom, d, state, click } = boot(fresh);
  click('#app .game-hud [data-action="next"]');
  assert.equal(state().day, 1);
  assert(!d.querySelector("#day-confirm").open);
  assert(!d.querySelector("#day-report").open);
  const strip = d.querySelector(".morning-strip");
  assert.match(strip.textContent, /June 2, 1993/);
  assert.match(strip.textContent, /Rent due/);
  click('.morning-strip [data-action="dismiss-morning"]');
  assert(!d.querySelector(".morning-strip"));
  assert(state().dayReport.read);
  click('[data-action="show-day-report"]');
  assert(d.querySelector("#day-report").open, "full report stays available");
  assert(
    !d.querySelector("#day-report .game-hud"),
    "no HUD repeated in the report",
  );
  dom.window.close();
});
test("An unseen offer that would expire still asks first", () => {
  const { dom, d, state, click } = boot((N) => {
    const s = fresh(N);
    s.cash = 20000;
    const c = s.market[0];
    N.buy(s, c.id);
    N.list(s, c.id, 5000, "as-is");
    c.offers = [
      { id: "o-x", buyer: "Pat C.", price: 3000, expiresDay: 0, seen: false },
    ];
    return s;
  });
  click('#app .game-hud [data-action="next"]');
  assert.equal(state().day, 0);
  assert(d.querySelector("#day-confirm").open);
  dom.window.close();
});
test("Skip button jumps to the finished repair and says why", () => {
  const { dom, d, state, click } = boot((N) => {
    const s = fresh(N);
    s.cash = 20000;
    const c = s.market[0];
    N.buy(s, c.id);
    c.readyDay = 3;
    c.repairMode = "rush";
    return s;
  });
  click('#app .game-hud [data-action="wait-event"]');
  assert.equal(state().day, 3);
  assert.match(
    d.querySelector(".morning-strip").textContent,
    /Skipped 3 days: A repair is finished\./,
  );
  dom.window.close();
});
test("HUD shows the Friday rent; staff, wholesale and fleet are tucked away; Books leads Business", () => {
  const { dom, d, click } = boot(fresh);
  assert.match(d.querySelector(".hud-rent").textContent, /Rent June 4: \$60/);
  const business = [
    ...d.querySelectorAll("#app .nav-business > div button"),
  ].map((b) => b.textContent);
  assert.equal(business[0], "Books");
  assert(!business.includes("Staff"));
  click(
    '#app .nav-business > div button[data-view="operations"][data-tab="business"]',
  );
  assert(!d.querySelector('[role="tab"][data-tab="staff"]'));
  const projects = d.querySelector(".enterprise-projects").textContent;
  assert(!/Wholesale|Fleet/.test(projects), projects.slice(0, 200));
  click('#app .nav-business > div button[data-view="finances"]');
  assert.match(d.querySelector(".finance-overview").textContent, /Rent due/);
  assert(d.querySelector("details.finance-details"));
  dom.window.close();
});
test("An old save keeps its rules until the player switches in Options", () => {
  const { dom, d, state, click } = boot((N) => {
    N.newGameFlow = false;
    const s = fresh(N);
    N.newGameFlow = true;
    return s;
  });
  assert(!d.querySelector(".hud-rent"));
  click('[data-action="adopt-flow"]');
  assert(state().flow.weeklyRent);
  assert(d.querySelector(".hud-rent"));
  assert(!d.querySelector('[data-action="adopt-flow"]'));
  dom.window.close();
});
test("F/3: one-screen car file, seller reason on open, buy from the bar", () => {
  const { dom, d, state, click } = boot((N) => {
    const s = fresh(N);
    s.cash = 20000;
    return s;
  });
  click('#app [data-view="market"]');
  click(".market-row");
  assert(d.querySelector("#details").classList.contains("single-car"));
  assert(!d.querySelector('#details [role="tablist"]'), "no tab bar");
  for (const key of ["overview", "inspection", "negotiation", "deal"])
    assert(!d.querySelector(`[data-car-panel="${key}"]`).hidden, key);
  const id = state().market[0].id;
  assert(state().market[0].seller.contacted, "seller reason shown on open");
  assert(
    state().market[0].seller.detailsAsked,
    "the seller question is asked on open",
  );
  assert(!d.querySelector('[data-action="seller-details"]'));
  assert(
    ![...d.querySelectorAll('#details [data-action="car-tab"]')].some((b) =>
      /Talk to seller|Inspect first/.test(b.textContent),
    ),
    "no scroll-only buttons on one screen",
  );
  assert(!d.querySelector('[data-action="contact-seller"]'));
  click('.car-decision-bar [data-action="buy"]');
  assert(state().inventory.some((c) => c.id === id));
  click(".parked-car");
  for (const key of ["overview", "workshop", "selling"])
    assert(!d.querySelector(`[data-car-panel="${key}"]`).hidden, key);
  assert(d.querySelector(".repair-packages"));
  assert(
    !d.querySelector('[data-action="inspect-deep"]'),
    "no specialist exam after purchase",
  );
  dom.window.close();
});
test("F/3: market shows cars first with demand folded into one line", () => {
  const { dom, d, click } = boot(fresh);
  click('#app [data-view="market"]');
  const row = d.querySelector(".market-row");
  assert(row, "listing rows instead of picture cards");
  assert.match(row.textContent, /Est\. value \$[\d,]+ · [+-]\$[\d,]+ margin/);
  assert(row.querySelector(".row-seller").textContent.length > 3);
  assert(row.querySelector(".grade-chip"));
  const strip = d.querySelector("details.market-strip");
  assert(strip && !strip.open);
  assert.match(strip.querySelector("summary").textContent, /Japan \d+%/);
  dom.window.close();
});
test("Purchase approach shows what each option leans on; the seller's reply tells how it landed", () => {
  const { dom, d, state, click } = boot((N) => {
    const s = fresh(N);
    s.cash = 20000;
    return s;
  });
  click('#app [data-view="market"]');
  click(".market-row");
  const options = [...d.querySelectorAll('input[name="purchase-tactic"]')];
  assert.deepEqual(
    options.map((o) => o.value),
    ["direct", "cash", "fault", "inspection"],
  );
  assert.equal(
    d.querySelector('input[name="purchase-tactic"]:checked').value,
    "direct",
  );
  const fault = d
    .querySelector('.tactic-option input[value="fault"]')
    .closest("label");
  assert(fault.classList.contains("tactic-risk"));
  assert.match(fault.textContent, /none on file yet/);
  assert.match(
    d.querySelector('.tactic-option input[value="cash"]').closest("label")
      .textContent,
    /They said: “/,
  );
  assert(
    !d.querySelector(".tactic-option .best, .tactic-option [data-best]"),
    "no verdict",
  );
  d.querySelector('input[name="purchase-tactic"][value="cash"]').checked = true;
  const ask = state().market[0].ask;
  d.querySelector("#purchase-bid").value = String(Math.round(ask * 0.85));
  click('[data-action="haggle-buy"]');
  const n = state().market[0].negotiation;
  assert.equal(n.history.at(-1).tactic, "cash");
  if (n.status === "active" || n.status === "waiting")
    assert.match(
      n.message,
      /^(Cash today helps me a lot|Quick cash is nice|I am in no rush)/,
    );
  assert.equal(
    d.querySelector('input[name="purchase-tactic"]:checked')?.value ?? "cash",
    "cash",
  );
  dom.window.close();
});
console.log(count + " day rhythm UI tests passed.");
