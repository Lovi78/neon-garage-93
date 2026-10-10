window.NG = window.NG || {};
NG.totalMargin = (s) => s.profit + (s.enterprise?.profit || 0);
NG.businessValue = (s) =>
  Math.round(
    s.cash +
      s.inventory.reduce((n, c) => n + Math.round(NG.value(s, c) * 0.72), 0) -
      (s.operations?.arrears || 0) +
      (NG.enterpriseAssets?.(s) || 0) -
      (s.enterprise?.loan || 0),
  );
NG.ensureFinance = (s) => {
  if (!Array.isArray(s.financialHistory))
    s.financialHistory = [
      { day: s.day, profit: NG.totalMargin(s), value: NG.businessValue(s) },
    ];
  return s;
};
NG.snapshotFinance = (s) => {
  NG.ensureFinance(s);
  const point = {
    day: s.day,
    profit: NG.totalMargin(s),
    value: NG.businessValue(s),
  };
  const index = s.financialHistory.findIndex((p) => p.day === s.day);
  if (index >= 0) s.financialHistory[index] = point;
  else s.financialHistory.push(point);
};
NG.progressBar = (label, current, total, detail = "") => {
  const value = Math.max(0, Math.min(total, current));
  return `<div class="progress-block"><div class="progress-caption"><span>${label}</span><b>${detail || current + " / " + total}</b></div><div class="visual-progress" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${value}"><i style="width:${total > 0 ? (value / total) * 100 : 100}%"></i></div></div>`;
};
NG.repProgress = (s) => {
  const current = NG.repTier(s),
    next = NG.nextRepTier(s);
  return NG.progressBar(
    "REPUTATION",
    next ? s.reputation - current.at : 1,
    next ? next.at - current.at : 1,
    next
      ? s.reputation + " / " + next.at + " REP · " + next.name
      : "MAXIMUM TIER · " + current.name,
  );
};
NG.financeChart = (s) => {
  NG.ensureFinance(s);
  const all = s.financialHistory;
  // Preserve the first/last points and daily extremes when the timeline is long.
  let points = all;
  if (all.length > 240) {
    const stride = Math.ceil(all.length / 100);
    points = [];
    for (let i = 0; i < all.length; i += stride) {
      const bucket = all.slice(i, i + stride),
        candidates = [
          bucket[0],
          bucket.at(-1),
          ...["profit", "value"].flatMap((key) => [
            bucket.reduce((a, b) => (a[key] < b[key] ? a : b)),
            bucket.reduce((a, b) => (a[key] > b[key] ? a : b)),
          ]),
        ];
      points.push(...[...new Set(candidates)].sort((a, b) => a.day - b.day));
    }
  }
  const W = 780,
    H = 300,
    L = 78,
    R = 22,
    T = 25,
    B = 55,
    start = points[0].day,
    end = points.at(-1).day;
  const values = points.flatMap((p) => [p.profit, p.value]),
    low = Math.min(0, ...values),
    high = Math.max(100, ...values),
    padding = (high - low) * 0.08,
    min = low - padding,
    max = high + padding;
  const x = (day) =>
      L + (end > start ? (day - start) / (end - start) : 0.5) * (W - L - R),
    y = (value) => T + ((max - value) / (max - min)) * (H - T - B);
  const ticks = Array.from(
    { length: 5 },
    (_, i) => min + ((max - min) * i) / 4,
  );
  const line = (key) =>
    points
      .map(
        (p, i) =>
          (i ? "L" : "M") + x(p.day).toFixed(2) + "," + y(p[key]).toFixed(2),
      )
      .join(" ");
  return `<section class="finance-chart"><div class="section-heading"><h2>Business over time</h2><span class="chart-legend"><i class="profit-key"></i>Deal margin <i class="value-key"></i>Business value</span></div><svg viewBox="0 0 ${W} ${H}" class="history-chart" role="img" aria-label="Daily deal margin and business value in dollars"><title>Deal margin and business value. History starts ${NG.date(start)}.</title>${ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="chart-grid"/><text x="${L - 12}" y="${y(v) + 4}" text-anchor="end" class="chart-axis">${v < 0 ? "-" : ""}${NG.money(Math.abs(v))}</text>`).join("")}<path d="${line("value")}" class="chart-line value-line"/><path d="${line("profit")}" class="chart-line profit-line"/>${points.map((p) => `<g class="chart-point" tabindex="0" aria-label="${NG.date(p.day)}: deal margin ${p.profit} dollars; business value ${p.value} dollars"><title>${NG.date(p.day)}\nDeal margin: ${p.profit < 0 ? "-" : ""}${NG.money(Math.abs(p.profit))}\nBusiness value: ${NG.money(p.value)}</title><line x1="${x(p.day)}" x2="${x(p.day)}" y1="${T}" y2="${H - B}" class="chart-hover"/><circle cx="${x(p.day)}" cy="${y(p.value)}" r="3" class="value-dot"/><circle cx="${x(p.day)}" cy="${y(p.profit)}" r="3" class="profit-dot"/></g>`).join("")}${[...new Set([start, Math.round((start + end) / 2), end])].map((d) => `<text x="${x(d)}" y="${H - 20}" text-anchor="middle" class="chart-axis">${NG.date(d)}</text>`).join("")}</svg><p class="fine-print">${points.length === 1 ? "One recorded day so far. Advance to the next day to build your timeline. " : ""}Daily snapshots since ${NG.date(start)}; today updates after each action. Business value = cash + inventory dealer prices + major facility liquidation values + committed work/allocations at cost - credit principal - overdue bills. Starter upgrades are expensed; goodwill is not included. Committed capital can lose value. Deal margin includes car sales, service and wholesale results, and customer repair contributions; it excludes fixed costs, interest and capital investment losses. The cash flow panel shows actual liquidity changes. Hover or focus a point for exact figures.</p></section>`;
};
