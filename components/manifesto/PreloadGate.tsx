"use client";
/**
 * PreloadGate — editorial loader shown while the first 60 frames decode.
 *
 * Uses the existing redaction-bar visual language: the loader is a single
 * black bar that "censors" the headline, retracting as preload progresses
 * — a visual metaphor for the censorship the manifesto is about to undo.
 */
import { useEffect, useState } from "react";

interface PreloadGateProps {
  progress: number;
  readyEnough: boolean;
  onDismiss: () => void;
}

export function PreloadGate({ progress, readyEnough, onDismiss }: PreloadGateProps) {
  const [visible, setVisible] = useState(true);

  // Auto-dismiss once we're ready enough, with a short exit so the user
  // sees the headline land before they start scrolling the scene.
  useEffect(() => {
    if (!readyEnough) return;
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 700);
    }, 350);
    return () => clearTimeout(t);
  }, [readyEnough, onDismiss]);

  return (
    <div
      aria-hidden={!visible}
      className="pointer-events-auto absolute inset-0 z-40 flex flex-col items-center justify-center bg-ink transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
    >
      <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
        Preparing the stage
      </p>

      <h3
        className="relative mt-6 font-display font-black uppercase text-newsprint"
        style={{ fontSize: "clamp(2.5rem, 9vw, 8rem)", letterSpacing: "-0.02em", lineHeight: 0.95 }}
      >
        <span className="relative">
          A Manifesto.
          {/* Censor bar — retracts as load progresses. */}
          <span
            aria-hidden
            className="absolute inset-y-[0.05em] -inset-x-[0.05em] bg-redaction"
            style={{
              transform: `scaleX(${1 - Math.min(0.95, progress)})`,
              transformOrigin: "right",
              transition: "transform 0.4s var(--ease-paper)",
            }}
          />
        </span>
      </h3>

      <div className="mt-12 w-[260px]">
        <div className="h-px w-full bg-newsprint/20">
          <div
            className="h-px bg-truth"
            style={{ width: `${Math.round(progress * 100)}%`, transition: "width 0.18s linear" }}
          />
        </div>
        <p className="mt-3 flex justify-between font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
          <span>Decoding film</span>
          <span>{Math.round(progress * 100).toString().padStart(2, "0")}%</span>
        </p>
      </div>
    </div>
  );
}
