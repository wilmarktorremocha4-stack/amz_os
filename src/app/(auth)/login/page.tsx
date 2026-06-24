import Link from "next/link";
import Image from "next/image";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { GlobeDecoration } from "@/components/GlobeDecoration";
import { LoginLockout } from "@/components/LoginLockout";
import { checkLoginRateLimit, recordLoginAttempt, getClientIp } from "@/lib/loginRateLimit";

const LOCKOUT_AT = 8;
const WARN_AT = 5;
const LOCKOUT_MS = 2 * 60 * 1000;
const COOKIE_ATTEMPTS = "login_attempts";
const COOKIE_LOCKED   = "login_locked_until";
const COOKIE_EMAIL    = "login_prefill_email";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rawCallbackUrl = String(formData.get("callbackUrl") || "/");
  const authPages = ["/login", "/signup", "/forgot-password", "/reset-password"];
  const callbackUrl = authPages.some((p) => rawCallbackUrl.startsWith(p)) ? "/" : rawCallbackUrl;

  const ip = getClientIp();
  const jar = await cookies();

  // Read current attempt count from cookie
  const attempts = Math.max(0, parseInt(jar.get(COOKIE_ATTEMPTS)?.value ?? "0", 10) || 0);

  // IP-level rate limit (hard server block)
  const { blocked, reason } = await checkLoginRateLimit(ip, email);
  if (blocked) {
    redirect(`/login?error=${encodeURIComponent(reason)}`);
  }

  // Check email exists
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!user) {
    await recordLoginAttempt(ip, email, false);
    const allowed = await prisma.allowedEmail.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    if (allowed) {
      redirect(`/login?error=${encodeURIComponent("You have access but haven't signed up yet. Please sign up first to create your account, then log in.")}`);
    }
    redirect(`/login?error=${encodeURIComponent("This email is not registered. Please contact the admin to get access.")}`);
  }

  const cookieOpts = { path: "/login", httpOnly: true, sameSite: "lax" as const, secure: true };

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
    // Success — clear attempt cookies
    jar.delete(COOKIE_ATTEMPTS);
    jar.delete(COOKIE_LOCKED);
    jar.delete(COOKIE_EMAIL);
    await recordLoginAttempt(ip, email, true);
  } catch (err) {
    const e = err as { digest?: string; message?: string };
    if (e?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;

    if (e?.message?.includes?.("EMAIL_NOT_VERIFIED")) {
      await recordLoginAttempt(ip, email, false);
      redirect(`/login?error=EMAIL_NOT_VERIFIED&verifyEmail=${encodeURIComponent(email)}`);
    }

    if (err instanceof AuthError) {
      await recordLoginAttempt(ip, email, false);
      const next = attempts + 1;
      // Save email so it stays pre-filled even after navigating away
      jar.set(COOKIE_EMAIL, email, cookieOpts);
      if (next >= LOCKOUT_AT) {
        const until = Date.now() + LOCKOUT_MS;
        jar.set(COOKIE_LOCKED, String(until), { ...cookieOpts, maxAge: LOCKOUT_MS / 1000 });
        jar.set(COOKIE_ATTEMPTS, String(next), cookieOpts);
        redirect("/login");
      }
      jar.set(COOKIE_ATTEMPTS, String(next), cookieOpts);
      redirect(`/login?error=${encodeURIComponent("Incorrect password. Please try again.")}`);
    }

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
  const jar = await cookies();

  const attempts = Math.max(0, parseInt(jar.get(COOKIE_ATTEMPTS)?.value ?? "0", 10) || 0);
  const lockedUntil = parseInt(jar.get(COOKIE_LOCKED)?.value ?? "0", 10) || 0;
  const isLocked = lockedUntil > Date.now();
  const prefillEmail = jar.get(COOKIE_EMAIL)?.value ?? "";

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
          <h1 className="mb-1 text-xl font-semibold text-white">Welcome!</h1>
          <p className="mb-6 text-sm text-blue-100/40">
            Log in to your AMZ OS account.
          </p>

          {/* Lockout timer */}
          {isLocked && <LoginLockout until={lockedUntil} />}

          {!isLocked && (
            <>
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

              {/* Attempt counter (1–4 wrong) */}
              {attempts > 0 && attempts < WARN_AT && (
                <div className="mb-3 rounded-xl border border-orange-400/20 bg-orange-400/10 p-3 text-sm text-orange-300">
                  {attempts} wrong {attempts === 1 ? "attempt" : "attempts"} — {LOCKOUT_AT - attempts} remaining before temporary lockout.
                </div>
              )}

              {/* Forgot-password nudge (5+ wrong) */}
              {attempts >= WARN_AT && (
                <div className="mb-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-300">
                  <strong>{attempts} wrong {attempts === 1 ? "attempt" : "attempts"}.</strong> Struggling to get in?{" "}
                  <Link
                    href={`/forgot-password${prefillEmail ? `?email=${encodeURIComponent(prefillEmail)}` : ""}`}
                    className="underline font-medium hover:text-white"
                  >
                    Click here to reset your password →
                  </Link>
                </div>
              )}

              <form action={login} className="flex flex-col gap-3">
                <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/"} />
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  autoComplete="email"
                  defaultValue={prefillEmail}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
