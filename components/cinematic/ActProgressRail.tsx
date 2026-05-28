"use client";
import type { Act } from "@/lib/cinematic/types";

/**
 * Vertical progress rail anchored to the left edge. One dot per act. The
 * active dot enlarges + glows; past dots are filled solid Truth Red; future
 * dots are a hollow outline.
 *
 * Used identically by all trilogy pages so the visual language carries.
 */
export function ActProgressRail({
  acts,
  activeIdx,
  className,
}: {
  acts: Act[];
  activeIdx: number;
  className?: string;
}) {
  return (
    <ol
      aria-label="Story progress"
      className={
        "pointer-events-none fixed left-5 top-1/2 z-30 -translate-y-1/2 space-y-4 md:left-8 " +
        (className ?? "")
      }
    >
      {acts.map((a, i) => {
        const state =
          i < activeIdx ? "past" : i === activeIdx ? "active" : "future";
        return (
          <li
            key={a.id}
            className="flex items-center gap-3 font-mono text-meta uppercase tracking-[0.25em]"
          >
            <span
              aria-hidden
              className={
                "inline-block h-2 w-2 rounded-full transition-all duration-500 " +
                (state === "past"
                  ? "bg-truth"
                  : state === "active"
                  ? "scale-150 bg-truth shadow-[0_0_8px_var(--color-truth)]"
                  : "border border-newsprint/40")
              }
            />
            <span
              className={
                "hidden text-newsprint/55 md:inline " +
                (state === "active" ? "text-newsprint" : "")
              }
            >
              {String(i + 1).padStart(2, "0")}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
