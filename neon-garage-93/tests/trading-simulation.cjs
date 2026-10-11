/* Strategies only consult the same public estimates available in the UI.
   Reservation prices, hidden faults and buyer budgets are never read by the bots. */
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { runtime, random, root } = require("./runtime.cjs");
const strategies = [
  "quick",
  "cautious",
  "aggressive",
  "high-price",
  "capital-heavy",
];
function simulate(strategy, seed) {
  const rng = random(seed),
    N = runtime(rng);
  let s = N.newState();
  // Replace initial supply and forecast with the seeded stream; no unseeded facts remain in play.
  s.nextId = 1;
  s.market = [];
  s.market = N.market(s, rng);
  s.marketTrends.next = N.planWave(rng);
  let attempts = 0,
    agreements = 0,
    shortage = 0,
    totalAge = 0,
    ageSamples = 0,
    purchaseCalls = 0;
  for (let day = 0; day < 200; day++) {
    for (const c of [...s.inventory]) {
      if (N.busy(s, c)) continue;
      for (const o of [...c.offers]) {
        if (o.stage === "question")
          N.answerBuyer(s, c.id, o.id, c.inspected ? "condition" : "as-is");
        if (
          strategy === "high-price" &&
          o.price < s.inventory.find((x) => x.id === c.id).listPrice * 0.9
        ) {
          try {
            N.haggleSale(
              s,
              c.id,
              o.id,
              Math.min(c.listPrice, Math.round(o.price * 1.12)),
              rng,
              "records",
            );
          } catch {}
        }
        if (
          c.offers.includes(o) &&
          (strategy !== "high-price" ||
            o.price > N.cost(c) * 1.15 ||
            s.day - c.acquiredDay > 30)
        ) {
          N.sell(s, c.id, o.id);
          break;
        }
      }
      if (!s.inventory.includes(c)) continue;
      const age = s.day - c.acquiredDay;
      if (
        age >
        (strategy === "high-price"
          ? 45
          : strategy === "capital-heavy"
            ? 30
            : 16)
      ) {
        N.sell(s, c.id, "dealer");
        continue;
      }
      if (!c.listed)
        N.list(
          s,
          c.id,
          Math.round(
            N.estimate(s, c) *
              (strategy === "high-price"
                ? 1.4
                : strategy === "capital-heavy"
                  ? 1.2
                  : 1.03),
          ),
          c.inspected ? "honest" : "as-is",
        );
    }
    if (s.operations.arrears && s.cash) N.payOperatingBills(s);
    if (!s.operations.arrears && s.inventory.length < s.capacity) {
      const candidates = s.market.filter(
        (c) => c.ask + 50 < s.cash - (strategy === "capital-heavy" ? 0 : 350),
      );
      candidates.sort(
        (a, b) => N.estimate(s, b) - b.ask - (N.estimate(s, a) - a.ask),
      );
      const c = candidates[0];
      if (c) {
        purchaseCalls++;
        try {
          if (strategy === "cautious" && !c.inspected) {
            N.inspect(s, c.id);
            if (s.cash > c.ask + 250) N.checkHistory(s, c.id);
          }
          const estimate = N.estimate(s, c),
            required = strategy === "cautious" ? 1.1 : 1.01;
          if (estimate > c.ask * required || strategy === "capital-heavy") {
            if (c.negotiation?.status === "callback") N.resumeDeal(s, c.id);
            if (!c.negotiation?.closed && c.negotiation?.status !== "waiting") {
              attempts++;
              const bid = Math.round(
                c.ask *
                  (strategy === "aggressive"
                    ? 0.72
                    : strategy === "cautious"
                      ? 0.86
                      : 0.93),
              );
              N.hagglePurchase(
                s,
                c.id,
                bid,
                rng,
                strategy === "cautious" && N.evidence(c) > 0 ? "fault" : "cash",
              );
            }
            const quote = N.purchaseQuote(c);
            if (
              !c.negotiation?.walked &&
              !["waiting", "callback"].includes(c.negotiation?.status) &&
              quote + 50 <= s.cash
            ) {
              N.buy(s, c.id);
              agreements++;
            }
          }
        } catch (e) {
          if (
            !/offer|Wait|cash|Raise|seller|conversation|price/.test(e.message)
          )
            throw e;
        }
      }
    }
    if (s.cash < 100 || s.operations.arrears) shortage++;
    for (const c of s.market) {
      totalAge += s.day - c.listing.createdDay;
      ageSamples++;
    }
    N.nextDay(s, rng);
    assert(Number.isFinite(s.cash) && s.cash >= 0);
    assert.equal(s.cash, 5000 + s.ledger.reduce((n, l) => n + l.amount, 0));
    if (day % 25 === 0) {
      N.save(s);
      const loaded = N.load();
      assert.equal(JSON.stringify(loaded), JSON.stringify(s));
      s = loaded;
    }
  }
  const sales = s.sales;
  return {
    strategy,
    seed,
    days: 200,
    sales: sales.length,
    averageDaysToSale: sales.length
      ? +(sales.reduce((n, x) => n + x.daysInStock, 0) / sales.length).toFixed(
          2,
        )
      : 0,
    dealSuccessRate: purchaseCalls
      ? +(sales.length / purchaseCalls).toFixed(3)
      : 0,
    profitable: sales.filter((x) => x.profit > 0).length,
    losses: sales.filter((x) => x.profit < 0).length,
    averageContribution: sales.length
      ? Math.round(sales.reduce((n, x) => n + x.profit, 0) / sales.length)
      : 0,
    cashShortageDays: shortage,
    averageListingAge: ageSamples ? +(totalAge / ageSamples).toFixed(2) : 0,
    negotiationAttempts: attempts,
    negotiationSuccessRate: attempts ? +(agreements / attempts).toFixed(3) : 0,
    cash: s.cash,
    netWorth: N.businessValue(s),
    realizedContribution: s.profit,
  };
}
const runs = strategies.flatMap((strategy) =>
  [93, 1993, 12, 42, 1234].map((seed) => simulate(strategy, seed)),
);
assert.deepEqual(simulate("quick", 93), runs[0], "same seed is reproducible");
assert(runs.some((r) => r.losses > 0));
assert(runs.some((r) => r.profitable > 0));
for (const strategy of ["quick", "aggressive"])
  assert(
    runs.some(
      (r) =>
        r.strategy === strategy &&
        runs.some(
          (other) =>
            other.seed === r.seed &&
            other.strategy !== strategy &&
            other.netWorth > r.netWorth,
        ),
    ),
    strategy + " must not dominate every tested situation",
  );
const summary = strategies.map((strategy) => {
  const rs = runs.filter((r) => r.strategy === strategy);
  const avg = (k) => +(rs.reduce((n, r) => n + r[k], 0) / rs.length).toFixed(2);
  return {
    strategy,
    sales: avg("sales"),
    daysToSale: avg("averageDaysToSale"),
    profitable: avg("profitable"),
    losses: avg("losses"),
    contribution: avg("averageContribution"),
    shortageDays: avg("cashShortageDays"),
    listingAge: avg("averageListingAge"),
    negotiationSuccess: avg("negotiationSuccessRate"),
    netWorth: avg("netWorth"),
  };
});
console.table(summary);
const report = {
  duration: 200,
  seeds: [93, 1993, 12, 42, 1234],
  summary,
  runs,
  limitations:
    "Fictional prices; five basic policies, no repairs except inspections, no enterprise investment. Bots use public information only. These runs compare behavior, not historical realism or final balance.",
};
fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/trading-simulation.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  "PASS 25 seeded 200-day runs, cash reconciliation each day, persistence and reproducibility.",
);
