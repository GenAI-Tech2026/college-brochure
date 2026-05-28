import { chromium } from "playwright";

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("ERR: " + e.message.slice(0, 200)));
page.on("console", (m) => { if (m.type() === "error") errors.push("c: " + m.text().slice(0, 200)); });

await page.goto("http://localhost:3001/submit", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2500);

// Snapshot the top
await page.screenshot({ path: "/tmp/submit-01-top.png" });

// Scroll into the Intake
const intake = await page.locator('[aria-label="The intake procedure"]');
await intake.scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/submit-02-act1.png" });

// Scroll by 1/4, 2/4, 3/4 of the pin duration to fire each act
const start = await intake.evaluate((el) => window.scrollY + el.getBoundingClientRect().top);
const pinHeight = await intake.evaluate((el) => {
  const inner = el.querySelector(":scope > div");
  return inner ? inner.offsetHeight : 900;
});

for (let i = 1; i <= 4; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), start + pinHeight * (i / 4));
  await page.waitForTimeout(900);
  await page.screenshot({ path: `/tmp/submit-act-${i}.png` });
}

// Scroll past the pin to reach the form
await page.evaluate((y) => window.scrollTo(0, y), start + pinHeight * 5);
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/submit-form.png" });

console.log("ERRORS:", JSON.stringify(errors.slice(0, 5)));
await browser.close();
console.log("done");
