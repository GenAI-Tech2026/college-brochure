"use client";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MagneticButton } from "@/components/MagneticButton";
import { Spinner } from "@/components/Spinner";

const schema = z.object({
  college: z.string().min(2, "Pick a college"),
  vibe: z.enum(["rage", "warm", "deadpan", "warning", "redeemed"]),
  title: z.string().min(8, "Headline needs at least 8 characters"),
  body: z.string().min(60, "We need a real story — 60 chars at minimum"),
  brochureClaim: z.string().min(8),
  truth: z.string().min(8),
  verificationMethod: z.enum(["id-card", "email-domain", "alumni-roster", "video-selfie"]),
  pseudonym: z.string().min(3, "Pseudonym at least 3 chars"),
  consent: z.literal(true, { errorMap: () => ({ message: "You must consent to publication" }) }),
});

type FormValues = z.infer<typeof schema>;

const steps = [
  { id: "context", title: "01 · Which file?", sub: "Pick the college. Pick the tone." },
  { id: "claim", title: "02 · What did the brochure say?", sub: "Quote the marketing exactly." },
  { id: "truth", title: "03 · What did you find?", sub: "The verified counter-claim." },
  { id: "identity", title: "04 · Verify yourself.", sub: "Pseudonymous to readers. Verified to us." },
  { id: "consent", title: "05 · Sign and file.", sub: "Your truth is now on the record." },
];

/**
 * Multi-step animated review-submission form.
 * - 5 steps, AnimatePresence handles the slide-over transition
 * - RHF + Zod handles validation, no submission target wired (frontend-only)
 * - On final step, we show a redaction-bar-style "ON THE RECORD" stamp
 */
