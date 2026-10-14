const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {}),
  });
  try {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    await context.addInitScript(() => {
      let seed = 142;
      Math.random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
    });
    const page = await context.newPage(),
      errors = [],
      checks = [],
      out = path.join(__dirname, "../reports/"),
      url = (process.env.GAME_URL || "http://127.0.0.1:8142/") + "?dev=1";
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url);
    const original = process.env.PLAYER_SAVE
      ? JSON.parse(fs.readFileSync(process.env.PLAYER_SAVE, "utf8"))
      : null;
    if (original) {
      await page.locator(".footer-tools summary").click();
      const chooser = page.waitForEvent("filechooser");
      await page.locator('[data-action="import-save"]').click();
      await (await chooser).setFiles(process.env.PLAYER_SAVE);
      await page.waitForTimeout(200);
      const saved = await page.evaluate(() => NG.load());
      assert.equal(saved.cash, original.cash);
      assert.equal(saved.reputation, original.reputation);
      assert.deepEqual(saved.sales, original.sales);
      assert.deepEqual(
        saved.market.map((c) => [c.parts, c.flaws, c.ask]),
        original.market.map((c) => [c.parts, c.flaws, c.ask]),
      );
      checks.push(
        "Original player save imported without changing cash, reputation, sales or market facts.",
      );
    } else
      await page.evaluate(() => {
        const s = NG.newState();
        s.day = 23;
        s.cash = 6450;
        s.sold = 3;
        s.sales = [{ id: "qa-past", price: 2000, cost: 1500, profit: 500 }];
        s.season.goals = { flip: {}, rent: {}, request: {}, margin: {} };
        NG.importSave(JSON.stringify(s));
        location.reload();
      });
    for (const size of [
      { width: 1440, height: 900 },
      { width: 1280, height: 800 },
      { width: 390, height: 844 },
      { width: 375, height: 844 },
    ]) {
      await page.setViewportSize(size);
      await page.reload();
      await page.waitForSelector(".objective-guide");
      assert.match(await page.locator(".objective-guide").innerText(), /Top 5/);
      assert.match(
        await page.locator(".objective-guide").innerText(),
        /buyer audiences/,
      );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({
        path: out + `v0142-goal-${size.width}.png`,
        fullPage: true,
      });
      await page.locator(".objective-guide .primary").click();
      await page
        .locator(".market-row")
        .filter({ has: page.locator(".row-character") })
        .first()
        .click();
      await page.locator(".car-character").scrollIntoViewIfNeeded();
      assert(await page.locator(".car-character").isVisible());
      const bar = await page.locator(".car-decision-bar").boundingBox();
      assert(bar.y >= 0 && bar.y + bar.height <= size.height);
      await page.screenshot({
        path: out + `v0142-character-${size.width}.png`,
      });
      await page.locator('#details [data-action="close"]').click();
    }
    checks.push(
      "Four viewport sizes: goal, car character, scrolling and accessible decision bar.",
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(url);
    await page.locator("#app .nav-business > summary").click();
    await page
      .locator('#app [data-view="operations"][data-tab="requests"]')
      .first()
      .click();
    const request = await page.evaluate(() =>
      NG.load().opportunities.requests.find((q) => q.status === "offered"),
    );
    if (request) {
      await page
        .locator(`[data-action="request-accept"][data-id="${request.id}"]`)
        .click();
      const q = await page.evaluate(
        (id) => NG.load().opportunities.requests.find((q) => q.id === id),
        request.id,
      );
      assert(q.supply);
      await page
        .locator(
          `.request-card [data-action="detail"][data-id="${q.supply.carId}"]`,
        )
        .first()
        .click();
      if (await page.locator('[data-action="history-check"]').count())
        await page.locator('[data-action="history-check"]').first().click();
      await page.locator('[data-action="inspect"]').first().click();
      await page.locator('.car-decision-bar [data-action="buy"]').click();
      await page.locator(".parked-car").first().click();
      const plan = await page.evaluate((id) => {
        const s = NG.load(),
          q = s.opportunities.requests.find((q) => q.id === id);
        return NG.requestPreparation(
          s,
          q,
          s.inventory.find((c) => c.id === q.supply.carId),
        );
      }, q.id);
      if (plan.package !== "none") {
        await page
          .locator(
            `[data-action="repair-package"][data-package="${plan.package}"]`,
          )
          .click();
      }
      while (
        await page.evaluate(() => {
          const s = NG.load();
          return s.inventory.some((c) => NG.busy(s, c));
        })
      ) {
        if (await page.locator("#details").isVisible())
          await page.locator('.car-decision-bar [data-action="next"]').click();
        else await page.locator('#app .game-hud [data-action="next"]').click();
        await page.waitForTimeout(600);
        if (await page.locator("#day-report").isVisible())
          await page
            .locator('[data-action="close-day-report"]')
            .first()
            .click();
      }
      if (await page.locator("#details").isVisible())
        await page.locator('#details [data-action="close"]').click();
      await page
        .locator('.request-tracker [data-action="request-deliver"]')
        .click();
      const done = await page.evaluate(
        (id) => NG.load().opportunities.requests.find((q) => q.id === id),
        q.id,
      );
      assert.equal(done.status, "fulfilled");
      checks.push(
        "Actual player-stage request accepted, secured source inspected/bought/repaired and delivered through UI.",
      );
    }
    // Controlled unlocked QA state to exercise the new commercial choice.
    await page.evaluate(() => {
      const s = NG.newState();
      s.cash = 30000;
      s.season.unlocked.top5 = 3;
      s.season.goals.request = { day: 0 };
      s.sold = 1;
      s.sales = [{ id: "qa", price: 1000, cost: 900, profit: 100 }];
      const c = NG.generateCar(
        s,
        NG.catalog.findIndex((m) => m.id === "supra"),
      );
      s.market.unshift(c);
      NG.buy(s, c.id);
      c.inspected = true;
      c.flaws = [];
      NG.importSave(JSON.stringify(s));
    });
    await page.reload();
    await page.locator(".parked-car").first().click();
    await page.locator("#listing-audience").selectOption("enthusiast");
    const before = await page.evaluate(() => NG.load().cash);
    await page.locator('[data-action="list"]').click();
    assert.equal(await page.evaluate(() => NG.load().cash), before - 35);
    assert.match(
      await page.locator(".listing-description").innerText(),
      /Focused audience/,
    );
    await page.screenshot({ path: out + "v0142-audience-1440.png" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(".listing-description").scrollIntoViewIfNeeded();
    await page.screenshot({ path: out + "v0142-audience-390.png" });
    checks.push(
      "Top 5 audience choice used and charged exactly once; desktop/mobile screenshots.",
    );
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      out + "v0142-browser-results.json",
      JSON.stringify({ checks, errors }, null, 2) + "\n",
    );
    console.log({ checks, errors });
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
