window.NG = window.NG || {};
NG.money = (n) => "$" + Math.round(n).toLocaleString("en-US");
NG.clamp = (n, min, max) => Math.max(min, Math.min(max, n));
NG.condition = (car) =>
  Math.round(
    car.parts.engine * 0.3 +
      car.parts.transmission * 0.2 +
      car.parts.suspension * 0.2 +
      car.parts.body * 0.2 +
      car.parts.cosmetic * 0.1,
  );
NG.baseValue = (car) =>
  Math.round(
    NG.model(car).value *
      (1 - (1993 - car.year) * 0.025) *
      NG.clamp(1 - (car.mileage - 60000) / 500000, 0.65, 1.05),
  );
NG.value = (state, car) =>
  Math.max(
    200,
    Math.round(
      NG.baseValue(car) *
        (0.3 + (0.7 * NG.condition(car)) / 100) *
        (state.demand[NG.model(car).segment] || 1) -
        car.flaws
          .filter((f) => !f.fixed)
          .reduce((a, f) => a + f.cost * 0.75, 0),
    ),
  );
NG.estimate = (state, car) =>
  Math.round(
    NG.baseValue(car) *
      (0.3 + (0.7 * car.claim) / 100) *
      (state.demand[NG.model(car).segment] || 1),
  );
NG.cost = (car) =>
  (car.purchasePrice || 0) + (car.inspectionCost || 0) + (car.repairCost || 0);
NG.repairQuote = (car, part, state) => {
  const base = Math.ceil(
    (95 - car.parts[part]) * NG.parts[part].rate * (NG.model(car).service || 1),
  );
  const labor = Math.ceil(base * 0.65);
  const parts =
    base -
    labor +
    car.flaws
      .filter((f) => f.part === part && !f.fixed && f.revealed)
      .reduce((n, f) => n + f.cost, 0);
  return (
    Math.round(labor * (state?.business?.tools ? 0.85 : 1)) +
    Math.round(parts * (state?.business?.supplier ? 0.8 : 1))
  );
};
NG.busy = (state, car) => car.readyDay > state.day;
NG.generateCar = (state, modelIndex, rng = Math.random) => {
  const m = NG.catalog[modelIndex],
    parts = {};
  Object.keys(NG.parts).forEach(
    (p) => (parts[p] = Math.round(35 + rng() * 48)),
  );
  const car = {
    id: "c" + state.nextId++,
    model: m.id,
    year: m.years[0] + Math.floor(rng() * (m.years[1] - m.years[0] + 1)),
    mileage: Math.round((45000 + rng() * 130000) / 1000) * 1000,
    parts,
    flaws: [],
    claim: 0,
    inspectionCost: 0,
    repairCost: 0,
    inspected: false,
    listed: false,
    offers: [],
    readyDay: 0,
  };
  if (rng() < (m.faultChance ?? 0.4)) {
    const f = NG.flaws[Math.floor(rng() * NG.flaws.length)];
    car.flaws.push({
      ...f,
      cost: Math.round(f.cost * (m.service || 1)),
      fixed: false,
      revealed: false,
    });
  }
  car.claim = NG.clamp(NG.condition(car) + Math.round(rng() * 20), 30, 95);
  car.ask =
    Math.round((NG.value(state, car) * (0.69 + rng() * 0.39)) / 25) * 25;
  return car;
};
NG.market = (state, rng = Math.random) =>
  Array.from({ length: 9 }, (_, i) =>
    NG.generateCar(
      state,
      i === 0
        ? 4
        : i === 1
          ? 9
          : i === 2
            ? 0
            : Math.floor(rng() * NG.catalog.length),
      rng,
    ),
  );
