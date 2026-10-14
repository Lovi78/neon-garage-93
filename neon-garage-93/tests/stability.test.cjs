const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { runtime, random, root } = require("./runtime.cjs");
let count = 0;
const test = (name, fn) => {
  fn();
  console.log("PASS " + name);
  count++;
};
function setup() {
  const storage = new Map(),
    N = runtime(random(42), storage),
    s = N.newState();
  s.cash = 50000;
  const c = s.market[0];
  N.buy(s, c.id);
  c.parts = Object.fromEntries(Object.keys(N.parts).map((p) => [p, 60]));
  c.flaws = [];
  c.inspected = true;
  return { N, s, c, storage };
}
for (const pkg of ["driver", "full"])
  test(
    pkg +
      ": booking leaves condition and asset value unchanged; completion once after reload",
    () => {
      const { N, s, c } = setup(),
        parts = JSON.stringify(c.parts),
        value = N.value(s, c),
        businessValue = N.businessValue(s),
        q = N.packageQuote(s, c, pkg);
      N.repairPackage(s, c.id, pkg);
      assert.equal(JSON.stringify(c.parts), parts);
      assert.equal(N.value(s, c), value);
      assert.equal(N.businessValue(s), businessValue - q.cost);
      const ledger = s.ledger.filter((l) => l.type === "repair").length;
      assert(N.save(s));
      const loaded = N.load(),
        car = loaded.inventory[0];
      while (N.busy(loaded, car)) N.nextDay(loaded, () => 0.99);
      assert(N.value(loaded, car) > value);
      assert(!car.pendingRepair);
      const done = JSON.stringify(car.parts);
      N.nextDay(loaded, () => 0.99);
      assert.equal(JSON.stringify(car.parts), done);
      assert.equal(
        loaded.ledger.filter((l) => l.type === "repair").length,
        ledger,
      );
      assert.equal(car.repairCost, q.cost);
    },
  );
test("Old bookings without a pending plan keep their already applied result", () => {
  const { N, s, c } = setup();
  delete s.flow;
  c.parts.engine = 95;
  c.readyDay = s.day + 1;
  c.pendingCollectionRepair = true;
  N.save(s);
  const l = N.load();
  N.nextDay(l, () => 0.99);
  assert.equal(l.inventory[0].parts.engine, 95);
});
test("Hidden fault with insufficient funds stays revealed and unfixed at completion", () => {
  const { N, s, c } = setup();
  c.flaws = [{ ...N.flaws[0], revealed: false, fixed: false }];
  s.cash = N.packageQuote(s, c, "driver").cost;
  N.repairPackage(s, c.id, "driver");
  assert(c.flaws[0].revealed);
  assert(!c.flaws[0].fixed);
  N.nextDay(s, () => 0.99);
  assert(!c.flaws[0].fixed);
  assert.equal(
    s.ledger.filter((l) => l.type === "repair")[0].amount,
    -c.repairCost,
  );
});
for (const seen of [true, false])
  test("Skip preserves existing offers, seen=" + seen, () => {
    const { N, s, c } = setup();
    c.offers = [{ id: "offer", price: 2000, expiresDay: 0, seen }];
    const cash = s.cash;
    const result = N.waitForEvent(s, () => 0.99);
    assert.equal(result.days, 0);
    assert.equal(s.day, 0);
    assert.equal(s.cash, cash);
    assert.equal(c.offers.length, 1);
  });
