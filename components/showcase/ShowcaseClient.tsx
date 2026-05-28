"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { College } from "@/lib/mock-data/types";
import { safeAccentOnDark } from "@/lib/utils/accent";
import { RevealText } from "@/components/RevealText";
import { MagneticButton } from "@/components/MagneticButton";
import { CinematicIntro } from "./CinematicIntro";
import { CursorSpotlight } from "./CursorSpotlight";
import { ChapterLayout } from "./ChapterLayout";
import { Spinner } from "@/components/Spinner";

// Three.js stage is dynamic-imported so the bundle code-splits cleanly.
// CinematicIntro covers the first ~2 s; the spinner here only shows on
// genuinely slow networks where Three takes longer than that to parse.
const ShowcaseStage = dynamic(
  () => import("./ShowcaseStage").then((m) => m.ShowcaseStage),
  {
    ssr: false,
    loading: () => (
      <div className="pointer-events-none fixed inset-0 -z-10 grid place-items-center bg-ink">
        <Spinner size="md" label="Curtain rising…" className="text-newsprint" />
      </div>
    ),
  }
);

interface ShowcaseProps { colleges: College[]; }

/**
 * /showcase — the Cartier-Watches-and-Wonders-inspired cinematic experience.
 *
 * Choreography:
 *   1. Overture chapter: title curtain raise, "Five files. Five truths."
 *   2. Five college chapters, each pinned for ~150vh of scroll, with
 *      layered editorial reveals choreographed by GSAP ScrollTrigger.
 *   3. Persistent right-rail counter: 01/02/03/04/05 (the show's index).
 *   4. Finale: outro CTA "Open the full file" → /colleges
 *
 * Why this matches the Cartier WAW pattern (without copying it):
 *   - Cinematic pacing: each chapter dwells, not flashes.
 *   - Persistent navigation that lets the user understand "where am I in
 *     this experience" without breaking immersion.
 *   - Smooth GPU-driven background that re-tints per chapter, so the
 *     whole canvas feels like a continuous film rather than a website.
 *   - Editorial type as protagonist, never a hero photograph.
 *
 * Performance budget — every choice serves the "no lag" mandate:
 *   - Single Three.js renderer, ~400 points + 1 shader plane (see ShowcaseStage)
 *   - GSAP ScrollTrigger pinning, scrub:1 throttles per-frame writes
 *   - Per-chapter children rendered once; we toggle data-active rather
 *     than mounting/unmounting on scroll
 *   - Lenis smooth scroll honoured for filmic feel without timer-jank
 */
