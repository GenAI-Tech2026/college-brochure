"use client";
import { useEffect } from "react";

/**
 * Mounts Lenis on the client. Exposes the instance on window.__lenis__
 * so useLenisScroll() and ScrollTrigger sync can read it without prop-drilling.
 *
 * Why: every Awwwards winner using lenis follows this exact pattern (see
 * studio-freight examples). Smoothness ≈ duration 1.2, expo ease-out.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let raf = 0;
    let lenisInstance: { destroy: () => void; raf: (t: number) => void } | null = null;
    let cleanupGsap: (() => void) | undefined;

    (async () => {
      const [{ default: Lenis }, gsapMod, stMod] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      const gsap = gsapMod.gsap ?? gsapMod.default ?? gsapMod;
      const ScrollTrigger = stMod.ScrollTrigger ?? stMod.default;
      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      lenisInstance = lenis as unknown as typeof lenisInstance;
      // expose telemetry for useLenisScroll
      (window as unknown as { __lenis__: unknown }).__lenis__ = lenis;

      // ScrollTrigger ⇄ Lenis sync
      lenis.on("scroll", ScrollTrigger.update);
      const tickerCb = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tickerCb);
      gsap.ticker.lagSmoothing(0);
      cleanupGsap = () => gsap.ticker.remove(tickerCb);

      // fallback RAF in case ticker isn't loaded yet
      const loop = (t: number) => {
        lenis.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    })();

    return () => {
      cancelAnimationFrame(raf);
      cleanupGsap?.();
      lenisInstance?.destroy();
      delete (window as unknown as { __lenis__?: unknown }).__lenis__;
    };
  }, []);

  return <>{children}</>;
}
