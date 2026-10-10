/* Local fictional choices, separate from the daily demand news. */
window.NG = window.NG || {};
NG.localEvents = [
  {
    id: "parts",
    title: "Supplier prepay offer",
    text: "Pay up front to reduce the next three repair quotes. Small jobs may not recover your investment.",
    cost: 120,
    days: 5,
    repair: 0.2,
    uses: 3,
    benefit:
      "20% off the next 3 repairs, including rush quotes. Expires after 5 days.",
  },
  {
    id: "meet",
    title: "Silver Palms car meet",
    text: "Spend the day meeting local buyers instead of booking new in-house repairs.",
    cost: 80,
    days: 2,
    interest: 0.2,
    blocks: true,
    benefit:
      "+20 percentage points buyer arrival chance on the next 2 mornings. No new in-house repair bookings today; rush remains available.",
  },
  {
    id: "flyers",
    title: "Neighborhood flyer run",
    text: "Buy a short, modest promotion without committing to a permanent campaign.",
    cost: 50,
    days: 3,
    interest: 0.12,
    benefit:
      "+12 percentage points buyer arrival chance on the next 3 mornings.",
  },
  {
    id: "mechanic",
    title: "Visiting mechanic",
    text: "A freelance specialist can help with the next engine and transmission jobs.",
    cost: 110,
    days: 3,
    fast: true,
    benefit:
      "New in-house engine and transmission jobs take 1 day through the next 3 days. Existing jobs are unchanged.",
  },
  {
    id: "detailer",
    title: "Detailing shop partnership",
    text: "The local detailer offers a short promotional rate. Worth it only if you have work lined up.",
    cost: 65,
    days: 3,
    repair: 0.3,
    part: "cosmetic",
    benefit: "30% off cosmetic repair quotes through the next 3 days.",
  },
  {
    id: "photographer",
    title: "Classifieds photo package",
    text: "Sharper listing photos give your stock a short burst of attention.",
    cost: 60,
    days: 2,
    interest: 0.18,
    benefit:
      "+18 percentage points buyer arrival chance on the next 2 mornings. No guaranteed offers.",
  },
  {
    id: "chamber",
    title: "Local business open house",
    text: "Host a community visit to build trust. You cannot start a new in-house repair during the visit.",
    cost: 90,
    days: 0,
    rep: 3,
    blocks: true,
    benefit:
      "+3 reputation now. No new in-house repair bookings today; rush remains available.",
  },
  {
    id: "testlane",
    title: "Inspection lane day pass",
    text: "Prepay access to a nearby diagnostic lane before shopping or inspecting your own stock.",
    cost: 45,
    days: 3,
    inspection: 0.25,
    benefit:
      "25% off mechanical inspections through the next 3 days. Minimum inspection fee: $20.",
  },
];
NG.requestKinds = [
  {
    id: "japan",
    title: "Japanese weekend car",
    buyer: "Riley S.",
    segment: "japan",
    shapes: ["sport", "roadster", "hatch"],
    condition: 75,
    mileage: 150000,
    days: 4,
    budget: 7500,
    bonus: 300,
  },
  {
    id: "europe",
    title: "European daily driver",
    buyer: "Pat C.",
    segment: "europe",
    shapes: ["sedan", "hatch"],
    condition: 72,
    mileage: 180000,
    days: 5,
    budget: 5400,
    bonus: 250,
  },
  {
    id: "america",
    title: "American performance car",
    buyer: "Lee V.",
    segment: "america",
    shapes: ["sport"],
    condition: 78,
    mileage: 140000,
    days: 5,
    budget: 9500,
    bonus: 400,
  },
];
NG.ensureOpportunities = (s) => {
  if (!s.opportunities)
    s.opportunities = {
      events: [],
      requests: [],
      nextEventDay: s.day + 1,
      nextRequestDay: s.day + 1,
      notices: [],
    };
  return s;
};
NG.activeLocalEffects = (s) =>
  (s?.opportunities?.events || []).filter(
    (e) =>
      e.status === "accepted" &&
      e.until >= s.day &&
      (e.uses == null || e.uses > 0),
  );
NG.localEffect = (s, key) =>
  NG.activeLocalEffects(s).reduce(
    (n, e) => n + (NG.localEvents.find((t) => t.id === e.kind)?.[key] || 0),
    0,
  );
NG.localWorkshopBlocked = (s) =>
  (s?.opportunities?.events || []).some(
    (e) =>
      e.status === "accepted" &&
      e.acceptedDay === s.day &&
      NG.localEvents.find((t) => t.id === e.kind)?.blocks,
  );
