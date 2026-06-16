import { Resend } from "resend";

/**
 * Email is best-effort: if RESEND_API_KEY isn't configured, callers should
 * still succeed (signup/reminders shouldn't fail because email is unset up).
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || "AMZ OS <onboarding@resend.dev>";
  await resend.emails.send({ from, to, subject, html });
}
