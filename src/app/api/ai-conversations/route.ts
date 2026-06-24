import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";

const DIFY_API_URL = process.env.DIFY_API_URL ?? "https://api.dify.ai/v1";
function getDifyKey(): string {
  return process.env.DIFY_API_KEY ?? "";
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    const key = getDifyKey();
    if (!key) return NextResponse.json([]);

    const res = await fetch(`${DIFY_API_URL}/conversations?user=${encodeURIComponent(user.id)}&limit=50&sort_by=-updated_at`, {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: 0 },
    });
    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const convs = (data.data ?? []).map((c: { id: string; name: string; updated_at: number }) => ({
      id: c.id,
      title: c.name || "New Chat",
      pinned: false,
      updatedAt: new Date(c.updated_at * 1000).toISOString(),
      preview: "",
    }));
    return NextResponse.json(convs);
  } catch {
    return NextResponse.json([]);
  }
}
