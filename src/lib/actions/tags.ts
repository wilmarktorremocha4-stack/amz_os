"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function createTag(formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#3b82f6");
  if (!name) return;

  await prisma.tag.create({ data: { userId: user.id, name, color } });
  revalidatePath("/crm");
}

export async function deleteTag(tagId: string) {
  const user = await getCurrentUser();
  await prisma.tag.delete({ where: { id: tagId, userId: user.id } });
  revalidatePath("/crm");
}

export async function addTagToContact(supplierId: string, tagId: string) {
  await prisma.contactTag.upsert({
    where: { supplierId_tagId: { supplierId, tagId } },
    create: { supplierId, tagId },
    update: {},
  });
  revalidatePath("/crm");
}

export async function removeTagFromContact(supplierId: string, tagId: string) {
  await prisma.contactTag.delete({
    where: { supplierId_tagId: { supplierId, tagId } },
  });
  revalidatePath("/crm");
}
