import Link from "next/link";
import { signUp } from "@/lib/actions/auth";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Boxes } from "lucide-react";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center p-6">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/40">
            <Boxes size={24} className="text-white" />
          </div>
          <div className="text-center">
            <div className="text-xl font-bold tracking-tight text-white">
              AMZ OS
            </div>
            <div className="text-xs text-blue-300/70">
              Wholesale Operating System
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <h1 className="mb-1 text-xl font-semibold text-white">
            Create your account
          </h1>
          <p className="mb-6 text-sm text-blue-200/60">
            Track suppliers, brands, and revenue in one place.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form action={signUp} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                name="firstName"
                placeholder="First name"
                className="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-blue-200/40 outline-none transition focus:border-blue-500/60 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30"
              />
              <input
                name="lastName"
                placeholder="Last name"
                className="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-blue-200/40 outline-none transition focus:border-blue-500/60 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-blue-200/40 outline-none transition focus:border-blue-500/60 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30"
            />
            <input
              name="password"
              type="password"
              placeholder="Password (8+ characters)"
              required
              minLength={8}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-blue-200/40 outline-none transition focus:border-blue-500/60 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/30"
            />
            <button
              type="submit"
              className="mt-1 w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-400/40"
            >
              Create account
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-blue-200/50">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-300 hover:text-white transition"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
