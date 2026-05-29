import { sql } from "@/lib/db";
import {
  StudioHeader,
  TextField,
  SelectField,
} from "@/components/admin/Field";
import { createVerifiedStudent } from "@/lib/admin/actions";

export const metadata = { title: "New verified student" };
export const dynamic = "force-dynamic";

const METHODS = ["id-card", "email-domain", "alumni-roster", "video-selfie"] as const;

export default async function NewVerifiedStudentPage() {
  const colleges = await sql<{ id: number; short_name: string }[]>`
    SELECT id, short_name FROM uf_colleges ORDER BY short_name
  `;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 md:px-10 md:py-14">
      <StudioHeader kicker="Admin · Verified students" title="New verified student" />

      <form action={createVerifiedStudent} className="mt-4 space-y-6">
        <TextField label="Pseudonym" name="pseudonym" required hint="Must be unique" />
        <SelectField label="Verification method" name="verification_method" options={METHODS} />

        <label className="block">
          <span className="block font-mono text-meta uppercase tracking-[0.25em] text-newsprint/60">
            College
          </span>
          <select
            name="college_id"
            defaultValue=""
            className="can-fade mt-2 w-full border-b border-newsprint/30 bg-[#141210] py-2 text-newsprint outline-none focus:border-truth"
          >
            <option value="" className="bg-ink">— none —</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id} className="bg-ink">
                {c.short_name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-5">
          <TextField label="Submitted reviews" name="submitted_review_count" type="number" defaultValue={0} />
          <TextField label="Trust score (0–100)" name="trust_score" type="number" defaultValue={50} min={0} max={100} />
        </div>

        <div className="flex items-center gap-3 border-t border-newsprint/10 pt-6">
          <button
            type="submit"
            className="bg-truth px-5 py-2.5 font-mono text-meta uppercase tracking-[0.3em] text-newsprint hover:bg-truth/85"
          >
            Create student →
          </button>
          <a
            href="/admin/verified-students"
            className="font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55 hover:text-newsprint"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
