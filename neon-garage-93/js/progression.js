window.NG = window.NG || {};
NG.upgrades = {
  tools: {
    name: "Better Tools",
    price: 600,
    description: "15% lower labor costs on every repair.",
  },
  supplier: {
    name: "Parts Supplier Deal",
    price: 900,
    description:
      "20% lower parts costs on every repair, including discovered faults.",
  },
  advertising: {
    name: "Local Newspaper Ad",
    price: 450,
    description:
      "Unlock a campaign: +15 percentage points to buyer interest while active. $20 per day.",
  },
};
NG.repTiers = [
  { at: 0, name: "Unknown Dealer", interest: 0 },
  { at: 5, name: "Familiar Face", interest: 0.03 },
  { at: 15, name: "Trusted Dealer", interest: 0.07 },
  { at: 30, name: "Established Business", interest: 0.12 },
  { at: 50, name: "Local Legend", interest: 0.18 },
];
NG.ensureProgression = (s) => {
  s.progress = {
    xp: 0,
    level: 1,
    points: 0,
    negotiation: 0,
    oneMoreShot: false,
    log: [],
    ...s.progress,
  };
  s.business = {
    tools: false,
    supplier: false,
    advertising: false,
    adActive: false,
    ...s.business,
  };
  return s;
};
NG.xpNeeded = (level) => 80 + (level - 1) * 40;
NG.repTier = (s) => NG.repTiers.filter((t) => s.reputation >= t.at).at(-1);
NG.nextRepTier = (s) => NG.repTiers.find((t) => t.at > s.reputation);
NG.sellerRounds = (s) => 3 + (s.progress?.oneMoreShot ? 1 : 0);
NG.interestBonus = (s) =>
  NG.repTier(s).interest + (s.business?.adActive ? 0.15 : 0);
NG.awardDealXP = (s, car, phase, savings) => {
  NG.ensureProgression(s);
  s.lastReward = null;
  if (savings <= 0 || car[phase + "XPGranted"]) return;
  car[phase + "XPGranted"] = true;
  const amount = 20 + Math.min(20, Math.floor(savings / 100)),
    p = s.progress;
  p.xp += amount;
  const oldLevel = p.level;
  while (p.xp >= NG.xpNeeded(p.level)) {
    p.xp -= NG.xpNeeded(p.level);
    p.level++;
    p.points++;
  }
  const entry = { day: s.day, amount, phase, car: NG.model(car).name };
  p.log.unshift(entry);
  p.log = p.log.slice(0, 15);
  s.lastReward = { amount, levels: p.level - oldLevel };
};
NG.rewardText = (s) =>
  s.lastReward
    ? " +" +
      s.lastReward.amount +
      " XP." +
      (s.lastReward.levels
        ? " Level up! +" + s.lastReward.levels + " skill point(s)."
        : "")
    : "";
NG.trainNegotiation = (s) => {
  NG.ensureProgression(s);
  const p = s.progress;
  if (p.negotiation >= 3)
    throw Error("Negotiation is already at maximum rank.");
  if (p.points < 1)
    throw Error(
      "You need one skill point. Close successful negotiated deals to level up.",
    );
  p.points--;
  p.negotiation++;
  return "Negotiation upgraded to rank " + p.negotiation + ".";
};
NG.unlockOneMoreShot = (s) => {
  NG.ensureProgression(s);
  const p = s.progress;
  if (p.oneMoreShot) throw Error("One More Shot is already unlocked.");
  if (p.negotiation < 2) throw Error("Reach Negotiation rank 2 first.");
  if (p.points < 1) throw Error("You need one skill point.");
  p.points--;
  p.oneMoreShot = true;
  return "One More Shot unlocked: four rounds with sellers. Ended negotiations stay ended.";
};
NG.buyUpgrade = (s, id) => {
  NG.ensureProgression(s);
  const item = NG.upgrades[id];
  if (!item) throw Error("Unknown business upgrade.");
  if (s.business[id]) throw Error("You already own this upgrade.");
  if (s.cash < item.price)
    throw Error("You do not have enough cash for this upgrade.");
  s.cash -= item.price;
  s.business[id] = true;
  NG.record(s, "upgrade", -item.price, item.name);
  return (
    item.name +
    " purchased." +
    (id === "advertising"
      ? " Activate the campaign when you have cars listed."
      : "")
  );
};
NG.toggleAdvertising = (s) => {
  if (!s.business?.advertising) throw Error("Buy Local Newspaper Ad first.");
  if (!s.business.adActive && s.cash < 20)
    throw Error("You need at least $20 to activate the campaign.");
  s.business.adActive = !s.business.adActive;
  return s.business.adActive
    ? "Campaign active. $20 is charged on each next day."
    : "Campaign paused. No daily fee.";
};
NG.advertisingDay = (s) => {
  s.adNotice = null;
  if (!s.business?.adActive) return;
  if (s.cash < 20) {
    s.business.adActive = false;
    s.adNotice =
      "Newspaper campaign paused: not enough cash for the $20 daily fee.";
    return;
  }
  s.cash -= 20;
  NG.record(s, "marketing", -20, "Local newspaper campaign - daily fee");
};
