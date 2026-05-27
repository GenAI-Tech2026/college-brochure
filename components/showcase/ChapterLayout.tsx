"use client";
import { MagneticButton } from "@/components/MagneticButton";
import type { College } from "@/lib/mock-data/types";

/**
 * Five distinct chapter compositions for the /showcase route.
 *
 * The brief: "make sure there is differentiation between each case." With
 * the palette restrained to a single vermillion, we can't differentiate
 * via colour — so we differentiate via composition. Each chapter gets a
 * layout that fits its editorial character:
 *
 *   01 EDITORIAL — ITE Bombay, the establishment. Newspaper-classical,
 *                  centred headline, stats row, quote below. The
 *                  "baseline" against which the other chapters depart.
 *   02 SPLIT     — Sai DU, the duplicity. 50/50 split: small headline
 *                  on the left, massive pull-quote dominating the right.
 *                  Quote-as-protagonist, mirrors the marble-vs-mould theme.
 *   03 STACK     — Nila Arts, the romance. Intimate vertical stack;
 *                  tagline larger than the headline. Numbers minimal.
 *   04 FRAME     — ABS, the bought ranking. Data is the accusation:
 *                  truth-score huge in the centre, headline reduced to
 *                  a caption, quote running across the top as a
 *                  newspaper banner.
 *   05 MINIMAL   — KRU, the honest underdog. Mostly empty space. One
 *                  big number, one line of context. The chapter that
 *                  proves restraint can be loudest.
 *
 * All five share `data-layer` hooks (kicker/headline/deck/stat/quote/exit)
 * so the parent ShowcaseClient's GSAP timeline animates each layer
 * consistently regardless of where it's positioned in the layout.
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
  switch (i % 5) {
    case 1: return <SplitLayout c={c} i={i} accent={accent} />;
    case 2: return <StackLayout c={c} i={i} accent={accent} />;
    case 3: return <FrameLayout c={c} i={i} accent={accent} />;
    case 4: return <MinimalLayout c={c} i={i} accent={accent} />;
    case 0:
    default: return <EditorialLayout c={c} i={i} accent={accent} />;
  }
}

interface LayoutProps { c: College; i: number; accent: string; }

/** Tiny shared chrome — the chapter caption pinned top-left.
 *  top-24 (96 px) clears the ~64 px tall fixed nav so the caption
 *  never gets eaten when the nav re-appears on scroll-up. */
function Caption({ c, i, accent }: LayoutProps) {
  return (
    <div data-layer="kicker" className="absolute left-0 top-24 z-[1] flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-meta uppercase tracking-[0.4em] text-newsprint/70 md:top-28">
      <span className="text-newsprint">Chapter {String(i + 1).padStart(2, "0")}</span>
      <span className="inline-block h-px w-12 bg-newsprint/30" />
      <span style={{ color: accent }}>Case · {c.caseFileNumber}</span>
      <span className="inline-block h-px w-12 bg-newsprint/30" />
      <span className="text-newsprint/60">{c.city}, {c.state}</span>
    </div>
  );
}

/** Open-the-file exit row, used by most layouts. */
function ExitRow({ c }: { c: College }) {
  return (
    <div data-layer="exit" className="flex items-center justify-between gap-6 border-t border-newsprint/15 pt-8">
      <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
        Filed by UNFILTERED · {c.brochureClaims.length} claims redacted
      </p>
      <MagneticButton as="a" href={`/college/${c.slug}`} variant="ghost" strength={0.4}>
        Open the full file
        <span aria-hidden>→</span>
      </MagneticButton>
    </div>
  );
}

/** 01 — EDITORIAL — classic centered newspaper composition. */
function EditorialLayout({ c, i, accent }: LayoutProps) {
  return (
    <div className="relative grid min-h-[100svh] grid-cols-12 content-center gap-x-6 gap-y-10 pt-40">
      <Caption c={c} i={i} accent={accent} />

      <h2
        data-layer="headline"
        data-skewable
        className="col-span-12 text-center font-display font-black uppercase leading-[0.85] tracking-[-0.04em] text-newsprint will-change-transform"
        style={{ fontSize: "clamp(3rem, 12vw, 16rem)" }}
      >
        {c.shortName}
      </h2>

      <p data-layer="deck" className="col-span-12 text-center font-serif italic text-newsprint/85 md:text-4xl" style={{ fontSize: "clamp(1.5rem, 3.5vw, 3rem)" }}>
        &ldquo;{c.tagline}&rdquo;
      </p>

      <div className="col-span-12 grid grid-cols-12 gap-6 border-y border-newsprint/15 py-10">
        <Stat label="Truth" value={`${c.truthScore}`} suffix="/100" accent={accent} cols={3} />
        <Stat label="Reviews" value={`${c.reviewCount}`} cols={3} />
        <Stat label="Verified" value={`${c.verifiedCount}`} cols={3} />
        <Stat label="Tier" value={c.tier.replace("tier-", "T·")} cols={3} accent={accent} accentValue />
      </div>

      <blockquote
        data-layer="quote"
        className="col-span-12 mx-auto max-w-4xl border-l-4 pl-6 text-center font-display italic leading-[0.95] text-newsprint"
        style={{ fontSize: "clamp(1.5rem, 3.5vw, 3rem)", borderColor: accent }}
      >
        &ldquo;{c.longRead.pullQuote}&rdquo;
      </blockquote>

      <div className="col-span-12">
        <ExitRow c={c} />
      </div>
    </div>
  );
}

