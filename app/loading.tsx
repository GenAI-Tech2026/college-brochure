/**
 * Loading UI — the brand-personality loader, not a spinner.
 *
 * Three redaction bars assemble (slide in from left at staggered delays),
 * pause as a single solid block, then slide out from the right. While
 * the page is loading, the loop continues; once it settles, the
 * loader unmounts.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-ink">
      <div className="text-center">
        <p className="font-mono text-meta uppercase tracking-[0.4em] text-newsprint/60">
          Filing case · please wait
        </p>
        <div className="mt-8 space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-3 w-[40vw] max-w-md origin-left bg-truth"
              style={{
                animation: `redaction-assemble 1.8s ${i * 0.2}s var(--ease-paper) infinite`,
              }}
            />
          ))}
        </div>
        <p className="mt-10 font-display text-3xl italic text-newsprint">
          The brochure is being redacted.
        </p>
      </div>
    </div>
  );
}
