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
NG.estimate = (state, car) => {
  const claimed =
    NG.baseValue(car) *
    (0.3 + (0.7 * car.claim) / 100) *
    (state.demand[NG.model(car).segment] || 1);
  const insight = (state.progress?.market || 0) * 0.25;
  return Math.round(claimed * (1 - insight) + NG.value(state, car) * insight);
};
NG.cost = (car) =>
  (car.purchasePrice || 0) + (car.inspectionCost || 0) + (car.repairCost || 0);
NG.repairQuote = (car, part, state, mode = "standard") => {
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
  const quote =
    Math.round(
      labor *
        (state?.business?.tools ? 0.85 : 1) *
        (1 - (state?.progress?.mechanical || 0) * 0.05),
    ) + Math.round(parts * (state?.business?.supplier ? 0.8 : 1));
  const full =
    quote + (mode === "rush" ? Math.max(80, Math.round(quote * 0.25)) : 0);
  return NG.discountedLocalRepair?.(state, part, full).price ?? full;
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
  const fee = NG.inspectionPrice(s);
  if (s.cash < fee)
    throw Error("You need " + NG.money(fee) + " for an inspection.");
  s.cash -= fee;
  car.inspectionCost += fee;
  car.inspected = true;
  car.flaws.forEach((f) => (f.revealed = true));
  NG.record(s, "inspection", -fee, NG.model(car).name + " - inspection");
};
NG.buy = (s, id) => {
  const car = s.market.find((c) => c.id === id);
  if (!car) throw Error("This listing is no longer available.");
  if (s.operations?.arrears > 0)
    throw Error("Clear overdue operating bills before buying another car.");
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
NG.repair = (s, id, part, mode = "standard") => {
  const car = s.inventory.find((c) => c.id === id);
  if (!car || !NG.parts[part]) throw Error("Invalid repair.");
  if (typeof mode === "function") mode = "standard";
  if (!["standard", "rush"].includes(mode))
    throw Error("Choose a valid workshop mode.");
  if (s.operations?.arrears > 0)
    throw Error("Clear overdue operating bills before booking work.");
  if (mode === "standard" && NG.localWorkshopBlocked?.(s))
    throw Error(
      "Today’s local event prevents new in-house bookings. Outsourced rush is still available.",
    );
  if (
    mode === "standard" &&
    NG.workshopBusy(s) >= (NG.workshopCapacity?.(s) || 1)
  )
    throw Error(
      "Your in-house workshop is occupied. Wait or outsource a rush repair.",
    );
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
  const cost = NG.repairQuote(car, part, s, mode);
  if (s.cash < cost)
    throw Error("You do not have enough cash for this repair.");
  const discount = NG.discountedLocalRepair?.(s, part, 100);
  if (discount?.event?.uses > 0) discount.event.uses--;
  s.cash -= cost;
  car.repairCost += cost;
  car.parts[part] = 95;
  car.flaws
    .filter((f) => f.part === part && f.revealed)
    .forEach((f) => (f.fixed = true));
  car.repairMode = mode;
  const days = NG.repairDuration(s, part, mode);
  car.readyDay = s.day + days;
  car.pendingCollectionRepair = true;
  car.offers = [];
  NG.record(
    s,
    "repair",
    -cost,
    NG.model(car).name + " - " + NG.parts[part].label,
  );
  return "Repair started. Ready in " + days + " day(s).";
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
  let price, delivery;
  if (offerId.startsWith("request:")) {
    delivery = NG.validateRequestDelivery(s, offerId.slice(8), c);
    price = delivery.price;
  } else if (offerId === "dealer") price = Math.round(NG.value(s, c) * 0.72);
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
  if (delivery) {
    NG.afterPrivateSale(
      s,
      { ...c, listingMode: "honest" },
      { buyer: delivery.buyer },
      s.sales[0],
    );
    delivery.request.status = "fulfilled";
    delivery.request.completedDay = s.day;
    delivery.request.saleId = s.sales[0].id;
    s.sales[0].requestId = delivery.request.id;
  } else if (offerId !== "dealer")
    NG.afterPrivateSale(s, c, negotiatedOffer, s.sales[0]);
  NG.record(
    s,
    "sale",
    price,
    NG.model(c).name +
      (delivery ? " - buyer request delivery (bonus included)" : " - sale"),
  );
  s.inventory = s.inventory.filter((x) => x.id !== id);
  NG.trackCollection(s, c, "sold");
  NG.collectionEntry(s, c.model).profit += profit;
  NG.awardDealXP(s, c, "sale", gain);
  return profit;
};
NG.nextDay = (s, rng = Math.random) => {
  const before = NG.dayReportBefore(s);
  s.day++;
  NG.processClaims(s);
  NG.operateDay(s);
  NG.advertisingDay(s);
  NG.advanceMarket(s, rng);
  const r = rng();
  if (r < 0.2) {
    s.event = {
      kind: "rush",
      title: "Payday meets a moving market",
      text:
        s.event.text +
        " Buyers in a hurry are more likely to make offers today.",
    };
  } else if (r >= 0.52 && r < 0.65) {
    s.event = {
      kind: "rare",
      title: "A rare listing during a market swing",
      text:
        s.event.text +
        " A Nissan 300ZX appears at a 20% asking-price discount.",
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
          (s.event.kind === "rush" ? 0.3 : 0) +
          (NG.localEffect?.(s, "interest") || 0),
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
        seen: false,
        id: "o" + s.nextId++,
        price,
        ...buyer,
      });
    }
  });
  NG.enterpriseDay?.(s, rng);
  NG.opportunityDay?.(s, rng);
  s.history.unshift({ day: s.day, ...s.event });
  s.history = s.history.slice(0, 30);
  return NG.finishDayReport(s, before);
};
