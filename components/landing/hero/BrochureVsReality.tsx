"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { BrochureVsRealityClaim } from "@/lib/mock-data/home-stats";

/**
 * The "BROCHURE VS REALITY" hero tile — dual horizontal bar chart that
 * cycles a single claim every 6s.
 *
 * Why one claim at a time, not all four stacked?
 *   - The story is "look at the gap" — a stacked chart blurs the impact.
 *   - Reveal pacing lets the viewer absorb each claim before the next.
 *
 * Animation choreography (per cycle):
 *   t=0.0s : new metric label fades in
 *   t=0.1s : claimed (red) bar grows out to its width
 *   t=0.5s : reality (green) bar grows — lags 0.4s for the "reveal" beat
 *   t=1.1s : dashed truth line drops in across the gap, Δ label fades up
 *   t=6.0s : cycle advances
 *
 * Inverse metrics (faculty ratio: lower = better) flip the role of the
 * "good" bar so the chart always reads "brochure-bar long = lie".
 */
export function BrochureVsReality({ claims }: { claims: BrochureVsRealityClaim[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // freeze on first claim for reduced-motion
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setIdx((i) => (i + 1) % claims.length);
      }
    }, 6000);
    return () => window.clearInterval(t);
  }, [claims.length]);

  const c = claims[idx];
  // For width normalisation: pick the larger of the two and treat it as 100%.
  // For inverse metrics (lower = better/claimed), the larger value is the
  // "reality" one, but the visual semantic stays the same: longer bar = the
  // metric being highlighted. The claimed bar still draws first in red.
  const max = Math.max(c.claimed, c.actual);
  const claimedPct = (c.claimed / max) * 100;
  const actualPct = (c.actual / max) * 100;
  // delta is shown as a percent difference in the natural direction of the
  // metric. For % metrics it's just claimed-actual; for ratios it's the
  // relative shortfall — we keep the headline number unitless ("Δ -48%").
  const deltaPct = c.inverse
    ? Math.round(((c.actual - c.claimed) / c.actual) * 100)
    : Math.round(((c.actual - c.claimed) / c.claimed) * 100);

  return (
    <div className="flex h-full flex-col gap-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={c.metric}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35 }}
          className="font-display text-xl font-medium leading-tight text-newsprint md:text-2xl"
        >
          {c.metric}
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col gap-2.5">
        {/* REALITY row */}
        <BarRow
          key={"r-" + idx}
          label="Reality"
          value={c.actual}
          unit={c.unit}
          widthPct={actualPct}
          color="bg-newsprint/85"
          delay={0.5}
        />
        {/* CLAIMED row */}
        <BarRow
          key={"c-" + idx}
          label="Brochure"
          value={c.claimed}
          unit={c.unit}
          widthPct={claimedPct}
          color="bg-truth"
          delay={0.1}
        />
      </div>

      {/* Δ caption — drops in after both bars have grown */}
      <AnimatePresence mode="wait">
        <motion.div
          key={"d-" + idx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 1.1, duration: 0.35 }}
          className="mt-1 flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.2em] text-newsprint/80"
        >
          <span className="inline-block h-px w-6 bg-truth" />
          <span>Δ {deltaPct > 0 ? "+" : ""}{deltaPct}%</span>
          <span className="text-newsprint/55">truth gap</span>
        </motion.div>
      </AnimatePresence>

      {/* cycle stepper — which claim of N, with the active segment filling
          over its 6s dwell so the tile reads as actively playing. */}
      <div className="mt-auto flex items-center gap-1.5 pt-1" aria-hidden>
        {claims.map((_, i) => (
          <span
            key={i}
            className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-newsprint/15"
          >
            {i < idx && <span className="absolute inset-0 bg-newsprint/45" />}
            {i === idx && (
              <span
                key={"fill-" + idx}
                className="absolute inset-y-0 left-0 w-full origin-left bg-truth"
                style={{ transform: "scaleX(0)", animation: "uf-bar-fill 6s linear forwards" }}
              />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function BarRow({
  label,
  value,
  unit,
  widthPct,
  color,
  delay,
}: {
  label: string;
  value: number;
  unit: string;
  widthPct: number;
  color: string;
  delay: number;
}) {
  return (
    <div className="grid grid-cols-[64px_1fr_56px] items-center gap-3">
      <span className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-newsprint/75">
        {label}
      </span>
      <div className="relative h-2 rounded-full bg-newsprint/8 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: widthPct + "%" }}
          transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={"h-full " + color}
        />
      </div>
      <span className="text-right font-mono text-xs text-newsprint [font-variant-numeric:tabular-nums]">
        {value}{unit}
      </span>
    </div>
  );
}
