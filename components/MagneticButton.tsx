"use client";
import { useEffect, useRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface MagneticProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  strength?: number;
  as?: "button" | "a" | "div";
  href?: string;
  variant?: "primary" | "ghost" | "stamp";
}

/**
 * Magnetic hover: element follows cursor within a radius, eases back on leave.
 * We attach to the parent <div> and translate the inner content separately
 * so the click target stays put — only the *visual* moves.
 */
export function MagneticButton({
  strength = 0.4,
  className,
  children,
  variant = "primary",
  as = "button",
  href,
  ...rest
}: MagneticProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let qx: ((v: number) => void) | null = null;
    let qy: ((v: number) => void) | null = null;
    let active = false;

    (async () => {
      const { gsap } = await import("gsap");
      if (!inner.current) return;
      qx = gsap.quickTo(inner.current, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      qy = gsap.quickTo(inner.current, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    })();

    const el = wrap.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      qx?.(x);
      qy?.(y);
      active = true;
    };
    const leave = () => {
      if (!active) return;
      qx?.(0);
      qy?.(0);
      active = false;
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength]);

  const variantStyle = {
    primary: "bg-truth text-newsprint hover:bg-newsprint hover:text-ink",
    ghost: "border border-newsprint/30 text-newsprint hover:bg-newsprint hover:text-ink",
    stamp: "bg-newsprint text-ink hover:bg-truth hover:text-newsprint",
  }[variant];

  const inside = (
    <span
      ref={inner}
      className="inline-flex items-center gap-3 font-sans text-meta uppercase tracking-[0.18em]"
    >
      {children}
    </span>
  );

  const sharedClass = cn(
    "relative inline-flex items-center justify-center px-6 py-3 transition-colors duration-300",
    variantStyle,
    className
  );

  if (as === "a") {
    return (
      <a href={href} className={sharedClass} data-cursor="link">
        <div ref={wrap} className="contents">{inside}</div>
      </a>
    );
  }
  return (
    <div ref={wrap} className={sharedClass} data-cursor="link">
      <button {...rest} className="contents">{inside}</button>
    </div>
  );
}
