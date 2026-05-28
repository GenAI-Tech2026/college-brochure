"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SceneProps } from "@/lib/cinematic/types";

/**
 * /submit Act 4 — THE BEAM IGNITES & THE NETWORK RESPONDS (the hero).
 *
 * Internal 0..1 timeline driven by the page (the page sits in the
 * "transmitting" phase for 10s, during which this scene plays a
 * self-contained animation). Beats:
 *
 *   0.00–0.15  camera pulls back, lighthouse glowing pure
 *   0.15–0.30  beam EXPLODES outward as a rotating column
 *   0.30–0.60  other lighthouses on the horizon flash in response,
 *              constellation grows
 *   0.60–0.85  aerial reveal — synchronized wave of beacons
 *   0.85–1.00  camera follows the user's beam back DOWN into the
 *              base of the lighthouse, light pours into a shaft
 *
 * The scene uses its own RAF clock — it does NOT depend on the
 * external `progress` prop because the page-level locked phase is
 * 10s wall-clock, not scroll-bound.
 */
const GOLD = "#F4A93C";

export function BeamNetworkScene({ width, height }: SceneProps) {
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [t, setT] = useState(0); // 0..1 over 10s

  useEffect(() => {
    const tick = (now: number) => {
      if (startRef.current == null) startRef.current = now;
      const elapsed = (now - startRef.current) / 10_000;
      setT(Math.min(1, elapsed));
      if (elapsed < 1.05) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Distant beacons — stable positions seeded
  const beacons = useMemo(() => {
    let s = 91;
    const next = () => {
      s = (s * 1664525 + 1013904223) | 0;
      return ((s >>> 0) % 1000) / 1000;
    };
    return Array.from({ length: 60 }, (_, i) => ({
      x: 0.05 + next() * 0.90,
      y: 0.50 + next() * 0.36, // distributed across coast
      r: 1.4 + next() * 1.2,
      delay: 0.30 + (i / 60) * 0.35,
      flickerSpeed: 1.8 + next() * 2.4,
    }));
  }, []);

  // Camera pull-back factor: bigger lighthouse at t=0, smaller as we pull back
  const pull = clamp01((t - 0.0) / 0.20);
  const towerScale = 1.4 - pull * 0.80; // 1.4 → 0.6
  const towerY = 0.55 + pull * 0.08; // moves slightly down as we pull back

  // Beam rotation angle 0..1 then sustains 1 throughout the rest
  const beamPower = clamp01((t - 0.12) / 0.18);
  const beamAngle = t * 360; // continuous rotation

  // Final descent — camera dives into the shaft past 0.85
  const descent = clamp01((t - 0.85) / 0.15);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#040714] via-[#060a18] to-[#020409]">
      {/* aerial pull-back atmospheric haze */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% ${towerY * 100}%, rgba(244,169,60,${0.10 + beamPower * 0.18}), transparent 60%)`,
        }}
      />

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <radialGradient id="beamGlow">
            <stop offset="0" stopColor="#FFF6D8" stopOpacity={beamPower * 0.95} />
            <stop offset="0.4" stopColor={GOLD} stopOpacity={beamPower * 0.55} />
            <stop offset="1" stopColor="#7a4f1c" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="beamFan" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFF8E0" stopOpacity={beamPower} />
            <stop offset="1" stopColor="#F4A93C" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* horizon */}
        <line x1="0" y1={height * 0.62} x2={width} y2={height * 0.62} stroke="#1a2030" strokeWidth="0.8" opacity="0.6" />

        {/* coastline curve hint */}
        <path
          d={`M -10 ${height * 0.66} Q ${width * 0.25} ${height * 0.62} ${width * 0.50} ${height * 0.66} T ${width + 10} ${height * 0.66}`}
          stroke="#1a2030"
          strokeWidth="0.6"
          fill="none"
          opacity="0.5"
        />

        {/* DISTANT BEACONS — flash in response */}
        {beacons.map((b, i) => {
          const local = clamp01((t - b.delay) / 0.05);
          if (local <= 0) return null;
          const cx = b.x * width;
          const cy = b.y * height;
          const pulse = 0.6 + 0.4 * Math.sin(t * b.flickerSpeed * Math.PI * 2 + i);
          return (
            <g key={i} opacity={local}>
              <circle cx={cx} cy={cy} r={b.r * 6} fill={GOLD} opacity={0.15 * pulse} />
              <circle cx={cx} cy={cy} r={b.r} fill="#FFE6B0" opacity={pulse} />
            </g>
          );
        })}

        {/* THE LIGHTHOUSE — center stage, scales with pull-back */}
        <g
          transform={`translate(${width * 0.50}, ${height * towerY}) scale(${Math.max(0.5, towerScale * (1 - descent * 0.4))})`}
          opacity={1 - descent * 0.85}
        >
          {/* the BEAM — sweeping rotational column */}
          {beamPower > 0.02 ? (
            <g
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
              }}
              transform={`rotate(${beamAngle})`}
            >
              {/* primary beam fan */}
              <path
                d={`M 0 0 L ${width * 1.2} ${-height * 0.12} L ${width * 1.2} ${height * 0.12} Z`}
                fill="url(#beamFan)"
                opacity={beamPower}
              />
              {/* secondary 180° opposite */}
              <path
                d={`M 0 0 L ${-width * 1.2} ${-height * 0.12} L ${-width * 1.2} ${height * 0.12} Z`}
                fill="url(#beamFan)"
                opacity={beamPower * 0.85}
                transform="scale(-1, 1)"
              />
            </g>
          ) : null}

          {/* halo around the bulb */}
          <circle r={Math.min(width, height) * 0.08} fill="url(#beamGlow)" />

          {/* tower */}
          <rect
            x={-Math.min(width, height) * 0.020}
            y={0}
            width={Math.min(width, height) * 0.040}
            height={Math.min(width, height) * 0.32}
            fill="#2c3140"
          />
          <rect
            x={-Math.min(width, height) * 0.024}
            y={Math.min(width, height) * 0.32}
            width={Math.min(width, height) * 0.048}
            height={Math.min(width, height) * 0.020}
            fill="#1a1d24"
          />

          {/* lamp room */}
          <ellipse cx="0" cy="0" rx={Math.min(width, height) * 0.020} ry={Math.min(width, height) * 0.014} fill="#FFE6B0" opacity={beamPower * 0.95} />
          <circle cx="0" cy="0" r={Math.min(width, height) * 0.008} fill="#FFFFFF" opacity={beamPower} />
        </g>

        {/* DESCENT — stone shaft revealing below the lighthouse at the end */}
        {descent > 0.01 ? (
          <g opacity={descent}>
            <rect
              x={width * 0.46}
              y={height * 0.50}
              width={width * 0.08}
              height={height * 0.55}
              fill="#0a0c14"
            />
            <rect
              x={width * 0.47}
              y={height * 0.50}
              width={width * 0.06}
              height={height * 0.55}
              fill="url(#beamFan)"
              transform={`scale(1, 1)`}
            />
            <rect x={width * 0.475} y={height * 0.55} width={width * 0.05} height={height * 0.5} fill={GOLD} opacity="0.55" />
            <rect x={width * 0.485} y={height * 0.6}  width={width * 0.03} height={height * 0.4} fill="#FFFFFF" opacity="0.45" />
            {/* shaft brick lines */}
            {Array.from({ length: 12 }).map((_, i) => (
              <line
                key={i}
                x1={width * 0.46}
                x2={width * 0.54}
                y1={height * (0.55 + i * 0.04)}
                y2={height * (0.55 + i * 0.04)}
                stroke="#1a1d24"
                strokeWidth="0.6"
                opacity="0.6"
              />
            ))}
          </g>
        ) : null}
      </svg>
    </div>
  );
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
