"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendSystemEmail as sendEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/forgot-password?error=Email+required");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal if email exists — show generic success
    redirect("/forgot-password?sent=1");
  }

  // Invalidate old tokens
  await prisma.passwordResetToken.updateMany({
    where: { email, used: false },
    data: { used: true },
  });

  const otp = generateOTP();
  const hashed = await bcrypt.hash(otp, 8);
  await prisma.passwordResetToken.create({
    data: {
      email,
      otp: hashed,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
    },
  });

  if (!process.env.RESEND_API_KEY) {
    redirect("/forgot-password?error=Email+service+not+configured.+Contact+your+administrator.");
  }

  try {
    await sendEmail({
      to: email,
      subject: "AMZ OS — Password Reset Code",
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px">
          <h2 style="margin-bottom:8px">Password Reset</h2>
          <p>Your one-time code is:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;padding:16px;background:#f4f7fc;border-radius:8px;text-align:center">${otp}</div>
          <p style="color:#64748b;font-size:14px;margin-top:16px">This code expires in 15 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send email";
    redirect(`/forgot-password?error=${encodeURIComponent(msg)}`);
  }

  redirect(`/forgot-password?sent=1&email=${encodeURIComponent(email)}`);
}

export async function verifyOTPAndReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const otp = String(formData.get("otp") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  const emailParam = `&email=${encodeURIComponent(email)}`;
  if (password.length < 8) redirect(`/reset-password?error=Password+must+be+at+least+8+characters${emailParam}`);
  if (password !== confirm) redirect(`/reset-password?error=Passwords+do+not+match${emailParam}`);

  const tokens = await prisma.passwordResetToken.findMany({
    where: { email, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  if (tokens.length === 0) redirect(`/reset-password?error=Code+expired+or+invalid.+Request+a+new+one.${emailParam}`);

  const valid = await bcrypt.compare(otp, tokens[0].otp);
  if (!valid) redirect(`/reset-password?error=Incorrect+code.+Try+again.${emailParam}`);

  const hashed = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { email }, data: { password: hashed } }),
    prisma.passwordResetToken.update({ where: { id: tokens[0].id }, data: { used: true } }),
  ]);

  redirect("/login?success=Password+reset+successfully.+Please+log+in.");
}
