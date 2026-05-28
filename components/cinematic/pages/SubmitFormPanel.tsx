"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loadDraft, saveDraft, clearDraft } from "@/lib/submit/useSubmitDraft";

/**
 * SubmitFormPanel — the floating glass panel that drives the cinematic.
 *
 * One question at a time (Typeform-flavoured). Step transitions notify the
 * parent so the cinematic can crossfade acts on Step 1/2 and pulse the
 * filament on Steps 3/4/5/6. Submit kicks the parent into the locked
 * "transmitting" phase.
 *
 * Persists every keystroke to localStorage via `useSubmitDraft` so the
 * "Save & return" exit can resume mid-thought.
 */

const schema = z.object({
  college: z.string().min(2, "Pick a college."),
  brochureClaim: z
    .string()
    .min(20, "Quote at least 20 characters of the claim — be specific."),
  reality: z
    .string()
    .min(20, "Tell us what you actually found — at least 20 characters."),
  hasReceipts: z.enum(["yes", "no"]),
  email: z
    .string()
    .regex(
      /^[^\s@]+@[^\s@]+\.(edu|edu\.in|ac\.in)$/i,
      "Use your .edu / .ac.in email.",
    ),
  identity: z.enum(["anonymous", "named"]),
});
type Values = z.infer<typeof schema>;

const STEPS = [
  { name: "college",       label: "Which college?",                           placeholder: "Type the institution" },
  { name: "brochureClaim", label: "What did the brochure or website promise?", placeholder: "Quote the claim. Be specific." },
  { name: "reality",       label: "What was the actual reality?",             placeholder: "Be specific. Numbers, dates help." },
  { name: "hasReceipts",   label: "Got receipts?",                            placeholder: "" },
  { name: "email",         label: "Your .edu / .ac.in email",                 placeholder: "you@university.edu" },
  { name: "identity",      label: "Anonymous or named?",                      placeholder: "" },
] as const;
type FieldName = (typeof STEPS)[number]["name"];

