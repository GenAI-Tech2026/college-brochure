/**
 * Shape contracts shared by mock data, CMS schemas, and the data layer.
 * Designed so a Payload collection can satisfy these without changes.
 */

export type CollegeTier = "tier-1" | "tier-2" | "tier-3";
export type CollegeCategory =
  | "engineering"
  | "private-deemed"
  | "arts"
  | "business"
  | "regional";

export interface BrochureClaim {
  id: string;
  claim: string;          // what the marketing said
  truth: string;          // what students found
  category: "placements" | "infrastructure" | "faculty" | "campus-life" | "fees";
  delta: number;          // % deception, drives the redaction-bar weight
}

export interface ReviewVerification {
  method: "id-card" | "email-domain" | "alumni-roster" | "video-selfie";
  verifiedAt: string;     // ISO
}

export interface Review {
  id: string;
  collegeSlug: string;
  authorPseudonym: string;
  authorYear: 1 | 2 | 3 | 4 | 5; // year of study or alumni-years-back
  authorBranch: string;
  rating: number;         // 1–5
  truthScore: number;     // 0–100 student-assigned honesty rating
  title: string;
  body: string;
  tags: string[];
  vibe: "rage" | "warm" | "deadpan" | "warning" | "redeemed";
  hasVideo: boolean;
  verification: ReviewVerification;
  publishedAt: string;    // ISO
  upvotes: number;
  receipts: number;       // attached evidence count
}

export interface PlacementDatum {
  year: number;
  claimedPercentage: number;
  verifiedPercentage: number;
  claimedAvgLpa: number;
  verifiedAvgLpa: number;
}

export interface College {
  slug: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  founded: number;
  category: CollegeCategory;
  tier: CollegeTier;
  caseFileNumber: string;      // e.g. "UF-0042"
  primaryAccent: string;       // hex, drives per-page unique secondary accent
  fingerprintSeed: string;     // hash source for SVG fingerprint pattern
  truthScore: number;          // 0–100 aggregate
  reviewCount: number;
  verifiedCount: number;
  tagline: string;
  brochureBlurb: string;       // glossy marketing paragraph
  brochureClaims: BrochureClaim[];
  placementData: PlacementDatum[];
  longRead: {                  // magazine-style long-read content
    deck: string;
    paragraphs: string[];
    pullQuote: string;
    byline: string;
  };
  feeStructure: {
    claimed: number;
    actual: number;            // including hidden costs
    note: string;
  };
}
