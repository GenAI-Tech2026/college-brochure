"use client";
import { useEffect, useRef } from "react";

/**
 * SECTION 3 — "THE METHOD"
 *
 * Animated 4-step pipeline:
 *   [.edu email]  →  [Cross-checked]  →  [Documented]  →  [Published]
 *
 * Each icon is hand-drawn SVG with CSS keyframe animations:
 *   1. envelope pulses — "incoming verification"
 *   2. two pages overlap, a checkmark draws — "cross-reference"
 *   3. papers fall into a folder — "documentation"
 *   4. lines run through a press — "publish"
 *
 * Why not Lottie? The icons are tiny conceptual marks, not illustrations.
 * Inline SVG with stroke-dashoffset animations is ~20x cheaper than Lottie
 * runtime + JSON parsing for shapes this simple, and the SVG inherits
 * `currentColor` so theming is free.
 *
 * Entry animation: when the section enters the viewport an Intersection-
 * Observer arms the connecting Truth Red line and the icons in sequence,
 * each delayed by 220ms — a deliberate "step-step-step-step" cadence.
 */
export function SectionMethod() {
  const wrap = useRef<HTMLDivElement>(null);
  const tl = useRef<HTMLOListElement>(null);

  // Desktop horizontal pipeline — one-shot arm when it scrolls into view.
  useEffect(() => {
    if (!wrap.current) return;
    const el = wrap.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      el.dataset.state = "armed";
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.state = "armed";
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Mobile roadmap — reveal each stop as it scrolls into view, and grow the
  // central rail. Per-step (not one-shot) so it animates down as you scroll.
  useEffect(() => {
    const root = tl.current;
    if (!root) return;
    const steps = Array.from(root.querySelectorAll<HTMLElement>(".tl-step"));
    const rail = root.querySelector<HTMLElement>(".tl-rail-fill");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      steps.forEach((s) => (s.dataset.visible = "1"));
      if (rail) rail.dataset.grow = "1";
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.visible = "1";
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.55, rootMargin: "0px 0px -10% 0px" },
    );
    steps.forEach((s) => io.observe(s));
    const railIo = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && rail) {
          rail.dataset.grow = "1";
          railIo.disconnect();
        }
      },
      { threshold: 0.05 },
    );
    railIo.observe(root);
    return () => {
      io.disconnect();
      railIo.disconnect();
    };
  }, []);

  const steps: { label: string; sub: string; icon: React.ReactNode }[] = [
    { label: "Verified", sub: "", icon: <EnvelopeIcon /> },
    { label: "Cross-checked", sub: "3 independent sources", icon: <PagesIcon /> },
    { label: "Documented", sub: "evidence filed", icon: <FolderIcon /> },
    { label: "Published", sub: "case unsealed", icon: <PressIcon /> },
  ];

  return (
    <section id="method" className="relative bg-ink px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <header className="mb-14 text-center">
          <p className="mb-3 inline-flex items-center gap-3 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
            <span className="inline-block h-px w-8 bg-truth" />
            SECTION · 02 · THE METHOD
          </p>
          <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-newsprint md:text-6xl">
            How we know <em className="font-display italic text-truth">it&apos;s true.</em>
          </h2>
        </header>

        {/* DESKTOP — horizontal 4-step pipeline */}
        <div ref={wrap} data-state="idle" className="pipeline relative hidden md:block">
          {/* connector line — animates left-to-right when armed */}
          <div
            aria-hidden
            className="absolute left-[7%] right-[7%] top-[58px] h-px bg-newsprint/15"
          />
          <div
            aria-hidden
            className="pipeline-line absolute left-[7%] top-[58px] h-px origin-left scale-x-0 bg-truth"
            style={{ width: "86%" }}
          />

          <div className="grid grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.label} className="pipeline-step relative flex flex-col items-center text-center" style={{ ["--idx" as string]: i }}>
                <div className="relative grid h-28 w-28 place-items-center rounded-full border border-newsprint/15 bg-[#141210]">
                  <span className="absolute -top-3 font-mono text-[0.6rem] uppercase tracking-[0.25em] text-newsprint/55">
                    STEP · 0{i + 1}
                  </span>
                  <div className="h-10 w-10 text-newsprint">{s.icon}</div>
                </div>
                <div className="mt-5 font-display text-xl text-newsprint">{s.label}</div>
                {s.sub && (
                  <div className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-newsprint/55">
                    {s.sub}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* MOBILE — workflow roadmap (same left-rail representation as before:
            nodes + rail down one side, explaining text beside them). The whole
            block is centered on the page rather than left-aligned. */}
        <ol ref={tl} className="pipeline relative mx-auto w-fit md:hidden">
          {/* rail (track + animated truth fill) */}
          <span aria-hidden className="absolute bottom-12 left-10 top-12 w-px -translate-x-1/2 bg-newsprint/15" />
          <span aria-hidden className="tl-rail-fill absolute left-10 top-12 w-px -translate-x-1/2 bg-truth" style={{ bottom: "3rem" }} />

          {steps.map((s, i) => (
            <li
              key={s.label}
              className="tl-step relative flex items-center py-6 pl-32"
              data-side="right"
            >
              <span className="tl-node absolute left-10 top-1/2 z-10 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-newsprint/15 bg-[#141210]">
                <span className="absolute -top-3 whitespace-nowrap font-mono text-[0.62rem] uppercase tracking-[0.2em] text-newsprint/55">
                  0{i + 1}
                </span>
                <span className="h-10 w-10 text-newsprint">{s.icon}</span>
              </span>

              <div className="tl-card text-left">
                <div className="font-display text-2xl text-newsprint">{s.label}</div>
                {s.sub && (
                  <div className="mt-1 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-newsprint/55">
                    {s.sub}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>

        <p className="mx-auto mt-12 max-w-xl text-center font-mono text-sm text-newsprint/70 md:mt-14">
          Verified by .edu emails. Cross-referenced against three independent sources.
        </p>
      </div>

      <style>{`
        /* connector line: when the section is armed, draw it across, then
           let each step bloom in sequence */
        .pipeline[data-state="armed"] .pipeline-line {
          animation: pipeline-draw 1.6s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes pipeline-draw {
          to { transform: scaleX(1); }
        }
        .pipeline .pipeline-step {
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 600ms var(--ease-expo), transform 600ms var(--ease-expo);
          transition-delay: calc(220ms * var(--idx));
        }
        .pipeline[data-state="armed"] .pipeline-step {
          opacity: 1;
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .pipeline-line { transform: scaleX(1) !important; animation: none !important; }
          .pipeline-step { opacity: 1 !important; transform: none !important; transition: none !important; }
        }

        /* ── mobile roadmap ── (translate/scale are independent CSS props in
           Tailwind v4, so centering via -translate-* never fights these) */
        .tl-node {
          opacity: 0;
          scale: 0.6;
          transition: opacity 500ms var(--ease-expo), scale 500ms var(--ease-expo);
        }
        .tl-step[data-visible] .tl-node { opacity: 1; scale: 1; }

        .tl-card {
          opacity: 0;
          transition: opacity 600ms var(--ease-expo), translate 600ms var(--ease-expo);
        }
        .tl-step[data-side="left"] .tl-card { translate: -20px 0; }
        .tl-step[data-side="right"] .tl-card { translate: 20px 0; }
        .tl-step[data-visible] .tl-card { opacity: 1; translate: 0 0; }

        .tl-rail-fill {
          transform-origin: top;
          scale: 1 0;
          transition: scale 1200ms var(--ease-expo);
        }
        .tl-rail-fill[data-grow] { scale: 1 1; }

        @media (prefers-reduced-motion: reduce) {
          .tl-node { opacity: 1 !important; scale: 1 !important; transition: none !important; }
          .tl-card { opacity: 1 !important; translate: 0 0 !important; transition: none !important; }
          .tl-rail-fill { scale: 1 1 !important; transition: none !important; }
        }
        /* iconic stroke-dashoffset draw animations — armed-state triggers */
        .pipeline[data-state="armed"] .stroke-draw {
          animation: stroke-draw 1.2s cubic-bezier(0.16,1,0.3,1) forwards;
          animation-delay: calc(220ms * var(--idx) + 400ms);
        }
        @keyframes stroke-draw {
          to { stroke-dashoffset: 0; }
        }
        .pipeline[data-state="armed"] .icon-pulse {
          animation: icon-pulse 2.4s ease-in-out infinite;
          animation-delay: calc(220ms * var(--idx) + 600ms);
        }
        @keyframes icon-pulse {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.06); }
        }
      `}</style>
    </section>
  );
}

/* ─── icons ──────────────────────────────────────────────────────── */

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full icon-pulse">
      <rect
        x="4"
        y="10"
        width="32"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4 12 L20 24 L36 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="stroke-draw"
        style={{ strokeDasharray: 60, strokeDashoffset: 60 }}
      />
      <rect x="24" y="6" width="10" height="6" fill="rgb(255 67 50)" />
      <text x="29" y="11" textAnchor="middle" fontSize="5" fontFamily="var(--font-mono)" fill="white">
        .EDU
      </text>
    </svg>
  );
}

function PagesIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <rect x="6" y="8" width="20" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="12" width="20" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M19 24 L23 28 L31 18"
        fill="none"
        stroke="rgb(255 67 50)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-draw"
        style={{ strokeDasharray: 22, strokeDashoffset: 22 }}
      />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <path
        d="M4 12 L16 12 L19 8 L36 8 L36 32 L4 32 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="10"
        y1="18"
        x2="30"
        y2="18"
        stroke="currentColor"
        strokeWidth="1.2"
        className="stroke-draw"
        style={{ strokeDasharray: 22, strokeDashoffset: 22 }}
      />
      <line
        x1="10"
        y1="22"
        x2="26"
        y2="22"
        stroke="currentColor"
        strokeWidth="1.2"
        className="stroke-draw"
        style={{ strokeDasharray: 18, strokeDashoffset: 18, animationDelay: "0.2s" }}
      />
      <line
        x1="10"
        y1="26"
        x2="28"
        y2="26"
        stroke="rgb(255 67 50)"
        strokeWidth="1.2"
        className="stroke-draw"
        style={{ strokeDasharray: 20, strokeDashoffset: 20, animationDelay: "0.4s" }}
      />
    </svg>
  );
}

function PressIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <rect x="6" y="10" width="28" height="6" fill="currentColor" opacity="0.85" />
      <rect x="6" y="24" width="28" height="6" fill="currentColor" opacity="0.5" />
      <rect
        x="14"
        y="16"
        width="12"
        height="8"
        fill="none"
        stroke="rgb(255 67 50)"
        strokeWidth="1.5"
      />
      <line
        x1="18"
        y1="34"
        x2="22"
        y2="34"
        stroke="currentColor"
        strokeWidth="1.5"
        className="stroke-draw"
        style={{ strokeDasharray: 6, strokeDashoffset: 6 }}
      />
    </svg>
  );
}
