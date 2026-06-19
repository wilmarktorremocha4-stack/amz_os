"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Send, User, Loader2, RotateCcw, BookOpen, Search, Brain, Lightbulb, Zap, ChevronDown, ChevronUp } from "lucide-react";

const DIFY_API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_UDIFY_API_URL ??
  "https://api.dify.ai/v1";

const APP_KEY =
  process.env.NEXT_PUBLIC_UDIFY_APP_KEY ??
  process.env.NEXT_PUBLIC_APP_KEY ??
  "";

/* ─── Types ─── */
type StatusStep = { icon: React.ReactNode; label: string; done: boolean };

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  thought?: string;
  createdAt: number;
};

/* ─── Status phase cycle ─── */
const STATUS_PHASES: { icon: React.ReactNode; label: string }[] = [
  { icon: <Brain size={12} />,    label: "Understanding your question…" },
  { icon: <Search size={12} />,   label: "Searching knowledge resources…" },
  { icon: <BookOpen size={12} />, label: "Reviewing Brand Partnership Blueprint…" },
  { icon: <BookOpen size={12} />, label: "Cross-referencing Wholesale Masterclass…" },
  { icon: <Lightbulb size={12} />,label: "Synthesising insights for you…" },
];

function StatusBar({ phase }: { phase: number }) {
  const completed = STATUS_PHASES.slice(0, phase);
  const current   = STATUS_PHASES[phase];

  return (
    <div className="flex flex-col gap-1.5 rounded-2xl rounded-tl-sm border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5 px-4 py-3 text-xs">
      {/* Completed steps */}
      {completed.map((s, i) => (
        <div key={i} className="flex items-center gap-2 text-emerald-500/80">
          <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
            {s.icon}
          </span>
          <span className="line-through opacity-60">{s.label}</span>
          <span className="ml-auto text-[10px] opacity-50">✓</span>
        </div>
      ))}
      {/* Current step */}
      {current && (
        <div className="flex items-center gap-2 text-blue-400">
          <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15 animate-pulse">
            {current.icon}
          </span>
          <span className="font-medium">{current.label}</span>
          <span className="ml-1 inline-flex gap-0.5">
            {[0,1,2].map(i => (
              <span key={i} className="inline-block w-1 h-1 rounded-full bg-blue-400 animate-bounce"
                style={{ animationDelay: `${i*0.15}s`, animationDuration: "0.8s" }} />
            ))}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Simple markdown renderer (bold, links, lists) ─── */
function MdLine({ text }: { text: string }) {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch)
          return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
            className="underline underline-offset-2 opacity-80 hover:opacity-100">{linkMatch[1]}</a>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { elements.push(<div key={i} className="h-2" />); i++; continue; }
    if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="mt-3 mb-1 text-sm font-bold text-[var(--foreground)]"><MdLine text={line.slice(4)} /></h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="mt-3 mb-1 text-base font-bold text-[var(--foreground)]"><MdLine text={line.slice(3)} /></h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="mt-3 mb-1 text-lg font-bold text-[var(--foreground)]"><MdLine text={line.slice(2)} /></h1>);
    } else if (line.match(/^[-*] /)) {
      elements.push(
        <div key={i} className="flex gap-2 items-start">
          <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span><MdLine text={line.slice(2)} /></span>
        </div>
      );
    } else if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\. /)?.[1];
      elements.push(
        <div key={i} className="flex gap-2 items-start">
          <span className="shrink-0 text-[11px] font-bold text-blue-400 mt-0.5 w-4">{num}.</span>
          <span><MdLine text={line.replace(/^\d+\. /, "")} /></span>
        </div>
      );
    } else {
      elements.push(<p key={i}><MdLine text={line} /></p>);
    }
    i++;
  }
  return <div className="flex flex-col gap-1 text-sm leading-relaxed">{elements}</div>;
}

