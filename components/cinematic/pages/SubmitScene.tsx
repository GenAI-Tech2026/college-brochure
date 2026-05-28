"use client";
import { useCallback, useState } from "react";
import { submitConfig, submitPulseSteps } from "@/lib/submit/acts.config";
import { useCinematicFormProgress } from "@/lib/cinematic/useCinematicFormProgress";
import { SubmitFormPanel } from "./SubmitFormPanel";
import { submitTestimony } from "@/lib/submit/submitAction";

/**
 * /submit — just the form. No cinematic, no scene imagery.
 *
 * The submit phase machine is kept only so the form panel can surface its
 * own submitting / filed states after a successful submission.
 */
export function SubmitScene() {
  const [caseNo, setCaseNo] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitPayload = useCallback(
    async (payload: Parameters<typeof submitTestimony>[0]) => {
      if (submitting) return;
      setSubmitting(true);
      setSubmitError(null);
      const res = await submitTestimony(payload);
      setSubmitting(false);
      if (!res.ok) {
        setSubmitError(res.reason);
        return;
      }
      setCaseNo(res.caseNo);
      try {
        window.sessionStorage.setItem("uf:submittedThisSession", "1");
      } catch {
        /* private mode — silent */
      }
      submit();
    },
    [submitting],
  );

  const { goStep, submit, phase } = useCinematicFormProgress({
    acts: submitConfig.acts,
    triggers: submitConfig.triggers!,
    pulseSteps: submitPulseSteps,
    crossfadeMs: 1400,
    pulseMs: 800,
    transmitHoldMs: 10_000,
  });

  return (
    <section id="submit-form" className="min-h-screen bg-ink px-6 py-24 text-newsprint md:px-10 md:py-32">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
          File your truth
        </p>
        <h1
          className="mt-6 mb-12 font-display font-medium leading-[1.05] tracking-tight text-newsprint"
          style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}
        >
          File your <em className="font-display italic text-truth">truth.</em>
        </h1>
        <SubmitFormPanel
          onStepChange={goStep}
          onSubmit={(payload) => void handleSubmitPayload(payload)}
          onBail={() => {}}
          onResume={() => {}}
          isBailing={false}
          phase={phase}
          caseNo={caseNo}
          submitError={submitError}
        />
      </div>
    </section>
  );
}
