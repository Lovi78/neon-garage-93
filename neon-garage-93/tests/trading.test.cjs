const assert = require("node:assert/strict");
const { runtime, random } = require("./runtime.cjs");
const NG = runtime();
let count = 0;
const test = (name, f) => {
  f();
  count++;
  console.log("PASS " + name);
};
const roundtrip = (s) => {
  NG.save(s);
  return NG.load();
};
const json = (x) => JSON.parse(JSON.stringify(x));
test("Persistent listing identities, price history, expiry and outside buyers", () => {
  const s = NG.practiceScenario("A"),
    c = s.market[0];
  for (let i = 0; i < 7; i++) NG.nextDay(s, () => 0.9);
  assert(s.market.includes(c));
  assert.equal(c.listing.createdDay, 0);
  assert(c.listing.prices.length > 1);
  assert(c.ask < c.listing.originalAsk);
  assert.deepEqual(json(roundtrip(s)), json(s));
  c.listing.expiresDay = s.day + 1;
  NG.nextDay(s, () => 0.9);
  assert(!s.market.includes(c));
  assert(
    s.trading.archive.some((a) => a.id === c.id && a.status === "expired"),
  );
  const t = NG.practiceScenario("A"),
    d = t.market[0];
  NG.nextDay(t, () => 0);
  assert(
    t.trading.archive.some(
      (a) => a.id === d.id && a.status === "sold-elsewhere",
    ),
  );
});
test("Motivations produce different saved reservation prices and tactical decisions", () => {
  const a = NG.practiceScenario("A"),
    b = NG.practiceScenario("A");
  const x = a.market[0],
    y = b.market[0];
  Object.assign(y.seller, {
    urgency: 0.1,
    flexibility: 0.04,
    reservation: 2112,
    patience: 10,
  });
  NG.hagglePurchase(a, x.id, 1800, () => 0.5, "cash");
  NG.hagglePurchase(b, y.id, 1800, () => 0.5, "cash");
  assert.equal(x.negotiation.status, "agreed");
  assert.equal(y.negotiation.status, "active");
  const saved = roundtrip(a);
  assert.equal(saved.market[0].seller.reservation, x.seller.reservation);
  assert.deepEqual(json(saved.market[0].seller), json(x.seller));
});
test("Inspection evidence changes the same negotiation; false arguments hurt trust", () => {
  const s = NG.practiceScenario("B"),
    c = s.market[0];
  NG.hagglePurchase(s, c.id, 2100, () => 0.4);
  assert.notEqual(c.negotiation.status, "agreed");
  const reservation = c.seller.reservation;
  NG.inspect(s, c.id);
  NG.checkHistory(s, c.id);
  assert(c.flaws[0].revealed);
  NG.hagglePurchase(s, c.id, 2100, () => 0, "fault");
  assert.equal(c.negotiation.status, "agreed");
  assert.equal(c.seller.reservation, reservation);
  const t = NG.practiceScenario("A"),
    d = t.market[0],
    trust = d.seller.trust;
  NG.hagglePurchase(t, d.id, 1500, () => 0.2, "fault");
  assert(d.seller.trust < trust);
});
test("Inspections are not perfect, cannot reroll facts or charge twice", () => {
  const s = NG.practiceScenario("B"),
    c = s.market[0];
  c.flaws[0].detection = 0.96;
  NG.inspect(s, c.id);
  assert(!c.flaws[0].revealed);
  NG.inspect(s, c.id, "deep");
  assert(!c.flaws[0].revealed);
  const cash = s.cash;
  assert.throws(() => NG.inspect(s, c.id, "deep"));
  assert.equal(s.cash, cash);
  assert.deepEqual(json(roundtrip(s).market[0].flaws), json(c.flaws));
});
test("Public estimates never reveal a secret fault or unknown accident history", () => {
  const s = NG.practiceScenario("B"),
    c = s.market[0];
  const before = NG.estimate(s, c);
  c.flaws[0].cost += 2000;
  c.vehicleHistory.accident = !c.vehicleHistory.accident;
  assert.equal(NG.estimate(s, c), before);
  assert.notEqual(NG.value(s, c), before);
  NG.checkHistory(s, c.id);
  assert.notEqual(NG.estimate(s, c), before);
});
test("Waiting and walking persist; callback resumes without deleting conversation", () => {
  const s = NG.practiceScenario("A"),
    c = s.market[0];
  NG.hagglePurchase(s, c.id, 1200);
  assert(c.negotiation.walked);
  let t = roundtrip(s);
  assert.throws(() => NG.buy(t, c.id));
  NG.nextDay(t, () => 0.9);
  NG.nextDay(t, () => 0.9);
  const d = t.market.find((x) => x.id === c.id);
  assert.equal(d.negotiation.status, "callback");
  assert.throws(() => NG.buy(t, c.id));
  NG.resumeDeal(t, c.id);
  assert.equal(d.negotiation.history.length, 1);
  NG.hagglePurchase(t, c.id, 1800, () => 0.1, "cash");
  NG.buy(t, c.id);
  assert.equal(t.inventory.length, 1);
  assert.throws(() => NG.buy(t, c.id));
});
test("Buy, transfer, accrued holding, repair and sale reconcile with cash and margin", () => {
  const s = NG.practiceScenario("A"),
    c = s.market[0];
  NG.hagglePurchase(s, c.id, 1800, () => 0.5, "cash");
  NG.buy(s, c.id);
  const cash = s.cash,
    fee = c.transactionCost;
  assert.equal(fee, 50);
  assert.equal(s.profit, 0);
  NG.inspect(s, c.id);
  const repair = NG.repairQuote(c, "cosmetic", s);
  NG.repair(s, c.id, "cosmetic");
  NG.nextDay(s, () => 0.9);
  assert.equal(c.holdingCost, 5);
  assert.equal(cash - s.cash, 90 + repair + 25);
  const price = Math.round(NG.value(s, c) * 0.72),
    cost = NG.cost(c);
  assert.equal(NG.sell(s, c.id, "dealer"), price - cost);
  assert.equal(s.cash, 5000 + s.ledger.reduce((n, l) => n + l.amount, 0));
  assert.equal(s.sales[0].daysInStock, 1);
  assert.throws(() => NG.sell(s, c.id, "dealer"));
  assert.equal(s.sales.length, 1);
  assert.equal(s.ledger.filter((l) => l.type === "holding").length, 1);
});
test("Buyer inquiry is not a sale; answers, counteroffers and deadlines are saved", () => {
  const s = NG.practiceScenario("A"),
    c = s.market[0];
  NG.buy(s, c.id);
  NG.list(s, c.id, 2600);
  const o = NG.makeBuyer(s, c, () => 0.4);
  o.profile.budget = 2400;
  c.offers = [o];
  assert.equal(o.stage, "question");
  assert.throws(() => NG.sell(s, c.id, o.id));
  assert.throws(() => NG.haggleSale(s, c.id, o.id, 2500));
  NG.answerBuyer(s, c.id, o.id, "as-is");
  NG.haggleSale(s, c.id, o.id, 2450);
  assert.equal(o.stage, "offer");
  assert(!o.negotiation.closed);
  const t = roundtrip(s);
  assert.deepEqual(json(t.inventory[0].offers), json(c.offers));
  NG.nextDay(t, () => 0.99);
  assert(t.inventory[0].offers.some((x) => x.id === o.id));
  t.day = o.expiresDay + 1;
  assert.throws(() => NG.sell(t, c.id, o.id));
});
test("Buyer needs, not repeated tactics, determine accepted ceilings", () => {
  const s = NG.practiceScenario("A"),
    c = s.market[0];
  NG.buy(s, c.id);
  NG.inspect(s, c.id);
  NG.list(s, c.id, 4000);
  const a = NG.makeBuyer(s, c, () => 0.1),
    b = NG.makeBuyer(s, c, () => 0.6);
  a.stage = b.stage = "offer";
  a.price = b.price = 2000;
  a.profile.budget = b.profile.budget = 2200;
  a.profile.focus = "reliability";
  b.profile.focus = "cost";
  c.parts.engine = 95;
  c.parts.transmission = 95;
  c.parts.suspension = 95;
  c.parts.body = 95;
  c.parts.cosmetic = 95;
  c.offers = [a, b];
  NG.haggleSale(s, c.id, a.id, 2250, () => 0.9, "reliability");
  NG.haggleSale(s, c.id, b.id, 2250, () => 0.9, "reliability");
  assert.equal(a.stage, "agreed");
  assert.equal(b.stage, "offer");
  assert(b.price < 2250);
});
test("Old saves migrate once without replacing money, cars, faults or legacy limits", () => {
  const s = NG.practiceScenario("B"),
    c = s.market[0];
  delete s.trading;
  delete c.seller;
  delete c.listing;
  delete c.vehicleHistory;
  c.negotiation = {
    price: 2500,
    rounds: 1,
    lastBid: 2000,
    closed: false,
    walked: false,
    minimum: 2300,
  };
  const before = json(s),
    t = roundtrip(s);
  assert.equal(t.cash, before.cash);
  assert.equal(t.day, before.day);
  assert.equal(t.market[0].vehicleHistory.accident, false);
  assert.equal(t.market[0].vehicleHistory.odometer, false);
  assert.equal(t.market[0].vehicleHistory.records, null);
  assert.equal(t.market[0].negotiation.minimum, 2300);
  assert.equal(t.market[0].flaws[0].cost, before.market[0].flaws[0].cost);
  const again = roundtrip(t);
  assert.deepEqual(json(again), json(t));
  NG.buy(t, c.id);
  assert.equal(t.inventory[0].purchasePrice, 2500);
});
test("Liquidity extremes and credit cannot create cash, net worth or repeat rewards", () => {
  const s = NG.practiceScenario("C"),
    c = s.inventory[0];
  s.cash = 0;
  const basis = c.holdingCost;
  NG.nextDay(s, () => 0.9);
  assert.equal(s.cash, 0);
  assert.equal(s.operations.arrears, 25);
  assert.equal(c.holdingCost, basis + 5);
  assert.throws(() => NG.buy(s, s.market[0].id));
  const profit = NG.sell(s, c.id, "dealer");
  assert(Number.isFinite(profit));
  NG.payOperatingBills(s);
  assert.equal(s.operations.arrears, 0);
  s.reputation = 25;
  const worth = NG.businessValue(s);
  NG.enterpriseFinance(s, 10000);
  assert.equal(NG.businessValue(s), worth);
  NG.enterpriseFinance(s, -10000);
  assert.equal(NG.businessValue(s), worth);
  const save = json(roundtrip(s));
  assert.deepEqual(json(roundtrip(s)), save);
});
test("Regional prices adjust gradually and market plans survive reload", () => {
  const s = NG.practiceScenario("A");
  s.marketTrends.next = { segment: "europe", multiplier: 1.2, duration: 12 };
  NG.nextDay(s, () => 0.9);
  assert(Math.abs(s.demand.europe - 1) < 0.02);
  assert.deepEqual(json(roundtrip(s).marketTrends), json(s.marketTrends));
  const old = s.demand.europe;
  NG.nextDay(s, () => 0.9);
  assert(Math.abs(s.demand.europe - old) < 0.02);
});

