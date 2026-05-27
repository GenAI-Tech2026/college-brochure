import type { CollectionConfig } from "./_types";

/**
 * Pseudonymous student identity. Real names are never stored — only the
 * verification artifact (a hashed reference to the verifying medium) and
 * the pseudonym used on the site.
 */
export const VerifiedStudents: CollectionConfig = {
  slug: "verified-students",
  admin: { useAsTitle: "pseudonym" },
  fields: [
    { name: "pseudonym", type: "text", required: true, unique: true },
    { name: "verificationMethod", type: "select", required: true,
      options: ["id-card", "email-domain", "alumni-roster", "video-selfie"] },
    { name: "verifiedAt", type: "date", required: true },
    { name: "college", type: "relationship", relationTo: "colleges" },
    { name: "submittedReviewCount", type: "number", defaultValue: 0 },
    { name: "trustScore", type: "number", min: 0, max: 100, defaultValue: 50 },
  ],
};
