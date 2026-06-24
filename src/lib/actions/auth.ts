"use server";

import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendSystemEmail } from "@/lib/email";
import { signOut } from "@/auth";

function generateOTP(): string {
  return String(randomInt(100000, 1000000)); // CSPRNG — not Math.random()
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();

  if (!email || password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent("Email and an 8+ character password are required.")}`);
  }

  const approved = await prisma.allowedEmail.findUnique({ where: { email } });
  if (!approved) {
    redirect(`/signup?error=${encodeURIComponent("Your email is not registered in the system. Please contact the admin to register your email before signing up.")}`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.emailVerified) {
    redirect(`/signup?error=${encodeURIComponent("An account with that email already exists.")}`);
  }

  const hashed = await bcrypt.hash(password, 10);

  if (existing && !existing.emailVerified) {
    await prisma.user.update({
      where: { email },
      data: { password: hashed, name: name || null, firstName: firstName || null, lastName: lastName || null },
    });
  } else {
    await prisma.user.create({
      data: { email, password: hashed, name: name || null, firstName: firstName || null, lastName: lastName || null, emailVerified: null },
    });
  }

  await prisma.emailVerificationToken.updateMany({
    where: { email, used: false },
    data: { used: true },
  });

  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 8);

  await prisma.emailVerificationToken.create({
    data: { email, otp: hashedOtp, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
  });

  try {
    await sendSystemEmail({
      to: email,
      subject: "AMZ OS — Verify your email address",
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
                  <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0F172A">Verify your email</h1>
                  <p style="margin:0 0 32px;font-size:15px;color:#64748B;line-height:1.6">
                    Enter this code to activate your AMZ OS account.
                    The code expires in <strong>30 minutes</strong>.
                  </p>
                </td></tr>
                <tr><td align="center" style="padding:0 40px">
                  <div style="background:#F8FAFC;border:2px dashed #CBD5E1;border-radius:12px;padding:24px 40px;display:inline-block">
                    <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#0F172A;font-family:'Courier New',monospace">${otp}</span>
                  </div>
                </td></tr>
                <tr><td style="padding:32px 40px">
                  <p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6">
                    If you didn't create an AMZ OS account, you can safely ignore this email.
                    This code can only be used once.
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
    console.error("[signUp] verification email failed:", err);
    redirect(`/signup?error=${encodeURIComponent("Verification email could not be sent. Please try again or contact support.")}`);
  }

  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

export async function verifySignupOTP(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const otp = String(formData.get("otp") ?? "").trim().replace(/\s/g, "");

  const tokens = await prisma.emailVerificationToken.findMany({
    where: { email, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  if (tokens.length === 0) {
    redirect(`/verify-email?email=${encodeURIComponent(email)}&error=${encodeURIComponent("Code expired or invalid. Request a new one.")}`);
  }

  const token = tokens[0];

  // Lock out after 5 failed attempts — force re-request
  if (token.attempts >= 5) {
    await prisma.emailVerificationToken.update({ where: { id: token.id }, data: { used: true } });
    redirect(`/verify-email?email=${encodeURIComponent(email)}&error=${encodeURIComponent("Too many incorrect attempts. Please request a new code.")}`);
  }

  const valid = await bcrypt.compare(otp, token.otp);
  if (!valid) {
    await prisma.emailVerificationToken.update({ where: { id: token.id }, data: { attempts: { increment: 1 } } });
    redirect(`/verify-email?email=${encodeURIComponent(email)}&error=${encodeURIComponent("Incorrect code. Please try again.")}`);
  }

  await prisma.$transaction([
    prisma.user.update({ where: { email }, data: { emailVerified: new Date() } }),
    prisma.emailVerificationToken.update({ where: { id: token.id }, data: { used: true } }),
  ]);

  // Send welcome email after verification
  try {
    await sendSystemEmail({
      to: email,
      subject: "Welcome to AMZ OS 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#F0F4FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:40px 16px">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
                <tr><td style="height:6px;background:linear-gradient(90deg,#0369A1,#0E90C8)"></td></tr>
                <tr><td style="padding:40px">
                  <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.1em;color:#94A3B8;text-transform:uppercase">AMZ OS</p>
                  <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0F172A">You're in. Welcome! 🎉</h1>
                  <p style="margin:0 0 24px;font-size:15px;color:#64748B;line-height:1.6">
                    Your AMZ OS account is verified and ready. Start tracking suppliers,
                    researching brands, and building your wholesale pipeline.
                  </p>
                  <a href="https://amz-os.vercel.app/login"
                    style="display:inline-block;padding:14px 32px;background:#0E90C8;color:#FFFFFF;font-weight:700;font-size:15px;border-radius:10px;text-decoration:none">
                    Log in to AMZ OS &rarr;
                  </a>
                  <p style="margin:32px 0 0;font-size:12px;color:#94A3B8;font-style:italic">
                    This is an auto-generated email. Please do not reply to this message.
                  </p>
                </td></tr>
                <tr><td style="padding:0 40px 24px;border-top:1px solid #F1F5F9">
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
  } catch {
    // Welcome email failure should not block login
  }

  redirect("/login?success=" + encodeURIComponent("Email verified! You can now log in."));
}

export async function resendVerificationOTP(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  // Always show same response to prevent email enumeration
  if (!user || user.emailVerified) redirect(`/verify-email?email=${encodeURIComponent(email)}&sent=1`);

  const recent = await prisma.emailVerificationToken.findFirst({
    where: { email, used: false, createdAt: { gt: new Date(Date.now() - 60_000) } },
  });
  if (recent) {
    redirect(`/verify-email?email=${encodeURIComponent(email)}&error=${encodeURIComponent("Please wait 60 seconds before requesting a new code.")}`);
  }

  await prisma.emailVerificationToken.updateMany({ where: { email, used: false }, data: { used: true } });

  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 8);

  await prisma.emailVerificationToken.create({
    data: { email, otp: hashedOtp, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
  });

  await sendSystemEmail({
    to: email,
    subject: "AMZ OS — New verification code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:40px">
        <h2 style="color:#0F172A">New verification code</h2>
        <p style="color:#64748B">Your new code is:</p>
        <div style="font-size:42px;font-weight:800;letter-spacing:12px;background:#F8FAFC;border:2px dashed #CBD5E1;border-radius:12px;padding:24px;text-align:center;font-family:monospace;color:#0F172A">${otp}</div>
        <p style="color:#94A3B8;font-size:13px;margin-top:24px">Expires in 30 minutes. If you didn't request this, ignore it.</p>
      </div>
    `,
  });

  redirect(`/verify-email?email=${encodeURIComponent(email)}&sent=1`);
}

export async function logOut() {
  await signOut({ redirectTo: "/login" });
}
