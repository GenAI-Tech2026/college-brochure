"use client";
import type { SceneProps } from "@/lib/cinematic/types";

/**
 * /verified Act 2 — THE EXAMINATION. The document is open on the desk.
 * A vintage brass magnifying glass sweeps across it; specific words on
 * the page LIGHT UP as the glass passes over them. The highlighted words
 * are real fragments from the type of submissions UNFILTERED examines.
 *
 * The glass's X position tracks `progress` linearly.
 */
const HIGHLIGHTED_WORDS = [
  "Placement Rate",
  "₹40,000",
  "Hostel Wi-Fi",
  "Faculty",
  "Internship Pipeline",
] as const;

export function ExaminationScene({ progress, width, height }: SceneProps) {
  const glassX = width * (0.16 + progress * 0.65);
  const glassY = height * 0.50;
  const glassR = Math.min(width, height) * 0.10;

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#06090f] via-[#0a0d13] to-[#040608]">
      {/* lamp pool */}
      <div
        aria-hidden
        className="absolute"
        style={{
          left: "12%",
          top: "20%",
          width: "80%",
          height: "80%",
          background:
            "radial-gradient(closest-side, rgba(240,190,120,0.32), rgba(180,130,60,0.10) 50%, transparent 80%)",
          filter: "blur(12px)",
        }}
      />

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="paperGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f1ead4" />
            <stop offset="1" stopColor="#dfd5b9" />
          </linearGradient>
          <radialGradient id="lensHL">
            <stop offset="0" stopColor="#FFE8B0" stopOpacity="0.85" />
            <stop offset="1" stopColor="#FFE8B0" stopOpacity="0" />
          </radialGradient>
          {/* clip for the highlight word strip */}
        </defs>

        {/* desk */}
        <rect width={width} height={height} fill="#080604" />
        {/* paper case-file */}
        <g transform={`translate(${width * 0.15}, ${height * 0.18}) rotate(-1.5)`}>
          <rect width={width * 0.70} height={height * 0.66} fill="url(#paperGrad)" />
          {/* paper rules / typed lines (every other one shorter) */}
          {Array.from({ length: 16 }).map((_, i) => {
            const y = height * 0.06 + i * (height * 0.034);
            const w = i % 3 === 0 ? width * 0.45 : i % 2 === 0 ? width * 0.50 : width * 0.40;
            return (
              <rect
                key={i}
                x={width * 0.03}
                y={y}
                width={w}
                height={height * 0.012}
                fill="#0a0907"
                opacity={0.75}
              />
            );
          })}
          {/* the headline */}
          <rect x={width * 0.03} y={height * 0.022} width={width * 0.40} height={height * 0.022} fill="#0a0907" />

          {/* the highlight-able words, positioned around the page */}
          {HIGHLIGHTED_WORDS.map((w, i) => {
            const x = (0.05 + (i % 3) * 0.21) * width;
            const y = (0.18 + Math.floor(i / 3) * 0.20 + (i % 2) * 0.10) * height;
            // glass-relative distance for highlight intensity
            const dx = (x + width * 0.05) - glassX;
            const dy = (y + height * 0.03) - glassY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const t = Math.max(0, 1 - dist / (glassR * 1.4));
            return (
              <g key={w} transform={`translate(${x}, ${y})`}>
                <rect
                  width={width * 0.16}
                  height={height * 0.030}
                  fill="#FFD86A"
                  opacity={t * 0.65}
                />
                <text
                  x={width * 0.005}
                  y={height * 0.022}
                  fill="#0a0907"
                  fontFamily="var(--font-mono)"
                  fontSize={Math.max(11, height * 0.018)}
                  fontWeight="700"
                >
                  {w}
                </text>
              </g>
            );
          })}
        </g>

        {/* magnifying glass */}
        <g transform={`translate(${glassX}, ${glassY})`}>
          {/* lens highlight (inside) */}
          <circle r={glassR - 4} fill="url(#lensHL)" />
          {/* lens glass */}
          <circle r={glassR} fill="rgba(180,200,220,0.10)" stroke="#8a6b3a" strokeWidth="4" />
          {/* brass rim */}
          <circle r={glassR + 5} fill="none" stroke="#3a2814" strokeWidth="1.2" />
          {/* handle */}
          <rect
            x={glassR + 3}
            y={-Math.min(width, height) * 0.010}
            width={Math.min(width, height) * 0.18}
            height={Math.min(width, height) * 0.020}
            fill="#3a2814"
            transform={`rotate(28, ${glassR + 3}, 0)`}
            rx={Math.min(width, height) * 0.010}
          />
        </g>
      </svg>
    </div>
  );
}
