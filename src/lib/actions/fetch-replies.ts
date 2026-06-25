"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { fetchRecentReplies } from "@/lib/imap";
import { getCurrentUser } from "@/lib/currentUser";
import { revalidatePath } from "next/cache";

export async function processRepliesForUser(userId: string): Promise<{ imported: number; error?: string }> {
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
    return { imported: 0, error: "NO_SMTP_CONNECTED" };
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
    return { imported: 0, error: msg };
  }

  let imported = 0;

  for (const msg of messages) {
    // Skip emails sent BY the user (their own sent mail is in INBOX sometimes)
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
      await prisma.contactNote.create({
        data: {
          supplierId: supplier.id,
          type: "email_received",
          subject: msg.subject,
          content: `From: ${msg.fromName}\n\n(Reply received — view full message in your email inbox)`,
        },
      });
      imported++;
    }

    // Always record so we don't reprocess
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

  return { imported };
}

// Server action — called from Settings "Check inbox" button
export async function manualCheckInbox(): Promise<{ imported: number; error?: string }> {
  const user = await getCurrentUser();
  const result = await processRepliesForUser(user.id);
  if (result.imported > 0) revalidatePath("/crm/[id]", "page");
  return result;
}
