import Link from "next/link";
import { sql } from "@/lib/db";
import { StudioHeader } from "@/components/admin/Field";
import { recomputeAll } from "@/lib/admin/actions";

export const metadata = { title: "Colleges" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  slug: string;
  name: string;
  short_name: string;
  city: string;
  tier: string;
  truth_score: number;
  review_count: number;
};

export default async function CollegesListPage() {
  const rows = await sql<Row[]>`
    SELECT id, slug, name, short_name, city, tier, truth_score, review_count
    FROM uf_colleges
    ORDER BY name
  `;
  return (
    <div className="px-6 py-10 md:px-10 md:py-14">
      <StudioHeader
        kicker="Admin · Collections"
        title="Colleges"
        rightCol={
          <div className="flex items-center gap-3">
            <form action={recomputeAll}>
              <button
                type="submit"
                className="border border-newsprint/30 px-3 py-1.5 font-mono text-meta uppercase tracking-[0.22em] text-newsprint/65 hover:border-truth hover:text-truth"
              >
                Recompute scores
              </button>
            </form>
            <Link
              href="/admin/colleges/new"
              className="bg-truth px-3 py-1.5 font-mono text-meta uppercase tracking-[0.22em] text-newsprint hover:bg-truth/85"
            >
              + New college
            </Link>
          </div>
        }
      />
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-newsprint/15 text-left font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55">
            <th className="w-[20%] py-3">Short name</th>
            <th className="w-[28%] py-3">Name</th>
            <th className="w-[14%] py-3">City</th>
            <th className="w-[10%] py-3">Tier</th>
            <th className="w-[12%] py-3 text-right">Truth score</th>
            <th className="w-[10%] py-3 text-right">Reviews</th>
            <th className="w-[6%] py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-b border-newsprint/8 hover:bg-newsprint/5"
            >
              <td className="py-3 font-display font-medium text-newsprint">
                {r.short_name}
              </td>
              <td className="py-3 text-newsprint/85">{r.name}</td>
              <td className="py-3 text-newsprint/70">{r.city}</td>
              <td className="py-3 font-mono text-meta uppercase tracking-[0.2em] text-newsprint/70">
                {r.tier}
              </td>
              <td className="py-3 text-right font-mono [font-variant-numeric:tabular-nums] text-newsprint">
                {r.truth_score}
              </td>
              <td className="py-3 text-right font-mono [font-variant-numeric:tabular-nums] text-newsprint/70">
                {r.review_count}
              </td>
              <td className="py-3 text-right">
                <Link
                  href={`/admin/colleges/${r.id}`}
                  className="font-mono text-meta uppercase tracking-[0.25em] text-truth hover:underline"
                >
                  Edit →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
