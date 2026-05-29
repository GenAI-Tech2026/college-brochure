import { Fraunces, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "../../globals.css";
import "./admin.css";

import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { StudioNav } from "@/components/admin/StudioNav";

/**
 * /admin — admin route group. Renders its own <html>/<body> so it doesn't
 * inherit the marketing site's Lenis, custom cursor, or Nav. Stays in the
 * brand's typographic system (Fraunces for display, Inter Tight for UI,
 * JetBrains Mono for meta) but with admin chrome.
 *
 * Auth is enforced at the page level for individual /admin routes (so
 * /admin/login can render publicly). This layout shows the chrome only
 * when a session exists.
 */
export const metadata = {
  title: { default: "Admin · College Brochure", template: "%s · Admin · College Brochure" },
};

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz", "SOFT"],
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

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <html
      lang="en"
      data-theme="admin"
      className={`${fraunces.variable} ${interTight.variable} ${jetbrains.variable}`}
    >
      <body className="bg-ink text-newsprint antialiased">
        {user ? (
          <div className="flex min-h-screen">
            {/* SIDEBAR */}
            <aside className="hidden w-64 shrink-0 border-r border-newsprint/10 bg-[#0F0E0C] md:flex md:flex-col">
              <Link
                href="/admin"
                className="flex items-center gap-2 border-b border-newsprint/10 px-6 py-5 font-display text-lg font-black uppercase tracking-tight text-newsprint"
              >
                College
                <span className="text-truth">Brochure</span>
                <span className="ml-auto font-mono text-meta uppercase tracking-[0.25em] text-newsprint/55">
                  admin
                </span>
              </Link>
              <StudioNav />
              <div className="mt-auto border-t border-newsprint/10 px-6 py-5">
                <p className="font-mono text-meta uppercase tracking-[0.2em] text-newsprint/55">
                  Signed in
                </p>
                <p className="mt-1 truncate font-sans text-sm text-newsprint/90">
                  {user.email}
                </p>
                <form action="/admin/logout" method="post" className="mt-3">
                  <button
                    type="submit"
                    className="font-mono text-meta uppercase tracking-[0.2em] text-newsprint/60 hover:text-truth"
                  >
                    Sign out →
                  </button>
                </form>
              </div>
            </aside>

            <main className="flex-1 overflow-x-hidden">{children}</main>
          </div>
        ) : (
          <main>{children}</main>
        )}
      </body>
    </html>
  );
}
