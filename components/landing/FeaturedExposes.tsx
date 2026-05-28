"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import * as d3 from "d3";
import { liveStats } from "@/lib/mock-data/home-stats";
import type { FeaturedCase } from "@/lib/mock-data/home-stats";

/**
 * SECTION 2 — "RECEIPTS, NOT WORDS"
 *
 * Asymmetric grid of 6 college "case file" cards. Each card shows:
 *   - College name (small top-left)
 *   - HUGE truth-gap percentage in the center
 *   - Inline sparkline of the gap trend (last 7 audits)
 *   - "Read the case file →" mono link at the bottom
 *
 * On hover, the card flips horizontally (CSS 3D rotateY) to reveal a
 * single damning verified quote in italic. Implementation uses framer-
 * motion `animate` on a `rotateY` value — keeps everything declarative
 * and ties cleanly to the press-down on tap (mobile).
 *
 * Why these stats?
 *   - The truth-gap (0-100%) is the *single* number that summarises an
 *     audit. It's the only number a hurried visitor needs to see.
 *   - The 7-point sparkline turns one number into a trend: is it getting
 *     worse or better? Editorial honesty — sometimes the gap shrinks.
 *
 * The previous interface (`{ college, claim }`) shape was tied to CMS
 * Brochure-Claim rows. This section now ignores props entirely (always
 * renders the canonical featured cases from `liveStats`). When CMS data
 * is ready, replace the `cases` variable with a server prop on the home
 * page.
 */
export function FeaturedExposes({
  cases = liveStats.featuredCases,
}: { cases?: FeaturedCase[] } = {}) {
  // Asymmetric masonry — col-spans cycle 4,4,4,5,3,4 across 12 cols.
  // This produces visual rhythm without random sizing.
  const layout = [
    "col-span-12 md:col-span-4",
    "col-span-12 md:col-span-4",
    "col-span-12 md:col-span-4",
    "col-span-12 md:col-span-5",
    "col-span-12 md:col-span-3",
    "col-span-12 md:col-span-4",
  ];

  return (
    <section id="receipts" className="relative bg-ink px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 grid grid-cols-12 items-end gap-6">
          <div className="col-span-12 md:col-span-8">
            <p className="mb-3 inline-flex items-center gap-3 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
              <span className="inline-block h-px w-8 bg-truth" />
              SECTION · 01 · THE EVIDENCE
            </p>
            <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-newsprint md:text-6xl">
              Receipts, <em className="font-display italic text-truth">not words.</em>
            </h2>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-3 md:gap-4">
          {cases.map((c, i) => (
            <div key={c.college} className={layout[i] ?? "col-span-12 md:col-span-4"}>
              <ReceiptCard data={c} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReceiptCard({ data, index }: { data: FeaturedCase; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const severe = data.truthGap >= 40;

  return (
    <div
      className="group relative h-72 cursor-pointer [perspective:1400px]"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped((v) => !v)}
      data-cursor="link"
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative h-full w-full [transform-style:preserve-3d]"
      >
        {/* FRONT */}
        <div
          className="absolute inset-0 flex flex-col justify-between border border-newsprint/15 bg-[#141210] p-5 [backface-visibility:hidden]"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-newsprint/55">
              CASE #{String(index + 1).padStart(3, "0")}
            </span>
            <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-newsprint/40">
              {data.college.split(",")[0]}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div
              className={
                "font-display font-black leading-none [font-variant-numeric:tabular-nums] " +
                (severe ? "text-truth" : "text-newsprint")
              }
              style={{ fontSize: "clamp(4rem, 7vw, 6rem)" }}
            >
              {data.truthGap}
              <span className="text-newsprint/35">%</span>
            </div>
            <div className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.25em] text-newsprint/55">
              truth gap
            </div>
          </div>

          <Sparkline values={data.trend} severe={severe} />

          <div className="flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-[0.2em] text-newsprint/65">
            <span>Read the case file</span>
            <span aria-hidden>→</span>
          </div>
        </div>

        {/* BACK — the quote */}
        <div
          className="absolute inset-0 flex flex-col justify-between border border-truth/40 bg-[#1a1311] p-6 [transform:rotateY(180deg)] [backface-visibility:hidden]"
        >
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-truth/85">
            VERIFIED QUOTE
          </span>
          <blockquote className="font-quote text-2xl italic leading-tight text-newsprint md:text-3xl">
            “{data.quote}”
          </blockquote>
          <div className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-newsprint/55">
            — Student · {data.college}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/** Inline 7-point sparkline. d3-shape's line generator on a tiny SVG. */
function Sparkline({ values, severe }: { values: number[]; severe: boolean }) {
  const W = 220;
  const H = 36;
  const x = d3.scaleLinear().domain([0, values.length - 1]).range([0, W]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const y = d3.scaleLinear().domain([min - 2, max + 2]).range([H - 4, 4]);
  const line = d3
    .line<number>()
    .x((_, i) => x(i))
    .y((v) => y(v))
    .curve(d3.curveMonotoneX);
  const d = line(values) ?? "";
  const color = severe ? "rgb(255 67 50)" : "rgb(232 225 208 / 0.7)";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="my-2 h-9 w-full">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="2.5" fill={color} />
    </svg>
  );
}
