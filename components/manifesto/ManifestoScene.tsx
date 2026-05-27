"use client";
/**
 * ManifestoScene — the orchestrator.
 *
 * Owns the pin element, the scroll-driven progress state, and stitches:
 *   FrameSequence  (the canvas film)
 *   ActOverlay     (the type-on-film)
 *   ScrollProgress (the right-edge bar)
 *   ManifestoSoundToggle / Replay / scroll-hint (the UI furniture)
 *   PreloadGate    (the loader curtain)
 *
 * Performance posture:
 *  - Preload only kicks off when the section is near the viewport
 *    (IntersectionObserver), keeping initial paint cheap on other routes
 *    that import this lazily.
 *  - We synth-render on canvas whenever real WebPs aren't available,
 *    so the page is *never* blank — Cartier-style polish without the
 *    Cartier-style asset budget.
 *  - effectiveType === '2g' or 'slow-2g' opts out of the canvas film
 *    entirely and shows the static StaticFallback hero.
 *  - prefers-reduced-motion disables scrubbing (`scrub: false` inside
 *    usePinnedScroll) — overlays still fade via opacity, satisfying the
 *    a11y contract while remaining cinematic.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActOverlay } from "./ActOverlay";
import { FrameSequence } from "./FrameSequence";
import { ManifestoSoundToggle } from "./SoundToggle";
import { PreloadGate } from "./PreloadGate";
import { ScrollProgress } from "./ScrollProgress";
import { StaticFallback } from "./StaticFallback";
import { FRAME_COUNT, PIN_VH, ACTS } from "@/lib/manifesto/acts.config";
import { usePinnedScroll } from "@/lib/manifesto/usePinnedScroll";
import { useFramePreloader } from "@/lib/manifesto/useFramePreloader";

export function ManifestoScene() {
  // Mirror the pin element in state — `ref.current` doesn't trigger a re-render,
  // so child components that depend on the live DOM node (ScrollProgress, the
  // jump-to-act buttons) wouldn't see it without this. Pattern: callback ref +
  // useState, no need for forwardRef.
  const [pinEl, setPinEl] = useState<HTMLDivElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const setPinRef = useCallback((el: HTMLDivElement | null) => {
    pinRef.current = el;
    setPinEl(el);
  }, []);
  const [progress, setProgress] = useState(0);
  const [observed, setObserved] = useState(false);
  const [orientation, setOrientation] = useState<"desktop" | "mobile">("desktop");
  const [skipFilm, setSkipFilm] = useState(false);
  const [gateOpen, setGateOpen] = useState(true);

  // Detect orientation + connection BEFORE we choose what to load.
  useEffect(() => {
    const portrait = window.matchMedia("(orientation: portrait)").matches;
    setOrientation(portrait ? "mobile" : "desktop");

    const nav = navigator as unknown as { connection?: { effectiveType?: string; saveData?: boolean } };
    const eff = nav.connection?.effectiveType;
    if (eff === "2g" || eff === "slow-2g" || nav.connection?.saveData) {
      setSkipFilm(true);
    }
  }, []);

  // IntersectionObserver gate — don't preload 240 frames for someone who
  // arrived at /manifesto deep-linked then bounced before scrolling.
  useEffect(() => {
    const el = pinEl;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setObserved(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pinEl]);

  const frameUrl = useCallback(
    (i: number) => {
      // Pad to 4-digit filename: frame_0001.webp .. frame_0240.webp.
      const padded = (i + 1).toString().padStart(4, "0");
      return `/manifesto/frames/${orientation}/frame_${padded}.webp`;
    },
    [orientation],
  );

  const preload = useFramePreloader({
    count: FRAME_COUNT,
    frameUrl,
    enabled: observed && !skipFilm,
    kickoffFrames: 60,
    chunkSize: 30,
  });

  // Wait for preload before installing ScrollTrigger pin — if the pin is
  // active during heavy decoding, the user perceives a stutter as Lenis
  // and the decoder fight for the main thread.
  usePinnedScroll({
    pinRef,
    pinVH: PIN_VH / 100,
    onProgress: setProgress,
    enabled: preload.readyEnough || preload.missing || skipFilm,
  });

  // Pin-scroll length in pixels — for ScrollProgress jump-to-act math.
  const pinScrollLength = useMemo(
    () => (typeof window === "undefined" ? 0 : window.innerHeight * (PIN_VH / 100)),
    // window.innerHeight is read at click-time inside ScrollProgress too;
    // this is just the cached approximation for the initial render.
    [],
  );

  // Space → snap to nearest act.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const lenis = (window as unknown as { __lenis__?: { scrollTo: (y: number, opts?: object) => void } }).__lenis__;
      if (!lenis || !pinRef.current) return;
      e.preventDefault();
      // Find nearest act start.
      const nearest = ACTS.reduce((best, a) =>
        Math.abs(a.start - progress) < Math.abs(best.start - progress) ? a : best,
      );
      const pinTop = pinRef.current.getBoundingClientRect().top + window.scrollY;
      lenis.scrollTo(pinTop + nearest.start * (window.innerHeight * (PIN_VH / 100)), { duration: 1.2 });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [progress]);

  const replay = useCallback(() => {
    const lenis = (window as unknown as { __lenis__?: { scrollTo: (y: number, opts?: object) => void } }).__lenis__;
    if (!lenis || !pinRef.current) return;
    const pinTop = pinRef.current.getBoundingClientRect().top + window.scrollY;
    lenis.scrollTo(pinTop, { duration: 3.6 });
  }, []);

  if (skipFilm) return <StaticFallback />;

  // The wrapper is h-screen so the pin only travels for PIN_VH viewports.
  return (
    <section
      ref={setPinRef}
      className="relative h-screen w-full overflow-hidden bg-ink"
      data-cursor="text"
      data-cursor-label="LISTEN"
    >
      {/* The film. */}
      <div className="absolute inset-0 z-10">
        <FrameSequence
          progress={progress}
          bitmaps={preload.bitmaps}
          forceSynth={preload.missing || !preload.readyEnough}
        />
      </div>

      {/* The type. */}
      <ActOverlay progress={progress} />

      {/* Right-edge bar with act ticks. */}
      <ScrollProgress
        progress={progress}
        pinElement={pinEl}
        pinScrollLength={pinScrollLength}
      />

      {/* Top-right sound toggle + scroll hint + replay. */}
      <div className="pointer-events-none absolute left-6 top-6 z-30 flex items-center gap-4 md:left-10 md:top-8">
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
          Manifesto · 5 acts · Scroll
        </p>
      </div>
      <div className="absolute right-6 top-6 z-30 md:right-10 md:top-8">
        <ManifestoSoundToggle progress={progress} />
      </div>

      <ScrollHint visible={progress < 0.04 && !gateOpen} />

      {/* Replay — appears late in act V. */}
      {progress > 0.92 && (
        <button
          onClick={replay}
          className="absolute bottom-8 right-6 z-30 flex items-center gap-2 border border-newsprint/30 bg-ink/40 px-3 py-2 font-mono text-meta uppercase tracking-[0.25em] text-newsprint backdrop-blur-sm transition-colors hover:border-newsprint/60 md:right-10"
          data-cursor="link"
          data-cursor-label="REPLAY"
        >
          <span aria-hidden>↻</span> Replay the film
        </button>
      )}

      {/* Loader. Auto-dismisses when readyEnough. If frames missing, we
          still want the curtain to open so the synth scene takes over. */}
      {gateOpen && (
        <PreloadGate
          progress={preload.missing ? 1 : preload.progress}
          readyEnough={preload.readyEnough || preload.missing}
          onDismiss={() => setGateOpen(false)}
        />
      )}
    </section>
  );
}

function ScrollHint({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-10 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-3 transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <span className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/70">
        Scroll to begin
      </span>
      <span className="relative block h-10 w-px overflow-hidden bg-newsprint/30">
        <span className="absolute inset-x-0 top-0 h-2 bg-newsprint animate-[scrollHint_1.8s_var(--ease-expo)_infinite]" />
      </span>
      <style jsx>{`
        @keyframes scrollHint {
          0%   { transform: translateY(-100%); opacity: 0; }
          30%  { opacity: 1; }
          80%  { transform: translateY(380%); opacity: 1; }
          100% { transform: translateY(420%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
