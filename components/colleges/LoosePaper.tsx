"use client";

/**
 * Loose papers that flutter through the cascade. Five variants:
 *   - receipt  (long narrow strip)
 *   - brochure (with redaction bars)
 *   - photo    (face-down OR campus tone)
 *   - note     (yellow legal pad)
 *   - screenshot (light blue tint)
 *
 * Each variant ships its own SVG content. The wrapper applies pose +
 * opacity from the cascade math.
 */

export type LoosePaperVariant = "receipt" | "brochure" | "photo" | "note" | "screenshot";

export function LoosePaper({
  variant,
  size = 1,
  id,
}: {
  variant: LoosePaperVariant;
  size?: number;
  id: number;
}) {
  const rot = ((id * 73) % 12) - 6;
  return (
    <div
      className="relative"
      style={{
        transform: `scale(${size}) rotate(${rot}deg)`,
        filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
      }}
    >
      {variant === "receipt" ? <Receipt /> : null}
      {variant === "brochure" ? <Brochure /> : null}
      {variant === "photo" ? <Photo seed={id} /> : null}
      {variant === "note" ? <Note /> : null}
      {variant === "screenshot" ? <Screenshot /> : null}
    </div>
  );
}

function Receipt() {
  return (
    <div className="w-12 bg-[#f8f3e2] px-1 py-2">
      <div className="text-center font-mono text-[6px] font-bold text-[#3a2a14]">RECEIPT</div>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="mt-1 h-[1px] bg-[#3a2a14]"
          style={{ width: 60 + ((i * 17) % 35) + "%", opacity: 0.7 }}
        />
      ))}
      <div className="mt-1 h-[3px] bg-[#FF4332] opacity-80" />
    </div>
  );
}

function Brochure() {
  return (
    <div className="w-14 bg-[#0a0907] p-1">
      <div className="h-[3px] w-full bg-[#FF4332]" />
      <div className="mt-1 h-[2px] w-[80%] bg-[#0a0907] [background:linear-gradient(90deg,#0a0907_60%,transparent)]" />
      <div className="mt-1 h-[1px] w-[60%] bg-newsprint opacity-50" />
      {/* redaction bars */}
      <div className="mt-1 h-[4px] w-[90%] bg-[#0a0907]" />
      <div className="mt-1 h-[4px] w-[70%] bg-[#0a0907]" />
      <div className="mt-1 h-[1px] w-[50%] bg-newsprint opacity-50" />
    </div>
  );
}

function Photo({ seed }: { seed: number }) {
  // Two flavours: face-down (gray back) or campus (cream + blue)
  const faceDown = seed % 2 === 0;
  return (
    <div
      className="h-14 w-12 border-2"
      style={{
        background: faceDown ? "#444034" : "linear-gradient(180deg, #1a3a55 0%, #4d7a90 60%, #cab48c 100%)",
        borderColor: "#ddd2b8",
        padding: "2px",
      }}
    />
  );
}

function Note() {
  return (
    <div className="w-12 bg-[#fdf3a8] px-1 py-1">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="mt-1 h-[1.5px] bg-[#5a4a14]"
          style={{ width: 80 - (i * 13) + "%", opacity: 0.75 }}
        />
      ))}
    </div>
  );
}

function Screenshot() {
  return (
    <div className="w-14 border bg-[#dde4ec] p-1" style={{ borderColor: "#9ab" }}>
      <div className="h-[3px] w-[60%] bg-[#1a4880]" />
      <div className="mt-1 h-[1px] w-[80%] bg-[#1a4880] opacity-60" />
      <div className="mt-1 h-[1px] w-[50%] bg-[#1a4880] opacity-60" />
      <div className="mt-1 h-[4px] w-[40%] bg-[#FF4332]" />
    </div>
  );
}
