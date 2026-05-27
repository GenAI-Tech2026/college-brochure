"use client";
/**
 * Manifesto SoundToggle — wraps the site-wide useSoundStore and additionally
 * starts/stops the ambient layered hall reverb tied to scroll progress.
 *
 * Sound files are *expected* paths under /public/manifesto/audio/. If they
 * 404 (none committed by default) we keep the toggle visually working but
 * silently skip playback — better to show a polished UI than to throw.
 *
 * Persistence: useSoundStore is in-memory; we additionally write the user's
 * choice to localStorage so the second visit honours it.
 */
import { useEffect, useRef } from "react";
import { useSoundStore } from "@/lib/store/filterStore";
import { cn } from "@/lib/utils/cn";

const STORAGE_KEY = "unfiltered:manifesto-sound";

interface SoundToggleProps {
  /** 0..1 scroll progress; used to crossfade ambient layers. */
  progress: number;
}

export function ManifestoSoundToggle({ progress }: SoundToggleProps) {
  const { enabled, toggle } = useSoundStore();
  const progressRef = useRef(progress);
  progressRef.current = progress;

  // Restore preference on mount.
  useEffect(() => {
    const stored = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY);
    if (stored === "on" && !enabled) toggle();
    // intentional: only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist any change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  }, [enabled]);

  // Lazy-load Howler only after the user opts in.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let howls: { stop: () => void; unload: () => void; volume: (v: number) => void }[] = [];
    let raf = 0;

    (async () => {
      try {
        const { Howl, Howler } = await import("howler");
        const ctx = (Howler as { ctx?: AudioContext }).ctx;
        if (ctx && ctx.state === "suspended") await ctx.resume();
        if (cancelled) return;

        // Four layers — ambient, footsteps, hum, crowd. Mute fallback if missing.
        const sources = [
          { src: "/manifesto/audio/hall-ambient.mp3", weight: 1 - progressRef.current },
          { src: "/manifesto/audio/voice-hum.mp3", weight: 0 },
          { src: "/manifesto/audio/crowd-rise.mp3", weight: 0 },
        ];

        howls = sources.map(
          (s) => new Howl({ src: [s.src], loop: true, volume: 0, html5: false, preload: true }),
        );
        howls.forEach((h) => h.volume(0));
        howls.forEach((h) => h && (h as unknown as { play: () => void }).play());

        // Crossfade per-act based on progress.
        const tick = () => {
          if (cancelled) return;
          const p = progressRef.current;
          // ambient: peaks acts I–II, fades thereafter
          howls[0]?.volume(clamp01(1 - p * 1.3) * 0.5);
          // hum: peaks act IV
          howls[1]?.volume(bell(p, 0.62, 0.18) * 0.65);
          // crowd: peaks act V
          howls[2]?.volume(clamp01((p - 0.7) * 3) * 0.55);
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // No audio files committed → silently no-op.
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      howls.forEach((h) => {
        try {
          h.stop();
          h.unload();
        } catch {
          /* ignore */
        }
      });
    };
  }, [enabled]);

  return (
    <button
      onClick={toggle}
      aria-label={enabled ? "Mute manifesto sound" : "Enable manifesto sound"}
      data-cursor="link"
      className="pointer-events-auto flex items-center gap-2 border border-newsprint/20 bg-ink/40 px-3 py-2 font-mono text-meta uppercase tracking-[0.25em] text-newsprint backdrop-blur-sm transition-colors hover:border-newsprint/60"
    >
      <span aria-hidden className="inline-flex gap-[2px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "block w-[2px] bg-current transition-all",
              enabled ? "h-3 animate-pulse" : "h-1 opacity-30",
            )}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      <span>{enabled ? "Sound on" : "Sound off"}</span>
    </button>
  );
}

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}
/** Gaussian-shaped 0..1 bell centred at `centre` with `width`. */
function bell(x: number, centre: number, width: number) {
  const d = (x - centre) / width;
  return Math.exp(-d * d);
}
