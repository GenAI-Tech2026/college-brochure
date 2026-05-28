"use client";

/**
 * THE INTAKE — narrative procedural for /submit.
 *
 * The full chain of custody between "press submit" and "appears on the
 * public record." All four acts and the complete case file render at once;
 * the scroll-driven pin/scrub animation has been removed.
 *
 * Accessibility:
 *   - Single <section> with role="region", aria-label="The intake procedure"
 *   - Each ledger line is a real <li>, readable by AT
 *   - The form below remains keyboard-navigable; this section can be skipped
 *     via the existing skip-link.
 */

type Act = {
  numeral: string;
  title: string;
  caption: string;
  ledger: { label: string; value: string }[];
};

const acts: Act[] = [
  {
    numeral: "I",
    title: "Received.",
    caption: "Your words enter the file. Timestamped, hash-stamped, sealed.",
    ledger: [
      { label: "RECEIVED", value: "00:00:00.4 · UTC" },
      { label: "INTAKE-ID", value: "UF-INT-############" },
      { label: "INTEGRITY", value: "SHA-256 · sealed" },
    ],
  },
  {
    numeral: "II",
    title: "Cross-checked.",
    caption: "Verified against the prospectus. Matched against three independent sources.",
    ledger: [
      { label: "DOMAIN", value: ".edu · confirmed" },
      { label: "BROCHURE", value: "page 14 · paragraph 3 · matched" },
      { label: "WITNESSES", value: "3 · independent" },
    ],
  },
  {
    numeral: "III",
    title: "Triaged.",
    caption: "A human reads it. A case number is assigned. No algorithm decides what's true.",
    ledger: [
      { label: "EDITOR", value: "human · pseudonymous" },
      { label: "CASE-NO", value: "UF-####" },
      { label: "STATUS", value: "queued for record" },
    ],
  },
  {
    numeral: "IV",
    title: "Filed.",
    caption: "It joins the public record. You are now part of the file.",
    ledger: [
      { label: "PUBLISHED", value: "wall-of-receipts · live" },
      { label: "EXHIBIT", value: "#00247,892" },
      { label: "WITNESS", value: "you · on the record" },
    ],
  },
];

export function Intake() {
  return (
    <section
      role="region"
      aria-label="The intake procedure"
      className="relative bg-ink"
    >
      <div
        className="relative flex min-h-[100svh] items-center overflow-hidden border-y border-newsprint/10 px-5 py-16 md:px-10"
      >
        {/* faint editorial gridlines */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-5 right-5 top-1/2 h-px bg-newsprint/5 md:left-10 md:right-10" />
        </div>

        <div className="mx-auto grid w-full max-w-7xl grid-cols-12 items-start gap-8 md:gap-14">
          {/* LEFT — kicker + act narrative */}
          <div className="col-span-12 md:col-span-6">
            <p className="mb-6 inline-flex items-center gap-3 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
              <span className="inline-block h-px w-8 bg-truth" />
              The intake · how a testimony becomes a file
            </p>

            <h2
              className="font-display font-black uppercase leading-[0.9] tracking-[-0.03em] text-newsprint"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
            >
              Before <em className="font-display italic text-truth">it&apos;s public</em>,
              <br />
              it is procedure.
            </h2>

            {/* Act track — numerals anchored left so the rhythm reads. */}
            <ol className="mt-12 space-y-5">
              {acts.map((a) => {
                return (
                  <li
                    key={a.numeral}
                    className="grid grid-cols-12 items-baseline gap-x-4"
                  >
                    <span className="col-span-2 font-display text-3xl font-black tracking-tight text-truth md:text-4xl">
                      {a.numeral}
                    </span>
                    <div className="col-span-10">
                      <h3 className="font-display text-2xl font-medium text-newsprint md:text-3xl">
                        {a.title}
                      </h3>
                      <p className="mt-1 max-w-md font-mono text-sm leading-relaxed text-newsprint/65">
                        {a.caption}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* RIGHT — the completed case file: every act's ledger lines plus
              the "FILED" stamp. */}
          <div className="col-span-12 md:col-span-6">
            <div
              className="relative w-full border border-newsprint/15 bg-[#141210] p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] md:p-8"
              style={{ transform: "rotate(-0.4deg)" }}
            >
              <div className="mb-6 flex items-center justify-between font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55">
                <span>Case file · complete</span>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-truth" />
                  on the record
                </span>
              </div>

              <dl className="space-y-3 font-mono text-sm text-newsprint">
                {acts.flatMap((a, ai) =>
                  a.ledger.map((line, li) => {
                    return (
                      <div
                        key={`${ai}-${li}`}
                        className="grid grid-cols-12 items-baseline gap-x-3 border-b border-newsprint/10 pb-2"
                      >
                        <dt className="col-span-4 text-newsprint/55 uppercase tracking-[0.18em] text-[0.7rem]">
                          {line.label}
                        </dt>
                        <dd className="col-span-8 text-newsprint">
                          {line.value}
                        </dd>
                      </div>
                    );
                  }),
                )}
              </dl>

              {/* the filed stamp */}
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-3 right-4 select-none"
                style={{ transform: "rotate(-6deg)" }}
              >
                <span className="inline-block border-2 border-truth px-3 py-1 font-mono text-meta uppercase tracking-[0.3em] text-truth">
                  Filed · on the record
                </span>
              </div>
            </div>

            <p className="mt-6 max-w-md font-mono text-meta uppercase tracking-[0.25em] text-newsprint/45">
              From submission to public record · the full procedure
            </p>
          </div>
        </div>
      </div>

      {/* Outro: the segue line into the form */}
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-28">
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
          Section · Form · Your turn
        </p>
        <p className="mt-4 max-w-3xl font-display text-2xl leading-snug text-newsprint md:text-4xl">
          Five short steps. Pseudonymous to readers. Verified to us. Your name never appears.
          Your truth always does.
        </p>
      </div>
    </section>
  );
}
