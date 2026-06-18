import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1×1 transparent GIF
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const recipient = await prisma.emailRecipient.findUnique({ where: { token } });
    if (recipient) {
      await prisma.$transaction([
        prisma.emailRecipient.update({
          where: { id: recipient.id },
          data: { status: "opened", openedAt: recipient.openedAt ?? new Date() },
        }),
        prisma.emailEvent.create({
          data: { recipientId: recipient.id, type: "open" },
        }),
      ]);
    }
  } catch { /* silent — never break email */ }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}
