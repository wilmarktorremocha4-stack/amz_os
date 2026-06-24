"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { sendEmail } from "@/lib/email";
import { renderEmailHtml, injectTracking, EmailDoc } from "@/lib/email-builder";
import { resolveMergeVarsForSupplier } from "@/lib/merge-variables";
import { getUserSmtpConfig } from "@/lib/get-user-smtp";

const BASE_URL = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://amz-os.vercel.app";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export async function createCampaign(formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const bodyJsonStr = String(formData.get("bodyJson") ?? "{}");
  if (!name || !subject) return;

  let bodyJson: EmailDoc;
  try { bodyJson = JSON.parse(bodyJsonStr); } catch { bodyJson = { sections: [], globalBackgroundColor: "#f0f4fa", contentWidth: 600 }; }

  await prisma.emailCampaign.create({
    data: { userId: user.id, name, subject, bodyJson: bodyJson as never, bodyHtml: renderEmailHtml(bodyJson) },
  });
  revalidatePath("/email/campaigns");
}

export async function updateCampaign(campaignId: string, data: { name?: string; subject?: string; bodyJson?: EmailDoc }) {
  const user = await getCurrentUser();
  await prisma.emailCampaign.update({
    where: { id: campaignId, userId: user.id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.subject !== undefined && { subject: data.subject }),
      ...(data.bodyJson !== undefined && {
        bodyJson: data.bodyJson as never,
        bodyHtml: renderEmailHtml(data.bodyJson),
      }),
    },
  });
  revalidatePath("/email/campaigns");
}

export async function deleteCampaign(campaignId: string) {
  const user = await getCurrentUser();
  await prisma.emailCampaign.delete({ where: { id: campaignId, userId: user.id } });
  revalidatePath("/email/campaigns");
}

export async function sendCampaign(campaignId: string, supplierIds: string[]): Promise<{ sentViaSystem: boolean; error?: string }> {
  const user = await getCurrentUser();
  const userSmtpConfig = await getUserSmtpConfig(user.id);

  if (!userSmtpConfig) {
    return { sentViaSystem: false, error: "NO_SMTP_CONNECTED" };
  }

  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId, userId: user.id },
  });
  if (!campaign) return { sentViaSystem: false };

  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: supplierIds }, userId: user.id, archived: false },
  });

  const emailsWithSuppliers = suppliers.filter((s) => s.email);

  // Create recipients
  const recipients = await prisma.$transaction(
    emailsWithSuppliers.map((s) =>
      prisma.emailRecipient.create({
        data: {
          campaignId,
          supplierId: s.id,
          email: s.email!,
          status: "queued",
        },
      })
    )
  );

  // Send emails
  for (let i = 0; i < emailsWithSuppliers.length; i++) {
    const s = emailsWithSuppliers[i];
    const recipient = recipients[i];

    const vars = await resolveMergeVarsForSupplier(s.id, {
      name: campaign.fromName ?? user.name ?? user.email,
      email: campaign.fromEmail ?? user.email,
    });
    vars.unsubscribeUrl = `${BASE_URL}/api/track/unsubscribe/${recipient.token}`;

    const baseHtml = (campaign as { bodyHtml?: string | null }).bodyHtml ?? renderEmailHtml(campaign.bodyJson as unknown as EmailDoc, vars);
    const resolvedHtml = baseHtml.replace(/\{\{(\w+)\}\}/g, (_, k) => escapeHtml(vars[k] ?? `{{${k}}}`));
    const tracked = injectTracking(resolvedHtml, recipient.token, BASE_URL);

    try {
      await sendEmail({
        to: s.email!,
        subject: campaign.subject,
        html: tracked,
        userSmtpConfig,
        requireSmtp: true,
      });
      await prisma.emailRecipient.update({
        where: { id: recipient.id },
        data: { status: "sent", sentAt: new Date() },
      });
    } catch (err) {
      console.error("Send failed for", s.email, err);
      await prisma.emailRecipient.update({ where: { id: recipient.id }, data: { status: "failed" } }).catch(() => {});
    }
  }

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "sent", sentAt: new Date() },
  });

  revalidatePath("/email/campaigns");
  revalidatePath("/email/analytics");
  return { sentViaSystem: false };
}
