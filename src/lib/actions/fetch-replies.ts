"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { fetchRecentReplies } from "@/lib/imap";
import { getCurrentUser } from "@/lib/currentUser";
import { revalidatePath } from "next/cache";

export async function processRepliesForUser(
  userId: string,
): Promise<{ imported: number; supplierIds: string[]; error?: string }> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      smtpHost: true,
      smtpUser: true,
      smtpPassEncrypted: true,
      smtpVerifiedAt: true,
    },
  });

  if (!dbUser?.smtpHost || !dbUser.smtpUser || !dbUser.smtpPassEncrypted || !dbUser.smtpVerifiedAt) {
    return { imported: 0, supplierIds: [], error: "NO_SMTP_CONNECTED" };
  }

  let messages;
  try {
    messages = await fetchRecentReplies({
      smtpHost: dbUser.smtpHost,
      smtpUser: dbUser.smtpUser,
      smtpPassEncrypted: dbUser.smtpPassEncrypted,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "IMAP connection failed";
    return { imported: 0, supplierIds: [], error: msg };
  }

  let imported = 0;
  const supplierIds: string[] = [];

  for (const msg of messages) {
    // Skip emails sent BY the user
    if (msg.fromEmail === dbUser.smtpUser.toLowerCase()) continue;

    // Dedup by message-id hash
    const hash = crypto.createHash("sha1").update(`${userId}:${msg.messageId}`).digest("hex");
    const exists = await prisma.importedEmail.findUnique({ where: { hash } });
    if (exists) continue;

    // Match sender to a contact
    const supplier = await prisma.supplier.findFirst({
      where: { userId, email: { equals: msg.fromEmail, mode: "insensitive" } },
    });

    if (supplier) {
      const content = msg.bodyText
        ? msg.bodyText
        : `(Reply received from ${msg.fromName} — view full message in your inbox)`;

      await prisma.contactNote.create({
        data: {
          supplierId: supplier.id,
          type: "email_received",
          subject: msg.subject,
          content,
        },
      });
      imported++;
      if (!supplierIds.includes(supplier.id)) supplierIds.push(supplier.id);
      // Revalidate this specific contact page immediately
      revalidatePath(`/crm/${supplier.id}`);
    }

    await prisma.importedEmail.create({
      data: {
        hash,
        userId,
        fromEmail: msg.fromEmail,
        subject: msg.subject,
        supplierId: supplier?.id ?? null,
      },
    });
  }

  // Revalidate entire CRM layout to catch any list views
  if (imported > 0) revalidatePath("/crm", "layout");

  return { imported, supplierIds };
}

export async function manualCheckInbox(): Promise<{ imported: number; supplierIds: string[]; error?: string }> {
  const user = await getCurrentUser();
  return processRepliesForUser(user.id);
}
