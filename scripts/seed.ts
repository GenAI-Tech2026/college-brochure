/**
 * Seed the new uf_* tables from lib/mock-data.
 *
 * Idempotent: upserts on natural keys (slug for colleges, ext_id for reviews,
 * pseudonym for verified-students, headline for truth-revelations, and a
 * (college_id, position) composite for brochure-claims).
 *
 * Creates a first-run admin user (admin@unfiltered.dev / unfiltered) if
 * the users table is empty.
 *
 * Run with: `npm run seed`
 */
import "dotenv/config";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { colleges as mockColleges } from "../lib/mock-data/colleges";
import { reviews as mockReviews } from "../lib/mock-data/reviews";

const ADMIN_EMAIL = "admin@unfiltered.dev";
const ADMIN_PASSWORD = "unfiltered";

function client(uri: string) {
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

const sql = client(process.env.DATABASE_URI!);

async function main() {
  /* ── First-run admin user ───────────────────────────────────────────────── */
  const [{ count: userCount }] = await sql<{ count: number }[]>`
    SELECT count(*)::int FROM uf_users
  `;
  if (userCount === 0) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await sql`
      INSERT INTO uf_users (email, password_hash, name)
      VALUES (${ADMIN_EMAIL}, ${hash}, ${"Unfiltered admin"})
    `;
    console.log(`[seed] created admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else {
    console.log(`[seed] ${userCount} user(s) present, skipping admin create`);
  }

  /* ── Colleges ──────────────────────────────────────────────────────────── */
  const collegeIdBySlug = new Map<string, number>();
  for (const c of mockColleges) {
    const [row] = await sql<{ id: number }[]>`
      INSERT INTO uf_colleges (
        slug, name, short_name, city, state, founded, category, tier,
        case_file_number, primary_accent, fingerprint_seed, truth_score,
        review_count, verified_count, tagline, brochure_blurb,
        long_read_deck, long_read_paragraphs, long_read_pull_quote, long_read_byline,
        fee_claimed, fee_actual, fee_note, placement_data, updated_at
      )
      VALUES (
        ${c.slug}, ${c.name}, ${c.shortName}, ${c.city}, ${c.state},
        ${c.founded}, ${c.category}, ${c.tier},
        ${c.caseFileNumber}, ${c.primaryAccent}, ${c.fingerprintSeed}, ${c.truthScore},
        ${c.reviewCount}, ${c.verifiedCount}, ${c.tagline}, ${c.brochureBlurb},
        ${c.longRead.deck}, ${c.longRead.paragraphs}, ${c.longRead.pullQuote}, ${c.longRead.byline},
        ${c.feeStructure.claimed}, ${c.feeStructure.actual}, ${c.feeStructure.note},
        ${JSON.stringify(c.placementData)}, now()
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        short_name = EXCLUDED.short_name,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        founded = EXCLUDED.founded,
        category = EXCLUDED.category,
        tier = EXCLUDED.tier,
        case_file_number = EXCLUDED.case_file_number,
        primary_accent = EXCLUDED.primary_accent,
        fingerprint_seed = EXCLUDED.fingerprint_seed,
        truth_score = EXCLUDED.truth_score,
        review_count = EXCLUDED.review_count,
        verified_count = EXCLUDED.verified_count,
        tagline = EXCLUDED.tagline,
        brochure_blurb = EXCLUDED.brochure_blurb,
        long_read_deck = EXCLUDED.long_read_deck,
        long_read_paragraphs = EXCLUDED.long_read_paragraphs,
        long_read_pull_quote = EXCLUDED.long_read_pull_quote,
        long_read_byline = EXCLUDED.long_read_byline,
        fee_claimed = EXCLUDED.fee_claimed,
        fee_actual = EXCLUDED.fee_actual,
        fee_note = EXCLUDED.fee_note,
        placement_data = EXCLUDED.placement_data,
        updated_at = now()
      RETURNING id
    `;
    collegeIdBySlug.set(c.slug, row.id);

    // Replace this college's brochure_claims (simpler than upserting each row).
    await sql`DELETE FROM uf_brochure_claims WHERE college_id = ${row.id}`;
    for (let i = 0; i < c.brochureClaims.length; i++) {
      const cl = c.brochureClaims[i];
      await sql`
        INSERT INTO uf_brochure_claims
          (college_id, claim, truth, category, delta, position)
        VALUES
          (${row.id}, ${cl.claim}, ${cl.truth}, ${cl.category}, ${cl.delta}, ${i})
      `;
    }
    console.log(`[seed] college · ${c.shortName} (+${c.brochureClaims.length} claims)`);
  }

  /* ── Reviews ───────────────────────────────────────────────────────────── */
  for (const r of mockReviews) {
    await sql`
      INSERT INTO uf_reviews (
        ext_id, college_slug, author_pseudonym, author_year, author_branch,
        rating, truth_score, title, body, tags, vibe, has_video,
        verification_method, verified_at, published_at, upvotes, receipts, updated_at
      )
      VALUES (
        ${r.id}, ${r.collegeSlug}, ${r.authorPseudonym}, ${r.authorYear}, ${r.authorBranch},
        ${r.rating}, ${r.truthScore}, ${r.title}, ${r.body}, ${r.tags}, ${r.vibe}, ${r.hasVideo},
        ${r.verification.method}, ${r.verification.verifiedAt}, ${r.publishedAt},
        ${r.upvotes}, ${r.receipts}, now()
      )
      ON CONFLICT (ext_id) DO UPDATE SET
        college_slug = EXCLUDED.college_slug,
        author_pseudonym = EXCLUDED.author_pseudonym,
        author_year = EXCLUDED.author_year,
        author_branch = EXCLUDED.author_branch,
        rating = EXCLUDED.rating,
        truth_score = EXCLUDED.truth_score,
        title = EXCLUDED.title,
        body = EXCLUDED.body,
        tags = EXCLUDED.tags,
        vibe = EXCLUDED.vibe,
        has_video = EXCLUDED.has_video,
        verification_method = EXCLUDED.verification_method,
        verified_at = EXCLUDED.verified_at,
        published_at = EXCLUDED.published_at,
        upvotes = EXCLUDED.upvotes,
        receipts = EXCLUDED.receipts,
        updated_at = now()
    `;
  }
  console.log(`[seed] reviews · ${mockReviews.length} upserted`);

  /* ── VerifiedStudents (derived from reviews) ───────────────────────────── */
  const studentByPseudonym = new Map<
    string,
    {
      pseudonym: string;
      method: string;
      verifiedAt: string;
      collegeSlug: string;
      count: number;
    }
  >();
  for (const r of mockReviews) {
    const prev = studentByPseudonym.get(r.authorPseudonym);
    if (prev) {
      prev.count += 1;
      continue;
    }
    studentByPseudonym.set(r.authorPseudonym, {
      pseudonym: r.authorPseudonym,
      method: r.verification.method,
      verifiedAt: r.verification.verifiedAt,
      collegeSlug: r.collegeSlug,
      count: 1,
    });
  }
  for (const s of studentByPseudonym.values()) {
    const collegeId = collegeIdBySlug.get(s.collegeSlug) ?? null;
    await sql`
      INSERT INTO uf_verified_students
        (pseudonym, verification_method, verified_at, college_id,
         submitted_review_count, trust_score, updated_at)
      VALUES
        (${s.pseudonym}, ${s.method}, ${s.verifiedAt}, ${collegeId},
         ${s.count}, ${50}, now())
      ON CONFLICT (pseudonym) DO UPDATE SET
        verification_method = EXCLUDED.verification_method,
        verified_at = EXCLUDED.verified_at,
        college_id = EXCLUDED.college_id,
        submitted_review_count = EXCLUDED.submitted_review_count,
        updated_at = now()
    `;
  }
  console.log(`[seed] verified-students · ${studentByPseudonym.size} upserted`);

  /* ── TruthRevelations (top-delta claims, editorially) ──────────────────── */
  const featured = mockColleges
    .flatMap((c) => c.brochureClaims.map((claim) => ({ college: c, claim })))
    .filter((x) => x.claim.delta >= 40)
    .sort((a, b) => b.claim.delta - a.claim.delta)
    .slice(0, 6);

  // Clear and re-insert — easier than diffing.
  await sql`DELETE FROM uf_truth_revelations`;
  for (const f of featured) {
    const headline = `${f.college.shortName}: ${f.claim.claim.replace(/\.$/, "")}`;
    const collegeId = collegeIdBySlug.get(f.college.slug)!;
    await sql`
      INSERT INTO uf_truth_revelations
        (headline, dek, college_id, featured_at, weight)
      VALUES
        (${headline}, ${f.claim.truth}, ${collegeId}, now(), ${f.claim.delta})
    `;
  }
  console.log(`[seed] truth-revelations · ${featured.length} inserted`);

  console.log("[seed] done");
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end({ timeout: 1 }).catch(() => {});
  process.exit(1);
});
