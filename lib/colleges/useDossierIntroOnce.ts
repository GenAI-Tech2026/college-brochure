"use client";
import { useEffect, useState } from "react";

/**
 * Once-per-session gate for the cinematic intro.
 *
 * Returns:
 *   shouldPlay   — true the first time per session, false thereafter
 *   fastMode     — true on return visits (intro plays in ~2s, sped up)
 *   submittedEgg — true if the user just came from /submit (gives the
 *                  Beat-4 "yours" highlight)
 *   markSeen     — call once the intro completes
 *
 * sessionStorage keys:
 *   uf:dossierIntroSeen     "1" if played at least once this tab session
 *   uf:submittedThisSession "1" if the user just submitted via /submit
 */
const KEY = "uf:dossierIntroSeen";
const SUBMITTED_KEY = "uf:submittedThisSession";

export function useDossierIntroOnce() {
  // SSR-safe: assume "play" until hydration tells us otherwise.
  const [state, setState] = useState({
    shouldPlay: true,
    fastMode: false,
    submittedEgg: false,
    hydrated: false,
  });

  useEffect(() => {
    const seen = window.sessionStorage.getItem(KEY) === "1";
    const submittedEgg = window.sessionStorage.getItem(SUBMITTED_KEY) === "1";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // 2g / save-data → don't play
    const conn = (
      navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection;
    const slow =
      conn?.saveData === true ||
      conn?.effectiveType === "2g" ||
      conn?.effectiveType === "slow-2g";

    setState({
      shouldPlay: !reduced && !slow,
      fastMode: seen,
      submittedEgg,
      hydrated: true,
    });
  }, []);

  const markSeen = () => {
    try {
      window.sessionStorage.setItem(KEY, "1");
      window.sessionStorage.removeItem(SUBMITTED_KEY);
    } catch {
      /* private mode / quota — silent */
    }
  };

  return { ...state, markSeen };
}
