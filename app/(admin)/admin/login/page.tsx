import { redirect } from "next/navigation";
import { login, getSessionUser } from "@/lib/auth";

export const metadata = { title: "Sign in" };

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const result = await login(email, password);
  if (!result.ok) {
    redirect(`/admin/login?err=${encodeURIComponent(result.reason)}`);
  }
  redirect("/admin");
}

export default async function StudioLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const u = await getSessionUser();
  if (u) redirect("/admin");
  const { err } = await searchParams;

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-sm">
        <p className="font-mono text-meta uppercase tracking-[0.3em] text-newsprint/55">
          UNFILTERED · Admin
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-newsprint">
          Sign in.
        </h1>

        <form action={loginAction} className="mt-8 space-y-5">
          <div>
            <label className="block font-mono text-meta uppercase tracking-[0.25em] text-newsprint/60">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              autoFocus
              autoComplete="email"
              className="can-fade mt-2 w-full border-b border-newsprint/30 bg-transparent py-2 text-newsprint outline-none focus:border-truth"
            />
          </div>
          <div>
            <label className="block font-mono text-meta uppercase tracking-[0.25em] text-newsprint/60">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="can-fade mt-2 w-full border-b border-newsprint/30 bg-transparent py-2 text-newsprint outline-none focus:border-truth"
            />
          </div>

          {err ? (
            <p className="font-mono text-meta uppercase tracking-[0.2em] text-truth">
              {err}
            </p>
          ) : null}

          <button
            type="submit"
            className="mt-2 w-full bg-truth px-4 py-3 font-mono text-meta uppercase tracking-[0.3em] text-newsprint transition-colors hover:bg-truth/85"
          >
            Sign in →
          </button>
        </form>

        <p className="mt-12 font-mono text-meta uppercase tracking-[0.2em] text-newsprint/40">
          Pseudonymous to readers. Verified to us.
        </p>
      </div>
    </div>
  );
}
