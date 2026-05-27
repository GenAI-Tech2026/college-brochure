import { MarqueeStrip } from "@/components/MarqueeStrip";
import { RevealText } from "@/components/RevealText";

export const metadata = { title: "How verification works" };

/**
 * Trust & verification explainer.
 * Hand-drawn-style illustrations rendered as inline SVG (no external assets).
 * Each step is a numbered card on the editorial grid.
 */
const steps = [
  {
    n: "01",
    title: "Submit pseudonymously",
    body: "You file under a pseudonym. We never display your real name. We never sell, share, or back up your verification artifact.",
    sketch: (
      <svg viewBox="0 0 120 80" className="h-24 w-32" aria-hidden>
        <rect x="6" y="10" width="100" height="60" fill="none" stroke="#EFE9DA" strokeWidth="2" />
        <line x1="14" y1="22" x2="80" y2="22" stroke="#EFE9DA" strokeWidth="1.4" />
        <line x1="14" y1="32" x2="100" y2="32" stroke="#EFE9DA" strokeWidth="1.4" />
        <line x1="14" y1="42" x2="60" y2="42" stroke="#EFE9DA" strokeWidth="1.4" />
        <rect x="14" y="52" width="34" height="12" fill="#E63946" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Choose your proof",
    body: "ID card scan, college-email response, alumni-roster cross-reference, or a quick selfie video confirming a sentence we send you.",
    sketch: (
      <svg viewBox="0 0 120 80" className="h-24 w-32" aria-hidden>
        <rect x="8" y="14" width="40" height="50" fill="none" stroke="#EFE9DA" strokeWidth="2" />
        <circle cx="28" cy="32" r="6" fill="none" stroke="#EFE9DA" strokeWidth="1.4" />
        <line x1="14" y1="46" x2="42" y2="46" stroke="#EFE9DA" strokeWidth="1.2" />
        <line x1="14" y1="52" x2="36" y2="52" stroke="#EFE9DA" strokeWidth="1.2" />
        <rect x="60" y="14" width="50" height="50" fill="#EFE9DA" />
        <circle cx="85" cy="40" r="14" fill="#0B0B0B" />
        <rect x="78" y="36" width="14" height="8" fill="#FF4332" />
      </svg>
    ),
  },
  {
    n: "03",
    title: "Cross-reference",
    body: "Your story is compared, by a human editor, against the brochure language you cite. Discrepancies between your quote and the official prospectus are flagged before publication.",
    sketch: (
      <svg viewBox="0 0 120 80" className="h-24 w-32" aria-hidden>
        <line x1="10" y1="20" x2="58" y2="60" stroke="#EFE9DA" strokeWidth="1.6" />
        <line x1="58" y1="20" x2="10" y2="60" stroke="#EFE9DA" strokeWidth="1.6" />
        <rect x="70" y="14" width="44" height="14" fill="#E63946" />
        <rect x="70" y="32" width="44" height="14" fill="#E8E1D0" />
        <rect x="70" y="50" width="44" height="14" fill="#FF4332" />
      </svg>
    ),
  },
  {
    n: "04",
    title: "Publication on the record",
    body: "Once verified, your review is filed under a permanent case number. We never edit it without a flag. Your truth becomes part of the file forever.",
    sketch: (
      <svg viewBox="0 0 120 80" className="h-24 w-32" aria-hidden>
        <rect x="14" y="14" width="92" height="50" fill="#EFE9DA" />
        <rect x="14" y="14" width="92" height="8" fill="#000" />
        <text x="20" y="36" fontSize="9" fontFamily="JetBrains Mono" fill="#0B0B0B">CASE UF-2026-XXXX</text>
        <text x="20" y="50" fontSize="6" fontFamily="JetBrains Mono" fill="#0B0B0B">VERIFIED — ON THE RECORD</text>
      </svg>
    ),
  },
];

export default function VerifiedPage() {
  return (
    <div className="bg-ink px-6 pb-32 pt-32 md:px-10">
      <header className="mb-16 max-w-4xl">
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
          Section · Verification · How it works
        </p>
        <h1 className="mt-4 font-display text-[clamp(3rem,10vw,12rem)] font-black uppercase leading-[0.85] tracking-[-0.04em] text-newsprint">
          <RevealText as="span" trigger="mount" variant="rise">Verified.</RevealText>{" "}
          <RevealText as="span" trigger="mount" variant="rise" delay={0.15} className="italic text-truth">Never tracked.</RevealText>
        </h1>
        <p className="mt-6 font-serif text-xl text-newsprint/80">
          We verify your identity only enough to confirm you were there. Then we forget who you are.
        </p>
      </header>

      <MarqueeStrip items={[
        "VERIFIED · NEVER TRACKED · PSEUDONYMOUS",
        { text: "TRUST IS NOT MARKETING", redact: false },
      ]} variant="ink" size="md" />

      <ol className="mt-20 grid grid-cols-1 gap-10 md:grid-cols-2">
        {steps.map((s) => (
          <li key={s.n} className="grid grid-cols-12 gap-4 border border-newsprint/10 p-8">
            <div className="col-span-12 flex items-start justify-between md:col-span-12">
              <span className="can-fade font-display text-7xl font-black leading-none text-newsprint/30">{s.n}</span>
              {s.sketch}
            </div>
            <h3 className="col-span-12 font-display text-3xl font-black uppercase leading-tight text-newsprint">
              {s.title}
            </h3>
            <p className="col-span-12 font-serif text-lg text-newsprint/80">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

