"use client";
import type { College } from "@/lib/mock-data/types";
import { ExplorerClient } from "@/components/colleges/ExplorerClient";

/**
 * /colleges entry point — the archive (case-file index), nothing before it.
 */
export function CollegesPageClient({ colleges }: { colleges: College[] }) {
  return <ExplorerClient colleges={colleges} />;
}
