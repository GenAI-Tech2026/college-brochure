import type { TruthRevelation } from "@/lib/data";

/**
 * Editor-curated "what we found" headlines for a college, sorted by weight.
 * Server component — pure presentation, no client JS. Renders nothing when
 * there are no revelations so the dossier stays clean.
 */
export function TruthRevelations({ items }: { items: TruthRevelation[] }) {
  if (!items.length) return null;

  return (
    <section className="bg-ink px-5 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-truth">
          The revelations
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium leading-tight tracking-tight text-newsprint md:text-4xl">
          What the file actually shows.
        </h2>

        <ol className="mt-10 divide-y divide-newsprint/12 border-y border-newsprint/12">
          {items.map((r, i) => (
            <li key={r.id} className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 py-6 md:gap-x-8">
              <span className="font-mono text-meta uppercase tracking-[0.2em] text-newsprint/40 [font-variant-numeric:tabular-nums]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-display text-xl font-medium leading-snug text-newsprint md:text-2xl">
                  {r.headline}
                </h3>
                <p className="mt-2 max-w-2xl font-serif text-base leading-relaxed text-newsprint/75">
                  {r.dek}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
