/* Repair strategies on the real engine. One acquisition/selling policy (the
   "cautious" bot); the only difference between runs is what the workshop does.
   Bots use public information only: revealed faults, observed condition, quotes.
   Works on engines with or without repair packages, so before/after numbers
   come from the same script. */
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { runtime, random, root } = require("./runtime.cjs");
// Balance experiments only: SIM_TWEAK=path/to/module.cjs exporting (NG) => void.
const tweak = process.env.SIM_TWEAK
  ? require(path.resolve(process.env.SIM_TWEAK))
  : null;

const STRATEGIES = process.env.SIM_ONLY
  ? process.env.SIM_ONLY.split(",")
  : ["never", "quick", "driver", "full", "smart"];
// 20 seeds: single runs vary by 2-3x, five seeds are not enough to compare policies.
const SEEDS = [
  93, 1993, 12, 42, 1234, 7, 77, 777, 5, 55, 555, 8, 88, 888, 3, 33, 333, 9, 99,
  999,
];
const DAYS = Number(process.env.SIM_DAYS || 100);

// Target part levels per strategy. Packages are applied as one booking when the
// engine has them; otherwise the same targets are reached with per-part repairs.
const TARGET = { quick: 0, driver: 75, full: 95 };

function partsToDo(c, target) {
  return Object.keys(c.parts).filter(
    (p) =>
      c.parts[p] < target ||
      c.flaws.some((f) => f.part === p && f.revealed && !f.fixed),
  );
}

function legacyQuote(N, s, c, target) {
  const todo = partsToDo(c, target);
  const clone = JSON.parse(JSON.stringify(c));
  for (const p of todo) {
    clone.parts[p] = Math.max(clone.parts[p], 95);
    clone.flaws
      .filter((f) => f.part === p && f.revealed)
      .forEach((f) => (f.fixed = true));
  }
  const cost = todo.reduce((n, p) => n + N.repairQuote(c, p, s), 0);
  return { cost, gain: N.estimate(s, clone) - N.estimate(s, c), todo };
}

// Returns true when the car still needs workshop time.
function workshop(N, s, c, strategy, stats) {
  if (strategy === "never") return false;
  if (N.repairPackage) {
    if (c.simPackageDone) return false;
    let id = strategy;
    if (strategy === "smart") {
      const options = N.repairPackages
        .map((p) => ({ id: p.id, q: N.packageQuote(s, c, p.id) }))
        .filter((o) => o.q.available && o.q.profitChange > 0)
        .sort((a, b) => b.q.profitChange - a.q.profitChange);
      if (!options.length) {
        c.simPackageDone = true;
        return false;
      }
      id = options[0].id;
    }
    const q = N.packageQuote(s, c, id);
    if (!q.available || s.cash < q.cost + 300) {
      c.simPackageDone = true;
      return false;
    }
    try {
      N.repairPackage(s, c.id, id);
      c.simPackageDone = true;
      stats.packages[id] = (stats.packages[id] || 0) + 1;
      stats.repairSpend += c.repairCost;
      return N.busy(s, c);
    } catch (e) {
      stats.deferrals++;
      return true; // bay or owner time busy today; try again tomorrow
    }
  }
  // v0.13 engine: emulate the package with one part per booking.
  if (c.simPlan == null) {
    let target = TARGET[strategy];
    if (strategy === "smart") {
      const best = ["quick", "driver", "full"]
        .map((k) => ({ k, q: legacyQuote(N, s, c, TARGET[k]) }))
        .filter((o) => o.q.todo.length && o.q.gain - o.q.cost > 0)
        .sort((a, b) => b.q.gain - b.q.cost - (a.q.gain - a.q.cost))[0];
      target = best ? TARGET[best.k] : -1;
    }
    c.simPlan = target;
  }
  if (c.simPlan < 0) return false;
  const todo = partsToDo(c, c.simPlan);
  if (!todo.length) return false;
  try {
    const before = c.repairCost;
    const msg = N.repair(s, c.id, todo[0]);
    if (c.repairCost === before && /found another issue/.test(msg || ""))
      N.repair(s, c.id, todo[0]);
    stats.repairSpend += c.repairCost - before;
  } catch (e) {
    if (/enough cash/.test(e.message)) {
      c.simPlan = -1;
      return false;
    }
    stats.deferrals++;
  }
  return true;
}

