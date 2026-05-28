import { chromium } from "playwright";

const BASE = "http://localhost:3001";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });

const routes = [
  "/",
  "/colleges",
  "/college/institute-technical-excellence-bombay",
  "/college/sai-deemed-university",
  "/college/kaveri-regional-university",
  "/showcase",
  "/manifesto",
  "/submit",
  "/verified",
  "/wall-of-receipts",
];

const viewports = [
  { name: "desktop", w: 1440, h: 900 },
  { name: "mobile",  w: 390,  h: 844 },
];

const results = [];

for (const vp of viewports) {
  for (const path of routes) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push(`pageerror: ${e.message.slice(0, 120)}`));
    page.on("console", (m) => {
      if (m.type() === "error") {
        const t = m.text();
        if (!t.includes("Failed to load resource") || !t.includes("404")) {
          errs.push(`console: ${t.slice(0, 120)}`);
        }
      }
    });
    try {
      const t0 = Date.now();
      const res = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45000 });
      const ttfb = Date.now() - t0;
      await page.waitForTimeout(1200);
      const status = res?.status() ?? 0;
      const title = await page.title();
      const headline = await page.locator("h1, h2").first().textContent({ timeout: 2000 }).catch(() => null);
      results.push({
        vp: vp.name,
        path,
        status,
        ttfb,
        title: title.slice(0, 50),
        headline: headline?.trim().slice(0, 60) ?? null,
        errs: errs.length,
        errSamples: errs.slice(0, 2),
      });
    } catch (e) {
      results.push({
        vp: vp.name,
        path,
        status: 0,
        title: null,
        headline: null,
        errs: -1,
        errSamples: [e.message.slice(0, 100)],
      });
    } finally {
      await ctx.close();
    }
  }
}

// Studio admin separately
console.log("\n=== STUDIO ===");
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const adminErrs = [];
page.on("pageerror", (e) => adminErrs.push("p: " + e.message.slice(0, 150)));
page.on("console", (m) => {
  if (m.type() === "error" && !m.text().includes("Failed to load resource")) {
    adminErrs.push("c: " + m.text().slice(0, 150));
  }
});
await page.goto(BASE + "/studio/login", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(1200);
await page.fill('input[name="email"]', "admin@unfiltered.dev");
await page.fill('input[name="password"]', "unfiltered");
await page.click('button[type="submit"]');
await page.waitForURL(/\/studio$/, { timeout: 15000 });
await page.waitForTimeout(1000);

const collsList = ["colleges", "reviews", "verified-students", "brochure-claims", "truth-revelations"];
const adminResults = [];
for (const c of collsList) {
  const t0 = Date.now();
  const res = await page.goto(`${BASE}/studio/${c}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1000);
  const rowCount = await page.locator("table tbody tr").count();
  adminResults.push({ collection: c, status: res?.status() ?? 0, rows: rowCount, ttfb: Date.now() - t0 });
}

console.table(results);
console.log("\nadmin errors:", adminErrs.length);
if (adminErrs.length) console.log(adminErrs.slice(0, 3));
console.table(adminResults);

const failed = results.filter((r) => r.status !== 200 || r.errs > 0);
console.log(`\n=== SUMMARY ===`);
console.log(`Total: ${results.length}, OK: ${results.length - failed.length}, Failed/errs: ${failed.length}`);
console.log(`Admin: ${adminResults.length} collections, ${adminErrs.length} console errors`);

await browser.close();
