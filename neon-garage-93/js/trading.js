/* v0.12: saved counterparties, public knowledge and multi-day deals.
   Random facts are sampled on creation; actions never reroll reservation prices. */
window.NG = window.NG || {};
(() => {
  const legacy = Object.fromEntries(
    [
      "generateCar",
      "value",
      "estimate",
      "inspect",
      "hagglePurchase",
      "haggleSale",
      "buy",
      "sell",
      "operateDay",
    ].map((k) => [k, NG[k]]),
  );
  NG.sellerKinds = [
    {
      id: "move",
      reason: "Moving out of town",
      urgency: 0.9,
      patience: 3,
      flexibility: 0.18,
      line: "The moving truck arrives soon. I need this settled.",
    },
    {
      id: "upgrade",
      reason: "Buying a newer car",
      urgency: 0.5,
      patience: 6,
      flexibility: 0.11,
      line: "My next car is ready. A clean deal would help.",
    },
    {
      id: "family",
      reason: "Family needs have changed",
      urgency: 0.6,
      patience: 5,
      flexibility: 0.13,
      line: "We need something different for the family.",
    },
    {
      id: "cash",
      reason: "Unexpected bills",
      urgency: 1,
      patience: 3,
      flexibility: 0.21,
      line: "I have bills due. Cash today matters to me.",
    },
    {
      id: "inherit",
      reason: "Inherited vehicle",
      urgency: 0.4,
      patience: 7,
      flexibility: 0.15,
      line: "It was my uncle’s. I know little about cars.",
    },
    {
      id: "collector",
      reason: "Reducing a collection",
      urgency: 0.1,
      patience: 10,
      flexibility: 0.04,
      line: "I can wait for someone who appreciates it.",
    },
    {
      id: "project",
      reason: "Unfinished project",
      urgency: 0.55,
      patience: 6,
      flexibility: 0.16,
      line: "I ran out of time for this project.",
    },
    {
      id: "problem",
      reason: "Expensive upkeep",
      urgency: 0.7,
      patience: 4,
      flexibility: 0.17,
      line: "Keeping it on the road has become expensive.",
    },
  ];
  NG.buyerKinds = [
    {
      id: "commuter",
      name: "Daily commuter",
      question: "Can I rely on it for work?",
      focus: "reliability",
      patience: 3,
    },
    {
      id: "enthusiast",
      name: "Weekend enthusiast",
      question: "Is it original? Any accident records?",
      focus: "performance",
      patience: 5,
    },
    {
      id: "budget",
      name: "Budget shopper",
      question: "What will it cost to keep running?",
      focus: "cost",
      patience: 2,
    },
    {
      id: "family",
      name: "Family driver",
      question: "Do you have service records?",
      focus: "documentation",
      patience: 4,
    },
  ];
  // A deterministic migration adds facts once without using the current random stream.
  NG.factRandom = (key) => {
    let seed = 2166136261;
    for (const ch of String(key))
      seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  };
  NG.attachTrading = (
    s,
    c,
    rng = NG.factRandom(c.id + ":" + c.model + ":" + c.year),
    migrating = false,
  ) => {
    if (c.vehicleHistory) return c;
    const kind = NG.sellerKinds[Math.min(7, Math.floor(rng() * 8))];
    const honesty = 0.25 + rng() * 0.7,
      knowledge = rng();
    c.vehicleHistory = {
      owners: 1 + Math.floor(rng() * 4),
      accident: rng() < 0.22,
      records: rng() < 0.6,
      neglected: c.parts.engine < 50,
      modified: rng() < 0.14,
      odometer: rng() < 0.1,
      paint: rng() < 0.25,
      detection: rng(),
      historyChecked: false,
      deepChecked: false,
    };
    // Unknown legacy history is neutral. Do not invent retrospective crashes or clocking.
    if (migrating)
      Object.assign(c.vehicleHistory, {
        owners: null,
        accident: false,
        records: null,
        modified: false,
        odometer: false,
        paint: false,
        legacyUnknown: true,
      });
    c.flaws.forEach((f) => {
      if (f.detection == null) f.detection = rng();
    });
    const expectation =
      0.98 + rng() * 0.12 + (1 - knowledge) * (rng() - 0.5) * 0.2;
    c.seller = {
      kind: kind.id,
      name:
        ["Ray", "Denise", "Frank", "Luis", "Joan", "Eddie", "Helen", "Mike"][
          Math.floor(rng() * 8)
        ] +
        " " +
        c.id.slice(1),
      reason: kind.reason,
      urgency: kind.urgency,
      patience: kind.patience,
      flexibility: kind.flexibility,
      financialPressure: kind.urgency,
      knowledge,
      risk: rng(),
      honesty,
      trust: 0.5,
      expectation,
      reservation: 0,
      contacted: false,
      detailsAsked: false,
      competitors: rng() < 0.3,
    };
    c.listing = {
      createdDay: s.day,
      originalAsk: c.ask,
      prices: [{ day: s.day, price: c.ask }],
      status: "active",
      expiresDay: s.day + 18 + Math.floor(rng() * 24),
      nextReviewDay: s.day + 3,
      callbacks: 0,
    };
    c.seller.reservation = Math.max(
      100,
      Math.round(
        Math.min(
          c.ask * 0.96,
          NG.value(s, c) * expectation * (1 - kind.flexibility),
        ),
      ),
    );
    c.transactionCost = c.transactionCost || 0;
    c.holdingCost = c.holdingCost || 0;
    return c;
  };
  NG.generateCar = (s, i, rng = Math.random) => {
    const c = legacy.generateCar(s, i, rng);
    NG.attachTrading(s, c, rng);
    // A collector's optimistic asking price and a cash seller's discount are different economic choices.
    c.ask =
      Math.round(
        (NG.value(s, c) *
          c.seller.expectation *
          (1.04 - c.seller.urgency * 0.17)) /
          25,
      ) * 25;
    c.listing.originalAsk = c.ask;
    c.listing.prices[0].price = c.ask;
    c.seller.reservation = Math.max(
      100,
      Math.round(c.ask * (1 - c.seller.flexibility)),
    );
    return c;
  };
  NG.ensureTrading = (s) => {
    s.trading = { schema: 12, archive: [], ...s.trading };
    for (const c of [...s.market, ...s.inventory]) {
      NG.attachTrading(s, c, undefined, true);
      const n = c.negotiation;
      if (n?.schema === 12 && !n.flowRevision) {
        // Repair the old unconditional competitor pause without erasing saved offers.
        if (
          n.status === "waiting" &&
          n.message === "Another buyer is interested. Let me think overnight."
        ) {
          n.status = "active";
          n.closed = false;
          n.sessionRounds = 0;
          n.competitionConsidered = true;
          delete n.resumeDay;
          n.message =
            "There is other interest, but we can discuss the price. My counteroffer is " +
            NG.money(n.price) +
            ".";
          n.history.push({
            day: s.day,
            action: "continue",
            message: n.message,
            price: n.price,
          });
        }
        n.flowRevision = 1;
      }
    }
    return s;
  };
  NG.vehicleFactor = (s, c, publicOnly = false) => {
    const h = c.vehicleHistory;
    if (!h) return 1;
    const known = !publicOnly || h.historyChecked;
    const shape = NG.model(c).shape;
    const seasonal =
      shape === "roadster" ? 1 + Math.sin((s.day + 35) / 58) * 0.06 : 1;
    const supply = s.market.filter(
      (x) => x.model === c.model && x.id !== c.id,
    ).length;
    return (
      seasonal *
      NG.clamp(1 - supply * 0.012, 0.94, 1) *
      (known
        ? (h.records == null ? 1 : h.records ? 1.035 : 0.96) *
          (h.accident ? 0.91 : 1) *
          (h.modified ? 0.97 : 1) *
          (h.odometer ? 0.9 : 1)
        : 1)
    );
  };
  NG.value = (s, c) =>
    Math.max(200, Math.round(legacy.value(s, c) * NG.vehicleFactor(s, c)));
  // This estimate only uses disclosed/observed facts, never the hidden true valuation.
  NG.estimate = (s, c) => {
    const observed = c.inspected
      ? NG.condition(c)
      : NG.clamp(c.claim - (s.progress?.market || 0) * 2, 30, 95);
    const faults = c.flaws
      .filter((f) => f.revealed && !f.fixed)
      .reduce((n, f) => n + f.cost * 0.75, 0);
    return Math.max(
      200,
      Math.round(
        (NG.baseValue(c) *
          (0.3 + (0.7 * observed) / 100) *
          (s.demand[NG.model(c).segment] || 1) -
          faults) *
          NG.vehicleFactor(s, c, true),
      ),
    );
  };
  NG.cost = (c) =>
    (c.purchasePrice || 0) +
    (c.inspectionCost || 0) +
    (c.repairCost || 0) +
    (c.transactionCost || 0) +
    (c.holdingCost || 0);
  NG.dealSummary = (s, c) => {
    const estimate = NG.estimate(s, c),
      uncertainty = c.vehicleHistory?.deepChecked
        ? 0.06
        : c.inspected
          ? 0.13
          : 0.25 - (s.progress?.market || 0) * 0.035;
    const repairs = c.flaws
      .filter((f) => f.revealed && !f.fixed)
      .reduce((n, f) => n + f.cost, 0);
    return {
      price: NG.purchaseQuote(c),
      repairs,
      risk: Math.round(estimate * uncertainty),
      fee: 50,
      low: Math.round(estimate * (1 - uncertainty) * 0.95),
      high: Math.round(estimate * (1 + uncertainty) * 1.04),
      invested: NG.cost(c),
    };
  };
  NG.contactSeller = (s, id, action = "contact") => {
    const c = s.market.find((c) => c.id === id);
    if (!c) throw Error("This listing is no longer available.");
    const p = c.seller;
    if (action === "contact") {
      p.contacted = true;
      return NG.sellerKinds.find((k) => k.id === p.kind).line;
    }
    if (action === "details") {
      if (p.detailsAsked) throw Error("You already asked about this car.");
      p.contacted = true;
      p.detailsAsked = true;
      p.trust = NG.clamp(p.trust + 0.08, 0, 1);
      return p.honesty > 0.6 && c.flaws.length
        ? "It has had mechanical trouble. You should check it."
        : "That is my asking price. Come take a look and decide.";
    }
    throw Error("Unknown seller action.");
  };
  NG.checkHistory = (s, id) => {
    const c = [...s.market, ...s.inventory].find((c) => c.id === id);
    if (!c) throw Error("Car not found.");
    if (c.vehicleHistory.historyChecked)
      throw Error("Records already checked.");
    if (s.cash < 35) throw Error("You need $35 for the records search.");
    s.cash -= 35;
    c.inspectionCost += 35;
    c.vehicleHistory.historyChecked = true;
    NG.record(s, "inspection", -35, NG.model(c).name + " / vehicle records");
    NG.reopenWithEvidence(s, c);
    return "Records retrieved. Missing documents still leave uncertainty.";
  };
  NG.inspect = (s, id, quality = "standard") => {
    const c = [...s.market, ...s.inventory].find((c) => c.id === id);
    if (!c) throw Error("This car is no longer available.");
    if (!c.vehicleHistory) return legacy.inspect(s, id);
    if (!["standard", "deep"].includes(quality))
      throw Error("Choose a valid inspection.");
    if (quality === "standard" && c.inspected)
      throw Error("This car has already been inspected.");
    if (quality === "deep" && c.vehicleHistory.deepChecked)
      throw Error("Specialist examination already completed.");
    const fee = NG.inspectionPrice(s) * (quality === "deep" ? 2 : 1);
    if (s.cash < fee)
      throw Error("You need " + NG.money(fee) + " for an inspection.");
    s.cash -= fee;
    c.inspectionCost += fee;
    c.inspected = true;
    const coverage =
      quality === "deep" ? 0.88 : 0.58 + (s.progress?.mechanical || 0) * 0.08;
    for (const f of c.flaws)
      if ((f.detection ?? c.vehicleHistory.detection) < coverage)
        f.revealed = true;
    if (quality === "deep") {
      c.vehicleHistory.deepChecked = true;
      c.vehicleHistory.historyChecked = true;
    }
    c.inspectionReport = {
      day: s.day,
      quality,
      coverage,
      message:
        "Observed condition recorded. Intermittent faults can remain undetected.",
    };
    NG.record(
      s,
      "inspection",
      -fee,
      NG.model(c).name + " / " + quality + " inspection",
    );
    NG.reopenWithEvidence(s, c);
  };
  NG.evidence = (c) =>
    c.flaws
      .filter((f) => f.revealed && !f.fixed)
      .reduce((n, f) => n + f.cost, 0) +
    (c.vehicleHistory?.historyChecked
      ? (c.vehicleHistory.accident ? 150 : 0) +
        (c.vehicleHistory.odometer ? 150 : 0)
      : 0);
  NG.reopenWithEvidence = (s, c) => {
    const n = c.negotiation;
    if (
      n?.schema === 12 &&
      !n.walked &&
      NG.evidence(c) > (n.evidenceUsed || 0)
    ) {
      n.closed = false;
      n.status = "active";
      delete n.resumeDay;
      n.message = "New evidence? Tell me what the inspection found.";
    }
  };
  NG.purchaseQuote = (c) => c.negotiation?.price ?? c.ask;
  NG.hagglePurchase = (s, id, bid, rng = Math.random, tactic = "direct") => {
    const c = s.market.find((c) => c.id === id);
    if (!c) throw Error("This listing is no longer available.");
    if (!c.seller || (c.negotiation && c.negotiation.schema !== 12))
      return legacy.hagglePurchase(s, id, bid, rng);
    if (s.inventory.length >= s.capacity)
      throw Error("Your garage is full. Sell a car first.");
    const p = c.seller,
      n = c.negotiation;
    if (
      n?.closed ||
      n?.status === "callback" ||
      (n?.resumeDay != null && s.day < n.resumeDay)
    )
      throw Error("Wait for the seller or choose another deal.");
    if (!["direct", "fault", "cash", "inspection"].includes(tactic))
      throw Error("Choose a valid negotiation tactic.");
    const current = NG.purchaseQuote(c);
    if (!Number.isInteger(bid) || bid < 100 || bid >= current)
      throw Error(
        "Offer whole dollars below the current price (minimum $100).",
      );
    if (bid + 50 > s.cash) throw Error("Keep $50 cash for the transfer fee.");
    if (
      n &&
      n.lastDay === s.day &&
      bid <= n.lastBid &&
      NG.evidence(c) <= (n.evidenceUsed || 0)
    )
      throw Error("Raise your offer or bring new evidence.");
    const d =
      n ||
      (c.negotiation = {
        schema: 12,
        flowRevision: 1,
        sessionRounds: 0,
        price: c.ask,
        rounds: 0,
        lastBid: 0,
        closed: false,
        walked: false,
        status: "active",
        history: [],
        minimum: p.reservation,
        evidenceUsed: 0,
      });
    p.contacted = true;
    d.rounds++;
    d.sessionRounds = (d.sessionRounds || 0) + 1;
    d.lastBid = bid;
    d.lastDay = s.day;
    const evidence = NG.evidence(c),
      newEvidence = Math.max(0, evidence - d.evidenceUsed);
    let allowance = 0;
    if (tactic === "fault" && newEvidence > 0) {
      allowance = Math.min(newEvidence * 0.6, c.ask * 0.12);
      d.evidenceUsed = evidence;
      p.trust = NG.clamp(p.trust + 0.08, 0, 1);
    } else if (tactic === "fault") p.trust = NG.clamp(p.trust - 0.18, 0, 1);
    if (tactic === "cash") allowance += c.ask * 0.035 * p.urgency;
    if (tactic === "inspection" && c.inspected)
      allowance += c.ask * 0.015 * p.trust;
    const skilled =
      c.ask *
      ((s.progress?.negotiation || 0) * 0.008 +
        Math.min(s.reputation, 20) * 0.0007);
    d.minimum = Math.max(100, Math.round(p.reservation - skilled - allowance));
    const insult = c.ask * (0.52 + (1 - p.flexibility) * 0.12);
    if (bid < insult || p.trust < 0.12) {
      d.walked = true;
      d.closed = true;
      d.status = "walked";
      d.resumeDay = s.day + 2;
      p.trust = NG.clamp(p.trust - 0.2, 0, 1);
      d.message = "That is not a serious offer. Call me another day.";
    } else {
      const competitiveMinimum =
        p.competitors && !d.competitionConsidered && p.urgency < 0.8
          ? Math.max(
              d.minimum,
              Math.min(
                Math.round(c.ask * 0.98),
                Math.round(d.minimum * (1.015 + p.risk * 0.035)),
              ),
            )
          : d.minimum;
      if (bid >= competitiveMinimum) {
        d.price = bid;
        d.closed = true;
        d.status = "agreed";
        d.agreedUntil = s.day + 1;
        d.message =
          "All right. " + NG.money(bid) + " plus transfer, and it is yours.";
      } else {
        d.price = Math.min(
          current,
          Math.max(
            competitiveMinimum,
            Math.round(current - (current - bid) * (p.flexibility + 0.2)),
          ),
        );
        const compareOtherBuyer =
          p.competitors &&
          !d.competitionConsidered &&
          p.urgency < 0.8 &&
          d.sessionRounds >= 2 &&
          bid >= d.minimum;
        if (
          compareOtherBuyer ||
          d.sessionRounds >= p.patience + (s.progress?.oneMoreShot ? 1 : 0)
        ) {
          d.status = "waiting";
          d.resumeDay = s.day + 1;
          if (compareOtherBuyer) d.competitionConsidered = true;
          d.message =
            (compareOtherBuyer
              ? "I will compare the other interest overnight. "
              : "Let us take a break until tomorrow. ") +
            "My counteroffer is " +
            NG.money(d.price) +
            ".";
        } else {
          d.status = "active";
          d.message =
            (tactic === "fault" && !newEvidence
              ? "I need proof of that fault. "
              : p.competitors && !d.competitionConsidered
                ? "There is other interest, so I have less room. "
                : "") +
            "I could do " +
            NG.money(d.price) +
            ". What can you offer?";
        }
      }
    }
    d.history.push({
      day: s.day,
      bid,
      tactic,
      response: d.status,
      message: d.message,
      price: d.price,
    });
    return p.name + ': "' + d.message + '"';
  };
  NG.pauseDeal = (s, id, walk = false) => {
    const c = s.market.find((c) => c.id === id);
    if (!c) throw Error("This listing is no longer available.");
    if (c.negotiation && c.negotiation.schema !== 12)
      throw Error("This saved legacy negotiation cannot be reopened.");
    const n =
      c.negotiation ||
      (c.negotiation = {
        schema: 12,
        flowRevision: 1,
        sessionRounds: 0,
        price: c.ask,
        rounds: 0,
        lastBid: 0,
        history: [],
        evidenceUsed: 0,
      });
    if (n.walked || n.status === "waiting")
      throw Error("This deal is already paused.");
    n.status = walk ? "walked" : "waiting";
    n.walked = walk;
    n.closed = walk;
    n.resumeDay = s.day + (walk ? 2 : 1);
    n.message = walk
      ? "You ended the call. The seller may call back."
      : "Call back tomorrow. The car may sell meanwhile.";
    n.history.push({
      day: s.day,
      action: walk ? "walk" : "wait",
      message: n.message,
    });
    return n.message;
  };
  NG.resumeDeal = (s, id) => {
    const c = s.market.find((c) => c.id === id),
      n = c?.negotiation;
    if (!n || n.schema !== 12 || n.status !== "callback")
      throw Error("The seller has not invited another call.");
    n.closed = false;
    n.walked = false;
    n.status = "active";
    n.sessionRounds = 0;
    delete n.resumeDay;
    n.message =
      "Still interested? We can talk again. Previous offers are on record.";
    n.history.push({
      day: s.day,
      action: "resume",
      message: n.message,
      price: n.price,
    });
    return n.message;
  };
  NG.advanceListings = (s, rng = Math.random) => {
    NG.ensureTrading(s);
    for (const c of s.market) {
      const p = c.seller,
        l = c.listing,
        n = c.negotiation,
        age = s.day - l.createdDay;
      let status = "active";
      if (s.day >= l.expiresDay) status = "expired";
      else if (
        n?.status !== "agreed" &&
        rng() <
          (0.015 + 0.045 * p.urgency) * (s.demand[NG.model(c).segment] || 1)
      )
        status = "sold-elsewhere";
      else if (age > 10 && p.urgency < 0.3 && rng() < 0.025)
        status = "withdrawn";
      l.status = status;
      if (status !== "active") {
        s.trading.archive.push({
          id: c.id,
          model: c.model,
          day: s.day,
          age,
          status,
          inspectionCost: c.inspectionCost,
        });
        continue;
      }
      if (s.day >= l.nextReviewDay) {
        l.nextReviewDay = s.day + 3;
        if (p.urgency > 0.4 && age >= 3) {
          const price = Math.max(
            p.reservation,
            Math.round(c.ask * (1 - 0.025 * p.urgency)),
          );
          if (price < c.ask) {
            c.ask = price;
            l.prices.push({ day: s.day, price });
            if (!n?.closed) {
              if (n) n.price = Math.min(n.price, price);
            }
          }
          p.reservation = Math.max(
            100,
            Math.round(p.reservation * (1 - 0.009 * p.urgency)),
          );
        }
      }
      if (n?.schema === 12 && n.status === "agreed" && s.day > n.agreedUntil) {
        n.closed = false;
        n.status = "active";
        n.price = c.ask;
        n.message = "The reserved price expired. Let us talk again.";
      }
      if (n?.schema === 12 && n.resumeDay != null && s.day >= n.resumeDay) {
        if (!n.walked || p.urgency >= 0.5 || age >= 8) {
          n.status = "callback";
          n.message = "The car is still here. Call me if you are interested.";
          l.callbacks++;
          delete n.resumeDay;
        }
      }
    }
    s.market = s.market.filter((c) => c.listing.status === "active");
    const arrivals = 1 + Math.floor(rng() * 3);
    const listingLimit = s.event.kind === "rare" ? 13 : 14;
    for (let i = 0; i < arrivals && s.market.length < listingLimit; i++) {
      // Common low-cost models remain available in a small city; rare models appear less often.
      const low = rng() < 0.4,
        iModel = low
          ? [4, 9, 0][Math.floor(rng() * 3)]
          : Math.floor(rng() * NG.catalog.length);
      s.market.push(NG.generateCar(s, iModel, rng));
    }
    if (s.event.kind === "rare" && s.market.length < 14) {
      const c = NG.generateCar(s, 5, rng);
      c.ask = Math.round(c.ask * 0.8);
      c.seller.reservation = Math.min(
        c.seller.reservation,
        Math.round(c.ask * 0.94),
      );
      c.listing.originalAsk = c.ask;
      c.listing.prices[0].price = c.ask;
      s.market.push(c);
    }
    s.trading.archive = s.trading.archive.slice(-120);
  };
  NG.makeBuyer = (s, c, rng = Math.random) => {
    const identity = NG.chooseBuyer(s, c, rng),
      previous = s.customers.find(
        (x) => x.name === identity.buyer,
      )?.buyerProfile,
      k =
        NG.buyerKinds.find((x) => x.id === previous?.id) ||
        NG.buyerKinds[Math.min(3, Math.floor(rng() * 4))],
      m = NG.model(c),
      h = c.vehicleHistory;
    const fit =
      k.id === "enthusiast"
        ? ["sport", "roadster"].includes(m.shape)
          ? 1.08
          : 0.91
        : k.id === "family"
          ? m.shape === "sedan"
            ? 1.06
            : 0.9
          : k.id === "budget"
            ? NG.clamp(1.08 - (m.service || 1) * 0.06, 0.83, 1)
            : 0.9 + (NG.condition(c) / 100) * 0.14;
    const docs = h?.records ? 1.03 : k.focus === "documentation" ? 0.88 : 0.98;
    const budget = Math.round(
      NG.listingValue(s, c) *
        fit *
        docs *
        (0.92 + rng() * 0.18) *
        (identity.returning ? 1.03 : 1),
    );
    const question = rng() < 0.5;
    const openingFactor = c.inspected ? 0.96 : 0.94;
    return {
      id: "o" + s.nextId++,
      ...identity,
      profile: {
        ...k,
        fit,
        budget,
        trust: 0.45 + Math.min(s.reputation, 30) * 0.01,
      },
      stage: question ? "question" : "offer",
      price: Math.min(c.listPrice, Math.round(budget * openingFactor)),
      openingPrice: Math.min(c.listPrice, Math.round(budget * openingFactor)),
      createdDay: s.day,
      expiresDay: s.day + k.patience,
      seen: false,
      message: question
        ? k.question
        : "I could offer " +
          NG.money(Math.min(c.listPrice, Math.round(budget * openingFactor))) +
          ".",
    };
  };
  NG.advanceBuyers = (s, c, rng = Math.random) => {
    c.buyerMessage = null;
    c.offers = c.offers.filter(
      (o) => o.expiresDay != null && o.expiresDay >= s.day,
    );
    if (!c.listed || NG.busy(s, c)) return;
    const ratio = c.listPrice / NG.listingValue(s, c),
      age = s.day - (c.listedDay ?? s.day);
    const chance = NG.clamp(
      1.2 -
        ratio * 0.65 +
        NG.interestBonus(s) +
        (NG.localEffect?.(s, "interest") || 0) +
        (NG.localEffect?.(s, "interest") || 0) +
        (s.event.kind === "rush" ? 0.12 : 0),
      0.01,
      0.9,
    );
    if (c.offers.length < 3 && rng() < chance)
      c.offers.push(NG.makeBuyer(s, c, rng));
    c.marketAdvice =
      age > 7 && ratio > 1.15
        ? "Few buyers at this price. Consider a reduction or a dealer exit."
        : null;
  };
  NG.answerBuyer = (s, id, offerId, response = "condition") => {
    const c = s.inventory.find((c) => c.id === id),
      o = c?.offers.find((o) => o.id === offerId);
    if (!o || o.stage !== "question" || o.expiresDay < s.day)
      throw Error("This question is no longer active.");
    if (!["condition", "records", "as-is"].includes(response))
      throw Error("Choose a valid response.");
    const proven =
      response === "condition"
        ? c.inspected
        : response === "records"
          ? c.vehicleHistory?.historyChecked && c.vehicleHistory.records
          : true;
    o.stage = "offer";
    if (proven) {
      o.profile.trust = NG.clamp(o.profile.trust + 0.15, 0, 1);
      o.message = "Thanks for being clear. Here is my offer.";
    } else {
      o.price = Math.round(o.price * 0.94);
      o.profile.trust -= 0.15;
      o.message = "Without evidence, I need room in my budget for surprises.";
    }
    return o.buyer + ": " + o.message;
  };
  NG.haggleSale = (s, id, oid, price, rng = Math.random, tactic = "price") => {
    const c = s.inventory.find((c) => c.id === id),
      o = c?.offers.find((o) => o.id === oid);
    if (!o?.profile) return legacy.haggleSale(s, id, oid, price, rng);
    if (!c.listed || NG.busy(s, c) || o.expiresDay < s.day)
      throw Error("This offer is no longer valid.");
    if (o.stage === "question")
      throw Error("Answer the buyer’s question first.");
    if (o.negotiation?.closed)
      throw Error("This buyer has made their final offer.");
    if (!["price", "records", "reliability"].includes(tactic))
      throw Error("Choose a valid selling tactic.");
    if (!Number.isInteger(price) || price <= o.price || price > c.listPrice)
      throw Error(
        "Enter whole dollars above " +
          NG.money(o.price) +
          " and no more than " +
          NG.money(c.listPrice) +
          ".",
      );
    const n =
      o.negotiation ||
      (o.negotiation = {
        schema: 12,
        rounds: 0,
        closed: false,
        openingPrice: o.price,
        history: [],
      });
    n.rounds++;
    const proof =
      tactic === "records"
        ? c.vehicleHistory.historyChecked &&
          c.vehicleHistory.records &&
          o.profile.focus === "documentation"
        : tactic === "reliability"
          ? c.inspected &&
            NG.condition(c) >= 75 &&
            o.profile.focus === "reliability"
          : false;
    const ceiling = Math.min(
      c.listPrice,
      Math.round(
        o.profile.budget *
          ((proof ? 1.035 : 1) + (s.progress?.negotiation || 0) * 0.008),
      ),
    );
    n.budget = ceiling;
    if (price > ceiling * (1.08 + o.profile.trust * 0.05)) {
      o.stage = "withdrawn";
      c.offers = c.offers.filter((x) => x.id !== oid);
      c.buyerMessage =
        o.buyer + ": Too much for my needs. I will keep looking.";
      return c.buyerMessage;
    }
    if (price <= ceiling) {
      o.price = price;
      n.closed = true;
      o.stage = "agreed";
      n.message = "That works for me. Let us close it.";
    } else {
      o.price = Math.max(
        o.price,
        Math.min(ceiling, Math.round(o.price + (ceiling - o.price) * 0.65)),
      );
      n.closed = n.rounds >= o.profile.patience;
      o.stage = "offer";
      n.message = n.closed
        ? "This is my final offer."
        : "I can stretch a little. Can we meet here?";
    }
    n.history.push({ day: s.day, price, tactic, response: o.stage });
    return o.buyer + ": " + n.message;
  };
  const privateSale = NG.afterPrivateSale;
  NG.afterPrivateSale = (s, c, o, sale) => {
    privateSale(s, c, o, sale);
    if (o.profile) {
      const customer = s.customers.find((x) => x.name === o.buyer);
      customer.buyerProfile = {
        id: o.profile.id,
        name: o.profile.name,
        focus: o.profile.focus,
        patience: o.profile.patience,
      };
    }
  };
  NG.buy = (s, id) => {
    const c = s.market.find((c) => c.id === id);
    if (!c?.seller) return legacy.buy(s, id);
    const n = c.negotiation;
    if (
      n?.schema === 12 &&
      ["waiting", "callback", "walked"].includes(n.status)
    )
      throw Error("Resume the conversation before buying.");
    if (n?.schema === 12 && n.status === "agreed" && s.day > n.agreedUntil)
      throw Error("The agreed price has expired.");
    if (s.cash < NG.purchaseQuote(c) + 50)
      throw Error("You need the price plus the $50 transfer fee.");
    legacy.buy(s, id);
    s.cash -= 50;
    c.transactionCost += 50;
    c.acquiredDay = s.day;
    c.listing.status = "purchased";
    NG.record(s, "transaction", -50, NG.model(c).name + " / title transfer");
  };
  NG.sell = (s, id, oid) => {
    const c = s.inventory.find((c) => c.id === id),
      o = c?.offers.find((o) => o.id === oid);
    if (o?.stage === "question")
      throw Error("An inquiry is not a binding offer. Answer it first.");
    if (o?.expiresDay != null && o.expiresDay < s.day)
      throw Error("This offer has expired.");
    const profit = legacy.sell(s, id, oid);
    const sale = s.sales[0];
    sale.acquisitionCost = c.purchasePrice;
    sale.inspectionCost = c.inspectionCost;
    sale.transactionCost = c.transactionCost || 0;
    sale.holdingCost = c.holdingCost || 0;
    sale.daysInStock = s.day - (c.acquiredDay ?? s.day);
    return profit;
  };
  const list = NG.list;
  NG.list = (s, id, price, mode) => {
    const c = s.inventory.find((c) => c.id === id);
    list(s, id, price, mode);
    c.listedDay = s.day;
  };
  NG.payBillParts = (s) => {
    const o = s.operations;
    o.lastPaid = Math.min(s.cash, o.arrears);
    s.cash -= o.lastPaid;
    o.arrears -= o.lastPaid;
    let paid = o.lastPaid;
    for (const type of ["holding", "interest", "overhead"]) {
      const amount = Math.min(paid, o.dueBreakdown[type]);
      o.dueBreakdown[type] -= amount;
      paid -= amount;
      if (amount)
        NG.record(
          s,
          type,
          -amount,
          {
            holding: "Inventory holding",
            interest: "Business credit interest",
            overhead: "Rent, utilities and facilities",
          }[type] + " / operating bill payment",
        );
    }
  };
  NG.operateDay = (s) => {
    if (!s.trading) return legacy.operateDay(s);
    const o = s.operations,
      interest = Math.round(((s.enterprise?.loan || 0) * 0.02) / 7);
    o.dueBreakdown ||= { holding: 0, interest: 0, overhead: o.arrears };
    const holding = s.inventory.length * 5;
    for (const c of s.inventory) c.holdingCost = (c.holdingCost || 0) + 5;
    o.lastBill = NG.operatingBill(s);
    o.arrears += o.lastBill;
    o.dueBreakdown.holding += holding;
    o.dueBreakdown.interest += interest;
    o.dueBreakdown.overhead += o.lastBill - holding - interest;
    NG.payBillParts(s);
    o.notice =
      "Operating bills: " +
      NG.money(o.lastPaid) +
      " paid" +
      (o.arrears
        ? ", " +
          NG.money(o.arrears) +
          " overdue. New purchases and repairs are blocked."
        : ".");
  };
  const legacyPayBills = NG.payOperatingBills;
  NG.payOperatingBills = (s) => {
    if (!s.trading) return legacyPayBills(s);
    if (!s.operations.arrears) throw Error("No overdue operating bills.");
    if (!s.cash) throw Error("No cash available. Sell a car to raise funds.");
    s.operations.dueBreakdown ||= {
      holding: 0,
      interest: 0,
      overhead: s.operations.arrears,
    };
    NG.payBillParts(s);
    return NG.money(s.operations.lastPaid) + " paid toward operating bills.";
  };
  NG.economics = (s) => ({
    cash: s.cash,
    inventory: s.inventory.reduce(
      (n, c) => n + Math.round(NG.value(s, c) * 0.72),
      0,
    ),
    acquisition: s.inventory.reduce((n, c) => n + (c.purchasePrice || 0), 0),
    repairs: s.inventory.reduce((n, c) => n + c.repairCost, 0),
    transfers: s.inventory.reduce((n, c) => n + (c.transactionCost || 0), 0),
    holding: s.inventory.reduce((n, c) => n + (c.holdingCost || 0), 0),
    margin: NG.totalMargin(s),
    overhead: s.ledger
      .filter((l) => ["overhead", "marketing"].includes(l.type))
      .reduce((n, l) => n - l.amount, 0),
    interest: s.ledger
      .filter((l) => l.type === "interest")
      .reduce((n, l) => n - l.amount, 0),
    cashFlow: s.ledger.reduce((n, l) => n + l.amount, 0),
    netWorth: NG.businessValue(s),
  });
  // Optional reproducible practice saves, kept separate from the player's dealership.
  NG.practiceScenario = (kind) => {
    const s = NG.newState(),
      rng = NG.factRandom("practice-" + kind);
    s.cash = 5000;
    s.market = [NG.generateCar(s, 4, rng)];
    const c = s.market[0];
    c.parts = {
      engine: 78,
      transmission: 75,
      suspension: 72,
      body: 80,
      cosmetic: 76,
    };
    c.claim = 82;
    c.seller.competitors = false;
    c.seller.trust = 0.6;
    c.seller.expectation = 1;
    if (kind === "A") {
      Object.assign(c.seller, {
        kind: "move",
        reason: "Moving out of town",
        urgency: 0.95,
        flexibility: 0.2,
        patience: 3,
      });
      c.flaws = [];
      c.ask = 2200;
      c.seller.reservation = 1750;
    } else if (kind === "B") {
      c.ask = 2600;
      c.flaws = [
        { ...NG.flaws[0], fixed: false, revealed: false, detection: 0.2 },
      ];
      Object.assign(c.vehicleHistory, {
        accident: true,
        records: false,
        odometer: true,
      });
      c.seller.reservation = 2400;
    } else if (kind === "C") {
      c.flaws = [];
      c.ask = 2100;
      c.seller.reservation = 1950;
      NG.buy(s, c.id);
      NG.list(s, c.id, 4000, "as-is");
    } else throw Error("Unknown practice scenario.");
    if (kind !== "C") {
      c.listing.originalAsk = c.ask;
      c.listing.prices = [{ day: s.day, price: c.ask }];
    }
    s.practice = kind;
    return s;
  };
})();

