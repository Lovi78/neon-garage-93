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
for (const name of [
  "cars",
  "catalog-v06",
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
    fs.readFileSync(path.join(__dirname, "../js/" + name + ".js"), "utf8"),
  );
let count = 0;
function test(name, run) {
  run();
  count++;
  console.log("PASS " + name);
}
test("Demand waves persist, move value, expire and cannot reroll on reload", () => {
  const s = NG.newState(),
    car = NG.generateCar(s, 0, () => 0.8);
  s.marketTrends.next = { segment: "japan", multiplier: 1.25, duration: 2 };
  const initial = NG.value(s, car);
  NG.nextDay(s, () => 0.8);
  assert(s.demand.japan > 1.23);
  assert(NG.value(s, car) > initial);
  const plan = s.marketTrends.next;
  NG.save(s);
  assert.deepEqual(NG.load().marketTrends.next, plan);
  NG.nextDay(s, () => 0.8);
  assert(s.demand.japan > 1.23);
  NG.nextDay(s, () => 0.8);
  assert(s.demand.japan < 1.05);
  assert(s.marketTrends.history.length >= 4);
});
test("Operating costs are paid once and arrears reduce value and block expansion", () => {
  const s = NG.newState();
  s.cash = 10;
  NG.nextDay(s, () => 0.8);
  assert.equal(s.cash, 0);
  assert.equal(s.operations.arrears, 10);
  assert.equal(NG.businessValue(s), -10);
  assert.equal(s.ledger[0].amount, -10);
  assert.throws(() => NG.buy(s, s.market[0].id));
  assert.throws(() => NG.buyUpgrade(s, "tools"));
  NG.save(s);
  assert.equal(NG.load().operations.arrears, 10);
  s.cash = 20;
  NG.payOperatingBills(s);
  assert.equal(s.cash, 10);
  assert.equal(s.operations.arrears, 0);
  assert.throws(() => NG.payOperatingBills(s));
});
test("Holding costs, advertising and day report show actual overnight payments", () => {
  const s = NG.newState();
  NG.buy(s, s.market[0].id);
  NG.buyUpgrade(s, "advertising");
  NG.toggleAdvertising(s);
  const before = s.cash;
  NG.nextDay(s, () => 0.8);
  assert.equal(before - s.cash, 45);
  assert.equal(s.dayReport.overnightCash, -45);
  assert.match(s.dayReport.operations, /25/);
  assert.equal(s.cash, 5000 + s.ledger.reduce((n, l) => n + l.amount, 0));
});
test("One normal job occupies the workshop; rush bypasses it at a real premium", () => {
  const s = NG.newState();
  s.cash = 30000;
  NG.buy(s, s.market[0].id);
  NG.buy(s, s.market[0].id);
  const [a, b] = s.inventory;
  NG.inspect(s, a.id);
  NG.inspect(s, b.id);
  NG.repair(s, a.id, "engine");
  assert.equal(a.readyDay, 2);
  assert.equal(NG.workshopBusy(s), 1);
  assert.throws(() => NG.repair(s, b.id, "cosmetic"), /occupied/);
  const quote = NG.repairQuote(b, "cosmetic", s, "rush"),
    cash = s.cash;
  NG.repair(s, b.id, "cosmetic", "rush");
  assert.equal(b.readyDay, 1);
  assert.equal(s.cash, cash - quote);
  assert(quote > NG.repairQuote(b, "cosmetic", s));
  NG.nextDay(s, () => 0.8);
  assert(NG.busy(s, a));
  assert(!NG.busy(s, b));
  NG.nextDay(s, () => 0.8);
  assert(!NG.busy(s, a));
});
test("Mechanical ranks lower real costs and shorten work; specialist perks consume points", () => {
  const s = NG.newState(),
    car = s.market[0];
  s.progress.points = 8;
  const original = NG.inspectionPrice(s);
  NG.trainSkill(s, "mechanical");
  assert(NG.inspectionPrice(s) < original);
  NG.trainSkill(s, "mechanical");
  NG.unlockSpecialist(s, "sharpEye");
  assert(s.progress.sharpEye);
  assert.equal(NG.repairDuration(s, "engine", "standard"), 1);
  const fee = NG.inspectionPrice(s),
    cash = s.cash;
  NG.inspect(s, car.id);
  assert.equal(s.cash, cash - fee);
  assert.equal(car.inspectionCost, fee);
  NG.buyUpgrade(s, "diagnostics");
  assert(NG.inspectionPrice(s) < fee);
  assert.throws(() => NG.unlockSpecialist(s, "sharpEye"));
  NG.trainSkill(s, "market");
  NG.trainSkill(s, "market");
  NG.unlockSpecialist(s, "trendSpotter");
  assert(s.progress.trendSpotter);
  assert.equal(s.progress.points, 2);
});
test("Market ranks improve valuation without performing an inspection", () => {
  const s = NG.newState(),
    car = s.market[0];
  car.claim = 95;
  car.parts = {
    engine: 40,
    transmission: 40,
    suspension: 40,
    body: 40,
    cosmetic: 40,
  };
  car.flaws = [{ ...NG.flaws[0], fixed: false, revealed: false }];
  const actual = NG.value(s, car),
    before = NG.estimate(s, car);
  s.progress.market = 3;
  const improved = NG.estimate(s, car);
  assert(Math.abs(improved - actual) < Math.abs(before - actual));
  assert.notEqual(improved, actual);
  assert(!car.inspected);
  assert(!car.flaws[0].revealed);
});
test("Thirty strategic days preserve accounting and valid market ranges", () => {
  const s = NG.newState();
  let seed = 80;
  const rng = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let day = 0; day < 30; day++) {
    const c = s.market[0];
    if (s.cash > c.ask + 200 && !s.operations.arrears) {
      NG.buy(s, c.id);
      NG.list(s, c.id, NG.value(s, c), "as-is");
    }
    NG.nextDay(s, rng);
    for (const car of [...s.inventory]) {
      if (car.offers.length) NG.sell(s, car.id, car.offers[0].id);
      else if (s.inventory.length === 2) NG.sell(s, car.id, "dealer");
    }
    NG.save(s);
    assert.equal(s.cash, 5000 + s.ledger.reduce((n, l) => n + l.amount, 0));
    assert(s.cash >= 0);
    assert(s.operations.arrears >= 0);
    Object.values(s.demand).forEach((value) =>
      assert(value >= 0.7 && value <= 1.35),
    );
  }
  assert.equal(s.day, 30);
  assert(s.sold > 0);
  assert(s.financialHistory.length === 31);
});
test("Legacy saves keep live values and ongoing jobs; new fields are added safely", () => {
  const s = NG.newState();
  NG.buy(s, s.market[0].id);
  s.inventory[0].readyDay = 2;
  delete s.operations;
  delete s.marketTrends;
  delete s.progress.mechanical;
  delete s.progress.market;
  delete s.progress.sharpEye;
  delete s.progress.trendSpotter;
  storage.set(NG.saveKey, JSON.stringify(s));
  const restored = NG.load();
  assert.equal(restored.cash, s.cash);
  assert.deepEqual(restored.demand, s.demand);
  assert.equal(restored.inventory[0].readyDay, 2);
  assert.equal(restored.operations.arrears, 0);
  assert.equal(restored.progress.mechanical, 0);
  NG.save(restored);
  assert.deepEqual(NG.load(), restored);
});
console.log(count + " strategy tests passed.");
