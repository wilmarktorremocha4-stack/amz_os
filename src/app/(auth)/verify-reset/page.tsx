import Link from "next/link";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { verifyResetOTP } from "@/lib/actions/passwordReset";

export default async function VerifyResetPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string }>;
}) {
  const { email, error } = await searchParams;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-6">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6 flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E90C8]/20 text-2xl mb-3">
              🔐
            </div>
            <h1 className="text-xl font-semibold text-white text-center">Check your email</h1>
            <p className="mt-2 text-sm text-blue-100/40 text-center">
              We sent a 6-digit reset code to
              {email && (
                <>
                  <br />
                  <span className="text-blue-200/60 font-medium">{decodeURIComponent(email)}</span>
                </>
              )}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
              {decodeURIComponent(error)}
            </div>
          )}

          <form action={verifyResetOTP} className="flex flex-col gap-3">
            <input type="hidden" name="email" value={email ?? ""} />
            <input
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              placeholder="6-digit code"
              autoFocus
              autoComplete="one-time-code"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] text-white placeholder-white/20 outline-none transition focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-semibold text-white shadow-lg hover:from-blue-500 hover:to-blue-400 transition"
            >
              Verify code →
            </button>
          </form>

          <p className="mt-5 flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-blue-400 hover:text-white transition">
              ← Resend code
            </Link>
            <Link href="/login" className="text-white/30 hover:text-white transition">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
