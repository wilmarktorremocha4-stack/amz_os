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
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="https://assets.cdn.filesafe.space/2rx7sGBL7YKaiP0HwK56/media/68de919caf128ea07f29c095.png"
            alt="AMZ OS"
            width={160}
            height={64}
            className="h-16 w-auto object-contain drop-shadow-[0_0_20px_rgba(96,165,250,0.4)]"
            unoptimized
          />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 shadow-2xl backdrop-blur-2xl">
          <h1 className="mb-1 text-xl font-semibold text-white">
            Create your account
          </h1>
          <p className="mb-6 text-sm text-blue-100/40">
            Your email must be pre-approved by the admin.
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
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
              className="group relative mt-2 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/50 transition-all duration-200 hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-700/60 hover:shadow-xl active:scale-[0.97] active:shadow-none"
            >
              <span className="relative z-10">Create account →</span>
              <span className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-300 group-hover:translate-x-0" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/30">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 transition hover:text-white">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
