"use client";
/**
 * usePinnedScroll — bridges GSAP ScrollTrigger pin to Lenis smooth scroll.
 *
 * Why this hook exists:
 *  - The manifesto needs ONE source of progress (0 → 1) that drives both
 *    the canvas frame index and every overlay's enter/exit gate.
 *  - We pin the section for PIN_VH viewport-heights of scroll; GSAP
 *    reports `self.progress` ∈ [0,1] back to us via `onUpdate`.
 *  - Lenis is already wired into ScrollTrigger.update() by LenisProvider,
 *    so simply registering the trigger gets us silky 60fps scrubbing for
 *    free; nothing further to wire on the Lenis side.
 *
 * Reduced motion: the trigger is created without `scrub` (we snap to act
 * starts instead). Combined with the CSS rule in globals.css that kills
 * non-essential transforms, this gives the keyboard / a11y path a
 * waypoint-based reading mode.
 */
import { useEffect, useRef } from "react";

interface UsePinnedScrollOptions {
  /** Ref to the wrapping element that gets pinned. */
  pinRef: React.RefObject<HTMLElement | null>;
  /** Multiplier on viewport height; total scroll distance = pinVH * 1vh. */
  pinVH: number;
  /** Called every rAF with the current 0..1 progress through the pin. */
  onProgress: (progress: number) => void;
  /** Optional callback fired when the user presses Space — snaps to nearest act. */
  onSnapRequest?: () => void;
  /** Skip when frames aren't ready yet to avoid stuttering during preload. */
  enabled: boolean;
}

export function usePinnedScroll({
  pinRef,
  pinVH,
  onProgress,
  enabled,
}: UsePinnedScrollOptions) {
  const lastProgress = useRef(0);

  useEffect(() => {
    if (!enabled || !pinRef.current) return;
    const el = pinRef.current;

    let trigger: { kill: () => void } | null = null;
    let cleanupScrollTrigger: (() => void) | undefined;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    (async () => {
      const [gsapMod, stMod] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      const gsap = gsapMod.gsap ?? gsapMod.default ?? gsapMod;
      const ScrollTrigger = stMod.ScrollTrigger ?? stMod.default;
      gsap.registerPlugin(ScrollTrigger);

      // Pin for pinVH * 1vh of scroll. `scrub: true` ties the progress
      // 1:1 to the (Lenis-smoothed) scroll position; ScrollTrigger reads
      // Lenis under the hood via the ticker already installed in
      // LenisProvider, so we don't double-smooth.
      trigger = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: () => `+=${window.innerHeight * pinVH}`,
        pin: true,
        pinSpacing: true,
        scrub: reduced ? false : true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self: { progress: number }) => {
          const p = self.progress;
          // Skip identical-frame updates — drawImage is cheap but copying
          // the same frame each rAF flickers the loader on mobile.
          if (Math.abs(p - lastProgress.current) < 1 / 1000) return;
          lastProgress.current = p;
          onProgress(p);
        },
      });

      cleanupScrollTrigger = () => trigger?.kill();
    })();

    return () => {
      cleanupScrollTrigger?.();
    };
    // pinVH / onProgress are intentionally not in deps — they're stable refs
    // upstream, and re-creating ScrollTrigger on each render is expensive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
