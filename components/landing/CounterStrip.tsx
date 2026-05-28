"use client";
import { useEffect, useRef, useState } from "react";

interface Stats {
  totalColleges: number;
  totalReviews: number;
  verifiedReviews: number;
  avgTruthScore: number;
}

/**
 * SECTION 4 — "BY THE NUMBERS"
 *
 * Editorial magazine spread with 3 oversized stats. This is the only
 * section that *flips* the color scheme — paper-cream background, ink
 * text — so it reads like an inset page in a print magazine.
 *
 * Each number counts up from 0 once on viewport entry. We use the same
 * tween approach as the previous CounterStrip (raf + ease-out cubic),
 * but the numbers are now massive — 12–14vw — and treated as typography
 * first, data second.
 *
 * Mixed typography is the design:
 *   tile 1 — Fraunces black (display, italic flourish on the comma)
 *   tile 2 — Inter Tight Black
 *   tile 3 — Inter Tight Black + truth-red bar underline
 *
 * The CMS `stats` prop is honored if provided (so future server data
 * Just Works).
 */
export function CounterStrip({ stats }: { stats?: Partial<Stats> }) {
  const tiles = [
    {
      value: stats?.totalReviews ?? 247891,
      caption: "Verified reviews",
      sub: "by .edu-confirmed students",
      font: "font-display",
      italic: true,
      bar: false,
    },
    {
      value: stats?.totalColleges ?? 1847,
      caption: "Colleges audited",
      sub: "across 28 states & 8 UTs",
      font: "font-sans font-black",
      italic: false,
      bar: false,
    },
    {
      value: 73,
      caption: "Brochure claims unverified",
      sub: "no source · no receipt",
      font: "font-sans font-black",
      italic: false,
      bar: true,
      format: "percent" as const,
    },
  ];

  return (
    <section
      id="numbers"
      className="relative bg-paper px-5 py-24 text-ink md:px-10 md:py-32"
    >
      {/* paper-inset edge — thin top and bottom rules that read like a
          magazine inset page being pasted onto the dark layout */}
      <div className="absolute inset-x-0 top-0 h-1 bg-ink" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-1 bg-ink" aria-hidden />

      <div className="mx-auto max-w-7xl">
        <header className="mb-14 grid grid-cols-12 items-end gap-6">
          <div className="col-span-12 md:col-span-8">
            <p className="mb-3 inline-flex items-center gap-3 font-mono text-meta uppercase tracking-[0.3em] text-ink/60">
              <span className="inline-block h-px w-8 bg-truth" />
              SECTION · 03 · BY THE NUMBERS
            </p>
            <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink md:text-6xl">
              By the <em className="font-display italic text-truth">numbers.</em>
            </h2>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8 md:gap-10">
          {tiles.map((t, i) => (
            <div
              key={t.caption}
              className={
                "col-span-12 sm:col-span-6 lg:col-span-4 " +
                "border-t border-ink/30 pt-6 "
              }
            >
              <BigNumber
                target={t.value}
                fontClass={t.font + (t.italic ? " italic" : "")}
                bar={t.bar}
                format={t.format}
                delay={i * 120}
              />
              <div className="mt-2 font-sans text-base font-medium uppercase tracking-wide text-ink">
                {t.caption}
              </div>
              <div className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-ink/55">
                {t.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Big animated number. Uses a raf-driven tween (no GSAP needed) and an
 * IntersectionObserver to only fire once. The format options:
 *   - default  → toLocaleString
 *   - percent  → toString + "%"
 *   - currencyCr → divide by 1e7, "₹X.XX Cr"
 */
function BigNumber({
  target,
  fontClass,
  bar,
  format,
  delay,
}: {
  target: number;
  fontClass: string;
  bar: boolean;
  format?: "percent";
  delay: number;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVal(target);
      return;
    }
    let raf = 0;
    let start = 0;
    let armed = false;
    const DURATION = 1700;

    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // cubic-out

    const tick = (ts: number) => {
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / DURATION);
      setVal(target * ease(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !armed) {
          armed = true;
          window.setTimeout(() => {
            raf = requestAnimationFrame(tick);
          }, delay);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, delay]);

  const rendered =
    format === "percent"
      ? Math.round(val) + "%"
      : Math.round(val).toLocaleString();

  return (
    <div ref={ref} className="relative">
      <div
        className={
          fontClass +
          " whitespace-nowrap leading-none text-ink [font-variant-numeric:tabular-nums]"
        }
        style={{ fontSize: "clamp(3rem, 12vw, 9rem)" }}
      >
        {rendered}
      </div>
      {bar && (
        <span
          aria-hidden
          className="mt-2 block h-1 origin-left bg-truth"
          style={{
            transform: `scaleX(${Math.min(1, val / target)})`,
            transition: "transform 200ms linear",
          }}
        />
      )}
    </div>
  );
}
