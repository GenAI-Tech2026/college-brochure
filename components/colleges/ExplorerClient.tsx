"use client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFilterStore } from "@/lib/store/filterStore";
import type { College } from "@/lib/mock-data/types";
import { fingerprintPaths } from "@/lib/utils/fingerprint";
import { safeAccentOnDark } from "@/lib/utils/accent";
import { cn } from "@/lib/utils/cn";

const tiers = ["all", "tier-1", "tier-2", "tier-3"] as const;
const categories = ["all", "engineering", "private-deemed", "arts", "business", "regional"] as const;
const sorts = [
  { v: "truth-desc", l: "Most honest first" },
  { v: "truth-asc", l: "Most deceptive first" },
  { v: "reviews-desc", l: "Most reviewed" },
  { v: "newest", l: "Recently filed" },
] as const;

/**
 * Filterable college explorer.
 * - Filters live in Zustand → no prop drilling.
 * - Layout transitions via Framer Motion's `layout` prop = FLIP under the hood.
 * - Each card carries the college's SVG fingerprint, so identity is visible
 *   in the grid view, not just on the detail page.
 */
export function ExplorerClient({ colleges }: { colleges: College[] }) {
  const { query, tier, category, minTruthScore, sortBy, set, reset } = useFilterStore();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeCount =
    (tier !== "all" ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (minTruthScore > 0 ? 1 : 0) +
    (sortBy !== "truth-desc" ? 1 : 0);

  const filtered = useMemo(() => {
    let arr = colleges.slice();
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.shortName.toLowerCase().includes(q)
      );
    }
    if (tier !== "all") arr = arr.filter((c) => c.tier === tier);
    if (category !== "all") arr = arr.filter((c) => c.category === category);
    arr = arr.filter((c) => c.truthScore >= minTruthScore);
    arr.sort((a, b) => {
      switch (sortBy) {
        case "truth-desc": return b.truthScore - a.truthScore;
        case "truth-asc": return a.truthScore - b.truthScore;
        case "reviews-desc": return b.reviewCount - a.reviewCount;
        case "newest": return parseInt(b.caseFileNumber.slice(3)) - parseInt(a.caseFileNumber.slice(3));
      }
    });
    return arr;
  }, [colleges, query, tier, category, minTruthScore, sortBy]);

  return (
    <div className="min-h-screen bg-ink px-6 pb-32 pt-32 md:px-10">
      <header className="mb-16 grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-7">
          <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
            Section · The File · Index
          </p>
          <h1 className="mt-3 font-display text-[clamp(3rem,10vw,10rem)] font-black uppercase leading-[0.85] tracking-[-0.04em] text-newsprint">
            The <span className="italic text-truth">file</span>
          </h1>
          <p className="mt-6 max-w-xl font-serif text-xl text-newsprint/80">
            Every case file is a verified counter-reading of an institution&apos;s marketing copy. Filter, search, compare. Every score is a community average — never a brochure&apos;s.
          </p>
        </div>

        <aside className="col-span-12 grid grid-cols-2 gap-3 self-end md:col-span-5 md:grid-cols-4">
          {[
            { label: "Files", value: filtered.length, of: colleges.length },
            {
              label: "Avg Score",
              value: filtered.length
                ? Math.round(filtered.reduce((s, c) => s + c.truthScore, 0) / filtered.length)
                : 0,
              of: 100,
            },
            { label: "Reviews", value: filtered.reduce((s, c) => s + c.reviewCount, 0), of: 0 },
            { label: "Verified", value: filtered.reduce((s, c) => s + c.verifiedCount, 0), of: 0 },
          ].map((s) => (
            <div key={s.label} className="border border-newsprint/15 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-newsprint/50">{s.label}</p>
              <p className="mt-2 font-display text-3xl font-black tracking-tight text-newsprint">
                {s.value}
                {s.of && s.label === "Avg Score" ? <span className="text-truth">/{s.of}</span> : null}
              </p>
            </div>
          ))}
        </aside>
      </header>

      {/* Filter bar — slim: search + a Filters button that reveals the rest. */}
      <div className="mb-12 border-y border-newsprint/10 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[200px] flex-1">
            <span className="sr-only">Search by name or city</span>
            <input
              value={query}
              onChange={(e) => set({ query: e.target.value })}
              placeholder="Search by name or city…"
              className="w-full border-b border-newsprint/30 bg-transparent pb-1 font-display text-xl text-newsprint placeholder:text-newsprint/30 focus:border-truth focus:outline-none"
            />
          </label>

          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            data-cursor="link"
            className={cn(
              "inline-flex items-center gap-2 border px-4 py-2 font-mono text-meta uppercase tracking-[0.2em] transition-colors",
              filtersOpen || activeCount > 0
                ? "border-truth text-newsprint"
                : "border-newsprint/25 text-newsprint/75 hover:border-newsprint/60",
            )}
          >
            Filters
            {activeCount > 0 && (
              <span className="grid h-4 min-w-4 place-items-center rounded-full bg-truth px-1 text-[10px] leading-none text-newsprint">
                {activeCount}
              </span>
            )}
            <span aria-hidden className={cn("transition-transform duration-300", filtersOpen && "rotate-180")}>
              ▾
            </span>
          </button>

          {(activeCount > 0 || query) && (
            <button
              type="button"
              onClick={reset}
              className="font-mono text-meta uppercase tracking-[0.2em] text-truth hover:underline"
            >
              Reset
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2 md:grid-cols-4">
                <FilterGroup label="Tier" options={tiers as unknown as string[]} value={tier} onChange={(v) => set({ tier: v as typeof tier })} />
                <FilterGroup label="Category" options={categories as unknown as string[]} value={category} onChange={(v) => set({ category: v as typeof category })} />

                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-newsprint/50">Sort</p>
                  <select
                    value={sortBy}
                    aria-label="Sort colleges"
                    onChange={(e) => set({ sortBy: e.target.value as typeof sortBy })}
                    className="mt-2 w-full border-b border-newsprint/30 bg-transparent pb-1 font-mono text-meta uppercase tracking-[0.2em] text-newsprint focus:border-truth focus:outline-none"
                  >
                    {sorts.map((s) => (
                      <option key={s.v} value={s.v} className="bg-ink">
                        {s.l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-newsprint/50">
                    Min. truth score · {minTruthScore}
                  </p>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={minTruthScore}
                    onChange={(e) => set({ minTruthScore: parseInt(e.target.value) })}
                    className="mt-3 w-full accent-truth"
                    aria-label="Minimum truth score"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FLIP grid */}
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((c, i) => (
            <motion.li
              key={c.slug}
              layout
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
              transition={{ type: "spring", stiffness: 200, damping: 28, delay: i * 0.03 }}
            >
              <CollegeCard college={c} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {filtered.length === 0 && (
        <div className="border border-newsprint/15 py-24 text-center">
          <p className="font-display text-4xl text-newsprint">No files match.</p>
          <p className="mt-3 font-serif italic text-newsprint/60">Try fewer filters, or submit the missing one.</p>
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-newsprint/50">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            data-cursor="link"
            className={cn(
              "border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] transition",
              value === o
                ? "border-truth bg-truth text-newsprint"
                : "border-newsprint/20 text-newsprint/70 hover:border-newsprint/60"
            )}
          >
            {o.replace("-", " ")}
          </button>
        ))}
      </div>
    </div>
  );
}

function CollegeCard({ college: c }: { college: College }) {
  const prints = fingerprintPaths(c.fingerprintSeed, 14);
  const accent = safeAccentOnDark(c.primaryAccent);
  return (
    <Link
      href={`/college/${c.slug}`}
      data-cursor="review"
      data-cursor-label="OPEN"
      className="group relative block h-full overflow-hidden border border-newsprint/15 bg-ink p-8 transition-colors hover:bg-newsprint/[0.02]"
    >
      <div className="flex items-start justify-between font-mono text-meta uppercase tracking-[0.2em] text-newsprint/60">
        <span>{c.caseFileNumber}</span>
        <span className="text-truth">{c.tier.toUpperCase()}</span>
      </div>

      <h3 className="mt-6 font-display text-3xl font-black uppercase leading-[0.95] tracking-[-0.02em] text-newsprint md:text-4xl">
        {c.name}
      </h3>
      <p className="mt-2 font-serif italic text-newsprint/60">
        {c.city}, {c.state} · est. {c.founded}
      </p>

      {/* Fingerprint */}
      <svg viewBox="0 0 100 100" className="my-8 h-32 w-32 opacity-80" aria-hidden>
        {prints.map((p, i) => (
          <path
            key={i}
            d={p.d}
            stroke={accent}
            strokeWidth={p.strokeWidth}
            opacity={p.opacity}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </svg>

      <p className="font-serif italic text-newsprint/80">{c.tagline}</p>

      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-newsprint/10 pt-6">
        <Stat label="Truth" value={`${c.truthScore}/100`} />
        <Stat label="Reviews" value={`${c.reviewCount}`} />
        <Stat label="Verified" value={`${c.verifiedCount}`} />
      </div>

      <span className="mt-6 inline-flex items-center gap-2 font-mono text-meta uppercase tracking-[0.2em] text-truth">
        Open file
        <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
      </span>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-newsprint/50">{label}</p>
      <p className="mt-1 font-display text-xl font-black text-newsprint">{value}</p>
    </div>
  );
}
