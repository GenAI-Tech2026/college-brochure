"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { College } from "@/lib/mock-data/types";
import {
  buildCascade,
  poseFor,
  type CascadeFile,
} from "@/lib/colleges/cascadeChoreography";
import { CaseFile } from "./CaseFile";
import { LoosePaper, type LoosePaperVariant } from "./LoosePaper";
import { DustMotes } from "./DustMotes";

/**
 * THE DOSSIER DROPS — scroll-driven cinematic prelude to /colleges.
 *
 * Performance design:
 *
 * 1. NO React re-renders on scroll. We compute poses in a ScrollTrigger
 *    onUpdate callback and write `transform` + `opacity` directly to each
 *    file's DOM node via refs. React reconciliation cost on scroll is zero.
 *    A single low-frequency `setStableProgress` updates ~10× per second
 *    only for things that React owns (skip button visibility, title fade).
 *
 * 2. Device-aware density. Slow devices and small viewports render a
 *    smaller cascade — visually identical (same gravity, same grid layout),
 *    just fewer extras. The math is unchanged.
 *
 * 3. transform3d on every animated node forces GPU compositing. `will-change:
 *    transform, opacity` is set during the run and cleared on unmount.
 *
 * 4. Blur is skipped on weak devices — it's the single most expensive
 *    filter and the depth cue is preserved by brightness alone.
 *
 * The choreography (`cascadeChoreography`) is unchanged. The look is
 * unchanged. Only the rendering path is.
 */
const LOOSE_VARIANTS: LoosePaperVariant[] = [
  "receipt",
  "brochure",
  "photo",
  "note",
  "screenshot",
];

interface PerfBudget {
  fileCount: number;
  looseCount: number;
  doteCount: number;
  allowBlur: boolean;
}

function detectBudget(): PerfBudget {
  if (typeof window === "undefined") {
    return { fileCount: 96, looseCount: 30, doteCount: 28, allowBlur: true };
  }
  const cores = (navigator as { hardwareConcurrency?: number }).hardwareConcurrency ?? 8;
  const narrow = window.matchMedia("(max-width: 767px)").matches;
  // Loose tiers — explicit thresholds so behaviour is predictable
  if (cores <= 2 || narrow) {
    return { fileCount: 40, looseCount: 12, doteCount: 14, allowBlur: false };
  }
  if (cores <= 4) {
    return { fileCount: 64, looseCount: 20, doteCount: 20, allowBlur: false };
  }
  return { fileCount: 96, looseCount: 30, doteCount: 28, allowBlur: true };
}

