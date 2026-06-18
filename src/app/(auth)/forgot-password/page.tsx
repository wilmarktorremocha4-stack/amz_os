import Link from "next/link";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { requestPasswordReset } from "@/lib/actions/passwordReset";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-6">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 shadow-2xl backdrop-blur-2xl">
          <h1 className="mb-1 text-xl font-semibold text-white">Reset password</h1>
          <p className="mb-6 text-sm text-blue-100/40">
            Enter your email and we'll send a 6-digit code.
          </p>

          {sent ? (
            <div>
              <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">
                If that email is registered, a reset code was sent. Check your inbox.
              </div>
              <Link href="/reset-password"
                className="block w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-center text-sm font-semibold text-white hover:from-blue-500">
                Enter my code →
              </Link>
            </div>
          ) : (
            <form action={requestPasswordReset} className="flex flex-col gap-3">
              {error && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{decodeURIComponent(error)}</div>
              )}
              <input name="email" type="email" placeholder="Email" required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20" />
              <button type="submit"
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-semibold text-white hover:from-blue-500">
                Send code →
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
