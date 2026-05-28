"use client";
import { useMemo } from "react";

/**
 * Ambient dust motes drifting through the cinematic. Particularly visible
 * in the spotlight pool during Beat 1. CSS-only — 24 elements, each on a
 * unique drift keyframe. Doesn't move per-frame from JS, so it's cheap.
 */
export function DustMotes({ density = 24 }: { density?: number }) {
  const motes = useMemo(() => {
    let s = 11;
    const next = () => {
      s = (s * 1664525 + 1013904223) | 0;
      return ((s >>> 0) % 1000) / 1000;
    };
    return Array.from({ length: density }, (_, i) => ({
      id: i,
      left: next() * 100,
      top: next() * 100,
      size: 1 + next() * 2.4,
      delay: -next() * 6,
      dur: 6 + next() * 8,
      opacity: 0.18 + next() * 0.30,
    }));
  }, [density]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {motes.map((m) => (
        <span
          key={m.id}
          aria-hidden
          className="absolute rounded-full bg-newsprint"
          style={{
            left: m.left + "%",
            top: m.top + "%",
            width: m.size + "px",
            height: m.size + "px",
            opacity: m.opacity,
            animation: `mote-drift ${m.dur}s ease-in-out ${m.delay}s infinite`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes mote-drift {
          0%, 100% { transform: translate(0, 0); }
          25%      { transform: translate(8px, -12px); }
          50%      { transform: translate(-6px, -22px); }
          75%      { transform: translate(4px, -10px); }
        }
      `}</style>
    </div>
  );
}
