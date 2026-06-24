import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const APP_HOST = new URL(process.env.NEXTAUTH_URL ?? "https://app.operationamz.com").hostname;

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const rawUrl = req.nextUrl.searchParams.get("url") ?? "/";

  // Only allow same-host redirects — block open redirect to external domains
  let safeUrl = "/";
  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname === APP_HOST && (parsed.protocol === "http:" || parsed.protocol === "https:")) {
      safeUrl = rawUrl;
    }
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
          data: { recipientId: recipient.id, type: "click", url: rawUrl.slice(0, 2048) },
        }),
      ]);
    }
  } catch { /* silent */ }

  return NextResponse.redirect(safeUrl);
}
