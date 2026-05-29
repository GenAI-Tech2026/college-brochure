import type { College } from "@/lib/mock-data/types";
import { computeRealityGap, formatINR } from "@/lib/utils/reality";

/**
 * Module A·II — REALITY, AT A GLANCE.
 *
 * The reveals elsewhere on the page (RedactionSection's click-to-expose,
 * DataAutopsy's scroll-flip) are dramatic — but a visitor who doesn't
 * interact leaves having seen only the *brochure's* version. This block
 * fixes that: every claim → reality pair is visible by default, no click,
 * no scroll-trigger. It's the plain summary the rest of the page then
 * dramatises.
 *
 * Static server component — no motion, no client JS. Zero CLS.
 */
export function RealitySnapshot({ college }: { college: College }) {
  const gap = computeRealityGap(college);
  const claims = college.brochureClaims ?? [];

  return (
    <section
      id="reality"
      className="paper px-6 py-24 md:px-10 md:py-32"
      aria-labelledby="reality-heading"
    >
      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <p className="font-mono text-meta uppercase tracking-[0.3em] text-ink/60">
            Section A·II · Reality, at a glance
          </p>
          <p className="mt-4 max-w-xs font-serif italic text-ink/70">
            No clicks, no scrolling. Everything the brochure claims, set
            against what {college.verifiedCount.toLocaleString()} verified
            students actually found. The theatre comes later.
          </p>
        </aside>

        <div className="col-span-12 md:col-span-9">
          <h2
            id="reality-heading"
            className="font-display text-[clamp(2rem,5.5vw,4.5rem)] font-black uppercase leading-[0.9] tracking-[-0.03em] text-ink"
          >
            They said. <span className="italic text-truth">You verified.</span>
          </h2>

          {/* Placement headline — the number students care about most */}
          {gap.placement && (
            <div className="mt-12 border-t-2 border-ink pt-6">
              <p className="font-mono text-meta uppercase tracking-[0.25em] text-ink/60">
                Placements · {gap.placement.year}
              </p>
              <p className="mt-3 font-display text-2xl font-black leading-tight tracking-[-0.01em] text-ink md:text-3xl">
                <span className="text-ink/45 line-through decoration-truth/60 decoration-2">
                  Brochure: {gap.placement.claimedPct}% placed · ₹{gap.placement.claimedLpa}L avg
                </span>
                <span aria-hidden className="mx-3 text-truth">→</span>
                <span>
                  Reality: {gap.placement.verifiedPct}% · ₹{gap.placement.verifiedLpa}L
                </span>
              </p>
              <p className="mt-2 font-mono text-meta uppercase tracking-[0.2em] text-truth">
                {gap.placement.gapPts} points lower than advertised
              </p>
            </div>
          )}

          {/* Claim → reality list, default-visible */}
          <ul className="mt-10 divide-y divide-ink/15 border-y border-ink/15">
            {claims.map((c) => (
              <li key={c.id} className="grid grid-cols-12 gap-4 py-6">
                <div className="col-span-12 md:col-span-3">
                  <p className="font-mono text-meta uppercase tracking-[0.2em] text-ink/55">
                    {c.category.replace("-", " ")}
                  </p>
                  <p className="mt-2 inline-block border border-truth/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-truth [font-variant-numeric:tabular-nums]">
                    Overstated {c.delta}%
                  </p>
                </div>
                <div className="col-span-12 md:col-span-9">
                  <p className="font-serif text-lg leading-snug text-ink/45 line-through decoration-truth/40">
                    &ldquo;{c.claim}&rdquo;
                  </p>
                  <p className="mt-2 max-w-[68ch] font-serif text-lg italic leading-snug text-ink">
                    <span aria-hidden className="mr-2 not-italic text-truth">→</span>
                    {c.truth}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* Fee gap — hard money, the least disputable reality */}
          {gap.fee && (
            <div className="mt-10 border-2 border-ink p-6 md:p-8">
              <p className="font-mono text-meta uppercase tracking-[0.25em] text-ink/60">
                The number they quote vs. the number you pay
              </p>
              <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <span className="font-display text-3xl font-black tracking-[-0.02em] text-ink/45 line-through decoration-truth/60 decoration-2 md:text-4xl">
                  {formatINR(gap.fee.claimed)}
                </span>
                <span aria-hidden className="font-display text-3xl text-truth md:text-4xl">→</span>
                <span className="font-display text-3xl font-black tracking-[-0.02em] text-ink md:text-5xl">
                  {formatINR(gap.fee.actual)}
                </span>
                {gap.fee.extraPct > 0 && (
                  <span className="border border-truth bg-truth px-2 py-1 font-mono text-meta uppercase tracking-[0.15em] text-newsprint [font-variant-numeric:tabular-nums]">
                    +{gap.fee.extraPct}% over the sticker
                  </span>
                )}
              </div>
              {gap.fee.note && (
                <p className="mt-4 max-w-[68ch] font-serif italic text-ink/70">{gap.fee.note}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
