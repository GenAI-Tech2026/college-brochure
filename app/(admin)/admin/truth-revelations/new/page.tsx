import { sql } from "@/lib/db";
import {
  StudioHeader,
  TextField,
  TextareaField,
} from "@/components/admin/Field";
import { createTruthRevelation } from "@/lib/admin/actions";

export const metadata = { title: "New truth revelation" };
export const dynamic = "force-dynamic";

export default async function NewTruthRevelationPage() {
  const colleges = await sql<{ id: number; short_name: string }[]>`
    SELECT id, short_name FROM uf_colleges ORDER BY short_name
  `;

  if (!colleges.length) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
        <StudioHeader kicker="Admin · Truth revelations" title="New truth revelation" />
        <p className="border-l-2 border-truth bg-truth/10 px-4 py-3 font-mono text-meta uppercase tracking-[0.22em] text-truth">
          No colleges yet. <a className="underline" href="/admin/colleges/new">Create a college first</a> — a revelation must attach to one.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
      <StudioHeader kicker="Admin · Truth revelations" title="New truth revelation" />

      <form action={createTruthRevelation} className="mt-4 space-y-6">
        <TextareaField label="Headline" name="headline" rows={2} required />
        <TextareaField label="Dek" name="dek" rows={4} required />

        <div className="grid grid-cols-2 gap-5">
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
          <TextField label="Weight (sort)" name="weight" type="number" defaultValue={0} />
        </div>

        <div className="flex items-center gap-3 border-t border-newsprint/10 pt-6">
          <button
            type="submit"
            className="bg-truth px-5 py-2.5 font-mono text-meta uppercase tracking-[0.3em] text-newsprint hover:bg-truth/85"
          >
            Create revelation →
          </button>
          <a
            href="/admin/truth-revelations"
            className="font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55 hover:text-newsprint"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
