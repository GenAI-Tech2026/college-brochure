/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Placeholder frame generator for /manifesto.
 *
 * Produces 240 WebP frames per orientation under:
 *   /public/manifesto/frames/desktop/frame_0001.webp ... frame_0240.webp
 *   /public/manifesto/frames/mobile/frame_0001.webp  ... frame_0240.webp
 *
 * Each frame is a stylised storyboard panel describing what shot the real
 * Blender render should contain, drawn with the site palette so the page
 * looks intentional even before a 3D artist delivers the WebP sequence.
 *
 * USAGE
 *   npm i -D canvas sharp tsx
 *   npx tsx scripts/generate-placeholder-frames.ts
 *
 * If `canvas` won't install on your platform (it builds against cairo/pango),
 * the runtime FrameSequence component already falls back to drawing the
 * same composition into the live <canvas> on the user's machine, so this
 * script is strictly optional. The page works either way.
 *
 * REPLACING WITH REAL RENDERS
 *   Drop new WebP files with the exact same filenames into the same
 *   folders. The FrameSequence preloader picks them up automatically.
 *   See README "Blender → WebP pipeline" for naming + compression.
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";

// Type-stub the `canvas` import so this file type-checks even when the dep
// isn't installed. The actual import is deferred until run time.
type NodeCanvas = {
  createCanvas: (w: number, h: number) => {
    getContext: (kind: "2d") => CanvasRenderingContext2D;
    toBuffer: (mime: "image/webp", opts?: { quality: number }) => Buffer;
  };
};

const FRAMES = 240;
const SIZES = {
  desktop: { w: 1920, h: 1080 },
  mobile: { w: 1080, h: 1920 },
} as const;

// Mirror of lib/manifesto/acts.config.ts boundaries — keep these in sync.
const ACTS = [
  { id: "crowd",     start: 0.0,  end: 0.18, label: "I · The Crowd",     headline: "FOR YEARS." },
  { id: "podium",    start: 0.18, end: 0.35, label: "II · The Podium",   headline: "AN EMPTY STAGE WAS THE LIE." },
  { id: "student",   start: 0.35, end: 0.55, label: "III · The Witness", headline: "THEN SOMEONE REFUSED THE SCRIPT." },
  { id: "voice",     start: 0.55, end: 0.80, label: "IV · The Voice",    headline: "AND THE ROOM COULD NOT UNHEAR IT." },
  { id: "awakening", start: 0.80, end: 1.001, label: "V · The Awakening", headline: "BROCHURES WROTE THE STORY. WE'RE REWRITING IT." },
];

const INK = "#0A0A0A";
const REDACTION = "#050505";
const NEWSPRINT = "#E8E1D0";
const TRUTH = "#FF4332";

async function main() {
  let canvasMod: NodeCanvas;
  try {
    canvasMod = require("canvas");
  } catch {
    console.error(
      "[manifesto] `canvas` not installed. Run:\n  npm i -D canvas\nor skip — the runtime canvas in FrameSequence handles fallback rendering.",
    );
    process.exit(1);
  }

  for (const [orientation, dims] of Object.entries(SIZES) as Array<["desktop" | "mobile", typeof SIZES.desktop]>) {
    const dir = path.join(process.cwd(), "public", "manifesto", "frames", orientation);
    await fs.mkdir(dir, { recursive: true });
    console.log(`[manifesto] ${orientation} → ${dir}`);

    for (let i = 0; i < FRAMES; i++) {
      const p = i / (FRAMES - 1);
      const buf = renderFrame(canvasMod, dims.w, dims.h, p, orientation);
      const padded = (i + 1).toString().padStart(4, "0");
      await fs.writeFile(path.join(dir, `frame_${padded}.webp`), buf);
      if ((i + 1) % 30 === 0) console.log(`  · ${i + 1}/${FRAMES}`);
    }
  }

  console.log("[manifesto] Done. Replace these with Blender renders when ready.");
}

