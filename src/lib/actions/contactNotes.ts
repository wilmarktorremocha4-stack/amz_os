"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { sendEmail } from "@/lib/email";
import { getUserSmtpConfig } from "@/lib/get-user-smtp";

export async function addContactNote(supplierId: string, content: string) {
  await prisma.contactNote.create({
    data: { supplierId, type: "note", content },
  });
  revalidatePath(`/crm/${supplierId}`);
}

function substituteVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`);
}

export async function sendContactEmail(
  supplierId: string,
  to: string,
  subject: string,
  body: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  const userSmtpConfig = await getUserSmtpConfig(user.id);

  if (!userSmtpConfig) {
    return {
      success: false,
      error: "NO_SMTP_CONNECTED",
    };
  }

  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { companyName: true, contactName: true, email: true, phone: true, website: true },
  });
  const nameParts = (supplier?.contactName ?? "").trim().split(/\s+/);
  const vars: Record<string, string> = {
    first_name: nameParts[0] ?? "",
    last_name: nameParts.slice(1).join(" "),
    full_name: supplier?.contactName ?? "",
    company_name: supplier?.companyName ?? "",
    email: supplier?.email ?? to,
    phone: supplier?.phone ?? "",
    website: supplier?.website ?? "",
  };
  const finalSubject = substituteVars(subject, vars);
  const finalBody = substituteVars(body, vars);

  try {
    await sendEmail({ to, subject: finalSubject, html: finalBody.replace(/\n/g, "<br>"), userSmtpConfig, requireSmtp: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Send failed";
    return { success: false, error: msg };
  }

  await prisma.contactNote.create({
    data: { supplierId, type: "email_sent", content: finalBody, subject: finalSubject },
  });
  revalidatePath(`/crm/${supplierId}`);
  return { success: true };
}

export async function createEmailTemplate(formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!name || !subject || !body) return;
  await prisma.emailTemplate.create({ data: { userId: user.id, name, subject, body } });
  revalidatePath("/crm");
}

export async function deleteEmailTemplate(id: string) {
  const user = await getCurrentUser();
  await prisma.emailTemplate.delete({ where: { id, userId: user.id } });
  revalidatePath("/crm");
}
