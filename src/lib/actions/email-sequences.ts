"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { sendEmail } from "@/lib/email";
import { getUserSmtpConfig } from "@/lib/get-user-smtp";
import { renderEmailHtml, injectTracking, EmailDoc } from "@/lib/email-builder";

const BASE_URL = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://amz-os.vercel.app";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export async function createSequence(formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) return;

  await prisma.emailSequence.create({
    data: { userId: user.id, name, description: description || null },
  });
  revalidatePath("/email/sequences");
}

export async function deleteSequence(sequenceId: string) {
  const user = await getCurrentUser();
  await prisma.emailSequence.delete({ where: { id: sequenceId, userId: user.id } });
  revalidatePath("/email/sequences");
}

export async function addSequenceStep(sequenceId: string, data: { subject: string; bodyJson: EmailDoc; delayDays: number; order: number }) {
  const user = await getCurrentUser();
  const seq = await prisma.emailSequence.findUnique({ where: { id: sequenceId, userId: user.id } });
  if (!seq) return;

  await prisma.emailSequenceStep.create({
    data: {
      sequenceId, subject: data.subject,
      bodyJson: data.bodyJson as never,
      delayDays: data.delayDays, order: data.order,
    },
  });
  revalidatePath("/email/sequences");
}

export async function deleteSequenceStep(stepId: string) {
  const user = await getCurrentUser();
  const step = await prisma.emailSequenceStep.findFirst({
    where: { id: stepId, sequence: { userId: user.id } },
  });
  if (!step) return;
  await prisma.emailSequenceStep.delete({ where: { id: stepId } });
  revalidatePath("/email/sequences");
}

export async function enrollInSequence(sequenceId: string, supplierIds: string[]) {
  const user = await getCurrentUser();
  const seq = await prisma.emailSequence.findUnique({
    where: { id: sequenceId, userId: user.id },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!seq || seq.steps.length === 0) return;

  const firstStep = seq.steps[0];
  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: supplierIds }, userId: user.id, archived: false },
  });

  for (const s of suppliers) {
    if (!s.email) continue;
    try {
      await prisma.sequenceEnrollment.create({
        data: { sequenceId, supplierId: s.id, currentStep: 0, nextSendAt: new Date() },
      });
    } catch { /* already enrolled */ }
  }

  // Send first step immediately
  await processSequenceStep(sequenceId, 0, user.id);
  revalidatePath("/email/sequences");
}

export async function processSequenceStep(sequenceId: string, stepIndex: number, userId: string) {
  const seq = await prisma.emailSequence.findUnique({
    where: { id: sequenceId, userId },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!seq) return;

  const step = seq.steps[stepIndex];
  if (!step) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const userSmtpConfig = await getUserSmtpConfig(userId);

  // Never fall back to Resend for outreach — skip the whole step if no SMTP
  if (!userSmtpConfig) {
    console.warn(`[sequences] No verified SMTP for user ${userId} — skipping step ${stepIndex}`);
    return;
  }

  const enrollments = await prisma.sequenceEnrollment.findMany({
    where: { sequenceId, currentStep: stepIndex, status: "active" },
    include: { supplier: true },
  });

  for (const enrollment of enrollments) {
    const s = enrollment.supplier;
    if (!s.email) continue;

    const recipient = await prisma.emailRecipient.create({
      data: { stepId: step.id, supplierId: s.id, email: s.email, status: "queued" },
    });

    const vars = {
      firstName: s.contactName?.split(" ")[0] ?? s.companyName,
      companyName: s.companyName,
      senderName: user.name ?? user.email,
      unsubscribeUrl: `${BASE_URL}/api/track/unsubscribe/${recipient.token}`,
    };

    const rawHtml = renderEmailHtml(step.bodyJson as unknown as EmailDoc, vars);
    // Escape merge variable values to prevent XSS injection
    const safeHtml = rawHtml.replace(/\{\{(\w+)\}\}/g, (_, k) => escapeHtml((vars as Record<string, string>)[k] ?? `{{${k}}}`));
    const tracked = injectTracking(safeHtml, recipient.token, BASE_URL);

    try {
      await sendEmail({ to: s.email, subject: step.subject, html: tracked, userSmtpConfig, requireSmtp: true });
      await prisma.emailRecipient.update({ where: { id: recipient.id }, data: { status: "sent", sentAt: new Date() } });

      const nextStep = seq.steps[stepIndex + 1];
      if (nextStep) {
        const nextSend = new Date();
        nextSend.setDate(nextSend.getDate() + nextStep.delayDays);
        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: { currentStep: stepIndex + 1, nextSendAt: nextSend },
        });
      } else {
        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: { status: "completed" },
        });
      }
    } catch (err) {
      console.error("Sequence send failed:", err);
      await prisma.emailRecipient.update({ where: { id: recipient.id }, data: { status: "failed" } }).catch(() => {});
    }
  }
}
