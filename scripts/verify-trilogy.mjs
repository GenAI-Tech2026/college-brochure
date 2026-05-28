import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errs = [];
page.on("pageerror", (e) => errs.push("p: " + e.message.slice(0, 200)));
page.on("console", (m) => {
  if (m.type() === "error") {
    const t = m.text();
    if (!t.includes("Failed to load resource")) errs.push("c: " + t.slice(0, 200));
  }
});

// ── /submit — form-driven, snap each step ─────────────────────────────────
console.log("== /submit ==");
await page.goto("http://localhost:3001/submit", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: "/tmp/trilogy-submit-step0.png" });

// Step 1: college
await page.fill('input[name="college"]', "Institute of Technical Excellence, Bombay");
await page.locator("button:has-text('Continue')").click();
await page.waitForTimeout(1600);
await page.screenshot({ path: "/tmp/trilogy-submit-step1.png" });

// Step 2: claim
await page.fill('textarea[name="brochureClaim"]', "100% placement record. Every graduating student.");
await page.locator("button:has-text('Continue')").click();
await page.waitForTimeout(1600);
await page.screenshot({ path: "/tmp/trilogy-submit-step2.png" });

// Step 3: reality
await page.fill('textarea[name="reality"]', "71% if you exclude unpaid internships. Mechanical placements were ~48%.");
await page.locator("button:has-text('Continue')").click();
await page.waitForTimeout(1600);
await page.screenshot({ path: "/tmp/trilogy-submit-step3.png" });

// Step 4: receipts (already default yes)
await page.locator("button:has-text('Continue')").click();
await page.waitForTimeout(1600);
await page.screenshot({ path: "/tmp/trilogy-submit-step4.png" });

// Step 5: email
await page.fill('input[name="email"]', "echo-841@iitb.ac.in");
await page.locator("button:has-text('Continue')").click();
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/trilogy-submit-step5.png" });

// Step 6: submit
await page.locator("button:has-text('File the truth')").click();
await page.waitForTimeout(2200);
await page.screenshot({ path: "/tmp/trilogy-submit-submitted.png" });

// ── Test back-navigation reverse crossfade ────────────────────────────────
console.log("== /submit reverse crossfade ==");
await page.goto("http://localhost:3001/submit", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(2000);
await page.fill('input[name="college"]', "Sai DU");
await page.locator("button:has-text('Continue')").click();
await page.waitForTimeout(1400);
await page.fill('textarea[name="brochureClaim"]', "World-class faculty.");
await page.locator("button:has-text('Continue')").click();
await page.waitForTimeout(1400);
await page.screenshot({ path: "/tmp/trilogy-submit-mid.png" });
await page.locator("button:has-text('← Back')").click();
await page.waitForTimeout(1400);
await page.screenshot({ path: "/tmp/trilogy-submit-back.png" });

// ── Test bail ────────────────────────────────────────────────────────────
console.log("== /submit bail ==");
await page.goto("http://localhost:3001/submit", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(2000);
await page.locator("button:has-text('not ready')").click();
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/trilogy-submit-bail.png" });

// ── /verified — scroll the pin ────────────────────────────────────────────
console.log("== /verified ==");
await page.goto("http://localhost:3001/verified", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: "/tmp/trilogy-verified-0.png" });

const vh = 900;
for (let i = 1; i <= 5; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), vh * i);
  await page.waitForTimeout(1100);
  await page.screenshot({ path: `/tmp/trilogy-verified-${i}.png` });
}

// ── /manifesto — confirm unaffected ───────────────────────────────────────
console.log("== /manifesto ==");
await page.goto("http://localhost:3001/manifesto", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: "/tmp/trilogy-manifesto.png" });

console.log("\nERRORS:", errs.length);
if (errs.length) console.log(errs.slice(0, 8));
await browser.close();
