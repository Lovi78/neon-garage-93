const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { runtime, random, root } = require("./runtime.cjs");
const results = [];
for (let seed = 1; seed <= 120; seed++) {
  const rng = random(seed * 7919),
    N = runtime(rng),
    s = N.newState();
  s.cash = 3000 + (seed % 12) * 1000;
  s.reputation = 12;
  const spec = N.generateRequest(s, rng),
    q = {
      id: "audit-" + seed,
      kind: "custom",
      spec,
      status: "offered",
      day: s.day,
      offerUntil: 2,
    };
  s.opportunities.requests = [q];
  const start = s.cash - s.ledger.reduce((n, l) => n + l.amount, 0),
    reconcile = () =>
      assert.equal(s.cash, start + s.ledger.reduce((n, l) => n + l.amount, 0));
  N.chooseRequest(s, q.id, true);
  reconcile();
  if (q.waitingSupply) {
    for (let i = 0; i < 3 && q.waitingSupply && q.status === "active"; i++) {
      N.nextDay(s, rng);
      reconcile();
    }
    if (q.status === "unavailable") {
      assert(s.reputation >= 12);
      results.push({ seed, tier: spec.tier, status: q.status, days: s.day });
      continue;
    }
    assert(q.supply);
  }
  const c =
    s.market.find((c) => c.id === q.supply.carId) ||
    s.inventory.find((c) => c.id === q.supply.carId);
  assert(c);
  assert(N.requestSupplyFits(s, q, c));
  assert(N.requestPreparation(s, q, c).affordable);
  if (!s.inventory.includes(c)) N.buy(s, c.id);
  if (!c.inspected) N.inspect(s, c.id);
  if ((spec.records || spec.noAccident) && !c.vehicleHistory.historyChecked)
    N.checkHistory(s, c.id);
  const plan = N.requestPreparation(s, q, c);
  if (plan.package !== "none") N.repairPackage(s, c.id, plan.package);
  reconcile();
  while (N.busy(s, c)) {
    N.nextDay(s, rng);
    reconcile();
  }
  N.deliverRequest(s, q.id, c.id);
  if (q.status === "active") {
    N.repairPackage(s, c.id, "quick");
    while (N.busy(s, c)) {
      N.nextDay(s, rng);
      reconcile();
    }
    N.deliverRequest(s, q.id, c.id);
  }
  assert.equal(q.status, "fulfilled", "seed " + seed + " " + spec.title);
  assert(s.day <= q.deadline);
  reconcile();
  N.save(s);
  assert.equal(N.load().cash, s.cash);
  results.push({
    seed,
    tier: spec.tier,
    status: q.status,
    days: s.day,
    profit: s.sales[0].profit,
  });
}
const summary = {
  simulatedDays: results.reduce((n, r) => n + (r.days || 0), 0),
  runs: results.length,
  fulfilled: results.filter((r) => r.status === "fulfilled").length,
  unavailableWithoutPenalty: results.filter((r) => r.status === "unavailable")
    .length,
  profitable: results.filter((r) => r.profit > 0).length,
};
fs.writeFileSync(
  path.join(root, "reports/v0142-request-supply-simulation.json"),
  JSON.stringify({ summary, results }, null, 2) + "\n",
);
console.log(summary);
console.log(
  "PASS 120 seeded request-supply scenarios: feasible delivery or neutral closure, daily cash reconciliation and save readback.",
);
