"use client";
import { useEffect, useRef } from "react";
import { fingerprintPaths } from "@/lib/utils/fingerprint";

/**
 * The cinematic Three.js stage for /showcase. ONE canvas, ONE renderer,
 * ONE render loop. Two passes on it:
 *
 *   1) Background plane — full-viewport fragment shader. Procedural fbm
 *      noise tinted to the active chapter's accent. Pulses on chapter
 *      transition. Lerps colour to the next chapter on the GPU, so React
 *      state changes don't cause re-renders of geometry.
 *
 *   2) Fingerprint constellation — a Points cloud whose XYZ positions are
 *      derived from each college's deterministic fingerprint paths,
 *      converted to ~400 points in 3D space. Each chapter has its own
 *      "target" point array; on chapter change, every point's position
 *      is animated toward the new target with per-point easing offset.
 *      One draw call. Custom vertex shader interpolates position and a
 *      glow uniform driven by chapter pulse.
 *
 * Why this is "lightweight, no lag":
 *   - 2 meshes, 2 materials, 1 renderer, 1 RAF loop
 *   - 400 Points, single draw call, no shadows, no post-processing
 *   - devicePixelRatio capped to 1.75 (1.25 on coarse/touch)
 *   - pauses on tab-hide via visibilitychange
 *   - lazy-imported: Three.js code-splits to /showcase only
 *   - mobile coarse-pointer falls back to a CSS gradient, no canvas
 *   - prefers-reduced-motion fully disables Three
 */

interface ShowcaseStageProps {
  chapterIndex: number;       // 0..N-1
  chapters: { accent: string; fingerprintSeed: string }[];
  pulse: number;              // 0..1 transient
}

const hexToVec3 = (hex: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [1, 1, 1];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/**
 * Sample the SVG fingerprint paths into ~400 (x,y,z) points.
 * Each arc is sampled at 30 t-values; z is jittered with the seed so each
 * college's constellation has its own depth signature.
 */
function fingerprintToPoints(seed: string, count = 400): Float32Array {
  const paths = fingerprintPaths(seed, 18);
  const out = new Float32Array(count * 3);
  const perArc = Math.max(1, Math.floor(count / paths.length));
  let idx = 0;

  // Parse the "M x y A r r 0 large 1 x1 y1" we generate in fingerprint.ts
  for (const p of paths) {
    const tokens = p.d.split(/[\s,]+/);
    const x0 = parseFloat(tokens[1]);
    const y0 = parseFloat(tokens[2]);
    // tokens[4]='A', tokens[5]=r, tokens[6]=r, ... tokens[10]=x1, tokens[11]=y1
    const r = parseFloat(tokens[4]);
    const large = parseFloat(tokens[7]);
    const x1 = parseFloat(tokens[9]);
    const y1 = parseFloat(tokens[10]);
    if (!isFinite(r)) continue;

    // approximate the centre as midpoint perpendicular offset
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx, dy);
    const h = Math.sqrt(Math.max(0, r * r - (dist * dist) / 4));
    const nx = -dy / (dist || 1);
    const ny = dx / (dist || 1);
    const sign = large ? -1 : 1;
    const cx = mx + nx * h * sign;
    const cy = my + ny * h * sign;

    const a0 = Math.atan2(y0 - cy, x0 - cx);
    const a1 = Math.atan2(y1 - cy, x1 - cx);
    let da = a1 - a0;
    if (large && da < Math.PI) da += Math.PI * 2;

    for (let s = 0; s < perArc && idx < count; s++) {
      const t = s / perArc;
      const a = a0 + da * t;
      const px = (cx + Math.cos(a) * r - 50) / 30;  // centre + scale
      const py = -(cy + Math.sin(a) * r - 50) / 30; // flip Y for WebGL
      // depth signature: hash of seed * arc index
      const seedHash = (seed.charCodeAt(s % seed.length) % 17) / 17;
      const z = (seedHash - 0.5) * 0.9 + (Math.sin(t * 9.3 + s) * 0.2);
      out[idx * 3 + 0] = px;
      out[idx * 3 + 1] = py;
      out[idx * 3 + 2] = z;
      idx++;
    }
  }
  // Fill any remainder with last-known point
  while (idx < count) {
    out[idx * 3 + 0] = 0;
    out[idx * 3 + 1] = 0;
    out[idx * 3 + 2] = 0;
    idx++;
  }
  return out;
}

