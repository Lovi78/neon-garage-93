/* Opt-in development measurement: ?dev=1. No names, input text or network. */
(() => {
  if (
    typeof location === "undefined" ||
    new URLSearchParams(location.search).get("dev") !== "1"
  )
    return;
  const started = Date.now(),
    key = "neon-garage-dev-session-" + started;
  const log = {
    version: 1,
    started,
    durationMs: 0,
    firstPurchaseMs: null,
    firstProfitableSaleMs: null,
    clicks: 0,
    manualDays: 0,
    automaticDays: 0,
    eventlessDays: 0,
    repairs: [],
    goals: [],
    routes: [],
    flips: [],
    events: [],
  };
  let initial = true,
    owned = new Set(),
    sold = new Set(),
    goals = new Set(),
    cycleStart = 0;
  const carStarts = new Map();
  const persist = () => {
    log.durationMs = Date.now() - started;
    try {
      localStorage.setItem(key, JSON.stringify(log));
    } catch (_) {}
  };
  NG.sessionLog = {
    data: log,
    click(data, s) {
      if (initial) this.observe(s);
      if (
        data.id &&
        data.action === "detail" &&
        !carStarts.has(String(data.id))
      )
        carStarts.set(String(data.id), log.clicks);
      const excluded = [
        "next",
        "wait-event",
        "confirm-next",
        "cancel-next",
        "skip-transition",
        "close-day-report",
      ];
      if (
        !excluded.includes(data.action) &&
        !data.action.startsWith("session-")
      )
        log.clicks++;
      if (
        ["view", "detail", "ops-tab", "dealer-tab", "car-tab"].includes(
          data.action,
        )
      )
        log.routes.push({
          ms: Date.now() - started,
          action: data.action,
          destination: data.view || data.tab || "car",
        });
      log.events.push({ ms: Date.now() - started, action: data.action });
      persist();
    },
    day(report, mode) {
      log[mode === "automatic" ? "automaticDays" : "manualDays"]++;
      if (
        report &&
        ![
          "offers",
          "completedRepairs",
          "newClaims",
          "expiredClaims",
          "localNotices",
          "enterpriseNotices",
        ].some((k) => report[k]?.length) &&
        !report.overnightCash &&
        !report.overnightReputation
      )
        log.eventlessDays++;
      persist();
    },
    observe(s) {
      if (initial) {
        owned = new Set(s.inventory.map((c) => c.id));
        sold = new Set(s.sales.map((c) => c.id));
        goals = new Set(Object.keys(s.season?.goals || {}));
        initial = false;
      }
      for (const c of s.inventory) {
        if (!owned.has(c.id)) {
          owned.add(c.id);
          if (log.firstPurchaseMs === null)
            log.firstPurchaseMs = Date.now() - started;
        }
        const token = c.id + ":" + c.repairCost;
        if (c.repairPackage && !log.repairs.some((r) => r.token === token))
          log.repairs.push({
            token,
            strategy: c.repairPackage,
            ms: Date.now() - started,
          });
      }
      for (const c of s.sales)
        if (!sold.has(c.id)) {
          sold.add(c.id);
          if (c.profit > 0 && log.firstProfitableSaleMs === null)
            log.firstProfitableSaleMs = Date.now() - started;
          log.flips.push({
            ms: Date.now() - started,
            clicks: log.clicks - (carStarts.get(String(c.carId)) ?? cycleStart),
            profit: c.profit,
            scope: "all meaningful clicks during this car cycle",
          });
          cycleStart = log.clicks;
        }
      for (const id of Object.keys(s.season?.goals || {}))
        if (!goals.has(id)) {
          goals.add(id);
          log.goals.push({ id, ms: Date.now() - started });
        }
      persist();
    },
    export(format = "json") {
      persist();
      if (format === "json") return JSON.stringify(log, null, 2);
      const cell = (v) => '"' + String(v ?? "").replaceAll('"', '""') + '"';
      const rows = [["category", "key", "value", "ms", "action"]];
      for (const [k, v] of Object.entries(log))
        if (!Array.isArray(v)) rows.push(["metric", k, v, "", ""]);
      for (const [category, entries] of Object.entries(log))
        if (Array.isArray(entries))
          entries.forEach((e, i) =>
            rows.push([category, i, JSON.stringify(e), e.ms, e.action]),
          );
      return rows.map((row) => row.map(cell).join(",")).join("\n");
    },
  };
  if (typeof document !== "undefined")
    document.addEventListener("click", (event) => {
      const control = event.target.closest("input, select, summary");
      if (
        control &&
        !control.closest("[data-action]") &&
        (control.tagName !== "INPUT" || control.type === "radio")
      ) {
        log.clicks++;
        log.events.push({ ms: Date.now() - started, action: "choose-control" });
        persist();
      }
    });
})();
