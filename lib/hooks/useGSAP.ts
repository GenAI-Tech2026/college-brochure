"use client";
import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * GSAP context hook with automatic cleanup.
 * - Uses useLayoutEffect on the client, useEffect on the server (SSR safe)
 * - Returns a stable container ref to scope ScrollTriggers
 * - Caller passes a setup function; we wrap it in gsap.context()
 */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Setup = (ctx: { container: HTMLElement | null }) => void | (() => void);

export function useGSAP(setup: Setup, deps: unknown[] = []) {
  const container = useRef<HTMLElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    let cleanup: void | (() => void);
    let ctx: { revert: () => void } | null = null;

    (async () => {
      const { gsap } = await import("gsap");
      ctx = gsap.context(() => {
        cleanup = setup({ container: container.current });
      }, container.current ?? undefined);
    })();

    return () => {
      if (typeof cleanup === "function") cleanup();
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return container;
}
