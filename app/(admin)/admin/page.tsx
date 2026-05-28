import Link from "next/link";
import { sql } from "@/lib/db";

export const metadata = { title: "Dashboard" };

type CountRow = { count: number };
type RecentReview = {
  id: number;
  title: string;
  author_pseudonym: string;
  college_slug: string;
  vibe: string;
  published_at: Date;
  truth_score: number;
};
type VibeRow = { vibe: string; count: number };
type TierRow = { tier: string; count: number };

export default async function DashboardPage() {
  const [
    [{ count: colleges }],
    [{ count: reviews }],
    [{ count: students }],
    [{ count: claims }],
    [{ count: revs }],
    [{ count: pending }],
    recent,
    vibes,
    tiers,
  ] = await Promise.all([
    sql<CountRow[]>`SELECT count(*)::int FROM uf_colleges`,
    sql<CountRow[]>`SELECT count(*)::int FROM uf_reviews`,
    sql<CountRow[]>`SELECT count(*)::int FROM uf_verified_students`,
    sql<CountRow[]>`SELECT count(*)::int FROM uf_brochure_claims`,
    sql<CountRow[]>`SELECT count(*)::int FROM uf_truth_revelations`,
    sql<CountRow[]>`SELECT count(*)::int FROM uf_submissions WHERE status = 'pending'`,
    sql<RecentReview[]>`
      SELECT id, title, author_pseudonym, college_slug, vibe, published_at, truth_score
      FROM uf_reviews
      ORDER BY published_at DESC
      LIMIT 8
    `,
    sql<VibeRow[]>`
      SELECT vibe, count(*)::int AS count
      FROM uf_reviews
      GROUP BY vibe
      ORDER BY count DESC
    `,
    sql<TierRow[]>`
      SELECT tier, count(*)::int AS count
      FROM uf_colleges
      GROUP BY tier
      ORDER BY tier
    `,
  ]);

  const tiles = [
    { label: "Pending inbox", value: pending, href: "/admin/submissions?status=pending", accent: pending > 0 },
    { label: "Colleges", value: colleges, href: "/admin/colleges" },
    { label: "Reviews", value: reviews, href: "/admin/reviews" },
    { label: "Verified students", value: students, href: "/admin/verified-students" },
    { label: "Brochure claims", value: claims, href: "/admin/brochure-claims" },
    { label: "Truth revelations", value: revs, href: "/admin/truth-revelations" },
  ];

  const totalReviewsForBar = vibes.reduce((s, v) => s + v.count, 0) || 1;

  return (
    <div className="px-6 py-10 md:px-10 md:py-14">
      <header>
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
          Admin · Dashboard
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-newsprint md:text-5xl">
          The file, at a glance.
        </h1>
      </header>

      {/* TILES */}
      <section className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-6">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className={
              "group border bg-[#141210] p-5 transition-colors " +
              (t.accent
                ? "border-truth/50 hover:border-truth"
                : "border-newsprint/12 hover:border-truth/50")
            }
          >
            <p className="font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55">
              {t.label}
            </p>
            <p className="mt-3 font-display text-5xl font-black text-newsprint [font-variant-numeric:tabular-nums]">
              {t.value.toLocaleString()}
            </p>
            <p className="mt-1 font-mono text-meta uppercase tracking-[0.2em] text-newsprint/45 group-hover:text-truth">
              View →
            </p>
          </Link>
        ))}
      </section>

      <section className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* RECENT REVIEWS */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
            Recent reviews
          </h2>
          <ol className="divide-y divide-newsprint/10 border-y border-newsprint/10">
            {recent.map((r) => (
              <li
                key={r.id}
                className="grid grid-cols-12 items-baseline gap-x-4 py-4 text-sm"
              >
                <span className="col-span-1 font-mono text-meta uppercase tracking-[0.18em] text-truth">
                  {r.vibe.slice(0, 4)}
                </span>
                <Link
                  href={`/admin/reviews/${r.id}`}
                  className="col-span-7 truncate font-sans text-newsprint hover:text-truth"
                >
                  {r.title}
                </Link>
                <span className="col-span-2 truncate font-mono text-meta uppercase tracking-[0.18em] text-newsprint/50">
                  {r.author_pseudonym}
                </span>
                <span className="col-span-2 text-right font-mono text-meta uppercase tracking-[0.18em] text-newsprint/45">
                  {r.published_at.toISOString().slice(0, 10)}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* VIBE + TIER BREAKDOWN */}
        <div className="space-y-10">
          <div>
            <h2 className="mb-4 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
              Reviews by vibe
            </h2>
            <ul className="space-y-3">
              {vibes.map((v) => {
                const pct = Math.round((v.count / totalReviewsForBar) * 100);
                return (
                  <li key={v.vibe} className="space-y-1">
                    <div className="flex items-baseline justify-between font-mono text-meta uppercase tracking-[0.2em]">
                      <span className="text-newsprint/70">{v.vibe}</span>
                      <span className="text-newsprint">
                        {v.count} · {pct}%
                      </span>
                    </div>
                    <div className="h-1 bg-newsprint/10">
                      <div
                        className="h-full bg-truth/80"
                        style={{ width: pct + "%" }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
              Colleges by tier
            </h2>
            <ul className="space-y-2">
              {tiers.map((t) => (
                <li
                  key={t.tier}
                  className="flex items-baseline justify-between border-b border-newsprint/10 py-2 font-mono text-meta uppercase tracking-[0.2em]"
                >
                  <span className="text-newsprint/70">{t.tier}</span>
                  <span className="text-newsprint">{t.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
