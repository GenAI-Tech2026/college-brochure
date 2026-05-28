"use client";
import type { SceneProps } from "@/lib/cinematic/types";

/**
 * /submit "Save & return" pause beat. The filament dims to amber, gears
 * pause, the storm thickens slightly. Quiet, deliberate. Empathy.
 */
const AMBER_LO = "#7a4f1c";

export function BailScene({ width, height }: SceneProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#0a0d15] via-[#0b0e18] to-[#06080e]">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 55%, rgba(244,169,60,0.08), transparent 65%)`,
        }}
      />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        {/* dormant lamp — amber ember only */}
        <g transform={`translate(${width * 0.50}, ${height * 0.50})`}>
          <circle r={Math.min(width, height) * 0.18} fill="rgba(244,169,60,0.08)" />
          <circle r={Math.min(width, height) * 0.10} fill="none" stroke={`rgba(244,169,60,0.20)`} strokeWidth="0.6" />
          <circle r={Math.min(width, height) * 0.05} fill="none" stroke={`rgba(244,169,60,0.30)`} strokeWidth="0.5" />
          <circle r={Math.min(width, height) * 0.012} fill={AMBER_LO} opacity="0.75" />
        </g>
      </svg>
    </div>
  );
}
