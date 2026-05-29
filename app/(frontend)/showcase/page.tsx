import { getAllColleges } from "@/lib/data";
import { ShowcaseClient } from "@/components/showcase/ShowcaseClient";

export const metadata = {
  title: "Showcase · Five files. Five truths.",
  description: "A cinematic procession through five Indian colleges, each presented as a chapter.",
};

// Read live from the DB on every request so admin edits show immediately.
export const dynamic = "force-dynamic";

export default async function ShowcasePage() {
  const colleges = await getAllColleges();
  return <ShowcaseClient colleges={colleges} />;
}
