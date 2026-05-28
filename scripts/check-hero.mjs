import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);
  const tag = `${viewport.width}x${viewport.height}`;
  await page.locator("section").first().screenshot({ path: `/tmp/hero-${tag}.png` });
  // sample 2 more sections
  await page.locator("#gap").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.locator("#gap").screenshot({ path: `/tmp/gap-${tag}.png` });
  await page.locator("#receipts").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.locator("#receipts").screenshot({ path: `/tmp/receipts-${tag}.png` });
  await page.locator("#method").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.locator("#method").screenshot({ path: `/tmp/method-${tag}.png` });
  await ctx.close();
  console.log(`done ${tag}`);
}
await browser.close();
