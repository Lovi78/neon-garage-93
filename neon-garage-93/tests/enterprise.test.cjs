const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
global.window = global;
const store = new Map();
global.localStorage = {
  getItem: (k) => store.get(k) || null,
  setItem: (k, v) => store.set(k, v),
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
const test = (n, f) => {
  f();
  count++;
  console.log("PASS " + n);
};
const fixture = () => {
  const s = NG.newState();
  s.cash = 200000;
  s.reputation = 50;
  return s;
};
function open(s, id) {
  NG.startEnterprise(s, id);
  while (s.enterprise.projects[id].status === "building")
    NG.nextDay(s, () => 0.9);
}
test("Construction charges once, delays benefits and starts wages only after opening", () => {
  const s = fixture(),
    cash = s.cash;
  NG.startEnterprise(s, "service");
  assert.equal(s.cash, cash - 24000);
  assert.equal(NG.workshopCapacity(s), 1);
  assert.equal(NG.operatingBill(s), 20);
  assert.throws(() => NG.startEnterprise(s, "service"));
  for (let i = 0; i < 6; i++) NG.nextDay(s, () => 0.9);
  assert.equal(s.cash, cash - 24000 - 120);
  assert.equal(NG.workshopCapacity(s), 2);
  assert.equal(NG.operatingBill(s), 200);
  NG.nextDay(s, () => 0.9);
  assert.equal(s.cash, cash - 24000 - 320);
});
test("Weekly bills and runway include committed construction openings", () => {
  const s = fixture();
  NG.startEnterprise(s, "service");
  assert.equal(NG.sevenDayCosts(s), 7 * 20 + 180);
  s.cash = 300;
  assert.equal(NG.cashRunway(s), 6);
  s.operations.arrears = 100;
  assert.equal(NG.sevenDayCosts(s), 420);
  assert.equal(NG.cashRunway(s), 6);
});
test("Expansion prerequisites and one construction slot reject before charging", () => {
  const s = fixture();
  assert.throws(() => NG.startEnterprise(s, "fleet"));
  s.reputation = 0;
  assert.throws(() => NG.startEnterprise(s, "service"));
  s.reputation = 50;
  s.cash = 100;
  assert.throws(() => NG.startEnterprise(s, "service"));
  s.cash = 200000;
  NG.startEnterprise(s, "service");
  const cash = s.cash;
  assert.throws(() => NG.startEnterprise(s, "wholesale"));
  assert.equal(s.cash, cash);
});
test("Cancellation and liquidation recover only published fractions and never manufacture value", () => {
  const s = fixture(),
    start = NG.businessValue(s);
  NG.startEnterprise(s, "service");
  assert.equal(NG.businessValue(s), start - 12000);
  NG.manageEnterprise(s, "service", "sell");
  assert.equal(s.cash, 188000);
  open(s, "service");
  const cash = s.cash;
  NG.manageEnterprise(s, "service", "sell");
  assert.equal(s.cash, cash + 9600);
  assert(!s.enterprise.projects.service);
});
test("Client work advances parts, occupies shared slots and pays once after completion", () => {
  const s = fixture();
  open(s, "service");
  const j = s.enterprise.orders.find((j) => j.status === "offered"),
    cash = s.cash,
    net = NG.businessValue(s);
  NG.takeServiceOrder(s, j.id);
  assert.equal(s.cash, cash - j.cost);
  assert.equal(NG.businessValue(s), net);
  assert.equal(NG.workshopBusy(s), 1);
  assert.throws(() => NG.takeServiceOrder(s, j.id));
  while (s.day < j.readyDay) NG.nextDay(s, () => 0.9);
  assert.equal(j.status, "completed");
  assert.equal(s.enterprise.profit, j.revenue - j.cost);
  assert.equal(
    s.ledger.filter(
      (l) => l.amount === j.revenue && l.description.includes("completed work"),
    ).length,
    1,
  );
  NG.nextDay(s, () => 0.9);
  assert.equal(s.enterprise.profit, j.revenue - j.cost);
});
test("External orders genuinely contend with stock repairs and prevent facility shutdown", () => {
  const s = fixture();
  open(s, "service");
  const j = s.enterprise.orders.find((j) => j.status === "offered");
  NG.takeServiceOrder(s, j.id);
  const c = s.market[0];
  NG.buy(s, c.id);
  c.flaws = [];
  c.parts.body = 50;
  NG.repair(s, c.id, "body");
  assert.equal(NG.workshopBusy(s), 2);
  assert.throws(() => NG.manageEnterprise(s, "service", "pause"));
  const second = s.market[1];
  NG.buy(s, second.id);
  second.flaws = [];
  second.parts.body = 50;
  assert.throws(() => NG.repair(s, second.id, "body"), /occupied/);
});
test("Fleet development changes capacity, adds meaningful daily cost and unlocks bigger contracts", () => {
  const s = fixture();
  open(s, "service");
  open(s, "fleet");
  assert.equal(NG.workshopCapacity(s), 3);
  assert.equal(NG.operatingBill(s), 520);
  assert.throws(() => NG.manageEnterprise(s, "service", "sell"));
  for (const j of s.enterprise.orders)
    if (j.status === "offered") NG.declineServiceOrder(s, j.id);
  s.enterprise.nextOrderDay = s.day;
  NG.enterpriseDay(s, () => 0);
  assert.equal(s.enterprise.orders.at(-1).tier, 2);
  assert(s.enterprise.orders.at(-1).cost >= 6000);
});
test("Pause retains 25% fixed cost, removes benefits and reopening restores both", () => {
  const s = fixture();
  open(s, "wholesale");
  assert.equal(NG.operatingBill(s), 270);
  NG.manageEnterprise(s, "wholesale", "pause");
  assert.equal(NG.operatingBill(s), 83);
  assert.throws(() => NG.startWholesale(s, "japan", 25000));
  NG.manageEnterprise(s, "wholesale", "resume");
  assert.equal(NG.operatingBill(s), 270);
});
test("Wholesale locks capital for five days; downside is real and reloading preserves execution risk", () => {
  const s = fixture();
  open(s, "wholesale");
  s.demand.japan = 1.3;
  const cash = s.cash,
    net = NG.businessValue(s);
  NG.startWholesale(s, "japan", 50000, () => 0);
  const l = s.enterprise.lots[0];
  assert.equal(s.cash, cash - 50000);
  assert.equal(NG.businessValue(s), net);
  assert.throws(() => NG.manageEnterprise(s, "wholesale", "pause"));
  NG.save(s);
  assert.equal(NG.load().enterprise.lots[0].execution, l.execution);
  s.day = l.readyDay;
  s.demand.japan = 0.7;
  NG.enterpriseDay(s, () => 0.9);
  assert.equal(l.revenue, 30000);
  assert.equal(s.enterprise.profit, -20000);
  assert.equal(s.cash, cash - 20000);
  NG.enterpriseDay(s, () => 0.9);
  assert.equal(s.cash, cash - 20000);
});
test("Wholesale upside respects the cap; allocation limits and affordability prevent extra commitments", () => {
  const s = fixture();
  open(s, "wholesale");
  s.demand.europe = 0.7;
  NG.startWholesale(s, "europe", 25000, () => 1);
  NG.startWholesale(s, "japan", 25000, () => 0.5);
  assert.throws(() => NG.startWholesale(s, "america", 25000));
  s.day += 5;
  s.demand.europe = 1.35;
  NG.enterpriseDay(s, () => 0.9);
  assert.equal(s.enterprise.lots[0].revenue, 37500);
  s.cash = 1;
  assert.throws(() => NG.startWholesale(s, "america", 25000));
});
test("Borrowing and principal repayment are not income or net worth gains; interest is a real daily cost", () => {
  const s = fixture(),
    net = NG.businessValue(s),
    profit = NG.totalMargin(s);
  NG.enterpriseFinance(s, 10000);
  assert.equal(NG.businessValue(s), net);
  assert.equal(NG.totalMargin(s), profit);
  assert.equal(NG.operatingBill(s), 49);
  NG.nextDay(s, () => 0.9);
  assert.equal(s.operations.lastPaid, 49);
  NG.enterpriseFinance(s, -10000);
  assert.equal(s.enterprise.loan, 0);
  assert.equal(NG.operatingBill(s), 20);
  assert.throws(() => NG.enterpriseFinance(s, 60000));
  assert.throws(() => NG.enterpriseFinance(s, -1));
});
test("Empty cash creates arrears even with valuable committed capital and blocks new work", () => {
  const s = fixture();
  open(s, "service");
  s.cash = 0;
  NG.nextDay(s, () => 0.9);
  assert.equal(s.operations.arrears, 200);
  const j = s.enterprise.orders.find((j) => j.status === "offered");
  assert.throws(() => NG.takeServiceOrder(s, j.id), /bills/);
  NG.enterpriseFinance(s, 10000);
  NG.payOperatingBills(s);
  assert.equal(s.operations.arrears, 0);
});
test("Day report, finance history and operating cash flow reflect enterprise settlements without duplication", () => {
  const s = fixture();
  open(s, "wholesale");
  s.demand.japan = 1;
  NG.startWholesale(s, "japan", 25000, () => 0.5);
  const l = s.enterprise.lots[0];
  s.day = l.readyDay - 1;
  s.marketTrends.next = { segment: "japan", multiplier: 1, duration: 3 };
  const r = NG.nextDay(s, () => 0.5);
  assert(r.enterpriseNotices.some((n) => n.includes("wholesale settled")));
  NG.save(s);
  assert.equal(s.financialHistory.at(-1).profit, NG.totalMargin(s));
  assert.equal(
    NG.operatingCashFlow(s),
    s.ledger
      .filter(
        (l) => l.day > s.day - 7 && !["capital", "financing"].includes(l.type),
      )
      .reduce((n, l) => n + l.amount, 0),
  );
});
test("Legacy saves preserve cash and trades with zero retroactive expansion costs", () => {
  const s = fixture();
  delete s.enterprise;
  NG.save(s);
  const restored = NG.load();
  assert.equal(restored.cash, s.cash);
  assert.equal(restored.enterprise.loan, 0);
  assert.deepEqual(restored.enterprise.projects, {});
  assert.equal(NG.operatingBill(restored), 20);
});
console.log(count + " enterprise tests passed.");
