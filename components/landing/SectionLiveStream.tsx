"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { liveStats, type ActivityEvent } from "@/lib/mock-data/home-stats";

/**
 * SECTION 5 — "RIGHT NOW, ACROSS INDIA"
 *
 * Two-column tableau:
 *   left  → live activity feed with relative-time labels
 *   right → simplified India outline, dots pulse at city coordinates
 *           when an event for that city pops to the top of the feed
 *
 * The "live" update loop:
 *   every 4s, document.visibilityState === "visible"  →  prepend a new
 *   synthetic event (a random event template, a random one of the 8
 *   tracked cities). The oldest event drops off so the feed always shows
 *   at most 8 rows. Each event carries an incremental `id` so framer-
 *   motion's AnimatePresence can animate it in (slide down from top) and
 *   out (fade).
 *
 * India outline: simplified path (Mercator projection of the country's
 * outline at low detail). Cities are placed using a tiny normalising
 * function — lat/lng range mapped into the path's bounding box. The
 * outline is *not* topologically accurate; it's a recognisable silhouette
 * for editorial purposes.
 */

const EVENT_TEMPLATES = [
  "New review verified",
  "Brochure claim flagged",
  "Hidden fee documented",
  "Faculty credential checked",
  "Placement stat disputed",
  "Hostel photo flagged as stock",
  "Fee structure decoded",
  "12 reviews matched",
];

type FeedItem = ActivityEvent & { id: number; createdAt: number };

export function SectionLiveStream() {
  const [feed, setFeed] = useState<FeedItem[]>(() =>
    liveStats.recentActivity.map((e, i) => ({
      ...e,
      id: i,
      createdAt: Date.now() + e.timestamp * 1000,
    })),
  );

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let nextId = feed.length;
    const t = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setFeed((prev) => {
        const city = liveStats.recentActivity[Math.floor(Math.random() * liveStats.recentActivity.length)];
        const event = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
        const next: FeedItem = {
          ...city,
          event,
          timestamp: 0,
          id: nextId++,
          createdAt: Date.now(),
        };
        return [next, ...prev].slice(0, 8);
      });
    }, 4000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section id="livestream" className="relative bg-ink px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 grid grid-cols-12 items-end gap-6">
          <div className="col-span-12 md:col-span-8">
            <p className="mb-3 inline-flex items-center gap-3 font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
              <span className="inline-block h-px w-8 bg-truth" />
              SECTION · 05 · LIVE
            </p>
            <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-newsprint md:text-6xl">
              Right now, <em className="font-display italic text-truth">across India.</em>
            </h2>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8 md:gap-10">
          <div className="col-span-12 md:col-span-7">
            <div className="border border-newsprint/15 bg-[#121110]">
              <div className="flex items-center justify-between border-b border-newsprint/10 px-4 py-3 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-newsprint/55">
                <span className="flex items-center gap-2">
                  <span className="relative inline-block h-1.5 w-1.5">
                    <span className="absolute inset-0 rounded-full bg-truth" />
                    <span className="absolute inset-0 animate-ping rounded-full bg-truth/80" />
                  </span>
                  LIVE FEED
                </span>
                <span>UF-LIVE / 0.4s LATENCY</span>
              </div>
              <ul className="divide-y divide-newsprint/8">
                <AnimatePresence initial={false}>
                  {feed.map((f) => (
                    <motion.li
                      key={f.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="grid grid-cols-[80px_1fr_auto] items-center gap-3 px-4 py-3 font-mono text-sm text-newsprint/90"
                    >
                      <span className="text-newsprint/55">{ago(f.createdAt)}</span>
                      <span className="truncate">
                        <span className="mr-2 inline-block min-w-[80px] text-newsprint">{f.city}</span>
                        <span className="text-newsprint/75">{f.event}</span>
                      </span>
                      <span className="text-truth" aria-hidden>→</span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </div>

          <div className="col-span-12 md:col-span-5">
            <IndiaMap activeCities={feed.slice(0, 3).map((f) => f.city)} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ago(ts: number) {
  const delta = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (delta < 60) return delta + "s ago";
  if (delta < 3600) return Math.floor(delta / 60) + "m ago";
  return Math.floor(delta / 3600) + "h ago";
}

/**
 * Simplified India outline.
 *
 * Coordinate math:
 *   lat 8°-37° N, lng 68°-97° E. We map those onto the 320x380 SVG
 *   viewBox with `x = (lng-68)/29 * 280 + 20` and
 *   `y = (37-lat)/29 * 340 + 20`. Quick and dirty — good enough for
 *   editorial purposes; not for geographic accuracy.
 */
function IndiaMap({ activeCities }: { activeCities: string[] }) {
  const dots = liveStats.recentActivity.map((e) => ({
    city: e.city,
    x: ((e.lng - 68) / 29) * 280 + 20,
    y: ((37 - e.lat) / 29) * 340 + 20,
  }));

  return (
    <div className="relative h-full border border-newsprint/15 bg-[#121110] p-4">
      <div className="flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-[0.25em] text-newsprint/55">
        <span>NETWORK MAP</span>
        <span>{activeCities.length} ACTIVE</span>
      </div>
      <svg viewBox="0 0 320 380" className="mt-2 h-[320px] w-full text-newsprint/60">
        {/* Simplified India silhouette path — recognisable but not exact */}
        <path
          d="M120 30 Q150 22 175 30 L200 40 L215 55 L240 70 L260 88 L268 110 L262 130 L268 158 L262 178 L268 200 L260 225 L240 240 L220 268 L210 296 L198 320 L182 340 L168 350 L156 340 L150 320 L142 296 L140 270 L130 250 L118 230 L108 210 L98 195 L82 178 L72 158 L65 140 L60 122 L66 105 L80 88 L92 70 L100 52 Z"
          fill="rgb(232 225 208 / 0.04)"
          stroke="currentColor"
          strokeWidth="0.6"
        />
        {dots.map((d) => {
          const active = activeCities.includes(d.city);
          return (
            <g key={d.city}>
              {active && (
                <circle cx={d.x} cy={d.y} r="10" fill="none" stroke="rgb(255 67 50)" strokeWidth="0.8">
                  <animate attributeName="r" from="4" to="18" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.9" to="0" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={d.x} cy={d.y} r={active ? "3.2" : "2"} fill={active ? "rgb(255 67 50)" : "rgb(232 225 208)"} />
              <text
                x={d.x + 6}
                y={d.y + 3}
                className="fill-newsprint/55 font-mono"
                style={{ fontSize: 7, letterSpacing: 1 }}
              >
                {d.city.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
