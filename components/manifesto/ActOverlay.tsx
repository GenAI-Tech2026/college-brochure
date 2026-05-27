"use client";
/**
 * ActOverlay — typography that lives over the canvas.
 *
 * Each act has a BESPOKE layout so the type and the visual action share the
 * frame instead of fighting for it. Centered display headlines work for Act I
 * (where the crowd is below the horizon), but for Acts III–V the action
 * happens dead-centre (student + shockwave + reformed crowd), so we move
 * headlines into upper/lower thirds and shrink them to lower-third caption
 * sizes — same letterform discipline, less real-estate.
 */
import { useMemo } from "react";
import {
  ACTS,
  type Act,
  progressWithinAct,
} from "@/lib/manifesto/acts.config";
import { cn } from "@/lib/utils/cn";

interface ActOverlayProps {
  progress: number;
}

export function ActOverlay({ progress }: ActOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none">
      {ACTS.map((act) => (
        <SingleAct key={act.id} act={act} globalProgress={progress} />
      ))}
    </div>
  );
}

function SingleAct({ act, globalProgress }: { act: Act; globalProgress: number }) {
  const tIn = progressWithinAct(globalProgress, act);
  const active = globalProgress >= act.start && globalProgress < act.end;
  // Each overlay enters in the first 22% of its act and starts leaving at 82%.
  const enter = smooth01(tIn / 0.22);
  const exit = 1 - smooth01((tIn - 0.82) / 0.18);
  const opacity = active ? Math.min(enter, exit) : 0;

  if (opacity <= 0.001) return null;

  const transform = `translateY(${(1 - enter) * 14}px)`;
  const style = { opacity, transform, transition: "opacity 0.18s linear, transform 0.18s linear" };

  switch (act.id) {
    case "crowd":     return <ActCrowd     act={act} tIn={tIn} style={style} />;
    case "podium":    return <ActPodium    act={act} tIn={tIn} style={style} />;
    case "student":   return <ActStudent   act={act} tIn={tIn} style={style} />;
    case "voice":     return <ActVoice     act={act} tIn={tIn} style={style} />;
    case "awakening": return <ActAwakening act={act} tIn={tIn} style={style} />;
  }
}

type ActProps = { act: Act; tIn: number; style: React.CSSProperties };

/* ─────────────────────── Act I — The Crowd
   Centered ink-stamp headline. The crowd sits below the horizon line so the
   headline gets the upper third. Caption mid-screen — small, italic, breath. */
