/* Guidance uses live state and Friday forecasts. It never chooses a trade or awards rewards. */
window.NG = window.NG || {};
NG.dealerObjective = (s) => {
  const z = NG.ensureSeason(s),
    value = NG.businessValue(s),
    friday = NG.nextRentDay(s);
  if (!s.sales.length)
    return {
      id: "first-flip",
      title: "Close your first profitable deal",
      why: "Start with one affordable car. Inspect it and leave room for repairs and Friday rent.",
      reward: "First profitable sale: +30 XP",
      action: "market",
      progress: "$" + Math.round(s.cash) + " available",
    };
  if (!z.goals.request)
    return {
      id: "first-request",
      title: "Find a buyer before buying",
      why: "Compare a request with a normal flip. The brief gives a destination; the car still has to make financial sense.",
      reward: "First completed request: +1 skill point",
      action: "requests",
      progress: "Choose a brief, then inspect the car",
    };
  if (!NG.rankUnlocked(s, "top5")) {
    const week = NG.seasonWeekOf(s, friday),
      rivals = NG.rivals
        .map((r) => NG.rivalValue(r, week))
        .sort((a, b) => b - a),
      target = rivals[4] + 50;
    return {
      id: "top5",
      title: "Earn your place in the Top 5",
      why: "Finish Friday in the Top 5 to open buyer networks. Then choose who your ads reach instead of taking every mixed offer.",
      reward: "Unlock: focused buyer audiences + auction tips",
      action: s.inventory.length >= s.capacity ? "inventory" : "market",
      progress: NG.money(value) + " / " + NG.money(target) + " forecast",
      gap: Math.max(0, target - value),
      deadline: friday,
    };
  }
  if (!z.goals.showroom)
    return {
      id: "showroom",
      title: "Build your first showpiece",
      why: "Compare a Full restoration with a quick sale. A suitable sports car can attract enthusiasts; a cheap commuter may not justify the work.",
      reward: "Sell a Showroom car: +2 REP",
      action: s.inventory.length ? "inventory" : "market",
      progress: "Buyer networks are open: choose a selling audience",
    };
  if (NG.rankUnlocked(s, "first"))
    return {
      id: "defend",
      title: "Keep your lead in Silver Palms",
      why: "All Season 1 unlocks are yours. Compare a fast turnover with an enthusiast showpiece and keep a cash reserve.",
      reward: "Buyer networks and collector access stay open",
      action: s.inventory.length ? "inventory" : "market",
      progress: "All Season 1 rank unlocks earned",
    };
  const rank = NG.rankUnlocked(s, "top3") ? 1 : 3,
    week = NG.seasonWeekOf(s, friday),
    target =
      NG.rivals.map((r) => NG.rivalValue(r, week)).sort((a, b) => b - a)[
        rank - 1
      ] + 50;
  return {
    id: "top" + rank,
    title:
      rank === 3
        ? "Build toward the collector network"
        : "Challenge Silver Palms' leading dealer",
    why:
      rank === 3
        ? "Top 3 opens collector requests and a $25,000 credit limit. Make the next deal count rather than chasing volume."
        : "Choose which buyer and car combination earns the best use of your two slots.",
    reward:
      rank === 3
        ? "Collector network + larger credit line"
        : "Top dealer: +5 REP",
    action: s.inventory.length >= s.capacity ? "inventory" : "market",
    progress: NG.money(value) + " / " + NG.money(target) + " forecast",
    gap: Math.max(0, target - value),
    deadline: friday,
  };
};
