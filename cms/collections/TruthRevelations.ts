import type { CollectionConfig } from "./_types";

/**
 * Editorially-curated revelations — the "featured exposé" cards on /.
 * Lives separately from Reviews because these are surfaced by editors,
 * not algorithmically derived.
 */
export const TruthRevelations: CollectionConfig = {
  slug: "truth-revelations",
  admin: { useAsTitle: "headline" },
  fields: [
    { name: "headline", type: "text", required: true },
    { name: "dek", type: "textarea", required: true },
    { name: "college", type: "relationship", relationTo: "colleges", required: true },
    { name: "featuredAt", type: "date" },
    { name: "weight", type: "number", defaultValue: 0 },
    { name: "linkedReviews", type: "relationship", relationTo: "reviews", hasMany: true },
  ],
};
