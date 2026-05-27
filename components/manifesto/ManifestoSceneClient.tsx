"use client";
/**
 * Thin client wrapper so app/manifesto/page.tsx can stay a Server Component.
 * `next/dynamic({ ssr: false })` is only allowed in client modules under
 * Next 15 App Router, so we isolate that one call here.
 */
import dynamic from "next/dynamic";

const ManifestoScene = dynamic(
  () => import("./ManifestoScene").then((m) => m.ManifestoScene),
  { ssr: false },
);

export default function ManifestoSceneClient() {
  return <ManifestoScene />;
}
