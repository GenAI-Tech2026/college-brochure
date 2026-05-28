"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/colleges", label: "Colleges" },
  { href: "/admin/brochure-claims", label: "Brochure claims" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/verified-students", label: "Verified students" },
  { href: "/admin/truth-revelations", label: "Truth revelations" },
];

export function StudioNav() {
  const path = usePathname();
  return (
    <nav className="flex-1 px-3 py-4">
      <ul className="space-y-1">
        {items.map((it) => {
          const active =
            it.href === "/admin" ? path === "/admin" : path?.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={
                  "block rounded px-3 py-2 font-sans text-sm transition-colors " +
                  (active
                    ? "bg-truth/10 text-truth"
                    : "text-newsprint/70 hover:bg-newsprint/5 hover:text-newsprint")
                }
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
