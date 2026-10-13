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
/* v0.14 buyer requests. Old saves keep their three fixed-price kinds
   (q.kind in NG.requestKinds). New requests carry their own spec (q.spec):
   generated from a real catalog model so at least one car qualifies, and they
   pay the delivered car's estimate plus a tier premium instead of a fixed sum. */
NG.requestTiers = {
  easy: { label: "Everyday", premium: 0.12, rep: 0, days: 5 },
  specific: { label: "Specific", premium: 0.18, rep: 1, days: 7 },
  collector: { label: "Collector", premium: 0.25, rep: 2, days: 9 },
};
NG.requestBuyers = [
  "Riley S.",
  "Pat C.",
  "Lee V.",
  "Morgan T.",
  "Dana K.",
  "Sam O.",
  "Jordan P.",
  "Casey L.",
  "Robin F.",
  "Avery N.",
  "Quinn D.",
  "Jesse M.",
];
const SEGMENT_NAMES = {
  japan: "Japanese",
  europe: "European",
  america: "American",
};
NG.requestSpec = (q) => {
  if (q?.spec) return q.spec;
  const t = NG.requestKinds.find((t) => t.id === q?.kind);
  if (!t) return null;
  return {
    legacy: true,
    title: t.title,
    buyer: t.buyer,
    tier: "easy",
    segment: t.segment,
    shapes: t.shapes,
    condition: t.condition,
    mileage: t.mileage,
    days: t.days,
    price: t.budget + t.bonus,
    rep: 0,
  };
};
NG.requestCapacity = (s) => ((s.reputation || 0) >= 10 ? 3 : 2);
NG.chooseRequest = (s, id, accept) => {
  NG.ensureOpportunities(s);
  const q = s.opportunities.requests.find((q) => q.id === id),
    t = NG.requestSpec(q);
  if (!q || !t || q.status !== "offered" || q.offerUntil < s.day)
    throw Error("This buyer request is no longer available.");
  if (!accept) {
    q.status = "declined";
    return "Request declined. No penalty.";
  }
  const cap = NG.requestCapacity(s);
  if (
    s.opportunities.requests.filter((q) => q.status === "active").length >= cap
  )
    throw Error(
      "Finish one of your " +
        (cap === 2 ? "two" : "three") +
        " active requests first.",
    );
  q.status = "active";
  q.acceptedDay = s.day;
  q.deadline = s.day + t.days;
  return (
    "Request accepted. Deliver by " +
    NG.date(q.deadline) +
    ". No cash changes hands until delivery."
  );
};
const gradeRank = (id) => NG.conditionGrades.findIndex((g) => g.id === id);
const packageForGrade = (id) =>
  id === "excellent" ? "Full restoration" : "Driver-ready";
