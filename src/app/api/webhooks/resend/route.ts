import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Resend webhook — handles bounce, complaint, delivery events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
  } catch (err) {
    console.error("Resend webhook error:", err);
  }

  return NextResponse.json({ ok: true });
}
