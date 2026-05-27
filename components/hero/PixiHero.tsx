"use client";
import { useEffect, useRef } from "react";

/**
 * PixiJS v8 hero — the "tearing brochure" effect.
 *
 * What the canvas does, top-to-bottom:
 * 1) Builds a paper-cream RenderTexture sized to viewport. Onto it we draw
 *    a procedural "glossy brochure cover" — large serif text, color blocks,
 *    a noise overlay so it doesn't look like flat CSS.
 * 2) Wraps that texture in a Sprite, then applies a DisplacementFilter
 *    driven by a second perlin-style noise texture that we generate from
 *    a Pixi Graphics rasterisation. The displacement scale is bound to
 *    scrollY normalised against viewport height — as the user scrolls,
 *    the brochure "tears" along the noise field.
 * 3) Adds floating "torn shred" sprites which lerp upward + fade out on
 *    scroll, exposing a redaction-red background behind them.
 *
 * Why not Three.js: this entire effect is 2D — a displacement shader on
 * one sprite. Pixi's filter chain ships it in ~140 KB; the equivalent
 * Three+postprocessing stack is 600 KB+ and 3x boot time.
 *
 * Reduced-motion: if the user prefers reduced motion, we skip Pixi
 * entirely and render a static CSS facsimile.
 */
