import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

const DIFY_API_URL = process.env.DIFY_API_URL ?? "https://api.dify.ai/v1";
const DIFY_KEY = process.env.DIFY_API_KEY ?? process.env.NEXT_PUBLIC_UDIFY_APP_KEY ?? "";

export async function POST(req: NextRequest) {
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try { user = await getCurrentUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const body = await req.json();
  const { query, conversationDbId, difyConversationId, fileUrls } = body as {
    query: string;
    conversationDbId?: string;
    difyConversationId?: string;
    fileUrls?: string[];
  };

  if (!query?.trim()) return NextResponse.json({ error: "Empty query" }, { status: 400 });

  let convId = conversationDbId;
  if (!convId) {
    const conv = await prisma.aiConversation.create({
      data: { userId: user.id, title: query.slice(0, 60) },
    });
    convId = conv.id;
  }

  const userMsg = { id: crypto.randomUUID(), role: "user", content: query, createdAt: Date.now(), fileUrls: fileUrls ?? [] };
  await prisma.aiConversation.update({
    where: { id: convId },
    data: { messages: { push: userMsg } as never, updatedAt: new Date() },
  });

  const difyRes = await fetch(`${DIFY_API_URL}/chat-messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DIFY_KEY}` },
    body: JSON.stringify({
      inputs: {},
      query,
      response_mode: "streaming",
      conversation_id: difyConversationId ?? "",
      user: user.id,
    }),
  });

  if (!difyRes.ok) {
    const err = await difyRes.text();
    return NextResponse.json({ error: `Dify error ${difyRes.status}: ${err}` }, { status: 502 });
  }

  let fullContent = "";
  let thought = "";
  let newDifyConvId = difyConversationId ?? "";
  const finalConvId = convId;

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "conv_db_id", convDbId: finalConvId })}\n\n`));

      const reader = difyRes.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === "[DONE]") continue;
            try {
              const json = JSON.parse(raw);
              if (json.event === "message" || json.event === "agent_message") {
                const chunk: string = json.answer ?? "";
                fullContent += chunk;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chunk", chunk })}\n\n`));
              }
              if (json.event === "agent_thought" && json.thought) {
                thought += json.thought;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "thought", thought: json.thought })}\n\n`));
              }
              if (json.conversation_id && !newDifyConvId) {
                newDifyConvId = json.conversation_id;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "dify_conv_id", difyConvId: newDifyConvId })}\n\n`));
              }
            } catch { /* skip */ }
          }
        }
      } finally {
        const assistantMsg = { id: crypto.randomUUID(), role: "assistant", content: fullContent, thought: thought || undefined, createdAt: Date.now() };
        await prisma.aiConversation.update({
          where: { id: finalConvId },
          data: {
            messages: { push: assistantMsg } as never,
            difyConversationId: newDifyConvId || undefined,
            updatedAt: new Date(),
          },
        });
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Conv-Db-Id": finalConvId,
    },
  });
}