// Checklist used by the engine and the UI. strict=true also counts faults the
// player has not found: the buyer's own mechanic checks the car at handover.
NG.requestCriteria = (s, q, car, strict = false) => {
  const t = NG.requestSpec(q),
    m = NG.model(car),
    h = car.vehicleHistory,
    out = [];
  if (!t) return [{ id: "spec", label: "Unknown request", ok: false }];
  const add = (id, label, ok, hint = "", fixed = false) =>
    out.push({ id, label, ok: !!ok, hint: ok ? "" : hint, fixed });
  if (t.models)
    add(
      "model",
      t.models
        .map((id) => NG.catalog.find((m) => m.id === id)?.name)
        .join(" / "),
      t.models.includes(car.model),
      "",
      true,
    );
  if (t.segment)
    add(
      "segment",
      SEGMENT_NAMES[t.segment] + " car",
      m.segment === t.segment,
      "",
      true,
    );
  if (t.shapes)
    add("shape", t.shapes.join(" / "), t.shapes.includes(m.shape), "", true);
  if (t.mileage)
    add(
      "mileage",
      "≤ " + t.mileage.toLocaleString("en-US") + " miles",
      car.mileage <= t.mileage,
      "",
      true,
    );
  add("inspected", "Inspected", car.inspected, "Inspect it first.");
  if (t.grade) {
    const g = NG.conditionGrades[gradeRank(t.grade)];
    add(
      "grade",
      g.label + " or better",
      car.inspected && gradeRank(NG.grade(car).id) >= gradeRank(t.grade),
      car.inspected
        ? packageForGrade(t.grade) + " gets it there."
        : "Inspect to see the grade.",
    );
  }
  if (t.condition)
    add(
      "condition",
      "≥ " + t.condition + "% condition",
      car.inspected && NG.condition(car) >= t.condition,
      "Driver-ready gets every part to 75%.",
    );
  add(
    "faults",
    "No faults",
    !car.flaws.some((f) => !f.fixed && (strict || f.revealed)),
    "Quick fix repairs known faults.",
  );
  if (t.records)
    add(
      "records",
      "Service records",
      h?.historyChecked && h.records,
      h?.historyChecked
        ? "This car has no records."
        : "Check its records ($35).",
      h?.historyChecked && !h.records,
    );
  if (t.noAccident)
    add(
      "accident",
      "No accident history",
      h?.historyChecked && !h.accident,
      h?.historyChecked ? "Accident on record." : "Check its records ($35).",
      h?.historyChecked && h.accident,
    );
  add(
    "ready",
    "Out of the workshop",
    !NG.busy(s, car),
    "Ready " + NG.date(car.readyDay) + ".",
  );
  return out;
};
// Could this car ever fit? Only the facts work cannot change (model, mileage, history).
NG.requestFits = (s, q, car) =>
  NG.requestCriteria(s, q, car).every((c) => c.ok || !c.fixed);
NG.requestMatch = (s, q, car) =>
  !!NG.requestSpec(q) &&
  q.status === "active" &&
  q.deadline >= s.day &&
  NG.requestCriteria(s, q, car, true).every((c) => c.ok);
