"use client";
/**
 * ScrollRevealQuote — word-by-word reveal tied to scroll position.
 *
 * Editorial "karaoke" treatment used by Cartier, Apple, Stripe: each word
 * fades from a ghosted base opacity to full as the reader scrolls through
 * the quote's range. GSAP ScrollTrigger with `scrub` ties the reveal 1:1
 * to scroll progress, so reversing the scroll un-reveals — it reads like
 * the type is being inked in (or wiped out) by the reader's own gesture.
 *
 * Why scrub-not-stagger: an `entrance` animation feels arbitrary on a long
 * pull-quote (when do you start? when do you stop?). Scroll-linked reveal
 * lets the quote BE the scrubbable instrument — the user's scroll IS the
 * performance. No skipping ahead, no missing the punch line.
 *
 * Reduced motion: words paint full opacity immediately, no scroll listener.
 */
import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils/cn";

interface ScrollRevealQuoteProps {
  children: string;
  className?: string;
  /** Base opacity of un-revealed words. Lower = more dramatic contrast. */
  ghostOpacity?: number;
}

export function ScrollRevealQuote({
  children,
  className,
  ghostOpacity = 0.15,
}: ScrollRevealQuoteProps) {
  const ref = useRef<HTMLParagraphElement>(null);

  // Tokenise once. Keep punctuation glued to preceding word ("once,") by
  // splitting on whitespace only; spaces stay as text nodes between spans
  // so line-breaks behave naturally.
  const words = useMemo(() => children.split(/\s+/).filter(Boolean), [children]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      // CSS-only "all visible" state for reduced-motion users.
      el.querySelectorAll<HTMLElement>("[data-rq-word]").forEach((w) => {
        w.style.opacity = "1";
        w.style.transform = "none";
        w.style.filter = "none";
      });
      return;
    }

    let cleanup: (() => void) | undefined;

    (async () => {
      const [gsapMod, stMod] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      const gsap = gsapMod.gsap ?? gsapMod.default ?? gsapMod;
      const ScrollTrigger = stMod.ScrollTrigger ?? stMod.default;
      gsap.registerPlugin(ScrollTrigger);

      const wordEls = el.querySelectorAll<HTMLElement>("[data-rq-word]");

      // Animate from ghost → full in a single timeline, then attach to a
      // ScrollTrigger with scrub. `ease: "none"` keeps the scrub feel
      // perfectly linear with scroll — anything else lurches.
      const tl = gsap.timeline({ paused: true }).fromTo(
        wordEls,
        { opacity: ghostOpacity, y: 6, filter: "blur(4px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          ease: "none",
          stagger: 0.05,
          duration: 1,
        },
      );

      const trigger = ScrollTrigger.create({
        trigger: el,
        start: "top 78%",   // begin when the quote's top hits 78% of viewport
        end: "bottom 38%",  // finish before the bottom leaves the screen
        scrub: 0.6,         // 0.6s smoothing — feels luxurious, not mechanical
        animation: tl,
      });

      cleanup = () => {
        trigger.kill();
        tl.kill();
      };
    })();

    return () => {
      cleanup?.();
    };
  }, [ghostOpacity, words.length]);

  return (
    <p ref={ref} className={cn(className)}>
      {words.map((word, i) => (
        // Wrapping fragment lets us inject a real space text-node between
        // inline-block spans so wrapping at line ends still works.
        <span key={i}>
          {i > 0 && " "}
          <span
            data-rq-word
            className="inline-block will-change-[opacity,transform,filter]"
            style={{ opacity: ghostOpacity }}
          >
            {word}
          </span>
        </span>
      ))}
    </p>
  );
}
