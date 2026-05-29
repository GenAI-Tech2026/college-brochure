import { getAllColleges } from "@/lib/data";
import { CollegesPageClient } from "@/components/colleges/CollegesPageClient";

export const metadata = { title: "The File · All cases" };

// Read live from the DB on every request so admin edits show immediately.
export const dynamic = "force-dynamic";

export default async function CollegesPage() {
  const colleges = await getAllColleges();
  return <CollegesPageClient colleges={colleges} />;
}
