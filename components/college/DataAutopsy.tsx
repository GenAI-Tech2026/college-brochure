"use client";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { safeAccentOnDark } from "@/lib/utils/accent";
import type { PlacementDatum } from "@/lib/mock-data/types";

interface Props { data: PlacementDatum[]; accent: string; }

/**
 * Module E — DATA AUTOPSY (scroll-driven)
 *
 * The section is pinned for ~150 vh of scroll. While pinned, the chart
 * lives through three beats:
 *
 *   beat 1 (progress 0.0 – 0.45)  "what they said"  — cream-coloured bars
 *                                  show the brochure's claimed numbers
 *   beat 2 (progress 0.45 – 0.55) HOLD between views, brief crossfade
 *   beat 3 (progress 0.55 – 1.0)  "what we found"   — vermillion bars
 *                                  show the verified numbers, the gap is
 *                                  visible in the bar heights collapsing
 *
 * The view-flip happens automatically as you scroll — no buttons required.
 * (The buttons are still present below the chart as accessible fallback
 *  and as a way to revisit each beat after the scroll completes.)
 */
export function DataAutopsy({ data, accent: rawAccent }: Props) {
  const accent = safeAccentOnDark(rawAccent);
  const [view, setView] = useState<"claimed" | "verified">("claimed");
  const [userOverride, setUserOverride] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [animated, setAnimated] = useState(false);

  // Initial draw triggers on viewport entry
  useEffect(() => {
    if (!wrapRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(wrapRef.current);
    return () => io.disconnect();
  }, []);

  // Scroll-driven view flip — pinned ScrollTrigger reads the progress
  // through the section and flips `view` at the midpoint.
  useEffect(() => {
    if (!sectionRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [gsapMod, stMod] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      const gsap = gsapMod.gsap ?? gsapMod.default ?? gsapMod;
      const ScrollTrigger = stMod.ScrollTrigger ?? stMod.default;
      gsap.registerPlugin(ScrollTrigger);

      // gsap.context() collects every ScrollTrigger created inside it and
      // reverts them safely on cleanup — handles pin-spacer DOM removal
      // even when React has already detached the section ref. This is the
      // defensive pattern that prevents `removeChild` errors on nav.
      const ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top top",
          end: "+=150%",
          pin: true,
          scrub: 0.4,
          anticipatePin: 1,
          onUpdate: (self: { progress: number }) => {
            if (userOverride) return;
            const next = self.progress < 0.5 ? "claimed" : "verified";
            setView((prev) => (prev === next ? prev : next));
          },
        });
      }, sectionRef.current!);

      cleanup = () => {
        try { ctx.revert(); } catch { /* already gone */ }
      };
    })();
    return () => cleanup?.();
  }, [userOverride]);

  // D3 redraw on view change or initial animate
  useEffect(() => {
    if (!svgRef.current || !animated) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const W = 720, H = 360, m = { top: 40, right: 16, bottom: 50, left: 50 };
    const w = W - m.left - m.right;
    const h = H - m.top - m.bottom;
    svg.attr("viewBox", `0 0 ${W} ${H}`);

    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    const x = d3.scaleBand().domain(data.map((d) => String(d.year))).range([0, w]).padding(0.3);
    const y = d3.scaleLinear().domain([0, 100]).range([h, 0]);

    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll("text")
      .style("font-family", "JetBrains Mono")
      .style("font-size", "10px")
      .style("fill", "#E8E1D0");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => `${d}%`).tickSize(-w))
      .selectAll("text")
      .style("font-family", "JetBrains Mono")
      .style("font-size", "10px")
      .style("fill", "#E8E1D0");
    g.selectAll(".tick line").attr("stroke", "rgba(232,225,208,0.12)");
    g.selectAll(".domain").attr("stroke", "rgba(232,225,208,0.3)");

    const yField = view === "claimed" ? "claimedPercentage" : "verifiedPercentage";
    const lpaField = view === "claimed" ? "claimedAvgLpa" : "verifiedAvgLpa";

    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => x(String(d.year)) ?? 0)
      .attr("width", x.bandwidth())
      .attr("y", h)
      .attr("height", 0)
      .attr("fill", view === "claimed" ? "rgba(232,225,208,0.55)" : accent)
      .transition()
      .duration(900)
      .ease(d3.easeExpOut)
      .attr("y", (d) => y(d[yField as keyof PlacementDatum] as number))
      .attr("height", (d) => h - y(d[yField as keyof PlacementDatum] as number));

    g.selectAll(".label")
      .data(data)
      .enter()
      .append("text")
      .attr("x", (d) => (x(String(d.year)) ?? 0) + x.bandwidth() / 2)
      .attr("y", (d) => y(d[yField as keyof PlacementDatum] as number) - 8)
      .attr("text-anchor", "middle")
      .style("font-family", "Fraunces")
      .style("font-weight", 900)
      .style("font-size", "14px")
      .style("fill", "#E8E1D0")
      .style("opacity", 0)
      .text((d) => `${d[yField as keyof PlacementDatum]}% · ₹${d[lpaField as keyof PlacementDatum]}L`)
      .transition()
      .delay(700)
      .duration(500)
      .style("opacity", 1);
  }, [view, accent, data, animated]);

  return (
    <section
      ref={sectionRef}
      id="autopsy"
      className="relative flex min-h-screen flex-col justify-center bg-ink px-6 py-24 md:px-10"
      aria-labelledby="autopsy-heading"
    >
      <div ref={wrapRef} className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-5">
          <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/70">
            Section E · Data autopsy · Scroll-driven
          </p>
          <h2 id="autopsy-heading" className="mt-4 font-display text-[clamp(2.5rem,7vw,7rem)] font-black uppercase leading-[0.88] tracking-[-0.03em] text-newsprint">
            Numbers <span className="italic text-truth">don&apos;t lie.</span> Brochures cite them anyway.
          </h2>
          <p className="mt-6 max-w-md font-serif text-lg text-newsprint">
            Keep scrolling. The chart begins with the brochure&apos;s claim. Halfway through, the verified figures replace it. The gap is the lie.
          </p>

          {/* Beat indicator — shows which view is active, replaces the
              old manual toggle pair with a single scroll-aware status. */}
          <div className="mt-8 flex items-center gap-3 font-mono text-meta uppercase tracking-[0.3em]">
            <span
              className={"transition-colors " + (view === "claimed" ? "text-newsprint" : "text-newsprint/40")}
            >
              ① What they said
            </span>
            <span className="inline-block h-px w-8" style={{ background: accent }} />
            <span
              className={"transition-colors " + (view === "verified" ? "text-truth" : "text-newsprint/40")}
            >
              ② What we found
            </span>
          </div>

          {/* Manual override remains as a click-fallback */}
          <div className="mt-4 inline-flex border border-newsprint/30 p-1">
            {(["claimed", "verified"] as const).map((v) => (
              <button
                key={v}
                onClick={() => { setView(v); setUserOverride(true); }}
                data-cursor="link"
                className={
                  "px-4 py-2 font-mono text-meta uppercase tracking-[0.2em] transition " +
                  (view === v
                    ? "bg-newsprint text-ink"
                    : "text-newsprint/70 hover:text-newsprint")
                }
              >
                {v === "claimed" ? "Force claimed" : "Force verified"}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 md:col-span-7">
          <svg ref={svgRef} className="w-full" role="img" aria-label="Placement claimed vs verified, 2021–2024" />
        </div>
      </div>
    </section>
  );
}
