import type { Review } from "@/lib/mock-data/types";
import { summarizeSentiment } from "@/lib/utils/reality";

/**
 * Distribution strip for the Evidence Wall.
 *
 * A site that shows only outrage reads as a hate site, and people discount
 * it. Showing the *whole* spread — rating histogram + sentiment mix, the
 * fond and "came around" reviews included — is what makes the negative
 * reviews believable as reality rather than a campaign. Counterintuitively,
 * surfacing the positives strengthens the case.
 *
 * Bars are sized with inline widths and never animated, so there's no
 * layout shift and nothing for a perf audit to flag.
 */

// Fills stay within the ink/truth palette — truth red is reserved for the
// angriest slice, everything else is a tint of ink so no new hue enters.
const VIBE_FILL: Record<Review["vibe"], string> = {
  rage: "var(--color-truth)",
  warning: "rgba(10,10,10,0.82)",
  deadpan: "rgba(10,10,10,0.58)",
  warm: "rgba(10,10,10,0.38)",
  redeemed: "rgba(10,10,10,0.20)",
};

export function SentimentBreakdown({ reviews }: { reviews: Review[] }) {
  const s = summarizeSentiment(reviews);
  if (!s.total) return null;
  const maxRating = Math.max(...s.ratings, 1);

  return (
    <div className="mb-16 grid grid-cols-12 gap-8 border-y border-ink/15 py-10">
      {/* Average + framing */}
      <div className="col-span-12 md:col-span-3">
        <p className="font-mono text-meta uppercase tracking-[0.25em] text-ink/60">
          The full spread
        </p>
        <p className="mt-3 font-display text-6xl font-black leading-none tracking-[-0.03em] text-ink [font-variant-numeric:tabular-nums]">
          {s.avgRating.toFixed(1)}
          <span className="text-2xl text-truth"> ★</span>
        </p>
        <p className="mt-2 max-w-[34ch] font-serif italic text-ink/65">
          Across {s.total} verified reviews — the praise shown alongside the
          rage, so you see the real distribution.
        </p>
      </div>

      {/* Rating histogram */}
      <div className="col-span-12 md:col-span-4">
        <p className="mb-4 font-mono text-meta uppercase tracking-[0.2em] text-ink/55">
          Ratings
        </p>
        <ul className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = s.ratings[star - 1];
            const pct = Math.round((count / maxRating) * 100);
            return (
              <li key={star} className="flex items-center gap-3">
                <span className="w-6 shrink-0 font-mono text-meta text-ink/60 [font-variant-numeric:tabular-nums]">
                  {star}★
                </span>
                <span className="relative h-3 flex-1 bg-ink/10">
                  <span
                    className="absolute inset-y-0 left-0 bg-ink"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-6 shrink-0 text-right font-mono text-meta text-ink/60 [font-variant-numeric:tabular-nums]">
                  {count}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Sentiment mix */}
      <div className="col-span-12 md:col-span-5">
        <p className="mb-4 font-mono text-meta uppercase tracking-[0.2em] text-ink/55">
          Sentiment mix
        </p>
        <div
          className="flex h-3 w-full overflow-hidden"
          role="img"
          aria-label={s.vibes.map((v) => `${v.label} ${v.pct}%`).join(", ")}
        >
          {s.vibes.map((v) => (
            <span
              key={v.vibe}
              style={{ width: `${v.pct}%`, background: VIBE_FILL[v.vibe] }}
              title={`${v.label} · ${v.pct}%`}
            />
          ))}
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {s.vibes.map((v) => (
            <li
              key={v.vibe}
              className="flex items-center gap-2 font-mono text-meta uppercase tracking-[0.15em] text-ink/70"
            >
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5"
                style={{ background: VIBE_FILL[v.vibe] }}
              />
              {v.label}{" "}
              <span className="text-ink/45 [font-variant-numeric:tabular-nums]">{v.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
