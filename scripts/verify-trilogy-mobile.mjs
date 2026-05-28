import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push("p: " + e.message.slice(0, 200)));
page.on("console", (m) => {
  if (m.type() === "error") {
    const t = m.text();
    if (!t.includes("Failed to load resource")) errs.push("c: " + t.slice(0, 200));
  }
});

await page.goto("http://localhost:3001/submit", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: "/tmp/trilogy-mobile-submit.png", fullPage: false });

await page.goto("http://localhost:3001/verified", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: "/tmp/trilogy-mobile-verified.png", fullPage: false });

console.log("ERRORS:", JSON.stringify(errs.slice(0, 5)));
await browser.close();
