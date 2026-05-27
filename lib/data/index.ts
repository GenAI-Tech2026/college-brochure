/**
 * Single data-access layer. Components only import from here.
 * Swap mock-data → Payload by changing only the bodies below.
 */
import { colleges } from "@/lib/mock-data/colleges";
import { reviews } from "@/lib/mock-data/reviews";
import type { College, Review } from "@/lib/mock-data/types";

export async function getAllColleges(): Promise<College[]> {
  return colleges;
}

export async function getCollegeBySlug(slug: string): Promise<College | null> {
  return colleges.find((c) => c.slug === slug) ?? null;
}

export async function getReviews(opts?: {
  collegeSlug?: string;
  vibe?: Review["vibe"];
  minTruthScore?: number;
  hasVideo?: boolean;
  limit?: number;
}): Promise<Review[]> {
  let r = reviews.slice();
  if (opts?.collegeSlug) r = r.filter((x) => x.collegeSlug === opts.collegeSlug);
  if (opts?.vibe) r = r.filter((x) => x.vibe === opts.vibe);
  if (typeof opts?.minTruthScore === "number") r = r.filter((x) => x.truthScore >= opts.minTruthScore!);
  if (opts?.hasVideo) r = r.filter((x) => x.hasVideo);
  r.sort((a, b) => b.upvotes - a.upvotes);
  if (opts?.limit) r = r.slice(0, opts.limit);
  return r;
}

/**
 * Editorially-featured exposés for the landing page. In the mock layer
 * we derive them from the highest-delta brochure claims across colleges.
 */
export async function getFeaturedExposes(limit = 6) {
  const featured = colleges
    .flatMap((c) =>
      c.brochureClaims
        .filter((claim) => claim.delta >= 40)
        .map((claim) => ({ college: c, claim }))
    )
    .sort((a, b) => b.claim.delta - a.claim.delta)
    .slice(0, limit);
  return featured;
}

export async function getCollegeStats() {
  const totalColleges = colleges.length;
  const totalReviews = reviews.length;
  const verifiedReviews = reviews.filter((r) => r.verification).length;
  const avgTruthScore = Math.round(
    colleges.reduce((sum, c) => sum + c.truthScore, 0) / totalColleges
  );
  return { totalColleges, totalReviews, verifiedReviews, avgTruthScore };
}

export type { College, Review };
