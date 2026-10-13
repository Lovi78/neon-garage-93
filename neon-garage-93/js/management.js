/* RUN THE LOT - finite work, explicit delegation, accrual separate from cash. */
(() => {
  const old = Object.fromEntries(
    [
      "newState",
      "load",
      "inspect",
      "repair",
      "answerBuyer",
      "operateDay",
      "nextDay",
      "businessValue",
      "enterpriseCosts",
      "takeServiceOrder",
      "knownDailyBills",
      "sevenDayCosts",
      "cashRunway",
      "list",
      "buy",
      "checkHistory",
    ].map((k) => [k, NG[k]]),
  );
  NG.staffCandidates = [
    {
      id: "ray",
      name: "Ray",
      role: "mechanic",
      skill: 55,
      speed: 50,
      reliability: 85,
      salary: 210,
    },
    {
      id: "jo",
      name: "Jo",
      role: "mechanic",
      skill: 90,
      speed: 90,
      reliability: 98,
      salary: 420,
    },
    {
      id: "kim",
      name: "Kim",
      role: "sales",
      skill: 60,
      speed: 55,
      reliability: 85,
      salary: 175,
    },
    {
      id: "alex",
      name: "Alex",
      role: "sales",
      skill: 90,
      speed: 90,
      reliability: 98,
      salary: 350,
    },
  ];
  NG.ensureManagement = (s) => {
    if (!s.management)
      s.management = {
        staff: [],
        queue: [],
        log: [],
        accounts: [],
        ownerUsed: 0,
        nextPayDay: s.day + 7,
        unpaid: 0,
      };
    return s.management;
  };
  NG.newState = () => {
    const s = old.newState();
    NG.ensureManagement(s);
    return s;
  };
  NG.load = () => {
    const s = old.load();
    NG.ensureManagement(s);
    return s;
  };
  NG.staffLimit = (s) =>
    NG.enterpriseActive(s, "fleet")
      ? 4
      : NG.enterpriseActive(s, "service")
        ? 3
        : s.capacity >= 4
          ? 2
          : 1;
  NG.workerHours = (w) => 4 + Math.floor(w.speed / 25);
  NG.weeklyPayroll = (s) =>
    NG.ensureManagement(s).staff.reduce((n, w) => n + w.salary, 0);
  NG.managementLog = (s, text) => {
    const m = NG.ensureManagement(s);
    m.log.unshift({ day: s.day, text });
    m.log = m.log.slice(0, 40);
  };
  NG.hireStaff = (s, id) => {
    const m = NG.ensureManagement(s),
      c = NG.staffCandidates.find((c) => c.id === id);
    if (!c || m.staff.some((w) => w.id === id))
      throw Error("Candidate unavailable.");
    if (m.staff.length >= NG.staffLimit(s))
      throw Error("Expand the lot for another staff position.");
    if (
      s.cash <
        c.salary +
          NG.weeklyPayroll(s) +
          NG.payrollLiability(s) +
          NG.operatingBill(s) * 7 ||
      m.unpaid ||
      s.operations.arrears
    )
      throw Error(
        "Keep one week of wages and operating bills in reserve before hiring.",
      );
    m.staff.push({ ...c, used: 0, accrued: 0, auto: false });
    NG.managementLog(s, c.name + " hired / " + NG.money(c.salary) + "/week.");
    return "Staff hired. Enable routine work or assign tasks in Operations.";
  };
  NG.payPayroll = (s) => {
    const m = NG.ensureManagement(s),
      paid = Math.min(s.cash, m.unpaid);
    s.cash -= paid;
    m.unpaid -= paid;
    if (paid) NG.record(s, "payroll", -paid, "Weekly payroll payment");
    return NG.money(paid) + " wages paid.";
  };
  NG.fireStaff = (s, id) => {
    const m = NG.ensureManagement(s),
      w = m.staff.find((w) => w.id === id);
    if (!w) throw Error("Employee unavailable.");
    if (s.cash < Math.ceil(w.accrued))
      throw Error("Settle earned wages before dismissal.");
    const due = Math.ceil(w.accrued);
    s.cash -= due;
    if (due) NG.record(s, "payroll", -due, w.name + " / final earned wages");
    m.staff = m.staff.filter((w) => w !== w);
    for (const j of m.queue) if (j.worker === id) j.worker = "owner";
    // Existing repairs finish on their saved schedule; no free acceleration.
    NG.managementLog(s, w.name + " dismissed / earned wages settled.");
    return "Employee dismissed. Waiting tasks returned to you.";
  };
  NG.toggleStaff = (s, id) => {
    const w = NG.ensureManagement(s).staff.find((w) => w.id === id);
    if (!w) throw Error("Employee unavailable.");
    w.auto = !w.auto;
    return w.auto
      ? "Routine work enabled. Sales always require your approval."
      : "Manual assignment enabled.";
  };
  const hours = {
    inspect: 2,
    repair: 3,
    restore: 3,
    followup: 1,
    prepare: 2,
    service: 3,
  };
  function worker(s, id, role) {
    const m = NG.ensureManagement(s);
    if (id === "owner")
      return {
        id: "owner",
        name: "You",
        skill: 80,
        speed: 50,
        reliability: 100,
        used: m.ownerUsed,
      };
    const w = m.staff.find((w) => w.id === id && w.role === role);
    if (!w) throw Error("Choose an employee with the right role.");
    return w;
  }
  function reserve(s, id, kind) {
    if (id !== "owner" && NG.ensureManagement(s).unpaid)
      throw Error("Settle overdue payroll before delegating more work.");
    const m = NG.ensureManagement(s),
      w = worker(
        s,
        id,
        ["followup", "prepare"].includes(kind) ? "sales" : "mechanic",
      ),
      cost = hours[kind];
    const cap = id === "owner" ? 8 : NG.workerHours(w);
    if (w.used + cost > cap)
      throw Error(
        (w.id === "owner" ? "You have" : w.name + " has") +
          " no work time left today. Queue it or outsource.",
      );
    return { w, cost };
  }
  function consume(s, r) {
    if (r.w.id === "owner") s.management.ownerUsed += r.cost;
    else r.w.used += r.cost;
  }
  NG.performWork = (
    s,
    kind,
    carId,
    workerId = "owner",
    part,
    offerId,
    quality = "standard",
  ) => {
    const r = reserve(s, workerId, kind),
      c = [...s.inventory, ...s.market].find((c) => c.id === carId);
    if (!c) throw Error("Car unavailable.");
    let result;
    if (kind === "inspect") {
      const before = c.inspectionCost;
      result = old.inspect(s, carId, quality);
      if (!s.inventory.includes(c)) {
        const fee = c.inspectionCost - before;
        c.inspectionExpensed = (c.inspectionExpensed || 0) + fee;
        s.management.accounts.push({ day: s.day, other: fee });
      }
    } else if (kind === "repair") {
      const before = c.repairCost;
      result = old.repair(s, carId, part, "standard");
      if (c.repairCost === before) return result;
      c.assignedWorker = workerId;
      if (workerId !== "owner") {
        // Saved deterministic outcome: reliability costs time, skill affects quality.
        const delay =
          (s.day + c.id.toString().length) % 100 >= r.w.reliability ? 1 : 0;
        c.readyDay =
          s.day +
          Math.max(
            1,
            NG.repairDuration(s, part, "standard") - (r.w.speed >= 80 ? 1 : 0),
          ) +
          delay;
        c.parts[part] = 95 + Math.floor(r.w.skill / 25);
      }
    } else if (kind === "restore") {
      // v0.14 package: one booking, same hours as a single part repair.
      const before = c.repairCost;
      result = NG.applyRepairPackage(s, carId, part, "standard");
      if (c.repairCost === before) return result;
      c.assignedWorker = workerId;
      if (workerId !== "owner") {
        const delay =
          (s.day + c.id.toString().length) % 100 >= r.w.reliability ? 1 : 0;
        c.readyDay =
          s.day +
          Math.max(1, NG.packageDays(s, part) - (r.w.speed >= 80 ? 1 : 0)) +
          delay;
      }
    } else if (kind === "followup") {
      const o = c.offers.find((o) => o.id === offerId);
      if (
        workerId !== "owner" &&
        (s.day + c.id.toString().length) % 100 >= r.w.reliability
      ) {
        if (!o || o.stage !== "question" || o.expiresDay < s.day)
          throw Error("Inquiry unavailable.");
        result = "Callback missed. Player approval still needed.";
      } else {
        const response = c.inspected
          ? "condition"
          : c.vehicleHistory?.historyChecked && c.vehicleHistory.records
            ? "records"
            : "as-is";
        result = old.answerBuyer(s, carId, offerId, response);
        // No hidden buyer budget read. Junior employees prepare conservative offers.
        if (workerId !== "owner" && r.w.skill < 75) {
          o.price = Math.round(o.price * 0.98);
          result += " Conservative offer prepared.";
        }
      }
    } else if (kind === "prepare") {
      if (!s.inventory.includes(c) || NG.busy(s, c) || c.listed || c.prepared)
        throw Error("Choose an unlisted, ready car that needs preparation.");
      c.prepared = true;
      result =
        "Photos and sale paperwork ready. Review price and publish the listing.";
    } else throw Error("Unknown task.");
    consume(s, r);
    NG.managementLog(
      s,
      r.w.name +
        " / " +
        NG.model(c).name +
        " / " +
        kind +
        ": " +
        (result || "Completed."),
    );
    return result || "Work completed.";
  };
  NG.inspect = (s, id, quality = "standard") =>
    NG.performWork(s, "inspect", id, "owner", null, null, quality);
  NG.answerBuyer = (s, id, oid, response) => {
    const r = reserve(s, "owner", "followup");
    const result = old.answerBuyer(s, id, oid, response);
    consume(s, r);
    return result;
  };
  NG.repair = (s, id, part, mode = "standard") => {
    if (mode === "rush") {
      const result = old.repair(s, id, part, mode);
      const c = s.inventory.find((c) => c.id === id);
      if (c) c.assignedWorker = "outsourced";
      return result;
    }
    const m = NG.ensureManagement(s),
      w = m.staff.find(
        (w) =>
          w.role === "mechanic" && w.auto && w.used + 3 <= NG.workerHours(w),
      );
    return NG.performWork(s, "repair", id, w?.id || "owner", part);
  };
  NG.checkHistory = (s, id) => {
    const c = [...s.inventory, ...s.market].find((c) => c.id === id),
      r = reserve(s, "owner", "followup");
    const result = old.checkHistory(s, id);
    consume(s, r);
    if (!s.inventory.includes(c)) {
      c.inspectionExpensed = (c.inspectionExpensed || 0) + 35;
      s.management.accounts.push({ day: s.day, other: 35 });
    }
    return result;
  };
  NG.buy = (s, id) => {
    const c = s.market.find((c) => c.id === id);
    const result = old.buy(s, id);
    if (c.inspectionExpensed) {
      NG.ensureManagement(s).accounts.push({
        day: s.day,
        other: -c.inspectionExpensed,
      });
      c.inspectionExpensed = 0;
    }
    return result;
  };
  NG.list = (s, id, price, mode) => {
    const c = s.inventory.find((c) => c.id === id);
    const r = c && !c.prepared ? reserve(s, "owner", "prepare") : null;
    const result = old.list(s, id, price, mode);
    if (r) {
      consume(s, r);
      c.prepared = true;
      NG.managementLog(
        s,
        "You / " + NG.model(c).name + " / sale preparation and listing.",
      );
    }
    return result;
  };
  NG.takeServiceOrder = (s, id) => {
    const m = NG.ensureManagement(s),
      w = m.staff.find(
        (w) =>
          w.role === "mechanic" && w.auto && w.used + 3 <= NG.workerHours(w),
      );
    const r = reserve(s, w?.id || "owner", "service");
    const result = old.takeServiceOrder(s, id);
    consume(s, r);
    const j = s.enterprise.orders.find((j) => j.id === id);
    j.assignedWorker = r.w.id;
    if (r.w.id !== "owner") {
      j.days = Math.max(1, j.days - (r.w.speed >= 80 ? 1 : 0));
      j.readyDay = s.day + j.days;
    }
    NG.managementLog(
      s,
      r.w.name +
        " / " +
        j.name +
        " / client work started, ready " +
        NG.date(j.readyDay),
    );
    return (
      result +
      " Assigned to " +
      r.w.name +
      " / ready " +
      NG.date(j.readyDay) +
      "."
    );
  };
  NG.queueWork = (s, kind, carId, workerId = "owner", part, offerId) => {
    const m = NG.ensureManagement(s);
    if (!["repair", "inspect", "prepare", "followup"].includes(kind))
      throw Error("Unknown task.");
    worker(
      s,
      workerId,
      ["prepare", "followup"].includes(kind) ? "sales" : "mechanic",
    );
    if (![...s.market, ...s.inventory].some((c) => c.id === carId))
      throw Error("Car unavailable.");
    if (kind === "repair" && !NG.parts[part])
      throw Error("Choose a repair part.");
    if (
      m.queue.some(
        (j) =>
          j.carId === carId &&
          j.kind === kind &&
          j.part === part &&
          j.offerId === offerId,
      )
    )
      throw Error("Task already queued.");
    const c = s.inventory.find((c) => c.id === carId);
    const maxCost = kind === "repair" && c ? NG.repairQuote(c, part, s) : null;
    m.queue.push({
      id: "job" + s.nextId++,
      kind,
      carId,
      worker: workerId,
      part,
      offerId,
      maxCost,
    });
    return "Task queued. Runs on day closing, in priority order. No advance charged.";
  };
  NG.prioritizeWork = (s, id) => {
    const q = NG.ensureManagement(s).queue,
      i = q.findIndex((j) => j.id === id);
    if (i < 0) throw Error("Task unavailable.");
    q.unshift(...q.splice(i, 1));
  };
  NG.cancelWork = (s, id) => {
    const m = NG.ensureManagement(s);
    m.queue = m.queue.filter((j) => j.id !== id);
  };
  // Facility daily rates already include contracted labor. Hired mechanics replace
  // only that labor allowance; rent/utilities and remaining crew stay payable.
  NG.enterpriseCosts = (s, day = s.day) => {
    const allowance = NG.ensureManagement(s)
      .staff.filter((w) => w.role === "mechanic")
      .reduce((n, w) => n + w.salary / 14, 0);
    const credit =
      (NG.enterpriseActive(s, "service") ? 60 : 0) +
      (NG.enterpriseActive(s, "fleet") ? 100 : 0);
    return (
      old.enterpriseCosts(s, day) - Math.min(credit, Math.floor(allowance))
    );
  };
  NG.operateDay = (s) => {
    const m = NG.ensureManagement(s),
      wages = NG.weeklyPayroll(s) / 7;
    const interest = Math.round(((s.enterprise?.loan || 0) * 0.02) / 7),
      bill = NG.operatingBill(s);
    m.accounts.push({
      day: s.day,
      wages,
      overhead: bill - s.inventory.length * 5 - interest,
      interest,
    });
    for (const w of m.staff) w.accrued += w.salary / 7;
    old.operateDay(s);
    if (s.day >= m.nextPayDay) {
      m.unpaid += m.staff.reduce((n, w) => n + Math.ceil(w.accrued - 1e-8), 0);
      for (const w of m.staff) w.accrued = 0;
      m.nextPayDay = s.day + 7;
      NG.payPayroll(s);
      NG.managementLog(
        s,
        m.unpaid
          ? "Payroll overdue / " + NG.money(m.unpaid)
          : "Weekly payroll settled.",
      );
    }
  };
  NG.nextDay = (s, rng = Math.random) => {
    const m = NG.ensureManagement(s);
    // Work uses the closing day's capacity; repairs then advance one night.
    for (const j of [...m.queue]) {
      if (![...s.inventory, ...s.market].some((c) => c.id === j.carId)) {
        NG.cancelWork(s, j.id);
        continue;
      }
      try {
        const c = s.inventory.find((c) => c.id === j.carId);
        if (
          j.kind === "repair" &&
          c &&
          NG.repairQuote(c, j.part, s) > j.maxCost
        )
          throw Error("Quote increased. Cancel and approve a new booking.");
        const result = NG.performWork(
          s,
          j.kind,
          j.carId,
          j.worker,
          j.part,
          j.offerId,
        );
        if (j.kind === "repair" && c && !NG.busy(s, c)) j.blocked = result;
        else NG.cancelWork(s, j.id);
      } catch (e) {
        j.blocked = e.message;
      }
    }
    for (const w of m.staff.filter((w) => w.auto && w.role === "sales")) {
      for (const c of s.inventory.filter((c) => !NG.busy(s, c))) {
        for (const o of c.offers.filter(
          (o) => o.stage === "question" && o.expiresDay >= s.day,
        )) {
          try {
            NG.performWork(s, "followup", c.id, w.id, null, o.id);
          } catch (e) {
            break;
          }
        }
        if (!c.listed && !c.prepared)
          try {
            NG.performWork(s, "prepare", c.id, w.id);
          } catch (e) {
            /* capacity exhausted */
          }
      }
    }
    m.lastUtilization = m.staff.map((w) => ({
      name: w.name,
      used: w.used,
      total: NG.workerHours(w),
    }));
    const report = old.nextDay(s, rng);
    m.ownerUsed = 0;
    for (const w of m.staff) w.used = 0;
    for (const j of [
      ...s.inventory.filter((c) => NG.busy(s, c) && c.repairMode !== "rush"),
      ...s.enterprise.orders.filter((j) => j.status === "running"),
    ]) {
      const w = m.staff.find((w) => w.id === j.assignedWorker);
      if (w) w.used = Math.min(NG.workerHours(w), w.used + 3);
      else if (j.assignedWorker === "owner")
        m.ownerUsed = Math.min(8, m.ownerUsed + 3);
    }
    report.enterpriseNotices.push(
      ...m.log
        .filter((l) => l.day === s.day || l.day === s.day - 1)
        .slice(0, 6)
        .map((l) => l.text),
    );
    return report;
  };
  NG.knownDailyBills = (s, day) =>
    old.knownDailyBills(s, day) + NG.weeklyPayroll(s) / 7;
  NG.sevenDayCosts = (s) => old.sevenDayCosts(s) + NG.payrollLiability(s);
  NG.cashRunway = (s) => {
    let cash = s.cash - s.operations.arrears - NG.payrollLiability(s),
      days = 0;
    while (days < 10000) {
      const bill = NG.knownDailyBills(s, s.day + days + 1);
      if (cash < bill) break;
      cash -= bill;
      days++;
    }
    return days === 10000 ? "10,000+" : days;
  };
  NG.payrollLiability = (s) => {
    const m = NG.ensureManagement(s);
    return m.unpaid + m.staff.reduce((n, w) => n + w.accrued, 0);
  };
  NG.businessValue = (s) =>
    Math.round(old.businessValue(s) - NG.payrollLiability(s));
  NG.managementSummary = (s) => {
    const m = NG.ensureManagement(s),
      from = s.day - 6,
      rows = s.ledger.filter((l) => l.day >= from),
      a = m.accounts.filter((a) => a.day >= from);
    const sales = s.sales.filter((x) => x.day >= from),
      orders = s.enterprise.orders.filter(
        (j) => j.status === "completed" && j.readyDay >= from,
      ),
      lots = s.enterprise.lots.filter(
        (j) => j.status === "settled" && j.readyDay >= from,
      );
    const revenue =
      sales.reduce((n, x) => n + x.price, 0) +
      [...orders, ...lots].reduce((n, x) => n + x.revenue, 0);
    const contribution =
      sales.reduce((n, x) => n + x.price - x.cost, 0) +
      [...orders, ...lots].reduce((n, x) => n + x.revenue - x.cost, 0) +
      rows.filter((l) => l.type === "refund").reduce((n, l) => n + l.amount, 0);
    const payroll = a.reduce((n, x) => n + (x.wages || 0), 0),
      overhead = a.reduce((n, x) => n + (x.overhead || 0), 0),
      interest = a.reduce((n, x) => n + (x.interest || 0), 0);
    const other =
      a.reduce((n, x) => n + (x.other || 0), 0) +
      rows
        .filter(
          (l) => ["marketing", "upgrade"].includes(l.type) && l.amount < 0,
        )
        .reduce((n, l) => n - l.amount, 0);
    return {
      other,
      revenue,
      direct: revenue - contribution,
      contribution,
      payroll,
      overhead,
      interest,
      result: contribution - payroll - overhead - interest - other,
      cashChange: rows.reduce((n, l) => n + l.amount, 0),
      weekly: NG.weeklyPayroll(s),
      nextPay: m.nextPayDay,
      nextAmount:
        NG.payrollLiability(s) +
        (NG.weeklyPayroll(s) / 7) * Math.max(0, m.nextPayDay - s.day),
      liability: NG.payrollLiability(s),
      reserve: s.cash - old.sevenDayCosts(s) - NG.payrollLiability(s),
    };
  };
})();
