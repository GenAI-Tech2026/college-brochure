import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });

async function withCtx(viewport, fn) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push("p: " + e.message.slice(0, 200)));
  page.on("console", (m) => {
    if (m.type() === "error") {
      const t = m.text();
      if (!t.includes("Failed to load resource")) errs.push("c: " + t.slice(0, 200));
    }
  });
  await fn(page);
  await ctx.close();
  return errs;
}

// ── 1. Dossier intro — full play ─────────────────────────────────────
console.log("== DOSSIER: full play ==");
let errs = await withCtx({ width: 1440, height: 900 }, async (page) => {
  await page.goto("http://localhost:3001/colleges", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  // Clear sessionStorage so we get the full intro
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });

  // Beat 1 — hero file drops (around 700ms)
  await page.waitForTimeout(900);
  await page.screenshot({ path: "/tmp/dossier-1-hero.png" });

  // Beat 2 — cascade peak (around 2.5s)
  await page.waitForTimeout(1600);
  await page.screenshot({ path: "/tmp/dossier-2-cascade.png" });

  // Beat 3 — settling (around 4s)
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/dossier-3-settle.png" });

  // Beat 4 — title resolves, grid fades in (around 5.5s)
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/dossier-4-resolve.png" });

  // Post-intro — full grid usable (around 7s)
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/dossier-5-grid.png" });

  // Confirm grid is interactive: focus search input
  const searchInput = page.locator('input[placeholder*="Pondicherry"]').first();
  if ((await searchInput.count()) > 0) {
    await searchInput.fill("ITE");
    await page.waitForTimeout(800);
    await page.screenshot({ path: "/tmp/dossier-6-searched.png" });
  }
});
console.log("errs:", errs.length, errs.slice(0, 3));

// ── 2. Skip button ───────────────────────────────────────────────────
console.log("\n== DOSSIER: skip ==");
errs = await withCtx({ width: 1440, height: 900 }, async (page) => {
  await page.goto("http://localhost:3001/colleges", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500); // skip button appears at ~1s
  const skip = page.locator("button:has-text('Skip intro')");
  if ((await skip.count()) > 0) {
    await skip.click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: "/tmp/dossier-skip.png" });
  } else {
    console.log("  skip button not found");
  }
});
console.log("errs:", errs.length, errs.slice(0, 3));

// ── 3. Fast mode (second visit) ──────────────────────────────────────
console.log("\n== DOSSIER: fast mode return visit ==");
errs = await withCtx({ width: 1440, height: 900 }, async (page) => {
  await page.goto("http://localhost:3001/colleges", { waitUntil: "domcontentloaded", timeout: 30000 });
  // mark as seen
  await page.evaluate(() => sessionStorage.setItem("uf:dossierIntroSeen", "1"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: "/tmp/dossier-fast-1.png" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/dossier-fast-2.png" });
});
console.log("errs:", errs.length, errs.slice(0, 3));

// ── 4. /submit easter egg flag ───────────────────────────────────────
console.log("\n== DOSSIER: YOURS badge from /submit ==");
errs = await withCtx({ width: 1440, height: 900 }, async (page) => {
  await page.goto("http://localhost:3001/colleges", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.evaluate(() => {
    sessionStorage.clear();
    sessionStorage.setItem("uf:submittedThisSession", "1");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4500);
  await page.screenshot({ path: "/tmp/dossier-yours.png" });
});
console.log("errs:", errs.length, errs.slice(0, 3));

// ── 5. /admin: rename worked ─────────────────────────────────────────
console.log("\n== ADMIN: login + dashboard ==");
errs = await withCtx({ width: 1440, height: 900 }, async (page) => {
  await page.goto("http://localhost:3001/admin", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(800);
  console.log("  /admin →", page.url());
  await page.screenshot({ path: "/tmp/admin-login.png" });
  await page.fill('input[name="email"]', "admin@unfiltered.dev");
  await page.fill('input[name="password"]', "unfiltered");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin$/, { timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "/tmp/admin-dashboard.png" });
  console.log("  after login →", page.url());

  // Visit each collection list to confirm none of the /studio paths leak
  for (const c of ["colleges", "reviews", "verified-students", "brochure-claims", "truth-revelations"]) {
    const res = await page.goto(`http://localhost:3001/admin/${c}`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForTimeout(700);
    const rowCount = await page.locator("table tbody tr").count();
    console.log(`  /admin/${c}: status=${res?.status()} rows=${rowCount}`);
  }
});
console.log("errs:", errs.length, errs.slice(0, 3));

// ── 6. Reduced motion fallback ───────────────────────────────────────
console.log("\n== DOSSIER: reduced motion ==");
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3001/colleges", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/dossier-reduced.png" });
  await ctx.close();
}

await browser.close();
console.log("\nDONE");
