import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

function verifyResendSignature(rawBody: string, svixId: string, svixTimestamp: string, svixSignature: string): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return false;

  // Replay attack protection — reject requests older than 5 minutes
  const ts = parseInt(svixTimestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  // Resend signing format: id.timestamp.body
  const toSign = `${svixId}.${svixTimestamp}.${rawBody}`;
  // Secret is base64-encoded without the "whsec_" prefix
  const keyBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", keyBytes).update(toSign).digest("base64");

  const signatures = svixSignature.split(" ");
  for (const sig of signatures) {
    const sigValue = sig.replace(/^v1,/, "");
    try {
      if (timingSafeEqual(Buffer.from(sigValue), Buffer.from(expected))) return true;
    } catch { /* length mismatch */ }
  }
  return false;
}

export async function POST(req: NextRequest) {
  const svixId = req.headers.get("svix-id") ?? "";
  const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
  const svixSignature = req.headers.get("svix-signature") ?? "";

  const rawBody = await req.text();

  // If RESEND_WEBHOOK_SECRET is set, enforce signature. In dev it may not be set.
  if (process.env.RESEND_WEBHOOK_SECRET) {
    if (!verifyResendSignature(rawBody, svixId, svixTimestamp, svixSignature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  try {
    const body = JSON.parse(rawBody);
    const type: string = body.type ?? "";
    const emailAddress: string = body.data?.email_address ?? body.data?.to ?? "";

    if (!emailAddress) return NextResponse.json({ ok: true });

    if (type === "email.bounced") {
      await prisma.emailRecipient.updateMany({
        where: { email: emailAddress, status: { not: "unsubscribed" } },
        data: { status: "bounced", bouncedAt: new Date() },
      });
      const recipients = await prisma.emailRecipient.findMany({ where: { email: emailAddress } });
      await prisma.emailEvent.createMany({
        data: recipients.map((r) => ({ recipientId: r.id, type: "bounce" })),
        skipDuplicates: true,
      });
    }

    if (type === "email.complained" || type === "email.unsubscribed") {
      await prisma.emailRecipient.updateMany({
        where: { email: emailAddress },
        data: { status: "unsubscribed" },
      });
    }

    if (type === "email.delivered") {
      const recipients = await prisma.emailRecipient.findMany({ where: { email: emailAddress, status: "sent" } });
      await prisma.emailEvent.createMany({
        data: recipients.map((r) => ({ recipientId: r.id, type: "delivery" })),
        skipDuplicates: true,
      });
    }
  } catch {
    // Swallow parse errors — always return 200 to Resend
  }

  return NextResponse.json({ ok: true });
}
