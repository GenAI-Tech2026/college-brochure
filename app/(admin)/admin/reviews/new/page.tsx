import { sql } from "@/lib/db";
import {
  StudioHeader,
  TextField,
  TextareaField,
  SelectField,
  CheckboxField,
} from "@/components/admin/Field";
import { createReview } from "@/lib/admin/actions";

export const metadata = { title: "New review" };
export const dynamic = "force-dynamic";

const VIBES = ["rage", "warm", "deadpan", "warning", "redeemed"] as const;
const METHODS = ["email-domain", "id-card", "alumni-roster", "video-selfie"] as const;

export default async function NewReviewPage() {
  const colleges = await sql<{ slug: string; short_name: string }[]>`
    SELECT slug, short_name FROM uf_colleges ORDER BY short_name
  `;

  if (!colleges.length) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
        <StudioHeader kicker="Admin · Reviews" title="New review" />
        <p className="border-l-2 border-truth bg-truth/10 px-4 py-3 font-mono text-meta uppercase tracking-[0.22em] text-truth">
          No colleges yet. <a className="underline" href="/admin/colleges/new">Create a college first</a> — a review must attach to one.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
      <StudioHeader kicker="Admin · Reviews" title="New review" />
      <p className="mb-8 font-mono text-meta uppercase tracking-[0.22em] text-newsprint/55">
        Publishes straight to the wall. Verified + published timestamps are set
        to now. The college’s truth score recomputes on save.
      </p>

      <form action={createReview} className="space-y-6">
        <TextField label="Title" name="title" required />
        <TextareaField label="Body" name="body" rows={8} required />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label className="block">
            <span className="block font-mono text-meta uppercase tracking-[0.25em] text-newsprint/60">
              College <span className="ml-1 text-truth">*</span>
            </span>
            <select
              name="college_slug"
              required
              defaultValue={colleges[0]?.slug ?? ""}
              className="can-fade mt-2 w-full border-b border-newsprint/30 bg-[#141210] py-2 text-newsprint outline-none focus:border-truth"
            >
              {colleges.map((c) => (
                <option key={c.slug} value={c.slug} className="bg-ink">
                  {c.short_name} ({c.slug})
                </option>
              ))}
            </select>
          </label>
          <TextField label="Author pseudonym" name="author_pseudonym" required />
          <TextField label="Author year (1–5)" name="author_year" type="number" defaultValue={3} min={1} max={5} />
          <TextField label="Author branch" name="author_branch" defaultValue="Undisclosed" />
          <TextField label="Rating (1–5)" name="rating" type="number" defaultValue={3} min={1} max={5} />
          <TextField label="Truth score (0–100)" name="truth_score" type="number" defaultValue={70} min={0} max={100} />
          <SelectField label="Vibe" name="vibe" options={VIBES} defaultValue="warning" />
          <SelectField label="Verification method" name="verification_method" options={METHODS} defaultValue="email-domain" />
          <TextField label="Upvotes" name="upvotes" type="number" defaultValue={0} />
          <TextField label="Receipts" name="receipts" type="number" defaultValue={0} />
        </div>

        <TextareaField label="Tags" name="tags" rows={2} hint="comma- or newline-separated" />
        <CheckboxField label="Has video" name="has_video" />

        <div className="flex items-center gap-3 border-t border-newsprint/10 pt-6">
          <button
            type="submit"
            className="bg-truth px-5 py-2.5 font-mono text-meta uppercase tracking-[0.3em] text-newsprint hover:bg-truth/85"
          >
            Create review →
          </button>
          <a
            href="/admin/reviews"
            className="font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55 hover:text-newsprint"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
