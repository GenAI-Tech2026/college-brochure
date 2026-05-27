/**
 * Some colleges have primary accents (e.g. #0B0B0B ink) that vanish
 * against the ink background. This helper picks a legible fallback
 * for use on dark surfaces while preserving the brand on paper.
 */
const INK_LIKE = new Set(["#000", "#000000", "#0B0B0B", "#0b0b0b", "#111", "#111111"]);

export function safeAccentOnDark(hex: string, fallback = "#E63946"): string {
  return INK_LIKE.has(hex) ? fallback : hex;
}
