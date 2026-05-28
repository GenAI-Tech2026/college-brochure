"use client";
import type { SceneProps } from "@/lib/cinematic/types";

/**
 * /submit Act 2 — THE MECHANISM AWAKENS.
 *
 * Camera pushes inside the lamp room. Brass gears begin turning. The
 * Fresnel crystal rotates slowly, refracting tiny shards of moonlight
 * across curved walls. Filament glows faintly amber — warming, not yet
 * ignited. Storm softens outside the windows.
 *
 * Pulse: a small filament throb in case a non-act-change step pulses.
 */
const AMBER_LO = "#7a4f1c";
const AMBER_MID = "#c47a2a";
const AMBER_HI = "#F4A93C";

export function MechanismScene({ width, height, pulse = 0 }: SceneProps) {
  const filamentAlpha = 0.55 + pulse * 0.35;

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#0b0e15] via-[#0d1119] to-[#070a11]">
      {/* outer windows show softened storm */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, rgba(244,169,60,0.10), transparent 60%)",
        }}
      />
      {/* light shards animated across the walls */}
      <div aria-hidden className="absolute inset-0 mix-blend-screen" style={{ opacity: 0.5 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className="absolute block bg-[#F4A93C]"
            style={{
              left: `${10 + i * 11}%`,
              top: "30%",
              width: "2px",
              height: "180%",
              transformOrigin: "top",
              transform: `rotate(${-22 + i * 5}deg)`,
              opacity: 0.18,
              animation: `shard-sweep 6s ease-in-out ${i * 0.4}s infinite`,
            }}
          />
        ))}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <radialGradient id="lampGlow">
            <stop offset="0" stopColor={AMBER_HI} stopOpacity={filamentAlpha} />
            <stop offset="0.4" stopColor={AMBER_MID} stopOpacity={filamentAlpha * 0.45} />
            <stop offset="1" stopColor={AMBER_LO} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="brassGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5c3e1a" />
            <stop offset="0.5" stopColor="#a07232" />
            <stop offset="1" stopColor="#4a2f10" />
          </linearGradient>
        </defs>

        {/* curved lamp-room walls (faint suggestion) */}
        <path
          d={`M 0 ${height * 0.20}
              Q ${width * 0.5} ${height * 0.04} ${width} ${height * 0.20}
              L ${width} ${height * 0.80}
              Q ${width * 0.5} ${height * 0.96} 0 ${height * 0.80} Z`}
          fill="#0e1218"
          opacity="0.6"
        />

        {/* central Fresnel lens — concentric rings */}
        <g transform={`translate(${width * 0.50}, ${height * 0.50})`}>
          {/* glow halo */}
          <circle r={Math.min(width, height) * 0.28} fill="url(#lampGlow)" />

          {/* outermost ring */}
          {[0.22, 0.18, 0.14, 0.10].map((r, i) => (
            <g key={i}>
              <circle
                r={Math.min(width, height) * r}
                fill="none"
                stroke={`rgba(244,169,60,${0.20 + i * 0.05})`}
                strokeWidth="0.9"
              />
              <circle
                r={Math.min(width, height) * r}
                fill="none"
                stroke="rgba(160,114,50,0.45)"
                strokeWidth="0.4"
                strokeDasharray="4 6"
              />
            </g>
          ))}

          {/* spinning prism frame */}
          <g
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              animation: "lens-spin 12s linear infinite",
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const x1 = Math.cos(angle) * Math.min(width, height) * 0.06;
              const y1 = Math.sin(angle) * Math.min(width, height) * 0.06;
              const x2 = Math.cos(angle) * Math.min(width, height) * 0.22;
              const y2 = Math.sin(angle) * Math.min(width, height) * 0.22;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(244,169,60,0.30)"
                  strokeWidth="0.5"
                />
              );
            })}
          </g>

          {/* central filament — faint amber */}
          <circle r={Math.min(width, height) * 0.020} fill={AMBER_MID} opacity={filamentAlpha}>
            <animate
              attributeName="opacity"
              values={`${filamentAlpha};${filamentAlpha * 1.15};${filamentAlpha}`}
              dur="3.8s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r={Math.min(width, height) * 0.008} fill="#FFE0A8" opacity={filamentAlpha} />
        </g>

        {/* brass clockwork gear — visible bottom-left, slowly rotating */}
        <g transform={`translate(${width * 0.12}, ${height * 0.78})`}>
          <g
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              animation: "gear-spin 16s linear infinite",
            }}
          >
            <GearTeeth radius={Math.min(width, height) * 0.07} teeth={14} />
          </g>
        </g>
        {/* a second smaller engaged gear */}
        <g transform={`translate(${width * 0.20}, ${height * 0.86})`}>
          <g
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              animation: "gear-spin-reverse 11s linear infinite",
            }}
          >
            <GearTeeth radius={Math.min(width, height) * 0.045} teeth={10} />
          </g>
        </g>
      </svg>

      <style jsx>{`
        @keyframes lens-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes gear-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes gear-spin-reverse {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes shard-sweep {
          0%, 100% { transform: rotate(-22deg) translateX(0); opacity: 0.18; }
          50%      { transform: rotate(2deg)  translateX(30px); opacity: 0.30; }
        }
      `}</style>
    </div>
  );
}

function GearTeeth({ radius, teeth }: { radius: number; teeth: number }) {
  const inner = radius * 0.78;
  const tooth = radius * 0.22;
  const pts: string[] = [];
  const seg = (Math.PI * 2) / (teeth * 2);
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 === 0 ? radius : radius - tooth;
    const a = i * seg;
    pts.push(`${Math.cos(a) * r},${Math.sin(a) * r}`);
  }
  return (
    <g>
      <polygon points={pts.join(" ")} fill="url(#brassGrad)" stroke="#2a1c0a" strokeWidth="0.6" />
      <circle r={inner * 0.55} fill="none" stroke="#5c3e1a" strokeWidth="1.2" />
      <circle r={inner * 0.20} fill="#2a1c0a" />
      {/* spokes */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2;
        return (
          <line
            key={i}
            x1={0}
            y1={0}
            x2={Math.cos(a) * inner * 0.55}
            y2={Math.sin(a) * inner * 0.55}
            stroke="#3a280f"
            strokeWidth="1"
          />
        );
      })}
    </g>
  );
}
