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
  "sprite-clips",
  "scene",
  "economy",
  "progression",
  "strategy",
  "finance",
  "collection",
  "customers",
  "enterprise",
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
function test(name, run) {
  run();
  count++;
  console.log("PASS " + name);
}
test("Empty album contains 60 targets without granting progress", () => {
  const s = NG.newState();
  assert.deepEqual(NG.collectionStats(s), {
    purchased: 0,
    repaired: 0,
    sold: 0,
    total: 60,
  });
  assert.equal(s.cash, 5000);
  assert.equal(s.progress.xp, 0);
});
test("Purchase, finished repairs and sale stamp each vehicle once", () => {
  const s = NG.newState(),
    c = s.market[0];
  NG.buy(s, c.id);
  assert.equal(NG.collectionStats(s).purchased, 1);
  assert.throws(() => NG.buy(s, c.id));
  NG.inspect(s, c.id);
  assert.equal(NG.collectionStats(s).repaired, 0);
  NG.repair(s, c.id, "cosmetic");
  assert.equal(NG.collectionStats(s).repaired, 0);
  NG.nextDay(s, () => 0.8);
  assert.equal(NG.collectionStats(s).repaired, 1);
  NG.repair(s, c.id, "suspension");
  NG.nextDay(s, () => 0.8);
  assert.equal(s.collection.models[c.model].repaired, 1);
  const profit = NG.sell(s, c.id, "dealer");
  assert.equal(s.collection.models[c.model].sold, 1);
  assert.equal(s.collection.models[c.model].profit, profit);
  assert.throws(() => NG.sell(s, c.id, "dealer"));
  assert.equal(NG.collectionStats(s).sold, 1);
});
test("Hidden-fault discovery does not claim a completed repair", () => {
  const s = NG.newState(),
    c = s.market[0];
  NG.buy(s, c.id);
  c.flaws = [{ ...NG.flaws[0], fixed: false, revealed: false }];
  NG.repair(s, c.id, "engine");
  NG.nextDay(s, () => 0.8);
  assert.equal(NG.collectionStats(s).repaired, 0);
});
test("Two vehicles of the same model increase counts, not distinct-model goals", () => {
  const s = NG.newState();
  s.cash = 20000;
  NG.buy(s, s.market[0].id);
  NG.nextDay(s, () => 0.8);
  NG.buy(s, s.market[0].id);
  assert.equal(s.collection.models.golf.purchased, 2);
  assert.equal(NG.collectionStats(s).purchased, 1);
});
test("Failed purchase and repair leave album progress unchanged", () => {
  const s = NG.newState(),
    c = s.market[0];
  s.cash = 0;
  assert.throws(() => NG.buy(s, c.id));
  assert.equal(NG.collectionStats(s).purchased, 0);
  s.cash = 5000;
  NG.buy(s, c.id);
  NG.inspect(s, c.id);
  s.cash = 0;
  assert.throws(() => NG.repair(s, c.id, "cosmetic"));
  assert.equal(NG.collectionStats(s).repaired, 0);
});
test("Old saves recover proven purchases and sales without inventing repairs", () => {
  const s = NG.newState(),
    c = s.market[0];
  NG.buy(s, c.id);
  s.sales = [
    { day: 0, name: "Toyota MR2", price: 4000, cost: 3500, profit: 500 },
    { day: 0, name: "Unknown Old Car", price: 1000, cost: 900, profit: 100 },
  ];
  delete s.collection;
  delete c.collectionPurchased;
  storage.set(NG.saveKey, JSON.stringify(s));
  const restored = NG.load();
  assert.equal(restored.cash, s.cash);
  assert.equal(restored.collection.models.golf.purchased, 1);
  assert.equal(restored.collection.models.mr2.purchased, 1);
  assert.equal(restored.collection.models.mr2.sold, 1);
  assert.equal(restored.collection.models.mr2.profit, 500);
  assert.equal(NG.collectionStats(restored).repaired, 0);
  NG.save(restored);
  assert.deepEqual(NG.load(), restored);
});
test("Old in-progress repairs are stamped only after their finish day", () => {
  const s = NG.newState(),
    c = s.market[0];
  NG.buy(s, c.id);
  NG.inspect(s, c.id);
  NG.repair(s, c.id, "cosmetic");
  delete s.collection;
  delete c.collectionPurchased;
  storage.set(NG.saveKey, JSON.stringify(s));
  const restored = NG.load();
  assert.equal(NG.collectionStats(restored).repaired, 0);
  NG.nextDay(restored, () => 0.8);
  assert.equal(NG.collectionStats(restored).repaired, 1);
  NG.nextDay(restored, () => 0.8);
  assert.equal(restored.collection.models.golf.repaired, 1);
});
test("Collectible tiers are stable game categories and collection has no cash reward", () => {
  assert.equal(
    NG.collectibleTier(NG.catalog.find((m) => m.id === "countach")),
    "legendary",
  );
  assert.equal(
    NG.collectibleTier(NG.catalog.find((m) => m.id === "skyline")),
    "rare",
  );
  assert.equal(
    NG.collectibleTier(NG.catalog.find((m) => m.id === "swift")),
    "regular",
  );
  const s = NG.newState(),
    c = s.market[0],
    cash = s.cash;
  NG.trackCollection(s, c, "purchased");
  assert.equal(s.cash, cash);
  assert.equal(s.progress.xp, 0);
});
console.log(count + " collection tests passed.");
