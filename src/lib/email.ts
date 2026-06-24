import { Resend } from "resend";
import nodemailer from "nodemailer";
import { decrypt } from "@/lib/crypto";

// ─── RESEND (system emails — OTP, auth, notifications) ───────────────────────

export async function sendSystemEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — system email skipped");
    return;
  }
  const resend = new Resend(apiKey);
  const fromName = process.env.EMAIL_FROM_NAME ?? "OperationAMZ";
  const fromAddress = process.env.EMAIL_FROM;

  if (!fromAddress) {
    console.error("EMAIL_FROM env var is not set — email not sent");
    return;
  }

  const from = `"${fromName}" <${fromAddress}>`;
  const { data, error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    console.error("Resend send error:", error);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
  void data;
}

// ─── USER SMTP (outreach emails — campaigns, sequences, manual sends) ─────────

export interface UserSmtpConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassEncrypted: string;
  smtpFromName: string | null;
}

export async function sendEmailViaUserSmtp({
  smtpConfig,
  to,
  subject,
  html,
}: {
  smtpConfig: UserSmtpConfig;
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const password = decrypt(smtpConfig.smtpPassEncrypted);

  const transporter = nodemailer.createTransport({
    host: smtpConfig.smtpHost,
    port: smtpConfig.smtpPort,
    secure: smtpConfig.smtpPort === 465,
    auth: {
      user: smtpConfig.smtpUser,
      pass: password,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  const fromAddress = smtpConfig.smtpFromName
    ? `"${smtpConfig.smtpFromName}" <${smtpConfig.smtpUser}>`
    : smtpConfig.smtpUser;

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    html,
  });
}

// ─── UNIFIED SEND ─────────────────────────────────────────────────────────────
// Campaigns/sequences pass userSmtpConfig when available; falls back to Resend.

export async function sendEmail({
  to,
  subject,
  html,
  from,
  userSmtpConfig,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  userSmtpConfig?: UserSmtpConfig | null;
}): Promise<void> {
  if (userSmtpConfig) {
    await sendEmailViaUserSmtp({ smtpConfig: userSmtpConfig, to, subject, html });
  } else {
    await sendSystemEmail({ to, subject, html });
  }
}
