import { getAllColleges } from "@/lib/data";
import { ExplorerClient } from "@/components/colleges/ExplorerClient";

export const metadata = { title: "The File · All cases" };

export default async function CollegesPage() {
  const colleges = await getAllColleges();
  return <ExplorerClient colleges={colleges} />;
}
