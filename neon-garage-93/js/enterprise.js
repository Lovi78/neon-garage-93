/* Capital, commitments and liquidity. Values are fictional game balance. */
window.NG = window.NG || {};
NG.enterpriseProjects = [
  {
    id: "service",
    name: "Independent Service Center",
    cost: 24000,
    days: 6,
    daily: 180,
    rep: 10,
    description:
      "Two shared workshop slots. Client repair orders create a second revenue stream, but compete with your own cars. Staff and facility costs continue on quiet days.",
  },
  {
    id: "fleet",
    name: "Regional Fleet Workshop",
    cost: 68000,
    days: 10,
    daily: 320,
    rep: 25,
    requires: "service",
    description:
      "Three shared workshop slots and larger fleet contracts. Requires an active Service Center. Adds $320/day to its $180/day cost. Bigger parts advances and longer commitments.",
  },
  {
    id: "wholesale",
    name: "Wholesale Trading Desk",
    cost: 45000,
    days: 8,
    daily: 250,
    rep: 20,
    description:
      "Up to two wholesale allocations, independent of garage spaces. Lock $25k or $50k for five days. Settlement follows segment demand, with a saved execution adjustment. Capital can lose up to 40%.",
  },
];
NG.ensureEnterprise = (s) => {
  if (!s.enterprise)
    s.enterprise = {
      projects: {},
      orders: [],
      lots: [],
      loan: 0,
      profit: 0,
      notices: [],
      nextOrderDay: s.day + 1,
    };
  return s;
};
NG.enterpriseActive = (s, id) =>
  s?.enterprise?.projects[id]?.status === "active";
NG.workshopCapacity = (s) =>
  NG.enterpriseActive(s, "fleet")
    ? 3
    : NG.enterpriseActive(s, "service")
      ? 2
      : 1;
NG.enterpriseOrdersBusy = (s) =>
  (s.enterprise?.orders || []).filter((j) => j.status === "running").length;
NG.enterpriseCosts = (s, day = s.day) => {
  const e = s.enterprise;
  if (!e) return 0;
  return (
    NG.enterpriseProjects.reduce(
      (n, t) =>
        n +
        (e.projects[t.id]?.status === "active" ||
        (e.projects[t.id]?.status === "building" &&
          day > e.projects[t.id].readyDay)
          ? t.daily
          : e.projects[t.id]?.status === "paused"
            ? Math.ceil(t.daily * 0.25)
            : 0),
      0,
    ) + Math.round((e.loan * 0.02) / 7)
  );
};
NG.enterpriseAssets = (s) => {
  const e = s.enterprise;
  if (!e) return 0;
  return (
    NG.enterpriseProjects.reduce(
      (n, t) =>
        n +
        (e.projects[t.id]
          ? Math.round(
              t.cost * (e.projects[t.id].status === "building" ? 0.5 : 0.4),
            )
          : 0),
      0,
    ) +
    e.orders
      .filter((j) => j.status === "running")
      .reduce((n, j) => n + j.cost, 0) +
    e.lots.filter((l) => l.status === "running").reduce((n, l) => n + l.cost, 0)
  );
};
NG.startEnterprise = (s, id) => {
  NG.ensureEnterprise(s);
  const t = NG.enterpriseProjects.find((t) => t.id === id),
    e = s.enterprise;
  if (!t || e.projects[id])
    throw Error("This project is unavailable or already owned.");
  if (t.requires && !NG.enterpriseActive(s, t.requires))
    throw Error("Open the Service Center first.");
  if (s.reputation < t.rep)
    throw Error("Not enough reputation for this expansion.");
  if (s.operations.arrears)
    throw Error("Clear overdue bills before expansion.");
  if (Object.values(e.projects).some((p) => p.status === "building"))
    throw Error("Finish the current construction project first.");
  if (s.cash < t.cost) throw Error("Not enough cash for this project.");
  s.cash -= t.cost;
  NG.record(s, "capital", -t.cost, t.name + " / construction investment");
  e.projects[id] = {
    status: "building",
    started: s.day,
    readyDay: s.day + t.days,
  };
  return (
    "Construction started. Opens " +
    NG.date(s.day + t.days) +
    ". No new operating costs until opening."
  );
};
NG.enterpriseCommitments = (s, id) =>
  id === "wholesale"
    ? s.enterprise.lots.some((l) => l.status === "running")
    : NG.enterpriseOrdersBusy(s) > 0 ||
      NG.workshopBusy(s) > (id === "fleet" ? 2 : 1) ||
      (id === "service" && !!s.enterprise.projects.fleet);
