"use client";
import { useEffect, useRef } from "react";

interface Stats {
  totalColleges: number;
  totalReviews: number;
  verifiedReviews: number;
  avgTruthScore: number;
}

/**
 * Four headline counters that tick up from 0 on viewport entry.
 * GSAP-driven. The fourth one stops at avgTruthScore — never 100,
 * because no institution gets a perfect honesty score in our world.
 */
export function CounterStrip({ stats }: { stats: Stats }) {
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!wrap.current) return;
    let cleanup: (() => void) | undefined;
    (async () => {
      const { gsap } = await import("gsap");
      const targets = wrap.current!.querySelectorAll<HTMLElement>("[data-counter]");
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            targets.forEach((el) => {
              const target = parseFloat(el.dataset.counter || "0");
              const obj = { v: 0 };
              gsap.to(obj, {
                v: target,
                duration: 2,
                ease: "expo.out",
                onUpdate: () => {
                  el.textContent = Math.round(obj.v).toLocaleString();
                },
              });
            });
            io.disconnect();
          }
        },
        { threshold: 0.4 }
      );
      io.observe(wrap.current!);
      cleanup = () => io.disconnect();
    })();
    return () => cleanup?.();
  }, []);

  return (
    <section className="paper border-y-2 border-ink" aria-label="Investigation counters">
      <div ref={wrap} className="grid grid-cols-2 divide-x divide-ink/15 md:grid-cols-4">
        {[
          { label: "Case files opened", value: stats.totalColleges, suffix: "" },
          { label: "Reviews collected", value: stats.totalReviews, suffix: "" },
          { label: "Verified", value: stats.verifiedReviews, suffix: "" },
          { label: "Avg. truth score", value: stats.avgTruthScore, suffix: "/100" },
        ].map((c) => (
          <div key={c.label} className="px-6 py-12 md:py-20">
            <p className="font-mono text-meta uppercase tracking-[0.2em] text-ink/60">{c.label}</p>
            <p className="mt-4 font-display text-[clamp(3rem,8vw,9rem)] font-black leading-none tracking-[-0.03em] text-ink">
              <span data-counter={c.value}>0</span>
              <span className="text-truth">{c.suffix}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
