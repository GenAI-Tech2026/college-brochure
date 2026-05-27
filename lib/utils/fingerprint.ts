/**
 * Generates a deterministic SVG fingerprint pattern unique to each college.
 * The seed string is hashed into a stable set of coordinates and arcs.
 * Identity, not decoration — the same college always renders the same mark.
 */

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface FingerprintPath {
  d: string;
  opacity: number;
  strokeWidth: number;
}

export function fingerprintPaths(seed: string, count = 12): FingerprintPath[] {
  const rng = mulberry32(hash32(seed));
  const paths: FingerprintPath[] = [];
  for (let i = 0; i < count; i++) {
    const cx = 50 + rng() * 0;
    const cy = 50 + rng() * 0;
    const r = 8 + i * 3 + rng() * 4;
    const a0 = rng() * Math.PI * 2;
    const a1 = a0 + Math.PI * (0.6 + rng() * 1.2);
    const x0 = cx + Math.cos(a0) * r;
    const y0 = cy + Math.sin(a0) * r;
    const x1 = cx + Math.cos(a1) * r;
    const y1 = cy + Math.sin(a1) * r;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    paths.push({
      d: `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`,
      opacity: 0.25 + rng() * 0.7,
      strokeWidth: 0.4 + rng() * 0.6,
    });
  }
  return paths;
}
