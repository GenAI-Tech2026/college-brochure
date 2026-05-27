"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { RevealText } from "@/components/RevealText";
import { MagneticButton } from "@/components/MagneticButton";
import { Spinner } from "@/components/Spinner";
import { splitText } from "@/lib/utils/splitText";

// PixiJS only ships to the browser, never to the SSR bundle.
// The `loading` fallback gives slow-connection users a redacted-bar
// indicator while the ~150 KB Pixi chunk parses.
const PixiHero = dynamic(
  () => import("@/components/hero/PixiHero").then((m) => m.PixiHero),
  {
    ssr: false,
    loading: () => (
      <div className="pointer-events-none absolute inset-0 -z-10 grid place-items-center bg-ink">
        <Spinner size="md" label="Loading the brochure…" className="text-newsprint" />
      </div>
    ),
  }
);

/**
 * The first 100vh. The headline is the centrepiece — and now it actually
 * TEARS APART as the user scrolls. Each character of every line gets a
 * random tear vector (rotation + xy translation) that scales with the
 * normalised scroll distance through the hero section. By the time the
 * user has scrolled one viewport, the headline has been visibly ripped
 * apart and flung off-screen — exactly what the brochure-lie metaphor
 * promised.
 *
 * Implementation:
 *   - splitText() wraps every visible char in a span on mount (post the
 *     initial RevealText entrance, which uses its own split)
 *   - We assign each char a random (vx, vy, vr) — stored as data-* on
 *     the element so GSAP doesn't have to allocate per frame
 *   - A single RAF loop reads window.scrollY, computes a 0–1 progress
 *     through the hero, and writes transform on each char. No GSAP
 *     ScrollTrigger needed — we want this to be cheap and start
 *     immediately on the very first pixel of scroll.
 */
export function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!titleRef.current) return;
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    // Wait until the RevealText entrance animations have completed before
    // we steal the chars. Otherwise our split clobbers their refs.
    const armDelay = setTimeout(() => {
      if (!titleRef.current) return;

      // Split each [data-tear] line into chars
      const lines = titleRef.current.querySelectorAll<HTMLElement>("[data-tear]");
      const allChars: { el: HTMLElement; vx: number; vy: number; vr: number; bias: number }[] = [];
      lines.forEach((line, lineIdx) => {
        const split = splitText(line, { chars: true });
        split.chars.forEach((c, idx) => {
          // Random tear vector per char. Directions favour outward —
          // chars near the left of a word fly LEFT, right of a word fly RIGHT
          const half = split.chars.length / 2;
          const xBias = (idx - half) / half;        // -1 .. +1
          const yBias = lineIdx === 0 ? -1 : 1;     // top line up, bottom down
          allChars.push({
            el: c,
            vx: xBias * (120 + Math.random() * 200),
            vy: yBias * (40 + Math.random() * 160) + (Math.random() - 0.5) * 60,
            vr: (Math.random() - 0.5) * 90,
            bias: Math.random() * 0.25,           // staggered tear-in
          });
          c.style.willChange = "transform, opacity";
          c.style.transition = "none";
        });
      });

      // Single RAF loop
      let raf = 0;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        const sectionH = window.innerHeight;
        const p = Math.min(1, Math.max(0, window.scrollY / sectionH));
        for (const c of allChars) {
          const t = Math.max(0, p - c.bias) * 1.4;
          // ease — cubic for that sudden snap feel
          const e = t * t * t;
          c.el.style.transform = `translate3d(${c.vx * e}px, ${c.vy * e}px, 0) rotate(${c.vr * e}deg)`;
          c.el.style.opacity = `${Math.max(0, 1 - t * 1.1)}`;
        }
      };
      raf = requestAnimationFrame(tick);

      // store on the ref so cleanup can stop it
      (titleRef.current as HTMLElement & { __raf?: number }).__raf = raf;
    }, 1600); // RevealText entrances finish around 1.4s; give a small buffer

    return () => {
      clearTimeout(armDelay);
      const r = (titleRef.current as (HTMLElement & { __raf?: number }) | null)?.__raf;
      if (r) cancelAnimationFrame(r);
    };
  }, []);

  return (
    // bg-ink locked regardless of paper/ink theme.
    <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink px-5 pb-12 pt-28 md:px-10 md:pb-24 md:pt-32">
      <PixiHero />

      {/* Top-corner editorial meta — case-file vibe */}
      <div className="pointer-events-none absolute left-6 top-32 z-10 flex items-center gap-3 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/70 md:left-10">
        <span className="inline-block h-px w-10 bg-current" />
        <span>File · UF · Vol I · 2026</span>
      </div>
      <div className="pointer-events-none absolute right-6 top-32 z-10 flex items-center gap-3 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/70 md:right-10">
        <span>Section · A1</span>
        <span className="inline-block h-px w-10 bg-current" />
      </div>

      <div className="relative z-10">
        <p className="mb-6 inline-flex items-center gap-3 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/70">
          <span className="inline-block h-px w-8 bg-newsprint/50" />
          A verified-student exposé · 5 case files unsealed
        </p>

        <h1
          ref={titleRef}
          className="font-display font-black uppercase leading-[0.85] tracking-[-0.03em] text-newsprint"
        >
          {/* clamp now starts at 2.6rem so "BROCHURES" never overflows on
              390px-wide phones. word-break-keep-all stops mid-word wrap. */}
          <span data-tear className="block text-[clamp(2.6rem,15vw,15rem)] [word-break:keep-all]">
            <RevealText as="span" variant="rise" stagger={0.03} trigger="mount">
              BROCHURES
            </RevealText>
          </span>
          <span className="relative block text-[clamp(2.6rem,15vw,15rem)]">
            <span data-tear className="inline-block">
              <RevealText as="span" variant="rise" stagger={0.04} delay={0.2} trigger="mount">
                LIE.
              </RevealText>
            </span>
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 top-1/2 inline-block h-[0.4em] w-full -translate-y-1/2 origin-left bg-truth"
              style={{ animation: "redaction-assemble 1.4s 1.6s var(--ease-paper) forwards" }}
            />
          </span>
          <span
            data-tear
            className="block font-serif italic text-[clamp(2.6rem,15vw,15rem)] text-truth [word-break:keep-all]"
          >
            <RevealText as="span" variant="rise" stagger={0.03} delay={0.7} trigger="mount">
              STUDENTS DON&apos;T.
            </RevealText>
          </span>
        </h1>

        <div className="mt-12 grid grid-cols-12 gap-6">
          <p className="col-span-12 max-w-md font-serif text-xl text-newsprint/80 md:col-span-5">
            Line-by-line corrections to the brochures that sold us. Verified by students. Filed under truth.
          </p>
          <div className="col-span-12 flex flex-wrap items-center gap-3 md:col-span-7 md:justify-end">
            <MagneticButton as="a" href="/showcase" variant="primary">
              Begin the showcase
              <span aria-hidden>▶</span>
            </MagneticButton>
            <MagneticButton as="a" href="/colleges" variant="ghost">
              Browse all files
            </MagneticButton>
          </div>
        </div>
      </div>

      {/* Bottom scroll affordance — hidden on mobile (overlapped with CTAs).
          Desktop keeps it. */}
      <div className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-meta uppercase tracking-[0.4em] text-newsprint/60 md:flex">
        <span>Keep scrolling — the words tear apart</span>
        <span
          aria-hidden
          className="inline-block h-10 w-px bg-current"
          style={{ animation: "redaction-assemble 1.6s ease-in-out infinite" }}
        />
      </div>
    </section>
  );
}
