"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Shared chrome for every tile in the Live Ledger panel.
 *
 * Visual language: corkboard evidence card. Subtle drop shadow, slight
 * fixed rotation (so the four tiles look hand-pinned, not Figma-perfect),
 * a paper-grain background, and a tape-strip corner detail.
 *
 * Entrance: each tile fades + rises into place, staggered by `index`, so
 * the panel assembles itself rather than popping in flat. (CSS-driven on
 * the non-rotated outer wrapper so it never fights the tilt transform.)
 *
 * Interaction: on pointermove we tilt the tile toward the cursor (max 8°).
 * On hover the card lifts — deeper shadow + a hairline truth-red ring — for
 * a tactile, pick-it-up feel. Tilt is skipped on coarse pointers (touch)
 * and when prefers-reduced-motion is set.
 */
export function LedgerTile({
  label,
  rotation = 0,
  index = 0,
  children,
  className,
  onClick,
  href,
}: {
  label: string;
  /** Fixed deg of rotation applied at rest. Hand-pinned-paper effect. */
  rotation?: number;
  /** Position in the panel — drives the staggered entrance delay. */
  index?: number;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Once the fade-in finishes we drop the animation class so the tile is no
  // longer parked on a compositor layer — that's what keeps the text crisp
  // at rest (a finished fill:both animation otherwise leaves it rasterized).
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), index * 90 + 750);
    return () => clearTimeout(t);
  }, [index]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - (r.left + r.width / 2)) / (r.width / 2); // -1..+1
    const py = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const max = 8;
    // perspective() lives inside the transform (not on the parent) so the
    // tile only becomes a 3D layer while actively tilting — at rest it stays
    // a flat 2D layer and the text renders crisp instead of rasterized-soft.
    el.style.transform = `perspective(900px) rotate(${rotation}deg) rotateY(${px * max}deg) rotateX(${-py * max}deg)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = `rotate(${rotation}deg)`;
  };

  const inner = (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ transform: `rotate(${rotation}deg)` }}
      className={cn(
        // corkboard card — bone paper on near-black, soft shadow, hairline border
        "group relative isolate flex h-full flex-col overflow-hidden",
        "border border-newsprint/15 bg-[#15130F] text-newsprint",
        "shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_25px_45px_-25px_rgba(0,0,0,0.9)]",
        "p-5 md:p-6",
        // one transition for the tilt + the hover lift; expo ease keeps the
        // cursor-follow smooth and the return springy.
        "transition-[transform,box-shadow,border-color] duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        "group-hover/tile:border-newsprint/35",
        "hover:border-newsprint/35 hover:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_44px_72px_-28px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,67,50,0.18)]",
        // paper grain texture via CSS — no extra HTTP
        "[background-image:radial-gradient(circle_at_30%_10%,rgba(232,225,208,0.05),transparent_60%),radial-gradient(circle_at_80%_90%,rgba(255,67,50,0.05),transparent_55%)]",
        className,
      )}
      data-cursor="link"
    >
      {/* tape strip — purely decorative */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-3 -top-2 h-5 w-16 rotate-[-8deg] bg-newsprint/10 mix-blend-overlay"
      />
      {/* tile label — top mono caption */}
      <div className="mb-3 flex items-center gap-2 font-mono text-[0.66rem] font-medium uppercase tracking-[0.22em] text-newsprint/80">
        <span className="inline-block h-1 w-1 rounded-full bg-truth animate-pulse" aria-hidden />
        <span>{label}</span>
      </div>
      {children}
      {/* details affordance — slides in from the right on hover */}
      <span className="pointer-events-none absolute bottom-3 right-4 flex translate-x-1 items-center gap-1 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-newsprint/0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-newsprint/70">
        view details
        <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
      </span>
    </div>
  );

  const wrapperClass = cn(
    "block h-full rounded-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-truth focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
    !entered && "uf-tile-enter",
  );
  const wrapperStyle = entered ? undefined : { ["--uf-tile-delay" as never]: `${index * 0.09}s` };

  if (href) {
    return (
      <a href={href} onClick={onClick} className={wrapperClass} style={wrapperStyle}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(wrapperClass, "text-left")} style={wrapperStyle}>
      {inner}
    </button>
  );
}
