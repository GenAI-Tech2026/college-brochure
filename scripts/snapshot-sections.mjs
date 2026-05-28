import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2500);

const targets = [
  { selector: "section >> nth=0", file: "hero" },
  { selector: "#gap", file: "gap" },
  { selector: "#receipts", file: "receipts" },
  { selector: "#method", file: "method" },
  { selector: "#numbers", file: "numbers" },
  { selector: "#livestream", file: "livestream" },
  { selector: "#join", file: "join" },
];

for (const t of targets) {
  try {
    const el = await page.locator(t.selector).first();
    await el.scrollIntoViewIfNeeded({ timeout: 5000 });
    await page.waitForTimeout(2200);
    await el.screenshot({ path: `/tmp/section-${t.file}.png` });
    console.log(`captured ${t.file}`);
  } catch (e) {
    console.log(`miss ${t.file}: ${e.message}`);
  }
}
await browser.close();
