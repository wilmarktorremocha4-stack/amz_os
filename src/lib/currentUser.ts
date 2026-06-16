import { prisma } from "@/lib/prisma";

/**
 * No auth system exists yet. Every page resolves to this single
 * placeholder account so CRUD features are usable end-to-end now.
 * Swap this out once real login (NextAuth or Skool SSO) is wired in.
 */
const DEFAULT_USER_EMAIL = "owner@amzos.local";

export async function getCurrentUser() {
  return prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: {},
    create: { email: DEFAULT_USER_EMAIL, name: "AMZ OS Owner" },
  });
}
