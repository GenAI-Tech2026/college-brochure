import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push("pe: " + e.message.slice(0, 180)));
page.on("console", (m) => {
  if (m.type() === "error") {
    const t = m.text();
    if (!t.includes("Failed to load resource")) errs.push("c: " + t.slice(0, 180));
  }
});

// 1. Should redirect to login
await page.goto("http://localhost:3001/studio", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(800);
console.log("after /studio →", page.url());
await page.screenshot({ path: "/tmp/studio-login.png", fullPage: true });

// 2. Login
await page.fill('input[name="email"]', "admin@unfiltered.dev");
await page.fill('input[name="password"]', "unfiltered");
await page.click('button[type="submit"]');
await page.waitForURL(/\/studio$/, { timeout: 15000 });
await page.waitForTimeout(1000);
console.log("after login →", page.url());
await page.screenshot({ path: "/tmp/studio-dashboard.png", fullPage: true });

// 3. Visit each collection list
for (const c of ["colleges", "reviews", "verified-students", "brochure-claims", "truth-revelations"]) {
  await page.goto(`http://localhost:3001/studio/${c}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(800);
  const rowCount = await page.locator("table tbody tr").count();
  console.log(`/studio/${c} rows:`, rowCount);
  await page.screenshot({ path: `/tmp/studio-${c}.png`, fullPage: false });
}

// 4. Open first review edit page
await page.goto("http://localhost:3001/studio/reviews", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(800);
const editLink = await page.locator('a[href^="/studio/reviews/"]').first();
const editHref = await editLink.getAttribute("href");
console.log("editing", editHref);
await page.goto(`http://localhost:3001${editHref}`, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/studio-review-edit.png", fullPage: true });

console.log("\nERRORS:", errs.length);
if (errs.length) console.log(errs.slice(0, 5));

await browser.close();
