import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILS_PER_IP = 10;
const MAX_FAILS_PER_EMAIL = 15;

export function getClientIp(): string {
  try {
    const h = headers();
    // Vercel sets x-forwarded-for; fall back to a placeholder
    const forwarded = (h as unknown as { get: (k: string) => string | null }).get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    const real = (h as unknown as { get: (k: string) => string | null }).get("x-real-ip");
    if (real) return real.trim();
  } catch { /* headers() not available outside request context */ }
  return "unknown";
}

export async function checkLoginRateLimit(ip: string, email: string): Promise<{ blocked: boolean; reason: string }> {
  const since = new Date(Date.now() - WINDOW_MS);

  const [ipFails, emailFails] = await Promise.all([
    prisma.loginAttempt.count({
      where: { ip, success: false, createdAt: { gt: since } },
    }),
    prisma.loginAttempt.count({
      where: { email, success: false, createdAt: { gt: since } },
    }),
  ]);

  if (ipFails >= MAX_FAILS_PER_IP) {
    return { blocked: true, reason: "Too many failed attempts from your network. Try again in 15 minutes." };
  }
  if (emailFails >= MAX_FAILS_PER_EMAIL) {
    return { blocked: true, reason: "Too many failed attempts for this account. Try again in 15 minutes." };
  }
  return { blocked: false, reason: "" };
}

export async function recordLoginAttempt(ip: string, email: string, success: boolean) {
  await prisma.loginAttempt.create({ data: { ip, email, success } }).catch(() => {});
  // On success, clean up old failed attempts for this email/IP
  if (success) {
    const since = new Date(Date.now() - WINDOW_MS);
    await prisma.loginAttempt.deleteMany({
      where: { email, success: false, createdAt: { gt: since } },
    }).catch(() => {});
  }
  // Prune records older than 24 hours to keep the table small
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  }).catch(() => {});
}
