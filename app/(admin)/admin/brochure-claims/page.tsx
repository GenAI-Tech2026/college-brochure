import Link from "next/link";
import { sql } from "@/lib/db";
import { StudioHeader } from "@/components/admin/Field";

export const metadata = { title: "Brochure claims" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  claim: string;
  category: string;
  delta: number;
  college_short: string;
};

export default async function BrochureClaimsListPage() {
  const rows = await sql<Row[]>`
    SELECT b.id, b.claim, b.category, b.delta, c.short_name AS college_short
    FROM uf_brochure_claims b
    JOIN uf_colleges c ON c.id = b.college_id
    ORDER BY c.short_name, b.position
  `;
  return (
    <div className="px-6 py-10 md:px-10 md:py-14">
      <StudioHeader kicker="Admin · Collections" title="Brochure claims" />
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-newsprint/15 text-left font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55">
            <th className="w-[18%] py-3">College</th>
            <th className="w-[14%] py-3">Category</th>
            <th className="w-[10%] py-3 text-right">Δ</th>
            <th className="w-[52%] py-3">Claim</th>
            <th className="w-[6%] py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-newsprint/8 hover:bg-newsprint/5">
              <td className="py-3 text-newsprint">{r.college_short}</td>
              <td className="py-3 font-mono text-meta uppercase tracking-[0.18em] text-newsprint/70">
                {r.category}
              </td>
              <td className="py-3 text-right font-mono [font-variant-numeric:tabular-nums] text-truth">
                {r.delta}%
              </td>
              <td className="py-3 truncate text-newsprint/85">{r.claim}</td>
              <td className="py-3 text-right">
                <Link
                  href={`/admin/brochure-claims/${r.id}`}
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
