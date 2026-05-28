/**
 * Single data-access layer. Components only import from here.
 *
 * Reads directly from Postgres via `lib/db.ts` (no ORM, no CMS) against
 * the uf_* tables. Adapts each row back to the original `College` / `Review`
 * shape so the frontend doesn't need to know the data source changed.
 */
import "server-only";
import { sql } from "@/lib/db";
import type {
  BrochureClaim,
  College,
  PlacementDatum,
  Review,
} from "@/lib/mock-data/types";

/* ─────────────────────── Colleges ─────────────────────── */

type CollegeRow = {
  id: number;
  slug: string;
  name: string;
  short_name: string;
  city: string;
  state: string;
  founded: number;
  category: College["category"];
  tier: College["tier"];
  case_file_number: string;
  primary_accent: string;
  fingerprint_seed: string;
  truth_score: number;
  review_count: number;
  verified_count: number;
  tagline: string;
  brochure_blurb: string;
  long_read_deck: string;
  long_read_paragraphs: string[];
  long_read_pull_quote: string;
  long_read_byline: string;
  fee_claimed: number;
  fee_actual: number;
  fee_note: string;
  placement_data: PlacementDatum[];
};

type BrochureClaimRow = {
  id: number;
  college_id: number;
  claim: string;
  truth: string;
  category: BrochureClaim["category"];
  delta: number;
  position: number;
};

export async function getAllColleges(): Promise<College[]> {
  const cols = await sql<CollegeRow[]>`
    SELECT id, slug, name, short_name, city, state, founded, category, tier,
           case_file_number, primary_accent, fingerprint_seed, truth_score,
           review_count, verified_count, tagline, brochure_blurb,
           long_read_deck, long_read_paragraphs, long_read_pull_quote, long_read_byline,
           fee_claimed, fee_actual, fee_note, placement_data
    FROM uf_colleges
    ORDER BY name
  `;
  if (!cols.length) return [];

  const ids = cols.map((c) => c.id);
  const claims = await sql<BrochureClaimRow[]>`
    SELECT id, college_id, claim, truth, category, delta, position
    FROM uf_brochure_claims
    WHERE college_id IN ${sql(ids)}
    ORDER BY college_id, position
  `;

  const claimsByCollege = new Map<number, BrochureClaimRow[]>();
  for (const c of claims) {
    const list = claimsByCollege.get(c.college_id) ?? [];
    list.push(c);
    claimsByCollege.set(c.college_id, list);
  }
  return cols.map((c) => rowToCollege(c, claimsByCollege.get(c.id) ?? []));
}

export async function getCollegeBySlug(slug: string): Promise<College | null> {
  const cols = await sql<CollegeRow[]>`
    SELECT id, slug, name, short_name, city, state, founded, category, tier,
           case_file_number, primary_accent, fingerprint_seed, truth_score,
           review_count, verified_count, tagline, brochure_blurb,
           long_read_deck, long_read_paragraphs, long_read_pull_quote, long_read_byline,
           fee_claimed, fee_actual, fee_note, placement_data
    FROM uf_colleges
    WHERE slug = ${slug}
    LIMIT 1
  `;
  const c = cols[0];
  if (!c) return null;
  const claims = await sql<BrochureClaimRow[]>`
    SELECT id, college_id, claim, truth, category, delta, position
    FROM uf_brochure_claims
    WHERE college_id = ${c.id}
    ORDER BY position
  `;
  return rowToCollege(c, claims);
}

/** Top-delta brochure claims across all colleges. */
export async function getFeaturedExposes(limit = 6) {
  const all = await getAllColleges();
  return all
    .flatMap((c) =>
      c.brochureClaims
        .filter((claim) => claim.delta >= 40)
        .map((claim) => ({ college: c, claim })),
    )
    .sort((a, b) => b.claim.delta - a.claim.delta)
    .slice(0, limit);
}

export async function getCollegeStats() {
  const [stats] = await sql<
    { colleges: number; reviews: number; avg_truth: number | null }[]
  >`
    SELECT
      (SELECT count(*)::int FROM uf_colleges) AS colleges,
      (SELECT count(*)::int FROM uf_reviews) AS reviews,
      (SELECT coalesce(round(avg(truth_score))::int, 0) FROM uf_colleges) AS avg_truth
  `;
  return {
    totalColleges: stats.colleges,
    totalReviews: stats.reviews,
    verifiedReviews: stats.reviews, // every row has a verification record
    avgTruthScore: stats.avg_truth ?? 0,
  };
}

/* ─────────────────────── FeaturedCases (cards) ─────────────────────── */

export type FeaturedCase = {
  college: string;
  truthGap: number;
  trend: number[];
  quote: string;
};

