/* Fictional gameplay profiles, not claims about real-world failure rates.
   New cars get saved stories; old cars keep their original condition and faults. */
window.NG = window.NG || {};
NG.modelProfiles = {
  crx: {
    label: "Lightweight bargain",
    weak: "body",
    buyer: "budget",
    hook: "Small buy-in, watch the body bill.",
  },
  golf: {
    label: "Everyday hot hatch",
    weak: "suspension",
    buyer: "budget",
    hook: "A useful runner can beat an expensive restoration.",
  },
  volvo: {
    label: "Dependable workhorse",
    weak: "cosmetic",
    buyer: "family",
    hook: "Function and paperwork matter more than showroom shine.",
  },
  accord: {
    label: "Commuter staple",
    weak: "cosmetic",
    buyer: "commuter",
    hook: "Get the mechanical work right and turn the slot quickly.",
  },
  cressida: {
    label: "Quiet cruiser",
    weak: "suspension",
    buyer: "family",
    hook: "Comfort and records sell this one.",
  },
  e30: {
    label: "Driver's sedan",
    weak: "suspension",
    buyer: "enthusiast",
    hook: "A sharp-driving example draws a different buyer.",
  },
  mx5: {
    label: "Weekend roadster",
    weak: "body",
    buyer: "enthusiast",
    hook: "Clean presentation matters to the weekend crowd.",
  },
  mr2: {
    label: "Enthusiast project",
    weak: "engine",
    buyer: "enthusiast",
    hook: "Leave room in the budget for mechanical work.",
  },
  rx7: {
    label: "High-stakes project",
    weak: "engine",
    buyer: "enthusiast",
    hook: "A cheap asking price can hide a large workshop bill.",
  },
  "300zx": {
    label: "Premium sports project",
    weak: "transmission",
    buyer: "enthusiast",
    hook: "Choose between a quick exit and a longer restoration.",
  },
  supra: {
    label: "Showpiece candidate",
    weak: "body",
    buyer: "enthusiast",
    hook: "A high grade can matter, but the slot stays tied up longer.",
  },
  "240sx": {
    label: "Affordable driver's car",
    weak: "suspension",
    buyer: "enthusiast",
    hook: "Driver-ready and showroom are different bets.",
  },
  silvia: {
    label: "Tuner favourite",
    weak: "engine",
    buyer: "enthusiast",
    hook: "Inspect the mechanical story before chasing a premium.",
  },
  camaro: {
    label: "Weekend muscle",
    weak: "body",
    buyer: "enthusiast",
    hook: "Presentation and mechanical cost pull in different directions.",
  },
  fiero: {
    label: "Compact project",
    weak: "engine",
    buyer: "enthusiast",
    hook: "An attractive buy-in still needs a repair ceiling.",
  },
  mustang: {
    label: "Broad-appeal muscle",
    weak: "transmission",
    buyer: "enthusiast",
    hook: "A solid runner and a polished showpiece have different audiences.",
  },
};
NG.characterProfile = (c) => NG.modelProfiles[c.model] || null;
NG.characterFlaw = (m, roll) => {
  const p = NG.modelProfiles[m.id];
  const weights = NG.flaws.map((f) => (p && f.part === p.weak ? 4 : 1)),
    total = weights.reduce((a, b) => a + b, 0);
  let n = roll * total;
  return NG.flaws[weights.findIndex((w) => (n -= w) < 0)] || NG.flaws.at(-1);
};
NG.applyCharacter = (c) => {
  const p = NG.characterProfile(c);
  if (!p) return;
  const weights = {
    engine: 3,
    transmission: 2,
    suspension: 2,
    body: 2,
    cosmetic: 1,
  };
  if (p.weak === "cosmetic") {
    c.parts.cosmetic -= 12;
    c.parts.engine += 4;
  } else {
    c.parts[p.weak] -= 4;
    c.parts.cosmetic += 4 * weights[p.weak];
  }
  // Same weighted condition, different work priorities. No blanket value buff.
  const rough = c.parts[p.weak] < 55;
  c.character = {
    version: 1,
    label: p.label,
    story: rough
      ? "Previous owner kept it presentable; the " +
        p.weak +
        " needs a closer look."
      : "A used example with a clear next-owner audience.",
    buyer: p.buyer,
  };
};
NG.audiences = [
  {
    id: "open",
    label: "Open market",
    hint: "Broad reach, mixed offers.",
    fee: 0,
  },
  {
    id: "enthusiast",
    label: "Enthusiast circle",
    hint: "Slower reach; sports condition and originality matter.",
    fee: 35,
  },
  {
    id: "family",
    label: "Family network",
    hint: "Slower reach; sedan comfort and records matter.",
    fee: 35,
  },
  {
    id: "budget",
    label: "Budget board",
    hint: "Slower reach; low running cost matters more than high grade.",
    fee: 35,
  },
  {
    id: "commuter",
    label: "Commuter board",
    hint: "Slower reach; mechanical condition matters.",
    fee: 35,
  },
];
NG.pickBuyerKind = (c, roll) => {
  const preferred =
    c.audience && c.audience !== "open"
      ? c.audience
      : NG.characterProfile(c)?.buyer;
  const weights = NG.buyerKinds.map((k) =>
    k.id === preferred ? (c.audience && c.audience !== "open" ? 7 : 2) : 1,
  );
  let n = roll * weights.reduce((a, b) => a + b, 0);
  return (
    NG.buyerKinds[weights.findIndex((w) => (n -= w) < 0)] ||
    NG.buyerKinds.at(-1)
  );
};
NG.audienceAccess = (s) => !!NG.rankUnlocked?.(s, "top5");
NG.listForAudience = (s, id, price, mode, audience = "open") => {
  const choice = NG.audiences.find((a) => a.id === audience);
  if (!choice) throw Error("Choose a valid audience.");
  if (audience !== "open" && !NG.audienceAccess(s))
    throw Error("Reach the Top 5 to unlock buyer networks.");
  if (s.cash < choice.fee) throw Error("Not enough cash for the focused ad.");
  NG.list(s, id, price, mode);
  const c = s.inventory.find((c) => c.id === id);
  c.audience = audience;
  if (choice.fee) {
    s.cash -= choice.fee;
    c.marketingCost = (c.marketingCost || 0) + choice.fee;
    NG.record(
      s,
      "listing-ad",
      -choice.fee,
      NG.model(c).name + " / " + choice.label,
    );
  }
};
