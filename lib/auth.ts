import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";

/**
 * Minimal cookie-session auth for /admin.
 *
 * - Passwords stored as bcrypt hashes in uf_users.password_hash
 * - Sessions are random 32-byte hex stored in uf_sessions, ttl 30 days
 * - Cookie: `uf_session`, HttpOnly, SameSite=Lax, Secure in production
 *
 * No CSRF guard yet — server actions are POST-only and same-origin gated by
 * Next, but if we ever expose mutations via REST we'll add a token header.
 */

const COOKIE_NAME = "uf_session";
const SESSION_TTL_DAYS = 30;

export type AdminUser = {
  id: number;
  email: string;
  name: string | null;
};

export async function login(
  email: string,
  password: string,
): Promise<{ ok: true; user: AdminUser } | { ok: false; reason: string }> {
  const rows = await sql<{ id: number; email: string; password_hash: string; name: string | null }[]>`
    SELECT id, email, password_hash, name FROM uf_users WHERE email = ${email} LIMIT 1
  `;
  const user = rows[0];
  if (!user) return { ok: false, reason: "Invalid email or password." };

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return { ok: false, reason: "Invalid email or password." };

  const sessionId = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400_000);
  await sql`
    INSERT INTO uf_sessions (id, user_id, expires_at)
    VALUES (${sessionId}, ${user.id}, ${expiresAt})
  `;

  const jar = await cookies();
  jar.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { ok: true, user: { id: user.id, email: user.email, name: user.name } };
}

export async function logout() {
  const jar = await cookies();
  const sid = jar.get(COOKIE_NAME)?.value;
  if (sid) {
    await sql`DELETE FROM uf_sessions WHERE id = ${sid}`;
  }
  jar.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<AdminUser | null> {
  const jar = await cookies();
  const sid = jar.get(COOKIE_NAME)?.value;
  if (!sid) return null;

  const rows = await sql<
    { id: number; email: string; name: string | null; expires_at: Date }[]
  >`
    SELECT u.id, u.email, u.name, s.expires_at
    FROM uf_sessions s
    JOIN uf_users u ON u.id = s.user_id
    WHERE s.id = ${sid}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  if (row.expires_at.getTime() < Date.now()) {
    await sql`DELETE FROM uf_sessions WHERE id = ${sid}`;
    return null;
  }
  return { id: row.id, email: row.email, name: row.name };
}

/** Throws to redirect callers — use from server components that need auth. */
export async function requireAdmin(): Promise<AdminUser> {
  const u = await getSessionUser();
  if (!u) {
    // Throw a special error that the layout/page can catch and redirect.
    // Simpler: callers use redirect() themselves; this just signals.
    throw new Error("UNAUTHORIZED");
  }
  return u;
}
