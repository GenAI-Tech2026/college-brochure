"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { liveStats } from "@/lib/mock-data/home-stats";

/**
 * SECTION 1 — "THE GAP"
 *
 * D3 slope chart. Every metric is a single line connecting its "Promised"
 * value (left axis) to its "Real" value (right axis). Lines that drop a
 * lot turn Truth Red and thicken — the chart is its own headline.
 *
 * Math:
 *   - We normalise both promised & real onto a shared y-axis [0, 100].
 *     The brochure numbers in the mock data are already on this scale.
 *   - Slope severity is `(promised - real) / promised`. We classify:
 *       drop > 0.40  → Truth Red, 3px stroke
 *       drop > 0.20  → newsprint/85, 2px
 *       else         → newsprint/45, 1.5px (a "matches" line)
 *   - Line entry: stroke-dasharray = total length, dashoffset animates
 *     0..length when the section enters the viewport (IntersectionObserver).
 *     The classic "draw" trick — no GSAP plugin needed.
 *
 * Why a slope chart and not a bar chart? Slope charts are unique in showing
 * relational change — every line literally goes downhill. The visceral
 * "everything is dropping" pattern is the argument.
 *
 * This file used to host the prose "Manifesto" block. The full text now
 * lives at /manifesto, where it belongs.
 */
