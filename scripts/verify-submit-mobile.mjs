import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
page.on("console", (m) => { if (m.type() === "error") errors.push("c: " + m.text().slice(0, 200)); });

await page.goto("http://localhost:3001/submit", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: "/tmp/submit-m-01-top.png" });

const intake = await page.locator('[aria-label="The intake procedure"]');
await intake.scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);
await page.screenshot({ path: "/tmp/submit-m-02-act1.png" });

// Scroll deeper into the pin
const start = await intake.evaluate((el) => window.scrollY + el.getBoundingClientRect().top);
const pinHeight = await intake.evaluate((el) => {
  const inner = el.querySelector(":scope > div");
  return inner ? inner.offsetHeight : 800;
});
for (let i = 1; i <= 4; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), start + pinHeight * (i / 4));
  await page.waitForTimeout(700);
  await page.screenshot({ path: `/tmp/submit-m-act-${i}.png` });
}

await page.evaluate((y) => window.scrollTo(0, y), start + pinHeight * 5);
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/submit-m-form.png" });

console.log("ERRORS_MOBILE:", JSON.stringify(errors.slice(0, 5)));
await browser.close();
console.log("done");