function renderFrame(
  canvasMod: NodeCanvas,
  w: number,
  h: number,
  progress: number,
  orientation: "desktop" | "mobile",
): Buffer {
  const canvas = canvasMod.createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const act = ACTS.find((a) => progress >= a.start && progress < a.end) ?? ACTS[ACTS.length - 1];
  const tIn = Math.max(0, Math.min(1, (progress - act.start) / (act.end - act.start)));

  // Base ink + warm radial haze.
  ctx.fillStyle = REDACTION;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = act.id === "crowd" ? h * 0.2 : act.id === "podium" ? h * 0.35 : h * 0.5;
  const haze = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.8);
  haze.addColorStop(0, "rgba(232,225,208,0.22)");
  haze.addColorStop(1, "rgba(10,10,10,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, w, h);

  // Crowd rows.
  drawCrowd(ctx, w, h, act, tIn);

  // Podium + spotlight.
  if (act.id !== "crowd") drawPodium(ctx, w, h, tIn);

  // Student.
  if (["student", "voice", "awakening"].includes(act.id)) drawStudent(ctx, w, h, act.id, tIn);

  // Voice shockwave.
  if (act.id === "voice") drawShockwave(ctx, w, h, tIn);

  // Awakening cream wash.
  if (act.id === "awakening") {
    const wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, `rgba(232,225,208,${0.2 * tIn})`);
    wash.addColorStop(1, "rgba(232,225,208,0)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
  }

  // Editorial chrome — letterbox + metadata strip naming the shot.
  const bar = Math.max(40, h * 0.07);
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, bar);
  ctx.fillRect(0, h - bar, w, bar);

  ctx.fillStyle = NEWSPRINT;
  ctx.font = `${Math.round(bar * 0.38)}px "JetBrains Mono", monospace`;
  ctx.textBaseline = "middle";
  ctx.fillText(`MANIFESTO · ACT ${act.label}`, w * 0.04, bar / 2);
  ctx.textAlign = "right";
  ctx.fillText(`${orientation.toUpperCase()} · ${Math.round(progress * 100)}%`, w * 0.96, bar / 2);
  ctx.textAlign = "left";

  // Placeholder watermark only in middle 5% of each act so it doesn't
  // dominate the storyboard read.
  if (tIn > 0.45 && tIn < 0.55) {
    ctx.fillStyle = `rgba(232,225,208,0.18)`;
    ctx.font = `italic ${Math.round(h * 0.018)}px "Inter Tight", sans-serif`;
    ctx.fillText("PLACEHOLDER — replace with Blender render", w * 0.04, h - bar - h * 0.03);
  }

  return canvas.toBuffer("image/webp", { quality: 0.78 });
}