function simulate(strategy, seed) {
  const rng = random(seed),
    N = runtime(rng);
  tweak?.(N);
  let s = N.newState();
  s.nextId = 1;
  s.market = N.market(s, rng);
  s.marketTrends.next = N.planWave(rng);
  const stats = { packages: {}, repairSpend: 0, deferrals: 0 };
  for (let day = 0; day < DAYS; day++) {
    if (s.operations.arrears && s.cash) N.payOperatingBills(s);
    for (const c of [...s.inventory]) {
      if (N.busy(s, c)) continue;
      for (const o of [...c.offers]) {
        try {
          if (o.stage === "question")
            N.answerBuyer(s, c.id, o.id, c.inspected ? "condition" : "as-is");
          if (c.offers.includes(o) && o.stage !== "question") {
            N.sell(s, c.id, o.id);
            break;
          }
        } catch {}
      }
      if (!s.inventory.includes(c)) continue;
      if (c.listed && s.day - c.listedDay > 14) {
        N.sell(s, c.id, "dealer");
        continue;
      }
      if (!c.listed) {
        if (workshop(N, s, c, strategy, stats)) continue;
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
    if (!s.operations.arrears && s.inventory.length < s.capacity) {
      const candidates = s.market
        .filter((c) => c.ask + 50 < s.cash - 350)
        .sort((a, b) => N.estimate(s, b) - b.ask - (N.estimate(s, a) - a.ask));
      const c = candidates[0];
      if (c)
        try {
          if (!c.inspected) {
            N.inspect(s, c.id);
            if (s.cash > c.ask + 250) N.checkHistory(s, c.id);
          }
          if (N.estimate(s, c) > c.ask * 1.1) {
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
              N.purchaseQuote(c) + 50 <= s.cash
            )
              N.buy(s, c.id);
          }
        } catch {}
    }
    N.nextDay(s, rng);
    assert(Number.isFinite(s.cash) && s.cash >= 0);
    assert.equal(s.cash, 5000 + s.ledger.reduce((n, l) => n + l.amount, 0));
  }
  const sales = s.sales;
  return {
    strategy,
    seed,
    days: DAYS,
    sales: sales.length,
    profitable: sales.filter((x) => x.profit > 0).length,
    avgContribution: sales.length
      ? Math.round(sales.reduce((n, x) => n + x.profit, 0) / sales.length)
      : 0,
    repairSpend: Math.round(stats.repairSpend),
    packages: stats.packages,
    netWorth: N.businessValue(s),
  };
}

const runs = STRATEGIES.flatMap((st) =>
  SEEDS.map((seed) => simulate(st, seed)),
);
if (STRATEGIES.includes("driver"))
  assert.deepEqual(
    simulate("driver", 93),
    runs.find((r) => r.strategy === "driver" && r.seed === 93),
  );
const avg = (rs, k) => Math.round(rs.reduce((n, r) => n + r[k], 0) / rs.length);
const summary = STRATEGIES.map((strategy) => {
  const rs = runs.filter((r) => r.strategy === strategy);
  return {
    strategy,
    sales: +(rs.reduce((n, r) => n + r.sales, 0) / rs.length).toFixed(1),
    profitable: +(rs.reduce((n, r) => n + r.profitable, 0) / rs.length).toFixed(
      1,
    ),
    avgContribution: avg(rs, "avgContribution"),
    repairSpend: avg(rs, "repairSpend"),
    netWorth: avg(rs, "netWorth"),
    minNetWorth: Math.min(...rs.map((r) => r.netWorth)),
    maxNetWorth: Math.max(...rs.map((r) => r.netWorth)),
  };
});
console.table(summary);
const winners = SEEDS.map(
  (seed) =>
    runs
      .filter((r) => r.seed === seed)
      .sort((a, b) => b.netWorth - a.netWorth)[0].strategy,
);
console.log("best strategy per seed:", winners.join(", "));
const out = process.env.SIM_OUT || "reports/repair-simulation.json"; // latest run; before/after snapshots are kept separately
fs.writeFileSync(
  path.resolve(root, out),
  JSON.stringify(
    { days: DAYS, seeds: SEEDS, summary, winners, runs },
    null,
    2,
  ) + "\n",
);
// Balance targets from the audit (F/1) apply to engines that have packages, at 100 days.
if (runtime(random(1)).repairPackage && DAYS === 100 && !tweak) {
  const by = Object.fromEntries(summary.map((r) => [r.strategy, r]));
  const lift = by.driver.netWorth / by.never.netWorth - 1;
  assert(
    lift >= 0.1 && lift <= 0.3,
    "Driver-ready lift " + lift.toFixed(3) + " outside 10-30%",
  );
  assert(
    by.full.netWorth < by.driver.netWorth,
    "Always-full must not beat Driver-ready",
  );
  assert(new Set(winners).size > 1, "One repair strategy wins every seed");
}
console.log(
  "PASS " +
    runs.length +
    " seeded " +
    DAYS +
    "-day repair-strategy runs with daily cash reconciliation.",
);
