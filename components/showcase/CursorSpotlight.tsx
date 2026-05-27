"use client";
import { useEffect, useRef } from "react";

/**
 * A soft radial spotlight that follows the cursor on the showcase.
 *
 * Awwwards-cited pattern (Resn, Adoratorio, Bertoldi): the dark canvas
 * gains a hand-held-flashlight quality, making the type feel "lit" as
 * the user reads it. mix-blend-mode: soft-light adds the warmth without
 * fighting the chapter accent colour underneath.
 *
 * Implementation: a single div, GSAP quickTo() for sub-frame interp.
 * No state churn. Skip on coarse pointers.
 */
export function CursorSpotlight({ color = "#E63946" }: { color?: string }) {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let qx: ((v: number) => void) | null = null;
    let qy: ((v: number) => void) | null = null;
    (async () => {
      const { gsap } = await import("gsap");
      if (!dot.current) return;
      qx = gsap.quickTo(dot.current, "x", { duration: 0.6, ease: "power3.out" });
      qy = gsap.quickTo(dot.current, "y", { duration: 0.6, ease: "power3.out" });
    })();
    const move = (e: PointerEvent) => {
      qx?.(e.clientX);
      qy?.(e.clientY);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <div
      ref={dot}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[5] h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        background: `radial-gradient(closest-side, ${color}33, transparent 70%)`,
        mixBlendMode: "screen",
        filter: "blur(20px)",
      }}
    />
  );
}
