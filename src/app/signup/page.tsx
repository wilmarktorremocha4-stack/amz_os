import Link from "next/link";
import { signUp } from "@/lib/actions/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-[var(--background)] p-6">
      <div className="card card-glow w-full max-w-sm p-8">
        <div className="relative z-10 flex flex-col gap-6">
          <div>
            <h1 className="text-xl font-semibold text-[var(--foreground)]">
              Create your AMZ OS account
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Track suppliers, brand research, and revenue in one place.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          <form action={signUp} className="flex flex-col gap-3">
            <input name="name" placeholder="Name" className="input" />
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              className="input"
            />
            <input
              name="password"
              type="password"
              placeholder="Password (8+ characters)"
              required
              minLength={8}
              className="input"
            />
            <button type="submit" className="btn-primary mt-1 w-full">
              Create account
            </button>
          </form>

          <p className="text-center text-sm text-[var(--muted)]">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--accent)] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
