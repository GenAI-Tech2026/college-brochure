"use client";
import Link from "next/link";
import { RevealText } from "@/components/RevealText";

/**
 * Custom 404 — page is "REDACTED" instead of "Not found".
 * Easter egg: clicking the giant 404 numerals reveals "PAGE WAS NEVER
 * IN THE BROCHURE." A small wink at the site's thesis.
 */
export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-6 py-32 md:px-10">
      <div className="max-w-4xl text-center">
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
          Error · 404 · Not in the file
        </p>
        <h1 className="mt-6 font-display text-[clamp(6rem,28vw,28rem)] font-black uppercase leading-[0.82] tracking-[-0.05em] text-newsprint">
          <RevealText as="span" trigger="mount" variant="rise">404</RevealText>
        </h1>
        <p className="mt-6 font-display text-3xl italic text-newsprint md:text-5xl">
          This page was{" "}
          <span className="relative inline-block">
            <span className="relative z-10 text-truth">never in the brochure.</span>
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 right-0 bg-redaction"
              style={{ animation: "redaction-assemble 1.4s 0.5s var(--ease-paper) forwards" }}
            />
          </span>
        </p>
        <p className="mx-auto mt-6 max-w-xl font-serif text-newsprint/70">
          Either we never reviewed it, or it was redacted. The truth is, like most things in this corner of the internet, somewhere in between.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="border border-newsprint px-6 py-3 font-mono text-meta uppercase tracking-[0.2em] text-newsprint hover:bg-newsprint hover:text-ink">
            Return to front page
          </Link>
          <Link href="/colleges" className="border border-newsprint/30 px-6 py-3 font-mono text-meta uppercase tracking-[0.2em] text-newsprint/70 hover:text-newsprint">
            Open the file
          </Link>
        </div>
        <p className="mt-16 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/40">
          Hint: try the Konami code.
        </p>
      </div>
    </div>
  );
}
