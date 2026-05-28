"use client";
import type { SceneProps } from "@/lib/cinematic/types";

/**
 * /submit Act 3 — THE FILAMENT IGNITES.
 *
 * Tight on the lamp. Filament intensifies into brilliant white-gold.
 * Sharp geometric refractions through the Fresnel. Mechanism fully
 * rotating. Storm has retreated; the lighthouse glows from within but
 * the beam has NOT yet emerged. Pressure builds.
 *
 * Pulse: the filament throbs brighter for 800ms — used by steps 4, 5, 6
 * (receipts logged, identity encrypted, ready to transmit).
 */
const AMBER_HI = "#F4A93C";

export function FilamentScene({ width, height, pulse = 0 }: SceneProps) {
  const baseAlpha = 0.95;
  const filamentAlpha = Math.min(1, baseAlpha + pulse * 0.4);
  const haloScale = 1 + pulse * 0.18;

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#08090e] via-[#0a0c12] to-[#04050a]">
      {/* huge radial glow from center */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(244,169,60,${0.32 + pulse * 0.20}), rgba(244,169,60,${0.10 + pulse * 0.06}) 35%, transparent 70%)`,
          transform: `scale(${haloScale})`,
          transition: "transform 320ms ease-out",
        }}
      />
      {/* sharp light rays */}
      <div aria-hidden className="absolute inset-0 mix-blend-screen">
        {Array.from({ length: 18 }).map((_, i) => {
          const angle = (i / 18) * 360;
          return (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 block bg-[#F4A93C]"
              style={{
                width: "1px",
                height: "200vh",
                transformOrigin: "top",
                transform: `translate(-50%, 0) rotate(${angle}deg)`,
                opacity: 0.10 + (i % 3) * 0.04 + pulse * 0.12,
                animation: `ray-shimmer ${5 + (i % 4)}s ease-in-out infinite`,
              }}
            />
          );
        })}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <radialGradient id="bulbCore">
            <stop offset="0"   stopColor="#FFF4D8" stopOpacity={filamentAlpha} />
            <stop offset="0.3" stopColor="#FFD89A" stopOpacity={filamentAlpha} />
            <stop offset="0.7" stopColor={AMBER_HI} stopOpacity={filamentAlpha * 0.75} />
            <stop offset="1"   stopColor="#7a4f1c" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Fresnel rings — geometric refraction */}
        <g transform={`translate(${width * 0.50}, ${height * 0.50})`}>
          {[0.38, 0.32, 0.27, 0.22, 0.17, 0.13, 0.10, 0.075].map((r, i) => (
            <circle
              key={i}
              r={Math.min(width, height) * r}
              fill="none"
              stroke={`rgba(244,169,60,${0.18 + i * 0.04 + pulse * 0.04})`}
              strokeWidth={0.8 - i * 0.05}
            />
          ))}

          {/* angled refraction lines (12 spokes) */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={Math.cos(angle) * Math.min(width, height) * 0.06}
                y1={Math.sin(angle) * Math.min(width, height) * 0.06}
                x2={Math.cos(angle) * Math.min(width, height) * 0.40}
                y2={Math.sin(angle) * Math.min(width, height) * 0.40}
                stroke={`rgba(255,212,160,${0.18 + pulse * 0.20})`}
                strokeWidth="0.8"
              />
            );
          })}

          {/* THE BULB — core */}
          <circle r={Math.min(width, height) * 0.085} fill="url(#bulbCore)" />
          {/* filament wire shape */}
          <path
            d={`M ${-Math.min(width, height) * 0.025} 0
                C ${-Math.min(width, height) * 0.018} ${-Math.min(width, height) * 0.014},
                  ${Math.min(width, height) * 0.018} ${Math.min(width, height) * 0.014},
                  ${Math.min(width, height) * 0.025} 0`}
            fill="none"
            stroke="#FFF8E0"
            strokeWidth="2"
            opacity={filamentAlpha}
          />
          <circle r={Math.min(width, height) * 0.012} fill="#FFF8E0" opacity={filamentAlpha}>
            <animate
              attributeName="r"
              values={`${Math.min(width, height) * 0.012};${Math.min(width, height) * 0.015};${Math.min(width, height) * 0.012}`}
              dur="2.4s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* HINT of the tower exterior — vignetted edges */}
        <rect width={width} height={height} fill="url(#vignette3)" />
        <defs>
          <radialGradient id="vignette3" cx="0.5" cy="0.5" r="0.7">
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1"    stopColor="#000" stopOpacity="0.55" />
          </radialGradient>
        </defs>
      </svg>

      <style jsx>{`
        @keyframes ray-shimmer {
          0%, 100% { opacity: 0.10; }
          50%      { opacity: 0.22; }
        }
      `}</style>
    </div>
  );
}
