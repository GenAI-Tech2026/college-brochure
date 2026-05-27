"use client";
import { MagneticButton } from "@/components/MagneticButton";
import { RevealText } from "@/components/RevealText";

/**
 * Sub-final CTA on the landing page. Asks for the user's own contribution.
 * Designed to feel like a classified-ad column from a newspaper back page.
 */
export function SubmitTeaser() {
  return (
    <section className="relative overflow-hidden bg-ink px-6 py-32 md:px-10 md:py-48">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-7">
          <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
            Section Z · Classified · Wanted
          </p>
          {/* Looser tracking (was -0.03em — too crash-tight at display size)
              and leading-[1.02] (was 0.85, which made the y-descenders crash
              into the next line). Consolidated to 2 lines so each line has
              enough words to feel composed instead of three short bursts.
              word-spacing slightly positive so the gaps read clearly. */}
          <h2
            className="mt-4 font-display font-black uppercase text-newsprint"
            style={{
              fontSize: "clamp(2.5rem, 7vw, 6.5rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.01em",
              wordSpacing: "0.04em",
            }}
          >
            <RevealText as="span" variant="rise">
              You sat in
            </RevealText>{" "}
            <RevealText as="span" variant="rise" delay={0.1} className="italic text-truth">
              that lecture.
            </RevealText>
            <br />
            <RevealText as="span" variant="rise" delay={0.2}>
              You know the truth.
            </RevealText>
          </h2>
          <p className="mt-8 max-w-xl font-serif text-xl text-newsprint/80">
            Submit a verified review. Pseudonymous by default. Every claim cross-checked against your brochure&apos;s exact wording. Your name never appears. Your truth always does.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <MagneticButton as="a" href="/submit" variant="primary">
              File your testimony
              <span aria-hidden>→</span>
            </MagneticButton>
            <MagneticButton as="a" href="/verified" variant="ghost">
              How verification works
            </MagneticButton>
          </div>
        </div>

        {/* Editorial column on the right — a "wanted: truth" classified */}
        <aside className="col-span-12 mt-12 md:col-span-5 md:mt-0">
          <div className="paper border border-ink/30 p-8 text-ink">
            <p className="font-mono text-meta uppercase tracking-[0.3em] text-ink/50">Classified · 042</p>
            <h3 className="mt-3 font-display text-3xl font-black uppercase leading-tight">
              WANTED: <span className="italic text-truth">the truth.</span>
            </h3>
            <p className="mt-4 font-serif italic text-ink/70">
              We pay for it in attention, not money. The brochure&apos;s authors paid for it in marble. You will pay for it in twenty minutes and a verification step.
            </p>
            <hr className="my-6 border-ink/20" />
            <ul className="space-y-2 font-mono text-meta uppercase tracking-[0.18em] text-ink/80">
              <li>· Pseudonymous publication</li>
              <li>· ID verified, never stored as identity</li>
              <li>· Counter-claims welcomed</li>
              <li>· No edits without flagging</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
