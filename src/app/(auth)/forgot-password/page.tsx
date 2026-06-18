import Link from "next/link";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { requestPasswordReset } from "@/lib/actions/passwordReset";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; email?: string }>;
}) {
  const { error, sent, email } = await searchParams;
  const emailNotConfigured = !process.env.RESEND_API_KEY;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-6">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 shadow-2xl backdrop-blur-2xl">
          <h1 className="mb-1 text-xl font-semibold text-white">Reset password</h1>
          <p className="mb-6 text-sm text-blue-100/40">
            Enter your email and we&apos;ll send a 6-digit code.
          </p>

          {emailNotConfigured && (
            <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-300">
              <strong className="block mb-1">Email not configured</strong>
              To enable password reset, add <code className="bg-black/30 px-1 rounded">RESEND_API_KEY</code> to your
              Netlify environment variables. Sign up free at{" "}
              <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline">resend.com</a>.
            </div>
          )}

          {sent ? (
            <div>
              <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">
                Code sent! Check your inbox (and spam folder).
              </div>
              <Link href={`/reset-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                className="block w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-center text-sm font-semibold text-white hover:from-blue-500">
                Enter my code →
              </Link>
            </div>
          ) : (
            <form action={requestPasswordReset} className="flex flex-col gap-3">
              {error && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
                  {decodeURIComponent(error)}
                </div>
              )}
              <input name="email" type="email" placeholder="Email address" required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20" />
              <button type="submit" disabled={emailNotConfigured}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-semibold text-white hover:from-blue-500 disabled:opacity-40 disabled:cursor-not-allowed">
                Send reset code →
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-white/30">
            <Link href="/login" className="text-blue-400 hover:text-white">← Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
