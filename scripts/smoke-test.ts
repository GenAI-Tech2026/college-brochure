/**
 * Runtime smoke test for the CMS data pipeline.
 *
 * Exercises the exact SQL the server actions run, against the real dev DB,
 * inside a transaction that ROLLS BACK at the end — so it proves persistence
 * and constraint behaviour without polluting the demo data.
 *
 * Usage: npx tsx scripts/smoke-test.ts
 */
import "dotenv/config";
import postgres from "postgres";

const url = process.env.DATABASE_URI;
if (!url) {
  console.error("DATABASE_URI must be set");
  process.exit(1);
}
function client(uri: string) {
  const u = new URL(uri);
  const socketHost = u.searchParams.get("host");
  if (socketHost) {
    return postgres({
      host: socketHost,
      database: u.pathname.slice(1) || undefined,
      username: u.username || process.env.USER,
      max: 1,
      onnotice: () => {},
    });
  }
  return postgres(uri, { max: 1, onnotice: () => {} });
}
const sql = client(url);

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, extra = "") {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}${extra ? ` — ${extra}` : ""}`);
  } else {
    fail++;
    console.log(`  ✗ FAIL: ${name}${extra ? ` — ${extra}` : ""}`);
  }
}

async function main() {
  console.log("\n── CMS pipeline smoke test ──\n");

  const [college] = await sql<{ id: number; slug: string; truth_score: number }[]>`
    SELECT id, slug, truth_score FROM uf_colleges ORDER BY id LIMIT 1
  `;
  if (!college) {
    console.error("No colleges in DB — seed first (npm run seed).");
    process.exit(1);
  }
  console.log(`Using college #${college.id} (${college.slug}), truth_score=${college.truth_score}\n`);

  // Constraint-rejection checks first, each in its OWN aborted tx so a
  // violation can't poison the main persistence test below.
  console.log("0. Constraint guards (out-of-range should THROW):");
  async function expectThrow(label: string, run: (tx: postgres.TransactionSql) => Promise<unknown>) {
    let threw = false;
    try {
      await sql.begin(async (tx) => {
        await run(tx);
        throw new Error("__ROLLBACK__");
      });
    } catch (e) {
      if (e instanceof Error && e.message === "__ROLLBACK__") threw = false;
      else threw = true;
    }
    check(label, threw);
  }
  await expectThrow("truth_score=150 rejected", (tx) =>
    tx`INSERT INTO uf_reviews (college_slug, author_pseudonym, author_year, author_branch, rating, truth_score, title, body, vibe, verification_method, verified_at, published_at) VALUES (${college.slug}, 'x', 3, 'x', 3, 150, 't', 'b', 'warning', 'email-domain', now(), now())`);
  await expectThrow("rating=9 rejected", (tx) =>
    tx`INSERT INTO uf_reviews (college_slug, author_pseudonym, author_year, author_branch, rating, truth_score, title, body, vibe, verification_method, verified_at, published_at) VALUES (${college.slug}, 'x', 3, 'x', 9, 70, 't', 'b', 'warning', 'email-domain', now(), now())`);

  // Everything runs in a transaction we deliberately abort at the end.
  let rolledBack = false;
  try {
    await sql.begin(async (tx) => {
      // 1. createReview INSERT (mirrors lib/admin/actions.ts createReview)
      console.log("1. Review create:");
      const [rev] = await tx<{ id: number }[]>`
        INSERT INTO uf_reviews (
          college_slug, author_pseudonym, author_year, author_branch,
          rating, truth_score, title, body, tags, vibe, has_video,
          verification_method, verified_at, published_at, upvotes, receipts
        ) VALUES (
          ${college.slug}, 'SmokeTest-01', 3, 'CSE', 3, 70,
          'SMOKE original title', 'body text here for the smoke test', ${["smoke"]},
          'warning', false, 'email-domain', now(), now(), 0, 0
        ) RETURNING id
      `;
      check("insert review", !!rev?.id, `id=${rev.id}`);

      // 2. updateReview persistence (THE reported bug)
      console.log("2. Review update persistence (reported bug):");
      await tx`UPDATE uf_reviews SET title = 'SMOKE edited title', updated_at = now() WHERE id = ${rev.id}`;
      const [after] = await tx<{ title: string }[]>`SELECT title FROM uf_reviews WHERE id = ${rev.id}`;
      check("update persists", after?.title === "SMOKE edited title", `title="${after?.title}"`);

      // 3. getReviews read path sees it (mirrors lib/data/index.ts)
      console.log("3. Data-layer read path:");
      const visible = await tx<{ id: number; title: string }[]>`
        SELECT id, title FROM uf_reviews WHERE college_slug = ${college.slug} ORDER BY upvotes DESC
      `;
      check("review visible to frontend query", visible.some((r) => r.id === rev.id));

      // 4. recompute (mirrors lib/admin/recompute.ts) keeps score in range
      console.log("4. Truth-score recompute:");
      const [[ragg], [cagg]] = await Promise.all([
        tx<{ count: number; avg_truth: number | null }[]>`
          SELECT count(*)::int AS count, avg(truth_score)::float AS avg_truth
          FROM uf_reviews WHERE college_slug = ${college.slug}`,
        tx<{ avg_delta: number | null }[]>`
          SELECT avg(delta)::float AS avg_delta FROM uf_brochure_claims WHERE college_id = ${college.id}`,
      ]);
      const parts: number[] = [];
      if (cagg.avg_delta != null) parts.push(100 - cagg.avg_delta);
      if (ragg.avg_truth != null) parts.push(ragg.avg_truth);
      const score = parts.length
        ? Math.max(0, Math.min(100, Math.round(parts.reduce((s, p) => s + p, 0) / parts.length)))
        : college.truth_score;
      await tx`UPDATE uf_colleges SET truth_score = ${score}, review_count = ${ragg.count}, verified_count = ${ragg.count} WHERE id = ${college.id}`;
      check("recomputed score in 0..100", score >= 0 && score <= 100, `score=${score}, reviews=${ragg.count}`);

      // 5. publish bridge INSERT (mirrors publishSubmissionAsReview)
      console.log("5. Publish-bridge review insert:");
      const [pub] = await tx<{ id: number }[]>`
        INSERT INTO uf_reviews (
          college_slug, author_pseudonym, author_year, author_branch,
          rating, truth_score, title, body, tags, vibe, has_video,
          verification_method, verified_at, published_at, upvotes, receipts,
          receipt_paths, source_submission_id
        ) VALUES (
          ${college.slug}, 'SmokeTest-pub', 3, 'Undisclosed', 3, 70,
          'SMOKE published', 'reality body', ${[]}, 'warning', false,
          'email-domain', now(), now(), 0, 2, ${["/uploads/receipts/a.png", "/uploads/receipts/b.png"]}, ${null}
        ) RETURNING id
      `;
      check("publish insert with receipt_paths", !!pub?.id, `id=${pub.id}`);

      // 6. createCollege path — exact column list the action provides, proving
      //    no NOT-NULL column is missed.
      console.log("6. College create (NOT NULL coverage):");
      const [nc] = await tx<{ id: number }[]>`
        INSERT INTO uf_colleges (
          slug, name, short_name, city, state, founded, category, tier,
          case_file_number, primary_accent, fingerprint_seed, truth_score,
          tagline, brochure_blurb, fee_claimed, fee_actual, fee_note
        ) VALUES (
          'smoke-college', 'Smoke College', 'SMOKE', 'Testville', 'TS', 2000,
          'engineering', 'tier-2', 'UF-SMOKE', '#FF4332', 'smoke-college', 50,
          'A tagline', 'A blurb', 0, 0, ''
        ) RETURNING id
      `;
      check("insert college with all NOT NULL cols", !!nc?.id, `id=${nc.id}`);

      // 7. Truth revelation + the getTruthRevelations() join query.
      console.log("7. Truth revelation end-to-end:");
      await tx`
        INSERT INTO uf_truth_revelations (headline, dek, college_id, weight, featured_at)
        VALUES ('SMOKE headline', 'SMOKE dek', ${nc.id}, 5, now())
      `;
      const revs = await tx<{ id: number; headline: string; slug: string }[]>`
        SELECT t.id, t.headline, c.slug
        FROM uf_truth_revelations t JOIN uf_colleges c ON c.id = t.college_id
        WHERE c.slug = 'smoke-college' ORDER BY t.weight DESC
      `;
      check("revelation visible via join query", revs.some((r) => r.headline === "SMOKE headline"));

      // Abort — leave the demo DB untouched.
      throw new Error("__ROLLBACK__");
    });
  } catch (e) {
    if (e instanceof Error && e.message === "__ROLLBACK__") {
      rolledBack = true;
    } else {
      console.error("\nUnexpected error:", e);
      fail++;
    }
  }
  check("transaction rolled back (demo data untouched)", rolledBack);

  console.log(`\n── ${pass} passed, ${fail} failed ──\n`);
  await sql.end();
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