function ThoughtBlock({ thought }: { thought: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs">
      <button onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-blue-400 hover:text-blue-300 transition">
        <Brain size={11} />
        <span className="font-medium">Agent reasoning</span>
        {open ? <ChevronUp size={11} className="ml-auto" /> : <ChevronDown size={11} className="ml-auto" />}
      </button>
      {open && (
        <div className="border-t border-blue-500/10 px-3 py-2 text-[var(--muted)] whitespace-pre-wrap leading-relaxed">
          {thought}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-start`}>
      {/* Avatar */}
      <div className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full border overflow-hidden ${
        isUser
          ? "border-blue-500/40 bg-gradient-to-br from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-500/20"
          : "border-[var(--border)] bg-white"
      }`}>
        {isUser
          ? <User size={14} />
          : <Image src="https://assets.cdn.filesafe.space/2rx7sGBL7YKaiP0HwK56/media/68de916c065f281e19a858a2.png"
              alt="AMZ Navigator" width={32} height={32} className="w-8 h-8 object-cover" unoptimized />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {!isUser && (
          <span className="text-[11px] font-semibold text-blue-400 px-1">AMZ Navigator</span>
        )}
        <div className={`relative rounded-2xl px-4 py-3 ${
          isUser
            ? "rounded-tr-sm bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20"
            : "rounded-tl-sm border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
        }`}>
          {isUser
            ? <span className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</span>
            : <MarkdownContent content={msg.content} />
          }
        </div>
        {msg.thought && <ThoughtBlock thought={msg.thought} />}
      </div>
    </div>
  );
}

/* ─── Intro phrases by keyword ─── */
function getIntroPhrase(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("blueprint") || q.includes("partner"))
    return "Sure! Let me do a deep dive into the Brand Partnership Blueprint resources to give you the fullest guide on this. 🔍";
  if (q.includes("wholesale") || q.includes("masterclass"))
    return "Absolutely! I'm pulling from the Wholesale Masterclass materials right now to give you comprehensive guidance. 📚";
  if (q.includes("supplier") || q.includes("brand"))
    return "Great question! Let me search through all the sourcing resources and knowledge base to build you the best answer. 🎯";
  if (q.includes("outreach") || q.includes("email"))
    return "On it! I'm scanning the outreach playbooks and templates to craft a thorough answer for you. ✉️";
  return "Sure! Let me dive deep into the knowledge resources to give you the fullest and most accurate guide I can. 🚀";
}

/* ─── Main page ─── */
export default function AiAgentPage() {
  const [messages, setMessages]           = useState<Message[]>([]);
  const [input, setInput]                 = useState("");
  const [isResponding, setIsResponding]   = useState(false);
  const [statusPhase, setStatusPhase]     = useState(0);
  const [showStatus, setShowStatus]       = useState(false);
  const [conversationId, setConvId]       = useState<string | null>(null);
  const [error, setError]                 = useState<string | null>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const phaseTimer  = useRef<ReturnType<typeof setInterval> | null>(null);
  const configured  = !!APP_KEY;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showStatus]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  };

  const reset = () => {
    setMessages([]); setConvId(null); setError(null);
    setInput(""); setShowStatus(false); setStatusPhase(0);
    if (phaseTimer.current) clearInterval(phaseTimer.current);
  };

  const startStatusCycle = () => {
    setStatusPhase(0);
    setShowStatus(true);
    let phase = 0;
    phaseTimer.current = setInterval(() => {
      phase++;
      if (phase >= STATUS_PHASES.length) { clearInterval(phaseTimer.current!); return; }
      setStatusPhase(phase);
    }, 4500);
  };

  const stopStatusCycle = () => {
    if (phaseTimer.current) clearInterval(phaseTimer.current);
    setShowStatus(false);
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isResponding) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text, createdAt: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsResponding(true);
    setError(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Show contextual intro + status
    const introId = crypto.randomUUID();
    const intro = getIntroPhrase(text);
    setMessages(prev => [...prev, { id: introId, role: "assistant", content: intro, createdAt: Date.now() }]);
    startStatusCycle();

    const assistantId = crypto.randomUUID();
    let thoughtBuf = "";

    try {
      const res = await fetch(`${DIFY_API_URL}/chat-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${APP_KEY}` },
        body: JSON.stringify({
          inputs: {},
          query: text,
          response_mode: "streaming",
          conversation_id: conversationId ?? "",
          user: "amz-os-user",
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`API error ${res.status}: ${err}`);
      }

      stopStatusCycle();
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", createdAt: Date.now() }]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + chunk } : m
              ));
            }
            if (json.event === "agent_thought" && json.thought) {
              thoughtBuf += json.thought;
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, thought: thoughtBuf } : m
              ));
            }
            if (json.conversation_id && !conversationId) {
              setConvId(json.conversation_id);
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (e) {
      stopStatusCycle();
      setError(e instanceof Error ? e.message : "Unknown error");
      setMessages(prev => prev.filter(m => m.id !== assistantId && m.id !== introId));
    } finally {
      setIsResponding(false);
    }
  }, [input, isResponding, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const STARTERS = [
    { emoji: "🏷️", text: "Walk me through the Brand Partnership Blueprint" },
    { emoji: "📦", text: "How do I qualify a wholesale brand for Amazon?" },
    { emoji: "✉️", text: "Write me an outreach email to a new supplier" },
    { emoji: "📊", text: "What are the key steps in the Wholesale Masterclass?" },
  ];

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 0px)", maxHeight: "100dvh" }}>

      {/* ─── Header ─── */}
      <div className="shrink-0 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-5 py-3 z-10">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0 h-9 w-9 rounded-xl overflow-hidden border border-[var(--border)] shadow-md bg-white">
            <Image
              src="https://assets.cdn.filesafe.space/2rx7sGBL7YKaiP0HwK56/media/68de916c065f281e19a858a2.png"
              alt="AMZ Navigator"
              width={36} height={36}
              className="w-9 h-9 object-cover"
              unoptimized
            />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] bg-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[var(--foreground)] leading-tight">AMZ Navigator</h1>
            <p className="text-[11px] text-[var(--muted)]">
              {isResponding ? "Thinking…" : conversationId ? "Conversation active" : "Your AI sourcing co-pilot"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
            <Zap size={10} className="fill-emerald-500" /> Online
          </span>
          {messages.length > 0 && (
            <button onClick={reset}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)] transition">
              <RotateCcw size={12} /> New chat
            </button>
          )}
        </div>
      </div>

      {/* ─── Messages ─── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6">
          {messages.length === 0 && !isResponding ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-3xl scale-150" />
                <div className="relative h-24 w-24 rounded-2xl overflow-hidden border border-[var(--border)] shadow-2xl shadow-blue-500/30 bg-white">
                  <Image
                    src="https://assets.cdn.filesafe.space/2rx7sGBL7YKaiP0HwK56/media/68de916c065f281e19a858a2.png"
                    alt="AMZ Navigator"
                    width={96} height={96}
                    className="w-24 h-24 object-cover"
                    unoptimized
                  />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[var(--foreground)]">AMZ Navigator</h2>
                <p className="mt-2 text-sm text-[var(--muted)] max-w-sm leading-relaxed">
                  Your AI-powered co-pilot for Amazon wholesale sourcing, brand partnerships, and supplier outreach.
                </p>
              </div>
              {!configured && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-600 max-w-sm">
                  Set <code className="font-mono font-semibold">NEXT_PUBLIC_APP_KEY</code> in Vercel environment variables to activate.
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {STARTERS.map((s) => (
                  <button key={s.text}
                    onClick={() => { setInput(s.text); textareaRef.current?.focus(); }}
                    className="group flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left text-xs hover:border-blue-400/50 hover:bg-[var(--accent-soft)] transition-all">
                    <span className="text-base shrink-0">{s.emoji}</span>
                    <span className="text-[var(--muted)] group-hover:text-[var(--foreground)] transition leading-relaxed">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              {/* Status bar while responding */}
              {showStatus && isResponding && (
                <div className="flex gap-3 items-start">
                  <div className="shrink-0 h-8 w-8 rounded-full overflow-hidden border border-[var(--border)] bg-white">
                    <Image src="https://assets.cdn.filesafe.space/2rx7sGBL7YKaiP0HwK56/media/68de916c065f281e19a858a2.png"
                      alt="AMZ Navigator" width={32} height={32} className="w-8 h-8 object-cover" unoptimized />
                  </div>
                  <div className="flex-1">
                    <span className="text-[11px] font-semibold text-blue-400 px-1 mb-1 block">AMZ Navigator</span>
                    <StatusBar phase={statusPhase} />
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
        </div>
        <div ref={bottomRef} />
      </div>

      {/* ─── Input ─── */}
      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="mx-auto max-w-2xl">
          <div className={`flex items-end gap-2 rounded-2xl border bg-[var(--background)] px-4 py-3 transition-all ${
            isResponding
              ? "border-[var(--border)] opacity-70"
              : "border-[var(--border)] focus-within:border-blue-500/50 focus-within:shadow-[0_0_0_3px_rgb(59_130_246/0.08)]"
          }`}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder={isResponding ? "AMZ Navigator is thinking…" : "Ask AMZ Navigator anything…"}
              rows={1}
              disabled={isResponding}
              className="flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none leading-relaxed"
              style={{ maxHeight: 140 }}
            />
            <button onClick={send} disabled={!input.trim() || isResponding}
              className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                input.trim() && !isResponding
                  ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30 hover:from-blue-500 hover:to-blue-400 scale-100"
                  : "bg-[var(--accent-soft)] text-[var(--muted)] scale-95"
              }`}>
              {isResponding ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-[var(--muted)]/50">
            Enter to send · Shift+Enter for new line · Responses may take a moment for deep research
          </p>
        </div>
      </div>
    </div>
  );
}
