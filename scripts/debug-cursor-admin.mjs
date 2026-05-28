import { chromium } from "playwright";

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("CONSOLE: " + m.text());
});

// ── 1. Custom cursor on /
console.log("== /  (custom cursor) ==");
await page.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2000);

const cursorState = await page.evaluate(() => {
  const dot = Array.from(document.querySelectorAll('[data-cursor="ignore"]')).find(
    (e) => e.className.includes("z-[10000]"),
  );
  const ring = Array.from(document.querySelectorAll('[data-cursor="ignore"]')).find(
    (e) => e.className.includes("z-[9999]"),
  );
  const bodyCursor = getComputedStyle(document.body).cursor;
  return {
    dotFound: !!dot,
    ringFound: !!ring,
    dotStyles: dot ? {
      transform: getComputedStyle(dot).transform,
      visibility: getComputedStyle(dot).visibility,
      display: getComputedStyle(dot).display,
      position: getComputedStyle(dot).position,
      zIndex: getComputedStyle(dot).zIndex,
      mixBlendMode: getComputedStyle(dot).mixBlendMode,
      width: getComputedStyle(dot).width,
      height: getComputedStyle(dot).height,
    } : null,
    ringStyles: ring ? {
      transform: getComputedStyle(ring).transform,
      width: getComputedStyle(ring).width,
      height: getComputedStyle(ring).height,
      borderColor: getComputedStyle(ring).borderColor,
    } : null,
    bodyCursor,
  };
});
console.log(JSON.stringify(cursorState, null, 2));

// Move mouse — see if cursor div transforms
await page.mouse.move(700, 400);
await page.waitForTimeout(500);
const afterMove = await page.evaluate(() => {
  const dot = Array.from(document.querySelectorAll('[data-cursor="ignore"]')).find(
    (e) => e.className.includes("z-[10000]"),
  );
  return dot ? { transform: getComputedStyle(dot).transform } : null;
});
console.log("after move:", JSON.stringify(afterMove));

console.log("ERRORS_HOME:", JSON.stringify(errors));

// ── 2. /admin styling
console.log("== /admin (styling) ==");
errors.length = 0;
await page.goto("http://localhost:3001/admin", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: "/tmp/admin-login.png", fullPage: true });

const adminCheck = await page.evaluate(() => {
  const css = Array.from(document.styleSheets).map((s) => {
    try {
      return { href: s.href, rules: s.cssRules?.length ?? 0 };
    } catch (e) {
      return { href: s.href, error: String(e) };
    }
  });
  const body = document.body;
  return {
    title: document.title,
    bodyClasses: body.className,
    bodyFontFamily: getComputedStyle(body).fontFamily,
    bodyBackground: getComputedStyle(body).backgroundColor,
    css: css.slice(0, 30),
    hasPayloadStyles: !!document.querySelector("link[href*='payload']"),
    hasPayloadFrame: !!document.querySelector(".payload__"),
    headlineText: document.querySelector("h1, h2, .login__title, [class*='Login']")?.textContent?.slice(0, 100),
  };
});
console.log(JSON.stringify(adminCheck, null, 2));
console.log("ERRORS_ADMIN:", JSON.stringify(errors));

await browser.close();
