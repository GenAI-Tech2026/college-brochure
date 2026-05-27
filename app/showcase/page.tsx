import { getAllColleges } from "@/lib/data";
import { ShowcaseClient } from "@/components/showcase/ShowcaseClient";

export const metadata = {
  title: "Showcase · Five files. Five truths.",
  description: "A cinematic procession through five Indian colleges, each presented as a chapter.",
};

export default async function ShowcasePage() {
  const colleges = await getAllColleges();
  return <ShowcaseClient colleges={colleges} />;
}