function ActCrowd({ act, style }: ActProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-start px-6 pt-[14vh] text-center" style={style}>
      <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">{act.copy.label}</p>
      <h2
        className="mt-6 font-display font-black uppercase text-newsprint text-balance"
        style={{ fontSize: "clamp(4rem, 14vw, 14rem)", lineHeight: 0.92, letterSpacing: "-0.03em" }}
      >
        {act.copy.headline}
      </h2>
      {act.copy.caption && (
        <p className="mt-6 max-w-xl font-quote text-base italic text-newsprint/70 md:text-xl">
          {act.copy.caption}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────── Act II — The Podium
   Headline UPPER, ghost phrases LOWER. Podium spotlight reads through the
   middle of the frame, uninterrupted. */
function ActPodium({ act, tIn, style }: ActProps) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between px-6 py-[14vh] md:px-12" style={style}>
      <div className="text-center">
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">{act.copy.label}</p>
        <h2
          className="mt-4 font-display font-black uppercase text-newsprint text-balance"
          style={{ fontSize: "clamp(2.5rem, 7vw, 7rem)", lineHeight: 0.95, letterSpacing: "-0.025em" }}
        >
          {act.copy.headline}
        </h2>
      </div>
      {/* Sequential ghost phrases. */}
      {act.copy.phrases && <PhraseStack phrases={act.copy.phrases} tIn={tIn} variant="ghost" align="center" />}
    </div>
  );
}

/* ─────────────────────── Act III — The Witness
   Editorial lower-third caption, NOT a hero headline. Lets the student own
   the centre. Mono kicker top-left like a documentary super. */
function ActStudent({ act, style }: ActProps) {
  return (
    <div className="absolute inset-0 px-6 py-[10vh] md:px-12" style={style}>
      {/* Top-left kicker */}
      <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">{act.copy.label}</p>

      {/* Lower-third caption */}
      <div className="absolute bottom-[14vh] left-6 right-6 md:left-12 md:right-12">
        <h2
          className="font-display font-black uppercase text-newsprint text-balance max-w-3xl"
          style={{ fontSize: "clamp(2rem, 5.6vw, 5.5rem)", lineHeight: 1, letterSpacing: "-0.02em" }}
        >
          {act.copy.headline}
        </h2>
        {act.copy.caption && (
          <p className="mt-4 max-w-xl font-quote italic text-base text-newsprint/70 md:text-xl">
            {act.copy.caption}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── Act IV — The Voice
   Headline pinned to TOP edge. Shockwave + student must own the centre.
   Ghost phrases EXPLODE outward from the centre on a horizontal axis,
   one truth at a time, each in Truth Red. */
function ActVoice({ act, tIn, style }: ActProps) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between px-6 py-[10vh] md:px-12" style={style}>
      <div className="text-center">
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-truth/80">{act.copy.label}</p>
        <h2
          className="mt-3 font-sans font-black uppercase text-truth text-balance"
          style={{ fontSize: "clamp(1.75rem, 4.6vw, 4.5rem)", lineHeight: 1.0, letterSpacing: "-0.02em" }}
        >
          {act.copy.headline}
        </h2>
      </div>
      {/* Erupting phrases — flying outward in the lower half. */}
      {act.copy.phrases && <ExplodingPhrases phrases={act.copy.phrases} tIn={tIn} />}
    </div>
  );
}

/* ─────────────────────── Act V — The Awakening
   Headline in lower half with CTA right beneath it — both must be on the
   same frame so the user reads the message and the action in one beat. */
function ActAwakening({ act, tIn, style }: ActProps) {
  return (
    <div className="absolute inset-0 flex flex-col justify-end px-6 pb-[14vh] md:px-12" style={style}>
      <div className="mx-auto max-w-5xl text-center">
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/70">{act.copy.label}</p>
        <h2
          className="mt-4 font-display font-black uppercase text-newsprint text-balance"
          style={{ fontSize: "clamp(2.25rem, 5.4vw, 5.5rem)", lineHeight: 1.02, letterSpacing: "-0.022em" }}
        >
          {act.copy.headline}
        </h2>
        {act.copy.caption && (
          <p className="mt-4 font-quote italic text-newsprint/75 text-base md:text-xl">
            {act.copy.caption}
          </p>
        )}
        {tIn > 0.35 && (
          <a
            href="/submit"
            className="pointer-events-auto mt-7 inline-flex items-center gap-3 border border-truth bg-truth px-7 py-4 font-mono text-meta uppercase tracking-[0.3em] text-newsprint transition-transform duration-300 hover:scale-[1.03]"
            data-cursor="link"
            data-cursor-label="ADD"
            style={{ opacity: smooth01((tIn - 0.35) * 2.2) }}
          >
            Add your voice <span aria-hidden>→</span>
          </a>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── helpers ─────────────────────── */

function PhraseStack({
  phrases,
  tIn,
  variant,
  align = "center",
}: {
  phrases: string[];
  tIn: number;
  variant: "ghost" | "voice";
  align?: "center" | "left";
}) {
  const items = useMemo(() => {
    return phrases.map((text, i) => {
      const slot = (i + 0.5) / phrases.length;
      const span = 0.65 / phrases.length;
      return { text, start: slot - span / 2, end: slot + span / 2 };
    });
  }, [phrases]);

  return (
    <div className={cn("flex flex-col gap-3", align === "center" ? "items-center text-center" : "items-start text-left")}>
      {items.map((it, i) => {
        const enter = smooth01((tIn - it.start) / 0.08);
        const exit = 1 - smooth01((tIn - it.end) / 0.08);
        const o = Math.min(enter, exit);
        if (o <= 0.001) return null;
        const blur = (1 - o) * 18;
        return (
          <p
            key={i}
            className={cn(
              "font-display italic",
              variant === "voice" ? "font-black text-truth" : "text-newsprint/85",
            )}
            style={{
              opacity: o,
              filter: `blur(${blur}px)`,
              fontSize: variant === "voice" ? "clamp(1.8rem, 5.4vw, 5.5rem)" : "clamp(1.4rem, 4vw, 4rem)",
              letterSpacing: "-0.015em",
              lineHeight: 1.05,
              willChange: "filter, opacity",
            }}
          >
            {it.text}
          </p>
        );
      })}
    </div>
  );
}

/** Voice-act variant: phrases launch from screen-centre and fly outward + scale.
    Each phrase reads one at a time, hard editorial — short window per phrase
    so the next can detonate before the shockwave fully expands. */
function ExplodingPhrases({ phrases, tIn }: { phrases: string[]; tIn: number }) {
  const items = useMemo(() => {
    return phrases.map((text, i) => {
      const slot = (i + 0.5) / phrases.length;
      const span = 0.55 / phrases.length;
      return { text, start: slot - span / 2, end: slot + span / 2 };
    });
  }, [phrases]);

  return (
    <div className="relative h-[28vh] w-full">
      {items.map((it, i) => {
        const t = clamp01((tIn - it.start) / (it.end - it.start));
        if (t <= 0 || t >= 1) return null;
        // Scale + opacity arc: 0 → peak at 0.5 → fade.
        const scale = 0.6 + t * 1.4;
        const o = t < 0.5 ? smooth01(t * 2) : 1 - smooth01((t - 0.5) * 2);
        // Slight lateral drift to feel detonated, not centred.
        const drift = (i - 1) * 6;
        return (
          <p
            key={i}
            className="absolute left-1/2 top-1/2 whitespace-nowrap font-sans font-black uppercase italic text-truth"
            style={{
              opacity: o,
              transform: `translate(calc(-50% + ${drift}vw), -50%) scale(${scale})`,
              fontSize: "clamp(1.5rem, 4.4vw, 4rem)",
              letterSpacing: "-0.02em",
              textShadow: "0 0 30px rgba(255,67,50,0.4)",
              willChange: "transform, opacity",
            }}
          >
            {it.text}
          </p>
        );
      })}
    </div>
  );
}

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}
function smooth01(x: number) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}