export function PixiHero() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !host.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let destroyed = false;
    let cleanup: (() => void) | undefined;

    const init = async () => {
      // Pre-flight WebGL probe. Pixi v8 has no CanvasRenderer fallback —
      // on machines without WebGL (headless test runners, locked-down
      // browsers) the import itself throws. We probe cheaply first and
      // bail to the CSS gradient if there's no GPU context to be had.
      try {
        const probe = document.createElement("canvas");
        const gl = probe.getContext("webgl2") || probe.getContext("webgl");
        if (!gl) return;
      } catch { return; }

      let PIXI: typeof import("pixi.js");
      try {
        PIXI = await import("pixi.js");
      } catch { return; }
      if (destroyed || !host.current) return;

      const app = new PIXI.Application();
      try {
        await app.init({
          resizeTo: host.current,
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio, 2),
        });
      } catch {
        // WebGL context creation refused — silently keep the CSS gradient.
        return;
      }
      host.current.appendChild(app.canvas);
      app.canvas.style.display = "block";
      app.canvas.style.width = "100%";
      app.canvas.style.height = "100%";
      app.canvas.setAttribute("aria-hidden", "true");

      const W = () => app.renderer.width;
      const H = () => app.renderer.height;

      /* ──── 1) PURE-INK BACKDROP + SHRED LAYER ─────────────────────────
       * The previous version put CREAM paper strips on top of the dark
       * backdrop. The DOM headline is also cream, so the headline mixed
       * INTO the cream paper — the user saw cream-on-cream confusion.
       *
       * The new design: the canvas stays ink-dark from edge to edge. The
       * shred-eruption + grain do the tearing work. The headline (DOM,
       * cream-on-ink) is now always on a properly dark surface and
       * legibility is guaranteed at every scroll position. The HEADLINE
       * itself tears via GSAP — see Hero.tsx — so the words do the work
       * the cream paper used to do, with proper contrast. */

      const bg = new PIXI.Graphics();
      bg.rect(0, 0, W(), H()).fill(0x0a0a0a);
      app.stage.addChild(bg);

      // Subtle ink-on-ink grain so the canvas isn't flat
      const brochure = new PIXI.Container();
      app.stage.addChild(brochure);

      const grain = new PIXI.Graphics();
      // Coarse pointers (mobile) get half the dots — invisible difference
      // visually, big difference in cold-start cost
      const grainCount = window.matchMedia("(pointer: coarse)").matches ? 900 : 1800;
      for (let i = 0; i < grainCount; i++) {
        grain.circle(Math.random() * W(), Math.random() * H(), Math.random() * 1.3)
             .fill({ color: 0xefe9da, alpha: 0.018 + Math.random() * 0.04 });
      }
      brochure.addChild(grain);

      // Soft warm vignette — barely visible, only adds dimension
      const wash = new PIXI.Graphics();
      for (let r = Math.max(W(), H()) * 0.7; r > 40; r -= 30) {
        const t = r / (Math.max(W(), H()) * 0.7);
        wash.circle(W() * 0.5, H() * 0.45, r).fill({ color: 0xff4332, alpha: (1 - t) * 0.025 });
      }
      brochure.addChild(wash);

      // Decorative red rule near the bottom — fades out on scroll
      const ribbon = new PIXI.Graphics();
      ribbon.rect(W() * 0.06, H() * 0.78, W() * 0.34, 4).fill({ color: 0xff4332, alpha: 0.7 });
      brochure.addChild(ribbon);

      // No strips — keep the strips array empty so the ticker doesn't iterate
      const strips: { g: InstanceType<typeof PIXI.Container>; origY: number; dir: 1 | -1; speed: number }[] = [];
      void strips;
      const STRIPS = 0;
      const stripH = 0;
      void STRIPS; void stripH;

      /* ──── TEAR CRACK + TRUTH-GLOW ──────────────────────────────────
       * A jagged vermillion-red fracture that grows across the viewport
       * as the user scrolls. Sits ABOVE the brochure container (so it's
       * not displaced by the noise filter — we want the crack to feel
       * sharp, like a knife slice). A soft red glow trails behind it,
       * suggesting "truth-light" leaking from the rip.
       *
       * The crack is built once as a stretched Sprite-of-a-Graphics so
       * we can animate scale.x (not redraw every frame).
       */
      const crackLayer = new PIXI.Container();
      crackLayer.x = W() * 0.5;
      crackLayer.y = H() * 0.5;
      app.stage.addChild(crackLayer);

      // Soft red bloom behind the crack — radial circles for the truth-glow
      const glow = new PIXI.Graphics();
      for (let r = 320; r > 8; r -= 24) {
        const a = (1 - r / 320) * 0.06;
        glow.circle(0, 0, r).fill({ color: 0xff4332, alpha: a });
      }
      glow.scale.set(0);
      crackLayer.addChild(glow);

      // The crack itself — a jagged horizontal line. We DRAW it once as
      // a long zigzag in Graphics, then animate its scale.x to "open" it.
      const crack = new PIXI.Graphics();
      const crackHalf = Math.max(W(), 1) * 0.6;
      const segments = 28;
      crack.moveTo(-crackHalf, 0);
      for (let i = 1; i <= segments; i++) {
        const x = -crackHalf + (i / segments) * crackHalf * 2;
        const y = (Math.random() - 0.5) * 18; // jaggedness
        crack.lineTo(x, y);
      }
      crack.stroke({ color: 0xff4332, width: 3, alpha: 0.95 });
      // Subtle ink-shadow under the crack line for depth
      const crackShadow = new PIXI.Graphics();
      crackShadow.moveTo(-crackHalf, 4);
      for (let i = 1; i <= segments; i++) {
        const x = -crackHalf + (i / segments) * crackHalf * 2;
        const y = 4 + (Math.random() - 0.5) * 10;
        crackShadow.lineTo(x, y);
      }
      crackShadow.stroke({ color: 0x000000, width: 8, alpha: 0.5 });
      crackLayer.addChild(crackShadow);
      crackLayer.addChild(crack);
      crack.scale.set(0, 1);
      crackShadow.scale.set(0, 1);
      crackLayer.rotation = -0.04; // tiny tilt so it doesn't look CSS-clean

      /* ──── 2) DISPLACEMENT FILTER ─────────────────────────────────── */
      // Hand-rasterised noise sprite (no external assets — every byte ships).
      const noiseG = new PIXI.Graphics();
      for (let i = 0; i < 600; i++) {
        const cx = Math.random() * 512;
        const cy = Math.random() * 512;
        const r = 6 + Math.random() * 60;
        noiseG.circle(cx, cy, r).fill({
          color: Math.random() > 0.5 ? 0xffffff : 0x000000,
          alpha: 0.5,
        });
      }
      const noiseTex = app.renderer.generateTexture({ target: noiseG, resolution: 1 });
      const displacementSprite = new PIXI.Sprite(noiseTex);
      displacementSprite.texture.source.addressMode = "repeat";
      displacementSprite.scale.set(2);
      app.stage.addChild(displacementSprite);

      const displacement = new PIXI.DisplacementFilter({
        sprite: displacementSprite,
        scale: { x: 0, y: 0 },
      });
      brochure.filters = [displacement];

      /* ──── 3) TORN SHREDS — erupt outward from tear lines ──────────
       * 40 shreds, each anchored to one of the three tear lines (25%,
       * 50%, 75% of viewport). On scroll they launch outward — up, down,
       * sideways — with rotation, gradually thinning out.
       * Each shred carries its own ink-line so it looks like a piece of
       * paper that had print on it, mid-flight. */
      const shredLayer = new PIXI.Container();
      app.stage.addChild(shredLayer);

      interface Shred {
        g: InstanceType<typeof PIXI.Graphics>;
        originX: number;
        originY: number;
        vx: number;
        vy: number;
        vr: number;       // rotational velocity
        delay: number;    // scroll progress threshold before this shred activates
      }
      const shreds: Shred[] = [];
      const tearLineYs = [H() * 0.25, H() * 0.5, H() * 0.75];

      // Fewer shreds on touch devices — keeps the hero buttery on mobile.
      // Desktop now gets 56 shreds (storm), mobile gets 22 (still alive).
      const isCoarse = window.matchMedia("(pointer: coarse)").matches;
      const shredCount = isCoarse ? 22 : 56;
      for (let i = 0; i < shredCount; i++) {
        const s = new PIXI.Graphics();
        // Three size archetypes — small fragments, medium strips, big slabs
        const arche = i % 5;
        let w: number, h: number;
        if (arche === 0)      { w = 18 + Math.random() * 38;  h = 8 + Math.random() * 14; } // splinter
        else if (arche === 1) { w = 200 + Math.random() * 180; h = 28 + Math.random() * 44; } // slab
        else                  { w = 60 + Math.random() * 160; h = 16 + Math.random() * 28; } // strip

        // Cream paper bias; one in six shreds is dark "burnt paper"
        const burnt = i % 6 === 0;
        const paperColour = burnt ? 0x1a1a1a : 0xefe9da;
        s.rect(0, 0, w, h).fill(paperColour);
        // Ink marks suggesting text on cream shreds; cream highlight on burnt
        if (!burnt) {
          s.rect(6, h * 0.3, w * 0.55, 1.5).fill({ color: 0x000000, alpha: 0.55 });
          if (w > 100) s.rect(6, h * 0.65, w * 0.4, 1.5).fill({ color: 0x000000, alpha: 0.35 });
        } else {
          s.rect(6, h * 0.4, w * 0.4, 1).fill({ color: 0xefe9da, alpha: 0.18 });
        }
        // Jagged left + right edges — torn paper, not cut paper
        const jagL = new PIXI.Graphics();
        jagL.moveTo(0, 0);
        for (let y = 0; y <= h; y += 5) {
          jagL.lineTo(-(Math.random() * 9), y);
        }
        jagL.lineTo(0, h).closePath().fill(paperColour);
        s.addChild(jagL);
        const jagR = new PIXI.Graphics();
        jagR.moveTo(w, 0);
        for (let y = 0; y <= h; y += 5) {
          jagR.lineTo(w + Math.random() * 9, y);
        }
        jagR.lineTo(w, h).closePath().fill(paperColour);
        s.addChild(jagR);

        s.pivot.set(w / 2, h / 2);

        // Anchor each shred to ONE of three tear lines, with a horizontal
        // bias matching its line (so they don't all fly from the same x)
        const lineIdx = i % tearLineYs.length;
        const lineY = tearLineYs[lineIdx];
        // Launch angle scaled so middle line tends to fly horizontally and
        // outer lines arc up/down respectively
        const baseAngle = lineIdx === 0 ? -0.6 : lineIdx === 2 ? 0.6 : 0;
        const angle = baseAngle + (Math.random() - 0.5) * 1.4;
        const speed = 6 + Math.random() * 22;
        s.x = W() * (0.05 + Math.random() * 0.9);
        s.y = lineY + (Math.random() - 0.5) * 30;
        s.rotation = (Math.random() - 0.5) * 0.5;
        s.alpha = 0;

        shredLayer.addChild(s);
        shreds.push({
          g: s,
          originX: s.x,
          originY: s.y,
          vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
          vy: Math.sin(angle) * speed - 4, // upward bias
          vr: (Math.random() - 0.5) * 0.1,
          delay: 0.05 + Math.random() * 0.35, // wider stagger
        });
      }

      /* ──── tickers ─────────────────────────────────────────────── */
      let scrollProgress = 0;
      const onScroll = () => {
        const max = Math.max(1, window.innerHeight);
        scrollProgress = Math.min(1, Math.max(0, window.scrollY / max));
      };
      window.addEventListener("scroll", onScroll, { passive: true });

      let pointerX = 0.5, pointerY = 0.5;
      const onPointer = (e: PointerEvent) => {
        pointerX = e.clientX / window.innerWidth;
        pointerY = e.clientY / window.innerHeight;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      app.ticker.add(({ deltaTime }) => {
        // Displacement scales with scroll, peaks at progress 0.5, settles
        // slightly toward the end so the field doesn't keep boiling at max.
        const peakedProgress = Math.sin(Math.min(1, scrollProgress) * Math.PI);
        const targetScale = peakedProgress * 520 + 14;
        displacement.scale.x += (targetScale - displacement.scale.x) * 0.1;
        displacement.scale.y += (targetScale - displacement.scale.y) * 0.08;
        displacementSprite.x -= deltaTime * 1.4;
        displacementSprite.y += deltaTime * 0.9;

        // pointer parallax on the whole composition
        const tx = (pointerX - 0.5) * 24;
        const ty = (pointerY - 0.5) * 24;
        brochure.x += (tx - brochure.x) * 0.06;
        brochure.y += (ty - brochure.y) * 0.06;

        ribbon.alpha = Math.max(0, 0.7 - scrollProgress * 2);
        brochure.alpha = 1 - scrollProgress * 0.35;

        /* ─── TEAR CRACK ─────────────────────────────────────────────
         * Three phases. The crack ANTICIPATES (slow open 0..0.2),
         * RIPS (fast open 0.2..0.5), holds open (0.5..0.7), then
         * the cream paper above it fades away (0.7..1). */
        const crackProgress = Math.min(1, Math.max(0, (scrollProgress - 0.05) * 1.6));
        const eased = 1 - Math.pow(1 - crackProgress, 4); // easeOutQuart
        crack.scale.x = eased;
        crackShadow.scale.x = eased;
        glow.scale.set(eased * 1.4);
        // Glow brightens then dims to suggest a brief flash of "truth-light"
        const glowPulse = Math.sin(Math.min(1, scrollProgress * 1.4) * Math.PI);
        glow.alpha = 0.4 + glowPulse * 0.6;
        // Crack tilt rocks slightly with mouse — feels physical
        crackLayer.rotation = -0.04 + (pointerX - 0.5) * 0.03;
        // After full open, the crack itself starts to dim (the rip is now
        // in the past; the glow remains because the truth keeps shining)
        crack.alpha = Math.max(0, 0.95 - Math.max(0, scrollProgress - 0.7) * 3);
        crackShadow.alpha = crack.alpha * 0.8;

        /* ─── SHREDS ─────────────────────────────────────────────────
         * Per-shred local time = (scrollProgress - delay), then we use an
         * exponential ramp so shreds *snap* outward rather than drift.
         * Trajectory: starts at origin, accelerates outward + downward
         * (gravity), tumbles. Visibility: fade in fast, hold ~0.4 of the
         * scroll, fade out as they leave the viewport. */
        shreds.forEach((sh) => {
          const local = scrollProgress - sh.delay;
          if (local <= 0) {
            sh.g.alpha = 0;
            return;
          }
          // Exponential ramp — explosive feel
          const t = local * 1.5;
          const launch = 1 - Math.pow(1 - Math.min(1, t), 3); // easeOutCubic for motion
          sh.g.x = sh.originX + sh.vx * launch * 36;
          sh.g.y = sh.originY + sh.vy * launch * 30 + t * t * 160; // stronger gravity arc
          sh.g.rotation += sh.vr * deltaTime;
          // Alpha: spike up over t=0..0.15, hold to t=0.7, then fade out
          const fadeIn = Math.min(1, t * 6);
          const fadeOut = Math.max(0, 1 - (t - 0.7) * 2);
          sh.g.alpha = fadeIn * fadeOut;
        });
      });

      cleanup = () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("pointermove", onPointer);
        app.destroy(true, { children: true, texture: true });
      };
    };

    // Safety net — any unexpected init failure falls back to the CSS gradient
    // rather than surfacing as an uncaught-promise error in the dev overlay.
    init().catch(() => { /* CSS fallback retained */ });

    return () => {
      destroyed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={host}
      aria-hidden="true"
      className="absolute inset-0 -z-10 overflow-hidden"
      style={{
        // Static fallback for reduced-motion users
        background:
          "radial-gradient(60% 50% at 50% 30%, rgba(239,233,218,0.18), transparent 70%), #0B0B0B",
      }}
    />
  );
}
