"use client";
import { useSoundStore } from "@/lib/store/filterStore";

/**
 * Off by default. Howler is dynamically imported only after the user
 * opts in — so we don't pay the audio context cost for silent visitors.
 */
export function SoundToggle() {
  const { enabled, toggle } = useSoundStore();

  const handleToggle = async () => {
    if (!enabled) {
      const { Howler } = await import("howler");
      // unlock audio context with a silent ping
      const ctx = (Howler as { ctx?: AudioContext }).ctx;
      if (ctx && ctx.state === "suspended") await ctx.resume();
    }
    toggle();
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={enabled ? "Mute ambient sound" : "Enable ambient sound"}
      title={enabled ? "Click to mute ambient sound" : "Click to enable ambient sound"}
      data-cursor="link"
      className="flex items-center gap-2 font-mono text-meta uppercase tracking-[0.2em]"
    >
      <span aria-hidden className="inline-flex gap-[2px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={
              "block w-[2px] bg-current transition-all " +
              (enabled ? "h-3 animate-pulse" : "h-1 opacity-30")
            }
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      <span>{enabled ? "Sound on" : "Sound off"}</span>
    </button>
  );
}
