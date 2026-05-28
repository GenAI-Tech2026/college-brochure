/**
 * Home-page mock data.
 *
 * Every figure here is chosen to serve the "brochures lie, students reveal
 * truth" narrative — the deltas are intentionally large because real
 * audits look like this. When CMS-backed data is ready, swap the import
 * inside `lib/data/home.ts` (currently re-exports from this file) — every
 * component on the home page reads from `@/lib/data/home`, so the change
 * is a single line.
 */

export type BrochureVsRealityClaim = {
  metric: string;
  claimed: number;
  actual: number;
  /** Display unit, appended after the number. `"%"`, `":1"`, `"/10"`. */
  unit: string;
  /**
   * If true, "lower claimed value" is the optimistic brochure side
   * (e.g. 1:15 faculty ratio is more flattering than 1:42).
   * Visual: claimed bar still draws first; gap is rendered as the
   * absolute distance regardless of direction.
   */
  inverse?: boolean;
};

export type ActivityEvent = {
  city: string;
  lat: number;
  lng: number;
  event: string;
  /** Seconds before "now", so the ticker can render "14s ago" etc. */
  timestamp: number;
};

export type FeaturedCase = {
  college: string;
  /** 0–100. The percentage gap between brochure claims and verified reality. */
  truthGap: number;
  /** 7-point series for the sparkline under each card. */
  trend: number[];
  /** The single most damning verified quote — shown on card flip. */
  quote: string;
};

export const liveStats = {
  /**
   * Hero TILE 1 — odometer seed. The component increments this by 1–3
   * every 3–7s via useLiveTicker, so by the time a visitor scrolls down
   * the page the number has visibly ticked. Starting value is deliberately
   * specific (not a round number) — round numbers read as "marketing".
   */
  liesUncoveredToday: 12847,

  /**
   * Hero TILE 2 — four claim/reality pairs that cycle every 6s.
   *
   * Math: the gap on screen is `claimed - actual` (or `actual - claimed`
   * when `inverse`). The bar widths inside the chart are:
   *   claimedWidth = claimed / max(claimed, actual)  * 100%
   *   actualWidth  = actual  / max(claimed, actual)  * 100%
   * so the longer bar always fills the row and the shorter one shows
   * the deficit visually.
   */
  brochureVsReality: [
    { metric: "Placement Rate",   claimed: 95,  actual: 47,  unit: "%" },
    { metric: "Faculty Ratio",    claimed: 15,  actual: 42,  unit: ":1", inverse: true },
    { metric: "Hostel Quality",   claimed: 9.2, actual: 4.1, unit: "/10" },
    { metric: "Internship Opps",  claimed: 100, actual: 31,  unit: "%" },
  ] as BrochureVsRealityClaim[],

  /** Hero TILE 3 — the ticker source. Order is preserved; the component
      duplicates this list for the seamless loop. */
  studentQuotes: [
    "They never told us the AC was extra ₹40k/sem",
    "Placement stats included unpaid internships",
    "47 of 60 reviews on their site are fake",
    "Faculty quoted in brochure left 2 years ago",
    "Promised lab equipment doesn't exist",
    "Mess food rated 9/10 on their site, 2/10 by us",
    "Sports facility brochure photo is from another college",
    "Tuition jumped 22% with no warning",
    "Industry partnerships listed are expired MoUs",
    "Hostel WiFi: claimed 100Mbps, real 4Mbps",
  ],

  /**
   * Hero TILE 4 — needle angle target as a percentage (0=full red, 100=full
   * green). The component oscillates ±3 around this every 2s. 22 puts the
   * needle deep in the "MARKETING FICTION" zone — the deliberate visual
   * thesis of the site.
   */
  truthScore: 22,

  totalReviews: 247891,
  totalColleges: 1847,
  /** Stored as raw rupees; component formats as ₹2.3 Cr. */
  hiddenFeesExposed: 23000000,
  brochureClaimsUnverified: 73,

  /**
   * Section 5 — the live activity feed. timestamps are in seconds (negative
   * = past). useLiveTicker rolls the list every ~4s — the oldest item drops
   * off, a synthetic new event is prepended.
   */
  recentActivity: [
    { city: "Mumbai",    lat: 19.07, lng: 72.87, event: "New review verified",       timestamp: -14  },
    { city: "Bangalore", lat: 12.97, lng: 77.59, event: "Brochure claim flagged",    timestamp: -47  },
    { city: "Delhi",     lat: 28.61, lng: 77.20, event: "Hidden fee documented",     timestamp: -60  },
    { city: "Hyderabad", lat: 17.38, lng: 78.48, event: "12 reviews matched",        timestamp: -120 },
    { city: "Chennai",   lat: 13.08, lng: 80.27, event: "Placement stat disputed",   timestamp: -180 },
    { city: "Pune",      lat: 18.52, lng: 73.85, event: "Faculty credential checked",timestamp: -240 },
    { city: "Kolkata",   lat: 22.57, lng: 88.36, event: "Hostel photo flagged",      timestamp: -300 },
    { city: "Ahmedabad", lat: 23.02, lng: 72.57, event: "Fee structure decoded",     timestamp: -360 },
  ] as ActivityEvent[],

  /**
   * Section 2 — featured exposés. The "trend" array drives the inline
   * sparkline (Section ReceiptsCard). Mid-range gaps (12, 21) are included
   * deliberately — not every college is a 50% liar, and showing variance
   * is what makes the audit credible.
   */
  featuredCases: [
    {
      college: "Institute of Technical Excellence, Bombay",
      truthGap: 48,
      trend: [42, 45, 47, 46, 48, 49, 48],
      quote: "The placement number includes 200 students who never got jobs.",
    },
    {
      college: "Sunrise Deemed University",
      truthGap: 67,
      trend: [50, 55, 60, 65, 67, 68, 67],
      quote: "Photos in the brochure are from a college 800km away.",
    },
    {
      college: "National Arts College, Delhi",
      truthGap: 12,
      trend: [15, 13, 12, 11, 12, 12, 12],
      quote: "Honestly, mostly accurate. Just slightly inflated facilities claims.",
    },
    {
      college: "Coastal Business School",
      truthGap: 54,
      trend: [40, 45, 48, 52, 54, 55, 54],
      quote: "The 100% placement claim. 100%. Of the 30% who got jobs.",
    },
    {
      college: "Heritage Engineering University",
      truthGap: 39,
      trend: [30, 35, 38, 40, 39, 38, 39],
      quote: "Industry tie-ups list reads like a graveyard of expired MoUs.",
    },
    {
      college: "Riverside Liberal Arts",
      truthGap: 21,
      trend: [25, 23, 22, 21, 20, 21, 21],
      quote: "Faculty in brochure: 12. Faculty in real life: 4.",
    },
  ] as FeaturedCase[],

  /**
   * Section 1 — slope chart. 6 metrics, each with a 0–100 normalised value
   * on each side. "Promised" is the brochure claim normalised to 100; "Real"
   * is the verified value normalised to the same scale. Lines that drop a
   * lot turn Truth Red in the component.
   */
  slopeMetrics: [
    { metric: "Placement Rate",         promised: 95, real: 47 },
    { metric: "Faculty-Student Ratio",  promised: 92, real: 38 },
    { metric: "Hostel Quality",         promised: 88, real: 41 },
    { metric: "Industry Tie-ups",       promised: 90, real: 24 },
    { metric: "Internship Pipeline",    promised: 96, real: 31 },
    { metric: "Lab Infrastructure",     promised: 85, real: 79 },
  ],
};

export type LiveStats = typeof liveStats;
