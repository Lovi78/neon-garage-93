/* v0.14 F/4: Silver Palms dealer ranking, rank unlocks and Season 1 goals. */
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
const plain = (v) => JSON.parse(JSON.stringify(v));
const setup = (seed = 42) => {
  const rng = random(seed),
    N = runtime(rng);
  return { N, s: N.newState(), rng };
};
const quiet = (s) => {
  s.market = [];
  s.business.adActive = false;
};
// Jump to the next Friday with a chosen business value.
const friday = (N, s, value) => {
  do {
    N.nextDay(s, () => 0.99);
    if (value != null) s.cash += value - N.businessValue(s);
  } while (!N.isRentDay(s.day));
  return s.season;
};

test("A new game starts 6th of 7 in Silver Palms, season ends Friday August 27", () => {
  const { N, s } = setup();
  assert.equal(s.season.rank, 6);
  assert.equal(s.season.table.length, 7);
  assert.equal(s.season.table[5].id, "you");
  assert.equal(s.season.week, 0);
  assert.equal(N.date(N.seasonEndDay(s)), "August 27, 1993");
  assert.equal(N.nextRival(s).id, "westside");
});
test("Rivals are deterministic and never touch the game's random stream", () => {
  const a = setup(7),
    b = setup(7);
  b.N.ensureSeason(b.s);
  for (let w = 0; w < 14; w++)
    assert.deepEqual(
      plain(a.N.rivals.map((r) => a.N.rivalValue(r, w))),
      plain(b.N.rivals.map((r) => b.N.rivalValue(r, w))),
    );
  // Same seed, same day-by-day outcome with or without looking at rankings.
  for (let i = 0; i < 12; i++) {
    a.N.nextDay(a.s, a.rng);
    a.N.standings(a.s);
    b.N.nextDay(b.s, b.rng);
  }
  assert.deepEqual(
    plain(a.s.market.map((c) => c.id + c.ask)),
    plain(b.s.market.map((c) => c.id + c.ask)),
  );
  // Rivals grow: the leader at week 13 is worth more than at week 0.
  const coral = a.N.rivals[0];
  assert(a.N.rivalValue(coral, 13) > a.N.rivalValue(coral, 0) * 1.4);
});
test("Ranks lock on Fridays only, with movement and history", () => {
  const { N, s } = setup();
  quiet(s);
  N.nextDay(s, () => 0.99); // Wednesday
  s.cash += 20000;
  assert.equal(s.season.rank, 6, "mid-week money does not move the table");
  N.nextDay(s, () => 0.99); // Thursday
  N.nextDay(s, () => 0.99); // Friday
  assert.equal(s.season.week, 1);
  assert(s.season.rank <= 2, "rank " + s.season.rank);
  assert.match(s.dayReport.ranking, /Silver Palms ranking: #\d of 7 \(up \d\)/);
  assert.equal(s.season.history.length, 1);
  const me = s.season.table.find((t) => t.id === "you");
  assert(me.move > 0);
});
test("Top 5 unlocks auction tips: pricier TIP cars arrive on the market", () => {
  const { N, s } = setup(11);
  s.cash += 4000;
  friday(N, s);
  assert(s.season.best <= 5);
  assert(N.rankUnlocked(s, "top5"));
  assert(s.season.goals.top5);
  let tips = [];
  for (let i = 0; i < 30 && tips.length < 2; i++) {
    N.nextDay(s, random(500 + i));
    tips = s.market.filter((c) => c.tip);
  }
  assert(tips.length >= 1, "no tip listing in 30 days");
  assert(tips.every((c) => N.model(c).value >= 9000));
});
test("Without the unlock the market never carries TIP cars", () => {
  const { N, s, rng } = setup(11);
  for (let i = 0; i < 20; i++) N.nextDay(s, rng);
  assert(!s.season.unlocked.top5);
  assert(!s.market.some((c) => c.tip));
});
test("Top 3 opens collector requests and a $25,000 credit line", () => {
  const { N, s } = setup();
  assert.equal(N.enterpriseLoanLimit(s), 0);
  s.cash += 12000;
  friday(N, s);
  assert(s.season.rank <= 3, "rank " + s.season.rank);
  assert(N.rankUnlocked(s, "top3"));
  assert.equal(N.enterpriseLoanLimit(s), 25000);
  let collectors = 0;
  for (let i = 0; i < 60; i++)
    if (N.generateRequest(s, random(900 + i)).tier === "collector")
      collectors++;
  assert(collectors >= 15, "collector requests " + collectors + "/60");
  const rep = s.reputation;
  N.enterpriseFinance(s, 20000);
  assert.equal(s.enterprise.loan, 20000);
  assert.equal(s.reputation, rep);
});
test("#1 wins the season once: +5 REP, best rank is kept after a fall", () => {
  const { N, s } = setup();
  quiet(s);
  s.cash += 40000;
  friday(N, s);
  assert.equal(s.season.rank, 1);
  assert(N.rankUnlocked(s, "first"));
  assert.equal(s.reputation, 5 + 1, "+5 for #1, +1 for the on-time rent");
  s.cash -= 40000;
  friday(N, s);
  assert(s.season.rank > 1);
  assert.equal(s.season.best, 1);
  assert.equal(s.reputation, 6, "no second payout");
});
test("Season goals pay their reward once", () => {
  const { N, s } = setup();
  quiet(s);
  const points = s.progress.points;
  s.sales.unshift({ id: "x", profit: 300 });
  s.profit = 1200;
  s.opportunities.requests.push({ id: "q", status: "fulfilled" });
  const fresh = N.checkSeasonGoals(s).map((g) => g.id);
  assert.deepEqual(plain(fresh), ["flip", "request", "margin"]);
  assert.equal(s.progress.xp, 30);
  assert.equal(s.progress.points, points + 1);
  assert(s.business.advertising, "newspaper ad deal free");
  assert(
    !s.business.adActive,
    "the campaign still costs $20 a day when you run it",
  );
  assert.equal(N.checkSeasonGoals(s).length, 0);
  assert.equal(N.seasonProgress(s).done, 3);
  assert.equal(N.seasonProgress(s).next.id, "rent");
});
test("Selling a Showroom car completes its goal; dealer dumps do not", () => {
  const { N, s } = setup();
  s.cash = 50000;
  const c = s.market[0];
  N.buy(s, c.id);
  for (const k of Object.keys(c.parts)) c.parts[k] = 96;
  c.flaws = [];
  N.sell(s, c.id, "dealer");
  assert(!s.season.flags.showroomSold);
  const d = s.market[0];
  N.buy(s, d.id);
  for (const k of Object.keys(d.parts)) d.parts[k] = 96;
  d.flaws = [];
  N.list(s, d.id, 1000, "as-is");
  d.offers.push({ id: "o", buyer: "Pat", price: 20000, stage: "offer" });
  N.sell(s, d.id, "o");
  assert(s.season.goals.showroom);
});
test("The season ends after 13 Fridays with a final standing; the table keeps moving", () => {
  const { N, s } = setup();
  quiet(s);
  while (s.day < N.seasonEndDay(s)) N.nextDay(s, () => 0.99);
  assert.equal(s.season.week, 13);
  assert.equal(s.season.final.day, 87);
  assert.match(s.dayReport.ranking, /Season 1 final standing: #\d/);
  for (let i = 0; i < 7; i++) N.nextDay(s, () => 0.99);
  assert.equal(s.season.week, 14);
  assert.equal(s.season.final.day, 87);
});
for (const file of ["v013-solo-save.json", "v013-staff-save.json"])
  test("Old save joins the ranking from today: " + file, () => {
    const N = runtime(random(9));
    N.save(JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", file))));
    const s = N.load();
    assert.equal(s.season.startDay, s.day);
    assert(s.season.firstFriday > s.day);
    assert(N.isRentDay(s.season.firstFriday));
    assert.equal(s.season.week, 0);
    assert(s.season.rank >= 1 && s.season.rank <= 7);
    const cash = s.cash - s.ledger.reduce((n, l) => n + l.amount, 0);
    for (let i = 0; i < 10; i++) N.nextDay(s, random(i));
    assert(s.season.week >= 1);
    assert.equal(s.cash, cash + s.ledger.reduce((n, l) => n + l.amount, 0));
  });
console.log(count + " ranking tests passed.");
