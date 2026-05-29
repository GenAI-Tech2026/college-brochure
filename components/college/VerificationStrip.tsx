import type { College, Review } from "@/lib/mock-data/types";
import { summarizeVerification, recencyInfo } from "@/lib/utils/reality";

/**
 * Module A·III — THE PROOF RIBBON.
 *
 * Reality is only believed if it's proven. This dark band sits between the
 * at-a-glance summary and the dramatic redaction theatre and answers the
 * unspoken question "says who?": how many students, how they were verified,
 * how much evidence is attached, and how recent it is.
 *
 * A brochure is a frozen artifact; the dated, live nature of this data is
 * itself part of the argument — so recency is given a slot of its own.
 *
 * Static server component.
 */
export function VerificationStrip({
  college,
  reviews,
}: {
  college: College;
  reviews: Review[];
}) {
  const v = summarizeVerification(reviews);
  const recency = recencyInfo(reviews);

  const stats: { value: string; label: string; accent?: boolean }[] = [
    { value: college.verifiedCount.toLocaleString(), label: "students verified" },
    { value: v.withVideo.toLocaleString(), label: "with video proof", accent: v.withVideo > 0 },
    { value: v.totalReceipts.toLocaleString(), label: "documents attached" },
  ];

  return (
    <section
      aria-label="How this evidence is verified"
      className="border-y border-newsprint/10 bg-ink px-6 py-8 md:px-10 md:py-10"
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        {/* numeric proof */}
        <dl className="grid grid-cols-3 gap-6 md:gap-10">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd
                className={
                  "font-display text-[clamp(2rem,5vw,3.5rem)] font-black leading-none tracking-[-0.03em] [font-variant-numeric:tabular-nums] " +
                  (s.accent ? "text-truth" : "text-newsprint")
                }
              >
                {s.value}
              </dd>
              <p className="mt-2 font-mono text-meta uppercase tracking-[0.2em] text-newsprint/60">
                {s.label}
              </p>
            </div>
          ))}
        </dl>

        {/* methods + recency */}
        <div className="flex flex-col gap-4 lg:items-end lg:text-right">
          {v.methods.length > 0 && (
            <p className="font-mono text-meta uppercase tracking-[0.2em] text-newsprint/70">
              <span className="text-newsprint/50">Checked via</span>{" "}
              {v.methods.map((m, i) => (
                <span key={m.method}>
                  {i > 0 && <span className="text-newsprint/30"> · </span>}
                  <span className="text-newsprint">{m.label}</span>
                </span>
              ))}
            </p>
          )}
          {recency.latestLabel && (
            <p className="flex items-center gap-2 font-mono text-meta uppercase tracking-[0.2em] text-newsprint/70 lg:justify-end">
              <span className="relative inline-block h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-truth" />
                <span className="absolute inset-0 animate-ping rounded-full bg-truth/80" />
              </span>
              <span>
                Latest review {recency.latestLabel}
                {recency.spanLabel ? ` · spans ${recency.spanLabel}` : ""}
              </span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
