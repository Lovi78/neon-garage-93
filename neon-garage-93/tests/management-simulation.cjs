/* Public-information policies, seeded supply, 180 days including quiet periods. */
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { runtime, random, root } = require("./runtime.cjs");
function run(strategy, seed, scale) {
  const rng = random(seed),
    N = runtime(rng);
  // Staff economics are a v0.13 system; v0.14 new games hide it until M3.
  N.newGameFlow = false;
  const s = N.newState();
  if (scale === "growing") {
    s.cash = 35000;
    s.capacity = 6;
    s.enterprise.projects.service = { status: "active" };
  }
  if (strategy === "early-staff") {
    N.hireStaff(s, "jo");
    N.toggleStaff(s, "jo");
  }
  let failures = 0,
    shortages = 0;
  for (let day = 0; day < 180; day++) {
    if (s.management.unpaid && s.cash) N.payPayroll(s);
    if (s.operations.arrears && s.cash) N.payOperatingBills(s);
    // Same acquisition policy; the only policy difference is repair labor.
    for (const c of [...s.inventory]) {
      if (N.busy(s, c)) continue;
      for (const o of [...c.offers]) {
        try {
          if (o.stage === "question")
            N.answerBuyer(s, c.id, o.id, c.inspected ? "condition" : "as-is");
          if (o.price >= N.cost(c) * 1.02) {
            N.sell(s, c.id, o.id);
            break;
          }
        } catch {
          failures++;
        }
      }
      if (!s.inventory.includes(c)) continue;
      if (day - c.acquiredDay > 18) {
        try {
          N.sell(s, c.id, "dealer");
        } catch {}
        continue;
      }
      if (!c.listed) {
        if (!c.inspected)
          try {
            N.inspect(s, c.id);
          } catch {}
        if (!c.simRepair && c.parts.engine < 70 && s.cash > 2000) {
          try {
            N.repair(
              s,
              c.id,
              "engine",
              strategy === "outsource" ? "rush" : "standard",
            );
            if (N.busy(s, c)) c.simRepair = true;
          } catch {
            failures++;
          }
          if (N.busy(s, c)) continue;
        }
        try {
          N.list(
            s,
            c.id,
            Math.round(N.estimate(s, c) * 1.03),
            c.inspected ? "honest" : "as-is",
          );
        } catch {}
      }
    }
    // Low-volume solo operator deliberately avoids committing all spare cash.
    const quiet = scale === "starter" && day % 3 !== 0;
    if (!quiet && !s.operations.arrears && s.inventory.length < s.capacity) {
      const candidates = s.market
        .filter((c) => c.ask + 50 < s.cash - 1000)
        .sort((a, b) => N.estimate(s, b) - b.ask - (N.estimate(s, a) - a.ask));
      const c = candidates[0];
      if (c && N.estimate(s, c) > c.ask * 1.08)
        try {
          if (!c.inspected) N.inspect(s, c.id);
          if (N.estimate(s, c) > c.ask * 1.08) {
            if (c.negotiation?.status === "callback") N.resumeDeal(s, c.id);
            if (!c.negotiation?.closed && c.negotiation?.status !== "waiting")
              N.hagglePurchase(
                s,
                c.id,
                Math.round(c.ask * 0.86),
                rng,
                N.evidence(c) > 0 ? "fault" : "cash",
              );
            if (
              !c.negotiation?.walked &&
              !["waiting", "callback"].includes(c.negotiation?.status) &&
              N.purchaseQuote(c) + 50 < s.cash - 1000
            )
              N.buy(s, c.id);
          }
        } catch {
          failures++;
        }
    }
    if (scale === "growing" && day % 2 === 0) {
      const j = s.enterprise.orders.find(
        (j) => j.status === "offered" && j.revenue - j.cost > 500,
      );
      if (j && s.cash > j.cost + 1500)
        try {
          N.takeServiceOrder(s, j.id);
        } catch {}
    }
    if (s.cash < N.knownDailyBills(s, s.day + 1)) shortages++;
    N.nextDay(s, rng);
    assert(Number.isFinite(s.cash) && s.cash >= 0);
    assert.equal(
      s.cash,
      (scale === "starter" ? 5000 : 35000) +
        s.ledger.reduce((n, l) => n + l.amount, 0),
    );
    assert(Number.isFinite(N.businessValue(s)));
    assert(s.management.staff.every((w) => w.used <= N.workerHours(w)));
    if (day % 30 === 29) {
      N.save(s);
      const r = N.load();
      assert.equal(r.cash, s.cash);
      assert.equal(r.management.unpaid, s.management.unpaid);
    }
  }
  return {
    strategy,
    seed,
    scale,
    days: s.day,
    cash: s.cash,
    netWorth: N.businessValue(s),
    sales: s.sold,
    contribution: N.totalMargin(s),
    payrollPaid: -s.ledger
      .filter((l) => l.type === "payroll")
      .reduce((n, l) => n + l.amount, 0),
    wagesOwed: Math.round(N.payrollLiability(s)),
    shortages,
    capacityDeferrals: failures,
  };
}
const results = [];
for (const scale of ["starter", "growing"])
  for (const seed of [1, 7, 42, 93, 1993])
    for (const strategy of ["solo", "early-staff", "outsource"])
      results.push(run(strategy, seed, scale));
const winners = new Set();
for (const scale of ["starter", "growing"])
  for (const seed of [1, 7, 42, 93, 1993])
    winners.add(
      results
        .filter((r) => r.scale === scale && r.seed === seed)
        .sort((a, b) => b.netWorth - a.netWorth)[0].strategy,
    );
assert(winners.size > 1, "A strategy dominates every tested setting");
fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/management-simulation.json"),
  JSON.stringify({ daysPerRun: 180, runs: results.length, results }, null, 2),
);
for (const scale of ["starter", "growing"])
  for (const strategy of ["solo", "early-staff", "outsource"]) {
    const rows = results.filter(
      (x) => x.scale === scale && x.strategy === strategy,
    );
    console.log(
      scale,
      strategy,
      "average net worth",
      Math.round(rows.reduce((n, r) => n + r.netWorth, 0) / rows.length),
      "sales",
      Math.round(rows.reduce((n, r) => n + r.sales, 0) / rows.length),
    );
  }
console.log(
  "PASS 30 seeded management simulations / 5,400 trading days: finite cash, bounded employee work and save readback.",
);
