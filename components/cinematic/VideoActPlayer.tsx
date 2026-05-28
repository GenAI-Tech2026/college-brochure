"use client";
import { useEffect, useRef } from "react";

/**
 * Plays an .mp4/.webm clip as one act. Two modes:
 *  - autoplay (loops at native speed — for ambient "scene is alive" feel)
 *  - scrubbed (sets currentTime from progress 0..1)
 *
 * Falls back to muted+playsInline for iOS Safari autoplay.
 */
export function VideoActPlayer({
  src,
  durationSec,
  progress,
  autoplay = true,
  className,
}: {
  src: string;
  durationSec?: number;
  progress: number;
  autoplay?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (autoplay) {
      const play = () => {
        v.play().catch(() => {});
      };
      if (v.readyState >= 2) play();
      else v.addEventListener("loadeddata", play, { once: true });
      return () => v.removeEventListener("loadeddata", play);
    }
  }, [autoplay, src]);

  useEffect(() => {
    if (autoplay) return;
    const v = ref.current;
    if (!v || !durationSec) return;
    const t = Math.max(0, Math.min(durationSec, progress * durationSec));
    if (Math.abs(v.currentTime - t) > 0.04) v.currentTime = t;
  }, [progress, durationSec, autoplay]);

  return (
    <video
      ref={ref}
      src={src}
      muted
      playsInline
      loop={autoplay}
      preload="auto"
      aria-hidden
      className={"absolute inset-0 h-full w-full object-cover " + (className ?? "")}
    />
  );
}
