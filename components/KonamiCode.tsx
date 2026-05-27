"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Konami code easter egg → /wall-of-receipts.
 * UP UP DOWN DOWN LEFT RIGHT LEFT RIGHT B A
 *
 * The press triggers a brief "EVIDENCE UNSEALED" screen-flash before the
 * route push, so it feels intentional, not accidental.
 */
const sequence = [
  "ArrowUp","ArrowUp","ArrowDown","ArrowDown",
  "ArrowLeft","ArrowRight","ArrowLeft","ArrowRight",
  "b","a"
];

export function KonamiCode() {
  const router = useRouter();
  useEffect(() => {
    let buffer: string[] = [];
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      buffer.push(key);
      if (buffer.length > sequence.length) buffer = buffer.slice(-sequence.length);
      if (buffer.length === sequence.length && buffer.every((k, i) => k === sequence[i])) {
        // brief flash overlay before routing
        const flash = document.createElement("div");
        flash.setAttribute("aria-hidden", "true");
        flash.style.cssText = [
          "position:fixed", "inset:0", "background:#E63946",
          "color:#0B0B0B", "font-family:var(--font-display)",
          "font-size:14vw", "font-weight:900",
          "display:grid", "place-items:center",
          "z-index:99999", "letter-spacing:-0.05em",
          "animation:redaction-assemble 0.9s var(--ease-paper) forwards",
        ].join(";");
        flash.textContent = "EVIDENCE UNSEALED";
        document.body.appendChild(flash);
        setTimeout(() => {
          flash.remove();
          router.push("/wall-of-receipts");
        }, 900);
        buffer = [];
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
