import { chromium } from "playwright";

const BASE = "http://localhost:3001";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });

// ── Frontend pages ─────────────────────────────────────────────────────────
const routes = [
  "/",
  "/colleges",
  "/college/institute-technical-excellence-bombay",
  "/college/sai-deemed-university",
  "/showcase",
  "/manifesto",
  "/submit",
  "/verified",
  "/wall-of-receipts",
];

console.log("== FRONTEND ==");
for (const path of routes) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error") errors.push("c: " + m.text().slice(0, 200)); });
  try {
    const res = await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);
    const status = res?.status() ?? 0;
    const h1 = await page.locator("h1, h2").first().textContent({ timeout: 2000 }).catch(() => null);
    console.log(`${status} ${path}  → ${h1?.trim().slice(0, 60) ?? "<no h1/h2>"}`);
    if (errors.length) console.log("  errors:", JSON.stringify(errors.slice(0, 3)));
  } catch (e) {
    console.log(`ERR ${path}: ${e.message.slice(0, 100)}`);
  } finally {
    await ctx.close();
  }
}

// ── Admin login + collections ──────────────────────────────────────────────
console.log("\n== ADMIN ==");
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message.slice(0, 200)));
page.on("console", (m) => { if (m.type() === "error") errs.push("c: " + m.text().slice(0, 200)); });

await page.goto(BASE + "/admin", { waitUntil: "networkidle", timeout: 30000 });
await page.fill('input[name="email"]', "admin@unfiltered.dev");
await page.fill('input[name="password"]', "unfiltered");
await page.click('button[type="submit"]');
await page.waitForLoadState("networkidle", { timeout: 30000 });
await page.waitForTimeout(1500);
console.log("after login URL:", page.url());
await page.screenshot({ path: "/tmp/admin-dashboard.png", fullPage: false });

// Visit colleges collection
await page.goto(BASE + "/admin/collections/colleges", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);
const collegeCount = await page.locator("table tbody tr, .row-1").count();
const rowText = await page.locator("table tbody tr").first().textContent().catch(() => null);
console.log("colleges rows:", collegeCount, "first row:", rowText?.trim().slice(0, 80));
await page.screenshot({ path: "/tmp/admin-colleges.png", fullPage: false });

// Check reviews collection too
await page.goto(BASE + "/admin/collections/reviews", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);
const reviewCount = await page.locator("table tbody tr").count();
console.log("reviews rows:", reviewCount);
await page.screenshot({ path: "/tmp/admin-reviews.png", fullPage: false });

if (errs.length) console.log("admin errors:", JSON.stringify(errs.slice(0, 5)));
await browser.close();
console.log("done");
