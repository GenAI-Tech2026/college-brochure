"use client";
import { useEffect } from "react";

/**
 * One-shot GSAP plugin registration + global ScrollTrigger.refresh on resize.
 * Lives outside LenisProvider because reduced-motion users still want their
 * pinned/entrance triggers to fire on a single non-smooth scroll.
 */
export function ScrollTriggerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let st: { refresh: () => void } | null = null;
    (async () => {
      const [gsapMod, stMod] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      const gsap = gsapMod.gsap ?? gsapMod.default ?? gsapMod;
      const ScrollTrigger = (stMod as { ScrollTrigger?: unknown; default?: unknown }).ScrollTrigger
        ?? (stMod as { default?: unknown }).default;
      gsap.registerPlugin(ScrollTrigger as Parameters<typeof gsap.registerPlugin>[0]);
      st = ScrollTrigger as { refresh: () => void };
    })();

    const onResize = () => st?.refresh();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return <>{children}</>;
}
