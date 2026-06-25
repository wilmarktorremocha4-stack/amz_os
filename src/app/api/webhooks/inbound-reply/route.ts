import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseReplyToken } from "@/lib/reply-token";
import crypto from "crypto";

// Parse "Name <email@domain.com>" or plain "email@domain.com"
function parseEmailAddress(raw: string): { email: string; name: string } {
  const match = raw.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2].toLowerCase() };
  return { name: raw.toLowerCase(), email: raw.toLowerCase() };
}

// Resend inbound webhook payload shape:
// { type: "email.received", created_at: "...", data: { from, to: string[], subject, message_id, ... } }
export async function POST(req: Request) {
  let payload: { type?: string; data?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.type !== "email.received") {
    return NextResponse.json({ ok: true, skipped: "not email.received" });
  }

  const data = payload.data ?? {};
  const toList = (data.to as string[] | undefined) ?? [];
  const fromRaw = (data.from as string | undefined) ?? "";
  const subject = (data.subject as string | undefined) ?? "(no subject)";
  const messageId = (data.message_id as string | undefined) ?? crypto.randomBytes(8).toString("hex");

  const { email: fromEmail, name: fromName } = parseEmailAddress(fromRaw);

  // Find the reply+ token in the To list
  let token: string | null = null;
  for (const addr of toList) {
    const match = addr.match(/^reply\+([A-Za-z0-9_-]+)@/);
    if (match) { token = match[1]; break; }
  }

  if (!token) {
    return NextResponse.json({ ok: true, skipped: "no reply token in To" });
  }

  const parsed = parseReplyToken(token);
  if (!parsed) {
    return NextResponse.json({ ok: true, skipped: "invalid token" });
  }

  const { userId, supplierId } = parsed;

  // Dedup by messageId
  const hash = crypto.createHash("sha1").update(`${userId}:${messageId}`).digest("hex");
  const exists = await prisma.importedEmail.findUnique({ where: { hash } });
  if (exists) {
    return NextResponse.json({ ok: true, skipped: "duplicate" });
  }

  // Verify supplier belongs to user
  const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, userId } });

  if (supplier) {
    await prisma.contactNote.create({
      data: {
        supplierId,
        type: "email_received",
        subject,
        content: `From: ${fromName} <${fromEmail}>`,
      },
    });
  }

  await prisma.importedEmail.create({
    data: { hash, userId, fromEmail, subject, supplierId: supplier?.id ?? null },
  });

  return NextResponse.json({ ok: true });
}
