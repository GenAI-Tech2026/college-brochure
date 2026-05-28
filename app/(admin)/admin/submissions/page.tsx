import Link from "next/link";
import { sql } from "@/lib/db";
import { StudioHeader } from "@/components/admin/Field";

export const metadata = { title: "Submissions" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  case_no: string;
  college_name: string;
  pseudonym: string;
  status: string;
  submitted_at: Date;
  has_receipts: boolean;
};

export default async function SubmissionsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const rows = await sql<Row[]>`
    SELECT id, case_no, college_name, pseudonym, status, submitted_at, has_receipts
    FROM uf_submissions
    WHERE (${status ?? null}::text IS NULL OR status = ${status ?? null})
    ORDER BY submitted_at DESC
    LIMIT 200
  `;

  const counts = await sql<{ status: string; count: number }[]>`
    SELECT status, count(*)::int AS count FROM uf_submissions GROUP BY status
  `;
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.count]));

  return (
    <div className="px-6 py-10 md:px-10 md:py-14">
      <StudioHeader
        kicker="Admin · Inbox"
        title="Submissions"
        rightCol={
          <p className="font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55">
            {rows.length} shown · {byStatus.pending ?? 0} pending
          </p>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { v: "", label: "All" },
          { v: "pending", label: `Pending (${byStatus.pending ?? 0})` },
          { v: "verified", label: `Verified (${byStatus.verified ?? 0})` },
          { v: "rejected", label: `Rejected (${byStatus.rejected ?? 0})` },
          { v: "published", label: `Published (${byStatus.published ?? 0})` },
        ].map((f) => {
          const active = (status ?? "") === f.v;
          const href = f.v ? `/admin/submissions?status=${f.v}` : "/admin/submissions";
          return (
            <Link
              key={f.v}
              href={href}
              className={
                "border px-3 py-1.5 font-mono text-meta uppercase tracking-[0.22em] transition-colors " +
                (active
                  ? "border-truth bg-truth/15 text-truth"
                  : "border-newsprint/25 text-newsprint/65 hover:border-newsprint/45")
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-newsprint/15 text-left font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55">
            <th className="w-[12%] py-3">Case</th>
            <th className="w-[28%] py-3">College</th>
            <th className="w-[18%] py-3">Pseudonym</th>
            <th className="w-[10%] py-3">Receipts</th>
            <th className="w-[12%] py-3">Status</th>
            <th className="w-[14%] py-3 text-right">Submitted</th>
            <th className="w-[6%] py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center font-mono text-meta uppercase tracking-[0.3em] text-newsprint/45">
                No submissions {status ? `with status “${status}”` : "yet"}.
              </td>
            </tr>
          ) : null}
          {rows.map((r) => {
            const statusColor =
              r.status === "verified" || r.status === "published"
                ? "text-[#06D6A0]"
                : r.status === "rejected"
                ? "text-truth"
                : "text-newsprint/75";
            return (
              <tr key={r.id} className="border-b border-newsprint/8 hover:bg-newsprint/5">
                <td className="py-3 font-mono text-meta uppercase tracking-[0.18em] text-truth">
                  {r.case_no}
                </td>
                <td className="py-3 truncate text-newsprint">{r.college_name}</td>
                <td className="py-3 font-mono text-meta uppercase tracking-[0.18em] text-newsprint/75">
                  {r.pseudonym}
                </td>
                <td className="py-3 font-mono text-meta uppercase tracking-[0.18em] text-newsprint/70">
                  {r.has_receipts ? "yes" : "—"}
                </td>
                <td
                  className={
                    "py-3 font-mono text-meta uppercase tracking-[0.2em] " + statusColor
                  }
                >
                  {r.status}
                </td>
                <td className="py-3 text-right font-mono text-meta uppercase tracking-[0.18em] text-newsprint/55">
                  {r.submitted_at.toISOString().slice(0, 16).replace("T", " ")}
                </td>
                <td className="py-3 text-right">
                  <Link
                    href={`/admin/submissions/${r.id}`}
                    className="font-mono text-meta uppercase tracking-[0.25em] text-truth hover:underline"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