// Slow regional processes with occasional news; every planned target is saved.
NG.planWave = (rng = Math.random) => ({
  segment: ["japan", "europe", "america"][Math.min(2, Math.floor(rng() * 3))],
  multiplier: Math.round((0.9 + rng() * 0.2) * 100) / 100,
  duration: 8 + Math.floor(rng() * 9),
});
NG.advanceMarket = (s, rng = Math.random) => {
  NG.ensureStrategy(s);
  const t = s.marketTrends;
  for (const key of ["japan", "europe", "america"]) {
    const w = t.waves[key];
    w.remaining = Math.max(0, w.remaining - 1);
    const target = w.remaining ? w.multiplier : 1;
    s.demand[key] =
      Math.round(
        NG.clamp(
          s.demand[key] +
            NG.clamp(target - s.demand[key], -0.012, 0.012) +
            (rng() - 0.5) * 0.006,
          0.8,
          1.22,
        ) * 1000,
      ) / 1000;
  }
  const due = s.day >= (t.nextEventDay ?? 1);
  if (due) {
    const w = t.next;
    t.waves[w.segment] = { multiplier: w.multiplier, remaining: w.duration };
    t.next = NG.planWave(rng);
    t.nextEventDay = s.day + 7 + Math.floor(rng() * 7);
  }
  t.history.push({ day: s.day, ...s.demand });
  t.history = t.history.slice(-60);
  s.event = {
    kind: "trend",
    title: due ? "New market outlook" : "Silver Palms market watch",
    text: due
      ? "Local demand is shifting gradually. Watch supply and asking prices over the coming weeks."
      : "No sudden market swing. Old listings and patient sellers remain part of today’s market.",
  };
};
NG.listingModes.honest.name = "Inspected / disclose observed faults";
NG.listingModes.honest.description =
  "Share the inspection and all detected faults. Undetected problems remain possible; no fault-free guarantee.";
