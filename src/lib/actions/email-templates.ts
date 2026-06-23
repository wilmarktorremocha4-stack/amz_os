"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { EmailDoc, renderEmailHtml, DEFAULT_DOC } from "@/lib/email-builder";

export async function createEmailTemplate(data: { name: string; subject: string; category?: string }) {
  const user = await getCurrentUser();
  const tpl = await prisma.emailTemplate.create({
    data: {
      userId: user.id, name: data.name, subject: data.subject,
      category: data.category ?? null,
      bodyJson: DEFAULT_DOC as never,
      bodyHtml: renderEmailHtml(DEFAULT_DOC),
    },
  });
  revalidatePath("/email/templates");
  return tpl;
}

export async function updateEmailTemplate(id: string, data: { name?: string; subject?: string; category?: string; bodyJson?: EmailDoc }) {
  const user = await getCurrentUser();
  const bodyHtml = data.bodyJson ? renderEmailHtml(data.bodyJson) : undefined;
  await prisma.emailTemplate.update({
    where: { id, userId: user.id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.subject !== undefined && { subject: data.subject }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.bodyJson !== undefined && { bodyJson: data.bodyJson as never }),
      ...(bodyHtml !== undefined && { bodyHtml }),
    },
  });
  revalidatePath("/email/templates");
  revalidatePath(`/email/templates/${id}`);
}

export async function deleteEmailTemplate(id: string) {
  const user = await getCurrentUser();
  await prisma.emailTemplate.delete({ where: { id, userId: user.id } });
  revalidatePath("/email/templates");
}

export async function duplicateEmailTemplate(id: string) {
  const user = await getCurrentUser();
  const original = await prisma.emailTemplate.findUnique({ where: { id, userId: user.id } });
  if (!original) return;
  await prisma.emailTemplate.create({
    data: {
      userId: user.id,
      name: `${original.name} (Copy)`,
      subject: original.subject,
      category: original.category,
      bodyJson: original.bodyJson as never,
      bodyHtml: original.bodyHtml ?? "",
    },
  });
  revalidatePath("/email/templates");
}
