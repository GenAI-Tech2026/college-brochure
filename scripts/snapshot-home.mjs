import { chromium } from "playwright";

const url = process.env.URL || "http://localhost:3001/";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
page.on("requestfailed", (r) => {
  const f = r.failure();
  if (f) errors.push(`REQFAIL ${r.url()} :: ${f.errorText}`);
});

const t0 = Date.now();
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);
console.log("loaded_ms:", Date.now() - t0);

await page.screenshot({ path: "/tmp/home-1-top.png", fullPage: false });
const total = await page.evaluate(() => document.body.scrollHeight);
const vh = await page.evaluate(() => window.innerHeight);
const slices = Math.min(8, Math.ceil(total / vh));
for (let i = 1; i < slices; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), i * vh);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `/tmp/home-${i + 1}.png` });
}

const sections = await page.$$eval("section", (els) =>
  els.map((e) => ({
    id: e.id || null,
    h2: e.querySelector("h2")?.textContent?.trim().slice(0, 80) ?? null,
    height: e.clientHeight,
    hasContent: e.children.length > 0,
  })),
);

console.log("SECTIONS:", JSON.stringify(sections, null, 2));
console.log("ERRORS:", JSON.stringify(errors, null, 2));
console.log("PAGE_HEIGHT:", total);
await browser.close();
