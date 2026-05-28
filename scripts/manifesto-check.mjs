import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
for (const vp of [{ w: 1440, h: 900, name: "d" }, { w: 390, h: 844, name: "m" }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message.slice(0, 150)));
  page.on("console", (m) => { if (m.type() === "error") {
    const t = m.text(); if (!t.includes("Failed to load resource")) errs.push(t.slice(0, 150));
  }});
  const t0 = Date.now();
  const res = await page.goto("http://localhost:3001/manifesto", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(3000);
  const status = res?.status();
  const headline = await page.locator("h1, h2").first().textContent({ timeout: 5000 }).catch(() => null);
  await page.screenshot({ path: `/tmp/manifesto-${vp.name}.png` });
  console.log(`${vp.name}: status=${status} time=${Date.now()-t0}ms headline=${headline?.trim().slice(0,60)} errs=${errs.length}`);
  if (errs.length) console.log("  ", errs.slice(0, 2));
  await ctx.close();
}
await browser.close();
