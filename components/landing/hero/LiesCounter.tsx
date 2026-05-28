"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useLiveTicker } from "@/lib/hooks/useLiveTicker";

/**
 * Odometer-style counter that physically rolls digits when they change.
 *
 * Math / timing:
 *   - Seed: 12,847 (mock — from liveStats.liesUncoveredToday)
 *   - Increment: random 1–3 every 3–7s (the useLiveTicker hook handles
 *     visibility-pause and reduced-motion)
 *   - Why 1–3, not 1–10? Big jumps look fake. Small jumps reinforce
 *     "real audit happening right now".
 *
 * Per-digit rolling: each digit is its own AnimatePresence — when the
 * character changes, the old one swipes up and out, the new one swipes
 * in from below. Numbers that didn't change don't re-render thanks to
 * the per-digit `key`.
 *
 * tabular-nums prevents font-metrics jitter when a 9→0 carry changes
 * the digit's typographic width.
 */
export function LiesCounter({ seed }: { seed: number }) {
  const value = useLiveTicker<number>(
    seed,
    (prev) => prev + 1 + Math.floor(Math.random() * 3), // +1..+3
    { min: 3000, max: 7000 },
  );

  // Pad to the seed's width so we don't reflow when the count grows by an order
  // of magnitude — over a long session the seed at 12k will probably stay 5
  // digits, but we still pad defensively to 6 to be safe.
  const padded = value.toString().padStart(6, "0");
  const digits = padded.split("");

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-baseline gap-[2px] font-display font-black text-newsprint [font-variant-numeric:tabular-nums]">
        {digits.map((d, i) => {
          // commas every 3 digits from the right
          const fromRight = digits.length - i;
          const wantsComma = fromRight % 3 === 0 && i !== 0;
          return (
            <span key={i} className="inline-flex items-baseline">
              {wantsComma && (
                <span className="mx-[1px] inline-block translate-y-[-0.1em] text-newsprint/40">
                  ,
                </span>
              )}
              <span className="relative inline-block overflow-hidden text-[clamp(2.4rem,5.5vw,4.4rem)] leading-[0.95]">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={d + "-" + i + "-" + value}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "-100%", opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-block"
                  >
                    {d}
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-newsprint/55">
        <span className="relative inline-block h-1.5 w-1.5">
          <span className="absolute inset-0 rounded-full bg-truth" />
          <span className="absolute inset-0 animate-ping rounded-full bg-truth/80" />
        </span>
        <span>updated 0.3s ago</span>
      </div>
    </div>
  );
}
