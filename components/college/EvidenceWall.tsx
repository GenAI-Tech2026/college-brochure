"use client";
import { useState } from "react";
import Masonry from "react-masonry-css";
import { motion, AnimatePresence } from "framer-motion";
import type { Review } from "@/lib/mock-data/types";
import { cn } from "@/lib/utils/cn";

const vibes = ["all", "rage", "warm", "deadpan", "warning", "redeemed"] as const;
type VibeFilter = (typeof vibes)[number];

/**
 * Module D — EVIDENCE WALL
 *
 * Masonry of student reviews. Each card splits in half on hover:
 * - Top reveals the brochure-claim category the review challenges
 * - Bottom reveals a soundbite excerpt of the student verdict
 * The FLIP re-order on filter change is automatic via Framer Motion `layout`.
 */
export function EvidenceWall({ reviews }: { reviews: Review[] }) {
  const [vibe, setVibe] = useState<VibeFilter>("all");
  const filtered = vibe === "all" ? reviews : reviews.filter((r) => r.vibe === vibe);

  return (
    <section
      id="evidence"
      className="paper px-6 py-32 md:px-10 md:py-48"
      aria-labelledby="evidence-heading"
    >
      <div className="mb-12 grid grid-cols-12 items-end gap-6">
        <div className="col-span-12 md:col-span-7">
          <p className="font-mono text-meta uppercase tracking-[0.3em] text-ink/60">
            Section D · Evidence Wall · Verified
          </p>
          <h2 id="evidence-heading" className="mt-4 font-display text-[clamp(2.5rem,7vw,7rem)] font-black uppercase leading-[0.88] tracking-[-0.03em] text-ink">
            Filed by <span className="italic text-truth">the students who lived it.</span>
          </h2>
        </div>
        <div className="col-span-12 flex flex-wrap gap-2 md:col-span-5 md:justify-end">
          {vibes.map((v) => (
            <button
              key={v}
              onClick={() => setVibe(v)}
              data-cursor="link"
              className={cn(
                "border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition",
                vibe === v
                  ? "border-truth bg-truth text-newsprint"
                  : "border-ink/30 text-ink hover:border-ink"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* 2 columns by default so each comment card reads wide and uses
          the available width instead of leaving empty space beside it.
          3-column was tested but cards came out narrow and the page felt
          unbalanced against the rest of the editorial layout. */}
      <Masonry
        breakpointCols={{ default: 2, 1024: 2, 640: 1 }}
        className="-ml-8 flex w-auto"
        columnClassName="pl-8"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((r) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 30, rotate: -1.5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              className="mb-6"
            >
              <ReviewCard review={r} />
            </motion.div>
          ))}
        </AnimatePresence>
      </Masonry>
    </section>
  );
}

/* Vibe is communicated by stroke weight and contrast, not by competing
   hues. The accent (truth red) is reserved for "rage" — the strongest
   editorial signal — and "warning" gets a dashed border for visual
   differentiation without introducing yellow. */
const vibeAccent: Record<Review["vibe"], string> = {
  rage: "border-truth",
  warm: "border-ink",
  deadpan: "border-ink/70",
  warning: "border-ink border-dashed",
  redeemed: "border-ink/40",
};

function ReviewCard({ review: r }: { review: Review }) {
  return (
    <article
      data-cursor={r.hasVideo ? "video" : "review"}
      data-cursor-label={r.hasVideo ? "PLAY" : "READ"}
      className={cn(
        "group relative border-2 bg-newsprint p-6 text-ink transition-transform duration-500 hover:-translate-y-1",
        vibeAccent[r.vibe]
      )}
      style={{ boxShadow: "0 24px 60px -30px rgba(0,0,0,0.5)" }}
    >
      {/* Stamp ribbon */}
      <div className="flex items-center justify-between font-mono text-meta uppercase tracking-[0.2em] text-ink/60">
        <span>Verified · {r.verification.method.replace("-", " ")}</span>
        <span>★ {r.rating}</span>
      </div>

      <h3 className="mt-4 font-display text-2xl font-black leading-tight tracking-[-0.02em]">
        {r.title}
      </h3>

      {/* Split-on-hover: top brochure category, bottom verdict snippet */}
      <div className="relative mt-4 h-0 overflow-hidden transition-[height] duration-500 group-hover:h-16">
        <p className="font-mono text-meta uppercase tracking-[0.2em] text-truth">
          Vibe · {r.vibe}
        </p>
        <p className="mt-1 font-serif italic text-ink/80">
          “{r.body.slice(0, 90)}{r.body.length > 90 ? "…" : ""}”
        </p>
      </div>

      <p className="mt-4 font-serif text-ink/80">{r.body}</p>

      {r.hasVideo && (
        <div className="mt-4 inline-flex items-center gap-2 border border-truth bg-truth/10 px-2 py-1 font-mono text-meta uppercase tracking-[0.2em] text-truth">
          <span aria-hidden>▶</span>
          Video evidence attached
        </div>
      )}

      <footer className="mt-6 flex items-center justify-between border-t border-ink/15 pt-4 font-mono text-meta uppercase tracking-[0.2em] text-ink/60">
        <span>
          {r.authorPseudonym} · Y{r.authorYear} · {r.authorBranch}
        </span>
        <span className="flex items-center gap-3">
          <span>▲ {r.upvotes.toLocaleString()}</span>
          {r.receipts > 0 && <span className="text-truth">📎 {r.receipts}</span>}
        </span>
      </footer>
    </article>
  );
}
