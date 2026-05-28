"use client";
import { useEffect, useRef, useState } from "react";
import type { Review } from "@/lib/mock-data/types";
import { RevealText } from "@/components/RevealText";

/**
 * The Archive — card-catalogue version of the receipts wall.
 *
 * - Sticky exhibit counter that updates as cards scroll past the rule line.
 * - Each card is a typewritten dossier: exhibit #, filed date, case slug,
 *   pseudonym, the verified quote, the receipt count.
 * - Vibe drives a one-letter accent strip on the left edge — colour-coded
 *   without competing with the editorial palette.
 *
 * Accessibility:
 *   - Counter is announced via aria-live="polite" so SR users hear the
 *     "Exhibit 12 of 18" updates on scroll. Throttled to once per change.
 *   - Cards are a real <ol> in chronological order.
 *   - The scroll-tracked counter falls back to a static "1 of N" without JS.
 */
export function ArchiveBoard({ exhibits }: { exhibits: Review[] }) {
  const total = exhibits.length;
  const [visibleIdx, setVisibleIdx] = useState(1);
  const containerRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLLIElement>("li[data-exhibit-idx]"));
    if (!cards.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        // Pick the latest card whose top has crossed 30% of viewport.
        let max = visibleIdx;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(
              (entry.target as HTMLElement).dataset.exhibitIdx ?? "1",
            );
            if (idx > max) max = idx;
          }
        }
        setVisibleIdx((curr) => (max > curr ? max : curr));
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0.01 },
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [visibleIdx]);

  return (
    <div className="bg-ink">
      {/* HERO */}
      <header className="px-5 pb-12 pt-28 md:px-10 md:pb-16 md:pt-36">
        <div className="mx-auto max-w-7xl text-center">
          <p className="font-mono text-meta uppercase tracking-[0.4em] text-truth">
            Unsealed · Konami unlocked · You found us
          </p>
          <h1
            className="mt-6 font-display font-black uppercase leading-[0.85] tracking-[-0.04em] text-newsprint"
            style={{ fontSize: "clamp(2.75rem, 10vw, 8rem)" }}
          >
            <RevealText as="span" trigger="mount" variant="rise">
              The Archive.
            </RevealText>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-serif text-xl text-newsprint/80 md:text-2xl">
            Every verified testimony that arrived with attached evidence. Numbered. Filed.
            No labels. No captions. Read in the order they were submitted.
          </p>
        </div>
      </header>

      {/* STICKY COUNTER — updates as cards scroll into view */}
      <div className="sticky top-0 z-30 border-y border-newsprint/15 bg-ink/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/65 md:px-10">
          <span aria-live="polite" className="text-newsprint">
            Exhibit{" "}
            <span className="text-truth [font-variant-numeric:tabular-nums]">
              {String(visibleIdx).padStart(3, "0")}
            </span>{" "}
            of{" "}
            <span className="text-newsprint [font-variant-numeric:tabular-nums]">
              {String(total).padStart(3, "0")}
            </span>
          </span>
          <span className="hidden md:inline">UF · case files · sealed · evidence locker</span>
          <span className="md:hidden">UF · sealed</span>
        </div>
        {/* progress hairline */}
        <div className="h-px bg-newsprint/10">
          <div
            className="h-full origin-left bg-truth"
            style={{
              transform: `scaleX(${Math.min(1, visibleIdx / total)})`,
              transition: "transform 350ms ease-out",
            }}
          />
        </div>
      </div>

      {/* THE ARCHIVE */}
      <ol
        ref={containerRef}
        className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 py-16 md:grid-cols-2 md:gap-8 md:px-10 md:py-24 lg:grid-cols-3"
      >
        {exhibits.map((r, i) => (
          <ExhibitCard
            key={r.id}
            review={r}
            number={i + 1}
            total={total}
          />
        ))}
      </ol>

      {/* OUTRO */}
      <footer className="border-t border-newsprint/15 px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
            End of file · vol II
          </p>
          <p
            className="mt-4 font-display font-medium leading-tight text-newsprint"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
          >
            You can leave now.{" "}
            <em className="italic text-truth">We won&apos;t tell anyone you were here.</em>
          </p>
        </div>
      </footer>
    </div>
  );
}

const vibeAccent: Record<Review["vibe"], { stripe: string; tag: string }> = {
  rage:     { stripe: "bg-truth",           tag: "text-truth" },
  warm:     { stripe: "bg-newsprint/70",    tag: "text-newsprint/85" },
  deadpan:  { stripe: "bg-newsprint/40",    tag: "text-newsprint/60" },
  warning:  { stripe: "bg-truth/65",        tag: "text-truth/80" },
  redeemed: { stripe: "bg-newsprint/85",    tag: "text-newsprint" },
};

function ExhibitCard({
  review,
  number,
  total,
}: {
  review: Review;
  number: number;
  total: number;
}) {
  const accent = vibeAccent[review.vibe] ?? vibeAccent.deadpan;
  const filed = new Date(review.publishedAt);
  const filedStr = `${filed.getFullYear()}-${String(filed.getMonth() + 1).padStart(2, "0")}-${String(filed.getDate()).padStart(2, "0")}`;
  const collegePretty = review.collegeSlug.replace(/-/g, " · ").toUpperCase();

  return (
    <li
      data-exhibit-idx={number}
      className="group relative flex flex-col gap-4 border border-newsprint/12 bg-[#141210] p-6 transition-transform duration-500 hover:-translate-y-1 md:p-7"
    >
      {/* left vibe-stripe — the only colour the card uses outside the meta */}
      <span
        aria-hidden
        className={"absolute left-0 top-6 inline-block h-12 w-[3px] " + accent.stripe}
      />

      {/* meta header */}
      <div className="flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-[0.25em] text-newsprint/55">
        <span className={accent.tag}>
          EXHIBIT #{String(number).padStart(3, "0")}
        </span>
        <span>Filed {filedStr}</span>
      </div>

      {/* case label */}
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-newsprint/40">
        Case · {collegePretty}
      </p>

      {/* the title — display-serif headline */}
      <h2 className="font-display text-xl font-medium leading-snug text-newsprint md:text-2xl">
        {review.title}
      </h2>

      {/* the quote — serif body, clipped to 3 lines */}
      <blockquote className="font-serif text-base leading-relaxed text-newsprint/85 [display:-webkit-box] [-webkit-line-clamp:4] [-webkit-box-orient:vertical] overflow-hidden">
        “{review.body}”
      </blockquote>

      {/* footer */}
      <div className="mt-auto flex items-baseline justify-between border-t border-newsprint/12 pt-4 font-mono text-meta uppercase tracking-[0.22em] text-newsprint/55">
        <span>— {review.authorPseudonym}</span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="text-truth">📎</span>
          {review.receipts} attached
        </span>
      </div>

      {/* card index — readable on hover, faint at rest */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 bottom-3 font-mono text-[0.6rem] uppercase tracking-[0.25em] text-newsprint/25 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      >
        {number} / {total}
      </span>
    </li>
  );
}
