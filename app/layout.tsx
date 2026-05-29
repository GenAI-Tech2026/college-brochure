import type { Metadata, Viewport } from "next";

/**
 * Top-level passthrough.
 *
 * The (frontend) route group owns its own <html>/<body> + fonts + globals.css.
 * The (payload) route group is wrapped by Payload's own RootLayout component
 * which provides its own <html>/<body>. Having html/body here too produced
 * nested <html><body><html><body> and a hydration crash.
 *
 * Next.js App Router accepts this layout — each route group layout renders
 * exactly one <html>/<body> pair, so the rendered tree stays valid.
 */
export const metadata: Metadata = {
  title: { default: "College Brochure — Brochures lie. Students don't.", template: "%s · College Brochure" },
  description:
    "A verified-peer-review platform exposing the gap between college brochures and student reality.",
  openGraph: {
    title: "College Brochure",
    description: "Brochures lie. Students don't.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0B0B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
