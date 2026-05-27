"use client";
/**
 * StaticFallback — what slow-network and Save-Data visitors see.
 *
 * Pure type + a single CSS-painted backdrop. No canvas, no preload, no GSAP.
 * Carries the same 5 headlines so the editorial message survives even when
 * the cinematic doesn't load.
 */
import { ACTS } from "@/lib/manifesto/acts.config";

export function StaticFallback() {
  return (
    <section className="bg-ink text-newsprint">
      <header className="px-6 pb-16 pt-40 md:px-10">
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
          Manifesto · Static edition · Saver mode
        </p>
        <h1
          className="mt-4 font-display font-black uppercase"
          style={{ fontSize: "clamp(3rem, 14vw, 12rem)", lineHeight: 0.95, letterSpacing: "-0.02em" }}
        >
          Brochures lie.<br />
          <span className="italic font-quote font-normal">Students don't.</span>
        </h1>
      </header>

      {ACTS.map((a, i) => (
        <section
          key={a.id}
          className={`min-h-[70vh] border-t border-newsprint/10 px-6 py-24 md:px-10 ${i % 2 ? "paper text-ink" : ""}`}
        >
          <p className="font-mono text-meta uppercase tracking-[0.3em] opacity-60">{a.copy.label}</p>
          <h2
            className="mt-3 font-display font-black uppercase text-balance"
            style={{ fontSize: "clamp(2rem, 7vw, 7rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
          >
            {a.copy.headline}
          </h2>
          {a.copy.caption && <p className="mt-6 max-w-2xl font-quote italic text-lg md:text-2xl opacity-80">{a.copy.caption}</p>}
          {a.copy.phrases && (
            <ul className="mt-8 space-y-2 font-display italic text-truth text-2xl md:text-4xl">
              {a.copy.phrases.map((p) => <li key={p}>{p}</li>)}
            </ul>
          )}
        </section>
      ))}

      <div className="px-6 py-24 text-center md:px-10">
        <a
          href="/submit"
          className="inline-flex items-center gap-3 border border-truth bg-truth px-7 py-4 font-mono text-meta uppercase tracking-[0.3em] text-newsprint"
        >
          Add your voice <span aria-hidden>→</span>
        </a>
      </div>
    </section>
  );
}
