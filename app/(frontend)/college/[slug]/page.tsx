import { notFound } from "next/navigation";
import { getAllColleges, getCollegeBySlug, getReviews } from "@/lib/data";
import { FileHeader } from "@/components/college/FileHeader";
import { RedactionSection } from "@/components/college/RedactionSection";
import { TruthOMeter } from "@/components/college/TruthOMeter";
import { EvidenceWall } from "@/components/college/EvidenceWall";
import { DataAutopsy } from "@/components/college/DataAutopsy";
import { LongRead } from "@/components/college/LongRead";
import { SubmitCTA } from "@/components/college/SubmitCTA";
import { MarqueeStrip } from "@/components/MarqueeStrip";

/**
 * Pre-render every college page at build time. Each is a unique composition
 * of the seven editorial modules (A–G).
 */
export async function generateStaticParams() {
  const all = await getAllColleges();
  return all.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const college = await getCollegeBySlug(slug);
  if (!college) return { title: "Case file not found" };
  return {
    title: college.name,
    description: `${college.tagline} — Truth Score ${college.truthScore}/100 from ${college.reviewCount} reviews.`,
    openGraph: {
      title: `${college.name} · UNFILTERED Case ${college.caseFileNumber}`,
      description: college.tagline,
      images: [`/api/og?slug=${college.slug}`],
    },
  };
}

export default async function CollegePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const college = await getCollegeBySlug(slug);
  if (!college) return notFound();
  const reviews = await getReviews({ collegeSlug: slug, limit: 30 });

  return (
    <article style={{ ["--accent" as never]: college.primaryAccent }}>
      <FileHeader college={college} />

      <MarqueeStrip
        items={[
          college.shortName.toUpperCase(),
          { text: `CASE ${college.caseFileNumber}`, redact: false },
          "EVIDENCE FILED",
          { text: "VERIFIED", redact: false },
        ]}
        variant="truth"
        size="lg"
      />

      <RedactionSection college={college} />

      <TruthOMeter score={college.truthScore} accent={college.primaryAccent} />

      <EvidenceWall reviews={reviews} />

      <DataAutopsy data={college.placementData} accent={college.primaryAccent} />

      <LongRead college={college} />

      <SubmitCTA college={college} />
    </article>
  );
}
