import Link from "next/link";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { verifyOTPAndReset } from "@/lib/actions/passwordReset";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  const { error, email } = await searchParams;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-6">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 shadow-2xl backdrop-blur-2xl">
          <h1 className="mb-1 text-xl font-semibold text-white">Enter your code</h1>
          <p className="mb-6 text-sm text-blue-100/40">
            Check your email for the 6-digit code, then set a new password.
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{decodeURIComponent(error)}</div>
          )}

          <form action={verifyOTPAndReset} className="flex flex-col gap-3">
            <input name="email" type="email" placeholder="Your email" defaultValue={email ?? ""} required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20" />
            <input name="otp" placeholder="6-digit code" required maxLength={6}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none font-mono tracking-widest focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20" />
            <input name="password" type="password" placeholder="New password (8+ chars)" required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20" />
            <input name="confirmPassword" type="password" placeholder="Confirm new password" required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20" />
            <button type="submit"
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-semibold text-white hover:from-blue-500">
              Reset password →
            </button>
          </form>

          <p className="mt-5 flex items-center justify-between text-sm text-white/30">
            <Link href="/forgot-password" className="text-blue-400 hover:text-white">← Resend code</Link>
            <Link href="/login" className="text-blue-400 hover:text-white">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
