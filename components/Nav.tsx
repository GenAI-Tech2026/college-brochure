"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Editorial masthead with:
 *
 *  1) Always-legible solid backdrop (replaces the old mix-blend-difference
 *     which vanished against red/cream surfaces).
 *  2) Hide-on-scroll-down, show-on-scroll-up.
 *  3) Mobile hamburger menu — desktop links are hidden below 768 px,
 *     replaced by a single icon button that opens a full-viewport
 *     overlay containing the same links + the toggles.
 */
const links = [
  { href: "/", label: "Front Page" },
  { href: "/showcase", label: "Showcase" },
  { href: "/colleges", label: "The File" },
  { href: "/manifesto", label: "Manifesto" },
  { href: "/verified", label: "Verified" },
  { href: "/submit", label: "Submit Truth" },
];

export function Nav() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let raf = 0;
    let lastY = window.scrollY;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const y = window.scrollY;
      const dy = y - lastY;
      if (Math.abs(dy) > 4) {
        // Don't auto-hide while the mobile menu is open
        if (!menuOpen) {
          if (y > 120 && dy > 0) setHidden(true);
          else if (dy < 0) setHidden(false);
        }
        lastY = y;
      }
      setAtTop(y < 40);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [menuOpen]);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "no-print fixed left-0 right-0 top-0 z-50 transition-transform duration-500 ease-[var(--ease-expo)]",
          hidden && !menuOpen ? "-translate-y-full" : "translate-y-0"
        )}
      >
        <div
          className={cn(
            "relative px-6 py-4 transition-colors duration-500 md:px-10",
            atTop && !menuOpen ? "bg-transparent" : "bg-ink/90 backdrop-blur-md",
            !atTop && !menuOpen && "border-b border-newsprint/10"
          )}
        >
          <div className="flex items-center justify-between gap-8 text-newsprint">
            <Link
              href="/"
              data-cursor="link"
              className="font-display text-xl font-black uppercase tracking-[-0.02em]"
            >
              <span className="relative">UN<span className="text-truth">FILTERED</span></span>
            </Link>

            <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
              {links.map((l) => {
                const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    data-cursor="link"
                    className={cn(
                      "relative font-sans text-meta uppercase tracking-[0.2em] transition-opacity",
                      active ? "opacity-100" : "opacity-75 hover:opacity-100"
                    )}
                  >
                    {active && (
                      <span className="absolute -bottom-1.5 left-0 right-0 h-px bg-truth" />
                    )}
                    {l.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              {/* Mobile hamburger — only visible below 768px. Three short
                  rules; rotate into an X when open so the close affordance
                  is obvious. */}
              <button
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
                className="md:hidden flex h-10 w-10 flex-col items-center justify-center gap-1.5"
              >
                <span
                  className={cn(
                    "block h-px w-6 bg-newsprint transition-transform duration-300",
                    menuOpen && "translate-y-[7px] rotate-45"
                  )}
                />
                <span
                  className={cn(
                    "block h-px w-6 bg-newsprint transition-opacity duration-200",
                    menuOpen && "opacity-0"
                  )}
                />
                <span
                  className={cn(
                    "block h-px w-6 bg-newsprint transition-transform duration-300",
                    menuOpen && "-translate-y-[7px] -rotate-45"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile full-screen menu overlay */}
      <div
        aria-hidden={!menuOpen}
        className={cn(
          "no-print fixed inset-0 z-40 transition-all duration-500 md:hidden",
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="absolute inset-0 bg-ink/98 backdrop-blur-md" onClick={() => setMenuOpen(false)} />
        <nav
          aria-label="Mobile primary"
          className="relative grid h-full place-items-center px-8 pt-24"
        >
          <ul className="flex w-full flex-col gap-4">
            {links.map((l, i) => {
              const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    data-cursor="link"
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "block font-display text-5xl font-black uppercase tracking-[-0.02em] leading-none transition-transform duration-500",
                      active ? "text-truth" : "text-newsprint",
                      menuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    )}
                    style={{ transitionDelay: menuOpen ? `${i * 60}ms` : "0ms" }}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="absolute bottom-10 left-8 right-8 border-t border-newsprint/15 pt-6 text-center font-mono text-meta uppercase tracking-[0.3em] text-newsprint/60">
            UF-2026 · Brochures lie. Students don&apos;t.
          </div>
        </nav>
      </div>
    </>
  );
}
