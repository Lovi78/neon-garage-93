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
  NG.ensureTrading?.(s);
  NG.ensureOpportunities?.(s);
  NG.ensureEnterprise?.(s);
  return NG.ensureCustomers(
    NG.ensureCollection(
      NG.ensureFinance(NG.ensureStrategy(NG.ensureProgression(s))),
    ),
  );
};
NG.backupKey = () => NG.saveKey + "-backup";
NG.decodeSave = (raw) => {
  if (typeof raw !== "string" || raw.length > 5000000)
    throw Error("Save file is missing or too large.");
  const s = JSON.parse(raw);
  const object = (v) => v && typeof v === "object" && !Array.isArray(v);
  const checkTree = (v, depth = 0) => {
    if (depth > 40) throw Error("Save structure is too deep.");
    if (typeof v === "number" && !Number.isFinite(v))
      throw Error("Invalid numeric save value.");
    if (v && typeof v === "object")
      for (const [k, child] of Object.entries(v)) {
        if (["__proto__", "constructor", "prototype"].includes(k))
          throw Error("Invalid save field.");
        checkTree(child, depth + 1);
      }
  };
  checkTree(s);
  if (!object(s)) throw Error("Invalid save.");
  for (const [name, fields] of Object.entries({
    management: ["staff", "queue", "log", "accounts"],
    opportunities: ["requests", "events", "notices"],
    enterprise: ["jobs", "lots", "notices"],
    progress: ["log"],
    trading: ["archive"],
  }))
    if (s[name] != null) {
      if (!object(s[name])) throw Error("Invalid " + name + " data.");
      for (const field of fields)
        if (s[name][field] != null && !Array.isArray(s[name][field]))
          throw Error("Invalid " + name + "." + field);
    }
  for (const key of ["customers", "claims", "reputationLog", "financeHistory"])
    if (s[key] != null && !Array.isArray(s[key])) throw Error("Invalid " + key);
  if (s.season) {
    if (
      !object(s.season) ||
      !Array.isArray(s.season.table) ||
      !Array.isArray(s.season.history) ||
      !object(s.season.goals) ||
      !object(s.season.flags) ||
      !object(s.season.unlocked)
    )
      throw Error("Invalid season data.");
  }
  for (const key of ["operations", "business", "collection", "marketTrends"])
    if (s[key] != null && !object(s[key])) throw Error("Invalid " + key);
  if (
    s.version !== 1 ||
    !Number.isFinite(s.cash) ||
    !Number.isInteger(s.day) ||
    s.day < 0 ||
    !Number.isInteger(s.capacity) ||
    s.capacity < 1 ||
    !Number.isFinite(s.reputation) ||
    !s.event ||
    typeof s.event.title !== "string" ||
    typeof s.event.text !== "string" ||
    ["japan", "europe", "america"].some(
      (k) => !Number.isFinite(s.demand?.[k]) || s.demand[k] <= 0,
    ) ||
    !Array.isArray(s.inventory) ||
    !Array.isArray(s.market) ||
    !Array.isArray(s.ledger) ||
    !Array.isArray(s.sales) ||
    !Array.isArray(s.history) ||
    !s.demand ||
    !Number.isInteger(s.nextId) ||
    s.nextId < 1 ||
    s.ledger.some((l) => !l || !Number.isFinite(l.amount)) ||
    s.sales.some(
      (l) => !l || !Number.isFinite(l.price) || !Number.isFinite(l.cost),
    ) ||
    [...s.inventory, ...s.market].some(
      (c) =>
        !NG.model(c) ||
        !c.parts ||
        Object.keys(NG.parts).some(
          (p) =>
            !Number.isFinite(c.parts[p]) || c.parts[p] < 0 || c.parts[p] > 100,
        ) ||
        (c.pendingRepair &&
          (!c.pendingRepair.parts ||
            !Array.isArray(c.pendingRepair.faults) ||
            Object.entries(c.pendingRepair.parts).some(
              ([p, n]) =>
                !NG.parts[p] || !Number.isFinite(n) || n < 0 || n > 100,
            ) ||
            c.pendingRepair.faults.some(
              (i) => !Number.isInteger(i) || !c.flaws?.[i],
            ))) ||
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
  NG.ensureTrading?.(s);
  if (
    NG.ensureTrading &&
    [...s.market, ...s.inventory].some(
      (c) => !c.listing || !c.seller || !c.vehicleHistory,
    )
  )
    throw Error("Incomplete trading data.");
  NG.ensureOpportunities?.(s);
  NG.ensureEnterprise?.(s);
  NG.ensureManagement?.(s);
  NG.ensureCustomers(
    NG.ensureCollection(
      NG.ensureFinance(NG.ensureStrategy(NG.ensureProgression(s))),
    ),
  );
  NG.ensureSeason?.(s);
  return s;
};
NG.save = (s) => {
  if (NG.loadError) return false; // Preserve unreadable original until explicit recovery.
  try {
    NG.snapshotFinance(s);
    const raw = JSON.stringify(s),
      previous = localStorage.getItem(NG.saveKey);
    NG.decodeSave(raw);
    if (previous && previous !== raw) {
      NG.decodeSave(previous);
      localStorage.setItem(NG.backupKey(), previous);
    }
    localStorage.setItem(NG.saveKey, raw);
    NG.storageError = false;
    return true;
  } catch (e) {
    NG.storageError = true;
    return false;
  }
};
NG.load = () => {
  NG.loadError = false;
  try {
    const raw = localStorage.getItem(NG.saveKey);
    return raw ? NG.decodeSave(raw) : NG.newState();
  } catch (e) {
    NG.loadError = true;
    return NG.newState();
  }
};
NG.exportSave = (s) =>
  NG.loadError ? localStorage.getItem(NG.saveKey) : JSON.stringify(s, null, 2);
NG.importSave = (raw) => {
  const s = NG.decodeSave(raw); // All validation and migration precedes storage writes.
  const previous = localStorage.getItem(NG.saveKey);
  if (previous) {
    try {
      NG.decodeSave(previous);
      localStorage.setItem(NG.backupKey(), previous);
    } catch (_) {
      localStorage.setItem(NG.saveKey + "-unreadable", previous);
    }
  }
  localStorage.setItem(NG.saveKey, JSON.stringify(s));
  NG.loadError = NG.storageError = false;
  return s;
};
NG.restoreSave = () => {
  const raw = localStorage.getItem(NG.backupKey());
  if (!raw) throw Error("No previous save is available.");
  return NG.importSave(raw);
};
NG.date = (day) =>
  new Date(Date.UTC(1993, 5, 1 + day)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
