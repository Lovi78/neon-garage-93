const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const storage = new Map();
global.window = global;
global.localStorage = {
  setItem: (k, v) => storage.set(k, v),
  getItem: (k) => storage.get(k) || null,
};
for (const file of [
  "cars",
  "catalog-v06",
  "sprite-clips",
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
    fs.readFileSync(path.join(__dirname, "../js/" + file + ".js"), "utf8"),
  );
let count = 0;
function test(name, run) {
  run();
  count++;
  console.log("PASS " + name);
}
function rng(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
test("Kezdőtőke, kapacitás, dátum és korhű kínálat", () => {
  const s = NG.newState();
  assert.equal(s.cash, 5000);
  assert.equal(s.capacity, 2);
  assert.equal(NG.date(0), "June 1, 1993");
  assert.equal(s.market.length, 9);
  for (let i = 0; i < 500; i++) {
    const x = NG.newState();
    assert(x.market.filter((c) => c.ask + 90 < 5000).length >= 3);
    x.market.forEach((c) => assert(c.year <= 1993));
  }
});
test("Vizsgálat egyszer fizethető, vásárlás és kapacitás", () => {
  const s = NG.newState(),
    c = s.market[0];
  NG.inspect(s, c.id);
  assert.equal(s.cash, 4910);
  assert.equal(c.inspectionCost, 90);
  assert(c.flaws.every((f) => f.revealed));
  assert.throws(() => NG.inspect(s, c.id));
  NG.buy(s, c.id);
  assert.equal(NG.cost(c), c.ask + 90);
  assert.throws(() => NG.buy(s, c.id));
  s.cash = 50000;
  NG.buy(s, s.market[0].id);
  assert.throws(() => NG.buy(s, s.market[0].id), /garage is full/);
});
test("Nincs hitel, nincs ingyenes javítás vagy ismételt eladás", () => {
  const s = NG.newState(),
    c = s.market[0];
  s.cash = 0;
  assert.throws(() => NG.buy(s, c.id));
  assert.throws(() => NG.inspect(s, c.id));
  s.cash = 10000;
  NG.buy(s, c.id);
  NG.inspect(s, c.id);
  NG.repair(s, c.id, "engine");
  assert.throws(() => NG.sell(s, c.id, "dealer"), /being repaired/);
  NG.nextDay(s, rng(15));
  assert(NG.busy(s, c));
  NG.nextDay(s, rng(16));
  assert.throws(() => NG.repair(s, c.id, "engine"), /good condition/);
  NG.sell(s, c.id, "dealer");
  assert.throws(() => NG.sell(s, c.id, "dealer"));
});
test("Rejtett hiba feltárásakor nem történik váratlan levonás", () => {
  const s = NG.newState(),
    c = s.market[0];
  s.cash = 20000;
  NG.buy(s, c.id);
  c.flaws = [{ ...NG.flaws[0], revealed: false, fixed: false }];
  const before = s.cash;
  NG.repair(s, c.id, "engine");
  assert.equal(s.cash, before);
  assert(c.flaws[0].revealed);
  const quote = NG.repairQuote(c, "engine");
  NG.repair(s, c.id, "engine");
  assert.equal(s.cash, before - quote);
  assert(c.flaws[0].fixed);
});
test("Hirdetés, ajánlat, elutasítás és érvényesség", () => {
  const s = NG.newState(),
    c = s.market[0];
  NG.buy(s, c.id);
  assert.throws(() => NG.list(s, c.id, NaN));
  assert.throws(() => NG.list(s, c.id, 0));
  NG.list(s, c.id, NG.value(s, c));
  s.marketTrends.next = { segment: "japan", multiplier: 1.2, duration: 2 };
  NG.nextDay(s, () => 0.4);
  assert.equal(c.offers.length, 1);
  assert(c.offers[0].price <= c.listPrice);
  const id = c.offers[0].id;
  NG.nextDay(s, () => 0.4);
  assert.throws(() => NG.sell(s, c.id, id));
});
test("Profit = bevétel - vétel - vizsgálat - javítás", () => {
  const s = NG.newState(),
    c = s.market[0];
  s.cash = 20000;
  NG.inspect(s, c.id);
  NG.buy(s, c.id);
  const repair = NG.repairQuote(c, "cosmetic");
  NG.repair(s, c.id, "cosmetic");
  NG.nextDay(s, rng(8));
  NG.list(s, c.id, 9000);
  c.offers = [{ id: "test", price: 8000 }];
  const expected = 8000 - c.ask - 90 - repair;
  assert.equal(NG.sell(s, c.id, "test"), expected);
  assert.equal(s.profit, expected);
  assert.equal(s.sales[0].cost, c.ask + 90 + repair);
});
test("Piaci hullám több napig él, és valóban módosítja az értéket", () => {
  const s = NG.newState(),
    c = NG.generateCar(s, 0, rng(3));
  s.inventory = [c];
  s.marketTrends.next = { segment: "japan", multiplier: 1.2, duration: 2 };
  const before = NG.value(s, c);
  NG.nextDay(s, () => 0.8);
  assert(s.demand.japan > 1.18);
  assert(NG.value(s, c) > before);
  NG.nextDay(s, () => 0.8);
  assert(s.demand.japan > 1.18);
  NG.nextDay(s, () => 0.8);
  assert(s.demand.japan < 1.05);
});
test("Mentés és újratöltés adatvesztés nélkül", () => {
  const s = NG.newState(),
    c = s.market[0];
  NG.inspect(s, c.id);
  NG.buy(s, c.id);
  NG.list(s, c.id, 3000);
  NG.nextDay(s, () => 0.4);
  NG.save(s);
  assert.deepEqual(NG.load(), s);
});
test("1000 üzlet: pénzmegmaradás, nyereség és veszteség", () => {
  let profitWins = 0,
    profitLosses = 0;
  const random = rng(93);
  for (let i = 0; i < 1000; i++) {
    const s = NG.newState();
    s.market = NG.market(s, random);
    const c = s.market[0];
    if (i % 2 === 0) NG.inspect(s, c.id);
    NG.buy(s, c.id);
    if (i % 3 === 0) {
      if (!c.inspected) NG.inspect(s, c.id);
      NG.repair(s, c.id, "cosmetic");
      NG.nextDay(s, random);
    }
    let profit;
    if (i % 2 === 0) {
      NG.list(s, c.id, NG.value(s, c));
      c.offers = [{ id: "offer", price: NG.value(s, c) }];
      profit = NG.sell(s, c.id, "offer");
    } else profit = NG.sell(s, c.id, "dealer");
    assert.equal(s.cash, 5000 + s.ledger.reduce((sum, l) => sum + l.amount, 0));
    assert.equal(s.profit, profit);
    assert.equal(s.inventory.length, 0);
    if (profit > 0) profitWins++;
    if (profit < 0) profitLosses++;
  }
  assert(profitWins > 0 && profitLosses > 0);
  console.log(
    "Üzletek: " + profitWins + " nyereséges, " + profitLosses + " veszteséges.",
  );
});
test("A korábbi magyar mentés angolra vált, a játékállás megmarad", () => {
  const s = NG.newState();
  NG.buy(s, s.market[0].id);
  s.event.title = "Fizetésnap a városban";
  s.event.text =
    "A piac kiegyensúlyozott. Friss hirdetések és új lehetőségek várnak.";
  s.ledger[0].description = "Volkswagen Golf GTI - vásárlás";
  s.inventory[0].flaws = [
    {
      ...NG.flaws[0],
      label: "Hengerfejtömítés szivárog",
      revealed: true,
      fixed: false,
    },
  ];
  s.history = [
    {
      day: 0,
      kind: "normal",
      title: "Csendes nap a városban",
      text: s.event.text,
    },
  ];
  const expected = JSON.parse(JSON.stringify(s));
  expected.event.title = "Payday in town";
  expected.event.text =
    "The market is steady. Fresh listings and new opportunities await.";
  expected.ledger[0].description = "Volkswagen Golf GTI - purchase";
  expected.inventory[0].flaws[0].label = "Leaking head gasket";
  expected.history[0].title = "A quiet day in town";
  expected.history[0].text = expected.event.text;
  NG.save(s);
  expected.financialHistory = JSON.parse(JSON.stringify(s.financialHistory));
  assert.deepEqual(NG.load(), expected);
  NG.save(expected);
  assert.deepEqual(NG.load(), expected);
});
test("Vételi alku: elfogadás, pontos ár és profit", () => {
  const s = NG.newState(),
    c = s.market[0],
    bid = Math.floor(c.ask * 0.95),
    before = s.cash;
  NG.inspect(s, c.id);
  NG.hagglePurchase(s, c.id, bid, () => 0.2);
  assert.equal(s.cash, before - 90);
  assert.equal(c.negotiation.price, bid);
  assert(c.negotiation.closed);
  NG.buy(s, c.id);
  assert.equal(c.purchasePrice, bid);
  assert.equal(s.cash, before - 90 - bid);
  assert.equal(s.ledger[0].amount, -bid);
  const sale = Math.round(NG.value(s, c) * 0.72);
  assert.equal(NG.sell(s, c.id, "dealer"), sale - bid - 90);
});
test("Vételi alku: ellenajánlat és három kör után végső ár", () => {
  const s = NG.newState(),
    c = s.market[0];
  c.ask = 1000;
  NG.hagglePurchase(s, c.id, 700, () => 1);
  assert.equal(c.negotiation.price, 930);
  assert(!c.negotiation.closed);
  NG.hagglePurchase(s, c.id, 800, () => 0);
  NG.hagglePurchase(s, c.id, 900, () => 0);
  assert(c.negotiation.closed);
  assert.equal(c.negotiation.rounds, 3);
  assert.throws(() => NG.hagglePurchase(s, c.id, 920));
  NG.buy(s, c.id);
  assert.equal(c.purchasePrice, 930);
});
test("Az eladó visszaléphet, hibás ajánlat nem használ el kört", () => {
  const s = NG.newState(),
    c = s.market[0];
  c.ask = 1000;
  for (const bid of [NaN, Infinity, 99, 1000, 900.5])
    assert.throws(() => NG.hagglePurchase(s, c.id, bid));
  assert.equal(c.negotiation, undefined);
  NG.hagglePurchase(s, c.id, 500, () => 0.4);
  assert(c.negotiation.walked);
  assert.throws(() => NG.buy(s, c.id));
  assert.throws(() => NG.hagglePurchase(s, c.id, 950));
  assert.equal(s.cash, 5000);
});
test("Eladási alku: elfogadott ellenajánlat nem automatikus eladás", () => {
  const s = NG.newState(),
    c = s.market[0];
  NG.buy(s, c.id);
  NG.list(s, c.id, 3000);
  c.offers = [{ id: "counter", buyer: "Alex", price: 2000 }];
  const before = s.cash;
  NG.haggleSale(s, c.id, "counter", 2100, () => 0.9);
  assert.equal(c.offers[0].price, 2100);
  assert.equal(s.cash, before);
  assert.equal(s.inventory.length, 1);
  NG.sell(s, c.id, "counter");
  assert.equal(s.cash, before + 2100);
  assert.equal(s.sales[0].price, 2100);
});
test("Eladási alku: végső ár, vevő távozása és érvénytelen ajánlat", () => {
  const s = NG.newState(),
    c = s.market[0];
  NG.buy(s, c.id);
  NG.list(s, c.id, 4000);
  c.offers = [
    { id: "final", buyer: "Alex", price: 2000 },
    { id: "walk", buyer: "Jamie", price: 2000 },
  ];
  NG.haggleSale(s, c.id, "final", 2150, () => 0);
  assert.equal(c.offers[0].price, 2050);
  assert(c.offers[0].negotiation.closed);
  assert.throws(() => NG.haggleSale(s, c.id, "final", 2200));
  NG.haggleSale(s, c.id, "walk", 4000, () => 0);
  assert.equal(c.offers.length, 1);
  assert.throws(() => NG.sell(s, c.id, "walk"));
  assert.match(c.buyerMessage, /keep looking/);
  NG.nextDay(s, () => 0.8);
  assert.equal(c.buyerMessage, null);
  assert.throws(() => NG.haggleSale(s, c.id, "final", 2200));
});
test("Alku mentése: újranyitás nem sorsol új korlátokat", () => {
  const s = NG.newState(),
    c = s.market[0];
  c.ask = 1000;
  NG.hagglePurchase(s, c.id, 700, () => 0.8);
  NG.save(s);
  const loaded = NG.load();
  assert.deepEqual(loaded, s);
  NG.hagglePurchase(loaded, c.id, 800, () => 0);
  assert.equal(loaded.market[0].negotiation.minimum, c.negotiation.minimum);
  NG.buy(loaded, c.id);
  const owned = loaded.inventory[0];
  NG.list(loaded, c.id, 4000);
  owned.offers = [{ id: "saved", buyer: "Alex", price: 2000 }];
  NG.haggleSale(loaded, c.id, "saved", 2100, () => 0.4);
  NG.save(loaded);
  assert.deepEqual(NG.load(), loaded);
});

console.log(count + " teszt sikeres.");
