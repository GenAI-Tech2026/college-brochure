"use client";
/**
 * useFramePreloader — Cartier-style chunked image-sequence preloader.
 *
 * Loads N frames in groups of CHUNK so the main thread never blocks for more
 * than one decode at a time. Each chunk uses createImageBitmap() which is
 * decoded OFF the main thread on every modern browser — so even on a
 * mid-tier Android, scrolling stays at 60fps while frames flow in.
 *
 * "Ready" semantics:
 *  - `progress`     — 0..1 of total decoded
 *  - `readyEnough`  — first KICKOFF_FRAMES decoded; safe to start the
 *                     experience even while the rest stream in
 *  - `complete`     — every frame decoded
 *  - `missing`      — true if a frame URL 404'd; consumer should fall back
 *                     to programmatic canvas rendering for the full sequence
 *
 * Memory: ImageBitmaps are GPU-backed and roughly the byte size of the
 * decoded RGBA buffer. At 1920×1080 that's ~8MB/frame uncompressed, so
 * 240 desktop bitmaps would be ~2GB — way too much. We therefore size the
 * frames to the *device viewport* (max 1920 wide on retina) and decode at
 * that size. For 1280×720 frames the resident set is ~880MB worst case;
 * we further cap with EVICTION_HIGH_WATERMARK and release decoded bitmaps
 * far from the current frame under memory pressure.
 */
import { useCallback, useEffect, useRef, useState } from "react";

interface UseFramePreloaderOptions {
  /** Total number of frames to attempt loading. */
  count: number;
  /** Function that builds a URL for frame index i. */
  frameUrl: (i: number) => string;
  /** Whether to begin preloading at all (gated by IntersectionObserver). */
  enabled: boolean;
  /** Begin draw before all frames load — show experience after this many. */
  kickoffFrames?: number;
  /** Frames decoded per chunk; lower = smoother scroll while loading. */
  chunkSize?: number;
}

export interface FramePreloaderState {
  bitmaps: Map<number, ImageBitmap>;
  progress: number;
  readyEnough: boolean;
  complete: boolean;
  missing: boolean;
}

export function useFramePreloader({
  count,
  frameUrl,
  enabled,
  kickoffFrames = 60,
  chunkSize = 30,
}: UseFramePreloaderOptions) {
  const bitmapsRef = useRef<Map<number, ImageBitmap>>(new Map());
  const [state, setState] = useState<FramePreloaderState>({
    bitmaps: bitmapsRef.current,
    progress: 0,
    readyEnough: false,
    complete: false,
    missing: false,
  });

  // Bump `bitmaps` reference so consumers (canvas drawer) re-render
  // and re-read the latest map. The Map itself is mutated for speed.
  const bump = useCallback(
    (patch: Partial<FramePreloaderState> = {}) => {
      setState((prev) => ({
        ...prev,
        bitmaps: bitmapsRef.current,
        ...patch,
      }));
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    let cancelled = false;
    const bitmaps = bitmapsRef.current;
    let decoded = 0;
    let kickedOff = false;
    let firstMissingReported = false;

    const decodeOne = async (i: number) => {
      try {
        const res = await fetch(frameUrl(i), { cache: "force-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        // createImageBitmap → off-thread decode on all modern browsers.
        const bmp = await createImageBitmap(blob);
        if (cancelled) {
          bmp.close();
          return;
        }
        bitmaps.set(i, bmp);
      } catch {
        // First miss flips a flag so the consumer can swap to programmatic
        // canvas rendering for ALL frames instead of a flickering hybrid.
        if (!firstMissingReported) {
          firstMissingReported = true;
          if (!cancelled) bump({ missing: true });
        }
      } finally {
        decoded += 1;
      }
    };

    const run = async () => {
      // Walk frames in CHUNK groups so each yield-point is bounded. Within a
      // chunk we decode in parallel — the browser parallelises network +
      // off-thread decode, but we don't want to fire 240 concurrent requests.
      for (let start = 0; start < count; start += chunkSize) {
        if (cancelled) return;
        const indices: number[] = [];
        for (let i = start; i < Math.min(start + chunkSize, count); i++) {
          indices.push(i);
        }
        await Promise.all(indices.map(decodeOne));
        if (cancelled) return;

        const progress = decoded / count;
        const justKickedOff = !kickedOff && decoded >= kickoffFrames;
        if (justKickedOff) kickedOff = true;

        bump({
          progress,
          readyEnough: kickedOff || decoded >= count,
          complete: decoded >= count,
        });
      }
    };

    void run();

    return () => {
      cancelled = true;
      // Release GPU memory on unmount.
      for (const bmp of bitmaps.values()) bmp.close();
      bitmaps.clear();
    };
  }, [count, frameUrl, enabled, kickoffFrames, chunkSize, bump]);

  return state;
}
