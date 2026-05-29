"use client";
import { MagneticButton } from "@/components/MagneticButton";
import type { College } from "@/lib/mock-data/types";

/**
 * One consistent chapter composition for the /showcase route.
 *
 * Every chapter shares the same left-anchored editorial grid (the same
 * discipline as the home page): pinned caption → headline → tagline → a
 * 4-up stat row → pull-quote → exit row. Differentiation comes from the
 * content and the per-chapter shader/constellation re-tint, not from
 * moving the furniture around — which previously caused misalignment and
 * collisions with the fixed right-side chapter index.
 *
 * Layout discipline:
 *   - Content is capped at `max-w-5xl` and left-aligned.
 *   - `md:pr-44` reserves the right gutter so nothing ever runs under the
 *     fixed chapter index rail.
 *   - Type sizes are clamped to sane maxima (no 28vw numbers overflowing
 *     their column).
 *
 * The `data-layer` hooks (kicker/headline/deck/stat/quote/exit) and
 * `data-skewable` are preserved so ShowcaseClient's GSAP entrance +
 * parallax timelines animate each layer unchanged.
 */
export function ChapterLayout({
  chapter: c,
  index: i,
  accent,
}: {
  chapter: College;
  index: number;
  accent: string;
}) {
  return (
    <div className="relative flex min-h-[100svh] flex-col justify-center pt-40 pb-24">
      <Caption c={c} i={i} accent={accent} />

      <div className="w-full max-w-5xl md:pr-44">
        <h2
          data-layer="headline"
          data-skewable
          className="font-display font-black uppercase leading-[0.85] tracking-[-0.04em] text-newsprint will-change-transform"
          style={{ fontSize: "clamp(2.75rem, 9vw, 8rem)" }}
        >
          {c.shortName}
        </h2>

        <p
          data-layer="deck"
          className="mt-6 max-w-2xl font-serif italic text-newsprint/85"
          style={{ fontSize: "clamp(1.375rem, 2.8vw, 2.5rem)" }}
        >
          &ldquo;{c.tagline}&rdquo;
        </p>

        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-y border-newsprint/15 py-8 sm:grid-cols-4">
          <Stat label="Truth" value={`${c.truthScore}`} suffix="/100" accent={accent} />
          <Stat label="Reviews" value={`${c.reviewCount}`} />
          <Stat label="Verified" value={`${c.verifiedCount}`} />
          <Stat label="Tier" value={c.tier.replace("tier-", "T·")} accent={accent} accentValue />
        </div>

        <blockquote
          data-layer="quote"
          className="mt-12 max-w-3xl border-l-2 pl-6 font-display italic leading-[1.05] text-newsprint/90"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2.75rem)", borderColor: accent }}
        >
          &ldquo;{c.longRead.pullQuote}&rdquo;
        </blockquote>

        <div className="mt-14">
          <ExitRow c={c} />
        </div>
      </div>
    </div>
  );
}

/** Chapter caption pinned top-left. top-24 (96px) clears the ~64px fixed nav. */
function Caption({ c, i, accent }: { c: College; i: number; accent: string }) {
  return (
    <div
      data-layer="kicker"
      className="absolute left-0 top-24 z-[1] flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-meta uppercase tracking-[0.4em] text-newsprint/70 md:top-28"
    >
      <span className="text-newsprint">Chapter {String(i + 1).padStart(2, "0")}</span>
      <span className="inline-block h-px w-12 bg-newsprint/30" />
      <span style={{ color: accent }}>Case · {c.caseFileNumber}</span>
      <span className="inline-block h-px w-12 bg-newsprint/30" />
      <span className="text-newsprint/60">
        {c.city}, {c.state}
      </span>
    </div>
  );
}

/** Open-the-file exit row. */
function ExitRow({ c }: { c: College }) {
  return (
    <div
      data-layer="exit"
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-newsprint/15 pt-8"
    >
      <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
        Filed by College Brochure · {c.brochureClaims.length} claims redacted
      </p>
      <MagneticButton as="a" href={`/college/${c.slug}`} variant="ghost" strength={0.4}>
        Open the full file
        <span aria-hidden>→</span>
      </MagneticButton>
    </div>
  );
}

/** Stat block — one cell of the 4-up row. */
function Stat({
  label,
  value,
  suffix,
  accent,
  accentValue,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: string;
  accentValue?: boolean;
}) {
  return (
    <div data-layer="stat">
      <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">{label}</p>
      <p
        className="mt-2 font-display font-black leading-none tracking-[-0.03em] text-newsprint"
        style={{
          fontSize: "clamp(2rem, 3.5vw, 3.25rem)",
          color: accentValue ? accent : undefined,
        }}
      >
        {value}
        {suffix && (
          <span style={{ color: accent, fontSize: "0.5em" }}>{suffix}</span>
        )}
      </p>
    </div>
  );
}
