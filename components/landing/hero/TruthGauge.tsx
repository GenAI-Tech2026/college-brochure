"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Institutional truth score — clean stat readout.
 *
 * The 0–100 score reads as a large number plus a single labelled meter bar
 * (consistent with the Brochure-vs-Reality bars elsewhere in the panel).
 * Low score = mostly-empty red bar = "marketing fiction".
 *
 * On first view the number counts up from 0 and the bar fills to the score,
 * so the tile feels like a live gauge settling rather than a static figure.
 * Both are skipped under prefers-reduced-motion (final value shown at once).
 */
export function TruthGauge({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const [shown, setShown] = useState(0); // animated count-up value
  const [fill, setFill] = useState(0); // animated bar width %
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(score);
      setFill(pct);
      return;
    }

    let raf = 0;
    let start = 0;
    const DUR = 1100;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // cubic-out

    const run = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / DUR);
      const e = ease(t);
      setShown(Math.round(score * e));
      setFill(pct * e);
      if (t < 1) raf = requestAnimationFrame(run);
    };

    // Trigger when the tile scrolls into view (it's above the fold, so this
    // generally fires immediately — but it keeps fps clean if it isn't).
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          raf = requestAnimationFrame(run);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    if (rootRef.current) io.observe(rootRef.current);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [score, pct]);

  return (
    <div ref={rootRef} className="flex h-full flex-col justify-between">
      {/* big score */}
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[clamp(3rem,7vw,4.2rem)] font-black leading-[0.9] text-newsprint [font-variant-numeric:tabular-nums]">
          {shown}
        </span>
        <span className="font-display text-2xl font-black text-newsprint/60">/100</span>
      </div>

      {/* truth meter bar — off-hue gradient fill reads richer than flat red */}
      <div className="mt-4">
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-newsprint/12">
          {/* faint tick scale on the track for measure */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent 0 calc(25% - 1px), rgba(232,225,208,0.18) calc(25% - 1px) 25%)",
            }}
          />
          {/* scaleX (GPU compositor) rather than width (layout) — rAF drives
              the value each frame, so no CSS transition is needed. */}
          <div
            className="h-full w-full origin-left rounded-full"
            style={{
              transform: `scaleX(${fill / 100})`,
              backgroundImage: "linear-gradient(90deg, #C8341F 0%, #FF4332 100%)",
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-[0.18em] text-newsprint/75">
          <span>Marketing fiction</span>
          <span>Truth</span>
        </div>
      </div>

      {/* context line */}
      <div className="mt-3 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-newsprint/70">
        Industry avg · 1,847 colleges audited
      </div>
    </div>
  );
}
