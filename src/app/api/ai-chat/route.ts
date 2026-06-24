import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";

const DIFY_BASE = process.env.DIFY_API_URL ?? "https://api.dify.ai/v1";

function getDifyKey() {
  return (
    process.env.DIFY_API_KEY ??
    process.env.UDIFY_APP_KEY ??
    ""
  );
}

export async function POST(req: NextRequest) {
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try { user = await getCurrentUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const body = await req.json() as {
    query: string;
    difyConversationId?: string;
    files?: { type: string; transfer_method: string; upload_file_id: string }[];
  };

  const { query, difyConversationId, files } = body;
  if (!query?.trim()) return NextResponse.json({ error: "Empty query" }, { status: 400 });

  const DIFY_KEY = getDifyKey();
  if (!DIFY_KEY) return NextResponse.json({ error: "Dify API key not configured. Set DIFY_API_KEY in Vercel environment variables." }, { status: 503 });

  const difyRes = await fetch(`${DIFY_BASE}/chat-messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DIFY_KEY}` },
    body: JSON.stringify({
      inputs: {},
      query,
      response_mode: "streaming",
      conversation_id: difyConversationId ?? "",
      user: user.id,
      files: files ?? [],
    }),
  });

  if (!difyRes.ok) {
    const err = await difyRes.text();
    return NextResponse.json({ error: `Dify error ${difyRes.status}: ${err}` }, { status: 502 });
  }

  let newDifyConvId = difyConversationId ?? "";
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
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
              console.log("[ai-chat] dify event:", json.event, "answer length:", (json.answer ?? "").length);

              // Chat/agent app events
              if (json.event === "message" || json.event === "agent_message") {
                const chunk: string = json.answer ?? "";
                if (chunk) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chunk", chunk })}\n\n`));
              }
              // Workflow app text chunk
              if (json.event === "text_chunk") {
                const chunk: string = json.data?.text ?? json.text ?? "";
                if (chunk) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chunk", chunk })}\n\n`));
              }
              if (json.conversation_id && !newDifyConvId) {
                newDifyConvId = json.conversation_id;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "dify_conv_id", difyConvId: newDifyConvId })}\n\n`));
              }
              if (json.event === "message_end" || json.event === "workflow_finished") {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
              }
              // Dify error event
              if (json.event === "error") {
                const msg = json.message ?? json.msg ?? "Dify agent error";
                console.error("[ai-chat] dify error event:", msg);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: msg })}\n\n`));
              }
            } catch { /* skip */ }
          }
        }
      } finally {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
