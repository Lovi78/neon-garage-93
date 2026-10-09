window.NG = window.NG || {};
NG.saveKey = "neon-garage-93-v1";
NG.newState = () => {
  const s = {
    version: 1,
    cash: 5000,
    capacity: 2,
    reputation: 0,
    day: 0,
    nextId: 1,
    inventory: [],
    market: [],
    ledger: [],
    sales: [],
    history: [],
    profit: 0,
    sold: 0,
    demand: { japan: 1, europe: 1, america: 1 },
    event: {
      title: "The keys are yours. The rest is up to you.",
      text: "Two garage spaces, five thousand dollars, and a fresh start. Find your first deal in today’s listings.",
      kind: "start",
    },
  };
  s.market = NG.market(s);
  return s;
};
NG.save = (s) => {
  try {
    localStorage.setItem(NG.saveKey, JSON.stringify(s));
    NG.storageError = false;
  } catch (e) {
    NG.storageError = true;
  }
};
NG.load = () => {
  try {
    const raw = localStorage.getItem(NG.saveKey);
    if (!raw) return NG.newState();
    const s = JSON.parse(raw);
    if (
      s.version !== 1 ||
      !Number.isFinite(s.cash) ||
      !Number.isInteger(s.day) ||
      !Array.isArray(s.inventory) ||
      !Array.isArray(s.market) ||
      !Array.isArray(s.ledger) ||
      !Array.isArray(s.sales) ||
      !Array.isArray(s.history) ||
      !s.demand ||
      !Number.isInteger(s.nextId) ||
      [...s.inventory, ...s.market].some(
        (c) =>
          !NG.model(c) ||
          !c.parts ||
          !Array.isArray(c.flaws) ||
          !Array.isArray(c.offers),
      )
    )
      throw Error("Invalid save");
    for (const event of [s.event, ...s.history]) {
      event.title = NG.translateSavedText(event.title);
      event.text = NG.translateSavedText(event.text);
    }
    for (const entry of s.ledger)
      entry.description = NG.translateSavedText(entry.description);
    for (const car of [...s.inventory, ...s.market]) {
      for (const flaw of car.flaws)
        flaw.label = NG.translateSavedText(flaw.label);
    }
    return s;
  } catch (e) {
    NG.loadError = true;
    return NG.newState();
  }
};
NG.date = (day) =>
  new Date(Date.UTC(1993, 5, 1 + day)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
