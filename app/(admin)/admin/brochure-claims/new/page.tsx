import { sql } from "@/lib/db";
import {
  StudioHeader,
  TextField,
  TextareaField,
  SelectField,
} from "@/components/admin/Field";
import { createBrochureClaim } from "@/lib/admin/actions";

export const metadata = { title: "New brochure claim" };
export const dynamic = "force-dynamic";

const CATEGORIES = ["placements", "infrastructure", "faculty", "campus-life", "fees"] as const;

export default async function NewBrochureClaimPage() {
  const colleges = await sql<{ id: number; short_name: string }[]>`
    SELECT id, short_name FROM uf_colleges ORDER BY short_name
  `;

  if (!colleges.length) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
        <StudioHeader kicker="Admin · Brochure claims" title="New brochure claim" />
        <p className="border-l-2 border-truth bg-truth/10 px-4 py-3 font-mono text-meta uppercase tracking-[0.22em] text-truth">
          No colleges yet. <a className="underline" href="/admin/colleges/new">Create a college first</a> — a claim must attach to one.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
      <StudioHeader kicker="Admin · Brochure claims" title="New brochure claim" />
      <p className="mb-8 font-mono text-meta uppercase tracking-[0.22em] text-newsprint/55">
        Delta is the gap between the claim and reality (0–100). It feeds the
        college’s auto-computed truth score, which recomputes on save.
      </p>

      <form action={createBrochureClaim} className="space-y-6">
        <label className="block">
          <span className="block font-mono text-meta uppercase tracking-[0.25em] text-newsprint/60">
            College <span className="ml-1 text-truth">*</span>
          </span>
          <select
            name="college_id"
            required
            defaultValue={colleges[0]?.id ?? ""}
            className="can-fade mt-2 w-full border-b border-newsprint/30 bg-[#141210] py-2 text-newsprint outline-none focus:border-truth"
          >
            {colleges.map((c) => (
              <option key={c.id} value={c.id} className="bg-ink">
                {c.short_name}
              </option>
            ))}
          </select>
        </label>

        <TextareaField label="Claim" name="claim" rows={3} required hint="What the brochure says" />
        <TextareaField label="Truth" name="truth" rows={3} required hint="What it actually is" />

        <div className="grid grid-cols-3 gap-5">
          <SelectField label="Category" name="category" options={CATEGORIES} />
          <TextField label="Delta (0–100)" name="delta" type="number" defaultValue={50} min={0} max={100} />
          <TextField label="Position" name="position" type="number" defaultValue={0} />
        </div>

        <div className="flex items-center gap-3 border-t border-newsprint/10 pt-6">
          <button
            type="submit"
            className="bg-truth px-5 py-2.5 font-mono text-meta uppercase tracking-[0.3em] text-newsprint hover:bg-truth/85"
          >
            Create claim →
          </button>
          <a
            href="/admin/brochure-claims"
            className="font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55 hover:text-newsprint"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
