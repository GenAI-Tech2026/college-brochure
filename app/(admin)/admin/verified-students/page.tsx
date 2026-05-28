import Link from "next/link";
import { sql } from "@/lib/db";
import { StudioHeader } from "@/components/admin/Field";

export const metadata = { title: "Verified students" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  pseudonym: string;
  verification_method: string;
  submitted_review_count: number;
  trust_score: number;
  college_short: string | null;
};

export default async function VerifiedStudentsListPage() {
  const rows = await sql<Row[]>`
    SELECT s.id, s.pseudonym, s.verification_method, s.submitted_review_count, s.trust_score,
           c.short_name AS college_short
    FROM uf_verified_students s
    LEFT JOIN uf_colleges c ON c.id = s.college_id
    ORDER BY s.pseudonym
  `;
  return (
    <div className="px-6 py-10 md:px-10 md:py-14">
      <StudioHeader kicker="Admin · Collections" title="Verified students" />
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-newsprint/15 text-left font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55">
            <th className="w-[26%] py-3">Pseudonym</th>
            <th className="w-[22%] py-3">Method</th>
            <th className="w-[22%] py-3">College</th>
            <th className="w-[12%] py-3 text-right">Reviews</th>
            <th className="w-[12%] py-3 text-right">Trust</th>
            <th className="w-[6%] py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-newsprint/8 hover:bg-newsprint/5">
              <td className="py-3 font-display font-medium text-newsprint">{r.pseudonym}</td>
              <td className="py-3 font-mono text-meta uppercase tracking-[0.18em] text-newsprint/70">
                {r.verification_method}
              </td>
              <td className="py-3 text-newsprint/70">{r.college_short ?? "—"}</td>
              <td className="py-3 text-right font-mono [font-variant-numeric:tabular-nums] text-newsprint">
                {r.submitted_review_count}
              </td>
              <td className="py-3 text-right font-mono [font-variant-numeric:tabular-nums] text-newsprint">
                {r.trust_score}
              </td>
              <td className="py-3 text-right">
                <Link
                  href={`/admin/verified-students/${r.id}`}
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
