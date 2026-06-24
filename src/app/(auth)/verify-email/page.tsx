import Link from "next/link";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { verifySignupOTP, resendVerificationOTP } from "@/lib/actions/auth";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; sent?: string }>;
}) {
  const { email, error, sent } = await searchParams;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-6">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6 flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E90C8]/20 text-2xl mb-3">
              ✉️
            </div>
            <h1 className="text-xl font-semibold text-white text-center">Check your inbox</h1>
            <p className="mt-2 text-sm text-blue-100/40 text-center">
              We sent a 6-digit verification code to
              {email && (
                <>
                  <br />
                  <span className="text-blue-200/60 font-medium">{decodeURIComponent(email)}</span>
                </>
              )}
            </p>
          </div>

          {sent && (
            <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300 text-center">
              New code sent — check your inbox.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
              {decodeURIComponent(error)}
            </div>
          )}

          <form action={verifySignupOTP} className="flex flex-col gap-3">
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
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/50 hover:from-blue-500 hover:to-blue-400 transition"
            >
              Verify email →
            </button>
          </form>

          <form action={resendVerificationOTP} className="mt-4 text-center">
            <input type="hidden" name="email" value={email ?? ""} />
            <p className="text-sm text-white/30">
              Didn&apos;t get the code?{" "}
              <button type="submit" className="text-blue-400 hover:text-white transition underline underline-offset-2">
                Resend code
              </button>
            </p>
          </form>

          <p className="mt-4 text-center text-xs text-white/20">
            Code expires in 30 minutes.{" "}
            <Link href="/signup" className="text-blue-400/60 hover:text-blue-400">
              Wrong email?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
