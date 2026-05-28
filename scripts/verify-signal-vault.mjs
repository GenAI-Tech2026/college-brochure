import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errs = [];
page.on("pageerror", (e) => errs.push("p: " + e.message.slice(0, 220)));
page.on("console", (m) => {
  if (m.type() === "error") {
    const t = m.text();
    if (!t.includes("Failed to load resource")) errs.push("c: " + t.slice(0, 220));
  }
});

// Always start with a clean draft
await page.goto("http://localhost:3001/submit", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.evaluate(() => localStorage.removeItem("uf:submit:draft:v1"));
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
await page.screenshot({ path: "/tmp/sv-01-dark.png" });

// Step 1 — college (should crossfade to Act 2)
await page.fill('input[name="college"]', "Institute of Technical Excellence, Bombay");
await page.locator("button:has-text('Continue')").click();
await page.waitForTimeout(1800);
await page.screenshot({ path: "/tmp/sv-02-mechanism.png" });

// Step 2 — claim (≥20 chars) → Act 3 (filament)
await page.fill('textarea', "100% placement record across every branch and stream, every year.");
await page.locator("button:has-text('Continue')").click();
await page.waitForTimeout(1800);
await page.screenshot({ path: "/tmp/sv-03-filament.png" });

// Step 3 — reality (≥20) → stays Act 3, pulse + subline override
await page.fill('textarea', "Verified at 71% once unpaid internships and deferred offers are removed. Mech was 48%.");
await page.locator("button:has-text('Continue')").click();
await page.waitForTimeout(900);
await page.screenshot({ path: "/tmp/sv-04-pulse-reality.png" });

// Step 4 — receipts → pulse
await page.locator("button:has-text('Continue')").click();
await page.waitForTimeout(700);
await page.screenshot({ path: "/tmp/sv-05-pulse-receipts.png" });

// Step 5 — email → pulse, lands on last step (identity, "Transmit signal")
await page.fill('input[name="email"]', "echo-841@iitb.ac.in");
await page.locator("button:has-text('Continue')").click();
await page.waitForTimeout(900);
await page.screenshot({ path: "/tmp/sv-06-pulse-email.png" });
await page.screenshot({ path: "/tmp/sv-07-identity.png" });

// SUBMIT — Act 4 hero begins. Wait the full 10s + a beat for Act 5 crossfade.
await page.locator("button:has-text('Transmit signal')").click();
await page.waitForTimeout(2500);
await page.screenshot({ path: "/tmp/sv-08-beam-early.png" });
await page.waitForTimeout(2500);
await page.screenshot({ path: "/tmp/sv-09-beam-mid.png" });
await page.waitForTimeout(3500);
await page.screenshot({ path: "/tmp/sv-10-beam-late.png" });
await page.waitForTimeout(2500); // past 10s — should be in Vault now
await page.screenshot({ path: "/tmp/sv-11-vault.png" });

// Test the Save & Return exit flow
console.log("== bail flow ==");
await page.goto("http://localhost:3001/submit", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.evaluate(() => localStorage.removeItem("uf:submit:draft:v1"));
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
await page.fill('input[name="college"]', "Sai DU");
await page.locator("button:has-text('Continue')").click();
await page.waitForTimeout(1400);
await page.locator("button:has-text('Save & return')").click();
await page.waitForTimeout(1400);
await page.screenshot({ path: "/tmp/sv-bail.png" });

// Confirm draft restored
console.log("== draft restore ==");
await page.goto("http://localhost:3001/submit", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(2200);
const collegeVal = await page.locator('input[name="college"]').inputValue().catch(() => "");
console.log("draft college:", collegeVal);

console.log("\nERRORS:", errs.length);
if (errs.length) console.log(errs.slice(0, 8));
await browser.close();
