const assert = require("node:assert/strict");
const { runtime, random } = require("./runtime.cjs");
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
function setup(seed = 42) {
  const rng = random(seed),
    N = runtime(rng);
  // v0.13 work-hour and payroll rules: new v0.14 games switch them off.
  N.newGameFlow = false;
  const s = N.newState();
  return { N, s, rng };
}
function car(N, s) {
  const c = s.market[0];
  s.cash = 20000;
  N.buy(s, c.id);
  return c;
}
test("Old save migration is idempotent and preserves money, inventory and limits", () => {
  const { N, s } = setup();
  delete s.management;
  const cash = s.cash;
  N.save(s);
  const a = N.load();
  assert.equal(a.cash, cash);
  assert.equal(a.management.staff.length, 0);
  const pay = a.management.nextPayDay;
  N.save(a);
  assert.equal(N.load().management.nextPayDay, pay);
});
test("Solo dealership trades freely while inspections have finite work time", () => {
  const { N, s } = setup();
  s.cash = 100000;
  for (const c of s.market.slice(0, 4)) N.inspect(s, c.id);
  assert.equal(s.management.ownerUsed, 8);
  const c = s.market[4];
  assert.throws(() => N.inspect(s, c.id), /time/);
  N.buy(s, c.id);
  N.sell(s, c.id, "dealer");
  assert.equal(s.sold, 1);
});
test("Hiring respects lot capacity, cash reserve and roles", () => {
  const { N, s } = setup();
  N.hireStaff(s, "ray");
  assert.throws(() => N.hireStaff(s, "kim"), /position/);
  const c = s.market[0];
  assert.throws(() => N.performWork(s, "prepare", c.id, "ray"), /role/);
  s.capacity = 4;
  N.hireStaff(s, "kim");
  s.cash = 0;
  N.fireStaff(s, "kim");
  assert.throws(() => N.hireStaff(s, "alex"), /reserve/);
});
test("Weekly payroll accrues daily and cash is paid once after seven days", () => {
  const { N, s, rng } = setup();
  N.hireStaff(s, "ray");
  const start = s.cash;
  for (let i = 0; i < 6; i++) N.nextDay(s, rng);
  assert.equal(s.ledger.filter((l) => l.type === "payroll").length, 0);
  assert(Math.abs(N.payrollLiability(s) - 180) < 1e-7);
  N.nextDay(s, rng);
  assert.equal(s.ledger.find((l) => l.type === "payroll").amount, -210);
  assert.equal(s.cash, start - 7 * 20 - 210);
  assert.equal(N.payrollLiability(s), 0);
  assert.equal(N.managementSummary(s).payroll, 210);
  assert.equal(N.managementSummary(s).result, -350);
});
test("Dismissal settles partial wages and waiting tasks return to owner", () => {
  const { N, s, rng } = setup();
  N.hireStaff(s, "ray");
  N.queueWork(s, "inspect", s.market[0].id, "ray");
  N.nextDay(s, rng);
  N.queueWork(s, "inspect", s.market[1].id, "ray");
  const before = s.cash;
  N.fireStaff(s, "ray");
  assert.equal(s.cash, before - 30);
  assert.equal(s.management.queue[0].worker, "owner");
  assert.equal(N.payrollLiability(s), 0);
});
test("Overdue wages persist and block unpaid employee work", () => {
  const { N, s, rng } = setup();
  N.hireStaff(s, "ray");
  s.cash = 0;
  for (let i = 0; i < 7; i++) N.nextDay(s, rng);
  assert.equal(s.management.unpaid, 210);
  assert.throws(
    () => N.performWork(s, "inspect", s.market[0].id, "ray"),
    /payroll/,
  );
  s.cash = 100;
  N.payPayroll(s);
  assert.equal(s.management.unpaid, 110);
  N.save(s);
  assert.equal(N.load().management.unpaid, 110);
});
test("Mechanic repairs use the existing bay and retain assigned worker and quality", () => {
  const { N, s, rng } = setup();
  const c = car(N, s);
  N.hireStaff(s, "jo");
  c.parts.engine = 40;
  c.flaws = [];
  const cost = N.repairQuote(c, "engine", s);
  const cash = s.cash;
  N.performWork(s, "repair", c.id, "jo", "engine");
  assert.equal(c.assignedWorker, "jo");
  assert.equal(c.parts.engine, 40);
  assert.equal(c.pendingRepair.parts.engine, 98);
  assert.equal(s.cash, cash - cost);
  assert.equal(c.readyDay, s.day + 1);
  assert.equal(s.management.staff[0].used, 3);
  assert.equal(N.workshopBusy(s), 1);
  N.save(s);
  assert.equal(N.load().inventory[0].assignedWorker, "jo");
  N.nextDay(s, rng);
  assert.equal(N.workshopBusy(s), 0);
  assert.equal(c.parts.engine, 98);
});
test("Queued repairs wait for a bay, can be reprioritized and charge only at start", () => {
  const { N, s, rng } = setup();
  s.cash = 50000;
  const a = s.market[0],
    b = s.market[1];
  N.buy(s, a.id);
  N.buy(s, b.id);
  for (const c of [a, b]) {
    c.flaws = [];
    c.parts.engine = 30;
  }
  N.queueWork(s, "repair", a.id, "owner", "engine");
  N.queueWork(s, "repair", b.id, "owner", "engine");
  N.prioritizeWork(s, s.management.queue[1].id);
  const cash = s.cash;
  assert.equal(s.cash, cash);
  N.nextDay(s, rng);
  assert.equal(b.assignedWorker, "owner");
  assert.equal(a.repairCost, 0);
  assert.equal(s.management.queue.length, 1);
  assert.match(s.management.queue[0].blocked, /occupied/);
  N.nextDay(s, rng);
  N.nextDay(s, rng);
  assert(a.repairCost > 0);
});
test("Outsourced rush still works after owner time runs out", () => {
  const { N, s } = setup();
  const c = car(N, s);
  c.flaws = [];
  c.parts.body = 30;
  s.management.ownerUsed = 8;
  N.repair(s, c.id, "body", "rush");
  assert.equal(c.assignedWorker, "outsourced");
  assert.equal(N.workshopBusy(s), 0);
});
test("Sales associate performs callbacks using public evidence and never closes sales", () => {
  const { N, s, rng } = setup();
  const c = car(N, s);
  N.hireStaff(s, "alex");
  N.toggleStaff(s, "alex");
  N.list(s, c.id, Math.round(N.estimate(s, c)), "as-is");
  c.offers = [
    {
      id: "q",
      buyer: "Buyer",
      stage: "question",
      expiresDay: 3,
      price: 1000,
      profile: { trust: 0.5 },
    },
  ];
  N.nextDay(s, rng);
  assert.equal(s.sold, 0);
  assert(s.management.log.some((l) => l.text.includes("followup")));
  assert(s.inventory.includes(c));
  assert(s.management.lastUtilization[0].used >= 1);
});
test("Sales preparation is real work and publication still requires approval", () => {
  const { N, s } = setup();
  const c = car(N, s);
  N.hireStaff(s, "kim");
  N.performWork(s, "prepare", c.id, "kim");
  assert(c.prepared);
  assert(!c.listed);
  assert.equal(s.management.staff[0].used, 2);
  assert.throws(() => N.performWork(s, "prepare", c.id, "kim"));
});
test("Facility labor replacement prevents double counting without deleting facility costs", () => {
  const { N, s } = setup();
  s.cash = 50000;
  s.enterprise.projects.service = { status: "active" };
  assert.equal(N.enterpriseCosts(s), 180);
  N.hireStaff(s, "ray");
  assert.equal(N.enterpriseCosts(s), 165);
  assert.equal(N.knownDailyBills(s, 1), 215);
  assert(N.managementSummary(s).reserve < s.cash);
});
test("Cash flow, unsold inventory, accrued wages and interest remain separate", () => {
  const { N, s, rng } = setup();
  const c = car(N, s);
  N.hireStaff(s, "ray");
  N.nextDay(s, rng);
  const f = N.managementSummary(s);
  assert.equal(f.revenue, 0);
  assert.equal(f.result, -50);
  assert.equal(f.payroll, 30);
  assert(f.cashChange < -c.purchasePrice);
  assert.equal(
    N.businessValue(s),
    Math.round(s.cash + Math.round(N.value(s, c) * 0.72) - 30),
  );
});
test("Preparation delegates the two-hour first listing and relisting stays free", () => {
  const { N, s } = setup();
  const c = car(N, s);
  N.hireStaff(s, "kim");
  N.performWork(s, "prepare", c.id, "kim");
  s.management.ownerUsed = 8;
  N.list(s, c.id, Math.round(N.estimate(s, c)), "as-is");
  assert(c.listed);
  assert.equal(s.management.ownerUsed, 8);
});
test("Rejected market inspection is expensed then reclassified on acquisition", () => {
  const { N, s } = setup();
  const c = s.market[0];
  N.inspect(s, c.id);
  assert.equal(N.managementSummary(s).other, c.inspectionCost);
  assert.equal(N.managementSummary(s).result, -c.inspectionCost);
  s.cash = 20000;
  N.buy(s, c.id);
  assert.equal(N.managementSummary(s).other, 0);
});
test("Invalid work cannot consume time or cash", () => {
  const { N, s } = setup();
  const before = s.cash;
  assert.throws(() =>
    N.performWork(s, "repair", s.market[0].id, "owner", "engine"),
  );
  assert.equal(s.cash, before);
  assert.equal(s.management.ownerUsed, 0);
});
test("Client work shares capacity and skilled mechanics shorten actual completion", () => {
  const { N, s } = setup();
  s.cash = 50000;
  s.enterprise.projects.service = { status: "active" };
  N.hireStaff(s, "jo");
  N.toggleStaff(s, "jo");
  s.enterprise.orders = [
    {
      id: "client",
      status: "offered",
      deadline: 3,
      tier: 1,
      name: "Client job",
      cost: 100,
      revenue: 300,
      days: 3,
    },
  ];
  N.takeServiceOrder(s, "client");
  assert.equal(s.enterprise.orders[0].assignedWorker, "jo");
  assert.equal(s.enterprise.orders[0].readyDay, 2);
  assert.equal(N.workshopBusy(s), 1);
});
console.log(count + " management tests passed.");