NG.discountedLocalRepair = (s, part, quote) => {
  const effect = NG.activeLocalEffects(s)
    .filter((e) => {
      const t = NG.localEvents.find((t) => t.id === e.kind);
      return t?.repair && (!t.part || t.part === part);
    })
    .sort(
      (a, b) =>
        NG.localEvents.find((t) => t.id === b.kind).repair -
        NG.localEvents.find((t) => t.id === a.kind).repair,
    )[0];
  if (!effect) return { price: quote, event: null };
  return {
    price: Math.round(
      quote * (1 - NG.localEvents.find((t) => t.id === effect.kind).repair),
    ),
    event: effect,
  };
};
NG.chooseLocalEvent = (s, id, accept) => {
  NG.ensureOpportunities(s);
  const e = s.opportunities.events.find((e) => e.id === id),
    t = NG.localEvents.find((t) => t.id === e?.kind);
  if (!e || e.status !== "pending" || e.deadline < s.day || !t)
    throw Error("This local invitation is no longer available.");
  if (!accept) {
    e.status = "declined";
    return "Invitation declined. No fee or reputation penalty.";
  }
  if (s.operations.arrears)
    throw Error("Clear overdue operating bills before paying for an event.");
  if (s.cash < t.cost) throw Error("Not enough cash for this event.");
  if (t.blocks && NG.workshopBusy(s))
    throw Error("Finish your current in-house job before hosting this event.");
  s.cash -= t.cost;
  NG.record(s, "local-event", -t.cost, t.title + " / upfront fee");
  e.status = "accepted";
  e.acceptedDay = s.day;
  e.until = s.day + t.days;
  if (t.uses) e.uses = t.uses;
  if (t.rep) NG.changeReputation(s, t.rep, t.title);
  return t.title + " accepted. " + t.benefit;
};
NG.chooseRequest = (s, id, accept) => {
  NG.ensureOpportunities(s);
  const q = s.opportunities.requests.find((q) => q.id === id),
    t = NG.requestKinds.find((t) => t.id === q?.kind);
  if (!q || q.status !== "offered" || q.offerUntil < s.day)
    throw Error("This buyer request is no longer available.");
  if (!accept) {
    q.status = "declined";
    return "Request declined. No penalty.";
  }
  if (s.opportunities.requests.filter((q) => q.status === "active").length >= 2)
    throw Error("Finish one of your two active requests first.");
  q.status = "active";
  q.acceptedDay = s.day;
  q.deadline = s.day + t.days;
  return (
    "Request accepted. Deliver by " +
    NG.date(q.deadline) +
    ". No cash changes hands until delivery."
  );
};
NG.requestMatch = (s, q, car) => {
  const t = NG.requestKinds.find((t) => t.id === q.kind),
    m = NG.model(car);
  return (
    !!t &&
    q.status === "active" &&
    q.deadline >= s.day &&
    m.segment === t.segment &&
    t.shapes.includes(m.shape) &&
    car.mileage <= t.mileage &&
    NG.condition(car) >= t.condition &&
    car.inspected &&
    !car.flaws.some((f) => !f.fixed) &&
    !NG.busy(s, car)
  );
};
NG.validateRequestDelivery = (s, id, car) => {
  const q = s.opportunities?.requests.find((q) => q.id === id),
    t = NG.requestKinds.find((t) => t.id === q?.kind);
  if (!q || !NG.requestMatch(s, q, car))
    throw Error(
      "This car does not meet the active request. Inspect it, fix all faults and finish repairs before the deadline.",
    );
  return { request: q, price: t.budget + t.bonus, buyer: t.buyer };
};
NG.abandonRequest = (s, id) => {
  const q = s.opportunities?.requests.find((q) => q.id === id);
  if (!q || q.status !== "active")
    throw Error("This request is no longer active.");
  q.status = "abandoned";
  NG.changeReputation(s, -1, "Accepted buyer request abandoned");
  return "Request abandoned. -1 reputation; no cash penalty.";
};
NG.opportunityDay = (s, rng = Math.random) => {
  NG.ensureOpportunities(s);
  const o = s.opportunities;
  o.notices = [];
  for (const e of o.events) {
    if (e.status === "pending" && e.deadline < s.day) {
      e.status = "expired";
      o.notices.push(
        "Invitation expired: " +
          NG.localEvents.find((t) => t.id === e.kind).title +
          ". No penalty.",
      );
    }
    if (e.status === "accepted" && e.until < s.day) {
      e.status = "finished";
      o.notices.push(
        "Local benefit ended: " +
          NG.localEvents.find((t) => t.id === e.kind).title +
          ".",
      );
    }
  }
  for (const q of o.requests) {
    if (q.status === "offered" && q.offerUntil < s.day) q.status = "expired";
    if (q.status === "active" && q.deadline < s.day) {
      q.status = "failed";
      NG.changeReputation(s, -1, "Missed buyer request deadline");
      o.notices.push(
        "Buyer request missed: " +
          NG.requestKinds.find((t) => t.id === q.kind).title +
          ". -1 reputation; no cash penalty.",
      );
    }
  }
  // Local invitations retired in v0.11; existing paid benefits expire normally.
  if (
    s.day >= o.nextRequestDay &&
    !o.requests.some((q) => q.status === "offered") &&
    o.requests.filter((q) => q.status === "active").length < 2 &&
    rng() < 0.25
  ) {
    const candidates = NG.requestKinds.filter(
      (t) =>
        !o.requests.some(
          (q) => ["active", "offered"].includes(q.status) && q.kind === t.id,
        ),
    );
    const t =
      candidates[
        Math.min(candidates.length - 1, Math.floor(rng() * candidates.length))
      ];
    if (t) {
      o.requests.push({
        id: "request-" + s.nextId++,
        kind: t.id,
        status: "offered",
        day: s.day,
        offerUntil: s.day + 2,
      });
      o.nextRequestDay = s.day + 4;
      o.notices.push(
        "Buyer request: " + t.title + ". Reply by " + NG.date(s.day + 2) + ".",
      );
    }
  }
  // Keep all live commitments and a bounded history.
  o.events = o.events.filter(
    (e, i) =>
      i >= o.events.length - 20 || ["pending", "accepted"].includes(e.status),
  );
  o.requests = o.requests.filter(
    (q, i) =>
      i >= o.requests.length - 20 || ["active", "offered"].includes(q.status),
  );
};
