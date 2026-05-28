"use client";
import Image from "next/image";
import type { Act } from "@/lib/cinematic/types";

/**
 * Reduced-motion fallback. Renders each act as a stacked editorial spread:
 *  - act number + kicker
 *  - overlay headline
 *  - a still poster (the scene's "key frame" rendered statically)
 * The user reads the story top-to-bottom — no animation, no scroll-lock.
 */
export function StaticFallback({ acts, posters }: { acts: Act[]; posters?: string[] }) {
  return (
    <div className="bg-ink">
      {acts.map((a, i) => (
        <section
          key={a.id}
          className="border-b border-newsprint/10 px-6 py-24 md:px-10 md:py-32"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-12 gap-8">
            <header className="col-span-12 md:col-span-5">
              <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
                Act · {String(i + 1).padStart(2, "0")}
              </p>
              {a.overlays?.[0]?.line ? (
                <h2
                  className="mt-4 font-display font-medium leading-[1.05] tracking-[-0.02em] text-newsprint"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
                  dangerouslySetInnerHTML={{ __html: a.overlays[0].line }}
                />
              ) : null}
              {a.overlays?.[0]?.caption ? (
                <p className="mt-4 font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55">
                  {a.overlays[0].caption}
                </p>
              ) : null}
            </header>
            <div className="col-span-12 md:col-span-7">
              {posters?.[i] ? (
                <Image
                  src={posters[i]}
                  alt=""
                  width={1280}
                  height={720}
                  className="h-auto w-full border border-newsprint/10"
                />
              ) : (
                <div className="aspect-video w-full border border-newsprint/10 bg-[#141210]" />
              )}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
