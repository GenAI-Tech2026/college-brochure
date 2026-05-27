"use client";
import { create } from "zustand";
import type { CollegeCategory, CollegeTier } from "@/lib/mock-data/types";

/**
 * Filter state for /colleges. Kept light — FLIP re-orders the grid on change.
 */
interface FilterState {
  query: string;
  tier: CollegeTier | "all";
  category: CollegeCategory | "all";
  minTruthScore: number;
  sortBy: "truth-desc" | "truth-asc" | "reviews-desc" | "newest";
  set: (partial: Partial<FilterState>) => void;
  reset: () => void;
}

const initial = {
  query: "",
  tier: "all" as const,
  category: "all" as const,
  minTruthScore: 0,
  sortBy: "truth-desc" as const,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initial,
  set: (partial) => set(partial),
  reset: () => set(initial),
}));

interface CursorState {
  label: string;       // "READ" | "PLAY" | "TRUTH" | ""
  variant: "default" | "text" | "video" | "review" | "link";
  set: (l: string, v: CursorState["variant"]) => void;
  clear: () => void;
}

export const useCursorStore = create<CursorState>((set) => ({
  label: "",
  variant: "default",
  set: (label, variant) => set({ label, variant }),
  clear: () => set({ label: "", variant: "default" }),
}));

interface SoundState {
  enabled: boolean;
  toggle: () => void;
}
export const useSoundStore = create<SoundState>((set) => ({
  enabled: false,
  toggle: () => set((s) => ({ enabled: !s.enabled })),
}));
