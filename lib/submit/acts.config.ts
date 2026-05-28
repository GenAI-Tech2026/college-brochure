/**
 * /submit — "THE SIGNAL & THE VAULT" cinematic acts.
 *
 * Form-progress-driven, not scroll-driven. Five acts, with a 10-second
 * locked Act 4 hero on submit, and Act 5 as the permanent landing.
 *
 * To swap real Runway/Kling renders in, change each act's `asset` to:
 *   { type: "video", desktop: "/cinematic/submit/clips/act1.mp4", autoplay: true }
 */
import type { Act, FormTriggerMap, CinematicConfig } from "@/lib/cinematic/types";
import { DarkLighthouseScene } from "@/components/cinematic/scenes/submit/DarkLighthouseScene";
import { MechanismScene } from "@/components/cinematic/scenes/submit/MechanismScene";
import { FilamentScene } from "@/components/cinematic/scenes/submit/FilamentScene";
import { BeamNetworkScene } from "@/components/cinematic/scenes/submit/BeamNetworkScene";
import { VaultScene } from "@/components/cinematic/scenes/submit/VaultScene";
import { BailScene } from "@/components/cinematic/scenes/submit/BailScene";

const ACCENT_GOLD = "#F4A93C";

export const submitActs: Act[] = [
  {
    id: "dark-lighthouse",
    range: [0, 0.2],
    asset: { type: "scene", Component: DarkLighthouseScene },
    overlays: [
      {
        kicker: "ACT · 01 · THE DARK LIGHTHOUSE",
        line: "Some truths wait years for <em>a witness.</em>",
        subline: "BEACON OFFLINE · AWAITING SIGNAL",
        align: "left",
        vAlign: "bottom",
      },
    ],
    ambient: { sound: "/cinematic/submit/audio/storm.mp3", volume: 0.4 },
    accent: ACCENT_GOLD,
  },
  {
    id: "mechanism-awakens",
    range: [0.2, 0.4],
    asset: { type: "scene", Component: MechanismScene },
    overlays: [
      {
        kicker: "ACT · 02 · THE MECHANISM AWAKENS",
        line: "Yours is <em>one of them.</em>",
        subline: "GEARS ENGAGED · LENS ROTATING",
        align: "left",
        vAlign: "bottom",
      },
    ],
    ambient: { sound: "/cinematic/submit/audio/clockwork.mp3", volume: 0.4 },
    accent: ACCENT_GOLD,
  },
  {
    id: "filament-ignites",
    range: [0.4, 0.7],
    asset: { type: "scene", Component: FilamentScene },
    overlays: [
      {
        kicker: "ACT · 03 · THE FILAMENT IGNITES",
        line: "The first words are <em>the hardest.</em>",
        subline: "FILAMENT ACTIVE · BEAM PENDING",
        align: "left",
        vAlign: "bottom",
      },
    ],
    ambient: { sound: "/cinematic/submit/audio/filament.mp3", volume: 0.5 },
    accent: ACCENT_GOLD,
  },
  {
    id: "beam-and-network",
    range: [0.7, 0.9],
    asset: { type: "scene", Component: BeamNetworkScene },
    overlays: [
      {
        kicker: "ACT · 04 · THE BEAM IGNITES",
        line: "You are <em>heard.</em>",
        subline: "BEACON COUNT · 12,847 ACTIVE · YOUR SIGNAL · TRANSMITTED",
        align: "left",
        vAlign: "bottom",
        enterAt: 0,
      },
    ],
    ambient: { sound: "/cinematic/submit/audio/beacon.mp3", volume: 0.6 },
    accent: ACCENT_GOLD,
  },
  {
    id: "the-vault",
    range: [0.9, 1.0],
    asset: { type: "scene", Component: VaultScene },
    overlays: [
      {
        kicker: "ACT · 05 · THE VAULT",
        line: "Now it lives here. <em>Forever.</em>",
        subline: "TESTIMONY FILED · CASE UF-#### · ON THE RECORD",
        align: "left",
        vAlign: "bottom",
      },
    ],
    ambient: { sound: "/cinematic/submit/audio/cathedral.mp3", volume: 0.55 },
    accent: ACCENT_GOLD,
  },
  // Out-of-band pause beat. Range is unused — the page renders this act
  // only when `bailing === true`.
  {
    id: "bail",
    range: [0, 1],
    asset: { type: "scene", Component: BailScene },
    overlays: [
      {
        kicker: "PAUSE",
        line: "We’ll keep your <em>seat warm.</em>",
        subline: "DRAFT SAVED · COME BACK ANYTIME",
        align: "left",
        vAlign: "bottom",
      },
    ],
    accent: "#999",
  },
];

/**
 * Form step → act mapping. Steps not listed here keep the previous act
 * active and fire a pulse instead.
 */
export const submitTriggers: FormTriggerMap = {
  initialActId: "dark-lighthouse",
  byStep: {
    1: "mechanism-awakens",
    2: "filament-ignites",
    // steps 3, 4, 5, 6 → no act change, pulse
  },
  transmittingActId: "beam-and-network",
  arrivedActId: "the-vault",
  onSubmit: "the-vault",
};

/** Steps that fire a pulse (not an act change). */
export const submitPulseSteps = [3, 4, 5, 6];

/** Sub-status under the main overlay when a pulse step is the latest. */
export const submitPulseSublines: Record<number, string> = {
  3: "REALITY LOGGED · BEAM PENDING",
  4: "EVIDENCE LOGGED · BEAM PENDING",
  5: "IDENTITY ENCRYPTED · BEAM PENDING",
  6: "READY TO TRANSMIT",
};

export const submitConfig: CinematicConfig = {
  acts: submitActs,
  triggers: submitTriggers,
};
