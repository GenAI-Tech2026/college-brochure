"use client";
/**
 * Tiny Howler wrapper for cinematic ambient loops. One sound at a time.
 * Calls to `play(url)` crossfade from any currently-playing sound; off()
 * stops everything. Gated by a user opt-in toggle — never autoplays.
 */

type HowlInstance = {
  play: () => void;
  stop: () => void;
  fade: (from: number, to: number, ms: number) => void;
  volume: (v?: number) => number | unknown;
  loop: (b: boolean) => void;
  unload: () => void;
};

type HowlConstructor = new (opts: {
  src: string[];
  loop?: boolean;
  volume?: number;
  html5?: boolean;
}) => HowlInstance;

let HowlImpl: HowlConstructor | null = null;
let active: { url: string; howl: HowlInstance } | null = null;
let enabled = false;

async function loadHowl() {
  if (HowlImpl) return HowlImpl;
  const mod = await import("howler");
  HowlImpl = (mod as { Howl: HowlConstructor }).Howl;
  return HowlImpl;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (!on && active) {
    active.howl.fade(Number(active.howl.volume()) || 0.6, 0, 400);
    setTimeout(() => active?.howl.stop(), 450);
    active = null;
  }
}

export function isSoundEnabled() {
  return enabled;
}

export async function play(url: string, volume = 0.6) {
  if (!enabled || !url) return;
  if (active && active.url === url) return;
  const H = await loadHowl();
  // fade-out previous
  if (active) {
    const prev = active;
    prev.howl.fade(Number(prev.howl.volume()) || volume, 0, 600);
    setTimeout(() => prev.howl.stop(), 650);
  }
  const next = new H({ src: [url], loop: true, volume: 0, html5: true });
  next.play();
  next.fade(0, volume, 800);
  active = { url, howl: next };
}

export function stop() {
  if (!active) return;
  active.howl.fade(Number(active.howl.volume()) || 0.6, 0, 400);
  setTimeout(() => active?.howl.stop(), 450);
  active = null;
}
