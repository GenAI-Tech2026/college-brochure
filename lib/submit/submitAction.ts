"use server";
import { z } from "zod";
import { sql } from "@/lib/db";

/**
 * The /submit form's real server action. Validates with Zod, slugifies the
 * college name (matches an existing uf_colleges row when possible), assigns
 * a UF-#### case number, generates a fun pseudonym if anonymous, and writes
 * to uf_submissions. Returns the case number for the success state.
 *
 * Failures return a typed result; the client UI handles the error path
 * without breaking the cinematic.
 */

const Payload = z.object({
  college: z.string().min(2),
  brochureClaim: z.string().min(20),
  reality: z.string().min(20),
  hasReceipts: z.enum(["yes", "no"]),
  email: z.string().email("Enter a valid email address."),
  identity: z.enum(["anonymous", "named"]),
  // Public paths returned by uploadReceipts(); optional.
  receiptPaths: z.array(z.string()).max(6).optional(),
});

export type SubmissionResult =
  | { ok: true; caseNo: string; id: number }
  | { ok: false; reason: string };

/** Hash-like pseudonym from email local-part. Deterministic, no PII leak. */
function pseudonymFor(email: string): string {
  const adjectives = [
    "Granite", "Echo", "Lighthouse", "Marina", "Quartz", "Cinder",
    "Saffron", "Pebble", "Tungsten", "Cobalt", "Mineral", "Indigo",
    "Carbon", "Vermilion", "Halftone", "Ferrule", "Pyrite", "Vellum",
  ];
  // Simple hash of local-part
  const local = email.split("@")[0] ?? "";
  let h = 0;
  for (const c of local) h = (h * 31 + c.charCodeAt(0)) | 0;
  const idx = Math.abs(h) % adjectives.length;
  const num = Math.abs(h % 89) + 10;
  return `${adjectives[idx]}-${num}`;
}

function slugifyCollegeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function submitTestimony(
  raw: unknown,
): Promise<SubmissionResult> {
  // Validate
  const parsed = Payload.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: parsed.error.issues[0]?.message ?? "Invalid submission.",
    };
  }
  const v = parsed.data;
  const domain = v.email.split("@")[1] ?? "";

  // Try to resolve the typed college name to an existing slug. Two paths:
  //  1. exact name match (case-insensitive)
  //  2. fuzzy ilike on short_name or name
  let resolvedSlug: string | null = null;
  const exact = await sql<{ slug: string }[]>`
    SELECT slug FROM uf_colleges
    WHERE lower(name) = lower(${v.college})
       OR lower(short_name) = lower(${v.college})
    LIMIT 1
  `;
  if (exact[0]) {
    resolvedSlug = exact[0].slug;
  } else {
    const fuzzy = await sql<{ slug: string }[]>`
      SELECT slug FROM uf_colleges
      WHERE name ILIKE ${"%" + v.college + "%"}
         OR short_name ILIKE ${"%" + v.college + "%"}
      LIMIT 1
    `;
    if (fuzzy[0]) resolvedSlug = fuzzy[0].slug;
  }
  // Fallback — store the raw slugified name even if we don't recognize it.
  const fallbackSlug = resolvedSlug ?? (slugifyCollegeName(v.college) || null);

  // Assign a case number — next sequence value padded to 4 digits.
  const [{ next_no }] = await sql<{ next_no: number }[]>`
    SELECT COALESCE(MAX(id), 0) + 1 AS next_no FROM uf_submissions
  `;
  const caseNo = `UF-${String(next_no).padStart(4, "0")}`;
  const pseudonym = v.identity === "named"
    ? v.email.split("@")[0]
    : pseudonymFor(v.email);

  const receiptPaths = v.receiptPaths ?? [];
  // If files were actually attached, receipts are present regardless of the
  // yes/no toggle the student last touched.
  const hasReceipts = receiptPaths.length > 0 || v.hasReceipts === "yes";

  try {
    const [row] = await sql<{ id: number }[]>`
      INSERT INTO uf_submissions (
        case_no, college_name, college_slug,
        brochure_claim, reality, has_receipts, receipt_paths,
        email, email_domain, identity, pseudonym, status
      )
      VALUES (
        ${caseNo}, ${v.college}, ${fallbackSlug},
        ${v.brochureClaim}, ${v.reality}, ${hasReceipts}, ${receiptPaths},
        ${v.email}, ${domain}, ${v.identity}, ${pseudonym}, ${"pending"}
      )
      RETURNING id
    `;
    return { ok: true, caseNo, id: row.id };
  } catch (e) {
    console.error("[submitTestimony] insert failed:", e);
    return { ok: false, reason: "We couldn’t save your testimony. Please try again." };
  }
}
