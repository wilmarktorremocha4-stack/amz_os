"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function createSupplier(formData: FormData) {
  const companyName = String(formData.get("companyName") ?? "").trim();
  if (!companyName) return;

  try {
    const user = await getCurrentUser();

    await prisma.supplier.create({
      data: {
        userId: user.id,
        companyName,
        contactName: emptyToNull(formData.get("contactName")),
        email: emptyToNull(formData.get("email")),
        phone: emptyToNull(formData.get("phone")),
        website: emptyToNull(formData.get("website")),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        type: "SUPPLIER_CONTACTED",
        metadata: { companyName },
      },
    });
  } catch (err) {
    console.error("createSupplier failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    redirect(`/crm?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/crm");
  revalidatePath("/progress");
}

export async function updateSupplierStage(supplierId: string, stage: string) {
  const user = await getCurrentUser();
  await prisma.supplier.update({
    where: { id: supplierId, userId: user.id },
    data: { stage: stage as never },
  });
  revalidatePath("/crm");
  revalidatePath("/progress");
}

export async function deleteSupplier(supplierId: string) {
  const user = await getCurrentUser();
  await prisma.supplier.delete({ where: { id: supplierId, userId: user.id } });
  revalidatePath("/crm");
}

function emptyToNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str === "" ? null : str;
}