NG.requestPayout = (s, q, car) => {
  const t = NG.requestSpec(q);
  if (!t) return 0;
  if (t.legacy) return t.price;
  const premium = NG.requestTiers[t.tier].premium,
    price = Math.round((NG.estimate(s, car) * (1 + premium)) / 25) * 25;
  return t.budget ? Math.min(t.budget, price) : price;
};
NG.validateRequestDelivery = (s, id, car) => {
  const q = s.opportunities?.requests.find((q) => q.id === id),
    t = NG.requestSpec(q);
  if (!q || !NG.requestMatch(s, q, car))
    throw Error(
      "This car does not meet the active request. Check the request list on the car.",
    );
  return {
    request: q,
    price: NG.requestPayout(s, q, car),
    buyer: t.buyer,
    rep: t.rep || 0,
  };
};
// One click from anywhere. A fault you missed is found by the buyer's mechanic:
// it is revealed (the deal waits) instead of an error that changes nothing.
NG.deliverRequest = (s, id, carId) => {
  const q = s.opportunities?.requests.find((q) => q.id === id),
    car = s.inventory.find((c) => c.id === carId);
  if (!q || !car) throw Error("This delivery is no longer available.");
  const hidden = car.flaws.filter((f) => !f.fixed && !f.revealed);
  if (
    hidden.length &&
    NG.requestCriteria(s, q, car).every((c) => c.ok) &&
    q.status === "active" &&
    q.deadline >= s.day
  ) {
    hidden.forEach((f) => (f.revealed = true));
    return (
      NG.requestSpec(q).buyer +
      "'s mechanic found: " +
      hidden.map((f) => f.label).join(", ") +
      ". Fix it, then deliver."
    );
  }
  const t = NG.requestSpec(q),
    price = NG.requestPayout(s, q, car),
    profit = NG.sell(s, carId, "request:" + id);
  return (
    "Delivered to " +
    t.buyer +
    " for " +
    NG.money(price) +
    " (" +
    (profit >= 0 ? "+" : "-") +
    NG.money(Math.abs(profit)) +
    " deal margin)."
  );
};
NG.generateRequest = (s, rng = Math.random) => {
  const pick = (a) => a[Math.min(a.length - 1, Math.floor(rng() * a.length))];
  const r = rng(),
    tier =
      (s.reputation || 0) >= 5 && r < 0.15
        ? "collector"
        : r < 0.55
          ? "easy"
          : "specific";
  const pool = NG.catalog.filter((m) =>
    tier === "collector"
      ? m.value >= 9000
      : tier === "specific"
        ? m.value >= 4000 && m.value <= 12500
        : m.value <= 7500,
  );
  // Single-model requests anchor on a model you can actually find today
  // (market or your garage); otherwise one specific model rarely appears in time.
  const seen = new Set([...s.market, ...s.inventory].map((c) => c.model)),
    findable = pool.filter((m) => seen.has(m.id));
  const m = pick(tier === "easy" || !findable.length ? pool : findable),
    canName = findable.length > 0,
    T = NG.requestTiers[tier],
    spec = {
      tier,
      buyer: pick(NG.requestBuyers),
      days: T.days + Math.floor(rng() * 2),
      rep: T.rep,
    };
  const seg = SEGMENT_NAMES[m.segment];
  if (tier === "collector" && canName)
    Object.assign(spec, {
      title: "Collector wants a " + m.name,
      line: "Only the best example. Papers, no stories.",
      models: [m.id],
      grade: "excellent",
      mileage: 130000,
      records: true,
      noAccident: true,
    });
  else if (tier !== "easy") {
    if (tier === "collector") {
      spec.tier = "specific";
      spec.rep = NG.requestTiers.specific.rep;
    }
    const variant = rng();
    if (variant < 0.55 && canName)
      Object.assign(spec, {
        title: "Looking for a " + m.name,
        line: "It has to be this model, and it has to be clean.",
        models: [m.id],
        grade: "clean",
        mileage: 150000,
      });
    else
      Object.assign(spec, {
        title: seg + " " + m.shape + " with papers",
        line: "Documented and never crashed. I will pay for that.",
        segment: m.segment,
        shapes: [m.shape],
        grade: "clean",
        records: true,
        noAccident: true,
      });
  } else {
    const variant = rng();
    if (["sport", "roadster"].includes(m.shape) && variant < 0.5)
      Object.assign(spec, {
        title: "Weekend fun car",
        line: "Something fun for Sundays. It just needs to run right.",
        shapes: ["sport", "roadster"],
        grade: "driver",
        mileage: 160000,
      });
    else if (m.shape === "hatch" && variant < 0.7)
      Object.assign(spec, {
        title: "First car for my kid",
        line: "Safe, cheap to run, with records.",
        shapes: ["hatch"],
        grade: "driver",
        records: true,
        budget: 4500,
      });
    else
      Object.assign(spec, {
        title: seg + " daily driver",
        line: "Reliable for the commute. Nothing fancy.",
        segment: m.segment,
        shapes: [m.shape],
        grade: "driver",
        mileage: 170000,
      });
  }
  return spec;
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
          NG.requestSpec(q).title +
          ". -1 reputation; no cash penalty.",
      );
    }
  }
  // Local invitations retired in v0.11. Up to two invitations wait at once.
  if (
    s.day >= o.nextRequestDay &&
    o.requests.filter((q) => q.status === "offered").length < 2 &&
    rng() < 0.35
  ) {
    const spec = NG.generateRequest(s, rng);
    o.requests.push({
      id: "request-" + s.nextId++,
      kind: "custom",
      spec,
      status: "offered",
      day: s.day,
      offerUntil: s.day + 2,
    });
    o.nextRequestDay = s.day + 3;
    o.notices.push(
      "Buyer request: " + spec.title + ". Reply by " + NG.date(s.day + 2) + ".",
    );
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
