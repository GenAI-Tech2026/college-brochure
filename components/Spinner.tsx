"use client";
import { cn } from "@/lib/utils/cn";

/**
 * Editorial loading indicator. Not a generic spinner — it's a single
 * vermillion redaction bar that scans back-and-forth across its frame,
 * matching the site's "the brochure is being redacted" idiom (see also
 * app/loading.tsx).
 *
 * Two sizes:
 *   sm  — inline next to a label (e.g. "Loading evidence…")
 *   md  — block-level, sits on top of a canvas while it boots
 *
 * The variant `overlay` adds a tinted backdrop so the bar can ride on
 * top of a transparent canvas during init without bleeding through.
 */
export function Spinner({
  size = "md",
  variant = "default",
  label,
  className,
}: {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "overlay";
  label?: string;
  className?: string;
}) {
  const dims = {
    sm: "h-1 w-12",
    md: "h-1.5 w-40",
    lg: "h-2 w-56",
  }[size];

  const inner = (
    <div className={cn("flex flex-col items-center gap-3", className)} role="status" aria-live="polite">
      <div className={cn("relative overflow-hidden", dims)} aria-hidden="true">
        <span className="absolute inset-0 bg-current opacity-15" />
        <span
          className="absolute inset-y-0 left-0 w-1/3 bg-truth"
          style={{ animation: "redaction-assemble 1.4s var(--ease-paper) infinite" }}
        />
      </div>
      {label && (
        <p className="font-mono text-meta uppercase tracking-[0.3em] opacity-75">{label}</p>
      )}
      <span className="sr-only">{label || "Loading"}</span>
    </div>
  );

  if (variant === "overlay") {
    return (
      <div className="absolute inset-0 z-20 grid place-items-center bg-ink/30 backdrop-blur-sm">
        {inner}
      </div>
    );
  }
  return inner;
}