/** 02 — SPLIT — small headline on the left, huge pull-quote on the right. */
function SplitLayout({ c, i, accent }: LayoutProps) {
  return (
    <div className="relative grid min-h-[100svh] grid-cols-12 content-center gap-x-8 gap-y-10 pt-40">
      <Caption c={c} i={i} accent={accent} />

      <div className="col-span-12 md:col-span-5">
        <h2
          data-layer="headline"
          data-skewable
          className="font-display font-black uppercase leading-[0.85] tracking-[-0.04em] text-newsprint will-change-transform"
          style={{ fontSize: "clamp(2.5rem, 7vw, 7rem)" }}
        >
          {c.shortName}
        </h2>
        <p data-layer="deck" className="mt-6 max-w-md font-serif italic text-newsprint/85" style={{ fontSize: "clamp(1.25rem, 2vw, 1.875rem)" }}>
          &ldquo;{c.tagline}&rdquo;
        </p>
        <div className="mt-12 space-y-6">
          <Stat label="Truth Score" value={`${c.truthScore}`} suffix="/100" accent={accent} block />
          <div className="grid grid-cols-2 gap-6">
            <Stat label="Reviews" value={`${c.reviewCount}`} block />
            <Stat label="Verified" value={`${c.verifiedCount}`} block />
          </div>
        </div>
      </div>

      <blockquote
        data-layer="quote"
        className="col-span-12 md:col-span-7 self-center font-display italic leading-[0.92] text-newsprint"
        style={{
          fontSize: "clamp(2rem, 6vw, 6rem)",
          borderLeft: `4px solid ${accent}`,
          paddingLeft: "1.5rem",
        }}
      >
        &ldquo;{c.longRead.pullQuote}&rdquo;
      </blockquote>

      <div className="col-span-12 mt-12">
        <ExitRow c={c} />
      </div>
    </div>
  );
}

/** 03 — STACK — intimate vertical with tagline larger than the headline. */
function StackLayout({ c, i, accent }: LayoutProps) {
  return (
    <div className="relative mx-auto grid min-h-[100svh] max-w-4xl grid-cols-1 content-center gap-y-10 pt-40 text-center">
      <Caption c={c} i={i} accent={accent} />

      <p data-layer="kicker" className="font-mono text-meta uppercase tracking-[0.4em] text-newsprint/60">
        ↓ A chapter set in {c.category.replace("-", " ")} ↓
      </p>

      <h2
        data-layer="headline"
        data-skewable
        className="font-display font-black uppercase leading-[0.85] tracking-[-0.04em] text-newsprint/75 will-change-transform"
        style={{ fontSize: "clamp(2rem, 5vw, 5rem)" }}
      >
        {c.shortName}
      </h2>

      <p
        data-layer="deck"
        className="font-serif italic leading-[1.05] text-newsprint"
        style={{ fontSize: "clamp(2rem, 7vw, 7rem)" }}
      >
        &ldquo;{c.tagline}&rdquo;
      </p>

      <blockquote
        data-layer="quote"
        className="mx-auto max-w-3xl border-t border-newsprint/20 pt-8 font-serif italic"
        style={{ fontSize: "clamp(1.25rem, 2.5vw, 2rem)", color: accent }}
      >
        &ldquo;{c.longRead.pullQuote}&rdquo;
      </blockquote>

      <div className="mx-auto flex items-center gap-6 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/70">
        <span data-layer="stat">{c.truthScore}<span style={{ color: accent }}>/100 truth</span></span>
        <span className="inline-block h-px w-6 bg-newsprint/30" />
        <span data-layer="stat">{c.reviewCount} reviews</span>
        <span className="inline-block h-px w-6 bg-newsprint/30" />
        <span data-layer="stat">{c.verifiedCount} verified</span>
      </div>

      <div className="mt-12">
        <ExitRow c={c} />
      </div>
    </div>
  );
}

