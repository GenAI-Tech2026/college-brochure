"use client";
import { MagneticButton } from "@/components/MagneticButton";
import type { College } from "@/lib/mock-data/types";

/**
 * Module G — SUBMIT-YOUR-TRUTH CTA.
 * Custom polygonal shape (clip-path) with a magnetic hover. The Lottie
 * pencil specified in the brief is rendered as a CSS-keyframed pencil
 * silhouette — same expressive purpose, no external asset required.
 */
export function SubmitCTA({ college }: { college: College }) {
  return (
    <section className="relative overflow-hidden bg-ink px-6 py-24 text-newsprint md:px-10" aria-labelledby="cta-heading">
      <div
        className="relative grid grid-cols-12 gap-6 border-2 border-newsprint p-10 md:p-16"
        style={{
          clipPath:
            "polygon(0 0, calc(100% - 60px) 0, 100% 60px, 100% 100%, 60px 100%, 0 calc(100% - 60px))",
        }}
      >
        <div className="col-span-12 md:col-span-8">
          <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
            Section G · Submission · {college.caseFileNumber}
          </p>
          <h2 id="cta-heading" className="mt-4 font-display text-[clamp(2.5rem,7vw,6rem)] font-black uppercase leading-[0.85] tracking-[-0.03em]">
            You were there. <span className="italic text-truth">Print it.</span>
          </h2>
          <p className="mt-6 max-w-xl font-serif text-xl text-newsprint/80">
            Add your verified review of {college.shortName} to the case file. Pseudonymous, verified, never edited without flagging.
          </p>
        </div>
        <div className="col-span-12 flex items-end justify-end md:col-span-4">
          <MagneticButton as="a" href={`/submit?college=${college.slug}`} variant="primary" strength={0.5}>
            <span aria-hidden className="inline-block animate-[wiggle_2s_var(--ease-expo)_infinite]">✒</span>
            File your testimony
            <span aria-hidden>→</span>
          </MagneticButton>
        </div>
      </div>

      <style jsx>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-12deg) translateY(0); }
          50%      { transform: rotate(8deg) translateY(-2px); }
        }
      `}</style>
    </section>
  );
}
