import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILS_PER_IP = 15; // only block by IP, never lock out the account itself

export function getClientIp(): string {
  try {
    const h = headers();
    const forwarded = (h as unknown as { get: (k: string) => string | null }).get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    const real = (h as unknown as { get: (k: string) => string | null }).get("x-real-ip");
    if (real) return real.trim();
  } catch { /* headers() not available outside request context */ }
  return "unknown";
}

export async function checkLoginRateLimit(ip: string, email: string): Promise<{ blocked: boolean; reason: string }> {
  // Never block "unknown" IPs (local dev, misconfigured proxy) — only block real IPs
  if (!ip || ip === "unknown") return { blocked: false, reason: "" };

  const since = new Date(Date.now() - WINDOW_MS);

  const ipFails = await prisma.loginAttempt.count({
    where: { ip, success: false, createdAt: { gt: since } },
  });

  // Block the IP, NOT the account — the account is never locked out
  // This means someone can always log in from a different device/network
  if (ipFails >= MAX_FAILS_PER_IP) {
    return {
      blocked: true,
      reason: "Too many failed attempts from this device. Please wait 15 minutes or try from a different device/network.",
    };
  }

  void email; // email-level blocking intentionally removed — avoids locking out real users
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
