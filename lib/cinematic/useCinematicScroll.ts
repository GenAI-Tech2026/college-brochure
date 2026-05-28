"use client";
import { useEffect, useRef, useState } from "react";
import type { Act } from "./types";

/**
 * Scroll-driven progression for /manifesto and /verified.
 *
 * Pins a wrapper element for `scrollLengthVh` viewport heights. Reports:
 *   - progress: 0..1 overall
 *   - activeActIdx, activeActProgress (localised 0..1 inside the active act)
 *
 * Uses GSAP ScrollTrigger if available (Lenis-synced), otherwise a manual
 * window-scroll listener as a fallback (lighter for /verified on tiny pages).
 */
export function useCinematicScroll({
  triggerRef,
  pinTargetRef,
  acts,
  scrollLengthVh = 500,
  reducedMotion = false,
}: {
  triggerRef: React.RefObject<HTMLElement | null>;
  pinTargetRef: React.RefObject<HTMLElement | null>;
  acts: Act[];
  scrollLengthVh?: number;
  reducedMotion?: boolean;
}) {
  const [progress, setProgress] = useState(reducedMotion ? 1 : 0);
  const cleanupRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    const trigger = triggerRef.current;
    const pin = pinTargetRef.current;
    if (!trigger || !pin) return;
    if (reducedMotion) {
      setProgress(1);
      return;
    }

    let cancelled = false;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const st = ScrollTrigger.create({
        trigger,
        start: "top top",
        end: () => `+=${window.innerHeight * (scrollLengthVh / 100)}`,
        pin,
        pinSpacing: true,
        scrub: 0.6,
        onUpdate: (self) => setProgress(self.progress),
      });
      cleanupRef.current = () => st.kill();
    })();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
    };
  }, [triggerRef, pinTargetRef, scrollLengthVh, reducedMotion]);

  // Derive active act + local progress
  let activeActIdx = 0;
  let activeProgress = 0;
  for (let i = 0; i < acts.length; i++) {
    const [s, e] = acts[i].range;
    if (progress >= s && progress < e) {
      activeActIdx = i;
      activeProgress = (progress - s) / Math.max(1e-6, e - s);
      break;
    }
    if (i === acts.length - 1 && progress >= e) {
      activeActIdx = i;
      activeProgress = 1;
    }
  }

  return { progress, activeActIdx, activeProgress };
}
