/* v0.14 repair economy: condition grades, packages, buyer reactions, old saves. */
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { runtime, random } = require("./runtime.cjs");
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
function setup(seed = 42) {
  const rng = random(seed),
    N = runtime(rng),
    s = N.newState();
  return { N, s, rng };
}
function owned(N, s, parts, model = "e30") {
  const c = N.generateCar(
    s,
    N.catalog.findIndex((m) => m.id === model),
    random(5),
  );
  c.parts = { ...parts };
  c.flaws = [];
  c.inspected = true;
  s.market.push(c);
  s.cash = 50000;
  N.buy(s, c.id);
  return c;
}
const even = (n) => ({
  engine: n,
  transmission: n,
  suspension: n,
  body: n,
  cosmetic: n,
});
// Values from the vm context live in another realm; compare plain copies.
const plain = (v) => JSON.parse(JSON.stringify(v));
const reconciled = (N, s, start) =>
  assert.equal(s.cash, start + s.ledger.reduce((n, l) => n + l.amount, 0));

test("Grades follow the published thresholds", () => {
  const { N } = setup();
  const g = (c) => N.gradeFor(c).label;
  assert.deepEqual([54, 55, 74, 75, 89, 90, 95].map(g), [
    "Rough",
    "Driver",
    "Driver",
    "Clean",
    "Clean",
    "Excellent",
    "Excellent",
  ]);
});
test("Value jumps at a grade threshold more than inside a grade", () => {
  const { N } = setup();
  const f = N.conditionFactor;
  for (const t of [55, 75, 90]) {
    const jump = f(t) - f(t - 1),
      inside = f(t + 1) - f(t);
    assert(jump > inside * 8, "threshold " + t + " is not a step");
  }
  // Mid-grade values stay close to the old straight line, so plain flipping keeps its economy.
  for (const c of [45, 65, 82, 95])
    assert(Math.abs(f(c) - (0.3 + 0.007 * c)) < 0.002);
});
test("Packages raise the right parts and cost less than part-by-part work", () => {
  const { N, s } = setup();
  const c = owned(N, s, {
    engine: 50,
    transmission: 80,
    suspension: 60,
    body: 70,
    cosmetic: 40,
  });
  c.flaws = [{ ...N.flaws[2], fixed: false, revealed: true }];
  const quick = N.packageQuote(s, c, "quick"),
    driver = N.packageQuote(s, c, "driver"),
    full = N.packageQuote(s, c, "full");
  assert.deepEqual(plain(quick.plan.map((w) => w.part + ">" + w.to)), [
    "suspension>60",
    "cosmetic>75",
  ]);
  assert.deepEqual(plain(driver.plan.map((w) => w.part + ">" + w.to)), [
    "engine>75",
    "suspension>75",
    "body>75",
    "cosmetic>75",
  ]);
  assert(full.plan.every((w) => w.to === 95));
  assert.equal(driver.gradeAfter.label, "Clean");
  assert.equal(full.gradeAfter.label, "Excellent");
  assert(quick.cost < driver.cost && driver.cost < full.cost);
  assert.deepEqual([quick.days, driver.days, full.days], [0, 1, 3]);
  const partByPart = Object.keys(N.parts).reduce(
    (n, p) => n + N.repairQuote(c, p, s),
    0,
  );
  assert(full.cost < partByPart, "a package must beat five bookings");
  assert.equal(
    full.profitChange,
    full.estimateAfter - full.estimateBefore - full.cost - full.days * 5,
  );
});
test("Restoring a cheap car loses money; restoring a desirable car pays", () => {
  const { N, s } = setup();
  const volvo = owned(N, s, even(58), "volvo"),
    supra = owned(N, s, even(58), "supra");
  volvo.year = supra.year = 1990;
  volvo.mileage = supra.mileage = 90000;
  assert(N.packageQuote(s, volvo, "full").profitChange < 0);
  assert(
    N.packageQuote(s, volvo, "driver").profitChange >
      N.packageQuote(s, volvo, "full").profitChange,
  );
  assert(N.packageQuote(s, supra, "full").profitChange > 0);
  assert(
    N.packageQuote(s, supra, "full").profitChange >
      N.packageQuote(s, supra, "driver").profitChange,
  );
});
test("Recommendation weighs days: Driver-ready can beat a bigger but slower Full", () => {
  const { N, s } = setup();
  let slowerLoses = 0,
    fullWins = 0,
    none = 0;
  for (const m of N.catalog) {
    const c = owned(N, s, even(58), m.id);
    c.year = m.years[1];
    c.mileage = 90000;
    const d = N.packageQuote(s, c, "driver"),
      f = N.packageQuote(s, c, "full"),
      pick = N.recommendPackage(s, c);
    if (!pick) none++;
    else if (pick.id === "full") fullWins++;
    else if (pick.id === "driver" && f.profitChange > d.profitChange)
      slowerLoses++;
    if (pick)
      assert.equal(
        pick.id,
        [d, f, N.packageQuote(s, c, "quick")]
          .filter((q) => q.profitChange > 0)
          .sort((a, b) => N.packageScore(b) - N.packageScore(a))[0].id,
      );
    N.sell(s, c.id, "dealer");
  }
  assert(
    slowerLoses > 0,
    "no car where per-day choice differs from raw profit",
  );
  assert(fullWins > 0, "Full restoration is never recommended");
});
test("A package is one booking: cash, ledger, parts, faults and owner time", () => {
  const { N, s } = setup();
  const c = owned(N, s, even(60));
  c.flaws = [{ ...N.flaws[0], fixed: false, revealed: true }];
  const q = N.packageQuote(s, c, "driver"),
    before = s.cash,
    hours = s.management.ownerUsed;
  const msg = N.repairPackage(s, c.id, "driver");
  assert.match(msg, /Driver-ready booked/);
  assert.equal(s.cash, before - q.cost);
  assert.equal(c.repairCost, q.cost);
  assert.equal(s.ledger[0].type, "repair");
  assert(Object.values(c.parts).every((p) => p >= 75));
  assert(c.flaws[0].fixed);
  assert.equal(N.grade(c).label, "Clean");
  assert.equal(s.management.ownerUsed, hours + 3);
  assert(N.busy(s, c));
  assert.throws(() => N.repairPackage(s, c.id, "full"), /workshop/);
  N.nextDay(s, random(3));
  assert(!N.busy(s, c));
});
test("Quick fix is a same-day job that can be listed at once", () => {
  const { N, s } = setup();
  const c = owned(N, s, even(65));
  c.flaws = [{ ...N.flaws[3], fixed: false, revealed: true }];
  N.repairPackage(s, c.id, "quick");
  assert(!N.busy(s, c));
  N.list(s, c.id, 5000, "honest");
  assert(c.listed);
  assert.throws(() => N.repairPackage(s, c.id, "driver"), /Remove the listing/);
});
test("Hidden faults in the parts being worked on are found and fixed at parts cost", () => {
  const { N, s } = setup();
  const c = owned(N, s, even(60));
  c.flaws = [{ ...N.flaws[1], fixed: false, revealed: false }];
  const q = N.packageQuote(s, c, "driver"),
    before = s.cash;
  const msg = N.repairPackage(s, c.id, "driver");
  assert.match(msg, /Found during the job: Worn transmission synchro/);
  assert.equal(s.cash, before - q.cost - c.flaws[0].cost);
  assert(c.flaws[0].fixed && c.flaws[0].revealed);
  // Quick fix does not open the gearbox, so it cannot find a gearbox fault.
  const d = owned(N, s, even(60));
  d.flaws = [{ ...N.flaws[1], fixed: false, revealed: false }];
  N.repairPackage(s, d.id, "quick", "rush");
  assert(!d.flaws[0].revealed);
});
test("Rush packages skip the bay and owner time but cost more", () => {
  const { N, s } = setup();
  const a = owned(N, s, even(60)),
    b = owned(N, s, even(60));
  N.repairPackage(s, a.id, "full");
  assert.throws(() => N.repairPackage(s, b.id, "full"), /occupied/);
  const used = s.management.ownerUsed,
    std = N.packageQuote(s, b, "full"),
    rush = N.packageQuote(s, b, "full", "rush");
  assert(rush.cost > std.cost && rush.days < std.days);
  N.repairPackage(s, b.id, "full", "rush");
  assert.equal(s.management.ownerUsed, used);
  assert.equal(b.assignedWorker, "outsourced");
});
test("Blocked bookings charge nothing", () => {
  const { N, s } = setup();
  const c = owned(N, s, even(96));
  const cash = s.cash;
  assert.throws(() => N.repairPackage(s, c.id, "full"), /Nothing left/);
  assert.throws(
    () => N.repairPackage(s, c.id, "bogus"),
    /valid repair package/,
  );
  const d = owned(N, s, even(50));
  s.operations.arrears = 10;
  assert.throws(() => N.repairPackage(s, d.id, "driver"), /overdue/);
  s.operations.arrears = 0;
  s.cash = 5;
  assert.throws(() => N.repairPackage(s, d.id, "driver"), /enough cash/);
  assert.equal(s.ledger.filter((l) => l.type === "repair").length, 0);
  assert(cash > 0);
});
test("Buyers react to grades: budget shoppers cap at Driver, enthusiasts pay for Excellent", () => {
  const { N, s } = setup();
  const sport = owned(N, s, even(95), "supra"),
    sedan = owned(N, s, even(95), "volvo");
  for (const c of [sport, sedan]) N.list(s, c.id, 99999, "honest");
  assert.equal(N.gradeReaction(s, sport, "enthusiast"), 1.07);
  assert.equal(N.gradeReaction(s, sedan, "enthusiast"), 1);
  const cap = N.gradeReaction(s, sedan, "budget");
  assert(cap > 0.8 && cap < 0.85);
  sedan.parts = even(70);
  assert.equal(N.gradeReaction(s, sedan, "budget"), 1);
  // The reaction is applied to real offers without consuming extra randomness.
  let seen = new Set();
  for (let i = 0; i < 40; i++) {
    const o = N.makeBuyer(s, sport, random(100 + i));
    if (o.profile.id === "enthusiast") {
      assert.equal(o.profile.gradeReaction, 1.07);
      seen.add("e");
    }
  }
  assert(seen.has("e"));
});
for (const file of ["v013-solo-save.json", "v013-staff-save.json"])
  test("Real v0.13 save loads and plays 30 days with packages: " + file, () => {
    const raw = fs.readFileSync(path.join(__dirname, "fixtures", file), "utf8");
    const rng = random(9),
      N = runtime(rng);
    N.save(JSON.parse(raw));
    const s = N.load();
    const old = JSON.parse(raw);
    assert.equal(s.cash, old.cash);
    assert.equal(s.inventory.length, old.inventory.length);
    assert.equal(s.management.staff.length, old.management.staff.length);
    assert.deepEqual(
      plain(s.inventory.map((c) => c.parts)),
      old.inventory.map((c) => c.parts),
    );
    const start = s.cash - s.ledger.reduce((n, l) => n + l.amount, 0);
    s.cash += 20000;
    s.ledger.unshift({
      day: s.day,
      type: "test",
      amount: 20000,
      description: "test funds",
    });
    let booked = 0;
    for (let d = 0; d < 30; d++) {
      if (s.operations.arrears && s.cash) N.payOperatingBills(s);
      if (s.management.unpaid && s.cash) N.payPayroll(s);
      for (const c of s.inventory)
        if (
          !N.busy(s, c) &&
          !c.listed &&
          N.packageQuote(s, c, "driver").available
        )
          try {
            N.repairPackage(s, c.id, "driver");
            booked++;
          } catch (e) {
            assert.match(e.message, /occupied|time|cash|overdue/);
          }
      N.nextDay(s, rng);
      reconciled(N, s, start);
    }
    N.save(s);
    assert.equal(N.load().cash, s.cash);
    assert(booked > 0 || s.inventory.every((c) => c.listed || N.busy(s, c)));
  });
console.log(count + " restoration tests passed.");
