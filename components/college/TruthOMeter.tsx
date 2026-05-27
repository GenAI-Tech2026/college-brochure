"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate, useMotionValueEvent } from "framer-motion";
import { safeAccentOnDark } from "@/lib/utils/accent";

interface Props { score: number; accent: string; }

/**
 * Module C — TRUTH-O-METER
 *
 * Pure scroll-trigger count-up. No cursor interaction (was confusing —
 * user wasn't sure if their hover or the actual score was being shown).
 * Three subscribers animate from a single MotionValue `value`:
 *   - the needle rotation (0/100 ratio → -90° .. +90°)
 *   - the arc strokeDashoffset (full arc reveal on count-up)
 *   - the number readout (writes textContent each frame via ref)
 *
 * One value driving everything keeps the meter feeling like a single
 * coherent mechanism instead of three separate widgets.
 */
export function TruthOMeter({ score, accent: rawAccent }: Props) {
  const accent = safeAccentOnDark(rawAccent);
  const dial = useRef<SVGSVGElement>(null);
  const numberEl = useRef<SVGTextElement>(null);
  const arcEl = useRef<SVGPathElement>(null);
  const [revealed, setRevealed] = useState(false);

  // Single source of truth for the count.
  const value = useMotionValue(0);
  const needleAngle = useTransform(value, (v) => (v / 100) * 180 - 90);
  const needleTransform = useTransform(needleAngle, (a) => `rotate(${a}deg)`);

  // Drive the count-up on viewport entry — value animates 0 → score over 1.8 s
  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !revealed) {
          setRevealed(true);
          animate(value, score, {
            duration: 1.8,
            ease: [0.16, 1, 0.3, 1], // expo.out
          });
        }
      },
      { threshold: 0.35 }
    );
    if (dial.current) io.observe(dial.current);
    return () => io.disconnect();
  }, [score, value, revealed]);

  // Subscribe to value changes — write number + arc-fill each frame
  useMotionValueEvent(value, "change", (v) => {
    if (numberEl.current) numberEl.current.textContent = Math.round(v).toString();
    if (arcEl.current) arcEl.current.setAttribute("stroke-dashoffset", String(314 - (v / 100) * 314));
  });

  return (
    <section className="bg-ink px-6 py-32 md:px-10 md:py-48" aria-labelledby="truth-meter-heading">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-5">
          <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/70">
            Section C · Truth-O-Meter · Live
          </p>
          <h2
            id="truth-meter-heading"
            className="mt-4 font-display text-[clamp(2.5rem,7vw,7rem)] font-black uppercase leading-[0.85] tracking-[-0.03em] text-newsprint"
          >
            How <span className="italic text-truth">honest</span> is the brochure?
          </h2>
          <p className="mt-6 max-w-md font-serif text-lg text-newsprint">
            The needle starts at zero and climbs to the community truth-score. Every dial position is verified against the brochure&apos;s wording, line by line.
          </p>
          <p className="mt-6 font-mono text-meta uppercase tracking-[0.2em] text-newsprint/70">
            Community average · {score}/100 · <span className="text-truth">verified</span>
          </p>
        </div>

        <div className="col-span-12 md:col-span-7">
          <svg
            ref={dial}
            viewBox="-110 -110 220 130"
            className="mx-auto block h-auto w-full max-w-2xl"
            aria-label={`Truth-O-Meter showing ${score} out of 100`}
            role="img"
          >
            {/* Arc background */}
            <path
              d="M -100 0 A 100 100 0 0 1 100 0"
              fill="none"
              stroke="rgba(232,225,208,0.18)"
              strokeWidth="14"
            />
            {/* Truth arc — strokeDashoffset is updated frame-by-frame from
                `value` via the arcEl ref. Starts hidden (offset=314), fills
                in as the value counts up. */}
            <path
              ref={arcEl}
              d="M -100 0 A 100 100 0 0 1 100 0"
              fill="none"
              stroke={accent}
              strokeWidth="14"
              strokeDasharray="314"
              strokeDashoffset={314}
              strokeLinecap="round"
            />

            {/* Tick marks */}
            {Array.from({ length: 11 }).map((_, i) => {
              const a = (i / 10) * Math.PI - Math.PI;
              const x1 = Math.cos(a) * 92;
              const y1 = Math.sin(a) * 92;
              const x2 = Math.cos(a) * 100;
              const y2 = Math.sin(a) * 100;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#E8E1D0"
                  strokeWidth={i % 5 === 0 ? 2 : 1}
                  opacity={0.7}
                />
              );
            })}

            <text x="-100" y="14" textAnchor="middle" fill="#9A938A" fontSize="6" fontFamily="JetBrains Mono">LIES</text>
            <text x="0" y="-105" textAnchor="middle" fill="#9A938A" fontSize="6" fontFamily="JetBrains Mono">50</text>
            <text x="100" y="14" textAnchor="middle" fill="#9A938A" fontSize="6" fontFamily="JetBrains Mono">TRUTH</text>

            {/* Needle — initially at value=0 → angle=-90° (pointing LIES).
                As `value` animates to score, the needle sweeps to its
                final position via motion-value-driven CSS transform. */}
            <motion.g style={{ transform: needleTransform, transformOrigin: "0 0" }}>
              <line x1="0" y1="0" x2="0" y2="-90" stroke="#E8E1D0" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="0" cy="-90" r="3.5" fill={accent} />
            </motion.g>
            <circle cx="0" cy="0" r="6" fill="#0A0A0A" stroke="#E8E1D0" strokeWidth="2" />

            <text
              ref={numberEl}
              x="0"
              y="-32"
              textAnchor="middle"
              fill="#E8E1D0"
              fontFamily="Fraunces"
              fontWeight="900"
              fontSize="22"
            >
              0
            </text>
            <text x="0" y="-18" textAnchor="middle" fill="#9A938A" fontSize="5" fontFamily="JetBrains Mono" letterSpacing="1.5">
              /100
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}
