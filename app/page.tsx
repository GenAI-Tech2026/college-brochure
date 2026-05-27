import { Hero } from "@/components/landing/Hero";
import { Manifesto } from "@/components/landing/Manifesto";
import { FeaturedExposes } from "@/components/landing/FeaturedExposes";
import { CounterStrip } from "@/components/landing/CounterStrip";
import { SubmitTeaser } from "@/components/landing/SubmitTeaser";
import { MarqueeStrip } from "@/components/MarqueeStrip";
import { getFeaturedExposes, getCollegeStats } from "@/lib/data";

/**
 * Front page composition. Server component — pulls data, then hands client
 * components their props. PixiJS canvas is dynamic-imported inside <Hero/>.
 */
export default async function Page() {
  const [featured, stats] = await Promise.all([getFeaturedExposes(5), getCollegeStats()]);

  return (
    <>
      <Hero />

      <MarqueeStrip
        items={[
          "THEY SAID 100% PLACEMENTS. WE FOUND 71%.",
          { text: "REDACTED", redact: true },
          "THEY SAID WORLD-CLASS FACULTY. WE FOUND THREE.",
          { text: "REDACTED", redact: true },
          "THEY SAID INTERNATIONAL TIE-UPS. WE FOUND ONE PHOTOGRAPH.",
        ]}
        variant="truth"
        size="xl"
        speed={120}
      />

      <Manifesto />

      <CounterStrip stats={stats} />

      <FeaturedExposes items={featured} />

      <MarqueeStrip
        items={[
          "VERIFIED · VERIFIED · VERIFIED",
          { text: "STUDENTS DON'T LIE", redact: false },
          "FILED UNDER UF-26",
          { text: "EVIDENCE WALL", redact: false },
        ]}
        variant="highlighter"
        size="lg"
        reverse
        speed={60}
      />

      <SubmitTeaser />
    </>
  );
}
