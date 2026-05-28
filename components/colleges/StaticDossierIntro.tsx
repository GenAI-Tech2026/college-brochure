"use client";
import { useState } from "react";
import { CaseFile } from "./CaseFile";

/**
 * Reduced-motion / slow-network fallback. A single static title-card
 * composition: CASE #001 on the left, a paper-stack icon on the right,
 * one line of copy. Click anywhere to dismiss to the grid.
 */
export function StaticDossierIntro({
  count,
  onDismiss,
}: {
  count: number;
  onDismiss: () => void;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        setHidden(true);
        onDismiss();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          setHidden(true);
          onDismiss();
        }
      }}
      className="fixed inset-0 z-[80] grid place-items-center bg-ink cursor-pointer"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-12 items-center gap-6 px-6 md:px-10">
        <div className="col-span-12 md:col-span-5">
          <div style={{ width: "min(220px, 50vw)" }}>
            <CaseFile
              caseNo="CASE #001"
              subtitle="INSTITUTE OF TECHNICAL EXCELLENCE · 2026"
              variant="verified"
              id={0}
            />
          </div>
        </div>
        <div className="col-span-12 md:col-span-7">
          <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
            The Dossier
          </p>
          <h1
            className="mt-3 font-display font-black uppercase leading-none tracking-[-0.04em] text-newsprint"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
          >
            {count.toLocaleString()} files<span className="text-truth">.</span>
          </h1>
          <p className="mt-4 max-w-xl font-display text-xl leading-snug text-newsprint/85">
            Each one a counter-claim against a brochure. Each one verified.
          </p>
          <p className="mt-8 font-mono text-meta uppercase tracking-[0.3em] text-truth">
            Tap anywhere to explore →
          </p>
        </div>
      </div>
    </div>
  );
}
