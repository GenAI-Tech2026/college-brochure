import Link from "next/link";
import { sql } from "@/lib/db";
import { StudioHeader } from "@/components/admin/Field";

export const metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  title: string;
  author_pseudonym: string;
  college_slug: string;
  vibe: string;
  rating: number;
  truth_score: number;
  published_at: Date;
};

export default async function ReviewsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; vibe?: string }>;
}) {
  const { q, vibe } = await searchParams;
  const rows = await sql<Row[]>`
    SELECT id, title, author_pseudonym, college_slug, vibe, rating, truth_score, published_at
    FROM uf_reviews
    WHERE (${q ?? null}::text IS NULL OR title ILIKE '%' || ${q ?? null} || '%' OR author_pseudonym ILIKE '%' || ${q ?? null} || '%')
      AND (${vibe ?? null}::text IS NULL OR vibe = ${vibe ?? null})
    ORDER BY published_at DESC
    LIMIT 200
  `;
  return (
    <div className="px-6 py-10 md:px-10 md:py-14">
      <StudioHeader
        kicker="Admin · Collections"
        title="Reviews"
        rightCol={
          <Link
            href="/admin/reviews/new"
            className="bg-truth px-3 py-1.5 font-mono text-meta uppercase tracking-[0.22em] text-newsprint hover:bg-truth/85"
          >
            + New review
          </Link>
        }
      />

      <form className="mb-6 grid grid-cols-12 gap-3 text-sm">
        <input
          name="q"
          aria-label="Search reviews by title or pseudonym"
          defaultValue={q ?? ""}
          placeholder="Search title or pseudonym…"
          className="col-span-12 border-b border-newsprint/25 bg-transparent py-2 text-newsprint outline-none focus:border-truth md:col-span-7"
        />
        <select
          name="vibe"
          aria-label="Filter reviews by vibe"
          defaultValue={vibe ?? ""}
          className="col-span-6 border-b border-newsprint/25 bg-[#141210] py-2 text-newsprint outline-none focus:border-truth md:col-span-3"
        >
          <option value="">all vibes</option>
          {["rage", "warm", "deadpan", "warning", "redeemed"].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="col-span-6 border border-newsprint/30 py-2 font-mono text-meta uppercase tracking-[0.3em] text-newsprint hover:bg-newsprint/5 md:col-span-2"
        >
          Filter
        </button>
      </form>

      <p className="mb-4 font-mono text-meta uppercase tracking-[0.2em] text-newsprint/55">
        {rows.length} result{rows.length === 1 ? "" : "s"}
      </p>

      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-newsprint/15 text-left font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55">
            <th className="w-[40%] py-3">Title</th>
            <th className="w-[15%] py-3">Author</th>
            <th className="w-[18%] py-3">College</th>
            <th className="w-[8%] py-3">Vibe</th>
            <th className="w-[7%] py-3 text-right">Truth</th>
            <th className="w-[7%] py-3 text-right">Date</th>
            <th className="w-[5%] py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-newsprint/8 hover:bg-newsprint/5">
              <td className="py-3 pr-3 text-newsprint">
                <Link href={`/admin/reviews/${r.id}`} className="hover:text-truth">
                  {r.title}
                </Link>
              </td>
              <td className="py-3 font-mono text-meta uppercase tracking-[0.18em] text-newsprint/70">
                {r.author_pseudonym}
              </td>
              <td className="py-3 truncate text-newsprint/70">{r.college_slug}</td>
              <td className="py-3 font-mono text-meta uppercase tracking-[0.18em] text-truth">
                {r.vibe}
              </td>
              <td className="py-3 text-right font-mono [font-variant-numeric:tabular-nums] text-newsprint">
                {r.truth_score}
              </td>
              <td className="py-3 text-right font-mono text-meta uppercase tracking-[0.18em] text-newsprint/55">
                {r.published_at.toISOString().slice(0, 10)}
              </td>
              <td className="py-3 text-right">
                <Link
                  href={`/admin/reviews/${r.id}`}
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
