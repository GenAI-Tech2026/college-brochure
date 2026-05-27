"use client";
/**
 * ScrollProgress — slim right-edge progress bar with 5 act ticks.
 *
 * Hover a tick → reveals the act label in monospace. Click a tick →
 * Lenis-scrolls to that act's start (smooth, slow, deliberate — the same
 * pacing as a vintage cinema curtain pull).
 *
 * The bar uses position: fixed but is portalled inside the pinned section
 * (which is also position: fixed during the pin) so it sits in the same
 * coordinate space. We compute the scroll-target as:
 *    pinTop + actStart * pinHeight
 * where pinTop is the document offset of the pin and pinHeight is the
 * total scroll distance allocated to it.
 */
import { useCallback, useState } from "react";
import { ACTS } from "@/lib/manifesto/acts.config";
import { cn } from "@/lib/utils/cn";

interface ScrollProgressProps {
  progress: number;
  pinElement: HTMLElement | null;
  pinScrollLength: number;
}

export function ScrollProgress({
  progress,
  pinElement,
  pinScrollLength,
}: ScrollProgressProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const scrollTo = useCallback(
    (actIndex: number) => {
      if (!pinElement) return;
      const act = ACTS[actIndex];
      const pinTop = pinElement.getBoundingClientRect().top + window.scrollY;
      const target = pinTop + act.start * pinScrollLength;
      const lenis = (window as unknown as { __lenis__?: { scrollTo: (y: number, opts?: object) => void } }).__lenis__;
      if (lenis?.scrollTo) {
        lenis.scrollTo(target, { duration: 2.4 });
      } else {
        window.scrollTo({ top: target, behavior: "smooth" });
      }
    },
    [pinElement, pinScrollLength],
  );

  return (
    <div className="pointer-events-none absolute right-6 top-1/2 z-30 -translate-y-1/2 md:right-10">
      <div className="relative h-[44vh] w-px bg-newsprint/15">
        {/* Filled segment. */}
        <div
          className="absolute left-0 top-0 w-px bg-newsprint origin-top"
          style={{
            height: `${Math.min(100, progress * 100)}%`,
            transition: "height 0.06s linear",
          }}
        />

        {/* Act ticks. */}
        {ACTS.map((act, i) => {
          const isActive = progress >= act.start;
          const isCurrent = progress >= act.start && progress < act.end;
          return (
            <button
              key={act.id}
              onClick={() => scrollTo(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              aria-label={`Jump to ${act.copy.label}`}
              data-cursor="link"
              className="pointer-events-auto absolute -left-2 flex h-4 w-4 -translate-y-1/2 items-center justify-center"
              style={{ top: `${act.start * 100}%` }}
            >
              <span
                className={cn(
                  "block rounded-full transition-all duration-300",
                  isCurrent
                    ? "h-2 w-2 bg-truth"
                    : isActive
                      ? "h-1.5 w-1.5 bg-newsprint"
                      : "h-1 w-1 bg-newsprint/40",
                )}
              />
              {/* Label flag. */}
              <span
                className={cn(
                  "pointer-events-none absolute right-6 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.25em] text-newsprint/80 transition-all duration-300",
                  hovered === i || isCurrent
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-2",
                )}
              >
                {act.copy.label}
              </span>
            </button>
          );
        })}

        {/* Bottom-percent readout. */}
        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-newsprint/50">
          {Math.round(progress * 100).toString().padStart(2, "0")}%
        </span>
      </div>
    </div>
  );
}
