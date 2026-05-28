"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

async function gate() {
  const u = await getSessionUser();
  if (!u) redirect("/studio/login");
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
function bool(fd: FormData, k: string): boolean {
  return fd.get(k) != null;
}
function arrStr(fd: FormData, k: string): string[] {
  return str(fd, k)
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ─────────────────────── Reviews ─────────────────────── */

export async function updateReview(id: number, fd: FormData) {
  await gate();
  await sql`
    UPDATE uf_reviews SET
      college_slug = ${str(fd, "college_slug")},
      author_pseudonym = ${str(fd, "author_pseudonym")},
      author_year = ${int(fd, "author_year", 1)},
      author_branch = ${str(fd, "author_branch")},
      rating = ${int(fd, "rating", 3)},
      truth_score = ${int(fd, "truth_score", 50)},
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
  revalidatePath("/studio/reviews");
  revalidatePath(`/studio/reviews/${id}`);
  redirect(`/studio/reviews/${id}?ok=1`);
}

export async function deleteReview(id: number) {
  await gate();
  await sql`DELETE FROM uf_reviews WHERE id = ${id}`;
  revalidatePath("/studio/reviews");
  redirect("/studio/reviews");
}

/* ─────────────────────── Colleges (scalar fields only) ─────────────────────── */

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
      truth_score = ${int(fd, "truth_score", 50)},
      review_count = ${int(fd, "review_count")},
      verified_count = ${int(fd, "verified_count")},
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
  revalidatePath("/studio/colleges");
  revalidatePath(`/studio/colleges/${id}`);
  redirect(`/studio/colleges/${id}?ok=1`);
}

export async function deleteCollege(id: number) {
  await gate();
  await sql`DELETE FROM uf_colleges WHERE id = ${id}`;
  revalidatePath("/studio/colleges");
  redirect("/studio/colleges");
}

/* ─────────────────────── Verified students ─────────────────────── */

export async function updateVerifiedStudent(id: number, fd: FormData) {
  await gate();
  await sql`
    UPDATE uf_verified_students SET
      pseudonym = ${str(fd, "pseudonym")},
      verification_method = ${str(fd, "verification_method")},
      college_id = ${strNullable(fd, "college_id") ? int(fd, "college_id") : null},
      submitted_review_count = ${int(fd, "submitted_review_count")},
      trust_score = ${int(fd, "trust_score", 50)},
      updated_at = now()
    WHERE id = ${id}
  `;
  revalidatePath("/studio/verified-students");
  revalidatePath(`/studio/verified-students/${id}`);
  redirect(`/studio/verified-students/${id}?ok=1`);
}

export async function deleteVerifiedStudent(id: number) {
  await gate();
  await sql`DELETE FROM uf_verified_students WHERE id = ${id}`;
  revalidatePath("/studio/verified-students");
  redirect("/studio/verified-students");
}

/* ─────────────────────── Brochure claims ─────────────────────── */

export async function updateBrochureClaim(id: number, fd: FormData) {
  await gate();
  await sql`
    UPDATE uf_brochure_claims SET
      college_id = ${int(fd, "college_id")},
      claim = ${str(fd, "claim")},
      truth = ${str(fd, "truth")},
      category = ${str(fd, "category")},
      delta = ${int(fd, "delta", 0)},
      position = ${int(fd, "position", 0)},
      updated_at = now()
    WHERE id = ${id}
  `;
  revalidatePath("/studio/brochure-claims");
  revalidatePath(`/studio/brochure-claims/${id}`);
  redirect(`/studio/brochure-claims/${id}?ok=1`);
}

export async function deleteBrochureClaim(id: number) {
  await gate();
  await sql`DELETE FROM uf_brochure_claims WHERE id = ${id}`;
  revalidatePath("/studio/brochure-claims");
  redirect("/studio/brochure-claims");
}

/* ─────────────────────── Truth revelations ─────────────────────── */

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
  revalidatePath("/studio/truth-revelations");
  revalidatePath(`/studio/truth-revelations/${id}`);
  redirect(`/studio/truth-revelations/${id}?ok=1`);
}

export async function deleteTruthRevelation(id: number) {
  await gate();
  await sql`DELETE FROM uf_truth_revelations WHERE id = ${id}`;
  revalidatePath("/studio/truth-revelations");
  redirect("/studio/truth-revelations");
}
