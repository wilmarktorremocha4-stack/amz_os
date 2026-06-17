"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { signIn, signOut } from "@/auth";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();

  if (!email || password.length < 8) {
    redirect(
      `/signup?error=${encodeURIComponent("Email and an 8+ character password are required.")}`,
    );
  }

  // Email whitelist — check AllowedEmail table; if the table has any rows,
  // only listed emails may register (empty table = open access for setup)
  const allowedCount = await prisma.allowedEmail.count();
  if (allowedCount > 0) {
    const approved = await prisma.allowedEmail.findUnique({
      where: { email },
    });
    if (!approved) {
      redirect(
        `/signup?error=${encodeURIComponent("This email hasn't been approved for access. Contact the admin.")}`,
      );
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect(
      `/signup?error=${encodeURIComponent("An account with that email already exists.")}`,
    );
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      password: hashed,
      name: name || null,
      firstName: firstName || null,
      lastName: lastName || null,
    },
  });

  await sendEmail({
    to: email,
    subject: "Welcome to AMZ OS",
    html: `<p>Your AMZ OS account is ready. Log in to start tracking suppliers, brand research, and revenue.</p>`,
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (err) {
    // signIn throws a NEXT_REDIRECT — let it propagate; catch only real errors
    if (isRedirectError(err)) throw err;
    redirect(
      `/login?success=${encodeURIComponent("Account created! Log in to continue.")}`,
    );
  }
}

export async function logOut() {
  await signOut({ redirectTo: "/login" });
}
