import Link from "next/link";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { redirect } from "next/navigation";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Boxes } from "lucide-react";

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
  searchParams: Promise<{
    error?: string;
    success?: string;
    callbackUrl?: string;
  }>;
}) {
  const { error, success, callbackUrl } = await searchParams;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-6">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 shadow-lg backdrop-blur-sm ring-1 ring-white/20">
            <Boxes size={24} className="text-white" />
          </div>
          <div className="text-center">
            <div className="text-xl font-bold tracking-tight text-white">
              AMZ OS
            </div>
            <div className="text-xs text-blue-200/60">
              Wholesale Operating System
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-2xl">
          <h1 className="mb-1 text-xl font-semibold text-white">
            Welcome back
          </h1>
          <p className="mb-6 text-sm text-blue-100/50">
            Log in to your AMZ OS account.
          </p>

          {success && (
            <div className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form action={login} className="flex flex-col gap-3">
            <input
              type="hidden"
              name="callbackUrl"
              value={callbackUrl ?? "/"}
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-blue-400/50 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-blue-400/50 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-500 active:scale-[0.98]"
            >
              Log in →
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/30">
            No account yet?{" "}
            <Link
              href="/signup"
              className="text-blue-300 transition hover:text-white"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
