"use client";
import { useEffect, useRef } from "react";

const KEY = "uf:submit:draft:v1";

export type SubmitDraft = {
  step: number;
  values: Record<string, unknown>;
  savedAt: number;
};

export function loadDraft(): SubmitDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SubmitDraft;
    // Treat drafts older than 14 days as stale.
    if (Date.now() - parsed.savedAt > 14 * 86400_000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(d: Omit<SubmitDraft, "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ ...d, savedAt: Date.now() }),
    );
  } catch {
    /* quota / disabled — silent */
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* silent */
  }
}

/**
 * Auto-save the current form state every time `payload` changes, debounced.
 * Returns nothing; the page consumes load/clear directly from the helpers
 * above.
 */
export function useAutoSaveDraft(payload: { step: number; values: Record<string, unknown> }) {
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => saveDraft(payload), 350);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [payload]);
}
