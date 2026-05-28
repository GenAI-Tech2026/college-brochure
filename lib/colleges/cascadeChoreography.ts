/**
 * The Dossier Drops choreography.
 *
 * One pure module computes every file's position/rotation/visibility as a
 * function of a single 0..1 progress value. The DossierIntro component
 * runs the RAF clock and feeds it `progress`; everything else is math.
 *
 * Timeline (6 seconds total):
 *   0.00–0.25  BEAT 1 — single CASE #001 file drops to center, spotlight
 *   0.25–0.50  BEAT 2 — avalanche cascades; loose papers flutter
 *   0.50–0.75  BEAT 3 — files rotate elegantly into a 4-column grid
 *   0.75–1.00  BEAT 4 — cinematic UI fades, real DOM grid fades in
 *
 * The simplifying decision: cascade files settle into the SAME 4-column
 * masonry positions that the real <CollegeCard> grid uses. The intro
 * overlay then crossfades to reveal the grid beneath. The user perceives
 * a morph; we avoid the cross-component layoutId dance.
 */

import type { College } from "@/lib/mock-data/types";

export type StampVariant = "standard" | "verified" | "failed" | "investigating";

export interface CascadeFile {
  id: number;
  /** "CASE #XXX" caption. */
  caseNo: string;
  /** Subtitle line in mono caps. */
  subtitle: string;
  variant: StampVariant;
  /** Initial horizontal slot 0..1 (where it enters the frame from). */
  startX: number;
  /** When this file enters the frame, in beat-2 progress (0..1). */
  spawnT: number;
  /** Per-file fall speed multiplier (0.8..1.4). */
  fallSpeed: number;
  /** Degrees/sec of rotation. Sign varies. */
  rotateRate: number;
  /** Horizontal drift while falling. */
  driftAmplitude: number;
  /** Lateral phase offset for the drift sine. */
  driftPhase: number;
  /** Hero file? The CASE #001 that drops first and lingers. */
  isHero: boolean;
  /** If true, this file gets a special "YOURS" Verified-Green border on
   *  Beat 4 settling (the /submit → /colleges easter egg). */
  isYours: boolean;
  /** Target slot row in the final grid. */
  gridRow: number;
  /** Target slot col 0..3. */
  gridCol: number;
}

const VARIANT_DISTRIBUTION: { variant: StampVariant; weight: number }[] = [
  { variant: "standard",      weight: 60 },
  { variant: "verified",      weight: 20 },
  { variant: "failed",        weight: 15 },
  { variant: "investigating", weight:  5 },
];

function pickVariant(seed: number): StampVariant {
  let r = (seed * 9301 + 49297) % 100;
  if (r < 0) r += 100;
  let acc = 0;
  for (const v of VARIANT_DISTRIBUTION) {
    acc += v.weight;
    if (r < acc) return v.variant;
  }
  return "standard";
}

/**
 * Build the cascade. Stable per-mount: same seed → same composition.
 * The first item is always the hero CASE #001 (Beat 1).
 */
export function buildCascade(options: {
  count: number;
  cols?: number;
  realColleges?: College[];
  submittedEgg?: boolean;
}): CascadeFile[] {
  const { count, cols = 4, realColleges = [], submittedEgg = false } = options;
  const files: CascadeFile[] = [];

  let s = 4729;
  const next = () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 10000) / 10000;
  };

  for (let i = 0; i < count; i++) {
    const isHero = i === 0;
    const real = realColleges[i % Math.max(1, realColleges.length)];
    const caseNo = isHero
      ? "CASE #001"
      : `CASE #${String(Math.round(100 + next() * 9899)).padStart(4, "0")}`;
    const subtitle = isHero
      ? "INSTITUTE OF TECHNICAL EXCELLENCE · 2026"
      : real
      ? `${real.shortName.toUpperCase()} · ${real.founded}`
      : "FILED · ON THE RECORD";

    files.push({
      id: i,
      caseNo,
      subtitle,
      variant: isHero ? "verified" : pickVariant(i * 31 + 7),
      startX: 0.10 + next() * 0.80,
      // Hero spawns immediately; the rest stagger across beat 2.
      spawnT: isHero ? 0 : 0.05 + next() * 0.85,
      fallSpeed: 0.8 + next() * 0.6,
      rotateRate: (next() < 0.5 ? -1 : 1) * (60 + next() * 180),
      driftAmplitude: 0.02 + next() * 0.04,
      driftPhase: next() * Math.PI * 2,
      isHero,
      isYours: submittedEgg && i === 1, // first non-hero card gets the YOURS badge
      gridRow: Math.floor(i / cols),
      gridCol: i % cols,
    });
  }

  return files;
}

export interface FilePose {
  /** % of viewport width (left). */
  x: number;
  /** % of viewport height (top). */
  y: number;
  /** Degrees. */
  rotation: number;
  /** 0..1. */
  opacity: number;
  /** 0..1, used to depth-blur/desaturate background files. */
  depth: number;
  /** Visible at all? */
  visible: boolean;
  /** True during the Beat-4 morph window (kicks the "settled" class). */
  morphing: boolean;
}

/**
 * Compute one file's pose at the global 0..1 progress.
 *
 * The grid landing rectangle is parameterised by `gridX`, `gridY`,
 * `gridW`, `gridH` (viewport %), so the caller can match the real DOM
 * grid's geometry. Past Beat 3 each file slots into:
 *   x = gridX + (gridCol / cols) * gridW
 *   y = gridY + gridRow * rowHeight
 */
