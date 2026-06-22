import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

const DIFY_API_URL = process.env.DIFY_API_URL ?? "https://api.dify.ai/v1";

function getDifyKey() {
  return (
    process.env.DIFY_API_KEY ??
    process.env.NEXT_PUBLIC_UDIFY_APP_KEY ??
    process.env.NEXT_PUBLIC_APP_KEY ??
    process.env.UDIFY_APP_KEY ??
    ""
  );
}

async function appendMessage(convId: string, msg: Record<string, unknown>) {
  const conv = await prisma.aiConversation.findUnique({ where: { id: convId }, select: { messages: true } });
  const existing = (conv?.messages as unknown[]) ?? [];
  await prisma.aiConversation.update({
    where: { id: convId },
    data: { messages: [...existing, msg] as never, updatedAt: new Date() },
  });
}

export async function POST(req: NextRequest) {
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try { user = await getCurrentUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const body = await req.json();
  const { query, conversationDbId, difyConversationId } = body as {
    query: string;
    conversationDbId?: string;
    difyConversationId?: string;
    fileUrls?: string[];
  };

  if (!query?.trim()) return NextResponse.json({ error: "Empty query" }, { status: 400 });

  const DIFY_KEY = getDifyKey();
  if (!DIFY_KEY) return NextResponse.json({ error: "Dify API key not configured. Set DIFY_API_KEY in Vercel environment variables." }, { status: 503 });

  // Create or reuse conversation record
  let convId = conversationDbId;
  if (!convId) {
    const conv = await prisma.aiConversation.create({
      data: { userId: user.id, title: query.slice(0, 60) },
    });
    convId = conv.id;
  }

  // Save user message by reading + appending
  const userMsg = { id: crypto.randomUUID(), role: "user", content: query, createdAt: Date.now(), fileUrls: [] };
  await appendMessage(convId, userMsg);

  // Call Dify
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
        // Save assistant message
        const assistantMsg = { id: crypto.randomUUID(), role: "assistant", content: fullContent, thought: thought || undefined, createdAt: Date.now() };
        await appendMessage(finalConvId, assistantMsg);
        if (newDifyConvId) {
          await prisma.aiConversation.update({ where: { id: finalConvId }, data: { difyConversationId: newDifyConvId } });
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Conv-Db-Id": finalConvId },
  });
}