export function DossierIntro({
  colleges,
  fastMode,
  submittedEgg,
  onComplete,
}: {
  colleges: College[];
  fastMode: boolean;
  submittedEgg: boolean;
  onComplete: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const fileRefs = useRef<Array<HTMLDivElement | null>>([]);
  const looseRefs = useRef<Array<HTMLDivElement | null>>([]);
  const completedRef = useRef(false);
  const lastSetStateAtRef = useRef(0);
  const [stableProgress, setStableProgress] = useState(0);

  const budget = useMemo(() => detectBudget(), []);
  // Very slow scroll rate: ~10 viewport-heights to play through the cascade
  // (300vh originally → 560 → 1000 now). Combined with the heavy ScrollTrigger
  // `scrub` buffer below, the falling and glide beats get plenty of dwell
  // even when the user flicks the wheel.
  const scrollLengthVh = fastMode ? 400 : 1000;

  // Build the cascade once on mount.
  const files = useMemo<CascadeFile[]>(
    () =>
      buildCascade({
        count: budget.fileCount,
        cols: 4,
        realColleges: colleges,
        submittedEgg,
      }),
    [budget.fileCount, colleges, submittedEgg],
  );

  // Loose papers (stable seeded params)
  const loose = useMemo(() => {
    let s = 71;
    const next = () => {
      s = (s * 1664525 + 1013904223) | 0;
      return ((s >>> 0) % 1000) / 1000;
    };
    return Array.from({ length: budget.looseCount }, (_, i) => ({
      id: i,
      variant: LOOSE_VARIANTS[i % LOOSE_VARIANTS.length],
      startX: 0.08 + next() * 0.84,
      spawnT: 0.10 + next() * 0.70,
      fallSpeed: 0.6 + next() * 0.5,
      rotateRate: (next() < 0.5 ? -1 : 1) * (90 + next() * 220),
      driftPhase: next() * Math.PI * 2,
      size: 0.6 + next() * 0.5,
    }));
  }, [budget.looseCount]);

  // Landing grid geometry — match the real ExplorerClient layout below.
  const rect = useMemo(
    () => ({
      gridX: 0.05,
      gridY: 0.18,
      gridW: 0.90,
      cols: 4,
      rowHeight: 0.18,
      gridH: 0.7,
    }),
    [],
  );

  // The hot path: directly write transform/opacity to each file's node.
  // Called from RAF + ScrollTrigger onUpdate. ZERO React renders on scroll.
  const applyProgress = (progress: number) => {
    for (let i = 0; i < files.length; i++) {
      const node = fileRefs.current[i];
      if (!node) continue;
      const pose = poseFor(files[i], progress, rect);
      if (!pose.visible) {
        node.style.display = "none";
        continue;
      }
      if (node.style.display === "none") node.style.display = "";

      // translate3d forces GPU compositing on most browsers
      node.style.transform = `translate3d(-50%, -50%, 0) rotate(${pose.rotation.toFixed(2)}deg)`;
      node.style.left = (pose.x * 100).toFixed(2) + "%";
      node.style.top = (pose.y * 100).toFixed(2) + "%";
      node.style.opacity = pose.opacity.toFixed(3);

      if (budget.allowBlur) {
        const blur = pose.depth < 0.85 ? (1 - pose.depth) * 3 : 0;
        const brightness = 0.6 + pose.depth * 0.4;
        node.style.filter =
          blur > 0
            ? `blur(${blur.toFixed(1)}px) brightness(${brightness.toFixed(2)})`
            : "";
      } else {
        // Skip blur, keep the brightness cue (cheap)
        const brightness = 0.7 + pose.depth * 0.3;
        node.style.filter = `brightness(${brightness.toFixed(2)})`;
      }
    }

    // Loose papers — same direct-write pattern
    for (let i = 0; i < loose.length; i++) {
      const node = looseRefs.current[i];
      if (!node) continue;
      const p = loose[i];
      const spawnAbs = 0.20 + p.spawnT * 0.40;
      if (progress < spawnAbs) {
        node.style.display = "none";
        continue;
      }
      if (node.style.display === "none") node.style.display = "";

      const fallProgress =
        clamp01((progress - spawnAbs) / (0.60 - spawnAbs)) * p.fallSpeed;
      const drift = Math.sin(progress * 7 + p.driftPhase) * 0.04;
      const x = p.startX + drift;
      const y = lerp(-0.18, 1.12, Math.min(1, fallProgress));
      const rot = progress * p.rotateRate * 0.6;
      const fadeOut = progress > 0.78 ? clamp01((0.95 - progress) / 0.17) : 1;
      node.style.transform = `translate3d(-50%, -50%, 0) rotate(${rot.toFixed(2)}deg)`;
      node.style.left = (x * 100).toFixed(2) + "%";
      node.style.top = (y * 100).toFixed(2) + "%";
      node.style.opacity = (fadeOut * 0.65).toFixed(3);
    }

    // Low-frequency React update for UI chrome
    const now = performance.now();
    if (now - lastSetStateAtRef.current > 80) {
      lastSetStateAtRef.current = now;
      setStableProgress(progress);
    }
  };

  // GSAP ScrollTrigger
  useEffect(() => {
    const trigger = wrapRef.current;
    const pin = pinRef.current;
    if (!trigger || !pin) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      // Prime initial pose at progress=0 so the hero is on-screen before
      // the user touches the wheel.
      applyProgress(0);

      const st = ScrollTrigger.create({
        trigger,
        start: "top top",
        end: () => `+=${window.innerHeight * (scrollLengthVh / 100)}`,
        pin,
        pinSpacing: true,
        // Heavy scrub buffer. GSAP catches the cascade progress up to actual
        // scroll over ~1.6s of smoothing — softer than a snappy 0.3, plays
        // continuously even when the wheel input is bursty.
        scrub: 1.6,
        onUpdate: (self) => {
          applyProgress(self.progress);
          if (self.progress > 0.95 && !completedRef.current) {
            completedRef.current = true;
            onComplete();
          }
        },
      });
      cleanup = () => st.kill();
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // applyProgress closes over `files`/`loose`/`rect`/`budget` — all
    // memoized. We intentionally don't re-create the ScrollTrigger when
    // those refs swap (they don't in practice).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollLengthVh, onComplete]);

  // Editorial overlays — read stableProgress, so they update at ~12fps.
  const overlays = [
    { text: "It started with one.", at: [0.02, 0.27] },
    { text: "Now there are <em>thousands.</em>", at: [0.30, 0.55] },
    { text: "Each one tells <em>the truth.</em>", at: [0.55, 0.80] },
  ] as const;

  const titleAlpha = clamp01((stableProgress - 0.78) / 0.10);
  const overlayDim = clamp01((stableProgress - 0.90) / 0.10);
  const overallOpacity = 1 - overlayDim;
  const showSkip = stableProgress >= 0.07 && stableProgress < 0.95;

  const handleSkip = () => {
    const trigger = wrapRef.current;
    if (!trigger) return;
    const target =
      trigger.getBoundingClientRect().top +
      window.scrollY +
      window.innerHeight * (scrollLengthVh / 100);
    window.scrollTo({ top: target + 8, behavior: "smooth" });
  };

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="relative"
      style={{ height: `calc(100vh + ${scrollLengthVh}vh)` }}
    >
      <div
        ref={pinRef}
        className="relative h-screen w-full overflow-hidden bg-ink"
        style={{ opacity: overallOpacity }}
      >
        {/* spotlight — fades over Beat 1 only */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 38% 45% at 50% 45%, rgba(255,236,200,0.18), rgba(0,0,0,0.0) 60%)",
            opacity: stableProgress < 0.30 ? 1 - stableProgress / 0.30 : 0,
          }}
        />

        <DustMotes density={budget.doteCount} />

        {/* loose papers — DOM nodes pre-mounted; styles written by applyProgress */}
        {loose.map((p, i) => (
          <div
            key={p.id}
            ref={(el) => {
              looseRefs.current[i] = el;
            }}
            className="absolute"
            style={{
              willChange: "transform, opacity",
              transform: "translate3d(-50%, -50%, 0)",
              display: "none",
            }}
          >
            <LoosePaper variant={p.variant} size={p.size} id={p.id} />
          </div>
        ))}

        {/* case files — same pattern */}
        {files.map((f, i) => (
          <div
            key={f.id}
            ref={(el) => {
              fileRefs.current[i] = el;
            }}
            className="absolute"
            style={{
              width: f.isHero ? "min(180px, 18vw)" : "min(150px, 16vw)",
              willChange: "transform, opacity",
              transform: "translate3d(-50%, -50%, 0)",
              zIndex: f.isHero ? 20 : 10,
              display: "none",
            }}
          >
            <CaseFile
              caseNo={f.caseNo}
              subtitle={f.subtitle}
              variant={f.variant}
              id={f.id}
              isYours={f.isYours}
            />
          </div>
        ))}

        {/* text overlays */}
        {overlays.map((o, i) => {
          const t = bandAlpha(stableProgress, o.at[0], o.at[1], 0.04);
          if (t <= 0.005) return null;
          return (
            <div
              key={i}
              className="pointer-events-none absolute inset-x-0 bottom-[14vh] text-center"
              style={{ opacity: t }}
            >
              <p
                className="font-display font-medium leading-[1.05] tracking-[-0.02em] text-newsprint"
                style={{ fontSize: "clamp(1.5rem, 4.5vw, 3rem)" }}
                dangerouslySetInnerHTML={{ __html: o.text }}
              />
            </div>
          );
        })}

        {/* final title */}
        {titleAlpha > 0.01 ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-10 text-center md:top-16"
            style={{ opacity: titleAlpha }}
          >
            <h1
              className="font-display font-black uppercase leading-none tracking-[-0.04em] text-newsprint"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
            >
              The Files<span className="text-truth">.</span>
            </h1>
            <p className="mt-3 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
              {colleges.length.toLocaleString()} colleges · 247,891 verified reviews
            </p>
          </div>
        ) : null}

        {/* scroll hint */}
        {stableProgress < 0.07 ? (
          <div
            className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
            style={{ opacity: 1 - stableProgress / 0.07 }}
          >
            <p className="font-mono text-meta uppercase tracking-[0.4em] text-newsprint/55">
              Scroll
            </p>
            <span
              aria-hidden
              className="mx-auto mt-2 inline-block h-8 w-px origin-top bg-newsprint/55"
              style={{ animation: "scroll-hint 1.6s ease-in-out infinite" }}
            />
          </div>
        ) : null}

        {showSkip ? (
          <button
            type="button"
            onClick={handleSkip}
            className="pointer-events-auto absolute bottom-6 right-6 z-30 inline-flex items-center gap-2 border border-newsprint/30 bg-ink/55 px-3 py-2 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/85 backdrop-blur-sm transition-colors hover:border-truth hover:text-truth md:bottom-8 md:right-8"
          >
            Skip intro →
          </button>
        ) : null}

        <span className="sr-only" aria-live="polite">
          Colleges archive. {colleges.length} case files. Scroll to reveal.
        </span>
      </div>

      <style jsx>{`
        @keyframes scroll-hint {
          0%, 100% { transform: scaleY(0.4); opacity: 0.4; }
          50%      { transform: scaleY(1);   opacity: 0.95; }
        }
      `}</style>
    </div>
  );
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function bandAlpha(p: number, start: number, end: number, fade: number) {
  if (p < start - fade) return 0;
  if (p < start) return (p - (start - fade)) / fade;
  if (p < end - fade) return 1;
  if (p < end) return (end - p) / fade;
  return 0;
}
