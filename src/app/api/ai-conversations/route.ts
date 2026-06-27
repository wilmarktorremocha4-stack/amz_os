import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

const DIFY_API_URL = process.env.DIFY_API_URL ?? "https://api.dify.ai/v1";
function getDifyKey(): string {
  return process.env.DIFY_API_KEY ?? "";
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    const key = getDifyKey();
    if (!key) return NextResponse.json([]);

    // Fetch pinned state from Supabase — shared across all apps
    const dbConvs = await prisma.aiConversation.findMany({
      where: { userId: user.id },
      select: { id: true, pinned: true },
    });
    const pinnedMap = new Map(dbConvs.map(c => [c.id, c.pinned]));

    const res = await fetch(`${DIFY_API_URL}/conversations?user=${encodeURIComponent(user.id)}&limit=100&sort_by=-updated_at`, {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: 0 },
    });
    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const convs = (data.data ?? []).map((c: { id: string; name: string; updated_at: number }) => ({
      id: c.id,
      title: c.name || "New Chat",
      pinned: pinnedMap.get(c.id) ?? false,
      updatedAt: new Date(c.updated_at * 1000).toISOString(),
      preview: "",
    }));

    // Pinned first, then by updatedAt
    convs.sort((a: { pinned: boolean; updatedAt: string }, b: { pinned: boolean; updatedAt: string }) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return NextResponse.json(convs);
  } catch {
    return NextResponse.json([]);
  }
}
