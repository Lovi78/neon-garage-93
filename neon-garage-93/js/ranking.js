/* v0.14 F/4 - something to play for.
   Silver Palms Dealer Ranking: six local rival dealers and you, ranked by
   business value every Friday. Rank unlocks open new play (pricier cars,
   collector buyers, bigger credit). Season 1 "Summer of '93" runs 13 weeks
   with a short list of goals and rewards.
   Rivals are a deterministic function of the week, so the ranking never
   touches the game's random stream: simulations and replays stay identical
   until an unlock changes what the market offers. */
window.NG = window.NG || {};
(() => {
  NG.rivals = [
    {
      id: "coral",
      name: "Coral Bay Classics",
      line: "Collector cars by appointment only.",
      start: 17000,
      weekly: 800,
    },
    {
      id: "sals",
      name: "Sal's Auto Row",
      line: "Forty cars on the lot, flags on every antenna.",
      start: 13500,
      weekly: 650,
    },
    {
      id: "palm",
      name: "Palm Coast Imports",
      line: "Japanese and German, freshly landed.",
      start: 11000,
      weekly: 450,
    },
    {
      id: "ray",
      name: "Big Ray's Motors",
      line: "Ray shouts on the morning radio.",
      start: 8500,
      weekly: 350,
    },
    {
      id: "westside",
      name: "Westside Wheels",
      line: "Two brothers and a tow truck.",
      start: 6500,
      weekly: 250,
    },
    {
      id: "duke",
      name: "Duke's Discount Cars",
      line: "Cash only, no questions.",
      start: 4200,
      weekly: 150,
    },
  ];
  NG.seasonWeeks = 13;
  NG.playerDealer = "Neon Garage";
  // Rank unlocks: the best rank ever reached on a Friday counts.
  NG.rankUnlocks = [
    {
      id: "top5",
      rank: 5,
      title: "Buyer networks & auction tips",
      text: "Choose a buyer audience when listing a car: enthusiast, family, budget or commuter. Focused ads cost $35 and reach fewer buyers. Pricier TIP listings also become available.",
    },
    {
      id: "top3",
      rank: 3,
      title: "Collector network",
      text: "Collector buyers start calling you, and the bank raises your credit line to $25,000.",
    },
    {
      id: "first",
      rank: 1,
      title: "Top dealer in Silver Palms",
      text: "Season won. +5 REP and the town knows your name.",
    },
  ];

  // Deterministic wobble in [-1, 1) per dealer and week.
  const wobble = (id, week) => {
    let h = 2166136261;
    for (const ch of id + ":" + week)
      h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 1274126177);
    return (((h ^ (h >>> 16)) >>> 0) / 4294967296) * 2 - 1;
  };
  NG.rivalValue = (r, week) =>
    Math.round(
      ((r.start + r.weekly * week) * (1 + 0.04 * wobble(r.id, week))) / 50,
    ) * 50;

  const firstFriday = (day) => {
    let d = day;
    while (!NG.isRentDay(d)) d++;
    return d;
  };
  NG.ensureSeason = (s) => {
    if (!s.season) {
      s.season = {
        id: 1,
        name: "Summer of '93",
        startDay: s.day,
        firstFriday: firstFriday(s.day + (NG.isRentDay(s.day) ? 1 : 0)),
        week: 0,
        best: null,
        rank: null,
        table: [],
        history: [],
        unlocked: {},
        goals: {},
        flags: {},
        final: null,
        notice: "",
      };
      NG.snapshotRanking(s);
    }
    return s.season;
  };
  NG.seasonEndDay = (s) =>
    NG.ensureSeason(s).firstFriday + (NG.seasonWeeks - 1) * 7;
  NG.seasonWeekOf = (s, day) => {
    const z = NG.ensureSeason(s);
    return day < z.firstFriday ? 0 : Math.floor((day - z.firstFriday) / 7) + 1;
  };
  NG.rankUnlocked = (s, id) => !!s.season?.unlocked?.[id];

  // Rivals at their latest Friday figure, you at today's business value.
  NG.standings = (s, week = s.season?.week || 0) =>
    [
      ...NG.rivals.map((r) => ({
        id: r.id,
        name: r.name,
        line: r.line,
        value: NG.rivalValue(r, week),
      })),
      {
        id: "you",
        name: NG.playerDealer,
        line: "Your garage.",
        value: NG.businessValue(s),
        you: true,
      },
    ].sort((a, b) => b.value - a.value || (a.you ? -1 : b.you ? 1 : 0));

  NG.snapshotRanking = (s) => {
    const z = s.season,
      table = NG.standings(s, z.week),
      last = Object.fromEntries(z.table.map((t, i) => [t.id, i + 1]));
    z.table = table.map((t, i) => ({
      id: t.id,
      value: t.value,
      move: last[t.id] ? last[t.id] - (i + 1) : 0,
    }));
    z.rank = table.findIndex((t) => t.you) + 1;
    return z.rank;
  };

  NG.nextRival = (s) => {
    const z = NG.ensureSeason(s),
      i = z.rank - 2;
    if (i < 0) return null;
    const t = z.table[i],
      r = NG.rivals.find((r) => r.id === t.id);
    return {
      ...r,
      value: t.value,
      gap: Math.max(0, t.value - NG.businessValue(s) + 50),
    };
  };

  // Friday: rivals post their week, ranks lock, unlocks and goals pay out.
  NG.updateRanking = (s) => {
    const z = NG.ensureSeason(s);
    const week = NG.seasonWeekOf(s, s.day);
    if (week <= z.week || !NG.isRentDay(s.day)) return "";
    const before = z.rank;
    z.week = week;
    const rank = NG.snapshotRanking(s);
    z.history.push({ week, day: s.day, rank, value: NG.businessValue(s) });
    z.history = z.history.slice(-60);
    z.best = z.best == null ? rank : Math.min(z.best, rank);
    const bits = [
      "Silver Palms ranking: #" +
        rank +
        " of " +
        z.table.length +
        (before && before !== rank
          ? " (" +
            (before > rank ? "up " : "down ") +
            Math.abs(before - rank) +
            ")"
          : ""),
    ];
    const unlocks = [];
    for (const u of NG.rankUnlocks)
      if (z.best <= u.rank && !z.unlocked[u.id]) {
        unlocks.push(u.title);
        z.unlocked[u.id] = s.day;
        if (u.id === "first")
          NG.changeReputation(s, 5, "Top dealer in Silver Palms");
        bits.push("Unlocked: " + u.title);
      }
    if (week === NG.seasonWeeks && !z.final) {
      z.final = { rank, day: s.day, value: NG.businessValue(s) };
      bits.push("Season 1 final standing: #" + rank);
    }
    z.notice = bits.join(". ") + ".";
    // Compact form for the morning strip.
    z.news = {
      rank,
      size: z.table.length,
      move: before ? before - rank : 0,
      unlocks,
      final: week === NG.seasonWeeks,
    };
    return z.notice;
  };

  // Season goals. Rank goals complete with their unlock.
  const xp = (s, amount) => {
    const p = NG.ensureProgression(s).progress;
    p.xp += amount;
    while (p.xp >= NG.xpNeeded(p.level)) {
      p.xp -= NG.xpNeeded(p.level);
      p.level++;
      p.points++;
    }
  };
  NG.seasonGoals = [
    {
      id: "flip",
      title: "Sell a car for a profit",
      reward: "+30 XP",
      done: (s) => s.sales.some((x) => x.profit > 0),
      pay: (s) => xp(s, 30),
    },
    {
      id: "rent",
      title: "Pay a Friday rent with nothing overdue",
      reward: "+1 REP",
      done: (s) => !!s.season.flags.rentPaid,
      pay: (s) => NG.changeReputation(s, 1, "Season goal: rent paid on time"),
    },
    {
      id: "request",
      title: "Deliver a buyer request",
      reward: "+1 skill point",
      done: (s) =>
        (s.opportunities?.requests || []).some((q) => q.status === "fulfilled"),
      pay: (s) => (NG.ensureProgression(s).progress.points += 1),
    },
    {
      id: "margin",
      title: "Make $1,000 total deal margin",
      reward: "Newspaper ad deal, free",
      done: (s) => NG.totalMargin(s) >= 1000,
      pay: (s) => {
        NG.ensureProgression(s);
        if (!s.business.advertising) s.business.advertising = true;
        else {
          s.cash += 450;
          NG.record(s, "grant", 450, "Season goal: small-business grant");
        }
      },
    },
    {
      id: "showroom",
      title: "Sell a Showroom-grade car",
      reward: "+2 REP",
      done: (s) => !!s.season.flags.showroomSold,
      pay: (s) => NG.changeReputation(s, 2, "Season goal: Showroom car sold"),
    },
    {
      id: "top5",
      title: "Break into the Silver Palms Top 5",
      reward: "Buyer networks + auction tips",
      done: (s) => NG.rankUnlocked(s, "top5"),
    },
    {
      id: "top3",
      title: "Reach the Top 3",
      reward: "Collector network + $25,000 credit",
      done: (s) => NG.rankUnlocked(s, "top3"),
    },
    {
      id: "first",
      title: "Be #1 in Silver Palms",
      reward: "Season won, +5 REP",
      done: (s) => NG.rankUnlocked(s, "first"),
    },
  ];
  // Returns goals completed by this call; rewards are applied once.
  NG.checkSeasonGoals = (s) => {
    const z = NG.ensureSeason(s),
      fresh = [];
    for (const g of NG.seasonGoals)
      if (!z.goals[g.id] && g.done(s)) {
        z.goals[g.id] = { day: s.day };
        g.pay?.(s);
        fresh.push(g);
      }
    return fresh;
  };
  NG.seasonProgress = (s) => {
    const z = NG.ensureSeason(s);
    return {
      done: NG.seasonGoals.filter((g) => z.goals[g.id]).length,
      total: NG.seasonGoals.length,
      next: NG.seasonGoals.find((g) => !z.goals[g.id]) || null,
    };
  };

  // ---- hooks ---------------------------------------------------------
  const newState = NG.newState;
  NG.newState = () => {
    const s = newState();
    NG.ensureSeason(s);
    return s;
  };
  const load = NG.load;
  NG.load = () => {
    const s = load();
    NG.ensureSeason(s);
    return s;
  };

  const sell = NG.sell;
  NG.sell = (s, id, offerId) => {
    const c = s.inventory.find((c) => c.id === id),
      grade = c && NG.grade(c).id;
    const profit = sell(s, id, offerId);
    NG.ensureSeason(s);
    if (grade === "excellent" && offerId !== "dealer")
      s.season.flags.showroomSold = true;
    NG.checkSeasonGoals(s);
    return profit;
  };

  const nextDay = NG.nextDay;
  NG.nextDay = (s, rng = Math.random) => {
    const report = nextDay(s, rng);
    const z = NG.ensureSeason(s);
    z.notice = "";
    z.news = null;
    if (NG.isRentDay(s.day) && !(s.operations?.arrears > 0))
      z.flags.rentPaid = true;
    NG.updateRanking(s);
    const fresh = NG.checkSeasonGoals(s);
    if (s.dayReport && s.dayReport.day === s.day) {
      s.dayReport.ranking = z.notice;
      s.dayReport.rankNews = z.news;
      s.dayReport.seasonGoals = fresh.map(
        (g) => g.title + " (" + g.reward + ")",
      );
    }
    return report;
  };

  // Top 5: auction tips bring pricier cars to the market.
  const advanceListings = NG.advanceListings;
  if (advanceListings)
    NG.advanceListings = (s, rng = Math.random) => {
      advanceListings(s, rng);
      if (!NG.rankUnlocked(s, "top5") || s.market.length >= 15) return;
      if (rng() >= 0.3) return;
      const pool = NG.catalog
        .map((m, i) => (m.value >= 9000 ? i : -1))
        .filter((i) => i >= 0);
      const c = NG.generateCar(s, pool[Math.floor(rng() * pool.length)], rng);
      c.tip = true;
      s.market.push(c);
    };

  // Top 3: collector buyers call, and a bigger credit line.
  const generateRequest = NG.generateRequest;
  NG.generateRequest = (s, rng = Math.random) => {
    const spec = generateRequest(s, rng);
    if (!NG.rankUnlocked(s, "top3") || spec.tier === "collector") return spec;
    if (rng() >= 0.35) return spec;
    const seen = new Set([...s.market, ...s.inventory].map((c) => c.model)),
      pool = NG.catalog.filter((m) => m.value >= 9000),
      findable = pool.filter((m) => seen.has(m.id)),
      from = findable.length ? findable : pool,
      m = from[Math.min(from.length - 1, Math.floor(rng() * from.length))],
      T = NG.requestTiers.collector;
    return {
      tier: "collector",
      buyer: spec.buyer,
      days: T.days + Math.floor(rng() * 2),
      rep: T.rep,
      title: "Collector wants a " + m.name,
      line: "Heard you are one of the top dealers in town. Only the best example.",
      models: [m.id],
      grade: "excellent",
      mileage: 130000,
      records: true,
      noAccident: true,
    };
  };
  const loanLimit = NG.enterpriseLoanLimit;
  if (loanLimit)
    NG.enterpriseLoanLimit = (s) =>
      Math.max(loanLimit(s), NG.rankUnlocked(s, "top3") ? 25000 : 0);
})();
