window.NG = window.NG || {};
NG.collectionEntry = (s, model) => {
  s.collection.models[model] = s.collection.models[model] || {
    purchased: 0,
    repaired: 0,
    sold: 0,
    profit: 0,
  };
  return s.collection.models[model];
};
NG.ensureCollection = (s) => {
  if (s.collection?.models) return s;
  s.collection = { models: {} };
  // Recover only evidence present in an older save. Do not invent repair history.
  for (const car of s.inventory) {
    const e = NG.collectionEntry(s, car.model);
    e.purchased++;
    car.collectionPurchased = true;
    if (car.repairCost > 0) {
      if (!NG.busy(s, car)) {
        e.repaired++;
        car.collectionRepaired = true;
      } else car.pendingCollectionRepair = true;
    }
  }
  for (const sale of s.sales) {
    const model =
      sale.model || NG.catalog.find((m) => m.name === sale.name)?.id;
    if (!model) continue;
    const e = NG.collectionEntry(s, model);
    e.purchased++;
    e.sold++;
    e.profit += sale.profit;
    if (sale.repairCost > 0) e.repaired++;
  }
  return s;
};
NG.trackCollection = (s, car, stage) => {
  NG.ensureCollection(s);
  const key = "collection" + stage[0].toUpperCase() + stage.slice(1);
  if (car[key]) return false;
  car[key] = true;
  NG.collectionEntry(s, car.model)[stage]++;
  return true;
};
NG.collectionStats = (s) => {
  NG.ensureCollection(s);
  const entries = Object.values(s.collection.models);
  return {
    purchased: entries.filter((e) => e.purchased > 0).length,
    repaired: entries.filter((e) => e.repaired > 0).length,
    sold: entries.filter((e) => e.sold > 0).length,
    total: NG.catalog.length,
  };
};
NG.collectibleTier = (m) =>
  m.value >= 35000 ? "legendary" : m.value >= 12000 ? "rare" : "regular";
