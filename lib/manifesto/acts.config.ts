/**
 * Manifesto — five-act scroll configuration.
 *
 * The pinned section maps a *single* scroll progress value (0 → 1) onto:
 *  - a frame index in the WebP image sequence (rendered or placeholder), and
 *  - whichever act-overlay should currently be visible.
 *
 * Boundaries below are inclusive of `start`, exclusive of `end`. Keep them
 * in sync with the comments at the top of /app/manifesto/page.tsx — the
 * art direction in the brief depends on the exact 0/18/35/55/80/100 split.
 *
 * Editorial voice + palette inherited from app/globals.css @theme tokens:
 *   ink #0A0A0A · newsprint #E8E1D0 · truth #FF4332 · muted #9A938A
 * Display = Fraunces · body = Inter Tight · meta = JetBrains Mono.
 * (No Verified Green, no Truth Red‐outside‐of‐truth — the site has one
 *  accent, on purpose.)
 */

export const FRAME_COUNT = 240;
export const PIN_VH = 600; // 6× viewport height of scroll → 240 frames.

export type ActId = "crowd" | "podium" | "student" | "voice" | "awakening";

export interface ActCopy {
  /** Pre-headline mono label, e.g. "Act I · The Crowd". */
  label: string;
  /** Display headline shown over the scene. */
  headline: string;
  /** Optional ghost phrases that blur-in/out (used by Act II + Act IV). */
  phrases?: string[];
  /** Optional pull/CTA copy under the headline. */
  caption?: string;
}

export interface Act {
  id: ActId;
  index: number;
  /** Inclusive scroll-progress lower bound (0–1). */
  start: number;
  /** Exclusive scroll-progress upper bound (0–1). */
  end: number;
  copy: ActCopy;
}

export const ACTS: Act[] = [
  {
    id: "crowd",
    index: 1,
    start: 0.0,
    end: 0.18,
    copy: {
      label: "Act I · The Crowd",
      headline: "For years.",
      caption: "Hundreds of identical silhouettes. Every prospectus the same.",
    },
  },
  {
    id: "podium",
    index: 2,
    start: 0.18,
    end: 0.35,
    copy: {
      label: "Act II · The Podium",
      headline: "An empty stage was the lie.",
      phrases: ["We were told.", "We believed.", "We enrolled."],
    },
  },
  {
    id: "student",
    index: 3,
    start: 0.35,
    end: 0.55,
    copy: {
      label: "Act III · The Witness",
      headline: "Then someone refused the script.",
      caption: "One verified student. One hand on the lectern.",
    },
  },
  {
    id: "voice",
    index: 4,
    start: 0.55,
    end: 0.8,
    copy: {
      label: "Act IV · The Voice",
      headline: "And the room could not unhear it.",
      phrases: [
        "They lied about placements.",
        "They hid the fees.",
        "They silenced reviews.",
      ],
    },
  },
  {
    id: "awakening",
    index: 5,
    start: 0.8,
    end: 1.0001, // include the final frame
    copy: {
      label: "Act V · The Awakening",
      headline: "Brochures wrote the story. We're rewriting it.",
      caption: "Every reader you see was a silhouette one act ago.",
    },
  },
];

/** Resolve which Act owns a given 0–1 progress value. */
export function actAt(progress: number): Act {
  const p = Math.min(0.99999, Math.max(0, progress));
  for (const a of ACTS) if (p >= a.start && p < a.end) return a;
  return ACTS[ACTS.length - 1];
}

/** 0–1 progress *within* the current act — used for in-act transitions. */
export function progressWithinAct(progress: number, act: Act): number {
  const span = act.end - act.start;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (progress - act.start) / span));
}

/** Scroll progress → 0..(FRAME_COUNT-1) frame index. */
export function frameAt(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  return Math.min(FRAME_COUNT - 1, Math.floor(clamped * (FRAME_COUNT - 1)));
}

/** Helper for the progress-bar tick labels. */
export function actTickPositions(): Array<{ act: Act; position: number }> {
  return ACTS.map((act) => ({ act, position: act.start }));
}
