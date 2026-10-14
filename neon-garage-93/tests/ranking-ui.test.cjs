/* v0.14 F/4 in the real UI: HUD rank, ranking window, Friday news, goal toasts. */
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { JSDOM } = require("jsdom");
const { root, html, scripts } = require("./runtime.cjs");
function boot(make) {
  const dom = new JSDOM(html, {
      url: "https://ranking-ui.test/",
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
test("HUD shows your rank and the next dealer; it opens the ranking window", () => {
  const { dom, d, click } = boot(fresh);
  const hud = d.querySelector(".hud-rank");
  assert.match(hud.textContent, /Rank #6 of 7/);
  assert.match(hud.textContent, /Wk 0\/13/);
  assert.match(hud.textContent, /\$[\d,]+ to pass Westside Wheels/);
  click(".hud-rank");
  const rows = [...d.querySelectorAll(".rank-table li")];
  assert.equal(rows.length, 7);
  assert.equal(rows[5].classList.contains("you"), true);
  assert.match(rows[5].textContent, /Neon Garage \(you\)/);
  assert.match(rows[0].textContent, /Coral Bay Classics/);
  assert.match(
    d.querySelector(".rank-target").textContent,
    /Next: Westside Wheels .* Ranks lock on June 4, 1993\./,
  );
  assert.equal(d.querySelectorAll(".rank-unlocks > div").length, 3);
  assert.equal(d.querySelectorAll(".rank-unlocks .reached").length, 0);
  assert.equal(d.querySelectorAll(".season-goals li").length, 8);
  assert.match(d.querySelector(".season-head").textContent, /August 27, 1993/);
  dom.window.close();
});
test("Ranking sits in the icon navigation", () => {
  const { dom, d, click } = boot(fresh);
  click('#app .retro-nav [data-view="rankings"]');
  assert(d.querySelector('.desk-window[data-window-view="rankings"]'));
  assert(d.querySelector('[data-view="rankings"] .icon-trophy'));
  dom.window.close();
});
test("Friday morning strip reports the new rank and the unlock", () => {
  const { dom, w, d, state, click } = boot((N) => {
    const s = fresh(N);
    s.market = [];
    s.cash += 4000;
    return s;
  });
  for (let i = 0; i < 3; i++) click('#app .game-hud [data-action="next"]');
  assert.equal(state().day, 3);
  const strip = d.querySelector(".morning-strip").textContent;
  assert.match(strip, /Silver Palms ranking: #5 of 7 \(up 1\)/);
  assert.match(strip, /Unlocked: Auction tips/);
  assert.match(strip, /Season goal done: .*Break into the Silver Palms Top 5/);
  click(".hud-rank");
  assert.equal(d.querySelectorAll(".rank-unlocks .reached").length, 1);
  assert(d.querySelector(".season-goals li.done"));
  dom.window.close();
});
test("A profitable sale toasts the season goal with its reward", () => {
  const { dom, d, click } = boot((N) => {
    const s = fresh(N);
    s.cash = 20000;
    const c = s.market[0];
    N.buy(s, c.id);
    N.list(s, c.id, 9000, "as-is");
    c.offers = [
      {
        id: "o-goal",
        buyer: "Pat C.",
        price: c.purchasePrice + 900,
        stage: "agreed",
        expiresDay: 2,
        seen: true,
      },
    ];
    return s;
  });
  click(".parked-car");
  click('#details [data-action="sell"][data-offer="o-goal"]');
  const t = d.querySelector("#toast");
  assert.equal(t.dataset.kind, "milestone");
  assert.match(
    t.textContent,
    /Season goal: Sell a car for a profit \/ \+30 XP/,
  );
  dom.window.close();
});
test("Auction-tip cars are labelled in the market", () => {
  const { dom, d, click } = boot((N) => {
    const s = fresh(N);
    s.market[1].tip = true;
    return s;
  });
  click('#app [data-view="market"]');
  const tips = [...d.querySelectorAll(".market-row .tip-label")];
  assert.equal(tips.length, 1);
  assert.equal(tips[0].textContent, "DEALER TIP");
  dom.window.close();
});
console.log(count + " ranking UI tests passed.");