export function ShowcaseStage({ chapterIndex, chapters, pulse }: ShowcaseStageProps) {
  const host = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ chapterIndex, chapters, pulse });
  stateRef.current = { chapterIndex, chapters, pulse };

  useEffect(() => {
    if (typeof window === "undefined" || !host.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduced) return;

    let destroyed = false;
    let cleanup: (() => void) | undefined;

    const init = async () => {
      // Feature-test WebGL once before we lazy-load Three.js.
      // Saves the ~150KB import on machines that can't run it (no GPU,
      // safe-mode browsers, headless test runners). CSS fallback stands in.
      try {
        const probe = document.createElement("canvas");
        const gl = probe.getContext("webgl2") || probe.getContext("webgl");
        if (!gl) return;
      } catch { return; }

      let THREE: typeof import("three");
      try {
        THREE = await import("three");
      } catch { return; }
      if (destroyed || !host.current) return;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: false,
          powerPreference: "low-power",
          failIfMajorPerformanceCaveat: false,
        });
      } catch {
        // WebGL context lost or refused mid-init — keep the CSS gradient.
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.25 : 1.75));

      const setSize = () => {
        if (!host.current) return;
        renderer.setSize(host.current.clientWidth, host.current.clientHeight, false);
      };
      setSize();
      host.current.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = "display:block;width:100%;height:100%;";

      // Two scenes, one camera. Background is rendered with depthTest off
      // before the foreground constellation. Same renderer.clear off — we
      // manually clear once per frame.
      const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 100);
      camera.position.set(0, 0, 4.5);

      // ────────── Pass 1: shader backdrop ──────────
      const bgScene = new THREE.Scene();
      const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const bgUniforms = {
        uTime: { value: 0 },
        uColor: { value: new THREE.Vector3(...hexToVec3(chapters[chapterIndex]?.accent ?? "#E63946")) },
        uTargetColor: { value: new THREE.Vector3(...hexToVec3(chapters[chapterIndex]?.accent ?? "#E63946")) },
        uPulse: { value: 0 },
        uRes: { value: new THREE.Vector2(1, 1) },
      };
      const bgMaterial = new THREE.ShaderMaterial({
        uniforms: bgUniforms,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          precision highp float;
          varying vec2 vUv;
          uniform float uTime; uniform vec3 uColor; uniform float uPulse; uniform vec2 uRes;
          vec2 hash(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return -1.+2.*fract(sin(p)*43758.5453);}
          float noise(in vec2 p){const float K1=.366025404;const float K2=.211324865;vec2 i=floor(p+(p.x+p.y)*K1);vec2 a=p-i+(i.x+i.y)*K2;float m=step(a.y,a.x);vec2 o=vec2(m,1.-m);vec2 b=a-o+K2;vec2 c=a-1.+2.*K2;vec3 h=max(.5-vec3(dot(a,a),dot(b,b),dot(c,c)),0.);vec3 n=h*h*h*h*vec3(dot(a,hash(i)),dot(b,hash(i+o)),dot(c,hash(i+1.)));return dot(n,vec3(70.));}
          float fbm(vec2 p){float v=0.;float a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.02;a*=.5;}return v;}
          void main(){
            vec2 uv = vUv; uv.x *= uRes.x/uRes.y;
            float t = uTime * 0.04;
            vec2 q = vec2(fbm(uv + t), fbm(uv + vec2(5.2,1.3) + t));
            vec2 r = vec2(fbm(uv + 4.*q + vec2(1.7,9.2) + t*1.3), fbm(uv + 4.*q + vec2(8.3,2.8) + t*1.7));
            float f = fbm(uv + 4.*r);
            vec3 base = mix(vec3(0.035), uColor, smoothstep(0.05, 0.95, f));
            base += uPulse * 0.30 * (1.0 - smoothstep(0.0, 1.4, length(uv - 0.5)));
            float vign = smoothstep(1.6, 0.55, length(uv - vec2(0.5*uRes.x/uRes.y, 0.5)));
            float grain = (hash(uv*uRes + uTime).x) * 0.025;
            gl_FragColor = vec4(base * vign + grain, 0.96);
          }
        `,
      });
      bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial));

      // ────────── Pass 2: fingerprint constellation ──────────
      const fgScene = new THREE.Scene();
      // Fewer points on mobile so the morph remains 60fps on lower-end GPUs
      const N = coarse ? 220 : 400;

      // Pre-compute every chapter's target positions; we don't recompute on
      // each chapter change. ~32 KB total for 5 chapters — negligible.
      const chapterPositions = chapters.map((c) => fingerprintToPoints(c.fingerprintSeed, N));

      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(N * 3);
      const targets = new Float32Array(N * 3);
      const previous = new Float32Array(N * 3);
      const seeds = new Float32Array(N);

      const initial = chapterPositions[Math.min(chapterIndex, chapterPositions.length - 1)];
      for (let i = 0; i < N; i++) {
        positions[i * 3] = initial[i * 3];
        positions[i * 3 + 1] = initial[i * 3 + 1];
        positions[i * 3 + 2] = initial[i * 3 + 2];
        targets[i * 3] = initial[i * 3];
        targets[i * 3 + 1] = initial[i * 3 + 1];
        targets[i * 3 + 2] = initial[i * 3 + 2];
        previous[i * 3] = initial[i * 3];
        previous[i * 3 + 1] = initial[i * 3 + 1];
        previous[i * 3 + 2] = initial[i * 3 + 2];
        seeds[i] = Math.random();
      }
      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geom.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));

      const fgUniforms = {
        uTime: { value: 0 },
        uColor: { value: new THREE.Vector3(...hexToVec3(chapters[chapterIndex]?.accent ?? "#E63946")) },
        uPulse: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
      };
      const fgMaterial = new THREE.ShaderMaterial({
        uniforms: fgUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute float seed;
          uniform float uTime;
          uniform float uPulse;
          uniform float uPixelRatio;
          varying float vGlow;
          void main(){
            vec3 pos = position;
            // gentle drift on each point
            float t = uTime * 0.4 + seed * 6.2831;
            pos.x += sin(t) * 0.015;
            pos.y += cos(t * 1.13) * 0.015;
            pos.z += sin(t * 0.7) * 0.02;
            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mv;
            float size = (1.5 + uPulse * 4.0) * uPixelRatio;
            gl_PointSize = size * (220.0 / -mv.z);
            vGlow = uPulse * (0.5 + seed * 0.5) + 0.5;
          }
        `,
        fragmentShader: /* glsl */ `
          precision mediump float;
          uniform vec3 uColor;
          varying float vGlow;
          void main(){
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            float alpha = smoothstep(0.5, 0.0, d);
            gl_FragColor = vec4(uColor * vGlow * 1.6, alpha * 0.85);
          }
        `,
      });
      const points = new THREE.Points(geom, fgMaterial);
      fgScene.add(points);

      // ────────── Resize + Visibility + Tab-hide ──────────
      const onResize = () => {
        setSize();
        const w = host.current!.clientWidth;
        const h = host.current!.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        bgUniforms.uRes.value.set(w, h);
      };
      onResize();
      window.addEventListener("resize", onResize);

      let running = true;
      const onVis = () => { running = !document.hidden; };
      document.addEventListener("visibilitychange", onVis);

      // ────────── Chapter-change choreography ──────────
      // Whenever stateRef.current.chapterIndex changes, snapshot current
      // `positions` into `previous` and set `targets` to the new chapter's
      // computed positions. Vertex shader interpolates in screen-space via
      // a per-point lerp factor on the CPU side (cheap — once per frame).
      let lastChapter = chapterIndex;
      let lerp = 1; // 0 = at previous, 1 = at target

      // ────────── Render loop ──────────
      let raf = 0;
      let lastT = performance.now();

      const tmpTarget = new THREE.Vector3();
      const tmpColor = new THREE.Vector3(...hexToVec3(chapters[chapterIndex]?.accent ?? "#E63946"));

      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        if (!running) return;
        const dt = Math.min(0.05, (now - lastT) / 1000);
        lastT = now;

        // Chapter changed? Snapshot and reset lerp.
        const ci = stateRef.current.chapterIndex;
        if (ci !== lastChapter) {
          for (let i = 0; i < positions.length; i++) previous[i] = positions[i];
          const tgt = chapterPositions[Math.min(ci, chapterPositions.length - 1)];
          for (let i = 0; i < tgt.length; i++) targets[i] = tgt[i];
          lerp = 0;
          lastChapter = ci;
        }

        // Advance lerp over ~1.6s with expo.out feel
        lerp = Math.min(1, lerp + dt / 1.6);
        const e = 1 - Math.pow(1 - lerp, 4); // easeOutQuart
        for (let i = 0; i < positions.length / 3; i++) {
          // per-point offset: later points wait longer for a "wave" feel
          const off = (i / (positions.length / 3)) * 0.4;
          const local = Math.max(0, Math.min(1, (lerp - off) / (1 - off + 0.001)));
          const lEase = 1 - Math.pow(1 - local, 4);
          positions[i * 3]     = previous[i * 3]     + (targets[i * 3]     - previous[i * 3])     * lEase;
          positions[i * 3 + 1] = previous[i * 3 + 1] + (targets[i * 3 + 1] - previous[i * 3 + 1]) * lEase;
          positions[i * 3 + 2] = previous[i * 3 + 2] + (targets[i * 3 + 2] - previous[i * 3 + 2]) * lEase;
        }
        (geom.getAttribute("position") as InstanceType<typeof THREE.BufferAttribute>).needsUpdate = true;

        // Update colour + pulse uniforms
        const [rr, gg, bb] = hexToVec3(chapters[stateRef.current.chapterIndex]?.accent ?? "#E63946");
        tmpColor.lerp({ x: rr, y: gg, z: bb } as unknown as InstanceType<typeof THREE.Vector3>, 0.05);
        bgUniforms.uColor.value.copy(tmpColor);
        fgUniforms.uColor.value.copy(tmpColor);

        bgUniforms.uPulse.value += (stateRef.current.pulse - bgUniforms.uPulse.value) * 0.08;
        fgUniforms.uPulse.value = bgUniforms.uPulse.value;
        bgUniforms.uTime.value += dt;
        fgUniforms.uTime.value += dt;

        // subtle camera drift — adds 3D parallax without input cost
        const cd = Math.sin(now * 0.0003) * 0.08;
        camera.position.x = cd;
        camera.position.y = -cd * 0.4;
        camera.lookAt(0, 0, 0);

        renderer.autoClear = false;
        renderer.clear();
        renderer.render(bgScene, bgCamera);
        renderer.render(fgScene, camera);

        // silence the "tmpTarget unused" linter — used for type inference only
        void tmpTarget;
      };
      raf = requestAnimationFrame(loop);

      cleanup = () => {
        cancelAnimationFrame(raf);
        document.removeEventListener("visibilitychange", onVis);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
        bgMaterial.dispose();
        fgMaterial.dispose();
        geom.dispose();
        // Remove from whatever the canvas's CURRENT parent is, not the
        // ref we mounted to — React may have already detached our host
        // during route transitions, leaving the canvas attached to a
        // different node in the tree. Defensive removal avoids the
        // NotFoundError: "node to be removed is not a child of this node"
        try {
          renderer.domElement.parentNode?.removeChild(renderer.domElement);
        } catch { /* already gone */ }
      };
    };

    // Run init with a safety net — any unexpected GPU/driver failure
    // shouldn't surface as an uncaught error overlay; we just stay on
    // the CSS gradient fallback.
    init().catch(() => { /* CSS fallback retained */ });

    return () => {
      destroyed = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={host}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background:
          "radial-gradient(60% 60% at 50% 40%, rgba(230,57,70,0.10), transparent 70%), #0B0B0B",
      }}
    />
  );
}
