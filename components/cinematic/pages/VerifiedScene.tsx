import Link from "next/link";

/**
 * /verified — a plain statement of how verification works.
 * No cinematic, no scene imagery, no stepped sections.
 */
export function VerifiedScene() {
  return (
    <section className="min-h-screen bg-ink px-6 py-32 text-newsprint md:px-10">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
          Verified · Never tracked
        </p>
        <h1
          className="mt-6 font-display font-medium leading-[1.05] tracking-tight text-newsprint"
          style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
        >
          Verified. <em className="font-display italic text-truth">Never tracked.</em>
        </h1>

        <p className="mt-10 font-display text-2xl leading-snug text-newsprint/85 md:text-3xl">
          Every claim filed here is read by a human, checked against the prospectus and
          three independent sources, and only then recorded as truth.
        </p>

        <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-newsprint/65">
          Your identity is confirmed once and never stored. No algorithm decides what is
          true. No tracking, no profiles — the verification proves the testimony, not the
          person.
        </p>

        <div className="mt-14 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/colleges"
            className="inline-flex items-center gap-3 border border-newsprint/30 px-5 py-3 font-mono text-meta uppercase tracking-[0.3em] text-newsprint hover:border-truth hover:text-truth"
          >
            Read the archive →
          </Link>
          <Link
            href="/submit"
            className="inline-flex items-center gap-3 bg-truth px-5 py-3 font-mono text-meta uppercase tracking-[0.3em] text-newsprint hover:bg-truth/85"
          >
            File your truth
          </Link>
        </div>
      </div>
    </section>
  );
}
