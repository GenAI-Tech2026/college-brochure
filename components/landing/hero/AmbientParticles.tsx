"use client";
import { useEffect, useRef } from "react";

/**
 * Lightweight canvas particle field — "paper shred fragments" drifting
 * from top-right to bottom-left at ~0.5x.
 *
 * Design choice: canvas (not Pixi, not DOM nodes). 60 rectangles at most;
 * single 2d context; runs in one rAF loop. CPU cost is negligible and
 * the bundle stays small — no Pixi dependency for two-pixel drift.
 *
 * Behaviour:
 *   - Particles wrap when they exit the bottom-left.
 *   - Five thin Truth Red horizontal lines drift across every ~8s — like
 *     printer bleed / data interference. They're individual <span>s that
 *     CSS-animate (cheaper than canvas lines).
 *   - Pauses on visibility hidden.
 *   - Respects prefers-reduced-motion (canvas not started).
 */
export function AmbientParticles() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    type P = { x: number; y: number; vx: number; vy: number; r: number; sw: number; sh: number };
    const COUNT = 36;
    const particles: P[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: -0.15 - Math.random() * 0.25, // drift left
      vy:  0.18 + Math.random() * 0.32, // drift down
      r: (Math.random() - 0.5) * Math.PI,
      sw: 1 + Math.random() * 3,
      sh: 6 + Math.random() * 10,
    }));

    let raf = 0;
    const tick = () => {
      if (document.visibilityState !== "visible") {
        raf = requestAnimationFrame(tick);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(232,225,208,0.18)";
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.y > h + 10) p.y = -10;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillRect(-p.sw / 2, -p.sh / 2, p.sw, p.sh);
        ctx.restore();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      <canvas ref={ref} className="absolute inset-0 h-full w-full opacity-60" />
      {/* Five drifting Truth Red interference lines */}
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute left-0 right-0 h-px bg-truth/30"
          style={{
            top: `${15 + i * 17}%`,
            animation: `bleed-line ${10 + i * 1.5}s linear infinite`,
            animationDelay: `${i * 1.6}s`,
          }}
        />
      ))}
      {/* film-grain overlay using SVG noise */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.05] mix-blend-overlay" aria-hidden>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <style>{`
        @keyframes bleed-line {
          0%   { transform: translateX(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
