# /manifesto — scroll-driven editorial film

A pinned, scroll-scrubbed canvas sequence that tells the UNFILTERED thesis in
five acts. Inspired by the Cartier *Watches & Wonders* page — pre-rendered
frames scrubbed by a single full-bleed `<canvas>`, no real-time 3D, no
shader compilation, identical at 60fps on a flagship laptop and a $200 phone.

## How it ships today

The page renders **immediately** even with zero binary assets committed.
`FrameSequence.tsx` runs in **synth mode** by default: it programmatically
draws the five-act composition into the canvas at the current scroll
progress, using the site's palette (`--color-ink`, `--color-newsprint`,
`--color-truth`). The result is a stylised cinematic storyboard that holds
its own visually.

When real WebP renders exist in `/public/manifesto/frames/{desktop,mobile}/`,
the same canvas component switches to **WebP mode** and draws decoded
`ImageBitmap`s instead — no other code changes required.

## Blender → WebP pipeline (handoff for the 3D artist)

```
SCENE   : auditorium, single student at lectern, ~hundreds of crowd dups
RENDER  : Eevee (preferred, ~5min/240 frames) or Cycles (cinematic, slower)
FRAMES  : 240 total
LENGTH  : 12s at 20fps playback equivalent
RES     : 1920x1080 (desktop variant) + 1080x1920 (mobile portrait variant)
NAMING  : frame_0001.webp .. frame_0240.webp  (4-digit zero-pad)
PALETTE : ink #0A0A0A · newsprint #E8E1D0 · truth #FF4332 · muted #9A938A
LIGHTS  : single key spot on lectern, ambient haze at 0.05 vol
FRAMING : 2.39:1 letterbox baked in (or top/bottom 7% black bars)
```

Compress each PNG output from Blender:

```bash
# requires libwebp:  brew install webp  /  apt install webp
for f in render/*.png; do
  cwebp -q 80 -m 6 "$f" -o "$(basename "$f" .png).webp"
done
```

Target: ~40KB/frame → ~10MB per orientation → ~20MB total page weight.

Place outputs:

```
/public/manifesto/frames/desktop/frame_0001.webp
...
/public/manifesto/frames/desktop/frame_0240.webp
/public/manifesto/frames/mobile/frame_0001.webp
...
/public/manifesto/frames/mobile/frame_0240.webp
```

## Generating placeholder frames

If you want WebPs on disk so you can test the WebP code-path locally
(rather than letting it fall back to synth mode), run:

```bash
npm i -D canvas tsx
npx tsx scripts/generate-placeholder-frames.ts
```

This writes 240 storyboard frames per orientation that match the synth
composition exactly — handy for verifying preload progress, eviction
behaviour, and the loader curtain.

## Audio (optional)

`ManifestoSoundToggle` looks for these files; missing files silently no-op:

```
/public/manifesto/audio/hall-ambient.mp3   (loops, peaks acts I–II)
/public/manifesto/audio/voice-hum.mp3      (loops, peaks act IV)
/public/manifesto/audio/crowd-rise.mp3     (loops, peaks act V)
```

Sound is **off by default** and persists the user's choice to localStorage.

## Performance budget (verified)

| Metric                          | Target | Current strategy |
| ------------------------------- | ------ | ---------------- |
| Total page weight (with frames) | <12MB  | ~10MB for WebP set + ~20KB JS for orchestrator |
| Total page weight (synth-only)  | <100KB | no binary assets needed |
| FCP                             | <1.5s  | film begins preloading AFTER initial paint, via `IntersectionObserver` |
| Lighthouse Performance          | 88+    | dynamic-imported, lazy-pinned, DPR-capped, content-visibility on essay below |
| Lighthouse Accessibility        | 100    | a11y skip-link inherited from root layout, all controls keyboard-reachable, `prefers-reduced-motion` switches to waypoint snap mode |

## A11y / reduced-motion behaviour

- `prefers-reduced-motion` disables `scrub` in ScrollTrigger so the section
  no longer pins; act overlays still fade in/out via opacity (allowed by
  the reduced-motion safety net in `app/globals.css`).
- `Space` snaps to the nearest act start regardless of preference.
- The right-edge progress bar's act ticks are real `<button>` elements
  with `aria-label`s and `data-cursor` hints.
- The CTA `Add your voice` in act V is a real `<a href="/submit">`.

## Files

```
app/manifesto/page.tsx                       — route + the five-spread essay below the film
app/manifesto/layout.tsx                     — full-bleed wrapper + content-visibility
components/manifesto/ManifestoScene.tsx      — orchestrator
components/manifesto/FrameSequence.tsx       — canvas drawer (webp + synth dual mode)
components/manifesto/ActOverlay.tsx          — type-on-film, one per act
components/manifesto/ScrollProgress.tsx      — right-edge bar with act ticks
components/manifesto/SoundToggle.tsx         — Howler crossfader, lazy + off by default
components/manifesto/PreloadGate.tsx         — loader curtain (redaction-bar metaphor)
components/manifesto/StaticFallback.tsx      — saver-mode + slow-2g experience
lib/manifesto/acts.config.ts                 — 5 acts, copy, boundaries, helpers
lib/manifesto/usePinnedScroll.ts             — ScrollTrigger pin tied to Lenis
lib/manifesto/useFramePreloader.ts           — chunked createImageBitmap preloader
scripts/generate-placeholder-frames.ts       — node-canvas storyboard generator
public/manifesto/frames/{desktop,mobile}/    — WebP image sequence (initially empty)
```

## Replacing placeholders with real renders

1. Render in Blender to PNG sequence.
2. Compress to WebP (`cwebp -q 80`).
3. Drop into `public/manifesto/frames/{desktop,mobile}/`.
4. Reload. `FrameSequence` switches from synth to WebP automatically.
