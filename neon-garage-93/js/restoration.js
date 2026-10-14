/* v0.14 CUT & FLOW - repair packages.
   One decision ("how far do I take this car?") and one workshop booking instead
   of five part bookings. The five part levels stay in the save; packages only
   decide which levels to raise. Quotes use public information only: observed
   condition and revealed faults. Hidden faults on parts the crew works on are
   found during the job and fixed at parts cost. */
window.NG = window.NG || {};
(() => {
  NG.repairPackages = [
    {
      id: "quick",
      label: "Quick fix",
      short: "Known faults + detailing",
      target: 0,
      cosmetic: 75,
      days: 0, // same-day job: list it today
    },
    {
      id: "driver",
      label: "Driver-ready",
      short: "Every part 75+, known faults fixed",
      target: 75,
      days: 1,
    },
    {
      id: "full",
      label: "Full restoration",
      short: "Every part 95, known faults fixed",
      target: 95,
      days: 3,
    },
  ];
  // One teardown instead of five: package labor is cheaper than part-by-part.
  NG.packageLaborShare = 0.58;

  const pkgById = (id) => {
    const p = NG.repairPackages.find((p) => p.id === id);
    if (!p) throw Error("Choose a valid repair package.");
    return p;
  };
  const targetFor = (p, part) =>
    Math.max(p.target, part === "cosmetic" ? p.cosmetic || 0 : 0);

  // Which parts a package raises, and to what level.
  NG.packagePlan = (c, id) => {
    const p = pkgById(id),
      known = (part) =>
        c.flaws.filter((f) => f.part === part && f.revealed && !f.fixed);
    return Object.keys(NG.parts)
      .map((part) => ({
        part,
        from: c.parts[part],
        to: Math.max(c.parts[part], targetFor(p, part)),
        faults: known(part),
      }))
      .filter((w) => w.to > w.from || w.faults.length);
  };

  const workPrice = (s, c, plan, mode) => {
    const service = NG.model(c).service || 1;
    let labor = 0,
      parts = 0;
    for (const w of plan) {
      const base = Math.ceil((w.to - w.from) * NG.parts[w.part].rate * service);
      labor += base * 0.65 * NG.packageLaborShare;
      parts += base * 0.35 + w.faults.reduce((n, f) => n + f.cost, 0);
    }
    const price =
      Math.round(
        labor *
          (s?.business?.tools ? 0.85 : 1) *
          (1 - (s?.progress?.mechanical || 0) * 0.05),
      ) + Math.round(parts * (s?.business?.supplier ? 0.8 : 1));
    return (
      price + (mode === "rush" ? Math.max(80, Math.round(price * 0.25)) : 0)
    );
  };

  NG.packageDays = (s, id, mode = "standard") => {
    const d = pkgById(id).days,
      skilled = (s.progress?.mechanical || 0) >= 2 ? 1 : 0;
    return mode === "rush"
      ? Math.max(1, Math.ceil(d / 2))
      : Math.max(d ? 1 : 0, d - skilled);
  };

  // Public preview: cost, time, grade and expected sale value before/after.
  NG.packageQuote = (s, c, id, mode = "standard") => {
    const p = pkgById(id),
      plan = NG.packagePlan(c, id);
    const after = JSON.parse(JSON.stringify(c));
    for (const w of plan) {
      after.parts[w.part] = w.to;
      after.flaws
        .filter((f) => f.part === w.part && f.revealed)
        .forEach((f) => (f.fixed = true));
    }
    // Uninspected cars are judged on the seller's claim, raised by the work done.
    if (!c.inspected) after.claim = Math.max(c.claim, NG.condition(after));
    const cost = workPrice(s, c, plan, mode),
      days = NG.packageDays(s, id, mode),
      before = NG.estimate(s, c),
      expected = NG.estimate(s, after),
      observed = c.inspected ? NG.condition(c) : c.claim,
      observedAfter = c.inspected ? NG.condition(after) : after.claim;
    return {
      id,
      label: p.label,
      short: p.short,
      available: plan.length > 0,
      reason: plan.length ? "" : "Nothing left for this package to fix.",
      plan,
      cost,
      days,
      gradeBefore: NG.gradeFor(observed),
      gradeAfter: NG.gradeFor(observedAfter),
      estimateBefore: before,
      estimateAfter: expected,
      // Holding cost while the car sits in the workshop is part of the decision.
      profitChange: expected - before - cost - days * 5,
    };
  };

  /* Recommendation: profit per day the car is tied up, not raw profit.
     A flip already ties a garage slot up for a few days (listing, buyers), so
     workshop days are added to that cycle. Raw profit always favoured Full
     restoration, even on cheap cars where it ties the slot up for 3 days. */
  NG.saleCycleDays = 2; // tuned in tests/repair-simulation.cjs: 1-2 days best (80 seeds)
  NG.packageScore = (q) => q.profitChange / (q.days + NG.saleCycleDays);
  NG.recommendPackage = (s, c, mode = "standard") =>
    NG.repairPackages
      .map((p) => NG.packageQuote(s, c, p.id, mode))
      .filter((q) => q.available && q.profitChange > 0)
      .sort((a, b) => NG.packageScore(b) - NG.packageScore(a))[0] || null;

  // Core work. Validation mirrors part repairs; time accounting lives in management.js.
  NG.applyRepairPackage = (s, id, pkg, mode = "standard") => {
    const c = s.inventory.find((c) => c.id === id);
    if (!c) throw Error("Invalid repair.");
    pkgById(pkg);
    if (!["standard", "rush"].includes(mode))
      throw Error("Choose a valid workshop mode.");
    if (s.operations?.arrears > 0)
      throw Error("Clear overdue operating bills before booking work.");
    if (mode === "standard" && NG.localWorkshopBlocked?.(s))
      throw Error(
        "Today’s local event prevents new in-house bookings. Outsourced rush is still available.",
      );
    if (
      mode === "standard" &&
      NG.workshopBusy(s) >= (NG.workshopCapacity?.(s) || 1)
    )
      throw Error(
        "Your in-house workshop is occupied. Wait or outsource a rush repair.",
      );
    if (NG.busy(s, c)) throw Error("This car is still in the workshop.");
    if (c.listed) throw Error("Remove the listing before making repairs.");
    const q = NG.packageQuote(s, c, pkg, mode);
    if (!q.available) throw Error(q.reason);
    if (s.cash < q.cost)
      throw Error("You do not have enough cash for this package.");
    let cost = q.cost,
      found = [];
    s.cash -= cost;
    // Faults hidden in the parts the crew opens up are found and fixed now.
    const touched = new Set(q.plan.map((w) => w.part));
    for (const f of c.flaws.filter(
      (f) => touched.has(f.part) && !f.revealed && !f.fixed,
    )) {
      f.revealed = true;
      if (s.cash >= f.cost) {
        s.cash -= f.cost;
        cost += f.cost;
        f.fixed = true;
        found.push(f.label + " (+" + NG.money(f.cost) + ")");
      } else found.push(f.label + " (not fixed: not enough cash)");
    }
    for (const w of q.plan) {
      c.parts[w.part] = w.to;
      w.faults.forEach((f) => (f.fixed = true));
    }
    c.repairCost += cost;
    c.repairMode = mode;
    c.repairPackage = pkg;
    c.readyDay = s.day + q.days;
    c.pendingCollectionRepair = true;
    c.offers = [];
    NG.record(s, "repair", -cost, NG.model(c).name + " - " + q.label);
    return (
      q.label +
      " booked. Ready in " +
      q.days +
      " day(s). Expected grade: " +
      NG.grade(c).label +
      "." +
      (found.length ? " Found during the job: " + found.join(", ") + "." : "")
    );
  };

  // Standard bookings take the owner's (or an auto mechanic's) time; rush is outsourced.
  NG.repairPackage = (s, id, pkg, mode = "standard") => {
    if (mode === "rush") {
      const result = NG.applyRepairPackage(s, id, pkg, "rush");
      const c = s.inventory.find((c) => c.id === id);
      if (c) c.assignedWorker = "outsourced";
      return result;
    }
    if (!NG.performWork) return NG.applyRepairPackage(s, id, pkg, mode);
    const w = NG.ensureManagement(s).staff.find(
      (w) => w.role === "mechanic" && w.auto && w.used + 3 <= NG.workerHours(w),
    );
    return NG.performWork(s, "restore", id, w?.id || "owner", pkg);
  };

  /* Buyers react to grades, not to single points.
     Enthusiasts pay extra for a Showroom (excellent) sports car or roadster.
     Budget shoppers will not pay for anything above Runner condition. */
  NG.gradeReaction = (s, c, kind) => {
    const condition = NG.condition(c),
      g = NG.gradeFor(condition),
      shape = NG.model(c).shape;
    if (
      kind === "enthusiast" &&
      g.id === "excellent" &&
      ["sport", "roadster"].includes(shape)
    )
      return 1.07;
    if (kind === "budget" && condition >= 75)
      return NG.conditionFactor(74) / NG.conditionFactor(condition);
    return 1;
  };
  const makeBuyer = NG.makeBuyer;
  NG.makeBuyer = (s, c, rng = Math.random) => {
    const o = makeBuyer(s, c, rng),
      m = NG.gradeReaction(s, c, o.profile.id);
    if (m === 1) return o;
    o.profile.budget = Math.round(o.profile.budget * m);
    o.profile.gradeReaction = m;
    const opening = Math.min(
      c.listPrice,
      Math.round(o.profile.budget * (c.inspected ? 0.96 : 0.94)),
    );
    o.price = o.openingPrice = opening;
    if (o.stage === "offer")
      o.message = "I could offer " + NG.money(opening) + ".";
    return o;
  };
})();
