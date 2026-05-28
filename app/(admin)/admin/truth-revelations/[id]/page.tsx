import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import {
  StudioHeader,
  TextField,
  TextareaField,
  SubmitRow,
} from "@/components/admin/Field";
import { updateTruthRevelation, deleteTruthRevelation } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

type Row = {
  id: number;
  headline: string;
  dek: string;
  college_id: number;
  weight: number;
};
type College = { id: number; short_name: string };

export default async function EditTruthRevelationPage({
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
      SELECT id, headline, dek, college_id, weight
      FROM uf_truth_revelations WHERE id = ${id} LIMIT 1
    `,
    sql<College[]>`SELECT id, short_name FROM uf_colleges ORDER BY short_name`,
  ]);
  if (!row) notFound();

  const save = updateTruthRevelation.bind(null, id);
  const del = deleteTruthRevelation.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
      <StudioHeader
        kicker={`Admin · Truth revelations · #${row.id}`}
        title={row.headline.slice(0, 60)}
      />
      {ok ? (
        <p className="mb-6 border-l-2 border-truth bg-truth/10 px-4 py-2 font-mono text-meta uppercase tracking-[0.25em] text-truth">
          Saved.
        </p>
      ) : null}
      <form action={save} className="space-y-6">
        <TextareaField label="Headline" name="headline" defaultValue={row.headline} rows={2} required />
        <TextareaField label="Dek" name="dek" defaultValue={row.dek} rows={4} required />

        <div className="grid grid-cols-2 gap-5">
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
          <TextField label="Weight (sort)" name="weight" type="number" defaultValue={row.weight} />
        </div>

        <SubmitRow showDelete deleteFormId="delete-tr" cancelHref="/admin/truth-revelations" />
      </form>
      <form id="delete-tr" action={del} className="hidden" />
    </div>
  );
}
