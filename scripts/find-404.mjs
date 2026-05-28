import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const fails = [];
page.on("response", (r) => {
  if (r.status() === 404) fails.push({ url: r.url(), status: 404 });
  if (r.status() >= 500) fails.push({ url: r.url(), status: r.status() });
});
await page.goto(process.env.URL || "http://localhost:3001/", {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(2500);
console.log(JSON.stringify(fails, null, 2));
await browser.close();
