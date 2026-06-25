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
  replyTo,
}: {
  smtpConfig: UserSmtpConfig;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
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
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
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
    ...(replyTo ? { replyTo } : {}),
  });
}

// ─── UNIFIED SEND ─────────────────────────────────────────────────────────────
// Pass requireSmtp:true for outreach emails — throws if user hasn't connected SMTP.
// Omit / pass false for system emails (auth, notifications) that should always send.

export async function sendEmail({
  to,
  subject,
  html,
  userSmtpConfig,
  requireSmtp = false,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  userSmtpConfig?: UserSmtpConfig | null;
  requireSmtp?: boolean;
  replyTo?: string;
}): Promise<void> {
  if (userSmtpConfig) {
    await sendEmailViaUserSmtp({ smtpConfig: userSmtpConfig, to, subject, html, replyTo });
  } else if (requireSmtp) {
    throw new Error("NO_SMTP_CONNECTED");
  } else {
    await sendSystemEmail({ to, subject, html });
  }
}
