import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const archived = await prisma.aiConversation.findMany({
      where: { userId: user.id, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: { id: true, title: true, deletedAt: true },
    });
    return NextResponse.json(
      archived.map((c) => ({ id: c.id, title: c.title, deletedAt: c.deletedAt?.toISOString() ?? null }))
    );
  } catch {
    return NextResponse.json([]);
  }
}
