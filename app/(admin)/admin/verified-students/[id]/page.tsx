import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import {
  StudioHeader,
  TextField,
  SelectField,
  SubmitRow,
} from "@/components/admin/Field";
import { updateVerifiedStudent, deleteVerifiedStudent } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

const METHODS = ["id-card", "email-domain", "alumni-roster", "video-selfie"] as const;

type Row = {
  id: number;
  pseudonym: string;
  verification_method: string;
  college_id: number | null;
  submitted_review_count: number;
  trust_score: number;
};
type College = { id: number; short_name: string };

export default async function EditVerifiedStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();
  const { ok } = await searchParams;

  const [[row], colleges] = await Promise.all([
    sql<Row[]>`
      SELECT id, pseudonym, verification_method, college_id, submitted_review_count, trust_score
      FROM uf_verified_students WHERE id = ${id} LIMIT 1
    `,
    sql<College[]>`SELECT id, short_name FROM uf_colleges ORDER BY short_name`,
  ]);
  if (!row) notFound();

  const save = updateVerifiedStudent.bind(null, id);
  const del = deleteVerifiedStudent.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 md:px-10 md:py-14">
      <StudioHeader
        kicker={`Admin · Verified students · #${row.id}`}
        title={row.pseudonym}
      />
      {ok ? (
        <p className="mb-6 border-l-2 border-truth bg-truth/10 px-4 py-2 font-mono text-meta uppercase tracking-[0.25em] text-truth">
          Saved.
        </p>
      ) : null}
      <form action={save} className="space-y-6">
        <TextField label="Pseudonym" name="pseudonym" defaultValue={row.pseudonym} required />
        <SelectField
          label="Verification method"
          name="verification_method"
          options={METHODS}
          defaultValue={row.verification_method}
        />
        <label className="block">
          <span className="block font-mono text-meta uppercase tracking-[0.25em] text-newsprint/60">
            College
          </span>
          <select
            name="college_id"
            defaultValue={row.college_id ?? ""}
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
          <TextField
            label="Submitted reviews"
            name="submitted_review_count"
            type="number"
            defaultValue={row.submitted_review_count}
          />
          <TextField
            label="Trust score (0–100)"
            name="trust_score"
            type="number"
            defaultValue={row.trust_score}
            min={0}
            max={100}
          />
        </div>

        <SubmitRow showDelete deleteFormId="delete-vs" cancelHref="/admin/verified-students" />
      </form>
      <form id="delete-vs" action={del} className="hidden" />
    </div>
  );
}