export function poseFor(
  f: CascadeFile,
  progress: number,
  rect: { gridX: number; gridY: number; gridW: number; gridH: number; cols: number; rowHeight: number },
): FilePose {
  // Hero: stays centred during Beat 1, then slides into the top-left grid
  // slot at the start of Beat 3.
  if (f.isHero) {
    if (progress < 0.05) {
      // dropping in
      const t = progress / 0.05;
      return {
        x: 0.50,
        y: -0.10 + t * 0.55, // -10% → 45% viewport
        rotation: 6 * (1 - t),
        opacity: t,
        depth: 1,
        visible: true,
        morphing: false,
      };
    }
    if (progress < 0.5) {
      // resting at centre, gentle bob
      const settleT = (progress - 0.05) / 0.45;
      const bob = Math.sin(progress * 6) * 0.005;
      return {
        x: 0.50,
        y: 0.45 + bob,
        rotation: 4 + Math.sin(progress * 4) * 1.5,
        opacity: 1,
        depth: 1,
        visible: true,
        morphing: false,
      };
    }
    // Beat 3: slide to grid slot (0, 0). Use a smooth back-ease so it
    // overshoots slightly then resolves.
    const t = clamp01((progress - 0.5) / 0.25);
    const tx = rect.gridX + 0 * rect.gridW / rect.cols;
    const ty = rect.gridY + 0 * rect.rowHeight;
    const e = backEase(t);
    return {
      x: lerp(0.50, tx, e),
      y: lerp(0.45, ty, e),
      rotation: (1 - e) * 4,
      opacity: 1,
      depth: 1,
      visible: true,
      morphing: progress >= 0.75,
    };
  }

  // Non-hero. Timeline:
  //   spawnAbs..settleStart   FREE FALL
  //   settleStart..settleEnd  GLIDE — starts from the file's *actual*
  //                           airborne position at settleStart and eases
  //                           into the grid slot. Cubic-out, no overshoot.
  //   settleEnd..morphEnd     SETTLED — files just sit in grid position
  //                           until the morph fades them out.
  const beat2Start = 0.20;
  const beat2End = 0.55;
  const spawnAbs = beat2Start + f.spawnT * (beat2End - beat2Start);

  if (progress < spawnAbs) {
    return { x: 0, y: 0, rotation: 0, opacity: 0, depth: 0, visible: false, morphing: false };
  }

  // Windows: widened the glide phase so the handoff has time to be smooth.
  const settleStart = 0.55;
  const settleEnd = 0.82;
  const morphStart = 0.90;
  const morphEnd = 1.0;

  if (progress < settleStart) {
    return fallingPose(f, progress, spawnAbs, settleStart);
  }

  const tx = rect.gridX + (f.gridCol / rect.cols) * rect.gridW;
  const ty = rect.gridY + f.gridRow * rect.rowHeight;

  if (progress < settleEnd) {
    // CRITICAL FIX: read the file's pose at the moment glide started, so the
    // glide tweens from where the file actually was — not a hardcoded y=0.55.
    // For late-spawn files this was the source of the jarring snap.
    const start = fallingPose(f, settleStart, spawnAbs, settleStart);
    const t = (progress - settleStart) / (settleEnd - settleStart);
    const e = cubicOut(t);
    return {
      x: lerp(start.x, tx, e),
      y: lerp(start.y, ty, e),
      // Damp rotation toward 0 along the same curve. No more compound spin
      // during the glide.
      rotation: lerp(start.rotation, 0, e),
      opacity: 1,
      depth: lerp(start.depth, 1, e),
      visible: true,
      morphing: false,
    };
  }

  if (progress < morphStart) {
    // Held in place between glide-end and morph-start — gives the eye a
    // moment to register the grid before the fade.
    return {
      x: tx,
      y: ty,
      rotation: 0,
      opacity: 1,
      depth: 1,
      visible: true,
      morphing: false,
    };
  }

  // Morph (Beat 4) — fade as the real DOM grid emerges beneath.
  const t = (progress - morphStart) / (morphEnd - morphStart);
  return {
    x: tx,
    y: ty,
    rotation: 0,
    opacity: 1 - t,
    depth: 1,
    visible: true,
    morphing: true,
  };
}

/** Free-fall pose for a non-hero file. Reused by the settling branch so
 *  the glide starts from the file's true airborne position. */
function fallingPose(
  f: CascadeFile,
  progress: number,
  spawnAbs: number,
  settleStart: number,
): FilePose {
  const fallProgress =
    clamp01((progress - spawnAbs) / (settleStart - spawnAbs)) * f.fallSpeed;
  const yAbove = -0.20;
  const yRest = 0.55;
  const drift = Math.sin(progress * 6 + f.driftPhase) * f.driftAmplitude;
  return {
    x: f.startX + drift,
    y: lerp(yAbove, yRest, Math.min(1, fallProgress)),
    // Lighter rotation coefficient (was 0.7) — files spin less while
    // airborne so the glide has less rotation to undo.
    rotation: progress * f.rotateRate * 0.45,
    opacity: 1,
    depth: 0.6 + Math.abs(Math.sin(progress * 4 + f.driftPhase)) * 0.4,
    visible: true,
    morphing: false,
  };
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Cubic-out — fast start, gentle landing, no overshoot. */
function cubicOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/** "back" easing — overshoots slightly, then settles. Kept for the hero. */
function backEase(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
