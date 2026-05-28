"use client";
import { useMemo } from "react";
import type { SceneProps } from "@/lib/cinematic/types";

/**
 * /verified Act 5 — THE ARCHIVE. The verified document floats upward and
 * joins a vast luminous wall of thousands of other verified documents,
 * each softly glowing green, arranged in an elegant grid extending
 * upward and outward into the distance.
 *
 * Rendered as a perspective-warped grid of glowing rectangles whose Y
 * positions scroll upward as `progress` advances.
 */
const VERIFIED_GREEN = "#06D6A0";

export function ArchiveScene({ progress, width, height }: SceneProps) {
  // Stable grid layout (seeded)
  const rows = useMemo(() => {
    const out: { x: number; y: number; w: number; h: number; opacity: number }[] = [];
    const cols = 9;
    const rowCount = 22;
    let seed = 17;
    const next = () => {
      seed = (seed * 1664525 + 1013904223) | 0;
      return ((seed >>> 0) % 1000) / 1000;
    };
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < cols; c++) {
        const jitter = next() * 0.4 - 0.2;
        const skip = next();
        if (skip < 0.10) continue;
        out.push({
          x: c + jitter * 0.3,
          y: r,
          w: 0.8 + next() * 0.05,
          h: 1.0 + next() * 0.05,
          opacity: 0.5 + next() * 0.5,
        });
      }
    }
    return out;
  }, []);

  // Camera rises through the grid as progress climbs
  const scrollY = progress * 14;

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#020404] via-[#03070a] to-[#030606]">
      {/* glow base */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, rgba(6,214,160,0.10), transparent 70%)",
        }}
      />

      <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <radialGradient id="docGlow">
            <stop offset="0" stopColor={VERIFIED_GREEN} stopOpacity="0.85" />
            <stop offset="1" stopColor={VERIFIED_GREEN} stopOpacity="0.05" />
          </radialGradient>
          <linearGradient id="vignetteV" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity="0.8" />
            <stop offset="0.5" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {rows.map((cell, i) => {
          const cellW = (width * 0.85) / 9;
          const cellH = height * 0.16;
          const x = width * 0.075 + cell.x * cellW;
          // perspective: rows further away (high y - scrollY) are smaller + paler
          const distance = cell.y - scrollY;
          if (distance < -1 || distance > 22) return null;
          const ySlot = distance * cellH * 0.6 + height * 0.5 - cellH;
          const perspective = Math.max(0.25, 1 - distance * 0.05);
          const w = cellW * cell.w * perspective;
          const h = cellH * cell.h * perspective;
          const cx = x + (cellW - w) / 2;
          const alpha = cell.opacity * Math.max(0, 1 - distance * 0.04);
          return (
            <g key={i} opacity={alpha}>
              {/* glow */}
              <ellipse
                cx={cx + w / 2}
                cy={ySlot + h / 2}
                rx={w * 0.65}
                ry={h * 0.55}
                fill="url(#docGlow)"
              />
              {/* the document */}
              <rect
                x={cx}
                y={ySlot}
                width={w}
                height={h}
                fill="#0e1814"
                stroke={VERIFIED_GREEN}
                strokeWidth="0.6"
                opacity="0.85"
              />
              {/* hint of typography */}
              <rect
                x={cx + w * 0.10}
                y={ySlot + h * 0.18}
                width={w * 0.6}
                height={h * 0.04}
                fill={VERIFIED_GREEN}
                opacity="0.45"
              />
              <rect
                x={cx + w * 0.10}
                y={ySlot + h * 0.30}
                width={w * 0.5}
                height={h * 0.03}
                fill={VERIFIED_GREEN}
                opacity="0.30"
              />
              <rect
                x={cx + w * 0.10}
                y={ySlot + h * 0.38}
                width={w * 0.4}
                height={h * 0.03}
                fill={VERIFIED_GREEN}
                opacity="0.25"
              />
              {/* check seal */}
              <circle
                cx={cx + w * 0.78}
                cy={ySlot + h * 0.74}
                r={Math.min(w, h) * 0.08}
                fill="none"
                stroke={VERIFIED_GREEN}
                strokeWidth="0.8"
              />
            </g>
          );
        })}

        {/* edge vignette */}
        <rect width={width} height={height} fill="url(#vignetteV)" />
      </svg>
    </div>
  );
}
