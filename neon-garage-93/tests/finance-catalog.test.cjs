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
  "scene",
  "economy",
  "progression",
  "finance",
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
function rng(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
test("30 distinct models, valid years, complete sprite coverage and assets", () => {
  assert.equal(NG.catalog.length, 30);
  assert.equal(new Set(NG.catalog.map((m) => m.id)).size, 30);
  const s = NG.newState();
  for (const [i, m] of NG.catalog.entries()) {
    assert(m.years[0] <= m.years[1] && m.years[1] <= 1993);
    assert(m.value > 0);
    const car = NG.generateCar(s, i, rng(i + 1));
    assert.equal(car.model, m.id);
    assert(car.year <= 1993);
    assert(Number.isInteger(NG.spriteFrames[m.id]));
    assert(
      fs.existsSync(path.join(__dirname, "../assets", NG.spriteSheets[m.id])),
    );
    assert(!NG.carArt(car).includes("undefined"));
  }
});
test("Daily markets can produce all 30 while retaining affordable entry cars", () => {
  const s = NG.newState(),
    random = rng(1993),
    seen = new Set();
  for (let i = 0; i < 1000; i++) {
    const cars = NG.market(s, random);
    assert.equal(cars.length, 9);
    assert(cars.slice(0, 3).every((c) => c.ask + 90 < 5000));
    cars.forEach((c) => seen.add(c.model));
  }
  assert.equal(seen.size, 30);
});
test("Different new models have different service costs and upgrades still apply", () => {
  const s = NG.newState(),
    cheap = NG.generateCar(
      s,
      NG.catalog.findIndex((m) => m.id === "civic"),
      rng(1),
    ),
    costly = NG.generateCar(
      s,
      NG.catalog.findIndex((m) => m.id === "911"),
      rng(1),
    );
  cheap.parts.engine = costly.parts.engine = 50;
  cheap.flaws = [];
  costly.flaws = [];
  assert(
    NG.repairQuote(costly, "engine", s) > NG.repairQuote(cheap, "engine", s),
  );
  const before = NG.repairQuote(costly, "engine", s);
  s.business.tools = true;
  s.business.supplier = true;
  assert(NG.repairQuote(costly, "engine", s) < before);
});
test("One daily snapshot updates accurately after purchase, sale and overhead", () => {
  const s = NG.newState();
  assert.equal(s.financialHistory.length, 1);
  assert.equal(s.financialHistory[0].value, 5000);
  const c = s.market[0];
  NG.buy(s, c.id);
  NG.save(s);
  assert.equal(s.financialHistory.length, 1);
  assert.equal(
    s.financialHistory[0].value,
    s.cash + Math.round(NG.value(s, c) * 0.72),
  );
  NG.sell(s, c.id, "dealer");
  NG.save(s);
  assert.equal(s.financialHistory[0].profit, s.profit);
  assert.equal(s.financialHistory[0].value, s.cash);
  NG.buyUpgrade(s, "advertising");
  NG.toggleAdvertising(s);
  NG.nextDay(s, () => 0.8);
  NG.save(s);
  assert.equal(s.financialHistory.length, 2);
  assert.equal(s.financialHistory[1].day, 1);
  assert.equal(s.financialHistory[1].value, s.cash);
  NG.save(s);
  assert.equal(s.financialHistory.length, 2);
  assert.deepEqual(NG.load(), s);
});
test("Old saves start today; earlier dates and values are not fabricated", () => {
  const s = NG.newState();
  s.day = 38;
  s.cash = 4123;
  s.profit = -250;
  delete s.financialHistory;
  storage.set(NG.saveKey, JSON.stringify(s));
  const restored = NG.load();
  assert.deepEqual(restored.financialHistory, [
    { day: 38, profit: -250, value: 4123 },
  ]);
  assert(NG.financeChart(restored).includes("One recorded day"));
  assert(!NG.financeChart(restored).includes("NaN"));
});
test("Chart handles losses, zero value, one point and long histories", () => {
  const s = NG.newState();
  s.financialHistory = [{ day: 0, profit: -100, value: 0 }];
  let svg = NG.financeChart(s);
  assert(svg.includes("profit-line") && svg.includes("value-line"));
  assert(!/NaN|Infinity/.test(svg));
  s.financialHistory = Array.from({ length: 1000 }, (_, day) => ({
    day,
    profit: day === 412 ? -99999 : day,
    value: day === 532 ? 999999 : 5000 + day,
  }));
  svg = NG.financeChart(s);
  assert(svg.includes("-$99,999"));
  assert(svg.includes("$999,999"));
  assert(!/NaN|Infinity/.test(svg));
});
test("Progress bars clamp display values and expose accessible ranges", () => {
  const html = NG.progressBar("Cash", 9000, 600);
  assert(html.includes("width:100%"));
  assert(html.includes('aria-valuenow="600"'));
  assert(!NG.progressBar("Empty", 0, 0).includes("NaN"));
  const s = NG.newState();
  s.reputation = 15;
  assert(NG.repProgress(s).includes("15 / 30 REP"));
  s.reputation = 100;
  assert(NG.repProgress(s).includes("MAXIMUM TIER"));
});
console.log(count + " finance and catalog tests passed.");
