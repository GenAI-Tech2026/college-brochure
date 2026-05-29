"use client";
import { MagneticButton } from "@/components/MagneticButton";
import { liveStats } from "@/lib/mock-data/home-stats";
import { LedgerTile } from "./hero/LedgerTile";
import { LiesCounter } from "./hero/LiesCounter";
import { BrochureVsReality } from "./hero/BrochureVsReality";
import { QuoteTicker } from "./hero/QuoteTicker";
import { TruthGauge } from "./hero/TruthGauge";
import { AmbientParticles } from "./hero/AmbientParticles";

/**
 * THE LIVE LEDGER — new home hero.
 *
 * Layout: asymmetric 12-col editorial grid.
 *   cols 1-5   →  headline + tagline + CTAs
 *   cols 6-12  →  2x2 tile panel ("the evidence on a corkboard")
 *
 * Mobile (<768px): the grid collapses to a single column; the panel
 * tiles stack vertically. Each tile keeps all its animations — they
 * scale to fit the smaller width.
 *
 * Total visible body copy: 12 words ("We have the receipts. 247,891
 * of them." + the two button labels). Everything else the user sees
 * is data.
 *
 * The previous Pixi-based "tear-apart" hero has been retired. If you
 * need the old one back, it's preserved in git history at commit
 * 7eb40ee8.
 */
export function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-start overflow-hidden px-5 pt-28 pb-0 md:px-10 md:pt-32 md:pb-16 lg:justify-center">
      {/* Headline scrim — weights the left column over the page-level video so
          the bone headline stays legible. The footage itself is the fixed
          <ScrollVideoBackground /> mounted at the page root. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(105deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.60) 40%, rgba(10,10,10,0.22) 68%, rgba(10,10,10,0.50) 100%)",
        }}
      />
      <AmbientParticles />

      {/* corner metadata — preserved from previous hero */}
      <div className="pointer-events-none absolute left-5 top-24 z-10 flex items-center gap-3 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/65 md:left-10 md:top-28">
        <span className="relative inline-block h-1.5 w-1.5">
          <span className="absolute inset-0 rounded-full bg-truth" />
          <span className="absolute inset-0 animate-ping rounded-full bg-truth/80" />
        </span>
        <span>LIVE · COLLEGE BROCHURE · 2026</span>
      </div>
      <div className="pointer-events-none absolute right-5 top-24 z-10 hidden items-center gap-3 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/65 md:right-10 md:top-28 md:flex">
        <span>FILE · UF · VOL II</span>
        <span className="inline-block h-px w-10 bg-current" />
      </div>

      <div className="relative z-10 grid grid-cols-12 items-center gap-8 md:gap-10">
        {/* LEFT — headline column. The font-size clamp caps at the size that
            keeps "BROCHURES" inside the 5/12 column on lg+ — anything taller
            overflows into the right-side ledger panel.
            Mobile: this column fills the first viewport (centered) so the
            "COLLEGE BROCHURES LIE." statement lands alone, full-screen; the
            ledger tiles begin just below the fold. */}
        <div className="col-span-12 flex min-h-[calc(100svh-11rem)] flex-col justify-center lg:col-span-5 lg:block lg:min-h-0">
          <h1 className="font-display font-black leading-[0.85] tracking-[-0.04em] text-newsprint">
            <span className="block text-truth text-[clamp(2.5rem,14vw,4.25rem)] lg:text-[clamp(3rem,7vw,5.5rem)]">
              YOUR COLLEGE
            </span>
            <span className="block text-[clamp(2.5rem,14vw,4.25rem)] lg:text-[clamp(3rem,7vw,5.5rem)]">
              BROCHURES
            </span>
            <span className="relative block text-[clamp(2.5rem,14vw,4.25rem)] lg:text-[clamp(3rem,7vw,5.5rem)] italic font-display">
              <span className="relative z-10">LIE.</span>
              {/* redaction sweep underline — uses existing keyframe */}
              <span
                aria-hidden
                className="absolute left-0 top-1/2 z-0 inline-block h-[0.32em] w-[2em] -translate-y-1/2 origin-left bg-truth"
                style={{ animation: "redaction-assemble 1.4s 0.6s var(--ease-paper) forwards" }}
              />
            </span>
          </h1>

          <p className="mt-6 max-w-md font-mono text-[0.95rem] leading-relaxed text-newsprint/75">
            We have the receipts.{" "}
            <span className="text-newsprint [font-variant-numeric:tabular-nums]">
              {liveStats.totalReviews.toLocaleString()}
            </span>{" "}
            of them.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <MagneticButton as="a" href="#evidence" variant="primary">
              See the evidence
              <span aria-hidden>→</span>
            </MagneticButton>
            <MagneticButton as="a" href="#method" variant="ghost">
              How it works
            </MagneticButton>
          </div>
        </div>

        {/* RIGHT — Live Ledger 2x2 panel.
            Mobile: sits on a solid black, full-bleed panel so the fixed footage
            shows only behind the headline above, not behind the cards. */}
        <div className="col-span-12 -mx-5 bg-ink px-5 py-10 lg:col-span-7 lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0">
          <div
            className="relative"
          >
            {/* corkboard frame — the rotation gives the whole panel an
                "evidence pinned crooked" feel.
                Mobile (<sm): one tile per row, stacked in a single line — each
                chart gets full width and is read one at a time. The crooked
                rotation only kicks in from sm+ (it would cause horizontal
                overflow on a full-width single column). */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 sm:[transform:rotate(-0.6deg)]">
              <LedgerTile label="LIES UNCOVERED TODAY" rotation={-0.8} index={0} href="#evidence">
                <LiesCounter seed={liveStats.liesUncoveredToday} />
              </LedgerTile>

              <LedgerTile label="BROCHURE VS REALITY" rotation={0.6} index={1} href="#gap">
                <BrochureVsReality claims={liveStats.brochureVsReality} />
              </LedgerTile>

              <LedgerTile label="VERIFIED STUDENTS SPEAKING" rotation={0.4} index={2} href="#receipts">
                <div className="h-44 md:h-48">
                  <QuoteTicker quotes={liveStats.studentQuotes} />
                </div>
              </LedgerTile>

              <LedgerTile label="INSTITUTIONAL TRUTH SCORE" rotation={-0.4} index={3} href="#numbers">
                <div className="h-44 md:h-48">
                  <TruthGauge score={liveStats.truthScore} />
                </div>
              </LedgerTile>
            </div>
          </div>
        </div>
      </div>

      {/* scroll affordance */}
      <div className="absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-meta uppercase tracking-[0.4em] text-newsprint/55 md:flex">
        <span>Scroll · the audit continues</span>
        <span
          aria-hidden
          className="inline-block h-8 w-px bg-current"
          style={{ animation: "redaction-assemble 1.6s ease-in-out infinite" }}
        />
      </div>
    </section>
  );
}
