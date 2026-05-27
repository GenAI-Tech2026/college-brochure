"use client";
/**
 * FrameSequence — the single full-bleed <canvas> that *is* the film.
 *
 * Two modes, switched seamlessly:
 *
 *  1. WEBP MODE — when real Blender renders exist in /public/manifesto/frames/*,
 *     we draw the nearest preloaded ImageBitmap to the canvas. This is the
 *     Cartier method: zero shaders, zero geometry, just `ctx.drawImage`.
 *
 *  2. SYNTH MODE — when frames 404 (or before they finish loading), we
 *     compose the scene PROGRAMMATICALLY on the same canvas using paths,
 *     gradients, and noise. It uses the exact site palette tokens so the
 *     placeholder doesn't look like a placeholder — it looks like editorial
 *     storyboarding that ships.
 *
 * All synth dimensions are derived from `min(w,h)` so the scene feels
 * cinematic at any viewport — no microscopic 22-pixel-tall student on a
 * 1440px canvas.
 */
import { useEffect, useRef } from "react";
import {
  ACTS,
  actAt,
  FRAME_COUNT,
  frameAt,
  progressWithinAct,
  type Act,
} from "@/lib/manifesto/acts.config";

const INK = "#0A0A0A";
const REDACTION = "#050505";
const TRUTH = "#FF4332";

interface FrameSequenceProps {
  progress: number;
  bitmaps: Map<number, ImageBitmap>;
  /** When true we skip WebP mode entirely and synthesise. */
  forceSynth: boolean;
}

export function FrameSequence({ progress, bitmaps, forceSynth }: FrameSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  const bitmapsRef = useRef(bitmaps);
  const forceSynthRef = useRef(forceSynth);
  const rafRef = useRef(0);
  const lastDrawnFrameRef = useRef(-1);

  progressRef.current = progress;
  bitmapsRef.current = bitmaps;
  forceSynthRef.current = forceSynth;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const setSize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastDrawnFrameRef.current = -1;
    };
    setSize();
    window.addEventListener("resize", setSize);

    const draw = () => {
      const p = progressRef.current;
      const map = bitmapsRef.current;
      const synth = forceSynthRef.current;
      const frame = frameAt(p);

      if (!synth && frame === lastDrawnFrameRef.current && map.has(frame)) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      lastDrawnFrameRef.current = frame;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (!synth) {
        const bmp = nearestBitmap(map, frame);
        if (bmp) {
          drawCover(ctx, bmp, w, h);
          rafRef.current = requestAnimationFrame(draw);
          return;
        }
      }

      drawSyntheticScene(ctx, w, h, p);
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", setSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      data-cursor="text"
      data-cursor-label="LISTEN"
      className="block h-full w-full"
    />
  );
}

/* ─────────────────────── helpers ─────────────────────── */

function nearestBitmap(map: Map<number, ImageBitmap>, target: number): ImageBitmap | null {
  if (map.has(target)) return map.get(target)!;
  for (let d = 1; d < FRAME_COUNT; d++) {
    if (map.has(target - d)) return map.get(target - d)!;
    if (map.has(target + d)) return map.get(target + d)!;
  }
  return null;
}

function drawCover(ctx: CanvasRenderingContext2D, bmp: ImageBitmap, w: number, h: number) {
  const br = bmp.width / bmp.height;
  const cr = w / h;
  let sx = 0, sy = 0, sw = bmp.width, sh = bmp.height;
  if (br > cr) {
    sw = bmp.height * cr;
    sx = (bmp.width - sw) / 2;
  } else {
    sh = bmp.width / cr;
    sy = (bmp.height - sh) / 2;
  }
  ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h);
}

/* ─────────────────────── synthetic renderer ─────────────────────── */

function drawSyntheticScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: number,
) {
  const act = actAt(p);
  const t = progressWithinAct(p, act);
  // Single scale unit so every primitive grows with the viewport.
  const U = Math.min(w, h) / 100; // 1U ≈ 1% of the shorter side

  ctx.fillStyle = REDACTION;
  ctx.fillRect(0, 0, w, h);

  paintHaze(ctx, w, h, act, U);
  paintCrowd(ctx, w, h, act, t, p, U);

  if (act.id !== "crowd") paintPodium(ctx, w, h, act, t, U);
  if (act.id === "student" || act.id === "voice" || act.id === "awakening") {
    paintStudent(ctx, w, h, act, t, U);
  }
  if (act.id === "voice") paintShockwave(ctx, w, h, t, U);
  if (act.id === "awakening") paintAwakeningRim(ctx, w, h, t, U);

  paintGrain(ctx, w, h);

  // Cinematic letterbox.
  const bar = Math.max(40, h * 0.06);
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, bar);
  ctx.fillRect(0, h - bar, w, bar);
}

