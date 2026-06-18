import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const recipient = await prisma.emailRecipient.findUnique({ where: { token } });
    if (recipient) {
      await prisma.$transaction([
        prisma.emailRecipient.update({
          where: { id: recipient.id },
          data: { status: "unsubscribed" },
        }),
        prisma.emailEvent.create({
          data: { recipientId: recipient.id, type: "unsubscribe" },
        }),
      ]);
    }
  } catch { /* silent */ }

  return new NextResponse(
    `<!DOCTYPE html><html><head><title>Unsubscribed</title></head><body style="font-family:sans-serif;text-align:center;padding:60px">
    <h2>You've been unsubscribed.</h2><p>You won't receive further emails from this campaign.</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
