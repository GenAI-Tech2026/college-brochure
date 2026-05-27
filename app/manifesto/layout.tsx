/**
 * Manifesto route layout.
 *
 * CRITICAL: do NOT set `content-visibility: auto` (or any transform / filter /
 * perspective / will-change) on this wrapper. Each of those creates a
 * "containing block for fixed-position descendants", which breaks
 * ScrollTrigger's pin (the pinned section reports `position: fixed` but
 * still scrolls with the page because its containing block is the wrapper
 * instead of the viewport). If we want CV:auto for perf, apply it ONLY to
 * the spread sections below the pin — never to ancestors of the pin.
 */
export const metadata = {
  title: "Manifesto",
  description:
    "A scroll-driven editorial film. One verified student against a silent crowd. Brochures lie. Students don't.",
};

export default function ManifestoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-route="manifesto" className="bg-ink">
      {children}
    </div>
  );
}
