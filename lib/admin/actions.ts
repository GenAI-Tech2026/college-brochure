"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import {
  recomputeCollege,
  recomputeCollegeBySlug,
  recomputeAllColleges,
} from "@/lib/admin/recompute";

async function gate() {
  const u = await getSessionUser();
  if (!u) redirect("/admin/login");
  return u;
}

function str(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "");
}
function strNullable(fd: FormData, k: string): string | null {
  const v = String(fd.get(k) ?? "").trim();
  return v.length ? v : null;
}
function int(fd: FormData, k: string, dflt = 0): number {
  const v = Number(fd.get(k));
  return Number.isFinite(v) ? Math.trunc(v) : dflt;
}
/**
 * Bounded integer. The uf_* tables have CHECK constraints (rating 1–5,
 * truth_score 0–100, …); an out-of-range value would throw and silently fail
 * the save. Clamp on the way in so a typo can never break a save.
 */
function intClamp(fd: FormData, k: string, min: number, max: number, dflt: number): number {
  const v = int(fd, k, dflt);
  return Math.max(min, Math.min(max, v));
}
function bool(fd: FormData, k: string): boolean {
  return fd.get(k) != null;
}
function arrStr(fd: FormData, k: string): string[] {
  return str(fd, k)
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Purge the public pages that read from the DB. They're force-dynamic so this
 * is belt-and-suspenders today, but it keeps the frontend correct if caching
 * is ever reintroduced. Pass a college slug to also bust its dossier page.
 */
function revalidatePublic(slug?: string | null) {
  revalidatePath("/");
  revalidatePath("/colleges");
  revalidatePath("/showcase");
  revalidatePath("/wall-of-receipts");
  if (slug) revalidatePath(`/college/${slug}`);
}

/* ─────────────────────── Reviews ─────────────────────── */

export async function createReview(fd: FormData) {
  await gate();
  const slug = str(fd, "college_slug");
  const [row] = await sql<{ id: number }[]>`
    INSERT INTO uf_reviews (
      college_slug, author_pseudonym, author_year, author_branch,
      rating, truth_score, title, body, tags, vibe, has_video,
      verification_method, verified_at, published_at, upvotes, receipts
    ) VALUES (
      ${slug}, ${str(fd, "author_pseudonym")}, ${intClamp(fd, "author_year", 1, 5, 1)},
      ${str(fd, "author_branch")}, ${intClamp(fd, "rating", 1, 5, 3)}, ${intClamp(fd, "truth_score", 0, 100, 50)},
      ${str(fd, "title")}, ${str(fd, "body")}, ${arrStr(fd, "tags")},
      ${str(fd, "vibe")}, ${bool(fd, "has_video")}, ${str(fd, "verification_method")},
      now(), now(), ${int(fd, "upvotes")}, ${int(fd, "receipts")}
    )
    RETURNING id
  `;
  await recomputeCollegeBySlug(slug);
  revalidatePath("/admin/reviews");
  revalidatePublic(slug);
  redirect(`/admin/reviews/${row.id}?ok=1`);
}

export async function updateReview(id: number, fd: FormData) {
  await gate();
  const slug = str(fd, "college_slug");
  await sql`
    UPDATE uf_reviews SET
      college_slug = ${slug},
      author_pseudonym = ${str(fd, "author_pseudonym")},
      author_year = ${intClamp(fd, "author_year", 1, 5, 1)},
      author_branch = ${str(fd, "author_branch")},
      rating = ${intClamp(fd, "rating", 1, 5, 3)},
      truth_score = ${intClamp(fd, "truth_score", 0, 100, 50)},
      title = ${str(fd, "title")},
      body = ${str(fd, "body")},
      tags = ${arrStr(fd, "tags")},
      vibe = ${str(fd, "vibe")},
      has_video = ${bool(fd, "has_video")},
      verification_method = ${str(fd, "verification_method")},
      upvotes = ${int(fd, "upvotes")},
      receipts = ${int(fd, "receipts")},
      updated_at = now()
    WHERE id = ${id}
  `;
  await recomputeCollegeBySlug(slug);
  revalidatePath("/admin/reviews");
  revalidatePath(`/admin/reviews/${id}`);
  revalidatePublic(slug);
  redirect(`/admin/reviews/${id}?ok=1`);
}

export async function deleteReview(id: number) {
  await gate();
  const [row] = await sql<{ college_slug: string }[]>`
    DELETE FROM uf_reviews WHERE id = ${id} RETURNING college_slug
  `;
  if (row) await recomputeCollegeBySlug(row.college_slug);
  revalidatePath("/admin/reviews");
  revalidatePublic(row?.college_slug);
  redirect("/admin/reviews");
}

/* ─────────────────────── Colleges ─────────────────────── */
/* truth_score / review_count / verified_count are derived (see recompute.ts)
 * and intentionally NOT written by the edit form. */

export async function createCollege(fd: FormData) {
  await gate();
  const name = str(fd, "name");
  const slug = strNullable(fd, "slug") ?? slugify(name);
  const [row] = await sql<{ id: number }[]>`
    INSERT INTO uf_colleges (
      slug, name, short_name, city, state, founded, category, tier,
      case_file_number, primary_accent, fingerprint_seed, truth_score,
      tagline, brochure_blurb, fee_claimed, fee_actual, fee_note
    ) VALUES (
      ${slug}, ${name}, ${str(fd, "short_name")}, ${str(fd, "city")},
      ${str(fd, "state")}, ${int(fd, "founded", 1900)}, ${str(fd, "category")},
      ${str(fd, "tier")},
      ${strNullable(fd, "case_file_number") ?? `UF-${slug.slice(0, 6).toUpperCase()}`},
      ${strNullable(fd, "primary_accent") ?? "#FF4332"},
      ${strNullable(fd, "fingerprint_seed") ?? slug},
      ${50},
      ${str(fd, "tagline")}, ${str(fd, "brochure_blurb")},
      ${int(fd, "fee_claimed")}, ${int(fd, "fee_actual")}, ${str(fd, "fee_note")}
    )
    RETURNING id
  `;
  await recomputeCollege(row.id);
  revalidatePath("/admin/colleges");
  revalidatePublic(slug);
  redirect(`/admin/colleges/${row.id}?ok=1`);
}

export async function updateCollege(id: number, fd: FormData) {
  await gate();
  await sql`
    UPDATE uf_colleges SET
      slug = ${str(fd, "slug")},
      name = ${str(fd, "name")},
      short_name = ${str(fd, "short_name")},
      city = ${str(fd, "city")},
      state = ${str(fd, "state")},
      founded = ${int(fd, "founded", 1900)},
      category = ${str(fd, "category")},
      tier = ${str(fd, "tier")},
      case_file_number = ${str(fd, "case_file_number")},
      primary_accent = ${str(fd, "primary_accent")},
      fingerprint_seed = ${str(fd, "fingerprint_seed")},
      tagline = ${str(fd, "tagline")},
      brochure_blurb = ${str(fd, "brochure_blurb")},
      long_read_deck = ${str(fd, "long_read_deck")},
      long_read_pull_quote = ${str(fd, "long_read_pull_quote")},
      long_read_byline = ${str(fd, "long_read_byline")},
      fee_claimed = ${int(fd, "fee_claimed")},
      fee_actual = ${int(fd, "fee_actual")},
      fee_note = ${str(fd, "fee_note")},
      updated_at = now()
    WHERE id = ${id}
  `;
  // Slug may have changed → recompute so derived counts track the new slug.
  await recomputeCollege(id);
  revalidatePath("/admin/colleges");
  revalidatePath(`/admin/colleges/${id}`);
  revalidatePublic(str(fd, "slug"));
  redirect(`/admin/colleges/${id}?ok=1`);
}

export async function deleteCollege(id: number) {
  await gate();
  await sql`DELETE FROM uf_colleges WHERE id = ${id}`;
  revalidatePath("/admin/colleges");
  revalidatePublic();
  redirect("/admin/colleges");
}

/** Dashboard / list button: recompute every college's derived metrics. */
export async function recomputeAll() {
  await gate();
  await recomputeAllColleges();
  revalidatePath("/admin");
  revalidatePath("/admin/colleges");
  revalidatePublic();
  redirect("/admin/colleges?ok=1");
}

/* ─────────────────────── Verified students ─────────────────────── */

export async function createVerifiedStudent(fd: FormData) {
  await gate();
  const [row] = await sql<{ id: number }[]>`
    INSERT INTO uf_verified_students (
      pseudonym, verification_method, verified_at, college_id,
      submitted_review_count, trust_score
    ) VALUES (
      ${str(fd, "pseudonym")}, ${str(fd, "verification_method")}, now(),
      ${strNullable(fd, "college_id") ? int(fd, "college_id") : null},
      ${int(fd, "submitted_review_count")}, ${intClamp(fd, "trust_score", 0, 100, 50)}
    )
    RETURNING id
  `;
  revalidatePath("/admin/verified-students");
  redirect(`/admin/verified-students/${row.id}?ok=1`);
}

export async function updateVerifiedStudent(id: number, fd: FormData) {
  await gate();
  await sql`
    UPDATE uf_verified_students SET
      pseudonym = ${str(fd, "pseudonym")},
      verification_method = ${str(fd, "verification_method")},
      college_id = ${strNullable(fd, "college_id") ? int(fd, "college_id") : null},
      submitted_review_count = ${int(fd, "submitted_review_count")},
      trust_score = ${intClamp(fd, "trust_score", 0, 100, 50)},
      updated_at = now()
    WHERE id = ${id}
  `;
  revalidatePath("/admin/verified-students");
  revalidatePath(`/admin/verified-students/${id}`);
  redirect(`/admin/verified-students/${id}?ok=1`);
}

export async function deleteVerifiedStudent(id: number) {
  await gate();
  await sql`DELETE FROM uf_verified_students WHERE id = ${id}`;
  revalidatePath("/admin/verified-students");
  redirect("/admin/verified-students");
}

/* ─────────────────────── Brochure claims ─────────────────────── */

export async function createBrochureClaim(fd: FormData) {
  await gate();
  const collegeId = int(fd, "college_id");
  const [row] = await sql<{ id: number }[]>`
    INSERT INTO uf_brochure_claims (
      college_id, claim, truth, category, delta, position
    ) VALUES (
      ${collegeId}, ${str(fd, "claim")}, ${str(fd, "truth")},
      ${str(fd, "category")}, ${intClamp(fd, "delta", 0, 100, 0)}, ${int(fd, "position", 0)}
    )
    RETURNING id
  `;
  await recomputeCollege(collegeId);
  revalidatePath("/admin/brochure-claims");
  revalidatePublic();
  redirect(`/admin/brochure-claims/${row.id}?ok=1`);
}

export async function updateBrochureClaim(id: number, fd: FormData) {
  await gate();
  const collegeId = int(fd, "college_id");
  await sql`
    UPDATE uf_brochure_claims SET
      college_id = ${collegeId},
      claim = ${str(fd, "claim")},
      truth = ${str(fd, "truth")},
      category = ${str(fd, "category")},
      delta = ${intClamp(fd, "delta", 0, 100, 0)},
      position = ${int(fd, "position", 0)},
      updated_at = now()
    WHERE id = ${id}
  `;
  await recomputeCollege(collegeId);
  revalidatePath("/admin/brochure-claims");
  revalidatePath(`/admin/brochure-claims/${id}`);
  revalidatePublic();
  redirect(`/admin/brochure-claims/${id}?ok=1`);
}

export async function deleteBrochureClaim(id: number) {
  await gate();
  const [row] = await sql<{ college_id: number }[]>`
    DELETE FROM uf_brochure_claims WHERE id = ${id} RETURNING college_id
  `;
  if (row) await recomputeCollege(row.college_id);
  revalidatePath("/admin/brochure-claims");
  revalidatePublic();
  redirect("/admin/brochure-claims");
}

/* ─────────────────────── Truth revelations ─────────────────────── */

export async function createTruthRevelation(fd: FormData) {
  await gate();
  const [row] = await sql<{ id: number }[]>`
    INSERT INTO uf_truth_revelations (
      headline, dek, college_id, weight, featured_at
    ) VALUES (
      ${str(fd, "headline")}, ${str(fd, "dek")}, ${int(fd, "college_id")},
      ${int(fd, "weight")}, now()
    )
    RETURNING id
  `;
  revalidatePath("/admin/truth-revelations");
  revalidatePublic();
  redirect(`/admin/truth-revelations/${row.id}?ok=1`);
}

export async function updateTruthRevelation(id: number, fd: FormData) {
  await gate();
  await sql`
    UPDATE uf_truth_revelations SET
      headline = ${str(fd, "headline")},
      dek = ${str(fd, "dek")},
      college_id = ${int(fd, "college_id")},
      weight = ${int(fd, "weight")},
      updated_at = now()
    WHERE id = ${id}
  `;
  revalidatePath("/admin/truth-revelations");
  revalidatePath(`/admin/truth-revelations/${id}`);
  revalidatePublic();
  redirect(`/admin/truth-revelations/${id}?ok=1`);
}

export async function deleteTruthRevelation(id: number) {
  await gate();
  await sql`DELETE FROM uf_truth_revelations WHERE id = ${id}`;
  revalidatePath("/admin/truth-revelations");
  revalidatePublic();
  redirect("/admin/truth-revelations");
}

/* ─────────────────────── Submissions → published review ─────────────────────── */

/**
 * The moderation bridge. Turns a raw uf_submissions row into a public
 * uf_reviews row using the review-specific fields the admin fills in, copies
 * the receipt images across, marks the submission published, and recomputes
 * the college's derived truth score.
 */
export async function publishSubmissionAsReview(submissionId: number, fd: FormData) {
  const u = await gate();

  const [sub] = await sql<
    {
      id: number;
      college_slug: string | null;
      reality: string;
      brochure_claim: string;
      pseudonym: string;
      identity: string;
      status: string;
      receipt_paths: string[];
    }[]
  >`
    SELECT id, college_slug, reality, brochure_claim, pseudonym, identity,
           status, receipt_paths
    FROM uf_submissions WHERE id = ${submissionId} LIMIT 1
  `;
  if (!sub) redirect("/admin/submissions");
  if (sub.status === "published") {
    redirect(`/admin/submissions/${submissionId}?ok=1`);
  }

  const slug = strNullable(fd, "college_slug") ?? sub.college_slug ?? "";
  const body = str(fd, "body") || sub.reality;
  const receipts = sub.receipt_paths ?? [];

  const [review] = await sql<{ id: number }[]>`
    INSERT INTO uf_reviews (
      college_slug, author_pseudonym, author_year, author_branch,
      rating, truth_score, title, body, tags, vibe, has_video,
      verification_method, verified_at, published_at, upvotes, receipts,
      receipt_paths, source_submission_id
    ) VALUES (
      ${slug}, ${str(fd, "author_pseudonym") || sub.pseudonym},
      ${intClamp(fd, "author_year", 1, 5, 1)}, ${str(fd, "author_branch")},
      ${intClamp(fd, "rating", 1, 5, 3)}, ${intClamp(fd, "truth_score", 0, 100, 50)},
      ${str(fd, "title")}, ${body}, ${arrStr(fd, "tags")},
      ${str(fd, "vibe")}, ${bool(fd, "has_video")},
      ${str(fd, "verification_method")}, now(), now(),
      ${0}, ${receipts.length}, ${receipts}, ${submissionId}
    )
    RETURNING id
  `;

  await sql`
    UPDATE uf_submissions
    SET status = 'published', reviewed_at = now(), reviewer_user_id = ${u.id},
        updated_at = now()
    WHERE id = ${submissionId}
  `;

  if (slug) await recomputeCollegeBySlug(slug);

  revalidatePath("/admin/submissions");
  revalidatePath("/admin/reviews");
  revalidatePath(`/admin/submissions/${submissionId}`);
  revalidatePublic(slug);
  redirect(`/admin/reviews/${review.id}?ok=1`);
}
