"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { encrypt } from "@/lib/crypto";
import { sendEmailViaUserSmtp } from "@/lib/email";

export async function saveSmtpSettings(data: {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFromName: string;
}) {
  const user = await getCurrentUser();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort,
      smtpUser: data.smtpUser,
      smtpPassEncrypted: encrypt(data.smtpPass),
      smtpFromName: data.smtpFromName || null,
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
