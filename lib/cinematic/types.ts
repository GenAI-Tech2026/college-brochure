/**
 * Shared shape contracts for the cinematic trilogy (/manifesto, /submit, /verified).
 *
 * An Act describes one chapter of a cinematic page: its scroll/form range,
 * the asset that fills the viewport, the text overlays that sync with it,
 * and optional ambient audio.
 *
 * Assets are intentionally polymorphic — primitives accept any source:
 *  - "video"  → <video> with .currentTime scrubbed by progress (or autoplay loop)
 *  - "frames" → preloaded WebP sequence drawn to canvas
 *  - "scene"  → React component (SVG/CSS-driven) that fills the stage
 */

import type { ComponentType } from "react";

export type AssetSource =
  | {
      type: "video";
      desktop: string;
      mobile?: string;
      durationSec?: number;
      autoplay?: boolean;
    }
  | {
      type: "frames";
      desktop: string;
      mobile?: string;
      frameCount: number;
      pad?: number;
    }
  | {
      type: "scene";
      Component: ComponentType<SceneProps>;
    };

export interface SceneProps {
  progress: number;
  state: ActState;
  width: number;
  height: number;
  /** Local 0..1 pulse signal (form-driven only). Decays to 0. */
  pulse?: number;
}

export type ActState = "idle" | "entering" | "active" | "exiting";

export interface OverlayText {
  enterAt?: number;
  exitAt?: number;
  kicker?: string;
  line: string;
  /** Sub-line under the main overlay — rendered in mono caps. Like a
   *  newspaper teletype status header. */
  subline?: string;
  caption?: string;
  align?: "left" | "center" | "right";
  vAlign?: "top" | "center" | "bottom";
}

export interface Act {
  id: string;
  range: [number, number];
  asset: AssetSource;
  overlays?: OverlayText[];
  ambient?: {
    sound?: string;
    loop?: boolean;
    volume?: number;
  };
  accent?: string;
}

/**
 * Form-driven page trigger map. Each form step number maps to an act id;
 * `onSubmit` maps the click; `transmittingActId` and `arrivedActId` are
 * the locked-phase act ids (Act 4 and Act 5 respectively in /submit).
 */
export interface FormTriggerMap {
  byStep: Record<number, string>;
  onSubmit?: string;
  transmittingActId?: string;
  arrivedActId?: string;
  initialActId: string;
}

export interface CinematicConfig {
  acts: Act[];
  triggers?: FormTriggerMap;
  scrollLength?: number;
}
