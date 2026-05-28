import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });

async function shot(url, prefix, viewport) {
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
  for (let i = 1; i < Math.min(6, Math.ceil(total / vh)); i++) {
    await page.evaluate((y) => window.scrollTo(0, y), i * vh * 0.85);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `/tmp/${prefix}-${i + 1}.png` });
  }
  console.log(prefix, "errs:", JSON.stringify(errs.slice(0, 3)));
  await ctx.close();
}

await shot("http://localhost:3001/wall-of-receipts", "wall-d", { width: 1440, height: 900 });
await shot("http://localhost:3001/wall-of-receipts", "wall-m", { width: 390, height: 844 });
await browser.close();
console.log("done");
