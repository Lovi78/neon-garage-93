const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict"),
  fs = require("node:fs");
const reportPath = (name) =>
  require("node:path").join(
    __dirname,
    "../reports",
    name.replace(/^v0141/, process.env.REPORT_PREFIX || "v0142-stability"),
  );
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {}),
  });
  const context = await browser.newContext({
    reducedMotion: "reduce",
    acceptDownloads: true,
  });
  await context.addInitScript(() => {
    let seed = 42;
    Math.random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  });
  const page = await context.newPage(),
    errors = [],
    results = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const url = (process.env.GAME_URL || "http://127.0.0.1:8139/") + "?dev=1",
    out = require("node:path").join(__dirname, "../reports/");
  for (const size of [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
    { width: 375, height: 844 },
  ]) {
    await page.setViewportSize(size);
    await page.goto(url);
    await page.waitForSelector(".garage-world");
    const layout = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: innerHeight,
      hud: document.querySelector(".game-hud").getBoundingClientRect().height,
      garage: document
        .querySelector(".garage-world")
        .getBoundingClientRect()
        .toJSON(),
    }));
    assert(layout.width <= size.width);
    results.push({ size, layout });
    await page.screenshot({
      path: reportPath(`v0141-garage-${size.width}.png`),
      fullPage: false,
    });
    await page
      .locator('#app [data-action="view"][data-view="market"]')
      .first()
      .click();
    await page.locator(".market-row").first().click();
    const boxes = await page.evaluate(() => ({
      bar: document
        .querySelector(".car-decision-bar")
        .getBoundingClientRect()
        .toJSON(),
      panel: document
        .querySelector(".car-panel-scroll")
        .getBoundingClientRect()
        .toJSON(),
    }));
    assert(
      boxes.bar.top >= 0 &&
        boxes.bar.bottom <= size.height &&
        boxes.panel.height > 200,
    );
    results.at(-1).carLayout = boxes;
    assert.equal(await page.locator("#details .retro-nav").count(), 0);
    assert.equal(
      await page.locator('input[name="purchase-tactic"]:checked').count(),
      0,
    );
    await page.locator('[data-action="haggle-buy"]').click();
    assert.match(
      await page.locator(".dialog-feedback").innerText(),
      /Choose your approach/,
    );
    await page.screenshot({
      path: reportPath(`v0141-purchase-${size.width}.png`),
      fullPage: false,
    });
    await page.locator('#details [data-action="close"]').click();
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url);
  // A fresh seeded game, chosen using public asking price and estimated condition.
  const id = await page.evaluate(() => {
    const s = NG.load();
    return s.market
      .filter((c) => NG.purchaseQuote(c) + 50 + 90 < s.cash)
      .sort(
        (a, b) =>
          NG.estimate(s, b) -
          NG.purchaseQuote(b) -
          (NG.estimate(s, a) - NG.purchaseQuote(a)),
      )[0].id;
  });
  await page.locator('#app [data-view="market"]').first().click();
  await page.locator(`.market-row[data-id="${id}"]`).click();
  await page.locator('[data-action="inspect"]').first().click();
  await page.locator('input[name="purchase-tactic"][value="cash"]').check();
  const ask = await page.evaluate(
    (id) => NG.purchaseQuote(NG.load().market.find((c) => c.id === id)),
    id,
  );
  await page.locator("#purchase-bid").fill(String(Math.round(ask * 0.85)));
  await page.locator('[data-action="haggle-buy"]').click();
  await page.locator('.car-decision-bar [data-action="buy"]').click();
  let s = await page.evaluate(() => NG.load());
  assert.equal(s.inventory.length, 1);
  await page.locator(".parked-car").first().click();
  const q = await page.evaluate((id) => {
    const s = NG.load();
    return NG.packageQuote(
      s,
      s.inventory.find((c) => c.id === id),
      "driver",
    );
  }, id);
  if (q.available && q.cost < s.cash && q.profitChange > 0) {
    await page
      .locator('[data-action="repair-package"][data-package="driver"]')
      .click();
    const c = await page.evaluate(() => NG.load().inventory[0]);
    assert(c.pendingRepair);
    await page.screenshot({
      path: reportPath("v0141-repair-1440.png"),
      fullPage: false,
    });
    await page.locator('.car-decision-bar [data-action="next"]').click();
    await page.waitForTimeout(700);
    if (await page.locator('[data-action="skip-transition"]').isVisible())
      await page.locator('[data-action="skip-transition"]').click();
    if (await page.locator("#day-report").isVisible())
      await page.locator('[data-action="close-day-report"]').first().click();
    await page.locator(".parked-car").first().click();
  }
  await page.locator('[data-action="list"]').click();
  await page.locator('.car-decision-bar [data-action="wait-event"]').click();
  await page.waitForTimeout(700);
  if (await page.locator("#day-report").isVisible())
    await page.locator('[data-action="close-day-report"]').first().click();
  for (let day = 0; day < 12; day++) {
    s = await page.evaluate(() => NG.load());
    if (s.inventory[0]?.offers.length) break;
    await page.locator('#app [data-action="next"]').first().click();
    if (await page.locator("#day-confirm").isVisible())
      await page.locator('[data-action="confirm-next"]').click();
    await page.waitForTimeout(700);
    if (await page.locator('[data-action="skip-transition"]').isVisible())
      await page.locator('[data-action="skip-transition"]').click();
    if (await page.locator("#day-report").isVisible())
      await page.locator('[data-action="close-day-report"]').first().click();
  }
  s = await page.evaluate(() => NG.load());
  assert(s.inventory[0].offers.length);
  await page.locator(".parked-car").first().click();
  await page
    .locator('[data-action="sell"][data-offer]')
    .filter({ hasText: "Accept" })
    .first()
    .click();
  s = await page.evaluate(() => NG.load());
  assert(s.sales.length);
  assert(s.sales[0].profit > 0);
  const log = await page.evaluate(() => NG.sessionLog.data);
  fs.writeFileSync(
    reportPath("v0141-browser-session.json"),
    JSON.stringify(log, null, 2),
  );
  assert(log.clicks <= 12);
  results.push({
    flip: {
      profit: s.sales[0].profit,
      goals: Object.keys(s.season.goals),
      log,
    },
  });
  if (await page.locator("#details").isVisible())
    await page.locator('#details [data-action="close"]').click();
  // Export and real file import readback.
  await page.locator(".footer-tools summary").click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator('[data-action="export-save"]').click();
  const dl = await downloadPromise;
  await dl.saveAs("/private/tmp/ng141-save.json");
  const chooserPromise = page.waitForEvent("filechooser");
  await page.locator('[data-action="import-save"]').click();
  await (await chooserPromise).setFiles("/private/tmp/ng141-save.json");
  await page.waitForTimeout(300);
  assert.equal((await page.evaluate(() => NG.load())).cash, s.cash);
  // Startup corruption must survive UI's automatic save.
  await page.evaluate(() => localStorage.setItem(NG.saveKey, "{broken"));
  await page.reload();
  assert.equal(
    await page.evaluate(() => localStorage.getItem(NG.saveKey)),
    "{broken",
  );
  assert(await page.locator(".storage-warning").isVisible());
  await page.locator(".footer-tools summary").click();
  await page.locator('[data-action="restore-save"]').click();
  assert(!(await page.evaluate(() => NG.loadError)));
  const qa = await context.newPage();
  qa.on("pageerror", (e) => errors.push(e.message));
  for (const size of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await qa.setViewportSize(size);
    await qa.goto(url);
    await qa.evaluate(() => {
      NG.loadError = false;
      const s = NG.newState();
      s.cash = 20000;
      const c = NG.generateCar(
        s,
        NG.catalog.findIndex((m) => m.id === "300zx"),
      );
      s.market.unshift(c);
      NG.buy(s, c.id);
      c.parts = Object.fromEntries(Object.keys(NG.parts).map((p) => [p, 58]));
      c.flaws = [];
      c.inspected = true;
      NG.repairPackage(s, c.id, "driver");
      NG.importSave(JSON.stringify(s));
    });
    await qa.reload();
    await qa.locator(".parked-car").first().click();
    await qa.screenshot({
      path: reportPath(`v0141-repair-${size.width}.png`),
      fullPage: false,
    });
    assert(
      await qa
        .locator(".package-note")
        .innerText()
        .then((t) => t.includes("Current condition changes")),
    );
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    reportPath("v0141-browser-results.json"),
    JSON.stringify({ results, errors }, null, 2),
  );
  console.log(
    JSON.stringify(
      { results: results.map((r) => (r.flip ? { flip: r.flip } : r)), errors },
      null,
      2,
    ),
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
