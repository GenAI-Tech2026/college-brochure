"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SceneProps } from "@/lib/cinematic/types";

/**
 * /submit Act 5 — THE VAULT.
 *
 * Cathedral-scale underground chamber. Thousands of glowing testimonies
 * embedded into the walls. The camera follows a beam of warm gold to an
 * empty illuminated pedestal at the center; the light condenses into a
 * single rotating radiant document; when it lands on the pedestal it
 * pulses outward and every other testimony in the vault pulses in
 * response. Camera pulls back revealing infinite scale.
 *
 * Own RAF: this scene runs forever once mounted; the user dwells here
 * until they click "Read the Archive" or "Submit another".
 */
const GOLD = "#F4A93C";
const PALE_GOLD = "#FFE6B0";

export function VaultScene({ width, height }: SceneProps) {
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [t, setT] = useState(0); // 0..∞ seconds since mount

  useEffect(() => {
    const tick = (now: number) => {
      if (startRef.current == null) startRef.current = now;
      setT((now - startRef.current) / 1000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Stable seeded grid of testimonies
  const testimonies = useMemo(() => {
    let s = 503;
    const next = () => {
      s = (s * 1664525 + 1013904223) | 0;
      return ((s >>> 0) % 1000) / 1000;
    };
    const cells: { x: number; y: number; w: number; h: number; phase: number }[] = [];
    const cols = 11;
    const rows = 14;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dropout = next();
        if (dropout < 0.12) continue;
        cells.push({
          x: c + (next() - 0.5) * 0.3,
          y: r + (next() - 0.5) * 0.2,
          w: 0.85 + next() * 0.15,
          h: 1.10 + next() * 0.15,
          phase: next() * Math.PI * 2,
        });
      }
    }
    return cells;
  }, []);

  // Camera pull-back over the first 4 seconds
  const pull = Math.min(1, t / 4);
  const vaultScale = 1.0 + pull * 0.35;

  // The user's testimony "arrives" at t=1.5 and pulses outward at t=2.0
  const arrival = Math.max(0, Math.min(1, (t - 1.5) / 0.6));
  const landing = Math.max(0, Math.min(1, (t - 2.0) / 0.4));
  // Sympathy ripple — every other testimony pulses when the user's lands
  const ripple = Math.max(0, Math.min(1, (t - 2.4) / 1.2));

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#020306]">
      {/* deep cathedral indigo gradient */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, rgba(244,169,60,0.10), transparent 60%), radial-gradient(ellipse at 50% 70%, rgba(40,30,90,0.25), transparent 70%)",
        }}
      />
      {/* slow ambient light shafts */}
      <div aria-hidden className="absolute inset-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-0 block bg-[#F4A93C]"
            style={{
              width: "2px",
              height: "120%",
              transformOrigin: "top",
              transform: `translate(-50%, 0) rotate(${-30 + i * 15}deg)`,
              opacity: 0.06,
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
          <radialGradient id="docPulse">
            <stop offset="0" stopColor={PALE_GOLD} stopOpacity="1" />
            <stop offset="1" stopColor={GOLD} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="pedestalGlow">
            <stop offset="0" stopColor={PALE_GOLD} stopOpacity="0.9" />
            <stop offset="1" stopColor={GOLD} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* tessellated testimony grid — perspective warp around the centre */}
        <g
          transform={`translate(${width * 0.50}, ${height * 0.50}) scale(${vaultScale}) translate(${-width * 0.50}, ${-height * 0.50})`}
        >
          {testimonies.map((cell, i) => {
            const cellW = (width * 0.85) / 11;
            const cellH = height * 0.10;
            const cx = width * 0.075 + cell.x * cellW;
            const cy = height * 0.10 + cell.y * cellH;
            // Distance from center → perspective falloff
            const dx = cx - width * 0.5;
            const dy = cy - height * 0.5;
            const dist = Math.sqrt(dx * dx + dy * dy) / (width * 0.5);
            const perspective = Math.max(0.45, 1 - dist * 0.35);
            const w = cellW * cell.w * perspective;
            const h = cellH * cell.h * perspective;
            // breathing
            const breath = 0.6 + 0.4 * Math.sin(t * 0.6 + cell.phase);
            // ripple response — peaks at landing
            const rippleStrength = ripple > 0 ? Math.sin(ripple * Math.PI) * 0.5 : 0;
            const alpha = (0.32 + 0.20 * breath + rippleStrength * 0.30) * (1 - dist * 0.18);
            return (
              <g key={i} opacity={alpha}>
                <ellipse cx={cx} cy={cy} rx={w * 0.55} ry={h * 0.45} fill="url(#docPulse)" opacity="0.20" />
                <rect
                  x={cx - w / 2}
                  y={cy - h / 2}
                  width={w}
                  height={h}
                  fill="#0e1614"
                  stroke={GOLD}
                  strokeWidth="0.5"
                />
                <rect x={cx - w * 0.30} y={cy - h * 0.35} width={w * 0.6} height={h * 0.05} fill={GOLD} opacity="0.55" />
                <rect x={cx - w * 0.30} y={cy - h * 0.20} width={w * 0.45} height={h * 0.04} fill={GOLD} opacity="0.35" />
                <rect x={cx - w * 0.30} y={cy - h * 0.10} width={w * 0.55} height={h * 0.04} fill={GOLD} opacity="0.35" />
              </g>
            );
          })}
        </g>

        {/* PEDESTAL — central */}
        <g transform={`translate(${width * 0.50}, ${height * 0.55})`}>
          <ellipse rx={width * 0.10} ry={height * 0.012} fill="url(#pedestalGlow)" />
          <rect x={-width * 0.04} y="0" width={width * 0.08} height={height * 0.06} fill="#0a0c14" />
          <rect x={-width * 0.045} y={-height * 0.005} width={width * 0.09} height={height * 0.008} fill="#1a1d28" />
        </g>

        {/* INCOMING BEAM — light descending into the chamber */}
        {arrival < 1 ? (
          <rect
            x={width * 0.485}
            y={0}
            width={width * 0.03}
            height={height * 0.50}
            fill="url(#beamDescend)"
            opacity={1 - arrival}
          />
        ) : null}
        <defs>
          <linearGradient id="beamDescend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={PALE_GOLD} stopOpacity="0.85" />
            <stop offset="1" stopColor={GOLD} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* USER'S DOCUMENT — descends and lands */}
        <g
          transform={`translate(${width * 0.50}, ${height * (0.18 + arrival * 0.35)}) rotate(${(1 - arrival) * 18}) scale(${0.4 + arrival * 0.6})`}
        >
          {/* glow under the document, intensifies at landing */}
          <ellipse rx={width * 0.06} ry={height * 0.04} fill="url(#docPulse)" opacity={0.5 + landing * 0.5} />
          {/* the document */}
          <rect
            x={-width * 0.035}
            y={-height * 0.045}
            width={width * 0.07}
            height={height * 0.09}
            fill="#101713"
            stroke={GOLD}
            strokeWidth="1"
          />
          {/* document content */}
          <rect x={-width * 0.025} y={-height * 0.030} width={width * 0.05} height={height * 0.010} fill={PALE_GOLD} />
          <rect x={-width * 0.025} y={-height * 0.014} width={width * 0.04} height={height * 0.007} fill={GOLD} opacity="0.8" />
          <rect x={-width * 0.025} y={-height * 0.004} width={width * 0.045} height={height * 0.007} fill={GOLD} opacity="0.8" />
          <rect x={-width * 0.025} y={height * 0.006} width={width * 0.035} height={height * 0.007} fill={GOLD} opacity="0.65" />
          {/* check mark on the document */}
          <circle cx={width * 0.022} cy={height * 0.028} r={width * 0.010} fill="none" stroke={PALE_GOLD} strokeWidth="1.5" />
          <path
            d={`M ${width * 0.017} ${height * 0.028} l ${width * 0.0035} ${height * 0.005} l ${width * 0.008} ${-height * 0.008}`}
            fill="none"
            stroke={PALE_GOLD}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* LANDING RIPPLE — concentric rings expanding from pedestal */}
        {ripple > 0 ? (
          <g transform={`translate(${width * 0.50}, ${height * 0.55})`}>
            {[0, 0.2, 0.4].map((dly, i) => {
              const r = Math.max(0, ripple - dly);
              if (r <= 0) return null;
              return (
                <circle
                  key={i}
                  r={r * width * 0.45}
                  fill="none"
                  stroke={GOLD}
                  strokeWidth={2 * (1 - r)}
                  opacity={(1 - r) * 0.55}
                />
              );
            })}
          </g>
        ) : null}

        {/* edge vignette to suggest infinite chamber */}
        <rect width={width} height={height} fill="url(#vaultVignette)" />
        <defs>
          <radialGradient id="vaultVignette" cx="0.5" cy="0.5" r="0.7">
            <stop offset="0.5" stopColor="#000" stopOpacity="0" />
            <stop offset="1"   stopColor="#000" stopOpacity="0.7" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
