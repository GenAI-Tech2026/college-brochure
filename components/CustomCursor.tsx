"use client";
import { useEffect, useRef } from "react";
import { useCursorStore } from "@/lib/store/filterStore";

/**
 * Single-div magnetic cursor.
 * - GSAP quickTo() for sub-frame interpolation
 * - mix-blend-mode: difference for contrast-aware visibility
 * - Morphs by context: scans data-cursor attrs on hover targets
 *
 * Hidden on coarse pointers (touch devices) via media query in globals.css.
 */
export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const { set, clear, label: cursorLabel, variant } = useCursorStore();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let qx: ((v: number) => void) | null = null;
    let qy: ((v: number) => void) | null = null;
    let qxRing: ((v: number) => void) | null = null;
    let qyRing: ((v: number) => void) | null = null;

    (async () => {
      const { gsap } = await import("gsap");
      if (dot.current && ring.current) {
        qx = gsap.quickTo(dot.current, "x", { duration: 0.15, ease: "power3.out" });
        qy = gsap.quickTo(dot.current, "y", { duration: 0.15, ease: "power3.out" });
        qxRing = gsap.quickTo(ring.current, "x", { duration: 0.5, ease: "power3.out" });
        qyRing = gsap.quickTo(ring.current, "y", { duration: 0.5, ease: "power3.out" });
      }
    })();

    const move = (e: PointerEvent) => {
      qx?.(e.clientX);
      qy?.(e.clientY);
      qxRing?.(e.clientX);
      qyRing?.(e.clientY);
    };
    const over = (e: Event) => {
      const t = e.target as HTMLElement;
      const explicit = t.closest<HTMLElement>("[data-cursor]");
      if (explicit) {
        const v = explicit.dataset.cursor || "default";
        const text = explicit.dataset.cursorLabel || "";
        set(text, v as "default" | "text" | "video" | "review" | "link");
      } else if (t.closest("a, button")) {
        set("", "link");
      } else {
        clear();
      }
    };
    const leave = () => clear();

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over);
    window.addEventListener("blur", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      window.removeEventListener("blur", leave);
    };
  }, [set, clear]);

  const variantClass: Record<string, string> = {
    default: "w-2 h-2",
    text: "w-2 h-2",
    video: "w-2 h-2",
    review: "w-2 h-2",
    link: "w-2 h-2",
  };
  /* Cursor variants stay monochrome — the cursor reads context via SIZE,
     not via colour. Accent only on the strongest signal (video). */
  const ringClass: Record<string, string> = {
    default: "w-10 h-10 border-newsprint/40",
    text: "w-20 h-20 border-newsprint",
    video: "w-24 h-24 border-truth bg-truth/10",
    review: "w-24 h-24 border-newsprint",
    link: "w-14 h-14 border-newsprint",
  };

  return (
    <>
      <div
        ref={ring}
        aria-hidden
        data-cursor="ignore"
        className={
          "no-print pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 " +
          "rounded-full border transition-[width,height,border-color,background] duration-300 ease-[var(--ease-expo)] " +
          "mix-blend-difference " +
          (ringClass[variant] ?? ringClass.default)
        }
      >
        <span
          ref={label}
          className="absolute inset-0 grid place-items-center font-mono text-[10px] uppercase tracking-[0.2em] text-newsprint"
        >
          {cursorLabel}
        </span>
      </div>
      <div
        ref={dot}
        aria-hidden
        data-cursor="ignore"
        className={
          "no-print pointer-events-none fixed left-0 top-0 z-[10000] -translate-x-1/2 -translate-y-1/2 " +
          "rounded-full bg-newsprint mix-blend-difference " +
          (variantClass[variant] ?? variantClass.default)
        }
      />
    </>
  );
}
