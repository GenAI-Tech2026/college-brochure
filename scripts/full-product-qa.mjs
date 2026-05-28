import { chromium } from "playwright";
import postgres from "postgres";

const BASE = "http://localhost:3001";

// Connect to Postgres so we can verify the submission landed.
function client(uri) {
  const u = new URL(uri);
  const socketHost = u.searchParams.get("host");
  if (socketHost) {
    return postgres({
      host: socketHost,
      database: u.pathname.slice(1) || undefined,
      username: u.username || process.env.USER,
      max: 1,
    });
  }
  return postgres(uri, { max: 1 });
}
const sql = client(process.env.DATABASE_URI || "postgresql:///unfiltered_dev?host=/var/run/postgresql");

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });

async function snap(name, page, viewport) {
  const tag = viewport === "mobile" ? "m" : "d";
  await page.screenshot({ path: `/tmp/qa-${tag}-${name}.png`, fullPage: false });
}

// ── 1. SUBMIT → DB end-to-end ────────────────────────────────────────
console.log("== SUBMIT → DB ==");
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push("p: " + e.message.slice(0, 180)));
  page.on("console", (m) => {
    if (m.type() === "error") {
      const t = m.text();
      if (!t.includes("Failed to load resource")) errs.push("c: " + t.slice(0, 180));
    }
  });

  const beforeCount = (await sql`SELECT count(*)::int FROM uf_submissions`)[0].count;
  console.log("  before:", beforeCount, "submissions");

  await page.goto(BASE + "/submit", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.evaluate(() => localStorage.removeItem("uf:submit:draft:v1"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  // Walk the 6 steps
  await page.fill('input[name="college"]', "Institute of Technical Excellence, Bombay");
  await page.locator("button:has-text('Continue')").click();
  await page.waitForTimeout(1400);

  await page.fill('textarea', "100% placement record claimed across every branch every year.");
  await page.locator("button:has-text('Continue')").click();
  await page.waitForTimeout(1400);

  await page.fill('textarea', "Verified 71% after removing unpaid internships. Mech branch at 48%.");
  await page.locator("button:has-text('Continue')").click();
  await page.waitForTimeout(900);

  // receipts default yes
  await page.locator("button:has-text('Continue')").click();
  await page.waitForTimeout(800);

  await page.fill('input[name="email"]', "echo-841@iitb.ac.in");
  await page.locator("button:has-text('Continue')").click();
  await page.waitForTimeout(900);

  // identity default anonymous → last step shows TRANSMIT SIGNAL
  await page.locator("button:has-text('Transmit signal')").click();

  // Wait for the 10s hero to play out
  await page.waitForTimeout(11500);
  await snap("submit-success", page, "desktop");

  // Confirm DB now has one more row
  const afterCount = (await sql`SELECT count(*)::int FROM uf_submissions`)[0].count;
  const latest = (await sql`
    SELECT case_no, college_name, pseudonym, status, has_receipts
    FROM uf_submissions ORDER BY id DESC LIMIT 1
  `)[0];
  console.log("  after:", afterCount, "submissions");
  console.log("  latest:", latest);

  if (afterCount !== beforeCount + 1) {
    console.error("  ❌ submission was NOT persisted");
  } else {
    console.log("  ✓ submission persisted as", latest.case_no);
  }
  console.log("  errs:", errs.length);
  await ctx.close();
}

// ── 2. /admin/submissions inbox visible ──────────────────────────────
console.log("\n== ADMIN: submissions inbox ==");
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/admin/login", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.fill('input[name="email"]', "admin@unfiltered.dev");
  await page.fill('input[name="password"]', "unfiltered");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin$/, { timeout: 15000 });
  await page.waitForTimeout(1000);
  await snap("admin-dashboard", page, "desktop");

  await page.goto(BASE + "/admin/submissions", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(900);
  const rows = await page.locator("table tbody tr").count();
  console.log("  /admin/submissions rows:", rows);
  await snap("admin-submissions", page, "desktop");

  // Open the latest submission
  const first = page.locator('a:has-text("Open")').first();
  if ((await first.count()) > 0) {
    await first.click();
    await page.waitForTimeout(900);
    await snap("admin-submission-detail", page, "desktop");

    // Verify it
    const verifyBtn = page.locator('button:has-text("Verify")');
    if ((await verifyBtn.count()) > 0) {
      await verifyBtn.click();
      await page.waitForLoadState("networkidle", { timeout: 10000 });
      await page.waitForTimeout(600);
      await snap("admin-submission-verified", page, "desktop");
      const latest = (await sql`SELECT status FROM uf_submissions ORDER BY id DESC LIMIT 1`)[0];
      console.log("  after verify, status =", latest.status);
    }
  }
  await ctx.close();
}

// ── 3. Mobile + desktop snapshots of every frontend route ────────────
console.log("\n== SNAPSHOTS: every route × 2 viewports ==");
const routes = [
  ["/", "home"],
  ["/colleges", "colleges"],
  ["/college/institute-technical-excellence-bombay", "college-ite"],
  ["/showcase", "showcase"],
  ["/submit", "submit"],
  ["/verified", "verified"],
  ["/wall-of-receipts", "wall"],
];
for (const vp of [
  { name: "desktop", w: 1440, h: 900 },
  { name: "mobile",  w: 390,  h: 844 },
]) {
  for (const [path, name] of routes) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    if (path === "/colleges") {
      await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
      // bypass intro for the screenshot
      await page.evaluate(() => sessionStorage.setItem("uf:dossierIntroSeen", "1"));
    }
    try {
      await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(2500);
      await snap(name, page, vp.name);
      console.log(`  ${vp.name} ${path} ✓`);
    } catch (e) {
      console.log(`  ${vp.name} ${path} ERR ${e.message.slice(0, 60)}`);
    }
    await ctx.close();
  }
}

// ── 4. Scroll-driven dossier specific snapshots ──────────────────────
console.log("\n== DOSSIER: scroll-driven ==");
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/colleges", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await snap("dossier-scroll-0", page, "desktop");

  // Scroll in 4 stages
  const vh = 900;
  for (let i = 1; i <= 4; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), vh * (i * 0.7));
    await page.waitForTimeout(900);
    await snap(`dossier-scroll-${i}`, page, "desktop");
  }
}

await browser.close();
await sql.end({ timeout: 1 }).catch(() => {});
console.log("\nDONE");
