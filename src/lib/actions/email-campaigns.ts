"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { sendEmail } from "@/lib/email";
import { renderEmailHtml, injectTracking, EmailDoc } from "@/lib/email-builder";

const BASE_URL = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://amz-os.vercel.app";

export async function createCampaign(formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const bodyJsonStr = String(formData.get("bodyJson") ?? "{}");
  if (!name || !subject) return;

  let bodyJson: EmailDoc;
  try { bodyJson = JSON.parse(bodyJsonStr); } catch { bodyJson = { blocks: [] }; }

  await prisma.emailCampaign.create({
    data: { userId: user.id, name, subject, bodyJson },
  });
  revalidatePath("/email/campaigns");
}

export async function updateCampaign(campaignId: string, data: { name?: string; subject?: string; bodyJson?: EmailDoc }) {
  const user = await getCurrentUser();
  await prisma.emailCampaign.update({
    where: { id: campaignId, userId: user.id },
    data: {
      name: data.name,
      subject: data.subject,
      bodyJson: data.bodyJson ? data.bodyJson : undefined,
    },
  });
  revalidatePath("/email/campaigns");
}

export async function deleteCampaign(campaignId: string) {
  const user = await getCurrentUser();
  await prisma.emailCampaign.delete({ where: { id: campaignId, userId: user.id } });
  revalidatePath("/email/campaigns");
}

export async function sendCampaign(campaignId: string, supplierIds: string[]) {
  const user = await getCurrentUser();
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId, userId: user.id },
  });
  if (!campaign) return;

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
    const vars = {
      firstName: s.contactName?.split(" ")[0] ?? s.companyName,
      companyName: s.companyName,
      senderName: user.name ?? user.email,
      unsubscribeUrl: `${BASE_URL}/api/track/unsubscribe/${recipient.token}`,
    };

    const html = renderEmailHtml(campaign.bodyJson as EmailDoc, vars);
    const tracked = injectTracking(html, recipient.token, BASE_URL);

    try {
      await sendEmail({
        to: s.email!,
        subject: campaign.subject,
        html: tracked,
        from: campaign.fromName && campaign.fromEmail
          ? `${campaign.fromName} <${campaign.fromEmail}>`
          : undefined,
      });
      await prisma.emailRecipient.update({
        where: { id: recipient.id },
        data: { status: "sent", sentAt: new Date() },
      });
    } catch (err) {
      console.error("Send failed for", s.email, err);
    }
  }

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "sent", sentAt: new Date() },
  });

  revalidatePath("/email/campaigns");
  revalidatePath("/email/analytics");
}