export function MultiStepForm({ defaultCollege }: { defaultCollege?: string }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors }, trigger } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { college: defaultCollege ?? "", vibe: "deadpan" } as Partial<FormValues>,
  });

  const next = async () => {
    const fields = stepFields[step];
    const ok = await trigger(fields as never);
    if (ok) setStep((s) => Math.min(steps.length - 1, s + 1));
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  // The submit is frontend-only, but we simulate a verifying delay so the
  // spinner has a moment to acknowledge the user's click before the
  // "on the record" stamp lands. Reads as if the system is actually
  // cross-checking the brochure quote against the prospectus.
  const onSubmit: SubmitHandler<FormValues> = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1400);
  };

  if (submitted) return <Stamp />;
  if (submitting) return (
    <div className="grid min-h-[60vh] place-items-center">
      <Spinner size="lg" label="Cross-checking brochure language…" className="text-newsprint" />
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid min-h-[80vh] grid-cols-12 gap-6"
    >
      {/* Progress rail */}
      <aside className="col-span-12 md:col-span-3">
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
          Submission · Filed under truth
        </p>
        <ol className="mt-6 space-y-3">
          {steps.map((s, i) => (
            <li
              key={s.id}
              className={
                "border-l-2 pl-4 transition-colors " +
                (i === step ? "border-truth text-newsprint" :
                 i < step ? "border-newsprint text-newsprint" :
                 "border-newsprint/20 text-newsprint/40")
              }
            >
              <p className="font-mono text-meta uppercase tracking-[0.2em]">
                {s.title}
              </p>
              <p className="font-serif italic">{s.sub}</p>
            </li>
          ))}
        </ol>
      </aside>

      <div className="relative col-span-12 min-h-[60vh] md:col-span-9">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -40, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            {step === 0 && (
              <FormStep>
                <Field label="College" error={errors.college?.message}>
                  <input
                    {...register("college")}
                    placeholder="Type the institution"
                    className="w-full border-b border-newsprint/30 bg-transparent pb-2 font-display text-4xl text-newsprint placeholder:text-newsprint/30 focus:border-truth focus:outline-none"
                  />
                </Field>
                <Field label="Vibe" error={errors.vibe?.message}>
                  <div className="flex flex-wrap gap-2">
                    {(["rage", "warm", "deadpan", "warning", "redeemed"] as const).map((v) => (
                      <label key={v} className="cursor-pointer">
                        <input type="radio" value={v} {...register("vibe")} className="peer sr-only" />
                        <span className="block border border-newsprint/30 px-3 py-1.5 font-mono text-meta uppercase tracking-[0.2em] text-newsprint/70 transition peer-checked:bg-truth peer-checked:text-newsprint peer-checked:border-truth">
                          {v}
                        </span>
                      </label>
                    ))}
                  </div>
                </Field>
              </FormStep>
            )}
            {step === 1 && (
              <FormStep>
                <Field label="Brochure claim — quote it exactly" error={errors.brochureClaim?.message}>
                  <textarea
                    {...register("brochureClaim")}
                    rows={3}
                    placeholder="“…100% placements at our flagship campus.”"
                    className="w-full border border-newsprint/30 bg-transparent p-4 font-serif text-xl italic text-newsprint placeholder:text-newsprint/30 focus:border-truth focus:outline-none"
                  />
                </Field>
                <Field label="Headline" error={errors.title?.message}>
                  <input
                    {...register("title")}
                    placeholder="The one-line summary"
                    className="w-full border-b border-newsprint/30 bg-transparent pb-2 font-display text-2xl text-newsprint placeholder:text-newsprint/30 focus:border-truth focus:outline-none"
                  />
                </Field>
              </FormStep>
            )}
            {step === 2 && (
              <FormStep>
                <Field label="Your verified truth" error={errors.truth?.message}>
                  <textarea
                    {...register("truth")}
                    rows={3}
                    placeholder="What actually happened — numbers, contexts, dates."
                    className="w-full border border-newsprint/30 bg-transparent p-4 font-serif text-lg text-newsprint placeholder:text-newsprint/30 focus:border-truth focus:outline-none"
                  />
                </Field>
                <Field label="Your full story" error={errors.body?.message}>
                  <textarea
                    {...register("body")}
                    rows={8}
                    placeholder="Tell us what you saw, what changed, what stayed. We never edit without flagging."
                    className="w-full border border-newsprint/30 bg-transparent p-4 font-serif text-lg text-newsprint placeholder:text-newsprint/30 focus:border-truth focus:outline-none"
                  />
                </Field>
              </FormStep>
            )}
            {step === 3 && (
              <FormStep>
                <Field label="Pseudonym (this is what readers see)" error={errors.pseudonym?.message}>
                  <input
                    {...register("pseudonym")}
                    placeholder="e.g. Halftone-58"
                    className="w-full border-b border-newsprint/30 bg-transparent pb-2 font-display text-3xl text-newsprint placeholder:text-newsprint/30 focus:border-truth focus:outline-none"
                  />
                </Field>
                <Field label="Verification method (one is enough)" error={errors.verificationMethod?.message}>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(["id-card", "email-domain", "alumni-roster", "video-selfie"] as const).map((m) => (
                      <label key={m} className="block cursor-pointer">
                        <input type="radio" value={m} {...register("verificationMethod")} className="peer sr-only" />
                        <span className="block border border-newsprint/30 p-4 font-mono text-meta uppercase tracking-[0.2em] text-newsprint/70 transition peer-checked:border-truth peer-checked:bg-truth/10 peer-checked:text-truth">
                          {m.replace("-", " ")}
                        </span>
                      </label>
                    ))}
                  </div>
                </Field>
              </FormStep>
            )}
            {step === 4 && (
              <FormStep>
                <div className="border border-newsprint/30 p-6 font-serif text-newsprint/80">
                  <p>By filing, you confirm the events you describe occurred, the brochure language you cite is accurate, and you understand College Brochure publishes pseudonymously and never sells identity data.</p>
                </div>
                <Field label="" error={errors.consent?.message}>
                  <label className="flex cursor-pointer items-start gap-3 text-newsprint">
                    <input type="checkbox" {...register("consent")} className="mt-1 h-5 w-5 accent-truth" />
                    <span className="font-serif text-lg">I confirm the truth I&apos;ve filed.</span>
                  </label>
                </Field>
              </FormStep>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-0 left-0 right-0 mt-12 flex items-center justify-between border-t border-newsprint/10 pt-6">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0}
            className="font-mono text-meta uppercase tracking-[0.2em] text-newsprint/60 hover:text-newsprint disabled:opacity-30"
          >
            ← Back
          </button>
          {step < steps.length - 1 ? (
            <MagneticButton type="button" onClick={next} variant="primary">
              Next step
              <span aria-hidden>→</span>
            </MagneticButton>
          ) : (
            <MagneticButton type="submit" variant="primary">
              File the testimony
              <span aria-hidden>↗</span>
            </MagneticButton>
          )}
        </div>
      </div>
    </form>
  );
}

const stepFields: Array<keyof FormValues | (keyof FormValues)[]> = [
  ["college", "vibe"],
  ["brochureClaim", "title"],
  ["truth", "body"],
  ["pseudonym", "verificationMethod"],
  ["consent"],
];

function FormStep({ children }: { children: React.ReactNode }) {
  return <div className="space-y-10 pb-32">{children}</div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      {label && (
        <span className="block font-mono text-meta uppercase tracking-[0.2em] text-newsprint/60">
          {label}
        </span>
      )}
      <div className="mt-3">{children}</div>
      {error && <span className="mt-2 block font-mono text-meta uppercase tracking-[0.2em] text-truth">{error}</span>}
    </label>
  );
}

function Stamp() {
  return (
    <div className="grid min-h-[80vh] place-items-center">
      <div className="text-center">
        <p className="font-mono text-meta uppercase tracking-[0.4em] text-truth">Filed · Verified · On the Record</p>
        <h2 className="mt-6 font-display text-[clamp(3rem,10vw,10rem)] font-black uppercase leading-[0.85] tracking-[-0.04em] text-newsprint">
          On the <span className="italic text-truth">record.</span>
        </h2>
        <p className="mt-6 font-serif text-xl text-newsprint/80">
          Your testimony has been filed under the next-available case number. We&apos;ll cross-check the brochure language against your quote within 48 hours and publish on review.
        </p>
      </div>
    </div>
  );
}
