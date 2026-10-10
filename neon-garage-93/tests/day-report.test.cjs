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
test("Closing cash flow, trading result and new morning are separate", () => {
  const s = NG.newState(),
    c = s.market[0];
  NG.buy(s, c.id);
  const purchase = c.purchasePrice,
    price = Math.round(NG.value(s, c) * 0.72);
  NG.sell(s, c.id, "dealer");
  const cash = s.cash,
    report = NG.nextDay(s, () => 0.8);
  assert.equal(report.closedDay, 0);
  assert.equal(report.day, 1);
  assert.equal(report.closingCash, cash);
  assert.equal(report.cashFlow, price - purchase);
  assert.equal(report.tradingResult, price - purchase);
  assert.equal(report.overnightCash, -20);
  assert.equal(report.marketCount, 9);
  assert.equal(report.read, false);
});
test("Completed workshop jobs, expiring offers and incoming offers are reported", () => {
  const s = NG.newState(),
    c = s.market[0];
  NG.buy(s, c.id);
  NG.inspect(s, c.id);
  NG.repair(s, c.id, "cosmetic");
  const report = NG.nextDay(s, () => 0.4);
  assert.deepEqual(report.completedRepairs, [NG.model(c).name]);
  NG.list(s, c.id, NG.value(s, c), "honest");
  c.offers = [{ id: "old", price: 1000, buyer: "Old buyer" }];
  s.marketTrends.next = { segment: "japan", multiplier: 1.15, duration: 2 };
  const next = NG.nextDay(s, () => 0.4);
  assert.equal(next.expiredOffers, 1);
  assert.equal(next.offers.length, 1);
  assert.equal(next.offers[0].price, c.offers[0].price);
  assert.equal(next.completedRepairs.length, 0);
});
test("Daily marketing belongs to overnight cash and is saved without replay", () => {
  const s = NG.newState();
  NG.buyUpgrade(s, "advertising");
  NG.toggleAdvertising(s);
  const cash = s.cash;
  NG.nextDay(s, () => 0.8);
  assert.equal(s.dayReport.closingCash, cash);
  assert.equal(s.dayReport.cashFlow, -450);
  assert.equal(s.dayReport.overnightCash, -40);
  NG.save(s);
  assert.deepEqual(NG.load().dayReport, s.dayReport);
  s.dayReport.read = true;
  NG.save(s);
  assert.equal(NG.load().dayReport.read, true);
  assert.equal(s.cash, cash - 40);
});
test("Complaint arrivals and ignored cases appear with exact reputation changes", () => {
  const s = NG.newState(),
    c = s.market[0];
  s.reputation = 20;
  NG.buy(s, c.id);
  c.flaws = [{ ...NG.flaws[0], fixed: false, revealed: false }];
  NG.list(s, c.id, 3000, "promise");
  c.offers = [{ id: "buyer", price: 2500, buyer: "Pat" }];
  NG.sell(s, c.id, "buyer");
  NG.nextDay(s, () => 0.8);
  NG.nextDay(s, () => 0.8);
  assert.equal(s.dayReport.newClaims.length, 1);
  assert.equal(s.dayReport.overnightReputation, -4);
  for (let i = 0; i < 3; i++) NG.nextDay(s, () => 0.8);
  assert.deepEqual(s.dayReport.expiredClaims, ["Pat"]);
  assert.equal(s.dayReport.overnightReputation, -3);
});
test("Contributions for earlier sales count on the day they were paid", () => {
  const s = NG.newState(),
    c = s.market[0];
  NG.buy(s, c.id);
  c.flaws = [{ ...NG.flaws[0], fixed: false, revealed: false }];
  NG.list(s, c.id, 3000, "promise");
  c.offers = [{ id: "buyer", price: 2500, buyer: "Pat" }];
  NG.sell(s, c.id, "buyer");
  NG.nextDay(s, () => 0.8);
  NG.nextDay(s, () => 0.8);
  const amount = s.claims[0].amount;
  NG.resolveClaim(s, s.claims[0].id, "refund");
  NG.nextDay(s, () => 0.8);
  assert.equal(s.dayReport.tradingResult, -amount);
  assert.equal(s.dayReport.cashFlow, -amount - 20);
});
console.log(count + " daily report tests passed.");
