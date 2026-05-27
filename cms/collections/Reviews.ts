import type { CollectionConfig } from "./_types";

export const Reviews: CollectionConfig = {
  slug: "reviews",
  admin: { useAsTitle: "title", defaultColumns: ["title", "collegeSlug", "rating", "truthScore"] },
  fields: [
    { name: "collegeSlug", type: "text", required: true, index: true },
    { name: "authorPseudonym", type: "text", required: true },
    { name: "authorYear", type: "number", required: true, min: 1, max: 5 },
    { name: "authorBranch", type: "text", required: true },
    { name: "rating", type: "number", required: true, min: 1, max: 5 },
    { name: "truthScore", type: "number", required: true, min: 0, max: 100 },
    { name: "title", type: "text", required: true },
    { name: "body", type: "textarea", required: true },
    { name: "tags", type: "array", fields: [{ name: "tag", type: "text" }] },
    { name: "vibe", type: "select", required: true,
      options: ["rage", "warm", "deadpan", "warning", "redeemed"] },
    { name: "hasVideo", type: "checkbox", defaultValue: false },
    { name: "verification", type: "group", fields: [
      { name: "method", type: "select", options: ["id-card", "email-domain", "alumni-roster", "video-selfie"] },
      { name: "verifiedAt", type: "date" },
    ]},
    { name: "publishedAt", type: "date", required: true },
    { name: "upvotes", type: "number", defaultValue: 0 },
    { name: "receipts", type: "number", defaultValue: 0 },
  ],
};
