import { prisma } from "@/lib/prisma";
import type { UserSmtpConfig } from "@/lib/email";

export async function getUserSmtpConfig(userId: string): Promise<UserSmtpConfig | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      smtpHost: true,
      smtpPort: true,
      smtpUser: true,
      smtpPassEncrypted: true,
      smtpFromName: true,
      smtpVerifiedAt: true,
    },
  });

  if (
    !user ||
    !user.smtpHost ||
    !user.smtpPort ||
    !user.smtpUser ||
    !user.smtpPassEncrypted ||
    !user.smtpVerifiedAt
  ) {
    return null;
  }

  return {
    smtpHost: user.smtpHost,
    smtpPort: user.smtpPort,
    smtpUser: user.smtpUser,
    smtpPassEncrypted: user.smtpPassEncrypted,
    smtpFromName: user.smtpFromName,
  };
}
