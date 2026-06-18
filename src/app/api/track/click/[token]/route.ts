import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const url = req.nextUrl.searchParams.get("url") ?? "/";

  // Validate URL to prevent open redirect to non-http(s) schemes
  let safeUrl = "/";
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") safeUrl = url;
  } catch { /* bad URL → redirect home */ }

  try {
    const recipient = await prisma.emailRecipient.findUnique({ where: { token } });
    if (recipient) {
      await prisma.$transaction([
        prisma.emailRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "clicked",
            clickedAt: recipient.clickedAt ?? new Date(),
            openedAt: recipient.openedAt ?? new Date(),
          },
        }),
        prisma.emailEvent.create({
          data: { recipientId: recipient.id, type: "click", url: safeUrl },
        }),
      ]);
    }
  } catch { /* silent */ }

  return NextResponse.redirect(safeUrl);
}
