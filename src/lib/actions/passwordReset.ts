"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendSystemEmail as sendEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

function generateOTP() {
  return String(randomInt(100000, 1000000));
}

const RESET_EMAIL_HTML = (otp: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F0F4FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <tr><td style="height:6px;background:linear-gradient(90deg,#0369A1,#0E90C8)"></td></tr>
        <tr><td style="padding:40px 40px 0">
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.1em;color:#94A3B8;text-transform:uppercase">AMZ OS</p>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0F172A">Reset your password</h1>
          <p style="margin:0 0 32px;font-size:15px;color:#64748B;line-height:1.6">
            Enter this 6-digit code to verify your identity. It expires in <strong>15 minutes</strong>.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:0 40px">
          <div style="background:#F8FAFC;border:2px dashed #CBD5E1;border-radius:12px;padding:24px 40px;display:inline-block">
            <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#0F172A;font-family:'Courier New',monospace">${otp}</span>
          </div>
        </td></tr>
        <tr><td style="padding:32px 40px">
          <p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
        </td></tr>
        <tr><td style="padding:0 40px 32px;border-top:1px solid #F1F5F9">
          <p style="margin:16px 0 0;font-size:12px;color:#CBD5E1;text-align:center">
            Sent from noreply@operationamz.net &middot; AMZ OS
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

// Step 1 — send reset code
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/forgot-password?error=Email+required");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/forgot-password?sent=1"); // don't reveal if email exists

  // Rate limit: 1 request per 60 s
  const recent = await prisma.passwordResetToken.findFirst({
    where: { email, used: false, createdAt: { gt: new Date(Date.now() - 60_000) } },
    select: { id: true },
  });
  if (recent) redirect(`/verify-reset?email=${encodeURIComponent(email)}`);

  // Invalidate old tokens
  await prisma.passwordResetToken.updateMany({
    where: { email, used: false },
    data: { used: true },
  });

  const otp = generateOTP();
  const hashed = await bcrypt.hash(otp, 8);
  await prisma.passwordResetToken.create({
    data: { email, otp: hashed, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
  });

  if (!process.env.RESEND_API_KEY) {
    redirect("/forgot-password?error=Email+service+not+configured.+Contact+your+administrator.");
  }

  try {
    await sendEmail({
      to: email,
      subject: "AMZ OS — Reset your password",
      html: RESET_EMAIL_HTML(otp),
    });
  } catch (err) {
    console.error("[passwordReset] send failed:", err);
    redirect(`/forgot-password?error=${encodeURIComponent("Email delivery failed. Please try again.")}`);
  }

  redirect(`/verify-reset?email=${encodeURIComponent(email)}`);
}

// Step 2 — verify OTP only, redirect to password page with token ID
export async function verifyResetOTP(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const otp = String(formData.get("otp") ?? "").trim().replace(/\s/g, "");
  const base = `/verify-reset?email=${encodeURIComponent(email)}`;

  let token;
  try {
    const tokens = await prisma.passwordResetToken.findMany({
      where: { email, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    token = tokens[0];
  } catch {
    redirect(`${base}&error=${encodeURIComponent("Database error. Please request a new code.")}`);
  }

  if (!token) redirect(`${base}&error=${encodeURIComponent("Code expired or not found. Request a new one.")}`);

  if ((token.attempts ?? 0) >= 5) {
    await prisma.passwordResetToken.update({ where: { id: token.id }, data: { used: true } }).catch(() => {});
    redirect(`/forgot-password?error=${encodeURIComponent("Too many incorrect attempts. Please request a new code.")}`);
  }

  const valid = await bcrypt.compare(otp, token.otp);
  if (!valid) {
    await prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    }).catch(() => {});
    redirect(`${base}&error=${encodeURIComponent("Incorrect code. Please try again.")}`);
  }

  // OTP correct — pass token ID to the password page (not the OTP itself)
  redirect(`/reset-password?email=${encodeURIComponent(email)}&t=${token.id}`);
}

// Step 3 — set new password (uses token ID from URL, not OTP)
export async function setNewPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const tokenId = String(formData.get("tokenId") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  const base = `/reset-password?email=${encodeURIComponent(email)}&t=${encodeURIComponent(tokenId)}`;

  if (password.length < 8) redirect(`${base}&error=Password+must+be+at+least+8+characters`);
  if (password !== confirm) redirect(`${base}&error=Passwords+do+not+match`);

  // Look up by token ID — fast, unambiguous, no email/expiry race
  const token = await prisma.passwordResetToken.findUnique({ where: { id: tokenId } }).catch(() => null);

  if (!token || token.email !== email || token.used || token.expiresAt < new Date()) {
    redirect(`/forgot-password?error=${encodeURIComponent("Reset session expired. Please request a new code.")}`);
  }

  // Find user by ID from token email — case-insensitive so casing differences don't silently miss the update
  const user = await prisma.user.findFirst({
    where: { email: { equals: token.email, mode: "insensitive" } },
  });
  if (!user) {
    redirect(`/forgot-password?error=${encodeURIComponent("Account not found. Please contact the admin.")}`);
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
    prisma.passwordResetToken.update({ where: { id: tokenId }, data: { used: true } }),
  ]);

  redirect("/login?success=Password+reset+successfully.+Please+log+in.");
}
