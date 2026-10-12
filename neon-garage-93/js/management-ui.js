(() => {
  const safe = (x) =>
    String(x ?? "").replace(
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
  const money = (x) => (x < 0 ? "-" : "") + NG.money(Math.abs(Math.round(x)));
  const metrics = (rows) =>
    `<div class="ops-metrics">${rows.map(([k, v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join("")}</div>`;
  NG.workerName = (s, id) =>
    id === "outsourced"
      ? "External shop"
      : s.management.staff.find((w) => w.id === id)?.name ||
        "You / contracted crew";
  NG.managementFinanceUI = (s) => {
    const f = NG.managementSummary(s);
    return `<section class="enterprise-panel"><h3>Last 7 days / business result</h3>${metrics(
      [
        ["Revenue", money(f.revenue)],
        ["Direct deal costs", money(f.direct)],
        ["Deal contribution", money(f.contribution)],
        ["Operating expenses", money(f.overhead)],
        ["Other expenses", money(f.other)],
        ["Payroll earned", money(f.payroll)],
        ["Interest", money(f.interest)],
        ["Business result", money(f.result)],
        ["Cash change", money(f.cashChange)],
      ],
    )}<p class="fine-print">Result recognizes sold stock costs and earned wages. Cash change includes purchases, debt, investment and wage payments. Unsold stock remains inventory. Daily accrual history starts with v0.13.</p>${metrics(
      [
        ["Next payday", NG.date(f.nextPay)],
        ["Next expected wages", money(f.nextAmount)],
        ["Weekly wages", money(f.weekly)],
        ["Earned / unpaid wages", money(f.liability)],
        ["7-day cash buffer", money(f.reserve)],
      ],
    )}<small>Buffer assumes no new sales: cash less seven daily bills, new wages and wages already earned. Hired mechanics replace part of facility labor costs.</small></section>`;
  };
  NG.managementTodayUI = (s) => {
    const m = s.management,
      f = NG.managementSummary(s),
      ready = s.inventory.filter((c) => !c.listed && !NG.busy(s, c));
    return `<section class="enterprise-panel"><h3>Today's capacity</h3>${metrics(
      [
        ["Your work time", 8 - m.ownerUsed + " / 8 hours"],
        ["Staff positions", m.staff.length + " / " + NG.staffLimit(s)],
        ["Waiting tasks", m.queue.length],
        ["Daily wage load", money(f.weekly / 7)],
      ],
    )}${m.unpaid ? `<p class="negative">Overdue payroll ${money(m.unpaid)}</p><button data-action="staff-pay">Pay earned wages</button>` : ""}${f.reserve < 0 ? '<p class="negative">Cash cannot cover seven quiet days. Review hiring, stock and borrowing.</p>' : ""}${ready.map((c) => `<p>${safe(NG.model(c).name)} / ${c.prepared ? "Sale paperwork ready" : "Ready for preparation"} <button data-action="detail" data-id="${c.id}" data-tab="selling">Review listing</button></p>`).join("")}<button data-action="ops-tab" data-tab="staff">Manage staff</button><button data-action="ops-tab" data-tab="workshop">Assign work</button></section>`;
  };
  NG.managementStaffUI = (s) => {
    const m = s.management;
    return `<section class="enterprise-panel"><h3>Staff / ${m.staff.length} of ${NG.staffLimit(s)} positions</h3><p>Mechanics: repairs and inspections. Sales associates: callbacks and sale preparation. Sales and spending decisions require your approval. Routine work runs on day closing.</p><div class="ops-cards">${m.staff.map((w) => `<article class="growth-card"><h3>${w.name} / ${w.role === "sales" ? "Sales Associate" : "Mechanic"}</h3><p>Skill ${w.skill} / Speed ${w.speed} / Reliability ${w.reliability}</p><p>${money(w.salary)}/week / ${w.used} of ${NG.workerHours(w)} hours used today</p><small>Last day: ${m.lastUtilization?.find((x) => x.name === w.name)?.used || 0} hours used</small><button data-action="staff-auto" data-id="${w.id}">${w.auto ? "Routine work ON" : "Routine work OFF"}</button><button data-action="staff-fire" data-id="${w.id}">Dismiss / settle ${money(Math.ceil(w.accrued))}</button></article>`).join("")}</div><h3>Available candidates</h3><div class="ops-cards">${NG.staffCandidates
      .filter((c) => !m.staff.some((w) => w.id === c.id))
      .map(
        (c) =>
          `<article class="growth-card"><h3>${c.name} / ${c.role === "sales" ? "Sales Associate" : "Mechanic"}</h3><p>Skill ${c.skill} / Speed ${c.speed} / Reliability ${c.reliability}</p><p>${money(c.salary)}/week / ${NG.workerHours(c)} hours/day</p><small>Reserve required: ${money(NG.operatingBill(s) * 7 + c.salary)}</small><button data-action="staff-hire" data-id="${c.id}" ${m.staff.length >= NG.staffLimit(s) ? "disabled" : ""}>Hire</button></article>`,
      )
      .join("")}</div><h3>Work log</h3><div class="ledger">${
      m.log
        .slice(0, 12)
        .map((l) => `<p>${NG.date(l.day)} / ${safe(l.text)}</p>`)
        .join("") || "<p>No staff work yet.</p>"
    }</div></section>`;
  };
  NG.managementWorkUI = (s) => {
    const m = s.management,
      cars = [...s.inventory, ...s.market];
    return `<section class="management-panel"><h3>Assign daily work</h3><div class="management-form"><label>Car<select id="work-car">${cars.map((c) => `<option value="${c.id}">${safe(NG.model(c).name)} / ${s.inventory.includes(c) ? "stock" : "market"}</option>`).join("")}</select></label><label>Task<select id="work-kind"><option value="repair">Repair / 3 hours + bay</option><option value="inspect">Inspect / 2 hours</option><option value="prepare">Sale preparation / 2 hours</option><option value="followup">Buyer callback / 1 hour</option></select></label><label>Assigned to<select id="work-worker"><option value="owner">You</option>${m.staff.map((w) => `<option value="${w.id}">${w.name} / ${w.role}</option>`).join("")}</select></label><label>Repair part<select id="work-part">${Object.entries(
      NG.parts,
    )
      .map(([k, p]) => `<option value="${k}">${p.label}</option>`)
      .join(
        "",
      )}</select></label></div><div class="actions"><button data-action="work-now">Do work now</button><button data-action="work-queue">Queue for day closing</button></div><p class="fine-print">Queued repairs charge on starting, within the approved quote. Higher quotes require rebooking. A bay, worker time and cash must be available. Routine mechanics handle authorized bookings. Preparation saves your two hours when first listing. Price and publication remain your decision.</p><h3>Waiting work / priority order</h3><div class="ops-tasks">${
      m.queue
        .map((j) => {
          const c = cars.find((c) => c.id === j.carId);
          return `<article class="ops-task"><div><b>${safe(c ? NG.model(c).name : "Unavailable car")} / ${j.kind}</b><small>${safe(NG.workerName(s, j.worker))} / ${safe((j.maxCost != null ? "Approved " + money(j.maxCost) + " / " : "") + (j.blocked || "Waiting for day closing"))}</small></div><button data-action="work-priority" data-id="${j.id}">Move first</button><button data-action="work-cancel" data-id="${j.id}">Cancel</button></article>`;
        })
        .join("") || "<p>No waiting tasks.</p>"
    }</div></section>`;
  };
})();
