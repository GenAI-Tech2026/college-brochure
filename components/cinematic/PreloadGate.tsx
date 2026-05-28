"use client";
import { useEffect, useState } from "react";

/**
 * Loader gate. Fades away once `ready` flips true (or after `minMs` —
 * whichever is later, so the page doesn't flash if assets are cached).
 *
 * Visual: redaction-bar assembly animation that resolves into the page
 * brand mark.
 */
export function PreloadGate({
  ready,
  minMs = 700,
  label = "Developing the file…",
  children,
}: {
  ready: boolean;
  minMs?: number;
  label?: string;
  children: React.ReactNode;
}) {
  const [hide, setHide] = useState(false);
  const [grace, setGrace] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setGrace(true), minMs);
    return () => window.clearTimeout(t);
  }, [minMs]);

  useEffect(() => {
    if (ready && grace) {
      const t = window.setTimeout(() => setHide(true), 250);
      return () => window.clearTimeout(t);
    }
  }, [ready, grace]);

  return (
    <>
      {children}
      {!hide ? (
        <div
          aria-hidden={ready ? "true" : undefined}
          className="pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-ink transition-opacity duration-500"
          style={{ opacity: ready && grace ? 0 : 1 }}
        >
          <div className="flex flex-col items-center gap-6">
            {/* redaction-bar assembly */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <span
                  key={i}
                  className="inline-block h-3 w-6 origin-left bg-truth"
                  style={{
                    animation: `redaction-assemble 1.2s ${i * 0.07}s var(--ease-paper) infinite`,
                  }}
                />
              ))}
            </div>
            <p className="font-mono text-meta uppercase tracking-[0.35em] text-newsprint/65">
              {label}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
