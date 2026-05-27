/**
 * Payload CMS 3 collection — Colleges.
 * DORMANT: not wired up in the running app. When Payload is installed, this
 * file becomes the source of truth without changing component code, because
 * /lib/data/index.ts is the single data abstraction.
 */
import type { CollectionConfig } from "./_types";

export const Colleges: CollectionConfig = {
  slug: "colleges",
  admin: { useAsTitle: "name", defaultColumns: ["name", "city", "tier", "truthScore"] },
  fields: [
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "name", type: "text", required: true },
    { name: "shortName", type: "text", required: true },
    { name: "city", type: "text", required: true },
    { name: "state", type: "text", required: true },
    { name: "founded", type: "number", required: true },
    { name: "category", type: "select", required: true,
      options: ["engineering", "private-deemed", "arts", "business", "regional"] },
    { name: "tier", type: "select", required: true, options: ["tier-1", "tier-2", "tier-3"] },
    { name: "caseFileNumber", type: "text", required: true, unique: true },
    { name: "primaryAccent", type: "text", required: true, validate: (v: unknown) =>
      typeof v === "string" && /^#[0-9A-Fa-f]{6}$/.test(v) || "Must be a #RRGGBB hex." },
    { name: "fingerprintSeed", type: "text", required: true },
    { name: "truthScore", type: "number", min: 0, max: 100, required: true },
    { name: "reviewCount", type: "number", defaultValue: 0 },
    { name: "verifiedCount", type: "number", defaultValue: 0 },
    { name: "tagline", type: "text", required: true },
    { name: "brochureBlurb", type: "textarea", required: true },
    { name: "brochureClaims", type: "relationship", relationTo: "brochure-claims", hasMany: true },
    { name: "placementData", type: "array", fields: [
      { name: "year", type: "number", required: true },
      { name: "claimedPercentage", type: "number", required: true },
      { name: "verifiedPercentage", type: "number", required: true },
      { name: "claimedAvgLpa", type: "number", required: true },
      { name: "verifiedAvgLpa", type: "number", required: true },
    ]},
    { name: "longRead", type: "group", fields: [
      { name: "deck", type: "textarea", required: true },
      { name: "paragraphs", type: "array", fields: [{ name: "body", type: "textarea" }] },
      { name: "pullQuote", type: "textarea" },
      { name: "byline", type: "text" },
    ]},
    { name: "feeStructure", type: "group", fields: [
      { name: "claimed", type: "number", required: true },
      { name: "actual", type: "number", required: true },
      { name: "note", type: "textarea" },
    ]},
  ],
};
