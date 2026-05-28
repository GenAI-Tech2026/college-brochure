"use client";
import type { SceneProps } from "@/lib/cinematic/types";

/**
 * /verified Act 1 — THE SUBMISSION. Macro close-up of a wax-sealed
 * envelope sliding across a dark wooden desk into frame. Gloved hand
 * enters and picks it up. Cool steel-blue undertones with a single
 * tungsten pool of light.
 *
 * `progress` controls the slide-in and the gloved-hand reach.
 */
export function EnvelopeScene({ progress, width, height }: SceneProps) {
  const slideX = (1 - progress) * width * 0.6; // envelope slides in from right
  const handY = Math.max(0, 1 - progress * 1.4) * height * 0.6;

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#06090f] via-[#0a0d13] to-[#040608]">
      {/* tungsten desk lamp pool */}
      <div
        aria-hidden
        className="absolute"
        style={{
          left: "30%",
          top: "32%",
          width: "55%",
          height: "55%",
          background:
            "radial-gradient(closest-side, rgba(240,190,120,0.30), rgba(180,130,60,0.10) 50%, transparent 80%)",
          filter: "blur(14px)",
        }}
      />
      {/* dust motes */}
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute rounded-full bg-newsprint"
          style={{
            left: `${(i * 41) % 100}%`,
            top: `${(i * 23) % 90 + 8}%`,
            width: `${(i % 3) + 1}px`,
            height: `${(i % 3) + 1}px`,
            opacity: 0.1 + ((i * 7) % 30) / 100,
            animation: `dust-float ${4 + (i % 4)}s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        {/* dark wooden desk — wood-grain via stripes */}
        <defs>
          <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0c0a08" />
            <stop offset="1" stopColor="#050403" />
          </linearGradient>
          <radialGradient id="wax">
            <stop offset="0" stopColor="#ff5a45" />
            <stop offset="1" stopColor="#a01e10" />
          </radialGradient>
        </defs>
        <rect width={width} height={height} fill="url(#wood)" />
        {/* wood grain stripes */}
        {Array.from({ length: 14 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1={(i + 0.5) * (height / 14)}
            x2={width}
            y2={(i + 0.5) * (height / 14) + (i % 2 ? 4 : -4)}
            stroke="#1a140e"
            strokeWidth="0.5"
            opacity="0.55"
          />
        ))}

        {/* envelope sliding in */}
        <g transform={`translate(${width * 0.18 + slideX}, ${height * 0.48}) rotate(-3)`}>
          <rect
            width={width * 0.42}
            height={height * 0.26}
            fill="#e2d8c2"
            stroke="#0a0907"
            strokeWidth="0.5"
          />
          {/* envelope flap */}
          <polygon
            points={`0,0 ${width * 0.42},0 ${width * 0.21},${height * 0.12}`}
            fill="#d4c8aa"
            stroke="#0a0907"
            strokeWidth="0.5"
          />
          {/* wax seal */}
          <circle
            cx={width * 0.21}
            cy={height * 0.12}
            r={width * 0.025}
            fill="url(#wax)"
            stroke="#3a1208"
            strokeWidth="0.8"
          />
          <text
            x={width * 0.21}
            y={height * 0.128}
            textAnchor="middle"
            fontSize={width * 0.020}
            fontWeight="900"
            fill="#3a0c08"
            opacity="0.85"
          >
            UF
          </text>
        </g>

        {/* gloved hand reaching from top — only fingers visible */}
        <g
          transform={`translate(${width * 0.55}, ${height * 0.0 + handY}) rotate(15)`}
          opacity={Math.min(1, progress * 2)}
        >
          <path
            d={`M 0 0 L ${width * 0.05} 0 L ${width * 0.06} ${height * 0.30} L ${-width * 0.01} ${height * 0.30} Z`}
            fill="#0c0a08"
            stroke="#1a140e"
            strokeWidth="0.6"
          />
          {/* fingers */}
          <ellipse cx={width * 0.005} cy={height * 0.30} rx={width * 0.012} ry={height * 0.038} fill="#0c0a08" />
          <ellipse cx={width * 0.025} cy={height * 0.32} rx={width * 0.012} ry={height * 0.040} fill="#0c0a08" />
          <ellipse cx={width * 0.045} cy={height * 0.30} rx={width * 0.012} ry={height * 0.038} fill="#0c0a08" />
        </g>
      </svg>

      <style jsx>{`
        @keyframes dust-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
