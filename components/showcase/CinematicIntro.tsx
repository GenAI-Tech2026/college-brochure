"use client";
import { useEffect, useState } from "react";

/**
 * Cinematic curtain-raise played once on /showcase mount.
 * Common Awwwards SOTY pattern (Active Theory, Lusion, Maker Lab): the
 * site authors a *moment of arrival* before content. Three beats:
 *
 *   0–800ms   : redaction-bar blocks march across viewport
 *   800–1800ms: blocks invert, revealing "FILE · 26 · OPENING"
 *   1800–2600ms: clip-path wipes the curtain off, content underneath
 *                (already in place) becomes visible
 *
 * Auto-unmounts after the wipe. Skip-to-content link is honoured if
 * the user tabs during the intro.
 *
 * Perf: pure CSS keyframes + clip-path. No JS in the loop. Total cost:
 * ~0 KB beyond this component.
 */
export function CinematicIntro() {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDone(true);
      return;
    }
    const t1 = setTimeout(() => setPhase(1), 50);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1900);
    const t4 = setTimeout(() => setDone(true), 2800);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  if (done) return null;

  return (
    <div
      aria-hidden
      className="no-print pointer-events-none fixed inset-0 z-[9000]"
      style={{
        clipPath:
          phase === 3
            ? "polygon(0 0, 100% 0, 100% 0, 0 0)"
            : "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
        transition: "clip-path 0.9s cubic-bezier(0.86, 0, 0.07, 1)",
      }}
    >
      {/* Layer 1: ink-black curtain */}
      <div className="absolute inset-0 bg-ink" />

      {/* Layer 2: three redaction bars marching */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-8 origin-left bg-truth md:h-12"
              style={{
                width: phase >= 1 ? "50vw" : "0vw",
                transition: `width 0.7s cubic-bezier(0.86, 0, 0.07, 1) ${i * 0.12}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Layer 3: revealed title at phase 2 */}
      <div
        className="absolute inset-0 grid place-items-center"
        style={{
          opacity: phase >= 2 ? 1 : 0,
          transition: "opacity 0.5s ease-out",
        }}
      >
        <div className="text-center">
          <p className="font-mono text-meta uppercase tracking-[0.5em] text-truth">
            Now Showing
          </p>
          <p className="mt-4 font-display text-6xl font-black uppercase leading-none tracking-[-0.04em] text-newsprint md:text-9xl">
            UNFILTERED
          </p>
          <p className="mt-4 font-mono text-meta uppercase tracking-[0.5em] text-newsprint/70">
            File · 26 · Opening
          </p>
        </div>
      </div>
    </div>
  );
}
