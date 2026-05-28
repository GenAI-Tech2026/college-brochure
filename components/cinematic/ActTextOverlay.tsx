"use client";
import type { OverlayText } from "@/lib/cinematic/types";

/**
 * Editorial text overlay. Each overlay fades in/out based on the act's
 * local progress. Supports an optional sub-line under the main line
 * (mono caps, teletype-flavoured) for status text like
 * "BEACON OFFLINE · AWAITING SIGNAL".
 *
 * `subline` can also be overridden per-render — when the form is between
 * acts but the panel wants to surface a different status line per pulse
 * step. Pass `sublineOverride` to the page-level overlay.
 */
export function ActTextOverlay({
  overlays,
  progress,
  sublineOverride,
}: {
  overlays?: OverlayText[];
  progress: number;
  sublineOverride?: string;
}) {
  if (!overlays?.length) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {overlays.map((o, i) => {
        const enterAt = o.enterAt ?? 0;
        const exitAt = o.exitAt ?? 1;
        const entryRange = 0.12;
        const exitRange = 0.12;
        const inAlpha = clamp01((progress - enterAt) / entryRange);
        const outAlpha = clamp01((exitAt - progress) / exitRange);
        const alpha = Math.max(0, Math.min(inAlpha, outAlpha));
        if (alpha <= 0.005) return null;

        const align = o.align ?? "left";
        const vAlign = o.vAlign ?? "bottom";
        const containerPos = posClasses(align, vAlign);
        const textAlign =
          align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

        return (
          <div
            key={i}
            className={
              "absolute max-w-3xl px-6 transition-opacity duration-300 md:px-10 " +
              containerPos +
              " " +
              textAlign
            }
            style={{ opacity: alpha }}
          >
            {o.kicker ? (
              <p className="mb-3 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/65">
                {o.kicker}
              </p>
            ) : null}
            <p
              className="font-display font-medium leading-[1.05] tracking-[-0.02em] text-newsprint"
              style={{ fontSize: "clamp(1.75rem, 4.5vw, 3.5rem)" }}
            >
              <Renderer text={o.line} />
            </p>
            {sublineOverride || o.subline ? (
              <p className="mt-4 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
                {sublineOverride ?? o.subline}
              </p>
            ) : null}
            {o.caption ? (
              <p className="mt-2 font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55">
                {o.caption}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function posClasses(
  align: "left" | "center" | "right",
  vAlign: "top" | "center" | "bottom",
): string {
  const v =
    vAlign === "top"
      ? "top-24 md:top-32"
      : vAlign === "center"
      ? "top-1/2 -translate-y-1/2"
      : "bottom-24 md:bottom-32";
  const h =
    align === "center"
      ? "left-1/2 -translate-x-1/2"
      : align === "right"
      ? "right-0"
      : "left-0";
  return v + " " + h;
}

function Renderer({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const re = /<em>(.*?)<\/em>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <em key={key++} className="font-display italic text-truth">
        {m[1]}
      </em>,
    );
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
