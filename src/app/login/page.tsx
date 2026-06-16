import Link from "next/link";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { redirect } from "next/navigation";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") || "/");

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (err) {
    if (err instanceof AuthError) {
      redirect(
        `/login?error=${encodeURIComponent("Invalid email or password.")}`,
      );
    }
    throw err;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-[var(--background)] p-6">
      <div className="card card-glow w-full max-w-sm p-8">
        <div className="relative z-10 flex flex-col gap-6">
          <div>
            <h1 className="text-xl font-semibold text-[var(--foreground)]">
              Log in to AMZ OS
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              The business operating system for Amazon wholesale sellers.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          <form action={login} className="flex flex-col gap-3">
            <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/"} />
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
              placeholder="Password"
              required
              className="input"
            />
            <button type="submit" className="btn-primary mt-1 w-full">
              Log in
            </button>
          </form>

          <p className="text-center text-sm text-[var(--muted)]">
            No account yet?{" "}
            <Link href="/signup" className="text-[var(--accent)] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