test("Skip stops at seller callback, agreement, claim, due request and cash shortage", () => {
  for (const kind of ["callback", "agreed", "claim", "request", "cash"]) {
    const { N, s } = setup();
    if (["callback", "agreed"].includes(kind))
      s.market[0].negotiation = { status: kind };
    if (kind === "claim") s.claims = [{ status: "open", deadline: 5 }];
    if (kind === "request")
      s.opportunities.requests = [{ id: "q", status: "active", deadline: 1 }];
    if (kind === "cash") {
      s.day = 2;
      s.cash = 0;
    }
    assert.equal(N.waitForEvent(s, () => 0.99).days, 0, kind);
  }
});
test("Skip checks again after each day; a seller callback arriving tomorrow is retained", () => {
  const { N, s } = setup();
  const seller = s.market[0];
  seller.negotiation = {
    schema: 12,
    status: "waiting",
    resumeDay: 1,
    walked: false,
  };
  const result = N.waitForEvent(s, () => 0.99);
  assert.equal(result.days, 1);
  assert.equal(seller.negotiation.status, "callback");
});
test("Unreadable startup save survives automatic writes and rejected imports", () => {
  const storage = new Map(),
    N = runtime(random(1), storage);
  storage.set(N.saveKey, "{broken");
  const s = N.load();
  assert(N.loadError);
  assert.equal(N.save(s), false);
  assert.equal(storage.get(N.saveKey), "{broken");
  assert.throws(() => N.importSave("{bad"));
  assert.equal(storage.get(N.saveKey), "{broken");
  const bad = N.newState();
  bad.market[0].parts.engine = "95";
  assert.throws(() => N.importSave(JSON.stringify(bad)));
  assert.equal(storage.get(N.saveKey), "{broken");
  N.importSave(JSON.stringify(s));
  assert(!N.loadError);
  assert.equal(storage.get(N.saveKey + "-unreadable"), "{broken");
});
test("Save backup restores exact cash and preserves original valid snapshot", () => {
  const { N, s, storage } = setup();
  N.save(s);
  const first = storage.get(N.saveKey);
  s.cash -= 100;
  N.record(s, "test", -100, "Test");
  N.save(s);
  assert.equal(storage.get(N.backupKey()), first);
  assert.equal(N.restoreSave().cash, s.cash + 100);
});
test("Buyer local interest is applied once at the arrival threshold", () => {
  const { N, s, c } = setup();
  N.list(s, c.id, N.listingValue(s, c), "honest");
  N.localEffect = () => 0.1;
  N.interestBonus = () => 0;
  s.event.kind = "normal";
  N.advanceBuyers(s, c, () => 0.7);
  assert.equal(c.offers.length, 0); // .65 once; .75 with duplicate
  N.advanceBuyers(s, c, () => 0.6);
  assert.equal(c.offers.length, 1);
});
test("Dev log counts first purchase, profitable sale, goals and day modes without changing state", () => {
  const { N, s, c } = setup(),
    context = {
      NG: N,
      location: { search: "?dev=1" },
      URLSearchParams,
      Date,
      localStorage: { setItem() {} },
    };
  vm.runInNewContext(
    fs.readFileSync(root + "/js/session-log.js", "utf8"),
    context,
  );
  N.sessionLog.observe(s);
  const before = JSON.stringify(s);
  N.sessionLog.click({ action: "view", view: "market" }, s);
  assert.equal(JSON.stringify(s), before);
  const next = s.market[0];
  N.buy(s, next.id);
  N.sessionLog.observe(s);
  assert.notEqual(N.sessionLog.data.firstPurchaseMs, null);
  N.sessionLog.click({ action: "sell" }, s);
  N.sell(s, c.id, "dealer");
  s.sales[0].profit = 100;
  N.sessionLog.observe(s);
  assert.notEqual(N.sessionLog.data.firstProfitableSaleMs, null);
  N.sessionLog.day({ offers: [] }, "manual");
  N.sessionLog.day({ offers: [{}] }, "automatic");
  assert.equal(N.sessionLog.data.eventlessDays, 1);
  assert.equal(N.sessionLog.data.manualDays, 1);
  assert.equal(N.sessionLog.data.automaticDays, 1);
  assert(JSON.parse(N.sessionLog.export()).flips.length === 1);
  assert.match(
    N.sessionLog.export("csv"),
    /^"category","key","value","ms","action"/,
  );
});
test("Employee Quick fix keeps the original condition until its scheduled completion", () => {
  const { N, s, c } = setup();
  delete s.flow;
  N.hireStaff(s, "jo");
  const before = JSON.stringify(c.parts);
  N.performWork(s, "restore", c.id, "jo", "quick");
  assert(N.busy(s, c));
  assert.equal(JSON.stringify(c.parts), before);
  N.nextDay(s, () => 0.99);
  assert.equal(c.parts.cosmetic, 75);
  assert(!c.pendingRepair);
});
test("Malformed nested data and numbers are rejected before replacing a valid save", () => {
  const { N, s, storage } = setup();
  N.save(s);
  const raw = storage.get(N.saveKey);
  for (const corrupt of [
    (v) => (v.management.staff = {}),
    (v) => (v.market[0].offers = {}),
    (v) => (v.cash = "5000"),
    (v) => (v.ledger[0].amount = "50"),
    (v) =>
      (v.market[0].pendingRepair = { parts: { engine: 95 }, faults: [999] }),
  ]) {
    const v = JSON.parse(raw);
    corrupt(v);
    assert.throws(() => N.importSave(JSON.stringify(v)));
    assert.equal(storage.get(N.saveKey), raw);
  }
});
test("v0.11 and v0.12 schema reconstructions migrate without changing cash, cars or parts", () => {
  for (const version of [11, 12]) {
    const { N, s, c } = setup();
    const cash = s.cash,
      parts = JSON.stringify(c.parts);
    delete s.flow;
    delete s.season;
    delete s.management;
    if (version === 11) {
      delete s.trading;
      for (const car of [...s.market, ...s.inventory]) {
        delete car.listing;
        delete car.seller;
        delete car.vehicleHistory;
      }
    }
    const imported = N.importSave(JSON.stringify(s));
    assert.equal(imported.cash, cash);
    assert.equal(JSON.stringify(imported.inventory[0].parts), parts);
    assert(!imported.flow);
    N.nextDay(imported, () => 0.99);
    assert(Number.isFinite(imported.cash));
  }
});
test("A same-day Quick fix also stops skipping until the car is listed", () => {
  const { N, s, c } = setup();
  N.repairPackage(s, c.id, "quick");
  assert.equal(c.readyDay, 0);
  assert(!N.busy(s, c));
  assert.equal(N.waitForEvent(s, () => 0.99).days, 0);
  N.list(s, c.id, N.listingValue(s, c), "honest");
  assert.equal(N.waitForEvent(s, () => 0.99, 1).days, 1);
});
console.log(count + " stability regression tests passed.");