export function ShowcaseClient({ colleges }: ShowcaseProps) {
  // Index of which chapter is "centred"; drives shader colour + constellation
  const [activeIdx, setActiveIdx] = useState<number>(-1); // -1 = overture
  const [pulse, setPulse] = useState(0);

  const chapters = colleges.map((c) => ({
    accent: safeAccentOnDark(c.primaryAccent),
    fingerprintSeed: c.fingerprintSeed,
  }));

  // Refs to each chapter's <section> for IntersectionObserver wiring
  const overture = useRef<HTMLElement>(null);
  const finale = useRef<HTMLElement>(null);
  const chapterRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    // Watch which section is most-centred to advance the active chapter.
    const sections: { el: HTMLElement | null; idx: number }[] = [
      { el: overture.current, idx: -1 },
      ...chapterRefs.current.map((el, i) => ({ el, idx: i })),
      { el: finale.current, idx: colleges.length },
    ];
    const io = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to viewport centre
        const centred = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => Math.abs(a.intersectionRect.top - a.intersectionRect.height / 2) -
                          Math.abs(b.intersectionRect.top - b.intersectionRect.height / 2));
        if (!centred.length) return;
        const idx = sections.find((s) => s.el === centred[0].target)?.idx;
        if (typeof idx === "number") {
          setActiveIdx((prev) => {
            if (prev !== idx) {
              // brief pulse on chapter change
              setPulse(1);
              setTimeout(() => setPulse(0), 1200);
            }
            return idx;
          });
        }
      },
      { threshold: [0.4, 0.6] }
    );
    sections.forEach((s) => s.el && io.observe(s.el));
    return () => io.disconnect();
  }, [colleges.length]);

  // Scroll-velocity reactive skew on chapter headlines (Studio Freight pattern).
  // We read Lenis's `velocity` from window.__lenis__ and write transform on
  // [data-skewable] elements once per RAF. No React state, no re-renders.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let current = 0;
    const targets = () => document.querySelectorAll<HTMLElement>("[data-skewable]");
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const lenis = (window as unknown as { __lenis__?: { velocity?: number } }).__lenis__;
      const v = lenis?.velocity ?? 0;
      // ease toward target with snappy return; cap to keep it tasteful
      current += (v - current) * 0.1;
      const skew = Math.max(-4, Math.min(4, current * 0.025));
      const scale = 1 - Math.min(0.03, Math.abs(current) * 0.0006);
      targets().forEach((el) => {
        el.style.transform = `skewY(${skew}deg) scaleY(${scale})`;
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // GSAP scroll choreography.
  // Two separate trigger styles per chapter — split intentionally:
  //   (a) Entrance: onEnter fires a single timeline that fades + slides the
  //       layers into place. Plays ONCE per chapter. Not scrub-bound, so the
  //       content is always visible after first reveal — fast-scrollers and
  //       back-scrollers don't see empty sections.
  //   (b) Parallax: a scrub-bound timeline that translates each layer at a
  //       different speed while the chapter passes the viewport. Pure
  //       transforms (no opacity) so the content stays legible throughout.
  //
  // Pinning is deliberately *off* — pinning + scrub + opacity caused the
  // "empty chapter on fast scroll" bug. We get the cinematic feel from
  // the layered scrub parallax + the shader/constellation re-tint instead.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [gsapMod, stMod] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      const gsap = gsapMod.gsap ?? gsapMod.default ?? gsapMod;
      const ScrollTrigger = stMod.ScrollTrigger ?? stMod.default;
      gsap.registerPlugin(ScrollTrigger);

      if (reduced) return;

      const ctx = gsap.context(() => {
        chapterRefs.current.forEach((sec) => {
          if (!sec) return;

          const kicker = sec.querySelector("[data-layer='kicker']");
          const headline = sec.querySelector("[data-layer='headline']");
          const deck = sec.querySelector("[data-layer='deck']");
          const quote = sec.querySelector("[data-layer='quote']");
          const stats = sec.querySelectorAll("[data-layer='stat']");
          const exit = sec.querySelector("[data-layer='exit']");

          // (a) Entrance — plays once, content stays visible afterward
          gsap.set([kicker, headline, deck, quote, exit], { opacity: 0, y: 40 });
          gsap.set(stats, { opacity: 0, y: 30 });
          gsap.timeline({
            scrollTrigger: { trigger: sec, start: "top 75%", once: true },
          })
            .to(kicker,  { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" })
            .to(headline,{ opacity: 1, y: 0, duration: 1.0, ease: "expo.out" }, "-=0.55")
            .to(deck,    { opacity: 1, y: 0, duration: 0.8, ease: "expo.out" }, "-=0.7")
            .to(stats,   { opacity: 1, y: 0, duration: 0.6, ease: "expo.out", stagger: 0.08 }, "-=0.55")
            .to(quote,   { opacity: 1, y: 0, duration: 0.8, ease: "expo.out" }, "-=0.4")
            .to(exit,    { opacity: 1, y: 0, duration: 0.6, ease: "expo.out" }, "-=0.4");

          // (b) Parallax — scrub-bound transforms, no opacity, lasts the
          // length of the section in the viewport. Each layer drifts at its
          // own speed so the spread breathes as it passes.
          gsap.timeline({
            scrollTrigger: {
              trigger: sec,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          })
            .fromTo(headline, { yPercent: 0 },  { yPercent: -8, ease: "none" }, 0)
            .fromTo(deck,     { yPercent: 0 },  { yPercent: -14, ease: "none" }, 0)
            .fromTo(kicker,   { yPercent: 0 },  { yPercent: -22, ease: "none" }, 0)
            .fromTo(quote,    { yPercent: 0 },  { yPercent: -10, ease: "none" }, 0);
        });
      });
      cleanup = () => ctx.revert();
    })();
    return () => cleanup?.();
  }, []);

  // Active accent for the floating side rail
  const railAccent =
    activeIdx >= 0 && activeIdx < chapters.length
      ? chapters[activeIdx].accent
      : "#E63946";

  return (
    /* The showcase is always-dark — the editorial-monochrome reads, the
       Three.js stage runs against ink, and the bone typography stays
       legible regardless of the global paper/ink theme toggle. */
    <div className="bg-ink text-newsprint">
      <CinematicIntro />
      <ShowcaseStage
        chapterIndex={Math.max(0, Math.min(activeIdx, chapters.length - 1))}
        chapters={chapters}
        pulse={pulse}
      />
      <CursorSpotlight color={railAccent} />

      {/* Right-side chapter index — persistent, hovers above the canvas */}
      <aside
        aria-label="Showcase chapters"
        className="no-print pointer-events-none fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 md:block"
      >
        <ul className="space-y-2.5 text-right font-mono text-[10px] uppercase tracking-[0.3em]">
          {[
            { idx: -1, label: "Overture" },
            ...colleges.map((c, i) => ({ idx: i, label: c.shortName })),
            { idx: colleges.length, label: "Fin" },
          ].map((s) => {
            const active = s.idx === activeIdx;
            return (
              <li key={s.idx} className="flex items-center justify-end gap-3 transition-colors duration-300">
                <span
                  className="transition-colors"
                  style={{ color: active ? railAccent : "rgba(232,225,208,0.85)" }}
                >
                  {s.label}
                </span>
                <span
                  aria-hidden
                  className="inline-block h-px transition-all duration-700 ease-[var(--ease-expo)]"
                  style={{
                    width: active ? 32 : 12,
                    background: active ? railAccent : "rgba(232,225,208,0.45)",
                  }}
                />
                <span
                  className="w-6 text-left"
                  style={{ color: active ? railAccent : "rgba(232,225,208,0.75)" }}
                >
                  {s.idx < 0 ? "00" : s.idx >= colleges.length ? "fin" : String(s.idx + 1).padStart(2, "0")}
                </span>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* ────────── Overture ────────── */}
      <section
        ref={overture}
        aria-labelledby="overture-heading"
        className="relative grid min-h-[100svh] items-center justify-items-start px-6 pt-24 md:px-10"
      >
        <div className="max-w-5xl">
          <p className="font-mono text-meta uppercase tracking-[0.4em] text-newsprint/70">
            Now showing · UNFILTERED · 2026
          </p>
          <h1
            id="overture-heading"
            className="mt-6 font-display text-[clamp(3rem,11vw,12rem)] font-black uppercase leading-[0.82] tracking-[-0.045em] text-newsprint"
          >
            <RevealText as="span" trigger="mount" variant="rise" className="whitespace-nowrap">Five files.</RevealText>
            <br />
            <RevealText as="span" trigger="mount" delay={0.15} variant="rise" className="whitespace-nowrap italic text-truth">
              Five truths.
            </RevealText>
          </h1>
          <p className="mt-8 max-w-2xl font-serif text-2xl italic text-newsprint/80">
            A cinematic procession through five Indian colleges, each presented as a chapter — the brochure, the truth, the verified counter-reading. Scroll to advance the film.
          </p>
          <p className="mt-12 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/50">
            ▼ Curtain raises
          </p>
        </div>
      </section>

      {/* ────────── Chapters ──────────
         * Each chapter renders one of five distinct compositional layouts,
         * chosen to fit the college's editorial character. The layouts use
         * the same `data-layer` hooks so the GSAP entrance/parallax stays
         * uniform — but the visible composition is genuinely different.
         *
         *   01 EDITORIAL — centred, traditional newspaper feel (ITE Bombay)
         *   02 SPLIT     — headline left, massive pull-quote right (Sai)
         *   03 STACK     — vertical poetry, intimate (Nila Arts)
         *   04 FRAME     — accusation: data huge, headline footnote (ABS)
         *   05 MINIMAL   — quiet underdog, mostly negative space (KRU)
         */}
      {colleges.map((c, i) => {
        const accent = chapters[i].accent;
        return (
          <section
            key={c.slug}
            ref={(el) => {
              if (el) chapterRefs.current[i] = el;
            }}
            aria-label={`Chapter ${i + 1}: ${c.shortName}`}
            className="relative min-h-[100svh] px-6 md:px-10"
          >
            <ChapterLayout chapter={c} index={i} accent={accent} />
          </section>
        );
      })}

      {/* ────────── Finale ──────────
          Trailing pb-0 so it flows flush into the Footer's marquee with
          no inky gap — addresses the visible 128 px void users reported. */}
      <section
        ref={finale}
        aria-labelledby="finale-heading"
        className="relative grid min-h-[100svh] place-items-center px-6 pb-0 md:px-10"
      >
        <div className="max-w-5xl text-center">
          <p className="font-mono text-meta uppercase tracking-[0.4em] text-newsprint/70">
            Fin · End of programme
          </p>
          <h2
            id="finale-heading"
            className="mt-6 font-display text-[clamp(3rem,12vw,12rem)] font-black uppercase leading-[0.82] tracking-[-0.04em] text-newsprint"
          >
            <RevealText as="span" variant="rise">Five chapters.</RevealText>
            <br />
            <RevealText as="span" variant="rise" delay={0.15} className="italic text-truth">
              One unfiltered file.
            </RevealText>
          </h2>
          <p className="mx-auto mt-8 max-w-2xl font-serif text-2xl italic text-newsprint/80">
            The film closes. The file remains open. Browse every case, every review, every redaction.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <MagneticButton as="a" href="/colleges" variant="primary">
              Open all files
              <span aria-hidden>→</span>
            </MagneticButton>
            <MagneticButton as="a" href="/submit" variant="ghost">
              File your own
            </MagneticButton>
            <Link
              href="/"
              data-cursor="link"
              className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60 underline-offset-4 hover:text-newsprint hover:underline"
            >
              Replay from overture
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
