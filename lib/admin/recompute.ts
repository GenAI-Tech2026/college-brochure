import "server-only";
import { sql } from "@/lib/db";

/**
 * Derived college metrics.
 *
 * `truth_score`, `review_count` and `verified_count` on uf_colleges are no
 * longer hand-typed — they're computed from the published reviews and the
 * brochure-claim deltas so they can't drift out of sync as content lands.
 *
 *   review_count   = published reviews for the college's slug
 *   verified_count = same (every review row carries a verification record)
 *   truth_score    = how honest the brochure is, 0–100 (higher = more honest)
 *                    blend of (100 − avg claim delta) and avg review truth_score
 *
 * Call after anything that changes reviews or brochure claims. It's cheap
 * (two aggregates) and idempotent.
 */

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Recompute one college by id. No-op if the id doesn't exist. */
export async function recomputeCollege(collegeId: number): Promise<void> {
  const [college] = await sql<{ slug: string; truth_score: number }[]>`
    SELECT slug, truth_score FROM uf_colleges WHERE id = ${collegeId} LIMIT 1
  `;
  if (!college) return;

  const [[reviewAgg], [claimAgg]] = await Promise.all([
    sql<{ count: number; avg_truth: number | null }[]>`
      SELECT count(*)::int AS count, avg(truth_score)::float AS avg_truth
      FROM uf_reviews
      WHERE college_slug = ${college.slug}
    `,
    sql<{ avg_delta: number | null }[]>`
      SELECT avg(delta)::float AS avg_delta
      FROM uf_brochure_claims
      WHERE college_id = ${collegeId}
    `,
  ]);

  const parts: number[] = [];
  if (claimAgg.avg_delta != null) parts.push(100 - claimAgg.avg_delta);
  if (reviewAgg.avg_truth != null) parts.push(reviewAgg.avg_truth);

  // No signal at all → leave the existing score untouched.
  const truthScore = parts.length
    ? clamp(parts.reduce((s, p) => s + p, 0) / parts.length)
    : college.truth_score;

  await sql`
    UPDATE uf_colleges SET
      review_count   = ${reviewAgg.count},
      verified_count = ${reviewAgg.count},
      truth_score    = ${truthScore},
      updated_at     = now()
    WHERE id = ${collegeId}
  `;
}

/** Recompute by slug (used when we only have a review's college_slug). */
export async function recomputeCollegeBySlug(slug: string): Promise<void> {
  const [c] = await sql<{ id: number }[]>`
    SELECT id FROM uf_colleges WHERE slug = ${slug} LIMIT 1
  `;
  if (c) await recomputeCollege(c.id);
}

/** Recompute every college. Wired to the dashboard "Recompute" button. */
export async function recomputeAllColleges(): Promise<number> {
  const ids = await sql<{ id: number }[]>`SELECT id FROM uf_colleges`;
  for (const { id } of ids) await recomputeCollege(id);
  return ids.length;
}
