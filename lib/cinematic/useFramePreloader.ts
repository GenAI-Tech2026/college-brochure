"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Preload an image sequence and report progress. Returns once every frame
 * has decoded (Image.decode resolves) so the canvas player can draw without
 * blocking the main thread on first frame.
 */
export function useFramePreloader(urls: string[]): {
  ready: boolean;
  loaded: number;
  total: number;
  images: HTMLImageElement[];
} {
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(urls.length === 0);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    if (!urls.length) {
      setReady(true);
      return;
    }
    let cancelled = false;
    imagesRef.current = [];
    setLoaded(0);
    setReady(false);

    let done = 0;
    urls.forEach((url, i) => {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      img.onload = img.onerror = () => {
        if (cancelled) return;
        done += 1;
        setLoaded(done);
        if (done === urls.length) setReady(true);
      };
      imagesRef.current[i] = img;
    });

    return () => {
      cancelled = true;
    };
    // urls is a stable prop in practice (config is const); leave deps intentionally lax.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.length]);

  return {
    ready,
    loaded,
    total: urls.length,
    images: imagesRef.current,
  };
}
