"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { sendEmail } from "@/lib/email";

export async function addContactNote(supplierId: string, content: string) {
  await prisma.contactNote.create({
    data: { supplierId, type: "note", content },
  });
  revalidatePath(`/crm/${supplierId}`);
}

export async function sendContactEmail(supplierId: string, to: string, subject: string, body: string) {
  const user = await getCurrentUser();
  await sendEmail({ to, subject, html: body.replace(/\n/g, "<br>") });
  await prisma.contactNote.create({
    data: { supplierId, type: "email_sent", content: body, subject },
  });
  revalidatePath(`/crm/${supplierId}`);
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
