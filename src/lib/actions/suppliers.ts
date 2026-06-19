"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { sendEmail } from "@/lib/email";
import { fireTrigger } from "@/lib/workflow-engine";
import { TRIGGER_TYPES } from "@/lib/workflow-types";

export async function createSupplier(formData: FormData) {
  const companyName = String(formData.get("companyName") ?? "").trim();
  if (!companyName) return;

  try {
    const user = await getCurrentUser();

    const created = await prisma.supplier.create({
      data: {
        userId: user.id,
        companyName,
        contactName: emptyToNull(formData.get("contactName")),
        email: emptyToNull(formData.get("email")),
        phone: emptyToNull(formData.get("phone")),
        website: emptyToNull(formData.get("website")),
      },
    });

    try { await fireTrigger(user.id, TRIGGER_TYPES.CONTACT_CREATED, created.id, { companyName: created.companyName }); } catch {}

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

export async function archiveSupplier(supplierId: string) {
  const user = await getCurrentUser();
  await prisma.supplier.update({
    where: { id: supplierId, userId: user.id },
    data: { archived: true },
  });
  revalidatePath("/crm");
  revalidatePath("/archive");
}

export async function restoreSupplier(supplierId: string) {
  const user = await getCurrentUser();
  await prisma.supplier.update({
    where: { id: supplierId, userId: user.id },
    data: { archived: false },
  });
  revalidatePath("/crm");
  revalidatePath("/archive");
}

export async function deleteSupplierPermanently(supplierId: string) {
  const user = await getCurrentUser();
  await prisma.supplier.delete({ where: { id: supplierId, userId: user.id } });
  revalidatePath("/archive");
}

export async function emailFollowUpDigest() {
  const user = await getCurrentUser();
  const openSuppliers = await prisma.supplier.findMany({
    where: {
      userId: user.id,
      stage: { in: ["CONTACTED", "FOLLOWED_UP", "NEGOTIATING"] },
    },
    orderBy: { updatedAt: "asc" },
  });

  if (openSuppliers.length === 0 || !user.email) {
    redirect(
      `/crm?digestSent=${openSuppliers.length === 0 ? "empty" : "0"}`,
    );
  }

  const rows = openSuppliers
    .map(
      (s) =>
        `<li><strong>${s.companyName}</strong> — ${s.stage.replaceAll("_", " ")}${
          s.contactName ? ` (contact: ${s.contactName})` : ""
        }</li>`,
    )
    .join("");

  await sendEmail({
    to: user.email,
    subject: `AMZ OS: ${openSuppliers.length} supplier${openSuppliers.length === 1 ? "" : "s"} need follow-up`,
    html: `<p>These suppliers are still open in your pipeline:</p><ul>${rows}</ul>`,
  });

  redirect(`/crm?digestSent=${openSuppliers.length}`);
}

export async function bulkDeleteSuppliers(ids: string[]) {
  if (!ids.length) return;
  const user = await getCurrentUser();
  // Archive instead of permanent delete — user can restore from /archive
  await prisma.supplier.updateMany({
    where: { id: { in: ids }, userId: user.id },
    data: { archived: true },
  });
  revalidatePath("/crm");
  revalidatePath("/archive");
}

export async function updateContactDetails(
  supplierId: string,
  data: { companyName?: string; contactName?: string; email?: string; phone?: string; website?: string }
) {
  const user = await getCurrentUser();
  await prisma.supplier.update({
    where: { id: supplierId, userId: user.id },
    data: {
      companyName: data.companyName || undefined,
      contactName: data.contactName || null,
      email: data.email || null,
      phone: data.phone || null,
      website: data.website || null,
    },
  });
  revalidatePath(`/crm/${supplierId}`);
  revalidatePath("/crm");
}

export async function bulkAddTag(supplierIds: string[], tagId: string) {
  if (!supplierIds.length) return;
  const user = await getCurrentUser();
  const data = supplierIds.map((supplierId) => ({ supplierId, tagId }));
  await prisma.$transaction(
    data.map((d) =>
      prisma.contactTag.upsert({
        where: { supplierId_tagId: d },
        create: d,
        update: {},
      }),
    ),
  );
  revalidatePath("/crm");
}

export async function bulkRemoveTag(supplierIds: string[], tagId: string) {
  if (!supplierIds.length) return;
  const user = await getCurrentUser();
  await prisma.contactTag.deleteMany({ where: { supplierId: { in: supplierIds }, tagId } });
  revalidatePath("/crm");
}

function emptyToNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str === "" ? null : str;
}
