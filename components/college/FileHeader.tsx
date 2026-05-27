"use client";
import { useEffect, useRef } from "react";
import { fingerprintPaths } from "@/lib/utils/fingerprint";
import { safeAccentOnDark } from "@/lib/utils/accent";
import { RevealText } from "@/components/RevealText";
import type { College } from "@/lib/mock-data/types";

/**
 * Module A — "THE FILE" header.
 * 240px Fraunces. Auto-numbered case file. Three live counters.
 *
 * The fingerprint SVG bottom-right is the college's identity mark — same
 * generative pattern used on the explorer card, scaled up.
 */
export function FileHeader({ college }: { college: College }) {
  const counterRefs = useRef<HTMLSpanElement[]>([]);
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      const { gsap } = await import("gsap");
      counterRefs.current.forEach((el) => {
        const target = parseFloat(el.dataset.value || "0");
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.8,
          ease: "expo.out",
          onUpdate: () => {
            el.textContent = Math.round(obj.v).toLocaleString();
          },
        });
      });
    })();
    return () => cleanup?.();
  }, [college.slug]);

  const prints = fingerprintPaths(college.fingerprintSeed, 20);
  const accent = safeAccentOnDark(college.primaryAccent);

  return (
    <section
      className="relative isolate min-h-[100svh] overflow-hidden border-b border-newsprint/10 bg-ink px-6 pb-16 pt-32 md:px-10 md:pb-24"
      aria-labelledby="college-name"
    >
      <div className="flex items-center justify-between font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
        <span>The File · Case {college.caseFileNumber}</span>
        <span style={{ color: accent }}>
          {college.tier.toUpperCase()} · {college.category.replace("-", " ")}
        </span>
      </div>

      <h1
        id="college-name"
        className="mt-12 font-display font-black uppercase leading-[0.82] tracking-[-0.045em] text-newsprint"
        style={{ fontSize: "clamp(3.5rem, 11vw, 240px)" }}
      >
        <RevealText as="span" variant="rise" stagger={0.025} trigger="mount">
          {college.name}
        </RevealText>
      </h1>

      <p className="mt-6 max-w-3xl font-serif text-2xl italic text-newsprint/80 md:text-3xl">
        &ldquo;{college.tagline}&rdquo;
      </p>

      <div className="mt-20 grid grid-cols-3 gap-6 border-t border-newsprint/10 pt-10">
        {[
          { label: "Truth Score", value: college.truthScore, suffix: "/100" },
          { label: "Reviews collected", value: college.reviewCount, suffix: "" },
          { label: "Verified students", value: college.verifiedCount, suffix: "" },
        ].map((s, i) => (
          <div key={s.label}>
            <p className="font-mono text-meta uppercase tracking-[0.2em] text-newsprint/60">
              {s.label}
            </p>
            <p className="mt-3 font-display text-[clamp(3rem,7vw,8rem)] font-black leading-none tracking-[-0.03em] text-newsprint">
              <span
                ref={(el) => {
                  if (el) counterRefs.current[i] = el;
                }}
                data-value={s.value}
              >
                0
              </span>
              <span style={{ color: accent }}>{s.suffix}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Fingerprint — large */}
      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute -right-12 bottom-0 h-[60vh] w-[60vh] opacity-30"
        aria-hidden
      >
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
    </section>
  );
}
