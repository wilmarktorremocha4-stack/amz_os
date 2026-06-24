import Link from "next/link";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { setNewPassword } from "@/lib/actions/passwordReset";
import { redirect } from "next/navigation";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string; t?: string }>;
}) {
  const { error, email, t } = await searchParams;

  // Must arrive here via the OTP verification step — block direct access
  if (!t || !email) redirect("/forgot-password");

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-6">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-white">Set new password</h1>
            <p className="mt-1 text-sm text-blue-100/40">
              Create a strong password for{" "}
              <span className="text-blue-200/60">{decodeURIComponent(email)}</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
              {decodeURIComponent(error)}
            </div>
          )}

          <form action={setNewPassword} className="flex flex-col gap-3">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="tokenId" value={t} />
            <input
              name="password"
              type="password"
              placeholder="New password (8+ characters)"
              required
              minLength={8}
              autoFocus
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              required
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-semibold text-white shadow-lg hover:from-blue-500 hover:to-blue-400 transition"
            >
              Reset password →
            </button>
          </form>

          <p className="mt-5 text-center text-sm">
            <Link href="/login" className="text-blue-400 hover:text-white transition">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
