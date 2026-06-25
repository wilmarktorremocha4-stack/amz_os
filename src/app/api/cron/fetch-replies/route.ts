import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processRepliesForUser } from "@/lib/actions/fetch-replies";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const users = await prisma.user.findMany({
    where: {
      smtpHost: { not: null },
      smtpUser: { not: null },
      smtpPassEncrypted: { not: null },
      smtpVerifiedAt: { not: null },
    },
    select: { id: true },
  });

  let total = 0;
  for (const user of users) {
    const { imported } = await processRepliesForUser(user.id);
    total += imported;
  }

  return NextResponse.json({ ok: true, imported: total });
}
