import { getReviews } from "@/lib/data";
import { ArchiveBoard } from "@/components/wall/ArchiveBoard";

export const metadata = {
  title: "Wall of Receipts · You found it.",
  robots: { index: false },
};

/**
 * /wall-of-receipts — The Archive.
 *
 * Hidden page reached only via the Konami code. Surfaces every verified
 * review that arrived with attached evidence (photos, documents, video),
 * filed in a card-catalogue layout: numbered Exhibit, filed date, case
 * slug, pseudonym, the verified quote.
 *
 * Server-rendered. The board itself (scroll-tracked counter, hover state,
 * vibe-coloured accent) is a client component so the static SSR can index
 * cleanly for a11y while the live behaviour lights up on hydrate.
 */
export default async function WallOfReceipts() {
  const reviews = await getReviews({ limit: 200 });
  const exhibits = reviews
    .filter((r) => r.receipts > 0)
    .slice(0, 36)
    .sort(
      (a, b) =>
        new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
    );

  return <ArchiveBoard exhibits={exhibits} />;
}
