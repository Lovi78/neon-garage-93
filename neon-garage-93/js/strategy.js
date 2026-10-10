window.NG = window.NG || {};
NG.planWave = (rng = Math.random) => ({
  segment: ["japan", "europe", "america"][Math.min(2, Math.floor(rng() * 3))],
  multiplier:
    Math.round(
      (rng() < 0.5 ? 1 - (0.12 + rng() * 0.18) : 1 + (0.12 + rng() * 0.18)) *
        100,
    ) / 100,
  duration: 2 + Math.min(2, Math.floor(rng() * 3)),
});
NG.ensureStrategy = (s) => {
  s.operations = {
    arrears: 0,
    lastPaid: 0,
    lastBill: 0,
    notice: null,
    ...s.operations,
  };
  if (!s.marketTrends) {
    s.marketTrends = {
      waves: Object.fromEntries(
        Object.entries(s.demand).map(([key, value]) => [
          key,
          { multiplier: value, remaining: 1 },
        ]),
      ),
      next: NG.planWave(),
      history: [{ day: s.day, ...s.demand }],
    };
  }
  return s;
};
NG.advanceMarket = (s, rng = Math.random) => {
  NG.ensureStrategy(s);
  const t = s.marketTrends,
    wave = t.next;
  for (const [key, value] of Object.entries(t.waves)) {
    value.remaining = Math.max(0, value.remaining - 1);
    if (!value.remaining) value.multiplier = 1;
  }
  t.waves[wave.segment] = {
    multiplier: wave.multiplier,
    remaining: wave.duration,
  };
  for (const key of ["japan", "europe", "america"])
    s.demand[key] =
      Math.round(
        NG.clamp(t.waves[key].multiplier + (rng() - 0.5) * 0.04, 0.7, 1.35) *
          100,
      ) / 100;
  t.next = NG.planWave(rng);
  t.history.push({ day: s.day, ...s.demand });
  t.history = t.history.slice(-30);
  const name = { japan: "Japanese", europe: "European", america: "American" }[
      wave.segment
    ],
    change = Math.round((wave.multiplier - 1) * 100);
  s.event = {
    kind: "trend",
    title: name + " market " + (change > 0 ? "heats up" : "cools down"),
    text:
      "A " +
      (change > 0 ? "+" : "") +
      change +
      "% demand wave is expected to last " +
      wave.duration +
      " days. Other active trends continue; daily noise adds risk.",
  };
};
NG.operatingBill = (s) => 20 + s.inventory.length * 5;
NG.operateDay = (s) => {
  NG.ensureStrategy(s);
  const o = s.operations;
  o.lastBill = NG.operatingBill(s);
  o.arrears += o.lastBill;
  o.lastPaid = Math.min(s.cash, o.arrears);
  s.cash -= o.lastPaid;
  o.arrears -= o.lastPaid;
  if (o.lastPaid)
    NG.record(
      s,
      "overhead",
      -o.lastPaid,
      "Rent, utilities and stock holding / operating bills",
    );
  o.notice =
    "Operating bills: " +
    NG.money(o.lastPaid) +
    " paid" +
    (o.arrears
      ? ", " +
        NG.money(o.arrears) +
        " still overdue. New purchases and repairs are blocked."
      : ".");
};
NG.payOperatingBills = (s) => {
  if (!s.operations.arrears) throw Error("No overdue operating bills.");
  if (!s.cash)
    throw Error(
      "No cash available. You can sell an existing car to raise funds.",
    );
  const paid = Math.min(s.cash, s.operations.arrears);
  s.cash -= paid;
  s.operations.arrears -= paid;
  NG.record(s, "overhead", -paid, "Overdue operating bills");
  return NG.money(paid) + " paid toward operating bills.";
};
NG.inspectionPrice = (s) =>
  Math.max(
    20,
    Math.round(
      (1 - Math.min(0.5, NG.localEffect?.(s, "inspection") || 0)) *
        Math.max(
          30,
          Math.round(
            90 *
              (1 - (s.progress?.mechanical || 0) * 0.15) *
              (s.business?.diagnostics ? 0.8 : 1),
          ),
        ),
    ),
  );
NG.workshopBusy = (s) =>
  s.inventory.filter((c) => NG.busy(s, c) && c.repairMode !== "rush").length;
NG.repairDuration = (s, part, mode) =>
  mode === "rush" ||
  (s.progress?.mechanical || 0) >= 2 ||
  ((NG.localEffect?.(s, "fast") || 0) &&
    ["engine", "transmission"].includes(part))
    ? 1
    : ["engine", "transmission"].includes(part)
      ? 2
      : 1;
NG.trainSkill = (s, skill) => {
  if (!["mechanical", "market"].includes(skill)) throw Error("Unknown skill.");
  if (s.progress[skill] >= 3) throw Error("This skill is at maximum rank.");
  if (s.progress.points < 1) throw Error("You need one skill point.");
  s.progress.points--;
  s.progress[skill]++;
  return (
    (skill === "mechanical" ? "Mechanical Knowledge" : "Market Knowledge") +
    " trained to rank " +
    s.progress[skill] +
    "."
  );
};
NG.unlockSpecialist = (s, perk) => {
  const skill = { sharpEye: "mechanical", trendSpotter: "market" }[perk];
  if (!skill) throw Error("Unknown perk.");
  if (s.progress[perk]) throw Error("Perk already unlocked.");
  if (s.progress[skill] < 2 || s.progress.points < 1)
    throw Error("Reach skill rank 2 and keep one skill point.");
  s.progress.points--;
  s.progress[perk] = true;
  return perk === "sharpEye"
    ? "Sharp Eye unlocked: a free pre-purchase fault clue."
    : "Trend Spotter unlocked: see the next planned demand wave.";
};
