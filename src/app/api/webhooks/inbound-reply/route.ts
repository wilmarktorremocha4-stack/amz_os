import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseReplyToken } from "@/lib/reply-token";
import crypto from "crypto";

// Resend inbound webhook — fires when a brand replies to reply+{token}@<domain>
export async function POST(req: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Extract "To" address from Resend inbound payload
  // Resend sends: { to: [{email, name}], from: {email, name}, subject, text, html, ... }
  const toList = (payload.to as { email: string }[] | undefined) ?? [];
  const fromObj = payload.from as { email?: string; name?: string } | undefined;
  const subject = (payload.subject as string | undefined) ?? "(no subject)";
  const fromEmail = (fromObj?.email ?? "").toLowerCase();
  const fromName = fromObj?.name ?? fromEmail;
  const messageId = (payload.message_id as string | undefined) ?? crypto.randomBytes(8).toString("hex");

  // Find the reply+ token in the To list
  let token: string | null = null;
  for (const addr of toList) {
    const match = addr.email.match(/^reply\+([A-Za-z0-9_-]+)@/);
    if (match) { token = match[1]; break; }
  }

  if (!token) {
    return NextResponse.json({ ok: true, skipped: "no reply token" });
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
        content: `From: ${fromName} <${fromEmail}>\n\n${(payload.text as string | undefined) ?? "(view in your inbox for full message)"}`,
      },
    });
  }

  await prisma.importedEmail.create({
    data: { hash, userId, fromEmail, subject, supplierId: supplier?.id ?? null },
  });

  return NextResponse.json({ ok: true });
}
