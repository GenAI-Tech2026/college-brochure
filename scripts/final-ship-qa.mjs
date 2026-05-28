import { chromium } from "playwright";

const BASE = "http://localhost:3001";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });

async function shotPage(ctx, path, name, viewport) {
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push("p: " + e.message.slice(0, 180)));
  page.on("console", (m) => {
    if (m.type() === "error") {
      const t = m.text();
      if (!t.includes("Failed to load resource")) errs.push("c: " + t.slice(0, 180));
    }
  });
  try {
    await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (path === "/colleges") {
      // bypass the intro for the snapshot of the explorer body
      await page.evaluate(() => sessionStorage.setItem("uf:dossierIntroSeen", "1"));
      await page.reload({ waitUntil: "domcontentloaded" });
    }
    await page.waitForTimeout(2500);
    const tag = viewport === "mobile" ? "m" : "d";
    await page.screenshot({ path: `/tmp/ship-${tag}-${name}.png`, fullPage: false });
  } catch (e) {
    console.log(`  ERR ${path}:`, e.message.slice(0, 80));
  }
  await page.close();
  return errs;
}

const routes = [
  ["/", "home"],
  ["/colleges", "colleges"],
  ["/college/institute-technical-excellence-bombay", "college-detail"],
  ["/showcase", "showcase"],
  ["/manifesto", "manifesto"],
  ["/submit", "submit"],
  ["/verified", "verified"],
  ["/wall-of-receipts", "wall"],
];

let totalErrs = 0;
for (const vp of [
  { name: "desktop", w: 1440, h: 900 },
  { name: "mobile",  w: 390,  h: 844 },
]) {
  console.log(`\n== ${vp.name.toUpperCase()} (${vp.w}×${vp.h}) ==`);
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  for (const [path, name] of routes) {
    const errs = await shotPage(ctx, path, name, vp.name);
    if (errs.length) {
      totalErrs += errs.length;
      console.log(`  ${path}: ${errs.length} errs`, errs.slice(0, 2));
    } else {
      console.log(`  ${path}: ok`);
    }
  }
  await ctx.close();
}

// ── Scroll-driven cascade — both viewports ──────────────────────────
console.log("\n== SCROLL-DRIVEN CASCADE ==");
for (const vp of [
  { name: "desktop", w: 1440, h: 900 },
  { name: "mobile",  w: 390,  h: 844 },
]) {
  const tag = vp.name === "mobile" ? "m" : "d";
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/colleges", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `/tmp/ship-${tag}-cascade-0.png` });

  // Walk scroll in 5 steps
  for (let i = 1; i <= 5; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), vp.h * (i * 0.7));
    await page.waitForTimeout(700);
    await page.screenshot({ path: `/tmp/ship-${tag}-cascade-${i}.png` });
  }
  console.log(`  ${vp.name} cascade snapshotted`);
  await ctx.close();
}

// ── Admin: login + every collection list ─────────────────────────────
console.log("\n== ADMIN ==");
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  storageState: undefined,
});
await ctx.clearCookies();
const page = await ctx.newPage();
await page.goto(BASE + "/admin/login", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(800);
const loginUrl = page.url();
if (!loginUrl.includes("/admin/login")) {
  // Already logged in via prior cookie — log out first
  await page.goto(BASE + "/admin/logout", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.goto(BASE + "/admin/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
}
await page.fill('input[name="email"]', "admin@unfiltered.dev");
await page.fill('input[name="password"]', "unfiltered");
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin$/, { timeout: 15000 });
await page.waitForTimeout(900);
await page.screenshot({ path: "/tmp/ship-d-admin.png" });

for (const c of ["submissions", "colleges", "reviews", "verified-students", "brochure-claims", "truth-revelations"]) {
  await page.goto(`${BASE}/admin/${c}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(700);
  const rows = await page.locator("table tbody tr").count();
  await page.screenshot({ path: `/tmp/ship-d-admin-${c}.png` });
  console.log(`  /admin/${c}: ${rows} rows`);
}
await ctx.close();

// ── Admin on mobile (responsive check) ──────────────────────────────
console.log("\n== ADMIN MOBILE ==");
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/admin/login", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "/tmp/ship-m-admin-login.png" });
  await page.fill('input[name="email"]', "admin@unfiltered.dev");
  await page.fill('input[name="password"]', "unfiltered");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin$/, { timeout: 15000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: "/tmp/ship-m-admin.png" });
  await page.goto(BASE + "/admin/submissions", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: "/tmp/ship-m-admin-submissions.png" });
  await ctx.close();
}

await browser.close();
console.log(`\nTotal console errors: ${totalErrs}`);
console.log("DONE");
