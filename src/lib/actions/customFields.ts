"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function createCustomFieldFolder(formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.customFieldFolder.create({ data: { userId: user.id, name } });
  revalidatePath("/settings");
}

export async function deleteCustomFieldFolder(folderId: string) {
  const user = await getCurrentUser();
  await prisma.customFieldFolder.delete({ where: { id: folderId, userId: user.id } });
  revalidatePath("/settings");
}

export async function createCustomField(formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "single_line");
  const folderId = String(formData.get("folderId") ?? "").trim() || null;
  const rawOptions = String(formData.get("options") ?? "").trim();
  const options = rawOptions ? rawOptions.split("\n").map((o) => o.trim()).filter(Boolean) : null;
  if (!name) return;
  await prisma.customField.create({
    data: { userId: user.id, name, type, folderId, options: options ?? undefined },
  });
  revalidatePath("/settings");
}

export async function deleteCustomField(fieldId: string) {
  const user = await getCurrentUser();
  await prisma.customField.delete({ where: { id: fieldId, userId: user.id } });
  revalidatePath("/settings");
}
