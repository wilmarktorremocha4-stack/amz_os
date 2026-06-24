import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        if (!user.emailVerified) {
          // Check if there is an active (unused, unexpired) verification token —
          // that means this is a genuinely new unverified account.
          // Legacy accounts (created before email verification was added) have
          // emailVerified = null but no pending token; let them through.
          const pendingToken = await prisma.emailVerificationToken.findFirst({
            where: { email, used: false, expiresAt: { gt: new Date() } },
          });
          if (pendingToken) {
            throw new Error("EMAIL_NOT_VERIFIED:" + user.email);
          }
          // Legacy user — auto-verify so they aren't permanently locked out
          await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
