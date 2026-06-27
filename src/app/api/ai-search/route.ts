import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (!q) return NextResponse.json([]);

    const convs = await prisma.aiConversation.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        title: { contains: q, mode: "insensitive" },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, title: true, updatedAt: true },
    });

    return NextResponse.json(
      convs.map((c) => ({ id: c.id, title: c.title, snippet: "", updatedAt: c.updatedAt.toISOString() }))
    );
  } catch {
    return NextResponse.json([]);
  }
}
