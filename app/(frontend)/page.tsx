import { Hero } from "@/components/landing/Hero";
import { Manifesto as SectionGap } from "@/components/landing/Manifesto";
import { FeaturedExposes as SectionReceipts } from "@/components/landing/FeaturedExposes";
import { SectionMethod } from "@/components/landing/SectionMethod";
import { CounterStrip as SectionNumbers } from "@/components/landing/CounterStrip";
import { SectionLiveStream } from "@/components/landing/SectionLiveStream";
import { ScrollVideoBackground } from "@/components/landing/ScrollVideoBackground";
import { getCollegeStats, getFeaturedCases } from "@/lib/data";

// Read live stats from the DB on every request so the dashboard stays current.
export const dynamic = "force-dynamic";

/**
 * Home page — new "Live Ledger" composition.
 *
 * The home page is now data-led: the hero is a 4-tile dashboard, and
 * each section answers one question via a single visual.
 *
 * Section map:
 *   00 · Hero          — Live Ledger dashboard (live counters, charts, ticker, gauge)
 *   01 · The Evidence  — Flip-card masonry of featured exposés
 *   02 · The Method    — 4-step animated verification pipeline
 *   03 · By the Numbers— Magazine-spread stat block (paper-cream inset)
 *   04 · The Gap       — D3 slope chart (brochure vs reality)
 *   05 · Live          — Realtime activity feed + India map
 *   06 · Join          — Single counter CTA
 *
 * Total visible body copy is well under 200 words — everything else the
 * user sees is rendered data.
 *
 * Server data:
 *   We still call `getCollegeStats()` on the server so the SectionNumbers
 *   tile can opt into real Payload data when available. The component
 *   accepts a `stats` prop but falls back to mock data — keeping this
 *   page resilient if Payload is empty in dev.
 */
export default async function Page() {
  // Pull real Payload data in parallel; each section falls back to mock if empty.
  const [stats, cases] = await Promise.all([
    getCollegeStats().catch(() => undefined),
    getFeaturedCases(6).catch(() => undefined),
  ]);

  return (
    <>
      <ScrollVideoBackground />
      <Hero />
      <SectionReceipts cases={cases?.length ? cases : undefined} />
      <SectionMethod />
      <SectionNumbers stats={stats} />
      <SectionGap />
      <SectionLiveStream />
    </>
  );
}
