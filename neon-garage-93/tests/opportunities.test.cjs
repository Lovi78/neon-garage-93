const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
global.window = global;
const storage = new Map();
global.localStorage = {
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, v),
};
for (const name of [
  "cars",
  "catalog-v06",
  "economy",
  "progression",
  "strategy",
  "finance",
  "collection",
  "customers",
  "opportunities",
  "day-report",
  "negotiation",
  "legacy-language",
  "state",
])
  vm.runInThisContext(
    fs.readFileSync(path.join(__dirname, "../js/" + name + ".js"), "utf8"),
  );
let count = 0;
const test = (name, run) => {
  run();
  count++;
  console.log("PASS " + name);
};
function fixture() {
  const s = NG.newState();
  s.cash = 50000;
  const c = s.market[0];
  NG.buy(s, c.id);
  c.parts = Object.fromEntries(Object.keys(NG.parts).map((p) => [p, 70]));
  c.flaws = [];
  c.inspected = true;
  c.mileage = 100000;
  return [s, c];
}
function invite(s, kind) {
  const e = {
    id: "local-" + s.nextId++,
    kind,
    status: "pending",
    day: s.day,
    deadline: s.day + 1,
  };
  s.opportunities.events.push(e);
  return e;
}
function request(s, kind) {
  const q = {
    id: "request-" + s.nextId++,
    kind,
    status: "offered",
    day: s.day,
    offerUntil: s.day + 2,
  };
  s.opportunities.requests.push(q);
  return q;
}
test("Eight distinct local choices and three valid buyer request categories", () => {
  assert.equal(NG.localEvents.length, 8);
  assert.equal(NG.requestKinds.length, 3);
  for (const t of NG.requestKinds)
    assert(
      NG.catalog.some(
        (m) => m.segment === t.segment && t.shapes.includes(m.shape),
      ),
    );
});
test("Invitations have no cash effects until accepted; decline and stale clicks are lossless", () => {
  const [s] = fixture(),
    e = invite(s, "meet"),
    cash = s.cash;
  NG.chooseLocalEvent(s, e.id, false);
  assert.equal(s.cash, cash);
  assert.throws(() => NG.chooseLocalEvent(s, e.id, true));
  assert.equal(s.cash, cash);
});
test("All eight choices charge their published fee exactly once and survive save/reload", () => {
  for (const t of NG.localEvents) {
    const [s] = fixture(),
      e = invite(s, t.id),
      cash = s.cash;
    NG.chooseLocalEvent(s, e.id, true);
    assert.equal(s.cash, cash - t.cost);
    assert.equal(s.ledger[0].amount, -t.cost);
    assert.throws(() => NG.chooseLocalEvent(s, e.id, true));
    NG.save(s);
    assert.equal(NG.load().opportunities.events[0].acceptedDay, s.day);
  }
});
test("Insufficient cash, arrears and occupied workshops reject event fees without mutation", () => {
  const [s, c] = fixture(),
    e = invite(s, "meet");
  s.cash = 0;
  assert.throws(() => NG.chooseLocalEvent(s, e.id, true));
  s.cash = 1000;
  s.operations.arrears = 50;
  assert.throws(() => NG.chooseLocalEvent(s, e.id, true));
  s.operations.arrears = 0;
  c.readyDay = 2;
  c.repairMode = "standard";
  assert.throws(() => NG.chooseLocalEvent(s, e.id, true));
  assert.equal(s.cash, 1000);
  assert.equal(e.status, "pending");
});
test("Car meet blocks in-house booking only today and leaves real rush repairs available", () => {
  const [s, c] = fixture(),
    e = invite(s, "meet");
  NG.chooseLocalEvent(s, e.id, true);
  assert.throws(() => NG.repair(s, c.id, "body"), /event prevents/);
  const quote = NG.repairQuote(c, "body", s, "rush"),
    cash = s.cash;
  NG.repair(s, c.id, "body", "rush");
  assert.equal(s.cash, cash - quote);
  assert.equal(c.readyDay, 1);
  s.day = 1;
  assert(!NG.localWorkshopBlocked(s));
  assert.equal(NG.localEffect(s, "interest"), 0.2);
  s.day = 3;
  assert.equal(NG.localEffect(s, "interest"), 0);
});
test("Repair prepay consumes only paid jobs; quotes and hidden faults do not consume uses", () => {
  const [s, c] = fixture(),
    e = invite(s, "parts"),
    base = NG.repairQuote(c, "body", s);
  NG.chooseLocalEvent(s, e.id, true);
  assert.equal(NG.repairQuote(c, "body", s), Math.round(base * 0.8));
  assert.equal(e.uses, 3);
  c.flaws = [
    { part: "body", label: "Rust", cost: 100, fixed: false, revealed: false },
  ];
  const cash = s.cash;
  NG.repair(s, c.id, "body");
  assert.equal(s.cash, cash);
  assert.equal(e.uses, 3);
  const quote = NG.repairQuote(c, "body", s);
  NG.repair(s, c.id, "body");
  assert.equal(s.cash, cash - quote);
  assert.equal(e.uses, 2);
  assert.equal(c.repairCost, quote);
});
test("Discounts do not multiply: strongest applicable repair discount wins", () => {
  const [s, c] = fixture(),
    parts = invite(s, "parts"),
    detailer = invite(s, "detailer"),
    base = NG.repairQuote(c, "cosmetic", s);
  NG.chooseLocalEvent(s, parts.id, true);
  NG.chooseLocalEvent(s, detailer.id, true);
  assert.equal(NG.repairQuote(c, "cosmetic", s), Math.round(base * 0.7));
  NG.repair(s, c.id, "cosmetic");
  assert.equal(parts.uses, 3);
});
test("Mechanic, diagnostic and reputation choices change their stated systems", () => {
  const [s] = fixture();
  assert.equal(NG.repairDuration(s, "engine", "standard"), 2);
  NG.chooseLocalEvent(s, invite(s, "mechanic").id, true);
  assert.equal(NG.repairDuration(s, "engine", "standard"), 1);
  const fee = NG.inspectionPrice(s);
  NG.chooseLocalEvent(s, invite(s, "testlane").id, true);
  assert.equal(NG.inspectionPrice(s), Math.round(fee * 0.75));
  const rep = s.reputation;
  NG.chooseLocalEvent(s, invite(s, "chamber").id, true);
  assert.equal(s.reputation, rep + 3);
});
test("Invitation generation is occasional, spaced, bounded and never rerolled by loading", () => {
  const [s] = fixture();
  s.day = 1;
  NG.opportunityDay(s, () => 0.9);
  assert.equal(s.opportunities.events.length, 0);
  NG.opportunityDay(s, () => 0);
  assert.equal(s.opportunities.events.length, 1);
  assert.equal(s.opportunities.requests.length, 1);
  const snap = JSON.stringify(s.opportunities);
  NG.save(s);
  assert.equal(JSON.stringify(NG.load().opportunities), snap);
  s.day = 2;
  NG.opportunityDay(s, () => 0);
  assert.equal(s.opportunities.events.length, 1);
});
test("Accepting requests starts a fixed deadline with no cash or inventory mutation", () => {
  const [s] = fixture(),
    q = request(s, "europe"),
    cash = s.cash;
  NG.chooseRequest(s, q.id, true);
  assert.equal(q.deadline, 5);
  assert.equal(s.cash, cash);
  assert.throws(() => NG.chooseRequest(s, q.id, true));
  request(s, "japan");
  const second = s.opportunities.requests.at(-1);
  NG.chooseRequest(s, second.id, true);
  const third = request(s, "america");
  assert.throws(() => NG.chooseRequest(s, third.id, true), /two active/);
});
test("Each request validates origin, shape, mileage, condition, inspection, faults and repair readiness", () => {
  for (const t of NG.requestKinds) {
    const [s, c] = fixture(),
      q = request(s, t.id);
    NG.chooseRequest(s, q.id, true);
    c.model = NG.catalog.find(
      (m) => m.segment === t.segment && t.shapes.includes(m.shape),
    ).id;
    for (const key of Object.keys(c.parts)) c.parts[key] = 90;
    assert(NG.requestMatch(s, q, c));
    c.inspected = false;
    assert(!NG.requestMatch(s, q, c));
    c.inspected = true;
    c.mileage = t.mileage + 1;
    assert(!NG.requestMatch(s, q, c));
    c.mileage = 100000;
    c.flaws = [{ fixed: false }];
    assert(!NG.requestMatch(s, q, c));
    c.flaws = [];
    c.readyDay = s.day + 1;
    assert(!NG.requestMatch(s, q, c));
    c.readyDay = 0;
    for (const key of Object.keys(c.parts)) c.parts[key] = 20;
    assert(!NG.requestMatch(s, q, c));
  }
});
test("Delivery on the final day is one sale, one bonus, correct profit, reputation and no negotiation XP", () => {
  for (const t of NG.requestKinds) {
    const [s, c] = fixture(),
      q = request(s, t.id);
    NG.chooseRequest(s, q.id, true);
    c.model = NG.catalog.find(
      (m) => m.segment === t.segment && t.shapes.includes(m.shape),
    ).id;
    for (const key of Object.keys(c.parts)) c.parts[key] = 90;
    s.day = q.deadline;
    const cash = s.cash,
      profit = s.profit,
      rep = s.reputation,
      xp = s.progress.xp,
      cost = NG.cost(c),
      amount = t.budget + t.bonus;
    NG.sell(s, c.id, "request:" + q.id);
    assert.equal(s.cash, cash + amount);
    assert.equal(s.profit, profit + amount - cost);
    assert.equal(s.inventory.length, 0);
    assert.equal(s.sales[0].requestId, q.id);
    assert.equal(s.reputation, rep + 3);
    assert.equal(s.progress.xp, xp);
    assert.equal(q.status, "fulfilled");
    assert.throws(() => NG.sell(s, c.id, "request:" + q.id));
    NG.save(s);
    assert.equal(NG.load().opportunities.requests[0].status, "fulfilled");
  }
});
test("Missing a committed deadline costs reputation once and is included in the morning report", () => {
  const [s] = fixture(),
    q = request(s, "europe");
  s.reputation = 10;
  NG.chooseRequest(s, q.id, true);
  s.day = q.deadline;
  const report = NG.nextDay(s, () => 0.9);
  assert.equal(q.status, "failed");
  assert.equal(s.reputation, 9);
  assert(report.localNotices.some((n) => n.includes("missed")));
  NG.nextDay(s, () => 0.9);
  assert.equal(s.reputation, 9);
});
test("Declining or ignoring unaccepted requests is free; abandoning accepted requests costs one reputation", () => {
  const [s] = fixture();
  s.reputation = 10;
  const q = request(s, "japan");
  NG.chooseRequest(s, q.id, false);
  const ignored = request(s, "europe");
  s.day = 3;
  NG.opportunityDay(s, () => 0.9);
  assert.equal(ignored.status, "expired");
  assert.equal(s.reputation, 10);
  const active = request(s, "america");
  NG.chooseRequest(s, active.id, true);
  NG.abandonRequest(s, active.id);
  assert.equal(s.reputation, 9);
  assert.throws(() => NG.abandonRequest(s, active.id));
});
test("Promotion changes actual buyer arrival probability without guaranteeing offers", () => {
  const [s, c] = fixture();
  s.demand = { japan: 1, europe: 1, america: 1 };
  s.marketTrends.next = { segment: "japan", multiplier: 1, duration: 3 };
  c.listed = true;
  c.listingMode = "honest";
  c.listPrice = NG.listingValue(s, c);
  const quiet = JSON.parse(JSON.stringify(s));
  NG.chooseLocalEvent(s, invite(s, "photographer").id, true);
  NG.nextDay(quiet, () => 0.7);
  NG.nextDay(s, () => 0.7);
  assert.equal(quiet.inventory[0].offers.length, 0);
  assert.equal(s.inventory[0].offers.length, 1);
});
test("Old saves retain all cash, cars and live trades, with no retroactive invitations", () => {
  const [s, c] = fixture();
  delete s.opportunities;
  const cash = s.cash,
    id = c.id;
  NG.save(s);
  const loaded = NG.load();
  assert.equal(loaded.cash, cash);
  assert.equal(loaded.inventory[0].id, id);
  assert.deepEqual(loaded.opportunities.events, []);
  assert.deepEqual(loaded.opportunities.requests, []);
});
console.log(count + " local opportunity tests passed.");
