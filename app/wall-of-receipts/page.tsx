import { getReviews } from "@/lib/data";
import { RevealText } from "@/components/RevealText";

export const metadata = { title: "Wall of Receipts · You found it.", robots: { index: false } };

/**
 * Hidden page reached only via the Konami code on any page.
 * It surfaces the highest-receipt reviews — actual photo, document,
 * and video evidence that students attached. Designed to look like
 * a clandestine pinboard.
 */
export default async function WallOfReceipts() {
  const reviews = await getReviews({ limit: 50 });
  const withReceipts = reviews.filter((r) => r.receipts > 0).slice(0, 18);

  return (
    <div className="bg-ink px-6 pb-32 pt-32 md:px-10">
      <header className="mb-16 text-center">
        <p className="font-mono text-meta uppercase tracking-[0.4em] text-truth">
          Unsealed · Konami unlocked · You found us
        </p>
        <h1 className="mt-6 font-display text-[clamp(3rem,12vw,14rem)] font-black uppercase leading-[0.85] tracking-[-0.04em] text-newsprint">
          <RevealText as="span" trigger="mount" variant="rise">Wall of</RevealText>{" "}
          <RevealText as="span" trigger="mount" variant="rise" delay={0.15} className="italic text-truth">receipts.</RevealText>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl font-serif text-xl text-newsprint/80">
          A pinboard of the evidence students attached when the brochure&apos;s claim and their experience could not both be true. Posted here, with no labels and no captions, in the order they were filed.
        </p>
      </header>

      <ul className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {withReceipts.map((r, i) => (
          <li
            key={r.id}
            className="relative border border-newsprint/15 bg-newsprint p-4 text-ink shadow-newsprint"
            style={{
              transform: `rotate(${(i % 5) - 2}deg)`,
              transformOrigin: "center top",
            }}
          >
            {/* Push-pin */}
            <span
              aria-hidden
              className="absolute -top-3 left-1/2 inline-block h-6 w-6 -translate-x-1/2 rounded-full bg-truth shadow"
            />
            <p className="font-mono text-meta uppercase tracking-[0.2em] text-ink/60">
              Case · {r.collegeSlug.split("-").slice(0, 2).join(" ")}
            </p>
            <p className="mt-3 font-display text-lg font-black uppercase leading-tight">
              {r.title}
            </p>
            <p className="mt-3 font-serif italic text-ink/70">“{r.body.slice(0, 80)}…”</p>
            <p className="mt-4 font-mono text-meta uppercase tracking-[0.2em] text-truth">
              📎 {r.receipts} receipt{r.receipts === 1 ? "" : "s"} attached
            </p>
            <p className="mt-2 font-mono text-meta uppercase tracking-[0.2em] text-ink/40">
              By {r.authorPseudonym}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-20 text-center font-mono text-meta uppercase tracking-[0.3em] text-newsprint/40">
        You can leave now. We won&apos;t tell anyone you were here.
      </p>
    </div>
  );
}