test("Overdue holding payments stay out of shared overhead after a sale", () => {
  const s = NG.practiceScenario("C"),
    c = s.inventory[0];
  s.cash = 0;
  NG.nextDay(s, () => 0.9);
  NG.nextDay(s, () => 0.9);
  assert.equal(s.operations.arrears, 50);
  assert.equal(c.holdingCost, 10);
  NG.sell(s, c.id, "dealer");
  NG.payOperatingBills(s);
  assert.equal(NG.economics(s).overhead, 40);
  assert.equal(
    s.ledger
      .filter((l) => l.type === "holding")
      .reduce((n, l) => n - l.amount, 0),
    10,
  );
  assert.equal(s.operations.dueBreakdown.holding, 0);
});
test("Repeat buyers retain their needs instead of rerolling personalities", () => {
  const s = NG.practiceScenario("A"),
    c = s.market[0];
  NG.buy(s, c.id);
  NG.list(s, c.id, 3000);
  const o = NG.makeBuyer(s, c, () => 0.1);
  o.stage = "offer";
  c.offers = [o];
  NG.sell(s, c.id, o.id);
  const customer = s.customers[0];
  assert.equal(customer.buyerProfile.id, o.profile.id);
  const d = NG.generateCar(s, 4, () => 0.7);
  const returning = NG.makeBuyer(s, d, () => 0);
  assert(returning.returning);
  assert.equal(returning.profile.id, o.profile.id);
  assert.equal(roundtrip(s).customers[0].buyerProfile.id, o.profile.id);
});
test("Waiting, skill bonuses, invalid bids and an expired agreement cannot bypass state", () => {
  const s = NG.practiceScenario("A"),
    c = s.market[0];
  for (const bid of [NaN, Infinity, 99, 2200, 1800.1])
    assert.throws(() => NG.hagglePurchase(s, c.id, bid));
  assert.equal(c.negotiation, undefined);
  NG.pauseDeal(s, c.id);
  assert.throws(() => NG.buy(s, c.id));
  NG.nextDay(s, () => 0.9);
  assert.throws(() => NG.hagglePurchase(s, c.id, 1800));
  NG.resumeDeal(s, c.id);
  s.progress.negotiation = 3;
  NG.hagglePurchase(s, c.id, 1750, () => 0.9, "cash");
  assert.equal(c.negotiation.status, "agreed");
  const quote = NG.purchaseQuote(c);
  s.cash = quote + 49;
  assert.throws(() => NG.buy(s, c.id));
  assert.equal(s.inventory.length, 0);
  s.cash = 5000;
  s.day = c.negotiation.agreedUntil + 1;
  assert.throws(() => NG.buy(s, c.id));
});
console.log(count + " total integrated trading tests passed.");
