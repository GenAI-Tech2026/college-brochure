"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Page-level cinematic background — the "going through the brochure" footage,
 * fixed behind the whole home page and *scroll-scrubbed*: the video timeline is
 * tied to scroll position, so the footage reveals frame-by-frame as you descend.
 * It never auto-plays. The footage reveals once, scrubbing across the hero + the
 * two transparent spacer screens; every section below is opaque, so the video is
 * never seen again past that point.
 *
 * Why this is smooth: the clip is encoded all-intra (every frame a keyframe), so
 * seeking to any `currentTime` is instant — no GOP decode stutter.
 *
 * Layering (painted above the html ink canvas, below all content):
 *   poster <img>  → instant LCP paint, no layout shift
 *   <video>       → first frame fades in once decoded
 *   base scrim    → ink gradient + vignette so foreground text stays legible
 *
 * Motion discipline:
 *   - Poster is the LCP asset; the video never blocks first paint.
 *   - The scrub target is lerped on a rAF loop that parks itself once settled,
 *     so we don't burn the main thread / battery while idle.
 *   - prefers-reduced-motion → poster only, the video is never mounted.
 */
export function ScrollVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [allowMotion, setAllowMotion] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAllowMotion(true);
  }, []);

  useEffect(() => {
    if (!allowMotion) return;
    const video = videoRef.current;
    if (!video) return;

    let raf = 0;
    let current = 0; // currently-rendered time
    let target = 0; // scroll-derived target time
    let lastSet = -1;

    // Single reveal: scrub across the hero + the two transparent spacer screens,
    // completing as the first opaque section (#receipts) arrives. Everything
    // below is opaque, so the footage holds (unseen) on its last frame.
    const scrollTarget = () => {
      const dur = video.duration || 0;
      const receipts = document.getElementById("receipts");
      const revealEnd = receipts
        ? receipts.getBoundingClientRect().top + window.scrollY
        : window.innerHeight;
      const p = revealEnd > 0 ? Math.min(1, Math.max(0, window.scrollY / revealEnd)) : 1;
      return p * dur;
    };

    const tick = () => {
      const dur = video.duration;
      if (!dur || Number.isNaN(dur)) {
        raf = 0;
        return;
      }
      // Ease toward the scroll target; clamp tiny deltas to settle.
      current += (target - current) * 0.12;
      if (Math.abs(target - current) < 0.004) current = target;
      // Only seek when the frame actually changed (~half a frame @ 24fps).
      if (Math.abs(current - lastSet) > 1 / 48) {
        video.currentTime = current;
        lastSet = current;
      }
      raf = current === target ? 0 : requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = scrollTarget();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMeta = () => {
      target = scrollTarget();
      current = target;
      lastSet = -1;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    video.addEventListener("loadedmetadata", onMeta);
    if (video.readyState >= 1) onMeta();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [allowMotion]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Poster — LCP paint, always present as the base layer. */}
      <img
        src="/videos/brochure-bg-poster.webp"
        alt=""
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {allowMotion && (
        <video
          ref={videoRef}
          poster="/videos/brochure-bg-poster.webp"
          muted
          playsInline
          preload="auto"
          onLoadedData={() => setReady(true)}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
          style={{ opacity: ready ? 1 : 0 }}
        >
          <source src="/videos/brochure-bg.mp4" type="video/mp4" />
        </video>
      )}

      {/* Scrim — anchors top (nav) and bottom (section seam) plus a soft vignette
          so the footage never competes with foreground text. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(to top, var(--color-ink) 0%, rgba(10,10,10,0.30) 22%, rgba(10,10,10,0) 50%, rgba(10,10,10,0.40) 100%)",
            "radial-gradient(120% 90% at 50% 42%, rgba(10,10,10,0) 58%, rgba(10,10,10,0.45) 100%)",
          ].join(", "),
        }}
      />
    </div>
  );
}
