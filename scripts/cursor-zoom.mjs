import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

await page.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2200);

// Hover over a non-interactive bit of dark hero background
await page.mouse.move(720, 450);
await page.waitForTimeout(900);

// Zoomed crop centered on the cursor
await page.screenshot({
  path: "/tmp/cursor-zoom-default.png",
  clip: { x: 660, y: 390, width: 200, height: 200 },
});

// Now hover over a button — should switch to "link" variant (smaller ring)
await page.mouse.move(220, 800); // "SEE THE EVIDENCE" cta
await page.waitForTimeout(900);
await page.screenshot({
  path: "/tmp/cursor-zoom-link.png",
  clip: { x: 160, y: 740, width: 200, height: 200 },
});

// Hover over a card with data-cursor on it
await page.evaluate(() => document.getElementById("receipts")?.scrollIntoView());
await page.waitForTimeout(1500);
const card = await page.locator('[data-cursor="link"]').first();
const box = await card.boundingBox();
if (box) {
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(900);
  await page.screenshot({
    path: "/tmp/cursor-zoom-card.png",
    clip: {
      x: Math.max(0, box.x + box.width / 2 - 100),
      y: Math.max(0, box.y + box.height / 2 - 100),
      width: 200,
      height: 200,
    },
  });
}

await browser.close();
console.log("done");