NG.record = (s, type, amount, description) => {
  s.ledger.unshift({ day: s.day, type, amount, description });
};
NG.inspect = (s, id) => {
  const car = [...s.market, ...s.inventory].find((c) => c.id === id);
  if (!car) throw Error("This car is no longer available.");
  if (car.inspected) throw Error("This car has already been inspected.");
  if (s.cash < 90) throw Error("You need $90 for an inspection.");
  s.cash -= 90;
  car.inspectionCost += 90;
  car.inspected = true;
  car.flaws.forEach((f) => (f.revealed = true));
  NG.record(s, "inspection", -90, NG.model(car).name + " - inspection");
};
NG.buy = (s, id) => {
  const car = s.market.find((c) => c.id === id);
  if (!car) throw Error("This listing is no longer available.");
  if (car.negotiation?.walked)
    throw Error("The seller has walked away. This deal is off.");
  if (s.inventory.length >= s.capacity)
    throw Error("Your garage is full. Sell a car first.");
  const price = car.negotiation?.price ?? car.ask;
  if (s.cash < price) throw Error("You do not have enough cash for this car.");
  s.cash -= price;
  car.purchasePrice = price;
  NG.trackCollection(s, car, "purchased");
  s.inventory.push(car);
  s.market = s.market.filter((c) => c.id !== id);
  NG.record(s, "purchase", -price, NG.model(car).name + " - purchase");
  NG.awardDealXP(s, car, "purchase", car.negotiation ? car.ask - price : 0);
};
NG.repair = (s, id, part, rng = Math.random) => {
  const car = s.inventory.find((c) => c.id === id);
  if (!car || !NG.parts[part]) throw Error("Invalid repair.");
  if (NG.busy(s, car)) throw Error("This car is still in the workshop.");
  if (car.listed) throw Error("Remove the listing before making repairs.");
  if (
    car.parts[part] >= 95 &&
    !car.flaws.some((f) => f.part === part && !f.fixed && f.revealed)
  )
    throw Error("This part is already in good condition.");
  const hidden = car.flaws.find(
    (f) => f.part === part && !f.fixed && !f.revealed,
  );
  if (hidden) {
    hidden.revealed = true;
    return (
      "The workshop found another issue: " +
      hidden.label +
      ". The updated repair quote includes this issue. No money has been charged yet."
    );
  }
  const cost = NG.repairQuote(car, part, s);
  if (s.cash < cost)
    throw Error("You do not have enough cash for this repair.");
  s.cash -= cost;
  car.repairCost += cost;
  car.parts[part] = 95;
  car.flaws
    .filter((f) => f.part === part && f.revealed)
    .forEach((f) => (f.fixed = true));
  car.readyDay = s.day + 1;
  car.pendingCollectionRepair = true;
  car.offers = [];
  NG.record(
    s,
    "repair",
    -cost,
    NG.model(car).name + " - " + NG.parts[part].label,
  );
  return "Repair started. Your car will be ready tomorrow.";
};
NG.list = (s, id, price, mode) => {
  const c = s.inventory.find((c) => c.id === id);
  if (!c) throw Error("Car not found.");
  if (NG.busy(s, c)) throw Error("Wait for the repair to finish first.");
  if (!Number.isFinite(price) || price < 100 || price > 100000)
    throw Error("The price must be between $100 and $100,000.");
  mode = mode || (c.inspected ? "honest" : "as-is");
  if (!["honest", "as-is", "promise"].includes(mode))
    throw Error("Choose a valid listing description.");
  if (mode === "honest" && !c.inspected)
    throw Error("Inspect the car before declaring all faults.");
  c.listingMode = mode;
  c.listed = true;
  c.listPrice = Math.round(price);
  c.offers = [];
  c.buyerMessage = null;
};
NG.sell = (s, id, offerId) => {
  const c = s.inventory.find((c) => c.id === id);
  if (!c) throw Error("This car has already been sold.");
  if (NG.busy(s, c))
    throw Error("You cannot sell a car while it is being repaired.");
  let price;
  if (offerId === "dealer") price = Math.round(NG.value(s, c) * 0.72);
  else {
    const offer = c.offers.find((o) => o.id === offerId);
    if (!c.listed || !offer) throw Error("This offer is no longer valid.");
    price = offer.price;
  }
  const profit = price - NG.cost(c);
  const negotiatedOffer = c.offers.find((o) => o.id === offerId);
  const gain =
    negotiatedOffer?.negotiation?.openingPrice != null
      ? price - negotiatedOffer.negotiation.openingPrice
      : 0;
  s.cash += price;
  s.profit += profit;
  s.sold++;
  s.sales.unshift({
    id: "sale-" + s.nextId++,
    model: c.model,
    carId: c.id,
    repairCost: c.repairCost,
    day: s.day,
    name: NG.model(c).name,
    price,
    cost: NG.cost(c),
    profit,
  });
  if (offerId !== "dealer")
    NG.afterPrivateSale(s, c, negotiatedOffer, s.sales[0]);
  NG.record(s, "sale", price, NG.model(c).name + " - sale");
  s.inventory = s.inventory.filter((x) => x.id !== id);
  NG.trackCollection(s, c, "sold");
  NG.collectionEntry(s, c.model).profit += profit;
  NG.awardDealXP(s, c, "sale", gain);
  return profit;
};
NG.nextDay = (s, rng = Math.random) => {
  const before=NG.dayReportBefore(s);
  s.day++;
  NG.processClaims(s);
  NG.advertisingDay(s);
  s.demand = { japan: 1, europe: 1, america: 1 };
  s.event = {
    title: "A quiet day in town",
    text: "The market is steady. Fresh listings and new opportunities await.",
    kind: "normal",
  };
  const r = rng();
  if (r < 0.2) {
    s.demand.japan = 1.2;
    s.event = {
      title: "Tokyo fever",
      text: "Demand for Japanese cars is up 20% today. Their values and buyer offers are rising.",
      kind: "japan",
    };
  } else if (r < 0.36) {
    s.demand.america = 0.82;
    s.event = {
      title: "Gas prices are climbing",
      text: "American car values are down 18% today. The market will change again tomorrow.",
      kind: "america",
    };
  } else if (r < 0.52) {
    s.event = {
      title: "Payday in town",
      text: "A buyer in a hurry may offer above market value today. Your listed cars are more likely to attract offers.",
      kind: "rush",
    };
  } else if (r < 0.65) {
    s.event = {
      title: "A rare find in the classifieds",
      text: "A Nissan 300ZX has hit the market with a 20% asking-price discount. Its mechanical condition is still a mystery.",
      kind: "rare",
    };
  }
  s.market = NG.market(s, rng);
  if (s.event.kind === "rare") {
    s.market[8] = NG.generateCar(s, 5, rng);
    s.market[8].ask = Math.round(s.market[8].ask * 0.8);
  }
  s.inventory.forEach((c) => {
    if (c.pendingCollectionRepair && !NG.busy(s, c)) {
      NG.trackCollection(s, c, "repaired");
      c.pendingCollectionRepair = false;
    }
    c.offers = [];
    c.buyerMessage = null;
    if (!c.listed || NG.busy(s, c)) return;
    const value = NG.listingValue(s, c),
      ratio = c.listPrice / value,
      chance = NG.clamp(
        1.25 -
          ratio * 0.65 +
          NG.interestBonus(s) +
          (s.event.kind === "rush" ? 0.3 : 0),
        0.02,
        0.95,
      );
    if (rng() < chance) {
      const buyer = NG.chooseBuyer(s, c, rng);
      const price = Math.min(
        c.listPrice,
        Math.round(
          value *
            (0.87 + rng() * 0.2 + (s.event.kind === "rush" ? 0.1 : 0)) *
            (buyer.returning ? 1.03 : 1),
        ),
      );
      c.offers.push({
        id: "o" + s.nextId++,
        price,
        ...buyer,
      });
    }
  });
  s.history.unshift({ day: s.day, ...s.event });
  s.history = s.history.slice(0, 30);
  return NG.finishDayReport(s,before);
};
