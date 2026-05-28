/**
 * /verified cinematic acts. Scroll-driven over 500vh of pin.
 *
 * Swap real renders in by editing each `asset` to `{ type: "video", desktop: ... }`
 * or `{ type: "frames", desktop: "...{i}.webp", frameCount: N }`.
 */
import type { Act, CinematicConfig } from "@/lib/cinematic/types";
import { EnvelopeScene } from "@/components/cinematic/scenes/verified/EnvelopeScene";
import { ExaminationScene } from "@/components/cinematic/scenes/verified/ExaminationScene";
import { CorkboardScene } from "@/components/cinematic/scenes/verified/CorkboardScene";
import { StampScene } from "@/components/cinematic/scenes/verified/StampScene";
import { ArchiveScene } from "@/components/cinematic/scenes/verified/ArchiveScene";

export const verifiedActs: Act[] = [
  {
    id: "submission",
    range: [0.00, 0.15],
    asset: { type: "scene", Component: EnvelopeScene },
    overlays: [
      {
        line: "Every truth <em>arrives here first.</em>",
        align: "left",
        vAlign: "bottom",
        kicker: "Act · 01 · The submission",
      },
    ],
    accent: "#4A6FA5",
  },
  {
    id: "examination",
    range: [0.15, 0.35],
    asset: { type: "scene", Component: ExaminationScene },
    overlays: [
      {
        line: "First, the claim <em>is read.</em>",
        align: "left",
        vAlign: "bottom",
        kicker: "Act · 02 · The examination",
      },
    ],
    accent: "#4A6FA5",
  },
  {
    id: "cross-reference",
    range: [0.35, 0.60],
    asset: { type: "scene", Component: CorkboardScene },
    overlays: [
      {
        line: "Then, it is checked. <em>Against everything we have.</em>",
        align: "left",
        vAlign: "bottom",
        kicker: "Act · 03 · Cross-referencing",
      },
    ],
    accent: "#FF4332",
  },
  {
    id: "stamp",
    range: [0.60, 0.85],
    asset: { type: "scene", Component: StampScene },
    overlays: [
      {
        line: "Only then does it <em>become truth.</em>",
        align: "left",
        vAlign: "bottom",
        kicker: "Act · 04 · The stamp",
      },
    ],
    accent: "#06D6A0",
  },
  {
    id: "archive",
    range: [0.85, 1.00],
    asset: { type: "scene", Component: ArchiveScene },
    overlays: [
      {
        line: "Now it lives here. <em>Permanently. Publicly.</em>",
        caption: "Yours to read.",
        align: "left",
        vAlign: "bottom",
        kicker: "Act · 05 · The archive",
      },
    ],
    accent: "#06D6A0",
  },
];

export const verifiedConfig: CinematicConfig = {
  acts: verifiedActs,
  scrollLength: 500,
};
