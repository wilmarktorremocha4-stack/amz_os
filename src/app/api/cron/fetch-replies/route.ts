import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchRecentReplies } from "@/lib/imap";
import crypto from "crypto";

// Called by Vercel Cron every 15 minutes (see vercel.json)
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Get all users with verified SMTP (we reuse SMTP creds for IMAP)
  const users = await prisma.user.findMany({
    where: {
      smtpHost: { not: null },
      smtpUser: { not: null },
      smtpPassEncrypted: { not: null },
      smtpVerifiedAt: { not: null },
    },
    select: {
      id: true,
      smtpHost: true,
      smtpUser: true,
      smtpPassEncrypted: true,
    },
  });

  let totalImported = 0;

  for (const user of users) {
    try {
      const messages = await fetchRecentReplies({
        smtpHost: user.smtpHost!,
        smtpUser: user.smtpUser!,
        smtpPassEncrypted: user.smtpPassEncrypted!,
      });

      for (const msg of messages) {
        // Skip emails sent BY the user (outbox) — only import replies
        if (msg.fromEmail.toLowerCase() === user.smtpUser!.toLowerCase()) continue;

        // Dedup — skip if already imported
        const msgHash = crypto.createHash("sha1").update(`${user.id}:${msg.messageId}`).digest("hex");
        const exists = await prisma.importedEmail.findUnique({ where: { hash: msgHash } });
        if (exists) continue;

        // Try to match sender to a contact (supplier)
        const supplier = await prisma.supplier.findFirst({
          where: {
            userId: user.id,
            email: { equals: msg.fromEmail, mode: "insensitive" },
          },
        });

        if (supplier) {
          // Log as a received email note on the contact
          await prisma.contactNote.create({
            data: {
              supplierId: supplier.id,
              type: "email_received",
              subject: msg.subject,
              content: msg.text || msg.html,
            },
          });
          totalImported++;
        }

        // Mark as imported regardless — prevents re-processing even for unknown senders
        await prisma.importedEmail.create({
          data: {
            hash: msgHash,
            userId: user.id,
            fromEmail: msg.fromEmail,
            subject: msg.subject,
            supplierId: supplier?.id ?? null,
          },
        });
      }
    } catch (err) {
      console.error(`[fetch-replies] IMAP error for user ${user.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, imported: totalImported });
}
