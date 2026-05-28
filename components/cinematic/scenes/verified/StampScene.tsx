"use client";
import type { SceneProps } from "@/lib/cinematic/types";

/**
 * /verified Act 4 — THE STAMP. Macro on the document. A brass stamp lifts
 * into frame from above, hangs in suspense, then SLAMS down leaving a
 * Verified Green wax seal: "✓ VERIFIED · CASE #4729". Particle burst on
 * impact. Document glows softly green afterward.
 */
const VERIFIED_GREEN = "#06D6A0";

export function StampScene({ progress, width, height }: SceneProps) {
  // Stamp choreography: 0..0.35 hangs in suspense; 0.35..0.50 slams down;
  // 0.50..0.65 sits; 0.65..1.0 lifts away leaving seal.
  let stampY: number;
  let stampScale: number;
  let sealAlpha = 0;
  let glowAlpha = 0;
  let particleAlpha = 0;
  if (progress < 0.35) {
    stampY = -height * 0.30 * (1 - progress / 0.35);
    stampScale = 1.0 + (1 - progress / 0.35) * 0.06;
  } else if (progress < 0.50) {
    const t = (progress - 0.35) / 0.15;
    stampY = 0 * (1 - t);
    stampScale = 1.0;
    sealAlpha = t;
    glowAlpha = Math.min(1, t * 1.5);
    particleAlpha = 1 - t;
  } else if (progress < 0.65) {
    stampY = 0;
    stampScale = 1.0;
    sealAlpha = 1;
    glowAlpha = 1;
  } else {
    stampY = -height * 0.30 * ((progress - 0.65) / 0.35);
    stampScale = 1.0;
    sealAlpha = 1;
    glowAlpha = 1;
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#06090f] via-[#0a0d13] to-[#040608]">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, rgba(240,190,120,0.25), transparent 70%)",
        }}
      />
      <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <radialGradient id="verifyGlow">
            <stop offset="0" stopColor={VERIFIED_GREEN} stopOpacity="0.6" />
            <stop offset="1" stopColor={VERIFIED_GREEN} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="paperC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f1ead4" />
            <stop offset="1" stopColor="#d8cdac" />
          </linearGradient>
        </defs>

        {/* document */}
        <g transform={`translate(${width * 0.20}, ${height * 0.18}) rotate(-1)`}>
          {/* glow halo */}
          <ellipse
            cx={width * 0.30}
            cy={height * 0.32}
            rx={width * 0.40}
            ry={height * 0.30}
            fill="url(#verifyGlow)"
            opacity={glowAlpha}
          />
          <rect width={width * 0.60} height={height * 0.62} fill="url(#paperC)" />
          {/* lines */}
          {Array.from({ length: 14 }).map((_, i) => (
            <rect
              key={i}
              x={width * 0.03}
              y={height * 0.06 + i * height * 0.034}
              width={width * (0.50 - (i % 3) * 0.04)}
              height={height * 0.010}
              fill="#0a0907"
              opacity={0.75}
            />
          ))}
          {/* verified seal */}
          <g
            transform={`translate(${width * 0.40}, ${height * 0.43}) rotate(-6)`}
            opacity={sealAlpha}
          >
            <circle r={Math.min(width, height) * 0.060} fill={VERIFIED_GREEN} opacity="0.18" />
            <circle r={Math.min(width, height) * 0.054} fill="none" stroke={VERIFIED_GREEN} strokeWidth="2.5" />
            <path
              d={`M ${-Math.min(width, height) * 0.022} 0 L ${-Math.min(width, height) * 0.005} ${Math.min(width, height) * 0.016} L ${Math.min(width, height) * 0.028} ${-Math.min(width, height) * 0.014}`}
              stroke={VERIFIED_GREEN}
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x={0}
              y={Math.min(width, height) * 0.080}
              textAnchor="middle"
              fontSize={Math.max(11, Math.min(width, height) * 0.022)}
              fontFamily="var(--font-mono)"
              fontWeight="700"
              fill={VERIFIED_GREEN}
              letterSpacing="2.2"
            >
              VERIFIED · CASE #4729
            </text>
          </g>
        </g>

        {/* the brass stamp body */}
        <g
          transform={`translate(${width * 0.50}, ${height * 0.18 + stampY}) scale(${stampScale})`}
        >
          {/* handle */}
          <ellipse cx="0" cy={-height * 0.10} rx={width * 0.022} ry={height * 0.014} fill="#3a2814" />
          <rect
            x={-width * 0.010}
            y={-height * 0.10}
            width={width * 0.020}
            height={height * 0.10}
            fill="#5a3e1c"
          />
          {/* base */}
          <rect
            x={-width * 0.055}
            y={0}
            width={width * 0.110}
            height={height * 0.030}
            fill="#3a2814"
            rx="2"
          />
        </g>

        {/* dust-particle burst on impact */}
        {particleAlpha > 0 ? (
          <g opacity={particleAlpha}>
            {Array.from({ length: 18 }).map((_, i) => {
              const angle = (i / 18) * Math.PI * 2;
              const r = width * 0.10 * (1 - particleAlpha + 0.2);
              const cx = width * 0.50 + Math.cos(angle) * r;
              const cy = height * 0.40 + Math.sin(angle) * r * 0.4;
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={1.5 + (i % 3) * 0.6}
                  fill="#e8e1d0"
                />
              );
            })}
          </g>
        ) : null}
      </svg>
    </div>
  );
}
