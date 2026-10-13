/* v0.14 buyer requests: generated specs, value-based payout, handover check. */
const assert = require("node:assert/strict");
const { runtime, random } = require("./runtime.cjs");
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
const plain = (v) => JSON.parse(JSON.stringify(v));
function setup(seed = 42) {
  const rng = random(seed),
    N = runtime(rng),
    s = N.newState();
  s.cash = 50000;
  return { N, s, rng };
}
function owned(N, s, model, level = 80) {
  const c = N.generateCar(
    s,
    N.catalog.findIndex((m) => m.id === model),
    random(5),
  );
  c.parts = {
    engine: level,
    transmission: level,
    suspension: level,
    body: level,
    cosmetic: level,
  };
  c.flaws = [];
  c.inspected = true;
  c.mileage = 90000;
  Object.assign(c.vehicleHistory, {
    historyChecked: true,
    records: true,
    accident: false,
  });
  s.market.push(c);
  N.buy(s, c.id);
  return c;
}
function active(s, spec) {
  const q = {
    id: "request-t" + s.nextId++,
    kind: "custom",
    spec: { buyer: "Dana K.", title: "Test", days: 7, rep: 0, ...spec },
    status: "active",
    day: s.day,
    acceptedDay: s.day,
    deadline: s.day + (spec.days || 7),
  };
  s.opportunities.requests.push(q);
  return q;
}