function paintHaze(ctx: CanvasRenderingContext2D, w: number, h: number, act: Act, U: number) {
  const cx = w * 0.5;
  // Camera descends across acts. Spotlight target.
  const cyByAct: Record<string, number> = {
    crowd:     h * 0.22,
    podium:    h * 0.45,
    student:   h * 0.55,
    voice:     h * 0.55,
    awakening: h * 0.40,
  };
  const cy = cyByAct[act.id];
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h));
  grad.addColorStop(0,   "rgba(232,225,208,0.30)");
  grad.addColorStop(0.3, "rgba(232,225,208,0.08)");
  grad.addColorStop(1,   "rgba(10,10,10,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  void U;
}

function paintCrowd(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  act: Act,
  t: number,
  globalP: number,
  U: number,
) {
  // 11 rows receding into z-space. Sizes scale with viewport (U).
  const ROWS = 11;
  const horizon = h * 0.62;

  for (let row = ROWS - 1; row >= 0; row--) {
    const rowDepth = row / (ROWS - 1); // 0 front → 1 back
    const rowY = horizon - rowDepth * (h * 0.34);
    const headH = lerp(7.5 * U, 1.6 * U, rowDepth);
    const headW = headH * 0.72;
    const spacing = lerp(11 * U, 3.6 * U, rowDepth);
    const count = Math.ceil(w / spacing) + 4;
    const offset = (-spacing * count + w) / 2;

    let dissolve = 0;
    if (act.id === "voice") {
      const waveFront = t;
      // Front rows die LAST (wave radiates from student → back rows first).
      dissolve = clamp01((waveFront - (1 - rowDepth)) * 2.5);
    }
    if (act.id === "awakening") {
      dissolve = 1 - clamp01(t * 1.4);
    }

    for (let i = 0; i < count; i++) {
      const x = offset + i * spacing + ((row % 2) * spacing) / 2;
      const seedY = Math.sin((i + row) * 1.7) * 1.2;
      const y = rowY + seedY;

      const standing = act.id === "awakening" && hash01(i * 31 + row) < clamp01(t * 1.6);
      const localHeadH = standing ? headH * 1.08 : headH;
      const localBodyExtra = standing ? headH * 1.8 : headH * 0.5;

      if (act.id === "voice" && dissolve > 0.05) {
        paintDust(ctx, x, y, headW * 0.7, dissolve, U);
        if (dissolve > 0.9) continue;
      }

      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.ellipse(x, y, headW * 0.5, localHeadH * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - headW * 0.85, y + localHeadH * 0.35, headW * 1.7, localBodyExtra);

      // Awakening rim-light → cream wash on facing faces.
      if (act.id === "awakening" && t > 0.15) {
        const rim = clamp01((t - 0.15) * 1.6);
        // Warm face wash (subtle fill, not just outline).
        ctx.fillStyle = `rgba(232,225,208,${0.18 * rim})`;
        ctx.beginPath();
        ctx.ellipse(x, y, headW * 0.45, localHeadH * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(232,225,208,${0.7 * rim})`;
        ctx.lineWidth = Math.max(1, localHeadH * 0.09);
        ctx.beginPath();
        ctx.ellipse(x, y, headW * 0.5, localHeadH * 0.5, 0, Math.PI * 0.18, Math.PI * 0.82);
        ctx.stroke();
      }
    }

    if (act.id === "crowd" && row > 4) {
      paintDriftParticles(ctx, w, rowY, globalP, row);
    }
  }
}

function paintPodium(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  act: Act,
  t: number,
  U: number,
) {
  const px = w * 0.5;
  const py = h * 0.66;
  // Podium grows with U so it reads on phone or 4K.
  const podW = lerp(28 * U, 38 * U, act.id === "podium" ? t : 1);
  const podH = lerp(14 * U, 18 * U, act.id === "podium" ? t : 1);

  // Volumetric spotlight cone from high above the lectern.
  const coneTopY = -2 * U;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(px - 3 * U, coneTopY);
  ctx.lineTo(px + 3 * U, coneTopY);
  ctx.lineTo(px + podW * 1.1, py + podH * 0.5);
  ctx.lineTo(px - podW * 1.1, py + podH * 0.5);
  ctx.closePath();
  const cone = ctx.createLinearGradient(px, coneTopY, px, py + podH);
  const spotInt = act.id === "podium" ? 0.6 + t * 0.4 : 1;
  cone.addColorStop(0,   "rgba(232,225,208,0)");
  cone.addColorStop(0.4, `rgba(232,225,208,${0.32 * spotInt})`);
  cone.addColorStop(1,   `rgba(232,225,208,${0.10 * spotInt})`);
  ctx.fillStyle = cone;
  ctx.fill();
  ctx.restore();

  // Hot spot on the lectern top.
  const hot = ctx.createRadialGradient(px, py + 1.5 * U, 0, px, py + 1.5 * U, podW * 0.7);
  hot.addColorStop(0,   `rgba(232,225,208,${0.55 * spotInt})`);
  hot.addColorStop(0.8, "rgba(232,225,208,0)");
  ctx.fillStyle = hot;
  ctx.fillRect(px - podW, py - 1 * U, podW * 2, podH * 0.6);

  // Wooden podium block.
  const pg = ctx.createLinearGradient(px - podW / 2, py, px + podW / 2, py + podH);
  pg.addColorStop(0, "#1c1917");
  pg.addColorStop(1, "#070707");
  ctx.fillStyle = pg;
  ctx.fillRect(px - podW / 2, py, podW, podH);

  // Top edge catches light.
  ctx.fillStyle = `rgba(232,225,208,${0.4 * spotInt})`;
  ctx.fillRect(px - podW / 2, py, podW, Math.max(2, 0.4 * U));

  if (act.id === "podium") {
    ctx.save();
    ctx.font = `${Math.round(1.1 * U)}px ui-monospace, "JetBrains Mono", monospace`;
    ctx.fillStyle = `rgba(232,225,208,${0.55 * t})`;
    ctx.textAlign = "center";
    ctx.fillText("LECTERN · UNOCCUPIED", px, py + podH + 2.4 * U);
    ctx.restore();
  }
}

function paintStudent(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  act: Act,
  t: number,
  U: number,
) {
  const px = w * 0.5;
  const py = h * 0.66;
  // Student is dramatically larger now — head ~3.5U, body extends well below.
  const headR = 3.2 * U;
  const headY = py - 6.5 * U;

  let bodyX = px;
  if (act.id === "student") {
    bodyX = lerp(px + 24 * U, px, easeOutCubic(t));
  }

  // Slight rim-light from the spotlight above.
  const rimFill = ctx.createLinearGradient(bodyX, headY - headR, bodyX, headY + 10 * U);
  rimFill.addColorStop(0, "#1a1a18");
  rimFill.addColorStop(1, "#080807");

  // Head.
  ctx.fillStyle = rimFill;
  ctx.beginPath();
  ctx.arc(bodyX, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  // Subtle highlight edge.
  ctx.strokeStyle = "rgba(232,225,208,0.18)";
  ctx.lineWidth = Math.max(1, 0.15 * U);
  ctx.beginPath();
  ctx.arc(bodyX, headY, headR, Math.PI * 0.15, Math.PI * 0.6);
  ctx.stroke();

  // Torso.
  ctx.fillStyle = "#0c0c0b";
  ctx.fillRect(bodyX - 4.5 * U, headY + headR - 0.5 * U, 9 * U, 10 * U);

  // Hands on lectern edges.
  ctx.fillRect(bodyX - 11 * U, py + 0.5 * U, 3.2 * U, 2 * U);
  ctx.fillRect(bodyX + 7.8 * U, py + 0.5 * U, 3.2 * U, 2 * U);

  // Truth-Red scarf — only accent in the frame.
  const scarfO = act.id === "student" ? clamp01((t - 0.25) * 1.8) : 1;
  if (scarfO > 0) {
    ctx.fillStyle = `rgba(255,67,50,${scarfO})`;
    ctx.beginPath();
    ctx.moveTo(bodyX - 4.2 * U, headY + headR - 0.2 * U);
    ctx.lineTo(bodyX + 4.2 * U, headY + headR - 0.2 * U);
    ctx.lineTo(bodyX + 5.0 * U, headY + headR + 3.6 * U);
    ctx.lineTo(bodyX - 5.0 * U, headY + headR + 3.6 * U);
    ctx.closePath();
    ctx.fill();
    // Trailing end whips in IV+V.
    if (act.id === "voice" || act.id === "awakening") {
      ctx.beginPath();
      ctx.moveTo(bodyX + 4.5 * U, headY + headR + 2.5 * U);
      ctx.quadraticCurveTo(bodyX + 12 * U, headY + headR + 4 * U, bodyX + 14 * U, headY + headR + 11 * U);
      ctx.lineTo(bodyX + 11 * U, headY + headR + 10 * U);
      ctx.quadraticCurveTo(bodyX + 9 * U, headY + headR + 5.5 * U, bodyX + 3 * U, headY + headR + 3.5 * U);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function paintShockwave(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  U: number,
) {
  const ox = w * 0.5;
  const oy = h * 0.66 - 9 * U; // mouth level
  const maxR = Math.hypot(w, h) * 0.9;
  for (let i = 0; i < 5; i++) {
    const ringT = clamp01(t - i * 0.10);
    if (ringT <= 0) continue;
    const rr = maxR * ringT;
    ctx.strokeStyle = `rgba(255,67,50,${0.45 * (1 - ringT) + 0.18})`;
    ctx.lineWidth = Math.max(2, (3 + (1 - ringT) * 6) * (U / 8));
    ctx.beginPath();
    ctx.arc(ox, oy, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Red word fragments flying outward.
  const fragments = 80;
  for (let i = 0; i < fragments; i++) {
    const ang = (i / fragments) * Math.PI * 2 + t * 0.6;
    const frT = (t + (i % 7) * 0.06) % 1;
    const fr = maxR * frT * 0.9;
    const fx = ox + Math.cos(ang) * fr;
    const fy = oy + Math.sin(ang) * fr * 0.65;
    const alpha = (1 - frT) * 0.95;
    ctx.fillStyle = `rgba(255,67,50,${alpha})`;
    ctx.fillRect(fx - 0.8 * U, fy - 0.18 * U, 1.6 * U + (1 - frT) * 1.6 * U, 0.36 * U);
  }
  void TRUTH;
}

function paintAwakeningRim(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  U: number,
) {
  // Warm cream wash from above — the room IS lit now.
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0,   `rgba(232,225,208,${0.28 * t})`);
  wash.addColorStop(0.5, `rgba(232,225,208,${0.10 * t})`);
  wash.addColorStop(1,   "rgba(232,225,208,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  void U;
}

function paintDust(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  spread: number,
  intensity: number,
  U: number,
) {
  const count = Math.floor(12 * intensity);
  for (let i = 0; i < count; i++) {
    const a = hash01(i * 7 + Math.floor(x)) * Math.PI * 2;
    const r = hash01(i * 11 + Math.floor(y)) * spread * (0.5 + intensity);
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    ctx.fillStyle = `rgba(255,67,50,${0.4 * (1 - intensity)})`;
    ctx.fillRect(px, py, Math.max(1, 0.15 * U), Math.max(1, 0.15 * U));
  }
}

function paintDriftParticles(
  ctx: CanvasRenderingContext2D,
  w: number,
  baseY: number,
  globalP: number,
  rowSeed: number,
) {
  ctx.fillStyle = "rgba(232,225,208,0.12)";
  for (let i = 0; i < 22; i++) {
    const seed = (i * 9301 + rowSeed * 49297) % 233280;
    const x = ((seed / 233280) * w + globalP * 60 * (rowSeed + 1)) % w;
    const y = baseY - 6 - ((seed % 7) + Math.sin(globalP * 8 + i) * 3);
    ctx.fillRect(x, y, 1, 1);
  }
}

function paintGrain(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "rgba(232,225,208,0.025)";
  for (let i = 0; i < (w * h) / 360; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    ctx.fillRect(x, y, 1, 1);
  }
}

/* ─────────────────────── math ─────────────────────── */
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}
function hash01(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

void ACTS;
