(() => {
  const scenario = new URLSearchParams(location.search).get("scenario");
  if (["A", "B", "C"].includes(scenario)) {
    NG.saveKey += "-practice-" + scenario;
    if (!localStorage.getItem(NG.saveKey))
      NG.save(NG.practiceScenario(scenario));
  }
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
    repairMode = "standard",
    operationsTab = "today",
    dealerTab = "skills";
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
    `<button class="car-card" data-action="detail" data-id="${c.id}"><div class="car-image"><span class="car-number">${c.year} / ${NG.model(c).segment === "japan" ? "JPN" : NG.model(c).segment === "europe" ? "EUR" : "USA"}</span>${NG.carArt(c)}<span class="image-caption">${NG.model(c).trim}</span>${owned ? tag(c) : c.inspected ? '<span class="tag teal">INSPECTED</span>' : `<span class="tag">${state.day - c.listing.createdDay} DAYS LISTED</span>`}</div><div class="card-content"><div class="card-top"><h3>${NG.model(c).name}</h3><span class="arrow">↗</span></div><p>${c.mileage.toLocaleString("en-US")} miles <span>·</span> ${c.inspected || owned ? NG.condition(c) + "% condition" : c.claim + "% claimed condition"}</p><div class="card-bottom"><strong>${NG.money(owned ? NG.cost(c) : NG.purchaseQuote(c))}</strong><span>${owned ? "total invested" : "asking price"}</span></div></div></button>`;
  const carTabs = new Map(),
    drafts = new Map(),
    viewScroll = new Map();
  let viewHistory = [];
  function rememberDrafts() {
    if (!selected || !dialog.open) return;
    const values = drafts.get(selected) || {};
    dialog.querySelectorAll("input[id], select[id]").forEach((field) => {
      const initial = field.options
        ? (
            [...field.options].find((o) => o.defaultSelected) ||
            field.options[0]
          )?.value
        : field.defaultValue;
      if (field.dataset.dirty === "true" || field.value !== initial)
        values[field.id] = field.value;
    });
    drafts.set(selected, values);
  }
  function restoreDrafts(id) {
    const values = drafts.get(id) || {};
    dialog.querySelectorAll("input[id], select[id]").forEach((field) => {
      if (
        Object.hasOwn(values, field.id) &&
        (!field.options ||
          [...field.options].some((o) => o.value === values[field.id]))
      ) {
        field.value = values[field.id];
        field.dataset.dirty = "true";
      }
    });
    const listing = dialog.querySelector("#listing-mode");
    if (listing)
      dialog.querySelector("#listing-help").textContent =
        NG.listingModes[listing.value].description;
  }
  // Small code-native pixel icons. Decorative SVGs never replace accessible names.
  function icon(name) {
    const shapes = {
      cash: "M7 1h2v2h3v2H6v2h5v2h2v4H9v2H7v-2H3v-2h8V9H5V7H3V3h4Z",
      garage:
        "M6 1h4v2h2v2h2v2h1v8H1V7h1V5h2V3h2Zm-3 6v6h2V8h6v5h2V7ZM7 10v3h2v-3Z",
      car: "M4 3h8v2h1v3h2v5h-2v2h-2v-2H5v2H3v-2H1V8h2V5h1Zm1 2v3h6V5ZM3 10v1h2v-1Zm8 0v1h2v-1Z",
      calendar:
        "M3 1h2v2h6V1h2v2h2v12H1V3h2Zm0 6v6h10V7Zm2 2h2v2H5Zm4 0h2v2H9Z",
      star: "M7 1h2v4h4v2h2v2h-4v4H9v2H7v-4H3V9H1V7h4V3h2Z",
      badge:
        "M5 1h6v2h2v2h2v6h-2v2h-2v2H5v-2H3v-2H1V5h2V3h2Zm0 4v6h6V5ZM7 7h2v2H7Z",
      point: "M2 1h12v2h1v10h-1v2H2v-2H1V3h1Zm5 3v3H4v2h3v3h2V9h3V7H9V4Z",
      dealer:
        "M1 2h14v12H1Zm2 2v8h10V4ZM4 5h3v3H4Zm-1 4h5v2H3Zm6-4h3v2H9Zm0 4h3v2H9Z",
      market:
        "M1 1h8v2h2v2h2v2h2v2l-6 6H7L1 9Zm2 2v5l5 5h1l4-4-5-6Zm1 1h2v2H4Z",
      deals:
        "M1 3h9V1h2v2h2v2h1v2h-3v2h-2V7H1Zm14 10H6v2H4v-2H2v-2H1V9h3V7h2v2h9Z",
      business:
        "M5 1h6v3h4v10H1V4h4Zm2 2v1h2V3ZM3 6v2h4V7h2v1h4V6Zm0 4v2h10v-2H9v1H7v-1Z",
    };
    return `<svg class="ui-icon icon-${name}" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="${shapes[name]}" fill="currentColor" /></svg>`;
  }
  function navigation(inDialog = false) {
    const entries = [
      ["garage", "Garage"],
      ["market", "Market"],
      ["inventory", "My Cars"],
      ["deals", "Deals"],
      ["upgrades", "Dealer"],
    ];
    const business = [
      ["operations", "Today", "today"],
      ["operations", "Staff", "staff"],
      ["operations", "Workshop", "workshop"],
      ["operations", "Buyer requests", "requests"],
      ["finances", "Finance"],
      ["customers", "Customers"],
      ["operations", "Expansions", "business"],
      ["upgrades", "Tools & marketing", "investments"],
      ["collection", "Collection"],
    ];
    return `<nav class="retro-nav ${inDialog ? "dialog-nav" : ""}" aria-label="${inDialog ? "Car window navigation" : "Game navigation"}">${entries.map(([key, label]) => `<button class="nav-button nav-icon-only" data-action="view" data-view="${key}" aria-label="${label}" ${view === key ? 'aria-current="page"' : ""}>${icon({ garage: "garage", market: "market", inventory: "car", deals: "deals", upgrades: "dealer" }[key])}<span class="game-nav-label">${label}</span></button>`).join("")}<details class="nav-more nav-business"><summary class="nav-icon-only" aria-label="Business" ${business.some(([key]) => view === key && key !== "upgrades") ? 'aria-current="page"' : ""}>${icon("business")}<span class="game-nav-label">Business</span></summary><div>${business.map(([key, label, tab]) => `<button data-action="view" data-view="${key}" ${tab ? `data-tab="${tab}"` : ""}>${label}</button>`).join("")}</div></details></nav>`;
  }
  // Native menus stay keyboard accessible and close without changing game state.
  document.addEventListener("click", (event) => {
    document
      .querySelectorAll(
        ".nav-business[open], .priority-more[open], .footer-tools[open]",
      )
      .forEach((menu) => {
        if (!menu.contains(event.target)) menu.open = false;
      });
  });
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape") return;
      const menu = [
        ...document.querySelectorAll(
          ".nav-business[open], .priority-more[open], .footer-tools[open]",
        ),
      ].find((menu) => menu.contains(document.activeElement));
      if (menu) {
        event.preventDefault();
        event.stopImmediatePropagation();
        menu.open = false;
        menu.querySelector("summary").focus();
      }
    },
    true,
  );
  function priorityItems() {
    const items = [],
      add = (key, text, detail, attrs, rank) =>
        items.push({ key, text, detail, attrs, rank });
    if (state.operations.arrears)
      add(
        "bill",
        "Payment overdue",
        NG.money(state.operations.arrears),
        'data-action="view" data-view="operations" data-tab="today"',
        0,
      );
    else if (state.cash < NG.knownDailyBills(state, state.day + 1))
      add(
        "bill",
        "Next bill at risk",
        NG.money(NG.knownDailyBills(state, state.day + 1)),
        'data-action="view" data-view="operations" data-tab="today"',
        0,
      );
    if (state.management.unpaid)
      add(
        "payroll",
        "Payment overdue",
        "Payroll " + NG.money(state.management.unpaid),
        'data-action="view" data-view="operations" data-tab="today"',
        0,
      );
    for (const c of state.inventory) {
      const offers = c.offers.filter(
        (o) =>
          c.listed &&
          !NG.busy(state, c) &&
          (o.expiresDay == null || o.expiresDay >= state.day),
      );
      const due = offers.filter(
          (o) => o.expiresDay == null || o.expiresDay === state.day,
        ),
        questions = offers.filter((o) => o.stage === "question");
      if (due.length)
        add(
          c.id,
          "Deal expires today",
          NG.model(c).name,
          `data-action="detail" data-id="${c.id}" data-tab="selling"`,
          0,
        );
      else if (questions.length)
        add(
          c.id,
          "Answer buyer",
          NG.model(c).name,
          `data-action="detail" data-id="${c.id}" data-tab="selling"`,
          1,
        );
      else if (offers.length)
        add(
          c.id,
          offers.some((o) => o.seen !== true)
            ? "Buyer offer received"
            : "Review buyer offer",
          NG.model(c).name,
          `data-action="detail" data-id="${c.id}" data-tab="selling"`,
          1,
        );
      if (!c.listed && c.readyDay > 0 && c.readyDay <= state.day)
        add(
          c.id + "-repair",
          "Repair completed",
          NG.model(c).name,
          `data-action="detail" data-id="${c.id}" data-tab="workshop"`,
          2,
        );
    }
    for (const c of state.market) {
      const n = c.negotiation;
      if (!n) continue;
      if (n.status === "callback")
        add(
          c.id,
          "Seller called back",
          NG.model(c).name,
          `data-action="detail" data-id="${c.id}" data-tab="negotiation"`,
          1,
        );
      else if (
        !n.walked &&
        (n.status === "agreed" || (!n.closed && n.status !== "waiting"))
      )
        add(
          c.id,
          n.status === "agreed" ? "Agreement ready" : "Continue negotiation",
          NG.model(c).name,
          `data-action="detail" data-id="${c.id}" data-tab="${n.status === "agreed" ? "deal" : "negotiation"}"`,
          n.agreedUntil === state.day ? 0 : 2,
        );
    }
    const requests = state.opportunities.requests.filter(
      (q) => q.status === "active" && q.deadline <= state.day + 1,
    );
    if (requests.length)
      add(
        "request",
        "Delivery due",
        requests.some((q) => q.deadline === state.day) ? "Today" : "Tomorrow",
        'data-action="view" data-view="operations" data-tab="requests"',
        0,
      );
    const invitations = state.opportunities.requests.filter(
      (q) => q.status === "offered" && q.offerUntil >= state.day,
    );
    if (invitations.length)
      add(
        "request-new",
        "New buyer request",
        invitations.length + " invitation(s)",
        'data-action="view" data-view="operations" data-tab="requests"',
        2,
      );
    const orders = state.enterprise.orders.filter(
      (j) => j.status === "offered" && j.deadline >= state.day,
    );
    if (orders.length)
      add(
        "orders",
        "Review client work",
        orders.length + " order(s)",
        'data-action="view" data-view="operations" data-tab="workshop"',
        2,
      );
    if (state.claims.some((q) => q.status === "open"))
      add(
        "claims",
        "Customer complaint",
        "Response needed",
        'data-action="view" data-view="customers"',
        0,
      );
    return items.sort((a, b) => a.rank - b.rank);
  }
  function priorities() {
    const items = priorityItems(),
      points = state.progress.points;
    if (!items.length && !points) return "";
    const notification = (item) =>
      `<button class="priority-item ${item.rank === 0 ? "urgent" : ""}" ${item.attrs}><b>${item.text}</b><small>${esc(item.detail)}</small></button>`;
    return `<section class="priorities" aria-label="Today's Priorities"><div>${items.slice(0, 4).map(notification).join("")}${items.length > 4 ? `<details class="priority-more"><summary>${items.length - 4} more</summary><div>${items.slice(4).map(notification).join("")}</div></details>` : ""}${points ? `<button class="progress-notice" data-action="view" data-view="upgrades"><span role="status">LEVEL ${state.progress.level} / ${points} skill point${points === 1 ? "" : "s"} available</span></button>` : ""}</div></section>`;
  }
  function deals() {
    return `${activeDeals()}<section class="deals-inbox"><h3>Buyer conversations</h3>${
      state.inventory
        .filter((c) => c.listed && c.offers.length && !NG.busy(state, c))
        .map(
          (c) =>
            `<article class="ops-task"><div><h3>${esc(NG.model(c).name)}</h3><small>${c.offers.map((o) => esc(o.buyer) + " / " + (o.stage === "question" ? "Question" : NG.money(o.price))).join(" · ")}</small></div><button data-action="detail" data-id="${c.id}" data-tab="selling">Open buyers</button></article>`,
        )
        .join("") ||
      '<p class="muted">No buyer conversations. List a car to attract buyers.</p>'
    }</section>`;
  }
  function switchView(next, tab, back = false) {
    rememberDrafts();
    const body = app.querySelector(".window-body");
    if (body) viewScroll.set(view, body.scrollTop);
    if (!back && next !== view)
      viewHistory.push({
        view,
        tab: view === "upgrades" ? dealerTab : operationsTab,
      });
    view = next;
    if (view === "operations") operationsTab = tab || "today";
    if (view === "upgrades") dealerTab = tab || "skills";
    dialog.close();
    if (document.querySelector("#day-confirm").open) cancelDayClosing();
    if (document.querySelector("#day-report").open) acknowledgeDayReport();
    selected = null;
    render();
    app.querySelector(".window-body")?.focus({ preventScroll: true });
    if (window.innerWidth <= 900)
      app.querySelector(".world-frame")?.scrollIntoView?.({ block: "start" });
  }
  function compactHelp(root) {
    root
      .querySelectorAll(
        "p.fine-print, .growth-card > p:not([class]), .rep-panel > p:not([class])",
      )
      .forEach((p) => {
        if (
          p.closest("details") ||
          p.classList.contains("negative") ||
          p.querySelector("button, input, select") ||
          p.textContent.trim().length < 125
        )
          return;
        const help = document.createElement("details");
        help.className = "inline-help";
        const summary = document.createElement("summary");
        summary.textContent = "How it works";
        p.replaceWith(help);
        help.append(summary, p);
      });
  }
  function progressionHUD() {
    const p = state.progress,
      tier = NG.repTier(state),
      next = NG.nextRepTier(state);
    const repMax = next ? next.at - tier.at : 1;
    return `<section class="driver-progress" aria-label="Dealer progression"><button class="hud-xp" data-action="view" data-view="upgrades" data-tab="skills"><span class="progress-label"><b>${icon("star")}<span>Level ${p.level}</span></b><span>${p.xp} / ${NG.xpNeeded(p.level)} XP</span></span><span class="hud-meter" role="progressbar" aria-label="Experience" aria-valuenow="${p.xp}" aria-valuemin="0" aria-valuemax="${NG.xpNeeded(p.level)}"><i style="width:${Math.min(100, (p.xp / NG.xpNeeded(p.level)) * 100)}%"></i></span><small class="${p.points ? "skill-ready" : ""}">${p.points ? `${icon("point")}${p.points} skill point${p.points === 1 ? "" : "s"} available` : "Next level: +1 skill point"}</small></button><button class="hud-rep" data-action="view" data-view="upgrades" data-tab="reputation"><span class="progress-label"><b>${icon("badge")}<span>${tier.name}</span></b><span>${state.reputation} REP</span></span><span class="hud-meter" role="progressbar" aria-label="Reputation milestone" aria-valuenow="${next ? state.reputation - tier.at : 1}" aria-valuemin="0" aria-valuemax="${repMax}"><i style="width:${next ? Math.min(100, ((state.reputation - tier.at) / repMax) * 100) : 100}%"></i></span><small>${next ? `${next.at - state.reputation} REP to ${next.name}` : "Top rank: +18 pp buyer interest"}</small></button></section>`;
  }
  function hud(inDialog = false) {
    return `<header class="game-hud ${inDialog ? "modal-hud" : ""}">${inDialog ? "" : `<div class="game-logo"><span class="logo-mark">NG</span><h1>NEON GARAGE <b>'93</b></h1></div>`}<section class="stats" aria-label="Dealership status"><div><span class="hud-symbol" title="Cash">${icon("cash")}<span class="sr-only">Cash</span></span><strong>${NG.money(state.cash)}</strong></div><div><span class="hud-symbol" title="Garage capacity">${icon("garage")}<span class="sr-only">Garage capacity</span></span><strong>${state.inventory.length}<em> / ${state.capacity}</em></strong></div></section>${progressionHUD()}<div class="hud-day"><span class="hud-date">${icon("calendar")}<span>${NG.date(state.day)}</span></span>${inDialog ? "" : '<button class="primary" data-action="next">Next Day &gt;</button>'}</div></header>`;
  }
  function garageGuide() {
    if (view !== "garage" || priorityItems().some((i) => i.rank === 0))
      return "";
    if (!state.inventory.length)
      return `<aside class="garage-guide"><span class="eyebrow">${state.sold ? "YOUR NEXT DEAL" : "WELCOME TO SILVER PALMS"}</span><h2>${state.sold ? "Make room for a new story." : "Two bays. Your first big break."}</h2><p>Buy smart, repair what matters, sell for a profit.</p><button class="primary" data-action="view" data-view="market">Find ${state.sold ? "your next" : "your first"} car ↗</button><details><summary>Dealer's quick guide</summary><p>Call a seller and negotiate. Inspect before committing, then list your car and advance the day for buyers.</p><p><b>✦ XP:</b> close a negotiated deal with a price advantage to earn experience. Each level gives one skill point.</p><p><b>◆ Reputation:</b> honest sales build trust, attract buyers and help unlock credit and expansions. Complaints can hurt it.</p></details></aside>`;
    const ready = state.inventory.find((c) => !c.listed && !NG.busy(state, c));
    if (ready)
      return `<aside class="garage-guide compact"><span class="eyebrow">NEXT MOVE</span><h2>Get your car ready for its next owner.</h2><p>Inspect and repair if needed, then choose your asking price.</p><button class="primary" data-action="detail" data-id="${ready.id}" data-tab="selling">Review ${esc(NG.model(ready).name)} ↗</button></aside>`;
    return "";
  }
  function render() {
    const names = {
      market: "CAR MARKET",
      inventory: "MY INVENTORY",
      deals: "ACTIVE DEALS",
      finances: "FINANCES",
      upgrades: "DEALER FILE",
      collection: "CAR COLLECTION",
      customers: "CUSTOMERS",
      operations: "OPERATIONS",
    };
    const alerts = priorities();
    app.innerHTML = `<div class="game-shell ${alerts ? "has-alerts" : ""}">${hud()}${navigation()}${alerts}${NG.storageError ? '<div class="storage-warning">Your browser is blocking saves. Enable local storage to keep your progress.</div>' : ""}${state.practice ? `<div class="case-banner"><span>PRACTICE ${esc(state.practice)} / SEPARATE SAVE</span><a href="?">Return to your dealership</a></div>` : ""}<main class="world-frame">${NG.garageScene(state, arrival)}${garageGuide()}${view !== "garage" ? `<section class="desk-window" aria-label="${names[view]}" data-window-view="${view}"><header class="window-title"><span><i></i> ${names[view]}</span><button data-action="view" data-view="garage" aria-label="Back to garage">&times;</button></header><div class="window-body" tabindex="-1"><div class="section-heading"><div><span class="eyebrow">NEON GARAGE / ${names[view]}</span><h2>${view === "market" ? "Car market" : view === "deals" ? "Deals" : view === "inventory" ? "Your cars" : view === "upgrades" ? "Dealer file" : view === "collection" ? "Car collection" : view === "customers" ? "Customers" : view === "operations" ? "Operations" : "Finances"}</h2></div><button class="text-button" data-action="view-back">&lt; BACK</button></div>${view === "market" ? market() : view === "deals" ? deals() : view === "inventory" ? inventory() : view === "upgrades" ? growth() : view === "collection" ? album() : view === "customers" ? customers() : view === "operations" ? operations() : finances()}</div></section>` : ""}</main><footer class="game-footer">${radioConsole()}<details class="radio-news"><summary><span>MARKET WIRE</span><strong>${esc(state.event.title)}</strong></summary><p>${esc(state.event.text)}</p></details><div class="footer-controls"><span>${NG.storageError ? "SAVING UNAVAILABLE" : "AUTO-SAVED"}</span>${state.dayReport ? '<button data-action="show-day-report">DAY REPORT</button>' : ""}<details class="footer-tools"><summary>Options</summary><div><button data-action="reset">NEW GAME</button><small>v0.13.0 / RUN THE LOT</small><span class="practice-links">Practice: <a href="?scenario=A">A / Moving seller</a> · <a href="?scenario=B">B / Suspicious car</a> · <a href="?scenario=C">C / Slow stock</a></span></div></details></div></footer></div>`;
    compactHelp(app);
    updateLayout();
    const body = app.querySelector(".window-body");
    if (body) body.scrollTop = viewScroll.get(view) || 0;
    arrival = null;
  }
  function updateLayout() {
    const world = app.querySelector(".world-frame");
    document.documentElement.style.setProperty(
      "--hud-height",
      Math.ceil(app.querySelector(".game-hud").getBoundingClientRect().height) +
        "px",
    );
    document.documentElement.style.setProperty(
      "--nav-height",
      Math.ceil(
        app.querySelector(".retro-nav").getBoundingClientRect().height,
      ) + "px",
    );
    if (world)
      document.documentElement.style.setProperty(
        "--window-top",
        Math.ceil(world.getBoundingClientRect().top + window.scrollY) + "px",
      );
  }
  window.addEventListener("resize", updateLayout);
  function event() {
    return `<section class="event"><div class="event-icon">↗</div><div><span class="eyebrow">AROUND TOWN TODAY / ${state.event.kind === "start" ? "JUNE 1" : "MARKET NEWS"}</span><h3>${state.event.title}</h3><p>${state.event.text}</p></div><span class="event-frequency">THE DAILY<br><b>PALMS</b></span></section>`;
  }
  function market() {
    let cars = state.market.filter(
      (c) => filter === "all" || NG.model(c).segment === filter,
    );
    if (sort === "default")
      cars.sort((a, b) => b.listing.createdDay - a.listing.createdDay);
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
      )}</select></div></div><div class="car-grid">${cars.map((c) => card(c)).join("")}</div><p class="fine-print">Estimates are uncertain. Listings and buyer deadlines persist.</p>`;
  }
  function activeDeals() {
    const deals = state.market.filter((c) => c.negotiation);
    return deals.length
      ? `<section class="trend-board"><h3>Active deals / saved calls</h3><div class="actions">${deals.map((c) => `<button data-action="detail" data-id="${c.id}">${esc(NG.model(c).name)} / ${esc(c.negotiation.status || "saved")}</button>`).join("")}</div></section>`
      : "";
  }
  function inventory() {
    return `<div class="section-heading"><h2>In stock <span>${state.inventory.length} cars</span></h2><span class="muted">Select a car to trade.</span></div><div class="car-grid">${state.inventory.map((c) => card(c, true)).join("") || '<div class="empty-state"><span>▱</span><h2>Your lot is empty.</h2><p>Your first good deal is waiting at the market.</p><button class="primary" data-action="view" data-view="market">Open car market →</button></div>'}</div>${state.inventory.length ? '<div class="starter-tip"><span>LISTING AND SELLING</span><p>Set a price. Close the day. Review buyers.</p></div>' : ""}`;
  }
  function finances() {
    const total = state.inventory.reduce(
        (n, c) => n + NG.value(state, c) * 0.72,
        0,
      ),
      expense = state.ledger
        .filter((l) => l.amount < 0)
        .reduce((n, l) => n - l.amount, 0);
    const e = NG.economics(state);
    return `<div class="finance-overview">${opsMetrics([
      ["Cash", NG.money(state.cash)],
      ["Next bill", NG.money(NG.knownDailyBills(state, state.day + 1))],
      ["Cash runway", NG.cashRunway(state) + " days"],
    ])}</div>${businessCredit()}<details class="finance-history"><summary>7-day business result & payroll</summary>${NG.managementFinanceUI(state)}</details><div class="finance-summary"><div><span>CASH</span><strong>${NG.money(e.cash)}</strong></div><div><span>STOCK / EST. EXIT</span><strong>${NG.money(e.inventory)}</strong></div><div><span>NET WORTH</span><strong>${NG.money(e.netWorth)}</strong></div></div><details class="finance-history"><summary>Capital and costs</summary><div class="trend-grid">${[
      ["CASH", e.cash],
      ["INVENTORY / EST. DEALER EXIT", e.inventory],
      ["STOCK ACQUISITION", e.acquisition],
      ["STOCK REPAIRS", e.repairs],
      ["STOCK TRANSFERS", e.transfers],
      ["STOCK HOLDING / ACCRUED", e.holding],
      ["SHARED BILLS / PAID", e.overhead],
      ["FINANCING INTEREST / PAID", e.interest],
      ["BUSINESS CASH FLOW", e.cashFlow],
    ]
      .map(
        ([label, n]) =>
          `<div><span>${label}</span><strong>${signed(n)}</strong></div>`,
      )
      .join(
        "",
      )}</div><p class="fine-print">Purchase cash becomes inventory, not an immediate loss. Sale contribution deducts acquisition, inspections, repairs, transfers and accrued holding once. Shared bills and financing stay separate. Inventory exit value is an estimate.</p></details><div class="finance-summary"><div><span>TOTAL SALES REVENUE</span><strong>${NG.money(state.sales.reduce((n, s) => n + s.price, 0))}</strong></div><div><span>TOTAL SPENDING</span><strong>${NG.money(expense)}</strong></div><div><span>REALIZED MARGIN</span><strong>${signed(NG.totalMargin(state))}</strong><small>Before shared bills and interest</small></div></div><details class="finance-history"><summary>Business over time</summary>${NG.financeChart(state)}</details><div class="section-heading"><h2>Completed deals</h2></div>${state.sales.length ? `<div class="table-wrap"><table><thead><tr><th>Car / date</th><th>Total invested</th><th>Sale</th><th>Customer care</th><th>Profit</th></tr></thead><tbody>${state.sales.map((s) => `<tr><td>${s.name}<small>${NG.date(s.day)}${s.requestId ? " / BUYER REQUEST" : ""}</small></td><td>${NG.money(s.cost)}</td><td>${NG.money(s.price)}</td><td>${NG.money(s.refundCost || 0)}</td><td class="${s.profit >= 0 ? "positive" : "negative"}">${signed(s.profit)}</td></tr>`).join("")}</tbody></table></div>` : '<div class="ledger-empty">No completed deals yet. Each car’s total investment and profit will appear here.</div>'}<details class="finance-history"><summary>Transactions (${state.ledger.length})</summary><div class="ledger">${state.ledger.map((l) => `<div><span>${l.description}<small>${NG.date(l.day)}</small></span><strong class="${l.amount > 0 ? "positive" : ""}">${signed(l.amount)}</strong></div>`).join("") || '<p class="muted">Starting capital: $5,000. No transactions yet.</p>'}</div></details><p class="fine-print">Realized contribution = sale price - acquisition - inspections - repairs - transfer - accrued holding - customer repair contributions. Repair contributions reduce the original sale profit. Inspections of cars you do not buy, business upgrades and daily advertising are separate expenses. They reduce cash and net worth, not per-car profit.</p>`;
  }
  function trendBoard() {
    const t = state.marketTrends,
      prior = t.history.length > 1 ? t.history.at(-2) : state.demand;
    return `<section class="trend-board"><div class="section-heading"><h2>Moving markets</h2><small>Demand shifts over weeks, with small daily uncertainty.</small></div><div class="trend-grid">${[
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
      )}</div>${state.progress.trendSpotter ? `<p class="forecast">TREND SPOTTER / next wave: ${t.next.segment.toUpperCase()}, ${Math.round(t.next.multiplier * 100)}% demand target for ${t.next.duration} day(s), with gradual adjustment and small daily noise.</p>` : '<p class="fine-print">Buy before a rise, sell before a fall. Trend Spotter reveals the next planned wave; ordinary estimates do not guarantee a profit.</p>'}</section>`;
  }
  function opportunityBanner() {
    const o = state.opportunities,
      offers = o.requests.filter((q) => q.status === "offered"),
      active = o.requests.filter((q) => q.status === "active"),
      legacy = o.events.filter((e) => e.status === "pending");
    if (!offers.length && !active.length && !legacy.length) return "";
    const deadlines = [
      ...offers.map((q) => q.offerUntil),
      ...active.map((q) => q.deadline),
      ...legacy.map((e) => e.deadline),
    ];
    return `<div class="offer-notification local-notification" role="status"><div><strong>REQUESTS / ${offers.length} NEW / ${active.length} ACTIVE</strong><small>Next deadline ${NG.date(Math.min(...deadlines))}</small></div><button data-action="view" data-view="operations" data-tab="requests">Review requests</button></div>`;
  }
  function localBoard() {
    const o = state.opportunities,
      requests = o.requests.filter((q) =>
        ["offered", "active"].includes(q.status),
      );
    const events = o.events.filter(
      (e) =>
        ["pending", "accepted"].includes(e.status) &&
        (e.status !== "accepted" ||
          (e.until >= state.day && (e.uses == null || e.uses > 0))),
    );
    return `<section class="local-board" aria-label="Buyer requests"><h3>Buyer requests</h3><div class="ops-cards">${
      requests
        .map((q) => {
          const t = NG.requestKinds.find((t) => t.id === q.kind),
            cars = state.inventory.filter((c) => NG.requestMatch(state, q, c));
          return `<article class="growth-card local-card"><span class="eyebrow">${q.status === "offered" ? "REPLY BY " + NG.date(q.offerUntil) : "DELIVER BY " + NG.date(q.deadline)}</span><h3>${esc(t.title)}</h3><div class="ops-chips"><span>${t.segment.toUpperCase()}</span><span>${t.shapes.join(" / ")}</span><span>≥ ${t.condition}% condition</span><span>≤ ${t.mileage.toLocaleString("en-US")} miles</span></div>${opsMetrics(
            [
              ["Payout", NG.money(t.budget + t.bonus), "positive"],
              ["Bonus included", NG.money(t.bonus)],
              ["Delivery", `${t.days} days`],
            ],
          )}<small>Inspected / no faults / repairs complete</small>${q.status === "offered" ? `<div class="actions"><button class="primary" data-action="request-accept" data-id="${q.id}" ${o.requests.filter((q) => q.status === "active").length >= 2 ? "disabled" : ""}>Accept request</button><button data-action="request-decline" data-id="${q.id}">Decline / free</button></div>` : `${NG.progressBar("DELIVERY WINDOW", q.deadline - state.day, t.days, q.deadline === state.day ? "LAST DAY" : q.deadline - state.day + " days left")}${cars.map((c) => `<div class="request-delivery"><b>${esc(NG.model(c).name)}</b><small>Investment ${NG.money(NG.cost(c))} / margin ${signed(t.budget + t.bonus - NG.cost(c))}</small><button class="primary" data-action="request-deliver" data-id="${q.id}" data-car="${c.id}">Deliver ${esc(NG.model(c).name)} / ${NG.money(t.budget + t.bonus)}</button></div>`).join("") || '<p class="muted">No ready matching car.</p>'}<button data-action="view" data-view="market">Search market</button><details><summary>Cancel commitment / -1 REP</summary><button data-action="request-abandon" data-id="${q.id}">Abandon / -1 REP</button></details>`}<small>Completed +3 REP / late delivery -1 REP</small></article>`;
        })
        .join("") ||
      '<div class="ops-clear"><b>No buyer requests today.</b><p>New invitations arrive occasionally.</p></div>'
    }</div>${
      events.length
        ? `<details class="legacy-benefits"><summary>Earlier invitations & benefits (${events.length})</summary><div class="ops-cards">${events
            .map((e) => {
              const t = NG.localEvents.find((t) => t.id === e.kind);
              return `<article class="growth-card"><span class="eyebrow">${e.status === "pending" ? "DECIDE BY " + NG.date(e.deadline) : "ACTIVE THROUGH " + NG.date(e.until)}</span><h3>${esc(t.title)}</h3><p>${esc(t.benefit)}</p>${e.uses != null ? `<small>${e.uses} discounted repairs left</small>` : ""}${e.status === "pending" ? `<div class="actions"><button class="primary" data-action="local-accept" data-id="${e.id}" ${state.cash < t.cost || state.operations.arrears || (t.blocks && NG.workshopBusy(state)) ? "disabled" : ""}>Accept / ${NG.money(t.cost)}</button><button data-action="local-decline" data-id="${e.id}">Decline / free</button></div>` : ""}</article>`;
            })
            .join("")}</div></details>`
        : ""
    }<details class="inline-help"><summary>Request rules & history</summary><p>No deposit. Declining is free. Accepted requests: deliver one matching car on time or lose 1 REP. Payout includes the completion bonus; no negotiation XP.</p><ul>${
      o.requests
        .filter((q) => !["offered", "active"].includes(q.status))
        .slice(-8)
        .map(
          (q) =>
            `<li>${NG.requestKinds.find((t) => t.id === q.kind).title} / ${q.status}</li>`,
        )
        .join("") || "<li>No completed requests.</li>"
    }</ul></details></section>`;
  }

  function enterpriseBanner() {
    const offered = state.enterprise.orders.filter(
      (j) => j.status === "offered",
    );
    if (!offered.length) return "";
    return `<div class="offer-notification" role="status"><div><strong>NEW CLIENT WORK / ${offered.length} ORDER(S)</strong><small>Parts advance + workshop slot required.</small></div><button data-action="view" data-view="operations" data-tab="workshop">Review work</button></div>`;
  }
  function opsMetrics(items) {
    return `<div class="ops-metrics">${items.map(([label, value, tone = ""]) => `<div><small>${label}</small><strong class="${tone}">${value}</strong></div>`).join("")}</div>`;
  }
  function opsTabButton(tab, label, count = 0) {
    return `<button data-action="ops-tab" data-tab="${tab}" role="tab" tabindex="${operationsTab === tab ? 0 : -1}" id="ops-tab-${tab}" aria-controls="ops-content" aria-selected="${operationsTab === tab}">${label}${count ? ` <b>${count}</b>` : ""}</button>`;
  }
  function operationsToday() {
    const o = state.operations,
      e = state.enterprise,
      r = state.opportunities.requests;
    const tasks = [];
    if (o.arrears)
      tasks.push(
        `<article class="ops-task"><div><span class="negative">OVERDUE</span><h3>${NG.money(o.arrears)} unpaid</h3><small>Purchases and repairs blocked</small></div><button class="primary" data-action="pay-bills" ${!state.cash ? "disabled" : ""}>Pay ${NG.money(Math.min(o.arrears, state.cash))}</button></article>`,
      );
    if (!o.arrears && state.cash < NG.knownDailyBills(state, state.day + 1))
      tasks.push(
        `<article class="ops-task"><div><span class="negative">LOW CASH</span><h3>Next bill ${NG.money(NG.knownDailyBills(state, state.day + 1))}</h3><small>Short ${NG.money(NG.knownDailyBills(state, state.day + 1) - state.cash)}</small></div><button data-action="view" data-view="inventory">Raise cash</button></article>`,
      );
    const active = r.filter((q) => q.status === "active"),
      offered = r.filter((q) => q.status === "offered");
    if (active.length)
      tasks.push(
        `<article class="ops-task"><div><span>DELIVERY DUE</span><h3>${active.length} buyer request${active.length === 1 ? "" : "s"}</h3><small>Next deadline ${NG.date(Math.min(...active.map((q) => q.deadline)))}</small></div><button data-action="ops-tab" data-tab="requests">Review deliveries</button></article>`,
      );
    if (offered.length)
      tasks.push(
        `<article class="ops-task"><div><span>NEW REQUEST</span><h3>${offered.length} buyer invitation${offered.length === 1 ? "" : "s"}</h3><small>Reply by ${NG.date(Math.min(...offered.map((q) => q.offerUntil)))}</small></div><button data-action="ops-tab" data-tab="requests">View request</button></article>`,
      );
    const orders = e.orders.filter((j) => j.status === "offered");
    if (orders.length)
      tasks.push(
        `<article class="ops-task"><div><span>CLIENT WORK</span><h3>${orders.length} new work order${orders.length === 1 ? "" : "s"}</h3><small>Reply by ${NG.date(Math.min(...orders.map((j) => j.deadline)))}</small></div><button data-action="ops-tab" data-tab="workshop">Review work</button></article>`,
      );
    const jobs =
      state.inventory.filter((c) => NG.busy(state, c)).length +
      e.orders.filter((j) => j.status === "running").length;
    if (jobs)
      tasks.push(
        `<article class="ops-task"><div><span>IN PROGRESS</span><h3>${jobs} workshop job${jobs === 1 ? "" : "s"}</h3></div><button data-action="ops-tab" data-tab="workshop">View schedule</button></article>`,
      );
    for (const t of NG.enterpriseProjects) {
      const p = e.projects[t.id];
      if (p?.status === "building")
        tasks.push(
          `<article class="ops-task"><div><span>CONSTRUCTION</span><h3>${t.name}</h3><small>Opens ${NG.date(p.readyDay)}</small></div><button data-action="ops-tab" data-tab="business">View business</button></article>`,
        );
    }
    const legacy = state.opportunities.events.filter(
      (x) => x.status === "pending",
    );
    if (legacy.length)
      tasks.push(
        `<article class="ops-task"><div><span>EARLIER INVITATION</span><h3>${legacy.length} pending</h3></div><button data-action="ops-tab" data-tab="requests">Review</button></article>`,
      );
    return `<div class="ops-tasks">${tasks.join("") || `<div class="ops-clear"><b>${state.inventory.length ? "You're ready for the next move." : "Your first deal starts at the market."}</b><p>${state.inventory.length ? "No urgent commitments. Review your cars or close the day." : "Find a car, talk to the seller and leave some cash for repairs."}</p><button class="primary" data-action="view" data-view="${state.inventory.length ? "inventory" : "market"}">${state.inventory.length ? "Review my cars" : "Find a car"}</button></div>`}</div><details class="daily-capacity" ${state.management.unpaid || NG.managementSummary(state).reserve < 0 ? "open" : ""}><summary>Your time & team / ${8 - state.management.ownerUsed} hours left</summary>${NG.managementTodayUI(state)}</details>`;
  }
  function operationsWorkshop() {
    const e = state.enterprise,
      jobs = state.inventory.filter((c) => NG.busy(state, c));
    return `${NG.managementWorkUI(state)}<section class="enterprise-panel"><h3>Workshop schedule <span class="tag">${NG.workshopBusy(state)} / ${NG.workshopCapacity(state)} slots</span></h3>${NG.localWorkshopBlocked(state) ? '<p class="negative">In-house bookings blocked today. Rush work available.</p>' : ""}<div class="ops-tasks">${jobs.map((c) => `<article class="ops-task"><div><span>${c.repairMode === "rush" ? "OUTSOURCED RUSH" : "STOCK REPAIR"}</span><h3>${esc(NG.model(c).name)}</h3><small>${esc(NG.workerName(state, c.assignedWorker))} / Ready ${NG.date(c.readyDay)} / repairs ${NG.money(c.repairCost)}</small></div><button data-action="detail" data-id="${c.id}">View car</button></article>`).join("")}</div><h3>Client workshop / shared capacity ${NG.workshopBusy(state)} / ${NG.workshopCapacity(state)}</h3><div class="ops-cards">${
      e.orders
        .filter((j) => ["offered", "running"].includes(j.status))
        .map((j) => {
          const reason = !NG.enterpriseActive(state, "service")
            ? "Open Service Center"
            : j.tier === 2 && !NG.enterpriseActive(state, "fleet")
              ? "Open Fleet Workshop"
              : state.operations.arrears
                ? "Clear overdue bills"
                : state.cash < j.cost
                  ? "Not enough cash"
                  : NG.workshopBusy(state) >= NG.workshopCapacity(state)
                    ? "Workshop full"
                    : NG.localWorkshopBlocked(state)
                      ? "Bookings blocked today"
                      : "";
          return `<article class="growth-card"><span class="eyebrow">${j.status === "offered" ? "REPLY BY " + NG.date(j.deadline) : "READY " + NG.date(j.readyDay)}</span><h3>${esc(j.name)}</h3>${opsMetrics(
            [
              ["Pay now", NG.money(j.cost)],
              ["Invoice", NG.money(j.revenue)],
              ["Margin", NG.money(j.revenue - j.cost), "positive"],
            ],
          )}<small>${j.days} days / 1 shared slot / ${esc(NG.workerName(state, j.assignedWorker))} / margin before overhead</small>${j.status === "offered" ? `<div class="actions"><button class="primary" data-action="enterprise-order" data-id="${j.id}" ${reason ? "disabled" : ""}>Accept / ${NG.money(j.cost)}</button><button data-action="enterprise-decline" data-id="${j.id}">Decline</button></div>${reason ? `<small class="negative">${reason}</small>` : ""}` : NG.progressBar("WORK IN PROGRESS", state.day - j.started, j.days, NG.date(j.readyDay))}</article>`;
        })
        .join("") ||
      `<p class="muted">${NG.enterpriseActive(state, "service") ? "No client work waiting." : "Open a Service Center for client work."}</p>`
    }</div><details class="inline-help"><summary>Workshop rules</summary><p>Client work and stock repairs share slots. Parts are paid upfront; invoices arrive on completion. Staff costs continue between jobs. Rush repairs use no in-house slot.</p></details></section>`;
  }
  function businessCredit() {
    const e = state.enterprise;
    return `<article class="growth-card"><h3>Business credit</h3>${opsMetrics([
      ["Principal", NG.money(e.loan)],
      ["Limit", NG.money(NG.enterpriseLoanLimit(state))],
      ["Interest / day", NG.money(Math.round((e.loan * 0.02) / 7))],
    ])}<div class="actions"><button data-action="enterprise-borrow" ${e.loan + 10000 > NG.enterpriseLoanLimit(state) ? "disabled" : ""}>Borrow $10,000</button><button data-action="enterprise-repay" ${!e.loan || state.cash < Math.min(10000, e.loan) ? "disabled" : ""}>Repay ${NG.money(Math.min(10000, e.loan))}</button></div><small>2% per week. Borrowing adds debt, not profit.</small></article><p class="fine-print">${state.reputation < 10 ? "Reach 10 REP for a $10,000 limit; 25 REP for $50,000." : state.reputation < 25 ? "Reach 25 REP for a $50,000 limit." : "Highest credit tier reached."}</p>`;
  }
  function operationsBusiness() {
    const e = state.enterprise;
    return `<section class="enterprise-panel"><div class="garage-investment-link"><div><b>Make your current garage work harder.</b><small>Tools, inspections and marketing - one-time investments from $450.</small></div><button data-action="view" data-view="upgrades" data-tab="investments">Garage upgrades ↗</button></div><div class="enterprise-projects">${NG.enterpriseProjects
      .slice()
      .sort((a, b) => {
        const score = (t) =>
          e.projects[t.id]
            ? 0
            : !state.operations.arrears &&
                state.cash >= t.cost &&
                state.reputation >= t.rep &&
                (!t.requires || NG.enterpriseActive(state, t.requires)) &&
                !Object.values(e.projects).some((x) => x.status === "building")
              ? 1
              : 2;
        return score(a) - score(b);
      })
      .map((t) => {
        const p = e.projects[t.id];
        const missing = [
            state.operations.arrears ? "Clear overdue bills" : "",
            state.cash < t.cost
              ? `${NG.money(t.cost - state.cash)} more cash`
              : "",
            state.reputation < t.rep
              ? `${t.rep - state.reputation} more REP (requires ${t.rep})`
              : "",
            t.requires && !NG.enterpriseActive(state, t.requires)
              ? "Open Service Center"
              : "",
            Object.values(e.projects).some((x) => x.status === "building")
              ? "Finish current construction"
              : "",
          ].filter(Boolean),
          reason = missing.join(" / ");
        const effect = {
          service: "2 shared workshop slots + client work",
          fleet: "3 shared slots + fleet contracts",
          wholesale: "2 wholesale allocations",
        }[t.id];
        return `<article class="growth-card expansion-card ${!p && reason ? "expansion-locked" : ""}"><span class="eyebrow">${p ? p.status.toUpperCase() : reason ? "LOCKED EXPANSION" : "READY TO BUILD"}</span><h3>${t.name}</h3><p class="ops-effect">${effect}</p>${!p && reason ? `<p class="unlock-checklist">${missing.map((x) => `<span>◇ ${esc(x)}</span>`).join("")}</p>` : ""}${opsMetrics(
          [
            ["Investment", NG.money(t.cost)],
            [
              "Daily cost",
              NG.money(
                p?.status === "paused" ? Math.ceil(t.daily * 0.25) : t.daily,
              ),
            ],
            p
              ? [
                  p.status === "building" ? "Ready in" : "Status",
                  p.status === "building"
                    ? `${Math.max(0, p.readyDay - state.day)} days`
                    : p.status === "active"
                      ? "Open"
                      : "Paused",
                ]
              : ["Build time", `${t.days} days`],
          ],
        )}${p?.status === "building" ? NG.progressBar("CONSTRUCTION", state.day - p.started, t.days, "OPENS " + NG.date(p.readyDay)) : ""}${!p ? `<small class="expansion-terms">${NG.money(t.daily)} / day · ${t.days} days to build${!reason ? " · requires " + t.rep + " REP" : ""}</small><details><summary>Review investment / ${NG.money(t.cost)}</summary><p>${esc(t.description)}</p><p>Cash after purchase: ${signed(state.cash - t.cost)}. Added 7-day cost: ${NG.money(t.daily * 7)}. No automatic revenue. Cancel construction: 50% back; open facility: 40%.</p><button class="primary" data-action="enterprise-build" data-id="${t.id}" ${reason ? "disabled" : ""}>Invest ${NG.money(t.cost)}</button></details>` : `<div class="actions">${p.status === "active" ? `<button data-action="enterprise-pause" data-id="${t.id}">Pause / ${NG.money(Math.ceil(t.daily * 0.25))} per day</button>` : p.status === "paused" ? `<button data-action="enterprise-resume" data-id="${t.id}">Reopen / ${NG.money(t.daily)} per day</button>` : ""}<details><summary>${p.status === "building" ? "Cancel construction" : "Sell facility"}</summary><p>Recover ${NG.money(t.cost * (p.status === "building" ? 0.5 : 0.4))}. Finish outstanding work and dependent expansions first.</p><button class="danger" data-action="enterprise-sell" data-id="${t.id}">Confirm liquidation / ${NG.money(t.cost * (p.status === "building" ? 0.5 : 0.4))}</button></details></div>`}</article>`;
      })
      .join(
        "",
      )}</div><details class="wholesale-desk" ${NG.enterpriseActive(state, "wholesale") ? "open" : ""}><summary>Wholesale trading ${NG.enterpriseActive(state, "wholesale") ? "/ desk open" : "/ open a Trading Desk to begin"}</summary><article class="growth-card"><h3>Wholesale allocations <span class="tag">${e.lots.filter((l) => l.status === "running").length} / 2</span></h3><p class="negative">Capital at risk / 5 days locked / no early exit</p><label for="wholesale-segment">Market</label><select id="wholesale-segment"><option value="japan">Japan</option><option value="europe">Europe</option><option value="america">America</option></select><details><summary>Review capital commitment</summary><p>$25k: return $15k-$37.5k. $50k: $30k-$75k. Demand and saved execution affect the result; desk costs are extra.</p><div class="actions">${[25000, 50000].map((cost) => `<button class="primary" data-action="enterprise-wholesale" data-cost="${cost}" ${!NG.enterpriseActive(state, "wholesale") || state.cash < cost || state.operations.arrears || e.lots.filter((l) => l.status === "running").length >= 2 ? "disabled" : ""}>Commit ${NG.money(cost)}</button>`).join("")}</div></details></article></details><div class="ledger">${e.lots
      .slice()
      .reverse()
      .map(
        (l) =>
          `<div><span>${l.segment.toUpperCase()} / ${l.status.toUpperCase()}<small>${NG.money(l.cost)} / ${l.status === "running" ? NG.date(l.readyDay) : "return " + NG.money(l.revenue)}</small></span><strong>${l.status === "running" ? "LOCKED" : signed(l.revenue - l.cost)}</strong></div>`,
      )
      .join("")}</div></section>`;
  }
  function operations() {
    const pending = state.opportunities.requests.filter((q) =>
      ["offered", "active"].includes(q.status),
    ).length;
    const work =
      state.enterprise.orders.filter((j) =>
        ["offered", "running"].includes(j.status),
      ).length + state.inventory.filter((c) => NG.busy(state, c)).length;
    return `<div class="operations-console"><div class="ops-tabs" role="tablist" aria-label="Operations sections">${opsTabButton("today", "Today")}${opsTabButton("staff", "Staff", state.management.staff.length)}${opsTabButton("workshop", "Workshop", work)}${opsTabButton("requests", "Requests", pending)}${opsTabButton("business", "Expansions")}</div><div class="ops-bill-strip">${opsMetrics(
      [
        ["Next bill", NG.money(NG.knownDailyBills(state, state.day + 1))],
        ["Cash runway", `${NG.cashRunway(state)} days`],
        [
          "Overdue",
          NG.money(state.operations.arrears),
          state.operations.arrears ? "negative" : "positive",
        ],
      ],
    )}<button data-action="view" data-view="finances">Finance & credit ↗</button></div><section id="ops-content" role="tabpanel" aria-labelledby="ops-tab-${operationsTab}">${operationsTab === "today" ? operationsToday() : operationsTab === "staff" ? NG.managementStaffUI(state) : operationsTab === "workshop" ? operationsWorkshop() : operationsTab === "requests" ? localBoard() : operationsBusiness()}</section></div>`;
  }

  function skillLane(skill, name, effect, perk, perkName, perkEffect) {
    const p = state.progress,
      rank = p[skill];
    const action =
      skill === "negotiation"
        ? 'data-action="train-negotiation"'
        : `data-action="train-skill" data-skill="${skill}"`;
    const perkAction =
      perk === "oneMoreShot"
        ? 'data-action="unlock-perk"'
        : `data-action="specialist-perk" data-perk="${perk}"`;
    return `<article class="skill-lane"><div class="growth-card"><span class="eyebrow">SKILL / RANK ${rank} OF 3</span><h3>${name}</h3>${NG.progressBar(name.toUpperCase(), rank, 3)}<p class="skill-effect">${effect}</p><button class="primary" ${action} ${p.points < 1 || rank >= 3 ? "disabled" : ""}>${rank >= 3 ? "MAXIMUM RANK" : skill === "negotiation" ? "Train Negotiation / 1 point" : "Train / 1 point"}</button></div><details><summary>Perk: ${perkName} / ${p[perk] ? "active" : "rank 2"}</summary><div class="growth-card"><span class="eyebrow">${p[perk] ? "UNLOCKED" : name.toUpperCase() + " RANK 2 REQUIRED"}</span><h3>${perkName}</h3><p>${perkEffect}</p><button class="primary" ${perkAction} ${p[perk] || rank < 2 || p.points < 1 ? "disabled" : ""}>${p[perk] ? "PERK ACTIVE" : "Unlock / 1 point"}</button></div></details></article>`;
  }
  function garageUpgrades() {
    const b = state.business;
    return `<div class="section-heading"><h2>Tools & marketing</h2></div>${Object.entries(
      NG.upgrades,
    )
      .map(([id, u]) => {
        const reason = state.operations.arrears
          ? "Clear overdue bills first."
          : state.cash < u.price
            ? `${NG.money(u.price - state.cash)} more cash needed.`
            : "";
        return `<article class="growth-card"><span class="eyebrow">${b[id] ? "✓ INSTALLED" : "ONE-TIME INVESTMENT"}</span><h3>${u.name}</h3><p class="upgrade-effect">${u.description}</p><button class="${b[id] ? "" : "primary"}" data-action="upgrade" data-upgrade="${id}" ${b[id] || reason ? "disabled" : ""}>${b[id] ? "INSTALLED" : "Buy / " + NG.money(u.price)}</button>${!b[id] && reason ? `<small>${reason}</small>` : ""}${id === "advertising" && b[id] ? `<div class="campaign"><span class="${b.adActive ? "positive" : "muted"}">${b.adActive ? "CAMPAIGN ACTIVE / $20 PER DAY" : "CAMPAIGN PAUSED / NO DAILY FEE"}</span><button data-action="toggle-ad" ${!b.adActive && state.cash < 20 ? "disabled" : ""}>${b.adActive ? "Pause campaign" : "Activate campaign"}</button></div>` : ""}</article>`;
      })
      .join(
        "",
      )}<button data-action="view" data-view="operations" data-tab="business">Explore business expansions ↗</button>`;
  }
  function reputationPanel() {
    const tier = NG.repTier(state),
      next = NG.nextRepTier(state);
    return `<span class="eyebrow">REPUTATION / ${state.reputation} POINTS</span><h3>${tier.name}</h3>${NG.repProgress(state)}<p class="rep-effect">Buyer interest bonus: +${Math.round(tier.interest * 100)} percentage points. ${next ? `${next.at - state.reputation} REP to ${next.name}.` : "You have reached the highest reputation milestone."}</p><div class="rep-milestones">${NG.repTiers.map((t) => `<span class="${state.reputation >= t.at ? "reached" : ""}">${t.at} REP<b>${t.name}</b><small>+${Math.round(t.interest * 100)} pp buyer interest</small></span>`).join("")}</div><details><summary>How trust is earned</summary><p>Inspected honest sales earn the normal +1/+2 condition bonus plus 1 extra; as-is sales earn +1. Dealer sales earn none. Complaints can reduce reputation. Reputation also helps new negotiations, capped at a 2% price-limit bonus.</p><p>10 REP opens eligibility for the Service Center and $10,000 credit. The Trading Desk needs 20 REP; the Fleet Workshop and $50,000 credit need 25 REP. Cash, dependencies and existing commitments still matter.</p></details><button data-action="view" data-view="customers">Customers & complaints ↗</button><button data-action="view" data-view="finances">Credit & finances ↗</button><button data-action="view" data-view="operations" data-tab="business">Business expansions ↗</button>`;
  }
  function growth() {
    const p = state.progress;
    const panels = {
      skills: `<div class="section-heading"><h2>Personal development</h2></div><div class="skill-lanes">${skillLane("negotiation", "Negotiation", "Each rank improves bargaining by 0.8%: seller concessions and buyer counteroffer ceilings. Personality and evidence still matter.", "oneMoreShot", "One More Shot", "Adds one step to a seller's patience. Conversations can continue on later days; insults still have lasting consequences.")}${skillLane("mechanical", "Mechanical Knowledge", "15% lower inspection fees and 5% lower repair labor per rank. Rank 2 makes normal engine/transmission jobs one day.", "sharpEye", "Sharp Eye", "A free pre-purchase clue about one hidden fault; not a full inspection.")}${skillLane("market", "Market Knowledge", "Each rank tempers optimistic seller claims and narrows the risk estimate. Hidden facts remain hidden.", "trendSpotter", "Trend Spotter", "See the next planned demand wave before it happens.")}</div><details class="inline-help"><summary>How experience is earned</summary><p>Close a purchase below the original asking price or a sale above the buyer's opening offer after negotiating: 20 XP + 1 per $100 gained, capped at 40 XP per deal. No XP for sending offers, straight purchases, dealer sales or repeating a transaction. Each level grants 1 skill point. Old saved negotiations keep their original limits.</p></details><details><summary>Recent experience</summary><div class="ledger">${p.log.map((l) => `<div><span>${esc(l.car)} / ${l.phase === "purchase" ? "Purchase negotiation" : "Sale negotiation"}<small>${NG.date(l.day)}</small></span><strong class="positive">+${l.amount} XP</strong></div>`).join("") || '<p class="muted">Your first successful negotiated deal will appear here.</p>'}</div></details>`,
      reputation: reputationPanel(),
      investments: garageUpgrades(),
    };
    const tabs = [
      ["skills", "Skills"],
      ["reputation", "Reputation"],
      ["investments", "Tools & marketing"],
    ];
    return `<div class="dealer-intro"><p><b>✦ Experience builds your skills.</b> Close a negotiated deal with a price advantage. Level up for one skill point.</p><p><b>◆ Reputation builds your business.</b> Honest sales earn trust, attract buyers and open credit and expansions.</p></div><div class="dealer-tabs" role="tablist" aria-label="Dealer sections">${tabs.map(([key, label]) => `<button data-action="dealer-tab" data-tab="${key}" id="dealer-tab-${key}" role="tab" aria-selected="${dealerTab === key}" tabindex="${dealerTab === key ? 0 : -1}" aria-controls="dealer-panel-${key}">${label}</button>`).join("")}</div><div class="growth-summary dealer-summary"><b>${p.points} skill point${p.points === 1 ? "" : "s"} ${p.points ? "ready to spend" : "available"}</b><small>${state.sold} completed sale${state.sold === 1 ? "" : "s"} / deal margin ${signed(NG.totalMargin(state))}</small></div>${tabs.map(([key]) => `<section class="dealer-panel ${key === "reputation" ? "rep-panel" : ""}" data-dealer-panel="${key}" id="dealer-panel-${key}" role="tabpanel" aria-labelledby="dealer-tab-${key}" ${dealerTab === key ? "" : "hidden"}>${panels[key]}</section>`).join("")}`;
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
    dialog.classList.remove("car-mode");
    const m = NG.catalog.find((m) => m.id === id);
    if (!m) return;
    selected = null;
    const e = state.collection.models[id] || {};
    dialog.setAttribute("aria-label", m.name + " model guide");
    dialog.innerHTML = `${hud(true)}<div class="modal-head"><span class="eyebrow">CAR COLLECTION / MODEL GUIDE</span><button data-action="close" aria-label="Close">×</button></div><div class="detail-grid"><div class="detail-visual">${NG.carArt({ id: "guide-" + id, model: id }, true)}<span>${m.years[0]}-${m.years[1]} / ${NG.collectibleTier(m).toUpperCase()}</span></div><div><span class="eyebrow">${m.segment.toUpperCase()} / ${esc(m.trim)}</span><h2>${esc(m.name)}</h2><p class="muted">Game years: ${m.years[0]}-${m.years[1]}<br>Service cost index: ${(m.service || 1).toFixed(2)}×</p><div class="detail-prices"><div><span>Reference value</span><strong>${NG.money(m.value)}</strong></div><div><span>Your trading profit</span><strong class="${(e.profit || 0) >= 0 ? "positive" : "negative"}">${signed(e.profit || 0)}</strong></div></div><p class="fine-print">Reference value changes with age, mileage, condition and demand. Collectible tiers are game categories. This page is not an offer to buy.</p></div></div><div class="guide-history"><div><span>Purchased vehicles</span><strong>${e.purchased || 0}</strong></div><div><span>Vehicles repaired</span><strong>${e.repaired || 0}</strong></div><div><span>Vehicles sold</span><strong>${e.sold || 0}</strong></div></div><button class="primary full" data-action="view" data-view="market">Look for one in today’s market</button>`;
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
        ? `<p class="fine-print">Disclosed observed faults: ${
            c.flaws
              .filter((f) => !f.fixed && f.revealed)
              .map((f) => esc(f.label))
              .join(", ") || "none detected"
          }.</p>`
        : mode === "promise"
          ? '<p class="negative fine-print">An unresolved fault will trigger a complaint two days after sale.</p>'
          : '<p class="fine-print">Condition is not guaranteed; no hidden-fault complaint under this description.</p>'
    }</div>`;
  }
  function listingForm(c, value, id) {
    return `<label class="price-label" for="list-price">Asking price ($)</label><input id="list-price" type="number" min="100" max="100000" step="25" value="${Math.round((NG.estimate(state, c) * 1.08) / 25) * 25}"><label class="price-label" for="listing-mode">What do you tell the buyer?</label><select id="listing-mode">${Object.entries(
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

  function historyPanel(c) {
    const h = c.vehicleHistory;
    if (!h) return "";
    return `<div class="negotiation-dialogue"><span>VEHICLE HISTORY / ${h.historyChecked ? "RECORDS SEARCHED" : "UNVERIFIED"}</span><p>${h.historyChecked ? `${h.owners ?? "Unknown"} recorded owners / ${h.records ? "Service records available" : "Incomplete service records"}<br>${h.accident ? "Accident record found. " : "No accident record found. "}${h.odometer ? "Mileage discrepancy. " : ""}${h.paint ? "Paintwork recorded. " : ""}${h.modified ? "Non-factory modifications. " : ""}` : "The seller’s story is not a verified history."}</p>${!h.historyChecked ? `<button data-action="history-check" data-id="${c.id}">Search vehicle records / $35</button>` : ""}</div>`;
  }
  function negotiationHistory(n) {
    if (!n?.history?.length) return "";
    const tactics = {
      direct: "Direct offer",
      cash: "Cash today",
      fault: "Documented faults",
      inspection: "Inspection report",
    };
    const actions = {
      wait: "You chose to think overnight.",
      walk: "You ended the call.",
      resume: "You returned the seller’s call.",
      continue: "The conversation can continue.",
    };
    return `<details class="negotiation-history"><summary>Conversation history (${n.history.length})</summary><ol>${n.history.map((entry) => `<li><small>${NG.date(entry.day)}</small>${entry.bid != null ? `<p><b>You:</b> ${NG.money(entry.bid)} / ${esc(tactics[entry.tactic] || entry.tactic || "Offer")}</p>` : `<p>${esc(actions[entry.action] || "Conversation update")}</p>`}<p><b>Seller:</b> ${esc(entry.message || (entry.response === "agreed" ? "Agreed at " + NG.money(entry.price) : entry.response === "walked" ? "Ended the conversation." : entry.response === "waiting" ? "Asked to wait; counteroffer " + NG.money(entry.price) : "Counteroffer " + NG.money(entry.price)))}</p></li>`).join("")}</ol></details>`;
  }
  function purchasePanel(c) {
    const quote = NG.purchaseQuote(c),
      n = c.negotiation,
      p = c.seller,
      summary = NG.dealSummary(state, c);
    const paused = n && ["waiting", "callback", "walked"].includes(n.status);
    return `<div class="seller-header"><div><h3>${esc(p.name)}</h3><small>${p.contacted ? esc(p.reason) : "Private seller"} / listed ${state.day - c.listing.createdDay} days</small></div>${!p.contacted ? `<button data-action="contact-seller" data-id="${c.id}">Call seller</button>` : !p.detailsAsked ? `<button data-action="seller-details" data-id="${c.id}">Ask about the car</button>` : ""}</div>${p.contacted ? `<p class="seller-story">${esc(NG.sellerKinds.find((k) => k.id === p.kind).line)}</p>` : ""}<details class="price-history"><summary>Price history / original ${NG.money(c.listing.originalAsk)}</summary><p>${c.listing.prices.map((x) => NG.date(x.day) + ": " + NG.money(x.price)).join(" / ")}</p></details><div class="negotiation-dialogue"><span>PHONE / ${esc({ waiting: "Call back tomorrow", callback: "Incoming call", agreed: "Agreed", walked: "Call ended", active: "Negotiating" }[n?.status] || "Connected")}</span>${n?.lastBid ? `<p class="player-line">You offered <b>${NG.money(n.lastBid)}</b></p>` : ""}<small>${esc(p.name)} / current ${NG.money(quote)}</small><p>${esc(n?.message || (n ? "My current price is " + NG.money(quote) : "Asking " + NG.money(c.ask)) + ". What did you have in mind?")}</p>${n?.status === "waiting" && n.resumeDay != null ? `<small>Call back on ${NG.date(n.resumeDay)} / advance to the next day.</small>` : ""}</div>${negotiationHistory(n)}${n?.status === "callback" ? `<button data-action="resume-deal" data-id="${c.id}">Return seller’s call</button>` : ""}${!n?.closed && !paused ? `<label class="price-label" for="purchase-bid">Your offer ($)</label><div class="haggle-controls"><input id="purchase-bid" type="number" min="100" max="${Math.min(state.cash - 50, quote - 1)}" step="1" value="${Math.max(100, Math.min(state.cash - 50, quote - 1, n?.lastBid ? Math.max(n.lastBid + 1, Math.round((n.lastBid + quote) / 2)) : Math.round(quote * 0.9)))}"><button data-action="haggle-buy" data-id="${c.id}" ${state.inventory.length >= state.capacity || state.cash < 150 ? "disabled" : ""}>Make offer</button></div><label class="price-label" for="purchase-tactic">Your approach</label><select id="purchase-tactic"><option value="direct">Direct offer</option><option value="cash">Quick, certain cash payment</option><option value="fault">Point to documented faults</option><option value="inspection">Use the inspection report</option></select><div class="actions"><button data-action="wait-deal" data-id="${c.id}">Think overnight</button><button data-action="walk-deal" data-id="${c.id}">End the call</button></div><p class="fine-print">Nothing reserved until agreement.</p>` : ""}${paused && n?.status !== "callback" ? `<button data-action="next">Close day & wait</button>` : ""}`;
  }

  function offerCard(c, o) {
    const question = o.stage === "question",
      canCounter = !question && !o.negotiation?.closed && o.price < c.listPrice;
    return `<div class="offer buyer-offer" id="buyer-offer-${o.id}"><div class="offer-summary"><span>${esc(o.buyer)}${o.profile ? `<small>${esc(o.profile.name)} / ${esc(o.profile.focus)}</small>` : ""}${o.returning ? '<small class="positive">RETURNING CUSTOMER</small>' : ""}<strong>${question ? "INQUIRY" : NG.money(o.price)}</strong>${!question ? `<small>Deal margin: ${signed(o.price - NG.cost(c))}</small>` : ""}<small>${o.expiresDay != null ? "Valid through " + NG.date(o.expiresDay) : "Today only"}</small></span><div class="offer-actions">${!question ? `<button class="primary" data-action="sell" data-id="${c.id}" data-offer="${o.id}">Accept</button>` : ""}<button data-action="reject" data-id="${c.id}" data-offer="${o.id}">Decline</button></div></div><div class="negotiation-dialogue"><span>${esc(o.buyer)} / ${esc({ question: "Question", agreed: "Agreed", offer: "Offer" }[o.stage] || "Offer")}</span>${o.negotiation?.history?.length ? `<p class="player-line">You asked <b>${NG.money(o.negotiation.history.at(-1).price)}</b></p>` : ""}<p>${esc(o.negotiation?.message || o.message || "Here is my offer.")}</p></div>${question ? `<label class="price-label" for="buyer-answer-${o.id}">Your reply</label><select id="buyer-answer-${o.id}"><option value="condition">Share inspected condition</option><option value="records">Provide service records</option><option value="as-is">Explain uncertainty honestly</option></select><button data-action="answer-buyer" data-id="${c.id}" data-offer="${o.id}">Answer inquiry</button>` : ""}${canCounter ? `<label class="price-label" for="counter-price-${o.id}">Your counteroffer ($)</label><div class="haggle-controls"><input id="counter-price-${o.id}" aria-describedby="offer-feedback-${o.id}" inputmode="numeric" type="number" min="${o.price + 1}" max="${c.listPrice}" step="1" value="${Math.min(c.listPrice, Math.round(o.price * 1.06))}"><button data-action="haggle-sell" data-id="${c.id}" data-offer="${o.id}">Counteroffer</button></div><select id="sale-tactic-${o.id}" aria-label="Selling argument"><option value="price">Discuss price</option><option value="records">Documented service history</option><option value="reliability">Inspected reliability</option></select><p class="offer-feedback" id="offer-feedback-${o.id}" role="alert" hidden></p><p class="fine-print">Use evidence this buyer values.</p>` : ""}</div>`;
  }

  function gradeChip(condition) {
    const g = NG.gradeFor(condition);
    return `<span class="grade-chip grade-${g.id}">${g.label}</span>`;
  }
  // v0.14: three packages are the main repair decision; part-by-part stays for advanced players.
  function repairPackagesPanel(c) {
    const blocked =
        NG.busy(state, c) ||
        c.listed ||
        state.operations.arrears > 0 ||
        (repairMode === "standard" &&
          (NG.workshopBusy(state) >= NG.workshopCapacity(state) ||
            NG.localWorkshopBlocked(state))),
      quotes = NG.repairPackages.map((p) =>
        NG.packageQuote(state, c, p.id, repairMode),
      ),
      // Same rule the simulation's best bot follows: profit per day the car is tied up.
      pick =
        !NG.busy(state, c) && !c.listed
          ? NG.recommendPackage(state, c, repairMode)
          : null,
      best = pick && quotes.find((q) => q.id === pick.id);
    const note = NG.busy(state, c)
      ? `In the workshop. Ready ${NG.date(c.readyDay)}.`
      : c.listed
        ? "Remove the listing before booking work."
        : best
          ? `Best return per day the car is tied up: ${best.label}.`
          : "No package is expected to pay for itself on this car. Selling as it is can be the right call.";
    return `<section class="repair-packages" aria-label="Repair packages"><h3>How far do you take it?</h3><p class="package-note">${esc(note)}</p><div class="package-grid">${quotes
      .map(
        (q) =>
          `<article class="package-card${q === best ? " recommended" : ""}">${q === best ? '<span class="package-flag">BEST RETURN</span>' : ""}<h4>${esc(q.label)}</h4><small>${esc(q.short)}</small>${
            q.available
              ? `<div class="package-grade">${gradeChip(q.gradeBefore.min)}<span aria-hidden="true">→</span><span class="sr-only">to</span>${gradeChip(q.gradeAfter.min)}</div><dl><dt>Cost</dt><dd>${NG.money(q.cost)}</dd><dt>Time</dt><dd>${q.days ? q.days + " day" + (q.days === 1 ? "" : "s") : "Same day"}</dd><dt>Expected sale</dt><dd>${NG.money(q.estimateBefore)} → ${NG.money(q.estimateAfter)}</dd><dt>Profit change</dt><dd class="${q.profitChange >= 0 ? "positive" : "negative"}">${signed(q.profitChange)}</dd><dt>Per day</dt><dd class="${q.profitChange >= 0 ? "positive" : "negative"}">${signed(Math.round(NG.packageScore(q)))}</dd></dl><button class="${q === best ? "primary" : ""}" data-action="repair-package" data-id="${c.id}" data-package="${q.id}" ${blocked || state.cash < q.cost ? "disabled" : ""}>Book ${esc(q.label)} / ${NG.money(q.cost)}</button>`
              : `<p class="fine-print">${esc(q.reason)}</p>`
          }</article>`,
      )
      .join(
        "",
      )}</div><p class="fine-print">One booking, three hours of your time. Expected sale uses what you know: hidden faults in parts the crew opens are found and fixed at parts cost. Profit change includes $5/day holding cost. Per day spreads it over workshop days plus about ${NG.saleCycleDays} days to sell; a bigger total that takes longer can still be right when your garage is quiet.</p></section>`;
  }
  function mechanicalPanel(c, owned) {
    const id = c.id,
      known = c.inspected || owned;
    return `${owned && !c.listed ? `<label class="price-label" for="repair-mode">Workshop booking</label><select id="repair-mode"><option value="standard" ${repairMode === "standard" ? "selected" : ""}>In-house / one job slot</option><option value="rush" ${repairMode === "rush" ? "selected" : ""}>Outsourced rush / +25%, min $80</option></select>` : ""}${owned && NG.localWorkshopBlocked(state) ? '<p class="workshop-note">Today’s local event closes in-house bookings. Choose outsourced rush or wait until tomorrow.</p>' : ""}<h3>Mechanical condition <span>${known ? NG.condition(c) : c.claim}% ${gradeChip(known ? NG.condition(c) : c.claim)}</span></h3><p class="fine-print">${owned && !c.inspected ? "Workshop assessment / inspect for hidden faults." : c.inspected ? "Inspected / intermittent faults may remain." : "Seller claim / unverified."}</p>${owned && NG.repairPackages ? repairPackagesPanel(c) + '<details class="single-part-repairs"><summary>Single-part repairs (advanced)</summary>' : ""}${Object.entries(
      NG.parts,
    )
      .map(([p, d]) => {
        const n = known ? c.parts[p] : c.claim;
        return `<div class="part-row"><span>${d.label}</span><div class="meter"><i style="width:${n}%"></i></div><b>${n}%</b>${owned ? `<button data-action="repair" data-id="${id}" data-part="${p}" ${NG.busy(state, c) || c.listed || state.operations.arrears > 0 || (repairMode === "standard" && (NG.workshopBusy(state) >= NG.workshopCapacity(state) || NG.localWorkshopBlocked(state))) || (c.parts[p] >= 95 && !c.flaws.some((f) => f.part === p && f.revealed && !f.fixed)) ? "disabled" : ""}>${c.parts[p] >= 95 && !c.flaws.some((f) => f.part === p && f.revealed && !f.fixed) ? "Done" : NG.money(NG.repairQuote(c, p, state, repairMode))}</button>` : ""}</div>`;
      })
      .join(
        "",
      )}${owned && NG.repairPackages ? "</details>" : ""}<div class="faults">${
      c.flaws
        .filter((f) => f.revealed)
        .map(
          (f) =>
            `<p class="${f.fixed ? "positive" : "negative"}">${f.fixed ? "✓" : "!"} ${f.label}${f.fixed ? " - fixed" : " - " + NG.money(f.cost) + " extra repair cost"}</p>`,
        )
        .join("") ||
      `<p>${c.inspected ? "No additional faults detected. This is not a guarantee." : "? Hidden faults: not fully inspected."}</p>`
    }</div>${!c.inspected ? `<button data-action="inspect" data-id="${id}">Mechanical inspection · ${NG.money(NG.inspectionPrice(state))}</button>` : ""}${!c.vehicleHistory?.deepChecked ? `<button data-action="inspect-deep" data-id="${id}">Specialist examination / ${NG.money(NG.inspectionPrice(state) * 2)}</button>` : ""}${owned ? '<p class="fine-print">Grades: Rough under 55%, Driver 55-74%, Clean 75-89%, Excellent 90%+. Buyers pay by grade. Single-part repairs restore one part to 95% and cost more than a package; if they find a hidden fault, you get a revised quote before paying.</p>' : ""}`;
  }
  function carSwitch(tab, focus = false) {
    const panel = dialog.querySelector(`[data-car-panel="${tab}"]`);
    if (!panel) return;
    carTabs.set(selected, tab);
    dialog.querySelector(".car-panel-scroll").scrollTop = 0;
    const c = state.inventory.find((c) => c.id === selected);
    if (c && tab === "selling" && c.offers.some((o) => o.seen !== true)) {
      c.offers.forEach((o) => (o.seen = true));
      NG.save(state);
      render();
    }
    dialog
      .querySelectorAll("[data-car-panel]")
      .forEach((el) => (el.hidden = el !== panel));
    dialog
      .querySelectorAll('[data-action="car-tab"][role="tab"]')
      .forEach((el) => {
        const active = el.dataset.tab === tab;
        el.setAttribute("aria-selected", String(active));
        el.tabIndex = active ? 0 : -1;
      });
    const car = [...state.market, ...state.inventory].find(
        (c) => c.id === selected,
      ),
      bar = dialog.querySelector(".car-decision-bar > button");
    if (car && bar && !state.inventory.includes(car)) {
      const n = car.negotiation,
        paused =
          n?.walked || ["waiting", "callback", "walked"].includes(n?.status);
      if (tab === "deal" && !paused) {
        bar.dataset.action = "buy";
        bar.dataset.id = car.id;
        delete bar.dataset.tab;
        bar.classList.add("primary");
        bar.disabled =
          state.cash < NG.purchaseQuote(car) + 50 ||
          state.inventory.length >= state.capacity ||
          state.operations.arrears > 0;
        bar.textContent =
          "Buy / " + NG.money(NG.purchaseQuote(car) + 50) + " total";
      } else {
        bar.dataset.action = "car-tab";
        bar.dataset.tab = paused ? "negotiation" : "deal";
        delete bar.dataset.id;
        bar.disabled = false;
        bar.classList.remove("primary");
        bar.textContent = paused ? "Return to seller" : "Review purchase";
      }
    }
    if (car && bar && state.inventory.includes(car)) {
      const offer = car.offers.length === 1 ? car.offers[0] : null;
      bar.disabled = false;
      bar.classList.remove("primary");
      delete bar.dataset.id;
      delete bar.dataset.offer;
      bar.dataset.action = "car-tab";
      bar.dataset.tab = tab === "selling" ? "finances" : "selling";
      bar.textContent =
        tab === "selling" ? "Review investment" : "Selling options";
    }
    if (focus) dialog.querySelector(`[role="tab"][data-tab="${tab}"]`).focus();
  }
  function carWarnings(c, owned) {
    const warnings = [];
    if (!c.inspected) warnings.push("Uninspected / condition not guaranteed");
    if (c.vehicleHistory?.historyChecked) {
      if (c.vehicleHistory.accident) warnings.push("Accident record");
      if (c.vehicleHistory.odometer) warnings.push("Mileage discrepancy");
      if (!c.vehicleHistory.records) warnings.push("Incomplete records");
    }
    const faults = c.flaws.filter((f) => f.revealed && !f.fixed);
    if (faults.length) warnings.push(faults.length + " known fault(s)");
    if (owned && NG.busy(state, c))
      warnings.push("Repair due " + NG.date(c.readyDay));
    if (state.operations.arrears)
      warnings.push("Overdue bills block buying and repairs");
    return `<div class="car-warnings">${warnings.map((text) => `<span>${esc(text)}</span>`).join("")}</div>`;
  }
  function carOverview(c, owned) {
    const m = NG.model(c),
      next = owned
        ? NG.busy(state, c)
          ? "workshop"
          : "selling"
        : "negotiation";
    return `<div class="detail-grid"><div class="detail-visual">${NG.carArt(c, true)}<span>${c.year} / ${m.trim}</span></div><div><h2>${esc(m.name)}</h2><p>${c.year} / ${c.mileage.toLocaleString("en-US")} miles</p>${opsMetrics(
      [
        [
          owned ? "Invested" : "Seller price",
          NG.money(owned ? NG.cost(c) : NG.purchaseQuote(c)),
        ],
        ["Value estimate", NG.money(NG.estimate(state, c))],
        [
          c.inspected || owned ? "Observed condition" : "Seller claim",
          (c.inspected || owned ? NG.condition(c) : c.claim) + "%",
        ],
      ],
    )}${carWarnings(c, owned)}${!owned && state.progress.sharpEye && !c.inspected ? `<p class="clue"><b>SHARP EYE</b> ${c.flaws.some((f) => !f.fixed) ? "Possible fault: " + esc(c.flaws.find((f) => !f.fixed).label) : "Nothing suspicious spotted."} A clue is not proof.</p>` : ""}<button class="primary" data-action="car-tab" data-tab="${next}">${owned ? (NG.busy(state, c) ? "View workshop" : c.offers.length ? "Review buyers" : "List for sale") : "Talk to seller"}</button><button data-action="car-tab" data-tab="${owned ? "workshop" : "inspection"}">${owned ? "Condition & repairs" : "Inspect first"}</button></div></div>`;
  }
  function purchaseDeal(c) {
    const d = NG.dealSummary(state, c),
      price = NG.purchaseQuote(c),
      n = c.negotiation,
      paused =
        n?.walked || ["waiting", "callback", "walked"].includes(n?.status);
    return `<h3>Review the deal</h3>${opsMetrics([
      ["Purchase price", NG.money(price)],
      ["Transfer", NG.money(50)],
      ["Inspection / paid", NG.money(c.inspectionCost)],
    ])}${opsMetrics([
      ["Expected retail", NG.money(d.low) + " - " + NG.money(d.high)],
      ["Known fault extras", NG.money(d.repairs)],
      ["Risk reserve / estimate", NG.money(d.risk)],
    ])}<p class="fine-print">Repair extras exclude part restoration. Risk reserve is an estimate, not a bill. Holding costs $5 per day plus shared operating bills.</p><div class="deal-total"><span>Pay now / transfer included</span><strong>${NG.money(price + 50)}</strong><small>Cash afterward ${signed(state.cash - price - 50)}</small></div>${paused ? '<p class="negative">Resume the seller conversation before buying.</p>' : ""}<button data-action="car-tab" data-tab="negotiation">Back to negotiation</button>${state.inventory.length >= state.capacity ? '<p class="negative">Garage full. Sell a car to free a space.</p>' : ""}`;
  }
  function carSelling(c) {
    const id = c.id,
      value = NG.value(state, c);
    return `<h3>Sell your car</h3><p class="fine-print">${c.prepared ? "Sale preparation complete. Listing uses no further work time." : "First listing includes two hours of your work. Delegate sale preparation in Operations to free that time."}</p>${NG.busy(state, c) ? `<p class="workshop-note">Repair in progress. Ready ${NG.date(c.readyDay)}.</p>` : c.listed ? `${listingDescription(c)}<div class="selling-price"><b>Listed ${NG.money(c.listPrice)}</b><button data-action="unlist" data-id="${id}">Change / remove listing</button></div>${c.marketAdvice ? `<p class="negative">${esc(c.marketAdvice)}</p>` : ""}${c.buyerMessage ? `<div class="negotiation-dialogue"><p>${esc(c.buyerMessage)}</p></div>` : ""}<div class="buyer-conversations">${c.offers.map((o) => offerCard(c, o)).join("") || "<p>No buyers yet. Close the day to attract interest.</p>"}</div>` : listingForm(c, value, id)}<details class="dealer-exit"><summary>Instant dealer exit / ${NG.money(Math.round(value * 0.72))}</summary><p>Deal margin ${signed(Math.round(value * 0.72) - NG.cost(c))}. Fixed price.</p><button data-action="sell" data-id="${id}" data-offer="dealer" ${NG.busy(state, c) ? "disabled" : ""}>Sell to dealer</button></details>`;
  }
  function carFinances(c) {
    return `<h3>Investment in this car</h3>${opsMetrics([
      ["Acquisition", NG.money(c.purchasePrice)],
      ["Inspection", NG.money(c.inspectionCost)],
      ["Repairs", NG.money(c.repairCost)],
    ])}${opsMetrics([
      ["Transfer", NG.money(c.transactionCost || 0)],
      ["Holding / accrued", NG.money(c.holdingCost || 0)],
      ["Total invested", NG.money(NG.cost(c))],
    ])}<p class="fine-print">Sale proceeds minus these direct costs give the deal contribution. Shared bills and financing stay separate.</p><button data-action="car-tab" data-tab="selling">Review selling options</button>`;
  }
  function details(id, requestedTab, refresh = false) {
    if (!refresh) {
      rememberDrafts();
      const body = app.querySelector(".window-body");
      if (body) viewScroll.set(view, body.scrollTop);
    }
    selected = id;
    const c = [...state.market, ...state.inventory].find((c) => c.id === id);
    if (!c) {
      dialog.close();
      selected = null;
      return;
    }
    dialog.classList.add("car-mode");
    const owned = state.inventory.includes(c),
      tabs = owned
        ? [
            ["overview", "Overview"],
            ["workshop", "Workshop"],
            ["selling", "Selling"],
            ["finances", "Finances"],
          ]
        : [
            ["overview", "Overview"],
            ["inspection", "Inspection"],
            ["negotiation", "Negotiation"],
            ["deal", "Deal"],
          ];
    const remembered = carTabs.get(id),
      tab = tabs.some(([key]) => key === (requestedTab || remembered))
        ? requestedTab || remembered
        : owned && c.offers.length
          ? "selling"
          : "overview";
    if (owned && tab === "selling" && c.offers.some((o) => o.seen !== true)) {
      c.offers.forEach((o) => (o.seen = true));
      NG.save(state);
      render();
    }
    const content = owned
      ? {
          overview: carOverview(c, true),
          workshop: mechanicalPanel(c, true) + historyPanel(c),
          selling: carSelling(c),
          finances: carFinances(c),
        }
      : {
          overview: carOverview(c, false),
          inspection: mechanicalPanel(c, false) + historyPanel(c),
          negotiation: purchasePanel(c),
          deal: purchaseDeal(c),
        };
    dialog.setAttribute("aria-label", NG.model(c).name + " car file");
    dialog.innerHTML = `${hud(true)}<div class="car-window-head"><span class="eyebrow">CAR FILE</span><b>${esc(NG.model(c).name)}</b><button data-action="close" aria-label="Close">×</button></div>${navigation(true)}<div class="car-tabs" role="tablist" aria-label="Car sections">${tabs.map(([key, label]) => `<button role="tab" id="car-tab-${key}" data-action="car-tab" data-tab="${key}" aria-controls="car-panel-${key}" aria-selected="false" tabindex="-1">${label}${key === "selling" && c.offers.length ? ` <b>${c.offers.length}</b>` : ""}</button>`).join("")}</div><div class="car-panel-scroll">${tabs.map(([key, label]) => `<section id="car-panel-${key}" data-car-panel="${key}" role="tabpanel" aria-labelledby="car-tab-${key}" hidden>${content[key]}</section>`).join("")}</div><div class="car-decision-bar"><span>${owned ? "Invested" : "Current price"} <b>${NG.money(owned ? NG.cost(c) : NG.purchaseQuote(c))}</b></span><button data-action="car-tab" data-tab="${owned ? "selling" : "deal"}">${owned ? "Selling options" : "Review purchase"}</button><p class="dialog-feedback" role="alert" hidden></p></div>`;
    restoreDrafts(id);
    compactHelp(dialog);
    carSwitch(tab);
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
    const offers = NG.currentOffers(state).filter(
      (o) => o.expiresDay == null || o.expiresDay <= state.day,
    );
    const dueRequests = state.opportunities.requests.filter(
      (q) => q.status === "active" && q.deadline <= state.day,
    );
    pendingCloseDay = state.day;
    confirm.innerHTML = `${hud(true)}<div class="modal-head"><span class="eyebrow">CLOSE BUSINESS DAY</span><button data-action="cancel-next" aria-label="Cancel day closing">×</button></div><h2 id="day-confirm-title">Close ${NG.date(state.day)}?</h2><p>No time passes until you confirm. The next operating bill is ${NG.money(NG.operatingBill(state))}, plus ${NG.money(state.operations.arrears)} overdue. Closing advances existing listings, finishes eligible repairs and brings the next morning’s news.</p><p>Daily earned wages: ${NG.money(Math.ceil(NG.weeklyPayroll(state) / 7))}. Next payday: ${NG.date(state.management.nextPayDay)}. ${state.management.queue.length} queued task(s) may start and charge their approved costs.</p>${offers.length ? `<div class="confirm-offer-warning"><h3>${offers.length} pending offer${offers.length === 1 ? "" : "s"} will expire</h3><ul>${offers.map((o) => `<li>${esc(o.car)} / ${esc(o.buyer)}: <strong>${o.stage === "question" ? "INQUIRY" : NG.money(o.price)}</strong>${o.unread ? ' <span class="negative">NOT REVIEWED</span>' : ""}</li>`).join("")}</ul><p>You can review and accept these offers before ending the day.</p><button data-action="confirm-view-offers">Review offers first</button></div>` : '<p class="muted">No pending buyer offers.</p>'}${dueRequests.length ? `<div class="confirm-offer-warning"><h3>Buyer request deadline today</h3><ul>${dueRequests.map((q) => `<li>${esc(NG.requestKinds.find((t) => t.id === q.kind).title)} / closing now misses delivery and costs 1 reputation.</li>`).join("")}</ul><button data-action="confirm-view-requests">Review requests first</button></div>` : ""}${state.business.adActive ? `<p class="fine-print">The newspaper campaign will cost $20 on the next morning${state.cash < NG.operatingBill(state) + state.operations.arrears + 20 ? " and pause if operating bills leave insufficient cash" : ""}.</p>` : ""}<div class="actions"><button class="primary" data-action="cancel-next">Keep playing</button><button class="${offers.length ? "danger" : "primary"}" data-action="confirm-next">${offers.length ? "Close day & expire offers" : "Yes, close day"}</button></div>`;
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
      details(ids[0], "selling");
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
    report.innerHTML = `${hud(true)}<div class="modal-head"><span class="eyebrow">DAILY REPORT / DAY ${r.closedDay + 1} CLOSED</span><button data-action="close-day-report" aria-label="Close daily report">×</button></div><h2 id="day-report-title">${NG.date(r.closedDay)}</h2><div class="report-metrics"><div><span>CLOSING CASH</span><strong>${NG.money(r.closingCash)}</strong></div><div><span>DAY’S CASH FLOW</span><strong class="${r.cashFlow >= 0 ? "positive" : "negative"}">${signed(r.cashFlow)}</strong></div><div><span>DAY’S TRADING RESULT</span><strong class="${r.tradingResult >= 0 ? "positive" : "negative"}">${signed(r.tradingResult)}</strong></div></div><p class="fine-print">Closed day: Level ${r.level || 1} / +${r.xpEarned || 0} XP earned / ${r.closingReputation ?? 0} REP.</p><details class="report-transactions"><summary>Closed-day transactions (${(r.transactions || []).length})</summary>${list(
      (r.transactions || []).map(
        (t) => `${esc(t.description)}: <strong>${signed(t.amount)}</strong>`,
      ),
      "No cash movements during this day.",
    )}</details><div class="report-section"><span class="eyebrow">NEXT MORNING / ${NG.date(r.day)}</span><h3>${esc(r.event.title)}</h3><p>${esc(r.event.text)}</p><p class="fine-print">${r.marketCount} active listings, including older cars. Demand: Japan ${Math.round(r.demand.japan * 100)}%, Europe ${Math.round(r.demand.europe * 100)}%, America ${Math.round(r.demand.america * 100)}%. Yesterday’s ${r.expiredOffers} unaccepted offer(s) expired.</p></div><div class="report-columns"><section><h3>Business operations</h3>${list((r.enterpriseNotices || []).map(esc), "No new construction, work orders or wholesale settlements.")}<h3>Local opportunities</h3>${list((r.localNotices || []).map(esc), "No new local invitations or outcomes.")}${(r.activeRequests || []).length ? `<ul>${r.activeRequests.map((q) => `<li>${esc(q.title)} / deliver by ${NG.date(q.deadline)}</li>`).join("")}</ul>` : ""}<button data-action="report-go" data-view="operations" data-tab="requests">Review opportunities</button><h3>Workshop ready</h3>${list(r.completedRepairs.map(esc), "No repairs completed overnight.")}<h3>New offers (${r.offers.length})</h3>${list(
      r.offers.map(
        (o) =>
          `${esc(o.car)} / ${esc(o.buyer)}${o.returning ? " (returning)" : ""}: <strong>${o.stage === "question" ? "INQUIRY" : NG.money(o.price)}</strong>`,
      ),
      "No new offers today. Your asking price may need adjusting.",
    )}</section><section><h3>Customer care</h3>${list(
      r.newClaims.map(
        (q) =>
          `${esc(q.buyer)} / ${esc(q.car)}: repair contribution ${NG.money(q.amount)}, respond before ${NG.date(q.deadline)}.`,
      ),
      "No new complaints.",
    )}${r.expiredClaims.length ? `<p class="negative">Unanswered complaints closed: ${r.expiredClaims.map(esc).join(", ")}.</p>` : ""}<h3>Overnight expenses & reputation</h3><p>${esc(r.advertising)}</p>${r.operations ? `<p>${esc(r.operations)}</p>` : ""}<p>Cash: <strong class="${r.overnightCash >= 0 ? "positive" : "negative"}">${signed(r.overnightCash)}</strong> / REP: <strong class="${r.overnightReputation >= 0 ? "positive" : "negative"}">${r.overnightReputation >= 0 ? "+" : ""}${r.overnightReputation}</strong></p></section></div><p class="fine-print">Trading result covers deals closed during the finished day and customer repair contributions paid that day. Cash flow also includes purchases, repairs and business spending. No time passes while this window is open.</p><div class="actions"><button data-action="report-go" data-view="inventory">View offers</button>${r.newClaims.length || state.claims.some((q) => q.status === "open") ? '<button data-action="report-go" data-view="customers">Customer care</button>' : ""}<button class="primary" data-action="close-day-report">Continue to garage</button></div>`;
    compactHelp(report);
    if (!report.open) report.showModal();
  }
  function acknowledgeDayReport() {
    if (state.dayReport) {
      state.dayReport.read = true;
      NG.save(state);
    }
    document.querySelector("#day-report").close();
  }

  function feedback(before, action) {
    if (action === "confirm-reset") return { text: "", kind: "notice" };
    const levels = state.progress.level - before.level,
      rep = state.reputation - before.reputation;
    const earned =
      state.progress.xp -
      before.xp +
      Array.from({ length: Math.max(0, levels) }, (_, i) =>
        NG.xpNeeded(before.level + i),
      ).reduce((a, b) => a + b, 0);
    const milestone = NG.repTier(state).at > before.tier;
    const opened = NG.enterpriseProjects
      .filter(
        (t) =>
          state.enterprise.projects[t.id]?.status === "active" &&
          before.projects[t.id] !== "active",
      )
      .map((t) => t.name + " opened");
    const repairs = before.repairs.filter((id) =>
      state.inventory.some((c) => c.id === id && !NG.busy(state, c)),
    ).length;
    const offers = state.inventory
      .flatMap((c) => c.offers)
      .filter((o) => !before.offers.includes(o.id)).length;
    const text = [
      ...opened,
      repairs ? `${repairs} repair${repairs === 1 ? "" : "s"} completed` : "",
      offers ? `${offers} incoming offer${offers === 1 ? "" : "s"}` : "",
      earned > 0 ? `+${earned} XP` : "",
      levels > 0
        ? `Level ${state.progress.level}! +${levels} skill point${levels === 1 ? "" : "s"}`
        : "",
      rep ? `${rep > 0 ? "+" : ""}${rep} REP` : "",
      milestone
        ? `${NG.repTier(state).name} / +${Math.round(NG.repTier(state).interest * 100)} pp buyer interest`
        : "",
    ]
      .filter(Boolean)
      .join(" · ");
    return {
      text,
      kind:
        levels > 0 || milestone
          ? "milestone"
          : rep < 0
            ? "warning"
            : earned > 0 ||
                rep > 0 ||
                ["buy", "sell", "upgrade", "enterprise-build"].includes(action)
              ? "success"
              : "notice",
    };
  }
  let toastTimer;
  function toast(message, reward = { text: "", kind: "notice" }) {
    const t = document.querySelector("#toast");
    t.innerHTML = `<strong>${esc(reward.kind === "milestone" ? "New milestone!" : reward.kind === "success" ? "Nice work." : reward.kind === "warning" ? "Reputation changed" : "Dealer update")}</strong><span>${esc(message)}</span>${reward.text ? `<b>${esc(reward.text)}</b>` : ""}`;
    t.dataset.kind = reward.kind;
    if (t.showPopover && !t.matches(":popover-open")) t.showPopover();
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(
      () => {
        t.classList.remove("show");
        if (t.hidePopover && t.matches(":popover-open")) t.hidePopover();
      },
      reward.kind === "milestone" ? 6500 : 4000,
    );
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    e.preventDefault();
    const { action, id, part, offer } = b.dataset;
    rememberDrafts();
    const restoreFocus = document.activeElement === b;
    const beforeProgress = {
      level: state.progress.level,
      points: state.progress.points,
      xp: state.progress.xp,
      log: state.progress.log.length,
      reputation: state.reputation,
      tier: NG.repTier(state).at,
      projects: Object.fromEntries(
        Object.entries(state.enterprise.projects).map(([key, p]) => [
          key,
          p.status,
        ]),
      ),
      repairs: state.inventory
        .filter((c) => NG.busy(state, c))
        .map((c) => c.id),
      offers: state.inventory.flatMap((c) => c.offers.map((o) => o.id)),
    };
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
        if (view === "operations") operationsTab = b.dataset.tab || "today";
        render();
        return;
      }
      if (action === "staff-hire") message = NG.hireStaff(state, id);
      if (action === "staff-fire") message = NG.fireStaff(state, id);
      if (action === "staff-auto") message = NG.toggleStaff(state, id);
      if (action === "staff-pay") message = NG.payPayroll(state);
      if (action === "work-priority") NG.prioritizeWork(state, id);
      if (action === "work-cancel") NG.cancelWork(state, id);
      if (action === "work-now" || action === "work-queue") {
        const carId = document.getElementById("work-car").value;
        const c = [...state.inventory, ...state.market].find(
          (c) => String(c.id) === carId,
        );
        const kind = document.getElementById("work-kind").value,
          worker = document.getElementById("work-worker").value,
          part = document.getElementById("work-part").value;
        const offer = c?.offers.find(
          (o) => o.stage === "question" && o.expiresDay >= state.day,
        );
        if (kind === "followup" && !offer)
          throw Error("No active buyer question for this car.");
        message =
          action === "work-queue"
            ? NG.queueWork(state, kind, c.id, worker, part, offer?.id)
            : NG.performWork(state, kind, c.id, worker, part, offer?.id);
      }
      if (action === "dealer-tab") {
        if (!["skills", "reputation", "investments"].includes(b.dataset.tab))
          return;
        dealerTab = b.dataset.tab;
        render();
        app
          .querySelector(`#dealer-tab-${dealerTab}`)
          ?.focus({ preventScroll: true });
        return;
      }
      if (action === "ops-tab") {
        if (
          !["today", "staff", "workshop", "requests", "business"].includes(
            b.dataset.tab,
          )
        )
          return;
        operationsTab = b.dataset.tab;
        render();
        app
          .querySelector(`#ops-tab-${operationsTab}`)
          ?.focus({ preventScroll: true });
        return;
      }
      if (action === "view-back") {
        const previous = viewHistory.pop() || { view: "garage" };
        switchView(previous.view, previous.tab, true);
        return;
      }
      if (action === "view") {
        switchView(b.dataset.view, b.dataset.tab);
        return;
      }
      if (action === "car-tab") {
        carSwitch(b.dataset.tab);
        return;
      }
      if (action === "model-guide") {
        modelGuide(b.dataset.model);
        return;
      }
      if (action === "detail") {
        details(id, b.dataset.tab);
        return;
      }
      if (action === "close") {
        rememberDrafts();
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
        drafts.clear();
        carTabs.clear();
        viewScroll.clear();
        viewHistory = [];
        state = state.practice
          ? NG.practiceScenario(state.practice)
          : NG.newState();
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
        operationsTab = "requests";
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
        rememberDrafts();
        dialog.close();
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
      if (action === "contact-seller" || action === "seller-details")
        message = NG.contactSeller(
          state,
          id,
          action === "contact-seller" ? "contact" : "details",
        );
      if (action === "history-check") message = NG.checkHistory(state, id);
      if (action === "inspect-deep") {
        NG.inspect(state, id, "deep");
        message = "Specialist examination complete. Some uncertainty remains.";
      }
      if (action === "wait-deal" || action === "walk-deal")
        message = NG.pauseDeal(state, id, action === "walk-deal");
      if (action === "resume-deal") message = NG.resumeDeal(state, id);
      if (action === "answer-buyer")
        message = NG.answerBuyer(
          state,
          id,
          offer,
          document.querySelector("#buyer-answer-" + offer).value,
        );
      if (action === "inspect") {
        NG.inspect(state, id);
        message = "Inspection complete.";
      }
      if (action === "resolve-claim")
        message = NG.resolveClaim(state, b.dataset.claim, b.dataset.decision);
      if (action === "train-skill")
        message = NG.trainSkill(state, b.dataset.skill);
      if (action === "specialist-perk")
        message = NG.unlockSpecialist(state, b.dataset.perk);
      if (action === "enterprise-build")
        message = NG.startEnterprise(state, id);
      if (
        ["enterprise-pause", "enterprise-resume", "enterprise-sell"].includes(
          action,
        )
      )
        message = NG.manageEnterprise(state, id, action.slice(11));
      if (action === "enterprise-borrow")
        message = NG.enterpriseFinance(state, 10000);
      if (action === "enterprise-repay")
        message = NG.enterpriseFinance(
          state,
          -Math.min(10000, state.enterprise.loan),
        );
      if (action === "enterprise-order")
        message = NG.takeServiceOrder(state, id);
      if (action === "enterprise-decline")
        message = NG.declineServiceOrder(state, id);
      if (action === "enterprise-wholesale")
        message = NG.startWholesale(
          state,
          document.querySelector("#wholesale-segment").value,
          Number(b.dataset.cost),
        );
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
          Math.random,
          document.querySelector("#purchase-tactic").value,
        );
      }
      if (action === "haggle-sell") {
        message = NG.haggleSale(
          state,
          id,
          offer,
          Number(document.querySelector("#counter-price-" + offer).value),
          Math.random,
          document.querySelector("#sale-tactic-" + offer).value,
        );
      }
      if (action === "buy") {
        NG.buy(state, id);
        drafts.delete(id);
        carTabs.delete(id);
        arrival = id;
        view = "garage";
        dialog.close();
        selected = null;
        message = "Your car has arrived in the garage.";
      }
      if (action === "repair") message = NG.repair(state, id, part, repairMode);
      if (action === "repair-package")
        message = NG.repairPackage(state, id, b.dataset.package, repairMode);
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
        drafts.delete(id);
        carTabs.delete(id);
        message = "Sold. Deal profit: " + signed(profit) + ".";
      }
      const submitted = {
        "haggle-buy": ["purchase-bid"],
        "haggle-sell": ["counter-price-" + offer],
        list: ["list-price", "listing-mode"],
      }[action];
      if (submitted && selected) {
        const values = drafts.get(selected) || {};
        submitted.forEach((key) => delete values[key]);
        drafts.set(selected, values);
      }
      NG.save(state);
      render();
      if (dialog.open && selected) details(selected, undefined, true);
      if (restoreFocus && !openReport) {
        const scope = dialog.open ? dialog : app;
        const replacement = [...scope.querySelectorAll("[data-action]")].find(
          (el) =>
            Object.entries(b.dataset).every(
              ([key, value]) => el.dataset[key] === value,
            ),
        );
        (replacement && !replacement.disabled
          ? replacement
          : scope.querySelector('[role="tab"][aria-selected="true"]')
        )?.focus({ preventScroll: true });
      }
      if (openReport)
        NG.playGarageTransition(
          beforeScene,
          document.querySelector(".garage-world").outerHTML,
          NG.date(state.day),
          () => {
            showDayReport();
            const reward = feedback(beforeProgress, action);
            if (reward.text) toast("Day completed.", reward);
          },
          closingDate,
        );
      else if (message) {
        const reward = feedback(beforeProgress, action);
        const inline =
          dialog.open &&
          selected &&
          !reward.text &&
          dialog.querySelector(".dialog-feedback");
        if (inline) {
          inline.textContent = message;
          inline.hidden = false;
          inline.dataset.kind = "notice";
          inline.setAttribute("role", "status");
        } else toast(message, reward);
      }
    } catch (error) {
      const feedback =
        action === "haggle-sell" &&
        b.closest(".buyer-offer")?.querySelector(".offer-feedback");
      if (feedback) {
        feedback.textContent = error.message;
        feedback.hidden = false;
        document
          .getElementById("counter-price-" + offer)
          ?.setAttribute("aria-invalid", "true");
      } else if (dialog.open) {
        const notice = dialog.querySelector(".dialog-feedback");
        if (notice) {
          notice.textContent = error.message;
          notice.hidden = false;
          notice.dataset.kind = "error";
          notice.setAttribute("role", "alert");
        } else toast(error.message);
      } else toast(error.message);
    }
  });
  document.addEventListener("keydown", (e) => {
    const menuTab = e.target.closest(
      '[data-action="dealer-tab"], [data-action="ops-tab"][role="tab"]',
    );
    if (menuTab && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const buttons = [
          ...menuTab
            .closest('[role="tablist"]')
            .querySelectorAll('[role="tab"]'),
        ],
        i = buttons.indexOf(menuTab);
      buttons[
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? buttons.length - 1
            : (i + (e.key === "ArrowRight" ? 1 : buttons.length - 1)) %
              buttons.length
      ].click();
      return;
    }
    const carTab = e.target.closest('[data-action="car-tab"][role="tab"]');
    if (carTab && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const keys = [...dialog.querySelectorAll('[role="tab"]')].map(
          (t) => t.dataset.tab,
        ),
        i = keys.indexOf(carTabs.get(selected));
      carSwitch(
        keys[
          e.key === "Home"
            ? 0
            : e.key === "End"
              ? keys.length - 1
              : (i + (e.key === "ArrowRight" ? 1 : keys.length - 1)) %
                keys.length
        ],
        true,
      );
      return;
    }
  });
  document.addEventListener("input", (e) => {
    if (e.target.closest("#details") && e.target.id)
      e.target.dataset.dirty = "true";
    if (e.target.id.startsWith("counter-price-")) {
      e.target.removeAttribute("aria-invalid");
      const feedback = e.target
        .closest(".buyer-offer")
        ?.querySelector(".offer-feedback");
      if (feedback) feedback.hidden = true;
    }
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
    if (e.target.closest("#details") && e.target.id)
      e.target.dataset.dirty = "true";
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
  dialog.addEventListener("cancel", () => rememberDrafts());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      ) {
        rememberDrafts();
        dialog.close();
      }
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
