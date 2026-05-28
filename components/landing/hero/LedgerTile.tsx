"use client";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Shared chrome for every tile in the Live Ledger panel.
 *
 * Visual language: corkboard evidence card. Subtle drop shadow, slight
 * fixed rotation (so the four tiles look hand-pinned, not Figma-perfect),
 * a paper-grain background, and a tape-strip corner detail.
 *
 * Interaction: on pointermove we tilt the tile toward the cursor (max 8°
 * per the spec). The tilt math:
 *   rotateX =  (centerY - pointerY) / halfH * 8  // top half tilts back
 *   rotateY = -(centerX - pointerX) / halfW * 8  // right half tilts right
 * Both fall back to 0 on pointerleave with a 400ms ease.
 *
 * Tilt is skipped on coarse pointers (touch) and when prefers-reduced-motion
 * is set.
 */
export function LedgerTile({
  label,
  rotation = 0,
  children,
  className,
  onClick,
  href,
}: {
  label: string;
  /** Fixed deg of rotation applied at rest. Hand-pinned-paper effect. */
  rotation?: number;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - (r.left + r.width / 2)) / (r.width / 2); // -1..+1
    const py = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const max = 8;
    el.style.transform = `rotate(${rotation}deg) rotateY(${px * max}deg) rotateX(${-py * max}deg)`;
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
      style={{
        transform: `rotate(${rotation}deg)`,
        transformStyle: "preserve-3d",
        transition: "transform 400ms var(--ease-expo)",
      }}
      className={cn(
        // corkboard card — bone paper on near-black, soft shadow, hairline border
        "group relative isolate flex h-full flex-col overflow-hidden",
        "border border-newsprint/15 bg-[#15130F] text-newsprint",
        "shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_25px_45px_-25px_rgba(0,0,0,0.9)]",
        "p-5 md:p-6",
        // paper grain texture via CSS — no extra HTTP
        "[background-image:radial-gradient(circle_at_30%_10%,rgba(232,225,208,0.04),transparent_60%),radial-gradient(circle_at_80%_90%,rgba(255,67,50,0.04),transparent_55%)]",
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
      <div className="mb-3 flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-newsprint/55">
        <span className="inline-block h-1 w-1 rounded-full bg-truth animate-pulse" aria-hidden />
        <span>{label}</span>
      </div>
      {children}
      {/* details affordance — appears on hover */}
      <span className="pointer-events-none absolute bottom-3 right-4 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-newsprint/0 transition group-hover:text-newsprint/70">
        view details →
      </span>
    </div>
  );

  if (href) {
    return (
      <a href={href} onClick={onClick} className="block h-full focus:outline-none">
        {inner}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="block h-full text-left focus:outline-none"
    >
      {inner}
    </button>
  );
}
