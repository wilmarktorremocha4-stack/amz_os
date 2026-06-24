"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { encrypt } from "@/lib/crypto";
import { sendEmailViaUserSmtp } from "@/lib/email";

// Block internal/private IP ranges to prevent SSRF via smtpHost
function isBlockedHost(host: string): boolean {
  return /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.|0\.|::1|localhost)/i.test(host.trim());
}

// Strip characters that could cause SMTP header injection
function sanitizeFromName(name: string): string {
  return name.replace(/[\r\n"]/g, "").slice(0, 100).trim();
}

export async function saveSmtpSettings(data: {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFromName: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();

    if (!data.smtpHost || isBlockedHost(data.smtpHost)) {
      return { success: false, error: "Invalid SMTP host" };
    }
    if (!data.smtpUser || !data.smtpUser.includes("@")) {
      return { success: false, error: "Invalid email address" };
    }
    if (!data.smtpPass) {
      return { success: false, error: "Password is required" };
    }
    const port = Number(data.smtpPort);
    if (!port || port < 1 || port > 65535) {
      return { success: false, error: "Invalid SMTP port" };
    }

    let encrypted: string;
    try {
      encrypted = encrypt(data.smtpPass);
    } catch {
      return {
        success: false,
        error: "Server is missing SMTP_ENCRYPTION_SECRET. Please add it to your Vercel environment variables.",
      };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        smtpHost: data.smtpHost.trim(),
        smtpPort: port,
        smtpUser: data.smtpUser.trim().toLowerCase(),
        smtpPassEncrypted: encrypted,
        smtpFromName: data.smtpFromName ? sanitizeFromName(data.smtpFromName) : null,
        smtpVerifiedAt: null,
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save settings",
    };
  }
}

export async function testSmtpConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPassEncrypted: true,
        smtpFromName: true,
      },
    });

    if (!dbUser?.smtpHost || !dbUser.smtpUser || !dbUser.smtpPassEncrypted) {
      return { success: false, error: "SMTP credentials not saved — please fill in the form and try again" };
    }

    await sendEmailViaUserSmtp({
      smtpConfig: {
        smtpHost: dbUser.smtpHost,
        smtpPort: dbUser.smtpPort!,
        smtpUser: dbUser.smtpUser,
        smtpPassEncrypted: dbUser.smtpPassEncrypted,
        smtpFromName: dbUser.smtpFromName,
      },
      to: dbUser.smtpUser,
      subject: "✅ AMZ OS — Email connection verified",
      html: `
        <div style="font-family:sans-serif;padding:32px;max-width:500px">
          <h2 style="color:#0E90C8">Your email is connected!</h2>
          <p>Outreach emails from AMZ OS will be sent from
          <strong>${dbUser.smtpUser}</strong>.</p>
          <p style="color:#64748B;font-size:13px">This is an automated test message.</p>
        </div>
      `,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { smtpVerifiedAt: new Date() },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Connection failed";
    // Surface friendly messages for common auth/TLS errors
    const friendly = msg.includes("535") || msg.includes("534") || msg.includes("Username and Password not accepted")
      ? "Wrong email or password. For Gmail/Yahoo use an App Password, not your regular password."
      : msg.includes("SMTP_ENCRYPTION_SECRET") || msg.includes("scrypt")
      ? "Server is missing SMTP_ENCRYPTION_SECRET in Vercel environment variables."
      : msg.includes("ECONNREFUSED") || msg.includes("ETIMEDOUT") || msg.includes("ENOTFOUND")
      ? `Cannot reach ${msg.includes("ENOTFOUND") ? "the SMTP server" : "mail server"} — check the host/port and try again.`
      : msg.includes("certificate") || msg.includes("self signed")
      ? "TLS certificate error — try a different port (465 or 587)."
      : msg;
    return { success: false, error: friendly };
  }
}

export async function disconnectSmtp() {
  const user = await getCurrentUser();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      smtpHost: null,
      smtpPort: null,
      smtpUser: null,
      smtpPassEncrypted: null,
      smtpFromName: null,
      smtpVerifiedAt: null,
    },
  });
  revalidatePath("/settings");
}

export async function getSmtpStatus() {
  const user = await getCurrentUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { smtpUser: true, smtpFromName: true, smtpVerifiedAt: true },
  });
  return dbUser;
}
