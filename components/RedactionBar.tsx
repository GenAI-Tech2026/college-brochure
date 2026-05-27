"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface RedactionBarProps {
  claim: string;          // what the brochure says
  truth: string;          // what students say underneath
  delta?: number;         // 0-100, drives initial bar width emphasis
  autoReveal?: boolean;   // reveal on viewport entry
  className?: string;
}

/**
 * The signature device of the site.
 *
 * State 0: black bar painted across the marketing claim (read aloud as
 *          "[REDACTED]" to screen readers).
 * State 1: on scroll (or hover/click), bar wipes right-to-left, exposing
 *          the original marketing copy in muted gray.
 * State 2: a second click flips to TRUTH — the bar repaints in Truth Red
 *          on top of marketing copy, and student truth appears in green.
 *
 * Why three states: the brochure deceives by what it *doesn't* show. We
 * need to walk the user through (1) the assumption, (2) the claim itself,
 * (3) the truth. A single hover ⇆ reveal is too binary.
 */
export function RedactionBar({
  claim,
  truth,
  delta = 50,
  autoReveal = true,
  className,
}: RedactionBarProps) {
  const [state, setState] = useState<0 | 1 | 2>(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoReveal || !ref.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // small delay so the bar visibly *wipes*, not flashes
          setTimeout(() => setState(1), 300);
          io.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [autoReveal]);

  const cycle = () => setState((s) => ((s + 1) % 3) as 0 | 1 | 2);

  return (
    <div
      ref={ref}
      onClick={cycle}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && cycle()}
      role="button"
      tabIndex={0}
      aria-label={
        state === 0
          ? "Redacted marketing claim — click to reveal"
          : state === 1
          ? `Marketing claim: ${claim} — click to see student truth`
          : `Student truth: ${truth} — click to reset`
      }
      data-cursor="text"
      data-cursor-label={state === 0 ? "REVEAL" : state === 1 ? "TRUTH" : "RESET"}
      className={cn(
        "group relative cursor-pointer select-none text-left transition-colors duration-500",
        className
      )}
      style={{ ["--delta" as never]: `${delta}%` }}
    >
      {/* Section header + interaction affordance.
          Makes clear what this block is and what clicking it does. */}
      <div className="mb-3 flex items-center justify-between gap-3 font-mono text-meta uppercase tracking-[0.3em] text-muted">
        <span className="flex items-center gap-3">
          <span className="inline-block h-px w-6 bg-current" />
          <span>Marketing Claim</span>
          <span className="opacity-50">·</span>
          <span>Δ {delta}%</span>
        </span>
        <span className="flex items-center gap-2 text-truth">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-truth"
            style={{ animation: state === 0 ? "pulse 1.6s ease-in-out infinite" : "none" }}
          />
          <span>{state === 0 ? "Click to reveal" : state === 1 ? "Click for truth" : "Click to reset"}</span>
        </span>
      </div>

      {/* Text inherits parent colour — ink on paper sections, newsprint
          on dark sections. opacity-* dims to the right visual weight
          without baking a specific colour that would clash on one bg. */}
      <p
        className={cn(
          "relative font-display text-2xl leading-tight md:text-3xl",
          state === 0 ? "text-transparent"
          : state === 1 ? "opacity-90"
          : "opacity-65 line-through decoration-truth decoration-2"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-[-0.08em] left-[-0.2em] right-[-0.2em] origin-left",
            "transition-transform duration-700 ease-[var(--ease-paper)]",
            state === 0 ? "scale-x-100 bg-redaction" :
            state === 1 ? "scale-x-0 bg-redaction" :
            "scale-x-100 origin-left bg-truth/90"
          )}
        />
        <span className="relative z-10">{claim}</span>
      </p>

      {/* Truth reveals on state === 2 — slides up with serif italic */}
      <div
        className={cn(
          "mt-4 overflow-hidden transition-[max-height,opacity] duration-700 ease-[var(--ease-expo)]",
          state === 2 ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="flex items-center gap-3 font-mono text-meta uppercase tracking-[0.3em] text-truth">
          <span className="inline-block h-px w-6 bg-current" />
          <span>Student Truth</span>
          <span className="opacity-50">·</span>
          <span>Verified</span>
        </div>
        <p className="mt-2 font-serif text-xl italic md:text-2xl">{truth}</p>
      </div>
    </div>
  );
}
