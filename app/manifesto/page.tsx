/**
 * /manifesto — the editorial film + a short printed colophon.
 *
 * STORY ARC (mapped to scroll % inside the pinned ManifestoScene):
 *   0%  – 18% · Act I   · The Crowd     — silhouettes, ambient haze
 *  18%  – 35% · Act II  · The Podium    — empty lectern under spotlight
 *  35%  – 55% · Act III · The Witness   — one student arrives, scarf
 *  55%  – 80% · Act IV  · The Voice     — red shockwave, crowd dissolves
 *  80%  – 100%· Act V   · The Awakening — reformed crowd, CTA
 *
 * The film carries the argument. The post-film section is just the printed
 * receipt: five theses set as a compact editorial list, one pull-quote, a
 * signature. ~1 viewport instead of seven.
 */
import { RevealText } from "@/components/RevealText";
import { ScrollRevealQuote } from "@/components/ScrollRevealQuote";
import ManifestoScene from "@/components/manifesto/ManifestoSceneClient";

const theses: Array<{ n: string; body: string }> = [
  { n: "I",   body: "The brochure begins where the truth ends." },
  { n: "II",  body: "Marketing is a closed letter. We are the reply." },
  { n: "III", body: "A photograph is an aspirational lie until a verified human reviews it." },
  { n: "IV",  body: "No institution is irredeemable. No brochure should be the only voice." },
  { n: "V",   body: "We are pro-student. The difference is who paid for the printing." },
];

export default function ManifestoPage() {
  return (
    <div className="bg-ink">
      {/* THE FILM — pinned scrub. */}
      <ManifestoScene />

      {/* THE COLOPHON — one screen. Kicker · five theses · pull-quote · sig. */}
      <section className="border-t border-newsprint/15 px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
            Colophon · Five theses · Filed 2026
          </p>
          <h2
            className="mt-4 font-display font-black uppercase text-newsprint"
            style={{ fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: 1, letterSpacing: "-0.02em" }}
          >
            <RevealText as="span" variant="rise">For the record.</RevealText>
          </h2>

          <ol className="mt-12 divide-y divide-newsprint/15 border-y border-newsprint/15">
            {theses.map((t) => (
              <li key={t.n} className="grid grid-cols-12 items-baseline gap-x-6 py-6 md:py-8">
                <span className="col-span-2 font-display text-2xl font-black tracking-tight text-truth md:text-3xl">
                  {t.n}
                </span>
                <p className="col-span-10 font-display text-balance text-xl text-newsprint md:text-3xl">
                  {t.body}
                </p>
              </li>
            ))}
          </ol>

          <ScrollRevealQuote className="mt-16 pull-quote text-newsprint text-balance">
            A brochure printed nine hundred thousand times can be corrected once, by a verified student, in front of every reader who came next.
          </ScrollRevealQuote>

          <p className="mt-10 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
            — UNFILTERED · 2026
          </p>
        </div>
      </section>
    </div>
  );
}
