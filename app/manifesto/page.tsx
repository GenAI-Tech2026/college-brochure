import { MarqueeStrip } from "@/components/MarqueeStrip";
import { RevealText } from "@/components/RevealText";

export const metadata = { title: "Manifesto" };

/**
 * Pure kinetic-typography showcase. Five spreads of giant editorial type,
 * each with its own RevealText entrance and accent. Designed to be its own
 * essay, readable on its own.
 */
const spreads: Array<{
  kicker: string;
  body: string;
  cls?: string;
}> = [
  {
    kicker: "I",
    body: "The brochure begins where the truth ends.",
  },
  {
    kicker: "II",
    body: "Marketing is a closed letter. We are the reply.",
  },
  {
    kicker: "III",
    body: "A photograph is an aspirational lie until a verified human reviews it.",
  },
  {
    kicker: "IV",
    body: "No institution is irredeemable. No brochure should be the only voice.",
  },
  {
    kicker: "V",
    body: "We are not anti-college. We are pro-student. The difference is who paid for the printing.",
  },
];

export default function ManifestoPage() {
  return (
    <div className="bg-ink">
      <header className="relative px-6 pb-16 pt-40 md:px-10">
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
          Section · Manifesto · Five spreads
        </p>
        <h1
          className="mt-4 font-display font-black uppercase text-newsprint"
          style={{
            fontSize: "clamp(4rem, 18vw, 16rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
          }}
        >
          <RevealText as="span" trigger="mount" variant="rise">MANIFESTO</RevealText>
        </h1>
      </header>

      <MarqueeStrip items={[
        "FIVE THESES",
        { text: "REDACTED", redact: true },
        "ONE READER · ONE TRUTH",
        { text: "FILED 2026", redact: false },
      ]} variant="truth" size="lg" />

      {spreads.map((s, i) => (
        /* Each spread now sits on min-h-screen with py-40 — generous
           breathing room between thesis blocks. Inner grid uses gap-y-10
           on mobile and gap-x-12 on desktop so the kicker column and
           the headline column don't bleed into each other. */
        <section
          key={i}
          className={`relative grid min-h-screen grid-cols-12 items-center gap-x-6 gap-y-10 border-b border-newsprint/10 px-6 py-40 md:gap-x-12 md:px-10 md:py-48 ${i % 2 ? "paper text-ink" : "text-newsprint"}`}
        >
          <div className="col-span-12 md:col-span-2">
            <p className="font-mono text-meta uppercase tracking-[0.3em] opacity-60">
              Thesis
            </p>
            <p className="mt-3 font-display text-[clamp(4rem,10vw,12rem)] font-black leading-[0.95] tracking-tight">
              {s.kicker}
            </p>
          </div>
          {/* Loosened type: leading 1.05 (was 0.88 — crashed descenders into
              the next line) and tracking -0.015em (was -0.04em — letters
              ran into each other at display size). word-spacing slightly
              positive so the gaps between words read clearly. */}
          <h2
            className="col-span-12 font-display font-black uppercase text-balance md:col-span-10"
            style={{
              fontSize: "clamp(2.25rem, 7vw, 8rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.015em",
              wordSpacing: "0.04em",
            }}
          >
            <RevealText as="span" variant="rise">{s.body}</RevealText>
          </h2>
        </section>
      ))}

      <section className="px-6 py-32 md:px-10">
        <p className="mx-auto max-w-3xl pull-quote text-newsprint">
          A brochure printed nine hundred thousand times can be corrected once, by a verified student, in front of every reader who came next.
        </p>
        <p className="mt-12 text-center font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
          — UNFILTERED · 2026
        </p>
      </section>
    </div>
  );
}
