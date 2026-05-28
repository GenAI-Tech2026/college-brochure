import { NextRequest, NextResponse } from "next/server";

/**
 * Gate /admin. If there's no session cookie, redirect to /admin/login.
 * (Server components still re-check the session via lib/auth — this is just
 * a fast path that avoids loading the admin layout for anonymous users.)
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page + its action to render publicly.
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/") ||
    pathname === "/admin/logout"
  ) {
    return NextResponse.next();
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const session = req.cookies.get("uf_session")?.value;
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
