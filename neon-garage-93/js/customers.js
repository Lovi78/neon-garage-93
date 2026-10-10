window.NG = window.NG || {};
NG.listingModes = {
  honest: {
    name: "Inspected / disclose all faults",
    description:
      "Full inspection required. All remaining faults are shown to the buyer. +1 extra reputation on sale; no hidden-fault complaint.",
  },
  "as-is": {
    name: "As-is / condition not guaranteed",
    description:
      "Be upfront about uncertainty. Offers are 5% lower; +1 reputation on sale. No hidden-fault complaint.",
  },
  promise: {
    name: "Advertise as fault-free",
    description:
      "Buyers value the car without hidden-fault deductions. If an unresolved fault remains, a complaint arrives two days after sale.",
  },
};
NG.ensureCustomers = (s) => {
  s.customers = s.customers || [];
  s.claims = s.claims || [];
  s.reputationLog = s.reputationLog || [];
  return s;
};
NG.changeReputation = (s, delta, reason) => {
  NG.ensureCustomers(s);
  const before = s.reputation;
  s.reputation = Math.max(0, s.reputation + delta);
  s.reputationLog.unshift({ day: s.day, delta: s.reputation - before, reason });
  s.reputationLog = s.reputationLog.slice(0, 50);
};
NG.listingValue = (s, c) => {
  const mode = c.listingMode || "as-is";
  return mode === "promise"
    ? NG.value(s, { ...c, flaws: [] })
    : Math.round(NG.value(s, c) * (mode === "as-is" ? 0.95 : 1));
};
NG.chooseBuyer = (s, car, rng = Math.random) => {
  NG.ensureCustomers(s);
  const repeat = s.customers.filter(
    (c) =>
      c.trust >= 1 &&
      c.segment === NG.model(car).segment &&
      !s.claims.some(
        (q) => q.buyer === c.name && ["scheduled", "open"].includes(q.status),
      ),
  );
  if (
    repeat.length &&
    rng() < NG.clamp(0.15 + s.reputation * 0.005, 0.15, 0.6)
  ) {
    const buyer = repeat[Math.floor(rng() * repeat.length)];
    return { buyer: buyer.name, returning: true };
  }
  const names = [
    "Alex M.",
    "Jamie R.",
    "Chris T.",
    "Morgan K.",
    "Sam P.",
    "Taylor B.",
    "Casey D.",
    "Jordan W.",
    "Robin S.",
    "Drew H.",
    "Blair N.",
    "Jesse L.",
  ].filter((name) => !s.customers.some((c) => c.name === name));
  return {
    buyer: names.length
      ? names[Math.floor(rng() * names.length)]
      : "Walk-in " + s.nextId,
    returning: false,
  };
};
NG.afterPrivateSale = (s, car, offer, sale) => {
  NG.ensureCustomers(s);
  offer = { ...offer, buyer: offer.buyer || "Walk-in " + sale.id };
  const mode = car.listingMode || "as-is",
    faults = car.flaws.filter((f) => !f.fixed);
  let customer = s.customers.find((c) => c.name === offer.buyer);
  if (!customer) {
    customer = {
      name: offer.buyer,
      segment: NG.model(car).segment,
      trust: 0,
      purchases: 0,
      spent: 0,
      lastDay: s.day,
    };
    s.customers.push(customer);
  }
  customer.purchases++;
  customer.spent += sale.price;
  customer.lastDay = s.day;
  const dishonest = mode === "promise" && faults.length > 0;
  customer.trust = NG.clamp(
    customer.trust + (dishonest ? 0 : mode === "as-is" ? 1 : 2),
    -3,
    5,
  );
  const rep =
    mode === "as-is"
      ? 1
      : (NG.condition(car) >= 65 ? 2 : 1) + (mode === "honest" ? 1 : 0);
  NG.changeReputation(
    s,
    rep,
    NG.model(car).name +
      " sold to " +
      offer.buyer +
      " / " +
      NG.listingModes[mode].name,
  );
  sale.buyer = offer.buyer;
  sale.listingMode = mode;
  sale.refundCost = 0;
  if (dishonest) {
    s.claims.push({
      id: "claim-" + s.nextId++,
      saleId: sale.id,
      model: car.model,
      buyer: offer.buyer,
      status: "scheduled",
      opensDay: s.day + 2,
      deadline: s.day + 5,
      amount: Math.min(
        Math.round(sale.price * 0.15),
        Math.max(50, Math.round(faults.reduce((n, f) => n + f.cost, 0) * 0.5)),
      ),
      faults: faults.map((f) => f.label),
    });
  }
};
NG.processClaims = (s) => {
  NG.ensureCustomers(s);
  s.claimNotice = null;
  for (const q of s.claims) {
    if (q.status === "scheduled" && s.day >= q.opensDay) {
      q.status = "open";
      const customer = s.customers.find((c) => c.name === q.buyer);
      if (customer) customer.trust = NG.clamp(customer.trust - 2, -3, 5);
      NG.changeReputation(s, -4, "Fault-free promise broken: " + q.buyer);
      s.claimNotice =
        "New complaint from " + q.buyer + ". Open Customers to respond.";
    }
    if (q.status === "open" && s.day >= q.deadline) {
      q.status = "ignored";
      q.resolvedDay = s.day;
      const customer = s.customers.find((c) => c.name === q.buyer);
      if (customer) customer.trust = NG.clamp(customer.trust - 1, -3, 5);
      NG.changeReputation(s, -3, "Complaint left unanswered: " + q.buyer);
      s.claimNotice = "An unanswered complaint damaged your reputation.";
    }
  }
};
NG.resolveClaim = (s, id, decision) => {
  const q = s.claims.find((c) => c.id === id);
  if (!q || q.status !== "open")
    throw Error("This complaint is no longer open.");
  if (!["refund", "decline"].includes(decision))
    throw Error("Choose a valid response.");
  const sale = s.sales.find((c) => c.id === q.saleId);
  if (!sale) throw Error("The original sale cannot be found.");
  const customer = s.customers.find((c) => c.name === q.buyer);
  if (decision === "refund") {
    if (s.cash < q.amount)
      throw Error(
        "Not enough cash for the repair contribution. You can respond before the deadline or decline.",
      );
    s.cash -= q.amount;
    s.profit -= q.amount;
    sale.profit -= q.amount;
    sale.refundCost = (sale.refundCost || 0) + q.amount;
    NG.collectionEntry(s, q.model).profit -= q.amount;
    NG.record(
      s,
      "refund",
      -q.amount,
      "Repair contribution to " +
        q.buyer +
        " / " +
        NG.model({ model: q.model }).name,
    );
    if (customer) {
      customer.spent -= q.amount;
      customer.trust = NG.clamp(customer.trust + 3, -3, 5);
    }
    NG.changeReputation(
      s,
      1,
      "Complaint resolved with contribution: " + q.buyer,
    );
    q.status = "settled";
  } else {
    if (customer) customer.trust = NG.clamp(customer.trust - 1, -3, 5);
    NG.changeReputation(s, -2, "Repair contribution declined: " + q.buyer);
    q.status = "declined";
  }
  q.resolvedDay = s.day;
  return decision === "refund"
    ? "Repair contribution paid. Sale profit and reputation updated."
    : "Complaint declined. No payment; reputation and customer trust fell.";
};
