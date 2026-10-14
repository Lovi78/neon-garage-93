/* v0.14 day rhythm and cuts: weekly rent, skip-to-event, one-click closing,
   solo owner without an hour limit, and switching an old save. */
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
const setup = (seed = 42) => {
  const rng = random(seed),
    N = runtime(rng);
  return { N, s: N.newState(), rng };
};
const quiet = (s) => {
  // No market noise: keep these tests about bills and timing.
  s.market = [];
  s.business.adActive = false;
};
const reconciled = (s) =>
  assert.equal(s.cash, 5000 + s.ledger.reduce((n, l) => n + l.amount, 0));

test("New games use v0.14 rules; v0.13 tests can still switch them off", () => {
  const { N, s } = setup();
  assert.deepEqual(JSON.parse(JSON.stringify(s.flow)), {
    version: 14,
    weeklyRent: true,
    ownerHours: false,
    staff: false,
    sideBusiness: false,
  });
  N.newGameFlow = false;
  assert.equal(N.newState().flow, undefined);
});
test("June 1, 1993 is a Tuesday: rent is paid on Fridays", () => {
  const { N } = setup();
  assert.equal(N.dayOfWeek(0), 2);
  assert.deepEqual(
    [0, 1, 2, 3, 4, 10].map((d) => N.isRentDay(d)),
    [false, false, false, true, false, true],
  );
});
test("Weekly rent: same bills, one payment on Friday, cash reconciles", () => {
  const { N, s } = setup();
  quiet(s);
  const rng = () => 0.99;
  N.nextDay(s, rng); // Wednesday
  N.nextDay(s, rng); // Thursday
  assert.equal(s.ledger.filter((l) => l.type === "overhead").length, 0);
  assert.equal(s.operations.weekDue, 40);
  assert.match(s.operations.notice, /Rent due .*\$60 expected/);
  N.nextDay(s, rng); // Friday
  const paid = -s.ledger
    .filter((l) => l.type === "overhead")
    .reduce((n, l) => n + l.amount, 0);
  assert.equal(paid, 60);
  assert.equal(s.operations.weekDue, 0);
  assert.match(s.operations.notice, /Weekly rent: \$60 paid/);
  for (let i = 0; i < 7; i++) N.nextDay(s, rng);
  const total = -s.ledger
    .filter((l) => l.type === "overhead")
    .reduce((n, l) => n + l.amount, 0);
  assert.equal(total, 60 + 140, "the week costs what seven daily bills cost");
  reconciled(s);
});
test("Unpaid rent becomes overdue and blocks purchases like before", () => {
  const { N, s } = setup();
  quiet(s);
  s.cash = 0;
  s.ledger.push({ day: 0, type: "test", amount: -5000, description: "x" });
  for (let i = 0; i < 3; i++) N.nextDay(s, () => 0.99);
  assert.equal(s.operations.arrears, 60);
  assert.match(s.operations.notice, /overdue/);
});
test("Bill forecast: nothing leaves cash before Friday; Friday shows the rent", () => {
  const { N, s } = setup();
  quiet(s);
  assert.equal(N.knownDailyBills(s, 1), 0);
  assert.equal(N.knownDailyBills(s, 3), 60);
  assert.equal(N.rentForecast(s), 60);
  const runway = N.cashRunway(s);
  assert(runway > 230 && runway < 260, "runway " + runway); // $5,000 at $20 a day
});
test("Solo owner has no daily work-hour limit", () => {
  const { N, s } = setup();
  s.cash = 100000;
  for (const c of s.market.slice(0, 6)) N.inspect(s, c.id);
  assert(s.market.slice(0, 6).every((c) => c.inspected));
});
test("Closing needs confirmation only when an unseen offer or a due request would be lost", () => {
  const { N, s } = setup();
  const c = s.market[0];
  s.cash = 20000;
  N.buy(s, c.id);
  assert(!N.closeDayNeedsConfirm(s));
  c.offers = [
    { id: "o1", buyer: "Pat", price: 3000, expiresDay: 0, seen: false },
  ];
  assert(N.closeDayNeedsConfirm(s));
  c.offers[0].seen = true;
  assert(!N.closeDayNeedsConfirm(s), "a seen offer was a choice, not a loss");
  s.opportunities.requests.push({
    id: "r",
    kind: "japan",
    status: "active",
    deadline: 0,
  });
  assert(N.closeDayNeedsConfirm(s));
});
test("Skip to next event stops on a finished repair, at most seven days", () => {
  const { N, s } = setup();
  s.cash = 20000;
  const c = s.market[0];
  N.buy(s, c.id);
  c.readyDay = 4;
  c.repairMode = "rush";
  const r = N.waitForEvent(s, () => 0.99);
  assert.equal(s.day, 3);
  assert.equal(r.days, 3);
  assert.match(r.reason, /financial event/);
  const finished = N.waitForEvent(s, () => 0.99);
  assert.equal(s.day, 4);
  assert.match(finished.reason, /repair is finished/);
  const r2 = N.waitForEvent(s, () => 0.99);
  assert(r2.days <= 7);
  assert.equal(s.dayReport.skippedFrom, 4);
});
test("Skip stops when a buyer makes contact", () => {
  const { N, s } = setup();
  s.cash = 20000;
  const c = s.market[0];
  N.buy(s, c.id);
  N.list(s, c.id, Math.round(N.listingValue(s, c) * 0.9), "as-is");
  const r = N.waitForEvent(s, random(4));
  assert.match(r.reason, /buyer made contact|request|level/);
  assert(r.days <= 7);
});
test("Only complaints and request news open the full morning report", () => {
  const { N } = setup();
  assert(
    !N.dayReportImportant({
      newClaims: [],
      expiredClaims: [],
      localNotices: [],
    }),
  );
  assert(
    N.dayReportImportant({
      newClaims: [{}],
      expiredClaims: [],
      localNotices: [],
    }),
  );
  assert(
    N.dayReportImportant({
      newClaims: [],
      expiredClaims: [],
      localNotices: ["Buyer request: Weekend fun car. Reply by June 3."],
    }),
  );
});
for (const file of ["v013-solo-save.json", "v013-staff-save.json"])
  test("Old save keeps v0.13 rules until switched: " + file, () => {
    const N = runtime(random(9));
    N.save(JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", file))));
    const s = N.load();
    assert.equal(s.flow, undefined);
    if (s.management.staff.length) {
      assert.deepEqual([...N.flowBlockers(s)], ["staff on payroll"]);
      assert.throws(() => N.adoptFlowRules(s), /staff on payroll/);
    } else {
      assert.match(N.adoptFlowRules(s), /Switched to v0.14 rules/);
      assert(s.flow.weeklyRent);
      const cash = s.cash - s.ledger.reduce((n, l) => n + l.amount, 0);
      for (let i = 0; i < 10; i++) N.nextDay(s, random(i));
      assert.equal(s.cash, cash + s.ledger.reduce((n, l) => n + l.amount, 0));
      assert.throws(() => N.adoptFlowRules(s), /already/);
    }
  });
test("F/3: buyer questions are answered with the best answer you can prove", () => {
  const { N, s } = setup();
  s.cash = 20000;
  const c = s.market[0];
  N.buy(s, c.id);
  assert.equal(N.bestBuyerAnswer(c), "as-is");
  c.inspected = true;
  assert.equal(N.bestBuyerAnswer(c), "condition");
  N.list(s, c.id, Math.round(N.listingValue(s, c) * 0.8), "honest");
  let asked = 0;
  for (let i = 0; i < 20 && !asked; i++) {
    N.nextDay(s, random(100 + i));
    asked = c.offers.filter((o) => o.autoAnswered).length;
    assert(c.offers.every((o) => o.stage !== "question"));
  }
  assert(asked > 0, "no inquiry arrived in 20 days");
});
console.log(count + " day rhythm tests passed.");
