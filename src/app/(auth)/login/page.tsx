import Link from "next/link";
import Image from "next/image";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { GlobeDecoration } from "@/components/GlobeDecoration";
import { checkLoginRateLimit, recordLoginAttempt, getClientIp } from "@/lib/loginRateLimit";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rawCallbackUrl = String(formData.get("callbackUrl") || "/");
  const authPages = ["/login", "/signup", "/forgot-password", "/reset-password"];
  const callbackUrl = authPages.some((p) => rawCallbackUrl.startsWith(p)) ? "/" : rawCallbackUrl;

  const ip = getClientIp();

  // Rate limit check — block bots and brute-force attacks
  const { blocked, reason } = await checkLoginRateLimit(ip, email);
  if (blocked) {
    redirect(`/login?error=${encodeURIComponent(reason)}`);
  }

  // Check if email exists at all
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!user) {
    await recordLoginAttempt(ip, email, false);
    redirect(`/login?error=${encodeURIComponent("This email is not registered. Please contact the admin to get access.")}`);
  }

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
    await recordLoginAttempt(ip, email, true);
  } catch (err) {
    const e = err as { digest?: string; message?: string };
    // Next.js redirect() throws — must be re-thrown
    if (e?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
    // Unverified account
    if (e?.message?.includes?.("EMAIL_NOT_VERIFIED")) {
      await recordLoginAttempt(ip, email, false);
      redirect(`/login?error=EMAIL_NOT_VERIFIED&verifyEmail=${encodeURIComponent(email)}`);
    }
    // Wrong password (NextAuth v5 AuthError)
    if (err instanceof AuthError) {
      await recordLoginAttempt(ip, email, false);
      redirect(`/login?error=${encodeURIComponent("Incorrect password. Please try again.")}`);
    }
    // Any other unexpected error
    await recordLoginAttempt(ip, email, false);
    redirect(`/login?error=${encodeURIComponent("Sign in failed. Please try again.")}`);
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
    callbackUrl?: string;
    verifyEmail?: string;
  }>;
}) {
  const { error, success, callbackUrl, verifyEmail } = await searchParams;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-6">
      <AnimatedBackground />
      <GlobeDecoration />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="https://assets.cdn.filesafe.space/2rx7sGBL7YKaiP0HwK56/media/6a3427f3671890ccaac6cf63.png"
            alt="AMZ OS"
            width={400}
            height={160}
            className="h-48 w-auto object-contain drop-shadow-[0_0_30px_rgba(0,200,255,0.5)]"
            unoptimized
          />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 shadow-2xl backdrop-blur-2xl">
          <h1 className="mb-1 text-xl font-semibold text-white">Welcome back</h1>
          <p className="mb-6 text-sm text-blue-100/40">
            Log in to your AMZ OS account.
          </p>

          {success && (
            <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">
              {success}
            </div>
          )}
          {error === "EMAIL_NOT_VERIFIED" ? (
            <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-300">
              Your email address hasn&apos;t been verified yet.{" "}
              <Link
                href={verifyEmail ? `/verify-email?email=${encodeURIComponent(verifyEmail)}` : "/verify-email"}
                className="underline font-medium"
              >
                Verify now →
              </Link>
            </div>
          ) : error ? (
            <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <form action={login} className="flex flex-col gap-3">
            <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/"} />
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
              placeholder="Password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-blue-400/50 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              className="group relative mt-2 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/50 transition-all duration-200 hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-700/60 hover:shadow-xl active:scale-[0.97] active:shadow-none"
            >
              <span className="relative z-10">Log in →</span>
              <span className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-300 group-hover:translate-x-0" />
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm text-white/30">
              No account?{" "}
              <Link href="/signup" className="text-blue-400 hover:text-white">Sign up</Link>
            </p>
            <Link href="/forgot-password" className="text-sm text-blue-400 hover:text-white">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
