/* v0.14 CUT & FLOW - day rhythm and cuts (audit F/2, F/5).
   New games start with s.flow. Old saves keep their v0.13 rules until the
   player switches (NG.adoptFlowRules), because staff and side businesses
   they already run must keep working.
   - weeklyRent: daily bills accrue and are paid on Fridays.
   - ownerHours false: the solo owner has no 8-hour work limit.
   - staff / sideBusiness false: hiring, Wholesale Desk and Fleet Workshop
     stay out of the menus until the dealership grows (M3). */
window.NG = window.NG || {};
(() => {
  NG.newGameFlow = true; // tests of the v0.13 systems switch this off
  NG.flowDefaults = () => ({
    version: 14,
    weeklyRent: true,
    ownerHours: false,
    staff: false,
    sideBusiness: false,
  });
  const newState = NG.newState;
  NG.newState = () => {
    const s = newState();
    if (NG.newGameFlow) {
      s.flow = NG.flowDefaults();
      s.operations.weekDue = 0;
    }
    return s;
  };
  NG.flowOn = (s, key) => !!s.flow && s.flow[key] !== false && !!s.flow[key];
  NG.flowHides = (s, key) => !!s.flow && s.flow[key] === false;

  // An old save can switch when nothing it runs would be cut away.
  NG.flowBlockers = (s) => {
    const out = [];
    if (NG.ensureManagement?.(s).staff.length) out.push("staff on payroll");
    for (const id of ["wholesale", "fleet"])
      if (
        ["active", "building", "paused"].includes(
          s.enterprise?.projects[id]?.status,
        )
      )
        out.push(NG.enterpriseProjects.find((p) => p.id === id).name);
    if ((s.enterprise?.lots || []).some((l) => l.status === "running"))
      out.push("open wholesale lots");
    return out;
  };
  NG.adoptFlowRules = (s) => {
    if (s.flow) throw Error("This save already uses the v0.14 rules.");
    const blockers = NG.flowBlockers(s);
    if (blockers.length)
      throw Error("Finish or close first: " + blockers.join(", ") + ".");
    s.flow = NG.flowDefaults();
    s.operations.weekDue = 0;
    return "Switched to v0.14 rules: weekly rent on Fridays, no daily work-hour limit, staff and side businesses tucked away.";
  };

  // June 1, 1993 was a Tuesday. 0 = Sunday ... 5 = Friday.
  NG.dayOfWeek = (day) => (2 + day) % 7;
  NG.isRentDay = (day) => NG.dayOfWeek(day) === 5;
  NG.nextRentDay = (s) => {
    let d = s.day + 1;
    while (!NG.isRentDay(d)) d++;
    return d;
  };
  NG.dailyRentRate = (s) => NG.operatingBill(s);
  // Rent that will be charged on the next Friday if nothing changes.
  NG.rentForecast = (s) =>
    (s.operations.weekDue || 0) +
    NG.dailyRentRate(s) * (NG.nextRentDay(s) - s.day);

  // Bills that leave cash on a given day: with weekly rent only Fridays charge.
  const knownDailyBills = NG.knownDailyBills;
  NG.knownDailyBills = (s, day) => {
    if (!NG.flowOn(s, "weeklyRent")) return knownDailyBills(s, day);
    const daily = NG.operatingBill(s),
      other = Math.max(0, knownDailyBills(s, day) - daily);
    if (!NG.isRentDay(day)) return other;
    const first = day === NG.nextRentDay(s);
    return (
      other +
      (first ? (s.operations.weekDue || 0) + daily * (day - s.day) : daily * 7)
    );
  };

  /* Skip quiet days: advance until something needs the player, at most
     `max` days. Stops on new offers or inquiries, finished repairs, new or
     due buyer requests, new complaints, overdue bills, or a level-up. */
  NG.waitStop = (s, before) => {
    const offers = s.inventory.flatMap((c) => c.offers.map((o) => o.id));
    if (offers.some((id) => !before.offers.includes(id)))
      return "A buyer made contact.";
    if (
      before.busy.some((id) =>
        s.inventory.some((c) => c.id === id && !NG.busy(s, c)),
      )
    )
      return "A repair is finished.";
    const q = s.opportunities?.requests || [];
    if (
      q.some((r) => r.status === "offered" && !before.requests.includes(r.id))
    )
      return "A new buyer request arrived.";
    if (q.some((r) => r.status === "active" && r.deadline <= s.day))
      return "A buyer request is due today.";
    if ((s.claims || []).some((c) => !before.claims.includes(c.id)))
      return "A customer complaint needs an answer.";
    if (s.operations.arrears > 0) return "Bills are overdue.";
    if ((s.progress?.level || 0) > before.level) return "You levelled up.";
    return "";
  };
  NG.waitSnapshot = (s) => ({
    offers: s.inventory.flatMap((c) => c.offers.map((o) => o.id)),
    busy: s.inventory.filter((c) => NG.busy(s, c)).map((c) => c.id),
    requests: (s.opportunities?.requests || []).map((r) => r.id),
    claims: (s.claims || []).map((c) => c.id),
    level: s.progress?.level || 0,
  });
  NG.waitForEvent = (s, rng = Math.random, max = 7) => {
    let days = 0,
      reason = "",
      report = null;
    const start = s.day;
    while (days < max && !reason) {
      const before = NG.waitSnapshot(s);
      report = NG.nextDay(s, rng);
      days++;
      reason = NG.waitStop(s, before);
    }
    if (s.dayReport) s.dayReport.skippedFrom = start;
    return {
      days,
      reason: reason || "Nothing happened for " + max + " days.",
      report,
    };
  };

  /* F/3: buyer questions are answered at once with the strongest true
     answer you can back up, so the player sees offers, not homework. */
  NG.bestBuyerAnswer = (c) =>
    c.inspected
      ? "condition"
      : c.vehicleHistory?.historyChecked && c.vehicleHistory.records
        ? "records"
        : "as-is";
  const advanceBuyers = NG.advanceBuyers;
  NG.advanceBuyers = (s, c, rng) => {
    const r = advanceBuyers(s, c, rng);
    if (s.flow)
      for (const o of c.offers)
        if (o.stage === "question" && o.expiresDay >= s.day) {
          NG.answerBuyer(s, c.id, o.id, NG.bestBuyerAnswer(c));
          o.autoAnswered = true;
        }
    return r;
  };
  // A closing needs the player's confirmation only when something is lost.
  NG.closeDayWarnings = (s) => ({
    offers: s.inventory.flatMap((c) =>
      c.offers
        .filter(
          (o) =>
            o.seen !== true && (o.expiresDay == null || o.expiresDay <= s.day),
        )
        .map((o) => ({ car: NG.model(c).name, buyer: o.buyer })),
    ),
    requests: (s.opportunities?.requests || []).filter(
      (q) => q.status === "active" && q.deadline <= s.day,
    ),
  });
  NG.closeDayNeedsConfirm = (s) => {
    const w = NG.closeDayWarnings(s);
    return w.offers.length > 0 || w.requests.length > 0;
  };
  // Only events the player must act on open the full report.
  NG.dayReportImportant = (r) =>
    !!r &&
    ((r.newClaims || []).length > 0 ||
      (r.expiredClaims || []).length > 0 ||
      (r.localNotices || []).some((n) => /request|lead/i.test(n)));
})();
