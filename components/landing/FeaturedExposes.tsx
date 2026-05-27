"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { College, BrochureClaim } from "@/lib/mock-data/types";
import { RedactionBar } from "@/components/RedactionBar";

interface Item { college: College; claim: BrochureClaim; }

/**
 * Pinned horizontal scroll spread: "BROCHURE VS REALITY".
 * Five vertical pairs scroll past as the section is pinned, GSAP-driven
 * via ScrollTrigger. Each pair is a single RedactionBar with the parent
 * containing college metadata + a CTA into the case file.
 *
 * Why pinned-horizontal here: the visual rhythm is comparative — the user
 * needs to *feel* the gap between claim and truth row after row. Vertical
 * scroll would let them blur over it.
 */
export function FeaturedExposes({ items }: { items: Item[] }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!section.current || !track.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    // Pin-horizontal on a touch device is awkward: a vertical swipe is
    // expected to advance vertical content. We disable the pin below
    // 768 px and let the cards stack into a vertical scroll instead.
    if (window.matchMedia("(max-width: 767px)").matches) return;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [gsapMod, stMod] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      const gsap = gsapMod.gsap ?? gsapMod.default ?? gsapMod;
      const ScrollTrigger = stMod.ScrollTrigger ?? stMod.default;
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        // Recompute the scroll distance lazily on every refresh.
        // The previous version captured `total` once at setup, BEFORE
        // Fraunces had finished loading — so card widths were still
        // browser-default and the pin/end measurements were short.
        // Result: scrolling down landed in an unpinned "blank" stretch
        // because the spacer was sized to a stale total. Scrolling
        // back up worked because GSAP had refreshed after layout settled.
        const getTotal = () => {
          if (!track.current) return 0;
          return Math.max(0, track.current.scrollWidth - window.innerWidth);
        };

        gsap.to(track.current, {
          x: () => -getTotal(),
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: () => `+=${getTotal()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        // ctx.revert() (set below) handles BOTH the tween AND its
        // ScrollTrigger AND the pin-spacer DOM cleanup — defensive against
        // React unmounting the section before GSAP has finished tearing
        // its own DOM apart.
      }, section.current!);
      cleanup = () => {
        try { ctx.revert(); } catch { /* already gone */ }
      };

      // Force one refresh after web-font load — Fraunces hydrates the
      // card widths AFTER initial paint, so without this the pin ends
      // ~200–500 px too early.
      if (typeof document !== "undefined" && document.fonts?.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }

      // No-op — final cleanup already set above with try/catch
    })();

    return () => cleanup?.();
  }, []);

  return (
    // min-h-screen guarantees the section ALWAYS fills the viewport
    // when pinned. Previously the section was ~736px tall against a
    // ~900px viewport, so the bottom 160px showed whatever was below
    // (next section / marquee) bleeding through — the "blank page"
    // the user reported. With min-h-screen the pin covers the whole
    // viewport for the entire horizontal-scroll duration.
    <section
      ref={section}
      className="relative isolate flex min-h-screen flex-col justify-center overflow-hidden bg-ink"
      aria-label="Brochure vs Reality featured exposés"
    >
      <div className="flex items-end justify-between px-6 md:px-10">
        <h2 className="font-display text-[clamp(2.5rem,6vw,6rem)] font-black uppercase leading-[0.9] tracking-[-0.03em] text-newsprint">
          Brochure <span className="italic text-truth">vs.</span> Reality
        </h2>
        <p className="hidden max-w-xs font-mono text-meta uppercase tracking-[0.3em] text-newsprint/50 md:block">
          Five claims · Five truths · Verified · Filed under UF-26
        </p>
      </div>

      {/* Mobile (< md) stacks the cards vertically — full-width, normal
          vertical scroll. Desktop becomes the horizontal pinned track
          (handled by the GSAP effect above). The flex direction switches
          at md, and w-max only applies on md+ so the mobile container
          doesn't grow to the horizontal-track width. */}
      <div
        ref={track}
        className="mt-12 flex flex-col gap-8 px-6 md:w-max md:flex-row md:items-stretch md:gap-12 md:px-10 md:[padding-right:30vw]"
      >
        {items.map(({ college, claim }, i) => (
          <article
            key={`${college.slug}-${claim.id}`}
            className="relative w-full flex-shrink-0 border border-newsprint/10 bg-ink p-6 md:w-[60vw] md:p-12"
          >
            <div className="mb-8 flex items-center justify-between font-mono text-meta uppercase tracking-[0.2em] text-newsprint/60">
              <span>Case · {college.caseFileNumber}</span>
              <span className="text-truth">N° 0{i + 1}</span>
            </div>
            <h3 className="font-display text-3xl font-black uppercase leading-tight text-newsprint md:text-5xl">
              {college.shortName}
            </h3>
            <p className="mt-2 font-serif italic text-newsprint/60">{college.city} · {college.category}</p>
            <hr className="my-8 border-newsprint/10" />
            <RedactionBar claim={claim.claim} truth={claim.truth} delta={claim.delta} />
            <div className="mt-10">
              <Link
                href={`/college/${college.slug}`}
                data-cursor="link"
                className="inline-flex items-center gap-3 font-mono text-meta uppercase tracking-[0.2em] text-newsprint underline-offset-4 hover:text-truth hover:underline"
              >
                Open the case file
                <span aria-hidden>→</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
