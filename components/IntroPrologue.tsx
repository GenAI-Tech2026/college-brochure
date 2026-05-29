"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * First-visit splash.
 *
 * A quick, ~1s branded loader that tells a brand-new visitor what
 * UNFILTERED is, then auto-dismisses. It appears ONCE per browser — the
 * moment it leaves we write a flag to localStorage, so reloads and return
 * visits skip it entirely.
 *
 * The page underneath renders and hydrates behind this overlay (it's a
 * non-blocking splash, not a blocking gate), so by the time it fades the
 * site is already warm. We also prefetch the likely next routes.
 *
 * No-flash contract:
 *   An inline script at the top of <body> (see layout) reads the same flag
 *   synchronously and adds `.uf-prologue-seen` to <html> before first paint,
 *   so returning visitors never see this flash. The component also unmounts
 *   itself on mount for those visitors. First server/client render is
 *   identical, so there's no hydration mismatch.
 */
const STORAGE_KEY = "uf_prologue_seen";
// Long enough to actually read the one-liner, short enough to still feel
// like a splash. Tune this single value to taste.
const AUTO_MS = 1500; // how long the splash stays before it self-dismisses
const EXIT_MS = 500; // fade-out duration

export function IntroPrologue() {
  const [dismissed, setDismissed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const closing = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  function close() {
    if (closing.current) return;
    closing.current = true;
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setLeaving(true);
    exitTimer.current = setTimeout(() => setDismissed(true), reduce ? 0 : EXIT_MS);
  }

  useEffect(() => {
    let seen = false;
    try {
      seen = !!localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage blocked — treat as unseen, show once this load */
    }
    if (seen) {
      setDismissed(true);
      return;
    }

    // Lock the page behind the splash for the brief moment it's up.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const lenis = (window as unknown as { __lenis__?: { stop: () => void; start: () => void } }).__lenis__;
    lenis?.stop();

    // Warm the likely next routes while the splash is on screen.
    ["/colleges", "/wall-of-receipts"].forEach((href) => {
      try {
        router.prefetch(href);
      } catch {
        /* best-effort */
      }
    });

    // Auto-dismiss, and let an early Escape / click skip it.
    const auto = setTimeout(close, AUTO_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") close();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(auto);
      if (exitTimer.current) clearTimeout(exitTimer.current);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      lenis?.start();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (dismissed) return null;

  return (
    <div
      id="uf-prologue"
      role="status"
      aria-live="polite"
      aria-label="College Brochure — verified student reviews, college brochures fact-checked. Loading."
      data-leaving={leaving ? "true" : undefined}
      onClick={close}
      className="fixed inset-0 z-[100000] grid cursor-pointer place-items-center overflow-hidden bg-ink text-newsprint"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(110% 80% at 50% 42%, rgba(255,67,50,0.10) 0%, rgba(10,10,10,0) 60%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        <p className="uf-pl-line font-mono text-meta uppercase tracking-[0.5em] text-newsprint/55" style={{ animationDelay: "0.02s" }}>
          College Brochure
        </p>

        <h1
          className="uf-pl-line font-display font-black uppercase leading-[0.9] tracking-[-0.03em] text-[clamp(2rem,7vw,4rem)]"
          style={{ animationDelay: "0.1s" }}
        >
          Brochures lie. <span className="italic text-truth">Students don&apos;t.</span>
        </h1>

        <p className="uf-pl-line max-w-lg font-serif text-base italic text-newsprint/75 md:text-lg" style={{ animationDelay: "0.18s" }}>
          Real reviews from verified students — fact-checking what college
          brochures claim, so you see the truth before you apply.
        </p>

        <div className="uf-pl-line mt-2 flex flex-col items-center gap-3" style={{ animationDelay: "0.26s" }}>
          {/* Determinate bar — fills 0→100% over the splash duration, so it
              reaches full right as the splash dismisses. */}
          <div className="relative h-1.5 w-56 overflow-hidden bg-newsprint/15">
            <span
              className="uf-bar absolute inset-y-0 left-0 w-full bg-truth"
              style={{ ["--uf-bar-dur" as never]: `${AUTO_MS}ms` }}
            />
          </div>
          <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
            Opening the file
          </p>
        </div>
      </div>
    </div>
  );
}
