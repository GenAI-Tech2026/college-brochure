"use client";
import { useEffect, useState } from "react";
import { setSoundEnabled, isSoundEnabled, stop } from "@/lib/cinematic/sound";

/**
 * Top-right toggle. Off by default — no ambient audio plays until the user
 * explicitly opts in. The icon swaps between mute and speaker.
 */
export function SoundToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(isSoundEnabled());
  }, []);

  const toggle = () => {
    const next = !on;
    setSoundEnabled(next);
    setOn(next);
    if (!next) stop();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Mute ambient sound" : "Enable ambient sound"}
      className="fixed right-5 top-5 z-40 inline-flex items-center gap-2 border border-newsprint/20 bg-ink/60 px-3 py-2 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/80 backdrop-blur-sm transition-colors hover:border-truth hover:text-newsprint md:right-8 md:top-8"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
        {on ? (
          <path
            d="M3 9v6h4l5 4V5L7 9H3Zm14 0a4 4 0 010 6m2-9a8 8 0 010 12"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M3 9v6h4l5 4V5L7 9H3ZM16 9l5 6m0-6-5 6"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
        )}
      </svg>
      <span className="hidden md:inline">{on ? "sound on" : "sound off"}</span>
    </button>
  );
}
