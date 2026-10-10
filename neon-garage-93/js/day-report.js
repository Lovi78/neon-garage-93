window.NG = window.NG || {};
NG.currentOffers = (s) =>
  s.inventory
    .filter((c) => c.listed && !NG.busy(s, c))
    .flatMap((c) =>
      c.offers.map((o) => ({
        carId: c.id,
        car: NG.model(c).name,
        id: o.id,
        buyer: o.buyer,
        price: o.price,
        unread: o.seen !== true,
      })),
    );
NG.dayReportBefore = (s) => ({
  day: s.day,
  cash: s.cash,
  reputation: s.reputation,
  level: s.progress.level,
  xpEarned: s.progress.log
    .filter((l) => l.day === s.day)
    .reduce((n, l) => n + l.amount, 0),
  transactions: s.ledger
    .filter((l) => l.day === s.day)
    .map((l) => ({ description: l.description, amount: l.amount })),
  cashFlow: s.ledger
    .filter((l) => l.day === s.day)
    .reduce((n, l) => n + l.amount, 0),
  tradingResult:
    s.sales
      .filter((t) => t.day === s.day)
      .reduce((n, t) => n + t.price - t.cost, 0) +
    s.ledger
      .filter((l) => l.day === s.day && l.type === "refund")
      .reduce((n, l) => n + l.amount, 0),
  completedCandidates: s.inventory
    .filter((c) => NG.busy(s, c))
    .map((c) => ({ id: c.id, name: NG.model(c).name, readyDay: c.readyDay })),
  expiredOffers: s.inventory.reduce((n, c) => n + c.offers.length, 0),
  claims: Object.fromEntries(s.claims.map((q) => [q.id, q.status])),
});
NG.finishDayReport = (s, before) => {
  s.dayReport = {
    read: false,
    closedDay: before.day,
    day: s.day,
    closingCash: before.cash,
    closingReputation: before.reputation,
    level: before.level,
    xpEarned: before.xpEarned,
    transactions: before.transactions,
    cashFlow: before.cashFlow,
    tradingResult: before.tradingResult,
    overnightCash: s.cash - before.cash,
    overnightReputation: s.reputation - before.reputation,
    event: { ...s.event },
    demand: { ...s.demand },
    marketCount: s.market.length,
    completedRepairs: before.completedCandidates
      .filter((c) => c.readyDay <= s.day)
      .map((c) => c.name),
    expiredOffers: before.expiredOffers,
    offers: s.inventory.flatMap((c) =>
      c.offers.map((o) => ({
        car: NG.model(c).name,
        buyer: o.buyer,
        price: o.price,
        returning: !!o.returning,
      })),
    ),
    newClaims: s.claims
      .filter((q) => q.status === "open" && before.claims[q.id] !== "open")
      .map((q) => ({
        buyer: q.buyer,
        car: NG.model({ model: q.model }).name,
        amount: q.amount,
        deadline: q.deadline,
      })),
    expiredClaims: s.claims
      .filter(
        (q) => q.status === "ignored" && before.claims[q.id] !== "ignored",
      )
      .map((q) => q.buyer),
    advertising:
      s.adNotice ||
      (s.business.adActive
        ? "Newspaper campaign: " + NG.money(20) + " daily fee paid."
        : "Newspaper campaign inactive. No daily fee."),
  };
  return s.dayReport;
};
