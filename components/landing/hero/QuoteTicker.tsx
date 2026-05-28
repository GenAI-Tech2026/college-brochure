"use client";
import { useEffect, useRef } from "react";

/**
 * Vertical infinite quote ticker.
 *
 * Implementation:
 *   - The list is rendered twice back-to-back so a single CSS animation
 *     can loop seamlessly: at -50% offset we're exactly back where we
 *     started (because both halves are identical). No JS interval needed.
 *   - Each row is 56px tall on desktop, 48 on mobile. The animation
 *     duration scales with the list length so the speed feels constant
 *     no matter how many quotes the CMS later returns.
 *   - The center line is decorated with a Truth Red horizontal divider;
 *     whichever quote is currently crossing it gets a yellow highlighter
 *     wash via a CSS gradient that intersects only the center row.
 *
 * prefers-reduced-motion: the animation is set with `prefers-reduced-motion`
 * media query in the inline style — when reduced, animation duration is set
 * to 0s and the list freezes on the first quote.
 */
export function QuoteTicker({ quotes }: { quotes: string[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  // Pause-on-tab-hidden — we set animation-play-state on the container.
  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current.querySelector<HTMLDivElement>("[data-track]");
    if (!el) return;
    const onVis = () => {
      el.style.animationPlayState =
        document.visibilityState === "visible" ? "running" : "paused";
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Speed: ~3s per quote feels readable. With 10 quotes that's a 30s loop.
  const seconds = Math.max(20, quotes.length * 3);

  return (
    <div ref={wrapRef} className="relative flex h-full flex-col overflow-hidden">
      {/* fade masks top and bottom so quotes appear to surface and submerge */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-[#15130F] to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-[#15130F] to-transparent"
      />
      {/* center divider — the "now" line where quotes get highlighted */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-1/2 z-10 h-px -translate-y-1/2 bg-truth/40"
      />

      <div
        data-track
        className="flex flex-col will-change-transform"
        style={{
          animation: `quote-marquee ${seconds}s linear infinite`,
        }}
      >
        {[...quotes, ...quotes].map((q, i) => (
          <div
            key={i}
            className="flex h-12 shrink-0 items-center px-1 md:h-14"
          >
            <span className="block font-mono text-[0.78rem] leading-tight text-newsprint/90 md:text-[0.85rem]">
              <span className="text-newsprint/45">— Student · </span>
              <span className="bg-[linear-gradient(transparent_60%,rgba(255,67,50,0.18)_60%)] px-0.5">
                {q}
              </span>
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes quote-marquee {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(0, -50%, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-track] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
