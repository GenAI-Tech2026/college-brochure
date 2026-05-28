"use client";
import type { SceneProps } from "@/lib/cinematic/types";

/**
 * /submit Act 1 — THE DARK LIGHTHOUSE.
 *
 * Weather-beaten stone lighthouse on a cliff edge. Stormy night sea.
 * Lightning flickers distant. Lamp room is dark. Rain streaks across the
 * frame. Cold steel-blue near-monochrome. Beacon: OFFLINE.
 */
const STORM = "#0e131c";
const STORM_LO = "#070a10";

export function DarkLighthouseScene({ width, height }: SceneProps) {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${STORM_LO} 0%, ${STORM} 55%, #050709 100%)`,
      }}
    >
      {/* distant lightning — sporadic flash */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ animation: "storm-flash 7.4s ease-in-out infinite" }}
      />
      {/* rain streaks */}
      <div aria-hidden className="absolute inset-0" style={{ opacity: 0.55 }}>
        {Array.from({ length: 32 }).map((_, i) => {
          const left = ((i * 73) % 100) + "%";
          const delay = ((i * 13) % 100) / 100 + "s";
          const dur = 0.55 + ((i * 7) % 50) / 80;
          return (
            <span
              key={i}
              className="absolute top-[-20px] block w-px bg-newsprint"
              style={{
                left,
                height: "60px",
                opacity: 0.32,
                animation: `rain-fall ${dur}s linear ${delay} infinite`,
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
          <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a1018" />
            <stop offset="1" stopColor="#030608" />
          </linearGradient>
          <linearGradient id="cliffGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a1d22" />
            <stop offset="1" stopColor="#0a0c10" />
          </linearGradient>
          <linearGradient id="towerGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#222633" />
            <stop offset="0.5" stopColor="#2c3140" />
            <stop offset="1" stopColor="#161922" />
          </linearGradient>
        </defs>

        {/* horizon clouds (low contrast) */}
        <rect width={width} height={height * 0.45} fill="url(#oceanGrad)" opacity="0.4" />

        {/* sea + waves */}
        <rect x="0" y={height * 0.62} width={width} height={height * 0.40} fill="url(#oceanGrad)" />
        {Array.from({ length: 5 }).map((_, i) => {
          const y = height * (0.66 + i * 0.05);
          const offset = (i % 2) * 14;
          return (
            <path
              key={i}
              d={`M -10 ${y} Q ${width * 0.25 + offset} ${y - 6} ${width * 0.5} ${y} T ${width + 10} ${y}`}
              fill="none"
              stroke="#1a2030"
              strokeWidth={1 + i * 0.4}
              opacity={0.5 - i * 0.06}
            />
          );
        })}

        {/* cliff edge in foreground */}
        <path
          d={`M 0 ${height * 0.78}
              L ${width * 0.30} ${height * 0.72}
              L ${width * 0.46} ${height * 0.68}
              L ${width * 0.50} ${height * 0.64}
              L ${width * 0.58} ${height * 0.74}
              L ${width * 0.72} ${height * 0.76}
              L ${width} ${height * 0.82}
              L ${width} ${height}
              L 0 ${height} Z`}
          fill="url(#cliffGrad)"
        />

        {/* lighthouse tower (central, slightly left) */}
        <g transform={`translate(${width * 0.46}, ${height * 0.18})`}>
          {/* base step */}
          <rect
            x={-width * 0.030}
            y={height * 0.42}
            width={width * 0.060}
            height={height * 0.04}
            fill="#1a1d24"
          />
          {/* tapered body */}
          <polygon
            points={`${-width * 0.022},0 ${width * 0.022},0 ${width * 0.028},${height * 0.42} ${-width * 0.028},${height * 0.42}`}
            fill="url(#towerGrad)"
          />
          {/* tower stripe bands */}
          {[0.10, 0.18, 0.26, 0.34].map((y, i) => (
            <rect
              key={i}
              x={-width * 0.024}
              y={height * y}
              width={width * 0.048}
              height={height * 0.012}
              fill="#0a0c12"
              opacity="0.85"
            />
          ))}
          {/* gallery deck below the lamp room */}
          <rect
            x={-width * 0.026}
            y={-height * 0.018}
            width={width * 0.052}
            height={height * 0.016}
            fill="#0a0c12"
          />
          {/* lamp room — empty cylindrical glass, DARK */}
          <ellipse cx="0" cy={-height * 0.030} rx={width * 0.022} ry={height * 0.018} fill="#08090c" stroke="#1c2230" strokeWidth="1" />
          <rect x={-width * 0.020} y={-height * 0.048} width={width * 0.040} height={height * 0.018} fill="#0c1018" stroke="#1c2230" strokeWidth="0.8" />
          {/* dome cap */}
          <polygon
            points={`${-width * 0.018},${-height * 0.048} ${width * 0.018},${-height * 0.048} 0,${-height * 0.064}`}
            fill="#161a23"
          />
          {/* tiny weather vane */}
          <line x1="0" y1={-height * 0.064} x2="0" y2={-height * 0.078} stroke="#2a303e" strokeWidth="1" />
        </g>

        {/* faint horizon line */}
        <line x1="0" y1={height * 0.62} x2={width} y2={height * 0.62} stroke="#1a2030" strokeWidth="1" opacity="0.5" />
      </svg>

      <style jsx>{`
        @keyframes rain-fall {
          0%   { transform: translateY(-30px); }
          100% { transform: translateY(${height + 30}px); }
        }
        @keyframes storm-flash {
          0%, 90%, 100% { background: transparent; }
          92%           { background: rgba(180, 200, 230, 0.10); }
          94%           { background: transparent; }
          96%           { background: rgba(180, 200, 230, 0.06); }
        }
      `}</style>
    </div>
  );
}
