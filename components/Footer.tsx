import Link from "next/link";
import { MarqueeStrip } from "./MarqueeStrip";

/**
 * The site's last word. Set in old colophon style: redaction bars,
 * editorial credit, and a marquee that re-states the thesis.
 */
export function Footer() {
  return (
    /* No top-margin — pages with full-bleed final sections (the showcase
       finale, in particular) need the footer to flow flush. Pages whose
       last section needs breathing room control it themselves. */
    <footer className="paper relative border-t-2 border-ink">
      <MarqueeStrip
        items={[
          "BROCHURES LIE",
          { text: "STUDENTS DON'T", redact: false },
          "FILED UNDER TRUTH",
          { text: "REDACTED", redact: true },
          "EVIDENCE WALL",
        ]}
        variant="ink"
        size="md"
      />
      <div className="grid grid-cols-12 gap-6 px-6 py-20 md:px-10">
        <div className="col-span-12 md:col-span-5">
          <h3 className="font-display text-5xl font-black leading-[0.9] text-ink md:text-7xl">
            Filed by<br /> the people<br />
            <span className="italic text-truth">who lived it.</span>
          </h3>
          <p className="mt-6 max-w-md font-serif text-lg text-ink/70">
            UNFILTERED is a not-for-profit collective of verified students publishing
            line-by-line corrections to the brochures that sold them.
          </p>
        </div>

        <nav aria-label="Footer" className="col-span-6 md:col-span-3">
          <h4 className="mb-4 font-mono text-meta uppercase tracking-[0.2em] text-ink/50">Sections</h4>
          <ul className="space-y-2 font-serif text-lg text-ink">
            <li><Link className="highlight-link" data-cursor="link" href="/colleges">The File</Link></li>
            <li><Link className="highlight-link" data-cursor="link" href="/manifesto">Manifesto</Link></li>
            <li><Link className="highlight-link" data-cursor="link" href="/verified">Verification</Link></li>
            <li><Link className="highlight-link" data-cursor="link" href="/submit">Submit your truth</Link></li>
          </ul>
        </nav>

        <div className="col-span-6 md:col-span-4">
          <h4 className="mb-4 font-mono text-meta uppercase tracking-[0.2em] text-ink/50">Colophon</h4>
          <p className="font-serif text-ink/80">
            Typeset in Fraunces, Instrument Serif, Inter Tight and JetBrains Mono.
            Built with Next.js, GSAP, Lenis and PixiJS. No third-party trackers.
          </p>
          <p className="mt-4 font-mono text-meta uppercase tracking-[0.2em] text-ink/50">
            UF-2026 · CASE FILES IN PROGRESS
          </p>
        </div>
      </div>
      <div className="border-t border-ink/20 px-6 py-6 md:px-10">
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-ink/60">
          All names fictional. All numbers verified. Press the K-O-N-A-M-I keys to read the receipts.
        </p>
      </div>
    </footer>
  );
}
