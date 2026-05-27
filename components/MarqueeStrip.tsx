"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

interface MarqueeProps {
  items: (string | { text: string; redact?: boolean })[];
  speed?: number;       // pixels per second
  reverse?: boolean;
  className?: string;
  variant?: "ink" | "paper" | "truth" | "highlighter";
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Infinite GSAP marquee. Duplicates the track once so the loop is seamless;
 * GSAP tweens `xPercent` from 0 → -50 with `repeat: -1`.
 *
 * Used between every major section — the editorial "stop strip" that
 * separates spreads in a newspaper.
 */
export function MarqueeStrip({
  items,
  speed = 80,
  reverse = false,
  className,
  variant = "ink",
  size = "lg",
}: MarqueeProps) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let tween: { kill: () => void } | null = null;
    (async () => {
      const { gsap } = await import("gsap");
      if (!track.current) return;
      const dist = track.current.scrollWidth / 2;
      const duration = dist / speed;
      tween = gsap.to(track.current, {
        x: reverse ? dist : -dist,
        duration,
        ease: "none",
        repeat: -1,
        modifiers: {
          x: (x) => {
            const v = parseFloat(x);
            return `${(v % (reverse ? dist : -dist))}px`;
          },
        },
      }) as unknown as { kill: () => void };
    })();
    return () => tween?.kill();
  }, [speed, reverse]);

  const variantStyle = {
    ink: "bg-ink text-newsprint",
    paper: "paper",
    truth: "bg-truth text-newsprint",
    /* legacy 'highlighter' variant now renders as paper — same visual rhythm,
       no competing yellow */
    highlighter: "paper",
  }[variant];

  const sizeStyle = {
    sm: "py-2 text-[14px]",
    md: "py-3 text-[20px]",
    lg: "py-5 text-[36px]",
    xl: "py-8 text-[64px]",
  }[size];

  return (
    <div
      className={cn(
        "no-print relative overflow-hidden border-y border-newsprint/10",
        variantStyle,
        className
      )}
      role="marquee"
      aria-label={items.map((i) => (typeof i === "string" ? i : i.text)).join(" · ")}
    >
      <div
        ref={track}
        className={cn("flex w-max items-center gap-12 whitespace-nowrap font-display italic", sizeStyle)}
      >
        {[...items, ...items, ...items, ...items].map((item, i) => {
          const text = typeof item === "string" ? item : item.text;
          const redact = typeof item === "object" && item.redact;
          // Key combines copy index + original index + text so duplicates across
          // the 4 marquee copies stay unique. Was reusing `i` per copy → React warning.
          return (
            <span key={`${i}-${text}`} className="flex items-center gap-12">
              {redact ? (
                <span className="bg-redaction px-3 py-1 text-redaction">{text}</span>
              ) : (
                <span>{text}</span>
              )}
              {/* a thin rule replaces the ✸ asterisk — quieter, more editorial */}
              <span aria-hidden className="inline-block h-px w-8 bg-current opacity-30" />
            </span>
          );
        })}
      </div>
    </div>
  );
}
