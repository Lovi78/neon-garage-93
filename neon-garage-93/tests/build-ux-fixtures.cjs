// Standalone browser QA pages. Never touches the player's normal save key.
const fs = require("node:fs"),
  path = require("node:path");
const { runtime, html, root } = require("./runtime.cjs");
const N = runtime(() => 0.4),
  s = N.newState();
s.cash = 120000;
s.day = 100;
s.reputation = 14;
s.progress.xp = 70;
s.progress.points = 2;
const car = s.market[0];
N.buy(s, car.id);
car.inspected = true;
car.flaws = [];
for (const key in car.parts) car.parts[key] = 95;
N.list(s, car.id, 6000, "honest");
car.offers = [
  {
    id: "qa-sale",
    buyer: "Alex",
    price: 5500,
    stage: "agreed",
    expiresDay: 100,
    seen: false,
    negotiation: { openingPrice: 5000, closed: true },
  },
];
const repair = s.market[0];
N.buy(s, repair.id);
N.repair(s, repair.id, "cosmetic");
s.opportunities.requests = [
  {
    id: "qa-request",
    kind: "europe",
    status: "offered",
    day: 100,
    offerUntil: 102,
  },
];
s.claims = [];
N.snapshotFinance(s);
const legacy = N.practiceScenario("B");
legacy.progress.level = 3;
legacy.progress.xp = 85;
legacy.progress.points = 1;
delete legacy.trading;
const oldCar = legacy.market[0];
delete oldCar.vehicleHistory;
delete oldCar.seller;
delete oldCar.listing;
oldCar.negotiation = {
  price: 2500,
  minimum: 2300,
  rounds: 1,
  lastBid: 2000,
  closed: false,
  walked: false,
};

const dir = path.join(root, "tests/browser-fixtures");
fs.mkdirSync(dir, { recursive: true });
for (const [name, state] of [
  ["late", s],
  ["legacy", legacy],
]) {
  fs.writeFileSync(
    path.join(dir, name + ".js"),
    `NG.saveKey+='-premium-qa-${name}';NG.save(${JSON.stringify(state)});`,
  );
  const page = html
    .replace("<head>", '<head>\n    <base href="../../" />')
    .replace(
      '<script defer src="js/ui.js',
      `<script defer src="tests/browser-fixtures/${name}.js"></script>\n    <script defer src="js/ui.js`,
    );
  fs.writeFileSync(path.join(dir, name + ".html"), page);
}
console.log(
  "Generated isolated late-game and legacy browser fixtures. Reload resets only fixture saves.",
);