test("Generated requests are varied and always fit at least one catalog model", () => {
  const { N, s } = setup();
  s.reputation = 12;
  // Collector requests name a car you can find: put one high-end car on the market.
  s.market.push(
    N.generateCar(
      s,
      N.catalog.findIndex((m) => m.id === "911"),
      random(2),
    ),
  );
  const rng = random(7),
    titles = new Set(),
    tiers = new Set();
  for (let i = 0; i < 400; i++) {
    const spec = N.generateRequest(s, rng);
    titles.add(spec.title.replace(/ .*$/, ""));
    tiers.add(spec.tier);
    const q = { status: "active", deadline: 99, spec };
    assert(
      N.catalog.some((m) => {
        const c = N.generateCar(s, N.catalog.indexOf(m), random(1));
        c.mileage = 60000;
        return N.requestFits(s, q, c);
      }),
      spec.title,
    );
  }
  assert.deepEqual([...tiers].sort(), ["collector", "easy", "specific"]);
  assert(titles.size >= 5);
});
test("Single-model requests name a model that is on the market or in the garage", () => {
  const { N, s } = setup();
  s.reputation = 12;
  const rng = random(11),
    seen = new Set([...s.market, ...s.inventory].map((c) => c.model));
  for (let i = 0; i < 300; i++) {
    const spec = N.generateRequest(s, rng);
    if (spec.models) assert(seen.has(spec.models[0]), spec.title);
  }
});
test("Collector requests need 5 REP; capacity rises to three active at 10 REP", () => {
  const { N, s } = setup();
  const rng = random(3);
  for (let i = 0; i < 200; i++)
    assert.notEqual(N.generateRequest(s, rng).tier, "collector");
  assert.equal(N.requestCapacity(s), 2);
  s.reputation = 10;
  assert.equal(N.requestCapacity(s), 3);
});
test("Payout is the estimate plus the tier premium, capped by the buyer's budget", () => {
  const { N, s } = setup();
  const c = owned(N, s, "mx5");
  const q = active(s, { tier: "specific", models: ["mx5"], grade: "clean" });
  assert.equal(
    N.requestPayout(s, q, c),
    Math.round((N.estimate(s, c) * 1.18) / 25) * 25,
  );
  q.spec.budget = 3000;
  assert.equal(N.requestPayout(s, q, c), 3000);
  // A cheap car earns a cheap-car payout: no fixed-price loophole.
  const golf = owned(N, s, "golf");
  const g = active(s, { tier: "easy", shapes: ["hatch"], grade: "driver" });
  assert(N.requestPayout(s, g, golf) < N.estimate(s, golf) * 1.13);
});
test("Checklist names every missing step with a hint, and fixed facts end the fit", () => {
  const { N, s } = setup();
  const c = owned(N, s, "golf", 60);
  c.vehicleHistory.historyChecked = false;
  const q = active(s, {
    tier: "specific",
    segment: "europe",
    shapes: ["hatch"],
    grade: "clean",
    records: true,
    noAccident: true,
  });
  const missing = plain(
    N.requestCriteria(s, q, c)
      .filter((x) => !x.ok)
      .map((x) => x.id + ":" + x.hint),
  );
  assert.deepEqual(missing, [
    "grade:Driver-ready gets it there.",
    "records:Check its records ($35).",
    "accident:Check its records ($35).",
  ]);
  assert(N.requestFits(s, q, c));
  c.vehicleHistory.historyChecked = true;
  c.vehicleHistory.accident = true;
  assert(!N.requestFits(s, q, c), "an accident on record cannot be repaired");
  c.mileage = 999999;
  const m = active(s, { tier: "easy", shapes: ["hatch"], mileage: 150000 });
  assert(!N.requestFits(s, m, c));
});
test("Delivery: hidden fault is found at handover, then the fixed car sells once", () => {
  const { N, s } = setup();
  const c = owned(N, s, "mx5");
  c.flaws = [{ ...N.flaws[1], fixed: false, revealed: false }];
  const q = active(s, {
    tier: "specific",
    models: ["mx5"],
    grade: "clean",
    rep: 1,
  });
  assert(N.requestCriteria(s, q, c).every((x) => x.ok));
  assert(!N.requestMatch(s, q, c));
  const cash = s.cash;
  assert.match(N.deliverRequest(s, q.id, c.id), /mechanic found: Worn/);
  assert.equal(s.cash, cash);
  assert(c.flaws[0].revealed);
  assert(s.inventory.includes(c));
  c.flaws[0].fixed = true;
  const pay = N.requestPayout(s, q, c),
    rep = s.reputation;
  assert.match(N.deliverRequest(s, q.id, c.id), /Delivered to Dana K./);
  assert.equal(s.cash, cash + pay);
  assert.equal(q.status, "fulfilled");
  assert.equal(s.sales[0].requestId, q.id);
  assert(s.reputation >= rep + 1 + 1, "tier bonus on top of the honest sale");
  assert.throws(() => N.deliverRequest(s, q.id, c.id));
});
test("Old fixed-price requests keep their promised payout and rules", () => {
  const { N, s } = setup();
  const c = owned(N, s, "mx5", 90);
  const q = {
    id: "request-legacy",
    kind: "japan",
    status: "active",
    day: 0,
    acceptedDay: 0,
    deadline: 4,
  };
  s.opportunities.requests.push(q);
  assert(N.requestMatch(s, q, c));
  assert.equal(N.requestPayout(s, q, c), 7800);
  assert.equal(N.requestSpec(q).title, "Japanese weekend car");
  N.save(s);
  const loaded = N.load();
  assert.equal(N.requestSpec(loaded.opportunities.requests[0]).price, 7800);
});
test("New invitations arrive more often, up to two at a time, and save cleanly", () => {
  const { N, s } = setup();
  let offered = 0;
  for (let d = 1; d <= 60; d++) {
    s.day = d;
    N.opportunityDay(s, random(d));
    offered = Math.max(
      offered,
      s.opportunities.requests.filter((q) => q.status === "offered").length,
    );
    assert(
      s.opportunities.requests.filter((q) => q.status === "offered").length <=
        2,
    );
  }
  const generated = s.opportunities.requests.filter((q) => q.spec).length;
  assert(generated >= 8, "only " + generated + " requests in 60 days");
  N.save(s);
  assert.deepEqual(
    plain(N.load().opportunities.requests),
    plain(s.opportunities.requests),
  );
});
console.log(count + " buyer request tests passed.");
