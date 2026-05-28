"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MagneticButton } from "@/components/MagneticButton";
import { liveStats } from "@/lib/mock-data/home-stats";

/**
 * SECTION 6 — "JOIN" — final CTA.
 *
 * Single oversized counter: the total verified-review count, with the
 * LAST digit highlighted in Truth Red and pulsing. Below it: one
 * magnetic CTA.
 *
 * Math: counter seeds from `totalReviews` (real Payload count when the
 * home page passes one through, mock fallback otherwise) and ticks up by
 * exactly 1 every 14s. The pulsing red glyph on the last digit reinforces
 * "your submission is the next one".
 */
export function SubmitTeaser({ totalReviews }: { totalReviews?: number } = {}) {
  const seed = totalReviews ?? liveStats.totalReviews;
  const [value, setValue] = useState(seed);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") setValue((v) => v + 1);
    }, 14000);
    return () => window.clearInterval(t);
  }, []);

  // grouping by thousands manually so we can colour the last digit
  const digits = value.toString().split("");

  return (
    <section id="join" className="relative bg-ink px-5 py-32 md:px-10 md:py-40">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 grid grid-cols-12 items-end gap-6">
          <div className="col-span-12 md:col-span-9">
            <p className="mb-3 inline-flex items-center gap-3 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
              <span className="inline-block h-px w-8 bg-truth" />
              SECTION · 06 · JOIN
            </p>
            <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-newsprint md:text-6xl">
              Your truth is{" "}
              <em className="font-display italic text-truth">the next data point.</em>
            </h2>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center gap-12 text-center">
          <div className="font-display font-black leading-none text-newsprint [font-variant-numeric:tabular-nums]" style={{ fontSize: "clamp(5rem, 18vw, 14rem)" }}>
            {digits.map((d, i) => {
              const last = i === digits.length - 1;
              // commas every 3 digits from the right
              const fromRight = digits.length - i;
              const showComma = fromRight % 3 === 0 && i !== 0;
              return (
                <span key={i} className="inline-flex items-baseline">
                  {showComma && <span className="mx-[2px] text-newsprint/35">,</span>}
                  {last ? (
                    <span className="relative inline-block overflow-hidden">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={d + "-" + value}
                          initial={{ y: "100%", opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: "-100%", opacity: 0 }}
                          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                          className="inline-block text-truth"
                          style={{
                            textShadow: "0 0 32px rgba(255,67,50,0.35)",
                            animation: "join-pulse 1.6s ease-in-out infinite",
                          }}
                        >
                          {d}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  ) : (
                    <span>{d}</span>
                  )}
                </span>
              );
            })}
          </div>

          <MagneticButton as="a" href="/submit" variant="primary">
            Add Your Voice
            <span aria-hidden>→</span>
          </MagneticButton>
        </div>
      </div>

      <style>{`
        @keyframes join-pulse {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.65; }
        }
      `}</style>
    </section>
  );
}
