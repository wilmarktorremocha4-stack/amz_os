import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import AiAgentClient from "./AiAgentClient";
import { redirect } from "next/navigation";

export default async function AiAgentPage() {
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try { user = await getCurrentUser(); } catch { redirect("/login"); }

  // Try to fetch conversations — if table doesn't exist yet, return empty
  let conversations: { id: string; title: string; pinned: boolean; updatedAt: Date; messages: unknown }[] = [];
  try {
    conversations = await prisma.aiConversation.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      select: { id: true, title: true, pinned: true, updatedAt: true, messages: true },
    });
  } catch { /* table not yet created — user needs to run migration */ }

  const initialConversations = conversations.map((c) => {
    const msgs = (c.messages as { role: string; content: string }[]) ?? [];
    const last = [...msgs].reverse().find((m) => m.role === "assistant");
    return { id: c.id, title: c.title, pinned: c.pinned, updatedAt: c.updatedAt.toISOString(), preview: last?.content?.slice(0, 100) ?? "" };
  });

  return <AiAgentClient initialConversations={initialConversations} />;
}
