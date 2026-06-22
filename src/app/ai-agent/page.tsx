import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import AiAgentClient from "./AiAgentClient";
import { redirect } from "next/navigation";

export default async function AiAgentPage() {
  // getCurrentUser throws on unauthenticated — catch auth errors only, re-throw redirect signals
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    user = await getCurrentUser();
  } catch (err) {
    // Re-throw Next.js internal errors (redirect, notFound, etc.)
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    const msg = String((err as { digest?: string })?.digest ?? "");
    if (msg.startsWith("NEXT_REDIRECT") || msg.startsWith("NEXT_NOT_FOUND")) throw err;
    redirect("/login");
  }

  // Load conversations — gracefully handle table-not-yet-created
  let conversations: { id: string; title: string; pinned: boolean; updatedAt: Date; messages: unknown }[] = [];
  try {
    conversations = await prisma.aiConversation.findMany({
      where: { userId: user!.id, deletedAt: null },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      select: { id: true, title: true, pinned: true, updatedAt: true, messages: true },
    });
  } catch { /* table not yet created in Supabase — run migration SQL */ }

  const initialConversations = conversations.map((c) => {
    const msgs = (c.messages as { role: string; content: string }[]) ?? [];
    const last = [...msgs].reverse().find((m) => m.role === "assistant");
    return { id: c.id, title: c.title, pinned: c.pinned, updatedAt: c.updatedAt.toISOString(), preview: last?.content?.slice(0, 100) ?? "" };
  });

  return <AiAgentClient initialConversations={initialConversations} />;
}
