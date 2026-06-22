"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Send, Brain, Search, BookOpen, Lightbulb, ChevronDown, ChevronUp,
  MoreHorizontal, Pin, Pencil, Trash2, X, Plus, MessageSquare,
  Copy, Check, Paperclip, HardDrive, Settings, LogOut,
} from "lucide-react";

const LOGO = "https://assets.cdn.filesafe.space/2rx7sGBL7YKaiP0HwK56/media/6a39790e610e9ace505dccdb.png";
const AVATAR = "https://assets.cdn.filesafe.space/2rx7sGBL7YKaiP0HwK56/media/68de916c065f281e19a858a2.png";

type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  thought?: string;
  createdAt: number;
  fileUrls?: string[];
};

type Conversation = {
  id: string;
  title: string;
  pinned: boolean;
  updatedAt: string;
  preview: string;
};

/* ─── Neon Logo ─── */
function NeonLogo({ pulsing }: { pulsing: boolean }) {
  return (
    <div className={`relative h-10 w-10 rounded-xl overflow-hidden border border-[var(--border)] bg-white ${pulsing ? "neon-pulse" : "neon-idle"}`}
      style={{ boxShadow: pulsing ? "0 0 16px 4px #3b82f640, 0 0 32px 8px #8b5cf620" : "0 0 8px 2px #3b82f620" }}>
      <Image src={LOGO} alt="OperationAMZ" width={40} height={40} className="w-10 h-10 object-cover" unoptimized />
    </div>
  );
}

/* ─── Avatar (AI side) pulsing when thinking ─── */
function AiAvatar({ pulsing }: { pulsing: boolean }) {
  return (
    <div className={`shrink-0 h-8 w-8 rounded-full overflow-hidden border border-[var(--border)] bg-white ${pulsing ? "animate-pulse" : ""}`}>
      <Image src={AVATAR} alt="AMZ Navigator" width={32} height={32} className="w-8 h-8 object-cover" unoptimized />
    </div>
  );
}

/* ─── Status phases ─── */
const STATUS_PHASES = [
  { icon: <Brain size={11} />, label: "Understanding your question…" },
  { icon: <Search size={11} />, label: "Searching knowledge resources…" },
  { icon: <BookOpen size={11} />, label: "Reviewing Brand Partnership Blueprint…" },
  { icon: <BookOpen size={11} />, label: "Cross-referencing Wholesale Masterclass…" },
  { icon: <Lightbulb size={11} />, label: "Synthesising insights…" },
];

