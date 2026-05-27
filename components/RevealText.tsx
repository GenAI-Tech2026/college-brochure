"use client";
import { useEffect, useRef } from "react";
import { splitText } from "@/lib/utils/splitText";
import { cn } from "@/lib/utils/cn";

interface RevealTextProps {
  as?: keyof React.JSX.IntrinsicElements;
  children: string;
  className?: string;
  delay?: number;
  stagger?: number;
  trigger?: "viewport" | "mount";
  /** Letter-level entrance: lift + tilt + opacity. The signature hero treatment. */
  variant?: "rise" | "redact" | "tear";
}

/**
 * Editorial entrance animation for headlines.
 * - rise:   rotateX(40deg) + y(80%) → 0,0
 * - redact: each char enters from under a redaction bar that slides off
 * - tear:   chars enter clipped on a diagonal (paper-tear feel)
 */
export function RevealText({
  as: Tag = "h2",
  children,
  className,
  delay = 0,
  stagger = 0.03,
  trigger = "viewport",
  variant = "rise",
}: RevealTextProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const split = splitText(el as HTMLElement, { chars: true });
    let cleanup: (() => void) | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      let initial: gsap.TweenVars = {};
      let to: gsap.TweenVars = {};
      switch (variant) {
        case "rise":
          initial = { yPercent: 110, rotateX: 35, opacity: 0 };
          to = { yPercent: 0, rotateX: 0, opacity: 1 };
          break;
        case "redact":
          initial = { xPercent: -20, opacity: 0, filter: "blur(8px)" };
          to = { xPercent: 0, opacity: 1, filter: "blur(0px)" };
          break;
        case "tear":
          initial = { yPercent: 60, skewY: -8, opacity: 0 };
          to = { yPercent: 0, skewY: 0, opacity: 1 };
          break;
      }

      if (reduced) {
        gsap.set(split.chars, { opacity: 1, yPercent: 0, rotateX: 0, skewY: 0, xPercent: 0, filter: "none" });
        return;
      }
      gsap.set(split.chars, initial);

      const play = () =>
        gsap.to(split.chars, {
          ...to,
          duration: 1.1,
          ease: "expo.out",
          stagger: { each: stagger, from: "start" },
          delay,
        });

      if (trigger === "mount") {
        play();
      } else {
        const io = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              play();
              io.disconnect();
            }
          },
          { threshold: 0.2 }
        );
        io.observe(el as Element);
        cleanup = () => io.disconnect();
      }
    })();

    return () => {
      cleanup?.();
      split.revert();
    };
  }, [children, variant, delay, stagger, trigger]);

  const Component = Tag as unknown as React.ElementType;
  return (
    <Component
      ref={ref as React.Ref<HTMLElement>}
      className={cn("inline-block [perspective:1000px]", className)}
    >
      {children}
    </Component>
  );
}
