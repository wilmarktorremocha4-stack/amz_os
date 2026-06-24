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
      subject: "AMZ OS — Reset your password",
      html: `
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
                    Enter this code on the password reset page.
                    It expires in <strong>15 minutes</strong>.
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
                    Your password will not be changed.
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
        </html>
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