export function SubmitFormPanel({
  onStepChange,
  onSubmit,
  onBail,
  onResume,
  isBailing,
  phase,
  caseNo,
  submitError,
}: {
  onStepChange: (step: number) => void;
  onSubmit: (payload: Values) => void;
  onBail: () => void;
  onResume: () => void;
  isBailing: boolean;
  phase: "editing" | "transmitting" | "arrived";
  caseNo?: string | null;
  submitError?: string | null;
}) {
  const [step, setStep] = useState(0);

  // Hydrate from saved draft on first mount.
  const draftLoadedRef = useRef(false);

  const {
    register,
    trigger,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    reset,
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      hasReceipts: "yes",
      identity: "anonymous",
    },
  });

  useEffect(() => {
    if (draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    const d = loadDraft();
    if (d) {
      reset(d.values as Partial<Values>);
      setStep(d.step);
    }
  }, [reset]);

  // Autosave on every state change.
  const watchAll = watch();
  useEffect(() => {
    const timer = window.setTimeout(
      () => saveDraft({ step, values: watchAll as Record<string, unknown> }),
      350,
    );
    return () => window.clearTimeout(timer);
  }, [watchAll, step]);

  // Surface step changes to the parent (act crossfade + pulse).
  const lastReportedRef = useRef(-1);
  useEffect(() => {
    if (step !== lastReportedRef.current) {
      lastReportedRef.current = step;
      onStepChange(step);
    }
  }, [step, onStepChange]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const total = STEPS.length;

  const next = async () => {
    const ok = await trigger(current.name as FieldName);
    if (ok) setStep((s) => Math.min(total - 1, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const onKey: React.KeyboardEventHandler<HTMLFormElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "TEXTAREA") return;
      e.preventDefault();
      if (isLast) void doSubmit();
      else void next();
    }
  };

  const doSubmit = async () => {
    const ok = await trigger();
    if (!ok) return;
    const payload = getValues();
    console.log("[/submit] payload →", payload);
    clearDraft();
    onSubmit(payload);
  };

  // Compose the email-derived "Named:" label for the identity toggle.
  const email = watch("email");
  const namedFromEmail = email ? email.split("@")[0] : null;

  if (isBailing) {
    return (
      <Panel>
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
          Draft saved
        </p>
        <h3 className="mt-2 font-display text-2xl font-medium leading-tight text-newsprint">
          We&rsquo;ll keep your <em className="italic text-truth">seat warm.</em>
        </h3>
        <p className="mt-3 font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55">
          You can return any time. Nothing was filed.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onResume}
            className="bg-truth px-4 py-2.5 font-mono text-meta uppercase tracking-[0.3em] text-newsprint hover:bg-truth/85"
          >
            Take me back →
          </button>
          <Link
            href="/"
            className="border border-newsprint/30 px-4 py-2.5 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/75 hover:border-truth"
          >
            Home
          </Link>
        </div>
      </Panel>
    );
  }

  if (phase === "transmitting") {
    return (
      <Panel>
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-truth">
          Transmitting · signal away
        </p>
        <h3
          className="mt-2 font-display font-medium leading-[1.05] text-newsprint"
          style={{ fontSize: "clamp(1.4rem, 2.4vw, 1.85rem)" }}
        >
          Hold the line. <em className="italic text-truth">The network is listening.</em>
        </h3>
        <p className="mt-4 font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55">
          Verifying domain · cross-checking the prospectus · pinging the archive.
        </p>
        <Loader />
      </Panel>
    );
  }

  if (phase === "arrived") {
    return (
      <Panel>
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-truth">
          On the record · case {caseNo ?? "UF-####"}
        </p>
        <h3
          className="mt-2 font-display font-medium leading-[1.05] text-newsprint"
          style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)" }}
        >
          Your truth is now <em className="italic text-truth">part of the file.</em>
        </h3>
        <p className="mt-4 font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55">
          You&rsquo;ll receive nothing. No emails. No tracking. Your truth is what mattered.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/colleges"
            className="bg-truth px-4 py-2.5 font-mono text-meta uppercase tracking-[0.3em] text-newsprint hover:bg-truth/85"
          >
            Read the archive →
          </Link>
          <Link
            href="/submit"
            className="border border-newsprint/30 px-4 py-2.5 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/75 hover:border-truth"
          >
            Submit another truth
          </Link>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
          Step {String(step + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
        <button
          type="button"
          onClick={onBail}
          className="font-mono text-meta uppercase tracking-[0.25em] text-newsprint/45 hover:text-truth"
        >
          Save &amp; return
        </button>
      </div>

      {/* progress segments */}
      <div className="mt-3 flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={
              "inline-block h-1 flex-1 transition-colors duration-500 " +
              (i < step ? "bg-truth" : i === step ? "bg-truth/50" : "bg-newsprint/15")
            }
          />
        ))}
      </div>

      <form
        onKeyDown={onKey}
        onSubmit={(e) => {
          e.preventDefault();
          void doSubmit();
        }}
        className="mt-6 space-y-3"
      >
        {submitError ? (
          <div className="border-l-2 border-truth bg-truth/10 px-3 py-2 font-mono text-meta uppercase tracking-[0.2em] text-truth">
            {submitError}
          </div>
        ) : null}
        <label className="block font-display text-xl font-medium leading-tight text-newsprint">
          {current.label}
        </label>

        {current.name === "college" ? (
          <input
            key="college"
            type="text"
            placeholder={current.placeholder}
            autoFocus
            list="colleges-datalist"
            {...register("college")}
            className="w-full border-b border-newsprint/30 bg-transparent py-2 text-newsprint outline-none focus:border-truth"
          />
        ) : current.name === "email" ? (
          <div>
            <input
              key="email"
              type="email"
              placeholder={current.placeholder}
              autoFocus
              autoComplete="email"
              {...register("email")}
              className="w-full border-b border-newsprint/30 bg-transparent py-2 text-newsprint outline-none focus:border-truth"
            />
            <p className="mt-2 font-mono text-meta uppercase tracking-[0.2em] text-newsprint/45">
              Verified privately. Never shown.
            </p>
          </div>
        ) : current.name === "brochureClaim" || current.name === "reality" ? (
          <CharCountedTextarea
            key={current.name}
            placeholder={current.placeholder}
            register={register(current.name)}
            value={String(watch(current.name) ?? "")}
            min={20}
          />
        ) : current.name === "hasReceipts" ? (
          <ReceiptToggle
            value={watch("hasReceipts")}
            onChange={(v) => setValue("hasReceipts", v)}
          />
        ) : (
          <IdentityToggle
            value={watch("identity")}
            onChange={(v) => setValue("identity", v)}
            namedLabel={namedFromEmail}
          />
        )}

        {(errors as Record<string, { message?: string }>)[current.name]?.message ? (
          <p className="font-mono text-meta uppercase tracking-[0.2em] text-truth">
            {(errors as Record<string, { message?: string }>)[current.name]?.message}
          </p>
        ) : null}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55 hover:text-newsprint disabled:opacity-30"
          >
            ← Back
          </button>
          {isLast ? (
            <button
              key="transmit"
              type="button"
              onClick={() => void doSubmit()}
              className="bg-truth px-4 py-2.5 font-mono text-meta uppercase tracking-[0.3em] text-newsprint hover:bg-truth/85"
            >
              Transmit signal →
            </button>
          ) : (
            <button
              key="continue"
              type="button"
              onClick={() => void next()}
              className="bg-truth px-4 py-2.5 font-mono text-meta uppercase tracking-[0.3em] text-newsprint hover:bg-truth/85"
            >
              Continue →
            </button>
          )}
        </div>
      </form>

      {/* Lightweight inline autocomplete for the college field */}
      <datalist id="colleges-datalist">
        {[
          "Institute of Technical Excellence, Bombay",
          "Sai Deemed-To-Be University",
          "Nila Academy of Arts and Design",
          "Asianova Business School",
          "Kaveri Regional University",
        ].map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </Panel>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="pointer-events-auto w-full max-w-[460px] border border-truth/25 bg-ink/55 p-6 backdrop-blur-md md:p-7"
      role="form"
      aria-label="Submit your truth"
    >
      {children}
    </div>
  );
}

