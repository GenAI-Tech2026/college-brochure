import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import {
  StudioHeader,
  TextField,
  TextareaField,
  SelectField,
  SubmitRow,
} from "@/components/admin/Field";
import { updateBrochureClaim, deleteBrochureClaim } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

const CATEGORIES = ["placements", "infrastructure", "faculty", "campus-life", "fees"] as const;

type Row = {
  id: number;
  college_id: number;
  claim: string;
  truth: string;
  category: string;
  delta: number;
  position: number;
};
type College = { id: number; short_name: string };

export default async function EditBrochureClaimPage({
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
      SELECT id, college_id, claim, truth, category, delta, position
      FROM uf_brochure_claims WHERE id = ${id} LIMIT 1
    `,
    sql<College[]>`SELECT id, short_name FROM uf_colleges ORDER BY short_name`,
  ]);
  if (!row) notFound();

  const save = updateBrochureClaim.bind(null, id);
  const del = deleteBrochureClaim.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
      <StudioHeader
        kicker={`Admin · Brochure claims · #${row.id}`}
        title={row.claim.slice(0, 60)}
      />
      {ok ? (
        <p className="mb-6 border-l-2 border-truth bg-truth/10 px-4 py-2 font-mono text-meta uppercase tracking-[0.25em] text-truth">
          Saved.
        </p>
      ) : null}
      <form action={save} className="space-y-6">
        <label className="block">
          <span className="block font-mono text-meta uppercase tracking-[0.25em] text-newsprint/60">
            College
          </span>
          <select
            name="college_id"
            defaultValue={row.college_id}
            required
            className="can-fade mt-2 w-full border-b border-newsprint/30 bg-[#141210] py-2 text-newsprint outline-none focus:border-truth"
          >
            {colleges.map((c) => (
              <option key={c.id} value={c.id} className="bg-ink">
                {c.short_name}
              </option>
            ))}
          </select>
        </label>

        <TextareaField label="Claim" name="claim" defaultValue={row.claim} rows={3} required />
        <TextareaField label="Truth" name="truth" defaultValue={row.truth} rows={3} required />

        <div className="grid grid-cols-3 gap-5">
          <SelectField label="Category" name="category" options={CATEGORIES} defaultValue={row.category} />
          <TextField label="Delta (0–100)" name="delta" type="number" defaultValue={row.delta} />
          <TextField label="Position" name="position" type="number" defaultValue={row.position} />
        </div>

        <SubmitRow showDelete deleteFormId="delete-bc" cancelHref="/admin/brochure-claims" />
      </form>
      <form id="delete-bc" action={del} className="hidden" />
    </div>
  );
}
