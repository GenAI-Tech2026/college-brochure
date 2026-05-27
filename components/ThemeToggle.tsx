"use client";
import { useEffect, useState } from "react";

/**
 * Dark/light morphing toggle (not an instant flip).
 * Uses View Transitions API on supported browsers; falls back to a
 * class swap + CSS transition elsewhere.
 *
 * Defaults to ink (dark). Light mode = paper.
 */
export function ThemeToggle() {
  const [mode, setMode] = useState<"ink" | "paper">("ink");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && (localStorage.getItem("uf-theme") as "ink" | "paper")) || "ink";
    setMode(saved);
    document.documentElement.dataset.theme = saved;
  }, []);

  const toggle = async () => {
    const next = mode === "ink" ? "paper" : "ink";
    localStorage.setItem("uf-theme", next);
    setMode(next);

    type DocVT = Document & { startViewTransition?: (cb: () => void) => void };
    const d = document as DocVT;
    if (typeof d.startViewTransition === "function") {
      d.startViewTransition(() => {
        document.documentElement.dataset.theme = next;
      });
    } else {
      document.documentElement.dataset.theme = next;
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${mode === "ink" ? "light/paper" : "dark/ink"} theme`}
      title={`Currently ${mode === "ink" ? "dark" : "light"} theme — click to switch`}
      data-cursor="link"
      className="group relative flex h-8 w-16 items-center rounded-full border border-newsprint/40 px-1"
    >
      <span
        className={
          "absolute h-5 w-5 rounded-full transition-transform duration-500 ease-[var(--ease-press)] " +
          (mode === "paper" ? "translate-x-8 bg-ink" : "translate-x-0 bg-newsprint")
        }
      />
      <span className="ml-7 font-mono text-[9px] uppercase tracking-[0.2em]">
        {mode === "ink" ? "Dark" : "Light"}
      </span>
    </button>
  );
}
