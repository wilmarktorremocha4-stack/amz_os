"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function createBrand(formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.brand.create({
    data: {
      userId: user.id,
      name,
      category: emptyToNull(formData.get("category")),
      estimatedMonthlySales: toDecimalOrNull(formData.get("estimatedMonthlySales")),
      sellerCount: toIntOrNull(formData.get("sellerCount")),
      avgPrice: toDecimalOrNull(formData.get("avgPrice")),
      reviewCount: toIntOrNull(formData.get("reviewCount")),
    },
  });

  revalidatePath("/research/brands");
}

export async function setBrandApproved(brandId: string, approved: boolean) {
  const user = await getCurrentUser();
  await prisma.brand.update({
    where: { id: brandId, userId: user.id },
    data: { approved },
  });

  if (approved) {
    await prisma.activityLog.create({
      data: { userId: user.id, type: "BRAND_APPROVED", metadata: { brandId } },
    });
  }

  revalidatePath("/research/brands");
  revalidatePath("/progress");
}

export async function deleteBrand(brandId: string) {
  const user = await getCurrentUser();
  await prisma.brand.delete({ where: { id: brandId, userId: user.id } });
  revalidatePath("/research/brands");
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
