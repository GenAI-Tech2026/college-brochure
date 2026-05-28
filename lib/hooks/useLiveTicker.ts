"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Lightweight interval that "comes alive" when the tab is visible and
 * pauses (via visibilitychange) when the user tabs away. Used by every
 * live widget on the home page so that backgrounded tabs don't burn CPU
 * with off-screen animations.
 *
 * Two modes:
 *   - useLiveTicker<number>(seed, (prev) => prev + rand(1,3), { min, max })
 *     fires `tick` repeatedly with the previous value; great for the
 *     odometer counter that ticks up by 1–3 every 3–7s.
 *   - useLiveTicker<T[]>(seedArr, (prev) => [...prev], { interval })
 *     for the rolling activity feed.
 *
 * Respects prefers-reduced-motion: when the user has reduce-motion set,
 * the hook returns the seed and never fires — counters land at their
 * starting value, which the components treat as the "final" number.
 */
export function useLiveTicker<T>(
  seed: T,
  tick: (prev: T) => T,
  opts: {
    /** Fixed interval in ms. If omitted, a random interval in [min, max] is used per tick. */
    interval?: number;
    /** Random-interval lower bound, ms. Default 3000. */
    min?: number;
    /** Random-interval upper bound, ms. Default 7000. */
    max?: number;
    /** Force-disable. Useful when wrapping the hook behind a IntersectionObserver. */
    enabled?: boolean;
  } = {},
): T {
  const [value, setValue] = useState<T>(seed);
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    if (opts.enabled === false) return;
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let timer: number | undefined;
    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;
      const delay =
        opts.interval ??
        (opts.min ?? 3000) + Math.random() * ((opts.max ?? 7000) - (opts.min ?? 3000));
      timer = window.setTimeout(() => {
        if (document.visibilityState === "visible") {
          setValue((prev) => tickRef.current(prev));
        }
        schedule();
      }, delay);
    };

    const onVisibility = () => {
      // visibility change alone doesn't need to clear the timer — we just
      // skip applying the tick when hidden. Saves restarting the cadence.
    };

    document.addEventListener("visibilitychange", onVisibility);
    schedule();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // We intentionally only re-bind when knobs change, not when seed changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.interval, opts.min, opts.max, opts.enabled]);

  return value;
}
