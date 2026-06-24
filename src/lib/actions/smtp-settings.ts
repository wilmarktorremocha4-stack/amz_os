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
}) {
  const user = await getCurrentUser();

  if (!data.smtpHost || isBlockedHost(data.smtpHost)) {
    throw new Error("Invalid SMTP host");
  }
  if (!data.smtpUser || !data.smtpUser.includes("@")) {
    throw new Error("Invalid SMTP username (must be an email address)");
  }
  if (!data.smtpPass) {
    throw new Error("Password is required");
  }
  const port = Number(data.smtpPort);
  if (!port || port < 1 || port > 65535) {
    throw new Error("Invalid SMTP port");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      smtpHost: data.smtpHost.trim(),
      smtpPort: port,
      smtpUser: data.smtpUser.trim().toLowerCase(),
      smtpPassEncrypted: encrypt(data.smtpPass),
      smtpFromName: data.smtpFromName ? sanitizeFromName(data.smtpFromName) : null,
      smtpVerifiedAt: null,
    },
  });

  revalidatePath("/settings");
}

export async function testSmtpConnection(): Promise<{ success: boolean; error?: string }> {
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
    return { success: false, error: "SMTP credentials not configured" };
  }

  try {
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
          <p>Your outreach emails from AMZ OS will be sent from
          <strong>${dbUser.smtpUser}</strong>.</p>
          <p style="color:#64748B;font-size:13px">
            This test was sent at ${new Date().toLocaleString()}.
          </p>
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
    return {
      success: false,
      error: err instanceof Error ? err.message : "Connection failed",
    };
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
