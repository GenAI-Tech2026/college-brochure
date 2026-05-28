"use client";
import type { SceneProps } from "@/lib/cinematic/types";

/**
 * /verified Act 3 — CROSS-REFERENCING. Wide shot of a forensic corkboard
 * with three filed documents pinned alongside the original submission.
 * A red string animates across, connecting them — detective noir.
 *
 * `progress` drives string draw progress (0..1).
 */
export function CorkboardScene({ progress, width, height }: SceneProps) {
  // Anchor points (in viewport coords) for the four documents on the board
  const pts: { id: string; cx: number; cy: number; label: string }[] = [
    { id: "submission", cx: width * 0.28, cy: height * 0.40, label: "Submission" },
    { id: "ministry",   cx: width * 0.70, cy: height * 0.28, label: "Ministry of education archives" },
    { id: "placement",  cx: width * 0.78, cy: height * 0.58, label: "Placement records 2020-2025" },
    { id: "testimony",  cx: width * 0.52, cy: height * 0.74, label: "Student testimony database" },
  ];
  const corners = pts.slice(1);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#0a0c12] via-[#0a0a0e] to-[#06070a]">
      {/* cool steel-blue ambient */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(80,110,160,0.10), transparent 60%)",
        }}
      />

      <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {/* corkboard backing */}
        <defs>
          <pattern id="cork" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#3a2c1c" />
            <circle cx="1" cy="1" r="0.4" fill="#241a10" />
            <circle cx="4" cy="2" r="0.5" fill="#1f1610" />
            <circle cx="2" cy="4" r="0.3" fill="#2a1f14" />
            <circle cx="5" cy="5" r="0.4" fill="#211810" />
          </pattern>
        </defs>
        <rect x={width * 0.05} y={height * 0.08} width={width * 0.90} height={height * 0.84} fill="url(#cork)" stroke="#0a0907" strokeWidth="3" opacity="0.85" />

        {/* documents pinned */}
        {pts.map((p, i) => (
          <g key={p.id} transform={`translate(${p.cx}, ${p.cy}) rotate(${(i - 1.5) * 4})`}>
            <rect
              x={-width * 0.075}
              y={-height * 0.060}
              width={width * 0.15}
              height={height * 0.12}
              fill={i === 0 ? "#FFEBC8" : "#f1ead4"}
              stroke="#0a0907"
              strokeWidth="0.4"
            />
            {/* document content lines */}
            {Array.from({ length: 6 }).map((_, j) => (
              <rect
                key={j}
                x={-width * 0.065}
                y={-height * 0.050 + j * height * 0.014}
                width={width * (0.10 - (j % 3) * 0.015)}
                height={height * 0.006}
                fill="#0a0907"
                opacity={j === 0 ? 0.85 : 0.55}
              />
            ))}
            {/* pin */}
            <circle cx={0} cy={-height * 0.055} r="5" fill="#FF4332" />
            <circle cx={0} cy={-height * 0.055} r="2" fill="#3a0c08" />
            {/* label below */}
            <text
              x={0}
              y={height * 0.075}
              textAnchor="middle"
              fontSize={Math.max(9, height * 0.014)}
              fontFamily="var(--font-mono)"
              fill="#e8e1d0"
              opacity="0.85"
              letterSpacing="1.2"
            >
              {p.label.toUpperCase()}
            </text>
          </g>
        ))}

        {/* the red string connecting submission → each corroborating source */}
        {corners.map((c, i) => {
          const stagger = i / corners.length;
          const localProgress = Math.max(0, Math.min(1, (progress - stagger * 0.25) * 1.5));
          // path length-ish animation via stroke-dasharray
          const dx = c.cx - pts[0].cx;
          const dy = c.cy - pts[0].cy;
          const len = Math.sqrt(dx * dx + dy * dy);
          const offset = (1 - localProgress) * len;
          return (
            <line
              key={c.id}
              x1={pts[0].cx}
              y1={pts[0].cy}
              x2={c.cx}
              y2={c.cy}
              stroke="#FF4332"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeDasharray={len}
              strokeDashoffset={offset}
              opacity={0.92}
            />
          );
        })}
      </svg>
    </div>
  );
}
