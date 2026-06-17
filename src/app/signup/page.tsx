import Link from "next/link";
import Image from "next/image";
import { signUp } from "@/lib/actions/auth";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-6">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image
            src="https://assets.cdn.filesafe.space/2rx7sGBL7YKaiP0HwK56/media/68de916c065f281e19a858a2.png"
            alt="AMZ OS"
            width={120}
            height={48}
            className="h-12 w-auto object-contain drop-shadow-lg"
            unoptimized
          />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-2xl">
          <h1 className="mb-1 text-xl font-semibold text-white">
            Create your account
          </h1>
          <p className="mb-6 text-sm text-blue-100/50">
            Track suppliers, brands, and revenue in one place.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form action={signUp} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                name="firstName"
                placeholder="First name"
                autoComplete="given-name"
                className="w-full min-w-0 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-blue-400/50 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                name="lastName"
                placeholder="Last name"
                autoComplete="family-name"
                className="w-full min-w-0 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-blue-400/50 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
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
              placeholder="Password (8+ characters)"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-blue-400/50 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-500 active:scale-[0.98]"
            >
              Create account →
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/30">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-300 transition hover:text-white"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
