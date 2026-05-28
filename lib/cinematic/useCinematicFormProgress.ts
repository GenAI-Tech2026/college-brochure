"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Act, FormTriggerMap } from "./types";

/**
 * Form-progress-driven cinematic state with three augmentations beyond the
 * basic crossfade:
 *
 *  - PHASE machine: "editing" → "transmitting" → "arrived". `transmitting`
 *    is an uninterruptible window during which Act 4's hero plays full-
 *    length; only after `holdMs` elapses does the engine auto-advance to
 *    `arrived` (Act 5 + CTAs).
 *
 *  - PULSE signal: a 0..1 value that ramps to 1 when a "pulse step" is
 *    completed and decays back to 0 over `pulseMs`. Used by scenes to
 *    intensify the filament without changing acts.
 *
 *  - DRAFT awareness via `extraTriggers` (we surface the latest step the
 *    user has crossed so the panel/scene can render per-step sub-status
 *    labels).
 *
 * Reverse-crossfade falls out for free: if the user backs to an earlier
 * step the target act changes and the crossfade timeline runs again.
 */
export function useCinematicFormProgress({
  acts,
  triggers,
  pulseSteps = [],
  crossfadeMs = 1200,
  pulseMs = 800,
  transmitHoldMs = 10_000,
}: {
  acts: Act[];
  triggers: FormTriggerMap;
  /** Steps that fire a pulse (not an act change). */
  pulseSteps?: number[];
  crossfadeMs?: number;
  pulseMs?: number;
  transmitHoldMs?: number;
}) {
  const [step, setStep] = useState<number>(0);
  const [phase, setPhase] = useState<"editing" | "transmitting" | "arrived">("editing");
  const [bailing, setBailing] = useState(false);
  const [pulse, setPulse] = useState(0);

  // What act should be the target right now?
  const targetActId = (() => {
    if (bailing) return "bail";
    if (phase === "transmitting") return triggers.transmittingActId ?? triggers.onSubmit ?? triggers.initialActId;
    if (phase === "arrived") return triggers.arrivedActId ?? triggers.onSubmit ?? triggers.initialActId;
    if (step >= 1) {
      for (let s = step; s >= 1; s--) {
        const id = triggers.byStep[s];
        if (id) return id;
      }
    }
    return triggers.initialActId;
  })();

  // Two-act crossfade book-keeping
  const [currentId, setCurrentId] = useState(targetActId);
  const [previousId, setPreviousId] = useState<string | null>(null);
  const [fade, setFade] = useState(1);
  const fadeRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (targetActId === currentId) return;
    if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);
    setPreviousId(currentId);
    setCurrentId(targetActId);
    setFade(0);

    const start = performance.now();
    const tick = (t: number) => {
      const elapsed = t - start;
      const p = Math.min(1, elapsed / crossfadeMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setFade(eased);
      if (p < 1) fadeRafRef.current = requestAnimationFrame(tick);
      else {
        setPreviousId(null);
        fadeRafRef.current = null;
      }
    };
    fadeRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);
    };
  }, [targetActId, currentId, crossfadeMs]);

  // Pulse ramp+decay. Triggered by `triggerPulse()`.
  const pulseRafRef = useRef<number | null>(null);
  const triggerPulse = useCallback(() => {
    if (pulseRafRef.current) cancelAnimationFrame(pulseRafRef.current);
    const start = performance.now();
    const tick = (t: number) => {
      const elapsed = t - start;
      const p = Math.min(1, elapsed / pulseMs);
      // Triangular: rise to peak at 0.25, decay to 0 at 1.
      const v = p < 0.25 ? p / 0.25 : 1 - (p - 0.25) / 0.75;
      setPulse(v);
      if (p < 1) pulseRafRef.current = requestAnimationFrame(tick);
      else {
        setPulse(0);
        pulseRafRef.current = null;
      }
    };
    pulseRafRef.current = requestAnimationFrame(tick);
  }, [pulseMs]);

  // When the user advances to a "pulse" step, fire a pulse.
  useEffect(() => {
    if (phase !== "editing") return;
    if (pulseSteps.includes(step)) triggerPulse();
  }, [step, phase, pulseSteps, triggerPulse]);

  const goStep = useCallback((n: number) => {
    setBailing(false);
    setPhase("editing");
    setStep(Math.max(0, n));
  }, []);

  /**
   * Submit kicks the page into the locked "transmitting" phase. After
   * `transmitHoldMs` the engine auto-advances to "arrived" (Act 5).
   */
  const transmitTimerRef = useRef<number | null>(null);
  const submit = useCallback(() => {
    setBailing(false);
    setPhase("transmitting");
    if (transmitTimerRef.current) window.clearTimeout(transmitTimerRef.current);
    transmitTimerRef.current = window.setTimeout(() => {
      setPhase("arrived");
    }, transmitHoldMs);
  }, [transmitHoldMs]);

  useEffect(() => {
    return () => {
      if (transmitTimerRef.current) window.clearTimeout(transmitTimerRef.current);
    };
  }, []);

  const bail = useCallback(() => setBailing(true), []);
  const resumeFromBail = useCallback(() => setBailing(false), []);

  const totalSteps = Math.max(...Object.keys(triggers.byStep).map(Number), 1);
  const fillRatio = Math.min(1, step / totalSteps);

  const current = acts.find((a) => a.id === currentId) ?? acts[0];
  const previous = previousId
    ? acts.find((a) => a.id === previousId) ?? null
    : null;

  return {
    step,
    phase,
    bailing,
    current,
    previous,
    fade,
    pulse,
    fillRatio,
    totalSteps,
    goStep,
    submit,
    bail,
    resumeFromBail,
    triggerPulse,
  };
}
