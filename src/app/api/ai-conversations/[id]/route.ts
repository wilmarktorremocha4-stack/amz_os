import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";

const DIFY_API_URL = process.env.DIFY_API_URL ?? "https://api.dify.ai/v1";
function getDifyKey() {
  return process.env.DIFY_API_KEY ?? process.env.NEXT_PUBLIC_UDIFY_APP_KEY ?? process.env.NEXT_PUBLIC_APP_KEY ?? "";
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const key = getDifyKey();

    const res = await fetch(`${DIFY_API_URL}/messages?conversation_id=${id}&user=${encodeURIComponent(user.id)}&limit=100`, {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: 0 },
    });
    if (!res.ok) return NextResponse.json({ id, messages: [], difyConversationId: id });

    const data = await res.json();
    type DifyMsg = { id: string; query: string; answer: string; created_at: number; agent_thoughts?: { thought: string }[] };
    const messages = (data.data as DifyMsg[] ?? []).reverse().flatMap((m) => {
      const thought = m.agent_thoughts?.map(t => t.thought).join("\n") ?? undefined;
      return [
        { id: `${m.id}_u`, role: "user" as const, content: m.query, createdAt: m.created_at * 1000 },
        { id: `${m.id}_a`, role: "assistant" as const, content: m.answer, thought, createdAt: m.created_at * 1000 },
      ];
    });

    return NextResponse.json({ id, messages, difyConversationId: id });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const body = await req.json();
    const key = getDifyKey();

    if (typeof body.title === "string") {
      await fetch(`${DIFY_API_URL}/conversations/${id}/name`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ name: body.title, user: user.id }),
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const key = getDifyKey();

    await fetch(`${DIFY_API_URL}/conversations/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ user: user.id }),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
