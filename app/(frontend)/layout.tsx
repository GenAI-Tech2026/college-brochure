/**
 * Frontend route-group root.
 *
 * Renders its own <html>/<body> so the (payload) group can render Payload's
 * own RootLayout (which also emits <html>/<body>) without nesting. Owns the
 * fonts, globals.css, Lenis smooth scroll, ScrollTrigger, custom cursor,
 * Nav, Footer, Konami easter egg.
 */
import { Fraunces, Instrument_Serif, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "../globals.css";

import { LenisProvider } from "@/components/providers/LenisProvider";
import { ScrollTriggerProvider } from "@/components/providers/ScrollTriggerProvider";
import { CustomCursor } from "@/components/CustomCursor";
import { KonamiCode } from "@/components/KonamiCode";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz", "SOFT"],
  display: "swap",
});
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="ink"
      className={`${fraunces.variable} ${instrument.variable} ${interTight.variable} ${jetbrains.variable}`}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[99999] focus:bg-truth focus:px-3 focus:py-2 focus:text-newsprint"
        >
          Skip to main content
        </a>
        <ScrollTriggerProvider>
          <LenisProvider>
            <Nav />
            <CustomCursor />
            <KonamiCode />
            <main id="main" tabIndex={-1}>
              {children}
            </main>
            <Footer />
          </LenisProvider>
        </ScrollTriggerProvider>
      </body>
    </html>
  );
}
