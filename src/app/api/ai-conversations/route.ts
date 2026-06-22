import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const convs = await prisma.aiConversation.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      select: { id: true, title: true, pinned: true, updatedAt: true, messages: true },
    });
    const result = convs.map((c) => {
      const msgs = c.messages as { role: string; content: string }[];
      const last = [...msgs].reverse().find((m) => m.role === "assistant");
      return { id: c.id, title: c.title, pinned: c.pinned, updatedAt: c.updatedAt, preview: last?.content?.slice(0, 100) ?? "" };
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
