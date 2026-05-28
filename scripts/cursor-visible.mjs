import { chromium } from "playwright";

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2000);

// Move mouse to a known position over the dark hero background
await page.mouse.move(720, 450);
await page.waitForTimeout(700);

await page.screenshot({ path: "/tmp/cursor-pos1.png" });

// Hover over a link target — should morph to "link" variant
await page.mouse.move(280, 800); // over a button
await page.waitForTimeout(700);
await page.screenshot({ path: "/tmp/cursor-pos2.png" });

// Sample a 60x60 box around (720, 450) — count non-background pixels
const pixelBox = await page.evaluate(async () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1440;
  canvas.height = 900;
  // We can't easily get a pixel sample via the browser without html2canvas;
  // instead, query the dot + ring computed bounding rect.
  const dot = Array.from(document.querySelectorAll('[data-cursor="ignore"]')).find(
    (e) => e.className.includes("z-[10000]"),
  );
  const ring = Array.from(document.querySelectorAll('[data-cursor="ignore"]')).find(
    (e) => e.className.includes("z-[9999]"),
  );
  return {
    dotRect: dot?.getBoundingClientRect()?.toJSON?.() ?? null,
    ringRect: ring?.getBoundingClientRect()?.toJSON?.() ?? null,
  };
});
console.log(JSON.stringify(pixelBox, null, 2));

await browser.close();
