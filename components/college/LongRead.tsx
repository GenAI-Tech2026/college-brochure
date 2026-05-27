"use client";
import { useEffect, useRef } from "react";
import { RevealText } from "@/components/RevealText";
import type { College } from "@/lib/mock-data/types";

/**
 * Module F — MAGAZINE LONG-READ
 *
 * Three-column newspaper layout with drop caps, marginalia, a pull quote,
 * and a scroll-linked reading highlight on the active paragraph.
 *
 * Print-friendly: print stylesheet in globals.css converts this section
 * into a standard newspaper-article column flow.
 */
export function LongRead({ college }: { college: College }) {
  const wrap = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!wrap.current) return;
    const ps = wrap.current.querySelectorAll<HTMLParagraphElement>("[data-para]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.setAttribute("data-active", "true");
        });
      },
      { threshold: 0.6 }
    );
    ps.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, []);

  return (
    <article
      ref={wrap}
      className="paper border-y border-ink/20 px-6 py-32 md:px-10 md:py-48"
      aria-labelledby="long-read-heading"
    >
      <header className="grid grid-cols-12 gap-6 border-b border-ink/20 pb-12">
        <p className="col-span-12 font-mono text-meta uppercase tracking-[0.3em] text-ink/60">
          Section F · The Long Read · Filed 2026
        </p>
        <h2
          id="long-read-heading"
          className="col-span-12 font-display text-[clamp(2.5rem,8vw,8rem)] font-black uppercase leading-[0.88] tracking-[-0.04em] text-ink"
        >
          <RevealText as="span" variant="rise">{`${college.shortName}, in full.`}</RevealText>
        </h2>
        <p className="col-span-12 max-w-3xl font-serif text-2xl italic text-ink/70 md:col-span-9">
          {college.longRead.deck}
        </p>
        <p className="col-span-12 font-mono text-meta uppercase tracking-[0.2em] text-ink/50 md:col-span-3 md:text-right">
          {college.longRead.byline}
        </p>
      </header>

      <div className="mt-12 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <div className="sticky top-32">
            <p className="font-mono text-meta uppercase tracking-[0.2em] text-ink/60">Marginalia</p>
            <ul className="mt-4 space-y-3 font-serif italic text-ink/70">
              <li>· Claim-to-truth deltas verified against {college.brochureClaims.length} categories.</li>
              <li>· Counter-claims from {college.reviewCount} reviewers, {college.verifiedCount} verified.</li>
              <li>· Truth-score: {college.truthScore}/100.</li>
              <li>· Press <kbd className="bg-ink/10 px-1">P</kbd> to print this article on newsprint stock.</li>
            </ul>
          </div>
        </aside>

        <div className="col-span-12 md:col-span-9">
          {college.longRead.paragraphs.map((para, i) => (
            <p
              key={i}
              data-para
              data-active="false"
              className={
                "mb-8 font-serif text-xl leading-relaxed text-ink/70 transition-colors duration-700 " +
                "data-[active=true]:text-ink " +
                (i === 0 ? "drop-cap text-2xl" : "")
              }
            >
              {para}
            </p>
          ))}
          <blockquote className="my-12 border-l-4 border-truth pl-8 font-display text-pull leading-[0.95] italic text-ink">
            &ldquo;{college.longRead.pullQuote}&rdquo;
          </blockquote>
        </div>
      </div>
    </article>
  );
}
