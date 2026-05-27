"use client";
import { useEffect, useState } from "react";

interface ScrollState {
  scroll: number;
  velocity: number;
  direction: 1 | -1 | 0;
  progress: number;
}

/**
 * Subscribes to the global Lenis instance attached by LenisProvider.
 * Returns reactive scroll telemetry without thrashing React on every frame —
 * we throttle to one update per RAF.
 */
export function useLenisScroll() {
  const [state, setState] = useState<ScrollState>({
    scroll: 0,
    velocity: 0,
    direction: 0,
    progress: 0,
  });

  useEffect(() => {
    let raf = 0;
    let lastFlush = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      // 60fps-ish flush cap
      if (now - lastFlush < 16) return;
      lastFlush = now;
      const w = window as unknown as { __lenis__?: {
        scroll: number; velocity: number; direction: 1 | -1 | 0; progress: number;
      } };
      const l = w.__lenis__;
      if (!l) return;
      setState({
        scroll: l.scroll ?? 0,
        velocity: l.velocity ?? 0,
        direction: (l.direction ?? 0) as 1 | -1 | 0,
        progress: l.progress ?? 0,
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return state;
}
