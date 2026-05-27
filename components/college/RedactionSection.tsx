"use client";
import { RedactionBar } from "@/components/RedactionBar";
import type { College } from "@/lib/mock-data/types";

/**
 * Module B — REDACTION SECTION
 *
 * Displays the full brochure blurb at the top with the lies redacted
 * inline. Then enumerates each redacted claim with its truth, using
 * the RedactionBar component. The wording in the blurb is genuinely
 * cross-referenced against the claims array so the page stays in sync
 * with whatever data eventually comes from the CMS.
 */
export function RedactionSection({ college }: { college: College }) {
  return (
    <section
      id="redactions"
      className="paper px-6 py-32 md:px-10 md:py-48"
      aria-labelledby="redaction-heading"
    >
      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <p className="font-mono text-meta uppercase tracking-[0.3em] text-ink/60">
            Section B · The brochure, redacted
          </p>
          <p className="mt-4 font-serif italic text-ink/70">
            Black bars conceal the marketing claim. Click a bar to expose the
            wording. Click again for the verified student counter-claim.
          </p>
        </aside>

        <div className="col-span-12 md:col-span-9">
          <h2 id="redaction-heading" className="font-display text-[clamp(2rem,5.5vw,5rem)] font-black uppercase leading-[0.9] tracking-[-0.03em] text-ink">
            The brochure, <span className="italic text-truth">corrected.</span>
          </h2>

          {/* Raw brochure blurb — quoted as if it's a clipped article */}
          <blockquote className="mt-10 max-w-3xl border-l-4 border-ink pl-8 font-serif text-2xl italic text-ink/80 md:text-3xl">
            &ldquo;{college.brochureBlurb}&rdquo;
            <footer className="mt-3 font-mono text-meta uppercase not-italic tracking-[0.2em] text-ink/60">
              — Official prospectus, current edition
            </footer>
          </blockquote>

          <ol className="mt-16 space-y-12 md:space-y-16">
            {college.brochureClaims.map((c, i) => (
              <li
                key={c.id}
                className="grid grid-cols-12 gap-6 border-t border-ink/15 pt-10"
              >
                <div className="col-span-12 md:col-span-2">
                  <p className="can-fade font-display text-6xl font-black leading-none text-ink/40">
                    {(i + 1).toString().padStart(2, "0")}
                  </p>
                  <p className="mt-2 font-mono text-meta uppercase tracking-[0.2em] text-ink/60">
                    {c.category.replace("-", " ")}
                  </p>
                </div>
                <div className="col-span-12 md:col-span-10">
                  <RedactionBar claim={c.claim} truth={c.truth} delta={c.delta} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
