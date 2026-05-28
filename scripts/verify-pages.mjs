import { chromium } from "playwright";

const BASE = "http://localhost:3001";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });

async function shotPage(url, prefix, viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message.slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error") errs.push("c: " + m.text().slice(0, 200)); });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `/tmp/${prefix}-top.png` });

  const total = await page.evaluate(() => document.body.scrollHeight);
  const vh = viewport.height;
  const slices = Math.min(6, Math.ceil(total / vh));
  for (let i = 1; i < slices; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), i * vh * 0.9);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `/tmp/${prefix}-${i + 1}.png` });
  }
  console.log(`${prefix} errors:`, JSON.stringify(errs.slice(0, 3)));
  await ctx.close();
}

await shotPage(BASE + "/verified", "verified-d", { width: 1440, height: 900 });
await shotPage(BASE + "/verified", "verified-m", { width: 390, height: 844 });
console.log("done");
await browser.close();