function drawCrowd(ctx: CanvasRenderingContext2D, w: number, h: number, act: typeof ACTS[number], tIn: number) {
  const ROWS = 10;
  const horizon = h * 0.55;
  for (let row = ROWS - 1; row >= 0; row--) {
    const rowDepth = row / (ROWS - 1);
    const rowY = horizon - rowDepth * (h * 0.32);
    const headH = lerp(36, 9, rowDepth) * (h / 1080);
    const headW = headH * 0.7;
    const spacing = lerp(54, 22, rowDepth) * (w / 1920);
    const count = Math.ceil(w / spacing) + 4;
    const offset = (-spacing * count + w) / 2;

    let dissolve = 0;
    if (act.id === "voice") dissolve = clamp01((tIn - (1 - rowDepth)) * 2.5);
    if (act.id === "awakening") dissolve = 1 - clamp01(tIn * 1.3);

    for (let i = 0; i < count; i++) {
      const x = offset + i * spacing + (row % 2) * spacing / 2;
      const y = rowY + Math.sin((i + row) * 1.7) * 1.5;
      const standing = act.id === "awakening" && hash01(i * 31 + row) < clamp01(tIn * 1.4);
      const localHeadH = standing ? headH * 1.05 : headH;
      const localBody = standing ? headH * 1.2 : headH * 0.4;

      if (act.id === "voice" && dissolve > 0.9) continue;

      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.ellipse(x, y, headW * 0.5, localHeadH * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - headW * 0.85, y + localHeadH * 0.35, headW * 1.7, localBody);

      if (act.id === "awakening" && tIn > 0.2) {
        ctx.strokeStyle = `rgba(232,225,208,${0.55 * clamp01((tIn - 0.2) * 1.4)})`;
        ctx.lineWidth = Math.max(1, localHeadH * 0.08);
        ctx.beginPath();
        ctx.ellipse(x, y, headW * 0.5, localHeadH * 0.5, 0, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      }
    }
  }
}

function drawPodium(ctx: CanvasRenderingContext2D, w: number, h: number, tIn: number) {
  const px = w * 0.5;
  const py = h * 0.62;
  const pw = lerp(220, 320, tIn) * (w / 1920);
  const ph = lerp(120, 180, tIn) * (h / 1080);

  // Cone.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(px - 30, h * 0.05);
  ctx.lineTo(px + 30, h * 0.05);
  ctx.lineTo(px + pw * 0.9, py + ph * 0.4);
  ctx.lineTo(px - pw * 0.9, py + ph * 0.4);
  ctx.closePath();
  const g = ctx.createLinearGradient(px, h * 0.05, px, py + ph);
  g.addColorStop(0, "rgba(232,225,208,0)");
  g.addColorStop(0.5, "rgba(232,225,208,0.18)");
  g.addColorStop(1, "rgba(232,225,208,0.05)");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();

  // Block.
  const pg = ctx.createLinearGradient(px - pw / 2, py, px + pw / 2, py + ph);
  pg.addColorStop(0, "#1a1815");
  pg.addColorStop(1, "#070707");
  ctx.fillStyle = pg;
  ctx.fillRect(px - pw / 2, py, pw, ph);
  ctx.fillStyle = "rgba(232,225,208,0.3)";
  ctx.fillRect(px - pw / 2, py, pw, 4);
}

function drawStudent(ctx: CanvasRenderingContext2D, w: number, h: number, actId: string, tIn: number) {
  const px = w * 0.5;
  const py = h * 0.62;
  const headR = 22 * (h / 1080);
  const headY = py - 70 * (h / 1080);

  let bodyX = px;
  if (actId === "student") bodyX = lerp(px + 280, px, easeOutCubic(tIn));

  ctx.fillStyle = "#0d0d0c";
  ctx.beginPath();
  ctx.arc(bodyX, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(bodyX - 32, headY + headR - 4, 64, 80);
  ctx.fillRect(bodyX - 70, py + 6, 22, 14);
  ctx.fillRect(bodyX + 48, py + 6, 22, 14);

  const scarfOpacity = actId === "student" ? clamp01((tIn - 0.3) * 1.6) : 1;
  if (scarfOpacity > 0) {
    ctx.fillStyle = `rgba(255,67,50,${scarfOpacity})`;
    ctx.beginPath();
    ctx.moveTo(bodyX - 28, headY + headR);
    ctx.lineTo(bodyX + 28, headY + headR);
    ctx.lineTo(bodyX + 36, headY + headR + 26);
    ctx.lineTo(bodyX - 36, headY + headR + 26);
    ctx.closePath();
    ctx.fill();
  }
}

function drawShockwave(ctx: CanvasRenderingContext2D, w: number, h: number, tIn: number) {
  const ox = w * 0.5;
  const oy = h * 0.62 - 80;
  const maxR = Math.hypot(w, h) * 0.7;
  for (let i = 0; i < 4; i++) {
    const t = clamp01(tIn - i * 0.12);
    if (t <= 0) continue;
    const r = maxR * t;
    ctx.strokeStyle = `rgba(255,67,50,${0.4 * (1 - t) + 0.15})`;
    ctx.lineWidth = 2 + (1 - t) * 6;
    ctx.beginPath();
    ctx.arc(ox, oy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const hash01 = (s: number) => {
  const x = Math.sin(s * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// Suppress unused warnings — keep INK/TRUTH/NEWSPRINT exported for clarity.
void INK; void TRUTH; void NEWSPRINT;

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