export function Manifesto() {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const wrap = wrapRef.current;
    if (!svg || !wrap) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const W = 1000;
    const H = 480;
    const PAD = { top: 40, bottom: 40, left: 220, right: 220 };
    const innerW = W - PAD.left - PAD.right;

    const data = liveStats.slopeMetrics;

    const y = d3.scaleLinear().domain([0, 100]).range([H - PAD.bottom, PAD.top]);

    const root = d3.select(svg);
    root.selectAll("*").remove();
    root.attr("viewBox", `0 0 ${W} ${H}`);

    // axis labels — left & right
    root
      .append("text")
      .attr("x", PAD.left - 20)
      .attr("y", PAD.top - 16)
      .attr("text-anchor", "end")
      .attr("class", "fill-newsprint/60")
      .style("font-family", "var(--font-mono)")
      .style("font-size", "11px")
      .style("letter-spacing", "0.2em")
      .text("WHAT BROCHURES PROMISE");

    root
      .append("text")
      .attr("x", W - PAD.right + 20)
      .attr("y", PAD.top - 16)
      .attr("text-anchor", "start")
      .attr("class", "fill-truth")
      .style("font-family", "var(--font-mono)")
      .style("font-size", "11px")
      .style("letter-spacing", "0.2em")
      .text("WHAT STUDENTS REPORT");

    // axis hairlines
    root
      .append("line")
      .attr("x1", PAD.left)
      .attr("x2", PAD.left)
      .attr("y1", PAD.top)
      .attr("y2", H - PAD.bottom)
      .attr("stroke", "rgb(232 225 208 / 0.35)")
      .attr("stroke-width", 1);
    root
      .append("line")
      .attr("x1", W - PAD.right)
      .attr("x2", W - PAD.right)
      .attr("y1", PAD.top)
      .attr("y2", H - PAD.bottom)
      .attr("stroke", "rgb(232 225 208 / 0.35)")
      .attr("stroke-width", 1);

    const lines: { path: SVGPathElement; len: number }[] = [];

    // Precompute per-metric geometry once. The slope chart's chronic problem is
    // that several metrics share a near-identical promised/real value and their
    // labels collide. We solve it with a one-pass push-down resolver: sort by
    // ideal Y, then walk the list ensuring each label is at least MIN_GAP below
    // the previous one. The dot + line endpoints stay at the true data Y; only
    // the label moves, with a thin tick connecting it to its dot if displaced.
    const MIN_GAP = 30;
    const metricRows = data.map((d) => {
      const yL = y(d.promised);
      const yR = y(d.real);
      const drop = (d.promised - d.real) / d.promised;
      const severe = drop > 0.4;
      const moderate = drop > 0.2;
      return {
        d,
        yL,
        yR,
        drop,
        severe,
        moderate,
        color: severe
          ? "rgb(255 67 50)"
          : moderate
          ? "rgb(232 225 208 / 0.85)"
          : "rgb(232 225 208 / 0.4)",
        strokeW: severe ? 3 : moderate ? 2 : 1.5,
      };
    });

    function resolve(values: number[], minGap: number): number[] {
      // Sort indices by ideal y, push each to be >= prev + minGap.
      const idx = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
      const placed: number[] = new Array(values.length);
      let prev = -Infinity;
      for (const { v, i } of idx) {
        const y = Math.max(v, prev + minGap);
        placed[i] = y;
        prev = y;
      }
      return placed;
    }

    const labelYL = resolve(metricRows.map((r) => r.yL), MIN_GAP);
    const labelYR = resolve(metricRows.map((r) => r.yR), MIN_GAP);

    metricRows.forEach((r, i) => {
      const lyL = labelYL[i];
      const lyR = labelYR[i];

      // left label (+ connector tick if pushed off-axis)
      if (Math.abs(lyL - r.yL) > 1) {
        root
          .append("line")
          .attr("x1", PAD.left)
          .attr("x2", PAD.left - 8)
          .attr("y1", r.yL)
          .attr("y2", lyL - 4)
          .attr("stroke", "rgb(232 225 208 / 0.25)")
          .attr("stroke-width", 1);
      }
      root
        .append("text")
        .attr("x", PAD.left - 14)
        .attr("y", lyL - 4)
        .attr("text-anchor", "end")
        .attr("class", "fill-newsprint/85")
        .style("font-family", "var(--font-sans)")
        .style("font-size", "14px")
        .text(`${r.d.metric}`);
      root
        .append("text")
        .attr("x", PAD.left - 14)
        .attr("y", lyL + 12)
        .attr("text-anchor", "end")
        .attr("class", "fill-newsprint/45")
        .style("font-family", "var(--font-mono)")
        .style("font-size", "10px")
        .style("letter-spacing", "0.18em")
        .text(`${r.d.promised}`);

      // right label (+ connector tick if displaced)
      if (Math.abs(lyR - r.yR) > 1) {
        root
          .append("line")
          .attr("x1", W - PAD.right)
          .attr("x2", W - PAD.right + 8)
          .attr("y1", r.yR)
          .attr("y2", lyR - 4)
          .attr("stroke", "rgb(232 225 208 / 0.25)")
          .attr("stroke-width", 1);
      }
      root
        .append("text")
        .attr("x", W - PAD.right + 14)
        .attr("y", lyR - 4)
        .attr("text-anchor", "start")
        .attr("class", r.severe ? "fill-truth" : "fill-newsprint/85")
        .style("font-family", "var(--font-sans)")
        .style("font-size", "14px")
        .text(`${r.d.metric}`);
      root
        .append("text")
        .attr("x", W - PAD.right + 14)
        .attr("y", lyR + 12)
        .attr("text-anchor", "start")
        .attr("class", r.severe ? "fill-truth" : "fill-newsprint/45")
        .style("font-family", "var(--font-mono)")
        .style("font-size", "10px")
        .style("letter-spacing", "0.18em")
        .text(`${r.d.real}  ·  Δ -${Math.round(r.drop * 100)}%`);

      // dots at the true data positions (not the displaced label positions)
      root.append("circle").attr("cx", PAD.left).attr("cy", r.yL).attr("r", 3.5).attr("fill", r.color);
      root
        .append("circle")
        .attr("cx", W - PAD.right)
        .attr("cy", r.yR)
        .attr("r", 3.5)
        .attr("fill", r.color);

      // the slope line itself
      const pathStr = `M ${PAD.left} ${r.yL} L ${W - PAD.right} ${r.yR}`;
      const path = root
        .append("path")
        .attr("d", pathStr)
        .attr("stroke", r.color)
        .attr("stroke-width", r.strokeW)
        .attr("fill", "none")
        .attr("stroke-linecap", "round")
        .node() as SVGPathElement;

      const len = path.getTotalLength();
      lines.push({ path, len });
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = reduced ? "0" : `${len}`;
      void i;
    });

    if (reduced) return;
    // Animate in when the wrapper enters viewport.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        lines.forEach((l, i) => {
          l.path.animate(
            [{ strokeDashoffset: l.len }, { strokeDashoffset: 0 }],
            {
              duration: 1400,
              delay: i * 150,
              easing: "cubic-bezier(0.16,1,0.3,1)",
              fill: "forwards",
            },
          );
        });
        io.disconnect();
      },
      { threshold: 0.3 },
    );
    io.observe(wrap);
    return () => io.disconnect();
  }, []);

  return (
    <section id="gap" className="relative bg-ink px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 grid grid-cols-12 items-end gap-6">
          <div className="col-span-12 md:col-span-8">
            <p className="mb-3 inline-flex items-center gap-3 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
              <span className="inline-block h-px w-8 bg-truth" />
              SECTION · 04 · THE GAP
            </p>
            <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-newsprint md:text-6xl">
              The gap between what they say{" "}
              <em className="font-display italic text-truth">and what is.</em>
            </h2>
          </div>
          <div className="col-span-12 md:col-span-4">
            <p className="font-mono text-sm text-newsprint/65">
              Audit of <span className="text-newsprint">1,847</span> college brochures,
              cross-referenced against{" "}
              <span className="text-newsprint">247,891</span> verified student reviews.
            </p>
          </div>
        </header>

        <div ref={wrapRef} className="relative">
          <svg
            ref={svgRef}
            className="w-full"
            aria-label="Slope chart: brochure promises vs verified reality"
          />
        </div>
      </div>
    </section>
  );
}
