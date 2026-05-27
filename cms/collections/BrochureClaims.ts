import type { CollectionConfig } from "./_types";

export const BrochureClaims: CollectionConfig = {
  slug: "brochure-claims",
  admin: { useAsTitle: "claim" },
  fields: [
    { name: "claim", type: "textarea", required: true },
    { name: "truth", type: "textarea", required: true },
    { name: "category", type: "select", required: true,
      options: ["placements", "infrastructure", "faculty", "campus-life", "fees"] },
    { name: "delta", type: "number", required: true, min: 0, max: 100 },
    { name: "college", type: "relationship", relationTo: "colleges" },
  ],
};
