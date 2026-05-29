/**
 * Reality math — pure helpers that turn the raw claim/verified pairs into
 * the few numbers a visitor actually needs to answer "what is the reality
 * at this college?".
 *
 * Everything here is derived from data the page already loads (College +
 * Review[]). No new data sources. Reused by the college page components and
 * the dynamic OG image so the headline numbers never drift between them.
 */
import type { College, Review } from "@/lib/mock-data/types";

/** Format paise-free rupee amounts the way Indians read them. */
export function formatINR(n: number): string {
  if (n >= 100000) {
    const l = n / 100000;
    // 8 → "8", 8.25 → "8.3" — one decimal, no trailing ".0"
    const s = l >= 10 ? Math.round(l).toString() : l.toFixed(1).replace(/\.0$/, "");
    return `₹${s}L`;
  }
  return `₹${n.toLocaleString("en-IN")}`;
}

export interface RealityGap {
  /** Mean brochure overstatement across all claims, 0–100. The headline number. */
  overstatementPct: number;
  truthScore: number;
  /** Latest-year placement claim vs verified. */
  placement: {
    year: number;
    claimedPct: number;
    verifiedPct: number;
    claimedLpa: number;
    verifiedLpa: number;
    /** percentage-points dropped, claimed − verified */
    gapPts: number;
  } | null;
  fee: {
    claimed: number;
    actual: number;
    /** how much more than advertised, as a %, rounded */
    extraPct: number;
    note: string;
  } | null;
  /** The single most-overstated claim — the worst offender. */
  worstClaim: { claim: string; truth: string; category: string; delta: number } | null;
}

export function computeRealityGap(college: College): RealityGap {
  const claims = college.brochureClaims ?? [];
  const overstatementPct = claims.length
    ? Math.round(claims.reduce((s, c) => s + c.delta, 0) / claims.length)
    : 0;

  const latest = (college.placementData ?? [])
    .slice()
    .sort((a, b) => b.year - a.year)[0];

  const fee = college.feeStructure
    ? {
        claimed: college.feeStructure.claimed,
        actual: college.feeStructure.actual,
        extraPct: college.feeStructure.claimed
          ? Math.round(
              ((college.feeStructure.actual - college.feeStructure.claimed) /
                college.feeStructure.claimed) *
                100
            )
          : 0,
        note: college.feeStructure.note,
      }
    : null;

  const worst = claims.length
    ? claims.reduce((a, b) => (b.delta > a.delta ? b : a))
    : null;

  return {
    overstatementPct,
    truthScore: college.truthScore,
    placement: latest
      ? {
          year: latest.year,
          claimedPct: latest.claimedPercentage,
          verifiedPct: latest.verifiedPercentage,
          claimedLpa: latest.claimedAvgLpa,
          verifiedLpa: latest.verifiedAvgLpa,
          gapPts: latest.claimedPercentage - latest.verifiedPercentage,
        }
      : null,
    fee,
    worstClaim: worst
      ? { claim: worst.claim, truth: worst.truth, category: worst.category, delta: worst.delta }
      : null,
  };
}

const METHOD_LABELS: Record<Review["verification"]["method"], string> = {
  "id-card": "ID card",
  "email-domain": "college email",
  "alumni-roster": "alumni roster",
  "video-selfie": "video selfie",
};

export interface VerificationSummary {
  total: number;
  withVideo: number;
  totalReceipts: number;
  /** verification methods present, with counts, most-common first */
  methods: { method: string; label: string; count: number }[];
}

export function summarizeVerification(reviews: Review[]): VerificationSummary {
  const methodCounts = new Map<string, number>();
  let withVideo = 0;
  let totalReceipts = 0;
  for (const r of reviews) {
    if (r.hasVideo) withVideo++;
    totalReceipts += r.receipts ?? 0;
    const m = r.verification?.method;
    if (m) methodCounts.set(m, (methodCounts.get(m) ?? 0) + 1);
  }
  const methods = [...methodCounts.entries()]
    .map(([method, count]) => ({
      method,
      label: METHOD_LABELS[method as Review["verification"]["method"]] ?? method,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return { total: reviews.length, withVideo, totalReceipts, methods };
}

export const VIBE_ORDER = ["rage", "warning", "deadpan", "warm", "redeemed"] as const;
export const VIBE_LABEL: Record<Review["vibe"], string> = {
  rage: "Furious",
  warning: "Warning",
  deadpan: "Matter-of-fact",
  warm: "Fond",
  redeemed: "Came around",
};

export interface SentimentSummary {
  total: number;
  avgRating: number;
  /** counts for ratings 1..5, index 0 = 1★ */
  ratings: number[];
  /** vibe slices in VIBE_ORDER, each with a percentage of total */
  vibes: { vibe: Review["vibe"]; label: string; count: number; pct: number }[];
}

export function summarizeSentiment(reviews: Review[]): SentimentSummary {
  const total = reviews.length;
  const ratings = [0, 0, 0, 0, 0];
  const vibeCounts = new Map<Review["vibe"], number>();
  let ratingSum = 0;
  for (const r of reviews) {
    const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
    ratings[idx]++;
    ratingSum += r.rating;
    vibeCounts.set(r.vibe, (vibeCounts.get(r.vibe) ?? 0) + 1);
  }
  const vibes = VIBE_ORDER.filter((v) => vibeCounts.get(v)).map((v) => {
    const count = vibeCounts.get(v) ?? 0;
    return { vibe: v, label: VIBE_LABEL[v], count, pct: total ? Math.round((count / total) * 100) : 0 };
  });
  return {
    total,
    avgRating: total ? Math.round((ratingSum / total) * 10) / 10 : 0,
    ratings,
    vibes,
  };
}

export interface RecencyInfo {
  latestLabel: string | null;
  spanLabel: string | null;
}

/** Static-safe recency: absolute month/year of the newest review + the year span. */
export function recencyInfo(reviews: Review[]): RecencyInfo {
  const times = reviews
    .map((r) => Date.parse(r.publishedAt))
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);
  if (!times.length) return { latestLabel: null, spanLabel: null };

  const fmt = (t: number) =>
    new Date(t).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  const earliestYear = new Date(times[0]).getFullYear();
  const latestYear = new Date(times[times.length - 1]).getFullYear();
  return {
    latestLabel: fmt(times[times.length - 1]),
    spanLabel: earliestYear === latestYear ? `${latestYear}` : `${earliestYear}–${latestYear}`,
  };
}

/** Derive the most-used review tags (for the topic filter), most-common first. */
export function topTags(reviews: Review[], limit = 6): string[] {
  const counts = new Map<string, number>();
  for (const r of reviews) for (const t of r.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([t]) => t);
}