NG.manageEnterprise = (s, id, action) => {
  const t = NG.enterpriseProjects.find((t) => t.id === id),
    p = s.enterprise?.projects[id];
  if (!t || !p) throw Error("This facility is not owned.");
  if (action === "resume") {
    if (p.status !== "paused")
      throw Error("Only paused facilities can reopen.");
    if (s.operations.arrears)
      throw Error("Clear overdue bills before reopening.");
    if (t.requires && !NG.enterpriseActive(s, t.requires))
      throw Error("Reopen the Service Center first.");
    p.status = "active";
    return "Facility reopened. Full operating costs resume next morning.";
  }
  if (NG.enterpriseCommitments(s, id))
    throw Error(
      "Finish outstanding work/allocations and dependent expansions before pausing or selling.",
    );
  if (action === "pause") {
    if (p.status !== "active")
      throw Error("Only open facilities can be paused.");
    p.status = "paused";
    return "Facility paused. A 25% daily retention cost remains.";
  }
  if (action !== "sell") throw Error("Unknown facility action.");
  const refund = Math.round(t.cost * (p.status === "building" ? 0.5 : 0.4));
  s.cash += refund;
  NG.record(
    s,
    "capital",
    refund,
    t.name +
      " / " +
      (p.status === "building"
        ? "construction cancellation"
        : "asset liquidation"),
  );
  delete s.enterprise.projects[id];
  return (
    "Business assets liquidated for " +
    NG.money(refund) +
    ". The investment loss is permanent."
  );
};
NG.enterpriseLoanLimit = (s) =>
  s.reputation >= 25 ? 50000 : s.reputation >= 10 ? 10000 : 0;