export async function getFeaturedCases(limit = 6): Promise<FeaturedCase[]> {
  const all = await getAllColleges();
  const candidates = all
    .map((c) => {
      const maxDelta = c.brochureClaims.reduce((m, x) => Math.max(m, x.delta), 0);
      return { college: c, maxDelta };
    })
    .filter((x) => x.maxDelta > 0)
    .sort((a, b) => b.maxDelta - a.maxDelta)
    .slice(0, limit);

  const cases: FeaturedCase[] = [];
  for (const { college: c, maxDelta } of candidates) {
    const trend = c.placementData
      .slice()
      .sort((a, b) => a.year - b.year)
      .map((p) => Math.max(0, Math.round(p.claimedPercentage - p.verifiedPercentage)));
    const topReview = (await getReviews({ collegeSlug: c.slug, limit: 1 }))[0];
    cases.push({
      college: c.shortName,
      truthGap: maxDelta,
      trend: trend.length ? trend : [maxDelta, maxDelta, maxDelta, maxDelta],
      quote: topReview?.title ?? c.tagline,
    });
  }
  return cases;
}

/* ─────────────────────── Reviews ─────────────────────── */

type ReviewRow = {
  id: number;
  ext_id: string | null;
  college_slug: string;
  author_pseudonym: string;
  author_year: 1 | 2 | 3 | 4 | 5;
  author_branch: string;
  rating: number;
  truth_score: number;
  title: string;
  body: string;
  tags: string[];
  vibe: Review["vibe"];
  has_video: boolean;
  verification_method: Review["verification"]["method"];
  verified_at: Date;
  published_at: Date;
  upvotes: number;
  receipts: number;
};

export async function getReviews(opts?: {
  collegeSlug?: string;
  vibe?: Review["vibe"];
  minTruthScore?: number;
  hasVideo?: boolean;
  limit?: number;
}): Promise<Review[]> {
  // We assemble the WHERE incrementally with the driver's `sql()` fragment
  // helper so each piece stays parameterized.
  const conds: ReturnType<typeof sql>[] = [];
  if (opts?.collegeSlug) conds.push(sql`college_slug = ${opts.collegeSlug}`);
  if (opts?.vibe) conds.push(sql`vibe = ${opts.vibe}`);
  if (typeof opts?.minTruthScore === "number")
    conds.push(sql`truth_score >= ${opts.minTruthScore}`);
  if (opts?.hasVideo) conds.push(sql`has_video = true`);

  const whereClause = conds.length
    ? conds.reduce((acc, c, i) => (i === 0 ? sql`WHERE ${c}` : sql`${acc} AND ${c}`), sql``)
    : sql``;

  const limit = opts?.limit ?? 1000;
  const rows = await sql<ReviewRow[]>`
    SELECT id, ext_id, college_slug, author_pseudonym, author_year, author_branch,
           rating, truth_score, title, body, tags, vibe, has_video,
           verification_method, verified_at, published_at, upvotes, receipts
    FROM uf_reviews
    ${whereClause}
    ORDER BY upvotes DESC
    LIMIT ${limit}
  `;
  return rows.map(rowToReview);
}

export type { College, Review };

/* ─────────────────────── adapters ─────────────────────── */

function rowToCollege(c: CollegeRow, claims: BrochureClaimRow[]): College {
  return {
    slug: c.slug,
    name: c.name,
    shortName: c.short_name,
    city: c.city,
    state: c.state,
    founded: c.founded,
    category: c.category,
    tier: c.tier,
    caseFileNumber: c.case_file_number,
    primaryAccent: c.primary_accent,
    fingerprintSeed: c.fingerprint_seed,
    truthScore: c.truth_score,
    reviewCount: c.review_count,
    verifiedCount: c.verified_count,
    tagline: c.tagline,
    brochureBlurb: c.brochure_blurb,
    brochureClaims: claims.map((cl) => ({
      id: `${c.slug}-claim-${cl.position + 1}`,
      claim: cl.claim,
      truth: cl.truth,
      category: cl.category,
      delta: cl.delta,
    })),
    placementData: c.placement_data ?? [],
    longRead: {
      deck: c.long_read_deck,
      paragraphs: c.long_read_paragraphs ?? [],
      pullQuote: c.long_read_pull_quote,
      byline: c.long_read_byline,
    },
    feeStructure: {
      claimed: c.fee_claimed,
      actual: c.fee_actual,
      note: c.fee_note,
    },
  };
}

function rowToReview(r: ReviewRow): Review {
  return {
    id: r.ext_id ?? `r-${r.id}`,
    collegeSlug: r.college_slug,
    authorPseudonym: r.author_pseudonym,
    authorYear: r.author_year,
    authorBranch: r.author_branch,
    rating: r.rating,
    truthScore: r.truth_score,
    title: r.title,
    body: r.body,
    tags: r.tags ?? [],
    vibe: r.vibe,
    hasVideo: r.has_video,
    verification: {
      method: r.verification_method,
      verifiedAt: r.verified_at.toISOString(),
    },
    publishedAt: r.published_at.toISOString(),
    upvotes: r.upvotes,
    receipts: r.receipts,
  };
}