/** 04 — FRAME — accusation. Massive data, headline as caption. */
function FrameLayout({ c, i, accent }: LayoutProps) {
  return (
    <div className="relative grid min-h-[100svh] grid-cols-12 content-center gap-x-6 gap-y-10 pt-40">
      <Caption c={c} i={i} accent={accent} />

      {/* Quote running as a banner across the top */}
      <blockquote
        data-layer="quote"
        className="col-span-12 border-y border-newsprint/15 py-8 font-display italic leading-[0.95] text-newsprint"
        style={{ fontSize: "clamp(1.5rem, 4vw, 4rem)", color: accent }}
      >
        &ldquo;{c.longRead.pullQuote}&rdquo;
      </blockquote>

      {/* Massive central truth-score */}
      <div data-layer="stat" className="col-span-12 grid grid-cols-12 items-end gap-6 md:col-span-7">
        <div className="col-span-12">
          <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">Community truth score</p>
          <p
            data-skewable
            className="font-display font-black leading-[0.78] tracking-[-0.05em] text-newsprint will-change-transform"
            style={{ fontSize: "clamp(8rem, 28vw, 24rem)" }}
          >
            {c.truthScore}<span style={{ color: accent }}>/100</span>
          </p>
        </div>
      </div>

      {/* Right column: headline reduced to a caption, supporting stats */}
      <div className="col-span-12 md:col-span-5">
        <h2
          data-layer="headline"
          className="font-display font-black uppercase leading-[0.9] tracking-[-0.04em] text-newsprint/80"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
        >
          {c.shortName}
        </h2>
        <p data-layer="deck" className="mt-3 font-serif italic text-newsprint/70" style={{ fontSize: "clamp(1.125rem, 1.5vw, 1.5rem)" }}>
          &ldquo;{c.tagline}&rdquo;
        </p>
        <div className="mt-10 grid grid-cols-2 gap-6">
          <Stat label="Reviews" value={`${c.reviewCount}`} block />
          <Stat label="Verified" value={`${c.verifiedCount}`} block />
          <Stat label="Claims redacted" value={`${c.brochureClaims.length}`} block accent={accent} accentValue />
          <Stat label="Tier" value={c.tier.replace("tier-", "T·")} block />
        </div>
      </div>

      <div className="col-span-12 mt-12">
        <ExitRow c={c} />
      </div>
    </div>
  );
}

/** 05 — MINIMAL — the underdog. Mostly empty space, one big number. */
function MinimalLayout({ c, i, accent }: LayoutProps) {
  return (
    <div className="relative mx-auto grid min-h-[100svh] max-w-5xl grid-cols-1 content-center gap-y-16 pt-40">
      <Caption c={c} i={i} accent={accent} />

      <h2
        data-layer="headline"
        className="font-mono text-meta uppercase tracking-[0.4em] text-newsprint/80"
      >
        {c.shortName}
      </h2>

      <p
        data-layer="deck"
        data-skewable
        className="font-display font-black uppercase leading-[0.82] tracking-[-0.04em] text-newsprint will-change-transform"
        style={{ fontSize: "clamp(3rem, 9vw, 10rem)" }}
      >
        {c.tagline}
      </p>

      <div className="flex items-baseline gap-8 border-t border-newsprint/20 pt-8">
        <div data-layer="stat">
          <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">Truth</p>
          <p
            className="font-display font-black leading-none tracking-[-0.03em] text-newsprint"
            style={{ fontSize: "clamp(4rem, 10vw, 9rem)" }}
          >
            {c.truthScore}<span style={{ color: accent }}>/100</span>
          </p>
        </div>
        <div className="flex-1">
          <blockquote
            data-layer="quote"
            className="font-serif italic text-newsprint/85"
            style={{ fontSize: "clamp(1.25rem, 2.5vw, 2rem)" }}
          >
            &ldquo;{c.longRead.pullQuote}&rdquo;
          </blockquote>
        </div>
      </div>

      <ExitRow c={c} />
    </div>
  );
}

/** Stat block, reusable across layouts. */
function Stat({
  label, value, suffix, cols, accent, accentValue, block,
}: {
  label: string; value: string; suffix?: string;
  cols?: number; accent?: string; accentValue?: boolean; block?: boolean;
}) {
  const colSpan = cols ? `col-span-6 md:col-span-${cols}` : "";
  return (
    <div data-layer="stat" className={block ? "" : colSpan}>
      <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">{label}</p>
      <p
        className="mt-1 font-display font-black leading-none tracking-[-0.03em] text-newsprint"
        style={{
          fontSize: "clamp(2.5rem, 6vw, 6rem)",
          color: accentValue ? accent : undefined,
        }}
      >
        {value}{suffix && <span style={{ color: accent }}>{suffix}</span>}
      </p>
    </div>
  );
}
