import Link from "next/link";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { PasswordMatchForm } from "@/components/PasswordMatchForm";
import { redirect } from "next/navigation";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string; t?: string }>;
}) {
  const { error, email, t } = await searchParams;

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

          <PasswordMatchForm email={email} tokenId={t} />

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
