"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function createProduct(formData: FormData) {
  const user = await getCurrentUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  await prisma.product.create({
    data: {
      userId: user.id,
      title,
      asin: emptyToNull(formData.get("asin")),
      cost: toDecimalOrNull(formData.get("cost")),
      estimatedSell: toDecimalOrNull(formData.get("estimatedSell")),
      monthlyUnits: toIntOrNull(formData.get("monthlyUnits")),
    },
  });

  await prisma.activityLog.create({
    data: { userId: user.id, type: "PRODUCT_ANALYZED", metadata: { title } },
  });

  revalidatePath("/research");
  revalidatePath("/progress");
}

export async function setProductLaunched(productId: string, launched: boolean) {
  const user = await getCurrentUser();
  await prisma.product.update({
    where: { id: productId, userId: user.id },
    data: { launched },
  });

  if (launched) {
    await prisma.activityLog.create({
      data: { userId: user.id, type: "PRODUCT_LAUNCHED", metadata: { productId } },
    });
  }

  revalidatePath("/research");
  revalidatePath("/progress");
}

export async function deleteProduct(productId: string) {
  const user = await getCurrentUser();
  await prisma.product.delete({ where: { id: productId, userId: user.id } });
  revalidatePath("/research");
}

function emptyToNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str === "" ? null : str;
}

function toIntOrNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  if (str === "") return null;
  const n = parseInt(str, 10);
  return Number.isNaN(n) ? null : n;
}

function toDecimalOrNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  if (str === "") return null;
  const n = parseFloat(str);
  return Number.isNaN(n) ? null : n;
}
