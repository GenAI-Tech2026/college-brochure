import { getAllColleges } from "@/lib/data";
import { CollegesPageClient } from "@/components/colleges/CollegesPageClient";

export const metadata = { title: "The File · All cases" };

export default async function CollegesPage() {
  const colleges = await getAllColleges();
  return <CollegesPageClient colleges={colleges} />;
}
