"use client";
import { RevealText } from "@/components/RevealText";
import { MagneticButton } from "@/components/MagneticButton";

/**
 * The site's editorial argument, set as a newspaper spread.
 * 12-col asymmetric layout — left rail is metadata, right rail is the spread.
 */
export function Manifesto() {
  return (
    <section className="paper relative isolate overflow-hidden px-6 py-32 md:px-10 md:py-48">
      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <p className="font-mono text-meta uppercase tracking-[0.3em] text-ink/60">
            Vol I · Section B · Manifesto
          </p>
          <p className="mt-3 font-mono text-meta text-ink/40">Filed 2026 · Bombay · Pondicherry · Salem · Hyderabad · Bengaluru</p>
          <hr className="my-6 border-ink/20" />
          <p className="font-serif italic text-ink/70">
            &ldquo;We don&apos;t hate the brochures. We hate that they got there first.&rdquo;
          </p>
        </aside>

        <div className="col-span-12 md:col-span-9">
          <h2 className="font-display text-[clamp(3rem,9vw,9rem)] font-black uppercase leading-[0.88] tracking-[-0.03em] text-ink">
            <RevealText as="span" variant="tear">Every brochure</RevealText>
            <br />
            <RevealText
              as="span"
              variant="tear"
              delay={0.1}
              className="italic text-truth"
            >
              is an unverified claim.
            </RevealText>
          </h2>

          <div className="mt-10 grid grid-cols-12 gap-6 font-serif text-xl text-ink/80">
            <p className="col-span-12 md:col-span-6 drop-cap">
              Indian college brochures are the second-most-edited PDFs in the country, after political manifestos. The placement number floats. The faculty roster ages backward. The campus photograph has been shot three times, on three different days, and stitched together in Photoshop.
            </p>
            <p className="col-span-12 md:col-span-6">
              We are not against marketing. We are against marketing that gets to be the only voice in a room of four hundred thousand students who borrowed money to walk through its front door. UNFILTERED is the corrigendum — the line in every newspaper that says, &ldquo;in the print edition of June 14th, we got this wrong.&rdquo; Except the print edition is the brochure, and the wrong is structural, and the corrigendum is a website.
            </p>
          </div>

          <p className="mt-16 pull-quote text-ink">
            The brochure ends at the page. The truth begins the day you arrive.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-4">
            <MagneticButton as="a" href="/manifesto" variant="stamp">
              Read the full manifesto
            </MagneticButton>
            <MagneticButton as="a" href="/verified" variant="ghost" className="border-ink/30 text-ink hover:bg-ink hover:text-newsprint">
              How verification works
            </MagneticButton>
          </div>
        </div>
      </div>
    </section>
  );
}
