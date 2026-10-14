const assert = require("node:assert/strict");
const { runtime, random } = require("./runtime.cjs");
let count = 0;
const test = (name, run) => {
  run();
  console.log("PASS " + name);
  count++;
};
const setup = (seed = 42) => {
  const rng = random(seed),
    N = runtime(rng),
    s = N.newState();
  s.cash = 10000;
  return { N, s, rng };
};
const request = (s, spec = {}) => {
  const q = {
    id: "qa-" + s.nextId++,
    kind: "custom",
    status: "offered",
    day: s.day,
    offerUntil: s.day + 2,
    spec: {
      title: "Camaro brief",
      buyer: "QA",
      tier: "specific",
      models: ["camaro"],
      grade: "clean",
      mileage: 150000,
      days: 8,
      rep: 1,
      ...spec,
    },
  };
  s.opportunities.requests.push(q);
  return q;
};
function car(N, s, id = "camaro") {
  return N.generateCar(
    s,
    N.catalog.findIndex((m) => m.id === id),
    random(11),
  );
}
function accept(N, s, q) {
  N.chooseRequest(s, q.id, true);
  return (
    s.market.find((c) => c.id === q.supply?.carId) ||
    s.inventory.find((c) => c.id === q.supply?.carId)
  );
}

test("An unsuitable Camaro never blocks a suitable protected source", () => {
  const { N, s } = setup();
  s.market = [];
  const bad = car(N, s);
  bad.mileage = 190000;
  s.market = [bad];
  const q = request(s);
  assert(!N.requestHasCar(s, q));
  const source = accept(N, s, q);
  assert(source);
  assert.notEqual(source.id, bad.id);
  assert(source.mileage <= 150000);
  assert(N.requestSupplyFits(s, q, source));
  const deadline = q.deadline;
  for (let i = 0; i < 7; i++) N.nextDay(s, () => 0.001);
  assert(s.market.some((c) => c.id === source.id));
  assert.equal(q.deadline, deadline);
});
test("Records and accident history both block a false positive without exposing them to UI", () => {
  const { N, s } = setup();
  s.market = [];
  const bad = car(N, s);
  bad.mileage = 90000;
  bad.vehicleHistory.records = false;
  bad.vehicleHistory.accident = true;
  s.market = [bad];
  const q = request(s, { records: true, noAccident: true });
  assert(!N.requestHasCar(s, q));
  const lead = accept(N, s, q);
  assert(lead);
  assert(lead.vehicleHistory.records && !lead.vehicleHistory.accident);
  assert(!lead.vehicleHistory.historyChecked);
});
test("Generic hatch briefs receive a source too; preparation and Friday costs are affordable", () => {
  const { N, s } = setup();
  s.cash = 6450;
  s.day = 23;
  s.market = [];
  const q = request(s, {
    models: undefined,
    shapes: ["hatch"],
    grade: "driver",
    records: true,
    budget: 4500,
    days: 5,
  });
  const lead = accept(N, s, q);
  assert(lead);
  assert.equal(N.model(lead).shape, "hatch");
  assert(N.requestPreparation(s, q, lead).affordable);
  assert(q.deadline - s.day >= N.requestPreparation(s, q, lead).days);
});
test("No cash means neutral closure, no refund, grant or reputation loss", () => {
  const { N, s } = setup();
  s.market = [];
  s.cash = 0;
  const q = request(s);
  const rep = s.reputation,
    ledger = s.ledger.length;
  accept(N, s, q);
  assert(q.waitingSupply);
  for (let i = 0; i < 3; i++) {
    s.day++;
    N.opportunityDay(s, () => 0.99);
  }
  assert.equal(q.status, "unavailable");
  assert.equal(s.reputation, rep);
  assert.equal(s.cash, 0);
  assert.equal(s.ledger.length, ledger);
});
test("Cancel during a protected supply search is free", () => {
  const { N, s } = setup();
  s.cash = 0;
  s.market = [];
  const q = request(s);
  accept(N, s, q);
  const rep = s.reputation;
  assert.match(N.abandonRequest(s, q.id), /No reputation/);
  assert.equal(s.reputation, rep);
});
test("Missing an opportunity after a viable source was secured still has a consequence", () => {
  const { N, s } = setup();
  s.market = [];
  const q = request(s);
  assert(accept(N, s, q));
  s.reputation = 12;
  const rep = s.reputation;
  s.day = q.deadline + 1;
  N.opportunityDay(s, () => 0.99);
  assert.equal(q.status, "failed");
  assert.equal(s.reputation, rep - 1);
});
test("Source supply failure gets a replacement and genuine preparation time", () => {
  const { N, s } = setup();
  s.market = [];
  const q = request(s),
    lead = accept(N, s, q);
  assert(lead);
  s.market = [];
  s.day = q.deadline - 1;
  const old = q.deadline;
  N.opportunityDay(s, () => 0.99);
  assert(q.supply.carId !== lead.id);
  assert(q.deadline > old);
  assert(s.market.some((c) => c.id === q.supply.carId));
});
test("Reselling a request source does not buy a free replacement or extend the deadline", () => {
  const { N, s } = setup();
  s.market = [];
  const q = request(s),
    lead = accept(N, s, q);
  assert(lead);
  N.buy(s, lead.id);
  N.sell(s, lead.id, "dealer");
  const deadline = q.deadline;
  s.day++;
  N.opportunityDay(s, () => 0.99);
  assert.equal(q.deadline, deadline);
  assert.equal(q.supply.carId, lead.id);
});
test("Protected supply, saved deadlines and existing facts survive roundtrip", () => {
  const { N, s } = setup();
  s.market = [];
  const q = request(s),
    lead = accept(N, s, q);
  const raw = JSON.stringify(lead);
  N.save(s);
  const l = N.load();
  assert.equal(JSON.stringify(l.market.find((c) => c.id === lead.id)), raw);
  assert.equal(
    l.opportunities.requests.find((r) => r.id === q.id).deadline,
    q.deadline,
  );
});
test("Late workshop time is accounted for instead of giving an impossible deadline", () => {
  const { N, s } = setup();
  const busy = car(N, s, "golf");
  s.market.push(busy);
  N.buy(s, busy.id);
  busy.readyDay = s.day + 12;
  busy.repairMode = "standard";
  s.market = [];
  const q = request(s, { days: 2, grade: "excellent" }),
    lead = accept(N, s, q);
  assert(lead);
  assert(q.deadline >= s.day + N.requestPreparation(s, q, lead).days);
});
test("The saved player phase gets a Top 5 goal with an actual buyer-network reward", () => {
  const { N, s } = setup();
  s.cash = 6450;
  s.day = 23;
  s.sold = 3;
  s.sales = [{ id: "a", profit: 100, price: 2000, cost: 1900 }];
  s.season.goals = { flip: {}, rent: {}, request: {}, margin: {} };
  const objective = N.dealerObjective(s);
  assert.equal(objective.id, "top5");
  assert.match(objective.reward, /buyer audiences/);
  assert(objective.gap > 0);
  assert.equal(objective.deadline, N.nextRentDay(s));
  const before = JSON.stringify(s);
  N.dealerObjective(s);
  assert.equal(JSON.stringify(s), before);
});
test("Model characters keep weighted condition but change faults and next-owner audience", () => {
  const { N, s } = setup();
  const c = car(N, s, "rx7");
  assert(c.character);
  const raw = {
    model: "rx7",
    parts: {
      engine: 60,
      transmission: 60,
      suspension: 60,
      body: 60,
      cosmetic: 60,
    },
  };
  const condition = N.condition(raw);
  N.applyCharacter(raw);
  assert.equal(N.condition(raw), condition);
  assert.equal(raw.parts.engine, 56);
  assert.equal(raw.parts.cosmetic, 72);
  assert.equal(N.characterProfile(c).buyer, "enthusiast");
  const low = N.characterFlaw(
    N.catalog.find((m) => m.id === "rx7"),
    0.1,
  );
  assert.equal(low.part, "engine");
});
test("Buyer choice is a probability shift; targeted reach favours the selected type", () => {
  const { N, s } = setup();
  const c = car(N, s, "supra");
  let general = 0,
    focused = 0;
  for (let i = 0; i < 1000; i++) {
    c.audience = "open";
    if (N.pickBuyerKind(c, i / 1000).id === "enthusiast") general++;
    c.audience = "enthusiast";
    if (N.pickBuyerKind(c, i / 1000).id === "enthusiast") focused++;
  }
  assert(focused > general);
  assert(focused < 1000);
});
test("Top 5 grants a real listing choice; its one-time fee stays in car margin exactly once", () => {
  const { N, s } = setup();
  s.market = [];
  const c = car(N, s, "supra");
  s.market.push(c);
  N.buy(s, c.id);
  c.inspected = true;
  c.flaws = [];
  const start = s.cash,
    cost = N.cost(c);
  assert.throws(
    () => N.listForAudience(s, c.id, 9000, "honest", "enthusiast"),
    /Top 5/,
  );
  assert.equal(s.cash, start);
  assert(!c.listed);
  s.season.unlocked.top5 = 3;
  N.listForAudience(s, c.id, 9000, "honest", "enthusiast");
  assert.equal(s.cash, start - 35);
  assert.equal(N.cost(c), cost + 35);
  assert.equal(c.audience, "enthusiast");
  assert.equal(s.ledger[0].type, "listing-ad");
  const margin = N.sell(s, c.id, "dealer");
  assert.equal(margin, s.sales[0].price - cost - 35);
  N.save(s);
  assert.equal(N.load().sales[0].marketingCost, 35);
});
test("Fast-forward stops while enough request-preparation time still remains", () => {
  const { N, s } = setup();
  s.market = [];
  const q = request(s, { grade: "excellent" }),
    lead = accept(N, s, q);
  assert(lead);
  const plan = N.requestPreparation(s, q, lead);
  s.day = q.deadline - plan.days - 1;
  assert.equal(N.waitForEvent(s, () => 0.99).days, 0);
});
test("Request expiry through a real day advance is not silently extended after a missed opportunity", () => {
  const { N, s } = setup();
  s.reputation = 12;
  s.market = [];
  const q = request(s);
  accept(N, s, q);
  s.day = q.deadline;
  const rep = s.reputation;
  N.nextDay(s, () => 0.99);
  assert.equal(q.status, "failed");
  assert.equal(s.reputation, rep - 1);
});
test("Completed rank goals are not advertised again as unpaid rewards", () => {
  const { N, s } = setup();
  s.sales = [{ id: "done", price: 2000, cost: 1000, profit: 1000 }];
  s.season.goals.request = { day: 0 };
  s.season.goals.showroom = { day: 0 };
  s.season.unlocked = { top5: 3, top3: 10, first: 17 };
  assert.equal(N.dealerObjective(s).id, "defend");
});
test("Fast-forward can finish an already booked repair before a request deadline", () => {
  const { N, s } = setup();
  s.market = [];
  const q = request(s, { grade: "clean" }),
    lead = accept(N, s, q);
  N.buy(s, lead.id);
  lead.inspected = true;
  lead.flaws = [];
  Object.keys(lead.parts).forEach((p) => (lead.parts[p] = 60));
  N.repairPackage(s, lead.id, "driver");
  q.deadline = s.day + 1;
  const result = N.waitForEvent(s, () => 0.99);
  assert.equal(result.days, 1);
  assert.equal(q.status, "active");
  assert(!N.busy(s, lead));
});
test("An already funded ready car can fulfill a brief even when cash is temporarily empty", () => {
  const { N, s } = setup();
  s.market = [];
  const c = car(N, s);
  c.mileage = 90000;
  s.market.push(c);
  N.buy(s, c.id);
  c.inspected = true;
  c.flaws = [];
  Object.keys(c.parts).forEach((p) => (c.parts[p] = 80));
  s.cash = 0;
  s.operations.arrears = 20;
  const q = request(s);
  assert.equal(accept(N, s, q).id, c.id);
  assert(!q.waitingSupply);
  N.deliverRequest(s, q.id, c.id);
  assert.equal(q.status, "fulfilled");
});
console.log(count + " purpose and fair-request tests passed.");
