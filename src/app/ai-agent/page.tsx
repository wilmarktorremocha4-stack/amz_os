"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, User, Loader2, Sparkles, Zap, RotateCcw } from "lucide-react";

const UDIFY_API_URL = "https://udify.app/api";
const APP_KEY = process.env.NEXT_PUBLIC_UDIFY_APP_KEY ?? "";
const APP_ID = process.env.NEXT_PUBLIC_UDIFY_APP_ID ?? "";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

function TypingDots() {
  return (
    <span className="inline-flex items-end gap-0.5 h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
        />
      ))}
    </span>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full border ${
        isUser
          ? "border-blue-500/40 bg-gradient-to-br from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-500/20"
          : "border-[var(--border)] bg-[var(--surface)] text-blue-400"
      }`}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Bubble */}
      <div className={`relative max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "rounded-tr-sm bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20"
          : "rounded-tl-sm border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
      }`}>
        {/* Glow for AI messages */}
        {!isUser && (
          <span className="pointer-events-none absolute -inset-px rounded-2xl rounded-tl-sm bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
        )}
        <span className="relative whitespace-pre-wrap">{msg.content}</span>
      </div>
    </div>
  );
}

export default function AiAgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const configured = !!(APP_KEY || APP_ID);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isResponding]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const reset = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setInput("");
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isResponding) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsResponding(true);
    setError(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", createdAt: Date.now() }]);

    try {
      const res = await fetch(`${UDIFY_API_URL}/chat-messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${APP_KEY}`,
        },
        body: JSON.stringify({
          inputs: {},
          query: text,
          response_mode: "streaming",
          conversation_id: conversationId ?? "",
          user: "amz-os-user",
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API error ${res.status}: ${errText}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let newConvId: string | null = null;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const json = JSON.parse(raw);
            if (json.event === "message" || json.event === "agent_message") {
              const chunk: string = json.answer ?? "";
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + chunk } : m
                )
              );
            }
            if (json.conversation_id && !newConvId) {
              newConvId = json.conversation_id;
              setConversationId(json.conversation_id);
            }
          } catch {
            // ignore malformed chunk
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsResponding(false);
    }
  }, [input, isResponding, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <main className="flex flex-1 flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30">
            <Bot size={18} className="text-white" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] bg-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[var(--foreground)]">AMZ AI Agent</h1>
            <p className="text-[11px] text-[var(--muted)]">Powered by Dify · {conversationId ? "Conversation active" : "Ready"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-500">
            <Zap size={10} className="fill-emerald-500" />
            Online
          </span>
          {messages.length > 0 && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)] transition"
            >
              <RotateCcw size={12} />
              New chat
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        {messages.length === 0 && !isResponding ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center pb-16">
            {/* Glowing orb */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl scale-150" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 shadow-2xl shadow-blue-500/40">
                <Sparkles size={32} className="text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">AMZ AI Agent</h2>
              <p className="mt-1 text-sm text-[var(--muted)] max-w-xs">
                Ask me anything about Amazon sourcing, brands, suppliers, or your CRM data.
              </p>
            </div>
            {!configured && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-600 max-w-sm">
                Add <code className="font-mono font-semibold">NEXT_PUBLIC_UDIFY_APP_KEY</code> to your environment variables to activate the agent.
              </div>
            )}
            {/* Starter prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg mt-2">
              {[
                "Find me top wholesale brands in the Home & Kitchen category",
                "What makes a good Amazon wholesale supplier?",
                "How do I qualify a brand for reselling on Amazon?",
                "Summarize my recent CRM contacts and opportunities",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left text-xs text-[var(--muted)] hover:border-blue-400/50 hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)] transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-5">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isResponding && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3">
                <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-blue-400">
                  <Bot size={14} />
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                  <TypingDots />
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-500">
                {error}
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <div className={`relative flex items-end gap-2 rounded-2xl border bg-[var(--background)] px-4 py-3 transition-all ${
            isResponding ? "border-[var(--border)]" : "border-[var(--border)] focus-within:border-blue-500/50 focus-within:shadow-[0_0_0_3px_rgb(59_130_246/0.1)]"
          }`}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder="Ask the AI agent anything…"
              rows={1}
              disabled={isResponding}
              className="flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none leading-relaxed"
              style={{ maxHeight: 160 }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || isResponding}
              className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                input.trim() && !isResponding
                  ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30 hover:from-blue-500 hover:to-blue-400"
                  : "bg-[var(--accent-soft)] text-[var(--muted)]"
              }`}
            >
              {isResponding ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-[var(--muted)]/60">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </main>
  );
}
