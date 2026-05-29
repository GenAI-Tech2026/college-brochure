import Link from "next/link";
import { sql } from "@/lib/db";
import { StudioHeader } from "@/components/admin/Field";

export const metadata = { title: "Truth revelations" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  headline: string;
  weight: number;
  college_short: string;
};

export default async function TruthRevelationsListPage() {
  const rows = await sql<Row[]>`
    SELECT t.id, t.headline, t.weight, c.short_name AS college_short
    FROM uf_truth_revelations t
    JOIN uf_colleges c ON c.id = t.college_id
    ORDER BY t.weight DESC
  `;
  return (
    <div className="px-6 py-10 md:px-10 md:py-14">
      <StudioHeader
        kicker="Admin · Collections"
        title="Truth revelations"
        rightCol={
          <Link
            href="/admin/truth-revelations/new"
            className="bg-truth px-3 py-1.5 font-mono text-meta uppercase tracking-[0.22em] text-newsprint hover:bg-truth/85"
          >
            + New revelation
          </Link>
        }
      />
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-newsprint/15 text-left font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55">
            <th className="w-[60%] py-3">Headline</th>
            <th className="w-[20%] py-3">College</th>
            <th className="w-[14%] py-3 text-right">Weight</th>
            <th className="w-[6%] py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-newsprint/8 hover:bg-newsprint/5">
              <td className="py-3 text-newsprint">{r.headline}</td>
              <td className="py-3 text-newsprint/70">{r.college_short}</td>
              <td className="py-3 text-right font-mono [font-variant-numeric:tabular-nums] text-truth">
                {r.weight}
              </td>
              <td className="py-3 text-right">
                <Link
                  href={`/admin/truth-revelations/${r.id}`}
                  className="font-mono text-meta uppercase tracking-[0.25em] text-truth hover:underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
