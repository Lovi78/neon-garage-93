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
  "sprite-clips",
  "economy",
  "progression",
  "finance",
  "collection",
  "customers",
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
function fixture(mode = "promise") {
  const s = NG.newState(),
    c = s.market[0];
  s.reputation = 20;
  NG.buy(s, c.id);
  c.parts = {
    engine: 80,
    transmission: 80,
    suspension: 80,
    body: 80,
    cosmetic: 80,
  };
  c.flaws = [{ ...NG.flaws[0], fixed: false, revealed: true }];
  c.inspected = true;
  NG.list(s, c.id, 3000, mode);
  c.offers = [{ id: "buyer", buyer: "Pat S.", price: 2500 }];
  return { s, c };
}
test("Listing modes validate inspection and change real offer valuation", () => {
  const s = NG.newState(),
    c = s.market[0];
  NG.buy(s, c.id);
  assert.throws(() => NG.list(s, c.id, 3000, "honest"));
  assert.throws(() => NG.list(s, c.id, 3000, "bad"));
  NG.list(s, c.id, 3000, "as-is");
  assert.equal(NG.listingValue(s, c), Math.round(NG.value(s, c) * 0.95));
  c.flaws = [{ ...NG.flaws[0], fixed: false, revealed: false }];
  NG.list(s, c.id, 3000, "promise");
  assert(NG.listingValue(s, c) > NG.value(s, c));
  NG.inspect(s, c.id);
  NG.list(s, c.id, 3000, "honest");
  assert.equal(NG.listingValue(s, c), NG.value(s, c));
});
test("Honest sale with disclosed defects builds trust without complaints", () => {
  const { s, c } = fixture("honest");
  NG.sell(s, c.id, "buyer");
  assert.equal(s.reputation, 23);
  assert.equal(s.customers[0].trust, 2);
  assert.equal(s.customers[0].purchases, 1);
  assert.equal(s.claims.length, 0);
  for (let i = 0; i < 6; i++) NG.nextDay(s, () => 0.8);
  assert.equal(s.claims.length, 0);
});
test("As-is sale is explicit, earns one reputation and does not claim fault-free", () => {
  const { s, c } = fixture("as-is");
  NG.sell(s, c.id, "buyer");
  assert.equal(s.reputation, 21);
  assert.equal(s.customers[0].trust, 1);
  assert.equal(s.claims.length, 0);
});
test("Broken promises create a delayed complaint and one reputation penalty", () => {
  const { s, c } = fixture();
  NG.sell(s, c.id, "buyer");
  assert.equal(s.claims[0].status, "scheduled");
  NG.nextDay(s, () => 0.8);
  assert.equal(s.claims[0].status, "scheduled");
  NG.nextDay(s, () => 0.8);
  assert.equal(s.claims[0].status, "open");
  assert.equal(s.reputation, 18);
  assert.equal(s.customers[0].trust, -2);
  const rep = s.reputation;
  NG.processClaims(s);
  assert.equal(s.reputation, rep);
});
test("Contributions adjust cash, sale profit, album profit and chart once", () => {
  const { s, c } = fixture();
  NG.sell(s, c.id, "buyer");
  NG.nextDay(s, () => 0.8);
  NG.nextDay(s, () => 0.8);
  const q = s.claims[0],
    before = s.cash,
    profit = s.profit;
  assert.equal(q.amount, 210);
  NG.resolveClaim(s, q.id, "refund");
  assert.equal(s.cash, before - 210);
  assert.equal(s.profit, profit - 210);
  assert.equal(s.sales[0].profit, s.sales[0].price - s.sales[0].cost - 210);
  assert.equal(s.collection.models[c.model].profit, s.profit);
  assert.equal(s.customers[0].trust, 1);
  assert.equal(q.status, "settled");
  assert.throws(() => NG.resolveClaim(s, q.id, "refund"));
  NG.save(s);
  assert.equal(s.financialHistory.at(-1).profit, s.profit);
  assert.equal(s.cash, 5000 + s.ledger.reduce((n, l) => n + l.amount, 0));
  assert.deepEqual(NG.load(), s);
});
test("Insufficient cash, rejection and expiry do not charge hidden money", () => {
  const { s, c } = fixture();
  NG.sell(s, c.id, "buyer");
  NG.nextDay(s, () => 0.8);
  NG.nextDay(s, () => 0.8);
  s.cash = 0;
  assert.throws(() => NG.resolveClaim(s, s.claims[0].id, "refund"));
  assert.equal(s.claims[0].status, "open");
  NG.resolveClaim(s, s.claims[0].id, "decline");
  assert.equal(s.cash, 0);
  assert.equal(s.reputation, 16);
  const f = fixture();
  NG.sell(f.s, f.c.id, "buyer");
  const cash = f.s.cash;
  for (let i = 0; i < 5; i++) NG.nextDay(f.s, () => 0.8);
  assert.equal(f.s.claims[0].status, "ignored");
  assert.equal(f.s.reputation, 15);
  assert.equal(f.s.cash, cash);
  NG.processClaims(f.s);
  assert.equal(f.s.reputation, 15);
});
test("Returning buyers respect preferences and receive a real loyalty uplift", () => {
  const s = NG.newState(),
    c = s.market[0];
  NG.buy(s, c.id);
  NG.list(s, c.id, Math.round(NG.value(s, c) * 1.4), "as-is");
  const base = JSON.parse(JSON.stringify(s)),
    repeat = JSON.parse(JSON.stringify(s));
  repeat.customers = [
    {
      name: "Pat S.",
      segment: NG.model(c).segment,
      trust: 2,
      purchases: 1,
      spent: 2000,
      lastDay: 0,
    },
  ];
  NG.nextDay(base, () => 0.1);
  NG.nextDay(repeat, () => 0.1);
  assert(base.inventory[0].offers.length);
  assert(repeat.inventory[0].offers[0].returning);
  assert(
    repeat.inventory[0].offers[0].price > base.inventory[0].offers[0].price,
  );
  repeat.claims = [{ buyer: "Pat S.", status: "scheduled" }];
  assert(!NG.chooseBuyer(repeat, c, () => 0).returning);
  repeat.claims = [];
  repeat.customers[0].segment = "america";
  assert(!NG.chooseBuyer(repeat, c, () => 0).returning);
});
test("Dealer sales and repaired fault-free promises create no complaint", () => {
  const f = fixture();
  NG.sell(f.s, f.c.id, "dealer");
  assert.equal(f.s.customers.length, 0);
  assert.equal(f.s.claims.length, 0);
  assert.equal(f.s.reputation, 20);
  const g = fixture();
  g.c.flaws[0].fixed = true;
  NG.sell(g.s, g.c.id, "buyer");
  assert.equal(g.s.claims.length, 0);
  assert.equal(g.s.customers[0].trust, 2);
});
test("Old saves keep existing offers and gain no retroactive complaints", () => {
  const f = fixture("as-is");
  delete f.c.listingMode;
  delete f.s.customers;
  delete f.s.claims;
  delete f.s.reputationLog;
  NG.save(f.s);
  const loaded = NG.load();
  assert.deepEqual(loaded.inventory[0].offers, f.c.offers);
  assert.deepEqual(loaded.customers, []);
  assert.deepEqual(loaded.claims, []);
  assert.equal(loaded.cash, f.s.cash);
  NG.sell(loaded, f.c.id, "buyer");
  assert.equal(loaded.claims.length, 0);
});
console.log(count + " customer care tests passed.");
