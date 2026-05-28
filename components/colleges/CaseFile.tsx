"use client";
import type { StampVariant } from "@/lib/colleges/cascadeChoreography";

/**
 * Single manila case file. Vertically-oriented 3:4 rectangle.
 *
 * The visual is pure SVG so it scales to any pose without rasterization
 * artifacts. The hand-stamped feel comes from a slight per-file random
 * rotation on the stamp itself (deterministic from `id`) plus a distressed
 * SVG filter on the stamp's edge.
 *
 * Variants change ONLY the stamp colour + label, so colour is the only
 * vector of difference; the manila kraft body stays consistent across the
 * cascade for visual cohesion.
 */
const STAMP_BY_VARIANT: Record<StampVariant, { label: string; fill: string; stroke: string }> = {
  standard:      { label: "CASE",          fill: "rgba(255, 67, 50, 0.85)", stroke: "#7a0d05" },
  verified:      { label: "✓ VERIFIED",    fill: "rgba(6, 214, 160, 0.85)", stroke: "#055a44" },
  failed:        { label: "CLAIM FAILED",  fill: "rgba(255, 67, 50, 0.90)", stroke: "#7a0d05" },
  investigating: { label: "INVESTIGATING", fill: "rgba(244, 196, 65, 0.92)", stroke: "#6d4f0c" },
};

export function CaseFile({
  caseNo,
  subtitle,
  variant,
  id,
  isYours,
  morphing,
  size = 1,
}: {
  caseNo: string;
  subtitle: string;
  variant: StampVariant;
  id: number;
  isYours?: boolean;
  morphing?: boolean;
  /** Scale factor — used during the cascade for varied perceived depth. */
  size?: number;
}) {
  const stampRot = ((id * 113) % 6) - 3; // -3..+3 deg, deterministic
  const stamp = STAMP_BY_VARIANT[variant];

  return (
    <div
      className={
        "relative aspect-[3/4] select-none transition-all duration-700 " +
        (morphing ? "opacity-95" : "")
      }
      style={{
        transform: `scale(${size})`,
        filter:
          "drop-shadow(0 6px 14px rgba(0,0,0,0.55)) drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
      }}
    >
      {/* tab — small darker band at the top, suggests hanging-file folder */}
      <div
        aria-hidden
        className="absolute left-[10%] right-[10%] top-0 h-[5%] bg-[#a88a55]"
        style={{ clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)" }}
      />

      {/* body — manila kraft */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-[4%] bottom-0 overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #d4b896 0%, #c8a87c 60%, #b89860 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        {/* paper grain — SVG noise */}
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full mix-blend-multiply opacity-30"
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id={`noise-${id}`}>
            <feTurbulence baseFrequency="0.85" numOctaves="2" seed={id % 23} />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.4   0 0 0 0 0.32   0 0 0 0 0.22   0 0 0 0.30 0"
            />
          </filter>
          <rect width="100%" height="100%" filter={`url(#noise-${id})`} />
        </svg>

        {/* stamp */}
        <div
          className="absolute left-1/2 top-[10%] -translate-x-1/2"
          style={{ transform: `translateX(-50%) rotate(${stampRot}deg)` }}
        >
          <div
            className="px-2 py-1 font-mono uppercase tracking-[0.25em]"
            style={{
              fontSize: "0.55rem",
              fontWeight: 800,
              color: "#fff5e0",
              background: stamp.fill,
              border: `1.2px solid ${stamp.stroke}`,
              boxShadow: `inset 0 0 8px ${stamp.stroke}66`,
            }}
          >
            {variant === "standard" ? `${stamp.label} ${caseNo.replace("CASE ", "")}` : stamp.label}
          </div>
        </div>

        {/* metadata block */}
        <div className="absolute inset-x-[8%] top-[28%] text-[#3a2a14]">
          <p
            className="font-mono uppercase leading-tight tracking-[0.15em]"
            style={{ fontSize: "0.42rem", fontWeight: 700 }}
          >
            {variant === "standard" ? caseNo : "CASE FILE"}
          </p>
          <p
            className="mt-1 font-mono uppercase leading-tight tracking-[0.12em] opacity-80"
            style={{ fontSize: "0.36rem" }}
          >
            {subtitle}
          </p>
        </div>

        {/* "papers" peeking out as horizontal rules at the bottom third */}
        <div className="absolute inset-x-[12%] bottom-[12%] space-y-[3px]">
          {[100, 92, 80, 88, 72].map((w, i) => (
            <div
              key={i}
              className="h-px bg-[#3a2a14]"
              style={{ width: w + "%", opacity: 0.45 + (i % 2) * 0.15 }}
            />
          ))}
        </div>

        {/* spine ridge on the left, suggesting depth */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.32))",
          }}
        />

        {/* YOURS badge — easter egg from /submit */}
        {isYours ? (
          <div
            className="absolute right-2 top-2 px-1.5 py-0.5 font-mono uppercase tracking-[0.2em]"
            style={{
              fontSize: "0.48rem",
              fontWeight: 800,
              color: "#04382a",
              background: "rgba(6, 214, 160, 0.92)",
              border: "1px solid #055a44",
            }}
          >
            YOURS
          </div>
        ) : null}
      </div>
    </div>
  );
}
