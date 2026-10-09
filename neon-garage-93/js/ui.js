(() => {
  let state = NG.load(),
    view = "garage",
    selected = null,
    filter = "all",
    sort = "default";
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
        ? '<span class="tag teal">LISTED</span>'
        : '<span class="tag">IN YOUR GARAGE</span>';
  const card = (c, owned = false) =>
    `<button class="car-card" data-action="detail" data-id="${c.id}"><div class="car-image"><span class="car-number">${c.year} / ${NG.model(c).segment === "japan" ? "JPN" : NG.model(c).segment === "europe" ? "EUR" : "USA"}</span>${NG.carArt(c)}<span class="image-caption">${NG.model(c).trim}</span>${owned ? tag(c) : c.inspected ? '<span class="tag teal">INSPECTED</span>' : ""}</div><div class="card-content"><div class="card-top"><h3>${NG.model(c).name}</h3><span class="arrow">↗</span></div><p>${c.mileage.toLocaleString("en-US")} miles <span>·</span> ${c.inspected || owned ? NG.condition(c) + "% condition" : c.claim + "% claimed condition"}</p><div class="card-bottom"><strong>${NG.money(owned ? NG.cost(c) : c.ask)}</strong><span>${owned ? "total invested" : "asking price"}</span></div></div></button>`;
  function render() {
    const offers = state.inventory.reduce((n, c) => n + c.offers.length, 0);
    app.innerHTML = `<aside class="sidebar"><a class="brand" href="#" data-action="view" data-view="garage"><span class="brand-icon">N<span>G</span></span><span>NEON GARAGE<small>EST. 1993 / WEST COAST</small></span></a><div class="nav-label">YOUR DEALERSHIP</div><nav>${[
      ["garage", "◈", "Garage"],
      ["market", "▤", "Car Market"],
      ["inventory", "▱", "My Inventory"],
      ["finances", "▥", "Finances"],
    ]
      .map(
        ([id, icon, label]) =>
          `<button class="nav-item ${view === id ? "active" : ""}" data-action="view" data-view="${id}"><span class="nav-icon">${icon}</span>${label}${id === "inventory" && offers ? `<b class="nav-count">${offers}</b>` : ""}</button>`,
      )
      .join(
        "",
      )}</nav><div class="sidebar-bottom"><div class="open-sign">OPEN <span>FOR BUSINESS</span></div><p>SILVER PALMS, CA<br>SMALL LOT. BIG PLANS.</p><button class="reset" data-action="reset">↺ New Game</button><small>FIRST PLAYABLE / v0.1</small></div></aside><main><header class="topbar"><span class="top-location"><i></i> SILVER PALMS AUTO DISTRICT</span><div class="day-control"><span>${NG.date(state.day)}<small>Day ${state.day + 1}</small></span><button class="primary" data-action="next">Next Day <span>→</span></button></div></header><div class="content"><div class="page-heading"><div><div class="eyebrow">${view === "market" ? "CLASSIFIEDS / TODAY’S LISTINGS" : view === "finances" ? "BOOKKEEPING / BUSINESS LEDGER" : view === "inventory" ? "YOUR COLLECTION / INVENTORY" : "WELCOME TO THE GOOD LIFE"}</div><h1>${{ garage: "Every deal is a fresh start.", market: "Find your next great deal.", inventory: "The keys are in your hands.", finances: "The numbers tell the story." }[view]}</h1><p>${{ garage: "Buy low. Repair smart. Sell for a profit.", market: "Fresh listings. Hidden problems. Real opportunities.", inventory: "Inspect, repair, and find new owners for your cars.", finances: "Every dollar has a story. Track your dealership’s performance." }[view]}</p></div><span class="year-stamp">19<span>93</span></span></div><section class="stats"><div><span>CASH</span><strong>${NG.money(state.cash)}</strong><small>Available to spend</small></div><div><span>GARAGE</span><strong>${state.inventory.length}<em> / ${state.capacity}</em></strong><small>${state.capacity - state.inventory.length} available spaces</small></div><div><span>REPUTATION</span><strong>${state.reputation}<em> points</em></strong><small>${state.reputation < 10 ? "New face in town" : "Making a name for yourself"}</small></div><div><span>REALIZED PROFIT</span><strong class="${state.profit >= 0 ? "positive" : "negative"}">${signed(state.profit)}</strong><small>${state.sold} completed sales</small></div></section>${NG.storageError ? '<div class="storage-warning">Your browser is blocking saves. Enable local storage; until then, your progress only lasts in this window.</div>' : ""}${view === "garage" ? garage() : view === "market" ? market() : view === "inventory" ? inventory() : finances()}<footer><span>NEON GARAGE '93 <b> / </b> MAKE YOUR OWN WAY.</span><span>${NG.storageError ? "Saving unavailable" : "● Auto-saved locally"}</span></footer></div></main>`;
  }
  function event() {
    return `<section class="event"><div class="event-icon">↗</div><div><span class="eyebrow">AROUND TOWN TODAY / ${state.event.kind === "start" ? "JUNE 1" : "MARKET NEWS"}</span><h3>${state.event.title}</h3><p>${state.event.text}</p></div><span class="event-frequency">THE DAILY<br><b>PALMS</b></span></section>`;
  }
  function garage() {
    return `<section class="hero"><div class="hero-copy"><span class="eyebrow">YOUR LITTLE LOT ON THE EDGE OF TOWN</span><h2>Small garage.<br><span>Big possibilities.</span></h2><p>Good deals don’t come easy.<br>But your next one is waiting in today’s classifieds.</p><button class="primary" data-action="view" data-view="market">Browse the car market ↗</button></div><div class="garage-scene"><div class="sun"></div><div class="city">▥ ▥ ▥ ▥ ▥ ▥</div><div class="building"><div class="neon-sign">NEON <span>GARAGE</span><small>USED CARS · GOOD DEALS</small></div><div class="shutters"><div></div><div></div></div></div><div class="scene-car">${NG.carArt({ id: "hero", model: "crx", color: "#68b9b0" }, true)}</div><div class="road-lines"></div></div><span class="hero-label">SILVER PALMS, CALIFORNIA / 1993</span></section>${event()}<div class="section-heading"><h2>Your garage <span>${state.inventory.length}/${state.capacity}</span></h2><button class="text-button" data-action="view" data-view="inventory">My Inventory →</button></div><div class="car-grid slots">${state.inventory.map((c) => card(c, true)).join("")}${Array.from({ length: state.capacity - state.inventory.length }, () => `<button class="empty-slot" data-action="view" data-view="market"><span>+</span><h3>Room for your next great deal.</h3><p>Pick up a car at the market.</p><b>EXPLORE THE MARKET ↗</b></button>`).join("")}</div><section class="starter-tip"><span>01 / DEALER’S HANDBOOK</span><p>A cheap car isn’t always a good deal. A $90 inspection reveals hidden problems. Keep some cash for repairs, too.</p></section>`;
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
    return `${event()}<div class="section-heading"><h2>Today’s listings <span>${state.market.length}</span></h2><div class="filters"><select id="segment-filter" aria-label="Filter cars">${[
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
    return `<div class="finance-summary"><div><span>TOTAL SALES REVENUE</span><strong>${NG.money(state.sales.reduce((n, s) => n + s.price, 0))}</strong></div><div><span>TOTAL SPENDING</span><strong>${NG.money(expense)}</strong></div><div><span>ESTIMATED NET WORTH</span><strong>${NG.money(state.cash + total)}</strong><small>Cash + inventory at instant dealer value</small></div></div><div class="section-heading"><h2>Completed deals</h2></div>${state.sales.length ? `<div class="table-wrap"><table><thead><tr><th>Car / date</th><th>Total invested</th><th>Sale</th><th>Profit</th></tr></thead><tbody>${state.sales.map((s) => `<tr><td>${s.name}<small>${NG.date(s.day)}</small></td><td>${NG.money(s.cost)}</td><td>${NG.money(s.price)}</td><td class="${s.profit >= 0 ? "positive" : "negative"}">${signed(s.profit)}</td></tr>`).join("")}</tbody></table></div>` : '<div class="ledger-empty">No completed deals yet. Each car’s total investment and profit will appear here.</div>'}<div class="section-heading"><h2>Transactions <span>${state.ledger.length}</span></h2></div><div class="ledger">${state.ledger.map((l) => `<div><span>${l.description}<small>${NG.date(l.day)}</small></span><strong class="${l.amount > 0 ? "positive" : ""}">${signed(l.amount)}</strong></div>`).join("") || '<p class="muted">Starting capital: $5,000. No transactions yet.</p>'}</div><p class="fine-print">Realized profit = sale price - purchase price - inspections - repairs. Inspections of cars you do not buy are separate expenses that reduce cash and net worth.</p>`;
  }
  function details(id) {
    selected = id;
    const c = [...state.market, ...state.inventory].find((c) => c.id === id);
    if (!c) {
      dialog.close();
      return;
    }
    const owned = state.inventory.includes(c),
      m = NG.model(c),
      value = NG.value(state, c),
      known = c.inspected || owned;
    dialog.innerHTML = `<div class="modal-head"><span class="eyebrow">${owned ? "GARAGE / CAR DETAILS" : "CAR MARKET / LISTING"}</span><button data-action="close" aria-label="Close">×</button></div><div class="detail-grid"><div class="detail-visual">${NG.carArt(c, true)}<span>${c.year} / ${m.trim}</span></div><div><span class="eyebrow">${m.segment === "japan" ? "JAPANESE" : m.segment === "america" ? "AMERICAN" : "EUROPEAN"} CLASSIC</span><h2>${m.name}</h2><p class="muted">${c.year} · ${c.mileage.toLocaleString("en-US")} miles</p><div class="detail-prices"><div><span>${owned ? "Total invested" : "Asking price"}</span><strong>${NG.money(owned ? NG.cost(c) : c.ask)}</strong></div><div><span>${c.inspected ? "Inspected market value" : "Estimated market value"}</span><strong>${NG.money(c.inspected ? value : NG.estimate(state, c))}</strong></div></div><p class="fine-print">${c.inspected ? "The inspected value reflects today’s demand and any discovered faults." : "This estimate relies on the seller’s claims. Hidden faults may lower the value."}</p></div></div><div class="detail-sections"><section><h3>Mechanical condition <span>${known ? NG.condition(c) : c.claim}%</span></h3><p class="fine-print">${owned && !c.inspected ? "Basic workshop assessment. A full inspection is needed to reveal hidden faults." : c.inspected ? "Inspected car. Hidden faults are now visible." : "Claimed by the seller. You can check it before buying."}</p>${Object.entries(
      NG.parts,
    )
      .map(([p, d]) => {
        const n = known ? c.parts[p] : c.claim;
        return `<div class="part-row"><span>${d.label}</span><div class="meter"><i style="width:${n}%"></i></div><b>${n}%</b>${owned ? `<button data-action="repair" data-id="${id}" data-part="${p}" ${NG.busy(state, c) || c.listed || (c.parts[p] >= 95 && !c.flaws.some((f) => f.part === p && f.revealed && !f.fixed)) ? "disabled" : ""}>${c.parts[p] >= 95 && !c.flaws.some((f) => f.part === p && f.revealed && !f.fixed) ? "Done" : NG.money(NG.repairQuote(c, p))}</button>` : ""}</div>`;
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
    }</div>${!c.inspected ? `<button data-action="inspect" data-id="${id}">Mechanical inspection · $90</button>` : ""}${owned ? '<p class="fine-print">Repairs restore a part to 95% and take one day. If a hidden fault is found, you get a revised quote before paying.</p>' : ""}</section><section>${!owned ? `<h3>Your next deal?</h3><p>After buying: ${state.capacity - state.inventory.length - 1} available spaces and ${NG.money(state.cash - c.ask)} cash remaining.</p><p class="fine-print">Inspection spending so far: ${NG.money(c.inspectionCost)}. This will count toward your total investment if you buy.</p><button class="primary full" data-action="buy" data-id="${id}" ${state.cash < c.ask || state.inventory.length >= state.capacity ? "disabled" : ""}>Buy car · ${NG.money(c.ask)}</button>` : `<h3>Sell your car</h3>${NG.busy(state, c) ? '<p class="workshop-note">Your car is in the workshop. It will be ready the next day.</p>' : c.listed ? `<p>Asking price: <strong>${NG.money(c.listPrice)}</strong></p><button data-action="unlist" data-id="${id}">Remove listing</button><h4>Today’s offers</h4>${c.offers.length ? c.offers.map((o) => `<div class="offer"><span>${o.buyer}<strong>${NG.money(o.price)}</strong><small>Profit: ${signed(o.price - NG.cost(c))}</small></span><div><button class="primary" data-action="sell" data-id="${id}" data-offer="${o.id}">Accept</button><button data-action="reject" data-id="${id}" data-offer="${o.id}">Decline</button></div></div>`).join("") : '<p class="muted">No offers yet. Advance to the next day. A higher asking price may require more patience.</p>'}` : `<label class="price-label" for="list-price">Asking price ($)</label><input id="list-price" type="number" min="100" max="100000" step="25" value="${Math.round(((c.inspected ? value : NG.estimate(state, c)) * 1.08) / 25) * 25}"><button class="primary full" data-action="list" data-id="${id}">List car for sale</button>`}<div class="dealer"><span>INSTANT DEALER OFFER</span><strong>${NG.money(value * 0.72)}</strong><p>Profit: <b class="${value * 0.72 - NG.cost(c) >= 0 ? "positive" : "negative"}">${signed(Math.round(value * 0.72) - NG.cost(c))}</b></p><button data-action="sell" data-id="${id}" data-offer="dealer" ${NG.busy(state, c) ? "disabled" : ""}>Sell to dealer</button></div><p class="fine-print">Investment: purchase ${NG.money(c.purchasePrice)} + inspection ${NG.money(c.inspectionCost)} + repairs ${NG.money(c.repairCost)}.</p>`}</section></div>`;
    if (!dialog.open) dialog.showModal();
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
      let message = "";
      if (action === "view") {
        view = b.dataset.view;
        render();
        window.scrollTo(0, 0);
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
      if (action === "next") {
        NG.nextDay(state);
        message = state.event.title;
      }
      if (action === "inspect") {
        NG.inspect(state, id);
        message =
          "Inspection complete. Check the mechanical condition and faults.";
      }
      if (action === "buy") {
        NG.buy(state, id);
        message = "Your car has arrived in the garage.";
      }
      if (action === "repair") message = NG.repair(state, id, part);
      if (action === "list") {
        NG.list(state, id, Number(document.querySelector("#list-price").value));
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
        message = "Sold. Deal profit: " + signed(profit);
      }
      NG.save(state);
      render();
      if (dialog.open && selected) details(selected);
      if (message) toast(message);
    } catch (error) {
      toast(error.message);
    }
  });
  document.addEventListener("change", (e) => {
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
  NG.save(state);
  render();
  if (NG.loadError)
    toast("Your previous save could not be read. A new game has started.");
})();
