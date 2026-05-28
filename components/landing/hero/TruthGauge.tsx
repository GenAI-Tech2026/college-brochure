"use client";
import { useEffect, useState } from "react";

/**
 * Radial half-gauge. Hand-rolled SVG instead of Rive — keeps the bundle
 * lean (no extra .riv asset, no canvas) and we get crisp scaling on any
 * resolution.
 *
 * Needle angle math:
 *   The arc sweeps from -90° (left, "MARKETING FICTION") to +90° (right,
 *   "TRUTH"). The needle's angle for a 0–100 score is:
 *     angle = -90 + (score / 100) * 180
 *   For a score of 22, that's -90 + 39.6 = -50.4° — well into the red.
 *
 *   We add ±3° of oscillation via setInterval so the needle "looks for"
 *   the truth without ever finding it.
 */
export function TruthGauge({ score }: { score: number }) {
  const [wobble, setWobble] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        // ease-in-out wobble using sin of timestamp — feels organic
        setWobble(Math.sin(Date.now() / 700) * 3);
      }
    }, 80);
    return () => window.clearInterval(t);
  }, []);

  const angle = -90 + (score / 100) * 180 + wobble;

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1">
        <svg
          viewBox="0 0 200 120"
          className="absolute inset-0 h-full w-full"
          aria-label={`Institutional truth score: ${score}/100`}
        >
          {/* Background arc — split into red/amber/green zones */}
          {/* red zone: -90° to -30°  (score 0..33) */}
          <path
            d="M 20 100 A 80 80 0 0 1 60 31.7"
            stroke="rgb(255 67 50 / 0.55)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          {/* amber zone: -30° to +30° */}
          <path
            d="M 60 31.7 A 80 80 0 0 1 140 31.7"
            stroke="rgb(232 225 208 / 0.18)"
            strokeWidth="10"
            fill="none"
          />
          {/* green zone: +30° to +90° */}
          <path
            d="M 140 31.7 A 80 80 0 0 1 180 100"
            stroke="rgb(154 147 138 / 0.5)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />

          {/* tick marks — every 22.5° */}
          {Array.from({ length: 9 }, (_, i) => {
            const a = -90 + i * 22.5;
            const rad = (a * Math.PI) / 180;
            const x1 = 100 + Math.cos(rad) * 70;
            const y1 = 100 + Math.sin(rad) * 70;
            const x2 = 100 + Math.cos(rad) * 78;
            const y2 = 100 + Math.sin(rad) * 78;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgb(232 225 208 / 0.35)"
                strokeWidth="1"
              />
            );
          })}

          {/* needle */}
          <g
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: "100px 100px",
              transition: "transform 120ms linear",
            }}
          >
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="28"
              stroke="rgb(255 67 50)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="100" cy="100" r="6" fill="rgb(255 67 50)" />
            <circle cx="100" cy="100" r="2.5" fill="#15130F" />
          </g>

          {/* zone labels */}
          <text
            x="14"
            y="116"
            className="fill-newsprint/55 font-mono"
            style={{ fontSize: 7, letterSpacing: 1.2 }}
          >
            MARKETING FICTION
          </text>
          <text
            x="186"
            y="116"
            textAnchor="end"
            className="fill-newsprint/55 font-mono"
            style={{ fontSize: 7, letterSpacing: 1.2 }}
          >
            TRUTH
          </text>
        </svg>
      </div>
      <div className="mt-2">
        <div className="font-display text-3xl font-black text-newsprint [font-variant-numeric:tabular-nums]">
          {score}
          <span className="text-newsprint/40">/100</span>
        </div>
        <div className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-newsprint/55">
          industry avg · 1,847 colleges audited
        </div>
      </div>
    </div>
  );
}
