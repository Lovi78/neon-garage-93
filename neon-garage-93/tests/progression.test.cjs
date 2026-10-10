const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
global.window = global;
const storage = new Map();
global.localStorage = {
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, v),
};
for (const file of [
  "cars",
  "catalog-v06",
  "sprite-clips",
  "economy",
  "progression",
  "strategy",
  "finance",
  "collection",
  "customers",
  "enterprise",
  "opportunities",
  "day-report",
  "negotiation",
  "legacy-language",
  "state",
])
  vm.runInThisContext(
    fs.readFileSync(path.join(__dirname, "../js/" + file + ".js"), "utf8"),
  );
let count = 0;
function test(name, run) {
  run();
  count++;
  console.log("PASS " + name);
}
test("XP only on closed negotiated deals; no duplicates after reload", () => {
  const s = NG.newState(),
    c = s.market[0];
  c.ask = 1000;
  NG.hagglePurchase(s, c.id, 950, () => 0.2);
  assert.equal(s.progress.xp, 0);
  NG.save(s);
  const restored = NG.load();
  NG.buy(restored, c.id);
  assert.equal(restored.progress.xp, 20);
  assert.throws(() => NG.buy(restored, c.id));
  NG.awardDealXP(restored, restored.inventory[0], "purchase", 50);
  assert.equal(restored.progress.xp, 20);
  NG.list(restored, c.id, 2000);
  const owned = restored.inventory[0];
  owned.offers = [{ id: "xp", buyer: "Alex", price: 1500 }];
  NG.haggleSale(restored, c.id, "xp", 1550, () => 0.9);
  assert.equal(restored.progress.xp, 20);
  NG.sell(restored, c.id, "xp");
  assert.equal(restored.progress.xp, 40);
  assert.throws(() => NG.sell(restored, c.id, "xp"));
  assert.equal(restored.progress.log.length, 2);
});
test("Straight trades, rejected offers and dealer sales grant no XP", () => {
  const s = NG.newState(),
    c = s.market[0];
  NG.buy(s, c.id);
  assert.equal(s.progress.xp, 0);
  NG.list(s, c.id, 9000);
  c.offers = [{ id: "walk", buyer: "Alex", price: 1000 }];
  NG.haggleSale(s, c.id, "walk", 9000, () => 0);
  assert.equal(s.progress.xp, 0);
  NG.sell(s, c.id, "dealer");
  assert.equal(s.progress.xp, 0);
});
test("Level thresholds, points, skill caps and perk prerequisite", () => {
  const s = NG.newState();
  s.progress.xp = 75;
  const c = s.market[0];
  NG.awardDealXP(s, c, "purchase", 200);
  assert.equal(s.progress.level, 2);
  assert.equal(s.progress.xp, 17);
  assert.equal(s.progress.points, 1);
  assert.throws(() => NG.unlockOneMoreShot(s));
  NG.trainNegotiation(s);
  assert.equal(s.progress.negotiation, 1);
  assert.equal(s.progress.points, 0);
  assert.throws(() => NG.trainNegotiation(s));
  s.progress.points = 4;
  NG.trainNegotiation(s);
  NG.unlockOneMoreShot(s);
  assert.equal(NG.sellerRounds(s), 4);
  assert.throws(() => NG.unlockOneMoreShot(s));
  NG.trainNegotiation(s);
  assert.throws(() => NG.trainNegotiation(s));
});
test("Skills improve new limits; One More Shot gives an actual fourth round", () => {
  const a = NG.newState(),
    b = NG.newState();
  a.market[0].ask = b.market[0].ask = 1000;
  b.progress.negotiation = 2;
  b.progress.oneMoreShot = true;
  NG.hagglePurchase(a, a.market[0].id, 650, () => 1);
  NG.hagglePurchase(b, b.market[0].id, 650, () => 1);
  assert.equal(
    a.market[0].negotiation.minimum - b.market[0].negotiation.minimum,
    20,
  );
  for (const bid of [750, 850])
    NG.hagglePurchase(b, b.market[0].id, bid, () => 0);
  assert(!b.market[0].negotiation.closed);
  NG.hagglePurchase(b, b.market[0].id, 900, () => 0);
  assert(b.market[0].negotiation.closed);
  assert.equal(b.market[0].negotiation.rounds, 4);
  assert.throws(() => NG.hagglePurchase(b, b.market[0].id, 905));
  const c = b.market[1];
  NG.buy(b, c.id);
  NG.list(b, c.id, 3000);
  c.offers = [{ id: "skill", buyer: "Alex", price: 1000 }];
  NG.haggleSale(b, c.id, "skill", 1050, () => 0);
  assert.equal(c.offers[0].negotiation.budget, 1045);
});
test("Business purchases, discounted quotes and actual repair cash agree", () => {
  const s = NG.newState(),
    c = s.market[0];
  NG.buy(s, c.id);
  NG.inspect(s, c.id);
  const original = NG.repairQuote(c, "engine", s);
  NG.buyUpgrade(s, "tools");
  const tools = NG.repairQuote(c, "engine", s);
  assert(tools < original);
  NG.buyUpgrade(s, "supplier");
  const both = NG.repairQuote(c, "engine", s);
  assert(both < tools);
  assert(both > 0);
  assert.throws(() => NG.buyUpgrade(s, "tools"));
  const before = s.cash;
  NG.repair(s, c.id, "engine");
  assert.equal(before - s.cash, both);
  assert.equal(c.repairCost, both);
  assert.equal(s.cash, 5000 + s.ledger.reduce((n, l) => n + l.amount, 0));
});
test("Marketing fees and pauses remain separate from operating bills", () => {
  const s = NG.newState();
  NG.buyUpgrade(s, "advertising");
  assert(!s.business.adActive);
  NG.toggleAdvertising(s);
  const before = s.cash;
  NG.nextDay(s, () => 0.8);
  assert.equal(s.cash, before - 40);
  assert.equal(s.ledger[0].type, "marketing");
  assert.equal(s.ledger[0].day, 1);
  NG.toggleAdvertising(s);
  NG.nextDay(s, () => 0.8);
  assert.equal(s.cash, before - 60);
  s.cash = 40;
  NG.toggleAdvertising(s);
  NG.nextDay(s, () => 0.8);
  assert.equal(s.cash, 0);
  NG.nextDay(s, () => 0.8);
  assert.equal(s.cash, 0);
  assert(!s.business.adActive);
  assert(s.adNotice);
  assert.throws(() => NG.toggleAdvertising(s));
});
test("Reputation and marketing change real buyer arrival chances", () => {
  function scenario(rep, ads) {
    const s = NG.newState(),
      c = s.market[0];
    NG.buy(s, c.id);
    s.reputation = rep;
    s.marketTrends.next = { segment: "america", multiplier: 1.25, duration: 2 };
    s.business.adActive = ads;
    NG.list(s, c.id, NG.value(s, c));
    NG.nextDay(s, () => 0.7);
    return c.offers.length;
  }
  assert.equal(scenario(0, false), 0);
  assert.equal(scenario(50, false), 1);
  assert.equal(scenario(0, true), 1);
  const s = NG.newState();
  s.reputation = 15;
  assert.equal(NG.repTier(s).name, "Trusted Dealer");
  assert.equal(NG.nextRepTier(s).at, 30);
});
test("Legacy v0.3 saves retain money, cars and ongoing negotiations", () => {
  const s = NG.newState(),
    c = s.market[0];
  NG.hagglePurchase(s, c.id, Math.floor(c.ask * 0.95), () => 0.2);
  delete s.progress;
  delete s.business;
  NG.save(s);
  const loaded = NG.load();
  assert.equal(loaded.cash, s.cash);
  assert.deepEqual(loaded.market, s.market);
  assert.equal(loaded.progress.xp, 0);
  assert.equal(loaded.progress.points, 0);
  assert.equal(loaded.progress.level, 1);
  assert(!loaded.business.tools);
  NG.save(loaded);
  assert.deepEqual(NG.load(), loaded);
});
console.log(count + " progression tests passed.");
