import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import AiAgentClient from "./AiAgentClient";

export const dynamic = "force-dynamic";

export default async function AiAgentPage() {
  const user = await getCurrentUser();

  let conversations: { id: string; title: string; pinned: boolean; updatedAt: Date; messages: unknown }[] = [];
  try {
    conversations = await prisma.aiConversation.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      select: { id: true, title: true, pinned: true, updatedAt: true, messages: true },
    });
  } catch { /* AiConversation table not yet migrated — show empty state */ }

  const initialConversations = conversations.map((c) => {
    const msgs = (c.messages as { role: string; content: string }[]) ?? [];
    const last = [...msgs].reverse().find((m) => m.role === "assistant");
    return { id: c.id, title: c.title, pinned: c.pinned, updatedAt: c.updatedAt.toISOString(), preview: last?.content?.slice(0, 100) ?? "" };
  });

  return <AiAgentClient initialConversations={initialConversations} />;
}
