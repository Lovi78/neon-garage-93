(() => {
  let state = NG.load(),
    view = "garage",
    selected = null,
    filter = "all",
    sort = "default",
    arrival = null,
    albumSearch = "",
    albumStatus = "all",
    albumSegment = "all",
    pendingCloseDay = null,
    repairMode = "standard";
  const app = document.querySelector("#app"),
    dialog = document.querySelector("#details");
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const signed = (n) => (n >= 0 ? "+" : "-") + NG.money(Math.abs(n));
  const tag = (c) =>
    NG.busy(state, c)
      ? '<span class="tag pink">IN THE WORKSHOP</span>'
      : c.listed
        ? `<span class="tag ${c.offers.some((o) => o.seen !== true) ? "pink" : "teal"}">${c.offers.length ? c.offers.length + " " + (c.offers.some((o) => o.seen !== true) ? "NEW OFFER" : "PENDING OFFER") : "LISTED"}</span>`
        : '<span class="tag">IN YOUR GARAGE</span>';
  const card = (c, owned = false) =>
    `<button class="car-card" data-action="detail" data-id="${c.id}"><div class="car-image"><span class="car-number">${c.year} / ${NG.model(c).segment === "japan" ? "JPN" : NG.model(c).segment === "europe" ? "EUR" : "USA"}</span>${NG.carArt(c)}<span class="image-caption">${NG.model(c).trim}</span>${owned ? tag(c) : c.inspected ? '<span class="tag teal">INSPECTED</span>' : ""}</div><div class="card-content"><div class="card-top"><h3>${NG.model(c).name}</h3><span class="arrow">↗</span></div><p>${c.mileage.toLocaleString("en-US")} miles <span>·</span> ${c.inspected || owned ? NG.condition(c) + "% condition" : c.claim + "% claimed condition"}</p><div class="card-bottom"><strong>${NG.money(owned ? NG.cost(c) : NG.purchaseQuote(c))}</strong><span>${owned ? "total invested" : "asking price"}</span></div></div></button>`;
  function render() {
    const names = {
      market: "CAR MARKET",
      inventory: "MY INVENTORY",
      finances: "FINANCES",
      upgrades: "DEALER FILE",
      collection: "CAR COLLECTION",
      customers: "CUSTOMERS",
      operations: "OPERATIONS",
    };
    const offers = NG.currentOffers(state),
      unread = offers.filter((o) => o.unread).length;
    app.innerHTML = `<div class="game-shell"><header class="game-hud"><div class="game-logo"><span class="logo-mark">NG</span><div><h1>NEON GARAGE <b>'93</b></h1><small>SMALL LOT. BIG PLANS.</small></div></div><section class="stats" aria-label="Dealership status"><div><span>CASH</span><strong>${NG.money(state.cash)}</strong></div><div><span>GARAGE</span><strong>${state.inventory.length}<em> / ${state.capacity}</em></strong></div><div><span>REPUTATION</span><strong>${state.reputation}<em> REP</em></strong><small>${NG.repTier(state).name}</small></div><div><span>PROFIT</span><strong class="${state.profit >= 0 ? "positive" : "negative"}">${signed(state.profit)}</strong><small>${state.sold} completed sales</small></div></section><div class="hud-day"><span>${NG.date(state.day)}<small>DAY ${state.day + 1}</small></span><button class="primary" data-action="next">NEXT DAY &gt;</button></div></header><div class="progress-strip"><button data-action="view" data-view="upgrades">DEALER FILE / LEVEL ${state.progress.level}</button>${NG.progressBar("LEVEL " + state.progress.level, state.progress.xp, NG.xpNeeded(state.progress.level), state.progress.xp + " / " + NG.xpNeeded(state.progress.level) + " XP")}${NG.repProgress(state)}<span class="positive">${state.progress.points} SKILL POINT${state.progress.points === 1 ? "" : "S"}</span></div>${NG.storageError ? '<div class="storage-warning">Your browser is blocking saves. Enable local storage to keep your progress.</div>' : ""}${state.claims.some((q) => q.status === "open") ? `<div class="case-banner"><span>${state.claims.filter((q) => q.status === "open").length} OPEN CUSTOMER COMPLAINT(S)</span><button data-action="view" data-view="customers">Respond</button></div>` : ""}${offers.length ? `<div class="offer-notification" role="status" aria-live="polite"><div><strong>${offers.length} LIVE OFFER${offers.length === 1 ? "" : "S"}${unread ? " / " + unread + " NEEDS REVIEW" : " / PENDING DECISION"}</strong><small>${offers.map((o) => esc(o.car) + " " + NG.money(o.price)).join(" · ")} · Expires when you close this day</small></div><button class="primary" data-action="view-offers">View offers</button></div>` : ""}${state.operations.arrears ? `<div class="case-banner"><span>OVERDUE OPERATING BILLS: ${NG.money(state.operations.arrears)}</span><button data-action="view" data-view="operations">Manage cash</button></div>` : ""}${opportunityBanner()}<main class="world-frame">${NG.garageScene(state, arrival)}${view !== "garage" ? `<section class="desk-window" aria-label="${names[view]}"><header class="window-title"><span><i></i> ${view === "market" ? "CLASSIFIEDS.EXE" : view === "inventory" ? "WORKSHOP.EXE" : view === "upgrades" ? "DEALER-FILE.EXE" : view === "collection" ? "CAR-ALBUM.EXE" : view === "customers" ? "CUSTOMER-CARE.EXE" : view === "operations" ? "OPERATIONS.EXE" : "LEDGER.EXE"}</span><button data-action="view" data-view="garage" aria-label="Back to garage">&times;</button></header><div class="window-body"><div class="section-heading"><div><span class="eyebrow">NEON GARAGE / ${names[view]}</span><h2>${view === "market" ? "Find your next great deal." : view === "inventory" ? "The keys are in your hands." : view === "upgrades" ? "Build your name. Build your business." : view === "collection" ? "Every car has a story. Collect yours." : view === "customers" ? "Good business brings people back." : view === "operations" ? "Time, cash and opportunity." : "The numbers tell the story."}</h2></div><button class="text-button" data-action="view" data-view="garage">&lt; BACK TO GARAGE</button></div>${view === "market" ? market() : view === "inventory" ? inventory() : view === "upgrades" ? growth() : view === "collection" ? album() : view === "customers" ? customers() : view === "operations" ? operations() : finances()}</div></section>` : ""}</main><footer class="game-footer">${radioConsole()}<div class="radio-news"><span>MARKET WIRE / SILVER PALMS</span><strong>${esc(state.event.title)}</strong><p>${esc(state.event.text)}</p></div><div class="footer-controls"><span>${NG.storageError ? "SAVING UNAVAILABLE" : "AUTO-SAVED"}</span>${state.dayReport ? '<button data-action="show-day-report">DAY REPORT</button>' : ""}<button data-action="reset">NEW GAME</button><small>v0.10 / LOCAL OPPORTUNITIES</small></div></footer></div>`;
    arrival = null;
  }
  function event() {
    return `<section class="event"><div class="event-icon">↗</div><div><span class="eyebrow">AROUND TOWN TODAY / ${state.event.kind === "start" ? "JUNE 1" : "MARKET NEWS"}</span><h3>${state.event.title}</h3><p>${state.event.text}</p></div><span class="event-frequency">THE DAILY<br><b>PALMS</b></span></section>`;
  }
  function market() {
    let cars = state.market.filter(
      (c) => filter === "all" || NG.model(c).segment === filter,
    );
    if (sort === "price") cars.sort((a, b) => a.ask - b.ask);
    if (sort === "value")
      cars.sort(
        (a, b) =>
          NG.estimate(state, b) - b.ask - (NG.estimate(state, a) - a.ask),
      );
    return `${trendBoard()}${event()}<div class="section-heading"><h2>Today’s listings <span>${state.market.length} listings / ${NG.catalog.length} models</span></h2><div class="filters"><select id="segment-filter" aria-label="Filter cars">${[
      ["all", "All cars"],
      ["japan", "Japanese"],
      ["europe", "European"],
      ["america", "American"],
    ]
      .map(
        ([v, t]) =>
          `<option value="${v}" ${filter === v ? "selected" : ""}>${t}</option>`,
      )
      .join("")}</select><select id="sort-filter" aria-label="Sort listings">${[
      ["default", "Latest listings"],
      ["price", "Price: low to high"],
      ["value", "Estimated margin"],
    ]
      .map(
        ([v, t]) =>
          `<option value="${v}" ${sort === v ? "selected" : ""}>${t}</option>`,
      )
      .join(
        "",
      )}</select></div></div><div class="car-grid">${cars.map((c) => card(c)).join("")}</div><p class="fine-print">Before inspection, estimates rely on the seller’s claims. Listings and unaccepted offers refresh when you advance to the next day.</p>`;
  }
  function inventory() {
    return `<div class="section-heading"><h2>In stock <span>${state.inventory.length} cars</span></h2><span class="muted">Open a car’s details to view its offers.</span></div><div class="car-grid">${state.inventory.map((c) => card(c, true)).join("") || '<div class="empty-state"><span>▱</span><h2>Your lot is empty.</h2><p>Your first good deal is waiting at the market.</p><button class="primary" data-action="view" data-view="market">Open car market →</button></div>'}</div>${state.inventory.length ? '<div class="starter-tip"><span>LISTING AND SELLING</span><p>Open a car’s details, set your asking price, then advance to the next day. If you need cash fast, a dealer will buy it immediately at a lower price.</p></div>' : ""}`;
  }
  function finances() {
    const total = state.inventory.reduce(
        (n, c) => n + NG.value(state, c) * 0.72,
        0,
      ),
      expense = state.ledger
        .filter((l) => l.amount < 0)
        .reduce((n, l) => n - l.amount, 0);
    return `<div class="finance-summary"><div><span>TOTAL SALES REVENUE</span><strong>${NG.money(state.sales.reduce((n, s) => n + s.price, 0))}</strong></div><div><span>TOTAL SPENDING</span><strong>${NG.money(expense)}</strong></div><div><span>ESTIMATED NET WORTH</span><strong>${NG.money(NG.businessValue(state))}</strong><small>Cash + inventory dealer value - overdue bills</small></div></div>${NG.financeChart(state)}<div class="section-heading"><h2>Completed deals</h2></div>${state.sales.length ? `<div class="table-wrap"><table><thead><tr><th>Car / date</th><th>Total invested</th><th>Sale</th><th>Customer care</th><th>Profit</th></tr></thead><tbody>${state.sales.map((s) => `<tr><td>${s.name}<small>${NG.date(s.day)}${s.requestId ? " / BUYER REQUEST" : ""}</small></td><td>${NG.money(s.cost)}</td><td>${NG.money(s.price)}</td><td>${NG.money(s.refundCost || 0)}</td><td class="${s.profit >= 0 ? "positive" : "negative"}">${signed(s.profit)}</td></tr>`).join("")}</tbody></table></div>` : '<div class="ledger-empty">No completed deals yet. Each car’s total investment and profit will appear here.</div>'}<div class="section-heading"><h2>Transactions <span>${state.ledger.length}</span></h2></div><div class="ledger">${state.ledger.map((l) => `<div><span>${l.description}<small>${NG.date(l.day)}</small></span><strong class="${l.amount > 0 ? "positive" : ""}">${signed(l.amount)}</strong></div>`).join("") || '<p class="muted">Starting capital: $5,000. No transactions yet.</p>'}</div><p class="fine-print">Realized profit = sale price - purchase price - inspections - repairs - customer repair contributions. Repair contributions reduce the original sale profit. Inspections of cars you do not buy, business upgrades and daily advertising are separate expenses. They reduce cash and net worth, not per-car profit.</p>`;
  }
  function trendBoard() {
    const t = state.marketTrends,
      prior = t.history.length > 1 ? t.history.at(-2) : state.demand;
    return `<section class="trend-board"><div class="section-heading"><h2>Moving markets</h2><small>Waves last 2-4 days; new waves can replace them.</small></div><div class="trend-grid">${[
      "japan",
      "europe",
      "america",
    ]
      .map((key) => {
        const value = Math.round(state.demand[key] * 100),
          delta = Math.round((state.demand[key] - prior[key]) * 100);
        return `<div><span>${key.toUpperCase()}</span><strong class="${value >= 100 ? "positive" : "negative"}">${value}%</strong><small>${delta >= 0 ? "+" : ""}${delta} pp since yesterday / ${t.waves[key].remaining} day(s) expected</small></div>`;
      })
      .join(
        "",
      )}</div>${state.progress.trendSpotter ? `<p class="forecast">TREND SPOTTER / next wave: ${t.next.segment.toUpperCase()}, ${Math.round(t.next.multiplier * 100)}% demand target for ${t.next.duration} day(s), with up to 2 percentage points of daily noise.</p>` : '<p class="fine-print">Buy before a rise, sell before a fall. Trend Spotter reveals the next planned wave; ordinary estimates do not guarantee a profit.</p>'}</section>`;
  }
  function specialistCards() {
    const p = state.progress;
    return [
      [
        "mechanical",
        "Mechanical Knowledge",
        "15% lower inspection fees and 5% lower repair labor per rank. Rank 2 makes normal engine/transmission jobs one day.",
        "sharpEye",
        "Sharp Eye",
        "A free pre-purchase clue about one hidden fault; not a full inspection.",
      ],
      [
        "market",
        "Market Knowledge",
        "Each rank brings value estimates closer to the underlying condition-based value. Estimates still carry uncertainty.",
        "trendSpotter",
        "Trend Spotter",
        "See the next planned demand wave before it happens.",
      ],
    ]
      .map(
        ([skill, name, effect, perk, perkName, perkEffect]) =>
          `<div class="growth-card"><span class="eyebrow">SKILL / RANK ${p[skill]} OF 3</span><h3>${name}</h3>${NG.progressBar(name.toUpperCase(), p[skill], 3)}<p>${effect}</p><button class="primary" data-action="train-skill" data-skill="${skill}" ${p.points < 1 || p[skill] >= 3 ? "disabled" : ""}>${p[skill] >= 3 ? "MAXIMUM RANK" : "Train / 1 point"}</button></div><div class="growth-card"><span class="eyebrow">PERK / ${name.toUpperCase()} RANK 2</span><h3>${perkName}</h3><p>${perkEffect}</p><button class="primary" data-action="specialist-perk" data-perk="${perk}" ${p[perk] || p[skill] < 2 || p.points < 1 ? "disabled" : ""}>${p[perk] ? "PERK ACTIVE" : "Unlock / 1 point"}</button></div>`,
      )
      .join("");
  }
  function opportunityBanner() {
    const o = state.opportunities,
      invitations = o.events.filter((e) => e.status === "pending"),
      offers = o.requests.filter((q) => q.status === "offered"),
      active = o.requests.filter((q) => q.status === "active");
    if (!invitations.length && !offers.length && !active.length) return "";
    return `<div class="offer-notification local-notification" role="status"><div><strong>LOCAL OPPORTUNITIES / ${invitations.length} INVITATION(S) / ${offers.length} NEW REQUEST(S)</strong><small>${active.length ? active.length + " active buyer request(s). Nearest delivery deadline: " + NG.date(Math.min(...active.map((q) => q.deadline))) + ". " : ""}Optional choices with upfront terms. Check the operations clipboard.</small></div><button data-action="view" data-view="operations">Review opportunities</button></div>`;
  }
  function localBoard() {
    const o = state.opportunities;
    const events = o.events.filter(
      (e) =>
        ["pending", "accepted"].includes(e.status) &&
        (e.status !== "accepted" ||
          (e.until >= state.day && (e.uses == null || e.uses > 0))),
    );
    const requests = o.requests.filter((q) =>
      ["offered", "active"].includes(q.status),
    );
    return `<section class="local-board" aria-label="Local opportunities"><div class="section-heading"><div><span class="eyebrow">SILVER PALMS / OPTIONAL CHOICES</span><h2>Something beyond the daily listings.</h2></div></div><p>Invitations arrive occasionally. Declining or ignoring an invitation costs nothing. Accepted buyer requests lose 1 reputation if abandoned or delivered late. No deposits, no automatic car purchases.</p><h3>Local invitations & active benefits</h3><div class="local-grid">${
      events
        .map((e) => {
          const t = NG.localEvents.find((t) => t.id === e.kind);
          return `<article class="growth-card local-card"><span class="eyebrow">${e.status === "pending" ? "DECIDE BY " + NG.date(e.deadline) : "ACTIVE THROUGH " + NG.date(e.until)}</span><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p><p class="positive">${esc(t.benefit)}</p>${e.uses != null ? `<small>${e.uses} discounted repair(s) left</small>` : ""}${e.status === "pending" ? `<p>Upfront fee: <strong>${NG.money(t.cost)}</strong>. Cash afterward: ${signed(state.cash - t.cost)}. Next operating bill: ${NG.money(NG.operatingBill(state))}.</p><div class="actions"><button class="primary" data-action="local-accept" data-id="${e.id}" ${state.cash < t.cost || state.operations.arrears || (t.blocks && NG.workshopBusy(state)) ? "disabled" : ""}>Accept / ${NG.money(t.cost)}</button><button data-action="local-decline" data-id="${e.id}">Decline / free</button></div>${t.blocks && NG.workshopBusy(state) ? '<p class="negative">Current in-house work must finish before you can host this event.</p>' : ""}` : "<small>Paid once. Benefits do not stack with the same event; the strongest applicable repair discount is used.</small>"}</article>`;
        })
        .join("") ||
      '<p class="muted">No local invitations today. Some mornings are quiet.</p>'
    }</div><h3>Buyer requests</h3><div class="local-grid">${
      requests
        .map((q) => {
          const t = NG.requestKinds.find((t) => t.id === q.kind),
            cars = state.inventory.filter((c) => NG.requestMatch(state, q, c));
          return `<article class="growth-card local-card"><span class="eyebrow">${q.status === "offered" ? "REPLY BY " + NG.date(q.offerUntil) : "DELIVER BY " + NG.date(q.deadline)}</span><h3>${esc(t.title)}</h3><p>${esc(t.buyer)} wants a ${esc(t.segment)} car: ${t.shapes.join(" / ")}. At least ${t.condition}% condition, at most ${t.mileage.toLocaleString("en-US")} miles. Full inspection, no unresolved faults, repairs finished.</p><p>Fixed car price: <strong>${NG.money(t.budget)}</strong> + completion bonus <strong>${NG.money(t.bonus)}</strong> = <strong>${NG.money(t.budget + t.bonus)}</strong> on delivery. +3 reputation. No negotiation XP.</p>${q.status === "offered" ? `<p>${t.days} days to deliver after accepting. No deposit. One car per request; compare the fixed price with your costs.</p><div class="actions"><button class="primary" data-action="request-accept" data-id="${q.id}" ${o.requests.filter((q) => q.status === "active").length >= 2 ? "disabled" : ""}>Accept request</button><button data-action="request-decline" data-id="${q.id}">Decline / free</button></div>` : `${NG.progressBar("DELIVERY WINDOW", q.deadline - state.day, t.days, q.deadline === state.day ? "LAST DAY" : q.deadline - state.day + " day(s) left")}${cars.map((c) => `<div class="request-delivery"><p>${esc(NG.model(c).name)} / investment ${NG.money(NG.cost(c))} / deal profit ${signed(t.budget + t.bonus - NG.cost(c))}</p><button class="primary" data-action="request-deliver" data-id="${q.id}" data-car="${c.id}">Deliver ${esc(NG.model(c).name)} / ${NG.money(t.budget + t.bonus)}</button></div>`).join("") || '<p class="muted">No ready matching car in your garage. Inspect and repair your stock or search the market.</p>'}<button data-action="view" data-view="market">Search market</button><details><summary>Cancel commitment</summary><p>Abandoning costs 1 reputation, without a cash charge.</p><button data-action="request-abandon" data-id="${q.id}">Abandon / -1 REP</button></details>`}</article>`;
        })
        .join("") ||
      '<p class="muted">No buyer requests today. Requests arrive occasionally and stay available for three days.</p>'
    }</div><details class="local-history"><summary>Recent opportunity outcomes</summary><ul>${
      [
        ...o.events
          .filter((e) => !["pending", "accepted"].includes(e.status))
          .map(
            (e) =>
              NG.localEvents.find((t) => t.id === e.kind).title +
              " / " +
              e.status,
          ),
        ...o.requests
          .filter((q) => !["offered", "active"].includes(q.status))
          .map(
            (q) =>
              NG.requestKinds.find((t) => t.id === q.kind).title +
              " / " +
              q.status,
          ),
      ]
        .slice(-8)
        .map((line) => `<li>${esc(line)}</li>`)
        .join("") || "<li>No completed local opportunities yet.</li>"
    }</ul></details></section>`;
  }
  function operations() {
    const o = state.operations,
      jobs = state.inventory.filter((c) => NG.busy(state, c));
    return `${localBoard()}<div class="growth-summary"><div><span>NEXT OPERATING BILL</span><strong>${NG.money(NG.operatingBill(state))}</strong></div><div><span>OVERDUE BILLS</span><strong class="${o.arrears ? "negative" : "positive"}">${NG.money(o.arrears)}</strong></div><div><span>IN-HOUSE WORKSHOP</span><strong>${NG.localWorkshopBlocked(state) ? "EVENT TODAY" : NG.workshopBusy(state) + " / 1"}</strong></div></div><div class="growth-card"><h3>Keep a cash reserve</h3><p>Rent and utilities cost $20 per day, plus $5 per stocked car. Advertising is charged separately. Bills are paid on the next morning. Unpaid balances block new purchases, repairs and business upgrades; you can still sell stock to raise cash.</p><button class="primary" data-action="pay-bills" ${!o.arrears || !state.cash ? "disabled" : ""}>${o.arrears ? "Pay " + NG.money(Math.min(o.arrears, state.cash)) : "ALL BILLS PAID"}</button><p class="fine-print">Business value subtracts overdue operating bills. Payments appear in the Ledger; operating expenses are not assigned to individual car profits.</p></div><div class="section-heading"><h2>Workshop schedule</h2></div><div class="ledger">${jobs.map((c) => `<div><span>${NG.model(c).name} / ${c.repairMode === "rush" ? "OUTSOURCED RUSH" : "IN-HOUSE"}<small>Ready ${NG.date(c.readyDay)} / ${c.readyDay - state.day} day(s) remaining</small></span><strong>${NG.money(c.repairCost)} invested in repairs</strong></div>`).join("") || '<p class="muted">Workshop idle. Buy and inspect a car before booking a job.</p>'}</div><p class="fine-print">One in-house job at a time. Engine and transmission: 2 days; other repairs: 1 day. Mechanical Knowledge rank 2 makes all normal jobs 1 day. An active visiting mechanic also shortens new engine/transmission jobs. Outsourced rush work always takes 1 day and adds 25% to the quote, minimum $80. Local discounts apply to the full quote after the rush premium. It does not occupy the in-house job slot.</p>${trendBoard()}`;
  }

  function growth() {
    const p = state.progress,
      b = state.business,
      tier = NG.repTier(state),
      next = NG.nextRepTier(state);
    return `<div class="growth-summary"><div><span>DEALER LEVEL</span><strong>${p.level}</strong></div><div><span>EXPERIENCE</span><strong>${p.xp} / ${NG.xpNeeded(p.level)} XP</strong><div class="xp-meter"><i style="width:${(p.xp / NG.xpNeeded(p.level)) * 100}%"></i></div></div><div><span>SKILL POINTS</span><strong>${p.points}</strong></div></div><div class="growth-columns"><section><div class="section-heading"><h2>Personal development</h2></div><div class="growth-card"><span class="eyebrow">SKILL / RANK ${p.negotiation} OF 3</span><h3>Negotiation</h3>${NG.progressBar("NEGOTIATION RANK", p.negotiation, 3)}<p>Each rank lowers new sellers’ minimum prices by 1% of asking price and raises new buyers’ bargaining budgets by 1% of their opening offer.</p><p class="fine-print">Existing negotiations keep their saved limits. Cost: 1 skill point per rank.</p><button class="primary" data-action="train-negotiation" ${p.points < 1 || p.negotiation >= 3 ? "disabled" : ""}>${p.negotiation >= 3 ? "MAXIMUM RANK" : "Train Negotiation / 1 point"}</button></div><div class="growth-card"><span class="eyebrow">PERK / ${p.oneMoreShot ? "UNLOCKED" : "NEGOTIATION RANK 2 REQUIRED"}</span><h3>One More Shot</h3>${NG.progressBar("PERK REQUIREMENT", Math.min(p.negotiation, 2), 2, p.oneMoreShot ? "UNLOCKED" : Math.min(p.negotiation, 2) + " / 2 RANK · 1 POINT TO UNLOCK")}<p>Four rounds with sellers instead of three. It does not reopen a finished deal, and very low offers can still end the conversation.</p><button class="primary" data-action="unlock-perk" ${p.oneMoreShot || p.negotiation < 2 || p.points < 1 ? "disabled" : ""}>${p.oneMoreShot ? "PERK ACTIVE" : "Unlock / 1 point"}</button></div><p class="fine-print">Close a purchase below the original asking price or a sale above the buyer’s opening offer after negotiating: 20 XP + 1 per $100 gained, capped at 40 XP per deal. No XP for sending offers, straight purchases, dealer sales or repeating a transaction. Each level grants 1 skill point.</p>${specialistCards()}</section><section><div class="section-heading"><h2>Business upgrades</h2></div>${Object.entries(
      NG.upgrades,
    )
      .map(
        ([id, u]) =>
          `<div class="growth-card"><span class="eyebrow">${b[id] ? "OWNED" : "ONE-TIME INVESTMENT"}</span><h3>${u.name}</h3><p>${u.description}</p>${NG.progressBar(b[id] ? "UPGRADE INSTALLED" : "AVAILABLE CASH", b[id] ? u.price : state.cash, u.price, b[id] ? "OWNED" : NG.money(state.cash) + " / " + NG.money(u.price))}<button data-action="upgrade" data-upgrade="${id}" class="${b[id] ? "" : "primary"}" ${b[id] || state.cash < u.price ? "disabled" : ""}>${b[id] ? "INSTALLED" : "Buy / " + NG.money(u.price)}</button>${id === "advertising" && b[id] ? `<div class="campaign"><span class="${b.adActive ? "positive" : "muted"}">${b.adActive ? "CAMPAIGN ACTIVE / $20 PER DAY" : "CAMPAIGN PAUSED / NO DAILY FEE"}</span><button data-action="toggle-ad" ${!b.adActive && state.cash < 20 ? "disabled" : ""}>${b.adActive ? "Pause campaign" : "Activate campaign"}</button></div>` : ""}</div>`,
      )
      .join(
        "",
      )}</section></div><section class="rep-panel"><span class="eyebrow">REPUTATION / ${state.reputation} POINTS</span><h3>${tier.name}</h3>${NG.repProgress(state)}<p>Buyer interest bonus: +${Math.round(tier.interest * 100)} percentage points. ${next ? "Next milestone: " + next.name + " at " + next.at + " reputation (" + (next.at - state.reputation) + " to go)." : "You have reached the highest reputation milestone."}</p><div class="rep-milestones">${NG.repTiers.map((t) => `<span class="${state.reputation >= t.at ? "reached" : ""}">${t.at} REP <b>${t.name}</b><small>+${Math.round(t.interest * 100)} pp interest</small></span>`).join("")}</div><p class="fine-print">Inspected honest sales earn the normal +1/+2 condition bonus plus 1 extra; as-is sales earn +1. Dealer sales earn none. Complaints can reduce reputation; Customers shows each change. Reputation also helps new negotiations, capped at a 2% price-limit bonus. Customer relationships and complaints are available in Customers. Collector requests are planned for a later version.</p></section><section><div class="section-heading"><h2>Recent experience</h2></div><div class="ledger">${p.log.map((l) => `<div><span>${esc(l.car)} / ${l.phase === "purchase" ? "Purchase negotiation" : "Sale negotiation"}<small>${NG.date(l.day)}</small></span><strong class="positive">+${l.amount} XP</strong></div>`).join("") || '<p class="muted">Your first successful negotiated deal will appear here.</p>'}</div></section>`;
  }

  function album() {
    const stats = NG.collectionStats(state);
    const models = NG.catalog.filter((m) => {
      const entry = state.collection.models[m.id] || {};
      return (
        (albumSegment === "all" || m.segment === albumSegment) &&
        (albumStatus === "all" ||
          (albumStatus === "missing" && !entry.purchased) ||
          entry[albumStatus] > 0) &&
        (m.name + " " + m.trim)
          .toLowerCase()
          .includes(albumSearch.toLowerCase())
      );
    });
    const goals = [
      ["First Five", stats.purchased, 5],
      ["Hands On", stats.repaired, 5],
      ["Wide Selection", stats.sold, 15],
      ["Complete Catalog", stats.purchased, stats.total],
    ];
    return `<div class="album-summary">${NG.progressBar("MODELS PURCHASED", stats.purchased, stats.total)}${NG.progressBar("MODELS REPAIRED", stats.repaired, stats.total)}${NG.progressBar("MODELS SOLD", stats.sold, stats.total)}</div><div class="album-goals">${goals.map(([name, n, target]) => `<div class="${n >= target ? "goal-complete" : ""}"><span>${n >= target ? "✓" : "◇"} ${name}</span><small>${Math.min(n, target)} / ${target}${n >= target ? " · COMPLETED" : ""}</small></div>`).join("")}</div><div class="section-heading"><h2>Your model album <span>${models.length} / ${stats.total}</span></h2><div class="filters album-filters"><input id="album-search" type="search" placeholder="Search brand or model" aria-label="Search collection" value="${esc(albumSearch)}"><select id="album-status" aria-label="Collection status">${[
      ["all", "All models"],
      ["missing", "Not purchased yet"],
      ["purchased", "Purchased"],
      ["repaired", "Repaired"],
      ["sold", "Sold"],
    ]
      .map(
        ([id, name]) =>
          `<option value="${id}" ${albumStatus === id ? "selected" : ""}>${name}</option>`,
      )
      .join(
        "",
      )}</select><select id="album-segment" aria-label="Collection region">${[
      ["all", "All regions"],
      ["japan", "Japan"],
      ["europe", "Europe"],
      ["america", "America"],
    ]
      .map(
        ([id, name]) =>
          `<option value="${id}" ${albumSegment === id ? "selected" : ""}>${name}</option>`,
      )
      .join("")}</select></div></div><div class="car-grid album-grid">${
      models
        .map((m) => {
          const e = state.collection.models[m.id] || {},
            tier = NG.collectibleTier(m);
          return `<button class="car-card album-card ${e.purchased ? "collected" : "uncollected"}" data-action="model-guide" data-model="${m.id}"><div class="car-image"><span class="car-number">${m.years[0]}-${m.years[1]} / ${tier.toUpperCase()}</span>${NG.carArt({ id: "album-" + m.id, model: m.id })}<span class="image-caption">${m.trim}</span></div><div class="card-content"><div class="card-top"><h3>${esc(m.name)}</h3><span class="arrow">↗</span></div><div class="collection-stamps"><span class="${e.purchased ? "stamped" : ""}">${e.purchased ? "✓" : "·"} BOUGHT</span><span class="${e.repaired ? "stamped" : ""}">${e.repaired ? "✓" : "·"} REPAIRED</span><span class="${e.sold ? "stamped" : ""}">${e.sold ? "✓" : "·"} SOLD</span></div></div></button>`;
        })
        .join("") ||
      '<div class="empty-state"><h2>No matching models.</h2><p>Try another search or filter.</p></div>'
    }</div><p class="fine-print">This album is a model guide, not today’s listings. Purchase a car to stamp its model. Repairs count once the workshop finishes; finding a fault or starting work is not a completed repair. Each vehicle counts once per stage. Album milestones are cosmetic goals, not cash or XP rewards.</p>`;
  }
  function modelGuide(id) {
    const m = NG.catalog.find((m) => m.id === id);
    if (!m) return;
    selected = null;
    const e = state.collection.models[id] || {};
    dialog.innerHTML = `<div class="modal-head"><span class="eyebrow">CAR COLLECTION / MODEL GUIDE</span><button data-action="close" aria-label="Close">×</button></div><div class="detail-grid"><div class="detail-visual">${NG.carArt({ id: "guide-" + id, model: id }, true)}<span>${m.years[0]}-${m.years[1]} / ${NG.collectibleTier(m).toUpperCase()}</span></div><div><span class="eyebrow">${m.segment.toUpperCase()} / ${esc(m.trim)}</span><h2>${esc(m.name)}</h2><p class="muted">Game years: ${m.years[0]}-${m.years[1]}<br>Service cost index: ${(m.service || 1).toFixed(2)}×</p><div class="detail-prices"><div><span>Reference value</span><strong>${NG.money(m.value)}</strong></div><div><span>Your trading profit</span><strong class="${(e.profit || 0) >= 0 ? "positive" : "negative"}">${signed(e.profit || 0)}</strong></div></div><p class="fine-print">Reference value changes with age, mileage, condition and demand. Collectible tiers are game categories. This page is not an offer to buy.</p></div></div><div class="guide-history"><div><span>Purchased vehicles</span><strong>${e.purchased || 0}</strong></div><div><span>Vehicles repaired</span><strong>${e.repaired || 0}</strong></div><div><span>Vehicles sold</span><strong>${e.sold || 0}</strong></div></div><button class="primary full" data-action="view" data-view="market">Look for one in today’s market</button>`;
    if (!dialog.open) dialog.showModal();
  }

  function customers() {
    const visible = state.claims.filter((q) => q.status !== "scheduled"),
      open = visible.filter((q) => q.status === "open");
    return `<div class="growth-summary"><div><span>CUSTOMERS</span><strong>${state.customers.length}</strong></div><div><span>OPEN COMPLAINTS</span><strong>${open.length}</strong></div><div><span>RETURNING CUSTOMERS</span><strong>${state.customers.filter((c) => c.purchases > 1).length}</strong></div></div><div class="section-heading"><h2>Customer care</h2></div>${
      visible
        .slice()
        .reverse()
        .map(
          (q) =>
            `<article class="claim-card ${q.status === "open" ? "claim-open" : ""}"><span class="eyebrow">${q.status.toUpperCase()} / ${esc(q.buyer)}</span><h3>${NG.model({ model: q.model }).name}</h3><p>You advertised this car as fault-free. The buyer found: ${q.faults.map(esc).join(", ")}.</p>${q.status === "open" ? `<p>Respond before ${NG.date(q.deadline)}. Waiting until that day closes the complaint as unanswered.</p><div class="actions"><button class="primary" data-action="resolve-claim" data-claim="${q.id}" data-decision="refund" ${state.cash < q.amount ? "disabled" : ""}>Contribute ${NG.money(q.amount)} to repairs</button><button data-action="resolve-claim" data-claim="${q.id}" data-decision="decline">Decline / -2 REP</button></div><p class="fine-print">Contribution: +1 REP recovery and customer trust recovery; reduces cash and this sale’s profit. Declining costs no cash but hurts trust. Ignoring costs -3 REP. Reputation cannot fall below zero.</p>` : `<p class="fine-print">Resolved ${NG.date(q.resolvedDay)}${q.status === "settled" ? " / repair contribution " + NG.money(q.amount) : " / no payment"}.</p>`}</article>`,
        )
        .join("") ||
      '<div class="ledger-empty">No complaints received. Clear descriptions help keep it that way.</div>'
    }<div class="section-heading"><h2>Your customer book</h2></div><div class="table-wrap"><table><thead><tr><th>Customer</th><th>Preference</th><th>Purchases</th><th>Net spending</th><th>Trust</th></tr></thead><tbody>${state.customers.map((c) => `<tr><td>${esc(c.name)}<small>Last purchase ${NG.date(c.lastDay)}</small></td><td>${c.segment.toUpperCase()}</td><td>${c.purchases}</td><td>${NG.money(c.spent)}</td><td>${c.trust >= 1 ? "WILL CONSIDER RETURNING" : c.trust < 0 ? "LOST TRUST" : "CAUTIOUS"}</td></tr>`).join("") || '<tr><td colspan="5">Your first private buyer will appear here. Dealer sales do not create customer relationships.</td></tr>'}</tbody></table></div><p class="fine-print">Customers who trust you can return for cars from their preferred region. Their offers receive a 3% loyalty uplift, capped at your listed price. Higher reputation increases the chance of a repeat contact. A pending complaint blocks repeat offers from that customer.</p><div class="section-heading"><h2>Reputation history</h2></div><div class="ledger">${state.reputationLog.map((l) => `<div><span>${esc(l.reason)}<small>${NG.date(l.day)}</small></span><strong class="${l.delta >= 0 ? "positive" : "negative"}">${l.delta >= 0 ? "+" : ""}${l.delta} REP</strong></div>`).join("") || '<p class="muted">New reputation changes will appear here. Older changes are not reconstructed.</p>'}</div>`;
  }
  function listingDescription(c) {
    const mode = c.listingMode || "as-is";
    return `<div class="listing-description"><span class="eyebrow">LISTING DESCRIPTION</span><p>${NG.listingModes[mode].name}</p>${
      mode === "honest"
        ? `<p class="fine-print">Disclosed faults: ${
            c.flaws
              .filter((f) => !f.fixed)
              .map((f) => esc(f.label))
              .join(", ") || "none found"
          }.</p>`
        : mode === "promise"
          ? '<p class="negative fine-print">An unresolved fault will trigger a complaint two days after sale.</p>'
          : '<p class="fine-print">Condition is not guaranteed; no hidden-fault complaint under this description.</p>'
    }</div>`;
  }
  function listingForm(c, value, id) {
    return `<label class="price-label" for="list-price">Asking price ($)</label><input id="list-price" type="number" min="100" max="100000" step="25" value="${Math.round(((c.inspected ? value : NG.estimate(state, c)) * 1.08) / 25) * 25}"><label class="price-label" for="listing-mode">What do you tell the buyer?</label><select id="listing-mode">${Object.entries(
      NG.listingModes,
    )
      .map(
        ([key, m]) =>
          `<option value="${key}" ${key === (c.inspected ? "honest" : "as-is") ? "selected" : ""} ${key === "honest" && !c.inspected ? "disabled" : ""}>${m.name}</option>`,
      )
      .join(
        "",
      )}</select><div id="listing-help" class="fine-print">${NG.listingModes[c.inspected ? "honest" : "as-is"].description}</div><button class="primary full" data-action="list" data-id="${id}">List car for sale</button>`;
  }

  function purchasePanel(c) {
    const quote = NG.purchaseQuote(c),
      n = c.negotiation;
    return `${state.progress.sharpEye && !c.inspected ? `<div class="negotiation-dialogue"><span>SHARP EYE</span><p>${c.flaws.some((f) => !f.fixed) ? "Possible fault: " + esc(c.flaws.find((f) => !f.fixed).label) : "Nothing suspicious spotted."} A clue is not a full inspection.</p></div>` : ""}<h3>Talk to the seller</h3><div class="negotiation-dialogue"><span>SELLER / PHONE CONNECTED</span><p>${esc(n?.message || "“Asking " + NG.money(c.ask) + ". What did you have in mind?”")}</p></div>${!n?.closed ? `<label class="price-label" for="purchase-bid">Your offer ($)</label><div class="haggle-controls"><input id="purchase-bid" type="number" min="100" max="${Math.min(state.cash, quote - 1)}" step="1" value="${Math.max(100, Math.min(state.cash, quote - 1, Math.round((n ? n.lastBid + (quote - n.lastBid) * 0.5 : quote * 0.9) / 25) * 25))}"><button data-action="haggle-buy" data-id="${c.id}" ${state.inventory.length >= state.capacity || state.cash < 100 ? "disabled" : ""}>Make offer</button></div><p class="fine-print">${NG.sellerRounds(state) - (n?.rounds || 0)} rounds left. A very low offer can end the deal. No cash changes hands until you buy.</p>` : ""}${!n?.walked ? `<p class="fine-print">After buying: ${state.capacity - state.inventory.length - 1} spaces and ${NG.money(state.cash - quote)} cash remaining. Inspection spending: ${NG.money(c.inspectionCost)}.</p><button class="primary full" data-action="buy" data-id="${c.id}" ${state.cash < quote || state.inventory.length >= state.capacity ? "disabled" : ""}>${n ? "Accept & buy" : "Buy at asking price"} · ${NG.money(quote)}</button>` : '<p class="negative">The seller has ended this negotiation. Find another car in the market.</p>'}`;
  }
  function offerCard(c, o) {
    const canCounter = !o.negotiation?.closed && o.price < c.listPrice;
    return `<div class="offer buyer-offer"><div class="offer-summary"><span>${esc(o.buyer)}${o.returning ? '<small class="positive">RETURNING CUSTOMER / +3% LOYALTY</small>' : ""}<strong>${NG.money(o.price)}</strong><small>Profit: ${signed(o.price - NG.cost(c))}</small></span><div class="offer-actions"><button class="primary" data-action="sell" data-id="${c.id}" data-offer="${o.id}">Accept</button><button data-action="reject" data-id="${c.id}" data-offer="${o.id}">Decline</button></div></div>${o.negotiation?.message ? `<div class="negotiation-dialogue"><span>BUYER / FINAL OFFER</span><p>${esc(o.negotiation.message)}</p></div>` : ""}${canCounter ? `<label class="price-label" for="counter-price-${o.id}">Your counteroffer ($)</label><div class="haggle-controls"><input id="counter-price-${o.id}" type="number" min="${o.price + 1}" max="${c.listPrice}" step="1" value="${Math.min(c.listPrice, Math.max(o.price + 1, Math.round(o.price * 1.06)))}"><button data-action="haggle-sell" data-id="${c.id}" data-offer="${o.id}">Counteroffer</button></div><p class="fine-print">Ask too much and the buyer may walk. Accept their reply to complete the sale.</p>` : ""}</div>`;
  }

  function details(id) {
    selected = id;
    const c = [...state.market, ...state.inventory].find((c) => c.id === id);
    if (!c) {
      dialog.close();
      return;
    }
    if (state.inventory.includes(c) && c.offers.some((o) => o.seen !== true)) {
      c.offers.forEach((o) => (o.seen = true));
      NG.save(state);
      render();
    }
    const owned = state.inventory.includes(c),
      m = NG.model(c),
      value = NG.value(state, c),
      known = c.inspected || owned;
    dialog.innerHTML = `<div class="modal-head"><span class="eyebrow">${owned ? "GARAGE / CAR DETAILS" : "CAR MARKET / LISTING"}</span><button data-action="close" aria-label="Close">×</button></div><div class="detail-grid"><div class="detail-visual">${NG.carArt(c, true)}<span>${c.year} / ${m.trim}</span></div><div><span class="eyebrow">${m.segment === "japan" ? "JAPANESE" : m.segment === "america" ? "AMERICAN" : "EUROPEAN"} CLASSIC</span><h2>${m.name}</h2><p class="muted">${c.year} · ${c.mileage.toLocaleString("en-US")} miles<br>Service cost index: ${(m.service || 1).toFixed(2)}×</p><div class="detail-prices"><div><span>${owned ? "Total invested" : "Asking price"}</span><strong>${NG.money(owned ? NG.cost(c) : NG.purchaseQuote(c))}</strong></div><div><span>${c.inspected ? "Inspected market value" : "Estimated market value"}</span><strong>${NG.money(c.inspected ? value : NG.estimate(state, c))}</strong></div></div><p class="fine-print">${c.inspected ? "The inspected value reflects today’s demand and any discovered faults." : "This estimate relies on the seller’s claims. Hidden faults may lower the value."}</p></div></div><div class="detail-sections"><section>${owned && !c.listed ? `<label class="price-label" for="repair-mode">Workshop booking</label><select id="repair-mode"><option value="standard" ${repairMode === "standard" ? "selected" : ""}>In-house / one job slot</option><option value="rush" ${repairMode === "rush" ? "selected" : ""}>Outsourced rush / +25%, min $80</option></select>` : ""}${owned && NG.localWorkshopBlocked(state) ? '<p class="workshop-note">Today’s local event closes in-house bookings. Choose outsourced rush or wait until tomorrow.</p>' : ""}<h3>Mechanical condition <span>${known ? NG.condition(c) : c.claim}%</span></h3><p class="fine-print">${owned && !c.inspected ? "Basic workshop assessment. A full inspection is needed to reveal hidden faults." : c.inspected ? "Inspected car. Hidden faults are now visible." : "Claimed by the seller. You can check it before buying."}</p>${Object.entries(
      NG.parts,
    )
      .map(([p, d]) => {
        const n = known ? c.parts[p] : c.claim;
        return `<div class="part-row"><span>${d.label}</span><div class="meter"><i style="width:${n}%"></i></div><b>${n}%</b>${owned ? `<button data-action="repair" data-id="${id}" data-part="${p}" ${NG.busy(state, c) || c.listed || state.operations.arrears > 0 || (repairMode === "standard" && (NG.workshopBusy(state) >= 1 || NG.localWorkshopBlocked(state))) || (c.parts[p] >= 95 && !c.flaws.some((f) => f.part === p && f.revealed && !f.fixed)) ? "disabled" : ""}>${c.parts[p] >= 95 && !c.flaws.some((f) => f.part === p && f.revealed && !f.fixed) ? "Done" : NG.money(NG.repairQuote(c, p, state, repairMode))}</button>` : ""}</div>`;
      })
      .join("")}<div class="faults">${
      c.flaws
        .filter((f) => f.revealed)
        .map(
          (f) =>
            `<p class="${f.fixed ? "positive" : "negative"}">${f.fixed ? "✓" : "!"} ${f.label}${f.fixed ? " - fixed" : " - " + NG.money(f.cost) + " extra repair cost"}</p>`,
        )
        .join("") ||
      `<p>${c.inspected ? "✓ No hidden faults found." : "? Hidden faults: not fully inspected."}</p>`
    }</div>${!c.inspected ? `<button data-action="inspect" data-id="${id}">Mechanical inspection · ${NG.money(NG.inspectionPrice(state))}</button>` : ""}${owned ? '<p class="fine-print">Repairs restore a part to 95%. Normal engine/transmission work takes 2 days (1 at Mechanical rank 2 or with an active visiting mechanic); other jobs and rush work take 1 day. If a hidden fault is found, you get a revised quote before paying.</p>' : ""}</section><section>${!owned ? purchasePanel(c) : `<h3>Sell your car</h3>${NG.busy(state, c) ? `<p class="workshop-note">Your car is in the workshop. Ready ${NG.date(c.readyDay)} (${c.readyDay - state.day} day(s) remaining).</p>` : c.listed ? `${listingDescription(c)}<p>Asking price: <strong>${NG.money(c.listPrice)}</strong></p><button data-action="unlist" data-id="${id}">Remove listing</button><h4>Today’s offers</h4>${c.buyerMessage ? `<div class="negotiation-dialogue"><p>${esc(c.buyerMessage)}</p></div>` : ""}${c.offers.length ? c.offers.map((o) => offerCard(c, o)).join("") : '<p class="muted">No offers yet. Advance to the next day. A higher asking price may require more patience.</p>'}` : listingForm(c, value, id)}<div class="dealer"><span>INSTANT DEALER OFFER / FIXED PRICE</span><strong>${NG.money(value * 0.72)}</strong><p>Profit: <b class="${value * 0.72 - NG.cost(c) >= 0 ? "positive" : "negative"}">${signed(Math.round(value * 0.72) - NG.cost(c))}</b></p><button data-action="sell" data-id="${id}" data-offer="dealer" ${NG.busy(state, c) ? "disabled" : ""}>Sell to dealer</button></div><p class="fine-print">Investment: purchase ${NG.money(c.purchasePrice)} + inspection ${NG.money(c.inspectionCost)} + repairs ${NG.money(c.repairCost)}.</p>`}</section></div>`;
    if (!dialog.open) dialog.showModal();
  }
  function radioConsole() {
    return `<div class="radio-console"><button data-action="radio-open" aria-label="Choose radio station"><span>GARAGE RADIO</span><strong data-radio-station>${esc(NG.radio.station.name)} / ${esc(NG.radio.station.frequency)}</strong></button><button data-action="radio-toggle" data-radio-toggle>${NG.radio.playing ? "STOP" : "PLAY"}</button></div>`;
  }
  function showRadio() {
    const radio = document.querySelector("#radio-dialog");
    radio.innerHTML = `<div class="modal-head"><span class="eyebrow">SILVER PALMS / FM TUNER</span><button data-action="radio-close" aria-label="Close radio">×</button></div><h2 id="radio-title">Garage radio</h2><p>Three fictional stations. Original instrumental loops, inspired by 1993.</p><div class="radio-stations">${NG.radioStations.map((s) => `<button class="radio-station" data-action="radio-tune" data-id="${s.id}" aria-pressed="${s.id === NG.radio.station.id}"><span>${s.frequency} FM</span><strong>${esc(s.name)}</strong><small>${esc(s.genre)}</small></button>`).join("")}</div><p class="radio-now" role="status" data-radio-now></p><label class="radio-volume" for="radio-volume">VOLUME <input id="radio-volume" type="range" min="0" max="100" value="${Math.round(NG.radio.volume * 100)}"><output id="radio-volume-value">${Math.round(NG.radio.volume * 100)}%</output></label><button class="primary" data-action="radio-toggle" data-radio-toggle></button><p class="fine-print">Click a station to tune in. Your station and volume are remembered; playback starts only when you press play.</p>`;
    updateRadio();
    if (!radio.open) radio.showModal();
  }
  function updateRadio() {
    document
      .querySelectorAll("[data-radio-station]")
      .forEach(
        (el) =>
          (el.textContent =
            NG.radio.station.name + " / " + NG.radio.station.frequency),
      );
    document.querySelectorAll("[data-radio-toggle]").forEach((el) => {
      el.textContent = NG.radio.playing ? "STOP RADIO" : "PLAY RADIO";
      el.setAttribute("aria-pressed", String(NG.radio.playing));
    });
    document
      .querySelectorAll(".radio-station")
      .forEach((el) =>
        el.setAttribute(
          "aria-pressed",
          String(el.dataset.id === NG.radio.station.id),
        ),
      );
    document
      .querySelectorAll(".garage-world")
      .forEach((el) => el.classList.toggle("radio-playing", NG.radio.playing));
    const now = document.querySelector("[data-radio-now]");
    if (now)
      now.textContent = NG.radio.playing
        ? "ON AIR / " + NG.radio.station.track
        : "RADIO OFF / " + NG.radio.station.name;
    const output = document.querySelector("#radio-volume-value");
    if (output) output.textContent = Math.round(NG.radio.volume * 100) + "%";
  }
  NG.radio.onChange = updateRadio;
  function showDayConfirmation() {
    const confirm = document.querySelector("#day-confirm");
    if (
      confirm.open ||
      document.querySelector("#day-report").open ||
      document.querySelector("#garage-transition").open
    )
      return;
    const offers = NG.currentOffers(state);
    const dueRequests = state.opportunities.requests.filter(
      (q) => q.status === "active" && q.deadline <= state.day,
    );
    pendingCloseDay = state.day;
    confirm.innerHTML = `<div class="modal-head"><span class="eyebrow">CLOSE BUSINESS DAY</span><button data-action="cancel-next" aria-label="Cancel day closing">×</button></div><h2 id="day-confirm-title">Close ${NG.date(state.day)}?</h2><p>No time passes until you confirm. The next operating bill is ${NG.money(NG.operatingBill(state))}, plus ${NG.money(state.operations.arrears)} overdue. Closing refreshes the market, finishes eligible repairs and brings the next morning’s news.</p>${offers.length ? `<div class="confirm-offer-warning"><h3>${offers.length} pending offer${offers.length === 1 ? "" : "s"} will expire</h3><ul>${offers.map((o) => `<li>${esc(o.car)} / ${esc(o.buyer)}: <strong>${NG.money(o.price)}</strong>${o.unread ? ' <span class="negative">NOT REVIEWED</span>' : ""}</li>`).join("")}</ul><p>You can review and accept these offers before ending the day.</p><button data-action="confirm-view-offers">Review offers first</button></div>` : '<p class="muted">No pending buyer offers.</p>'}${dueRequests.length ? `<div class="confirm-offer-warning"><h3>Buyer request deadline today</h3><ul>${dueRequests.map((q) => `<li>${esc(NG.requestKinds.find((t) => t.id === q.kind).title)} / closing now misses delivery and costs 1 reputation.</li>`).join("")}</ul><button data-action="confirm-view-requests">Review requests first</button></div>` : ""}${state.business.adActive ? `<p class="fine-print">The newspaper campaign will cost $20 on the next morning${state.cash < NG.operatingBill(state) + state.operations.arrears + 20 ? " and pause if operating bills leave insufficient cash" : ""}.</p>` : ""}<div class="actions"><button class="primary" data-action="cancel-next">Keep playing</button><button class="${offers.length ? "danger" : "primary"}" data-action="confirm-next">${offers.length ? "Close day & expire offers" : "Yes, close day"}</button></div>`;
    confirm.showModal();
    confirm.querySelector('.actions [data-action="cancel-next"]').focus();
  }
  function cancelDayClosing() {
    pendingCloseDay = null;
    document.querySelector("#day-confirm").close();
  }
  function openLiveOffers() {
    const offers = NG.currentOffers(state),
      ids = [...new Set(offers.map((o) => o.carId))];
    dialog.close();
    selected = null;
    if (ids.length === 1) {
      render();
      details(ids[0]);
    } else {
      view = "inventory";
      render();
    }
  }

  function showDayReport() {
    const r = state.dayReport;
    if (!r) return;
    const report = document.querySelector("#day-report");
    const list = (items, empty) =>
      items.length
        ? `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`
        : `<p class="muted">${empty}</p>`;
    report.innerHTML = `<div class="modal-head"><span class="eyebrow">DAILY REPORT / DAY ${r.closedDay + 1} CLOSED</span><button data-action="close-day-report" aria-label="Close daily report">×</button></div><h2 id="day-report-title">${NG.date(r.closedDay)}</h2><div class="report-metrics"><div><span>CLOSING CASH</span><strong>${NG.money(r.closingCash)}</strong></div><div><span>DAY’S CASH FLOW</span><strong class="${r.cashFlow >= 0 ? "positive" : "negative"}">${signed(r.cashFlow)}</strong></div><div><span>DAY’S TRADING RESULT</span><strong class="${r.tradingResult >= 0 ? "positive" : "negative"}">${signed(r.tradingResult)}</strong></div></div><p class="fine-print">Closed day: Level ${r.level || 1} / +${r.xpEarned || 0} XP earned / ${r.closingReputation ?? 0} REP.</p><details class="report-transactions"><summary>Closed-day transactions (${(r.transactions || []).length})</summary>${list(
      (r.transactions || []).map(
        (t) => `${esc(t.description)}: <strong>${signed(t.amount)}</strong>`,
      ),
      "No cash movements during this day.",
    )}</details><div class="report-section"><span class="eyebrow">NEXT MORNING / ${NG.date(r.day)}</span><h3>${esc(r.event.title)}</h3><p>${esc(r.event.text)}</p><p class="fine-print">${r.marketCount} fresh listings. Demand: Japan ${Math.round(r.demand.japan * 100)}%, Europe ${Math.round(r.demand.europe * 100)}%, America ${Math.round(r.demand.america * 100)}%. Yesterday’s ${r.expiredOffers} unaccepted offer(s) expired.</p></div><div class="report-columns"><section><h3>Local opportunities</h3>${list((r.localNotices || []).map(esc), "No new local invitations or outcomes.")}${(r.activeRequests || []).length ? `<ul>${r.activeRequests.map((q) => `<li>${esc(q.title)} / deliver by ${NG.date(q.deadline)}</li>`).join("")}</ul>` : ""}<button data-action="report-go" data-view="operations">Review opportunities</button><h3>Workshop ready</h3>${list(r.completedRepairs.map(esc), "No repairs completed overnight.")}<h3>New offers (${r.offers.length})</h3>${list(
      r.offers.map(
        (o) =>
          `${esc(o.car)} / ${esc(o.buyer)}${o.returning ? " (returning)" : ""}: <strong>${NG.money(o.price)}</strong>`,
      ),
      "No new offers today. Your asking price may need adjusting.",
    )}</section><section><h3>Customer care</h3>${list(
      r.newClaims.map(
        (q) =>
          `${esc(q.buyer)} / ${esc(q.car)}: repair contribution ${NG.money(q.amount)}, respond before ${NG.date(q.deadline)}.`,
      ),
      "No new complaints.",
    )}${r.expiredClaims.length ? `<p class="negative">Unanswered complaints closed: ${r.expiredClaims.map(esc).join(", ")}.</p>` : ""}<h3>Overnight expenses & reputation</h3><p>${esc(r.advertising)}</p>${r.operations ? `<p>${esc(r.operations)}</p>` : ""}<p>Cash: <strong class="${r.overnightCash >= 0 ? "positive" : "negative"}">${signed(r.overnightCash)}</strong> / REP: <strong class="${r.overnightReputation >= 0 ? "positive" : "negative"}">${r.overnightReputation >= 0 ? "+" : ""}${r.overnightReputation}</strong></p></section></div><p class="fine-print">Trading result covers deals closed during the finished day and customer repair contributions paid that day. Cash flow also includes purchases, repairs and business spending. No time passes while this window is open.</p><div class="actions"><button data-action="report-go" data-view="inventory">View offers</button>${r.newClaims.length || state.claims.some((q) => q.status === "open") ? '<button data-action="report-go" data-view="customers">Customer care</button>' : ""}<button class="primary" data-action="close-day-report">Continue to garage</button></div>`;
    if (!report.open) report.showModal();
  }
  function acknowledgeDayReport() {
    if (state.dayReport) {
      state.dayReport.read = true;
      NG.save(state);
    }
    document.querySelector("#day-report").close();
  }

  let toastTimer;
  function toast(message) {
    const t = document.querySelector("#toast");
    t.textContent = message;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 5500);
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    e.preventDefault();
    const { action, id, part, offer } = b.dataset;
    try {
      let message = "",
        openReport = false,
        beforeScene = "",
        closingDate = "";
      if (action.startsWith("radio-")) {
        if (action === "radio-open") showRadio();
        if (action === "radio-close")
          document.querySelector("#radio-dialog").close();
        if (action === "radio-toggle" || action === "radio-tune") {
          if (action === "radio-toggle" && NG.radio.playing) NG.radio.stop();
          else
            (action === "radio-tune"
              ? NG.radio.tune(id)
              : NG.radio.play()
            ).catch((error) => {
              NG.radio.stop();
              toast(error.message);
            });
        }
        return;
      }
      if (action === "show-day-report") {
        showDayReport();
        return;
      }
      if (action === "close-day-report") {
        acknowledgeDayReport();
        return;
      }
      if (action === "report-go") {
        acknowledgeDayReport();
        view = b.dataset.view;
        render();
        return;
      }
      if (action === "view") {
        dialog.close();
        selected = null;
        view = b.dataset.view;
        render();
        window.scrollTo(0, 0);
        return;
      }
      if (action === "model-guide") {
        modelGuide(b.dataset.model);
        return;
      }
      if (action === "detail") {
        details(id);
        return;
      }
      if (action === "close") {
        dialog.close();
        return;
      }
      if (action === "reset") {
        document.querySelector("#reset-dialog").showModal();
        return;
      }
      if (action === "close-reset") {
        document.querySelector("#reset-dialog").close();
        return;
      }
      if (action === "confirm-reset") {
        state = NG.newState();
        view = "garage";
        document.querySelector("#reset-dialog").close();
        dialog.close();
        selected = null;
        message = "A fresh start. Good luck with your first deal!";
      }
      if (action === "view-offers") {
        openLiveOffers();
        return;
      }
      if (action === "confirm-view-requests") {
        cancelDayClosing();
        view = "operations";
        render();
        return;
      }
      if (action === "confirm-view-offers") {
        cancelDayClosing();
        openLiveOffers();
        return;
      }
      if (action === "cancel-next") {
        cancelDayClosing();
        return;
      }
      if (action === "next") {
        showDayConfirmation();
        return;
      }
      if (action === "confirm-next") {
        const confirmation = document.querySelector("#day-confirm");
        if (
          !confirmation.open ||
          pendingCloseDay !== state.day ||
          document.querySelector("#day-report").open
        )
          return;
        closingDate = NG.date(state.day);
        beforeScene = document.querySelector(".garage-world").outerHTML;
        b.disabled = true;
        cancelDayClosing();
        dialog.close();
        selected = null;
        view = "garage";
        NG.nextDay(state);
        openReport = true;
        message =
          state.claimNotice ||
          state.operations.notice ||
          state.adNotice ||
          state.event.title;
      }
      if (action === "inspect") {
        NG.inspect(state, id);
        message =
          "Inspection complete. Check the mechanical condition and faults.";
      }
      if (action === "resolve-claim")
        message = NG.resolveClaim(state, b.dataset.claim, b.dataset.decision);
      if (action === "train-skill")
        message = NG.trainSkill(state, b.dataset.skill);
      if (action === "specialist-perk")
        message = NG.unlockSpecialist(state, b.dataset.perk);
      if (action === "local-accept" || action === "local-decline")
        message = NG.chooseLocalEvent(state, id, action === "local-accept");
      if (action === "request-accept" || action === "request-decline")
        message = NG.chooseRequest(state, id, action === "request-accept");
      if (action === "request-abandon") message = NG.abandonRequest(state, id);
      if (action === "request-deliver") {
        const profit = NG.sell(state, b.dataset.car, "request:" + id);
        message =
          "Request delivered. Deal profit: " +
          signed(profit) +
          ". +3 reputation.";
      }
      if (action === "pay-bills") message = NG.payOperatingBills(state);
      if (action === "train-negotiation") message = NG.trainNegotiation(state);
      if (action === "unlock-perk") message = NG.unlockOneMoreShot(state);
      if (action === "upgrade")
        message = NG.buyUpgrade(state, b.dataset.upgrade);
      if (action === "toggle-ad") message = NG.toggleAdvertising(state);
      if (action === "haggle-buy") {
        message = NG.hagglePurchase(
          state,
          id,
          Number(document.querySelector("#purchase-bid").value),
        );
      }
      if (action === "haggle-sell") {
        message = NG.haggleSale(
          state,
          id,
          offer,
          Number(document.querySelector("#counter-price-" + offer).value),
        );
      }
      if (action === "buy") {
        NG.buy(state, id);
        arrival = id;
        view = "garage";
        dialog.close();
        selected = null;
        message = "Your car has arrived in the garage." + NG.rewardText(state);
      }
      if (action === "repair") message = NG.repair(state, id, part, repairMode);
      if (action === "list") {
        NG.list(
          state,
          id,
          Number(document.querySelector("#list-price").value),
          document.querySelector("#listing-mode").value,
        );
        message = "Your listing is live. New offers may arrive the next day.";
      }
      if (action === "unlist") {
        const c = state.inventory.find((c) => c.id === id);
        c.listed = false;
        c.offers = [];
        message = "Listing removed.";
      }
      if (action === "reject") {
        const c = state.inventory.find((c) => c.id === id);
        c.offers = c.offers.filter((o) => o.id !== offer);
        message = "Offer declined.";
      }
      if (action === "sell") {
        const profit = NG.sell(state, id, offer);
        message =
          "Sold. Deal profit: " + signed(profit) + "." + NG.rewardText(state);
      }
      NG.save(state);
      render();
      if (dialog.open && selected) details(selected);
      if (openReport)
        NG.playGarageTransition(
          beforeScene,
          document.querySelector(".garage-world").outerHTML,
          NG.date(state.day),
          showDayReport,
          closingDate,
        );
      else if (message) toast(message);
    } catch (error) {
      toast(error.message);
    }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "radio-volume")
      NG.radio.setVolume(Number(e.target.value) / 100);
    if (e.target.id === "album-search") {
      const position = e.target.selectionStart;
      albumSearch = e.target.value;
      render();
      const field = document.querySelector("#album-search");
      field.focus();
      field.setSelectionRange(position, position);
    }
  });
  document.addEventListener("change", (e) => {
    if (e.target.id === "repair-mode") {
      repairMode = e.target.value;
      details(selected);
    }
    if (e.target.id === "listing-mode")
      document.querySelector("#listing-help").textContent =
        NG.listingModes[e.target.value].description;
    if (e.target.id === "album-status") {
      albumStatus = e.target.value;
      render();
    }
    if (e.target.id === "album-segment") {
      albumSegment = e.target.value;
      render();
    }
    if (e.target.id === "segment-filter") {
      filter = e.target.value;
      render();
    }
    if (e.target.id === "sort-filter") {
      sort = e.target.value;
      render();
    }
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  });
  document.querySelector("#day-confirm").addEventListener("cancel", (e) => {
    e.preventDefault();
    cancelDayClosing();
  });
  document.querySelector("#day-report").addEventListener("cancel", (e) => {
    e.preventDefault();
    acknowledgeDayReport();
  });
  NG.save(state);
  render();
  if (state.dayReport && !state.dayReport.read) showDayReport();
  if (NG.loadError)
    toast("Your previous save could not be read. A new game has started.");
})();