NG.enterpriseFinance = (s, amount) => {
  NG.ensureEnterprise(s);
  if (!Number.isInteger(amount) || !amount)
    throw Error("Choose a valid loan amount.");
  const e = s.enterprise;
  if (amount > 0) {
    if (e.loan + amount > NG.enterpriseLoanLimit(s))
      throw Error("This exceeds your credit limit.");
    e.loan += amount;
    s.cash += amount;
    NG.record(s, "financing", amount, "Business credit draw");
  } else {
    const paid = -amount;
    if (paid > e.loan || paid > s.cash)
      throw Error("Repayment exceeds available cash or outstanding principal.");
    e.loan -= paid;
    s.cash -= paid;
    NG.record(s, "financing", -paid, "Business credit principal repayment");
  }
  return (
    "Loan principal: " +
    NG.money(e.loan) +
    ". Interest: " +
    NG.money(Math.round((e.loan * 0.02) / 7)) +
    "/day (2% per week, simple interest)."
  );
};
NG.takeServiceOrder = (s, id) => {
  const j = s.enterprise?.orders.find((j) => j.id === id);
  if (!j || j.status !== "offered" || j.deadline < s.day)
    throw Error("This work order has expired.");
  if (
    !NG.enterpriseActive(s, "service") ||
    (j.tier === 2 && !NG.enterpriseActive(s, "fleet"))
  )
    throw Error("The required workshop must be active.");
  if (s.operations.arrears)
    throw Error("Clear overdue bills before accepting work.");
  if (NG.workshopBusy(s) >= NG.workshopCapacity(s))
    throw Error("All shared workshop slots are occupied.");
  if (NG.localWorkshopBlocked(s))
    throw Error("Today’s local commitment prevents new in-house work.");
  if (s.cash < j.cost) throw Error("Not enough cash to advance parts costs.");
  s.cash -= j.cost;
  NG.record(s, "service", -j.cost, j.name + " / prepaid parts");
  j.status = "running";
  j.started = s.day;
  j.readyDay = s.day + j.days;
  return (
    "Work accepted. " +
    NG.money(j.cost) +
    " paid now; " +
    NG.money(j.revenue) +
    " due " +
    NG.date(j.readyDay) +
    "."
  );
};
NG.declineServiceOrder = (s, id) => {
  const j = s.enterprise?.orders.find((j) => j.id === id);
  if (!j || j.status !== "offered")
    throw Error("This invitation is unavailable.");
  j.status = "declined";
  return "Work declined. No penalty.";
};
NG.wholesaleTerms = (s, segment, cost) => {
  if (
    !["japan", "europe", "america"].includes(segment) ||
    ![25000, 50000].includes(cost)
  )
    throw Error("Choose a valid segment and allocation.");
  return {
    segment,
    cost,
    startDemand: s.demand[segment],
    days: 5,
    min: Math.round(cost * 0.6),
    max: Math.round(cost * 1.5),
  };
};
NG.startWholesale = (s, segment, cost, rng = Math.random) => {
  const e = s.enterprise,
    terms = NG.wholesaleTerms(s, segment, cost);
  if (!NG.enterpriseActive(s, "wholesale"))
    throw Error("Open the Wholesale Trading Desk first.");
  if (s.operations.arrears)
    throw Error("Clear overdue bills before an allocation.");
  if (e.lots.filter((l) => l.status === "running").length >= 2)
    throw Error("Both allocation slots are committed.");
  if (s.cash < cost) throw Error("Not enough cash to fund this allocation.");
  // Execution uncertainty is stored at commitment; reloading never rerolls it.
  const execution = (rng() - 0.5) * 0.08;
  s.cash -= cost;
  NG.record(
    s,
    "wholesale",
    -cost,
    segment + " wholesale allocation / capital committed",
  );
  e.lots.push({
    id: "lot-" + s.nextId++,
    ...terms,
    status: "running",
    started: s.day,
    readyDay: s.day + 5,
    execution,
  });
  return (
    "Capital locked until " +
    NG.date(s.day + 5) +
    ". Settlement range: " +
    NG.money(terms.min) +
    " to " +
    NG.money(terms.max) +
    "."
  );
};
NG.enterpriseDay = (s, rng = Math.random) => {
  NG.ensureEnterprise(s);
  const e = s.enterprise;
  e.notices = [];
  for (const [id, p] of Object.entries(e.projects))
    if (p.status === "building" && p.readyDay <= s.day) {
      p.status = "active";
      e.notices.push(
        NG.enterpriseProjects.find((t) => t.id === id).name +
          " opened. Full operating costs start tomorrow.",
      );
    }
  for (const j of e.orders) {
    if (j.status === "offered" && j.deadline < s.day) j.status = "expired";
    if (j.status === "running" && j.readyDay <= s.day) {
      j.status = "completed";
      s.cash += j.revenue;
      e.profit += j.revenue - j.cost;
      NG.record(s, "service", j.revenue, j.name + " / completed work payment");
      e.notices.push(
        j.name +
          " completed: " +
          NG.money(j.revenue) +
          " received, " +
          NG.money(j.revenue - j.cost) +
          " margin before overhead.",
      );
    }
  }
  for (const l of e.lots)
    if (l.status === "running" && l.readyDay <= s.day) {
      l.status = "settled";
      l.endDemand = s.demand[l.segment];
      l.revenue = Math.round(
        l.cost *
          NG.clamp((1.1 * l.endDemand) / l.startDemand + l.execution, 0.6, 1.5),
      );
      s.cash += l.revenue;
      e.profit += l.revenue - l.cost;
      NG.record(s, "wholesale", l.revenue, l.segment + " wholesale settlement");
      e.notices.push(
        l.segment +
          " wholesale settled: " +
          NG.money(l.revenue) +
          " received; result " +
          (l.revenue >= l.cost ? "+" : "-") +
          NG.money(Math.abs(l.revenue - l.cost)) +
          " before overhead.",
      );
    }
  if (
    NG.enterpriseActive(s, "service") &&
    s.day >= e.nextOrderDay &&
    !e.orders.some((j) => j.status === "offered")
  ) {
    const fleet = NG.enterpriseActive(s, "fleet"),
      tier = fleet && rng() < 0.6 ? 2 : 1;
    const cost =
      tier === 2
        ? 6000 + Math.floor(rng() * 7) * 1000
        : 1200 + Math.floor(rng() * 6) * 400;
    const margin =
      tier === 2
        ? 3000 + Math.floor(rng() * 4) * 1000
        : 900 + Math.floor(rng() * 5) * 250;
    const days =
      tier === 2 ? 4 + Math.floor(rng() * 3) : 2 + Math.floor(rng() * 3);
    e.orders.push({
      id: "service-" + s.nextId++,
      name:
        tier === 2 ? "Fleet maintenance contract" : "Neighborhood repair order",
      tier,
      cost,
      revenue: cost + margin,
      days,
      status: "offered",
      day: s.day,
      deadline: s.day + 2,
    });
    e.nextOrderDay = s.day + 2;
    e.notices.push(
      "New client work order. Compare margin, parts advance and occupied workshop days.",
    );
  }
  e.orders = e.orders.filter(
    (j, i) => i >= e.orders.length - 30 || j.status === "running",
  );
  e.lots = e.lots.filter(
    (l, i) => i >= e.lots.length - 30 || l.status === "running",
  );
};
NG.operatingCashFlow = (s, days = 7) =>
  s.ledger
    .filter(
      (l) => l.day > s.day - days && !["capital", "financing"].includes(l.type),
    )
    .reduce((n, l) => n + l.amount, 0);

NG.knownDailyBills = (s, day) =>
  20 +
  s.inventory.length * 5 +
  NG.enterpriseCosts(s, day) +
  (s.business.adActive ? 20 : 0);
NG.sevenDayCosts = (s) =>
  s.operations.arrears +
  Array.from({ length: 7 }, (_, i) =>
    NG.knownDailyBills(s, s.day + i + 1),
  ).reduce((n, v) => n + v, 0);
NG.cashRunway = (s) => {
  let cash = Math.max(0, s.cash - s.operations.arrears),
    days = 0;
  while (days < 10000) {
    const bill = NG.knownDailyBills(s, s.day + days + 1);
    if (cash < bill) break;
    cash -= bill;
    days++;
  }
  return days === 10000 ? "10,000+" : days;
};
