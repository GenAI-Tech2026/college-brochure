"use client";
import { useEffect, useRef } from "react";
import { useFramePreloader } from "@/lib/cinematic/useFramePreloader";

/**
 * Canvas frame-sequence renderer.
 *
 * Given a public path template like `/cinematic/foo/act1/frame_{i}.webp` and
 * a frame count, preloads every frame and draws the one at `progress`. Used
 * for the scroll-scrubbed acts on /manifesto and /verified once real frames
 * exist.
 */
export function FrameSequencePlayer({
  pathTemplate,
  frameCount,
  pad = 4,
  progress,
  className,
}: {
  pathTemplate: string;
  frameCount: number;
  pad?: number;
  /** 0..1 within this act. */
  progress: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const urls = useMemoUrls(pathTemplate, frameCount, pad);
  const { images, ready } = useFramePreloader(urls);

  useEffect(() => {
    if (!ready) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const idx = Math.min(
      frameCount - 1,
      Math.max(0, Math.floor(progress * frameCount)),
    );
    const img = images[idx];
    if (!img) return;

    const dpr = window.devicePixelRatio || 1;
    if (c.width !== c.clientWidth * dpr || c.height !== c.clientHeight * dpr) {
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const cw = c.clientWidth;
    const ch = c.clientHeight;
    const ratio = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * ratio;
    const dh = img.naturalHeight * ratio;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }, [ready, progress, frameCount, images]);

  return (
    <canvas
      ref={canvasRef}
      className={"absolute inset-0 h-full w-full " + (className ?? "")}
      aria-hidden
    />
  );
}

function useMemoUrls(template: string, count: number, pad: number) {
  const ref = useRef<string[]>([]);
  if (ref.current.length !== count) {
    ref.current = Array.from({ length: count }, (_, i) =>
      template.replace("{i}", String(i + 1).padStart(pad, "0")),
    );
  }
  return ref.current;
}