function StatusBar({ phase }: { phase: number }) {
  const done = STATUS_PHASES.slice(0, phase);
  const cur = STATUS_PHASES[phase];
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl rounded-tl-sm border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5 px-4 py-3 text-xs">
      {done.map((s, i) => (
        <div key={i} className="flex items-center gap-2 text-emerald-500/80">
          <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">{s.icon}</span>
          <span className="line-through opacity-60">{s.label}</span>
          <span className="ml-auto text-[10px] opacity-50">✓</span>
        </div>
      ))}
      {cur && (
        <div className="flex items-center gap-2 text-blue-400">
          <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15 animate-pulse">{cur.icon}</span>
          <span className="font-medium">{cur.label}</span>
          <span className="ml-1 inline-flex gap-0.5">
            {[0, 1, 2].map(i => (
              <span key={i} className="inline-block w-1 h-1 rounded-full bg-blue-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }} />
            ))}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Markdown ─── */
function MdLine({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
        const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (m) return <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 opacity-80 hover:opacity-100">{m[1]}</a>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const out: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    if (!line.trim()) { out.push(<div key={i} className="h-2" />); return; }
    if (line.startsWith("### ")) { out.push(<h3 key={i} className="mt-3 mb-1 text-sm font-bold"><MdLine text={line.slice(4)} /></h3>); return; }
    if (line.startsWith("## ")) { out.push(<h2 key={i} className="mt-3 mb-1 text-base font-bold"><MdLine text={line.slice(3)} /></h2>); return; }
    if (line.startsWith("# ")) { out.push(<h1 key={i} className="mt-3 mb-1 text-lg font-bold"><MdLine text={line.slice(2)} /></h1>); return; }
    if (line.match(/^[-*] /)) {
      out.push(<div key={i} className="flex gap-2 items-start"><span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400" /><span><MdLine text={line.slice(2)} /></span></div>);
      return;
    }
    if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\. /)?.[1];
      out.push(<div key={i} className="flex gap-2 items-start"><span className="shrink-0 text-[11px] font-bold text-blue-400 mt-0.5 w-4">{num}.</span><span><MdLine text={line.replace(/^\d+\. /, "")} /></span></div>);
      return;
    }
    out.push(<p key={i}><MdLine text={line} /></p>);
  });
  return <div className="flex flex-col gap-1 text-sm leading-relaxed">{out}</div>;
}

function ThoughtBlock({ thought }: { thought: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center gap-1.5 px-3 py-2 text-blue-400 hover:text-blue-300 transition">
        <Brain size={11} /><span className="font-medium">Agent reasoning</span>
        {open ? <ChevronUp size={11} className="ml-auto" /> : <ChevronDown size={11} className="ml-auto" />}
      </button>
      {open && <div className="border-t border-blue-500/10 px-3 py-2 text-[var(--muted)] whitespace-pre-wrap leading-relaxed">{thought}</div>}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="opacity-0 group-hover:opacity-100 transition ml-auto shrink-0 p-1.5 rounded-lg hover:bg-[var(--accent-soft)] text-[var(--muted)] hover:text-[var(--foreground)]">
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  );
}

function MessageBubble({ msg, isThinking }: { msg: AiMessage; isThinking?: boolean }) {
  const isUser = msg.role === "user";
  return (
    <div className={`group flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-start`}>
      {isUser
        ? <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-white text-xs font-bold border border-blue-500/40 shadow-lg shadow-blue-500/20">U</div>
        : <AiAvatar pulsing={!!isThinking} />
      }
      <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && <span className="text-[11px] font-semibold text-blue-400 px-1">AMZ Navigator</span>}
        <div className={`relative rounded-2xl px-4 py-3 ${isUser
          ? "rounded-tr-sm bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20"
          : "rounded-tl-sm border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-sm"}`}>
          {isUser
            ? <span className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</span>
            : <MarkdownContent content={msg.content || "…"} />
          }
        </div>
        {!isUser && msg.content && <CopyButton text={msg.content} />}
        {msg.thought && <ThoughtBlock thought={msg.thought} />}
        {msg.fileUrls && msg.fileUrls.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {msg.fileUrls.map((u, i) => (
              <a key={i} href={u} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-blue-400 underline underline-offset-1">{u.split("/").pop() ?? `File ${i + 1}`}</a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Conversation item in sidebar ─── */
function ConvItem({ conv, active, onSelect, onRename, onPin, onDelete }: {
  conv: Conversation; active: boolean;
  onSelect: () => void; onRename: (title: string) => void;
  onPin: () => void; onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(conv.title);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div onClick={onSelect}
      className={`group relative flex items-start gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${active ? "bg-[var(--accent-soft)] text-[var(--foreground)]" : "hover:bg-[var(--accent-soft)/50] text-[var(--muted)]"}`}>
      <MessageSquare size={13} className="shrink-0 mt-0.5 opacity-60" />
      <div className="flex-1 min-w-0">
        {renaming ? (
          <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
            onBlur={() => { setRenaming(false); onRename(draft); }}
            onKeyDown={e => { if (e.key === "Enter") { setRenaming(false); onRename(draft); } if (e.key === "Escape") { setRenaming(false); setDraft(conv.title); } }}
            onClick={e => e.stopPropagation()}
            className="w-full bg-transparent text-xs outline-none border-b border-blue-500/50 text-[var(--foreground)]" />
        ) : (
          <p className="text-xs font-medium truncate leading-tight text-[var(--foreground)]">{conv.title}</p>
        )}
        <p className="text-[10px] truncate opacity-60 mt-0.5">{conv.preview || "No messages yet"}</p>
      </div>
      {conv.pinned && <Pin size={10} className="shrink-0 mt-0.5 text-blue-400" />}
      <div ref={menuRef} className="relative shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={() => setMenuOpen(o => !o)}
          className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-[var(--border)]">
          <MoreHorizontal size={12} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-6 z-50 w-36 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl py-1 text-xs">
            <button onClick={() => { setRenaming(true); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-[var(--accent-soft)]"><Pencil size={11} /> Rename</button>
            <button onClick={() => { onPin(); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-[var(--accent-soft)]"><Pin size={11} /> {conv.pinned ? "Unpin" : "Pin"}</button>
            <div className="my-1 border-t border-[var(--border)]" />
            <button onClick={() => { onDelete(); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-500/10"><Trash2 size={11} /> Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Delete confirmation modal ─── */
function DeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-80 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Delete conversation?</h3>
        <p className="mt-1.5 text-xs text-[var(--muted)]">This will permanently remove the conversation and all its messages. This cannot be undone.</p>
        <div className="mt-4 flex gap-2">
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-red-500 py-2 text-xs font-semibold text-white hover:bg-red-600">Delete</button>
          <button onClick={onCancel} className="flex-1 rounded-lg border border-[var(--border)] py-2 text-xs text-[var(--muted)] hover:bg-[var(--accent-soft)]">Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function AiAgentClient({ initialConversations }: { initialConversations: Conversation[] }) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [difyConvId, setDifyConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [statusPhase, setStatusPhase] = useState(0);
  const [showStatus, setShowStatus] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"chats" | "settings" | "storage">("chats");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const phaseTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, showStatus]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  };

  const loadConversation = async (convId: string) => {
    setActiveConvId(convId);
    const res = await fetch(`/api/ai-conversations/${convId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages((data.messages ?? []) as AiMessage[]);
      setDifyConvId(data.difyConversationId ?? null);
    }
  };

  const startNew = () => {
    setActiveConvId(null);
    setDifyConvId(null);
    setMessages([]);
    setInput("");
    setFiles([]);
    setError(null);
    setShowStatus(false);
  };

  const refreshConversations = async () => {
    const res = await fetch("/api/ai-conversations");
    if (res.ok) setConversations(await res.json());
  };

  const startStatusCycle = () => {
    setStatusPhase(0); setShowStatus(true);
    let ph = 0;
    phaseTimer.current = setInterval(() => {
      ph++;
      if (ph >= STATUS_PHASES.length) { clearInterval(phaseTimer.current!); return; }
      setStatusPhase(ph);
    }, 4500);
  };

  const stopStatusCycle = () => {
    if (phaseTimer.current) clearInterval(phaseTimer.current);
    setShowStatus(false);
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isResponding) return;

    const userMsgId = crypto.randomUUID();
    const userMsg: AiMessage = { id: userMsgId, role: "user", content: text, createdAt: Date.now(), fileUrls: [] };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setFiles([]);
    setIsResponding(true);
    setError(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    startStatusCycle();

    const assistantId = crypto.randomUUID();
    let thoughtBuf = "";

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          conversationDbId: activeConvId,
          difyConversationId: difyConvId,
          fileUrls: [],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      stopStatusCycle();
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", createdAt: Date.now() }]);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const json = JSON.parse(raw);
            if (json.type === "conv_db_id" && !activeConvId) setActiveConvId(json.convDbId);
            if (json.type === "dify_conv_id") setDifyConvId(json.difyConvId);
            if (json.type === "chunk") setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + json.chunk } : m));
            if (json.type === "thought") { thoughtBuf += json.thought; setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, thought: thoughtBuf } : m)); }
            if (json.type === "done") await refreshConversations();
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      stopStatusCycle();
      setError(e instanceof Error ? e.message : "Unknown error");
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsResponding(false);
    }
  }, [input, isResponding, activeConvId, difyConvId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleRename = async (convId: string, title: string) => {
    await fetch(`/api/ai-conversations/${convId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, title } : c));
  };

  const handlePin = async (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;
    await fetch(`/api/ai-conversations/${convId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pinned: !conv.pinned }) });
    await refreshConversations();
  };

  const handleDelete = async (convId: string) => {
    await fetch(`/api/ai-conversations/${convId}`, { method: "DELETE" });
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConvId === convId) startNew();
    setDeleteModal(null);
  };

  const filtered = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
  const pinned = filtered.filter(c => c.pinned);
  const recent = filtered.filter(c => !c.pinned);

  const STARTERS = [
    { emoji: "🏷️", text: "Walk me through the Brand Partnership Blueprint" },
    { emoji: "📦", text: "How do I qualify a wholesale brand for Amazon?" },
    { emoji: "✉️", text: "Write me an outreach email to a new supplier" },
    { emoji: "📊", text: "What are the key steps in the Wholesale Masterclass?" },
  ];

  return (
    <>
      <style>{`
        @keyframes neon-idle { 0%,100%{box-shadow:0 0 6px 1px #3b82f620} 50%{box-shadow:0 0 12px 3px #3b82f635,0 0 24px 6px #8b5cf620} }
        @keyframes neon-pulse { 0%,100%{box-shadow:0 0 10px 3px #3b82f660,0 0 20px 6px #8b5cf640} 50%{box-shadow:0 0 24px 8px #3b82f690,0 0 48px 16px #8b5cf660} }
        .neon-idle { animation: neon-idle 3s ease-in-out infinite; }
        .neon-pulse { animation: neon-pulse 1.2s ease-in-out infinite; }
      `}</style>

      {deleteModal && <DeleteModal onConfirm={() => handleDelete(deleteModal)} onCancel={() => setDeleteModal(null)} />}

      <div className="flex" style={{ height: "calc(100vh - 0px)", maxHeight: "100dvh" }}>

        {/* ─── Sidebar ─── */}
        {sidebarOpen && (
          <aside className="flex w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
            {/* Logo + New Chat */}
            <div className="flex items-center gap-2 px-3 py-3 border-b border-[var(--border)]">
              <NeonLogo pulsing={isResponding} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[var(--foreground)] truncate">OperationAMZ</p>
                <p className="text-[10px] text-[var(--muted)] truncate">AI Navigator</p>
              </div>
              <button onClick={startNew} className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--accent-soft)] text-[var(--muted)] hover:text-[var(--foreground)] transition">
                <Plus size={13} />
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-[var(--border)]">
              {(["chats", "settings", "storage"] as const).map(tab => (
                <button key={tab} onClick={() => setSidebarTab(tab)}
                  className={`flex-1 py-2 text-[10px] font-medium capitalize transition ${sidebarTab === tab ? "text-blue-500 border-b-2 border-blue-500" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                  {tab === "chats" ? "Chats" : tab === "settings" ? <Settings size={11} className="mx-auto" /> : <HardDrive size={11} className="mx-auto" />}
                </button>
              ))}
            </div>

            {sidebarTab === "chats" && (
              <>
                {/* Search */}
                <div className="px-3 pt-2 pb-1">
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5">
                    <Search size={11} className="text-[var(--muted)] shrink-0" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats…"
                      className="flex-1 bg-transparent text-xs outline-none text-[var(--foreground)] placeholder:text-[var(--muted)]" />
                    {search && <button onClick={() => setSearch("")}><X size={10} className="text-[var(--muted)]" /></button>}
                  </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto px-2 py-1 flex flex-col gap-0.5">
                  {pinned.length > 0 && (
                    <>
                      <p className="px-3 py-1 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide">Pinned</p>
                      {pinned.map(c => <ConvItem key={c.id} conv={c} active={activeConvId === c.id}
                        onSelect={() => loadConversation(c.id)} onRename={t => handleRename(c.id, t)}
                        onPin={() => handlePin(c.id)} onDelete={() => setDeleteModal(c.id)} />)}
                    </>
                  )}
                  {recent.length > 0 && (
                    <>
                      <p className="px-3 py-1 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide">Recent</p>
                      {recent.map(c => <ConvItem key={c.id} conv={c} active={activeConvId === c.id}
                        onSelect={() => loadConversation(c.id)} onRename={t => handleRename(c.id, t)}
                        onPin={() => handlePin(c.id)} onDelete={() => setDeleteModal(c.id)} />)}
                    </>
                  )}
                  {filtered.length === 0 && (
                    <p className="px-3 py-4 text-xs text-[var(--muted)] text-center">
                      {conversations.length === 0 ? "No conversations yet. Start a new chat!" : "No results found."}
                    </p>
                  )}
                </div>

                <div className="border-t border-[var(--border)] px-3 py-2">
                  <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-red-500 transition">
                    <LogOut size={12} /> Sign out
                  </button>
                </div>
              </>
            )}

            {sidebarTab === "settings" && (
              <div className="flex-1 p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-[var(--foreground)]">Settings</p>
                <p className="text-[10px] text-[var(--muted)]">Conversation settings and preferences.</p>
                <div className="rounded-lg border border-[var(--border)] p-3">
                  <p className="text-[10px] font-medium text-[var(--foreground)]">Response style</p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">Detailed · Concise · Bullet points</p>
                </div>
              </div>
            )}

            {sidebarTab === "storage" && (
              <div className="flex-1 p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-[var(--foreground)]">Storage</p>
                <div className="rounded-lg border border-[var(--border)] p-3 flex flex-col gap-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[var(--muted)]">Conversations</span>
                    <span className="font-medium text-[var(--foreground)]">{conversations.length}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[var(--muted)]">Messages</span>
                    <span className="font-medium text-[var(--foreground)]">{messages.length}</span>
                  </div>
                </div>
                <button onClick={() => { conversations.forEach(c => setDeleteModal(c.id)); }}
                  className="text-[10px] text-red-500 hover:underline text-left">Clear all conversations</button>
              </div>
            )}
          </aside>
        )}

        {/* ─── Main chat area ─── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(o => !o)} className="p-1.5 rounded-lg hover:bg-[var(--accent-soft)] text-[var(--muted)]">
                <MessageSquare size={15} />
              </button>
              <div className="flex items-center gap-2">
                <NeonLogo pulsing={isResponding} />
                <div>
                  <h1 className="text-sm font-bold text-[var(--foreground)] leading-tight">AMZ Navigator</h1>
                  <p className="text-[10px] text-[var(--muted)]">{isResponding ? "Thinking…" : activeConvId ? "Conversation active" : "Your AI sourcing co-pilot"}</p>
                </div>
              </div>
            </div>
            <button onClick={startNew} className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)] transition">
              <Plus size={12} /> New chat
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-2xl px-4 py-6">
              {messages.length === 0 && !isResponding ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-3xl scale-150" />
                    <div className="relative h-24 w-24 rounded-2xl overflow-hidden border border-[var(--border)] shadow-2xl shadow-blue-500/30 bg-white neon-idle">
                      <Image src={LOGO} alt="OperationAMZ" width={96} height={96} className="w-24 h-24 object-cover" unoptimized />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--foreground)]">AMZ Navigator</h2>
                    <p className="mt-2 text-sm text-[var(--muted)] max-w-sm leading-relaxed">Your AI-powered co-pilot for Amazon wholesale sourcing, brand partnerships, and supplier outreach.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                    {STARTERS.map(s => (
                      <button key={s.text} onClick={() => { setInput(s.text); textareaRef.current?.focus(); }}
                        className="group flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left text-xs hover:border-blue-400/50 hover:bg-[var(--accent-soft)] transition-all">
                        <span className="text-base shrink-0">{s.emoji}</span>
                        <span className="text-[var(--muted)] group-hover:text-[var(--foreground)] transition leading-relaxed">{s.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {messages.map((msg, i) => (
                    <MessageBubble key={msg.id} msg={msg} isThinking={isResponding && i === messages.length - 1 && msg.role === "assistant"} />
                  ))}
                  {showStatus && isResponding && (
                    <div className="flex gap-3 items-start">
                      <AiAvatar pulsing />
                      <div className="flex-1">
                        <span className="text-[11px] font-semibold text-blue-400 px-1 mb-1 block">AMZ Navigator</span>
                        <StatusBar phase={statusPhase} />
                      </div>
                    </div>
                  )}
                  {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-500">{error}</div>}
                </div>
              )}
            </div>
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <div className="mx-auto max-w-2xl">
              {files.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {files.map((f, i) => (
                    <span key={i} className="flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-400">
                      <Paperclip size={9} /> {f.name}
                      <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}><X size={9} /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className={`flex items-end gap-2 rounded-2xl border bg-[var(--background)] px-3 py-2.5 transition-all ${isResponding ? "border-[var(--border)] opacity-70" : "border-[var(--border)] focus-within:border-blue-500/50 focus-within:shadow-[0_0_0_3px_rgb(59_130_246/0.08)]"}`}>
                <button onClick={() => fileInputRef.current?.click()} disabled={isResponding}
                  className="shrink-0 p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-soft)] transition">
                  <Paperclip size={14} />
                </button>
                <input ref={fileInputRef} type="file" multiple className="hidden"
                  onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files ?? [])])} />
                <textarea ref={textareaRef} value={input} onChange={e => { setInput(e.target.value); autoResize(); }}
                  onKeyDown={handleKeyDown}
                  placeholder={isResponding ? "AMZ Navigator is thinking…" : "Ask AMZ Navigator anything…"}
                  rows={1} disabled={isResponding}
                  className="flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none leading-relaxed"
                  style={{ maxHeight: 140 }} />
                <button onClick={send} disabled={!input.trim() || isResponding}
                  className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-xl transition-all ${input.trim() && !isResponding ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30 hover:from-blue-500 hover:to-blue-400" : "bg-[var(--accent-soft)] text-[var(--muted)] opacity-50"}`}>
                  <Send size={14} />
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-[var(--muted)]/50">
                OperationAMZ can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