function CharCountedTextarea({
  placeholder,
  register,
  value,
  min,
}: {
  placeholder: string;
  register: ReturnType<ReturnType<typeof useForm>["register"]>;
  value: string;
  min: number;
}) {
  const count = value.length;
  return (
    <div>
      <textarea
        placeholder={placeholder}
        autoFocus
        rows={3}
        {...register}
        className="w-full resize-y border border-newsprint/20 bg-transparent p-3 text-newsprint outline-none focus:border-truth"
      />
      <p
        className={
          "mt-1 text-right font-mono text-meta uppercase tracking-[0.2em] " +
          (count >= min ? "text-newsprint/55" : "text-truth/85")
        }
      >
        {count} / {min} min
      </p>
    </div>
  );
}

function ReceiptToggle({
  value,
  onChange,
}: {
  value: "yes" | "no";
  onChange: (v: "yes" | "no") => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55">
        Photos, screenshots, documents — anything that backs the claim.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange("yes")}
          className={
            "flex-1 border px-3 py-3 font-mono text-meta uppercase tracking-[0.25em] transition-colors " +
            (value === "yes"
              ? "border-truth bg-truth/15 text-truth"
              : "border-newsprint/25 text-newsprint/65 hover:border-newsprint/50")
          }
        >
          Yes — I have receipts
        </button>
        <button
          type="button"
          onClick={() => onChange("no")}
          className={
            "flex-1 border px-3 py-3 font-mono text-meta uppercase tracking-[0.25em] transition-colors " +
            (value === "no"
              ? "border-truth bg-truth/15 text-truth"
              : "border-newsprint/25 text-newsprint/65 hover:border-newsprint/50")
          }
        >
          No — just my account
        </button>
      </div>
      <p className="mt-1 font-mono text-meta uppercase tracking-[0.2em] text-newsprint/40">
        File uploads are disabled in this preview.
      </p>
    </div>
  );
}

function IdentityToggle({
  value,
  onChange,
  namedLabel,
}: {
  value: "anonymous" | "named";
  onChange: (v: "anonymous" | "named") => void;
  namedLabel: string | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55">
        We verify identity. We never display it.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange("anonymous")}
          className={
            "flex-1 border px-3 py-3 font-mono text-meta uppercase tracking-[0.25em] transition-colors " +
            (value === "anonymous"
              ? "border-truth bg-truth/15 text-truth"
              : "border-newsprint/25 text-newsprint/65 hover:border-newsprint/50")
          }
        >
          Pseudonym
        </button>
        <button
          type="button"
          onClick={() => onChange("named")}
          className={
            "flex-1 truncate border px-3 py-3 font-mono text-meta uppercase tracking-[0.25em] transition-colors " +
            (value === "named"
              ? "border-truth bg-truth/15 text-truth"
              : "border-newsprint/25 text-newsprint/65 hover:border-newsprint/50")
          }
          title={namedLabel ?? undefined}
        >
          Named{namedLabel ? ` · ${namedLabel}` : ""}
        </button>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="mt-6 flex items-center gap-1">
      {Array.from({ length: 7 }).map((_, i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-6 origin-left bg-truth"
          style={{
            animation: `redaction-assemble 1.2s ${i * 0.07}s var(--ease-paper) infinite`,
          }}
        />
      ))}
    </div>
  );
}
